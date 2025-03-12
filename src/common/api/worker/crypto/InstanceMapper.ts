import { getAttributeId, resolveTypeReference } from "../../common/EntityFunctions"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import {
	assertNotNull,
	Base64,
	base64ToBase64Url,
	base64ToUint8Array,
	downcast,
	promiseMap,
	stringToUtf8Uint8Array,
	TypeRef,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString,
} from "@tutao/tutanota-utils"
import { AssociationType, Cardinality, Type, ValueType } from "../../common/EntityConstants.js"
import { compress, uncompress } from "../Compression"
import { Entity, ModelValue, SomeEntity, TypeModel } from "../../common/EntityTypes"
import { assertWorkerOrNode } from "../../common/Env"
import { aesDecrypt, aesEncrypt, AesKey, ENABLE_MAC, IV_BYTE_LENGTH, random } from "@tutao/tutanota-crypto"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"

assertWorkerOrNode()

export class InstanceMapper {
	/**
	 * Decrypts an object literal as received from the DB and maps it to an entity class (e.g. Mail)
	 * @param typeModel The TypeModel of the instance
	 * @param encryptedInstance The object literal as received from the DB
	 * @param sk The session key, must be provided for instance instances
	 * @returns The decrypted and mapped instance
	 */
	decryptAndMapToInstance<T>(typeModel: TypeModel, encryptedInstance: Record<number, any>, sk: AesKey | null): Promise<T> {
		let decrypted: Record<string, any> = {
			_type: new TypeRef(typeModel.app, typeModel.id),
		}

		for (const [valueIdStr, valueInfo] of Object.entries(typeModel.values)) {
			const valueId = parseInt(valueIdStr)
			const valueName = valueInfo.name
			const value = encryptedInstance[valueId]

			try {
				decrypted[valueName] = decryptValue(valueName, valueInfo, value, sk)
			} catch (e) {
				if (decrypted._errors == null) {
					decrypted._errors = {}
				}

				decrypted._errors[valueName] = JSON.stringify(e)
				console.log("error when decrypting value on type:", `[${typeModel.app},${typeModel.name}]`, "valueName:", valueName, e)
			} finally {
				if (valueInfo.encrypted) {
					if (valueInfo.final) {
						// we have to store the encrypted value to be able to restore it when updating the instance. this is not needed for data transfer types, but it does not hurt
						decrypted["_finalEncrypted_" + valueName] = value
					} else if (value === "") {
						// we have to store the default value to make sure that updates do not cause more storage use
						decrypted["_defaultEncrypted_" + valueName] = decrypted[valueName]
					}
				}
			}
		}

		return promiseMap(Object.keys(typeModel.associations).map(Number), async (associationId: number) => {
			let associationType = typeModel.associations[associationId]
			let associationName = associationType.name

			if (associationType.type === AssociationType.Aggregation) {
				const dependency = associationType.dependency
				const aggregateTypeModel = await resolveTypeReference(new TypeRef(dependency || typeModel.app, associationType.refTypeId))
				let aggregationType = associationType

				if (aggregationType.cardinality === Cardinality.ZeroOrOne && encryptedInstance[associationId] == null) {
					decrypted[associationName] = null
				} else if (encryptedInstance[associationId] == null) {
					throw new ProgrammingError(`Undefined aggregation ${typeModel.name}:${associationName}`)
				} else if (aggregationType.cardinality === Cardinality.Any) {
					return promiseMap(encryptedInstance[associationId], (aggregate) => {
						return this.decryptAndMapToInstance(aggregateTypeModel, downcast<Record<string, any>>(aggregate), sk)
					}).then((decryptedAggregates) => {
						decrypted[associationName] = decryptedAggregates
					})
				} else {
					return this.decryptAndMapToInstance(aggregateTypeModel, encryptedInstance[associationId], sk).then((decryptedAggregate) => {
						decrypted[associationName] = decryptedAggregate
					})
				}
			} else {
				decrypted[associationName] = encryptedInstance[associationId]
			}
		}).then(() => {
			return decrypted as T
		})
	}

