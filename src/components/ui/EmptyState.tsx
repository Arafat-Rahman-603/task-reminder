import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-container-high bg-surface-container/30 p-8 text-center animate-in fade-in-50 duration-500", className)} {...props}>
      {Icon && (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high mb-4 text-on-surface-variant">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
      <p className="mt-2 text-sm text-on-surface-variant max-w-sm mx-auto mb-6">
        {description}
      </p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  )
}
