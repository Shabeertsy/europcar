import  { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Menu,
  Calendar,
  Clock,
  Users,
  Gauge,
  Car,
  Check,
  Search,
} from "lucide-react";

import { BASE_URL } from "../config/constants";

type Vehicle = {
  id: string | number;
  vehicle_name?: string;
  seats?: number;
  doors?: number;
  engine_cc?: number;
  price?: string | number;
  images?: string[];
  category?: string;
  ac?: boolean;
  type?: string;
  description?: string;
  base_price?: number;
  uuid?: string;
  [key: string]: any;
};

type Location = {
  id: string | number;
  location_name: string;
  type: "pickup" | "return";
  [key: string]: any;
};

// Helper function for date formatting (yyyy-mm-dd)
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function toTimeString(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}
// Get today's date and time
const getDefaultPickup = () => {
  const now = new Date();
  return {
    date: toDateString(now),
    time: toTimeString(now),
  };
};
// Get return date (pickup + 28 days), time fixed 10:00
const getDefaultReturn = () => {
  const now = new Date();
  now.setDate(now.getDate() + 28);
  return {
    date: toDateString(now),
    time: "10:00",
  };
};

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const [pickupLocations, setPickupLocations] = useState<Location[]>([]);
  const [returnLocations, setReturnLocations] = useState<Location[]>([]);
  
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [returnLocation, setReturnLocation] = useState<Location | null>(null);

  const defaultPickup = getDefaultPickup();
  const defaultReturn = getDefaultReturn();

  const [pickupDate, setPickupDate] = useState(defaultPickup.date);
  const [pickupTime, setPickupTime] = useState(defaultPickup.time);
  const [returnDate, setReturnDate] = useState(defaultReturn.date);
  const [returnTime, setReturnTime] = useState(defaultReturn.time);

  const [openVehicle, setOpenVehicle] = useState<Vehicle | null>(null);


  const searchVehicles = async (
    opts?: {
      pickupLoc?: Location | null;
      returnLoc?: Location | null;
      pickupDate?: string;
      pickupTime?: string;
      returnDate?: string;
      returnTime?: string;
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const pl = opts?.pickupLoc ?? pickupLocation;
      const rl = opts?.returnLoc ?? returnLocation;
      const pd = opts?.pickupDate ?? pickupDate;
      const pt = opts?.pickupTime ?? pickupTime;
      const rd = opts?.returnDate ?? returnDate;
      const rt = opts?.returnTime ?? returnTime;

      if (pl) params.append("pickup_location", pl.id.toString());
      if (rl) params.append("return_location", rl.id.toString());
      if (pd) params.append("pickup_date", pd);
      if (pt) params.append("pickup_time", pt);
      if (rd) params.append("return_date", rd);
      if (rt) params.append("return_time", rt);

      const apiUrl =
        params.toString().length > 0
          ? `${BASE_URL}/api/vehicles/?${params.toString()}`
          : `${BASE_URL}/api/vehicles/`;

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      const data = await res.json();
      setVehicles(data);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      pickupLocation &&
      returnLocation &&
      pickupDate !== "" &&
      pickupTime !== "" &&
      returnDate !== "" &&
      returnTime !== ""
    ) {
      searchVehicles();
    }
  }, [pickupLocation, returnLocation, pickupDate, pickupTime, returnDate, returnTime]);

  useEffect(() => {
    async function fetchLocations(type: "pickup" | "return") {
      try {
        const res = await fetch(`${BASE_URL}/api/locations/?type=${type}`);
        if (!res.ok) throw new Error(`Failed to fetch ${type} locations`);
        return await res.json();
      } catch {
        return [];
      }
    }

    async function loadLocations() {
      const [pickupData, returnData] = await Promise.all([
        fetchLocations("pickup"),
        fetchLocations("return"),
      ]);
      setPickupLocations(pickupData);
      setReturnLocations(returnData);

      // set default pickup/return locations if not set already (use the first Location object)
      setPickupLocation((prev) => prev !== null ? prev : (pickupData.length ? pickupData[0] : null));
      setReturnLocation((prev) => prev !== null ? prev : (returnData.length ? returnData[0] : null));
    }

    loadLocations();
    // eslint-disable-next-line
  }, []);

  const formatDate = (date: string) => {
    if (!date) return "—";
    const d = new Date(date);
    const day = d.toLocaleString("en-US", { weekday: "short" });
    const month = d.toLocaleString("en-US", { month: "short" });
    const dayNum = d.getDate();
    return `${day}, ${month} ${dayNum}`;
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    if (typeof h === "undefined" || typeof m === "undefined") return "";
    const hour = Number(h);
    if (isNaN(hour)) return "";
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  // Remove calculateTotal and accessories price logic for removed accessories section

  // Helper for price label
  const getDisplayPrice = (price: number | string | undefined) => {
    if (price === undefined || price === null || price === "") return "—";
    if (typeof price === "number" && !isNaN(price))
      return `AED ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (typeof price === "string" && !isNaN(Number(price)))
      return `AED ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return String(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Vehicle Details Modal */}
      {openVehicle && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50"
          onClick={() => setOpenVehicle(null)}
        >
          <div
            className="bg-gray-900 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2 gap-8 p-8">
              <div className="space-y-6">
                <div className="relative">
                  {openVehicle.images?.[0] ? (
                    <img
                      src={openVehicle.images[0]}
                      alt={openVehicle.vehicle_name}
                      className="w-full rounded-2xl object-contain bg-black"
                    />
                  ) : (
                    <div className="bg-gray-800 h-64 rounded-2xl flex items-center justify-center">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                  <button className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg">
                    <Search className="w-5 h-5" />
                  </button>
                </div>

                <h1 className="text-2xl font-bold text-white">{openVehicle.vehicle_name}</h1>

                {/* Show price under name */}
                <div className="text-lg font-semibold text-yellow-300">
                  {getDisplayPrice(openVehicle.price)}
                </div>

                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Category: {openVehicle.category || "4X4"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    AC: {openVehicle.ac ? "Yes" : "No"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Type: {openVehicle.type || "SUV"}
                  </p>
                </div>

                <p className="text-sm text-gray-400">
                  {openVehicle.description ||
                    "Full-size SUV, 4WD, 5 doors, typically 7 seats, AC (Air Conditioning)."}
                </p>

                <div className="flex justify-center gap-8 text-gray-400 text-sm border-t border-gray-800 pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>{openVehicle.seats ?? "—"} Seats</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    <span>{openVehicle.doors ?? "4"} Door</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    <span>{openVehicle.engine_cc ?? "4000"} CC</span>
                  </div>
                </div>
              </div>

              {/* Right: REMOVE Accessories Panel */}
              {/* Instead, show summary or leave panel blank/with a continue button */}
              <div className="bg-white rounded-2xl p-6 space-y-4 text-black flex flex-col justify-center items-center">
                <div className="font-bold text-lg mb-4">Ready to Continue?</div>
                <div className="font-semibold text-base mb-2">
                  Base Rental Price: AED {(openVehicle.base_price || 8561.70).toFixed(2)}
                </div>
                <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-full transition-all shadow-md hover:shadow-lg">
                  Continue
                </button>
                <p className="text-xs text-gray-500 text-center mt-4">
                  Price includes 4000 KM per month.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <div className="bg-green-600 text-white font-bold text-xl px-4 py-1 rounded">
              Europcar
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <button className="p-2 rounded-full bg-green-600">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full bg-green-600">
              <Mail className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="bg-black py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-6 items-end">
              {/* Pickup Location */}
              <div className="flex flex-col gap-1">
                <label className="text-[15px] font-semibold text-gray-700">Pickup Location</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 text-base"
                  value={pickupLocation?.id ?? ""}
                  onChange={(e) => {
                    const location = pickupLocations.find(loc => String(loc.id) === e.target.value);
                    setPickupLocation(location || null);
                  }}
                >
                  {pickupLocations.length === 0 ? (
                    <option>Loading…</option>
                  ) : (
                    pickupLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.location_name}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Return Location */}
              <div className="flex flex-col gap-1">
                <label className="text-[15px] font-semibold text-gray-700">Return Location</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 text-base"
                  value={returnLocation?.id ?? ""}
                  onChange={(e) => {
                    const location = returnLocations.find(loc => String(loc.id) === e.target.value);
                    setReturnLocation(location || null);
                  }}
                >
                  {returnLocations.length === 0 ? (
                    <option>Loading…</option>
                  ) : (
                    returnLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.location_name}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Pickup Date & Time */}
              <div className="flex flex-col gap-1">
                <label className="text-[15px] font-semibold text-gray-700">Pickup Date & Time</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                    onClick={() => (document.getElementById("pickup-date-input") as HTMLInputElement)?.showPicker?.()}
                  >
                    <span>{pickupDate ? formatDate(pickupDate) : "Date"}</span>
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                    onClick={() => (document.getElementById("pickup-time-input") as HTMLInputElement)?.showPicker?.()}
                  >
                    <span>{pickupTime ? formatTime(pickupTime) : "Time"}</span>
                    <Clock className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <input id="pickup-date-input" type="date" className="sr-only" value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
                <input id="pickup-time-input" type="time" className="sr-only" value={pickupTime} onChange={e => setPickupTime(e.target.value)} />
              </div>

              {/* Return Date & Time */}
              <div className="flex flex-col gap-1">
                <label className="text-[15px] font-semibold text-gray-700">Return Date & Time</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                    onClick={() => (document.getElementById("return-date-input") as HTMLInputElement)?.showPicker?.()}
                  >
                    <span>{returnDate ? formatDate(returnDate) : "Date"}</span>
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                    onClick={() => (document.getElementById("return-time-input") as HTMLInputElement)?.showPicker?.()}
                  >
                    <span>{returnTime ? formatTime(returnTime) : "Time"}</span>
                    <Clock className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <input id="return-date-input" type="date" className="sr-only" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
                <input id="return-time-input" type="time" className="sr-only" value={returnTime} onChange={e => setReturnTime(e.target.value)} />
              </div>

              <div>
                <button
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg text-lg tracking-wider shadow-sm"
                  onClick={() => searchVehicles()}
                >
                  SEARCH
                </button>
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-500">Return date must be at least 28 days after pickup date.</p>
          </div>
        </div>
      </section>

      {/* Vehicle List */}
      <section className="bg-black py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-green-600 text-2xl font-bold mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Available Cars
          </h2>

          <div className="bg-gray-900 text-white rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400">RENTAL LOCATION, DATE & TIME</p>
                <div className="mt-2">
                  <p className="font-semibold">Pickup</p>
                  <p className="text-sm">{pickupLocation?.location_name || "—"}</p>
                  <p className="text-sm text-gray-400">{pickupDate && pickupTime ? `${formatDate(pickupDate)} ${formatTime(pickupTime)}` : "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">&nbsp;</p>
                <div className="mt-2">
                  <p className="font-semibold">Return</p>
                  <p className="text-sm">{returnLocation?.location_name || "—"}</p>
                  <p className="text-sm text-gray-400">{returnDate && returnTime ? `${formatDate(returnDate)} ${formatTime(returnTime)}` : "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-white text-center py-8">Loading vehicles…</div>
            ) : error ? (
              <div className="col-span-full text-red-500 text-center py-8">Failed to load vehicles: {error}</div>
            ) : vehicles.length === 0 ? (
              <div className="col-span-full text-gray-400 text-center py-8">No vehicles available.</div>
            ) : (
              vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-gray-900 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
                  onClick={() => {
                    setOpenVehicle(vehicle);
                  }}
                >
                  <div className="relative h-56 bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center p-6">
                    {vehicle.images?.[0] ? (
                      <img src={vehicle.images[0]} alt={vehicle.vehicle_name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="bg-gray-700 border-2 border-dashed border-gray-600 rounded-xl w-full h-40 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-green-600 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                      In Stock
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <h3 className="text-white font-bold text-lg leading-tight">{vehicle.vehicle_name}</h3>
                    {/* Insert Price Here */}
                    <div className="text-yellow-300 font-semibold text-base">
                      {getDisplayPrice(vehicle.price)}{(vehicle.price !== undefined && vehicle.price !== "") ? " " : ""}
                    </div>

                    <div className="flex items-center justify-between text-gray-400 text-sm border-t border-gray-800 pt-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <span>{vehicle.seats ?? "—"} Seats</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car className="w-5 h-5" />
                        <span>{vehicle.doors ?? "4"} Door</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gauge className="w-5 h-5" />
                        <span>{vehicle.engine_cc ?? "4000"} CC</span>
                      </div>
                    </div>

                    <button
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg py-3 rounded-full transition-all shadow-md hover:shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Pass selection in state to Vehicle Details page. Pass the full location objects.
                        navigate(`/vehicle/${vehicle.uuid}`, {
                          state: {
                            pickupLocation,
                            returnLocation,
                            pickupDate,
                            pickupTime,
                            returnDate,
                            returnTime,
                          },
                        });
                      }}
                    >
                      Book Now!
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
