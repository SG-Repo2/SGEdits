// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// ACE THE DAT â SEED DATA
// Complete demo data for the portal
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export const SECTIONS = ['Bio', 'GChem', 'OChem', 'PAT', 'QR', 'RC', 'SNS'];

export const ERROR_CATEGORIES = {
  1: { label: 'Knowledge Gap', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', desc: "Didn't know it â never learned or forgot completely" },
  2: { label: 'Classic Mix-Up', color: '#f97316', bg: 'rgba(249,115,22,0.12)', desc: 'Confused two similar things â had the wrong model in your head' },
  3: { label: 'Brain Fart', color: '#eab308', bg: 'rgba(234,179,8,0.12)', desc: 'You know this â just blanked or overthought it' },
  4: { label: 'Silly Mistake', color: '#C9A84C', bg: 'rgba(201,168,76,0.12)', desc: 'Misread, rushed, or picked the wrong bubble' },
  5: { label: 'Ran Out of Time', color: '#9333ea', bg: 'rgba(147,51,234,0.12)', desc: "Knew how to solve it but the clock beat you" },
};

export const TASK_CATEGORIES = {
  Daily: { bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)', color: 'rgba(147,190,255,0.85)' },
  Core: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.09)', color: 'rgba(244,237,224,0.45)' },
  Review: { bg: 'rgba(147,51,234,0.09)', border: 'rgba(147,51,234,0.18)', color: 'rgba(192,168,224,0.8)' },
  'RC Prep': { bg: 'rgba(201,168,76,0.09)', border: 'rgba(201,168,76,0.2)', color: 'rgba(201,168,76,0.8)' },
  Bonus: { bg: 'rgba(22,163,74,0.09)', border: 'rgba(22,163,74,0.18)', color: 'rgba(100,200,140,0.8)' },
  Rest: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', color: 'rgba(244,237,224,0.28)' },
  Prep: { bg: 'rgba(147,51,234,0.09)', border: 'rgba(147,51,234,0.18)', color: 'rgba(192,168,224,0.8)' },
  Session: { bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)', color: 'rgba(147,190,255,0.85)' },
  Planning: { bg: 'rgba(22,163,74,0.09)', border: 'rgba(22,163,74,0.18)', color: 'rgba(100,200,140,0.8)' },
};

// ââ PROFILES ââ
export const demoProfiles = [
  { id: 'coach-thomas', role: 'coach', name: 'Thomas', label: 'Coach Workspace', homePath: '/coach/dashboard' },
  { id: 'student-haniyeh', role: 'student', name: 'Haniyeh', studentId: 'haniyeh', label: 'Haniyeh Portal', homePath: '/student/dashboard' },
  { id: 'student-arianna', role: 'student', name: 'Arianna', studentId: 'arianna', label: 'Arianna Portal', homePath: '/student/dashboard' },
];

// ââ STUDENTS ââ
export const demoStudents = [
  {
    id: 'haniyeh', name: 'Haniyeh', initials: 'H', color: '#C9A84C',
    status: 'Active', program: 'Accelerator', phase: 'Week 1',
    targetScore: 23, testDate: '2026-06-15',
    sections: { Bio: 17, GChem: 19, OChem: 14, PAT: 16, QR: 18, RC: 15 },
    predicted: 19, ceiling: 24,
    weakAreas: ['OChem mechanisms', 'RC passage mapping', 'PAT hole punching'],
    coachNote: `You've done the diagnostic â now we build. This week has two priorities: OChem and RC. OC is where the gap is clearest. RC is newer ground, but the 5-step system will change how you read passages completely.\n\nWork the MQL every single day. When you miss a question, write the correct reasoning in your own words before you move on.`,
    focusTags: ['OChem decision tree', 'RC 5-step system', 'MQL every day', 'QR setup habit', 'PAT hole punching'],
  },
  {
    id: 'arianna', name: 'Arianna', initials: 'A', color: '#7fc8a0',
    status: 'Completed', program: 'Elite Mastery', phase: 'Week 8',
    targetScore: 22, testDate: '2026-04-01',
    sections: { Bio: 20, GChem: 21, OChem: 19, PAT: 18, QR: 22, RC: 20 },
    predicted: 22, ceiling: 24,
    weakAreas: ['PAT speed', 'Bio detail retention'],
    coachNote: 'Strong across the board. Focus on execution discipline and maintaining confidence.',
    focusTags: ['Maintain momentum', 'PAT speed drills', 'Test-day simulation'],
  },
];

