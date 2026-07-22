import { AssociationType, AttributeModel, Cardinality, ClientTypeModel, hasError, TypeRef, ValueType } from "../meta"
import { base64ToUint8Array, KeyVersion, lazy, Nullable, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString, Versioned } from "@tutao/utils"
import { CryptoError, SessionKeyNotFoundError } from "@tutao/crypto/error"
import {
	AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_GROUP_KEY_DOMAIN,
	AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN,
	AeadSubKeys,
	Aes256Key,
	AesKey,
	assert256BitKey,
	AsymmetricKeyPair,
	decryptKey,
	DomainSeparator,
	InstanceDecryptor,
	KdfNonce,
	SubKeyFactory,
	SubKeyInfo,
	SubKeyInfoWithSessionKeyAead,
	SubKeyInfoWithSessionKeyCbcThenHmac,
	SubKeyProvider,
	SymmetricCipherFacade,
	SymmetricCipherVersion,
	SymmetricEncryptionScheme,
	VersionedKey,
} from "@tutao/crypto"
import { convertDbToJsType, convertJsToDbType, decompressString, ModelMapper, valueToDefault } from "./ModelMapper.js"
import { isWebClient, ProgrammingError } from "@tutao/app-env"
import { EntityAdapter } from "./EntityAdapter.js"
import { User, WebsocketLeaderStatus } from "../../entities/sys/TypeRefs"
import {
	ClientModelEncryptedParsedInstance,
	ClientModelParsedInstance,
	EncryptedModelValue,
	ModelValue,
	ParsedValue,
	ServerModelEncryptedParsedInstance,
	ServerModelParsedInstance,
	ServerTypeModel,
} from "../meta/EntityTypes"
import { ClientTypeReferenceResolver, ServerTypeReferenceResolver } from "./EntityFunctions"
import { OwnerKeyProvider } from "./PatchMerger"
import { AssociationPath, InstancePath, RootPath } from "./EncryptionContextPath"

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

	async getInputKey(requiredGroupKeyVersion: Nullable<KeyVersion>, ownerKeyProvider: Nullable<OwnerKeyProvider>): Promise<Nullable<AesKey>> {
		if (requiredGroupKeyVersion === null) {
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
		serverTypeModel: ServerTypeModel | ClientTypeModel,
		encryptedInstance: ServerModelEncryptedParsedInstance,
		sessionKey: Nullable<AesKey>,
		kdfNonce: Nullable<KdfNonce>,
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
		path: InstancePath = new RootPath(),
	): Promise<ServerModelParsedInstance> {
		const instanceDecryptor = this.symmetricCipherFacade.getInstanceDecryptor(sessionKey, kdfNonce, serverTypeModel)

		return this.decryptParsedInstanceInternal(serverTypeModel, encryptedInstance, instanceDecryptor, ownerKeyProvider, path)
	}

	private async decryptParsedInstanceInternal(
		serverTypeModel: ServerTypeModel | ClientTypeModel,
		encryptedInstance: ServerModelEncryptedParsedInstance,
		instanceDecryptor: InstanceDecryptor,
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
		path: InstancePath = new RootPath(),
	): Promise<ServerModelParsedInstance> {
		const decrypted: ServerModelParsedInstance = {} as ServerModelParsedInstance
		for (const [valueIdStr, valueInfo] of Object.entries(serverTypeModel.values)) {
			const valueId = parseInt(valueIdStr)
			const valueName = valueInfo.name
			const encryptedValue = encryptedInstance[valueId]

			try {
				if (!valueInfo.encrypted) {
					decrypted[valueId] = encryptedValue
				} else {
					const encryptedValueInfo = valueInfo as EncryptedModelValue
					const encryptedString = encryptedValue as Base64
					const valuePath = path.addValueId(valueInfo)
					decrypted[valueId] = await this.decryptValue(encryptedValueInfo, encryptedString, instanceDecryptor, ownerKeyProvider, valuePath.getPath())
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
				const decryptedAggregates = await this.decryptAggregateAssociation(
					associationTypeModel,
					encryptedInstanceValue as Array<ServerModelEncryptedParsedInstance>,
					instanceDecryptor,
					ownerKeyProvider,
					path.addAssociationId(associationType),
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
		instanceDecryptor: InstanceDecryptor,
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
		associationPath: AssociationPath,
	): Promise<Array<ServerModelParsedInstance>> {
		const decryptedAggregates: Array<ServerModelParsedInstance> = []
		for (const encryptedAggregate of encryptedInstanceValues) {
			const entityAdapter = await EntityAdapter.from(associationServerTypeModel, encryptedAggregate, this.modelMapper)
			const decryptedAggregate = await this.decryptParsedInstanceInternal(
				associationServerTypeModel,
				encryptedAggregate,
				instanceDecryptor,
				ownerKeyProvider,
				associationPath.addAggregateId(entityAdapter._id as Id),
			)
			decryptedAggregates.push(decryptedAggregate)
		}
		return decryptedAggregates
	}

	public async encryptParsedInstance(
		clientTypeModel: ClientTypeModel,
		parsedInstance: ClientModelParsedInstance,
		subKeyFactory: Nullable<SubKeyFactory>,
		path: InstancePath = new RootPath(),
	): Promise<ClientModelEncryptedParsedInstance> {
		const encrypted: ClientModelEncryptedParsedInstance = {} as ClientModelEncryptedParsedInstance
		let subKeyProvider = await this.makeNullableSubKeyProvider(subKeyFactory, clientTypeModel, path, parsedInstance)

		for (let valueId of Object.keys(clientTypeModel.values).map(Number)) {
			const valueType = clientTypeModel.values[valueId]
			const value = parsedInstance[valueId] as Nullable<ParsedValue>

			let encryptedValue
			if (valueType.encrypted) {
				const valuePath = path.addValueId(valueType)
				encryptedValue = this.encryptValue(valueType as EncryptedModelValue, value, subKeyProvider, valuePath.getPath())
			} else {
				encryptedValue = value
			}

			encrypted[valueId] = encryptedValue
		}

		for (const associationId of Object.keys(clientTypeModel.associations).map(Number)) {
			const associationType = clientTypeModel.associations[associationId]
			if (associationType.type === AssociationType.Aggregation) {
				const appName = associationType.dependency ?? clientTypeModel.app
				const aggregateTypeModel = await this.clientTypeReferenceResolver(new TypeRef(appName, associationType.refTypeId))
				const aggregate = parsedInstance[associationId] as Array<ClientModelParsedInstance>
				const associationPath = path.addAssociationId(associationType)
				encrypted[associationId] = await this.encryptAggregateAssociation(aggregateTypeModel, aggregate, subKeyProvider, associationPath)
			} else {
				encrypted[associationId] = parsedInstance[associationId]
			}
		}
		return encrypted
	}

	private async makeNullableSubKeyProvider(
		subKeyFactory: Nullable<SubKeyFactory>,
		clientTypeModel: ClientTypeModel,
		path: InstancePath,
		parsedInstance: ClientModelParsedInstance,
		ownerGroupKey: AesKey,
	): Promise<Nullable<SubKeyProvider>> {
		if (subKeyFactory instanceof SubKeyProvider) {
			if (clientTypeModel.idForSubKeyContext != null && !path.hasBeenCutOff) {
				const ownerEncSessionKey = (await EntityAdapter.from(clientTypeModel, parsedInstance, this.modelMapper))._ownerEncSessionKey
				let newSubKeyInfo: Nullable<SubKeyInfo> = null
				if (ownerEncSessionKey) {
					const newSessionKey: Aes256Key = assert256BitKey(decryptKey(ownerGroupKey, ownerEncSessionKey))

					switch (subKeyFactory["subKeyInfo"].cipherVersion) {
						case SymmetricCipherVersion.AeadWithSessionKey:
							newSubKeyInfo = new SubKeyInfoWithSessionKeyAead(newSessionKey)
							break
						case SymmetricCipherVersion.AesCbcThenHmac:
							newSubKeyInfo = new SubKeyInfoWithSessionKeyCbcThenHmac(newSessionKey)
							break
						default:
							throw new ProgrammingError(
								"Transfer aggregated types should only be encrypted for data transfer types using session keys. Unexpected cipher version: " +
									subKeyFactory["subKeyInfo"].cipherVersion,
							)
					}
				}

				return this.symmetricCipherFacade.getSubKeyProvider(newSubKeyInfo ?? subKeyFactory, {
					app: clientTypeModel.app,
					id: clientTypeModel.idForSubKeyContext,
					name: "[the name for transfer aggregates is currently not supported]",
				})
			} else {
				return subKeyFactory
			}
		} else if (subKeyFactory instanceof SubKeyInfo) {
			return this.symmetricCipherFacade.getSubKeyProvider(subKeyFactory, clientTypeModel)
		} else if (subKeyFactory == null) {
			return null
		} else {
			throw new ProgrammingError("unknown SubKeyFactory")
		}
	}

	private async encryptAggregateAssociation(
		associationClientTypeModel: ClientTypeModel,
		aggregateValues: Array<ClientModelParsedInstance>,
		subKeyProvider: Nullable<SubKeyProvider>,
		associationPath: AssociationPath,
	): Promise<Array<ClientModelEncryptedParsedInstance>> {
		let encryptedAggregates: Array<ClientModelEncryptedParsedInstance> = []
		for (const aggregate of aggregateValues) {
			const entityAdapter = await EntityAdapter.from(associationClientTypeModel, aggregate, this.modelMapper)
			encryptedAggregates.push(
				await this.encryptParsedInstance(
					associationClientTypeModel,
					aggregate,
					subKeyProvider,
					associationPath.addAggregateId(entityAdapter._id as Id),
				),
			)
		}

		return encryptedAggregates
	}

	async decryptValue(
		valueType: ModelValue & {
			encrypted: true
		},
		value: Nullable<Base64>,
		instanceDecryptor: InstanceDecryptor,
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
		valuePath: string,
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
		}
		const ciphertext = base64ToUint8Array(value)
		const valueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, valuePath)
		const inputKey = await this.getInputKey(valueDecryptor.requiredGroupKeyVersion, ownerKeyProvider)
		const decryptedBytes = valueDecryptor.getValue(inputKey)

		if (valueType.type === ValueType.Bytes) {
			return decryptedBytes
		} else if (valueType.type === ValueType.CompressedString) {
			return decompressString(decryptedBytes)
		} else {
			return convertDbToJsType(valueType.type, utf8Uint8ArrayToString(decryptedBytes))
		}
	}

	encryptValue(valueType: EncryptedModelValue, value: Nullable<ParsedValue>, subKeyProvider: Nullable<SubKeyProvider>, valuePath: string): Nullable<Base64> {
		if (value == null) {
			return null
		}
		const dbValue = convertJsToDbType(valueType.type, value)!
		const bytes = typeof dbValue === "string" ? stringToUtf8Uint8Array(dbValue) : dbValue
		// we want to throw the error late in case we cannot derive the subkeys to handle types gracefully
		// that do not have any actual encrypted values set
		if (subKeyProvider == null) {
			throw new CryptoError(`Encrypting ${valueType.name} requires keys!`)
		}
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
			const associatedData = stringToUtf8Uint8Array(domainSpecifier + valuePath)
			if (subKeys instanceof AeadSubKeys) {
				encryptedBytes = this.symmetricCipherFacade.encryptBytesWithAead(subKeys, bytes, associatedData)
			} else {
				throw new ProgrammingError("invalid subkeys")
			}
		}
		return uint8ArrayToBase64(encryptedBytes)
	}
}
