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
import { assert, defer, getFirstOrThrow, getFromMap, ofClass } from "@tutao/tutanota-utils"
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
} from "../../../common/contactsFunctionality/ContactUtils.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { EventController } from "../../../common/api/main/EventController.js"
import { ContactModel } from "../../../common/contactsFunctionality/ContactModel.js"
import { DeviceConfig } from "../../../common/misc/DeviceConfig.js"
import { PermissionError } from "../../../common/api/common/error/PermissionError.js"
import { MobileContactsFacade } from "../../../common/native/common/generatedipc/MobileContactsFacade.js"
import { ContactSyncResult } from "../../../common/native/common/generatedipc/ContactSyncResult.js"
import { assertMainOrNode, isApp, isIOSApp } from "../../../common/api/common/Env.js"
import { ContactStoreError } from "../../../common/api/common/error/ContactStoreError.js"
import { NotFoundError } from "../../../common/api/common/error/RestError.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog.js"
import { lang } from "../../../common/misc/LanguageViewModel"
import { locator } from "../../../common/api/main/CommonLocator"
import { PermissionType } from "../../../common/native/common/generatedipc/PermissionType"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"

assertMainOrNode()

export class NativeContactsSyncManager {
	private entityUpdateLock: Promise<void> = Promise.resolve()

	constructor(
		private readonly loginController: LoginController,
		private readonly mobileContactsFacade: MobileContactsFacade,
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
				await this.mobileContactsFacade
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
			await this.mobileContactsFacade
				.saveContacts(loginUsername, contactsToInsertOrUpdate)
				.catch(ofClass(PermissionError, (e) => this.handleNoPermissionError(userId, e)))
				.catch(ofClass(ContactStoreError, (e) => console.warn("Could not save contacts:", e)))
		}
	}

	isEnabled(): boolean {
		return this.deviceConfig.getUserSyncContactsWithPhonePreference(this.loginController.getUserController().userId) ?? false
	}

	/**
	 * @return is sync succeeded. It might fail if we don't have a permission.
	 */
	async enableSync(): Promise<boolean> {
		const loginUsername = this.loginController.getUserController().loginUsername
		const contactListId = await this.contactModel.getContactListId()
		if (contactListId == null) return false
		const contacts = await this.entityClient.loadAll(ContactTypeRef, contactListId)
		const structuredContacts = contacts.map((c) => this.toStructuredContact(c))
		try {
			await this.mobileContactsFacade.syncContacts(loginUsername, structuredContacts)
		} catch (e) {
			console.warn("Could not sync contacts:", e)
			if (e instanceof PermissionError) {
				return false
			} else if (e instanceof ContactStoreError) {
				return false
			}

			throw e
		}

		this.deviceConfig.setUserSyncContactsWithPhonePreference(this.loginController.getUserController().userId, true)
		await this.askToDedupeContacts(structuredContacts)
		return true
	}

	/**
	 * Check if syncing contacts is possible/allowed right now.
	 *
	 * On Android, this method simply requests permission to access contacts. On iOS, this also checks iCloud sync, as
	 * it can interfere with
	 */
	async canSync(): Promise<boolean> {
		if (!isApp()) {
			throw new ProgrammingError("Can only check Contact permissions on app")
		}

		const isContactPermissionGranted = await locator.systemPermissionHandler.requestPermission(PermissionType.Contacts, "allowContactReadWrite_msg")
		if (!isContactPermissionGranted) {
			return false
		}

		return !isIOSApp() || this.checkIfExternalCloudSyncOnIos()
	}

	/**
	 * Check that we are allowed to sync contacts on an iOS device
	 * @returns false if no permission or iCloud sync is enabled and the user cancelled, or true if permission is granted and iCloud sync is disabled (or the user bypassed the warning dialog)
	 */
	private async checkIfExternalCloudSyncOnIos(): Promise<boolean> {
		assert(isIOSApp(), "Can only check cloud syncing on iOS")

		let localContactStorage = await this.mobileContactsFacade.isLocalStorageAvailable()
		if (!localContactStorage) {
			const choice = await Dialog.choiceVertical("externalContactSyncDetectedWarning_msg", [
				{ text: "settings_label", value: "settings", type: "primary" },
				{ text: "enableAnyway_action", value: "enable" },
				{ text: "cancel_action", value: "cancel" },
			])
			switch (choice) {
				case "enable":
					break
				case "settings":
					locator.systemFacade.openLink("App-prefs:CONTACTS&path=ACCOUNTS")
					return false
				case "cancel":
					return false
			}
		}

		return true
	}

	/**
	 * @return is sync succeeded. It might fail if we don't have a permission.
	 */
	async syncContacts(): Promise<boolean> {
		if (!this.isEnabled()) {
			return false
		}

		const contactListId = await this.contactModel.getContactListId()
		if (contactListId == null) {
			return false
		}

		const userId = this.loginController.getUserController().userId
		const loginUsername = this.loginController.getUserController().loginUsername
		const contacts = await this.entityClient.loadAll(ContactTypeRef, contactListId)
		const structuredContacts: ReadonlyArray<StructuredContact> = contacts.map((contact) => this.toStructuredContact(contact))

		try {
			const syncResult = await this.mobileContactsFacade.syncContacts(loginUsername, structuredContacts)
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

	private async askToDedupeContacts(contactsToDedupe: readonly StructuredContact[]) {
		const duplicateContacts = await this.mobileContactsFacade.findLocalMatches(contactsToDedupe)
		if (duplicateContacts.length === 0) {
			// no duplicate contacts; no need to ask
			return
		}

		const shouldDedupe = await Dialog.confirm(() => lang.get("importContactRemoveDuplicatesConfirm_msg", { "{count}": duplicateContacts.length }))
		if (shouldDedupe) {
			await showProgressDialog("progressDeleting_msg", this.mobileContactsFacade.deleteLocalContacts(duplicateContacts))
		}
	}

	private toStructuredContact(contact: Contact): StructuredContact {
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
	}

	async disableSync(userId?: string, login?: string) {
		const userIdToRemove = userId ?? this.loginController.getUserController().userId

		if (this.deviceConfig.getUserSyncContactsWithPhonePreference(userIdToRemove)) {
			this.deviceConfig.setUserSyncContactsWithPhonePreference(userIdToRemove, false)
			await this.mobileContactsFacade
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
			await this.mobileContactsFacade.saveContacts(loginUsername, [
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
