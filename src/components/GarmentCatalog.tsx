import { useState, useEffect } from 'react';
import { Heart, Filter } from 'lucide-react';
import { supabase, getSessionId } from '../lib/supabase';
import { Garment } from '../lib/types';

export default function GarmentCatalog() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [filteredGarments, setFilteredGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadGarments();
    loadFavorites();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredGarments(garments);
    } else {
      setFilteredGarments(garments.filter((g) => g.category === selectedCategory));
    }
  }, [selectedCategory, garments]);

  const loadGarments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('garments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGarments(data || []);

      const uniqueCategories = Array.from(
        new Set((data || []).map((g) => g.category))
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading garments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    const sessionId = getSessionId();
    const { data } = await supabase
      .from('favorites')
      .select('garment_id')
      .eq('session_id', sessionId);

    if (data) {
      setFavorites(new Set(data.map((f) => f.garment_id)));
    }
  };

  const toggleFavorite = async (garmentId: string) => {
    const sessionId = getSessionId();

    if (favorites.has(garmentId)) {
      await supabase
        .from('favorites')
        .delete()
        .eq('session_id', sessionId)
        .eq('garment_id', garmentId);

      setFavorites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(garmentId);
        return newSet;
      });
    } else {
      await supabase
        .from('favorites')
        .insert({ session_id: sessionId, garment_id: garmentId });

      setFavorites((prev) => new Set(prev).add(garmentId));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <p className="text-slate-600">Loading catalog...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-800">Garment Catalog</h3>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredGarments.map((garment) => (
          <div
            key={garment.id}
            className="group relative border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
          >
            <div className="aspect-square overflow-hidden bg-slate-100">
              <img
                src={garment.image_url}
                alt={garment.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="p-3">
              <p className="font-medium text-slate-800 text-sm truncate">
                {garment.name}
              </p>
              <p className="text-xs text-slate-500 capitalize">{garment.category}</p>
              {garment.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {garment.description}
                </p>
              )}
            </div>
            <button
              onClick={() => toggleFavorite(garment.id)}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${
                  favorites.has(garment.id)
                    ? 'fill-red-500 text-red-500'
                    : 'text-slate-400'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {filteredGarments.length === 0 && (
        <p className="text-center text-slate-500 py-8">No garments found in this category</p>
      )}
    </div>
  );
}
