import m, {Children} from "mithril"
import stream from "mithril/stream"
import {ContactView} from "./ContactView"
import type {VirtualRow} from "../../gui/base/List"
import {List} from "../../gui/base/List"
import type {Contact} from "../../api/entities/tutanota/TypeRefs.js"
import {ContactTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {getContactListName} from "../model/ContactUtils"
import {lang} from "../../misc/LanguageViewModel"
import {NotFoundError} from "../../api/common/error/RestError"
import {size} from "../../gui/size"
import {locator} from "../../api/main/MainLocator"
import {GENERATED_MAX_ID} from "../../api/common/utils/EntityUtils"
import {ListColumnWrapper} from "../../gui/ListColumnWrapper"
import {DropDownSelectorN} from "../../gui/base/DropDownSelectorN"
import {compareContacts} from "./ContactGuiUtils"
import {ofClass} from "@tutao/tutanota-utils"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()
const className = "contact-list"

export class ContactListView {
	listId: Id
	contactView: ContactView
	list: List<Contact, ContactRow>
	view: (...args: Array<any>) => any
	oncreate: (...args: Array<any>) => any
	onbeforeremove: (...args: Array<any>) => any

	constructor(contactListId: Id, contactView: ContactView) {
		this.listId = contactListId
		this.contactView = contactView
		const sortByFirstName = stream(true)
		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: (startId, count) => {
				if (startId === GENERATED_MAX_ID) {
					return locator.contactModel.contactListId().then(contactListId => {
						if (!contactListId) return []
						// we have to load all contacts in order to sort them by name
						return locator.entityClient.loadAll(ContactTypeRef, contactListId).then(allContacts => {
							// we have to set loadedCompletely to make sure that fetch is never called again and also that new received contacts are inserted into the list, even at the end
							this._setLoadedCompletely()

							return allContacts
						})
					})
				} else {
					throw new Error("fetch contact called for specific start id")
				}
			},
			loadSingle: elementId => {
				return locator.entityClient
							  .load<Contact>(ContactTypeRef, [this.listId, elementId])
							  .catch(
								  ofClass(NotFoundError, () => {
									  // we return null if the entity does not exist
									  return null
								  }),
							  )
			},
			sortCompare: (c1, c2) => compareContacts(c1, c2, sortByFirstName()),
			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) =>
				contactView.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new ContactRow(),
			showStatus: false,
			className: className,
			swipe: {
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: listElement => Promise.resolve(false),
				swipeRight: listElement => Promise.resolve(false),
				enabled: false,
			},
			multiSelectionAllowed: true,
			emptyMessage: lang.get("noContacts_msg"),
		})

		this.view = (): Children => {
			return m(
				ListColumnWrapper,
				{
					headerContent: m(DropDownSelectorN, {
						label: "sortBy_label",
						selectedValue: sortByFirstName,
						items: [
							{
								name: lang.get("firstName_placeholder"),
								value: true,
							},
							{
								name: lang.get("lastName_placeholder"),
								value: false,
							},
						],
						class: "mt-m ml mb-xs",
						doShowBorder: false,
					}),
					padHorizontal: false,
				},
				m(this.list),
			)
		}

		let sortModeChangedListener: stream<unknown>

		this.oncreate = () => {
			sortModeChangedListener = sortByFirstName.map(() => this.list.sort())
		}

		this.onbeforeremove = () => {
			sortModeChangedListener.end(true)
		}
	}

	_setLoadedCompletely() {
		this.list.setLoadedCompletely()
	}
}

export class ContactRow implements VirtualRow<Contact> {
	top: number
	domElement: HTMLElement | null = null // set from List

	entity: Contact | null
	private _domName!: HTMLElement
	private _domAddress!: HTMLElement

	constructor() {
		this.top = 0
		this.entity = null
	}

	update(contact: Contact, selected: boolean): void {
		if (!this.domElement) {
			return
		}

		if (selected) {
			this.domElement.classList.add("row-selected")
		} else {
			this.domElement.classList.remove("row-selected")
		}

		this._domName.textContent = getContactListName(contact)
		this._domAddress.textContent = contact.mailAddresses && contact.mailAddresses.length > 0 ? contact.mailAddresses[0].address : ""
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		let elements = [
			m(".top", [
				m(".name.text-ellipsis", {
					oncreate: vnode => (this._domName = vnode.dom as HTMLElement),
				}),
			]),
			m(".bottom.flex-space-between", [
				m("small.mail-address", {
					oncreate: vnode => (this._domAddress = vnode.dom as HTMLElement),
				}),
			]),
		]
		return elements
	}
}