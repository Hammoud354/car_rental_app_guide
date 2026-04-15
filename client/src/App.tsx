import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import { lazy, Suspense } from "react";

const NotFound = lazy(() => import("@/pages/NotFound"));
const SidebarLayout = lazy(() => import("./components/SidebarLayout"));
const Landing = lazy(() => import("./pages/Landing"));
const Clients = lazy(() => import("./pages/Clients"));
const RentalContracts = lazy(() => import("./pages/RentalContracts"));
const Fleet = lazy(() => import("./pages/Fleet"));
const Booking = lazy(() => import("./pages/Booking"));
const Operations = lazy(() => import("./pages/Operations"));
const Compliance = lazy(() => import("./pages/Compliance"));
const FleetManagement = lazy(() => import("./pages/FleetManagement"));
const VehicleDetails = lazy(() => import("./pages/VehicleDetails"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const MaintenanceTracking = lazy(() => import("./pages/MaintenanceTracking"));
const ProfitabilityDashboard = lazy(() => import("./pages/ProfitabilityDashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const WhatsAppSettings = lazy(() => import("./pages/WhatsAppSettings"));
const SignUp = lazy(() => import("./pages/SignUp"));
const SignIn = lazy(() => import("./pages/SignIn"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Analysis = lazy(() => import("./pages/Analysis"));
const Reservations = lazy(() => import("./pages/Reservations"));
const CompanySettings = lazy(() => import("./pages/CompanySettings"));
const ContractTemplateMapper = lazy(() => import("./pages/ContractTemplateMapper"));
const Invoices = lazy(() => import("./pages/Invoices"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const ProfitAndLoss = lazy(() => import("./pages/ProfitAndLoss"));
const Demo = lazy(() => import("./pages/Demo"));
const Home = lazy(() => import("./pages/Home"));
const AIMaintenance = lazy(() => import("./pages/AIMaintenance"));
const AdminNumberingManagement = lazy(() => import("./pages/AdminNumberingManagement"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminPaymentRequests = lazy(() => import("./pages/AdminPaymentRequests"));
const SubscriptionPlans = lazy(() => import("./pages/SubscriptionPlans"));
const ContractManagement = lazy(() => import("./pages/ContractManagement"));

const PUBLIC_ROUTES = ["/", "/demo", "/login", "/signin", "/signup", "/register", "/forgot-password", "/reset-password", "/subscription-plans"];

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, user } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/signin" });

  const isSuperAdmin = user?.role === "super_admin";

  const { data: currentPlan, isLoading: planLoading } = trpc.subscription.getCurrentPlan.useQuery(undefined, {
    enabled: isAuthenticated && !isSuperAdmin,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (loading || (isAuthenticated && !isSuperAdmin && planLoading)) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isSuperAdmin) {
    return <>{children}</>;
  }

  const hasActivePlan = currentPlan && currentPlan.status === "active";
  if (!hasActivePlan) {
    return <Redirect to="/subscription-plans" />;
  }

  return <>{children}</>;
}

function AppContent() {
  const [location] = useLocation();
  const isPublicRoute = PUBLIC_ROUTES.some(route => location === route);

  if (isPublicRoute) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/demo" component={Demo} />
          <Route path="/login" component={SignIn} />
          <Route path="/signin" component={SignIn} />
          <Route path="/signup" component={SignUp} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/subscription-plans" component={SubscriptionPlans} />
        </Switch>
      </Suspense>
    );
  }

  return (
    <ProtectedRoute>
      <Suspense fallback={<PageLoader />}>
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
            <Route path="/admin/analytics" component={AdminAnalytics} />
            <Route path="/admin/payment-requests" component={AdminPaymentRequests} />
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
      </Suspense>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
