import logod from '../../assets/logod.svg';
import logol from '../../assets/logol.svg';

interface LogoProps {
  className?: string;
  minimized?: boolean;
}

export const Logo = ({ className = 'h-20 w-auto', minimized = false }: LogoProps) => {
  if (minimized) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} filter drop-shadow-[0_0_8px_rgba(0,209,255,0.35)] transition-all duration-300 hover:scale-105`}
      >
        <defs>
          <linearGradient id="logo-mini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#00D1FF" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <filter id="logo-mini-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Hexagone 3D minimaliste */}
        <polygon
          points="24,5 41,15 41,33 24,43 7,33 7,15"
          stroke="url(#logo-mini-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="rgba(10, 15, 29, 0.6)"
        />

        {/* Tracé de croissance néon intérieur */}
        <path
          d="M 14 29 L 20 22 L 26 27 L 34 16"
          stroke="#00D1FF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#logo-mini-glow)"
        />

        {/* Nœuds clés lumineux */}
        <circle cx="14" cy="29" r="2" fill="#6366F1" />
        <circle cx="20" cy="22" r="2" fill="#00D1FF" />
        <circle cx="26" cy="27" r="2" fill="#00D1FF" />
        <circle cx="34" cy="16" r="3" fill="#10B981" />
      </svg>
    );
  }

  return (
    <>
      <img src={logol} alt="SmartBiz AI" className={`${className} dark:hidden`} />
      <img src={logod} alt="SmartBiz AI" className={`${className} hidden dark:block`} />
    </>
  );
};
