import { useState } from "react";
import { Link2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import LinkBuilderForm from "@/components/LinkBuilderForm";
import ClicksChart from "@/components/ClicksChart";
import LinksTable from "@/components/LinksTable";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const { user, signOut } = useAuth();

  console.log("[Index] Rendering main dashboard, user:", user?.email, "refreshSignal:", refreshSignal);

  const handleLinkCreated = () => {
    console.log("[Index] Link created, triggering table refresh");
    setRefreshSignal((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Link2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-sm tracking-tight">Sniplink</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[180px]">
              {user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log("[Index] Sign out clicked");
                signOut();
              }}
              className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 sm:px-6 pt-12 sm:pt-16 pb-24 sm:pb-12">
        <div className="w-full max-w-3xl mx-auto space-y-12">
          <div className="max-w-xl mx-auto space-y-8" id="builder">
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary-soft border border-primary/20 rounded-full px-3 py-1">
                ✦ UTM · Short Links · Analytics
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Shorten & Track Your Links
              </h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Create short URLs with UTM parameters to track your campaigns.
              </p>
            </div>

            <LinkBuilderForm onLinkCreated={handleLinkCreated} />
          </div>

          <div id="analytics">
            <ClicksChart refreshSignal={refreshSignal} />
          </div>
          <div id="links">
            <LinksTable refreshSignal={refreshSignal} />
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
