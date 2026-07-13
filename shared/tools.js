// Tool registry — shared by the browser (UI) and the serverless function (prompt building).
// Every non-human step maps to a real, runnable AI tool. Synthetic "Northwind Retail" context.
import { STEPS, PROCS, stepById } from "./data.js";

/* ---------- tool kinds: system prompt + input schema + runtime caps ---------- */
export const KINDS = {
  draft: {
    label: "Draft generator",
    blurb: "Generates a ready-to-use draft from a short brief.",
    run: "Generate draft",
    model: "gpt-4o-mini", maxTokens: 750,
    system: "You are an HR operations copilot for a fictitious value retailer called Northwind Retail. Produce a clean, professional, ready-to-use draft in UK English. Be concise and concrete. Never invent real policy numbers, personal data, or legal clauses; keep it illustrative.",
    inputs: [{ id: "brief", label: "Brief / key points", type: "textarea" }],
  },
  refine: {
    label: "Editing copilot",
    blurb: "Merges reviewer feedback into a draft and flags what changed.",
    run: "Apply feedback",
    model: "gpt-4o-mini", maxTokens: 750,
    system: "You are an editing copilot for Northwind Retail HR. Revise the draft to incorporate the reviewer feedback faithfully. Return the revised text, then a one-line '> Changes:' note summarising what you changed.",
    inputs: [
      { id: "draft", label: "Current draft", type: "textarea" },
      { id: "feedback", label: "Reviewer feedback", type: "textarea" },
    ],
  },
  translate: {
    label: "Translation service",
    blurb: "Translates HR content into the target language, keeping terminology consistent.",
    run: "Translate",
    model: "gpt-4o-mini", maxTokens: 750,
    system: "You are a professional HR translator for Northwind Retail. Translate the source text faithfully into the requested target language, keeping HR terminology and tone consistent. Return only the translation.",
    inputs: [
      { id: "text", label: "Source text", type: "textarea" },
      { id: "lang", label: "Target language", type: "text" },
    ],
  },
  extract: {
    label: "Data extractor",
    blurb: "Pulls structured fields from messy input and flags what's missing.",
    run: "Extract",
    model: "gpt-4o-mini", maxTokens: 650,
    system: "You are a data-extraction agent for Northwind Retail HR. Read the raw input and return a compact Markdown table of the relevant fields and values. Add a short 'Flags' line listing anything missing, inconsistent or requiring human review.",
    inputs: [{ id: "raw", label: "Raw input", type: "textarea" }],
  },
  classify: {
    label: "Decision agent",
    blurb: "Makes a routing / eligibility / match decision with a justification.",
    run: "Decide",
    model: "gpt-4o-mini", maxTokens: 450,
    system: "You are a decision agent for Northwind Retail HR. Based on the inputs, make the decision the step requires (e.g. duplicate vs new, eligible vs not, which route/recipient). Reply in exactly three lines: 'Decision: ...', 'Reason: ...', 'Next action: ...'.",
    inputs: [{ id: "record", label: "Record / data to assess", type: "textarea" }],
  },
  qa: {
    label: "QA / control agent",
    blurb: "Compares expected vs actual and closes the control gap with a checklist.",
    run: "Run check",
    model: "gpt-4o-mini", maxTokens: 650,
    system: "You are a quality-control agent for Northwind Retail HR. Compare the SOURCE/expected version against the ACTUAL/published version. Return a checklist using ✓ for matches and ✗ for issues (one line each), then a final line 'Result: PASS' or 'Result: FAIL — <reason>'.",
    inputs: [
      { id: "source", label: "Source / expected", type: "textarea" },
      { id: "actual", label: "Actual / published", type: "textarea" },
    ],
  },
  schedule: {
    label: "Scheduling agent",
    blurb: "Turns constraints into a concrete plan with dates, slots and owners.",
    run: "Build plan",
    model: "gpt-4o-mini", maxTokens: 650,
    system: "You are a scheduling agent for Northwind Retail HR. From the constraints and participants, propose a concrete plan: a short ordered list with dates/day-slots, who does what, and any dependency. Keep it realistic and immediately usable.",
    inputs: [{ id: "constraints", label: "Constraints & participants", type: "textarea" }],
  },
  notify: {
    label: "Notification drafter",
    blurb: "Writes the right message to the right recipients.",
    run: "Draft message",
    model: "gpt-4o-mini", maxTokens: 500,
    system: "You are a communications copilot for Northwind Retail HR. Write a short, clear internal message to the stated recipients. Return 'Subject: ...' then the body. Professional, friendly, no fluff.",
    inputs: [
      { id: "context", label: "What to communicate", type: "textarea" },
      { id: "recipients", label: "Recipients", type: "text" },
    ],
  },
  orchestrate: {
    label: "Autonomous agent",
    blurb: "Plans and 'executes' a multi-step task across systems, with an action log.",
    run: "Run agent",
    model: "gpt-4o-mini", maxTokens: 650,
    system: "You are an autonomous operations agent for Northwind Retail HR. For the given task, output a realistic numbered action log of the steps you execute across the (generic) systems involved, validating mandatory data as you go. End with a final line 'Status: <result>'. Keep it specific and grounded in the inputs.",
    inputs: [{ id: "task", label: "Task context & data", type: "textarea" }],
  },
  automate: {
    label: "RPA bot",
    blurb: "Applies a deterministic rule and returns the run log + result.",
    run: "Run bot",
    model: "gpt-4o-mini", maxTokens: 500,
    system: "You are an RPA automation for Northwind Retail HR. Given the trigger and data, output three sections: 'Rule applied:', 'Actions:' (a short numbered log), and 'Result:'. Deterministic, no judgement calls.",
    inputs: [{ id: "trigger", label: "Trigger & data", type: "textarea" }],
  },
};

