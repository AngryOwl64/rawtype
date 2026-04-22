// Validation and registration hooks for future custom theme uploads.
// The upload path is stubbed until custom themes are fully wired in.
import type { ThemeManifest, ThemeUploadPackage } from "./types";

export type ThemeValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateThemeManifest(manifest: ThemeManifest): ThemeValidationResult {
  const errors: string[] = [];

  if (!manifest.id?.trim()) errors.push("Theme manifest requires a non-empty id.");
  if (!manifest.name?.trim()) errors.push("Theme manifest requires a non-empty name.");
  if (!manifest.version?.trim()) errors.push("Theme manifest requires a version.");

  return {
    valid: errors.length === 0,
    errors
  };
}

export async function registerCustomTheme(pkg: ThemeUploadPackage): Promise<void> {
  void pkg;
  throw new Error("Custom theme upload is not implemented yet.");
}
