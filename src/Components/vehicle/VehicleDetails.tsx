import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search, Users, Car, Gauge, Loader2 } from "lucide-react";
import { BASE_URL } from "../../config/constants";

type Vehicle = {
  id: string | number;
  vehicle_name?: string;
  seats?: number;
  doors?: number;
  engine_cc?: number;
  images?: string[];
  category?: string | { name?: string };
  ac?: boolean;
  type?: string | { name?: string };
  description?: string;
  base_price?: number;
  [k: string]: any;
};

type Accessory = {
  id: string;
  name: string;
  price: number;
  per_day?: number;
  includes_tax?: boolean;
};

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    pickupLocation = "Dubai Al Quoz Head Office",
    returnLocation = "Dubai Al Quoz Head Office",
    pickupDate = "2025-11-16",
    pickupTime = "10:00",
    returnDate = "2025-12-14",
    returnTime = "08:00"
  } = location.state || {};

  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);

  useEffect(() => {
    async function fetchAccessories() {
      try {
        const res = await fetch(
          `${BASE_URL}/api/accessories/?vehicle_uuid=${id}`
        );
        if (!res.ok) throw new Error("Failed to fetch accessories");
        setAccessories(await res.json());
      } catch {
        setAccessories([]);
      }
    }
    fetchAccessories();
  }, [id]);

  useEffect(() => {
    async function fetchVehicle() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${BASE_URL}/api/vehicles/details/?uuid=${id}`
        );
        if (!res.ok) throw new Error("Vehicle not found");
        setVehicle(await res.json());
      } catch (e: any) {
        setError(e?.message ?? "Failed to load vehicle");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchVehicle();
  }, [id]);

  const getCategory = () => {
    if (!vehicle?.category) return "4X4";
    return typeof vehicle.category === "string"
      ? vehicle.category
      : vehicle.category.name ?? "4X4";
  };

  const getType = () => {
    if (!vehicle?.type) return "SUV";
    return typeof vehicle.type === "string"
      ? vehicle.type
      : vehicle.type.name ?? "SUV";
  };

  const total = () => {
    const vehicleBase =
      vehicle?.base_price != null
        ? Number(vehicle.base_price)
        : vehicle?.price != null
        ? Number(vehicle.price)
        : 0;
    const accessoriesTotal = selectedAccessories.reduce((total, aid) => {
      const acc = accessories.find((a) => a.id === aid);
      return acc && acc.price != null ? total + Number(acc.price) : total;
    }, 0);
    return vehicleBase + accessoriesTotal;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error ?? "Vehicle not found"}</p>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition"
      >
        <ArrowLeft className="w-5 h-5 text-black" />
        <span className="text-black font-medium">Back</span>
      </button>

      <div className="flex flex-col lg:flex-row items-start justify-center gap-8 p-6 lg:p-12 max-w-7xl mx-auto">
        {/* Vehicle Details Column */}
        <div className="flex-1 flex flex-col space-y-6">
          <div className="relative">
            {vehicle.images?.[0] ? (
              <img
                src={vehicle.images[0]}
                alt={vehicle.vehicle_name ?? ""}
                className="w-full rounded-2xl object-contain bg-black"
              />
            ) : (
              <div className="bg-gray-800 h-64 rounded-2xl flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
            <button className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg">
              <Search className="w-5 h-5 text-black" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold">
              {vehicle.vehicle_name ?? "—"}
            </h1>
            <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full">
              {getCategory()}
            </span>
          </div>

          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <span className="text-green-500">Check</span> Category: {getCategory()}
            </p>
            <p className="flex items-center gap-2">
              <span className="text-green-500">Check</span> AC: {vehicle.ac ? "Yes" : "No"}
            </p>
            <p className="flex items-center gap-2">
              <span className="text-green-500">Check</span> Type: {getType()}
            </p>
          </div>

          <p className="text-sm text-gray-400">
            {vehicle.description ??
              "Full-size SUV, 4WD, 5 doors, typically 7 seats, AC (Air Conditioning)."}
          </p>

          <div className="flex justify-center gap-8 text-gray-400 text-sm border-t border-gray-800 pt-4">
            <div className="flex flex-col items-center gap-1 min-w-[76px]">
              <Users className="w-5 h-5 mx-auto" />
              <span className="whitespace-nowrap">
                {vehicle.seats ?? "—"} Seat
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[76px]">
              <Car className="w-5 h-5 mx-auto" />
              <span className="whitespace-nowrap">
                {vehicle.doors ?? "4"} Door
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[76px]">
              <Gauge className="w-5 h-5 mx-auto" />
              <span className="whitespace-nowrap">
                {vehicle.engine_cc ?? "4000"} CC
              </span>
            </div>
          </div>
        </div>
        {/* /Vehicle Details Column */}

        {/* Accessories Column */}
        <div className="w-full lg:w-96 bg-white rounded-2xl p-6 space-y-4 text-black flex flex-col">
          <h3 className="font-bold text-lg text-center">Accessories</h3>
          <div className="space-y-3">
            {accessories.map((acc) => (
              <label
                key={acc.id}
                className="flex items-center justify-between cursor-pointer border-b last:border-b-0 border-gray-200 pb-3"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    checked={selectedAccessories.includes(acc.id)}
                    onChange={(e) => {
                      setSelectedAccessories((p) =>
                        e.target.checked
                          ? [...p, acc.id]
                          : p.filter((i) => i !== acc.id)
                      );
                    }}
                  />
                  <div className="flex flex-col justify-center">
                    <p className="font-medium leading-tight">{acc.name}</p>
                    <p className="text-xs text-gray-500">
                      Includes 5.0% tax
                    </p>
                  </div>
                </div>
                <div className="text-right min-w-[85px] flex flex-col items-end">
                  <p className="font-bold whitespace-nowrap">AED {acc.price}</p>
                  {acc.per_day && (
                    <p className="text-xs text-gray-500">
                      (AED {acc.price} / day)
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span>Base Rental Price:</span>
              <span className="font-bold">
                AED {(vehicle.base_price ?? 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Selected Accessories:</span>
              <span>
                AED{" "}
                {selectedAccessories
                  .reduce(
                    (s, aid) =>
                      s +
                      (accessories.find((a) => a.id === aid)
                        ? Number(accessories.find((a) => a.id === aid)!.price)
                        : 0),
                    0
                  )
                  .toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
              <span>Total Price:</span>
              <span>AED {total().toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => {
              const bookingData = {
                vehicle,
                pickupLocation,
                returnLocation,
                pickupDate,
                pickupTime,
                returnDate,
                returnTime,
                selectedAccessories,
                totalPrice: total(),
              };
              navigate("/booking-review", { state: { booking: bookingData } });
            }}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-full transition-all shadow-md hover:shadow-lg mt-2"
          >
            Continue
          </button>
          <div className="flex flex-col gap-1 pt-2">
            <p className="text-xs text-gray-500 text-center">
              <a href="#" className="underline">
                Why are accessories important? Learn more
              </a>
            </p>
            <p className="text-xs text-gray-500 text-center">
              Price includes 4000 KM per month.
            </p>
          </div>
        </div>
        {/* /Accessories Column */}
      </div>
    </div>
  );
}