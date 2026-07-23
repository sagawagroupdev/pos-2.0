"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildTestPage } from "@/lib/ble-printer";
import { usePrinter } from "@/app/pos/printer-context";

export function BlePrinterStatus() {
  const {
    connected,
    deviceName: name,
    connect,
    disconnect,
    print,
    lastDeviceName,
  } = usePrinter();
  const [connecting, setConnecting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [browserOk] = useState(() => {
    if (typeof navigator === "undefined") return false;
    return "bluetooth" in navigator;
  });

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      await connect();
    } catch (err: unknown) {
      if (!(err instanceof Error && err.name === "NotFoundError")) {
        toast.error(
          err instanceof Error ? err.message : "Gagal connect printer"
        );
      }
    } finally {
      setConnecting(false);
    }
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const handleTestPrint = useCallback(async () => {
    setPrinting(true);
    try {
      const data = buildTestPage();
      await print(data);
      toast.success("Test print terkirim!");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Gagal kirim test print"
      );
    } finally {
      setPrinting(false);
    }
  }, [print]);

  if (!browserOk) {
    return (
      <p className="text-xs text-muted-foreground">
        Browser ini gak support Web Bluetooth. Pake Chrome Android ya.
      </p>
    );
  }

  const displayName = name ?? lastDeviceName;

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg py-2">
      <div className="flex items-center gap-2">
        <Badge
          variant={connected ? "default" : "secondary"}
          className={
            connected
              ? "bg-emerald-500 hover:bg-emerald-500"
              : undefined
          }
        >
          {connected ? "Connect" : "Disconnect"}
        </Badge>
        {displayName && (
          <span className="text-xs text-muted-foreground">
            {displayName}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {connected ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestPrint}
              disabled={printing}
            >
              {printing ? "Mencetak..." : "Test Print"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDisconnect}
            >
              Putuskan
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? "Menghubungkan..." : "Connect Printer"}
          </Button>
        )}
      </div>
    </div>
  );
}
