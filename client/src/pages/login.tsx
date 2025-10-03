import LoginPage from "@/components/LoginPage";
import { useLocation } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();

  const handleLogin = (username: string, password: string) => {
    console.log("Login:", username, password);
    setLocation("/");
  };

  const handleRegister = (username: string, password: string) => {
    console.log("Register:", username, password);
    setLocation("/");
  };

  return <LoginPage onLogin={handleLogin} onRegister={handleRegister} />;
}
