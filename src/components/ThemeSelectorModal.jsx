import { useTheme } from "../context/ThemeContext";

export default function ThemeSelectorModal({ isOpen, onClose, onNotify }) {
  const { theme, setTheme, themes } = useTheme();

  if (!isOpen) return null;

  const handleSelectTheme = (t) => {
    setTheme(t.id);
    if (onNotify) {
      onNotify({
        type: "theme",
        title: `${t.name} Applied`,
        message: `Theme updated to ${t.name}. ${t.subtitle}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[99995] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-modal-title"
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-[#e9e5dc] bg-[#fcfbf8] p-6 shadow-2xl transition-all sm:p-8 dark:border-[#2a3c30] dark:bg-[#121915]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e9e5dc] pb-5 dark:border-[#2a3c30]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b18a57]/15 text-lg">
                🎨
              </span>
              <h2
                id="theme-modal-title"
                className="font-serif text-2xl font-medium text-[#24402f] dark:text-[#f0f4f0]"
              >
                Choose Theme Experience
              </h2>
            </div>
            <p className="mt-1 text-xs text-[#777b70] dark:text-[#9ea8a1]">
              Select from curated aesthetic colorways tailored for luxury stays & night retreats.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close theme selector"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e2d9] text-sm text-[#777b70] transition hover:bg-[#f0eee7] hover:text-[#24402f] dark:border-[#2a3c30] dark:text-[#9ea8a1] dark:hover:bg-[#1b2620] dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Theme Grid */}
        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {themes.map((t) => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTheme(t)}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                  isActive
                    ? "border-[#244b38] bg-[#edf3ec]/80 shadow-md ring-2 ring-[#244b38]/30 dark:border-[#34d399] dark:bg-[#172b21] dark:ring-[#34d399]/30"
                    : "border-[#e9e5dc] bg-white hover:border-[#b18a57] hover:shadow-sm dark:border-[#2a3c30] dark:bg-[#18231c] dark:hover:border-[#34d399]"
                }`}
              >
                {/* Top: Swatches & Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {t.dotColors.map((color, index) => (
                      <span
                        key={index}
                        className="inline-block h-4 w-4 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <span className="rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-[#5a6058] dark:bg-white/10 dark:text-[#c7d2cb]">
                    {t.colors.badge}
                  </span>
                </div>

                {/* Middle: Name & Subtitle */}
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-base font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                      {t.name}
                    </h3>
                    {isActive && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#244b38] text-[11px] font-bold text-white dark:bg-[#34d399] dark:text-[#0c120e]">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#777b70] dark:text-[#9ea8a1]">
                    {t.subtitle}
                  </p>
                </div>

                {/* Bottom: Light/Dark Tag */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-[#85877f] dark:text-[#7f8e83]">
                  <span>{t.isDark ? "🌙 Dark Base" : "☀️ Light Base"}</span>
                  <span
                    className={`font-semibold ${
                      isActive
                        ? "text-[#244b38] dark:text-[#34d399]"
                        : "text-transparent group-hover:text-[#b18a57]"
                    }`}
                  >
                    {isActive ? "Active Theme" : "Select →"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-[#e9e5dc] pt-4 dark:border-[#2a3c30]">
          <p className="text-[11px] text-[#777b70] dark:text-[#9ea8a1]">
            Theme preference automatically saves to your browser.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#244b38] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#193829] dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#2cb884]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
