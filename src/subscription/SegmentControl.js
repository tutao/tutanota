//@flow
import m from "mithril"
//import {addFlash} from "./Flash"
import {px} from "../gui/size"

export type SegmentControlItem<T> = {
	name: string,
	value: T
}

export type SegmentControlAttrs<T> = {|
	selectedValue: Stream<T>;
	items: SegmentControlItem<T>[];
	itemMaxWidth?: number;
|}


class _SegmentControl<T> {
	view(vnode: Vnode<SegmentControlAttrs<T>>) {
		return [
			m(".segmentControl.flex.center-horizontally.button-height", {
				role: "tablist",
			}, vnode.attrs.items.map(item => m("button.segmentControlItem.flex.center-horizontally.center-vertically.text-ellipsis.small"
				+ (item.value === vnode.attrs.selectedValue()
					? ".segmentControl-border-active.content-accent-fg"
					: ".segmentControl-border"), {
				style: {
					flex: "0 1 " + ((typeof vnode.attrs.itemMaxWidth !== "undefined") ? px(vnode.attrs.itemMaxWidth) : px(120))
				},
				title: item.name,
				role: "tab",
				"aria-selected": String(item.value === vnode.attrs.selectedValue()),
				onclick: () => this._onSelected(item, vnode.attrs),
			}, item.name)))
		]
	}

	_onSelected(item: SegmentControlItem<T>, attrs: SegmentControlAttrs<T>) {
		if (item.value !== attrs.selectedValue()) {
			attrs.selectedValue(item.value)
		}
	}
}

export const SegmentControl: Class<MComponent<SegmentControlAttrs<any>>> = _SegmentControl