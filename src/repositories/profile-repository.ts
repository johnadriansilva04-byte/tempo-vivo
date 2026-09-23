import { agenda, lifePrologue, milestones, profile, projects } from "@/mock/profile";
export const profileRepository = { getProfile: () => profile, getAgenda: () => agenda, getProjects: () => projects, getMilestones: () => milestones, getLifePrologue: () => lifePrologue };
