"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { User } from "lucide-react";

type SlotUserDisplayProps = {
  slotName: string;
  userEmail?: string | null;
  className?: string;
};

export function SlotUserDisplay({
  slotName,
  userEmail,
  className = "",
}: SlotUserDisplayProps) {
  if (!userEmail) {
    return (
      <span className={`font-medium ${className}`}>
        {slotName}
        <span className="text-muted-foreground text-sm italic ml-2">
          (Non assigné)
        </span>
      </span>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span
          className={`font-medium cursor-pointer hover:underline ${className}`}
        >
          {slotName}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-muted p-2">
            <User className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{slotName}</p>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
