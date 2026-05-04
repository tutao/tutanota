import { EntityClient } from "../../../../../network/EntityClient.js"
import { assertWorkerOrNode } from "@tutao/app-env"
import { SetupMultipleError } from "../../../../../network/error/SetupMultipleError.js"
import { ImportError } from "../../../common/error/ImportError.js"
import { Contact } from "@tutao/entities/tutanota"

assertWorkerOrNode()

export class ContactFacade {
	constructor(private readonly entityClient: EntityClient) {}

	async importContactList(contacts: ReadonlyArray<Contact>, contactListId: Id): Promise<void> {
		try {
			await this.entityClient.setupMultipleEntities(contactListId, contacts)
		} catch (e) {
			console.error(e)
			if (e instanceof SetupMultipleError) {
				console.error("Importing contacts failed", e)
				throw new ImportError(e.errors[0], "Could not import all contacts", e.failedInstances.length)
			}
			throw e
		}
	}
}
