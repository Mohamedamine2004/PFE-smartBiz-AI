import React from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Image as ImageIcon, UploadCloud, X } from 'lucide-react';
import type { WizardStepProps } from '../types';

const ROW_STYLE: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-color)',
};

export const Step6Customization = ({ state, setState }: WizardStepProps) => {
  const { t } = useTranslation();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert(t('wizard.step6.logoSizeError', 'Logo size must be less than 2MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setState({ ...state, logo: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-1">
        {t('wizard.step', 'Étape')} 6 / 8
      </p>
      <h2 className="text-xl font-bold text-text-main mb-1">
        {t('wizard.step6.title', 'Personnalisation')}
      </h2>
      <p className="text-sm text-text-muted mb-6">
        {t('wizard.step6.description', 'Ajoutez vos couleurs et votre logo pour personnaliser le rapport.')}
      </p>

      <div className="space-y-3">
        {/* Primary Color */}
        <div className="flex items-center gap-4 p-4 rounded-xl" style={ROW_STYLE}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(0,209,255,0.1)', border: '1px solid rgba(0,209,255,0.2)' }}
          >
            <Palette className="w-4 h-4 text-brand" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-text-main">{t('wizard.step6.primaryColor', 'Couleur principale')}</h3>
            <p className="text-xs text-text-muted mt-0.5">{t('wizard.step6.primaryColorDesc', 'En-têtes et fonds sombres')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-muted">{state.primaryColor}</span>
            <label className="relative cursor-pointer">
              <div
                className="w-9 h-9 rounded-xl border-2 transition-all hover:scale-105"
                style={{ background: state.primaryColor || '#1E3A5F', borderColor: 'var(--border-color)' }}
              />
              <input
                type="color"
                value={state.primaryColor || '#1E3A5F'}
                onChange={(e) => setState({ ...state, primaryColor: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>
        </div>

        {/* Secondary Color */}
        <div className="flex items-center gap-4 p-4 rounded-xl" style={ROW_STYLE}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <Palette className="w-4 h-4" style={{ color: 'rgba(99,102,241,0.9)' }} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-text-main">{t('wizard.step6.secondaryColor', 'Couleur secondaire')}</h3>
            <p className="text-xs text-text-muted mt-0.5">{t('wizard.step6.secondaryColorDesc', 'Accents, bordures et graphiques')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-muted">{state.secondaryColor}</span>
            <label className="relative cursor-pointer">
              <div
                className="w-9 h-9 rounded-xl border-2 transition-all hover:scale-105"
                style={{ background: state.secondaryColor || '#2563EB', borderColor: 'var(--border-color)' }}
              />
              <input
                type="color"
                value={state.secondaryColor || '#2563EB'}
                onChange={(e) => setState({ ...state, secondaryColor: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="p-4 rounded-xl" style={ROW_STYLE}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <ImageIcon className="w-4 h-4" style={{ color: 'rgba(16,185,129,0.9)' }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-text-main">{t('wizard.step6.logo', 'Logo de l\'entreprise')}</h3>
              <p className="text-xs text-text-muted">{t('wizard.step6.logoDesc', 'Max 2 Mo. Format PNG recommandé.')}</p>
            </div>
          </div>

          {state.logo ? (
            <div className="flex items-center gap-3">
              <div
                className="w-20 h-20 rounded-xl p-2 flex items-center justify-center"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
              >
                <img src={state.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <button
                type="button"
                onClick={() => setState({ ...state, logo: '' })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-error transition-colors"
                style={{ background: 'color-mix(in srgb, var(--error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--error) 20%, transparent)' }}
              >
                <X className="w-3 h-3" />
                {t('wizard.step6.removeLogo', 'Supprimer')}
              </button>
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all duration-200 text-center"
              style={{
                border: '1.5px dashed var(--border-color)',
                background: 'var(--bg-surface)',
              }}
            >
              <UploadCloud className="w-7 h-7 text-text-muted mb-2" />
              <span className="text-sm font-medium text-text-muted">
                {t('wizard.step6.upload', 'Cliquez pour importer votre logo')}
              </span>
              <span className="text-[10px] text-text-muted/60 mt-1">PNG, JPG — max 2 Mo</span>
              <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleLogoUpload} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
};
