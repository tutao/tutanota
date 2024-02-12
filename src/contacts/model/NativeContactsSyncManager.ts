import { EntityUpdateData, isUpdateForTypeRef } from "../../api/common/utils/EntityUpdateUtils.js"
import { ContactTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { OperationType } from "../../api/common/TutanotaConstants.js"
import { getFromMap, ofClass } from "@tutao/tutanota-utils"
import { StructuredContact } from "../../native/common/generatedipc/StructuredContact.js"
import { getElementId } from "../../api/common/utils/EntityUtils.js"
import { extractStructuredAddresses, extractStructuredMailAddresses, extractStructuredPhoneNumbers } from "./ContactUtils.js"
import { LoginController } from "../../api/main/LoginController.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { EventController } from "../../api/main/EventController.js"
import { ContactModel } from "./ContactModel.js"
import { DeviceConfig } from "../../misc/DeviceConfig.js"
import { PermissionError } from "../../api/common/error/PermissionError.js"
import { MobileContactsFacade } from "../../native/common/generatedipc/MobileContactsFacade.js"

export class NativeContactsSyncManager {
	constructor(
		private readonly loginController: LoginController,
		private readonly mobilContactsFacade: MobileContactsFacade,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly contactModel: ContactModel,
		private readonly deviceConfig: DeviceConfig,
	) {
		this.eventController.addEntityListener((updates) => this.processNativeContactEntityEvents(updates))
	}

	private async processNativeContactEntityEvents(events: ReadonlyArray<EntityUpdateData>) {
		const loginUsername = this.loginController.getUserController().loginUsername
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
				await this.mobilContactsFacade
					.deleteContacts(loginUsername, event.instanceId)
					.catch(ofClass(PermissionError, (e) => this.handleNoPermissionError(userId, e)))
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
			await this.mobilContactsFacade
				.saveContacts(loginUsername, contactsToInsertOrUpdate)
				.catch(ofClass(PermissionError, (e) => this.handleNoPermissionError(userId, e)))
		}
	}

	async syncContacts() {
		const contactListId = await this.contactModel.getContactListId()
		const userId = this.loginController.getUserController().userId
		const loginUsername = this.loginController.getUserController().loginUsername
		const allowSync = this.deviceConfig.getUserSyncContactsWithPhonePreference(userId) ?? false

		if (contactListId == null || !allowSync) return false

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

		try {
			await this.mobilContactsFacade.syncContacts(loginUsername, structuredContacts)
		} catch (e) {
			if (e instanceof PermissionError) {
				this.handleNoPermissionError(userId, e)
				return false
			}

			throw e
		}

		return true
	}

	async clearContacts() {
		const loginUsername = this.loginController.getUserController().loginUsername
		await this.mobilContactsFacade
			.deleteContacts(loginUsername, null)
			.catch(ofClass(PermissionError, (e) => console.log("No permission to clear contacts", e)))
	}

	private handleNoPermissionError(userId: string, error: PermissionError) {
		console.log("No permission to sync contacts, disabling sync", error)
		this.deviceConfig.setUserSyncContactsWithPhonePreference(userId, false)
	}
}
