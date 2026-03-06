# Panda Time-Note Multi-Style UI/Interaction Design

Date: 2026-03-06  
Scope: Four independent demo styles with full Home + Editor + Settings coverage  
Mode: Demo-only routes, production routes remain unchanged

## 1. Goals

Build four clearly differentiated UI/interaction demos so product can compare direction choices without breaking current production flow.

Target directions:

1. Minimal Focus
2. Editorial Magazine
3. Productivity Dashboard
4. Emotional Time Capsule

## 2. Confirmed Product Decisions

1. Provide all four styles as demos (not one candidate only).
2. Use independent routes (not one page style switcher).
3. Depth is near full redesign for each style (information architecture changes, not only skin/theme).
4. Include Home + Editor + Settings in each style.
5. Reuse existing data/backend capabilities to avoid duplicate business logic.

## 3. Routing Architecture

Keep current production routes intact:

1. `/`
2. `/notes/new`
3. `/notes/new/article`
4. `/notes/:id/edit`

Add isolated demo routes:

1. `/demo/styles` (entry selector)
2. `/demo/minimal`, `/demo/minimal/editor`, `/demo/minimal/settings`
3. `/demo/editorial`, `/demo/editorial/editor`, `/demo/editorial/settings`
4. `/demo/dashboard`, `/demo/dashboard/editor`, `/demo/dashboard/settings`
5. `/demo/capsule`, `/demo/capsule/editor`, `/demo/capsule/settings`

## 4. Style Experience Specs

### 4.1 Minimal Focus

1. Home: single-column timeline, low-noise chrome, compact top filters.
2. Editor: centered narrow reading width, autohide tools, keyboard-first actions.
3. Settings: step-based essentials flow (appearance → editing → data).

### 4.2 Editorial Magazine

1. Home: chapter-like date sections, strong typography hierarchy, side annotation panel.
2. Editor: structured writing canvas with visible heading/quote/section rhythm.
3. Settings: visual preset cards with immediate preview.

### 4.3 Productivity Dashboard

1. Home: KPI strip + dense filter controls + card/grid operations.
2. Editor: split layout (metadata on side, content main), quick field edits.
3. Settings: console-style grouped controls for power users.

### 4.4 Emotional Time Capsule

1. Home: narrative time-river layout, capsule-first ranking, clear lock/unlock mood states.
2. Editor: letter-writing flow focused on receiver/time/reminder intention.
3. Settings: reminder cadence and reflection frequency prioritized.

## 5. Reuse Strategy (Avoid Useless Code)

1. Reuse current stores, bindings, backend handlers, i18n.
2. Add shared demo composables for data orchestration:
   - `useDemoNotesViewModel`
   - `useDemoEditorState`
3. Each style only owns:
   - layout shell
   - interaction choreography
   - style tokens/components
4. Keep style tokens in isolated CSS files to avoid polluting production theme.

## 6. Interaction Guidelines

1. All demos must keep behavior parity for create/edit/search/filter/save operations.
2. The difference is UX architecture and presentation priority, not business behavior.
3. Animations should be purposeful:
   - page enter hierarchy
   - list stagger
   - capsule state transitions
4. Desktop and mobile layouts must both be first-class (not desktop-only mockups).

## 7. Delivery Phases

Phase 1:

1. Route setup + demo entry page
2. Four Home demos (core comparison surface)

Phase 2:

1. Four Editor demos
2. Four Settings demos

Phase 3:

1. Shared responsiveness/accessibility hardening
2. Demo documentation and selection guidance

## 8. Verification Criteria

1. Each demo route is reachable and can navigate between Home/Editor/Settings.
2. Notes can be created/updated/read in all demos.
3. Search/filter behavior remains consistent across demos.
4. No critical overflow/interaction blockers on mobile breakpoints.
5. Existing production routes remain unchanged in behavior.

## 9. Risks and Mitigations

1. Risk: Code duplication across four styles.  
   Mitigation: shared demo composables for data and actions; styles only for shell and layout.

2. Risk: Demo styles accidentally regress production UI.  
   Mitigation: strict route isolation and scoped demo style tokens.

3. Risk: Interaction inconsistency across demos.  
   Mitigation: shared behavior contracts and smoke tests for core actions.

## 10. Non-Goals

1. Replacing current production UI in this phase.
2. Adding new backend APIs solely for demo visuals.
3. Introducing cloud sync or account features.

