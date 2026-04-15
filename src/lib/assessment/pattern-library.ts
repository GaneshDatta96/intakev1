export type PatternDefinition = {
  key: string;
  label: string;
  requiredSymptoms: string[];
  supportingSymptoms: string[];
  contextSignals: string[];
  redFlags: string[];
  assessmentHints: string[];
  dataGapPrompts: string[];
};

export const patternLibrary: PatternDefinition[] = [
  {
    key: "digestive_pattern",
    label: "Digestive Dysfunction Pattern",
    requiredSymptoms: ["bloating"],
    supportingSymptoms: ["gas", "constipation", "diarrhea", "brain_fog"],
    contextSignals: ["processed_diet", "high_stress", "recent_antibiotics"],
    redFlags: ["blood_in_stool", "unintentional_weight_loss"],
    assessmentHints: [
      "Findings are consistent with a digestive dysfunction pattern.",
      "Pattern suggests GI imbalance requiring clinical correlation.",
    ],
    dataGapPrompts: ["bowel movement frequency", "food triggers", "prior GI workup"],
  },
  {
    key: "fatigue_pattern",
    label: "Fatigue and Recovery Pattern",
    requiredSymptoms: ["fatigue"],
    supportingSymptoms: ["brain_fog", "poor_sleep", "headaches"],
    contextSignals: ["poor_sleep", "high_stress", "sedentary"],
    redFlags: [],
    assessmentHints: [
      "Findings are consistent with a fatigue and poor recovery pattern.",
      "Pattern suggests impaired recovery capacity rather than a single definitive cause.",
    ],
    dataGapPrompts: ["energy fluctuations", "caffeine use", "recent lab work"],
  },
  {
    key: "stress_sleep_pattern",
    label: "Stress and Sleep Dysregulation Pattern",
    requiredSymptoms: ["poor_sleep"],
    supportingSymptoms: ["high_stress", "fatigue", "headaches", "brain_fog"],
    contextSignals: ["high_stress", "poor_sleep"],
    redFlags: [],
    assessmentHints: [
      "Findings are consistent with stress-related sleep dysregulation.",
      "Pattern suggests autonomic or recovery imbalance requiring clinical review.",
    ],
    dataGapPrompts: ["sleep onset latency", "night waking pattern", "stress coping strategies"],
  },
  {
    key: "mechanical_pain_pattern",
    label: "Mechanical Pain Pattern",
    requiredSymptoms: ["low_back_pain"],
    supportingSymptoms: ["neck_pain", "joint_pain", "headaches", "numbness_weakness"],
    contextSignals: ["sedentary", "mechanical_trigger"],
    redFlags: ["numbness_weakness"],
    assessmentHints: [
      "Findings are consistent with a mechanical pain presentation.",
      "Pattern suggests functional musculoskeletal strain with red flag screening still required.",
    ],
    dataGapPrompts: ["injury mechanism", "radiation pattern", "movement limitations"],
  },
  {
    key: "inflammatory_pattern",
    label: "Systemic Inflammatory Pattern",
    requiredSymptoms: ["joint_pain"],
    supportingSymptoms: ["fatigue", "poor_sleep", "headaches"],
    contextSignals: ["inflammatory_history", "high_stress"],
    redFlags: ["unintentional_weight_loss"],
    assessmentHints: [
      "Findings are consistent with a broader inflammatory presentation.",
      "Pattern suggests systemic contributors that warrant further evaluation.",
    ],
    dataGapPrompts: ["morning stiffness", "known autoimmune history", "prior inflammatory markers"],
  },
  {
    key: "metabolic_pattern",
    label: "Metabolic Regulation Pattern",
    requiredSymptoms: ["weight_gain"],
    supportingSymptoms: ["fatigue", "sugar_cravings", "poor_sleep"],
    contextSignals: ["sugar_heavy_diet", "sedentary", "family_metabolic_history"],
    redFlags: [],
    assessmentHints: [
      "Findings are consistent with a metabolic regulation pattern.",
      "Pattern suggests glycemic or lifestyle contributors requiring more data.",
    ],
    dataGapPrompts: ["meal timing", "fasting labs", "weight trend"],
  },
];