	/// Since entity have fieldName, CBORG will just use fieldName while serializing,
	/// we should create a new object that map fieldName to filedId before putting it
	/// into storage
	// object 1: { field1: value1, field2: value2 }
	// object 2: Map  { "field1Id" -> "value1", "field2" -> "value2" }
	async mapToLiteral<T extends Entity>(instance: T, typeRef: TypeRef<T>): Promise<Record<number, any>> {
		const typemodel = await resolveTypeReference(typeRef)

		let result: Record<number, any> = {}
		for (const [fieldName, attributeValue] of Object.entries(instance)) {
			if (fieldName === "_type" || fieldName === "_errors") {
				continue
			}
			const attributeId = await getAttributeId(typeRef, fieldName)
			if (!attributeId) {
				throw new Error("could not find attributeid for value " + fieldName + " and type: " + typeRef.app + "::" + typemodel.name)
			}

			const association = typemodel.associations[attributeId]
			if (association && association.type === AssociationType.Aggregation) {
				const aggregationTypeRef = new TypeRef<SomeEntity>(association.dependency ?? typeRef.app, association.refTypeId)

				switch (association.cardinality) {
					case Cardinality.ZeroOrOne: {
						result[attributeId] = attributeValue ? await this.mapToLiteral(assertNotNull(attributeValue), aggregationTypeRef) : null
						break
					}
					case Cardinality.Any: {
						const agg = assertNotNull(attributeValue) as Array<any>
						result[attributeId] = await promiseMap(agg, (e) => {
							return this.mapToLiteral(e, aggregationTypeRef)
						})
						break
					}
					case Cardinality.One: {
						result[attributeId] = await this.mapToLiteral(assertNotNull(attributeValue), aggregationTypeRef)
						break
					}
				}
			} else {
				result[attributeId] = attributeValue
			}
		}
		return result
	}

	async mapFromLiteral(instance: Record<number, any>, typeModel: TypeModel): Promise<Record<string, unknown>> {
		let nameMappedAttribute: Record<string, unknown> = {
			_type: new TypeRef(typeModel.app, typeModel.id),
		}

		for (const [attributeIdStr, attributeValue] of Object.entries(instance)) {
			const attributeId = parseInt(attributeIdStr)
			const vAttribute = typeModel.values[attributeId]
			const aAttribute = typeModel.associations[attributeId]

			if (aAttribute && aAttribute.type === AssociationType.Aggregation) {
				switch (aAttribute.cardinality) {
					case Cardinality.ZeroOrOne: {
						const refTypeModel = await resolveTypeReference(new TypeRef(aAttribute.dependency || typeModel.app, aAttribute.refTypeId))
						nameMappedAttribute[aAttribute.name] = attributeValue ? await this.mapFromLiteral(attributeValue, refTypeModel) : null
						break
					}
					case Cardinality.Any: {
						const refTypeModel = await resolveTypeReference(new TypeRef(aAttribute.dependency || typeModel.app, aAttribute.refTypeId))
						const agg = assertNotNull(attributeValue) as Array<Record<string, any>>
						nameMappedAttribute[aAttribute.name] = await promiseMap(agg, (e) => this.mapFromLiteral(e, refTypeModel))
						break
					}
					case Cardinality.One: {
						const refTypeModel = await resolveTypeReference(new TypeRef(aAttribute.dependency || typeModel.app, aAttribute.refTypeId))
						nameMappedAttribute[aAttribute.name] = await this.mapFromLiteral(assertNotNull(attributeValue), refTypeModel)
						break
					}
				}
			} else if (aAttribute) {
				nameMappedAttribute[aAttribute.name] = attributeValue
			} else if (vAttribute) {
				const valueType = typeModel.values[attributeId].type
				switch (vAttribute.cardinality) {
					case Cardinality.ZeroOrOne:
						nameMappedAttribute[vAttribute.name] = attributeValue ? convertDbToJsType(valueType, attributeValue) : null
						break
					case Cardinality.One:
						console.log(`${typeModel.name}::${vAttribute.name}`)
						nameMappedAttribute[vAttribute.name] = convertDbToJsType(valueType, assertNotNull(attributeValue))
						break
					case Cardinality.Any:
						nameMappedAttribute[vAttribute.name] = await promiseMap(attributeValue, (v: string | Base64) => convertDbToJsType(valueType, v))
						break
				}
			} else {
				// something new we dont know yet
			}
		}
		return nameMappedAttribute
	}

