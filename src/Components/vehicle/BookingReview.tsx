import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

type LocationInfo = {
  id: string | number;
  type?: string;
  location_name?: string;
  emirate?: string;
  emirate_name?: string;
  state?: string;
  district?: string;
  location?: string;
  location_map_id?: string | number;
};

type BookingData = {
  vehicle: {
    id: string | number;
    vehicle_name?: string;
    images?: string[];
    category?: string | { name?: string };
    price?: number;
  };
  pickupLocation: string | LocationInfo;
  returnLocation: string | LocationInfo;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  selectedAccessories: string[];
  totalPrice: number;
};

const accessories = [
  { id: "1", name: "Additional Driver", price: 262.5 },
  { id: "2", name: "SCDW Walkin (Monthly)", price: 476.0 },
  { id: "3", name: "Delivery Surcharge (Dubai)", price: 52.5 },
  { id: "4", name: "Collection Surcharges (Dubai)", price: 52.5 },
  { id: "5", name: "Child Seat - Monthly", price: 262.5 },
];

function displayLocation(loc: string | LocationInfo): string {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  const parts: string[] = [];
  if (loc.location_name) parts.push(loc.location_name);
  if (loc.district) parts.push(loc.district);
  if (loc.state) parts.push(loc.state);
  if (loc.emirate_name) parts.push(loc.emirate_name);
  else if (loc.emirate) parts.push(loc.emirate);
  if (loc.location && !parts.includes(loc.location)) parts.push(loc.location);
  const result = parts.filter(Boolean).join(", ");
  return result || (loc.id?.toString() ?? "");
}

