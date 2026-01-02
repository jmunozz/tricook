import { Slot } from "@/generated/prisma/client";
import { UserHoverCard } from "./user-hover-card";

export function SlotUser({
  slot,
}: {
  slot: Slot & { user: { email: string } | null | undefined };
}) {
  return (
    <UserHoverCard key={slot.id} user={slot.user}>
      <div className="border border-green-400 px-4 py-1 rounded-full font-medium hover:cursor-pointer">
        {`👨‍🍳 ${slot.name}`}
      </div>
    </UserHoverCard>
  );
}
