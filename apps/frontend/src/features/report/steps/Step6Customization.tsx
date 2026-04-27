import React from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Image as ImageIcon, UploadCloud } from 'lucide-react';
import type { WizardStepProps } from '../types';

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
      const base64 = event.target?.result as string;
      setState({ ...state, logo: base64 });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('wizard.step6.title', 'Customize Your Report')}</h2>
        <p className="text-slate-600">
          {t('wizard.step6.description', 'Add your brand colors and logo to make the report your own.')}
        </p>
      </div>

      <div className="space-y-5">
        {/* Primary Color */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Palette className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{t('wizard.step6.primaryColor', 'Primary Color')}</h3>
              <p className="text-sm text-slate-500">{t('wizard.step6.primaryColorDesc', 'Used for headers and dark backgrounds')}</p>
            </div>
          </div>
          <input
            type="color"
            value={state.primaryColor || '#1E3A5F'}
            onChange={(e) => setState({ ...state, primaryColor: e.target.value })}
            className="w-14 h-14 p-1 rounded-lg cursor-pointer border border-slate-200"
          />
        </div>

        {/* Secondary Color */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Palette className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{t('wizard.step6.secondaryColor', 'Secondary Color')}</h3>
              <p className="text-sm text-slate-500">{t('wizard.step6.secondaryColorDesc', 'Used for accents, borders, and charts')}</p>
            </div>
          </div>
          <input
            type="color"
            value={state.secondaryColor || '#2563EB'}
            onChange={(e) => setState({ ...state, secondaryColor: e.target.value })}
            className="w-14 h-14 p-1 rounded-lg cursor-pointer border border-slate-200"
          />
        </div>

        {/* Logo Upload */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{t('wizard.step6.logo', 'Company Logo')}</h3>
              <p className="text-sm text-slate-500">{t('wizard.step6.logoDesc', 'Max size 2MB. Recommended format: PNG with transparent background')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex-1 cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors">
              <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm font-medium text-slate-700">{t('wizard.step6.upload', 'Click to upload logo')}</span>
              <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleLogoUpload} />
            </label>

            {state.logo && (
              <div className="w-24 h-24 rounded-lg border border-slate-200 p-2 flex items-center justify-center bg-slate-50 flex-shrink-0">
                <img src={state.logo} alt="Logo preview" className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
