import { TypeRef } from "@tutao/meta"
import { TypeChecks } from "../app-env/TsTypeChecks"

export function snapshotEntity<T>(entity: T): T {
	return snapshotValue(entity) as T
}

function snapshotValue(value: unknown): unknown {
	if (value === null || !TypeChecks.isObject(value)) {
		// primitives are immutable
		return value
	}
	if (Array.isArray(value)) {
		const copy = new Array(value.length)
		for (let i = 0; i < value.length; i++) {
			copy[i] = snapshotValue(value[i])
		}
		return copy
	}
	if (value instanceof TypeRef) {
		return value
	}
	if (value instanceof Date) {
		return new Date(value.getTime())
	}
	if (value instanceof Uint8Array) {
		return value.slice()
	}
	const prototype = Object.getPrototypeOf(value)
	if (prototype === Object.prototype || prototype === null) {
		const copy: Record<string, unknown> = {}
		for (const key of Object.keys(value as Record<string, unknown>)) {
			if (key === "_original") {
				// nested aggregates carry their own snapshot, which would be duplicated again inside ours and is never read
				copy[key] = null
				continue
			}
			copy[key] = snapshotValue((value as Record<string, unknown>)[key])
		}
		return copy
	}
	// anything we do not know how to handle gets the generic treatment
	return structuredClone(value)
}
