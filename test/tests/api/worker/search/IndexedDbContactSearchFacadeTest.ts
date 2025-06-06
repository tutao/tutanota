import o from "@tutao/otest"
import { object, when } from "testdouble"
import { ContactTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { IndexedDbContactSearchFacade } from "../../../../../src/mail-app/workerUtils/index/IndexedDbContactSearchFacade"
import { IndexedDbSearchFacade } from "../../../../../src/mail-app/workerUtils/index/IndexedDbSearchFacade"
import { clientInitializedTypeModelResolver } from "../../../TestUtils"
import { TypeModelResolver } from "../../../../../src/common/api/common/EntityFunctions"
import { SearchRestriction, SearchResult } from "../../../../../src/common/api/worker/search/SearchTypes"
import { typedValues } from "@tutao/tutanota-utils"

o.spec("IndexedDbContactSearchFacade", () => {
	let facade: IndexedDbContactSearchFacade
	let offline: IndexedDbSearchFacade
	let typeModelResolver: TypeModelResolver

	o.beforeEach(() => {
		typeModelResolver = clientInitializedTypeModelResolver()
		offline = object()
		facade = new IndexedDbContactSearchFacade(offline, typeModelResolver)
	})

	o.spec("findContacts", () => {
		o.test("mailAddress", async () => {
			const mailType = await typeModelResolver.resolveClientTypeReference(ContactTypeRef)

			const expectedRestriction: SearchRestriction = {
				type: ContactTypeRef,
				start: null,
				end: null,
				field: "mailAddresses",
				attributeIds: [typedValues(mailType.associations).find((a) => a.name === "mailAddresses")!.id],
				folderIds: [],
				eventSeries: null,
			}

			when(offline.search('"my contact"', expectedRestriction, 1234)).thenResolve({
				results: [["it's me", "a contact"] as IdTuple],
			} as SearchResult)

			const result = await facade.findContacts("my contact", "mailAddresses", 1234)

			o.check(result).deepEquals([["it's me", "a contact"] as IdTuple])
		})
		o.test("recipient", async () => {
			const mailType = await typeModelResolver.resolveClientTypeReference(ContactTypeRef)

			const expectedRestriction: SearchRestriction = {
				type: ContactTypeRef,
				start: null,
				end: null,
				field: null,
				attributeIds: null,
				folderIds: [],
				eventSeries: null,
			}

			when(offline.search('"my contact"', expectedRestriction, 1234)).thenResolve({
				results: [["it's me", "a contact"] as IdTuple],
			} as SearchResult)

			const result = await facade.findContacts("my contact", null, 1234)

			o.check(result).deepEquals([["it's me", "a contact"] as IdTuple])
		})
	})
})
