
import React from 'react';

interface CategoryBadgeProps {
  name: string;
  color: string;
  size?: 'sm' | 'md';
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ name, color, size = 'sm' }) => {
  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${size === 'md' ? 'px-3 py-1' : ''}`}
      style={{ 
        backgroundColor: `${color}20`, 
        borderColor: `${color}50`,
        color: color
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: color }}></span>
      {name}
    </span>
  );
};

export default CategoryBadge;
