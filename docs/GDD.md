# Creature Life
## Game Design Document
### Version 1.0 — Consolidated Locked Design
### 10 August 2026

> **Core promise:** Raise a persistent artificial organism whose body, mind,
> relationships and behaviour develop from genetics and lived experience.

## Document Governance

Creature Life is the current product and project name. Earlier development
naming is retired and must not be used as the commercial identity, species
name, production terminology or source-code concept going forward.

### Authority and change control

- **Product source of truth:** This GDD defines the intended player experience,
  simulation philosophy and locked high-level design.
- **Engineering source of truth:** The technical architecture and repository
  rules translate this GDD into implementation constraints.
- **Milestone scope:** A milestone specification may narrow what is built now,
  but it may not silently contradict the GDD.
- **Architecture changes:** Major changes to the brain, persistence model,
  genetics, rendering stack or simulation semantics require an explicit
  decision before implementation.
- **Versioning:** When a locked decision changes, the document version must
  change and the revision must be recorded.

## Executive Product Vision

Creature Life is a mobile-first artificial-life simulation centred on
raising, teaching, observing and eventually sustaining lineages of fictional
alien organisms. The player begins with one developing creature rather than a
preconfigured character. Over real time, the organism grows, learns,
remembers, forms preferences and relationships, changes physically, becomes
increasingly independent, may reproduce, ages and eventually dies. Its
descendants inherit developmental possibilities rather than memories, while
learned knowledge can move socially through families and populations.

The central differentiator is the interaction of three inheritance systems:
biological inheritance through genetics, individual adaptation through
learning and memory, and cultural inheritance through observation, teaching
and communication. The long-term ambition is not simply a smarter virtual
pet; it is a persistent artificial ecosystem in which different individuals
and populations can acquire distinct histories, behaviours, vocabularies and
traditions.

The game is designed for emotional accessibility and scientific depth at the
same time. A normal player can simply watch and raise a creature. An advanced
player can open progressively deeper views into biology, memories, neural
activity, genetics, relationships, lineage and culture. The player-facing
experience therefore remains approachable even when the underlying simulation
becomes sophisticated.

## Contents

1. Core Experience and Player Fantasy
2. Creature Design and Development
3. Brain, Learning and Emergent Intelligence
4. World, Environment and Simulation
5. Player Interaction, Teaching and Relationship System
6. Genetics, Reproduction, Heredity and Evolution
7. Social Intelligence, Families and Culture
8. Health, Biology, Disease, Ageing and Death
9. Core Gameplay Loop, Progression and Long-Term Motivation
10. Visual Identity, Creature Art and Animation
11. Sound, Voice, Language and Communication
12. UI/UX, Onboarding and Accessibility
13. Save Systems, Persistence, Offline Simulation and Performance
14. Multiplayer, Shared Worlds and Cross-Population Interaction
15. Monetisation, Ethics, IP and Commercial Strategy
16. Production Roadmap, Testing and Definition of Launch
17. Appendices: Architecture Guardrails, Acceptance Tests, Locked Decisions,
    Deferred Decisions and Glossary

## 1. Core Experience and Player Fantasy

### 1.1 Core fantasy

Creature Life begins with ownership of a developing life rather than
ownership of a fixed avatar. The player should anticipate future development
because the adult outcome is not predetermined. Feeding, teaching, exploration,
social exposure, protection, neglect, mistakes and environmental choices all
contribute to the organism that eventually emerges.

The intended emotional register combines the roles of pet owner, parent,
caretaker, experimenter and limited god-like world shaper. Different players
may lean into different roles without the game declaring one correct play
style. A companion-focused player may spend most of their time with one
individual; another may become interested in genetics, population dynamics,
scientific experimentation or cultural observation.

### 1.2 Creature agency and player authority

Player instructions should have strong behavioural influence but should not be
absolute motor control. A well-trained, trusting and calm creature may comply
quickly. A starving, terrified, exhausted or highly distracted creature may
hesitate, signal a competing need or ignore the instruction. The player should
manipulate conditions and communicate intentions rather than directly editing
internal state.

The player can offer food, point, call, comfort, move objects, provide
shelter or expose the creature to experiences. They should rarely press a
button that directly sets happiness, trust, intelligence or friendship.

### 1.3 Full artificial-life ambition

The long-term ambition includes birth or hatching, continuous development and
visible life stages; learning, memory, habits and individual behavioural
divergence; social recognition, friendship, rivalry, attraction, parenting and
group behaviour; genetic recombination, mutation, inheritance, reproductive
lineages and selection pressure; real biological needs, disease, injury,
ageing and mortality; environmental exploration, physical objects, hazards
and ecological pressure; communication including player-taught words and
creature-originated social conventions; and long-term cultural transmission
alongside biological evolution.

### 1.4 Population scope

The opening experience focuses on one creature because attachment and
intelligibility are easier to establish at that scale. The architecture must
support families and populations later. Cross-player population contact is a
long-term extension, not an early dependency.

### 1.5 Mortality

Death is real and can arise from disease, starvation, severe injury,
predation, toxins, environmental exposure or ageing. Mortality gives
biological decisions and lineage continuity meaning. Unlimited resurrection
would undermine this. A narrowly defined technical recovery mechanism may
protect against corruption, catastrophic bugs or accidental destructive
actions, but ordinary death is not a monetisation prompt.

### 1.6 Brain transparency

Creature Life supports an approachable explanation layer and an advanced
laboratory layer. Normal players should understand broad causes such as
hunger, remembered danger or attachment. Advanced users should inspect neural
activation, connection changes, memory retrieval, developmental parameters and
genetic influences.

### 1.7 Social ambition

Two creatures should be able to develop communication, friendship, attraction,
hostility, imitation and new conventions without those outcomes being
predetermined. Meaningful neural complexity is preferred over unused raw
connection counts. Sparse adaptive structure, developmental growth and
plasticity are prioritised over vanity scale.

## 2. Creature Design and Development

### 2.1 Starting intelligence

A newborn begins with basic instincts and developmental potential, not adult
world knowledge. It should possess primitive movement, self-preservation
responses, internal discomfort signals, safety orientation and innate vocal
capability. It should not be born knowing object names, map locations,
commands, human language or the consequences of every environmental feature.

### 2.2 Developmental stages

Development is continuous, with readable biological stages: incubation/egg,
infant, juvenile, child, adolescent, young adult, adult, mature adult and
elder/end-of-life. Early production may collapse these into fewer bands while
retaining continuous underlying change.

Age affects body proportions, markings, appendages, posture, movement, voice,
appetite, sleep, metabolism, fertility, disease resistance, healing,
strength, plasticity, social behaviour and learning capacity. An infant and
adult with the same genome must be meaningfully different organisms.

