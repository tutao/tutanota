import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { TextField, TextFieldType as TextFieldType } from "../../../../common/gui/base/TextField.js"
import { theme } from "../../../../common/gui/theme.js"
import { client } from "../../../../common/misc/ClientDetector.js"
import { Keys, TimeFormat } from "../../../../common/api/common/TutanotaConstants.js"
import { timeStringFromParts } from "../../../../common/misc/Formatter.js"
import { Time } from "../../../../common/calendar/date/Time.js"
import { isKeyPressed } from "../../../../common/misc/KeyManager.js"

export type TimePickerAttrs = {
	time: Time | null
	onTimeSelected: (arg0: Time | null) => unknown
	timeFormat: TimeFormat
	disabled?: boolean
}

export class TimePicker implements Component<TimePickerAttrs> {
	private values: ReadonlyArray<string>
	private focused: boolean
	private selectedIndex!: number
	private oldValue: string
	private value: string
	private readonly amPm: boolean

	constructor({ attrs }: Vnode<TimePickerAttrs>) {
		this.focused = false
		this.value = ""
		this.amPm = attrs.timeFormat === TimeFormat.TWELVE_HOURS
		const times: string[] = []

		for (let hour = 0; hour < 24; hour++) {
			for (let minute = 0; minute < 60; minute += 30) {
				times.push(timeStringFromParts(hour, minute, this.amPm))
			}
		}
		this.oldValue = attrs.time?.toString(false) ?? "--"
		this.values = times
	}

	view({ attrs }: Vnode<TimePickerAttrs>): Children {
		if (attrs.time) {
			const timeAsString = attrs.time?.toString(this.amPm) ?? ""
			this.selectedIndex = this.values.indexOf(timeAsString)

			if (!this.focused) {
				this.value = timeAsString
			}
		}

		if (client.isMobileDevice()) {
			return this.renderNativeTimePicker(attrs)
		} else {
			return this.renderCustomTimePicker(attrs)
		}
	}

	private renderNativeTimePicker(attrs: TimePickerAttrs): Children {
		if (this.oldValue !== attrs.time?.toString(false)) {
			this.onSelected(attrs)
		}

		// input[type=time] wants time in 24h format, no matter what is actually displayed. Otherwise it will be empty.
		const timeAsString = attrs.time?.toString(false) ?? ""
		this.oldValue = timeAsString

		this.value = timeAsString

		const displayTime = attrs.time?.toString(this.amPm) ?? ""

		return [
			m(TextField, {
				class: "time-picker pt",
				label: "emptyString_msg",
				value: this.value,
				type: TextFieldType.Time,
				oninput: (value) => {
					if (this.value === value) {
						return
					}
					this.value = value
					attrs.onTimeSelected(Time.parseFromString(value))
				},
				disabled: attrs.disabled,
			}),
			// A 'fake' display that overlays over the real time input that allows us to show 12 or 24 time format regardless of browser locale
			m(".time-picker-fake-display.rel.no-hover", displayTime),
		]
	}

	private renderCustomTimePicker(attrs: TimePickerAttrs): Children {
		return [this.renderInputField(attrs), this.focused ? this.renderTimeSelector(attrs) : null]
	}

	private renderInputField(attrs: TimePickerAttrs): Children {
		return m(TextField, {
			label: "emptyString_msg",
			value: this.value,
			oninput: (v) => (this.value = v),
			disabled: attrs.disabled,
			onfocus: (dom, input) => {
				this.focused = true
				input.select()
			},
			onblur: (e) => {
				if (this.focused) {
					this.onSelected(attrs)
				}

				e.redraw = false
			},
			keyHandler: (key) => {
				if (isKeyPressed(key.key, Keys.RETURN)) {
					this.onSelected(attrs)
					const active = document.activeElement as HTMLElement | null
					active?.blur()
				}

				return true
			},
		})
	}

	private renderTimeSelector(attrs: TimePickerAttrs): Children {
		return m(
			".fixed.flex.col.mt-s.menu-shadow",
			{
				oncreate: (vnode) => this.setScrollTop(attrs, vnode),
				onupdate: (vnode) => this.setScrollTop(attrs, vnode),
				style: {
					width: "100px",
					height: "400px",
					"z-index": "3",
					background: theme.content_bg,
					overflow: "auto",
				},
			},
			this.values.map((time, i) =>
				m(
					"pr-s.pl-s.darker-hover",
					{
						key: time,
						style: {
							"background-color": this.selectedIndex === i ? theme.list_bg : theme.list_alternate_bg,
							flex: "1 0 auto",
							"line-height": "44px",
						},
						onmousedown: () => {
							this.focused = false
							attrs.onTimeSelected(Time.parseFromString(time))
						},
					},
					time,
				),
			),
		)
	}

	private onSelected(attrs: TimePickerAttrs) {
		this.focused = false

		attrs.onTimeSelected(Time.parseFromString(this.value))
	}

	private setScrollTop(attrs: TimePickerAttrs, vnode: VnodeDOM<TimePickerAttrs>) {
		if (this.selectedIndex !== -1) {
			requestAnimationFrame(() => {
				vnode.dom.scrollTop = 44 * this.selectedIndex
			})
		}
	}
}
