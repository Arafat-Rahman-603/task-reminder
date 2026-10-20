import { getNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = getNoIndexMetadata("Reset access");

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
