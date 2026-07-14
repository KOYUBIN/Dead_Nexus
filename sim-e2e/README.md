# DEAD NEXUS — Web Simulator E2E Balance Runner (`sim-e2e/`)

Runs the **real deployed** web build (`simulator/v0.5/`, v6.11.2) bots-only, headless, and
collects faction/class win rates, round length, M&A / suppression frequency, and every
console error / pageerror. Does not modify `simulator/` or `sim-harness/`.

## Usage (3 lines)
```
cd sim-e2e && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install     # once (browser is pre-installed at /opt/pw-browsers)
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node run.js 3 5x5       # 3 games on the fast 5x5 map
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node run.js 20 11x11    # 20 games on the full 11x11 map
```
`node run.js [games=10] [mapSize=11x11]`. Results are printed as a table and saved to
`sim-e2e/results/<timestamp>.json`. The three CDN libs (React/ReactDOM/Babel) are served
offline from `sim-e2e/vendor/` via request interception, so no network is needed at run time.

## How it drives the game
v6.11.2 has **no bots-only UI mode** (only solo/hot-seat, both with a human seat P0). The
runner therefore loads the actual page and drives the engine head-less via the page's own
globals (`buildInitial` / `reducer` / `botPickCards` / `checkInstantVictory` + `euro_module`'s
`euro_applyAll`), replaying the exact phase-dispatch sequence the React auto-advance effect
uses, with **every seat planned by `botPickCards`**. This exercises the real M&A / suppression /
victory logic incl. `euro_declareMnaBots` and `euro_grantSuppression`.
