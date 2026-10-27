import { getVaultItems } from "@/actions/vault.actions";
import VaultClient from "./VaultClient";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Secure Vault | Task Reminder',
  description: 'End-to-End Encrypted Secure Vault',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VaultPageAny = any;

export default async function VaultPage(_props: { searchParams?: Promise<Record<string, unknown>> }) {
  const { items, vaultSettings } = (await getVaultItems()) as VaultPageAny;

  return (
    <div className="w-full">
      <VaultClient initialItems={items || []} vaultSettings={vaultSettings} />
    </div>
  );
}