	// FIXME: now we have following pattern in bunch of places:
	// 1) mapToLiteral(instance)
	// 2) -- do something with mapped literal
	// 3) get sessionKey
	// 4) encryptAndMapToLiteral(instance, sessionKey)
	// does it make sense to make this function take instanceLietral instead of instance ?
	// if so, we can just call .mapToLiteral for all unencrypted type and make sk non-nullable here
	encryptAndMapToLiteral<T>(typeModel: TypeModel, instance: T, sk: AesKey | null): Promise<Record<number, unknown>> {
		let decrypted = instance as any
		let encrypted: Record<string, unknown> = {}

		if (typeModel.encrypted && sk == null) {
			throw new ProgrammingError(`Encrypting ${typeModel.app}/${typeModel.name} requires a session key!`)
		}

		for (let valueId of Object.keys(typeModel.values).map(Number)) {
			let valueType = typeModel.values[valueId]
			let valueName = valueType.name
			let value = decrypted[valueName]

			let encryptedValue
			// restore the original encrypted value if it exists. it does not exist if this is a data transfer type or a newly created entity. check against null explicitly because "" is allowed
			if (valueType.encrypted && valueType.final && decrypted["_finalEncrypted_" + valueName] != null) {
				encryptedValue = decrypted["_finalEncrypted_" + valueName]
			} else if (
				valueType.encrypted &&
				(decrypted["_finalIvs"]?.[valueName] as Uint8Array | null)?.length === 0 &&
				isDefaultValue(valueType.type, value)
			) {
				// restore the default encrypted value because it has not changed
				// note: this brunch must be checked *before* the one which reuses IVs as this one checks
				// the length.
				encryptedValue = ""
			} else if (valueType.encrypted && valueType.final && decrypted["_finalIvs"]?.[valueName] != null) {
				const finalIv = decrypted["_finalIvs"][valueName]
				encryptedValue = encryptValue(valueName, valueType, value, sk, finalIv)
			} else if (valueType.encrypted && decrypted["_defaultEncrypted_" + valueName] === value) {
				// restore the default encrypted value because it has not changed
				encryptedValue = ""
			} else {
				encryptedValue = encryptValue(valueName, valueType, value, sk)
			}

			if (typeModel.type === Type.Aggregated && valueName === "_id" && !encryptedValue) {
				encrypted[valueId] = base64ToBase64Url(uint8ArrayToBase64(random.generateRandomData(4)))
			} else {
				encrypted[valueId] = encryptedValue
			}
		}

		return promiseMap(Object.keys(typeModel.associations).map(Number), async (associationId) => {
			let associationType = typeModel.associations[associationId]
			let associationName = associationType.name

			if (associationType.type === AssociationType.Aggregation) {
				const dependency = associationType.dependency
				const aggregateTypeModel = await resolveTypeReference(new TypeRef(dependency || typeModel.app, associationType.refTypeId))
				let aggregationType = associationType
				if (aggregationType.cardinality === Cardinality.ZeroOrOne && decrypted[associationName] == null) {
					encrypted[associationId] = null
				} else if (decrypted[associationName] == null) {
					throw new ProgrammingError(`Undefined attribute ${typeModel.name}:${associationName}`)
				} else if (aggregationType.cardinality === Cardinality.Any) {
					return promiseMap(decrypted[associationName], (aggregate) => {
						return this.encryptAndMapToLiteral(aggregateTypeModel, aggregate, sk)
					}).then((encryptedAggregates) => {
						encrypted[associationId] = encryptedAggregates
					})
				} else {
					return this.encryptAndMapToLiteral(aggregateTypeModel, decrypted[associationName], sk).then((encryptedAggregate) => {
						encrypted[associationId] = encryptedAggregate
					})
				}
			} else {
				encrypted[associationId] = decrypted[associationName]
			}
		}).then(() => {
			return encrypted
		})
	}
}

