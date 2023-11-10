import { create, Stripped, StrippedEntity } from "../../common/utils/EntityUtils.js"
import {TypeRef} from "@tutao/tutanota-utils"
import {typeModels} from "./TypeModels.js"


export const UsageTestAssignmentTypeRef: TypeRef<UsageTestAssignment> = new TypeRef("usage", "UsageTestAssignment")

export function createUsageTestAssignment(values: StrippedEntity<UsageTestAssignment>): UsageTestAssignment {
	return Object.assign(create(typeModels.UsageTestAssignment, UsageTestAssignmentTypeRef), values)
}

export type UsageTestAssignment = {
	_type: TypeRef<UsageTestAssignment>;

	_id: Id;
	name: string;
	sendPings: boolean;
	testId: Id;
	variant: null | NumberString;

	stages: UsageTestStage[];
}
export const UsageTestAssignmentInTypeRef: TypeRef<UsageTestAssignmentIn> = new TypeRef("usage", "UsageTestAssignmentIn")

export function createUsageTestAssignmentIn(values: StrippedEntity<UsageTestAssignmentIn>): UsageTestAssignmentIn {
	return Object.assign(create(typeModels.UsageTestAssignmentIn, UsageTestAssignmentInTypeRef), values)
}

export type UsageTestAssignmentIn = {
	_type: TypeRef<UsageTestAssignmentIn>;

	_format: NumberString;
	testDeviceId: null | Id;
}
export const UsageTestAssignmentOutTypeRef: TypeRef<UsageTestAssignmentOut> = new TypeRef("usage", "UsageTestAssignmentOut")

export function createUsageTestAssignmentOut(values: StrippedEntity<UsageTestAssignmentOut>): UsageTestAssignmentOut {
	return Object.assign(create(typeModels.UsageTestAssignmentOut, UsageTestAssignmentOutTypeRef), values)
}

export type UsageTestAssignmentOut = {
	_type: TypeRef<UsageTestAssignmentOut>;

	_format: NumberString;
	testDeviceId: Id;

	assignments: UsageTestAssignment[];
}
export const UsageTestMetricConfigTypeRef: TypeRef<UsageTestMetricConfig> = new TypeRef("usage", "UsageTestMetricConfig")

export function createUsageTestMetricConfig(values: StrippedEntity<UsageTestMetricConfig>): UsageTestMetricConfig {
	return Object.assign(create(typeModels.UsageTestMetricConfig, UsageTestMetricConfigTypeRef), values)
}

export type UsageTestMetricConfig = {
	_type: TypeRef<UsageTestMetricConfig>;

	_id: Id;
	name: string;
	type: NumberString;

	configValues: UsageTestMetricConfigValue[];
}
export const UsageTestMetricConfigValueTypeRef: TypeRef<UsageTestMetricConfigValue> = new TypeRef("usage", "UsageTestMetricConfigValue")

export function createUsageTestMetricConfigValue(values: StrippedEntity<UsageTestMetricConfigValue>): UsageTestMetricConfigValue {
	return Object.assign(create(typeModels.UsageTestMetricConfigValue, UsageTestMetricConfigValueTypeRef), values)
}

export type UsageTestMetricConfigValue = {
	_type: TypeRef<UsageTestMetricConfigValue>;

	_id: Id;
	key: string;
	value: string;
}
export const UsageTestMetricDataTypeRef: TypeRef<UsageTestMetricData> = new TypeRef("usage", "UsageTestMetricData")

export function createUsageTestMetricData(values: StrippedEntity<UsageTestMetricData>): UsageTestMetricData {
	return Object.assign(create(typeModels.UsageTestMetricData, UsageTestMetricDataTypeRef), values)
}

export type UsageTestMetricData = {
	_type: TypeRef<UsageTestMetricData>;

	_id: Id;
	name: string;
	value: string;
}
export const UsageTestParticipationInTypeRef: TypeRef<UsageTestParticipationIn> = new TypeRef("usage", "UsageTestParticipationIn")

export function createUsageTestParticipationIn(values: StrippedEntity<UsageTestParticipationIn>): UsageTestParticipationIn {
	return Object.assign(create(typeModels.UsageTestParticipationIn, UsageTestParticipationInTypeRef), values)
}

export type UsageTestParticipationIn = {
	_type: TypeRef<UsageTestParticipationIn>;

	_format: NumberString;
	stage: NumberString;
	testDeviceId: Id;
	testId: Id;

	metrics: UsageTestMetricData[];
}
export const UsageTestStageTypeRef: TypeRef<UsageTestStage> = new TypeRef("usage", "UsageTestStage")

export function createUsageTestStage(values: StrippedEntity<UsageTestStage>): UsageTestStage {
	return Object.assign(create(typeModels.UsageTestStage, UsageTestStageTypeRef), values)
}

export type UsageTestStage = {
	_type: TypeRef<UsageTestStage>;

	_id: Id;
	maxPings: NumberString;
	minPings: NumberString;
	name: string;

	metrics: UsageTestMetricConfig[];
}
