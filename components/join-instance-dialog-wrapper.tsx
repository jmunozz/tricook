"use client";

import { Suspense } from "react";
import { JoinInstanceDialog } from "./join-instance-dialog";

function JoinInstanceDialogContent() {
  return <JoinInstanceDialog />;
}

export function JoinInstanceDialogWrapper() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <JoinInstanceDialogContent />
    </Suspense>
  );
}
