import { downcast } from "@tutao/utils"
import { TypeRef } from "./TypeRef.js"

export function getAsEnumValue<K extends keyof any, V>(enumValues: Record<K, V>, value: string): V | null {
	for (const key of Object.getOwnPropertyNames(enumValues)) {
		// @ts-ignore
		const enumValue = enumValues[key]

		if (enumValue === value) {
			return enumValue
		}
	}

	return null
}

export function assertEnumValue<K extends keyof any, V>(enumValues: Record<K, V>, value: string): V {
	for (const key of Object.getOwnPropertyNames(enumValues)) {
		// @ts-ignore
		const enumValue = enumValues[key]

		if (enumValue === value) {
			return enumValue
		}
	}

	throw new Error(`Invalid enum value ${value} for ${JSON.stringify(enumValues)}`)
}

export function assertEnumKey<K extends string, V>(obj: Record<K, V>, key: string): K {
	if (key in obj) {
		return downcast(key)
	} else {
		throw Error("Not valid enum value: " + key)
	}
}

export function clone<T>(instance: T): T {
	if (instance instanceof Uint8Array) {
		return downcast<T>(instance.slice())
	} else if (instance instanceof Array) {
		return downcast<T>(instance.map((i) => clone(i)))
	} else if (instance instanceof Date) {
		return new Date(instance.getTime()) as any
	} else if (instance instanceof TypeRef) {
		return instance
	} else if (instance instanceof Object) {
		// Can only pass null or Object, cannot pass undefined
		const copy = Object.create(Object.getPrototypeOf(instance) || null)
		Object.assign(copy, instance)

		for (let key of Object.keys(copy)) {
			copy[key] = clone(copy[key])
		}

		return copy as any
	} else {
		return instance
	}
}
