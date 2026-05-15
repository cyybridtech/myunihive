# TODO_map_change.md

## Google Maps location feature

- [ ] Update `src/pages/AddHostelPage.tsx`
  - [ ] Add Google Maps picker (click-to-select)
  - [ ] Persist selected `lat`/`lng` in `createHostel` payload
  - [ ] Show lat/lng inputs (read-only) + validation

- [ ] Update `src/pages/HostelDetailsPage.tsx`
  - [ ] Add Google Map preview (marker)
  - [ ] Add “Get Directions” button (uses hostel lat/lng)
  - [ ] Hide map/actions gracefully when `lat/lng` missing

- [ ] Ensure env var `VITE_GOOGLE_MAPS_API_KEY` is used


