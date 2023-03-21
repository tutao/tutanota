import m, { Children } from "mithril"
import type { VirtualRow } from "../../gui/base/List"
import { List } from "../../gui/base/List"
import { assertMainOrNode } from "../../api/common/Env"
import { lang } from "../../misc/LanguageViewModel"
import { NotFoundError } from "../../api/common/error/RestError"
import { size } from "../../gui/size"
import type { SettingsView, UpdatableSettingsViewer } from "../SettingsView"
import { LazyLoaded, neverNull, ofClass } from "@tutao/tutanota-utils"
import { ContactFormViewer } from "./ContactFormViewer"
import * as ContactFormEditor from "./ContactFormEditor"
import type { ContactForm } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactFormTypeRef, CustomerContactFormGroupRootTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { getWhitelabelDomain } from "../../api/common/utils/Utils"
import type { CustomerInfo } from "../../api/entities/sys/TypeRefs.js"
import { CustomerInfoTypeRef, CustomerTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { OperationType } from "../../api/common/TutanotaConstants"
import { Icon } from "../../gui/base/Icon"
import { Icons } from "../../gui/base/icons/Icons"
import { getAdministratedGroupIds, getContactFormUrl, getDefaultContactFormLanguage } from "./ContactFormUtils"
import type { EntityUpdateData } from "../../api/main/EventController"
import { isUpdateForTypeRef } from "../../api/main/EventController"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { showNotAvailableForFreeDialog } from "../../misc/SubscriptionDialogs"
import { GENERATED_MAX_ID, isSameId } from "../../api/common/utils/EntityUtils"
import { ListColumnWrapper } from "../../gui/ListColumnWrapper"
import { locator } from "../../api/main/MainLocator"

assertMainOrNode()
const className = "group-list"

export class ContactFormListView implements UpdatableSettingsViewer {
	private readonly list: List<ContactForm, ContactFormRow>
	private readonly listId: LazyLoaded<Id>
	private readonly customerInfo: LazyLoaded<CustomerInfo>
	private readonly settingsView: SettingsView

	constructor(settingsView: SettingsView) {
		this.settingsView = settingsView
		this.listId = new LazyLoaded(() => {
			return locator.entityClient.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer)).then((customer) => {
				return locator.entityClient.load(CustomerContactFormGroupRootTypeRef, customer.customerGroup).then((root) => root.contactForms)
			})
		})
		this.customerInfo = new LazyLoaded(() => {
			return locator.entityClient
				.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer))
				.then((customer) => locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo))
		})

		this.customerInfo.getAsync() // trigger loading so it is available later

		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: async (startId, count) => {
				if (startId !== GENERATED_MAX_ID) {
					throw new Error("fetch user group infos called for specific start id")
				}
				const listId = await this.listId.getAsync()
				// we return all contact forms because we have already loaded all contact forms and the scroll bar shall have the complete size.
				const contactForms = await locator.entityClient.loadAll(ContactFormTypeRef, listId)
				const items = await filterContactFormsForLocalAdmin(contactForms)
				return { items, complete: true }
			},
			loadSingle: (elementId) => {
				return this.listId.getAsync().then((listId) => {
					return locator.entityClient.load<ContactForm>(ContactFormTypeRef, [listId, elementId]).catch(
						ofClass(NotFoundError, () => {
							// we return null if the entity does not exist
							return null
						}),
					)
				})
			},
			sortCompare: (a: ContactForm, b: ContactForm) => a.path.localeCompare(b.path),
			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) =>
				this.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new ContactFormRow(this.customerInfo),
			className: className,
			swipe: {
				enabled: false,
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: () => {
					return Promise.resolve(false)
				},
				swipeRight: () => {
					return Promise.resolve(false)
				},
			},
			multiSelectionAllowed: false,
			emptyMessage: lang.get("noEntries_msg"),
		})

		// Old-style component hacks
		this.view = this.view.bind(this)

		this.list.loadInitial()
	}

	view(): Children {
		return m(
			ListColumnWrapper,
			{
				headerContent: m(
					".mr-negative-s.align-self-end.plr-l",
					m(Button, {
						label: "createContactForm_label",
						type: ButtonType.Primary,
						click: () => this.addButtonClicked(),
					}),
				),
			},
			m(this.list),
		)
	}

	private elementSelected(contactForms: ContactForm[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (contactForms.length === 0 && this.settingsView.detailsViewer) {
			this.settingsView.detailsViewer = null
			m.redraw()
		} else if (contactForms.length === 1 && selectionChanged) {
			this.customerInfo.getAsync().then((customerInfo) => {
				const whitelabelDomain = getWhitelabelDomain(customerInfo)

				this.settingsView.detailsViewer = new ContactFormViewer(contactForms[0], whitelabelDomain?.domain ?? null, (contactFormId) =>
					this.list.scrollToIdAndSelectWhenReceived(contactFormId),
				)

				if (elementClicked) {
					this.settingsView.focusSettingsDetailsColumn()
				}

				m.redraw()
			})
		} else {
			this.settingsView.focusSettingsDetailsColumn()
		}
	}

	private addButtonClicked() {
		if (locator.logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog(false)
		} else {
			ContactFormEditor.show(null, true, (contactFormId) => this.list.scrollToIdAndSelectWhenReceived(contactFormId))
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			await this.processUpdate(update)
		}
	}

	private async processUpdate(update: EntityUpdateData): Promise<void> {
		const { instanceListId, instanceId, operation } = update

		if (isUpdateForTypeRef(ContactFormTypeRef, update) && this.listId.isLoaded() && instanceListId === this.listId.getLoaded()) {
			if (!locator.logins.getUserController().isGlobalAdmin() && update.operation !== OperationType.DELETE) {
				const listEntity = this.list.getEntity(instanceId)
				const cf = await locator.entityClient.load(ContactFormTypeRef, [neverNull(instanceListId), instanceId])
				const allAdministratedGroupIds = await getAdministratedGroupIds()
				if (listEntity) {
					if (!allAdministratedGroupIds.includes(cf.targetGroup)) {
						await this.list.entityEventReceived(instanceId, OperationType.DELETE)
					} else {
						await this.list.entityEventReceived(instanceId, operation)
					}
				} else {
					if (allAdministratedGroupIds.includes(cf.targetGroup)) {
						return this.list.entityEventReceived(instanceId, OperationType.CREATE)
					}
				}
			} else {
				await this.list.entityEventReceived(instanceId, operation)
			}

			if (
				this.customerInfo.isLoaded() &&
				getWhitelabelDomain(this.customerInfo.getLoaded()) &&
				this.settingsView.detailsViewer &&
				operation === OperationType.UPDATE &&
				isSameId((this.settingsView.detailsViewer as ContactFormViewer).contactForm._id, [neverNull(instanceListId), instanceId])
			) {
				const updatedContactForm = await locator.entityClient.load(ContactFormTypeRef, [neverNull(instanceListId), instanceId])
				this.settingsView.detailsViewer = new ContactFormViewer(
					updatedContactForm,
					neverNull(getWhitelabelDomain(this.customerInfo.getLoaded())).domain,
					(contactFormId) => this.list.scrollToIdAndSelectWhenReceived(contactFormId),
				)
				m.redraw()
			}
		} else if (
			isUpdateForTypeRef(CustomerInfoTypeRef, update) &&
			this.customerInfo.isLoaded() &&
			isSameId(this.customerInfo.getLoaded()._id, [neverNull(instanceListId), instanceId]) &&
			operation === OperationType.UPDATE
		) {
			// a domain may have been added
			this.customerInfo.reset()

			await this.customerInfo.getAsync()
		} else if (isUpdateForTypeRef(CustomerTypeRef, update) && this.customerInfo.isLoaded() && operation === OperationType.UPDATE) {
			// the customer info may have been moved in case of premium upgrade/downgrade
			this.customerInfo.reset()

			await this.customerInfo.getAsync()
		}
	}
}

