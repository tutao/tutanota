import {
	AssociationReprType,
	AttributeId,
	AttributeModel,
	AttributeName,
	Cardinality,
	ClientTypeModel,
	getAssociationReprType,
	getIdType,
	IdType,
	isSameTypeRef,
	ModelValue,
	ServerTypeModel,
	TypeModel,
	TypeRef,
} from "@tutao/meta"
import {
	assert,
	assertNotNull,
	base64ToUint8Array,
	deepEqual,
	DeepEquals,
	isNotNull,
	KeyVersion,
	lazy,
	Nullable,
	stringToBase64,
	stringToUtf8Uint8Array,
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
	InstanceTypeId,
	KdfNonce,
	SubKeyInfo,
	SubKeyProvider,
	SymmetricCipherFacade,
	SymmetricCipherVersion,
	SymmetricEncryptionScheme,
	VersionedKey,
} from "@tutao/crypto"
import { EntityAdapter } from "./EntityAdapter.js"
import { User, WebsocketLeaderStatus } from "@tutao/entities/sys"
import { OwnerKeyProvider } from "./PatchMerger"
import { ModelMapper } from "./ModelMapper"
import { InstanceDirection, ParsedValue } from "./ParsedValue"
import { EntityUtils } from "./EntityUtils"

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
		private readonly symmetricCipherFacade: SymmetricCipherFacade,
		private readonly symGroupKeyLoader: lazy<SymmetricGroupKeyLoader>,
		private readonly modelMapper: ModelMapper,
	) {}

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
		encryptedInstance: EncryptedParsedInstance,
		sessionKey: Nullable<AesKey>,
		kdfNonce: Nullable<KdfNonce>,
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
		fieldPathPrefix: string = "",
	): Promise<DecryptedParsedInstance> {
		const instanceDecryptor = this.symmetricCipherFacade.getInstanceDecryptor(sessionKey, kdfNonce, encryptedInstance.getInstanceTypeId())
		return this.decryptParsedInstanceInternal(encryptedInstance, instanceDecryptor, ownerKeyProvider, fieldPathPrefix)
	}

	private async decryptParsedInstanceInternal(
		encryptedInstance: EncryptedParsedInstance,
		instanceDecryptor: InstanceDecryptor,
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
		fieldPathPrefix: string = "",
	): Promise<DecryptedParsedInstance> {
		const serverTypeModel = encryptedInstance.ensureIncoming()
		const decrypted: DecryptedParsedInstance = DecryptedParsedInstance.incomingFromServer(serverTypeModel)

		for (const valueModel of Object.values(serverTypeModel.values)) {
			const { id: valueId, name: valueName } = valueModel
			const encryptedValue = encryptedInstance.getAttributeById(valueId)

			if (valueModel.name === "_id") {
				decrypted.addId(encryptedValue)
				continue
			}

			try {
				const fieldPath = `${fieldPathPrefix}${valueModel.id}`
				const decryptedValue = await this.decryptValue(valueModel, encryptedValue, instanceDecryptor, ownerKeyProvider, fieldPath)
				decrypted.addAttribute(valueId, decryptedValue)
			} catch (e) {
				const defaultValue = EntityUtils.valueToDefault(valueModel.type).asString()
				const base64EncodedDefaultValue: DecryptedParsedValue = ParsedValue.fromString(stringToBase64(defaultValue))
				decrypted.addAttribute(valueId, base64EncodedDefaultValue)

				if (e instanceof SessionKeyNotFoundError) {
					const skAttrId = AttributeModel.getAttributeId(serverTypeModel, "_ownerEncSessionKey")
					if (isNotNull(skAttrId)) {
						decrypted.addErrorByAttributeId(skAttrId, "Probably temporary SessionKeyNotFound")
					}
				} else {
					decrypted.addErrorByAttributeId(valueModel.id, JSON.stringify(e))
					console.error("error when decrypting value on type:", `[${serverTypeModel.app},${serverTypeModel.name}]`, "valueName:", valueName, e)
				}
			}
		}

		for (const associationModel of Object.values(serverTypeModel.associations)) {
			const associationId = associationModel.id
			const associationType = getAssociationReprType(associationModel.type)

			switch (associationType) {
				case AssociationReprType.Aggregation: {
					const fieldPathPrefixForThisAssociation = `${fieldPathPrefix}${associationId}/`

					const encryptedAggregates = encryptedInstance.getAttributeById(associationId).asNestedObjList()
					const decryptedAggregates = await this.decryptAggregateAssociation(
						encryptedAggregates,
						instanceDecryptor,
						ownerKeyProvider,
						fieldPathPrefixForThisAssociation,
					)
					decrypted.addAttribute(associationId, ParsedValue.fromNestedItems(decryptedAggregates))

					if (this.containErrors(decryptedAggregates)) {
						// we must propagate up to the top level of the instance that there is an error somewhere in an aggregated type.
						// this indicates to the caller whether decryption succeeded.
						// e.g. in order to decide whether an instance should be cached or not.
						decrypted.addErrorByAttributeName(associationModel.name, "Aggregated type decrypted with errors")
					}
					break
				}

				case AssociationReprType.SingleId: {
					const idList = encryptedInstance.getAttributeById(associationId).asIdList()
					decrypted.addAttribute(associationId, ParsedValue.fromIdList(idList))
					break
				}

				case AssociationReprType.IdTuple: {
					const idList = encryptedInstance.getAttributeById(associationId).asIdTupleList()
					decrypted.addAttribute(associationId, ParsedValue.fromIdTupleList(idList))
					break
				}
			}
		}

		return decrypted
	}

	/**
	 * Returns true if at least one of the instances contains _errors at the top level.
	 * Useful for ATs.
	 */
	public containErrors(instances: DecryptedParsedInstance[]): boolean {
		return instances.some((instance) => instance.hasError())
	}

	/**
	 * Returns an array of the decrypted aggregates, each of which may contain decryption errors.
	 * The caller is responsible for handling the _errors property on each aggregate if it is set.
	 */
	public async decryptAggregateAssociation(
		encryptedInstanceValues: Array<EncryptedParsedInstance>,
		instanceDecryptor: InstanceDecryptor,
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
		fieldPathPrefix: string,
	): Promise<Array<DecryptedParsedInstance>> {
		const decryptedAggregates = new Array<DecryptedParsedInstance>()

		for (const encryptedAggregate of encryptedInstanceValues) {
			const entityAdapter = await EntityAdapter.fromEncryptedParsedInstance(encryptedAggregate, this.modelMapper, this)
			const fieldPathPrefixForThisAssociation = `${fieldPathPrefix}${entityAdapter._id as Id}/`
			const decryptedAggregate = await this.decryptParsedInstanceInternal(
				encryptedAggregate,
				instanceDecryptor,
				ownerKeyProvider,
				fieldPathPrefixForThisAssociation,
			)
			decryptedAggregates.push(decryptedAggregate)
		}
		return decryptedAggregates
	}

	public async encryptParsedInstance(
		parsedInstance: DecryptedParsedInstance,
		subKeyInfo: SubKeyInfo | SubKeyProvider,
		fieldPathPrefix: string = "",
	): Promise<EncryptedParsedInstance> {
		// todo: get rid of this casting by implementing ensureModel() function in DecryptedParsedInstance
		const clientTypeModel = parsedInstance.typeModel as ClientTypeModel
		const instanceTypeId: InstanceTypeId = { app: clientTypeModel.app, id: clientTypeModel.id, name: clientTypeModel.name }
		const subKeyProvider = subKeyInfo instanceof SubKeyProvider ? subKeyInfo : this.symmetricCipherFacade.getSubKeyProvider(subKeyInfo, instanceTypeId)

		const encryptedInstance = EncryptedParsedInstance.outgoingToServer(clientTypeModel)

		for (const valueModel of Object.values(clientTypeModel.values)) {
			const valueId = valueModel.id
			const unencryptedValue = parsedInstance.getAttributeById(valueId)

			if (valueModel.name === "_id") {
				encryptedInstance.addId(unencryptedValue)
			} else if (valueModel.encrypted) {
				const decryptedValue = this.encryptValue(unencryptedValue, subKeyProvider, `${fieldPathPrefix}${valueId}`)
				encryptedInstance.addAttributeById(valueId, decryptedValue)
			} else {
				const unencryptedValueAsIs: EncryptedParsedValue = unencryptedValue.isNull()
					? ParsedValue.fromNull()
					: ParsedValue.fromString(unencryptedValue.asString())
				encryptedInstance.addAttributeById(valueId, unencryptedValueAsIs)
			}
		}

		for (const associationModel of Object.values(clientTypeModel.associations)) {
			const associationId = associationModel.id
			switch (getAssociationReprType(associationModel.type)) {
				case AssociationReprType.Aggregation: {
					const fieldPathPrefixForThisAssociation = `${fieldPathPrefix}${associationId}/`
					const unencryptedAggregates = parsedInstance.getAttributeById(associationId).asNestedObjList()
					const encryptedAggregates = await this.encryptAggregateAssociation(unencryptedAggregates, subKeyProvider, fieldPathPrefixForThisAssociation)
					encryptedInstance.addAttributeById(associationId, ParsedValue.fromNestedItems(encryptedAggregates))
					break
				}

				case AssociationReprType.SingleId: {
					const idListAsIs = parsedInstance.getAttributeById(associationId).asIdList()
					encryptedInstance.addAttributeById(associationId, ParsedValue.fromIdList(idListAsIs))
					break
				}

				case AssociationReprType.IdTuple: {
					const idListAsIs = parsedInstance.getAttributeById(associationId).asIdTupleList()
					encryptedInstance.addAttributeById(associationId, ParsedValue.fromIdTupleList(idListAsIs))
					break
				}
			}
		}

		return encryptedInstance
	}

	private async encryptAggregateAssociation(
		aggregateValues: Array<DecryptedParsedInstance>,
		subKeyProvider: SubKeyProvider,
		fieldPathPrefix: string,
	): Promise<Array<EncryptedParsedInstance>> {
		let encryptedAggregates = new Array<EncryptedParsedInstance>()
		for (const aggregate of aggregateValues) {
			const entityId = aggregate.getAttributeByName("_id").asId()
			fieldPathPrefix = `${fieldPathPrefix}${entityId}/`
			encryptedAggregates.push(await this.encryptParsedInstance(aggregate, subKeyProvider, fieldPathPrefix))
		}

		return encryptedAggregates
	}

	async decryptValue(
		valueType: ModelValue,
		encParsedValue: EncryptedParsedValue,
		instanceDecryptor: InstanceDecryptor,
		ownerKeyProvider: Nullable<OwnerKeyProvider>,
		fieldPath: string,
	): Promise<DecryptedParsedValue> {
		if (encParsedValue.isNull()) {
			return ParsedValue.fromNull()
		}
		const value = encParsedValue.asString()

		if (!valueType.encrypted) {
			return ParsedValue.fromString(value)
		} else if (valueType.cardinality === Cardinality.ZeroOrOne && value === "") {
			// Might happen if cardinality was changed from ZeroOrOne -> One -> ZeroOrOne
			console.warn(`Found an encrypted attribute (${valueType.id}:${valueType.name}) with a Cardinality.ZeroOrOne and an empty value`)
			return ParsedValue.fromNull()
		}
		if (valueType.cardinality === Cardinality.One && value === "") {
			// Migration for values added after the Type has been defined initially
			// valueToDefault returns a ParsedValue by necessity. In this branch, the default value is encrypted, and we need to store it
			// base64 encoded in the CryptoMapper.
			return ParsedValue.fromString(stringToBase64(EntityUtils.valueToDefault(valueType.type).asString()))
		}
		const ciphertext = base64ToUint8Array(value)
		const valueDecryptor = instanceDecryptor.getValueDecryptor(ciphertext, fieldPath)
		const inputKey = await this.getInputKey(valueDecryptor.requiredGroupKeyVersion, ownerKeyProvider)
		const decryptedBytes = valueDecryptor.getValue(inputKey)

		return ParsedValue.fromByteArray(decryptedBytes)
	}

	encryptValue(value: DecryptedParsedValue, subKeyProvider: SubKeyProvider, fieldPath: string): EncryptedParsedValue {
		if (value.isNull()) {
			return ParsedValue.fromNull()
		}

		const bytes = stringToUtf8Uint8Array(value.asString())
		const subKeys = subKeyProvider.getSubKeys()
		let encryptedBytes: Uint8Array
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

		return ParsedValue.fromByteArray(encryptedBytes)
	}
}

