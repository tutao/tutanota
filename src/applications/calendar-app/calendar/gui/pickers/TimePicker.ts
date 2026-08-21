import m, { ChildArray, Children, Component, Vnode } from "mithril"
import { LegacyTextFieldAttrs, LegacyTextField, LegacyTextFieldType as TextFieldType } from "../../../../../ui/base/LegacyTextField.js"
import { EnvProvider, TabIndex, TimeFormat } from "@tutao/app-env"
import { Time } from "../../../../common/calendar/date/Time.js"
import { Select, SelectAttributes } from "../../../../../ui/base/Select.js"
import { SingleLineTextField, SingleLineTextFieldAttrs } from "../../../../../ui/base/SingleLineTextField.js"
import { font_size, px } from "../../../../../ui/size.js"
import stream from "mithril/stream"
import { isKeyPressed } from "../../../../../ui/utils/KeyManager.js"
import { lang, Translation } from "../../../../../ui/utils/LanguageViewModel"
import { Keys } from "../../../../../ui/utils/KeyboardKeys"

export type TimePickerAttrs = {
	time: Time
	onTimeSelected: (time: Time) => unknown
	timeFormat: TimeFormat
	disabled?: boolean
	valid?: boolean
	ariaLabel: Translation
	classes?: Array<string>
	forMailSendTime: boolean
}

interface TimeOption {
	value: Time
	ariaValue: string
	name: string
}

export class TimePicker implements Component<TimePickerAttrs> {
	private selectedTime: Time
	private timeDropdownOptions: TimeOption[] = []
	private inputText: string = ""
	private inputTextIsValid: boolean = true
	private inputIsFocused: boolean = false

	constructor({ attrs }: Vnode<TimePickerAttrs>) {
		this.selectedTime = attrs.time
		this.setValidInputTextFromTime(this.selectedTime, attrs)

		for (let hour = 0; hour < 24; hour++) {
			for (let minute = 0; minute < 60; minute += 30) {
				this.timeDropdownOptions.push(this.createTimeOption(new Time(hour, minute), attrs))
			}
		}
	}

	view({ attrs }: Vnode<TimePickerAttrs>): Children {
		if (!this.inputIsFocused) {
			this.setValidInputTextFromTime(attrs.time, attrs)
		}

		return m(Select<TimeOption, Time>, {
			classes: ["overflow-visible"],
			onchange: (timeOption) => {
				this.inputText = timeOption.name
				this.selectedTime = timeOption.value
				this.inputTextIsValid = true
				attrs.onTimeSelected(this.selectedTime)
			},
			selected: this.createTimeOption(this.selectedTime, attrs),
			ariaLabel: lang.getTranslationText(attrs.ariaLabel),
			disabled: attrs.disabled,
			options: stream(this.timeDropdownOptions),
			noIcon: true,
			expanded: true,
			tabIndex: Number(TabIndex.Programmatic),
			renderDisplay: () => this.renderInputFields(attrs),
			renderOption: (option) => this.renderTimeOption(option),
		} satisfies SelectAttributes<TimeOption, Time>)
	}

