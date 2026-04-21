import { assertMainOrNode, ShareCapability } from "@tutao/app-env"
import { elementIdPart, entityUpdateUtils, getEtId, EntityIdEncoding, listIdPart, sortCompareById, sysTypeRefs, tutanotaTypeRefs } from "@tutao/typerefs"
import { assertNotNull, first, getFirstOrThrow, isNotNull, LazyLoaded, ofClass, promiseMap } from "@tutao/utils"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { EntityClient, loadMultipleFromLists } from "../api/common/EntityClient.js"
import { LoginController } from "../api/main/LoginController.js"
import { EventController } from "../api/main/EventController.js"
import { LoginIncompleteError } from "../api/common/error/LoginIncompleteError.js"
import { cleanMailAddress } from "../api/common/utils/CommonCalendarUtils.js"
import { DbError } from "../api/common/error/DbError.js"
import * as restError from "@tutao/rest-client/error"

import { ContactSearchFacade } from "../../mail-app/workerUtils/index/ContactSearchFacade"

assertMainOrNode()

export type ContactListInfo = {
	name: string
	groupInfo: sysTypeRefs.GroupInfo
	group: sysTypeRefs.Group
	groupRoot: tutanotaTypeRefs.ContactListGroupRoot
	isOwner: boolean
	canEdit: boolean
}

export class ContactModel {
	private contactListId: LazyLoaded<Id | null>
	private contactListInfo: Stream<ReadonlyArray<ContactListInfo>> = stream()

	constructor(
		private readonly entityClient: EntityClient,
		private readonly loginController: LoginController,
		private readonly eventController: EventController,
		private readonly contactSearchFacade: ContactSearchFacade | null,
	) {
		this.contactListId = lazyContactListId(loginController, this.entityClient)
		this.eventController.addEntityListener(this.entityEventsReceived)
	}

	async getLoadedContactListInfos(): Promise<ReadonlyArray<ContactListInfo>> {
		// prevent re-loading them when we already have them
		// this is not perfect and might still start loads in parallel
		if (this.contactListInfo() === undefined) {
			await this.loadContactLists()
		}
		return this.contactListInfo()
	}

	/** might be empty if not loaded yet */
	getOwnContactListInfos(): Stream<ReadonlyArray<ContactListInfo>> {
		return this.contactListInfo.map((contactListInfos) => contactListInfos.filter((info) => info.isOwner))
	}

	/** might be empty if not loaded yet */
	getSharedContactListInfos(): Stream<ReadonlyArray<ContactListInfo>> {
		return this.contactListInfo.map((contactListInfos) => contactListInfos.filter((info) => !info.isOwner))
	}

	/** Id of the contact list. Is null for external users. */
	getContactListId(): Promise<Id | null> {
		return this.contactListId.getAsync()
	}

	async loadAllContacts(): Promise<Array<tutanotaTypeRefs.Contact>> {
		const listId = await this.getContactListId()
		if (listId == null) {
			return []
		}
		return this.entityClient.loadAll(tutanotaTypeRefs.ContactTypeRef, listId)
	}

	async eraseContacts(contacts: tutanotaTypeRefs.Contact[]) {
		if (contacts.length > 0) {
			const listId = listIdPart(assertNotNull(first(contacts))._id)
			await this.entityClient.eraseMultiple(listId, contacts)
		}
	}

	/**
	 * Provides the first contact (starting with oldest contact) that contains the given email address. Uses the index search if available, otherwise loads all contacts.
	 */
	async searchForContact(mailAddress: string): Promise<tutanotaTypeRefs.Contact | null> {
		//searching for contacts depends on searchFacade._db to be initialized. If the user has not logged in online the respective promise will never resolve.
		if (!this.loginController.isFullyLoggedIn()) {
			throw new LoginIncompleteError("cannot search for contacts as online login is not completed")
		}

		const listId = await this.getContactListId()
		// No contacts for external users and we can't search if we can't load contacts
		if (listId == null) {
			return null
		}

		const cleanedMailAddress = cleanMailAddress(mailAddress)
		// If we do not use a contact facade, or it isn't working for some reason, then we load all contacts from the server
		const result: tutanotaTypeRefs.Contact[] =
			(await this.findContactsUsingFacade(cleanedMailAddress, listId)) ?? (await this.entityClient.loadAll(tutanotaTypeRefs.ContactTypeRef, listId))

		// the result is sorted from newest to oldest, but we want to return the oldest first like before
		result.sort((a, b) => sortCompareById(a, b, EntityIdEncoding.Base64Ext))

		// searchFacade is not guaranteed to return an exact match, but we are looking for an exact match for the given
		// mail address
		return result.find((contact) => contact.mailAddresses.some((a) => cleanMailAddress(a.address) === cleanedMailAddress)) ?? null
	}

