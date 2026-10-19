import { getDocuments, getStorageUsage } from "@/actions/document.actions";
import { ModuleGuard } from "@/components/ModuleGuard";
import DocumentsClient from "./DocumentsClient";

export const metadata = {
  title: "Documents & Cloud Storage | Manageo",
  description: "Secure cloud storage and management for your personal documents and digital assets.",
};

export default async function DocumentsPage() {
  return (
    <ModuleGuard moduleId="documents">
      <DocumentsPageContent />
    </ModuleGuard>
  );
}

async function DocumentsPageContent() {
  const [docsResult, storageUsage] = await Promise.all([
    getDocuments(),
    getStorageUsage(),
  ]);

  return (
    <div className="w-full min-h-full max-w-7xl mx-auto space-y-6">
      <DocumentsClient
        initialDocuments={docsResult.documents || []}
        initialStorage={storageUsage}
      />
    </div>
  );
}
