import React, { useState, useMemo, useEffect } from 'react';
import { Category, ModelAsset } from '../types';
import { suggestMetadata } from '../services/geminiService';

interface AddModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  availableTags: string[];
  onSave: (asset: Omit<ModelAsset, 'id' | 'createdAt'>) => void;
  onAddCategory: (name: string) => string;
  editingAsset?: ModelAsset | null;
}

const AddModelModal: React.FC<AddModelModalProps> = ({ 
  isOpen, 
  onClose, 
  categories, 
  availableTags,
  onSave, 
  onAddCategory,
  editingAsset
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sourceUrl: '',
    imageUrl: '',
    categoryId: categories[1]?.id || 'all',
    description: '',
  });
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (isOpen) {
      if (editingAsset) {
        setFormData({
          name: editingAsset.name,
          sourceUrl: editingAsset.sourceUrl,
          imageUrl: editingAsset.imageUrl,
          categoryId: editingAsset.categoryId,
          description: editingAsset.description,
        });
        setSelectedTags(editingAsset.tags || []);
      } else {
        // Reset defaults for new asset
        setFormData({
          name: '',
          sourceUrl: '',
          imageUrl: '',
          categoryId: categories[1]?.id || 'all',
          description: '',
        });
        setSelectedTags([]);
      }
      setError('');
    }
  }, [isOpen, editingAsset, categories]);

  const combinedTags = useMemo(() => {
    return Array.from(new Set([...availableTags, ...selectedTags])).sort();
  }, [availableTags, selectedTags]);

  if (!isOpen) return null;

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNewTag = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanTag = newTagInput.trim().toLowerCase();
    if (cleanTag && !selectedTags.includes(cleanTag)) {
      setSelectedTags(prev => [...prev, cleanTag]);
      setNewTagInput('');
    }
  };

  const handleAiSuggest = async () => {
    if (!formData.description && !formData.name) {
      setError('Provide at least a name or description for AI suggestions.');
      return;
    }
    setIsAiLoading(true);
    setError('');
    
    const result = await suggestMetadata(
      formData.description || formData.name, 
      categories.map(c => c.name)
    );

    if (result) {
      let catId = categories.find(c => c.name.toLowerCase() === result.category.toLowerCase())?.id;
      if (!catId) {
        catId = onAddCategory(result.category);
      }

      setFormData(prev => ({
        ...prev,
        name: result.title || prev.name,
        categoryId: catId || prev.categoryId,
      }));

      if (result.tags) {
        const aiTags = result.tags.map((t: string) => t.toLowerCase());
        setSelectedTags(prev => Array.from(new Set([...prev, ...aiTags])));
      }
    }
    setIsAiLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sourceUrl || !formData.imageUrl) {
      setError('Please fill in all required fields (Name, Source, Image).');
      return;
    }

    onSave({ ...formData, tags: selectedTags });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="glass w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-display text-slate-900">
            {editingAsset ? 'Edit Asset' : 'Add New Asset'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Source Link*</label>
            <input 
              type="url"
              required
              placeholder="https://deviantart.com/..."
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              value={formData.sourceUrl}
              onChange={e => setFormData({...formData, sourceUrl: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Image Thumbnail URL*</label>
            <input 
              type="url"
              required
              placeholder="Paste image link here"
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              value={formData.imageUrl}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Model Name*</label>
              <input 
                type="text"
                required
                placeholder="Cyberpunk Sword"
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Category</label>
              <select 
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                value={formData.categoryId}
                onChange={e => setFormData({...formData, categoryId: e.target.value})}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Select Tags</label>
            <div className="flex flex-wrap gap-2 mb-3 max-h-32 overflow-y-auto p-2 bg-slate-100 rounded-lg border border-slate-300 shadow-inner">
              {combinedTags.length > 0 ? (
                combinedTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      selectedTags.includes(tag) 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                      : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-800'
                    }`}
                  >
                    #{tag}
                  </button>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic p-1">No tags available yet. Type one below.</span>
              )}
            </div>
            <div className="flex space-x-2">
              <input 
                type="text"
                placeholder="Add new tag..."
                className="flex-grow bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNewTag()}
              />
              <button 
                type="button"
                onClick={() => handleAddNewTag()}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-300"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Brief Description</label>
            <textarea 
              rows={2}
              placeholder="Cool high-poly sword for my fantasy project..."
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="pt-2">
            <button 
              type="button"
              onClick={handleAiSuggest}
              disabled={isAiLoading}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-50 border border-indigo-200 text-indigo-700 py-2.5 rounded-lg hover:bg-indigo-100 transition-all disabled:opacity-50 font-semibold"
            >
              {isAiLoading ? (
                 <span className="flex items-center space-x-2">
                   <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   <span>Consulting Gemini AI...</span>
                 </span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Auto-Suggest Everything (Gemini)</span>
                </>
              )}
            </button>
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <div className="pt-4 flex space-x-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors font-semibold"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-[2] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xl shadow-indigo-600/20 transition-all"
            >
              {editingAsset ? 'Update Asset' : 'Save Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddModelModal;