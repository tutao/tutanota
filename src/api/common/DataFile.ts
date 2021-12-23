import type {File as TutanotaFile} from "../entities/tutanota/File"
import {FileTypeRef} from "../entities/tutanota/File"
import {isSameTypeRef} from "@tutao/tutanota-utils"


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
        id: null,
        cid,
    }
}
export function convertToDataFile(file: File | TutanotaFile, data: Uint8Array): DataFile {
    if (file._type && isSameTypeRef((file as any)._type, FileTypeRef)) {
        const tutanotaFile = (file as any) as TutanotaFile
        return {
            _type: "DataFile",
            name: tutanotaFile.name,
            mimeType: getCleanedMimeType(tutanotaFile.mimeType),
            data: data,
            size: data.byteLength,
            id: tutanotaFile._id,
            cid: tutanotaFile.cid,
        }
    } else {
        const nativeFile = (file as any) as File
        return {
            _type: "DataFile",
            name: nativeFile.name,
            mimeType: getCleanedMimeType(nativeFile.type),
            data: data,
            size: data.byteLength,
            id: null, // file read from filesystem, does not have an id because it has not been stored in tutanota.
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