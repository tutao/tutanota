import m, { Children, ClassComponent, Component, CVnode, CVnodeDOM, Vnode, VnodeDOM } from "mithril"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import { Icon } from "./base/Icon"
import { Icons } from "./base/icons/Icons"
import type { MaybeLazy } from "@tutao/tutanota-utils"
import { resolveMaybeLazy } from "@tutao/tutanota-utils"

export type ScrollSelectListAttrs<T> = {
	items: ReadonlyArray<T>
	selectedItem: T | null
	onItemSelected: (item: T) => unknown
	emptyListMessage: MaybeLazy<TranslationKey>
	width: number
	renderItem: (item: T) => Children
	onItemDoubleClicked: (item: T) => unknown
}

export class ScrollSelectList<T> implements ClassComponent<ScrollSelectListAttrs<T>> {
	private selectedItem: T | null = null

	view(vnode: CVnode<ScrollSelectListAttrs<T>>): Children {
		const a = vnode.attrs
		return m(
			".flex.flex-column.scroll-no-overlay",
			a.items.length > 0
				? a.items.map((item) => this.renderRow(item, vnode))
				: m(".row-selected.text-center.pt", lang.get(resolveMaybeLazy(a.emptyListMessage))),
		)
	}

	onupdate(vnode: CVnodeDOM<ScrollSelectListAttrs<T>>) {
		const newSelectedItem = vnode.attrs.selectedItem

		if (newSelectedItem !== this.selectedItem) {
			this._onSelectionChanged(newSelectedItem, vnode.attrs.items, vnode.dom as HTMLElement)
			// Ensures that redraw happens after selected item changed this guarantess that the selected item is focused correctly.
			// Selecting the correct item in the list requires that the (possible filtered) list needs render first and then we
			// can scroll to the new selected item. Therefore we call onSelectionChange in onupdate callback.
			m.redraw()
		}
	}

	renderRow(item: T, vnode: Vnode<ScrollSelectListAttrs<T>>): Children {
		const a = vnode.attrs
		const isSelected = a.selectedItem === item
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
							a.onItemSelected(item)
							e.stopPropagation()
						},
						ondblclick: (e: MouseEvent) => {
							a.onItemSelected(item)
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
		this.selectedItem = selectedItem
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
