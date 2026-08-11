import { create } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { ListElementId, ElementId, DataTransferId } from "@tutao/meta"
import { default as typeModels } from "./TypeModels.js"
import { Nullable } from "@tutao/utils"

export const UsageTestMetricConfigValueTypeRef: TypeRef<UsageTestMetricConfigValue> = new TypeRef("usage", 8)

export function createUsageTestMetricConfigValue(values: UsageTestMetricConfigValueParams): UsageTestMetricConfigValue {
	return Object.assign(create(typeModels[UsageTestMetricConfigValueTypeRef.typeId], UsageTestMetricConfigValueTypeRef), values)
}

export type UsageTestMetricConfigValueParams = {
	key: string
	value: string
}

export type UsageTestMetricConfigValue = {
	// == values

	_id: Id
	key: string
	value: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UsageTestMetricConfigValue>
	_original: Nullable<UsageTestMetricConfigValue>
	isAdapter: false
}
export const UsageTestMetricConfigTypeRef: TypeRef<UsageTestMetricConfig> = new TypeRef("usage", 12)

export function createUsageTestMetricConfig(values: UsageTestMetricConfigParams): UsageTestMetricConfig {
	return Object.assign(create(typeModels[UsageTestMetricConfigTypeRef.typeId], UsageTestMetricConfigTypeRef), values)
}

export type UsageTestMetricConfigParams = {
	name: string
	type: NumberString

	configValues: UsageTestMetricConfigValue[]
}

