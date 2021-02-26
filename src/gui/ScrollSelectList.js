// @flow

import m from "mithril"
import stream from "mithril/stream/stream.js"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {Icon} from "./base/Icon"
import {Icons} from "./base/icons/Icons"
import type {MaybeLazy} from "../api/common/utils/Utils"
import {resolveMaybeLazy} from "../api/common/utils/Utils"

export type ScrollSelectListAttrs<T> = {
	items: MaybeLazy<$ReadOnlyArray<T>>,
	selectedItem: Stream<?T>,
	emptyListMessage: MaybeLazy<TranslationKey>,
	itemHeight: number,
	width: number,
	renderItem: (T) => Children,
	onItemDoubleClicked: T => mixed
}

export class ScrollSelectList<T> implements MComponent<ScrollSelectListAttrs<T>> {

	handleSelectionMapping: Stream<void>
	scrollDom: HTMLElement

	constructor(vnode: Vnode<ScrollSelectListAttrs<T>>) {
		this.handleSelectionMapping = stream()
	}

	view(vnode: Vnode<ScrollSelectListAttrs<T>>): Children {
		const a = vnode.attrs
		const items = resolveMaybeLazy(a.items)
		return m(".flex.flex-column.scroll",
			{
				oncreate: vnode => {
					this.scrollDom = vnode.dom
					this.handleSelectionMapping = a.selectedItem.map(selection => {
						const selectedIndex = selection
							? resolveMaybeLazy(a.items).indexOf(selection)
							: -1

						if (selectedIndex !== -1) {
							this.onSelectionChanged(selectedIndex, a.itemHeight)
						}
					})
				},
				onbeforeremove: vnode => {
					this.handleSelectionMapping.end(true)
				}
			},
			items.length > 0
				? items.map(item => this.renderRow(item, vnode))
				: m(".row-selected.text-center.pt", lang.get(resolveMaybeLazy(a.emptyListMessage))))
	}

	renderRow(item: T, vnode: Vnode<ScrollSelectListAttrs<T>>): Children {
		const a = vnode.attrs
		const isSelected = a.selectedItem() === item
		return m(".flex.flex-column.click", {
				style: {
					maxWidth: a.width
				},
			}, [
				m(".flex.template-list-row" + (isSelected ? ".row-selected" : ""),
					{
						onclick: (e) => {
							a.selectedItem(item)
							m.redraw()
							e.stopPropagation()
						},
						ondblclick: (e) => {
							a.selectedItem(item)
							a.onItemDoubleClicked(item)
							e.stopPropagation()
						}
					}, [
						a.renderItem(item),
						isSelected
							? m(Icon, {
								icon: Icons.ArrowForward,
								style: {marginTop: "auto", marginBottom: "auto"}
							})
							: m("", {style: {width: "17.1px", height: "16px"}}),
					]
				)
			]
		)
	}

	onSelectionChanged(selectedIndex: number, entryHeight: number) {

		const scrollWindowHeight = this.scrollDom.getBoundingClientRect().height
		const scrollOffset = this.scrollDom.scrollTop

		// Actual position in the list
		const selectedTop = entryHeight * selectedIndex
		const selectedBottom = selectedTop + entryHeight

		// Relative to the top of the scroll window
		const selectedRelativeTop = selectedTop - scrollOffset
		const selectedRelativeBottom = selectedBottom - scrollOffset

		// clamp the selected item to stay between the top and bottom of the scroll window
		if (selectedRelativeTop < 0) {
			this.scrollDom.scrollTop = selectedTop
		} else if (selectedRelativeBottom > scrollWindowHeight) {
			this.scrollDom.scrollTop = selectedBottom - scrollWindowHeight
		}
	}
}

export function makeListSelectionChangedScrollHandler(scrollDom: HTMLElement, entryHeight: number, getSelectedEntryIndex: lazy<number>): () => void {
	return function () {
		const selectedIndex = getSelectedEntryIndex()

		const scrollWindowHeight = scrollDom.getBoundingClientRect().height
		const scrollOffset = scrollDom.scrollTop

		// Actual position in the list
		const selectedTop = entryHeight * selectedIndex
		const selectedBottom = selectedTop + entryHeight

		// Relative to the top of the scroll window
		const selectedRelativeTop = selectedTop - scrollOffset
		const selectedRelativeBottom = selectedBottom - scrollOffset

		// clamp the selected item to stay between the top and bottom of the scroll window
		if (selectedRelativeTop < 0) {
			scrollDom.scrollTop = selectedTop
		} else if (selectedRelativeBottom > scrollWindowHeight) {
			scrollDom.scrollTop = selectedBottom - scrollWindowHeight
		}
	}
}

