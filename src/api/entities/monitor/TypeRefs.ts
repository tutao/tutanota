import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef} from "@tutao/tutanota-utils"
import {typeModels} from "./TypeModels.js"


export const ApprovalMailTypeRef: TypeRef<ApprovalMail> = new TypeRef("monitor", "ApprovalMail")

export function createApprovalMail(values?: Partial<ApprovalMail>): ApprovalMail {
	return Object.assign(create(typeModels.ApprovalMail, ApprovalMailTypeRef), values)
}

export type ApprovalMail = {
	_type: TypeRef<ApprovalMail>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	date: null | Date;
	range: null | string;
	text: string;

	customer:  null | Id;
}
export const ReadCounterDataTypeRef: TypeRef<ReadCounterData> = new TypeRef("monitor", "ReadCounterData")

export function createReadCounterData(values?: Partial<ReadCounterData>): ReadCounterData {
	return Object.assign(create(typeModels.ReadCounterData, ReadCounterDataTypeRef), values)
}

export type ReadCounterData = {
	_type: TypeRef<ReadCounterData>;

	_format: NumberString;
	monitor: string;
	owner: Id;
}
export const ReadCounterReturnTypeRef: TypeRef<ReadCounterReturn> = new TypeRef("monitor", "ReadCounterReturn")

export function createReadCounterReturn(values?: Partial<ReadCounterReturn>): ReadCounterReturn {
	return Object.assign(create(typeModels.ReadCounterReturn, ReadCounterReturnTypeRef), values)
}

export type ReadCounterReturn = {
	_type: TypeRef<ReadCounterReturn>;

	_format: NumberString;
	value: null | NumberString;
}
export const WriteCounterDataTypeRef: TypeRef<WriteCounterData> = new TypeRef("monitor", "WriteCounterData")

export function createWriteCounterData(values?: Partial<WriteCounterData>): WriteCounterData {
	return Object.assign(create(typeModels.WriteCounterData, WriteCounterDataTypeRef), values)
}

export type WriteCounterData = {
	_type: TypeRef<WriteCounterData>;

	_format: NumberString;
	column: Id;
	counterType: null | NumberString;
	row: string;
	value: NumberString;
}
