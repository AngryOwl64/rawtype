// Shared theme types for built-in and uploaded RawType themes.
// Keeps shared token and upload package types typed consistently.
export type ThemeSource = "built-in" | "community" | "upload";

export type ThemeToken =
  | "--page-bg"
  | "--header-bg"
  | "--text"
  | "--muted"
  | "--muted-strong"
  | "--surface"
  | "--surface-soft"
  | "--input-bg"
  | "--input-muted"
  | "--border"
  | "--border-soft"
  | "--border-strong"
  | "--primary"
  | "--primary-text"
  | "--success"
  | "--danger"
  | "--danger-bg"
  | "--danger-border";

export type ThemeManifest = {
  id: string;
  name: string;
  version: string;
  source: ThemeSource;
  author?: string;
  description?: string;
  tokens: Partial<Record<ThemeToken, string>>;
};

export type ThemeUploadPackage = {
  manifest: ThemeManifest;
  previewImagePath?: string;
  files: ReadonlyArray<string>;
};
