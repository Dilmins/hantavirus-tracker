import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ExternalLink, Globe, Newspaper, Radio, MapPin, Skull, Activity } from 'lucide-react';

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;

const WORLD_PATHS = [
  // North America
  { id: 'na', d: 'M 68,58 L 78,52 L 92,48 L 110,44 L 130,42 L 152,44 L 168,48 L 180,54 L 190,62 L 196,72 L 200,84 L 202,98 L 200,112 L 196,126 L 190,138 L 182,150 L 172,160 L 160,170 L 148,178 L 134,184 L 120,188 L 108,188 L 96,184 L 86,176 L 78,166 L 72,154 L 68,140 L 66,126 L 66,112 L 68,98 L 70,84 L 70,70 Z' },
  // Alaska
  { id: 'ak', d: 'M 40,42 L 55,38 L 68,40 L 72,50 L 65,58 L 52,60 L 40,55 Z' },
  // Greenland
  { id: 'gl', d: 'M 192,18 L 210,14 L 228,14 L 244,18 L 252,26 L 252,36 L 246,46 L 232,52 L 216,52 L 200,46 L 190,36 L 188,26 Z' },
  // Central America
  { id: 'cam', d: 'M 120,188 L 136,186 L 148,190 L 154,198 L 150,208 L 140,214 L 128,212 L 118,204 Z' },
  // Caribbean
  { id: 'car', d: 'M 168,186 L 176,184 L 180,188 L 178,194 L 170,194 L 166,190 Z' },
  // South America
  { id: 'sa', d: 'M 148,212 L 168,208 L 186,208 L 202,212 L 216,220 L 226,232 L 232,248 L 234,266 L 232,284 L 228,302 L 222,320 L 212,338 L 200,354 L 186,366 L 172,372 L 158,368 L 146,358 L 136,342 L 128,322 L 124,300 L 122,278 L 124,256 L 128,238 L 136,222 Z' },
  // Iceland
  { id: 'ic', d: 'M 370,30 L 384,26 L 396,28 L 400,36 L 394,44 L 380,46 L 368,40 Z' },
  // UK & Ireland
  { id: 'uk', d: 'M 406,54 L 418,50 L 428,54 L 430,64 L 424,72 L 412,74 L 404,66 Z' },
  // Western Europe
  { id: 'weu', d: 'M 420,56 L 440,52 L 462,52 L 478,58 L 488,68 L 492,80 L 488,92 L 478,100 L 462,106 L 446,108 L 430,104 L 418,96 L 412,84 L 412,72 Z' },
  // Scandinavia
  { id: 'scan', d: 'M 446,24 L 462,20 L 478,22 L 492,30 L 498,42 L 494,54 L 480,60 L 464,60 L 450,54 L 442,42 L 440,32 Z' },
  // Central/Eastern Europe
  { id: 'ceu', d: 'M 488,52 L 514,50 L 534,54 L 546,64 L 546,78 L 536,88 L 520,94 L 502,94 L 488,86 L 482,72 Z' },
  // Balkans & Greece
  { id: 'bal', d: 'M 488,92 L 508,90 L 522,96 L 526,108 L 518,120 L 504,126 L 490,122 L 482,110 Z' },
  // Turkey
  { id: 'tr', d: 'M 524,96 L 554,92 L 578,94 L 594,102 L 598,114 L 590,124 L 568,130 L 546,128 L 528,118 Z' },
  // Russia / Northern Asia
  { id: 'ru1', d: 'M 534,24 L 590,18 L 650,16 L 710,18 L 768,22 L 818,28 L 854,36 L 868,48 L 862,60 L 842,70 L 814,76 L 778,80 L 736,80 L 694,78 L 652,76 L 610,76 L 572,76 L 542,76 L 526,66 L 522,50 Z' },
  // Russia east
  { id: 'ru2', d: 'M 818,28 L 868,48 L 880,62 L 880,78 L 868,88 L 848,90 L 830,84 L 814,76 Z' },
  // Middle East / Arabia
  { id: 'me', d: 'M 560,126 L 590,120 L 616,122 L 634,132 L 638,148 L 630,164 L 612,174 L 590,178 L 568,172 L 552,158 L 548,142 Z' },
  // Africa
  { id: 'af', d: 'M 436,122 L 462,116 L 488,116 L 510,122 L 526,132 L 536,146 L 540,162 L 540,180 L 536,200 L 528,222 L 516,246 L 502,270 L 486,292 L 470,312 L 454,328 L 438,336 L 422,330 L 408,314 L 396,292 L 388,268 L 384,242 L 384,216 L 388,192 L 396,170 L 408,152 L 420,138 Z' },
  // Madagascar
  { id: 'mad', d: 'M 542,274 L 552,266 L 560,272 L 560,290 L 552,300 L 542,296 L 538,284 Z' },
  // Central Asia
  { id: 'cas', d: 'M 572,76 L 620,74 L 654,80 L 672,94 L 668,110 L 648,120 L 618,122 L 590,118 L 568,106 L 562,90 Z' },
  // Iran / Pakistan
  { id: 'irpak', d: 'M 598,114 L 630,108 L 660,110 L 682,120 L 690,136 L 682,150 L 660,158 L 636,156 L 614,146 L 600,132 Z' },
  // India
  { id: 'india', d: 'M 636,118 L 672,112 L 698,116 L 714,128 L 716,146 L 706,164 L 688,178 L 666,184 L 644,178 L 628,162 L 620,144 Z' },
  // China & East Asia
  { id: 'china', d: 'M 672,78 L 718,74 L 758,76 L 786,84 L 800,96 L 800,112 L 790,126 L 770,136 L 744,140 L 716,138 L 692,128 L 672,114 L 664,98 Z' },
  // Southeast Asia mainland
  { id: 'sea', d: 'M 712,136 L 738,132 L 756,140 L 762,154 L 754,168 L 736,176 L 714,172 L 700,158 L 700,144 Z' },
  // Korea
  { id: 'kor', d: 'M 794,96 L 806,92 L 814,98 L 812,110 L 804,116 L 794,112 Z' },
  // Japan
  { id: 'jap', d: 'M 818,88 L 832,84 L 842,90 L 844,102 L 836,110 L 822,108 L 814,100 Z' },
  // Indonesia
  { id: 'indo', d: 'M 720,178 L 762,172 L 796,174 L 820,182 L 820,192 L 796,196 L 758,194 L 722,188 Z' },
  // Philippines
  { id: 'phi', d: 'M 800,146 L 812,142 L 820,150 L 816,162 L 806,164 L 798,156 Z' },
  // Australia
  { id: 'aus', d: 'M 734,266 L 768,258 L 806,258 L 836,264 L 856,276 L 864,292 L 862,310 L 852,326 L 832,338 L 806,344 L 778,342 L 752,332 L 734,316 L 724,298 L 722,280 Z' },
  // New Zealand
  { id: 'nz', d: 'M 868,318 L 876,312 L 884,318 L 882,332 L 872,338 L 862,330 Z' },
  // West Africa bulge
  { id: 'waf', d: 'M 388,196 L 416,190 L 438,194 L 444,208 L 430,220 L 408,222 L 390,212 Z' },
  // Horn of Africa
  { id: 'horn', d: 'M 536,196 L 556,188 L 572,192 L 574,206 L 562,218 L 544,218 L 534,208 Z' },
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

function StatCard({ label, value, icon: Icon, color, subtext, accent }) {
  return (
    <div className={"relative bg-slate-900 border rounded-2xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] " + accent}>
      <div className={"inline-flex p-2.5 rounded-xl bg-slate-800/80 mb-4 " + color}>
        <Icon className="w-5 h-5" />
      </div>
      <p className={"text-3xl sm:text-4xl font-bold font-mono tabular-nums tracking-tight mb-1 " + color}>{value}</p>
      <p className="text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-widest leading-tight">{label}</p>
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

  const activeAlerts = (data.whoAlertCount ?? 0) + (data.promedAlertCount ?? 0) + (data.newsCount ?? 0);
  const infectedCountries = data.countriesWithAlerts ?? data.mapPoints?.length ?? 0;
  const totalDeaths = data.totalDeaths;

  const stats = [
    {
      label: 'Active Cases Globally',
      value: activeAlerts > 0 ? activeAlerts.toLocaleString() : '—',
      icon: Activity,
      color: 'text-amber-400',
      accent: 'border-amber-500/20 hover:border-amber-500/40',
      subtext: 'WHO · ProMED · News alerts',
    },
    {
      label: 'Total Deaths (Historic)',
      value: typeof totalDeaths === 'number' ? totalDeaths.toLocaleString() : '~38% CFR',
      icon: Skull,
      color: 'text-red-400',
      accent: 'border-red-500/20 hover:border-red-500/40',
      subtext: 'Case fatality rate ~38% (CDC)',
    },
    {
      label: 'Countries Affected',
      value: infectedCountries > 0 ? infectedCountries : '30+',
      icon: MapPin,
      color: 'text-cyan-400',
      accent: 'border-cyan-500/20 hover:border-cyan-500/40',
      subtext: 'With reported cases / alerts',
    },
  ];

  return (
    <div
      className="min-h-screen bg-slate-950 text-white"
      style={{ fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }}
    >
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage:
          'radial-gradient(ellipse 60% 40% at 10% 60%,rgba(6,182,212,0.04) 0%,transparent 70%),' +
          'radial-gradient(ellipse 50% 35% at 85% 20%,rgba(239,68,68,0.04) 0%,transparent 65%)',
      }} />

      {/* Header */}
      <header className="relative border-b border-slate-800/80 sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative p-2 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-xl shadow-lg shadow-cyan-500/20 shrink-0">
                <Globe className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-slate-950" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold tracking-[0.12em] text-white">HANTAVIRUS TRACKER</h1>
                <p className="text-[9px] text-slate-500 tracking-[0.2em] hidden sm:block">GLOBAL REAL-TIME SURVEILLANCE</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="text-slate-300 text-[10px]">
                  {lastUpdate ? lastUpdate.toLocaleString() : '—'}
                </span>
              </p>
              <p className="text-[9px] text-cyan-500/80 tracking-widest mt-0.5">AUTO-REFRESH: 5m</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* 3 stat cards — stacked on mobile, side-by-side on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-7 sm:mb-8">
          {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
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
              className={
                'px-3 sm:px-4 py-2 rounded-lg text-xs font-medium tracking-widest uppercase transition-all duration-200 ' +
                (activeTab === tab.id
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700/50')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    <span className="text-xs text-slate-400 tracking-wide">LIVE ALERT MAP</span>
                  </div>
                  <span className="text-xs text-slate-600">{data.mapPoints?.length ?? 0} locations</span>
                </div>

                {/* Responsive SVG wrapper */}
                <div className="relative w-full" style={{ paddingBottom: '51%' }}>
                  <svg
                    viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ background: 'linear-gradient(180deg,#080f1f 0%,#0a1628 60%,#080f1f 100%)' }}
                  >
                    <defs>
                      <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="0.7" fill="#1e3a5f" opacity="0.45" />
                      </pattern>
                      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                      <filter id="halo" x="-150%" y="-150%" width="400%" height="400%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>

                    <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#dots)" />

                    {/* Latitude lines */}
                    {[1, 2, 3, 4, 5].map(n => (
                      <line key={n} x1="0" y1={n * MAP_HEIGHT / 6} x2={MAP_WIDTH} y2={n * MAP_HEIGHT / 6}
                        stroke="#0e2a45" strokeWidth="0.5" strokeDasharray="4 10" />
                    ))}
                    {/* Equator */}
                    <line x1="0" y1={MAP_HEIGHT / 2} x2={MAP_WIDTH} y2={MAP_HEIGHT / 2}
                      stroke="#0d3d5e" strokeWidth="0.9" strokeDasharray="6 6" />

                    {/* Continents */}
                    {WORLD_PATHS.map(({ id, d }) => (
                      <path key={id} d={d} fill="#152030" stroke="#1e3a52" strokeWidth="0.9" strokeLinejoin="round" />
                    ))}

                    {/* Alert dots */}
                    {data.mapPoints && data.mapPoints.map((point, i) => {
                      const { x, y } = latLngToXY(point.lat, point.lng);
                      const isSel = selectedPoint?.country === point.country;
                      const isHov = hoveredPoint?.country === point.country;
                      const active = isSel || isHov;
                      const size = Math.min(5 + point.alertCount * 1.8, 15);
                      const dotColor = isSel ? '#22d3ee' : '#ef4444';
                      const haloColor = isSel ? '#0891b2' : '#991b1b';

                      return (
                        <g key={i}
                          onClick={() => setSelectedPoint(isSel ? null : point)}
                          onMouseEnter={() => setHoveredPoint(point)}
                          onMouseLeave={() => setHoveredPoint(null)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Halo glow */}
                          <circle cx={x} cy={y} r={size + 12} fill={haloColor} opacity={active ? 0.1 : 0.05} filter="url(#halo)" />
                          {/* Pulse ring */}
                          <circle cx={x} cy={y} r={size + 5} fill="none" stroke={dotColor} strokeWidth="0.8" opacity={active ? 0.4 : 0.15}>
                            <animate attributeName="r" values={`${size + 2};${size + 11}`} dur="2.2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.5;0" dur="2.2s" repeatCount="indefinite" />
                          </circle>
                          {/* Dot */}
                          <circle cx={x} cy={y} r={size}
                            fill={dotColor} opacity={active ? 1 : 0.85}
                            stroke={active ? '#fff' : (isSel ? '#67e8f9' : '#fca5a5')}
                            strokeWidth={active ? 1.5 : 1}
                            filter="url(#glow)"
                          />
                          {point.alertCount > 1 && (
                            <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle"
                              fontSize="7" fill="white" fontWeight="bold" style={{ pointerEvents: 'none' }}>
                              {point.alertCount}
                            </text>
                          )}
                          <text x={x} y={y + size + 9} textAnchor="middle"
                            fontSize="7" fill={active ? '#94a3b8' : '#334d66'}
                            style={{ pointerEvents: 'none', fontFamily: 'monospace' }}>
                            {point.country}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="px-4 py-2.5 flex flex-wrap items-center gap-4 text-xs border-t border-slate-800/60">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Alert
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />Selected
                  </span>
                  <span className="text-slate-600">Tap a dot for details</span>
                </div>
              </div>
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-1">
              {selectedPoint ? (
                <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-800/60 bg-cyan-500/5 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-cyan-400 tracking-wide">{selectedPoint.country}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedPoint.alertCount} alert{selectedPoint.alertCount !== 1 ? 's' : ''} · {selectedPoint.sources.join(', ')}
                      </p>
                    </div>
                    <button onClick={() => setSelectedPoint(null)}
                      className="text-slate-500 hover:text-white w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors text-xl shrink-0">
                      ×
                    </button>
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                    {selectedPoint.alerts.map((alert, i) => (
                      <div key={i} className="p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <SourceBadge source={alert.source} />
                          <span className="text-xs text-slate-600">
                            {alert.published ? new Date(alert.published).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed mb-1">{alert.title}</p>
                        {alert.summary && (
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-2"
                            dangerouslySetInnerHTML={{ __html: alert.summary }} />
                        )}
                        {alert.link && (
                          <a href={alert.link} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />Read full report
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-48">
                  <div className="w-14 h-14 rounded-full bg-slate-800/60 flex items-center justify-center mb-3">
                    <Globe className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="text-slate-400 text-sm">Tap a dot on the map</p>
                  <p className="text-slate-600 text-xs mt-1">to see alerts for that location</p>
                  <p className="text-slate-700 text-xs mt-4 pt-4 border-t border-slate-800/60 w-full">
                    {data.mapPoints?.length ?? 0} active locations
                  </p>
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
                <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 hover:border-slate-700/60 transition-all duration-200">
                  <div className="flex items-start justify-between gap-3">
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
              <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-10 text-center">
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
              <span key={i} className="bg-slate-900 border border-slate-700/50 rounded-full px-3 py-1 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-colors">
                {region}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="text-slate-700 tracking-wider uppercase text-[9px] font-semibold">Sources:</span>
          {data.dataSources?.map((s, i) => (
            <span key={i} className="text-slate-600">{s}</span>
          ))}
          {lastUpdate && (
            <span className="sm:ml-auto text-slate-700 text-[10px]">
              Last fetch: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-800/60 mt-10 py-5 text-center text-xs text-slate-600 px-4">
        <p>Data sourced from WHO, ProMED, CDC, and Google News. Updated hourly via GitHub Actions.</p>
        <p className="mt-1 text-slate-700">For medical guidance, consult official health authorities. This tracker is for informational purposes only.</p>
      </footer>
    </div>
  );
}
