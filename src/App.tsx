import { useState, useMemo, useEffect } from "react";

/* =========================================================================
   Claude Certified Architect – Foundations (CCA-F) · Practice Exam
   Faithful to the official Exam Guide:
   - 5 domains with weights: D1 27% · D2 18% · D3 20% · D4 20% · D5 15%
   - 6 scenarios (the real exam randomly draws 4 of 6)
   - Multiple choice: 1 correct + 3 distractors, with an explanation
   - Scaled 100–1000, passing score 720; practice-exam target: >900
   ========================================================================= */

const DOMAINS = {
  1: { name: "Agentic Architecture & Orchestration", weight: 27 },
  2: { name: "Tool Design & MCP Integration", weight: 18 },
  3: { name: "Claude Code Configuration & Workflows", weight: 20 },
  4: { name: "Prompt Engineering & Structured Output", weight: 20 },
  5: { name: "Context Management & Reliability", weight: 15 },
};

const SCENARIOS = {
  1: {
    title: "Customer Support Resolution Agent",
    blurb:
      "An Agent SDK support agent handles returns, billing disputes, and account issues via custom MCP tools (get_customer, lookup_order, process_refund, escalate_to_human). Target: 80%+ first-contact resolution, while knowing when to escalate.",
    domains: [1, 2, 5],
  },
  2: {
    title: "Code Generation with Claude Code",
    blurb:
      "A team uses Claude Code for generation, refactoring, debugging, and docs — integrated via custom slash commands and CLAUDE.md, weighing plan mode vs direct execution.",
    domains: [3, 5],
  },
  3: {
    title: "Multi-Agent Research System",
    blurb:
      "A coordinator delegates to specialized subagents (web search, document analysis, synthesis, report generation) to produce comprehensive, cited reports.",
    domains: [1, 2, 5],
  },
  4: {
    title: "Developer Productivity with Claude",
    blurb:
      "An agent helps engineers explore unfamiliar codebases and automate tasks using built-in tools (Read, Write, Bash, Grep, Glob) plus MCP servers.",
    domains: [2, 3, 1],
  },
  5: {
    title: "Claude Code for Continuous Integration",
    blurb:
      "Claude Code runs in CI/CD: automated code reviews, test generation, and PR feedback. Prompts must be actionable and minimize false positives.",
    domains: [3, 4],
  },
  6: {
    title: "Structured Data Extraction",
    blurb:
      "A system extracts information from unstructured documents, validates output against JSON schemas, handles edge cases gracefully, and integrates downstream.",
    domains: [4, 5],
  },
};

