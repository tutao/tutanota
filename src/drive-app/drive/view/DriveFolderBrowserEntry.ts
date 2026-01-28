import m, { Component, Vnode } from "mithril"
import { theme } from "../../../common/gui/theme"
import { Icon, IconAttrs, IconSize } from "../../../common/gui/base/Icon"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { FolderItem } from "./DriveUtils"
import { TabIndex } from "../../../common/api/common/TutanotaConstants"
import { lang } from "../../../common/misc/LanguageViewModel"

export interface DriveFolderBrowserEntryAttrs {
	item: FolderItem
	selected: boolean
	onSingleSelection: (f: FolderItem) => unknown
}

export class DriveFolderBrowserEntry implements Component<DriveFolderBrowserEntryAttrs> {
	view({ attrs: { item, selected, onSingleSelection } }: Vnode<DriveFolderBrowserEntryAttrs>): m.Children {
		const name = item.type === "folder" ? item.folder.name : item.file.name
		const typeLabel = lang.getTranslationText(item.type === "file" ? "file_label" : "folder_label")
		return m(
			".flex.row.folder-row.plr-12.pt-16.pb-16.gap-12",
			{
				tabindex: TabIndex.Default,
				role: "listitem",
				"aria-disabled": true,
				"aria-description": typeLabel,
				class: item.type === "folder" ? "cursor-pointer" : undefined,
				style: {
					background: selected ? theme.state_bg_hover : theme.surface,
					"border-radius": "10px",
				},
				onclick: (event: MouseEvent) => {
					onSingleSelection(item)
				},
			},
			[
				m(Icon, {
					class: item.type === "file" ? "translucent" : undefined,
					icon: item.type === "folder" ? Icons.Folder : Icons.GenericFile,
					size: IconSize.PX24,
					style: {
						fill: theme.on_surface,
					},
				} satisfies IconAttrs),
				m(".flex-grow", { class: item.type === "file" ? "translucent" : undefined }, name),
			],
		)
	}
}
