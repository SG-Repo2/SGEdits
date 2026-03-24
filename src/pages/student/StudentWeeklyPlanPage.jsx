import { useMemo, useState } from 'react';
import { usePortal } from '../../app/providers/PortalProvider';
import { EmptyState } from '../../components/common/EmptyState';
import { MetricCard } from '../../components/common/MetricCard';
import { PageIntro } from '../../components/common/PageIntro';
import { SectionCard } from '../../components/common/SectionCard';
import { WeekNavigator } from '../../components/common/WeekNavigator';
import { WeeklyPlanBoard } from '../../components/common/WeeklyPlanBoard';
import { addWeeks, getStartOfWeek, getWeekRangeLabel } from '../../utils/date';
import { formatHours, formatPercent } from '../../utils/formatters';
import { getCurrentWeeklyPlan } from '../../utils/selectors';
import { getPlanId, summarizeWeeklyPlan } from '../../features/schedules/utils';

export function StudentWeeklyPlanPage() {
  const { currentStudent, weeklyPlans, updateWeeklyPlan } = usePortal();
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => addWeeks(getStartOfWeek(), weekOffset), [weekOffset]);
  const plan = currentStudent ? getCurrentWeeklyPlan(weeklyPlans, currentStudent.id, weekStart) : null;
  const summary = summarizeWeeklyPlan(plan);

  if (!currentStudent) {
    return <EmptyState description="Choose a student demo profile to view the weekly plan." title="Student profile missing" />;
  }

  const toggleComplete = (dayKey, itemId) => {
    if (!plan || !plan.published) return;
    const planId = getPlanId(currentStudent.id, weekStart);
    updateWeeklyPlan(planId, (currentPlan) => ({
      ...currentPlan,
      days: {
        ...currentPlan.days,
        [dayKey]: currentPlan.days[dayKey].map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item)),
      },
    }));
  };

  return (
    <div className="page-stack">
      <PageIntro
        description="Weekly study blocks are seeded locally and completion is stored in the browser to keep the demo interactive."
        eyebrow="Student Portal"
        title="Weekly plan"
      />

      <WeekNavigator
        label={getWeekRangeLabel(weekStart)}
        onCurrent={() => setWeekOffset(0)}
        onNext={() => setWeekOffset((value) => value + 1)}
        onPrevious={() => setWeekOffset((value) => value - 1)}
      />

      {plan && plan.published ? (
        <>
          <div className="metric-grid metric-grid--three">
            <MetricCard helper={`${summary.completedBlocks} of ${summary.totalBlocks} blocks`} label="Completion" value={formatPercent(summary.completionRate)} />
            <MetricCard helper="Across the published plan" label="Completed hours" value={formatHours(summary.completedHours)} />
            <MetricCard helper="Coach published this week" label="Planned hours" value={formatHours(summary.totalHours)} />
          </div>

          <SectionCard description={plan.coachNote} title="This week’s blocks">
            <WeeklyPlanBoard mode="student" onToggleComplete={toggleComplete} plan={plan} />
          </SectionCard>
        </>
      ) : (
        <EmptyState description="A published weekly plan is not available for this week yet. Check back after your coach publishes it." title="No published plan" />
      )}
    </div>
  );
}
