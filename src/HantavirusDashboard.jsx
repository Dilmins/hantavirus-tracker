import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle, Clock, ExternalLink, Globe, Newspaper,
  Radio, MapPin, Skull, Activity, ChevronDown, ChevronUp,
  RefreshCw, Wifi,
} from 'lucide-react';

// ─── Map constants ─────────────────────────────────────────────────────────
const W = 1000;
const H = 500;

const LAND = [
  { id: 'na',    d: 'M 68,58 L 78,52 L 92,48 L 110,44 L 130,42 L 152,44 L 168,48 L 180,54 L 190,62 L 196,72 L 200,84 L 202,98 L 200,112 L 196,126 L 190,138 L 182,150 L 172,160 L 160,170 L 148,178 L 134,184 L 120,188 L 108,188 L 96,184 L 86,176 L 78,166 L 72,154 L 68,140 L 66,126 L 66,112 L 68,98 L 70,84 L 70,70 Z' },
  { id: 'ak',    d: 'M 40,42 L 55,38 L 68,40 L 72,50 L 65,58 L 52,60 L 40,55 Z' },
  { id: 'gl',    d: 'M 192,18 L 210,14 L 228,14 L 244,18 L 252,26 L 252,36 L 246,46 L 232,52 L 216,52 L 200,46 L 190,36 L 188,26 Z' },
  { id: 'cam',   d: 'M 120,188 L 136,186 L 148,190 L 154,198 L 150,208 L 140,214 L 128,212 L 118,204 Z' },
  { id: 'car',   d: 'M 168,186 L 176,184 L 180,188 L 178,194 L 170,194 L 166,190 Z' },
  { id: 'sa',    d: 'M 148,212 L 168,208 L 186,208 L 202,212 L 216,220 L 226,232 L 232,248 L 234,266 L 232,284 L 228,302 L 222,320 L 212,338 L 200,354 L 186,366 L 172,372 L 158,368 L 146,358 L 136,342 L 128,322 L 124,300 L 122,278 L 124,256 L 128,238 L 136,222 Z' },
  { id: 'ic',    d: 'M 370,30 L 384,26 L 396,28 L 400,36 L 394,44 L 380,46 L 368,40 Z' },
  { id: 'uk',    d: 'M 406,54 L 418,50 L 428,54 L 430,64 L 424,72 L 412,74 L 404,66 Z' },
  { id: 'weu',   d: 'M 420,56 L 440,52 L 462,52 L 478,58 L 488,68 L 492,80 L 488,92 L 478,100 L 462,106 L 446,108 L 430,104 L 418,96 L 412,84 L 412,72 Z' },
  { id: 'scan',  d: 'M 446,24 L 462,20 L 478,22 L 492,30 L 498,42 L 494,54 L 480,60 L 464,60 L 450,54 L 442,42 L 440,32 Z' },
  { id: 'ceu',   d: 'M 488,52 L 514,50 L 534,54 L 546,64 L 546,78 L 536,88 L 520,94 L 502,94 L 488,86 L 482,72 Z' },
  { id: 'bal',   d: 'M 488,92 L 508,90 L 522,96 L 526,108 L 518,120 L 504,126 L 490,122 L 482,110 Z' },
  { id: 'tr',    d: 'M 524,96 L 554,92 L 578,94 L 594,102 L 598,114 L 590,124 L 568,130 L 546,128 L 528,118 Z' },
  { id: 'ru1',   d: 'M 534,24 L 590,18 L 650,16 L 710,18 L 768,22 L 818,28 L 854,36 L 868,48 L 862,60 L 842,70 L 814,76 L 778,80 L 736,80 L 694,78 L 652,76 L 610,76 L 572,76 L 542,76 L 526,66 L 522,50 Z' },
  { id: 'ru2',   d: 'M 818,28 L 868,48 L 880,62 L 880,78 L 868,88 L 848,90 L 830,84 L 814,76 Z' },
  { id: 'me',    d: 'M 560,126 L 590,120 L 616,122 L 634,132 L 638,148 L 630,164 L 612,174 L 590,178 L 568,172 L 552,158 L 548,142 Z' },
  { id: 'af',    d: 'M 436,122 L 462,116 L 488,116 L 510,122 L 526,132 L 536,146 L 540,162 L 540,180 L 536,200 L 528,222 L 516,246 L 502,270 L 486,292 L 470,312 L 454,328 L 438,336 L 422,330 L 408,314 L 396,292 L 388,268 L 384,242 L 384,216 L 388,192 L 396,170 L 408,152 L 420,138 Z' },
  { id: 'mad',   d: 'M 542,274 L 552,266 L 560,272 L 560,290 L 552,300 L 542,296 L 538,284 Z' },
  { id: 'cas',   d: 'M 572,76 L 620,74 L 654,80 L 672,94 L 668,110 L 648,120 L 618,122 L 590,118 L 568,106 L 562,90 Z' },
  { id: 'irpak', d: 'M 598,114 L 630,108 L 660,110 L 682,120 L 690,136 L 682,150 L 660,158 L 636,156 L 614,146 L 600,132 Z' },
  { id: 'india', d: 'M 636,118 L 672,112 L 698,116 L 714,128 L 716,146 L 706,164 L 688,178 L 666,184 L 644,178 L 628,162 L 620,144 Z' },
  { id: 'china', d: 'M 672,78 L 718,74 L 758,76 L 786,84 L 800,96 L 800,112 L 790,126 L 770,136 L 744,140 L 716,138 L 692,128 L 672,114 L 664,98 Z' },
  { id: 'sea',   d: 'M 712,136 L 738,132 L 756,140 L 762,154 L 754,168 L 736,176 L 714,172 L 700,158 L 700,144 Z' },
  { id: 'kor',   d: 'M 794,96 L 806,92 L 814,98 L 812,110 L 804,116 L 794,112 Z' },
  { id: 'jap',   d: 'M 818,88 L 832,84 L 842,90 L 844,102 L 836,110 L 822,108 L 814,100 Z' },
  { id: 'indo',  d: 'M 720,178 L 762,172 L 796,174 L 820,182 L 820,192 L 796,196 L 758,194 L 722,188 Z' },
  { id: 'phi',   d: 'M 800,146 L 812,142 L 820,150 L 816,162 L 806,164 L 798,156 Z' },
  { id: 'aus',   d: 'M 734,266 L 768,258 L 806,258 L 836,264 L 856,276 L 864,292 L 862,310 L 852,326 L 832,338 L 806,344 L 778,342 L 752,332 L 734,316 L 724,298 L 722,280 Z' },
  { id: 'nz',    d: 'M 868,318 L 876,312 L 884,318 L 882,332 L 872,338 L 862,330 Z' },
  { id: 'waf',   d: 'M 388,196 L 416,190 L 438,194 L 444,208 L 430,220 L 408,222 L 390,212 Z' },
  { id: 'horn',  d: 'M 536,196 L 556,188 L 572,192 L 574,206 L 562,218 L 544,218 L 534,208 Z' },
];

