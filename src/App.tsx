import { useState } from 'react';
import { Shirt, History, Heart } from 'lucide-react';
import VirtualTryOn from './components/VirtualTryOn';
import GarmentCatalog from './components/GarmentCatalog';
import HistoryView from './components/HistoryView';
import FavoritesView from './components/FavoritesView';

type View = 'tryon' | 'history' | 'favorites';

function App() {
  const [currentView, setCurrentView] = useState<View>('tryon');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shirt className="w-8 h-8 text-slate-700" />
              <h1 className="text-2xl font-bold text-slate-800">Virtual Fitting Room</h1>
            </div>
            <nav className="flex space-x-2">
              <button
                onClick={() => setCurrentView('tryon')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'tryon'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Try On
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  currentView === 'history'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>
              <button
                onClick={() => setCurrentView('favorites')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  currentView === 'favorites'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Favorites</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'tryon' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                See Yourself in Any Outfit
              </h2>
              <p className="text-slate-600 text-lg">
                Upload your photo and try on garments virtually with AI-powered styling
              </p>
            </div>
            <VirtualTryOn />
            <GarmentCatalog />
          </div>
        )}
        {currentView === 'history' && <HistoryView />}
        {currentView === 'favorites' && <FavoritesView />}
      </main>
    </div>
  );
}

export default App;