// Exported for testing
export function encryptValue(
	valueName: string,
	valueType: ModelValue,
	value: any,
	sk: AesKey | null,
	iv: Uint8Array = random.generateRandomData(IV_BYTE_LENGTH),
): string | Base64 | null {
	if (valueName === "_id" || valueName === "_permissions") {
		return value
	} else if (value == null) {
		if (valueType.cardinality === Cardinality.ZeroOrOne) {
			return null
		} else {
			throw new ProgrammingError(`Value ${valueName} with cardinality ONE can not be null`)
		}
	} else if (valueType.encrypted) {
		let bytes = value

		if (valueType.type !== ValueType.Bytes) {
			const dbType = assertNotNull(convertJsToDbType(valueType.type, value))
			bytes = typeof dbType === "string" ? stringToUtf8Uint8Array(dbType) : dbType
		}

		return uint8ArrayToBase64(aesEncrypt(assertNotNull(sk), bytes, iv, true, ENABLE_MAC))
	} else {
		const dbType = convertJsToDbType(valueType.type, value)

		if (typeof dbType === "string") {
			return dbType
		} else {
			return uint8ArrayToBase64(dbType)
		}
	}
}

// Exported for testing
export function decryptValue(valueName: string, valueType: ModelValue, value: (Base64 | null) | string, sk: AesKey | null): any {
	if (value == null) {
		if (valueType.cardinality === Cardinality.ZeroOrOne) {
			return null
		} else {
			throw new ProgrammingError(`Value ${valueName} with cardinality ONE can not be null`)
		}
	} else if (valueType.cardinality === Cardinality.One && value === "") {
		return valueToDefault(valueType.type) // Migration for values added after the Type has been defined initially
	} else if (valueType.encrypted) {
		if (sk == null) {
			throw new CryptoError("session key is null, but value is encrypted. valueName: " + valueName + " valueType: " + valueType)
		}
		let decryptedBytes = aesDecrypt(sk, base64ToUint8Array(value))

		if (valueType.type === ValueType.Bytes) {
			return decryptedBytes
		} else if (valueType.type === ValueType.CompressedString) {
			return decompressString(decryptedBytes)
		} else {
			return convertDbToJsType(valueType.type, utf8Uint8ArrayToString(decryptedBytes))
		}
	} else {
		return convertDbToJsType(valueType.type, value)
	}
}

/**
 * Returns bytes when the type === Bytes or type === CompressedString, otherwise returns a string
 * @param type
 * @param value
 * @returns {string|string|NodeJS.Global.Uint8Array|*}
 */
function convertJsToDbType(type: Values<typeof ValueType>, value: any): Uint8Array | string {
	if (type === ValueType.Bytes && value != null) {
		return value
	} else if (type === ValueType.Boolean) {
		return value ? "1" : "0"
	} else if (type === ValueType.Date) {
		return value.getTime().toString()
	} else if (type === ValueType.CompressedString) {
		return compressString(value)
	} else {
		return value
	}
}

function convertDbToJsType(type: Values<typeof ValueType>, value: Base64 | string): any {
	if (type === ValueType.Bytes) {
		return base64ToUint8Array(value as any)
	} else if (type === ValueType.Boolean) {
		return value !== "0"
	} else if (type === ValueType.Date) {
		return new Date(parseInt(value))
	} else if (type === ValueType.CompressedString) {
		return decompressString(base64ToUint8Array(value))
	} else {
		return value
	}
}

function compressString(uncompressed: string): Uint8Array {
	return compress(stringToUtf8Uint8Array(uncompressed))
}

function decompressString(compressed: Uint8Array): string {
	if (compressed.length === 0) {
		return ""
	}

	const output = uncompress(compressed)
	return utf8Uint8ArrayToString(output)
}

function valueToDefault(type: Values<typeof ValueType>): Date | Uint8Array | string | boolean {
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

function isDefaultValue(type: Values<typeof ValueType>, value: unknown): boolean {
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
