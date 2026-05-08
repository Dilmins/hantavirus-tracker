import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Clock, ExternalLink, Globe, Newspaper, Radio, Activity, MapPin, Skull, Users } from 'lucide-react';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;

// World map path data - simplified but recognizable continent shapes
const WORLD_PATHS = [
  // North America
  { id: 'na', d: 'M 75,55 L 95,50 L 130,45 L 165,48 L 185,55 L 195,65 L 200,75 L 205,90 L 200,110 L 195,125 L 185,140 L 175,155 L 165,165 L 150,175 L 135,185 L 120,190 L 108,195 L 95,190 L 82,182 L 72,170 L 65,155 L 60,140 L 58,125 L 60,110 L 65,95 L 70,80 Z' },
  // Greenland
  { id: 'gl', d: 'M 185,20 L 210,15 L 235,18 L 250,25 L 252,38 L 245,48 L 230,52 L 210,50 L 192,42 L 183,32 Z' },
  // Central America / Caribbean
  { id: 'ca', d: 'M 120,195 L 135,192 L 148,197 L 155,205 L 150,212 L 138,215 L 125,210 L 117,203 Z' },
  // South America
  { id: 'sa', d: 'M 148,210 L 175,205 L 200,208 L 218,218 L 228,232 L 232,250 L 230,270 L 225,295 L 218,318 L 205,340 L 190,358 L 175,368 L 160,365 L 148,355 L 138,338 L 130,318 L 125,295 L 124,270 L 126,248 L 132,228 L 140,215 Z' },
  // Europe
  { id: 'eu', d: 'M 420,55 L 445,50 L 468,48 L 488,52 L 505,60 L 515,72 L 518,85 L 512,97 L 500,108 L 485,115 L 468,118 L 450,115 L 435,108 L 422,98 L 415,85 L 415,70 Z' },
  // Scandinavia
  { id: 'sc', d: 'M 450,30 L 468,28 L 482,32 L 490,42 L 488,55 L 478,60 L 462,58 L 448,50 L 444,40 Z' },
  // UK/Ireland
  { id: 'uk', d: 'M 410,55 L 422,52 L 430,58 L 428,68 L 418,72 L 408,68 L 406,60 Z' },
  // Africa
  { id: 'af', d: 'M 430,128 L 458,122 L 480,125 L 498,135 L 512,150 L 520,168 L 522,188 L 520,210 L 515,232 L 508,255 L 498,278 L 485,300 L 470,318 L 455,328 L 440,325 L 428,312 L 418,295 L 412,272 L 408,248 L 408,225 L 410,202 L 415,178 L 420,158 L 425,142 Z' },
  // Madagascar
  { id: 'mg', d: 'M 522,278 L 530,272 L 536,280 L 534,295 L 526,300 L 518,295 L 518,283 Z' },
  // Russia / Northern Asia
  { id: 'ru', d: 'M 520,35 L 570,28 L 630,25 L 695,28 L 750,32 L 790,38 L 820,45 L 840,55 L 845,68 L 835,80 L 815,88 L 785,92 L 750,90 L 710,88 L 670,85 L 630,82 L 590,80 L 555,78 L 528,75 L 518,62 L 515,48 Z' },
  // Middle East
  { id: 'me', d: 'M 518,105 L 548,100 L 572,105 L 585,118 L 582,132 L 568,140 L 548,142 L 530,135 L 518,122 Z' },
  // South Asia
  { id: 'sia', d: 'M 585,118 L 622,112 L 650,115 L 668,128 L 672,145 L 660,160 L 640,168 L 618,165 L 600,155 L 585,140 Z' },
  // Southeast Asia
  { id: 'sea', d: 'M 668,145 L 700,138 L 722,145 L 732,158 L 728,172 L 712,180 L 692,178 L 675,168 Z' },
  // China / East Asia
  { id: 'ea', d: 'M 672,88 L 720,82 L 758,88 L 778,100 L 782,118 L 770,132 L 748,140 L 720,142 L 695,135 L 675,122 L 668,108 Z' },
  // Japan
  { id: 'jp', d: 'M 790,95 L 802,90 L 812,96 L 814,108 L 805,115 L 792,112 L 786,102 Z' },
  // Korea
  { id: 'kr', d: 'M 772,108 L 782,105 L 788,112 L 785,120 L 776,122 L 769,116 Z' },
  // Indonesia / SE Asia islands
  { id: 'id', d: 'M 710,185 L 742,180 L 770,182 L 785,190 L 782,200 L 762,205 L 738,202 L 715,195 Z' },
  // Australia
  { id: 'au', d: 'M 730,268 L 768,260 L 800,262 L 825,272 L 840,288 L 842,308 L 832,326 L 812,338 L 788,342 L 762,338 L 740,325 L 728,308 L 724,288 Z' },
  // New Zealand
  { id: 'nz', d: 'M 862,318 L 870,312 L 878,318 L 876,330 L 866,334 L 858,326 Z' },
];