export type UsageTestMetricConfig = {
	// == values

	_id: Id
	name: string
	type: NumberString

	// == associations

	configValues: UsageTestMetricConfigValue[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UsageTestMetricConfig>
	_original: Nullable<UsageTestMetricConfig>
	isAdapter: false
}
export const UsageTestMetricDataTypeRef: TypeRef<UsageTestMetricData> = new TypeRef("usage", 17)

export function createUsageTestMetricData(values: UsageTestMetricDataParams): UsageTestMetricData {
	return Object.assign(create(typeModels[UsageTestMetricDataTypeRef.typeId], UsageTestMetricDataTypeRef), values)
}

export type UsageTestMetricDataParams = {
	name: string
	value: string
}

export type UsageTestMetricData = {
	// == values

	_id: Id
	name: string
	value: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UsageTestMetricData>
	_original: Nullable<UsageTestMetricData>
	isAdapter: false
}
export const UsageTestStageTypeRef: TypeRef<UsageTestStage> = new TypeRef("usage", 35)

export function createUsageTestStage(values: UsageTestStageParams): UsageTestStage {
	return Object.assign(create(typeModels[UsageTestStageTypeRef.typeId], UsageTestStageTypeRef), values)
}

export type UsageTestStageParams = {
	name: string
	minPings: NumberString
	maxPings: NumberString
	isFinalStage: boolean

	metrics: UsageTestMetricConfig[]
}

export type UsageTestStage = {
	// == values

	_id: Id
	name: string
	minPings: NumberString
	maxPings: NumberString
	isFinalStage: boolean

	// == associations

	metrics: UsageTestMetricConfig[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UsageTestStage>
	_original: Nullable<UsageTestStage>
	isAdapter: false
}
export const UsageTestAssignmentInTypeRef: TypeRef<UsageTestAssignmentIn> = new TypeRef("usage", 53)

export function createUsageTestAssignmentIn(values: UsageTestAssignmentInParams): UsageTestAssignmentIn {
	return Object.assign(create(typeModels[UsageTestAssignmentInTypeRef.typeId], UsageTestAssignmentInTypeRef), values)
}

export type UsageTestAssignmentInParams = {
	testDeviceId: null | Id
}

export type UsageTestAssignmentIn = {
	// == values

	_format: NumberString
	testDeviceId: null | Id
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UsageTestAssignmentIn>
	_original: Nullable<UsageTestAssignmentIn>
	isAdapter: false
}
export const UsageTestAssignmentTypeRef: TypeRef<UsageTestAssignment> = new TypeRef("usage", 56)

export function createUsageTestAssignment(values: UsageTestAssignmentParams): UsageTestAssignment {
	return Object.assign(create(typeModels[UsageTestAssignmentTypeRef.typeId], UsageTestAssignmentTypeRef), values)
}

export type UsageTestAssignmentParams = {
	testId: Id
	name: string
	variant: null | NumberString
	sendPings: boolean
	variantName: null | string

	stages: UsageTestStage[]
}

export type UsageTestAssignment = {
	// == values

	_id: Id
	testId: Id
	name: string
	variant: null | NumberString
	sendPings: boolean
	variantName: null | string

	// == associations

	stages: UsageTestStage[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UsageTestAssignment>
	_original: Nullable<UsageTestAssignment>
	isAdapter: false
}
export const UsageTestAssignmentOutTypeRef: TypeRef<UsageTestAssignmentOut> = new TypeRef("usage", 63)

export function createUsageTestAssignmentOut(values: UsageTestAssignmentOutParams): UsageTestAssignmentOut {
	return Object.assign(create(typeModels[UsageTestAssignmentOutTypeRef.typeId], UsageTestAssignmentOutTypeRef), values)
}

export type UsageTestAssignmentOutParams = {
	testDeviceId: Id

	assignments: UsageTestAssignment[]
}

export type UsageTestAssignmentOut = {
	// == values

	_format: NumberString
	testDeviceId: Id

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	assignments: UsageTestAssignment[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UsageTestAssignmentOut>
	_original: Nullable<UsageTestAssignmentOut>
	isAdapter: false
}
export const UsageTestParticipationInTypeRef: TypeRef<UsageTestParticipationIn> = new TypeRef("usage", 80)

export function createUsageTestParticipationIn(values: UsageTestParticipationInParams): UsageTestParticipationIn {
	return Object.assign(create(typeModels[UsageTestParticipationInTypeRef.typeId], UsageTestParticipationInTypeRef), values)
}

export type UsageTestParticipationInParams = {
	testId: Id
	stage: NumberString
	testDeviceId: Id
	isFinalPingForStage: boolean

	metrics: UsageTestMetricData[]
}

export type UsageTestParticipationIn = {
	// == values

	_format: NumberString
	testId: Id
	stage: NumberString
	testDeviceId: Id
	isFinalPingForStage: boolean

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	metrics: UsageTestMetricData[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UsageTestParticipationIn>
	_original: Nullable<UsageTestParticipationIn>
	isAdapter: false
}
export const UsageTestParticipationOutTypeRef: TypeRef<UsageTestParticipationOut> = new TypeRef("usage", 90)

export function createUsageTestParticipationOut(values: UsageTestParticipationOutParams): UsageTestParticipationOut {
	return Object.assign(create(typeModels[UsageTestParticipationOutTypeRef.typeId], UsageTestParticipationOutTypeRef), values)
}

export type UsageTestParticipationOutParams = {
	pingListId: Id
	pingId: Id
}

export type UsageTestParticipationOut = {
	// == values

	_format: NumberString
	pingListId: Id
	pingId: Id
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UsageTestParticipationOut>
	_original: Nullable<UsageTestParticipationOut>
	isAdapter: false
}
export const UsageTestParticipationDeleteInTypeRef: TypeRef<UsageTestParticipationDeleteIn> = new TypeRef("usage", 94)

export function createUsageTestParticipationDeleteIn(values: UsageTestParticipationDeleteInParams): UsageTestParticipationDeleteIn {
	return Object.assign(create(typeModels[UsageTestParticipationDeleteInTypeRef.typeId], UsageTestParticipationDeleteInTypeRef), values)
}

export type UsageTestParticipationDeleteInParams = {
	testId: Id
	testDeviceId: Id
	pingListId: Id
	pingId: Id
}

export type UsageTestParticipationDeleteIn = {
	// == values

	_format: NumberString
	testId: Id
	testDeviceId: Id
	pingListId: Id
	pingId: Id
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UsageTestParticipationDeleteIn>
	_original: Nullable<UsageTestParticipationDeleteIn>
	isAdapter: false
}
