import { resolveTypeReference } from "../../common/EntityFunctions"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import type { Base64 } from "@tutao/tutanota-utils"
import {
	assertNotNull,
	base64ToBase64Url,
	base64ToUint8Array,
	downcast,
	promiseMap,
	stringToUtf8Uint8Array,
	TypeRef,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString,
} from "@tutao/tutanota-utils"
import { AssociationType, Cardinality, Type, ValueType } from "../../common/EntityConstants"
import { compress, uncompress } from "../Compression"
import type { ModelValue, TypeModel } from "../../common/EntityTypes"
import { assertWorkerOrNode } from "../../common/Env"
import { aesDecrypt, aesEncrypt, AesKey, ENABLE_MAC, IV_BYTE_LENGTH, random } from "@tutao/tutanota-crypto"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"

assertWorkerOrNode()

export class InstanceMapper {
	/**
	 * Decrypts an object literal as received from the DB and maps it to an entity class (e.g. Mail)
	 * @param model The TypeModel of the instance
	 * @param instance The object literal as received from the DB
	 * @param sk The session key, must be provided for encrypted instances
	 * @returns The decrypted and mapped instance
	 */
	decryptAndMapToInstance<T>(model: TypeModel, instance: Record<string, any>, sk: Aes128Key | null): Promise<T> {
		let decrypted: any = {
			_type: new TypeRef(model.app, model.name),
		}

		for (let key of Object.keys(model.values)) {
			let valueType = model.values[key]
			let value = instance[key]

			try {
				decrypted[key] = decryptValue(key, valueType, value, sk)
			} catch (e) {
				if (decrypted._errors == null) {
					decrypted._errors = {}
				}

				decrypted._errors[key] = JSON.stringify(e)
				console.log("error when decrypting value on type:", `[${model.app},${model.name}]`, "key:", key)
			} finally {
				if (valueType.encrypted) {
					if (valueType.final) {
						// we have to store the encrypted value to be able to restore it when updating the instance. this is not needed for data transfer types, but it does not hurt
						decrypted["_finalEncrypted_" + key] = value
					} else if (value === "") {
						// we have to store the default value to make sure that updates do not cause more storage use
						decrypted["_defaultEncrypted_" + key] = decrypted[key]
					}
				}
			}
		}

		return promiseMap(Object.keys(model.associations), (associationName) => {
			if (model.associations[associationName].type === AssociationType.Aggregation) {
				const dependency = model.associations[associationName].dependency
				return resolveTypeReference(new TypeRef(dependency || model.app, model.associations[associationName].refType)).then((aggregateTypeModel) => {
					let aggregation = model.associations[associationName]

					if (aggregation.cardinality === Cardinality.ZeroOrOne && instance[associationName] == null) {
						decrypted[associationName] = null
					} else if (instance[associationName] == null) {
						throw new ProgrammingError(`Undefined aggregation ${model.name}:${associationName}`)
					} else if (aggregation.cardinality === Cardinality.Any) {
						return promiseMap(instance[associationName], (aggregate) => {
							return this.decryptAndMapToInstance(aggregateTypeModel, downcast<Record<string, any>>(aggregate), sk)
						}).then((decryptedAggregates) => {
							decrypted[associationName] = decryptedAggregates
						})
					} else {
						return this.decryptAndMapToInstance(aggregateTypeModel, instance[associationName], sk).then((decryptedAggregate) => {
							decrypted[associationName] = decryptedAggregate
						})
					}
				})
			} else {
				decrypted[associationName] = instance[associationName]
			}
		}).then(() => {
			return decrypted
		})
	}

	encryptAndMapToLiteral<T>(model: TypeModel, instance: T, sk: Aes128Key | null): Promise<Record<string, unknown>> {
		let encrypted: Record<string, unknown> = {}
		let i = instance as any

		for (let key of Object.keys(model.values)) {
			let valueType = model.values[key]
			let value = i[key]

			// restore the original encrypted value if it exists. it does not exist if this is a data transfer type or a newly created entity. check against null explicitely because "" is allowed
			if (valueType.encrypted && valueType.final && i["_finalEncrypted_" + key] != null) {
				encrypted[key] = i["_finalEncrypted_" + key]
			} else if (valueType.encrypted && i["_defaultEncrypted_" + key] === value) {
				// restore the default encrypted value because it has not changed
				encrypted[key] = ""
			} else {
				encrypted[key] = encryptValue(key, valueType, value, sk)
			}
		}

		if (model.type === Type.Aggregated && !encrypted._id) {
			encrypted._id = base64ToBase64Url(uint8ArrayToBase64(random.generateRandomData(4)))
		}

		return promiseMap(Object.keys(model.associations), (associationName) => {
			if (model.associations[associationName].type === AssociationType.Aggregation) {
				const dependency = model.associations[associationName].dependency
				return resolveTypeReference(new TypeRef(dependency || model.app, model.associations[associationName].refType)).then((aggregateTypeModel) => {
					let aggregation = model.associations[associationName]

					if (aggregation.cardinality === Cardinality.ZeroOrOne && i[associationName] == null) {
						encrypted[associationName] = null
					} else if (i[associationName] == null) {
						throw new ProgrammingError(`Undefined attribute ${model.name}:${associationName}`)
					} else if (aggregation.cardinality === Cardinality.Any) {
						return promiseMap(i[associationName], (aggregate) => {
							return this.encryptAndMapToLiteral(aggregateTypeModel, aggregate, sk)
						}).then((encryptedAggregates) => {
							encrypted[associationName] = encryptedAggregates
						})
					} else {
						return this.encryptAndMapToLiteral(aggregateTypeModel, i[associationName], sk).then((encryptedAggregate) => {
							encrypted[associationName] = encryptedAggregate
						})
					}
				})
			} else {
				encrypted[associationName] = i[associationName]
			}
		}).then(() => {
			return encrypted
		})
	}
}

// Exported for testing
export function encryptValue(valueName: string, valueType: ModelValue, value: any, sk: Aes128Key | null): string | Base64 | null {
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

		return uint8ArrayToBase64(aesEncrypt(assertNotNull(sk), bytes, random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC))
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
			return new Date()

		case ValueType.Boolean:
			return false

		case ValueType.CompressedString:
			return ""

		default:
			throw new ProgrammingError(`${type} is not a valid value type`)
	}
}
