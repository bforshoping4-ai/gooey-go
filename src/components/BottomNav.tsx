import { Home, Link2, LogOut, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

/**
 * Mobile-only bottom navigation for the authenticated dashboard.
 * Hidden on >= sm breakpoints.
 */
const BottomNav = () => {
  const { signOut } = useAuth();
  console.log("[BottomNav] render");

  const scrollTo = (id: string) => {
    console.log("[BottomNav] scrollTo:", id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const items = [
    { id: "builder", label: "Create", icon: Home, onClick: () => scrollTo("builder") },
    { id: "analytics", label: "Analytics", icon: BarChart3, onClick: () => scrollTo("analytics") },
    { id: "links", label: "Links", icon: Link2, onClick: () => scrollTo("links") },
    {
      id: "signout",
      label: "Sign Out",
      icon: LogOut,
      onClick: () => {
        console.log("[BottomNav] sign out");
        signOut();
      },
    },
  ];

  return (
    <nav
      className={cn(
        "sm:hidden fixed bottom-0 inset-x-0 z-40",
        "bg-background/90 backdrop-blur-md border-t border-border",
        "flex h-16"
      )}
    >
      {items.map((it) => (
        <button
          key={it.id}
          onClick={it.onClick}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <it.icon className="h-5 w-5" />
          {it.label}
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
