import { Incident, AITriageAssessment } from '../types';

export interface AIStatusResponse {
  configured: boolean;
  model: string;
  provider: string;
}

export interface AITriageResponse {
  success: boolean;
  status: 'success' | 'unconfigured' | 'error';
  analysis?: AITriageAssessment;
  message?: string;
  model?: string;
}

/**
 * Maps elapsed triage duration to progressive status communication stages without fake percentages.
 * Supports image triage awareness for clear feedback during multimodal analysis and fallback.
 */
export const getTriageProgressMessage = (seconds: number, hasImage: boolean = false): string => {
  if (hasImage) {
    if (seconds < 2) {
      return 'Preparing incident and visual evidence...';
    }
    if (seconds < 5) {
      return 'Analyzing incident facts & field photo with Gemini...';
    }
    if (seconds < 8) {
      return 'Evaluating scene risks & visual evidence...';
    }
    if (seconds < 12) {
      return 'Image analysis taking longer than usual. Attempting text-only fallback...';
    }
    return 'Processing text-based incident triage...';
  }

  if (seconds < 2) {
    return 'Preparing incident evidence...';
  }
  if (seconds < 4) {
    return 'Contacting Gemini AI...';
  }
  if (seconds < 7) {
    return 'Analyzing the reported facts...';
  }
  if (seconds < 10) {
    return 'Validating structured assessment...';
  }
  return 'This is taking longer than usual. The request is still processing...';
};

export const aiService = {
  /**
   * Check if Gemini API is configured on the server without exposing keys.
   */
  async getStatus(): Promise<AIStatusResponse> {
    try {
      const res = await fetch('/api/ai/status');
      if (!res.ok) {
        return { configured: false, model: 'gemini-3.8-flash', provider: 'Google Gemini API' };
      }
      return await res.json();
    } catch {
      return { configured: false, model: 'gemini-3.8-flash', provider: 'Google Gemini API' };
    }
  },

  /**
   * Request structured Gemini AI triage analysis for an operational incident.
   * Includes client-side timeout abort protection and clean error sanitization for 504 DEADLINE_EXCEEDED.
   */
  async triageIncident(incident: Incident): Promise<AITriageResponse> {
    const controller = new AbortController();
    const clientTimeoutMs = 24000; // Safe threshold (server multimodal 9s + fallback 9s = 18s)
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, clientTimeoutMs);

    try {
      const res = await fetch('/api/ai/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incident),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          return {
            success: false,
            status: 'error',
            message: 'Triage service returned an invalid JSON response structure.',
            model: 'gemini-3.8-flash',
          };
        }
      } else {
        // Detect HTML or plain text response without throwing unhandled SyntaxError
        const textPreview = await res.text();
        let safeErrorMessage = `Triage service temporarily unavailable (HTTP ${res.status}).`;

        if (res.status === 504 || textPreview.toLowerCase().includes('deadline')) {
          safeErrorMessage = 'The AI triage request timed out (504 DEADLINE_EXCEEDED). You can retry the analysis or proceed with manual assessment.';
        } else if (res.status === 413 || textPreview.toLowerCase().includes('payloadtoolarge')) {
          safeErrorMessage = 'Attached photo exceeds server threshold. Please upload an image under 4MB.';
        } else if (res.status === 503) {
          safeErrorMessage = 'Gemini API is not configured on the server. Please verify GEMINI_API_KEY in server secrets.';
        } else if (textPreview.toLowerCase().includes('cannot post')) {
          safeErrorMessage = 'AI triage service endpoint is not registered on this server.';
        }

        return {
          success: false,
          status: 'error',
          message: safeErrorMessage,
          model: 'gemini-3.8-flash',
        };
      }

      if (!res.ok) {
        let msg = data?.message || `Triage server returned HTTP ${res.status}`;
        if (res.status === 504 || (data?.error && String(data.error).includes('DEADLINE_EXCEEDED'))) {
          msg = data?.message || 'The AI triage request timed out (504 DEADLINE_EXCEEDED). You can retry the analysis or proceed with manual assessment.';
        }
        return {
          success: false,
          status: data?.status || 'error',
          message: msg,
          model: data?.model || 'gemini-3.8-flash',
        };
      }

      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('aborted')) {
        return {
          success: false,
          status: 'error',
          message: 'The AI triage request timed out on the client. You can retry the analysis or proceed with manual assessment.',
          model: 'gemini-3.8-flash',
        };
      }
      return {
        success: false,
        status: 'error',
        message: err?.message || 'Network error communicating with AI triage service.',
        model: 'gemini-3.8-flash',
      };
    }
  },
};
