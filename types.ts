
export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface ModelAsset {
  id: string;
  name: string;
  sourceUrl: string;
  imageUrl: string;
  categoryId: string;
  description: string;
  tags: string[];
  createdAt: number;
}

export type SortOption = 'newest' | 'oldest' | 'alphabetical';
