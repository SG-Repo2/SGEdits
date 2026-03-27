import { generateWeakAreaSummary, computeAA, getWeekId } from './trendEngine';
import { SECTIONS, TASK_CATEGORIES } from '../data/seedData';

// Color scheme for days
const DAY_COLORS = [
  { color: 'rgba(201,168,76,0.85)', bg: 'rgba(201,168,76,0.07)' }, // Mon - gold
  { color: 'rgba(201,168,76,0.85)', bg: 'rgba(201,168,76,0.07)' }, // Tue - gold
  { color: 'rgba(147,51,234,0.85)', bg: 'rgba(147,51,234,0.07)' }, // Wed - purple
  { color: 'rgba(22,163,74,0.85)', bg: 'rgba(22,163,74,0.07)' },   // Thu - green
  { color: 'rgba(201,168,76,0.85)', bg: 'rgba(201,168,76,0.06)' }, // Fri - gold
  { color: 'rgba(147,112,219,0.85)', bg: 'rgba(147,112,219,0.07)' }, // Sat - session purple
  { color: 'rgba(244,237,224,0.3)', bg: 'rgba(255,255,255,0.02)' }, // Sun - dim
];

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORTS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Get next Monday as YYYY-MM-DD
 */
export function getNextMonday() {
  const today = new Date();
  const day = today.getDay();
  const diff = (1 - day + 7) % 7 || 7; // days until Monday
  const nextMonday = new Date(today);
  nextMonday.setDate(nextMonday.getDate() + diff);
  return nextMonday.toISOString().split('T')[0];
}

/**
 * Calculate week number based on student start date
 */
export function calculateWeekNumber(student) {
  if (!student.startDate) return 1;
  const start = new Date(student.startDate);
  const now = new Date();
  const diffTime = Math.abs(now - start);
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return Math.max(1, diffWeeks);
}

/**
 * Distribute total hours across sections based on priority gaps
 * Returns an object like { Bio: 180, GChem: 240, ... } in minutes
 */
export function distributeHours(totalHours, sectionPriorities) {
  const totalMinutes = totalHours * 60;
  const sections = Object.keys(sectionPriorities);

  if (sections.length === 0) return {};

  // Calculate total gap (higher gap = higher priority)
  const gaps = sections.map(sec => sectionPriorities[sec].gap || 0);
  const totalGap = gaps.reduce((a, b) => a + b, 0);

  const distribution = {};
  sections.forEach((sec, idx) => {
    const proportion = totalGap > 0 ? gaps[idx] / totalGap : 1 / sections.length;
    distribution[sec] = Math.round(proportion * totalMinutes);
  });

  return distribution;
}

/**
 * Calculate weeks until exam
 */
function weeksUntilExam(testDate) {
  if (!testDate) return 999; // no exam set
  const exam = new Date(testDate);
  const now = new Date();
  const diffTime = exam - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
}

/**
 * Identify repeat misses: topics with 2+ errors in MQL
 */
function identifyRepeatMisses(mqlErrors) {
  const topicCounts = {};
  mqlErrors.forEach(error => {
    const topic = error.topic || error.section;
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  });
  return Object.keys(topicCounts).filter(topic => topicCounts[topic] >= 2);
}

/**
 * Analyze low confidence + conceptual errors
 */
function analyzeLowConfidenceErrors(mqlErrors) {
  return mqlErrors.filter(err =>
    err.confidence <= 2 && err.errorType === 'conceptual'
  );
}

/**
 * Analyze high confidence but wrong answers
 */
function analyzeConfidenceMismatch(mqlErrors) {
  return mqlErrors.filter(err =>
    err.confidence >= 4 && !err.correct
  );
}

/**
 * Calculate section priorities based on current scores and targets
 */
function calculateSectionPriorities(student, mqlErrors) {
  const priorities = {};

  SECTIONS.forEach(section => {
    const currentScore = student.scores?.[section] || 200;
    const targetScore = student.targets?.[section] || 240;
    const gap = Math.max(0, targetScore - currentScore);

    // Recent error count in this section
    const recentErrors = mqlErrors.filter(e => e.section === section).length;

    // Within 20 points of target = low priority
    const isStrong = gap <= 20;

    priorities[section] = {
      current: currentScore,
      target: targetScore,
      gap,
      recentErrors,
      isStrong,
      priority: isStrong ? 'low' : gap > 50 ? 'high' : 'medium',
    };
  });

  return priorities;
}

