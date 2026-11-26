import { useEffect } from "react";

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 3200);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === "success";
  const isInfo = toast.type === "info";
  const isTheme = toast.type === "theme";

  let icon = "✨";
  if (isSuccess) icon = "✓";
  if (isInfo) icon = "ℹ️";
  if (isTheme) icon = "🎨";
  if (toast.icon) icon = toast.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[99999] flex max-w-sm items-center gap-3.5 rounded-2xl border border-white/20 bg-[#1e2a22]/95 p-4 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 animate-slide-up"
      style={{
        boxShadow: "0 18px 45px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
      }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg font-bold text-[#e6c587]">
        {icon}
      </div>

      <div className="flex-1 pr-2">
        {toast.title && (
          <p className="font-serif text-sm font-semibold tracking-wide text-white">
            {toast.title}
          </p>
        )}
        <p className="text-xs leading-relaxed text-white/80">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
