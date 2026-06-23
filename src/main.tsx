import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import MaintenancePage from "./pages/MaintenancePage.tsx";
import "./index.css";

const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === "true";

createRoot(document.getElementById("root")!).render(
  isMaintenanceMode ? <MaintenancePage /> : <App />
);
