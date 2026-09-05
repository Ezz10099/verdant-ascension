# Verdant Ascension — Project Memory

This file is the permanent source of truth for the project's design, decisions, development direction, and important research. Chat discussion is temporary working space; confirmed information should be recorded here.

---

## 1. Project Identity

**Working title:** Verdant Ascension  
**Repository:** `Ezz10099/verdant-ascension`

Verdant Ascension is a strategy game centered on plants that fight, consume value from weaker plant life, grow stronger, and eventually evolve into increasingly larger forms.

The game begins at an extremely small scale with a tiny green grass plant. Progression eventually reaches gigantic real-world plants and trees, then continues beyond reality into fictional and science-fiction plant forms.

---

## 2. Development Environment

- Development is intended to be completed entirely from a phone.
- SPCK Editor is used on the phone to edit/test the game.
- SPCK is connected to GitHub.
- GitHub is the permanent repository and source of truth.
- ChatGPT is connected to GitHub and may directly help maintain the codebase and this project document.
- The game will be built as a web game so it can be developed and tested easily in this workflow.
- Prefer a lightweight codebase and avoid unnecessary tooling or build steps unless the project later requires them.

---

## 3. Core Game Concept — Confirmed

- The game is about **combat between plant life**.
- It is not a farming economy simulator.
- It should remain simple to understand rather than becoming overloaded with systems.
- The player begins with the weakest form: **small green grass**.
- Plants have strength and can have values such as health.
- Stronger plant growth can overwhelm weaker growth.
- When stronger plant life defeats weaker plant life, it can consume/take its value.
- Accumulated value contributes toward becoming stronger and eventually upgrading/evolving.
- Progression moves through many increasingly large plant forms.
- The progression is inspired by **real-world plant size and visual scale**, not literal biological evolution.
- The realistic portion of progression should use researched real plants ordered approximately by size, mass, and visual presence.
- After the realistic range is exhausted, progression may continue into original fictional and science-fiction plants.
- The game is allowed to be unrealistic where that makes it more fun. Internal game logic matters more than botanical realism.

---

## 4. Design Principles — Confirmed

1. **Simple core, long progression.** Easy to understand, but capable of supporting a very long journey through plant forms.
2. **Plants are the combatants.** Avoid turning the design into soldiers, farmers, markets, workers, or conventional armies unless a future decision explicitly changes this.
3. **Growth should feel visible.** Each major upgrade should look noticeably larger or more impressive than what came before it.
4. **Real before fictional.** Use real plant inspiration for a substantial early/middle progression, then transition naturally into fantasy and science-fiction scale.
5. **Research before locking progression.** Real-world plants and their dimensions should be checked before permanently placing them in the progression tree.
6. **Phone-first development.** Controls, UI, performance, and project structure should remain practical for development and play on a phone.
7. **Do not add complexity merely for realism.** Mechanics should earn their place by improving the game.

---

## 5. Progression Structure

### Confirmed endpoints/concepts

- Starting tier: **small green grass**.
- Real-world progression should contain many stages, not merely a short chain such as grass → shrub → tree.
- Very large real trees such as giant sequoias and coast redwoods belong near the upper end of the realistic progression.
- The realistic upper end is **not** the end of the entire game.
- Fictional forms continue beyond the largest realistic plants.

### Early research candidates — NOT YET LOCKED

These are scale references from early discussion. Exact order, inclusion, names, and stats are provisional:

- small grass — centimeters
- taller grasses
- wheat — roughly 0.85–1.5 m depending on variety
- oats — can approach roughly 1.8 m
- sunflower — commonly around 2 m, with variation
- sorghum — some forms can reach several meters
- sugarcane — roughly 3–6 m
- papyrus / giant reed-type plants — several meters
- tree ferns — trunks around 10 m in some species, depending on species
- giant banana plants — some species can reach around 15 m
- giant bamboo — some species exceed 20 m
- baobab — large trees around tens of meters with enormous trunk mass
- giant sequoia — among the most massive individual trees on Earth
- coast redwood — the tallest living tree species, exceeding 100 m in exceptional individuals

Height alone will not determine power. Width, mass, density, visual scale, and gameplay feel may also influence progression placement.

---

## 6. Combat / Growth — Current Direction

Directionally agreed, but exact numbers/formulas are not locked:

- A plant/unit may have health or similar durability.
- Stronger plant growth can damage or collapse weaker plant growth.
- Defeated plant growth contributes value to the winner.
- Gaining enough value allows a plant to become stronger and eventually upgrade.
- Core loop direction:

**spread → fight → consume value → strengthen → evolve → face larger growth**

Exact attack rules, spreading rules, upgrade costs, and whether combat is turn-based or continuous are still undecided.

---

## 7. Rejected Directions

- Farming economy centered on planting crops and selling them for money.
- Complex markets, transport, wages, taxes, loans, fertility management, or similar simulation-heavy economics.
- Copying Antiyoy's territory/combat system directly.
- A short simplistic progression where grass immediately becomes shrubs, then trees, then a giant forest.

Antiyoy helped inspire the desire for a simple strategy game with substantial depth, but Verdant Ascension should develop its own combat and progression logic.

---

## 8. Technical Direction

### Confirmed

- Web technology is preferred for the phone + SPCK + GitHub workflow.
- Interface must be touch-friendly and responsive.
- Avoid unnecessary dependencies in the early prototype.

### Initial technical choice

The first prototype uses plain HTML, CSS, JavaScript, and an HTML Canvas. This minimizes setup and lets SPCK run it immediately.

This is a technical starting point, not a permanent restriction.

---

## 9. Current Development Milestone

### Milestone 0 — Mobile Hex Foundation

Goal: prove that the basic map, rendering, and touch interaction work comfortably on the phone before implementing permanent combat rules.

Prototype requirements:

- responsive hexagonal map
- starting small-grass tile
- touch/tap input
- spread starter grass into adjacent empty hexes as a **technical interaction test**
- reset button
- tile counter

**Important:** tapping adjacent tiles to spread grass is not yet a confirmed final gameplay rule.

### Next design milestone

Define the smallest complete combat loop for **small green grass vs. other weak plant growth**, then implement it without adding unrelated systems.

---

## 10. Decision Log

### 2026-09-05

- Chosen working project name: **Verdant Ascension**.
- GitHub will store permanent project memory and code.
- Use one master project/design file with sections instead of many separate planning files.
- Confirmed that the game centers on fighting and evolving plant life.
- Confirmed small green grass as the starting form.
- Confirmed that real-world plant research will inform a long size-based progression.
- Confirmed that fictional/science-fiction plants may extend progression beyond real-world limits.
- Rejected the farming-market/economy direction.
- Began actual development with a lightweight mobile web prototype.

---

## 11. Open Design Questions

These are not decisions yet:

- Is the game turn-based, real-time, or something in between?
- Exactly how does one plant attack or consume another?
- Does one hex contain one individual plant, a patch/field, or either depending on scale?
- How is evolution triggered and where does the evolved form appear?
- Will progression branch into multiple plants at each tier or mostly follow one main path?
- How large should the map become as plant scale increases?
- How should enormous late-game plants interact with the same map used by tiny grass?

---

## 12. Maintenance Rule

Whenever a meaningful game-design or technical decision is confirmed, update this file. If an idea is only being explored, keep it marked provisional or under open questions rather than presenting it as final.