// ââ WEEKLY PLAN â HANIYEH WEEK 1 ââ
export const haniyehWeekPlan = {
  id: 'wp-haniyeh-w1',
  studentId: 'haniyeh',
  weekStart: '2026-03-23',
  title: "Haniyeh's Study Plan",
  weekLabel: 'Week 1 Â· March 23â29, 2026',
  weeklyGoal: 'Build OC decision tree habit. Learn RC 5-step system. MQL every day.',
  coachSummary: 'Two priorities above everything: OChem and RC. OC is where the gap is clearest. The decision tree replaces random memorization with a 5-step system.',
  days: [
    {
      id: 0, label: 'Monday', short: 'Mon', date: 'March 23',
      color: 'rgba(201,168,76,0.85)', bg: 'rgba(201,168,76,0.07)',
      time: 'Target: 3.5 hrs total',
      triage: 'Short on time? Cut GC. PAT + OC + QR are non-negotiable.',
      tip: 'Bootcamp Concept Cards before HP questions â build the mental model before applying it.',
      tasks: [
        { id: 'm1', text: 'PAT â 10 hole punching Qs (90 sec max each) + 10 TFE Qs', cat: 'Daily', section: 'PAT', mins: 30 },
        { id: 'm2', text: 'Bio â 2 targeted Bootcamp Bio Bites from PT2 MQL flags. Write summary after each.', cat: 'Daily', section: 'Bio', mins: 20 },
        { id: 'm3', text: 'OC Bootcamp Concept Cards â functional groups + reaction types from PT2', cat: 'Core', section: 'OChem', mins: 30 },
        { id: 'm4', text: 'OC Bootcamp HP questions â 10â15 Qs on mechanisms from today\'s Concept Cards', cat: 'Core', section: 'OChem', mins: 40 },
        { id: 'm5', text: 'MQL from PT2 â flag any OC patterns repeating. Name Error Type for each.', cat: 'Review', section: 'OChem', mins: 20 },
        { id: 'm6', text: 'QR â 10 word problem setups. Draw equation before calculating. Every one.', cat: 'Core', section: 'QR', mins: 25 },
        { id: 'm7', text: 'GC: 1 Bootcamp HP set on your weakest MQL concept. 20 min max.', cat: 'Review', section: 'GChem', mins: 20 },
      ],
    },
    {
      id: 1, label: 'Tuesday', short: 'Tue', date: 'March 24',
      color: 'rgba(201,168,76,0.85)', bg: 'rgba(201,168,76,0.07)',
      time: 'Target: 3.5 hrs total',
      triage: 'Short on time? Cut GC review. OC MQL habit and QR are non-negotiable.',
      tip: 'The MQL habit is the single highest-ROI thing you can do today.',
      tasks: [
        { id: 't1', text: 'PAT â 10 hole punching Qs timed + 10 keyhole Qs', cat: 'Daily', section: 'PAT', mins: 30 },
        { id: 't2', text: 'Bio â 2 targeted Bio Bites from MQL flags. Summary after each.', cat: 'Daily', section: 'Bio', mins: 20 },
        { id: 't3', text: 'OC Bootcamp HP questions â 20 Qs timed. Use Monday\'s Concept Cards.', cat: 'Core', section: 'OChem', mins: 50 },
        { id: 't4', text: 'After each wrong OC answer: write correct reasoning in MQL. This IS the habit.', cat: 'Core', section: 'OChem', mins: 20 },
        { id: 't5', text: 'QR â 10 word problem setups. Draw equation before you calculate.', cat: 'Core', section: 'QR', mins: 25 },
        { id: 't6', text: 'GC: review PT2 MQL GC flags â categorize as Knowledge Gap or Silly Mistake.', cat: 'Review', section: 'GChem', mins: 20 },
      ],
    },
    {
      id: 2, label: 'Wednesday', short: 'Wed', date: 'March 25',
      color: 'rgba(147,51,234,0.85)', bg: 'rgba(147,51,234,0.07)',
      isToday: true,
      time: 'Target: 3 hrs total',
      triage: 'Short on time? Skip SNS. PAT + OC decision tree + RC rules card are priority.',
      tip: 'Today is strategy, not drilling. Mental frameworks over reps.',
      tasks: [
        { id: 'w1', text: 'PAT â 10 hole punching Qs + 10 angle ranking Qs', cat: 'Daily', section: 'PAT', mins: 30 },
        { id: 'w2', text: 'Bio â 2 targeted Bio Bites from MQL flags. Summary after each.', cat: 'Daily', section: 'Bio', mins: 20 },
        { id: 'w3', text: 'OC: Decision tree â 5 steps on 3â5 PT2 missed questions. Don\'t solve. Name the type.', cat: 'Core', section: 'OChem', mins: 30 },
        { id: 'w4', text: 'RC: Read the Bootcamp RC Rules Card â all 5 steps. No passages yet.', cat: 'RC Prep', section: 'RC', mins: 15 },
        { id: 'w5', text: 'RC: Read question-first annotation guide â label types (F/T/M/I).', cat: 'RC Prep', section: 'RC', mins: 10 },
        { id: 'w6', text: 'MQL Review â PT2 OC section: assign Error Types to every missed OC Q.', cat: 'Review', section: 'OChem', mins: 20 },
        { id: 'w7', text: 'QR â 10 word problem setups. Check: does your setup match the question?', cat: 'Core', section: 'QR', mins: 25 },
        { id: 'w8', text: 'SNS â 10 Bootcamp SNS format Qs (15 min max). Flag surprises.', cat: 'Review', section: 'SNS', mins: 15 },
      ],
    },
    {
      id: 3, label: 'Thursday', short: 'Thu', date: 'March 26',
      color: 'rgba(22,163,74,0.85)', bg: 'rgba(22,163,74,0.07)',
      time: 'Target: 3 hrs total Â· Bio cap: 60 min',
      triage: 'Short on time? Skip adjacent Bio Bites. MQL-targeted Bites and QR non-negotiable.',
      tip: 'MQL-first on Bio â review what you missed, not everything.',
      tasks: [
        { id: 'th1', text: 'PAT â 10 hole punching Qs (accuracy focus) + 10 cube counting Qs', cat: 'Daily', section: 'PAT', mins: 30 },
        { id: 'th2', text: 'MQL-first Bio: find every missed Bio Q, locate specific Bootcamp Bio Bite.', cat: 'Core', section: 'Bio', mins: 25 },
        { id: 'th3', text: 'Bio Bites: do the specific flagged Bites â targeted, not random. Summary after.', cat: 'Core', section: 'Bio', mins: 25 },
        { id: 'th4', text: 'QR â 10 word problem setups. Process of elimination on answer formats first.', cat: 'Core', section: 'QR', mins: 25 },
        { id: 'th5', text: 'OC â 10 HP questions using Wednesday\'s decision tree. Name type before solving.', cat: 'Review', section: 'OChem', mins: 30 },
      ],
    },
    {
      id: 4, label: 'Friday', short: 'Fri', date: 'March 27',
      color: 'rgba(201,168,76,0.85)', bg: 'rgba(201,168,76,0.06)',
      time: 'Target: 3 hrs total Â· Stop at 3 hrs',
      triage: 'Short on time? Cut RC card recall. OC timed set and QR are priority.',
      tip: 'Friday is application day â everything built MonâThu gets tested under pressure. Stop by 7pm.',
      tasks: [
        { id: 'f1', text: 'PAT â 10 hole punching Qs timed (under 90 sec each) + 10 pattern folding Qs', cat: 'Daily', section: 'PAT', mins: 30 },
        { id: 'f2', text: 'Bio â 2 targeted Bio Bites from MQL flags. Last Bio before Saturday.', cat: 'Daily', section: 'Bio', mins: 20 },
        { id: 'f3', text: 'OC Bootcamp: 20 timed questions. Apply decision tree. Name type before solving.', cat: 'Core', section: 'OChem', mins: 45 },
        { id: 'f4', text: 'OC: After each wrong answer â write which decision tree step broke down.', cat: 'Core', section: 'OChem', mins: 15 },
        { id: 'f5', text: 'QR â 15 word problem setups. Equation structure before calculation.', cat: 'Core', section: 'QR', mins: 30 },
        { id: 'f6', text: 'RC: Re-read RC Rules Card. Write all 5 steps from memory. No passages.', cat: 'RC Prep', section: 'RC', mins: 15 },
        { id: 'f7', text: 'Stop studying. Rest tonight. Walk into Saturday prepared, not exhausted.', cat: 'Rest', section: null, mins: 0 },
      ],
    },
    {
      id: 5, label: 'Saturday', short: 'Sat', date: 'March 28',
      color: 'rgba(147,112,219,0.85)', bg: 'rgba(147,112,219,0.07)',
      isSession: true,
      time: 'Session: 75â90 min',
      triage: 'If time runs short: RC passage is non-negotiable. OC review second.',
      tip: 'Two goals: (1) RC system in action â 1 passage walkthrough. (2) Close OC loop from the week.',
      tasks: [
        { id: 's1', text: 'Bring completed MQL â PT2, OC and GC sections filled out. This is the agenda.', cat: 'Prep', section: null, mins: 5 },
        { id: 's2', text: 'RC â Walk through 1 passage: read Qs first â label types â skim â answer by ease', cat: 'Session', section: 'RC', mins: 25 },
        { id: 's3', text: 'RC â Debrief: which Q types appeared? Where did 5-step help or break down?', cat: 'Session', section: 'RC', mins: 10 },
        { id: 's4', text: 'OC â Review 3 hardest MQL Qs: What Â· Why Â· Fix for each', cat: 'Session', section: 'OChem', mins: 20 },
        { id: 's5', text: 'OC â Walk through decision tree on 1 Q together. Does habit feel natural?', cat: 'Session', section: 'OChem', mins: 10 },
        { id: 's6', text: 'Set PT3 date. No test scheduled = no way to measure if this week worked.', cat: 'Planning', section: null, mins: 5 },
      ],
    },
    {
      id: 6, label: 'Sunday', short: 'Sun', date: 'March 29',
      color: 'rgba(244,237,224,0.3)', bg: 'rgba(255,255,255,0.02)',
      time: 'Rest day',
      triage: '',
      tip: '',
      tasks: [],
    },
  ],
};

