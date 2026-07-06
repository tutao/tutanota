import { create, StrippedEntity } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { default as typeModels } from "./TypeModels.js"
import { AggregatedEntity, ElementEntity, Entity, ListElementEntity, BlobElementEntity, DataTransferEntity, AttributeId } from "@tutao/meta"


export const UsageTestMetricConfigValueTypeRef: TypeRef<UsageTestMetricConfigValue> = new TypeRef("usage", 8)

export function createUsageTestMetricConfigValue(values: StrippedEntity<UsageTestMetricConfigValue>): UsageTestMetricConfigValue {
    return Object.assign(create(typeModels[UsageTestMetricConfigValueTypeRef.typeId], UsageTestMetricConfigValueTypeRef), values)
}

export type UsageTestMetricConfigValueParams = {

	_id: Id;
	key: string;
	value: string;
}

export class UsageTestMetricConfigValue extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UsageTestMetricConfigValue> { return UsageTestMetricConfigValueTypeRef };
	

	get _id(): Id { return this._attrs[9] }
	get key(): string { return this._attrs[10] }
	get value(): string { return this._attrs[11] }
    set value(v: string) { this._attrs[11] = v }
	
}
export const UsageTestMetricConfigTypeRef: TypeRef<UsageTestMetricConfig> = new TypeRef("usage", 12)

export function createUsageTestMetricConfig(values: StrippedEntity<UsageTestMetricConfig>): UsageTestMetricConfig {
    return Object.assign(create(typeModels[UsageTestMetricConfigTypeRef.typeId], UsageTestMetricConfigTypeRef), values)
}

export type UsageTestMetricConfigParams = {

	_id: Id;
	name: string;
	type: NumberString;

	configValues: UsageTestMetricConfigValue[];
}

export class UsageTestMetricConfig extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UsageTestMetricConfig> { return UsageTestMetricConfigTypeRef };
	

	get _id(): Id { return this._attrs[13] }
	get name(): string { return this._attrs[14] }
	get type(): NumberString { return this._attrs[15] }
	

	get configValues(): UsageTestMetricConfigValue[] { return this._attrs[15] }
	set configValues(a: UsageTestMetricConfigValue[])  { this._attrs[16] = a } 
}
export const UsageTestMetricDataTypeRef: TypeRef<UsageTestMetricData> = new TypeRef("usage", 17)

export function createUsageTestMetricData(values: StrippedEntity<UsageTestMetricData>): UsageTestMetricData {
    return Object.assign(create(typeModels[UsageTestMetricDataTypeRef.typeId], UsageTestMetricDataTypeRef), values)
}

export type UsageTestMetricDataParams = {

	_id: Id;
	name: string;
	value: string;
}

export class UsageTestMetricData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UsageTestMetricData> { return UsageTestMetricDataTypeRef };
	

	get _id(): Id { return this._attrs[18] }
	get name(): string { return this._attrs[19] }
	get value(): string { return this._attrs[20] }
	
}
export const UsageTestStageTypeRef: TypeRef<UsageTestStage> = new TypeRef("usage", 35)

export function createUsageTestStage(values: StrippedEntity<UsageTestStage>): UsageTestStage {
    return Object.assign(create(typeModels[UsageTestStageTypeRef.typeId], UsageTestStageTypeRef), values)
}

export type UsageTestStageParams = {

	_id: Id;
	name: string;
	minPings: NumberString;
	maxPings: NumberString;
	isFinalStage: boolean;

	metrics: UsageTestMetricConfig[];
}

export class UsageTestStage extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UsageTestStage> { return UsageTestStageTypeRef };
	

	get _id(): Id { return this._attrs[36] }
	get name(): string { return this._attrs[37] }
	get minPings(): NumberString { return this._attrs[87] }
	get maxPings(): NumberString { return this._attrs[88] }
	get isFinalStage(): boolean { return this._attrs[101] }
    set isFinalStage(v: boolean) { this._attrs[101] = v }
	

	get metrics(): UsageTestMetricConfig[] { return this._attrs[101] }
	set metrics(a: UsageTestMetricConfig[])  { this._attrs[38] = a } 
}
export const UsageTestAssignmentInTypeRef: TypeRef<UsageTestAssignmentIn> = new TypeRef("usage", 53)

export function createUsageTestAssignmentIn(values: StrippedEntity<UsageTestAssignmentIn>): UsageTestAssignmentIn {
    return Object.assign(create(typeModels[UsageTestAssignmentInTypeRef.typeId], UsageTestAssignmentInTypeRef), values)
}

export type UsageTestAssignmentInParams = {

	_format: NumberString;
	testDeviceId: null | Id;
}

export class UsageTestAssignmentIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UsageTestAssignmentIn> { return UsageTestAssignmentInTypeRef };
	

	get _format(): NumberString { return this._attrs[54] }
	get testDeviceId(): null | Id { return this._attrs[55] }
    set testDeviceId(v: null | Id) { this._attrs[55] = v }
	
}
export const UsageTestAssignmentTypeRef: TypeRef<UsageTestAssignment> = new TypeRef("usage", 56)

export function createUsageTestAssignment(values: StrippedEntity<UsageTestAssignment>): UsageTestAssignment {
    return Object.assign(create(typeModels[UsageTestAssignmentTypeRef.typeId], UsageTestAssignmentTypeRef), values)
}

