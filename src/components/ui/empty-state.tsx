import { cn } from "@/lib/utils"
import { Button } from "./button"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: React.ReactNode
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-12 px-4 space-y-4",
      className
    )}>
      <div className="p-4 rounded-full bg-accent/10 float">
        <Icon className="h-8 w-8 text-accent" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-serif font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm max-w-sm">{description}</p>
      </div>
      {action && (
        <Button 
          onClick={action.onClick}
          className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}