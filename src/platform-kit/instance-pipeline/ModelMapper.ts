import { assertWorkerOrNode, InvalidModelError, ProgrammingError } from "@tutao/app-env"
import {
	base64ToBase64Url,
	base64ToUint8Array,
	downcast,
	Nullable,
	promiseMap,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString,
} from "@tutao/utils"
import { AssociationType, Cardinality, ModelValue, ParsedValue, ServerModelParsedInstance, Type, TypeRef, ValueType, ValueTypeEnum } from "../meta"
import { compress, uncompress } from "./Compression"
import { random } from "@tutao/crypto"
import { ClientModelParsedInstance, Entity, ModelAssociation } from "../meta/EntityTypes"
import { TypeModelResolver } from "./EntityFunctions"

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
	parsedValue: ParsedValue,
): ParsedValue {
	if (cardinality === Cardinality.ZeroOrOne || (cardinality === Cardinality.One && !parsedValue.isNull())) {
		return parsedValue
	}
	throw new InvalidModelError(
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
		throw new InvalidModelError(
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

	throw new InvalidModelError(
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
	throw new InvalidModelError(
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
	constructor(private readonly typeModelResolver: TypeModelResolver) {}

	async mapToInstances<T extends Entity>(typeRef: TypeRef<T>, parsedInstances: Array<ServerModelParsedInstance>): Promise<Array<T>> {
		return await promiseMap(parsedInstances, (parsedInstance) => this.mapToInstance(typeRef, parsedInstance))
	}

	async mapToInstance<T extends Entity>(typeRef: TypeRef<unknown>, parsedInstance: ServerModelParsedInstance): Promise<T> {
		// in case of a new type, the server should not send it to clients until the oldest client can handle it.
		// if a type is not in the client's model anymore, it should have been removed from the business logic and
		// the server should have stopped sending it by now.
		const clientTypeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		// the server sent the instance, so it should be in the server's type models no matter what.
		const serverTypeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		const clientInstance: Record<string, unknown> = {
			_type: typeRef,
		}

		if (parsedInstance._errors != null) {
			// if we do this unconditionally, we get an explicit {_errors: undefined, ... } in cases where
			// decryption was successful.
			// that would mess with places that check for the presence of the field.
			clientInstance._errors = parsedInstance._errors
		}

		for (const [attrIdStr, clientType] of Object.entries(clientTypeModel.values)) {
			const attrId = parseInt(attrIdStr)
			const serverType: Nullable<ModelValue> = serverTypeModel.values[attrId]
			if (serverType == null) {
				// Case where a attribute have been removed from serverModel and was in clientModel

				if (clientType.cardinality === Cardinality.One) {
					clientInstance[clientType.name] = valueToDefault(clientType.type)
				} else if (clientType.cardinality === Cardinality.ZeroOrOne) {
					clientInstance[clientType.name] = null
				}
			} else {
				assertCompatibleModelTypesForApplyingClientModel(typeRef, attrIdStr, serverType.type, clientType.type)
				let parsedValue = parsedInstance[attrId]

				if (clientType.type === ValueType.Number) {
					parsedValue.validateNumberValue()
				} else if (parsedValue.isNull() && serverType.cardinality === Cardinality.One) {
					parsedValue = valueToDefault(serverType.type)
				}
				clientInstance[clientType.name] = assertCorrectValueCardinality(typeRef, attrIdStr, clientType.cardinality, parsedValue)
			}
		}

		for (const [assocIdStr, modelAssoc] of Object.entries(clientTypeModel.associations)) {
			const assocId = parseInt(assocIdStr)
			const associationValues: Nullable<Array<ParsedValue>> = parsedInstance[assocId]?.asArray() ?? null

			if (modelAssoc.type === AssociationType.Aggregation) {
				const appName = modelAssoc.dependency ?? clientTypeModel.app
				const assocTypeRef = new TypeRef(appName, modelAssoc.refTypeId)

				const clientAssociationValues = []
				if (associationValues == null) {
					// Case where a attribute have been removed from serverModel and was in clientModel
				} else {
					for (const value of associationValues) {
						const aggregatedItem = value.asNestedObj()
						clientAssociationValues.push(await this.mapToInstance(assocTypeRef, aggregatedItem))
					}
				}
				clientInstance[modelAssoc.name] = assertAndSupplyCorrectAssociationClientCardinality(typeRef, assocIdStr, modelAssoc, clientAssociationValues)
			} else {
				clientInstance[modelAssoc.name] = assertAndSupplyCorrectAssociationClientCardinality(typeRef, assocIdStr, modelAssoc, associationValues)
			}
		}

		if (clientTypeModel.type !== Type.DataTransfer) {
			clientInstance._original = structuredClone(clientInstance)
		}

		return clientInstance as T
	}

	async mapToClientModelParsedInstance<T extends Entity>(typeRef: TypeRef<T>, instanceEntity: T): Promise<ClientModelParsedInstance> {
		const instance = instanceEntity as Record<string, unknown>
		const clientTypeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		const parsedInstance: ClientModelParsedInstance = {} as ClientModelParsedInstance

		for (const [attrIdStr, modelValue] of Object.entries(clientTypeModel.values)) {
			const attrId = parseInt(attrIdStr)
			const clientValue = (() => {
				const jsValue: Nullable<any> = instance[modelValue.name] ?? null
				if (jsValue == null) {
					return ParsedValue.fromNull()
				}
				switch (modelValue.type) {
					case ValueTypeEnum.CustomId:
					case ValueTypeEnum.String:
					case ValueTypeEnum.CompressedString:
					case ValueTypeEnum.GeneratedId:
					case ValueTypeEnum.Number:
						return ParsedValue.fromString(jsValue as string)

					case ValueTypeEnum.Boolean:
						return ParsedValue.fromBoolean(jsValue as boolean)

					case ValueTypeEnum.Bytes:
						return ParsedValue.fromBytes(jsValue as Uint8Array)
					case ValueTypeEnum.Date:
						return ParsedValue.fromDate(jsValue as Date)
				}
			})()

			if (clientTypeModel.type === Type.Aggregated && modelValue.name === "_id" && clientValue.isNull()) {
				const randomAggregateId = base64ToBase64Url(uint8ArrayToBase64(random.generateRandomData(4)))
				parsedInstance[attrId] = ParsedValue.fromId(randomAggregateId)
			} else {
				parsedInstance[attrId] = clientValue
			}
		}

		for (const [assocIdStr, modelAssoc] of Object.entries(clientTypeModel.associations)) {
			const assocId = parseInt(assocIdStr)
			const appName = modelAssoc.dependency ?? clientTypeModel.app
			const assocTypeRef = new TypeRef<any>(appName, modelAssoc.refTypeId)

			const associationValue = (async () => {
				const jsValue: Nullable<any> = instance[modelAssoc.name] ?? null
				if (jsValue == null) {
					return ParsedValue.fromArray([])
				} else if (modelAssoc.type === AssociationType.ListAssociation || modelAssoc.type === AssociationType.ElementAssociation) {
					const ids = modelAssoc.cardinality === Cardinality.Any ? (jsValue as Array<Id>) : [jsValue as string]
					const items = ids.map((i) => ParsedValue.fromId(i))
					return ParsedValue.fromArray(items)
				} else if (modelAssoc.type === AssociationType.Aggregation) {
					const items = modelAssoc.cardinality === Cardinality.Any ? (jsValue as Array<any>) : [jsValue as any]
					const mappedItems = items.map((i) => this.mapToClientModelParsedInstance(assocTypeRef, i))
					return ParsedValue.fromAggregatedItems(await Promise.all(mappedItems))
				} else if (
					modelAssoc.type === AssociationType.BlobElementAssociation ||
					modelAssoc.type === AssociationType.ListElementAssociationCustom ||
					modelAssoc.type === AssociationType.ListElementAssociationGenerated
				) {
					const ids = modelAssoc.cardinality === Cardinality.Any ? (jsValue as Array<IdTuple>) : [jsValue as IdTuple]
					const items = ids.map((i) => ParsedValue.fromIdTuple(i))
					return ParsedValue.fromArray(items)
				} else {
					throw new ProgrammingError("All cases covered!!")
				}
			})()
			parsedInstance[assocId] = await associationValue
		}

		return parsedInstance
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
export function convertJsToServerJson(type: ValueTypeEnum, value: ParsedValue): ParsedValue {
	if (value.isNull()) {
		ParsedValue.fromNull()
	}
	switch (type) {
		case ValueTypeEnum.String:
			return ParsedValue.fromString(value.getString())
		case ValueTypeEnum.Number:
			return ParsedValue.fromString(`${value.getNumber()}`)
		case ValueTypeEnum.Date:
			return ParsedValue.fromString(value.getDate().getTime().toString())
		case ValueTypeEnum.GeneratedId:
			return ParsedValue.fromString(value.getId())
		case ValueTypeEnum.CompressedString:
			return ParsedValue.fromString(uint8ArrayToBase64(compressString(value.getString())))
		case ValueTypeEnum.Bytes:
			return ParsedValue.fromString(uint8ArrayToBase64(value.getByteArray()))
		case ValueTypeEnum.Boolean:
			return ParsedValue.fromString(value.getBoolean() ? "1" : "0")
		case ValueTypeEnum.CustomId:
			return ParsedValue.fromString(value.getId())
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
export function convertServerJsonToJsType(type: ValueTypeEnum, decryptedValue: string): ParsedValue {
	switch (type) {
		// FIXME: compare this functiont o original implementation
		case ValueTypeEnum.String:
			return ParsedValue.fromString(decryptedValue)
		case ValueTypeEnum.Number:
			return ParsedValue.fromNumber(parseInt(decryptedValue))
		case ValueTypeEnum.Bytes:
			return ParsedValue.fromBytes(base64ToUint8Array(decryptedValue))
		case ValueTypeEnum.Date:
			return ParsedValue.fromDate(new Date(parseInt(decryptedValue)))
		case ValueTypeEnum.Boolean:
			return ParsedValue.fromBoolean(decryptedValue !== "0")
		case ValueTypeEnum.GeneratedId:
			return ParsedValue.fromId(decryptedValue)
		case ValueTypeEnum.CustomId:
			return ParsedValue.fromCustomId(decryptedValue)
		case ValueTypeEnum.CompressedString:
			return ParsedValue.fromString(decompressString(base64ToUint8Array(decryptedValue)))
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

export function valueToDefault(type: ValueTypeEnum): ParsedValue {
	switch (type) {
		case ValueTypeEnum.String:
			return ParsedValue.fromString("")
		case ValueTypeEnum.CompressedString:
			return ParsedValue.fromString("")
		case ValueTypeEnum.Number:
			return ParsedValue.fromNumber(0)
		case ValueTypeEnum.Bytes:
			return ParsedValue.fromBytes(new Uint8Array(0))
		case ValueTypeEnum.Date:
			return ParsedValue.fromDate(new Date(0))
		case ValueTypeEnum.Boolean:
			return ParsedValue.fromBoolean(false)
		default:
			throw new ProgrammingError(`${type} is not a value type with a defined default`)
	}
}

// visibleForTesting
export function isDefaultValue(type: ValueTypeEnum, value: unknown): boolean {
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
