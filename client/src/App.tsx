import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminServices from "@/pages/admin/Services";
import AdminAppointments from "@/pages/admin/Appointments";
import ProfessionalDashboard from "@/pages/professional/Dashboard";
import ProfessionalHistory from "@/pages/professional/History";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/onboarding" component={Onboarding} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/services" component={AdminServices} />
      <Route path="/admin/appointments" component={AdminAppointments} />
      
      {/* Professional Routes */}
      <Route path="/professional" component={ProfessionalDashboard} />
      <Route path="/professional/history" component={ProfessionalHistory} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
