import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Brain, TrendingUp, ShieldCheck, Zap, BarChart2, LineChart,
  ArrowUpRight, Cpu
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Floating metric card (3-D tilt on mouse)
───────────────────────────────────────────── */
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  positive?: boolean;
  color: string;
  delay: number;
  style?: React.CSSProperties;
  className?: string;
}

const MetricCard = ({
  icon, label, value, change, positive = true, color, delay, style, className,
}: MetricCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 260, damping: 28 });
  const sry = useSpring(ry, { stiffness: 260, damping: 28 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;
    rx.set(cy * -14);
    ry.set(cx * 14);
  };

  const reset = () => { rx.set(0); ry.set(0); };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{
        rotateX: srx,
        rotateY: sry,
        transformStyle: 'preserve-3d',
        perspective: 800,
        ...style,
      }}
      className={`relative group cursor-default ${className ?? ''}`}
    >
      {/* Card face */}
      <div
        className="relative rounded-2xl border border-border/60 bg-surface/70 backdrop-blur-xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden transition-all duration-300 group-hover:border-brand/30"
        style={{ transform: 'translateZ(20px)' }}
      >
        {/* Inner glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `radial-gradient(circle at 60% 30%, ${color}18 0%, transparent 65%)` }}
        />

        <div className="flex items-start justify-between mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border"
            style={{
              background: `${color}15`,
              borderColor: `${color}25`,
              color,
            }}
          >
            {icon}
          </div>
          <span
            className={`flex items-center gap-0.5 text-[11px] font-bold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            <ArrowUpRight className="w-3 h-3" />
            {change}
          </span>
        </div>

        <p className="text-[10px] font-medium text-text-muted/60 mb-0.5 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black tabular-nums tracking-tight text-text-main">{value}</p>

        {/* Shimmer line at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   Animated neural-net SVG canvas
───────────────────────────────────────────── */
const NeuralCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Nodes
    const NODE_COUNT = 55;
    type Node = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; pulse: number; phase: number;
    };

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2.5 + 1,
      pulse: Math.random(),
      phase: Math.random() * Math.PI * 2,
    }));

    const MAX_DIST = 140;
    let frame = 0;
    let raf: number;

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      // Update positions
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.phase += 0.012;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(0, 209, 255, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n) => {
        const pulse = Math.sin(n.phase) * 0.5 + 0.5;
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4 + pulse * 4);
        glow.addColorStop(0, `rgba(0, 209, 255, ${0.5 + pulse * 0.4})`);
        glow.addColorStop(1, 'rgba(0, 209, 255, 0)');

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (1 + pulse * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 209, 255, ${0.7 + pulse * 0.3})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.55 }}
    />
  );
};

/* ─────────────────────────────────────────────
   Orbiting ring
───────────────────────────────────────────── */
const OrbitRing = ({
  radius, duration, offset = 0, color,
}: {
  radius: number; duration: number; offset?: number; color: string;
}) => (
  <motion.div
    className="absolute rounded-full border pointer-events-none"
    style={{
      width: radius * 2,
      height: radius * 2,
      top: '50%',
      left: '50%',
      x: -radius,
      y: -radius,
      borderColor: `${color}20`,
      borderWidth: 1,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: 'linear', delay: offset }}
  >
    {/* Dot on the ring */}
    <motion.div
      className="absolute w-2.5 h-2.5 rounded-full top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ background: color, boxShadow: `0 0 12px ${color}` }}
    />
  </motion.div>
);