export type EncryptedParsedValue = ParsedValue<EncryptedParsedInstance>

export class EncryptedParsedInstance implements DeepEquals {
	private readonly parsedInstance: Map<AttributeId, EncryptedParsedValue> = new Map()

	private constructor(
		private readonly typeModel: TypeModel,
		private readonly direction: InstanceDirection,
	) {}

	public getTypeRef(): TypeRef<unknown> {
		return new TypeRef(this.typeModel.app, this.typeModel.id)
	}

	public getInstanceTypeId(): InstanceTypeId {
		return {
			app: this.typeModel.app,
			id: this.typeModel.id,
			name: this.typeModel.name,
		} satisfies InstanceTypeId
	}

	public static incomingFromServer(typeModel: ServerTypeModel): EncryptedParsedInstance {
		return new EncryptedParsedInstance(typeModel, InstanceDirection.IncomingFromServer)
	}

	public static outgoingToServer(typeModel: ClientTypeModel): EncryptedParsedInstance {
		return new EncryptedParsedInstance(typeModel, InstanceDirection.OutgoingToServer)
	}

	ensureOutgoing(): ClientTypeModel {
		assert(this.direction === InstanceDirection.OutgoingToServer, "Expected encryptedInstance to be originated from client")
		return this.typeModel as ClientTypeModel
	}

