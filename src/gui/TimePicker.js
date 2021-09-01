// @flow

import m from "mithril"
import stream from "mithril/stream/stream.js"
import {TextFieldN, Type as TextFieldType} from "./base/TextFieldN"
import {theme} from "./theme"
import {client} from "../misc/ClientDetector"
import {Keys} from "../api/common/TutanotaConstants"
import {timeStringFromParts} from "../misc/Formatter"
import {parseTime} from "../misc/parsing/TimeParser";
import {Time} from "../api/common/utils/Time"

export type Attrs = {
	value: ?Time,
	onselected: (?Time) => mixed,
	amPmFormat: boolean,
	disabled?: boolean
}

export class TimePicker implements MComponent<Attrs> {
	_values: $ReadOnlyArray<string>
	_focused: boolean;
	_previousSelectedIndex: number;
	_selectedIndex: number;
	_oldValue: string;
	_value: Stream<string>;

	constructor({attrs}: Vnode<Attrs>) {
		this._focused = false
		this._value = stream("")
		const times = []
		for (let hour = 0; hour < 24; hour++) {
			for (let minute = 0; minute < 60; minute += 30) {
				times.push(timeStringFromParts(hour, minute, attrs.amPmFormat))
			}
		}
		this._values = times
	}


	view({attrs}: Vnode<Attrs>): Children {
		const value = attrs.value
		const valueAsString = value?.to24HourString() ?? ""
		if (value) {
			this._previousSelectedIndex = this._selectedIndex
			this._selectedIndex = this._values.indexOf(valueAsString)
			if (!this._focused) {
				this._value(valueAsString)
			}
		}
		if (client.isMobileDevice()) {
			if (this._oldValue !== attrs.value) {
				this._onSelected(attrs)
			}

			this._oldValue = valueAsString
			this._value(valueAsString)
			return m(TextFieldN, {
				label: "emptyString_msg",
				// input[type=time] wants value in 24h format, no matter what is actually displayed. Otherwise it will be empty.
				value: this._value,
				type: TextFieldType.Time,
				oninput: (value) => {
					this._value(value)
					attrs.onselected(parseTime(value))
				},
				disabled: attrs.disabled
			})
		}

		return [
			m(TextFieldN, {
				label: "emptyString_msg",
				value: this._value,
				disabled: attrs.disabled,
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
					if (key.keyCode === Keys.RETURN.code) {
						this._onSelected(attrs)
						document.activeElement && document.activeElement.blur()
					}
					return true
				},
			}),
			this._focused
				? m(".fixed.flex.col.mt-s.menu-shadow", {
					oncreate: (vnode) => this._setScrollTop(attrs, vnode),
					onupdate: (vnode) => this._setScrollTop(attrs, vnode),
					style: {
						width: "100px",
						height: "400px",
						"z-index": "3",
						background: theme.content_bg,
						overflow: "auto",

					},
				}, this._values.map((time, i) => m("pr-s.pl-s.darker-hover", {
					key: time,
					style: {
						"background-color": this._selectedIndex === i ? theme.list_bg : theme.list_alternate_bg,
						flex: "1 0 auto",
						"line-height": "44px"
					},
					onmousedown: () => {
						this._focused = false
						attrs.onselected(parseTime(time))
					},
				}, time)))
				: null,
		]

	}

	_onSelected(attrs: Attrs) {
		this._focused = false
		const value = this._value()

		attrs.onselected(parseTime(value))
	}

	_setScrollTop(attrs: Attrs, vnode: VnodeDOM<Attrs>) {
		if (this._selectedIndex !== -1) {
			requestAnimationFrame(() => {
				vnode.dom.scrollTop = 44 * this._selectedIndex
			})
		}
	}
}
