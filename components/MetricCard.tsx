interface MetricCardProps {
  label: string;
  value: string | number;
}

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
      <div className="absolute bottom-0 left-0 h-px w-full bg-orange-500/20">
        <div className="h-full w-1/3 bg-orange-500" />
      </div>
    </div>
  );
}
