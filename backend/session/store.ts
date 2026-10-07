import session from 'express-session';
import type { PrismaClient } from '@prisma/client';
import { readSession, revokeSession, writeSession } from './persistence';

type Db = Pick<PrismaClient, '$transaction'>;

/** PostgreSQL-backed express-session store with serialized SID mutations. */
export class PrismaSessionStore extends session.Store {
  constructor(private readonly db: Db) {
    super();
  }

  /** Load a live session and ignore expired or revoked identifiers. */
  get(
    sid: string,
    callback: (err: unknown, value?: session.SessionData | null) => void,
  ): void {
    void readSession(this.db, sid).then(
      (value) => callback(null, value),
      callback,
    );
  }

  /** Save authenticated state while enforcing the original absolute deadline. */
  set(
    sid: string,
    value: session.SessionData,
    callback?: (err?: unknown) => void,
  ): void {
    void writeSession(this.db, sid, value, false).then(
      () => callback?.(),
      (error: unknown) => callback?.(error),
    );
  }

  /** Extend the idle deadline, never the absolute deadline. */
  touch(
    sid: string,
    value: session.SessionData,
    callback?: (err?: unknown) => void,
  ): void {
    void writeSession(this.db, sid, value, true).then(
      () => callback?.(),
      (error: unknown) => callback?.(error),
    );
  }

  /** Revoke the SID permanently before deleting its payload. */
  destroy(sid: string, callback?: (err?: unknown) => void): void {
    void revokeSession(this.db, sid).then(
      () => callback?.(),
      (error: unknown) => callback?.(error),
    );
  }
}
