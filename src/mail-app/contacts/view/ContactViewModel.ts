import { ContactModel } from "../../../common/contactsFunctionality/ContactModel.js"
import { EntityClient } from "../../../common/api/common/EntityClient.js"
import { EntityEventsListener, EventController } from "../../../common/api/main/EventController.js"
import { ListModel } from "../../../common/misc/ListModel.js"
import { Contact, ContactTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { compareContacts } from "./ContactGuiUtils.js"
import { ListState } from "../../../common/gui/base/List.js"
import { assertNotNull, lazyMemoized } from "@tutao/tutanota-utils"
import { getElementId } from "../../../common/api/common/utils/EntityUtils.js"
import Stream from "mithril/stream"
import { Router } from "../../../common/gui/ScopedRouter.js"
import { isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils.js"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig.js"

/** ViewModel for the overall contact view. */
export class ContactViewModel {
	contactListId!: Id
	/** id of the contact we are trying to load based on the url */
	private targetContactId: Id | null = null
	sortByFirstName: boolean = true
	private listModelStateStream: Stream<unknown> | null = null

	constructor(
		private readonly contactModel: ContactModel,
		private readonly entityClient: EntityClient,
		private readonly eventController: EventController,
		private readonly router: Router,
		private readonly updateUi: () => unknown,
	) {}

	readonly listModel: ListModel<Contact> = new ListModel<Contact>({
		fetch: async () => {
			const items = await this.entityClient.loadAll(ContactTypeRef, this.contactListId)
			return { items, complete: true }
		},
		loadSingle: async (_listId: Id, elementId: Id) => {
			const listId = await this.contactModel.getContactListId()
			if (listId == null) return null
			return this.entityClient.load(ContactTypeRef, [listId, elementId])
		},
		sortCompare: (c1, c2) => compareContacts(c1, c2, this.sortByFirstName),
		autoSelectBehavior: () => ListAutoSelectBehavior.NONE,
	})

	async init(contactListId?: Id) {
		// update url if the view was just opened
		if (contactListId == null) this.updateUrl()
		if (this.contactListId) return

		this.contactListId = assertNotNull(await this.contactModel.getContactListId(), "not available for external users")

		this.initOnce()
		await this.listModel.loadInitial()
	}

	async selectContact(contactId: Id) {
		// We are loading all contacts at once anyway so we are not worried about starting parallel loads for target
		await this.loadAndSelect(contactId)
	}

	private readonly initOnce = lazyMemoized(() => {
		this.eventController.addEntityListener(this.entityListener)
		this.listModelStateStream = this.listModel.stateStream.map(() => {
			this.updateUi()
			this.updateUrl()
		})
	})

	private updateUrl() {
		const contactId =
			this.targetContactId ??
			(!this.listModel.state.inMultiselect && this.listModel.getSelectedAsArray().length === 1
				? getElementId(this.listModel.getSelectedAsArray()[0])
				: null)
		if (contactId) {
			this.router.routeTo(`/contact/:listId/:contactId`, { listId: this.contactListId, contactId: contactId })
		} else {
			this.router.routeTo(`/contact/:listId`, { listId: this.contactListId })
		}
	}

	private readonly entityListener: EntityEventsListener = async (updates) => {
		for (const update of updates) {
			const { instanceListId, instanceId, operation } = update
			if (isUpdateForTypeRef(ContactTypeRef, update) && instanceListId === this.contactListId) {
				await this.listModel.entityEventReceived(instanceListId, instanceId, operation)
			}
		}
	}

	async loadAndSelect(contactId: Id) {
		const listId = this.contactListId
		this.targetContactId = contactId

		await this.listModel.loadAndSelect(contactId, () => this.contactListId !== listId && this.targetContactId === contactId)
		// if we reached the goal and the target wasn't swapped in between
		if (this.targetContactId === contactId) {
			this.targetContactId = null
		}
	}

	setSortByFirstName(sorting: boolean) {
		this.sortByFirstName = sorting
		this.listModel.sort()
	}

	listState(): ListState<Contact> {
		return this.listModel.state
	}

	dispose() {
		this.eventController.removeEntityListener(this.entityListener)
		this.listModelStateStream?.end(true)
		this.listModelStateStream = null
	}
}
