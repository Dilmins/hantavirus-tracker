import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Clock, ExternalLink, Globe, Newspaper, Radio } from 'lucide-react';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;

function latLngToXY(lat, lng) {
  const x = ((lng + 180) / 360) * MAP_WIDTH;
  const y = ((90 - lat) / 180) * MAP_HEIGHT;
  return { x, y };
}

function SourceBadge({ source }) {
  const colors = {
    WHO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ProMED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    News: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  const color = colors[source] || colors.News;
  return (
    <span className={"text-xs px-2 py-0.5 rounded border " + color}>
      {source}
    </span>
  );
}

export default function HantavirusDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [lastUpdate, setLastUpdate] = useState(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/hantavirus-tracker/data/hantavirus-data.json');
        const jsonData = await response.json();
        setData(jsonData);
        setLastUpdate(new Date(jsonData.lastUpdated));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <Globe className="w-16 h-16 text-cyan-400 mx-auto" />
          </div>
          <p className="text-cyan-400 tracking-widest text-sm">LOADING SURVEILLANCE DATA...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">Unable to load data</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'WHO Alerts', value: data.whoAlertCount ?? 0, color: 'text-blue-400' },
    { label: 'ProMED Alerts', value: data.promedAlertCount ?? 0, color: 'text-purple-400' },
    { label: 'Locations Tracked', value: data.countriesWithAlerts ?? 0, color: 'text-cyan-400' },
    { label: 'News Items', value: data.newsCount ?? 0, color: 'text-green-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 sticky top-0 z-50 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">HANTAVIRUS TRACKER</h1>
                <p className="text-xs text-slate-400 uppercase tracking-widest">Global Real-Time Surveillance</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" />
                {lastUpdate ? lastUpdate.toLocaleString() : 'Loading...'}
              </p>
              <p className="text-xs text-cyan-400">AUTO-REFRESH: 5m</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={"text-3xl font-bold " + stat.color}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['map', 'news'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={"px-4 py-2 rounded-lg text-sm font-medium transition-colors " +
                (activeTab === tab
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white border border-transparent')}
            >
              {tab === 'map' ? '🗺 World Map' : '📰 News Feed'}
            </button>
          ))}
        </div>

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SVG Map */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-slate-800 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-sm text-slate-300">Live Alert Map — click a dot for details</span>
                </div>
                <div className="relative overflow-hidden" style={{ paddingBottom: '50%' }}>
                  <svg
                    viewBox={"0 0 " + MAP_WIDTH + " " + MAP_HEIGHT}
                    className="absolute inset-0 w-full h-full"
                    style={{ background: '#0f172a' }}
                  >
                    {/* Simple world map background grid */}
                    <defs>
                      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#grid)" />

                    {/* Equator and meridian lines */}
                    <line x1="0" y1={MAP_HEIGHT / 2} x2={MAP_WIDTH} y2={MAP_HEIGHT / 2} stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="4,4" />
                    <line x1={MAP_WIDTH / 2} y1="0" x2={MAP_WIDTH / 2} y2={MAP_HEIGHT} stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="4,4" />

                    {/* Continent outlines — simplified polygons */}
                    {/* North America */}
                    <polygon points="80,60 180,60 200,80 210,120 190,160 160,180 120,200 90,180 70,140 60,100" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    {/* South America */}
                    <polygon points="150,210 200,200 230,220 240,280 220,340 190,380 160,370 140,320 130,270 140,230" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    {/* Europe */}
                    <polygon points="420,60 500,55 520,80 510,110 480,120 450,115 430,100 415,80" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    {/* Africa */}
                    <polygon points="430,130 500,120 530,150 540,220 520,300 490,340 460,340 440,300 420,220 415,160" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    {/* Asia */}
                    <polygon points="520,55 700,50 780,70 800,120 760,160 700,170 620,160 560,140 530,110 515,80" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    {/* Australia */}
                    <polygon points="720,270 800,260 840,290 845,330 810,360 760,365 720,340 705,300" fill="#1e293b" stroke="#334155" strokeWidth="1" />

                    {/* Map points from live data */}
                    {data.mapPoints && data.mapPoints.map((point, i) => {
                      const { x, y } = latLngToXY(point.lat, point.lng);
                      const isSelected = selectedPoint && selectedPoint.country === point.country;
                      const size = Math.min(6 + point.alertCount * 2, 16);
                      return (
                        <g key={i} onClick={() => setSelectedPoint(isSelected ? null : point)} style={{ cursor: 'pointer' }}>
                          {/* Pulse ring */}
                          <circle
                            cx={x} cy={y} r={size + 4}
                            fill="none"
                            stroke={isSelected ? '#06b6d4' : '#ef4444'}
                            strokeWidth="1"
                            opacity="0.4"
                            className="animate-ping"
                            style={{ animationDuration: '2s' }}
                          />
                          {/* Main dot */}
                          <circle
                            cx={x} cy={y} r={size}
                            fill={isSelected ? '#06b6d4' : '#ef4444'}
                            opacity="0.9"
                            stroke={isSelected ? '#67e8f9' : '#fca5a5'}
                            strokeWidth="1.5"
                          />
                          {/* Alert count */}
                          {point.alertCount > 1 && (
                            <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="white" fontWeight="bold">
                              {point.alertCount}
                            </text>
                          )}
                          {/* Label */}
                          <text x={x} y={y + size + 10} textAnchor="middle" fontSize="8" fill="#94a3b8">
                            {point.country}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="p-3 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-800">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Alert location</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Selected</span>
                  <span>Number = alert count</span>
                </div>
              </div>
            </div>

            {/* Side panel */}
            <div className="lg:col-span-1">
              {selectedPoint ? (
                <div className="bg-slate-900 border border-cyan-500/30 rounded-xl overflow-hidden h-full">
                  <div className="p-4 border-b border-slate-800 bg-cyan-500/10">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-cyan-400">{selectedPoint.country}</h3>
                      <button onClick={() => setSelectedPoint(null)} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{selectedPoint.alertCount} alert{selectedPoint.alertCount !== 1 ? 's' : ''} from {selectedPoint.sources.join(', ')}</p>
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
                    {selectedPoint.alerts.map((alert, i) => (
                      <div key={i} className="p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <SourceBadge source={alert.source} />
                          <span className="text-xs text-slate-500 shrink-0">{alert.published ? new Date(alert.published).toLocaleDateString() : ''}</span>
                        </div>
                        <p className="text-sm text-slate-200 mb-2 leading-relaxed">{alert.title}</p>
                        {alert.summary && (
                          <p className="text-xs text-slate-400 leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: alert.summary }} />
                        )}
                        {alert.link && (
                          <a href={alert.link} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" /> Read full report
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center h-full text-center">
                  <Globe className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-slate-400 text-sm">Click a dot on the map to see alerts for that location</p>
                  <p className="text-slate-600 text-xs mt-2">{data.mapPoints ? data.mapPoints.length : 0} locations with active alerts</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEWS TAB */}
        {activeTab === 'news' && (
          <div className="space-y-3">
            {data.recentNews && data.recentNews.length > 0 ? (
              data.recentNews.map((item, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <SourceBadge source={item.source} />
                        <span className="text-xs text-slate-500">
                          {item.published ? new Date(item.published).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">{item.title}</p>
                      {item.summary && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2" dangerouslySetInnerHTML={{ __html: item.summary }} />
                      )}
                    </div>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 shrink-0 mt-1">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
                <Newspaper className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No news items available</p>
              </div>
            )}
          </div>
        )}

        {/* Endemic regions */}
        <div className="mt-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Endemic Regions</h2>
          <div className="flex flex-wrap gap-2">
            {data.endemicRegions && data.endemicRegions.map((region, i) => (
              <span key={i} className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-xs text-slate-300">
                {region}
              </span>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 mt-12 py-6 text-center text-xs text-slate-500">
        <p>Data sourced from WHO, ProMED, CDC, and Google News. Updated hourly.</p>
        <p className="mt-1">For medical guidance, consult official health authorities. This tracker is for informational purposes only.</p>
      </footer>
    </div>
  );
}
