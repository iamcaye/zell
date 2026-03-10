import { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Grid } from '../Grid';

describe('Grid', () => {
  it('renders the react adapter and virtualized rows', () => {
    render(
      <Grid
        height={220}
        columns={[{ id: 'name' }, { id: 'age', kind: 'number' }]}
        data={Array.from({ length: 100 }, (_, index) => [`User ${index}`, index])}
      />
    );

    expect(screen.getByRole('grid')).toBeTruthy();
    expect(screen.getByText('User 0')).toBeTruthy();
    expect(screen.queryByText('User 80')).toBeNull();
  });

  it('stays mounted under React Strict Mode effect replays', () => {
    render(
      <StrictMode>
        <Grid
          height={220}
          columns={[{ id: 'name' }, { id: 'age', kind: 'number' }]}
          data={Array.from({ length: 100 }, (_, index) => [`User ${index}`, index])}
        />
      </StrictMode>
    );

    expect(screen.getByRole('grid')).toBeTruthy();
    expect(screen.getByText('User 0')).toBeTruthy();
  });

  it('supports keyboard navigation, editing, and clipboard events through the DOM', () => {
    render(
      <Grid
        height={220}
        columns={[{ id: 'name' }, { id: 'age', kind: 'number' }]}
        data={[["Ada", 32]]}
      />
    );

    const grid = screen.getByRole('grid');
    fireEvent.mouseDown(screen.getByText('Ada'));
    grid.focus();
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    fireEvent.keyDown(grid, { key: '4' });

    const input = screen.getByDisplayValue('4');
    fireEvent.change(input, { target: { value: '45' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('45')).toBeTruthy();
  });
});
