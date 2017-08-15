// @flow
import m from "mithril"
import {List} from "../gui/base/List"
import {load} from "../api/main/Entity"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {ContactView} from "./ContactView"
import {GENERATED_MAX_ID} from "../api/common/EntityFunctions"
import {compareContacts} from "./ContactUtils"
import {assertMainOrNode} from "../api/Env"
import {worker} from "../api/main/WorkerClient"
import {lang} from "../misc/LanguageViewModel"
import {NotFoundError} from "../api/common/error/RestError"
import {size} from "../gui/size"

assertMainOrNode()

const className = "contact-list"

export class ContactListView {
	listId: Id;
	contactView: ContactView;
	list: List<Contact, ContactRow>;
	view: Function;

	constructor(contactListId: Id, contactView: ContactView) {
		this.listId = contactListId
		this.contactView = contactView
		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: (startId, count) => {
				if (startId == GENERATED_MAX_ID) {
					return worker.getContactController().lazyContacts.getAsync().then(allContacts => {
						// we have to set loadedCompletely to make sure that fetch is never called again and  also that new received contacts are inserted into the list, even at the end
						this._setLoadedCompletely();

						// we return all contacts because we have already loaded all contacts and the scroll bar shall have the complete size.
						return Promise.resolve(allContacts);

					})
				} else {
					throw new Error("fetch contact called for specific start id")
				}
			},
			loadSingle: (elementId) => {
				return load(ContactTypeRef, [this.listId, elementId]).catch(NotFoundError, (e) => {
					// we return null if the entity does not exist
				})
			},
			sortCompare: compareContacts,

			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) => contactView.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new ContactRow(),
			showStatus: false,
			className: className,
			swipe: {
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: () => {
				},
				swipeRight: () => {
				},
			},
			elementsDraggable: false,
			multiSelectionAllowed: false,
			emptyMessage: lang.get("noContacts_msg")
		})

		this.view = (): VirtualElement => {
			return m(this.list)
		}
	}

	_setLoadedCompletely() {
		this.list.setLoadedCompletely();
	}
}

export class ContactRow {
	top: number;
	domElement: HTMLElement; // set from List
	entity: ?Contact;
	_domName: HTMLElement;
	_domAddress: HTMLElement;

	constructor() {
		this.top = 0
		this.entity = null
	}

	update(contact: Contact, selected: boolean): void {
		if (selected) {
			this.domElement.classList.add("row-selected")
		} else {
			this.domElement.classList.remove("row-selected")
		}

		this._domName.textContent = contact.firstName + " " + contact.lastName
		this._domAddress.textContent = (contact.mailAddresses && contact.mailAddresses.length > 0) ? contact.mailAddresses[0].address : ""
	}


	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		let elements = [
			m(".top", [
				m(".name", {oncreate: (vnode) => this._domName = vnode.dom}),
			]),
			m(".bottom.flex-space-between", [
				m("small.mail-address", {oncreate: (vnode) => this._domAddress = vnode.dom}),
			])
		]
		return elements
	}
}
