import {
  CheckCircle2,
  Info,
  Loader2,
  TriangleAlert,
  XCircle,
} from "lucide-react"
import type * as React from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-['']",
          title: "font-medium leading-snug",
          description: "text-muted-foreground",
          icon: "shrink-0",
          closeButton:
            "text-muted-foreground transition-colors hover:text-foreground",
          actionButton:
            "rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground",
          cancelButton:
            "rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground",
          success: "before:bg-emerald-500",
          error: "before:bg-destructive",
          warning: "before:bg-amber-500",
          info: "before:bg-sky-500",
          loading: "before:bg-muted-foreground",
        },
      }}
      icons={{
        success: <CheckCircle2 className="size-5 text-emerald-500" />,
        error: <XCircle className="size-5 text-destructive" />,
        warning: <TriangleAlert className="size-5 text-amber-500" />,
        info: <Info className="size-5 text-sky-500" />,
        loading: (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ),
      }}
      {...props}
    />
  )
}

export { Toaster }
