import { getNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = getNoIndexMetadata("Workspace setup");

export default function WorkspacesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
