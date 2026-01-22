import m, { Component, Vnode } from "mithril"
import { theme } from "../../../common/gui/theme"
import { Icon, IconAttrs, IconSize } from "../../../common/gui/base/Icon"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { FolderItem } from "./DriveUtils"

export interface DriveFolderBrowserEntryAttrs {
	item: FolderItem
	selected: boolean
	onSingleSelection: (f: FolderItem) => unknown
}

export class DriveFolderBrowserEntry implements Component<DriveFolderBrowserEntryAttrs> {
	view({ attrs: { item, selected, onSingleSelection } }: Vnode<DriveFolderBrowserEntryAttrs>): m.Children {
		return m(
			"div.flex.row.folder-row.plr-12.pt-16.pb-16.gap-12",
			{
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
				// FIXME: Use iconPerMimeType() for files as in FolderContentEntry
				m(Icon, {
					class: item.type === "file" ? "translucent" : undefined,
					icon: item.type === "folder" ? Icons.Folder : Icons.GenericFile,
					size: IconSize.PX24,
					style: {
						fill: theme.on_surface,
					},
				} satisfies IconAttrs),
				m(".flex-grow", { class: item.type === "file" ? "translucent" : undefined }, item.type === "folder" ? item.folder.name : item.file.name),
			],
		)
	}
}
