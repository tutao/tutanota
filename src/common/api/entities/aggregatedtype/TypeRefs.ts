import { create, Stripped, StrippedEntity } from "../../common/utils/EntityUtils.js"
import { TypeRef } from "@tutao/tutanota-utils"
import { typeModels } from "./TypeModels.js"


export const Et1TypeRef: TypeRef<Et1> = new TypeRef("aggregatedtype", 17)

export function createEt1(values: StrippedEntity<Et1>): Et1 {
    return Object.assign(create(typeModels[Et1TypeRef.typeId], Et1TypeRef), values)
}

export type Et1 = {
	_type: TypeRef<Et1>;
	_errors: Object;
	_original?: Et1

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;

	oneAggregated: null | At2;
	anyAggregated: At2[];
}
export const At1TypeRef: TypeRef<At1> = new TypeRef("aggregatedtype", 25)

export function createAt1(values: StrippedEntity<At1>): At1 {
    return Object.assign(create(typeModels[At1TypeRef.typeId], At1TypeRef), values)
}

export type At1 = {
	_type: TypeRef<At1>;
	_original?: At1

	_id: Id;
}
export const At2TypeRef: TypeRef<At2> = new TypeRef("aggregatedtype", 35)

export function createAt2(values: StrippedEntity<At2>): At2 {
    return Object.assign(create(typeModels[At2TypeRef.typeId], At2TypeRef), values)
}

export type At2 = {
	_type: TypeRef<At2>;
	_original?: At2

	_id: Id;
	BytesValue: Uint8Array;
	StringValue: string;
	LongValue: NumberString;
	DateValue: Date;
	BooleanValue: boolean;

	oneResource: null | Id;
	anyResource: Id[];
	oneAggregated: null | At1;
	anyAggregated: At1[];
	oneList: null | IdTuple;
	anyList: IdTuple[];
}
