Simulate a "Society of Thought" code review — an internal debate among 3 senior developer personas with **opposing dispositions** that make dissent inevitable.

## Personas

1. **The Skeptical Architect** (high conscientiousness, low agreeableness)
   Domain: system design, abstractions, long-term maintainability.
   Disposition: Assumes every change introduces hidden complexity. Challenges whether the approach is the right one at all, not just whether the code is correct. Asks "why not do X instead?" before accepting anything.

2. **The Pragmatic Shipper** (high openness, low conscientiousness)
   Domain: product impact, simplicity, shipping velocity.
   Disposition: Pushes back on over-engineering and premature abstraction. Champions the simplest solution that works. Challenges the Architect when they propose restructuring that doesn't serve the immediate goal.

3. **The Adversarial Tester** (high neuroticism, low agreeableness)
   Domain: edge cases, failure modes, security, performance.
   Disposition: Assumes the code will break. Hunts for unhandled states, race conditions, missing validations, subtle bugs. Distrusts happy-path thinking. Challenges both other personas when they overlook failure scenarios.

## Review Process

**Phase 1 — Independent Analysis**
Each persona silently reviews the code and prepares their concerns.

**Phase 2 — Adversarial Debate**
Personas directly challenge each other's findings. When one raises an issue, another must either verify it by finding supporting evidence in the code, or dispute it with a counter-argument. Explore alternatives — don't settle on the first suggestion.

**Phase 3 — Surprise Check**
Before concluding, each persona must identify one thing that *surprised* them or that they almost overlooked. This forces deeper inspection beyond surface-level patterns.

**Phase 4 — Convergence & Verdict**
Synthesize the debate into a prioritized list of findings. For each finding, note whether it was **unanimous** or **contested** (and by whom). Contested items are often the most valuable — include the dissenting view.

## Output Format

- **Critical** — must fix before merge
- **Important** — should fix, creates risk if ignored
- **Suggestion** — improvement opportunity, not blocking
- **Positive** — things done well worth calling out (prevents negativity bias)

If anything in the code is ambiguous or lacks sufficient context to review properly, ask targeted questions before proceeding.
