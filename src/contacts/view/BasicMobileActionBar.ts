import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "../../gui/base/IconButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { ClickHandler } from "../../gui/base/GuiUtils.js"

export interface BasicMobileActionBarAttrs {
	editAction?: ClickHandler
	deleteAction?: ClickHandler
}

/** Toolbar with delete & edit actions at the bottom of single-column layout. */
export class BasicMobileActionBar implements Component<BasicMobileActionBarAttrs> {
	view(vnode: Vnode<BasicMobileActionBarAttrs>): Children {
		const { attrs } = vnode

		return m(
			".bottom-nav.bottom-action-bar.flex.items-center.plr-l",
			{
				style: {
					justifyContent: "space-around",
				},
			},
			[
				attrs.deleteAction
					? m(IconButton, {
							title: "delete_action",
							icon: Icons.Trash,
							click: attrs.deleteAction,
					  })
					: null,
				attrs.editAction
					? m(IconButton, {
							title: "edit_action",
							icon: Icons.Edit,
							click: attrs.editAction,
					  })
					: null,
			],
		)
	}
}
