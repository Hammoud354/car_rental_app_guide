import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function SignIn() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const signInMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Signed in successfully! Redirecting to dashboard...");
      setTimeout(() => setLocation("/dashboard"), 1000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to sign in");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signInMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 input-client">
      <Card className="w-full max-w-md input-client">
        <CardHeader>
          <CardTitle className="text-2xl input-client">Sign In</CardTitle>
          <CardDescription>
            Welcome back! Sign in to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 input-client">
            <div className="space-y-2 input-client">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2 input-client">
              <div className="flex items-center justify-between input-client">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setLocation("/forgot-password")}
                  className="text-xs text-primary hover:underline input-client"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative input-client">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="pr-10 input-client"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground input-client"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 input-client" /> : <Eye className="h-4 w-4 input-client" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 input-client">
              <input
                type="checkbox"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary input-client"
              />
              <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer input-client">
                Remember me for 30 days
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full input-client"
              disabled={signInMutation.isPending}
            >
              {signInMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin input-client" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground input-client">
              Don't have an account?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto input-client"
                onClick={() => setLocation("/signup")}
              >
                Sign Up
              </Button>
            </div>

            <div className="text-center input-client">
              <Button
                type="button"
                variant="link"
                className="text-sm text-muted-foreground input-client"
                onClick={() => setLocation("/")}
              >
                Continue without signing in
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
