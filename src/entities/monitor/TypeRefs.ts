import { create, StrippedEntity } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { default as typeModels } from "./TypeModels.js"
import { AggregatedEntity, ElementEntity, Entity, ListElementEntity, BlobElementEntity, DataTransferEntity, AttributeId } from "@tutao/meta"


export const ReadCounterDataTypeRef: TypeRef<ReadCounterData> = new TypeRef("monitor", 12)

export function createReadCounterData(values: StrippedEntity<ReadCounterData>): ReadCounterData {
    return Object.assign(create(typeModels[ReadCounterDataTypeRef.typeId], ReadCounterDataTypeRef), values)
}

export type ReadCounterDataParams = {

	_format: NumberString;
	rowName: string;
	columnName: null | Id;
	counterType: NumberString;
}

export class ReadCounterData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ReadCounterData> { return ReadCounterDataTypeRef };
	

	get _format(): NumberString { return this._attrs[13] }
	get rowName(): string { return this._attrs[14] }
	get columnName(): null | Id { return this._attrs[15] }
	get counterType(): NumberString { return this._attrs[299] }
    set counterType(v: NumberString) { this._attrs[299] = v }
	
}
export const ReadCounterReturnTypeRef: TypeRef<ReadCounterReturn> = new TypeRef("monitor", 16)

export function createReadCounterReturn(values: StrippedEntity<ReadCounterReturn>): ReadCounterReturn {
    return Object.assign(create(typeModels[ReadCounterReturnTypeRef.typeId], ReadCounterReturnTypeRef), values)
}

export type ReadCounterReturnParams = {

	_format: NumberString;
	value: null | NumberString;

	counterValues: CounterValue[];
}

export class ReadCounterReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ReadCounterReturn> { return ReadCounterReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[17] }
	get value(): null | NumberString { return this._attrs[18] }
    set value(v: null | NumberString) { this._attrs[18] = v }
	

	get counterValues(): CounterValue[] { return this._attrs[18] }
	set counterValues(a: CounterValue[])  { this._attrs[304] = a } 
}
export const WriteCounterDataTypeRef: TypeRef<WriteCounterData> = new TypeRef("monitor", 49)

export function createWriteCounterData(values: StrippedEntity<WriteCounterData>): WriteCounterData {
    return Object.assign(create(typeModels[WriteCounterDataTypeRef.typeId], WriteCounterDataTypeRef), values)
}

export type WriteCounterDataParams = {

	_format: NumberString;
	row: string;
	column: Id;
	value: NumberString;
	counterType: null | NumberString;
}

export class WriteCounterData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<WriteCounterData> { return WriteCounterDataTypeRef };
	

	get _format(): NumberString { return this._attrs[50] }
	get row(): string { return this._attrs[51] }
	get column(): Id { return this._attrs[52] }
	get value(): NumberString { return this._attrs[53] }
	get counterType(): null | NumberString { return this._attrs[215] }
    set counterType(v: null | NumberString) { this._attrs[215] = v }
	
}
export const ApprovalMailTypeRef: TypeRef<ApprovalMail> = new TypeRef("monitor", 221)

export function createApprovalMail(values: StrippedEntity<ApprovalMail>): ApprovalMail {
    return Object.assign(create(typeModels[ApprovalMailTypeRef.typeId], ApprovalMailTypeRef), values)
}

export type ApprovalMailParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	range: null | string;
	date: null | Date;
	text: string;

	customer: null | Id;
}

export class ApprovalMail extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ApprovalMail> { return ApprovalMailTypeRef };
	

	get _id(): IdTuple { return this._attrs[223] }
	get _permissions(): Id { return this._attrs[224] }
	get _format(): NumberString { return this._attrs[225] }
	get _ownerGroup(): null | Id { return this._attrs[226] }
	get range(): null | string { return this._attrs[227] }
	get date(): null | Date { return this._attrs[228] }
	get text(): string { return this._attrs[229] }
	

	get customer(): null | Id { return this._attrs[229] }
}
export const CounterValueTypeRef: TypeRef<CounterValue> = new TypeRef("monitor", 300)

export function createCounterValue(values: StrippedEntity<CounterValue>): CounterValue {
    return Object.assign(create(typeModels[CounterValueTypeRef.typeId], CounterValueTypeRef), values)
}

export type CounterValueParams = {

	_id: Id;
	counterId: Id;
	value: NumberString;
}

export class CounterValue extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CounterValue> { return CounterValueTypeRef };
	

	get _id(): Id { return this._attrs[301] }
	get counterId(): Id { return this._attrs[302] }
	get value(): NumberString { return this._attrs[303] }
    set value(v: NumberString) { this._attrs[303] = v }
	
}
export const ErrorReportFileTypeRef: TypeRef<ErrorReportFile> = new TypeRef("monitor", 305)

export function createErrorReportFile(values: StrippedEntity<ErrorReportFile>): ErrorReportFile {
    return Object.assign(create(typeModels[ErrorReportFileTypeRef.typeId], ErrorReportFileTypeRef), values)
}

export type ErrorReportFileParams = {

	_id: Id;
	name: string;
	content: string;
}

export class ErrorReportFile extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ErrorReportFile> { return ErrorReportFileTypeRef };
	

	get _id(): Id { return this._attrs[306] }
	get name(): string { return this._attrs[307] }
	get content(): string { return this._attrs[308] }
	
}
export const ErrorReportDataTypeRef: TypeRef<ErrorReportData> = new TypeRef("monitor", 316)

export function createErrorReportData(values: StrippedEntity<ErrorReportData>): ErrorReportData {
    return Object.assign(create(typeModels[ErrorReportDataTypeRef.typeId], ErrorReportDataTypeRef), values)
}

export type ErrorReportDataParams = {

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

export class ErrorReportData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ErrorReportData> { return ErrorReportDataTypeRef };
	

	get _id(): Id { return this._attrs[317] }
	get time(): Date { return this._attrs[318] }
	get appVersion(): string { return this._attrs[319] }
	get clientType(): NumberString { return this._attrs[320] }
	get userId(): null | string { return this._attrs[321] }
	get errorClass(): string { return this._attrs[322] }
	get errorMessage(): null | string { return this._attrs[323] }
	get stackTrace(): string { return this._attrs[324] }
	get userMessage(): null | string { return this._attrs[325] }
	get additionalInfo(): string { return this._attrs[326] }
	
}
export const ReportErrorInTypeRef: TypeRef<ReportErrorIn> = new TypeRef("monitor", 335)

export function createReportErrorIn(values: StrippedEntity<ReportErrorIn>): ReportErrorIn {
    return Object.assign(create(typeModels[ReportErrorInTypeRef.typeId], ReportErrorInTypeRef), values)
}

export type ReportErrorInParams = {

	_format: NumberString;

	data: ErrorReportData;
	files: ErrorReportFile[];
}

export class ReportErrorIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ReportErrorIn> { return ReportErrorInTypeRef };
	

	get _format(): NumberString { return this._attrs[336] }
    set _format(v: NumberString) { this._attrs[336] = v }
	

	get data(): ErrorReportData { return this._attrs[336] }
	set data(a: ErrorReportData)  { this._attrs[337] = a } 
	get files(): ErrorReportFile[] { return this._attrs[336] }
	set files(a: ErrorReportFile[])  { this._attrs[338] = a } 
}