// Map frontend form fields to backend VehicleBooking fields
function buildBookingPayload(form: any, booking: BookingData) {
  function parseDateInput(d: string) {
    if (!d) return null;
    if (d.includes("-")) {
      return d;
    }
    // Support dd/mm/yyyy as fallback
    const [day, month, year] = d.split("/");
    if (!day || !month || !year) return null;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  function buildDateTime(dateStr: string, timeStr: string) {
    let isoDate = dateStr;
    if (isoDate.includes("/")) {
      isoDate = parseDateInput(isoDate)!;
    }
    return `${isoDate}T${timeStr}:00`;
  }
  function extractLocationIdOrString(loc: string | LocationInfo) {
    if (!loc) return "";
    if (typeof loc === "object" && "id" in loc && loc.id) {
      return loc.id;
    }
    return loc;
  }

  return {
    vehicle: booking.vehicle.id,
    first_name: form.firstName,
    last_name: form.lastName,
    date_of_birth: parseDateInput(form.dob),
    nationality: form.nationality,
    phone_number: form.phone,
    email_address: form.email,
    address: form.address,
    country_region: "United Arab Emirates",
    driving_license_number: form.licenseNumber,
    driving_license_expiry_on: parseDateInput(form.licenseExpiry),
    driving_license_issuer: form.licenseIssuer,
    start_date: buildDateTime(booking.pickupDate, booking.pickupTime),
    end_date: buildDateTime(booking.returnDate, booking.returnTime),
    pickup_location: extractLocationIdOrString(booking.pickupLocation),
    dropoff_location: extractLocationIdOrString(booking.returnLocation),
    total_amount: booking.totalPrice,
    selected_accessories: booking.selectedAccessories,
  };
}

export default function BookingReview() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const booking: BookingData | null = state?.booking || null;

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    nationality: "",
    phone: "",
    email: "",
    address: "",
    licenseNumber: "",
    licenseExpiry: "",
    licenseIssuer: "",
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!booking) {
      navigate("/", { replace: true });
    }
  }, [booking, navigate]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.firstName) newErrors.firstName = "Required";
    if (!form.lastName) newErrors.lastName = "Required";
    if (!form.dob) newErrors.dob = "Required";
    if (!form.nationality) newErrors.nationality = "Required";
    if (!form.phone) newErrors.phone = "Required";
    if (!form.email) newErrors.email = "Required";
    if (!form.licenseNumber) newErrors.licenseNumber = "Required";
    if (!form.licenseExpiry) newErrors.licenseExpiry = "Required";
    if (!form.licenseIssuer) newErrors.licenseIssuer = "Required";
    if (!form.termsAccepted) newErrors.terms = "You must accept terms";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setApiError(null);
    if (!booking) return;
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = buildBookingPayload(form, booking);

      const apiPayload = { ...payload };
    //   delete apiPayload.selected_accessories;

      const response = await fetch('http://127.0.0.1:8000/api/booking/create/', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const rsp = await response.json().catch(() => ({}));
        setApiError(rsp?.detail || "Failed to submit booking. Please try again.");
      }
    } catch (err) {
      setApiError("Failed to submit booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex-col flex items-center justify-center text-center p-8">
        <div className="rounded-full bg-green-600 mb-6 flex items-center justify-center w-20 h-20">
          <svg xmlns="http://www.w3.org/2000/svg" className="text-white w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="mb-6 text-lg text-gray-200">
          Thank you for your reservation. We have received your booking!
        </p>
        <button
          className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-2 rounded-full font-bold transition"
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>
      </div>
    );
  }

  const formatDateTime = (date: string, time: string) => {
    let d: Date;
    if (date.includes("/")) {
      // dd/mm/yyyy
      const [day, month, year] = date.split("/");
      d = new Date(`${year}-${month}-${day}T${time}:00`);
    } else {
      d = new Date(`${date}T${time}:00`);
    }
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };
    const formatted = d.toLocaleDateString("en-US", options);
    let [h, m] = time.split(":");
    let hour = Number(h) % 12 || 12;
    let ampm = Number(h) >= 12 ? "PM" : "AM";
    return `${formatted} ${hour}:${m} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition"
      >
        <ArrowLeft className="w-5 h-5 text-black" />
        <span className="text-black font-medium">Back</span>
      </button>

      <div className="max-w-7xl mx-auto p-6 lg:p-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Review Your Booking</h1>
          <p className="text-2xl font-bold">AED {booking.totalPrice.toFixed(2)}</p>
        </div>
        {apiError && (
          <div className="bg-red-600 text-white rounded px-4 py-2 mb-6">{apiError}</div>
        )}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Billing Details */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Billing details</h3>
              <div className="bg-gray-800 rounded-xl p-6 text-sm">
                <p className="text-gray-400 uppercase text-xs mb-2">
                  Rental Location, Date & Time
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Pickup</p>
                    <p>{displayLocation(booking.pickupLocation)}</p>
                    <p className="text-gray-400">
                      {formatDateTime(booking.pickupDate, booking.pickupTime)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Return</p>
                    <p>{displayLocation(booking.returnLocation)}</p>
                    <p className="text-gray-400">
                      {formatDateTime(booking.returnDate, booking.returnTime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Personal Data Form */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Data</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-full bg-white text-black"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-full bg-white text-black"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 rounded-full bg-white text-black"
                      value={form.dob}
                      onChange={(e) => setForm({ ...form, dob: e.target.value })}
                      max={new Date().toISOString().split("T")[0]}
                    />
                    {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nationality <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-full bg-white text-black"
                      value={form.nationality}
                      onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    />
                    {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 rounded-full bg-white text-black"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 rounded-full bg-white text-black"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="Apartment, suite, unit, etc. (optional)"
                    className="w-full px-4 py-2 rounded-full bg-white text-black"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <p className="text-sm">
                  Country / Region: <strong>United Arab Emirates</strong>
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Driving License Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-full bg-white text-black"
                      value={form.licenseNumber}
                      onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                    />
                    {errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Driving License Expiry On <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 rounded-full bg-white text-black"
                      value={form.licenseExpiry}
                      onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                    />
                    {errors.licenseExpiry && <p className="text-red-500 text-xs mt-1">{errors.licenseExpiry}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Driving License Issuer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-full bg-white text-black"
                    value={form.licenseIssuer}
                    onChange={(e) => setForm({ ...form, licenseIssuer: e.target.value })}
                  />
                  {errors.licenseIssuer && <p className="text-red-500 text-xs mt-1">{errors.licenseIssuer}</p>}
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-green-600"
                    checked={form.termsAccepted}
                    onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })}
                  />
                  <span>
                    I confirm that I accept all{" "}
                    <a href="#" className="underline text-yellow-400">
                      terms and conditions
                    </a>
                    . <span className="text-red-500">*</span>
                  </span>
                </label>
                {errors.terms && <p className="text-red-500 text-xs">{errors.terms}</p>}
              </div>
            </div>
          </div>

          {/* Right: Summary + Payment */}
          <div className="space-y-6">
            {/* Vehicle Summary */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800">
                  {booking.vehicle.images?.[0] ? (
                    <img
                      src={booking.vehicle.images[0]}
                      alt={booking.vehicle.vehicle_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{booking.vehicle.vehicle_name}</p>
                  <p className="text-sm text-gray-400">
                    {typeof booking.vehicle.category === "object"
                      ? booking.vehicle.category.name
                      : booking.vehicle.category}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-bold">
                    AED {typeof booking.vehicle.price === "number" || typeof booking.vehicle.price === "string"
                      ? Number(booking.vehicle.price).toFixed(2)
                      : (booking.vehicle.price ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {booking.selectedAccessories.length > 0 && (
                <div className="border-t border-gray-700 pt-4">
                  {booking.selectedAccessories.map((id) => {
                    const acc = accessories.find((a) => a.id === id);
                    return acc ? (
                      <div key={id} className="flex justify-between text-sm py-1">
                        <span>{acc.name}</span>
                        <span>AED {acc.price.toFixed(2)}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="flex justify-between font-bold">
                  <span>Subtotal</span>
                  <span>AED {booking.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
            {/* Payment */}
            <div className="bg-gray-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Credit Card</p>
                <div className="flex gap-2">
                  <div className="w-10 h-6 bg-red-600 rounded" />
                  <div className="w-10 h-6 bg-blue-600 rounded" />
                </div>
              </div>
              <input
                type="text"
                placeholder="Pay securely by Credit/Debit Card."
                className="w-full px-4 py-3 rounded-full bg-gray-700 text-white"
                readOnly
              />
              <p className="text-xs text-gray-400">
                Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
              </p>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-full transition-all shadow-md hover:shadow-lg ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? "Placing Order..." : "Place order"}
              </button>
            </div>
            <p className="text-xs text-yellow-400">
              (Price includes 4000 KM per month. Anything beyond this KM will be charged as per Terms and Conditions)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}