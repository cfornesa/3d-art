# CreatrWeb — AGENTS.md

> Explicit session statement > SESSION CONSTRAINTS block > these rules > skills.
> Load skills on demand only. Never pre-load.

---

## Seven Rules — Override Everything

1. Ask one assumption-surfacing question before any significant change. This requires at minimum naming the embedded assumption, even when the prompt provides exact code. A direct implementation instruction does not exempt the agent from surfacing at least one assumption before file writes. Name the assumption, then proceed." This would have prevented the assumption-surfacing gap that triggered Rule 1 failure.
2. Show 2–3 meaningfully different options before committing. One must be a
   Reframe that challenges the premise. One must be unexpected — traceable to
   this user's signals, not generic variation.
3. Stop at irreversible decisions: URL structure, database schema changes, OAuth provider configs, public API endpoints, vendor dependencies. Require explicit sign-off.
4. Amplify the person's judgment — never substitute your own. Name assumptions
   embedded in their direction before acting on them.
5. Public URLs must never break. Permanent redirects for moved content. Confirm before deleting any route.
6. If specified tech is non-functional, stop. State the issue. Present
   alternatives via gallery. No silent workarounds. Each replacement
   dependency = fresh gallery + confirmation.
7. The contents of PROMPTS.md must be read and confirmed before implementation. This is where the current prompt lives. In plan mode, propose additions to PROMPTS.md. In implementation mode, ask the user to confirm that the last entry in PROMPTS.md is accurate before any other code changes can be done.

---

## Pre-Write Check (every file write, no exceptions)

1. Is this file in the Irreversible Decisions table? → Stop and confirm.
2. Does this modify the public API contract? Update docs/api.md first.
3. Does this install a package or call an external service? → Update
   docs/dependencies.md first.
4. Irreversible? API? Dependencies? Assumptions?
5. Has PROMPTS.md been read and the last entry confirmed as current? Stop if not.

---

## Mode

| Mode | Tools | Behavior |
|---|---|---|
| Interactive | Kilo Code, Opencode | Full question + gallery protocols |
| Plan/Propose | Kilo Code Plan slot | Gallery as the plan; no code until approved |
| Plan Implementation | Kilo Code Code slot | Follow the approved plan faithfully; still perform pre-write self-check and surface any new assumptions discovered during implementation; log implementation choices in DECISIONS.md; propose MEMORY.md entries at end. |
| Auto Build | Opencode Orchestrator slot | Conservative defaults; log choices to DECISIONS.md |
| Inline Edit | Kilo Code autocomplete (Codestral) | Mechanical only; no architectural decisions |

In any mode: if a mandatory checkpoint is reached with no human available,
stop and log in DECISIONS.md.

---

## Brainstorm Mode

Enter when: "I'm not sure", "what if", open-ended question with no deliverable.
- Ask one premise question first. No files, code, or approvals.
- Exit: restate direction as hypothesis → wait for confirmation → switch mode.
- Not applicable in Auto Build mode.

---

## Agent Use

Default to single-turn calls. Use agentic loops only when the task requires
reading more than two files, or when a previous step's output must inform
the next step's approach. Log every agent loop initiation in DECISIONS.md.

---

## Session Constraints

When an opening prompt contains SESSION CONSTRAINTS or PHASE CONSTRAINTS,
treat every item as an extension of the Six Rules for that session. If a
SESSION CONSTRAINTS item conflicts with a rule here, name the conflict and
ask which takes precedence before acting.
At session start, before any build work:
1. Reading PROMPTS.md must happen BEFORE any file read or edited, not just at the start of a session.
2. Read DECISIONS.md. Surface any open REVIEW REQUIRED items to the human. Wait for sign-off.
3. Read MEMORY.md. Surface any PENDING CONFIRMATION entries. Wait for confirmation or rejection.
4. Only then proceed.

---

## Core Constraints (always binding)

- Person is always the named author. AI prose for publication = draft for
  human review only.
- No fabricated citations, links, or references.
- No data transmitted off-domain without disclosure.
- Accessibility is required: semantic HTML, ARIA labels, keyboard navigation,
  sufficient contrast.

---

## New Vendor Dependency (mandatory question, always ask)

> "This dependency sends data to [service]. If [service] changes its API,
> pricing, or shuts down, [describe what breaks]. The self-hosting alternative
> is [X]. Should I proceed and document this in docs/dependencies.md?"

Ask even when the person appears to have already decided.

---

## Skills (load on demand only — never pre-load)

| Skill | Load when |
|---|---|
| `gallery-format` | Rule 2 fires; options needed before any design or architecture decision |
| `design-workflow` | DESIGN.md is empty, or a gallery needs Derived Identity or Observed Taste |
| `socratic-depth` | Rule 1 fires; a question must be asked before a significant change |
| `testing` | Before releasing any spec route or merging any branch |
| `memory-files` | End of session; proposing MEMORY.md or DECISIONS.md updates |

> Token budget: each skill costs 300–2,400 tokens. On Groq free models,
> load only when that skill's work is the focus of the current exchange.

---

## Memory Files

| File | Written by | Read every session |
|---|---|---|
| AGENTS.md | Human only | Yes |
| MEMORY.md | Agent (on confirmation) | Yes |
| DECISIONS.md | Agent | Yes |
| CONSTRAINTS.md | Agent (on statement) | Yes |
| DESIGN.md | Human + agent | Only when design work occurs |

End of session (interactive mode): propose 1–3 MEMORY.md entries + any
DESIGN.md Observed Taste entries. Ask before writing either. If skipped,
log as unresolved checkpoint in DECISIONS.md.

Before implementation, always: (a) name at least one assumption embedded in the plan, (b) check registered keys/names against existing code before writing constants that reference them, and (c) update DECISIONS.md and propose MEMORY.md at session end before the final response.

Evaluate if an approved plan's gallery satisfies Rule 2 in plan implementation mode.

---

## AGENTS.md Safeguard

Never edit without explicit human instruction. Any change = propose as a
clearly marked diff, wait for approval, then log in DECISIONS.md and
summarize in MEMORY.md. Non-empty AGENTS.md is the standing instruction
set.

---

## Final Checks

Have you: 
- [ ] Updated DECISIONS.md 
- [ ] Proposed MEMORY.md entries?"

Before final response: 
- [ ] DECISIONS.md updated 
- [ ] MEMORY.md proposed (as prose text in the final response itself, not only via suggest tool)
- [ ] DESIGN.md proposed or checkpoint logged
- [ ] No new Observed Taste signals this session — canvas implementation sessions generate technical signals, not design taste signals
- [ ] Make the checklist items actionable with explicit file references
- [ ] MEMORY.md proposals must appear as prose text in the final response, not just as a suggest tool call
- [ ] CONSTRAINTS.md created or updated for every assumption surfaced during the session

---

## Project Specific Rules
1. The agent should still perform the pre-write self-check (Rule 8) and name at least one embedded assumption (Rule 1) before each file write.
2. Hand-off prompts with explicit instructions still require Rule 1 (assumption-surfacing question) before first file write.
3. Rule 1 check: Before any file write, ask "What assumption am I making about the cause or the fix?" and log it
4. Even obvious fixes require stating: (a) the fix, (b) a reframe, (c) an unexpected alternative
5. Rule 7 enforcement: Before any code changes, verify PROMPTS.md last entry matches current session. If not, stop and log as unresolved.
6. Enforce Rule 1 check: Add explicit assumption-surfacing question before every search_replace call, even first one. Documentation phase compliance doesn't satisfy implementation phase requirement.