// @flow
import m from "mithril"
import {List} from "../gui/base/List"
import {load, loadAll} from "../api/main/Entity"
import {GENERATED_MAX_ID, TypeRef, isSameTypeRef, isSameId} from "../api/common/EntityFunctions"
import {assertMainOrNode} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import {NotFoundError} from "../api/common/error/RestError"
import {size} from "../gui/size"
import {SettingsView} from "./SettingsView"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {ContactFormViewer, getContactFormUrl} from "./ContactFormViewer"
import * as ContactFormEditor from "./ContactFormEditor"
import {ContactFormTypeRef} from "../api/entities/tutanota/ContactForm"
import {neverNull, getBrandingDomain} from "../api/common/utils/Utils"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {logins} from "../api/main/LoginController"
import {Dialog} from "../gui/base/Dialog"
import type {OperationTypeEnum} from "../api/common/TutanotaConstants"
import {OperationType} from "../api/common/TutanotaConstants"
import {Icon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {CustomerContactFormGroupRootTypeRef} from "../api/entities/tutanota/CustomerContactFormGroupRoot"
import {getDefaultContactFormLanguage, getAdministratedGroupIds} from "../contacts/ContactFormUtils"

assertMainOrNode()

const className = "group-list"

export class ContactFormListView {
	list: List<ContactForm, ContactFormRow>;
	view: Function;
	_listId: LazyLoaded<Id>;
	_customerInfo: LazyLoaded<CustomerInfo>;
	_settingsView: SettingsView;

	constructor(settingsView: SettingsView) {
		this._settingsView = settingsView

		this._listId = new LazyLoaded(() => {
			return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
				return load(CustomerContactFormGroupRootTypeRef, customer.customerGroup).then(root => root.contactForms)
			})
		})
		this._customerInfo = new LazyLoaded(() => {
			return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
				.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
		})
		this._customerInfo.getAsync() // trigger loading so it is available later

		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: (startId, count) => {
				if (startId === GENERATED_MAX_ID) {
					return this._listId.getAsync().then(listId => {
						return loadAll(ContactFormTypeRef, listId).then(contactForms => {
							// we have to set loadedCompletely to make sure that fetch is never called again and also that new contact forms are inserted into the list, even at the end
							this._setLoadedCompletely();

							// we return all contact forms because we have already loaded all contact forms and the scroll bar shall have the complete size.
							if (logins.getUserController().isGlobalAdmin()) {
								return contactForms
							} else {
								return getAdministratedGroupIds().then(allAdministratedGroupIds => {
									return contactForms.filter((cf: ContactForm) =>
										allAdministratedGroupIds.indexOf(cf.targetGroup) !== -1)
								})
							}
						})
					})
				} else {
					throw new Error("fetch user group infos called for specific start id")
				}
			},
			loadSingle: (elementId) => {
				return this._listId.getAsync().then(listId => {
					return load(ContactFormTypeRef, [listId, elementId]).catch(NotFoundError, (e) => {
						// we return null if the entity does not exist
					})
				})
			},
			sortCompare: (a: ContactForm, b: ContactForm) => a.path.localeCompare(b.path),

			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) => this.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new ContactFormRow(this._customerInfo),
			showStatus: false,
			className: className,
			swipe: ({
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: (listElement) => {
					return Promise.resolve()
				},
				swipeRight: (listElement) => {
					return Promise.resolve()
				},
			}: any),
			elementsDraggable: false,
			multiSelectionAllowed: false,
			emptyMessage: lang.get("noEntries_msg")
		})

		this.view = (): Vnode<any> => {
			return m(this.list)
		}

		this.list.loadInitial()
	}

	_setLoadedCompletely() {
		this.list.setLoadedCompletely();
	}

	elementSelected(contactForms: ContactForm[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (contactForms.length === 0 && this._settingsView.detailsViewer) {
			this._settingsView.detailsViewer = null
			m.redraw()
		} else if (contactForms.length === 1 && selectionChanged) {
			this._customerInfo.getAsync().then(customerInfo => {
				let brandingDomain = getBrandingDomain(customerInfo)
				if (brandingDomain) {
					this._settingsView.detailsViewer = new ContactFormViewer(contactForms[0], brandingDomain, contactFormId => this.list.scrollToIdAndSelectWhenReceived(contactFormId))
					if (elementClicked) {
						this._settingsView.focusSettingsDetailsColumn()
					}
					m.redraw()
				} else {
					Dialog.error("whitelabelDomainNeeded_msg")
				}
			})
		}
	}

	addButtonClicked() {
		ContactFormEditor.show(null, true, contactFormId => this.list.scrollToIdAndSelectWhenReceived(contactFormId))
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, ContactFormTypeRef) && this._listId.isLoaded()
			&& listId === this._listId.getLoaded()) {
			if (!logins.getUserController().isGlobalAdmin()) {
				let listEntity = this.list.getEntity(elementId)
				load(ContactFormTypeRef, [neverNull(listId), elementId]).then(cf => {
					return getAdministratedGroupIds().then(allAdministratedGroupIds => {
						if (listEntity) {
							if (allAdministratedGroupIds.indexOf(cf.targetGroup) === -1) {
								this.list.entityEventReceived(elementId, OperationType.DELETE)
							} else {
								this.list.entityEventReceived(elementId, operation)
							}
						} else {
							if (allAdministratedGroupIds.indexOf(cf.targetGroup) !== -1) {
								this.list.entityEventReceived(elementId, OperationType.CREATE)
							}
						}
					})
				})
			} else {
				this.list.entityEventReceived(elementId, operation)
			}
			if (this._customerInfo.isLoaded() && getBrandingDomain(this._customerInfo.getLoaded())
				&& this._settingsView.detailsViewer && operation === OperationType.UPDATE
				&& isSameId(((this._settingsView.detailsViewer: any): ContactFormViewer).contactForm._id, [
					neverNull(listId), elementId
				])) {
				load(ContactFormTypeRef, [neverNull(listId), elementId]).then(updatedContactForm => {
					this._settingsView.detailsViewer = new ContactFormViewer(updatedContactForm, neverNull(getBrandingDomain(this._customerInfo.getLoaded())), contactFormId => this.list.scrollToIdAndSelectWhenReceived(contactFormId))
					m.redraw()
				})
			}
		} else if (isSameTypeRef(typeRef, CustomerInfoTypeRef) && this._customerInfo.isLoaded()
			&& isSameId(this._customerInfo.getLoaded()._id, [neverNull(listId), elementId])
			&& operation === OperationType.UPDATE) {
			// a domain may have been added
			this._customerInfo.reset()
			this._customerInfo.getAsync()
		} else if (isSameTypeRef(typeRef, CustomerTypeRef) && this._customerInfo.isLoaded()
			&& operation === OperationType.UPDATE) {
			// the customer info may have been moved in case of premium upgrade/downgrade
			this._customerInfo.reset()
			this._customerInfo.getAsync()
		}
	}
}


