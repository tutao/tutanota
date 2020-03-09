//@flow
import m from "mithril"
import {assertMainOrNode} from "../../api/Env"
import {addFlash} from "./Flash"
import {px} from "../size"

assertMainOrNode()

export type SegmentControlItem<T> = {
	name: string,
	value: T
}

export class SegmentControl<T> {
	view: Function;
	selectedValue: Stream<SegmentControlItem<T>>;
	_items: SegmentControlItem<T>[];
	_changeHandler: handler<SegmentControlItem<T>>;

	constructor(items: SegmentControlItem<T>[], selectedValue: Stream<SegmentControlItem<T>>, itemMaxWidth: number = 120) {
		this._items = items
		this.selectedValue = selectedValue
		this.view = () => {
			return [
				m(".segmentControl.flex-center.button-height",
					this._items.map(item => m("button.segmentControlItem.flex-center.items-center.text-ellipsis.small"
						+ (item === this.selectedValue() ?
							".segmentControl-border-active.content-accent-fg" : ".segmentControl-border"), {
						style: {
							flex: "0 1 " + px(itemMaxWidth)
						},
						title: item.name,
						onclick: (event: MouseEvent) => {
							if (item !== this.selectedValue()) {
								if (this._changeHandler) {
									this._changeHandler(item)
								} else {
									this.selectedValue(item)
									m.redraw()
								}
							}
						},
						oncreate: (vnode) => {
							addFlash(vnode.dom)
						}
					}, item.name)))
			]
		}
	}

	/**
	 * The handler is invoked with the new selected value. The displayed selected value is not changed automatically,
	 * but the handler is responsible for updating this selected value.
	 */
	setSelectionChangedHandler(handler: handler<SegmentControlItem<T>>): SegmentControl<T> {
		this._changeHandler = handler
		return this
	}
}