import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const token = new URLSearchParams(searchParams).get("token") || "";
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Verify token on component mount
  const verifyToken = trpc.auth.verifyResetToken.useQuery(
    { token },
    {
      enabled: !!token,
      retry: false,
    }
  );

  // Handle token verification result
  useEffect(() => {
    if (verifyToken.isSuccess) {
      setTokenValid(true);
    } else if (verifyToken.isError) {
      setTokenValid(false);
      setError(verifyToken.error.message);
    }
  }, [verifyToken.isSuccess, verifyToken.isError, verifyToken.error]);

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError("");
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword.trim()) {
      setError("Password is required");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    resetMutation.mutate({ token, newPassword });
  };

  // Show loading while verifying token
  if (verifyToken.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 input-client">
        <Card className="w-full max-w-md shadow-2xl input-client">
          <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4 input-client">
            <Loader2 className="h-12 w-12 animate-spin text-primary input-client" />
            <p className="text-muted-foreground input-client">Verifying reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 input-client">
        <Card className="w-full max-w-md shadow-2xl input-client">
          <CardHeader className="space-y-3 text-center input-client">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center input-client">
              <AlertCircle className="w-8 h-8 text-destructive input-client" />
            </div>
            <CardTitle className="text-3xl font-bold input-client">Invalid Reset Link</CardTitle>
            <CardDescription className="text-base input-client">
              {error || "This password reset link is invalid or has expired"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full input-client"
              onClick={() => setLocation("/forgot-password")}
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 input-client">
      <Card className="w-full max-w-md shadow-2xl input-client">
        <CardHeader className="space-y-3 text-center input-client">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center input-client">
            <Lock className="w-8 h-8 text-primary input-client" />
          </div>
          <CardTitle className="text-3xl font-bold input-client">Reset Password</CardTitle>
          <CardDescription className="text-base input-client">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-6 input-client">
              <Alert className="bg-green-50 border-green-200 input-client">
                <CheckCircle className="h-4 w-4 text-green-600 input-client" />
                <AlertDescription className="text-green-800 input-client">
                  Your password has been reset successfully! Redirecting to login...
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 input-client">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 input-client">
                <Label htmlFor="newPassword" className="flex items-center gap-2 input-client">
                  <Lock className="w-4 h-4 input-client" />
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={error ? "border-destructive" : ""}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground input-client">
                  Password must be at least 6 characters
                </p>
              </div>

              <div className="space-y-2 input-client">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2 input-client">
                  <Lock className="w-4 h-4 input-client" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={error ? "border-destructive" : ""}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold input-client"
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin input-client" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground input-client">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/login")}
                  className="text-primary hover:underline font-medium input-client"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
