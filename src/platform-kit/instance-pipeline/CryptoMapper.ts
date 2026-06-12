import { AssociationType, AttributeModel, Cardinality, ClientTypeModel, hasError, ParsedInstance, ParsedValue, TypeRef, ValueType } from "../meta"
import {
	base64ToUint8Array,
	isNotNull,
	KeyVersion,
	lazy,
	Nullable,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
	utf8Uint8ArrayToString,
	Versioned,
} from "@tutao/utils"
import { CryptoError, SessionKeyNotFoundError } from "@tutao/crypto/error"
import {
	AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_GROUP_KEY_DOMAIN,
	AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN,
	AesKey,
	AsymmetricKeyPair,
	DomainSeparator,
	InstanceDecryptor,
	KdfNonce,
	SubKeyInfo,
	SubKeyProvider,
	SymmetricCipherFacade,
	SymmetricCipherVersion,
	SymmetricEncryptionScheme,
	VersionedKey,
} from "@tutao/crypto"
import { convertJsToServerJson, convertServerJsonToJsType, decompressString, ModelMapper, valueToDefault } from "./ModelMapper.js"
import { EntityAdapter } from "./EntityAdapter.js"
import { User, WebsocketLeaderStatus } from "../../entities/sys/TypeRefs"
import {
	ClientModelEncryptedParsedInstance,
	ClientModelParsedInstance,
	EncryptedModelValue,
	ServerModelEncryptedParsedInstance,
	ServerModelParsedInstance,
	ServerTypeModel,
} from "../meta/EntityTypes"
import { TypeModelResolver } from "./EntityFunctions"
import { OwnerKeyProvider } from "./PatchMerger"

export interface SymmetricGroupKeyLoader {
	loadSymGroupKey(groupId: Id, requestedVersion: KeyVersion, currentGroupKey?: VersionedKey): Promise<AesKey>
	getCurrentSymGroupKey(groupId: Id): Promise<VersionedKey>
	loadCurrentKeyPair(groupId: Id, currentGroupKey: Nullable<VersionedKey>): Promise<Versioned<AsymmetricKeyPair>>
	loadSymUserGroupKey(requestedVersion: KeyVersion): Promise<AesKey>
}

export abstract class LoggedInUserProvider {
	/**
	 * @return The map which contains authentication data for the logged-in user.
	 */
	abstract createAuthHeaders(): Dict

	abstract isFullyLoggedIn(): boolean

	abstract getLoggedInUser(): User

	abstract getCurrentUserGroupKey(): VersionedKey

	abstract setLeaderStatus(data: WebsocketLeaderStatus): void

	abstract getDefaultSymmetricEncryptionScheme(): SymmetricEncryptionScheme

	getUserGroupId(): Id {
		return this.getLoggedInUser().userGroup.group
	}

	getAllGroupIds(): Id[] {
		let groups = this.getLoggedInUser().memberships.map((membership) => membership.group)
		groups.push(this.getLoggedInUser().userGroup.group)
		return groups
	}
}

export class CryptoMapper {
	constructor(
		private readonly typeModelResolver: TypeModelResolver,
		private readonly symmetricCipherFacade: SymmetricCipherFacade,
		private readonly symGroupKeyLoader: lazy<SymmetricGroupKeyLoader>,
		private readonly modelMapper: ModelMapper,
	) {}

	async getInputKey(requiredGroupKeyVersion: "none" | KeyVersion, ownerKeyProvider: Nullable<OwnerKeyProvider>): Promise<Nullable<AesKey>> {
		if (requiredGroupKeyVersion === "none") {
			return null
		}
		if (ownerKeyProvider == null) {
			throw new CryptoError("Cannot load group key. Missing owner key provider.")
		}
		return await ownerKeyProvider(requiredGroupKeyVersion)
	}

	makeOwnerKeyProvider(groupId: Nullable<Id>): Nullable<OwnerKeyProvider> {
		return groupId ? (groupKeyVersion: KeyVersion) => this.symGroupKeyLoader().loadSymGroupKey(groupId, groupKeyVersion) : null
	}

	public async decryptParsedInstance(
		serverTypeModel: ServerTypeModel,
		encryptedInstance: ServerModelEncryptedParsedInstance,
		sessionKey: Nullable<AesKey>,
		kdfNonce: Nullable<KdfNonce>,
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
		fieldPathPrefix: string = "",
	): Promise<ServerModelParsedInstance> {
		const instanceDecryptor = this.symmetricCipherFacade.getInstanceDecryptor(sessionKey, kdfNonce, serverTypeModel)

		return this.decryptParsedInstanceInternal(serverTypeModel, encryptedInstance, instanceDecryptor, ownerKeyProvider, fieldPathPrefix)
	}

