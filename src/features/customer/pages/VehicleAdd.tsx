import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import VehicleForm from "../components/VehicleForm";

// Thời gian hiện thông báo thành công trước khi tự chuyển về Home (ms)
const REDIRECT_DELAY_MS = 1800;

const AddVehicle = () => {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

  // Thêm xe thành công -> hiện thông báo, sau đó tự chuyển về Home
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => {
      navigate("/", {
        state: {
          successMessage: successMessage ?? "Xe đã được thêm thành công.",
        },
      });
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isSuccess, successMessage, navigate]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-margin-mobile py-12 md:px-margin-desktop">
        <h1 className="font-headline text-headline-xl text-on-surface">
          Add New Vehicle
        </h1>
        <p className="mt-2 text-body-lg text-on-surface-variant">
          Register your car for premium detailing and service history tracking.
        </p>

        <div className="mt-8">
          {isSuccess ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-[0_10px_25px_-5px_rgba(29,78,216,0.05)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary-fixed/30 text-tertiary-fixed-dim">
                <CheckCircle2 size={28} strokeWidth={2} />
              </span>
              <p className="text-headline-md text-on-surface">
                Thêm xe thành công!
              </p>
              <p className="text-body-md text-on-surface-variant">
                Đang chuyển bạn về trang chủ...
              </p>
            </div>
          ) : (
            <VehicleForm
              onSuccess={(message) => {
                setSuccessMessage(message);
                setIsSuccess(true);
              }}
              onCancel={() => navigate(-1)}
            />
          )}
        </div>
      </div>
    </main>
  );
};

export default AddVehicle;
