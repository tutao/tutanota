import m, { Children, Component, Vnode } from "mithril"
import { LegacyTextField, LegacyTextFieldType as TextFieldType } from "../../../../../ui/base/LegacyTextField.js"
import { theme } from "../../../../../ui/theme.js"
import { EnvProvider, TabIndex, TimeFormat } from "@tutao/app-env"
import { Time } from "../../../../common/calendar/date/Time.js"
import { Select, SelectAttributes } from "../../../../../ui/base/Select.js"
import { SingleLineTextField, SingleLineTextFieldAttrs } from "../../../../../ui/base/SingleLineTextField.js"
import { font_size, px, size } from "../../../../../ui/size.js"
import stream from "mithril/stream"
import { isKeyPressed } from "../../../../../ui/utils/KeyManager.js"
import { getNextHalfHour } from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import { DateTime } from "luxon"
import { lang, Translation } from "../../../../../ui/utils/LanguageViewModel"
import { Keys } from "../../../../../ui/utils/KeyboardKeys"

export type TimePickerAttrs = {
	time: Time | null
	onTimeSelected: (timeString: string | null) => unknown
	timeFormat: TimeFormat
	disabled?: boolean
	valid?: boolean
	invalidMessage?: Translation
	ariaLabel: Translation
	classes?: Array<string>
	renderAsTextField: boolean
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

	constructor({ attrs }: Vnode<TimePickerAttrs>) {
		this.focused = false
		this.value = ""
		const times: string[] = []

		for (let hour = 0; hour < 24; hour++) {
			for (let minute = 0; minute < 60; minute += 30) {
				times.push(this.getTimeStringInFormatFromAttrs(new Time(hour, minute), attrs))
			}
		}
		this.oldValue = attrs.time?.to24HourString() ?? "--"
		this.values = times
	}

	view({ attrs }: Vnode<TimePickerAttrs>): Children {
		if (attrs.time && !this.focused) {
			this.value = this.getTimeStringInFormatFromAttrs(attrs.time, attrs)
		}

		if (EnvProvider.get().isApp()) {
			return this.renderNativeTimePicker(attrs)
		} else {
			return this.renderCustomTimePicker(attrs)
		}
	}

	private renderNativeTimePicker(attrs: TimePickerAttrs): Children {
		// input[type=time] wants time in 24h format, no matter what is actually displayed. Otherwise it will be empty.
		const timeAsString = attrs.time?.to24HourString() ?? ""
		this.oldValue = timeAsString
		this.value = timeAsString

		let displayTime: string | undefined
		if (attrs.time) {
			displayTime = this.getTimeStringInFormatFromAttrs(attrs.time, attrs)
		}

		if (attrs.renderAsTextField) {
			return this.renderTextFieldNativeTimePicker(displayTime, attrs)
		}

		return m(".rel", [
			m("input.fill-absolute.invisible.tutaui-button-outline", {
				disabled: attrs.disabled,
				type: TextFieldType.Time,
				style: {
					zIndex: 1,
					border: `2px solid ${attrs.valid ? theme.outline : theme.on_error_container}`,
					width: "auto",
					height: "auto",
					appearance: "none",
					opacity: attrs.disabled ? 0.7 : 1.0,
				},
				value: this.value,
				oninput: (event: InputEvent) => {
					this.focused = true
					const inputValue = (event.target as HTMLInputElement).value
					if (this.value === inputValue) {
						return
					}
					this.value = inputValue
					attrs.onTimeSelected(inputValue)
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

	private renderTextFieldNativeTimePicker(displayTime: string | undefined, attrs: TimePickerAttrs) {
		return m(".rel.full-width", [
			m(LegacyTextField, {
				class: "time-picker pt-16",
				label: attrs.ariaLabel,
				value: this.value,
				type: TextFieldType.Time,
				oninput: (value) => {
					if (this.value === value) {
						return
					}
					this.value = value
					attrs.onTimeSelected(value)
				},
				disabled: attrs.disabled,
			}),
			// A 'fake' display that overlays over the real time input that allows us to show 12 or 24 time format regardless of browser locale
			m(".time-picker-fake-display.rel.no-hover", displayTime),
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
				attrs.onTimeSelected(this.value)
				m.redraw.sync()
			},
			onclose: () => {
				this.isExpanded = false
			},
			selected: { value: this.value, name: this.value, ariaValue: this.value },
			ariaLabel: lang.getTranslationText(attrs.ariaLabel),
			disabled: attrs.disabled,
			options: stream(options),
			noIcon: true,
			expanded: true,
			tabIndex: Number(TabIndex.Programmatic),
			renderDisplay: () => (attrs.renderAsTextField ? this.renderTextFieldCustomTextPicker(attrs) : this.renderTimeSelectInput(attrs)),
			renderOption: (option) => this.renderTimeOptions(option, option.value === this.getTargetHour(this.value), option.value === this.value),
		} satisfies SelectAttributes<TimeOption, string>)
	}

	private getTargetHour(currentTime: string): string {
		let time = Time.parseFromString(currentTime)
		if (time) {
			time = Time.fromDateTime({ hour: time.hour, minute: time.minute === 30 ? 30 : 0 } as DateTime)
		} else {
			time = Time.fromDate(getNextHalfHour())
		}
		return time.to24HourString()
	}

	private renderTimeSelectInput(attrs: TimePickerAttrs) {
		return m(SingleLineTextField, {
			classes: [...(attrs.classes ?? []), "tutaui-button-outline", "text-center", "border-content-message-bg"],
			value: this.value,
			oninput: (val: string) => {
				this.value = val
			},
			disabled: attrs.disabled,
			valid: attrs.valid,
			invalidMessage: attrs.invalidMessage,
			ariaLabel: attrs.ariaLabel,
			style: {
				textAlign: "center",
				fontSize: px(font_size.smaller),
			},
			onclick: (e: MouseEvent) => {
				e.stopImmediatePropagation()
				if (!this.isExpanded) {
					;(e.target as HTMLElement).parentElement?.click()
					this.isExpanded = true
				}
			},
			onkeydown: (e: KeyboardEvent) => {
				if (isKeyPressed(e.key, Keys.RETURN)) {
					const active = document.activeElement as HTMLElement | null
					active?.blur()

					this.focused = false
					attrs.onTimeSelected(this.value)

					e.preventDefault()
					e.stopPropagation()
				}
			},
			onfocus: () => {
				this.focused = true
			},
			onblur: (e: any) => {
				if (this.focused) {
					this.focused = false
					attrs.onTimeSelected(this.value)
				}
				e.redraw = false
			},
			type: TextFieldType.Text,
		} satisfies SingleLineTextFieldAttrs<TextFieldType.Text>)
	}

	private renderTextFieldCustomTextPicker(attrs: TimePickerAttrs): Children {
		return m(LegacyTextField, {
			style: {
				width: "100%",
				fontSize: px(font_size.smaller),
			},
			label: attrs.ariaLabel,
			value: this.value,
			oninput: (val: string) => {
				this.value = val
			},
			onclick: (e: MouseEvent) => {
				e.stopImmediatePropagation()
				if (!this.isExpanded) {
					;(e.target as HTMLElement).parentElement?.click()
					this.isExpanded = true
				}
				m.redraw.sync()
			},
			disabled: attrs.disabled,
			onfocus: () => {
				this.focused = true
			},
			onblur: (e) => {
				if (this.focused) {
					this.focused = false
					attrs.onTimeSelected(this.value)
				}

				e.redraw = false
			},
			keyHandler: (key) => {
				if (isKeyPressed(key.key, Keys.RETURN)) {
					const active = document.activeElement as HTMLElement | null
					active?.blur()

					this.focused = false
					attrs.onTimeSelected(this.value)
				}

				return true
			},
		})
	}

	private getTimeStringInFormatFromAttrs(time: Time, attrs: TimePickerAttrs) {
		if (attrs.timeFormat === TimeFormat.TWELVE_HOURS) {
			return time.to12HourString(true)
		} else {
			return time.to24HourString()
		}
	}
}
