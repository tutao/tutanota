import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { LegacyTextFieldAttrs, LegacyTextField, LegacyTextFieldType as TextFieldType, LegacyTextFieldType } from "../../../../../ui/base/LegacyTextField.js"
import { EnvProvider, TabIndex, TimeFormat } from "@tutao/app-env"
import { Time } from "../../../../common/calendar/Time.js"
import { Select, SelectAttributes } from "../../../../../ui/base/Select.js"
import { InputAttrs, SingleLineTextField, SingleLineTextFieldAttrs } from "../../../../../ui/base/SingleLineTextField.js"
import { rem, font_size, px } from "../../../../../ui/size.js"
import stream from "mithril/stream"
import { isKeyPressed } from "../../../../../ui/utils/KeyManager.js"
import { lang, Translation } from "../../../../../ui/utils/LanguageViewModel"
import { Keys } from "../../../../../ui/utils/KeyboardKeys"
import { ClientDetector } from "../../../../../platform-kit/app-env/boot/ClientDetector"

export type TimePickerAttrs = {
	time: Time
	onTimeSelected: (time: Time) => unknown
	timeFormat: TimeFormat
	disabled?: boolean
	valid?: boolean
	ariaLabel: Translation
	classes?: Array<string>
	// TODO(gg): Ridiculous attribute; factor into another component
	forMailSendTime: boolean
}

interface TimeOption {
	value: Time
	ariaValue: string
	name: string
}

/**
 * Time picker
 *
 * See also DatePicker.ts
 *
 * This implements the same HTML structure as {@class DatePicker} which uses an `<input type="time"><input type="text">`
 * together where the native time picker is zero-width and not directly clickable. For mobile devices (not only the app)
 * we show the native time picker rendered by the browser/WebView.
 */
export class TimePicker implements Component<TimePickerAttrs> {
	private inputText = ""
	private selectedTime: Time
	private timeDropdownOptions: TimeOption[] = []
	private inputTextIsValid = true
	private inputTextEl?: HTMLInputElement = undefined
	private inputTimeEl?: HTMLInputElement = undefined

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
		if (document.activeElement !== this.inputTextEl && document.activeElement !== this.inputTimeEl) {
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
			tabIndex: -1,
			renderDisplay: () => this.renderInputFields(attrs),
			renderOption: (option) => this.renderTimeOption(option),
		} satisfies SelectAttributes<TimeOption, Time>)
	}

	private renderInputFields(attrs: TimePickerAttrs) {
		// We're choosing between two components so factor out the click listener
		const onclick = (event: Event) => {
			if (ClientDetector.get().isMobileDevice() && this.inputTimeEl) {
				// Don't open the dropdown list
				event.preventDefault()
				// In some browsers this isn't correctly implemented and there's no way to know if a showPicker() was a
				// no-op. We can't tell if it's being displayed on-screen. It's unimplemented in iOS Safari+Webview.
				if ("showPicker" in HTMLInputElement.prototype) {
					try {
						this.inputTimeEl.showPicker()
					} catch (e) {
						// https://developer.chrome.com/blog/show-picker/#how-to
						if (e.name !== "NotAllowedError") throw e
					}
				}
				// There's no way to detect if showPicker() is no-op https://github.com/whatwg/html/issues/7790.
				if (ClientDetector.get().isIos()) {
					this.inputTimeEl.tabIndex = 0
					this.inputTimeEl.focus()
				}
			}
			// Note m(Select) will continue opening the dropdown of TimeOption options, so we show both time pickers
		}
		return m.fragment({}, [
			m("input[type=time]", {
				tabindex: -1,
				disabled: attrs.disabled,
				style: {
					width: 0,
					// This helps browsers decide where to place their native picker under/over the input field. Note
					// m(Select) is position relative
					position: "absolute",
					left: 0,
					// We want exactly the same height at the input[type=text] above so the native picker doesn't
					// block any words in the input field. Chose to match the border/padding instead of setting a height
					"border-width": "1px 0",
					"border-color": "transparent",
					padding: "8px 0",
					appearance: "none",
				},
				value: this.selectedTime.to24HourString(),
				oncreate: (vnode: VnodeDOM) => {
					this.inputTimeEl = vnode.dom as HTMLInputElement
				},
				oninput: (event: EventRedraw<InputEvent>) => {
					if (attrs.disabled) {
						event.preventDefault()
						event.stopPropagation()
						event.redraw = false
						return
					}
					const inputElement = event.target! as HTMLInputElement
					const parsedTime = Time.parseFromString(inputElement.value)
					if (parsedTime) {
						this.selectedTime = parsedTime
						this.setValidInputTextFromTime(this.selectedTime, attrs)
						attrs.onTimeSelected(this.selectedTime)
					}
				},
			}),
			attrs.forMailSendTime
				? m(LegacyTextField, {
						style: { width: "100%" },
						label: attrs.ariaLabel,
						disabled: attrs.disabled,
						value: this.inputText,
						keyHandler: (key) => {
							this.handleKeyPress(key.key, attrs)
							return true
						},
						// TODO(gg): Why is this not `oncreate`? What? I guess there's ambiguity about what vnode is
						// being returned?
						onDomInputCreated: (dom) => {
							this.inputTextEl = dom
						},
						oninput: (textInputValue: string) => this.handleTextInput(textInputValue, attrs),
						onclick,
						onblur: () => this.onConfirmInput(attrs),
					} satisfies LegacyTextFieldAttrs)
				: m(SingleLineTextField, {
						type: TextFieldType.Text,
						disabled: attrs.disabled,
						value: this.inputText,
						classes: [...(attrs.classes ?? []), "tutaui-button-outline", "text-center", "border-content-message-bg"],
						valid: attrs.valid && this.inputTextIsValid,
						ariaLabel: attrs.ariaLabel,
						style: {
							textAlign: "center",
							fontSize: rem(font_size.smaller_em),
							borderWidth: EnvProvider.get().isApp() ? "2px" : "",
						},
						// TODO(gg): This is some madness, the type is necessary else `vnode` is "NoLifecycle" and
						// SingleLineTextField fails type checking.
						oncreate: (vnode: VnodeDOM<InputAttrs<LegacyTextFieldType.Text>>) => {
							this.inputTextEl = vnode.dom as HTMLInputElement
						},
						onkeydown: (event: KeyboardEvent) => this.handleKeyPress(event.key, attrs),
						oninput: (textInputValue: string) => this.handleTextInput(textInputValue, attrs),
						onclick,
						onblur: () => this.onConfirmInput(attrs),
					} satisfies SingleLineTextFieldAttrs<TextFieldType.Text>),
		])
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
		if (parsedTime !== null && (!this.selectedTime || !parsedTime.isEqual(this.selectedTime))) {
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
		;(document.activeElement as HTMLInputElement | null)?.blur?.()
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