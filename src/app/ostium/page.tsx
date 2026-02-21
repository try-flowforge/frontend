import type { Metadata } from "next";
import NavBar from "@/components/layout/Navbar";
import OstiumPerpsSetupClient from "@/components/ostium/OstiumPerpsSetupClient";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";

export const metadata: Metadata = {
  title: "Ostium Perps Setup - FlowForge",
  description:
    "Manage Ostium delegation, readiness, and allowance for Safe-based perps execution.",
};

export default function OstiumPerpsPage() {
  const setupPageEnabled =
    (process.env.NEXT_PUBLIC_OSTIUM_SETUP_PAGE_ENABLED || "true").toLowerCase() !== "false";

  if (!setupPageEnabled) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-3xl mx-auto px-4 py-20">
          <SimpleCard className="p-6">
            <Typography variant="h5" className="font-semibold text-foreground">
              Ostium Perps Setup Disabled
            </Typography>
            <Typography variant="caption" className="text-muted-foreground block mt-2">
              This page is disabled by feature flag `NEXT_PUBLIC_OSTIUM_SETUP_PAGE_ENABLED=false`.
            </Typography>
          </SimpleCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <OstiumPerpsSetupClient />
    </div>
  );
}
