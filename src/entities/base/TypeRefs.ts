import { create } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { default as typeModels } from "./TypeModels.js"


export const PersistenceResourcePostReturnTypeRef: TypeRef<PersistenceResourcePostReturn> = new TypeRef("base", 0)

export function createPersistenceResourcePostReturn(values: PersistenceResourcePostReturnParams): PersistenceResourcePostReturn {
    return Object.assign(create(typeModels[PersistenceResourcePostReturnTypeRef.typeId], PersistenceResourcePostReturnTypeRef), values)
}

export type PersistenceResourcePostReturnParams = {


	generatedId: null | Id;
	permissionListId: Id;
}

export type PersistenceResourcePostReturn = {
	_type: TypeRef<PersistenceResourcePostReturn>;
	_original?: PersistenceResourcePostReturn

	_format: NumberString;
	generatedId: null | Id;
	permissionListId: Id;
}
