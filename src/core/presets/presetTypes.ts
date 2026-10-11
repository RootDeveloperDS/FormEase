export type SlotType = 'photo' | 'signature' | 'document';

export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

export interface SlotRequirement {
  id: string;
  type: SlotType;
  title: string;
  description: string;
  targetMaxBytes: number; // in bytes, e.g., 50 * 1024
  targetMinBytes?: number; // optional, e.g., 20 * 1024
  width: number; // recommended px width
  height: number; // recommended px height
  aspectRatio: string; // e.g. "1:1", "2:1", "35:45", "4:3", "Free"
  aspectRatioValue: number; // width / height
  allowedFormats: OutputFormat[];
  defaultFormat: OutputFormat;
  biometricOverlay?: boolean;
  isGrayscaleDoc?: boolean;
  dpi?: number;
  faceCoverage?: string; // e.g. "70% - 80%"
}

export type PresetCountry = 'US' | 'IN' | 'GLOBAL' | 'CUSTOM';

export interface PortalPreset {
  id: string;
  name: string;
  country: PresetCountry;
  countryFlag: string;
  authority: string;
  category: 'visa' | 'passport' | 'exam' | 'govt' | 'general';
  description: string;
  slots: {
    photo?: SlotRequirement;
    signature?: SlotRequirement;
    document?: SlotRequirement;
  };
  portalUrl?: string;
  isCustom?: boolean;
}
