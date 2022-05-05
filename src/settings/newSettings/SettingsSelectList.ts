import m, {Children, Component, Vnode} from "mithril";
import stream from "mithril/stream/";
import type {TranslationKey} from "../../misc/LanguageViewModel";
import {lang} from "../../misc/LanguageViewModel";
import Stream from "mithril/stream"
import {SettingsSection} from "./SettingsModel"

export interface SettingsSelectListAttrs<T> {
	items: Array<T>;
	selectedItem: Stream<T | null>;
	emptyListMessage: TranslationKey;
	renderItem: (arg0: T) => Children;
}

export class SettingsSelectList implements Component<SettingsSelectListAttrs<SettingsSection>> {
	_handleSelectionMapping: Stream<void>;

	constructor() {
		this._handleSelectionMapping = stream();
	}

	view({attrs}: Vnode<SettingsSelectListAttrs<SettingsSection>>): Children {
		return m(".flex.flex-column.fill-absolute.list-bg.scroll.setting-list-alternate-colors", {
			oncreate: vnode => {
				this._handleSelectionMapping = vnode.attrs.selectedItem.map((selection: SettingsSection | null) => {
					// Ensures that redraw happens after selected item changed this guarantess that the selected item is focused correctly.
					// Selecting the correct item in the list requires that the (possible filtered) list needs render first and then we
					// can scroll to the new selected item. Therefore we call onSelectionChange in onupdate callback.
					m.redraw();
				});
			},
			onremove: vnode => {
				this._handleSelectionMapping.end(true);
			}
		}, attrs.items.length > 0 ? attrs.items.map(item => this.renderRow(attrs, item)) : m(".row-selected.text-center.pt", lang.get(attrs.emptyListMessage)));
	}

	onupdate() {// const newSelectedItem = vnode.attrs.selectedItem()
		// if (newSelectedItem !== this._selectedItem) {
		// 	this._onSelectionChanged(newSelectedItem, vnode.attrs.items, vnode.dom)
		// }
	}

	private renderRow(attrs: SettingsSelectListAttrs<SettingsSection>, item: SettingsSection): Children {
		const isSelected = attrs.selectedItem() === item;
		return m(".flex.flex-column.no-shrink.center-horizontally.click.settings-list-row" + (isSelected ? ".row-selected" : ""), {
			onclick: (e: {stopPropagation: () => void;}) => {
				attrs.selectedItem(item);
				e.stopPropagation();
			}
		}, attrs.renderItem(item));
	} // _onSelectionChanged(selectedItem: ?T, items: $ReadOnlyArray<T>, scrollDom: HTMLElement) {
	// 	this._selectedItem = selectedItem
	// 	const selectedIndex = items.indexOf(selectedItem)
	// 	if (selectedIndex !== -1) {
	// 		const selectedDomElement = scrollDom.children.item(selectedIndex)
	// 		if (selectedDomElement) {
	// 			selectedDomElement.scrollIntoView({block: "nearest", inline: "nearest"})
	// 		}
	// 	}
	// }
}