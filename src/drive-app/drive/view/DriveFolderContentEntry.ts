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
	height: "56px",
	background: "white",
	"border-radius": "10px",
	"align-items": "center",
	"margin-bottom": "4px",
	"padding-left": "24px",
	"padding-right": "24px",
	"max-width": "fit-content",
}

export class DriveFolderContentEntry implements Component<DriveFolderContentEntryAttrs> {
	private globalIconFill = "transparent"

	view({ attrs: { file, checked, onSelect, driveViewModel } }: m.Vnode<DriveFolderContentEntryAttrs>): Children {
		const uploadDate = new Date(generatedIdToTimestamp(getElementId(file)))
		const router = driveViewModel

		const thisFileIsAFolder = isFolder(file)

		return m("div.flex.row", { style: DriveFolderContentEntryRowStyle }, [
			m("div", { style: { display: "flex", gap: "16px" } }, [
				m("div", { style: { width: columnSizes.select } }, m("input[type=checkbox]")),
				// m("td", m(Checkbox, { label: () => "selected", checked, onChecked: () => onSelect(file) })),
				m(
					"div",
					{ style: { width: columnSizes.icon } },
					thisFileIsAFolder
						? m(Icon, {
								icon: Icons.Folder,
								size: IconSize.Normal,
								// style: { position: "relative", top: "2px" },
							})
						: null,
					// choose right icon depending on type
					// m(Icon, {
					// 		icon: Icons.Draft,
					// 		size: IconSize.Normal,
					// 		// style: { position: "relative", top: "2px" },
					// 	}),
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
			]),
			m("div", { style: { width: columnSizes.type } }, file.mimeType?.split("/")[1]),
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