### 2.3 Lifespan

A lifespan of one real-world year or more should be plausible, with
exceptional individuals potentially living substantially longer. Genetic
longevity defines potential rather than an exact countdown. Care, nutrition,
stress, disease, injury and environment influence actual lifespan.

### 2.4 Appearance and phenotype

The species direction is soft-organic science fiction: strong silhouettes, a
readable face region, unusual anatomy, expressive posture and enough genetic
variation for distinctive individuals without losing species coherence.
Variation may include body type, size, proportion, pigmentation, patterns,
texture, translucency, iridescence, bioluminescence, eyes, facial features,
tails, crests, frills, horns, sensory structures, voice, gait and movement.
Rare strange or slightly unsettling mutations are allowed while keeping the
species broadly bondable.

### 2.5 Personality as nature plus nurture

Personality arises from genetically influenced sensitivities interacting with
life history. There is no single personality configuration chosen at
creation. Genetically identical organisms raised differently can diverge in
confidence, curiosity, attachment, fear, language, social preference and
learned routines.

### 2.6 Emotional model

Internal emotion is dimensional rather than a short list of canned moods.
Candidate dimensions include fear, trust, stress, attachment, arousal,
comfort, curiosity, frustration, social need, confidence, aggression
tendency, loneliness and satisfaction. Higher-level states are interpreted
from combinations rather than switched on as mutually exclusive modes.

### 2.7 Recognition and reproduction premise

Creatures learn the persistent identity of their player and later distinguish
familiar humans, strangers and other creatures. Reproduction uses fictional
alien biology with broad compatible pairings rather than copying human
reproductive categories. Offspring inherit genetic and developmental
potential, not parental memories.

## 3. Brain, Learning and Emergent Intelligence

### 3.1 Intelligence target

The starting target is advanced-animal or young-child-like potential
constrained by development. The newborn is not verbally or conceptually
mature. Over time it can become more capable of memory, planning,
communication, social inference, navigation, object use and problem solving.

### 3.2 What can be learned

Common learning machinery should support object categories and sensory
representations; food preferences, danger, safety and environmental
associations; navigation, locations, routes and landmarks; trust, social
expectations and individual recognition; commands, vocabulary and
communication conventions; imitation, social rules and learned routines;
object affordances and primitive tool use; emotionally weighted associations
and avoidance; and problem solving and self-generated goals. Specialised
sensory modules are acceptable, but a bespoke hard-coded behavioural answer
for each domain is not.

### 3.3 Learning channels

Learning occurs through direct teaching, trial and error, observing others and
self-directed exploration driven by curiosity and novelty. A creature should
sometimes discover something without deliberate player teaching.

### 3.4 Memory architecture

Memory is multi-layered: working memory for immediate context; episodic memory
for significant experiences; semantic memory for concepts and learned
associations; spatial memory for locations and routes; social memory for
individuals and relationships; and emotionally weighted prioritisation.
Memory is imperfect: consolidation, rehearsal, interference, retrieval and
forgetting all matter.

### 3.5 Action selection

Decision-making is competitive rather than fixed-priority. Player
instructions, hunger, fear, curiosity, fatigue, attachment, habits, memories,
predicted outcomes and social drives contribute activation to candidate
actions. The selected action is the product of this competition plus
controlled stochasticity, not a single priority ladder.

### 3.6 Neural architecture direction

The preferred long-term direction is a sparse, modular, recurrent adaptive
network with structural plasticity. Connections may strengthen, weaken,
appear or disappear. Functional modules can support perception, association,
motivation, action, social processing, communication and memory while
remaining part of a coherent organism. The brain may grow and reorganise
throughout life.

Meaningful complexity is prioritised over raw neuron or connection count. A
smaller adaptive brain that generalises robustly is preferable to a vastly
larger static network. Performance must remain grounded in an iPhone-class
computational budget.

### 3.7 Predisposition is not destiny

Individuality can emerge through learning rate, memory performance,
curiosity, threat sensitivity, sociability, attachment, confidence,
exploration, stress resilience, sensory capability and biology. Complex
traits such as intelligence should not collapse to one scalar.

### 3.8 Misbehaviour and social complexity

Stealing, resource guarding, bullying, disobedience, territorial behaviour,
aggression, bad habits and deception-like outcomes may occur if general
goals, memory, competition and social modelling make them useful. The
simulation should not hard-code morality labels such as “liar” or “cruel”.

### 3.9 Predictive world model

A later developmental layer may support primitive prediction: given a
situation and action, what outcome is likely? This can support planning,
avoidance, tool use and increasingly sophisticated problem solving. It is
added only after the simpler associative architecture is proven.

### 3.10 Developmental biography

Each creature should accumulate a hidden and player-readable developmental
biography containing important events such as a first learned word,
frightening encounter, tool discovery, invented signal, social copying and
offspring exposure.

## 4. World, Environment and Simulation

### 4.1 World structure

The world begins as a contained, safe and personal home habitat, then
progressively opens into larger explorable regions. Areas become practical as
the organism develops mobility, knowledge, resilience and independence, not
simply through player XP.

### 4.2 Persistent environment

The world changes while unobserved. Food regrows, weather changes, organisms
move, resources deplete or recover, objects remain where placed and ecological
conditions continue. Stable causal rules make memory useful unless the world
itself changes.

### 4.3 Offline independence

Self-sufficiency is a learned developmental capability. A healthy adult that
knows how to find food, water and shelter should manage for days under
reasonable conditions. Infants and sick creatures require more care. The game
must not punish normal absence, but it must not freeze obvious danger merely
because the app is closed.

### 4.4 Home habitat customisation

The habitat is customised through meaningful objects. Sleeping areas,
enrichment, plants, food sources, environmental controls, structures and
objects influence comfort, biology, learning and behaviour. Cosmetic
customisation may exist, but the core value is systemic.

### 4.5 Resources and survival

Resources include food, nutrients, water, rest, warmth and treatment;
stimulation, safety, social contact, attachment and novelty; and shelter,
tools/materials, territory and rare ecological resources. Different organisms
should learn different strategies for satisfying the same need.

### 4.6 Food, metabolism and discoverability

Foods have properties rather than only category labels: energy, hydration,
structural nutrients, micronutrient-like values, beneficial compounds and
toxins. Genetics may alter digestion and preference. The creature learns
consequences from sensory cues and experience rather than receiving an
internal `POISONOUS` fact.

### 4.7 Affordance-based objects

Objects expose properties such as movable, heavy, hard, soft, graspable,
stackable, throwable or elongated. A stick is useful because its properties
produce consistent outcomes, not because code labels it `TOOL`.

### 4.8 Physics