/* ---------- which kind each step maps to (name-based rules, then workforce) ----------
   Rules read the step NAME only (the improvement text adds noise like "posting"/"check"). */
export function kindFor(s) {
  if (s.wf === "Human") return "human";
  const t = s.name.toLowerCase();
  if (/transl/.test(t)) return "translate";
  if (/generate contract|contract summary|create vacancy|vacancy advert|create .*text|\bdraft\b|learning plan|one[- ]?pager/.test(t)) return "draft";
  if (/process feedback|merge feedback|correct data/.test(t)) return "refine";
  if (/duplicate|rehire|\bmatch\b|eligib|country/.test(t)) return "classify";
  if (/register error|\bextract\b|\bexport\b|employee query|which employees|new[- ]hire data|expiring|overview|complete .*checklist|validate mutations/.test(t)) return "extract";
  if (/schedul|intake meeting|plan (medical|introductory|general|vacancy)|preliminary planning|plan .*training/.test(t)) return "schedule";
  if (/\bcheck\b|verif|control|posted|posting/.test(t)) return "qa";
  if (/\bsend\b|inform|notify|\bshare\b|announce|stakeholders|\bemail\b/.test(t)) return "notify";
  if (s.wf === "Gen") return "draft";
  if (s.wf === "Aug") return "refine";
  if (s.wf === "Agentic") return "orchestrate";
  return "automate";
}

