import { useState, useEffect, useCallback } from 'react';
import { db, initDb } from '@/db/client';

export type DbEvent = {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  color: string;
  category_id: number;
  created_at: string;
};

export type CreateEventInput = Omit<DbEvent, 'id' | 'created_at'>;

export function useEvents() {
  const [events, setEvents] = useState<DbEvent[]>([]);

  const loadEvents = useCallback(() => {
    const rows = db.getAllSync<DbEvent>(
      'SELECT * FROM events ORDER BY start_date ASC',
    );
    setEvents(rows);
  }, []);

  useEffect(() => {
    initDb();
    loadEvents();
  }, [loadEvents]);

  const createEvent = useCallback(
    (input: CreateEventInput) => {
      db.runSync(
        'INSERT INTO events (title, description, start_date, end_date, color, category_id) VALUES (?, ?, ?, ?, ?, ?)',
        [
          input.title,
          input.description ?? null,
          input.start_date,
          input.end_date,
          input.color,
          input.category_id,
        ],
      );
      loadEvents();
    },
    [loadEvents],
  );

  const deleteEvent = useCallback(
    (id: number) => {
      db.runSync('DELETE FROM events WHERE id = ?', [id]);
      loadEvents();
    },
    [loadEvents],
  );

  return { events, createEvent, deleteEvent };
}
