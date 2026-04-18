import { type ClinicDefinition } from "@/lib/clinics/niche-configs";

const defaultServicesByNiche: Record<string, string> = {
  aesthetic_clinic:
    "Botox, dermal fillers, laser treatments, and advanced skin care",
  chiropractor:
    "pain relief, spinal care, mobility work, and musculoskeletal recovery",
  functional_medicine:
    "root-cause care, hormone support, gut health, and lifestyle medicine",
  general_practice:
    "primary care visits, symptom evaluation, medication review, and general health concerns",
  holistic:
    "mind-body care, stress support, digestion, energy balance, and lifestyle guidance",
};

const workflowByNiche: Record<string, string> = {
  aesthetic_clinic:
    "Aesthetic consultations work better when treatment history, skin concerns, contraindications, and expectations are structured before the visit.",
  chiropractor:
    "Chiropractic consultations move faster when pain triggers, mobility limits, onset, and prior injuries are organized before the visit.",
  functional_medicine:
    "Functional medicine visits get stronger when symptom timelines, lifestyle patterns, chronicity, and goals are structured before the consult starts.",
  general_practice:
    "General practice visits run smoother when symptoms, duration, history, and medications are already organized before the appointment.",
  holistic:
    "Holistic consultations become more useful when energy, digestion, routine, stress, and patient goals are structured before the session.",
};

function trimSentence(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ").replace(/[.]+$/, "") ?? "";
}

function getLocationText(clinic: ClinicDefinition) {
  const location = trimSentence(clinic.location);
  const country = trimSentence(clinic.country);

  return location || country || "";
}

function getCityText(clinic: ClinicDefinition) {
  const location = trimSentence(clinic.location);

  if (!location) {
    return trimSentence(clinic.country) || "your market";
  }

  const [city] = location.split(",");
  return city?.trim() || location;
}

function getServicesText(clinic: ClinicDefinition) {
  const customServices = trimSentence(clinic.description);
  if (customServices) {
    return customServices;
  }

  return (
    defaultServicesByNiche[clinic.niche] ||
    `${clinic.config.label.toLowerCase()} consultations and patient intake`
  );
}

function getWorkflowAngle(clinic: ClinicDefinition) {
  const customWorkflow = trimSentence(clinic.approach);
  if (customWorkflow) {
    return customWorkflow.endsWith(".") ? customWorkflow : `${customWorkflow}.`;
  }

  return (
    workflowByNiche[clinic.niche] ||
    "This demo is designed around the consultation flow your team likely uses today."
  );
}

export function getClinicPersonalization(clinic: ClinicDefinition) {
  const services = getServicesText(clinic);
  const locationText = getLocationText(clinic);
  const city = getCityText(clinic);
  const workflowAngle = getWorkflowAngle(clinic);
  const contextSentence = locationText
    ? `Based on what we saw, ${clinic.clinicName} focuses on ${services} in ${locationText}.`
    : `Based on what we saw, ${clinic.clinicName} focuses on ${services}.`;

  return {
    city,
    contextSentence,
    locationText,
    services,
    signatureLine: `Built for ${clinic.clinicName} by Ganesh`,
    workflowAngle,
  };
}
