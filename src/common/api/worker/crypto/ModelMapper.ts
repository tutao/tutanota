import { ProgrammingError } from "../../common/error/ProgrammingError"
import { base64ToUint8Array, stringToUtf8Uint8Array, TypeRef, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { ValueType } from "../../common/EntityConstants.js"
import { compress, uncompress } from "../Compression"
import { Entity, ParsedValue } from "../../common/EntityTypes"
import { assertWorkerOrNode } from "../../common/Env"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { TypeReferenceResolver } from "../../common/EntityFunctions"

assertWorkerOrNode()

export type AttributeId = number
export type TypeId = number
export type AttributeName = string

/**
 * responsible for "migrations" and checking types / cardinalities.
 */
export class ModelMapper {
	constructor(private readonly serverTypes: TypeReferenceResolver, private readonly clientTypes: TypeReferenceResolver) {}

	async applyClientModel<T extends Entity>(typeRef: TypeRef<T>, literal: any): Promise<T> {
		const t = {
			_type: typeRef,
		}

		return t as unknown as T
	}

	async applyServerModel(): Promise<any> {}
}

/**
 * Returns bytes when the type === Bytes or type === CompressedString, otherwise returns a string
 * @param type
 * @param value
 * @returns {string|string|NodeJS.Global.Uint8Array|*}
 */
export function convertJsToDbType(type: Values<typeof ValueType>, value: Nullable<ParsedValue>): Nullable<string | Uint8Array> {
	if (value == null) {
		return null
	} else if (type === ValueType.Bytes) {
		return value as Uint8Array
	} else if (type === ValueType.Boolean) {
		return value ? "1" : "0"
	} else if (type === ValueType.Date) {
		return (value as Date).getTime().toString()
	} else if (type === ValueType.CompressedString) {
		return compressString(value as string)
	} else {
		return value as string
	}
}

export function convertDbToJsType(type: Values<typeof ValueType>, decryptedValue: Nullable<string | Uint8Array>): Nullable<ParsedValue> {
	if (decryptedValue == null) {
		return null
	} else if (type === ValueType.Bytes) {
		return base64ToUint8Array(decryptedValue as string)
	} else if (type === ValueType.Boolean) {
		return decryptedValue !== "0"
	} else if (type === ValueType.Date) {
		return new Date(parseInt(decryptedValue as string))
	} else if (type === ValueType.CompressedString) {
		return decompressString(base64ToUint8Array(decryptedValue as string))
	} else {
		return decryptedValue
	}
}

export function compressString(uncompressed: string): Uint8Array {
	return compress(stringToUtf8Uint8Array(uncompressed))
}

export function decompressString(compressed: Uint8Array): string {
	if (compressed.length === 0) {
		return ""
	}

	const output = uncompress(compressed)
	return utf8Uint8ArrayToString(output)
}

export function valueToDefault(type: Values<typeof ValueType>): Date | Uint8Array | string | boolean {
	switch (type) {
		case ValueType.String:
			return ""

		case ValueType.Number:
			return "0"

		case ValueType.Bytes:
			return new Uint8Array(0)

		case ValueType.Date:
			return new Date(0)

		case ValueType.Boolean:
			return false

		case ValueType.CompressedString:
			return ""

		default:
			throw new ProgrammingError(`${type} is not a valid value type`)
	}
}

export function isDefaultValue(type: Values<typeof ValueType>, value: unknown): boolean {
	switch (type) {
		case ValueType.String:
			return value === ""

		case ValueType.Number:
			return value === "0"

		case ValueType.Bytes:
			return (value as Uint8Array).length === 0

		case ValueType.Date:
			return (value as Date).getTime() === 0

		case ValueType.Boolean:
			return value === false

		case ValueType.CompressedString:
			return value === ""

		default:
			throw new ProgrammingError(`${type} is not a valid value type`)
	}
}
