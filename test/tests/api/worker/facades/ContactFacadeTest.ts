import o from "@tutao/otest"
import { ContactFacade } from "../../../../../src/api/worker/facades/lazy/ContactFacade.js"
import td, { object, verify } from "testdouble"
import { EntityClient } from "../../../../../src/api/common/EntityClient.js"
import { downcast } from "@tutao/tutanota-utils"
import { createFilledContact } from "../../../contacts/VCardExporterTest.js"

o.spec("ContactFacadeTest", function () {
	const entityClient: EntityClient = object()

	o.before(() => {
		entityClient.setupMultipleEntities = downcast(td.function())
	})

	o("the facade can import a list of clients", async function () {
		const facade = new ContactFacade(entityClient)

		const contacts = [
			createFilledContact("Test", "User", "Hello World!", "Tutao", "Mr.", "Jung", ["jung@tuta.com"], ["93291381"]),
			createFilledContact(
				"Ant",
				"Ste",
				"Hello World!",
				"Tutao",
				"Mr.",
				"Buffalo",
				["antste@antste.de", "bentste@bentste.de"],
				["123123123", "321321321"],
				["diaspora.de"],
			),
		]

		await facade.importContactList(contacts, "testId")
		verify(entityClient.setupMultipleEntities("testId", contacts))
	})
})