function latLngToXY(lat, lng) {
  const x = ((lng + 180) / 360) * MAP_WIDTH;
  const y = ((90 - lat) / 180) * MAP_HEIGHT;
  return { x, y };
}

function SourceBadge({ source }) {
  const colors = {
    WHO: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    ProMED: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    News: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  };
  const color = colors[source] || colors.News;
  return (
    <span className={"text-xs px-2 py-0.5 rounded-full border font-medium " + color}>
      {source}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, subtext }) {
  return (
    <div className="relative bg-slate-900/80 border border-slate-700/50 rounded-xl p-5 overflow-hidden group hover:border-slate-600/70 transition-all duration-300">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${color.replace('text-', 'from-').replace('-400', '-500/5')} to-transparent`} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">{label}</p>
        <div className={`p-1.5 rounded-lg bg-slate-800 ${color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className={`text-3xl font-bold font-mono tabular-nums ${color}`}>{value}</p>
      {subtext && <p className="text-xs text-slate-500 mt-1.5">{subtext}</p>}
    </div>
  );
}

export default function HantavirusDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

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
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-cyan-400/50 animate-pulse" />
            <Globe className="absolute inset-0 m-auto w-7 h-7 text-cyan-400" />
          </div>
          <p className="text-cyan-400/80 tracking-[0.3em] text-xs font-medium">LOADING SURVEILLANCE DATA</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-red-400 text-sm">Unable to load surveillance data</p>
        </div>
      </div>
    );
  }

  // Derive stats
  const totalCases = data.usHistoric?.totalCases ?? 'N/A';
  const infectedCountries = data.countriesWithAlerts ?? data.mapPoints?.length ?? 0;
  const totalDeaths = data.totalDeaths ?? 'N/A';
  const activeAlerts = (data.whoAlertCount ?? 0) + (data.promedAlertCount ?? 0) + (data.newsCount ?? 0);

  const stats = [
    {
      label: 'Total Cases (Historic)',
      value: typeof totalCases === 'number' ? totalCases.toLocaleString() : totalCases,
      icon: Users,
      color: 'text-amber-400',
      subtext: 'CDC reported (US)',
    },
    {
      label: 'Total Deaths (Historic)',
      value: typeof totalDeaths === 'number' ? totalDeaths.toLocaleString() : '~38%',
      icon: Skull,
      color: 'text-red-400',
      subtext: 'Case fatality rate ~38%',
    },
    {
      label: 'Countries Affected',
      value: infectedCountries > 0 ? infectedCountries : '30+',
      icon: MapPin,
      color: 'text-cyan-400',
      subtext: 'With active alerts',
    },
    {
      label: 'Active Alerts',
      value: activeAlerts,
      icon: Activity,
      color: 'text-emerald-400',
      subtext: 'WHO · ProMED · News',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}>
      {/* Subtle background texture */}
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(239,68,68,0.05) 0%, transparent 50%)'
      }} />

      {/* Header */}
      <header className="relative border-b border-slate-800/80 sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative p-2 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-lg shadow-lg shadow-cyan-500/20">
                <Globe className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-slate-950" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-[0.15em] text-white">HANTAVIRUS TRACKER</h1>
                <p className="text-[10px] text-slate-500 tracking-[0.25em]">GLOBAL REAL-TIME SURVEILLANCE</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 flex items-center gap-1.5 justify-end">
                <Clock className="w-3 h-3 text-slate-500" />
                <span className="text-slate-300">{lastUpdate ? lastUpdate.toLocaleString() : '—'}</span>
              </p>
              <p className="text-[10px] text-cyan-500/80 tracking-widest mt-0.5">AUTO-REFRESH: 5m</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 py-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { id: 'map', label: '🗺 World Map' },
            { id: 'news', label: '📰 News Feed' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={"px-4 py-2 rounded-lg text-xs font-medium tracking-widest uppercase transition-all duration-200 " +
                (activeTab === tab.id
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700/50')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* SVG World Map */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    <span className="text-xs text-slate-400 tracking-wide">LIVE ALERT MAP — click a location for details</span>
                  </div>
                  <span className="text-xs text-slate-600">{data.mapPoints?.length ?? 0} active locations</span>
                </div>

                <div className="relative" style={{ paddingBottom: '51%' }}>
                  <svg
                    viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                    className="absolute inset-0 w-full h-full"
                    style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0f172a 60%, #0a1628 100%)' }}
                  >
                    <defs>
                      {/* Grid pattern */}
                      <pattern id="smallgrid" width="25" height="25" patternUnits="userSpaceOnUse">
                        <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" strokeWidth="0.3" opacity="0.6" />
                      </pattern>
                      <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                        <rect width="100" height="100" fill="url(#smallgrid)" />
                        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1e3a5f" strokeWidth="0.6" opacity="0.5" />
                      </pattern>
                      {/* Glow filter */}
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <filter id="softglow">
                        <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Ocean background */}
                    <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#grid)" />

                    {/* Latitude lines */}
                    {[30, 60, 90, 120, 150].map(y => (
                      <line key={y} x1="0" y1={y * MAP_HEIGHT / 180} x2={MAP_WIDTH} y2={y * MAP_HEIGHT / 180}
                        stroke="#1e3a5f" strokeWidth="0.4" strokeDasharray="3,6" opacity="0.5" />
                    ))}
                    {/* Longitude lines */}
                    {[180, 270, 360, 450, 540, 630, 720, 810].map(x => (
                      <line key={x} x1={x * MAP_WIDTH / 1000} y1="0" x2={x * MAP_WIDTH / 1000} y2={MAP_HEIGHT}
                        stroke="#1e3a5f" strokeWidth="0.4" strokeDasharray="3,6" opacity="0.5" />
                    ))}

                    {/* Equator */}
                    <line x1="0" y1={MAP_HEIGHT / 2} x2={MAP_WIDTH} y2={MAP_HEIGHT / 2}
                      stroke="#1e4d7a" strokeWidth="0.8" strokeDasharray="5,5" opacity="0.7" />

                    {/* Continent shapes */}
                    {WORLD_PATHS.map(({ id, d }) => (
                      <path key={id} d={d}
                        fill="#1a2d45"
                        stroke="#2d4a6b"
                        strokeWidth="0.8"
                        opacity="0.9"
                      />
                    ))}

                    {/* Alert points */}
                    {data.mapPoints && data.mapPoints.map((point, i) => {
                      const { x, y } = latLngToXY(point.lat, point.lng);
                      const isSelected = selectedPoint?.country === point.country;
                      const isHovered = hoveredPoint?.country === point.country;
                      const size = Math.min(5 + point.alertCount * 1.5, 14);
                      const color = isSelected ? '#06b6d4' : '#ef4444';
                      const glowColor = isSelected ? '#0e7490' : '#991b1b';

                      return (
                        <g key={i}
                          onClick={() => setSelectedPoint(isSelected ? null : point)}
                          onMouseEnter={() => setHoveredPoint(point)}
                          onMouseLeave={() => setHoveredPoint(null)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Outer pulse ring */}
                          <circle cx={x} cy={y} r={size + 8}
                            fill="none" stroke={color} strokeWidth="0.8"
                            opacity={isSelected || isHovered ? 0.5 : 0.2}
                            style={{ animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite' }}
                          />
                          {/* Inner pulse */}
                          <circle cx={x} cy={y} r={size + 4}
                            fill="none" stroke={color} strokeWidth="1"
                            opacity={isSelected || isHovered ? 0.4 : 0.15}
                          />
                          {/* Glow backdrop */}
                          <circle cx={x} cy={y} r={size + 2}
                            fill={glowColor} opacity="0.2"
                            filter="url(#softglow)"
                          />
                          {/* Main dot */}
                          <circle cx={x} cy={y} r={size}
                            fill={color}
                            opacity={isSelected || isHovered ? 1 : 0.85}
                            stroke={isSelected ? '#67e8f9' : '#fca5a5'}
                            strokeWidth="1.2"
                            filter="url(#glow)"
                          />
                          {/* Count label */}
                          {point.alertCount > 1 && (
                            <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle"
                              fontSize="7" fill="white" fontWeight="bold" style={{ pointerEvents: 'none' }}>
                              {point.alertCount}
                            </text>
                          )}
                          {/* Country label */}
                          <text x={x} y={y + size + 11} textAnchor="middle"
                            fontSize="7.5" fill={isSelected || isHovered ? '#94a3b8' : '#475569'}
                            style={{ pointerEvents: 'none', fontFamily: 'monospace' }}>
                            {point.country}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Legend */}
                <div className="px-4 py-2.5 flex items-center gap-5 text-xs text-slate-600 border-t border-slate-800/60">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50" />
                    <span className="text-slate-500">Alert location</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" />
                    <span className="text-slate-500">Selected</span>
                  </span>
                  <span className="text-slate-600">Number = alert count</span>
                </div>
              </div>
            </div>

            {/* Side panel */}
            <div className="lg:col-span-1 min-h-64">
              {selectedPoint ? (
                <div className="bg-slate-900/60 border border-cyan-500/30 rounded-xl overflow-hidden h-full flex flex-col">
                  <div className="p-4 border-b border-slate-800/60 bg-cyan-500/5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-cyan-400 tracking-wide">{selectedPoint.country}</h3>
                      <button onClick={() => setSelectedPoint(null)}
                        className="text-slate-500 hover:text-white w-6 h-6 rounded flex items-center justify-center hover:bg-slate-800 transition-colors text-lg leading-none">
                        ×
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedPoint.alertCount} alert{selectedPoint.alertCount !== 1 ? 's' : ''} · {selectedPoint.sources.join(', ')}
                    </p>
                  </div>
                  <div className="overflow-y-auto flex-1" style={{ maxHeight: '380px' }}>
                    {selectedPoint.alerts.map((alert, i) => (
                      <div key={i} className="p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <SourceBadge source={alert.source} />
                          <span className="text-xs text-slate-600">
                            {alert.published ? new Date(alert.published).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed mb-2">{alert.title}</p>
                        {alert.summary && (
                          <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: alert.summary }} />
                        )}
                        {alert.link && (
                          <a href={alert.link} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1 mt-1 group/link">
                            <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                            Read full report
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-6 flex flex-col items-center justify-center h-full text-center min-h-48">
                  <div className="w-14 h-14 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
                    <Globe className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="text-slate-400 text-sm">Click a dot on the map</p>
                  <p className="text-slate-600 text-xs mt-1">to see alerts for that location</p>
                  <div className="mt-4 pt-4 border-t border-slate-800/60 w-full text-center">
                    <p className="text-slate-600 text-xs">{data.mapPoints?.length ?? 0} locations with active alerts</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEWS TAB */}
        {activeTab === 'news' && (
          <div className="space-y-2">
            {data.recentNews && data.recentNews.length > 0 ? (
              data.recentNews.map((item, i) => (
                <div key={i} className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-4 hover:border-slate-700/60 hover:bg-slate-900/80 transition-all duration-200 group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <SourceBadge source={item.source} />
                        <span className="text-xs text-slate-600">
                          {item.published ? new Date(item.published).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">{item.title}</p>
                      {item.summary && (
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: item.summary }} />
                      )}
                    </div>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer"
                        className="text-slate-600 hover:text-cyan-400 shrink-0 mt-0.5 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-10 text-center">
                <Newspaper className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No news items available</p>
              </div>
            )}
          </div>
        )}

        {/* Endemic Regions */}
        <div className="mt-8 pt-6 border-t border-slate-800/60">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-3">Endemic Regions</h2>
          <div className="flex flex-wrap gap-2">
            {data.endemicRegions?.map((region, i) => (
              <span key={i} className="bg-slate-900/60 border border-slate-700/50 rounded-full px-3 py-1 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-colors">
                {region}
              </span>
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-600">
          <span className="text-slate-700 tracking-wider uppercase text-[10px]">Sources:</span>
          {data.dataSources?.map((s, i) => (
            <span key={i} className="text-slate-600 hover:text-slate-500 transition-colors cursor-default">{s}</span>
          ))}
          {lastUpdate && (
            <span className="ml-auto text-slate-700">
              Last fetch: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-800/60 mt-10 py-5 text-center text-xs text-slate-600">
        <p>Data sourced from WHO, ProMED, CDC, and Google News. Updated hourly via GitHub Actions.</p>
        <p className="mt-1 text-slate-700">For medical guidance, consult official health authorities. This tracker is for informational purposes only.</p>
      </footer>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
