import { create, Stripped, StrippedEntity } from "../../common/utils/EntityUtils.js"
import { TypeRef } from "@tutao/tutanota-utils"
import { typeModels } from "./TypeModels.js"


export const PersistenceResourcePostReturnTypeRef: TypeRef<PersistenceResourcePostReturn> = new TypeRef("base", 0)

export function createPersistenceResourcePostReturn(values: StrippedEntity<PersistenceResourcePostReturn>): PersistenceResourcePostReturn {
	return Object.assign(create(typeModels[PersistenceResourcePostReturnTypeRef.typeId], PersistenceResourcePostReturnTypeRef), values)
}

export type PersistenceResourcePostReturn = {
	_type: TypeRef<PersistenceResourcePostReturn>;

	_format: NumberString;
	generatedId: null | Id;
	permissionListId: Id;
}
export const ApplicationTypesGetOutTypeRef: TypeRef<ApplicationTypesGetOut> = new TypeRef("base", 4)

export function createApplicationTypesGetOut(values: StrippedEntity<ApplicationTypesGetOut>): ApplicationTypesGetOut {
	return Object.assign(create(typeModels[ApplicationTypesGetOutTypeRef.typeId], ApplicationTypesGetOutTypeRef), values)
}

export type ApplicationTypesGetOut = {
	_type: TypeRef<ApplicationTypesGetOut>;

	_format: NumberString;
	applicationTypesJson: string;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;
}
