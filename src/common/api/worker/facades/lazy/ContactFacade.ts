import type { Contact } from "../../../entities/tutanota/TypeRefs.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { assertWorkerOrNode } from "../../../common/Env.js"
import { SetupMultipleError } from "../../../common/error/SetupMultipleError.js"
import { ImportError } from "../../../common/error/ImportError.js"

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
