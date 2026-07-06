import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import VehicleForm from "../components/VehicleForm";
import type { CustomerVehicle } from "../../customer/types/profile";

const EditVehicle = () => {
  const navigate = useNavigate();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const location = useLocation();

  // Xe được Profile.tsx truyền qua navigation state khi click Edit
  // → KHÔNG gọi API để lấy lại (đúng checklist FE API-04-02)
  const vehicle = location.state?.vehicle as CustomerVehicle | undefined;

  // Nếu vào thẳng URL mà không có state (vd: paste URL) → về Profile
  if (!vehicle || !vehicleId) {
    return <Navigate to="/customer/profile" replace />;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-margin-mobile py-12 md:px-margin-desktop">
        <h1 className="font-headline text-headline-xl text-on-surface">
          Edit Vehicle
        </h1>
        <p className="mt-2 text-body-lg text-on-surface-variant">
          Update your vehicle's registration information.
        </p>

        <div className="mt-8">
          {/* Tái dùng VehicleForm với mode Edit qua vehicleId + initialData */}
          <VehicleForm
            vehicleId={Number(vehicleId)}
            initialData={{
              licensePlate: vehicle.licensePlate,
              brandName: vehicle.brandName,
              color: vehicle.color,
            }}
            onSuccess={() =>
              navigate("/customer/profile", {
                state: { vehicleUpdatedSuccess: true },
              })
            }
            onCancel={() => navigate(-1)}
          />
        </div>
      </div>
    </main>
  );
};

export default EditVehicle;
