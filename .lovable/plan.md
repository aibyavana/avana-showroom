## Goal
Make the hero cold-open logomark 50% larger and vertically centered on the viewport during the cold-open, while preserving its drift to the top perch as the hero image composes in.

## What will change

### `src/components/ZoomThrough.tsx`
1. **Logo size**: bump the `AvanaLogo` width from `clamp(330px, 42vw, 570px)` to `clamp(495px, 63vw, 855px)` (1.5x).
2. **Vertical centering during cold-open**:  
   - Change the logo container from `top-[3vh]` to `top-1/2` with `-translate-y-1/2` so the natural resting position is dead-center.  
   - Adjust the `logoY` transform keyframes so the cold-open starts at `0` (centered) and still drifts to the top perch by `COMPOSE_END`.  
   - Update the `reduce` motion fallback to match the new size and centering.

## What stays untouched
- All scroll phase boundaries (`COLD_OPEN_END`, `COMPOSE_END`, etc.).
- The `FINAL_SCALE`, doorway origin, headline timing, founder cross-fade, scroll cue, and every other animation curve.
- `TopNav`, `Founder`, `Interstitial`, `BrandsGallery`, `PreviousClients`, `Insider`.
- Design tokens, colors, fonts.

## Mobile / reduced-motion
- The `reduce` fallback path gets the same larger logo and centered placement so the static experience matches.