import { ProgrammingError } from "../../common/error/ProgrammingError"
import { base64ToUint8Array, stringToUtf8Uint8Array, TypeRef, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { AssociationType, Cardinality, ValueType } from "../../common/EntityConstants.js"
import { compress, uncompress } from "../Compression"
import type { Entity, ModelAssociation, ParsedAssociation, ParsedInstance, ParsedValue } from "../../common/EntityTypes"
import { assertWorkerOrNode } from "../../common/Env"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { TypeReferenceResolver } from "../../common/EntityFunctions"

assertWorkerOrNode()

export type AttributeId = number
export type TypeId = number
export type AttributeName = string

export function assertCorrectValueCardinality(
	typeRef: TypeRef<unknown>,
	attrId: string,
	cardinality: Values<typeof Cardinality>,
	parsedValue: Nullable<ParsedValue>,
): Nullable<ParsedValue> {
	if (cardinality === Cardinality.ZeroOrOne || (cardinality === Cardinality.One && parsedValue != null)) {
		return parsedValue
	}
	throw new ProgrammingError(`invalid value / cardinality combination for value ${attrId} on type ${typeRef.typeId}: ${cardinality}, isNull: ${!parsedValue}`)
}

export function assertCorrectAssociationClientCardinality(
	typeRef: TypeRef<unknown>,
	attrId: string,
	{ type, cardinality }: ModelAssociation,
	parsedValue: Array<unknown>,
): unknown {
	if (cardinality === Cardinality.ZeroOrOne && parsedValue.length < 2) {
		return parsedValue[0] ?? null
	} else if (cardinality === Cardinality.One && parsedValue.length === 1) {
		return parsedValue[0]
	} else if (cardinality !== Cardinality.Any && (parsedValue.length === 2 || parsedValue.length === 0) && idTupleAssociations.includes(type)) {
		return parsedValue
	} else if (cardinality === Cardinality.Any) {
		return parsedValue
	}

	throw new ProgrammingError(
		`invalid association / cardinality combination for association ${attrId} on type ${typeRef.typeId}: ${cardinality}, val.len: ${parsedValue.length}`,
	)
}

const idTupleAssociations: Array<Values<typeof AssociationType>> = [
	AssociationType.ListElementAssociationGenerated,
	AssociationType.BlobElementAssociation,
	AssociationType.ListElementAssociationCustom,
]

export function assertCorrectAssociationServerCardinality(
	typeRef: TypeRef<unknown>,
	attrId: string,
	{ type, cardinality }: ModelAssociation,
	parsedValue: Array<unknown> | unknown,
): unknown {
	if (cardinality === Cardinality.ZeroOrOne && !Array.isArray(parsedValue)) {
		return parsedValue != null ? [parsedValue] : []
	} else if (cardinality === Cardinality.One && parsedValue != null && !Array.isArray(parsedValue)) {
		return [parsedValue]
	} else if (
		cardinality !== Cardinality.Any &&
		parsedValue != null &&
		Array.isArray(parsedValue) &&
		(parsedValue.length === 2 || parsedValue.length === 0) &&
		idTupleAssociations.includes(type)
	) {
		return [parsedValue]
	} else if (cardinality === Cardinality.Any && Array.isArray(parsedValue)) {
		return parsedValue
	}

	throw new ProgrammingError(
		`invalid association / cardinality combination for association ${attrId} on type ${typeRef.typeId}: ${cardinality}, isArray: ${Array.isArray(
			parsedValue,
		)}, isNull ${parsedValue == null}, parsedValue: ${parsedValue}`,
	)
}

function assertCompatibleModelTypes(typeRef: TypeRef<unknown>, attrId: string, fromType: Values<typeof ValueType>, toType: Values<typeof ValueType>) {
	if (fromType === toType) return
	throw new ProgrammingError(
		`cannot map from server to client type: types of field ${attrId} on type ${typeRef.typeId} are incompatible. This client is not compatible with the current server model.`,
	)
}

/**
 * responsible for "migrations" and checking types / cardinalities.
 */
export class ModelMapper {
	constructor(private readonly serverTypes: TypeReferenceResolver, private readonly clientTypes: TypeReferenceResolver) {}

	async applyClientModel<T extends Entity>(typeRef: TypeRef<unknown>, parsedInstance: ParsedInstance): Promise<T> {
		const clientTypeModel = await this.clientTypes(typeRef)
		// fixme: what if the server has a new type?
		const serverTypeModel = await this.serverTypes(typeRef)

		const clientInstance: Record<string, unknown> = {
			_type: typeRef,
			_finalIvs: parsedInstance._finalIvs,
		}

		if (parsedInstance._errors != null) {
			// otherwise we get an explicit _errors: undefined
			clientInstance._errors = parsedInstance._errors
		}

		for (const [attrIdStr, modelValue] of Object.entries(clientTypeModel.values)) {
			const attrId = parseInt(attrIdStr)
			const serverType = serverTypeModel.values[attrId]
			assertCompatibleModelTypes(typeRef, attrIdStr, serverType.type, modelValue.type)
			clientInstance[modelValue.name] = assertCorrectValueCardinality(
				typeRef,
				attrIdStr,
				modelValue.cardinality,
				parsedInstance[attrId] as Nullable<ParsedValue>,
			)
		}

		for (const [assocIdStr, modelAssoc] of Object.entries(clientTypeModel.associations)) {
			const assocId = parseInt(assocIdStr)
			if (modelAssoc.type === AssociationType.Aggregation) {
				const appName = modelAssoc.dependency ?? clientTypeModel.app
				const assocTypeRef = new TypeRef(appName, modelAssoc.refTypeId)
				const values = parsedInstance[assocId] as Array<ParsedInstance>
				const clientValues = []
				for (const value of values) {
					clientValues.push(await this.applyClientModel(assocTypeRef, value))
				}
				clientInstance[modelAssoc.name] = assertCorrectAssociationClientCardinality(typeRef, assocIdStr, modelAssoc, clientValues)
			} else {
				clientInstance[modelAssoc.name] = assertCorrectAssociationClientCardinality(
					typeRef,
					assocIdStr,
					modelAssoc,
					parsedInstance[assocId] as ParsedAssociation,
				)
			}
		}

		return clientInstance as T
	}

	async applyServerModel<T extends Entity>(typeRef: TypeRef<T>, instance: T): Promise<ParsedInstance> {
		const clientTypeModel = await this.clientTypes(typeRef)
		// fixme: what if the server has a new type? -> map: can't happen in this case as we won't create instances of them
		const serverTypeModel = await this.serverTypes(typeRef)
		const serverInstance: Record<number, unknown> & { _finalIvs: unknown } = {
			_finalIvs: typeof instance["_finalIvs"] !== "undefined" ? instance["_finalIvs"] : {},
		}

		for (const [attrIdStr, serverType] of Object.entries(serverTypeModel.values)) {
			const attrId = parseInt(attrIdStr)
			let clientType = clientTypeModel.values[attrId]

			if (clientType == null) {
				// new attribute -> default value
				if (serverType.cardinality === Cardinality.One) {
					serverInstance[attrId] = valueToDefault(serverType.type)
				} else {
					// No Value with Cardinality Any
					serverInstance[attrId] = null
				}
				continue
			}

			assertCompatibleModelTypes(typeRef, attrIdStr, clientType.type, serverType.type)
			const clientValue = ((instance as any)[clientType.name] as Nullable<ParsedValue>) ?? null
			if (serverType.cardinality === Cardinality.One && clientValue == null && serverType.name != "_id") {
				// no value with Cardinality Any. A ZeroOrOne to One transformation needs a default value
				try {
					serverInstance[attrId] = valueToDefault(serverType.type)
				} catch (e) {
					if (e instanceof ProgrammingError) {
						throw new ProgrammingError(`Failed to map ${serverTypeModel.name}.${serverType.name}: ${e}`)
					} else {
						throw e
					}
				}
			} else {
				serverInstance[attrId] = clientValue
			}
		}

		for (const [assocIdStr, modelAssoc] of Object.entries(serverTypeModel.associations)) {
			const assocId = parseInt(assocIdStr)
			const appName = modelAssoc.dependency ?? clientTypeModel.app
			const assocTypeRef = new TypeRef<any>(appName, modelAssoc.refTypeId)
			if (modelAssoc.type === AssociationType.Aggregation) {
				if (modelAssoc.cardinality === Cardinality.Any) {
					const values = (instance as any)[modelAssoc.name] as Array<Entity>
					const clientValues: Array<ParsedInstance> = []
					for (const value of values) {
						clientValues.push(await this.applyServerModel(assocTypeRef, value))
					}
					serverInstance[assocId] = assertCorrectAssociationServerCardinality(assocTypeRef, assocIdStr, modelAssoc, clientValues)
				} else {
					const value = (instance as any)[modelAssoc.name] as Nullable<Entity>
					const parsedMappedValue = value != null ? await this.applyServerModel(assocTypeRef, value) : null
					serverInstance[assocId] = assertCorrectAssociationServerCardinality(assocTypeRef, assocIdStr, modelAssoc, parsedMappedValue)
				}
			} else {
				serverInstance[assocId] = assertCorrectAssociationServerCardinality(
					assocTypeRef,
					assocIdStr,
					modelAssoc,
					(instance as any)[modelAssoc.name] as ParsedAssociation,
				)
			}
		}
		return serverInstance as ParsedInstance
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

export function valueToDefault(type: Values<typeof ValueType>): ParsedValue {
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
