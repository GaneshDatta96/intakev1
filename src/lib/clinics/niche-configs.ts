import { z } from "zod";
import rawNicheConfigs from "../../../niche_configs.json";

const questionnaireFieldSchema = z.discriminatedUnion("type", [
  z.object({
    key: z.string().trim().min(1),
    question: z.string().trim().min(1),
    type: z.literal("text"),
  }),
  z.object({
    key: z.string().trim().min(1),
    question: z.string().trim().min(1),
    type: z.literal("select"),
    options: z.array(z.string().trim().min(1)).min(1),
  }),
  z.object({
    key: z.string().trim().min(1),
    question: z.string().trim().min(1),
    type: z.literal("multi"),
    options: z.array(z.string().trim().min(1)).min(1),
  }),
  z.object({
    key: z.string().trim().min(1),
    question: z.string().trim().min(1),
    type: z.literal("scale"),
    min: z.number().int(),
    max: z.number().int(),
  }),
]);

export const nicheConfigSchema = z.object({
  label: z.string().trim().min(1),
  questionnaire: z.array(questionnaireFieldSchema).min(1),
  soap: z.object({
    S: z.array(z.string().trim()),
    O: z.array(z.string().trim()),
    A: z.array(z.string().trim()),
    P: z.array(z.string().trim()),
  }),
});

const nicheConfigsSchema = z.record(z.string(), nicheConfigSchema);

export const nicheConfigs = nicheConfigsSchema.parse(rawNicheConfigs);

export type QuestionnaireField = z.infer<typeof questionnaireFieldSchema>;
export type NicheConfig = z.infer<typeof nicheConfigSchema>;
export type NicheKey = keyof typeof nicheConfigs;

export const clinicCatalog = [
  {
    slug: "functional-medicine",
    niche: "functional_medicine",
    clinicName: "Summit Functional Medicine",
    headline: "Config-driven intake for root-cause and lifestyle-oriented clinics.",
  },
  {
    slug: "chiropractic",
    niche: "chiropractor",
    clinicName: "Atlas Chiropractic Studio",
    headline: "Pain, mobility, and musculoskeletal SOAP context tailored for chiropractic reviews.",
  },
  {
    slug: "med-spa",
    niche: "aesthetic_clinic",
    clinicName: "Luma Aesthetic Clinic",
    headline: "Aesthetic intake focused on concern history, treatment expectations, and suitability review.",
  },
  {
    slug: "holistic",
    niche: "holistic",
    clinicName: "Ayuna Holistic Care",
    headline: "Mind-body intake for holistic and Ayurveda-inspired workflows.",
  },
  {
    slug: "general-practice",
    niche: "general_practice",
    clinicName: "Northfield General Practice",
    headline: "Lean intake flow for more traditional clinics and broad primary-care style demos.",
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  niche: NicheKey;
  clinicName: string;
  headline: string;
}>;

type LocalClinicPreset = (typeof clinicCatalog)[number];

export type ClinicDefinition = {
  id?: string;
  slug: string;
  niche: string;
  clinicName: string;
  headline: string;
  location?: string;
  country?: string;
  website?: string;
  description?: string;
  approach?: string;
  isDemo?: boolean;
  createdAt?: string;
  config: NicheConfig;
};

export const defaultClinicSlug = "general-practice";

export function isSupportedNiche(niche: string): niche is NicheKey {
  return niche in nicheConfigs;
}

export function getClinicHeadline(args: {
  niche: string;
  description?: string | null;
  approach?: string | null;
}) {
  const normalizedDescription = args.description?.trim();
  if (normalizedDescription) {
    return normalizedDescription;
  }

  const normalizedApproach = args.approach?.trim();
  if (normalizedApproach) {
    return normalizedApproach;
  }

  if (isSupportedNiche(args.niche)) {
    const preset = clinicCatalog.find((clinic) => clinic.niche === args.niche);
    if (preset) {
      return preset.headline;
    }
  }

  return "Config-driven intake and SOAP flow tailored to this clinic.";
}

export function buildClinicDefinition(args: {
  id?: string;
  slug: string;
  niche: string;
  clinicName: string;
  headline?: string;
  location?: string;
  country?: string;
  website?: string;
  description?: string;
  approach?: string;
  isDemo?: boolean;
  createdAt?: string;
  config: NicheConfig;
}): ClinicDefinition {
  return {
    id: args.id,
    slug: args.slug,
    niche: args.niche,
    clinicName: args.clinicName,
    headline:
      args.headline ??
      getClinicHeadline({
        niche: args.niche,
        description: args.description,
        approach: args.approach,
      }),
    location: args.location,
    country: args.country,
    website: args.website,
    description: args.description,
    approach: args.approach,
    isDemo: args.isDemo,
    createdAt: args.createdAt,
    config: args.config,
  };
}

function buildLocalClinicDefinition(clinic: LocalClinicPreset): ClinicDefinition {
  return buildClinicDefinition({
    slug: clinic.slug,
    niche: clinic.niche,
    clinicName: clinic.clinicName,
    headline: clinic.headline,
    isDemo: true,
    config: nicheConfigs[clinic.niche],
  });
}

export function getClinicBySlug(slug: string): ClinicDefinition | null {
  const clinic = clinicCatalog.find((item) => item.slug === slug);

  if (!clinic) {
    return null;
  }

  return buildLocalClinicDefinition(clinic);
}

export function getClinicByNiche(niche: string): ClinicDefinition | null {
  const clinic = clinicCatalog.find((item) => item.niche === niche);

  if (!clinic) {
    return null;
  }

  return buildLocalClinicDefinition(clinic);
}

export function getDefaultClinic() {
  return getClinicBySlug(defaultClinicSlug)!;
}

export function getAllClinics() {
  return clinicCatalog.map((clinic) => buildLocalClinicDefinition(clinic));
}
