import { EntityUpdateData, isUpdateForTypeRef } from "../../api/common/utils/EntityUpdateUtils.js"
import {
	Contact,
	ContactTypeRef,
	createContact,
	createContactAddress,
	createContactMailAddress,
	createContactPhoneNumber,
} from "../../api/entities/tutanota/TypeRefs.js"
import { GroupType, OperationType } from "../../api/common/TutanotaConstants.js"
import { defer, getFirstOrThrow, getFromMap, ofClass } from "@tutao/tutanota-utils"
import { StructuredContact } from "../../native/common/generatedipc/StructuredContact.js"
import { elementIdPart, getElementId, StrippedEntity } from "../../api/common/utils/EntityUtils.js"
import { extractStructuredAddresses, extractStructuredMailAddresses, extractStructuredPhoneNumbers } from "./ContactUtils.js"
import { LoginController } from "../../api/main/LoginController.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { EventController } from "../../api/main/EventController.js"
import { ContactModel } from "./ContactModel.js"
import { DeviceConfig } from "../../misc/DeviceConfig.js"
import { PermissionError } from "../../api/common/error/PermissionError.js"
import { MobileContactsFacade } from "../../native/common/generatedipc/MobileContactsFacade.js"
import { ContactSyncResult } from "../../native/common/generatedipc/ContactSyncResult.js"

export class NativeContactsSyncManager {
	private entityUpdateLock: Promise<void> = Promise.resolve()

	constructor(
		private readonly loginController: LoginController,
		private readonly mobilContactsFacade: MobileContactsFacade,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly contactModel: ContactModel,
		private readonly deviceConfig: DeviceConfig,
	) {
		this.eventController.addEntityListener((updates) => this.nativeContactEntityEventsListener(updates))
	}

	private async nativeContactEntityEventsListener(events: ReadonlyArray<EntityUpdateData>) {
		await this.entityUpdateLock

		await this.processContactEventUpdate(events)
	}

	private async processContactEventUpdate(events: ReadonlyArray<EntityUpdateData>) {
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
					rawId: null,
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
				rawId: null,
				deleted: false,
			}
		})

		try {
			const syncResult = await this.mobilContactsFacade.syncContacts(loginUsername, structuredContacts)
			await this.applyDeviceChangesToServerContacts(contacts, syncResult, contactListId)
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

	private async applyDeviceChangesToServerContacts(contacts: ReadonlyArray<Contact>, syncResult: ContactSyncResult, listId: string) {
		// Update lock state so the entity listener doesn't process any
		// new event. They'll be handled by the end of this function
		const entityUpdateDefer = defer<void>()
		this.entityUpdateLock = entityUpdateDefer.promise

		// We need to wait until the user is fully logged in to handle encrypted entities
		await this.loginController.waitForFullLogin()
		for (const contact of syncResult.createdOnDevice) {
			const newContact = createContact(this.createContactFromNative(contact))
			const entityId = await this.entityClient.setup(listId, newContact)
			const loginUsername = this.loginController.getUserController().loginUsername
			// save the contact right away so that we don't lose the server id to native contact mapping if we don't process entity update quickly enough
			await this.mobilContactsFacade.saveContacts(loginUsername, [
				{
					...contact,
					id: entityId,
				},
			])
		}
		for (const contact of syncResult.editedOnDevice) {
			const cleanContact = contacts.find((c) => elementIdPart(c._id) === contact.id)
			if (cleanContact == null) {
				console.warn("Could not find a server contact for the contact edited on device: ", contact.id)
			} else {
				const updatedContact = this.mergeNativeContactWithTutaContact(contact, cleanContact)
				await this.entityClient.update(updatedContact)
			}
		}
		for (const contact of syncResult.deletedOnDevice) {
			const cleanContact = contacts.find((c) => elementIdPart(c._id) === contact.id)
			if (cleanContact == null) {
				console.warn("Could not find a server contact for the contact deleted on device: ", contact.id)
			} else {
				await this.entityClient.erase(cleanContact)
			}
		}

		// Release the lock state and process the entities. We don't
		// have anything more to include inside events to apply
		entityUpdateDefer.resolve()
	}

	private createContactFromNative(contact: StructuredContact): StrippedEntity<Contact> {
		return {
			_ownerGroup: getFirstOrThrow(
				this.loginController.getUserController().user.memberships.filter((membership) => membership.groupType === GroupType.Contact),
			).group,
			_owner: this.loginController.getUserController().user._id,
			autoTransmitPassword: "",
			comment: "",
			oldBirthdayDate: null,
			presharedPassword: null,
			role: "",
			title: null,
			oldBirthdayAggregate: null,
			photo: null,
			socialIds: [],
			firstName: contact.firstName,
			lastName: contact.lastName,
			mailAddresses: contact.mailAddresses.map((mail) => createContactMailAddress(mail)),
			phoneNumbers: contact.phoneNumbers.map((phone) => createContactPhoneNumber(phone)),
			nickname: contact.nickname,
			company: contact.company,
			birthdayIso: contact.birthday,
			addresses: contact.addresses.map((address) => createContactAddress(address)),
		}
	}

	private mergeNativeContactWithTutaContact(contact: StructuredContact, partialContact: Contact): Contact {
		return {
			...partialContact,
			firstName: contact.firstName,
			lastName: contact.lastName,
			mailAddresses: contact.mailAddresses.map((mail) => createContactMailAddress(mail)),
			phoneNumbers: contact.phoneNumbers.map((phone) => createContactPhoneNumber(phone)),
			nickname: contact.nickname,
			company: contact.company,
			birthdayIso: contact.birthday,
			addresses: contact.addresses.map((address) => createContactAddress(address)),
		}
	}
}
