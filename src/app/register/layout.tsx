import { getNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = getNoIndexMetadata(
  "Create account",
  "Create your free Manageo account and organize tasks, notes, money and ideas in one place."
);

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
