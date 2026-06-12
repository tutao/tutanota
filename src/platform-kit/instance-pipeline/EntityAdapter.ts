import { assertNotNull, Nullable } from "@tutao/utils"
import { AttributeModel, ParsedValue, TypeRef } from "../meta"
import { ModelMapper } from "./ModelMapper"
import { EncryptedParsedInstance, Entity, TypeModel } from "../meta/EntityTypes"
import { BucketKey, BucketKeyTypeRef } from "../../entities/sys/TypeRefs"

export class EntityAdapter implements Entity {
	isAdapter = true

	private constructor(
		readonly typeModel: TypeModel,
		readonly encryptedParsedInstance: EncryptedParsedInstance,
		public readonly bucketKey: BucketKey | null,
	) {}

	static async from(typeModel: TypeModel, encryptedParsedInstance: EncryptedParsedInstance, modelMapper: ModelMapper) {
		let bucketKey: Nullable<BucketKey> = null
		const bucketKeyParsedInstance =
			AttributeModel.getAttributeOrNull(encryptedParsedInstance, "bucketKey", typeModel)
				.getArray()
				.map((a) => a.getSeverAggregate())
				.at(0) ?? null

		if (bucketKeyParsedInstance) {
			// since, bucket key is really not encrypted entity, we can just parse it to instance
			bucketKey = await modelMapper.mapToInstance<BucketKey>(BucketKeyTypeRef, bucketKeyParsedInstance)
		}
		return new EntityAdapter(typeModel, encryptedParsedInstance, bucketKey)
	}

	get _id(): Id | IdTuple {
		return assertNotNull(AttributeModel.getAttributeOrNull(this.encryptedParsedInstance, "_id", this.typeModel)) as any
	}

	get _type(): TypeRef<this> {
		return new TypeRef(this.typeModel.app, this.typeModel.id)
	}

	get _ownerEncSessionKey(): null | Uint8Array {
		return AttributeModel.getAttributeOrNull(this.encryptedParsedInstance, "_ownerEncSessionKey", this.typeModel).byteArray
	}

	set _ownerEncSessionKey(value: ParsedValue) {
		const _isByteArray = value.getByteArray()
		this.encryptedParsedInstance[assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_ownerEncSessionKey"))] = value
	}

	get _ownerKeyVersion(): null | NumberString {
		return AttributeModel.getAttributeOrNull(this.encryptedParsedInstance, "_ownerKeyVersion", this.typeModel).stringValue
	}

	set _ownerKeyVersion(value: NumberString) {
		this.encryptedParsedInstance[assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_ownerKeyVersion"))] = ParsedValue.fromString(value)
	}

	get _kdfNonce(): null | Uint8Array {
		return AttributeModel.getAttributeOrNull(this.encryptedParsedInstance, "_kdfNonce", this.typeModel).byteArray
	}

	set _kdfNonce(value: Uint8Array) {
		this.encryptedParsedInstance[assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_kdfNonce"))] = ParsedValue.fromBytes(value)
	}

	get ownerEncSessionKey(): null | Uint8Array {
		return AttributeModel.getAttributeOrNull(this.encryptedParsedInstance, "ownerEncSessionKey", this.typeModel).byteArray
	}

	get ownerKeyVersion(): null | NumberString {
		return AttributeModel.getAttributeOrNull(this.encryptedParsedInstance, "ownerKeyVersion", this.typeModel).stringValue
	}

	get ownerEncSessionKeyVersion(): null | NumberString {
		return AttributeModel.getAttributeOrNull(this.encryptedParsedInstance, "ownerEncSessionKeyVersion", this.typeModel).stringValue
	}

	get _ownerGroup(): null | Id {
		return AttributeModel.getAttributeOrNull(this.encryptedParsedInstance, "_ownerGroup", this.typeModel).stringValue
	}

	set _ownerGroup(value: Id) {
		this.encryptedParsedInstance[assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_ownerGroup"))] = ParsedValue.fromId(value)
	}

	get _permissions(): null | Id {
		return AttributeModel.getAttributeOrNull(this.encryptedParsedInstance, "_permissions", this.typeModel).stringValue
	}

	get _listEncSessionKey(): null | Uint8Array {
		return AttributeModel.getAttributeOrNull(this.encryptedParsedInstance, "_listEncSessionKey", this.typeModel).byteArray
	}

	get _ownerPublicEncSessionKey(): null | Uint8Array {
		return AttributeModel.getAttributeOrNull(this.encryptedParsedInstance, "_ownerPublicEncSessionKey", this.typeModel).byteArray
	}

	get _publicCryptoProtocolVersion(): null | NumberString {
		return AttributeModel.getAttributeOrNull(this.encryptedParsedInstance, "_publicCryptoProtocolVersion", this.typeModel).stringValue
	}
}
