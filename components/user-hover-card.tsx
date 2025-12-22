"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { User as UserIcon } from "lucide-react";

interface User {
  email: string;
}

type UserHoverCardProps = {
  user?: User | null;
  children?: React.ReactNode;
};

export function UserHoverCard({ user, children }: UserHoverCardProps) {
  if (!user) {
    return <>{children}</>;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-muted p-2">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{user.email}</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
