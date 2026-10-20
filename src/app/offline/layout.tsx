import { getNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = getNoIndexMetadata("Offline");

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
