import {
	AssociationType,
	AttributeModel,
	Cardinality,
	ClientModelEncryptedParsedInstance,
	ClientModelParsedInstance,
	ClientTypeModel,
	ClientTypeReferenceResolver,
	hasError,
	ModelValue,
	ParsedValue,
	ServerModelEncryptedParsedInstance,
	ServerModelParsedInstance,
	ServerTypeModel,
	ServerTypeReferenceResolver,
	ValueType,
} from "@tutao/typerefs"
import {
	Base64,
	base64ToUint8Array,
	KeyVersion,
	lazy,
	Nullable,
	stringToUtf8Uint8Array,
	TypeRef,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString,
} from "@tutao/utils"
import { CryptoError, SessionKeyNotFoundError } from "@tutao/crypto/error"
import { aesEncrypt, AesKey, InstanceDecryptor, MissingSessionKey, SymmetricCipherFacade, VersionedKey } from "@tutao/crypto"
import { convertDbToJsType, convertJsToDbType, decompressString, ModelMapper, valueToDefault } from "./ModelMapper.js"
import { isWebClient, ProgrammingError } from "@tutao/app-env"
import { EntityAdapter } from "./EntityAdapter.js"

export interface SymmetricGroupKeyLoader {
	loadSymGroupKey(groupId: Id, requestedVersion: KeyVersion, currentGroupKey?: VersionedKey): Promise<AesKey>
}

// Exported for testing
export function encryptValue(
	valueType: ModelValue & {
		encrypted: true
	},
	value: Nullable<ParsedValue>,
	sk: AesKey,
): Nullable<Base64> {
	if (value == null) {
		return null
	} else {
		const dbValue = convertJsToDbType(valueType.type, value)!
		const bytes = typeof dbValue === "string" ? stringToUtf8Uint8Array(dbValue) : dbValue
		const encryptedBytes = aesEncrypt(sk, bytes)
		return uint8ArrayToBase64(encryptedBytes)
	}
}

export class CryptoMapper {
	constructor(
		private readonly clientTypeReferenceResolver: ClientTypeReferenceResolver,
		private readonly serverTypeReferenceResolver: ServerTypeReferenceResolver | ClientTypeReferenceResolver,
		private readonly symmetricCipherFacade: SymmetricCipherFacade,
		private readonly symGroupKeyLoader: lazy<SymmetricGroupKeyLoader>,
		private readonly modelMapper: ModelMapper,
	) {
		if (isWebClient() && serverTypeReferenceResolver === clientTypeReferenceResolver) {
			throw new ProgrammingError("initializing server type reference resolver with client type reference resolver on webapp is not allowed!")
		}
	}

	async getInputKey(requiredGroupKeyVersion: "none" | KeyVersion, groupId: Nullable<Id>): Promise<Nullable<AesKey>> {
		if (requiredGroupKeyVersion === "none") {
			return null
		}
		if (groupId === null) {
			throw new CryptoError("Cannot load group key. Missing group Id.")
		}
		return this.symGroupKeyLoader().loadSymGroupKey(groupId, requiredGroupKeyVersion)
	}

