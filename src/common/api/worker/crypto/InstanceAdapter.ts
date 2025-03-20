import {BucketKey, BucketKeyTypeRef} from "../../entities/sys/TypeRefs"
import {assertNotNull, downcast, TypeRef} from "@tutao/tutanota-utils"
import type {EncryptedParsedInstance, ParsedInstance, SomeEntity, TypeModel} from "../../common/EntityTypes"
import { AttributeModel } from "../../common/AttributeModel"
import {InstancePipeline} from "./InstancePipeline";
import {Nullable} from "@tutao/tutanota-utils/dist/Utils";

export class InstanceAdapter {
	public constructor(
		private readonly typeModel: TypeModel,
		private readonly encryptedParsedInstance: EncryptedParsedInstance,
		public readonly bucketKey: BucketKey | null,
	) {}

	static async from(typeModel: TypeModel, encryptedParsedInstance: EncryptedParsedInstance, instancePipeline: InstancePipeline) {
		let bucketKey: Nullable<BucketKey> = null
		const bucketKeyLiteral = downcast<ParsedInstance>(
			AttributeModel.getAttributeorNull<EncryptedParsedInstance>(encryptedParsedInstance, "bucketKey", typeModel),
		)
		if (bucketKeyLiteral) {
			// since, bucket key is really not encrypted entity, we can just parse it to instance
			bucketKey = await instancePipeline.modelMapper.applyClientModel<BucketKey>(BucketKeyTypeRef, bucketKeyLiteral)
		}
		return new InstanceAdapter(typeModel, encryptedParsedInstance, bucketKey)
	}

	get _id(): Id | IdTuple {
		return assertNotNull(AttributeModel.getAttributeorNull<Id | IdTuple>(this.encryptedParsedInstance, "_id", this.typeModel))
	}

	get _type(): TypeRef<SomeEntity> {
		return new TypeRef(this.typeModel.app, this.typeModel.id)
	}

	get _ownerEncSessionKey(): null | Uint8Array {
		return AttributeModel.getAttributeorNull<Uint8Array>(this.encryptedParsedInstance, "_ownerEncSessionKey", this.typeModel)
	}

	get _ownerKeyVersion(): null | NumberString {
		return AttributeModel.getAttributeorNull<NumberString>(this.encryptedParsedInstance, "_ownerKeyVersion", this.typeModel) ?? "0"
	}

	get ownerEncSessionKey(): null | Uint8Array {
		return AttributeModel.getAttributeorNull<Uint8Array>(this.encryptedParsedInstance, "ownerEncSessionKey", this.typeModel)
	}

	get ownerEncSessionKeyVersion() : null | NumberString  {
		return AttributeModel.getAttributeorNull<NumberString>(this.encryptedParsedInstance, "ownerEncSessionKeyVersion", this.typeModel) ?? "0"
	}


	get _ownerGroup(): null | Id {
		return AttributeModel.getAttributeorNull<NumberString>(this.encryptedParsedInstance, "_ownerGroup", this.typeModel)
	}

	get _permissions(): null | Id {
		return AttributeModel.getAttributeorNull<NumberString>(this.encryptedParsedInstance, "_permissions", this.typeModel)
	}
}
