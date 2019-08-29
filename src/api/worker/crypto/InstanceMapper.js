// @flow

import {resolveTypeReference, TypeRef} from "../../common/EntityFunctions"
import {ProgrammingError} from "../../common/error/ProgrammingError"
import {
	base64ToBase64Url,
	base64ToUint8Array,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString
} from "../../common/utils/Encoding"
import {random} from "./Randomizer"
import {aes128Decrypt, aes128Encrypt, ENABLE_MAC, IV_BYTE_LENGTH} from "./Aes"
import {valueToDefault} from "./CryptoFacade"
import {inflate} from "pako_inflate"
import EC from "../../common/EntityConstants"
import {assertWorkerOrNode} from "../../Env"

assertWorkerOrNode()

const Type = EC.Type
const ValueType = EC.ValueType
const Cardinality = EC.Cardinality
const AssociationType = EC.AssociationType

/**
 * Decrypts an object literal as received from the DB and maps it to an entity class (e.g. Mail)
 * @param model The TypeModel of the instance
 * @param instance The object literal as received from the DB
 * @param sk The session key, must be provided for encrypted instances
 * @returns The decrypted and mapped instance
 */
export function decryptAndMapToInstance<T>(model: TypeModel, instance: Object, sk: ?Aes128Key): Promise<T> {
	let decrypted: any = {
		_type: new TypeRef(model.app, model.name)
	}
	for (let key of Object.keys(model.values)) {
		let valueType = model.values[key]
		let value = instance[valueType.name]
		try {
			decrypted[valueType.name] = decryptValue(valueType, value, sk)
		} catch (e) {
			if (decrypted._errors == null) {
				decrypted._errors = {}
			}
			decrypted._errors[valueType.name] = JSON.stringify(e)
		} finally {
			if (valueType.encrypted) {
				if (valueType.final) {
					// we have to store the encrypted value to be able to restore it when updating the instance. this is not needed for data transfer types, but it does not hurt
					decrypted["_finalEncrypted_" + valueType.name] = value
				} else if (value === "") {
					// we have to store the default value to make sure that updates do not cause more storage use
					decrypted["_defaultEncrypted_" + valueType.name] = decrypted[valueType.name]
				}
			}
		}
	}
	return Promise.map(Object.keys(model.associations), (associationName) => {
		if (model.associations[associationName].type === AssociationType.Aggregation) {
			return resolveTypeReference(new TypeRef(model.app, model.associations[associationName].refType))
				.then((aggregateTypeModel) => {
					let aggregation = model.associations[associationName]
					if (aggregation.cardinality === Cardinality.ZeroOrOne && instance[associationName] == null) {
						decrypted[associationName] = null
					} else if (instance[associationName] == null) {
						throw new ProgrammingError(`Undefined aggregation ${model.name}:${associationName}`)
					} else if (aggregation.cardinality === Cardinality.Any) {
						return Promise.map(instance[associationName], (aggregate) => {
							return decryptAndMapToInstance(aggregateTypeModel, aggregate, sk)
						}).then((decryptedAggregates) => {
							decrypted[associationName] = decryptedAggregates
						})
					} else {
						return decryptAndMapToInstance(aggregateTypeModel, instance[associationName], sk)
							.then((decryptedAggregate) => {
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

export function encryptAndMapToLiteral<T>(model: TypeModel, instance: T, sk: ?Aes128Key): Object {
	let encrypted = {}
	let i = (instance: any)

	for (let key of Object.keys(model.values)) {
		let valueType = model.values[key]
		let value = i[valueType.name]
		// restore the original encrypted value if it exists. it does not exist if this is a data transfer type or a newly created entity. check against null explicitely because "" is allowed
		if (valueType.encrypted && valueType.final && i["_finalEncrypted_" + valueType.name] != null) {
			encrypted[valueType.name] = i["_finalEncrypted_" + valueType.name]
		} else if (valueType.encrypted && i["_defaultEncrypted_" + valueType.name] === value) {
			// restore the default encrypted value because it has not changed
			encrypted[valueType.name] = ""
		} else {
			encrypted[valueType.name] = encryptValue(valueType, value, sk)
		}
	}
	if (model.type === Type.Aggregated && !encrypted._id) {
		encrypted._id = base64ToBase64Url(uint8ArrayToBase64(random.generateRandomData(4)))
	}
	return Promise.map(Object.keys(model.associations), (associationName) => {
		if (model.associations[associationName].type === AssociationType.Aggregation) {
			return resolveTypeReference(new TypeRef(model.app, model.associations[associationName].refType))
				.then((aggregateTypeModel) => {
					let aggregation = model.associations[associationName]
					if (aggregation.cardinality === Cardinality.ZeroOrOne && i[associationName] == null) {
						encrypted[associationName] = null
					} else if (i[associationName] == null) {
						throw new ProgrammingError(`Undefined attribute ${model.name}:${associationName}`)
					} else if (aggregation.cardinality === Cardinality.Any) {
						return Promise.map(i[associationName], (aggregate) => {
							return encryptAndMapToLiteral(aggregateTypeModel, aggregate, sk)
						}).then((encryptedAggregates) => {
							encrypted[associationName] = encryptedAggregates
						})
					} else {
						return encryptAndMapToLiteral(aggregateTypeModel, i[associationName], sk)
							.then((encryptedAggregate) => {
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

export function encryptValue(valueType: ModelValue, value: any, sk: ?Aes128Key): any {
	if (value == null && valueType.name !== '_id' && valueType.name !== '_permissions') {
		if (valueType.cardinality === Cardinality.ZeroOrOne) {
			return null
		} else {
			throw new ProgrammingError(`Value ${valueType.name} with cardinality ONE can not be null`)
		}
	} else if (valueType.encrypted) {
		let bytes = value
		if (valueType.type !== ValueType.Bytes) {
			bytes = stringToUtf8Uint8Array(convertJsToDbType(valueType.type, value))
		}
		return uint8ArrayToBase64(aes128Encrypt((sk: any), bytes, random.generateRandomData(IV_BYTE_LENGTH), true,
			ENABLE_MAC))
	} else {
		return convertJsToDbType(valueType.type, value)
	}
}

export function decryptValue(valueType: ModelValue, value: ?Base64 | string, sk: ?Aes128Key): any {
	if (value == null) {
		if (valueType.cardinality === Cardinality.ZeroOrOne) {
			return null
		} else {
			throw new ProgrammingError(`Value ${valueType.name} with cardinality ONE can not be null`)
		}
	} else if (valueType.cardinality === Cardinality.One && value === "") {
		return valueToDefault(valueType.type) // Migration for values added after the Type has been defined initially
	} else if (valueType.encrypted) {
		let decryptedBytes = aes128Decrypt((sk: any), base64ToUint8Array((value: any)))
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

export function convertJsToDbType(type: ValueType, value: any): Base64 | string {
	if (type === ValueType.Bytes && value != null) {
		return uint8ArrayToBase64((value: any))
	} else if (type === ValueType.Boolean) {
		return value ? '1' : '0'
	} else if (type === ValueType.Date) {
		return value.getTime().toString()
	} else if (type === ValueType.CompressedString) {
		throw new ProgrammingError("Compression is not implemented yet")
	} else {
		return value
	}
}

export function convertDbToJsType(type: ValueType, value: Base64 | string): any {
	if (type === ValueType.Bytes) {
		return base64ToUint8Array((value: any))
	} else if (type === ValueType.Boolean) {
		return value !== '0'
	} else if (type === ValueType.Date) {
		return new Date(parseInt(value))
	} else if (type === ValueType.CompressedString) {
		return decompressString(base64ToUint8Array(value))
	} else {
		return value
	}
}

function decompressString(compressed: Uint8Array): string {
	if (compressed.length === 0) {
		return ""
	}
	const uncompressedBytes = inflate(compressed)
	return utf8Uint8ArrayToString(uncompressedBytes)
}


export function encryptBytes(sk: Aes128Key, value: Uint8Array): Uint8Array {
	return aes128Encrypt(sk, value, random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)
}

export function encryptString(sk: Aes128Key, value: string): Uint8Array {
	return aes128Encrypt(sk, stringToUtf8Uint8Array(value), random.generateRandomData(IV_BYTE_LENGTH), true, ENABLE_MAC)
}
