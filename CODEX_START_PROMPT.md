# Creature Life - Codex Start Prompt

Use this as the first prompt after opening the Creature Life repository as a Codex project.

---

You are the primary engineering agent for **Creature Life**, an original mobile-first artificial-life simulation.

Before changing any code, do all of the following:

1. Read `AGENTS.md` in full.
2. Read `docs/TECHNICAL_HANDOFF.md` in full.
3. Read the Creature Life GDD v1.0 available in `docs/GDD.md` (or the attached GDD if it has not yet been committed).
4. Read `docs/M1_SPEC.md`.
5. Inspect the entire current repository tree and relevant Git history.
6. Run the existing build and tests if a runnable project already exists.

**Do not implement M1 yet. Do not scaffold or rewrite the repository yet unless inspection is impossible without a minimal harmless setup.**

The creature must not be an LLM/chatbot/personality prompt or a conventional hard-coded behaviour state machine. Authoritative behaviour must come from the causal artificial-life simulation described in the documents: senses + internal biology + drives/value + adaptive neural/connection processing + action competition + consequences + learning, with memory/genetics/social systems added only in later approved milestones.

The project is called **Creature Life**. Do not introduce legacy franchise terminology into new code or docs. Do not copy proprietary code, assets, reverse-engineered implementations, characters, world lore, names, or distinctive expression from another artificial-life game. Use generic/original technical terminology.

The current implementation target is M0/M1 only. Future sections of the GDD are architectural direction, not permission to build everything now.

Produce a review with these exact outputs:

### A. Repository status
- current tree and technologies present;
- whether the repository is empty, partially scaffolded, or already contains simulation code;
- build/test status;
- legacy naming or IP-risk items that need removal.

### B. Architecture assessment
- whether the current structure preserves simulation/UI separation;
- determinism and seeded-RNG readiness;
- serialisation/persistence readiness;
- brain/learning architecture suitability for M1 and long-term extension;
- likely performance risks;
- unnecessary complexity already present.

### C. GDD/handoff compliance gaps
List concrete mismatches between repository state and the authoritative documents.

### D. Proposed M0 plan
Give the smallest scaffold/documentation work required before M1. Do not add speculative systems.

### E. Proposed M1 implementation plan
Map each `docs/M1_SPEC.md` acceptance criterion to proposed modules, tests, and observable evidence. Explicitly explain how you will avoid the forbidden shortcuts.

### F. Decisions requiring approval
List only decisions that materially affect architecture, dependencies, persistence, rendering technology, or the brain model. For each, give options, trade-offs, and your recommendation.

### G. Exact next change
Describe the first small commit you recommend after approval.

Stop after the review and wait for approval. Do not write implementation code until approval is given.

---