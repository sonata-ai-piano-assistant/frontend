import { MidiNote } from '@/types';
import { create } from 'zustand'

interface MidiStore {
  midiNotes: MidiNote[];
  lastNoteTime: number;
  recentNotes: Set<string>;
  addMidiNote: (note: MidiNote) => void;
  clearMidiNotes: () => void;
  setDebounceInterval: (interval: number) => void;
  debounceInterval: number;
  activeNotes: Record<number, boolean>;
  setActiveNote: (note: number) => void;
  clearActiveNote: () => void;
}

export const useMidiStore = create<MidiStore>((set, get) => ({
  midiNotes: [],
  lastNoteTime: 0,
  recentNotes: new Set(),
  debounceInterval: 50, // 50ms par défaut
  activeNotes: {},

  setActiveNote: (note) => set({ activeNotes: { ...get().activeNotes, [note]: true } }),
  clearActiveNote: () => set({ activeNotes: {} }),
  addMidiNote: (note) => set((state) => {
    const now = Date.now();

    // 1. Debouncing temporel
    if (now - state.lastNoteTime < state.debounceInterval) {
      return state;
    }

    // 2. Filtre par vélocité minimale ==> retirer le commentaire si l'on veut ajouter de la difficulté
    // if (note.velocity < 20) {
    //   return state;
    // }

    // 3. Filtre anti-doublons (même note dans les 100ms)
    const noteKey = `${note.note}-${note.velocity}`;
    if (state.recentNotes.has(noteKey)) {
      return state;
    }

    // Ajouter à la liste des notes récentes
    const newRecentNotes = new Set(state.recentNotes);
    newRecentNotes.add(noteKey);

    // Nettoyer les notes récentes après 100ms
    setTimeout(() => {
      set((currentState) => {
        const updatedRecentNotes = new Set(currentState.recentNotes);
        updatedRecentNotes.delete(noteKey);
        return { ...currentState, recentNotes: updatedRecentNotes };
      });
    }, 100);

    console.log('MIDI Note Added:', { note: note.noteName, velocity: note.velocity, time: now });

    return {
      ...state,
      midiNotes: [note, ...state.midiNotes],
      lastNoteTime: now,
      recentNotes: newRecentNotes,
    };
  }),
  clearMidiNotes: () => set({
    midiNotes: [],
    lastNoteTime: 0,
    recentNotes: new Set()
  }),
  setDebounceInterval: (interval) => set({ debounceInterval: interval }),
}))