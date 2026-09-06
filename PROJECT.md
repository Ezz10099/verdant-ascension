# Verdant Ascension — Project Memory

This file is the permanent source of truth for the project's design, decisions, development direction, and important research. Chat discussion is temporary working space; confirmed information should be recorded here.

---

## 1. Project Identity

**Working title:** Verdant Ascension  
**Repository:** `Ezz10099/verdant-ascension`

Verdant Ascension is a strategy game centered on plant life that fights, consumes value from weaker growth, becomes stronger, and eventually evolves into increasingly larger forms.

The game begins at an extremely small scale with tiny green grass. Progression eventually reaches gigantic real-world plants and trees, then continues beyond reality into fictional and science-fiction plant forms.

---

## 2. Development Environment

- Development is intended to be completed entirely from a phone.
- SPCK Editor is used on the phone to edit and test the game.
- SPCK is connected to GitHub.
- GitHub is the permanent repository and source of truth.
- ChatGPT is connected to GitHub and may directly maintain the codebase and this project document.
- The game is built as a web game so it can be developed and tested easily in this workflow.
- Prefer a lightweight codebase and avoid unnecessary tooling or build steps unless the project later requires them.

---

## 3. Core Game Concept — Confirmed

- The game is about **combat between plant life**.
- It is **not** a farming economy simulator.
- It should remain simple to understand rather than becoming overloaded with systems.
- The player begins with the weakest form: **small green grass**.
- Plants can have strength, health, growth, or similar combat values.
- Stronger plant growth can overwhelm weaker growth.
- When stronger plant life defeats weaker plant life, it can consume or take its value.
- Accumulated value contributes toward becoming stronger and eventually upgrading / evolving.
- Progression moves through many increasingly large plant forms.
- Progression is inspired by **real-world plant size and visual scale**, not literal biological evolution.
- The realistic portion of progression should use researched real plants ordered approximately by size, mass, and visual presence.
- After the realistic range is exhausted, progression may continue into original fictional and science-fiction plants.
- The game is allowed to be unrealistic where that makes it more fun. Internal game logic matters more than botanical realism.

---

## 4. Design Principles — Confirmed

1. **Simple core, long progression.** Easy to understand, but capable of supporting a very long journey through plant forms.
2. **Plants are the combatants.** Avoid turning the design into soldiers, farmers, markets, workers, or conventional armies unless a future decision explicitly changes this.
3. **Growth should feel visible.** Each major upgrade should look noticeably larger or more impressive than what came before it.
4. **Real before fictional.** Use real plant inspiration for a substantial early / middle progression, then transition naturally into fantasy and science-fiction scale.
5. **Research before locking progression.** Real-world plants and their dimensions should be checked before permanently placing them in the progression tree.
6. **Phone-first development.** Controls, UI, performance, and project structure should remain practical for development and play on a phone.
7. **Do not add complexity merely for realism.** Mechanics should earn their place by improving the game.
8. **The battlefield should look alive.** Movement, growth, impact, and evolution should be visually readable rather than represented only by static board pieces.
9. **The battlefield is the focus.** HUD and instructions should stay compact and should not cover large parts of the phone screen.
10. **Avoid token-like presentation.** Plant areas should resemble living vegetation, not circular buttons, coins, or generic board-game pieces.

---

## 5. Progression Structure

### Confirmed endpoints / concepts

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

### Prototype-only plant tiers

The current prototype temporarily uses these names to test upgrades and visuals:

1. Small Grass
2. Tall Grass
3. Wheat Patch
4. Reed Bundle
5. Sugar Cane
6. Giant Bamboo

These are **not** the finalized progression tree.

---

## 6. Combat / Growth — Current Direction

The exact final combat formula is still provisional, but the current direction is:

- Friendly plant growth generates growth value over time.
- A player can select one of their plant growth areas.
- Growth can be sent toward a connected neighboring area.
- Sent growth damages hostile or wild growth.
- If the target is reduced below zero, ownership changes to the attacker.
- Growth can also be invested into upgrading the selected plant to a stronger stage.
- Defeating and absorbing weaker growth remains central to long-term progression.

Core loop direction:

**grow → attack → consume / capture → strengthen → evolve → face larger growth**

The current numeric values, regeneration rates, attack ratios, upgrade costs, and enemy AI behavior are prototype tuning and are not permanent rules yet.

---

## 7. Presentation Direction — Confirmed

### Hexagon presentation rejected

The original hexagonal-board presentation is no longer the intended visual direction.

Verdant Ascension should not visually feel like a conventional hex-board strategy game.

### Circular / token-like presentation also rejected

The first non-hex redesign still placed each plant inside a permanent circular ring and surrounded the battlefield with large information panels. In practice this still looked like board-game tokens rather than living vegetation and covered too much of the phone screen.

That presentation is also rejected.

### Current presentation

The current prototype uses a **full-screen living battlefield** with irregular vegetation patches.

Presentation goals now are:

