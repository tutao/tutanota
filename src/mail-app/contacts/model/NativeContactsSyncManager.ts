import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import {
	Contact,
	ContactTypeRef,
	createContact,
	createContactAddress,
	createContactCustomDate,
	createContactMailAddress,
	createContactMessengerHandle,
	createContactPhoneNumber,
	createContactRelationship,
	createContactWebsite,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import { GroupType, OperationType } from "../../../common/api/common/TutanotaConstants.js"
import { defer, getFirstOrThrow, getFromMap, ofClass } from "@tutao/tutanota-utils"
import { StructuredContact } from "../../../common/native/common/generatedipc/StructuredContact.js"
import { elementIdPart, getElementId, StrippedEntity } from "../../../common/api/common/utils/EntityUtils.js"
import {
	extractStructuredAddresses,
	extractStructuredCustomDates,
	extractStructuredMailAddresses,
	extractStructuredMessengerHandle,
	extractStructuredPhoneNumbers,
	extractStructuredRelationships,
	extractStructuredWebsites,
} from "./ContactUtils.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { EventController } from "../../../common/api/main/EventController.js"
import { ContactModel } from "./ContactModel.js"
import { DeviceConfig } from "../../../common/misc/DeviceConfig.js"
import { PermissionError } from "../../../common/api/common/error/PermissionError.js"
import { MobileContactsFacade } from "../../../common/native/common/generatedipc/MobileContactsFacade.js"
import { ContactSyncResult } from "../../../common/native/common/generatedipc/ContactSyncResult.js"
import { isIOSApp } from "../../../common/api/common/Env.js"
import { ContactStoreError } from "../../../common/api/common/error/ContactStoreError.js"
import { NotFoundError } from "../../../common/api/common/error/RestError.js"

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
					.catch(ofClass(ContactStoreError, (e) => console.warn("Could not delete contact during sync: ", e)))
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
					nickname: contact.nickname ?? "",
					birthday: contact.birthdayIso,
					company: contact.company,
					mailAddresses: extractStructuredMailAddresses(contact.mailAddresses),
					phoneNumbers: extractStructuredPhoneNumbers(contact.phoneNumbers),
					addresses: extractStructuredAddresses(contact.addresses),
					rawId: null,
					customDate: extractStructuredCustomDates(contact.customDate),
					department: contact.department,
					messengerHandles: extractStructuredMessengerHandle(contact.messengerHandles),
					middleName: contact.middleName,
					nameSuffix: contact.nameSuffix,
					phoneticFirst: contact.phoneticFirst,
					phoneticLast: contact.phoneticLast,
					phoneticMiddle: contact.phoneticMiddle,
					relationships: extractStructuredRelationships(contact.relationships),
					websites: extractStructuredWebsites(contact.websites),
					notes: contact.comment,
					title: contact.title ?? "",
					role: contact.role,
				})
			})
		}

		if (contactsToInsertOrUpdate.length > 0) {
			await this.mobilContactsFacade
				.saveContacts(loginUsername, contactsToInsertOrUpdate)
				.catch(ofClass(PermissionError, (e) => this.handleNoPermissionError(userId, e)))
				.catch(ofClass(ContactStoreError, (e) => console.warn("Could not save contacts:", e)))
		}
	}

	isEnabled(): boolean {
		return this.deviceConfig.getUserSyncContactsWithPhonePreference(this.loginController.getUserController().userId) ?? false
	}

	enableSync() {
		this.deviceConfig.setUserSyncContactsWithPhonePreference(this.loginController.getUserController().userId, true)
	}

	/**
	 * @return is sync succeeded. It might fail if we don't have a permission.
	 */
	async syncContacts(): Promise<boolean> {
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
				nickname: contact.nickname ?? "",
				company: contact.company,
				birthday: contact.birthdayIso,
				addresses: extractStructuredAddresses(contact.addresses),
				rawId: null,
				deleted: false,
				customDate: extractStructuredCustomDates(contact.customDate),
				department: contact.department,
				messengerHandles: extractStructuredMessengerHandle(contact.messengerHandles),
				middleName: contact.middleName,
				nameSuffix: contact.nameSuffix,
				phoneticFirst: contact.phoneticFirst,
				phoneticLast: contact.phoneticLast,
				phoneticMiddle: contact.phoneticMiddle,
				relationships: extractStructuredRelationships(contact.relationships),
				websites: extractStructuredWebsites(contact.websites),
				notes: contact.comment,
				title: contact.title ?? "",
				role: contact.role,
			}
		})

		try {
			const syncResult = await this.mobilContactsFacade.syncContacts(loginUsername, structuredContacts)
			await this.applyDeviceChangesToServerContacts(contacts, syncResult, contactListId)
		} catch (e) {
			if (e instanceof PermissionError) {
				this.handleNoPermissionError(userId, e)
				return false
			} else if (e instanceof ContactStoreError) {
				console.warn("Could not sync contacts:", e)
				return false
			}

			throw e
		}

		return true
	}

	async disableSync(userId?: string, login?: string) {
		const userIdToRemove = userId ?? this.loginController.getUserController().userId

		if (this.deviceConfig.getUserSyncContactsWithPhonePreference(userIdToRemove)) {
			this.deviceConfig.setUserSyncContactsWithPhonePreference(userIdToRemove, false)
			await this.mobilContactsFacade
				.deleteContacts(login ?? this.loginController.getUserController().loginUsername, null)
				.catch(ofClass(PermissionError, (e) => console.log("No permission to clear contacts", e)))
		}
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
				try {
					await this.entityClient.update(updatedContact)
				} catch (e) {
					if (e instanceof NotFoundError) {
						console.warn("Not found contact to update during sync: ", cleanContact._id, e)
					} else {
						throw e
					}
				}
			}
		}
		for (const deletedContactId of syncResult.deletedOnDevice) {
			const cleanContact = contacts.find((c) => elementIdPart(c._id) === deletedContactId)
			if (cleanContact == null) {
				console.warn("Could not find a server contact for the contact deleted on device: ", deletedContactId)
			} else {
				try {
					await this.entityClient.erase(cleanContact)
				} catch (e) {
					if (e instanceof NotFoundError) {
						console.warn("Not found contact to delete during sync: ", cleanContact._id, e)
					} else {
						throw e
					}
				}
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
			oldBirthdayDate: null,
			presharedPassword: null,
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
			customDate: contact.customDate.map((date) => createContactCustomDate(date)),
			department: contact.department,
			messengerHandles: contact.messengerHandles.map((handle) => createContactMessengerHandle(handle)),
			middleName: contact.middleName,
			nameSuffix: contact.nameSuffix,
			phoneticFirst: contact.phoneticFirst,
			phoneticLast: contact.phoneticLast,
			phoneticMiddle: contact.phoneticMiddle,
			pronouns: [],
			relationships: contact.relationships.map((relation) => createContactRelationship(relation)),
			websites: contact.websites.map((website) => createContactWebsite(website)),
			comment: contact.notes,
			title: contact.title ?? "",
			role: contact.role,
		}
	}

	private mergeNativeContactWithTutaContact(contact: StructuredContact, partialContact: Contact): Contact {
		// TODO: iOS requires a special entitlement from Apple to access these fields
		const canMergeCommentField = !isIOSApp()

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
			customDate: contact.customDate.map((date) => createContactCustomDate(date)),
			department: contact.department,
			messengerHandles: contact.messengerHandles.map((handle) => createContactMessengerHandle(handle)),
			middleName: contact.middleName,
			nameSuffix: contact.nameSuffix,
			phoneticFirst: contact.phoneticFirst,
			phoneticLast: contact.phoneticLast,
			phoneticMiddle: contact.phoneticMiddle,
			relationships: contact.relationships.map((relation) => createContactRelationship(relation)),
			websites: contact.websites.map((website) => createContactWebsite(website)),
			comment: canMergeCommentField ? contact.notes : partialContact.comment,
			title: contact.title ?? "",
			role: contact.role,
		}
	}
}