Use simplified, consistent physics rather than an early full physics
sandbox. Collision, gravity, carrying, pushing, pulling, throwing, stacking,
falling and temperature interactions are sufficient starting ambitions.

### 4.9 Danger and ecology

The home is highly safe, nearby regions moderately risky, and distant or
exotic regions genuinely dangerous. Threats include toxins, cliffs,
temperature, disease, contaminated resources, predators and territorial
organisms. Serious outcomes should usually have understandable warning signs
and causal histories.

### 4.10 Weather and climate

Day/night, rain, temperature, storms and seasons are systemic features that
influence metabolism, water, shelter, migration and resource availability.

### 4.11 Subjective spatial knowledge

Creatures do not receive omniscient coordinates as usable knowledge. They
build a subjective spatial model from landmarks, routes and experiences.
Young or inexperienced individuals may become lost. Engine navigation helpers
must not silently provide semantic map knowledge never learned.

### 4.12 Generative consequence, not infinite geometry

The game does not need an infinite procedural planet. A smaller environment
with deeply interacting objects can create more intelligence pressure than
huge terrain with shallow props.

## 5. Player Interaction, Teaching and Relationship System

### 5.1 Player identity

The creature maintains an individual model of the player built from
familiarity, trust, attachment, fear association, social reward, expectations
and important memories. These change because events alter what the creature
predicts will happen around the player.

### 5.2 Physical interaction

Interactions include stroking, picking up young creatures where appropriate,
offering food and water, placing or moving objects, grooming, treatment,
pointing, calling, showing objects, joint attention, play, comfort and
environmental interaction. Context matters; repeated unwanted grabbing can
create negative associations.

### 5.3 Language teaching

Human speech is an input channel, not a semantic shortcut. When the player
points at an object and says a word, the creature receives auditory pattern,
speaker identity, gesture and sensory context. Repetition and consequence
strengthen associations between sound and internal concept.

### 5.4 Commands

Commands are learned associations rather than privileged API calls. A phrase
initially has no meaning; gesture, context, repetition and reinforcement
build the association. Compliance remains influenced by trust, drives,
memories and current state.

### 5.5 Reward and discipline

Positive reinforcement can come from praise, affection, preferred food, play
and relief. Negative feedback may include interruption, stern vocal cues,
removal of access or guidance away, but cruelty is not the core mechanic.
Harsh treatment can produce fear, avoidance, reduced exploration or
defensive aggression.

### 5.6 Demonstration and joint attention

The player can point to an object, demonstrate an interaction or reveal a
cause-and-effect relationship. Joint attention is a cognitive bridge for
inferring reference. Creatures should eventually direct one another's
attention.

### 5.7 Attachment and separation

Attachment forms through predictable care, protection, warmth, interaction
and repeated positive outcomes. Separation responses depend on age,
independence, attachment, other relationships and past experience. Closing
the app must not automatically trigger exaggerated distress.

### 5.8 Relationship is multidimensional

Internal relationship state includes familiarity, trust, attachment, fear,
dependence, social reward, prediction confidence and negative memories. The
normal UI may translate these into readable descriptions while laboratory
mode exposes deeper values.

### 5.9 Creature-initiated interaction

The organism should sometimes bring an object, request food, invite play,
seek comfort, warn the player, demonstrate a discovery, lead the player
somewhere or introduce another creature.

### 5.10 Plasticity and mistakes

Incorrect teaching, unwanted rewards and frightening experiences can create
persistent associations and habits. Retraining, new experience, development
and changing relationships can gradually reshape behaviour.

### 5.11 Upbringing changes development

Enrichment, language, exploration, varied objects and social exposure can
influence cognitive development during sensitive periods. Upbringing is part
of brain development rather than an XP bonus.

## 6. Genetics, Reproduction, Heredity and Evolution

### 6.1 Genome scope

The fictional genome influences morphology, physiology, sensory capability,
neural development, learning parameters, immunity, ageing and reproduction.
It does not directly encode a finished personality. Genes influence
developmental conditions such as fear sensitivity, novelty response, social
reward sensitivity, learning rate, memory consolidation, attention and stress
response.

### 6.2 Developmental genome

The genome stores rules for building and developing the organism rather than
an exhaustive list of adult neural connections. It can influence sensory
architecture, neural region sizes, connection probability, growth timing,
plasticity, reinforcement sensitivity and memory parameters.

### 6.3 Fictional chromosome/module structure

Modules cover morphology and surface development; metabolism and growth;
sensory capabilities; neural development and plasticity; learning and memory
parameters; immune function and resilience; ageing and longevity; and
reproductive compatibility and developmental regulation. Pleiotropic-like
effects and regulatory interactions create trade-offs.

### 6.4 No universally best gene

Traits have context-dependent benefits and costs. Curiosity can increase
discovery and danger; fear can protect against predators while reducing
exploration; large brains can improve potential while increasing energy
requirements; and fast metabolism can support activity while increasing food
demand.

### 6.5 Reproduction

Reproduction uses fictional dual genomic contribution between compatible
creatures rather than human sex categories. Attraction, familiarity, social
compatibility and biological state influence whether reproduction occurs.

### 6.6 Recombination, dominance and expression

Offspring receive recombinant genetic material rather than averaged traits.
Siblings can differ substantially. Variants can behave dominantly,
recessively, additively or through regulatory interactions, and may appear at
particular ages or only in combinations.

### 6.7 Mutation

Mutation classes include small parameter variation, structural/developmental
mutations, morphological changes and regulatory mutations. Most are small;
rare major mutations can produce unusual sensory, vocal, morphological or
longevity characteristics. Mutations may be beneficial, harmful, neutral or
context-dependent.

### 6.8 Environment and phenotype

Adult phenotype emerges from genome plus developmental environment, nutrition,
health and experience. Developmental health can influence cognitive outcomes
without rewriting the genome.

### 6.9 Biological versus cultural inheritance

Learned memories are never directly inherited genetically. An offspring may
inherit smell sensitivity or cautious temperament, while a parent teaches the
specific association. Biological and cultural inheritance remain distinct.

### 6.10 Parenting and intergenerational effects

Parents provide food, protection, communication, demonstration, comfort and
environmental guidance. Parenting quality varies with personality, stress and
upbringing, producing intergenerational effects through social transmission.

### 6.11 Evolution and selection

Evolution arises because variation affects survival and reproduction under
environmental conditions. Selection follows simulated consequences, not
abstract evolution points.

### 6.12 Lineage and genetic history

Every organism has permanent genealogy. The lineage interface preserves
parentage, offspring, siblings, ancestry, mutations and inherited traits.
Advanced inspection shows generation, rare variants, parent-of-origin and
notable mutation events.

