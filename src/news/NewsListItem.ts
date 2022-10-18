import m, {Children} from "mithril"
import {NewsId} from "../api/entities/tutanota/TypeRefs.js"
import {NewsModel} from "./NewsModel.js"

export abstract class NewsListItem {
	constructor(public newsModel: NewsModel) {
	}

	/**
	 * Returns the rendered NewsItem. Should display a button that acknowledges the news via acknowledge().
	 */
	abstract render(newsId: NewsId): Children

	/**
	 * Return true iff the news should be shown to the logged-in user.
	 */
	abstract isShown(): boolean

	/**
	 * Acknowledges the NewsItem with the given NewsId.
	 */
	acknowledge(newsId: NewsId): Promise<void> {
		return this.newsModel.acknowledgeNews(newsId.newsItemId).then(success => {
			this.newsModel.loadNewsIds().then(m.redraw)
		})
	}
}
