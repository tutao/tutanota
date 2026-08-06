import { create } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { ListElementId, ElementId } from "@tutao/meta"
import { default as typeModels } from "./TypeModels.js"
import { Nullable } from "@tutao/utils"


export const PersistenceResourcePostReturnTypeRef: TypeRef<PersistenceResourcePostReturn> = new TypeRef("base", 0)

export function createPersistenceResourcePostReturn(values: PersistenceResourcePostReturnParams): PersistenceResourcePostReturn {
    return Object.assign(create(typeModels[PersistenceResourcePostReturnTypeRef.typeId], PersistenceResourcePostReturnTypeRef), values)
}


export type PersistenceResourcePostReturnParams = {


	generatedId: null | Id;
	permissionListId: Id;
	

}

export type PersistenceResourcePostReturn = {
    // == values

	_format: NumberString;
	generatedId: null | Id;
	permissionListId: Id;
    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PersistenceResourcePostReturn>;
    _original: Nullable<PersistenceResourcePostReturn>
    isAdapter: false,
}