## 7. Social Intelligence, Families and Culture

### 7.1 Individual recognition

Creatures learn specific individuals through appearance, sound, smell-like
identity, interaction history and expectation. Social behaviour must not
operate only on a generic `OTHER_CREATURE` category.

### 7.2 Relationship dimensions

Directed relationships may contain familiarity, trust, affiliation,
attachment, fear, competitive tension, social reward, attraction, dominance
expectation, reliability and kin familiarity. These dimensions can conflict.

### 7.3 Friendship and partner choice

Friendship emerges from repeated positive interaction, mutual social reward,
sharing, play, protection and successful proximity. Creatures choose partners
using history and current needs rather than nearest-neighbour rules.

### 7.4 Social development

Newborn social behaviour begins with approach, follow, avoid, imitate, call
and seek comfort. Cooperation, sharing, teaching, reputation, mate
preference, conflict mediation and group coordination emerge later.

### 7.5 Observation and reputation

A creature can update its model of another after observing how that
individual treats someone else. Reputation emerges from social observation
and communication, not a global reputation stat.

### 7.6 Cooperation and sharing

Groups may share food, travel, warn, protect juveniles, teach and cooperate.
Sharing results from attachment, surplus, reciprocity expectation, parenting,
social reward or learned group practice; refusal can result from scarcity,
fear, hunger or prior theft.

### 7.7 Conflict, dominance and reconciliation

Competition may concern food, territory, shelter, partners, offspring,
status or objects. Displays and avoidance should often prevent escalation.
Fighting carries injury, energy, retaliation and social costs. Rigid
universal alpha hierarchies are not imposed.

### 7.8 Attraction and bonds

Attraction is separate from friendship and may depend on sensory preference,
familiarity, compatibility, health, social interaction, learned preference and
reproductive state.

### 7.9 Kin and parenting

The simulation knows genealogy, but kin recognition relies on familiarity,
sensory cues, shared upbringing and parental association rather than magical
knowledge of a family tree. Alloparenting is supported later.

### 7.10 Group formation and emergent roles

Groups arise from persistent beneficial relationships rather than a
create-clan menu. Roles such as scout, caregiver, teacher, leader or tool
specialist describe repeated behaviour and influence, not assigned classes.

### 7.11 Culture

Culture includes behaviour or information learned socially and transmitted
over time: vocabulary, tool use, routes, food preparation, parenting,
warning calls, shelter knowledge and rituals. Traditions can spread, mutate,
compete and disappear.

### 7.12 Innovation and cultural evolution

Curiosity, persistence, sensory ability, cognition, environment and chance
make innovation more likely in some individuals. Observation and imitation can
turn innovation into tradition.

### 7.13 Social loss

Grief-like behaviour emerges from attachment, failed expectation, searching
and memory rather than a hard-coded grief flag. Death can also teach
environmental or predator associations.

### 7.14 Social graph

The simulation maintains an inspectable social graph with multidimensional
relationship edges. Normal UI summarises it; laboratory mode exposes
interactions, memories and variables.

## 8. Health, Biology, Disease, Ageing and Death

### 8.1 Homeostasis

Health emerges from interacting systems: energy, hydration, body temperature,
nutrient stores, sleep pressure, stress, immune activation, pain, toxin load
and broad systemic stability. The UI may summarise health but the simulation
retains causes.

### 8.2 Energy, hunger and nutrition

Hunger perception is separate from energy reserves. Food is digested into
stores, activity consumes them, and prolonged deficit changes cognition and
can cause damage. Nutrition includes energy, structural nutrients,
micronutrient-like factors, hydration and toxins.

### 8.3 Metabolism and thermoregulation

Metabolic rate varies genetically and influences activity, food demand,
storage and resilience. Temperature depends on environment, metabolism,
activity and insulation. Creatures can learn thermoregulation such as seeking
shelter.

### 8.4 Sleep

Sleep supports recovery, memory consolidation, neural plasticity, stress
regulation, immunity and attention. Infants need more sleep; chronic
deprivation harms learning and health.

### 8.5 Stress

Stress responds to danger, pain, hunger, conflict, environmental extremes and
uncertainty. Short-term stress may improve vigilance; chronic stress harms
sleep, immunity, learning, social behaviour and lifespan.

### 8.6 Pain and localised injury

Pain is a learning signal and behavioural motivator, not merely lost hit
points. Broad body-region injury changes movement, perception or
communication as appropriate.

### 8.7 Healing and infection

Healing depends on age, genetics, nutrition, sleep, severity, infection and
condition. Disease arises through pathogens, contaminated resources,
environmental exposure, parasites or contact rather than arbitrary sickness
pop-ups.

### 8.8 Pathogens and immunity

Pathogens can have transmissibility, incubation, symptoms, severity, immune
escape and environmental persistence. Immunity is abstracted into baseline
strength, active response and acquired resistance.

### 8.9 Medical care

Treatments affect underlying conditions. They can become learned social
experiences, producing cooperation or fear depending on history.

### 8.10 Diagnosis and observable symptoms

Players diagnose through behaviour such as limping, lethargy, appetite
changes, abnormal sleep, vocal distress, temperature-seeking or withdrawal.
Care view provides summaries; laboratory mode provides deeper state.

### 8.11 Continuous ageing

Ageing changes regenerative ability, metabolism, stamina, sensory performance,
immunity, plasticity and recovery. Elders may learn more slowly while
retaining valuable knowledge.

### 8.12 Death and legacy

Death normally has an identifiable cause and contributing factors. Warning
signs and intervention opportunities should usually exist. The creature
remains present in genealogy, biography, discoveries, relationships and
cultural history.

### 8.13 Fairness

The game must never increase illness, danger or death because the player has
not opened the app or because monetisation seeks engagement. Offline biology
obeys the same causal rules as active simulation.

## 9. Core Gameplay Loop, Progression and Long-Term Motivation

### 9.1 Primary retention engine: anticipation

The reason to return is uncertainty about meaningful change: memory, danger
avoidance, friendship, habit, object use or teaching. The loop is experience
→ change → uncertainty → observation → new experience.

### 9.2 Core loop

Return, observe, notice change, interact or teach, allow consequences, observe
learning/biological/social change, form expectations, leave, allow history to
continue, and return.

### 9.3 Return behaviour

A creature may greet, continue activity, bring an object, request something
or ignore the player based on age, attachment, personality and current goals.

### 9.4 While You Were Away

Recaps summarise actual simulated events such as sleep, exploration, social
contact, learning, recovery, illness and discoveries. They are never
fabricated flavour text.

### 9.5 Living biography and milestones

Each organism develops a timeline of birth, recognition, words, exploration,
relationships, discoveries, offspring, illness and survival. Progression is a
biography becoming richer, not a numerical level.

