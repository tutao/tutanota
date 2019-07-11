// @flow

import m from "mithril"
import {TextFieldN} from "./TextFieldN"
import {theme} from "../theme"
import {parseTime, timeStringFromParts} from "../../calendar/CalendarUtils"

export type Attrs = {
	value: Stream<string>,
	onselected: (string) => mixed,
	amPmFormat: boolean,
}

export class TimePicker implements MComponent<Attrs> {
	_values: $ReadOnlyArray<string>
	_focused: boolean;
	_previousSelectedIndex: number;
	_selectedIndex: number;

	constructor({attrs}: Vnode<Attrs>) {
		this._focused = false
		const times = []
		for (let hour = 0; hour < 24; hour++) {
			for (let minute = 0; minute < 60; minute += 30) {
				times.push(timeStringFromParts(hour, minute, attrs.amPmFormat))
			}
		}
		this._values = times
	}


	view({attrs}: Vnode<Attrs>) {
		const parsedTime = parseTime(attrs.value())
		if (parsedTime) {
			this._previousSelectedIndex = this._selectedIndex
			this._selectedIndex = this._values.indexOf(timeStringFromParts(parsedTime.hours, parsedTime.minutes, attrs.amPmFormat))
		}
		return [
			m(TextFieldN, {
				label: "emptyString_msg",
				value: attrs.value,
				onfocus: (dom, input) => {
					this._focused = true
					input.select()
				},
				onblur: (e) => {
					if (this._focused) {
						this._onSelected(attrs)
					}
					e.redraw = false
				},
				keyHandler: (key) => {
					if (key.keyCode === 13) {
						this._onSelected(attrs)
						document.activeElement && document.activeElement.blur()
					}
					return true
				},
			}),
			this._focused
				? m(".fixed.flex.col.mt-s", {
					oncreate: (vnode) => this._setScrollTop(attrs, vnode),
					onupdate: (vnode) => this._setScrollTop(attrs, vnode),
					style: {
						width: "100px",
						height: "400px",
						"z-index": "3",
						background: theme.content_bg,
						overflow: "auto",
						"box-shadow": "0 4px 5px 2px rgba(0,0,0,0.14), 0 4px 5px 2px rgba(0,0,0,0.14), 0 4px 5px 2px rgba(0,0,0,0.14)"
					},
				}, this._values.map((t, i) => m("pr-s.pl-s.darker-hover", {
					key: t,
					style: {
						"background-color": this._selectedIndex === i ? theme.list_bg : theme.list_alternate_bg,
						flex: "1 0 auto",
						"line-height": "44px"
					},
					onmousedown: () => {
						this._focused = false
						attrs.onselected(t)
					},
				}, t)))
				: null,
		]

	}

	_onSelected(attrs: Attrs) {
		this._focused = false
		const parsedTime = parseTime(attrs.value())
		const timeString = parsedTime && timeStringFromParts(parsedTime.hours, parsedTime.minutes, attrs.amPmFormat)
		attrs.onselected(timeString || attrs.value())
	}

	_setScrollTop(attrs: Attrs, vnode: VnodeDOM<Attrs>) {
		if (this._selectedIndex !== -1) {
			requestAnimationFrame(() => {
				vnode.dom.scrollTop = 44 * this._selectedIndex
			})
		}
	}
}
