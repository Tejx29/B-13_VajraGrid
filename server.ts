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

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // JSON error handling middleware to ensure API requests always return JSON, never HTML
  app.use((err: any, _req: Request, res: Response, next: any) => {
    if (err) {
      if (err.type === 'entity.too.large' || err.status === 413) {
        return res.status(413).json({
          success: false,
          status: 'error',
          message: 'Attached media or request payload exceeds server size limit (50MB).',
        });
      }
      if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({
          success: false,
          status: 'error',
          message: 'Malformed JSON payload in request body.',
        });
      }
      return res.status(500).json({
        success: false,
        status: 'error',
        message: err.message || 'Server error while parsing request body.',
      });
    }
    next();
  });

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
          timeout: 10000,
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // Helper for bounded timeout execution to prevent unhandled DEADLINE_EXCEEDED hangs
  function callWithTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
    let timer: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const err: any = new Error(`${operationName} deadline exceeded (${timeoutMs}ms). DEADLINE_EXCEEDED`);
        err.code = 'DEADLINE_EXCEEDED';
        err.status = 504;
        reject(err);
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      if (timer) clearTimeout(timer);
    });
  }

  // Detects 504, timeout, or DEADLINE_EXCEEDED errors from Google SDK, proxy, or server timer
  function isDeadlineOrTimeoutError(err: any): boolean {
    const msg = String(err?.message || '').toLowerCase();
    const status = err?.status || err?.statusCode || err?.code;
    return (
      status === 504 ||
      status === '504' ||
      status === 408 ||
      err?.code === 'DEADLINE_EXCEEDED' ||
      msg.includes('deadline_exceeded') ||
      msg.includes('deadline expired') ||
      msg.includes('504') ||
      msg.includes('timeout') ||
      msg.includes('timed out') ||
      msg.includes('abort') ||
      err?.name === 'AbortError'
    );
  }

  // AI Configuration Status Check (safe: never leaks key to browser)
  app.get('/api/ai/status', (_req: Request, res: Response) => {
    res.json({
      configured: isGeminiConfigured,
      model: GEMINI_MODEL,
      provider: 'Google Gemini API (@google/genai)',
    });
  });

  // AI Incident Triage Endpoint (Supports Bounded Multimodal Field Imagery & Text Fallback)
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

    // Inspect and extract valid image attachments with bounded payload policy
    const validImageParts: Array<{ inlineData: { mimeType: string; data: string }; sizeBytes: number }> = [];
    const imageNotes: string[] = [];
    let omittedImagesCount = 0;

    if (Array.isArray(incidentData.mediaUrls) && incidentData.mediaUrls.length > 0) {
      for (let i = 0; i < incidentData.mediaUrls.length; i++) {
        const mediaUrl = incidentData.mediaUrls[i];
        if (typeof mediaUrl === 'string' && mediaUrl.trim().length > 0) {
          const match = mediaUrl.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/is);
          if (match) {
            const rawMime = match[1].toLowerCase();
            const normalizedMime = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
            const base64Data = match[3].replace(/\s+/g, '');
            const approxBytes = Math.round((base64Data.length * 3) / 4);

            // Bounded payload policy:
            // Send primary image up to 4MB base64 (~3MB binary) to avoid network latency & DEADLINE_EXCEEDED.
            if (validImageParts.length === 0) {
              if (base64Data.length > 0 && base64Data.length <= 4 * 1024 * 1024) {
                validImageParts.push({
                  inlineData: {
                    mimeType: normalizedMime,
                    data: base64Data,
                  },
                  sizeBytes: approxBytes,
                });
              } else if (base64Data.length > 4 * 1024 * 1024) {
                imageNotes.push(`Primary field photo exceeds 3MB visual analysis threshold (${(approxBytes / (1024 * 1024)).toFixed(1)}MB); visual triage bypassed to avoid request deadline expiration.`);
              }
            } else {
              omittedImagesCount++;
            }
          } else {
            imageNotes.push(`Attachment #${i + 1} has unsupported format or URL structure; omitted from AI prompt.`);
          }
        }
      }

      if (omittedImagesCount > 0) {
        imageNotes.push(`Primary field photograph selected; ${omittedImagesCount} additional photo attachment(s) omitted to optimize latency.`);
      }
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
      fieldPhotographsAttached: validImageParts.length,
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

    const promptText = `Analyze the following disaster incident report for Palghar District / Maharashtra, India${validImageParts.length > 0 ? ', including the attached field photograph' : ''}.
Generate an objective, evidence-based triage assessment to support human emergency authorities in decision-making:

${JSON.stringify(sanitizedPayload, null, 2)}`;

    const triageSchema = {
      type: Type.OBJECT,
      properties: {
        incidentSummary: {
          type: Type.STRING,
          description: 'A concise 2-3 sentence factual summary of the incident based exclusively on the provided report and visible imagery.',
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
          description: 'Evidence-based justification explaining why this priority level was recommended, referencing both text facts and observable photographic features if present.',
        },
        evidenceUsed: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Specific facts and visual features supplied in the incident record that justify the recommendation.',
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
          description: 'Known assumptions, conflicting reports, unverified citizen claims, or visual limitations.',
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
    };

    const triageConfig = {
      systemInstruction: `You are the VajraGrid AI Incident Triage and Decision Support Assistant for disaster management in Palghar District and Maharashtra, India.
Your role is to analyze supplied incident information${validImageParts.length > 0 ? ' and field photograph' : ''} to assist emergency authorities with triage, priority recommendation, and operational decision-making.

CRITICAL CONSTRAINTS & DATA INTEGRITY:
1. Base your analysis STRICTLY on the facts provided in the request (incident description, location, reported urgency, timestamps, relief records, external observations, and physical evidence visible in attached field photograph).
2. When analyzing field photos, observe physical reality: water depth relative to vehicles/buildings, structural damage, downed wires, smoke, or fire. DO NOT invent casualty numbers, unobserved victims, or speculate beyond visual evidence.
3. DO NOT invent, assume, or hallucinate casualty numbers, weather sensor readings, flood levels, wind speeds, or official warnings not present in the input.
4. DO NOT claim to predict or forecast earthquakes, flash floods, or cyclones. You only triage reported observations.
5. If essential details are missing (e.g. exact casualty count, water depth, road passability, powerline live status), list them explicitly in "missingInformation".
6. Note all limitations, unverified citizen claims, or single-source reports under "uncertainties".
7. "requiresHumanReview" must ALWAYS be true. This assessment is purely advisory for human authorities.
8. Return clean JSON adhering to the specified responseSchema.`,
      responseMimeType: 'application/json',
      responseSchema: triageSchema,
    };

    try {
      let response: any = null;
      let multimodalSuccess = false;
      let fallbackUsed = false;
      let fallbackReason = '';

      // 1. If images are attached, attempt bounded multimodal analysis (9s timeout)
      if (validImageParts.length > 0) {
        const multimodalStart = Date.now();
        try {
          response = await callWithTimeout(
            geminiClient.models.generateContent({
              model: GEMINI_MODEL,
              contents: {
                parts: [
                  ...validImageParts.map((p) => ({ inlineData: p.inlineData })),
                  { text: promptText },
                ],
              },
              config: triageConfig,
            }),
            9000,
            'Gemini Multimodal Triage'
          );
          multimodalSuccess = true;
        } catch (multimodalErr: any) {
          const elapsed = Date.now() - multimodalStart;
          const isTimeout = isDeadlineOrTimeoutError(multimodalErr);
          console.warn(
            `[Gemini Triage Multimodal Fallback]: Multimodal visual analysis failed after ${elapsed}ms (Timeout/Deadline: ${isTimeout}, Error: ${multimodalErr?.message || multimodalErr}). Initiating single bounded text-only triage fallback.`
          );

          fallbackUsed = true;
          fallbackReason = isTimeout ? 'multimodal_timeout' : 'multimodal_error';

          if (isTimeout) {
            imageNotes.push('Field photograph visual analysis timed out (DEADLINE_EXCEEDED); assessment based strictly on reported written facts and incident telemetry.');
          } else {
            imageNotes.push(`Field photograph visual analysis fell back to text evaluation (${multimodalErr?.message ? String(multimodalErr.message).slice(0, 100) : 'processing limit'}).`);
          }
        }
      }

      // 2. Exactly one bounded text-only triage fallback if multimodal failed or no valid images (9s timeout)
      if (!response) {
        const textPrompt = `Analyze the following disaster incident report for Palghar District / Maharashtra, India.
${validImageParts.length > 0 ? 'NOTE: Attached field photograph visual analysis timed out / is unavailable. Ground this triage assessment STRICTLY on the reported written description, location, urgency, and external telemetry.' : ''}
Generate an objective, evidence-based triage assessment to support human emergency authorities in decision-making:

${JSON.stringify(sanitizedPayload, null, 2)}`;

        const textTriageConfig = {
          ...triageConfig,
          systemInstruction: `You are the VajraGrid AI Incident Triage and Decision Support Assistant for disaster management in Palghar District and Maharashtra, India.
Your role is to analyze supplied incident information to assist emergency authorities with triage, priority recommendation, and operational decision-making.

CRITICAL CONSTRAINTS & DATA INTEGRITY:
1. Base your analysis STRICTLY on the text facts provided in the request (incident description, location, reported urgency, timestamps, relief records, and external observations).
2. DO NOT assume, guess, or hallucinate visual features since photograph analysis is unavailable.
3. DO NOT invent, assume, or hallucinate casualty numbers, weather sensor readings, flood levels, wind speeds, or official warnings not present in the input.
4. DO NOT claim to predict or forecast earthquakes, flash floods, or cyclones. You only triage reported observations.
5. If essential details are missing (e.g. exact casualty count, water depth, road passability, powerline live status), list them explicitly in "missingInformation".
6. Note all limitations, unverified citizen claims, or single-source reports under "uncertainties".
7. "requiresHumanReview" must ALWAYS be true. This assessment is purely advisory for human authorities.
8. Return clean JSON adhering to the specified responseSchema.`,
        };

        try {
          response = await callWithTimeout(
            geminiClient.models.generateContent({
              model: GEMINI_MODEL,
              contents: textPrompt,
              config: textTriageConfig,
            }),
            9000,
            'Gemini Text Triage Fallback'
          );
        } catch (textErr: any) {
          console.error('[Gemini Text Triage Fallback Error]:', textErr?.message || textErr);
          const isTimeout = isDeadlineOrTimeoutError(textErr);
          res.status(isTimeout ? 504 : 500).json({
            success: false,
            status: 'error',
            code: isTimeout ? 'DEADLINE_EXCEEDED' : 'TRIAGE_FAILED',
            message: isTimeout
              ? 'Gemini AI incident triage timed out (DEADLINE_EXCEEDED). Both multimodal and text triage exceeded the time limit. Please retry.'
              : (textErr?.message || 'Failed to complete AI incident triage analysis.'),
            model: GEMINI_MODEL,
          });
          return;
        }
      }

      const responseText = (response?.text || '').trim();
      let parsed: any;
      try {
        const cleanedText = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
        parsed = JSON.parse(cleanedText || '{}');
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

      const combinedUncertainties = [
        ...(Array.isArray(parsed.uncertainties) ? parsed.uncertainties.filter((u: any) => typeof u === 'string' && u.trim().length > 0) : []),
        ...imageNotes,
      ];

      const combinedMissingInfo = [
        ...(Array.isArray(parsed.missingInformation) ? parsed.missingInformation.filter((m: any) => typeof m === 'string' && m.trim().length > 0) : []),
      ];

      if (fallbackUsed && validImageParts.length > 0) {
        combinedMissingInfo.push('Visual confirmation of field photo details (automated image analysis timed out; requires manual review by human authority).');
      }

      const fallbackNote = fallbackUsed && validImageParts.length > 0
        ? (fallbackReason === 'multimodal_timeout'
            ? 'Field photograph visual processing timed out (DEADLINE_EXCEEDED). Triage successfully completed using text description and incident telemetry.'
            : 'Field photograph visual processing fell back to text evaluation. Triage successfully completed using text description and incident telemetry.')
        : undefined;

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
        missingInformation: combinedMissingInfo,
        recommendedActions: Array.isArray(parsed.recommendedActions)
          ? parsed.recommendedActions.filter((a: any) => typeof a === 'string' && a.trim().length > 0)
          : [],
        uncertainties: combinedUncertainties,
        requiresHumanReview: true,
        analyzedAt: new Date().toISOString(),
        modelUsed: GEMINI_MODEL,
        hasVisualEvidence: multimodalSuccess,
        imageFallbackNote: fallbackNote,
      };

      res.json({
        success: true,
        status: 'success',
        fallbackUsed,
        fallbackReason: fallbackReason || undefined,
        analysis: validatedAnalysis,
      });
    } catch (err: any) {
      console.error('[Gemini Triage Error]:', err?.message || err);
      const isTimeout = isDeadlineOrTimeoutError(err);
      res.status(isTimeout ? 504 : 500).json({
        success: false,
        status: 'error',
        code: isTimeout ? 'DEADLINE_EXCEEDED' : 'TRIAGE_FAILED',
        message: isTimeout
          ? 'Gemini AI incident triage timed out (DEADLINE_EXCEEDED). Please retry.'
          : (err?.message || 'Failed to complete AI incident triage analysis.'),
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

  // =========================================================================
  // --- Geoapify Address Autocomplete & Reverse Geocoding Proxy ---
  // =========================================================================

  // Geocoding Credential & Status Check endpoint (does not leak key to client)
  app.get('/api/geocoding/status', (_req: Request, res: Response) => {
    const rawGeoapifyKey = process.env.GEOAPIFY_API_KEY;
    const geoapifyKey = rawGeoapifyKey ? rawGeoapifyKey.trim() : '';
    const isConfigured = Boolean(
      geoapifyKey &&
      geoapifyKey.length > 0 &&
      geoapifyKey !== 'MY_GEOAPIFY_API_KEY' &&
      geoapifyKey !== 'your_geoapify_api_key_here'
    );

    res.json({
      provider: 'geoapify',
      configured: isConfigured,
      supportsAutocomplete: true,
      source: 'Geoapify Address Autocomplete API',
      message: isConfigured
        ? 'Geoapify API key configured and active on server.'
        : 'GEOAPIFY_API_KEY is not configured in server environment. Configure GEOAPIFY_API_KEY in AI Studio secrets to enable live address autocomplete.',
    });
  });

  // Secure Server-Side Proxy for Geoapify Autocomplete
  app.get('/api/geocoding/autocomplete', async (req: Request, res: Response) => {
    const rawGeoapifyKey = process.env.GEOAPIFY_API_KEY;
    const geoapifyKey = rawGeoapifyKey ? rawGeoapifyKey.trim() : '';
    const isConfigured = Boolean(
      geoapifyKey &&
      geoapifyKey.length > 0 &&
      geoapifyKey !== 'MY_GEOAPIFY_API_KEY' &&
      geoapifyKey !== 'your_geoapify_api_key_here'
    );

    if (!isConfigured) {
      res.status(503).json({
        success: false,
        status: 'unconfigured',
        error: 'GEOAPIFY_API_KEY is not configured in server environment.',
        message: 'GEOAPIFY_API_KEY is not configured on the server. Configure GEOAPIFY_API_KEY in AI Studio secrets to enable live address autocomplete.',
        features: [],
        results: [],
      });
      return;
    }

    const text = typeof req.query.text === 'string' ? req.query.text.trim() : '';
    if (!text) {
      res.json({ type: 'FeatureCollection', features: [], results: [] });
      return;
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 8, 1), 20);
    const lang = typeof req.query.lang === 'string' ? req.query.lang.trim() : 'en';

    const params = new URLSearchParams({
      text,
      apiKey: geoapifyKey,
      lang,
      limit: String(limit),
      format: 'geojson',
    });

    // Geographic filtering: bbox (rect:minLon,minLat,maxLon,maxLat) or countrycode
    if (typeof req.query.bbox === 'string' && req.query.bbox.trim()) {
      params.append('filter', `rect:${req.query.bbox.trim()}`);
    } else if (typeof req.query.country === 'string' && req.query.country.trim()) {
      params.append('filter', `countrycode:${req.query.country.trim().toLowerCase()}`);
    }

    // Geographic bias: proximity (proximity:lon,lat) or countrycode
    if (typeof req.query.proximity === 'string' && req.query.proximity.trim()) {
      params.append('bias', `proximity:${req.query.proximity.trim()}`);
    } else if (typeof req.query.biasCountry === 'string' && req.query.biasCountry.trim()) {
      params.append('bias', `countrycode:${req.query.biasCountry.trim().toLowerCase()}`);
    }

    const targetUrl = `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const upstreamRes = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VajraGrid-DisasterResponseSystem/2.0',
        },
      });
      clearTimeout(timeout);

      const data = await upstreamRes.json();
      if (!upstreamRes.ok) {
        res.status(upstreamRes.status).json({
          success: false,
          status: 'error',
          error: data.message || `Geoapify responded with HTTP ${upstreamRes.status}`,
          message: data.message || `Geoapify error (${upstreamRes.status})`,
          features: [],
        });
        return;
      }

      res.json(data);
    } catch (err: any) {
      clearTimeout(timeout);
      const isTimeout = err?.name === 'AbortError';
      res.status(504).json({
        success: false,
        status: 'timeout',
        error: isTimeout ? 'Geoapify autocomplete request timed out (8s)' : err?.message || 'Failed to reach Geoapify autocomplete endpoint',
        features: [],
      });
    }
  });

  // Secure Server-Side Proxy for Geoapify Reverse Geocoding
  app.get('/api/geocoding/reverse', async (req: Request, res: Response) => {
    const rawGeoapifyKey = process.env.GEOAPIFY_API_KEY;
    const geoapifyKey = rawGeoapifyKey ? rawGeoapifyKey.trim() : '';
    const isConfigured = Boolean(
      geoapifyKey &&
      geoapifyKey.length > 0 &&
      geoapifyKey !== 'MY_GEOAPIFY_API_KEY' &&
      geoapifyKey !== 'your_geoapify_api_key_here'
    );

    if (!isConfigured) {
      res.status(503).json({
        success: false,
        status: 'unconfigured',
        error: 'GEOAPIFY_API_KEY is not configured in server environment.',
      });
      return;
    }

    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    if (isNaN(lat) || isNaN(lon)) {
      res.status(400).json({ error: 'Valid lat and lon parameters required' });
      return;
    }

    const targetUrl = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${geoapifyKey}&format=geojson`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const upstreamRes = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VajraGrid-DisasterResponseSystem/2.0',
        },
      });
      clearTimeout(timeout);

      const data = await upstreamRes.json();
      if (!upstreamRes.ok) {
        res.status(upstreamRes.status).json(data);
        return;
      }

      res.json(data);
    } catch (err: any) {
      clearTimeout(timeout);
      res.status(500).json({ error: err?.message || 'Failed to reverse geocode' });
    }
  });

  // =========================================================================
  // --- Live Weather & Meteorological Early Warning (Open-Meteo & IMD) ---
  // =========================================================================

  const MAHARASHTRA_SUPPORTED_DISTRICTS = [
    {
      id: 'palghar_district',
      name: 'Palghar District',
      state: 'Maharashtra',
      division: 'Konkan Division',
      representativePointName: 'Palghar Collectorate & HQ',
      lat: 19.6967,
      lng: 72.7699,
      imdDistrictName: 'palghar',
      areaSqKm: 5344,
      description: 'Northern coastal Konkan district; Surya & Vaitarna river basins, extensive coastline & tribal watersheds',
      subDistricts: ['Palghar', 'Dahanu', 'Vasai', 'Wada', 'Jawhar', 'Mokhada', 'Talasari', 'Vikramgad'],
    },
    {
      id: 'thane_district',
      name: 'Thane District',
      state: 'Maharashtra',
      division: 'Konkan Division',
      representativePointName: 'Thane Collectorate / Court Naka',
      lat: 19.1860,
      lng: 72.9759,
      imdDistrictName: 'thane',
      areaSqKm: 4214,
      description: 'Urban-industrial corridor district, Ulhas river basin and Sanjay Gandhi National Park boundary',
      subDistricts: ['Thane', 'Kalyan', 'Murbad', 'Bhiwandi', 'Shahapur', 'Ulhasnagar', 'Ambarnath'],
    },
    {
      id: 'mumbai_suburban_district',
      name: 'Mumbai Suburban District',
      state: 'Maharashtra',
      division: 'Konkan Division',
      representativePointName: 'Bandra East Administrative HQ',
      lat: 19.0600,
      lng: 72.8530,
      imdDistrictName: 'mumbai suburban',
      areaSqKm: 446,
      description: 'High-density coastal metropolis; Mithi river catchment and western coastal creek network',
      subDistricts: ['Kurla', 'Andheri', 'Borivali'],
    },
    {
      id: 'raigad_district',
      name: 'Raigad District',
      state: 'Maharashtra',
      division: 'Konkan Division',
      representativePointName: 'Alibag District Collectorate',
      lat: 18.6414,
      lng: 72.8722,
      imdDistrictName: 'raigad',
      areaSqKm: 7152,
      description: 'Coastal Konkan district with rugged Western Ghats escarpments; Amba & Savitri river basins',
      subDistricts: ['Alibag', 'Pen', 'Panvel', 'Roha', 'Mahad', 'Mangaon', 'Karjat', 'Murud'],
    },
    {
      id: 'ratnagiri_district',
      name: 'Ratnagiri District',
      state: 'Maharashtra',
      division: 'Konkan Division',
      representativePointName: 'Ratnagiri Town District HQ',
      lat: 16.9902,
      lng: 73.3120,
      imdDistrictName: 'ratnagiri',
      areaSqKm: 8208,
      description: 'High monsoonal precipitation coastal district; Vashishti & Shastri river basins and ghat passes',
      subDistricts: ['Ratnagiri', 'Chiplun', 'Khed', 'Guhagar', 'Dapoli', 'Rajapur', 'Lanja', 'Sangameshwar', 'Mandangad'],
    },
    {
      id: 'sindhudurg_district',
      name: 'Sindhudurg District',
      state: 'Maharashtra',
      division: 'Konkan Division',
      representativePointName: 'Oros Administrative Center',
      lat: 16.1130,
      lng: 73.7042,
      imdDistrictName: 'sindhudurg',
      areaSqKm: 5207,
      description: 'Southern Konkan coastal district bordering Goa; Tillari & Karli river catchment zones',
      subDistricts: ['Kudal', 'Sawantwadi', 'Malvan', 'Vengurla', 'Kankavli', 'Devgad', 'Vaibhavwadi', 'Dodamarg'],
    },
    {
      id: 'nashik_district',
      name: 'Nashik District',
      state: 'Maharashtra',
      division: 'Nashik Division',
      representativePointName: 'Nashik District Collectorate',
      lat: 19.9975,
      lng: 73.7898,
      imdDistrictName: 'nashik',
      areaSqKm: 15530,
      description: 'Northern Maharashtra highland plateau and Western Ghats origin; Godavari river headwaters',
      subDistricts: ['Nashik', 'Trimbakeshwar', 'Igatpuri', 'Dindori', 'Sinnar', 'Niphad', 'Malegaon', 'Kalwan'],
    },
    {
      id: 'pune_district',
      name: 'Pune District',
      state: 'Maharashtra',
      division: 'Pune Division',
      representativePointName: 'Pune Collectorate / Central Building',
      lat: 18.5204,
      lng: 73.8567,
      imdDistrictName: 'pune',
      areaSqKm: 15643,
      description: 'Western Ghats rain-shadow transition district; Mutha-Mula, Bhima & Nira river systems',
      subDistricts: ['Pune City', 'Haveli', 'Maval', 'Mulshi', 'Bhor', 'Velhe', 'Khed', 'Junnar', 'Ambegaon', 'Shirur', 'Daund', 'Indapur', 'Baramati'],
    },
  ];

  // Supporting local detail for Palghar taluka stations (kept as contextual sub-district detail)
  const PALGHAR_TALUKA_STATIONS = [
    { id: 'palghar_hq', name: 'Palghar HQ', taluka: 'Palghar', lat: 19.6967, lng: 72.7699 },
    { id: 'dahanu_coastal', name: 'Dahanu Coastal', taluka: 'Dahanu', lat: 19.9715, lng: 72.7303 },
    { id: 'vasai_virar', name: 'Vasai-Virar', taluka: 'Vasai', lat: 19.4674, lng: 72.8080 },
    { id: 'boisar_midc', name: 'Boisar MIDC', taluka: 'Palghar', lat: 19.8016, lng: 72.7538 },
    { id: 'manor_basin', name: 'Manor (Surya Basin)', taluka: 'Palghar', lat: 19.7420, lng: 72.9080 },
    { id: 'jawhar_ghat', name: 'Jawhar Hill Sector', taluka: 'Jawhar', lat: 19.9215, lng: 73.2310 },
    { id: 'talasari_border', name: 'Talasari Northern', taluka: 'Talasari', lat: 20.1250, lng: 72.9230 },
    { id: 'wada_basin', name: 'Wada Industrial', taluka: 'Wada', lat: 19.6548, lng: 73.1384 },
    { id: 'vikramgad_basin', name: 'Vikramgad Basin', taluka: 'Vikramgad', lat: 19.7997, lng: 73.0955 },
    { id: 'mokhada_tribal', name: 'Mokhada Tribal', taluka: 'Mokhada', lat: 19.9360, lng: 73.3400 },
  ];

  interface WeatherCacheEntry {
    data: any;
    cachedAt: number;
  }
  const weatherCache = new Map<string, WeatherCacheEntry>();
  const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache to respect fair use

  function getWmoWeatherText(code: number): string {
    switch (code) {
      case 0: return 'Clear Sky';
      case 1: return 'Mainly Clear';
      case 2: return 'Partly Cloudy';
      case 3: return 'Overcast';
      case 45: case 48: return 'Fog / Mist';
      case 51: return 'Light Drizzle';
      case 53: return 'Moderate Drizzle';
      case 55: return 'Dense Drizzle';
      case 56: case 57: return 'Freezing Drizzle';
      case 61: return 'Slight Rain';
      case 63: return 'Moderate Rain';
      case 65: return 'Heavy Monsoonal Rain';
      case 66: case 67: return 'Freezing Rain';
      case 71: return 'Slight Snow';
      case 73: return 'Moderate Snow';
      case 75: return 'Heavy Snow';
      case 77: return 'Snow Grains';
      case 80: return 'Slight Rain Showers';
      case 81: return 'Moderate Rain Showers';
      case 82: return 'Violent Rain Showers';
      case 85: case 86: return 'Snow Showers';
      case 95: return 'Thunderstorm';
      case 96: case 99: return 'Thunderstorm with Hail';
      default: return 'Variable Atmospheric Conditions';
    }
  }

  function getWindCardinal(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((degrees % 360) / 22.5)) % 16;
    return directions[index] || 'N';
  }

  async function fetchOpenMeteo(lat: number, lng: number): Promise<{ data: any; isCached: boolean; error?: string }> {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    const cached = weatherCache.get(key);
    const now = Date.now();
    if (cached && (now - cached.cachedAt < WEATHER_CACHE_TTL_MS)) {
      return { data: cached.data, isCached: true };
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=Asia%2FKolkata&forecast_days=7`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'VajraGrid-Disaster-Intelligence/1.0 (academic-prototype; Open-Meteo client)',
        },
      });
      clearTimeout(timeout);
      if (!resp.ok) {
        if (cached) {
          return { data: cached.data, isCached: true, error: `Upstream HTTP ${resp.status}` };
        }
        throw new Error(`Open-Meteo returned HTTP ${resp.status}`);
      }
      const json = await resp.json();
      weatherCache.set(key, { data: json, cachedAt: now });
      return { data: json, isCached: false };
    } catch (err: any) {
      clearTimeout(timeout);
      if (cached) {
        return { data: cached.data, isCached: true, error: err?.message || 'Network error' };
      }
      throw err;
    }
  }

  // 1. Supported Districts List (with backwards-compatible alias /api/weather/regions)
  const handleGetDistricts = (_req: Request, res: Response) => {
    res.json({
      defaultDistrictId: 'palghar_district',
      count: MAHARASHTRA_SUPPORTED_DISTRICTS.length,
      districts: MAHARASHTRA_SUPPORTED_DISTRICTS,
      // Backwards-compatible fields
      defaultRegionId: 'palghar_district',
      regions: MAHARASHTRA_SUPPORTED_DISTRICTS,
    });
  };
  app.get('/api/weather/districts', handleGetDistricts);
  app.get('/api/weather/regions', handleGetDistricts);

  // 2. Weather Status & Provider Check
  app.get('/api/weather/status', (_req: Request, res: Response) => {
    const rawImdKey = process.env.IMD_API_KEY;
    const isImdConfigured = Boolean(rawImdKey && rawImdKey.trim().length > 0 && rawImdKey !== 'MY_IMD_API_KEY');

    res.json({
      openMeteo: {
        provider: 'Open-Meteo Weather Forecast API',
        attribution: 'Weather data by Open-Meteo.com under Non-Commercial Fair Use',
        attributionUrl: 'https://open-meteo.com/',
        status: 'online',
        cacheTtlSeconds: WEATHER_CACHE_TTL_MS / 1000,
        model: 'ECMWF/GFS IFS & ICON Seamless Ensemble',
        representationNote: 'Open-Meteo provides coordinate-based forecasts. Measurements represent the district administrative headquarters location.',
      },
      imd: {
        provider: 'India Meteorological Department (IMD)',
        portalUrl: 'https://api.imd.gov.in/public/api_reference.html',
        mausamUrl: 'https://mausam.imd.gov.in/',
        configured: isImdConfigured,
        status: isImdConfigured ? 'configured' : 'unconfigured',
        note: isImdConfigured
          ? 'IMD API key loaded in server environment.'
          : 'IMD API key not configured. Set IMD_API_KEY in server environment to enable live official alert ingestion. Direct bulletins available on mausam.imd.gov.in.',
      },
    });
  });

  // 3. Current Weather for Selected District
  app.get('/api/weather/current', async (req: Request, res: Response) => {
    const districtId = typeof req.query.districtId === 'string' 
      ? req.query.districtId 
      : typeof req.query.regionId === 'string' 
      ? req.query.regionId 
      : 'palghar_district';
      
    let district = MAHARASHTRA_SUPPORTED_DISTRICTS.find((d) => d.id === districtId);

    let lat = district?.lat;
    let lng = district?.lng;

    if (!district && req.query.lat && req.query.lng) {
      const parsedLat = parseFloat(req.query.lat as string);
      const parsedLng = parseFloat(req.query.lng as string);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        lat = parsedLat;
        lng = parsedLng;
        district = {
          id: 'custom_coord',
          name: `Custom Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
          state: 'Maharashtra',
          division: 'Maharashtra State',
          representativePointName: `Coordinate (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          lat,
          lng,
          imdDistrictName: 'unknown',
          areaSqKm: 0,
          description: 'Geographic coordinate lookup',
          subDistricts: [],
        };
      }
    }

    if (!district || lat === undefined || lng === undefined) {
      res.status(404).json({
        error: `District '${districtId}' not found in supported administrative configuration.`,
      });
      return;
    }

    try {
      const { data, isCached, error } = await fetchOpenMeteo(lat, lng);
      const cur = data.current;
      const weatherCode = cur?.weather_code ?? 0;
      const windDeg = cur?.wind_direction_10m ?? 0;

      res.json({
        district,
        // Backwards compatibility alias
        region: district,
        current: {
          temperature: cur?.temperature_2m ?? null,
          apparentTemperature: cur?.apparent_temperature ?? cur?.temperature_2m ?? null,
          relativeHumidity: cur?.relative_humidity_2m ?? null,
          weatherCode,
          weatherText: getWmoWeatherText(weatherCode),
          windSpeed: cur?.wind_speed_10m ?? null,
          windDirection: windDeg,
          windDirectionCardinal: getWindCardinal(windDeg),
          windGusts: cur?.wind_gusts_10m ?? null,
          precipitationRate: cur?.precipitation ?? 0,
          surfacePressureHpa: cur?.surface_pressure ?? null,
          observationTime: cur?.time ?? new Date().toISOString(),
          isDay: Boolean(cur?.is_day),
          dataSource: 'Open-Meteo Weather Forecast API',
          dataSourceUrl: 'https://open-meteo.com/',
          representativePoint: district.representativePointName,
          isCached,
          warningNote: error,
          representationNotice: 'Representative-location forecast measured at district administrative headquarters.',
        },
      });
    } catch (err: any) {
      res.status(502).json({
        district,
        error: `Failed to retrieve current weather from Open-Meteo: ${err?.message || 'Network error'}`,
        status: 'offline',
      });
    }
  });

  // 4. Forecast (Hourly & Daily) for Selected District
  app.get('/api/weather/forecast', async (req: Request, res: Response) => {
    const districtId = typeof req.query.districtId === 'string'
      ? req.query.districtId
      : typeof req.query.regionId === 'string'
      ? req.query.regionId
      : 'palghar_district';
      
    let district = MAHARASHTRA_SUPPORTED_DISTRICTS.find((d) => d.id === districtId);

    let lat = district?.lat;
    let lng = district?.lng;

    if (!district && req.query.lat && req.query.lng) {
      const parsedLat = parseFloat(req.query.lat as string);
      const parsedLng = parseFloat(req.query.lng as string);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        lat = parsedLat;
        lng = parsedLng;
        district = {
          id: 'custom_coord',
          name: `Custom Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
          state: 'Maharashtra',
          division: 'Maharashtra State',
          representativePointName: `Coordinate (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          lat,
          lng,
          imdDistrictName: 'unknown',
          areaSqKm: 0,
          description: 'Geographic coordinate lookup',
          subDistricts: [],
        };
      }
    }

    if (!district || lat === undefined || lng === undefined) {
      res.status(404).json({
        error: `District '${districtId}' not found in supported administrative configuration.`,
      });
      return;
    }

    try {
      const { data, isCached, error } = await fetchOpenMeteo(lat, lng);
      const hourly = data.hourly || {};
      const daily = data.daily || {};

      // Hourly Forecast (next 24 hours)
      const hourlyTimes: string[] = hourly.time || [];
      const nowIso = new Date().toISOString();
      let startIndex = hourlyTimes.findIndex((t) => t >= nowIso.slice(0, 13));
      if (startIndex === -1) startIndex = 0;
      const next24Times = hourlyTimes.slice(startIndex, startIndex + 24);

      const hourlyList = next24Times.map((t, i) => {
        const actualIdx = startIndex + i;
        const code = hourly.weather_code?.[actualIdx] ?? 0;
        const timeObj = new Date(t);
        const formattedTime = !isNaN(timeObj.getTime())
          ? timeObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
          : t.slice(11, 16);

        return {
          time: t,
          formattedTime,
          temperature: hourly.temperature_2m?.[actualIdx] ?? 0,
          precipitation: hourly.precipitation?.[actualIdx] ?? 0,
          precipitationProbability: hourly.precipitation_probability?.[actualIdx] ?? 0,
          weatherCode: code,
          weatherText: getWmoWeatherText(code),
          windSpeed: hourly.wind_speed_10m?.[actualIdx] ?? 0,
          isDay: Boolean(hourly.is_day?.[actualIdx] ?? 1),
        };
      });

      // Sum next 24 hours precipitation
      const forecastRainfall24h = hourlyList.reduce((sum, h) => sum + (h.precipitation || 0), 0);

      // Daily Forecast (next 7 days)
      const dailyTimes: string[] = daily.time || [];
      const dailyList = dailyTimes.slice(0, 7).map((d, idx) => {
        const code = daily.weather_code?.[idx] ?? 0;
        const dObj = new Date(d);
        const dayLabel = idx === 0 ? 'Today' : !isNaN(dObj.getTime()) ? dObj.toLocaleDateString('en-IN', { weekday: 'short' }) : d;

        return {
          date: d,
          dayLabel,
          weatherCode: code,
          weatherText: getWmoWeatherText(code),
          tempMin: daily.temperature_2m_min?.[idx] ?? 0,
          tempMax: daily.temperature_2m_max?.[idx] ?? 0,
          precipitationSum: daily.precipitation_sum?.[idx] ?? 0,
          precipitationProbabilityMax: daily.precipitation_probability_max?.[idx] ?? 0,
          windSpeedMax: daily.wind_speed_10m_max?.[idx] ?? 0,
          uvIndexMax: daily.uv_index_max?.[idx] ?? null,
        };
      });

      res.json({
        district,
        region: district,
        representativePoint: district.representativePointName,
        forecastRainfall24h: Math.round(forecastRainfall24h * 10) / 10,
        hourly: hourlyList,
        daily: dailyList,
        dataSource: 'Open-Meteo Weather Forecast API',
        dataSourceUrl: 'https://open-meteo.com/',
        isCached,
        warningNote: error,
        representationNotice: 'Representative-location forecast measured at district administrative headquarters.',
      });
    } catch (err: any) {
      res.status(502).json({
        district,
        error: `Failed to retrieve weather forecast: ${err?.message || 'Network error'}`,
        status: 'offline',
      });
    }
  });

  // 5. Official Weather Warnings Check (India Meteorological Department) - District-Level
  app.get('/api/weather/warnings', async (req: Request, res: Response) => {
    const districtId = typeof req.query.districtId === 'string'
      ? req.query.districtId
      : typeof req.query.regionId === 'string'
      ? req.query.regionId
      : 'palghar_district';
      
    const district = MAHARASHTRA_SUPPORTED_DISTRICTS.find((d) => d.id === districtId) || MAHARASHTRA_SUPPORTED_DISTRICTS[0];

    const rawImdKey = process.env.IMD_API_KEY;
    const isImdConfigured = Boolean(rawImdKey && rawImdKey.trim().length > 0 && rawImdKey !== 'MY_IMD_API_KEY');

    if (!isImdConfigured) {
      res.json({
        status: 'unconfigured',
        configured: false,
        districtId: district.id,
        districtName: district.name,
        title: `Official IMD Alert Integration Not Configured for ${district.name}`,
        message: `The official India Meteorological Department (IMD) API requires registration and an API key (IMD_API_KEY). Direct public bulletins for ${district.name} are published on the IMD Mausam Portal.`,
        source: 'India Meteorological Department (IMD)',
        sourceUrl: 'https://mausam.imd.gov.in/',
        portalUrl: 'https://api.imd.gov.in/public/api_reference.html',
        affectedArea: `${district.name}, ${district.state}`,
        lastChecked: new Date().toISOString(),
      });
      return;
    }

    // When configured with real key, query IMD district warning endpoint
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const resp = await fetch('https://api.imd.gov.in/api/v1/districtwarning', {
        signal: controller.signal,
        headers: {
          'api-key': rawImdKey!.trim(),
          Accept: 'application/json',
          'User-Agent': 'VajraGrid-Disaster-Intelligence/1.0',
        },
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        res.json({
          status: 'offline',
          configured: true,
          districtId: district.id,
          districtName: district.name,
          title: `Official Warning Verification Unavailable for ${district.name}`,
          message: `IMD API returned HTTP ${resp.status}. Official warnings could not be verified automatically.`,
          source: 'India Meteorological Department (IMD)',
          sourceUrl: 'https://mausam.imd.gov.in/',
          portalUrl: 'https://api.imd.gov.in/public/api_reference.html',
          affectedArea: `${district.name}, ${district.state}`,
          lastChecked: new Date().toISOString(),
        });
        return;
      }

      const imdData = await resp.json();
      // Search for requested district in warnings list
      const districtWarnings = Array.isArray(imdData) ? imdData : Array.isArray(imdData?.data) ? imdData.data : [];
      const targetQuery = district.imdDistrictName.toLowerCase();
      const matchedWarning = districtWarnings.find((w: any) => {
        const dName = (w?.district_name || w?.district || '').toLowerCase();
        return dName.includes(targetQuery);
      });

      if (matchedWarning && matchedWarning.warning_level && matchedWarning.warning_level.toLowerCase() !== 'no warning') {
        res.json({
          status: 'active',
          configured: true,
          districtId: district.id,
          districtName: district.name,
          warningLevel: matchedWarning.warning_level,
          hazardType: matchedWarning.hazard_type || 'Hydrometeorological Advisory',
          title: matchedWarning.title || `IMD Alert: ${matchedWarning.warning_level} Warning for ${district.name}`,
          issueTime: matchedWarning.issue_time || new Date().toISOString(),
          validUntil: matchedWarning.valid_until,
          affectedArea: matchedWarning.affected_area || `${district.name}, ${district.state}`,
          recommendedPrecautions: matchedWarning.instructions || `Follow official ${district.name} District Disaster Management Authority bulletins.`,
          source: 'India Meteorological Department (IMD)',
          sourceUrl: 'https://mausam.imd.gov.in/',
          portalUrl: 'https://api.imd.gov.in/public/api_reference.html',
          lastChecked: new Date().toISOString(),
        });
      } else {
        res.json({
          status: 'no_active_warning',
          configured: true,
          districtId: district.id,
          districtName: district.name,
          warningLevel: 'Green',
          title: `No Active Official Warning for ${district.name}`,
          message: `The connected official IMD feed reports no severe weather, cyclone, or flood warnings active for ${district.name} at this time.`,
          source: 'India Meteorological Department (IMD)',
          sourceUrl: 'https://mausam.imd.gov.in/',
          portalUrl: 'https://api.imd.gov.in/public/api_reference.html',
          affectedArea: `${district.name}, ${district.state}`,
          lastChecked: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      clearTimeout(timeout);
      res.json({
        status: 'offline',
        configured: true,
        districtId: district.id,
        districtName: district.name,
        title: `Official Warning Verification Temporarily Unavailable for ${district.name}`,
        message: `Unable to connect to IMD API server (${err?.name === 'AbortError' ? 'timeout 10s' : err?.message || 'network failure'}). Official warning status could not be verified automatically.`,
        source: 'India Meteorological Department (IMD)',
        sourceUrl: 'https://mausam.imd.gov.in/',
        portalUrl: 'https://api.imd.gov.in/public/api_reference.html',
        affectedArea: `${district.name}, ${district.state}`,
        lastChecked: new Date().toISOString(),
      });
    }
  });

  // 6. District-Wise Weather Comparison Table Feed (Comparing Maharashtra Administrative Districts)
  app.get('/api/weather/comparison', async (_req: Request, res: Response) => {
    try {
      const results = await Promise.all(
        MAHARASHTRA_SUPPORTED_DISTRICTS.map(async (district) => {
          try {
            const { data, isCached } = await fetchOpenMeteo(district.lat, district.lng);
            const cur = data.current;
            const hourly = data.hourly || {};

            // Calculate 24h precipitation sum
            const hourlyTimes: string[] = hourly.time || [];
            const nowIso = new Date().toISOString();
            let startIndex = hourlyTimes.findIndex((t) => t >= nowIso.slice(0, 13));
            if (startIndex === -1) startIndex = 0;
            const next24Precip = (hourly.precipitation || []).slice(startIndex, startIndex + 24);
            const forecastRainfall24h = Math.round(next24Precip.reduce((sum: number, v: number) => sum + (v || 0), 0) * 10) / 10;

            const next24Prob = (hourly.precipitation_probability || []).slice(startIndex, startIndex + 24);
            const maxProb = next24Prob.length > 0 ? Math.max(...next24Prob.map((p: any) => Number(p) || 0)) : null;

            const next24Wind = (hourly.wind_speed_10m || []).slice(startIndex, startIndex + 24);
            const maxWind = next24Wind.length > 0 ? Math.round(Math.max(...next24Wind.map((w: any) => Number(w) || 0)) * 10) / 10 : null;

            const weatherCode = cur?.weather_code ?? null;
            const weatherText = weatherCode !== null ? getWmoWeatherText(weatherCode) : 'Unavailable';

            // Explainable rule-based weather indicator derived exclusively from forecast 24h rainfall
            let ruleBasedWeatherRisk: 'Normal' | 'Elevated' | 'Heavy' | 'Critical' = 'Normal';
            let ruleExplanation = 'Forecast 24h precipitation under 15 mm. Typical atmospheric conditions.';
            let operationalProtocol = 'Routine hydrometeorological radar and stream gauge surveillance.';

            if (forecastRainfall24h >= 115) {
              ruleBasedWeatherRisk = 'Critical';
              ruleExplanation = 'Forecast 24h rainfall exceeds 115 mm (IMD Very Heavy/Extremely Heavy threshold benchmark). Proactive watch for low-lying catchments.';
              operationalProtocol = 'Stage water rescue teams; alert district flood control room.';
            } else if (forecastRainfall24h >= 65) {
              ruleBasedWeatherRisk = 'Heavy';
              ruleExplanation = 'Forecast 24h rainfall between 65–114 mm (IMD Heavy Rain benchmark threshold).';
              operationalProtocol = 'Deploy mobile dewatering pumps; inspect culverts and bridge clearance.';
            } else if (forecastRainfall24h >= 15) {
              ruleBasedWeatherRisk = 'Elevated';
              ruleExplanation = 'Forecast 24h rainfall between 15–64 mm (IMD Moderate Rain benchmark).';
              operationalProtocol = 'Standard municipal drainage monitoring and culvert desilting checks.';
            }

            return {
              districtId: district.id,
              districtName: district.name,
              state: district.state,
              division: district.division,
              representativePoint: district.representativePointName,
              lat: district.lat,
              lng: district.lng,
              // Backwards-compatible aliases
              regionId: district.id,
              regionName: district.name,
              taluka: district.division,
              currentTemp: cur?.temperature_2m ?? null,
              weatherText,
              weatherCode,
              currentPrecipitation: cur?.precipitation ?? 0,
              forecastRainfall24h,
              precipProbability: maxProb,
              maxWindSpeed: maxWind,
              imdWarningStatus: process.env.IMD_API_KEY ? 'no_active_warning' : 'unconfigured',
              ruleBasedWeatherRisk,
              ruleExplanation,
              operationalProtocol,
              lastUpdated: cur?.time || new Date().toISOString(),
              status: isCached ? 'cached' : 'live',
            };
          } catch (distErr: any) {
            return {
              districtId: district.id,
              districtName: district.name,
              state: district.state,
              division: district.division,
              representativePoint: district.representativePointName,
              lat: district.lat,
              lng: district.lng,
              regionId: district.id,
              regionName: district.name,
              taluka: district.division,
              currentTemp: null,
              weatherText: 'Unavailable',
              weatherCode: null,
              currentPrecipitation: null,
              forecastRainfall24h: null,
              precipProbability: null,
              maxWindSpeed: null,
              imdWarningStatus: 'offline',
              ruleBasedWeatherRisk: 'Unavailable',
              ruleExplanation: 'Weather feed temporarily unreachable for this district.',
              operationalProtocol: 'Maintain radio/telecom contact with district emergency operations center.',
              lastUpdated: null,
              status: 'error',
              errorMessage: distErr?.message || 'Connection failure',
            };
          }
        })
      );

      res.json({
        count: results.length,
        retrievedAt: new Date().toISOString(),
        items: results,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to generate district weather comparison',
        message: err?.message,
      });
    }
  });

  // 7. Palghar Sub-District Taluka Stations (Preserving local taluka context for Palghar)
  app.get('/api/weather/palghar-subdistricts', async (_req: Request, res: Response) => {
    try {
      const results = await Promise.all(
        PALGHAR_TALUKA_STATIONS.map(async (stn) => {
          try {
            const { data } = await fetchOpenMeteo(stn.lat, stn.lng);
            const cur = data.current;
            const hourly = data.hourly || {};
            const hourlyTimes: string[] = hourly.time || [];
            const nowIso = new Date().toISOString();
            let startIndex = hourlyTimes.findIndex((t) => t >= nowIso.slice(0, 13));
            if (startIndex === -1) startIndex = 0;
            const next24Precip = (hourly.precipitation || []).slice(startIndex, startIndex + 24);
            const forecast24h = Math.round(next24Precip.reduce((sum: number, v: number) => sum + (v || 0), 0) * 10) / 10;
            return {
              id: stn.id,
              name: stn.name,
              taluka: stn.taluka,
              lat: stn.lat,
              lng: stn.lng,
              temp: cur?.temperature_2m ?? null,
              weatherText: cur?.weather_code !== undefined ? getWmoWeatherText(cur.weather_code) : 'Clear',
              forecast24h,
            };
          } catch {
            return {
              id: stn.id,
              name: stn.name,
              taluka: stn.taluka,
              lat: stn.lat,
              lng: stn.lng,
              temp: null,
              weatherText: 'Unavailable',
              forecast24h: null,
            };
          }
        })
      );
      res.json({ district: 'Palghar District', stations: results });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch Palghar subdistrict stations', message: err?.message });
    }
  });
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