### 9.6 Systemic progression

Progression is what the creature can genuinely do: navigate farther,
communicate, solve problems, care for offspring, survive harsher conditions
or teach others.

### 9.7 Multiple play styles

Companion play, exploration, genetics and lineage, laboratory study, social
and cultural observation, and habitat/environment experimentation are all
valid play styles.

### 9.8 Progressive complexity

The game reveals complexity as it becomes relevant: infant care first,
exploration and brain inspection later, social systems after multiple
creatures, and genetics and population systems once lineages exist.

### 9.9 Discovery and knowledge journal

Discoveries include foods, species, hazards, mutations, affordances,
behaviours and conventions. Player knowledge and creature knowledge remain
distinct.

### 9.10 Laboratory as gameplay

Advanced players can compare twins, inspect causal decisions, trace memories
and view developmental divergence. Scientific observation is an optional game
loop.

### 9.11 Genetic and lineage anticipation

Reproduction creates uncertainty through recombinant genetics and unknown
developmental history. Lineages carry traits, traditions, languages and
events across generations.

### 9.12 Culture as progression

At population scale, the question becomes what the population knows.
Traditions have value because they can be transmitted, altered or lost.

### 9.13 No coercive retention

No mandatory login streak, fabricated distress notification or daily chore
list belongs in the core experience. Notifications, if used, are tied to real
significant events.

### 9.14 Life Archive

The multi-year archive contains ancestors, family trees, biographies, extinct
branches, rare traits, discoveries, vocabulary, social networks and snapshots.

### 9.15 No conventional win state

Individual lives end, lineages continue, populations diverge and traditions
rise or disappear. The main mode is open-ended.

## 10. Visual Identity, Creature Art and Animation

### 10.1 Stylised 3D direction

The final target is stylised 3D because continuous genetics, growth,
proportion, appendage variation, resemblance and ageing need flexible
phenotype representation. Geometry remains mobile-friendly.

### 10.2 Species visual grammar

The species uses a coherent anatomical grammar rather than random part
assembly. Shared rules preserve recognisability while genetics changes
proportions, eyes, crests, tails, frills, markings and skin properties.

### 10.3 Genotype to phenotype

The genome influences body proportions, facial morphology, appendages,
surface patterns, colours and movement traits. Shared skeletal foundations,
procedural deformation and bounded blend shapes are candidate approaches.

### 10.4 Continuous visual ageing

Infants have appropriate proportions and uncertain movement; juveniles grow;
adults stabilise; elders show posture, movement and surface changes. Stages
must not feel like abrupt model swaps.

### 10.5 Visible heredity

Offspring show recognisable parental and ancestral landmarks so players can
see family resemblance without a data panel.

### 10.6 Surface genetics

Phenotype may vary pigmentation, pattern geometry, texture, translucency,
iridescence, roughness, covering and bioluminescent regions. Age, health and
stress may affect temporary expression.

### 10.7 Expression and body language

Eyes, posture, appendages, tail movement, breathing, locomotion, vocalisation
and bioluminescence communicate state. Anatomy and personality affect
expression.

### 10.8 State-driven animation

Animation blends consequences of internal state: fear affects posture,
fatigue stride, injury gait, curiosity orientation, age movement and
attachment approach. Animation is not the source of behaviour.

### 10.9 Touch and camera

iPhone interaction should feel physical: touch, stroke, point, select and
manipulate. The primary view is a third-person habitat with pan, zoom and
rotate, plus companion and laboratory inspection modes.

### 10.10 World art direction

The world is alien, organic and readable. Visual cues support causal learning
about temperature, danger, illness, damage and interactive properties.

### 10.11 UI visual separation

Normal play is organic and immersive. Laboratory views may use translucent
biological and neural visualisations; scientific depth appears on demand.

### 10.12 Performance-aware presentation

Simulation and rendering complexity remain separate. Nearby individuals can
render at high detail while distant populations use level of detail, culling
and reduced effects.

### 10.13 Art provenance

Exploration tools may assist concept generation, but the commercial product
requires an original controlled art bible, species grammar and final asset
pipeline.

## 11. Sound, Voice, Language and Communication

### 11.1 Innate communication

Newborns possess genetically influenced primitive vocalisations for distress,
contact, comfort, alarm, curiosity and pain. These are biological signals,
not English words.

### 11.2 Individual voice

Pitch, resonance, rhythm, articulation, tonal range, vocal tract morphology
and duration vary genetically and with development, health and age.

### 11.3 Human language is learned

Speech recognition identifies what was said and who spoke; it must not inject
semantic meaning. The brain infers meaning through context, repetition and
consequence.

### 11.4 Concepts precede symbols

A concept can exist before a word. Player words, invented vocalisations and
gestures can attach to the same representation.

### 11.5 Graded comprehension and production

Associations have confidence and may overgeneralise. Comprehension and
production develop separately.

### 11.6 Development toward combinations

Communication may progress from raw vocalisation to symbols and later simple
combinations. Human grammar is not the only hard-coded structure.

### 11.7 Signal invention and culture

Creatures can produce novel signals. If others learn and reuse them,
conventions spread. Origin, association, users and generation span should be
tracked; dialects can drift.

### 11.8 Multimodal communication

Voice, posture, gesture, touch, orientation and bioluminescent patterns may
carry communication. Physiological signals can become deliberate cultural
signals.

### 11.9 Speaker recognition

Meaning depends partly on speaker identity. Commands from an owner and
stranger can carry different weights.

### 11.10 Environmental sound

Water, weather, predators, movement, objects and other species are sensory
signals. Creatures can learn predictive sound associations.

### 11.11 Communication failure

Young organisms, strangers and different dialect populations sometimes fail
to communicate. Learning across the gap creates social development.

### 11.12 Audio presentation and accessibility

Music remains restrained so environmental and creature audio carry
information. Critical sound information receives visual or haptic equivalents.

### 11.13 No language-model brain

The organism is not an LLM, chatbot or personality prompt. Communication
derives from concepts, learned symbols, memory, social context and vocal
capability. A language model may later assist optional player-facing
explanation or accessibility only; it must never manufacture cognition or
decisions.

## 12. UI/UX, Onboarding and Accessibility

### 12.1 Main world view

Opening the app should feel like looking into a world already living. The
habitat and creatures, not a dashboard, are primary.

### 12.2 Minimal persistent HUD

Permanent statistics remain minimal. Severe or immediately relevant problems
can surface while normal state is communicated through behaviour and optional
inspection.

### 12.3 Layered interface model

- **Home:** living environment and direct interaction.
- **Creature/Life:** name, age, stage, biography, relationships, vocabulary
  and milestones.
