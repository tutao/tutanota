import { isApp } from "./Env-chunk.js";
import { client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { filterInt, getStartOfDay, isSameDayOfDate, memoized } from "./dist2-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { theme } from "./theme-chunk.js";
import { Keys, TabIndex } from "./TutanotaConstants-chunk.js";
import { isKeyPressed, keyboardEventToKeyPress, useKeyHandler } from "./KeyManager-chunk.js";
import { px, size } from "./size-chunk.js";
import { DateTime } from "./luxon-chunk.js";
import { getAllDayDateLocal } from "./CommonCalendarUtils-chunk.js";
import { BaseButton } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import { TextField, TextFieldType } from "./Dialog-chunk.js";
import { BootIcons, Icon, IconSize } from "./Icon-chunk.js";
import { AriaPopupType } from "./AriaUtils-chunk.js";
import { formatDate, formatDateWithWeekdayAndYear, formatMonthWithFullYear } from "./Formatter-chunk.js";
import { getCalendarMonth } from "./CalendarGuiUtils-chunk.js";
import { parseDate } from "./DateParser-chunk.js";

//#region src/common/gui/base/SingleLineTextField.ts
let InputMode = function(InputMode$1) {
	InputMode$1["NONE"] = "none";
	InputMode$1["NUMERIC"] = "numeric";
	InputMode$1["TEXT"] = "text";
	return InputMode$1;
}({});
var SingleLineTextField = class {
	domInput;
	view({ attrs }) {
		return attrs.leadingIcon ? this.renderInputWithIcon(attrs) : this.renderInput(attrs);
	}
	renderInputWithIcon(attrs) {
		if (!attrs.leadingIcon) return;
		const fontSizeString = attrs.style?.fontSize;
		const fontSizeNumber = fontSizeString ? filterInt(fontSizeString.replace("px", "")) : NaN;
		const fontSize = isNaN(fontSizeNumber) ? 16 : fontSizeNumber;
		let iconSize;
		let padding;
		if (fontSize > 16 && fontSize < 32) {
			iconSize = IconSize.Large;
			padding = size.icon_size_large;
		} else if (fontSize > 32) {
			iconSize = IconSize.XL;
			padding = size.icon_size_xl;
		} else {
			iconSize = IconSize.Medium;
			padding = size.icon_size_medium_large;
		}
		return mithril_default(".rel.flex.flex-grow", [mithril_default(".abs.pl-vpad-s.flex.items-center", { style: {
			top: 0,
			bottom: 0
		} }, mithril_default(Icon, {
			size: iconSize,
			icon: attrs.leadingIcon.icon,
			style: { fill: attrs.leadingIcon.color }
		})), this.renderInput(attrs, px(padding + size.vpad))]);
	}
	renderInput(attrs, inputPadding) {
		return mithril_default("input.tutaui-text-field", {
			ariaLabel: attrs.ariaLabel,
			value: attrs.value,
			disabled: attrs.disabled ?? false,
			onblur: attrs.onblur,
			onfocus: attrs.onfocus,
			onkeydown: attrs.onkeydown,
			onclick: attrs.onclick,
			oninput: () => {
				if (!attrs.oninput) {
					console.error("oninput fired without a handler function");
					return;
				}
				attrs.oninput(this.domInput.value);
			},
			oncreate: (vnode) => {
				this.domInput = vnode.dom;
				if (attrs.oncreate) attrs.oncreate(vnode);
			},
			placeholder: attrs.placeholder,
			class: this.resolveClasses(attrs.classes, attrs.disabled),
			style: {
				...inputPadding ? { paddingLeft: inputPadding } : {},
				...attrs.style
			},
			type: attrs.inputMode === InputMode.NONE ? undefined : attrs.type,
			inputMode: attrs.inputMode,
			readonly: attrs.readonly,
			...this.getInputProperties(attrs)
		});
	}
	getInputProperties(attrs) {
		if (attrs.type === TextFieldType.Number) {
			const numberAttrs = attrs;
			return {
				min: numberAttrs.min,
				max: numberAttrs.max
			};
		}
		return undefined;
	}
	resolveClasses(classes = [], disabled = false) {
		const classList = [...classes];
		if (disabled) classList.push("disabled");
		return classList.join(" ");
	}
};

//#endregion
//#region src/common/gui/base/buttons/ArrowButton.ts
function renderSwitchMonthArrowIcon(forward, size$1, onClick) {
	return mithril_default(BaseButton, {
		label: forward ? "nextMonth_label" : "prevMonth_label",
		icon: mithril_default(Icon, {
			icon: forward ? Icons.ArrowForward : BootIcons.Back,
			container: "div",
			class: "center-h",
			size: IconSize.Normal,
			style: { fill: theme.content_fg }
		}),
		style: {
			width: px(size$1),
			height: px(size$1)
		},
		class: "state-bg circle",
		onclick: onClick
	});
}

//#endregion
//#region src/common/gui/base/InputButton.ts
let InputButtonVariant = function(InputButtonVariant$1) {
	InputButtonVariant$1["OUTLINE"] = "outline";
	return InputButtonVariant$1;
}({});
var InputButton = class {
	isFocused = false;
	inputDOM;
	buttonDOM;
	view({ attrs }) {
		return mithril_default("button", {
			title: attrs.ariaLabel,
			"aria-live": "off",
			class: this.resolveContainerClasses(attrs.variant, attrs.classes, attrs.disabled),
			tabIndex: attrs.tabIndex,
			style: {
				borderColor: theme.content_message_bg,
				padding: 0,
				...attrs.containerStyle
			},
			oncreate: (vnode) => {
				this.buttonDOM = vnode.dom;
			},
			onclick: (event) => {
				this.isFocused = true;
				if (this.inputDOM) {
					this.inputDOM.style.display = "block";
					this.inputDOM.click();
				}
				attrs.onclick?.(event);
			},
			onfocus: () => {
				this.isFocused = true;
				if (this.inputDOM) {
					this.inputDOM.style.display = "block";
					if (this.buttonDOM) this.buttonDOM.tabIndex = Number(TabIndex.Programmatic);
					this.inputDOM.focus();
				}
			},
			disabled: attrs.disabled
		}, [mithril_default.fragment({}, [mithril_default(SingleLineTextField, {
			ariaLabel: attrs.ariaLabel,
			onblur: () => {
				this.isFocused = false;
				this.inputDOM.style.display = "none";
				if (this.buttonDOM) this.buttonDOM.tabIndex = Number(attrs.tabIndex ?? TabIndex.Default);
				attrs.onblur?.();
			},
			oncreate: (vnode) => {
				this.inputDOM = vnode.dom;
				this.inputDOM.style.display = "none";
				attrs.oncreate?.(vnode);
			},
			disabled: attrs.disabled,
			value: attrs.inputValue,
			oninput: attrs.oninput,
			onkeydown: attrs.onkeydown,
			onfocus: attrs.onfocus,
			classes: this.resolveInputClasses(attrs.variant),
			style: { padding: `${px(size.vpad_small)} 0` },
			type: TextFieldType.Text
		})]), mithril_default("span.tutaui-text-field", { style: {
			display: this.isFocused ? "none" : "block",
			padding: `${px(size.vpad_small)} 0`,
			...attrs.displayStyle
		} }, attrs.display)]);
	}
	resolveInputClasses(variant) {
		const resolvedClasses = ["text-center", "noselect"];
		if (variant === InputButtonVariant.OUTLINE && this.isFocused) resolvedClasses.push("tutaui-button-outline", "border-content-message-bg");
		return resolvedClasses;
	}
	resolveContainerClasses(variant = InputButtonVariant.OUTLINE, classes = [], disabled = false) {
		const resolvedClasses = [...classes, "full-width"];
		if (disabled) resolvedClasses.push("disabled", "click-disabled");
		if (variant === InputButtonVariant.OUTLINE && !this.isFocused) resolvedClasses.push("tutaui-button-outline");
		return resolvedClasses.join(" ");
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/pickers/DatePicker.ts
let PickerPosition = function(PickerPosition$1) {
	PickerPosition$1[PickerPosition$1["TOP"] = 0] = "TOP";
	PickerPosition$1[PickerPosition$1["BOTTOM"] = 1] = "BOTTOM";
	return PickerPosition$1;
}({});
var DatePicker = class {
	inputText = "";
	showingDropdown = false;
	domInput = null;
	documentInteractionListener = null;
	textFieldHasFocus = false;
	previousPassedDownDate;
	constructor({ attrs }) {
		this.inputText = attrs.date ? formatDate(attrs.date) : "";
		this.previousPassedDownDate = attrs.date;
	}
	view({ attrs }) {
		const date = attrs.date;
		if (!this.textFieldHasFocus && !isSameDayOfDate(date, this.previousPassedDownDate)) {
			this.inputText = date ? formatDate(date) : "";
			this.previousPassedDownDate = date;
		}
		return mithril_default(".rel", { class: attrs.classes?.join(" ") }, [
			!attrs.useInputButton ? this.renderTextField(attrs) : this.renderInputButtonPicker(attrs),
			this.showingDropdown ? this.renderDropdown(attrs) : null,
			client.isMobileDevice() && !attrs.useInputButton ? this.renderMobileDateInput(attrs) : null
		]);
	}
	renderInputButtonPicker({ disabled, date, onDateSelected, label }) {
		return mithril_default.fragment({}, [isApp() ? mithril_default("input.fill-absolute.invisible.tutaui-button-outline", {
			disabled,
			type: TextFieldType.Date,
			style: {
				zIndex: 1,
				border: `2px solid ${theme.content_message_bg}`,
				width: "auto",
				height: "auto",
				padding: 0,
				appearance: "none",
				opacity: disabled ? .7 : 1
			},
			value: date != null ? DateTime.fromJSDate(date).toISODate() : "",
			oninput: (event) => {
				this.handleNativeInput(event, onDateSelected);
			}
		}) : null, mithril_default(InputButton, {
			tabIndex: Number(isApp() ? TabIndex.Programmatic : TabIndex.Default),
			ariaLabel: lang.getTranslationText(label),
			inputValue: this.inputText,
			oninput: (newValue) => this.inputText = newValue,
			display: formatDateWithWeekdayAndYear(date ?? new Date()),
			variant: InputButtonVariant.OUTLINE,
			disabled,
			type: TextFieldType.Text,
			onclick: () => {
				if (!disabled) this.showingDropdown = true;
			},
			onfocus: (_, input) => {
				if (!disabled) this.showingDropdown = true;
				this.textFieldHasFocus = true;
			},
			oncreate: (input) => {
				if (this.domInput == null) this.domInput = input.dom;
			},
			onblur: () => {
				this.textFieldHasFocus = false;
			},
			onkeydown: (event) => {
				const key = keyboardEventToKeyPress(event);
				return this.handleInputKeyEvents(key, disabled, onDateSelected);
			},
			containerStyle: isApp() ? {
				zIndex: "2",
				position: "inherit",
				borderColor: "transparent",
				pointerEvents: "none"
			} : {}
		})]);
	}
	renderTextField({ date, onDateSelected, label, nullSelectionText, disabled }) {
		return mithril_default("", { onclick: () => {
			if (!disabled) this.showingDropdown = true;
		} }, mithril_default(TextField, {
			value: this.inputText,
			label,
			helpLabel: () => this.renderHelpLabel(date, nullSelectionText ?? null),
			disabled,
			hasPopup: AriaPopupType.Dialog,
			oninput: (text) => {
				this.inputText = text;
			},
			onfocus: (_, input) => {
				if (!disabled) this.showingDropdown = true;
				this.textFieldHasFocus = true;
			},
			onDomInputCreated: (input) => {
				if (this.domInput == null) this.domInput = input;
			},
			onblur: () => {
				this.textFieldHasFocus = false;
			},
			keyHandler: (key) => {
				return this.handleInputKeyEvents(key, disabled, onDateSelected);
			}
		}));
	}
	handleEscapePress(key) {
		if (isKeyPressed(key.key, Keys.ESC) && this.showingDropdown) {
			this.domInput?.focus();
			this.showingDropdown = false;
			return false;
		}
		return true;
	}
	renderHelpLabel(date, nullSelectionText) {
		if (this.showingDropdown) return null;
else if (date != null) return [mithril_default("", formatDateWithWeekdayAndYear(date)), nullSelectionText ? mithril_default("", lang.getTranslationText(nullSelectionText)) : null];
else return lang.getTranslationText(nullSelectionText ?? "emptyString_msg");
	}
	renderDropdown({ date, onDateSelected, startOfTheWeekOffset, rightAlignDropdown, label, position }) {
		const dropdownDate = this.parseDate(this.inputText) ?? date ?? new Date();
		return mithril_default(".content-bg.z3.menu-shadow.plr.pb-s", {
			"aria-modal": "true",
			"aria-label": lang.get(label),
			style: {
				width: "240px",
				right: rightAlignDropdown ? "0" : null
			},
			class: position === PickerPosition.TOP ? "abs" : "fixed",
			oncreate: (vnode) => {
				const listener = (e) => {
					if (!vnode.dom.contains(e.target) && !this.domInput?.contains(e.target)) {
						if (this.showingDropdown) {
							this.showingDropdown = false;
							this.handleInput(this.inputText, onDateSelected);
							mithril_default.redraw();
						}
					}
				};
				if (position === PickerPosition.TOP && vnode.dom.parentElement) {
					const bottomMargin = vnode.dom.parentElement.getBoundingClientRect().height;
					vnode.dom.style.bottom = px(bottomMargin);
				}
				this.documentInteractionListener = listener;
				document.addEventListener("click", listener, true);
				document.addEventListener("focus", listener, true);
			},
			onremove: () => {
				if (this.documentInteractionListener) {
					document.removeEventListener("click", this.documentInteractionListener, true);
					document.removeEventListener("focus", this.documentInteractionListener, true);
				}
			}
		}, mithril_default(VisualDatePicker, {
			selectedDate: dropdownDate,
			onDateSelected: (newDate, dayClick) => {
				this.handleSelectedDate(newDate, onDateSelected);
				if (dayClick) {
					if (this.domInput) {
						this.domInput.addEventListener("focus", () => {
							this.showingDropdown = false;
							mithril_default.redraw();
						}, { once: true });
						this.domInput.focus();
					}
				}
			},
			keyHandler: (key) => this.handleEscapePress(key),
			wide: false,
			startOfTheWeekOffset
		}));
	}
	renderMobileDateInput({ date, onDateSelected, disabled }) {
		return mithril_default("input.fill-absolute", {
			disabled,
			type: "date",
			style: {
				opacity: 0,
				minWidth: "100%",
				minHeight: "100%"
			},
			value: date != null ? DateTime.fromJSDate(date).toISODate() : "",
			oninput: (event) => {
				this.handleNativeInput(event, onDateSelected);
			}
		});
	}
	handleInput(text, onDateSelected) {
		this.inputText = text;
		const parsedDate = this.parseDate(text);
		if (parsedDate) onDateSelected(parsedDate);
	}
	handleSelectedDate(date, onDateSelected) {
		this.inputText = formatDate(date);
		onDateSelected(date);
	}
	parseDate = memoized((text) => {
		const trimmedValue = text.trim();
		if (trimmedValue !== "") try {
			return parseDate(trimmedValue, (referenceDate) => formatDate(referenceDate));
		} catch (e) {}
		return null;
	});
	handleInputKeyEvents(key, disabled, onDateSelected) {
		if (isKeyPressed(key.key, Keys.DOWN)) {
			if (!disabled && !key.shift && !key.ctrl && !key.meta) this.showingDropdown = true;
		} else if (isKeyPressed(key.key, Keys.RETURN)) this.handleInput(this.inputText, onDateSelected);
		return this.handleEscapePress(key);
	}
	handleNativeInput(event, onDateSelected) {
		const htmlDate = event.target.valueAsDate;
		if (htmlDate != null) this.handleSelectedDate(getAllDayDateLocal(htmlDate), onDateSelected);
	}
};
var VisualDatePicker = class {
	displayingDate;
	lastSelectedDate = null;
	constructor(vnode) {
		this.displayingDate = vnode.attrs.selectedDate || getStartOfDay(new Date());
	}
	view(vnode) {
		const selectedDate = vnode.attrs.selectedDate;
		if (selectedDate && !isSameDayOfDate(this.lastSelectedDate, selectedDate)) {
			this.lastSelectedDate = selectedDate;
			this.displayingDate = new Date(selectedDate);
			this.displayingDate.setDate(1);
		}
		let date = new Date(this.displayingDate);
		let { weeks, weekdays } = getCalendarMonth(this.displayingDate, vnode.attrs.startOfTheWeekOffset, true);
		return mithril_default(".flex.flex-column", { onkeydown: (event) => useKeyHandler(event, vnode.attrs.keyHandler) }, [
			this.renderPickerHeader(vnode, date),
			mithril_default(".flex.flex-space-between", this.renderWeekDays(vnode.attrs.wide, weekdays)),
			mithril_default(".flex.flex-column.flex-space-around", { style: {
				fontSize: px(14),
				lineHeight: px(this.getElementWidth(vnode.attrs))
			} }, weeks.map((w) => this.renderWeek(w, vnode.attrs)))
		]);
	}
	renderPickerHeader(vnode, date) {
		const size$1 = this.getElementWidth(vnode.attrs);
		return mithril_default(".flex.flex-space-between.pt-s.pb-s.items-center", [
			renderSwitchMonthArrowIcon(false, size$1, () => this.onPrevMonthSelected()),
			mithril_default(".b", { style: { fontSize: px(14) } }, formatMonthWithFullYear(date)),
			renderSwitchMonthArrowIcon(true, size$1, () => this.onNextMonthSelected())
		]);
	}
	onPrevMonthSelected() {
		this.displayingDate.setMonth(this.displayingDate.getMonth() - 1);
	}
	onNextMonthSelected() {
		this.displayingDate.setMonth(this.displayingDate.getMonth() + 1);
	}
	renderDay({ date, day, isPaddingDay }, index, attrs) {
		const isSelectedDay = isSameDayOfDate(date, attrs.selectedDate);
		const isSubstituteDay = attrs.selectedDate?.getMonth() !== date.getMonth() && date.getDate() === 1;
		const isTabbable = !isPaddingDay && (isSelectedDay || isSubstituteDay);
		const size$1 = this.getElementWidth(attrs);
		const selector = isSelectedDay && !isPaddingDay ? ".circle.accent-bg" : "";
		return mithril_default(".rel.flex.items-center.justify-center", {
			style: {
				height: px(size$1),
				width: px(size$1)
			},
			class: isPaddingDay ? undefined : "click",
			"aria-hidden": `${isPaddingDay}`,
			"aria-label": date.toLocaleDateString(),
			"aria-selected": `${isSelectedDay}`,
			role: "option",
			tabindex: isTabbable ? TabIndex.Default : TabIndex.Programmatic,
			onclick: isPaddingDay ? undefined : () => attrs.onDateSelected?.(date, true),
			onkeydown: (event) => {
				const key = keyboardEventToKeyPress(event);
				const target = event.target;
				if (isKeyPressed(key.key, Keys.LEFT)) {
					let targetDay;
					if (target.previousElementSibling == null) targetDay = target.parentElement?.previousElementSibling?.children.item(6);
else targetDay = target.previousElementSibling;
					if (!this.focusDayIfPossible(target, targetDay)) {
						this.onPrevMonthSelected();
						mithril_default.redraw.sync();
						this.focusLastDay(target);
					}
					event.preventDefault();
				}
				if (isKeyPressed(key.key, Keys.RIGHT)) {
					let targetDay;
					if (target.nextElementSibling == null) targetDay = target.parentElement?.nextElementSibling?.children.item(0);
else targetDay = target.nextElementSibling;
					if (!this.focusDayIfPossible(target, targetDay)) {
						this.onNextMonthSelected();
						mithril_default.redraw.sync();
						this.focusFirstDay(target);
					}
					event.preventDefault();
				}
				if (isKeyPressed(key.key, Keys.UP)) {
					const dayAbove = target.parentElement?.previousElementSibling?.children.item(index);
					if (!this.focusDayIfPossible(target, dayAbove)) {
						this.onPrevMonthSelected();
						mithril_default.redraw.sync();
						this.focusLastWeekDay(target, index);
					}
					event.preventDefault();
				}
				if (isKeyPressed(key.key, Keys.DOWN)) {
					const dayBelow = target.parentElement?.nextElementSibling?.children.item(index);
					if (!this.focusDayIfPossible(target, dayBelow)) {
						this.onNextMonthSelected();
						mithril_default.redraw.sync();
						this.focusFirstWeekDay(target, index);
					}
					event.preventDefault();
				}
				if (isKeyPressed(key.key, Keys.HOME) && !isPaddingDay) {
					this.focusFirstDay(target);
					event.preventDefault();
				}
				if (isKeyPressed(key.key, Keys.END) && !isPaddingDay) {
					this.focusLastDay(target);
					event.preventDefault();
				}
				if (isKeyPressed(key.key, Keys.PAGE_UP) && !isPaddingDay) {
					if (key.shift) this.displayingDate.setFullYear(this.displayingDate.getFullYear() - 1);
else this.onPrevMonthSelected();
					mithril_default.redraw.sync();
					this.focusFirstDay(target);
					event.preventDefault();
				}
				if (isKeyPressed(key.key, Keys.PAGE_DOWN) && !isPaddingDay) {
					if (key.shift) this.displayingDate.setFullYear(this.displayingDate.getFullYear() + 1);
else this.onNextMonthSelected();
					mithril_default.redraw.sync();
					this.focusFirstDay(target);
					event.preventDefault();
				}
				if (isKeyPressed(key.key, Keys.RETURN) && !isPaddingDay) {
					attrs.onDateSelected?.(date, true);
					event.preventDefault();
				}
				if (isKeyPressed(key.key, Keys.SPACE) && !isPaddingDay) {
					attrs.onDateSelected?.(date, false);
					event.preventDefault();
				}
			}
		}, [mithril_default(".abs.z1" + selector, { style: {
			width: px(size$1),
			height: px(size$1)
		} }), mithril_default(selector + ".full-width.height-100p.center.z2", { style: { "background-color": "transparent" } }, isPaddingDay ? null : day)]);
	}
	focusDayIfPossible(previousElement, dayElement) {
		const element = dayElement;
		if (element != null && element.ariaHidden === "false") {
			element.focus();
			element.tabIndex = 0;
			previousElement.tabIndex = -1;
			return true;
		}
		return false;
	}
	focusLastDay(target) {
		const weeks = target.parentElement?.parentElement?.children;
		if (weeks != null) for (let i = weeks.length - 1; i >= 0; i--) {
			const week = weeks.item(i)?.children;
			let isDateFound = false;
			if (week != null) for (let j = week.length - 1; j >= 0; j--) {
				const child = week.item(j);
				if (this.focusDayIfPossible(target, child)) {
					isDateFound = true;
					break;
				}
			}
			if (isDateFound) break;
		}
	}
	focusLastWeekDay(target, weekDay) {
		const weeks = target.parentElement?.parentElement?.children;
		if (weeks != null) for (let i = weeks.length - 1; i >= 0; i--) {
			const week = weeks.item(i)?.children;
			if (week != null) {
				const child = week.item(weekDay);
				if (this.focusDayIfPossible(target, child)) break;
			}
		}
	}
	focusFirstDay(target) {
		const weeks = target.parentElement?.parentElement?.children;
		if (weeks != null) for (let i = 0; i < weeks.length; i++) {
			const week = weeks.item(i)?.children;
			let isDateFound = false;
			if (week != null) for (let j = 0; j < week.length; j++) {
				const child = week.item(j);
				if (this.focusDayIfPossible(target, child)) {
					isDateFound = true;
					break;
				}
			}
			if (isDateFound) break;
		}
	}
	focusFirstWeekDay(target, weekDay) {
		const weeks = target.parentElement?.parentElement?.children;
		if (weeks != null) for (let i = 0; i < weeks.length; i++) {
			const week = weeks.item(i)?.children;
			if (week != null) {
				const child = week.item(weekDay);
				if (this.focusDayIfPossible(target, child)) break;
			}
		}
	}
	getElementWidth(attrs) {
		return attrs.wide ? 40 : 24;
	}
	renderWeek(week, attrs) {
		return mithril_default(".flex.flex-space-between", week.map((d, i) => this.renderDay(d, i, attrs)));
	}
	renderWeekDays(wide, weekdays) {
		const size$1 = px(wide ? 40 : 24);
		const fontSize = px(14);
		return weekdays.map((wd) => mithril_default(".center", {
			"aria-hidden": "true",
			style: {
				fontSize,
				height: size$1,
				width: size$1,
				lineHeight: size$1,
				color: theme.navigation_menu_icon
			}
		}, wd));
	}
};

//#endregion
export { DatePicker, InputMode, PickerPosition, SingleLineTextField, renderSwitchMonthArrowIcon };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0ZVBpY2tlci1jaHVuay5qcyIsIm5hbWVzIjpbImF0dHJzOiBJbnB1dEF0dHJzPFQ+IiwiaW5wdXRQYWRkaW5nPzogc3RyaW5nIiwidm5vZGU6IFZub2RlRE9NPElucHV0QXR0cnM8VD4+IiwiY2xhc3NlczogQXJyYXk8c3RyaW5nPiIsImRpc2FibGVkOiBib29sZWFuIiwiZm9yd2FyZDogYm9vbGVhbiIsInNpemU6IG51bWJlciIsIm9uQ2xpY2s6IENsaWNrSGFuZGxlciIsInNpemUiLCJldmVudDogTW91c2VFdmVudCIsInZhcmlhbnQ/OiBJbnB1dEJ1dHRvblZhcmlhbnQiLCJ2YXJpYW50OiBJbnB1dEJ1dHRvblZhcmlhbnQiLCJjbGFzc2VzOiBBcnJheTxzdHJpbmc+IiwiZGlzYWJsZWQ6IGJvb2xlYW4iLCJldmVudDogSW5wdXRFdmVudCIsIm5ld1ZhbHVlOiBzdHJpbmciLCJpbnB1dDogYW55IiwiZXZlbnQ6IEtleWJvYXJkRXZlbnQiLCJrZXk6IEtleVByZXNzIiwiZGF0ZTogRGF0ZSB8IG51bGwgfCB1bmRlZmluZWQiLCJudWxsU2VsZWN0aW9uVGV4dDogTWF5YmVUcmFuc2xhdGlvbiB8IG51bGwiLCJlOiBNb3VzZUV2ZW50IiwidGV4dDogc3RyaW5nIiwib25EYXRlU2VsZWN0ZWQ6IERhdGVQaWNrZXJBdHRyc1tcIm9uRGF0ZVNlbGVjdGVkXCJdIiwiZGF0ZTogRGF0ZSIsImRpc2FibGVkOiBib29sZWFuIHwgdW5kZWZpbmVkIiwib25EYXRlU2VsZWN0ZWQ6IChkYXRlOiBEYXRlKSA9PiB1bmtub3duIiwidm5vZGU6IFZub2RlPFZpc3VhbERhdGVQaWNrZXJBdHRycz4iLCJzaXplIiwiaW5kZXg6IG51bWJlciIsImF0dHJzOiBWaXN1YWxEYXRlUGlja2VyQXR0cnMiLCJwcmV2aW91c0VsZW1lbnQ6IEhUTUxFbGVtZW50IiwiZGF5RWxlbWVudDogZ2xvYmFsVGhpcy5FbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCIsInRhcmdldDogSFRNTElucHV0RWxlbWVudCIsIndlZWtEYXk6IG51bWJlciIsIndlZWs6IFJlYWRvbmx5QXJyYXk8Q2FsZW5kYXJEYXk+Iiwid2lkZTogYm9vbGVhbiIsIndlZWtkYXlzOiByZWFkb25seSBzdHJpbmdbXSJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvU2luZ2xlTGluZVRleHRGaWVsZC50cyIsIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvYnV0dG9ucy9BcnJvd0J1dHRvbi50cyIsIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvSW5wdXRCdXR0b24udHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL2d1aS9waWNrZXJzL0RhdGVQaWNrZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENsYXNzQ29tcG9uZW50LCBDb21wb25lbnQsIFZub2RlLCBWbm9kZURPTSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IFRleHRGaWVsZFR5cGUgfSBmcm9tIFwiLi9UZXh0RmllbGQuanNcIlxuaW1wb3J0IHsgQWxsSWNvbnMsIEljb24sIEljb25TaXplIH0gZnJvbSBcIi4vSWNvbi5qc1wiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi9zaXplLmpzXCJcbmltcG9ydCB7IGZpbHRlckludCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuXG5leHBvcnQgZW51bSBJbnB1dE1vZGUge1xuXHROT05FID0gXCJub25lXCIsXG5cdE5VTUVSSUMgPSBcIm51bWVyaWNcIixcblx0VEVYVCA9IFwidGV4dFwiLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNpbmdsZUxpbmVUZXh0RmllbGRBdHRyczxUIGV4dGVuZHMgVGV4dEZpZWxkVHlwZT4gZXh0ZW5kcyBQaWNrPENvbXBvbmVudCwgXCJvbmNyZWF0ZVwiPiB7XG5cdHZhbHVlOiBzdHJpbmcgfCBudW1iZXJcblx0YXJpYUxhYmVsOiBzdHJpbmdcblx0ZGlzYWJsZWQ/OiBib29sZWFuXG5cdC8qKlxuXHQgKiBDYWxsYmFjayBmaXJlZCB3aGVuZXZlciB0aGUgaW5wdXQgaXMgaW50ZXJhY3RlZCB3aXRoLlxuXHQgKiBUaGlzIHByb3BlcnR5IGlzIG1hbmRhdG9yeSBpZiB0aGUgaW5wdXQgaXMgaW50ZXJhY3RpdmUgKGRpc2FibGVkID0gZmFsc2UpLlxuXHQgKiBAZXhhbXBsZVxuXHQgKiAvLyBTYXZlIHRoZSB0eXBlZCB2YWx1ZSB0byBhIG1vZGVsIG9iamVjdFxuXHQgKiBjb25zdCBjYWxsYmFjayA9ICh0eXBlZFZhbHVlOiBzdHJpbmcpID0+IG1vZGVsLnZhbHVlID0gdHlwZWRWYWx1ZTtcblx0ICogbShTaW5nbGVMaW5lVGV4dEZpZWxkLCB7b25pbnB1dDogY2FsbGJhY2t9KVxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbmV3VmFsdWUgLSBTdHJpbmcgdmFsdWUgdHlwZWQgb24gdGhlIGlucHV0IGZpZWxkXG5cdCAqIEByZXR1cm5zIHt1bmtub3dufSBSZXR1cm4gdHlwZSBkZXBlbmRzIG9uIHRoZSBjYWxsYmFjayBwcm92aWRlZFxuXHQgKi9cblx0b25pbnB1dD86IChuZXdWYWx1ZTogc3RyaW5nKSA9PiB1bmtub3duXG5cdHBsYWNlaG9sZGVyPzogc3RyaW5nXG5cdGNsYXNzZXM/OiBBcnJheTxzdHJpbmc+XG5cdHN0eWxlPzogUGFydGlhbDxQaWNrPENTU1N0eWxlRGVjbGFyYXRpb24sIFwicGFkZGluZ1wiIHwgXCJmb250U2l6ZVwiIHwgXCJ0ZXh0QWxpZ25cIj4+XG5cdG9uY2xpY2s/OiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB1bmtub3duXG5cdG9uZm9jdXM/OiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB1bmtub3duXG5cdG9uYmx1cj86ICguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd25cblx0b25rZXlkb3duPzogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdW5rbm93blxuXHR0eXBlOiBUXG5cdGxlYWRpbmdJY29uPzoge1xuXHRcdGljb246IEFsbEljb25zXG5cdFx0Y29sb3I6IHN0cmluZ1xuXHR9XG5cdGlucHV0TW9kZT86IElucHV0TW9kZVxuXHRyZWFkb25seT86IGJvb2xlYW5cbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaW5nbGVMaW5lTnVtYmVyRmllbGRBdHRyczxUIGV4dGVuZHMgVGV4dEZpZWxkVHlwZT4gZXh0ZW5kcyBTaW5nbGVMaW5lVGV4dEZpZWxkQXR0cnM8VD4ge1xuXHRtYXg/OiBudW1iZXJcblx0bWluPzogbnVtYmVyXG59XG5cbmV4cG9ydCB0eXBlIElucHV0QXR0cnM8VCBleHRlbmRzIFRleHRGaWVsZFR5cGU+ID0gVCBleHRlbmRzIFRleHRGaWVsZFR5cGUuTnVtYmVyID8gU2luZ2xlTGluZU51bWJlckZpZWxkQXR0cnM8VD4gOiBTaW5nbGVMaW5lVGV4dEZpZWxkQXR0cnM8VD5cblxuLyoqXG4gKiBTaW1wbGUgc2luZ2xlIGxpbmUgaW5wdXQgZmllbGQgY29tcG9uZW50XG4gKiBAc2VlIENvbXBvbmVudCBhdHRyaWJ1dGVzOiB7U2luZ2xlTGluZVRleHRGaWVsZEF0dHJzfVxuICogQGV4YW1wbGVcbiAqIG0oU2luZ2xlTGluZVRleHRGaWVsZCwge1xuICogICAgIHZhbHVlOiBtb2RlbC52YWx1ZSxcbiAqICAgICBhcmlhTGFiZWw6IGxhbmdlLmdldChcInBsYWNlaG9sZGVyXCIpLFxuICogICAgIG9uaW5wdXQ6IChuZXdWYWx1ZTogc3RyaW5nKSA9PiB7XG4gKiAgICAgICAgIG1vZGVsLnZhbHVlID0gbmV3VmFsdWVcbiAqICAgICB9LFxuICogICAgIHBsYWNlaG9sZGVyOiBsYW5nLmdldChcInBsYWNlaG9sZGVyXCIpLFxuICogICAgIGRpc2FibGVkOiBtb2RlbC5pc1JlYWRvbmx5LFxuICogICAgIGNsYXNzZXM6IFtcImN1c3RvbS10ZXh0LWNvbG9yXCJdLCAvLyBBZGRpbmcgbmV3IHN0eWxlc1xuICogICAgIHN0eWxlOiB7XG4gKiAgICAgICAgIFwiZm9udC1zaXplXCI6IHB4KHNpemUuZm9udF9zaXplX2Jhc2UgKiAxLjI1KSAvLyBPdmVycmlkaW5nIHRoZSBjb21wb25lbnQgc3R5bGVcbiAqICAgICB9XG4gKiB9KSxcbiAqL1xuZXhwb3J0IGNsYXNzIFNpbmdsZUxpbmVUZXh0RmllbGQ8VCBleHRlbmRzIFRleHRGaWVsZFR5cGU+IGltcGxlbWVudHMgQ2xhc3NDb21wb25lbnQ8SW5wdXRBdHRyczxUPj4ge1xuXHRkb21JbnB1dCE6IEhUTUxJbnB1dEVsZW1lbnRcblxuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8SW5wdXRBdHRyczxUPiwgdGhpcz4pOiBDaGlsZHJlbiB8IHZvaWQgfCBudWxsIHtcblx0XHRyZXR1cm4gYXR0cnMubGVhZGluZ0ljb24gPyB0aGlzLnJlbmRlcklucHV0V2l0aEljb24oYXR0cnMpIDogdGhpcy5yZW5kZXJJbnB1dChhdHRycylcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVySW5wdXRXaXRoSWNvbihhdHRyczogSW5wdXRBdHRyczxUPikge1xuXHRcdGlmICghYXR0cnMubGVhZGluZ0ljb24pIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGNvbnN0IGZvbnRTaXplU3RyaW5nID0gYXR0cnMuc3R5bGU/LmZvbnRTaXplXG5cdFx0Y29uc3QgZm9udFNpemVOdW1iZXIgPSBmb250U2l6ZVN0cmluZyA/IGZpbHRlckludChmb250U2l6ZVN0cmluZy5yZXBsYWNlKFwicHhcIiwgXCJcIikpIDogTmFOXG5cdFx0Y29uc3QgZm9udFNpemUgPSBpc05hTihmb250U2l6ZU51bWJlcikgPyAxNiA6IGZvbnRTaXplTnVtYmVyXG5cdFx0bGV0IGljb25TaXplXG5cdFx0bGV0IHBhZGRpbmdcblxuXHRcdGlmIChmb250U2l6ZSA+IDE2ICYmIGZvbnRTaXplIDwgMzIpIHtcblx0XHRcdGljb25TaXplID0gSWNvblNpemUuTGFyZ2Vcblx0XHRcdHBhZGRpbmcgPSBzaXplLmljb25fc2l6ZV9sYXJnZVxuXHRcdH0gZWxzZSBpZiAoZm9udFNpemUgPiAzMikge1xuXHRcdFx0aWNvblNpemUgPSBJY29uU2l6ZS5YTFxuXHRcdFx0cGFkZGluZyA9IHNpemUuaWNvbl9zaXplX3hsXG5cdFx0fSBlbHNlIHtcblx0XHRcdGljb25TaXplID0gSWNvblNpemUuTWVkaXVtXG5cdFx0XHRwYWRkaW5nID0gc2l6ZS5pY29uX3NpemVfbWVkaXVtX2xhcmdlXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG0oXCIucmVsLmZsZXguZmxleC1ncm93XCIsIFtcblx0XHRcdG0oXG5cdFx0XHRcdFwiLmFicy5wbC12cGFkLXMuZmxleC5pdGVtcy1jZW50ZXJcIixcblx0XHRcdFx0eyBzdHlsZTogeyB0b3A6IDAsIGJvdHRvbTogMCB9IH0sXG5cdFx0XHRcdG0oSWNvbiwge1xuXHRcdFx0XHRcdHNpemU6IGljb25TaXplLFxuXHRcdFx0XHRcdGljb246IGF0dHJzLmxlYWRpbmdJY29uLmljb24sXG5cdFx0XHRcdFx0c3R5bGU6IHsgZmlsbDogYXR0cnMubGVhZGluZ0ljb24uY29sb3IgfSxcblx0XHRcdFx0fSksXG5cdFx0XHQpLFxuXHRcdFx0dGhpcy5yZW5kZXJJbnB1dChhdHRycywgcHgocGFkZGluZyArIHNpemUudnBhZCkpLFxuXHRcdF0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlcklucHV0KGF0dHJzOiBJbnB1dEF0dHJzPFQ+LCBpbnB1dFBhZGRpbmc/OiBzdHJpbmcpIHtcblx0XHRyZXR1cm4gbShcImlucHV0LnR1dGF1aS10ZXh0LWZpZWxkXCIsIHtcblx0XHRcdGFyaWFMYWJlbDogYXR0cnMuYXJpYUxhYmVsLFxuXHRcdFx0dmFsdWU6IGF0dHJzLnZhbHVlLFxuXHRcdFx0ZGlzYWJsZWQ6IGF0dHJzLmRpc2FibGVkID8/IGZhbHNlLFxuXHRcdFx0b25ibHVyOiBhdHRycy5vbmJsdXIsXG5cdFx0XHRvbmZvY3VzOiBhdHRycy5vbmZvY3VzLFxuXHRcdFx0b25rZXlkb3duOiBhdHRycy5vbmtleWRvd24sXG5cdFx0XHRvbmNsaWNrOiBhdHRycy5vbmNsaWNrLFxuXHRcdFx0b25pbnB1dDogKCkgPT4ge1xuXHRcdFx0XHRpZiAoIWF0dHJzLm9uaW5wdXQpIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKFwib25pbnB1dCBmaXJlZCB3aXRob3V0IGEgaGFuZGxlciBmdW5jdGlvblwiKVxuXHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHR9XG5cdFx0XHRcdGF0dHJzLm9uaW5wdXQodGhpcy5kb21JbnB1dC52YWx1ZSlcblx0XHRcdH0sXG5cdFx0XHRvbmNyZWF0ZTogKHZub2RlOiBWbm9kZURPTTxJbnB1dEF0dHJzPFQ+PikgPT4ge1xuXHRcdFx0XHR0aGlzLmRvbUlucHV0ID0gdm5vZGUuZG9tIGFzIEhUTUxJbnB1dEVsZW1lbnRcblx0XHRcdFx0aWYgKGF0dHJzLm9uY3JlYXRlKSB7XG5cdFx0XHRcdFx0YXR0cnMub25jcmVhdGUodm5vZGUpXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRwbGFjZWhvbGRlcjogYXR0cnMucGxhY2Vob2xkZXIsXG5cdFx0XHRjbGFzczogdGhpcy5yZXNvbHZlQ2xhc3NlcyhhdHRycy5jbGFzc2VzLCBhdHRycy5kaXNhYmxlZCksXG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHQuLi4oaW5wdXRQYWRkaW5nID8geyBwYWRkaW5nTGVmdDogaW5wdXRQYWRkaW5nIH0gOiB7fSksXG5cdFx0XHRcdC4uLmF0dHJzLnN0eWxlLFxuXHRcdFx0fSxcblx0XHRcdHR5cGU6IGF0dHJzLmlucHV0TW9kZSA9PT0gSW5wdXRNb2RlLk5PTkUgPyB1bmRlZmluZWQgOiBhdHRycy50eXBlLFxuXHRcdFx0aW5wdXRNb2RlOiBhdHRycy5pbnB1dE1vZGUsXG5cdFx0XHRyZWFkb25seTogYXR0cnMucmVhZG9ubHksXG5cdFx0XHQuLi50aGlzLmdldElucHV0UHJvcGVydGllcyhhdHRycyksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgZ2V0SW5wdXRQcm9wZXJ0aWVzKGF0dHJzOiBJbnB1dEF0dHJzPFQ+KTogUGljazxTaW5nbGVMaW5lTnVtYmVyRmllbGRBdHRyczxUZXh0RmllbGRUeXBlLk51bWJlcj4sIFwibWluXCIgfCBcIm1heFwiPiB8IHVuZGVmaW5lZCB7XG5cdFx0aWYgKGF0dHJzLnR5cGUgPT09IFRleHRGaWVsZFR5cGUuTnVtYmVyKSB7XG5cdFx0XHRjb25zdCBudW1iZXJBdHRycyA9IGF0dHJzIGFzIFNpbmdsZUxpbmVOdW1iZXJGaWVsZEF0dHJzPFRleHRGaWVsZFR5cGUuTnVtYmVyPlxuXHRcdFx0cmV0dXJuIHsgbWluOiBudW1iZXJBdHRycy5taW4sIG1heDogbnVtYmVyQXR0cnMubWF4IH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdW5kZWZpbmVkXG5cdH1cblxuXHRwcml2YXRlIHJlc29sdmVDbGFzc2VzKGNsYXNzZXM6IEFycmF5PHN0cmluZz4gPSBbXSwgZGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZSk6IHN0cmluZyB7XG5cdFx0Y29uc3QgY2xhc3NMaXN0ID0gWy4uLmNsYXNzZXNdXG5cdFx0aWYgKGRpc2FibGVkKSB7XG5cdFx0XHRjbGFzc0xpc3QucHVzaChcImRpc2FibGVkXCIpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNsYXNzTGlzdC5qb2luKFwiIFwiKVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uL2ljb25zL0ljb25zLmpzXCJcbmltcG9ydCB7IEJvb3RJY29ucyB9IGZyb20gXCIuLi9pY29ucy9Cb290SWNvbnMuanNcIlxuaW1wb3J0IHsgQ2xpY2tIYW5kbGVyIH0gZnJvbSBcIi4uL0d1aVV0aWxzLmpzXCJcbmltcG9ydCB7IHB4IH0gZnJvbSBcIi4uLy4uL3NpemUuanNcIlxuaW1wb3J0IHsgQmFzZUJ1dHRvbiB9IGZyb20gXCIuL0Jhc2VCdXR0b24uanNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi8uLi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IEljb24sIEljb25TaXplIH0gZnJvbSBcIi4uL0ljb24uanNcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vLi4vdGhlbWUuanNcIlxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiByZW5kZXJTd2l0Y2hNb250aEFycm93SWNvbihmb3J3YXJkOiBib29sZWFuLCBzaXplOiBudW1iZXIsIG9uQ2xpY2s6IENsaWNrSGFuZGxlcik6IENoaWxkcmVuIHtcblx0cmV0dXJuIG0oQmFzZUJ1dHRvbiwge1xuXHRcdGxhYmVsOiBmb3J3YXJkID8gXCJuZXh0TW9udGhfbGFiZWxcIiA6IFwicHJldk1vbnRoX2xhYmVsXCIsXG5cdFx0aWNvbjogbShJY29uLCB7XG5cdFx0XHRpY29uOiBmb3J3YXJkID8gSWNvbnMuQXJyb3dGb3J3YXJkIDogQm9vdEljb25zLkJhY2ssXG5cdFx0XHRjb250YWluZXI6IFwiZGl2XCIsXG5cdFx0XHRjbGFzczogXCJjZW50ZXItaFwiLFxuXHRcdFx0c2l6ZTogSWNvblNpemUuTm9ybWFsLFxuXHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0ZmlsbDogdGhlbWUuY29udGVudF9mZyxcblx0XHRcdH0sXG5cdFx0fSksXG5cdFx0c3R5bGU6IHtcblx0XHRcdHdpZHRoOiBweChzaXplKSxcblx0XHRcdGhlaWdodDogcHgoc2l6ZSksXG5cdFx0fSxcblx0XHRjbGFzczogXCJzdGF0ZS1iZyBjaXJjbGVcIixcblx0XHRvbmNsaWNrOiBvbkNsaWNrLFxuXHR9KVxufVxuIiwiaW1wb3J0IG0sIHsgQ2xhc3NDb21wb25lbnQsIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi90aGVtZS5qc1wiXG5pbXBvcnQgeyBTaW5nbGVMaW5lVGV4dEZpZWxkIH0gZnJvbSBcIi4vU2luZ2xlTGluZVRleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi9zaXplLmpzXCJcbmltcG9ydCB7IFRleHRGaWVsZFR5cGUgfSBmcm9tIFwiLi9UZXh0RmllbGQuanNcIlxuaW1wb3J0IHsgVGFiSW5kZXggfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5cbmV4cG9ydCBlbnVtIElucHV0QnV0dG9uVmFyaWFudCB7XG5cdE9VVExJTkUgPSBcIm91dGxpbmVcIixcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbnB1dEJ1dHRvbkF0dHJpYnV0ZXMgZXh0ZW5kcyBQaWNrPENvbXBvbmVudCwgXCJvbmNyZWF0ZVwiPiB7XG5cdGlucHV0VmFsdWU6IHN0cmluZ1xuXHRkaXNwbGF5OiBzdHJpbmdcblx0YXJpYUxhYmVsOiBzdHJpbmdcblx0ZGlzYWJsZWQ/OiBib29sZWFuXG5cdGNsYXNzZXM/OiBBcnJheTxzdHJpbmc+XG5cdHZhcmlhbnQ/OiBJbnB1dEJ1dHRvblZhcmlhbnRcblx0Y29udGFpbmVyU3R5bGU/OiBQYXJ0aWFsPENTU1N0eWxlRGVjbGFyYXRpb24+XG5cdGRpc3BsYXlTdHlsZT86IFBhcnRpYWw8Q1NTU3R5bGVEZWNsYXJhdGlvbj5cblx0b25jbGljaz86IChldmVudDogTW91c2VFdmVudCkgPT4gdW5rbm93blxuXHRvbmlucHV0OiAobmV3VmFsdWU6IHN0cmluZykgPT4gdW5rbm93blxuXHRvbmJsdXI/OiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB1bmtub3duXG5cdG9uZm9jdXM/OiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB1bmtub3duXG5cdG9ua2V5ZG93bj86ICguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd25cblx0dHlwZT86IFRleHRGaWVsZFR5cGVcblx0dGFiSW5kZXg/OiBudW1iZXJcbn1cblxuLyoqXG4gKiBBIGJ1dHRvbiB3aXRoIGFuIGlucHV0IHRoYXQgY2FuIGJlIGFjdGl2YXRlZCB3aGVuIGNsaWNrZWQgb3IgZm9jdXNlZFxuICogQHNlZSBDb21wb25lbnQgYXR0cmlidXRlczoge0lucHV0QnV0dG9uQXR0cmlidXRlc31cbiAqIEBleGFtcGxlXG4gKiBtKElucHV0QnV0dG9uLCB7XG4gKiAgIGFyaWFMYWJlbDogbGFuZy5nZXQoXCJkYXRlRnJvbV9sYWJlbFwiKVxuICogICBpbnB1dFZhbHVlOiB0aGlzLnZhbHVlLFxuICogXHQgb25pbnB1dDogKG5ld1ZhbHVlKSA9PiAobW9kZWwudmFsdWUgPSBuZXdWYWx1ZSksXG4gKiBcdCBkaXNwbGF5OiBsYW5nLmdldChcInBsYWNlaG9sZGVyXCIpLFxuICogXHQgdmFyaWFudDogSW5wdXRCdXR0b25WYXJpYW50Lk9VVExJTkUsXG4gKiBcdCBvbmNsaWNrOiBjb25zb2xlLmxvZyxcbiAqIFx0IGRpc2FibGVkOiBmYWxzZSxcbiAqICAgZGlzcGxheVN0eWxlOiB7XG4gKiAgICAgY29sb3I6IFwiYmx1ZVwiXG4gKiAgIH1cbiAqIH0pLFxuICovXG5leHBvcnQgY2xhc3MgSW5wdXRCdXR0b24gaW1wbGVtZW50cyBDbGFzc0NvbXBvbmVudDxJbnB1dEJ1dHRvbkF0dHJpYnV0ZXM+IHtcblx0cHJpdmF0ZSBpc0ZvY3VzZWQ6IGJvb2xlYW4gPSBmYWxzZVxuXHRwcml2YXRlIGlucHV0RE9NPzogSFRNTElucHV0RWxlbWVudFxuXHRwcml2YXRlIGJ1dHRvbkRPTT86IEhUTUxCdXR0b25FbGVtZW50XG5cblx0dmlldyh7IGF0dHJzIH06IFZub2RlPElucHV0QnV0dG9uQXR0cmlidXRlcywgdGhpcz4pIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiYnV0dG9uXCIsXG5cdFx0XHR7XG5cdFx0XHRcdHRpdGxlOiBhdHRycy5hcmlhTGFiZWwsXG5cdFx0XHRcdFwiYXJpYS1saXZlXCI6IFwib2ZmXCIsIC8vIEJ1dHRvbiBjb250ZW50cyBhbmQgbGFiZWwgd2lsbCBiZSBoYW5kbGVkIGJ5IHRoZSBpbnB1dCBmaWVsZFxuXHRcdFx0XHRjbGFzczogdGhpcy5yZXNvbHZlQ29udGFpbmVyQ2xhc3NlcyhhdHRycy52YXJpYW50LCBhdHRycy5jbGFzc2VzLCBhdHRycy5kaXNhYmxlZCksXG5cdFx0XHRcdHRhYkluZGV4OiBhdHRycy50YWJJbmRleCxcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRib3JkZXJDb2xvcjogdGhlbWUuY29udGVudF9tZXNzYWdlX2JnLFxuXHRcdFx0XHRcdHBhZGRpbmc6IDAsXG5cdFx0XHRcdFx0Li4uYXR0cnMuY29udGFpbmVyU3R5bGUsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+IHtcblx0XHRcdFx0XHR0aGlzLmJ1dHRvbkRPTSA9IHZub2RlLmRvbSBhcyBIVE1MQnV0dG9uRWxlbWVudFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbmNsaWNrOiAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdFx0XHR0aGlzLmlzRm9jdXNlZCA9IHRydWVcblx0XHRcdFx0XHRpZiAodGhpcy5pbnB1dERPTSkge1xuXHRcdFx0XHRcdFx0dGhpcy5pbnB1dERPTS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiXG5cdFx0XHRcdFx0XHR0aGlzLmlucHV0RE9NLmNsaWNrKClcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRhdHRycy5vbmNsaWNrPy4oZXZlbnQpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uZm9jdXM6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLmlzRm9jdXNlZCA9IHRydWVcblx0XHRcdFx0XHRpZiAodGhpcy5pbnB1dERPTSkge1xuXHRcdFx0XHRcdFx0dGhpcy5pbnB1dERPTS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiXG5cdFx0XHRcdFx0XHRpZiAodGhpcy5idXR0b25ET00pIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5idXR0b25ET00udGFiSW5kZXggPSBOdW1iZXIoVGFiSW5kZXguUHJvZ3JhbW1hdGljKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0dGhpcy5pbnB1dERPTS5mb2N1cygpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkaXNhYmxlZDogYXR0cnMuZGlzYWJsZWQsXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHRtLmZyYWdtZW50KHt9LCBbXG5cdFx0XHRcdFx0bShTaW5nbGVMaW5lVGV4dEZpZWxkLCB7XG5cdFx0XHRcdFx0XHRhcmlhTGFiZWw6IGF0dHJzLmFyaWFMYWJlbCxcblx0XHRcdFx0XHRcdG9uYmx1cjogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmlzRm9jdXNlZCA9IGZhbHNlXG5cdFx0XHRcdFx0XHRcdHRoaXMuaW5wdXRET00hLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIlxuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5idXR0b25ET00pIHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmJ1dHRvbkRPTS50YWJJbmRleCA9IE51bWJlcihhdHRycy50YWJJbmRleCA/PyBUYWJJbmRleC5EZWZhdWx0KVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGF0dHJzLm9uYmx1cj8uKClcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW5wdXRET00gPSB2bm9kZS5kb20gYXMgSFRNTElucHV0RWxlbWVudFxuXHRcdFx0XHRcdFx0XHR0aGlzLmlucHV0RE9NLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIlxuXG5cdFx0XHRcdFx0XHRcdGF0dHJzLm9uY3JlYXRlPy4odm5vZGUpXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0ZGlzYWJsZWQ6IGF0dHJzLmRpc2FibGVkLFxuXHRcdFx0XHRcdFx0dmFsdWU6IGF0dHJzLmlucHV0VmFsdWUsXG5cdFx0XHRcdFx0XHRvbmlucHV0OiBhdHRycy5vbmlucHV0LFxuXHRcdFx0XHRcdFx0b25rZXlkb3duOiBhdHRycy5vbmtleWRvd24sXG5cdFx0XHRcdFx0XHRvbmZvY3VzOiBhdHRycy5vbmZvY3VzLFxuXHRcdFx0XHRcdFx0Y2xhc3NlczogdGhpcy5yZXNvbHZlSW5wdXRDbGFzc2VzKGF0dHJzLnZhcmlhbnQpLFxuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0cGFkZGluZzogYCR7cHgoc2l6ZS52cGFkX3NtYWxsKX0gMGAsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0dHlwZTogVGV4dEZpZWxkVHlwZS5UZXh0LFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRdKSxcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcInNwYW4udHV0YXVpLXRleHQtZmllbGRcIixcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRkaXNwbGF5OiB0aGlzLmlzRm9jdXNlZCA/IFwibm9uZVwiIDogXCJibG9ja1wiLFxuXHRcdFx0XHRcdFx0XHRwYWRkaW5nOiBgJHtweChzaXplLnZwYWRfc21hbGwpfSAwYCxcblx0XHRcdFx0XHRcdFx0Li4uYXR0cnMuZGlzcGxheVN0eWxlLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGF0dHJzLmRpc3BsYXksXG5cdFx0XHRcdCksXG5cdFx0XHRdLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVzb2x2ZUlucHV0Q2xhc3Nlcyh2YXJpYW50PzogSW5wdXRCdXR0b25WYXJpYW50KSB7XG5cdFx0Y29uc3QgcmVzb2x2ZWRDbGFzc2VzID0gW1widGV4dC1jZW50ZXJcIiwgXCJub3NlbGVjdFwiXVxuXHRcdGlmICh2YXJpYW50ID09PSBJbnB1dEJ1dHRvblZhcmlhbnQuT1VUTElORSAmJiB0aGlzLmlzRm9jdXNlZCkge1xuXHRcdFx0cmVzb2x2ZWRDbGFzc2VzLnB1c2goXCJ0dXRhdWktYnV0dG9uLW91dGxpbmVcIiwgXCJib3JkZXItY29udGVudC1tZXNzYWdlLWJnXCIpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc29sdmVkQ2xhc3Nlc1xuXHR9XG5cblx0cHJpdmF0ZSByZXNvbHZlQ29udGFpbmVyQ2xhc3Nlcyh2YXJpYW50OiBJbnB1dEJ1dHRvblZhcmlhbnQgPSBJbnB1dEJ1dHRvblZhcmlhbnQuT1VUTElORSwgY2xhc3NlczogQXJyYXk8c3RyaW5nPiA9IFtdLCBkaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlKSB7XG5cdFx0Y29uc3QgcmVzb2x2ZWRDbGFzc2VzID0gWy4uLmNsYXNzZXMsIFwiZnVsbC13aWR0aFwiXVxuXG5cdFx0aWYgKGRpc2FibGVkKSByZXNvbHZlZENsYXNzZXMucHVzaChcImRpc2FibGVkXCIsIFwiY2xpY2stZGlzYWJsZWRcIilcblx0XHRpZiAodmFyaWFudCA9PT0gSW5wdXRCdXR0b25WYXJpYW50Lk9VVExJTkUgJiYgIXRoaXMuaXNGb2N1c2VkKSB7XG5cdFx0XHRyZXNvbHZlZENsYXNzZXMucHVzaChcInR1dGF1aS1idXR0b24tb3V0bGluZVwiKVxuXHRcdH1cblxuXHRcdHJldHVybiByZXNvbHZlZENsYXNzZXMuam9pbihcIiBcIilcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvQ2xpZW50RGV0ZWN0b3IuanNcIlxuaW1wb3J0IHsgZm9ybWF0RGF0ZSwgZm9ybWF0RGF0ZVdpdGhXZWVrZGF5QW5kWWVhciwgZm9ybWF0TW9udGhXaXRoRnVsbFllYXIgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvRm9ybWF0dGVyLmpzXCJcbmltcG9ydCB0eXBlIHsgVHJhbnNsYXRpb25LZXksIE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBweCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL3NpemUuanNcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS90aGVtZS5qc1wiXG5cbmltcG9ydCB7IGdldFN0YXJ0T2ZEYXksIGlzU2FtZURheU9mRGF0ZSwgbWVtb2l6ZWQgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IERhdGVUaW1lIH0gZnJvbSBcImx1eG9uXCJcbmltcG9ydCB7IGdldEFsbERheURhdGVMb2NhbCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9Db21tb25DYWxlbmRhclV0aWxzLmpzXCJcbmltcG9ydCB7IFRleHRGaWVsZCwgVGV4dEZpZWxkVHlwZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB0eXBlIHsgQ2FsZW5kYXJEYXkgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlscy5qc1wiXG5pbXBvcnQgeyBwYXJzZURhdGUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvRGF0ZVBhcnNlci5qc1wiXG5pbXBvcnQgcmVuZGVyU3dpdGNoTW9udGhBcnJvd0ljb24gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9idXR0b25zL0Fycm93QnV0dG9uLmpzXCJcbmltcG9ydCB7IGdldENhbGVuZGFyTW9udGggfSBmcm9tIFwiLi4vQ2FsZW5kYXJHdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBpc0tleVByZXNzZWQsIGtleWJvYXJkRXZlbnRUb0tleVByZXNzLCBrZXlIYW5kbGVyLCBLZXlQcmVzcywgdXNlS2V5SGFuZGxlciB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWlzYy9LZXlNYW5hZ2VyLmpzXCJcbmltcG9ydCB7IEtleXMsIFRhYkluZGV4IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IEFyaWFQb3B1cFR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9BcmlhVXRpbHMuanNcIlxuaW1wb3J0IHsgaXNBcHAgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52LmpzXCJcbmltcG9ydCB7IElucHV0QnV0dG9uLCBJbnB1dEJ1dHRvbkF0dHJpYnV0ZXMsIElucHV0QnV0dG9uVmFyaWFudCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSW5wdXRCdXR0b24uanNcIlxuXG5leHBvcnQgZW51bSBQaWNrZXJQb3NpdGlvbiB7XG5cdFRPUCxcblx0Qk9UVE9NLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGVQaWNrZXJBdHRycyB7XG5cdGRhdGU/OiBEYXRlXG5cdG9uRGF0ZVNlbGVjdGVkOiAoZGF0ZTogRGF0ZSkgPT4gdW5rbm93blxuXHRzdGFydE9mVGhlV2Vla09mZnNldDogbnVtYmVyXG5cdGxhYmVsOiBUcmFuc2xhdGlvbktleVxuXHRudWxsU2VsZWN0aW9uVGV4dD86IE1heWJlVHJhbnNsYXRpb25cblx0ZGlzYWJsZWQ/OiBib29sZWFuXG5cdHJpZ2h0QWxpZ25Ecm9wZG93bj86IGJvb2xlYW5cblx0dXNlSW5wdXRCdXR0b24/OiBib29sZWFuXG5cdHBvc2l0aW9uPzogUGlja2VyUG9zaXRpb25cblx0Y2xhc3Nlcz86IEFycmF5PHN0cmluZz5cbn1cblxuLyoqXG4gKiBEYXRlIHBpY2tlciBjb21wb25lbnQuIExvb2tzIGxpa2UgYSB0ZXh0IGZpZWxkIHVudGlsIGludGVyYWN0ZWQuIE9uIG1vYmlsZSBpdCB3aWxsIGJlIG5hdGl2ZSBicm93c2VyIHBpY2tlciwgb24gZGVza3RvcCBhIHtAY2xhc3MgVmlzdWFsRGF0ZVBpY2tlcn0uXG4gKlxuICogVGhlIEhUTUwgaW5wdXRbdHlwZT1kYXRlXSBpcyBub3QgdXNhYmxlIG9uIGRlc2t0b3BzIGJlY2F1c2U6XG4gKiAqIGl0IGFsd2F5cyBkaXNwbGF5cyBhIHBsYWNlaG9sZGVyIChtbS9kZC95eXl5KSBhbmQgc2V2ZXJhbCBidXR0b25zIGFuZFxuICogKiB0aGUgcGlja2VyIGNhbid0IGJlIG9wZW5lZCBwcm9ncmFtbWF0aWNhbGx5IGFuZFxuICogKiB0aGUgZGF0ZSBmb3JtYXQgaXMgYmFzZWQgb24gdGhlIG9wZXJhdGluZyBzeXN0ZW1zIGxvY2FsZSBhbmQgbm90IG9uIHRoZSBvbmUgc2V0IGluIHRoZSBicm93c2VyIChhbmQgdXNlZCBieSB1cylcbiAqXG4gKiBUaGF0IGlzIHdoeSB3ZSBvbmx5IHVzZSB0aGUgcGlja2VyIG9uIG1vYmlsZSBkZXZpY2VzLiBUaGV5IHByb3ZpZGUgbmF0aXZlIHBpY2tlciBjb21wb25lbnRzXG4gKiBhbmQgYWxsb3cgb3BlbmluZyB0aGUgcGlja2VyIGJ5IGZvcndhcmRpbmcgdGhlIGNsaWNrIGV2ZW50IHRvIHRoZSBpbnB1dC5cbiAqL1xuZXhwb3J0IGNsYXNzIERhdGVQaWNrZXIgaW1wbGVtZW50cyBDb21wb25lbnQ8RGF0ZVBpY2tlckF0dHJzPiB7XG5cdHByaXZhdGUgaW5wdXRUZXh0OiBzdHJpbmcgPSBcIlwiXG5cdHByaXZhdGUgc2hvd2luZ0Ryb3Bkb3duOiBib29sZWFuID0gZmFsc2Vcblx0cHJpdmF0ZSBkb21JbnB1dDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGRvY3VtZW50SW50ZXJhY3Rpb25MaXN0ZW5lcjogKChlOiBNb3VzZUV2ZW50KSA9PiB1bmtub3duKSB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgdGV4dEZpZWxkSGFzRm9jdXM6IGJvb2xlYW4gPSBmYWxzZVxuXHRwcml2YXRlIHByZXZpb3VzUGFzc2VkRG93bkRhdGU/OiBEYXRlXG5cblx0Y29uc3RydWN0b3IoeyBhdHRycyB9OiBWbm9kZTxEYXRlUGlja2VyQXR0cnM+KSB7XG5cdFx0dGhpcy5pbnB1dFRleHQgPSBhdHRycy5kYXRlID8gZm9ybWF0RGF0ZShhdHRycy5kYXRlKSA6IFwiXCJcblx0XHR0aGlzLnByZXZpb3VzUGFzc2VkRG93bkRhdGUgPSBhdHRycy5kYXRlXG5cdH1cblxuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8RGF0ZVBpY2tlckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBkYXRlID0gYXR0cnMuZGF0ZVxuXG5cdFx0Ly8gSWYgdGhlIHVzZXIgaXMgaW50ZXJhY3Rpbmcgd2l0aCB0aGUgdGV4dGZpZWxkLCB0aGVuIHdlIHdhbnQgdGhlIHRleHRmaWVsZCB0byBhY2NlcHQgdGhlaXIgaW5wdXQsIHNvIG5ldmVyIG92ZXJyaWRlIHRoZSB0ZXh0XG5cdFx0Ly8gT3RoZXJ3aXNlLCB3ZSB3YW50IHRvIGl0IHRvIHJlZmxlY3Qgd2hhdGV2ZXIgZGF0ZSBoYXMgYmVlbiBwYXNzZWQgaW4sIGJlY2F1c2UgaXQgbWF5IGhhdmUgYmVlbiBjaGFuZ2VkIHByb2dyYW1tYXRpY2FsbHlcblx0XHQvLyBUaGUgc2FtZSBkYXkgY2hlY2sgaXMgYmVjYXVzZSBzb21ldGltZXMgZm9jdXMgaXMgbG9zdCB3aGVuIHRyeWluZyB0byB1cGRhdGUgdGhlIGRhdGUuIGhhbmRsZUlucHV0XG5cdFx0Ly8gIG9yIGhhbmRsZVNlbGVjdGVkRGF0ZSBzaG91bGQgYmUgY2FsbGVkIGZpcnN0LCBidXQgaXQgaXMgbm90IGFuZCB0aGUgZGF0ZSB0cnlpbmcgdG8gYmUgc2VsZWN0ZWQgaXNcblx0XHQvLyAgbG9zdC4gU28gY2hlY2tpbmcgaWYgdGhlIGRhdGUgd2FzIGFjdHVhbGx5IHBhc3NlZCBpbiBcImZyb20gYWJvdmVcIiBpcyBhIGJhbmQtYWlkIHNvbHV0aW9uIGZvciBub3cuXG5cdFx0aWYgKCF0aGlzLnRleHRGaWVsZEhhc0ZvY3VzICYmICFpc1NhbWVEYXlPZkRhdGUoZGF0ZSwgdGhpcy5wcmV2aW91c1Bhc3NlZERvd25EYXRlKSkge1xuXHRcdFx0dGhpcy5pbnB1dFRleHQgPSBkYXRlID8gZm9ybWF0RGF0ZShkYXRlKSA6IFwiXCJcblx0XHRcdHRoaXMucHJldmlvdXNQYXNzZWREb3duRGF0ZSA9IGRhdGVcblx0XHR9XG5cblx0XHRyZXR1cm4gbShcIi5yZWxcIiwgeyBjbGFzczogYXR0cnMuY2xhc3Nlcz8uam9pbihcIiBcIikgfSwgW1xuXHRcdFx0IWF0dHJzLnVzZUlucHV0QnV0dG9uID8gdGhpcy5yZW5kZXJUZXh0RmllbGQoYXR0cnMpIDogdGhpcy5yZW5kZXJJbnB1dEJ1dHRvblBpY2tlcihhdHRycyksXG5cdFx0XHR0aGlzLnNob3dpbmdEcm9wZG93biA/IHRoaXMucmVuZGVyRHJvcGRvd24oYXR0cnMpIDogbnVsbCxcblx0XHRcdC8vIEZvciBtb2JpbGUgZGV2aWNlcyB3ZSByZW5kZXIgYSBuYXRpdmUgZGF0ZSBwaWNrZXIsIGl0J3MgZWFzaWVyIHRvIHVzZSBhbmQgbW9yZSBhY2Nlc3NpYmxlLlxuXHRcdFx0Ly8gV2UgcmVuZGVyIGludmlzaWJsZSBpbnB1dCB3aGljaCBvcGVucyBuYXRpdmUgcGlja2VyIG9uIGludGVyYWN0aW9uLlxuXHRcdFx0Y2xpZW50LmlzTW9iaWxlRGV2aWNlKCkgJiYgIWF0dHJzLnVzZUlucHV0QnV0dG9uID8gdGhpcy5yZW5kZXJNb2JpbGVEYXRlSW5wdXQoYXR0cnMpIDogbnVsbCxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJJbnB1dEJ1dHRvblBpY2tlcih7IGRpc2FibGVkLCBkYXRlLCBvbkRhdGVTZWxlY3RlZCwgbGFiZWwgfTogRGF0ZVBpY2tlckF0dHJzKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtLmZyYWdtZW50KHt9LCBbXG5cdFx0XHRpc0FwcCgpXG5cdFx0XHRcdD8gbShcImlucHV0LmZpbGwtYWJzb2x1dGUuaW52aXNpYmxlLnR1dGF1aS1idXR0b24tb3V0bGluZVwiLCB7XG5cdFx0XHRcdFx0XHRkaXNhYmxlZCxcblx0XHRcdFx0XHRcdHR5cGU6IFRleHRGaWVsZFR5cGUuRGF0ZSxcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdHpJbmRleDogMSxcblx0XHRcdFx0XHRcdFx0Ym9yZGVyOiBgMnB4IHNvbGlkICR7dGhlbWUuY29udGVudF9tZXNzYWdlX2JnfWAsXG5cdFx0XHRcdFx0XHRcdHdpZHRoOiBcImF1dG9cIixcblx0XHRcdFx0XHRcdFx0aGVpZ2h0OiBcImF1dG9cIixcblx0XHRcdFx0XHRcdFx0cGFkZGluZzogMCxcblx0XHRcdFx0XHRcdFx0YXBwZWFyYW5jZTogXCJub25lXCIsXG5cdFx0XHRcdFx0XHRcdG9wYWNpdHk6IGRpc2FibGVkID8gMC43IDogMS4wLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHZhbHVlOiBkYXRlICE9IG51bGwgPyBEYXRlVGltZS5mcm9tSlNEYXRlKGRhdGUpLnRvSVNPRGF0ZSgpIDogXCJcIixcblx0XHRcdFx0XHRcdG9uaW5wdXQ6IChldmVudDogSW5wdXRFdmVudCkgPT4ge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmhhbmRsZU5hdGl2ZUlucHV0KGV2ZW50LCBvbkRhdGVTZWxlY3RlZClcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdCAgfSlcblx0XHRcdFx0OiBudWxsLFxuXHRcdFx0bShJbnB1dEJ1dHRvbiwge1xuXHRcdFx0XHR0YWJJbmRleDogTnVtYmVyKGlzQXBwKCkgPyBUYWJJbmRleC5Qcm9ncmFtbWF0aWMgOiBUYWJJbmRleC5EZWZhdWx0KSxcblx0XHRcdFx0YXJpYUxhYmVsOiBsYW5nLmdldFRyYW5zbGF0aW9uVGV4dChsYWJlbCksXG5cdFx0XHRcdGlucHV0VmFsdWU6IHRoaXMuaW5wdXRUZXh0LFxuXHRcdFx0XHRvbmlucHV0OiAobmV3VmFsdWU6IHN0cmluZykgPT4gKHRoaXMuaW5wdXRUZXh0ID0gbmV3VmFsdWUpLFxuXHRcdFx0XHRkaXNwbGF5OiBmb3JtYXREYXRlV2l0aFdlZWtkYXlBbmRZZWFyKGRhdGUgPz8gbmV3IERhdGUoKSksXG5cdFx0XHRcdHZhcmlhbnQ6IElucHV0QnV0dG9uVmFyaWFudC5PVVRMSU5FLFxuXHRcdFx0XHRkaXNhYmxlZCxcblx0XHRcdFx0dHlwZTogVGV4dEZpZWxkVHlwZS5UZXh0LFxuXHRcdFx0XHRvbmNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKCFkaXNhYmxlZCkge1xuXHRcdFx0XHRcdFx0dGhpcy5zaG93aW5nRHJvcGRvd24gPSB0cnVlXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbmZvY3VzOiAoXywgaW5wdXQpID0+IHtcblx0XHRcdFx0XHRpZiAoIWRpc2FibGVkKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnNob3dpbmdEcm9wZG93biA9IHRydWVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhpcy50ZXh0RmllbGRIYXNGb2N1cyA9IHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0b25jcmVhdGU6IChpbnB1dDogYW55KSA9PiB7XG5cdFx0XHRcdFx0aWYgKHRoaXMuZG9tSW5wdXQgPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0dGhpcy5kb21JbnB1dCA9IGlucHV0LmRvbSBhcyBIVE1MSW5wdXRFbGVtZW50XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbmJsdXI6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLnRleHRGaWVsZEhhc0ZvY3VzID0gZmFsc2Vcblx0XHRcdFx0fSxcblx0XHRcdFx0b25rZXlkb3duOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcblx0XHRcdFx0XHRjb25zdCBrZXkgPSBrZXlib2FyZEV2ZW50VG9LZXlQcmVzcyhldmVudClcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5oYW5kbGVJbnB1dEtleUV2ZW50cyhrZXksIGRpc2FibGVkLCBvbkRhdGVTZWxlY3RlZClcblx0XHRcdFx0fSxcblx0XHRcdFx0Y29udGFpbmVyU3R5bGU6IGlzQXBwKClcblx0XHRcdFx0XHQ/IHtcblx0XHRcdFx0XHRcdFx0ekluZGV4OiBcIjJcIixcblx0XHRcdFx0XHRcdFx0cG9zaXRpb246IFwiaW5oZXJpdFwiLFxuXHRcdFx0XHRcdFx0XHRib3JkZXJDb2xvcjogXCJ0cmFuc3BhcmVudFwiLFxuXHRcdFx0XHRcdFx0XHRwb2ludGVyRXZlbnRzOiBcIm5vbmVcIixcblx0XHRcdFx0XHQgIH1cblx0XHRcdFx0XHQ6IHt9LFxuXHRcdFx0fSBzYXRpc2ZpZXMgSW5wdXRCdXR0b25BdHRyaWJ1dGVzKSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJUZXh0RmllbGQoeyBkYXRlLCBvbkRhdGVTZWxlY3RlZCwgbGFiZWwsIG51bGxTZWxlY3Rpb25UZXh0LCBkaXNhYmxlZCB9OiBEYXRlUGlja2VyQXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIlwiLFxuXHRcdFx0e1xuXHRcdFx0XHRvbmNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKCFkaXNhYmxlZCkge1xuXHRcdFx0XHRcdFx0dGhpcy5zaG93aW5nRHJvcGRvd24gPSB0cnVlXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdG0oVGV4dEZpZWxkLCB7XG5cdFx0XHRcdHZhbHVlOiB0aGlzLmlucHV0VGV4dCxcblx0XHRcdFx0bGFiZWwsXG5cdFx0XHRcdGhlbHBMYWJlbDogKCkgPT4gdGhpcy5yZW5kZXJIZWxwTGFiZWwoZGF0ZSwgbnVsbFNlbGVjdGlvblRleHQgPz8gbnVsbCksXG5cdFx0XHRcdGRpc2FibGVkLFxuXHRcdFx0XHRoYXNQb3B1cDogQXJpYVBvcHVwVHlwZS5EaWFsb2csXG5cdFx0XHRcdG9uaW5wdXQ6ICh0ZXh0KSA9PiB7XG5cdFx0XHRcdFx0Ly8gd2Ugd2FudCB0byBob2xkIG9uIHRvIHRoZSB0ZXh0IGZvciB3aGVuIHdlIGFjdHVhbGx5IHdhbnQgdG8gcHJvY2VzcyBpdFxuXHRcdFx0XHRcdHRoaXMuaW5wdXRUZXh0ID0gdGV4dFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbmZvY3VzOiAoXywgaW5wdXQpID0+IHtcblx0XHRcdFx0XHRpZiAoIWRpc2FibGVkKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnNob3dpbmdEcm9wZG93biA9IHRydWVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhpcy50ZXh0RmllbGRIYXNGb2N1cyA9IHRydWVcblx0XHRcdFx0fSxcblx0XHRcdFx0b25Eb21JbnB1dENyZWF0ZWQ6IChpbnB1dCkgPT4ge1xuXHRcdFx0XHRcdGlmICh0aGlzLmRvbUlucHV0ID09IG51bGwpIHtcblx0XHRcdFx0XHRcdHRoaXMuZG9tSW5wdXQgPSBpbnB1dFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0b25ibHVyOiAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy50ZXh0RmllbGRIYXNGb2N1cyA9IGZhbHNlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGtleUhhbmRsZXI6IChrZXkpID0+IHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5oYW5kbGVJbnB1dEtleUV2ZW50cyhrZXksIGRpc2FibGVkLCBvbkRhdGVTZWxlY3RlZClcblx0XHRcdFx0fSxcblx0XHRcdH0pLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgaGFuZGxlRXNjYXBlUHJlc3Moa2V5OiBLZXlQcmVzcyk6IGJvb2xlYW4ge1xuXHRcdGlmIChpc0tleVByZXNzZWQoa2V5LmtleSwgS2V5cy5FU0MpICYmIHRoaXMuc2hvd2luZ0Ryb3Bkb3duKSB7XG5cdFx0XHR0aGlzLmRvbUlucHV0Py5mb2N1cygpXG5cdFx0XHR0aGlzLnNob3dpbmdEcm9wZG93biA9IGZhbHNlXG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cdFx0cmV0dXJuIHRydWVcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVySGVscExhYmVsKGRhdGU6IERhdGUgfCBudWxsIHwgdW5kZWZpbmVkLCBudWxsU2VsZWN0aW9uVGV4dDogTWF5YmVUcmFuc2xhdGlvbiB8IG51bGwpOiBDaGlsZHJlbiB7XG5cdFx0aWYgKHRoaXMuc2hvd2luZ0Ryb3Bkb3duKSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH0gZWxzZSBpZiAoZGF0ZSAhPSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gW20oXCJcIiwgZm9ybWF0RGF0ZVdpdGhXZWVrZGF5QW5kWWVhcihkYXRlKSksIG51bGxTZWxlY3Rpb25UZXh0ID8gbShcIlwiLCBsYW5nLmdldFRyYW5zbGF0aW9uVGV4dChudWxsU2VsZWN0aW9uVGV4dCkpIDogbnVsbF1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGxhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KG51bGxTZWxlY3Rpb25UZXh0ID8/IFwiZW1wdHlTdHJpbmdfbXNnXCIpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJEcm9wZG93bih7IGRhdGUsIG9uRGF0ZVNlbGVjdGVkLCBzdGFydE9mVGhlV2Vla09mZnNldCwgcmlnaHRBbGlnbkRyb3Bkb3duLCBsYWJlbCwgcG9zaXRpb24gfTogRGF0ZVBpY2tlckF0dHJzKTogQ2hpbGRyZW4ge1xuXHRcdC8vIFdlIHdvdWxkIGxpa2UgdG8gc2hvdyB0aGUgZGF0ZSBiZWluZyB0eXBlZCBpbiB0aGUgZHJvcGRvd25cblx0XHRjb25zdCBkcm9wZG93bkRhdGUgPSB0aGlzLnBhcnNlRGF0ZSh0aGlzLmlucHV0VGV4dCkgPz8gZGF0ZSA/PyBuZXcgRGF0ZSgpXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5jb250ZW50LWJnLnozLm1lbnUtc2hhZG93LnBsci5wYi1zXCIsXG5cdFx0XHR7XG5cdFx0XHRcdFwiYXJpYS1tb2RhbFwiOiBcInRydWVcIixcblx0XHRcdFx0XCJhcmlhLWxhYmVsXCI6IGxhbmcuZ2V0KGxhYmVsKSxcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHR3aWR0aDogXCIyNDBweFwiLFxuXHRcdFx0XHRcdHJpZ2h0OiByaWdodEFsaWduRHJvcGRvd24gPyBcIjBcIiA6IG51bGwsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNsYXNzOiBwb3NpdGlvbiA9PT0gUGlja2VyUG9zaXRpb24uVE9QID8gXCJhYnNcIiA6IFwiZml4ZWRcIixcblx0XHRcdFx0b25jcmVhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGxpc3RlbmVyID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdFx0XHRcdGlmICghdm5vZGUuZG9tLmNvbnRhaW5zKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KSAmJiAhdGhpcy5kb21JbnB1dD8uY29udGFpbnMoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpKSB7XG5cdFx0XHRcdFx0XHRcdC8vIFdlIGFyZSBzdWJzY3JpYmVkIHRvIHR3byBldmVudHMgc28gdGhpcyBsaXN0ZW5lciAqd2lsbCogYmUgaW52b2tlZCB0d2ljZSwgYnV0IHdlIG9ubHkgbmVlZCB0byBkbyB0aGUgd29yayBvbmNlLlxuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5zaG93aW5nRHJvcGRvd24pIHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnNob3dpbmdEcm9wZG93biA9IGZhbHNlXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5oYW5kbGVJbnB1dCh0aGlzLmlucHV0VGV4dCwgb25EYXRlU2VsZWN0ZWQpXG5cdFx0XHRcdFx0XHRcdFx0bS5yZWRyYXcoKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHBvc2l0aW9uID09PSBQaWNrZXJQb3NpdGlvbi5UT1AgJiYgdm5vZGUuZG9tLnBhcmVudEVsZW1lbnQpIHtcblx0XHRcdFx0XHRcdGNvbnN0IGJvdHRvbU1hcmdpbiA9IHZub2RlLmRvbS5wYXJlbnRFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodFxuXHRcdFx0XHRcdFx0Oyh2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQpLnN0eWxlLmJvdHRvbSA9IHB4KGJvdHRvbU1hcmdpbilcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR0aGlzLmRvY3VtZW50SW50ZXJhY3Rpb25MaXN0ZW5lciA9IGxpc3RlbmVyXG5cdFx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGxpc3RlbmVyLCB0cnVlKVxuXHRcdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c1wiLCBsaXN0ZW5lciwgdHJ1ZSlcblx0XHRcdFx0fSxcblx0XHRcdFx0b25yZW1vdmU6ICgpID0+IHtcblx0XHRcdFx0XHRpZiAodGhpcy5kb2N1bWVudEludGVyYWN0aW9uTGlzdGVuZXIpIHtcblx0XHRcdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmRvY3VtZW50SW50ZXJhY3Rpb25MaXN0ZW5lciwgdHJ1ZSlcblx0XHRcdFx0XHRcdGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJmb2N1c1wiLCB0aGlzLmRvY3VtZW50SW50ZXJhY3Rpb25MaXN0ZW5lciwgdHJ1ZSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0bShWaXN1YWxEYXRlUGlja2VyLCB7XG5cdFx0XHRcdHNlbGVjdGVkRGF0ZTogZHJvcGRvd25EYXRlLFxuXHRcdFx0XHRvbkRhdGVTZWxlY3RlZDogKG5ld0RhdGUsIGRheUNsaWNrKSA9PiB7XG5cdFx0XHRcdFx0Ly8gV2UgZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIGRpZmZlcmVudCBzZWxlY3Rpb25zIGFzIHdlIHNvbWV0aW1lcyogd2FudCB0byBrZWVwIHRoZSBkcm9wZG93biBvcGVuIGJ1dCBzdGlsbCB3YW50IHRvIHNlbGVjdCB0aGUgZGF0ZVxuXHRcdFx0XHRcdC8vICogd2l0aCBrZXlib2FyZC1iYXNlZCBuYXZpZ2F0aW9uIHNwYWNlIHNlbGVjdHMgdGhlIGRhdGUgYnV0IGtlZXBzIGl0IG9wZW4gd2hpbGUgcmV0dXJuIGtleSB3aWxsIHdvcmsgbGlrZSBjbGlja1xuXHRcdFx0XHRcdHRoaXMuaGFuZGxlU2VsZWN0ZWREYXRlKG5ld0RhdGUsIG9uRGF0ZVNlbGVjdGVkKVxuXHRcdFx0XHRcdGlmIChkYXlDbGljaykge1xuXHRcdFx0XHRcdFx0Ly8gV2Ugd2FudCB0byByZXRhaW4gdGhlIGZvY3VzIG9uIHRoZSBpbnB1dCBmb3IgYWNjZXNzaWJpbGl0eSwgYnV0IHdlIHN0aWxsIHdhbnQgdG8gY2xvc2UgdGhlIGRyb3Bkb3duLlxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuZG9tSW5wdXQpIHtcblx0XHRcdFx0XHRcdFx0Ly8gRm9jdXMgdGhlIGRvbSBpbnB1dCBidXQgdGhlbiBvdmVycmlkZSB0aGUgc2hvd2luZ0Ryb3Bkb3duIHJpZ2h0IGFmdGVyIGZvY3VzLlxuXHRcdFx0XHRcdFx0XHQvLyBJdCBzaG91bGQgYmUgaW52b2tlZCBhZnRlciB0aGUgbm9ybWFsIGxpc3RlbmVyIHNpbmNlIHRoZSBsaXN0ZW5lcnMgYXJlIGFwcGVuZGVkIHRvIHRoZSBlbmQuXG5cblx0XHRcdFx0XHRcdFx0Ly8gT25lIHdvdWxkIHRoaW5rIHRoYXQgXCJmb2N1c1wiIGxpc3RlbmVycyB3b3VsZCBiZSBjYWxsZWQgb24gdGhlIG5leHQgZXZlbnQgbG9vcCBhZnRlciB3ZSBjYWxsIGZvY3VzKCkgYnV0IGFsYXMuXG5cdFx0XHRcdFx0XHRcdC8vIFNvIG1ha2Ugc3VyZSB0byBhZGQgdGhlIGxpc3RlbmVyIGZpcnN0LlxuXHRcdFx0XHRcdFx0XHR0aGlzLmRvbUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXG5cdFx0XHRcdFx0XHRcdFx0XCJmb2N1c1wiLFxuXHRcdFx0XHRcdFx0XHRcdCgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuc2hvd2luZ0Ryb3Bkb3duID0gZmFsc2Vcblx0XHRcdFx0XHRcdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdHsgb25jZTogdHJ1ZSB9LFxuXHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRcdHRoaXMuZG9tSW5wdXQuZm9jdXMoKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0a2V5SGFuZGxlcjogKGtleTogS2V5UHJlc3MpID0+IHRoaXMuaGFuZGxlRXNjYXBlUHJlc3Moa2V5KSxcblx0XHRcdFx0d2lkZTogZmFsc2UsXG5cdFx0XHRcdHN0YXJ0T2ZUaGVXZWVrT2Zmc2V0OiBzdGFydE9mVGhlV2Vla09mZnNldCxcblx0XHRcdH0pLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTW9iaWxlRGF0ZUlucHV0KHsgZGF0ZSwgb25EYXRlU2VsZWN0ZWQsIGRpc2FibGVkIH06IERhdGVQaWNrZXJBdHRycyk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcImlucHV0LmZpbGwtYWJzb2x1dGVcIiwge1xuXHRcdFx0ZGlzYWJsZWQ6IGRpc2FibGVkLFxuXHRcdFx0dHlwZTogXCJkYXRlXCIsXG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRvcGFjaXR5OiAwLFxuXHRcdFx0XHQvLyBUaGlzIG92ZXJyaWRlcyBwbGF0Zm9ybS1zcGVjaWZpYyB3aWR0aCBzZXR0aW5nLCB3ZSB3YW50IHRvIGNvdmVyIHRoZSB3aG9sZSBmaWVsZFxuXHRcdFx0XHRtaW5XaWR0aDogXCIxMDAlXCIsXG5cdFx0XHRcdG1pbkhlaWdodDogXCIxMDAlXCIsXG5cdFx0XHR9LFxuXHRcdFx0Ly8gRm9ybWF0IGFzIElTTyBkYXRlIGZvcm1hdCAoWVlZWS1NTS1kZCkuIFdlIHVzZSBsdXhvbiBmb3IgdGhhdCBiZWNhdXNlIEpTIERhdGUgb25seSBzdXBwb3J0cyBmdWxsIGZvcm1hdCB3aXRoIHRpbWUuXG5cdFx0XHR2YWx1ZTogZGF0ZSAhPSBudWxsID8gRGF0ZVRpbWUuZnJvbUpTRGF0ZShkYXRlKS50b0lTT0RhdGUoKSA6IFwiXCIsXG5cdFx0XHRvbmlucHV0OiAoZXZlbnQ6IElucHV0RXZlbnQpID0+IHtcblx0XHRcdFx0dGhpcy5oYW5kbGVOYXRpdmVJbnB1dChldmVudCwgb25EYXRlU2VsZWN0ZWQpXG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGhhbmRsZUlucHV0KHRleHQ6IHN0cmluZywgb25EYXRlU2VsZWN0ZWQ6IERhdGVQaWNrZXJBdHRyc1tcIm9uRGF0ZVNlbGVjdGVkXCJdKSB7XG5cdFx0dGhpcy5pbnB1dFRleHQgPSB0ZXh0XG5cdFx0Y29uc3QgcGFyc2VkRGF0ZSA9IHRoaXMucGFyc2VEYXRlKHRleHQpXG5cdFx0aWYgKHBhcnNlZERhdGUpIHtcblx0XHRcdG9uRGF0ZVNlbGVjdGVkKHBhcnNlZERhdGUpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBoYW5kbGVTZWxlY3RlZERhdGUoZGF0ZTogRGF0ZSwgb25EYXRlU2VsZWN0ZWQ6IERhdGVQaWNrZXJBdHRyc1tcIm9uRGF0ZVNlbGVjdGVkXCJdKSB7XG5cdFx0dGhpcy5pbnB1dFRleHQgPSBmb3JtYXREYXRlKGRhdGUpXG5cdFx0b25EYXRlU2VsZWN0ZWQoZGF0ZSlcblx0fVxuXG5cdHByaXZhdGUgcGFyc2VEYXRlID0gbWVtb2l6ZWQoKHRleHQ6IHN0cmluZyk6IERhdGUgfCBudWxsID0+IHtcblx0XHRjb25zdCB0cmltbWVkVmFsdWUgPSB0ZXh0LnRyaW0oKVxuXG5cdFx0aWYgKHRyaW1tZWRWYWx1ZSAhPT0gXCJcIikge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmV0dXJuIHBhcnNlRGF0ZSh0cmltbWVkVmFsdWUsIChyZWZlcmVuY2VEYXRlKSA9PiBmb3JtYXREYXRlKHJlZmVyZW5jZURhdGUpKVxuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHQvLyBQYXJzaW5nIGZhaWxlZCBzbyB0aGUgdXNlciBpcyBwcm9iYWJseSB0eXBpbmdcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG51bGxcblx0fSlcblxuXHRwcml2YXRlIGhhbmRsZUlucHV0S2V5RXZlbnRzKGtleTogS2V5UHJlc3MsIGRpc2FibGVkOiBib29sZWFuIHwgdW5kZWZpbmVkLCBvbkRhdGVTZWxlY3RlZDogKGRhdGU6IERhdGUpID0+IHVua25vd24pIHtcblx0XHRpZiAoaXNLZXlQcmVzc2VkKGtleS5rZXksIEtleXMuRE9XTikpIHtcblx0XHRcdGlmICghZGlzYWJsZWQgJiYgIWtleS5zaGlmdCAmJiAha2V5LmN0cmwgJiYgIWtleS5tZXRhKSB7XG5cdFx0XHRcdHRoaXMuc2hvd2luZ0Ryb3Bkb3duID0gdHJ1ZVxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoaXNLZXlQcmVzc2VkKGtleS5rZXksIEtleXMuUkVUVVJOKSkge1xuXHRcdFx0dGhpcy5oYW5kbGVJbnB1dCh0aGlzLmlucHV0VGV4dCwgb25EYXRlU2VsZWN0ZWQpXG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLmhhbmRsZUVzY2FwZVByZXNzKGtleSlcblx0fVxuXG5cdHByaXZhdGUgaGFuZGxlTmF0aXZlSW5wdXQoZXZlbnQ6IElucHV0RXZlbnQsIG9uRGF0ZVNlbGVjdGVkOiAoZGF0ZTogRGF0ZSkgPT4gdW5rbm93bikge1xuXHRcdC8vIHZhbHVlQXNEYXRlIGlzIGFsd2F5cyAwMDowMCBVVENcblx0XHQvLyBodHRwczovL3d3dy53My5vcmcvVFIvaHRtbDUyL3NlYy1mb3Jtcy5odG1sI2RhdGUtc3RhdGUtdHlwZWRhdGVcblx0XHRjb25zdCBodG1sRGF0ZSA9IChldmVudC50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWVBc0RhdGVcblx0XHQvLyBJdCBjYW4gYmUgbnVsbCBpZiB1c2VyIGNsaWNrcyBcImNsZWFyXCIuIElnbm9yZSBpdC5cblx0XHRpZiAoaHRtbERhdGUgIT0gbnVsbCkge1xuXHRcdFx0dGhpcy5oYW5kbGVTZWxlY3RlZERhdGUoZ2V0QWxsRGF5RGF0ZUxvY2FsKGh0bWxEYXRlKSwgb25EYXRlU2VsZWN0ZWQpXG5cdFx0fVxuXHR9XG59XG5cbnR5cGUgVmlzdWFsRGF0ZVBpY2tlckF0dHJzID0ge1xuXHRzZWxlY3RlZERhdGU6IERhdGUgfCBudWxsXG5cdG9uRGF0ZVNlbGVjdGVkPzogKGRhdGU6IERhdGUsIGRheUNsaWNrOiBib29sZWFuKSA9PiB1bmtub3duXG5cdGtleUhhbmRsZXI/OiBrZXlIYW5kbGVyXG5cdHdpZGU6IGJvb2xlYW5cblx0c3RhcnRPZlRoZVdlZWtPZmZzZXQ6IG51bWJlclxufVxuXG4vKiogRGF0ZSBwaWNrZXIgdXNlZCBvbiBkZXNrdG9wLiBEaXNwbGF5cyBhIG1vbnRoIGFuZCBhYmlsaXR5IHRvIHNlbGVjdCBhIG1vbnRoLiAqL1xuZXhwb3J0IGNsYXNzIFZpc3VhbERhdGVQaWNrZXIgaW1wbGVtZW50cyBDb21wb25lbnQ8VmlzdWFsRGF0ZVBpY2tlckF0dHJzPiB7XG5cdHByaXZhdGUgZGlzcGxheWluZ0RhdGU6IERhdGVcblx0cHJpdmF0ZSBsYXN0U2VsZWN0ZWREYXRlOiBEYXRlIHwgbnVsbCA9IG51bGxcblxuXHRjb25zdHJ1Y3Rvcih2bm9kZTogVm5vZGU8VmlzdWFsRGF0ZVBpY2tlckF0dHJzPikge1xuXHRcdHRoaXMuZGlzcGxheWluZ0RhdGUgPSB2bm9kZS5hdHRycy5zZWxlY3RlZERhdGUgfHwgZ2V0U3RhcnRPZkRheShuZXcgRGF0ZSgpKVxuXHR9XG5cblx0dmlldyh2bm9kZTogVm5vZGU8VmlzdWFsRGF0ZVBpY2tlckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBzZWxlY3RlZERhdGUgPSB2bm9kZS5hdHRycy5zZWxlY3RlZERhdGVcblx0XHRpZiAoc2VsZWN0ZWREYXRlICYmICFpc1NhbWVEYXlPZkRhdGUodGhpcy5sYXN0U2VsZWN0ZWREYXRlLCBzZWxlY3RlZERhdGUpKSB7XG5cdFx0XHR0aGlzLmxhc3RTZWxlY3RlZERhdGUgPSBzZWxlY3RlZERhdGVcblx0XHRcdHRoaXMuZGlzcGxheWluZ0RhdGUgPSBuZXcgRGF0ZShzZWxlY3RlZERhdGUpXG5cblx0XHRcdHRoaXMuZGlzcGxheWluZ0RhdGUuc2V0RGF0ZSgxKVxuXHRcdH1cblxuXHRcdGxldCBkYXRlID0gbmV3IERhdGUodGhpcy5kaXNwbGF5aW5nRGF0ZSlcblx0XHRsZXQgeyB3ZWVrcywgd2Vla2RheXMgfSA9IGdldENhbGVuZGFyTW9udGgodGhpcy5kaXNwbGF5aW5nRGF0ZSwgdm5vZGUuYXR0cnMuc3RhcnRPZlRoZVdlZWtPZmZzZXQsIHRydWUpXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5mbGV4LmZsZXgtY29sdW1uXCIsXG5cdFx0XHR7XG5cdFx0XHRcdG9ua2V5ZG93bjogKGV2ZW50OiBLZXlib2FyZEV2ZW50KSA9PiB1c2VLZXlIYW5kbGVyKGV2ZW50LCB2bm9kZS5hdHRycy5rZXlIYW5kbGVyKSxcblx0XHRcdH0sXG5cdFx0XHRbXG5cdFx0XHRcdHRoaXMucmVuZGVyUGlja2VySGVhZGVyKHZub2RlLCBkYXRlKSxcblx0XHRcdFx0bShcIi5mbGV4LmZsZXgtc3BhY2UtYmV0d2VlblwiLCB0aGlzLnJlbmRlcldlZWtEYXlzKHZub2RlLmF0dHJzLndpZGUsIHdlZWtkYXlzKSksXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIuZmxleC5mbGV4LWNvbHVtbi5mbGV4LXNwYWNlLWFyb3VuZFwiLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdGZvbnRTaXplOiBweCgxNCksXG5cdFx0XHRcdFx0XHRcdGxpbmVIZWlnaHQ6IHB4KHRoaXMuZ2V0RWxlbWVudFdpZHRoKHZub2RlLmF0dHJzKSksXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0d2Vla3MubWFwKCh3KSA9PiB0aGlzLnJlbmRlcldlZWsodywgdm5vZGUuYXR0cnMpKSxcblx0XHRcdFx0KSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJQaWNrZXJIZWFkZXIodm5vZGU6IFZub2RlPFZpc3VhbERhdGVQaWNrZXJBdHRycz4sIGRhdGU6IERhdGUpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3Qgc2l6ZSA9IHRoaXMuZ2V0RWxlbWVudFdpZHRoKHZub2RlLmF0dHJzKVxuXHRcdHJldHVybiBtKFwiLmZsZXguZmxleC1zcGFjZS1iZXR3ZWVuLnB0LXMucGItcy5pdGVtcy1jZW50ZXJcIiwgW1xuXHRcdFx0cmVuZGVyU3dpdGNoTW9udGhBcnJvd0ljb24oZmFsc2UsIHNpemUsICgpID0+IHRoaXMub25QcmV2TW9udGhTZWxlY3RlZCgpKSxcblx0XHRcdG0oXG5cdFx0XHRcdFwiLmJcIixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRmb250U2l6ZTogcHgoMTQpLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGZvcm1hdE1vbnRoV2l0aEZ1bGxZZWFyKGRhdGUpLFxuXHRcdFx0KSxcblx0XHRcdHJlbmRlclN3aXRjaE1vbnRoQXJyb3dJY29uKHRydWUsIHNpemUsICgpID0+IHRoaXMub25OZXh0TW9udGhTZWxlY3RlZCgpKSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSBvblByZXZNb250aFNlbGVjdGVkKCkge1xuXHRcdHRoaXMuZGlzcGxheWluZ0RhdGUuc2V0TW9udGgodGhpcy5kaXNwbGF5aW5nRGF0ZS5nZXRNb250aCgpIC0gMSlcblx0fVxuXG5cdHByaXZhdGUgb25OZXh0TW9udGhTZWxlY3RlZCgpIHtcblx0XHR0aGlzLmRpc3BsYXlpbmdEYXRlLnNldE1vbnRoKHRoaXMuZGlzcGxheWluZ0RhdGUuZ2V0TW9udGgoKSArIDEpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckRheSh7IGRhdGUsIGRheSwgaXNQYWRkaW5nRGF5IH06IENhbGVuZGFyRGF5LCBpbmRleDogbnVtYmVyLCBhdHRyczogVmlzdWFsRGF0ZVBpY2tlckF0dHJzKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGlzU2VsZWN0ZWREYXkgPSBpc1NhbWVEYXlPZkRhdGUoZGF0ZSwgYXR0cnMuc2VsZWN0ZWREYXRlKVxuXHRcdC8vIFdlIG5lZWQgYSBkYXkgdG8gdGFiIG9udG8gaWYgdGhlIHNlbGVjdGVkIGRheSBpcyBub3QgdmlzaWJsZSwgc28gd2UgdXNlIHRoZSBmaXJzdCBkYXkgb2YgdGhlIG1vbnRoXG5cdFx0Y29uc3QgaXNTdWJzdGl0dXRlRGF5ID0gYXR0cnMuc2VsZWN0ZWREYXRlPy5nZXRNb250aCgpICE9PSBkYXRlLmdldE1vbnRoKCkgJiYgZGF0ZS5nZXREYXRlKCkgPT09IDFcblx0XHRjb25zdCBpc1RhYmJhYmxlID0gIWlzUGFkZGluZ0RheSAmJiAoaXNTZWxlY3RlZERheSB8fCBpc1N1YnN0aXR1dGVEYXkpXG5cblx0XHRjb25zdCBzaXplID0gdGhpcy5nZXRFbGVtZW50V2lkdGgoYXR0cnMpXG5cdFx0Y29uc3Qgc2VsZWN0b3IgPSBpc1NlbGVjdGVkRGF5ICYmICFpc1BhZGRpbmdEYXkgPyBcIi5jaXJjbGUuYWNjZW50LWJnXCIgOiBcIlwiXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5yZWwuZmxleC5pdGVtcy1jZW50ZXIuanVzdGlmeS1jZW50ZXJcIixcblx0XHRcdHtcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRoZWlnaHQ6IHB4KHNpemUpLFxuXHRcdFx0XHRcdHdpZHRoOiBweChzaXplKSxcblx0XHRcdFx0fSxcblx0XHRcdFx0Y2xhc3M6IGlzUGFkZGluZ0RheSA/IHVuZGVmaW5lZCA6IFwiY2xpY2tcIixcblx0XHRcdFx0XCJhcmlhLWhpZGRlblwiOiBgJHtpc1BhZGRpbmdEYXl9YCxcblx0XHRcdFx0XCJhcmlhLWxhYmVsXCI6IGRhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKCksXG5cdFx0XHRcdFwiYXJpYS1zZWxlY3RlZFwiOiBgJHtpc1NlbGVjdGVkRGF5fWAsXG5cdFx0XHRcdHJvbGU6IFwib3B0aW9uXCIsXG5cdFx0XHRcdHRhYmluZGV4OiBpc1RhYmJhYmxlID8gVGFiSW5kZXguRGVmYXVsdCA6IFRhYkluZGV4LlByb2dyYW1tYXRpYyxcblx0XHRcdFx0b25jbGljazogaXNQYWRkaW5nRGF5ID8gdW5kZWZpbmVkIDogKCkgPT4gYXR0cnMub25EYXRlU2VsZWN0ZWQ/LihkYXRlLCB0cnVlKSxcblx0XHRcdFx0b25rZXlkb3duOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcblx0XHRcdFx0XHRjb25zdCBrZXkgPSBrZXlib2FyZEV2ZW50VG9LZXlQcmVzcyhldmVudClcblx0XHRcdFx0XHRjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudFxuXG5cdFx0XHRcdFx0aWYgKGlzS2V5UHJlc3NlZChrZXkua2V5LCBLZXlzLkxFRlQpKSB7XG5cdFx0XHRcdFx0XHRsZXQgdGFyZ2V0RGF5XG5cblx0XHRcdFx0XHRcdGlmICh0YXJnZXQucHJldmlvdXNFbGVtZW50U2libGluZyA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdC8vIElmIHRoZSB1c2VyIHByZXNzZXMgbGVmdCBvbiB0aGUgZmlyc3QgZGF5IG9mIHRoZSB3ZWVrLCBnbyB0byB0aGUgbGFzdCBkYXkgb2YgdGhlIHByZXZpb3VzIHdlZWtcblx0XHRcdFx0XHRcdFx0dGFyZ2V0RGF5ID0gdGFyZ2V0LnBhcmVudEVsZW1lbnQ/LnByZXZpb3VzRWxlbWVudFNpYmxpbmc/LmNoaWxkcmVuLml0ZW0oNilcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHRhcmdldERheSA9IHRhcmdldC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICghdGhpcy5mb2N1c0RheUlmUG9zc2libGUodGFyZ2V0LCB0YXJnZXREYXkpKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMub25QcmV2TW9udGhTZWxlY3RlZCgpXG5cdFx0XHRcdFx0XHRcdG0ucmVkcmF3LnN5bmMoKVxuXHRcdFx0XHRcdFx0XHR0aGlzLmZvY3VzTGFzdERheSh0YXJnZXQpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGlzS2V5UHJlc3NlZChrZXkua2V5LCBLZXlzLlJJR0hUKSkge1xuXHRcdFx0XHRcdFx0bGV0IHRhcmdldERheVxuXG5cdFx0XHRcdFx0XHRpZiAodGFyZ2V0Lm5leHRFbGVtZW50U2libGluZyA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdHRhcmdldERheSA9IHRhcmdldC5wYXJlbnRFbGVtZW50Py5uZXh0RWxlbWVudFNpYmxpbmc/LmNoaWxkcmVuLml0ZW0oMClcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHRhcmdldERheSA9IHRhcmdldC5uZXh0RWxlbWVudFNpYmxpbmdcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKCF0aGlzLmZvY3VzRGF5SWZQb3NzaWJsZSh0YXJnZXQsIHRhcmdldERheSkpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5vbk5leHRNb250aFNlbGVjdGVkKClcblx0XHRcdFx0XHRcdFx0bS5yZWRyYXcuc3luYygpXG5cdFx0XHRcdFx0XHRcdHRoaXMuZm9jdXNGaXJzdERheSh0YXJnZXQpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGlzS2V5UHJlc3NlZChrZXkua2V5LCBLZXlzLlVQKSkge1xuXHRcdFx0XHRcdFx0Y29uc3QgZGF5QWJvdmUgPSB0YXJnZXQucGFyZW50RWxlbWVudD8ucHJldmlvdXNFbGVtZW50U2libGluZz8uY2hpbGRyZW4uaXRlbShpbmRleClcblx0XHRcdFx0XHRcdGlmICghdGhpcy5mb2N1c0RheUlmUG9zc2libGUodGFyZ2V0LCBkYXlBYm92ZSkpIHtcblx0XHRcdFx0XHRcdFx0Ly8gSWYgdGhlIHVzZXIgcHJlc3NlcyB1cCBvbiB0aGUgZmlyc3Qgd2VlaywgZ28gdG8gdGhlIHNhbWUgZGF5IG9mIHRoZSBwcmV2aW91cyB3ZWVrXG5cdFx0XHRcdFx0XHRcdHRoaXMub25QcmV2TW9udGhTZWxlY3RlZCgpXG5cdFx0XHRcdFx0XHRcdG0ucmVkcmF3LnN5bmMoKVxuXHRcdFx0XHRcdFx0XHR0aGlzLmZvY3VzTGFzdFdlZWtEYXkodGFyZ2V0LCBpbmRleClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoaXNLZXlQcmVzc2VkKGtleS5rZXksIEtleXMuRE9XTikpIHtcblx0XHRcdFx0XHRcdGNvbnN0IGRheUJlbG93ID0gdGFyZ2V0LnBhcmVudEVsZW1lbnQ/Lm5leHRFbGVtZW50U2libGluZz8uY2hpbGRyZW4uaXRlbShpbmRleClcblx0XHRcdFx0XHRcdGlmICghdGhpcy5mb2N1c0RheUlmUG9zc2libGUodGFyZ2V0LCBkYXlCZWxvdykpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5vbk5leHRNb250aFNlbGVjdGVkKClcblx0XHRcdFx0XHRcdFx0bS5yZWRyYXcuc3luYygpXG5cdFx0XHRcdFx0XHRcdHRoaXMuZm9jdXNGaXJzdFdlZWtEYXkodGFyZ2V0LCBpbmRleClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoaXNLZXlQcmVzc2VkKGtleS5rZXksIEtleXMuSE9NRSkgJiYgIWlzUGFkZGluZ0RheSkge1xuXHRcdFx0XHRcdFx0dGhpcy5mb2N1c0ZpcnN0RGF5KHRhcmdldClcblx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoaXNLZXlQcmVzc2VkKGtleS5rZXksIEtleXMuRU5EKSAmJiAhaXNQYWRkaW5nRGF5KSB7XG5cdFx0XHRcdFx0XHR0aGlzLmZvY3VzTGFzdERheSh0YXJnZXQpXG5cdFx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGlzS2V5UHJlc3NlZChrZXkua2V5LCBLZXlzLlBBR0VfVVApICYmICFpc1BhZGRpbmdEYXkpIHtcblx0XHRcdFx0XHRcdGlmIChrZXkuc2hpZnQpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5kaXNwbGF5aW5nRGF0ZS5zZXRGdWxsWWVhcih0aGlzLmRpc3BsYXlpbmdEYXRlLmdldEZ1bGxZZWFyKCkgLSAxKVxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5vblByZXZNb250aFNlbGVjdGVkKClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdG0ucmVkcmF3LnN5bmMoKVxuXHRcdFx0XHRcdFx0dGhpcy5mb2N1c0ZpcnN0RGF5KHRhcmdldClcblx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoaXNLZXlQcmVzc2VkKGtleS5rZXksIEtleXMuUEFHRV9ET1dOKSAmJiAhaXNQYWRkaW5nRGF5KSB7XG5cdFx0XHRcdFx0XHRpZiAoa2V5LnNoaWZ0KSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuZGlzcGxheWluZ0RhdGUuc2V0RnVsbFllYXIodGhpcy5kaXNwbGF5aW5nRGF0ZS5nZXRGdWxsWWVhcigpICsgMSlcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMub25OZXh0TW9udGhTZWxlY3RlZCgpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRtLnJlZHJhdy5zeW5jKClcblx0XHRcdFx0XHRcdHRoaXMuZm9jdXNGaXJzdERheSh0YXJnZXQpXG5cdFx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGlzS2V5UHJlc3NlZChrZXkua2V5LCBLZXlzLlJFVFVSTikgJiYgIWlzUGFkZGluZ0RheSkge1xuXHRcdFx0XHRcdFx0YXR0cnMub25EYXRlU2VsZWN0ZWQ/LihkYXRlLCB0cnVlKVxuXHRcdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChpc0tleVByZXNzZWQoa2V5LmtleSwgS2V5cy5TUEFDRSkgJiYgIWlzUGFkZGluZ0RheSkge1xuXHRcdFx0XHRcdFx0YXR0cnMub25EYXRlU2VsZWN0ZWQ/LihkYXRlLCBmYWxzZSlcblx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHRtKFwiLmFicy56MVwiICsgc2VsZWN0b3IsIHtcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0d2lkdGg6IHB4KHNpemUpLFxuXHRcdFx0XHRcdFx0aGVpZ2h0OiBweChzaXplKSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0bShzZWxlY3RvciArIFwiLmZ1bGwtd2lkdGguaGVpZ2h0LTEwMHAuY2VudGVyLnoyXCIsIHsgc3R5bGU6IHsgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwidHJhbnNwYXJlbnRcIiB9IH0sIGlzUGFkZGluZ0RheSA/IG51bGwgOiBkYXkpLFxuXHRcdFx0XSxcblx0XHQpXG5cdH1cblxuXHQvLyBGb2N1c2VzIG9uIGEgZGF5IGlmIGl0IGlzIG5vdCBhIHBhZGRpbmcgZGF5ICYgcmV0dXJucyB3aGV0aGVyIGl0IGZvY3VzZWQgb24gdGhlIGRheVxuXHRwcml2YXRlIGZvY3VzRGF5SWZQb3NzaWJsZShwcmV2aW91c0VsZW1lbnQ6IEhUTUxFbGVtZW50LCBkYXlFbGVtZW50OiBnbG9iYWxUaGlzLkVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgZWxlbWVudCA9IGRheUVsZW1lbnQgYXMgSFRNTElucHV0RWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWRcblx0XHRpZiAoZWxlbWVudCAhPSBudWxsICYmIGVsZW1lbnQuYXJpYUhpZGRlbiA9PT0gXCJmYWxzZVwiKSB7XG5cdFx0XHRlbGVtZW50LmZvY3VzKClcblx0XHRcdC8vIFB1dCB0aGUgY3VycmVudGx5IGZvY3VzZWQgZWxlbWVudCBpbnRvIHRoZSB0YWIgaW5kZXggc28gdGhlIG5leHQgdGFiIHByZXNzIGZvbGxvd3MgdGhlIHRhYiBpbmRleFxuXHRcdFx0ZWxlbWVudC50YWJJbmRleCA9IDBcblx0XHRcdHByZXZpb3VzRWxlbWVudC50YWJJbmRleCA9IC0xXG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2Vcblx0fVxuXG5cdC8vIEZvY3VzIHRoZSBsYXN0IGRheSBvZiB0aGUgbW9udGggaW4gdGhlIGNhbGVuZGFyXG5cdHByaXZhdGUgZm9jdXNMYXN0RGF5KHRhcmdldDogSFRNTElucHV0RWxlbWVudCkge1xuXHRcdGNvbnN0IHdlZWtzID0gdGFyZ2V0LnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQ/LmNoaWxkcmVuXG5cdFx0aWYgKHdlZWtzICE9IG51bGwpIHtcblx0XHRcdGZvciAobGV0IGkgPSB3ZWVrcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHRjb25zdCB3ZWVrID0gd2Vla3MuaXRlbShpKT8uY2hpbGRyZW5cblx0XHRcdFx0bGV0IGlzRGF0ZUZvdW5kID0gZmFsc2Vcblx0XHRcdFx0aWYgKHdlZWsgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGZvciAobGV0IGogPSB3ZWVrLmxlbmd0aCAtIDE7IGogPj0gMDsgai0tKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBjaGlsZCA9IHdlZWsuaXRlbShqKVxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuZm9jdXNEYXlJZlBvc3NpYmxlKHRhcmdldCwgY2hpbGQpKSB7XG5cdFx0XHRcdFx0XHRcdGlzRGF0ZUZvdW5kID0gdHJ1ZVxuXHRcdFx0XHRcdFx0XHRicmVha1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoaXNEYXRlRm91bmQpIGJyZWFrXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8gRm9jdXMgYSBkYXkgaW4gdGhlIGZpbmFsIHdlZWsgb2YgdGhlIGNhbGVuZGFyXG5cdHByaXZhdGUgZm9jdXNMYXN0V2Vla0RheSh0YXJnZXQ6IEhUTUxJbnB1dEVsZW1lbnQsIHdlZWtEYXk6IG51bWJlcikge1xuXHRcdGNvbnN0IHdlZWtzID0gdGFyZ2V0LnBhcmVudEVsZW1lbnQ/LnBhcmVudEVsZW1lbnQ/LmNoaWxkcmVuXG5cdFx0aWYgKHdlZWtzICE9IG51bGwpIHtcblx0XHRcdGZvciAobGV0IGkgPSB3ZWVrcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHRjb25zdCB3ZWVrID0gd2Vla3MuaXRlbShpKT8uY2hpbGRyZW5cblx0XHRcdFx0aWYgKHdlZWsgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGNvbnN0IGNoaWxkID0gd2Vlay5pdGVtKHdlZWtEYXkpXG5cdFx0XHRcdFx0aWYgKHRoaXMuZm9jdXNEYXlJZlBvc3NpYmxlKHRhcmdldCwgY2hpbGQpKSB7XG5cdFx0XHRcdFx0XHRicmVha1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8vIEZvY3VzIHRoZSBmaXJzdCBkYXkgb2YgdGhlIG1vbnRoIGluIHRoZSBjYWxlbmRhclxuXHRwcml2YXRlIGZvY3VzRmlyc3REYXkodGFyZ2V0OiBIVE1MSW5wdXRFbGVtZW50KSB7XG5cdFx0Y29uc3Qgd2Vla3MgPSB0YXJnZXQucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8uY2hpbGRyZW5cblx0XHRpZiAod2Vla3MgIT0gbnVsbCkge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB3ZWVrcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRjb25zdCB3ZWVrID0gd2Vla3MuaXRlbShpKT8uY2hpbGRyZW5cblx0XHRcdFx0bGV0IGlzRGF0ZUZvdW5kID0gZmFsc2Vcblx0XHRcdFx0aWYgKHdlZWsgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGZvciAobGV0IGogPSAwOyBqIDwgd2Vlay5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdFx0Y29uc3QgY2hpbGQgPSB3ZWVrLml0ZW0oailcblx0XHRcdFx0XHRcdGlmICh0aGlzLmZvY3VzRGF5SWZQb3NzaWJsZSh0YXJnZXQsIGNoaWxkKSkge1xuXHRcdFx0XHRcdFx0XHRpc0RhdGVGb3VuZCA9IHRydWVcblx0XHRcdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGlzRGF0ZUZvdW5kKSBicmVha1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8vIEZvY3VzIGEgZGF5IGluIHRoZSBmaXJzdCB3ZWVrIG9mIHRoZSBjYWxlbmRhclxuXHRwcml2YXRlIGZvY3VzRmlyc3RXZWVrRGF5KHRhcmdldDogSFRNTElucHV0RWxlbWVudCwgd2Vla0RheTogbnVtYmVyKSB7XG5cdFx0Y29uc3Qgd2Vla3MgPSB0YXJnZXQucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8uY2hpbGRyZW5cblx0XHRpZiAod2Vla3MgIT0gbnVsbCkge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB3ZWVrcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRjb25zdCB3ZWVrID0gd2Vla3MuaXRlbShpKT8uY2hpbGRyZW5cblx0XHRcdFx0aWYgKHdlZWsgIT0gbnVsbCkge1xuXHRcdFx0XHRcdGNvbnN0IGNoaWxkID0gd2Vlay5pdGVtKHdlZWtEYXkpXG5cdFx0XHRcdFx0aWYgKHRoaXMuZm9jdXNEYXlJZlBvc3NpYmxlKHRhcmdldCwgY2hpbGQpKSB7XG5cdFx0XHRcdFx0XHRicmVha1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgZ2V0RWxlbWVudFdpZHRoKGF0dHJzOiBWaXN1YWxEYXRlUGlja2VyQXR0cnMpOiBudW1iZXIge1xuXHRcdHJldHVybiBhdHRycy53aWRlID8gNDAgOiAyNFxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJXZWVrKHdlZWs6IFJlYWRvbmx5QXJyYXk8Q2FsZW5kYXJEYXk+LCBhdHRyczogVmlzdWFsRGF0ZVBpY2tlckF0dHJzKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIuZmxleC5mbGV4LXNwYWNlLWJldHdlZW5cIixcblx0XHRcdHdlZWsubWFwKChkLCBpKSA9PiB0aGlzLnJlbmRlckRheShkLCBpLCBhdHRycykpLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyV2Vla0RheXMod2lkZTogYm9vbGVhbiwgd2Vla2RheXM6IHJlYWRvbmx5IHN0cmluZ1tdKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHNpemUgPSBweCh3aWRlID8gNDAgOiAyNClcblx0XHRjb25zdCBmb250U2l6ZSA9IHB4KDE0KVxuXHRcdHJldHVybiB3ZWVrZGF5cy5tYXAoKHdkKSA9PlxuXHRcdFx0bShcblx0XHRcdFx0XCIuY2VudGVyXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiLFxuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRmb250U2l6ZSxcblx0XHRcdFx0XHRcdGhlaWdodDogc2l6ZSxcblx0XHRcdFx0XHRcdHdpZHRoOiBzaXplLFxuXHRcdFx0XHRcdFx0bGluZUhlaWdodDogc2l6ZSxcblx0XHRcdFx0XHRcdGNvbG9yOiB0aGVtZS5uYXZpZ2F0aW9uX21lbnVfaWNvbixcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR3ZCxcblx0XHRcdCksXG5cdFx0KVxuXHR9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQU1ZLGtDQUFMO0FBQ047QUFDQTtBQUNBOztBQUNBO0lBMERZLHNCQUFOLE1BQTRGO0NBQ2xHO0NBRUEsS0FBSyxFQUFFLE9BQW1DLEVBQTBCO0FBQ25FLFNBQU8sTUFBTSxjQUFjLEtBQUssb0JBQW9CLE1BQU0sR0FBRyxLQUFLLFlBQVksTUFBTTtDQUNwRjtDQUVELEFBQVEsb0JBQW9CQSxPQUFzQjtBQUNqRCxPQUFLLE1BQU0sWUFDVjtFQUdELE1BQU0saUJBQWlCLE1BQU0sT0FBTztFQUNwQyxNQUFNLGlCQUFpQixpQkFBaUIsVUFBVSxlQUFlLFFBQVEsTUFBTSxHQUFHLENBQUMsR0FBRztFQUN0RixNQUFNLFdBQVcsTUFBTSxlQUFlLEdBQUcsS0FBSztFQUM5QyxJQUFJO0VBQ0osSUFBSTtBQUVKLE1BQUksV0FBVyxNQUFNLFdBQVcsSUFBSTtBQUNuQyxjQUFXLFNBQVM7QUFDcEIsYUFBVSxLQUFLO0VBQ2YsV0FBVSxXQUFXLElBQUk7QUFDekIsY0FBVyxTQUFTO0FBQ3BCLGFBQVUsS0FBSztFQUNmLE9BQU07QUFDTixjQUFXLFNBQVM7QUFDcEIsYUFBVSxLQUFLO0VBQ2Y7QUFFRCxTQUFPLGdCQUFFLHVCQUF1QixDQUMvQixnQkFDQyxvQ0FDQSxFQUFFLE9BQU87R0FBRSxLQUFLO0dBQUcsUUFBUTtFQUFHLEVBQUUsR0FDaEMsZ0JBQUUsTUFBTTtHQUNQLE1BQU07R0FDTixNQUFNLE1BQU0sWUFBWTtHQUN4QixPQUFPLEVBQUUsTUFBTSxNQUFNLFlBQVksTUFBTztFQUN4QyxFQUFDLENB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