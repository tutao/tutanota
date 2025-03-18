import { EncryptedParsedAssociation, EncryptedParsedInstance, ModelValue, ParsedInstance, ParsedValue, TypeModel } from "../../common/EntityTypes"
import {
	Base64,
	base64ToBase64Url,
	base64ToUint8Array,
	stringToUtf8Uint8Array,
	TypeRef,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString,
} from "@tutao/tutanota-utils"
import { AssociationType, Cardinality, Type, ValueType } from "../../common/EntityConstants"
import { resolveTypeReference } from "../../common/EntityFunctions"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { aesDecrypt, aesEncrypt, AesKey, ENABLE_MAC, IV_BYTE_LENGTH, random } from "@tutao/tutanota-crypto"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import { convertDbToJsType, convertJsToDbType, decompressString, valueToDefault } from "./InstanceMapper"

// Exported for testing
export function encryptValue(
	valueType: ModelValue & { encrypted: true },
	value: Nullable<ParsedValue>,
	sk: AesKey,
	iv: Uint8Array = random.generateRandomData(IV_BYTE_LENGTH),
): Nullable<Base64> {
	if (value == null) {
		return null
	} else {
		const dbValue = convertJsToDbType(valueType.type, value)!
		const bytes = typeof dbValue === "string" ? stringToUtf8Uint8Array(dbValue) : dbValue
		return uint8ArrayToBase64(aesEncrypt(sk, bytes, iv, true, ENABLE_MAC))
	}
}

// Exported for testing
export function decryptValue(valueType: ModelValue & { encrypted: true }, value: Nullable<Base64>, sk: AesKey): Nullable<ParsedValue> {
	if (value == null) {
		return null
	} else if (valueType.cardinality === Cardinality.One && value === "") {
		// Migration for values added after the Type has been defined initially
		return valueToDefault(valueType.type)
	} else {
		let decryptedBytes = aesDecrypt(sk, base64ToUint8Array(value))

		if (valueType.type === ValueType.Bytes) {
			return decryptedBytes
		} else if (valueType.type === ValueType.CompressedString) {
			return decompressString(decryptedBytes)
		} else {
			return convertDbToJsType(valueType.type, utf8Uint8ArrayToString(decryptedBytes))
		}
	}
}

export class InstanceCryptoMapper {
	public async decryptParsedInstance(typeModel: TypeModel, encryptedInstance: EncryptedParsedInstance, sk: Nullable<AesKey>): Promise<ParsedInstance> {
		const decrypted: ParsedInstance = {
			_finalEncryptedValues: {},
			_defaultEncryptedValues: {},
		}
		for (const [valueIdStr, valueInfo] of Object.entries(typeModel.values)) {
			const valueId = parseInt(valueIdStr)
			const valueName = valueInfo.name
			const encryptedValue = encryptedInstance[valueId]

			try {
				if (!valueInfo.encrypted) {
					decrypted[valueId] = encryptedValue
				} else if (sk != null) {
					const encryptedValueInfo = valueInfo as ModelValue & { encrypted: true }
					const encryptedString = encryptedValue as Base64
					decrypted[valueId] = decryptValue(encryptedValueInfo, encryptedString, sk)
				} else {
					throw new CryptoError("session key is null, but value is encrypted. valueName: " + valueName + " valueType: " + valueInfo)
				}
			} catch (e) {
				if (decrypted._errors == null) {
					decrypted._errors = {}
				}

				decrypted._errors[valueId] = JSON.stringify(e)
				console.log("error when decrypting value on type:", `[${typeModel.app},${typeModel.name}]`, "valueName:", valueName, e)
			} finally {
				if (valueInfo.encrypted) {
					if (valueInfo.final) {
						// we have to store the encrypted value to be able to restore it when updating the instance.
						// this is not needed for data transfer types, but it does not hurt
						decrypted._finalEncryptedValues[valueId] = encryptedValue
					} else if (encryptedValue === "") {
						// the encrypted value is "" if the decrypted value is the default value
						// we store the default value to make sure that updates do not cause more storage use
						// check out encrypt() to see the other side of this.
						decrypted._defaultEncryptedValues[valueId] = decrypted[valueId]
					}
				}
			}
		}

		for (const associationId of Object.keys(typeModel.associations).map(Number)) {
			let associationType = typeModel.associations[associationId]
			const encryptedInstanceValue = encryptedInstance[associationId] as EncryptedParsedAssociation
			if (associationType.type === AssociationType.Aggregation) {
				const appName = associationType.dependency ?? typeModel.app
				const associationTypeModel = await resolveTypeReference(new TypeRef(appName, associationType.refTypeId))
				decrypted[associationId] = await this.decryptAggregateAssociation(
					associationTypeModel,
					encryptedInstanceValue as Array<EncryptedParsedInstance>,
					sk,
				)
			} else {
				decrypted[associationId] = encryptedInstanceValue
			}
		}
		return decrypted
	}

