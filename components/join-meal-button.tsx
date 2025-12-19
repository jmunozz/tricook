"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export function JoinMealButton({
  mealId,
  instanceId,
}: {
  mealId: string;
  instanceId: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/meals/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mealId,
          instanceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      router.refresh();
    } catch (err) {
      alert("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleJoin} disabled={isLoading} variant="default">
      <UserPlus className="mr-2 h-4 w-4" />
      {isLoading ? "Rejoindre..." : "Rejoindre le repas"}
    </Button>
  );
}
