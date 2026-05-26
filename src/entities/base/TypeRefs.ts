import { TypeRef } from "../../platform-kits/meta/TypeRef.js"


export const PersistenceResourcePostReturnTypeRef: TypeRef<PersistenceResourcePostReturn> = new TypeRef("base", 0)



export type PersistenceResourcePostReturn = {
	_type: TypeRef<PersistenceResourcePostReturn>;
	_original?: PersistenceResourcePostReturn

	_format: NumberString;
	generatedId: null | Id;
	permissionListId: Id;
}
