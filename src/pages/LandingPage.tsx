import { Link } from "react-router-dom";
import { Link2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  console.log("[LandingPage] Rendering public landing page");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground text-sm tracking-tight">Sniplink</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="text-sm text-muted-foreground hover:text-foreground">
              <Link to="/auth">Login</Link>
            </Button>
            <Button size="sm" asChild className="text-sm rounded-lg h-9">
              <Link to="/auth">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
            The Minimalist UTM &<br />Link Shortener
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
            Create short, trackable URLs with UTM parameters. Simple, fast, and no clutter.
          </p>
          <Button size="lg" asChild className="rounded-lg h-12 px-8 text-sm font-medium">
            <Link to="/auth">
              Get Started
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
    </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© 2026 Sniplink. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
