import type { Metadata } from "next";
import NavBar from "@/components/layout/Navbar";
import { SchedulesPageClient } from "@/components/workspace/schedules/SchedulesPageClient";

export const metadata: Metadata = {
  title: "Schedules - FlowForge",
  description:
    "Manage scheduled workflow runs. View, create, edit, and cancel Time Block schedules.",
};

export default function SchedulesPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <SchedulesPageClient />
    </div>
  );
}

