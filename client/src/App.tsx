import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import SidebarLayout from "./components/SidebarLayout";
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
import MaintenanceTracking from "./pages/MaintenanceTracking";
import ProfitabilityDashboard from "./pages/ProfitabilityDashboard";
import Settings from "./pages/Settings";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Analysis from "./pages/Analysis";
import Reservations from "./pages/Reservations";
import CompanySettings from "./pages/CompanySettings";
import ContractTemplateMapper from "./pages/ContractTemplateMapper";
import Invoices from "./pages/Invoices";
import AdminUsers from "./pages/AdminUsers";
import AuditLogs from "./pages/AuditLogs";
import UserManagement from "./pages/UserManagement";
import MyProfile from "./pages/MyProfile";
import ProfitAndLoss from "./pages/ProfitAndLoss";
import Demo from "./pages/Demo";
import Home from "./pages/Home";
import AIMaintenance from "./pages/AIMaintenance";
import AdminNumberingManagement from "./pages/AdminNumberingManagement";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import ContractManagement from "./pages/ContractManagement";

const PUBLIC_ROUTES = ["/", "/demo", "/login", "/signin", "/signup", "/register", "/forgot-password", "/reset-password"];

function AppContent() {
  const [location] = useLocation();
  const isPublicRoute = PUBLIC_ROUTES.some(route => location === route);

  if (isPublicRoute) {
    return (
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/demo" component={Demo} />
        <Route path="/login" component={SignIn} />
        <Route path="/signin" component={SignIn} />
        <Route path="/signup" component={SignUp} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
      </Switch>
    );
  }

  return (
    <SidebarLayout>
      <Switch>
        <Route path="/clients" component={Clients} />
        <Route path="/rental-contracts" component={RentalContracts} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/profitability" component={ProfitabilityDashboard} />
        <Route path="/profit-loss" component={ProfitAndLoss} />
        <Route path="/maintenance" component={Maintenance} />
        <Route path="/maintenance-tracking" component={MaintenanceTracking} />
        <Route path="/ai-maintenance" component={AIMaintenance} />
        <Route path="/fleet" component={Fleet} />
        <Route path="/fleet-management" component={FleetManagement} />
        <Route path="/vehicle/:id" component={VehicleDetails} />
        <Route path="/booking" component={Booking} />
        <Route path="/operations" component={Operations} />
        <Route path="/compliance" component={Compliance} />
        <Route path="/settings" component={Settings} />
        <Route path="/whatsapp-settings" component={WhatsAppSettings} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/user-management" component={UserManagement} />
        <Route path="/admin/audit-logs" component={AuditLogs} />
        <Route path="/admin/numbering" component={AdminNumberingManagement} />
        <Route path="/subscription-plans" component={SubscriptionPlans} />
        <Route path="/analysis" component={Analysis} />
        <Route path="/reservations" component={Reservations} />
        <Route path="/company-settings" component={CompanySettings} />
        <Route path="/my-profile" component={MyProfile} />
        <Route path="/contract-template-mapper" component={ContractTemplateMapper} />
        <Route path="/contract-management" component={ContractManagement} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </SidebarLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
