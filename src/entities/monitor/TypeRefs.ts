import { create } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { ListElementId, ElementId } from "@tutao/meta"
import { default as typeModels } from "./TypeModels.js"


export const ReadCounterDataTypeRef: TypeRef<ReadCounterData> = new TypeRef("monitor", 12)

export function createReadCounterData(values: ReadCounterDataParams): ReadCounterData {
    return Object.assign(create(typeModels[ReadCounterDataTypeRef.typeId], ReadCounterDataTypeRef), values)
}

export type ReadCounterDataParams = {


	rowName: string;
	columnName: null | Id;
	counterType: NumberString;
}

export type ReadCounterData = {
	_type: TypeRef<ReadCounterData>;
	_original?: ReadCounterData

	_format: NumberString;
	rowName: string;
	columnName: null | Id;
	counterType: NumberString;
}
export const ReadCounterReturnTypeRef: TypeRef<ReadCounterReturn> = new TypeRef("monitor", 16)

export function createReadCounterReturn(values: ReadCounterReturnParams): ReadCounterReturn {
    return Object.assign(create(typeModels[ReadCounterReturnTypeRef.typeId], ReadCounterReturnTypeRef), values)
}

export type ReadCounterReturnParams = {


	value: null | NumberString;

	counterValues: CounterValue[];
}

export type ReadCounterReturn = {
	_type: TypeRef<ReadCounterReturn>;
	_original?: ReadCounterReturn

	_format: NumberString;
	value: null | NumberString;

	counterValues: CounterValue[];
}
export const WriteCounterDataTypeRef: TypeRef<WriteCounterData> = new TypeRef("monitor", 49)

export function createWriteCounterData(values: WriteCounterDataParams): WriteCounterData {
    return Object.assign(create(typeModels[WriteCounterDataTypeRef.typeId], WriteCounterDataTypeRef), values)
}

export type WriteCounterDataParams = {


	row: string;
	column: Id;
	value: NumberString;
	counterType: null | NumberString;
}

export type WriteCounterData = {
	_type: TypeRef<WriteCounterData>;
	_original?: WriteCounterData

	_format: NumberString;
	row: string;
	column: Id;
	value: NumberString;
	counterType: null | NumberString;
}
export const ApprovalMailTypeRef: TypeRef<ApprovalMail> = new TypeRef("monitor", 221)

export function createApprovalMail(values: ApprovalMailParams): ApprovalMail {
    return Object.assign(create(typeModels[ApprovalMailTypeRef.typeId], ApprovalMailTypeRef), values)
}

export type ApprovalMailParams = {


	range: null | string;
	date: null | Date;
	text: string;

	customer: null | Id;
}

export type ApprovalMail = {
	_type: TypeRef<ApprovalMail>;
	_original?: ApprovalMail

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	range: null | string;
	date: null | Date;
	text: string;

	customer: null | Id;
}
export const CounterValueTypeRef: TypeRef<CounterValue> = new TypeRef("monitor", 300)

export function createCounterValue(values: CounterValueParams): CounterValue {
    return Object.assign(create(typeModels[CounterValueTypeRef.typeId], CounterValueTypeRef), values)
}

export type CounterValueParams = {


	counterId: Id;
	value: NumberString;
}

export type CounterValue = {
	_type: TypeRef<CounterValue>;
	_original?: CounterValue

	_id: Id;
	counterId: Id;
	value: NumberString;
}
export const ErrorReportFileTypeRef: TypeRef<ErrorReportFile> = new TypeRef("monitor", 305)

export function createErrorReportFile(values: ErrorReportFileParams): ErrorReportFile {
    return Object.assign(create(typeModels[ErrorReportFileTypeRef.typeId], ErrorReportFileTypeRef), values)
}

export type ErrorReportFileParams = {


	name: string;
	content: string;
}

export type ErrorReportFile = {
	_type: TypeRef<ErrorReportFile>;
	_original?: ErrorReportFile

	_id: Id;
	name: string;
	content: string;
}
export const ErrorReportDataTypeRef: TypeRef<ErrorReportData> = new TypeRef("monitor", 316)

export function createErrorReportData(values: ErrorReportDataParams): ErrorReportData {
    return Object.assign(create(typeModels[ErrorReportDataTypeRef.typeId], ErrorReportDataTypeRef), values)
}

export type ErrorReportDataParams = {


	time: Date;
	appVersion: string;
	clientType: NumberString;
	userId: null | string;
	errorClass: string;
	errorMessage: null | string;
	stackTrace: string;
	userMessage: null | string;
	additionalInfo: string;
}

export type ErrorReportData = {
	_type: TypeRef<ErrorReportData>;
	_original?: ErrorReportData

	_id: Id;
	time: Date;
	appVersion: string;
	clientType: NumberString;
	userId: null | string;
	errorClass: string;
	errorMessage: null | string;
	stackTrace: string;
	userMessage: null | string;
	additionalInfo: string;
}
export const ReportErrorInTypeRef: TypeRef<ReportErrorIn> = new TypeRef("monitor", 335)

export function createReportErrorIn(values: ReportErrorInParams): ReportErrorIn {
    return Object.assign(create(typeModels[ReportErrorInTypeRef.typeId], ReportErrorInTypeRef), values)
}

export type ReportErrorInParams = {



	data: ErrorReportData;
	files: ErrorReportFile[];
}

export type ReportErrorIn = {
	_type: TypeRef<ReportErrorIn>;
	_original?: ReportErrorIn

	_format: NumberString;

	data: ErrorReportData;
	files: ErrorReportFile[];
}