	private async decryptParsedInstanceInternal(
		serverTypeModel: ServerTypeModel,
		encryptedInstance: ServerModelEncryptedParsedInstance,
		instanceDecryptor: InstanceDecryptor,
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
		fieldPathPrefix: string = "",
	): Promise<ServerModelParsedInstance> {
		const decrypted: ServerModelParsedInstance = {} as ServerModelParsedInstance
		for (const [valueIdStr, valueInfo] of Object.entries(serverTypeModel.values)) {
			const valueId = parseInt(valueIdStr)
			const valueName = valueInfo.name
			const encryptedValue = encryptedInstance[valueId]

			try {
				if (!valueInfo.encrypted || encryptedValue.isNull()) {
					decrypted[valueId] = encryptedValue
				} else {
					const encryptedValueInfo = valueInfo as EncryptedModelValue
					const encryptedString = encryptedValue.getString()
					const fieldPath = `${fieldPathPrefix}${valueInfo.id}`
					decrypted[valueId] = await this.decryptValue(encryptedValueInfo, encryptedString, instanceDecryptor, ownerKeyProvider, fieldPath)
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
			const associationType = serverTypeModel.associations[associationId]
			const encryptedInstanceValue = encryptedInstance[associationId].getArray()

			if (associationType.type === AssociationType.Aggregation) {
				const appName = associationType.dependency ?? serverTypeModel.app
				const associationTypeModel = await this.typeModelResolver.resolveServerTypeReference(new TypeRef(appName, associationType.refTypeId))
				const fieldPathPrefixForThisAssociation = `${fieldPathPrefix}${associationId}/`

				const encryptedAggregates = encryptedInstanceValue.map((a) => a.getAggregate())
				const decryptedAggregates = await this.decryptAggregateAssociation(
					associationTypeModel,
					encryptedAggregates,
					instanceDecryptor,
					ownerKeyProvider,
					fieldPathPrefixForThisAssociation,
				)
				decrypted[associationId] = ParsedValue.fromAggregatedItems(decryptedAggregates)
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
				decrypted[associationId] = ParsedValue.fromArray(encryptedInstanceValue)
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
		associationServerTypeModel: ServerTypeModel,
		encryptedInstanceValues: Array<ParsedInstance>,
		instanceDecryptor: InstanceDecryptor,
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
		fieldPathPrefix: string,
	): Promise<Array<ServerModelParsedInstance>> {
		const decryptedAggregates: Array<ServerModelParsedInstance> = []
		for (const encryptedAggregate of encryptedInstanceValues) {
			const entityAdapter = await EntityAdapter.from(associationServerTypeModel, encryptedAggregate, this.modelMapper)
			const fieldPathPrefixForThisAssociation = `${fieldPathPrefix}${entityAdapter._id as Id}/`
			const decryptedAggregate = await this.decryptParsedInstanceInternal(
				associationServerTypeModel,
				encryptedAggregate as ServerModelEncryptedParsedInstance,
				instanceDecryptor,
				ownerKeyProvider,
				fieldPathPrefixForThisAssociation,
			)
			decryptedAggregates.push(decryptedAggregate)
		}
		return decryptedAggregates
	}

	public async encryptParsedInstance(
		clientTypeModel: ClientTypeModel,
		parsedInstance: ParsedInstance,
		subKeyInfo: SubKeyInfo | SubKeyProvider,
		fieldPathPrefix: string = "",
	): Promise<ClientModelEncryptedParsedInstance> {
		const encryptedInstance: ClientModelEncryptedParsedInstance = {} as ClientModelEncryptedParsedInstance
		const subKeyProvider = subKeyInfo instanceof SubKeyProvider ? subKeyInfo : this.symmetricCipherFacade.getSubKeyProvider(subKeyInfo, clientTypeModel)

		for (let valueId of Object.keys(clientTypeModel.values).map(Number)) {
			const valueType = clientTypeModel.values[valueId] as EncryptedModelValue
			const value = parsedInstance[valueId]

			if (valueType.encrypted) {
				const fieldPath = `${fieldPathPrefix}${valueId}`
				const encryptedValue = this.encryptValue(valueType, value, subKeyProvider, fieldPath)
				encryptedInstance[valueId] = isNotNull(encryptedValue) ? ParsedValue.fromString(encryptedValue) : ParsedValue.fromNull()
			} else {
				encryptedInstance[valueId] = value
			}
		}

		for (const associationId of Object.keys(clientTypeModel.associations).map(Number)) {
			const associationType = clientTypeModel.associations[associationId]

			if (associationType.type === AssociationType.Aggregation) {
				const appName = associationType.dependency ?? clientTypeModel.app
				const aggregateTypeModel = await this.typeModelResolver.resolveClientTypeReference(new TypeRef(appName, associationType.refTypeId))
				const fieldPathPrefixForThisAssociation = `${fieldPathPrefix}${associationId}/`
				const unencryptedAggregates = parsedInstance[associationId].getArray().map((a) => a.getAggregate() as ClientModelParsedInstance)
				const encryptedAggregates = await this.encryptAggregateAssociation(
					aggregateTypeModel,
					unencryptedAggregates,
					subKeyProvider,
					fieldPathPrefixForThisAssociation,
				)
				encryptedInstance[associationId] = ParsedValue.fromAggregatedItems(encryptedAggregates)
			} else {
				encryptedInstance[associationId] = parsedInstance[associationId]
			}
		}
		return encryptedInstance
	}

	private async encryptAggregateAssociation(
		associationClientTypeModel: ClientTypeModel,
		aggregateValues: Array<ParsedInstance>,
		subKeyProvider: SubKeyProvider,
		fieldPathPrefix: string,
	): Promise<Array<ClientModelEncryptedParsedInstance>> {
		let encryptedAggregates: Array<ClientModelEncryptedParsedInstance> = []
		for (const aggregate of aggregateValues) {
			const entityAdapter = await EntityAdapter.from(associationClientTypeModel, aggregate, this.modelMapper)
			fieldPathPrefix = `${fieldPathPrefix}${entityAdapter._id as Id}/`
			encryptedAggregates.push(await this.encryptParsedInstance(associationClientTypeModel, aggregate, subKeyProvider, fieldPathPrefix))
		}

		return encryptedAggregates
	}

	async decryptValue(
		valueType: EncryptedModelValue,
		value: Base64,
		instanceDecryptor: InstanceDecryptor,
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
		fieldPath: string,
	): Promise<ParsedValue> {
		if (valueType.cardinality === Cardinality.ZeroOrOne && value === "") {
			// Might happen if cardinality was changed from ZeroOrOne -> One -> ZeroOrOne
			console.warn(`Found an encrypted attribute (${valueType.id}:${valueType.name}) with a Cardinality.ZeroOrOne and an empty value`)
			return ParsedValue.fromNull()
		} else if (valueType.cardinality === Cardinality.One && value === "") {
			// Migration for values added after the Type has been defined initially
			return valueToDefault(valueType.type)
		}
		const ciphertext = base64ToUint8Array(value)
		const valueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, fieldPath)
		const inputKey = await this.getInputKey(valueDecryptor.requiredGroupKeyVersion, ownerKeyProvider)
		const decryptedBytes = valueDecryptor.getValue(inputKey)

		if (valueType.type === ValueType.Bytes) {
			return ParsedValue.fromBytes(decryptedBytes)
		} else if (valueType.type === ValueType.CompressedString) {
			return ParsedValue.fromString(decompressString(decryptedBytes))
		} else {
			return convertServerJsonToJsType(valueType.type, utf8Uint8ArrayToString(decryptedBytes))
		}
	}

	encryptValue(valueType: EncryptedModelValue, value: ParsedValue, subKeyProvider: SubKeyProvider, fieldPath: string): Nullable<Base64> {
		if (value.isNull()) {
			return null
		}
		const dbValue = convertJsToServerJson(valueType.type, value)!
		const bytes = isNotNull(dbValue.stringValue) ? stringToUtf8Uint8Array(dbValue.stringValue) : dbValue.asByteArray()
		const subKeys = subKeyProvider.getSubKeys()
		let encryptedBytes
		if (subKeys.cipherVersion === SymmetricCipherVersion.AesCbcThenHmac) {
			encryptedBytes = this.symmetricCipherFacade.encryptBytes(subKeys, bytes)
		} else {
			let domainSpecifier: DomainSeparator
			if (subKeys.cipherVersion === SymmetricCipherVersion.AeadWithGroupKey) {
				domainSpecifier = AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_GROUP_KEY_DOMAIN
			} else {
				domainSpecifier = AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN
			}
			const associatedData = stringToUtf8Uint8Array(domainSpecifier + fieldPath)
			encryptedBytes = this.symmetricCipherFacade.encryptBytesWithAead(subKeys, bytes, associatedData)
		}
		return uint8ArrayToBase64(encryptedBytes)
	}
}
