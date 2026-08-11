import { DriveFile, DriveFileTypeRef, DriveFolder, DriveFolderTypeRef } from "@tutao/entities/drive"
import { isSameTypeRef } from "@tutao/meta"

export function isDriveFile(source: DriveFile | DriveFolder): source is DriveFile {
	return isSameTypeRef(source._type, DriveFileTypeRef)
}

export function isDriveFolder(source: DriveFile | DriveFolder): source is DriveFolder {
	return isSameTypeRef(source._type, DriveFolderTypeRef)
}
