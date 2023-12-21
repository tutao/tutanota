import { create, Stripped, StrippedEntity } from "../../common/utils/EntityUtils.js"
import {TypeRef} from "@tutao/tutanota-utils"
import {typeModels} from "./TypeModels.js"


export const ApprovalMailTypeRef: TypeRef<ApprovalMail> = new TypeRef("monitor", "ApprovalMail")

export function createApprovalMail(values: StrippedEntity<ApprovalMail>): ApprovalMail {
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
export const CounterValueTypeRef: TypeRef<CounterValue> = new TypeRef("monitor", "CounterValue")

export function createCounterValue(values: StrippedEntity<CounterValue>): CounterValue {
	return Object.assign(create(typeModels.CounterValue, CounterValueTypeRef), values)
}

export type CounterValue = {
	_type: TypeRef<CounterValue>;

	_id: Id;
	counterId: Id;
	value: NumberString;
}
export const ErrorReportDataTypeRef: TypeRef<ErrorReportData> = new TypeRef("monitor", "ErrorReportData")

export function createErrorReportData(values: StrippedEntity<ErrorReportData>): ErrorReportData {
	return Object.assign(create(typeModels.ErrorReportData, ErrorReportDataTypeRef), values)
}

export type ErrorReportData = {
	_type: TypeRef<ErrorReportData>;

	_id: Id;
	additionalInfo: string;
	appVersion: string;
	clientType: NumberString;
	errorClass: string;
	errorMessage: null | string;
	stackTrace: string;
	time: Date;
	userId: null | string;
	userMessage: null | string;
}
export const ErrorReportFileTypeRef: TypeRef<ErrorReportFile> = new TypeRef("monitor", "ErrorReportFile")

export function createErrorReportFile(values: StrippedEntity<ErrorReportFile>): ErrorReportFile {
	return Object.assign(create(typeModels.ErrorReportFile, ErrorReportFileTypeRef), values)
}

export type ErrorReportFile = {
	_type: TypeRef<ErrorReportFile>;

	_id: Id;
	content: string;
	name: string;
}
export const ReadCounterDataTypeRef: TypeRef<ReadCounterData> = new TypeRef("monitor", "ReadCounterData")

export function createReadCounterData(values: StrippedEntity<ReadCounterData>): ReadCounterData {
	return Object.assign(create(typeModels.ReadCounterData, ReadCounterDataTypeRef), values)
}

export type ReadCounterData = {
	_type: TypeRef<ReadCounterData>;

	_format: NumberString;
	columnName: null | Id;
	counterType: NumberString;
	rowName: string;
}
export const ReadCounterReturnTypeRef: TypeRef<ReadCounterReturn> = new TypeRef("monitor", "ReadCounterReturn")

export function createReadCounterReturn(values: StrippedEntity<ReadCounterReturn>): ReadCounterReturn {
	return Object.assign(create(typeModels.ReadCounterReturn, ReadCounterReturnTypeRef), values)
}

export type ReadCounterReturn = {
	_type: TypeRef<ReadCounterReturn>;

	_format: NumberString;
	value: null | NumberString;

	counterValues: CounterValue[];
}
export const ReportErrorInTypeRef: TypeRef<ReportErrorIn> = new TypeRef("monitor", "ReportErrorIn")

export function createReportErrorIn(values: StrippedEntity<ReportErrorIn>): ReportErrorIn {
	return Object.assign(create(typeModels.ReportErrorIn, ReportErrorInTypeRef), values)
}

export type ReportErrorIn = {
	_type: TypeRef<ReportErrorIn>;

	_format: NumberString;

	data: ErrorReportData;
	files: ErrorReportFile[];
}
export const WriteCounterDataTypeRef: TypeRef<WriteCounterData> = new TypeRef("monitor", "WriteCounterData")

export function createWriteCounterData(values: StrippedEntity<WriteCounterData>): WriteCounterData {
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