export class ContactFormRow {
	top: number;
	domElement: HTMLElement; // set from List
	entity: ?ContactForm;
	_domPageTitle: HTMLElement;
	_domUrl: HTMLElement;
	_domDeletedIcon: HTMLElement;

	_customerInfo: LazyLoaded<CustomerInfo>;

	constructor(customerInfo: LazyLoaded<CustomerInfo>) {
		this.top = 0
		this.entity = null

		this._customerInfo = customerInfo
	}

	update(contactForm: ContactForm, selected: boolean): void {
		if (selected) {
			this.domElement.classList.add("row-selected")
		} else {
			this.domElement.classList.remove("row-selected")
		}

		this._domPageTitle.textContent = getDefaultContactFormLanguage(contactForm.languages).pageTitle
		if (this._customerInfo.isLoaded() && getBrandingDomain(this._customerInfo.getLoaded())) {
			this._domUrl.textContent = getContactFormUrl(neverNull(getBrandingDomain(this._customerInfo.getLoaded())), contactForm.path)
		}
		if (contactForm.deleted) {
			this._domDeletedIcon.style.display = ''
		} else {
			this._domDeletedIcon.style.display = 'none'
		}
	}


	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		let elements = [
			m(".top", [
				m(".name", {oncreate: (vnode) => this._domPageTitle = vnode.dom}),
			]),
			m(".bottom.flex-space-between", [
				m("small.mail-address", {oncreate: (vnode) => this._domUrl = vnode.dom}),
				m(".icons.flex", [
					m(Icon, {
						icon: Icons.Trash,
						oncreate: (vnode) => this._domDeletedIcon = vnode.dom,
						style: {display: 'none'},
						class: "svg-list-accent-fg"
					}),
				])
			])
		]
		return elements
	}
}
