# Geo Game

Browser implementation of the tabletop **Geo Game** described in your rules sheet.

## What is implemented

- 6 players total (You + 5 bots)
- Member deck with the exact card counts from the rules:
  - Human x4, Lily x13, Pine x4, Toad x9, Fish x7, Cloud x8, Mangrove x4, Banyan x4
- 9 ecosystem decks in a 3×3 layout, each with 6 cards (54 total)
- Ecosystem card costs follow this structure (member cards are paid/discarded, ecosystem costs are prerequisites you must already own):
  - Desert: Cloud + Toad
  - Aquatic: Lily + Toad + Mangrove + Marine
  - Forest: Human + Lily + Temperate + Tropical
  - Freshwater: Toad + Fish + Cloud
  - Temperate: Lily + Pine
  - Terrestrial: Pine + Mangrove + Desert
  - World: Human + Cloud + Terrestrial + Aquatic
  - Tropical: Lily + Banyan
  - Marine: Fish + Freshwater
- Round flow:
  - Players draw up to 6 at round start (clockwise from start player)
  - Players take turns acquiring ecosystem cards by paying member card requirements
  - No duplicate ecosystem type allowed per player
  - End of round: players discard down to 4 member cards
  - Start player rotates each round
  - Member draw deck reshuffles discard pile when depleted
- End game:
  - Triggered once someone has 20+ points at end of a round
  - Highest score wins
  - Ties resolved using highest-value ecosystem comparison

## Run locally

No build step required.

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Notes

- Trading is not implemented as a UI mechanic; this version focuses on the core acquire/score loop.
- Bot players use a simple strategy: repeatedly acquire the highest-value ecosystem they can afford.