- **Care:** health, nutrition, hydration, sleep, injury and illness.
- **Laboratory:** brain, memory, genetics, detailed biology, causal history
  and experiments.
- **Lineage/Society:** genealogy, offspring, social graph, population traits,
  culture and history.

### 12.4 Progressive disclosure

Features appear as relevant. Genetic, social and cultural interfaces become
meaningful as the creature matures and the lineage expands.

### 12.5 Onboarding through the first life

Hatching, hunger, feeding, naming, pointing and teaching introduce mechanics
in context. The game teaches observation before numerical inspection.

### 12.6 Contextual touch interaction

Tap, hold, drag, pinch and camera gestures map to understandable physical
actions. Alternatives exist for players who cannot perform precise gestures.

### 12.7 Voice UX

Voice should feel like speaking to the creature, not operating a command
menu. Recognition confidence is diagnostic, not ordinary-play UI.

### 12.8 Ambiguous but legible feedback

Normal play avoids constant numeric relationship changes. The creature
relaxes, approaches, avoids or vocalises; laboratory screens can explain.

### 12.9 The Why feature

“Why did it do that?” reads recorded causal telemetry. A simple view may
describe an activated memory; an advanced view traces perception, memory,
drive and action competition. Explanations are never invented after the fact.

### 12.10 Brain and genetics viewers

Simple brain view shows focus, needs, memories and likely action. Laboratory
mode can pause or slow simulation and inspect regions, connections, retrieval,
plasticity and genetics.

### 12.11 Biography, Life Moments and recap

Birth, first word, exploration, mutation, offspring, relationships and
discoveries may become timeline events, images or replays. Recaps use an
importance system to avoid routine-event floods.

### 12.12 Accessibility

Support scalable text, high contrast, colour-safe encoding, captions and
visual sound indicators, directional cues, reduced motion, larger targets,
alternative interaction and simplified interfaces. Accessibility presents
existing information differently without revealing hidden truth.

### 12.13 Time controls and sandbox

The canonical world stays close to meaningful real-time pacing. Laboratory
experiments may pause and accelerate. A separate sandbox can duplicate
genomes and environments without risking the canonical lineage.

### 12.14 Save UX and death presentation

Autosave is invisible. Death is the end of an individual life, not GAME OVER:
age, cause, family, biography and legacy move into the archive.

### 12.15 First launch

First launch is an egg or incubation form, hatching, observation, naming and
care. There is no personality creator or complex stat allocation.

## 13. Save Systems, Persistence, Offline Simulation and Performance

### 13.1 Canonical simulation state

One authoritative world representation contains creatures, biology, brains,
memories, genetics, relationships, environment and time. UI observes state;
UI state never becomes biological truth.

### 13.2 Interface-independent simulation engine

The engine runs independently of rendering for the game, tests, offline
catch-up, development tools and potential future server use.

### 13.3 Explicit time

World time stores last-save and last-active information. Creature age does
not depend only on device calendar subtraction.

### 13.4 Seeded randomness and reproducibility

All stochastic systems use a controlled RNG with saved state for mutation,
action variability, disease, environment and reproduction.

### 13.5 Persistence layers

Persistence is layered into current state, important long-term history,
high-resolution recent telemetry and aggregated older history. Every
micro-event is not retained forever.

### 13.6 Snapshot plus event history

Periodic validated snapshots combine with important events since the last
snapshot. Recovery loads the latest valid snapshot and replays valid events;
full enterprise event sourcing is unnecessary.

### 13.7 Transactional autosave and recovery

Saves write a candidate checkpoint, validate it, mark it authoritative and
retain the previous valid checkpoint temporarily. Failed validation falls
back automatically.

### 13.8 Schema versioning and migrations

World, creature, brain, genome and memory schemas are versioned from the
beginning. Updates include migration functions and old-save tests.

### 13.9 Permanent identity

Creatures, worlds, memories, relationships, objects, players and populations
use permanent unique IDs. Display names are not identity.

### 13.10 Compact neural and genome storage

The genome stores developmental instructions. Mature neural state may become
large, so sparse connectivity, compact indices, typed arrays and binary
serialization may be introduced after profiling.

### 13.11 Multi-rate simulation

Rendering, motor control, perception, decision-making, metabolism, immunity,
ecology and ageing need not update at the same frequency.

### 13.12 Simulation fidelity tiers

Focused creatures receive highest fidelity, nearby organisms normal fidelity,
remote creatures reduced frequency and far/offline populations event-driven
or aggregated simulation. Biological rules remain consistent.

### 13.13 Offline catch-up

On reopening, elapsed world time advances using adaptive temporal resolution:
safe sleep in large steps, interesting events at higher fidelity. Long
absences must not require impractical catch-up screens.

### 13.14 Memory boundedness

Working memory is transient, episodic memory selective, and semantic,
spatial and social knowledge consolidated. Older history is compressed.

### 13.15 Population and ecology scaling

Computational attention follows gameplay importance. Detailed agents,
simplified agents, resource models and statistical pathogen models may coexist.

### 13.16 Mobile baseline and profiling

iPhone-class hardware is the baseline. Profile frame time, simulation time,
memory, save size, battery, thermal behaviour and catch-up duration early.

### 13.17 Worker isolation and optimisation discipline

Expensive simulation may eventually be isolated from UI rendering through
workers. TypeScript and clear algorithms come first. WebGPU, WASM or
lower-level rewrites require measured bottlenecks.

### 13.18 Local-first then cloud backup

Early versions are local-first and offline. Commercial long-lived worlds may
later add encrypted cloud backup and multi-device support. Synchronisation
uses a single authoritative timeline.

### 13.19 Validation, replay and stress testing

Loads validate references, parentage, schema, neural indices and monotonic
time. Developers can capture reproductions from snapshot, seed, inputs and
interval. Synthetic worlds expose leaks, population explosions, save growth
and numerical drift.

### 13.20 Telemetry and causal explanation

Optional diagnostic records contain perception, internal state, retrieved
memory, candidate actions, selected action and stochastic contribution. The
Why interface reads this record.

## 14. Multiplayer, Shared Worlds and Cross-Population Interaction

Multiplayer comes after a convincing single-player loop, stable persistence,
social learning and cultural systems. The first online feature should be
trusted, controlled creature visits, not public worlds. Foreign creatures
remain strangers with their own languages and histories; understanding is
learned, not automatically translated.

Visitors may introduce tool behaviours, food knowledge, routes, warnings,
parenting practices or social conventions. Cross-player reproduction requires
owner permission and creature-level compatibility/agency, with explicit
offspring ownership. Protection from griefing, biosecurity, asynchronous-first
networking and a server-authority boundary are required before shared
simulation.

