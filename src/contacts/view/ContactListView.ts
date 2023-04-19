import m, { Children } from "mithril"
import { ContactView } from "./ContactView"
import type { VirtualRow } from "../../gui/base/List"
import { List } from "../../gui/base/List"
import type { Contact } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { getContactListName } from "../model/ContactUtils"
import { lang } from "../../misc/LanguageViewModel"
import { NotFoundError } from "../../api/common/error/RestError"
import { px, size } from "../../gui/size"
import { locator } from "../../api/main/MainLocator"
import { GENERATED_MAX_ID } from "../../api/common/utils/EntityUtils"
import { ListColumnWrapper } from "../../gui/ListColumnWrapper"
import { compareContacts } from "./ContactGuiUtils"
import { NBSP, ofClass } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../../api/common/Env"
import { IconButton } from "../../gui/base/IconButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { createDropdown } from "../../gui/base/Dropdown.js"
import { SelectableRowContainer, setSelectedRowStyle } from "../../gui/SelectableRowContainer.js"
import { styles } from "../../gui/styles.js"

assertMainOrNode()
const className = "contact-list"

export class ContactListView {
	readonly listId: Id
	readonly contactView: ContactView
	readonly list: List<Contact, ContactRow>
	private sortByFirstName = true

	constructor(contactListId: Id, contactView: ContactView) {
		this.listId = contactListId
		this.contactView = contactView
		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: async (startId, count) => {
				if (startId === GENERATED_MAX_ID) {
					const contactListId = await locator.contactModel.contactListId()
					if (contactListId == null) return { items: [], complete: true }
					const allContacts = await locator.entityClient.loadAll(ContactTypeRef, contactListId)
					return { items: allContacts, complete: true }
				} else {
					throw new Error("fetch contact called for specific start id")
				}
			},
			loadSingle: (elementId) => {
				return locator.entityClient.load<Contact>(ContactTypeRef, [this.listId, elementId]).catch(
					ofClass(NotFoundError, () => {
						// we return null if the entity does not exist
						return null
					}),
				)
			},
			sortCompare: (c1, c2) => compareContacts(c1, c2, this.sortByFirstName),
			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) =>
				contactView.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new ContactRow((entity) => this.list.toggleMultiSelectForEntity(entity)),
			className: className,
			swipe: {
				renderLeftSpacer: () => [],
				renderRightSpacer: () => [],
				swipeLeft: (listElement) => Promise.resolve(false),
				swipeRight: (listElement) => Promise.resolve(false),
				enabled: false,
			},
			multiSelectionAllowed: true,
			emptyMessage: lang.get("noContacts_msg"),
		})

		// old style components lose "this" ref easily
		this.view = this.view.bind(this)
	}

	view(): Children {
		return m(
			ListColumnWrapper,
			{
				headerContent: this.renderToolbar(),
			},
			m(this.list),
		)
	}

	private renderToolbar(): Children {
		return m(".flex.pt-xs.pb-xs.items-center.flex-space-between.pr-s.list-border-bottom", [
			// matching ContactRow spacing here
			m(
				".flex.items-center.pl-s.mlr",
				{
					style: {
						height: px(size.button_height),
					},
				},
				this.renderSelectAll(),
			),
			m(IconButton, {
				title: "sortBy_label",
				icon: Icons.ListOrdered,
				click: (e: MouseEvent, dom: HTMLElement) => {
					createDropdown({
						lazyButtons: () => [
							{
								label: "firstName_placeholder",
								click: () => {
									this.sortByFirstName = true
									this.list.sort()
								},
							},
							{
								label: "lastName_placeholder",
								click: () => {
									this.sortByFirstName = false
									this.list.sort()
								},
							},
						],
					})(e, dom)
				},
			}),
		])
	}

	private renderSelectAll(): Children {
		if (styles.isSingleColumnLayout()) {
			return null
		} else {
			const selectedEntities = this.list.getSelectedEntities()
			return m("input.checkbox", {
				type: "checkbox",
				// I'm not sure this is the best condition but it will do for now
				checked: selectedEntities.length > 0 && selectedEntities.length === this.list.getLoadedEntities().length && this.list.isMultiSelectionActive(),
				onchange: (e: Event) => {
					const checkbox = e.target as HTMLInputElement
					if (checkbox.checked) {
						this.list.selectAll()
					} else {
						this.list.selectNone()
					}
				},
			})
		}
	}
}

export class ContactRow implements VirtualRow<Contact> {
	top: number
	domElement: HTMLElement | null = null // set from List

	entity: Contact | null
	private innerContainerDom!: HTMLElement
	private domName!: HTMLElement
	private domAddress!: HTMLElement
	private checkboxDom!: HTMLInputElement

	constructor(private readonly onSelected: (entity: Contact, selected: boolean) => unknown) {
		this.top = 0
		this.entity = null
	}

	update(contact: Contact, selected: boolean, isInMultiSelect: boolean): void {
		if (!this.domElement) {
			return
		}

		setSelectedRowStyle(this.innerContainerDom, styles.isSingleColumnLayout() ? isInMultiSelect && selected : selected)
		this.updateCheckboxVisibility()
		this.checkboxDom.checked = selected && isInMultiSelect

		this.domName.textContent = getContactListName(contact)
		this.domAddress.textContent = contact.mailAddresses && contact.mailAddresses.length > 0 ? contact.mailAddresses[0].address : NBSP
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		return m(
			SelectableRowContainer,
			{
				oncreate: (vnode) => {
					this.innerContainerDom = vnode.dom as HTMLElement
				},
			},
			m(".mt-xs.mr", [
				m("input.checkbox", {
					type: "checkbox",
					onclick: (e: MouseEvent) => {
						e.stopPropagation()
						// e.redraw = false
					},
					onchange: () => {
						this.entity && this.onSelected(this.entity, this.checkboxDom.checked)
					},
					oncreate: (vnode) => {
						this.checkboxDom = vnode.dom as HTMLInputElement
						// to avoid visual bugs until the update
						this.updateCheckboxVisibility()
					},
				}),
			]),
			m(".flex.col.overflow-hidden", [
				m(".text-ellipsis.badge-line-height", {
					oncreate: (vnode) => (this.domName = vnode.dom as HTMLElement),
				}),
				m(".text-ellipsis.smaller", {
					oncreate: (vnode) => (this.domAddress = vnode.dom as HTMLElement),
				}),
			]),
		)
	}

	private updateCheckboxVisibility() {
		this.checkboxDom.style.visibility = styles.isSingleColumnLayout() ? "hidden" : ""
	}
}
