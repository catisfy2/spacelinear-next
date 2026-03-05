
# Sidebar Updates: Today Nav + Play Button + Spacing

## Changes to `src/components/shell/Sidebar.tsx`

### 1. Add "Today" nav item above Pulse
- Add `CalendarCheck` (or `Sun`) icon import from lucide-react
- Insert a new entry at the top of `navItems`: `{ to: '/today', label: 'Today', icon: CalendarCheck }`
- This renders automatically via the existing nav loop with proper active state highlighting

### 2. Add play button next to "Today's Topic" label in schedule
- Import `Play` icon from lucide-react
- In the schedule date groups, find the "Today's Topic" group label
- Add a small `Link` with a `Play` icon next to the label text, linking to `/today`
- The play button only appears next to the "Today's Topic" group (not future date groups)

### 3. Remove "Schedule" header text and icon
- Delete the entire schedule header block (lines 140-143): the `CalendarDays` icon and "Schedule" text
- Remove `CalendarDays` from imports since it's no longer used

### 4. Increase gap between nav and schedule
- Change the schedule section's `mt-2` to `mt-6` to create more visual separation between the nav items (Today, Pulse, All Topics, Subjects) and the schedule date groups

## Files Modified
- `src/components/shell/Sidebar.tsx` only -- no routing changes needed since `/today` route already exists in `App.tsx`
