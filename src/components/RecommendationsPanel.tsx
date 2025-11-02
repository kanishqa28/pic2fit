import { useState, useEffect } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { supabase, getSessionId } from '../lib/supabase';
import { Garment, Recommendation } from '../lib/types';

interface RecommendationsPanelProps {
  garmentId: string;
  onSelectGarment: (garment: Garment) => void;
}

export default function RecommendationsPanel({ garmentId, onSelectGarment }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<(Recommendation & { recommended_garment: Garment })[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRecommendations();
    loadFavorites();
  }, [garmentId]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select(`
          *,
          recommended_garment:garments!recommended_garment_id(*)
        `)
        .eq('garment_id', garmentId)
        .order('score', { ascending: false });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
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

      setFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(garmentId);
        return newSet;
      });
    } else {
      await supabase
        .from('favorites')
        .insert({ session_id: sessionId, garment_id: garmentId });

      setFavorites(prev => new Set(prev).add(garmentId));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-slate-700" />
          <h3 className="text-lg font-semibold text-slate-800">AI Stylist Recommendations</h3>
        </div>
        <p className="text-slate-600">Loading recommendations...</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-slate-700" />
        <h3 className="text-lg font-semibold text-slate-800">AI Stylist Recommendations</h3>
      </div>
      <p className="text-slate-600 mb-4">These items pair perfectly with your selection:</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="group relative border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer"
            onClick={() => onSelectGarment(rec.recommended_garment)}
          >
            <div className="aspect-square overflow-hidden bg-slate-100">
              <img
                src={rec.recommended_garment.image_url}
                alt={rec.recommended_garment.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="p-3">
              <p className="font-medium text-slate-800 text-sm truncate">
                {rec.recommended_garment.name}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {rec.recommended_garment.category}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(rec.recommended_garment.id);
              }}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${
                  favorites.has(rec.recommended_garment.id)
                    ? 'fill-red-500 text-red-500'
                    : 'text-slate-400'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
