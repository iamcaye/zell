import { useMemo } from 'react';
import { Grid } from '@zell/grid-react';
import './styles.css';

const columns = [
  { id: 'company', header: 'Company', width: 220, kind: 'text' as const },
  { id: 'region', header: 'Region', width: 140, kind: 'text' as const },
  { id: 'revenue', header: 'Revenue', width: 140, kind: 'number' as const },
  { id: 'growth', header: 'Growth', width: 120, kind: 'number' as const },
  { id: 'active', header: 'Active', width: 100, kind: 'boolean' as const }
];

const regions = ['Madrid', 'Berlin', 'New York', 'Tokyo', 'Sao Paulo'];

export function App() {
  const data = useMemo(
    () =>
      Array.from({ length: 100_000 }, (_, index) => [
        `Portfolio ${index.toString().padStart(5, '0')}`,
        regions[index % regions.length],
        2_500 + index * 17,
        Number(((index % 13) * 1.7).toFixed(1)),
        index % 3 === 0
      ]),
    []
  );

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">/01 MODULE</p>
          <h1>Portfolio Operations Grid</h1>
          <p className="lede">
            High-density data surface for technical operations teams. Keyboard navigation, range selection, inline editing, and TSV sync in one focused workspace.
          </p>
        </div>
        <div className="metric-strip">
          <article>
            <strong>100k</strong>
            <span>STEP 01 - VIRTUAL ROWS</span>
          </article>
          <article>
            <strong>TSV</strong>
            <span>STEP 02 - DATA TRANSFER</span>
          </article>
          <article>
            <strong>Typed API</strong>
            <span>STEP 03 - SAFE INTEGRATION</span>
          </article>
        </div>
      </section>

      <section className="demo-panel">
        <div className="demo-header">
          <div>
            <p className="section-label">/02 FEATURE</p>
            <h2>React Adapter Module</h2>
          </div>
          <p className="demo-hint">Arrow keys move focus. Shift extends range. Type to edit cells.</p>
        </div>
        <Grid height={560} columns={columns} data={data} rowHeight={40} overscan={6} />
      </section>
    </main>
  );
}
