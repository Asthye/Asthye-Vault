import React, { useState, useEffect, useMemo } from 'react';
import { ModelAsset, Category, SortOption } from './types.ts';
import { DEFAULT_CATEGORIES, CATEGORY_COLORS } from './constants.tsx';
import ModelCard from './components/ModelCard.tsx';
import AddModelModal from './components/AddModelModal.tsx';

// Curated background presets
const BG_PRESETS = [
  { name: 'Platinum (Default)', value: 'radial-gradient(circle at 50% 0%, #ffffff 0%, #e2e8f0 50%, #cbd5e1 100%)', color: '#e2e8f0' },
  { name: 'Dark Slate', value: '#0f172a', color: '#0f172a' },
  { name: 'Midnight Void', value: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 100%)', color: '#1e1b4b' },
  { name: 'Warm Paper', value: '#fdfbf7', color: '#fdfbf7' },
  { name: 'Soft Gray', value: '#f3f4f6', color: '#f3f4f6' },
];

function App() {
  const [assets, setAssets] = useState<ModelAsset[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Form States
  const [newCatName, setNewCatName] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  // Custom Background State
  const [customBackground, setCustomBackground] = useState<string>(BG_PRESETS[0].value);
  const [pickerColor, setPickerColor] = useState<string>(BG_PRESETS[0].color);
  const [isGradient, setIsGradient] = useState<boolean>(true);
  
  // State for editing
  const [editingAsset, setEditingAsset] = useState<ModelAsset | null>(null);

  // Load data and handle migrations
  useEffect(() => {
    const savedAssets = localStorage.getItem('forge_assets');
    const savedCategories = localStorage.getItem('forge_categories');
    
    // Load API Key
    const savedKey = localStorage.getItem('asthye_gemini_key');
    if (savedKey) setApiKeyInput(savedKey);

    // Load Saved Background and sync picker state
    const savedBg = localStorage.getItem('asthye_bg');
    if (savedBg) {
      setCustomBackground(savedBg);
      
      // Attempt to sync the picker controls to the saved background
      const isGrad = savedBg.includes('gradient');
      setIsGradient(isGrad);
      
      // If it matches a preset, use the preset's representative color
      const preset = BG_PRESETS.find(p => p.value === savedBg);
      if (preset) {
        setPickerColor(preset.color);
      } else if (!isGrad) {
        // If it's a solid custom color (hex/rgb), use it directly
        setPickerColor(savedBg);
      } 
      // Note: If it's a custom gradient string not from presets, we might default pickerColor to existing state
      // or try to extract it, but for simplicity we keep the default or previous state.
    }

    if (savedAssets) {
      const parsedAssets = JSON.parse(savedAssets);
      // Migration: Remap 'humans' and 'non-humans' to 'characters'
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

  // Apply Background Effect
  useEffect(() => {
    document.body.style.background = customBackground;
    document.body.style.backgroundAttachment = 'fixed';
    
    // Adjust text color based on background brightness (simple heuristic)
    const isDark = customBackground.includes('#0f172a') || customBackground.includes('#1e1b4b') || customBackground.includes('#020617');
    if (isDark) {
      document.body.classList.add('dark-mode'); 
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [customBackground]);

  // Helper to generate a lighter version of a hex color
  const getHighlightColor = (hex: string) => {
    // Validate hex format
    if (!/^#[0-9A-F]{6}$/i.test(hex)) return '#ffffff';
    
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // Mix with white (60% white, 40% original color) to create a bright tinted spotlight
    const factor = 0.6;
    
    const rH = Math.round(r + (255 - r) * factor);
    const gH = Math.round(g + (255 - g) * factor);
    const bH = Math.round(b + (255 - b) * factor);

    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(rH)}${toHex(gH)}${toHex(bH)}`;
  };

  // Helper to construct and set background
  const applyBackground = (color: string, gradientMode: boolean) => {
    let bgValue = color;
    if (gradientMode) {
       // Spotlight effect: Lighter Tint top -> Selected Color body
       const highlight = getHighlightColor(color);
       bgValue = `radial-gradient(circle at 50% 0%, ${highlight} 0%, ${color} 100%)`;
    }
    setCustomBackground(bgValue);
    localStorage.setItem('asthye_bg', bgValue);
  };

  const handlePresetSelect = (preset: typeof BG_PRESETS[0]) => {
    setCustomBackground(preset.value);
    localStorage.setItem('asthye_bg', preset.value);
    setPickerColor(preset.color);
    setIsGradient(preset.value.includes('gradient'));
  };

  const handleColorPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setPickerColor(color);
    applyBackground(color, isGradient);
  };

  const handleGradientToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsGradient(checked);
    applyBackground(pickerColor, checked);
  };

  const saveApiKey = () => {
    localStorage.setItem('asthye_gemini_key', apiKeyInput.trim());
    setIsSettingsOpen(false);
    alert("API Key Saved Successfully!");
  };

  const handleSaveAsset = (assetData: Omit<ModelAsset, 'id' | 'createdAt'>) => {
    if (editingAsset) {
      // Update existing asset
      setAssets(prev => prev.map(a => 
        a.id === editingAsset.id 
          ? { ...a, ...assetData } 
          : a
      ));
    } else {
      // Create new asset
      const newAsset: ModelAsset = {
        ...assetData,
        id: crypto.randomUUID(),
        createdAt: Date.now()
      };
      setAssets(prev => [newAsset, ...prev]);
    }
    closeModal();
  };

  const handleEditAsset = (asset: ModelAsset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Short delay to allow modal animation to finish before clearing state
    setTimeout(() => setEditingAsset(null), 300);
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
    
    // Smart Color Selection
    const usedColors = new Set(categories.map(c => c.color));
    const availableColors = CATEGORY_COLORS.filter(c => !usedColors.has(c));
    
    let color;
    if (availableColors.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableColors.length);
      color = availableColors[randomIndex];
    } else {
      const lastUsedColor = categories[categories.length - 1]?.color;
      const recyclableColors = CATEGORY_COLORS.filter(c => c !== lastUsedColor);
      const randomIndex = Math.floor(Math.random() * recyclableColors.length);
      color = recyclableColors[randomIndex];
    }

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

  // Determine text color for header based on background
  const isDarkBg = customBackground.includes('#0f172a') || customBackground.includes('#1e1b4b') || customBackground.includes('#020617');
  const headerTextColor = isDarkBg ? 'text-white' : 'text-slate-900';
  const subHeaderTextColor = isDarkBg ? 'text-slate-400' : 'text-slate-400';

  return (
    <div className="min-h-screen pb-20 w-full overflow-x-hidden">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 glass border-b border-slate-200/50">
        <div className="w-full px-6 lg:px-12 h-24 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/10 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className={`text-2xl font-black font-display tracking-tight leading-none uppercase ${headerTextColor}`}>Asthye's Vault</h1>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${subHeaderTextColor}`}>Digital Asset Collection</span>
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
            {/* Background Picker Button */}
            <div className="relative">
              <button 
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                className="p-3 bg-white/50 text-slate-600 rounded-xl hover:bg-white hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
                title="Change Background"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>
              
              {/* Color Popover */}
              {isColorPickerOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 glass rounded-2xl p-4 shadow-2xl animate-in zoom-in-95 duration-200 z-50">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Theme Presets</h3>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {BG_PRESETS.map((preset) => (
                       <button
                         key={preset.name}
                         onClick={() => handlePresetSelect(preset)}
                         className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${customBackground === preset.value ? 'border-indigo-600 scale-110 shadow-md' : 'border-white/50'}`}
                         style={{ background: preset.color }}
                         title={preset.name}
                       />
                    ))}
                  </div>
                  
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Custom Color</h3>
                  <div className="space-y-3 bg-white/50 rounded-lg p-3 border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="color" 
                        className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                        onChange={handleColorPick}
                        value={pickerColor}
                      />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Hex Code</span>
                        <span className="text-xs text-slate-700 font-mono font-bold">
                          {pickerColor}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center pt-2 border-t border-slate-200/50">
                      <input
                        id="gradient-toggle"
                        type="checkbox"
                        checked={isGradient}
                        onChange={handleGradientToggle}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                      />
                      <label htmlFor="gradient-toggle" className="ml-2 text-[10px] font-bold text-slate-600 uppercase tracking-wide cursor-pointer select-none">
                        Use Spotlight Gradient
                      </label>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handlePresetSelect(BG_PRESETS[0])}
                    className="w-full mt-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    Reset Default
                  </button>
                </div>
              )}
            </div>
            
            {/* Settings Button */}
             <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 bg-white/50 text-slate-600 rounded-xl hover:bg-white hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
              title="Settings & API Key"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button 
              onClick={() => {
                setEditingAsset(null);
                setIsModalOpen(true);
              }}
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

      {/* Main Content */}
      <main className="w-full px-6 lg:px-12 mt-12">
        <div className="flex flex-col space-y-6 mb-12">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-wrap gap-3 items-center">
              <span className={`text-[11px] font-black uppercase tracking-widest mr-2 ${isDarkBg ? 'text-slate-300' : 'text-slate-400'}`}>Categories</span>
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

            {allAvailableTags.length > 0 && (
              <div className="flex flex-wrap gap-2.5 items-center bg-white/30 p-4 rounded-2xl border border-white/50">
                <span className={`text-[10px] font-black uppercase tracking-widest mr-2 ${isDarkBg ? 'text-slate-300' : 'text-slate-400'}`}>Thematic Tags</span>
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
            <div className={`text-sm font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-400'}`}>
              Showing <span className={`${isDarkBg ? 'text-white' : 'text-slate-900'} font-bold`}>{filteredAssets.length}</span> curated assets
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

        {/* Gallery Grid */}
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
                  onEdit={handleEditAsset}
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
            <h3 className={`text-2xl font-black mb-3 tracking-tight ${isDarkBg ? 'text-white' : 'text-slate-900'}`}>VAULT EMPTY</h3>
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
        <p className={`text-xs font-medium italic opacity-60 ${isDarkBg ? 'text-slate-400' : 'text-slate-500'}`}>Professional curating tool for the digital modding era.</p>
      </footer>

      <AddModelModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        categories={categories}
        availableTags={allAvailableTags}
        onSave={handleSaveAsset}
        onAddCategory={handleAddCategory}
        editingAsset={editingAsset}
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

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl transition-all duration-300">
          <div className="glass w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Settings</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium">Configure your studio environment.</p>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Google Gemini API Key</label>
                <input 
                  type="password"
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-400 transition-all shadow-inner font-mono text-sm"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  Required for AI auto-tagging. Your key is stored locally in your browser and never sent to our servers.
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline ml-1">Get a key here.</a>
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-widest text-[10px]"
                >
                  Close
                </button>
                <button 
                  onClick={saveApiKey}
                  className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20 uppercase tracking-widest text-[10px]"
                >
                  Save Config
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