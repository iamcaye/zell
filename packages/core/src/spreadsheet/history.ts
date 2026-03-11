export interface HistoryOperation {
  undo(): void;
  redo(): void;
}

export interface HistoryController {
  push(operation: HistoryOperation): void;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
}

interface CreateHistoryOptions {
  limit?: number;
}

const DEFAULT_HISTORY_LIMIT = 100;

export function createHistory(options: CreateHistoryOptions = {}): HistoryController {
  const limit = Math.max(1, options.limit ?? DEFAULT_HISTORY_LIMIT);
  const undoStack: HistoryOperation[] = [];
  const redoStack: HistoryOperation[] = [];

  return {
    push: (operation) => {
      undoStack.push(operation);
      if (undoStack.length > limit) {
        undoStack.shift();
      }
      redoStack.length = 0;
    },
    undo: () => {
      const operation = undoStack.pop();
      if (!operation) {
        return false;
      }

      operation.undo();
      redoStack.push(operation);
      return true;
    },
    redo: () => {
      const operation = redoStack.pop();
      if (!operation) {
        return false;
      }

      operation.redo();
      undoStack.push(operation);
      return true;
    },
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0
  };
}
