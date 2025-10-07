import m, { Children, Component } from "mithril"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"
import { formatStorageSize } from "../../../common/misc/Formatter"
import { generatedIdToTimestamp, getElementId } from "../../../common/api/common/utils/EntityUtils"
import { DriveViewModel } from "./DriveViewModel"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { Icons } from "../../../common/gui/base/icons/Icons"

export interface DriveFolderContentEntryAttrs {
	file: File
	onSelect: (f: File) => void
	checked: boolean // maybe should be inside a map inside the model
	driveViewModel: DriveViewModel
}

export const isFolder = ({ mimeType }: File) => {
	return mimeType === "tuta/folder"
}

export class DriveFolderContentEntry implements Component<DriveFolderContentEntryAttrs> {
	private globalIconFill = "transparent"

	view({ attrs: { file, checked, onSelect, driveViewModel } }: m.Vnode<DriveFolderContentEntryAttrs>): Children {
		const uploadDate = new Date(generatedIdToTimestamp(getElementId(file)))
		const router = driveViewModel

		const thisFileIsAFolder = isFolder(file)

		return m("tr", [
			m("td", m("input[type=checkbox]")),
			// m("td", m(Checkbox, { label: () => "selected", checked, onChecked: () => onSelect(file) })),
			m(
				"td",
				thisFileIsAFolder
					? m(Icon, {
							icon: Icons.Folder,
							size: IconSize.Normal,
							style: { position: "relative", top: "2px" },
						})
					: null,
			),
			m(
				"td",
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
			m("td", file.mimeType?.split("/")[1]),
			m("td", thisFileIsAFolder ? "🐱" : formatStorageSize(Number(file.size))),
			m("td", uploadDate.toLocaleString()),
			m(
				"td",
				m("div", [
					m(
						"span",
						{
							onclick: () => {
								driveViewModel.addToFavorite(file).then(() => m.redraw())
							},
						},
						m(Icon, {
							icon: Icons.HeartEmpty,
							size: IconSize.Normal,
							style: { fill: file.metadata?.isFavorite ? "#707070" : this.globalIconFill, position: "relative", top: "2px" },
							class: "cursor-pointer",
						}),
					),
				]),
			),
		])
	}
}
