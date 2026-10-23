import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RawFIRMSFeature {
  latitude: number;
  longitude: number;
  bright_ti4?: number;
  bright_ti5?: number;
  scan?: number;
  track?: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  instrument?: string;
  confidence: string;
  version?: string;
  frp?: number;
  daynight?: 'D' | 'N';
}

function parseFIRMSCsv(csvText: string): RawFIRMSFeature[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const latIdx = headers.indexOf('latitude');
  const lonIdx = headers.indexOf('longitude');
  const bt4Idx = headers.indexOf('bright_ti4');
  const bt5Idx = headers.indexOf('bright_ti5');
  const scanIdx = headers.indexOf('scan');
  const trackIdx = headers.indexOf('track');
  const dateIdx = headers.indexOf('acq_date');
  const timeIdx = headers.indexOf('acq_time');
  const satIdx = headers.indexOf('satellite');
  const instIdx = headers.indexOf('instrument');
  const confIdx = headers.indexOf('confidence');
  const verIdx = headers.indexOf('version');
  const frpIdx = headers.indexOf('frp');
  const dnIdx = headers.indexOf('daynight');

  if (latIdx === -1 || lonIdx === -1) {
    return [];
  }

  const results: RawFIRMSFeature[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((c) => c.trim());
    if (row.length < headers.length) continue;

    const lat = parseFloat(row[latIdx]);
    const lon = parseFloat(row[lonIdx]);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      continue;
    }

    const feature: RawFIRMSFeature = {
      latitude: lat,
      longitude: lon,
      bright_ti4: bt4Idx !== -1 && row[bt4Idx] ? parseFloat(row[bt4Idx]) : undefined,
      bright_ti5: bt5Idx !== -1 && row[bt5Idx] ? parseFloat(row[bt5Idx]) : undefined,
      scan: scanIdx !== -1 && row[scanIdx] ? parseFloat(row[scanIdx]) : undefined,
      track: trackIdx !== -1 && row[trackIdx] ? parseFloat(row[trackIdx]) : undefined,
      acq_date: dateIdx !== -1 ? row[dateIdx] : new Date().toISOString().slice(0, 10),
      acq_time: timeIdx !== -1 ? row[timeIdx] : '0000',
      satellite: satIdx !== -1 ? row[satIdx] : 'N20',
      instrument: instIdx !== -1 ? row[instIdx] : 'VIIRS',
      confidence: confIdx !== -1 ? row[confIdx] : 'nominal',
      version: verIdx !== -1 ? row[verIdx] : undefined,
      frp: frpIdx !== -1 && row[frpIdx] ? parseFloat(row[frpIdx]) : undefined,
      daynight: dnIdx !== -1 && (row[dnIdx] === 'D' || row[dnIdx] === 'N') ? (row[dnIdx] as 'D' | 'N') : undefined,
    };

    results.push(feature);
  }

  return results;
}

