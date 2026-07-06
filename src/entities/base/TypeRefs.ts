import { create, StrippedEntity } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { default as typeModels } from "./TypeModels.js"
import { AggregatedEntity, ElementEntity, Entity, ListElementEntity, BlobElementEntity, DataTransferEntity, AttributeId } from "@tutao/meta"


export const PersistenceResourcePostReturnTypeRef: TypeRef<PersistenceResourcePostReturn> = new TypeRef("base", 0)

export function createPersistenceResourcePostReturn(values: StrippedEntity<PersistenceResourcePostReturn>): PersistenceResourcePostReturn {
    return Object.assign(create(typeModels[PersistenceResourcePostReturnTypeRef.typeId], PersistenceResourcePostReturnTypeRef), values)
}

export type PersistenceResourcePostReturnParams = {

	_format: NumberString;
	generatedId: null | Id;
	permissionListId: Id;
}

export class PersistenceResourcePostReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PersistenceResourcePostReturn> { return PersistenceResourcePostReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[1] }
	get generatedId(): null | Id { return this._attrs[2] }
	get permissionListId(): Id { return this._attrs[3] }
    set permissionListId(v: Id) { this._attrs[3] = v }
	
}
