import m, { Component, Vnode } from "mithril"
import { theme } from "../../../common/gui/theme"
import { Icon, IconAttrs, IconSize } from "../../../common/gui/base/Icon"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { FolderItem } from "./DriveUtils"
import { Keys, TabIndex } from "../../../common/api/common/TutanotaConstants"
import { lang } from "../../../common/misc/LanguageViewModel"
import { isKeyPressed } from "../../../common/misc/KeyManager"

export interface DriveFolderBrowserEntryAttrs {
	item: FolderItem
	isInvalidTarget: boolean
	selected: boolean
	onSingleSelection: (f: FolderItem) => unknown
}

export class DriveFolderBrowserEntry implements Component<DriveFolderBrowserEntryAttrs> {
	view({ attrs: { item, isInvalidTarget, selected, onSingleSelection } }: Vnode<DriveFolderBrowserEntryAttrs>): m.Children {
		const name = item.type === "folder" ? item.folder.name : item.file.name
		const typeLabel = lang.getTranslationText(item.type === "file" ? "file_label" : "folder_label")
		return m(
			".flex.row.folder-row.plr-12.pt-16.pb-16.gap-12",
			{
				tabindex: selected ? TabIndex.Default : TabIndex.Programmatic,
				role: "row",
				"aria-description": typeLabel,
				class: isInvalidTarget ? undefined : "cursor-pointer",
				style: {
					background: theme.surface,
					"border-radius": "10px",
				},
				onclick: (event: MouseEvent) => {
					onSingleSelection(item)
				},
				onkeydown: (event: KeyboardEvent) => {
					if (isKeyPressed(event.key, Keys.RETURN, Keys.SPACE)) {
						onSingleSelection(item)
					}
				},
			},
			[
				m(Icon, {
					class: isInvalidTarget ? "translucent" : undefined,
					icon: item.type === "folder" ? Icons.Folder : Icons.GenericFile,
					size: IconSize.PX24,
					style: {
						fill: theme.on_surface,
					},
				} satisfies IconAttrs),
				m(".flex-grow.text-ellipsis", { class: isInvalidTarget ? "translucent" : undefined, role: "gridcell" }, name),
			],
		)
	}
}
