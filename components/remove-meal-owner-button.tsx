"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function RemoveMealOwnerButton({
  mealId,
  instanceId,
  isLastOwner,
  mealName,
}: {
  mealId: string;
  instanceId: string;
  isLastOwner: boolean;
  mealName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRemove = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/meals/owners?mealId=${mealId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setOpen(false);

      if (data.deleted) {
        // Le repas a été supprimé, rediriger vers l'instance
        router.push(`/instances/${instanceId}`);
      } else {
        // Le repas existe encore, rafraîchir la page
        router.refresh();
      }
    } catch (err) {
      alert("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Se retirer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="default" className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isLastOwner ? "Supprimer le repas ?" : "Se retirer du repas ?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isLastOwner ? (
              <>
                Vous êtes le dernier propriétaire de ce repas. Si vous vous
                retirez, le repas <strong>"{mealName}"</strong> sera
                définitivement supprimé.
              </>
            ) : (
              <>
                Êtes-vous sûr de vouloir vous retirer du repas{" "}
                <strong>"{mealName}"</strong> ? Vous ne pourrez plus le
                modifier.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={isLoading}
            variant={isLastOwner ? "destructive" : "default"}
          >
            {isLoading
              ? "Traitement..."
              : isLastOwner
              ? "Supprimer le repas"
              : "Se retirer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
