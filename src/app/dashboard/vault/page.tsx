import { getVaultItems } from "@/actions/vault.actions";
import VaultClient from "./VaultClient";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Secure Vault | Task Reminder',
  description: 'End-to-End Encrypted Secure Vault',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function VaultPage(props: { searchParams?: Promise<any> | any }) {
  const { items, vaultSettings } = await getVaultItems() as any;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen w-full relative">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-32">
<VaultClient initialItems={items || []} vaultSettings={vaultSettings} />
      </div>
    </div>
  );
}