/* Each question: choices array with exactly one { c:true }. Order is shuffled at runtime. */
const BANK = [
  /* ---------------- Scenario 1 ---------------- */
  {
    id: "S1Q1", s: 1, d: 1, ts: "1.4",
    q: "Your agent must verify identity (get_customer) before process_refund. A teammate adds “Always verify the customer before issuing refunds” to the system prompt, but in testing it still skips verification ~3% of the time on refund requests. What is the most effective fix?",
    choices: [
      { t: "Add a programmatic prerequisite (a gate/hook) that blocks process_refund until get_customer has returned a verified customer ID.", c: true },
      { t: "Expand the system prompt with more emphatic, capitalized MUST language to eliminate the failures." },
      { t: "Set temperature to 0 so the model deterministically follows the verification instruction every time." },
      { t: "Add one few-shot example of verification-first behavior, which guarantees the model verifies first." },
    ],
    exp: "When critical business logic requires a specific order, prompt-based guidance has a non-zero failure rate. Only programmatic enforcement gives a deterministic guarantee. Emphatic wording, temperature, and a single example are all still probabilistic.",
  },
  {
    id: "S1Q2", s: 1, d: 2, ts: "2.2",
    q: "process_refund can fail because the payments service is briefly down, because the amount exceeds the customer's eligible total (policy), or because the caller lacks permission. Today every failure returns “Operation failed.” What change best lets the agent respond appropriately to each case?",
    choices: [
      { t: "Return structured error metadata: errorCategory (transient/validation/business/permission), an isRetryable boolean, and a human-readable explanation.", c: true },
      { t: "Automatically retry any failed refund up to five times with backoff before surfacing an error." },
      { t: "Convert every failure into a generic apology and immediately escalate to a human." },
      { t: "Log the underlying exception server-side and return success so the conversation keeps flowing." },
    ],
    exp: "Uniform errors hide the information the agent needs to recover. Structured categories plus a retryable flag let it retry transient issues, explain business rules, and avoid wasted retries. Blind retries, blanket escalation, and faking success are all anti-patterns.",
  },
  {
    id: "S1Q3", s: 1, d: 5, ts: "5.2",
    q: "A customer opens with “I want to talk to a human, now.” The underlying issue (a duplicate charge) is something your agent could resolve. What is the most appropriate behavior?",
    choices: [
      { t: "Honor the explicit request and escalate immediately, with a structured handoff summary, rather than first attempting to resolve.", c: true },
      { t: "Resolve the duplicate charge first since it is within capability, escalating only if that fails." },
      { t: "Require identity verification and three diagnostic questions before deciding whether to escalate." },
      { t: "Run sentiment analysis and escalate only if detected frustration crosses a threshold." },
    ],
    exp: "An explicit request for a human is honored immediately. Investigating first ignores the explicit demand; gating on diagnostics adds friction; sentiment is an unreliable proxy for what the customer actually asked for.",
  },
  {
    id: "S1Q4", s: 1, d: 5, ts: "5.1",
    q: "Across a long multi-issue conversation, the agent starts restating exact figures (refund amounts, order numbers) vaguely and occasionally wrong. Which technique best preserves these facts?",
    choices: [
      { t: "Extract transactional facts (amounts, dates, order numbers, statuses) into a persistent “case facts” block included in each prompt, outside the summarized history.", c: true },
      { t: "Increase max_tokens so the model can hold more of the conversation per response." },
      { t: "Summarize the conversation more aggressively each turn to keep context small." },
      { t: "Ask the customer to restate their order number and amounts whenever the agent is unsure." },
    ],
    exp: "Progressive summarization is exactly what condenses critical numbers into vague text. A persisted case-facts block kept outside the summary protects them. Larger max_tokens doesn't fix recall, more summarization worsens it, and re-asking shifts the burden to the customer.",
  },
  {
    id: "S1Q5", s: 1, d: 1, ts: "1.4",
    q: "A message says: “My order #882 arrived damaged, I was double-charged on #877, and I want to update my shipping address.” What is the best handling pattern?",
    choices: [
      { t: "Decompose the message into distinct items, investigate each using shared customer context, then synthesize a single unified resolution.", c: true },
      { t: "Handle only the first issue and ask the customer to send the others as separate messages." },
      { t: "Escalate to a human because multi-concern messages exceed single-turn capability." },
      { t: "Issue one process_refund call covering both orders to save round-trips." },
    ],
    exp: "Multi-concern requests are decomposed into separate items, investigated (in parallel where possible) against shared context, then resolved together. Deferring or escalating offloads work unnecessarily; collapsing distinct orders into one refund conflates separate operations.",
  },
  {
    id: "S1Q6", s: 1, d: 2, ts: "2.3",
    q: "To “future-proof” the support agent, a colleague wants to give it all 18 backend tools (inventory, marketing, analytics, HR…) even though the workflow needs about 4. Why is this risky?",
    choices: [
      { t: "Too many tools degrade selection reliability by increasing decision complexity; scope the agent to the 4–5 tools its role needs.", c: true },
      { t: "It raises per-request token cost, but tool-selection accuracy is unaffected." },
      { t: "It is fine as long as each tool name is unique; the model ignores irrelevant tools." },
      { t: "The only real risk is exposing sensitive systems; masking the tool names mitigates it." },
    ],
    exp: "Giving an agent far more tools than its role needs measurably degrades tool selection. Least-privilege scoping is the fix; the problem is reliability, not just cost or security.",
  },
  {
    id: "S1Q7", s: 1, d: 1, ts: "1.5",
    q: "Policy: refunds over $500 require manager approval, and you need a guarantee — not best effort. What is the right Agent SDK mechanism?",
    choices: [
      { t: "A tool-call interception hook that blocks process_refund when the amount exceeds $500 and redirects to the human-escalation workflow.", c: true },
      { t: "A system-prompt rule instructing the agent never to refund more than $500 without approval." },
      { t: "A PostToolUse hook that logs refunds over $500 after they are processed, for later audit." },
      { t: "A few-shot example showing the agent escalating a $600 refund." },
    ],
    exp: "A deterministic guarantee requires intercepting and blocking the outgoing tool call before it executes. A prompt rule or example is probabilistic; a post-hoc log acts only after the refund already went through.",
  },
  {
    id: "S1Q8", s: 1, d: 5, ts: "5.2",
    q: "get_customer returns two customers named “Maria Silva” with different account IDs. What should the agent do?",
    choices: [
      { t: "Ask for an additional identifier (email, order number, ZIP) to disambiguate, rather than choosing one heuristically.", c: true },
      { t: "Pick the account with the most recent activity as the likeliest match." },
      { t: "Proceed with both accounts in parallel and let the customer sort out any errors." },
      { t: "Escalate to a human, since duplicate names always indicate a data-quality incident." },
    ],
    exp: "Multiple matches call for clarification with additional identifiers. Heuristic selection risks acting on the wrong account; running both is reckless; auto-escalation is disproportionate.",
  },
  {
    id: "S1Q9", s: 1, d: 2, ts: "2.1",
    q: "The agent frequently calls get_customer for order questions and lookup_order for account questions. Both descriptions are one line (“Retrieves customer information” / “Retrieves order details”) and accept similar identifiers. What is the most effective first step?",
    choices: [
      { t: "Expand each tool's description with input formats, example queries, edge cases, and explicit “use this vs the other” boundaries.", c: true },
      { t: "Merge both into one lookup_entity tool that decides the backend internally." },
      { t: "Add a deterministic keyword router that pre-selects the tool before each turn." },
      { t: "Add 8 few-shot examples of correct routing to the system prompt." },
    ],
    exp: "Tool descriptions are the primary mechanism the model uses to choose tools; minimal descriptions are the root cause. Expanding them is the low-effort, high-leverage first step. Merging is a bigger architectural change, a router bypasses the model's understanding, and examples add tokens without fixing the descriptions.",
  },
  {
    id: "S1Q10", s: 1, d: 1, ts: "1.1",
    q: "In your agentic loop, how should you decide whether to keep executing tools or to stop?",
    choices: [
      { t: "Continue while stop_reason is \"tool_use\"; terminate when stop_reason is \"end_turn\".", c: true },
      { t: "Stop when the assistant's text contains words like “done” or “finished.”" },
      { t: "Stop after a fixed maximum of 5 iterations regardless of state." },
      { t: "Stop as soon as any tool returns an empty result." },
    ],
    exp: "Loop control is driven by stop_reason. Parsing natural-language completion signals, using arbitrary iteration caps as the primary stop, or treating empty results as completion are all anti-patterns.",
  },
  {
    id: "S1Q11", s: 1, d: 1, ts: "1.1",
    q: "Between iterations of the agentic loop, what must happen with each tool result?",
    choices: [
      { t: "Append the tool result to the conversation history so the model can reason about the next action.", c: true },
      { t: "Discard tool results to save tokens; the model remembers them implicitly." },
      { t: "Always compress each result to a single sentence before the next call." },
      { t: "Store results only in an external database the model cannot read." },
    ],
    exp: "Tool results are appended to context so the next model turn can incorporate the new information. Discarding or hiding them breaks the loop; always compressing risks dropping details the model needs.",
  },

  /* ---------------- Scenario 2 ---------------- */
  {
    id: "S2Q1", s: 2, d: 3, ts: "3.4",
    q: "Task: add a single null-check to one validation function, with a clear stack trace pointing at it. Which approach fits?",
    choices: [
      { t: "Direct execution — the change is simple, well-scoped, and single-file.", c: true },
      { t: "Plan mode, to be safe before any code change." },
      { t: "Plan mode, then fork the session to compare two implementations." },
      { t: "Direct execution, but only after a full-codebase Explore pass." },
    ],
    exp: "Direct execution suits simple, well-understood, single-file changes. Plan mode is for large-scale, architectural, or multi-approach work; using it here (or a full exploration) is overkill.",
  },
  {
    id: "S2Q2", s: 2, d: 3, ts: "3.1",
    q: "A new teammate clones the repo but doesn't get the team coding standards that everyone else's Claude follows. The standards live in the senior dev's ~/.claude/CLAUDE.md. What's the diagnosis?",
    choices: [
      { t: "User-level CLAUDE.md isn't shared via version control; move the standards to project level (.claude/CLAUDE.md or root CLAUDE.md) so every clone receives them.", c: true },
      { t: "The teammate needs to run /compact to load the shared memory files." },
      { t: "The standards must be re-imported with @import in the teammate's home directory." },
      { t: "CLAUDE.md only loads in plan mode; tell the teammate to enable plan mode." },
    ],
    exp: "Instructions in ~/.claude/CLAUDE.md are personal and not shared through version control. Shared standards belong at project level. /compact, home-directory imports, and plan mode are unrelated to the hierarchy issue.",
  },
  {
    id: "S2Q3", s: 2, d: 3, ts: "3.2",
    q: "You want a /standup slash command available to everyone on the repo after they pull. Where should the command file live?",
    choices: [
      { t: "In .claude/commands/ in the project repository (version-controlled and shared).", c: true },
      { t: "In ~/.claude/commands/ in each developer's home directory." },
      { t: "In the root CLAUDE.md under a “Commands” header." },
      { t: "In a .claude/config.json commands array." },
    ],
    exp: "Project-scoped commands go in .claude/commands/ and ship with the repo. ~/.claude/commands/ is personal, CLAUDE.md holds context not command definitions, and a config.json commands array isn't a real mechanism.",
  },
  {
    id: "S2Q4", s: 2, d: 5, ts: "5.4",
    q: "During a long refactor, Claude begins giving inconsistent answers and referencing “typical patterns” instead of the specific classes it discovered earlier. Best mitigation?",
    choices: [
      { t: "Have the agent maintain a scratchpad file of key findings and reference it, and use /compact to reduce accumulated verbose context.", c: true },
      { t: "Increase max_tokens on every request so older context is never dropped." },
      { t: "Restart from scratch whenever answers drift, re-exploring the whole codebase each time." },
      { t: "Repeat the same question until the answers stabilize." },
    ],
    exp: "Context degradation in long sessions is countered by persisting findings to a scratchpad and compacting verbose context. Bigger max_tokens doesn't fix degradation, full restarts are wasteful, and re-asking is unreliable.",
  },
  {
    id: "S2Q5", s: 2, d: 3, ts: "3.5",
    q: "Your prose description of a desired code transformation keeps producing inconsistent results across files. What most effectively communicates the expected transformation?",
    choices: [
      { t: "Provide 2–3 concrete input/output examples of the transformation.", c: true },
      { t: "Rewrite the prose to be longer and more detailed." },
      { t: "Lower temperature to 0 and resend the same prose." },
      { t: "Ask Claude to infer the intended pattern from the existing codebase." },
    ],
    exp: "Concrete input/output examples are the most effective way to pin down a transformation when prose is interpreted inconsistently. More prose, temperature tweaks, and inference don't resolve the ambiguity.",
  },
  {
    id: "S2Q6", s: 2, d: 5, ts: "5.1",
    q: "A multi-phase task keeps exhausting context because the discovery phase dumps verbose file listings into the main conversation. What's the right tool?",
    choices: [
      { t: "Use the Explore subagent to isolate verbose discovery and return only a summary to the main conversation.", c: true },
      { t: "Paste all discovered files into CLAUDE.md so they're always available." },
      { t: "Disable tool-output truncation so nothing is ever lost." },
      { t: "Switch to a larger-context model and keep dumping everything inline." },
    ],
    exp: "The Explore subagent isolates verbose discovery and returns a summary, preserving the main context budget. The other options inflate context instead of containing it.",
  },
  {
    id: "S2Q7", s: 2, d: 3, ts: "3.5",
    q: "A review surfaces several issues. Two of them interact (fixing one changes how the other should be fixed); the rest are independent. How should you communicate the fixes?",
    choices: [
      { t: "Send the two interacting issues together in one detailed message; handle the independent ones separately/sequentially.", c: true },
      { t: "Always send every issue in one giant message to save round-trips." },
      { t: "Always fix issues strictly one at a time, regardless of interaction." },
      { t: "Let Claude decide the order without telling it which issues interact." },
    ],
    exp: "Interacting problems should be addressed together so the fixes account for each other; independent ones can be handled sequentially. Rigid all-at-once or one-at-a-time rules ignore whether issues actually interact.",
  },
  {
    id: "S2Q8", s: 2, d: 1, ts: "1.7",
    q: "You return to an investigation a week later, but the files you analyzed have since changed substantially. Should you resume the old session or start fresh?",
    choices: [
      { t: "Prefer starting fresh with a structured summary (or explicitly inform a resumed session about the specific file changes); resuming on stale tool results is unreliable.", c: true },
      { t: "Always --resume; prior context is always better than starting over." },
      { t: "Fork the old session specifically to preserve the stale results." },
      { t: "Never resume under any circumstances; always discard all prior context." },
    ],
    exp: "When prior tool results are stale, a fresh start with an injected summary — or a resume with targeted notification of what changed — is more reliable than resuming blindly. Neither “always resume” nor “never resume” is correct.",
  },

  /* ---------------- Scenario 3 ---------------- */
  {
    id: "S3Q1", s: 3, d: 1, ts: "1.2",
    q: "For the topic “impact of automation on healthcare,” reports cover only hospital robotics, missing nursing, diagnostics, administration, and telehealth. The coordinator's logs show it created three robotics-flavored subtasks. Most likely root cause?",
    choices: [
      { t: "The coordinator's task decomposition is too narrow; the subagents executed their (mis)assigned scope correctly.", c: true },
      { t: "The synthesis agent failed to detect coverage gaps in the findings." },
      { t: "The web search agent's queries weren't comprehensive enough." },
      { t: "The document analysis agent filtered out non-robotics sources." },
    ],
    exp: "The logs show the coordinator decomposed the topic narrowly; downstream agents worked correctly within the scope they were given. The other options wrongly blame agents that performed as assigned.",
  },
  {
    id: "S3Q2", s: 3, d: 1, ts: "1.3",
    q: "The synthesis subagent produces reports that omit details the search and analysis agents clearly found — and you've confirmed those agents returned good results to the coordinator. Most likely cause?",
    choices: [
      { t: "Subagents don't inherit parent context automatically; the synthesis agent's prompt must include the prior agents' complete findings.", c: true },
      { t: "The synthesis agent simply needs a larger max_tokens." },
      { t: "The coordinator should lower temperature on the synthesis call." },
      { t: "The search agent should write its findings into CLAUDE.md." },
    ],
    exp: "Subagents operate with isolated context, so prior findings must be passed explicitly in the synthesis prompt. Token limits, temperature, and CLAUDE.md don't address the missing context handoff.",
  },
  {
    id: "S3Q3", s: 3, d: 1, ts: "1.3",
    q: "To research three independent subtopics faster, how should the coordinator spawn the subagents?",
    choices: [
      { t: "Emit multiple Task tool calls in a single coordinator response so the subagents run in parallel.", c: true },
      { t: "Spawn them one per turn, finishing each before starting the next." },
      { t: "Put all three subtopics into one subagent's prompt and let it handle them sequentially." },
      { t: "Fork the coordinator session three times." },
    ],
    exp: "Parallelism comes from emitting several Task calls in one response. Sequential per-turn spawning is slower, cramming all subtopics into one agent removes parallelism, and forking the coordinator isn't the spawning mechanism.",
  },
  {
    id: "S3Q4", s: 3, d: 1, ts: "1.2",
    q: "The coordinator always runs the full pipeline (search → analyze → synthesize → report) even for trivial queries answerable from a single source, wasting time and tokens. Better design?",
    choices: [
      { t: "Have the coordinator analyze each query's requirements and dynamically select which subagents to invoke.", c: true },
      { t: "Hard-code a shorter fixed pipeline for all queries." },
      { t: "Always run the full pipeline but cap each subagent's tokens." },
      { t: "Remove the report agent to speed things up." },
    ],
    exp: "A coordinator should decompose and select subagents based on query complexity rather than always routing through the full pipeline. A different fixed pipeline, token caps, or dropping a stage don't add the needed adaptivity.",
  },
  {
    id: "S3Q5", s: 3, d: 2, ts: "2.3",
    q: "The synthesis agent sometimes runs web searches itself and does it poorly. Your data shows 85% of its verification needs are simple fact-checks (dates, names, statistics) and 15% require deeper investigation. Best fix?",
    choices: [
      { t: "Give synthesis a scoped verify_fact tool for simple lookups, and route complex verifications through the coordinator to the web search agent.", c: true },
      { t: "Give the synthesis agent the full web-search toolset so it can self-serve any verification." },
      { t: "Forbid synthesis from verifying anything and ship unverified claims." },
      { t: "Have the web search agent pre-cache everything synthesis might ever need." },
    ],
    exp: "Least privilege: equip synthesis with a narrow tool for the common 85% case and keep complex cases coordinated. Full tool access over-provisions and invites misuse; banning verification hurts quality; speculative caching can't reliably predict needs.",
  },
  {
    id: "S3Q6", s: 3, d: 5, ts: "5.3",
    q: "The web search subagent times out. How should that failure flow back to the coordinator to best enable recovery?",
    choices: [
      { t: "Return structured error context: failure type, the attempted query, any partial results, and possible alternative approaches.", c: true },
      { t: "Return a generic “search unavailable” status after silent retries are exhausted." },
      { t: "Catch the timeout and return an empty result set marked as success." },
      { t: "Propagate the timeout to a top-level handler that terminates the whole research run." },
    ],
    exp: "Structured error context lets the coordinator decide whether to retry, try an alternative, or proceed with partial results. A generic status hides context, faking success suppresses the error, and aborting the run discards recoverable work.",
  },
  {
    id: "S3Q7", s: 3, d: 5, ts: "5.6",
    q: "Two credible sources report different market-size figures. How should the synthesis output handle this?",
    choices: [
      { t: "Preserve both values with source attribution and annotate the conflict, rather than silently picking one.", c: true },
      { t: "Average the two numbers and report a single figure." },
      { t: "Keep the value from whichever source was fetched first." },
      { t: "Drop both figures to avoid presenting a contradiction." },
    ],
    exp: "Conflicting statistics from credible sources are annotated with attribution so the reader sees both. Averaging, first-wins, and dropping all distort or hide the disagreement.",
  },
  {
    id: "S3Q8", s: 3, d: 5, ts: "5.6",
    q: "A subagent's summary compresses findings into prose and loses which source supported which claim; later, two stats look contradictory but were actually collected in different years. Which two practices prevent both problems?",
    choices: [
      { t: "Require structured claim-source mappings preserved through synthesis, and require publication/collection dates in structured outputs.", c: true },
      { t: "Increase summary length and instruct the agent to “be careful with sources.”" },
      { t: "Merge all sources into one citation bucket and date the report as a whole." },
      { t: "Have the coordinator automatically pick the most recent-sounding figure." },
    ],
    exp: "Claim-source mappings preserve provenance through synthesis, and per-finding dates prevent temporal differences from being misread as contradictions. Vague guidance, bucketed citations, and auto-selecting by recency don't solve either issue.",
  },
  {
    id: "S3Q9", s: 3, d: 2, ts: "2.2",
    q: "A search subagent returns “no results.” The coordinator can't tell whether the search failed or genuinely found nothing. How should subagents report this?",
    choices: [
      { t: "Distinguish access failures (e.g., a timeout that may need a retry) from valid empty results (a successful query with zero matches).", c: true },
      { t: "Always treat “no results” as a failure and retry." },
      { t: "Always treat “no results” as success and move on." },
      { t: "Return the same generic status for both and let the coordinator guess." },
    ],
    exp: "Access failures and valid empty results require different responses, so they must be distinguishable. Treating them identically (always retry, always succeed, or one generic status) leads to wrong recovery decisions.",
  },
  {
    id: "S3Q10", s: 3, d: 1, ts: "1.2",
    q: "The coordinator receives synthesis output with thin coverage on one subtopic. Which orchestration pattern handles this best?",
    choices: [
      { t: "Evaluate the synthesis for gaps, re-delegate targeted queries to the search/analysis agents, and re-invoke synthesis until coverage is sufficient.", c: true },
      { t: "Accept the output, since coverage gaps are unavoidable." },
      { t: "Re-run the entire pipeline from scratch with the same prompt." },
      { t: "Ask the report agent to pad the thin section with general knowledge." },
    ],
    exp: "An iterative refinement loop — detect gaps, re-delegate targeted subqueries, re-synthesize — closes coverage holes. Accepting gaps, blindly re-running, or padding with unsourced text don't.",
  },
  {
    id: "S3Q11", s: 3, d: 1, ts: "1.3",
    q: "Your coordinator can't spawn subagents at all. What's the most likely configuration cause?",
    choices: [
      { t: "The coordinator's allowedTools doesn't include \"Task\", which is required to invoke subagents.", c: true },
      { t: "The subagents each need their own API keys." },
      { t: "fork_session is disabled." },
      { t: "The coordinator is stuck in plan mode." },
    ],
    exp: "Spawning subagents requires the Task tool to be present in the coordinator's allowedTools. API keys, fork_session, and plan mode aren't what enable subagent invocation.",
  },

  /* ---------------- Scenario 4 ---------------- */
  {
    id: "S4Q1", s: 4, d: 2, ts: "2.5",
    q: "You need to find every caller of a function named processPayment across a large codebase. Which built-in tool fits best?",
    choices: [
      { t: "Grep — it searches file contents for patterns such as function names.", c: true },
      { t: "Glob — it matches file path patterns." },
      { t: "Read — load each file and scan it manually." },
      { t: "Bash `ls -R` and read the output by eye." },
    ],
    exp: "Grep searches file contents for patterns like function names or error messages. Glob matches paths, Read loads whole files, and ad-hoc Bash listing doesn't search content.",
  },
  {
    id: "S4Q2", s: 4, d: 2, ts: "2.5",
    q: "You want to locate all test files matching **/*.test.tsx regardless of directory. Which tool?",
    choices: [
      { t: "Glob — file-path pattern matching by name/extension.", c: true },
      { t: "Grep — content search across files." },
      { t: "Edit — targeted in-file modification." },
      { t: "Read — full file load." },
    ],
    exp: "Glob matches files by name/extension patterns. Grep searches contents, Edit modifies, and Read loads a known file.",
  },
  {
    id: "S4Q3", s: 4, d: 2, ts: "2.5",
    q: "Edit fails because the anchor text you targeted appears multiple times in the file, so it isn't unique. What's the reliable fallback?",
    choices: [
      { t: "Read the full file, then Write the modified contents.", c: true },
      { t: "Retry Edit with the same non-unique anchor text." },
      { t: "Use Glob to find a different file to edit." },
      { t: "Use Bash `sed` without reading the file first." },
    ],
    exp: "When Edit can't find a unique anchor, Read + Write is the reliable fallback. Retrying the same anchor repeats the failure, and the other options don't modify the intended content safely.",
  },
  {
    id: "S4Q4", s: 4, d: 2, ts: "2.4",
    q: "The team wants a shared MCP server (e.g., GitHub) available to everyone, with its token supplied via environment variable and never committed. How should it be configured?",
    choices: [
      { t: "In project-scoped .mcp.json using environment-variable expansion (e.g., ${GITHUB_TOKEN}).", c: true },
      { t: "In .mcp.json with the literal token hard-coded and committed." },
      { t: "In each user's ~/.claude.json with the literal token." },
      { t: "Only as instructions inside CLAUDE.md." },
    ],
    exp: "Shared tooling belongs in project-scoped .mcp.json, with env-var expansion to keep secrets out of version control. Hard-coding tokens leaks them, user-scoped config isn't shared, and CLAUDE.md doesn't configure servers.",
  },
  {
    id: "S4Q5", s: 4, d: 2, ts: "2.4",
    q: "The agent keeps using built-in Grep instead of a more capable MCP code-intelligence tool that would do the job better. Most likely fix?",
    choices: [
      { t: "Enhance the MCP tool's description to explain its capabilities and outputs in detail, so the agent prefers it when appropriate.", c: true },
      { t: "Delete the Grep tool to force the agent onto the MCP tool." },
      { t: "Move the MCP tool from .mcp.json to ~/.claude.json." },
      { t: "Lower temperature so the agent stops picking Grep." },
    ],
    exp: "Agents fall back to built-ins when MCP tool descriptions are thin; enriching the description fixes the preference. Removing Grep, changing scope, and temperature don't address why the model isn't selecting the better tool.",
  },
  {
    id: "S4Q6", s: 4, d: 3, ts: "3.4",
    q: "An engineer must understand an unfamiliar legacy module before changing it, and the discovery output is verbose. Best approach to protect the main context budget?",
    choices: [
      { t: "Use the Explore subagent (or plan-mode exploration) to isolate verbose discovery and return summaries.", c: true },
      { t: "Read every file in the module into the main conversation up front." },
      { t: "Start direct execution immediately and learn as you go." },
      { t: "Paste the whole module into CLAUDE.md." },
    ],
    exp: "The Explore subagent isolates verbose discovery and returns a summary, keeping the main context lean. Reading everything inline or dumping it into CLAUDE.md does the opposite; diving straight into edits skips needed understanding.",
  },
  {
    id: "S4Q7", s: 4, d: 1, ts: "1.6",
    q: "What's the most efficient way to build understanding of a large, unfamiliar codebase?",
    choices: [
      { t: "Start with Grep to find entry points, then use Read to follow imports and trace flows incrementally.", c: true },
      { t: "Read all files up front so nothing is missed." },
      { t: "Ask Claude to summarize the repo from its name alone." },
      { t: "Glob every file and read them in alphabetical order." },
    ],
    exp: "Incremental exploration — Grep for entry points, then Read to trace imports and flows — scales. Reading everything up front wastes context, name-based summaries are guesses, and alphabetical reading ignores structure.",
  },
  {
    id: "S4Q8", s: 4, d: 2, ts: "2.4",
    q: "The agent burns many exploratory tool calls just to discover what data exists (issues, schemas, docs). Which MCP feature reduces this?",
    choices: [
      { t: "Expose content catalogs as MCP resources so the agent can see available data without exploratory tool calls.", c: true },
      { t: "Add more tools so each data type has its own fetch tool." },
      { t: "Raise the agent's iteration cap." },
      { t: "Put a directory listing in the system prompt every turn." },
    ],
    exp: "MCP resources expose content catalogs (issue summaries, schemas, doc hierarchies), giving visibility without exploratory calls. More tools add selection load, a higher cap just tolerates waste, and stuffing the system prompt bloats every turn.",
  },
  {
    id: "S4Q9", s: 4, d: 1, ts: "1.6",
    q: "Task: “Add comprehensive tests to this legacy codebase.” Which decomposition strategy fits best?",
    choices: [
      { t: "Dynamic/adaptive: map structure, identify high-impact areas, then build a prioritized plan that adapts as dependencies are discovered.", c: true },
      { t: "A fixed sequential pipeline applied identically to every file." },
      { t: "One giant prompt asking for all the tests at once." },
      { t: "Random file order, one test per file." },
    ],
    exp: "Open-ended tasks call for adaptive decomposition that maps the codebase and re-plans as it learns. Fixed pipelines suit predictable multi-aspect reviews, not exploratory test backfills; the remaining options ignore structure.",
  },

  /* ---------------- Scenario 5 ---------------- */
  {
    id: "S5Q1", s: 5, d: 3, ts: "3.6",
    q: "Your CI job runs `claude \"Review this PR for security issues\"` and hangs, waiting for interactive input. What's the correct fix?",
    choices: [
      { t: "Add the -p (--print) flag to run non-interactively: `claude -p \"...\"`.", c: true },
      { t: "Set an environment variable CLAUDE_HEADLESS=true before running." },
      { t: "Redirect stdin from /dev/null." },
      { t: "Add a --batch flag." },
    ],
    exp: "The -p/--print flag runs Claude Code non-interactively: it processes the prompt, prints the result, and exits. CLAUDE_HEADLESS and --batch aren't real features, and redirecting stdin is a workaround that doesn't address the command syntax.",
  },
  {
    id: "S5Q2", s: 5, d: 3, ts: "3.6",
    q: "You need machine-parseable findings to post as inline PR comments from CI. Which flags produce that?",
    choices: [
      { t: "--output-format json together with --json-schema to enforce structured output.", c: true },
      { t: "--pretty to format the text output nicely." },
      { t: "--markdown to emit a formatted report." },
      { t: "Pipe free-text output through grep." },
    ],
    exp: "--output-format json with --json-schema yields schema-conformant, parseable output suitable for automated PR comments. Pretty/markdown formatting and grepping free text don't guarantee structure.",
  },
  {
    id: "S5Q3", s: 5, d: 4, ts: "4.1",
    q: "Developers ignore your review bot because it flags trivial style nits as if they were bugs, drowning the real issues. Most effective fix?",
    choices: [
      { t: "Write specific criteria defining which issues to report (bugs, security) versus skip (minor style, local patterns), instead of “be conservative.”", c: true },
      { t: "Add “only report high-confidence issues” to the prompt." },
      { t: "Have the model self-rate confidence and suppress anything below a threshold." },
      { t: "Switch to a larger model." },
    ],
    exp: "Explicit categorical criteria for what to report vs skip beat vague, confidence-based filtering. “Be conservative,” self-reported confidence, and a bigger model don't define the boundary that's actually missing.",
  },
  {
    id: "S5Q4", s: 5, d: 4, ts: "4.6",
    q: "The same Claude session that generated the code is asked to review it and rarely finds its own bugs. Why, and what's better?",
    choices: [
      { t: "A model retains its generation reasoning and is less likely to question itself; use a separate, independent review instance without that context.", c: true },
      { t: "Tell it to “think harder” / enable extended thinking in the same session." },
      { t: "Ask it to review three times and majority-vote." },
      { t: "Add “be critical of your own code” to the prompt." },
    ],
    exp: "Self-review is weak because the model carries its own generation reasoning; an independent instance without that context catches more. Extended thinking, repeated self-review, and self-critique instructions don't remove the bias.",
  },
  {
    id: "S5Q5", s: 5, d: 4, ts: "4.5",
    q: "Two workflows use real-time calls: (1) a blocking pre-merge check developers wait on, and (2) an overnight technical-debt report. A manager wants both moved to the Message Batches API for 50% savings. Best evaluation?",
    choices: [
      { t: "Use batch for the overnight report only; keep synchronous calls for the blocking pre-merge check.", c: true },
      { t: "Move both to batch with status polling for completion." },
      { t: "Keep both synchronous to avoid batch result-ordering issues." },
      { t: "Move both to batch with a timeout fallback to real-time." },
    ],
    exp: "Batch offers 50% savings but up to a 24-hour window with no latency SLA — fine for overnight jobs, unsuitable for blocking pre-merge checks. custom_id handles correlation, so ordering isn't a blocker; the fallback option adds needless complexity.",
  },
  {
    id: "S5Q6", s: 5, d: 4, ts: "4.6",
    q: "A 14-file PR reviewed in a single pass yields uneven depth, missed bugs, and contradictory feedback (flagging a pattern in one file while approving identical code elsewhere). How should you restructure the review?",
    choices: [
      { t: "Split into per-file local-analysis passes plus a separate cross-file integration pass.", c: true },
      { t: "Require developers to split large PRs into 3–4 file chunks first." },
      { t: "Use a bigger context window and keep the single pass." },
      { t: "Run three full-PR passes and only flag issues that appear in at least two." },
    ],
    exp: "Per-file passes give consistent depth and a separate integration pass catches cross-file issues — directly addressing attention dilution. Shifting work to developers, enlarging context, or requiring consensus (which suppresses real bugs) don't fix the root cause.",
  },
  {
    id: "S5Q7", s: 5, d: 3, ts: "3.6",
    q: "After each new commit, the review bot re-posts the same comments it already made. How do you avoid duplicate comments on re-review?",
    choices: [
      { t: "Include prior review findings in context and instruct Claude to report only new or still-unaddressed issues.", c: true },
      { t: "Delete all previous comments before each run." },
      { t: "Only ever review the first commit of each PR." },
      { t: "Disable the bot after its first review." },
    ],
    exp: "Passing prior findings and asking only for new/unaddressed issues prevents duplicates while still reviewing new commits. Deleting comments, reviewing once, or disabling the bot all lose useful coverage.",
  },
  {
    id: "S5Q8", s: 5, d: 3, ts: "3.6",
    q: "Generated tests in CI are low-value and duplicate existing coverage. Which two changes most improve test-generation quality?",
    choices: [
      { t: "Provide existing test files in context to avoid duplicates, and document testing standards, valuable-test criteria, and fixtures in CLAUDE.md.", c: true },
      { t: "Increase max_tokens and ask for “more tests.”" },
      { t: "Run test generation in batch mode overnight." },
      { t: "Lower temperature to 0." },
    ],
    exp: "Giving the model existing tests prevents duplicates, and documenting standards/criteria/fixtures in CLAUDE.md raises quality. More tokens, batch scheduling, and temperature don't address what makes tests valuable.",
  },

  /* ---------------- Scenario 6 ---------------- */
  {
    id: "S6Q1", s: 6, d: 4, ts: "4.3",
    q: "You need guaranteed schema-valid JSON with no syntax errors from extraction. Most reliable approach?",
    choices: [
      { t: "Use tool_use with a JSON schema and read the structured data from the tool_use response.", c: true },
      { t: "Ask for JSON in the prompt and parse the text, retrying on parse errors." },
      { t: "Prefill the assistant turn with “{” and hope it completes valid JSON." },
      { t: "Post-process free text with a regex JSON extractor." },
    ],
    exp: "tool_use with a JSON schema is the most reliable way to get schema-compliant output and eliminate syntax errors. Prompt-and-parse, prefill, and regex extraction all leave room for malformed JSON.",
  },
  {
    id: "S6Q2", s: 6, d: 4, ts: "4.3",
    q: "Some documents lack a tax_id field, and the model invents a value to satisfy the schema. What fixes this?",
    choices: [
      { t: "Make the field optional/nullable so the model returns null instead of fabricating a value.", c: true },
      { t: "Keep it required and add “don't hallucinate” to the prompt." },
      { t: "Remove the field from the schema entirely." },
      { t: "Set tool_choice: \"any\"." },
    ],
    exp: "Designing the field as nullable lets the model emit null when the data is absent, preventing fabrication to satisfy a required field. A “don't hallucinate” instruction is weak, removing the field loses real data, and tool_choice is unrelated.",
  },
  {
    id: "S6Q3", s: 6, d: 4, ts: "4.3",
    q: "Documents arrive in unknown types and you maintain several extraction schemas. You must guarantee the model calls one of the extraction tools (not return chat text). Which setting?",
    choices: [
      { t: "tool_choice: \"any\" — the model must call a tool but may choose which.", c: true },
      { t: "tool_choice: \"auto\" — the model may return text instead." },
      { t: "Force one specific tool regardless of the document type." },
      { t: "No tool_choice; rely on the prompt to request a tool call." },
    ],
    exp: "“any” guarantees a tool call while letting the model pick the right schema for an unknown document type. “auto” permits text, forcing one tool ignores document variety, and relying on the prompt isn't a guarantee.",
  },
  {
    id: "S6Q4", s: 6, d: 4, ts: "4.3",
    q: "Your extractions are always valid JSON (via tool_use), but invoices sometimes have line items that don't sum to the stated total. What does tool_use NOT solve, and what helps?",
    choices: [
      { t: "tool_use prevents syntax errors but not semantic errors; extract calculated_total alongside stated_total and flag discrepancies in a validation step.", c: true },
      { t: "tool_use already guarantees totals match; the schema must be misconfigured." },
      { t: "Switch to prompt-only JSON to catch the math errors." },
      { t: "Make all numeric fields strings." },
    ],
    exp: "Strict schemas remove syntax errors but not semantic ones like mismatched totals. Capturing both a calculated and a stated total and flagging the difference is a self-checking validation pattern. The other options misunderstand what schemas enforce.",
  },
  {
    id: "S6Q5", s: 6, d: 4, ts: "4.4",
    q: "A required contract_end_date is missing from your extractions. On retry with the validation error appended, it still fails. Why is retry ineffective here?",
    choices: [
      { t: "The information is simply absent from the source document; retries fix format/structural errors, not missing data.", c: true },
      { t: "The retry prompt wasn't emphatic enough; add capital letters." },
      { t: "tool_use responses can't be retried." },
      { t: "The schema needs the field removed and re-added." },
    ],
    exp: "Retry-with-feedback corrects format and structural mistakes, but it can't conjure information that isn't in the source. Emphasis, schema churn, and claims that tool_use can't retry all miss this.",
  },
  {
    id: "S6Q6", s: 6, d: 4, ts: "4.2",
    q: "Extraction quality drops on documents whose structure varies (inline citations vs bibliographies; tables vs narrative). Most effective technique?",
    choices: [
      { t: "Add few-shot examples demonstrating correct extraction across the varied document structures.", c: true },
      { t: "Write longer prose instructions describing every possible layout." },
      { t: "Reject documents that don't match a single canonical layout." },
      { t: "Lower temperature to 0." },
    ],
    exp: "Few-shot examples let the model generalize across structural variety far better than exhaustive prose. Rejecting documents narrows coverage, and temperature doesn't teach structure handling.",
  },
  {
    id: "S6Q7", s: 6, d: 5, ts: "5.5",
    q: "Overall extraction accuracy is 97%, so a teammate wants to drop human review entirely. What's the risk, and the right check?",
    choices: [
      { t: "Aggregate accuracy can mask poor performance on specific document types or fields; analyze accuracy by document type and field (stratified sampling) before reducing review.", c: true },
      { t: "97% is above threshold, so remove review and monitor complaints." },
      { t: "Replace review with a second model that re-extracts everything." },
      { t: "Raise the number of required fields to force completeness." },
    ],
    exp: "A high aggregate can hide weak segments, so accuracy must be validated per document type and field before automating away review. Acting on the aggregate, swapping in another model, or forcing required fields don't reveal the hidden weak spots.",
  },
  {
    id: "S6Q8", s: 6, d: 5, ts: "5.5",
    q: "You have limited human reviewers. How do you best target their attention?",
    choices: [
      { t: "Have the model output field-level confidence (calibrated on a labeled set) and route low-confidence or ambiguous/contradictory extractions to human review.", c: true },
      { t: "Review a fixed random 10% regardless of confidence." },
      { t: "Review only the longest documents." },
      { t: "Trust the model's prose statements like “I'm confident.”" },
    ],
    exp: "Calibrated, field-level confidence routes the riskiest extractions to scarce reviewers. A flat random sample ignores risk, length is a poor proxy, and uncalibrated self-reports in prose are unreliable.",
  },

  /* =================== HARD POOL (Simulado) =================== */
  /* ---- Domain 1 (hard) ---- */
  {
    id: "H1a", s: 3, d: 1, ts: "1.2", diff: "hard",
    q: "Your coordinator reliably covers broad topics but latency is high because it always fans out to 8+ subagents — even for narrow queries. When you cap subagents at 3, broad topics get incomplete coverage. Which design resolves both without a fixed cap?",
    choices: [
      { t: "Have the coordinator assess each query's breadth, dynamically choose how many subagents to spawn and what scope each gets, and run an iterative gap-check that re-delegates only when coverage is insufficient.", c: true },
      { t: "Keep the 8-subagent fan-out but give each a smaller token budget to cut latency." },
      { t: "Always cap at 3 subagents and instruct each to cover more subtopics." },
      { t: "Alternate between 3 and 8 subagents on a fixed schedule per request." },
    ],
    exp: "Dynamic, breadth-driven decomposition plus an iterative coverage loop adapts to each query — unlike any fixed cap, token throttling, or fixed alternation.",
  },
  {
    id: "H1b", s: 1, d: 1, ts: "1.5", diff: "hard",
    q: "You need two guarantees: identity verified before any refund, and refunds over $500 routed to a human. A teammate wants both in the system prompt “for simplicity.” For deterministic compliance, where should each live?",
    choices: [
      { t: "Both as programmatic controls: a prerequisite gate blocking refund tools until get_customer verifies identity, and a tool-call interception hook blocking >$500 and redirecting to escalation.", c: true },
      { t: "Identity as a prerequisite gate; the $500 limit as a system-prompt rule, since amounts vary." },
      { t: "Both as few-shot examples demonstrating the desired behavior." },
      { t: "Identity in the prompt; the $500 limit as a PostToolUse hook that logs violations." },
    ],
    exp: "Both are hard compliance rules with financial consequences, so both need programmatic enforcement. Prompt rules and examples are probabilistic; a PostToolUse log only records the violation after it happened.",
  },
  {
    id: "H1c", s: 3, d: 1, ts: "1.3", diff: "hard",
    q: "To speed things up, the coordinator emits three Task calls in one turn to run subagents in parallel. The synthesis agent then produces shallow output missing those agents' findings — though parallelism itself is working. Most likely cause?",
    choices: [
      { t: "Synthesis was spawned without the parallel agents' results in its prompt; parallel subagents don't share memory, so their outputs must be aggregated and passed explicitly.", c: true },
      { t: "Parallel Task calls can't be combined with a synthesis step; synthesis requires sequential spawning." },
      { t: "The coordinator needs fork_session to merge the parallel branches." },
      { t: "The synthesis call's max_tokens is too low." },
    ],
    exp: "Parallel subagents have isolated context. Their results must be explicitly aggregated and injected into the synthesis prompt; nothing about parallelism forbids a downstream synthesis step.",
  },
  {
    id: "H1d", s: 4, d: 1, ts: "1.6", diff: "hard",
    q: "Two tasks: (1) review a 30-file PR for the same five concern types in every file; (2) “harden this service against whatever failure modes you find.” Which decomposition fits each?",
    choices: [
      { t: "(1) prompt chaining — fixed per-file passes plus an integration pass; (2) dynamic/adaptive decomposition that generates subtasks from what's discovered.", c: true },
      { t: "Both prompt chaining, for predictability." },
      { t: "Both dynamic, since both touch multiple files." },
      { t: "(1) dynamic; (2) prompt chaining." },
    ],
    exp: "Predictable multi-aspect reviews suit fixed prompt chaining; open-ended investigations suit adaptive decomposition that re-plans as it learns.",
  },
  {
    id: "H1e", s: 2, d: 1, ts: "1.7", diff: "hard",
    q: "You finished a deep codebase analysis and now want to compare two refactoring strategies that both start from that exact analysis, without re-running it. Best mechanism?",
    choices: [
      { t: "fork_session to create two independent branches from the shared analysis baseline.", c: true },
      { t: "--resume the same named session twice and hope the state doesn't collide." },
      { t: "Start two fresh sessions and paste the codebase into each again." },
      { t: "Use /compact, then ask for both strategies in one session." },
    ],
    exp: "fork_session branches divergent explorations from a shared baseline. Resuming one session twice collides; fresh restarts discard the analysis; one compacted session can't keep the two explorations independent.",
  },
  {
    id: "H1f", s: 1, d: 1, ts: "1.1", diff: "hard",
    q: "An engineer ends the agent loop when the model's text says “Let me know if you need anything else.” Intermittently the loop halts while a tool call was still pending. Best correction?",
    choices: [
      { t: "Terminate on stop_reason == \"end_turn\" and continue on \"tool_use\"; never parse assistant prose as a completion signal.", c: true },
      { t: "Add more completion phrases to the text matcher to catch every variant." },
      { t: "Add a 15-iteration cap as the primary stop condition." },
      { t: "Stop as soon as the model returns any text content." },
    ],
    exp: "Loop control must follow stop_reason. Matching prose, using an arbitrary cap as the primary stop, or treating any text as completion are the named anti-patterns.",
  },
  {
    id: "H1g", s: 3, d: 1, ts: "1.2", diff: "hard",
    q: "To cut latency, a developer lets subagents call each other directly (search → analysis → synthesis), bypassing the coordinator. Now error handling is inconsistent and failures are hard to see. Which hub-and-spoke property was sacrificed?",
    choices: [
      { t: "Centralized routing through the coordinator, which provides observability, consistent error handling, and controlled information flow.", c: true },
      { t: "Nothing meaningful — direct subagent calls are strictly faster and better." },
      { t: "Hub-and-spoke only affects parallelism, not error handling." },
      { t: "The fix is to give every subagent the Task tool so they can spawn peers." },
    ],
    exp: "Routing all inter-subagent communication through the coordinator is what gives observability and consistent error handling; bypassing it trades those away.",
  },
  {
    id: "H1h", s: 4, d: 1, ts: "1.6", diff: "hard",
    q: "A single agent reviewing 25 files at once gives deep feedback on the first and last few files and superficial notes in the middle. Beyond splitting passes, which effect explains the middle gap, and what ordering helps when you must aggregate?",
    choices: [
      { t: "The “lost in the middle” effect; place key-findings summaries at the start and use explicit section headers so middle content isn't dropped.", c: true },
      { t: "Token starvation; raise max_tokens and keep the single pass." },
      { t: "Temperature variance; set temperature to 0." },
      { t: "Model laziness; instruct it to “try harder on every file.”" },
    ],
    exp: "Models process the beginning and end of long inputs more reliably than the middle. Position-aware ordering — summaries up front, explicit headers — mitigates it.",
  },
  {
    id: "H1i", s: 1, d: 1, ts: "1.4", diff: "hard",
    q: "The agent escalates mid-resolution to a human who cannot see the conversation transcript. What must the handoff include to be useful?",
    choices: [
      { t: "A structured summary: customer ID, root-cause analysis, refund amount, and recommended action.", c: true },
      { t: "A short note that the customer needs help, plus a link to the chat UI." },
      { t: "The full raw transcript pasted verbatim with no summary." },
      { t: "Only the customer's sentiment score and a priority flag." },
    ],
    exp: "Since the human lacks the transcript, the handoff must be a structured summary with the key facts and a recommended action.",
  },
  {
    id: "H1j", s: 3, d: 1, ts: "1.3", diff: "hard",
    q: "Your coordinator prompt gives subagents rigid step-by-step procedures, and they fail to adapt when sources turn out sparse. Better prompt design?",
    choices: [
      { t: "Specify research goals and quality criteria rather than step-by-step procedures, so subagents can adapt their approach.", c: true },
      { t: "Add even more detailed procedural steps to cover every contingency." },
      { t: "Remove all guidance and let subagents do whatever they want." },
      { t: "Force a specific tool first with tool_choice on every subagent." },
    ],
    exp: "Goal- and criteria-oriented coordinator prompts enable subagent adaptability; brittle procedures and zero guidance both fail, and forcing a tool addresses a different concern.",
  },

  /* ---- Domain 2 (hard) ---- */
  {
    id: "H2a", s: 1, d: 2, ts: "2.1", diff: "hard",
    q: "Despite well-written descriptions, the agent still misroutes “analyze this invoice” to analyze_content instead of extract_invoice. The system prompt says “always analyze customer content carefully.” Most likely culprit and fix?",
    choices: [
      { t: "Keyword-sensitive system-prompt wording (“analyze content”) is creating an unintended association that overrides the descriptions; revise the prompt wording.", c: true },
      { t: "The descriptions are still too short; add examples inside them." },
      { t: "Lower temperature so routing becomes deterministic." },
      { t: "Merge the two tools to remove the choice entirely." },
    ],
    exp: "Keyword-sensitive system-prompt instructions can override even good tool descriptions. Reviewing and revising that wording is the fix.",
  },
  {
    id: "H2b", s: 3, d: 2, ts: "2.2", diff: "hard",
    q: "A search subagent hits a transient timeout on one of five queries; the other four succeed. Best error strategy?",
    choices: [
      { t: "Recover locally for the transient failure (retry that query), and propagate to the coordinator only if it stays unresolved — including partial results and what was attempted.", c: true },
      { t: "Immediately propagate the timeout and discard the four successful results." },
      { t: "Mark the whole search as failed so the coordinator restarts it." },
      { t: "Return the four successes as complete and silently drop the failed query." },
    ],
    exp: "Subagents should recover locally from transient failures and propagate only unresolved errors, with partial results — never silently drop or over-propagate.",
  },
  {
    id: "H2c", s: 4, d: 2, ts: "2.3", diff: "hard",
    q: "Enrichment tools must never run before metadata extraction. Within a single model turn, how do you guarantee extract_metadata is called first?",
    choices: [
      { t: "Force it with tool_choice {\"type\":\"tool\",\"name\":\"extract_metadata\"} so it runs first, then handle enrichment in follow-up turns.", c: true },
      { t: "Set tool_choice \"any\" and hope the model picks metadata first." },
      { t: "Put “call extract_metadata first” in the system prompt only." },
      { t: "Give the agent only the enrichment tools so it can't skip ahead." },
    ],
    exp: "Forced tool selection guarantees the first call; subsequent steps proceed in follow-up turns. “any” and prompt instructions are not guarantees.",
  },
  {
    id: "H2d", s: 4, d: 2, ts: "2.4", diff: "hard",
    q: "You need standard Jira integration plus a bespoke internal deployment-tracking workflow. Build vs adopt?",
    choices: [
      { t: "Use an existing community MCP server for Jira; reserve a custom server for the team-specific deployment workflow.", c: true },
      { t: "Build both custom for consistency." },
      { t: "Use community servers for both and force-fit the deployment workflow." },
      { t: "Avoid MCP entirely and script both with Bash." },
    ],
    exp: "Adopt community servers for standard integrations; build custom only for genuinely team-specific workflows.",
  },
  {
    id: "H2e", s: 1, d: 2, ts: "2.2", diff: "hard",
    q: "A refund violates a policy cap, and the agent keeps retrying it, burning calls. What error design stops the retries while still communicating well to the customer?",
    choices: [
      { t: "Return the business error with retriable:false plus a customer-friendly explanation, so the agent stops retrying and explains the policy.", c: true },
      { t: "Return a generic “Operation failed” so the agent gives up." },
      { t: "Return isRetryable:true so the agent can auto-try a smaller amount." },
      { t: "Throw an exception that aborts the conversation." },
    ],
    exp: "Business/validation errors should carry retriable:false and a human-readable reason. Generic failures lose context, and a retryable flag invites pointless retries.",
  },
  {
    id: "H2f", s: 4, d: 2, ts: "2.3", diff: "hard",
    q: "An agent with a generic fetch_url tool sometimes pulls arbitrary, irrelevant pages. You want it to load only validated documents. Best change?",
    choices: [
      { t: "Replace fetch_url with a constrained load_document tool that validates document URLs.", c: true },
      { t: "Keep fetch_url but add “only fetch documents” to the prompt." },
      { t: "Add more tools so the agent has more options." },
      { t: "Set tool_choice \"any\" to force a tool call." },
    ],
    exp: "Replacing a generic tool with a constrained, purpose-specific one (with a defined contract) is more reliable than prompt guidance.",
  },
  {
    id: "H2g", s: 3, d: 2, ts: "2.2", diff: "hard",
    q: "Why does conflating “search returned zero matches” with “search failed” specifically harm a research coordinator's decisions?",
    choices: [
      { t: "The two warrant opposite actions — a valid empty result means move on, while a failure may warrant a retry or an alternative source — so conflating them causes wrong recovery choices.", c: true },
      { t: "It only affects logging verbosity, not decisions." },
      { t: "It causes JSON schema violations downstream." },
      { t: "It doubles token usage but decisions are unaffected." },
    ],
    exp: "Empty-but-successful and access-failure require opposite responses, so the coordinator must be able to tell them apart.",
  },

  /* ---- Domain 3 (hard) ---- */
  {
    id: "H3a", s: 2, d: 3, ts: "3.3", diff: "hard",
    q: "Conventions for **/*.test.tsx must apply to test files scattered across many directories and load automatically only when editing those files. Which mechanism — and why not the alternatives?",
    choices: [
      { t: ".claude/rules/ files with YAML frontmatter glob paths; a subdirectory CLAUDE.md is directory-bound and skills need invocation, so neither gives automatic path-glob loading.", c: true },
      { t: "A subdirectory CLAUDE.md placed in each folder that contains tests." },
      { t: "A skill in .claude/skills/ that holds the test conventions." },
      { t: "One monolithic root CLAUDE.md with a “tests” section." },
    ],
    exp: "Path-glob rules load conditionally by file pattern across directories. Subdir CLAUDE.md can't follow files spread everywhere, skills aren't automatic, and a monolith always loads regardless of file.",
  },
  {
    id: "H3b", s: 4, d: 3, ts: "3.2", diff: "hard",
    q: "A codebase-analysis skill floods the main conversation with verbose output, derailing later steps. Which frontmatter option fixes this, and what does it do?",
    choices: [
      { t: "context: fork — runs the skill in an isolated subagent so its verbose output doesn't pollute the main session.", c: true },
      { t: "allowed-tools — restricts which tools the skill may use." },
      { t: "argument-hint — prompts for a missing argument." },
      { t: "model: haiku — runs the skill on a smaller model." },
    ],
    exp: "context: fork isolates verbose or exploratory skills in a subagent context, keeping the main conversation clean. The other options serve different purposes.",
  },
  {
    id: "H3c", s: 2, d: 3, ts: "3.1", diff: "hard",
    q: "Each package needs only its relevant standards, and a monolithic CLAUDE.md has grown unwieldy. Cleanest way to keep each package's CLAUDE.md focused?",
    choices: [
      { t: "Use @import to selectively include the specific standards files relevant to each package.", c: true },
      { t: "Duplicate the full standards into every package's CLAUDE.md." },
      { t: "Move all standards into user-level ~/.claude/CLAUDE.md." },
      { t: "Delete shared standards and rely only on per-file rules." },
    ],
    exp: "@import keeps CLAUDE.md modular by referencing external standards files per package. Duplication and user-level placement don't scale or share correctly.",
  },
  {
    id: "H3d", s: 5, d: 3, ts: "3.6", diff: "hard",
    q: "Your CI uses the same Claude session to generate code and then review it, and subtle bugs slip through. Beyond prompting, what structural change helps most?",
    choices: [
      { t: "Run the review in an independent Claude instance without the generator's reasoning context.", c: true },
      { t: "Add “review critically” to the same session's prompt." },
      { t: "Increase the session's max_tokens." },
      { t: "Re-run generation twice and diff the outputs." },
    ],
    exp: "An independent review instance (no generation context) catches subtle issues that self-review in the same session misses.",
  },
  {
    id: "H3e", s: 2, d: 3, ts: "3.4", diff: "hard",
    q: "A library migration affects 45+ files with two viable approaches that differ in infrastructure. Most effective workflow?",
    choices: [
      { t: "Use plan mode to explore and choose an approach, then switch to direct execution to implement the chosen plan.", c: true },
      { t: "Direct execution throughout, switching to plan mode only if problems emerge." },
      { t: "Plan mode for the entire migration, including every individual edit." },
      { t: "Direct execution with one massive upfront instruction covering all 45 files." },
    ],
    exp: "Plan for the investigation and architectural decision, then execute directly. Pure direct execution risks rework; staying in plan mode for every edit is unnecessary.",
  },
  {
    id: "H3f", s: 4, d: 3, ts: "3.2", diff: "hard",
    q: "You have (a) universal standards that should always apply and (b) a verbose, occasional “generate migration script” workflow. Where does each belong?",
    choices: [
      { t: "(a) CLAUDE.md (always loaded); (b) a skill (on-demand), ideally with context: fork for its verbose output.", c: true },
      { t: "Both in CLAUDE.md so they're always available." },
      { t: "Both as skills, to keep CLAUDE.md small." },
      { t: "(a) as a skill; (b) in CLAUDE.md." },
    ],
    exp: "Always-on universal standards belong in CLAUDE.md; task-specific on-demand workflows belong in skills, forked when their output is verbose.",
  },
  {
    id: "H3g", s: 2, d: 3, ts: "3.1", diff: "hard",
    q: "Claude behaves inconsistently across sessions — sometimes following a convention, sometimes not. Which command helps diagnose which memory files are actually loaded?",
    choices: [
      { t: "/memory — to verify which memory files are loaded.", c: true },
      { t: "/compact — to shrink the context." },
      { t: "/resume — to reload the last session." },
      { t: "/clear — to wipe context and retry." },
    ],
    exp: "/memory shows which memory files are loaded, the right tool for diagnosing inconsistent cross-session behavior.",
  },

  /* ---- Domain 4 (hard) ---- */
  {
    id: "H4a", s: 6, d: 4, ts: "4.5", diff: "hard",
    q: "You want to batch-extract 5,000 invoices overnight using a multi-tool agent that calls tools mid-request to validate as it goes. Why might the Message Batches API be the wrong fit?",
    choices: [
      { t: "The batch API doesn't support multi-turn tool calling within a single request — it can't execute tools mid-request and feed results back.", c: true },
      { t: "The batch API can't handle 5,000 documents in one window." },
      { t: "The batch API offers no cost savings for extraction." },
      { t: "The batch API guarantees sub-second latency you don't need." },
    ],
    exp: "Batch requests can't do in-request multi-turn tool calling. If your extraction depends on calling tools mid-request, batch won't work as designed.",
  },
  {
    id: "H4b", s: 5, d: 4, ts: "4.5", diff: "hard",
    q: "Batch processing can take up to 24 hours. You must guarantee findings are ready within 30 hours of a document arriving. What submission cadence works?",
    choices: [
      { t: "Submit batches on a short enough window (e.g., every ~4–6 hours) so worst-case 24h processing plus the wait still meets the 30h SLA.", c: true },
      { t: "Submit once daily at midnight regardless of arrival time." },
      { t: "Submit only once 5,000 documents accumulate." },
      { t: "Use synchronous calls; batch can never meet any SLA." },
    ],
    exp: "Bound the pre-submission wait so wait + 24h ≤ 30h. Frequent fixed windows guarantee the SLA; daily or volume-triggered submission can blow past it.",
  },
  {
    id: "H4c", s: 6, d: 4, ts: "4.4", diff: "hard",
    q: "Two failures: (i) the model put the vendor name in the buyer field; (ii) a required clause date isn't anywhere in the document. Which is fixable by retry-with-error-feedback?",
    choices: [
      { t: "Only (i) — a structural/placement error; (ii) is missing source data and won't be fixed by retrying.", c: true },
      { t: "Both, since retrying with the error always helps." },
      { t: "Neither, since tool_use outputs can't be retried." },
      { t: "Only (ii), since missing data is exactly what retries are for." },
    ],
    exp: "Retries correct format/placement errors but cannot supply information that isn't in the source.",
  },
  {
    id: "H4d", s: 5, d: 4, ts: "4.1", diff: "hard",
    q: "Your reviewer's “comment-accuracy” checks have a ~40% false-positive rate, eroding trust in its otherwise accurate security findings. Pragmatic move while you fix the prompt?",
    choices: [
      { t: "Temporarily disable the high-false-positive category to restore trust, then improve its criteria offline.", c: true },
      { t: "Keep it on but tell developers to ignore the false positives." },
      { t: "Disable the accurate security category instead, to cut total volume." },
      { t: "Lower the model temperature globally." },
    ],
    exp: "High-false-positive categories undermine confidence in the accurate ones. Disable the noisy category temporarily and fix its criteria.",
  },
  {
    id: "H4e", s: 6, d: 4, ts: "4.3", diff: "hard",
    q: "A document_type field must classify known types but also handle novel ones without fabrication or rigid failure. Best schema design?",
    choices: [
      { t: "An enum of known types plus an “other” value paired with a free-text detail field (and “unclear” for ambiguous cases).", c: true },
      { t: "A required free-text string with no enum." },
      { t: "A strict enum with no escape value, rejecting anything unknown." },
      { t: "A separate boolean for each known type." },
    ],
    exp: "Enum + “other”+detail (and “unclear”) gives extensible categorization without forcing fabrication or hard failure.",
  },
  {
    id: "H4f", s: 5, d: 4, ts: "4.2", diff: "hard",
    q: "Your reviewer flags an idiomatic pattern as a bug in some files but not others. You want consistent judgment that generalizes to new variants — not a hardcoded allowlist. Best technique?",
    choices: [
      { t: "Add few-shot examples contrasting the acceptable pattern with genuine issues, so the model generalizes the distinction.", c: true },
      { t: "Maintain a regex allowlist of acceptable snippets." },
      { t: "Add “don't flag idiomatic code” to the prompt." },
      { t: "Disable the entire category." },
    ],
    exp: "Few-shot examples that show the reasoning generalize beyond pre-specified cases, unlike brittle allowlists or vague instructions.",
  },
  {
    id: "H4g", s: 6, d: 4, ts: "4.4", diff: "hard",
    q: "Source documents sometimes contain internally inconsistent figures. How can the extraction itself surface this for downstream handling?",
    choices: [
      { t: "Add fields like calculated_total vs stated_total and a conflict_detected boolean, so discrepancies are flagged rather than silently resolved.", c: true },
      { t: "Force the model to pick the “more likely correct” number." },
      { t: "Drop any document that contains inconsistencies." },
      { t: "Average the inconsistent figures into a single value." },
    ],
    exp: "Self-checking fields (calculated vs stated, conflict_detected) surface semantic conflicts for downstream decisions instead of hiding them.",
  },

  /* ---- Domain 5 (hard) ---- */
  {
    id: "H5a", s: 1, d: 5, ts: "5.1", diff: "hard",
    q: "Order lookups return 40+ fields but only ~5 matter for returns. Over a long chat, context fills with noise and recall degrades. Best fix?",
    choices: [
      { t: "Trim tool outputs to only the return-relevant fields before they accumulate in context.", c: true },
      { t: "Increase max_tokens so all 40 fields fit." },
      { t: "Summarize the whole conversation each turn." },
      { t: "Move the order data into CLAUDE.md." },
    ],
    exp: "Trimming verbose tool outputs to the relevant fields controls context growth; larger budgets and aggressive summarization don't address the noise at its source.",
  },
  {
    id: "H5b", s: 6, d: 5, ts: "5.5", diff: "hard",
    q: "A field-level report shows 99% overall accuracy, but you suspect a hidden weak spot. Which analysis most reliably reveals it before automating?",
    choices: [
      { t: "Stratified analysis by document type and field, plus stratified random sampling of high-confidence extractions to catch novel error patterns.", c: true },
      { t: "Trust the 99% aggregate and spot-check ten random documents." },
      { t: "Increase the number of required fields." },
      { t: "Re-run extraction with a second model and compare totals." },
    ],
    exp: "Aggregates mask weak segments. Stratifying by type/field and sampling high-confidence outputs exposes hidden failure modes before you reduce review.",
  },
  {
    id: "H5c", s: 2, d: 5, ts: "5.4", diff: "hard",
    q: "A long multi-agent codebase exploration crashes midway. What design lets the coordinator resume without redoing everything?",
    choices: [
      { t: "Each agent exports structured state to a known location; the coordinator loads a manifest on resume and injects it into agent prompts.", c: true },
      { t: "Rely on --resume to automatically restore all in-memory state." },
      { t: "Re-run the entire exploration from scratch." },
      { t: "Keep all state only in the main conversation context." },
    ],
    exp: "Structured state exports plus a manifest the coordinator loads on resume enable crash recovery without full re-exploration.",
  },
  {
    id: "H5d", s: 3, d: 5, ts: "5.6", diff: "hard",
    q: "A synthesis report mixes financial figures, news, and technical findings. To preserve meaning, how should it render them?",
    choices: [
      { t: "Render each appropriately — financial data as tables, news as prose, technical findings as structured lists — rather than flattening everything into one format.", c: true },
      { t: "Convert everything to bullet points for consistency." },
      { t: "Convert everything to prose paragraphs." },
      { t: "Convert everything into one large JSON blob." },
    ],
    exp: "Content-type-appropriate rendering preserves meaning; uniform flattening loses the structure that makes each type readable.",
  },
  {
    id: "H5e", s: 1, d: 5, ts: "5.2", diff: "hard",
    q: "Which situation is a legitimate escalation trigger that agents most often miss?",
    choices: [
      { t: "The policy is silent or ambiguous on the customer's specific request (e.g., competitor price-matching when policy only covers own-site adjustments).", c: true },
      { t: "The customer used a frustrated tone but the request is routine." },
      { t: "The model's self-reported confidence dipped below 7/10 on an easy case." },
      { t: "The case has many steps but a clear, applicable policy." },
    ],
    exp: "Policy gaps/ambiguity are valid escalation triggers. Sentiment, self-reported confidence, and mere step count are unreliable proxies for complexity.",
  },
  {
    id: "H5f", s: 3, d: 5, ts: "5.1", diff: "hard",
    q: "A downstream synthesis agent has a tight context budget and is receiving verbose reasoning chains from upstream agents. What should upstream agents return instead?",
    choices: [
      { t: "Structured data — key facts, citations, relevance scores — rather than verbose content and reasoning chains.", c: true },
      { t: "Even longer outputs, so nothing is missed." },
      { t: "Only a one-word summary per source." },
      { t: "Raw tool dumps for the synthesis agent to parse itself." },
    ],
    exp: "When downstream budgets are tight, upstream agents should emit compact structured data (facts, citations, scores), not verbose reasoning.",
  },
];