// ââ SECTION FRAMEWORKS ââ
export const sectionFrameworks = {
  OChem: {
    badge: 'Priority This Week', badgeColor: '#9333ea',
    status: 'Focus', statusColor: '#9333ea',
    tagline: 'The gap is real â and closeable fast with the right framework',
    where: "You recognize reaction families when you see them, but under time pressure the mechanism breaks down â you reach for a rule before identifying the reaction type. That's exactly what the decision tree solves.",
    approach: [
      { text: 'Bootcamp Concept Cards before HP questions, every time. Mental model first, application second.', color: '#9333ea' },
      { text: 'On Wednesday â use the decision tree out loud on 3â5 PT2 missed questions. Don\'t solve them. Run Steps 1â5 verbally.', color: '#9333ea' },
      { text: 'After every wrong answer â name which step broke down. This is what you bring to Saturday.', color: '#9333ea' },
    ],
    watch: 'Same reaction type appearing repeatedly in your MQL (SN1/SN2, carbonyl, elimination). That\'s a Classic Mix-Up. Rebuild from scratch with the decision tree.',
    open: true,
  },
  RC: {
    badge: 'New System This Week', badgeColor: '#C9A84C',
    status: 'Building', statusColor: '#C9A84C',
    tagline: 'Learning a new approach â give it the week before you judge it',
    where: "RC is newer ground. The 5-step system feels slower at first because it's the opposite of how most students read. The goal this week is not speed â it's building the habit.",
    approach: [
      { text: 'Step 1 â Read all questions before the passage. Label each: F (fact), T (tone), M (main idea), I (inference).', color: '#C9A84C' },
      { text: 'Step 2 â Skim passage with question list in mind. Mark each paragraph\'s main point in 3 words.', color: '#C9A84C' },
      { text: 'Step 3 â Return to passage for every fact question. Never answer from memory.', color: '#C9A84C' },
      { text: 'Step 4 â Answer fact questions first (fastest), then inference, then tone/main idea last.', color: '#C9A84C' },
      { text: 'Step 5 â For tone questions: find opinion signal word before answering.', color: '#C9A84C' },
    ],
    watch: 'Getting fact questions wrong = answering from memory instead of returning. Getting tone questions wrong = missing opinion signal words.',
    open: true,
  },
  GChem: {
    badge: 'Solid Foundation', badgeColor: '#2563eb',
    status: 'Strong', statusColor: '#2563eb',
    tagline: "Strong here â don't let it steal time from OC",
    where: "GChem is a real strength. PT2 flags are mostly Type 4 (Silly Mistake) errors. The risk is over-investing here and starving OC.",
    approach: [
      { text: 'One Bootcamp HP set on your single weakest MQL concept â then stop. 20 minutes max.', color: '#2563eb' },
      { text: 'Check the error type before assuming knowledge gap. Most GC errors are Silly Mistakes â fast fix, not content review.', color: '#2563eb' },
    ],
    watch: 'Spending more than 30 minutes on GC in any single session = comfort studying. Close it and open OC.',
    open: false,
  },
  Bio: {
    badge: 'Steady', badgeColor: '#16a34a',
    status: 'Solid', statusColor: '#16a34a',
    tagline: 'Your approach just needs to be more targeted â not more time',
    where: "Bio is steady. The issue is random review vs. targeted MQL-driven review.",
    approach: [
      { text: 'Start with MQL, not Bootcamp. Find every Bio miss, then find the specific Bio Bite.', color: '#16a34a' },
      { text: 'Then do one adjacent Bite. Prevents isolated memorization.', color: '#16a34a' },
      { text: 'Write a 2-sentence summary after every Bite â no copying, no looking.', color: '#16a34a' },
      { text: 'Hard cap: 2 Bites per day + summaries, then stop.', color: '#16a34a' },
    ],
    watch: '3rd+ time rule: If a Bio concept appears in your MQL more than twice â it\'s PRIORITY. Bring it to Saturday.',
    open: false,
  },
  PAT: {
    badge: 'Daily â 30 Min', badgeColor: '#6495ed',
    status: 'Maintaining', statusColor: '#6495ed',
    tagline: 'Hole punching is the priority sub-type this week',
    where: "PAT is maintenance mode with focused hole punching intervention.",
    approach: [
      { text: '10 hole punching Qs first â always. Use 4-step method every time.', color: '#6495ed' },
      { text: '10 Qs rotating: Mon TFE Â· Tue Keyholes Â· Wed Angle ranking Â· Thu Cube counting Â· Fri Pattern folding', color: '#6495ed' },
      { text: 'After any wrong hole punching Q â redraw the fold sequence.', color: '#6495ed' },
    ],
    watch: 'Bring 5 hardest hole punching questions to Saturday â fold patterns that kept breaking.',
    open: false,
  },
  QR: {
    badge: 'Daily â Core Habit', badgeColor: '#10b981',
    status: 'Improving', statusColor: '#10b981',
    tagline: "The math is fine â the setup is where you're losing points",
    where: "QR is a quiet gap. Not calculation ability â translation. Reading a word problem and knowing what equation to build.",
    approach: [
      { text: 'Draw or write equation setup before calculating. Every time. Even when you see the answer.', color: '#10b981' },
      { text: '10 word problem Qs per day â Core task, not optional. 15 minutes.', color: '#10b981' },
      { text: 'Use process of elimination on answer formats first. Rate? Percentage? Integer?', color: '#10b981' },
    ],
    watch: 'Track: did you draw/write setup before calculating on every single question? That habit alone moves QR.',
    open: false,
  },
};