	ensureIncoming(): ServerTypeModel {
		assert(this.direction === InstanceDirection.IncomingFromServer, "Expected encryptedInstance to be originated from server")
		return this.typeModel as ServerTypeModel
	}

	public getAttributeByNameOrNull(attributeName: AttributeName): Nullable<EncryptedParsedValue> {
		const attrId = AttributeModel.getAttributeId(this.typeModel, attributeName)
		return isNotNull(attrId) ? assertNotNull(this.parsedInstance.get(attrId), `Attribute ${attributeName} not found in instance`) : null
	}
	public getAttributeByName(name: AttributeName): EncryptedParsedValue {
		return assertNotNull(this.getAttributeByNameOrNull(name))
	}

	public getAttributeByIdOrNull(attrId: AttributeId): Nullable<EncryptedParsedValue> {
		return this.parsedInstance.get(attrId) ?? null
	}

	public getAttributeById(attrId: AttributeId): EncryptedParsedValue {
		return assertNotNull(
			this.getAttributeByIdOrNull(attrId),
			`Attribute Id ${attrId} not found on instance of type ${this.typeModel.app}/${this.typeModel.name}`,
		)
	}

	public addAttributeById(attributeId: AttributeId, parsedValue: EncryptedParsedValue): this {
		this.parsedInstance.set(attributeId, parsedValue)
		return this
	}

