import { assertNotNull, downcast, Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { BucketKey, BucketKeyTypeRef, Permission } from "../../entities/sys/TypeRefs"
import { AesKey } from "@tutao/tutanota-crypto"
import { Base64, TypeRef } from "@tutao/tutanota-utils"
import type { EncryptedParsedInstance, ParsedInstance, SomeEntity, TypeModel } from "../../common/EntityTypes"
import { InstanceMapper } from "./InstanceMapper"
import { VersionedEncryptedKey } from "./CryptoWrapper"
import { elementIdPart } from "../../common/utils/EntityUtils"
import { AttributeModel } from "../../common/EntityFunctions"
import { parseKeyVersion } from "../facades/KeyLoaderFacade"
import { PermissionType } from "../../common/TutanotaConstants"
import { typeRefToRestPath } from "../rest/EntityRestClient"
import { createTestEntity } from "../../../../../test/tests/TestUtils"

export class InstanceWrapper {
	public readonly elementId: Nullable<Id>
	public publicOrExternalPermission: Nullable<Permission>
	public symmetricOrPublicSymmetricPermission: Nullable<Permission>
	public resolvedSessionKey: Nullable<AesKey>

	private constructor(
		private readonly localInstance: boolean, // local instances are created on the client or read from offline DB. They have not directly been retrieved from the server
		public readonly typeRef: TypeRef<SomeEntity>,
		public readonly typeModel: TypeModel,
		private readonly instanceMapper: InstanceMapper,
		public readonly id: Nullable<Id | IdTuple>,
		// fixme: make this private?
		public readonly instance: ParsedInstance | EncryptedParsedInstance,
		public readonly permissionId: Nullable<Id>,
		public _ownerGroup: Nullable<Id>,
		public readonly ownerEncSessionKey: Nullable<VersionedEncryptedKey>,
		public _ownerEncSessionKey: Nullable<VersionedEncryptedKey>,
		public readonly listEncSessionKey: Nullable<Base64>, // legacy; only used from migrating GroupInfo from list to ownerEncSessionKey
		public readonly bucketKey: Nullable<BucketKey>,
	) {
		if (id) {
			this.elementId = typeof id == "string" ? id : elementIdPart(id)
		} else {
			this.elementId = null
		}

		this.symmetricOrPublicSymmetricPermission = null
		this.publicOrExternalPermission = null
		this.resolvedSessionKey = null
	}

	static async fromParsedInstance(instanceMapper: InstanceMapper, typeModel: TypeModel, decryptedInstance: ParsedInstance): Promise<InstanceWrapper> {
		const localInstance = true
		return await this.from(typeModel, decryptedInstance, instanceMapper, localInstance)
	}

	static async fromEncryptedParsedInstance(
		instanceMapper: InstanceMapper,
		typeModel: TypeModel,
		encryptedParsedInstance: EncryptedParsedInstance,
	): Promise<InstanceWrapper> {
		const localInstance = false
		return await this.from(typeModel, encryptedParsedInstance, instanceMapper, localInstance)
	}

	private static async from(typeModel: TypeModel, encryptedParsedInstance: EncryptedParsedInstance, instanceMapper: InstanceMapper, localInstance: boolean) {
		const typeRef = new TypeRef<SomeEntity>(typeModel.app, typeModel.id)

		const id = InstanceWrapper.getAttributeorNull<Id | IdTuple>(encryptedParsedInstance, "_id", typeModel)
		if (!localInstance) {
			assertNotNull(id)
		}
		const _ownerGroup = InstanceWrapper.getAttributeorNull<Id>(encryptedParsedInstance, "_ownerGroup", typeModel)
		const permission = InstanceWrapper.getAttributeorNull<Id>(encryptedParsedInstance, "_permissions", typeModel)
		const listEncSessionKey = InstanceWrapper.getAttributeorNull<Base64>(encryptedParsedInstance, "_listEncSessionKey", typeModel)

		let ownerEncSessionKey: Nullable<VersionedEncryptedKey> = null
		const ownerEncSessionKeyPart = InstanceWrapper.getAttributeorNull<Uint8Array>(encryptedParsedInstance, "ownerEncSessionKey", typeModel)
		if (ownerEncSessionKeyPart) {
			const ownerEncSessionKeyVersion = InstanceWrapper.getAttributeorNull<number>(encryptedParsedInstance, "ownerEncSessionKeyVersion", typeModel) ?? 0
			ownerEncSessionKey = {
				key: ownerEncSessionKeyPart,
				encryptingKeyVersion: parseKeyVersion(ownerEncSessionKeyVersion.toString()),
			}
		}

		let _ownerEncSessionKey: Nullable<VersionedEncryptedKey> = null
		const _ownerEncSessionKeyPart = InstanceWrapper.getAttributeorNull<Uint8Array>(encryptedParsedInstance, "_ownerEncSessionKey", typeModel)
		if (_ownerEncSessionKeyPart) {
			const _ownerEncSessionKeyVersion = InstanceWrapper.getAttributeorNull<number>(encryptedParsedInstance, "_ownerEncSessionKeyVersion", typeModel) ?? 0
			_ownerEncSessionKey = {
				key: _ownerEncSessionKeyPart,
				encryptingKeyVersion: parseKeyVersion(_ownerEncSessionKeyVersion.toString()),
			}
		}

		let bucketKey: Nullable<BucketKey> = null
		const bucketKeyLiteral = InstanceWrapper.getAttributeorNull<EncryptedParsedInstance>(encryptedParsedInstance, "bucketKey", typeModel)
		if (bucketKeyLiteral) {
			// since, bucket key is really not encrypted entity, we can just parse it to instance
			bucketKey = await instanceMapper.uncloak<BucketKey>(BucketKeyTypeRef, bucketKeyLiteral)
		}

		return new InstanceWrapper(
			localInstance,
			typeRef,
			typeModel,
			instanceMapper,
			id,
			encryptedParsedInstance,
			permission,
			_ownerGroup,
			ownerEncSessionKey,
			_ownerEncSessionKey,
			listEncSessionKey,
			bucketKey,
		)
	}

	async provideDecryptedInstance(resolvedSessionKey: AesKey): Promise<SomeEntity> {
		const typeRef = downcast<TypeRef<SomeEntity>>(this.typeRef)

		if (this.isLocalInstance()) {
			const parsedInstance = downcast<ParsedInstance>(this.instance)
			return await this.instanceMapper.uncloak(typeRef, parsedInstance)
		} else {
			const encryptedEntity = downcast<EncryptedParsedInstance>(this.instance)
			const parsedInstance = await this.instanceMapper.decrypt(encryptedEntity, resolvedSessionKey)
			return await this.instanceMapper.uncloak(typeRef, parsedInstance)
		}
	}

	updatePermission(loadedPermissions: Permission[]) {
		this.publicOrExternalPermission = loadedPermissions.find((p) => p.type === PermissionType.Public || p.type === PermissionType.External) ?? null
		this.symmetricOrPublicSymmetricPermission =
			loadedPermissions.find((p) => p.type === PermissionType.Symmetric || p.type === PermissionType.Public_Symmetric) ?? null
	}

	setResolvedSessionKey(sessionKey: AesKey) {
		this.resolvedSessionKey = sessionKey
	}

	set_ownerEncSessionKey(key: VersionedEncryptedKey) {
		this._ownerEncSessionKey = key

		const _ownerEncSessionKeyFieldId = assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_ownerEncSessionKey"))
		const _ownerEncSessionKeyVersionFieldId = assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_ownerEncSessionKeyVersion"))
		this.instance[_ownerEncSessionKeyFieldId] = key.key
		this.instance[_ownerEncSessionKeyVersionFieldId] = key.encryptingKeyVersion
	}

	set_ownerGroup(ownerGroup: Id) {
		this._ownerGroup = ownerGroup

		const _ownerGroupId = assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_ownerGroup"))
		this.instance[_ownerGroupId] = ownerGroup
	}

	async toWireFormat(): Promise<string> {
		let encryptedParsedInstance: EncryptedParsedInstance
		if (this.isLocalInstance()) {
			encryptedParsedInstance = await this.instanceMapper.encrypt(this.typeModel, this.instance)
		} else {
			encryptedParsedInstance = this.instance
		}

		const untypedInstance = await this.instanceMapper.applyDbTypes(this.typeModel, encryptedParsedInstance)
		const wireFormat = JSON.stringify(untypedInstance)
		return wireFormat
	}

	errorPrintableInstance() {
		return `${JSON.stringify(this.typeRef)} with Id: ${this.id}`
	}

	isLocalInstance() {
		return this.localInstance
	}

	async getInstanceUpdateServerPath(): Promise<string> {
		const typeRestPath = await typeRefToRestPath(this.typeRef)
		const id = assertNotNull(this.id)
		const idPath = typeof id == "string" ? id : id.join("/")
		return typeRestPath + "/" + idPath
	}

	static getAttributeorNull<T>(instance: EncryptedParsedInstance, attrName: string, typeModel: TypeModel): Nullable<T> {
		const attrId = AttributeModel.getAttributeId(typeModel, attrName)
		if (attrId) {
			const value = instance[attrId]
			return downcast<T>(value)
		} else {
			return null
		}
	}
}
