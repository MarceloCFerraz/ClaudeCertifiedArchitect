import { z } from "zod";

/* Schemas for the hand-authored content: the question bank (src/data/questions.json)
   and the glossary (src/data/glossary.json). Both are validated in tests
   (test/unit/questions-bank.test.ts, test/unit/glossary-bank.test.ts) so malformed
   content fails CI before it ever ships; the runtime loaders trust the validated JSON. */

export const choiceSchema = z.object({
  t: z.string().min(1),
  c: z.literal(true).optional(),
});

export const questionSchema = z
  .object({
    id: z.string().min(1),
    s: z.number().int().min(1).max(6),
    d: z.number().int().min(1).max(5),
    ts: z.string().min(1),
    diff: z.literal("hard").optional(),
    q: z.string().min(1),
    choices: z.array(choiceSchema).length(4),
    exp: z.string().min(1),
  })
  .refine((question) => question.choices.filter((c) => c.c === true).length === 1, {
    message: "a question must have exactly one correct choice",
  });

export const bankSchema = z.array(questionSchema);

export type Choice = z.infer<typeof choiceSchema>;
export type Question = z.infer<typeof questionSchema>;

/** Ceiling on a glossary definition. Load-bearing rather than cosmetic: the hover
    tooltip has no portal, so `src/lib/tooltip-position.ts` estimates its height from a
    constant to decide whether to open above or below the term. Raise this and
    TOOLTIP_HEIGHT stops being honest, and long definitions open off-screen. */
export const DEF_MAX_CHARS = 160;

/* Anything matched inside prose has to start and end on a word character: the matcher
   in src/lib/glossary-terms.ts asserts its boundaries with a character class, so a
   surface wrapped in punctuation would make those assertions meaningless. */
const matchSurface = z
  .string()
  .min(2)
  .regex(/^[A-Za-z0-9][^\n]*[A-Za-z0-9]$/, "must start and end with a letter or digit");

export const glossaryEntrySchema = z.object({
  term: matchSurface,
  def: z.string().min(1).max(DEF_MAX_CHARS),
  more: z.string().min(1).optional(),
  /** Aliases, acronym expansions and irregular inflections. Feed both search and
      in-text matching, so a form listed here gets underlined like the term itself. */
  also: z.array(matchSurface).min(1).optional(),
  /** Opt out of in-text underlining for a term that is also an ordinary English word
      ("turn", "state", "batch"). The entry still shows on the page and in search. */
  annotate: z.literal(false).optional(),
});

export const glossarySchema = z.array(glossaryEntrySchema);

export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>;