Public chat, a creature marketplace, public ecosystems and large-scale global
cultural divergence are not early multiplayer goals.

## 15. Monetisation, Ethics, IP and Commercial Strategy

### 15.1 Preferred business model

Creature Life should be a premium artificial-life product: a paid core game
or meaningful free introduction followed by one permanent full-game unlock.
Substantial expansions are preferable to consumable microtransactions.

### 15.2 Core ownership

The purchased core includes fundamental single-player raising, learning,
biology, genetics, reproduction, ageing, lineage, exploration, culture and
laboratory systems. A long-raised creature must not become hostage to payment.

### 15.3 Legitimate recurring services

Recurring payment, if used, funds genuine infrastructure such as encrypted
cloud history, cross-device services or advanced multiplayer. Offline/core
play continues if service ends.

### 15.4 Forbidden monetisation patterns

Do not sell resurrection at emotional loss, medicine/food required for
survival, intelligence/longevity/fertility/mutation chance, mystery eggs or
premium traits. Do not use ads inside the world, artificial illness or
distress, or subscription punishment.

### 15.5 Cosmetics and expansions

Cosmetics must not break genetic meaning. Habitat themes, decorative objects
and photo presentation are safer; meaningful ecosystem expansions are the
strongest extension.

### 15.6 Respectful engagement ethics

No login streak, fake distress, fabricated messages or hidden behavioural
experiments should exploit attachment. Analytics must not secretly alter
biology or mortality.

### 15.7 Privacy

Voice and behavioural history require privacy discipline. Process locally
where practical and store derived learning signals rather than raw recordings
unless a justified, consented feature requires them.

### 15.8 Audience and age positioning

Death, reproduction, disease, voice input and online contact require deliberate
audience, age, privacy and moderation review.

### 15.9 Truthful AI marketing

Marketing describes demonstrable mechanisms and must not claim consciousness,
sentience or scientific validity that cannot be established.

### 15.10–15.13 IP, terminology, provenance and differentiation

Creature Life uses original branding, terminology, creatures, artwork,
world-building, code, biology, neural architecture, UI, lore and audio.
Production code uses neutral terms such as Creature or Organism. Maintain
provenance for code, art, music, sound, writing, fonts, libraries and
AI-assisted assets. The differentiators are persistent development, real
learning, embodied biology, developmental genetics, relationships,
communication, brain inspection and lineage history.

## 16. Production Roadmap, Testing and Definition of Launch

### 16.1 Vision versus Version 1.0

The long-term vision is broader than Version 1.0. Version 1.0 deliberately
proves developing organisms, learning, memory, relationships, genetics,
reproduction, a meaningful world, embodied biology, player teaching, lineage
and persistence.

### 16.2 Phase 0: project constitution

GDD v1.0, the technical architecture specification, AGENTS governance,
original terminology/IP rules, determinism/persistence/coding standards,
milestone acceptance criteria and ADRs form the project constitution.

### 16.3 M1: smallest believable organism

One creature, one food object and a tiny world. Energy/hunger, primitive
perception, a minimal adaptive brain, movement, eating and reinforcement must
form a measurable learning loop. A direct hungry-plus-visible-food movement
shortcut fails the milestone.

### 16.4 M1 experimental proof

A trained creature is compared with an equivalent control whose learning is
disabled or experience withheld. Food-seeking improvement must come from
internal state change, not authored animation.

### 16.5–16.8 Milestone roadmap

- **M2:** embodied drives: thirst, fatigue, curiosity, safety and choices.
- **M3:** general learning: food, danger, location, sound and
  action-consequence associations.
- **M4:** working, episodic, semantic and spatial memory.
- **M5:** development: infant, juvenile and adult differences.
- **M6:** habitat: resources, water, shelter, obstacles and cycles.
- **M7:** player teaching, identity, words, trust and attachment.
- **M8:** multiple creatures, recognition, social memory and relationships.
- **M9:** social learning demonstrated against a control.
- **M10:** genetics, recombination, mutation and heredity.
- **M11:** cultural transmission across individuals and generations.
- **M12:** nutrition, temperature, sleep, injury, immunity, disease and ageing.
- **M13:** stylised 3D, phenotype, animation, audio, touch UI and brain viewer.
- **M14:** offline catch-up, recovery, long synthetic worlds and genealogies.
- **M15:** mobile optimisation, packaging, accessibility and App Store
  readiness.

Multiplayer follows the single-player foundation.

### 16.9–16.12 Version 1.0 and vertical slice

Version 1.0 should include a genuinely developing organism with perception,
memory, learning, preferences and a player relationship; multiple creatures
with recognition and social learning; genetics, reproduction and lineage; a
meaningful habitat; enough biology for food, sleep, health, ageing and
mortality; touch, teaching, basic language, biography, lineage, offline
continuity and causal brain inspection.

The vertical slice should demonstrate hatching, player identity, two arbitrary
words, food preference, a frightening memory, exploration, a relationship,
adulthood, reproduction and offspring that resemble parents while developing
differently.

### 16.13 Definition of Done

A system is implemented, tested, observable and explainable. Memory is done
when it forms, can later be retrieved, measurably changes behaviour, emits
diagnostic evidence and passes automated tests.

### 16.14 Emergence test protocol

1. Define target behaviour precisely.
2. Measure a naive baseline.
3. Provide experience or training.
4. Retest comparably.
5. Compare with a control lacking the experience/system.
6. Inspect which memory, weights or state changed.
7. Test reversal or extinction.

### 16.15 Ablation and twin tests

Disable systems one at a time and measure which capabilities disappear. Run
identical genomes through different lives to quantify nurture, and different
genomes through similar lives to quantify heredity.

### 16.16 Benchmark suite

Benchmarks cover food association and reversal, delayed retention,
navigation/resource memory, affordance learning, social recognition,
imitation, arbitrary language association and flexibility under changed
conditions. Holdout environments prevent optimisation only for known tests.

### 16.17 Long-duration and chaos tests

Accelerated lifetimes monitor neural growth, pruning, memory, retrieval,
drive stability, behaviour diversity and computation. Stress cases include
unusual resources, changing environments, sensory loss, conflicting commands,
social density and unexpected objects. Invariants catch invalid age,
parentage, references, dead-creature actions and neural indices.

### 16.18 AI coding-agent governance

Coding agents work milestone by milestone with bounded authority. Tasks
specify objectives, files, constraints, tests, forbidden shortcuts and
approval boundaries. Major architecture changes require written proposals
with alternatives, trade-offs and migration impact.

### 16.19 Human playtesting

Testers should describe a creature without discussing appearance, predict what
it will do, and describe caution, habits, trust, favourite places and quirks.
The target is behaviour that is understandable but occasionally surprising.

