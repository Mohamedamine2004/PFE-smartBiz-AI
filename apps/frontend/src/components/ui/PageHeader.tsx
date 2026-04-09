interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader = ({ title, subtitle }: PageHeaderProps) => (
  <div>
    <h1 className="text-3xl text-text-main heading-serif">{title}</h1>
    {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
  </div>
);
