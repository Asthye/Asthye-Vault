import React from 'react';
import { Category } from './types.ts';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Assets', color: '#6366f1' },
  { id: 'cars', name: 'Cars', color: '#ef4444' },
  { id: 'characters', name: 'Characters', color: '#10b981' },
  { id: 'weapons', name: 'Weapons', color: '#8b5cf6' },
  { id: 'props', name: 'Props', color: '#ec4899' },
];

export const CATEGORY_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#84cc16', // lime-500
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
  '#94a3b8', // slate-400
];