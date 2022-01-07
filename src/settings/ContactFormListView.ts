import m, {Children} from "mithril"
import type {VirtualRow} from "../gui/base/List"
import {List} from "../gui/base/List"
import {assertMainOrNode} from "../api/common/Env"
import {lang} from "../misc/LanguageViewModel"
import {NotFoundError} from "../api/common/error/RestError"
import {size} from "../gui/size"
import type {SettingsView, UpdatableSettingsViewer} from "./SettingsView"
import {LazyLoaded} from "@tutao/tutanota-utils"
import {ContactFormViewer, getContactFormUrl} from "./ContactFormViewer"
import * as ContactFormEditor from "./ContactFormEditor"
import type {ContactForm} from "../api/entities/tutanota/ContactForm"
import {ContactFormTypeRef} from "../api/entities/tutanota/ContactForm"
import {getWhitelabelDomain} from "../api/common/utils/Utils"
import {neverNull, noOp} from "@tutao/tutanota-utils"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import type {CustomerInfo} from "../api/entities/sys/CustomerInfo"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {logins} from "../api/main/LoginController"
import {Dialog} from "../gui/base/Dialog"
import {OperationType} from "../api/common/TutanotaConstants"
import {Icon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {CustomerContactFormGroupRootTypeRef} from "../api/entities/tutanota/CustomerContactFormGroupRoot"
import {getAdministratedGroupIds, getDefaultContactFormLanguage} from "../contacts/ContactFormUtils"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {showNotAvailableForFreeDialog} from "../misc/SubscriptionDialogs"
import {GENERATED_MAX_ID, isSameId} from "../api/common/utils/EntityUtils"
import {ListColumnWrapper} from "../gui/ListColumnWrapper"
import {ofClass, promiseMap} from "@tutao/tutanota-utils"
import {locator} from "../api/main/MainLocator"

assertMainOrNode()
const className = "group-list"

export class ContactFormListView implements UpdatableSettingsViewer {
	list: List<ContactForm, ContactFormRow>
	view: (...args: Array<any>) => any
	_listId: LazyLoaded<Id>
	_customerInfo: LazyLoaded<CustomerInfo>
	_settingsView: SettingsView

	constructor(settingsView: SettingsView) {
		this._settingsView = settingsView
		this._listId = new LazyLoaded(() => {
			return locator.entityClient.load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
				return locator.entityClient.load(CustomerContactFormGroupRootTypeRef, customer.customerGroup).then(root => root.contactForms)
			})
		})
		this._customerInfo = new LazyLoaded(() => {
			return locator.entityClient
						  .load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
						  .then(customer => locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo))
		})

		this._customerInfo.getAsync() // trigger loading so it is available later

		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: (startId, count) => {
				if (startId === GENERATED_MAX_ID) {
					return this._listId.getAsync().then(listId => {
						return locator.entityClient.loadAll(ContactFormTypeRef, listId).then(contactForms => {
							// we have to set loadedCompletely to make sure that fetch is never called again and also that new contact forms are inserted into the list, even at the end
							this._setLoadedCompletely()

							// we return all contact forms because we have already loaded all contact forms and the scroll bar shall have the complete size.
							return filterContactFormsForLocalAdmin(contactForms)
						})
					})
				} else {
					throw new Error("fetch user group infos called for specific start id")
				}
			},
			loadSingle: elementId => {
				return this._listId.getAsync().then(listId => {
					return locator.entityClient
								  .load<ContactForm>(ContactFormTypeRef, [listId, elementId])
								  .catch(
									  ofClass(NotFoundError, e => {
										  // we return null if the entity does not exist
										  return null
									  }),
								  )
				})
			},
			sortCompare: (a: ContactForm, b: ContactForm) => a.path.localeCompare(b.path),
			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) =>
				this.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new ContactFormRow(this._customerInfo),
			showStatus: false,
			className: className,
			swipe: {
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: () => {
					return Promise.resolve()
				},
				swipeRight: () => {
					return Promise.resolve()
				},
			} as any,
			multiSelectionAllowed: false,
			emptyMessage: lang.get("noEntries_msg"),
		})

		this.view = (): Children => {
			return m(
				ListColumnWrapper,
				{
					headerContent: m(
						".mr-negative-s.align-self-end",
						m(ButtonN, {
							label: "createContactForm_label",
							type: ButtonType.Primary,
							click: () => this.addButtonClicked(),
						}),
					),
				},
				m(this.list),
			)
		}

		this.list.loadInitial()
	}

	_setLoadedCompletely() {
		this.list.setLoadedCompletely()
	}

	elementSelected(contactForms: ContactForm[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (contactForms.length === 0 && this._settingsView.detailsViewer) {
			this._settingsView.detailsViewer = null
			m.redraw()
		} else if (contactForms.length === 1 && selectionChanged) {
			this._customerInfo.getAsync().then(customerInfo => {
				const whitelabelDomain = getWhitelabelDomain(customerInfo)

				if (whitelabelDomain) {
					this._settingsView.detailsViewer = new ContactFormViewer(contactForms[0], whitelabelDomain.domain, contactFormId =>
						this.list.scrollToIdAndSelectWhenReceived(contactFormId),
					)

					if (elementClicked) {
						this._settingsView.focusSettingsDetailsColumn()
					}

					m.redraw()
				} else {
					Dialog.message("whitelabelDomainNeeded_msg")
				}
			})
		}
	}

	addButtonClicked() {
		if (logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog(false)
		} else {
			ContactFormEditor.show(null, true, contactFormId => this.list.scrollToIdAndSelectWhenReceived(contactFormId))
		}
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, update => {
			return this.processUpdate(update)
		}).then(noOp)
	}

	processUpdate(update: EntityUpdateData): Promise<void> {
		const {instanceListId, instanceId, operation} = update

		if (isUpdateForTypeRef(ContactFormTypeRef, update) && this._listId.isLoaded() && instanceListId === this._listId.getLoaded()) {
			let promise

			if (!logins.getUserController().isGlobalAdmin() && update.operation !== OperationType.DELETE) {
				let listEntity = this.list.getEntity(instanceId)
				promise = locator.entityClient.load(ContactFormTypeRef, [neverNull(instanceListId), instanceId]).then(cf => {
					return getAdministratedGroupIds().then(allAdministratedGroupIds => {
						if (listEntity) {
							if (allAdministratedGroupIds.indexOf(cf.targetGroup) === -1) {
								return this.list.entityEventReceived(instanceId, OperationType.DELETE)
							} else {
								return this.list.entityEventReceived(instanceId, operation)
							}
						} else {
							if (allAdministratedGroupIds.indexOf(cf.targetGroup) !== -1) {
								return this.list.entityEventReceived(instanceId, OperationType.CREATE)
							}
						}
					})
				})
			} else {
				promise = this.list.entityEventReceived(instanceId, operation)
			}

			return promise.then(() => {
				if (
					this._customerInfo.isLoaded() &&
					getWhitelabelDomain(this._customerInfo.getLoaded()) &&
					this._settingsView.detailsViewer &&
					operation === OperationType.UPDATE &&
					isSameId(((this._settingsView.detailsViewer as any) as ContactFormViewer).contactForm._id, [neverNull(instanceListId), instanceId])
				) {
					return locator.entityClient.load(ContactFormTypeRef, [neverNull(instanceListId), instanceId]).then(updatedContactForm => {
						this._settingsView.detailsViewer = new ContactFormViewer(
							updatedContactForm,
							neverNull(getWhitelabelDomain(this._customerInfo.getLoaded())).domain,
							contactFormId => this.list.scrollToIdAndSelectWhenReceived(contactFormId),
						)
						m.redraw()
					})
				}
			})
		} else if (
			isUpdateForTypeRef(CustomerInfoTypeRef, update) &&
			this._customerInfo.isLoaded() &&
			isSameId(this._customerInfo.getLoaded()._id, [neverNull(instanceListId), instanceId]) &&
			operation === OperationType.UPDATE
		) {
			// a domain may have been added
			this._customerInfo.reset()

			return this._customerInfo.getAsync().then(noOp)
		} else if (isUpdateForTypeRef(CustomerTypeRef, update) && this._customerInfo.isLoaded() && operation === OperationType.UPDATE) {
			// the customer info may have been moved in case of premium upgrade/downgrade
			this._customerInfo.reset()

			return this._customerInfo.getAsync().then(noOp)
		} else {
			return Promise.resolve()
		}
	}
}

