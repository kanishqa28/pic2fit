import { useState, useEffect } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { supabase, getSessionId } from '../lib/supabase';
import { Favorite } from '../lib/types';

export default function FavoritesView() {
  const [favorites, setFavorites] = useState<(Favorite & { garment: any })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          garment:garments(*)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string, garmentId: string) => {
    const sessionId = getSessionId();
    await supabase
      .from('favorites')
      .delete()
      .eq('session_id', sessionId)
      .eq('garment_id', garmentId);

    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center space-x-2 mb-4">
          <Heart className="w-6 h-6 text-slate-700" />
          <h2 className="text-2xl font-bold text-slate-800">Your Favorites</h2>
        </div>
        <p className="text-slate-600">Loading your favorites...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-200 text-center">
        <Heart className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No Favorites Yet</h2>
        <p className="text-slate-600">
          Start adding garments to your favorites to see them here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center space-x-2 mb-6">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          <h2 className="text-2xl font-bold text-slate-800">Your Favorites</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="group relative border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="aspect-square overflow-hidden bg-slate-100">
                <img
                  src={favorite.garment.image_url}
                  alt={favorite.garment.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-3">
                <p className="font-medium text-slate-800 text-sm truncate">
                  {favorite.garment.name}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {favorite.garment.category}
                </p>
                {favorite.garment.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {favorite.garment.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeFavorite(favorite.id, favorite.garment_id)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
