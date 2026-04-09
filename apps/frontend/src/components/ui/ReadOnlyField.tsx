interface ReadOnlyFieldProps {
  label: string;
  value: string;
  className?: string;
}

export const ReadOnlyField = ({ label, value, className = '' }: ReadOnlyFieldProps) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="block text-sm font-medium text-text-main">{label}</label>
    <input
      className="input w-full bg-background cursor-not-allowed"
      value={value}
      readOnly
    />
  </div>
);
