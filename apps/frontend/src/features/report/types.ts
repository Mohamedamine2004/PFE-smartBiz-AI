import type {
  ReportLanguage,
  ReportType,
  ReportTone,
  ReportSection,
} from '../../types/report';

export interface WizardFormState {
  reportType: ReportType;
  language: ReportLanguage;
  pageCount: 10 | 20 | 30;
  mainProblem: string;
  sections: ReportSection[];
  tone: ReportTone;
}

export interface WizardStepProps {
  state: WizardFormState;
  setState: (state: WizardFormState) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}
