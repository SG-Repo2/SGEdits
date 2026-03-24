import { CalendarDays, CreditCard, FilePenLine, GraduationCap, LayoutDashboard, ScrollText, Users } from 'lucide-react';

export const coachNavigation = [
  { label: 'Dashboard', to: '/coach/dashboard', icon: LayoutDashboard },
  { label: 'Students', to: '/coach/students', icon: Users },
  { label: 'Sessions', to: '/coach/sessions', icon: ScrollText },
  { label: 'Billing', to: '/coach/payments', icon: CreditCard },
  { label: 'Schedules', to: '/coach/schedules', icon: CalendarDays },
];

export const studentNavigation = [
  { label: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Self-Assessment', to: '/student/self-assessment', icon: FilePenLine },
  { label: 'Weekly Plan', to: '/student/weekly-plan', icon: CalendarDays },
  { label: 'Billing', to: '/student/payments', icon: CreditCard },
  { label: 'Sessions', to: '/student/sessions', icon: GraduationCap },
];
