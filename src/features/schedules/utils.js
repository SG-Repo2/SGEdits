import { addWeeks, getStartOfWeek, toISODate } from '../../utils/date';

export const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SUBJECTS = {
  Bio: { label: 'Biology', color: '#2f6c4f', surface: '#edf6ef' },
  GChem: { label: 'General Chemistry', color: '#2e5daa', surface: '#eef4ff' },
  OChem: { label: 'Organic Chemistry', color: '#7a4ec4', surface: '#f4efff' },
  PAT: { label: 'Perceptual Ability', color: '#b57b18', surface: '#fff6e4' },
  RC: { label: 'Reading Comprehension', color: '#148175', surface: '#ebfaf7' },
  QR: { label: 'Quantitative Reasoning', color: '#b7483e', surface: '#feefed' },
  Strategy: { label: 'Strategy', color: '#735c41', surface: '#f7f2eb' },
  App: { label: 'Application Support', color: '#8d5a9f', surface: '#f8effb' },
};

const TOPIC_LIBRARY = {
  Bio: ['Cell physiology', 'Genetics review', 'Systems integration', 'Anatomy refresh', 'High-yield taxonomy'],
  GChem: ['Stoichiometry set', 'Equilibrium drills', 'Thermo timing', 'Periodic trends', 'Acid-base review'],
  OChem: ['Reaction families', 'Mechanism mapping', 'Stereochemistry check', 'Spectroscopy refresh', 'Synthesis ladder'],
  PAT: ['Angle ranking', 'Keyholes', 'Cube counting', 'Hole punching', 'Pattern folding'],
  RC: ['Passage timing', 'Inference review', 'Tone questions', 'Search and destroy', 'Comparative reading'],
  QR: ['Word problems', 'Rates and ratios', 'Data analysis', 'Geometry refresh', 'Probability drills'],
  Strategy: ['Calendar cleanup', 'Study system reset', 'Warm-up review', 'Error log pass', 'Exam pacing'],
  App: ['Essay outline', 'AADSAS review', 'Interview stories', 'Personal statement revision', 'School list audit'],
};

export function getPlanId(studentId, weekStart) {
  return `${studentId}-${typeof weekStart === 'string' ? weekStart : toISODate(weekStart)}`;
}

function getTopic(section, offset) {
  const topics = TOPIC_LIBRARY[section] || ['Focused review'];
  return topics[offset % topics.length];
}

function buildCoachNote(student, weakAreas, targetExamDate) {
  const focusLine = weakAreas.length
    ? `Lean extra time into ${weakAreas.join(', ')} while keeping daily review consistent.`
    : 'Keep the week balanced across core DAT sections and review the error log every evening.';

  const examLine = targetExamDate
    ? `Target exam date: ${targetExamDate}.`
    : 'Target exam date still needs confirmation.';

  return `${focusLine} ${examLine} Thomas should review pacing at the end of the week and decide whether to increase timed sets.`;
}

export function summarizeWeeklyPlan(plan) {
  if (!plan) {
    return {
      completionRate: 0,
      completedHours: 0,
      totalHours: 0,
      totalBlocks: 0,
      completedBlocks: 0,
      sectionHours: {},
    };
  }

  const items = Object.values(plan.days || {}).flat();
  const totalHours = items.reduce((sum, item) => sum + item.hours, 0);
  const completedHours = items.filter((item) => item.completed).reduce((sum, item) => sum + item.hours, 0);
  const sectionHours = items.reduce((sum, item) => {
    sum[item.section] = (sum[item.section] || 0) + item.hours;
    return sum;
  }, {});

  return {
    completionRate: items.length ? (items.filter((item) => item.completed).length / items.length) * 100 : 0,
    completedHours,
    totalHours,
    totalBlocks: items.length,
    completedBlocks: items.filter((item) => item.completed).length,
    sectionHours,
  };
}

