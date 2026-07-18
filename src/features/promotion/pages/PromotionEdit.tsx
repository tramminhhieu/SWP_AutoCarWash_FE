import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getPromotionById, updatePromotion } from "../api/promotionApi";
import PromotionForm, {
  type PromotionFormValues,
} from "../components/PromotionForm";
import type { PromotionItem, UpdatePromotionRequest } from "../types/promotion";

export default function PromotionEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { promotionId } = useParams<{ promotionId: string }>();
  const isInvalidId = !promotionId || isNaN(Number(promotionId));

  // Nếu điều hướng từ PromotionDetail (bấm "Edit Campaign") sẽ có sẵn
  // state.promotion → dùng luôn, khỏi gọi lại API. Vào thẳng bằng URL thì fetch.
  const promotionFromState = (
    location.state as { promotion?: PromotionItem } | null
  )?.promotion;

  const [promotion, setPromotion] = useState<PromotionItem | null>(
    promotionFromState ?? null,
  );
  const [isLoading, setIsLoading] = useState(!promotionFromState);
  const [notFound, setNotFound] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isInvalidId || promotionFromState) return;

    let isMounted = true;

    getPromotionById(Number(promotionId))
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setNotFound(true);
        } else {
          setPromotion(data);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [promotionId, isInvalidId, promotionFromState]);

  async function handleSubmit(values: PromotionFormValues) {
    if (!promotion) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const body: UpdatePromotionRequest = {
      title: values.campaignName,
      startDate: values.startDate,
      endDate: values.endDate,
      stationIds: values.selectedStations.map((s) => s.id),
      targetIds: values.targetIds.length > 0 ? values.targetIds : null,
      vouchers: values.vouchers.map((v) => ({
        id: v.id, // có id = update voucher cũ, null = tạo voucher mới
        voucherCode: v.voucherCode.toUpperCase(),
        discountPercentage: Number(v.discountPercentage),
        maxDiscountAmount: Number(v.maxDiscountAmount),
        minOrderValue: Number(v.minOrderValue),
        usageLimit: Number(v.usageLimit),
        reusable: v.reusable,
      })),
    };

    try {
      await updatePromotion(promotion.id, body);
      navigate(`/admin/promotions/${promotion.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update promotion. Please try again.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    navigate(
      promotion ? `/admin/promotions/${promotion.id}` : "/admin/promotions",
    );
  }

  // ── Invalid ID / Not found ──
  if (isInvalidId || notFound) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-base text-outline">Promotion not found.</p>
        <button
          onClick={() => navigate("/admin/promotions")}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Back to Promotions
        </button>
      </div>
    );
  }

  // ── Loading ──
  if (isLoading || !promotion) {
    return (
      <div className="flex h-96 items-center justify-center text-base text-outline">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-12 py-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate(`/admin/promotions/${promotion.id}`)}
          className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to Promotion Detail
        </button>
        <div>
          <h1 className="font-heading text-headline-xl font-bold tracking-[-1.2px] text-on-surface">
            Edit Promotion
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Update campaign info and voucher codes for{" "}
            <span className="font-semibold text-on-surface">
              {promotion.title}
            </span>
            .
          </p>
        </div>
      </div>

      {/* ── Form ── */}
      <PromotionForm
        mode="edit"
        initialData={promotion}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
