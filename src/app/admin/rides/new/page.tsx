import { RideForm } from "../ride-form";
import { createRide } from "../../actions";

export default function NewRidePage() {
  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">New Ride</h2>
      <RideForm action={createRide} />
    </div>
  );
}
