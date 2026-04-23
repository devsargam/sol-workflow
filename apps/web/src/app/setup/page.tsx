import { Suspense } from "react";
import SetupClientPage from "./client-page";

export default function SetupPage() {
  return (
    <Suspense>
      <SetupClientPage />
    </Suspense>
  );
}
