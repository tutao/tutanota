import m, { Children, Component } from "mithril"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"
import { formatStorageSize } from "../../../common/misc/Formatter"
import { generatedIdToTimestamp, getElementId } from "../../../common/api/common/utils/EntityUtils"
import { DriveViewModel } from "./DriveViewModel"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { columnSizes } from "./DriveFolderContent"

export interface DriveFolderContentEntryAttrs {
	file: File
	onSelect: (f: File) => void
	checked: boolean // maybe should be inside a map inside the model
	driveViewModel: DriveViewModel
}

export const isFolder = ({ mimeType }: File) => {
	return mimeType === "tuta/folder"
}

const DriveFolderContentEntryRowStyle = {
	background: "white",
	"border-radius": "10px",
	"align-items": "center",
	"margin-bottom": "4px",
	padding: "16px 24px",
	"max-width": "fit-content",
}

const isImageMimeType = (mimeType: string) => ["image/png", "image/jpeg"].includes(mimeType)

const isMusicMimeType = (mimeType: string) => ["audio/mpeg", "audio/wav", "audio/wave", "audio/x-wav", "audio/mp4"].includes(mimeType)

const isDocumentMimeType = (mimeType: string) => ["text/plain", "application/pdf"].includes(mimeType)

const iconPerMimeType = (mimeType: string) => {
	if (isImageMimeType(mimeType)) {
		return Icons.PictureFile
	} else if (isMusicMimeType(mimeType)) {
		return Icons.MusicFile
	} else if (isDocumentMimeType(mimeType)) {
		return Icons.TextFile
	}

	return Icons.GenericFile
}

const mimeTypeRepresentations: Record<string, string> = {
	"tuta/folder": "Folder",
	"image/jpeg": "JPEG",
	"image/png": "PNG",
	"audio/mpeg": "MPEG",
	"audio/mp4": "AAC/ALAC",
	"application/pdf": "PDF",
	"text/plain": "Text",
}
const mimeTypeAsText = (mimeType: string) => {
	return mimeTypeRepresentations[mimeType] || "File"
}

export class DriveFolderContentEntry implements Component<DriveFolderContentEntryAttrs> {
	private globalIconFill = "transparent"

	view({ attrs: { file, checked, onSelect, driveViewModel } }: m.Vnode<DriveFolderContentEntryAttrs>): Children {
		const uploadDate = new Date(generatedIdToTimestamp(getElementId(file)))
		const router = driveViewModel

		const thisFileIsAFolder = isFolder(file)

		const thisFileMimeType = file.mimeType || "unknown"

		return m("div.flex.row.folder-row", { style: DriveFolderContentEntryRowStyle }, [
			m("div", { style: { width: columnSizes.select } }, m("input[type=checkbox]")),
			// m("td", m(Checkbox, { label: () => "selected", checked, onChecked: () => onSelect(file) })),
			m(
				"div",
				{ style: { width: columnSizes.icon, "text-align": "center" } },
				thisFileIsAFolder
					? m(Icon, {
							icon: Icons.Folder,
							size: IconSize.Normal,
							style: { position: "relative", top: "2px" },
						})
					: m(Icon, {
							icon: iconPerMimeType(thisFileMimeType),
							size: IconSize.Normal,
							style: { position: "relative", top: "2px" },
						}),
			),
			m(
				"div",
				{ style: { width: columnSizes.name } },
				m(
					"span",
					{
						onclick: () => {
							if (thisFileIsAFolder) {
								driveViewModel.navigateToFolder(file._id)
							} else {
								// download
								driveViewModel.downloadFile(file)
							}
						},
						class: "cursor-pointer",
					},
					file.name,
				),
			),
			m("div", { style: { width: columnSizes.type } }, mimeTypeAsText(thisFileMimeType)),
			m("div", { style: { width: columnSizes.size } }, thisFileIsAFolder ? "🐱" : formatStorageSize(Number(file.size))),
			m("div", { style: { width: columnSizes.date } }, uploadDate.toLocaleString()),
			m(
				"div",
				m("div", [
					m(
						"span",
						{
							onclick: () => {
								driveViewModel.changeFavoriteStatus(file).then(() => m.redraw())
							},
						},
						m(Icon, {
							icon: Icons.HeartEmpty,
							size: IconSize.Normal,
							style: {
								fill: file.metadata?.isFavorite ? "#707070" : this.globalIconFill,
								position: "relative",
								top: "2px",
							},
							class: "cursor-pointer",
						}),
					),
					m(
						"span",
						{
							onclick: () => {
								driveViewModel.moveToTrash(file).then(() => m.redraw())
							},
						},
						m(Icon, {
							icon: Icons.Trash,
							size: IconSize.Normal,
							style: {
								fill: "#707070",
								position: "relative",
								top: "2px",
							},
							class: "cursor-pointer",
						}),
					),
				]),
			),
		])
	}
}
