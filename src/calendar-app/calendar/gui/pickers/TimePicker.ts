import m, { Children, Component, Vnode } from "mithril"
import { TextFieldType as TextFieldType } from "../../../../common/gui/base/TextField.js"
import { theme } from "../../../../common/gui/theme.js"
import { Keys, TabIndex, TimeFormat } from "../../../../common/api/common/TutanotaConstants.js"
import { timeStringFromParts } from "../../../../common/misc/Formatter.js"
import { Time } from "../../../../common/calendar/date/Time.js"
import { Select, SelectAttributes } from "../../../../common/gui/base/Select.js"
import { SingleLineTextField } from "../../../../common/gui/base/SingleLineTextField.js"
import { isApp } from "../../../../common/api/common/Env.js"
import { px, size } from "../../../../common/gui/size.js"
import stream from "mithril/stream"
import { isKeyPressed } from "../../../../common/misc/KeyManager.js"
import { getNextHalfHour } from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import { DateTime } from "luxon"

export type TimePickerAttrs = {
	time: Time | null
	onTimeSelected: (arg0: Time | null) => unknown
	timeFormat: TimeFormat
	disabled?: boolean
	ariaLabel: string
	classes?: Array<string>
}

interface TimeOption {
	value: string
	ariaValue: string
	name: string
}

export class TimePicker implements Component<TimePickerAttrs> {
	private values: ReadonlyArray<string>
	private focused: boolean
	private isExpanded: boolean = false
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

			if (!this.focused) {
				this.value = timeAsString
			}
		}

		if (isApp()) {
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

		const displayTime = attrs.time?.toString(this.amPm)

		return m(".rel", [
			m("input.fill-absolute.invisible.tutaui-button-outline", {
				disabled: attrs.disabled,
				type: TextFieldType.Time,
				style: {
					zIndex: 1,
					border: `2px solid ${theme.outline}`,
					width: "auto",
					height: "auto",
					appearance: "none",
					opacity: attrs.disabled ? 0.7 : 1.0,
				},
				value: this.value,
				oninput: (event: InputEvent) => {
					const inputValue = (event.target as HTMLInputElement).value
					if (this.value === inputValue) {
						return
					}
					this.value = inputValue
					attrs.onTimeSelected(Time.parseFromString(inputValue))
				},
			}),
			m(
				".tutaui-button-outline",
				{
					class: attrs.classes?.join(" "),
					style: {
						zIndex: "2",
						position: "inherit",
						borderColor: "transparent",
						pointerEvents: "none",
						padding: `${px(size.spacing_8)} 0`,
						opacity: attrs.disabled ? 0.7 : 1.0,
					},
				},
				displayTime,
			),
		])
	}

	private renderTimeOptions(option: TimeOption, isTarget: boolean, isSelected: boolean) {
		return m(
			"button.items-center.flex-grow",
			{
				...(isTarget ? { "data-target": "true" } : {}),
				...(isSelected ? { "aria-selected": "true" } : {}),
				class: "state-bg button-content dropdown-button pt-8 pb-8 button-min-height" + (isSelected ? "content-accent-fg row-selected icon-accent" : ""),
			},
			option.name,
		)
	}

	private renderCustomTimePicker(attrs: TimePickerAttrs): Children {
		const options = this.values.map((time) => ({
			value: time,
			name: time,
			ariaValue: time,
		}))

		return m(Select<TimeOption, string>, {
			onchange: (newValue) => {
				if (this.value === newValue.value) {
					return
				}

				this.value = newValue.value
				this.onSelected(attrs)
				m.redraw.sync()
			},
			onclose: () => {
				this.isExpanded = false
			},
			selected: { value: this.value, name: this.value, ariaValue: this.value },
			ariaLabel: attrs.ariaLabel,
			disabled: attrs.disabled,
			options: stream(options),
			noIcon: true,
			expanded: true,
			tabIndex: Number(TabIndex.Programmatic),
			renderDisplay: () => this.renderTimeSelectInput(attrs),
			renderOption: (option) => this.renderTimeOptions(option, option.value === this.getTargetHour(this.value), option.value === this.value),
		} satisfies SelectAttributes<TimeOption, string>)
	}

	private getTargetHour(currentTime: string): string {
		const time = Time.parseFromString(currentTime)?.toObject()

		if (!time) {
			return Time.fromDate(getNextHalfHour()).toString(false)
		}
		return Time.fromDateTime({ hour: time.hours, minute: time.minutes === 30 ? 30 : 0 } as DateTime).toString(false)
	}

	private renderTimeSelectInput(attrs: TimePickerAttrs) {
		return m(SingleLineTextField, {
			classes: [...(attrs.classes ?? []), "tutaui-button-outline", "text-center", "border-content-message-bg"],
			value: this.value,
			oninput: (val: string) => {
				if (this.value === val) {
					return
				}

				this.value = val
			},
			disabled: attrs.disabled,
			ariaLabel: attrs.ariaLabel,
			style: {
				textAlign: "center",
			},
			onclick: (e: MouseEvent) => {
				e.stopImmediatePropagation()
				if (!this.isExpanded) {
					;(e.target as HTMLElement).parentElement?.click()
					this.isExpanded = true
				}
			},
			onfocus: () => {
				this.focused = true
			},
			onkeydown: (e: KeyboardEvent) => {
				if (isKeyPressed(e.key, Keys.RETURN) && !this.isExpanded) {
					this.focused = true
					;(e.target as HTMLElement).parentElement?.click()
					this.isExpanded = true
					m.redraw.sync()
				}
			},
			onblur: (e: any) => {
				if (this.focused) {
					this.onSelected(attrs)
				}

				e.redraw = false
			},
			type: TextFieldType.Text,
		})
	}

	private onSelected(attrs: TimePickerAttrs) {
		this.focused = false

		attrs.onTimeSelected(Time.parseFromString(this.value))
	}
}