function latlngToXY(lat, lng) {
  return { x: ((lng + 180) / 360) * W, y: ((90 - lat) / 180) * H };
}

// ─── Tiny components ───────────────────────────────────────────────────────

function SourceBadge({ source }) {
  const map = {
    WHO:    'bg-blue-500/20 text-blue-300 border-blue-500/40',
    ProMED: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    News:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  };
  return (
    <span className={"text-[10px] px-2 py-0.5 rounded-full border font-semibold tracking-wide " + (map[source] || map.News)}>
      {source}
    </span>
  );
}

function RiskBadge({ level }) {
  const map = {
    high:   'bg-red-500/15 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    low:    'bg-green-500/15 text-green-400 border-green-500/30',
  };
  return (
    <span className={"text-[10px] px-2 py-0.5 rounded-full border font-semibold tracking-widest uppercase " + (map[level] || map.low)}>
      {level} risk
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, borderColor, subtext }) {
  return (
    <div className={"relative bg-slate-900 border rounded-2xl p-5 sm:p-7 overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] " + borderColor}>
      <div className={"inline-flex p-2.5 rounded-xl bg-slate-800 mb-4 " + color}>
        <Icon className="w-5 h-5" />
      </div>
      <p className={"text-4xl sm:text-5xl font-bold font-mono tabular-nums tracking-tight mb-1.5 " + color}>
        {value ?? '—'}
      </p>
      <p className="text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-widest leading-snug">{label}</p>
      {subtext && <p className="text-[11px] text-slate-500 mt-1.5">{subtext}</p>}
    </div>
  );
}