	public async decryptParsedInstance(
		serverTypeModel: ServerTypeModel | ClientTypeModel,
		encryptedInstance: ServerModelEncryptedParsedInstance,
		sessionKey: Nullable<AesKey>,
		kdfNonce: Nullable<Uint8Array>,
		ownerGroupId: Nullable<Id>,
		fieldPathPrefix: string = "",
	): Promise<ServerModelParsedInstance> {
		const decrypted: ServerModelParsedInstance = {} as ServerModelParsedInstance
		const instanceDecryptor = this.symmetricCipherFacade.getInstanceDecryptor(sessionKey, kdfNonce, String(serverTypeModel.id))

		for (const [valueIdStr, valueInfo] of Object.entries(serverTypeModel.values)) {
			const valueId = parseInt(valueIdStr)
			const valueName = valueInfo.name
			const encryptedValue = encryptedInstance[valueId]

			try {
				if (!valueInfo.encrypted) {
					decrypted[valueId] = encryptedValue
				} else {
					const encryptedValueInfo = valueInfo as ModelValue & { encrypted: true }
					const encryptedString = encryptedValue as Base64
					const fieldPath = `${fieldPathPrefix}${valueInfo.id}`
					decrypted[valueId] = await this.decryptValue(encryptedValueInfo, encryptedString, instanceDecryptor, ownerGroupId, fieldPath)
				}
			} catch (e) {
				if (decrypted._errors == null) {
					decrypted._errors = {}
				}
				decrypted[valueId] = valueToDefault(valueInfo.type)
				if (e instanceof SessionKeyNotFoundError) {
					const skAttrId = AttributeModel.getAttributeId(serverTypeModel, "_ownerEncSessionKey")
					if (skAttrId) {
						decrypted._errors[skAttrId] = "Probably temporary SessionKeyNotFound"
					}
				} else {
					decrypted._errors[valueId] = JSON.stringify(e)
					console.error("error when decrypting value on type:", `[${serverTypeModel.app},${serverTypeModel.name}]`, "valueName:", valueName, e)
				}
			}
		}

		for (const associationId of Object.keys(serverTypeModel.associations).map(Number)) {
			let associationType = serverTypeModel.associations[associationId]
			const encryptedInstanceValue = encryptedInstance[associationId]
			if (associationType.type === AssociationType.Aggregation) {
				const appName = associationType.dependency ?? serverTypeModel.app
				const associationTypeModel = await this.serverTypeReferenceResolver(new TypeRef(appName, associationType.refTypeId))
				const fieldPathPrefixForThisAssociation = `${fieldPathPrefix}${associationId}/`
				const decryptedAggregates = await this.decryptAggregateAssociation(
					associationTypeModel,
					encryptedInstanceValue as Array<ServerModelEncryptedParsedInstance>,
					sessionKey,
					kdfNonce,
					ownerGroupId,
					fieldPathPrefixForThisAssociation,
				)
				decrypted[associationId] = decryptedAggregates
				if (this.containErrors(decryptedAggregates)) {
					// we must propagate up to the top level of the instance that there is an error somewhere in an aggregated type.
					// this indicates to the caller whether decryption succeeded.
					// e.g. in order to decide whether an instance should be cached or not.
					if (decrypted._errors == null) {
						decrypted._errors = {}
					}
					// we cannot leave the object empty here, because empty objects are not consistently treated as errors
					// see the _errors properties in the nested aggregates for more details about the error
					decrypted._errors[associationId] = "Aggregated type decrypted with errors"
				}
			} else {
				decrypted[associationId] = encryptedInstanceValue
			}
		}
		return decrypted
	}

	/**
	 * Returns true if at least one of the instances contains _errors at the top level.
	 * Useful for ATs.
	 */
	public containErrors(instances: ServerModelParsedInstance[]): boolean {
		return instances.some((instance) => hasError(instance))
	}

	/**
	 * Returns an array of the decrypted aggregates, each of which may contain decryption errors.
	 * The caller is responsible for handling the _errors property on each aggregate if it is set.
	 */
	public async decryptAggregateAssociation(
		associationServerTypeModel: ServerTypeModel | ClientTypeModel,
		encryptedInstanceValues: Array<ServerModelEncryptedParsedInstance>,
		sessionKey: Nullable<AesKey>,
		kdfNonce: Nullable<Uint8Array>,
		ownerGroupId: Nullable<Id>,
		fieldPathPrefix: string,
	): Promise<Array<ServerModelParsedInstance>> {
		const decryptedAggregates: Array<ServerModelParsedInstance> = []
		for (const encryptedAggregate of encryptedInstanceValues) {
			const entityAdapter = await EntityAdapter.from(associationServerTypeModel, encryptedAggregate, this.modelMapper)
			fieldPathPrefix = `${fieldPathPrefix}${entityAdapter._id as Id}/`
			const decryptedAggregate = await this.decryptParsedInstance(
				associationServerTypeModel,
				encryptedAggregate,
				sessionKey,
				kdfNonce,
				ownerGroupId,
				fieldPathPrefix,
			)
			decryptedAggregates.push(decryptedAggregate)
		}
		return decryptedAggregates
	}

