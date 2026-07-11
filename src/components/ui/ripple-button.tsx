"use client";

import { useState, useRef, useCallback } from "react";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export interface RippleButtonProps
  extends React.ComponentPropsWithoutRef<"button"> {
  rippleColor?: string;
  rippleDuration?: number;
}

export function RippleButton({
  children,
  className = "",
  rippleColor = "bg-white/40",
  rippleDuration = 600,
  onMouseDown,
  onTouchStart,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const idRef = useRef(0);
  const isTouchRef = useRef(false);

  const addRipple = useCallback(
    (x: number, y: number) => {
      const id = ++idRef.current;
      setRipples((prev) => [...prev, { id, x, y }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, rippleDuration);
    },
    [rippleDuration],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isTouchRef.current) return;
      if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
        isTouchRef.current = true;
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      addRipple(e.clientX - rect.left, e.clientY - rect.top);
      onMouseDown?.(e);
    },
    [addRipple, onMouseDown],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      isTouchRef.current = true;
      const rect = e.currentTarget.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        addRipple(touch.clientX - rect.left, touch.clientY - rect.top);
      }
      onTouchStart?.(e);
    },
    [addRipple, onTouchStart],
  );

  return (
    <button
      className={`relative inline-flex items-center justify-center overflow-hidden active:scale-95 transition-transform ${className}`}
      style={{ touchAction: "manipulation" }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      {...props}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className={`pointer-events-none absolute rounded-full animate-[ripple-btn_${rippleDuration}ms_ease-out] ${rippleColor}`}
          style={{
            left: r.x,
            top: r.y,
            width: 20,
            height: 20,
            marginLeft: -10,
            marginTop: -10,
          }}
        />
      ))}
      {children}
    </button>
  );
}
