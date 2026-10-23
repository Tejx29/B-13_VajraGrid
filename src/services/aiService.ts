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
   */
  async triageIncident(incident: Incident): Promise<AITriageResponse> {
    try {
      const res = await fetch('/api/ai/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incident),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          status: data.status || 'error',
          message: data.message || `Server returned HTTP ${res.status}`,
          model: data.model || 'gemini-3.8-flash',
        };
      }

      return data;
    } catch (err: any) {
      return {
        success: false,
        status: 'error',
        message: err?.message || 'Network error communicating with AI triage service.',
        model: 'gemini-3.8-flash',
      };
    }
  },
};
