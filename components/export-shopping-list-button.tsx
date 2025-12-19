"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportShoppingListButton({
  instanceId,
}: {
  instanceId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/instances/${instanceId}/export-shopping-list`
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'export");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `liste-de-courses-${
        new Date().toISOString().split("T")[0]
      }.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Une erreur est survenue lors de l'export");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={isLoading}>
      <Download className="mr-2 h-4 w-4" />
      {isLoading ? "Export..." : "Exporter la liste de courses"}
    </Button>
  );
}