- irregular ground / vegetation shapes instead of geometric tiles or permanent circles
- plants should visually emerge from each patch rather than sit inside an icon
- root connections stay mostly hidden and appear when a selected plant can interact with nearby growth
- selection is shown through a subtle animated outline and growth bar, not a large permanent ring
- plant types have visibly different silhouettes
- animated plant swaying
- vine / tendril attacks that visibly grow toward the target
- leaf / spore impact effects and capture blooms
- ambient floating spores and subtle environmental movement
- a compact translucent top bar rather than large stacked HUD cards
- a compact bottom selection / evolution dock
- maximum usable screen area for the actual battlefield

The current root-connected topology remains a **prototype mechanic**, not a permanently confirmed final map structure. The visual goal is natural, alive, and continuous even while the underlying prototype uses discrete interaction points.

---

## 8. Rejected Directions

- Farming economy centered on planting crops and selling them for money.
- Complex markets, transport, wages, taxes, loans, fertility management, or similar simulation-heavy economics.
- Copying Antiyoy's territory / combat system directly.
- Hexagonal tiles as the main presentation.
- Permanent circular plant tokens / button-like growth plots as the main presentation.
- Large HUD cards that cover a major portion of the battlefield on mobile.
- A short simplistic progression where grass immediately becomes shrubs, then trees, then a giant forest.

Antiyoy helped inspire the desire for a simple strategy game with substantial depth, but Verdant Ascension should develop its own combat, presentation, and progression logic.

---

## 9. Technical Direction

### Confirmed

- Web technology is preferred for the phone + SPCK + GitHub workflow.
- Interface must be touch-friendly and responsive.
- Avoid unnecessary dependencies in the early prototype.
- Strong visual motion should be achieved with lightweight rendering so the game remains practical on a phone.

### Current implementation

The prototype uses:

- plain HTML
- CSS
- JavaScript
- HTML Canvas
- `requestAnimationFrame` for continuous animation

Current files:

- `PROJECT.md` — permanent project memory and design record
- `index.html` — page structure and compact mobile HUD
- `style.css` — responsive full-screen styling
- `game.js` — game state, AI, combat, input, procedural plant rendering, and animation

This is a technical starting point, not a permanent restriction.

---

## 10. Current Development Milestone

### Milestone 1 — Living Battlefield Presentation

The original hex foundation and the later circular-token presentation have both been replaced.

Current prototype now includes:

- full-screen animated Canvas battlefield
- irregular organic vegetation patches without permanent circular frames
- root-like connections shown mainly for the selected plant
- player-controlled green growth
- enemy orange / blight growth
- neutral wild growth
- touch selection
- vine / tendril attacks toward nearby growth
- growth regeneration
- plant capture
- six temporary upgrade tiers with different procedural silhouettes
- upgrade / evolve control
- simple enemy AI
- animated plant sway
- bloom / impact effects
- ambient spores
- victory and defeat states
- compact phone-first HUD
- reset control

### Purpose of this milestone

Prove that plant combat can feel visually alive and distinct without looking like a conventional tile or token board before we invest in the much larger real-world evolution tree and final combat rules.

### Next development milestone

Build the first **proper plant progression slice** using researched plant species and visibly distinct forms, then make their differences matter in combat without overcomplicating the rules.

---

## 11. Decision Log

### 2026-09-05

- Chosen working project name: **Verdant Ascension**.
- GitHub will store permanent project memory and code.
- Use one master project / design file with sections instead of many separate planning files.
- Confirmed that the game centers on fighting and evolving plant life.
- Confirmed small green grass as the starting form.
- Confirmed that real-world plant research will inform a long size-based progression.
- Confirmed that fictional / science-fiction plants may extend progression beyond real-world limits.
- Rejected the farming-market / economy direction.
- Began actual development with a lightweight mobile web prototype.

### 2026-09-06

- Rejected hexagonal tiles as the main visual presentation.
- Made stronger graphics and animation a development priority.
- Replaced the hex-map prototype with an organic root-connected battlefield.
- After testing on a phone, rejected the first organic redesign because the circular plot rings still looked like board-game tokens and the HUD covered too much of the screen.
- Changed the presentation again to full-screen irregular vegetation patches, contextual root links, a compact HUD, subtle selection outlines, and vine / tendril attack animation.
- Kept the current root-connected interaction model provisional rather than treating it as a final game rule.

---

## 12. Open Design Questions

These are not decisions yet:

- Should the final game remain root-connected / node-based, or evolve into a more free-form battlefield?
- Exactly how should stronger plants consume weaker plants in the finalized combat system?
- When an area is captured, should its plant species remain, transform, or be replaced by the attacker?
- How should evolution be triggered in the final game?
- Will progression branch into multiple plants at each tier or mostly follow one main path?
- How should the battlefield scale as plants progress from centimeters to trees over 100 meters tall?
- How should enormous fictional late-game plants change the battlefield itself?
- What is the final victory / loss structure for the long-term game?

---

## 13. Maintenance Rule

Whenever a meaningful game-design or technical decision is confirmed, update this file in GitHub. If an idea is only being explored, keep it marked provisional or under open questions rather than presenting it as final.
