## Problem

`updateStreak()` in `src/lib/streaks.ts` only ever runs when a meal is logged. It compares the new meal's date against `lastLogDate` and resets to 1 if the gap is wrong. But if the user simply stops logging, nothing ever runs — so the streak number stays forever, even after weeks of inactivity.

## Fix

Add a passive decay check that runs whenever the app loads (and when streak data is read for display), independent of meal logging.

### 1. New helper in `src/lib/streaks.ts`

```ts
export async function validateStreakFreshness(): Promise<StreakData>
```

Logic:
- Load current `StreakData`.
- If `currentStreak === 0` or `lastLogDate == null` → return unchanged.
- Compute today's date string (local) and yesterday's date string.
- If `lastLogDate` is **not** today and **not** yesterday → the streak is broken:
  - Set `currentStreak = 0`.
  - Keep `longestStreak`, `streakHistory`, and `lastLogDate` untouched (so history/longest are preserved).
  - Persist via `saveStreakData()`.
- Return the (possibly updated) data.

Using "yesterday still counts" matches the existing `updateStreak` rule (`diffDays === 1` continues the streak). A user who logged yesterday hasn't broken it yet — they have until end-of-today.

### 2. Wire it into `src/contexts/AppContext.tsx`

In the `init()` effect, after `getStreakData()` resolves, call `validateStreakFreshness()` and use its result as the streak state. This ensures every cold start (and every published-site visit) re-evaluates the streak.

Also call it inside `refreshStreak()` so any manual refresh re-checks.

### 3. No UI changes

Streak display components already render whatever `streak.currentStreak` is, so resetting to 0 will surface immediately.

### 4. Version bump

Bump `APP_VERSION` in `src/pages/Settings.tsx` to `0.10.7-alpha`.

## Files touched

- `src/lib/streaks.ts` — add `validateStreakFreshness`
- `src/contexts/AppContext.tsx` — call it in `init` and `refreshStreak`
- `src/pages/Settings.tsx` — version bump
