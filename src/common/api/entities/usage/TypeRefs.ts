import { create, Stripped, StrippedEntity } from "../../common/utils/EntityUtils.js"
import { TypeRef } from "@tutao/tutanota-utils"
import { typeModels } from "./TypeModels.js"


export const UsageTestMetricConfigValueTypeRef: TypeRef<UsageTestMetricConfigValue> = new TypeRef("usage", 8)

export function createUsageTestMetricConfigValue(values: StrippedEntity<UsageTestMetricConfigValue>): UsageTestMetricConfigValue {
	return Object.assign(create(typeModels[UsageTestMetricConfigValueTypeRef.typeId], UsageTestMetricConfigValueTypeRef), values)
}

export type UsageTestMetricConfigValue = {
	_type: TypeRef<UsageTestMetricConfigValue>;

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

	_id: Id;
	name: string;
	minPings: NumberString;
	maxPings: NumberString;

	metrics: UsageTestMetricConfig[];
}
export const UsageTestAssignmentInTypeRef: TypeRef<UsageTestAssignmentIn> = new TypeRef("usage", 53)

export function createUsageTestAssignmentIn(values: StrippedEntity<UsageTestAssignmentIn>): UsageTestAssignmentIn {
	return Object.assign(create(typeModels[UsageTestAssignmentInTypeRef.typeId], UsageTestAssignmentInTypeRef), values)
}

export type UsageTestAssignmentIn = {
	_type: TypeRef<UsageTestAssignmentIn>;

	_format: NumberString;
	testDeviceId: null | Id;
}
export const UsageTestAssignmentTypeRef: TypeRef<UsageTestAssignment> = new TypeRef("usage", 56)

export function createUsageTestAssignment(values: StrippedEntity<UsageTestAssignment>): UsageTestAssignment {
	return Object.assign(create(typeModels[UsageTestAssignmentTypeRef.typeId], UsageTestAssignmentTypeRef), values)
}

export type UsageTestAssignment = {
	_type: TypeRef<UsageTestAssignment>;

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

	_format: NumberString;
	testId: Id;
	stage: NumberString;
	testDeviceId: Id;

	metrics: UsageTestMetricData[];
}
