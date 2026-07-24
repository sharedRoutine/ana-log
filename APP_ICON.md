# Ana|Log app icon

Concept: a closed logbook with a single ECG pulse tracing across its cover — the whole
app (anesthesia + record keeping) in one glyph. Emerald is the app's accent (#34D399).
No text in the icon.

## Prompt

```
Minimalist flat vector iOS app icon artwork, full-bleed square 1024x1024 canvas.
A closed notebook-style medical logbook, viewed perfectly straight-on and centered,
covering about 60% of the canvas height: emerald green (#34D399) front cover with a
slightly darker emerald spine strip along the left edge and softly rounded book
corners. Across the middle of the cover runs one continuous crisp white ECG
heartbeat line — flat, a single sharp pulse spike, then flat again — ending in a
small white dot. Background: uniform very dark green-tinted charcoal (#0D1413),
solid fill, no gradient, no texture. Clean geometric vector style, crisp edges,
subtle soft drop shadow under the book, even lighting, generous margins on all
sides. No text, no letters, no numbers, no watermark, no signature, no border, no
rounded canvas corners, no transparency.
```

## Post-processing

1. Generate at the largest available size, downscale to exactly **1024×1024 PNG**.
2. Strip any watermark/signature (Gemini stamps the bottom-right corner ~872–935 px):
   patch with a donor region from just left of it, re-check all corners at 100% zoom.
3. Keep the canvas square and opaque — no transparency, no rounded corners; iOS masks
   the squircle itself.
4. Verify the background is one uniform fill (bucket-fill surroundings with the exact
   hex if the model added noise or vignetting).
5. Save as `assets/icon.png` (replaces the current icon). For Android adaptive, reuse
   the book glyph as `assets/adaptive-icon.png` foreground on an emerald
   `backgroundColor`.
