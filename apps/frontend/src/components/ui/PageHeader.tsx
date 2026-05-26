interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader = ({ title, subtitle }: PageHeaderProps) => (
  <div className="relative mb-8 mt-4">
    {/* Background ambient glow */}
    <div className="absolute -top-10 -left-10 w-48 h-48 bg-brand/10 rounded-full blur-[60px] pointer-events-none" />
    
    <div className="relative z-10">
      <h1 
        className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-text-main via-text-main to-text-muted bg-clip-text text-transparent mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-text-muted font-medium max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  </div>
);
