import type {
  ReportAudience,
  ReportLanguage,
  ReportLengthProfile,
  ReportType,
} from '../../types/report';

/**
 * Simplified 5-question wizard state.
 * Tone, sections, analysisDepth are now auto-derived by the backend.
 */
export interface WizardFormState {
  /** Q1: What kind of analysis? */
  reportType: ReportType;
  /** Q2: Who will read this report? */
  audience: ReportAudience;
  /** Q3: In which language? */
  language: ReportLanguage;
  /** Q4: Short / Medium / Long */
  lengthProfile: ReportLengthProfile;
  /** Q5: Main business problem (optional but recommended) */
  problemStatement: string;
  /** Custom: Selected Sections */
  sections: ReportSection[];
  /** Custom: Colors */
  primaryColor: string;
  secondaryColor: string;
  /** Custom: Logo (base64) */
  logo: string;
}

export interface WizardStepProps {
  state: WizardFormState;
  setState: (state: WizardFormState) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}
