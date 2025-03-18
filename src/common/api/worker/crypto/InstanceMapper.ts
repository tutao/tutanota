import { resolveTypeReference } from "../../common/EntityFunctions"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import { base64ToUint8Array, stringToUtf8Uint8Array, TypeRef, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { AssociationType, ValueType } from "../../common/EntityConstants.js"
import { compress, uncompress } from "../Compression"
import {
	EncryptedParsedAssociation,
	EncryptedParsedInstance,
	Entity,
	ModelAssociation,
	ParsedValue,
	TypeModel,
	UntypedAssociation,
	UntypedInstance,
	UntypedValue,
} from "../../common/EntityTypes"
import { assertWorkerOrNode } from "../../common/Env"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"

assertWorkerOrNode()

export type AttributeId = number
export type TypeId = number
export type AppName = "base" | "sys" | "tutanota" | "usage" | "monitor" | "accouting" | "gossip"
export type AttributeName = string

export class InstanceMapper {
	async mapValues(typeModel: TypeModel, instance: UntypedInstance): Promise<EncryptedParsedInstance> {
		let parsedInstance: EncryptedParsedInstance = {}
		for (const [attrIdStr, modelValue] of Object.entries(typeModel.values)) {
			const attrId = parseInt(attrIdStr)
			// values at this stage are only strings, the other types are only possible for associations.
			const untypedValue = instance[attrId.toString()] as UntypedValue

			if (modelValue.encrypted) {
				// will be decrypted and mapped at a later stage
				parsedInstance[attrId] = untypedValue
			} else {
				parsedInstance[attrId] = convertDbToJsType(modelValue.type, untypedValue)
			}
		}

		for (const [attrIdStr, modelAssociation] of Object.entries(typeModel.associations)) {
			const attrId = parseInt(attrIdStr)
			const untypedAssociation = instance[attrId.toString()] as UntypedAssociation
			parsedInstance[attrId] = await this.convertUntypedAssociationToEncryptedParsedAssociation(typeModel.app, modelAssociation, untypedAssociation)
		}

		return parsedInstance
	}

	private async convertUntypedAssociationToEncryptedParsedAssociation(
		appName: AppName,
		modelAssociation: ModelAssociation,
		value: UntypedAssociation,
	): Promise<EncryptedParsedAssociation> {
		switch (modelAssociation.type) {
			case AssociationType.ElementAssociation || AssociationType.ListAssociation:
				return value as Array<Id>
			case AssociationType.ListElementAssociationGenerated || AssociationType.ListElementAssociationCustom || AssociationType.BlobElementAssociation:
				return value as Array<IdTuple>
			case AssociationType.Aggregation: {
				const refType = new TypeRef((modelAssociation.dependency as Nullable<AppName>) ?? appName, modelAssociation.refTypeId)
				const refTypeModel = await resolveTypeReference(refType)
				const convertedAggregates: Array<EncryptedParsedInstance> = []
				for (const aggregateLiteral of value as Array<UntypedInstance>) {
					const convertedAggregate = await this.mapValues(refTypeModel, aggregateLiteral)
					convertedAggregates.push(convertedAggregate)
				}
				return convertedAggregates
			}
		}

		throw new ProgrammingError(`Unhandled AssociationType`)
	}

	async uncloak<T extends Entity>(typeRef: TypeRef<T>, literal: any): Promise<T> {
		const t = {
			_type: typeRef,
		}

		return t as unknown as T
	}
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
