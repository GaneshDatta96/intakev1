import { getSupabaseAdmin } from "@/lib/db/supabase";
import {
  buildClinicDefinition,
  getAllClinics,
  getClinicBySlug,
  getClinicByNiche,
  getClinicHeadline,
  isSupportedNiche,
  nicheConfigSchema,
  nicheConfigs,
  type ClinicDefinition,
  type NicheConfig,
  type NicheKey,
} from "@/lib/clinics/niche-configs";

type ClinicRow = {
  id: string;
  name: string;
  slug: string;
  niche: string;
  location: string | null;
  country: string | null;
  website: string | null;
  description: string | null;
  approach: string | null;
  is_demo: boolean | null;
  created_at: string | null;
};

type CreateDemoClinicInput = {
  name: string;
  slug: string;
  niche: string;
  location?: string;
  country?: string;
  website?: string;
  description?: string;
  approach?: string;
};

function getLocalConfig(niche: string) {
  return isSupportedNiche(niche) ? nicheConfigs[niche] : null;
}

async function getConfigForNiche(niche: string): Promise<NicheConfig | null> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return getLocalConfig(niche);
  }

  const { data, error } = await supabase
    .from("niche_configs")
    .select("config")
    .eq("niche", niche)
    .maybeSingle();

  if (!error && data?.config) {
    try {
      return nicheConfigSchema.parse(data.config);
    } catch {
      return getLocalConfig(niche);
    }
  }

  return getLocalConfig(niche);
}

function buildFromRow(row: ClinicRow, config: NicheConfig): ClinicDefinition {
  return buildClinicDefinition({
    id: row.id,
    slug: row.slug,
    niche: row.niche,
    clinicName: row.name,
    headline: getClinicHeadline({
      niche: row.niche,
      description: row.description,
      approach: row.approach,
    }),
    location: row.location ?? undefined,
    country: row.country ?? undefined,
    website: row.website ?? undefined,
    description: row.description ?? undefined,
    approach: row.approach ?? undefined,
    isDemo: row.is_demo ?? true,
    createdAt: row.created_at ?? undefined,
    config,
  });
}

export async function getClinicForSlug(slug: string): Promise<ClinicDefinition | null> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return getClinicBySlug(slug);
  }

  const { data, error } = await supabase
    .from("clinics")
    .select(
      "id, name, slug, niche, location, country, website, description, approach, is_demo, created_at",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return getClinicBySlug(slug);
  }

  const config = await getConfigForNiche(data.niche);

  if (!config) {
    return getClinicBySlug(slug) ?? getClinicByNiche(data.niche);
  }

  return buildFromRow(data, config);
}

export async function getDemoClinics(): Promise<ClinicDefinition[]> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return getAllClinics();
  }

  const { data, error } = await supabase
    .from("clinics")
    .select(
      "id, name, slug, niche, location, country, website, description, approach, is_demo, created_at",
    )
    .eq("is_demo", true)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error || !data || data.length === 0) {
    return getAllClinics();
  }

  const uniqueNiches = Array.from(new Set(data.map((clinic) => clinic.niche)));
  const configs = new Map<string, NicheConfig>();

  await Promise.all(
    uniqueNiches.map(async (niche) => {
      const config = await getConfigForNiche(niche);
      if (config) {
        configs.set(niche, config);
      }
    }),
  );

  const clinics = data
    .map((row) => {
      const config = configs.get(row.niche);
      return config ? buildFromRow(row, config) : null;
    })
    .filter((clinic): clinic is ClinicDefinition => clinic !== null);

  return clinics.length > 0 ? clinics : getAllClinics();
}

export async function createDemoClinic(
  input: CreateDemoClinicInput,
): Promise<ClinicDefinition> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const localConfig = getLocalConfig(input.niche);
    if (!localConfig) {
      throw new Error("Unknown niche config for demo clinic.");
    }

    return buildClinicDefinition({
      slug: input.slug,
      niche: input.niche,
      clinicName: input.name,
      headline: input.description ?? input.approach,
      location: input.location,
      country: input.country,
      website: input.website,
      description: input.description,
      approach: input.approach,
      isDemo: true,
      config: localConfig,
    });
  }

  const { data, error } = await supabase
    .from("clinics")
    .insert({
      name: input.name,
      slug: input.slug,
      niche: input.niche,
      location: input.location ?? null,
      country: input.country?.trim() || "United States",
      website: input.website ?? null,
      description: input.description ?? null,
      approach: input.approach ?? null,
      is_demo: true,
    })
    .select(
      "id, name, slug, niche, location, country, website, description, approach, is_demo, created_at",
    )
    .single();

  if (error || !data) {
    throw error ?? new Error("Unable to create demo clinic.");
  }

  const config = await getConfigForNiche(data.niche);

  if (!config) {
    throw new Error("Demo clinic created, but no niche config could be resolved.");
  }

  return buildFromRow(data, config);
}

export function getDemoNicheOptions(): Array<{
  niche: NicheKey;
  label: string;
}> {
  return Object.entries(nicheConfigs).map(([niche, config]) => ({
    niche: niche as NicheKey,
    label: config.label,
  }));
}