export function generateWeeklyPlan({
  student,
  weekStart,
  dailyHours = 3,
  weakAreas = [],
  targetExamDate,
  published = false,
  completedByDay = {},
  coachNote,
}) {
  const start = getStartOfWeek(weekStart);
  const sections = student.sections?.length ? student.sections : ['Bio', 'GChem', 'OChem', 'PAT', 'RC', 'QR'];
  const emphasizedSections = weakAreas.length ? weakAreas : sections.slice(0, Math.min(2, sections.length));
  const weightedPool = sections.flatMap((section) =>
    emphasizedSections.includes(section) ? [section, section, section] : [section, section],
  );
  const days = DAY_KEYS.reduce((collection, dayKey) => {
    collection[dayKey] = [];
    return collection;
  }, {});

  let topicOffset = student.id.charCodeAt(student.id.length - 1);

  DAY_KEYS.forEach((dayKey, dayIndex) => {
    const targetHours = dayKey === 'Sun' ? Math.max(1, dailyHours - 1) : dailyHours;
    let remainingHours = targetHours;

    if (dayKey === 'Sat' && sections.length > 3) {
      days[dayKey].push({
        id: `${dayKey}-0`,
        section: 'Strategy',
        topic: 'Full-length section set + review',
        hours: Math.min(2.5, remainingHours),
        completed: false,
      });
      remainingHours -= Math.min(2.5, targetHours);
    }

    let blockIndex = days[dayKey].length;
    while (remainingHours > 0.3) {
      const section = weightedPool[(dayIndex + blockIndex + topicOffset) % weightedPool.length];
      const hours = Number(Math.min(remainingHours, dayKey === 'Sun' ? 1 : 1.5).toFixed(1));
      days[dayKey].push({
        id: `${dayKey}-${blockIndex + 1}`,
        section,
        topic: getTopic(section, topicOffset + blockIndex + dayIndex),
        hours,
        completed: false,
      });
      remainingHours = Number((remainingHours - hours).toFixed(1));
      blockIndex += 1;
    }

    topicOffset += 1;
  });

  Object.entries(completedByDay).forEach(([dayKey, completedCount]) => {
    const count = Number(completedCount) || 0;
    days[dayKey] = (days[dayKey] || []).map((item, index) => ({
      ...item,
      completed: index < count,
    }));
  });

  return {
    id: getPlanId(student.id, start),
    studentId: student.id,
    weekStart: toISODate(start),
    dailyHours,
    weakAreas: emphasizedSections,
    targetExamDate: targetExamDate || student.targetExamDate || '',
    coachNote: coachNote || buildCoachNote(student, emphasizedSections, targetExamDate || student.targetExamDate),
    published,
    generatedAt: new Date().toISOString(),
    days,
  };
}

export function createCustomPlanItem(dayKey, position = 0) {
  return {
    id: `${dayKey}-manual-${Date.now()}-${position}`,
    section: 'Bio',
    topic: 'Custom review block',
    hours: 1,
    completed: false,
  };
}

export function createSeedWeeklyPlans(students) {
  const currentWeek = getStartOfWeek();
  const nextWeek = addWeeks(currentWeek, 1);

  const configs = [
    {
      studentId: 'S01',
      weekStart: currentWeek,
      published: true,
      dailyHours: 3,
      weakAreas: ['PAT', 'RC'],
      completedByDay: { Mon: 2, Tue: 1, Wed: 1 },
      coachNote:
        'This week should feel calm and repeatable. Finish PAT and RC blocks first, then use evening review for error logs and timing corrections.',
    },
    {
      studentId: 'S01',
      weekStart: nextWeek,
      published: false,
      dailyHours: 3,
      weakAreas: ['GChem'],
    },
    {
      studentId: 'S03',
      weekStart: currentWeek,
      published: false,
      dailyHours: 3.5,
      weakAreas: ['Bio', 'GChem'],
    },
    {
      studentId: 'S06',
      weekStart: currentWeek,
      published: true,
      dailyHours: 3.5,
      weakAreas: ['RC', 'PAT'],
      completedByDay: { Mon: 1, Tue: 1 },
    },
    {
      studentId: 'S12',
      weekStart: currentWeek,
      published: true,
      dailyHours: 2.5,
      weakAreas: ['Bio'],
      completedByDay: { Mon: 1 },
    },
  ];

  return configs.reduce((collection, config) => {
    const student = students.find((item) => item.id === config.studentId);
    if (!student) return collection;
    const plan = generateWeeklyPlan({ student, ...config });
    collection[plan.id] = plan;
    return collection;
  }, {});
}
