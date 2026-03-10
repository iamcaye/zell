import { expectTypeOf, it } from 'vitest';
import type { GridProps } from '../Grid';
import { useGrid } from '../use-grid';

it('exposes typed react adapter contracts', () => {
  type Row = { name: string; age: number };
  type Props = GridProps<Row>;

  expectTypeOf<Props['columns'][number]['field']>().toEqualTypeOf<'name' | 'age' | undefined>();
  expectTypeOf(useGrid<Row>).returns.toHaveProperty('grid');
});