/* ─────────────────────────────────────────────
   Main section
───────────────────────────────────────────── */
export const AIVisualizationSection = () => {
  const { t } = useTranslation();

  const metrics = [
    {
      icon: <BarChart2 className="w-4 h-4" />,
      label: t('landing.mockup.kpis.enterpriseValue'),
      value: '€12.4M',
      change: '+8.2%',
      color: '#00D1FF',
      delay: 0.1,
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: t('landing.mockup.kpis.projectedGrowth'),
      value: '+15.2%',
      change: '+3.1%',
      color: '#10B981',
      delay: 0.2,
    },
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      label: 'Survival Rate',
      value: '86%',
      change: '+1.4%',
      color: '#6366F1',
      delay: 0.3,
    },
    {
      icon: <LineChart className="w-4 h-4" />,
      label: t('landing.mockup.kpis.mlReliability'),
      value: 'MAE 12%',
      change: '+0.4%',
      color: '#F59E0B',
      delay: 0.4,
    },
  ];

  return (
    <section id="ai-demo" className="relative py-32 overflow-hidden -mt-6">
      {/* ── Ambient background ── */}
      <div className="absolute inset-0 gradient-mesh-subtle" />
      <div className="absolute inset-0 bg-background/60" />

      {/* Horizontal dividers */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Large ambient glow behind center */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,209,255,0.07) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-elevated/50 text-text-muted text-xs font-semibold uppercase tracking-wider mb-5">
            <Cpu className="w-3.5 h-3.5 text-brand" />
            {t('landing.ai.badge', 'AI Intelligence Engine')}
          </div>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-main mb-5 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('landing.ai.title', 'Intelligence that works')}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand/80 to-secondary">
              {t('landing.ai.titleAccent', 'in real-time')}
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-text-muted leading-relaxed">
            {t(
              'landing.ai.subtitle',
              'Our neural engine processes thousands of data points per second, delivering live valuations and ML-powered forecasts for your business.',
            )}
          </p>
        </motion.div>

        {/* ── Main 3-D canvas + orbits + cards ── */}
        <div className="relative flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-0">

          {/* Left column: 2 metric cards */}
          <div className="flex flex-col gap-5 lg:mr-[-40px] z-10 w-full max-w-[230px]">
            {metrics.slice(0, 2).map((m, i) => (
              <MetricCard key={i} {...m} />
            ))}
          </div>

          {/* Center: 3-D orb + neural canvas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex-shrink-0 w-[360px] h-[360px] md:w-[440px] md:h-[440px]"
          >
            {/* Neural canvas */}
            <NeuralCanvas />

            {/* Orbit rings */}
            <OrbitRing radius={155} duration={18} color="#00D1FF" />
            <OrbitRing radius={115} duration={12} offset={3} color="#6366F1" />
            <OrbitRing radius={75} duration={8} offset={6} color="#10B981" />

            {/* Center orb */}
            <motion.div
              animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0,209,255,0.25) 0%, rgba(99,102,241,0.1) 50%, transparent 70%)',
                boxShadow: '0 0 60px rgba(0,209,255,0.25), 0 0 120px rgba(0,209,255,0.08), inset 0 0 30px rgba(0,209,255,0.1)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(0,209,255,0.3)',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-10 h-10 text-brand" style={{ filter: 'drop-shadow(0 0 8px rgba(0,209,255,0.6))' }} />
              </div>
            </motion.div>

            {/* Floating badges on the orb area */}
            {[
              { label: 'Valuation', icon: <BarChart2 className="w-3.5 h-3.5" />, top: '8%', left: '50%', delay: 0 },
              { label: 'Forecast', icon: <TrendingUp className="w-3.5 h-3.5" />, top: '50%', left: '2%', delay: 0.4 },
              { label: 'Risk AI', icon: <ShieldCheck className="w-3.5 h-3.5" />, top: '50%', right: '2%', delay: 0.8 },
              { label: 'Real-time', icon: <Zap className="w-3.5 h-3.5" />, bottom: '8%', left: '50%', delay: 1.2 },
            ].map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: badge.delay + 0.5, duration: 0.4, ease: 'backOut' }}
                animate={{ y: [0, -5, 0] }}
                // @ts-ignore – mixed transition types
                transition2={{ y: { duration: 3 + i * 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 } }}
                className="absolute flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-brand/25 bg-surface/80 backdrop-blur-md text-[10px] font-semibold text-brand shadow-[0_4px_20px_rgba(0,209,255,0.15)] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                style={{
                  top: badge.top,
                  left: badge.left,
                  right: (badge as { right?: string }).right,
                  bottom: (badge as { bottom?: string }).bottom,
                }}
              >
                {badge.icon}
                {badge.label}
              </motion.div>
            ))}
          </motion.div>

          {/* Right column: 2 metric cards */}
          <div className="flex flex-col gap-5 lg:ml-[-40px] z-10 w-full max-w-[230px]">
            {metrics.slice(2).map((m, i) => (
              <MetricCard key={i} {...m} />
            ))}
          </div>
        </div>

        {/* ── Bottom feature pills ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mt-20"
        >
          {[
            { label: t('landing.ai.pills.monteCarlo', '12,450 Monte Carlo Simulations'), color: '#00D1FF' },
            { label: t('landing.ai.pills.ml', '3 ML Models Fused'), color: '#6366F1' },
            { label: t('landing.ai.pills.sectors', '28 Sector Benchmarks'), color: '#10B981' },
            { label: t('landing.ai.pills.realtime', 'Live Data Processing'), color: '#F59E0B' },
            { label: t('landing.ai.pills.accuracy', 'MAE 12% Error Bound'), color: '#00D1FF' },
          ].map((pill, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 + 0.3, duration: 0.35 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-elevated/40 backdrop-blur-sm text-sm text-text-muted hover:border-brand/30 hover:text-text-main transition-all duration-200 cursor-default"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: pill.color, boxShadow: `0 0 6px ${pill.color}` }} />
              {pill.label}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
