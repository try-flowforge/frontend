import type { Metadata } from "next";
import NavBar from "@/components/layout/Navbar";
import { PublicWorkflowsGallery } from "@/components/workspace/public-workflows/PublicWorkflowsGallery";
import { WorkflowProvider } from "@/context/WorkflowContext";

export const metadata: Metadata = {
    title: "Public Workflows - FlowForge",
    description:
        "Discover and use public automation workflows created by the community.",
};

export default function PublicWorkflowsPage() {
    return (
        <div className="min-h-screen bg-background">
            <NavBar />
            <WorkflowProvider>
                <PublicWorkflowsGallery />
            </WorkflowProvider>
        </div>
    );
}
