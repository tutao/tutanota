import o from "@tutao/otest"
import { CacheStorage, DefaultEntityRestCache } from "../../../../../src/api/worker/rest/DefaultEntityRestCache.js"
import { EntityClient } from "../../../../../src/api/common/EntityClient.js"
import { EphemeralCacheStorage } from "../../../../../src/api/worker/rest/EphemeralCacheStorage.js"
import { createTestEntity } from "../../../TestUtils.js"

import { MailTypeRef } from "../../../../../src/api/entities/tutanota/TypeRefs.js"
import { RANGE_ITEM_LIMIT, timestampToGeneratedId } from "../../../../../src/api/common/utils/EntityUtils.js"
import { matchers, object, verify, when } from "testdouble"
import { EntityRestClient } from "../../../../../src/api/worker/rest/EntityRestClient.js"

const MAIL_LIST = "mailListId"

const MAIL_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((v) => timestampToGeneratedId(Number(v)))

const EVEN_MAIL_IDS = ["2", "4", "6", "8", "10"].map((v) => timestampToGeneratedId(Number(v)))

o.spec(`EntityClientTest`, function () {
	let storage: CacheStorage
	let cache: DefaultEntityRestCache

	let entityClient: EntityClient

	let entityRestClientMock: EntityRestClient

	o.spec("mail ids", function () {
		o.beforeEach(function () {
			// targetEntityClientMockImpl = object()
			// when(object)
			var mailList = MAIL_IDS.map((id) =>
				createTestEntity(MailTypeRef, {
					_id: [MAIL_LIST, id],
					_type: MailTypeRef,
					mailDetails: object(),
				}),
			)
			mailList.reverse()
			entityRestClientMock = object()

			when(entityRestClientMock.loadRange(MailTypeRef, MAIL_LIST, timestampToGeneratedId(10), RANGE_ITEM_LIMIT, true)).thenResolve(mailList)
			//const startDate = new Date(2024, 5, 1)
			cache = new DefaultEntityRestCache(entityRestClientMock, new EphemeralCacheStorage())
			entityClient = new EntityClient(cache)
		})

		o("loadReverseRangeInBetween - load complete range", async function () {
			const mails = await entityClient.loadReverseRangeBetween(MailTypeRef, MAIL_LIST, timestampToGeneratedId(10), timestampToGeneratedId(5))
			o([9, 8, 7, 6].map((v) => timestampToGeneratedId(Number(v)))).deepEquals(mails.elements.map((m) => m._id[1]))
			verify(entityRestClientMock.loadRange(MailTypeRef, MAIL_LIST, timestampToGeneratedId(10), RANGE_ITEM_LIMIT, true), { times: 1 })
		})

		o("loadReverseRangeInBetween - second call provides entities from cache", async function () {
			const mailsFirstCall = await entityClient.loadReverseRangeBetween(MailTypeRef, MAIL_LIST, timestampToGeneratedId(10), timestampToGeneratedId(5))
			o([9, 8, 7, 6].map((v) => timestampToGeneratedId(Number(v)))).deepEquals(mailsFirstCall.elements.map((m) => m._id[1]))

			const mailsSecondCall = await entityClient.loadReverseRangeBetween(MailTypeRef, MAIL_LIST, timestampToGeneratedId(4), timestampToGeneratedId(0))
			o([3, 2, 1].map((v) => timestampToGeneratedId(Number(v)))).deepEquals(mailsSecondCall.elements.map((m) => m._id[1]))
			verify(entityRestClientMock.loadRange(MailTypeRef, MAIL_LIST, matchers.anything(), matchers.anything(), matchers.anything()), { times: 1 })
		})
	})
	o.spec("ids with gap", function () {
		o.beforeEach(function () {
			// targetEntityClientMockImpl = object()
			// when(object)
			var mailList = EVEN_MAIL_IDS.map((id) =>
				createTestEntity(MailTypeRef, {
					_id: [MAIL_LIST, id],
					_type: MailTypeRef,
					mailDetails: object(),
				}),
			)
			mailList.reverse()
			entityRestClientMock = object()

			when(entityRestClientMock.loadRange(MailTypeRef, MAIL_LIST, timestampToGeneratedId(11), RANGE_ITEM_LIMIT, true)).thenResolve(mailList)
			//const startDate = new Date(2024, 5, 1)
			cache = new DefaultEntityRestCache(entityRestClientMock, new EphemeralCacheStorage())
			entityClient = new EntityClient(cache)
		})

		o("loadReverseRangeInBetween - load complete range", async function () {
			const mails = await entityClient.loadReverseRangeBetween(MailTypeRef, MAIL_LIST, timestampToGeneratedId(11), timestampToGeneratedId(5))
			o([10, 8, 6, 4].map((v) => timestampToGeneratedId(Number(v)))).deepEquals(mails.elements.map((m) => m._id[1]))
			verify(entityRestClientMock.loadRange(MailTypeRef, MAIL_LIST, timestampToGeneratedId(11), RANGE_ITEM_LIMIT, true), { times: 1 })
		})

		o("loadReverseRangeInBetween - second call provides entities from cache", async function () {
			const mailsFirstCall = await entityClient.loadReverseRangeBetween(MailTypeRef, MAIL_LIST, timestampToGeneratedId(11), timestampToGeneratedId(3))
			o([10, 8, 6].map((v) => timestampToGeneratedId(Number(v)))).deepEquals(mailsFirstCall.elements.map((m) => m._id[1]))

			const mailsSecondCall = await entityClient.loadReverseRangeBetween(MailTypeRef, MAIL_LIST, timestampToGeneratedId(5), timestampToGeneratedId(0))
			o([4, 2].map((v) => timestampToGeneratedId(Number(v)))).deepEquals(mailsSecondCall.elements.map((m) => m._id[1]))
			verify(entityRestClientMock.loadRange(MailTypeRef, MAIL_LIST, matchers.anything(), matchers.anything(), matchers.anything()), { times: 1 })
		})
	})
})
