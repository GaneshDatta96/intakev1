import { CreateDemoForm } from "@/components/clinics/create-demo-form";
import { getDemoNicheOptions } from "@/lib/clinics/store";

export default function CreateDemoPage() {
  return <CreateDemoForm nicheOptions={getDemoNicheOptions()} />;
}
