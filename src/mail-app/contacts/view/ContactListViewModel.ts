import { ListModel } from "../../../common/misc/ListModel.js"
import {
	Contact,
	ContactListEntry,
	ContactListEntryTypeRef,
	ContactListGroupRoot,
	ContactListGroupRootTypeRef,
	ContactTypeRef,
	createContactListEntry,
} from "../../../common/api/entities/tutanota/TypeRefs.js"
import { getEtId, isSameId } from "../../../common/api/common/utils/EntityUtils.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { GroupManagementFacade } from "../../../common/api/worker/facades/lazy/GroupManagementFacade.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { arrayEquals, debounce, lazyMemoized, memoized } from "@tutao/tutanota-utils"
import { EntityEventsListener, EventController } from "../../../common/api/main/EventController.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { Router } from "../../../common/gui/ScopedRouter.js"
import { ContactListInfo, ContactModel } from "../../../common/contactsFunctionality/ContactModel.js"
import { ReceivedGroupInvitation } from "../../../common/api/entities/sys/TypeRefs.js"
import { ReceivedGroupInvitationsModel } from "../../../common/sharing/model/ReceivedGroupInvitationsModel.js"
import { GroupType } from "../../../common/api/common/TutanotaConstants.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig.js"

export class ContactListViewModel {
	private selectedContactList: Id | null = null

	contactsForSelectedEntry: Contact[] = []
	private listModelStateStream: Stream<unknown> | null = null
	private sortedContactListInfos: Stream<ReadonlyArray<ContactListInfo>> = stream([])
	private sortedSharedContactListInfos: Stream<ReadonlyArray<ContactListInfo>> = stream([])

	constructor(
		private readonly entityClient: EntityClient,
		private readonly groupManagementFacade: GroupManagementFacade,
		private readonly loginController: LoginController,
		private readonly eventController: EventController,
		private readonly contactModel: ContactModel,
		private readonly contactListInvitations: ReceivedGroupInvitationsModel<GroupType.ContactList>,
		private readonly router: Router,
		private readonly updateUi: () => unknown,
	) {}

	async showListAndEntry(listId?: Id, entryId?: Id) {
		this.selectedContactList = listId ?? null

		// make sure that we have the list infos before we check whether the passed one is in them
		await this.init()
		// checking that no one changed the list in the meantime concurrently
		if (this.selectedContactList === listId && !this.getContactListInfoForEntryListId(listId)) {
			this.selectedContactList = null
		}
		await this.listModel?.loadInitial()

		if (listId && entryId) {
			this.loadAndSelect(listId, entryId)
		}
	}

	readonly init = lazyMemoized(async () => {
		this.eventController.addEntityListener(this.entityEventsReceived)
		this.sortedContactListInfos = this.contactModel.getOwnContactListInfos().map((infos) => {
			this.updateUi()
			return infos.slice().sort((a, b) => a.name.localeCompare(b.name))
		})
		this.sortedSharedContactListInfos = this.contactModel.getSharedContactListInfos().map((infos) => {
			this.updateUi()
			return infos.slice().sort((a, b) => a.name.localeCompare(b.name))
		})

		this.contactListInvitations.init()
		// dispose() of the model will end this stream, no need to unsubscribe manually
		this.contactListInvitations.invitations.map(this.updateUi)
		await this.contactModel.getLoadedContactListInfos()
	})

	get listModel(): ListModel<ContactListEntry> | null {
		return this.selectedContactList ? this._listModel(this.selectedContactList) : null
	}

	private readonly _listModel = memoized((listId: Id) => {
		const newListModel = new ListModel<ContactListEntry>({
			fetch: async () => {
				const items = await this.getRecipientsForList(listId)
				return { items, complete: true }
			},
			loadSingle: async (_listId: Id, elementId: Id) => {
				return this.entityClient.load(ContactListEntryTypeRef, [listId, elementId])
			},
			sortCompare: (rl1, rl2) => rl1.emailAddress.localeCompare(rl2.emailAddress),
			autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
		})

		this.listModelStateStream?.end(true)

		this.listModelStateStream = newListModel.stateStream.map(() => {
			this.contactsForSelectedEntry = []
			this.updateUi()
			this.updateUrl()
			this.getContactsForSelectedContactListEntry()
		})

		return newListModel
	})

	private async loadAndSelect(listId: Id, contactListEntryId: Id) {
		await this.listModel?.loadAndSelect(contactListEntryId, () => this.selectedContactList !== listId)
	}

	getContactListId(): Promise<Id | null> {
		return this.contactModel.getContactListId()
	}

	getOwnContactListInfos(): ReadonlyArray<ContactListInfo> {
		return this.sortedContactListInfos() ?? []
	}

	getSharedContactListInfos(): ReadonlyArray<ContactListInfo> {
		return this.sortedSharedContactListInfos() ?? []
	}

	getContactListInvitations(): Array<ReceivedGroupInvitation> {
		return this.contactListInvitations.invitations()
	}

