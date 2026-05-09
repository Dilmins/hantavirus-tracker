import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

// ── Data URL ──────────────────────────────────────────────────────────────────
const DATA_URL = '/hantavirus-tracker/data/hantavirus-data.json';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// ── Risk colours ──────────────────────────────────────────────────────────────
const RISK_COLORS = {
  high:    '#ef4444',
  medium:  '#f97316',
  low:     '#eab308',
  default: '#6366f1',
};
const riskColor = (level) => RISK_COLORS[level] ?? RISK_COLORS.default;

// ── TopoJSON cache ────────────────────────────────────────────────────────────
let _worldCache = null;

// ─────────────────────────────────────────────────────────────────────────────
// WorldMap sub-component
// ─────────────────────────────────────────────────────────────────────────────
function WorldMap({ outbreaks = [], mapPoints = [] }) {
  const svgRef     = useRef(null);
  const wrapperRef = useRef(null);
  const [tooltip,  setTooltip]  = useState(null);
  const [selected, setSelected] = useState(null);
  const [dims,     setDims]     = useState({ w: 800, h: 416 });

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setDims({ w, h: Math.round(w * 0.52) });
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const { w, h } = dims;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const projection = d3.geoNaturalEarth1().scale(w / 6.3).translate([w / 2, h / 2]);
    const path = d3.geoPath().projection(projection);

    svg.append('rect').attr('width', w).attr('height', h).attr('fill', '#0f172a');

    const graticule = d3.geoGraticule().step([20, 20]);
    svg.append('path').datum(graticule()).attr('d', path)
      .attr('fill', 'none').attr('stroke', '#1e293b').attr('stroke-width', 0.4);

    const ENDEMIC_IDS = new Set([32, 152, 840, 484, 76, 643, 156, 410]);

    const drawWorld = (world) => {
      const countries = topojson.feature(world, world.objects.countries);
      const borders   = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);

      svg.append('g').selectAll('path').data(countries.features).join('path')
        .attr('d', path).attr('fill', '#1e3a5f').attr('stroke', 'none');

      svg.append('path').datum(borders).attr('d', path)
        .attr('fill', 'none').attr('stroke', '#0f2a4a').attr('stroke-width', 0.5);

      svg.append('g').selectAll('path')
        .data(countries.features.filter(f => ENDEMIC_IDS.has(+f.id))).join('path')
        .attr('d', path).attr('fill', '#1d4ed8').attr('fill-opacity', 0.18)
        .attr('stroke', '#3b82f6').attr('stroke-width', 0.4).attr('stroke-opacity', 0.35);

      drawPoints();
    };

    const drawPoints = () => {
      const mpGroup = svg.append('g');
      mapPoints.forEach((mp) => {
        const pt = projection([mp.lng, mp.lat]);
        if (!pt) return;
        mpGroup.append('circle').attr('cx', pt[0]).attr('cy', pt[1]).attr('r', 6)
          .attr('fill', 'none').attr('stroke', '#6366f1').attr('stroke-width', 1).attr('opacity', 0.5);
        mpGroup.append('circle').attr('cx', pt[0]).attr('cy', pt[1]).attr('r', 4)
          .attr('fill', '#6366f1').attr('fill-opacity', 0.85)
          .attr('stroke', '#a5b4fc').attr('stroke-width', 0.8).style('cursor', 'pointer')
          .on('mouseenter', function(event) {
            d3.select(this).attr('r', 6);
            setTooltip({ x: event.offsetX, y: event.offsetY, content: {
              title: mp.country,
              lines: [`${mp.alertCount} alert${mp.alertCount !== 1 ? 's' : ''}`,
                      `Sources: ${mp.sources?.join(', ') ?? 'News'}`],
              color: '#6366f1',
            }});
          })
          .on('mouseleave', function() { d3.select(this).attr('r', 4); setTooltip(null); })
          .on('click', () => setSelected({ _type: 'mapPoint', ...mp }));
      });

      const obGroup = svg.append('g');
      outbreaks.forEach((ob) => {
        const pt = projection([ob.lng, ob.lat]);
        if (!pt) return;
        const color = riskColor(ob.riskLevel);
        const r = Math.max(6, Math.min(18, 6 + Math.sqrt(ob.cases ?? 1) * 1.5));

        const ring = obGroup.append('circle').attr('cx', pt[0]).attr('cy', pt[1])
          .attr('r', r + 4).attr('fill', 'none').attr('stroke', color)
          .attr('stroke-width', 1.2).attr('opacity', 0.6);
        (function pulse() {
          ring.attr('r', r + 4).attr('opacity', 0.6)
            .transition().duration(1400).ease(d3.easeCubicOut)
            .attr('r', r + 14).attr('opacity', 0).on('end', pulse);
        })();

        obGroup.append('circle').attr('cx', pt[0]).attr('cy', pt[1]).attr('r', r)
          .attr('fill', color).attr('fill-opacity', 0.9)
          .attr('stroke', '#fff').attr('stroke-width', 1.2).style('cursor', 'pointer')
          .on('mouseenter', function(event) {
            d3.select(this).attr('r', r + 3);
            const cfr = ob.deaths && ob.cases ? `${((ob.deaths/ob.cases)*100).toFixed(0)}%` : 'N/A';
            setTooltip({ x: event.offsetX, y: event.offsetY, content: {
              title: ob.location,
              lines: [ob.strain, `Cases: ${ob.cases}  Deaths: ${ob.deaths}  CFR: ${cfr}`,
                      `Status: ${ob.status ?? ob.riskLevel}`],
              color,
            }});
          })
          .on('mouseleave', function() { d3.select(this).attr('r', r); setTooltip(null); })
          .on('click', () => setSelected({ _type: 'outbreak', ...ob }));

        if (ob.riskLevel === 'high') {
          obGroup.append('text').attr('x', pt[0] + r + 4).attr('y', pt[1] + 4)
            .attr('fill', '#f1f5f9').attr('font-size', '10px')
            .attr('font-family', "'Space Mono', monospace").attr('pointer-events', 'none')
            .text(ob.location.length > 20 ? ob.location.slice(0, 18) + '…' : ob.location);
        }
      });
    };

    if (_worldCache) {
      drawWorld(_worldCache);
    } else {
      d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then((world) => { _worldCache = world; drawWorld(world); })
        .catch(() => drawPoints());
    }
  }, [dims, outbreaks, mapPoints]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const cfr = selected?._type === 'outbreak' && selected.cases
    ? `${((selected.deaths / selected.cases) * 100).toFixed(0)}%` : null;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '8px 4px 10px',
        fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#94a3b8' }}>
        {[
          { color: '#ef4444', label: 'High risk outbreak' },
          { color: '#f97316', label: 'Medium risk' },
          { color: '#eab308', label: 'Low risk' },
          { color: '#6366f1', label: 'News alerts' },
          { color: '#1d4ed8', label: 'Endemic region', opacity: 0.4 },
        ].map(({ color, label, opacity = 1 }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10,
              borderRadius: '50%', background: color, opacity }} />
            {label}
          </span>
        ))}
      </div>

      <svg ref={svgRef} width={dims.w} height={dims.h}
        style={{ display: 'block', borderRadius: 8, background: '#0f172a' }}
        aria-label="World map showing hantavirus outbreaks and alerts" />

      {tooltip && (
        <div style={{ position: 'absolute', left: tooltip.x + 12, top: tooltip.y - 8,
          background: '#1e293b', border: `1px solid ${tooltip.content.color}`,
          borderRadius: 6, padding: '8px 12px', pointerEvents: 'none', zIndex: 20,
          maxWidth: 240, fontFamily: "'Space Mono', monospace" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: tooltip.content.color, marginBottom: 4 }}>
            {tooltip.content.title}</div>
          {tooltip.content.lines.map((l, i) => (
            <div key={i} style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.5 }}>{l}</div>
          ))}
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>Click for details</div>
        </div>
      )}

      {selected && (
        <div style={{ marginTop: 12, background: '#1e293b',
          border: `1px solid ${selected._type === 'outbreak' ? riskColor(selected.riskLevel) : '#6366f1'}`,
          borderRadius: 8, padding: 16, fontFamily: "'Space Mono', monospace",
          fontSize: 12, color: '#cbd5e1', position: 'relative' }}>
          <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 10, right: 12,
            background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>×</button>
          {selected._type === 'outbreak' ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: riskColor(selected.riskLevel) }}>
                {selected.location}</div>
              <div style={{ color: '#94a3b8', marginBottom: 10 }}>{selected.region} · {selected.country}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Cases',     value: selected.cases ?? '?' },
                  { label: 'Deaths',    value: selected.deaths ?? '?' },
                  { label: 'CFR',       value: cfr ?? 'N/A' },
                  { label: 'Confirmed', value: selected.confirmed ?? '?' },
                  { label: 'Strain',    value: selected.strain ?? '?' },
                  { label: 'Risk',      value: selected.riskLevel ?? '?' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#0f172a', borderRadius: 6, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 6 }}><span style={{ color: '#64748b' }}>Status: </span>{selected.status}</div>
              {selected.notes && <div style={{ marginBottom: 6, color: '#94a3b8', lineHeight: 1.6 }}>{selected.notes}</div>}
              <div>
                <span style={{ color: '#64748b' }}>Last update: </span>{selected.lastUpdate}
                {selected.sourceUrl && <> · <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: riskColor(selected.riskLevel), textDecoration: 'none' }}>{selected.source} ↗</a></>}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#818cf8' }}>{selected.country}</div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>{selected.alertCount} alert{selected.alertCount !== 1 ? 's' : ''} </span>
                from {selected.sources?.join(', ')}
              </div>
              {selected.alerts?.slice(0, 5).map((a, i) => (
                <div key={i} style={{ borderLeft: '2px solid #6366f1', paddingLeft: 8, marginBottom: 6,
                  color: '#94a3b8', lineHeight: 1.5 }}>{a.title ?? a}</div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function HantavirusDashboard() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [activeTab,  setActiveTab]  = useState('map');
  const [lastFetch,  setLastFetch]  = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch(`${DATA_URL}?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
      setLastFetch(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Space Mono', monospace", color: '#ef4444' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⬤</div>
        <div>Loading surveillance data…</div>
      </div>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Space Mono', monospace", color: '#ef4444' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠</div>
        <div style={{ marginBottom: 8 }}>Unable to load surveillance data</div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{error}</div>
        <button onClick={() => fetchData(true)} style={{ background: '#1e293b', color: '#f1f5f9',
          border: '1px solid #334155', borderRadius: 6, padding: '8px 20px',
          cursor: 'pointer', fontFamily: "'Space Mono', monospace" }}>Retry</button>
      </div>
    </div>
  );

  const tabs = [
    { id: 'outbreaks', label: '⚠ Outbreaks' },
    { id: 'map',       label: '🗺 Map' },
    { id: 'news',      label: '📰 News' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9',
      fontFamily: "'Space Mono', monospace" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #1e293b', padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#ef4444', fontSize: 20 }}>⬤</span>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
              HANTAVIRUS TRACKER
            </span>
            <span style={{ background: '#ef4444', color: '#fff', fontSize: 10,
              padding: '2px 8px', borderRadius: 4, letterSpacing: 1 }}>LIVE</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            Real-time global surveillance · WHO · CDC · ProMED · Google News
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastFetch && (
            <span style={{ fontSize: 11, color: '#64748b' }}>
              Updated {lastFetch.toLocaleTimeString()}
            </span>
          )}
          <button onClick={() => fetchData(true)} disabled={refreshing}
            style={{ background: '#1e293b', color: refreshing ? '#64748b' : '#f1f5f9',
              border: '1px solid #334155', borderRadius: 6, padding: '6px 14px',
              cursor: refreshing ? 'default' : 'pointer',
              fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 16, padding: '20px 24px' }}>
        {[
          { label: 'Active Cases',      value: data.totalCases,        color: '#ef4444' },
          { label: 'Confirmed Deaths',  value: data.totalDeaths,       color: '#f97316' },
          { label: 'Countries Affected',value: data.countriesAffected, color: '#eab308' },
          { label: 'Active Outbreaks',  value: data.activeOutbreaks,   color: '#6366f1' },
          { label: 'Locations Tracked', value: data.locationsTracked,  color: '#3b82f6' },
          { label: 'News Items',        value: data.newsCount,         color: '#10b981' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#1e293b', borderRadius: 8,
            padding: '16px', border: `1px solid ${color}22` }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{value ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* ── US Historic context ──────────────────────────────────────────────── */}
      {data.usHistoric && (
        <div style={{ margin: '0 24px 20px', background: '#1e293b', borderRadius: 8,
          padding: '12px 16px', border: '1px solid #334155',
          display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12, color: '#94a3b8' }}>
          <span>🇺🇸 US Historic (CDC since 1993):</span>
          <span><strong style={{ color: '#f1f5f9' }}>{data.usHistoric.totalCases?.toLocaleString()}</strong> total cases</span>
          <span><strong style={{ color: '#f1f5f9' }}>{data.usHistoric.totalDeaths?.toLocaleString()}</strong> deaths</span>
          <span>Mortality rate: <strong style={{ color: '#ef4444' }}>{data.usHistoric.mortRate}</strong></span>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1e293b',
        padding: '0 24px' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ background: 'none', border: 'none', borderBottom: activeTab === tab.id
              ? '2px solid #ef4444' : '2px solid transparent',
              color: activeTab === tab.id ? '#f1f5f9' : '#64748b',
              padding: '10px 20px', cursor: 'pointer',
              fontFamily: "'Space Mono', monospace", fontSize: 13,
              transition: 'color 0.2s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 24px' }}>

        {/* Outbreaks tab */}
        {activeTab === 'outbreaks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(data.outbreaks ?? []).map((ob, i) => {
              const cfr = ob.cases ? `${((ob.deaths / ob.cases) * 100).toFixed(0)}%` : 'N/A';
              const color = riskColor(ob.riskLevel);
              return (
                <div key={i} style={{ background: '#1e293b', borderRadius: 8,
                  border: `1px solid ${color}44`, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color, marginBottom: 4 }}>
                        {ob.location}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        {ob.region} · {ob.country} · {ob.strain}</div>
                    </div>
                    <span style={{ background: `${color}22`, color, fontSize: 11,
                      padding: '4px 10px', borderRadius: 4, border: `1px solid ${color}44`,
                      whiteSpace: 'nowrap' }}>
                      {ob.riskLevel?.toUpperCase()} RISK
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: 10, marginBottom: 12 }}>
                    {[
                      { label: 'Cases',     value: ob.cases },
                      { label: 'Deaths',    value: ob.deaths },
                      { label: 'CFR',       value: cfr },
                      { label: 'Confirmed', value: ob.confirmed },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: '#0f172a', borderRadius: 6,
                        padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color }}>{value ?? '?'}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 8, lineHeight: 1.6 }}>
                    <span style={{ color: '#64748b' }}>Status: </span>{ob.status}
                  </div>
                  {ob.notes && (
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7,
                      borderLeft: `2px solid ${color}`, paddingLeft: 12, marginBottom: 8 }}>
                      {ob.notes}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Last update: {ob.lastUpdate}
                    {ob.sourceUrl && <> · <a href={ob.sourceUrl} target="_blank" rel="noopener noreferrer"
                      style={{ color, textDecoration: 'none' }}>{ob.source} ↗</a></>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Map tab */}
        {activeTab === 'map' && (
          <WorldMap outbreaks={data.outbreaks ?? []} mapPoints={data.mapPoints ?? []} />
        )}

        {/* News tab */}
        {activeTab === 'news' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(data.recentNews ?? []).slice(0, 30).map((item, i) => (
              <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration: 'none', display: 'block', background: '#1e293b',
                  borderRadius: 8, padding: '14px 16px', border: '1px solid #334155',
                  transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}>
                <div style={{ fontSize: 13, color: '#f1f5f9', marginBottom: 6, lineHeight: 1.5 }}>
                  {item.title}
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b' }}>
                  <span style={{ color: '#6366f1' }}>{item.source}</span>
                  <span>{item.published ? new Date(item.published).toLocaleDateString() : ''}</span>
                </div>
                {item.summary && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, lineHeight: 1.6,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.summary}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #1e293b', padding: '16px 24px',
        fontSize: 11, color: '#475569', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <span>Sources: {(data.dataSources ?? []).join(' · ')}</span>
      </div>
    </div>
  );
}
