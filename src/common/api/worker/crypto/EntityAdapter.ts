import { BucketKey, BucketKeyTypeRef } from "../../entities/sys/TypeRefs"
import { assertNotNull, downcast, TypeRef } from "@tutao/tutanota-utils"
import type {
	ClientModelParsedInstance,
	EncryptedParsedInstance,
	Entity,
	ParsedInstance,
	ServerModelEncryptedParsedInstance,
	ServerModelParsedInstance,
	ServerTypeModel,
	TypeModel,
} from "../../common/EntityTypes"
import { AttributeModel } from "../../common/AttributeModel"
import { InstancePipeline } from "./InstancePipeline"
import { Nullable } from "@tutao/tutanota-utils"

export class EntityAdapter implements Entity {
	isAdapter = true

	private constructor(
		readonly typeModel: TypeModel,
		readonly parsedInstance: EncryptedParsedInstance | ParsedInstance,
		public readonly bucketKey: BucketKey | null,
	) {}

	static async from(typeModel: TypeModel, parsedInstance: EncryptedParsedInstance | ParsedInstance, instancePipeline: InstancePipeline) {
		let bucketKey: Nullable<BucketKey> = null
		const bucketKeyParsedInstance = downcast<ServerModelParsedInstance>(
			AttributeModel.getAttributeorNull<ServerModelEncryptedParsedInstance | ServerModelParsedInstance>(parsedInstance, "bucketKey", typeModel)?.[0],
		)
		if (bucketKeyParsedInstance) {
			// since, bucket key is really not encrypted entity, we can just parse it to instance
			bucketKey = await instancePipeline.modelMapper.mapToInstance<BucketKey>(BucketKeyTypeRef, bucketKeyParsedInstance)
		}
		return new EntityAdapter(typeModel, parsedInstance, bucketKey)
	}

	get _id(): Id | IdTuple {
		return assertNotNull(AttributeModel.getAttributeorNull<Id | IdTuple>(this.parsedInstance, "_id", this.typeModel))
	}

	get _type(): TypeRef<this> {
		return new TypeRef(this.typeModel.app, this.typeModel.id)
	}

	get _ownerEncSessionKey(): null | Uint8Array {
		return AttributeModel.getAttributeorNull<Uint8Array>(this.parsedInstance, "_ownerEncSessionKey", this.typeModel)
	}

	set _ownerEncSessionKey(value: Uint8Array) {
		this.parsedInstance[assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_ownerEncSessionKey"))] = value
	}

	get _ownerKeyVersion(): null | NumberString {
		return AttributeModel.getAttributeorNull<NumberString>(this.parsedInstance, "_ownerKeyVersion", this.typeModel)
	}

	set _ownerKeyVersion(value: NumberString) {
		this.parsedInstance[assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_ownerKeyVersion"))] = value
	}

	get ownerEncSessionKey(): null | Uint8Array {
		return AttributeModel.getAttributeorNull<Uint8Array>(this.parsedInstance, "ownerEncSessionKey", this.typeModel)
	}

	get ownerKeyVersion(): null | NumberString {
		return AttributeModel.getAttributeorNull<NumberString>(this.parsedInstance, "ownerKeyVersion", this.typeModel)
	}

	get ownerEncSessionKeyVersion(): null | NumberString {
		return AttributeModel.getAttributeorNull<NumberString>(this.parsedInstance, "ownerEncSessionKeyVersion", this.typeModel)
	}

	get _ownerGroup(): null | Id {
		return AttributeModel.getAttributeorNull<NumberString>(this.parsedInstance, "_ownerGroup", this.typeModel)
	}

	set _ownerGroup(value: Id) {
		this.parsedInstance[assertNotNull(AttributeModel.getAttributeId(this.typeModel, "_ownerGroup"))] = value
	}

	get _permissions(): null | Id {
		return AttributeModel.getAttributeorNull<NumberString>(this.parsedInstance, "_permissions", this.typeModel)
	}

	get _listEncSessionKey(): null | Uint8Array {
		return AttributeModel.getAttributeorNull<Uint8Array>(this.parsedInstance, "_listEncSessionKey", this.typeModel)
	}

	get _ownerPublicEncSessionKey(): null | Uint8Array {
		return AttributeModel.getAttributeorNull<Uint8Array>(this.parsedInstance, "_ownerPublicEncSessionKey", this.typeModel)
	}

	get _publicCryptoProtocolVersion(): null | NumberString {
		return AttributeModel.getAttributeorNull<NumberString>(this.parsedInstance, "_publicCryptoProtocolVersion", this.typeModel)
	}
}
