import m, { Children, Component, Vnode } from "mithril"
import { NewsListItem } from "./NewsListItem.js"
import ColumnEmptyMessageBox from "../../../ui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../../ui/theme.js"
import { Icons } from "../../../ui/base/icons/Icons.js"
import { Dialog } from "../../../ui/base/Dialog.js"
import { NewsId } from "@tutao/entities/tutanota"

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
				icon: Icons.LightbulbFilled,
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
