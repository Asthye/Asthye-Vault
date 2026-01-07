import React from 'react';
import { Category } from './types.ts';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Assets', color: '#6366f1' },
  { id: 'cars', name: 'Cars', color: '#ef4444' },
  { id: 'characters', name: 'Characters', color: '#10b981' },
  { id: 'weapons', name: 'Weapons', color: '#8b5cf6' },
  { id: 'props', name: 'Props', color: '#ec4899' },
  { id: 'environments', name: 'Environments', color: '#06b6d4' },
];

export const CATEGORY_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#94a3b8', // slate
];