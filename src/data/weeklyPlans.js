import { students } from './students';
import { createSeedWeeklyPlans } from '../features/schedules/utils';

export const weeklyPlans = createSeedWeeklyPlans(students);
