import m, { Children, Component, Vnode } from "mithril"
import { DriveBreadcrumb } from "./DriveBreadcrumb"
import { IconButton } from "../../../common/gui/base/IconButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { lang } from "../../../common/misc/LanguageViewModel"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"
import { isNotNull } from "@tutao/tutanota-utils"
import { theme } from "../../../common/gui/theme"
import { size } from "../../../common/gui/size"

export interface DriveFolderNavAttrs {
	currentFolder: DriveFolder | null
	parents: readonly DriveFolder[]
	onUploadClick: (dom: HTMLElement) => void
	onCopy: (() => unknown) | null
	onCut: (() => unknown) | null
	onPaste: (() => unknown) | null
	onNavigateToFolder: (folder: DriveFolder) => unknown
}

export class DriveFolderNav implements Component<DriveFolderNavAttrs> {
	view({ attrs: { onCopy, onCut, onPaste, onUploadClick, currentFolder, parents, onNavigateToFolder } }: Vnode<DriveFolderNavAttrs>): Children {
		return m(
			".flex.items-center.justify-between.border-radius-12",
			{
				style: {
					background: theme.surface,
					padding: `${size.base_4}px ${size.spacing_12}px ${size.base_4}px ${size.spacing_24}px`,
				},
			},
			m(DriveBreadcrumb, { currentFolder, parents, onNavigateToFolder }),
			m(".flex.items-center.column-gap-4", [
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