/* ---------- bespoke demo inputs (flagship steps get rich, realistic defaults) ---------- */
const DEMOS = {
  // REQUISITION
  req1: { trigger: "Approval record: Req #NW-4821 — Store Associate, Store 118 (Rotterdam), 0.8 FTE, approved by Regional Manager on 12 May. Add to authorised vacancy list." },
  req2: { record: "Role: Store Associate, Level 2, Store 118. Contract: permanent, 30h. Need the current C&B job description link and the approved salary band for this level/region." },
  req3: { constraints: "Intake for 'Store Associate — Store 118'. Participants: Recruiter, Hiring Manager (store 118), HR BP. Both available Tue–Thu afternoons next week. 30 min. Recruiter to send briefing pack." },
  req4: { brief: "Role: Store Associate at Northwind Retail, Store 118 Rotterdam. 30h/week, permanent. Responsibilities: stocking, till, customer help, keeping the floor tidy. No experience needed, friendly & reliable. Highlight staff discount, training, fixed roster." },
  req5: { context: "Vacancy text for 'Store Associate — Store 118' is ready for review before posting. Please review for accuracy and tone and reply with any changes by Thursday.", recipients: "Hiring Manager, Store 118" },
  req6: null, // human
  req7: { draft: "Store Associate — Store 118. 30h/week. Help customers, keep shelves stocked and the store tidy. Friendly and reliable people welcome; no experience needed.", feedback: "Add that weekend availability is required, mention the 20% staff discount, and make the opening line more energetic." },
  req8: { text: "Store Associate — Store 118, Rotterdam. 30 hours/week, permanent. You help customers, keep shelves stocked and the store tidy. Friendly, reliable people welcome — no experience needed. Benefits: 20% staff discount, paid training, fixed roster.", lang: "Dutch" },
  req9: { trigger: "Finalised vacancy text for Req #NW-4821 (Store Associate, Store 118), version 2, approved by Hiring Manager. File to the correct vacancy folder and tag with req id + store." },
  req10: { task: "Raise a requisition creation request for Req #NW-4821: Store Associate, Store 118, 30h, permanent, salary band L2-NL, hiring manager J. de Vries. Validate all mandatory fields before submitting." },
  req11: { task: "Create the requisition in the HRIS and post the approved vacancy to the careers site and job channels for Req #NW-4821 (Store Associate, Store 118). Confirm each posting." },
  req12: { source: "Approved vacancy: Store Associate, Store 118, 30h/week, permanent, 20% staff discount, apply by 30 June.", actual: "Live careers-site posting: Store Associate, Store 118, 30 hrs, permanent, staff discount, apply by 30 July." },
  req13: { source: "Approved vacancy: Store Associate — Store 118 — 30h — permanent — Rotterdam.", actual: "Job-board A: Store Associate, Store 118, 30h, permanent, Rotterdam. Job-board B: Store Assistant, Store 118, full-time, Rotterdam." },
  req14: { trigger: "All postings for Req #NW-4821 confirmed live. Close the associated request ticket and notify the requester." },
  // PRE-BOARDING
  onb1: { trigger: "New hire selected: M. Bakker, Store Associate, Store 118, start date 1 July. Initiate onboarding administration from the recruitment record." },
  onb2: { raw: "New hire: Bakker, Milan — DOB 04/03/2004 — IBAN NL.. — start 01/07 — Store 118 — 30h — BSN pending — emergency contact missing." },
  onb3: { record: "Candidate: Milan Bakker, DOB 04/03/2004, Rotterdam. Existing records: 'M. Bakker' worked at Store 118 as seasonal until 5 months ago (same DOB). Determine duplicate/rehire vs new hire." },
  onb4: { task: "Initiate onboarding for Milan Bakker (Store Associate, Store 118, start 01/07): create the onboarding case, request accounts, and trigger the pre-boarding checklist." },
  onb5: { brief: "Employment contract summary for Milan Bakker: Store Associate, Store 118, 30h/week, permanent, salary band L2-NL, start 01/07, 6-month probation, 20% staff discount. Draft a plain-language contract summary (not a legal contract)." },
  onb6: null, // human
  onb7: { context: "Contract and annexes for Milan Bakker are ready. Send for e-signature with a friendly note and a 5-day deadline.", recipients: "Milan Bakker (new hire)" },
  onb8: { trigger: "Signed contract received for Milan Bakker via e-signature on 20 June. Log receipt, mark contract status = signed, notify HR admin." },
  onb9: { trigger: "Signed contract + ID annex for Milan Bakker. Archive to the personnel document store under the employee record with correct retention tag." },
  onb10: { task: "Finalise onboarding for Milan Bakker: confirm accounts provisioned, contract signed, start date set; flag any missing item before Day 1." },
  onb11: { brief: "First-90-days learning plan for a new Store Associate (Store 118): mandatory safety induction, till & payments, customer service basics, product/stock handling. Spread across weeks 1–4." },
  onb12: { trigger: "Employee Milan Bakker onboarded. Assign next free clock badge number for Store 118 and link it to the employee profile in Time & Attendance." },
  onb13: { constraints: "Book the pre-employment medical health check for Milan Bakker before 01/07. Clinic available Mon/Wed mornings. Employee prefers early slots. Send confirmation." },
  onb14: null, // human
  // PAYROLL
  pay1: { context: "Weekly payroll planning for period 07 (Netherlands). Key dates: query Mon, controls Tue–Thu, run Fri. Ask stakeholders to submit mutations by Monday 12:00.", recipients: "HR & Finance colleagues (NL payroll)" },
  pay2: { raw: "Employee master query, period 07: 1,240 active employees NL. Extract joiners (18), leavers (11), contract changes (23), salary changes (9) since last period." },
  pay3: { raw: "Time & absence export period 07 (sample): 3 employees with negative balances, 5 missing clock-outs, 2 overlapping shifts, 1 absence without code." },
  pay4: { trigger: "Validated payroll mutations file for period 07 (61 changes). Upload payroll input data to the payroll engine and confirm record counts match." },
  pay5: { source: "Expected mutations period 07: 18 joiners, 11 leavers, 23 contract changes, 9 salary changes = 61.", actual: "Loaded in payroll engine: 18 joiners, 10 leavers, 23 contract changes, 9 salary changes = 60." },
  pay6: { source: "Control set (Tue): gross-to-net simulation, journal-entry check, pension file check.", actual: "Tue run results: 2 employees with wrong number, 1 pension mismatch, gross/net OK." },
  pay7: { raw: "Errors found in Tue controls: EMP-0912 invalid personnel number; EMP-1180 pension base mismatch. Register on the error list with owner and status." },
  pay8: { task: "Resolve the two open payroll errors (EMP-0912 invalid number, EMP-1180 pension base) in the source systems and record the fix on the error list." },
  pay9: { source: "Control set (Wed): recalculations run 1, min-wage check, 30%-ruling check.", actual: "Wed run: all recalculations balanced; 1 min-wage flag on a youth contract to verify." },
  pay10: { source: "Control set (Thu): recalculations run 2, active-vs-gross check, final journal.", actual: "Thu run: recalculations balanced, active-vs-gross OK, journal ready." },
  pay11: { task: "Execute the final payroll controls for period 07 across the control set and consolidate results into a single status." },
  pay12: { raw: "Payroll checklist period 07: query ✔, upload ✔, mutations validated ✔, Tue/Wed/Thu controls ✔, 2 errors resolved ✔, sign-off pending." },
  pay13: null, // human — final sign-off
  // SAFETY TRAINING
  saf1: { raw: "Certificate register (DC-A): 42 employees; expiring within 60 days: 9 (forklift x4, first-aid x3, fire-warden x2). Build the expiring-certificates overview." },
  saf2: { context: "Monthly expiring-certificates overview for DC-A: 9 employees due within 60 days. Share with local admins and internal-security team lead for planning.", recipients: "Local admins, Team Lead Internal Security (DC-A)" },
  saf3: { raw: "DC-A certificate data: 9 expiring within 60 days, plus 3 new hires needing general H&S induction. Determine who needs to be trained in the next cycle." },
  saf4: { context: "12 employees need mandatory H&S training in the next 4-week cycle (DC-A). Inform the relevant team leads and trainers so they can free capacity.", recipients: "Team Leads & Trainers (DC-A)" },
  saf5: { task: "Assign the required H&S training classes to the 12 identified employees in the learning system for the next cycle, avoiding shift clashes." },
  saf6: { constraints: "Preliminary training plan DC-A: 12 employees, 3 courses (forklift, first-aid, fire-warden), 1 trainer, sessions must sit within Mon–Thu day shifts over 4 weeks, max 6 per session." },
  saf7: { context: "Upcoming mandatory H&S training scheduled for you next week. Please confirm attendance and arrange shift cover if needed.", recipients: "Employees due for training (DC-A)" },
  saf8: { context: "Confirmed training dates and participant list for the DC-A cycle. Inform the local admin to update rosters and the learning system.", recipients: "Local Admin (DC-A)" },
  saf9: { constraints: "Finalise the training schedule with the trainer: 3 sessions confirmed (forklift Tue wk1, first-aid Wed wk2, fire-warden Thu wk3), room B, cover arranged. Confirm and lock." },
  saf10: { constraints: "Plan the introductory (first) day H&S induction for 3 new DC-A hires starting Monday: general safety briefing + site walk, 90 min, trainer + team lead." },
  saf11: { context: "Additional battery/crane refresher scheduled for 4 operators (DC-A) next month, in-house, no external supplier. Inform the operators and their team lead.", recipients: "4 operators + Team Lead (DC-A)" },
  saf12: { context: "Reminder: your mandatory H&S session is tomorrow 09:00, room B. Bring your badge. Reply if you cannot attend.", recipients: "Employees scheduled tomorrow (DC-A)" },
};

