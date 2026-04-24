import { ApplicationTypesHash } from "./EntityFunctions.js"
import { DownloadableFileEntity } from "./BlobUtils.js"

/**
 * Do **NOT** change the names of these attributes, they need to match the record found on the
 * server at ApplicationTypesService#ApplicationTypesGetOut. This is to make sure we can update the
 * format of the service output in the future. With general schema definitions this would not be
 * possible as schemas returned by this service are required to read the schemas themselves.
 */
export type ApplicationTypesGetOut = {
	applicationTypesHash: ApplicationTypesHash
	applicationTypesJson: string
}

// .msg export is handled in DesktopFileExport because it uses APIs that can't be loaded web side
export type MailExportMode = "msg" | "eml"
/**
 * Used to pass all downloaded mail stuff to the desktop side to be exported as a file
 * Ideally this would just be {Mail, Headers, Body, FileReference[]}
 * but we can't send Dates over to the native side, so we may as well just extract everything here
 */
export type MailBundleRecipient = {
	address: string
	name?: string
}

export type MailBundle = {
	mailId: IdTuple
	subject: string
	body: string
	sender: MailBundleRecipient
	to: MailBundleRecipient[]
	cc: MailBundleRecipient[]
	bcc: MailBundleRecipient[]
	replyTo: MailBundleRecipient[]
	isDraft: boolean
	isRead: boolean
	sentOn: number
	// UNIX timestamp
	receivedOn: number // UNIX timestamp,
	headers: string | null
	attachments: DataFile[]
}

/**
 * a structure containing file content and metadata
 */
export interface DataFile {
	readonly _type: "DataFile"
	name: string
	mimeType: string
	data: Uint8Array
	size: number
	id?: IdTuple
	cid?: string
}

export function createDataFile(name: string, mimeType: string, data: Uint8Array, cid?: string): DataFile {
	return {
		_type: "DataFile",
		name: name,
		mimeType: getCleanedMimeType(mimeType),
		data: data,
		size: data.byteLength,
		id: undefined,
		cid,
	}
}

export function convertToDataFile(file: File | DownloadableFileEntity, data: Uint8Array): DataFile {
	if ("_type" in file) {
		return {
			_type: "DataFile",
			name: file.name,
			mimeType: getCleanedMimeType(file.mimeType),
			data: data,
			size: data.byteLength,
			id: file._id,
			cid: file.cid ?? undefined,
		}
	} else {
		return {
			_type: "DataFile",
			name: file.name,
			mimeType: getCleanedMimeType(file.type),
			data: data,
			size: data.byteLength,
			id: undefined, // file read from filesystem, does not have an id because it has not been stored in tutanota.
		}
	}
}

/** make sure we have a valid mime type by replacing empty ones with "application/octet-stream" and
 * removing double quotes and single quotes*/
export function getCleanedMimeType(mimeType: string | null): string {
	if (!mimeType || mimeType.trim() === "") {
		return "application/octet-stream"
	} else {
		return mimeType.replace(/"/g, "").replace(/'/g, "")
	}
}
