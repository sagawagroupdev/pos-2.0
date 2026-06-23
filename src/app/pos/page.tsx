import { requireRole } from "@/lib/session";
import { getMenu } from "@/lib/menu";
import { getSettings } from "@/lib/settings";
import { PosHeader } from "./pos-header";
import { PosTerminal } from "./pos-terminal";

export default async function PosPage() {
  const session = await requireRole("CASHIER");
  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);

  return (
    <div className="flex h-screen flex-col">
      <PosHeader storeName={settings.storeName} cashierId={session.user.id} />
      <PosTerminal
        menu={menu}
        cashierName={session.user.name}
        store={{
          storeName: settings.storeName,
          address: settings.address,
          phone: settings.phone,
          receiptFooter: settings.receiptFooter,
        }}
        taxRate={settings.taxRate}
        taxEnabled={settings.taxEnabled}
      />
    </div>
  );
}
