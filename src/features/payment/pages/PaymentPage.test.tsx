/**
 * Test suite: PaymentPage – unsuccessful payment scenarios
 *
 * Covers every failure path visible to the staff user:
 *  - booking load errors (network / missing ID)
 *  - cash amount validation (zero, insufficient)
 *  - payment API errors (generic, HTTP 500)
 *  - loyalty-points validation (zero, over-max, over-total)
 */

import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// ── Mocks (hoisted before all imports by Vitest) ───────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: vi.fn(),
  useLocation: vi.fn(),
}));

vi.mock("../../booking/api/bookingApi", () => ({
  getBookingDetail: vi.fn(),
}));

vi.mock("../services/paymentApi", () => ({
  processCashPayment: vi.fn(),
}));

// ── Imports (resolved after mocks are set up) ──────────────────────────────────

import PaymentPage from "./PaymentPage";
import { useParams, useLocation } from "react-router-dom";
import { getBookingDetail } from "../../booking/api/bookingApi";
import { processCashPayment } from "../services/paymentApi";
import type { BookingDetail } from "../../booking/types/booking";
import type { CashPaymentResponse } from "../services/paymentApi";

// ── Fixtures ───────────────────────────────────────────────────────────────────

const mockDetail: BookingDetail = {
  bookingId: 42,
  status: "CHECK_OUT",
  serviceName: "Premium Wash",
  addons: [],
  licensePlate: "59A-12345",
  brandName: "Toyota",
  color: "White",
  stationName: "Station 1",
  stationAddress: "123 Main St",
  appointmentDate: "2026-06-28",
  startTime: "09:00",
  endTime: "09:30",
  technicianName: "Minh",
  servicePrice: 150_000,
  addonTotal: 0,
  voucherCode: null,
  voucherDiscountPercent: null,
  voucherDiscountAmount: 0,
  pointsEarned: null,
  totalAmount: 150_000,
  isDepositPaid: false,
  depositAmount: null,
  remainingAmount: 150_000, // baseTotal = 150,000 VNĐ
};

const mockPaymentSuccess: CashPaymentResponse = {
  invoiceId: 1,
  totalAmount: 150_000,
  receivedAmount: 150_000,
  changeAmount: 0,
  bookingStatus: "PAID",
  paymentStatus: "PAID",
};

const defaultLocation = {
  state: { bookingId: 42, pointDiscount: 500 }, // 500 pts available
  pathname: "/staff/payment/42",
  search: "",
  hash: "",
  key: "default",
};

// ── Test helpers ───────────────────────────────────────────────────────────────

/** Wait until the full payment form is rendered (loading phase is done). */
async function waitForPaymentForm() {
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Confirm Payment" }),
    ).toBeInTheDocument(),
  );
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe("PaymentPage – unsuccessful payment scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default happy-path mocks; individual tests override as needed.
    vi.mocked(useParams).mockReturnValue({ bookingId: "42" } as ReturnType<typeof useParams>);
    vi.mocked(useLocation).mockReturnValue(defaultLocation as ReturnType<typeof useLocation>);
    vi.mocked(getBookingDetail).mockResolvedValue(mockDetail);
    vi.mocked(processCashPayment).mockResolvedValue(mockPaymentSuccess);
  });

  // ── Booking-load failures ──────────────────────────────────────────────────

  it("TC-PAY-F01: shows error message when getBookingDetail rejects (network error)", async () => {
    vi.mocked(getBookingDetail).mockRejectedValue(new Error("Network Error"));

    render(<PaymentPage />);

    await waitFor(() =>
      expect(
        screen.getByText("Failed to load booking details."),
      ).toBeInTheDocument(),
    );
  });

  it("TC-PAY-F02: shows error message when no bookingId is present in params or state", async () => {
    vi.mocked(useParams).mockReturnValue({} as ReturnType<typeof useParams>);
    vi.mocked(useLocation).mockReturnValue({
      state: null,
      pathname: "/",
      search: "",
      hash: "",
      key: "default",
    } as ReturnType<typeof useLocation>);

    render(<PaymentPage />);

    await waitFor(() =>
      expect(screen.getByText("Booking not found.")).toBeInTheDocument(),
    );
  });

  // ── Cash-amount validation ─────────────────────────────────────────────────

  it("TC-PAY-F03: Confirm button is disabled when received amount is 0 (nothing entered)", async () => {
    render(<PaymentPage />);
    await waitForPaymentForm();

    expect(screen.getByRole("button", { name: "Confirm Payment" })).toBeDisabled();
  });

  it("TC-PAY-F04: shows insufficient warning and keeps button disabled when received < total", async () => {
    render(<PaymentPage />);
    await waitForPaymentForm();

    // Enter 100,000 VNĐ — less than the 150,000 VNĐ total
    fireEvent.change(screen.getByPlaceholderText("0"), {
      target: { value: "100000" },
    });

    expect(
      screen.getByText("Received amount is insufficient."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm Payment" })).toBeDisabled();
  });

  // ── Payment API failures ───────────────────────────────────────────────────

  it("TC-PAY-F05: shows inline error when processCashPayment rejects with generic error", async () => {
    vi.mocked(processCashPayment).mockRejectedValue(new Error("Server Error"));

    render(<PaymentPage />);
    await waitForPaymentForm();

    fireEvent.change(screen.getByPlaceholderText("0"), {
      target: { value: "150000" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Confirm Payment" }));

    await waitFor(() =>
      expect(
        screen.getByText("Payment failed. Please try again."),
      ).toBeInTheDocument(),
    );
  });

  it("TC-PAY-F06: shows inline error when payment API returns HTTP 500", async () => {
    const err = Object.assign(new Error("Request failed with status code 500"), {
      response: { status: 500 },
    });
    vi.mocked(processCashPayment).mockRejectedValue(err);

    render(<PaymentPage />);
    await waitForPaymentForm();

    fireEvent.change(screen.getByPlaceholderText("0"), {
      target: { value: "200000" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Confirm Payment" }));

    await waitFor(() =>
      expect(
        screen.getByText("Payment failed. Please try again."),
      ).toBeInTheDocument(),
    );
  });

  // ── Loyalty-points validation ──────────────────────────────────────────────

  it("TC-PAY-F07: shows error when Apply Points is clicked with 0 points entered", async () => {
    render(<PaymentPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Apply Points" })).toBeInTheDocument(),
    );

    // pointsToApply defaults to 0, click Apply immediately
    await userEvent.click(screen.getByRole("button", { name: "Apply Points" }));

    expect(
      screen.getByText("Enter a value greater than 0."),
    ).toBeInTheDocument();
  });

  it("TC-PAY-F08: shows error when entered points exceed available balance (max 500 pts)", async () => {
    render(<PaymentPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Apply Points" })).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText("Enter points"), {
      target: { value: "600" }, // pointDiscountMax = 500
    });
    await userEvent.click(screen.getByRole("button", { name: "Apply Points" }));

    expect(screen.getByText("Maximum 500 points.")).toBeInTheDocument();
  });

  it("TC-PAY-F09: shows error when points would over-cover the total amount (150,000 VNĐ needs max 150 pts)", async () => {
    render(<PaymentPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Apply Points" })).toBeInTheDocument(),
    );

    // 200 pts × 1,000 = 200,000 VNĐ > 150,000 VNĐ remaining
    fireEvent.change(screen.getByPlaceholderText("Enter points"), {
      target: { value: "200" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Apply Points" }));

    expect(
      screen.getByText("Only 150 points needed to cover the full amount."),
    ).toBeInTheDocument();
  });
});
