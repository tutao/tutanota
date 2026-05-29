import { Cardinality, ModelValue, TypeModel, ValueTypeEnum } from "@tutao/meta"
import { assert, DeepEquals, Nullable, stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/utils"
import { compress, uncompress } from "./Compression"
import { ProgrammingError } from "@tutao/app-env"
import { ParsedValue } from "./ParsedValue"
import { assertNotNaN } from "../utils/Utils"

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
			if (modelValue.cardinality === Cardinality.One) {
				throw new ProgrammingError(`Null value is not allowed for field: ${modelValue.name} with cardinality One`)
			}
			entityRecord[key] = null
			return
		}

		switch (modelValue.type) {
			case ValueTypeEnum.Bytes:
				entityRecord[key] = parsedValue.asByteArray()
				break

			case ValueTypeEnum.Number:
				entityRecord[key] = assertNotNaN(parseInt(parsedValue.asString()), `Non-numeric string for attribute: ${modelValue.name}`).toString()
				break
			case ValueTypeEnum.String:
			case ValueTypeEnum.CompressedString:
				entityRecord[key] = parsedValue.asString()
				break
			case ValueTypeEnum.Date:
				entityRecord[key] = parsedValue.asDate()
				break
			case ValueTypeEnum.Boolean:
				entityRecord[key] = parsedValue.asBoolean()
				break
			case ValueTypeEnum.GeneratedId:
			case ValueTypeEnum.CustomId:
				entityRecord[key] = parsedValue.asId()
				break
		}
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

	static typeModelToRestPath(typeModel: TypeModel): string {
		return `/rest/${typeModel.app}/${typeModel.name.toLowerCase()}`
	}
}
