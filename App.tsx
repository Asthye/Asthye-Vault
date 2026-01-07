import React, { useState, useEffect, useMemo } from 'react';
import { ModelAsset, Category, SortOption } from './types.ts';
import { DEFAULT_CATEGORIES, CATEGORY_COLORS } from './constants.tsx';
import ModelCard from './components/ModelCard.tsx';
import AddModelModal from './components/AddModelModal.tsx';

function App() {
  const [assets, setAssets] = useState<ModelAsset[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Load from LocalStorage and handle Migrations (Merge legacy Humans/Non-humans)
  useEffect(() => {
    const savedAssets = localStorage.getItem('forge_assets');
    const savedCategories = localStorage.getItem('forge_categories');
    
    if (savedAssets) {
      const parsedAssets = JSON.parse(savedAssets);
      // Migration: Remap 'humans' and 'non-humans' to the new 'characters' ID
      const migratedAssets = parsedAssets.map((asset: ModelAsset) => {
        if (asset.categoryId === 'humans' || asset.categoryId === 'non-humans') {
          return { ...asset, categoryId: 'characters' };
        }
        return asset;
      });
      setAssets(migratedAssets);
    }
    
    if (savedCategories) {
      const parsedCats = JSON.parse(savedCategories);
      // Filter out legacy categories while preserving user-created ones
      const mergedCats = [...DEFAULT_CATEGORIES];
      parsedCats.forEach((cat: Category) => {
        const isCoreOrLegacy = ['all', 'cars', 'characters', 'weapons', 'props', 'environments', 'humans', 'non-humans'].includes(cat.id);
        if (!isCoreOrLegacy) {
          mergedCats.push(cat);
        }
      });
      setCategories(mergedCats);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('forge_assets', JSON.stringify(assets));
    localStorage.setItem('forge_categories', JSON.stringify(categories));
  }, [assets, categories]);

  const handleAddAsset = (assetData: Omit<ModelAsset, 'id' | 'createdAt'>) => {
    const newAsset: ModelAsset = {
      ...assetData,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    setAssets(prev => [newAsset, ...prev]);
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm('Are you sure you want to remove this asset?')) {
      setAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleAddCategory = (name: string): string => {
    const exists = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) return exists.id;

    const newId = name.toLowerCase().replace(/\s+/g, '-');
    const color = CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];
    const newCat: Category = { id: newId, name, color };
    setCategories(prev => [...prev, newCat]);
    return newId;
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const allAvailableTags = useMemo(() => {
    const tags = new Set<string>();
    assets.forEach(asset => {
      asset.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets
      .filter(asset => {
        const matchesCategory = selectedCategoryId === 'all' || asset.categoryId === selectedCategoryId;
        const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            asset.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTags = selectedTags.length === 0 || 
                            selectedTags.every(tag => asset.tags?.includes(tag));
        return matchesCategory && matchesSearch && matchesTags;
      })
      .sort((a, b) => {
        if (sortOption === 'newest') return b.createdAt - a.createdAt;
        if (sortOption === 'oldest') return a.createdAt - b.createdAt;
        if (sortOption === 'alphabetical') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [assets, selectedCategoryId, selectedTags, searchQuery, sortOption]);

  return (
    <div className="min-h-screen pb-20 w-full overflow-x-hidden">
      {/* Navigation Header - Optimized for Full Width */}
      <header className="sticky top-0 z-40 glass border-b border-slate-200/50">
        <div className="w-full px-6 lg:px-12 h-24 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/10 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 leading-none uppercase">Asthye Vault</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Asset Studio</span>
            </div>
          </div>

          <div className="flex-grow max-w-3xl px-12 hidden md:block">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search collection..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/50 border border-slate-300/60 rounded-full py-3 pl-12 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-400 transition-all placeholder:text-slate-400"
              />
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="shine-button flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-7 py-3 rounded-2xl font-bold shadow-2xl shadow-slate-900/20 transition-all transform active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>ADD ASSET</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width Padding */}
      <main className="w-full px-6 lg:px-12 mt-12">
        <div className="flex flex-col space-y-6 mb-12">
          <div className="flex flex-col space-y-6">
            {/* Categories Selection */}
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mr-2">Categories</span>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${
                    selectedCategoryId === cat.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20' 
                    : 'bg-white/40 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-400'
                  }`}
                >
                  {cat.name.toUpperCase()}
                </button>
              ))}
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="p-2 rounded-full bg-white/40 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 hover:bg-white transition-all shadow-sm"
                title="Create New Folder"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>

            {/* Dynamic Tags Cloud */}
            {allAvailableTags.length > 0 && (
              <div className="flex flex-wrap gap-2.5 items-center bg-white/30 p-4 rounded-2xl border border-white/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Thematic Tags</span>
                {allAvailableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                      selectedTags.includes(tag) 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
                {selectedTags.length > 0 && (
                  <button 
                    onClick={() => setSelectedTags([])}
                    className="text-[10px] font-black text-red-500 uppercase hover:text-red-700 ml-4 transition-colors"
                  >
                    Reset Tags
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center border-b border-slate-300/30 pb-4">
            <div className="text-sm font-semibold text-slate-400">
              Showing <span className="text-slate-900 font-bold">{filteredAssets.length}</span> curated assets
            </div>
            <div className="flex items-center space-x-3 bg-white/40 p-1.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-3 border-r border-slate-200">Sort Matrix</span>
              <select 
                value={sortOption}
                onChange={e => setSortOption(e.target.value as SortOption)}
                className="bg-transparent text-xs text-slate-800 border-none focus:outline-none focus:ring-0 cursor-pointer py-1 pr-8 pl-1 font-bold uppercase tracking-wider"
              >
                <option value="newest">Chronological</option>
                <option value="oldest">Historical</option>
                <option value="alphabetical">Index A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gallery Grid - Optimized for wide screens (Up to 6 columns) */}
        {filteredAssets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-8 pb-20">
            {filteredAssets.map(asset => {
              const category = categories.find(c => c.id === asset.categoryId) || categories[0];
              return (
                <ModelCard 
                  key={asset.id} 
                  asset={asset} 
                  category={category} 
                  onDelete={handleDeleteAsset}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white/20 rounded-3xl border border-dashed border-slate-300/50">
            <div className="w-24 h-24 bg-white/60 rounded-full flex items-center justify-center mb-8 border border-slate-200 shadow-inner">
               <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">VAULT EMPTY</h3>
            <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
              {searchQuery || selectedCategoryId !== 'all' || selectedTags.length > 0
                ? "No models match your current filters. Clear them to reveal your archive." 
                : "Your collection is currently empty. Start curating your studio by adding high-end assets."}
            </p>
          </div>
        )}
      </main>

      {/* Persistent Branding Footer */}
      <footer className="mt-auto py-16 border-t border-slate-300/30 text-center w-full">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
        </div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">ASTHYE VAULT SYSTEM</p>
        <p className="text-xs text-slate-500 font-medium italic opacity-60">Professional curating tool for the digital modding era.</p>
      </footer>

      <AddModelModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        categories={categories}
        availableTags={allAvailableTags}
        onAdd={handleAddAsset}
        onAddCategory={handleAddCategory}
      />

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl transition-all duration-300">
          <div className="glass w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight uppercase">New Collection</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Display Name</label>
                <input 
                  type="text"
                  autoFocus
                  placeholder="e.g. CYBERNETICS"
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-400 transition-all shadow-inner"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (newCatName.trim()) handleAddCategory(newCatName.trim());
                      setNewCatName('');
                      setIsCategoryModalOpen(false);
                    }
                  }}
                />
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (newCatName.trim()) handleAddCategory(newCatName.trim());
                    setNewCatName('');
                    setIsCategoryModalOpen(false);
                  }}
                  className="flex-1 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 uppercase tracking-widest text-[10px]"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;