import type { Entity } from "./EntityTypes.js"

/**
 * Entity created without `_original`, it should not be updated.
 */
export type ReadonlyEntity<T extends Entity> = Omit<T, "_original">
