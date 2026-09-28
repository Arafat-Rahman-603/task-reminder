import Link from "next/link";
import { Settings2 } from "lucide-react";

export function ModuleDisabled({ moduleName }: { moduleName: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-muted text-muted-foreground rounded-2xl flex items-center justify-center mb-6">
        <Settings2 className="w-8 h-8" />
      </div>
      
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
        {moduleName} Module is Disabled
      </h2>
      <p className="text-muted-foreground max-w-md mb-8">
        You have turned off the {moduleName} module in your settings. If you need to use this feature, you can re-enable it at any time.
      </p>

      <div className="flex gap-4">
        <Link 
          href="/dashboard/settings"
          className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          Go to Settings
        </Link>
        <Link 
          href="/dashboard"
          className="inline-flex justify-center rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
