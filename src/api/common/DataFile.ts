import type {File as TutanotaFile} from "../entities/tutanota/TypeRefs.js"


export interface DataFile {
	readonly _type: 'DataFile',
	name: string,
	mimeType: string,
	data: Uint8Array,
	size: number,
	id?: IdTuple,
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

export function convertToDataFile(file: File | TutanotaFile, data: Uint8Array): DataFile {
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

export function getCleanedMimeType(mimeType: string | null): string {
	if (!mimeType || mimeType.trim() === "") {
		return "application/octet-stream"
	} else {
		return mimeType.replace(/"/g, "").replace(/'/g, "")
	}
}