/* generic fallback demo when no bespoke one exists */
function genericDemo(kind, s) {
  const ctx = `${s.name} — Northwind Retail, ${PROCS[s.process].name.toLowerCase()}. ${s.imp || ""}`.trim();
  switch (kind) {
    case "draft": return { brief: ctx };
    case "refine": return { draft: `Initial draft for: ${s.name}.`, feedback: "Make it clearer and add the missing detail." };
    case "translate": return { text: `Sample HR text for: ${s.name}.`, lang: "Dutch" };
    case "extract": return { raw: ctx };
    case "classify": return { record: ctx };
    case "qa": return { source: `Expected outcome for: ${s.name}.`, actual: `Actual outcome for: ${s.name} (with a small discrepancy).` };
    case "schedule": return { constraints: ctx };
    case "notify": return { context: ctx, recipients: s.role };
    case "orchestrate": return { task: ctx };
    default: return { trigger: ctx };
  }
}

/* ---------- public API ---------- */
export function deriveTool(s) {
  const kind = kindFor(s);
  if (kind === "human") return null;
  const k = KINDS[kind];
  const bespoke = DEMOS[s.id] || {};
  const gd = genericDemo(kind, s); // guarantees a sensible demo for every input id
  return {
    id: s.id, kind, title: s.name, kindLabel: k.label, blurb: k.blurb, run: k.run,
    model: k.model, maxTokens: k.maxTokens,
    inputs: k.inputs.map((inp) => ({
      ...inp,
      demo: bespoke[inp.id] != null && bespoke[inp.id] !== "" ? bespoke[inp.id] : (gd[inp.id] || ""),
    })),
  };
}

// UI-facing (safe to ship to browser)
export function getToolUI(id) {
  const s = stepById[id];
  if (!s) return null;
  const t = deriveTool(s);
  if (!t) return null;
  const { model, maxTokens, ...ui } = t;
  return ui;
}

// server-facing: build the provider request for a step
export function buildMessages(id, inputs) {
  const s = stepById[id];
  if (!s) return null;
  const t = deriveTool(s);
  if (!t) return null;
  const k = KINDS[t.kind];
  const lines = [
    `Process: ${PROCS[s.process].name}`,
    `Step: ${s.name}`,
    s.imp ? `Automation intent: ${s.imp}` : "",
    "",
    "Inputs:",
  ];
  for (const inp of t.inputs) {
    const raw = inputs && inputs[inp.id] != null ? String(inputs[inp.id]) : "";
    lines.push(`- ${inp.label}: ${raw.slice(0, 4000) || "(empty)"}`);
  }
  return {
    model: t.model,
    max_tokens: t.maxTokens,
    messages: [
      { role: "system", content: k.system },
      { role: "user", content: lines.filter(Boolean).join("\n") },
    ],
  };
}
