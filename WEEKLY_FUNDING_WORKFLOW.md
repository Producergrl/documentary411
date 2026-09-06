# Documentary411 weekly funding workflow

## Schedule and ownership

Run the review every Monday by 9:00 a.m. America/New_York. The repository also runs an automated freshness check at 9:15 a.m. Eastern time every Monday. A failed GitHub Actions run is the visible failure alert and blocks a quiet continuation of an outdated “current” status.

## Source of truth

- `resources.json` is the catalog source used by the production build.
- `scripts/apply-funding-audit.mjs` records the last completed official-source review.
- Every status, deadline, amount, eligibility statement, geography, and project stage must come from the listing's controlling `officialUrl` or a more specific page on the same official domain.
- Search results, newsletters, aggregators, and an application page that merely still exists are discovery aids, not proof that an opportunity is open.

## Monday procedure

1. Open every funding record's official source. Review open and near-deadline records first.
2. Record one of: `open`, `closed`, `rolling`, `upcoming`, `invitation-only`, or `verify` (uncertain).
3. Confirm the deadline, timezone, amount and funding type, eligibility, geography, project stage, and whether the opportunity is a grant, investment, license, fiscal sponsorship, or directory.
4. Update `resources.json` and the matching entry in `scripts/apply-funding-audit.mjs`. Set `lastVerified` to the date actually checked; never bulk-date unchecked records.
5. Add a short entry to `FUNDING_CHANGELOG.md` with changed records, old/new status, official evidence URL, and reviewer.
6. Run `npm run audit:funding`, `npm run audit`, and the full Netlify build command.
7. Commit, push, wait for Netlify production deploy, then inspect the live homepage, grants directory, and affected resource pages.

## Status safeguards

- `open`: official source explicitly accepts applications now. Recheck every three days while displayed.
- `rolling`: official source explicitly says submissions are accepted year-round or without a deadline.
- `upcoming`: official source gives a future opening date.
- `invitation-only`: no public application; do not present as open.
- `closed`: the deadline passed or the official source says applications are closed.
- `verify`: the source is unavailable, contradictory, or unclear. Never display as open.

The site intentionally has no “Open Now” product or filtered page. Visitors can review dated status labels and continue to each official source themselves.

## Manual backup

If automation or deployment fails, run the three commands locally, save the terminal output with the changelog entry, push the audit commit, and confirm the Netlify deploy manually. If the review cannot be completed, leave the previous verification date visible and change uncertain records to `verify`; do not advance their dates.
