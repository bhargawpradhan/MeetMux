// MeetMux Control Tower — Framer Motion Library
// Reusable variants, springs, and animation presets used app-wide.

import { Variants } from 'framer-motion';

// ─── Springs ─────────────────────────────────────────────────────────────────
export const springs = {
  gentle: { type: 'spring', stiffness: 180, damping: 24 },
  snappy: { type: 'spring', stiffness: 320, damping: 28 },
  bouncy: { type: 'spring', stiffness: 240, damping: 16 },
  slow: { type: 'spring', stiffness: 100, damping: 20 },
} as const;

// ─── Page Transitions ────────────────────────────────────────────────────────
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.30, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -10, scale: 0.99, transition: { duration: 0.20, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Stagger Containers ──────────────────────────────────────────────────────
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

// ─── Stagger Child Items ─────────────────────────────────────────────────────
export const fadeUpItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.30, ease: [0.22, 1, 0.36, 1] } },
};

export const fadeInItem: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
};

export const slideRightItem: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
export const kpiCardVariants: Variants = {
  initial: { opacity: 0, y: 28, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { ...springs.gentle } },
  hover: { y: -3, scale: 1.015, transition: { duration: 0.18 } },
  tap: { scale: 0.98, transition: { duration: 0.10 } },
};

// ─── Glass Drawer (Slide In from Right) ─────────────────────────────────────
export const drawerVariants: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { ...springs.snappy } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};

// ─── Left Panel Slide In ─────────────────────────────────────────────────────
export const leftPanelVariants: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { ...springs.snappy } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};

// ─── Bottom Panel Slide Up ───────────────────────────────────────────────────
export const bottomPanelVariants: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { ...springs.gentle } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.20 } },
};

// ─── Alert Toast ─────────────────────────────────────────────────────────────
export const toastVariants: Variants = {
  initial: { opacity: 0, y: 60, scale: 0.90, x: 40 },
  animate: { opacity: 1, y: 0, scale: 1, x: 0, transition: { ...springs.snappy } },
  exit: { opacity: 0, x: 80, scale: 0.92, transition: { duration: 0.22 } },
};

// ─── Ripple (Disruption Propagation) ────────────────────────────────────────
export const rippleVariants: Variants = {
  initial: { scale: 0, opacity: 0.7 },
  animate: {
    scale: [0, 1.4, 2.5],
    opacity: [0.7, 0.4, 0],
    transition: { duration: 1.6, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.8 },
  },
};

// ─── Critical Badge Pulse ────────────────────────────────────────────────────
export const criticalPulseVariants: Variants = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(220, 38, 38, 0.4)',
      '0 0 0 8px rgba(220, 38, 38, 0)',
      '0 0 0 0 rgba(220, 38, 38, 0)',
    ],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ─── Number Counter ──────────────────────────────────────────────────────────
export const numberCounterTransition = {
  type: 'spring',
  stiffness: 200,
  damping: 30,
};

// ─── List Layout Animation ────────────────────────────────────────────────────
export const listLayoutTransition = {
  type: 'spring',
  stiffness: 200,
  damping: 30,
};

// ─── Scenario Before→After Morph ─────────────────────────────────────────────
export const scenarioMorphVariants: Variants = {
  before: { backgroundColor: 'rgba(254, 242, 199, 0.5)', borderColor: 'rgba(251, 191, 36, 0.5)' },
  after: { backgroundColor: 'rgba(254, 226, 226, 0.6)', borderColor: 'rgba(252, 165, 165, 0.6)',
    transition: { duration: 0.5, ease: 'easeInOut' } },
};
