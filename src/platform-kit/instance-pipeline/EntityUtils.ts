import { ModelValue, TypeModel, ValueTypeEnum } from "@tutao/meta"
import { assert, DeepEquals, Nullable, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/utils"
import { assertNotNaN } from "../utils/Utils"
import { compress, uncompress } from "./Compression"
import { ProgrammingError } from "@tutao/app-env"
import { ParsedValue } from "./PipelineTypes"

export class EntityUtils {
	public static getValue<NestedObj extends DeepEquals>(valueModel: ModelValue, value: Nullable<any>): ParsedValue<NestedObj> {
		assert(valueModel.name !== "_id", "Do not use this method for _id. Check if it's Id or IdTuple outside")
		if (value == null) {
			return ParsedValue.fromNull()
		}
		switch (valueModel.type) {
			case ValueTypeEnum.String:
				return ParsedValue.fromString(value as string)
			case ValueTypeEnum.GeneratedId:
			case ValueTypeEnum.CustomId:
				return ParsedValue.fromId(value as Id)
			case ValueTypeEnum.CompressedString:
				return ParsedValue.fromString(value as string)
			case ValueTypeEnum.Number:
				return ParsedValue.fromString(value as NumberString)
			case ValueTypeEnum.Bytes:
				return ParsedValue.fromByteArray(value as Uint8Array)
			case ValueTypeEnum.Date:
				return ParsedValue.fromString((value as Date).getTime().toString())
			case ValueTypeEnum.Boolean:
				return ParsedValue.fromBoolean(value as boolean)
		}
	}

	public static setValue<A extends DeepEquals, K extends string | number>(
		modelValue: ModelValue,
		key: K,
		parsedValue: ParsedValue<A>,
		entityRecord: Record<K, any>,
	): void {
		assert(modelValue.name !== "_id", "Do not use this method for _id. Check if it's Id or IdTuple outside")
		if (parsedValue.isNull()) {
			entityRecord[key] = null
			return
		}

		if (modelValue.type === ValueTypeEnum.Bytes) {
			entityRecord[key] = parsedValue.asByteArray()
			return
		} else if (modelValue.type === ValueTypeEnum.CompressedString) {
			entityRecord[key] = EntityUtils.decompressString(parsedValue.asByteArray()) satisfies string
			return
		}

		const value = modelValue.encrypted ? utf8Uint8ArrayToString(parsedValue.asByteArray()) : parsedValue.asString()
		if (modelValue.type === ValueTypeEnum.String) {
			entityRecord[key] = value satisfies string
			return
		} else if (modelValue.type === ValueTypeEnum.Number) {
			entityRecord[key] = value satisfies NumberString
			return
		} else if (modelValue.type === ValueTypeEnum.Date) {
			entityRecord[key] = new Date(assertNotNaN(parseInt(value)))
			return
		} else if (modelValue.type === ValueTypeEnum.Boolean) {
			entityRecord[key] = value !== "0"
			return
		} else if (modelValue.type === ValueTypeEnum.GeneratedId) {
			entityRecord[key] = value satisfies Id
			return
		} else if (modelValue.type === ValueTypeEnum.CustomId) {
			entityRecord[key] = value satisfies Id
			return
		}

		throw new ProgrammingError("unknown valueType")
	}

	// FIXME: there was a comment here? Put it somewhere

	static compressString(uncompressed: string): Uint8Array {
		return compress(stringToUtf8Uint8Array(uncompressed))
	}

	static decompressString(compressed: Uint8Array): string {
		if (compressed.length === 0) {
			return ""
		}

		const output = uncompress(compressed)
		return utf8Uint8ArrayToString(output)
	}

	static valueToDefault<NestObj extends DeepEquals>(type: ValueTypeEnum): ParsedValue<NestObj> {
		switch (type) {
			case ValueTypeEnum.String:
				return ParsedValue.fromString("")
			case ValueTypeEnum.CompressedString:
				return ParsedValue.fromString("")
			case ValueTypeEnum.Number:
				return ParsedValue.fromString("0")
			case ValueTypeEnum.Bytes:
				return ParsedValue.fromByteArray(new Uint8Array(0))
			case ValueTypeEnum.Date:
				return ParsedValue.fromString(new Date(0).getTime().toString())
			case ValueTypeEnum.Boolean:
				return ParsedValue.fromBoolean(false)
			default:
				throw new ProgrammingError(`${type} is not a value type with a defined default`)
		}
	}

	// visibleForTesting
	static isDefaultValue(type: ValueTypeEnum, value: unknown): boolean {
		switch (type) {
			case ValueTypeEnum.String:
				return value === ""
			case ValueTypeEnum.CompressedString:
				return value === ""
			case ValueTypeEnum.Number:
				return value === "0"
			case ValueTypeEnum.Bytes:
				return (value as Uint8Array).length === 0
			case ValueTypeEnum.Date:
				return (value as Date).getTime() === 0
			case ValueTypeEnum.Boolean:
				return value === false
			default:
				throw new ProgrammingError(`${type} is not a value type with a defined default`)
		}
	}

	static typeModelToRestPath(typeModel: TypeModel): string {
		return `/rest/${typeModel.app}/${typeModel.name.toLowerCase()}`
	}
}
