import m, { Children, Component, Vnode } from "mithril"
import { styles } from "./styles.js"
import { client } from "../misc/ClientDetector.js"
import { IconButton } from "./base/IconButton.js"
import { Icons } from "./base/icons/Icons.js"
import { isApp } from "../api/common/Env.js"

export interface BackgroundColumnLayoutAttrs {
	mobileHeader: () => Children
	desktopToolbar: () => Children
	columnLayout: Children
	backgroundColor?: string
	floatingActionButton?: () => Children
}

/**
 * A layout component that organizes the column.
 * Renders a frame for the layout and either mobile header or desktop toolbar.
 */
export class BackgroundColumnLayout implements Component<BackgroundColumnLayoutAttrs> {
	view({ attrs }: Vnode<BackgroundColumnLayoutAttrs>): Children {
		return m(
			".list-column.flex.col.fill-absolute",
			{
				style: {
					backgroundColor: attrs.backgroundColor,
				},
			},
			[
				styles.isUsingBottomNavigation() ? attrs.mobileHeader() : attrs.desktopToolbar(),
				m(".flex-grow.rel", attrs.columnLayout),
				attrs.floatingActionButton?.(),
			],
		)
	}
}
