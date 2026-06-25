import { z } from "zod";

/* Schema for the question bank (src/data/questions.json).
   Validated in tests (test/unit/questions.schema.test.ts) so malformed content
   fails CI before it ever ships; the runtime loader trusts the validated JSON. */

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
