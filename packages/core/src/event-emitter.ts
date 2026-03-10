import type { GridEventHandler, GridEventMap, GridEventName } from './types';

export class GridEventEmitter {
  private readonly listeners = new Map<GridEventName, Set<GridEventHandler<GridEventName>>>();

  on<K extends GridEventName>(eventName: K, handler: GridEventHandler<K>) {
    const handlers = this.listeners.get(eventName) ?? new Set<GridEventHandler<GridEventName>>();
    handlers.add(handler as GridEventHandler<GridEventName>);
    this.listeners.set(eventName, handlers);

    return () => {
      handlers.delete(handler as GridEventHandler<GridEventName>);
      if (handlers.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  emit<K extends GridEventName>(eventName: K, event: GridEventMap[K]) {
    const handlers = this.listeners.get(eventName);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      handler(event);
    }
  }

  clear() {
    this.listeners.clear();
  }
}
