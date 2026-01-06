import m, { Children, Component, Vnode } from "mithril"
import { FolderItem } from "./DriveViewModel"
import { theme } from "../../../common/gui/theme"
import { formatDateTime } from "../../../common/misc/Formatter"

export interface DriveSidebarInfoAttrs {
	items: ReadonlySet<FolderItem>
}
export class DriveSidebarInfo implements Component<DriveSidebarInfoAttrs> {
	view({ attrs }: Vnode<DriveSidebarInfoAttrs>): Children {
		return m(
			".flex.col.border-radius-12.plr-16.pt-16.gap-16",
			{
				style: {
					width: "300px",
					backgroundColor: theme.surface,
				},
			},
			attrs.items.size === 1 ? this.renderItemInfo(attrs.items.values().next().value) : " select an item",
		)
	}

	private renderItemInfo(item: FolderItem): Children {
		return [
			m("", [m(".b", "Name: "), item.type === "file" ? item.file.name : item.folder.name]),
			m("", [m(".b", "Created at: "), item.type === "file" ? formatDateTime(item.file.createdDate) : formatDateTime(item.folder.createdDate)]),
			m("", [m(".b", "Updated at: "), item.type === "file" ? formatDateTime(item.file.updatedDate) : formatDateTime(item.folder.updatedDate)]),
		]
	}
}
