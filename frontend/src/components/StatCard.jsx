export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="panel-frost relative overflow-hidden rounded-[2rem] p-5">
      <div className="ambient-orb right-[-1rem] top-[-1rem] h-24 w-24 bg-[#dce9cf]" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-sage/85">{title}</p>
        <div className="h-12 w-12 rounded-full bg-[radial-gradient(circle,rgba(107,154,103,0.18),rgba(107,154,103,0.03))]" />
      </div>
      <p className="relative mt-5 font-display text-3xl font-semibold text-forest">{value}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf2e8]">
        <div className="h-full w-2/3 rounded-full bg-[linear-gradient(90deg,#6b9a67_0%,#b7d6a6_100%)]" />
      </div>
      <p className="relative mt-3 text-sm leading-6 text-forest/62">{subtitle}</p>
    </div>
  );
}