	private renderInputFields(attrs: TimePickerAttrs): Children {
		let returnValue: ChildArray = []
		if (attrs.forMailSendTime) {
			returnValue.push(
				m(LegacyTextField, {
					style: {
						width: "100%",
						fontSize: px(font_size.smaller),
					},
					label: attrs.ariaLabel,
					disabled: attrs.disabled,
					value: this.inputText,
					oninput: (textInputValue) => this.handleTextInput(textInputValue, attrs),
					keyHandler: (key) => {
						this.handleKeyPress(key.key, attrs)
						return true
					},
					onfocus: () => {
						this.inputIsFocused = true
					},
					onblur: () => this.onConfirmInput(attrs),
				} satisfies LegacyTextFieldAttrs),
			)
		} else {
			returnValue.push(
				m(SingleLineTextField, {
					classes: [...(attrs.classes ?? []), "tutaui-button-outline", "text-center", "border-content-message-bg"],
					disabled: attrs.disabled,
					valid: attrs.valid && this.inputTextIsValid,
					ariaLabel: attrs.ariaLabel,
					style: {
						textAlign: "center",
						fontSize: px(font_size.smaller),
						borderWidth: EnvProvider.get().isApp() ? "2px" : "",
					},
					value: this.inputText,
					oninput: (textInputValue) => this.handleTextInput(textInputValue, attrs),
					onkeydown: (event: KeyboardEvent) => this.handleKeyPress(event.key, attrs),
					onfocus: () => {
						this.inputIsFocused = true
					},
					onblur: () => this.onConfirmInput(attrs),
					type: TextFieldType.Text,
				} satisfies SingleLineTextFieldAttrs<TextFieldType.Text>),
			)
		}

		if (EnvProvider.get().isApp()) {
			// On mobile, we use native time pickers to select the time. To achieve this, we add an
			// invisible time input field, covering the other input fields. The invisible input has
			// type="time", so it will display the native time picker when clicked.
			returnValue.push(
				m("input.invisible.abs.full-width.full-height", {
					type: TextFieldType.Time,
					oninput: (event: InputEvent) => {
						const inputElement = event.target! as HTMLInputElement
						this.handleTextInput(inputElement.value, attrs)
						m.redraw()
					},
					onchange: (event: InputEvent) => {
						const inputElement = event.target! as HTMLInputElement
						const parsedTime = Time.parseFromString(inputElement.value)
						if (parsedTime) {
							this.selectedTime = parsedTime
							this.setValidInputTextFromTime(this.selectedTime, attrs)
							m.redraw()
						}
					},
					onclick: (event: MouseEvent) => event.stopPropagation(),
				}),
			)
		}

		return returnValue
	}

	private renderTimeOption(option: TimeOption) {
		const buttonAttrs: Record<string, string> = {
			class: "state-bg button-content dropdown-button pt-8 pb-8 button-min-height",
		}
		if (option.value) {
			const timeFromTextInput = Time.parseFromString(this.inputText)
			if (timeFromTextInput) {
				if (timeFromTextInput.hour === option.value.hour) {
					let minuteDiff = timeFromTextInput.minute - option.value.minute
					if (0 <= minuteDiff && minuteDiff <= 30) {
						// Special handling for the option that is at the start of the same half an hour
						// as the inputted time
						buttonAttrs["data-target"] = "true"
						if (minuteDiff === 0) {
							// Special handling for options that exactly matches the inputted time
							buttonAttrs["class"] += " content-accent-fg row-selected icon-accent"
							buttonAttrs["aria-selected"] = "true"
						}
					}
				}
			}
		}
		return m("button.items-center.flex-grow", buttonAttrs, option.name)
	}

	private handleTextInput(textInputValue: string, attrs: TimePickerAttrs) {
		this.inputText = textInputValue
		const parsedTime = Time.parseFromString(this.inputText)
		if (parsedTime !== null && (!this.selectedTime || !parsedTime!.isEqual(this.selectedTime))) {
			// Update the time if we were able to parse a new time from the text input
			this.inputTextIsValid = true
			this.selectedTime = parsedTime
			attrs.onTimeSelected(this.selectedTime)
		} else {
			this.inputTextIsValid = false
		}
	}

	private handleKeyPress(key: string, attrs: TimePickerAttrs) {
		if (isKeyPressed(key, Keys.RETURN)) {
			this.onConfirmInput(attrs)
		}
	}

	onConfirmInput(attrs: TimePickerAttrs) {
		if (this.selectedTime) {
			// This call causes the text input to be rewritten in the expected format
			this.setValidInputTextFromTime(this.selectedTime, attrs)
		}

		// Close the dropdown and unfocus the text input
		const active = document.activeElement as HTMLElement | null
		active?.blur()
		this.inputIsFocused = false
	}

	private convertTimeToString(time: Time, timeFormat: TimeFormat): string {
		if (timeFormat === TimeFormat.TWELVE_HOURS) {
			return time.to12HourString(true)
		} else {
			return time.to24HourString()
		}
	}

	private setValidInputTextFromTime(time: Time, attrs: TimePickerAttrs) {
		this.inputText = this.convertTimeToString(time, attrs.timeFormat)
		this.inputTextIsValid = true
	}

	private createTimeOption(time: Time, attrs: TimePickerAttrs): TimeOption {
		const timeString = this.convertTimeToString(time, attrs.timeFormat)
		return { value: time, name: timeString, ariaValue: timeString }
	}
}
