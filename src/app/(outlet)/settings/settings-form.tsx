"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateSettings, updateOutletInfo, updateBusinessHours } from "./actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsOutletTab } from "./settings-outlet-tab";
import { SettingsJadwalTab } from "./settings-jadwal-tab";
import { SettingsPengaturanTab } from "./settings-pengaturan-tab";
import type { StoreSettings, CashierOutlet } from "@/lib/settings";
import type { BusinessHours } from "@/lib/business-hours";
import { getDefaultBusinessHours } from "@/lib/business-hours";

export function SettingsForm({
  settings,
  outlet,
  businessHours: initialHours,
}: {
  settings: StoreSettings;
  outlet: CashierOutlet;
  businessHours?: BusinessHours;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hoursPending, startHoursTransition] = useTransition();
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    initialHours ?? getDefaultBusinessHours()
  );
  const [taxEnabled, setTaxEnabled] = useState(settings.taxEnabled);
  const [enableDraftOrders, setEnableDraftOrders] = useState(
    settings.enableDraftOrders
  );
  const [synced, setSynced] = useState({
    taxEnabled: settings.taxEnabled,
    enableDraftOrders: settings.enableDraftOrders,
  });

  if (
    synced.taxEnabled !== settings.taxEnabled ||
    synced.enableDraftOrders !== settings.enableDraftOrders
  ) {
    setSynced({
      taxEnabled: settings.taxEnabled,
      enableDraftOrders: settings.enableDraftOrders,
    });
    setTaxEnabled(settings.taxEnabled);
    setEnableDraftOrders(settings.enableDraftOrders);
  }

  function handleSaveOutlet(formData: FormData) {
    startTransition(async () => {
      const res = await updateOutletInfo(formData);
      if (res.ok) {
        toast.success("Informasi outlet disimpan");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function setDayMode(day: number, mode: "hours" | "24h" | "closed") {
    setBusinessHours((prev) => {
      const prevDay = prev[String(day)] ?? { mode: "24h" };
      return {
        ...prev,
        [String(day)]: {
          mode,
          ...(mode === "hours"
            ? {
                open: prevDay.mode === "hours" ? prevDay.open : "08:00",
                close: prevDay.mode === "hours" ? prevDay.close : "22:00",
              }
            : {}),
        },
      };
    });
  }

  function setDayTime(day: number, field: "open" | "close", value: string) {
    setBusinessHours((prev) => ({
      ...prev,
      [String(day)]: { ...prev[String(day)], [field]: value },
    }));
  }

  function handleSaveHours() {
    startHoursTransition(async () => {
      const fd = new FormData();
      for (let d = 1; d <= 7; d++) {
        const day = businessHours[String(d)] ?? { mode: "24h" };
        fd.set(`hours[${d}][mode]`, day.mode);
        if (day.mode === "hours") {
          fd.set(`hours[${d}][open]`, day.open ?? "08:00");
          fd.set(`hours[${d}][close]`, day.close ?? "22:00");
        }
      }
      const res = await updateBusinessHours(fd);
      if (res.ok) {
        toast.success("Jam operasional disimpan");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function handleAutoSave(field: string, value: boolean, label: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set(field, value ? "on" : "off");
      const res = await updateSettings(fd);
      if (res.ok) {
        toast.success(value ? `${label} diaktifkan` : `${label} dinonaktifkan`);
        router.refresh();
      } else {
        if (field === "taxEnabled") setTaxEnabled(!value);
        if (field === "enableDraftOrders") setEnableDraftOrders(!value);
        toast.error(res.error);
      }
    });
  }

  return (
    <Tabs defaultValue="outlet" className="w-full">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="outlet">Outlet</TabsTrigger>
        <TabsTrigger value="jadwal">Jadwal</TabsTrigger>
        <TabsTrigger value="pengaturan">Pengaturan umum</TabsTrigger>
      </TabsList>

      <TabsContent value="outlet">
        <SettingsOutletTab
          outlet={outlet}
          pending={pending}
          onSubmit={handleSaveOutlet}
        />
      </TabsContent>

      <TabsContent value="jadwal">
        <SettingsJadwalTab
          businessHours={businessHours}
          hoursPending={hoursPending}
          onSetDayMode={setDayMode}
          onSetDayTime={setDayTime}
          onSave={handleSaveHours}
        />
      </TabsContent>

      <TabsContent value="pengaturan">
        <SettingsPengaturanTab
          taxEnabled={taxEnabled}
          enableDraftOrders={enableDraftOrders}
          onTaxToggle={(checked) => {
            setTaxEnabled(checked);
            handleAutoSave("taxEnabled", checked, "Pajak");
          }}
          onDraftToggle={(checked) => {
            setEnableDraftOrders(checked);
            handleAutoSave("enableDraftOrders", checked, "Pesanan draft");
          }}
        />
      </TabsContent>
    </Tabs>
  );
}
