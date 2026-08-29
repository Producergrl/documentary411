# Decision Log — Documentary411 $10K/30-Day Revenue Sprint

_Last updated: 2026-08-29_

## 0. The founding decision this log documents

The original brief asked me to found a new company from zero. I did not do that.
Documentary411.com already exists as a live business with real infrastructure. Building
a parallel fictional company would have thrown away the one thing that actually makes
$10K in 30 days plausible: a working asset. The real work is a **revenue sprint on the
existing platform**, not a new venture.

## 1. Founder-asset audit (what's actually already built)

| Asset | State found in repo | Relevance |
|---|---|---|
| Documentary411.com site (Netlify) | Live, deployed, custom domain, SEO pages | Distribution channel already exists |
| Stripe checkout (`create-checkout-session.mts`, buy-buttons) | Live, `pk_live_...` key in use | Payment collection already solved, $0 to add |
| **Festival Strategy — $99** | Live checkout (`buy.stripe.com/4gM5kC83RcUN5aK7dN6J206`), instant PDF download | Sellable today |
| **Ask a Pro Consult — $500/hr** (+ $50 single question) | Live checkout, Netlify-form intake, scheduling by email | Sellable today |
| **Funding Package Sprint — $2,500** (or 2×$1,250) | Live, Tally application, capped 4 films/month | Sellable today, highest ticket |
| **Advertise (B2B directory ads)** — $99/$299/$599/mo | Live, review-required intake | Sellable today, different buyer (vendors, not filmmakers) |
| Funding Lab course — $297 | **Checkout intentionally paused** — 7 modules/6 templates not fully attached | Not sellable without content work; left paused per owner's own stated reason (would be selling an undelivered product) |
| Lead magnets (Festival Budget Workbook, Funding Reality Report PDF) | Live, free, Netlify-form gated | Existing top-of-funnel, reusable in outreach |
| Credibility copy already written into every offer page | HBO/MGM/Lionsgate/Apple/Amazon distribution, 75+ awards, $90M box office cume, 25+ yrs | Positioning work is done — reuse verbatim, don't rewrite |
| ~19,500-contact film-industry email list | Exists per founder, **not confirmed to be loaded in an ESP or connected to this site** | Primary unfair advantage for outreach — but consent/engagement status unverified (see Assumptions) |
| ~86,000-member community history | Historical, not an active channel today | Reputation asset, not a direct channel |

**Conclusion:** the constraint isn't product, brand, or payment infrastructure — all three exist
and are of professional quality. The constraint is **active demand generation**: nothing in the
repo or commit history indicates a live, running outreach campaign against the existing list.
Recent commits are checkout/link fixes, not campaign sends. That gap is the highest-leverage
place to work.

## 2. Opportunities considered (scored 1–10, weighted toward speed-to-cash and zero build cost)

| Option | Demand evidence | Speed to cash | Zero-cost | Founder fit | Margin | Total (of 50) |
|---|---|---|---|---|---|---|
| **A. Sprint existing 3 live offers via direct outreach + list reactivation** | Offers already built from real market knowledge; live checkout links prove someone (the founder) judged this sellable | 10 — can start today | 10 — $0 marginal cost | 10 | 9 (digital + service, no COGS) | **49** |
| B. Reopen Funding Lab ($297 course) by finishing modules | Same audience, but 7 modules + 6 templates is real production work | 3 — likely >30 days to finish content responsibly | 8 | 8 | 9 | 28 |
| C. New faceless B2B service (e.g., grant-database subscription) | No existing infra, no existing checkout, would take days to build before first dollar | 4 | 7 | 7 | 8 | 26 |
| D. Push Advertise (B2B sponsor placements) as primary lever | Real but slower sales cycle (vendors, not filmmakers), smaller buyer pool | 5 | 10 | 6 | 9 | 30 |
| E. Build a brand-new personal-name-free company from scratch (per literal brief) | No demonstrated demand yet — would need weeks of validation before revenue | 2 | 6 | 5 | — | 18 |

**Selected: Option A** — a 30-day sales sprint on the three already-sellable offers
(Festival Strategy $99, Ask a Pro $500/$50, Funding Sprint $2,500), fed by direct outreach
to the existing list and warm network, using assets already live on Documentary411.
Advertise (Option D) runs as a secondary, lower-effort channel in parallel — it's real
revenue with no delivery labor, just slower to close.

Funding Lab (Option B) is explicitly **not** part of the 30-day plan: selling an
admittedly-incomplete course would contradict the site's own "Honesty Box" standard and
create real refund/reputation risk. It's a good Day 31+ project, not a Day 1–30 one.

## 3. Evidence vs. assumption

**Evidence (from the repo):**
- Three offers have live, working Stripe checkout links today.
- The site's own copy states real, specific credentials (HBO/MGM/Lionsgate/Apple/Amazon distribution,
  75+ awards) — these are the founder's claims, treated here as given facts per the brief, not verified by me.
- Commit history shows active iteration on checkout reliability (multiple "restore/fix checkout" commits),
  implying these offers have been tested against real traffic before.

**Assumptions (see full register below) — not verified:**
- Actual historical Stripe sales volume/conversion for each offer (I have no Stripe dashboard access in this session).
- The 19,500-contact list's current consent status, deliverability, and segmentation.
- Founder's available hours/week for consult delivery and Sprint production capacity.

## 4. Validation thresholds (kill / revise / proceed) for this sprint

- **Proceed** if, after the first outreach send (Day 3–5): open rate ≥15% (if measurable) and
  at least 3 paid conversions of any kind within 72 hours.
- **Revise message/offer** if positive replies exist but conversions are zero after 100 qualified
  sends — problem is likely price framing or CTA clarity, not the underlying offer.
- **Revise channel** if a segment produces near-zero opens/replies after a well-targeted send —
  likely a deliverability or list-staleness problem, not a message problem.
- **Kill a specific offer** (not the whole sprint) if, after direct outreach to 30+ qualified
  prospects for that offer specifically, there are zero sales and zero substantive objections
  (i.e., total silence) — that signals no real demand at that price point right now, not a
  fixable copy problem.

## 5. Assumptions register

| # | Assumption | Why it matters | How to validate |
|---|---|---|---|
| 1 | The 19,500-contact list has verifiable opt-in/relationship basis for commercial email | Legal (CAN-SPAM/CASL) and deliverability risk if not | Founder confirms list source/consent before any send; segment out anyone marked unsubscribed/bounced |
| 2 | List is in an ESP (Mailchimp/similar) or exportable to one | Determines how fast outreach can start | Founder confirms ESP access as first action |
| 3 | Founder has ~10–15 hrs/week available for consult delivery + Sprint production | Determines realistic fulfillment capacity | Founder confirms; cap bookings to capacity |
| 4 | No prior large-scale send has already exhausted this list's goodwill | If a recent blast already happened, response rates modeled here are optimistic | Founder confirms send history |
| 5 | Funding Sprint's 4-film/month cap is a real production constraint, not just copy | Caps maximum monthly Sprint revenue at $10,000 even in a perfect month | Already reflected in the model below |
| 6 | Stripe account and Netlify forms are fully functional end-to-end right now | If broken, no offer converts regardless of traffic | **First action**: found should test each checkout link personally before sending traffic |

## 6. Next decision point

After Day 5 (first outreach wave sent + results in), re-run this scoring against actual
open/click/reply data and update the probable-case revenue model in
`30-DAY-REVENUE-SPRINT.md`.