export class ContactFormRow implements VirtualRow<ContactForm> {
	top: number
	domElement: HTMLElement | null // set from List

	entity: ContactForm | null
	_domPageTitle: HTMLElement
	_domUrl: HTMLElement
	_domDeletedIcon: HTMLElement
	_customerInfo: LazyLoaded<CustomerInfo>

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

			if (whitelabelDomain) {
				this._domUrl.textContent = getContactFormUrl(whitelabelDomain.domain, contactForm.path)
			}
		}
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		let elements = [
			m(".top", [
				m(".name", {
					oncreate: vnode => (this._domPageTitle = vnode.dom as HTMLElement),
				}),
			]),
			m(".bottom.flex-space-between", [
				m("small.mail-address", {
					oncreate: vnode => (this._domUrl = vnode.dom as HTMLElement),
				}),
				m(".icons.flex", [
					m(Icon, {
						icon: Icons.Trash,
						oncreate: vnode => (this._domDeletedIcon = vnode.dom as HTMLElement),
						style: {
							display: "none",
						},
						class: "svg-list-accent-fg",
					}),
				]),
			]),
		]
		return elements
	}
}

export function filterContactFormsForLocalAdmin(contactForms: ContactForm[]): Promise<ContactForm[]> {
	if (logins.getUserController().isGlobalAdmin()) {
		return Promise.resolve(contactForms)
	} else {
		return getAdministratedGroupIds().then(allAdministratedGroupIds => {
			return contactForms.filter((cf: ContactForm) => allAdministratedGroupIds.indexOf(cf.targetGroup) !== -1)
		})
	}
}