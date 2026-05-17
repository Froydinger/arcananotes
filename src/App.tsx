import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MaintenancePage from "./pages/MaintenancePage";

// MAINTENANCE MODE: app is paused to reduce backend usage.
// All routes render the maintenance/waitlist page. No Supabase/auth providers
// are mounted so there are zero background calls to Lovable Cloud.
function ForceDarkTheme({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("light", "navy");
    if (!html.classList.contains("dark")) html.classList.add("dark");
  }, []);
  return <>{children}</>;
}

const App = () => (
  <BrowserRouter>
    <ForceDarkTheme>
      <Routes>
        <Route path="*" element={<MaintenancePage />} />
      </Routes>
    </ForceDarkTheme>
  </BrowserRouter>
);

export default App;
