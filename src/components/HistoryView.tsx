import { useState, useEffect } from 'react';
import { Clock, Image as ImageIcon } from 'lucide-react';
import { supabase, getSessionId } from '../lib/supabase';
import { TryOnHistory } from '../lib/types';

export default function HistoryView() {
  const [history, setHistory] = useState<TryOnHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const { data, error } = await supabase
        .from('tryon_history')
        .select(`
          *,
          garment:garments(*)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-6 h-6 text-slate-700" />
          <h2 className="text-2xl font-bold text-slate-800">Your Try-On History</h2>
        </div>
        <p className="text-slate-600">Loading your history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-200 text-center">
        <ImageIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No Try-Ons Yet</h2>
        <p className="text-slate-600">
          Start trying on garments to see your history here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="w-6 h-6 text-slate-700" />
          <h2 className="text-2xl font-bold text-slate-800">Your Try-On History</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item) => (
            <div
              key={item.id}
              className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {item.result_image_url ? (
                <div className="aspect-square overflow-hidden bg-slate-100">
                  <img
                    src={item.result_image_url}
                    alt="Try-on result"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-slate-100 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-slate-300" />
                </div>
              )}
              <div className="p-4">
                {item.garment && (
                  <p className="font-medium text-slate-800">{item.garment.name}</p>
                )}
                <p className="text-sm text-slate-500">
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
