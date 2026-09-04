# Debug report: meal detail image centering

- **Symptom:** Wide meal photos appeared at the top of the 320px detail image card, leaving all unused space below the photo.
- **Root cause:** The image used `max-h-80`, so its element shrank to the rendered photo height. `object-position: center` only positions content inside the image element and therefore had no vertical space in which to center it.
- **Fix:** The detail image now fills the complete card frame with `w-full h-full`; `object-contain object-center` centers the photo inside that frame without cropping it.
- **Evidence:** Browser verification with a 422×211 source image measured a 400×320 image element and equal 56px top and bottom letterboxing. The browser console reported no errors.
- **Regression test:** `tests/local-app.test.ts` checks that the detail page keeps the full-frame centering classes.
- **Status:** DONE
