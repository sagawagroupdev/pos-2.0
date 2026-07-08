"use client"

import { useEffect } from "react"
import { createToaster, unmountToaster, type ToastPosition } from "gooey-toast"

function GooeyToaster({
  position = "top-right",
}: {
  position?: ToastPosition
}) {
  useEffect(() => {
    createToaster({ position })
    return () => unmountToaster()
  }, [position])

  return null
}

export { GooeyToaster }
