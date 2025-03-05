
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

/**
 * Index page that redirects users based on authentication status
 * - Authenticated users go to /chat
 * - Non-authenticated users go to /login
 */
export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate("/chat");
      } else {
        navigate("/login");
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner className="h-10 w-10" />
      <span className="ml-4 text-lg text-gray-600">Загрузка...</span>
    </div>
  );
}
