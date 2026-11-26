/**
 * StayEase — Reusable Confirmation Modal
 */
export default function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger", // 'danger' | 'primary' | 'success'
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen) return null;

  let btnColor = "bg-[#c53030] hover:bg-[#a82525] text-white";
  if (confirmVariant === "primary") {
    btnColor = "bg-[#244b38] hover:bg-[#193829] text-white dark:bg-[#34d399] dark:text-[#0b120e]";
  } else if (confirmVariant === "success") {
    btnColor = "bg-[#287a4c] hover:bg-[#1e5d39] text-white";
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
    >
      <div
        className="w-full max-w-md rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-2xl transition-all dark:border-[#2a3c30] dark:bg-[#152019]"
      >
        <h3 className="font-serif text-xl font-semibold text-[#244b38] dark:text-[#f0f4f0]">
          {title}
        </h3>
        <p className="mt-2 text-xs leading-5 text-[#757b72] dark:text-[#9aa59d]">
          {message}
        </p>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-xl border border-[#dedbd2] px-4 py-2.5 text-xs font-semibold text-[#26382d] transition hover:bg-[#f6f4ed] dark:border-[#2f4035] dark:text-[#e4ede6] dark:hover:bg-[#1f2d23]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition active:scale-98 ${btnColor}`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

