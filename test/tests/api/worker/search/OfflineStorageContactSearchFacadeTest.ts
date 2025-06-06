import o from "@tutao/otest"
import { OfflineStorageContactSearchFacade } from "../../../../../src/mail-app/workerUtils/index/OfflineStorageContactSearchFacade"
import { OfflineStorageSearchFacade } from "../../../../../src/mail-app/workerUtils/index/OfflineStorageSearchFacade"
import { object, when } from "testdouble"
import { ContactTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { SearchRestriction, SearchResult } from "../../../../../src/common/api/worker/search/SearchTypes"

o.spec("OfflineStorageContactSearchFacade", () => {
	let facade: OfflineStorageContactSearchFacade
	let offline: OfflineStorageSearchFacade

	o.beforeEach(() => {
		offline = object()
		facade = new OfflineStorageContactSearchFacade(offline)
	})

	o.test("findContacts with restriction", async () => {
		const expectedRestriction: SearchRestriction = {
			type: ContactTypeRef,
			field: "mailAddresses",
			attributeIds: null,
			start: null,
			end: null,
			folderIds: [],
			eventSeries: null,
		}

		when(offline.search("my contact", expectedRestriction, 1234)).thenResolve({
			results: [["it's me", "a contact"] as IdTuple],
		} as SearchResult)

		const result = await facade.findContacts("my contact", "mailAddresses", 1234)

		o.check(result).deepEquals([["it's me", "a contact"] as IdTuple])
	})

	o.test("findContacts without restriction", async () => {
		const expectedRestriction: SearchRestriction = {
			type: ContactTypeRef,
			field: null,
			attributeIds: null,
			start: null,
			end: null,
			folderIds: [],
			eventSeries: null,
		}

		when(offline.search("my contact", expectedRestriction, 1234)).thenResolve({
			results: [["it's me", "a contact"] as IdTuple],
		} as SearchResult)

		const result = await facade.findContacts("my contact", null, 1234)

		o.check(result).deepEquals([["it's me", "a contact"] as IdTuple])
	})
})
