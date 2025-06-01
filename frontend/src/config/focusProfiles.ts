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
  verified: boolean;
}

export const FOCUS_PROFILES: FocusProfile[] = [
  {
    id: "short",
    name: "Classic Focus",
    cycleName: "25-5",
    work: 25,
    break: 5,
    longBreak: 15,
    description:
      "The time-tested approach for building consistent momentum throughout your day",
    useCases: [
      "Getting through your email inbox",
      "Quick administrative tasks",
      "Multiple short tasks in a row",
    ],
    research:
      "The Pomodoro Technique, proven effective since the 1980s. Research consistently shows that scheduled breaks improve focus and reduce mental fatigue.",
    tips: "Complete 4 cycles, then take a longer 15-minute break. This rhythm has stood the test of time for a reason, it works!",
    color: "#E74C3C",
    icon: "🍅",
    verified: true,
  },
  {
    id: "medium-balanced",
    name: "Extended Focus",
    cycleName: "50-10",
    work: 50,
    break: 10,
    longBreak: 30,
    description:
      "More time to dive deep while keeping regular breaks to stay fresh",
    useCases: [
      "Writing reports or documentation",
      "Reviewing code or documents",
      "Creative brainstorming sessions",
      "Tasks that need warm-up time",
    ],
    research:
      "A popular variation that doubles the Pomodoro timing. Many people find 50-75 minute sessions hit the sweet spot for complex work.",
    tips: "Use this when 25 minutes feels too short to hit your stride. The 10-minute break gives you real time to step away and reset.",
    color: "#3498DB",
    icon: "📘",
    verified: true,
  },
  {
    id: "long",
    name: "Flow State",
    cycleName: "90-20",
    work: 90,
    break: 20,
    longBreak: 40,
    description:
      "Sync with your brain's natural rhythm for deep, creative work",
    useCases: [
      "Creative writing or design",
      "Building complex features",
      "Strategic planning",
      "Work that requires deep immersion",
    ],
    research:
      "Based on ultradian rhythms: your brain's natural 90-minute cycles of peak alertness. Neuroscience research confirms these cycles operate throughout your waking hours.",
    tips: "Only use when well-rested and distraction-free. The 20-minute break is essential: walk, stretch, step outside. Your brain needs this recovery time. Limit to 2 cycles per day.",
    color: "#9B59B6",
    icon: "🎨",
    verified: true,
  },
  {
    id: "micro",
    name: "Quick Wins",
    cycleName: "15-3",
    work: 15,
    break: 3,
    longBreak: 10,
    description:
      "Short bursts for building focus habits or getting unstuck on tough days",
    useCases: [
      "When you're feeling scattered or overwhelmed",
      "Building focus as a new habit",
      "High-distraction environments",
      "Low-energy afternoons",
    ],
    research:
      "Inspired by ADHD research showing very frequent breaks help maintain attention. Rapid wins keep motivation high and prevent overwhelm.",
    tips: "Perfect for getting started when focus feels impossible. Chain 6-8 cycles for about 2 hours of productive work. Great for rebuilding momentum after interruptions.",
    color: "#F39C12",
    icon: "⚡",
    verified: true,
  },

  // not based on research but productivity tracking data
  {
    id: "medium-deep",
    name: "Deep Work",
    cycleName: "52-17",
    work: 52,
    break: 17,
    longBreak: 30,
    description:
      "A focused rhythm popular among remote workers and deep thinkers",
    useCases: [
      "Complex problem-solving",
      "Learning new technical skills",
      "Data analysis and research",
      "Focused remote work sessions",
    ],
    research:
      "From a 2014 productivity tracking study. While not peer-reviewed science, many people report this timing works well for sustained focus.",
    tips: "Popular for remote work where you have fewer interruptions. Use the 17-minute break to move around. The extra break time helps maintain energy across multiple sessions.",
    color: "#2980B9",
    icon: "🧠",
    verified: false,
  },
  {
    id: "balanced-hybrid",
    name: "Balanced Focus",
    cycleName: "75-33",
    work: 75,
    break: 33,
    longBreak: 45,
    description:
      "Generous breaks for sustainable energy-popular in office environments",
    useCases: [
      "Hybrid or office work with natural interruptions",
      "Back-to-back meeting days",
      "When you need all-day stamina",
      "Collaborative work environments",
    ],
    research:
      "From a 2025 productivity tracking study of office and hybrid workers. The longer breaks reflect natural workplace rhythms like coffee chats and hallway conversations.",
    tips: "The generous 33-minute break allows time for lunch prep, quick walks or casual team interactions.",
    color: "#16A085",
    icon: "⚖️",
    verified: false,
  },
];

export const getProfileById = (id: string): FocusProfile | undefined => {
  return FOCUS_PROFILES.find((p) => p.id === id);
};

export const getDefaultProfile = (): FocusProfile => {
  return FOCUS_PROFILES[0];
};

export const getVerifiedProfiles = (): FocusProfile[] => {
  return FOCUS_PROFILES.filter((p) => p.verified);
};

export const getExperimentalProfiles = (): FocusProfile[] => {
  return FOCUS_PROFILES.filter((p) => !p.verified);
};

export const formatCycleName = (profile: FocusProfile): string => {
  return `${profile.cycleName} (${profile.work}min work, ${profile.break}min break)`;
};
