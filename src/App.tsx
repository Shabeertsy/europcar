import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import VehicleDetails from "./Components/vehicle/VehicleDetails";
import BookingReview from "./Components/vehicle/BookingReview";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/vehicle/:id" element={<VehicleDetails />} />
      <Route path="/booking-review" element={<BookingReview />} />
    </Routes>
  );
}

export default App;