	public addAttributeByName(attributeName: AttributeName, parsedValue: EncryptedParsedValue): this {
		const attributeId = assertNotNull(AttributeModel.getAttributeId(this.typeModel, attributeName), `Attribute ${attributeName} not found`)
		return this.addAttributeById(attributeId, parsedValue)
	}

	public addId(parsedValue: DecryptedParsedValue): this {
		if (parsedValue.isNull()) {
			// _id can be null when creating new instances of generateId, as they are generated on server
			return this.addAttributeByName("_id", ParsedValue.fromNull())
		}
		switch (getIdType(this.typeModel)) {
			case IdType.SingleId:
				return this.addAttributeByName("_id", ParsedValue.fromId(parsedValue.asId()))
			case IdType.IdTuple:
				return this.addAttributeByName("_id", ParsedValue.fromIdTuple(parsedValue.asIdTuple()))
		}
	}

	deepEquals(other: this): boolean {
		return (
			this.direction === other.direction && isSameTypeRef(this.getTypeRef(), other.getTypeRef()) && deepEqual(this.parsedInstance, other.parsedInstance)
		)
	}
}

export type DecryptedParsedValue = ParsedValue<DecryptedParsedInstance>

export class DecryptedParsedInstance implements DeepEquals {
	private constructor(
		private readonly direction: InstanceDirection,
		readonly typeModel: TypeModel,

		private readonly parsedInstance: Map<AttributeId, DecryptedParsedValue> = new Map(),
		private readonly _errors: Record<AttributeId, string> = {},
	) {}

