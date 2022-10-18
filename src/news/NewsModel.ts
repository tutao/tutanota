import {createNewsIn, NewsId, NewsOut} from "../api/entities/tutanota/TypeRefs.js"
import {IServiceExecutor} from "../api/common/ServiceRequest.js"
import {NewsService} from "../api/entities/tutanota/Services.js"
import {NotFoundError} from "../api/common/error/RestError.js"
import {isOfflineError} from "../api/common/utils/ErrorCheckUtils.js"
import {NewsListItem} from "./NewsListItem.js"


const newsNameImportMap: Record<string, () => Promise<any>> = {
	usageOptIn: () => import("./items/UsageOptInNews.js"),
	test3: () => import("./items/UsageOptInNews.js"), // FIXME remove
	testOld: () => import("./items/NewsTemplate.js"), // FIXME remove
	testOlder: () => import("./items/NewsTemplate.js"), // FIXME remove
	testOldest: () => import("./items/NewsTemplate.js"), // FIXME remove
}

export class NewsModel {
	liveNewsIds: NewsId[] = []
	liveNewsListItems: Record<string, NewsListItem> = {}

	constructor(
		private readonly serviceExecutor: IServiceExecutor,
	) {
	}

	private async importNewsImpl(newsItemName: string) {
		const importFunc = newsNameImportMap[newsItemName]
		if (!importFunc) {
			console.log(`Found no news item implementation for news '${newsItemName}'`)
			return null
		} else {
			const module = await importFunc()
			return module.default
		}
	}

	/**
	 * Loads the user's unacknowledged NewsItems.
	 */
	async loadNewsIds(): Promise<NewsId[]> {
		try {
			const response: NewsOut = await this.serviceExecutor.get(NewsService, null)

			this.liveNewsIds = []
			this.liveNewsListItems = {}

			response.newsItemIds.map(async newsItemId => {
				const newsItemName = newsItemId.newsItemName
				const newsImpl = await this.importNewsImpl(newsItemName)

				if (newsImpl) {
					const newsListItem = new newsImpl(this)

					if (newsListItem.isShown()) {
						this.liveNewsIds.push(newsItemId)
						this.liveNewsListItems[newsItemName] = newsListItem
					}
				}
			})
			return this.liveNewsIds
		} catch (e) {
			if (isOfflineError(e)) {
				return []
			} else {
				throw e
			}
		}
	}

	/**
	 * Acknowledges the NewsItem with the given ID.
	 */
	async acknowledgeNews(newsItemId: string): Promise<boolean> {
		const data = createNewsIn({newsItemId})

		try {
			await this.serviceExecutor.post(NewsService, data)
			return Promise.resolve(true)
		} catch (e) {
			if (e instanceof NotFoundError) {
				// NewsItem not found, likely deleted on the server
				console.log(`Could not acknowledge newsItem with ID '${newsItemId}'`)
				return Promise.resolve(false)
			} else {
				throw e
			}
		}
	}
}