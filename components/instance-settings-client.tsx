"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Info,
  Users,
  Trash2,
  Plus,
  X,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { SlotUser } from "@/components/slot-user";
import { cn } from "@/lib/utils";
import { UserHoverCard } from "@/components/user-hover-card";
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";

type SimpleSlot = {
  id: string;
  name: string;
  instanceId: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: { email: string } | null;
};

type Instance = {
  id: string;
  name: string;
  joinToken: string;
  createdAt: string;
  updatedAt: string;
};

export function InstanceSettingsClient({
  instance,
  slots: initialSlots,
  currentUserId,
  initialSection = "infos",
}: {
  instance: Instance;
  slots: SimpleSlot[];
  currentUserId: string;
  initialSection?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState(initialSection);
  const [name, setName] = useState(instance.name);
  const [slots, setSlots] = useState(initialSlots);
  const [newSlotName, setNewSlotName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleUpdateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Le nom de l'instance est requis");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/instances/${instance.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      router.refresh();
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newSlotName.trim()) {
      setError("Le nom du slot est requis");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/instances/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceId: instance.id,
          name: newSlotName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      // Ajouter le nouveau slot à la liste
      setSlots([...slots, data.slot]);
      setNewSlotName("");
      setIsLoading(false);
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    setDeletingSlotId(slotId);
    setError("");

    try {
      const response = await fetch(`/api/instances/slots/${slotId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        setDeletingSlotId(null);
        return;
      }

      // Retirer le slot de la liste
      setSlots(slots.filter((slot) => slot.id !== slotId));
      setDeletingSlotId(null);
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setDeletingSlotId(null);
    }
  };

  const handleDeleteInstance = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/instances/${instance.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Une erreur est survenue");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      alert("Une erreur est survenue. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  const updateSection = (section: string) => {
    setActiveSection(section);
    router.push(`${pathname}?section=${section}`, { scroll: false });
  };

  const getShareUrl = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/dashboard?token=${instance.joinToken}`;
  };

  const handleCopy = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
    }
  };

  const sections = [
    { id: "infos", label: "Infos", icon: Info },
    { id: "share", label: "Partage", icon: Share2 },
    { id: "owners", label: "Cuistots", icon: Users },
    { id: "danger", label: "Danger", icon: Trash2 },
  ];

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-64 shrink-0">
        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => updateSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>
              {activeSection === "infos" && "Informations de l'instance"}
              {activeSection === "share" && "Partager l'instance"}
              {activeSection === "owners" && "Gérer les cuistots"}
              {activeSection === "danger" && "Zone de danger"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Infos Section */}
            {activeSection === "infos" && (
              <form onSubmit={handleUpdateInstance} className="space-y-4">
                <Field>
                  <FieldLabel>Nom de l'instance</FieldLabel>
                  <FieldContent>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                    />
                  </FieldContent>
                </Field>

                {error && <FieldError>{error}</FieldError>}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </form>
            )}

            {/* Share Section */}
            {activeSection === "share" && (
              <div className="space-y-4">
                <Field>
                  <FieldLabel>URL de partage</FieldLabel>
                  <FieldDescription>
                    Partagez cette URL pour que les utilisateurs rejoignent
                    automatiquement l'instance.
                  </FieldDescription>
                  <FieldContent>
                    <InputGroup>
                      <InputGroupInput
                        type="text"
                        value={getShareUrl()}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <InputGroupButton
                        type="button"
                        onClick={handleCopy}
                        variant="ghost"
                        size="xs"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copié
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copier
                          </>
                        )}
                      </InputGroupButton>
                    </InputGroup>
                  </FieldContent>
                </Field>
              </div>
            )}

            {/* Owners Section */}
            {activeSection === "owners" && (
              <div className="space-y-4">
                {/* Liste des slots existants */}
                <div>
                  <FieldLabel className="mb-2">Cuistots</FieldLabel>
                  {slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucun cuistot pour le moment
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      {slots.map((slot) => (
                        <div key={slot.id} className="flex items-center gap-2">
                          <SlotUser
                            slot={{ ...slot, user: slot.user ?? null }}
                          />
                          {!slot.user && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Êtes-vous sûr de vouloir supprimer ce cuistot ?"
                                  )
                                ) {
                                  handleDeleteSlot(slot.id);
                                }
                              }}
                              disabled={deletingSlotId === slot.id || isLoading}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Supprimer</span>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Formulaire pour ajouter un slot */}
                <form onSubmit={handleAddSlot} className="space-y-4">
                  <Field>
                    <FieldLabel hidden>Ajouter un cuistot</FieldLabel>
                    <FieldDescription>
                      Les cuistots peuvent être assignés à des repas. Chaque
                      cuistot peut être associé ou non à un utilisateur actif.
                    </FieldDescription>

                    <FieldContent>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Nom du cuistot"
                          value={newSlotName}
                          onChange={(e) => setNewSlotName(e.target.value)}
                          disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading}>
                          Ajouter
                        </Button>
                      </div>
                    </FieldContent>
                    {error && <FieldError>{error}</FieldError>}
                  </Field>
                </form>
              </div>
            )}

            {/* Danger Section */}
            {activeSection === "danger" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Supprimer l'instance
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Cette action est irréversible. Tous les repas, ingrédients
                    et cuistots associés à cette instance seront également
                    supprimés.
                  </p>
                  <AlertDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Êtes-vous sûr de vouloir supprimer cette instance ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. L'instance "
                          {instance.name}" et tous ses contenus (repas,
                          ingrédients, cuistots) seront définitivement
                          supprimés.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteInstance}
                          disabled={isLoading}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isLoading ? "Suppression..." : "Supprimer"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isLoading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer l'instance
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