async function startServer() {
  const app = express();

  // Parse port from CLI args (e.g., --port 3000, --port=3000) or default to 3000
  const args = process.argv.slice(2);
  let port = 3000;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      port = parseInt(args[i + 1], 10);
    } else if (args[i].startsWith('--port=')) {
      port = parseInt(args[i].split('=')[1], 10);
    }
  }

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && process.env.PORT && !args.some(a => a.includes('--port'))) {
    port = parseInt(process.env.PORT, 10);
  }

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- Gemini AI Incident Triage & Decision Support Assistant ---
  const rawGeminiKey = process.env.GEMINI_FREE_KEY || process.env.GEMINI_API_KEY;
  const geminiApiKey = rawGeminiKey ? rawGeminiKey.trim() : '';
  const isGeminiConfigured = Boolean(
    geminiApiKey && 
    geminiApiKey.length > 0 && 
    geminiApiKey !== 'MY_GEMINI_API_KEY' &&
    geminiApiKey !== 'MY_GEMINI_FREE_KEY'
  );

  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  const geminiClient = isGeminiConfigured
    ? new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // AI Configuration Status Check (safe: never leaks key to browser)
  app.get('/api/ai/status', (_req: Request, res: Response) => {
    res.json({
      configured: isGeminiConfigured,
      model: GEMINI_MODEL,
      provider: 'Google Gemini API (@google/genai)',
    });
  });

  // AI Incident Triage Endpoint
  app.post('/api/ai/triage', async (req: Request, res: Response) => {
    if (!isGeminiConfigured || !geminiClient) {
      res.status(503).json({
        success: false,
        status: 'unconfigured',
        message: 'Gemini API key is not configured in server environment. Configure GEMINI_FREE_KEY or GEMINI_API_KEY in server environment (Settings > Secrets) to enable live AI incident triage.',
        model: GEMINI_MODEL,
      });
      return;
    }

    const incidentData = req.body;
    if (!incidentData || typeof incidentData !== 'object') {
      res.status(400).json({
        success: false,
        status: 'error',
        message: 'Missing or malformed incident data in request body.',
      });
      return;
    }

    // Sanitize and limit the payload sent to the model (protect citizen privacy and avoid prompt injection)
    const sanitizedPayload = {
      incidentId: typeof incidentData.id === 'string' ? incidentData.id : 'Unassigned ID',
      title: typeof incidentData.title === 'string' ? incidentData.title.slice(0, 150) : 'Untitled Incident',
      description: typeof incidentData.description === 'string' ? incidentData.description.slice(0, 1000) : 'No description provided',
      reportedType: typeof incidentData.type === 'string' ? incidentData.type : 'Unspecified',
      reportedUrgency: typeof incidentData.urgency === 'string' ? incidentData.urgency : 'Unspecified',
      source: typeof incidentData.source === 'string' ? incidentData.source : 'Citizen Report',
      reporterRole: typeof incidentData.reporterRole === 'string' ? incidentData.reporterRole : 'citizen',
      reportedAt: typeof incidentData.timestamp === 'string' ? incidentData.timestamp : new Date().toISOString(),
      currentStatus: typeof incidentData.status === 'string' ? incidentData.status : 'pending',
      assignedTeam: typeof incidentData.assignedTeam === 'string' ? incidentData.assignedTeam : 'Unassigned',
      location: incidentData.location ? {
        address: typeof incidentData.location.address === 'string' ? incidentData.location.address.slice(0, 200) : 'Unknown address',
        district: 'Palghar',
        lat: typeof incidentData.location.lat === 'number' ? incidentData.location.lat : undefined,
        lng: typeof incidentData.location.lng === 'number' ? incidentData.location.lng : undefined,
      } : undefined,
      reliefDetails: incidentData.reliefDetails ? {
        peopleAssisted: incidentData.reliefDetails.peopleAssisted,
        responseDuration: incidentData.reliefDetails.responseDuration,
        reliefDistributed: incidentData.reliefDetails.reliefDistributed,
        shelterStatus: incidentData.reliefDetails.shelterStatus,
      } : undefined,
      externalTelemetry: incidentData.externalMeta ? {
        source: incidentData.externalMeta.source,
        sourceId: incidentData.externalMeta.sourceId,
        officialAlertLevel: incidentData.externalMeta.alertLevel,
        magnitude: incidentData.externalMeta.magnitude,
        fireRadiativePower: incidentData.externalMeta.fireRadiativePower,
      } : undefined,
    };

    const promptText = `Analyze the following disaster incident report for Palghar District / Maharashtra, India.
Generate an objective, evidence-based triage assessment to support human emergency authorities in decision-making:

${JSON.stringify(sanitizedPayload, null, 2)}`;

    try {
      const response = await geminiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: promptText,
        config: {
          systemInstruction: `You are the VajraGrid AI Incident Triage and Decision Support Assistant for disaster management in Palghar District and Maharashtra, India.
Your role is to analyze supplied incident information to assist emergency authorities with triage, priority recommendation, and operational decision-making.

CRITICAL CONSTRAINTS & DATA INTEGRITY:
1. Base your analysis STRICTLY on the facts provided in the request (incident description, location, reported urgency, timestamps, relief records, and external observations).
2. DO NOT invent, assume, or hallucinate casualty numbers, weather sensor readings, flood levels, wind speeds, or official warnings not present in the input.
3. DO NOT claim to predict or forecast earthquakes, flash floods, or cyclones. You only triage reported observations.
4. If essential details are missing (e.g. exact casualty count, water depth, road passability, powerline live status), list them explicitly in "missingInformation".
5. Note all limitations, unverified citizen claims, or single-source reports under "uncertainties".
6. "requiresHumanReview" must ALWAYS be true. This assessment is purely advisory for human authorities.
7. Return clean JSON adhering to the specified responseSchema.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              incidentSummary: {
                type: Type.STRING,
                description: 'A concise 2-3 sentence factual summary of the incident based exclusively on the provided report.',
              },
              hazardCategory: {
                type: Type.STRING,
                description: 'Suggested hazard category (e.g., Flood, Landslide, Infrastructure / Power, Coastal Surge, Fire, Medical, Supplies).',
              },
              recommendedPriority: {
                type: Type.STRING,
                description: 'Recommended triage priority: Low, Medium, High, or Critical.',
              },
              reasoning: {
                type: Type.STRING,
                description: 'Evidence-based justification explaining why this priority level was recommended.',
              },
              evidenceUsed: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Specific facts supplied in the incident record that justify the recommendation.',
              },
              missingInformation: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Key operational information currently missing that authorities must confirm before full deployment.',
              },
              recommendedActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Practical next steps and general emergency procedures for authority consideration.',
              },
              uncertainties: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Known assumptions, conflicting reports, or unverified citizen claims.',
              },
              requiresHumanReview: {
                type: Type.BOOLEAN,
                description: 'Must always be true.',
              },
            },
            required: [
              'incidentSummary',
              'hazardCategory',
              'recommendedPriority',
              'reasoning',
              'evidenceUsed',
              'missingInformation',
              'recommendedActions',
              'uncertainties',
              'requiresHumanReview',
            ],
          },
        },
      });

      const responseText = response.text?.trim() || '{}';
      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('[Gemini Triage JSON Parse Error]:', responseText);
        res.status(502).json({
          success: false,
          status: 'error',
          message: 'Model returned malformed or non-JSON output.',
          model: GEMINI_MODEL,
        });
        return;
      }

      // Validate required fields
      const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
      const rawPriority = String(parsed.recommendedPriority || '');
      const normalizedPriority = validPriorities.find(
        (p) => p.toLowerCase() === rawPriority.toLowerCase()
      ) || 'Medium';

      const validatedAnalysis = {
        incidentSummary:
          typeof parsed.incidentSummary === 'string' && parsed.incidentSummary.trim().length > 0
            ? parsed.incidentSummary.trim()
            : 'Summary unavailable.',
        hazardCategory:
          typeof parsed.hazardCategory === 'string' && parsed.hazardCategory.trim().length > 0
            ? parsed.hazardCategory.trim()
            : (incidentData.type || 'General'),
        recommendedPriority: normalizedPriority as 'Low' | 'Medium' | 'High' | 'Critical',
        reasoning:
          typeof parsed.reasoning === 'string' && parsed.reasoning.trim().length > 0
            ? parsed.reasoning.trim()
            : 'Evidence-based justification unavailable.',
        evidenceUsed: Array.isArray(parsed.evidenceUsed)
          ? parsed.evidenceUsed.filter((e: any) => typeof e === 'string' && e.trim().length > 0)
          : [],
        missingInformation: Array.isArray(parsed.missingInformation)
          ? parsed.missingInformation.filter((m: any) => typeof m === 'string' && m.trim().length > 0)
          : [],
        recommendedActions: Array.isArray(parsed.recommendedActions)
          ? parsed.recommendedActions.filter((a: any) => typeof a === 'string' && a.trim().length > 0)
          : [],
        uncertainties: Array.isArray(parsed.uncertainties)
          ? parsed.uncertainties.filter((u: any) => typeof u === 'string' && u.trim().length > 0)
          : [],
        requiresHumanReview: true,
        analyzedAt: new Date().toISOString(),
        modelUsed: GEMINI_MODEL,
      };

      res.json({
        success: true,
        status: 'success',
        analysis: validatedAnalysis,
      });
    } catch (err: any) {
      console.error('[Gemini Triage Error]:', err?.message || err);
      res.status(500).json({
        success: false,
        status: 'error',
        message: err?.message || 'Failed to complete AI incident triage analysis.',
        model: GEMINI_MODEL,
      });
    }
  });

  // FIRMS Credential and Status Check endpoint (does not leak key to client)
  app.get('/api/firms/status', (_req: Request, res: Response) => {
    const mapKey = process.env.NASA_MAP_KEY || process.env.FIRMS_MAP_KEY;
    const isConfigured = Boolean(mapKey && mapKey.trim().length > 0 && mapKey.trim() !== 'MY_NASA_MAP_KEY');

    res.json({
      configured: isConfigured,
      source: 'NASA FIRMS (Fire Information for Resource Management System)',
      defaultSensor: 'VIIRS_NOAA20_NRT',
      supportedSensors: ['VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT', 'VIIRS_SNPP_NRT', 'MODIS_NRT'],
      registrationUrl: 'https://firms.modaps.eosdis.nasa.gov/api/map_key/',
    });
  });

  // Secure Server-Side Proxy for NASA FIRMS Fire Detections
  app.get('/api/firms/hotspots', async (req: Request, res: Response) => {
    const mapKey = process.env.NASA_MAP_KEY || process.env.FIRMS_MAP_KEY;
    const isConfigured = Boolean(mapKey && mapKey.trim().length > 0 && mapKey.trim() !== 'MY_NASA_MAP_KEY');

    if (!isConfigured) {
      res.json({
        status: 'unconfigured',
        message:
          'NASA MAP_KEY is not configured in server environment. Set NASA_MAP_KEY or FIRMS_MAP_KEY in server environment to enable live satellite feeds.',
        registrationUrl: 'https://firms.modaps.eosdis.nasa.gov/api/map_key/',
        events: [],
      });
      return;
    }

    const sensor = typeof req.query.sensor === 'string' ? req.query.sensor : 'VIIRS_NOAA20_NRT';
    const extent = typeof req.query.extent === 'string' ? req.query.extent : '72.0,18.0,74.5,21.0';
    const days = typeof req.query.days === 'string' ? req.query.days : '1';

    // Validate sensor parameter against allowed list
    const allowedSensors = ['VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT', 'VIIRS_SNPP_NRT', 'MODIS_NRT'];
    if (!allowedSensors.includes(sensor)) {
      res.status(400).json({ error: `Invalid sensor: ${sensor}. Allowed: ${allowedSensors.join(', ')}` });
      return;
    }

    // Determine target URL based on extent type (Country code vs Bounding Box vs World)
    let firmsUrl = '';
    const cleanKey = mapKey!.trim();
    if (/^[A-Z]{3}$/.test(extent)) {
      // ISO3 country code (e.g. IND)
      firmsUrl = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${cleanKey}/${sensor}/${extent}/${days}`;
    } else {
      // Area coordinates (west,south,east,north or 'world')
      firmsUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${cleanKey}/${sensor}/${extent}/${days}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(firmsUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'text/csv, text/plain',
          'User-Agent': 'VajraGrid-Disaster-Intelligence-Platform/1.0',
        },
      });

      clearTimeout(timeout);

      const responseText = await response.text();

      // Check if NASA returned an error response
      if (
        !response.ok ||
        responseText.startsWith('Invalid MAP_KEY') ||
        responseText.startsWith('Error:') ||
        responseText.includes('No data available') === false && responseText.includes('latitude') === false
      ) {
        const errorMsg = responseText.trim().slice(0, 200) || `NASA FIRMS HTTP ${response.status}`;
        res.json({
          status: 'error',
          error: errorMsg,
          sensor,
          extent,
          events: [],
        });
        return;
      }

      const features = parseFIRMSCsv(responseText);
      const retrievedAt = new Date().toISOString();

      res.json({
        status: 'live',
        retrievedAt,
        sensor,
        extent,
        count: features.length,
        events: features,
      });
    } catch (err: any) {
      clearTimeout(timeout);
      const isTimeout = err?.name === 'AbortError';
      res.json({
        status: 'offline',
        error: isTimeout ? 'NASA FIRMS API request timed out (12s)' : err?.message || 'Connection failure to NASA FIRMS',
        sensor,
        extent,
        events: [],
      });
    }
  });

  // Server-Side Proxy for GDACS (Global Disaster Alert and Coordination System)
  app.get('/api/gdacs/events', async (req: Request, res: Response) => {
    const rawType = typeof req.query.eventtype === 'string' ? req.query.eventtype.toUpperCase() : 'ALL';
    const targetTypes = rawType === 'ALL' ? ['FL', 'TC'] : [rawType];

    const fetchSingleType = async (type: string) => {
      const url = `https://www.gdacs.org/gdacsapi/api/Events/geteventlist/map?eventtype=${type}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const resp = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json, text/plain',
            'User-Agent': 'VajraGrid-Disaster-Intelligence-Platform/1.0',
          },
        });
        clearTimeout(timeout);
        const text = await resp.text();
        if (!resp.ok || !text.trim().startsWith('{')) {
          return { type, error: text.slice(0, 150) || `HTTP ${resp.status}`, features: [] };
        }
        const json = JSON.parse(text);
        return { type, features: Array.isArray(json.features) ? json.features : [] };
      } catch (err: any) {
        clearTimeout(timeout);
        return { type, error: err?.name === 'AbortError' ? 'Timeout (10s)' : err?.message || 'Network error', features: [] };
      }
    };

    try {
      const combinedFeatures: any[] = [];
      const errors: string[] = [];

      for (const t of targetTypes) {
        const r = await fetchSingleType(t);
        if (r.features && r.features.length > 0) {
          combinedFeatures.push(...r.features);
        }
        if (r.error) {
          errors.push(`${r.type}: ${r.error}`);
        }
      }

      res.json({
        status: combinedFeatures.length > 0 ? 'live' : errors.length > 0 ? 'offline' : 'live',
        retrievedAt: new Date().toISOString(),
        eventtype: rawType,
        count: combinedFeatures.length,
        errors: errors.length > 0 ? errors : undefined,
        type: 'FeatureCollection',
        features: combinedFeatures,
      });
    } catch (err: any) {
      res.json({
        status: 'offline',
        retrievedAt: new Date().toISOString(),
        error: err?.message || 'Failed to fetch GDACS feed',
        features: [],
      });
    }
  });

  // Mount Vite middleware in development mode
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[VajraGrid Server] Running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[VajraGrid Server] Startup error:', err);
  process.exit(1);
});
