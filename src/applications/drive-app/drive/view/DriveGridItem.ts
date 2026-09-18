import m, { Children, Component, Vnode } from "mithril"
import { FolderItem } from "./DriveUtils"
import { getDisplayType, getFileIcon } from "../model/DriveMimeUtils"
import { theme } from "../../../../ui/theme"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { Icons } from "../../../../ui/base/icons/Icons"
import { assertNotNull } from "@tutao/utils"
import { IconButton } from "../../../../ui/base/IconButton"

export interface DriveGridItemAttrs {
	item: FolderItem
}

export class DriveGridItem implements Component<DriveGridItemAttrs> {
	view(vnode: Vnode<DriveGridItemAttrs>): Children {
		const item = vnode.attrs.item
		const displayType = item.type === "file" ? getDisplayType(item.file.mimeType, item.file.name) : null
		return m(
			".flex.col.items-stretch.p-8",
			{
				style: {
					backgroundColor: theme.surface,
					width: "200px",
					height: "300px",
				},
			},
			[
				m(
					".flex-grow.flex.items-center.justify-center",
					m(Icon, {
						icon: item.type === "folder" ? Icons.FolderFilled : getFileIcon(assertNotNull(displayType)),
						size: IconSize.PX64,
						container: "div",
					}),
				),
			],
			m(".flex.limit-width.items-center", [
				m("div.text-ellipsis.flex-grow", item.type === "file" ? item.file.name : item.folder.name),
				m(IconButton, { icon: Icons.More, label: "more_label", click: () => {} }),
			]),
		)
	}
}
