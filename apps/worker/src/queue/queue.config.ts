/**
 * Worker behavior switches. Real BullMQ processors, alert evaluation, and
 * webhook delivery arrive in M3 (T-031..T-034); this keeps deployments safe
 * before any queue exists.
 */

/** Connection settings resolved from the environment at boot. */
export interface WorkerEnv {
  readonly REDIS_URL?: string;
}

/** The queue consumer is optional: no REDIS_URL means the worker idles. */
export const isQueueEnabled = (env: WorkerEnv): boolean =>
  typeof env.REDIS_URL === "string" && env.REDIS_URL.length > 0;
