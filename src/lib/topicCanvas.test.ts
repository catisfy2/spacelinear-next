import { describe, expect, it } from 'vitest';
import {
  createDefaultCanvas,
  extractNotesText,
  parseTopicNotes,
  serializeCanvasState,
} from '@/lib/topicCanvas';

describe('parseTopicNotes', () => {
  it('returns a default note node for empty notes', () => {
    const state = parseTopicNotes();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].type).toBe('note');
  });

  it('migrates plain text notes into a note node', () => {
    const state = parseTopicNotes('Hello world');
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].type).toBe('note');
    if (state.nodes[0].type === 'note') {
      expect(state.nodes[0].content).toBe('Hello world');
    }
  });

  it('round-trips serialized canvas state', () => {
    const state = createDefaultCanvas();
    state.nodes[0].type === 'note' && (state.nodes[0].content = 'Canvas note');
    const parsed = parseTopicNotes(serializeCanvasState(state));
    expect(parsed.nodes[0].type).toBe('note');
    if (parsed.nodes[0].type === 'note') {
      expect(parsed.nodes[0].content).toBe('Canvas note');
    }
  });
});

describe('extractNotesText', () => {
  it('returns plain text notes unchanged', () => {
    expect(extractNotesText('Plain note')).toBe('Plain note');
  });

  it('joins note node content from canvas JSON', () => {
    const state = createDefaultCanvas();
    state.nodes.push({
      id: 'note-2',
      type: 'note',
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      content: 'Second note',
    });
    if (state.nodes[0].type === 'note') {
      state.nodes[0].content = 'First note';
    }

    expect(extractNotesText(serializeCanvasState(state))).toBe('First note\n\nSecond note');
  });
});