export class ContactFormRow implements VirtualRow<ContactForm> {
	top: number
	domElement: HTMLElement | null = null // set from List

	entity: ContactForm | null
	private _domPageTitle!: HTMLElement
	private _domUrl!: HTMLElement
	private _domDeletedIcon!: HTMLElement
	private _customerInfo: LazyLoaded<CustomerInfo>

	constructor(customerInfo: LazyLoaded<CustomerInfo>) {
		this.top = 0
		this.entity = null
		this._customerInfo = customerInfo
	}

	update(contactForm: ContactForm, selected: boolean): void {
		if (!this.domElement) {
			return
		}

		if (selected) {
			this.domElement.classList.add("row-selected")
		} else {
			this.domElement.classList.remove("row-selected")
		}

		this._domPageTitle.textContent = getDefaultContactFormLanguage(contactForm.languages).pageTitle

		if (this._customerInfo.isLoaded()) {
			const whitelabelDomain = getWhitelabelDomain(this._customerInfo.getLoaded())

			this._domUrl.textContent = getContactFormUrl(whitelabelDomain?.domain ?? null, contactForm.path)
		}
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		return [
			m(".top", [
				m(".name", {
					oncreate: (vnode) => (this._domPageTitle = vnode.dom as HTMLElement),
				}),
			]),
			m(".bottom.flex-space-between", [
				m("small.mail-address", {
					oncreate: (vnode) => (this._domUrl = vnode.dom as HTMLElement),
				}),
				m(".icons.flex", [
					m(Icon, {
						icon: Icons.Trash,
						oncreate: (vnode) => (this._domDeletedIcon = vnode.dom as HTMLElement),
						style: {
							display: "none",
						},
						class: "svg-list-accent-fg",
					}),
				]),
			]),
		]
	}
}

export function filterContactFormsForLocalAdmin(contactForms: ContactForm[]): Promise<ContactForm[]> {
	if (locator.logins.getUserController().isGlobalAdmin()) {
		return Promise.resolve(contactForms)
	} else {
		return getAdministratedGroupIds().then((allAdministratedGroupIds) => {
			return contactForms.filter((cf: ContactForm) => allAdministratedGroupIds.indexOf(cf.targetGroup) !== -1)
		})
	}
}
