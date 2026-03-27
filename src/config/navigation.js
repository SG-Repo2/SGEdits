import { LayoutDashboard, CalendarDays, BookOpen, FileText, TrendingUp, Users, Stethoscope, ClipboardList, PenTool, CheckSquare, AlertTriangle, BrainCircuit } from 'lucide-react';

export const studentNavigation = [
  { label: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Weekly Plan', to: '/student/weekly-plan', icon: CalendarDays },
  { label: 'Check-In', to: '/student/check-in', icon: CheckSquare },
  { label: 'Missed Questions', to: '/student/missed-questions', icon: AlertTriangle },
  { label: 'My Sections', to: '/student/sections', icon: BookOpen },
  { label: 'MQL Log', to: '/student/mql', icon: FileText },
  { label: 'Progress', to: '/student/progress', icon: TrendingUp },
];

export const coachNavigation = [
  { label: 'Dashboard', to: '/coach/dashboard', icon: LayoutDashboard },
  { label: 'Planning Hub', to: '/coach/planning-hub', icon: BrainCircuit },
  { label: 'Students', to: '/coach/students', icon: Users },
  { label: 'Schedule Builder', to: '/coach/schedule-builder', icon: PenTool },
  { label: 'Diagnostic', to: '/coach/diagnostic', icon: Stethoscope },
  { label: 'Session Flow', to: '/coach/session-flow', icon: ClipboardList },
];
