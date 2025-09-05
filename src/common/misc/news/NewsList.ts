import m, { Children, Component, Vnode } from "mithril"
import { NewsId } from "../../api/entities/tutanota/TypeRefs.js"
import { NewsListItem } from "./NewsListItem.js"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../gui/theme.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { Dialog } from "../../gui/base/Dialog.js"

export interface NewsListAttrs {
	liveNewsListItems: Record<string, NewsListItem>
	liveNewsIds: NewsId[]
	dialog: Dialog
}

/**
 * Renders the user's list of unacknowledged news.
 */
export class NewsList implements Component<NewsListAttrs> {
	view(vnode: Vnode<NewsListAttrs>): Children {
		if (vnode.attrs.liveNewsIds.length === 0) {
			return m(ColumnEmptyMessageBox, {
				message: "noNews_msg",
				icon: Icons.Bulb,
				color: theme.on_surface_variant,
			})
		}

		return m(
			"",
			vnode.attrs.liveNewsIds.map((liveNewsId) => {
				const newsListItem = vnode.attrs.liveNewsListItems[liveNewsId.newsItemName]

				return m(
					".pt-16.pl-24.pr-24.flex.fill.border-grey.left.list-border-bottom",
					{ key: liveNewsId.newsItemId },
					newsListItem.render(liveNewsId, vnode.attrs.dialog),
				)
			}),
		)
	}
}
