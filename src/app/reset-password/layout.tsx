import { getNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = getNoIndexMetadata("Set a new password");

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
