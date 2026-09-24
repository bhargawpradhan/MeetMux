// MeetMux Control Tower — Utility Functions

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RiskLevel } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Risk Level Helpers ───────────────────────────────────────────────────────
export function getRiskPillClass(level: RiskLevel | string): string {
  switch (level?.toUpperCase()) {
    case 'CRITICAL': return 'risk-pill-critical';
    case 'HIGH':     return 'risk-pill-high';
    case 'MEDIUM':   return 'risk-pill-medium';
    default:         return 'risk-pill-low';
  }
}

export function getRiskColor(level: RiskLevel | string): string {
  switch (level?.toUpperCase()) {
    case 'CRITICAL': return '#DC2626';
    case 'HIGH':     return '#EA580C';
    case 'MEDIUM':   return '#D97706';
    default:         return '#2E7D32';
  }
}

export function getRiskIcon(level: RiskLevel | string): string {
  switch (level?.toUpperCase()) {
    case 'CRITICAL': return '⬤'; // filled circle + pulse
    case 'HIGH':     return '▲';
    case 'MEDIUM':   return '◆';
    default:         return '●';
  }
}

export function getBottleneckBand(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'CRITICAL', color: '#DC2626', bg: 'rgba(220,38,38,0.12)' };
  if (score >= 60) return { label: 'HIGH', color: '#EA580C', bg: 'rgba(234,88,12,0.12)' };
  if (score >= 30) return { label: 'MEDIUM', color: '#D97706', bg: 'rgba(217,119,6,0.12)' };
  return { label: 'LOW', color: '#2E7D32', bg: 'rgba(46,125,50,0.10)' };
}

// ─── Currency Formatters ──────────────────────────────────────────────────────
export function formatINR(value: number, compact = false): string {
  if (compact) {
    if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)}Cr`;
    if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
    if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
    return `₹${value.toFixed(0)}`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Date/Time ────────────────────────────────────────────────────────────────
export function formatTimestamp(ts: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(ts));
}

export function timeAgo(ts: string): string {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

// ─── Number ───────────────────────────────────────────────────────────────────
export function pct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNum(value: number, decimals = 0): string {
  return value.toLocaleString('en-IN', { maximumFractionDigits: decimals });
}
