import { students } from './students';

const coachProfile = {
  id: 'coach-thomas',
  role: 'coach',
  name: 'Thomas',
  email: 'thomas@acethedat.com',
  label: 'Coach Workspace',
  homePath: '/coach/dashboard',
};

const studentProfiles = students.map((student) => ({
  id: `student-${student.id}`,
  role: 'student',
  name: student.name,
  email: student.email,
  label: `${student.name} Portal`,
  studentId: student.id,
  homePath: '/student/dashboard',
}));

export const demoProfiles = [coachProfile, ...studentProfiles];
