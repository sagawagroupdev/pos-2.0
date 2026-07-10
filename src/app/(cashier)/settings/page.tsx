import { requireUser } from "@/lib/session";
import { getSettings, getCashierOutlet } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await requireUser();
  const [settings, outlet] = await Promise.all([
    getSettings(),
    getCashierOutlet(session.user.id),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Pengaturan</h1>
      <SettingsForm settings={settings} outlet={outlet} />
    </div>
  );
}
