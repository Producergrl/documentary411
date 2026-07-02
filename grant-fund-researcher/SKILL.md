---
name: grant-fund-researcher
description: Sets up an overnight grant and sponsor researcher for a creative project. Interviews the owner, builds a lead-tracking workbook, then schedules a daily task that finds verified funders and drafts personalized letters of inquiry into their Gmail drafts. Nothing is ever sent automatically.
---

You are setting up Grant and Fund Researcher for a new buyer. Two files sit alongside this one in the same folder: `task-template.md` (the prompt for the daily scheduled task) and `build_workbook.py` (builds the lead-tracking spreadsheet). You will read the first and run the second.

Follow the phases in order. Do not build anything before the buyer confirms their answers in Phase 2.

## PHASE 0 — CONFIRM REQUIRED CAPABILITIES

Before asking the buyer anything, confirm you have access to three capabilities. Tool names vary between environments, so search by capability, not by exact name:

1. **Asking structured questions** — an AskUserQuestion-style tool.
2. **Scheduling recurring tasks** — a tool that creates a scheduled or cron task (may be named `create_scheduled_task`, `CronCreate`, or similar).
3. **Gmail** — tools to create drafts, list labels, create a label, and apply a label. These are usually MCP tools; use tool search to load them if they are deferred.

If Gmail tools cannot be found after searching, stop and tell the buyer their Gmail account is not connected in this session, and that they need to connect it (claude.ai → Settings → Connectors → Gmail) before setup can finish. Do not continue without Gmail — the entire product depends on it.

If scheduling tools cannot be found, stop and tell the buyer scheduled tasks are not available in this session and setup cannot finish here.

## PHASE 1 — DESCRIBE YOUR PROJECT (three short beats)

Welcome the buyer warmly. Explain in two sentences what is about to happen: you will ask a few questions about their project, then set up a recurring search that runs daily and drafts personalized letters of inquiry into their own Gmail drafts for review. Nothing is ever sent automatically.

Keep the interview to **three beats**. Use plain conversational questions for open-ended answers; use the structured-question tool only for the categorical choices below, and never give it more than 4 options (an "Other" choice is added automatically — do not add your own).

**Beat 1 — the project (one open prompt).** Ask them to tell you about the project in a few sentences: what it is, what it's called, and the mission or theme driving it. This one answer drives the search categories and the personalization of every letter, so if it comes back thin, ask one gentle follow-up to get something concrete. If their answer implies a geographic focus, confirm it; otherwise assume no restriction. Then ask one structured question for **project type** with exactly these 4 options: Documentary or film / Book or podcast / Music or visual art / Nonprofit program. (Anything else arrives via the automatic Other option.)

**Beat 2 — the money (grouped plain questions, one message).** Ask together: what they are raising funds for and the target amount; and whether they have fiscal sponsorship or nonprofit status ("no" and "not yet" are valid answers). Then ask one structured question for **search scope**: Grants and funders only / Sponsors and partners only / Both.

**Beat 3 — the voice (grouped).** Ask how they want each letter signed (confirm their name from their Gmail account if you can see it, rather than asking cold). Ask one structured question for **tone**: Warm / Formal / Urgent / Warm and direct. Then ask, in plain text: any organizations already contacted or to exclude entirely ("none" is valid), and what time the daily run should fire — tell them 2 AM is the default and runs quietly overnight so letters are waiting when they wake up.

## PHASE 2 — CONFIRM BEFORE BUILDING

Recap everything in a short, clear summary. Ask one structured question: does this look right, or is there anything to change? Do not proceed until they confirm. If they want changes, make them and recap again.

## PHASE 3 — GENERATE THE SEARCH CATEGORIES

From the mission and project type, reason out four to six concrete search categories for this specific project. Name real organization types, and named example organizations only where you are confident they exist and fit — every category must be something a researcher could act on tomorrow morning. Vague categories like "relevant nonprofits" are not acceptable.

Match the scope: grants-only → all funder types; sponsors-only → all sponsor/partner types; both → a mix weighted toward whichever the mission leans to.

Show the buyer the list and ask one quick confirmation — this does not need a full Phase 2-style review.

## PHASE 4 — BUILD THE SUPPORTING TEXT BLOCKS

Build these blocks now, before opening the template:

**SHEET_STRUCTURE_BLOCK** — describe only the sheets for the chosen scope. Grants-only: *Grant and Funder Leads* (general funders) and *Niche Foundations* (funders specific to this theme). Sponsors-only: *Strategic Partners* (co-presenting or cross-promotional) and *Sponsors* (financial or in-kind). Both: all four.

