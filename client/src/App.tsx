import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Clients from "./pages/Clients";
import RentalContracts from "./pages/RentalContracts";
import Fleet from "./pages/Fleet";
import Booking from "./pages/Booking";
import Operations from "./pages/Operations";
import Compliance from "./pages/Compliance";
import FleetManagement from "./pages/FleetManagement";
import VehicleDetails from "./pages/VehicleDetails";
import Dashboard from "./pages/Dashboard";
import Maintenance from "./pages/Maintenance";
import ProfitabilityDashboard from "./pages/ProfitabilityDashboard";
import Settings from "./pages/Settings";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Analysis from "./pages/Analysis";
import Reservations from "./pages/Reservations";
import CompanySettings from "./pages/CompanySettings";
import Invoices from "./pages/Invoices";
import AdminUsers from "./pages/AdminUsers";
import AuditLogs from "./pages/AuditLogs";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={SignIn} />
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/clients" component={Clients} />
      <Route path="/rental-contracts" component={RentalContracts} />
      <Route path="/404" component={NotFound} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profitability" component={ProfitabilityDashboard} />
      <Route path="/maintenance" component={Maintenance} />
      <Route path="/fleet" component={Fleet} />
      <Route path="/fleet-management" component={FleetManagement} />
      <Route path="/vehicle/:id" component={VehicleDetails} />
      <Route path="/booking" component={Booking} />
      <Route path="/operations" component={Operations} />
      <Route path="/compliance" component={Compliance} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/audit-logs" component={AuditLogs} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/reservations" component={Reservations} />
      <Route path="/company-settings" component={CompanySettings} />
      <Route path="/invoices" component={Invoices} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