	public getTypeRef(): TypeRef<unknown> {
		return new TypeRef(this.typeModel.app, this.typeModel.id)
	}

	public static incomingFromServer(typeModel: ServerTypeModel): DecryptedParsedInstance {
		return new DecryptedParsedInstance(InstanceDirection.IncomingFromServer, typeModel)
	}

	public static outgoingToServer(typeModel: ClientTypeModel): DecryptedParsedInstance {
		return new DecryptedParsedInstance(InstanceDirection.OutgoingToServer, typeModel)
	}

	public ensureIncoming(): ServerTypeModel {
		assert(this.direction === InstanceDirection.IncomingFromServer, `Expected instance to be incoming as DecryptedParsedInstance`)
		return this.typeModel as ServerTypeModel
	}

	public ensureOutgoing(): ClientTypeModel {
		assert(this.direction === InstanceDirection.OutgoingToServer, `Expected instance to be outgoing as EncryptedParsedInstance`)
		return this.typeModel as ClientTypeModel
	}

	public addAttribute(attributeId: AttributeId, parsedValue: ParsedValue<DecryptedParsedInstance>): this {
		this.parsedInstance.set(attributeId, parsedValue)
		return this
	}

	public addId(parsedValue: EncryptedParsedValue) {
		//FIXME double check that data transfer types always have IDs
		const attributeId = assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_id"))
		switch (getIdType(this.typeModel)) {
			case IdType.IdTuple:
				return this.addAttribute(attributeId, ParsedValue.fromIdTuple(parsedValue.asIdTuple()))

			case IdType.SingleId:
				return this.addAttribute(attributeId, ParsedValue.fromId(parsedValue.asId()))
		}
	}

	getAttributeByIdOrNull(attributeId: number): Nullable<DecryptedParsedValue> {
		return this.parsedInstance.get(attributeId) ?? null
	}

	public getAttributeById(attributeId: AttributeId): DecryptedParsedValue {
		return assertNotNull(this.getAttributeByIdOrNull(attributeId), `Not found: ${attributeId} on ${this.typeModel.app}/${this.typeModel.name}`)
	}

	public getAttributeByName(attributeName: AttributeName): DecryptedParsedValue {
		const attributeId = assertNotNull(
			AttributeModel.getAttributeId(this.typeModel, attributeName),
			`Attribute :${attributeName} not fount in: ${this.typeModel.app}/${this.typeModel.name}`,
		)
		return this.getAttributeById(attributeId)
	}

	// FIXME: always use addErrorByAttributeId and remove this method
	public addErrorByAttributeName(attributeName: AttributeName, errorValue: string): this {
		return this.addErrorByAttributeId(AttributeModel.getAttributeId(this.typeModel, attributeName)!, errorValue)
	}
	public addErrorByAttributeId(attributeId: AttributeId, errorValue: string): this {
		this._errors[attributeId] = errorValue
		return this
	}

	public hasError(attributeName: AttributeName | null = null): boolean {
		if (attributeName == null) {
			return Object.keys(this._errors).length > 0
		} else {
			const attributeId = AttributeModel.getAttributeId(this.typeModel, attributeName)
			return isNotNull(attributeId) && isNotNull(this._errors[attributeId])
		}
	}

	public getErrors(): Record<AttributeId, string> {
		return this._errors
	}

	clone(): DecryptedParsedInstance {
		return new DecryptedParsedInstance(this.direction, this.typeModel, this.parsedInstance, this._errors)
	}

	deepEquals(other: this): boolean {
		return (
			this.direction === other.direction && isSameTypeRef(this.getTypeRef(), other.getTypeRef()) && deepEqual(this.parsedInstance, other.parsedInstance)
		)
	}
}
