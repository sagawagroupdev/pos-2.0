"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogoField } from "./logo-field";
import type { PartnershipRow, SubPartnershipRow, Status } from "../types";
import { statusLabel } from "../types";

export function PartnershipFields({
  formId,
  defaults,
  status,
  onStatusChange,
  onFileChange,
}: {
  formId: string;
  defaults?: PartnershipRow;
  status: Status;
  onStatusChange: (v: Status) => void;
  onFileChange?: (file: File | null) => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor={`${formId}-name`}>Nama Kemitraan *</Label>
        <Input
          id={`${formId}-name`}
          name="name"
          defaultValue={defaults?.name ?? ""}
          placeholder="Nama kemitraan"
          required
        />
      </div>

      <LogoField currentUrl={defaults?.logo} onFileChange={onFileChange} />

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => onStatusChange(v as Status)}>
          <SelectTrigger>
            <SelectValue>{statusLabel[status]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {(["ACTIVE", "INACTIVE", "SUSPENDED"] as const).map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel[s]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <input type="hidden" name="status" value={status} />
      </div>
    </div>
  );
}

export function SubPartnershipFields({
  formId,
  defaults,
  status,
  onStatusChange,
  onFileChange,
}: {
  formId: string;
  defaults?: SubPartnershipRow;
  status: Status;
  onStatusChange: (v: Status) => void;
  onFileChange?: (file: File | null) => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor={`${formId}-sub-name`}>Nama Sub Kemitraan *</Label>
        <Input
          id={`${formId}-sub-name`}
          name="name"
          defaultValue={defaults?.name ?? ""}
          placeholder="Nama sub kemitraan"
          required
        />
      </div>

      <LogoField currentUrl={defaults?.logo} onFileChange={onFileChange} />

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => onStatusChange(v as Status)}>
          <SelectTrigger>
            <SelectValue>{statusLabel[status]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {(["ACTIVE", "INACTIVE", "SUSPENDED"] as const).map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel[s]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <input type="hidden" name="status" value={status} />
      </div>
    </div>
  );
}
