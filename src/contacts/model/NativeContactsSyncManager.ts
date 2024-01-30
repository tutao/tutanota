import { EntityUpdateData, isUpdateForTypeRef } from "../../api/common/utils/EntityUpdateUtils.js"
import { ContactTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { OperationType } from "../../api/common/TutanotaConstants.js"
import { getFromMap } from "@tutao/tutanota-utils"
import { StructuredContact } from "../../native/common/generatedipc/StructuredContact.js"
import { getElementId } from "../../api/common/utils/EntityUtils.js"
import { extractStructuredAddresses, extractStructuredMailAddresses, extractStructuredPhoneNumbers } from "./ContactUtils.js"
import { LoginController } from "../../api/main/LoginController.js"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { EventController } from "../../api/main/EventController.js"
import { ContactModel } from "./ContactModel.js"
import { DeviceConfig } from "../../misc/DeviceConfig.js"

export class NativeContactsSyncManager {
	constructor(
		private readonly loginController: LoginController,
		private readonly mobileSystemFacade: MobileSystemFacade,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly contactModel: ContactModel,
		private readonly deviceConfig: DeviceConfig,
	) {
		this.eventController.addEntityListener((updates) => this.processNativeContactEntityEvents(updates))
	}

	private async processNativeContactEntityEvents(events: ReadonlyArray<EntityUpdateData>) {
		const userId = this.loginController.getUserController().userId
		const allowSync = this.deviceConfig.getUserSyncContactsWithPhonePreference(userId) ?? false
		if (!allowSync) {
			return
		}

		const contactsIdToCreateOrUpdate: Map<Id, Array<Id>> = new Map()

		for (const event of events) {
			if (!isUpdateForTypeRef(ContactTypeRef, event)) continue
			if (event.operation === OperationType.CREATE) {
				getFromMap(contactsIdToCreateOrUpdate, event.instanceListId, () => []).push(event.instanceId)
			} else if (event.operation === OperationType.UPDATE) {
				getFromMap(contactsIdToCreateOrUpdate, event.instanceListId, () => []).push(event.instanceId)
			} else if (event.operation === OperationType.DELETE) {
				await this.mobileSystemFacade.deleteContacts(userId, event.instanceId)
			}
		}

		const contactsToInsertOrUpdate: StructuredContact[] = []

		for (const [listId, elementIds] of contactsIdToCreateOrUpdate.entries()) {
			const contactList = await this.entityClient.loadMultiple(ContactTypeRef, listId, elementIds)
			contactList.map((contact) => {
				contactsToInsertOrUpdate.push({
					id: getElementId(contact),
					firstName: contact.firstName,
					lastName: contact.lastName,
					nickname: contact.nickname,
					birthday: contact.birthdayIso,
					company: contact.company,
					mailAddresses: extractStructuredMailAddresses(contact.mailAddresses),
					phoneNumbers: extractStructuredPhoneNumbers(contact.phoneNumbers),
					addresses: extractStructuredAddresses(contact.addresses),
				})
			})
		}

		if (contactsToInsertOrUpdate.length > 0) {
			await this.mobileSystemFacade.saveContacts(userId, contactsToInsertOrUpdate)
		}
	}

	async syncContacts() {
		const contactListId = await this.contactModel.getContactListId()
		const userId = this.loginController.getUserController().userId
		const allowSync = this.deviceConfig.getUserSyncContactsWithPhonePreference(userId) ?? false

		if (contactListId == null || !allowSync) return
		const contacts = await this.entityClient.loadAll(ContactTypeRef, contactListId)
		const structuredContacts: ReadonlyArray<StructuredContact> = contacts.map((contact) => {
			return {
				id: getElementId(contact),
				firstName: contact.firstName,
				lastName: contact.lastName,
				mailAddresses: extractStructuredMailAddresses(contact.mailAddresses),
				phoneNumbers: extractStructuredPhoneNumbers(contact.phoneNumbers),
				nickname: contact.nickname,
				company: contact.company,
				birthday: contact.birthdayIso,
				addresses: extractStructuredAddresses(contact.addresses),
			}
		})
		await this.mobileSystemFacade.syncContacts(userId, structuredContacts)
	}
}
