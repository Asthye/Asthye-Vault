import React, { useState } from 'react';
import { ModelAsset, Category } from '../types.ts';
import CategoryBadge from './CategoryBadge.tsx';

interface ModelCardProps {
  asset: ModelAsset;
  category: Category;
  onDelete: (id: string) => void;
  onEdit: (asset: ModelAsset) => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ asset, category, onDelete, onEdit }) => {
  const [imageAlignment, setImageAlignment] = useState<'object-center' | 'object-top'>('object-center');

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    // If height is greater than OR EQUAL to width (portrait or square), align to top to show faces/heads
    if (naturalHeight >= naturalWidth) {
      setImageAlignment('object-top');
    }
  };

  return (
    <div 
      className="group relative glass platinum-card rounded-2xl overflow-hidden flex flex-col h-full border-l-4"
      style={{ borderLeftColor: category.color }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img 
          src={asset.imageUrl || `https://picsum.photos/seed/${asset.id}/400/300`} 
          alt={asset.name}
          onLoad={handleImageLoad}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${imageAlignment}`}
        />
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6">
          <a 
            href={asset.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-white text-slate-900 rounded-full text-sm font-bold shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
          >
            Open Source
          </a>
        </div>
        
        {/* Action Buttons */}
        <div className="absolute top-3 right-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex space-x-2">
           <button 
            onClick={(e) => { e.preventDefault(); onEdit(asset); }}
            className="p-2 bg-white/90 hover:bg-indigo-50 text-indigo-600 rounded-full shadow-lg transition-colors border border-indigo-100"
            title="Edit asset"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
             </svg>
           </button>
           <button 
            onClick={(e) => { e.preventDefault(); onDelete(asset.id); }}
            className="p-2 bg-white/90 hover:bg-red-50 text-red-500 rounded-full shadow-lg transition-colors border border-red-100"
            title="Remove from archive"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
             </svg>
           </button>
        </div>
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <CategoryBadge name={category.name} color={category.color} />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(asset.createdAt).getFullYear()}</span>
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors tracking-tight">
          {asset.name}
        </h3>
        
        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4 flex-grow italic">
          {asset.description || 'A digital masterpiece waiting for its next mod project.'}
        </p>
        
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {asset.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-slate-100/80 border border-slate-200/50 rounded-md text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                #{tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-[9px] text-slate-400 font-bold self-center">+{asset.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelCard;