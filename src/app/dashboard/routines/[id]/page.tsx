import { getRoutineById } from "@/actions/routine.actions";
import { notFound } from "next/navigation";
import RoutineDetailClient from "./RoutineDetailClient";

export default async function RoutineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const routine = await getRoutineById(id);

  if (!routine) {
    notFound();
  }

  return <RoutineDetailClient routine={routine} />;
}
