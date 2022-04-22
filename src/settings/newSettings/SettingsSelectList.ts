import m from "mithril";
import stream from "mithril/stream/stream.js";
import type { TranslationKey } from "../../misc/LanguageViewModel";
import { lang } from "../../misc/LanguageViewModel";
export type SettingsSelectListAttrs<T> = {
  items: Array<T>;
  selectedItem: Stream<T | null | undefined>;
  emptyListMessage: TranslationKey;
  renderItem: (arg0: T) => Children;
};
export class SettingsSelectList<T> implements MComponent<SettingsSelectListAttrs<T>> {
  _handleSelectionMapping: Stream<void>;
  _selectedItem: T | null | undefined;

  constructor(vnode: Vnode<SettingsSelectListAttrs<T>>) {
    this._handleSelectionMapping = stream();
  }

  view(vnode: Vnode<SettingsSelectListAttrs<T>>): Children {
    const a = vnode.attrs;
    return m(".flex.flex-column.fill-absolute.list-bg.scroll.setting-list-alternate-colors", {
      oncreate: vnode => {
        this._handleSelectionMapping = a.selectedItem.map(selection => {
          // Ensures that redraw happens after selected item changed this guarantess that the selected item is focused correctly.
          // Selecting the correct item in the list requires that the (possible filtered) list needs render first and then we
          // can scroll to the new selected item. Therefore we call onSelectionChange in onupdate callback.
          m.redraw();
        });
      },
      onremove: vnode => {
        this._handleSelectionMapping.end(true);
      }
    }, a.items.length > 0 ? a.items.map(item => this.renderRow(item, vnode)) : m(".row-selected.text-center.pt", lang.get(a.emptyListMessage)));
  }

  onupdate(vnode: Vnode<SettingsSelectListAttrs<T>>) {// const newSelectedItem = vnode.attrs.selectedItem()
    // if (newSelectedItem !== this._selectedItem) {
    // 	this._onSelectionChanged(newSelectedItem, vnode.attrs.items, vnode.dom)
    // }
  }

  renderRow(item: T, vnode: Vnode<SettingsSelectListAttrs<T>>): Children {
    const a = vnode.attrs;
    const isSelected = a.selectedItem() === item;
    return m(".flex.flex-column.no-shrink.center-horizontally.click.settings-list-row" + (isSelected ? ".row-selected" : ""), {
      onclick: e => {
        a.selectedItem(item);
        e.stopPropagation();
      }
    }, a.renderItem(item));
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