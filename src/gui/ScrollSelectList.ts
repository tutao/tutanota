import m, {Children, Component, Vnode, VnodeDOM} from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {Icon} from "./base/Icon"
import {Icons} from "./base/icons/Icons"
import type {MaybeLazy} from "@tutao/tutanota-utils"
import {resolveMaybeLazy} from "@tutao/tutanota-utils"

export type ScrollSelectListAttrs<T> = {
	items: ReadonlyArray<T>
	selectedItem: Stream<T | null>
	emptyListMessage: MaybeLazy<TranslationKey>
	width: number
	renderItem: (arg0: T) => Children
	onItemDoubleClicked: (arg0: T) => unknown
}

export class ScrollSelectList<T> implements Component<ScrollSelectListAttrs<T>> {
	_handleSelectionMapping: Stream<void>
	_selectedItem: T | null

	constructor(vnode: Vnode<ScrollSelectListAttrs<T>>) {
		this._handleSelectionMapping = stream()
	}

	view(vnode: Vnode<ScrollSelectListAttrs<T>>): Children {
		const a = vnode.attrs
		return m(
			".flex.flex-column.scroll-no-overlay",
			{
				oncreate: vnode => {
					this._handleSelectionMapping = a.selectedItem.map(selection => {
						// Ensures that redraw happens after selected item changed this guarantess that the selected item is focused correctly.
						// Selecting the correct item in the list requires that the (possible filtered) list needs render first and then we
						// can scroll to the new selected item. Therefore we call onSelectionChange in onupdate callback.
						m.redraw()
					})
				},
				onremove: vnode => {
					this._handleSelectionMapping.end(true)
				},
			},
			a.items.length > 0
				? a.items.map(item => this.renderRow(item, vnode))
				: m(".row-selected.text-center.pt", lang.get(resolveMaybeLazy(a.emptyListMessage))),
		)
	}

	onupdate(vnode: VnodeDOM<ScrollSelectListAttrs<T>>) {
		const newSelectedItem = vnode.attrs.selectedItem()

		if (newSelectedItem !== this._selectedItem) {
			this._onSelectionChanged(newSelectedItem, vnode.attrs.items, vnode.dom as HTMLElement)
		}
	}

	renderRow(item: T, vnode: Vnode<ScrollSelectListAttrs<T>>): Children {
		const a = vnode.attrs
		const isSelected = a.selectedItem() === item
		return m(
			".flex.flex-column.click",
			{
				style: {
					maxWidth: a.width,
				},
			},
			[
				m(
					".flex.template-list-row" + (isSelected ? ".row-selected" : ""),
					{
						onclick: (e: MouseEvent) => {
							a.selectedItem(item)
							e.stopPropagation()
						},
						ondblclick: (e: MouseEvent) => {
							a.selectedItem(item)
							a.onItemDoubleClicked(item)
							e.stopPropagation()
						},
					},
					[
						a.renderItem(item),
						isSelected
							? m(Icon, {
								icon: Icons.ArrowForward,
								style: {
									marginTop: "auto",
									marginBottom: "auto",
								},
							})
							: m("", {
								style: {
									width: "17.1px",
									height: "16px",
								},
							}),
					],
				),
			],
		)
	}

	_onSelectionChanged(selectedItem: T | null, items: ReadonlyArray<T>, scrollDom: HTMLElement) {
		this._selectedItem = selectedItem
		if (selectedItem != null) {
			const selectedIndex = items.indexOf(selectedItem)

			if (selectedIndex !== -1) {
				const selectedDomElement = scrollDom.children.item(selectedIndex)

				if (selectedDomElement) {
					selectedDomElement.scrollIntoView({
						block: "nearest",
						inline: "nearest",
					})
				}
			}
		}
	}
}