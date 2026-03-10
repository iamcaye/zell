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
          <p className="eyebrow">Grid Engine MVP</p>
          <h1>Headless core, React adapter, 100k-row demo.</h1>
          <p className="lede">
            Navigate with the keyboard, drag a range, double-click to edit, and paste TSV directly from a spreadsheet.
          </p>
        </div>
        <div className="metric-strip">
          <article>
            <strong>100k</strong>
            <span>virtualized rows</span>
          </article>
          <article>
            <strong>TSV</strong>
            <span>copy/paste ready</span>
          </article>
          <article>
            <strong>TypeScript</strong>
            <span>typed public API</span>
          </article>
        </div>
      </section>

      <section className="demo-panel">
        <div className="demo-header">
          <div>
            <p className="section-label">React Adapter</p>
            <h2>Portfolio operations grid</h2>
          </div>
          <p className="demo-hint">Arrow keys move focus. Shift extends selection. Type to edit.</p>
        </div>
        <Grid height={560} columns={columns} data={data} rowHeight={40} overscan={6} />
      </section>
    </main>
  );
}
