"use client"

import { Toaster as SonnerToaster } from "sonner"

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      theme="light"
      richColors
      className="toaster group"
      position="top-center"
      style={
        {
          "--normal-bg": "oklch(1 0 0)",
          "--normal-text": "oklch(0.145 0 0)",
          "--normal-border": "oklch(0.922 0 0)",
          "--success-bg": "oklch(0.527 0.154 150)",
          "--success-text": "oklch(0.985 0 0)",
          "--success-border": "oklch(0.608 0.126 150)",
          "--info-bg": "oklch(0.546 0.185 260)",
          "--info-text": "oklch(0.985 0 0)",
          "--info-border": "oklch(0.632 0.147 260)",
          "--warning-bg": "oklch(0.666 0.179 58)",
          "--warning-text": "oklch(0.985 0 0)",
          "--warning-border": "oklch(0.734 0.139 58)",
          "--error-bg": "oklch(0.577 0.245 27.325)",
          "--error-text": "oklch(0.985 0 0)",
          "--error-border": "oklch(0.657 0.189 27.325)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
