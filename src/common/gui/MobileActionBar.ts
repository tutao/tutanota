import m, { Children, Component, Vnode } from "mithril"
<<<<<<<< HEAD:src/common/gui/MobileActionBar.ts
import { IconButton, IconButtonAttrs } from "./base/IconButton.js"
import { ClickHandler } from "./base/GuiUtils.js"
========
import { IconButton, IconButtonAttrs } from "../../../common/gui/base/IconButton.js"
import { ClickHandler } from "../../../common/gui/base/GuiUtils.js"
>>>>>>>> 3349a964d (Move files to new folder structure):src/mail-app/contacts/view/MobileActionBar.ts

export interface MobileActionAttrs {
	icon: IconButtonAttrs["icon"]
	title: IconButtonAttrs["title"]
	action: ClickHandler
}

export interface MobileActionBarAttrs {
	actions: Array<MobileActionAttrs>
}

/** Toolbar with optional delete & edit actions at the bottom of single-column layout. */
export class MobileActionBar implements Component<MobileActionBarAttrs> {
	view(vnode: Vnode<MobileActionBarAttrs>): Children {
		const { attrs } = vnode

		return m(
			".bottom-nav.bottom-action-bar.flex.items-center.plr-l",
			{
				style: {
					justifyContent: "space-around",
				},
			},
			attrs.actions.map((action) =>
				m(IconButton, {
					title: action.title,
					icon: action.icon,
					click: action.action,
				}),
			),
		)
	}
}
