import { getFileExtension } from "../../../common/api/common/utils/FileUtils"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { theme } from "../../../common/gui/theme"

export enum FileType {
	Default,
	Document,
	Image,
	Audio,
	Video,
}

// If we mapped to the color values directly, they would not
// reflect theme changes, as this record only gets evaluated once.
const fileTypeFill: Record<FileType, () => string> = {
	[FileType.Default]: () => theme.on_surface,
	[FileType.Document]: () => theme.drive_document,
	[FileType.Image]: () => theme.drive_image,
	[FileType.Audio]: () => theme.drive_audio,
	[FileType.Video]: () => theme.drive_video,
}

export type FileFormat =
	// Default
	| "File"

	// Document
	| "PDF"
	| "Text"
	| "Rich text"
	| "Word document"
	| "ODF text document"
	| "Excel sheet"
	| "ODS sheet"

	// Image
	| "JPEG"
	| "PNG"
	| "SVG"

	// Audio
	| "MPEG"
	| "AAC"
	| "Wave"
	| "MP3"

	// Video
	| "MP4"

// Heads up: when adding new mime types, test with different browsers, as they
// sometimes have their own opinions on which mime type a file should get.
const mimeTypes: Record<string, DisplayFileType> = {
	// Document
	"application/pdf": { fileType: FileType.Document, fileFormat: "PDF" },
	"text/plain": { fileType: FileType.Document, fileFormat: "Text" },
	"application/rtf": { fileType: FileType.Document, fileFormat: "Rich text" },
	"application/msword": { fileType: FileType.Document, fileFormat: "Word document" },
	// The mime type that only a trillion-dollar corporation can get you:
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": { fileType: FileType.Document, fileFormat: "Word document" },
	"application/vnd.oasis.opendocument.text": { fileType: FileType.Document, fileFormat: "ODF text document" },
	"application/vnd.ms-excel": { fileType: FileType.Document, fileFormat: "Excel sheet" },
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { fileType: FileType.Document, fileFormat: "Excel sheet" },
	"application/vnd.oasis.opendocument.spreadsheet": { fileType: FileType.Document, fileFormat: "ODS sheet" },

	// Image
	"image/jpeg": { fileType: FileType.Image, fileFormat: "JPEG" },
	"image/png": { fileType: FileType.Image, fileFormat: "PNG" },
	"image/svg+xml": { fileType: FileType.Image, fileFormat: "SVG" },

	// Audio
	"audio/mpeg": { fileType: FileType.Audio, fileFormat: "MPEG", overrides: [{ extension: ".mp3", fileFormat: "MP3" }] },
	"audio/mp4": { fileType: FileType.Audio, fileFormat: "AAC" },
	"audio/wav": { fileType: FileType.Audio, fileFormat: "Wave" },

	// Video
	// browsers cannot distinguish e.g. H.264 or AV1 from "classic" MPEG-4 video, so we always show "MP4". Sigh.
	"video/mp4": { fileType: FileType.Video, fileFormat: "MP4" },
}

// Sometimes the browser only provides a generic mime type but more information
// can be inferred by looking at the file extension, e.g. for MP3.
export type FileFormatOverride = {
	extension: string
	fileFormat: FileFormat
}

export type DisplayFileType = {
	fileType: FileType
	fileFormat: FileFormat

	overrides?: FileFormatOverride[]
}

export function getFileIcon(displayFileType: DisplayFileType): Icons {
	if (displayFileType.fileType === FileType.Document && displayFileType.fileFormat === "PDF") {
		return Icons.PDFFilled
	} else if (displayFileType.fileType === FileType.Document && displayFileType.fileFormat === "Text") {
		return Icons.TextFilled
	} else if (displayFileType.fileType === FileType.Image) {
		return Icons.PictureFilled
	} else if (displayFileType.fileType === FileType.Audio) {
		return Icons.AudioFilled
	} else if (displayFileType.fileType === FileType.Video) {
		return Icons.VideoFilled
	} else {
		return Icons.EmptyDocumentFilled
	}
}

export function getItemIconFill(maybeDisplayFileType: DisplayFileType | null): string {
	if (maybeDisplayFileType) {
		return fileTypeFill[maybeDisplayFileType.fileType]()
	} else {
		return theme.drive_folder
	}
}

export function getDisplayType(mimeType: string, fileName?: string): DisplayFileType {
	const displayType = mimeTypes[mimeType]

	if (fileName && displayType?.overrides) {
		const fileExtension = getFileExtension(fileName)
		const override = displayType.overrides.filter((override) => override.extension === fileExtension).at(0)
		if (override) {
			return { fileType: displayType.fileType, fileFormat: override.fileFormat }
		}
	}

	return displayType ?? { fileType: FileType.Default, fileFormat: "File" }
}
