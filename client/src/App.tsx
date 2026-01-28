import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Clients from "./pages/Clients";
import RentalContracts from "./pages/RentalContracts";
import Fleet from "./pages/Fleet";
import Booking from "./pages/Booking";
import Operations from "./pages/Operations";
import Compliance from "./pages/Compliance";
import FleetManagement from "./pages/FleetManagement";
import Dashboard from "./pages/Dashboard";
import Maintenance from "./pages/Maintenance";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/clients" component={Clients} />
      <Route path="/rental-contracts" component={RentalContracts} />
      <Route path="/404" component={NotFound} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/maintenance" component={Maintenance} />
      <Route path="/fleet" component={Fleet} />
      <Route path="/fleet-management" component={FleetManagement} />
      <Route path="/booking" component={Booking} />
      <Route path="/operations" component={Operations} />
      <Route path="/compliance" component={Compliance} />
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
