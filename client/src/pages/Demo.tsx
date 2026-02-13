import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertTriangle, Loader2, ArrowRight } from "lucide-react";

const DEMO_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export default function Demo() {
  const [, setLocation] = useLocation();
  const [timeRemaining, setTimeRemaining] = useState(DEMO_DURATION_MS);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const loginDemoMutation = trpc.auth.loginDemo.useMutation();

  useEffect(() => {
    // Start demo session automatically
    handleStartDemo();
  }, []);

  useEffect(() => {
    if (timeRemaining <= 0) {
      handleDemoExpired();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleStartDemo = async () => {
    setIsLoggingIn(true);
    try {
      await loginDemoMutation.mutateAsync();
      // Redirect to dashboard after successful login
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Demo login failed:", error);
      setIsLoggingIn(false);
    }
  };

  const handleDemoExpired = () => {
    // Logout and redirect to home
    window.location.href = "/";
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (timeRemaining < 60000) return "text-red-600"; // < 1 minute
    if (timeRemaining < 180000) return "text-orange-600"; // < 3 minutes
    return "text-green-600";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Welcome to the Demo!</CardTitle>
          <CardDescription className="text-base mt-2">
            You're about to experience the full power of our Car Rental Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoggingIn ? (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-lg font-medium">Setting up your demo account...</p>
              <p className="text-sm text-muted-foreground">
                Creating dummy data: vehicles, contracts, clients, and reports
              </p>
            </div>
          ) : (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Demo Mode:</strong> You have full access to explore all features with dummy data.
                  The demo will automatically end after 10 minutes.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 rounded-lg p-6 text-center space-y-2">
                <p className="text-sm text-muted-foreground">Time Remaining</p>
                <p className={`text-5xl font-bold font-mono ${getTimeColor()}`}>
                  {formatTime(timeRemaining)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {timeRemaining < 60000 && "Demo ending soon!"}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">What you can explore:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span><strong>Fleet Management:</strong> View 10 sample vehicles with complete details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span><strong>Contracts:</strong> Browse active, pending, and completed rental contracts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span><strong>P&L Analysis:</strong> See profitability reports per vehicle</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span><strong>Analytics:</strong> Explore real-time dashboards and insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span><strong>Maintenance:</strong> Track service history and upcoming maintenance</span>
                  </li>
                </ul>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Demo accounts cannot create, edit, or delete data.
                  Sign up for a real account to unlock full functionality.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 pt-4">
                <Button 
                  className="flex-1" 
                  size="lg"
                  onClick={() => setLocation("/dashboard")}
                >
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setLocation("/")}
                >
                  Back to Home
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Floating Timer (shown when on dashboard) */}
      {!isLoggingIn && timeRemaining > 0 && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-4 min-w-[200px]">
          <div className="flex items-center gap-3">
            <Clock className={`h-5 w-5 ${getTimeColor()}`} />
            <div>
              <p className="text-xs text-muted-foreground">Demo Time Left</p>
              <p className={`text-xl font-bold font-mono ${getTimeColor()}`}>
                {formatTime(timeRemaining)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
