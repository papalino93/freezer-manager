import { isGoogleConfigured } from "@/lib/auth";
import { AccediForm } from "@/components/AccediForm";

export const metadata = { title: "Accedi" };

export default function AccediPage() {
  return <AccediForm googleEnabled={isGoogleConfigured} />;
}
