import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../theme.js"

export type MenuTitleAttrsType = {
	content: string
}

// used in sidebar section title and inside setting view menus
export class MenuTitle implements Component<MenuTitleAttrsType> {
	view({ attrs }: Vnode<MenuTitleAttrsType>): Children {
		return m("small.uppercase.b.text-ellipsis", { style: { color: theme.navigation_button } }, attrs.content)
	}
}
