import glossaryJson from "./glossary.json";
import type { GlossaryEntry } from "./schema";

/* Typed view of the raw JSON glossary. Integrity (unique terms, no surface claimed by
   two entries, one-sentence definitions inside the tooltip cap, alphabetical order) is
   enforced by the schema test, so the cast here is safe. zod stays out of the bundle. */
export const GLOSSARY = glossaryJson as unknown as GlossaryEntry[];
