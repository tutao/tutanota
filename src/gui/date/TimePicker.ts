import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { TextField, TextFieldType as TextFieldType } from "../base/TextField.js"
import { theme } from "../theme.js"
import { client } from "../../misc/ClientDetector.js"
import { Keys, TimeFormat } from "../../api/common/TutanotaConstants.js"
import { timeStringFromParts } from "../../misc/Formatter.js"
import { Time } from "../../calendar/date/Time.js"

export type TimePickerAttrs = {
	time: Time | null
	onTimeSelected: (arg0: Time | null) => unknown
	timeFormat: TimeFormat
	disabled?: boolean
}

export class TimePicker implements Component<TimePickerAttrs> {
	private _values: ReadonlyArray<string>
	private _focused: boolean
	private _selectedIndex!: number
	private _oldValue: string
	private _value: string
	private amPm: boolean

	constructor({ attrs }: Vnode<TimePickerAttrs>) {
		this._focused = false
		this._value = ""
		this.amPm = attrs.timeFormat === TimeFormat.TWELVE_HOURS
		const times: string[] = []

		for (let hour = 0; hour < 24; hour++) {
			for (let minute = 0; minute < 60; minute += 30) {
				times.push(timeStringFromParts(hour, minute, this.amPm))
			}
		}
		this._oldValue = attrs.time?.toString(false) ?? "--"
		this._values = times
	}

	view({ attrs }: Vnode<TimePickerAttrs>): Children {
		if (attrs.time) {
			const timeAsString = attrs.time?.toString(this.amPm) ?? ""
			this._selectedIndex = this._values.indexOf(timeAsString)

			if (!this._focused) {
				this._value = timeAsString
			}
		}

		if (client.isMobileDevice()) {
			return this._renderNativeTimePicker(attrs)
		} else {
			return this._renderCustomTimePicker(attrs)
		}
	}

	_renderNativeTimePicker(attrs: TimePickerAttrs): Children {
		if (this._oldValue !== attrs.time?.toString(false)) {
			this._onSelected(attrs)
		}

		// input[type=time] wants time in 24h format, no matter what is actually displayed. Otherwise it will be empty.
		const timeAsString = attrs.time?.toString(false) ?? ""
		this._oldValue = timeAsString

		this._value = timeAsString

		return m(TextField, {
			label: "emptyString_msg",
			value: this._value,
			type: TextFieldType.Time,
			oninput: (value) => {
				if (this._value === value) {
					return
				}
				this._value = value
				attrs.onTimeSelected(Time.parseFromString(value))
			},
			disabled: attrs.disabled,
		})
	}

	_renderCustomTimePicker(attrs: TimePickerAttrs): Children {
		return [this._renderInputField(attrs), this._focused ? this._renderTimeSelector(attrs) : null]
	}

	_renderInputField(attrs: TimePickerAttrs): Children {
		return m(TextField, {
			label: "emptyString_msg",
			value: this._value,
			oninput: (v) => (this._value = v),
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
				if (key.key === Keys.RETURN.code) {
					this._onSelected(attrs)
					const active = document.activeElement as HTMLElement | null
					active?.blur()
				}

				return true
			},
		})
	}

	_renderTimeSelector(attrs: TimePickerAttrs): Children {
		return m(
			".fixed.flex.col.mt-s.menu-shadow",
			{
				oncreate: (vnode) => this._setScrollTop(attrs, vnode),
				onupdate: (vnode) => this._setScrollTop(attrs, vnode),
				style: {
					width: "100px",
					height: "400px",
					"z-index": "3",
					background: theme.content_bg,
					overflow: "auto",
				},
			},
			this._values.map((time, i) =>
				m(
					"pr-s.pl-s.darker-hover",
					{
						key: time,
						style: {
							"background-color": this._selectedIndex === i ? theme.list_bg : theme.list_alternate_bg,
							flex: "1 0 auto",
							"line-height": "44px",
						},
						onmousedown: () => {
							this._focused = false
							attrs.onTimeSelected(Time.parseFromString(time))
						},
					},
					time,
				),
			),
		)
	}

	_onSelected(attrs: TimePickerAttrs) {
		this._focused = false

		attrs.onTimeSelected(Time.parseFromString(this._value))
	}

	_setScrollTop(attrs: TimePickerAttrs, vnode: VnodeDOM<TimePickerAttrs>) {
		if (this._selectedIndex !== -1) {
			requestAnimationFrame(() => {
				vnode.dom.scrollTop = 44 * this._selectedIndex
			})
		}
	}
}
