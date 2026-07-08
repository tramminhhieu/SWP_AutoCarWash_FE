import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Car, Check } from "lucide-react";
import Loading from "../../../components/ui/Loading";
import { formatCurrency } from "../../../utils";
import { getApiErrorInfo } from "../../../lib/axiosClient";
import { getPlanById, getVehicleOptions, register } from "../api/subscriptionApi";
import type { CustomerSubscriptionPlan, RegisterVehicleOption } from "../types/subscription";

// FE-60-US-02.1
export default function SubscriptionRegister() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const id = Number(planId);

  const [plan, setPlan] = useState<CustomerSubscriptionPlan | null>(null);
  const [vehicles, setVehicles] = useState<RegisterVehicleOption[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setLoadError("Invalid subscription plan.");
      setIsLoading(false);
      return;
    }
    Promise.all([getPlanById(id), getVehicleOptions()])
      .then(([planData, vehicleData]) => {
        if (!planData) {
          setLoadError("Invalid subscription plan.");
          return;
        }
        setPlan(planData);
        setVehicles(vehicleData);
      })
      .catch(() => setLoadError("Unable to load registration details."))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    setFormError(null);
    const selected = vehicles.find((v) => v.id === selectedVehicleId);
    if (!selected) {
      setFormError("Vehicle is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register(id, selected.id, selected.hasActiveSubscription);
      navigate(`/subscription-plans/payment/${result.invoiceId}`);
    } catch (error) {
      // AC (US-02.1): VEHICLE_REQUIRED / VEHICLE_ALREADY_SUBSCRIBED / INVALID_SUBSCRIPTION_PLAN
      // đều hiển thị chung 1 chỗ - vehicle đã bận gói đã bị disable sẵn ở danh sách bên dưới.
      const { message } = getApiErrorInfo(error);
      setFormError(message ?? "Unable to register. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-margin-mobile py-12 md:px-margin-desktop">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/subscription-plans")}
          aria-label="Back to plans"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-heading text-headline-lg text-on-surface">
            Select Your Vehicle
          </h1>
          <p className="mt-0.5 text-body-md text-on-surface-variant">
            Choose which vehicle this membership applies to.
          </p>
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <Loading rows={4} />
        ) : loadError ? (
          <div className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
            {loadError}
          </div>
        ) : plan ? (
          <>
            {/* Tóm tắt plan đã chọn */}
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
              <p className="text-label-md text-on-surface-variant">Selected plan</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-heading text-body-lg font-bold text-on-surface">
                  {plan.planName}
                </span>
                <span className="font-heading text-body-lg font-bold text-primary">
                  {formatCurrency(plan.price)}
                </span>
              </div>
            </div>

            {formError && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-body-md text-on-error-container">
                {formError}
              </div>
            )}

            <div className="mt-6">
              <p className="mb-3 text-label-md text-on-surface-variant">
                Your Vehicles
              </p>

              {vehicles.length === 0 ? (
                <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center text-body-md text-on-surface-variant">
                  No vehicles found. Add a vehicle first to subscribe.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {vehicles.map((v) => {
                    const isSelected = selectedVehicleId === v.id;
                    const isDisabled = v.hasActiveSubscription;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                          isDisabled
                            ? "cursor-not-allowed border-outline-variant/40 bg-surface-container opacity-60"
                            : isSelected
                              ? "border-primary bg-primary/5"
                              : "border-outline-variant bg-surface-container-lowest hover:border-primary/40"
                        }`}
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5">
                          <Car size={20} className="text-primary/60" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-body-md font-semibold text-on-surface">
                            {v.licensePlate}
                          </p>
                          <p className="text-label-sm text-on-surface-variant">
                            {v.vehicleName}
                            {isDisabled ? " · Already has an active plan" : ""}
                          </p>
                        </div>
                        {isSelected && !isDisabled && (
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
                            <Check size={14} className="text-on-primary" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedVehicleId}
              className={`mt-8 flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-body-md font-semibold transition-colors ${
                isSubmitting || !selectedVehicleId
                  ? "cursor-not-allowed bg-surface-container-high text-on-surface-variant"
                  : "bg-primary text-on-primary hover:opacity-90"
              }`}
            >
              {isSubmitting ? "Processing..." : "Continue to Payment"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
