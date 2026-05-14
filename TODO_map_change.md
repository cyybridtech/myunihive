# TODO: Replace embedded hostels map with “Open in Google Maps” button

## Step 1: Update Hostel details UI
- [ ] Edit `src/pages/HostelDetailsPage.tsx`
  - Remove/disable embedded Leaflet “Location” map section (the `mapContainerRef` + `useEffect` Leaflet init + JSX map block).
  - Add a button (only when `hostel.lat/lng` are finite numbers):
    - “View in Google Maps”
    - Link: `https://www.google.com/maps?q={lat},{lng}`
  - Open via `window.open(url, '_blank')` or `a href` with `target="_blank"`.

## Step 2: Keep Add Hostel pin picker using google maps 
- [ ] Ensure `src/pages/AddHostelPage.tsx` continues to collect/save `lat/lng` via the existing pin-by-map picker.

## Step 3: Manual verification (critical path)
- [ ] Add hostel → pin on map → publish
- [ ] Open hostel details → confirm the Google Maps button appears
- [ ] Click button → confirm it opens Google Maps at the pinned coordinates
- [ ] Open hostel that has no coords → confirm the button is hidden (no blank/empty map)

## Step 4: Commit & push
- [ ] `git add` updated files
- [ ] `git commit -m "Replace embedded hostel map with Google Maps link"`
- [ ] `git push origin main`
