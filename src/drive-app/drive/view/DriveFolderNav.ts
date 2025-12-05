import m, { Children, Component, Vnode } from "mithril"
import { DriveBreadcrumb } from "./DriveBreadcrumb"
import { IconButton } from "../../../common/gui/base/IconButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { lang } from "../../../common/misc/LanguageViewModel"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"
import { isNotNull } from "@tutao/tutanota-utils"

export interface DriveFolderNavAttrs {
	currentFolder: DriveFolder | null
	parents: readonly DriveFolder[]
	onUploadClick: (dom: HTMLElement) => void
	onCopy: (() => unknown) | null
	onCut: (() => unknown) | null
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
	view({ attrs: { onCopy, onCut, onPaste, onUploadClick, currentFolder, parents, onNavigateToFolder } }: Vnode<DriveFolderNavAttrs>): Children {
		return m(
			"",
			{ style: driveFolderNavStyle },
			m(DriveBreadcrumb, { currentFolder, parents, onNavigateToFolder }),
			m(".flex.items-center.column-gap-s", [
				onPaste
					? m(IconButton, {
							title: "paste_action",
							click: onPaste,
							icon: Icons.Clipboard,
						})
					: null,
				onCopy
					? m(IconButton, {
							title: "copy_action",
							click: onCopy,
							icon: Icons.Copy,
						})
					: null,
				onCut
					? m(IconButton, {
							title: "cut_action",
							click: onCut,
							icon: Icons.Cut,
						})
					: null,
				[onPaste, onCopy, onCopy].some(isNotNull) ? m(".nav-bar-spacer") : null,
				m(IconButton, {
					title: lang.makeTranslation("Upload file", () => "Upload file"),
					click: (ev, dom) => onUploadClick(dom),
					icon: Icons.Upload,
				}),
			]),
		)
	}
}
