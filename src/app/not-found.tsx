import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-muted text-muted-foreground rounded-2xl flex items-center justify-center">
          <FileQuestion className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground">
            The page you are looking for doesn&apos;t exist, has been moved, or you don&apos;t have permission to view it.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/dashboard"
            className="inline-flex justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link 
            href="/"
            className="inline-flex justify-center rounded-md bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
