
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-4 text-4xl font-bold">404</h1>
      <p className="mb-6 text-center text-lg text-gray-600">
        Упс! Страница, которую вы ищете, не существует.
      </p>
      <Button onClick={() => navigate("/")}>Вернуться на главную</Button>
    </div>
  );
}
