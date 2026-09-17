import { z } from 'zod';
import { logger } from './logger';

export interface SaveEnvelope<T> {
  version: number;
  payload: T;
}

/**
 * Generic save loader with versioning and migration support.
 */
export function loadWithMigration<T>(
  key: string,
  currentVersion: number,
  schema: z.ZodTypeAny,
  migrations: Record<number, (oldPayload: any) => any>,
  defaultValue: T
): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;

    const parsed = JSON.parse(raw);
    let version = 0;
    let payload = parsed;

    // Check if the data is wrapped in the versioned envelope { version, payload }
    if (parsed && typeof parsed === 'object' && parsed !== null && 'version' in parsed && 'payload' in parsed) {
      version = typeof (parsed as any).version === 'number' ? (parsed as any).version : 0;
      payload = (parsed as any).payload;
    } else {
      // Legacy unversioned format (v0)
      version = 0;
      payload = parsed;
    }

    // Execute sequential migrations up to currentVersion
    while (version < currentVersion) {
      if (migrations[version]) {
        try {
          payload = migrations[version](payload);
          logger.debug('PERSISTENCE', `Migrated ${key} from version ${version} to ${version + 1}`);
        } catch (migErr) {
          logger.error('PERSISTENCE', `Failed to migrate ${key} at version ${version}`, migErr);
          break;
        }
      }
      version++;
    }

    // Validate final payload against Zod schema
    const validated = schema.safeParse(payload);
    if (validated.success) {
      return validated.data as T;
    } else {
      logger.warn('PERSISTENCE', `Schema validation failed for ${key} after migration. Returning default.`, validated.error);
      return defaultValue;
    }
  } catch (e) {
    logger.warn('PERSISTENCE', `Failed to load or migrate key ${key}`, e);
    return defaultValue;
  }
}

/**
 * Generic saver with current versioned envelope.
 */
export function saveWithEnvelope<T>(
  key: string,
  currentVersion: number,
  payload: T,
  schema: z.ZodTypeAny,
  defaultValue: T
): void {
  try {
    const validated = schema.safeParse(payload);
    const valueToSave = validated.success ? validated.data : defaultValue;
    if (!validated.success) {
      logger.warn('PERSISTENCE', `Invalid payload when saving ${key}. Falling back to default.`);
    }

    const envelope: SaveEnvelope<T> = {
      version: currentVersion,
      payload: valueToSave as T,
    };

    localStorage.setItem(key, JSON.stringify(envelope));
    logger.debug('PERSISTENCE', `Saved ${key} at version ${currentVersion} successfully.`);
  } catch (e) {
    logger.error('PERSISTENCE', `Failed to save key ${key}`, e);
  }
}
