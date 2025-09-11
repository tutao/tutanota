import m, { Children, Component, Vnode } from "mithril"
import { DriveBreadcrumb } from "./DriveBreadcrumb"
import { IconButton } from "../../../common/gui/base/IconButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { lang } from "../../../common/misc/LanguageViewModel"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"

export interface DriveFolderNavAttrs {
	currentFolder: DriveFolder | null
	parents: readonly DriveFolder[]
	onUploadClick: (dom: HTMLElement) => void
	onPaste: (() => unknown) | null
	onNavigateToFolder: (folder: DriveFolder) => unknown
}

const driveFolderNavStyle = {
	background: "white",
	height: "52px",
	display: "flex",
	padding: "4px 12px 4px 24px",
	"border-radius": "10px",
	"align-items": "center",
	"justify-content": "space-between",
}

export class DriveFolderNav implements Component<DriveFolderNavAttrs> {
	view({ attrs: { onPaste, onUploadClick, currentFolder, parents, onNavigateToFolder } }: Vnode<DriveFolderNavAttrs>): Children {
		return m(
			"",
			{ style: driveFolderNavStyle },
			m(DriveBreadcrumb, { currentFolder, parents, onNavigateToFolder }),
			m("", [
				onPaste
					? m(IconButton, {
							title: "paste_action",
							click: onPaste,
							icon: Icons.Clipboard,
						})
					: null,
				m(IconButton, {
					title: lang.makeTranslation("Upload file", () => "Upload file"),
					click: (ev, dom) => onUploadClick(dom),
					icon: Icons.Upload,
				}),
			]),
		)
	}
}
