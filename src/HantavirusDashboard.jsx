import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, MapPin, Clock, Virus, Heart } from 'lucide-react';

export default function HantavirusDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('./data/hantavirus-data.json');
        const jsonData = await response.json();
        setData(jsonData);
        setLastUpdate(new Date(jsonData.lastUpdated));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };

    fetchData();
    // Refetch every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <Virus className="w-16 h-16 text-cyan-400 mx-auto" />
          </div>
          <p className="text-cyan-400 font-light tracking-widest">INITIALIZING...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">Unable to load data</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Cases', value: data.totalCases, icon: Virus, trend: data.caseTrend },
    { label: 'Confirmed Deaths', value: data.deaths, icon: Heart, trend: data.deathTrend },
    { label: 'Active Outbreaks', value: data.activeOutbreaks, icon: AlertTriangle },
    { label: 'Countries Affected', value: data.countriesAffected, icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 sticky top-0 z-50 backdrop-blur-sm bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                <Virus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">HANTAVIRUS TRACKER</h1>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Global Real-Time Surveillance</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 flex items-center gap-2 justify-end">
                <Clock className="w-4 h-4" />
                {lastUpdate ? lastUpdate.toLocaleString() : 'Loading...'}
              </p>
              <p className="text-xs text-cyan-400 font-mono">AUTO-REFRESH: 5m</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="relative group"
                style={{
                  animation: `slideUp 0.6s ease-out forwards`,
                  animationDelay: `${idx * 0.1}s`,
                  opacity: 0,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-slate-900/50 border border-slate-800 rounded-lg p-6 backdrop-blur-sm hover:border-cyan-500/50 transition-colors duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-light">
                        {stat.label}
                      </p>
                      <p className="text-4xl font-bold mt-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                    </div>
                    <Icon className="w-8 h-8 text-cyan-400/60" />
                  </div>
                  {stat.trend && (
                    <div className="flex items-center gap-2 text-xs">
                      <TrendingUp className="w-4 h-4 text-red-400" />
                      <span className="text-red-400/80">{stat.trend}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Outbreak Section */}
        <div
          className="mb-12"
          style={{
            animation: `slideUp 0.6s ease-out 0.4s forwards`,
            opacity: 0,
          }}
        >
          <h2 className="text-xl font-bold mb-6 tracking-tight">ACTIVE OUTBREAKS</h2>
          <div className="grid gap-6">
            {data.outbreaks && data.outbreaks.length > 0 ? (
              data.outbreaks.map((outbreak, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedRegion(selectedRegion === idx ? null : idx)}
                  className="group cursor-pointer"
                >
                  <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/30 border border-slate-800 rounded-lg p-6 backdrop-blur-sm hover:border-red-500/50 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                          <h3 className="text-lg font-bold">{outbreak.location}</h3>
                        </div>
                        <p className="text-sm text-slate-400">{outbreak.strain}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-400">{outbreak.cases}</p>
                        <p className="text-xs text-slate-400">cases</p>
                      </div>
                    </div>
                    
                    {selectedRegion === idx && (
                      <div className="mt-6 pt-6 border-t border-slate-700 space-y-3">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400 text-xs uppercase">Deaths</p>
                            <p className="text-red-400 font-bold text-lg">{outbreak.deaths}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase">Confirmed</p>
                            <p className="text-cyan-400 font-bold text-lg">{outbreak.confirmed}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase">Updated</p>
                            <p className="text-slate-300 font-mono text-xs">{outbreak.lastUpdate}</p>
                          </div>
                        </div>
                        {outbreak.notes && (
                          <p className="text-sm text-slate-300 italic mt-4">{outbreak.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 text-center">
                <p className="text-slate-400">No active outbreaks detected</p>
              </div>
            )}
          </div>
        </div>

        {/* Endemic Regions */}
        <div
          style={{
            animation: `slideUp 0.6s ease-out 0.5s forwards`,
            opacity: 0,
          }}
        >
          <h2 className="text-xl font-bold mb-6 tracking-tight">ENDEMIC REGIONS</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.endemicRegions && data.endemicRegions.map((region, idx) => (
              <div
                key={idx}
                className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center hover:border-cyan-500/30 transition-colors"
              >
                <p className="text-sm font-medium">{region}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16 py-8 text-center text-xs text-slate-500">
        <p>
          Data sourced from CDC, WHO, ECDC, and ProMED. Last automated update: {lastUpdate?.toLocaleString()}
        </p>
        <p className="mt-2">
          For medical guidance, consult official health authorities. This tracker is for informational purposes only.
        </p>
      </footer>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
