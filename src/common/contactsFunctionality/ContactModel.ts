import { assertMainOrNode } from "../api/common/Env.js"
import { Group, GroupInfo, GroupInfoTypeRef, GroupMembership, GroupTypeRef } from "../api/entities/sys/TypeRefs.js"
import {
	Contact,
	ContactList,
	ContactListGroupRoot,
	ContactListGroupRootTypeRef,
	ContactListTypeRef,
	ContactTypeRef,
} from "../api/entities/tutanota/TypeRefs.js"
import { getFirstOrThrow, isNotNull, LazyLoaded, ofClass, promiseMap } from "@tutao/tutanota-utils"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { EntityClient, loadMultipleFromLists } from "../api/common/EntityClient.js"
import { LoginController } from "../api/main/LoginController.js"
import { EntityEventsListener, EventController } from "../api/main/EventController.js"
import { LoginIncompleteError } from "../api/common/error/LoginIncompleteError.js"
import { cleanMailAddress } from "../api/common/utils/CommonCalendarUtils.js"
import { DbError } from "../api/common/error/DbError.js"
import { compareOldestFirst, getEtId } from "../api/common/utils/EntityUtils.js"
import { NotAuthorizedError, NotFoundError } from "../api/common/error/RestError.js"
import { ShareCapability } from "../api/common/TutanotaConstants.js"
import { EntityUpdateData } from "../api/common/utils/EntityUpdateUtils.js"
import type { SearchResult } from "../api/worker/search/SearchTypes.js"

assertMainOrNode()

export type ContactListInfo = {
	name: string
	groupInfo: GroupInfo
	group: Group
	groupRoot: ContactListGroupRoot
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
		private readonly contactSearch: (query: string, field: string, minSuggestionCount: number, maxResults?: number) => Promise<SearchResult>,
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

	/**
	 * Provides the first contact (starting with oldest contact) that contains the given email address. Uses the index search if available, otherwise loads all contacts.
	 */
	async searchForContact(mailAddress: string): Promise<Contact | null> {
		//searching for contacts depends on searchFacade._db to be initialized. If the user has not logged in online the respective promise will never resolve.
		if (!this.loginController.isFullyLoggedIn()) {
			throw new LoginIncompleteError("cannot search for contacts as online login is not completed")
		}
		const cleanedMailAddress = cleanMailAddress(mailAddress)
		let result
		try {
			result = await this.contactSearch('"' + cleanedMailAddress + '"', "mailAddress", 0)
		} catch (e) {
			// If IndexedDB is not supported or isn't working for some reason we load contacts from the server and
			// search manually.
			if (e instanceof DbError) {
				const listId = await this.getContactListId()
				if (listId) {
					const contacts = await this.entityClient.loadAll(ContactTypeRef, listId)
					return contacts.find((contact) => contact.mailAddresses.some((a) => cleanMailAddress(a.address) === cleanedMailAddress)) ?? null
				} else {
					return null
				}
			} else {
				throw e
			}
		}
		// the result is sorted from newest to oldest, but we want to return the oldest first like before
		result.results.sort(compareOldestFirst)

		for (const contactId of result.results) {
			try {
				const contact = await this.entityClient.load(ContactTypeRef, contactId)
				if (contact.mailAddresses.some((a) => cleanMailAddress(a.address) === cleanedMailAddress)) {
					return contact
				}
			} catch (e) {
				if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
					continue
				} else {
					throw e
				}
			}
		}
		return null
	}

	/**
	 * @pre locator.search.indexState().indexingSupported
	 */
	async searchForContacts(query: string, field: string, minSuggestionCount: number): Promise<Contact[]> {
		if (!this.loginController.isFullyLoggedIn()) {
			throw new LoginIncompleteError("cannot search for contacts as online login is not completed")
		}
		const result = await this.contactSearch(query, field, minSuggestionCount)
		return await loadMultipleFromLists(ContactTypeRef, this.entityClient, result.results)
	}

	async searchForContactLists(query: string): Promise<ContactListInfo[]> {
		if (!this.loginController.isFullyLoggedIn()) {
			throw new LoginIncompleteError("cannot search for contact lists as online login is not completed")
		}

		const contactLists = await this.getLoadedContactListInfos()

		return contactLists.filter((contactList) => contactList.name.toLowerCase().includes(query))
	}

	async getContactGroupId(): Promise<Id> {
		return getFirstOrThrow(this.loginController.getUserController().getContactGroupMemberships()).group
	}

	private async loadContactLists() {
		const userController = this.loginController.getUserController()
		const contactListMemberships = userController.getContactListMemberships()
		const contactListInfo = (
			await promiseMap(
				await promiseMap(contactListMemberships, (rlm: GroupMembership) => this.entityClient.load(GroupInfoTypeRef, rlm.groupInfo)),
				// need to catch both NotFoundError and NotAuthorizedError, as we might still have a membership for a short time
				// when the group root is already deleted, or we deleted our membership
				(groupInfo) =>
					this.getContactListInfo(groupInfo)
						.catch(ofClass(NotFoundError, () => null))
						.catch(ofClass(NotAuthorizedError, () => null)),
			)
		).filter(isNotNull)

		this.contactListInfo(contactListInfo)
	}

	private async getContactListInfo(groupInfo: GroupInfo): Promise<ContactListInfo> {
		const group = await this.entityClient.load(GroupTypeRef, groupInfo.group)
		const groupRoot = await this.entityClient.load(ContactListGroupRootTypeRef, groupInfo.group)
		const userController = this.loginController.getUserController()
		const { getSharedGroupName } = await import("../sharing/GroupUtils.js")
		const { hasCapabilityOnGroup, isSharedGroupOwner } = await import("../sharing/GroupUtils.js")

		return {
			name: getSharedGroupName(groupInfo, userController, true),
			group,
			groupInfo,
			groupRoot,
			isOwner: isSharedGroupOwner(group, getEtId(userController.user)),
			canEdit: hasCapabilityOnGroup(userController.user, group, ShareCapability.Write),
		}
	}

	private readonly entityEventsReceived: EntityEventsListener = async (updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> => {
		for (const update of updates) {
			if (this.loginController.getUserController().isUpdateForLoggedInUserInstance(update, eventOwnerGroupId)) {
				await this.loadContactLists()
			}
		}
	}
}

export function lazyContactListId(logins: LoginController, entityClient: EntityClient): LazyLoaded<Id | null> {
	return new LazyLoaded(() => {
		return entityClient
			.loadRoot(ContactListTypeRef, logins.getUserController().user.userGroup.group)
			.then((contactList: ContactList) => {
				return contactList.contacts
			})
			.catch(
				ofClass(NotFoundError, (e) => {
					if (!logins.getUserController().isInternalUser()) {
						return null // external users have no contact list.
					} else {
						throw e
					}
				}),
			)
	})
}
