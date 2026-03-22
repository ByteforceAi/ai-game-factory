/**
 * Timeline Recorder — Records user/AI interactions for replay
 */

export interface TimelineEvent {
  id: string;
  timestamp: number;      // ms since session start
  type: 'user' | 'ai' | 'vibe' | 'theme' | 'game-start' | 'game-over' | 'system';
  label: string;          // short description
  detail?: string;        // full text
  score?: number;         // prompt score if user message
  gameId?: string;
}

class TimelineRecorder {
  private events: TimelineEvent[] = [];
  private startTime: number = Date.now();
  private listeners: Set<() => void> = new Set();

  reset() {
    this.events = [];
    this.startTime = Date.now();
    this.notify();
  }

  record(event: Omit<TimelineEvent, 'id' | 'timestamp'>) {
    this.events.push({
      ...event,
      id: `tl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now() - this.startTime,
    });
    this.notify();
  }

  getEvents(): TimelineEvent[] {
    return [...this.events];
  }

  getDuration(): number {
    if (this.events.length === 0) return 0;
    return this.events[this.events.length - 1].timestamp;
  }

  getStartTime(): number {
    return this.startTime;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  /** Export as JSON for teacher review */
  exportJSON(): string {
    return JSON.stringify({
      startTime: new Date(this.startTime).toISOString(),
      duration: this.getDuration(),
      eventCount: this.events.length,
      events: this.events,
    }, null, 2);
  }
}

// Singleton
export const timeline = new TimelineRecorder();
