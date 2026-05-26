import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles, Check, RefreshCw, X, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

/* ------------------------------------------------------------------ */
/*  Avatar Gallery — curated Dicebear styles                           */
/* ------------------------------------------------------------------ */

type CategoryKey = '3D Robots' | 'Avatars' | 'Célébrités' | 'Philosophes' | 'Programmeurs' | 'Animaux' | 'Pixel Art' | 'Fun Emoji';

const CATEGORIES: CategoryKey[] = [
  '3D Robots',
  'Avatars',
  'Célébrités',
  'Animaux',
  'Pixel Art',
  'Fun Emoji',
];

const AVATAR_GALLERY: Record<CategoryKey, string[]> = {
  '3D Robots': [
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Aria',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Leo',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Cypher',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Nova',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Matrix',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Spark',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Pulse',
    'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Vortex',
  ],
  'Avatars': [
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Felix',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Maya',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Valkyrie',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Rebel',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Zen',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Aura',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Echo',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Storm',
  ],
  'Célébrités': [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Messi',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Ronaldo',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Mbappe',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Neymar',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Salah',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Zidane',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Beckham',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Pele',
  ],
  'Animaux': [
    'https://api.dicebear.com/7.x/croodles/svg?seed=Dog',
    'https://api.dicebear.com/7.x/croodles/svg?seed=Cat',
    'https://api.dicebear.com/7.x/croodles/svg?seed=Fox',
    'https://api.dicebear.com/7.x/croodles/svg?seed=Bear',
    'https://api.dicebear.com/7.x/croodles/svg?seed=Rabbit',
    'https://api.dicebear.com/7.x/croodles/svg?seed=Koala',
    'https://api.dicebear.com/7.x/croodles/svg?seed=Lion',
    'https://api.dicebear.com/7.x/croodles/svg?seed=Panda',
  ],
  'Pixel Art': [
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Happy',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Cool',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Smart',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Ninja',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Zara',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Bolt',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Lux',
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=Neon',
  ],
  'Fun Emoji': [
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Chill',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Wow',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Fire',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Star',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Heart',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Gem',
  ],
};

