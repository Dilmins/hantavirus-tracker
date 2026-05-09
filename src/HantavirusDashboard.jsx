/**
 * WorldMap.jsx
 * Drop-in replacement for the hand-drawn SVG map in HantavirusDashboard.jsx
 *
 * Dependencies (add to package.json if not already present):
 *   npm install d3 topojson-client
 *
 * Usage in HantavirusDashboard.jsx — replace the Map tab contents with:
 *   import WorldMap from './WorldMap';
 *   ...
 *   <WorldMap outbreaks={data.outbreaks} mapPoints={data.mapPoints} />
 *
 * The component fetches world-110m TopoJSON from CDN once and caches it in
 * module scope so hot-reloads don't re-fetch.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

// ── Cache so we only fetch once per page load ─────────────────────────────────
let _worldCache = null;

// ── Risk level → colour (matches your existing dashboard palette) ─────────────
const RISK_COLORS = {
  high:     '#ef4444', // red-500
  medium:   '#f97316', // orange-500
  low:      '#eab308', // yellow-500
  endemic:  '#3b82f6', // blue-500
  default:  '#6366f1', // indigo-500
};

const riskColor = (level) => RISK_COLORS[level] ?? RISK_COLORS.default;

// ── Haversine distance (px) helper — used to avoid stacking tooltips ──────────
function projectPoint(projection, lat, lng) {
  return projection([lng, lat]);
}

// ─────────────────────────────────────────────────────────────────────────────
export default function WorldMap({ outbreaks = [], mapPoints = [] }) {
  const svgRef      = useRef(null);
  const wrapperRef  = useRef(null);
  const [tooltip, setTooltip]   = useState(null);   // { x, y, content }
  const [selected, setSelected] = useState(null);   // outbreak or mapPoint object
  const [dims, setDims]         = useState({ w: 800, h: 420 });
  const projRef = useRef(null);  // store projection so click handler can use it

  // ── Responsive width ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setDims({ w, h: Math.round(w * 0.52) });
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Draw map ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const { w, h } = dims;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const projection = d3.geoNaturalEarth1()
      .scale(w / 6.3)
      .translate([w / 2, h / 2]);

    projRef.current = projection;

    const path = d3.geoPath().projection(projection);

    // Sphere background
    svg.append('rect')
      .attr('width', w)
      .attr('height', h)
      .attr('fill', '#0f172a');  // matches your slate-900 dark bg

    // Graticule
    const graticule = d3.geoGraticule().step([20, 20]);
    svg.append('path')
      .datum(graticule())
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 0.4);

    // ── Fetch + render world topology ──────────────────────────────────────────
    const drawWorld = (world) => {
      const countries = topojson.feature(world, world.objects.countries);
      const borders   = topojson.mesh(world, world.objects.countries,
                                      (a, b) => a !== b);

      svg.append('g')
        .selectAll('path')
        .data(countries.features)
        .join('path')
          .attr('d', path)
          .attr('fill', '#1e3a5f')       // muted navy — countries
          .attr('stroke', 'none');

      svg.append('path')
        .datum(borders)
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#0f2a4a')
        .attr('stroke-width', 0.5);

      // ── Endemic region overlay ─────────────────────────────────────────────
      // Highlight Argentina + Chile + USA West loosely by ISO numeric id
      // (110m TopoJSON uses UN numeric codes)
      const ENDEMIC_IDS = new Set([
        32,   // Argentina
        152,  // Chile
        840,  // USA
        484,  // Mexico
        76,   // Brazil
        643,  // Russia (Siberia — HFRS)
        156,  // China (HFRS)
        410,  // South Korea (HFRS)
      ]);

      svg.append('g')
        .selectAll('path')
        .data(countries.features.filter(f => ENDEMIC_IDS.has(+f.id)))
        .join('path')
          .attr('d', path)
          .attr('fill', '#1d4ed8')       // blue-700 tint
          .attr('fill-opacity', 0.18)
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 0.4)
          .attr('stroke-opacity', 0.35);

      drawPoints();
    };

    // ── Render outbreak + news alert dots ─────────────────────────────────────
    const drawPoints = () => {
      // -- News alert clusters (mapPoints) — smaller dots
      const mpGroup = svg.append('g').attr('class', 'map-points');

      mapPoints.forEach((mp) => {
        const pt = projectPoint(projection, mp.lat, mp.lng);
        if (!pt) return;

        // Pulse ring
        mpGroup.append('circle')
          .attr('cx', pt[0]).attr('cy', pt[1])
          .attr('r', 6)
          .attr('fill', 'none')
          .attr('stroke', '#6366f1')
          .attr('stroke-width', 1)
          .attr('opacity', 0.5)
          .attr('class', 'pulse-ring');

        // Dot
        mpGroup.append('circle')
          .attr('cx', pt[0]).attr('cy', pt[1])
          .attr('r', 4)
          .attr('fill', '#6366f1')
          .attr('fill-opacity', 0.85)
          .attr('stroke', '#a5b4fc')
          .attr('stroke-width', 0.8)
          .style('cursor', 'pointer')
          .on('mouseenter', function(event) {
            d3.select(this).attr('r', 6);
            setTooltip({
              x: event.offsetX, y: event.offsetY,
              content: {
                title: mp.country,
                lines: [`${mp.alertCount} alert${mp.alertCount !== 1 ? 's' : ''}`,
                        `Sources: ${mp.sources?.join(', ') ?? 'News'}`],
                color: '#6366f1',
              }
            });
          })
          .on('mouseleave', function() {
            d3.select(this).attr('r', 4);
            setTooltip(null);
          })
          .on('click', () => setSelected({ _type: 'mapPoint', ...mp }));
      });

      // -- Active outbreaks — larger, coloured by risk
      const obGroup = svg.append('g').attr('class', 'outbreaks');

      outbreaks.forEach((ob) => {
        const pt = projectPoint(projection, ob.lat, ob.lng);
        if (!pt) return;

        const color = riskColor(ob.riskLevel);
        const r = Math.max(6, Math.min(18, 6 + Math.sqrt(ob.cases ?? 1) * 1.5));

        // Animated pulse ring
        const ring = obGroup.append('circle')
          .attr('cx', pt[0]).attr('cy', pt[1])
          .attr('r', r + 4)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 1.2)
          .attr('opacity', 0.6);

        // Animate ring
        (function pulse() {
          ring.attr('r', r + 4).attr('opacity', 0.6)
            .transition().duration(1400).ease(d3.easeCubicOut)
            .attr('r', r + 14).attr('opacity', 0)
            .on('end', pulse);
        })();

        // Core dot
        obGroup.append('circle')
          .attr('cx', pt[0]).attr('cy', pt[1])
          .attr('r', r)
          .attr('fill', color)
          .attr('fill-opacity', 0.9)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.2)
          .style('cursor', 'pointer')
          .on('mouseenter', function(event) {
            d3.select(this).attr('r', r + 3);
            const cfr = ob.deaths && ob.cases
              ? `${((ob.deaths / ob.cases) * 100).toFixed(0)}%`
              : 'N/A';
            setTooltip({
              x: event.offsetX, y: event.offsetY,
              content: {
                title: ob.location,
                lines: [
                  ob.strain,
                  `Cases: ${ob.cases ?? '?'}  Deaths: ${ob.deaths ?? '?'}  CFR: ${cfr}`,
                  `Status: ${ob.status ?? ob.riskLevel}`,
                ],
                color,
              }
            });
          })
          .on('mouseleave', function() {
            d3.select(this).attr('r', r);
            setTooltip(null);
          })
          .on('click', () => setSelected({ _type: 'outbreak', ...ob }));

        // Label for high-risk outbreaks
        if (ob.riskLevel === 'high') {
          obGroup.append('text')
            .attr('x', pt[0] + r + 4)
            .attr('y', pt[1] + 4)
            .attr('fill', '#f1f5f9')
            .attr('font-size', '10px')
            .attr('font-family', "'Space Mono', monospace")
            .attr('pointer-events', 'none')
            .text(ob.location.length > 20
              ? ob.location.slice(0, 18) + '…'
              : ob.location);
        }
      });
    };

    // ── Load world data ────────────────────────────────────────────────────────
    if (_worldCache) {
      drawWorld(_worldCache);
    } else {
      d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then((world) => {
          _worldCache = world;
          drawWorld(world);
        })
        .catch((err) => {
          console.error('WorldMap: failed to load TopoJSON', err);
          // Fallback: still draw the points on a plain bg
          drawPoints();
        });
    }
  }, [dims, outbreaks, mapPoints]);

  // ── Detail panel close on Escape ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Compute CFR helper ───────────────────────────────────────────────────────
  const cfr = selected?._type === 'outbreak' && selected.cases
    ? `${((selected.deaths / selected.cases) * 100).toFixed(0)}%`
    : null;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '16px', flexWrap: 'wrap',
        padding: '8px 4px 10px',
        fontFamily: "'Space Mono', monospace",
        fontSize: '11px', color: '#94a3b8',
      }}>
        {[
          { color: '#ef4444', label: 'High risk outbreak' },
          { color: '#f97316', label: 'Medium risk' },
          { color: '#eab308', label: 'Low risk' },
          { color: '#6366f1', label: 'News alerts' },
          { color: '#1d4ed8', label: 'Endemic region', opacity: 0.4 },
        ].map(({ color, label, opacity = 1 }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10,
              borderRadius: '50%', background: color, opacity,
            }} />
            {label}
          </span>
        ))}
      </div>

      {/* ── SVG map ─────────────────────────────────────────────────────────── */}
      <svg
        ref={svgRef}
        width={dims.w}
        height={dims.h}
        style={{ display: 'block', borderRadius: '8px', background: '#0f172a' }}
        aria-label="World map showing hantavirus outbreaks and alerts"
      />

      {/* ── Hover tooltip ───────────────────────────────────────────────────── */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x + 12,
          top: tooltip.y - 8,
          background: '#1e293b',
          border: `1px solid ${tooltip.content.color}`,
          borderRadius: '6px',
          padding: '8px 12px',
          pointerEvents: 'none',
          zIndex: 20,
          maxWidth: '240px',
          fontFamily: "'Space Mono', monospace",
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: tooltip.content.color, marginBottom: 4 }}>
            {tooltip.content.title}
          </div>
          {tooltip.content.lines.map((l, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>{l}</div>
          ))}
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: 4 }}>Click for details</div>
        </div>
      )}

      {/* ── Selected detail panel ───────────────────────────────────────────── */}
      {selected && (
        <div style={{
          marginTop: '12px',
          background: '#1e293b',
          border: `1px solid ${selected._type === 'outbreak'
            ? riskColor(selected.riskLevel) : '#6366f1'}`,
          borderRadius: '8px',
          padding: '16px',
          fontFamily: "'Space Mono', monospace",
          fontSize: '12px',
          color: '#cbd5e1',
          position: 'relative',
        }}>
          {/* Close */}
          <button
            onClick={() => setSelected(null)}
            style={{
              position: 'absolute', top: 10, right: 12,
              background: 'none', border: 'none', color: '#64748b',
              cursor: 'pointer', fontSize: '16px', lineHeight: 1,
            }}
            aria-label="Close detail panel"
          >×</button>

          {selected._type === 'outbreak' ? (
            <>
              <div style={{
                fontSize: '14px', fontWeight: 700, marginBottom: 8,
                color: riskColor(selected.riskLevel),
              }}>
                {selected.location}
              </div>
              <div style={{ color: '#94a3b8', marginBottom: 10 }}>
                {selected.region} · {selected.country}
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px', marginBottom: 12,
              }}>
                {[
                  { label: 'Cases',    value: selected.cases ?? '?' },
                  { label: 'Deaths',   value: selected.deaths ?? '?' },
                  { label: 'CFR',      value: cfr ?? 'N/A' },
                  { label: 'Confirmed',value: selected.confirmed ?? '?' },
                  { label: 'Strain',   value: selected.strain ?? '?' },
                  { label: 'Risk',     value: selected.riskLevel ?? '?' },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: '#0f172a', borderRadius: '6px', padding: '8px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '10px', color: '#64748b', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 6 }}>
                <span style={{ color: '#64748b' }}>Status: </span>{selected.status}
              </div>
              {selected.notes && (
                <div style={{ marginBottom: 6, color: '#94a3b8', lineHeight: 1.6 }}>
                  {selected.notes}
                </div>
              )}
              <div>
                <span style={{ color: '#64748b' }}>Last update: </span>{selected.lastUpdate}
                {selected.sourceUrl && (
                  <>
                    {' · '}
                    <a
                      href={selected.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: riskColor(selected.riskLevel), textDecoration: 'none' }}
                    >
                      {selected.source} ↗
                    </a>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: 8, color: '#818cf8' }}>
                {selected.country}
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#64748b' }}>{selected.alertCount} alert{selected.alertCount !== 1 ? 's' : ''} </span>
                from {selected.sources?.join(', ')}
              </div>
              {selected.alerts?.slice(0, 5).map((a, i) => (
                <div key={i} style={{
                  borderLeft: '2px solid #6366f1', paddingLeft: 8, marginBottom: 6,
                  color: '#94a3b8', lineHeight: 1.5,
                }}>
                  {a.title ?? a}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
