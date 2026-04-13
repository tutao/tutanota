import o from "@tutao/otest"
import { IServiceExecutor } from "../../../src/common/api/common/ServiceRequest.js"
import { object, verify, when } from "testdouble"
import { NewsItemStorage, NewsModel } from "../../../src/common/misc/news/NewsModel.js"
import { tutanotaServices } from "@tutao/typeRefs"
import { tutanotaTypeRefs } from "@tutao/typeRefs"
import { NewsListItem } from "../../../src/common/misc/news/NewsListItem.js"
import { Children } from "mithril"
import { createTestEntity } from "../TestUtils.js"

o.spec("NewsModel", function () {
	let newsModel: NewsModel
	let serviceExecutor: IServiceExecutor
	let storage: NewsItemStorage
	let newsIds: tutanotaTypeRefs.NewsId[]

	const DummyNews = class implements NewsListItem {
		render(newsId: tutanotaTypeRefs.NewsId): Children {
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
			createTestEntity(tutanotaTypeRefs.NewsIdTypeRef, {
				newsItemId: "ID:dummyNews",
				newsItemName: "dummyNews",
			}),
		]

		when(serviceExecutor.get(tutanotaServices.NewsService, null)).thenResolve(
			createTestEntity(tutanotaTypeRefs.NewsOutTypeRef, {
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

			const expectedNewsIn = createTestEntity(tutanotaTypeRefs.NewsInTypeRef, { newsItemId: newsIds[0].newsItemId })
			verify(serviceExecutor.post(tutanotaServices.NewsService, expectedNewsIn))
		})
	})
})