/**
 * Format a date range for week label
 */
function formatWeekLabel(weekNumber, weekStart) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const monthStart = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const monthEnd = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return `Week ${weekNumber} Â· ${monthStart}â${monthEnd}`;
}

/**
 * Generate prioritized focus areas (top 3-4)
 */
function generateFocusAreas(sectionPriorities, mqlErrors) {
  const weak = Object.entries(sectionPriorities)
    .filter(([_, data]) => data.priority === 'high')
    .sort((a, b) => b[1].gap - a[1].gap)
    .map(([sec, _]) => sec)
    .slice(0, 3);

  const repeatMisses = identifyRepeatMisses(mqlErrors);
  if (repeatMisses.length > 0) {
    weak.push(`Repeat topics: ${repeatMisses.slice(0, 2).join(', ')}`);
  }

  return weak.slice(0, 4);
}

/**
 * Generate weekly goal summary
 */
function generateWeeklyGoal(sectionPriorities, weeksLeft) {
  const highPriority = Object.entries(sectionPriorities)
    .filter(([_, d]) => d.priority === 'high')
    .map(([sec, _]) => sec);

  if (weeksLeft <= 1) {
    return 'Peak protocol: confidence maintenance, light review, test simulation.';
  } else if (weeksLeft <= 3) {
    return `Shift to timed practice and error correction. Target: strengthen ${highPriority.slice(0, 2).join(', ')}.`;
  } else {
    return `Build foundations in weak areas. Focus: ${highPriority.slice(0, 2).join(', ')}.`;
  }
}

/**
 * Generate priority summary (2-3 sentences)
 */
function generatePrioritySummary(sectionPriorities, repeatMisses, weeksLeft) {
  const topWeak = Object.entries(sectionPriorities)
    .filter(([_, d]) => d.priority === 'high')
    .map(([sec, _]) => sec)
    .slice(0, 2);

  let summary = '';

  if (repeatMisses.length > 0) {
    summary += `Repeat misses on ${repeatMisses.slice(0, 2).join(', ')} need deeper review. `;
  }

  if (topWeak.length > 0) {
    summary += `Priority focus: ${topWeak.join(' and ')}. `;
  }

  if (weeksLeft <= 3) {
    summary += 'Shift to timed practice and error correction given exam timeline.';
  } else {
    summary += 'Continue content building with targeted problem sets.';
  }

  return summary;
}

/**
 * Generate carryover tasks from previous plan and incomplete check-ins
 */
function generateCarryover(previousPlan, checkIns) {
  const carryover = [];

  if (previousPlan?.days) {
    previousPlan.days.forEach(day => {
      day.tasks?.forEach(task => {
        if (task.required && !task.completed) {
          carryover.push(`${task.text} (from ${day.dayName})`);
        }
      });
    });
  }

  if (checkIns?.didNotComplete) {
    carryover.push(...checkIns.didNotComplete);
  }

  return carryover.slice(0, 5); // limit to top 5
}

/**
 * Generate suggested session agenda items
 */
function generateSessionAgenda(mqlErrors, repeatMisses, lowConfidenceErrors) {
  const agenda = [];

  if (repeatMisses.length > 0) {
    agenda.push(`Deep dive: ${repeatMisses[0]} repeat misses`);
  }

  if (lowConfidenceErrors.length > 0) {
    agenda.push('Concept rebuild for low-confidence topics');
  }

  if (mqlErrors.length > 3) {
    agenda.push('Error pattern review â identify common mistakes');
  }

  agenda.push('Bring and review MQL from this week');

  return agenda.slice(0, 4);
}

/**
 * Generate coach note draft based on coaching rules
 */
