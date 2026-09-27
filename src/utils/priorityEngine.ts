import { Task, TaskPriority } from '../types';

export interface UrgencyMeta {
  hoursLeft: number;
  minutesLeft: number;
  isOverdue: boolean;
  isCriticalWindow: boolean; // < 3 hours
  isImminent: boolean; // < 12 hours
  displayTime: string;
  badgeLabel: string;
}

export function calculateDeadlineMeta(deadlineIso: string, referenceTime = new Date('2026-09-26T21:02:49-07:00')): UrgencyMeta {
  const deadline = new Date(deadlineIso);
  const diffMs = deadline.getTime() - referenceTime.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = diffMinutes / 60;
  const isOverdue = diffMs < 0;

  let displayTime = '';
  if (isOverdue) {
    const absMins = Math.abs(diffMinutes);
    if (absMins < 60) {
      displayTime = `${absMins}m overdue`;
    } else {
      const absHrs = Math.floor(absMins / 60);
      const remMins = absMins % 60;
      displayTime = `${absHrs}h ${remMins}m overdue`;
    }
  } else {
    if (diffMinutes < 60) {
      displayTime = `${diffMinutes}m left`;
    } else if (diffMinutes < 1440) {
      const hrs = Math.floor(diffMinutes / 60);
      const remMins = diffMinutes % 60;
      displayTime = `${hrs}h ${remMins}m left`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      const remHrs = Math.floor((diffMinutes % 1440) / 60);
      displayTime = `${days}d ${remHrs}h left`;
    }
  }

  let badgeLabel = 'On Schedule';
  if (isOverdue) badgeLabel = 'SLA Breached';
  else if (diffHours <= 2) badgeLabel = 'Critical SLA';
  else if (diffHours <= 8) badgeLabel = 'Urgent Window';
  else if (diffHours <= 24) badgeLabel = 'Due Today';

  return {
    hoursLeft: diffHours,
    minutesLeft: diffMinutes,
    isOverdue,
    isCriticalWindow: !isOverdue && diffHours <= 3,
    isImminent: !isOverdue && diffHours <= 12,
    displayTime,
    badgeLabel,
  };
}

export function computeTaskUrgencyScore(
  task: Task, 
  allTasks: Task[],
  referenceTime = new Date('2026-09-26T21:02:49-07:00')
): number {
  if (task.status === 'completed') return 0;

  const meta = calculateDeadlineMeta(task.deadline, referenceTime);
  let score = 50;

  // Deadline component (0 to 60 points)
  if (meta.isOverdue) {
    score = 98; // Highest urgency to clear incident
  } else if (meta.hoursLeft <= 1) {
    score = 95;
  } else if (meta.hoursLeft <= 3) {
    score = 88;
  } else if (meta.hoursLeft <= 6) {
    score = 78;
  } else if (meta.hoursLeft <= 12) {
    score = 68;
  } else if (meta.hoursLeft <= 24) {
    score = 58;
  } else {
    score = Math.max(10, Math.round(50 - (meta.hoursLeft / 24) * 5));
  }

  // Priority bonus
  const priorityBoost: Record<TaskPriority, number> = {
    critical: 12,
    high: 6,
    medium: 0,
    low: -6,
  };
  score += priorityBoost[task.priority];

  // Dependency factor: if this task blocks another task with high urgency, bump this task!
  const dependentTasks = allTasks.filter(t => t.dependencies.includes(task.id) && t.status !== 'completed');
  if (dependentTasks.length > 0) {
    score += Math.min(15, dependentTasks.length * 5);
  }

  // If this task itself is blocked by unfinished dependencies, reduce active runnable score slightly but keep it flagged
  const hasUnfinishedBlockers = task.dependencies.some(depId => {
    const parent = allTasks.find(t => t.id === depId);
    return parent && parent.status !== 'completed';
  });

  if (hasUnfinishedBlockers) {
    score -= 10;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Topologically and urgency sorted execution queue
 */
export function sortTasksByAutonomySchedule(
  tasks: Task[], 
  referenceTime = new Date('2026-09-26T21:02:49-07:00')
): Task[] {
  // Update urgency score on all tasks
  const tasksWithScores = tasks.map(t => ({
    ...t,
    urgencyScore: computeTaskUrgencyScore(t, tasks, referenceTime),
  }));

  return tasksWithScores.sort((a, b) => {
    // 1. Completed tasks always go to bottom
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (b.status === 'completed' && a.status !== 'completed') return -1;

    // 2. Unblocked vs Blocked: Runnable tasks go before blocked tasks
    const aIsBlocked = a.status === 'blocked';
    const bIsBlocked = b.status === 'blocked';
    if (!aIsBlocked && bIsBlocked) return -1;
    if (aIsBlocked && !bIsBlocked) return 1;

    // 3. In Progress tasks go first
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;

    // 4. Urgency score descending
    return b.urgencyScore - a.urgencyScore;
  });
}