// ─── Outbreak card ─────────────────────────────────────────────────────────

function OutbreakCard({ outbreak }) {
  const [open, setOpen] = useState(false);
  const cfr = outbreak.cases > 0
    ? Math.round((outbreak.deaths / outbreak.cases) * 100)
    : 0;

  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-200 cursor-pointer"
      onClick={() => setOpen(o => !o)}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight">{outbreak.location}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <RiskBadge level={outbreak.riskLevel || 'medium'} />
              <span className="text-[11px] text-slate-500 font-mono">{outbreak.strain}</span>
            </div>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 mt-1" />}
        </div>

        {/* Summary stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Cases', value: outbreak.cases, color: 'text-amber-400' },
            { label: 'Deaths', value: outbreak.deaths, color: 'text-red-400' },
            { label: 'CFR', value: cfr + '%', color: 'text-slate-300' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-800/60 rounded-xl p-3 text-center">
              <p className={"text-xl sm:text-2xl font-bold font-mono tabular-nums " + color}>{value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-slate-800 p-4 sm:p-5 space-y-3 bg-slate-900/60">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-500 uppercase tracking-wider mb-0.5">Confirmed</p>
              <p className="text-cyan-400 font-bold font-mono text-lg">{outbreak.confirmed}</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase tracking-wider mb-0.5">Last Update</p>
              <p className="text-slate-300 font-mono">{outbreak.lastUpdate}</p>
            </div>
          </div>
          {outbreak.status && (
            <div className="bg-slate-800/50 rounded-lg px-3 py-2">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
              <p className="text-sm text-slate-200">{outbreak.status}</p>
            </div>
          )}
          {outbreak.notes && (
            <p className="text-xs text-slate-400 leading-relaxed">{outbreak.notes}</p>
          )}
          {outbreak.sourceUrl && (
            <a href={outbreak.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400/80 hover:text-cyan-300 transition-colors"
              onClick={e => e.stopPropagation()}>
              <ExternalLink className="w-3 h-3" />
              Official source: {outbreak.source}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────

export default function HantavirusDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('outbreaks');
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      // Cache-bust so we always get the latest JSON
      const url = '/hantavirus-tracker/data/hantavirus-data.json?t=' + Date.now();
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date(json.lastUpdated));
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
    // Refresh every 5 minutes so the UI stays live
    const id = setInterval(() => loadData(true), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [loadData]);

  // ── Loading screen ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-cyan-400/50 animate-pulse" />
            <Globe className="absolute inset-0 m-auto w-7 h-7 text-cyan-400" />
          </div>
          <p className="text-cyan-400/80 tracking-[0.3em] text-xs">LOADING SURVEILLANCE DATA</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-red-400 text-sm">Unable to load surveillance data</p>
          <p className="text-slate-600 text-xs font-mono">{error}</p>
          <button onClick={() => loadData(false)}
            className="mt-2 px-4 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Stats ───────────────────────────────────────────────────────────────
  const stats = [
    {
      label: 'Active Cases',
      value: (data.totalCases ?? 0).toLocaleString(),
      icon: Activity,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/20 hover:border-amber-500/40',
      subtext: 'From verified active outbreaks',
    },
    {
      label: 'Confirmed Deaths',
      value: (data.totalDeaths ?? 0).toLocaleString(),
      icon: Skull,
      color: 'text-red-400',
      borderColor: 'border-red-500/20 hover:border-red-500/40',
      subtext: 'Case fatality rate ~' + (
        data.totalCases > 0
          ? Math.round((data.totalDeaths / data.totalCases) * 100)
          : 38
      ) + '%',
    },
    {
      label: 'Countries Affected',
      value: data.countriesAffected ?? '—',
      icon: MapPin,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/20 hover:border-cyan-500/40',
      subtext: 'With confirmed active transmission',
    },
  ];

  const tabs = [
    { id: 'outbreaks', label: '⚠ Outbreaks' },
    { id: 'map',       label: '🗺 Map' },
    { id: 'news',      label: '📰 News' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white"
      style={{ fontFamily: "'Space Mono','JetBrains Mono','Courier New',monospace" }}>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage:
          'radial-gradient(ellipse 70% 50% at 5% 70%,rgba(6,182,212,.04) 0%,transparent 65%),' +
          'radial-gradient(ellipse 60% 45% at 90% 15%,rgba(239,68,68,.04) 0%,transparent 60%)',
      }} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative border-b border-slate-800/80 sticky top-0 z-50 bg-slate-950/96 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative p-2 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-xl shadow-lg shadow-cyan-500/20 shrink-0">
                <Globe className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-slate-950" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold tracking-[0.12em]">HANTAVIRUS TRACKER</h1>
                <p className="text-[9px] text-slate-500 tracking-[0.2em] hidden sm:block">GLOBAL REAL-TIME SURVEILLANCE</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Live indicator */}
              <div className="hidden sm:flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 tracking-wider">LIVE</span>
              </div>
              {/* Manual refresh */}
              <button onClick={() => loadData(true)} disabled={refreshing}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                <RefreshCw className={"w-3.5 h-3.5 " + (refreshing ? "animate-spin text-cyan-400" : "")} />
              </button>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="text-slate-300">{lastUpdate ? lastUpdate.toLocaleTimeString() : '—'}</span>
                </p>
                <p className="text-[9px] text-cyan-500/70 tracking-widest mt-0.5">AUTO-REFRESH 5m</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── 3 Stat Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
          {stats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        {/* ── Context bar ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-slate-500 mb-7 pl-1">
          <span>WHO alerts: <strong className="text-slate-400">{data.whoAlertCount ?? 0}</strong></span>
          <span>ProMED alerts: <strong className="text-slate-400">{data.promedAlertCount ?? 0}</strong></span>
          <span>News items: <strong className="text-slate-400">{data.newsCount ?? 0}</strong></span>
          <span>Map pins: <strong className="text-slate-400">{data.locationsTracked ?? data.mapPoints?.length ?? 0}</strong></span>
          <span className="sm:ml-auto text-slate-600 font-mono text-[10px]">
            US historic (CDC): {data.usHistoric?.totalCases?.toLocaleString() ?? '—'} cases / {data.usHistoric?.totalDeaths?.toLocaleString() ?? '—'} deaths since 1993
          </span>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={
                'px-3 sm:px-4 py-2 rounded-lg text-xs font-medium tracking-widest uppercase transition-all duration-200 ' +
                (activeTab === t.id
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700/50')
              }>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OUTBREAKS TAB ───────────────────────────────────────────── */}
        {activeTab === 'outbreaks' && (
          <div className="space-y-4">
            {data.outbreaks && data.outbreaks.length > 0
              ? data.outbreaks.map((ob, i) => <OutbreakCard key={i} outbreak={ob} />)
              : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
                  <AlertTriangle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No verified active outbreaks at this time</p>
                </div>
              )
            }
          </div>
        )}

        {/* ── MAP TAB ─────────────────────────────────────────────────── */}
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

                <div className="relative w-full" style={{ paddingBottom: '51%' }}>
                  <svg viewBox={`0 0 ${W} ${H}`}
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ background: 'linear-gradient(180deg,#080f1f 0%,#0a1628 60%,#080f1f 100%)' }}>
                    <defs>
                      <pattern id="dots2" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="0.7" fill="#1e3a5f" opacity="0.45" />
                      </pattern>
                      <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.5" result="b" />
                        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                      <filter id="halo2" x="-150%" y="-150%" width="400%" height="400%">
                        <feGaussianBlur stdDeviation="8" result="b" />
                        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>

                    <rect width={W} height={H} fill="url(#dots2)" />
                    {[1,2,3,4,5].map(n => (
                      <line key={n} x1="0" y1={n*H/6} x2={W} y2={n*H/6}
                        stroke="#0e2a45" strokeWidth="0.5" strokeDasharray="4 10" />
                    ))}
                    <line x1="0" y1={H/2} x2={W} y2={H/2}
                      stroke="#0d3d5e" strokeWidth="0.9" strokeDasharray="6 6" />

                    {LAND.map(({ id, d }) => (
                      <path key={id} d={d} fill="#152030" stroke="#1e3a52" strokeWidth="0.9" strokeLinejoin="round" />
                    ))}

                    {data.mapPoints && data.mapPoints.map((pt, i) => {
                      const { x, y } = latlngToXY(pt.lat, pt.lng);
                      const isSel = selectedPoint?.country === pt.country;
                      const isHov = hoveredPoint?.country === pt.country;
                      const active = isSel || isHov;
                      const sz = Math.min(5 + pt.alertCount * 1.8, 15);
                      const dc = isSel ? '#22d3ee' : '#ef4444';
                      const hc = isSel ? '#0891b2' : '#991b1b';
                      return (
                        <g key={i}
                          onClick={() => setSelectedPoint(isSel ? null : pt)}
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                          style={{ cursor: 'pointer' }}>
                          <circle cx={x} cy={y} r={sz+12} fill={hc} opacity={active?0.1:0.04} filter="url(#halo2)" />
                          <circle cx={x} cy={y} r={sz+5} fill="none" stroke={dc} strokeWidth="0.8" opacity={active?0.4:0.15}>
                            <animate attributeName="r" values={`${sz+2};${sz+11}`} dur="2.2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.5;0" dur="2.2s" repeatCount="indefinite" />
                          </circle>
                          <circle cx={x} cy={y} r={sz}
                            fill={dc} opacity={active?1:0.85}
                            stroke={active?'#fff':'#fca5a5'} strokeWidth={active?1.5:1}
                            filter="url(#glow2)" />
                          {pt.alertCount > 1 && (
                            <text x={x} y={y+0.5} textAnchor="middle" dominantBaseline="middle"
                              fontSize="7" fill="white" fontWeight="bold" style={{ pointerEvents:'none' }}>
                              {pt.alertCount}
                            </text>
                          )}
                          <text x={x} y={y+sz+9} textAnchor="middle"
                            fontSize="7" fill={active?'#94a3b8':'#334d66'}
                            style={{ pointerEvents:'none', fontFamily:'monospace' }}>
                            {pt.country}
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

            {/* Map side panel */}
            <div className="lg:col-span-1">
              {selectedPoint ? (
                <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-800/60 bg-cyan-500/5 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-cyan-400 tracking-wide">{selectedPoint.country}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {selectedPoint.alertCount} alert{selectedPoint.alertCount !== 1 ? 's' : ''} · {selectedPoint.sources?.join(', ')}
                      </p>
                    </div>
                    <button onClick={() => setSelectedPoint(null)}
                      className="text-slate-500 hover:text-white w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors text-xl shrink-0">
                      ×
                    </button>
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
                    {selectedPoint.alerts?.map((a, i) => (
                      <div key={i} className="p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <SourceBadge source={a.source} />
                          <span className="text-[11px] text-slate-600">
                            {a.published ? new Date(a.published).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed mb-1">{a.title}</p>
                        {a.summary && (
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-2"
                            dangerouslySetInnerHTML={{ __html: a.summary }} />
                        )}
                        {a.link && (
                          <a href={a.link} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />Read report
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
                  <p className="text-slate-400 text-sm">Tap a dot to see alerts</p>
                  <p className="text-slate-700 text-xs mt-4 pt-4 border-t border-slate-800/60 w-full">
                    {data.mapPoints?.length ?? 0} active locations
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── NEWS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'news' && (
          <div className="space-y-2">
            {data.recentNews && data.recentNews.length > 0 ? (
              data.recentNews.map((item, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 hover:border-slate-700/60 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <SourceBadge source={item.source} />
                        <span className="text-[11px] text-slate-600">
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

        {/* ── Endemic regions ───────────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-slate-800/60">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-3">Endemic Regions</h2>
          <div className="flex flex-wrap gap-2">
            {data.endemicRegions?.map((r, i) => (
              <span key={i} className="bg-slate-900 border border-slate-700/50 rounded-full px-3 py-1 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-colors">
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* ── Sources footer row ───────────────────────────────────────── */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          <span className="text-slate-700 tracking-wider uppercase text-[9px] font-semibold">Sources:</span>
          {data.dataSources?.map((s, i) => (
            <span key={i} className="text-slate-600">{s}</span>
          ))}
          {lastUpdate && (
            <span className="sm:ml-auto text-slate-700 text-[10px] font-mono">
              Fetched {lastUpdate.toLocaleString()}
            </span>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-800/60 mt-10 py-5 text-center text-xs text-slate-600 px-4">
        <p>Data sourced from WHO, ProMED, CDC, and Google News. Updated every 15 minutes via GitHub Actions.</p>
        <p className="mt-1 text-slate-700">For medical guidance, consult official health authorities. This tracker is for informational purposes only.</p>
      </footer>
    </div>
  );
}