/* Custom generator styles */
const CUSTOM_STYLES = [
  { id: 'lorelei', label: 'Portrait' },
  { id: 'bottts-neutral', label: 'Robot' },
  { id: 'pixel-art', label: 'Pixel' },
  { id: 'fun-emoji', label: 'Emoji' },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const AvatarSelector = () => {
  const { user, updateAvatar } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('3D Robots');
  const [customSeed, setCustomSeed] = useState(user?.firstName || 'SmartBiz');
  const [customStyle, setCustomStyle] = useState<string>('lorelei');
  const [previewKey, setPreviewKey] = useState(0); // force re-render of custom preview

  // Build the custom avatar URL with cache-bust
  const getCustomUrl = useCallback(
    (seed: string, style: string) =>
      `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed.trim() || 'SmartBiz')}`,
    []
  );

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const handleSelect = (url: string) => {
    updateAvatar(url);
    toast.success('Avatar mis à jour !');
    setIsOpen(false);
  };

  const handleRandomSeed = () => {
    setCustomSeed(Math.random().toString(36).substring(2, 8));
    setPreviewKey((k) => k + 1);
  };

  /* ---- Modal content rendered via portal ---- */
  const modal = isOpen
    ? createPortal(
        <AnimatePresence>
          <motion.div
            key="avatar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-3xl border border-border/60 shadow-2xl overflow-hidden"
              style={{ background: 'var(--bg-surface)' }}
            >
              {/* ── Header ───────────────────────────────────── */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(0,209,255,0.12)' }}
                  >
                    <Sparkles className="w-4.5 h-4.5 text-brand" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-main leading-tight">
                      Choisir un Avatar
                    </h3>
                    <p className="text-[11px] text-text-muted">
                      Sélectionnez ou générez votre personnage.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl border border-border/60 text-text-muted hover:text-text-main hover:bg-elevated/60 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Category Tabs ────────────────────────────── */}
              <div className="px-6 pb-4">
                <div 
                  className="p-1 rounded-2xl" 
                  style={{ 
                    background: 'var(--bg-elevated)', 
                    border: '1px solid var(--border-color)' 
                  }}
                >
                  <div 
                    className="flex gap-1.5 overflow-x-auto scroll-smooth whitespace-nowrap px-1 py-0.5" 
                    style={{ 
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  >
                    {[...CATEGORIES, 'Générateur' as const].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          if (cat === 'Générateur') {
                            setActiveCategory(null as unknown as CategoryKey);
                          } else {
                            setActiveCategory(cat as CategoryKey);
                          }
                        }}
                        className="py-2 px-3.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer shrink-0"
                        style={{
                          background:
                            (cat === 'Générateur' && !CATEGORIES.includes(activeCategory)) ||
                            activeCategory === cat
                              ? 'var(--brand)'
                              : 'transparent',
                          color:
                            (cat === 'Générateur' && !CATEGORIES.includes(activeCategory)) ||
                            activeCategory === cat
                              ? '#0f172a'
                              : 'var(--text-secondary)',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Content ──────────────────────────────────── */}
              <div className="px-6 pb-6">
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    minHeight: 220,
                  }}
                >
                  {CATEGORIES.includes(activeCategory) ? (
                    /* ──── Avatar Grid ──── */
                    <div className="grid grid-cols-4 gap-3">
                      {AVATAR_GALLERY[activeCategory]?.map((url) => {
                        const isSelected = user?.avatarUrl === url;
                        return (
                          <button
                            type="button"
                            key={url}
                            onClick={() => handleSelect(url)}
                            className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 border-2 group"
                            style={{
                              background: 'var(--bg-surface)',
                              borderColor: isSelected
                                ? 'var(--brand)'
                                : 'var(--border-color)',
                              boxShadow: isSelected
                                ? '0 0 20px rgba(0,209,255,0.35)'
                                : 'none',
                              transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = 'rgba(0,209,255,0.5)';
                                e.currentTarget.style.transform = 'scale(1.06)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }
                            }}
                          >
                            <img
                              src={url}
                              alt="avatar"
                              className="w-full h-full p-1.5 object-contain"
                              loading="lazy"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,209,255,0.12)' }}>
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center"
                                  style={{
                                    background: 'var(--brand)',
                                    boxShadow: '0 0 12px rgba(0,209,255,0.6)',
                                  }}
                                >
                                  <Check className="w-3.5 h-3.5 text-slate-950" strokeWidth={3} />
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* ──── Custom Generator ──── */
                    <div className="flex flex-col items-center gap-5 py-2">
                      {/* Live preview */}
                      <div className="relative">
                        <div
                          className="absolute -inset-2 rounded-full blur-lg animate-pulse"
                          style={{ background: 'linear-gradient(135deg, var(--brand), var(--secondary))', opacity: 0.4 }}
                        />
                        <div
                          className="relative w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center"
                          style={{ background: 'var(--bg-surface)', borderColor: 'var(--brand)' }}
                        >
                          <img
                            key={`${customStyle}-${customSeed}-${previewKey}`}
                            src={getCustomUrl(customSeed, customStyle)}
                            alt="preview"
                            className="w-full h-full p-2 object-contain"
                          />
                        </div>
                      </div>

                      {/* Style selector */}
                      <div className="flex gap-2 flex-wrap justify-center">
                        {CUSTOM_STYLES.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setCustomStyle(s.id);
                              setPreviewKey((k) => k + 1);
                            }}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer"
                            style={{
                              background: customStyle === s.id ? 'var(--brand)' : 'transparent',
                              color: customStyle === s.id ? '#0f172a' : 'var(--text-secondary)',
                              borderColor: customStyle === s.id ? 'var(--brand)' : 'var(--border-color)',
                            }}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>

                      {/* Seed input */}
                      <div className="flex gap-2 w-full max-w-xs">
                        <input
                          type="text"
                          value={customSeed}
                          onChange={(e) => {
                            setCustomSeed(e.target.value);
                            setPreviewKey((k) => k + 1);
                          }}
                          className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all"
                          style={{
                            background: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--brand)';
                            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,209,255,0.15)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          placeholder="Tapez un mot clé..."
                        />
                        <button
                          type="button"
                          onClick={handleRandomSeed}
                          className="p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center"
                          style={{
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-secondary)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--brand)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                          title="Mot aléatoire"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Confirm */}
                      <button
                        type="button"
                        onClick={() => handleSelect(getCustomUrl(customSeed, customStyle))}
                        className="w-full max-w-xs py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
                        style={{
                          background: 'linear-gradient(135deg, var(--brand), var(--secondary))',
                          color: '#0f172a',
                          boxShadow: '0 4px 16px rgba(0,209,255,0.2)',
                        }}
                      >
                        Utiliser cet avatar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )
    : null;

  /* ── Inline Trigger (the avatar bubble shown in the settings card) ── */
  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative cursor-pointer group focus:outline-none"
          title="Modifier l'avatar"
        >
          {/* Glow */}
          <div
            className="absolute -inset-1.5 rounded-full blur-md transition-opacity duration-300 opacity-50 group-hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, var(--brand), var(--secondary))' }}
          />
          {/* Circle */}
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-[1.04]"
            style={{ background: 'var(--bg-surface)', border: '2px solid var(--brand)' }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-brand" />
            )}
          </div>
          {/* Edit badge */}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            style={{
              background: 'var(--brand)',
              border: '2.5px solid var(--bg-surface)',
              boxShadow: '0 2px 8px rgba(0,209,255,0.3)',
            }}
          >
            <Camera className="w-3.5 h-3.5 text-slate-950" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-[11px] text-brand hover:text-secondary font-bold cursor-pointer transition-colors"
        >
          Modifier l'avatar
        </button>
      </div>

      {modal}
    </>
  );
};
