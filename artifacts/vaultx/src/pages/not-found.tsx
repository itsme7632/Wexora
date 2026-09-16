import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl font-bold text-primary">404</span>
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">Page Not Found</h1>
      <p className="text-sm text-muted-foreground max-w-xs mb-8 leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" className="rounded-xl font-semibold h-11" onClick={() => window.history.back()}>
          <ArrowLeft size={15} className="mr-1.5" /> Go Back
        </Button>
        <Link href="/">
          <Button className="rounded-xl font-semibold h-11 gap-1.5">
            <Home size={15} /> Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