	public async encryptParsedInstance(
		clientTypeModel: ClientTypeModel,
		parsedInstance: ClientModelParsedInstance,
		sk: Nullable<AesKey>,
	): Promise<ClientModelEncryptedParsedInstance> {
		let encrypted: ClientModelEncryptedParsedInstance = {} as ClientModelEncryptedParsedInstance

		for (let valueId of Object.keys(clientTypeModel.values).map(Number)) {
			let valueType = clientTypeModel.values[valueId]
			let valueName = valueType.name
			let value = parsedInstance[valueId] as Nullable<ParsedValue>

			let encryptedValue
			if (!valueType.encrypted) {
				encryptedValue = value
			} else if (sk != null) {
				// the value is actually Uint8Array | null | undefined. null means we need to check that the default value wasn't changed,
				// which happened above - so it's okay to roll null into undefined.
				encryptedValue = encryptValue(valueType as ModelValue & { encrypted: true }, value, sk)
			} else {
				throw new CryptoError(`Encrypting ${clientTypeModel.app}/${clientTypeModel.name}.${valueName} requires a session key!`)
			}

			encrypted[valueId] = encryptedValue
		}

		for (const associationId of Object.keys(clientTypeModel.associations).map(Number)) {
			const associationType = clientTypeModel.associations[associationId]
			if (associationType.type === AssociationType.Aggregation) {
				const appName = associationType.dependency ?? clientTypeModel.app
				const aggregateTypeModel = await this.clientTypeReferenceResolver(new TypeRef(appName, associationType.refTypeId))
				const aggregate = parsedInstance[associationId] as Array<ClientModelParsedInstance>
				encrypted[associationId] = await this.encryptAggregateAssociation(aggregateTypeModel, aggregate, sk)
			} else {
				encrypted[associationId] = parsedInstance[associationId]
			}
		}
		return encrypted
	}

	private async encryptAggregateAssociation(
		associationClientTypeModel: ClientTypeModel,
		aggregateValues: Array<ClientModelParsedInstance>,
		sk: Nullable<AesKey>,
	): Promise<Array<ClientModelEncryptedParsedInstance>> {
		let encryptedAggregates: Array<ClientModelEncryptedParsedInstance> = []
		for (const aggregate of aggregateValues) {
			encryptedAggregates.push(await this.encryptParsedInstance(associationClientTypeModel, aggregate, sk))
		}

		return encryptedAggregates
	}

	async decryptValue(
		valueType: ModelValue & {
			encrypted: true
		},
		value: Nullable<Base64>,
		instanceDecryptor: InstanceDecryptor,
		groupId: Nullable<Id>,
		fieldPath: string,
	): Promise<Nullable<ParsedValue>> {
		if (value == null) {
			return null
		} else if (valueType.cardinality === Cardinality.ZeroOrOne && value === "") {
			// Might happen if cardinality was changed from ZeroOrOne -> One -> ZeroOrOne
			console.warn(`Found an encrypted attribute (${valueType.id}:${valueType.name}) with a Cardinality.ZeroOrOne and an empty value`)
			return null
		} else if (valueType.cardinality === Cardinality.One && value === "") {
			// Migration for values added after the Type has been defined initially
			return valueToDefault(valueType.type)
		} else {
			const ciphertext = base64ToUint8Array(value)
			const valueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, fieldPath)
			if (valueDecryptor === MissingSessionKey) {
				throw new SessionKeyNotFoundError("")
			}
			const inputKey = await this.getInputKey(valueDecryptor.requiredGroupKeyVersion, groupId)
			const decryptedBytes = valueDecryptor.getValue(inputKey)

			if (valueType.type === ValueType.Bytes) {
				return decryptedBytes
			} else if (valueType.type === ValueType.CompressedString) {
				return decompressString(decryptedBytes)
			} else {
				return convertDbToJsType(valueType.type, utf8Uint8ArrayToString(decryptedBytes))
			}
		}
	}
}
