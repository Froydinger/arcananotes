import { Note } from '@/contexts/NoteContext';

export class OfflineStorage {
  private getStorageKey(userId: string): string {
    return `arcana_notes_${userId}`;
  }

  async saveNotes(notes: Note[], userId: string): Promise<void> {
    try {
      const notesData = JSON.stringify(notes);
      localStorage.setItem(this.getStorageKey(userId), notesData);
      localStorage.setItem(`${this.getStorageKey(userId)}_timestamp`, Date.now().toString());
    } catch (error) {
      console.error('Failed to save notes offline:', error);
    }
  }

  async loadNotes(userId: string): Promise<Note[]> {
    try {
      const data = localStorage.getItem(this.getStorageKey(userId));
      if (!data) return [];

      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load offline notes:', error);
      return [];
    }
  }

  async saveNote(note: Note, userId: string): Promise<void> {
    const existingNotes = await this.loadNotes(userId);
    const noteIndex = existingNotes.findIndex(n => n.id === note.id);
    
    if (noteIndex >= 0) {
      existingNotes[noteIndex] = note;
    } else {
      existingNotes.unshift(note);
    }
    
    await this.saveNotes(existingNotes, userId);
  }

  async deleteNote(noteId: string, userId: string): Promise<void> {
    const existingNotes = await this.loadNotes(userId);
    const filteredNotes = existingNotes.filter(n => n.id !== noteId);
    await this.saveNotes(filteredNotes, userId);
  }

  clearUserData(userId: string): void {
    localStorage.removeItem(this.getStorageKey(userId));
    localStorage.removeItem(`${this.getStorageKey(userId)}_timestamp`);
  }

  getLastSyncTime(userId: string): number {
    const timestamp = localStorage.getItem(`${this.getStorageKey(userId)}_timestamp`);
    return timestamp ? parseInt(timestamp, 10) : 0;
  }
}

export const offlineStorage = new OfflineStorage();