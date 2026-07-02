# Grant and Fund Researcher — v2.0

An overnight researcher for your creative project. Once set up, it runs every
day at a time you choose, finds verified grant funders and sponsors that fit
your project's mission, logs them in a spreadsheet you own, and drafts
personalized letters of inquiry straight into your Gmail drafts — ready for
you to review, edit, and send yourself.

**Nothing is ever sent automatically.** Every letter waits in your drafts
until you send it.

## What you need

- A paid Claude plan with the **Claude desktop app** — setup and the
  nightly runs happen in **Cowork mode**, which is where Claude can
  create your spreadsheet and schedule tasks
- The **Gmail connector** enabled (claude.ai → Settings → Connectors → Gmail)

## Install

1. Go to claude.ai → Settings → Capabilities → Skills and upload this folder
   (SKILL.md, task-template.md, build_workbook.py) as a skill.
2. Open the Claude desktop app in **Cowork mode**, start a new session,
   and say: **"Set up Grant and Fund Researcher."**
3. Answer a short interview about your project (about 5 minutes). Before
   anything is scheduled, the skill runs a live demo — it finds 2–3 real
   leads and drafts one sample letter into your Gmail so you can approve the
   tone first.

## What happens every night

1. The researcher reads your spreadsheet so it never repeats an organization.
2. It searches the categories built from your mission, verifying every
   organization and email address against a real web page — no guessed
   contacts, ever.
3. It adds up to 5 new leads to your spreadsheet with full contact details
   and a source link.
4. For the strongest leads it drafts a personalized letter of inquiry into
   your Gmail under a label named after your project.
5. You wake up, read the drafts, edit anything you like, and hit send on the
   ones you want.

## Good to know

- The spreadsheet is the master record. Update Outreach Status as you go
  (Sent, Replied, Declined, Funded) — the researcher reads it before every
  run.
- The daily run uses your own Claude usage, like any other conversation.
- Say **"pause the grant researcher"**, **"change the run time"**, or
  **"shut it down"** in any conversation to manage it.
- If a nightly run hits a problem (for example Gmail was disconnected), it
  logs exactly what happened — ask "how did last night's run go?" any time.
