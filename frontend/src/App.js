import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout";
import { RoleProvider } from "./lib/RoleContext";
import Overview from "./pages/Overview";
import Equipment from "./pages/Equipment";
import Wizard from "./pages/Wizard";
import Alerts from "./pages/Alerts";
import Logbook from "./pages/Logbook";
import Knowledge from "./pages/Knowledge";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Scheduler from "./pages/Scheduler";
import Inventory from "./pages/Inventory";
import Credits from "./pages/Credits";
import { listAlerts } from "./lib/api";

function App() {
  const [criticalCount, setCriticalCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const al = await listAlerts({ severity: "critical", acknowledged: false });
        setCriticalCount(al.length);
      } catch { /* noop */ }
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <BrowserRouter>
      <RoleProvider>
        <Layout criticalCount={criticalCount}>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/equipment/:id" element={<Equipment />} />
            <Route path="/wizard" element={<Wizard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/scheduler" element={<Scheduler />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/logbook" element={<Logbook />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/credits" element={<Credits />} />
          </Routes>
        </Layout>
      </RoleProvider>
    </BrowserRouter>
  );
}

export default App;