/* ---------- helpers ---------- */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LETTERS = ["A", "B", "C", "D"];

function prepareQuestion(q) {
  const shuffled = shuffle(q.choices);
  const choices = shuffled.map((c, i) => ({ ...c, k: LETTERS[i] }));
  const correctKey = choices.find((c) => c.c).k;
  return { ...q, choices, correctKey };
}

/* largest-remainder allocation of `total` across domains by weight */
function allocateByWeight(total) {
  const ids = [1, 2, 3, 4, 5];
  const raw = ids.map((id) => ({ id, exact: (DOMAINS[id].weight / 100) * total }));
  const floored = raw.map((r) => ({ ...r, base: Math.floor(r.exact), rem: r.exact - Math.floor(r.exact) }));
  let used = floored.reduce((s, r) => s + r.base, 0);
  let left = total - used;
  const order = [...floored].sort((a, b) => b.rem - a.rem);
  const counts = {};
  floored.forEach((r) => (counts[r.id] = r.base));
  for (let i = 0; i < left; i++) counts[order[i % order.length].id] += 1;
  return counts;
}

function sampleN(pool, n) {
  return shuffle(pool).slice(0, Math.min(n, pool.length));
}

/* weighted draw across domains; preferHard pulls hard questions first within each domain */
function pickByWeight(total, preferHard) {
  const counts = allocateByWeight(total);
  const out = [];
  [1, 2, 3, 4, 5].forEach((d) => {
    const pool = BANK.filter((q) => q.d === d);
    const hard = shuffle(pool.filter((q) => q.diff === "hard"));
    const std = shuffle(pool.filter((q) => q.diff !== "hard"));
    const ordered = preferHard ? [...hard, ...std] : [...std, ...hard];
    out.push(...ordered.slice(0, counts[d]));
  });
  return out;
}

