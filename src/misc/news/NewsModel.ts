import { createNewsIn, NewsId, NewsOut } from "../../api/entities/tutanota/TypeRefs.js"
import { IServiceExecutor } from "../../api/common/ServiceRequest.js"
import { NewsService } from "../../api/entities/tutanota/Services.js"
import { NotFoundError } from "../../api/common/error/RestError.js"
import { NewsListItem } from "./NewsListItem.js"
import { DeviceConfig } from "../DeviceConfig.js"

/**
 * Makes calls to the NewsService in order to load the user's unacknowledged NewsItems and stores them.
 */
export class NewsModel {
	liveNewsIds: NewsId[] = []
	liveNewsListItems: Record<string, NewsListItem> = {}

	constructor(
		private readonly serviceExecutor: IServiceExecutor,
		private readonly deviceConfig: DeviceConfig,
		private readonly newsListItemFactory: (name: string) => Promise<NewsListItem | null>,
	) {}

	/**
	 * Loads the user's unacknowledged NewsItems.
	 */
	async loadNewsIds(): Promise<NewsId[]> {
		const response: NewsOut = await this.serviceExecutor.get(NewsService, null)

		this.liveNewsIds = []
		this.liveNewsListItems = {}

		for (const newsItemId of response.newsItemIds) {
			const newsItemName = newsItemId.newsItemName
			const newsListItem = await this.newsListItemFactory(newsItemName)

			if (!!newsListItem && newsListItem.isShown(newsItemId)) {
				this.liveNewsIds.push(newsItemId)
				this.liveNewsListItems[newsItemName] = newsListItem
			}
		}

		return this.liveNewsIds
	}

	/**
	 * Acknowledges the NewsItem with the given ID.
	 */
	async acknowledgeNews(newsItemId: Id): Promise<boolean> {
		const data = createNewsIn({ newsItemId })

		try {
			await this.serviceExecutor.post(NewsService, data)
			return true
		} catch (e) {
			if (e instanceof NotFoundError) {
				// NewsItem not found, likely deleted on the server
				console.log(`Could not acknowledge newsItem with ID '${newsItemId}'`)
				return false
			} else {
				throw e
			}
		} finally {
			await this.loadNewsIds()
		}
	}

	acknowledgeNewsForDevice(newsItemId: Id) {
		return this.deviceConfig.acknowledgeNewsItemForDevice(newsItemId)
	}

	hasAcknowledgedNewsForDevice(newsItemId: Id): boolean {
		return this.deviceConfig.hasAcknowledgedNewsItemForDevice(newsItemId)
	}
}
