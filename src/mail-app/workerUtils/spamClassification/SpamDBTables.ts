import { KeyVersion } from "@tutao/tutanota-utils"

export type ObjectStoreName = string
export type IndexName = string

// TODO: decide if we save everything in one Object Store or every attribute in a different one.
export const SpamClassificationModel: ObjectStoreName = "SpamClassificationModel"
export const WeightSpecsOS: ObjectStoreName = "WeightSpecs"
export const WeightDataOS: ObjectStoreName = "WeightData"
export const SpamMetaDataOS: ObjectStoreName = "SpamMetaData"
export const Metadata = Object.freeze({
	userEncDbKey: "userEncDbKey",
	encDbIv: "encDbIv",
	userGroupKeyVersion: "userGroupKeyVersion",
	lastModelSavedTimeMs: "lastModelSavedTimeMs",
})
export type EncryptedDbKeyBaseMetaData = {
	userEncDbKey: Uint8Array
	encDbIv: Uint8Array
	userGroupKeyVersion: KeyVersion
}

export type EncryptedSpamMetaData = EncryptedDbKeyBaseMetaData & {
	lastModelSavedTimeMs: number
}
