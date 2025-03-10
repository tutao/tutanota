import { ProgrammingError } from "../../common/error/ProgrammingError"
import {
	base64ToBase64Url,
	base64ToUint8Array,
	downcast,
	stringToUtf8Uint8Array,
	TypeRef,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString,
} from "@tutao/tutanota-utils"
import { AssociationType, Cardinality, Type, ValueType } from "../../common/EntityConstants.js"
import { compress, uncompress } from "../Compression"
import { ClientModelParsedInstance, Entity, ModelAssociation, ParsedAssociation, ParsedValue, ServerModelParsedInstance } from "../../common/EntityTypes"
import { assertWorkerOrNode } from "../../common/Env"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { TypeReferenceResolver } from "../../common/EntityFunctions"
import { random } from "@tutao/tutanota-crypto"

assertWorkerOrNode()

/**
 * check that a field on an instance conforms to the cardinality requirements in its server or client type model and
 *
 * @param typeRef the reference to the client or server type the value is a field on
 * @param attrId the attribute id the field has in the model
 * @param cardinality which cardinality should the value have according to the type model
 * @param parsedValue the actual value as found on the Instance or ParsedInstance
 * @return a value that can be assigned to a ParsedInstance or Instance (depending on the direction)
 */
export function assertCorrectValueCardinality(
	typeRef: TypeRef<unknown>,
	attrId: string,
	cardinality: Values<typeof Cardinality>,
	parsedValue: Nullable<ParsedValue>,
): Nullable<ParsedValue> {
	if (cardinality === Cardinality.ZeroOrOne || (cardinality === Cardinality.One && parsedValue != null)) {
		return parsedValue
	}
	throw new ProgrammingError(
		`invalid value / cardinality combination for value ${attrId} on type ${typeRef.app}/${typeRef.typeId}: ${cardinality}, isNull: ${!parsedValue}`,
	)
}

/**
 * check that a value passing from server to client conforms to the cardinality requirements of the business logic
 * as laid out in the type model.
 *
 * @param typeRef the reference to the client type the value is a field on
 * @param attrId the attribute id the field has in the model
 * @param type the type the value will have on the client instance
 * @param cardinality which cardinality should the value have when used in the business logic
 * @param parsedValue the actual value as found on the ParsedInstance
 * @return a value that can be assigned to an Instance
 */
export function assertAndSupplyCorrectAssociationClientCardinality(
	typeRef: TypeRef<unknown>,
	attrId: string,
	{ type, cardinality }: ModelAssociation,
	parsedValue: Array<unknown>,
): unknown {
	if (cardinality === Cardinality.ZeroOrOne && !parsedValue) {
		return null
	} else if (cardinality === Cardinality.ZeroOrOne && parsedValue.length < 2) {
		return parsedValue[0] ?? null
	} else if (cardinality === Cardinality.One && !parsedValue) {
		throw new ProgrammingError(
			`invalid association / cardinality combination for association ${attrId} on type ${typeRef.app}/${typeRef.typeId}: ${cardinality}, no parsedValue`,
		)
	} else if (cardinality === Cardinality.One && parsedValue.length === 1) {
		return parsedValue[0]
	} else if (
		cardinality !== Cardinality.Any &&
		idTupleAssociations.includes(type) &&
		parsedValue.length === 1 &&
		downcast<Array<Id | IdTuple>>(parsedValue)[0].length === 2
	) {
		return parsedValue[0]
	} else if (cardinality === Cardinality.Any) {
		return parsedValue ?? []
	}

	throw new ProgrammingError(
		`invalid association / cardinality combination for association ${attrId} on type ${typeRef.app}/${typeRef.typeId}: ${cardinality}, val.len: ${parsedValue.length}`,
	)
}

/**
 * the AssociationTypes that have an IdTuple as the references value.
 * they need to be special-cased for cardinality checking because an IdTuple is an array.
 */
const idTupleAssociations: Array<Values<typeof AssociationType>> = [
	AssociationType.ListElementAssociationGenerated,
	AssociationType.BlobElementAssociation,
	AssociationType.ListElementAssociationCustom,
]

/**
 * check that the types on the server model and client model are compatible. if this doesn't pass for a pair of
 * type models, it's likely that the old client version needs to be disabled to roll out that change. We need to
 * have different functions for different directions of transformations such as BooleanToNumber or NumberToString.
 *
 * @param typeRef the reference to the client and server type the field is on
 * @param attrId the attribute id the field has in the models
 * @param fromType modelValue for the type we would like to map the field into
 * @param toType the type the field currently has
 */
