import { Wrench } from "lucide-react";

const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Wrench className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            We're Under Maintenance
          </h1>
          <p className="text-sm text-muted-foreground">
            We're working to improve your experience. We'll be back soon with new features.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          LinkJoy © 2026
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;
