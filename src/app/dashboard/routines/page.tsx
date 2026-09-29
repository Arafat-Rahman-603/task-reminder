import { getRoutines } from "@/actions/routine.actions";
import RoutineClient from "./RoutineClient";

export default async function RoutinesPage() {
  const { routines } = await getRoutines();

  return (
    <div className="w-full min-h-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-on-surface mb-6 px-4 sm:px-0">My Routines</h1>
      <RoutineClient initialRoutines={routines} />
    </div>
  );
}
