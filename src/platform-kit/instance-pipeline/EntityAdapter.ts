import { assertNotNull, isNotNull, Nullable } from "@tutao/utils"
import { AnyEntityId, Entity, ServerTypeModel, TypeRef } from "@tutao/meta"
import { ModelMapper } from "./ModelMapper"
import { BucketKey } from "@tutao/entities/sys"
import { CryptoMapper, EncryptedParsedInstance } from "./CryptoMapper"
import { ParsedValue } from "./ParsedValue"

export class EntityAdapter implements Entity {
	isAdapter = true

	private constructor(
		public readonly typeModel: ServerTypeModel,
		private readonly encryptedParsedInstance: EncryptedParsedInstance,
		readonly bucketKey: BucketKey | null,
	) {}

	static async fromEncryptedParsedInstance(
		encryptedParsedInstance: EncryptedParsedInstance,
		modelMapper: ModelMapper,
		cryptoMapper: CryptoMapper,
	): Promise<EntityAdapter> {
		let bucketKey: Nullable<BucketKey> = null
		const encBucketKeyParsedInstance = encryptedParsedInstance.getAttributeByNameOrNull("bucketKey")?.getNullWhenNull()?.asNestedObjList().at(0) ?? null
		if (isNotNull(encBucketKeyParsedInstance)) {
			// since, bucket key is really not encrypted entity, we can just parse it to instance
			const decryptedBucketKey = await cryptoMapper.decryptParsedInstance(encBucketKeyParsedInstance, null, null, null)
			bucketKey = await modelMapper.mapToInstance<BucketKey>(decryptedBucketKey)
		}

		return new EntityAdapter(encryptedParsedInstance.ensureIncoming(), encryptedParsedInstance, bucketKey)
	}

	public getWrappedEncryptedInstance(): EncryptedParsedInstance {
		return this.encryptedParsedInstance
	}

	get _id(): AnyEntityId {
		return assertNotNull(this.encryptedParsedInstance.getAttributeByNameOrNull("_id")).asAnyEntityId()
	}

	get _type(): TypeRef<this> {
		return new TypeRef(this.typeModel.app, this.typeModel.id)
	}

	get _ownerEncSessionKey(): null | Uint8Array {
		return this.encryptedParsedInstance.getAttributeByNameOrNull("_ownerEncSessionKey")?.getNullWhenNull()?.asByteArray() ?? null
	}

	set _ownerEncSessionKey(value: Uint8Array) {
		this.encryptedParsedInstance.addAttributeByName("_ownerEncSessionKey", ParsedValue.fromByteArray(value))
	}

	get _ownerKeyVersion(): null | NumberString {
		return this.encryptedParsedInstance.getAttributeByNameOrNull("_ownerKeyVersion")?.getNullWhenNull()?.asString() ?? null
	}

	set _ownerKeyVersion(value: NumberString) {
		this.encryptedParsedInstance.addAttributeByName("_ownerKeyVersion", ParsedValue.fromString(value))
	}

	get _kdfNonce(): null | Uint8Array {
		return this.encryptedParsedInstance.getAttributeByNameOrNull("_kdfNonce")?.getNullWhenNull()?.asByteArray() ?? null
	}

	set _kdfNonce(value: Uint8Array) {
		this.encryptedParsedInstance.addAttributeByName("_kdfNonce", ParsedValue.fromByteArray(value))
	}

	get ownerEncSessionKey(): null | Uint8Array {
		return this.encryptedParsedInstance.getAttributeByNameOrNull("ownerEncSessionKey")?.getNullWhenNull()?.asByteArray() ?? null
	}

	get ownerKeyVersion(): null | NumberString {
		return this.encryptedParsedInstance.getAttributeByNameOrNull("ownerKeyVersion")?.getNullWhenNull()?.asString() ?? null
	}

	get ownerEncSessionKeyVersion(): null | NumberString {
		return this.encryptedParsedInstance.getAttributeByNameOrNull("ownerEncSessionKeyVersion")?.getNullWhenNull()?.asString() ?? null
	}

	get _ownerGroup(): null | Id {
		return this.encryptedParsedInstance.getAttributeByNameOrNull("_ownerGroup")?.getNullWhenNull()?.asId() ?? null
	}

	set _ownerGroup(value: Id) {
		this.encryptedParsedInstance.addAttributeByName("_ownerGroup", ParsedValue.fromId(value))
	}

	get _permissions(): null | Id {
		return this.encryptedParsedInstance.getAttributeByNameOrNull("_permissions")?.getNullWhenNull()?.asId() ?? null
	}

	get _listEncSessionKey(): null | Uint8Array {
		return this.encryptedParsedInstance.getAttributeByNameOrNull("_listEncSessionKey")?.getNullWhenNull()?.asByteArray() ?? null
	}

	get _ownerPublicEncSessionKey(): null | Uint8Array {
		return this.encryptedParsedInstance.getAttributeByNameOrNull("_ownerPublicEncSessionKey")?.getNullWhenNull()?.asByteArray() ?? null
	}

	get _publicCryptoProtocolVersion(): null | NumberString {
		return this.encryptedParsedInstance.getAttributeByNameOrNull("_publicCryptoProtocolVersion")?.getNullWhenNull()?.asString() ?? null
	}
}
