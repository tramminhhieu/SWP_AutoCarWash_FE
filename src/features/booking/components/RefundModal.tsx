import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { formatCurrency } from "../../../utils";
import {
  createRefund,
  fetchBanks,
  getDepositAmount,
  lookupAccount,
} from "../api/refundApi";
import type { BankOption, DepositAmountResponse } from "../types/refund";
import type { BookingCard } from "../types/booking";

// Map errorCode from BE → user-facing error message
const API_ERROR_MAP: Record<string, string> = {
  BOOKING_NOT_CANCELABLE:
    "This booking can no longer be canceled (less than 2 hours before the appointment).",
  REFUND_ALREADY_EXISTS: "A refund request already exists for this booking.",
};

interface RefundModalProps {
  booking: BookingCard;
  onClose: () => void;
  /** Called after a refund request is created — parent removes the booking card. */
  onRefunded: (bookingId: number) => void;
}

const inputClass =
  "w-full rounded-lg border bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

const RefundModal = ({ booking, onClose, onRefunded }: RefundModalProps) => {
  // Refund amount (số tiền cọc cố định, read-only)
  const [deposit, setDeposit] = useState<DepositAmountResponse | null>(null);
  const [depositLoading, setDepositLoading] = useState(true);

  // Bank list + searchable combobox state
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [selectedBin, setSelectedBin] = useState("");
  const [bankQuery, setBankQuery] = useState("");
  const [bankOpen, setBankOpen] = useState(false);
  const bankBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form fields
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  // VietQR lookup state
  const [holderVerified, setHolderVerified] = useState(false); // AC2.1 — auto-filled + read-only
  const [holderManual, setHolderManual] = useState(false); // AC2c — fallback manual entry
  const [lookupLoading, setLookupLoading] = useState(false);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load refund amount + bank list on mount
  useEffect(() => {
    let alive = true;
    getDepositAmount()
      .then((data) => alive && setDeposit(data))
      .catch(() => alive && setDeposit(null))
      .finally(() => alive && setDepositLoading(false));
    fetchBanks()
      .then((data) => alive && setBanks(Array.isArray(data) ? data : []))
      .catch(() => alive && setBanks([]));
    return () => {
      alive = false;
    };
  }, [booking.bookingId]);

  // AC2.1 / AC2c — debounced VietQR lookup once bank + account number are present
  useEffect(() => {
    const trimmed = accountNumber.trim();
    if (!selectedBin || trimmed.length < 6) {
      setHolderVerified(false);
      setHolderManual(false);
      return;
    }

    setLookupLoading(true);
    const timer = setTimeout(() => {
      lookupAccount(selectedBin, trimmed)
        .then((res) => {
          setAccountHolder(res.accountName);
          setHolderVerified(true);
          setHolderManual(false);
          setFieldErrors((prev) => ({ ...prev, accountHolder: "" }));
        })
        .catch(() => {
          // BE đã hiển thị thông báo lỗi → không lặp lại ở FE, chỉ mở nhập tay (AC2c)
          setHolderVerified(false);
          setHolderManual(true);
        })
        .finally(() => setLookupLoading(false));
    }, 600);

    return () => {
      clearTimeout(timer);
      setLookupLoading(false);
    };
  }, [selectedBin, accountNumber]);

  // AC4 — block submit if any required field is empty
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!selectedBin) errors.bank = "Vui lòng chọn ngân hàng.";
    if (!accountNumber.trim())
      errors.accountNumber = "Vui lòng nhập số tài khoản.";
    if (!accountHolder.trim())
      errors.accountHolder = "Vui lòng nhập tên chủ tài khoản.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setApiError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createRefund({
        bookingId: booking.bookingId,
        refundMethod: "BANK_TRANSFER",
        bankBin: selectedBin,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
      });
      setSuccessMessage(
        "Your booking has been canceled. Your deposit will be refunded within 1–3 business days.",
      );
    } catch (err) {
      const { errorCode, message } = getApiErrorInfo(err);
      setApiError(
        API_ERROR_MAP[errorCode ?? ""] ??
          message ??
          "Failed to submit refund request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const holderReadOnly = holderVerified && !holderManual;

  // Lọc ngân hàng theo ký tự user đang gõ (shortName / name / code)
  const q = bankQuery.trim().toLowerCase();
  const bankList = Array.isArray(banks) ? banks : [];
  const filteredBanks = !q
    ? bankList
    : bankList.filter(
        (b) =>
          (b.displayName ?? "").toLowerCase().includes(q) ||
          (b.shortCode ?? "").toLowerCase().includes(q),
      );

  return (
    <Modal
      isOpen
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      variant="custom"
    >
      {/* Success feedback → then remove card */}
      <Modal
        isOpen={!!successMessage}
        onClose={() => {
          setSuccessMessage(null);
          onRefunded(booking.bookingId);
          onClose();
        }}
        variant="success"
        title="Refund request submitted"
        message={successMessage ?? ""}
        confirmText="Got it"
      />

      {/* Error feedback */}
      <Modal
        isOpen={!!apiError}
        onClose={() => setApiError(null)}
        variant="danger"
        title="Unable to process refund"
        message={apiError ?? ""}
        confirmText="Got it"
        onConfirm={() => setApiError(null)}
      />

      <div className="flex w-full flex-col gap-5 text-left">
        {/* Header */}
        <div>
          <h2 className="text-headline-md font-semibold text-on-surface">
            Refund details
          </h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Enter the bank account you want to receive your refund on.
          </p>
        </div>

        {/* Read-only refund amount */}
        <div className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3">
          <span className="block text-label-md font-semibold text-on-surface-variant">
            Refund amount
          </span>
          <span className="mt-0.5 block text-headline-sm font-bold text-primary">
            {depositLoading
              ? "…"
              : deposit
                ? formatCurrency(deposit.amount)
                : "—"}
          </span>
          <span className="mt-1 block text-label-sm text-on-surface-variant">
            Your deposit will be refunded within 1–3 business days.
          </span>
        </div>

        {/* Bank — searchable combobox */}
        <div>
          <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
            Ngân hàng
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Nhập tên ngân hàng để tìm"
              value={bankQuery}
              onFocus={() => setBankOpen(true)}
              onChange={(e) => {
                setBankQuery(e.target.value);
                setSelectedBin(""); // gõ lại → bỏ chọn cũ cho tới khi chọn lại
                setBankOpen(true);
                setFieldErrors((prev) => ({ ...prev, bank: "" }));
              }}
              onBlur={() => {
                // delay để cho phép click chọn option trước khi đóng
                bankBlurTimer.current = setTimeout(() => setBankOpen(false), 150);
              }}
              className={`${inputClass} ${fieldErrors.bank ? "border-error" : "border-outline-variant"}`}
            />
            {bankOpen && filteredBanks.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-lowest py-1 shadow-lg">
                {filteredBanks.map((b) => (
                  <li key={b.bin}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSelectedBin(b.bin);
                        setBankQuery(`${b.displayName} — ${b.shortCode}`);
                        setBankOpen(false);
                        setFieldErrors((prev) => ({ ...prev, bank: "" }));
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-sm text-on-surface hover:bg-surface-container-high"
                    >
                      <span className="font-semibold">{b.displayName}</span>
                      <span className="truncate text-on-surface-variant">
                        {b.shortCode}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {fieldErrors.bank && (
            <p className="mt-1 text-label-sm text-error">{fieldErrors.bank}</p>
          )}
        </div>

        {/* Account number */}
        <div>
          <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
            Số tài khoản
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0123456789"
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value.replace(/[^0-9]/g, ""));
              setFieldErrors((prev) => ({ ...prev, accountNumber: "" }));
            }}
            className={`${inputClass} ${fieldErrors.accountNumber ? "border-error" : "border-outline-variant"}`}
          />
          {fieldErrors.accountNumber && (
            <p className="mt-1 text-label-sm text-error">
              {fieldErrors.accountNumber}
            </p>
          )}
        </div>

        {/* Account holder */}
        <div>
          <label className="mb-1.5 block text-label-md font-semibold text-on-surface-variant">
            Tên chủ tài khoản
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="NGUYEN VAN A"
              value={accountHolder}
              readOnly={holderReadOnly}
              onChange={(e) => {
                setAccountHolder(e.target.value);
                setFieldErrors((prev) => ({ ...prev, accountHolder: "" }));
              }}
              className={`${inputClass} ${
                fieldErrors.accountHolder
                  ? "border-error"
                  : "border-outline-variant"
              } ${holderReadOnly ? "bg-surface-container-low text-on-surface-variant" : ""}`}
            />
            {lookupLoading && (
              <Loader2
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-on-surface-variant"
              />
            )}
          </div>

          {/* AC2.1 — verified */}
          {holderReadOnly && (
            <p className="mt-1 flex items-center gap-1 text-label-sm text-tertiary-fixed-dim">
              <CheckCircle2 size={14} />
              Đúng là tài khoản của bạn?
            </p>
          )}
          {fieldErrors.accountHolder && (
            <p className="mt-1 text-label-sm text-error">
              {fieldErrors.accountHolder}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-1 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-outline-variant px-5 py-2.5 text-body-md font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-60"
          >
            Keep Booking
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-md font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Processing..." : "Confirm Cancellation"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RefundModal;