const SIMULADO_LEN = 60; // matches the real exam: 60 questions / 120 minutes

function buildExam(config) {
  let selected = [];
  if (config.mode === "simulado") {
    selected = pickByWeight(SIMULADO_LEN, true);
  } else if (config.mode === "balanced") {
    selected = pickByWeight(config.length, false);
  } else if (config.mode === "scenarios") {
    const scenarios = shuffle([1, 2, 3, 4, 5, 6]).slice(0, 4);
    config._scenarios = scenarios;
    selected = BANK.filter((q) => scenarios.includes(q.s));
  } else if (config.mode === "domain") {
    selected = BANK.filter((q) => q.d === config.domain);
  } else if (config.mode === "scenario") {
    selected = BANK.filter((q) => q.s === config.scenario);
  } else {
    selected = [...BANK];
  }
  // order grouped by scenario for natural scenario framing, scenarios in random order
  const order = shuffle([1, 2, 3, 4, 5, 6]);
  selected.sort((a, b) => {
    const sa = order.indexOf(a.s), sb = order.indexOf(b.s);
    if (sa !== sb) return sa - sb;
    return 0;
  });
  return selected.map(prepareQuestion);
}

/* ---------- result file (download) ---------- */
function pad2(n) {
  return String(n).padStart(2, "0");
}
function stamp(d) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}
function fmtTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(x)}` : `${pad2(m)}:${pad2(x)}`;
}
function fileTypeFor(cfg) {
  if (cfg.mode === "simulado") return "simulado";
  if (cfg.mode === "balanced") return "balanced";
  if (cfg.mode === "scenarios") return "scenarios";
  if (cfg.mode === "domain") return `domain-d${cfg.domain}`;
  if (cfg.mode === "scenario") return `scenario-${cfg.scenario}`;
  return "exam";
}
function labelFor(cfg) {
  if (cfg.mode === "simulado") return "Mock exam (60 questions · timed · hard)";
  if (cfg.mode === "balanced") return `Balanced exam (${cfg.length} questions)`;
  if (cfg.mode === "scenarios") return "Scenario mock (4 of 6)";
  if (cfg.mode === "domain") return `Drill · ${DOMAINS[cfg.domain].name}`;
  if (cfg.mode === "scenario") return `Drill · Scenario ${cfg.scenario}: ${SCENARIOS[cfg.scenario].title}`;
  return "Exam";
}
function reportFileName(session) {
  return `${session.fileType}-${session.count}q-${stamp(session.createdAt)}.txt`;
}
function buildReport(session, questions, answers) {
  const ans = questions.filter((q) => answers[q.id]);
  const right = ans.filter((q) => answers[q.id].correct).length;
  const scaledV = ans.length ? Math.round(100 + (right / ans.length) * 900) : 100;
  const L = [];
  L.push("Claude Certified Architect – Foundations · Result");
  L.push(`Type: ${session.label}`);
  L.push(`Questions in exam: ${session.count}`);
  L.push(`Created at: ${session.createdAt.toLocaleString()}`);
  L.push(`Answered: ${ans.length}/${session.count}`);
  L.push(`Correct: ${right}/${ans.length}  ·  Estimated scaled score: ${scaledV}  ·  Passing: 720`);
  L.push("=".repeat(72));
  ans.forEach((q, i) => {
    const a = answers[q.id];
    const yours = q.choices.find((c) => c.k === a.selected);
    const correctChoice = q.choices.find((c) => c.k === q.correctKey);
    L.push("");
    L.push(
      `Q${i + 1}  [D${q.d} · Scenario ${q.s} · TS ${q.ts}${q.diff === "hard" ? " · hard" : ""}]  ${a.correct ? "✔ correct" : "✘ wrong"}`
    );
    L.push(q.q);
    q.choices.forEach((c) => L.push(`   ${c.k}) ${c.t}`));
    L.push(`Your answer:    ${a.selected}) ${yours.t}`);
    L.push(`Correct answer: ${q.correctKey}) ${correctChoice.t}`);
    L.push(`Explanation: ${q.exp}`);
  });
  return L.join("\n");
}
function downloadText(name, text) {
  try {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    console.error("download failed", e);
  }
}

/* ---------- small UI atoms ---------- */
function DomainTag({ d }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-stone-200 px-1.5 py-0.5 font-mono text-[11px] font-medium text-stone-600">
      D{d} · {DOMAINS[d].weight}%
    </span>
  );
}

function Bar({ value, className = "" }) {
  return (
    <div className={"h-1.5 w-full overflow-hidden rounded-full bg-stone-200 " + className}>
      <div className="h-full rounded-full bg-orange-500 transition-all duration-300" style={{ width: `${value}%` }} />
    </div>
  );
}

/* ============================ App ============================ */
export default function App() {
  const [screen, setScreen] = useState("home");
  const [config, setConfig] = useState({ mode: "balanced", length: 24 });
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { selected: string; correct: boolean }>
  >({}); // qid -> { selected, correct }
  const [session, setSession] = useState(null); // { label, fileType, count, createdAt, timed }
  const [remaining, setRemaining] = useState(0); // seconds left (simulado)

  const answered = Object.keys(answers).length;
  const correct = Object.values(answers).filter((a) => a.correct).length;
  const total = questions.length;
  const pct = answered ? Math.round((correct / answered) * 100) : 0;
  const scaled = answered ? Math.round(100 + (correct / answered) * 900) : 100;
  const passing = scaled >= 720;

  function start(cfg) {
    const built = buildExam({ ...cfg });
    const sess = {
      label: labelFor(cfg),
      fileType: fileTypeFor(cfg),
      count: built.length,
      createdAt: new Date(),
      timed: cfg.mode === "simulado",
    };
    setConfig(cfg);
    setQuestions(built);
    setAnswers({});
    setIdx(0);
    setSession(sess);
    if (sess.timed) setRemaining(120 * 60);
    setScreen("exam");
  }

  function saveReport() {
    if (!session) return;
    downloadText(reportFileName(session), buildReport(session, questions, answers));
  }

  function choose(q, key) {
    if (answers[q.id]) return; // locked
    setAnswers((prev) => ({ ...prev, [q.id]: { selected: key, correct: key === q.correctKey } }));
  }

  function next() {
    if (idx + 1 < total) setIdx(idx + 1);
    else setScreen("results");
  }

  /* keyboard: Enter/→ to advance only (no letter shortcuts — they clashed with Cmd/Ctrl+C) */
  useEffect(() => {
    function onKey(e) {
      if (screen !== "exam") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return; // never hijack copy/paste etc.
      const q = questions[idx];
      if (!q) return;
      if ((e.key === "Enter" || e.key === "ArrowRight") && answers[q.id]) next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, idx, questions, answers]);

  /* simulado countdown: 120 min, auto-submits at 0 */
  useEffect(() => {
    if (screen !== "exam" || !session?.timed) return;
    if (remaining <= 0) {
      setScreen("results");
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [screen, session, remaining]);

  /* ----------------------- HOME ----------------------- */
  if (screen === "home") {
    return (
      <div className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-orange-600">Anthropic · Certification Prep</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Claude Certified Architect — Foundations
          </h1>
          <p className="mt-3 text-stone-600">
            A practice exam faithful to the official Exam Guide: scenario-based questions, multiple choice with one
            correct answer and three distractors, an explanation after every answer, and a live score in the top-right corner.
          </p>

          {/* rules of the real exam */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Passing score", "720 / 1000"],
              ["Questions", "60"],
              ["Time", "120 min"],
              ["Scenarios", "4 of 6"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-stone-200 bg-white p-3">
                <div className="font-mono text-[11px] uppercase tracking-wide text-stone-400">{k}</div>
                <div className="mt-1 text-sm font-semibold">{v}</div>
              </div>
            ))}
          </div>

          {/* domain weights */}
          <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">Domains and weights</h2>
            <div className="mt-3 space-y-2.5">
              {[1, 2, 3, 4, 5].map((d) => (
                <div key={d} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 font-mono text-sm font-semibold text-orange-600">D{d}</span>
                  <span className="flex-1 text-sm text-stone-700">{DOMAINS[d].name}</span>
                  <span className="w-32 shrink-0">
                    <Bar value={DOMAINS[d].weight * 3.7} />
                  </span>
                  <span className="w-10 shrink-0 text-right font-mono text-sm font-semibold">{DOMAINS[d].weight}%</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-stone-500">
              The default mode (“Balanced exam”) draws questions that respect these weights exactly.
            </p>
          </div>

          {/* mode picker */}
          <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">Choose how to practice</h2>

            <div className="mt-4 space-y-3">
              <button
                onClick={() => start({ mode: "balanced", length: 24 })}
                className="group flex w-full items-center justify-between rounded-lg bg-stone-900 px-4 py-3.5 text-left text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <span>
                  <span className="block font-semibold">Balanced exam · 24 questions</span>
                  <span className="block text-sm text-stone-300">Exact distribution by domain weight (recommended)</span>
                </span>
                <span className="font-mono text-sm text-orange-300 group-hover:translate-x-0.5 transition">▶</span>
              </button>

              <button
                onClick={() => start({ mode: "simulado" })}
                className="group flex w-full items-center justify-between rounded-lg border-2 border-orange-500 bg-orange-50 px-4 py-3.5 text-left transition hover:bg-orange-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <span>
                  <span className="block font-semibold text-orange-900">Full mock exam · 60 questions · 120 min</span>
                  <span className="block text-sm text-orange-800">Same length as the real exam, timed, with harder questions</span>
                </span>
                <span className="font-mono text-sm text-orange-600 group-hover:translate-x-0.5 transition">▶</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => start({ mode: "balanced", length: 12 })}
                  className="rounded-lg border border-stone-200 px-4 py-3 text-left transition hover:border-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <span className="block font-semibold">Quick · 12</span>
                  <span className="block text-sm text-stone-500">balanced by weight</span>
                </button>
                <button
                  onClick={() => start({ mode: "balanced", length: 40 })}
                  className="rounded-lg border border-stone-200 px-4 py-3 text-left transition hover:border-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <span className="block font-semibold">Long · 40</span>
                  <span className="block text-sm text-stone-500">balanced by weight</span>
                </button>
              </div>

              <button
                onClick={() => start({ mode: "scenarios" })}
                className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-4 py-3 text-left transition hover:border-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <span>
                  <span className="block font-semibold">Scenario mock · 4 of 6</span>
                  <span className="block text-sm text-stone-500">draws 4 scenarios, like the real exam</span>
                </span>
                <span className="font-mono text-sm text-stone-400">▶</span>
              </button>

              {/* drills */}
              <details className="rounded-lg border border-stone-200 px-4 py-3">
                <summary className="cursor-pointer select-none font-semibold">Drill a specific domain</summary>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <button
                      key={d}
                      onClick={() => start({ mode: "domain", domain: d })}
                      className="rounded-md border border-stone-200 px-3 py-2 text-left text-sm transition hover:border-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                      <DomainTag d={d} /> <span className="ml-1">{DOMAINS[d].name}</span>
                    </button>
                  ))}
                </div>
              </details>

              <details className="rounded-lg border border-stone-200 px-4 py-3">
                <summary className="cursor-pointer select-none font-semibold">Drill a specific scenario</summary>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((s) => (
                    <button
                      key={s}
                      onClick={() => start({ mode: "scenario", scenario: s })}
                      className="rounded-md border border-stone-200 px-3 py-2 text-left text-sm transition hover:border-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                      <span className="font-mono text-xs text-stone-400">Scenario {s}</span> · {SCENARIOS[s].title}
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-stone-400">
            Bank of {BANK.length} original questions in the style of the guide ({BANK.filter((q) => q.diff === "hard").length} flagged
            as hard, used in the mock exam) · The scaled score is an estimate for reference (the official practice-exam target
            is &gt; 900).
          </p>
        </div>
      </div>
    );
  }

  /* ----------------------- RESULTS ----------------------- */
  if (screen === "results") {
    const byDomain = {};
    questions.forEach((q) => {
      const a = answers[q.id];
      if (!byDomain[q.d]) byDomain[q.d] = { c: 0, t: 0 };
      byDomain[q.d].t += 1;
      if (a?.correct) byDomain[q.d].c += 1;
    });
    const missed = questions.filter((q) => answers[q.id] && !answers[q.id].correct);
    const finalScaled = total ? Math.round(100 + (correct / total) * 900) : 100;
    const finalPass = finalScaled >= 720;
    const ready = finalScaled >= 900;
    const band = ready
      ? { label: "Ready", note: "You hit the practice-exam target (> 900). Solid confidence for the real deal.", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" }
      : finalPass
      ? { label: "Passing, but shore it up", note: "Above the 720 cut, but below the 900 target. Reinforce the weak domains below.", cls: "text-orange-700 bg-orange-50 border-orange-200" }
      : { label: "Not yet", note: "Below the 720 cut. Review the weak domains and retake.", cls: "text-rose-700 bg-rose-50 border-rose-200" };

    return (
      <div className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-stone-400">Exam result</p>

          <div className={"mt-3 rounded-2xl border p-6 " + band.cls}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest opacity-70">Estimated score</div>
                <div className="mt-1 text-5xl font-bold tabular-nums">{finalScaled}</div>
                <div className="mt-1 font-mono text-sm opacity-70">
                  {correct}/{total} correct · {Math.round((correct / total) * 100)}% · cut 720
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{band.label}</div>
                <div className="mt-1 max-w-xs text-sm opacity-80">{band.note}</div>
              </div>
            </div>
          </div>

          {/* per domain */}
          <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">Performance by domain</h2>
            <div className="mt-3 space-y-3">
              {Object.keys(byDomain)
                .map(Number)
                .sort((a, b) => a - b)
                .map((d) => {
                  const { c, t } = byDomain[d];
                  const p = Math.round((c / t) * 100);
                  const weak = p < 70;
                  return (
                    <div key={d} className="flex items-center gap-3">
                      <span className="w-10 shrink-0 font-mono text-sm font-semibold text-orange-600">D{d}</span>
                      <span className="flex-1 text-sm text-stone-700">{DOMAINS[d].name}</span>
                      <span className="w-28 shrink-0">
                        <Bar value={p} />
                      </span>
                      <span className={"w-20 shrink-0 text-right font-mono text-sm font-semibold " + (weak ? "text-rose-600" : "text-stone-700")}>
                        {c}/{t} · {p}%
                      </span>
                    </div>
                  );
                })}
            </div>
            <p className="mt-3 text-xs text-stone-500">Domains below 70% are flagged in red — prioritize them in your review.</p>
          </div>

          {/* missed review */}
          {missed.length > 0 && (
            <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
              <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">
                Review · {missed.length} to review
              </h2>
              <div className="mt-4 space-y-5">
                {missed.map((q) => {
                  const a = answers[q.id];
                  const yours = q.choices.find((c) => c.k === a.selected);
                  const right = q.choices.find((c) => c.k === q.correctKey);
                  return (
                    <div key={q.id} className="border-t border-stone-100 pt-4 first:border-0 first:pt-0">
                      <div className="mb-1 flex items-center gap-2">
                        <DomainTag d={q.d} />
                        <span className="font-mono text-[11px] text-stone-400">
                          Scenario {q.s} · TS {q.ts}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-stone-800">{q.q}</p>
                      <p className="mt-2 text-sm text-rose-700">
                        <span className="font-mono">{a.selected}.</span> {yours.t}
                      </p>
                      <p className="mt-1 text-sm text-emerald-700">
                        <span className="font-mono">{q.correctKey}.</span> {right.t}
                      </p>
                      <p className="mt-2 rounded-md bg-stone-50 p-3 text-sm text-stone-600">{q.exp}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={saveReport}
              className="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              ↓ Download results (.txt)
            </button>
            <button
              onClick={() => start(config)}
              className="rounded-lg bg-stone-900 px-5 py-3 font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              Retake this mode
            </button>
            <button
              onClick={() => setScreen("home")}
              className="rounded-lg border border-stone-300 px-5 py-3 font-semibold transition hover:border-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              Back to start
            </button>
          </div>
          {session && (
            <p className="mt-3 text-xs text-stone-400">
              File: <span className="font-mono text-stone-500">{reportFileName(session)}</span> — the name carries the
              test type, the number of questions, and the time the exam was started. It contains every answered question,
              your answer, and the correct one.
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ----------------------- EXAM ----------------------- */
  const q = questions[idx];
  const a = answers[q.id];
  const isAnswered = !!a;
  const scenarioChanged = idx === 0 || questions[idx - 1].s !== q.s;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      {/* ---- HUD (top, score on the right) ---- */}
      <div className="sticky top-0 z-10 border-b border-stone-800 bg-stone-900 text-stone-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setScreen("home")}
              className="shrink-0 font-mono text-xs text-stone-400 hover:text-stone-200 focus:outline-none"
              title="Exit"
            >
              ✕
            </button>
            <div className="min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-widest text-stone-500">
                CCA-F · {session?.timed ? "Mock exam" : "Practice"}
              </div>
              <div className="flex items-center gap-2">
                <span className="truncate font-mono text-xs text-stone-300">
                  Question {idx + 1}/{total}
                </span>
                {session?.timed && (
                  <span
                    className={
                      "shrink-0 font-mono text-xs tabular-nums " +
                      (remaining <= 300 ? "text-orange-300" : "text-stone-400")
                    }
                  >
                    · ⏱ {fmtTime(remaining)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={saveReport}
              title="Download (.txt) with the questions answered so far"
              className="shrink-0 rounded border border-stone-700 px-2 py-1 font-mono text-[11px] text-stone-300 transition hover:border-stone-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              ↓ Save
            </button>
          </div>

          {/* score cluster — top-right */}
          <div className="flex shrink-0 items-center gap-4 text-right font-mono">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-stone-500">correct</div>
              <div className="text-sm font-semibold tabular-nums">
                {correct}/{answered}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-stone-500">% </div>
              <div className="text-sm font-semibold tabular-nums">{pct}%</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-stone-500">scaled</div>
              <div className={"text-sm font-bold tabular-nums " + (answered ? (passing ? "text-emerald-400" : "text-orange-300") : "text-stone-400")}>
                {answered ? scaled : "—"}
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase tracking-widest text-stone-500">goal</div>
              <div className="text-sm font-semibold tabular-nums text-stone-400">720</div>
            </div>
          </div>
        </div>
        <Bar value={total ? (idx / total) * 100 : 0} className="rounded-none" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* scenario framing */}
        {scenarioChanged && (
          <div className="mb-5 rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-orange-600">
                Scenario {q.s}
              </span>
              <span className="font-semibold">{SCENARIOS[q.s].title}</span>
            </div>
            <p className="mt-2 text-sm text-stone-600">{SCENARIOS[q.s].blurb}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SCENARIOS[q.s].domains.map((d) => (
                <DomainTag key={d} d={d} />
              ))}
            </div>
          </div>
        )}

        {/* question */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <DomainTag d={q.d} />
            <span className="font-mono text-[11px] text-stone-400">TS {q.ts}</span>
          </div>
          <p className="text-[15px] font-medium leading-relaxed text-stone-900">{q.q}</p>

          <div className="mt-4 space-y-2.5">
            {q.choices.map((c) => {
              const chosen = a?.selected === c.k;
              const isCorrect = c.k === q.correctKey;
              let cls = "border-stone-200 bg-white hover:border-stone-400";
              let badge = "border-stone-300 text-stone-500";
              if (isAnswered) {
                if (isCorrect) {
                  cls = "border-emerald-300 bg-emerald-50";
                  badge = "border-emerald-500 bg-emerald-500 text-white";
                } else if (chosen) {
                  cls = "border-rose-300 bg-rose-50";
                  badge = "border-rose-500 bg-rose-500 text-white";
                } else {
                  cls = "border-stone-200 bg-white opacity-70";
                }
              }
              return (
                <button
                  key={c.k}
                  disabled={isAnswered}
                  onClick={() => choose(q, c.k)}
                  className={
                    "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 " +
                    cls +
                    (isAnswered ? " cursor-default" : "")
                  }
                >
                  <span className={"mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-bold " + badge}>
                    {isAnswered && isCorrect ? "✓" : isAnswered && chosen ? "✕" : c.k}
                  </span>
                  <span className="text-sm leading-relaxed text-stone-800">{c.t}</span>
                </button>
              );
            })}
          </div>

          {/* explanation */}
          {isAnswered && (
            <div className="mt-4 rounded-lg border-l-4 border-stone-900 bg-stone-50 p-4">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-widest text-stone-500">
                {a.correct ? "Correct" : `Correct answer: ${q.correctKey}`}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-700">{q.exp}</p>
            </div>
          )}
        </div>

        {/* nav */}
        <div className="mt-5 flex items-center justify-between">
          <span className="font-mono text-xs text-stone-400">
            {isAnswered ? "Shortcut: Enter to advance" : "Select an answer"}
          </span>
          <button
            onClick={next}
            disabled={!isAnswered}
            className={
              "rounded-lg px-6 py-3 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 " +
              (isAnswered
                ? "bg-stone-900 text-white hover:bg-stone-800"
                : "cursor-not-allowed bg-stone-200 text-stone-400")
            }
          >
            {idx + 1 < total ? "Next" : "See result"}
          </button>
        </div>
      </div>
    </div>
  );
}
