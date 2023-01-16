import o from "ospec"
import { IServiceExecutor } from "../../../src/api/common/ServiceRequest.js"
import { object, verify, when } from "testdouble"
import { NewsModel } from "../../../src/misc/news/NewsModel.js"
import { NewsService } from "../../../src/api/entities/tutanota/Services.js"
import { createNewsId, createNewsIn, createNewsOut, NewsId } from "../../../src/api/entities/tutanota/TypeRefs.js"
import { NewsListItem } from "../../../src/misc/news/NewsListItem.js"
import { Children } from "mithril"
import { DeviceConfig } from "../../../src/misc/DeviceConfig.js"

o.spec("NewsModel", function () {
	let newsModel: NewsModel
	let serviceExecutor: IServiceExecutor
	let deviceConfig: DeviceConfig
	let newsIds: NewsId[]

	const DummyNews = class implements NewsListItem {
		render(newsId: NewsId): Children {
			return null
		}

		isShown(): boolean {
			return true
		}
	}

	o.beforeEach(function () {
		serviceExecutor = object()
		deviceConfig = object()

		newsModel = new NewsModel(serviceExecutor, deviceConfig, async () => new DummyNews())

		newsIds = [
			createNewsId({
				newsItemId: "ID:dummyNews",
				newsItemName: "dummyNews",
			}),
		]

		when(serviceExecutor.get(NewsService, null)).thenResolve(
			createNewsOut({
				newsItemIds: newsIds,
			}),
		)
	})

	o.spec("news", function () {
		o("correctly loads news", async function () {
			await newsModel.loadNewsIds()

			o(newsModel.liveNewsIds[0].newsItemId).equals(newsIds[0].newsItemId)
			o(Object.keys(newsModel.liveNewsListItems).length).equals(1)
		})

		o("correctly acknowledges news", async function () {
			await newsModel.loadNewsIds()

			await newsModel.acknowledgeNews(newsIds[0].newsItemId)

			verify(serviceExecutor.post(NewsService, createNewsIn({ newsItemId: newsIds[0].newsItemId })))
		})
	})
})
