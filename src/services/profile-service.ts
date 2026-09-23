import { profileRepository } from "@/repositories/profile-repository";
export const profileService = { load: () => ({ profile: profileRepository.getProfile(), agenda: profileRepository.getAgenda(), projects: profileRepository.getProjects(), milestones: profileRepository.getMilestones(), prologue: profileRepository.getLifePrologue() }) };
