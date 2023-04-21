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
import { NBSP, noOp, ofClass } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../../api/common/Env"
import {
	checkboxOpacity,
	scaleXHide,
	scaleXShow,
	selectableRowAnimParams,
	SelectableRowContainer,
	SelectableRowSelectedSetter,
	shouldAlwaysShowMultiselectCheckbox,
} from "../../gui/SelectableRowContainer.js"

assertMainOrNode()
const className = "contact-list"

export class ContactListView {
	readonly listId: Id
	readonly contactView: ContactView
	readonly list: List<Contact, ContactRow>
	sortByFirstName = true

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
				headerContent: null,
			},
			m(this.list),
		)
	}
}

const shiftByForCheckbox = px(size.checkbox_size + size.hpad)
const translateXShow = `translateX(${shiftByForCheckbox})`
const translateXHide = "translateX(0)"

export class ContactRow implements VirtualRow<Contact> {
	top: number
	domElement: HTMLElement | null = null // set from List

	entity: Contact | null
	private selectionUpdater!: SelectableRowSelectedSetter
	private domName!: HTMLElement
	private domAddress!: HTMLElement
	private checkboxDom!: HTMLInputElement
	private checkboxWasVisible = shouldAlwaysShowMultiselectCheckbox()

	constructor(private readonly onSelected: (entity: Contact, selected: boolean) => unknown) {
		this.top = 0
		this.entity = null
	}

	update(contact: Contact, selected: boolean, isInMultiSelect: boolean): void {
		if (!this.domElement) {
			return
		}

		this.selectionUpdater(selected, isInMultiSelect)
		this.showCheckboxAnimated(shouldAlwaysShowMultiselectCheckbox() || isInMultiSelect)
		checkboxOpacity(this.checkboxDom, selected)
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
					Promise.resolve().then(() => this.showCheckbox(shouldAlwaysShowMultiselectCheckbox()))
				},
				onSelectedChangeRef: (updater) => (this.selectionUpdater = updater),
			},
			m(".mt-xs.abs", [
				m("input.checkbox.list-checkbox", {
					type: "checkbox",
					style: {
						transformOrigin: "left",
					},
					onclick: (e: MouseEvent) => {
						e.stopPropagation()
						// e.redraw = false
					},
					onchange: () => {
						this.entity && this.onSelected(this.entity, this.checkboxDom.checked)
					},
					oncreate: (vnode) => {
						this.checkboxDom = vnode.dom as HTMLInputElement
						checkboxOpacity(this.checkboxDom, false)
					},
				}),
			]),
			m(".flex.col.overflow-hidden.flex-grow", [
				m(".text-ellipsis.badge-line-height", {
					oncreate: (vnode) => (this.domName = vnode.dom as HTMLElement),
				}),
				m(".text-ellipsis.smaller.mt-xxs", {
					oncreate: (vnode) => (this.domAddress = vnode.dom as HTMLElement),
				}),
			]),
		)
	}

	private showCheckboxAnimated(show: boolean) {
		if (this.checkboxWasVisible === show) return
		if (show) {
			this.domName.style.paddingRight = shiftByForCheckbox
			this.domAddress.style.paddingRight = shiftByForCheckbox

			const nameAnim = this.domName.animate({ transform: [translateXHide, translateXShow] }, selectableRowAnimParams)
			const addressAnim = this.domAddress.animate({ transform: [translateXHide, translateXShow] }, selectableRowAnimParams)
			const checkboxAnim = this.checkboxDom.animate({ transform: [scaleXHide, scaleXShow] }, selectableRowAnimParams)

			Promise.all([nameAnim.finished, addressAnim.finished, checkboxAnim.finished]).then(() => {
				nameAnim.cancel()
				addressAnim.cancel()
				checkboxAnim.cancel()
				this.showCheckbox(show)
			}, noOp)
		} else {
			this.domName.style.paddingRight = "0"
			this.domAddress.style.paddingRight = "0"

			const nameAnim = this.domName.animate({ transform: [translateXShow, translateXHide] }, selectableRowAnimParams)
			const addressAnim = this.domAddress.animate({ transform: [translateXShow, translateXHide] }, selectableRowAnimParams)
			const checkboxAnim = this.checkboxDom.animate({ transform: [scaleXShow, scaleXHide] }, selectableRowAnimParams)

			Promise.all([nameAnim.finished, addressAnim.finished, checkboxAnim.finished]).then(() => {
				nameAnim.cancel()
				addressAnim.cancel()
				checkboxAnim.cancel()
				this.showCheckbox(show)
			}, noOp)
		}
		this.checkboxWasVisible = show
	}

	private showCheckbox(show: boolean) {
		let translate
		let scale
		let padding
		if (show) {
			translate = translateXShow
			scale = scaleXShow
			padding = shiftByForCheckbox
		} else {
			translate = translateXHide
			scale = scaleXHide
			padding = "0"
		}

		this.domAddress.style.transform = translate
		this.domName.style.transform = translate
		this.domAddress.style.paddingRight = padding
		this.domName.style.paddingRight = padding
		this.checkboxDom.style.transform = scale
	}
}
