import { SAGE_COLORS } from './theme';

// Task-specific colors (mapped to sage theme)
export const TASK_COLORS = {
  total: SAGE_COLORS.sage[500],
  todo: SAGE_COLORS.neutral[500],
  inProgress: SAGE_COLORS.gold[500],
  completed: SAGE_COLORS.sage[600],
};

// Priority colors
export const PRIORITY_COLORS = {
  urgent: SAGE_COLORS.terracotta[500],
  high: SAGE_COLORS.gold[600],
  medium: SAGE_COLORS.sage[400],
  low: SAGE_COLORS.neutral[400],
};

// Matrix quadrant colors
export const MATRIX_COLORS = {
  doFirst: {
    background: SAGE_COLORS.terracotta[50],
    border: SAGE_COLORS.terracotta[400],
    text: SAGE_COLORS.terracotta[800],
  },
  schedule: {
    background: SAGE_COLORS.sage[50],
    border: SAGE_COLORS.sage[400],
    text: SAGE_COLORS.sage[800],
  },
  delegate: {
    background: SAGE_COLORS.gold[50],
    border: SAGE_COLORS.gold[400],
    text: SAGE_COLORS.gold[800],
  },
  eliminate: {
    background: SAGE_COLORS.neutral[100],
    border: SAGE_COLORS.neutral[400],
    text: SAGE_COLORS.neutral[700],
  },
};

// Focus profile colors
export const FOCUS_PROFILE_COLORS = {
  classicFocus: SAGE_COLORS.sage[500],
  extendedFocus: SAGE_COLORS.sage[600],
  flowState: SAGE_COLORS.gold[500],
  quickWins: SAGE_COLORS.terracotta[400],
};

// Session type colors
export const SESSION_COLORS = {
  FOCUS: SAGE_COLORS.sage[500],
  SHORT_BREAK: SAGE_COLORS.sage[400],
  LONG_BREAK: SAGE_COLORS.gold[500],
};

// Chart colors for analytics
export const CHART_COLORS = {
  productivity: SAGE_COLORS.sage[500],
  focusScore: SAGE_COLORS.sage[400],
  tasks: SAGE_COLORS.terracotta[400],
  goals: SAGE_COLORS.gold[500],

  // Time of day colors
  morning: SAGE_COLORS.gold[400],
  afternoon: SAGE_COLORS.sage[400],
  evening: SAGE_COLORS.terracotta[400],
  night: SAGE_COLORS.neutral[500],

  // Gradient sets
  gradients: {
    sage: [SAGE_COLORS.sage[300], SAGE_COLORS.sage[500], SAGE_COLORS.sage[700]],
    warm: [SAGE_COLORS.gold[300], SAGE_COLORS.terracotta[400], SAGE_COLORS.terracotta[600]],
    neutral: [SAGE_COLORS.neutral[300], SAGE_COLORS.neutral[500], SAGE_COLORS.neutral[700]],
  },
};

// Category default colors (sage-based palette)
export const CATEGORY_COLORS = [
  SAGE_COLORS.sage[500],
  SAGE_COLORS.terracotta[500],
  SAGE_COLORS.gold[500],
  SAGE_COLORS.sage[600],
  SAGE_COLORS.terracotta[400],
  SAGE_COLORS.gold[400],
  SAGE_COLORS.sage[400],
  SAGE_COLORS.neutral[600],
];

// Status colors
export const STATUS_COLORS = {
  success: SAGE_COLORS.sage[600],
  warning: SAGE_COLORS.gold[500],
  error: SAGE_COLORS.terracotta[500],
  info: SAGE_COLORS.sage[400],
};

export default SAGE_COLORS;
