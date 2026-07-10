import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  X,
} from "lucide-react";

export type ModalVariant = "success" | "confirm" | "danger" | "custom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void; // gọi khi bấm nút X, nút "Cancel", hoặc nút duy nhất (success)
  variant?: ModalVariant; // mặc định "confirm"
  size?: "sm" | "lg"; // mặc định "sm" (max-w-sm) - "lg" (max-w-3xl) dùng cho nội dung rộng, vd overlay chi tiết nhiều cột
  icon?: ReactNode | null;
  title?: string;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  isConfirmLoading?: boolean;
  children?: ReactNode;
}

const DEFAULT_ICON: Record<ModalVariant, ReactNode | null> = {
  success: <CheckCircle2 size={48} className="text-tertiary-fixed-dim" />,
  danger: <AlertTriangle size={48} className="text-error" />,
  confirm: <HelpCircle size={48} className="text-secondary" />,
  custom: null,
};

const Modal = ({
  isOpen,
  onClose,
  variant = "confirm",
  size = "sm",
  icon,
  title,
  message,
  confirmText,
  cancelText = "Cancel",
  onConfirm,
  isConfirmLoading = false,
  children,
}: ModalProps) => {
  if (!isOpen) return null;

  const displayIcon = icon !== undefined ? icon : DEFAULT_ICON[variant];

  // Label mặc định cho nút xác nhận/nút duy nhất - tất cả bằng tiếng Anh
  const defaultConfirmText =
    variant === "success"
      ? "Continue"
      : variant === "danger"
        ? "Delete"
        : "Confirm";
  const confirmLabel = confirmText ?? defaultConfirmText;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* Thêm "relative" để chứa nút X absolute ở góc */}
      <div
        className={`relative flex flex-col items-center gap-4 rounded-2xl bg-surface-container-lowest px-8 py-8 shadow-xl w-full mx-4 text-center ${
          size === "lg" ? "max-w-3xl" : "max-w-sm"
        }`}
      >
        {/* Nút X - luôn hiện ở mọi variant, gọi onClose giống nút Cancel */}
        <button
          type="button"
          onClick={onClose}
          disabled={isConfirmLoading}
          aria-label="Close"
          className="absolute top-4 right-4 rounded-full p-1 text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
        >
          <X size={20} />
        </button>

        {variant === "custom" && children ? (
          children
        ) : (
          <>
            {displayIcon}

            {title && (
              <p className="text-headline-md font-semibold text-on-surface">
                {title}
              </p>
            )}

            {message && (
              <div className="text-body-md text-on-surface-variant">
                {message}
              </div>
            )}

            {variant === "success" ? (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirmLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-md font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
              >
                {isConfirmLoading && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {confirmLabel}
              </button>
            ) : (
              <div className="mt-2 flex w-full gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isConfirmLoading}
                  className="flex-1 rounded-lg border border-secondary px-6 py-3 text-body-md font-semibold text-secondary hover:bg-secondary/5 disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isConfirmLoading}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-body-md font-semibold disabled:opacity-50 ${
                    variant === "danger"
                      ? "bg-error text-on-error hover:opacity-90"
                      : "bg-primary text-on-primary hover:opacity-90"
                  }`}
                >
                  {isConfirmLoading && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {confirmLabel}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Modal;
