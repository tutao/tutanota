import { DriveFile, DriveFileTypeRef, DriveFolder } from "@tutao/entities/drive"
import { isSameTypeRef } from "@tutao/meta"

export function isDriveFile(source: DriveFile | DriveFolder): source is DriveFile {
	return isSameTypeRef(source._type, DriveFileTypeRef)
}
