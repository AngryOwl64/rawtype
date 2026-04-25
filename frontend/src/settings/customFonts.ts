import type { CustomFont } from "../games/typing/types";
import { supabase } from "../lib/supabase";

const GOOGLE_FONTS_CSS2_ORIGIN = "https://fonts.googleapis.com";
const GOOGLE_FONTS_CSS2_PATH = "/css2";
const FAMILY_NAME_PATTERN = /^[A-Za-z0-9 ._-]{1,80}$/;

type CustomFontRow = {
  id: string;
  family_name: string;
  css_url: string;
};

function requireSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function normalizeCssUrl(rawUrl: string): { cssUrl: string; familyName: string } {
  let url: URL;

  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error("Paste a valid Google Fonts CSS link.");
  }

  if (url.origin !== GOOGLE_FONTS_CSS2_ORIGIN || url.pathname !== GOOGLE_FONTS_CSS2_PATH) {
    throw new Error("Only Google Fonts css2 links are supported.");
  }

  const family = url.searchParams.get("family");
  if (!family) {
    throw new Error("The Google Fonts link does not include a font family.");
  }

  const familyName = family.split(":")[0]?.replace(/\+/g, " ").trim() ?? "";
  if (!FAMILY_NAME_PATTERN.test(familyName)) {
    throw new Error("The font family name is not supported.");
  }

  const safeUrl = new URL(`${GOOGLE_FONTS_CSS2_ORIGIN}${GOOGLE_FONTS_CSS2_PATH}`);
  safeUrl.searchParams.set("family", family);
  safeUrl.searchParams.set("display", "swap");

  return {
    cssUrl: safeUrl.toString(),
    familyName
  };
}

function mapCustomFont(row: CustomFontRow): CustomFont {
  return {
    id: row.id,
    selection: `custom:${row.id}`,
    familyName: row.family_name,
    cssUrl: row.css_url
  };
}

export function validateGoogleFontLink(rawUrl: string) {
  return normalizeCssUrl(rawUrl);
}

export async function fetchCustomFonts(): Promise<CustomFont[]> {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("custom_fonts")
    .select("id, family_name, css_url")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCustomFont);
}

export async function importGoogleFont(rawUrl: string): Promise<CustomFont> {
  const client = requireSupabaseClient();
  const { cssUrl, familyName } = normalizeCssUrl(rawUrl);
  const { data, error } = await client
    .from("custom_fonts")
    .insert({ family_name: familyName, css_url: cssUrl, source: "google" })
    .select("id, family_name, css_url")
    .single();

  if (error) throw new Error(error.message);
  return mapCustomFont(data);
}

export async function deleteCustomFont(fontId: string): Promise<void> {
  const client = requireSupabaseClient();
  const { error } = await client.from("custom_fonts").delete().eq("id", fontId);

  if (error) throw new Error(error.message);
}
