# Editorial Full Redesign Design

Date: 2026-03-08  
Scope: Replace default app flow UI with a Chinese-first literary editorial system (Home + Editor + Settings)

## 1. Goals

Deliver a full Editorial redesign (not a skin refresh) for the default app flow:

1. Home becomes a journal-like reading experience
2. Editor becomes a writing desk for long-form Chinese text
3. Settings become an editorial board control panel

## 2. Confirmed Decisions

1. Style direction: literary magazine
2. Typography priority: Chinese-first readability
3. Information architecture: fully replace card timeline with chapter + table of contents layout
4. Scope includes all primary pages: Home + Editor + Settings
5. Existing default UI entry should not be preserved as a user-facing fallback

## 3. Architecture

### 3.1 Home (`/`)

Switch from card timeline to editorial spread layout:

1. Left column: issue/section directory (today, week, topics, archive)
2. Center column: chaptered reading flow (time-grouped note sections)
3. Right column: marginalia panel (tags, excerpts, stats, quick actions)

This keeps data behavior but changes reading hierarchy.

### 3.2 Editor (`/notes/new`, `/notes/new/article`, `/notes/:id/edit`)

Switch from utility modal/editor pattern to writing desk:

1. Headline area: title + deck/introduction
2. Body area: long-form text focus with optimized line width and spacing
3. Metadata rail: tags, type, time, save status, action controls

### 3.3 Settings (`/settings`)

Switch from generic options panel to editorial system:

1. Typography system (font family, body rhythm, heading scale)
2. Paper/material system (background texture, contrast profile)
3. Reading cadence (animation speed, transitions)
4. Writing behavior (auto-save style, focus mode presets)

## 4. Visual Language (Chinese Literary Magazine)

### 4.1 Typography

1. Chinese serif-first heading/body pairing
2. Body size 16-18px, line-height around 1.75
3. Column width constrained for reading comfort
4. Strong title/deck/body hierarchy

### 4.2 Color and Surfaces

1. Base: paper ivory + ink charcoal
2. Accent: muted wine/brown/green tones
3. Reduced hard borders, stronger spacing hierarchy
4. Subtle texture/gradient to evoke printed page feel

### 4.3 Motion

1. Slow editorial transitions, no springy UI
2. Section switch uses fade + slight translate
3. Save/feedback uses restrained inline banners

### 4.4 Mobile Strategy

1. Three columns collapse into one flow
2. Directory becomes top drawer/anchor layer
3. Marginalia merges into contextual sections under content

## 5. Reuse and Constraints

1. Reuse existing store and backend handlers (no API/schema changes)
2. Reuse existing create/update/search behavior
3. Keep route contract stable; replace UI composition only
4. Avoid duplicate business logic in pages

## 6. Implementation Boundaries

In scope:

1. Full markup/CSS restructure for Editorial Home/Editor/Settings
2. Navigation and page-level interaction redesign
3. Responsive behavior for desktop/mobile

Out of scope:

1. Backend feature changes
2. Database migrations
3. New sync/account features

## 7. Validation Criteria

1. Home supports browse/search/entry to edit in redesigned editorial layout
2. Editor supports create/edit/save for note and article paths
3. Settings route is functional and visually aligned with editorial language
4. `cd frontend && npm test` passes
5. `cd frontend && npm run build` passes

## 8. Risks and Mitigation

1. Risk: visual redesign breaks route behaviors  
   Mitigation: keep route paths and save calls unchanged; add route-focused tests.

2. Risk: typography changes reduce readability on small screens  
   Mitigation: mobile-first breakpoints with explicit line-length control.

3. Risk: legacy utility components visually conflict with new editorial shell  
   Mitigation: isolate editorial style tokens and avoid global destructive overrides.

