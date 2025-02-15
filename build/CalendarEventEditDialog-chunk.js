import { __toESM } from "./chunk-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { isApp } from "./Env-chunk.js";
import { client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { assertNotNull, debounceStart, deepEqual, getFirstOrThrow, noOp } from "./dist2-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { DefaultAnimationTime } from "./styles-chunk.js";
import { theme } from "./theme-chunk.js";
import { AccountType, CalendarAttendeeStatus, EndType, Keys, RepeatPeriod, TabIndex, TimeFormat, defaultCalendarColor } from "./TutanotaConstants-chunk.js";
import { focusNext, focusPrevious, isKeyPressed, keyboardEventToKeyPress } from "./KeyManager-chunk.js";
import { modal } from "./RootView-chunk.js";
import { px, size } from "./size-chunk.js";
import { getSafeAreaInsetBottom, getSafeAreaInsetTop } from "./HtmlUtils-chunk.js";
import { AlarmIntervalUnit, getStartOfTheWeekOffsetForUser, getTimeFormatForUser, parseAlarmInterval } from "./CalendarUtils-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { BaseButton, ButtonColor, ButtonType, getColors } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import { Dialog, DropDownSelector, TextField, TextFieldType, attachDropdown, showDropdown } from "./Dialog-chunk.js";
import { BootIcons, Icon, IconSize } from "./Icon-chunk.js";
import { AriaRole } from "./AriaUtils-chunk.js";
import { ButtonSize, IconButton } from "./IconButton-chunk.js";
import { Time } from "./CalendarEventWhenModel-chunk.js";
import { convertTextToHtml, timeStringFromParts } from "./Formatter-chunk.js";
import { getSharedGroupName } from "./GroupUtils2-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";
import { scaleToVisualPasswordStrength } from "./PasswordUtils-chunk.js";
import { RecipientType } from "./Recipient-chunk.js";
import { CalendarOperation, EventSaveResult, ReadonlyReason, askIfShouldSendCalendarUpdatesToAttendees, createAlarmIntervalItems, createAttendingItems, createCustomEndTypeOptions, createCustomRepeatRuleUnitValues, createIntervalValues, createRepeatRuleOptions, customFrequenciesOptions, hasPlanWithInvites, humanDescriptionForAlarmInterval, iconForAttendeeStatus } from "./CalendarGuiUtils-chunk.js";
import { UpgradeRequiredError } from "./UpgradeRequiredError-chunk.js";
import { showPlanUpgradeRequiredDialog } from "./SubscriptionDialogs-chunk.js";
import { formatRepetitionEnd, formatRepetitionFrequency } from "./EventPreviewView-chunk.js";
import { ToggleButton } from "./ToggleButton-chunk.js";
import { DatePicker, InputMode, PickerPosition, SingleLineTextField } from "./DatePicker-chunk.js";
import { parseMailAddress, parsePastedInput, parseTypedInput } from "./MailRecipientsTextField-chunk.js";
import { IconMessageBox } from "./ColumnEmptyMessageBox-chunk.js";
import { BannerType, InfoBanner } from "./InfoBanner-chunk.js";
import { showUserError } from "./ErrorHandlerImpl-chunk.js";
import { handleRatingByEvent } from "./InAppRatingDialog-chunk.js";

//#region src/common/gui/base/Card.ts
var Card = class {
	view({ attrs, children }) {
		return mithril_default(`${attrs.rootElementType ?? "div"}.tutaui-card-container`, {
			class: attrs.classes?.join(" "),
			style: attrs.style
		}, children);
	}
};

//#endregion
//#region src/common/gui/base/Select.ts
var Select = class {
	isExpanded = false;
	dropdownContainer;
	key = 0;
	view({ attrs: { onchange, options, renderOption, renderDisplay, classes, selected, placeholder, expanded, disabled, ariaLabel, iconColor, id, noIcon, keepFocus, tabIndex, onclose, dropdownPosition } }) {
		return mithril_default("button.tutaui-select-trigger.clickable", {
			id,
			class: this.resolveClasses(classes, disabled, expanded),
			onclick: (event) => event.currentTarget && this.renderDropdown(options, event.currentTarget, onchange, renderOption, keepFocus ?? false, selected?.value, onclose, dropdownPosition),
			role: AriaRole.Combobox,
			ariaLabel,
			disabled,
			ariaExpanded: String(this.isExpanded),
			tabIndex: tabIndex ?? Number(disabled ? TabIndex.Programmatic : TabIndex.Default),
			value: selected?.ariaValue
		}, [selected != null ? renderDisplay(selected) : this.renderPlaceholder(placeholder), noIcon !== true ? mithril_default(Icon, {
			icon: BootIcons.Expand,
			container: "div",
			class: `fit-content transition-transform`,
			size: IconSize.Medium,
			style: { fill: iconColor ?? getColors(ButtonColor.Content).button }
		}) : null]);
	}
	resolveClasses(classes = [], disabled = false, expanded = false) {
		const classList = [...classes];
		if (disabled) classList.push("disabled", "click-disabled");
else classList.push("flash");
		if (expanded) classList.push("full-width");
else classList.push("fit-content");
		return classList.join(" ");
	}
	renderPlaceholder(placeholder) {
		if (placeholder == null || typeof placeholder === "string") return mithril_default("span.placeholder", placeholder ?? lang.get("noSelection_msg"));
		return placeholder;
	}
	renderDropdown(options, dom, onSelect, renderOptions, keepFocus, selected, onClose, dropdownPosition) {
		const optionListContainer = new OptionListContainer(options, (option) => {
			return mithril_default.fragment({
				key: ++this.key,
				oncreate: ({ dom: dom$1 }) => this.setupOption(dom$1, onSelect, option, optionListContainer, selected)
			}, [renderOptions(option)]);
		}, dom.getBoundingClientRect().width, keepFocus, dropdownPosition);
		optionListContainer.onClose = () => {
			optionListContainer.close();
			onClose?.();
			this.isExpanded = false;
		};
		optionListContainer.setOrigin(dom.getBoundingClientRect());
		this.isExpanded = true;
		this.dropdownContainer = optionListContainer;
		modal.displayUnique(optionListContainer, false);
	}
	setupOption(dom, onSelect, option, optionListContainer, selected) {
		dom.onclick = this.wrapOnChange.bind(this, onSelect, option, optionListContainer);
		if (!("disabled" in dom)) {
			dom.tabIndex = Number(TabIndex.Default);
			if (!dom.style.cursor) dom.style.cursor = "pointer";
			if (!dom.role) dom.role = AriaRole.Option;
			dom.ariaSelected = `${selected === option.value}`;
		}
		dom.onkeydown = (e) => {
			if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
				e.preventDefault();
				this.wrapOnChange(onSelect, option, optionListContainer);
			}
		};
	}
	wrapOnChange(callback, option, container) {
		callback(option);
		container.onClose();
	}
};
var OptionListContainer = class {
	domDropdown = null;
	view;
	origin = null;
	shortcuts;
	width;
	domContents = null;
	maxHeight = null;
	focusedBeforeShown = document.activeElement;
	children = [];
	constructor(items, buildFunction, width, keepFocus, dropdownPosition) {
		this.items = items;
		this.buildFunction = buildFunction;
		this.width = width;
		this.shortcuts = this.buildShortcuts;
		this.items.map((newItems) => {
			this.children = [];
			this.children.push(newItems.length === 0 ? this.renderNoItem() : newItems.map((item) => this.buildFunction(item)));
		});
		this.view = () => {
			return mithril_default(".dropdown-panel-scrollable.elevated-bg.border-radius.dropdown-shadow.fit-content", { oncreate: (vnode) => {
				this.domDropdown = vnode.dom;
				this.domDropdown.style.opacity = "0";
			} }, mithril_default(".dropdown-content.scroll.flex.flex-column", {
				role: AriaRole.Listbox,
				tabindex: TabIndex.Programmatic,
				oncreate: (vnode) => {
					this.domContents = vnode.dom;
				},
				onupdate: (vnode) => {
					if (this.maxHeight == null) {
						const children = Array.from(vnode.dom.children);
						this.maxHeight = Math.min(400 + size.vpad, children.reduce((accumulator, children$1) => accumulator + children$1.offsetHeight, 0) + size.vpad);
						if (this.origin) showDropdown(this.origin, assertNotNull(this.domDropdown), this.maxHeight, this.width, dropdownPosition).then(() => {
							const selectedOption = vnode.dom.querySelector("[aria-selected='true']");
							if (selectedOption && !keepFocus) selectedOption.focus();
else if (!keepFocus && (!this.domDropdown || focusNext(this.domDropdown))) this.domContents?.focus();
						});
					} else this.updateDropdownSize(vnode);
				},
				onscroll: (ev) => {
					const target = ev.target;
					ev.redraw = this.domContents != null && target.scrollTop < 0 && target.scrollTop + this.domContents.offsetHeight > target.scrollHeight;
				}
			}, this.children));
		};
	}
	updateDropdownSize(vnode) {
		if (!(this.origin && this.domDropdown)) return;
		const upperSpace = this.origin.top - getSafeAreaInsetTop();
		const lowerSpace = window.innerHeight - this.origin.bottom - getSafeAreaInsetBottom();
		const children = Array.from(vnode.dom.children);
		const contentHeight = Math.min(400 + size.vpad, children.reduce((accumulator, children$1) => accumulator + children$1.offsetHeight, 0) + size.vpad);
		this.maxHeight = lowerSpace > upperSpace ? Math.min(contentHeight, lowerSpace) : Math.min(contentHeight, upperSpace);
		const newHeight = px(this.maxHeight);
		if (this.domDropdown.style.height !== newHeight) this.domDropdown.style.height = newHeight;
	}
	renderNoItem() {
		return mithril_default("span.placeholder.text-center", { color: theme.list_message_bg }, lang.get("noEntries_msg"));
	}
	backgroundClick = (e) => {
		if (this.domDropdown && !e.target.classList.contains("doNotClose") && (this.domDropdown.contains(e.target) || this.domDropdown.parentNode === e.target)) this.onClose();
	};
	buildShortcuts() {
		return [
			{
				key: Keys.ESC,
				exec: () => this.onClose(),
				help: "close_alt"
			},
			{
				key: Keys.TAB,
				shift: true,
				exec: () => this.domDropdown ? focusPrevious(this.domDropdown) : false,
				help: "selectPrevious_action"
			},
			{
				key: Keys.TAB,
				shift: false,
				exec: () => this.domDropdown ? focusNext(this.domDropdown) : false,
				help: "selectNext_action"
			},
			{
				key: Keys.UP,
				exec: () => this.domDropdown ? focusPrevious(this.domDropdown) : false,
				help: "selectPrevious_action"
			},
			{
				key: Keys.DOWN,
				exec: () => this.domDropdown ? focusNext(this.domDropdown) : false,
				help: "selectNext_action"
			}
		];
	}
	setOrigin(origin) {
		this.origin = origin;
		return this;
	}
	close() {
		modal.remove(this);
	}
	hideAnimation() {
		return Promise.resolve();
	}
	onClose() {
		this.close();
	}
	popState(e) {
		this.onClose();
		return false;
	}
	callingElement() {
		return this.focusedBeforeShown;
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/pickers/GuestPicker.ts
var import_stream$6 = __toESM(require_stream(), 1);
var GuestPicker = class {
	isExpanded = false;
	isFocused = false;
	value = "";
	selected;
	options = (0, import_stream$6.default)([]);
	selectDOM = null;
	view({ attrs }) {
		return mithril_default(Select, {
			classes: ["flex-grow"],
			dropdownPosition: "bottom",
			onchange: ({ value: guest }) => {
				this.handleSelection(attrs, guest);
			},
			onclose: () => {
				this.isExpanded = false;
			},
			oncreate: (node) => {
				this.selectDOM = node;
			},
			selected: this.selected,
			ariaLabel: attrs.ariaLabel,
			disabled: attrs.disabled,
			options: this.options,
			noIcon: true,
			expanded: true,
			tabIndex: Number(TabIndex.Programmatic),
			placeholder: this.renderSearchInput(attrs),
			renderDisplay: () => this.renderSearchInput(attrs),
			renderOption: (option) => this.renderSuggestionItem(option === this.selected, option),
			keepFocus: true
		});
	}
	renderSuggestionItem(selected, option) {
		const firstRow = option.value.type === "recipient" ? option.value.value.name : mithril_default(Icon, {
			icon: Icons.People,
			style: {
				fill: theme.content_fg,
				"aria-describedby": lang.get("contactListName_label")
			}
		});
		const secondRow = option.value.type === "recipient" ? option.value.value.address : option.value.value.name;
		return mithril_default(".pt-s.pb-s.click.content-hover.button-min-height", {
			class: selected ? "content-accent-fg row-selected icon-accent" : "",
			style: {
				"padding-left": selected ? px(size.hpad_large - 3) : px(size.hpad_large),
				"border-left": selected ? "3px solid" : null
			}
		}, [mithril_default(".small.full-width.text-ellipsis", firstRow), mithril_default(".name.full-width.text-ellipsis", secondRow)]);
	}
	async handleSelection(attrs, guest) {
		if (guest.value != null) if (guest.type === "recipient") {
			const { address, name, contact } = guest.value;
			attrs.onRecipientAdded(address, name, contact);
			attrs.search.clear();
			this.value = "";
		} else {
			this.value = "";
			const recipients = await attrs.search.resolveContactList(guest.value);
			for (const { address, name, contact } of recipients) attrs.onRecipientAdded(address, name, contact);
			attrs.search.clear();
			mithril_default.redraw();
		}
	}
	renderSearchInput(attrs) {
		return mithril_default(SingleLineTextField, {
			classes: ["height-100p"],
			value: this.value,
			placeholder: lang.get("addGuest_label"),
			onclick: (e) => {
				e.stopImmediatePropagation();
				if (!this.isExpanded && this.value.length > 0 && this.selectDOM) {
					this.selectDOM.dom.click();
					this.isExpanded = true;
				}
			},
			oninput: (val) => {
				if (val.length > 0 && !this.isExpanded && this.selectDOM) {
					this.selectDOM.dom.click();
					this.isExpanded = true;
				}
				const { remainingText, newRecipients, errors } = val.length - this.value.length > 1 ? parsePastedInput(val) : parseTypedInput(val);
				for (const { address, name } of newRecipients) attrs.onRecipientAdded(address, name, null);
				if (errors.length === 1 && newRecipients.length === 0) this.value = getFirstOrThrow(errors);
else {
					if (errors.length > 0) Dialog.message(lang.makeTranslation("error_message", `${lang.get("invalidPastedRecipients_msg")}\n\n${errors.join("\n")}`));
					this.value = remainingText;
				}
				this.doSearch(val, attrs);
			},
			disabled: attrs.disabled,
			ariaLabel: attrs.ariaLabel,
			onfocus: (event) => {
				this.isFocused = true;
			},
			onblur: (e) => {
				if (this.isFocused) {
					this.resolveInput(attrs, false);
					this.isFocused = false;
				}
				e.redraw = false;
			},
			onkeydown: (event) => this.handleKeyDown(event, attrs),
			type: TextFieldType.Text
		});
	}
	doSearch = debounceStart(DefaultAnimationTime, (val, attrs) => {
		attrs.search.search(val).then(() => {
			const searchResult = attrs.search.results();
			if (searchResult.length === 0) this.selected = undefined;
			this.options(searchResult.map((option) => ({
				name: option.value.name,
				value: option,
				type: option.type,
				ariaValue: option.value.name
			})));
			mithril_default.redraw();
		});
	});
	handleKeyDown(event, attrs) {
		const keyPress = keyboardEventToKeyPress(event);
		switch (keyPress.key.toLowerCase()) {
			case Keys.RETURN.code:
				this.resolveInput(attrs, true);
				break;
			case Keys.DOWN.code:
				this.moveSelection(true);
				event.stopImmediatePropagation();
				return false;
			case Keys.UP.code:
				this.moveSelection(false);
				event.stopImmediatePropagation();
				return false;
		}
		return true;
	}
	moveSelection(forward) {
		const selectedIndex = this.selected ? this.options().indexOf(this.selected) : -1;
		const optionsLength = this.options().length;
		let newIndex;
		if (forward) newIndex = selectedIndex + 1 < optionsLength ? selectedIndex + 1 : 0;
else newIndex = selectedIndex - 1 >= 0 ? selectedIndex - 1 : optionsLength - 1;
		this.selected = this.options()[newIndex];
	}
	async selectSuggestion(attrs) {
		if (this.selected == null) return;
		if (this.selected.value.type === "recipient") {
			const { address, name, contact } = this.selected.value.value;
			attrs.onRecipientAdded(address, name, contact);
			attrs.search.clear();
			this.value = "";
		} else {
			attrs.search.clear();
			this.value = "";
			const recipients = await attrs.search.resolveContactList(this.selected.value.value);
			for (const { address, name, contact } of recipients) attrs.onRecipientAdded(address, name, contact);
			mithril_default.redraw();
		}
		this.closePicker();
	}
	/**
	* Resolves a typed in mail address or one of the suggested ones.
	* @param attrs
	* @param selectSuggestion boolean value indicating whether a suggestion should be selected or not. Should be true if a suggestion is explicitly selected by
	* for example hitting the enter key and false e.g. if the dialog is closed
	*/
	resolveInput(attrs, selectSuggestion) {
		const suggestions = attrs.search.results();
		if (suggestions.length > 0 && selectSuggestion) this.selectSuggestion(attrs);
else {
			const parsed = parseMailAddress(this.value);
			if (parsed != null) {
				attrs.onRecipientAdded(parsed.address, parsed.name, null);
				this.value = "";
				this.closePicker();
			}
		}
	}
	closePicker() {
		if (this.selectDOM) this.selectDOM.state.dropdownContainer?.onClose();
	}
};

//#endregion
//#region src/common/gui/PasswordInput.ts
var PasswordInput = class {
	showPassword = false;
	view(vnode) {
		return mithril_default(".flex.flex-grow.full-width.justify-between.items-center.gap-vpad-s", [
			vnode.attrs.showStrength ? mithril_default("div", { style: {
				width: px(size.icon_size_medium),
				height: px(size.icon_size_medium),
				border: `1px solid ${theme.content_button}`,
				borderRadius: "50%",
				background: `conic-gradient(from .25turn, ${theme.content_button} ${scaleToVisualPasswordStrength(vnode.attrs.strength)}%, transparent 0%)`
			} }) : null,
			mithril_default(SingleLineTextField, {
				classes: ["flex-grow"],
				ariaLabel: vnode.attrs.ariaLabel,
				type: this.showPassword ? TextFieldType.Text : TextFieldType.Password,
				value: vnode.attrs.password,
				oninput: vnode.attrs.oninput,
				style: { padding: `${px(size.vpad_xsm)} ${px(size.vpad_small)}` },
				placeholder: lang.get("password_label")
			}),
			mithril_default(IconButton, {
				size: ButtonSize.Compact,
				title: this.showPassword ? "concealPassword_action" : "revealPassword_action",
				icon: this.showPassword ? Icons.NoEye : Icons.Eye,
				click: () => this.showPassword = !this.showPassword
			})
		]);
	}
};

//#endregion
//#region src/common/gui/base/Switch.ts
var Switch = class {
	checkboxDom;
	view({ attrs: { disabled, variant, ariaLabel, checked, onclick, togglePillPosition, classes }, children }) {
		const childrenArr = [children, this.buildTogglePillComponent(checked, onclick, disabled)];
		if (togglePillPosition === "left") childrenArr.reverse();
		return mithril_default("label.tutaui-switch.flash", {
			class: this.resolveClasses(classes, disabled, variant),
			role: AriaRole.Switch,
			ariaLabel,
			ariaChecked: String(checked),
			ariaDisabled: disabled ? "true" : undefined,
			tabIndex: Number(disabled ? TabIndex.Programmatic : TabIndex.Default),
			onkeydown: (e) => {
				if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
					e.preventDefault();
					this.checkboxDom?.click();
				}
			}
		}, childrenArr);
	}
	buildTogglePillComponent(checked = false, onclick, disabled) {
		return mithril_default("span.tutaui-toggle-pill", { class: this.checkboxDom?.checked ? "checked" : "unchecked" }, mithril_default("input[type='checkbox']", {
			role: AriaRole.Switch,
			onclick: () => {
				onclick(this.checkboxDom?.checked ?? false);
			},
			oncreate: ({ dom }) => {
				this.checkboxDom = dom;
				this.checkboxDom.checked = checked;
			},
			tabIndex: TabIndex.Programmatic,
			disabled: disabled ? true : undefined
		}));
	}
	resolveClasses(classes = [], disabled = false, variant = "normal") {
		const classList = [...classes];
		if (disabled) classList.push("disabled", "click-disabled");
else classList.push("click");
		if (variant === "expanded") classList.push("justify-between", "full-width");
else classList.push("fit-content");
		return classList.join(" ");
	}
};

//#endregion
//#region src/common/gui/Divider.ts
var Divider = class {
	view({ attrs }) {
		return mithril_default("hr.m-0.border-none.full-width", { style: {
			height: "1px",
			backgroundColor: attrs.color,
			color: attrs.color,
			...attrs.style
		} });
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/eventeditor-view/AttendeeListEditor.ts
var import_stream$5 = __toESM(require_stream(), 1);
var AttendeeListEditor = class {
	hasPlanWithInvites = false;
	view({ attrs }) {
		const { whoModel } = attrs.model.editModels;
		const organizer = whoModel.organizer;
		return [mithril_default(".flex-grow.flex.flex-column.gap-vpad.pb.pt.fit-height", { style: { width: px(attrs.width) } }, [this.renderOrganizer(attrs.model, organizer), mithril_default(".flex.flex-column.gap-vpad-s", [
			mithril_default("small.uppercase.b.text-ellipsis", { style: { color: theme.navigation_button } }, lang.get("guests_label")),
			whoModel.canModifyGuests ? this.renderGuestsInput(whoModel, attrs.logins, attrs.recipientsSearch) : null,
			this.renderSendUpdateCheckbox(attrs.model.editModels.whoModel),
			this.renderGuestList(attrs, organizer)
		])])];
	}
	renderGuestList(attrs, organizer) {
		const { whoModel } = attrs.model.editModels;
		const guestItems = [];
		for (const guest of whoModel.guests) {
			let password;
			let strength;
			if (guest.type === RecipientType.EXTERNAL) {
				const presharedPassword = whoModel.getPresharedPassword(guest.address);
				password = presharedPassword.password;
				strength = presharedPassword.strength;
			}
			guestItems.push(() => this.renderGuest(guest, attrs, password, strength));
		}
		const ownGuest = whoModel.ownGuest;
		if (ownGuest != null && ownGuest.address !== organizer?.address) guestItems.push(() => this.renderGuest(ownGuest, attrs));
		const verticalPadding = guestItems.length > 0 ? size.vpad_small : 0;
		return guestItems.length === 0 ? mithril_default(Card, {
			classes: ["min-h-s flex flex-column gap-vpad-s"],
			style: { padding: `${px(verticalPadding)} ${px(guestItems.length === 0 ? size.vpad_small : 0)} ${px(size.vpad_small)} ${px(verticalPadding)}` }
		}, mithril_default(".flex.items-center.justify-center.min-h-s", [mithril_default(IconMessageBox, {
			message: "noEntries_msg",
			icon: Icons.People,
			color: theme.list_message_bg
		})])) : guestItems.map((r, index) => r());
	}
	renderGuestsInput(whoModel, logins, recipientsSearch) {
		const guests = whoModel.guests;
		const hasExternalGuests = guests.some((a) => a.type === RecipientType.EXTERNAL);
		return mithril_default(".flex.items-center.flex-grow.gap-vpad-s", [mithril_default(Card, {
			style: { padding: "0" },
			classes: ["flex-grow"]
		}, [mithril_default(".flex.flex-grow.rel.button-height", [mithril_default(GuestPicker, {
			ariaLabel: "addGuest_label",
			disabled: false,
			onRecipientAdded: async (address, name, contact) => {
				if (!await hasPlanWithInvites(logins) && !this.hasPlanWithInvites) {
					if (logins.getUserController().user.accountType === AccountType.EXTERNAL) return;
					if (logins.getUserController().isGlobalAdmin()) {
						const { getAvailablePlansWithEventInvites } = await import("./SubscriptionUtils2-chunk.js");
						const plansWithEventInvites = await getAvailablePlansWithEventInvites();
						if (plansWithEventInvites.length === 0) return;
						this.hasPlanWithInvites = await showPlanUpgradeRequiredDialog(plansWithEventInvites);
						if (!this.hasPlanWithInvites) return;
					} else Dialog.message("contactAdmin_msg");
				} else whoModel.addAttendee(address, contact);
			},
			search: recipientsSearch
		})])]), hasExternalGuests ? mithril_default(Card, { style: { padding: "0" } }, mithril_default(ToggleButton, {
			title: "confidential_action",
			onToggled: (_, e) => {
				whoModel.isConfidential = !whoModel.isConfidential;
				e.stopPropagation();
			},
			icon: whoModel.isConfidential ? Icons.Lock : Icons.Unlock,
			toggled: whoModel.isConfidential,
			size: ButtonSize.Normal
		})) : null]);
	}
	renderAttendeeStatus(model, organizer) {
		const { status } = organizer ?? { status: CalendarAttendeeStatus.TENTATIVE };
		const attendingOptions = createAttendingItems().filter((option) => option.selectable !== false);
		const attendingStatus = attendingOptions.find((option) => option.value === status);
		return mithril_default(".flex.flex-column.pl-vpad-s.pr-vpad-s", [mithril_default(Select, {
			onchange: (option) => {
				if (option.selectable === false) return;
				model.setOwnAttendance(option.value);
			},
			classes: ["button-min-height"],
			selected: attendingStatus,
			disabled: organizer == null,
			ariaLabel: lang.get("attending_label"),
			renderOption: (option) => mithril_default("button.items-center.flex-grow.state-bg.button-content.dropdown-button.pt-s.pb-s.button-min-height", {
				class: option.selectable === false ? `no-hover` : "",
				style: { color: option.value === status ? theme.content_button_selected : undefined }
			}, option.name),
			renderDisplay: (option) => mithril_default("", option.name),
			options: (0, import_stream$5.default)(attendingOptions),
			expanded: true,
			noIcon: organizer == null
		})]);
	}
	renderOrganizer(model, organizer) {
		const { whoModel } = model.editModels;
		if (!(whoModel.possibleOrganizers.length > 0 || organizer)) {
			console.log("Trying to access guest without organizer");
			return null;
		}
		const { address, name, status } = organizer ?? {};
		const hasGuest = whoModel.guests.length > 0;
		const isMe = organizer?.address === whoModel.ownGuest?.address;
		const editableOrganizer = whoModel.possibleOrganizers.length > 1 && isMe;
		const options = whoModel.possibleOrganizers.map((organizer$1) => {
			return {
				name: organizer$1.name,
				address: organizer$1.address,
				ariaValue: organizer$1.address,
				value: organizer$1.address
			};
		});
		const disabled = !editableOrganizer || !hasGuest;
		const selected = options.find((option) => option.address === address) ?? options[0];
		return mithril_default(".flex.col", [mithril_default("small.uppercase.pb-s.b.text-ellipsis", { style: { color: theme.navigation_button } }, lang.get("organizer_label")), mithril_default(Card, { style: { padding: `0` } }, [mithril_default(".flex.flex-column", [mithril_default(".flex.pl-vpad-s.pr-vpad-s", [mithril_default(Select, {
			classes: ["flex-grow", "button-min-height"],
			onchange: (option) => {
				const organizer$1 = whoModel.possibleOrganizers.find((organizer$2) => organizer$2.address === option.address);
				if (organizer$1) whoModel.addAttendee(organizer$1.address, null);
			},
			selected,
			disabled,
			ariaLabel: lang.get("organizer_label"),
			renderOption: (option) => mithril_default("button.items-center.flex-grow.state-bg.button-content.dropdown-button.pt-s.pb-s.button-min-height", { style: { color: selected.address === option.address ? theme.content_button_selected : undefined } }, option.address),
			renderDisplay: (option) => mithril_default("", option.name ? `${option.name} <${option.address}>` : option.address),
			options: (0, import_stream$5.default)(whoModel.possibleOrganizers.map((organizer$1) => {
				return {
					name: organizer$1.name,
					address: organizer$1.address,
					ariaValue: organizer$1.address,
					value: organizer$1.address
				};
			})),
			noIcon: disabled,
			expanded: true
		}), model.operation !== CalendarOperation.EditThis && organizer && !isMe ? mithril_default(IconButton, {
			title: "sendMail_alt",
			click: async () => (await import("./ContactView2-chunk.js")).writeMail(organizer, lang.get("repliedToEventInvite_msg", { "{event}": model.editModels.summary.content })),
			size: ButtonSize.Compact,
			icon: Icons.PencilSquare
		}) : null]), isMe && model.operation !== CalendarOperation.EditThis ? [mithril_default(Divider, { color: theme.button_bubble_bg }), this.renderAttendeeStatus(whoModel, organizer)] : null])])]);
	}
	renderSendUpdateCheckbox(whoModel) {
		return !whoModel.initiallyHadOtherAttendees || !whoModel.canModifyGuests ? null : mithril_default(Card, mithril_default(Switch, {
			checked: whoModel.shouldSendUpdates,
			onclick: (value) => whoModel.shouldSendUpdates = value,
			ariaLabel: lang.get("sendUpdates_label"),
			disabled: false,
			variant: "expanded"
		}, lang.get("sendUpdates_label")));
	}
	renderGuest(guest, { model }, password, strength) {
		const { whoModel } = model.editModels;
		const { address, name, status } = guest;
		const isMe = guest.address === whoModel.ownGuest?.address;
		const roleLabel = isMe ? `${lang.get("guest_label")} | ${lang.get("you_label")}` : lang.get("guest_label");
		const renderPasswordField = whoModel.isConfidential && password != null && guest.type === RecipientType.EXTERNAL;
		let rightContent = null;
		if (isMe) rightContent = mithril_default("", { style: { paddingRight: px(size.vpad_small) } }, this.renderAttendeeStatus(model.editModels.whoModel, guest));
else if (whoModel.canModifyGuests) rightContent = mithril_default(IconButton, {
			title: "remove_action",
			icon: Icons.Cancel,
			click: () => whoModel.removeAttendee(guest.address)
		});
		return mithril_default(Card, { style: { padding: `${px(size.vpad_small)} ${px(0)} ${px(size.vpad_small)} ${px(size.vpad_small)}` } }, mithril_default(".flex.flex-column.items-center", [mithril_default(".flex.items-center.flex-grow.full-width", [
			this.renderStatusIcon(status),
			mithril_default(".flex.flex-column.flex-grow.min-width-0", [mithril_default(".small", { style: { lineHeight: px(size.vpad_small) } }, roleLabel), mithril_default(".text-ellipsis", name.length > 0 ? `${name} ${address}` : address)]),
			rightContent
		]), renderPasswordField ? [mithril_default(".flex.full-width", { style: { padding: `0 0 ${px(size.vpad_xsm)} ${px(size.vpad_small + size.icon_size_medium_large)}` } }, mithril_default(Divider, { color: theme.button_bubble_bg })), this.renderPasswordField(address, password, strength ?? 0, whoModel)] : null]));
	}
	renderPasswordField(address, password, strength, whoModel) {
		const label = lang.get("passwordFor_label", { "{1}": address });
		return [mithril_default(".flex.flex-grow.full-width.justify-between.items-end", [mithril_default(".flex.flex-column.full-width", { style: {
			paddingLeft: px(size.hpad_medium + size.vpad_small),
			paddingRight: px((size.button_height - size.button_height_compact) / 2)
		} }, [mithril_default(PasswordInput, {
			ariaLabel: label,
			password,
			strength,
			oninput: (newPassword) => {
				whoModel.setPresharedPassword(address, newPassword);
			}
		})])])];
	}
	renderStatusIcon(status) {
		const icon = iconForAttendeeStatus[status];
		return mithril_default(Icon, {
			icon,
			size: IconSize.Large,
			class: "mr-s",
			style: { fill: theme.content_fg }
		});
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/pickers/TimePicker.ts
var import_stream$4 = __toESM(require_stream(), 1);
var TimePicker = class {
	values;
	focused;
	isExpanded = false;
	oldValue;
	value;
	amPm;
	constructor({ attrs }) {
		this.focused = false;
		this.value = "";
		this.amPm = attrs.timeFormat === TimeFormat.TWELVE_HOURS;
		const times = [];
		for (let hour = 0; hour < 24; hour++) for (let minute = 0; minute < 60; minute += 30) times.push(timeStringFromParts(hour, minute, this.amPm));
		this.oldValue = attrs.time?.toString(false) ?? "--";
		this.values = times;
	}
	view({ attrs }) {
		if (attrs.time) {
			const timeAsString = attrs.time?.toString(this.amPm) ?? "";
			if (!this.focused) this.value = timeAsString;
		}
		if (isApp()) return this.renderNativeTimePicker(attrs);
else return this.renderCustomTimePicker(attrs);
	}
	renderNativeTimePicker(attrs) {
		if (this.oldValue !== attrs.time?.toString(false)) this.onSelected(attrs);
		const timeAsString = attrs.time?.toString(false) ?? "";
		this.oldValue = timeAsString;
		this.value = timeAsString;
		const displayTime = attrs.time?.toString(this.amPm);
		return mithril_default(".rel", [mithril_default("input.fill-absolute.invisible.tutaui-button-outline", {
			disabled: attrs.disabled,
			type: TextFieldType.Time,
			style: {
				zIndex: 1,
				border: `2px solid ${theme.content_message_bg}`,
				width: "auto",
				height: "auto",
				appearance: "none",
				opacity: attrs.disabled ? .7 : 1
			},
			value: this.value,
			oninput: (event) => {
				const inputValue = event.target.value;
				if (this.value === inputValue) return;
				this.value = inputValue;
				attrs.onTimeSelected(Time.parseFromString(inputValue));
			}
		}), mithril_default(".tutaui-button-outline", {
			class: attrs.classes?.join(" "),
			style: {
				zIndex: "2",
				position: "inherit",
				borderColor: "transparent",
				pointerEvents: "none",
				padding: `${px(size.vpad_small)} 0`,
				opacity: attrs.disabled ? .7 : 1
			}
		}, displayTime)]);
	}
	renderCustomTimePicker(attrs) {
		const options = this.values.map((time) => ({
			value: time,
			name: time,
			ariaValue: time
		}));
		return mithril_default(Select, {
			onchange: (newValue) => {
				if (this.value === newValue.value) return;
				this.value = newValue.value;
				this.onSelected(attrs);
				mithril_default.redraw.sync();
			},
			onclose: () => {
				this.isExpanded = false;
			},
			selected: {
				value: this.value,
				name: this.value,
				ariaValue: this.value
			},
			ariaLabel: attrs.ariaLabel,
			disabled: attrs.disabled,
			options: (0, import_stream$4.default)(options),
			noIcon: true,
			expanded: true,
			tabIndex: Number(TabIndex.Programmatic),
			renderDisplay: () => this.renderTimeSelectInput(attrs),
			renderOption: (option) => this.renderTimeOptions(option),
			keepFocus: true
		});
	}
	renderTimeOptions(option) {
		return mithril_default("button.items-center.flex-grow", { class: "state-bg button-content dropdown-button pt-s pb-s button-min-height" }, option.name);
	}
	renderTimeSelectInput(attrs) {
		return mithril_default(SingleLineTextField, {
			classes: [
				...attrs.classes ?? [],
				"tutaui-button-outline",
				"text-center",
				"border-content-message-bg"
			],
			value: this.value,
			oninput: (val) => {
				if (this.value === val) return;
				this.value = val;
			},
			disabled: attrs.disabled,
			ariaLabel: attrs.ariaLabel,
			style: { textAlign: "center" },
			onclick: (e) => {
				e.stopImmediatePropagation();
				if (!this.isExpanded) {
					e.target.parentElement?.click();
					this.isExpanded = true;
				}
			},
			onfocus: (event) => {
				this.focused = true;
				if (!this.isExpanded) {
					event.target.parentElement?.click();
					this.isExpanded = true;
				}
			},
			onblur: (e) => {
				if (this.focused) this.onSelected(attrs);
				e.redraw = false;
			},
			type: TextFieldType.Text
		});
	}
	onSelected(attrs) {
		this.focused = false;
		attrs.onTimeSelected(Time.parseFromString(this.value));
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/eventeditor-view/EventTimeEditor.ts
var EventTimeEditor = class {
	view(vnode) {
		const { attrs } = vnode;
		const { startOfTheWeekOffset, editModel, timeFormat, disabled } = attrs;
		const appClasses = isApp() ? ["smaller"] : [];
		return mithril_default(".flex", [mithril_default(".flex.col.flex-grow.gap-vpad-s", [mithril_default(".flex.gap-vpad-s.items-center.pr-vpad-s", [mithril_default(Icon, {
			icon: Icons.Time,
			style: { fill: theme.content_fg },
			title: lang.get("timeSection_label"),
			size: IconSize.Medium
		}), mithril_default(Switch, {
			checked: editModel.isAllDay,
			onclick: (value) => editModel.isAllDay = value,
			ariaLabel: lang.get("allDay_label"),
			disabled,
			variant: "expanded"
		}, lang.get("allDay_label"))]), mithril_default(".flex.col.full-width.flex-grow.gap-vpad-s", { style: { paddingLeft: px(size.icon_size_large + size.vpad_small) } }, [mithril_default(Divider, { color: theme.button_bubble_bg }), mithril_default(".time-selection-grid.pr-vpad-s", [
			mithril_default("", lang.get("dateFrom_label")),
			mithril_default(`${isApp() ? "" : ".pl-vpad-l"}`, mithril_default(DatePicker, {
				classes: appClasses,
				date: attrs.editModel.startDate,
				onDateSelected: (date) => date && (editModel.startDate = date),
				startOfTheWeekOffset,
				label: "dateFrom_label",
				useInputButton: true,
				disabled: attrs.disabled
			})),
			mithril_default("", mithril_default(TimePicker, {
				classes: appClasses,
				time: editModel.startTime,
				onTimeSelected: (time) => editModel.startTime = time,
				timeFormat,
				disabled: attrs.disabled || attrs.editModel.isAllDay,
				ariaLabel: lang.get("startTime_label")
			})),
			mithril_default("", lang.get("dateTo_label")),
			mithril_default(`${isApp() ? "" : ".pl-vpad-l"}`, mithril_default(DatePicker, {
				classes: appClasses,
				date: attrs.editModel.endDate,
				onDateSelected: (date) => date && (editModel.endDate = date),
				startOfTheWeekOffset,
				label: "dateTo_label",
				useInputButton: true,
				disabled: attrs.disabled
			})),
			mithril_default("", mithril_default(TimePicker, {
				classes: appClasses,
				time: editModel.endTime,
				onTimeSelected: (time) => editModel.endTime = time,
				timeFormat,
				disabled: attrs.disabled || attrs.editModel.isAllDay,
				ariaLabel: lang.get("endTime_label")
			}))
		])])])]);
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/RemindersEditor.ts
var import_stream$3 = __toESM(require_stream(), 1);
var RemindersEditor = class {
	view(vnode) {
		const { addAlarm, removeAlarm, alarms, useNewEditor } = vnode.attrs;
		const addNewAlarm = (newAlarm) => {
			const hasAlarm = alarms.find((alarm) => deepEqual(alarm, newAlarm));
			if (hasAlarm) return;
			addAlarm(newAlarm);
		};
		return useNewEditor ? this.renderNewEditor(alarms, removeAlarm, addNewAlarm, addAlarm) : this.renderOldEditor(alarms, removeAlarm, addNewAlarm, vnode);
	}
	renderOldEditor(alarms, removeAlarm, addNewAlarm, vnode) {
		const textFieldAttrs = alarms.map((a) => ({
			value: humanDescriptionForAlarmInterval(a, lang.languageTag),
			label: "emptyString_msg",
			isReadOnly: true,
			injectionsRight: () => mithril_default(IconButton, {
				title: "delete_action",
				icon: Icons.Cancel,
				click: () => removeAlarm(a)
			})
		}));
		textFieldAttrs.push({
			value: lang.get("add_action"),
			label: "emptyString_msg",
			isReadOnly: true,
			injectionsRight: () => mithril_default(IconButton, attachDropdown({
				mainButtonAttrs: {
					title: "add_action",
					icon: Icons.Add
				},
				childAttrs: () => [...createAlarmIntervalItems(lang.languageTag).map((i) => ({
					label: lang.makeTranslation(i.name, i.name),
					click: () => addNewAlarm(i.value)
				})), {
					label: "calendarReminderIntervalDropdownCustomItem_label",
					click: () => {
						this.showCustomReminderIntervalDialog((value, unit) => {
							addNewAlarm({
								value,
								unit
							});
						});
					}
				}]
			}))
		});
		textFieldAttrs[0].label = vnode.attrs.label;
		return mithril_default(".flex.col.flex-half.pl-s", textFieldAttrs.map((a) => mithril_default(TextField, a)));
	}
	renderNewEditor(alarms, removeAlarm, addNewAlarm, addAlarm) {
		const alarmOptions = createAlarmIntervalItems(lang.languageTag).map((alarm) => ({
			text: alarm.name,
			value: alarm.value,
			ariaValue: alarm.name
		}));
		alarmOptions.push({
			text: lang.get("calendarReminderIntervalDropdownCustomItem_label"),
			ariaValue: lang.get("calendarReminderIntervalDropdownCustomItem_label"),
			value: {
				value: -1,
				unit: AlarmIntervalUnit.MINUTE
			}
		});
		const defaultSelected = {
			text: lang.get("addReminder_label"),
			value: {
				value: -2,
				unit: AlarmIntervalUnit.MINUTE
			},
			ariaValue: lang.get("addReminder_label")
		};
		return mithril_default("ul.unstyled-list.flex.col.flex-grow.gap-vpad-s", [alarms.map((alarm) => mithril_default("li.flex.justify-between.flew-grow.items-center.gap-vpad-s", [mithril_default("span.flex.justify-between", humanDescriptionForAlarmInterval(alarm, lang.languageTag)), mithril_default(BaseButton, {
			label: lang.makeTranslation("delete_action", `${lang.get("delete_action")} ${humanDescriptionForAlarmInterval(alarm, lang.languageTag)}`),
			onclick: () => removeAlarm(alarm),
			class: "flex items-center"
		}, mithril_default(Icon, {
			icon: Icons.Cancel,
			size: IconSize.Medium,
			style: { fill: getColors(ButtonColor.Content).button }
		}))])), mithril_default("li.items-center", mithril_default(Select, {
			ariaLabel: lang.get("calendarReminderIntervalValue_label"),
			selected: defaultSelected,
			options: (0, import_stream$3.default)(alarmOptions),
			renderOption: (option) => this.renderReminderOptions(option, false, false),
			renderDisplay: (option) => this.renderReminderOptions(option, alarms.length > 0, true),
			onchange: (newValue) => {
				if (newValue.value.value === -1) return setTimeout(() => {
					this.showCustomReminderIntervalDialog((value, unit) => {
						addNewAlarm({
							value,
							unit
						});
					});
				}, 0);
				addAlarm(newValue.value);
			},
			expanded: true,
			iconColor: getColors(ButtonColor.Content).button,
			noIcon: true
		}))]);
	}
	renderReminderOptions(option, hasAlarms, isDisplay) {
		return mithril_default("button.items-center.flex-grow", {
			tabIndex: isDisplay ? TabIndex.Programmatic : undefined,
			class: isDisplay ? `flex ${hasAlarms ? "text-fade" : ""}` : "state-bg button-content button-min-height dropdown-button pt-s pb-s"
		}, option.text);
	}
	showCustomReminderIntervalDialog(onAddAction) {
		let timeReminderValue = 0;
		let timeReminderUnit = AlarmIntervalUnit.MINUTE;
		Dialog.showActionDialog({
			title: "calendarReminderIntervalCustomDialog_title",
			allowOkWithReturn: true,
			child: { view: () => {
				const unitItems = createCustomRepeatRuleUnitValues() ?? [];
				return mithril_default(".flex full-width pt-s", [mithril_default(TextField, {
					type: TextFieldType.Number,
					min: 0,
					label: "calendarReminderIntervalValue_label",
					value: timeReminderValue.toString(),
					oninput: (v) => {
						const time = Number.parseInt(v);
						const isEmpty = v === "";
						if (!Number.isNaN(time) || isEmpty) timeReminderValue = isEmpty ? 0 : Math.abs(time);
					},
					class: "flex-half no-appearance"
				}), mithril_default(DropDownSelector, {
					label: "emptyString_msg",
					selectedValue: timeReminderUnit,
					items: unitItems,
					class: "flex-half pl-s",
					selectionChangedHandler: (selectedValue) => timeReminderUnit = selectedValue,
					disabled: false
				})]);
			} },
			okActionTextId: "add_action",
			okAction: (dialog) => {
				onAddAction(timeReminderValue, timeReminderUnit);
				dialog.close();
			}
		});
	}
};

//#endregion
//#region src/common/gui/base/RadioGroup.ts
var RadioGroup = class {
	view({ attrs }) {
		return mithril_default("ul.unstyled-list.flex.col.gap-vpad", {
			ariaLabel: lang.getTranslationText(attrs.ariaLabel),
			role: AriaRole.RadioGroup
		}, attrs.options.map((option) => this.renderOption(attrs.name, option, attrs.selectedOption, attrs.classes?.join(" "), attrs.onOptionSelected, attrs.injectionMap)));
	}
	renderOption(groupName, option, selectedOption, optionClass, onOptionSelected, injectionMap) {
		const name = lang.getTranslationText(groupName);
		const valueString = String(option.value);
		const isSelected = option.value === selectedOption;
		const optionId = `${name}-${valueString}`;
		return mithril_default("li.flex.gap-vpad.cursor-pointer.full-width.flash", {
			class: optionClass ?? "",
			onclick: () => {
				console.log("Clicked?");
				onOptionSelected(option.value);
			}
		}, [mithril_default("input[type=radio].m-0.big-radio.content-accent-accent", {
			name: lang.getTranslationText(groupName),
			value: valueString,
			id: optionId,
			checked: isSelected ? true : null,
			onkeydown: (event) => {
				if (isKeyPressed(event.key, Keys.RETURN)) onOptionSelected(option.value);
				return true;
			}
		}), mithril_default(".flex.flex-column.full-width", [mithril_default("label.cursor-pointer", { for: optionId }, lang.getTranslationText(option.name)), this.getInjection(String(option.value), injectionMap)])]);
	}
	getInjection(key, injectionMap) {
		if (!injectionMap || !injectionMap.has(key)) return null;
		return injectionMap.get(key);
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/eventeditor-view/RepeatRuleEditor.ts
var import_stream$2 = __toESM(require_stream(), 1);
var RepeatRuleEditor = class {
	repeatRuleType = null;
	repeatInterval = 0;
	intervalOptions = (0, import_stream$2.default)([]);
	intervalExpanded = false;
	numberValues = createIntervalValues();
	occurrencesOptions = (0, import_stream$2.default)([]);
	occurrencesExpanded = false;
	repeatOccurrences;
	constructor({ attrs }) {
		if (attrs.model.repeatPeriod != null) this.repeatRuleType = this.getRepeatType(attrs.model.repeatPeriod, attrs.model.repeatInterval, attrs.model.repeatEndType);
		this.intervalOptions(this.numberValues);
		this.occurrencesOptions(this.numberValues);
		this.repeatInterval = attrs.model.repeatInterval;
		this.repeatOccurrences = attrs.model.repeatEndOccurrences;
	}
	getRepeatType(period, interval, endTime) {
		if (interval > 1 || endTime !== EndType.Never) return "CUSTOM";
		return period;
	}
	view({ attrs }) {
		const customRuleOptions = customFrequenciesOptions.map((option) => ({
			...option,
			name: attrs.model.repeatInterval > 1 ? option.name.plural : option.name.singular
		}));
		return mithril_default(".pb.pt.flex.col.gap-vpad.fit-height", {
			class: this.repeatRuleType === "CUSTOM" ? "box-content" : "",
			style: { width: px(attrs.width) }
		}, [
			mithril_default(Card, { style: { padding: `${size.vpad}px` } }, mithril_default(RadioGroup, {
				ariaLabel: "calendarRepeating_label",
				name: "calendarRepeating_label",
				options: createRepeatRuleOptions(),
				selectedOption: this.repeatRuleType,
				onOptionSelected: (option) => {
					this.repeatRuleType = option;
					if (option === "CUSTOM") attrs.model.repeatPeriod = attrs.model.repeatPeriod ?? RepeatPeriod.DAILY;
else {
						attrs.model.repeatInterval = 1;
						attrs.model.repeatEndType = EndType.Never;
						attrs.model.repeatPeriod = option;
						attrs.backAction();
					}
				},
				classes: ["cursor-pointer"]
			})),
			this.renderFrequencyOptions(attrs, customRuleOptions),
			this.renderEndOptions(attrs)
		]);
	}
	renderEndOptions(attrs) {
		if (this.repeatRuleType !== "CUSTOM") return null;
		return mithril_default(".flex.col", [mithril_default("small.uppercase.pb-s.b.text-ellipsis", { style: { color: theme.navigation_button } }, lang.get("calendarRepeatStopCondition_label")), mithril_default(Card, {
			style: { padding: `${size.vpad}px` },
			classes: [
				"flex",
				"col",
				"gap-vpad-s"
			]
		}, [mithril_default(RadioGroup, {
			ariaLabel: "calendarRepeatStopCondition_label",
			name: "calendarRepeatStopCondition_label",
			options: createCustomEndTypeOptions(),
			selectedOption: attrs.model.repeatEndType,
			onOptionSelected: (option) => {
				attrs.model.repeatEndType = option;
			},
			classes: ["cursor-pointer"],
			injectionMap: this.buildInjections(attrs)
		})])]);
	}
	renderFrequencyOptions(attrs, customRuleOptions) {
		if (this.repeatRuleType !== "CUSTOM") return null;
		return mithril_default(".flex.col", [mithril_default("small.uppercase.pb-s.b.text-ellipsis", { style: { color: theme.navigation_button } }, lang.get("intervalFrequency_label")), mithril_default(Card, {
			style: { padding: `0 0 ${size.vpad}px` },
			classes: ["flex", "col"]
		}, [
			this.renderIntervalPicker(attrs),
			mithril_default(Divider, {
				color: theme.button_bubble_bg,
				style: { margin: `0 0 ${size.vpad}px` }
			}),
			mithril_default(RadioGroup, {
				ariaLabel: "intervalFrequency_label",
				name: "intervalFrequency_label",
				options: customRuleOptions,
				selectedOption: attrs.model.repeatPeriod,
				onOptionSelected: (option) => {
					this.updateCustomRule(attrs.model, { intervalFrequency: option });
				},
				classes: [
					"cursor-pointer",
					"capitalize",
					"pl-vpad-m",
					"pr-vpad-m"
				]
			})
		])]);
	}
	buildInjections(attrs) {
		const injectionMap = new Map();
		injectionMap.set(EndType.Count, this.renderEndsPicker(attrs));
		injectionMap.set(EndType.UntilDate, mithril_default(DatePicker, {
			date: attrs.model.repeatEndDateForDisplay,
			onDateSelected: (date) => date && (attrs.model.repeatEndDateForDisplay = date),
			label: "endDate_label",
			useInputButton: true,
			startOfTheWeekOffset: attrs.startOfTheWeekOffset,
			position: PickerPosition.TOP,
			classes: [
				"full-width",
				"flex-grow",
				attrs.model.repeatEndType !== EndType.UntilDate ? "disabled" : ""
			]
		}));
		return injectionMap;
	}
	updateCustomRule(whenModel, customRule) {
		const { interval, intervalFrequency } = customRule;
		if (interval && !isNaN(interval)) whenModel.repeatInterval = interval;
		if (intervalFrequency) whenModel.repeatPeriod = intervalFrequency;
	}
	renderIntervalPicker(attrs) {
		return mithril_default(Select, {
			onchange: (newValue) => {
				if (this.repeatInterval === newValue.value) return;
				this.repeatInterval = newValue.value;
				this.updateCustomRule(attrs.model, { interval: this.repeatInterval });
				mithril_default.redraw.sync();
			},
			onclose: () => {
				this.intervalExpanded = false;
				this.intervalOptions(this.numberValues);
			},
			selected: {
				value: this.repeatInterval,
				name: this.repeatInterval.toString(),
				ariaValue: this.repeatInterval.toString()
			},
			ariaLabel: lang.get("repeatsEvery_label"),
			options: this.intervalOptions,
			noIcon: true,
			expanded: true,
			tabIndex: isApp() ? Number(TabIndex.Default) : Number(TabIndex.Programmatic),
			classes: ["no-appearance"],
			renderDisplay: () => mithril_default(SingleLineTextField, {
				classes: ["border-radius-bottom-0"],
				value: isNaN(this.repeatInterval) ? "" : this.repeatInterval.toString(),
				inputMode: isApp() ? InputMode.NONE : InputMode.TEXT,
				readonly: isApp(),
				oninput: (val) => {
					if (val !== "" && this.repeatInterval === Number(val)) return;
					this.repeatInterval = val === "" ? NaN : Number(val);
					if (!isNaN(this.repeatInterval)) {
						this.intervalOptions(this.numberValues.filter((opt) => opt.value.toString().startsWith(val)));
						this.updateCustomRule(attrs.model, { interval: this.repeatInterval });
					} else this.intervalOptions(this.numberValues);
				},
				ariaLabel: lang.get("repeatsEvery_label"),
				onclick: (e) => {
					e.stopImmediatePropagation();
					if (!this.intervalExpanded) {
						e.target.parentElement?.click();
						this.intervalExpanded = true;
					}
				},
				onfocus: (event) => {
					if (!this.intervalExpanded) {
						event.target.parentElement?.click();
						this.intervalExpanded = true;
					}
				},
				onblur: (event) => {
					if (isNaN(this.repeatInterval)) {
						this.repeatInterval = this.numberValues[0].value;
						this.updateCustomRule(attrs.model, { interval: this.repeatInterval });
					} else if (this.repeatInterval === 0) {
						this.repeatInterval = this.numberValues[0].value;
						this.updateCustomRule(attrs.model, { interval: this.repeatInterval });
					}
				},
				style: { textAlign: "center" },
				max: 256,
				min: 1,
				type: TextFieldType.Number
			}),
			renderOption: (option) => mithril_default("button.items-center.flex-grow", { class: "state-bg button-content dropdown-button pt-s pb-s button-min-height" }, option.name),
			keepFocus: true
		});
	}
	renderEndsPicker(attrs) {
		return mithril_default(Select, {
			onchange: (newValue) => {
				if (this.repeatOccurrences === newValue.value) return;
				this.repeatOccurrences = newValue.value;
				attrs.model.repeatEndOccurrences = newValue.value;
			},
			onclose: () => {
				this.occurrencesExpanded = false;
				this.occurrencesOptions(this.numberValues);
			},
			selected: {
				value: this.repeatOccurrences,
				name: this.repeatOccurrences.toString(),
				ariaValue: this.repeatOccurrences.toString()
			},
			ariaLabel: lang.get("occurrencesCount_label"),
			options: this.occurrencesOptions,
			noIcon: true,
			expanded: true,
			tabIndex: isApp() ? Number(TabIndex.Default) : Number(TabIndex.Programmatic),
			classes: ["no-appearance"],
			renderDisplay: () => mithril_default(SingleLineTextField, {
				classes: [
					"tutaui-button-outline",
					"text-center",
					"border-content-message-bg"
				],
				value: isNaN(this.repeatOccurrences) ? "" : this.repeatOccurrences.toString(),
				inputMode: isApp() ? InputMode.NONE : InputMode.TEXT,
				readonly: isApp(),
				oninput: (val) => {
					if (val !== "" && this.repeatOccurrences === Number(val)) return;
					this.repeatOccurrences = val === "" ? NaN : Number(val);
					if (!isNaN(this.repeatOccurrences)) {
						this.occurrencesOptions(this.numberValues.filter((opt) => opt.value.toString().startsWith(val)));
						attrs.model.repeatEndOccurrences = this.repeatOccurrences;
					} else this.occurrencesOptions(this.numberValues);
				},
				ariaLabel: lang.get("occurrencesCount_label"),
				style: { textAlign: "center" },
				onclick: (e) => {
					e.stopImmediatePropagation();
					if (!this.occurrencesExpanded) {
						e.target.parentElement?.click();
						this.occurrencesExpanded = true;
					}
				},
				onfocus: (event) => {
					if (!this.occurrencesExpanded) {
						event.target.parentElement?.click();
						this.occurrencesExpanded = true;
					}
				},
				onblur: (event) => {
					if (isNaN(this.repeatOccurrences)) {
						this.repeatOccurrences = this.numberValues[0].value;
						attrs.model.repeatEndOccurrences = this.repeatOccurrences;
					} else if (this.repeatOccurrences === 0) {
						this.repeatOccurrences = this.numberValues[0].value;
						attrs.model.repeatEndOccurrences = this.repeatOccurrences;
					}
				},
				max: 256,
				min: 1,
				type: TextFieldType.Number
			}),
			renderOption: (option) => mithril_default("button.items-center.flex-grow", { class: "state-bg button-content dropdown-button pt-s pb-s button-min-height" }, option.name),
			keepFocus: true
		});
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/eventeditor-view/CalendarEventEditView.ts
var import_stream$1 = __toESM(require_stream(), 1);
let EditorPages = function(EditorPages$1) {
	EditorPages$1[EditorPages$1["MAIN"] = 0] = "MAIN";
	EditorPages$1[EditorPages$1["REPEAT_RULES"] = 1] = "REPEAT_RULES";
	EditorPages$1[EditorPages$1["GUESTS"] = 2] = "GUESTS";
	return EditorPages$1;
}({});
var CalendarEventEditView = class {
	timeFormat;
	startOfTheWeekOffset;
	defaultAlarms;
	transitionPage = null;
	hasAnimationEnded = true;
	pages = new Map();
	pagesWrapperDomElement;
	allowRenderMainPage = (0, import_stream$1.default)(true);
	dialogHeight = null;
	pageWidth = -1;
	translate = 0;
	constructor(vnode) {
		this.timeFormat = vnode.attrs.timeFormat;
		this.startOfTheWeekOffset = vnode.attrs.startOfTheWeekOffset;
		this.defaultAlarms = vnode.attrs.defaultAlarms;
		if (vnode.attrs.model.operation == CalendarOperation.Create) {
			const initialAlarms = vnode.attrs.defaultAlarms.get(vnode.attrs.model.editModels.whoModel.selectedCalendar.group._id) ?? [];
			vnode.attrs.model.editModels.alarmModel.addAll(initialAlarms);
		}
		this.pages.set(EditorPages.REPEAT_RULES, this.renderRepeatRulesPage);
		this.pages.set(EditorPages.GUESTS, this.renderGuestsPage);
		vnode.attrs.currentPage.map((page) => {
			this.hasAnimationEnded = false;
			if (page === EditorPages.MAIN) {
				this.allowRenderMainPage(true);
				this.translate = 0;
			}
		});
		this.allowRenderMainPage.map((allowRendering) => {
			return this.handleEditorStatus(allowRendering, vnode);
		});
	}
	onremove(vnode) {
		vnode.attrs.currentPage.end(true);
		this.allowRenderMainPage.end(true);
	}
	handleEditorStatus(allowRendering, vnode) {
		if (allowRendering && vnode.attrs.currentPage() === EditorPages.MAIN) {
			if (vnode.attrs.descriptionEditor.editor.domElement) vnode.attrs.descriptionEditor.editor.domElement.tabIndex = Number(TabIndex.Default);
			return vnode.attrs.descriptionEditor.setEnabled(true);
		}
		if (vnode.attrs.descriptionEditor.editor.domElement) vnode.attrs.descriptionEditor.editor.domElement.tabIndex = Number(TabIndex.Programmatic);
		vnode.attrs.descriptionEditor.setEnabled(false);
	}
	oncreate(vnode) {
		this.pagesWrapperDomElement = vnode.dom;
		this.pagesWrapperDomElement.addEventListener("transitionend", () => {
			if (vnode.attrs.currentPage() !== EditorPages.MAIN) {
				setTimeout(() => {
					this.allowRenderMainPage(false);
				}, DefaultAnimationTime);
				mithril_default.redraw();
				return;
			}
			this.transitionPage = vnode.attrs.currentPage();
			this.hasAnimationEnded = true;
			setTimeout(() => {
				this.allowRenderMainPage(true);
				mithril_default.redraw();
			}, DefaultAnimationTime);
		});
	}
	onupdate(vnode) {
		const dom = vnode.dom;
		if (this.dialogHeight == null && dom.parentElement) {
			this.dialogHeight = dom.parentElement.clientHeight;
			vnode.dom.style.height = px(this.dialogHeight);
		}
		if (this.pageWidth == -1 && dom.parentElement) {
			this.pageWidth = dom.parentElement.clientWidth - size.hpad_large * 2;
			vnode.dom.style.width = px(this.pageWidth * 2 + size.vpad_xxl);
			mithril_default.redraw();
		}
	}
	view(vnode) {
		return mithril_default(".flex.gap-vpad-xxl.fit-content.transition-transform", { style: { transform: `translateX(${this.translate}px)` } }, [this.renderMainPage(vnode), this.renderPage(vnode)]);
	}
	renderPage(vnode) {
		if (this.hasAnimationEnded || this.transitionPage == null) return this.pages.get(vnode.attrs.currentPage())?.apply(this, [vnode]);
		return this.pages.get(this.transitionPage)?.apply(this, [vnode]);
	}
	renderGuestsPage({ attrs: { model, recipientsSearch } }) {
		return mithril_default(AttendeeListEditor, {
			recipientsSearch,
			logins: locator.logins,
			model,
			width: this.pageWidth
		});
	}
	renderTitle(attrs) {
		const { model } = attrs;
		return mithril_default(Card, { style: { padding: "0" } }, mithril_default(SingleLineTextField, {
			value: model.editModels.summary.content,
			oninput: (newValue) => {
				model.editModels.summary.content = newValue;
			},
			ariaLabel: lang.get("title_placeholder"),
			placeholder: lang.get("title_placeholder"),
			disabled: !model.isFullyWritable(),
			style: { fontSize: px(size.font_size_base * 1.25) },
			type: TextFieldType.Text
		}));
	}
	renderReadonlyMessage(attrs) {
		const { model } = attrs;
		const makeMessage = (message) => mithril_default(InfoBanner, {
			message: () => mithril_default(".small.selectable", lang.get(message)),
			icon: Icons.People,
			type: BannerType.Info,
			buttons: []
		});
		switch (model.getReadonlyReason()) {
			case ReadonlyReason.SHARED: return makeMessage("cannotEditFullEvent_msg");
			case ReadonlyReason.SINGLE_INSTANCE: return makeMessage("cannotEditSingleInstance_msg");
			case ReadonlyReason.NOT_ORGANIZER: return makeMessage("cannotEditNotOrganizer_msg");
			case ReadonlyReason.UNKNOWN: return makeMessage("cannotEditEvent_msg");
			case ReadonlyReason.NONE: return null;
		}
	}
	renderEventTimeEditor(attrs) {
		const padding = px(size.vpad_small);
		return mithril_default(Card, { style: { padding: `${padding} 0 ${padding} ${padding}` } }, mithril_default(EventTimeEditor, {
			editModel: attrs.model.editModels.whenModel,
			timeFormat: this.timeFormat,
			startOfTheWeekOffset: this.startOfTheWeekOffset,
			disabled: !attrs.model.isFullyWritable()
		}));
	}
	renderRepeatRuleNavButton({ model, navigationCallback }) {
		const disabled = !model.canEditSeries();
		return mithril_default(Card, { classes: [
			"button-min-height",
			"flex",
			"items-center"
		] }, mithril_default(".flex.gap-vpad-s.items-center.flex-grow", [mithril_default(".flex.items-center", [mithril_default(Icon, {
			icon: Icons.Sync,
			style: { fill: getColors(ButtonColor.Content).button },
			title: lang.get("calendarRepeating_label"),
			size: IconSize.Medium
		})]), mithril_default("button.flex.items-center.justify-between.flex-grow.flash", {
			onclick: (event) => {
				this.transitionTo(EditorPages.REPEAT_RULES, navigationCallback);
			},
			disabled,
			class: disabled ? "disabled cursor-disabled" : ""
		}, [this.getTranslatedRepeatRule(model.editModels.whenModel.result.repeatRule, model.editModels.whenModel.isAllDay), mithril_default(Icon, {
			icon: Icons.ArrowForward,
			class: "flex items-center",
			style: { fill: getColors(ButtonColor.Content).button },
			title: lang.get("calendarRepeating_label"),
			size: IconSize.Medium
		})])]));
	}
	transitionTo(target, navigationCallback) {
		this.hasAnimationEnded = false;
		this.transitionPage = target;
		this.translate = -(this.pageWidth + size.vpad_xxl);
		navigationCallback(target);
	}
	renderGuestsNavButton({ navigationCallback, model }) {
		return mithril_default(Card, { classes: [
			"button-min-height",
			"flex",
			"items-center"
		] }, mithril_default(".flex.gap-vpad-s.flash.items-center.flex-grow", [mithril_default(".flex.items-center", [mithril_default(Icon, {
			icon: Icons.People,
			style: { fill: getColors(ButtonColor.Content).button },
			title: lang.get("calendarRepeating_label"),
			size: IconSize.Medium
		})]), mithril_default("button.flex.items-center.justify-between.flex-grow.flash", { onclick: (event) => {
			this.transitionTo(EditorPages.GUESTS, navigationCallback);
		} }, [lang.get("guests_label"), mithril_default(".flex", [model.editModels.whoModel.guests.length > 0 ? mithril_default("span", model.editModels.whoModel.guests.length) : null, mithril_default(Icon, {
			icon: Icons.ArrowForward,
			class: "flex items-center",
			style: { fill: getColors(ButtonColor.Content).button },
			title: lang.get("guests_label"),
			size: IconSize.Medium
		})])])]));
	}
	renderCalendarPicker(vnode) {
		const { model, groupColors } = vnode.attrs;
		const availableCalendars = model.editModels.whoModel.getAvailableCalendars();
		const options = availableCalendars.map((calendarInfo) => {
			const name = getSharedGroupName(calendarInfo.groupInfo, model.userController, calendarInfo.shared);
			return {
				name,
				color: "#" + (groupColors.get(calendarInfo.group._id) ?? defaultCalendarColor),
				value: calendarInfo,
				ariaValue: name
			};
		});
		const selectedCalendarInfo = model.editModels.whoModel.selectedCalendar;
		const selectedCalendarName = getSharedGroupName(selectedCalendarInfo.groupInfo, model.userController, selectedCalendarInfo.shared);
		let selected = {
			name: selectedCalendarName,
			color: "#" + (groupColors.get(selectedCalendarInfo.group._id) ?? defaultCalendarColor),
			value: model.editModels.whoModel.selectedCalendar,
			ariaValue: selectedCalendarName
		};
		return mithril_default(Card, { style: { padding: "0" } }, mithril_default(Select, {
			onchange: (val) => {
				model.editModels.alarmModel.removeAll();
				model.editModels.alarmModel.addAll(this.defaultAlarms.get(val.value.group._id) ?? []);
				model.editModels.whoModel.selectedCalendar = val.value;
			},
			options: (0, import_stream$1.default)(options),
			expanded: true,
			selected,
			classes: [
				"button-min-height",
				"pl-vpad-s",
				"pr-vpad-s"
			],
			renderOption: (option) => this.renderCalendarOptions(option, deepEqual(option.value, selected.value), false),
			renderDisplay: (option) => this.renderCalendarOptions(option, false, true),
			ariaLabel: lang.get("calendar_label"),
			disabled: !model.canChangeCalendar() || availableCalendars.length < 2
		}));
	}
	renderCalendarOptions(option, isSelected, isDisplay) {
		return mithril_default(".flex.items-center.gap-vpad-s.flex-grow", { class: `${isDisplay ? "" : "state-bg plr-button button-content dropdown-button pt-s pb-s button-min-height"}` }, [mithril_default("div", { style: {
			width: px(size.hpad_large),
			height: px(size.hpad_large),
			borderRadius: "50%",
			backgroundColor: option.color,
			marginInline: px(size.vpad_xsm / 2)
		} }), mithril_default("span", { style: { color: isSelected ? theme.content_button_selected : undefined } }, option.name)]);
	}
	renderRemindersEditor(vnode) {
		if (!vnode.attrs.model.editModels.alarmModel.canEditReminders) return null;
		const { alarmModel } = vnode.attrs.model.editModels;
		return mithril_default(Card, { classes: [
			"button-min-height",
			"flex",
			"items-center"
		] }, mithril_default(".flex.gap-vpad-s.items-start.flex-grow", [mithril_default(".flex", { class: alarmModel.alarms.length === 0 ? "items-center" : "items-start" }, [mithril_default(Icon, {
			icon: Icons.Clock,
			style: { fill: getColors(ButtonColor.Content).button },
			title: lang.get("reminderBeforeEvent_label"),
			size: IconSize.Medium
		})]), mithril_default(RemindersEditor, {
			alarms: alarmModel.alarms,
			addAlarm: alarmModel.addAlarm.bind(alarmModel),
			removeAlarm: alarmModel.removeAlarm.bind(alarmModel),
			label: "reminderBeforeEvent_label",
			useNewEditor: true
		})]));
	}
	renderLocationField(vnode) {
		const { model } = vnode.attrs;
		return mithril_default(Card, { style: { padding: "0" } }, mithril_default(".flex.gap-vpad-s.items-center", mithril_default(SingleLineTextField, {
			value: model.editModels.location.content,
			oninput: (newValue) => {
				model.editModels.location.content = newValue;
			},
			classes: ["button-min-height"],
			ariaLabel: lang.get("location_label"),
			placeholder: lang.get("location_label"),
			disabled: !model.isFullyWritable(),
			leadingIcon: {
				icon: Icons.Pin,
				color: getColors(ButtonColor.Content).button
			},
			type: TextFieldType.Text
		})));
	}
	renderDescriptionEditor(vnode) {
		return mithril_default(Card, {
			classes: ["child-text-editor", "rel"],
			style: { padding: "0" }
		}, [vnode.attrs.descriptionEditor.isEmpty() && !vnode.attrs.descriptionEditor.isActive() ? mithril_default("span.text-editor-placeholder", lang.get("description_label")) : null, mithril_default(vnode.attrs.descriptionEditor)]);
	}
	renderMainPage(vnode) {
		return mithril_default(".pb.pt.flex.col.gap-vpad.fit-height.box-content", { style: {
			transform: "translate(0)",
			color: theme.button_bubble_fg,
			"pointer-events": `${this.allowRenderMainPage() ? "auto" : "none"}`,
			width: px(this.pageWidth)
		} }, [this.allowRenderMainPage() ? mithril_default.fragment({}, [
			this.renderReadonlyMessage(vnode.attrs),
			this.renderTitle(vnode.attrs),
			this.renderEventTimeEditor(vnode.attrs),
			this.renderCalendarPicker(vnode),
			this.renderRepeatRuleNavButton(vnode.attrs),
			this.renderRemindersEditor(vnode),
			this.renderGuestsNavButton(vnode.attrs),
			this.renderLocationField(vnode)
		]) : null, this.renderDescriptionEditor(vnode)]);
	}
	renderRepeatRulesPage({ attrs: { model, navigationCallback } }) {
		const { whenModel } = model.editModels;
		return mithril_default(RepeatRuleEditor, {
			model: whenModel,
			startOfTheWeekOffset: this.startOfTheWeekOffset,
			width: this.pageWidth,
			backAction: () => navigationCallback(EditorPages.MAIN)
		});
	}
	getTranslatedRepeatRule(rule, isAllDay) {
		if (rule == null) return lang.get("calendarRepeatIntervalNoRepeat_label");
		const frequency = formatRepetitionFrequency(rule);
		return frequency ? frequency + formatRepetitionEnd(rule, isAllDay) : lang.get("unknownRepetition_msg");
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/eventeditor-view/CalendarEventEditDialog.ts
var import_stream = __toESM(require_stream(), 1);
var ConfirmationResult = function(ConfirmationResult$1) {
	ConfirmationResult$1[ConfirmationResult$1["Cancel"] = 0] = "Cancel";
	ConfirmationResult$1[ConfirmationResult$1["Continue"] = 1] = "Continue";
	return ConfirmationResult$1;
}(ConfirmationResult || {});
var EventEditorDialog = class {
	currentPage = (0, import_stream.default)(EditorPages.MAIN);
	dialog = null;
	headerDom = null;
	constructor() {}
	left() {
		if (this.currentPage() === EditorPages.MAIN) return [{
			label: "cancel_action",
			click: () => this.dialog?.close(),
			type: ButtonType.Secondary
		}];
		return [{
			label: "back_action",
			click: () => this.currentPage(EditorPages.MAIN),
			type: ButtonType.Secondary
		}];
	}
	right(okAction) {
		if (this.currentPage() === EditorPages.MAIN) return [{
			label: "save_action",
			click: (event, dom) => okAction(dom),
			type: ButtonType.Primary
		}];
		return [];
	}
	/**
	* the generic way to open any calendar edit dialog. the caller should know what to do after the
	* dialog is closed.
	*/
	async showCalendarEventEditDialog(model, responseMail, handler) {
		const recipientsSearch = await locator.recipientsSearchModel();
		const { HtmlEditor } = await import("./HtmlEditor2-chunk.js");
		const groupSettings = locator.logins.getUserController().userSettingsGroupRoot.groupSettings;
		const groupColors = groupSettings.reduce((acc, gc) => {
			acc.set(gc.group, gc.color);
			return acc;
		}, new Map());
		const defaultAlarms = groupSettings.reduce((acc, gc) => {
			acc.set(gc.group, gc.defaultAlarmsList.map((alarm) => parseAlarmInterval(alarm.trigger)));
			return acc;
		}, new Map());
		const descriptionText = convertTextToHtml(model.editModels.description.content);
		const descriptionEditor = new HtmlEditor().setShowOutline(true).setMinHeight(200).setEnabled(true).setValue(descriptionText);
		const okAction = (dom) => {
			model.editModels.description.content = descriptionEditor.getTrimmedValue();
			handler(dom.getBoundingClientRect(), () => dialog.close());
		};
		const summary = model.editModels.summary.content;
		const heading = summary.trim().length > 0 ? lang.makeTranslation("summary", summary) : "createEvent_label";
		const navigationCallback = (targetPage) => {
			this.currentPage(targetPage);
		};
		const dialog = Dialog.editMediumDialog({
			left: this.left.bind(this),
			middle: heading,
			right: this.right.bind(this, okAction),
			create: (dom) => {
				this.headerDom = dom;
			}
		}, CalendarEventEditView, {
			model,
			recipientsSearch,
			descriptionEditor,
			startOfTheWeekOffset: getStartOfTheWeekOffsetForUser(locator.logins.getUserController().userSettingsGroupRoot),
			timeFormat: getTimeFormatForUser(locator.logins.getUserController().userSettingsGroupRoot),
			groupColors,
			defaultAlarms,
			navigationCallback,
			currentPage: this.currentPage
		}, {
			height: "100%",
			"background-color": theme.navigation_bg
		}).addShortcut({
			key: Keys.ESC,
			exec: () => dialog.close(),
			help: "close_alt"
		}).addShortcut({
			key: Keys.S,
			ctrlOrCmd: true,
			exec: () => okAction(assertNotNull(this.headerDom, "headerDom was null")),
			help: "save_action"
		});
		if (client.isMobileDevice()) dialog.setFocusOnLoadFunction(noOp);
		this.dialog = dialog;
		dialog.show();
	}
	/**
	* show an edit dialog for an event that does not exist on the server yet (or anywhere else)
	*
	* will unconditionally send invites on save.
	* @param model the calendar event model used to edit and save the event
	*/
	async showNewCalendarEventEditDialog(model) {
		let finished = false;
		const okAction = async (posRect, finish) => {
			/** new event, so we always want to send invites. */
			model.editModels.whoModel.shouldSendUpdates = true;
			if (finished) return;
			try {
				const result = await model.apply();
				if (result === EventSaveResult.Saved) {
					finished = true;
					finish();
					await handleRatingByEvent();
				}
			} catch (e) {
				if (e instanceof UserError) showUserError(e);
else if (e instanceof UpgradeRequiredError) await showPlanUpgradeRequiredDialog(e.plans);
else throw e;
			}
		};
		return this.showCalendarEventEditDialog(model, null, okAction);
	}
	/**
	* show a dialog that allows to edit a calendar event that already exists.
	*
	* on save, will validate external passwords, account type and user intent before actually saving and sending updates/invites/cancellations.
	*
	* @param model the calendar event model used to edit & save the event
	* @param identity the identity of the event to edit
	* @param responseMail a mail containing an invite and/or update for this event in case we need to reply to the organizer
	*/
	async showExistingCalendarEventEditDialog(model, identity, responseMail = null) {
		let finished = false;
		if (identity.uid == null) throw new ProgrammingError("tried to edit existing event without uid, this is impossible for certain edit operations.");
		const okAction = async (posRect, finish) => {
			if (finished || await this.askUserIfUpdatesAreNeededOrCancel(model) === ConfirmationResult.Cancel) return;
			try {
				const result = await model.apply();
				if (result === EventSaveResult.Saved || result === EventSaveResult.NotFound) {
					finished = true;
					finish();
					if (result === EventSaveResult.NotFound) Dialog.message("eventNoLongerExists_msg");
				}
			} catch (e) {
				if (e instanceof UserError) showUserError(e);
else if (e instanceof UpgradeRequiredError) await showPlanUpgradeRequiredDialog(e.plans);
else throw e;
			}
		};
		await this.showCalendarEventEditDialog(model, responseMail, okAction);
	}
	/** if there are update worthy changes on the model, ask the user what to do with them.
	* @returns {ConfirmationResult} Cancel if the whole process should be cancelled, Continue if the user selected whether to send updates and the saving
	* should proceed.
	* */
	async askUserIfUpdatesAreNeededOrCancel(model) {
		if (model.isAskingForUpdatesNeeded()) switch (await askIfShouldSendCalendarUpdatesToAttendees()) {
			case "yes":
				model.editModels.whoModel.shouldSendUpdates = true;
				break;
			case "no": break;
			case "cancel":
				console.log("not saving event: user cancelled update sending.");
				return ConfirmationResult.Cancel;
		}
		return ConfirmationResult.Continue;
	}
};

//#endregion
export { EventEditorDialog, RemindersEditor };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FsZW5kYXJFdmVudEVkaXREaWFsb2ctY2h1bmsuanMiLCJuYW1lcyI6WyJldmVudDogTW91c2VFdmVudCIsImNsYXNzZXM6IEFycmF5PHN0cmluZz4iLCJkaXNhYmxlZDogYm9vbGVhbiIsImV4cGFuZGVkOiBib29sZWFuIiwicGxhY2Vob2xkZXI/OiBDaGlsZHJlbiIsIm9wdGlvbnM6IFN0cmVhbTxBcnJheTxVPj4iLCJkb206IEhUTUxFbGVtZW50Iiwib25TZWxlY3Q6IChvcHRpb246IFUpID0+IHZvaWQiLCJyZW5kZXJPcHRpb25zOiAob3B0aW9uOiBVKSA9PiBDaGlsZHJlbiIsImtlZXBGb2N1czogYm9vbGVhbiIsInNlbGVjdGVkPzogVCIsIm9uQ2xvc2U/OiAoKSA9PiB2b2lkIiwiZHJvcGRvd25Qb3NpdGlvbj86IFwidG9wXCIgfCBcImJvdHRvbVwiIiwib3B0aW9uTGlzdENvbnRhaW5lcjogT3B0aW9uTGlzdENvbnRhaW5lciIsIm9wdGlvbjogVSIsImRvbSIsInNlbGVjdGVkOiBUIHwgdW5kZWZpbmVkIiwiZTogS2V5Ym9hcmRFdmVudCIsImNhbGxiYWNrOiAob3B0aW9uOiBVKSA9PiB2b2lkIiwiY29udGFpbmVyOiBPcHRpb25MaXN0Q29udGFpbmVyIiwiaXRlbXM6IFN0cmVhbTxBcnJheTx1bmtub3duPj4iLCJidWlsZEZ1bmN0aW9uOiAob3B0aW9uOiB1bmtub3duKSA9PiBDaGlsZHJlbiIsIndpZHRoOiBudW1iZXIiLCJ2bm9kZTogVm5vZGVET008SFRNTEVsZW1lbnQ+IiwiY2hpbGRyZW4iLCJldjogRXZlbnRSZWRyYXc8RXZlbnQ+IiwiZTogTW91c2VFdmVudCIsIm9yaWdpbjogUG9zUmVjdCIsImU6IEV2ZW50Iiwibm9kZTogVm5vZGVET008U2VsZWN0QXR0cmlidXRlczxHdWVzdEl0ZW0sIFJlY2lwaWVudFNlYXJjaFJlc3VsdEl0ZW0+PiIsInNlbGVjdGVkOiBib29sZWFuIiwib3B0aW9uOiBHdWVzdEl0ZW0iLCJhdHRyczogR3Vlc3RQaWNrZXJBdHRycyIsImd1ZXN0OiBSZWNpcGllbnRTZWFyY2hSZXN1bHRJdGVtIiwiZTogTW91c2VFdmVudCIsInZhbDogc3RyaW5nIiwiZXZlbnQ6IEZvY3VzRXZlbnQiLCJlOiBhbnkiLCJldmVudDogS2V5Ym9hcmRFdmVudCIsImZvcndhcmQ6IGJvb2xlYW4iLCJzZWxlY3RTdWdnZXN0aW9uOiBib29sZWFuIiwidm5vZGU6IFZub2RlPFBhc3N3b3JkSW5wdXRBdHRyaWJ1dGVzLCB0aGlzPiIsImU6IEtleWJvYXJkRXZlbnQiLCJjaGVja2VkOiBib29sZWFuIiwib25jbGljazogKGNoZWNrZWQ6IGJvb2xlYW4pID0+IHVua25vd24iLCJkaXNhYmxlZDogYm9vbGVhbiB8IHVuZGVmaW5lZCIsImNsYXNzZXM6IEFycmF5PHN0cmluZz4iLCJkaXNhYmxlZDogYm9vbGVhbiIsInZhcmlhbnQ6IFN3aXRjaFZhcmlhbnQiLCJhdHRyczogQXR0ZW5kZWVMaXN0RWRpdG9yQXR0cnMiLCJvcmdhbml6ZXI6IEd1ZXN0IHwgbnVsbCIsImd1ZXN0SXRlbXM6ICgoKSA9PiBDaGlsZHJlbilbXSIsInBhc3N3b3JkOiBzdHJpbmciLCJzdHJlbmd0aDogbnVtYmVyIiwid2hvTW9kZWw6IENhbGVuZGFyRXZlbnRXaG9Nb2RlbCIsImxvZ2luczogTG9naW5Db250cm9sbGVyIiwicmVjaXBpZW50c1NlYXJjaDogUmVjaXBpZW50c1NlYXJjaE1vZGVsIiwibW9kZWw6IENhbGVuZGFyRXZlbnRXaG9Nb2RlbCIsIm1vZGVsOiBDYWxlbmRhckV2ZW50TW9kZWwiLCJvcmdhbml6ZXIiLCJndWVzdDogR3Vlc3QiLCJwYXNzd29yZD86IHN0cmluZyIsInN0cmVuZ3RoPzogbnVtYmVyIiwicmlnaHRDb250ZW50OiBDaGlsZHJlbiIsImFkZHJlc3M6IHN0cmluZyIsInN0YXR1czogQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cyIsInRpbWVzOiBzdHJpbmdbXSIsImF0dHJzOiBUaW1lUGlja2VyQXR0cnMiLCJldmVudDogSW5wdXRFdmVudCIsIm9wdGlvbjogVGltZU9wdGlvbiIsInZhbDogc3RyaW5nIiwiZTogTW91c2VFdmVudCIsImV2ZW50OiBGb2N1c0V2ZW50IiwiZTogYW55Iiwidm5vZGU6IFZub2RlPEV2ZW50VGltZUVkaXRvckF0dHJzPiIsInZub2RlOiBWbm9kZTxSZW1pbmRlcnNFZGl0b3JBdHRycz4iLCJuZXdBbGFybTogQWxhcm1JbnRlcnZhbCIsImFsYXJtczogcmVhZG9ubHkgQWxhcm1JbnRlcnZhbFtdIiwicmVtb3ZlQWxhcm06IChhbGFybTogQWxhcm1JbnRlcnZhbCkgPT4gdW5rbm93biIsImFkZE5ld0FsYXJtOiAobmV3QWxhcm06IEFsYXJtSW50ZXJ2YWwpID0+IHZvaWQiLCJ0ZXh0RmllbGRBdHRyczogQXJyYXk8VGV4dEZpZWxkQXR0cnM+IiwiYWRkQWxhcm06IChhbGFybTogQWxhcm1JbnRlcnZhbCkgPT4gdW5rbm93biIsIm9wdGlvbjogUmVtaW5kZXJzU2VsZWN0T3B0aW9uIiwiaGFzQWxhcm1zOiBib29sZWFuIiwiaXNEaXNwbGF5OiBib29sZWFuIiwib25BZGRBY3Rpb246ICh2YWx1ZTogbnVtYmVyLCB1bml0OiBBbGFybUludGVydmFsVW5pdCkgPT4gdm9pZCIsInRpbWVSZW1pbmRlclVuaXQ6IEFsYXJtSW50ZXJ2YWxVbml0Iiwic2VsZWN0ZWRWYWx1ZTogQWxhcm1JbnRlcnZhbFVuaXQiLCJkaWFsb2c6IERpYWxvZyIsImdyb3VwTmFtZTogTWF5YmVUcmFuc2xhdGlvbiIsIm9wdGlvbjogUmFkaW9Hcm91cE9wdGlvbjxUPiIsInNlbGVjdGVkT3B0aW9uOiBUIHwgbnVsbCIsIm9wdGlvbkNsYXNzOiBzdHJpbmcgfCB1bmRlZmluZWQiLCJvbk9wdGlvblNlbGVjdGVkOiAoYXJnMDogVCkgPT4gdW5rbm93biIsImluamVjdGlvbk1hcD86IE1hcDxzdHJpbmcsIENoaWxkPiIsImV2ZW50OiBLZXlib2FyZEV2ZW50Iiwia2V5OiBzdHJpbmciLCJwZXJpb2Q6IFJlcGVhdFBlcmlvZCIsImludGVydmFsOiBudW1iZXIiLCJlbmRUaW1lOiBFbmRUeXBlIiwib3B0aW9uOiBSZXBlYXRSdWxlT3B0aW9uIiwiYXR0cnM6IFJlcGVhdFJ1bGVFZGl0b3JBdHRycyIsIm9wdGlvbjogRW5kVHlwZSIsImN1c3RvbVJ1bGVPcHRpb25zOiBSYWRpb0dyb3VwT3B0aW9uPFJlcGVhdFBlcmlvZD5bXSIsIm9wdGlvbjogUmVwZWF0UGVyaW9kIiwid2hlbk1vZGVsOiBDYWxlbmRhckV2ZW50V2hlbk1vZGVsIiwiY3VzdG9tUnVsZTogUGFydGlhbDx7IGludGVydmFsOiBudW1iZXI7IGludGVydmFsRnJlcXVlbmN5OiBSZXBlYXRQZXJpb2QgfT4iLCJ2YWw6IHN0cmluZyIsImU6IE1vdXNlRXZlbnQiLCJldmVudDogRm9jdXNFdmVudCIsInZub2RlOiBWbm9kZTxDYWxlbmRhckV2ZW50RWRpdFZpZXdBdHRycz4iLCJhbGxvd1JlbmRlcmluZzogYm9vbGVhbiIsInZub2RlOiBWbm9kZURPTTxDYWxlbmRhckV2ZW50RWRpdFZpZXdBdHRycz4iLCJhdHRyczogQ2FsZW5kYXJFdmVudEVkaXRWaWV3QXR0cnMiLCJuZXdWYWx1ZTogYW55IiwibWVzc2FnZTogVHJhbnNsYXRpb25LZXkiLCJldmVudDogTW91c2VFdmVudCIsInRhcmdldDogRWRpdG9yUGFnZXMiLCJuYXZpZ2F0aW9uQ2FsbGJhY2s6ICh0YXJnZXRQYWdlOiBFZGl0b3JQYWdlcykgPT4gdW5rbm93biIsIm9wdGlvbnM6IENhbGVuZGFyU2VsZWN0SXRlbVtdIiwic2VsZWN0ZWQ6IENhbGVuZGFyU2VsZWN0SXRlbSIsIm9wdGlvbjogQ2FsZW5kYXJTZWxlY3RJdGVtIiwiaXNTZWxlY3RlZDogYm9vbGVhbiIsImlzRGlzcGxheTogYm9vbGVhbiIsIm5ld1ZhbHVlOiBzdHJpbmciLCJydWxlOiBDYWxlbmRhclJlcGVhdFJ1bGUgfCBudWxsIiwiaXNBbGxEYXk6IGJvb2xlYW4iLCJva0FjdGlvbjogKGRvbTogSFRNTEVsZW1lbnQpID0+IHVua25vd24iLCJldmVudDogTW91c2VFdmVudCIsImRvbTogSFRNTEVsZW1lbnQiLCJtb2RlbDogQ2FsZW5kYXJFdmVudE1vZGVsIiwicmVzcG9uc2VNYWlsOiBNYWlsIHwgbnVsbCIsImhhbmRsZXI6IEVkaXREaWFsb2dPa0hhbmRsZXIiLCJncm91cENvbG9yczogTWFwPElkLCBzdHJpbmc+IiwiZGVmYXVsdEFsYXJtczogTWFwPElkLCBBbGFybUludGVydmFsW10+IiwiZGVzY3JpcHRpb25FZGl0b3I6IEh0bWxFZGl0b3IiLCJ0YXJnZXRQYWdlOiBFZGl0b3JQYWdlcyIsImRpYWxvZzogRGlhbG9nIiwib2tBY3Rpb246IEVkaXREaWFsb2dPa0hhbmRsZXIiLCJpZGVudGl0eTogQ2FsZW5kYXJFdmVudElkZW50aXR5Il0sInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1vbi9ndWkvYmFzZS9DYXJkLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvYmFzZS9TZWxlY3QudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL2d1aS9waWNrZXJzL0d1ZXN0UGlja2VyLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvUGFzc3dvcmRJbnB1dC50cyIsIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvU3dpdGNoLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvRGl2aWRlci50cyIsIi4uL3NyYy9jYWxlbmRhci1hcHAvY2FsZW5kYXIvZ3VpL2V2ZW50ZWRpdG9yLXZpZXcvQXR0ZW5kZWVMaXN0RWRpdG9yLnRzIiwiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9ndWkvcGlja2Vycy9UaW1lUGlja2VyLnRzIiwiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9ndWkvZXZlbnRlZGl0b3Itdmlldy9FdmVudFRpbWVFZGl0b3IudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL2d1aS9SZW1pbmRlcnNFZGl0b3IudHMiLCIuLi9zcmMvY29tbW9uL2d1aS9iYXNlL1JhZGlvR3JvdXAudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL2d1aS9ldmVudGVkaXRvci12aWV3L1JlcGVhdFJ1bGVFZGl0b3IudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL2d1aS9ldmVudGVkaXRvci12aWV3L0NhbGVuZGFyRXZlbnRFZGl0Vmlldy50cyIsIi4uL3NyYy9jYWxlbmRhci1hcHAvY2FsZW5kYXIvZ3VpL2V2ZW50ZWRpdG9yLXZpZXcvQ2FsZW5kYXJFdmVudEVkaXREaWFsb2cudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENsYXNzQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcblxuZXhwb3J0IGludGVyZmFjZSBDYXJkQXR0cnMge1xuXHRyb290RWxlbWVudFR5cGU/OiBcImRpdlwiIHwgXCJzZWN0aW9uXCJcblx0Y2xhc3Nlcz86IEFycmF5PHN0cmluZz5cblx0c3R5bGU/OiBQYXJ0aWFsPFBpY2s8Q1NTU3R5bGVEZWNsYXJhdGlvbiwgXCJwYWRkaW5nXCI+PlxufVxuXG50eXBlIEhUTUxFbGVtZW50V2l0aEF0dHJzID0gUGFydGlhbDxQaWNrPG0uQXR0cmlidXRlcywgXCJjbGFzc1wiPiAmIE9taXQ8SFRNTEVsZW1lbnQsIFwic3R5bGVcIj4gJiBDYXJkQXR0cnM+XG5cbi8qKlxuICogU2ltcGxlIGNhcmQgY29tcG9uZW50XG4gKiBAc2VlIENvbXBvbmVudCBhdHRyaWJ1dGVzOiB7Q2FyZEF0dHJzfVxuICogQGV4YW1wbGVcbiAqIG0oQ2FyZCwge1xuICogICAgIHJvb3RFbGVtZW50VHlwZTogXCJzZWN0aW9uXCIsIC8vIENoYW5naW5nIHRoZSBkZWZhdWx0IHJvb3QgZWxlbWVudFxuICogICAgIGNsYXNzZXM6IFtcIm10XCJdLCAvLyBBZGRpbmcgbmV3IHN0eWxlc1xuICogICAgIHN0eWxlOiB7XG4gKiAgICAgICAgIFwiZm9udC1zaXplXCI6IHB4KHNpemUuZm9udF9zaXplX2Jhc2UgKiAxLjI1KSAvLyBPdmVycmlkaW5nIHRoZSBjb21wb25lbnQgc3R5bGVcbiAqICAgICB9XG4gKiB9LCBtKFwic3BhblwiLCBcIkNoaWxkIHNwYW4gdGV4dFwiKSksXG4gKi9cbmV4cG9ydCBjbGFzcyBDYXJkIGltcGxlbWVudHMgQ2xhc3NDb21wb25lbnQ8Q2FyZEF0dHJzPiB7XG5cdHZpZXcoeyBhdHRycywgY2hpbGRyZW4gfTogVm5vZGU8Q2FyZEF0dHJzLCB0aGlzPik6IENoaWxkcmVuIHwgdm9pZCB8IG51bGwge1xuXHRcdHJldHVybiBtKFxuXHRcdFx0YCR7YXR0cnMucm9vdEVsZW1lbnRUeXBlID8/IFwiZGl2XCJ9LnR1dGF1aS1jYXJkLWNvbnRhaW5lcmAsXG5cdFx0XHR7XG5cdFx0XHRcdGNsYXNzOiBhdHRycy5jbGFzc2VzPy5qb2luKFwiIFwiKSxcblx0XHRcdFx0c3R5bGU6IGF0dHJzLnN0eWxlLFxuXHRcdFx0fSBzYXRpc2ZpZXMgSFRNTEVsZW1lbnRXaXRoQXR0cnMsXG5cdFx0XHRjaGlsZHJlbixcblx0XHQpXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDbGFzc0NvbXBvbmVudCwgVm5vZGUsIFZub2RlRE9NIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgbW9kYWwsIE1vZGFsQ29tcG9uZW50IH0gZnJvbSBcIi4vTW9kYWwuanNcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgcHgsIHNpemUgfSBmcm9tIFwiLi4vc2l6ZS5qc1wiXG5pbXBvcnQgeyBLZXlzLCBUYWJJbmRleCB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IGZvY3VzTmV4dCwgZm9jdXNQcmV2aW91cywgaXNLZXlQcmVzc2VkLCBTaG9ydGN1dCB9IGZyb20gXCIuLi8uLi9taXNjL0tleU1hbmFnZXIuanNcIlxuaW1wb3J0IHsgdHlwZSBQb3NSZWN0LCBzaG93RHJvcGRvd24gfSBmcm9tIFwiLi9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgSWNvbiwgSWNvblNpemUgfSBmcm9tIFwiLi9JY29uLmpzXCJcbmltcG9ydCB7IEJ1dHRvbkNvbG9yLCBnZXRDb2xvcnMgfSBmcm9tIFwiLi9CdXR0b24uanNcIlxuaW1wb3J0IHsgQXJpYVJvbGUgfSBmcm9tIFwiLi4vQXJpYVV0aWxzLmpzXCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB7IGdldFNhZmVBcmVhSW5zZXRCb3R0b20sIGdldFNhZmVBcmVhSW5zZXRUb3AgfSBmcm9tIFwiLi4vSHRtbFV0aWxzLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uL3RoZW1lLmpzXCJcbmltcG9ydCB7IEJvb3RJY29ucyB9IGZyb20gXCIuL2ljb25zL0Jvb3RJY29ucy5qc1wiXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VsZWN0T3B0aW9uPFQ+IHtcblx0Ly8gSGVyZSB3ZSBkZWNsYXJlIGV2ZXJ5dGhpbmcgdGhhdCBpcyBpbXBvcnRhbnQgdG8gdXNlIGF0IHRoZSBzZWxlY3Qgb3B0aW9uXG5cdHZhbHVlOiBUXG5cdGFyaWFWYWx1ZTogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VsZWN0QXR0cmlidXRlczxVIGV4dGVuZHMgU2VsZWN0T3B0aW9uPFQ+LCBUPiB7XG5cdG9uY2hhbmdlOiAobmV3VmFsdWU6IFUpID0+IHZvaWRcblx0b3B0aW9uczogU3RyZWFtPEFycmF5PFU+PlxuXHQvKipcblx0ICogVGhpcyBhdHRyaWJ1dGUgaXMgcmVzcG9uc2libGUgdG8gcmVuZGVyIHRoZSBvcHRpb25zIGluc2lkZSB0aGUgZHJvcGRvd24uXG5cdCAqIEBleGFtcGxlXG5cdCAqIGNvbnN0IHJlbmRlck9wdGlvbiA9IChvcHRpb246IFUpID0+IG0oXCJzcGFuXCIsIG9wdGlvbi50ZXh0KTtcblx0ICogLi4uXG5cdCAqIHJlbmRlck9wdGlvbihjdXJyZW50T3B0aW9uKVxuXHQgKiAuLi5cblx0ICogQHBhcmFtIHtVfSBvcHRpb24gLSBPcHRpb24gdG8gYmUgcmVuZGVyZWRcblx0ICogQHJldHVybnMge0NoaWxkcmVufSBSZXR1cm5zIHRoZSByZW5kZXJlZCBvcHRpb25cblx0ICovXG5cdHJlbmRlck9wdGlvbjogKG9wdGlvbjogVSkgPT4gQ2hpbGRyZW5cblx0LyoqXG5cdCAqIFRoaXMgYXR0cmlidXRlIGlzIHJlc3BvbnNpYmxlIHRvIHJlbmRlciB0aGUgc2VsZWN0ZWQgb3B0aW9uIGluc2lkZSB0aGUgdHJpZ2dlci5cblx0ICogQGV4YW1wbGVcblx0ICogY29uc3QgcmVuZGVyU2VsZWN0ZWQgPSAob3B0aW9uOiBVKSA9PiBtKFwic3BhblwiLCBvcHRpb24udGV4dCk7XG5cdCAqIC4uLlxuXHQgKiByZW5kZXJTZWxlY3RlZChjdXJyZW50T3B0aW9uKVxuXHQgKiAuLi5cblx0ICogQHBhcmFtIHtVfSBvcHRpb24gLSBPcHRpb24gdG8gYmUgcmVuZGVyZWRcblx0ICogQHJldHVybnMge0NoaWxkcmVufSBSZXR1cm5zIHRoZSByZW5kZXJlZCBvcHRpb25cblx0ICovXG5cdHJlbmRlckRpc3BsYXk6IChvcHRpb246IFUpID0+IENoaWxkcmVuXG5cdGFyaWFMYWJlbDogc3RyaW5nXG5cdGlkPzogc3RyaW5nXG5cdGNsYXNzZXM/OiBBcnJheTxzdHJpbmc+XG5cdHNlbGVjdGVkPzogVVxuXHRwbGFjZWhvbGRlcj86IENoaWxkcmVuXG5cdGV4cGFuZGVkPzogYm9vbGVhblxuXHRkaXNhYmxlZD86IGJvb2xlYW5cblx0bm9JY29uPzogYm9vbGVhblxuXHQvKipcblx0ICogQGV4YW1wbGVcblx0ICogY29uc3QgYXR0cnMgPSB7XG5cdCAqICAgICAuLi5cblx0ICogICAgIGljb25Db2xvcjogXCIjMjAyMDIwXCJcblx0ICogICAgIC4uLlxuXHQgKiB9XG5cdCAqL1xuXHRpY29uQ29sb3I/OiBzdHJpbmdcblx0a2VlcEZvY3VzPzogYm9vbGVhblxuXHR0YWJJbmRleD86IG51bWJlclxuXHRvbmNsb3NlPzogKCkgPT4gdm9pZFxuXHRvbmNyZWF0ZT86ICguLi5hcmdzOiBhbnlbXSkgPT4gdW5rbm93blxuXHRkcm9wZG93blBvc2l0aW9uPzogXCJ0b3BcIiB8IFwiYm90dG9tXCJcbn1cblxudHlwZSBIVE1MRWxlbWVudFdpdGhBdHRycyA9IFBhcnRpYWw8UGljazxtLkF0dHJpYnV0ZXMsIFwiY2xhc3NcIj4gJiBPbWl0PEhUTUxCdXR0b25FbGVtZW50LCBcInN0eWxlXCI+ICYgU2VsZWN0QXR0cmlidXRlczxTZWxlY3RPcHRpb248dW5rbm93bj4sIHVua25vd24+PlxuXG5leHBvcnQgaW50ZXJmYWNlIFNlbGVjdFN0YXRlIHtcblx0ZHJvcGRvd25Db250YWluZXI/OiBPcHRpb25MaXN0Q29udGFpbmVyXG59XG5cbi8qKlxuICogU2VsZWN0IGNvbXBvbmVudFxuICogQHNlZSBDb21wb25lbnQgYXR0cmlidXRlczoge1NlbGVjdEF0dHJpYnV0ZXN9XG4gKiBAZXhhbXBsZVxuICpcbiAqIGludGVyZmFjZSBDYWxlbmRhclNlbGVjdEl0ZW0gZXh0ZW5kcyBTZWxlY3RPcHRpb248c3RyaW5nPiB7XG4gKiAgIGNvbG9yOiBzdHJpbmdcbiAqIFx0IG5hbWU6IHN0cmluZ1xuICogfVxuICpcbiAqIG0oU2VsZWN0PENhbGVuZGFyU2VsZWN0SXRlbSwgc3RyaW5nPiwge1xuICogICBjbGFzc2VzOiBbXCJjdXN0b20tbWFyZ2luc1wiXSxcbiAqICAgb25DaGFuZ2U6ICh2YWwpID0+IHtcbiAqIFx0ICAgdGhpcy5zZWxlY3RlZCA9IHZhbFxuICogICB9LFxuICogXHQgb3B0aW9uczogdGhpcy5vcHRpb25zLFxuICogXHQgZXhwYW5kZWQ6IHRydWUsXG4gKiBcdCBzZWxlY3RlZDogdGhpcy5zZWxlY3RlZCxcbiAqIFx0IHJlbmRlck9wdGlvbjogKG9wdGlvbikgPT4ge1xuICogXHQgICByZXR1cm4gbShcIi5mbGV4Lml0ZW1zLWNlbnRlci5nYXAtdnBhZC14c1wiLCBbXG4gKiBcdCAgICAgbShcImRpdlwiLCB7IHN0eWxlOiB7IHdpZHRoOiBcIjI0cHhcIiwgaGVpZ2h0OiBcIjI0cHhcIiwgYm9yZGVyUmFkaXVzOiBcIjUwJVwiLCBiYWNrZ3JvdW5kQ29sb3I6IG9wdGlvbi5jb2xvciB9IH0pLFxuICogICAgICAgbShcInNwYW5cIiwgb3B0aW9uLm5hbWUpLFxuICogXHQgICBdKVxuICogXHQgfSxcbiAqIFx0IHJlbmRlckRpc3BsYXk6IChvcHRpb24pID0+IG0oXCJzcGFuXCIsIHsgc3R5bGU6IHsgY29sb3I6IFwicmVkXCIgfSB9LCBvcHRpb24ubmFtZSksXG4gKiBcdCBhcmlhTGFiZWw6IFwiQ2FsZW5kYXJcIlxuICogfSksXG4gKi9cbmV4cG9ydCBjbGFzcyBTZWxlY3Q8VSBleHRlbmRzIFNlbGVjdE9wdGlvbjxUPiwgVD4gaW1wbGVtZW50cyBDbGFzc0NvbXBvbmVudDxTZWxlY3RBdHRyaWJ1dGVzPFUsIFQ+PiB7XG5cdHByaXZhdGUgaXNFeHBhbmRlZDogYm9vbGVhbiA9IGZhbHNlXG5cdHByaXZhdGUgZHJvcGRvd25Db250YWluZXI/OiBPcHRpb25MaXN0Q29udGFpbmVyXG5cdHByaXZhdGUga2V5OiBudW1iZXIgPSAwXG5cblx0dmlldyh7XG5cdFx0YXR0cnM6IHtcblx0XHRcdG9uY2hhbmdlLFxuXHRcdFx0b3B0aW9ucyxcblx0XHRcdHJlbmRlck9wdGlvbixcblx0XHRcdHJlbmRlckRpc3BsYXksXG5cdFx0XHRjbGFzc2VzLFxuXHRcdFx0c2VsZWN0ZWQsXG5cdFx0XHRwbGFjZWhvbGRlcixcblx0XHRcdGV4cGFuZGVkLFxuXHRcdFx0ZGlzYWJsZWQsXG5cdFx0XHRhcmlhTGFiZWwsXG5cdFx0XHRpY29uQ29sb3IsXG5cdFx0XHRpZCxcblx0XHRcdG5vSWNvbixcblx0XHRcdGtlZXBGb2N1cyxcblx0XHRcdHRhYkluZGV4LFxuXHRcdFx0b25jbG9zZSxcblx0XHRcdGRyb3Bkb3duUG9zaXRpb24sXG5cdFx0fSxcblx0fTogVm5vZGU8U2VsZWN0QXR0cmlidXRlczxVLCBUPiwgdGhpcz4pIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiYnV0dG9uLnR1dGF1aS1zZWxlY3QtdHJpZ2dlci5jbGlja2FibGVcIixcblx0XHRcdHtcblx0XHRcdFx0aWQsXG5cdFx0XHRcdGNsYXNzOiB0aGlzLnJlc29sdmVDbGFzc2VzKGNsYXNzZXMsIGRpc2FibGVkLCBleHBhbmRlZCksXG5cdFx0XHRcdG9uY2xpY2s6IChldmVudDogTW91c2VFdmVudCkgPT5cblx0XHRcdFx0XHRldmVudC5jdXJyZW50VGFyZ2V0ICYmXG5cdFx0XHRcdFx0dGhpcy5yZW5kZXJEcm9wZG93bihcblx0XHRcdFx0XHRcdG9wdGlvbnMsXG5cdFx0XHRcdFx0XHRldmVudC5jdXJyZW50VGFyZ2V0IGFzIEhUTUxFbGVtZW50LFxuXHRcdFx0XHRcdFx0b25jaGFuZ2UsXG5cdFx0XHRcdFx0XHRyZW5kZXJPcHRpb24sXG5cdFx0XHRcdFx0XHRrZWVwRm9jdXMgPz8gZmFsc2UsXG5cdFx0XHRcdFx0XHRzZWxlY3RlZD8udmFsdWUsXG5cdFx0XHRcdFx0XHRvbmNsb3NlLFxuXHRcdFx0XHRcdFx0ZHJvcGRvd25Qb3NpdGlvbixcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRyb2xlOiBBcmlhUm9sZS5Db21ib2JveCxcblx0XHRcdFx0YXJpYUxhYmVsLFxuXHRcdFx0XHRkaXNhYmxlZDogZGlzYWJsZWQsXG5cdFx0XHRcdGFyaWFFeHBhbmRlZDogU3RyaW5nKHRoaXMuaXNFeHBhbmRlZCksXG5cdFx0XHRcdHRhYkluZGV4OiB0YWJJbmRleCA/PyBOdW1iZXIoZGlzYWJsZWQgPyBUYWJJbmRleC5Qcm9ncmFtbWF0aWMgOiBUYWJJbmRleC5EZWZhdWx0KSxcblx0XHRcdFx0dmFsdWU6IHNlbGVjdGVkPy5hcmlhVmFsdWUsXG5cdFx0XHR9IHNhdGlzZmllcyBIVE1MRWxlbWVudFdpdGhBdHRycyxcblx0XHRcdFtcblx0XHRcdFx0c2VsZWN0ZWQgIT0gbnVsbCA/IHJlbmRlckRpc3BsYXkoc2VsZWN0ZWQpIDogdGhpcy5yZW5kZXJQbGFjZWhvbGRlcihwbGFjZWhvbGRlciksXG5cdFx0XHRcdG5vSWNvbiAhPT0gdHJ1ZVxuXHRcdFx0XHRcdD8gbShJY29uLCB7XG5cdFx0XHRcdFx0XHRcdGljb246IEJvb3RJY29ucy5FeHBhbmQsXG5cdFx0XHRcdFx0XHRcdGNvbnRhaW5lcjogXCJkaXZcIixcblx0XHRcdFx0XHRcdFx0Y2xhc3M6IGBmaXQtY29udGVudCB0cmFuc2l0aW9uLXRyYW5zZm9ybWAsXG5cdFx0XHRcdFx0XHRcdHNpemU6IEljb25TaXplLk1lZGl1bSxcblx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRmaWxsOiBpY29uQ29sb3IgPz8gZ2V0Q29sb3JzKEJ1dHRvbkNvbG9yLkNvbnRlbnQpLmJ1dHRvbixcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQgIH0pXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHJlc29sdmVDbGFzc2VzKGNsYXNzZXM6IEFycmF5PHN0cmluZz4gPSBbXSwgZGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZSwgZXhwYW5kZWQ6IGJvb2xlYW4gPSBmYWxzZSkge1xuXHRcdGNvbnN0IGNsYXNzTGlzdCA9IFsuLi5jbGFzc2VzXVxuXHRcdGlmIChkaXNhYmxlZCkge1xuXHRcdFx0Y2xhc3NMaXN0LnB1c2goXCJkaXNhYmxlZFwiLCBcImNsaWNrLWRpc2FibGVkXCIpXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNsYXNzTGlzdC5wdXNoKFwiZmxhc2hcIilcblx0XHR9XG5cblx0XHRpZiAoZXhwYW5kZWQpIHtcblx0XHRcdGNsYXNzTGlzdC5wdXNoKFwiZnVsbC13aWR0aFwiKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjbGFzc0xpc3QucHVzaChcImZpdC1jb250ZW50XCIpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNsYXNzTGlzdC5qb2luKFwiIFwiKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJQbGFjZWhvbGRlcihwbGFjZWhvbGRlcj86IENoaWxkcmVuKTogQ2hpbGRyZW4ge1xuXHRcdGlmIChwbGFjZWhvbGRlciA9PSBudWxsIHx8IHR5cGVvZiBwbGFjZWhvbGRlciA9PT0gXCJzdHJpbmdcIikge1xuXHRcdFx0cmV0dXJuIG0oXCJzcGFuLnBsYWNlaG9sZGVyXCIsIHBsYWNlaG9sZGVyID8/IGxhbmcuZ2V0KFwibm9TZWxlY3Rpb25fbXNnXCIpKVxuXHRcdH1cblxuXHRcdHJldHVybiBwbGFjZWhvbGRlclxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJEcm9wZG93bihcblx0XHRvcHRpb25zOiBTdHJlYW08QXJyYXk8VT4+LFxuXHRcdGRvbTogSFRNTEVsZW1lbnQsXG5cdFx0b25TZWxlY3Q6IChvcHRpb246IFUpID0+IHZvaWQsXG5cdFx0cmVuZGVyT3B0aW9uczogKG9wdGlvbjogVSkgPT4gQ2hpbGRyZW4sXG5cdFx0a2VlcEZvY3VzOiBib29sZWFuLFxuXHRcdHNlbGVjdGVkPzogVCxcblx0XHRvbkNsb3NlPzogKCkgPT4gdm9pZCxcblx0XHRkcm9wZG93blBvc2l0aW9uPzogXCJ0b3BcIiB8IFwiYm90dG9tXCIsXG5cdCkge1xuXHRcdGNvbnN0IG9wdGlvbkxpc3RDb250YWluZXI6IE9wdGlvbkxpc3RDb250YWluZXIgPSBuZXcgT3B0aW9uTGlzdENvbnRhaW5lcihcblx0XHRcdG9wdGlvbnMsXG5cdFx0XHQob3B0aW9uOiBVKSA9PiB7XG5cdFx0XHRcdHJldHVybiBtLmZyYWdtZW50KFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGtleTogKyt0aGlzLmtleSxcblx0XHRcdFx0XHRcdG9uY3JlYXRlOiAoeyBkb20gfTogVm5vZGVET008VT4pID0+IHRoaXMuc2V0dXBPcHRpb24oZG9tIGFzIEhUTUxFbGVtZW50LCBvblNlbGVjdCwgb3B0aW9uLCBvcHRpb25MaXN0Q29udGFpbmVyLCBzZWxlY3RlZCksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRbcmVuZGVyT3B0aW9ucyhvcHRpb24pXSxcblx0XHRcdFx0KVxuXHRcdFx0fSxcblx0XHRcdGRvbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aCxcblx0XHRcdGtlZXBGb2N1cyxcblx0XHRcdGRyb3Bkb3duUG9zaXRpb24sXG5cdFx0KVxuXG5cdFx0b3B0aW9uTGlzdENvbnRhaW5lci5vbkNsb3NlID0gKCkgPT4ge1xuXHRcdFx0b3B0aW9uTGlzdENvbnRhaW5lci5jbG9zZSgpXG5cdFx0XHRvbkNsb3NlPy4oKVxuXHRcdFx0dGhpcy5pc0V4cGFuZGVkID0gZmFsc2Vcblx0XHR9XG5cblx0XHRvcHRpb25MaXN0Q29udGFpbmVyLnNldE9yaWdpbihkb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkpXG5cblx0XHR0aGlzLmlzRXhwYW5kZWQgPSB0cnVlXG5cdFx0dGhpcy5kcm9wZG93bkNvbnRhaW5lciA9IG9wdGlvbkxpc3RDb250YWluZXJcblx0XHRtb2RhbC5kaXNwbGF5VW5pcXVlKG9wdGlvbkxpc3RDb250YWluZXIsIGZhbHNlKVxuXHR9XG5cblx0cHJpdmF0ZSBzZXR1cE9wdGlvbihkb206IEhUTUxFbGVtZW50LCBvblNlbGVjdDogKG9wdGlvbjogVSkgPT4gdm9pZCwgb3B0aW9uOiBVLCBvcHRpb25MaXN0Q29udGFpbmVyOiBPcHRpb25MaXN0Q29udGFpbmVyLCBzZWxlY3RlZDogVCB8IHVuZGVmaW5lZCkge1xuXHRcdGRvbS5vbmNsaWNrID0gdGhpcy53cmFwT25DaGFuZ2UuYmluZCh0aGlzLCBvblNlbGVjdCwgb3B0aW9uLCBvcHRpb25MaXN0Q29udGFpbmVyKVxuXG5cdFx0aWYgKCEoXCJkaXNhYmxlZFwiIGluIGRvbSkpIHtcblx0XHRcdC8vIFdlIGhhdmUgdG8gc2V0IHRoZSB0YWJJbmRleCB0byBtYWtlIHN1cmUgdGhhdCBpdCdsbCBiZSBmb2N1c2FibGUgYnkgdGFiYmluZ1xuXHRcdFx0ZG9tLnRhYkluZGV4ID0gTnVtYmVyKFRhYkluZGV4LkRlZmF1bHQpXG5cblx0XHRcdC8vIFdlIGhhdmUgdG8gc2V0IHRoZSBjdXJzb3IgcG9pbnRlciBhcyBhIGZhbGxiYWNrIG9mIHJlbmRlck9wdGlvbnMgdGhhdCBkb2Vzbid0IHNldCBpdFxuXHRcdFx0aWYgKCFkb20uc3R5bGUuY3Vyc29yKSB7XG5cdFx0XHRcdGRvbS5zdHlsZS5jdXJzb3IgPSBcInBvaW50ZXJcIlxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWRvbS5yb2xlKSB7XG5cdFx0XHRcdGRvbS5yb2xlID0gQXJpYVJvbGUuT3B0aW9uXG5cdFx0XHR9XG5cblx0XHRcdGRvbS5hcmlhU2VsZWN0ZWQgPSBgJHtzZWxlY3RlZCA9PT0gb3B0aW9uLnZhbHVlfWBcblx0XHR9XG5cblx0XHRkb20ub25rZXlkb3duID0gKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcblx0XHRcdGlmIChpc0tleVByZXNzZWQoZS5rZXksIEtleXMuU1BBQ0UsIEtleXMuUkVUVVJOKSkge1xuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0dGhpcy53cmFwT25DaGFuZ2Uob25TZWxlY3QsIG9wdGlvbiwgb3B0aW9uTGlzdENvbnRhaW5lcilcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHdyYXBPbkNoYW5nZShjYWxsYmFjazogKG9wdGlvbjogVSkgPT4gdm9pZCwgb3B0aW9uOiBVLCBjb250YWluZXI6IE9wdGlvbkxpc3RDb250YWluZXIpIHtcblx0XHRjYWxsYmFjayhvcHRpb24pXG5cdFx0Y29udGFpbmVyLm9uQ2xvc2UoKVxuXHR9XG59XG5cbmNsYXNzIE9wdGlvbkxpc3RDb250YWluZXIgaW1wbGVtZW50cyBNb2RhbENvbXBvbmVudCB7XG5cdHByaXZhdGUgZG9tRHJvcGRvd246IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGxcblx0dmlldzogTW9kYWxDb21wb25lbnRbXCJ2aWV3XCJdXG5cdG9yaWdpbjogUG9zUmVjdCB8IG51bGwgPSBudWxsXG5cdHNob3J0Y3V0czogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueVxuXHRwcml2YXRlIHJlYWRvbmx5IHdpZHRoOiBudW1iZXJcblx0cHJpdmF0ZSBkb21Db250ZW50czogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIG1heEhlaWdodDogbnVtYmVyIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBmb2N1c2VkQmVmb3JlU2hvd246IEhUTUxFbGVtZW50IHwgbnVsbCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnRcblx0cHJpdmF0ZSBjaGlsZHJlbjogQ2hpbGRyZW5bXSA9IFtdXG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSByZWFkb25seSBpdGVtczogU3RyZWFtPEFycmF5PHVua25vd24+Pixcblx0XHRwcml2YXRlIHJlYWRvbmx5IGJ1aWxkRnVuY3Rpb246IChvcHRpb246IHVua25vd24pID0+IENoaWxkcmVuLFxuXHRcdHdpZHRoOiBudW1iZXIsXG5cdFx0a2VlcEZvY3VzOiBib29sZWFuLFxuXHRcdGRyb3Bkb3duUG9zaXRpb24/OiBcInRvcFwiIHwgXCJib3R0b21cIixcblx0KSB7XG5cdFx0dGhpcy53aWR0aCA9IHdpZHRoXG5cdFx0dGhpcy5zaG9ydGN1dHMgPSB0aGlzLmJ1aWxkU2hvcnRjdXRzXG5cblx0XHR0aGlzLml0ZW1zLm1hcCgobmV3SXRlbXMpID0+IHtcblx0XHRcdHRoaXMuY2hpbGRyZW4gPSBbXVxuXHRcdFx0dGhpcy5jaGlsZHJlbi5wdXNoKG5ld0l0ZW1zLmxlbmd0aCA9PT0gMCA/IHRoaXMucmVuZGVyTm9JdGVtKCkgOiBuZXdJdGVtcy5tYXAoKGl0ZW0pID0+IHRoaXMuYnVpbGRGdW5jdGlvbihpdGVtKSkpXG5cdFx0fSlcblxuXHRcdHRoaXMudmlldyA9ICgpID0+IHtcblx0XHRcdHJldHVybiBtKFxuXHRcdFx0XHRcIi5kcm9wZG93bi1wYW5lbC1zY3JvbGxhYmxlLmVsZXZhdGVkLWJnLmJvcmRlci1yYWRpdXMuZHJvcGRvd24tc2hhZG93LmZpdC1jb250ZW50XCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlOiBWbm9kZURPTTxIVE1MRWxlbWVudD4pID0+IHtcblx0XHRcdFx0XHRcdHRoaXMuZG9tRHJvcGRvd24gPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0XHRcdC8vIEl0IGlzIGltcG9ydGFudCB0byBzZXQgaW5pdGlhbCBvcGFjaXR5IHNvIHRoYXQgdXNlciBkb2Vzbid0IHNlZSBpdCB3aXRoIGZ1bGwgb3BhY2l0eSBiZWZvcmUgYW5pbWF0aW5nLlxuXHRcdFx0XHRcdFx0dGhpcy5kb21Ecm9wZG93bi5zdHlsZS5vcGFjaXR5ID0gXCIwXCJcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLmRyb3Bkb3duLWNvbnRlbnQuc2Nyb2xsLmZsZXguZmxleC1jb2x1bW5cIixcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRyb2xlOiBBcmlhUm9sZS5MaXN0Ym94LFxuXHRcdFx0XHRcdFx0dGFiaW5kZXg6IFRhYkluZGV4LlByb2dyYW1tYXRpYyxcblx0XHRcdFx0XHRcdG9uY3JlYXRlOiAodm5vZGU6IFZub2RlRE9NPEhUTUxFbGVtZW50PikgPT4ge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmRvbUNvbnRlbnRzID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0b251cGRhdGU6ICh2bm9kZTogVm5vZGVET008SFRNTEVsZW1lbnQ+KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLm1heEhlaWdodCA9PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgY2hpbGRyZW4gPSBBcnJheS5mcm9tKHZub2RlLmRvbS5jaGlsZHJlbikgYXMgQXJyYXk8SFRNTEVsZW1lbnQ+XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5tYXhIZWlnaHQgPSBNYXRoLm1pbihcblx0XHRcdFx0XHRcdFx0XHRcdDQwMCArIHNpemUudnBhZCxcblx0XHRcdFx0XHRcdFx0XHRcdGNoaWxkcmVuLnJlZHVjZSgoYWNjdW11bGF0b3IsIGNoaWxkcmVuKSA9PiBhY2N1bXVsYXRvciArIGNoaWxkcmVuLm9mZnNldEhlaWdodCwgMCkgKyBzaXplLnZwYWQsXG5cdFx0XHRcdFx0XHRcdFx0KSAvLyBzaXplLnBhZCBhY2NvdW50cyBmb3IgdG9wIGFuZCBib3R0b20gcGFkZGluZ1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKHRoaXMub3JpZ2luKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBUaGUgZHJvcGRvd24tY29udGVudCBlbGVtZW50IGlzIGFkZGVkIHRvIHRoZSBkb20gaGFzIGEgaGlkZGVuIGVsZW1lbnQgZmlyc3QuXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBUaGUgbWF4SGVpZ2h0IGlzIGF2YWlsYWJsZSBhZnRlciB0aGUgZmlyc3Qgb251cGRhdGUgY2FsbC4gVGhlbiB0aGlzIHByb21pc2Ugd2lsbCByZXNvbHZlIGFuZCB3ZSBjYW4gc2FmZWx5XG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBzaG93IHRoZSBkcm9wZG93bi5cblx0XHRcdFx0XHRcdFx0XHRcdC8vIE1vZGFsIGFsd2F5cyBzY2hlZHVsZXMgcmVkcmF3IGluIG9uY3JlYXRlKCkgb2YgYSBjb21wb25lbnQgc28gd2UgYXJlIGd1YXJhbnRlZWQgdG8gaGF2ZSBvbnVwZGF0ZSgpIGNhbGwuXG5cdFx0XHRcdFx0XHRcdFx0XHRzaG93RHJvcGRvd24odGhpcy5vcmlnaW4sIGFzc2VydE5vdE51bGwodGhpcy5kb21Ecm9wZG93biksIHRoaXMubWF4SGVpZ2h0LCB0aGlzLndpZHRoLCBkcm9wZG93blBvc2l0aW9uKS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3Qgc2VsZWN0ZWRPcHRpb24gPSB2bm9kZS5kb20ucXVlcnlTZWxlY3RvcihcIlthcmlhLXNlbGVjdGVkPSd0cnVlJ11cIikgYXMgSFRNTEVsZW1lbnQgfCBudWxsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChzZWxlY3RlZE9wdGlvbiAmJiAha2VlcEZvY3VzKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0c2VsZWN0ZWRPcHRpb24uZm9jdXMoKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKCFrZWVwRm9jdXMgJiYgKCF0aGlzLmRvbURyb3Bkb3duIHx8IGZvY3VzTmV4dCh0aGlzLmRvbURyb3Bkb3duKSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmRvbUNvbnRlbnRzPy5mb2N1cygpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMudXBkYXRlRHJvcGRvd25TaXplKHZub2RlKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0b25zY3JvbGw6IChldjogRXZlbnRSZWRyYXc8RXZlbnQ+KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IHRhcmdldCA9IGV2LnRhcmdldCBhcyBIVE1MRWxlbWVudFxuXHRcdFx0XHRcdFx0XHQvLyBuZWVkZWQgaGVyZSB0byBwcmV2ZW50IGZsaWNrZXJpbmcgb24gaW9zXG5cdFx0XHRcdFx0XHRcdGV2LnJlZHJhdyA9XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5kb21Db250ZW50cyAhPSBudWxsICYmIHRhcmdldC5zY3JvbGxUb3AgPCAwICYmIHRhcmdldC5zY3JvbGxUb3AgKyB0aGlzLmRvbUNvbnRlbnRzLm9mZnNldEhlaWdodCA+IHRhcmdldC5zY3JvbGxIZWlnaHRcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR0aGlzLmNoaWxkcmVuLFxuXHRcdFx0XHQpLFxuXHRcdFx0KVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgdXBkYXRlRHJvcGRvd25TaXplKHZub2RlOiBWbm9kZURPTTxIVE1MRWxlbWVudD4pIHtcblx0XHRpZiAoISh0aGlzLm9yaWdpbiAmJiB0aGlzLmRvbURyb3Bkb3duKSkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0Y29uc3QgdXBwZXJTcGFjZSA9IHRoaXMub3JpZ2luLnRvcCAtIGdldFNhZmVBcmVhSW5zZXRUb3AoKVxuXHRcdGNvbnN0IGxvd2VyU3BhY2UgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLSB0aGlzLm9yaWdpbi5ib3R0b20gLSBnZXRTYWZlQXJlYUluc2V0Qm90dG9tKClcblxuXHRcdGNvbnN0IGNoaWxkcmVuID0gQXJyYXkuZnJvbSh2bm9kZS5kb20uY2hpbGRyZW4pIGFzIEFycmF5PEhUTUxFbGVtZW50PlxuXHRcdGNvbnN0IGNvbnRlbnRIZWlnaHQgPSBNYXRoLm1pbig0MDAgKyBzaXplLnZwYWQsIGNoaWxkcmVuLnJlZHVjZSgoYWNjdW11bGF0b3IsIGNoaWxkcmVuKSA9PiBhY2N1bXVsYXRvciArIGNoaWxkcmVuLm9mZnNldEhlaWdodCwgMCkgKyBzaXplLnZwYWQpXG5cblx0XHR0aGlzLm1heEhlaWdodCA9IGxvd2VyU3BhY2UgPiB1cHBlclNwYWNlID8gTWF0aC5taW4oY29udGVudEhlaWdodCwgbG93ZXJTcGFjZSkgOiBNYXRoLm1pbihjb250ZW50SGVpZ2h0LCB1cHBlclNwYWNlKVxuXHRcdGNvbnN0IG5ld0hlaWdodCA9IHB4KHRoaXMubWF4SGVpZ2h0KVxuXHRcdGlmICh0aGlzLmRvbURyb3Bkb3duLnN0eWxlLmhlaWdodCAhPT0gbmV3SGVpZ2h0KSB0aGlzLmRvbURyb3Bkb3duLnN0eWxlLmhlaWdodCA9IG5ld0hlaWdodFxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJOb0l0ZW0oKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFwic3Bhbi5wbGFjZWhvbGRlci50ZXh0LWNlbnRlclwiLCB7IGNvbG9yOiB0aGVtZS5saXN0X21lc3NhZ2VfYmcgfSwgbGFuZy5nZXQoXCJub0VudHJpZXNfbXNnXCIpKVxuXHR9XG5cblx0YmFja2dyb3VuZENsaWNrID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRpZiAoXG5cdFx0XHR0aGlzLmRvbURyb3Bkb3duICYmXG5cdFx0XHQhKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5jbGFzc0xpc3QuY29udGFpbnMoXCJkb05vdENsb3NlXCIpICYmXG5cdFx0XHQodGhpcy5kb21Ecm9wZG93bi5jb250YWlucyhlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkgfHwgdGhpcy5kb21Ecm9wZG93bi5wYXJlbnROb2RlID09PSBlLnRhcmdldClcblx0XHQpIHtcblx0XHRcdHRoaXMub25DbG9zZSgpXG5cdFx0fVxuXHR9XG5cblx0YnVpbGRTaG9ydGN1dHMoKTogQXJyYXk8U2hvcnRjdXQ+IHtcblx0XHRyZXR1cm4gW1xuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuRVNDLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB0aGlzLm9uQ2xvc2UoKSxcblx0XHRcdFx0aGVscDogXCJjbG9zZV9hbHRcIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5UQUIsXG5cdFx0XHRcdHNoaWZ0OiB0cnVlLFxuXHRcdFx0XHRleGVjOiAoKSA9PiAodGhpcy5kb21Ecm9wZG93biA/IGZvY3VzUHJldmlvdXModGhpcy5kb21Ecm9wZG93bikgOiBmYWxzZSksXG5cdFx0XHRcdGhlbHA6IFwic2VsZWN0UHJldmlvdXNfYWN0aW9uXCIsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuVEFCLFxuXHRcdFx0XHRzaGlmdDogZmFsc2UsXG5cdFx0XHRcdGV4ZWM6ICgpID0+ICh0aGlzLmRvbURyb3Bkb3duID8gZm9jdXNOZXh0KHRoaXMuZG9tRHJvcGRvd24pIDogZmFsc2UpLFxuXHRcdFx0XHRoZWxwOiBcInNlbGVjdE5leHRfYWN0aW9uXCIsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuVVAsXG5cdFx0XHRcdGV4ZWM6ICgpID0+ICh0aGlzLmRvbURyb3Bkb3duID8gZm9jdXNQcmV2aW91cyh0aGlzLmRvbURyb3Bkb3duKSA6IGZhbHNlKSxcblx0XHRcdFx0aGVscDogXCJzZWxlY3RQcmV2aW91c19hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5ET1dOLFxuXHRcdFx0XHRleGVjOiAoKSA9PiAodGhpcy5kb21Ecm9wZG93biA/IGZvY3VzTmV4dCh0aGlzLmRvbURyb3Bkb3duKSA6IGZhbHNlKSxcblx0XHRcdFx0aGVscDogXCJzZWxlY3ROZXh0X2FjdGlvblwiLFxuXHRcdFx0fSxcblx0XHRdXG5cdH1cblxuXHRzZXRPcmlnaW4ob3JpZ2luOiBQb3NSZWN0KTogdGhpcyB7XG5cdFx0dGhpcy5vcmlnaW4gPSBvcmlnaW5cblx0XHRyZXR1cm4gdGhpc1xuXHR9XG5cblx0Y2xvc2UoKTogdm9pZCB7XG5cdFx0bW9kYWwucmVtb3ZlKHRoaXMpXG5cdH1cblxuXHRoaWRlQW5pbWF0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXHR9XG5cblx0b25DbG9zZSgpOiB2b2lkIHtcblx0XHR0aGlzLmNsb3NlKClcblx0fVxuXG5cdHBvcFN0YXRlKGU6IEV2ZW50KTogYm9vbGVhbiB7XG5cdFx0dGhpcy5vbkNsb3NlKClcblx0XHRyZXR1cm4gZmFsc2Vcblx0fVxuXG5cdGNhbGxpbmdFbGVtZW50KCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMuZm9jdXNlZEJlZm9yZVNob3duXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENsYXNzQ29tcG9uZW50LCBWbm9kZSwgVm5vZGVET00gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBTZWxlY3QsIFNlbGVjdEF0dHJpYnV0ZXMsIFNlbGVjdE9wdGlvbiwgU2VsZWN0U3RhdGUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1NlbGVjdC5qc1wiXG5pbXBvcnQgeyBLZXlzLCBUYWJJbmRleCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBTaW5nbGVMaW5lVGV4dEZpZWxkIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9TaW5nbGVMaW5lVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB7IGRlYm91bmNlU3RhcnQsIGdldEZpcnN0T3JUaHJvdyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2cuanNcIlxuaW1wb3J0IHsgbGFuZywgVHJhbnNsYXRpb25LZXkgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgcGFyc2VNYWlsQWRkcmVzcywgcGFyc2VQYXN0ZWRJbnB1dCwgcGFyc2VUeXBlZElucHV0IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvTWFpbFJlY2lwaWVudHNUZXh0RmllbGQuanNcIlxuaW1wb3J0IHsgQ29udGFjdCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IFJlY2lwaWVudFNlYXJjaFJlc3VsdEl0ZW0sIFJlY2lwaWVudHNTZWFyY2hNb2RlbCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWlzYy9SZWNpcGllbnRzU2VhcmNoTW9kZWwuanNcIlxuaW1wb3J0IHN0cmVhbSBmcm9tIFwibWl0aHJpbC9zdHJlYW1cIlxuaW1wb3J0IHsga2V5Ym9hcmRFdmVudFRvS2V5UHJlc3MgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvS2V5TWFuYWdlci5qc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL3RoZW1lLmpzXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9JY29ucy5qc1wiXG5pbXBvcnQgeyBJY29uIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uLmpzXCJcbmltcG9ydCB7IHB4LCBzaXplIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvc2l6ZS5qc1wiXG5pbXBvcnQgeyBEZWZhdWx0QW5pbWF0aW9uVGltZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2FuaW1hdGlvbi9BbmltYXRpb25zLmpzXCJcbmltcG9ydCB7IFRleHRGaWVsZFR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5cbmV4cG9ydCBpbnRlcmZhY2UgR3Vlc3RQaWNrZXJBdHRycyB7XG5cdGFyaWFMYWJlbDogVHJhbnNsYXRpb25LZXlcblx0b25SZWNpcGllbnRBZGRlZDogKGFkZHJlc3M6IHN0cmluZywgbmFtZTogc3RyaW5nIHwgbnVsbCwgY29udGFjdDogQ29udGFjdCB8IG51bGwpID0+IHZvaWRcblx0ZGlzYWJsZWQ6IGJvb2xlYW5cblx0c2VhcmNoOiBSZWNpcGllbnRzU2VhcmNoTW9kZWxcbn1cblxuaW50ZXJmYWNlIEd1ZXN0SXRlbSBleHRlbmRzIFNlbGVjdE9wdGlvbjxSZWNpcGllbnRTZWFyY2hSZXN1bHRJdGVtPiB7XG5cdG5hbWU6IHN0cmluZ1xuXHRhZGRyZXNzPzogc3RyaW5nXG5cdHR5cGU6IHN0cmluZ1xufVxuXG5leHBvcnQgY2xhc3MgR3Vlc3RQaWNrZXIgaW1wbGVtZW50cyBDbGFzc0NvbXBvbmVudDxHdWVzdFBpY2tlckF0dHJzPiB7XG5cdHByaXZhdGUgaXNFeHBhbmRlZDogYm9vbGVhbiA9IGZhbHNlXG5cdHByaXZhdGUgaXNGb2N1c2VkOiBib29sZWFuID0gZmFsc2Vcblx0cHJpdmF0ZSB2YWx1ZTogc3RyaW5nID0gXCJcIlxuXHRwcml2YXRlIHNlbGVjdGVkPzogR3Vlc3RJdGVtXG5cdHByaXZhdGUgb3B0aW9uczogc3RyZWFtPEFycmF5PEd1ZXN0SXRlbT4+ID0gc3RyZWFtKFtdKVxuXHRwcml2YXRlIHNlbGVjdERPTTogVm5vZGVET008U2VsZWN0QXR0cmlidXRlczxHdWVzdEl0ZW0sIFJlY2lwaWVudFNlYXJjaFJlc3VsdEl0ZW0+PiB8IG51bGwgPSBudWxsXG5cblx0dmlldyh7IGF0dHJzIH06IFZub2RlPEd1ZXN0UGlja2VyQXR0cnM+KSB7XG5cdFx0cmV0dXJuIG0oU2VsZWN0PEd1ZXN0SXRlbSwgUmVjaXBpZW50U2VhcmNoUmVzdWx0SXRlbT4sIHtcblx0XHRcdGNsYXNzZXM6IFtcImZsZXgtZ3Jvd1wiXSxcblx0XHRcdGRyb3Bkb3duUG9zaXRpb246IFwiYm90dG9tXCIsXG5cdFx0XHRvbmNoYW5nZTogKHsgdmFsdWU6IGd1ZXN0IH0pID0+IHtcblx0XHRcdFx0dGhpcy5oYW5kbGVTZWxlY3Rpb24oYXR0cnMsIGd1ZXN0KVxuXHRcdFx0fSxcblx0XHRcdG9uY2xvc2U6ICgpID0+IHtcblx0XHRcdFx0dGhpcy5pc0V4cGFuZGVkID0gZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRvbmNyZWF0ZTogKG5vZGU6IFZub2RlRE9NPFNlbGVjdEF0dHJpYnV0ZXM8R3Vlc3RJdGVtLCBSZWNpcGllbnRTZWFyY2hSZXN1bHRJdGVtPj4pID0+IHtcblx0XHRcdFx0dGhpcy5zZWxlY3RET00gPSBub2RlXG5cdFx0XHR9LFxuXHRcdFx0c2VsZWN0ZWQ6IHRoaXMuc2VsZWN0ZWQsXG5cdFx0XHRhcmlhTGFiZWw6IGF0dHJzLmFyaWFMYWJlbCxcblx0XHRcdGRpc2FibGVkOiBhdHRycy5kaXNhYmxlZCxcblx0XHRcdG9wdGlvbnM6IHRoaXMub3B0aW9ucyxcblx0XHRcdG5vSWNvbjogdHJ1ZSxcblx0XHRcdGV4cGFuZGVkOiB0cnVlLFxuXHRcdFx0dGFiSW5kZXg6IE51bWJlcihUYWJJbmRleC5Qcm9ncmFtbWF0aWMpLFxuXHRcdFx0cGxhY2Vob2xkZXI6IHRoaXMucmVuZGVyU2VhcmNoSW5wdXQoYXR0cnMpLFxuXHRcdFx0cmVuZGVyRGlzcGxheTogKCkgPT4gdGhpcy5yZW5kZXJTZWFyY2hJbnB1dChhdHRycyksXG5cdFx0XHRyZW5kZXJPcHRpb246IChvcHRpb24pID0+IHRoaXMucmVuZGVyU3VnZ2VzdGlvbkl0ZW0ob3B0aW9uID09PSB0aGlzLnNlbGVjdGVkLCBvcHRpb24pLFxuXHRcdFx0a2VlcEZvY3VzOiB0cnVlLFxuXHRcdH0gc2F0aXNmaWVzIFNlbGVjdEF0dHJpYnV0ZXM8R3Vlc3RJdGVtLCBSZWNpcGllbnRTZWFyY2hSZXN1bHRJdGVtPilcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyU3VnZ2VzdGlvbkl0ZW0oc2VsZWN0ZWQ6IGJvb2xlYW4sIG9wdGlvbjogR3Vlc3RJdGVtKSB7XG5cdFx0Y29uc3QgZmlyc3RSb3cgPVxuXHRcdFx0b3B0aW9uLnZhbHVlLnR5cGUgPT09IFwicmVjaXBpZW50XCJcblx0XHRcdFx0PyBvcHRpb24udmFsdWUudmFsdWUubmFtZVxuXHRcdFx0XHQ6IG0oSWNvbiwge1xuXHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuUGVvcGxlLFxuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0ZmlsbDogdGhlbWUuY29udGVudF9mZyxcblx0XHRcdFx0XHRcdFx0XCJhcmlhLWRlc2NyaWJlZGJ5XCI6IGxhbmcuZ2V0KFwiY29udGFjdExpc3ROYW1lX2xhYmVsXCIpLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0ICB9KVxuXHRcdGNvbnN0IHNlY29uZFJvdyA9IG9wdGlvbi52YWx1ZS50eXBlID09PSBcInJlY2lwaWVudFwiID8gb3B0aW9uLnZhbHVlLnZhbHVlLmFkZHJlc3MgOiBvcHRpb24udmFsdWUudmFsdWUubmFtZVxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIucHQtcy5wYi1zLmNsaWNrLmNvbnRlbnQtaG92ZXIuYnV0dG9uLW1pbi1oZWlnaHRcIixcblx0XHRcdHtcblx0XHRcdFx0Y2xhc3M6IHNlbGVjdGVkID8gXCJjb250ZW50LWFjY2VudC1mZyByb3ctc2VsZWN0ZWQgaWNvbi1hY2NlbnRcIiA6IFwiXCIsXG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XCJwYWRkaW5nLWxlZnRcIjogc2VsZWN0ZWQgPyBweChzaXplLmhwYWRfbGFyZ2UgLSAzKSA6IHB4KHNpemUuaHBhZF9sYXJnZSksXG5cdFx0XHRcdFx0XCJib3JkZXItbGVmdFwiOiBzZWxlY3RlZCA/IFwiM3B4IHNvbGlkXCIgOiBudWxsLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdFttKFwiLnNtYWxsLmZ1bGwtd2lkdGgudGV4dC1lbGxpcHNpc1wiLCBmaXJzdFJvdyksIG0oXCIubmFtZS5mdWxsLXdpZHRoLnRleHQtZWxsaXBzaXNcIiwgc2Vjb25kUm93KV0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBoYW5kbGVTZWxlY3Rpb24oYXR0cnM6IEd1ZXN0UGlja2VyQXR0cnMsIGd1ZXN0OiBSZWNpcGllbnRTZWFyY2hSZXN1bHRJdGVtKSB7XG5cdFx0aWYgKGd1ZXN0LnZhbHVlICE9IG51bGwpIHtcblx0XHRcdGlmIChndWVzdC50eXBlID09PSBcInJlY2lwaWVudFwiKSB7XG5cdFx0XHRcdGNvbnN0IHsgYWRkcmVzcywgbmFtZSwgY29udGFjdCB9ID0gZ3Vlc3QudmFsdWVcblx0XHRcdFx0YXR0cnMub25SZWNpcGllbnRBZGRlZChhZGRyZXNzLCBuYW1lLCBjb250YWN0KVxuXHRcdFx0XHRhdHRycy5zZWFyY2guY2xlYXIoKVxuXHRcdFx0XHR0aGlzLnZhbHVlID0gXCJcIlxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy52YWx1ZSA9IFwiXCJcblx0XHRcdFx0Y29uc3QgcmVjaXBpZW50cyA9IGF3YWl0IGF0dHJzLnNlYXJjaC5yZXNvbHZlQ29udGFjdExpc3QoZ3Vlc3QudmFsdWUpXG5cdFx0XHRcdGZvciAoY29uc3QgeyBhZGRyZXNzLCBuYW1lLCBjb250YWN0IH0gb2YgcmVjaXBpZW50cykge1xuXHRcdFx0XHRcdGF0dHJzLm9uUmVjaXBpZW50QWRkZWQoYWRkcmVzcywgbmFtZSwgY29udGFjdClcblx0XHRcdFx0fVxuXHRcdFx0XHRhdHRycy5zZWFyY2guY2xlYXIoKVxuXHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJTZWFyY2hJbnB1dChhdHRyczogR3Vlc3RQaWNrZXJBdHRycykge1xuXHRcdHJldHVybiBtKFNpbmdsZUxpbmVUZXh0RmllbGQsIHtcblx0XHRcdGNsYXNzZXM6IFtcImhlaWdodC0xMDBwXCJdLFxuXHRcdFx0dmFsdWU6IHRoaXMudmFsdWUsXG5cdFx0XHRwbGFjZWhvbGRlcjogbGFuZy5nZXQoXCJhZGRHdWVzdF9sYWJlbFwiKSxcblx0XHRcdG9uY2xpY2s6IChlOiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcblx0XHRcdFx0aWYgKCF0aGlzLmlzRXhwYW5kZWQgJiYgdGhpcy52YWx1ZS5sZW5ndGggPiAwICYmIHRoaXMuc2VsZWN0RE9NKSB7XG5cdFx0XHRcdFx0Oyh0aGlzLnNlbGVjdERPTS5kb20gYXMgSFRNTEVsZW1lbnQpLmNsaWNrKClcblx0XHRcdFx0XHR0aGlzLmlzRXhwYW5kZWQgPSB0cnVlXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRvbmlucHV0OiAodmFsOiBzdHJpbmcpID0+IHtcblx0XHRcdFx0aWYgKHZhbC5sZW5ndGggPiAwICYmICF0aGlzLmlzRXhwYW5kZWQgJiYgdGhpcy5zZWxlY3RET00pIHtcblx0XHRcdFx0XHQ7KHRoaXMuc2VsZWN0RE9NLmRvbSBhcyBIVE1MRWxlbWVudCkuY2xpY2soKVxuXHRcdFx0XHRcdHRoaXMuaXNFeHBhbmRlZCA9IHRydWVcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIGlmIHRoZSBuZXcgdGV4dCBsZW5ndGggaXMgbW9yZSB0aGFuIG9uZSBjaGFyYWN0ZXIgbG9uZ2VyLFxuXHRcdFx0XHQvLyBpdCBtZWFucyB0aGUgdXNlciBwYXN0ZWQgdGhlIHRleHQgaW4sIHNvIHdlIHdhbnQgdG8gdHJ5IGFuZCByZXNvbHZlIGEgbGlzdCBvZiBjb250YWN0c1xuXHRcdFx0XHRjb25zdCB7IHJlbWFpbmluZ1RleHQsIG5ld1JlY2lwaWVudHMsIGVycm9ycyB9ID0gdmFsLmxlbmd0aCAtIHRoaXMudmFsdWUubGVuZ3RoID4gMSA/IHBhcnNlUGFzdGVkSW5wdXQodmFsKSA6IHBhcnNlVHlwZWRJbnB1dCh2YWwpXG5cblx0XHRcdFx0Zm9yIChjb25zdCB7IGFkZHJlc3MsIG5hbWUgfSBvZiBuZXdSZWNpcGllbnRzKSB7XG5cdFx0XHRcdFx0YXR0cnMub25SZWNpcGllbnRBZGRlZChhZGRyZXNzLCBuYW1lLCBudWxsKVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGVycm9ycy5sZW5ndGggPT09IDEgJiYgbmV3UmVjaXBpZW50cy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHQvLyBpZiB0aGVyZSB3YXMgYSBzaW5nbGUgcmVjaXBpZW50IGFuZCBpdCB3YXMgaW52YWxpZCB0aGVuIGp1c3QgcHJldGVuZCBub3RoaW5nIGhhcHBlbmVkXG5cdFx0XHRcdFx0dGhpcy52YWx1ZSA9IGdldEZpcnN0T3JUaHJvdyhlcnJvcnMpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aWYgKGVycm9ycy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0XHREaWFsb2cubWVzc2FnZShsYW5nLm1ha2VUcmFuc2xhdGlvbihcImVycm9yX21lc3NhZ2VcIiwgYCR7bGFuZy5nZXQoXCJpbnZhbGlkUGFzdGVkUmVjaXBpZW50c19tc2dcIil9XFxuXFxuJHtlcnJvcnMuam9pbihcIlxcblwiKX1gKSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhpcy52YWx1ZSA9IHJlbWFpbmluZ1RleHRcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMuZG9TZWFyY2godmFsLCBhdHRycylcblx0XHRcdH0sXG5cdFx0XHRkaXNhYmxlZDogYXR0cnMuZGlzYWJsZWQsXG5cdFx0XHRhcmlhTGFiZWw6IGF0dHJzLmFyaWFMYWJlbCxcblx0XHRcdG9uZm9jdXM6IChldmVudDogRm9jdXNFdmVudCkgPT4ge1xuXHRcdFx0XHR0aGlzLmlzRm9jdXNlZCA9IHRydWVcblx0XHRcdH0sXG5cdFx0XHRvbmJsdXI6IChlOiBhbnkpID0+IHtcblx0XHRcdFx0aWYgKHRoaXMuaXNGb2N1c2VkKSB7XG5cdFx0XHRcdFx0dGhpcy5yZXNvbHZlSW5wdXQoYXR0cnMsIGZhbHNlKVxuXHRcdFx0XHRcdHRoaXMuaXNGb2N1c2VkID0gZmFsc2Vcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGUucmVkcmF3ID0gZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRvbmtleWRvd246IChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4gdGhpcy5oYW5kbGVLZXlEb3duKGV2ZW50LCBhdHRycyksXG5cdFx0XHR0eXBlOiBUZXh0RmllbGRUeXBlLlRleHQsXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgZG9TZWFyY2ggPSBkZWJvdW5jZVN0YXJ0KERlZmF1bHRBbmltYXRpb25UaW1lLCAodmFsOiBzdHJpbmcsIGF0dHJzOiBHdWVzdFBpY2tlckF0dHJzKSA9PiB7XG5cdFx0YXR0cnMuc2VhcmNoLnNlYXJjaCh2YWwpLnRoZW4oKCkgPT4ge1xuXHRcdFx0Y29uc3Qgc2VhcmNoUmVzdWx0ID0gYXR0cnMuc2VhcmNoLnJlc3VsdHMoKVxuXG5cdFx0XHRpZiAoc2VhcmNoUmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHR0aGlzLnNlbGVjdGVkID0gdW5kZWZpbmVkXG5cdFx0XHR9XG5cblx0XHRcdHRoaXMub3B0aW9ucyhcblx0XHRcdFx0c2VhcmNoUmVzdWx0Lm1hcCgob3B0aW9uKSA9PiAoe1xuXHRcdFx0XHRcdG5hbWU6IG9wdGlvbi52YWx1ZS5uYW1lLFxuXHRcdFx0XHRcdHZhbHVlOiBvcHRpb24sXG5cdFx0XHRcdFx0dHlwZTogb3B0aW9uLnR5cGUsXG5cdFx0XHRcdFx0YXJpYVZhbHVlOiBvcHRpb24udmFsdWUubmFtZSxcblx0XHRcdFx0fSkpLFxuXHRcdFx0KVxuXG5cdFx0XHRtLnJlZHJhdygpXG5cdFx0fSlcblx0fSlcblxuXHRwcml2YXRlIGhhbmRsZUtleURvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQsIGF0dHJzOiBHdWVzdFBpY2tlckF0dHJzKSB7XG5cdFx0Y29uc3Qga2V5UHJlc3MgPSBrZXlib2FyZEV2ZW50VG9LZXlQcmVzcyhldmVudClcblxuXHRcdHN3aXRjaCAoa2V5UHJlc3Mua2V5LnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdGNhc2UgS2V5cy5SRVRVUk4uY29kZTpcblx0XHRcdFx0dGhpcy5yZXNvbHZlSW5wdXQoYXR0cnMsIHRydWUpXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIEtleXMuRE9XTi5jb2RlOlxuXHRcdFx0XHR0aGlzLm1vdmVTZWxlY3Rpb24odHJ1ZSlcblx0XHRcdFx0ZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHRjYXNlIEtleXMuVVAuY29kZTpcblx0XHRcdFx0dGhpcy5tb3ZlU2VsZWN0aW9uKGZhbHNlKVxuXHRcdFx0XHRldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZVxuXHR9XG5cblx0cHJpdmF0ZSBtb3ZlU2VsZWN0aW9uKGZvcndhcmQ6IGJvb2xlYW4pIHtcblx0XHRjb25zdCBzZWxlY3RlZEluZGV4ID0gdGhpcy5zZWxlY3RlZCA/IHRoaXMub3B0aW9ucygpLmluZGV4T2YodGhpcy5zZWxlY3RlZCkgOiAtMVxuXHRcdGNvbnN0IG9wdGlvbnNMZW5ndGggPSB0aGlzLm9wdGlvbnMoKS5sZW5ndGhcblxuXHRcdGxldCBuZXdJbmRleFxuXHRcdGlmIChmb3J3YXJkKSB7XG5cdFx0XHRuZXdJbmRleCA9IHNlbGVjdGVkSW5kZXggKyAxIDwgb3B0aW9uc0xlbmd0aCA/IHNlbGVjdGVkSW5kZXggKyAxIDogMFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRuZXdJbmRleCA9IHNlbGVjdGVkSW5kZXggLSAxID49IDAgPyBzZWxlY3RlZEluZGV4IC0gMSA6IG9wdGlvbnNMZW5ndGggLSAxXG5cdFx0fVxuXG5cdFx0dGhpcy5zZWxlY3RlZCA9IHRoaXMub3B0aW9ucygpW25ld0luZGV4XVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzZWxlY3RTdWdnZXN0aW9uKGF0dHJzOiBHdWVzdFBpY2tlckF0dHJzKSB7XG5cdFx0aWYgKHRoaXMuc2VsZWN0ZWQgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuc2VsZWN0ZWQudmFsdWUudHlwZSA9PT0gXCJyZWNpcGllbnRcIikge1xuXHRcdFx0Y29uc3QgeyBhZGRyZXNzLCBuYW1lLCBjb250YWN0IH0gPSB0aGlzLnNlbGVjdGVkLnZhbHVlLnZhbHVlXG5cdFx0XHRhdHRycy5vblJlY2lwaWVudEFkZGVkKGFkZHJlc3MsIG5hbWUsIGNvbnRhY3QpXG5cdFx0XHRhdHRycy5zZWFyY2guY2xlYXIoKVxuXHRcdFx0dGhpcy52YWx1ZSA9IFwiXCJcblx0XHR9IGVsc2Uge1xuXHRcdFx0YXR0cnMuc2VhcmNoLmNsZWFyKClcblx0XHRcdHRoaXMudmFsdWUgPSBcIlwiXG5cdFx0XHRjb25zdCByZWNpcGllbnRzID0gYXdhaXQgYXR0cnMuc2VhcmNoLnJlc29sdmVDb250YWN0TGlzdCh0aGlzLnNlbGVjdGVkLnZhbHVlLnZhbHVlKVxuXHRcdFx0Zm9yIChjb25zdCB7IGFkZHJlc3MsIG5hbWUsIGNvbnRhY3QgfSBvZiByZWNpcGllbnRzKSB7XG5cdFx0XHRcdGF0dHJzLm9uUmVjaXBpZW50QWRkZWQoYWRkcmVzcywgbmFtZSwgY29udGFjdClcblx0XHRcdH1cblx0XHRcdG0ucmVkcmF3KClcblx0XHR9XG5cblx0XHR0aGlzLmNsb3NlUGlja2VyKClcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXNvbHZlcyBhIHR5cGVkIGluIG1haWwgYWRkcmVzcyBvciBvbmUgb2YgdGhlIHN1Z2dlc3RlZCBvbmVzLlxuXHQgKiBAcGFyYW0gYXR0cnNcblx0ICogQHBhcmFtIHNlbGVjdFN1Z2dlc3Rpb24gYm9vbGVhbiB2YWx1ZSBpbmRpY2F0aW5nIHdoZXRoZXIgYSBzdWdnZXN0aW9uIHNob3VsZCBiZSBzZWxlY3RlZCBvciBub3QuIFNob3VsZCBiZSB0cnVlIGlmIGEgc3VnZ2VzdGlvbiBpcyBleHBsaWNpdGx5IHNlbGVjdGVkIGJ5XG5cdCAqIGZvciBleGFtcGxlIGhpdHRpbmcgdGhlIGVudGVyIGtleSBhbmQgZmFsc2UgZS5nLiBpZiB0aGUgZGlhbG9nIGlzIGNsb3NlZFxuXHQgKi9cblx0cHJpdmF0ZSByZXNvbHZlSW5wdXQoYXR0cnM6IEd1ZXN0UGlja2VyQXR0cnMsIHNlbGVjdFN1Z2dlc3Rpb246IGJvb2xlYW4pIHtcblx0XHRjb25zdCBzdWdnZXN0aW9ucyA9IGF0dHJzLnNlYXJjaC5yZXN1bHRzKClcblx0XHRpZiAoc3VnZ2VzdGlvbnMubGVuZ3RoID4gMCAmJiBzZWxlY3RTdWdnZXN0aW9uKSB7XG5cdFx0XHR0aGlzLnNlbGVjdFN1Z2dlc3Rpb24oYXR0cnMpXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IHBhcnNlZCA9IHBhcnNlTWFpbEFkZHJlc3ModGhpcy52YWx1ZSlcblx0XHRcdGlmIChwYXJzZWQgIT0gbnVsbCkge1xuXHRcdFx0XHRhdHRycy5vblJlY2lwaWVudEFkZGVkKHBhcnNlZC5hZGRyZXNzLCBwYXJzZWQubmFtZSwgbnVsbClcblx0XHRcdFx0dGhpcy52YWx1ZSA9IFwiXCJcblx0XHRcdFx0dGhpcy5jbG9zZVBpY2tlcigpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBjbG9zZVBpY2tlcigpIHtcblx0XHRpZiAodGhpcy5zZWxlY3RET00pIHtcblx0XHRcdDsodGhpcy5zZWxlY3RET00uc3RhdGUgYXMgU2VsZWN0U3RhdGUpLmRyb3Bkb3duQ29udGFpbmVyPy5vbkNsb3NlKClcblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDbGFzc0NvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBTaW5nbGVMaW5lVGV4dEZpZWxkIH0gZnJvbSBcIi4vYmFzZS9TaW5nbGVMaW5lVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB7IFRleHRGaWVsZFR5cGUgfSBmcm9tIFwiLi9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBJY29uQnV0dG9uIH0gZnJvbSBcIi4vYmFzZS9JY29uQnV0dG9uLmpzXCJcbmltcG9ydCB7IEJ1dHRvblNpemUgfSBmcm9tIFwiLi9iYXNlL0J1dHRvblNpemUuanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi9iYXNlL2ljb25zL0ljb25zLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4vdGhlbWUuanNcIlxuaW1wb3J0IHsgc2NhbGVUb1Zpc3VhbFBhc3N3b3JkU3RyZW5ndGggfSBmcm9tIFwiLi4vbWlzYy9wYXNzd29yZHMvUGFzc3dvcmRVdGlscy5qc1wiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuL3NpemUuanNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcblxuZXhwb3J0IGludGVyZmFjZSBQYXNzd29yZElucHV0QXR0cmlidXRlcyB7XG5cdGFyaWFMYWJlbDogc3RyaW5nXG5cdHBhc3N3b3JkOiBzdHJpbmdcblx0c3RyZW5ndGg6IG51bWJlclxuXHRvbmlucHV0OiAobmV3VmFsdWU6IHN0cmluZykgPT4gdW5rbm93blxuXHRzaG93U3RyZW5ndGg/OiBib29sZWFuXG59XG5cbmV4cG9ydCBjbGFzcyBQYXNzd29yZElucHV0IGltcGxlbWVudHMgQ2xhc3NDb21wb25lbnQ8UGFzc3dvcmRJbnB1dEF0dHJpYnV0ZXM+IHtcblx0cHJpdmF0ZSBzaG93UGFzc3dvcmQ6IGJvb2xlYW4gPSBmYWxzZVxuXG5cdHZpZXcodm5vZGU6IFZub2RlPFBhc3N3b3JkSW5wdXRBdHRyaWJ1dGVzLCB0aGlzPik6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcIi5mbGV4LmZsZXgtZ3Jvdy5mdWxsLXdpZHRoLmp1c3RpZnktYmV0d2Vlbi5pdGVtcy1jZW50ZXIuZ2FwLXZwYWQtc1wiLCBbXG5cdFx0XHR2bm9kZS5hdHRycy5zaG93U3RyZW5ndGhcblx0XHRcdFx0PyBtKFwiZGl2XCIsIHtcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdHdpZHRoOiBweChzaXplLmljb25fc2l6ZV9tZWRpdW0pLFxuXHRcdFx0XHRcdFx0XHRoZWlnaHQ6IHB4KHNpemUuaWNvbl9zaXplX21lZGl1bSksXG5cdFx0XHRcdFx0XHRcdGJvcmRlcjogYDFweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYnV0dG9ufWAsXG5cdFx0XHRcdFx0XHRcdGJvcmRlclJhZGl1czogXCI1MCVcIixcblx0XHRcdFx0XHRcdFx0YmFja2dyb3VuZDogYGNvbmljLWdyYWRpZW50KGZyb20gLjI1dHVybiwgJHt0aGVtZS5jb250ZW50X2J1dHRvbn0gJHtzY2FsZVRvVmlzdWFsUGFzc3dvcmRTdHJlbmd0aChcblx0XHRcdFx0XHRcdFx0XHR2bm9kZS5hdHRycy5zdHJlbmd0aCxcblx0XHRcdFx0XHRcdFx0KX0lLCB0cmFuc3BhcmVudCAwJSlgLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0ICB9KVxuXHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRtKFNpbmdsZUxpbmVUZXh0RmllbGQsIHtcblx0XHRcdFx0Y2xhc3NlczogW1wiZmxleC1ncm93XCJdLFxuXHRcdFx0XHRhcmlhTGFiZWw6IHZub2RlLmF0dHJzLmFyaWFMYWJlbCxcblx0XHRcdFx0dHlwZTogdGhpcy5zaG93UGFzc3dvcmQgPyBUZXh0RmllbGRUeXBlLlRleHQgOiBUZXh0RmllbGRUeXBlLlBhc3N3b3JkLFxuXHRcdFx0XHR2YWx1ZTogdm5vZGUuYXR0cnMucGFzc3dvcmQsXG5cdFx0XHRcdG9uaW5wdXQ6IHZub2RlLmF0dHJzLm9uaW5wdXQsXG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0cGFkZGluZzogYCR7cHgoc2l6ZS52cGFkX3hzbSl9ICR7cHgoc2l6ZS52cGFkX3NtYWxsKX1gLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRwbGFjZWhvbGRlcjogbGFuZy5nZXQoXCJwYXNzd29yZF9sYWJlbFwiKSxcblx0XHRcdH0pLFxuXHRcdFx0bShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdHNpemU6IEJ1dHRvblNpemUuQ29tcGFjdCxcblx0XHRcdFx0dGl0bGU6IHRoaXMuc2hvd1Bhc3N3b3JkID8gXCJjb25jZWFsUGFzc3dvcmRfYWN0aW9uXCIgOiBcInJldmVhbFBhc3N3b3JkX2FjdGlvblwiLFxuXHRcdFx0XHRpY29uOiB0aGlzLnNob3dQYXNzd29yZCA/IEljb25zLk5vRXllIDogSWNvbnMuRXllLFxuXHRcdFx0XHRjbGljazogKCkgPT4gKHRoaXMuc2hvd1Bhc3N3b3JkID0gIXRoaXMuc2hvd1Bhc3N3b3JkKSxcblx0XHRcdH0pLFxuXHRcdF0pXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENsYXNzQ29tcG9uZW50LCBWbm9kZSwgVm5vZGVET00gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBLZXlzLCBUYWJJbmRleCB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IGlzS2V5UHJlc3NlZCB9IGZyb20gXCIuLi8uLi9taXNjL0tleU1hbmFnZXIuanNcIlxuaW1wb3J0IHsgQXJpYVJvbGUgfSBmcm9tIFwiLi4vQXJpYVV0aWxzLmpzXCJcblxudHlwZSBTd2l0Y2hWYXJpYW50ID0gXCJub3JtYWxcIiB8IFwiZXhwYW5kZWRcIlxudHlwZSBUb2dnbGVQaWxsUG9zaXRpb24gPSBcImxlZnRcIiB8IFwicmlnaHRcIlxudHlwZSBIVE1MRWxlbWVudFdpdGhBdHRycyA9IFBhcnRpYWw8UGljazxtLkF0dHJpYnV0ZXMsIFwiY2xhc3NcIj4gJiBPbWl0PEhUTUxFbGVtZW50LCBcInN0eWxlXCI+ICYgU3dpdGNoQXR0cnM+XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3dpdGNoQXR0cnMge1xuXHRjaGVja2VkOiBib29sZWFuXG5cdG9uY2xpY2s6IChjaGVja2VkOiBib29sZWFuKSA9PiB1bmtub3duXG5cdGFyaWFMYWJlbDogc3RyaW5nXG5cdGRpc2FibGVkPzogYm9vbGVhblxuXHR0b2dnbGVQaWxsUG9zaXRpb24/OiBUb2dnbGVQaWxsUG9zaXRpb25cblx0Y2xhc3Nlcz86IEFycmF5PHN0cmluZz5cblx0dmFyaWFudD86IFN3aXRjaFZhcmlhbnRcbn1cblxuLyoqXG4gKiBTd2l0Y2ggY29tcG9uZW50IHdpdGggdmFyaWFudHNcbiAqIEBzZWUgQ29tcG9uZW50IGF0dHJpYnV0ZXM6IHtTd2l0Y2hBdHRyc31cbiAqIEBleGFtcGxlXG4gKiBtKFN3aXRjaCxcbiAqICAgICB7XG4gKiAgICAgICAgIGNsYXNzZXM6IFtcIm15LWN1c3RvbS1zd2l0Y2gtY2xhc3NcIl0sXG4gKiAgICAgICAgIGNoZWNrZWQ6IHRoaXMuY2hlY2tlZCxcbiAqICAgICAgICAgb25jbGljazogKGNoZWNrZWQ6IGJvb2xlYW4pID0+IHtcbiAqICAgICAgICAgICAgIHRoaXMuY2hlY2tlZCA9IGNoZWNrZWRcbiAqICAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuY2hlY2tlZClcbiAqICAgICAgICAgfSxcbiAqICAgICAgICAgdG9nZ2xlUGlsbFBvc2l0aW9uOiBcInJpZ2h0XCIsXG4gKiAgICAgICAgIGFyaWFMYWJlbDogXCJUZXN0IFN3aXRjaFwiLFxuICogICAgICAgICBkaXNhYmxlZDogZmFsc2UsXG4gKiAgICAgICAgIHZhcmlhbnQ6IFwibm9ybWFsXCIsXG4gKiAgICAgfSxcbiAqICAgICBcIk15IGxhYmVsXCIsXG4gKiApLFxuICovXG5leHBvcnQgY2xhc3MgU3dpdGNoIGltcGxlbWVudHMgQ2xhc3NDb21wb25lbnQ8U3dpdGNoQXR0cnM+IHtcblx0cHJpdmF0ZSBjaGVja2JveERvbT86IEhUTUxJbnB1dEVsZW1lbnRcblxuXHR2aWV3KHsgYXR0cnM6IHsgZGlzYWJsZWQsIHZhcmlhbnQsIGFyaWFMYWJlbCwgY2hlY2tlZCwgb25jbGljaywgdG9nZ2xlUGlsbFBvc2l0aW9uLCBjbGFzc2VzIH0sIGNoaWxkcmVuIH06IFZub2RlPFN3aXRjaEF0dHJzPikge1xuXHRcdGNvbnN0IGNoaWxkcmVuQXJyID0gW2NoaWxkcmVuLCB0aGlzLmJ1aWxkVG9nZ2xlUGlsbENvbXBvbmVudChjaGVja2VkLCBvbmNsaWNrLCBkaXNhYmxlZCldXG5cdFx0aWYgKHRvZ2dsZVBpbGxQb3NpdGlvbiA9PT0gXCJsZWZ0XCIpIHtcblx0XHRcdGNoaWxkcmVuQXJyLnJldmVyc2UoKVxuXHRcdH1cblxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCJsYWJlbC50dXRhdWktc3dpdGNoLmZsYXNoXCIsXG5cdFx0XHR7XG5cdFx0XHRcdGNsYXNzOiB0aGlzLnJlc29sdmVDbGFzc2VzKGNsYXNzZXMsIGRpc2FibGVkLCB2YXJpYW50KSxcblx0XHRcdFx0cm9sZTogQXJpYVJvbGUuU3dpdGNoLFxuXHRcdFx0XHRhcmlhTGFiZWw6IGFyaWFMYWJlbCxcblx0XHRcdFx0YXJpYUNoZWNrZWQ6IFN0cmluZyhjaGVja2VkKSxcblx0XHRcdFx0YXJpYURpc2FibGVkOiBkaXNhYmxlZCA/IFwidHJ1ZVwiIDogdW5kZWZpbmVkLFxuXHRcdFx0XHR0YWJJbmRleDogTnVtYmVyKGRpc2FibGVkID8gVGFiSW5kZXguUHJvZ3JhbW1hdGljIDogVGFiSW5kZXguRGVmYXVsdCksXG5cdFx0XHRcdG9ua2V5ZG93bjogKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcblx0XHRcdFx0XHRpZiAoaXNLZXlQcmVzc2VkKGUua2V5LCBLZXlzLlNQQUNFLCBLZXlzLlJFVFVSTikpIHtcblx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRcdFx0dGhpcy5jaGVja2JveERvbT8uY2xpY2soKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdH0gc2F0aXNmaWVzIEhUTUxFbGVtZW50V2l0aEF0dHJzLFxuXHRcdFx0Y2hpbGRyZW5BcnIsXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBidWlsZFRvZ2dsZVBpbGxDb21wb25lbnQoY2hlY2tlZDogYm9vbGVhbiA9IGZhbHNlLCBvbmNsaWNrOiAoY2hlY2tlZDogYm9vbGVhbikgPT4gdW5rbm93biwgZGlzYWJsZWQ6IGJvb2xlYW4gfCB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwic3Bhbi50dXRhdWktdG9nZ2xlLXBpbGxcIixcblx0XHRcdHtcblx0XHRcdFx0Y2xhc3M6IHRoaXMuY2hlY2tib3hEb20/LmNoZWNrZWQgPyBcImNoZWNrZWRcIiA6IFwidW5jaGVja2VkXCIsXG5cdFx0XHR9LFxuXHRcdFx0bShcImlucHV0W3R5cGU9J2NoZWNrYm94J11cIiwge1xuXHRcdFx0XHRyb2xlOiBBcmlhUm9sZS5Td2l0Y2gsXG5cdFx0XHRcdG9uY2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRvbmNsaWNrKHRoaXMuY2hlY2tib3hEb20/LmNoZWNrZWQgPz8gZmFsc2UpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uY3JlYXRlOiAoeyBkb20gfTogVm5vZGVET008SFRNTElucHV0RWxlbWVudD4pID0+IHtcblx0XHRcdFx0XHR0aGlzLmNoZWNrYm94RG9tID0gZG9tIGFzIEhUTUxJbnB1dEVsZW1lbnRcblx0XHRcdFx0XHR0aGlzLmNoZWNrYm94RG9tLmNoZWNrZWQgPSBjaGVja2VkXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRhYkluZGV4OiBUYWJJbmRleC5Qcm9ncmFtbWF0aWMsXG5cdFx0XHRcdGRpc2FibGVkOiBkaXNhYmxlZCA/IHRydWUgOiB1bmRlZmluZWQsXG5cdFx0XHR9KSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHJlc29sdmVDbGFzc2VzKGNsYXNzZXM6IEFycmF5PHN0cmluZz4gPSBbXSwgZGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZSwgdmFyaWFudDogU3dpdGNoVmFyaWFudCA9IFwibm9ybWFsXCIpIHtcblx0XHRjb25zdCBjbGFzc0xpc3QgPSBbLi4uY2xhc3Nlc11cblxuXHRcdGlmIChkaXNhYmxlZCkgY2xhc3NMaXN0LnB1c2goXCJkaXNhYmxlZFwiLCBcImNsaWNrLWRpc2FibGVkXCIpXG5cdFx0ZWxzZSBjbGFzc0xpc3QucHVzaChcImNsaWNrXCIpXG5cblx0XHRpZiAodmFyaWFudCA9PT0gXCJleHBhbmRlZFwiKSBjbGFzc0xpc3QucHVzaChcImp1c3RpZnktYmV0d2VlblwiLCBcImZ1bGwtd2lkdGhcIilcblx0XHRlbHNlIGNsYXNzTGlzdC5wdXNoKFwiZml0LWNvbnRlbnRcIilcblxuXHRcdHJldHVybiBjbGFzc0xpc3Quam9pbihcIiBcIilcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2xhc3NDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuXG5leHBvcnQgaW50ZXJmYWNlIERpdmlkZXJBdHRycyB7XG5cdGNvbG9yOiBzdHJpbmdcblx0c3R5bGU/OiBQaWNrPENTU1N0eWxlRGVjbGFyYXRpb24sIFwibWFyZ2luXCI+XG59XG5cbmV4cG9ydCBjbGFzcyBEaXZpZGVyIGltcGxlbWVudHMgQ2xhc3NDb21wb25lbnQ8RGl2aWRlckF0dHJzPiB7XG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxEaXZpZGVyQXR0cnM+KSB7XG5cdFx0cmV0dXJuIG0oXCJoci5tLTAuYm9yZGVyLW5vbmUuZnVsbC13aWR0aFwiLCB7XG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRoZWlnaHQ6IFwiMXB4XCIsXG5cdFx0XHRcdGJhY2tncm91bmRDb2xvcjogYXR0cnMuY29sb3IsXG5cdFx0XHRcdGNvbG9yOiBhdHRycy5jb2xvcixcblx0XHRcdFx0Li4uYXR0cnMuc3R5bGUsXG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgUmVjaXBpZW50VHlwZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9yZWNpcGllbnRzL1JlY2lwaWVudC5qc1wiXG5pbXBvcnQgeyBUb2dnbGVCdXR0b24gfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2J1dHRvbnMvVG9nZ2xlQnV0dG9uLmpzXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9JY29ucy5qc1wiXG5pbXBvcnQgeyBCdXR0b25TaXplIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b25TaXplLmpzXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgQWNjb3VudFR5cGUsIENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgUmVjaXBpZW50c1NlYXJjaE1vZGVsIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9taXNjL1JlY2lwaWVudHNTZWFyY2hNb2RlbC5qc1wiXG5pbXBvcnQgeyBHdWVzdCB9IGZyb20gXCIuLi8uLi92aWV3L0NhbGVuZGFySW52aXRlcy5qc1wiXG5pbXBvcnQgeyBJY29uLCBJY29uU2l6ZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbi5qc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL3RoZW1lLmpzXCJcbmltcG9ydCB7IEljb25CdXR0b24gfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb25CdXR0b24uanNcIlxuaW1wb3J0IHsgcHgsIHNpemUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9zaXplLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyRXZlbnRXaG9Nb2RlbCB9IGZyb20gXCIuLi9ldmVudGVkaXRvci1tb2RlbC9DYWxlbmRhckV2ZW50V2hvTW9kZWwuanNcIlxuaW1wb3J0IHsgTG9naW5Db250cm9sbGVyIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Mb2dpbkNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudE1vZGVsLCBDYWxlbmRhck9wZXJhdGlvbiB9IGZyb20gXCIuLi9ldmVudGVkaXRvci1tb2RlbC9DYWxlbmRhckV2ZW50TW9kZWwuanNcIlxuaW1wb3J0IHsgc2hvd1BsYW5VcGdyYWRlUmVxdWlyZWREaWFsb2cgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvU3Vic2NyaXB0aW9uRGlhbG9ncy5qc1wiXG5pbXBvcnQgeyBoYXNQbGFuV2l0aEludml0ZXMgfSBmcm9tIFwiLi4vZXZlbnRlZGl0b3ItbW9kZWwvQ2FsZW5kYXJOb3RpZmljYXRpb25Nb2RlbC5qc1wiXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0RpYWxvZy5qc1wiXG5cbmltcG9ydCB7IEF0dGVuZGluZ0l0ZW0sIGNyZWF0ZUF0dGVuZGluZ0l0ZW1zLCBpY29uRm9yQXR0ZW5kZWVTdGF0dXMgfSBmcm9tIFwiLi4vQ2FsZW5kYXJHdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBDYXJkIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9DYXJkLmpzXCJcbmltcG9ydCB7IFNlbGVjdCwgU2VsZWN0QXR0cmlidXRlcyB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvU2VsZWN0LmpzXCJcbmltcG9ydCBzdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB7IE9yZ2FuaXplclNlbGVjdEl0ZW0gfSBmcm9tIFwiLi9DYWxlbmRhckV2ZW50RWRpdFZpZXcuanNcIlxuaW1wb3J0IHsgR3Vlc3RQaWNrZXIgfSBmcm9tIFwiLi4vcGlja2Vycy9HdWVzdFBpY2tlci5qc1wiXG5pbXBvcnQgeyBJY29uTWVzc2FnZUJveCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQ29sdW1uRW1wdHlNZXNzYWdlQm94LmpzXCJcbmltcG9ydCB7IFBhc3N3b3JkSW5wdXQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9QYXNzd29yZElucHV0LmpzXCJcbmltcG9ydCB7IFN3aXRjaCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvU3dpdGNoLmpzXCJcbmltcG9ydCB7IERpdmlkZXIgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9EaXZpZGVyLmpzXCJcblxuZXhwb3J0IHR5cGUgQXR0ZW5kZWVMaXN0RWRpdG9yQXR0cnMgPSB7XG5cdC8qKiB0aGUgZXZlbnQgdGhhdCBpcyBjdXJyZW50bHkgYmVpbmcgZWRpdGVkICovXG5cdG1vZGVsOiBDYWxlbmRhckV2ZW50TW9kZWxcblxuXHQvKiogdGhlc2UgYXJlIG5lZWRlZCB0byBzaG93IHN1Z2dlc3Rpb25zIGFuZCBleHRlcm5hbCBwYXNzd29yZHMuICovXG5cdHJlY2lwaWVudHNTZWFyY2g6IFJlY2lwaWVudHNTZWFyY2hNb2RlbFxuXHRsb2dpbnM6IExvZ2luQ29udHJvbGxlclxuXHR3aWR0aDogbnVtYmVyXG59XG5cbi8qKlxuICogYW4gZWRpdG9yIHRoYXQgY2FuIGVkaXQgdGhlIGF0dGVuZGVlcyBsaXN0IG9mIGEgY2FsZW5kYXIgZXZlbnQgd2l0aCBzdWdnZXN0aW9ucyxcbiAqIGluY2x1ZGluZyB0aGUgb3duIGF0dGVuZGFuY2UsIHRoZSBvd24gb3JnYW5pemVyIGFkZHJlc3MgYW5kIGV4dGVybmFsIHBhc3N3b3Jkcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEF0dGVuZGVlTGlzdEVkaXRvciBpbXBsZW1lbnRzIENvbXBvbmVudDxBdHRlbmRlZUxpc3RFZGl0b3JBdHRycz4ge1xuXHRwcml2YXRlIGhhc1BsYW5XaXRoSW52aXRlczogYm9vbGVhbiA9IGZhbHNlXG5cblx0dmlldyh7IGF0dHJzIH06IFZub2RlPEF0dGVuZGVlTGlzdEVkaXRvckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IHdob01vZGVsIH0gPSBhdHRycy5tb2RlbC5lZGl0TW9kZWxzXG5cdFx0Y29uc3Qgb3JnYW5pemVyID0gd2hvTW9kZWwub3JnYW5pemVyXG5cdFx0cmV0dXJuIFtcblx0XHRcdG0oXCIuZmxleC1ncm93LmZsZXguZmxleC1jb2x1bW4uZ2FwLXZwYWQucGIucHQuZml0LWhlaWdodFwiLCB7IHN0eWxlOiB7IHdpZHRoOiBweChhdHRycy53aWR0aCkgfSB9LCBbXG5cdFx0XHRcdHRoaXMucmVuZGVyT3JnYW5pemVyKGF0dHJzLm1vZGVsLCBvcmdhbml6ZXIpLFxuXHRcdFx0XHRtKFwiLmZsZXguZmxleC1jb2x1bW4uZ2FwLXZwYWQtc1wiLCBbXG5cdFx0XHRcdFx0bShcInNtYWxsLnVwcGVyY2FzZS5iLnRleHQtZWxsaXBzaXNcIiwgeyBzdHlsZTogeyBjb2xvcjogdGhlbWUubmF2aWdhdGlvbl9idXR0b24gfSB9LCBsYW5nLmdldChcImd1ZXN0c19sYWJlbFwiKSksXG5cdFx0XHRcdFx0d2hvTW9kZWwuY2FuTW9kaWZ5R3Vlc3RzID8gdGhpcy5yZW5kZXJHdWVzdHNJbnB1dCh3aG9Nb2RlbCwgYXR0cnMubG9naW5zLCBhdHRycy5yZWNpcGllbnRzU2VhcmNoKSA6IG51bGwsXG5cdFx0XHRcdFx0dGhpcy5yZW5kZXJTZW5kVXBkYXRlQ2hlY2tib3goYXR0cnMubW9kZWwuZWRpdE1vZGVscy53aG9Nb2RlbCksXG5cdFx0XHRcdFx0dGhpcy5yZW5kZXJHdWVzdExpc3QoYXR0cnMsIG9yZ2FuaXplciksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XSksXG5cdFx0XVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJHdWVzdExpc3QoYXR0cnM6IEF0dGVuZGVlTGlzdEVkaXRvckF0dHJzLCBvcmdhbml6ZXI6IEd1ZXN0IHwgbnVsbCk6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IHdob01vZGVsIH0gPSBhdHRycy5tb2RlbC5lZGl0TW9kZWxzXG5cdFx0Y29uc3QgZ3Vlc3RJdGVtczogKCgpID0+IENoaWxkcmVuKVtdID0gW11cblxuXHRcdGZvciAoY29uc3QgZ3Vlc3Qgb2Ygd2hvTW9kZWwuZ3Vlc3RzKSB7XG5cdFx0XHRsZXQgcGFzc3dvcmQ6IHN0cmluZ1xuXHRcdFx0bGV0IHN0cmVuZ3RoOiBudW1iZXJcblxuXHRcdFx0aWYgKGd1ZXN0LnR5cGUgPT09IFJlY2lwaWVudFR5cGUuRVhURVJOQUwpIHtcblx0XHRcdFx0Y29uc3QgcHJlc2hhcmVkUGFzc3dvcmQgPSB3aG9Nb2RlbC5nZXRQcmVzaGFyZWRQYXNzd29yZChndWVzdC5hZGRyZXNzKVxuXHRcdFx0XHRwYXNzd29yZCA9IHByZXNoYXJlZFBhc3N3b3JkLnBhc3N3b3JkXG5cdFx0XHRcdHN0cmVuZ3RoID0gcHJlc2hhcmVkUGFzc3dvcmQuc3RyZW5ndGhcblx0XHRcdH1cblxuXHRcdFx0Z3Vlc3RJdGVtcy5wdXNoKCgpID0+IHRoaXMucmVuZGVyR3Vlc3QoZ3Vlc3QsIGF0dHJzLCBwYXNzd29yZCwgc3RyZW5ndGgpKVxuXHRcdH1cblxuXHRcdC8vIG93bkd1ZXN0IGlzIG5ldmVyIGluIHRoZSBndWVzdCBsaXN0LCBidXQgaXQgbWF5IGJlIGlkZW50aWNhbCB0byBvcmdhbml6ZXIuXG5cdFx0Y29uc3Qgb3duR3Vlc3QgPSB3aG9Nb2RlbC5vd25HdWVzdFxuXHRcdGlmIChvd25HdWVzdCAhPSBudWxsICYmIG93bkd1ZXN0LmFkZHJlc3MgIT09IG9yZ2FuaXplcj8uYWRkcmVzcykge1xuXHRcdFx0Z3Vlc3RJdGVtcy5wdXNoKCgpID0+IHRoaXMucmVuZGVyR3Vlc3Qob3duR3Vlc3QsIGF0dHJzKSlcblx0XHR9XG5cblx0XHRjb25zdCB2ZXJ0aWNhbFBhZGRpbmcgPSBndWVzdEl0ZW1zLmxlbmd0aCA+IDAgPyBzaXplLnZwYWRfc21hbGwgOiAwXG5cblx0XHRyZXR1cm4gZ3Vlc3RJdGVtcy5sZW5ndGggPT09IDBcblx0XHRcdD8gbShcblx0XHRcdFx0XHRDYXJkLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNsYXNzZXM6IFtcIm1pbi1oLXMgZmxleCBmbGV4LWNvbHVtbiBnYXAtdnBhZC1zXCJdLFxuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0cGFkZGluZzogYCR7cHgodmVydGljYWxQYWRkaW5nKX0gJHtweChndWVzdEl0ZW1zLmxlbmd0aCA9PT0gMCA/IHNpemUudnBhZF9zbWFsbCA6IDApfSAke3B4KHNpemUudnBhZF9zbWFsbCl9ICR7cHgoXG5cdFx0XHRcdFx0XHRcdFx0dmVydGljYWxQYWRkaW5nLFxuXHRcdFx0XHRcdFx0XHQpfWAsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0bShcIi5mbGV4Lml0ZW1zLWNlbnRlci5qdXN0aWZ5LWNlbnRlci5taW4taC1zXCIsIFtcblx0XHRcdFx0XHRcdG0oSWNvbk1lc3NhZ2VCb3gsIHtcblx0XHRcdFx0XHRcdFx0bWVzc2FnZTogXCJub0VudHJpZXNfbXNnXCIsXG5cdFx0XHRcdFx0XHRcdGljb246IEljb25zLlBlb3BsZSxcblx0XHRcdFx0XHRcdFx0Y29sb3I6IHRoZW1lLmxpc3RfbWVzc2FnZV9iZyxcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdF0pLFxuXHRcdFx0ICApXG5cdFx0XHQ6IGd1ZXN0SXRlbXMubWFwKChyLCBpbmRleCkgPT4gcigpKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJHdWVzdHNJbnB1dCh3aG9Nb2RlbDogQ2FsZW5kYXJFdmVudFdob01vZGVsLCBsb2dpbnM6IExvZ2luQ29udHJvbGxlciwgcmVjaXBpZW50c1NlYXJjaDogUmVjaXBpZW50c1NlYXJjaE1vZGVsKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGd1ZXN0cyA9IHdob01vZGVsLmd1ZXN0c1xuXHRcdGNvbnN0IGhhc0V4dGVybmFsR3Vlc3RzID0gZ3Vlc3RzLnNvbWUoKGEpID0+IGEudHlwZSA9PT0gUmVjaXBpZW50VHlwZS5FWFRFUk5BTClcblxuXHRcdHJldHVybiBtKFwiLmZsZXguaXRlbXMtY2VudGVyLmZsZXgtZ3Jvdy5nYXAtdnBhZC1zXCIsIFtcblx0XHRcdG0oQ2FyZCwgeyBzdHlsZTogeyBwYWRkaW5nOiBcIjBcIiB9LCBjbGFzc2VzOiBbXCJmbGV4LWdyb3dcIl0gfSwgW1xuXHRcdFx0XHRtKFwiLmZsZXguZmxleC1ncm93LnJlbC5idXR0b24taGVpZ2h0XCIsIFtcblx0XHRcdFx0XHRtKEd1ZXN0UGlja2VyLCB7XG5cdFx0XHRcdFx0XHRhcmlhTGFiZWw6IFwiYWRkR3Vlc3RfbGFiZWxcIixcblx0XHRcdFx0XHRcdGRpc2FibGVkOiBmYWxzZSxcblx0XHRcdFx0XHRcdG9uUmVjaXBpZW50QWRkZWQ6IGFzeW5jIChhZGRyZXNzLCBuYW1lLCBjb250YWN0KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGlmICghKGF3YWl0IGhhc1BsYW5XaXRoSW52aXRlcyhsb2dpbnMpKSAmJiAhdGhpcy5oYXNQbGFuV2l0aEludml0ZXMpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAobG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlci5hY2NvdW50VHlwZSA9PT0gQWNjb3VudFR5cGUuRVhURVJOQUwpIHJldHVyblxuXHRcdFx0XHRcdFx0XHRcdGlmIChsb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc0dsb2JhbEFkbWluKCkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IHsgZ2V0QXZhaWxhYmxlUGxhbnNXaXRoRXZlbnRJbnZpdGVzIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi8uLi9jb21tb24vc3Vic2NyaXB0aW9uL1N1YnNjcmlwdGlvblV0aWxzLmpzXCIpXG5cdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBwbGFuc1dpdGhFdmVudEludml0ZXMgPSBhd2FpdCBnZXRBdmFpbGFibGVQbGFuc1dpdGhFdmVudEludml0ZXMoKVxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKHBsYW5zV2l0aEV2ZW50SW52aXRlcy5sZW5ndGggPT09IDApIHJldHVyblxuXHRcdFx0XHRcdFx0XHRcdFx0Ly9lbnRpdHkgZXZlbnQgdXBkYXRlcyBhcmUgdG9vIHNsb3cgdG8gY2FsbCB1cGRhdGVCdXNpbmVzc0ZlYXR1cmUoKVxuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5oYXNQbGFuV2l0aEludml0ZXMgPSBhd2FpdCBzaG93UGxhblVwZ3JhZGVSZXF1aXJlZERpYWxvZyhwbGFuc1dpdGhFdmVudEludml0ZXMpXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyB0aGUgdXNlciBjb3VsZCBoYXZlLCBidXQgZGlkIG5vdCB1cGdyYWRlLlxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKCF0aGlzLmhhc1BsYW5XaXRoSW52aXRlcykgcmV0dXJuXG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdERpYWxvZy5tZXNzYWdlKFwiY29udGFjdEFkbWluX21zZ1wiKVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHR3aG9Nb2RlbC5hZGRBdHRlbmRlZShhZGRyZXNzLCBjb250YWN0KVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0c2VhcmNoOiByZWNpcGllbnRzU2VhcmNoLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRdKSxcblx0XHRcdF0pLFxuXHRcdFx0aGFzRXh0ZXJuYWxHdWVzdHNcblx0XHRcdFx0PyBtKFxuXHRcdFx0XHRcdFx0Q2FyZCxcblx0XHRcdFx0XHRcdHsgc3R5bGU6IHsgcGFkZGluZzogXCIwXCIgfSB9LFxuXHRcdFx0XHRcdFx0bShUb2dnbGVCdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0dGl0bGU6IFwiY29uZmlkZW50aWFsX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRvblRvZ2dsZWQ6IChfLCBlKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0d2hvTW9kZWwuaXNDb25maWRlbnRpYWwgPSAhd2hvTW9kZWwuaXNDb25maWRlbnRpYWxcblx0XHRcdFx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdGljb246IHdob01vZGVsLmlzQ29uZmlkZW50aWFsID8gSWNvbnMuTG9jayA6IEljb25zLlVubG9jayxcblx0XHRcdFx0XHRcdFx0dG9nZ2xlZDogd2hvTW9kZWwuaXNDb25maWRlbnRpYWwsXG5cdFx0XHRcdFx0XHRcdHNpemU6IEJ1dHRvblNpemUuTm9ybWFsLFxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdCAgKVxuXHRcdFx0XHQ6IG51bGwsXG5cdFx0XSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQXR0ZW5kZWVTdGF0dXMobW9kZWw6IENhbGVuZGFyRXZlbnRXaG9Nb2RlbCwgb3JnYW5pemVyOiBHdWVzdCB8IG51bGwpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgeyBzdGF0dXMgfSA9IG9yZ2FuaXplciA/PyB7IHN0YXR1czogQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cy5URU5UQVRJVkUgfVxuXG5cdFx0Y29uc3QgYXR0ZW5kaW5nT3B0aW9ucyA9IGNyZWF0ZUF0dGVuZGluZ0l0ZW1zKCkuZmlsdGVyKChvcHRpb24pID0+IG9wdGlvbi5zZWxlY3RhYmxlICE9PSBmYWxzZSlcblx0XHRjb25zdCBhdHRlbmRpbmdTdGF0dXMgPSBhdHRlbmRpbmdPcHRpb25zLmZpbmQoKG9wdGlvbikgPT4gb3B0aW9uLnZhbHVlID09PSBzdGF0dXMpXG5cblx0XHRyZXR1cm4gbShcIi5mbGV4LmZsZXgtY29sdW1uLnBsLXZwYWQtcy5wci12cGFkLXNcIiwgW1xuXHRcdFx0bShTZWxlY3Q8QXR0ZW5kaW5nSXRlbSwgQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cz4sIHtcblx0XHRcdFx0b25jaGFuZ2U6IChvcHRpb24pID0+IHtcblx0XHRcdFx0XHRpZiAob3B0aW9uLnNlbGVjdGFibGUgPT09IGZhbHNlKSByZXR1cm5cblx0XHRcdFx0XHRtb2RlbC5zZXRPd25BdHRlbmRhbmNlKG9wdGlvbi52YWx1ZSlcblx0XHRcdFx0fSxcblx0XHRcdFx0Y2xhc3NlczogW1wiYnV0dG9uLW1pbi1oZWlnaHRcIl0sXG5cdFx0XHRcdHNlbGVjdGVkOiBhdHRlbmRpbmdTdGF0dXMsXG5cdFx0XHRcdGRpc2FibGVkOiBvcmdhbml6ZXIgPT0gbnVsbCxcblx0XHRcdFx0YXJpYUxhYmVsOiBsYW5nLmdldChcImF0dGVuZGluZ19sYWJlbFwiKSxcblx0XHRcdFx0cmVuZGVyT3B0aW9uOiAob3B0aW9uKSA9PlxuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcImJ1dHRvbi5pdGVtcy1jZW50ZXIuZmxleC1ncm93LnN0YXRlLWJnLmJ1dHRvbi1jb250ZW50LmRyb3Bkb3duLWJ1dHRvbi5wdC1zLnBiLXMuYnV0dG9uLW1pbi1oZWlnaHRcIixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Y2xhc3M6IG9wdGlvbi5zZWxlY3RhYmxlID09PSBmYWxzZSA/IGBuby1ob3ZlcmAgOiBcIlwiLFxuXHRcdFx0XHRcdFx0XHRzdHlsZTogeyBjb2xvcjogb3B0aW9uLnZhbHVlID09PSBzdGF0dXMgPyB0aGVtZS5jb250ZW50X2J1dHRvbl9zZWxlY3RlZCA6IHVuZGVmaW5lZCB9LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG9wdGlvbi5uYW1lLFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdHJlbmRlckRpc3BsYXk6IChvcHRpb24pID0+IG0oXCJcIiwgb3B0aW9uLm5hbWUpLFxuXHRcdFx0XHRvcHRpb25zOiBzdHJlYW0oYXR0ZW5kaW5nT3B0aW9ucyksXG5cdFx0XHRcdGV4cGFuZGVkOiB0cnVlLFxuXHRcdFx0XHRub0ljb246IG9yZ2FuaXplciA9PSBudWxsLFxuXHRcdFx0fSBzYXRpc2ZpZXMgU2VsZWN0QXR0cmlidXRlczxBdHRlbmRpbmdJdGVtLCBDYWxlbmRhckF0dGVuZGVlU3RhdHVzPiksXG5cdFx0XSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyT3JnYW5pemVyKG1vZGVsOiBDYWxlbmRhckV2ZW50TW9kZWwsIG9yZ2FuaXplcjogR3Vlc3QgfCBudWxsKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHsgd2hvTW9kZWwgfSA9IG1vZGVsLmVkaXRNb2RlbHNcblxuXHRcdGlmICghKHdob01vZGVsLnBvc3NpYmxlT3JnYW5pemVycy5sZW5ndGggPiAwIHx8IG9yZ2FuaXplcikpIHtcblx0XHRcdGNvbnNvbGUubG9nKFwiVHJ5aW5nIHRvIGFjY2VzcyBndWVzdCB3aXRob3V0IG9yZ2FuaXplclwiKVxuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cblx0XHRjb25zdCB7IGFkZHJlc3MsIG5hbWUsIHN0YXR1cyB9ID0gb3JnYW5pemVyID8/IHt9XG5cdFx0Y29uc3QgaGFzR3Vlc3QgPSB3aG9Nb2RlbC5ndWVzdHMubGVuZ3RoID4gMFxuXHRcdGNvbnN0IGlzTWUgPSBvcmdhbml6ZXI/LmFkZHJlc3MgPT09IHdob01vZGVsLm93bkd1ZXN0Py5hZGRyZXNzXG5cdFx0Y29uc3QgZWRpdGFibGVPcmdhbml6ZXIgPSB3aG9Nb2RlbC5wb3NzaWJsZU9yZ2FuaXplcnMubGVuZ3RoID4gMSAmJiBpc01lXG5cblx0XHRjb25zdCBvcHRpb25zID0gd2hvTW9kZWwucG9zc2libGVPcmdhbml6ZXJzLm1hcCgob3JnYW5pemVyKSA9PiB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRuYW1lOiBvcmdhbml6ZXIubmFtZSxcblx0XHRcdFx0YWRkcmVzczogb3JnYW5pemVyLmFkZHJlc3MsXG5cdFx0XHRcdGFyaWFWYWx1ZTogb3JnYW5pemVyLmFkZHJlc3MsXG5cdFx0XHRcdHZhbHVlOiBvcmdhbml6ZXIuYWRkcmVzcyxcblx0XHRcdH1cblx0XHR9KVxuXG5cdFx0Y29uc3QgZGlzYWJsZWQgPSAhZWRpdGFibGVPcmdhbml6ZXIgfHwgIWhhc0d1ZXN0XG5cdFx0Y29uc3Qgc2VsZWN0ZWQgPSBvcHRpb25zLmZpbmQoKG9wdGlvbikgPT4gb3B0aW9uLmFkZHJlc3MgPT09IGFkZHJlc3MpID8/IG9wdGlvbnNbMF1cblxuXHRcdHJldHVybiBtKFwiLmZsZXguY29sXCIsIFtcblx0XHRcdG0oXCJzbWFsbC51cHBlcmNhc2UucGItcy5iLnRleHQtZWxsaXBzaXNcIiwgeyBzdHlsZTogeyBjb2xvcjogdGhlbWUubmF2aWdhdGlvbl9idXR0b24gfSB9LCBsYW5nLmdldChcIm9yZ2FuaXplcl9sYWJlbFwiKSksXG5cdFx0XHRtKENhcmQsIHsgc3R5bGU6IHsgcGFkZGluZzogYDBgIH0gfSwgW1xuXHRcdFx0XHRtKFwiLmZsZXguZmxleC1jb2x1bW5cIiwgW1xuXHRcdFx0XHRcdG0oXCIuZmxleC5wbC12cGFkLXMucHItdnBhZC1zXCIsIFtcblx0XHRcdFx0XHRcdG0oU2VsZWN0PE9yZ2FuaXplclNlbGVjdEl0ZW0sIHN0cmluZz4sIHtcblx0XHRcdFx0XHRcdFx0Y2xhc3NlczogW1wiZmxleC1ncm93XCIsIFwiYnV0dG9uLW1pbi1oZWlnaHRcIl0sXG5cdFx0XHRcdFx0XHRcdG9uY2hhbmdlOiAob3B0aW9uKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0Y29uc3Qgb3JnYW5pemVyID0gd2hvTW9kZWwucG9zc2libGVPcmdhbml6ZXJzLmZpbmQoKG9yZ2FuaXplcikgPT4gb3JnYW5pemVyLmFkZHJlc3MgPT09IG9wdGlvbi5hZGRyZXNzKVxuXHRcdFx0XHRcdFx0XHRcdGlmIChvcmdhbml6ZXIpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHdob01vZGVsLmFkZEF0dGVuZGVlKG9yZ2FuaXplci5hZGRyZXNzLCBudWxsKVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0c2VsZWN0ZWQsXG5cdFx0XHRcdFx0XHRcdGRpc2FibGVkLFxuXHRcdFx0XHRcdFx0XHRhcmlhTGFiZWw6IGxhbmcuZ2V0KFwib3JnYW5pemVyX2xhYmVsXCIpLFxuXHRcdFx0XHRcdFx0XHRyZW5kZXJPcHRpb246IChvcHRpb24pID0+XG5cdFx0XHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XHRcdFwiYnV0dG9uLml0ZW1zLWNlbnRlci5mbGV4LWdyb3cuc3RhdGUtYmcuYnV0dG9uLWNvbnRlbnQuZHJvcGRvd24tYnV0dG9uLnB0LXMucGItcy5idXR0b24tbWluLWhlaWdodFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0eyBzdHlsZTogeyBjb2xvcjogc2VsZWN0ZWQuYWRkcmVzcyA9PT0gb3B0aW9uLmFkZHJlc3MgPyB0aGVtZS5jb250ZW50X2J1dHRvbl9zZWxlY3RlZCA6IHVuZGVmaW5lZCB9IH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRvcHRpb24uYWRkcmVzcyxcblx0XHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XHRyZW5kZXJEaXNwbGF5OiAob3B0aW9uKSA9PiBtKFwiXCIsIG9wdGlvbi5uYW1lID8gYCR7b3B0aW9uLm5hbWV9IDwke29wdGlvbi5hZGRyZXNzfT5gIDogb3B0aW9uLmFkZHJlc3MpLFxuXHRcdFx0XHRcdFx0XHRvcHRpb25zOiBzdHJlYW0oXG5cdFx0XHRcdFx0XHRcdFx0d2hvTW9kZWwucG9zc2libGVPcmdhbml6ZXJzLm1hcCgob3JnYW5pemVyKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRuYW1lOiBvcmdhbml6ZXIubmFtZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0YWRkcmVzczogb3JnYW5pemVyLmFkZHJlc3MsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGFyaWFWYWx1ZTogb3JnYW5pemVyLmFkZHJlc3MsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHZhbHVlOiBvcmdhbml6ZXIuYWRkcmVzcyxcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0bm9JY29uOiBkaXNhYmxlZCxcblx0XHRcdFx0XHRcdFx0ZXhwYW5kZWQ6IHRydWUsXG5cdFx0XHRcdFx0XHR9IHNhdGlzZmllcyBTZWxlY3RBdHRyaWJ1dGVzPE9yZ2FuaXplclNlbGVjdEl0ZW0sIHN0cmluZz4pLFxuXHRcdFx0XHRcdFx0bW9kZWwub3BlcmF0aW9uICE9PSBDYWxlbmRhck9wZXJhdGlvbi5FZGl0VGhpcyAmJiBvcmdhbml6ZXIgJiYgIWlzTWVcblx0XHRcdFx0XHRcdFx0PyBtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0XHRcdHRpdGxlOiBcInNlbmRNYWlsX2FsdFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y2xpY2s6IGFzeW5jICgpID0+XG5cdFx0XHRcdFx0XHRcdFx0XHRcdChhd2FpdCBpbXBvcnQoXCIuLi8uLi8uLi8uLi9tYWlsLWFwcC9jb250YWN0cy92aWV3L0NvbnRhY3RWaWV3LmpzXCIpKS53cml0ZU1haWwoXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0b3JnYW5pemVyLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxhbmcuZ2V0KFwicmVwbGllZFRvRXZlbnRJbnZpdGVfbXNnXCIsIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwie2V2ZW50fVwiOiBtb2RlbC5lZGl0TW9kZWxzLnN1bW1hcnkuY29udGVudCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0XHRcdHNpemU6IEJ1dHRvblNpemUuQ29tcGFjdCxcblx0XHRcdFx0XHRcdFx0XHRcdGljb246IEljb25zLlBlbmNpbFNxdWFyZSxcblx0XHRcdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdFx0XSksXG5cdFx0XHRcdFx0aXNNZSAmJiBtb2RlbC5vcGVyYXRpb24gIT09IENhbGVuZGFyT3BlcmF0aW9uLkVkaXRUaGlzXG5cdFx0XHRcdFx0XHQ/IFttKERpdmlkZXIsIHsgY29sb3I6IHRoZW1lLmJ1dHRvbl9idWJibGVfYmcgfSksIHRoaXMucmVuZGVyQXR0ZW5kZWVTdGF0dXMod2hvTW9kZWwsIG9yZ2FuaXplcildXG5cdFx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdF0pLFxuXHRcdFx0XSksXG5cdFx0XSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyU2VuZFVwZGF0ZUNoZWNrYm94KHdob01vZGVsOiBDYWxlbmRhckV2ZW50V2hvTW9kZWwpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuICF3aG9Nb2RlbC5pbml0aWFsbHlIYWRPdGhlckF0dGVuZGVlcyB8fCAhd2hvTW9kZWwuY2FuTW9kaWZ5R3Vlc3RzXG5cdFx0XHQ/IG51bGxcblx0XHRcdDogbShcblx0XHRcdFx0XHRDYXJkLFxuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRTd2l0Y2gsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGNoZWNrZWQ6IHdob01vZGVsLnNob3VsZFNlbmRVcGRhdGVzLFxuXHRcdFx0XHRcdFx0XHRvbmNsaWNrOiAodmFsdWUpID0+ICh3aG9Nb2RlbC5zaG91bGRTZW5kVXBkYXRlcyA9IHZhbHVlKSxcblx0XHRcdFx0XHRcdFx0YXJpYUxhYmVsOiBsYW5nLmdldChcInNlbmRVcGRhdGVzX2xhYmVsXCIpLFxuXHRcdFx0XHRcdFx0XHRkaXNhYmxlZDogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdHZhcmlhbnQ6IFwiZXhwYW5kZWRcIixcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRsYW5nLmdldChcInNlbmRVcGRhdGVzX2xhYmVsXCIpLFxuXHRcdFx0XHRcdCksXG5cdFx0XHQgIClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyR3Vlc3QoZ3Vlc3Q6IEd1ZXN0LCB7IG1vZGVsIH06IFBpY2s8QXR0ZW5kZWVMaXN0RWRpdG9yQXR0cnMsIFwibW9kZWxcIj4sIHBhc3N3b3JkPzogc3RyaW5nLCBzdHJlbmd0aD86IG51bWJlcik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IHdob01vZGVsIH0gPSBtb2RlbC5lZGl0TW9kZWxzXG5cdFx0Y29uc3QgeyBhZGRyZXNzLCBuYW1lLCBzdGF0dXMgfSA9IGd1ZXN0XG5cdFx0Y29uc3QgaXNNZSA9IGd1ZXN0LmFkZHJlc3MgPT09IHdob01vZGVsLm93bkd1ZXN0Py5hZGRyZXNzXG5cdFx0Y29uc3Qgcm9sZUxhYmVsID0gaXNNZSA/IGAke2xhbmcuZ2V0KFwiZ3Vlc3RfbGFiZWxcIil9IHwgJHtsYW5nLmdldChcInlvdV9sYWJlbFwiKX1gIDogbGFuZy5nZXQoXCJndWVzdF9sYWJlbFwiKVxuXHRcdGNvbnN0IHJlbmRlclBhc3N3b3JkRmllbGQgPSB3aG9Nb2RlbC5pc0NvbmZpZGVudGlhbCAmJiBwYXNzd29yZCAhPSBudWxsICYmIGd1ZXN0LnR5cGUgPT09IFJlY2lwaWVudFR5cGUuRVhURVJOQUxcblxuXHRcdGxldCByaWdodENvbnRlbnQ6IENoaWxkcmVuID0gbnVsbFxuXG5cdFx0aWYgKGlzTWUpIHtcblx0XHRcdHJpZ2h0Q29udGVudCA9IG0oXCJcIiwgeyBzdHlsZTogeyBwYWRkaW5nUmlnaHQ6IHB4KHNpemUudnBhZF9zbWFsbCkgfSB9LCB0aGlzLnJlbmRlckF0dGVuZGVlU3RhdHVzKG1vZGVsLmVkaXRNb2RlbHMud2hvTW9kZWwsIGd1ZXN0KSlcblx0XHR9IGVsc2UgaWYgKHdob01vZGVsLmNhbk1vZGlmeUd1ZXN0cykge1xuXHRcdFx0cmlnaHRDb250ZW50ID0gbShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdHRpdGxlOiBcInJlbW92ZV9hY3Rpb25cIixcblx0XHRcdFx0aWNvbjogSWNvbnMuQ2FuY2VsLFxuXHRcdFx0XHRjbGljazogKCkgPT4gd2hvTW9kZWwucmVtb3ZlQXR0ZW5kZWUoZ3Vlc3QuYWRkcmVzcyksXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdHJldHVybiBtKFxuXHRcdFx0Q2FyZCxcblx0XHRcdHtcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRwYWRkaW5nOiBgJHtweChzaXplLnZwYWRfc21hbGwpfSAke3B4KDApfSAke3B4KHNpemUudnBhZF9zbWFsbCl9ICR7cHgoc2l6ZS52cGFkX3NtYWxsKX1gLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdG0oXCIuZmxleC5mbGV4LWNvbHVtbi5pdGVtcy1jZW50ZXJcIiwgW1xuXHRcdFx0XHRtKFwiLmZsZXguaXRlbXMtY2VudGVyLmZsZXgtZ3Jvdy5mdWxsLXdpZHRoXCIsIFtcblx0XHRcdFx0XHR0aGlzLnJlbmRlclN0YXR1c0ljb24oc3RhdHVzKSxcblx0XHRcdFx0XHRtKFwiLmZsZXguZmxleC1jb2x1bW4uZmxleC1ncm93Lm1pbi13aWR0aC0wXCIsIFtcblx0XHRcdFx0XHRcdG0oXCIuc21hbGxcIiwgeyBzdHlsZTogeyBsaW5lSGVpZ2h0OiBweChzaXplLnZwYWRfc21hbGwpIH0gfSwgcm9sZUxhYmVsKSxcblx0XHRcdFx0XHRcdG0oXCIudGV4dC1lbGxpcHNpc1wiLCBuYW1lLmxlbmd0aCA+IDAgPyBgJHtuYW1lfSAke2FkZHJlc3N9YCA6IGFkZHJlc3MpLFxuXHRcdFx0XHRcdF0pLFxuXHRcdFx0XHRcdHJpZ2h0Q29udGVudCxcblx0XHRcdFx0XSksXG5cdFx0XHRcdHJlbmRlclBhc3N3b3JkRmllbGRcblx0XHRcdFx0XHQ/IFtcblx0XHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XHRcIi5mbGV4LmZ1bGwtd2lkdGhcIixcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRwYWRkaW5nOiBgMCAwICR7cHgoc2l6ZS52cGFkX3hzbSl9ICR7cHgoc2l6ZS52cGFkX3NtYWxsICsgc2l6ZS5pY29uX3NpemVfbWVkaXVtX2xhcmdlKX1gLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdG0oRGl2aWRlciwge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y29sb3I6IHRoZW1lLmJ1dHRvbl9idWJibGVfYmcsXG5cdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRcdHRoaXMucmVuZGVyUGFzc3dvcmRGaWVsZChhZGRyZXNzLCBwYXNzd29yZCwgc3RyZW5ndGggPz8gMCwgd2hvTW9kZWwpLFxuXHRcdFx0XHRcdCAgXVxuXHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdF0pLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyUGFzc3dvcmRGaWVsZChhZGRyZXNzOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcsIHN0cmVuZ3RoOiBudW1iZXIsIHdob01vZGVsOiBDYWxlbmRhckV2ZW50V2hvTW9kZWwpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgbGFiZWwgPSBsYW5nLmdldChcInBhc3N3b3JkRm9yX2xhYmVsXCIsIHtcblx0XHRcdFwiezF9XCI6IGFkZHJlc3MsXG5cdFx0fSlcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShcIi5mbGV4LmZsZXgtZ3Jvdy5mdWxsLXdpZHRoLmp1c3RpZnktYmV0d2Vlbi5pdGVtcy1lbmRcIiwgW1xuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLmZsZXguZmxleC1jb2x1bW4uZnVsbC13aWR0aFwiLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdHBhZGRpbmdMZWZ0OiBweChzaXplLmhwYWRfbWVkaXVtICsgc2l6ZS52cGFkX3NtYWxsKSxcblx0XHRcdFx0XHRcdFx0cGFkZGluZ1JpZ2h0OiBweCgoc2l6ZS5idXR0b25faGVpZ2h0IC0gc2l6ZS5idXR0b25faGVpZ2h0X2NvbXBhY3QpIC8gMiksXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0W1xuXHRcdFx0XHRcdFx0bShQYXNzd29yZElucHV0LCB7XG5cdFx0XHRcdFx0XHRcdGFyaWFMYWJlbDogbGFiZWwsXG5cdFx0XHRcdFx0XHRcdHBhc3N3b3JkLFxuXHRcdFx0XHRcdFx0XHRzdHJlbmd0aCxcblx0XHRcdFx0XHRcdFx0b25pbnB1dDogKG5ld1Bhc3N3b3JkKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0d2hvTW9kZWwuc2V0UHJlc2hhcmVkUGFzc3dvcmQoYWRkcmVzcywgbmV3UGFzc3dvcmQpXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHQpLFxuXHRcdFx0XSksXG5cdFx0XVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJTdGF0dXNJY29uKHN0YXR1czogQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cyk6IENoaWxkcmVuIHtcblx0XHRjb25zdCBpY29uID0gaWNvbkZvckF0dGVuZGVlU3RhdHVzW3N0YXR1c11cblx0XHRyZXR1cm4gbShJY29uLCB7XG5cdFx0XHRpY29uLFxuXHRcdFx0c2l6ZTogSWNvblNpemUuTGFyZ2UsXG5cdFx0XHRjbGFzczogXCJtci1zXCIsXG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRmaWxsOiB0aGVtZS5jb250ZW50X2ZnLFxuXHRcdFx0fSxcblx0XHR9KVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IFRleHRGaWVsZFR5cGUgYXMgVGV4dEZpZWxkVHlwZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgVGFiSW5kZXgsIFRpbWVGb3JtYXQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgdGltZVN0cmluZ0Zyb21QYXJ0cyB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWlzYy9Gb3JtYXR0ZXIuanNcIlxuaW1wb3J0IHsgVGltZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9UaW1lLmpzXCJcbmltcG9ydCB7IFNlbGVjdCwgU2VsZWN0QXR0cmlidXRlcyB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvU2VsZWN0LmpzXCJcbmltcG9ydCB7IFNpbmdsZUxpbmVUZXh0RmllbGQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1NpbmdsZUxpbmVUZXh0RmllbGQuanNcIlxuaW1wb3J0IHsgaXNBcHAgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52LmpzXCJcbmltcG9ydCB7IHB4LCBzaXplIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvc2l6ZS5qc1wiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5cbmV4cG9ydCB0eXBlIFRpbWVQaWNrZXJBdHRycyA9IHtcblx0dGltZTogVGltZSB8IG51bGxcblx0b25UaW1lU2VsZWN0ZWQ6IChhcmcwOiBUaW1lIHwgbnVsbCkgPT4gdW5rbm93blxuXHR0aW1lRm9ybWF0OiBUaW1lRm9ybWF0XG5cdGRpc2FibGVkPzogYm9vbGVhblxuXHRhcmlhTGFiZWw6IHN0cmluZ1xuXHRjbGFzc2VzPzogQXJyYXk8c3RyaW5nPlxufVxuXG5pbnRlcmZhY2UgVGltZU9wdGlvbiB7XG5cdHZhbHVlOiBzdHJpbmdcblx0YXJpYVZhbHVlOiBzdHJpbmdcblx0bmFtZTogc3RyaW5nXG59XG5cbmV4cG9ydCBjbGFzcyBUaW1lUGlja2VyIGltcGxlbWVudHMgQ29tcG9uZW50PFRpbWVQaWNrZXJBdHRycz4ge1xuXHRwcml2YXRlIHZhbHVlczogUmVhZG9ubHlBcnJheTxzdHJpbmc+XG5cdHByaXZhdGUgZm9jdXNlZDogYm9vbGVhblxuXHRwcml2YXRlIGlzRXhwYW5kZWQ6IGJvb2xlYW4gPSBmYWxzZVxuXHRwcml2YXRlIG9sZFZhbHVlOiBzdHJpbmdcblx0cHJpdmF0ZSB2YWx1ZTogc3RyaW5nXG5cdHByaXZhdGUgcmVhZG9ubHkgYW1QbTogYm9vbGVhblxuXG5cdGNvbnN0cnVjdG9yKHsgYXR0cnMgfTogVm5vZGU8VGltZVBpY2tlckF0dHJzPikge1xuXHRcdHRoaXMuZm9jdXNlZCA9IGZhbHNlXG5cdFx0dGhpcy52YWx1ZSA9IFwiXCJcblx0XHR0aGlzLmFtUG0gPSBhdHRycy50aW1lRm9ybWF0ID09PSBUaW1lRm9ybWF0LlRXRUxWRV9IT1VSU1xuXHRcdGNvbnN0IHRpbWVzOiBzdHJpbmdbXSA9IFtdXG5cblx0XHRmb3IgKGxldCBob3VyID0gMDsgaG91ciA8IDI0OyBob3VyKyspIHtcblx0XHRcdGZvciAobGV0IG1pbnV0ZSA9IDA7IG1pbnV0ZSA8IDYwOyBtaW51dGUgKz0gMzApIHtcblx0XHRcdFx0dGltZXMucHVzaCh0aW1lU3RyaW5nRnJvbVBhcnRzKGhvdXIsIG1pbnV0ZSwgdGhpcy5hbVBtKSlcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5vbGRWYWx1ZSA9IGF0dHJzLnRpbWU/LnRvU3RyaW5nKGZhbHNlKSA/PyBcIi0tXCJcblx0XHR0aGlzLnZhbHVlcyA9IHRpbWVzXG5cdH1cblxuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8VGltZVBpY2tlckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRpZiAoYXR0cnMudGltZSkge1xuXHRcdFx0Y29uc3QgdGltZUFzU3RyaW5nID0gYXR0cnMudGltZT8udG9TdHJpbmcodGhpcy5hbVBtKSA/PyBcIlwiXG5cblx0XHRcdGlmICghdGhpcy5mb2N1c2VkKSB7XG5cdFx0XHRcdHRoaXMudmFsdWUgPSB0aW1lQXNTdHJpbmdcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoaXNBcHAoKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMucmVuZGVyTmF0aXZlVGltZVBpY2tlcihhdHRycylcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRoaXMucmVuZGVyQ3VzdG9tVGltZVBpY2tlcihhdHRycylcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlck5hdGl2ZVRpbWVQaWNrZXIoYXR0cnM6IFRpbWVQaWNrZXJBdHRycyk6IENoaWxkcmVuIHtcblx0XHRpZiAodGhpcy5vbGRWYWx1ZSAhPT0gYXR0cnMudGltZT8udG9TdHJpbmcoZmFsc2UpKSB7XG5cdFx0XHR0aGlzLm9uU2VsZWN0ZWQoYXR0cnMpXG5cdFx0fVxuXG5cdFx0Ly8gaW5wdXRbdHlwZT10aW1lXSB3YW50cyB0aW1lIGluIDI0aCBmb3JtYXQsIG5vIG1hdHRlciB3aGF0IGlzIGFjdHVhbGx5IGRpc3BsYXllZC4gT3RoZXJ3aXNlIGl0IHdpbGwgYmUgZW1wdHkuXG5cdFx0Y29uc3QgdGltZUFzU3RyaW5nID0gYXR0cnMudGltZT8udG9TdHJpbmcoZmFsc2UpID8/IFwiXCJcblx0XHR0aGlzLm9sZFZhbHVlID0gdGltZUFzU3RyaW5nXG5cdFx0dGhpcy52YWx1ZSA9IHRpbWVBc1N0cmluZ1xuXG5cdFx0Y29uc3QgZGlzcGxheVRpbWUgPSBhdHRycy50aW1lPy50b1N0cmluZyh0aGlzLmFtUG0pXG5cblx0XHRyZXR1cm4gbShcIi5yZWxcIiwgW1xuXHRcdFx0bShcImlucHV0LmZpbGwtYWJzb2x1dGUuaW52aXNpYmxlLnR1dGF1aS1idXR0b24tb3V0bGluZVwiLCB7XG5cdFx0XHRcdGRpc2FibGVkOiBhdHRycy5kaXNhYmxlZCxcblx0XHRcdFx0dHlwZTogVGV4dEZpZWxkVHlwZS5UaW1lLFxuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdHpJbmRleDogMSxcblx0XHRcdFx0XHRib3JkZXI6IGAycHggc29saWQgJHt0aGVtZS5jb250ZW50X21lc3NhZ2VfYmd9YCxcblx0XHRcdFx0XHR3aWR0aDogXCJhdXRvXCIsXG5cdFx0XHRcdFx0aGVpZ2h0OiBcImF1dG9cIixcblx0XHRcdFx0XHRhcHBlYXJhbmNlOiBcIm5vbmVcIixcblx0XHRcdFx0XHRvcGFjaXR5OiBhdHRycy5kaXNhYmxlZCA/IDAuNyA6IDEuMCxcblx0XHRcdFx0fSxcblx0XHRcdFx0dmFsdWU6IHRoaXMudmFsdWUsXG5cdFx0XHRcdG9uaW5wdXQ6IChldmVudDogSW5wdXRFdmVudCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGlucHV0VmFsdWUgPSAoZXZlbnQudGFyZ2V0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlXG5cdFx0XHRcdFx0aWYgKHRoaXMudmFsdWUgPT09IGlucHV0VmFsdWUpIHtcblx0XHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR0aGlzLnZhbHVlID0gaW5wdXRWYWx1ZVxuXHRcdFx0XHRcdGF0dHJzLm9uVGltZVNlbGVjdGVkKFRpbWUucGFyc2VGcm9tU3RyaW5nKGlucHV0VmFsdWUpKVxuXHRcdFx0XHR9LFxuXHRcdFx0fSksXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi50dXRhdWktYnV0dG9uLW91dGxpbmVcIixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNsYXNzOiBhdHRycy5jbGFzc2VzPy5qb2luKFwiIFwiKSxcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0ekluZGV4OiBcIjJcIixcblx0XHRcdFx0XHRcdHBvc2l0aW9uOiBcImluaGVyaXRcIixcblx0XHRcdFx0XHRcdGJvcmRlckNvbG9yOiBcInRyYW5zcGFyZW50XCIsXG5cdFx0XHRcdFx0XHRwb2ludGVyRXZlbnRzOiBcIm5vbmVcIixcblx0XHRcdFx0XHRcdHBhZGRpbmc6IGAke3B4KHNpemUudnBhZF9zbWFsbCl9IDBgLFxuXHRcdFx0XHRcdFx0b3BhY2l0eTogYXR0cnMuZGlzYWJsZWQgPyAwLjcgOiAxLjAsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0ZGlzcGxheVRpbWUsXG5cdFx0XHQpLFxuXHRcdF0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckN1c3RvbVRpbWVQaWNrZXIoYXR0cnM6IFRpbWVQaWNrZXJBdHRycyk6IENoaWxkcmVuIHtcblx0XHRjb25zdCBvcHRpb25zID0gdGhpcy52YWx1ZXMubWFwKCh0aW1lKSA9PiAoe1xuXHRcdFx0dmFsdWU6IHRpbWUsXG5cdFx0XHRuYW1lOiB0aW1lLFxuXHRcdFx0YXJpYVZhbHVlOiB0aW1lLFxuXHRcdH0pKVxuXG5cdFx0cmV0dXJuIG0oU2VsZWN0PFRpbWVPcHRpb24sIHN0cmluZz4sIHtcblx0XHRcdG9uY2hhbmdlOiAobmV3VmFsdWUpID0+IHtcblx0XHRcdFx0aWYgKHRoaXMudmFsdWUgPT09IG5ld1ZhbHVlLnZhbHVlKSB7XG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLnZhbHVlID0gbmV3VmFsdWUudmFsdWVcblx0XHRcdFx0dGhpcy5vblNlbGVjdGVkKGF0dHJzKVxuXHRcdFx0XHRtLnJlZHJhdy5zeW5jKClcblx0XHRcdH0sXG5cdFx0XHRvbmNsb3NlOiAoKSA9PiB7XG5cdFx0XHRcdHRoaXMuaXNFeHBhbmRlZCA9IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0c2VsZWN0ZWQ6IHsgdmFsdWU6IHRoaXMudmFsdWUsIG5hbWU6IHRoaXMudmFsdWUsIGFyaWFWYWx1ZTogdGhpcy52YWx1ZSB9LFxuXHRcdFx0YXJpYUxhYmVsOiBhdHRycy5hcmlhTGFiZWwsXG5cdFx0XHRkaXNhYmxlZDogYXR0cnMuZGlzYWJsZWQsXG5cdFx0XHRvcHRpb25zOiBzdHJlYW0ob3B0aW9ucyksXG5cdFx0XHRub0ljb246IHRydWUsXG5cdFx0XHRleHBhbmRlZDogdHJ1ZSxcblx0XHRcdHRhYkluZGV4OiBOdW1iZXIoVGFiSW5kZXguUHJvZ3JhbW1hdGljKSxcblx0XHRcdHJlbmRlckRpc3BsYXk6ICgpID0+IHRoaXMucmVuZGVyVGltZVNlbGVjdElucHV0KGF0dHJzKSxcblx0XHRcdHJlbmRlck9wdGlvbjogKG9wdGlvbikgPT4gdGhpcy5yZW5kZXJUaW1lT3B0aW9ucyhvcHRpb24pLFxuXHRcdFx0a2VlcEZvY3VzOiB0cnVlLFxuXHRcdH0gc2F0aXNmaWVzIFNlbGVjdEF0dHJpYnV0ZXM8VGltZU9wdGlvbiwgc3RyaW5nPilcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyVGltZU9wdGlvbnMob3B0aW9uOiBUaW1lT3B0aW9uKSB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcImJ1dHRvbi5pdGVtcy1jZW50ZXIuZmxleC1ncm93XCIsXG5cdFx0XHR7XG5cdFx0XHRcdGNsYXNzOiBcInN0YXRlLWJnIGJ1dHRvbi1jb250ZW50IGRyb3Bkb3duLWJ1dHRvbiBwdC1zIHBiLXMgYnV0dG9uLW1pbi1oZWlnaHRcIixcblx0XHRcdH0sXG5cdFx0XHRvcHRpb24ubmFtZSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclRpbWVTZWxlY3RJbnB1dChhdHRyczogVGltZVBpY2tlckF0dHJzKSB7XG5cdFx0cmV0dXJuIG0oU2luZ2xlTGluZVRleHRGaWVsZCwge1xuXHRcdFx0Y2xhc3NlczogWy4uLihhdHRycy5jbGFzc2VzID8/IFtdKSwgXCJ0dXRhdWktYnV0dG9uLW91dGxpbmVcIiwgXCJ0ZXh0LWNlbnRlclwiLCBcImJvcmRlci1jb250ZW50LW1lc3NhZ2UtYmdcIl0sXG5cdFx0XHR2YWx1ZTogdGhpcy52YWx1ZSxcblx0XHRcdG9uaW5wdXQ6ICh2YWw6IHN0cmluZykgPT4ge1xuXHRcdFx0XHRpZiAodGhpcy52YWx1ZSA9PT0gdmFsKSB7XG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLnZhbHVlID0gdmFsXG5cdFx0XHR9LFxuXHRcdFx0ZGlzYWJsZWQ6IGF0dHJzLmRpc2FibGVkLFxuXHRcdFx0YXJpYUxhYmVsOiBhdHRycy5hcmlhTGFiZWwsXG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHR0ZXh0QWxpZ246IFwiY2VudGVyXCIsXG5cdFx0XHR9LFxuXHRcdFx0b25jbGljazogKGU6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdFx0ZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuXHRcdFx0XHRpZiAoIXRoaXMuaXNFeHBhbmRlZCkge1xuXHRcdFx0XHRcdDsoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLnBhcmVudEVsZW1lbnQ/LmNsaWNrKClcblx0XHRcdFx0XHR0aGlzLmlzRXhwYW5kZWQgPSB0cnVlXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRvbmZvY3VzOiAoZXZlbnQ6IEZvY3VzRXZlbnQpID0+IHtcblx0XHRcdFx0dGhpcy5mb2N1c2VkID0gdHJ1ZVxuXHRcdFx0XHRpZiAoIXRoaXMuaXNFeHBhbmRlZCkge1xuXHRcdFx0XHRcdDsoZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5wYXJlbnRFbGVtZW50Py5jbGljaygpXG5cdFx0XHRcdFx0dGhpcy5pc0V4cGFuZGVkID0gdHJ1ZVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0b25ibHVyOiAoZTogYW55KSA9PiB7XG5cdFx0XHRcdGlmICh0aGlzLmZvY3VzZWQpIHtcblx0XHRcdFx0XHR0aGlzLm9uU2VsZWN0ZWQoYXR0cnMpXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRlLnJlZHJhdyA9IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0dHlwZTogVGV4dEZpZWxkVHlwZS5UZXh0LFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIG9uU2VsZWN0ZWQoYXR0cnM6IFRpbWVQaWNrZXJBdHRycykge1xuXHRcdHRoaXMuZm9jdXNlZCA9IGZhbHNlXG5cblx0XHRhdHRycy5vblRpbWVTZWxlY3RlZChUaW1lLnBhcnNlRnJvbVN0cmluZyh0aGlzLnZhbHVlKSlcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IFRpbWVGb3JtYXQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50V2hlbk1vZGVsIH0gZnJvbSBcIi4uL2V2ZW50ZWRpdG9yLW1vZGVsL0NhbGVuZGFyRXZlbnRXaGVuTW9kZWwuanNcIlxuaW1wb3J0IHsgU3dpdGNoIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Td2l0Y2guanNcIlxuaW1wb3J0IHsgSWNvbiwgSWNvblNpemUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb24uanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0ljb25zLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgaXNBcHAgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52LmpzXCJcbmltcG9ydCB7IERhdGVQaWNrZXIgfSBmcm9tIFwiLi4vcGlja2Vycy9EYXRlUGlja2VyLmpzXCJcbmltcG9ydCB7IFRpbWVQaWNrZXIgfSBmcm9tIFwiLi4vcGlja2Vycy9UaW1lUGlja2VyLmpzXCJcbmltcG9ydCB7IHB4LCBzaXplIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvc2l6ZS5qc1wiXG5pbXBvcnQgeyBEaXZpZGVyIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvRGl2aWRlci5qc1wiXG5cbmV4cG9ydCB0eXBlIEV2ZW50VGltZUVkaXRvckF0dHJzID0ge1xuXHRzdGFydE9mVGhlV2Vla09mZnNldDogbnVtYmVyXG5cdHRpbWVGb3JtYXQ6IFRpbWVGb3JtYXRcblx0ZWRpdE1vZGVsOiBDYWxlbmRhckV2ZW50V2hlbk1vZGVsXG5cdGRpc2FibGVkOiBib29sZWFuXG59XG5cbi8qKlxuICogYW4gZWRpdG9yIGNvbXBvbmVudCB0byBlZGl0IHRoZSBzdGFydCBkYXRlIGFuZCBlbmQgZGF0ZSBvZiBhIGNhbGVuZGFyIGV2ZW50LlxuICogYWxzbyBhbGxvd3MgdG8gZWRpdCBzdGFydCB0aW1lIGFuZCBlbmQgdGltZSBmb3IgZXZlbnRzIHdoZXJlIHRoYXQgbWFrZXMgc2Vuc2UgKGllIG5vdCBhbGwtZGF5KVxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRUaW1lRWRpdG9yIGltcGxlbWVudHMgQ29tcG9uZW50PEV2ZW50VGltZUVkaXRvckF0dHJzPiB7XG5cdHZpZXcodm5vZGU6IFZub2RlPEV2ZW50VGltZUVkaXRvckF0dHJzPikge1xuXHRcdGNvbnN0IHsgYXR0cnMgfSA9IHZub2RlXG5cdFx0Y29uc3QgeyBzdGFydE9mVGhlV2Vla09mZnNldCwgZWRpdE1vZGVsLCB0aW1lRm9ybWF0LCBkaXNhYmxlZCB9ID0gYXR0cnNcblxuXHRcdGNvbnN0IGFwcENsYXNzZXMgPSBpc0FwcCgpID8gW1wic21hbGxlclwiXSA6IFtdXG5cblx0XHRyZXR1cm4gbShcIi5mbGV4XCIsIFtcblx0XHRcdG0oXCIuZmxleC5jb2wuZmxleC1ncm93LmdhcC12cGFkLXNcIiwgW1xuXHRcdFx0XHRtKFwiLmZsZXguZ2FwLXZwYWQtcy5pdGVtcy1jZW50ZXIucHItdnBhZC1zXCIsIFtcblx0XHRcdFx0XHRtKEljb24sIHtcblx0XHRcdFx0XHRcdGljb246IEljb25zLlRpbWUsXG5cdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRmaWxsOiB0aGVtZS5jb250ZW50X2ZnLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHRpdGxlOiBsYW5nLmdldChcInRpbWVTZWN0aW9uX2xhYmVsXCIpLFxuXHRcdFx0XHRcdFx0c2l6ZTogSWNvblNpemUuTWVkaXVtLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRTd2l0Y2gsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGNoZWNrZWQ6IGVkaXRNb2RlbC5pc0FsbERheSxcblx0XHRcdFx0XHRcdFx0b25jbGljazogKHZhbHVlKSA9PiAoZWRpdE1vZGVsLmlzQWxsRGF5ID0gdmFsdWUpLFxuXHRcdFx0XHRcdFx0XHRhcmlhTGFiZWw6IGxhbmcuZ2V0KFwiYWxsRGF5X2xhYmVsXCIpLFxuXHRcdFx0XHRcdFx0XHRkaXNhYmxlZDogZGlzYWJsZWQsXG5cdFx0XHRcdFx0XHRcdHZhcmlhbnQ6IFwiZXhwYW5kZWRcIixcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRsYW5nLmdldChcImFsbERheV9sYWJlbFwiKSxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRdKSxcblx0XHRcdFx0bShcIi5mbGV4LmNvbC5mdWxsLXdpZHRoLmZsZXgtZ3Jvdy5nYXAtdnBhZC1zXCIsIHsgc3R5bGU6IHsgcGFkZGluZ0xlZnQ6IHB4KHNpemUuaWNvbl9zaXplX2xhcmdlICsgc2l6ZS52cGFkX3NtYWxsKSB9IH0sIFtcblx0XHRcdFx0XHRtKERpdmlkZXIsIHsgY29sb3I6IHRoZW1lLmJ1dHRvbl9idWJibGVfYmcgfSksXG5cdFx0XHRcdFx0bShcIi50aW1lLXNlbGVjdGlvbi1ncmlkLnByLXZwYWQtc1wiLCBbXG5cdFx0XHRcdFx0XHRtKFwiXCIsIGxhbmcuZ2V0KFwiZGF0ZUZyb21fbGFiZWxcIikpLFxuXHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0YCR7aXNBcHAoKSA/IFwiXCIgOiBcIi5wbC12cGFkLWxcIn1gLFxuXHRcdFx0XHRcdFx0XHRtKERhdGVQaWNrZXIsIHtcblx0XHRcdFx0XHRcdFx0XHRjbGFzc2VzOiBhcHBDbGFzc2VzLFxuXHRcdFx0XHRcdFx0XHRcdGRhdGU6IGF0dHJzLmVkaXRNb2RlbC5zdGFydERhdGUsXG5cdFx0XHRcdFx0XHRcdFx0b25EYXRlU2VsZWN0ZWQ6IChkYXRlKSA9PiBkYXRlICYmIChlZGl0TW9kZWwuc3RhcnREYXRlID0gZGF0ZSksXG5cdFx0XHRcdFx0XHRcdFx0c3RhcnRPZlRoZVdlZWtPZmZzZXQsXG5cdFx0XHRcdFx0XHRcdFx0bGFiZWw6IFwiZGF0ZUZyb21fbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0XHR1c2VJbnB1dEJ1dHRvbjogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRkaXNhYmxlZDogYXR0cnMuZGlzYWJsZWQsXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcdFwiXCIsXG5cdFx0XHRcdFx0XHRcdG0oVGltZVBpY2tlciwge1xuXHRcdFx0XHRcdFx0XHRcdGNsYXNzZXM6IGFwcENsYXNzZXMsXG5cdFx0XHRcdFx0XHRcdFx0dGltZTogZWRpdE1vZGVsLnN0YXJ0VGltZSxcblx0XHRcdFx0XHRcdFx0XHRvblRpbWVTZWxlY3RlZDogKHRpbWUpID0+IChlZGl0TW9kZWwuc3RhcnRUaW1lID0gdGltZSksXG5cdFx0XHRcdFx0XHRcdFx0dGltZUZvcm1hdCxcblx0XHRcdFx0XHRcdFx0XHRkaXNhYmxlZDogYXR0cnMuZGlzYWJsZWQgfHwgYXR0cnMuZWRpdE1vZGVsLmlzQWxsRGF5LFxuXHRcdFx0XHRcdFx0XHRcdGFyaWFMYWJlbDogbGFuZy5nZXQoXCJzdGFydFRpbWVfbGFiZWxcIiksXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdG0oXCJcIiwgbGFuZy5nZXQoXCJkYXRlVG9fbGFiZWxcIikpLFxuXHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0YCR7aXNBcHAoKSA/IFwiXCIgOiBcIi5wbC12cGFkLWxcIn1gLFxuXHRcdFx0XHRcdFx0XHRtKERhdGVQaWNrZXIsIHtcblx0XHRcdFx0XHRcdFx0XHRjbGFzc2VzOiBhcHBDbGFzc2VzLFxuXHRcdFx0XHRcdFx0XHRcdGRhdGU6IGF0dHJzLmVkaXRNb2RlbC5lbmREYXRlLFxuXHRcdFx0XHRcdFx0XHRcdG9uRGF0ZVNlbGVjdGVkOiAoZGF0ZSkgPT4gZGF0ZSAmJiAoZWRpdE1vZGVsLmVuZERhdGUgPSBkYXRlKSxcblx0XHRcdFx0XHRcdFx0XHRzdGFydE9mVGhlV2Vla09mZnNldCxcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJkYXRlVG9fbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0XHR1c2VJbnB1dEJ1dHRvbjogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRkaXNhYmxlZDogYXR0cnMuZGlzYWJsZWQsXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcdFwiXCIsXG5cdFx0XHRcdFx0XHRcdG0oVGltZVBpY2tlciwge1xuXHRcdFx0XHRcdFx0XHRcdGNsYXNzZXM6IGFwcENsYXNzZXMsXG5cdFx0XHRcdFx0XHRcdFx0dGltZTogZWRpdE1vZGVsLmVuZFRpbWUsXG5cdFx0XHRcdFx0XHRcdFx0b25UaW1lU2VsZWN0ZWQ6ICh0aW1lKSA9PiAoZWRpdE1vZGVsLmVuZFRpbWUgPSB0aW1lKSxcblx0XHRcdFx0XHRcdFx0XHR0aW1lRm9ybWF0LFxuXHRcdFx0XHRcdFx0XHRcdGRpc2FibGVkOiBhdHRycy5kaXNhYmxlZCB8fCBhdHRycy5lZGl0TW9kZWwuaXNBbGxEYXksXG5cdFx0XHRcdFx0XHRcdFx0YXJpYUxhYmVsOiBsYW5nLmdldChcImVuZFRpbWVfbGFiZWxcIiksXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XSksXG5cdFx0XHRdKSxcblx0XHRdKVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IFRleHRGaWVsZCwgVGV4dEZpZWxkQXR0cnMsIFRleHRGaWVsZFR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBjcmVhdGVBbGFybUludGVydmFsSXRlbXMsIGNyZWF0ZUN1c3RvbVJlcGVhdFJ1bGVVbml0VmFsdWVzLCBodW1hbkRlc2NyaXB0aW9uRm9yQWxhcm1JbnRlcnZhbCB9IGZyb20gXCIuL0NhbGVuZGFyR3VpVXRpbHMuanNcIlxuaW1wb3J0IHsgbGFuZywgVHJhbnNsYXRpb25LZXkgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvSWNvbnMuanNcIlxuaW1wb3J0IHsgYXR0YWNoRHJvcGRvd24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0Ryb3Bkb3duLmpzXCJcbmltcG9ydCB7IEFsYXJtSW50ZXJ2YWwsIEFsYXJtSW50ZXJ2YWxVbml0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyVXRpbHMuanNcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2cuanNcIlxuaW1wb3J0IHsgRHJvcERvd25TZWxlY3RvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRHJvcERvd25TZWxlY3Rvci5qc1wiXG5pbXBvcnQgeyBkZWVwRXF1YWwgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IFNlbGVjdCwgU2VsZWN0QXR0cmlidXRlcywgU2VsZWN0T3B0aW9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9TZWxlY3QuanNcIlxuaW1wb3J0IHsgSWNvbiwgSWNvblNpemUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb24uanNcIlxuaW1wb3J0IHsgQmFzZUJ1dHRvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvYnV0dG9ucy9CYXNlQnV0dG9uLmpzXCJcbmltcG9ydCB7IEJ1dHRvbkNvbG9yLCBnZXRDb2xvcnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBUYWJJbmRleCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5cbmV4cG9ydCB0eXBlIFJlbWluZGVyc0VkaXRvckF0dHJzID0ge1xuXHRhZGRBbGFybTogKGFsYXJtOiBBbGFybUludGVydmFsKSA9PiB1bmtub3duXG5cdHJlbW92ZUFsYXJtOiAoYWxhcm06IEFsYXJtSW50ZXJ2YWwpID0+IHVua25vd25cblx0YWxhcm1zOiByZWFkb25seSBBbGFybUludGVydmFsW11cblx0bGFiZWw6IFRyYW5zbGF0aW9uS2V5XG5cdHVzZU5ld0VkaXRvcjogYm9vbGVhblxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlbWluZGVyc1NlbGVjdE9wdGlvbiBleHRlbmRzIFNlbGVjdE9wdGlvbjxBbGFybUludGVydmFsPiB7XG5cdHRleHQ6IHN0cmluZ1xufVxuXG5leHBvcnQgY2xhc3MgUmVtaW5kZXJzRWRpdG9yIGltcGxlbWVudHMgQ29tcG9uZW50PFJlbWluZGVyc0VkaXRvckF0dHJzPiB7XG5cdHZpZXcodm5vZGU6IFZub2RlPFJlbWluZGVyc0VkaXRvckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IGFkZEFsYXJtLCByZW1vdmVBbGFybSwgYWxhcm1zLCB1c2VOZXdFZGl0b3IgfSA9IHZub2RlLmF0dHJzXG5cdFx0Y29uc3QgYWRkTmV3QWxhcm0gPSAobmV3QWxhcm06IEFsYXJtSW50ZXJ2YWwpID0+IHtcblx0XHRcdGNvbnN0IGhhc0FsYXJtID0gYWxhcm1zLmZpbmQoKGFsYXJtKSA9PiBkZWVwRXF1YWwoYWxhcm0sIG5ld0FsYXJtKSlcblx0XHRcdGlmIChoYXNBbGFybSkgcmV0dXJuXG5cdFx0XHRhZGRBbGFybShuZXdBbGFybSlcblx0XHR9XG5cdFx0cmV0dXJuIHVzZU5ld0VkaXRvciA/IHRoaXMucmVuZGVyTmV3RWRpdG9yKGFsYXJtcywgcmVtb3ZlQWxhcm0sIGFkZE5ld0FsYXJtLCBhZGRBbGFybSkgOiB0aGlzLnJlbmRlck9sZEVkaXRvcihhbGFybXMsIHJlbW92ZUFsYXJtLCBhZGROZXdBbGFybSwgdm5vZGUpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlck9sZEVkaXRvcihcblx0XHRhbGFybXM6IHJlYWRvbmx5IEFsYXJtSW50ZXJ2YWxbXSxcblx0XHRyZW1vdmVBbGFybTogKGFsYXJtOiBBbGFybUludGVydmFsKSA9PiB1bmtub3duLFxuXHRcdGFkZE5ld0FsYXJtOiAobmV3QWxhcm06IEFsYXJtSW50ZXJ2YWwpID0+IHZvaWQsXG5cdFx0dm5vZGU6IFZub2RlPFJlbWluZGVyc0VkaXRvckF0dHJzPixcblx0KSB7XG5cdFx0Y29uc3QgdGV4dEZpZWxkQXR0cnM6IEFycmF5PFRleHRGaWVsZEF0dHJzPiA9IGFsYXJtcy5tYXAoKGEpID0+ICh7XG5cdFx0XHR2YWx1ZTogaHVtYW5EZXNjcmlwdGlvbkZvckFsYXJtSW50ZXJ2YWwoYSwgbGFuZy5sYW5ndWFnZVRhZyksXG5cdFx0XHRsYWJlbDogXCJlbXB0eVN0cmluZ19tc2dcIixcblx0XHRcdGlzUmVhZE9ubHk6IHRydWUsXG5cdFx0XHRpbmplY3Rpb25zUmlnaHQ6ICgpID0+XG5cdFx0XHRcdG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdHRpdGxlOiBcImRlbGV0ZV9hY3Rpb25cIixcblx0XHRcdFx0XHRpY29uOiBJY29ucy5DYW5jZWwsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHJlbW92ZUFsYXJtKGEpLFxuXHRcdFx0XHR9KSxcblx0XHR9KSlcblxuXHRcdHRleHRGaWVsZEF0dHJzLnB1c2goe1xuXHRcdFx0dmFsdWU6IGxhbmcuZ2V0KFwiYWRkX2FjdGlvblwiKSxcblx0XHRcdGxhYmVsOiBcImVtcHR5U3RyaW5nX21zZ1wiLFxuXHRcdFx0aXNSZWFkT25seTogdHJ1ZSxcblx0XHRcdGluamVjdGlvbnNSaWdodDogKCkgPT5cblx0XHRcdFx0bShcblx0XHRcdFx0XHRJY29uQnV0dG9uLFxuXHRcdFx0XHRcdGF0dGFjaERyb3Bkb3duKHtcblx0XHRcdFx0XHRcdG1haW5CdXR0b25BdHRyczoge1xuXHRcdFx0XHRcdFx0XHR0aXRsZTogXCJhZGRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdGljb246IEljb25zLkFkZCxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRjaGlsZEF0dHJzOiAoKSA9PiBbXG5cdFx0XHRcdFx0XHRcdC4uLmNyZWF0ZUFsYXJtSW50ZXJ2YWxJdGVtcyhsYW5nLmxhbmd1YWdlVGFnKS5tYXAoKGkpID0+ICh7XG5cdFx0XHRcdFx0XHRcdFx0bGFiZWw6IGxhbmcubWFrZVRyYW5zbGF0aW9uKGkubmFtZSwgaS5uYW1lKSxcblx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4gYWRkTmV3QWxhcm0oaS52YWx1ZSksXG5cdFx0XHRcdFx0XHRcdH0pKSxcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcImNhbGVuZGFyUmVtaW5kZXJJbnRlcnZhbERyb3Bkb3duQ3VzdG9tSXRlbV9sYWJlbFwiLFxuXHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLnNob3dDdXN0b21SZW1pbmRlckludGVydmFsRGlhbG9nKCh2YWx1ZSwgdW5pdCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRhZGROZXdBbGFybSh7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dmFsdWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dW5pdCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdCksXG5cdFx0fSlcblxuXHRcdHRleHRGaWVsZEF0dHJzWzBdLmxhYmVsID0gdm5vZGUuYXR0cnMubGFiZWxcblxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIuZmxleC5jb2wuZmxleC1oYWxmLnBsLXNcIixcblx0XHRcdHRleHRGaWVsZEF0dHJzLm1hcCgoYSkgPT4gbShUZXh0RmllbGQsIGEpKSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlck5ld0VkaXRvcihcblx0XHRhbGFybXM6IHJlYWRvbmx5IEFsYXJtSW50ZXJ2YWxbXSxcblx0XHRyZW1vdmVBbGFybTogKGFsYXJtOiBBbGFybUludGVydmFsKSA9PiB1bmtub3duLFxuXHRcdGFkZE5ld0FsYXJtOiAobmV3QWxhcm06IEFsYXJtSW50ZXJ2YWwpID0+IHZvaWQsXG5cdFx0YWRkQWxhcm06IChhbGFybTogQWxhcm1JbnRlcnZhbCkgPT4gdW5rbm93bixcblx0KSB7XG5cdFx0Y29uc3QgYWxhcm1PcHRpb25zID0gY3JlYXRlQWxhcm1JbnRlcnZhbEl0ZW1zKGxhbmcubGFuZ3VhZ2VUYWcpLm1hcChcblx0XHRcdChhbGFybSkgPT5cblx0XHRcdFx0KHtcblx0XHRcdFx0XHR0ZXh0OiBhbGFybS5uYW1lLFxuXHRcdFx0XHRcdHZhbHVlOiBhbGFybS52YWx1ZSxcblx0XHRcdFx0XHRhcmlhVmFsdWU6IGFsYXJtLm5hbWUsXG5cdFx0XHRcdH0gc2F0aXNmaWVzIFJlbWluZGVyc1NlbGVjdE9wdGlvbiksXG5cdFx0KVxuXG5cdFx0YWxhcm1PcHRpb25zLnB1c2goe1xuXHRcdFx0dGV4dDogbGFuZy5nZXQoXCJjYWxlbmRhclJlbWluZGVySW50ZXJ2YWxEcm9wZG93bkN1c3RvbUl0ZW1fbGFiZWxcIiksXG5cdFx0XHRhcmlhVmFsdWU6IGxhbmcuZ2V0KFwiY2FsZW5kYXJSZW1pbmRlckludGVydmFsRHJvcGRvd25DdXN0b21JdGVtX2xhYmVsXCIpLFxuXHRcdFx0dmFsdWU6IHsgdmFsdWU6IC0xLCB1bml0OiBBbGFybUludGVydmFsVW5pdC5NSU5VVEUgfSxcblx0XHR9KVxuXG5cdFx0Y29uc3QgZGVmYXVsdFNlbGVjdGVkID0ge1xuXHRcdFx0dGV4dDogbGFuZy5nZXQoXCJhZGRSZW1pbmRlcl9sYWJlbFwiKSxcblx0XHRcdHZhbHVlOiB7IHZhbHVlOiAtMiwgdW5pdDogQWxhcm1JbnRlcnZhbFVuaXQuTUlOVVRFIH0sXG5cdFx0XHRhcmlhVmFsdWU6IGxhbmcuZ2V0KFwiYWRkUmVtaW5kZXJfbGFiZWxcIiksXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG0oXCJ1bC51bnN0eWxlZC1saXN0LmZsZXguY29sLmZsZXgtZ3Jvdy5nYXAtdnBhZC1zXCIsIFtcblx0XHRcdGFsYXJtcy5tYXAoKGFsYXJtKSA9PlxuXHRcdFx0XHRtKFwibGkuZmxleC5qdXN0aWZ5LWJldHdlZW4uZmxldy1ncm93Lml0ZW1zLWNlbnRlci5nYXAtdnBhZC1zXCIsIFtcblx0XHRcdFx0XHRtKFwic3Bhbi5mbGV4Lmp1c3RpZnktYmV0d2VlblwiLCBodW1hbkRlc2NyaXB0aW9uRm9yQWxhcm1JbnRlcnZhbChhbGFybSwgbGFuZy5sYW5ndWFnZVRhZykpLFxuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRCYXNlQnV0dG9uLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHQvL1RoaXMgbWlnaHQgbm90IG1ha2Ugc2Vuc2UgaW4gb3RoZXIgbGFuZ3VhZ2VzLCBidXQgaXMgYmV0dGVyIHRoYW4gd2hhdCB3ZSBoYXZlIG5vd1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogbGFuZy5tYWtlVHJhbnNsYXRpb24oXG5cdFx0XHRcdFx0XHRcdFx0XCJkZWxldGVfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0YCR7bGFuZy5nZXQoXCJkZWxldGVfYWN0aW9uXCIpfSAke2h1bWFuRGVzY3JpcHRpb25Gb3JBbGFybUludGVydmFsKGFsYXJtLCBsYW5nLmxhbmd1YWdlVGFnKX1gLFxuXHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XHRvbmNsaWNrOiAoKSA9PiByZW1vdmVBbGFybShhbGFybSksXG5cdFx0XHRcdFx0XHRcdGNsYXNzOiBcImZsZXggaXRlbXMtY2VudGVyXCIsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0bShJY29uLCB7XG5cdFx0XHRcdFx0XHRcdGljb246IEljb25zLkNhbmNlbCxcblx0XHRcdFx0XHRcdFx0c2l6ZTogSWNvblNpemUuTWVkaXVtLFxuXHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdGZpbGw6IGdldENvbG9ycyhCdXR0b25Db2xvci5Db250ZW50KS5idXR0b24sXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRdKSxcblx0XHRcdCksXG5cdFx0XHRtKFxuXHRcdFx0XHRcImxpLml0ZW1zLWNlbnRlclwiLFxuXHRcdFx0XHRtKFNlbGVjdDxSZW1pbmRlcnNTZWxlY3RPcHRpb24sIEFsYXJtSW50ZXJ2YWw+LCB7XG5cdFx0XHRcdFx0YXJpYUxhYmVsOiBsYW5nLmdldChcImNhbGVuZGFyUmVtaW5kZXJJbnRlcnZhbFZhbHVlX2xhYmVsXCIpLFxuXHRcdFx0XHRcdHNlbGVjdGVkOiBkZWZhdWx0U2VsZWN0ZWQsXG5cdFx0XHRcdFx0b3B0aW9uczogc3RyZWFtKGFsYXJtT3B0aW9ucyksXG5cdFx0XHRcdFx0cmVuZGVyT3B0aW9uOiAob3B0aW9uKSA9PiB0aGlzLnJlbmRlclJlbWluZGVyT3B0aW9ucyhvcHRpb24sIGZhbHNlLCBmYWxzZSksXG5cdFx0XHRcdFx0cmVuZGVyRGlzcGxheTogKG9wdGlvbikgPT4gdGhpcy5yZW5kZXJSZW1pbmRlck9wdGlvbnMob3B0aW9uLCBhbGFybXMubGVuZ3RoID4gMCwgdHJ1ZSksXG5cdFx0XHRcdFx0b25jaGFuZ2U6IChuZXdWYWx1ZSkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKG5ld1ZhbHVlLnZhbHVlLnZhbHVlID09PSAtMSkge1xuXHRcdFx0XHRcdFx0XHQvLyB0aW1lb3V0IG5lZWRlZCB0byBwcmV2ZW50IHRoZSBjdXN0b20gaW50ZXJ2YWwgZGlhbG9nIHRvIGJlIGNsb3NlZCBieSB0aGUga2V5IGV2ZW50IHRyaWdnZXJlZCBpbnNpZGUgdGhlIHNlbGVjdCBjb21wb25lbnRcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuc2hvd0N1c3RvbVJlbWluZGVySW50ZXJ2YWxEaWFsb2coKHZhbHVlLCB1bml0KSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRhZGROZXdBbGFybSh7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHZhbHVlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR1bml0LFxuXHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHR9LCAwKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YWRkQWxhcm0obmV3VmFsdWUudmFsdWUpXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRleHBhbmRlZDogdHJ1ZSxcblx0XHRcdFx0XHRpY29uQ29sb3I6IGdldENvbG9ycyhCdXR0b25Db2xvci5Db250ZW50KS5idXR0b24sXG5cdFx0XHRcdFx0bm9JY29uOiB0cnVlLFxuXHRcdFx0XHR9IHNhdGlzZmllcyBTZWxlY3RBdHRyaWJ1dGVzPFJlbWluZGVyc1NlbGVjdE9wdGlvbiwgQWxhcm1JbnRlcnZhbD4pLFxuXHRcdFx0KSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJSZW1pbmRlck9wdGlvbnMob3B0aW9uOiBSZW1pbmRlcnNTZWxlY3RPcHRpb24sIGhhc0FsYXJtczogYm9vbGVhbiwgaXNEaXNwbGF5OiBib29sZWFuKSB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcImJ1dHRvbi5pdGVtcy1jZW50ZXIuZmxleC1ncm93XCIsXG5cdFx0XHR7XG5cdFx0XHRcdHRhYkluZGV4OiBpc0Rpc3BsYXkgPyBUYWJJbmRleC5Qcm9ncmFtbWF0aWMgOiB1bmRlZmluZWQsXG5cdFx0XHRcdGNsYXNzOiBpc0Rpc3BsYXkgPyBgZmxleCAke2hhc0FsYXJtcyA/IFwidGV4dC1mYWRlXCIgOiBcIlwifWAgOiBcInN0YXRlLWJnIGJ1dHRvbi1jb250ZW50IGJ1dHRvbi1taW4taGVpZ2h0IGRyb3Bkb3duLWJ1dHRvbiBwdC1zIHBiLXNcIixcblx0XHRcdH0sXG5cdFx0XHRvcHRpb24udGV4dCxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHNob3dDdXN0b21SZW1pbmRlckludGVydmFsRGlhbG9nKG9uQWRkQWN0aW9uOiAodmFsdWU6IG51bWJlciwgdW5pdDogQWxhcm1JbnRlcnZhbFVuaXQpID0+IHZvaWQpIHtcblx0XHRsZXQgdGltZVJlbWluZGVyVmFsdWUgPSAwXG5cdFx0bGV0IHRpbWVSZW1pbmRlclVuaXQ6IEFsYXJtSW50ZXJ2YWxVbml0ID0gQWxhcm1JbnRlcnZhbFVuaXQuTUlOVVRFXG5cblx0XHREaWFsb2cuc2hvd0FjdGlvbkRpYWxvZyh7XG5cdFx0XHR0aXRsZTogXCJjYWxlbmRhclJlbWluZGVySW50ZXJ2YWxDdXN0b21EaWFsb2dfdGl0bGVcIixcblx0XHRcdGFsbG93T2tXaXRoUmV0dXJuOiB0cnVlLFxuXHRcdFx0Y2hpbGQ6IHtcblx0XHRcdFx0dmlldzogKCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHVuaXRJdGVtcyA9IGNyZWF0ZUN1c3RvbVJlcGVhdFJ1bGVVbml0VmFsdWVzKCkgPz8gW11cblx0XHRcdFx0XHRyZXR1cm4gbShcIi5mbGV4IGZ1bGwtd2lkdGggcHQtc1wiLCBbXG5cdFx0XHRcdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdFx0XHR0eXBlOiBUZXh0RmllbGRUeXBlLk51bWJlcixcblx0XHRcdFx0XHRcdFx0bWluOiAwLFxuXHRcdFx0XHRcdFx0XHRsYWJlbDogXCJjYWxlbmRhclJlbWluZGVySW50ZXJ2YWxWYWx1ZV9sYWJlbFwiLFxuXHRcdFx0XHRcdFx0XHR2YWx1ZTogdGltZVJlbWluZGVyVmFsdWUudG9TdHJpbmcoKSxcblx0XHRcdFx0XHRcdFx0b25pbnB1dDogKHYpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCB0aW1lID0gTnVtYmVyLnBhcnNlSW50KHYpXG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgaXNFbXB0eSA9IHYgPT09IFwiXCJcblx0XHRcdFx0XHRcdFx0XHRpZiAoIU51bWJlci5pc05hTih0aW1lKSB8fCBpc0VtcHR5KSB0aW1lUmVtaW5kZXJWYWx1ZSA9IGlzRW1wdHkgPyAwIDogTWF0aC5hYnModGltZSlcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0Y2xhc3M6IFwiZmxleC1oYWxmIG5vLWFwcGVhcmFuY2VcIiwgLy9SZW1vdmVzIHRoZSB1cC9kb3duIGFycm93IGZyb20gaW5wdXQgbnVtYmVyLiBQcmVzc2luZyBhcnJvdyB1cC9kb3duIGtleSBzdGlsbCB3b3JraW5nXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdG0oRHJvcERvd25TZWxlY3Rvciwge1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogXCJlbXB0eVN0cmluZ19tc2dcIixcblx0XHRcdFx0XHRcdFx0c2VsZWN0ZWRWYWx1ZTogdGltZVJlbWluZGVyVW5pdCxcblx0XHRcdFx0XHRcdFx0aXRlbXM6IHVuaXRJdGVtcyxcblx0XHRcdFx0XHRcdFx0Y2xhc3M6IFwiZmxleC1oYWxmIHBsLXNcIixcblx0XHRcdFx0XHRcdFx0c2VsZWN0aW9uQ2hhbmdlZEhhbmRsZXI6IChzZWxlY3RlZFZhbHVlOiBBbGFybUludGVydmFsVW5pdCkgPT4gKHRpbWVSZW1pbmRlclVuaXQgPSBzZWxlY3RlZFZhbHVlIGFzIEFsYXJtSW50ZXJ2YWxVbml0KSxcblx0XHRcdFx0XHRcdFx0ZGlzYWJsZWQ6IGZhbHNlLFxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XSlcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRva0FjdGlvblRleHRJZDogXCJhZGRfYWN0aW9uXCIsXG5cdFx0XHRva0FjdGlvbjogKGRpYWxvZzogRGlhbG9nKSA9PiB7XG5cdFx0XHRcdG9uQWRkQWN0aW9uKHRpbWVSZW1pbmRlclZhbHVlLCB0aW1lUmVtaW5kZXJVbml0KVxuXHRcdFx0XHRkaWFsb2cuY2xvc2UoKVxuXHRcdFx0fSxcblx0XHR9KVxuXHR9XG59XG4iLCJpbXBvcnQgdHlwZSB7IE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IG0sIHsgQ2hpbGQsIENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgaXNLZXlQcmVzc2VkIH0gZnJvbSBcIi4uLy4uL21pc2MvS2V5TWFuYWdlci5qc1wiXG5pbXBvcnQgeyBLZXlzIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgQXJpYVJvbGUgfSBmcm9tIFwiLi4vQXJpYVV0aWxzLmpzXCJcblxuZXhwb3J0IGludGVyZmFjZSBTaW5ndWxhck9yUGx1cmFsTGFiZWwge1xuXHRzaW5ndWxhcjogTWF5YmVUcmFuc2xhdGlvblxuXHRwbHVyYWw6IE1heWJlVHJhbnNsYXRpb25cbn1cblxuZXhwb3J0IHR5cGUgUmFkaW9Hcm91cE9wdGlvbjxUPiA9IHtcblx0cmVhZG9ubHkgbmFtZTogTWF5YmVUcmFuc2xhdGlvblxuXHRyZWFkb25seSB2YWx1ZTogVFxufVxuXG5leHBvcnQgdHlwZSBSYWRpb0dyb3VwQXR0cnM8VD4gPSB7XG5cdC8vIFRoZSB1bmlxdWUgbmFtZSBvZiB0aGUgcmFkaW8gYnV0dG9uIGdyb3VwLiBUaGUgYnJvd3NlciB1c2VzIGl0IHRvIGdyb3VwIHRoZSByYWRpbyBidXR0b25zIHRvZ2V0aGVyLlxuXHRuYW1lOiBNYXliZVRyYW5zbGF0aW9uXG5cdG9wdGlvbnM6IFJlYWRvbmx5QXJyYXk8UmFkaW9Hcm91cE9wdGlvbjxUPj5cblx0YXJpYUxhYmVsOiBNYXliZVRyYW5zbGF0aW9uXG5cdGNsYXNzZXM/OiBBcnJheTxzdHJpbmc+XG5cdHNlbGVjdGVkT3B0aW9uOiBUIHwgbnVsbFxuXHRvbk9wdGlvblNlbGVjdGVkOiAoYXJnMDogVCkgPT4gdW5rbm93blxuXHRpbmplY3Rpb25NYXA/OiBNYXA8c3RyaW5nLCBDaGlsZD5cbn1cblxuLyoqXG4gKiBDb21wb25lbnQgd2hpY2ggc2hvd3Mgc2VsZWN0aW9uIGZvciBhIHNpbmdsZSBjaG9pY2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBSYWRpb0dyb3VwPFQ+IGltcGxlbWVudHMgQ29tcG9uZW50PFJhZGlvR3JvdXBBdHRyczxUPj4ge1xuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8UmFkaW9Hcm91cEF0dHJzPFQ+Pik6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwidWwudW5zdHlsZWQtbGlzdC5mbGV4LmNvbC5nYXAtdnBhZFwiLFxuXHRcdFx0e1xuXHRcdFx0XHRhcmlhTGFiZWw6IGxhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KGF0dHJzLmFyaWFMYWJlbCksXG5cdFx0XHRcdHJvbGU6IEFyaWFSb2xlLlJhZGlvR3JvdXAsXG5cdFx0XHR9LFxuXHRcdFx0YXR0cnMub3B0aW9ucy5tYXAoKG9wdGlvbikgPT5cblx0XHRcdFx0dGhpcy5yZW5kZXJPcHRpb24oYXR0cnMubmFtZSwgb3B0aW9uLCBhdHRycy5zZWxlY3RlZE9wdGlvbiwgYXR0cnMuY2xhc3Nlcz8uam9pbihcIiBcIiksIGF0dHJzLm9uT3B0aW9uU2VsZWN0ZWQsIGF0dHJzLmluamVjdGlvbk1hcCksXG5cdFx0XHQpLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyT3B0aW9uKFxuXHRcdGdyb3VwTmFtZTogTWF5YmVUcmFuc2xhdGlvbixcblx0XHRvcHRpb246IFJhZGlvR3JvdXBPcHRpb248VD4sXG5cdFx0c2VsZWN0ZWRPcHRpb246IFQgfCBudWxsLFxuXHRcdG9wdGlvbkNsYXNzOiBzdHJpbmcgfCB1bmRlZmluZWQsXG5cdFx0b25PcHRpb25TZWxlY3RlZDogKGFyZzA6IFQpID0+IHVua25vd24sXG5cdFx0aW5qZWN0aW9uTWFwPzogTWFwPHN0cmluZywgQ2hpbGQ+LFxuXHQpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgbmFtZSA9IGxhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KGdyb3VwTmFtZSlcblx0XHRjb25zdCB2YWx1ZVN0cmluZyA9IFN0cmluZyhvcHRpb24udmFsdWUpXG5cdFx0Y29uc3QgaXNTZWxlY3RlZCA9IG9wdGlvbi52YWx1ZSA9PT0gc2VsZWN0ZWRPcHRpb25cblxuXHRcdC8vIElEcyB1c2VkIHRvIGxpbmsgdGhlIGxhYmVsIGFuZCBkZXNjcmlwdGlvbiBmb3IgYWNjZXNzaWJpbGl0eVxuXHRcdGNvbnN0IG9wdGlvbklkID0gYCR7bmFtZX0tJHt2YWx1ZVN0cmluZ31gXG5cblx0XHQvLyBUaGUgd3JhcHBlciBpcyBuZWVkZWQgYmVjYXVzZSA8aW5wdXQ+IGlzIHNlbGYtY2xvc2luZyBhbmQgd2lsbCBub3QgdGFrZSB0aGUgbGFiZWwgYXMgYSBjaGlsZFxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCJsaS5mbGV4LmdhcC12cGFkLmN1cnNvci1wb2ludGVyLmZ1bGwtd2lkdGguZmxhc2hcIixcblx0XHRcdHtcblx0XHRcdFx0Y2xhc3M6IG9wdGlvbkNsYXNzID8/IFwiXCIsXG5cdFx0XHRcdG9uY2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIkNsaWNrZWQ/XCIpXG5cdFx0XHRcdFx0b25PcHRpb25TZWxlY3RlZChvcHRpb24udmFsdWUpXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHRtKFwiaW5wdXRbdHlwZT1yYWRpb10ubS0wLmJpZy1yYWRpby5jb250ZW50LWFjY2VudC1hY2NlbnRcIiwge1xuXHRcdFx0XHRcdC8qIFRoZSBgbmFtZWAgYXR0cmlidXRlIGRlZmluZXMgdGhlIGdyb3VwIHRoZSByYWRpbyBidXR0b24gYmVsb25ncyB0by4gTm90IHRoZSBuYW1lL2xhYmVsIG9mIHRoZSByYWRpbyBidXR0b24gaXRzZWxmLlxuXHRcdFx0XHRcdCAqIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVE1ML0VsZW1lbnQvaW5wdXQvcmFkaW8jZGVmaW5pbmdfYV9yYWRpb19ncm91cFxuXHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdG5hbWU6IGxhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KGdyb3VwTmFtZSksXG5cdFx0XHRcdFx0dmFsdWU6IHZhbHVlU3RyaW5nLFxuXHRcdFx0XHRcdGlkOiBvcHRpb25JZCxcblx0XHRcdFx0XHQvLyBIYW5kbGUgY2hhbmdlcyBpbiB2YWx1ZSBmcm9tIHRoZSBhdHRyaWJ1dGVzXG5cdFx0XHRcdFx0Y2hlY2tlZDogaXNTZWxlY3RlZCA/IHRydWUgOiBudWxsLFxuXHRcdFx0XHRcdG9ua2V5ZG93bjogKGV2ZW50OiBLZXlib2FyZEV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoaXNLZXlQcmVzc2VkKGV2ZW50LmtleSwgS2V5cy5SRVRVUk4pKSB7XG5cdFx0XHRcdFx0XHRcdG9uT3B0aW9uU2VsZWN0ZWQob3B0aW9uLnZhbHVlKVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRtKFwiLmZsZXguZmxleC1jb2x1bW4uZnVsbC13aWR0aFwiLCBbXG5cdFx0XHRcdFx0bShcImxhYmVsLmN1cnNvci1wb2ludGVyXCIsIHsgZm9yOiBvcHRpb25JZCB9LCBsYW5nLmdldFRyYW5zbGF0aW9uVGV4dChvcHRpb24ubmFtZSkpLFxuXHRcdFx0XHRcdHRoaXMuZ2V0SW5qZWN0aW9uKFN0cmluZyhvcHRpb24udmFsdWUpLCBpbmplY3Rpb25NYXApLFxuXHRcdFx0XHRdKSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRJbmplY3Rpb24oa2V5OiBzdHJpbmcsIGluamVjdGlvbk1hcD86IE1hcDxzdHJpbmcsIENoaWxkPik6IENoaWxkIHtcblx0XHRpZiAoIWluamVjdGlvbk1hcCB8fCAhaW5qZWN0aW9uTWFwLmhhcyhrZXkpKSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblxuXHRcdHJldHVybiBpbmplY3Rpb25NYXAuZ2V0KGtleSlcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGQsIENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudFdoZW5Nb2RlbCB9IGZyb20gXCIuLi9ldmVudGVkaXRvci1tb2RlbC9DYWxlbmRhckV2ZW50V2hlbk1vZGVsLmpzXCJcbmltcG9ydCB7IFRleHRGaWVsZFR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IEVuZFR5cGUsIFJlcGVhdFBlcmlvZCwgVGFiSW5kZXggfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgRGF0ZVBpY2tlciwgRGF0ZVBpY2tlckF0dHJzLCBQaWNrZXJQb3NpdGlvbiB9IGZyb20gXCIuLi9waWNrZXJzL0RhdGVQaWNrZXIuanNcIlxuXG5pbXBvcnQgeyBjcmVhdGVDdXN0b21FbmRUeXBlT3B0aW9ucywgY3JlYXRlSW50ZXJ2YWxWYWx1ZXMsIGNyZWF0ZVJlcGVhdFJ1bGVPcHRpb25zLCBjdXN0b21GcmVxdWVuY2llc09wdGlvbnMsIEludGVydmFsT3B0aW9uIH0gZnJvbSBcIi4uL0NhbGVuZGFyR3VpVXRpbHMuanNcIlxuaW1wb3J0IHsgcHgsIHNpemUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9zaXplLmpzXCJcbmltcG9ydCB7IENhcmQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0NhcmQuanNcIlxuaW1wb3J0IHsgUmFkaW9Hcm91cCwgUmFkaW9Hcm91cEF0dHJzLCBSYWRpb0dyb3VwT3B0aW9uIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9SYWRpb0dyb3VwLmpzXCJcbmltcG9ydCB7IElucHV0TW9kZSwgU2luZ2xlTGluZVRleHRGaWVsZCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvU2luZ2xlTGluZVRleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBTZWxlY3QsIFNlbGVjdEF0dHJpYnV0ZXMgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1NlbGVjdC5qc1wiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBEaXZpZGVyIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvRGl2aWRlci5qc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL3RoZW1lLmpzXCJcbmltcG9ydCB7IGlzQXBwIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0Vudi5qc1wiXG5cbmV4cG9ydCB0eXBlIFJlcGVhdFJ1bGVFZGl0b3JBdHRycyA9IHtcblx0bW9kZWw6IENhbGVuZGFyRXZlbnRXaGVuTW9kZWxcblx0c3RhcnRPZlRoZVdlZWtPZmZzZXQ6IG51bWJlclxuXHR3aWR0aDogbnVtYmVyXG5cdGJhY2tBY3Rpb246ICgpID0+IHZvaWRcbn1cblxudHlwZSBSZXBlYXRSdWxlT3B0aW9uID0gUmVwZWF0UGVyaW9kIHwgXCJDVVNUT01cIiB8IG51bGxcblxuZXhwb3J0IGNsYXNzIFJlcGVhdFJ1bGVFZGl0b3IgaW1wbGVtZW50cyBDb21wb25lbnQ8UmVwZWF0UnVsZUVkaXRvckF0dHJzPiB7XG5cdHByaXZhdGUgcmVwZWF0UnVsZVR5cGU6IFJlcGVhdFJ1bGVPcHRpb24gfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHJlcGVhdEludGVydmFsOiBudW1iZXIgPSAwXG5cdHByaXZhdGUgaW50ZXJ2YWxPcHRpb25zOiBzdHJlYW08SW50ZXJ2YWxPcHRpb25bXT4gPSBzdHJlYW0oW10pXG5cdHByaXZhdGUgaW50ZXJ2YWxFeHBhbmRlZDogYm9vbGVhbiA9IGZhbHNlXG5cblx0cHJpdmF0ZSBudW1iZXJWYWx1ZXM6IEludGVydmFsT3B0aW9uW10gPSBjcmVhdGVJbnRlcnZhbFZhbHVlcygpXG5cblx0cHJpdmF0ZSBvY2N1cnJlbmNlc09wdGlvbnM6IHN0cmVhbTxJbnRlcnZhbE9wdGlvbltdPiA9IHN0cmVhbShbXSlcblx0cHJpdmF0ZSBvY2N1cnJlbmNlc0V4cGFuZGVkOiBib29sZWFuID0gZmFsc2Vcblx0cHJpdmF0ZSByZXBlYXRPY2N1cnJlbmNlczogbnVtYmVyXG5cblx0Y29uc3RydWN0b3IoeyBhdHRycyB9OiBWbm9kZTxSZXBlYXRSdWxlRWRpdG9yQXR0cnM+KSB7XG5cdFx0aWYgKGF0dHJzLm1vZGVsLnJlcGVhdFBlcmlvZCAhPSBudWxsKSB7XG5cdFx0XHR0aGlzLnJlcGVhdFJ1bGVUeXBlID0gdGhpcy5nZXRSZXBlYXRUeXBlKGF0dHJzLm1vZGVsLnJlcGVhdFBlcmlvZCwgYXR0cnMubW9kZWwucmVwZWF0SW50ZXJ2YWwsIGF0dHJzLm1vZGVsLnJlcGVhdEVuZFR5cGUpXG5cdFx0fVxuXG5cdFx0dGhpcy5pbnRlcnZhbE9wdGlvbnModGhpcy5udW1iZXJWYWx1ZXMpXG5cdFx0dGhpcy5vY2N1cnJlbmNlc09wdGlvbnModGhpcy5udW1iZXJWYWx1ZXMpXG5cblx0XHR0aGlzLnJlcGVhdEludGVydmFsID0gYXR0cnMubW9kZWwucmVwZWF0SW50ZXJ2YWxcblx0XHR0aGlzLnJlcGVhdE9jY3VycmVuY2VzID0gYXR0cnMubW9kZWwucmVwZWF0RW5kT2NjdXJyZW5jZXNcblx0fVxuXG5cdHByaXZhdGUgZ2V0UmVwZWF0VHlwZShwZXJpb2Q6IFJlcGVhdFBlcmlvZCwgaW50ZXJ2YWw6IG51bWJlciwgZW5kVGltZTogRW5kVHlwZSkge1xuXHRcdGlmIChpbnRlcnZhbCA+IDEgfHwgZW5kVGltZSAhPT0gRW5kVHlwZS5OZXZlcikge1xuXHRcdFx0cmV0dXJuIFwiQ1VTVE9NXCJcblx0XHR9XG5cblx0XHRyZXR1cm4gcGVyaW9kXG5cdH1cblxuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8UmVwZWF0UnVsZUVkaXRvckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBjdXN0b21SdWxlT3B0aW9ucyA9IGN1c3RvbUZyZXF1ZW5jaWVzT3B0aW9ucy5tYXAoKG9wdGlvbikgPT4gKHtcblx0XHRcdC4uLm9wdGlvbixcblx0XHRcdG5hbWU6IGF0dHJzLm1vZGVsLnJlcGVhdEludGVydmFsID4gMSA/IG9wdGlvbi5uYW1lLnBsdXJhbCA6IG9wdGlvbi5uYW1lLnNpbmd1bGFyLFxuXHRcdH0pKSBhcyBSYWRpb0dyb3VwT3B0aW9uPFJlcGVhdFBlcmlvZD5bXVxuXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5wYi5wdC5mbGV4LmNvbC5nYXAtdnBhZC5maXQtaGVpZ2h0XCIsXG5cdFx0XHR7XG5cdFx0XHRcdGNsYXNzOiB0aGlzLnJlcGVhdFJ1bGVUeXBlID09PSBcIkNVU1RPTVwiID8gXCJib3gtY29udGVudFwiIDogXCJcIixcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHR3aWR0aDogcHgoYXR0cnMud2lkdGgpLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0bShcblx0XHRcdFx0XHRDYXJkLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdHBhZGRpbmc6IGAke3NpemUudnBhZH1weGAsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0bShSYWRpb0dyb3VwLCB7XG5cdFx0XHRcdFx0XHRhcmlhTGFiZWw6IFwiY2FsZW5kYXJSZXBlYXRpbmdfbGFiZWxcIixcblx0XHRcdFx0XHRcdG5hbWU6IFwiY2FsZW5kYXJSZXBlYXRpbmdfbGFiZWxcIixcblx0XHRcdFx0XHRcdG9wdGlvbnM6IGNyZWF0ZVJlcGVhdFJ1bGVPcHRpb25zKCksXG5cdFx0XHRcdFx0XHRzZWxlY3RlZE9wdGlvbjogdGhpcy5yZXBlYXRSdWxlVHlwZSxcblx0XHRcdFx0XHRcdG9uT3B0aW9uU2VsZWN0ZWQ6IChvcHRpb246IFJlcGVhdFJ1bGVPcHRpb24pID0+IHtcblx0XHRcdFx0XHRcdFx0dGhpcy5yZXBlYXRSdWxlVHlwZSA9IG9wdGlvblxuXHRcdFx0XHRcdFx0XHRpZiAob3B0aW9uID09PSBcIkNVU1RPTVwiKSB7XG5cdFx0XHRcdFx0XHRcdFx0YXR0cnMubW9kZWwucmVwZWF0UGVyaW9kID0gYXR0cnMubW9kZWwucmVwZWF0UGVyaW9kID8/IFJlcGVhdFBlcmlvZC5EQUlMWVxuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdGF0dHJzLm1vZGVsLnJlcGVhdEludGVydmFsID0gMVxuXHRcdFx0XHRcdFx0XHRcdGF0dHJzLm1vZGVsLnJlcGVhdEVuZFR5cGUgPSBFbmRUeXBlLk5ldmVyXG5cdFx0XHRcdFx0XHRcdFx0YXR0cnMubW9kZWwucmVwZWF0UGVyaW9kID0gb3B0aW9uIGFzIFJlcGVhdFBlcmlvZFxuXHRcdFx0XHRcdFx0XHRcdGF0dHJzLmJhY2tBY3Rpb24oKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0Y2xhc3NlczogW1wiY3Vyc29yLXBvaW50ZXJcIl0sXG5cdFx0XHRcdFx0fSBzYXRpc2ZpZXMgUmFkaW9Hcm91cEF0dHJzPFJlcGVhdFJ1bGVPcHRpb24+KSxcblx0XHRcdFx0KSxcblx0XHRcdFx0dGhpcy5yZW5kZXJGcmVxdWVuY3lPcHRpb25zKGF0dHJzLCBjdXN0b21SdWxlT3B0aW9ucyksXG5cdFx0XHRcdHRoaXMucmVuZGVyRW5kT3B0aW9ucyhhdHRycyksXG5cdFx0XHRdLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRW5kT3B0aW9ucyhhdHRyczogUmVwZWF0UnVsZUVkaXRvckF0dHJzKSB7XG5cdFx0aWYgKHRoaXMucmVwZWF0UnVsZVR5cGUgIT09IFwiQ1VTVE9NXCIpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG0oXCIuZmxleC5jb2xcIiwgW1xuXHRcdFx0bShcInNtYWxsLnVwcGVyY2FzZS5wYi1zLmIudGV4dC1lbGxpcHNpc1wiLCB7IHN0eWxlOiB7IGNvbG9yOiB0aGVtZS5uYXZpZ2F0aW9uX2J1dHRvbiB9IH0sIGxhbmcuZ2V0KFwiY2FsZW5kYXJSZXBlYXRTdG9wQ29uZGl0aW9uX2xhYmVsXCIpKSxcblx0XHRcdG0oXG5cdFx0XHRcdENhcmQsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0cGFkZGluZzogYCR7c2l6ZS52cGFkfXB4YCxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGNsYXNzZXM6IFtcImZsZXhcIiwgXCJjb2xcIiwgXCJnYXAtdnBhZC1zXCJdLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0bShSYWRpb0dyb3VwLCB7XG5cdFx0XHRcdFx0XHRhcmlhTGFiZWw6IFwiY2FsZW5kYXJSZXBlYXRTdG9wQ29uZGl0aW9uX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRuYW1lOiBcImNhbGVuZGFyUmVwZWF0U3RvcENvbmRpdGlvbl9sYWJlbFwiLFxuXHRcdFx0XHRcdFx0b3B0aW9uczogY3JlYXRlQ3VzdG9tRW5kVHlwZU9wdGlvbnMoKSxcblx0XHRcdFx0XHRcdHNlbGVjdGVkT3B0aW9uOiBhdHRycy5tb2RlbC5yZXBlYXRFbmRUeXBlLFxuXHRcdFx0XHRcdFx0b25PcHRpb25TZWxlY3RlZDogKG9wdGlvbjogRW5kVHlwZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRhdHRycy5tb2RlbC5yZXBlYXRFbmRUeXBlID0gb3B0aW9uXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0Y2xhc3NlczogW1wiY3Vyc29yLXBvaW50ZXJcIl0sXG5cdFx0XHRcdFx0XHRpbmplY3Rpb25NYXA6IHRoaXMuYnVpbGRJbmplY3Rpb25zKGF0dHJzKSxcblx0XHRcdFx0XHR9IHNhdGlzZmllcyBSYWRpb0dyb3VwQXR0cnM8RW5kVHlwZT4pLFxuXHRcdFx0XHRdLFxuXHRcdFx0KSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJGcmVxdWVuY3lPcHRpb25zKGF0dHJzOiBSZXBlYXRSdWxlRWRpdG9yQXR0cnMsIGN1c3RvbVJ1bGVPcHRpb25zOiBSYWRpb0dyb3VwT3B0aW9uPFJlcGVhdFBlcmlvZD5bXSkge1xuXHRcdGlmICh0aGlzLnJlcGVhdFJ1bGVUeXBlICE9PSBcIkNVU1RPTVwiKSB7XG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblxuXHRcdHJldHVybiBtKFwiLmZsZXguY29sXCIsIFtcblx0XHRcdG0oXCJzbWFsbC51cHBlcmNhc2UucGItcy5iLnRleHQtZWxsaXBzaXNcIiwgeyBzdHlsZTogeyBjb2xvcjogdGhlbWUubmF2aWdhdGlvbl9idXR0b24gfSB9LCBsYW5nLmdldChcImludGVydmFsRnJlcXVlbmN5X2xhYmVsXCIpKSxcblx0XHRcdG0oXG5cdFx0XHRcdENhcmQsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0cGFkZGluZzogYDAgMCAke3NpemUudnBhZH1weGAsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRjbGFzc2VzOiBbXCJmbGV4XCIsIFwiY29sXCJdLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRbXG5cdFx0XHRcdFx0dGhpcy5yZW5kZXJJbnRlcnZhbFBpY2tlcihhdHRycyksXG5cdFx0XHRcdFx0bShEaXZpZGVyLCB7IGNvbG9yOiB0aGVtZS5idXR0b25fYnViYmxlX2JnLCBzdHlsZTogeyBtYXJnaW46IGAwIDAgJHtzaXplLnZwYWR9cHhgIH0gfSksXG5cdFx0XHRcdFx0bShSYWRpb0dyb3VwLCB7XG5cdFx0XHRcdFx0XHRhcmlhTGFiZWw6IFwiaW50ZXJ2YWxGcmVxdWVuY3lfbGFiZWxcIixcblx0XHRcdFx0XHRcdG5hbWU6IFwiaW50ZXJ2YWxGcmVxdWVuY3lfbGFiZWxcIixcblx0XHRcdFx0XHRcdG9wdGlvbnM6IGN1c3RvbVJ1bGVPcHRpb25zLFxuXHRcdFx0XHRcdFx0c2VsZWN0ZWRPcHRpb246IGF0dHJzLm1vZGVsLnJlcGVhdFBlcmlvZCxcblx0XHRcdFx0XHRcdG9uT3B0aW9uU2VsZWN0ZWQ6IChvcHRpb246IFJlcGVhdFBlcmlvZCkgPT4ge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnVwZGF0ZUN1c3RvbVJ1bGUoYXR0cnMubW9kZWwsIHsgaW50ZXJ2YWxGcmVxdWVuY3k6IG9wdGlvbiB9KVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGNsYXNzZXM6IFtcImN1cnNvci1wb2ludGVyXCIsIFwiY2FwaXRhbGl6ZVwiLCBcInBsLXZwYWQtbVwiLCBcInByLXZwYWQtbVwiXSxcblx0XHRcdFx0XHR9IHNhdGlzZmllcyBSYWRpb0dyb3VwQXR0cnM8UmVwZWF0UGVyaW9kPiksXG5cdFx0XHRcdF0sXG5cdFx0XHQpLFxuXHRcdF0pXG5cdH1cblxuXHRwcml2YXRlIGJ1aWxkSW5qZWN0aW9ucyhhdHRyczogUmVwZWF0UnVsZUVkaXRvckF0dHJzKSB7XG5cdFx0Y29uc3QgaW5qZWN0aW9uTWFwID0gbmV3IE1hcDxzdHJpbmcsIENoaWxkPigpXG5cdFx0aW5qZWN0aW9uTWFwLnNldChFbmRUeXBlLkNvdW50LCB0aGlzLnJlbmRlckVuZHNQaWNrZXIoYXR0cnMpKVxuXG5cdFx0aW5qZWN0aW9uTWFwLnNldChcblx0XHRcdEVuZFR5cGUuVW50aWxEYXRlLFxuXHRcdFx0bShEYXRlUGlja2VyLCB7XG5cdFx0XHRcdGRhdGU6IGF0dHJzLm1vZGVsLnJlcGVhdEVuZERhdGVGb3JEaXNwbGF5LFxuXHRcdFx0XHRvbkRhdGVTZWxlY3RlZDogKGRhdGUpID0+IGRhdGUgJiYgKGF0dHJzLm1vZGVsLnJlcGVhdEVuZERhdGVGb3JEaXNwbGF5ID0gZGF0ZSksXG5cdFx0XHRcdGxhYmVsOiBcImVuZERhdGVfbGFiZWxcIixcblx0XHRcdFx0dXNlSW5wdXRCdXR0b246IHRydWUsXG5cdFx0XHRcdHN0YXJ0T2ZUaGVXZWVrT2Zmc2V0OiBhdHRycy5zdGFydE9mVGhlV2Vla09mZnNldCxcblx0XHRcdFx0cG9zaXRpb246IFBpY2tlclBvc2l0aW9uLlRPUCxcblx0XHRcdFx0Y2xhc3NlczogW1wiZnVsbC13aWR0aFwiLCBcImZsZXgtZ3Jvd1wiLCBhdHRycy5tb2RlbC5yZXBlYXRFbmRUeXBlICE9PSBFbmRUeXBlLlVudGlsRGF0ZSA/IFwiZGlzYWJsZWRcIiA6IFwiXCJdLFxuXHRcdFx0fSBzYXRpc2ZpZXMgRGF0ZVBpY2tlckF0dHJzKSxcblx0XHQpXG5cblx0XHRyZXR1cm4gaW5qZWN0aW9uTWFwXG5cdH1cblxuXHRwcml2YXRlIHVwZGF0ZUN1c3RvbVJ1bGUod2hlbk1vZGVsOiBDYWxlbmRhckV2ZW50V2hlbk1vZGVsLCBjdXN0b21SdWxlOiBQYXJ0aWFsPHsgaW50ZXJ2YWw6IG51bWJlcjsgaW50ZXJ2YWxGcmVxdWVuY3k6IFJlcGVhdFBlcmlvZCB9Pikge1xuXHRcdGNvbnN0IHsgaW50ZXJ2YWwsIGludGVydmFsRnJlcXVlbmN5IH0gPSBjdXN0b21SdWxlXG5cblx0XHRpZiAoaW50ZXJ2YWwgJiYgIWlzTmFOKGludGVydmFsKSkge1xuXHRcdFx0d2hlbk1vZGVsLnJlcGVhdEludGVydmFsID0gaW50ZXJ2YWxcblx0XHR9XG5cblx0XHRpZiAoaW50ZXJ2YWxGcmVxdWVuY3kpIHtcblx0XHRcdHdoZW5Nb2RlbC5yZXBlYXRQZXJpb2QgPSBpbnRlcnZhbEZyZXF1ZW5jeVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVySW50ZXJ2YWxQaWNrZXIoYXR0cnM6IFJlcGVhdFJ1bGVFZGl0b3JBdHRycyk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShTZWxlY3Q8SW50ZXJ2YWxPcHRpb24sIG51bWJlcj4sIHtcblx0XHRcdG9uY2hhbmdlOiAobmV3VmFsdWUpID0+IHtcblx0XHRcdFx0aWYgKHRoaXMucmVwZWF0SW50ZXJ2YWwgPT09IG5ld1ZhbHVlLnZhbHVlKSB7XG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLnJlcGVhdEludGVydmFsID0gbmV3VmFsdWUudmFsdWVcblx0XHRcdFx0dGhpcy51cGRhdGVDdXN0b21SdWxlKGF0dHJzLm1vZGVsLCB7IGludGVydmFsOiB0aGlzLnJlcGVhdEludGVydmFsIH0pXG5cdFx0XHRcdG0ucmVkcmF3LnN5bmMoKVxuXHRcdFx0fSxcblx0XHRcdG9uY2xvc2U6ICgpID0+IHtcblx0XHRcdFx0dGhpcy5pbnRlcnZhbEV4cGFuZGVkID0gZmFsc2Vcblx0XHRcdFx0dGhpcy5pbnRlcnZhbE9wdGlvbnModGhpcy5udW1iZXJWYWx1ZXMpXG5cdFx0XHR9LFxuXHRcdFx0c2VsZWN0ZWQ6IHsgdmFsdWU6IHRoaXMucmVwZWF0SW50ZXJ2YWwsIG5hbWU6IHRoaXMucmVwZWF0SW50ZXJ2YWwudG9TdHJpbmcoKSwgYXJpYVZhbHVlOiB0aGlzLnJlcGVhdEludGVydmFsLnRvU3RyaW5nKCkgfSxcblx0XHRcdGFyaWFMYWJlbDogbGFuZy5nZXQoXCJyZXBlYXRzRXZlcnlfbGFiZWxcIiksXG5cdFx0XHRvcHRpb25zOiB0aGlzLmludGVydmFsT3B0aW9ucyxcblx0XHRcdG5vSWNvbjogdHJ1ZSxcblx0XHRcdGV4cGFuZGVkOiB0cnVlLFxuXHRcdFx0dGFiSW5kZXg6IGlzQXBwKCkgPyBOdW1iZXIoVGFiSW5kZXguRGVmYXVsdCkgOiBOdW1iZXIoVGFiSW5kZXguUHJvZ3JhbW1hdGljKSxcblx0XHRcdGNsYXNzZXM6IFtcIm5vLWFwcGVhcmFuY2VcIl0sXG5cdFx0XHRyZW5kZXJEaXNwbGF5OiAoKSA9PlxuXHRcdFx0XHRtKFNpbmdsZUxpbmVUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRjbGFzc2VzOiBbXCJib3JkZXItcmFkaXVzLWJvdHRvbS0wXCJdLFxuXHRcdFx0XHRcdHZhbHVlOiBpc05hTih0aGlzLnJlcGVhdEludGVydmFsKSA/IFwiXCIgOiB0aGlzLnJlcGVhdEludGVydmFsLnRvU3RyaW5nKCksXG5cdFx0XHRcdFx0aW5wdXRNb2RlOiBpc0FwcCgpID8gSW5wdXRNb2RlLk5PTkUgOiBJbnB1dE1vZGUuVEVYVCxcblx0XHRcdFx0XHRyZWFkb25seTogaXNBcHAoKSxcblx0XHRcdFx0XHRvbmlucHV0OiAodmFsOiBzdHJpbmcpID0+IHtcblx0XHRcdFx0XHRcdGlmICh2YWwgIT09IFwiXCIgJiYgdGhpcy5yZXBlYXRJbnRlcnZhbCA9PT0gTnVtYmVyKHZhbCkpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHRoaXMucmVwZWF0SW50ZXJ2YWwgPSB2YWwgPT09IFwiXCIgPyBOYU4gOiBOdW1iZXIodmFsKVxuXHRcdFx0XHRcdFx0aWYgKCFpc05hTih0aGlzLnJlcGVhdEludGVydmFsKSkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmludGVydmFsT3B0aW9ucyh0aGlzLm51bWJlclZhbHVlcy5maWx0ZXIoKG9wdCkgPT4gb3B0LnZhbHVlLnRvU3RyaW5nKCkuc3RhcnRzV2l0aCh2YWwpKSlcblx0XHRcdFx0XHRcdFx0dGhpcy51cGRhdGVDdXN0b21SdWxlKGF0dHJzLm1vZGVsLCB7IGludGVydmFsOiB0aGlzLnJlcGVhdEludGVydmFsIH0pXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmludGVydmFsT3B0aW9ucyh0aGlzLm51bWJlclZhbHVlcylcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGFyaWFMYWJlbDogbGFuZy5nZXQoXCJyZXBlYXRzRXZlcnlfbGFiZWxcIiksXG5cdFx0XHRcdFx0b25jbGljazogKGU6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdFx0XHRcdGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcblx0XHRcdFx0XHRcdGlmICghdGhpcy5pbnRlcnZhbEV4cGFuZGVkKSB7XG5cdFx0XHRcdFx0XHRcdDsoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLnBhcmVudEVsZW1lbnQ/LmNsaWNrKClcblx0XHRcdFx0XHRcdFx0dGhpcy5pbnRlcnZhbEV4cGFuZGVkID0gdHJ1ZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0b25mb2N1czogKGV2ZW50OiBGb2N1c0V2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoIXRoaXMuaW50ZXJ2YWxFeHBhbmRlZCkge1xuXHRcdFx0XHRcdFx0XHQ7KGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCkucGFyZW50RWxlbWVudD8uY2xpY2soKVxuXHRcdFx0XHRcdFx0XHR0aGlzLmludGVydmFsRXhwYW5kZWQgPSB0cnVlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvbmJsdXI6IChldmVudDogRm9jdXNFdmVudCkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKGlzTmFOKHRoaXMucmVwZWF0SW50ZXJ2YWwpKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMucmVwZWF0SW50ZXJ2YWwgPSB0aGlzLm51bWJlclZhbHVlc1swXS52YWx1ZVxuXHRcdFx0XHRcdFx0XHR0aGlzLnVwZGF0ZUN1c3RvbVJ1bGUoYXR0cnMubW9kZWwsIHsgaW50ZXJ2YWw6IHRoaXMucmVwZWF0SW50ZXJ2YWwgfSlcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAodGhpcy5yZXBlYXRJbnRlcnZhbCA9PT0gMCkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnJlcGVhdEludGVydmFsID0gdGhpcy5udW1iZXJWYWx1ZXNbMF0udmFsdWVcblx0XHRcdFx0XHRcdFx0dGhpcy51cGRhdGVDdXN0b21SdWxlKGF0dHJzLm1vZGVsLCB7IGludGVydmFsOiB0aGlzLnJlcGVhdEludGVydmFsIH0pXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0dGV4dEFsaWduOiBcImNlbnRlclwiLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0bWF4OiAyNTYsXG5cdFx0XHRcdFx0bWluOiAxLFxuXHRcdFx0XHRcdHR5cGU6IFRleHRGaWVsZFR5cGUuTnVtYmVyLFxuXHRcdFx0XHR9KSxcblx0XHRcdHJlbmRlck9wdGlvbjogKG9wdGlvbikgPT5cblx0XHRcdFx0bShcblx0XHRcdFx0XHRcImJ1dHRvbi5pdGVtcy1jZW50ZXIuZmxleC1ncm93XCIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y2xhc3M6IFwic3RhdGUtYmcgYnV0dG9uLWNvbnRlbnQgZHJvcGRvd24tYnV0dG9uIHB0LXMgcGItcyBidXR0b24tbWluLWhlaWdodFwiLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0b3B0aW9uLm5hbWUsXG5cdFx0XHRcdCksXG5cdFx0XHRrZWVwRm9jdXM6IHRydWUsXG5cdFx0fSBzYXRpc2ZpZXMgU2VsZWN0QXR0cmlidXRlczxJbnRlcnZhbE9wdGlvbiwgbnVtYmVyPilcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRW5kc1BpY2tlcihhdHRyczogUmVwZWF0UnVsZUVkaXRvckF0dHJzKTogQ2hpbGQge1xuXHRcdHJldHVybiBtKFNlbGVjdDxJbnRlcnZhbE9wdGlvbiwgbnVtYmVyPiwge1xuXHRcdFx0b25jaGFuZ2U6IChuZXdWYWx1ZSkgPT4ge1xuXHRcdFx0XHRpZiAodGhpcy5yZXBlYXRPY2N1cnJlbmNlcyA9PT0gbmV3VmFsdWUudmFsdWUpIHtcblx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMucmVwZWF0T2NjdXJyZW5jZXMgPSBuZXdWYWx1ZS52YWx1ZVxuXHRcdFx0XHRhdHRycy5tb2RlbC5yZXBlYXRFbmRPY2N1cnJlbmNlcyA9IG5ld1ZhbHVlLnZhbHVlXG5cdFx0XHR9LFxuXHRcdFx0b25jbG9zZTogKCkgPT4ge1xuXHRcdFx0XHR0aGlzLm9jY3VycmVuY2VzRXhwYW5kZWQgPSBmYWxzZVxuXHRcdFx0XHR0aGlzLm9jY3VycmVuY2VzT3B0aW9ucyh0aGlzLm51bWJlclZhbHVlcylcblx0XHRcdH0sXG5cdFx0XHRzZWxlY3RlZDogeyB2YWx1ZTogdGhpcy5yZXBlYXRPY2N1cnJlbmNlcywgbmFtZTogdGhpcy5yZXBlYXRPY2N1cnJlbmNlcy50b1N0cmluZygpLCBhcmlhVmFsdWU6IHRoaXMucmVwZWF0T2NjdXJyZW5jZXMudG9TdHJpbmcoKSB9LFxuXHRcdFx0YXJpYUxhYmVsOiBsYW5nLmdldChcIm9jY3VycmVuY2VzQ291bnRfbGFiZWxcIiksXG5cdFx0XHRvcHRpb25zOiB0aGlzLm9jY3VycmVuY2VzT3B0aW9ucyxcblx0XHRcdG5vSWNvbjogdHJ1ZSxcblx0XHRcdGV4cGFuZGVkOiB0cnVlLFxuXHRcdFx0dGFiSW5kZXg6IGlzQXBwKCkgPyBOdW1iZXIoVGFiSW5kZXguRGVmYXVsdCkgOiBOdW1iZXIoVGFiSW5kZXguUHJvZ3JhbW1hdGljKSxcblx0XHRcdGNsYXNzZXM6IFtcIm5vLWFwcGVhcmFuY2VcIl0sXG5cdFx0XHRyZW5kZXJEaXNwbGF5OiAoKSA9PlxuXHRcdFx0XHRtKFNpbmdsZUxpbmVUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRjbGFzc2VzOiBbXCJ0dXRhdWktYnV0dG9uLW91dGxpbmVcIiwgXCJ0ZXh0LWNlbnRlclwiLCBcImJvcmRlci1jb250ZW50LW1lc3NhZ2UtYmdcIl0sXG5cdFx0XHRcdFx0dmFsdWU6IGlzTmFOKHRoaXMucmVwZWF0T2NjdXJyZW5jZXMpID8gXCJcIiA6IHRoaXMucmVwZWF0T2NjdXJyZW5jZXMudG9TdHJpbmcoKSxcblx0XHRcdFx0XHRpbnB1dE1vZGU6IGlzQXBwKCkgPyBJbnB1dE1vZGUuTk9ORSA6IElucHV0TW9kZS5URVhULFxuXHRcdFx0XHRcdHJlYWRvbmx5OiBpc0FwcCgpLFxuXHRcdFx0XHRcdG9uaW5wdXQ6ICh2YWw6IHN0cmluZykgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKHZhbCAhPT0gXCJcIiAmJiB0aGlzLnJlcGVhdE9jY3VycmVuY2VzID09PSBOdW1iZXIodmFsKSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0dGhpcy5yZXBlYXRPY2N1cnJlbmNlcyA9IHZhbCA9PT0gXCJcIiA/IE5hTiA6IE51bWJlcih2YWwpXG5cblx0XHRcdFx0XHRcdGlmICghaXNOYU4odGhpcy5yZXBlYXRPY2N1cnJlbmNlcykpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5vY2N1cnJlbmNlc09wdGlvbnModGhpcy5udW1iZXJWYWx1ZXMuZmlsdGVyKChvcHQpID0+IG9wdC52YWx1ZS50b1N0cmluZygpLnN0YXJ0c1dpdGgodmFsKSkpXG5cdFx0XHRcdFx0XHRcdGF0dHJzLm1vZGVsLnJlcGVhdEVuZE9jY3VycmVuY2VzID0gdGhpcy5yZXBlYXRPY2N1cnJlbmNlc1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5vY2N1cnJlbmNlc09wdGlvbnModGhpcy5udW1iZXJWYWx1ZXMpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRhcmlhTGFiZWw6IGxhbmcuZ2V0KFwib2NjdXJyZW5jZXNDb3VudF9sYWJlbFwiKSxcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0dGV4dEFsaWduOiBcImNlbnRlclwiLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0b25jbGljazogKGU6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdFx0XHRcdGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcblx0XHRcdFx0XHRcdGlmICghdGhpcy5vY2N1cnJlbmNlc0V4cGFuZGVkKSB7XG5cdFx0XHRcdFx0XHRcdDsoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLnBhcmVudEVsZW1lbnQ/LmNsaWNrKClcblx0XHRcdFx0XHRcdFx0dGhpcy5vY2N1cnJlbmNlc0V4cGFuZGVkID0gdHJ1ZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0b25mb2N1czogKGV2ZW50OiBGb2N1c0V2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoIXRoaXMub2NjdXJyZW5jZXNFeHBhbmRlZCkge1xuXHRcdFx0XHRcdFx0XHQ7KGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCkucGFyZW50RWxlbWVudD8uY2xpY2soKVxuXHRcdFx0XHRcdFx0XHR0aGlzLm9jY3VycmVuY2VzRXhwYW5kZWQgPSB0cnVlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvbmJsdXI6IChldmVudDogRm9jdXNFdmVudCkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKGlzTmFOKHRoaXMucmVwZWF0T2NjdXJyZW5jZXMpKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMucmVwZWF0T2NjdXJyZW5jZXMgPSB0aGlzLm51bWJlclZhbHVlc1swXS52YWx1ZVxuXHRcdFx0XHRcdFx0XHRhdHRycy5tb2RlbC5yZXBlYXRFbmRPY2N1cnJlbmNlcyA9IHRoaXMucmVwZWF0T2NjdXJyZW5jZXNcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAodGhpcy5yZXBlYXRPY2N1cnJlbmNlcyA9PT0gMCkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnJlcGVhdE9jY3VycmVuY2VzID0gdGhpcy5udW1iZXJWYWx1ZXNbMF0udmFsdWVcblx0XHRcdFx0XHRcdFx0YXR0cnMubW9kZWwucmVwZWF0RW5kT2NjdXJyZW5jZXMgPSB0aGlzLnJlcGVhdE9jY3VycmVuY2VzXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRtYXg6IDI1Nixcblx0XHRcdFx0XHRtaW46IDEsXG5cdFx0XHRcdFx0dHlwZTogVGV4dEZpZWxkVHlwZS5OdW1iZXIsXG5cdFx0XHRcdH0pLFxuXHRcdFx0cmVuZGVyT3B0aW9uOiAob3B0aW9uKSA9PlxuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiYnV0dG9uLml0ZW1zLWNlbnRlci5mbGV4LWdyb3dcIixcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjbGFzczogXCJzdGF0ZS1iZyBidXR0b24tY29udGVudCBkcm9wZG93bi1idXR0b24gcHQtcyBwYi1zIGJ1dHRvbi1taW4taGVpZ2h0XCIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvcHRpb24ubmFtZSxcblx0XHRcdFx0KSxcblx0XHRcdGtlZXBGb2N1czogdHJ1ZSxcblx0XHR9IHNhdGlzZmllcyBTZWxlY3RBdHRyaWJ1dGVzPEludGVydmFsT3B0aW9uLCBudW1iZXI+KVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSwgVm5vZGVET00gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBBdHRlbmRlZUxpc3RFZGl0b3IgfSBmcm9tIFwiLi9BdHRlbmRlZUxpc3RFZGl0b3IuanNcIlxuaW1wb3J0IHsgbG9jYXRvciB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBFdmVudFRpbWVFZGl0b3IsIEV2ZW50VGltZUVkaXRvckF0dHJzIH0gZnJvbSBcIi4vRXZlbnRUaW1lRWRpdG9yLmpzXCJcbmltcG9ydCB7IGRlZmF1bHRDYWxlbmRhckNvbG9yLCBUYWJJbmRleCwgVGltZUZvcm1hdCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBsYW5nLCBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBSZWNpcGllbnRzU2VhcmNoTW9kZWwgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvUmVjaXBpZW50c1NlYXJjaE1vZGVsLmpzXCJcbmltcG9ydCB7IENhbGVuZGFySW5mbyB9IGZyb20gXCIuLi8uLi9tb2RlbC9DYWxlbmRhck1vZGVsLmpzXCJcbmltcG9ydCB7IEFsYXJtSW50ZXJ2YWwgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlscy5qc1wiXG5pbXBvcnQgeyBIdG1sRWRpdG9yIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvZWRpdG9yL0h0bWxFZGl0b3IuanNcIlxuaW1wb3J0IHsgQmFubmVyVHlwZSwgSW5mb0Jhbm5lciwgSW5mb0Jhbm5lckF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JbmZvQmFubmVyLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyRXZlbnRNb2RlbCwgQ2FsZW5kYXJPcGVyYXRpb24sIFJlYWRvbmx5UmVhc29uIH0gZnJvbSBcIi4uL2V2ZW50ZWRpdG9yLW1vZGVsL0NhbGVuZGFyRXZlbnRNb2RlbC5qc1wiXG5pbXBvcnQgeyBnZXRTaGFyZWRHcm91cE5hbWUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL3NoYXJpbmcvR3JvdXBVdGlscy5qc1wiXG5pbXBvcnQgeyBSZW1pbmRlcnNFZGl0b3IsIFJlbWluZGVyc0VkaXRvckF0dHJzIH0gZnJvbSBcIi4uL1JlbWluZGVyc0VkaXRvci5qc1wiXG5pbXBvcnQgeyBTaW5nbGVMaW5lVGV4dEZpZWxkIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9TaW5nbGVMaW5lVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB7IHB4LCBzaXplIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvc2l6ZS5qc1wiXG5pbXBvcnQgeyBDYXJkIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9DYXJkLmpzXCJcbmltcG9ydCB7IFNlbGVjdCwgU2VsZWN0QXR0cmlidXRlcywgU2VsZWN0T3B0aW9uIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9TZWxlY3QuanNcIlxuaW1wb3J0IHsgSWNvbiwgSWNvblNpemUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb24uanNcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS90aGVtZS5qc1wiXG5pbXBvcnQgeyBkZWVwRXF1YWwgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IEJ1dHRvbkNvbG9yLCBnZXRDb2xvcnMgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBSZXBlYXRSdWxlRWRpdG9yLCBSZXBlYXRSdWxlRWRpdG9yQXR0cnMgfSBmcm9tIFwiLi9SZXBlYXRSdWxlRWRpdG9yLmpzXCJcbmltcG9ydCB0eXBlIHsgQ2FsZW5kYXJSZXBlYXRSdWxlIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgZm9ybWF0UmVwZXRpdGlvbkVuZCwgZm9ybWF0UmVwZXRpdGlvbkZyZXF1ZW5jeSB9IGZyb20gXCIuLi9ldmVudHBvcHVwL0V2ZW50UHJldmlld1ZpZXcuanNcIlxuaW1wb3J0IHsgVGV4dEZpZWxkVHlwZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB7IERlZmF1bHRBbmltYXRpb25UaW1lIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYW5pbWF0aW9uL0FuaW1hdGlvbnMuanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0ljb25zLmpzXCJcblxuZXhwb3J0IHR5cGUgQ2FsZW5kYXJFdmVudEVkaXRWaWV3QXR0cnMgPSB7XG5cdG1vZGVsOiBDYWxlbmRhckV2ZW50TW9kZWxcblx0Z3JvdXBDb2xvcnM6IE1hcDxJZCwgc3RyaW5nPlxuXHRyZWNpcGllbnRzU2VhcmNoOiBSZWNpcGllbnRzU2VhcmNoTW9kZWxcblx0ZGVzY3JpcHRpb25FZGl0b3I6IEh0bWxFZGl0b3Jcblx0c3RhcnRPZlRoZVdlZWtPZmZzZXQ6IG51bWJlclxuXHR0aW1lRm9ybWF0OiBUaW1lRm9ybWF0XG5cdGRlZmF1bHRBbGFybXM6IE1hcDxJZCwgQWxhcm1JbnRlcnZhbFtdPlxuXHRuYXZpZ2F0aW9uQ2FsbGJhY2s6ICh0YXJnZXRQYWdlOiBFZGl0b3JQYWdlcywgY2FsbEJhY2s/OiAoLi4uYXJnczogYW55KSA9PiB1bmtub3duKSA9PiB1bmtub3duXG5cdGN1cnJlbnRQYWdlOiBzdHJlYW08RWRpdG9yUGFnZXM+XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2FsZW5kYXJTZWxlY3RJdGVtIGV4dGVuZHMgU2VsZWN0T3B0aW9uPENhbGVuZGFySW5mbz4ge1xuXHRjb2xvcjogc3RyaW5nXG5cdG5hbWU6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9yZ2FuaXplclNlbGVjdEl0ZW0gZXh0ZW5kcyBTZWxlY3RPcHRpb248c3RyaW5nPiB7XG5cdG5hbWU6IHN0cmluZ1xuXHRhZGRyZXNzOiBzdHJpbmdcbn1cblxuZXhwb3J0IGVudW0gRWRpdG9yUGFnZXMge1xuXHRNQUlOLFxuXHRSRVBFQVRfUlVMRVMsXG5cdEdVRVNUUyxcbn1cblxuLyoqXG4gKiBjb21iaW5lcyBzZXZlcmFsIHNlbWktcmVsYXRlZCBlZGl0b3IgY29tcG9uZW50cyBpbnRvIGEgZnVsbCBlZGl0b3IgZm9yIGVkaXRpbmcgY2FsZW5kYXIgZXZlbnRzXG4gKiB0byBiZSBkaXNwbGF5ZWQgaW4gYSBkaWFsb2cuXG4gKlxuICogY29udHJvbHMgdGhlIGVuYWJsaW5nL2Rpc2FibGluZyBvZiBjZXJ0YWluIGVkaXRvciBjb21wb25lbnRzIGFuZCB0aGUgZGlzcGxheSBvZiBhZGRpdGlvbmFsIGluZm9cbiAqIGluIHRoZSBkaWFsb2cgZGVwZW5kaW5nIG9uIHRoZSB0eXBlIG9mIHRoZSBldmVudCBiZWluZyBlZGl0ZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDYWxlbmRhckV2ZW50RWRpdFZpZXcgaW1wbGVtZW50cyBDb21wb25lbnQ8Q2FsZW5kYXJFdmVudEVkaXRWaWV3QXR0cnM+IHtcblx0cHJpdmF0ZSByZWFkb25seSB0aW1lRm9ybWF0OiBUaW1lRm9ybWF0XG5cdHByaXZhdGUgcmVhZG9ubHkgc3RhcnRPZlRoZVdlZWtPZmZzZXQ6IG51bWJlclxuXHRwcml2YXRlIHJlYWRvbmx5IGRlZmF1bHRBbGFybXM6IE1hcDxJZCwgQWxhcm1JbnRlcnZhbFtdPlxuXG5cdHByaXZhdGUgdHJhbnNpdGlvblBhZ2U6IEVkaXRvclBhZ2VzIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBoYXNBbmltYXRpb25FbmRlZCA9IHRydWVcblx0cHJpdmF0ZSBwYWdlczogTWFwPEVkaXRvclBhZ2VzLCAoLi4uYXJnczogYW55KSA9PiBDaGlsZHJlbj4gPSBuZXcgTWFwKClcblx0cHJpdmF0ZSBwYWdlc1dyYXBwZXJEb21FbGVtZW50ITogSFRNTEVsZW1lbnRcblx0cHJpdmF0ZSBhbGxvd1JlbmRlck1haW5QYWdlOiBzdHJlYW08Ym9vbGVhbj4gPSBzdHJlYW0odHJ1ZSlcblx0cHJpdmF0ZSBkaWFsb2dIZWlnaHQ6IG51bWJlciB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgcGFnZVdpZHRoOiBudW1iZXIgPSAtMVxuXHRwcml2YXRlIHRyYW5zbGF0ZSA9IDBcblxuXHRjb25zdHJ1Y3Rvcih2bm9kZTogVm5vZGU8Q2FsZW5kYXJFdmVudEVkaXRWaWV3QXR0cnM+KSB7XG5cdFx0dGhpcy50aW1lRm9ybWF0ID0gdm5vZGUuYXR0cnMudGltZUZvcm1hdFxuXHRcdHRoaXMuc3RhcnRPZlRoZVdlZWtPZmZzZXQgPSB2bm9kZS5hdHRycy5zdGFydE9mVGhlV2Vla09mZnNldFxuXHRcdHRoaXMuZGVmYXVsdEFsYXJtcyA9IHZub2RlLmF0dHJzLmRlZmF1bHRBbGFybXNcblxuXHRcdGlmICh2bm9kZS5hdHRycy5tb2RlbC5vcGVyYXRpb24gPT0gQ2FsZW5kYXJPcGVyYXRpb24uQ3JlYXRlKSB7XG5cdFx0XHRjb25zdCBpbml0aWFsQWxhcm1zID0gdm5vZGUuYXR0cnMuZGVmYXVsdEFsYXJtcy5nZXQodm5vZGUuYXR0cnMubW9kZWwuZWRpdE1vZGVscy53aG9Nb2RlbC5zZWxlY3RlZENhbGVuZGFyLmdyb3VwLl9pZCkgPz8gW11cblx0XHRcdHZub2RlLmF0dHJzLm1vZGVsLmVkaXRNb2RlbHMuYWxhcm1Nb2RlbC5hZGRBbGwoaW5pdGlhbEFsYXJtcylcblx0XHR9XG5cblx0XHR0aGlzLnBhZ2VzLnNldChFZGl0b3JQYWdlcy5SRVBFQVRfUlVMRVMsIHRoaXMucmVuZGVyUmVwZWF0UnVsZXNQYWdlKVxuXHRcdHRoaXMucGFnZXMuc2V0KEVkaXRvclBhZ2VzLkdVRVNUUywgdGhpcy5yZW5kZXJHdWVzdHNQYWdlKVxuXG5cdFx0dm5vZGUuYXR0cnMuY3VycmVudFBhZ2UubWFwKChwYWdlKSA9PiB7XG5cdFx0XHR0aGlzLmhhc0FuaW1hdGlvbkVuZGVkID0gZmFsc2VcblxuXHRcdFx0aWYgKHBhZ2UgPT09IEVkaXRvclBhZ2VzLk1BSU4pIHtcblx0XHRcdFx0dGhpcy5hbGxvd1JlbmRlck1haW5QYWdlKHRydWUpXG5cdFx0XHRcdHRoaXMudHJhbnNsYXRlID0gMFxuXHRcdFx0fVxuXHRcdH0pXG5cblx0XHR0aGlzLmFsbG93UmVuZGVyTWFpblBhZ2UubWFwKChhbGxvd1JlbmRlcmluZykgPT4ge1xuXHRcdFx0cmV0dXJuIHRoaXMuaGFuZGxlRWRpdG9yU3RhdHVzKGFsbG93UmVuZGVyaW5nLCB2bm9kZSlcblx0XHR9KVxuXHR9XG5cblx0b25yZW1vdmUodm5vZGU6IFZub2RlPENhbGVuZGFyRXZlbnRFZGl0Vmlld0F0dHJzPikge1xuXHRcdHZub2RlLmF0dHJzLmN1cnJlbnRQYWdlLmVuZCh0cnVlKVxuXHRcdHRoaXMuYWxsb3dSZW5kZXJNYWluUGFnZS5lbmQodHJ1ZSlcblx0fVxuXG5cdHByaXZhdGUgaGFuZGxlRWRpdG9yU3RhdHVzKGFsbG93UmVuZGVyaW5nOiBib29sZWFuLCB2bm9kZTogVm5vZGU8Q2FsZW5kYXJFdmVudEVkaXRWaWV3QXR0cnM+KSB7XG5cdFx0aWYgKGFsbG93UmVuZGVyaW5nICYmIHZub2RlLmF0dHJzLmN1cnJlbnRQYWdlKCkgPT09IEVkaXRvclBhZ2VzLk1BSU4pIHtcblx0XHRcdGlmICh2bm9kZS5hdHRycy5kZXNjcmlwdGlvbkVkaXRvci5lZGl0b3IuZG9tRWxlbWVudCkge1xuXHRcdFx0XHR2bm9kZS5hdHRycy5kZXNjcmlwdGlvbkVkaXRvci5lZGl0b3IuZG9tRWxlbWVudC50YWJJbmRleCA9IE51bWJlcihUYWJJbmRleC5EZWZhdWx0KVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHZub2RlLmF0dHJzLmRlc2NyaXB0aW9uRWRpdG9yLnNldEVuYWJsZWQodHJ1ZSlcblx0XHR9XG5cdFx0aWYgKHZub2RlLmF0dHJzLmRlc2NyaXB0aW9uRWRpdG9yLmVkaXRvci5kb21FbGVtZW50KSB7XG5cdFx0XHR2bm9kZS5hdHRycy5kZXNjcmlwdGlvbkVkaXRvci5lZGl0b3IuZG9tRWxlbWVudC50YWJJbmRleCA9IE51bWJlcihUYWJJbmRleC5Qcm9ncmFtbWF0aWMpXG5cdFx0fVxuXHRcdHZub2RlLmF0dHJzLmRlc2NyaXB0aW9uRWRpdG9yLnNldEVuYWJsZWQoZmFsc2UpXG5cdH1cblxuXHRvbmNyZWF0ZSh2bm9kZTogVm5vZGVET008Q2FsZW5kYXJFdmVudEVkaXRWaWV3QXR0cnM+KTogYW55IHtcblx0XHR0aGlzLnBhZ2VzV3JhcHBlckRvbUVsZW1lbnQgPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblxuXHRcdHRoaXMucGFnZXNXcmFwcGVyRG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCAoKSA9PiB7XG5cdFx0XHRpZiAodm5vZGUuYXR0cnMuY3VycmVudFBhZ2UoKSAhPT0gRWRpdG9yUGFnZXMuTUFJTikge1xuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0XHR0aGlzLmFsbG93UmVuZGVyTWFpblBhZ2UoZmFsc2UpXG5cdFx0XHRcdH0sIERlZmF1bHRBbmltYXRpb25UaW1lKVxuXHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnRyYW5zaXRpb25QYWdlID0gdm5vZGUuYXR0cnMuY3VycmVudFBhZ2UoKVxuXHRcdFx0dGhpcy5oYXNBbmltYXRpb25FbmRlZCA9IHRydWVcblxuXHRcdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdHRoaXMuYWxsb3dSZW5kZXJNYWluUGFnZSh0cnVlKVxuXHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHR9LCBEZWZhdWx0QW5pbWF0aW9uVGltZSlcblx0XHR9KVxuXHR9XG5cblx0b251cGRhdGUodm5vZGU6IFZub2RlRE9NPENhbGVuZGFyRXZlbnRFZGl0Vmlld0F0dHJzPik6IGFueSB7XG5cdFx0Y29uc3QgZG9tID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50XG5cdFx0aWYgKHRoaXMuZGlhbG9nSGVpZ2h0ID09IG51bGwgJiYgZG9tLnBhcmVudEVsZW1lbnQpIHtcblx0XHRcdHRoaXMuZGlhbG9nSGVpZ2h0ID0gZG9tLnBhcmVudEVsZW1lbnQuY2xpZW50SGVpZ2h0XG5cdFx0XHQ7KHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudCkuc3R5bGUuaGVpZ2h0ID0gcHgodGhpcy5kaWFsb2dIZWlnaHQpXG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMucGFnZVdpZHRoID09IC0xICYmIGRvbS5wYXJlbnRFbGVtZW50KSB7XG5cdFx0XHR0aGlzLnBhZ2VXaWR0aCA9IGRvbS5wYXJlbnRFbGVtZW50LmNsaWVudFdpZHRoIC0gc2l6ZS5ocGFkX2xhcmdlICogMlxuXHRcdFx0Ly8gVHdpY2UgdGhlIHBhZ2Ugd2lkdGggKE1haW4gUGFnZSArIEd1ZXN0cy9SZXBlYXQpIHBsdXMgdGhlIGdhcCBiZXR3ZWVuIHBhZ2VzICg2NHB4KVxuXHRcdFx0Oyh2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQpLnN0eWxlLndpZHRoID0gcHgodGhpcy5wYWdlV2lkdGggKiAyICsgc2l6ZS52cGFkX3h4bClcblx0XHRcdG0ucmVkcmF3KClcblx0XHR9XG5cdH1cblxuXHR2aWV3KHZub2RlOiBWbm9kZTxDYWxlbmRhckV2ZW50RWRpdFZpZXdBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5mbGV4LmdhcC12cGFkLXh4bC5maXQtY29udGVudC50cmFuc2l0aW9uLXRyYW5zZm9ybVwiLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdHRyYW5zZm9ybTogYHRyYW5zbGF0ZVgoJHt0aGlzLnRyYW5zbGF0ZX1weClgLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdFt0aGlzLnJlbmRlck1haW5QYWdlKHZub2RlKSwgdGhpcy5yZW5kZXJQYWdlKHZub2RlKV0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJQYWdlKHZub2RlOiBWbm9kZTxDYWxlbmRhckV2ZW50RWRpdFZpZXdBdHRycz4pIHtcblx0XHRpZiAodGhpcy5oYXNBbmltYXRpb25FbmRlZCB8fCB0aGlzLnRyYW5zaXRpb25QYWdlID09IG51bGwpIHtcblx0XHRcdHJldHVybiB0aGlzLnBhZ2VzLmdldCh2bm9kZS5hdHRycy5jdXJyZW50UGFnZSgpKT8uYXBwbHkodGhpcywgW3Zub2RlXSlcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5wYWdlcy5nZXQodGhpcy50cmFuc2l0aW9uUGFnZSk/LmFwcGx5KHRoaXMsIFt2bm9kZV0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckd1ZXN0c1BhZ2UoeyBhdHRyczogeyBtb2RlbCwgcmVjaXBpZW50c1NlYXJjaCB9IH06IFZub2RlPENhbGVuZGFyRXZlbnRFZGl0Vmlld0F0dHJzPikge1xuXHRcdHJldHVybiBtKEF0dGVuZGVlTGlzdEVkaXRvciwge1xuXHRcdFx0cmVjaXBpZW50c1NlYXJjaCxcblx0XHRcdGxvZ2luczogbG9jYXRvci5sb2dpbnMsXG5cdFx0XHRtb2RlbCxcblx0XHRcdHdpZHRoOiB0aGlzLnBhZ2VXaWR0aCxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJUaXRsZShhdHRyczogQ2FsZW5kYXJFdmVudEVkaXRWaWV3QXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgeyBtb2RlbCB9ID0gYXR0cnNcblx0XHRyZXR1cm4gbShcblx0XHRcdENhcmQsXG5cdFx0XHR7XG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0cGFkZGluZzogXCIwXCIsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0bShTaW5nbGVMaW5lVGV4dEZpZWxkLCB7XG5cdFx0XHRcdHZhbHVlOiBtb2RlbC5lZGl0TW9kZWxzLnN1bW1hcnkuY29udGVudCxcblx0XHRcdFx0b25pbnB1dDogKG5ld1ZhbHVlOiBhbnkpID0+IHtcblx0XHRcdFx0XHRtb2RlbC5lZGl0TW9kZWxzLnN1bW1hcnkuY29udGVudCA9IG5ld1ZhbHVlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGFyaWFMYWJlbDogbGFuZy5nZXQoXCJ0aXRsZV9wbGFjZWhvbGRlclwiKSxcblx0XHRcdFx0cGxhY2Vob2xkZXI6IGxhbmcuZ2V0KFwidGl0bGVfcGxhY2Vob2xkZXJcIiksXG5cdFx0XHRcdGRpc2FibGVkOiAhbW9kZWwuaXNGdWxseVdyaXRhYmxlKCksXG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0Zm9udFNpemU6IHB4KHNpemUuZm9udF9zaXplX2Jhc2UgKiAxLjI1KSwgLy8gT3ZlcnJpZGluZyB0aGUgY29tcG9uZW50IHN0eWxlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHR5cGU6IFRleHRGaWVsZFR5cGUuVGV4dCxcblx0XHRcdH0pLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyUmVhZG9ubHlNZXNzYWdlKGF0dHJzOiBDYWxlbmRhckV2ZW50RWRpdFZpZXdBdHRycyk6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IG1vZGVsIH0gPSBhdHRyc1xuXHRcdGNvbnN0IG1ha2VNZXNzYWdlID0gKG1lc3NhZ2U6IFRyYW5zbGF0aW9uS2V5KTogQ2hpbGRyZW4gPT5cblx0XHRcdG0oSW5mb0Jhbm5lciwge1xuXHRcdFx0XHRtZXNzYWdlOiAoKSA9PiBtKFwiLnNtYWxsLnNlbGVjdGFibGVcIiwgbGFuZy5nZXQobWVzc2FnZSkpLFxuXHRcdFx0XHRpY29uOiBJY29ucy5QZW9wbGUsXG5cdFx0XHRcdHR5cGU6IEJhbm5lclR5cGUuSW5mbyxcblx0XHRcdFx0YnV0dG9uczogW10sXG5cdFx0XHR9IHNhdGlzZmllcyBJbmZvQmFubmVyQXR0cnMpXG5cblx0XHRzd2l0Y2ggKG1vZGVsLmdldFJlYWRvbmx5UmVhc29uKCkpIHtcblx0XHRcdGNhc2UgUmVhZG9ubHlSZWFzb24uU0hBUkVEOlxuXHRcdFx0XHRyZXR1cm4gbWFrZU1lc3NhZ2UoXCJjYW5ub3RFZGl0RnVsbEV2ZW50X21zZ1wiKVxuXHRcdFx0Y2FzZSBSZWFkb25seVJlYXNvbi5TSU5HTEVfSU5TVEFOQ0U6XG5cdFx0XHRcdHJldHVybiBtYWtlTWVzc2FnZShcImNhbm5vdEVkaXRTaW5nbGVJbnN0YW5jZV9tc2dcIilcblx0XHRcdGNhc2UgUmVhZG9ubHlSZWFzb24uTk9UX09SR0FOSVpFUjpcblx0XHRcdFx0cmV0dXJuIG1ha2VNZXNzYWdlKFwiY2Fubm90RWRpdE5vdE9yZ2FuaXplcl9tc2dcIilcblx0XHRcdGNhc2UgUmVhZG9ubHlSZWFzb24uVU5LTk9XTjpcblx0XHRcdFx0cmV0dXJuIG1ha2VNZXNzYWdlKFwiY2Fubm90RWRpdEV2ZW50X21zZ1wiKVxuXHRcdFx0Y2FzZSBSZWFkb25seVJlYXNvbi5OT05FOlxuXHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRXZlbnRUaW1lRWRpdG9yKGF0dHJzOiBDYWxlbmRhckV2ZW50RWRpdFZpZXdBdHRycyk6IENoaWxkcmVuIHtcblx0XHRjb25zdCBwYWRkaW5nID0gcHgoc2l6ZS52cGFkX3NtYWxsKVxuXHRcdHJldHVybiBtKFxuXHRcdFx0Q2FyZCxcblx0XHRcdHsgc3R5bGU6IHsgcGFkZGluZzogYCR7cGFkZGluZ30gMCAke3BhZGRpbmd9ICR7cGFkZGluZ31gIH0gfSxcblx0XHRcdG0oRXZlbnRUaW1lRWRpdG9yLCB7XG5cdFx0XHRcdGVkaXRNb2RlbDogYXR0cnMubW9kZWwuZWRpdE1vZGVscy53aGVuTW9kZWwsXG5cdFx0XHRcdHRpbWVGb3JtYXQ6IHRoaXMudGltZUZvcm1hdCxcblx0XHRcdFx0c3RhcnRPZlRoZVdlZWtPZmZzZXQ6IHRoaXMuc3RhcnRPZlRoZVdlZWtPZmZzZXQsXG5cdFx0XHRcdGRpc2FibGVkOiAhYXR0cnMubW9kZWwuaXNGdWxseVdyaXRhYmxlKCksXG5cdFx0XHR9IHNhdGlzZmllcyBFdmVudFRpbWVFZGl0b3JBdHRycyksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJSZXBlYXRSdWxlTmF2QnV0dG9uKHsgbW9kZWwsIG5hdmlnYXRpb25DYWxsYmFjayB9OiBDYWxlbmRhckV2ZW50RWRpdFZpZXdBdHRycyk6IENoaWxkcmVuIHtcblx0XHRjb25zdCBkaXNhYmxlZCA9ICFtb2RlbC5jYW5FZGl0U2VyaWVzKClcblx0XHRyZXR1cm4gbShcblx0XHRcdENhcmQsXG5cdFx0XHR7IGNsYXNzZXM6IFtcImJ1dHRvbi1taW4taGVpZ2h0XCIsIFwiZmxleFwiLCBcIml0ZW1zLWNlbnRlclwiXSB9LFxuXHRcdFx0bShcIi5mbGV4LmdhcC12cGFkLXMuaXRlbXMtY2VudGVyLmZsZXgtZ3Jvd1wiLCBbXG5cdFx0XHRcdG0oXCIuZmxleC5pdGVtcy1jZW50ZXJcIiwgW1xuXHRcdFx0XHRcdG0oSWNvbiwge1xuXHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuU3luYyxcblx0XHRcdFx0XHRcdHN0eWxlOiB7IGZpbGw6IGdldENvbG9ycyhCdXR0b25Db2xvci5Db250ZW50KS5idXR0b24gfSxcblx0XHRcdFx0XHRcdHRpdGxlOiBsYW5nLmdldChcImNhbGVuZGFyUmVwZWF0aW5nX2xhYmVsXCIpLFxuXHRcdFx0XHRcdFx0c2l6ZTogSWNvblNpemUuTWVkaXVtLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRdKSxcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcImJ1dHRvbi5mbGV4Lml0ZW1zLWNlbnRlci5qdXN0aWZ5LWJldHdlZW4uZmxleC1ncm93LmZsYXNoXCIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0b25jbGljazogKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRcdHRoaXMudHJhbnNpdGlvblRvKEVkaXRvclBhZ2VzLlJFUEVBVF9SVUxFUywgbmF2aWdhdGlvbkNhbGxiYWNrKVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGRpc2FibGVkLFxuXHRcdFx0XHRcdFx0Y2xhc3M6IGRpc2FibGVkID8gXCJkaXNhYmxlZCBjdXJzb3ItZGlzYWJsZWRcIiA6IFwiXCIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRbXG5cdFx0XHRcdFx0XHR0aGlzLmdldFRyYW5zbGF0ZWRSZXBlYXRSdWxlKG1vZGVsLmVkaXRNb2RlbHMud2hlbk1vZGVsLnJlc3VsdC5yZXBlYXRSdWxlLCBtb2RlbC5lZGl0TW9kZWxzLndoZW5Nb2RlbC5pc0FsbERheSksXG5cdFx0XHRcdFx0XHRtKEljb24sIHtcblx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuQXJyb3dGb3J3YXJkLFxuXHRcdFx0XHRcdFx0XHRjbGFzczogXCJmbGV4IGl0ZW1zLWNlbnRlclwiLFxuXHRcdFx0XHRcdFx0XHRzdHlsZTogeyBmaWxsOiBnZXRDb2xvcnMoQnV0dG9uQ29sb3IuQ29udGVudCkuYnV0dG9uIH0sXG5cdFx0XHRcdFx0XHRcdHRpdGxlOiBsYW5nLmdldChcImNhbGVuZGFyUmVwZWF0aW5nX2xhYmVsXCIpLFxuXHRcdFx0XHRcdFx0XHRzaXplOiBJY29uU2l6ZS5NZWRpdW0sXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHQpLFxuXHRcdFx0XSksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSB0cmFuc2l0aW9uVG8odGFyZ2V0OiBFZGl0b3JQYWdlcywgbmF2aWdhdGlvbkNhbGxiYWNrOiAodGFyZ2V0UGFnZTogRWRpdG9yUGFnZXMpID0+IHVua25vd24pIHtcblx0XHR0aGlzLmhhc0FuaW1hdGlvbkVuZGVkID0gZmFsc2Vcblx0XHR0aGlzLnRyYW5zaXRpb25QYWdlID0gdGFyZ2V0XG5cdFx0dGhpcy50cmFuc2xhdGUgPSAtKHRoaXMucGFnZVdpZHRoICsgc2l6ZS52cGFkX3h4bClcblx0XHRuYXZpZ2F0aW9uQ2FsbGJhY2sodGFyZ2V0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJHdWVzdHNOYXZCdXR0b24oeyBuYXZpZ2F0aW9uQ2FsbGJhY2ssIG1vZGVsIH06IENhbGVuZGFyRXZlbnRFZGl0Vmlld0F0dHJzKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFxuXHRcdFx0Q2FyZCxcblx0XHRcdHsgY2xhc3NlczogW1wiYnV0dG9uLW1pbi1oZWlnaHRcIiwgXCJmbGV4XCIsIFwiaXRlbXMtY2VudGVyXCJdIH0sXG5cdFx0XHRtKFwiLmZsZXguZ2FwLXZwYWQtcy5mbGFzaC5pdGVtcy1jZW50ZXIuZmxleC1ncm93XCIsIFtcblx0XHRcdFx0bShcIi5mbGV4Lml0ZW1zLWNlbnRlclwiLCBbXG5cdFx0XHRcdFx0bShJY29uLCB7XG5cdFx0XHRcdFx0XHRpY29uOiBJY29ucy5QZW9wbGUsXG5cdFx0XHRcdFx0XHRzdHlsZTogeyBmaWxsOiBnZXRDb2xvcnMoQnV0dG9uQ29sb3IuQ29udGVudCkuYnV0dG9uIH0sXG5cdFx0XHRcdFx0XHR0aXRsZTogbGFuZy5nZXQoXCJjYWxlbmRhclJlcGVhdGluZ19sYWJlbFwiKSxcblx0XHRcdFx0XHRcdHNpemU6IEljb25TaXplLk1lZGl1bSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XSksXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCJidXR0b24uZmxleC5pdGVtcy1jZW50ZXIuanVzdGlmeS1iZXR3ZWVuLmZsZXgtZ3Jvdy5mbGFzaFwiLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdG9uY2xpY2s6IChldmVudDogTW91c2VFdmVudCkgPT4ge1xuXHRcdFx0XHRcdFx0XHR0aGlzLnRyYW5zaXRpb25UbyhFZGl0b3JQYWdlcy5HVUVTVFMsIG5hdmlnYXRpb25DYWxsYmFjaylcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRbXG5cdFx0XHRcdFx0XHRsYW5nLmdldChcImd1ZXN0c19sYWJlbFwiKSxcblx0XHRcdFx0XHRcdG0oXCIuZmxleFwiLCBbXG5cdFx0XHRcdFx0XHRcdG1vZGVsLmVkaXRNb2RlbHMud2hvTW9kZWwuZ3Vlc3RzLmxlbmd0aCA+IDAgPyBtKFwic3BhblwiLCBtb2RlbC5lZGl0TW9kZWxzLndob01vZGVsLmd1ZXN0cy5sZW5ndGgpIDogbnVsbCxcblx0XHRcdFx0XHRcdFx0bShJY29uLCB7XG5cdFx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuQXJyb3dGb3J3YXJkLFxuXHRcdFx0XHRcdFx0XHRcdGNsYXNzOiBcImZsZXggaXRlbXMtY2VudGVyXCIsXG5cdFx0XHRcdFx0XHRcdFx0c3R5bGU6IHsgZmlsbDogZ2V0Q29sb3JzKEJ1dHRvbkNvbG9yLkNvbnRlbnQpLmJ1dHRvbiB9LFxuXHRcdFx0XHRcdFx0XHRcdHRpdGxlOiBsYW5nLmdldChcImd1ZXN0c19sYWJlbFwiKSxcblx0XHRcdFx0XHRcdFx0XHRzaXplOiBJY29uU2l6ZS5NZWRpdW0sXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XSksXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0KSxcblx0XHRcdF0pLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQ2FsZW5kYXJQaWNrZXIodm5vZGU6IFZub2RlPENhbGVuZGFyRXZlbnRFZGl0Vmlld0F0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IG1vZGVsLCBncm91cENvbG9ycyB9ID0gdm5vZGUuYXR0cnNcblx0XHRjb25zdCBhdmFpbGFibGVDYWxlbmRhcnMgPSBtb2RlbC5lZGl0TW9kZWxzLndob01vZGVsLmdldEF2YWlsYWJsZUNhbGVuZGFycygpXG5cblx0XHRjb25zdCBvcHRpb25zOiBDYWxlbmRhclNlbGVjdEl0ZW1bXSA9IGF2YWlsYWJsZUNhbGVuZGFycy5tYXAoKGNhbGVuZGFySW5mbykgPT4ge1xuXHRcdFx0Y29uc3QgbmFtZSA9IGdldFNoYXJlZEdyb3VwTmFtZShjYWxlbmRhckluZm8uZ3JvdXBJbmZvLCBtb2RlbC51c2VyQ29udHJvbGxlciwgY2FsZW5kYXJJbmZvLnNoYXJlZClcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdG5hbWUsXG5cdFx0XHRcdGNvbG9yOiBcIiNcIiArIChncm91cENvbG9ycy5nZXQoY2FsZW5kYXJJbmZvLmdyb3VwLl9pZCkgPz8gZGVmYXVsdENhbGVuZGFyQ29sb3IpLFxuXHRcdFx0XHR2YWx1ZTogY2FsZW5kYXJJbmZvLFxuXHRcdFx0XHRhcmlhVmFsdWU6IG5hbWUsXG5cdFx0XHR9XG5cdFx0fSlcblxuXHRcdGNvbnN0IHNlbGVjdGVkQ2FsZW5kYXJJbmZvID0gbW9kZWwuZWRpdE1vZGVscy53aG9Nb2RlbC5zZWxlY3RlZENhbGVuZGFyXG5cdFx0Y29uc3Qgc2VsZWN0ZWRDYWxlbmRhck5hbWUgPSBnZXRTaGFyZWRHcm91cE5hbWUoc2VsZWN0ZWRDYWxlbmRhckluZm8uZ3JvdXBJbmZvLCBtb2RlbC51c2VyQ29udHJvbGxlciwgc2VsZWN0ZWRDYWxlbmRhckluZm8uc2hhcmVkKVxuXHRcdGxldCBzZWxlY3RlZDogQ2FsZW5kYXJTZWxlY3RJdGVtID0ge1xuXHRcdFx0bmFtZTogc2VsZWN0ZWRDYWxlbmRhck5hbWUsXG5cdFx0XHRjb2xvcjogXCIjXCIgKyAoZ3JvdXBDb2xvcnMuZ2V0KHNlbGVjdGVkQ2FsZW5kYXJJbmZvLmdyb3VwLl9pZCkgPz8gZGVmYXVsdENhbGVuZGFyQ29sb3IpLFxuXHRcdFx0dmFsdWU6IG1vZGVsLmVkaXRNb2RlbHMud2hvTW9kZWwuc2VsZWN0ZWRDYWxlbmRhcixcblx0XHRcdGFyaWFWYWx1ZTogc2VsZWN0ZWRDYWxlbmRhck5hbWUsXG5cdFx0fVxuXHRcdHJldHVybiBtKFxuXHRcdFx0Q2FyZCxcblx0XHRcdHsgc3R5bGU6IHsgcGFkZGluZzogXCIwXCIgfSB9LFxuXHRcdFx0bShTZWxlY3Q8Q2FsZW5kYXJTZWxlY3RJdGVtLCBDYWxlbmRhckluZm8+LCB7XG5cdFx0XHRcdG9uY2hhbmdlOiAodmFsKSA9PiB7XG5cdFx0XHRcdFx0bW9kZWwuZWRpdE1vZGVscy5hbGFybU1vZGVsLnJlbW92ZUFsbCgpXG5cdFx0XHRcdFx0bW9kZWwuZWRpdE1vZGVscy5hbGFybU1vZGVsLmFkZEFsbCh0aGlzLmRlZmF1bHRBbGFybXMuZ2V0KHZhbC52YWx1ZS5ncm91cC5faWQpID8/IFtdKVxuXHRcdFx0XHRcdG1vZGVsLmVkaXRNb2RlbHMud2hvTW9kZWwuc2VsZWN0ZWRDYWxlbmRhciA9IHZhbC52YWx1ZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvcHRpb25zOiBzdHJlYW0ob3B0aW9ucyksXG5cdFx0XHRcdGV4cGFuZGVkOiB0cnVlLFxuXHRcdFx0XHRzZWxlY3RlZCxcblx0XHRcdFx0Y2xhc3NlczogW1wiYnV0dG9uLW1pbi1oZWlnaHRcIiwgXCJwbC12cGFkLXNcIiwgXCJwci12cGFkLXNcIl0sXG5cdFx0XHRcdHJlbmRlck9wdGlvbjogKG9wdGlvbikgPT4gdGhpcy5yZW5kZXJDYWxlbmRhck9wdGlvbnMob3B0aW9uLCBkZWVwRXF1YWwob3B0aW9uLnZhbHVlLCBzZWxlY3RlZC52YWx1ZSksIGZhbHNlKSxcblx0XHRcdFx0cmVuZGVyRGlzcGxheTogKG9wdGlvbikgPT4gdGhpcy5yZW5kZXJDYWxlbmRhck9wdGlvbnMob3B0aW9uLCBmYWxzZSwgdHJ1ZSksXG5cdFx0XHRcdGFyaWFMYWJlbDogbGFuZy5nZXQoXCJjYWxlbmRhcl9sYWJlbFwiKSxcblx0XHRcdFx0ZGlzYWJsZWQ6ICFtb2RlbC5jYW5DaGFuZ2VDYWxlbmRhcigpIHx8IGF2YWlsYWJsZUNhbGVuZGFycy5sZW5ndGggPCAyLFxuXHRcdFx0fSBzYXRpc2ZpZXMgU2VsZWN0QXR0cmlidXRlczxDYWxlbmRhclNlbGVjdEl0ZW0sIENhbGVuZGFySW5mbz4pLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQ2FsZW5kYXJPcHRpb25zKG9wdGlvbjogQ2FsZW5kYXJTZWxlY3RJdGVtLCBpc1NlbGVjdGVkOiBib29sZWFuLCBpc0Rpc3BsYXk6IGJvb2xlYW4pIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmZsZXguaXRlbXMtY2VudGVyLmdhcC12cGFkLXMuZmxleC1ncm93XCIsXG5cdFx0XHR7IGNsYXNzOiBgJHtpc0Rpc3BsYXkgPyBcIlwiIDogXCJzdGF0ZS1iZyBwbHItYnV0dG9uIGJ1dHRvbi1jb250ZW50IGRyb3Bkb3duLWJ1dHRvbiBwdC1zIHBiLXMgYnV0dG9uLW1pbi1oZWlnaHRcIn1gIH0sXG5cdFx0XHRbXG5cdFx0XHRcdG0oXCJkaXZcIiwge1xuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHR3aWR0aDogcHgoc2l6ZS5ocGFkX2xhcmdlKSxcblx0XHRcdFx0XHRcdGhlaWdodDogcHgoc2l6ZS5ocGFkX2xhcmdlKSxcblx0XHRcdFx0XHRcdGJvcmRlclJhZGl1czogXCI1MCVcIixcblx0XHRcdFx0XHRcdGJhY2tncm91bmRDb2xvcjogb3B0aW9uLmNvbG9yLFxuXHRcdFx0XHRcdFx0bWFyZ2luSW5saW5lOiBweChzaXplLnZwYWRfeHNtIC8gMiksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSksXG5cdFx0XHRcdG0oXCJzcGFuXCIsIHsgc3R5bGU6IHsgY29sb3I6IGlzU2VsZWN0ZWQgPyB0aGVtZS5jb250ZW50X2J1dHRvbl9zZWxlY3RlZCA6IHVuZGVmaW5lZCB9IH0sIG9wdGlvbi5uYW1lKSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJSZW1pbmRlcnNFZGl0b3Iodm5vZGU6IFZub2RlPENhbGVuZGFyRXZlbnRFZGl0Vmlld0F0dHJzPik6IENoaWxkcmVuIHtcblx0XHRpZiAoIXZub2RlLmF0dHJzLm1vZGVsLmVkaXRNb2RlbHMuYWxhcm1Nb2RlbC5jYW5FZGl0UmVtaW5kZXJzKSByZXR1cm4gbnVsbFxuXHRcdGNvbnN0IHsgYWxhcm1Nb2RlbCB9ID0gdm5vZGUuYXR0cnMubW9kZWwuZWRpdE1vZGVsc1xuXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRDYXJkLFxuXHRcdFx0eyBjbGFzc2VzOiBbXCJidXR0b24tbWluLWhlaWdodFwiLCBcImZsZXhcIiwgXCJpdGVtcy1jZW50ZXJcIl0gfSxcblx0XHRcdG0oXCIuZmxleC5nYXAtdnBhZC1zLml0ZW1zLXN0YXJ0LmZsZXgtZ3Jvd1wiLCBbXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIuZmxleFwiLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNsYXNzOiBhbGFybU1vZGVsLmFsYXJtcy5sZW5ndGggPT09IDAgPyBcIml0ZW1zLWNlbnRlclwiIDogXCJpdGVtcy1zdGFydFwiLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0W1xuXHRcdFx0XHRcdFx0bShJY29uLCB7XG5cdFx0XHRcdFx0XHRcdGljb246IEljb25zLkNsb2NrLFxuXHRcdFx0XHRcdFx0XHRzdHlsZTogeyBmaWxsOiBnZXRDb2xvcnMoQnV0dG9uQ29sb3IuQ29udGVudCkuYnV0dG9uIH0sXG5cdFx0XHRcdFx0XHRcdHRpdGxlOiBsYW5nLmdldChcInJlbWluZGVyQmVmb3JlRXZlbnRfbGFiZWxcIiksXG5cdFx0XHRcdFx0XHRcdHNpemU6IEljb25TaXplLk1lZGl1bSxcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdCksXG5cdFx0XHRcdG0oUmVtaW5kZXJzRWRpdG9yLCB7XG5cdFx0XHRcdFx0YWxhcm1zOiBhbGFybU1vZGVsLmFsYXJtcyxcblx0XHRcdFx0XHRhZGRBbGFybTogYWxhcm1Nb2RlbC5hZGRBbGFybS5iaW5kKGFsYXJtTW9kZWwpLFxuXHRcdFx0XHRcdHJlbW92ZUFsYXJtOiBhbGFybU1vZGVsLnJlbW92ZUFsYXJtLmJpbmQoYWxhcm1Nb2RlbCksXG5cdFx0XHRcdFx0bGFiZWw6IFwicmVtaW5kZXJCZWZvcmVFdmVudF9sYWJlbFwiLFxuXHRcdFx0XHRcdHVzZU5ld0VkaXRvcjogdHJ1ZSxcblx0XHRcdFx0fSBzYXRpc2ZpZXMgUmVtaW5kZXJzRWRpdG9yQXR0cnMpLFxuXHRcdFx0XSksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJMb2NhdGlvbkZpZWxkKHZub2RlOiBWbm9kZTxDYWxlbmRhckV2ZW50RWRpdFZpZXdBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgeyBtb2RlbCB9ID0gdm5vZGUuYXR0cnNcblx0XHRyZXR1cm4gbShcblx0XHRcdENhcmQsXG5cdFx0XHR7XG5cdFx0XHRcdHN0eWxlOiB7IHBhZGRpbmc6IFwiMFwiIH0sXG5cdFx0XHR9LFxuXHRcdFx0bShcblx0XHRcdFx0XCIuZmxleC5nYXAtdnBhZC1zLml0ZW1zLWNlbnRlclwiLFxuXHRcdFx0XHRtKFNpbmdsZUxpbmVUZXh0RmllbGQsIHtcblx0XHRcdFx0XHR2YWx1ZTogbW9kZWwuZWRpdE1vZGVscy5sb2NhdGlvbi5jb250ZW50LFxuXHRcdFx0XHRcdG9uaW5wdXQ6IChuZXdWYWx1ZTogc3RyaW5nKSA9PiB7XG5cdFx0XHRcdFx0XHRtb2RlbC5lZGl0TW9kZWxzLmxvY2F0aW9uLmNvbnRlbnQgPSBuZXdWYWx1ZVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0Y2xhc3NlczogW1wiYnV0dG9uLW1pbi1oZWlnaHRcIl0sXG5cdFx0XHRcdFx0YXJpYUxhYmVsOiBsYW5nLmdldChcImxvY2F0aW9uX2xhYmVsXCIpLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyOiBsYW5nLmdldChcImxvY2F0aW9uX2xhYmVsXCIpLFxuXHRcdFx0XHRcdGRpc2FibGVkOiAhbW9kZWwuaXNGdWxseVdyaXRhYmxlKCksXG5cdFx0XHRcdFx0bGVhZGluZ0ljb246IHtcblx0XHRcdFx0XHRcdGljb246IEljb25zLlBpbixcblx0XHRcdFx0XHRcdGNvbG9yOiBnZXRDb2xvcnMoQnV0dG9uQ29sb3IuQ29udGVudCkuYnV0dG9uLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0dHlwZTogVGV4dEZpZWxkVHlwZS5UZXh0LFxuXHRcdFx0XHR9KSxcblx0XHRcdCksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJEZXNjcmlwdGlvbkVkaXRvcih2bm9kZTogVm5vZGU8Q2FsZW5kYXJFdmVudEVkaXRWaWV3QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFxuXHRcdFx0Q2FyZCxcblx0XHRcdHtcblx0XHRcdFx0Y2xhc3NlczogW1wiY2hpbGQtdGV4dC1lZGl0b3JcIiwgXCJyZWxcIl0sXG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0cGFkZGluZzogXCIwXCIsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHR2bm9kZS5hdHRycy5kZXNjcmlwdGlvbkVkaXRvci5pc0VtcHR5KCkgJiYgIXZub2RlLmF0dHJzLmRlc2NyaXB0aW9uRWRpdG9yLmlzQWN0aXZlKClcblx0XHRcdFx0XHQ/IG0oXCJzcGFuLnRleHQtZWRpdG9yLXBsYWNlaG9sZGVyXCIsIGxhbmcuZ2V0KFwiZGVzY3JpcHRpb25fbGFiZWxcIikpXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRtKHZub2RlLmF0dHJzLmRlc2NyaXB0aW9uRWRpdG9yKSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJNYWluUGFnZSh2bm9kZTogVm5vZGU8Q2FsZW5kYXJFdmVudEVkaXRWaWV3QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIucGIucHQuZmxleC5jb2wuZ2FwLXZwYWQuZml0LWhlaWdodC5ib3gtY29udGVudFwiLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdC8vIFRoZSBkYXRlIHBpY2tlciBkaWFsb2dzIGhhdmUgcG9zaXRpb246IGZpeGVkLCBhbmQgdGhleSBhcmUgZml4ZWQgcmVsYXRpdmUgdG8gdGhlIG1vc3QgcmVjZW50IGFuY2VzdG9yIHdpdGhcblx0XHRcdFx0XHQvLyBhIHRyYW5zZm9ybS4gU28gZG9pbmcgYSBuby1vcCB0cmFuc2Zvcm0gd2lsbCBtYWtlIHRoZSBkcm9wZG93bnMgc2Nyb2xsIHdpdGggdGhlIGRpYWxvZ1xuXHRcdFx0XHRcdC8vIHdpdGhvdXQgdGhpcywgdGhlbiB0aGUgZGF0ZSBwaWNrZXIgZGlhbG9ncyB3aWxsIHNob3cgYXQgdGhlIHNhbWUgcGxhY2Ugb24gdGhlIHNjcmVlbiByZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlXG5cdFx0XHRcdFx0Ly8gZWRpdG9yIGhhcyBzY3JvbGxlZCBvciBub3QuXG5cdFx0XHRcdFx0Ly8gSWRlYWxseSB3ZSBjb3VsZCBkbyB0aGlzIGluc2lkZSBEYXRlUGlja2VyIGl0c2VsZiwgYnV0IHRoZSByZW5kZXJpbmcgYnJlYWtzIGFuZCB0aGUgZGlhbG9nIGFwcGVhcnMgYmVsb3cgaXQncyBzaWJsaW5nc1xuXHRcdFx0XHRcdC8vIFdlIGFsc28gZG9uJ3Qgd2FudCB0byBkbyB0aGlzIGZvciBhbGwgZGlhbG9ncyBiZWNhdXNlIGl0IGNvdWxkIHBvdGVudGlhbGx5IGNhdXNlIG90aGVyIGlzc3Vlc1xuXHRcdFx0XHRcdHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUoMClcIixcblx0XHRcdFx0XHRjb2xvcjogdGhlbWUuYnV0dG9uX2J1YmJsZV9mZyxcblx0XHRcdFx0XHRcInBvaW50ZXItZXZlbnRzXCI6IGAke3RoaXMuYWxsb3dSZW5kZXJNYWluUGFnZSgpID8gXCJhdXRvXCIgOiBcIm5vbmVcIn1gLFxuXHRcdFx0XHRcdHdpZHRoOiBweCh0aGlzLnBhZ2VXaWR0aCksXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHR0aGlzLmFsbG93UmVuZGVyTWFpblBhZ2UoKVxuXHRcdFx0XHRcdD8gbS5mcmFnbWVudCh7fSwgW1xuXHRcdFx0XHRcdFx0XHR0aGlzLnJlbmRlclJlYWRvbmx5TWVzc2FnZSh2bm9kZS5hdHRycyksXG5cdFx0XHRcdFx0XHRcdHRoaXMucmVuZGVyVGl0bGUodm5vZGUuYXR0cnMpLFxuXHRcdFx0XHRcdFx0XHR0aGlzLnJlbmRlckV2ZW50VGltZUVkaXRvcih2bm9kZS5hdHRycyksXG5cdFx0XHRcdFx0XHRcdHRoaXMucmVuZGVyQ2FsZW5kYXJQaWNrZXIodm5vZGUpLFxuXHRcdFx0XHRcdFx0XHR0aGlzLnJlbmRlclJlcGVhdFJ1bGVOYXZCdXR0b24odm5vZGUuYXR0cnMpLFxuXHRcdFx0XHRcdFx0XHR0aGlzLnJlbmRlclJlbWluZGVyc0VkaXRvcih2bm9kZSksXG5cdFx0XHRcdFx0XHRcdHRoaXMucmVuZGVyR3Vlc3RzTmF2QnV0dG9uKHZub2RlLmF0dHJzKSxcblx0XHRcdFx0XHRcdFx0dGhpcy5yZW5kZXJMb2NhdGlvbkZpZWxkKHZub2RlKSxcblx0XHRcdFx0XHQgIF0pXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHR0aGlzLnJlbmRlckRlc2NyaXB0aW9uRWRpdG9yKHZub2RlKSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJSZXBlYXRSdWxlc1BhZ2UoeyBhdHRyczogeyBtb2RlbCwgbmF2aWdhdGlvbkNhbGxiYWNrIH0gfTogVm5vZGU8Q2FsZW5kYXJFdmVudEVkaXRWaWV3QXR0cnM+KSB7XG5cdFx0Y29uc3QgeyB3aGVuTW9kZWwgfSA9IG1vZGVsLmVkaXRNb2RlbHNcblxuXHRcdHJldHVybiBtKFJlcGVhdFJ1bGVFZGl0b3IsIHtcblx0XHRcdG1vZGVsOiB3aGVuTW9kZWwsXG5cdFx0XHRzdGFydE9mVGhlV2Vla09mZnNldDogdGhpcy5zdGFydE9mVGhlV2Vla09mZnNldCxcblx0XHRcdHdpZHRoOiB0aGlzLnBhZ2VXaWR0aCxcblx0XHRcdGJhY2tBY3Rpb246ICgpID0+IG5hdmlnYXRpb25DYWxsYmFjayhFZGl0b3JQYWdlcy5NQUlOKSxcblx0XHR9IHNhdGlzZmllcyBSZXBlYXRSdWxlRWRpdG9yQXR0cnMpXG5cdH1cblxuXHRwcml2YXRlIGdldFRyYW5zbGF0ZWRSZXBlYXRSdWxlKHJ1bGU6IENhbGVuZGFyUmVwZWF0UnVsZSB8IG51bGwsIGlzQWxsRGF5OiBib29sZWFuKTogc3RyaW5nIHtcblx0XHRpZiAocnVsZSA9PSBudWxsKSByZXR1cm4gbGFuZy5nZXQoXCJjYWxlbmRhclJlcGVhdEludGVydmFsTm9SZXBlYXRfbGFiZWxcIilcblxuXHRcdGNvbnN0IGZyZXF1ZW5jeSA9IGZvcm1hdFJlcGV0aXRpb25GcmVxdWVuY3kocnVsZSlcblx0XHRyZXR1cm4gZnJlcXVlbmN5ID8gZnJlcXVlbmN5ICsgZm9ybWF0UmVwZXRpdGlvbkVuZChydWxlLCBpc0FsbERheSkgOiBsYW5nLmdldChcInVua25vd25SZXBldGl0aW9uX21zZ1wiKVxuXHR9XG59XG4iLCIvKipcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgZnVuY3Rpb25zIHVzZWQgdG8gc2V0IHVwIGFuZCB0ZWFyIGRvd24gZWRpdCBkaWFsb2dzIGZvciBjYWxlbmRhciBldmVudHMuXG4gKlxuICogdGhleSdyZSBub3QgcmVzcG9uc2libGUgZm9yIHVwaG9sZGluZyBpbnZhcmlhbnRzIG9yIGVuc3VyZSB2YWxpZCBldmVudHMgKENhbGVuZGFyRXZlbnRNb2RlbC5lZGl0TW9kZWxzXG4gKiBhbmQgQ2FsZW5kYXJFdmVudEVkaXRWaWV3IGRvIHRoYXQpLCBidXQga25vdyB3aGF0IGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gdG8gYXNrIHRoZSB1c2VyIGJlZm9yZSBzYXZpbmdcbiAqIGFuZCB3aGljaCBtZXRob2RzIHRvIGNhbGwgdG8gc2F2ZSB0aGUgY2hhbmdlcy5cbiAqL1xuXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0RpYWxvZy5qc1wiXG5pbXBvcnQgeyBsYW5nLCBNYXliZVRyYW5zbGF0aW9uIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IEJ1dHRvbkF0dHJzLCBCdXR0b25UeXBlIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b24uanNcIlxuaW1wb3J0IHsgS2V5cyB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBBbGFybUludGVydmFsLCBnZXRTdGFydE9mVGhlV2Vla09mZnNldEZvclVzZXIsIGdldFRpbWVGb3JtYXRGb3JVc2VyLCBwYXJzZUFsYXJtSW50ZXJ2YWwgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlscy5qc1wiXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvQ2xpZW50RGV0ZWN0b3IuanNcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCwgbm9PcCwgVGh1bmsgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IFBvc1JlY3QgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0Ryb3Bkb3duLmpzXCJcbmltcG9ydCB7IE1haWwgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgdHlwZSB7IEh0bWxFZGl0b3IgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9lZGl0b3IvSHRtbEVkaXRvci5qc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyRXZlbnRFZGl0VmlldywgRWRpdG9yUGFnZXMgfSBmcm9tIFwiLi9DYWxlbmRhckV2ZW50RWRpdFZpZXcuanNcIlxuaW1wb3J0IHsgYXNrSWZTaG91bGRTZW5kQ2FsZW5kYXJVcGRhdGVzVG9BdHRlbmRlZXMgfSBmcm9tIFwiLi4vQ2FsZW5kYXJHdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50SWRlbnRpdHksIENhbGVuZGFyRXZlbnRNb2RlbCwgRXZlbnRTYXZlUmVzdWx0IH0gZnJvbSBcIi4uL2V2ZW50ZWRpdG9yLW1vZGVsL0NhbGVuZGFyRXZlbnRNb2RlbC5qc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuaW1wb3J0IHsgVXBncmFkZVJlcXVpcmVkRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9tYWluL1VwZ3JhZGVSZXF1aXJlZEVycm9yLmpzXCJcbmltcG9ydCB7IHNob3dQbGFuVXBncmFkZVJlcXVpcmVkRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9taXNjL1N1YnNjcmlwdGlvbkRpYWxvZ3MuanNcIlxuaW1wb3J0IHsgY29udmVydFRleHRUb0h0bWwgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvRm9ybWF0dGVyLmpzXCJcbmltcG9ydCB7IFVzZXJFcnJvciB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL21haW4vVXNlckVycm9yLmpzXCJcbmltcG9ydCB7IHNob3dVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvRXJyb3JIYW5kbGVySW1wbC5qc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL3RoZW1lLmpzXCJcbmltcG9ydCBzdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcblxuaW1wb3J0IHsgaGFuZGxlUmF0aW5nQnlFdmVudCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vcmF0aW5ncy9JbkFwcFJhdGluZ0RpYWxvZy5qc1wiXG5cbmNvbnN0IGVudW0gQ29uZmlybWF0aW9uUmVzdWx0IHtcblx0Q2FuY2VsLFxuXHRDb250aW51ZSxcbn1cblxudHlwZSBFZGl0RGlhbG9nT2tIYW5kbGVyID0gKHBvc1JlY3Q6IFBvc1JlY3QsIGZpbmlzaDogVGh1bmspID0+IFByb21pc2U8dW5rbm93bj5cblxuZXhwb3J0IGNsYXNzIEV2ZW50RWRpdG9yRGlhbG9nIHtcblx0cHJpdmF0ZSBjdXJyZW50UGFnZTogc3RyZWFtPEVkaXRvclBhZ2VzPiA9IHN0cmVhbShFZGl0b3JQYWdlcy5NQUlOKVxuXHRwcml2YXRlIGRpYWxvZzogRGlhbG9nIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBoZWFkZXJEb206IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGxcblxuXHRjb25zdHJ1Y3RvcigpIHt9XG5cblx0cHJpdmF0ZSBsZWZ0KCk6IEJ1dHRvbkF0dHJzW10ge1xuXHRcdGlmICh0aGlzLmN1cnJlbnRQYWdlKCkgPT09IEVkaXRvclBhZ2VzLk1BSU4pIHtcblx0XHRcdHJldHVybiBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsYWJlbDogXCJjYW5jZWxfYWN0aW9uXCIsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHRoaXMuZGlhbG9nPy5jbG9zZSgpLFxuXHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHR9LFxuXHRcdFx0XVxuXHRcdH1cblxuXHRcdHJldHVybiBbXG5cdFx0XHR7XG5cdFx0XHRcdGxhYmVsOiBcImJhY2tfYWN0aW9uXCIsXG5cdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLmN1cnJlbnRQYWdlKEVkaXRvclBhZ2VzLk1BSU4pLFxuXHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHRcdH0sXG5cdFx0XVxuXHR9XG5cblx0cHJpdmF0ZSByaWdodChva0FjdGlvbjogKGRvbTogSFRNTEVsZW1lbnQpID0+IHVua25vd24pOiBCdXR0b25BdHRyc1tdIHtcblx0XHRpZiAodGhpcy5jdXJyZW50UGFnZSgpID09PSBFZGl0b3JQYWdlcy5NQUlOKSB7XG5cdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGFiZWw6IFwic2F2ZV9hY3Rpb25cIixcblx0XHRcdFx0XHRjbGljazogKGV2ZW50OiBNb3VzZUV2ZW50LCBkb206IEhUTUxFbGVtZW50KSA9PiBva0FjdGlvbihkb20pLFxuXHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHRcdFx0fSxcblx0XHRcdF1cblx0XHR9XG5cblx0XHRyZXR1cm4gW11cblx0fVxuXG5cdC8qKlxuXHQgKiB0aGUgZ2VuZXJpYyB3YXkgdG8gb3BlbiBhbnkgY2FsZW5kYXIgZWRpdCBkaWFsb2cuIHRoZSBjYWxsZXIgc2hvdWxkIGtub3cgd2hhdCB0byBkbyBhZnRlciB0aGVcblx0ICogZGlhbG9nIGlzIGNsb3NlZC5cblx0ICovXG5cdGFzeW5jIHNob3dDYWxlbmRhckV2ZW50RWRpdERpYWxvZyhtb2RlbDogQ2FsZW5kYXJFdmVudE1vZGVsLCByZXNwb25zZU1haWw6IE1haWwgfCBudWxsLCBoYW5kbGVyOiBFZGl0RGlhbG9nT2tIYW5kbGVyKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgcmVjaXBpZW50c1NlYXJjaCA9IGF3YWl0IGxvY2F0b3IucmVjaXBpZW50c1NlYXJjaE1vZGVsKClcblx0XHRjb25zdCB7IEh0bWxFZGl0b3IgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvZWRpdG9yL0h0bWxFZGl0b3IuanNcIilcblx0XHRjb25zdCBncm91cFNldHRpbmdzID0gbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyU2V0dGluZ3NHcm91cFJvb3QuZ3JvdXBTZXR0aW5nc1xuXG5cdFx0Y29uc3QgZ3JvdXBDb2xvcnM6IE1hcDxJZCwgc3RyaW5nPiA9IGdyb3VwU2V0dGluZ3MucmVkdWNlKChhY2MsIGdjKSA9PiB7XG5cdFx0XHRhY2Muc2V0KGdjLmdyb3VwLCBnYy5jb2xvcilcblx0XHRcdHJldHVybiBhY2Ncblx0XHR9LCBuZXcgTWFwKCkpXG5cblx0XHRjb25zdCBkZWZhdWx0QWxhcm1zOiBNYXA8SWQsIEFsYXJtSW50ZXJ2YWxbXT4gPSBncm91cFNldHRpbmdzLnJlZHVjZSgoYWNjLCBnYykgPT4ge1xuXHRcdFx0YWNjLnNldChcblx0XHRcdFx0Z2MuZ3JvdXAsXG5cdFx0XHRcdGdjLmRlZmF1bHRBbGFybXNMaXN0Lm1hcCgoYWxhcm0pID0+IHBhcnNlQWxhcm1JbnRlcnZhbChhbGFybS50cmlnZ2VyKSksXG5cdFx0XHQpXG5cdFx0XHRyZXR1cm4gYWNjXG5cdFx0fSwgbmV3IE1hcCgpKVxuXG5cdFx0Y29uc3QgZGVzY3JpcHRpb25UZXh0ID0gY29udmVydFRleHRUb0h0bWwobW9kZWwuZWRpdE1vZGVscy5kZXNjcmlwdGlvbi5jb250ZW50KVxuXHRcdGNvbnN0IGRlc2NyaXB0aW9uRWRpdG9yOiBIdG1sRWRpdG9yID0gbmV3IEh0bWxFZGl0b3IoKVxuXHRcdFx0LnNldFNob3dPdXRsaW5lKHRydWUpXG5cdFx0XHQuc2V0TWluSGVpZ2h0KDIwMClcblx0XHRcdC5zZXRFbmFibGVkKHRydWUpXG5cdFx0XHQvLyBXZSBvbmx5IHNldCBpdCBvbmNlLCB3ZSBkb24ndCB2aWV3TW9kZWwgb24gZXZlcnkgY2hhbmdlLCB0aGF0IHdvdWxkIGJlIHNsb3dcblx0XHRcdC5zZXRWYWx1ZShkZXNjcmlwdGlvblRleHQpXG5cblx0XHRjb25zdCBva0FjdGlvbiA9IChkb206IEhUTUxFbGVtZW50KSA9PiB7XG5cdFx0XHRtb2RlbC5lZGl0TW9kZWxzLmRlc2NyaXB0aW9uLmNvbnRlbnQgPSBkZXNjcmlwdGlvbkVkaXRvci5nZXRUcmltbWVkVmFsdWUoKVxuXHRcdFx0aGFuZGxlcihkb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksICgpID0+IGRpYWxvZy5jbG9zZSgpKVxuXHRcdH1cblxuXHRcdGNvbnN0IHN1bW1hcnkgPSBtb2RlbC5lZGl0TW9kZWxzLnN1bW1hcnkuY29udGVudFxuXHRcdGNvbnN0IGhlYWRpbmcgPSBzdW1tYXJ5LnRyaW0oKS5sZW5ndGggPiAwID8gbGFuZy5tYWtlVHJhbnNsYXRpb24oXCJzdW1tYXJ5XCIsIHN1bW1hcnkpIDogXCJjcmVhdGVFdmVudF9sYWJlbFwiXG5cblx0XHRjb25zdCBuYXZpZ2F0aW9uQ2FsbGJhY2sgPSAodGFyZ2V0UGFnZTogRWRpdG9yUGFnZXMpID0+IHtcblx0XHRcdHRoaXMuY3VycmVudFBhZ2UodGFyZ2V0UGFnZSlcblx0XHR9XG5cblx0XHRjb25zdCBkaWFsb2c6IERpYWxvZyA9IERpYWxvZy5lZGl0TWVkaXVtRGlhbG9nKFxuXHRcdFx0e1xuXHRcdFx0XHRsZWZ0OiB0aGlzLmxlZnQuYmluZCh0aGlzKSxcblx0XHRcdFx0bWlkZGxlOiBoZWFkaW5nLFxuXHRcdFx0XHRyaWdodDogdGhpcy5yaWdodC5iaW5kKHRoaXMsIG9rQWN0aW9uKSxcblx0XHRcdFx0Y3JlYXRlOiAoZG9tKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5oZWFkZXJEb20gPSBkb21cblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRDYWxlbmRhckV2ZW50RWRpdFZpZXcsXG5cdFx0XHR7XG5cdFx0XHRcdG1vZGVsLFxuXHRcdFx0XHRyZWNpcGllbnRzU2VhcmNoLFxuXHRcdFx0XHRkZXNjcmlwdGlvbkVkaXRvcixcblx0XHRcdFx0c3RhcnRPZlRoZVdlZWtPZmZzZXQ6IGdldFN0YXJ0T2ZUaGVXZWVrT2Zmc2V0Rm9yVXNlcihsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJTZXR0aW5nc0dyb3VwUm9vdCksXG5cdFx0XHRcdHRpbWVGb3JtYXQ6IGdldFRpbWVGb3JtYXRGb3JVc2VyKGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlclNldHRpbmdzR3JvdXBSb290KSxcblx0XHRcdFx0Z3JvdXBDb2xvcnMsXG5cdFx0XHRcdGRlZmF1bHRBbGFybXMsXG5cdFx0XHRcdG5hdmlnYXRpb25DYWxsYmFjayxcblx0XHRcdFx0Y3VycmVudFBhZ2U6IHRoaXMuY3VycmVudFBhZ2UsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRoZWlnaHQ6IFwiMTAwJVwiLFxuXHRcdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogdGhlbWUubmF2aWdhdGlvbl9iZyxcblx0XHRcdH0sXG5cdFx0KVxuXHRcdFx0LmFkZFNob3J0Y3V0KHtcblx0XHRcdFx0a2V5OiBLZXlzLkVTQyxcblx0XHRcdFx0ZXhlYzogKCkgPT4gZGlhbG9nLmNsb3NlKCksXG5cdFx0XHRcdGhlbHA6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHR9KVxuXHRcdFx0LmFkZFNob3J0Y3V0KHtcblx0XHRcdFx0a2V5OiBLZXlzLlMsXG5cdFx0XHRcdGN0cmxPckNtZDogdHJ1ZSxcblx0XHRcdFx0ZXhlYzogKCkgPT4gb2tBY3Rpb24oYXNzZXJ0Tm90TnVsbCh0aGlzLmhlYWRlckRvbSwgXCJoZWFkZXJEb20gd2FzIG51bGxcIikpLFxuXHRcdFx0XHRoZWxwOiBcInNhdmVfYWN0aW9uXCIsXG5cdFx0XHR9KVxuXG5cdFx0aWYgKGNsaWVudC5pc01vYmlsZURldmljZSgpKSB7XG5cdFx0XHQvLyBQcmV2ZW50IGZvY3VzaW5nIHRleHQgZmllbGQgYXV0b21hdGljYWxseSBvbiBtb2JpbGUuIEl0IG9wZW5zIGtleWJvYXJkIGFuZCB5b3UgZG9uJ3Qgc2VlIGFsbCBkZXRhaWxzLlxuXHRcdFx0ZGlhbG9nLnNldEZvY3VzT25Mb2FkRnVuY3Rpb24obm9PcClcblx0XHR9XG5cblx0XHR0aGlzLmRpYWxvZyA9IGRpYWxvZ1xuXG5cdFx0ZGlhbG9nLnNob3coKVxuXHR9XG5cblx0LyoqXG5cdCAqIHNob3cgYW4gZWRpdCBkaWFsb2cgZm9yIGFuIGV2ZW50IHRoYXQgZG9lcyBub3QgZXhpc3Qgb24gdGhlIHNlcnZlciB5ZXQgKG9yIGFueXdoZXJlIGVsc2UpXG5cdCAqXG5cdCAqIHdpbGwgdW5jb25kaXRpb25hbGx5IHNlbmQgaW52aXRlcyBvbiBzYXZlLlxuXHQgKiBAcGFyYW0gbW9kZWwgdGhlIGNhbGVuZGFyIGV2ZW50IG1vZGVsIHVzZWQgdG8gZWRpdCBhbmQgc2F2ZSB0aGUgZXZlbnRcblx0ICovXG5cdGFzeW5jIHNob3dOZXdDYWxlbmRhckV2ZW50RWRpdERpYWxvZyhtb2RlbDogQ2FsZW5kYXJFdmVudE1vZGVsKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0bGV0IGZpbmlzaGVkID0gZmFsc2VcblxuXHRcdGNvbnN0IG9rQWN0aW9uOiBFZGl0RGlhbG9nT2tIYW5kbGVyID0gYXN5bmMgKHBvc1JlY3QsIGZpbmlzaCkgPT4ge1xuXHRcdFx0LyoqIG5ldyBldmVudCwgc28gd2UgYWx3YXlzIHdhbnQgdG8gc2VuZCBpbnZpdGVzLiAqL1xuXHRcdFx0bW9kZWwuZWRpdE1vZGVscy53aG9Nb2RlbC5zaG91bGRTZW5kVXBkYXRlcyA9IHRydWVcblx0XHRcdGlmIChmaW5pc2hlZCkge1xuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH1cblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgbW9kZWwuYXBwbHkoKVxuXHRcdFx0XHRpZiAocmVzdWx0ID09PSBFdmVudFNhdmVSZXN1bHQuU2F2ZWQpIHtcblx0XHRcdFx0XHRmaW5pc2hlZCA9IHRydWVcblx0XHRcdFx0XHRmaW5pc2goKVxuXG5cdFx0XHRcdFx0YXdhaXQgaGFuZGxlUmF0aW5nQnlFdmVudCgpXG5cdFx0XHRcdH1cblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBVc2VyRXJyb3IpIHtcblx0XHRcdFx0XHQvLyBub2luc3BlY3Rpb24gRVM2TWlzc2luZ0F3YWl0XG5cdFx0XHRcdFx0c2hvd1VzZXJFcnJvcihlKVxuXHRcdFx0XHR9IGVsc2UgaWYgKGUgaW5zdGFuY2VvZiBVcGdyYWRlUmVxdWlyZWRFcnJvcikge1xuXHRcdFx0XHRcdGF3YWl0IHNob3dQbGFuVXBncmFkZVJlcXVpcmVkRGlhbG9nKGUucGxhbnMpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuc2hvd0NhbGVuZGFyRXZlbnRFZGl0RGlhbG9nKG1vZGVsLCBudWxsLCBva0FjdGlvbilcblx0fVxuXG5cdC8qKlxuXHQgKiBzaG93IGEgZGlhbG9nIHRoYXQgYWxsb3dzIHRvIGVkaXQgYSBjYWxlbmRhciBldmVudCB0aGF0IGFscmVhZHkgZXhpc3RzLlxuXHQgKlxuXHQgKiBvbiBzYXZlLCB3aWxsIHZhbGlkYXRlIGV4dGVybmFsIHBhc3N3b3JkcywgYWNjb3VudCB0eXBlIGFuZCB1c2VyIGludGVudCBiZWZvcmUgYWN0dWFsbHkgc2F2aW5nIGFuZCBzZW5kaW5nIHVwZGF0ZXMvaW52aXRlcy9jYW5jZWxsYXRpb25zLlxuXHQgKlxuXHQgKiBAcGFyYW0gbW9kZWwgdGhlIGNhbGVuZGFyIGV2ZW50IG1vZGVsIHVzZWQgdG8gZWRpdCAmIHNhdmUgdGhlIGV2ZW50XG5cdCAqIEBwYXJhbSBpZGVudGl0eSB0aGUgaWRlbnRpdHkgb2YgdGhlIGV2ZW50IHRvIGVkaXRcblx0ICogQHBhcmFtIHJlc3BvbnNlTWFpbCBhIG1haWwgY29udGFpbmluZyBhbiBpbnZpdGUgYW5kL29yIHVwZGF0ZSBmb3IgdGhpcyBldmVudCBpbiBjYXNlIHdlIG5lZWQgdG8gcmVwbHkgdG8gdGhlIG9yZ2FuaXplclxuXHQgKi9cblx0YXN5bmMgc2hvd0V4aXN0aW5nQ2FsZW5kYXJFdmVudEVkaXREaWFsb2cobW9kZWw6IENhbGVuZGFyRXZlbnRNb2RlbCwgaWRlbnRpdHk6IENhbGVuZGFyRXZlbnRJZGVudGl0eSwgcmVzcG9uc2VNYWlsOiBNYWlsIHwgbnVsbCA9IG51bGwpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRsZXQgZmluaXNoZWQgPSBmYWxzZVxuXG5cdFx0aWYgKGlkZW50aXR5LnVpZCA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcInRyaWVkIHRvIGVkaXQgZXhpc3RpbmcgZXZlbnQgd2l0aG91dCB1aWQsIHRoaXMgaXMgaW1wb3NzaWJsZSBmb3IgY2VydGFpbiBlZGl0IG9wZXJhdGlvbnMuXCIpXG5cdFx0fVxuXG5cdFx0Y29uc3Qgb2tBY3Rpb246IEVkaXREaWFsb2dPa0hhbmRsZXIgPSBhc3luYyAocG9zUmVjdCwgZmluaXNoKSA9PiB7XG5cdFx0XHRpZiAoZmluaXNoZWQgfHwgKGF3YWl0IHRoaXMuYXNrVXNlcklmVXBkYXRlc0FyZU5lZWRlZE9yQ2FuY2VsKG1vZGVsKSkgPT09IENvbmZpcm1hdGlvblJlc3VsdC5DYW5jZWwpIHtcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IG1vZGVsLmFwcGx5KClcblx0XHRcdFx0aWYgKHJlc3VsdCA9PT0gRXZlbnRTYXZlUmVzdWx0LlNhdmVkIHx8IHJlc3VsdCA9PT0gRXZlbnRTYXZlUmVzdWx0Lk5vdEZvdW5kKSB7XG5cdFx0XHRcdFx0ZmluaXNoZWQgPSB0cnVlXG5cdFx0XHRcdFx0ZmluaXNoKClcblxuXHRcdFx0XHRcdC8vIEluZm9ybSB0aGUgdXNlciB0aGF0IHRoZSBldmVudCB3YXMgZGVsZXRlZCwgYXZvaWRpbmcgbWlzdW5kZXJzdGFuZGluZyB0aGF0IHRoZSBldmVudCB3YXMgc2F2ZWRcblx0XHRcdFx0XHRpZiAocmVzdWx0ID09PSBFdmVudFNhdmVSZXN1bHQuTm90Rm91bmQpIERpYWxvZy5tZXNzYWdlKFwiZXZlbnROb0xvbmdlckV4aXN0c19tc2dcIilcblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpZiAoZSBpbnN0YW5jZW9mIFVzZXJFcnJvcikge1xuXHRcdFx0XHRcdC8vIG5vaW5zcGVjdGlvbiBFUzZNaXNzaW5nQXdhaXRcblx0XHRcdFx0XHRzaG93VXNlckVycm9yKGUpXG5cdFx0XHRcdH0gZWxzZSBpZiAoZSBpbnN0YW5jZW9mIFVwZ3JhZGVSZXF1aXJlZEVycm9yKSB7XG5cdFx0XHRcdFx0YXdhaXQgc2hvd1BsYW5VcGdyYWRlUmVxdWlyZWREaWFsb2coZS5wbGFucylcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aHJvdyBlXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0YXdhaXQgdGhpcy5zaG93Q2FsZW5kYXJFdmVudEVkaXREaWFsb2cobW9kZWwsIHJlc3BvbnNlTWFpbCwgb2tBY3Rpb24pXG5cdH1cblxuXHQvKiogaWYgdGhlcmUgYXJlIHVwZGF0ZSB3b3J0aHkgY2hhbmdlcyBvbiB0aGUgbW9kZWwsIGFzayB0aGUgdXNlciB3aGF0IHRvIGRvIHdpdGggdGhlbS5cblx0ICogQHJldHVybnMge0NvbmZpcm1hdGlvblJlc3VsdH0gQ2FuY2VsIGlmIHRoZSB3aG9sZSBwcm9jZXNzIHNob3VsZCBiZSBjYW5jZWxsZWQsIENvbnRpbnVlIGlmIHRoZSB1c2VyIHNlbGVjdGVkIHdoZXRoZXIgdG8gc2VuZCB1cGRhdGVzIGFuZCB0aGUgc2F2aW5nXG5cdCAqIHNob3VsZCBwcm9jZWVkLlxuXHQgKiAqL1xuXHRhc3luYyBhc2tVc2VySWZVcGRhdGVzQXJlTmVlZGVkT3JDYW5jZWwobW9kZWw6IENhbGVuZGFyRXZlbnRNb2RlbCk6IFByb21pc2U8Q29uZmlybWF0aW9uUmVzdWx0PiB7XG5cdFx0aWYgKG1vZGVsLmlzQXNraW5nRm9yVXBkYXRlc05lZWRlZCgpKSB7XG5cdFx0XHRzd2l0Y2ggKGF3YWl0IGFza0lmU2hvdWxkU2VuZENhbGVuZGFyVXBkYXRlc1RvQXR0ZW5kZWVzKCkpIHtcblx0XHRcdFx0Y2FzZSBcInllc1wiOlxuXHRcdFx0XHRcdG1vZGVsLmVkaXRNb2RlbHMud2hvTW9kZWwuc2hvdWxkU2VuZFVwZGF0ZXMgPSB0cnVlXG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0Y2FzZSBcIm5vXCI6XG5cdFx0XHRcdFx0YnJlYWtcblx0XHRcdFx0Y2FzZSBcImNhbmNlbFwiOlxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwibm90IHNhdmluZyBldmVudDogdXNlciBjYW5jZWxsZWQgdXBkYXRlIHNlbmRpbmcuXCIpXG5cdFx0XHRcdFx0cmV0dXJuIENvbmZpcm1hdGlvblJlc3VsdC5DYW5jZWxcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gQ29uZmlybWF0aW9uUmVzdWx0LkNvbnRpbnVlXG5cdH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBc0JhLE9BQU4sTUFBZ0Q7Q0FDdEQsS0FBSyxFQUFFLE9BQU8sVUFBa0MsRUFBMEI7QUFDekUsU0FBTyxpQkFDTCxFQUFFLE1BQU0sbUJBQW1CLE1BQU0seUJBQ2xDO0dBQ0MsT0FBTyxNQUFNLFNBQVMsS0FBSyxJQUFJO0dBQy9CLE9BQU8sTUFBTTtFQUNiLEdBQ0QsU0FDQTtDQUNEO0FBQ0Q7Ozs7SUN3RVksU0FBTixNQUE2RjtDQUNuRyxBQUFRLGFBQXNCO0NBQzlCLEFBQVE7Q0FDUixBQUFRLE1BQWM7Q0FFdEIsS0FBSyxFQUNKLE9BQU8sRUFDTixVQUNBLFNBQ0EsY0FDQSxlQUNBLFNBQ0EsVUFDQSxhQUNBLFVBQ0EsVUFDQSxXQUNBLFdBQ0EsSUFDQSxRQUNBLFdBQ0EsVUFDQSxTQUNBLGtCQUNBLEVBQ29DLEVBQUU7QUFDdkMsU0FBTyxnQkFDTiwwQ0FDQTtHQUNDO0dBQ0EsT0FBTyxLQUFLLGVBQWUsU0FBUyxVQUFVLFNBQVM7R0FDdkQsU0FBUyxDQUFDQSxVQUNULE1BQU0saUJBQ04sS0FBSyxlQUNKLFNBQ0EsTUFBTSxlQUNOLFVBQ0EsY0FDQSxhQUFhLE9BQ2IsVUFBVSxPQUNWLFNBQ0EsaUJBQ0E7R0FDRixNQUFNLFNB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