function assertCompatibleModelTypesForApplyingClientModel(
	typeRef: TypeRef<unknown>,
	attrId: string,
	fromType: Values<typeof ValueType>,
	toType: Values<typeof ValueType>,
) {
	if (
		fromType === toType ||
		(fromType === ValueType.Number && toType === ValueType.Boolean) ||
		(fromType === ValueType.String && toType === ValueType.Number)
	) {
		return
	}
	throw new ProgrammingError(
		`cannot map from server to client type: types of field ${attrId} on type ${typeRef.app}/${typeRef.typeId} are incompatible. This client is not compatible with the current server model.`,
	)
}

/**
 * this mapper is responsible for "migrations" and checking model correctness, mostly field types and cardinalities.
 *
 * it maps between the plain Instance objects used in the clients business logic and the ParsedInstance representation
 * which conforms to the server's model and is closer to the Instance format that is used on the server.
 *
 * There are unsafe model transformations that can result in data loss if not executed carefully.
 * See the tutadb documentation on lossy migrations.
 * This class is also responsible for checking for those as much as possible.
 *
 */
export class ModelMapper {
	constructor(
		/** resolves typerefs against the type models used by the clients business logic. */
		private readonly clientTypes: TypeReferenceResolver,
		/** resolves typerefs against the current type models as used on the server the client connects to */
		private readonly serverTypes: TypeReferenceResolver,
	) {}

	async mapToInstance<T extends Entity>(typeRef: TypeRef<unknown>, parsedInstance: ServerModelParsedInstance): Promise<T> {
		// in case of a new type, the server should not send it to clients until the oldest client can handle it.
		// if a type is not in the client's model anymore, it should have been removed from the business logic and
		// the server should have stopped sending it by now.
		const clientTypeModel = await this.clientTypes(typeRef)
		// the server sent the instance, so it should be in the server's type models no matter what.
		const serverTypeModel = await this.serverTypes(typeRef)

		const clientInstance: Record<string, unknown> = {
			_type: typeRef,
			_finalIvs: parsedInstance._finalIvs,
		}

		if (parsedInstance._errors != null) {
			// if we do this unconditionally, we get an explicit {_errors: undefined, ... } in cases where
			// decryption was successful.
			// that would mess with places that check for the presence of the field.
			clientInstance._errors = parsedInstance._errors
		}

		for (const [attrIdStr, clientType] of Object.entries(clientTypeModel.values)) {
			const attrId = parseInt(attrIdStr)
			const serverType = serverTypeModel.values[attrId]
			if (!serverType) {
				if (clientType.cardinality === Cardinality.One) {
					clientInstance[clientType.name] = valueToDefault(clientType.type)
				} else if (clientType.cardinality === Cardinality.ZeroOrOne) {
					clientInstance[clientType.name] = null
				}
			} else {
				assertCompatibleModelTypesForApplyingClientModel(typeRef, attrIdStr, serverType.type, clientType.type)
				let parsedValue = parsedInstance[attrId] as Nullable<ParsedValue>

				if (serverType.type === ValueType.Number && clientType.type === ValueType.Boolean) {
					parsedValue = parsedValue !== "0"
				} else if (serverType.type === ValueType.String && clientType.type === ValueType.Number) {
					if (typeof parsedValue === "string") {
						parsedValue = parseInt(parsedValue as string)
						if (isNaN(parsedValue)) {
							throw new ProgrammingError("string sent by the server cannot be converted to a number")
						}
					}
				}
				clientInstance[clientType.name] = assertCorrectValueCardinality(typeRef, attrIdStr, clientType.cardinality, parsedValue)
			}
		}

		for (const [assocIdStr, modelAssoc] of Object.entries(clientTypeModel.associations)) {
			const assocId = parseInt(assocIdStr)
			if (modelAssoc.type === AssociationType.Aggregation) {
				const appName = modelAssoc.dependency ?? clientTypeModel.app
				const assocTypeRef = new TypeRef(appName, modelAssoc.refTypeId)
				const associationValues = parsedInstance[assocId] as Array<ServerModelParsedInstance>
				const clientAssociationValues = []
				if (associationValues) {
					for (const value of associationValues) {
						clientAssociationValues.push(await this.mapToInstance(assocTypeRef, value))
					}
				}
				clientInstance[modelAssoc.name] = assertAndSupplyCorrectAssociationClientCardinality(typeRef, assocIdStr, modelAssoc, clientAssociationValues)
			} else {
				clientInstance[modelAssoc.name] = assertAndSupplyCorrectAssociationClientCardinality(
					typeRef,
					assocIdStr,
					modelAssoc,
					parsedInstance[assocId] as ParsedAssociation,
				)
			}
		}

		return clientInstance as T
	}

