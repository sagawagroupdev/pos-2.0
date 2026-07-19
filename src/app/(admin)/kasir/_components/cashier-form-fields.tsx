"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { id } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import type { PartnershipOption, CashierRow } from "../cashier-manager";

export function CashierFormFields({
  partnerships,
  selectedPartnership,
  onPartnershipChange,
  selectedSub,
  onSubChange,
  defaults,
  showPassword,
}: {
  partnerships: PartnershipOption[];
  selectedPartnership: string;
  onPartnershipChange: (v: string) => void;
  selectedSub: string;
  onSubChange: (v: string) => void;
  defaults?: CashierRow;
  showPassword: boolean;
}) {
  const subOptions =
    partnerships.find((p) => p.id === selectedPartnership)?.subPartnerships ?? [];
  const currentPartner = partnerships.find((p) => p.id === selectedPartnership);
  const logoUrl = defaults?.outletLogo ?? (selectedSub
    ? subOptions.find((s) => s.id === selectedSub)?.logo
    : currentPartner?.logo);

  const [pwVisible, setPwVisible] = useState(false);
  const dateStr = defaults?.outletFoundedDate?.split("T")[0] ?? "";
  const [dateOpen, setDateOpen] = useState(false);
  const [rawDate, setRawDate] = useState(dateStr);
  const parsedDate = rawDate ? parse(rawDate, "yyyy-MM-dd", new Date()) : undefined;
  const handleDateSelect = useCallback(
    (d: Date) => {
      setRawDate(format(d, "yyyy-MM-dd"));
      setDateOpen(false);
    },
    [],
  );

  return (
    <div key={defaults?.id ?? "create"} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Outlet *</Label>
        <Input id="name" name="name" defaultValue={defaults?.name ?? ""} placeholder="Nama outlet" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" name="email" type="email" defaultValue={defaults?.email ?? ""} placeholder="email@example.com" required />
      </div>
      {showPassword && (
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={pwVisible ? "text" : "password"}
              minLength={8}
              placeholder="Min 8 karakter"
              className="pr-9"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-muted-foreground hover:text-foreground"
              onClick={() => setPwVisible((p) => !p)}
            >
              {pwVisible ? <HugeiconsIcon icon={ViewIcon} size="18" color="currentColor" strokeWidth={1.5} /> : <HugeiconsIcon icon={ViewOffIcon} size="18" color="currentColor" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="outletPhone">No Telp</Label>
          <Input id="outletPhone" name="outletPhone" defaultValue={defaults?.outletPhone ?? ""} placeholder="08xxx" />
        </div>
        <div className="space-y-2">
          <Label>Tanggal Berdiri</Label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger
              render={
                <Button variant="outline" role="combobox" className="w-full justify-start font-normal">
                  <HugeiconsIcon icon={Calendar01Icon} color="currentColor" strokeWidth={1.5} className="mr-2 size-4 shrink-0" />
                  {parsedDate ? format(parsedDate, "dd MMMM yyyy", { locale: id }) : <span className="text-muted-foreground">Pilih tanggal</span>}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-3" align="start">
              <Calendar selected={parsedDate} onSelect={handleDateSelect} />
            </PopoverContent>
          </Popover>
          <input type="hidden" name="outletFoundedDate" value={rawDate} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="outletAddress">Alamat Outlet</Label>
        <Textarea id="outletAddress" name="outletAddress" defaultValue={defaults?.outletAddress ?? ""} placeholder="Alamat lengkap outlet" rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="outletPic">PIC</Label>
        <Input id="outletPic" name="outletPic" defaultValue={defaults?.outletPic ?? ""} placeholder="Nama PIC" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="outletLogo">Logo Outlet</Label>
        {defaults?.outletLogo && (
          <Image src={defaults.outletLogo} alt="Logo" width={64} height={64} className="size-16 rounded object-contain" />
        )}
        <Input id="outletLogo" name="outletLogo" type="file" accept="image/*" />
      </div>
      <div className="space-y-2">
        <Label>Kemitraan</Label>
        <Combobox
          options={partnerships.map((p) => ({ label: p.name, value: p.id }))}
          value={selectedPartnership}
          onChange={(v) => {
            onPartnershipChange(v);
            onSubChange("");
          }}
          placeholder="Pilih kemitraan"
        />
      </div>
      {subOptions.length > 0 && (
        <div className="space-y-2">
          <Label>Sub Kemitraan</Label>
          <Combobox
            options={subOptions.map((s) => ({ label: s.name, value: s.id }))}
            value={selectedSub}
            onChange={onSubChange}
            placeholder="Pilih sub kemitraan"
          />
        </div>
      )}
      {logoUrl && (
        <div className="space-y-2">
          <Label>Logo</Label>
          <Image src={logoUrl} alt="Logo" width={80} height={80} className="rounded-md object-cover" />
        </div>
      )}
    </div>
  );
}