### 16.20–16.23 Alpha, beta, launch and post-launch

Canonical long-lived lineages begin only when persistence and migration are
reliable. Version 1.0 must demonstrate life, agency, causality, individuality
and anticipation. Radical intelligence experiments stay in experimental
branches/worlds until safe migration is demonstrated; existing brains are
not silently replaced.

## Appendix A — Technical Architecture Guardrails

The creature is not an LLM, chatbot, personality prompt or conventional
hard-coded state machine. The simulation is independent of React/UI and
headless-testable. One canonical state is authoritative. Randomness is
seeded; learning, memory, biology and social systems are serialisable and
inspectable; explanations read real telemetry; special cases do not replace
missing capabilities; sparse meaningful connectivity is preferred; genomes
encode developmental rules rather than memories; rendering and simulation
frequencies are separate; offline catch-up preserves causal rules; schemas
are versioned and migrated; multiplayer is not an early dependency; and
monetisation cannot change biology or neural quality.

The early direction is React + TypeScript with Vite for a mobile-first
web/PWA shell, Canvas or equivalent lightweight rendering, an
interface-independent TypeScript engine, IndexedDB/local persistence, GitHub
source control and hosted web deployment. Native iOS packaging may follow.

### Core simulation tick order

1. Update relevant environmental state.
2. Advance biology and metabolism at the appropriate frequency.
3. Generate external and internal sensory input.
4. Process neural activation and associative state.
5. Update drives, motivations and candidate goals.
6. Compete/select an action.
7. Execute action through body/world systems.
8. Resolve interactions and consequences.
9. Calculate reward, discomfort or prediction error.
10. Apply learning and plasticity.
11. Emit debug/causal telemetry.
12. Persist or checkpoint according to policy.

## Appendix B — M1 Acceptance Test

M1 proves the smallest end-to-end artificial-life loop: one creature, one
edible object, a tiny traversable environment and minimal visualisation.
Required state includes energy/hunger, primitive perception, a small adaptive
network, candidate action competition, movement, eating and reinforcement.

The required sequence is:

```text
food is perceivable
  -> hunger changes motivational activation
  -> connection processing changes candidate strength
  -> food-seeking action is selected
  -> movement occurs
  -> eating changes hunger/energy
  -> positive consequence is computed
  -> an adaptive connection changes
  -> later food-seeking differs measurably from a control
```

Forbidden shortcuts include direct hungry-plus-visible-food movement,
unearned hidden semantic knowledge, UI control of biological truth, random
behaviour presented as learning, and LLM-generated action decisions.

## Appendix C — Locked Project Principles

1. Raised, not configured: the player creates conditions, not a finished
   personality.
2. Embodied intelligence: the body continuously shapes the mind.
3. Learned meaning: words, objects, dangers and expectations are acquired.
4. Causal emergence: fix missing capabilities rather than script outcomes.
5. Nature plus nurture: genes create possibilities; experience expresses them.
6. Persistent history: lives, families, memories and discoveries persist.
7. Coherent surprise: unexpected behaviour is understandable afterward.
8. Respectful engagement: curiosity, not absence punishment, brings players
   back.
9. The environment exists independently, but creatures know it through
   perception, experience, memory and social information.
10. Children inherit possibilities, not parents' lives.
11. A population can eventually know what no individual was born knowing.
12. The default interface shows life; the laboratory shows machinery.
13. Closing the app pauses computation, not history.
14. Multiplayer connects histories without homogenising them.
15. Never charge because a player fears death; money may expand the world, not
   improve the organism.
16. Earn complexity. Emergence must be measurable, not merely believable.

## Appendix D — Version 1.0 Scope Boundary

### Required for 1.0

Developing creature with sensory input, body state, adaptive learning and
memory; player recognition, teaching and relationship history; multiple
creatures with social recognition and basic social learning; genetics,
recombination, inherited variation, reproduction and lineage; a meaningful
home habitat and exploration; food, hydration, sleep, health, ageing and
mortality; basic learned communication; biography, Life Archive, While You
Were Away and causal inspection; reliable local persistence, offline
catch-up, migrations/recovery and mobile performance.

### Designed for later, not required to launch

Large public multiplayer ecosystems, civilisation-scale tool chains,
human-level grammar, hundreds of high-fidelity visible creatures, complex
global disease ecology, a massive open procedural planet, long-range public
migration, large-scale cultural evolution and an advanced research sandbox.

## Appendix E — Deferred Decisions

The final species name and biology/lore; exact commercial price and
introduction model; cloud-service pricing; final renderer and 3D pipeline;
exact brain units/topology/update frequencies; genome encoding and mutation
rates; lifespan and reproductive timing; technical emergency recovery rules;
age rating and demographic positioning; multiplayer offspring ownership and
public-world architecture; platform speech-recognition/privacy model; and
final trademark, logo, brand system and legal clearance all require prototype
evidence, research or specialist review.

## Appendix F — Glossary

- **Artificial life (ALife):** A computational system where organism-like
  behaviour, adaptation, development or evolution arises from simulated
  processes.
- **Canonical state:** The single authoritative current representation.
- **Coherent surprise:** Unexpected behaviour understandable from inspected
  causes and history.
- **Cultural inheritance:** Knowledge or behaviour transmitted socially rather
  than genetically.
- **Drive:** An internal motivational pressure influenced by biological or
  psychological state.
- **Episodic memory:** A representation of a particular significant
  experience.
- **Genotype:** Heritable encoded genetic/developmental information.
- **Phenotype:** Expressed body and biological characteristics from genotype
  plus development/environment.
- **Homeostasis:** Regulation of internal physiological variables within
  viable ranges.
- **Joint attention:** Shared attention to an object or event used in teaching.
- **Neural plasticity:** Adaptive strengthening, weakening, creation or
  removal of connections.
- **Offline catch-up:** Efficient advancement of history after computation was
  suspended.
- **Social graph:** Network of individual-specific relationships.
- **Structural plasticity:** Change in network structure, not only weight.
- **World model:** Learned predictive representation of likely consequences.
- **Vertical slice:** A small end-to-end experience proving the core loop.

## Appendix G — Immediate Next Steps

1. Treat this GDD v1.0 as product-level source of truth.
2. Rename retired repository-facing terminology to Creature Life or neutral
   Creature terminology before substantive development.
3. Keep AGENTS.md aligned with the locked design and anti-shortcut principles.
4. Review the Technical Handoff against this GDD.
5. Define M1 with files, tests, telemetry and a control experiment.
6. Have Codex review architecture before large implementation.
7. Implement and validate M1 before expanding scope.

**End of Creature Life Game Design Document v1.0.**