	private readonly getContactsForSelectedContactListEntry = debounce(50, async () => {
		const selected = this.getSelectedContactListEntries()
		if (selected?.length === 1) {
			const searchedContacts = await this.contactModel.searchForContacts(selected[0].emailAddress, "mailAddress", 10)
			// need an exact match
			const contacts = searchedContacts.filter((contact) =>
				contact.mailAddresses.map((mailAddress) => mailAddress.address).includes(selected[0].emailAddress),
			)
			const nowSelected = this.getSelectedContactListEntries() ?? []
			if (arrayEquals(selected, nowSelected)) {
				this.contactsForSelectedEntry = contacts
			}
		} else {
			return []
		}
		this.updateUi()
	})

	private updateUrl() {
		if (!this.listModel?.state.inMultiselect) {
			const recipient = this.getSelectedContactListEntries()
			if (recipient && recipient.length === 1) {
				this.router.routeTo(`/contactlist/:listId/:itemId`, { listId: this.selectedContactList, itemId: recipient[0]._id[1] })
				return
			}
		}
		if (this.selectedContactList) {
			this.router.routeTo(`/contactlist/:listId`, { listId: this.selectedContactList })
		} else {
			this.router.routeTo(`/contactlist`, {})
		}
	}

	async canCreateContactList(): Promise<boolean> {
		const planConfig = await this.loginController.getUserController().getPlanConfig()
		return planConfig.contactList
	}

	async addContactList(name: string, recipients: string[]) {
		const newGroup = await this.groupManagementFacade.createContactListGroup(name)
		const newContactList = await this.entityClient.load(ContactListGroupRootTypeRef, newGroup._id)

		this.addRecipientstoContactList(recipients, newContactList)
	}

	async addRecipientstoContactList(addresses: string[], contactListGroupRoot: ContactListGroupRoot) {
		const currentRecipients = await this.getRecipientsForList(contactListGroupRoot.entries)
		const listAddresses = currentRecipients.map((entry) => entry.emailAddress)
		for (const address of addresses) {
			if (!listAddresses.includes(address)) {
				const recipient = createContactListEntry({
					_ownerGroup: contactListGroupRoot._id,
					emailAddress: address,
				})

				this.addEntryOnList(contactListGroupRoot.entries, recipient)
			}
		}
	}

	addEntryOnList(recipientsId: Id, recipient: ContactListEntry) {
		this.entityClient.setup(recipientsId, recipient)
	}

	private readonly entityEventsReceived: EntityEventsListener = async (updates: ReadonlyArray<EntityUpdateData>): Promise<void> => {
		for (const update of updates) {
			if (this.selectedContactList) {
				const { instanceListId, instanceId, operation } = update
				if (isUpdateForTypeRef(ContactListEntryTypeRef, update) && isSameId(this.selectedContactList, instanceListId)) {
					await this.listModel?.entityEventReceived(instanceListId, instanceId, operation)
				} else if (isUpdateForTypeRef(ContactTypeRef, update)) {
					this.getContactsForSelectedContactListEntry()
				}
			}

			this.updateUi()
		}
	}

	updateSelectedContactList(selected: Id): void {
		this.selectedContactList = selected
		this.listModel?.loadInitial()
	}

	updateContactList(contactListInfo: ContactListInfo, name: string, addresses: string[]): void {
		// the name is stored on both GroupInfo (own contact list) and UserSettingsGroupRoot (contact lists shared with us)
		// note: make sure to handle shared contact lists when implementing sharing
		contactListInfo.name = name
		contactListInfo.groupInfo.name = name
		this.entityClient.update(contactListInfo.groupInfo)
	}

	getSelectedContactListInfo(): ContactListInfo | null {
		return this.selectedContactList ? this.getContactListInfoForEntryListId(this.selectedContactList) : null
	}

	getSelectedContactListEntries(): ContactListEntry[] | undefined {
		return this.listModel?.getSelectedAsArray()
	}

	async getRecipientsForList(listId: Id): Promise<ContactListEntry[]> {
		return await this.entityClient.loadAll(ContactListEntryTypeRef, listId)
	}

	deleteContactList(contactList: ContactListInfo) {
		this.groupManagementFacade.deleteContactListGroup(contactList.groupRoot)
	}

	async deleteContactListEntries(recipients: ContactListEntry[]) {
		for (const recipient of recipients) {
			await this.entityClient.erase(recipient)
		}
	}

	removeUserFromContactList(contactList: ContactListInfo) {
		return locator.groupManagementFacade.removeUserFromGroup(getEtId(this.loginController.getUserController().user), contactList.groupInfo.group)
	}

	async deleteSelectedEntries() {
		await this.deleteContactListEntries(this.getSelectedContactListEntries() ?? [])
	}

	private getContactListInfoForEntryListId(listId: string): ContactListInfo | null {
		return (
			this.getOwnContactListInfos().find((contactList) => contactList.groupRoot.entries === listId) ??
			this.getSharedContactListInfos().find((contactList) => contactList.groupRoot.entries === listId) ??
			null
		)
	}

	dispose() {
		this.eventController.removeEntityListener(this.entityEventsReceived)
		this.sortedContactListInfos.end(true)
		this.sortedSharedContactListInfos.end(true)
		this.contactListInvitations.dispose()
	}
}
