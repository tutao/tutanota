import { ListModel } from "../../misc/ListModel.js"
import {
	Contact,
	ContactListEntry,
	ContactListEntryTypeRef,
	ContactListGroupRoot,
	ContactListGroupRootTypeRef,
	createContactListEntry,
} from "../../api/entities/tutanota/TypeRefs.js"
import { GENERATED_MAX_ID, isSameId } from "../../api/common/utils/EntityUtils.js"
import { EntityClient } from "../../api/common/EntityClient.js"
import { GroupManagementFacade } from "../../api/worker/facades/lazy/GroupManagementFacade.js"
import { LoginController } from "../../api/main/LoginController.js"
import { GroupInfo } from "../../api/entities/sys/TypeRefs.js"
import { arrayEquals, debounce, lazyMemoized, memoized } from "@tutao/tutanota-utils"
import { EntityEventsListener, EntityUpdateData, EventController, isUpdateForTypeRef } from "../../api/main/EventController.js"
import Stream from "mithril/stream"
import { Router } from "../../gui/ScopedRouter.js"
import { ContactModel } from "../model/ContactModel.js"

export type ContactListInfo = {
	name: string
	groupInfo: GroupInfo
	groupRoot: ContactListGroupRoot
}

export class ContactListViewModel {
	private selectedContactList: Id | null = null

	contactsForSelectedEntry: Contact[] = []
	private listModelStateStream: Stream<unknown> | null = null

	constructor(
		private readonly entityClient: EntityClient,
		private readonly groupManagementFacade: GroupManagementFacade,
		private readonly loginController: LoginController,
		private readonly eventController: EventController,
		private readonly contactModel: ContactModel,
		private readonly router: Router,
		private readonly updateUi: () => unknown,
	) {}

	async showListAndEntry(listId?: Id, entryId?: Id) {
		this.selectedContactList = listId ?? null

		// make sure that we have the list infos before we check whether the passed one is in them
		await this.init()
		// checking that no one changed the list in the meantime concurrently
		if (this.selectedContactList === listId && !this.getContactListForEntryListId(listId)) {
			this.selectedContactList = null
		}
		await this.listModel?.loadInitial()

		if (entryId && listId) {
			this.loadAndSelect(entryId, listId)
		}
	}

	readonly init = lazyMemoized(async () => {
		this.eventController.addEntityListener(this.entityEventsReceived)
		await this.contactModel.getLoadedContactListInfos()
	})

	get listModel(): ListModel<ContactListEntry> | null {
		return this.selectedContactList ? this._listModel(this.selectedContactList) : null
	}

	private readonly _listModel = memoized((listId: Id) => {
		const newListModel = new ListModel<ContactListEntry>({
			topId: GENERATED_MAX_ID,
			fetch: async () => {
				const items = await this.getRecipientsForList(listId)
				return { items, complete: true }
			},
			loadSingle: async (elementId: Id) => {
				return this.entityClient.load(ContactListEntryTypeRef, [listId, elementId])
			},
			sortCompare: (rl1, rl2) => rl1.emailAddress.localeCompare(rl2.emailAddress),
		})

		this.listModelStateStream?.end(true)

		this.listModelStateStream = newListModel.stateStream.map((state) => {
			this.contactsForSelectedEntry = []
			this.updateUi()
			this.updateUrl()
			this.updateSelectedContacts()
		})

		return newListModel
	})

	private async loadAndSelect(contactListEntryId: Id, listId: Id) {
		await this.listModel?.loadAndSelect(contactListEntryId, () => this.selectedContactList !== listId)
	}

	getContactListId(): Promise<Id | null> {
		return this.contactModel.getContactListId()
	}

	getContactListInfo(): Array<ContactListInfo> {
		return this.contactModel
			.getContactListInfos()
			.slice()
			.sort((a, b) => a.name.localeCompare(b.name))
	}

	private readonly updateSelectedContacts = debounce(50, async () => {
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
		this.router.routeTo(`/contactlist/:listId`, { listId: this.selectedContactList })
	}

	async canCreateContactList(): Promise<boolean> {
		const planConfig = await this.loginController.getUserController().getPlanConfig()
		return planConfig.contactList
	}

	async addContactList(name: string, recipients: string[]) {
		const newId = await this.groupManagementFacade.createContactListGroup(name)
		const newContactList = await this.entityClient.load(ContactListGroupRootTypeRef, newId)
		this.addRecipientstoContactList(recipients, newContactList)
	}

	async addRecipientstoContactList(addresses: string[], contactListGroupRoot: ContactListGroupRoot) {
		const currentRecipients = await this.getRecipientsForList(contactListGroupRoot.recipients)
		const listAddresses = currentRecipients.map((entry) => entry.emailAddress)
		for (const address of addresses) {
			if (!listAddresses.includes(address)) {
				const recipient = createContactListEntry({
					_ownerGroup: contactListGroupRoot._id,
					emailAddress: address,
				})

				this.addRecipientOnList(contactListGroupRoot.recipients, recipient)
			}
		}
	}

	addRecipientOnList(recipientsId: Id, recipient: ContactListEntry) {
		this.entityClient.setup(recipientsId, recipient)
	}

	private readonly entityEventsReceived: EntityEventsListener = async (updates: ReadonlyArray<EntityUpdateData>): Promise<void> => {
		for (const update of updates) {
			if (this.selectedContactList && isUpdateForTypeRef(ContactListEntryTypeRef, update) && isSameId(this.selectedContactList, update.instanceListId)) {
				await this.listModel?.entityEventReceived(update.instanceId, update.operation)
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
		return this.selectedContactList ? this.getContactListForEntryListId(this.selectedContactList) : null
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

	async deleteSelectedEntries() {
		await this.deleteContactListEntries(this.getSelectedContactListEntries() ?? [])
	}

	private getContactListForEntryListId(listId: string): ContactListInfo | null {
		return this.contactModel.getContactListInfos().find((contactList) => contactList.groupRoot.recipients === listId) ?? null
	}

	dispose() {
		this.eventController.removeEntityListener(this.entityEventsReceived)
	}
}