function generateCoachNoteDraft(mqlErrors, sectionPriorities, weeksLeft, checkIns) {
  const notes = [];

  const repeatMisses = identifyRepeatMisses(mqlErrors);
  if (repeatMisses.length > 0) {
    notes.push(`Repeat misses on ${repeatMisses.join(', ')} â assign Review Block and targeted drills.`);
  }

  const lowConfErrors = analyzeLowConfidenceErrors(mqlErrors);
  if (lowConfErrors.length > 0) {
    notes.push('Low confidence + conceptual errors detected: prioritize content rebuild (concept cards, read-throughs) before timed practice.');
  }

  const confMismatches = analyzeConfidenceMismatch(mqlErrors);
  if (confMismatches.length > 0) {
    notes.push('High confidence but still wrong â student needs reasoning correction exercises and pattern recognition drills.');
  }

  const strong = Object.entries(sectionPriorities)
    .filter(([_, d]) => d.isStrong)
    .map(([sec, _]) => sec);
  if (strong.length > 0) {
    notes.push(`${strong.join(', ')} are strong â maintain with light touches only (10â15 min/day).`);
  }

  if (weeksLeft <= 1) {
    notes.push('Peak protocol: no new material, light review only, confidence maintenance.');
  } else if (weeksLeft <= 3) {
    notes.push('Exam in 3 weeks or less â shift heavily to timed practice and test simulation.');
  }

  if (checkIns?.didNotComplete && checkIns.didNotComplete.length > 0) {
    notes.push('Carryover items from last week â reduce new load to fit these in.');
  }

  return notes.slice(0, 5).join('\n');
}

/**
 * Create a single task object
 */
function createTask(id, text, category, section, mins, required = true, isCarryover = false, source = 'auto') {
  return {
    id,
    text,
    cat: category,
    section,
    mins,
    required,
    isCarryover,
    source,
  };
}

/**
 * Generate tasks for a single day
 */
function generateDayTasks(dayIndex, dayShort, dayName, timeBudgetMins, sectionPriorities, mqlErrors, carryoverItems, isSessionDay, constraints) {
  const tasks = [];
  let remainingTime = timeBudgetMins;
  let taskIndex = 0;

  // Session day: start with "Bring MQL" and prep
  if (isSessionDay) {
    tasks.push(createTask(
      `draft-${dayShort}${taskIndex++}-1`,
      'Bring all MQL and error log to session',
      TASK_CATEGORIES.SESSION,
      null,
      5,
      true,
      false,
      'auto'
    ));
    remainingTime -= 5;

    tasks.push(createTask(
      `draft-${dayShort}${taskIndex++}-2`,
      'Session prep: review this week\'s focus areas',
      TASK_CATEGORIES.SESSION,
      null,
      15,
      true,
      false,
      'auto'
    ));
    remainingTime -= 15;
  }

  // Add carryover items with priority
  const dayCarryover = carryoverItems.slice(0, 2);
  dayCarryover.forEach(item => {
    if (remainingTime > 30) {
      tasks.push(createTask(
        `draft-${dayShort}${taskIndex++}-carry`,
        item,
        TASK_CATEGORIES.REVIEW,
        null,
        Math.min(45, remainingTime - 15),
        true,
        true,
        'carryover'
      ));
      remainingTime -= Math.min(45, remainingTime - 15);
    }
  });

  // Sort weak sections by gap
  const weakSections = Object.entries(sectionPriorities)
    .filter(([_, d]) => !d.isStrong)
    .sort((a, b) => b[1].gap - a[1].gap)
    .map(([sec, _]) => sec);

  // Daily PAT if weak or maintenance
  if (weakSections.includes('PAT') || sectionPriorities.PAT.priority !== 'low') {
    if (remainingTime > 20) {
      const patMins = Math.min(30, remainingTime - 15);
      tasks.push(createTask(
        `draft-${dayShort}${taskIndex++}-pat`,
        'Daily PAT practice (20â30 questions)',
        TASK_CATEGORIES.PRACTICE,
        'PAT',
        patMins,
        true,
        false,
        'auto'
      ));
      remainingTime -= patMins;
    }
  }

  // Allocate remaining time to weakest section
  if (weakSections.length > 0 && remainingTime > 20) {
    const topWeak = weakSections[0];
    const category = dayIndex === 4 ? TASK_CATEGORIES.TIMED_PRACTICE : TASK_CATEGORIES.REVIEW;
    const text = dayIndex === 4
      ? `Timed ${topWeak} practice (${topWeak} application day)`
      : `${topWeak} problem set & review`;

    tasks.push(createTask(
      `draft-${dayShort}${taskIndex++}-weak`,
      text,
      category,
      topWeak,
      remainingTime - 5,
      true,
      false,
      'trend'
    ));
    remainingTime = 5;
  }

  // Sunday: optional very light review or rest
  if (dayIndex === 6) {
    tasks.push(createTask(
      `draft-${dayShort}${taskIndex++}-opt`,
      'Optional: light review or rest',
      TASK_CATEGORIES.REVIEW,
      null,
      0,
      false,
      false,
      'auto'
    ));
  }

  return tasks;
}

/**
 * Generate the complete weekly plan draft
 */
