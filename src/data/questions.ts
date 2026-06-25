import questionsJson from "./questions.json";
import type { Question } from "./schema";

/* Typed view of the raw JSON bank. Integrity (unique ids, exactly one correct
   choice, valid domain/scenario refs, sufficient counts) is enforced by the
   schema test, so the cast here is safe. zod stays out of the client bundle. */
export const BANK = questionsJson as unknown as Question[];
