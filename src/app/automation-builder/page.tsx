import type { Metadata } from "next";
import WorkflowPageClient from "@/components/workspace/WorkflowPageClient";
import { WorkflowProvider } from "@/context/WorkflowContext";

export const metadata: Metadata = {
  title: "Automation Builder - FlowForge",
  description:
    "Build powerful automation workflows with drag-and-drop blocks. Connect Web2 and Web3 services to automate your workflows.",
};

export default function WorkflowPage() {
  return (
    <WorkflowProvider>
      <WorkflowPageClient />
    </WorkflowProvider>
  );
}