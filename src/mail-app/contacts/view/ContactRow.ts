import { Contact } from "../../../common/api/entities/tutanota/TypeRefs.js"
import {
	checkboxOpacity,
	scaleXHide,
	scaleXShow,
	selectableRowAnimParams,
	SelectableRowContainer,
	SelectableRowSelectedSetter,
} from "../../../common/gui/SelectableRowContainer.js"
import { getContactListName } from "../../../common/contactsFunctionality/ContactUtils.js"
import { NBSP, noOp } from "@tutao/tutanota-utils"
import m, { Children } from "mithril"
import { px, size } from "../../../common/gui/size.js"
import { VirtualRow } from "../../../common/gui/base/ListUtils.js"

export const shiftByForCheckbox = px(size.checkbox_size + size.hpad)
export const translateXShow = `translateX(${shiftByForCheckbox})`
export const translateXHide = "translateX(0)"

export class ContactRow implements VirtualRow<Contact> {
	top: number
	domElement: HTMLElement | null = null // set from List

	entity: Contact | null
	private selectionUpdater!: SelectableRowSelectedSetter
	private domName!: HTMLElement
	private domAddress!: HTMLElement
	private checkboxDom!: HTMLInputElement
	private checkboxWasVisible: boolean = this.shouldShowCheckbox()

	constructor(private readonly onSelected: (entity: Contact, selected: boolean) => unknown, private readonly shouldShowCheckbox: () => boolean) {
		this.top = 0
		this.entity = null
	}

	update(contact: Contact, selected: boolean, isInMultiSelect: boolean): void {
		this.entity = contact
		this.selectionUpdater(selected, isInMultiSelect)
		this.showCheckboxAnimated(this.shouldShowCheckbox() || isInMultiSelect)
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
					Promise.resolve().then(() => this.showCheckbox(this.shouldShowCheckbox()))
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
			this.checkboxDom.style.display = ""

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
		// Stop the hidden checkbox from entering the tab index
		this.checkboxDom.style.display = show ? "" : "none"
	}
}
