# Multi-Style Demo Notes

Date: 2026-03-06

## Demo Entry

1. Open `/demo/styles` to view all style options.
2. Each style has independent Home + Editor + Settings routes.

## Route Map

1. Minimal:
   - `/demo/minimal`
   - `/demo/minimal/editor`
   - `/demo/minimal/settings`
2. Editorial:
   - `/demo/editorial`
   - `/demo/editorial/editor`
   - `/demo/editorial/settings`
3. Dashboard:
   - `/demo/dashboard`
   - `/demo/dashboard/editor`
   - `/demo/dashboard/settings`
4. Capsule:
   - `/demo/capsule`
   - `/demo/capsule/editor`
   - `/demo/capsule/settings`

## Intent Summary

1. Minimal: low-noise, single-focus reading/writing flow.
2. Editorial: chapter-like hierarchy and typographic rhythm.
3. Dashboard: dense operation panel and KPI-first layout.
4. Capsule: emotional timeline and lock/unlock storytelling cues.

## Reuse Principles

1. Data/business logic still uses existing stores and backend bindings.
2. Style demos only replace layout, interaction choreography, and visual tokens.
3. Production routes and existing pages remain unchanged.

## Verification Snapshot

1. `cd frontend && npm test` passes.
2. `cd frontend && npm run build` passes.
3. Demo routes render independently with baseline accessibility nav labels.

