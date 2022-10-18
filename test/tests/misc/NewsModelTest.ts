import o from "ospec"
import {IServiceExecutor} from "../../../src/api/common/ServiceRequest.js"
import {object, replace, verify, when} from "testdouble"
import {NewsModel} from "../../../src/news/NewsModel.js"
import {NewsService} from "../../../src/api/entities/tutanota/Services.js"
import {createNewsId, createNewsIn, createNewsOut, NewsId} from "../../../src/api/entities/tutanota/TypeRefs.js"
import {NewsListItem} from "../../../src/news/NewsListItem.js"
import {Children} from "mithril"

o.spec("NewsModel", function () {
	let newsModel: NewsModel
	let serviceExecutor: IServiceExecutor
	let newsIds: NewsId[]

	const DummyNews = class extends NewsListItem {
		render(newsId: NewsId): Children {
			return null
		}

		isShown(): boolean {
			return true
		}
	}


	o.beforeEach(function () {
		serviceExecutor = object()

		newsModel = new NewsModel(serviceExecutor)

		replace(newsModel, "importNewsImpl", (newsItemName: string) => {
			return DummyNews
		})

		newsIds = [
			createNewsId({
				newsItemId: "ID:dummyNews",
				newsItemName: "dummyNews",
			})
		]

		when(serviceExecutor.get(NewsService, null))
			.thenResolve(createNewsOut({
				newsItemIds: newsIds,
			}))
	})


	o.spec("news", function () {
		o("correctly loads news", async function () {
			await newsModel.loadNewsIds()

			o(newsModel.liveNewsIds[0].newsItemId).equals(newsIds[0].newsItemId)
			o(Object.keys(newsModel.liveNewsListItems).length).equals(1)
		})

		o("correctly acknowledges news", async function () {
			await newsModel.loadNewsIds()

			await newsModel.liveNewsListItems[newsIds[0].newsItemName].acknowledge(newsIds[0])

			verify(serviceExecutor.post(NewsService, createNewsIn({newsItemId: newsIds[0].newsItemId})))
		})
	})
})