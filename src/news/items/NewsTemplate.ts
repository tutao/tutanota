import {NewsListItem} from "../NewsListItem.js"
import {NewsId} from "../../api/entities/tutanota/TypeRefs.js"
import m, {Children} from "mithril"
import {Button, ButtonType} from "../../gui/base/Button.js"

export default class NewsTemplate extends NewsListItem {
	isShown(): boolean {
		return true
	}

	render(newsId: NewsId): Children {
		return m(".full-width", [
			m("h4", newsId.newsItemName),
			m("p", "This is just a basic news template with a button to dismiss it."),
			m(
				".flex-end",
				m(Button, {
					label: () => "Dismiss",
					click: () => this.acknowledge(newsId),
					type: ButtonType.Secondary,
				}),
			),
		])
	}
}
