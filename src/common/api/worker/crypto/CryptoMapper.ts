import {
	ClientModelEncryptedParsedInstance,
	ClientModelParsedInstance,
	ModelValue,
	ParsedValue,
	ServerModelEncryptedParsedInstance,
	ServerModelParsedInstance,
	TypeModel,
} from "../../common/EntityTypes"
import { Base64, base64ToUint8Array, stringToUtf8Uint8Array, TypeRef, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { AssociationType, Cardinality, ValueType } from "../../common/EntityConstants"
import { TypeReferenceResolver } from "../../common/EntityFunctions"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { aesDecrypt, aesEncrypt, AesKey, ENABLE_MAC, extractIvFromCipherText, IV_BYTE_LENGTH, random } from "@tutao/tutanota-crypto"
import { convertDbToJsType, convertJsToDbType, decompressString, isDefaultValue, valueToDefault } from "./ModelMapper"

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
		const encryptedBytes = aesEncrypt(sk, bytes, iv, true, ENABLE_MAC)
		return uint8ArrayToBase64(encryptedBytes)
	}
}

// Exported for testing
export function decryptValue(
	valueType: ModelValue & {
		encrypted: true
	},
	value: Nullable<Base64>,
	sk: AesKey,
): Nullable<ParsedValue> {
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

export class CryptoMapper {
	constructor(private readonly clientTypeModel: TypeReferenceResolver, private readonly serverTypeModel: TypeReferenceResolver) {}

	public async decryptParsedInstance(
		typeModel: TypeModel,
		encryptedInstance: ServerModelEncryptedParsedInstance,
		sk: Nullable<AesKey>,
	): Promise<ServerModelParsedInstance> {
		const decrypted: ServerModelParsedInstance = {
			_finalIvs: {},
		} as ServerModelParsedInstance
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
					throw new CryptoError("session key is null, but value is encrypted. valueName: " + valueName + " valueType: " + JSON.stringify(valueInfo))
				}
				if (valueInfo.encrypted) {
					if (encryptedValue === "") {
						// the encrypted value is "" if the decrypted value is the default value
						// storing this marker lets us restore that empty string when we re-encrypt the instance.
						// check out encrypt() to see the other side of this.
						decrypted._finalIvs[valueId] = null
					} else if (valueInfo.final && encryptedValue) {
						// the server needs to be able to check if an encrypted final field changed.
						// that's only possible if we re-encrypt using a deterministic IV, because the ciphertext changes if
						// the IV or the value changes.
						// storing the IV we used for the initial encryption lets us reuse it later.
						decrypted._finalIvs[valueId] = extractIvFromCipherText(encryptedValue as Base64)
					}
				}
			} catch (e) {
				if (decrypted._errors == null) {
					decrypted._errors = {}
				}
				decrypted[valueId] = valueToDefault(valueInfo.type)

				decrypted._errors[valueId] = JSON.stringify(e)
				console.log("error when decrypting value on type:", `[${typeModel.app},${typeModel.name}]`, "valueName:", valueName, e)
			}
		}

		for (const associationId of Object.keys(typeModel.associations).map(Number)) {
			let associationType = typeModel.associations[associationId]
			const encryptedInstanceValue = encryptedInstance[associationId]
			if (associationType.type === AssociationType.Aggregation) {
				const appName = associationType.dependency ?? typeModel.app
				const associationTypeModel = await this.serverTypeModel(new TypeRef(appName, associationType.refTypeId))
				decrypted[associationId] = await this.decryptAggregateAssociation(
					associationTypeModel,
					encryptedInstanceValue as Array<ServerModelEncryptedParsedInstance>,
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
		encryptedInstanceValues: Array<ServerModelEncryptedParsedInstance>,
		sk: Nullable<AesKey>,
	): Promise<Array<ServerModelParsedInstance>> {
		const decryptedAggregates: Array<ServerModelParsedInstance> = []
		for (const encryptedAggregate of encryptedInstanceValues) {
			const decryptedAggregate = await this.decryptParsedInstance(associationModel, encryptedAggregate, sk)
			decryptedAggregates.push(decryptedAggregate)
		}
		return decryptedAggregates
	}

	public async encryptParsedInstance(
		typeModel: TypeModel,
		parsedInstance: ClientModelParsedInstance,
		sk: Nullable<AesKey>,
	): Promise<ClientModelEncryptedParsedInstance> {
		let encrypted: ClientModelEncryptedParsedInstance = {} as ClientModelEncryptedParsedInstance
		const finalIvs = parsedInstance._finalIvs

		for (let valueId of Object.keys(typeModel.values).map(Number)) {
			let valueType = typeModel.values[valueId]
			let valueName = valueType.name
			let value = parsedInstance[valueId] as Nullable<ParsedValue>

			let encryptedValue
			if (!valueType.encrypted) {
				encryptedValue = value
			} else if (finalIvs[valueId] === null && isDefaultValue(valueType.type, value)) {
				// restore the default encrypted value because it has not changed.
				// this saves storage and more importantly prevents us from throwing out-of-storage errors for updates that
				// should not increase the size of the instance.
				encryptedValue = ""
			} else if (sk != null) {
				// the value is actually Uint8Array | null | undefined. null means we need to check that the default value wasn't changed,
				// which happened above - so it's okay to roll null into undefined.
				const iv = finalIvs[valueId] ?? undefined
				encryptedValue = encryptValue(valueType as ModelValue & { encrypted: true }, value, sk, iv)
			} else {
				throw new CryptoError(`Encrypting ${typeModel.app}/${typeModel.name}.${valueName} requires a session key!`)
			}

			encrypted[valueId] = encryptedValue
		}

		for (const associationId of Object.keys(typeModel.associations).map(Number)) {
			const associationType = typeModel.associations[associationId]
			if (associationType.type === AssociationType.Aggregation) {
				const appName = associationType.dependency ?? typeModel.app
				const aggregateTypeModel = await this.clientTypeModel(new TypeRef(appName, associationType.refTypeId))
				const aggregate = parsedInstance[associationId] as Array<ClientModelParsedInstance>
				encrypted[associationId] = await this.encryptAggregateAssociation(aggregateTypeModel, aggregate, sk)
			} else {
				encrypted[associationId] = parsedInstance[associationId]
			}
		}
		return encrypted
	}

	private async encryptAggregateAssociation(
		associationTypeModel: TypeModel,
		aggregateValues: Array<ClientModelParsedInstance>,
		sk: Nullable<AesKey>,
	): Promise<Array<ClientModelEncryptedParsedInstance>> {
		let encryptedAggregates: Array<ClientModelEncryptedParsedInstance> = []
		for (const aggregate of aggregateValues) {
			encryptedAggregates.push(await this.encryptParsedInstance(associationTypeModel, aggregate, sk))
		}

		return encryptedAggregates
	}
}