export type UsageTestAssignmentParams = {

	_id: Id;
	testId: Id;
	name: string;
	variant: null | NumberString;
	sendPings: boolean;
	variantName: null | string;

	stages: UsageTestStage[];
}

export class UsageTestAssignment extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UsageTestAssignment> { return UsageTestAssignmentTypeRef };
	

	get _id(): Id { return this._attrs[57] }
	get testId(): Id { return this._attrs[58] }
	get name(): string { return this._attrs[59] }
	get variant(): null | NumberString { return this._attrs[60] }
	get sendPings(): boolean { return this._attrs[61] }
	get variantName(): null | string { return this._attrs[110] }
    set variantName(v: null | string) { this._attrs[110] = v }
	

	get stages(): UsageTestStage[] { return this._attrs[110] }
	set stages(a: UsageTestStage[])  { this._attrs[62] = a } 
}
export const UsageTestAssignmentOutTypeRef: TypeRef<UsageTestAssignmentOut> = new TypeRef("usage", 63)

export function createUsageTestAssignmentOut(values: StrippedEntity<UsageTestAssignmentOut>): UsageTestAssignmentOut {
    return Object.assign(create(typeModels[UsageTestAssignmentOutTypeRef.typeId], UsageTestAssignmentOutTypeRef), values)
}

export type UsageTestAssignmentOutParams = {

	_format: NumberString;
	testDeviceId: Id;

	assignments: UsageTestAssignment[];
}

export class UsageTestAssignmentOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UsageTestAssignmentOut> { return UsageTestAssignmentOutTypeRef };
	

	get _format(): NumberString { return this._attrs[64] }
	get testDeviceId(): Id { return this._attrs[65] }
    set testDeviceId(v: Id) { this._attrs[65] = v }
	

	get assignments(): UsageTestAssignment[] { return this._attrs[65] }
	set assignments(a: UsageTestAssignment[])  { this._attrs[66] = a } 
}
export const UsageTestParticipationInTypeRef: TypeRef<UsageTestParticipationIn> = new TypeRef("usage", 80)

export function createUsageTestParticipationIn(values: StrippedEntity<UsageTestParticipationIn>): UsageTestParticipationIn {
    return Object.assign(create(typeModels[UsageTestParticipationInTypeRef.typeId], UsageTestParticipationInTypeRef), values)
}

export type UsageTestParticipationInParams = {

	_format: NumberString;
	testId: Id;
	stage: NumberString;
	testDeviceId: Id;
	isFinalPingForStage: boolean;

	metrics: UsageTestMetricData[];
}

export class UsageTestParticipationIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UsageTestParticipationIn> { return UsageTestParticipationInTypeRef };
	

	get _format(): NumberString { return this._attrs[81] }
	get testId(): Id { return this._attrs[82] }
	get stage(): NumberString { return this._attrs[83] }
	get testDeviceId(): Id { return this._attrs[84] }
	get isFinalPingForStage(): boolean { return this._attrs[100] }
    set isFinalPingForStage(v: boolean) { this._attrs[100] = v }
	

	get metrics(): UsageTestMetricData[] { return this._attrs[100] }
	set metrics(a: UsageTestMetricData[])  { this._attrs[85] = a } 
}
export const UsageTestParticipationOutTypeRef: TypeRef<UsageTestParticipationOut> = new TypeRef("usage", 90)

export function createUsageTestParticipationOut(values: StrippedEntity<UsageTestParticipationOut>): UsageTestParticipationOut {
    return Object.assign(create(typeModels[UsageTestParticipationOutTypeRef.typeId], UsageTestParticipationOutTypeRef), values)
}

export type UsageTestParticipationOutParams = {

	_format: NumberString;
	pingListId: Id;
	pingId: Id;
}

export class UsageTestParticipationOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UsageTestParticipationOut> { return UsageTestParticipationOutTypeRef };
	

	get _format(): NumberString { return this._attrs[91] }
	get pingListId(): Id { return this._attrs[92] }
	get pingId(): Id { return this._attrs[93] }
    set pingId(v: Id) { this._attrs[93] = v }
	
}
export const UsageTestParticipationDeleteInTypeRef: TypeRef<UsageTestParticipationDeleteIn> = new TypeRef("usage", 94)

export function createUsageTestParticipationDeleteIn(values: StrippedEntity<UsageTestParticipationDeleteIn>): UsageTestParticipationDeleteIn {
    return Object.assign(create(typeModels[UsageTestParticipationDeleteInTypeRef.typeId], UsageTestParticipationDeleteInTypeRef), values)
}

export type UsageTestParticipationDeleteInParams = {

	_format: NumberString;
	testId: Id;
	testDeviceId: Id;
	pingListId: Id;
	pingId: Id;
}

export class UsageTestParticipationDeleteIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UsageTestParticipationDeleteIn> { return UsageTestParticipationDeleteInTypeRef };
	

	get _format(): NumberString { return this._attrs[95] }
	get testId(): Id { return this._attrs[96] }
	get testDeviceId(): Id { return this._attrs[97] }
	get pingListId(): Id { return this._attrs[98] }
	get pingId(): Id { return this._attrs[99] }
    set pingId(v: Id) { this._attrs[99] = v }
	
}
