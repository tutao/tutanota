import type { Contact, ContactList } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactListGroupRootTypeRef, ContactListTypeRef, ContactTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { createRestriction } from "../../search/model/SearchUtils"
import { groupBy, identity, isNotNull, LazyLoaded, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { NotAuthorizedError, NotFoundError } from "../../api/common/error/RestError"
import { DbError } from "../../api/common/error/DbError"
import { EntityClient } from "../../api/common/EntityClient"
import type { LoginController } from "../../api/main/LoginController"
import { compareOldestFirst, elementIdPart, isSameId, listIdPart } from "../../api/common/utils/EntityUtils"
import type { SearchFacade } from "../../api/worker/search/SearchFacade"
import { assertMainOrNode } from "../../api/common/Env"
import { LoginIncompleteError } from "../../api/common/error/LoginIncompleteError"
import { cleanMailAddress } from "../../api/common/utils/CommonCalendarUtils.js"
import { ContactListInfo } from "../view/ContactListViewModel.js"
import { GroupInfo, GroupInfoTypeRef, GroupMembership, UserTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { EntityEventsListener, EntityUpdateData, EventController, isUpdateForTypeRef } from "../../api/main/EventController.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"

assertMainOrNode()

export class ContactModel {
	private contactListId: LazyLoaded<Id | null>
	private contactListInfo: Stream<ReadonlyArray<ContactListInfo>> = stream()

	constructor(
		private readonly searchFacade: SearchFacade,
		private readonly entityClient: EntityClient,
		private readonly loginController: LoginController,
		private readonly eventController: EventController,
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
	getContactListInfos(): Stream<ReadonlyArray<ContactListInfo>> {
		// defensive clone
		return this.contactListInfo.map(identity)
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
			result = await this.searchFacade.search('"' + cleanedMailAddress + '"', createRestriction("contact", null, null, "mailAddress", null), 0)
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
		const result = await this.searchFacade.search(query, createRestriction("contact", null, null, field, null), minSuggestionCount)
		const resultsByListId = groupBy(result.results, listIdPart)
		const loadedContacts = await promiseMap(
			resultsByListId,
			([listId, idTuples]) => {
				// we try to load all contacts from the same list in one request
				return this.entityClient.loadMultiple(ContactTypeRef, listId, idTuples.map(elementIdPart)).catch(
					ofClass(NotAuthorizedError, (e) => {
						console.log("tried to access contact without authorization", e)
						return []
					}),
				)
			},
			{
				concurrency: 3,
			},
		)
		return loadedContacts.flat()
	}

	async searchForContactLists(query: string): Promise<ContactListInfo[]> {
		if (!this.loginController.isFullyLoggedIn()) {
			throw new LoginIncompleteError("cannot search for contact lists as online login is not completed")
		}

		const contactLists = await this.getLoadedContactListInfos()

		return contactLists.filter((contactList) => contactList.name.toLowerCase().includes(query))
	}

	private async loadContactLists() {
		const userController = this.loginController.getUserController()
		const contactListMemberships = userController.getContactListMemberships()
		const contactListInfo = (
			await promiseMap(
				await promiseMap(contactListMemberships, (rlm: GroupMembership) => this.entityClient.load(GroupInfoTypeRef, rlm.groupInfo)),
				// we might still have a membership for a short time when the group root is already deleted
				(groupInfo) => this.getContactListInfo(groupInfo).catch(ofClass(NotFoundError, () => null)),
			)
		).filter(isNotNull)

		this.contactListInfo(contactListInfo)
	}

	private async getContactListInfo(groupInfo: GroupInfo): Promise<ContactListInfo> {
		const groupRoot = await this.entityClient.load(ContactListGroupRootTypeRef, groupInfo.group)

		const { getSharedGroupName } = await import("../../sharing/GroupUtils.js")

		return {
			name: getSharedGroupName(groupInfo, this.loginController.getUserController(), true),
			groupInfo,
			groupRoot,
		}
	}

	private readonly entityEventsReceived: EntityEventsListener = async (updates: ReadonlyArray<EntityUpdateData>): Promise<void> => {
		for (const update of updates) {
			if (isUpdateForTypeRef(UserTypeRef, update) && isSameId(this.loginController.getUserController().userId, update.instanceId)) {
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
