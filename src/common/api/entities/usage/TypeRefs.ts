import { create, Stripped, StrippedEntity } from "../../common/utils/EntityUtils.js"
import { TypeRef } from "@tutao/tutanota-utils"
import { typeModels } from "./TypeModels.js"


export const UsageTestMetricConfigValueTypeRef: TypeRef<UsageTestMetricConfigValue> = new TypeRef("usage", 8)

export function createUsageTestMetricConfigValue(values: StrippedEntity<UsageTestMetricConfigValue>): UsageTestMetricConfigValue {
    return Object.assign(create(typeModels[UsageTestMetricConfigValueTypeRef.typeId], UsageTestMetricConfigValueTypeRef), values)
}

export type UsageTestMetricConfigValue = {
	_type: TypeRef<UsageTestMetricConfigValue>;
	_original?: UsageTestMetricConfigValue

	_id: Id;
	key: string;
	value: string;
}
export const UsageTestMetricConfigTypeRef: TypeRef<UsageTestMetricConfig> = new TypeRef("usage", 12)

export function createUsageTestMetricConfig(values: StrippedEntity<UsageTestMetricConfig>): UsageTestMetricConfig {
    return Object.assign(create(typeModels[UsageTestMetricConfigTypeRef.typeId], UsageTestMetricConfigTypeRef), values)
}

export type UsageTestMetricConfig = {
	_type: TypeRef<UsageTestMetricConfig>;
	_original?: UsageTestMetricConfig

	_id: Id;
	name: string;
	type: NumberString;

	configValues: UsageTestMetricConfigValue[];
}
export const UsageTestMetricDataTypeRef: TypeRef<UsageTestMetricData> = new TypeRef("usage", 17)

export function createUsageTestMetricData(values: StrippedEntity<UsageTestMetricData>): UsageTestMetricData {
    return Object.assign(create(typeModels[UsageTestMetricDataTypeRef.typeId], UsageTestMetricDataTypeRef), values)
}

export type UsageTestMetricData = {
	_type: TypeRef<UsageTestMetricData>;
	_original?: UsageTestMetricData

	_id: Id;
	name: string;
	value: string;
}
export const UsageTestStageTypeRef: TypeRef<UsageTestStage> = new TypeRef("usage", 35)

export function createUsageTestStage(values: StrippedEntity<UsageTestStage>): UsageTestStage {
    return Object.assign(create(typeModels[UsageTestStageTypeRef.typeId], UsageTestStageTypeRef), values)
}

export type UsageTestStage = {
	_type: TypeRef<UsageTestStage>;
	_original?: UsageTestStage

	_id: Id;
	name: string;
	minPings: NumberString;
	maxPings: NumberString;
	isFinalStage: boolean;

	metrics: UsageTestMetricConfig[];
}
export const UsageTestAssignmentInTypeRef: TypeRef<UsageTestAssignmentIn> = new TypeRef("usage", 53)

export function createUsageTestAssignmentIn(values: StrippedEntity<UsageTestAssignmentIn>): UsageTestAssignmentIn {
    return Object.assign(create(typeModels[UsageTestAssignmentInTypeRef.typeId], UsageTestAssignmentInTypeRef), values)
}

export type UsageTestAssignmentIn = {
	_type: TypeRef<UsageTestAssignmentIn>;
	_original?: UsageTestAssignmentIn

	_format: NumberString;
	testDeviceId: null | Id;
}
export const UsageTestAssignmentTypeRef: TypeRef<UsageTestAssignment> = new TypeRef("usage", 56)

export function createUsageTestAssignment(values: StrippedEntity<UsageTestAssignment>): UsageTestAssignment {
    return Object.assign(create(typeModels[UsageTestAssignmentTypeRef.typeId], UsageTestAssignmentTypeRef), values)
}

export type UsageTestAssignment = {
	_type: TypeRef<UsageTestAssignment>;
	_original?: UsageTestAssignment

	_id: Id;
	testId: Id;
	name: string;
	variant: null | NumberString;
	sendPings: boolean;

	stages: UsageTestStage[];
}
export const UsageTestAssignmentOutTypeRef: TypeRef<UsageTestAssignmentOut> = new TypeRef("usage", 63)

export function createUsageTestAssignmentOut(values: StrippedEntity<UsageTestAssignmentOut>): UsageTestAssignmentOut {
    return Object.assign(create(typeModels[UsageTestAssignmentOutTypeRef.typeId], UsageTestAssignmentOutTypeRef), values)
}

export type UsageTestAssignmentOut = {
	_type: TypeRef<UsageTestAssignmentOut>;
	_original?: UsageTestAssignmentOut

	_format: NumberString;
	testDeviceId: Id;

	assignments: UsageTestAssignment[];
}
export const UsageTestParticipationInTypeRef: TypeRef<UsageTestParticipationIn> = new TypeRef("usage", 80)

export function createUsageTestParticipationIn(values: StrippedEntity<UsageTestParticipationIn>): UsageTestParticipationIn {
    return Object.assign(create(typeModels[UsageTestParticipationInTypeRef.typeId], UsageTestParticipationInTypeRef), values)
}

export type UsageTestParticipationIn = {
	_type: TypeRef<UsageTestParticipationIn>;
	_original?: UsageTestParticipationIn

	_format: NumberString;
	testId: Id;
	stage: NumberString;
	testDeviceId: Id;
	isFinalPingForStage: boolean;

	metrics: UsageTestMetricData[];
}
export const UsageTestParticipationOutTypeRef: TypeRef<UsageTestParticipationOut> = new TypeRef("usage", 90)

export function createUsageTestParticipationOut(values: StrippedEntity<UsageTestParticipationOut>): UsageTestParticipationOut {
    return Object.assign(create(typeModels[UsageTestParticipationOutTypeRef.typeId], UsageTestParticipationOutTypeRef), values)
}

export type UsageTestParticipationOut = {
	_type: TypeRef<UsageTestParticipationOut>;
	_original?: UsageTestParticipationOut

	_format: NumberString;
	pingListId: Id;
	pingId: Id;
}
export const UsageTestParticipationDeleteInTypeRef: TypeRef<UsageTestParticipationDeleteIn> = new TypeRef("usage", 94)

export function createUsageTestParticipationDeleteIn(values: StrippedEntity<UsageTestParticipationDeleteIn>): UsageTestParticipationDeleteIn {
    return Object.assign(create(typeModels[UsageTestParticipationDeleteInTypeRef.typeId], UsageTestParticipationDeleteInTypeRef), values)
}

export type UsageTestParticipationDeleteIn = {
	_type: TypeRef<UsageTestParticipationDeleteIn>;
	_original?: UsageTestParticipationDeleteIn

	_format: NumberString;
	testId: Id;
	testDeviceId: Id;
	pingListId: Id;
	pingId: Id;
}
