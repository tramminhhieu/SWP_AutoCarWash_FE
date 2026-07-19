import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createPromotion } from "../api/promotionApi";
import PromotionForm, {
  type PromotionFormValues,
} from "../components/PromotionForm";
import type { CreatePromotionRequest } from "../types/promotion";

export default function PromotionCreate() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(values: PromotionFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);

    const body: CreatePromotionRequest = {
      configMode: 2,
      campaignName: values.campaignName,
      description: values.description.trim() || null,
      campaignStartDate: values.startDate,
      campaignEndDate: values.endDate,
      stationIds: values.selectedStations.map((s) => s.id),
      targetCustomerTierIds:
        values.targetIds.length > 0 ? values.targetIds : null,
      vouchers: values.vouchers.map((v) => ({
        voucherCode: v.voucherCode.toUpperCase(),
        discountType: v.discountType,
        discountValue: Number(v.discountValue),
        maxDiscountAmount: Number(v.maxDiscountAmount),
        minOrderValue: Number(v.minOrderValue),
        usageLimit: Number(v.usageLimit),
        reusable: v.reusable,
      })),
      voucherStartDate: null,
      voucherEndDate: null,
    };

    try {
      await createPromotion(body);
      navigate("/admin/promotions");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create promotion. Please try again.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate("/admin/promotions")}
          className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to Promotions
        </button>
        <div>
          <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
            Create Promotion
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Set up a new campaign with one or more voucher codes.
          </p>
        </div>
      </div>

      {/* ── Form ── */}
      <PromotionForm
        mode="create"
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/admin/promotions")}
      />
    </div>
  );
}
