# Final Review Notes

## Demo Smoke Checklist
- Admin login and dashboard load
- Faculty login and dashboard load
- Student login and dashboard load
- Case create and publish
- Student PDF/text submission
- Faculty submission review with in-page PDF view
- Analytics charts load and refresh

## Known Limitations
- E2E suite was updated for current auth UI and routes; rerun status should be checked before presentation.
- Frontend build reports a large JS chunk warning (>500kb), which is not a functional blocker.
- Submission pipeline chart uses queue semantics: `Under Review` includes newly submitted items.
