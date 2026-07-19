"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { claimQrCheckoutAction, claimQrOrderByNumberAction } from "./actions";
import { isCheckoutScannerPayload } from "./qr-scanner-payload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DetectedBarcode = { rawValue?: string };
type BarcodeDetectorLike = {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
};
type BarcodeDetectorFactory = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

type BarcodeDetectorWindow = Window & {
  BarcodeDetector?: BarcodeDetectorFactory;
};

function getBarcodeDetector(): BarcodeDetectorFactory | null {
  const detector = (window as BarcodeDetectorWindow).BarcodeDetector;
  return typeof detector === "function" ? detector : null;
}

export function QrOrderScannerDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [payload, setPayload] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const submitPayload = useCallback(
    async (rawPayload: string) => {
      if (submittedRef.current) return;

      if (isCheckoutScannerPayload(rawPayload)) {
        submittedRef.current = true;
        setSubmitting(true);
        setError(null);
        stopCamera();

        try {
          const result = await claimQrCheckoutAction(rawPayload);
          if (result.ok) {
            setOpen(false);
            router.push(`/pos?checkout=${encodeURIComponent(result.checkoutLockToken)}`);
            return;
          }
          submittedRef.current = false;
          setFallback(true);
          setError(result.error);
        } catch {
          submittedRef.current = false;
          setFallback(true);
          setError("Gagal mengambil pesanan QR");
        } finally {
          setSubmitting(false);
        }
        return;
      }

      // Try as order number
      if (rawPayload.trim()) {
        submittedRef.current = true;
        setSubmitting(true);
        setError(null);
        stopCamera();

        try {
          const result = await claimQrOrderByNumberAction(rawPayload.trim());
          if (result.ok) {
            setOpen(false);
            router.push(`/pos?checkout=${encodeURIComponent(result.checkoutLockToken)}`);
            return;
          }
          submittedRef.current = false;
          setError(result.error);
        } catch {
          submittedRef.current = false;
          setError("Gagal mengambil pesanan");
        } finally {
          setSubmitting(false);
        }
        return;
      }

      setError("QR pesanan tidak valid");
      setFallback(true);
    },
    [router, stopCamera]
  );

  useEffect(() => {
    if (!open || !fallback) return;
    inputRef.current?.focus();
  }, [fallback, open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function startCamera() {
      if (
        !window.isSecureContext ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setFallback(true);
        setError("Kamera membutuhkan koneksi aman; masukkan payload QR.");
        return;
      }

      const Detector = getBarcodeDetector();
      if (!Detector) {
        setFallback(true);
        setError("Pemindai QR tidak tersedia; masukkan payload QR.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          stopCamera();
          setFallback(true);
          setError("Pratinjau kamera tidak tersedia; masukkan payload QR.");
          return;
        }
        video.srcObject = stream;
        await video.play();
        const detector = new Detector({ formats: ["qr_code"] });

        const detectFrame = async () => {
          if (cancelled || submittedRef.current || !videoRef.current) return;
          try {
            const values = await detector.detect(videoRef.current);
            const firstPayload = values.find(
              (value) =>
                typeof value.rawValue === "string" &&
                isCheckoutScannerPayload(value.rawValue)
            )?.rawValue;
            if (firstPayload) {
              await submitPayload(firstPayload);
              return;
            }
          } catch {
            if (cancelled) return;
            stopCamera();
            setFallback(true);
            setError("Pemindai QR gagal; masukkan payload QR.");
            return;
          }
          if (!cancelled && !submittedRef.current) {
            frameRef.current = requestAnimationFrame(() => void detectFrame());
          }
        };

        void detectFrame();
      } catch {
        if (!cancelled) {
          stopCamera();
          setFallback(true);
          setError("Kamera tidak tersedia; masukkan payload QR.");
        }
      }
    }

    void startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, stopCamera, submitPayload]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      submittedRef.current = false;
      setFallback(false);
      setPayload("");
      setError(null);
    } else {
      stopCamera();
    }
    setOpen(nextOpen);
  }

  function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitPayload(payload);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        Scan QR Pesanan
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Pesanan</DialogTitle>
          <DialogDescription>
            Arahkan kamera ke QR pesanan pelanggan untuk mengunci checkout ini.
          </DialogDescription>
        </DialogHeader>

        {fallback ? (
          <form className="flex flex-col gap-3" onSubmit={handleManualSubmit}>
            <Input
              ref={inputRef}
              value={payload}
              onChange={(event) => setPayload(event.target.value)}
              placeholder="sagawa-pos:checkout:... atau No. Pesanan"
              autoComplete="off"
              spellCheck={false}
              aria-label="Payload QR pesanan"
              disabled={submitting}
            />
            <Button type="submit" disabled={submitting || !payload}>
              {submitting ? "Mengambil pesanan..." : "Muat pesanan"}
            </Button>
          </form>
        ) : (
          <video
            ref={videoRef}
            className="aspect-video w-full rounded-lg bg-black object-cover"
            autoPlay
            muted
            playsInline
            aria-label="Pratinjau kamera pemindai QR"
          />
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
