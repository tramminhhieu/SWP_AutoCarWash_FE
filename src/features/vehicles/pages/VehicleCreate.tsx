import { useNavigate } from "react-router-dom";
import VehicleForm from "../components/VehicleForm";

const VehicleCreate = () => {
  const navigate = useNavigate();

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
          <VehicleForm
            onSuccess={() => navigate("/customer/profile")}
            onCancel={() => navigate(-1)}
          />
        </div>
      </div>
    </main>
  );
};

export default VehicleCreate;