**LEAD_COLLECTION_BLOCK** — what to collect per lead. Grant/funder leads: Organization Name, Type/Category, Contact Person, Title/Role, Email Address, Phone, Website, Funding Focus, Typical Grant Range, Outreach Status, Priority, Notes, Date Added, Source URL. Sponsor/partner leads: the same, but Sponsor Angle instead of Funding Focus and Potential Value/Offer instead of Typical Grant Range. If both scopes exist, state both column sets explicitly.

**LETTER_RULES_BLOCK** — one bullet per lead type that exists. Grant/funder letters: reference the buyer's fiscal sponsor or nonprofit status where relevant and state the funding goal plainly. Sponsor/partner letters: reference the Sponsor Angle and Potential Value/Offer recorded for that specific organization. Include only bullets that apply.

**EXCLUDED_ORGS_BLOCK** — if the buyer named exclusions, list them and note they are seeded into the tracking system. Otherwise: "No organizations were excluded at setup."

## PHASE 5 — BUILD THE WORKBOOK

Save location: the buyer's connected project folder if one exists in this session, otherwise the default outputs location — and tell them clearly where it is. Name the file `{Project Name} Funders and Sponsors.xlsx`. Strip filename-unsafe characters (slashes, colons, quotes) from the filename only; the project name inside the spreadsheet and letters stays exactly as typed.

Run the script by its full filesystem path (your bash working directory is not this folder; resolve the path mapping first):

```
python3 "<full path to build_workbook.py>" --output "<full path to xlsx>" --project-name "<project name>" --scope <grants|sponsors|both>
```

Confirm it reports the expected sheet names. If it fails, read the error, fix the actual problem, and retry. Do not continue with a broken or missing workbook.

## PHASE 6 — CREATE THE GMAIL LABEL

Check whether a label named `{Project Name} Outreach` exists; create it if not. The daily task refers to the label by this exact name — record the name you actually created (and the label id if the drafting tools require one).

## PHASE 7 — LIVE DEMO RUN (do not skip)

Before scheduling anything, run one miniature version of the daily task yourself, right now, while the buyer watches:

1. Pick the strongest search category from Phase 3 and find **2–3 real leads**, verifying each organization and contact against a live web source. Never guess an email address — if a verified address can't be found, record the org with contact marked "not yet found" and move on.
2. Write them into the workbook with all columns filled.
3. Draft **one** letter of inquiry in Gmail for the best lead, apply the label, and tell the buyer to open their drafts and read it.
4. Ask if the tone and content are right. If not, adjust the letter rules now and redo the draft.

This proves the whole pipeline — search, spreadsheet, draft, label — while you can still fix it, and shows the buyer the exact deliverable before the first overnight run.

## PHASE 8 — SEED THE MEMORY CACHE

Create a file in your memory directory named `project_grant_research_<project-slug>.md`. Header: this file is a working cache for the daily task — the **spreadsheet is the single source of truth** for which organizations have been found, contacted, or excluded; if this file is ever missing or stale, rebuild it from the spreadsheet. Seed it with the Phase 1 exclusions and the leads from the demo run.

## PHASE 9 — FILL THE TEMPLATE AND SCHEDULE THE TASK

Read `task-template.md` from this folder. Replace every `{{PLACEHOLDER}}` using the Phase 1 answers, the Phase 4 blocks, the workbook path, the memory file path, and the Gmail label name. Set `{{DAILY_CAP}}` to 5 unless the buyer asked otherwise. No `{{ }}` may remain.

**taskId:** lowercase, hyphenated, letters and numbers only, from the project name plus `-grant-research` (e.g., "Riverbend Documentary" → `riverbend-documentary-grant-research`). Before creating it, check whether a task with this id already exists; if so, ask the buyer whether to replace it or keep the existing one.

**Schedule:** determine what timezone the scheduler runs in — do not assume it matches the buyer's local time. Convert their preferred time into the scheduler's timezone and build a cron expression `M H * * *`. Default to 2 AM local (converted) if they had no preference or their answer was too vague; if you defaulted, say so and note they can change it any time.

Create the scheduled task with the taskId, the filled-in template as the prompt, a one-line description naming the project, and the cron expression.

## PHASE 10 — CONFIRM COMPLETION

Tell the buyer, plainly and without jargon:

- The researcher is live and first runs at the time they chose.
- The spreadsheet lives at the Phase 5 location, and it is the master record — they can edit Outreach Status and Notes freely; the daily task reads it before every run.
- Each morning after a run, up to {{DAILY_CAP}} new leads appear in the spreadsheet and any strong ones become Gmail drafts under the `{Project Name} Outreach` label, ready to review, edit, and send themselves. Nothing is ever sent without their review.
- The daily run uses their own Claude usage, like any other conversation.
- They can say "pause the grant researcher," "change the run time," or "shut it down" any time, in any session.
