import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import HCaptcha from "@hcaptcha/react-hcaptcha";

interface LoginFormProps {
  onSuccess: (token: string, user: any) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [ipAuthRequired, setIpAuthRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001";

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      setError("Please complete the CAPTCHA");
      return;
    }

    setIsLoading(true);
    setError("");
    setIpAuthRequired(false);

    try {
      const response = await apiRequest('POST', '/api/auth/login', {
        username,
        password,
        captchaToken,
      });

      const data = await response.json();
      const privateKey = localStorage.getItem('privateKey');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ ...data.user, privateKey }));
      onSuccess(data.token, { ...data.user, privateKey });
    } catch (err: any) {
      const errorMessage = err.message || "";
      if (errorMessage.includes('IP_AUTHORIZATION_REQUIRED') || errorMessage.includes('New device detected')) {
        setIpAuthRequired(true);
        setError("New device detected. Check your email to authorize this device.");
      } else {
        setError(err.message || "Invalid credentials");
      }
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <Alert variant={ipAuthRequired ? "default" : "destructive"} data-testid="alert-error">
          {ipAuthRequired ? (
            <Mail className="h-4 w-4 text-primary" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription className={ipAuthRequired ? "text-primary" : ""}>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="login-username">Username</Label>
        <Input
          id="login-username"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
          placeholder="Enter your username"
          required
          disabled={isLoading}
          data-testid="input-login-username"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="Enter your password"
          required
          disabled={isLoading}
          data-testid="input-login-password"
        />
      </div>

      <div className="flex justify-center" data-testid="captcha-container">
        <HCaptcha
          ref={captchaRef}
          sitekey={HCAPTCHA_SITE_KEY}
          onVerify={handleCaptchaVerify}
          onExpire={() => setCaptchaToken(null)}
          onError={() => setError("CAPTCHA error. Please try again.")}
          theme="dark"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !captchaToken}
        data-testid="button-login"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : (
          "Login"
        )}
      </Button>

      {ipAuthRequired && (
        <div className="bg-primary/10 border border-primary/50 rounded-md p-4 text-sm">
          <p className="font-semibold text-primary mb-1">New Device Detected</p>
          <p className="text-muted-foreground">
            For security, we've sent an authorization link to your email. Click the link to authorize this device, then try logging in again.
          </p>
        </div>
      )}
    </form>
  );
}
