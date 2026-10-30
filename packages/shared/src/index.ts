/**
 * Domain constants shared by the API, worker, and console.
 * Zod schemas arrive with the first real contract in T-003/T-006.
 */

/** Lifecycle/status of a device as stored and rendered. */
export const DEVICE_STATUSES = ["active", "stale", "offline", "archived"] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

/** Workspace roles, ordered from most to least privileged. */
export const WORKSPACE_ROLES = ["owner", "admin", "operator", "viewer"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

/** Plans shown in pricing UI; billing integration is out of scope for v1. */
export const PLANS = ["free", "pro", "enterprise"] as const;
export type Plan = (typeof PLANS)[number];

/** Staleness thresholds shared by map UI, stream, and worker (milliseconds). */
export const DEVICE_STALE_MS = 2 * 60 * 1000;
export const DEVICE_OFFLINE_MS = 10 * 60 * 1000;
