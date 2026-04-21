import { TypeRef } from "../../TypeRef.js"
import { create, StrippedEntity } from "../../EntityUtils.js"
import { default as typeModels } from "./TypeModels.js"




export const PersistenceResourcePostReturnTypeRef: TypeRef<PersistenceResourcePostReturn> = new TypeRef("base", 0)

export function createPersistenceResourcePostReturn(values: StrippedEntity<PersistenceResourcePostReturn>): PersistenceResourcePostReturn {
    return Object.assign(create(typeModels[PersistenceResourcePostReturnTypeRef.typeId], PersistenceResourcePostReturnTypeRef), values)
}

export type PersistenceResourcePostReturn = {
	_type: TypeRef<PersistenceResourcePostReturn>;
	_original?: PersistenceResourcePostReturn

	_format: NumberString;
	generatedId: null | Id;
	permissionListId: Id;
}
