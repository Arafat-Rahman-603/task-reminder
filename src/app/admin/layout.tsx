import { getNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = getNoIndexMetadata("Platform admin");

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
