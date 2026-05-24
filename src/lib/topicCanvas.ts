export const CANVAS_VERSION = 1;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2;
export const DEFAULT_NOTE_WIDTH = 360;
export const DEFAULT_NOTE_HEIGHT = 220;
export const DEFAULT_RESOURCE_WIDTH = 300;
export const DEFAULT_RESOURCE_HEIGHT = 140;

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface NoteNode {
  id: string;
  type: 'note';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
}

export interface ResourceNode {
  id: string;
  type: 'resource';
  x: number;
  y: number;
  width: number;
  height: number;
  resourceId: string;
}

export type CanvasNode = NoteNode | ResourceNode;

export interface CanvasState {
  version: typeof CANVAS_VERSION;
  viewport: CanvasViewport;
  nodes: CanvasNode[];
}

export function generateCanvasId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultCanvas(): CanvasState {
  return {
    version: CANVAS_VERSION,
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [
      {
        id: generateCanvasId(),
        type: 'note',
        x: 120,
        y: 120,
        width: DEFAULT_NOTE_WIDTH,
        height: DEFAULT_NOTE_HEIGHT,
        content: '',
      },
    ],
  };
}

export function createNoteNode(x: number, y: number): NoteNode {
  return {
    id: generateCanvasId(),
    type: 'note',
    x,
    y,
    width: DEFAULT_NOTE_WIDTH,
    height: DEFAULT_NOTE_HEIGHT,
    content: '',
  };
}

export function createResourceNode(
  resourceId: string,
  x: number,
  y: number,
  size?: { width: number; height: number },
): ResourceNode {
  return {
    id: generateCanvasId(),
    type: 'resource',
    x,
    y,
    width: size?.width ?? DEFAULT_RESOURCE_WIDTH,
    height: size?.height ?? DEFAULT_RESOURCE_HEIGHT,
    resourceId,
  };
}

function isCanvasState(value: unknown): value is CanvasState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as CanvasState;
  return (
    candidate.version === CANVAS_VERSION &&
    Array.isArray(candidate.nodes) &&
    typeof candidate.viewport?.x === 'number' &&
    typeof candidate.viewport?.y === 'number' &&
    typeof candidate.viewport?.zoom === 'number'
  );
}

export function parseTopicNotes(notes?: string): CanvasState {
  if (!notes?.trim()) {
    return createDefaultCanvas();
  }

  try {
    const parsed = JSON.parse(notes) as unknown;
    if (isCanvasState(parsed)) {
      return {
        ...parsed,
        viewport: {
          x: parsed.viewport.x,
          y: parsed.viewport.y,
          zoom: clampZoom(parsed.viewport.zoom),
        },
        nodes: parsed.nodes.map(node =>
          node.type === 'note'
            ? {
                ...node,
                width: node.width || DEFAULT_NOTE_WIDTH,
                height: node.height || DEFAULT_NOTE_HEIGHT,
              }
            : {
                ...node,
                width: node.width || DEFAULT_RESOURCE_WIDTH,
                height: node.height || DEFAULT_RESOURCE_HEIGHT,
              },
        ),
      };
    }
  } catch {
    // fall through to plain-text migration
  }

  return {
    version: CANVAS_VERSION,
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [
      {
        id: generateCanvasId(),
        type: 'note',
        x: 120,
        y: 120,
        width: DEFAULT_NOTE_WIDTH,
        height: DEFAULT_NOTE_HEIGHT,
        content: notes,
      },
    ],
  };
}

export function serializeCanvasState(state: CanvasState): string {
  return JSON.stringify(state);
}

export function extractNotesText(notes?: string): string {
  if (!notes?.trim()) return '';

  try {
    const parsed = JSON.parse(notes) as unknown;
    if (isCanvasState(parsed)) {
      return parsed.nodes
        .filter((node): node is NoteNode => node.type === 'note')
        .map(node => node.content.trim())
        .filter(Boolean)
        .join('\n\n');
    }
  } catch {
    return notes.trim();
  }

  return notes.trim();
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function getResourceIdsOnCanvas(state: CanvasState): Set<string> {
  return new Set(
    state.nodes
      .filter((node): node is ResourceNode => node.type === 'resource')
      .map(node => node.resourceId),
  );
}