	private async findContactsUsingFacade(cleanedMailAddress: string, listId: string) {
		if (this.contactSearchFacade != null) {
			try {
				const ids = await this.contactSearchFacade.findContacts(cleanedMailAddress, "mailAddresses")
				return await this.entityClient.loadMultiple(tutanotaTypeRefs.ContactTypeRef, listId, ids.map(elementIdPart))
			} catch (e) {
				if (e instanceof DbError) {
					return null
				} else {
					throw e
				}
			}
		} else {
			return null
		}
	}

	/**
	 * @pre locator.search.indexState().indexingSupported
	 */
	async searchForContacts(query: string, field: "mailAddresses" | null, minSuggestionCount: number): Promise<tutanotaTypeRefs.Contact[]> {
		if (!this.contactSearchFacade) {
			throw new DbError("Cannot search for contacts through db")
		}
		if (!this.loginController.isFullyLoggedIn()) {
			throw new LoginIncompleteError("cannot search for contacts as online login is not completed")
		}
		const result = await this.contactSearchFacade.findContacts(query, field, minSuggestionCount)
		return await loadMultipleFromLists(tutanotaTypeRefs.ContactTypeRef, this.entityClient, result)
	}

	async searchForContactLists(query: string): Promise<ContactListInfo[]> {
		if (!this.loginController.isFullyLoggedIn()) {
			throw new LoginIncompleteError("cannot search for contact lists as online login is not completed")
		}

		const contactLists = await this.getLoadedContactListInfos()

		return contactLists.filter((contactList) => contactList.name.toLowerCase().includes(query))
	}

	async loadContactFromId(contactId: IdTuple) {
		return await this.entityClient.load(tutanotaTypeRefs.ContactTypeRef, contactId)
	}

	async getContactGroupId(): Promise<Id> {
		return getFirstOrThrow(this.loginController.getUserController().getContactGroupMemberships()).group
	}

	private async loadContactLists() {
		const userController = this.loginController.getUserController()
		const contactListMemberships = userController.getContactListMemberships()
		const contactListInfo = (
			await promiseMap(
				await promiseMap(contactListMemberships, (rlm: sysTypeRefs.GroupMembership) =>
					this.entityClient.load(sysTypeRefs.GroupInfoTypeRef, rlm.groupInfo),
				),
				// need to catch both NotFoundError and NotAuthorizedError, as we might still have a membership for a short time
				// when the group root is already deleted, or we deleted our membership
				(groupInfo) =>
					this.getContactListInfo(groupInfo)
						.catch(ofClass(restError.NotFoundError, () => null))
						.catch(ofClass(restError.NotAuthorizedError, () => null)),
			)
		).filter(isNotNull)

		this.contactListInfo(contactListInfo)
	}

	private async getContactListInfo(groupInfo: sysTypeRefs.GroupInfo): Promise<ContactListInfo> {
		const group = await this.entityClient.load(sysTypeRefs.GroupTypeRef, groupInfo.group)
		const groupRoot = await this.entityClient.load(tutanotaTypeRefs.ContactListGroupRootTypeRef, groupInfo.group)
		const userController = this.loginController.getUserController()
		const { getSharedGroupName } = await import("../sharing/GroupUtils.js")
		const { hasCapabilityOnGroup, isSharedGroupOwner } = await import("../sharing/GroupUtils.js")

		return {
			name: getSharedGroupName(groupInfo, userController.userSettingsGroupRoot, true),
			group,
			groupInfo,
			groupRoot,
			isOwner: isSharedGroupOwner(group, getEtId(userController.user)),
			canEdit: hasCapabilityOnGroup(userController.user, group, ShareCapability.Write),
		}
	}

	private readonly entityEventsReceived: entityUpdateUtils.EntityEventsListener = {
		onEntityUpdatesReceived: async (updates: ReadonlyArray<entityUpdateUtils.EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> => {
			for (const update of updates) {
				if (
					this.loginController.getUserController().isUpdateForLoggedInUserInstance(update, eventOwnerGroupId) ||
					entityUpdateUtils.isUpdateForTypeRef(tutanotaTypeRefs.UserSettingsGroupRootTypeRef, update) ||
					entityUpdateUtils.isUpdateForTypeRef(sysTypeRefs.GroupInfoTypeRef, update)
				) {
					await this.loadContactLists()
				}
			}
		},
		priority: entityUpdateUtils.OnEntityUpdateReceivedPriority.NORMAL,
	}
}

export function lazyContactListId(logins: LoginController, entityClient: EntityClient): LazyLoaded<Id | null> {
	return new LazyLoaded(() => {
		return entityClient
			.loadRoot(tutanotaTypeRefs.ContactListTypeRef, logins.getUserController().user.userGroup.group)
			.then((contactList: tutanotaTypeRefs.ContactList) => {
				return contactList.contacts
			})
			.catch(
				ofClass(restError.NotFoundError, (e) => {
					if (!logins.getUserController().isInternalUser()) {
						return null // external users have no contact list.
					} else {
						throw e
					}
				}),
			)
	})
}
