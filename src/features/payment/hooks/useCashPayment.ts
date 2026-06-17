import { useState } from "react";
import { processCashPayment } from "../services/paymentApi";
import type { CashPaymentResponse } from "../services/paymentApi";

export const useCashPayment = (
  bookingId: number,
  totalAmount: number,
  onSuccess: (result: CashPaymentResponse) => void
) => {
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const received = parseFloat(receivedAmount || "0");
  const changeAmount = received - totalAmount;

  const handleConfirm = async () => {
    setError("");

    // AC02 — validate
    if (received < totalAmount) {
      setError("Insufficient payment amount");
      return;
    }

    try {
      setLoading(true);
      const result = await processCashPayment({ bookingId, receivedAmount: received });
      onSuccess(result);
    } catch (err: any) {
      setError(err.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    receivedAmount,
    setReceivedAmount,
    changeAmount,
    error,
    loading,
    handleConfirm,
  };
};