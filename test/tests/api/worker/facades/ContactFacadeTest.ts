import o from "@tutao/otest"
import { ContactFacade } from "../../../../../src/common/api/worker/facades/lazy/ContactFacade.js"
import { object, verify } from "testdouble"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient.js"
import { createFilledContact } from "../../../contacts/VCardExporterTest.js"

o.spec("ContactFacadeTest", function () {
	let entityClient: EntityClient
	o.before(() => {
		entityClient = object()
	})

	o("the facade can import a list of clients", async function () {
		const facade = new ContactFacade(entityClient)

		const contacts = [
			createFilledContact(
				"Test",
				"User",
				"Hello World!",
				"Tutao",
				"Mr.",
				"Jung",
				"Lange",
				"Jr.",
				"It",
				["jung@tuta.com"],
				["93291381"],
				[],
				[],
				["tutanota.com"],
			),
			createFilledContact(
				"Ant",
				"Ste",
				"Hello World!",
				"Tutao",
				"Mr.",
				"Buffalo",
				"Lange",
				"Jr.",
				"IT",
				["antste@antste.de", "bentste@bentste.de"],
				["123123123", "321321321"],
				["diaspora.de"],
			),
		]

		await facade.importContactList(contacts, "testId")
		verify(entityClient.setupMultipleEntities("testId", contacts))
	})
})
