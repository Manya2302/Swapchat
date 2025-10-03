import AuthPage from "@/components/AuthPage";

interface LoginProps {
  onAuthenticated: (token: string, user: any) => void;
}

export default function Login({ onAuthenticated }: LoginProps) {
  return <AuthPage onAuthenticated={onAuthenticated} />;
}
