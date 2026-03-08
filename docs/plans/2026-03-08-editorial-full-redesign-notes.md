# Editorial Full Redesign Notes

## Verification Checklist

- [x] default routes open editorial pages
- [x] create/edit/save still work
- [x] tests and build pass

## Intent Summary

This redesign makes Editorial the default experience for Home, Editor, and Settings while preserving existing note data behavior.  
The UI shifts to a Chinese-first literary reading/writing model with:

- chaptered home reading layout
- writing-desk editor with route-driven create/article/edit state
- editorial-board settings zones
- responsive collapsed order for mobile reading flow

## Notes

- Demo routes (`/demo/*`) are still available for internal style comparison.
- Route metadata now includes `appStyle: editorial` for the default app flow.