export function generateWeeklyDraft(student, mqlErrors = [], checkIns = {}, previousPlan = null, coachConfig = {}) {
  const studentId = student.id || 'unknown';
  const weekStart = getNextMonday();
  const weekId = getWeekId(studentId, weekStart);
  const weekNumber = calculateWeekNumber(student);
  const weeksLeft = weeksUntilExam(student.testDate);

  // Analyze errors and calculate priorities
  const repeatMisses = identifyRepeatMisses(mqlErrors);
  const lowConfidenceErrors = analyzeLowConfidenceErrors(mqlErrors);
  const confMismatches = analyzeConfidenceMismatch(mqlErrors);
  const sectionPriorities = calculateSectionPriorities(student, mqlErrors);

  // Generate content
  const focusAreas = generateFocusAreas(sectionPriorities, mqlErrors);
  const weeklyGoal = generateWeeklyGoal(sectionPriorities, weeksLeft);
  const prioritySummary = generatePrioritySummary(sectionPriorities, repeatMisses, weeksLeft);
  const carryover = generateCarryover(previousPlan, checkIns);
  const sessionAgenda = generateSessionAgenda(mqlErrors, repeatMisses, lowConfidenceErrors);
  const coachNoteDraft = generateCoachNoteDraft(mqlErrors, sectionPriorities, weeksLeft, checkIns);

  // Calculate time budget
  const weeklyHours = student.weeklyStudyHours || 15;
  const dailyBudget = Math.round((weeklyHours * 60) / 6); // 6 days, Sunday is rest

  // Generate days
  const days = [];
  const isSessionDay = student.sessionCadence === 'Weekly';
  const sessionDayIndex = 5; // Saturday

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const dayShort = DAY_SHORTS[dayIdx];
    const dayName = DAY_NAMES[dayIdx];

    // Sunday is rest
    let timeBudget = dayIdx === 6 ? 0 : dailyBudget;

    // Check constraints
    if (student.constraints) {
      const dayConstraint = student.constraints[dayName];
      if (dayConstraint?.unavailable) {
        timeBudget = 0;
      } else if (dayConstraint?.minHours) {
        timeBudget = dayConstraint.minHours * 60;
      }
    }

    const dayTasks = generateDayTasks(
      dayIdx,
      dayShort,
      dayName,
      timeBudget,
      sectionPriorities,
      mqlErrors,
      carryover,
      isSessionDay && dayIdx === sessionDayIndex,
      student.constraints
    );

    const dayColors = DAY_COLORS[dayIdx];

    days.push({
      dayIndex: dayIdx,
      dayName,
      dayShort,
      color: dayColors.color,
      bg: dayColors.bg,
      isSession: isSessionDay && dayIdx === sessionDayIndex,
      totalMins: dayTasks.reduce((sum, task) => sum + task.mins, 0),
      tasks: dayTasks,
    });
  }


  // Generate section-level blocks for CoachPlanningHub compatibility
  const BLOCK_SECTIONS = ['Bio', 'GChem', 'OChem', 'PAT', 'QR', 'RC'];
  const hourDistribution = distributeHours(weeklyHours, sectionPriorities);
  const blocks = BLOCK_SECTIONS.map(section => {
    const mins = hourDistribution[section] || 0;
    const hrs = Math.round((mins / 60) * 10) / 10;
    const sp = sectionPriorities[section] || {};
    const sectionErrs = mqlErrors.filter(e => e.section === section);
    const topics = [...new Set(sectionErrs.map(e => e.subtopic || e.topic).filter(Boolean))].slice(0, 4);
    return {
      id: 'block-' + section.toLowerCase(),
      section,
      title: section,
      hours: hrs,
      priority: sp.priority || 'medium',
      topics,
      notes: '',
    };
  });

  // Build the final draft object
  const draft = {
    id: `draft-${studentId}-${weekId}`,
    studentId,
    weekStart,
    status: 'draft',
    title: `${student.name}'s Study Plan`,
    weekLabel: formatWeekLabel(weekNumber, weekStart),
    weeklyGoal,
    prioritySummary,
    focusAreas,
    coachSummary: '', // empty for coach to fill in
    weekOf: weekStart,
    weekNumber,
    notes: coachNoteDraft,
    blocks,
    carryover,
    sessionAgenda,
    coachNoteDraft,
    days,
  };

  return draft;
}

export default {
  generateWeeklyDraft,
  getNextMonday,
  calculateWeekNumber,
  distributeHours,
};
