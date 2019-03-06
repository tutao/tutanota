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
			m(".segmentControl.flex.center-horizontally.button-height",
				vnode.attrs.items.map(item => m(".segmentControlItem.flex.center-horizontally.center-vertically.text-ellipsis.small"
					+ (item.value === vnode.attrs.selectedValue()
						? ".segmentControl-border-active.content-accent-fg"
						: ".segmentControl-border"), {
					style: {
						flex: "0 1 " + ((typeof vnode.attrs.itemMaxWidth !== "undefined") ? px(vnode.attrs.itemMaxWidth) : px(120))
					},
					title: item.name,
					onclick: (event: MouseEvent) => {
						if (item.value !== vnode.attrs.selectedValue()) {
							vnode.attrs.selectedValue(item.value)
						}
					},
					oncreate: (vnode) => {
						//addFlash(vnode.dom)
					}
				}, item.name)))
		]
	}
}

export const SegmentControl: Class<MComponent<SegmentControlAttrs<any>>> = _SegmentControl