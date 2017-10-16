// @flow
import {FileTypeRef} from "../entities/tutanota/File"
import {isSameTypeRef} from "./EntityFunctions"

export function createDataFile(file: File|TutanotaFile, data: Uint8Array) {
	if (file._type && isSameTypeRef((file:any)._type, FileTypeRef)) {
		let tutanotaFile = ((file:any):TutanotaFile)
		return {
			_type: 'DataFile',
			name: tutanotaFile.name,
			mimeType: getCleanedMimeType(tutanotaFile.mimeType),
			data: data,
			size: data.byteLength,
			id: tutanotaFile._id,
		}
	} else {
		let nativeFile = ((file:any):File)
		return {
			_type: 'DataFile',
			name: nativeFile.name,
			mimeType: getCleanedMimeType(nativeFile.type),
			data: data,
			size: data.byteLength,
			id: null // file read from filesystem, does not have an id because it has not been stored in tutanota.
		}
	}
}

export function getCleanedMimeType(mimeType: ?string): string {
	if (!mimeType || mimeType.trim() == "") {
		return "application/octet-stream"
	} else {
		return mimeType.replace(/"/g, "").replace(/'/g, "");
	}
}