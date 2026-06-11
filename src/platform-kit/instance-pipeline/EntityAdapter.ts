import { assertNotNull, downcast, Nullable } from "@tutao/utils"
import { AttributeModel, ParsedValue, TypeRef } from "../meta"
import { ModelMapper } from "./ModelMapper"
import { EncryptedParsedInstance, Entity, ServerModelEncryptedParsedInstance, ServerModelParsedInstance, TypeModel } from "../meta/EntityTypes"
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
		const bucketKeyParsedInstance = downcast<ServerModelParsedInstance>(
			AttributeModel.getAttributeorNull<ServerModelEncryptedParsedInstance>(encryptedParsedInstance, "bucketKey", typeModel)?.[0],
		)
		if (bucketKeyParsedInstance) {
			// since, bucket key is really not encrypted entity, we can just parse it to instance
			bucketKey = await modelMapper.mapToInstance<BucketKey>(BucketKeyTypeRef, bucketKeyParsedInstance)
		}
		return new EntityAdapter(typeModel, encryptedParsedInstance, bucketKey)
	}

	get _id(): Id | IdTuple {
		return assertNotNull(AttributeModel.getAttributeorNull<Id | IdTuple>(this.encryptedParsedInstance, "_id", this.typeModel))
	}

	get _type(): TypeRef<this> {
		return new TypeRef(this.typeModel.app, this.typeModel.id)
	}

	get _ownerEncSessionKey(): null | Uint8Array {
		return AttributeModel.getAttributeorNull<Uint8Array>(this.encryptedParsedInstance, "_ownerEncSessionKey", this.typeModel)
	}

	set _ownerEncSessionKey(value: ParsedValue) {
		const _isByteArray = value.getByteArray()
		this.encryptedParsedInstance[assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_ownerEncSessionKey"))] = value
	}

	get _ownerKeyVersion(): null | NumberString {
		return AttributeModel.getAttributeorNull<NumberString>(this.encryptedParsedInstance, "_ownerKeyVersion", this.typeModel)
	}

	set _ownerKeyVersion(value: NumberString) {
		this.encryptedParsedInstance[assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_ownerKeyVersion"))] = value
	}

	get _kdfNonce(): null | Uint8Array {
		return AttributeModel.getAttributeorNull<Uint8Array>(this.encryptedParsedInstance, "_kdfNonce", this.typeModel)
	}

	set _kdfNonce(value: Uint8Array) {
		this.encryptedParsedInstance[assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_kdfNonce"))] = value
	}

	get ownerEncSessionKey(): null | Uint8Array {
		return AttributeModel.getAttributeorNull<Uint8Array>(this.encryptedParsedInstance, "ownerEncSessionKey", this.typeModel)
	}

	get ownerKeyVersion(): null | NumberString {
		return AttributeModel.getAttributeorNull<NumberString>(this.encryptedParsedInstance, "ownerKeyVersion", this.typeModel)
	}

	get ownerEncSessionKeyVersion(): null | NumberString {
		return AttributeModel.getAttributeorNull<NumberString>(this.encryptedParsedInstance, "ownerEncSessionKeyVersion", this.typeModel)
	}

	get _ownerGroup(): null | Id {
		return AttributeModel.getAttributeorNull<NumberString>(this.encryptedParsedInstance, "_ownerGroup", this.typeModel)
	}

	set _ownerGroup(value: Id) {
		this.encryptedParsedInstance[assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_ownerGroup"))] = value
	}

	get _permissions(): null | Id {
		return AttributeModel.getAttributeorNull<NumberString>(this.encryptedParsedInstance, "_permissions", this.typeModel)
	}

	get _listEncSessionKey(): null | Uint8Array {
		return AttributeModel.getAttributeorNull<Uint8Array>(this.encryptedParsedInstance, "_listEncSessionKey", this.typeModel)
	}

	get _ownerPublicEncSessionKey(): null | Uint8Array {
		return AttributeModel.getAttributeorNull<Uint8Array>(this.encryptedParsedInstance, "_ownerPublicEncSessionKey", this.typeModel)
	}

	get _publicCryptoProtocolVersion(): null | NumberString {
		return AttributeModel.getAttributeorNull<NumberString>(this.encryptedParsedInstance, "_publicCryptoProtocolVersion", this.typeModel)
	}
}
