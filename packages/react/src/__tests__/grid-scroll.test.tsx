import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Grid } from '../Grid';

const mock = vi.hoisted(() => {
  const grid = {
    setViewport: vi.fn(),
    copySelection: vi.fn(() => ''),
    pasteText: vi.fn(),
    selectCell: vi.fn(),
    extendSelection: vi.fn(),
    startEdit: vi.fn(),
    handleKeyDown: vi.fn(),
    stopEdit: vi.fn(),
    handleTextInput: vi.fn(),
    updateEditDraft: vi.fn(),
    getCell: vi.fn(() => null)
  };

  const state = {
    rowCount: 100_000,
    columnCount: 2,
    focusedCell: null,
    selection: null,
    editSession: null,
    scrollTop: 0,
    viewportHeight: 180,
    viewport: {
      rowStart: 0,
      rowEnd: 0,
      offsetTop: 0,
      totalHeight: 4_000_000
    }
  };

  return { grid, state };
});

vi.mock('../use-grid', () => ({
  useGrid: () => ({ grid: mock.grid, state: mock.state })
}));

describe('Grid scroll scheduling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mock.grid.setViewport.mockClear();
  });

  it('coalesces rapid scroll events into one viewport update per frame', () => {
    let frameCallback: ((time: number) => void) | null = null;

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frameCallback = callback;
      return 1;
    });

    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    render(
      <Grid
        height={220}
        columns={[{ id: 'name' }, { id: 'age', kind: 'number' }]}
        data={[]}
      />
    );

    mock.grid.setViewport.mockClear();

    const body = screen.getByRole('grid');
    fireEvent.scroll(body, { target: { scrollTop: 100 } });
    fireEvent.scroll(body, { target: { scrollTop: 240 } });
    fireEvent.scroll(body, { target: { scrollTop: 360 } });

    expect(mock.grid.setViewport).not.toHaveBeenCalled();
    expect(frameCallback).toBeTruthy();

    if (!frameCallback) {
      throw new Error('Expected requestAnimationFrame callback to be scheduled');
    }
    const callback = frameCallback as (time: number) => void;
    callback(0);

    expect(mock.grid.setViewport).toHaveBeenCalledTimes(1);
    expect(mock.grid.setViewport).toHaveBeenCalledWith(188, 360);
  });
});
