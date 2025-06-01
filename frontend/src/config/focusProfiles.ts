export interface FocusProfile {
  id: string;
  name: string;
  cycleName: string;
  work: number;
  break: number;
  longBreak: number;
  description: string;
  useCases: string[];
  research: string;
  tips: string;
  color: string;
  icon: string;
}

export const FOCUS_PROFILES: FocusProfile[] = [
  {
    id: "short",
    name: "Short Cycle",
    cycleName: "25-5",
    work: 25,
    break: 5,
    longBreak: 15,
    description: "Traditional Pomodoro ",
    useCases: ["admin", "emails"],
    research: "Francesco Cirillo",
    tips: "take a break after 4 sessions",
    color: "#E74C3C",
    icon: "🍅",
  },
  {
    id: "medium-balanced",
    name: "Medium Cycle",
    cycleName: "50-10",
    work: 50,
    break: 10,
    longBreak: 30,
    description: "Extended focus sessions",
    useCases: ["moderate deep work", "creative writing"],
    research: "",
    tips: "",
    color: "#3498DB",
    icon: "📘",
  },
];

export const getProfileById = (id: string): FocusProfile | undefined => {
  return FOCUS_PROFILES.find((p) => p.id === id);
};

export const getDefaultProfile = (): FocusProfile => {
  return FOCUS_PROFILES[0];
};

export const formatCycleName = (profile: FocusProfile): string => {
  return `${profile.cycleName} (${profile.work}min work, ${profile.break}min break)`;
};
