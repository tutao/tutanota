import o from "@tutao/otest"
import { IServiceExecutor } from "../../../src/platform-kit/network/ServiceRequest.js"
import { object, verify, when } from "testdouble"
import { NewsItemStorage, NewsModel } from "../../../src/applications/common/misc/news/NewsModel.js"

import { NewsListItem } from "../../../src/applications/common/misc/news/NewsListItem.js"
import { Children } from "mithril"
import { createTestEntity } from "../TestUtils.js"
import { NewsId, NewsIdTypeRef, NewsInTypeRef, NewsOutTypeRef, NewsService_GET, NewsService_POST } from "@tutao/entities/tutanota"
import { NON_EXISTENT_DATA_TRANSFER_ENTITY } from "../../../src/platform-kit/meta"

o.spec("NewsModel", function () {
	let newsModel: NewsModel
	let serviceExecutor: IServiceExecutor
	let storage: NewsItemStorage
	let newsIds: NewsId[]

	const DummyNews = class implements NewsListItem {
		render(newsId: NewsId): Children {
			return null
		}

		isShown(): Promise<boolean> {
			return Promise.resolve(true)
		}
	}

	o.beforeEach(function () {
		serviceExecutor = object()
		storage = object()

		newsModel = new NewsModel(serviceExecutor, storage, async () => new DummyNews())

		newsIds = [
			createTestEntity(NewsIdTypeRef, {
				newsItemId: "ID:dummyNews",
				newsItemName: "dummyNews",
			}),
		]

		when(serviceExecutor.execute(NewsService_GET, NON_EXISTENT_DATA_TRANSFER_ENTITY, null)).thenResolve(
			createTestEntity(NewsOutTypeRef, {
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

			const expectedNewsIn = createTestEntity(NewsInTypeRef, { newsItemId: newsIds[0].newsItemId })
			verify(serviceExecutor.execute(NewsService_POST, expectedNewsIn, null))
		})
	})
})
