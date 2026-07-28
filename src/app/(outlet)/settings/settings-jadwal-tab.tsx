"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BusinessHours } from "@/lib/business-hours";

const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

function TimeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [h, m] = value.split(":");

  return (
    <span className="inline-flex items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-sm">
      <Select value={h ?? "08"} onValueChange={(v) => onChange(`${v}:${m ?? "00"}`)}>
        <SelectTrigger size="sm" className="w-10 border-0 bg-transparent px-0!">
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="top" align="center">
          {hours.map((h) => (
            <SelectItem key={h} value={h}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select value={m ?? "00"} onValueChange={(v) => onChange(`${h ?? "08"}:${v}`)}>
        <SelectTrigger size="sm" className="w-10 border-0 bg-transparent px-0!">
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="top" align="center">
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </span>
  );
}

export function SettingsJadwalTab({
  businessHours,
  hoursPending,
  onSetDayMode,
  onSetDayTime,
  onSave,
}: {
  businessHours: BusinessHours;
  hoursPending: boolean;
  onSetDayMode: (day: number, mode: "hours" | "24h" | "closed") => void;
  onSetDayTime: (day: number, field: "open" | "close", value: string) => void;
  onSave: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jam Operasional</CardTitle>
        <CardDescription>
          Atur jam buka outlet setiap hari. Pelanggan tidak bisa melakukan QR order di luar jam operasional.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y border-t">
          {Array.from({ length: 7 }, (_, i) => {
            const d = i + 1;
            const day = businessHours[String(d)] ?? { mode: "24h" };
            return (
            <div key={d} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="w-16 text-sm font-medium">{dayNames[i]}</span>
              <div className="flex gap-1">
                {(["hours", "24h", "closed"] as const).map((m) => {
                  const isActive = day.mode === m;
                  let variant: "default" | "secondary" | "destructive" = "secondary";
                  if (isActive && m === "hours") variant = "default";
                  else if (isActive && m === "24h") variant = "default";
                  else if (isActive && m === "closed") variant = "destructive";
                  return (
                    <Button
                      key={m}
                      type="button"
                      size="sm"
                      variant={variant}
                      className={
                        isActive && m === "hours"
                          ? "bg-cyan-600! text-white! hover:bg-cyan-700!"
                          : isActive && m === "24h"
                            ? "bg-emerald-600! text-white! hover:bg-emerald-700!"
                            : undefined
                      }
                      onClick={() => onSetDayMode(d, m)}
                    >
                      {m === "hours" ? "Buka" : m === "24h" ? "24 Jam" : "Tutup"}
                    </Button>
                  );
                })}
              </div>
              {day.mode === "hours" && (
                <div className="flex items-center gap-1.5 sm:ml-auto">
                  <TimeInput
                    value={day.open ?? "08:00"}
                    onChange={(v) => onSetDayTime(d, "open", v)}
                  />
                  <span className="text-xs text-muted-foreground">—</span>
                  <TimeInput
                    value={day.close ?? "22:00"}
                    onChange={(v) => onSetDayTime(d, "close", v)}
                  />
                </div>
              )}
            </div>
          );
        })}
        </div>
        <div className="border-t px-4 py-3">
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={hoursPending}
          >
            {hoursPending ? "Menyimpan..." : "Simpan Jadwal"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
