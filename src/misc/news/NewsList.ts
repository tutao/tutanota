import m, {Children, Component, Vnode} from "mithril"
import {NewsId} from "../../api/entities/tutanota/TypeRefs.js"
import {lang} from "../LanguageViewModel.js"
import {NewsListItem} from "./NewsListItem.js"


/**
 * Renders the user's list of unacknowledged news.
 */
export interface NewsListAttrs {
	liveNewsListItems: Record<string, NewsListItem>
	liveNewsIds: NewsId[]
}

export class NewsList implements Component<NewsListAttrs> {
	view(vnode: Vnode<NewsListAttrs>): Children {
		if (vnode.attrs.liveNewsIds.length === 0) {
			return m(".center.news-item.pt.pl-l.pr-l", lang.get("noNews_msg"))
		}

		return m("", vnode.attrs.liveNewsIds.map(liveNewsId => {
			const newsListItem = vnode.attrs.liveNewsListItems[liveNewsId.newsItemName]

			return m(".news-item.pt.pl-l.pr-l.flex.fill.border-grey.left.list-border-bottom",
				{key: liveNewsId.newsItemId}, newsListItem.render(liveNewsId))
		}))
	}
}