	private async decryptAggregateAssociation(
		associationModel: TypeModel,
		encryptedInstanceValues: Array<EncryptedParsedInstance>,
		sk: Nullable<AesKey>,
	): Promise<Array<ParsedInstance>> {
		const decryptedAggregates: Array<ParsedInstance> = []
		for (const encryptedAggregate of encryptedInstanceValues) {
			const decryptedAggregate = await this.decryptParsedInstance(associationModel, encryptedAggregate, sk)
			decryptedAggregates.push(decryptedAggregate)
		}
		return decryptedAggregates
	}

	public async encryptParsedInstance(typeModel: TypeModel, parsedInstance: ParsedInstance, sk: Nullable<AesKey>): Promise<EncryptedParsedInstance> {
		let encrypted: EncryptedParsedInstance = {}
		const finalEncryptedValues = parsedInstance._finalEncryptedValues
		const defaultEncryptedValues = parsedInstance._defaultEncryptedValues

		for (let valueId of Object.keys(typeModel.values).map(Number)) {
			let valueType = typeModel.values[valueId]
			let valueName = valueType.name
			let value = parsedInstance[valueId] as Nullable<ParsedValue>

			let encryptedValue
			if (!valueType.encrypted) {
				encryptedValue = value
			} else if (valueType.final && finalEncryptedValues[valueId] != null) {
				// restore the original encrypted value if it exists. it does not exist if this is a data transfer type or a newly created entity. check against null explicitly because "" is allowed
				encryptedValue = finalEncryptedValues[valueId]
			} else if (defaultEncryptedValues[valueId] === value) {
				// restore the default encrypted value because it has not changed.
				// this saves storage and mor importantly prevents us from throwing out-of-storage errors for updates that
				// should not increase the size of the instance.
				encryptedValue = ""
			} else if (sk != null) {
				encryptedValue = encryptValue(valueType as ModelValue & { encrypted: true }, value, sk)
			} else {
				throw new ProgrammingError(`Encrypting ${typeModel.app}/${typeModel.name}.${valueName} requires a session key!`)
			}

			if (typeModel.type === Type.Aggregated && valueName === "_id" && encryptedValue == null) {
				encrypted[valueId] = base64ToBase64Url(uint8ArrayToBase64(random.generateRandomData(4)))
			} else {
				encrypted[valueId] = encryptedValue
			}
		}

		for (const associationId of Object.keys(typeModel.associations).map(Number)) {
			const associationType = typeModel.associations[associationId]
			if (associationType.type === AssociationType.Aggregation) {
				const appName = associationType.dependency ?? typeModel.app
				const aggregateTypeModel = await resolveTypeReference(new TypeRef(appName, associationType.refTypeId))
				const aggregate = parsedInstance[associationId] as Array<ParsedInstance>
				encrypted[associationId] = await this.encryptAggregateAssociation(aggregateTypeModel, aggregate, sk)
			} else {
				encrypted[associationId] = parsedInstance[associationId]
			}
		}
		return encrypted
	}

	private async encryptAggregateAssociation(
		associationTypeModel: TypeModel,
		aggregateValues: Array<ParsedInstance>,
		sk: Nullable<AesKey>,
	): Promise<Array<EncryptedParsedInstance>> {
		let encryptedAggregates = []
		for (const aggregate of aggregateValues) {
			encryptedAggregates.push(await this.encryptParsedInstance(associationTypeModel, aggregate, sk))
		}

		return encryptedAggregates
	}
}
