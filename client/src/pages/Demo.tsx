import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { Clock, Loader2, ArrowRight, Car, FileText, BarChart3, Wrench, DollarSign, CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

const DEMO_DURATION_MS = 10 * 60 * 1000;

export default function Demo() {
  const [, setLocation] = useLocation();
  const [timeRemaining, setTimeRemaining] = useState(DEMO_DURATION_MS);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  
  const loginDemoMutation = trpc.auth.loginDemo.useMutation();

  useEffect(() => {
    handleStartDemo();
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    if (timeRemaining <= 0) {
      window.location.href = "/";
      return;
    }
    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, status]);

  const handleStartDemo = async () => {
    setStatus("loading");
    try {
      await loginDemoMutation.mutateAsync();
      setStatus("ready");
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Demo login failed:", error);
      setStatus("error");
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <AnimatedLogo size="lg" showSubtext />
          </Link>
        </div>

        {status === "error" ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Demo setup failed</h2>
            <p className="text-sm text-gray-500 mb-6">Something went wrong. Please try again.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleStartDemo} className="bg-blue-600 hover:bg-blue-700 text-white">Retry</Button>
              <Button variant="outline" onClick={() => setLocation("/")}>Back to Home</Button>
            </div>
          </div>
        ) : status === "loading" ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Setting up your demo</h2>
            <p className="text-sm text-gray-500">Creating sample vehicles, contracts, and analytics data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Demo Ready!</h2>
              <p className="text-sm text-gray-500 mb-6">Your demo environment is loaded with sample data. Redirecting to dashboard...</p>

              {/* Timer */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100 mb-6">
                <Clock className={`h-4 w-4 ${timeRemaining < 60000 ? 'text-red-500' : timeRemaining < 180000 ? 'text-orange-500' : 'text-blue-600'}`} />
                <span className={`text-lg font-bold font-mono ${timeRemaining < 60000 ? 'text-red-600' : timeRemaining < 180000 ? 'text-orange-600' : 'text-gray-900'}`}>
                  {formatTime(timeRemaining)}
                </span>
                <span className="text-xs text-gray-400">remaining</span>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-3 text-left mb-6">
                {[
                  { icon: Car, label: "10 Sample Vehicles" },
                  { icon: FileText, label: "Active Contracts" },
                  { icon: BarChart3, label: "Analytics Dashboard" },
                  { icon: DollarSign, label: "P&L Reports" },
                  { icon: Wrench, label: "Maintenance Tracking" },
                  { icon: CheckCircle2, label: "Invoice Generation" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600 py-1.5">
                    <item.icon className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    {item.label}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 font-semibold shadow-md shadow-blue-600/20"
                  onClick={() => setLocation("/dashboard")}
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-10"
                  onClick={() => setLocation("/")}
                >
                  Exit
                </Button>
              </div>
            </div>

            <div className="px-8 py-4 bg-amber-50 border-t border-amber-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>Demo mode:</strong> Data is read-only. <button onClick={() => setLocation("/signup")} className="underline font-semibold hover:text-amber-900">Sign up</button> for full access.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
