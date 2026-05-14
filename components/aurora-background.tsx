export function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-ink-950" />
      <div
        className="absolute -top-1/3 left-1/2 h-[140vh] w-[140vh] -translate-x-1/2 rounded-full opacity-60 mix-blend-screen blur-3xl animate-aurora-drift"
        style={{
          background:
            "conic-gradient(from 90deg at 50% 50%, #22D3EE 0%, #D946EF 33%, #F59E0B 66%, #22D3EE 100%)",
        }}
      />
      <div
        className="absolute -bottom-1/4 -right-1/4 h-[80vh] w-[80vh] rounded-full opacity-40 mix-blend-screen blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #22D3EE 0%, transparent 60%)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(10,10,15,0.7)_70%,_#0A0A0F_100%)]" />
      {/* fine grain */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
