"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Copy, Check, UserPlus } from "lucide-react";

type ShareMode = "token" | "url";

export function ShareInstanceToken({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ShareMode>("token");
  const [copied, setCopied] = useState(false);

  const getDisplayValue = () => {
    if (mode === "token") {
      return token;
    }
    // Mode URL
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/dashboard?token=${token}`;
  };

  const handleCopy = async () => {
    const value = getDisplayValue();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Inviter des utilisateurs
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="default" className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Inviter des utilisateurs</AlertDialogTitle>
          <AlertDialogDescription>
            Partagez le token ou l'URL pour permettre à d'autres utilisateurs de
            rejoindre cette instance.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-4 space-y-4">
          <Field>
            <FieldLabel>Mode de partage</FieldLabel>
            <FieldContent>
              <Select
                value={mode}
                onValueChange={(value) => setMode(value as ShareMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="token">Token uniquement</SelectItem>
                  <SelectItem value="url">URL complète</SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel>{mode === "token" ? "Token" : "URL"}</FieldLabel>
            <FieldContent>
              <InputGroup>
                <InputGroupInput
                  type="text"
                  value={getDisplayValue()}
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

          <p className="text-xs text-muted-foreground">
            {mode === "token"
              ? "Partagez ce token avec les utilisateurs que vous souhaitez inviter."
              : "Partagez cette URL pour que les utilisateurs rejoignent automatiquement l'instance."}
          </p>
        </div>

        <AlertDialogCancel>Fermer</AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
}