	async mapToClientModelParsedInstance<T extends Entity>(typeRef: TypeRef<T>, instance: T): Promise<ClientModelParsedInstance> {
		const clientTypeModel = await this.clientTypes(typeRef)

		const parsedInstance: Record<number, unknown> & { _finalIvs: unknown } = {
			_finalIvs: typeof instance["_finalIvs"] !== "undefined" ? instance["_finalIvs"] : {},
		}

		for (const [attrIdStr, modelValue] of Object.entries(clientTypeModel.values)) {
			const attrId = parseInt(attrIdStr)
			let clientValue = ((instance as any)[modelValue.name] as Nullable<ParsedValue>) ?? null

			if (clientTypeModel.type === Type.Aggregated && modelValue.name === "_id" && clientValue === null) {
				parsedInstance[attrId] = base64ToBase64Url(uint8ArrayToBase64(random.generateRandomData(4)))
			} else {
				parsedInstance[attrId] = clientValue
			}
		}
		for (const [assocIdStr, modelAssoc] of Object.entries(clientTypeModel.associations)) {
			const assocId = parseInt(assocIdStr)
			const appName = modelAssoc.dependency ?? clientTypeModel.app
			const assocTypeRef = new TypeRef<any>(appName, modelAssoc.refTypeId)
			if (modelAssoc.type === AssociationType.Aggregation) {
				if (modelAssoc.cardinality === Cardinality.Any) {
					const associationValues = (instance as any)[modelAssoc.name] as Array<Entity>
					const parsedAssociationValues: Array<ClientModelParsedInstance> = []
					if (associationValues) {
						for (const value of associationValues) {
							parsedAssociationValues.push(await this.mapToClientModelParsedInstance(assocTypeRef, value))
						}
					}
					parsedInstance[assocId] = parsedAssociationValues
				} else {
					const associationValue = (instance as any)[modelAssoc.name] as Nullable<Entity>
					let parsedAssociationValue: Array<ClientModelParsedInstance> = []
					if (associationValue != null) {
						parsedAssociationValue = [await this.mapToClientModelParsedInstance(assocTypeRef, associationValue)]
					}
					parsedInstance[assocId] = parsedAssociationValue
				}
			} else {
				if (modelAssoc.cardinality === Cardinality.Any) {
					const associationValues = (instance as any)[modelAssoc.name]
					parsedInstance[assocId] = associationValues ? associationValues : []
				} else {
					const associationValue = (instance as any)[modelAssoc.name]
					parsedInstance[assocId] = associationValue ? [associationValue] : []
				}
			}
		}
		return parsedInstance as ClientModelParsedInstance
	}
}

/**
 * Returns
 *   - bytes when the type of the field in the client is Bytes or CompressedString
 *   - otherwise a string
 * type mapping is done twice:
 * * once during encryption
 *    -> plaintext values are left as-is, encrypted values are converted to bytes, encrypted and encoded to base64 here.
 *  * once directly before serializing to JSON
 *    -> encrypted values are just left as base64 strings, plaintext values convert to strings.
 *
 * note: this function does not enforce this; the user has to check that the first invocation is compatible with
 *       the second.
 * @returns {string|string|Uint8Array|*}
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

/*
 * converts values of fields on instances between the server representation and the client representation.
 * type mapping is done twice:
 * * once directly after deserializing the JSON
 *   -> encrypted values are just left as base64 strings
 * * once after decrypting encrypted values
 *   -> plaintext values are left as-is, encrypted values are mapped to their final type there.
 *
 * note: this function does not enforce this; the user has to check that the first invocation is compatible with
 *       the second.
 */
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
		case ValueType.CompressedString:
			return ""

		case ValueType.Number:
			return "0"

		case ValueType.Bytes:
			return new Uint8Array(0)

		case ValueType.Date:
			return new Date(0)

		case ValueType.Boolean:
			return false
		default:
			throw new ProgrammingError(`${type} is not a value type with a defined default`)
	}
}

export function isDefaultValue(type: Values<typeof ValueType>, value: unknown): boolean {
	switch (type) {
		case ValueType.String:
		case ValueType.CompressedString:
			return value === ""

		case ValueType.Number:
			return value === "0"

		case ValueType.Bytes:
			return (value as Uint8Array).length === 0

		case ValueType.Date:
			return (value as Date).getTime() === 0

		case ValueType.Boolean:
			return value === false

		default:
			throw new ProgrammingError(`${type} is not a value type with a defined default`)
	}
}
