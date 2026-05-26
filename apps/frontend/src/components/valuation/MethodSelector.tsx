import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Coins,
  Scale,
  Building2,
  LineChart,
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import type { ValuationMethod, ValuationMethodInfo } from '../../types/valuation';
import { ValuationMethod as VM } from '../../types/valuation';

interface Props {
  methods: ValuationMethodInfo[];
  selected: ValuationMethod | null;
  onSelect: (method: ValuationMethod) => void;
}

const METHOD_METADATA: Record<ValuationMethod, { icon: any; tag: string; color: string; badgeBg: string }> = {
  [VM.EV_EBITDA]: {
    icon: TrendingUp,
    tag: 'Rentable / LBO',
    color: 'from-indigo-500/10 to-indigo-500/0 hover:border-indigo-500/40 text-indigo-400 border-indigo-500/20',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
  [VM.EV_REVENUE]: {
    icon: Coins,
    tag: 'Startups / SaaS',
    color: 'from-cyan-500/10 to-blue-500/0 hover:border-cyan-500/40 text-[#00D1FF] border-[#00D1FF]/20',
    badgeBg: 'bg-[#00D1FF]/10 text-[#00D1FF] border-[#00D1FF]/20',
  },
  [VM.PE_RATIO]: {
    icon: Scale,
    tag: 'Sociétés Publiques',
    color: 'from-amber-500/10 to-orange-500/0 hover:border-amber-500/40 text-amber-400 border-amber-500/20',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  [VM.ASSET_BASED]: {
    icon: Building2,
    tag: 'Actifs Lourds',
    color: 'from-emerald-500/10 to-teal-500/0 hover:border-emerald-500/40 text-emerald-400 border-emerald-500/20',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  [VM.GORDON_GROWTH]: {
    icon: LineChart,
    tag: 'Mature / Stable',
    color: 'from-rose-500/10 to-pink-500/0 hover:border-rose-500/40 text-rose-400 border-rose-500/20',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
};

export const MethodSelector = ({ methods, selected, onSelect }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {methods.map((m) => {
          const isActive = m.id === selected;
          const meta = METHOD_METADATA[m.id] || {
            icon: HelpCircle,
            tag: 'Standard',
            color: 'from-border/10 to-transparent border-border',
            badgeBg: 'bg-border/20 text-text-secondary',
          };
          const Icon = meta.icon;

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className={`relative text-left p-4.5 rounded-2xl border transition-all duration-300 group overflow-hidden ${
                isActive
                  ? 'bg-elevated/75 border-brand shadow-[0_0_15px_var(--color-brand-dim)] scale-[1.02] z-10'
                  : 'bg-surface/40 border-border/50 hover:bg-surface/75'
              }`}
            >
              {/* Dynamic Glow Background */}
              <div
                className={`absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br ${meta.color} rounded-full blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500`}
              />

              <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? 'bg-brand/10 border border-brand/20 text-brand' : 'bg-elevated border border-border/40 text-text-secondary'
                  }`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide border ${meta.badgeBg}`}>
                    {meta.tag}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-text-primary flex items-center gap-1">
                    {m.name}
                    {isActive && <Sparkles className="w-3.5 h-3.5 text-brand animate-pulse" />}
                  </h4>
                  <p className="text-[11px] leading-snug text-text-muted font-medium line-clamp-2">
                    {m.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/30 mt-1 flex items-center justify-between">
                  <span className="font-mono text-[9px] font-semibold text-text-secondary truncate max-w-[130px]" title={m.formula}>
                    {m.formula.split(' → ')[0]}
                  </span>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    isActive ? 'text-brand translate-x-0.5' : 'text-text-muted/40 group-hover:translate-x-0.5'
                  }`} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

