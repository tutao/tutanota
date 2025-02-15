import { __toESM } from "./chunk-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertMainOrNode } from "./Env-chunk.js";
import { client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { assertNotNull, delay, downcast, filterNull, getAsLazy, identity, lazyMemoized, makeSingleUse, mapLazily, neverNull, noOp, resolveMaybeLazy } from "./dist2-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { AlphaEnum, DefaultAnimationTime, TransformEnum, alpha, animations, ease, opacity, styles, transform } from "./styles-chunk.js";
import { getElevatedBackground, isColorLight, theme } from "./theme-chunk.js";
import { DEFAULT_ERROR, Keys, TabIndex } from "./TutanotaConstants-chunk.js";
import { focusNext, focusPrevious, isKeyPressed, keyManager, useKeyHandler } from "./KeyManager-chunk.js";
import { windowFacade } from "./WindowFacade-chunk.js";
import { modal } from "./RootView-chunk.js";
import { px, size } from "./size-chunk.js";
import { getSafeAreaInsetBottom, getSafeAreaInsetTop } from "./HtmlUtils-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { isOfflineError } from "./ErrorUtils-chunk.js";
import { BaseButton, Button, ButtonColor, ButtonType } from "./Button-chunk.js";
import { HabReminderImage, Icons } from "./Icons-chunk.js";
import { DialogHeaderBar } from "./DialogHeaderBar-chunk.js";
import { Countries } from "./CountryList-chunk.js";
import { BootIcons, Icon, IconSize } from "./Icon-chunk.js";
import { AriaRole, AriaWindow } from "./AriaUtils-chunk.js";
import { ButtonSize, IconButton } from "./IconButton-chunk.js";

//#region src/common/gui/base/PureComponent.ts
function pureComponent(factory) {
	return { view(vnode) {
		return factory(vnode.attrs, vnode.children);
	} };
}

//#endregion
//#region src/common/gui/base/buttons/RowButton.ts
var RowButton = class {
	view(vnode) {
		const attrs = vnode.attrs;
		const label = lang.getTranslationText(attrs.label);
		const text = lang.getTranslationText(attrs.text ?? attrs.label);
		const color = attrs.selected ? theme.content_button_selected : theme.content_button;
		return mithril_default(BaseButton, {
			label: attrs.label,
			text: mithril_default(".plr-button.text-ellipsis", {
				style: { color },
				ariaHidden: label !== text
			}, text),
			role: attrs.role,
			selected: attrs.selected,
			icon: attrs.icon && attrs.icon !== "none" ? mithril_default(Icon, {
				icon: attrs.icon,
				container: "div",
				class: "mr-button",
				style: { fill: color },
				size: IconSize.Medium
			}) : attrs.icon === "none" ? mithril_default(".icon-large.mr-button") : null,
			class: "flex items-center state-bg button-content plr-button " + attrs.class,
			style: {
				...attrs.style,
				color
			},
			onclick: attrs.onclick
		});
	}
};

//#endregion
//#region src/common/gui/base/Dropdown.ts
assertMainOrNode();
/**
* Renders small info message inside the dropdown.
*/
const DropdownInfo = pureComponent(({ center, bold, info }) => {
	return mithril_default(".dropdown-info.text-break.selectable" + (center ? ".center" : "") + (bold ? ".b" : ""), info);
});
function isDropDownInfo(dropdownChild) {
	return Object.hasOwn(dropdownChild, "info") && Object.hasOwn(dropdownChild, "center") && Object.hasOwn(dropdownChild, "bold");
}
var DomRectReadOnlyPolyfilled = class {
	x;
	y;
	width;
	height;
	constructor(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	get top() {
		return this.height > 0 ? this.y : this.y + this.height;
	}
	get bottom() {
		return this.height > 0 ? this.y + this.height : this.y;
	}
	get left() {
		return this.width > 0 ? this.x : this.x + this.width;
	}
	get right() {
		return this.width > 0 ? this.x + this.width : this.x;
	}
};
var Dropdown = class Dropdown {
	children;
	domDropdown = null;
	origin = null;
	oninit;
	view;
	width;
	shortcuts;
	filterString;
	domInput = null;
	domContents = null;
	isFilterable = false;
	maxHeight = null;
	closeHandler = null;
	focusedBeforeShown = document.activeElement;
	constructor(lazyChildren, width) {
		this.children = [];
		this.width = width;
		this.filterString = "";
		this.oninit = () => {
			this.children = filterNull(lazyChildren());
			this.isFilterable = this.children.length > 10;
			this.children.map((child) => {
				if (isDropDownInfo(child)) return child;
				const buttonChild = child;
				buttonChild.click = this.wrapClick(child.click ? child.click : () => null);
				return child;
			});
		};
		let _shortcuts = this._createShortcuts();
		this.shortcuts = () => {
			return _shortcuts;
		};
		const inputField = () => {
			return this.isFilterable ? mithril_default("input.input.dropdown-bar.elevated-bg.doNotClose.button-height.button-min-height.pr-s", {
				placeholder: lang.get("typeToFilter_label"),
				oncreate: (vnode) => {
					this.domInput = downcast(vnode.dom);
					this.domInput.value = this.filterString;
				},
				oninput: () => {
					this.filterString = neverNull(this.domInput).value;
				},
				style: { paddingLeft: px(size.hpad_large * 2) }
			}, this.filterString) : null;
		};
		const contents = () => {
			const showingIcons = this.children.some((c) => "icon" in c && typeof c.icon !== "undefined");
			return mithril_default(".dropdown-content.scroll", {
				role: AriaRole.Menu,
				tabindex: TabIndex.Programmatic,
				oncreate: (vnode) => {
					this.domContents = vnode.dom;
				},
				onupdate: (vnode) => {
					if (this.maxHeight == null) {
						const children = Array.from(vnode.dom.children);
						this.maxHeight = children.reduce((accumulator, children$1) => accumulator + children$1.offsetHeight, 0) + size.vpad;
						if (this.origin) showDropdown(this.origin, assertNotNull(this.domDropdown), this.maxHeight, this.width).then(() => {
							const firstButton = vnode.dom.getElementsByTagName("button").item(0);
							if (this.domInput && !client.isMobileDevice()) this.domInput.focus();
else if (firstButton !== null) firstButton.focus();
else this.domContents?.focus();
						});
					}
				},
				onscroll: (ev) => {
					const target = ev.target;
					ev.redraw = this.domContents != null && target.scrollTop < 0 && target.scrollTop + this.domContents.offsetHeight > target.scrollHeight;
				},
				style: {
					top: px(this.getFilterHeight()),
					bottom: 0
				}
			}, this.visibleChildren().map((child) => {
				if (isDropDownInfo(child)) return mithril_default(DropdownInfo, child);
else return Dropdown.renderDropDownButton(child, showingIcons);
			}));
		};
		const closeBtn = () => {
			return mithril_default(BaseButton, {
				label: "close_alt",
				text: lang.get("close_alt"),
				class: "hidden-until-focus content-accent-fg button-content",
				onclick: () => {
					this.onClose();
				}
			});
		};
		this.view = () => {
			return mithril_default(".dropdown-panel.elevated-bg.border-radius.dropdown-shadow.fit-content.flex-column.flex-start", {
				oncreate: (vnode) => {
					this.domDropdown = vnode.dom;
					this.domDropdown.style.opacity = "0";
				},
				onkeypress: () => {
					if (this.domInput) this.domInput.focus();
				}
			}, [
				inputField(),
				contents(),
				closeBtn()
			]);
		};
	}
	static renderDropDownButton(child, showingIcons) {
		return mithril_default(RowButton, {
			role: AriaRole.Option,
			selected: child.selected,
			label: child.label,
			text: child.text,
			icon: child.icon && showingIcons ? child.icon : showingIcons ? "none" : undefined,
			class: "dropdown-button",
			onclick: child.click ? child.click : noOp
		});
	}
	wrapClick(fn) {
		return (e, dom) => {
			const r = fn(e, dom);
			this.close();
			return r;
		};
	}
	backgroundClick(e) {
		if (this.domDropdown && !e.target.classList.contains("doNotClose") && (this.domDropdown.contains(e.target) || this.domDropdown.parentNode === e.target)) this.onClose();
	}
	_createShortcuts() {
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
			},
			{
				key: Keys.RETURN,
				exec: () => this.chooseMatch(),
				help: "ok_action"
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
	onClose() {
		if (this.closeHandler) this.closeHandler();
else this.close();
	}
	popState(e) {
		this.onClose();
		return false;
	}
	callingElement() {
		return this.focusedBeforeShown;
	}
	chooseMatch = () => {
		const filterString = this.filterString.toLowerCase();
		let visibleElements = downcast(this.visibleChildren().filter((b) => !isDropDownInfo(b)));
		let matchingButton = visibleElements.length === 1 ? visibleElements[0] : visibleElements.find((b) => lang.getTranslationText(b.label).toLowerCase() === filterString);
		if (this.domInput && document.activeElement === this.domInput && matchingButton && matchingButton.click) {
			matchingButton.click(new MouseEvent("click"), this.domInput);
			return false;
		}
		return true;
	};
	/**
	* Is invoked from modal as the two animations (background layer opacity and dropdown) should run in parallel
	*/
	hideAnimation() {
		return Promise.resolve();
	}
	setCloseHandler(handler) {
		this.closeHandler = handler;
		return this;
	}
	visibleChildren() {
		return this.children.filter((b) => {
			if (isDropDownInfo(b)) return b.info.includes(this.filterString.toLowerCase());
else if (this.isFilterable) {
				const filterable = lang.getTranslationText(b.text ?? b.label);
				return filterable.toLowerCase().includes(this.filterString.toLowerCase());
			} else return true;
		});
	}
	getFilterHeight() {
		return this.isFilterable ? size.button_height + size.vpad_xs : 0;
	}
};
function createDropdown({ lazyButtons, overrideOrigin, width, withBackground }) {
	return createAsyncDropdown({
		lazyButtons: async () => lazyButtons(),
		overrideOrigin,
		width,
		withBackground
	});
}
function createAsyncDropdown({ lazyButtons, overrideOrigin, width = 200, withBackground = false, onClose = undefined }) {
	return (_, dom) => {
		const originalButtons = lazyButtons();
		let buttonsResolved = false;
		originalButtons.then(() => {
			buttonsResolved = true;
		});
		let buttons = originalButtons;
		buttons = Promise.race([originalButtons, Promise.all([delay(100), import("./ProgressDialog2-chunk.js")]).then(([_$1, module]) => {
			if (!buttonsResolved) return module.showProgressDialog("loading_msg", originalButtons);
else return originalButtons;
		})]);
		buttons.then((buttons$1) => {
			let dropdown = new Dropdown(() => buttons$1, width);
			if (onClose) dropdown.setCloseHandler(() => {
				onClose();
				dropdown.close();
			});
			let buttonRect;
			if (overrideOrigin) buttonRect = overrideOrigin(dom.getBoundingClientRect());
else buttonRect = dom.getBoundingClientRect();
			dropdown.setOrigin(buttonRect);
			modal.displayUnique(dropdown, withBackground);
		});
	};
}
function showDropdownAtPosition(buttons, xPos, yPos, closeHandler = noOp, width = 200) {
	const dropdown = new Dropdown(() => buttons, width);
	const close = makeSingleUse(() => {
		closeHandler();
		dropdown.close();
	});
	dropdown.setOrigin(new DomRectReadOnlyPolyfilled(xPos, yPos, 0, 0));
	dropdown.setCloseHandler(close);
	modal.displayUnique(dropdown, false);
}
function attachDropdown({ mainButtonAttrs, childAttrs, showDropdown: showDropdown$1 = () => true, width, overrideOrigin, onClose }) {
	return Object.assign({}, mainButtonAttrs, { click: (e, dom) => {
		if (showDropdown$1()) {
			const dropDownFn = createAsyncDropdown({
				lazyButtons: () => Promise.resolve(childAttrs()),
				overrideOrigin,
				width,
				onClose
			});
			dropDownFn(e, dom);
			e.stopPropagation();
		}
	} });
}
const DROPDOWN_MARGIN = 4;
function showDropdown(origin, domDropdown, contentHeight, contentWidth, position) {
	const leftEdgeOfElement = origin.left;
	const rightEdgeOfElement = origin.right;
	const bottomEdgeOfElement = origin.bottom;
	const topEdgeOfElement = origin.top;
	const upperSpace = origin.top - getSafeAreaInsetTop();
	const lowerSpace = window.innerHeight - origin.bottom - getSafeAreaInsetBottom();
	const leftSpace = origin.left;
	const rightSpace = window.innerWidth - origin.right;
	let transformOrigin = "";
	let maxHeight;
	const showBelow = !position && lowerSpace > upperSpace || position === "bottom";
	if (showBelow) {
		transformOrigin += "top";
		domDropdown.style.top = bottomEdgeOfElement + "px";
		domDropdown.style.bottom = "";
		maxHeight = Math.min(contentHeight, lowerSpace);
	} else {
		transformOrigin += "bottom";
		domDropdown.style.top = "";
		domDropdown.style.bottom = px(window.innerHeight - topEdgeOfElement);
		maxHeight = Math.min(contentHeight, upperSpace);
	}
	transformOrigin += leftSpace < rightSpace ? " left" : " right";
	const dropdownMaxWidth = window.innerWidth - DROPDOWN_MARGIN * 2;
	const dropdownWidth = Math.max(contentWidth, domDropdown.getBoundingClientRect().width);
	let width = dropdownWidth;
	let leftStyle = null;
	let rightStyle = null;
	if (width >= dropdownMaxWidth) {
		domDropdown.classList.remove("fit-content");
		leftStyle = DROPDOWN_MARGIN;
		width = dropdownMaxWidth;
	} else if (leftSpace < rightSpace) {
		const availableSpaceForDropdown = window.innerWidth - leftEdgeOfElement;
		let leftEdgeOfDropdown = leftEdgeOfElement;
		if (availableSpaceForDropdown < dropdownWidth) {
			const shiftForDropdown = leftEdgeOfDropdown + dropdownWidth - window.innerWidth + DROPDOWN_MARGIN;
			leftEdgeOfDropdown = leftEdgeOfElement - shiftForDropdown;
		}
		leftStyle = Math.max(DROPDOWN_MARGIN, leftEdgeOfDropdown);
	} else {
		const availableSpaceForDropdown = origin.right;
		let rightEdgeOfDropdown = rightEdgeOfElement;
		if (availableSpaceForDropdown < dropdownWidth) {
			const shiftForDropdown = dropdownWidth - rightEdgeOfDropdown + DROPDOWN_MARGIN;
			rightEdgeOfDropdown = rightEdgeOfElement + shiftForDropdown;
		}
		rightStyle = Math.max(DROPDOWN_MARGIN, window.innerWidth - rightEdgeOfDropdown);
	}
	domDropdown.style.left = leftStyle != null ? px(leftStyle) : "";
	domDropdown.style.right = rightStyle != null ? px(rightStyle) : "";
	domDropdown.style.width = px(width);
	domDropdown.style.height = px(maxHeight);
	domDropdown.style.transformOrigin = transformOrigin;
	return animations.add(domDropdown, [opacity(0, 1, true), transform(TransformEnum.Scale, .5, 1)], { easing: ease.out });
}

//#endregion
//#region src/common/gui/base/DropDownSelector.ts
assertMainOrNode();
var DropDownSelector = class {
	view(vnode) {
		const a = vnode.attrs;
		return mithril_default(TextField, {
			label: a.label,
			value: this.valueToText(a, a.selectedValue) || "",
			helpLabel: a.helpLabel,
			isReadOnly: true,
			onclick: a.disabled ? noOp : this.createDropdown(a),
			class: "click " + (a.class == null ? "mt" : a.class) + " " + getOperatingClasses(a.disabled),
			style: a.style,
			injectionsRight: () => a.disabled ? null : mithril_default(".flex.items-center.justify-center", { style: {
				width: "30px",
				height: "30px"
			} }, mithril_default(IconButton, {
				icon: a.icon ? a.icon : BootIcons.Expand,
				title: "show_action",
				click: a.disabled ? noOp : this.createDropdown(a),
				size: ButtonSize.Compact
			})),
			doShowBorder: a.doShowBorder
		});
	}
	createDropdown(a) {
		return createDropdown({
			lazyButtons: () => {
				return a.items.filter((item) => item.selectable !== false).map((item) => {
					return {
						label: lang.makeTranslation(item.name, item.name),
						click: () => {
							a.selectionChangedHandler?.(item.value);
							mithril_default.redraw();
						},
						selected: a.selectedValue === item.value
					};
				});
			},
			width: a.dropdownWidth
		});
	}
	valueToText(a, value) {
		if (a.selectedValueDisplay) return a.selectedValueDisplay;
		const selectedItem = a.items.find((item) => item.value === a.selectedValue);
		if (selectedItem) return selectedItem.name;
else {
			console.log(`Dropdown ${lang.getTranslationText(a.label)} couldn't find element for value: ${String(JSON.stringify(value))}`);
			return null;
		}
	}
};

//#endregion
//#region src/common/gui/base/GuiUtils.ts
let DropType = function(DropType$1) {
	DropType$1["ExternalFile"] = "ExternalFile";
	DropType$1["Mail"] = "Mail";
	return DropType$1;
}({});
const dropdownCountries = lazyMemoized(() => Countries.map((c) => ({
	value: c,
	name: c.n
})));
function renderCountryDropdown(params) {
	return mithril_default(DropDownSelector, {
		label: params.label ?? "invoiceCountry_label",
		helpLabel: params.helpLabel,
		items: [...dropdownCountries(), {
			value: null,
			name: lang.get("choose_label")
		}],
		selectedValue: params.selectedCountry,
		selectionChangedHandler: params.onSelectionChanged
	});
}
function createMoreActionButtonAttrs(lazyChildren, dropdownWidth) {
	return {
		title: "more_label",
		colors: ButtonColor.Nav,
		icon: Icons.More,
		click: createAsyncDropdown({
			width: dropdownWidth,
			lazyButtons: async () => resolveMaybeLazy(lazyChildren)
		})
	};
}
function getConfirmation(message, confirmMessage = "ok_action") {
	const confirmationPromise = Dialog.confirm(message, confirmMessage);
	const confirmation = {
		confirmed(action) {
			confirmationPromise.then((ok) => {
				if (ok) action();
			});
			return confirmation;
		},
		cancelled(action) {
			confirmationPromise.then((ok) => {
				if (!ok) action();
			});
			return confirmation;
		},
		result: confirmationPromise
	};
	return confirmation;
}
function getCoordsOfMouseOrTouchEvent(event) {
	return event instanceof MouseEvent ? {
		x: event.clientX,
		y: event.clientY
	} : {
		x: assertNotNull(event.touches.item(0)).clientX,
		y: assertNotNull(event.touches.item(0)).clientY
	};
}
function makeListSelectionChangedScrollHandler(scrollDom, entryHeight, getSelectedEntryIndex) {
	return function() {
		scrollListDom(scrollDom, entryHeight, getSelectedEntryIndex());
	};
}
function scrollListDom(scrollDom, entryHeight, selectedIndex) {
	const scrollWindowHeight = scrollDom.getBoundingClientRect().height;
	const scrollOffset = scrollDom.scrollTop;
	const selectedTop = entryHeight * selectedIndex;
	const selectedBottom = selectedTop + entryHeight;
	const selectedRelativeTop = selectedTop - scrollOffset;
	const selectedRelativeBottom = selectedBottom - scrollOffset;
	if (selectedRelativeTop < 0) scrollDom.scrollTop = selectedTop;
else if (selectedRelativeBottom > scrollWindowHeight) scrollDom.scrollTop = selectedBottom - scrollWindowHeight;
}
function ifAllowedTutaLinks(logins, linkId, render) {
	if (canSeeTutaLinks(logins)) return render(linkId);
	return null;
}
function canSeeTutaLinks(logins) {
	return !logins.isWhitelabel() || logins.getUserController().isGlobalAdmin();
}
function getPosAndBoundsFromMouseEvent({ currentTarget, x, y }) {
	if (currentTarget instanceof HTMLElement) {
		const { height, width, left, top } = currentTarget.getBoundingClientRect();
		return {
			targetHeight: height,
			targetWidth: width,
			x: x - left,
			y: y - top
		};
	} else throw new ProgrammingError("Target is not a HTMLElement");
}
function encodeSVG(svg) {
	return "data:image/svg+xml;utf8," + svg.replace(/"/g, "'").replace(/#/g, "%23").replace(/\s+/g, " ");
}
function getOperatingClasses(isDisabled, cursorClass) {
	const cursorClassOrDefault = cursorClass ? cursorClass : "";
	return isDisabled ? "disabled click-disabled" : cursorClassOrDefault;
}
function getIfLargeScroll(oldPosition, newPosition) {
	if (oldPosition === null || newPosition === null) return false;
	const difference = Math.abs(oldPosition - newPosition);
	return difference > 10;
}
function getContactTitle(contact) {
	const title = contact.title ? `${contact.title} ` : "";
	const middleName = contact.middleName != null ? ` ${contact.middleName} ` : " ";
	const fullName = `${contact.firstName}${middleName}${contact.lastName} `;
	const suffix = contact.nameSuffix ?? "";
	return (title + fullName + suffix).trim();
}
function colorForBg(color) {
	return isColorLight(color) ? "black" : "white";
}

//#endregion
//#region src/common/gui/base/TextField.ts
let TextFieldType = function(TextFieldType$1) {
	TextFieldType$1["Text"] = "text";
	TextFieldType$1["Email"] = "email";
	/** @deprecated Prefer the `PasswordField` component over using this type with `TextField` */
	TextFieldType$1["Password"] = "password";
	TextFieldType$1["Area"] = "area";
	TextFieldType$1["Number"] = "number";
	TextFieldType$1["Url"] = "url";
	TextFieldType$1["Date"] = "date";
	TextFieldType$1["Time"] = "time";
	return TextFieldType$1;
}({});
let Autocomplete = function(Autocomplete$1) {
	Autocomplete$1["off"] = "off";
	Autocomplete$1["email"] = "email";
	Autocomplete$1["username"] = "username";
	Autocomplete$1["newPassword"] = "new-password";
	Autocomplete$1["currentPassword"] = "current-password";
	Autocomplete$1["oneTimeCode"] = "one-time-code";
	Autocomplete$1["ccNumber"] = "cc-number";
	Autocomplete$1["ccCsc"] = "cc-csc";
	Autocomplete$1["ccExp"] = "cc-exp";
	return Autocomplete$1;
}({});
let Autocapitalize = function(Autocapitalize$1) {
	Autocapitalize$1["none"] = "none";
	return Autocapitalize$1;
}({});
const inputLineHeight = size.font_size_base + 8;
const inputMarginTop = size.font_size_small + size.hpad_small + 3;
const baseLabelPosition = 21;
const minInputHeight = 46;
var TextField = class {
	active;
	onblur = null;
	domInput;
	_domWrapper;
	_domLabel;
	_domInputWrapper;
	_didAutofill;
	constructor() {
		this.active = false;
	}
	view(vnode) {
		const a = vnode.attrs;
		const maxWidth = a.maxWidth;
		const labelBase = !this.active && a.value === "" && !a.isReadOnly && !this._didAutofill && !a.injectionsLeft;
		const labelTransitionSpeed = DefaultAnimationTime / 2;
		const doShowBorder = a.doShowBorder !== false;
		const borderWidth = this.active ? "2px" : "1px";
		const borderColor = this.active ? theme.content_accent : theme.content_border;
		return mithril_default(".text-field.rel.overflow-hidden", {
			id: vnode.attrs.id,
			oncreate: (vnode$1) => this._domWrapper = vnode$1.dom,
			onclick: (e) => a.onclick ? a.onclick(e, this._domInputWrapper) : this.focus(e, a),
			"aria-haspopup": a.hasPopup,
			class: a.class != null ? a.class : "pt " + getOperatingClasses(a.disabled),
			style: maxWidth ? {
				maxWidth: px(maxWidth),
				...a.style
			} : { ...a.style }
		}, [
			mithril_default("label.abs.text-ellipsis.noselect.z1.i.pr-s", {
				"aria-hidden": "true",
				class: this.active ? "content-accent-fg" : " " + getOperatingClasses(a.disabled),
				oncreate: (vnode$1) => {
					this._domLabel = vnode$1.dom;
				},
				style: {
					fontSize: `${labelBase ? size.font_size_base : size.font_size_small}px`,
					transform: `translateY(${labelBase ? baseLabelPosition : 0}px)`,
					transition: `transform ${labelTransitionSpeed}ms ease-out, font-size ${labelTransitionSpeed}ms  ease-out`
				}
			}, lang.getTranslationText(a.label)),
			mithril_default(".flex.flex-column", [mithril_default(".flex.items-end.flex-wrap", { style: {
				"min-height": px(minInputHeight),
				"padding-bottom": this.active ? px(0) : px(1),
				"border-bottom": doShowBorder ? `${borderWidth} solid ${borderColor}` : ""
			} }, [a.injectionsLeft ? a.injectionsLeft() : null, mithril_default(".inputWrapper.flex-space-between.items-end", {
				style: { minHeight: px(minInputHeight - 2) },
				oncreate: (vnode$1) => this._domInputWrapper = vnode$1.dom
			}, [a.type !== TextFieldType.Area ? this._getInputField(a) : this._getTextArea(a), a.injectionsRight ? mithril_default(".flex-end.items-center", { style: { minHeight: px(minInputHeight - 2) } }, a.injectionsRight()) : null])])]),
			a.helpLabel ? mithril_default("small.noselect", { onclick: (e) => {
				e.stopPropagation();
			} }, a.helpLabel()) : []
		]);
	}
	_getInputField(a) {
		if (a.isReadOnly) return mithril_default(".text-break.selectable", {
			style: {
				marginTop: px(inputMarginTop),
				lineHeight: px(inputLineHeight)
			},
			"data-testid": `tf:${lang.getTestId(a.label)}`
		}, a.value);
else {
			const autofillGuard = a.autocompleteAs === Autocomplete.off ? [
				mithril_default("input.abs", {
					style: {
						opacity: "0",
						height: "0"
					},
					tabIndex: TabIndex.Programmatic,
					type: TextFieldType.Text
				}),
				mithril_default("input.abs", {
					style: {
						opacity: "0",
						height: "0"
					},
					tabIndex: TabIndex.Programmatic,
					type: TextFieldType.Password
				}),
				mithril_default("input.abs", {
					style: {
						opacity: "0",
						height: "0"
					},
					tabIndex: TabIndex.Programmatic,
					type: TextFieldType.Text
				})
			] : [];
			return mithril_default(".flex-grow.rel", autofillGuard.concat([mithril_default("input.input" + (a.alignRight ? ".right" : ""), {
				autocomplete: a.autocompleteAs ?? "",
				autocapitalize: a.autocapitalize,
				type: a.type,
				min: a.min,
				max: a.max,
				"aria-label": lang.getTranslationText(a.label),
				disabled: a.disabled,
				class: getOperatingClasses(a.disabled) + " text",
				oncreate: (vnode) => {
					this.domInput = vnode.dom;
					a.onDomInputCreated?.(this.domInput);
					this.domInput.value = a.value;
					if (a.type !== TextFieldType.Area) vnode.dom.addEventListener("animationstart", (e) => {
						if (e.animationName === "onAutoFillStart") {
							this._didAutofill = true;
							mithril_default.redraw();
						} else if (e.animationName === "onAutoFillCancel") {
							this._didAutofill = false;
							mithril_default.redraw();
						}
					});
				},
				onfocus: (e) => {
					this.focus(e, a);
					a.onfocus?.(this._domWrapper, this.domInput);
				},
				onblur: (e) => this.blur(e, a),
				onkeydown: (e) => {
					const handled = useKeyHandler(e, a.keyHandler);
					if (!isKeyPressed(e.key, Keys.F1, Keys.TAB, Keys.ESC)) e.stopPropagation();
					return handled;
				},
				onupdate: () => {
					if (this.domInput.value !== a.value) this.domInput.value = a.value;
				},
				oninput: () => {
					a.oninput?.(this.domInput.value, this.domInput);
				},
				onremove: () => {
					if (this.domInput) this.domInput.value = "";
				},
				style: {
					maxWidth: a.maxWidth,
					minWidth: px(20),
					lineHeight: px(inputLineHeight),
					fontSize: a.fontSize
				},
				"data-testid": `tf:${lang.getTestId(a.label)}`
			})]));
		}
	}
	_getTextArea(a) {
		if (a.isReadOnly) return mithril_default(".text-prewrap.text-break.selectable", { style: {
			marginTop: px(inputMarginTop),
			lineHeight: px(inputLineHeight)
		} }, a.value);
else return mithril_default("textarea.input-area.text-pre", {
			"aria-label": lang.getTranslationText(a.label),
			disabled: a.disabled,
			autocapitalize: a.autocapitalize,
			class: getOperatingClasses(a.disabled) + " text",
			oncreate: (vnode) => {
				this.domInput = vnode.dom;
				this.domInput.value = a.value;
				this.domInput.style.height = px(Math.max(a.value.split("\n").length, 1) * inputLineHeight);
			},
			onfocus: (e) => this.focus(e, a),
			onblur: (e) => this.blur(e, a),
			onkeydown: (e) => useKeyHandler(e, a.keyHandler),
			oninput: () => {
				this.domInput.style.height = "0px";
				this.domInput.style.height = px(this.domInput.scrollHeight);
				a.oninput?.(this.domInput.value, this.domInput);
			},
			onupdate: () => {
				if (this.domInput.value !== a.value) this.domInput.value = a.value;
			},
			style: {
				marginTop: px(inputMarginTop),
				lineHeight: px(inputLineHeight),
				minWidth: px(20),
				fontSize: a.fontSize
			}
		});
	}
	focus(e, a) {
		if (!this.active && !a.disabled && !a.isReadOnly) {
			this.active = true;
			this.domInput.focus();
			this._domWrapper.classList.add("active");
		}
	}
	blur(e, a) {
		this._domWrapper.classList.remove("active");
		this.active = false;
		if (a.onblur instanceof Function) a.onblur(e);
	}
	isEmpty(value) {
		return value === "";
	}
};

//#endregion
//#region src/common/gui/base/DialogInjectionRight.ts
var DialogInjectionRight = class {
	view({ attrs }) {
		const { component, componentAttrs } = attrs;
		if (attrs.visible()) return mithril_default(".flex-grow-shrink-auto.flex-transition.ml-s.rel.dialog.dialog-width-m.elevated-bg.dropdown-shadow.border-radius", [mithril_default(DialogHeaderBar, resolveMaybeLazy(attrs.headerAttrs)), mithril_default(".dialog-container.scroll.plr-l", mithril_default(component, componentAttrs))]);
else return mithril_default(".flex-hide.flex-transition.rel", { style: { maxWidth: px(0) } });
	}
};

//#endregion
//#region src/common/gui/base/Dialog.ts
var import_stream = __toESM(require_stream(), 1);
assertMainOrNode();
const INPUT = "input, textarea, div[contenteditable='true']";
let DialogType = function(DialogType$1) {
	DialogType$1["Progress"] = "Progress";
	DialogType$1["Alert"] = "Alert";
	DialogType$1["Reminder"] = "Reminder";
	DialogType$1["EditSmall"] = "EditSmall";
	DialogType$1["EditMedium"] = "EditMedium";
	DialogType$1["EditLarger"] = "EditLarger";
	DialogType$1["EditLarge"] = "EditLarge";
	return DialogType$1;
}({});
var Dialog = class Dialog {
	static keyboardHeight = 0;
	domDialog = null;
	_shortcuts;
	view;
	visible;
	focusOnLoadFunction;
	wasFocusOnLoadCalled;
	closeHandler = null;
	focusedBeforeShown = null;
	injectionRightAttrs = null;
	constructor(dialogType, childComponent) {
		this.visible = false;
		this.focusOnLoadFunction = () => this.defaultFocusOnLoad(assertNotNull(this.domDialog));
		this.wasFocusOnLoadCalled = false;
		this._shortcuts = [{
			key: Keys.TAB,
			shift: true,
			exec: () => this.domDialog ? focusPrevious(this.domDialog) : false,
			help: "selectPrevious_action"
		}, {
			key: Keys.TAB,
			shift: false,
			exec: () => this.domDialog ? focusNext(this.domDialog) : false,
			help: "selectNext_action"
		}];
		this.view = () => {
			const marginPx = px(size.hpad);
			const isEditLarge = dialogType === DialogType.EditLarge;
			const sidesMargin = styles.isSingleColumnLayout() && isEditLarge ? "4px" : marginPx;
			return mithril_default(
				this.getDialogWrapperClasses(dialogType),
				{ style: {
					paddingTop: "env(safe-area-inset-top)",
					paddingLeft: "env(safe-area-inset-left)",
					paddingRight: "env(safe-area-inset-right)"
				} },
				/** controls vertical alignment
				* we need overflow-hidden (actually resulting in min-height: 0 instead of auto)
				* here because otherwise the content of the dialog may make this wrapper grow bigger outside
				* the window on some browsers, e.g. upgrade reminder on Firefox mobile */
				mithril_default(".flex.justify-center.align-self-stretch.rel.overflow-hidden" + (isEditLarge ? ".flex-grow" : ".transition-margin"), { style: {
					marginTop: marginPx,
					marginLeft: sidesMargin,
					marginRight: sidesMargin,
					"margin-bottom": Dialog.keyboardHeight > 0 ? px(Dialog.keyboardHeight) : isEditLarge ? 0 : marginPx
				} }, [mithril_default(this.getDialogStyle(dialogType), {
					role: AriaWindow.Dialog,
					"aria-modal": "true",
					"aria-labelledby": "dialog-title",
					"aria-describedby": "dialog-message",
					onclick: (e) => e.stopPropagation(),
					oncreate: (vnode) => {
						this.domDialog = vnode.dom;
						let animation = null;
						if (isEditLarge) {
							this.domDialog.style.transform = `translateY(${window.innerHeight}px)`;
							animation = animations.add(this.domDialog, transform(TransformEnum.TranslateY, window.innerHeight, 0));
						} else {
							const bgcolor = getElevatedBackground();
							const children = Array.from(this.domDialog.children);
							for (let child of children) child.style.opacity = "0";
							this.domDialog.style.backgroundColor = `rgba(0, 0, 0, 0)`;
							animation = Promise.all([animations.add(this.domDialog, alpha(AlphaEnum.BackgroundColor, bgcolor, 0, 1)), animations.add(children, opacity(0, 1, true), { delay: DefaultAnimationTime / 2 })]);
						}
						window.requestAnimationFrame(() => {
							const activeElement = document.activeElement;
							if (activeElement && typeof activeElement.blur === "function") activeElement.blur();
						});
						animation.then(() => {
							this.focusOnLoadFunction(assertNotNull(this.domDialog));
							this.wasFocusOnLoadCalled = true;
							if (this.domDialog != null && !isEditLarge) this.domDialog.style.removeProperty("background-color");
						});
					}
				}, mithril_default(childComponent)), this.injectionRightAttrs ? mithril_default(DialogInjectionRight, this.injectionRightAttrs) : null])
);
		};
	}
	setInjectionRight(injectionRightAttrs) {
		this.injectionRightAttrs = injectionRightAttrs;
	}
	defaultFocusOnLoad(dom) {
		const inputs = Array.from(dom.querySelectorAll(INPUT));
		const scrollableWrapper = dom.querySelector(".dialog-container.scroll");
		if (inputs.length > 0) inputs[0].focus();
else if (!scrollableWrapper) {
			let button = dom.querySelector("button");
			if (button) button.focus();
		} else {
			scrollableWrapper.tabIndex = Number(TabIndex.Default);
			scrollableWrapper.focus();
		}
	}
	/**
	* By default the focus is set on the first text field after this dialog is fully visible. This behavior can be overwritten by calling this function.
	* If it has already been called, then calls it instantly
	*/
	setFocusOnLoadFunction(callback) {
		this.focusOnLoadFunction = callback;
		if (this.wasFocusOnLoadCalled) this.focusOnLoadFunction(assertNotNull(this.domDialog));
	}
	getDialogWrapperClasses(dialogType) {
		let dialogWrapperStyle = ".fill-absolute.flex.items-stretch.flex-column";
		if (dialogType === DialogType.EditLarge) dialogWrapperStyle += ".flex-start";
else dialogWrapperStyle += ".flex-center";
		return dialogWrapperStyle;
	}
	getDialogStyle(dialogType) {
		let dialogStyle = ".dialog.elevated-bg.flex-grow.border-radius-top";
		if (dialogType === DialogType.Progress) dialogStyle += ".dialog-width-s.dialog-progress.border-radius-bottom";
else if (dialogType === DialogType.Alert) dialogStyle += ".dialog-width-alert.pt.border-radius-bottom";
else if (dialogType === DialogType.Reminder) dialogStyle += ".dialog-width-m.pt.flex.flex-column.border-radius-bottom";
else if (dialogType === DialogType.EditSmall) dialogStyle += ".dialog-width-s.flex.flex-column.border-radius-bottom";
else if (dialogType === DialogType.EditMedium) dialogStyle += ".dialog-width-m.border-radius-bottom";
else if (dialogType === DialogType.EditLarge || dialogType === DialogType.EditLarger) dialogStyle += ".dialog-width-l";
		return dialogStyle;
	}
	addShortcut(shortcut) {
		this._shortcuts.push(shortcut);
		if (this.visible) keyManager.registerModalShortcuts([shortcut]);
		return this;
	}
	/**
	* Sets a close handler to the dialog. If set the handler will be notified when onClose is called on the dialog.
	* The handler must is then responsible for closing the dialog.
	*/
	setCloseHandler(closeHandler) {
		this.closeHandler = closeHandler;
		return this;
	}
	shortcuts() {
		return this._shortcuts;
	}
	show() {
		this.focusedBeforeShown = document.activeElement;
		modal.display(this);
		this.visible = true;
		return this;
	}
	/**
	* Removes the dialog from the current view.
	*/
	close() {
		this.visible = false;
		modal.remove(this);
	}
	/**
	* Should be called to close a dialog. Notifies the closeHandler about the close attempt.
	*/
	onClose() {
		if (this.closeHandler) this.closeHandler();
else this.close();
	}
	popState(e) {
		this.onClose();
		return false;
	}
	callingElement() {
		return this.focusedBeforeShown;
	}
	/**
	* Is invoked from modal as the two animations (background layer opacity and dropdown) should run in parallel
	* @returns {Promise.<void>}
	*/
	hideAnimation() {
		let bgcolor = getElevatedBackground();
		if (this.domDialog) return Promise.all([animations.add(this.domDialog.children, opacity(1, 0, true)), animations.add(this.domDialog, alpha(AlphaEnum.BackgroundColor, bgcolor, 1, 0), {
			delay: DefaultAnimationTime / 2,
			easing: ease.linear
		})]).then(noOp);
else return Promise.resolve();
	}
	backgroundClick(e) {}
	/**
	* show a dialog with only a "ok" button
	*
	* @param messageIdOrMessageFunction the text to display
	* @param infoToAppend {?string | lazy<Children>} some text or UI elements to show below the message
	* @returns {Promise<void>} a promise that resolves after the dialog is fully closed
	*/
	static message(messageIdOrMessageFunction, infoToAppend) {
		return new Promise((resolve) => {
			let dialog;
			const closeAction = () => {
				dialog.close();
				setTimeout(() => resolve(), DefaultAnimationTime);
			};
			let lines = lang.getTranslationText(messageIdOrMessageFunction).split("\n");
			let testId = `dialog:${lang.getTestId(messageIdOrMessageFunction)}`;
			if (typeof infoToAppend === "string") lines.push(infoToAppend);
			const buttonAttrs = {
				label: "ok_action",
				click: closeAction,
				type: ButtonType.Primary
			};
			dialog = new Dialog(DialogType.Alert, { view: () => [mithril_default(".dialog-max-height.dialog-contentButtonsBottom.text-break.text-prewrap.selectable.scroll", { "data-testid": testId }, [lines.map((line) => mithril_default(".text-break.selectable", line)), typeof infoToAppend == "function" ? infoToAppend() : null]), mithril_default(".flex-center.dialog-buttons", mithril_default(Button, buttonAttrs))] }).setCloseHandler(closeAction).addShortcut({
				key: Keys.RETURN,
				shift: false,
				exec: closeAction,
				help: "close_alt"
			}).addShortcut({
				key: Keys.ESC,
				shift: false,
				exec: closeAction,
				help: "close_alt"
			}).show();
		});
	}
	/**
	* fallback for cases where we can't directly download and open a file
	*/
	static legacyDownload(filename, url) {
		return new Promise((resolve) => {
			let dialog;
			const closeAction = () => {
				dialog.close();
				setTimeout(() => resolve(), DefaultAnimationTime);
			};
			const closeButtonAttrs = {
				label: "close_alt",
				click: closeAction,
				type: ButtonType.Primary
			};
			const downloadButtonAttrs = {
				label: "download_action",
				click: () => {
					const popup = open("", "_blank");
					if (popup) popup.location = url;
					dialog.close();
					resolve();
				},
				type: ButtonType.Primary
			};
			dialog = new Dialog(DialogType.Alert, { view: () => mithril_default("", [mithril_default(".dialog-contentButtonsBottom.text-break", [mithril_default(Button, downloadButtonAttrs), mithril_default(".pt", lang.get("saveDownloadNotPossibleIos_msg"))]), mithril_default(".flex-center.dialog-buttons", mithril_default(Button, closeButtonAttrs))]) }).setCloseHandler(closeAction).show();
		});
	}
	/**
	* Simpler version of {@link Dialog#confirmMultiple} with just two options: no and yes (or another confirmation).
	* @return Promise, which is resolved with user selection - true for confirm, false for cancel.
	*/
	static confirm(messageIdOrMessageFunction, confirmId = "ok_action", infoToAppend) {
		return new Promise((resolve) => {
			const closeAction = (conf) => {
				dialog.close();
				setTimeout(() => resolve(conf), DefaultAnimationTime);
			};
			const buttonAttrs = [{
				label: "cancel_action",
				click: () => closeAction(false),
				type: ButtonType.Secondary
			}, {
				label: confirmId,
				click: () => closeAction(true),
				type: ButtonType.Primary
			}];
			const dialog = Dialog.confirmMultiple(messageIdOrMessageFunction, buttonAttrs, resolve, infoToAppend);
		});
	}
	/**
	* Show a dialog with multiple selection options below the message.
	* @param messageIdOrMessageFunction which displayed in the body
	* @param buttons which are displayed below
	* @param onclose which is called on shortcut or when dialog is closed any other way (e.g. back navigation). Not called when pressing
	* one of the buttons.
	* @param infoToAppend additional UI elements to show below the message
	*/
	static confirmMultiple(messageIdOrMessageFunction, buttons, onclose, infoToAppend) {
		let dialog;
		const closeAction = (positive) => {
			dialog.close();
			setTimeout(() => onclose && onclose(positive), DefaultAnimationTime);
		};
		function getContent() {
			const additionalChild = typeof infoToAppend === "string" ? mithril_default(".dialog-contentButtonsBottom.text-break.selectable", infoToAppend) : typeof infoToAppend === "function" ? infoToAppend() : null;
			return [lang.getTranslationText(messageIdOrMessageFunction), additionalChild];
		}
		dialog = new Dialog(DialogType.Alert, { view: () => [mithril_default("#dialog-message.dialog-max-height.dialog-contentButtonsBottom.text-break.text-prewrap.selectable.scroll", getContent()), buttons.length === 0 ? null : mithril_default(".flex-center.dialog-buttons", buttons.map((a) => mithril_default(Button, a)))] }).setCloseHandler(() => closeAction(false)).addShortcut({
			key: Keys.ESC,
			shift: false,
			exec: () => closeAction(false),
			help: "cancel_action"
		});
		dialog.show();
		return dialog;
	}
	/** show a dialog with several buttons on the bottom and return the option that was selected.
	*
	* never resolves if the user escapes out of the dialog without selecting an option.
	* */
	static choice(message, choices) {
		return new Promise((resolve) => {
			const choose = (choice) => {
				dialog.close();
				setTimeout(() => resolve(choice), DefaultAnimationTime);
			};
			const buttonAttrs = choices.map((choice) => {
				return {
					label: choice.text,
					click: () => choose(choice.value),
					type: ButtonType.Secondary
				};
			});
			const dialog = Dialog.confirmMultiple(message, buttonAttrs);
		});
	}
	/**
	* Shows a (not-cancellable) multiple-choice dialog.
	* @returns the selected option.
	*/
	static choiceVertical(message, choices) {
		return new Promise((resolve) => {
			const choose = (choice) => {
				dialog.close();
				setTimeout(() => resolve(choice), DefaultAnimationTime);
			};
			const buttonAttrs = choices.map((choice) => {
				return {
					label: choice.text,
					click: () => choose(choice.value),
					type: choice.type === "primary" ? ButtonType.Primary : ButtonType.Secondary
				};
			});
			function getContent() {
				return lang.getTranslationText(message);
			}
			const dialog = new Dialog(DialogType.Alert, { view: () => mithril_default(".flex.flex-column.pl-l.pr-l.pb-s", [mithril_default("#dialog-message.dialog-max-height.text-break.text-prewrap.selectable.scroll", getContent()), buttonAttrs.length === 0 ? null : mithril_default(".flex.flex-column", buttonAttrs.map((a) => mithril_default(Button, a)))]) });
			dialog.show();
		});
	}
	/**
	* show a dialog (resp. monologue) with no buttons that can not be closed, not even with ESC.
	*/
	static deadEnd(message) {
		const dialog = Dialog.confirmMultiple(message, []);
		dialog.addShortcut({
			key: Keys.ESC,
			shift: false,
			exec: noOp,
			help: "emptyString_msg"
		});
		dialog.addShortcut({
			key: Keys.F1,
			shift: false,
			exec: noOp,
			help: "emptyString_msg"
		});
	}
	static save(title, saveAction, child) {
		return new Promise((resolve) => {
			let saveDialog;
			const closeAction = () => {
				saveDialog.close();
				setTimeout(() => resolve(), DefaultAnimationTime);
			};
			const onOk = () => {
				saveAction().then(() => {
					saveDialog.close();
					setTimeout(() => resolve(), DefaultAnimationTime);
				});
			};
			const actionBarAttrs = {
				left: [{
					label: "close_alt",
					click: closeAction,
					type: ButtonType.Secondary
				}],
				right: [{
					label: "save_action",
					click: onOk,
					type: ButtonType.Primary
				}],
				middle: lang.makeTranslation("title", title())
			};
			saveDialog = new Dialog(DialogType.EditMedium, { view: () => mithril_default("", [mithril_default(DialogHeaderBar, actionBarAttrs), mithril_default(".plr-l.pb.text-break", mithril_default(child))]) }).setCloseHandler(closeAction).show();
		});
	}
	static reminder(title, message) {
		return new Promise((resolve) => {
			let dialog;
			const closeAction = (res) => {
				dialog.close();
				setTimeout(() => resolve(res), DefaultAnimationTime);
			};
			const buttonAttrs = [{
				label: "upgradeReminderCancel_action",
				click: () => closeAction(false),
				type: ButtonType.Secondary
			}, {
				label: "showMoreUpgrade_action",
				click: () => closeAction(true),
				type: ButtonType.Primary
			}];
			dialog = new Dialog(DialogType.Reminder, { view: () => [mithril_default(".dialog-contentButtonsBottom.text-break.scroll", [mithril_default(".h2.pb", title), mithril_default(".flex-direction-change.items-center", [mithril_default("#dialog-message.pb", message), mithril_default("img[src=" + HabReminderImage + "].dialog-img.mb.bg-white.border-radius", { style: { "min-width": "150px" } })])]), mithril_default(".flex-center.dialog-buttons.flex-no-grow-no-shrink-auto", buttonAttrs.map((a) => mithril_default(Button, a)))] }).setCloseHandler(() => closeAction(false)).addShortcut({
				key: Keys.ESC,
				shift: false,
				exec: () => closeAction(false),
				help: "cancel_action"
			}).show();
		});
	}
	/**
	* Shows a dialog with a text field input and ok/cancel buttons.
	* @param   props.child either a component (object with view function that returns a Children) or a naked view Function
	* @param   props.validator Called when "Ok" is clicked. Must return null if the input is valid or an error messageID if it is invalid, so an error message is shown.
	* @param   props.okAction called after successful validation.
	* @param   props.cancelAction called when allowCancel is true and the cancel button/shortcut was pressed.
	* @returns the Dialog
	*/
	static showActionDialog(props) {
		let dialog = this.createActionDialog(props);
		return dialog.show();
	}
	static createActionDialog(props) {
		let dialog;
		const { title, child, okAction, validator, allowCancel, allowOkWithReturn, okActionTextId, cancelActionTextId, cancelAction, type } = Object.assign({}, {
			allowCancel: true,
			allowOkWithReturn: false,
			okActionTextId: "ok_action",
			cancelActionTextId: "cancel_action",
			type: DialogType.EditSmall,
			errorMessageStream: (0, import_stream.default)(DEFAULT_ERROR)
		}, props);
		const doCancel = () => {
			if (cancelAction) cancelAction(dialog);
			dialog.close();
		};
		const doAction = () => {
			if (!okAction) return;
			let validationResult = null;
			if (validator) validationResult = validator();
			let finalizer = Promise.resolve(validationResult).then((error_id) => {
				if (error_id) Dialog.message(error_id);
else okAction(dialog);
			});
			if (validationResult instanceof Promise) import("./ProgressDialog2-chunk.js").then((module) => module.showProgressDialog("pleaseWait_msg", finalizer));
		};
		const actionBarAttrs = {
			left: mapLazily(allowCancel, (allow) => allow ? [{
				label: cancelActionTextId,
				click: doCancel,
				type: ButtonType.Secondary
			}] : []),
			right: okAction ? [{
				label: okActionTextId,
				click: doAction,
				type: ButtonType.Primary
			}] : [],
			middle: title
		};
		dialog = new Dialog(type, { view: () => [mithril_default(DialogHeaderBar, actionBarAttrs), mithril_default(".dialog-max-height.plr-l.pb.text-break.scroll", ["function" === typeof child ? child() : mithril_default(child)])] }).setCloseHandler(doCancel);
		dialog.addShortcut({
			key: Keys.ESC,
			shift: false,
			exec: mapLazily(allowCancel, (allow) => allow && doCancel()),
			help: "cancel_action",
			enabled: getAsLazy(allowCancel)
		});
		if (allowOkWithReturn) dialog.addShortcut({
			key: Keys.RETURN,
			shift: false,
			exec: doAction,
			help: "ok_action"
		});
		return dialog;
	}
	/**
	* Shows a dialog with a text field input and ok/cancel buttons.
	* @returns A promise resolving to the entered text. The returned promise is only resolved if "ok" is clicked.
	*/
	static showTextInputDialog(props) {
		return new Promise((resolve) => {
			Dialog.showProcessTextInputDialog(props, async (value) => resolve(value));
		});
	}
	/**
	* Shows a dialog with a text field input and ok/cancel buttons. In contrast to {@link showTextInputDialog} the entered text is not returned but processed in the okAction.
	*/
	static showProcessTextInputDialog(props, okAction) {
		let textFieldType = props.textFieldType ?? TextFieldType.Text;
		let result = props.defaultValue ?? "";
		Dialog.showActionDialog({
			title: props.title,
			child: () => mithril_default(TextField, {
				label: props.label,
				value: result,
				type: textFieldType,
				oninput: (newValue) => result = newValue,
				helpLabel: () => props.infoMsgId ? lang.getTranslationText(props.infoMsgId) : ""
			}),
			validator: () => props.inputValidator ? props.inputValidator(result) : null,
			allowOkWithReturn: true,
			okAction: async (dialog) => {
				try {
					await okAction(result);
					dialog.close();
				} catch (error) {
					if (!isOfflineError(error)) dialog.close();
					throw error;
				}
			}
		});
	}
	/**
	* Shows a dialog with a text area input and ok/cancel buttons.
	* @param titleId title of the dialog
	* @param labelIdOrLabelFunction label of the text area
	* @param infoMsgId help label of the text area
	* @param value initial value
	* @returns A promise resolving to the entered text. The returned promise is only resolved if "ok" is clicked.
	*/
	static showTextAreaInputDialog(titleId, labelIdOrLabelFunction, infoMsgId, value) {
		return new Promise((resolve) => {
			let result = value;
			Dialog.showActionDialog({
				title: titleId,
				child: { view: () => mithril_default(TextField, {
					label: labelIdOrLabelFunction,
					helpLabel: () => infoMsgId ? lang.get(infoMsgId) : "",
					value: result,
					oninput: (newValue) => result = newValue,
					type: TextFieldType.Area
				}) },
				okAction: (dialog) => {
					resolve(result);
					dialog.close();
				}
			});
		});
	}
	/**
	* Show a dialog with a dropdown selector
	* @param titleId title of the dialog
	* @param label label of the dropdown selector
	* @param infoMsgId help label of the dropdown selector
	* @param items selection set
	* @param initialValue initial value
	* @param dropdownWidth width of the dropdown
	* @returns A promise resolving to the selected item. The returned promise is only resolved if "ok" is clicked.
	*/
	static showDropDownSelectionDialog(titleId, label, infoMsgId, items, initialValue, dropdownWidth) {
		let selectedValue = initialValue;
		return new Promise((resolve) => {
			Dialog.showActionDialog({
				title: titleId,
				child: { view: () => mithril_default(DropDownSelector, identity({
					label,
					items,
					selectedValue,
					selectionChangedHandler: (newValue) => selectedValue = newValue
				})) },
				okAction: (dialog) => {
					resolve(selectedValue);
					dialog.close();
				}
			});
		});
	}
	/** @deprecated use editDialog*/
	static largeDialog(headerBarAttrs, child) {
		return new Dialog(DialogType.EditLarge, { view: () => {
			return mithril_default("", [mithril_default(DialogHeaderBar, headerBarAttrs), mithril_default(".dialog-container.scroll", mithril_default(".fill-absolute.plr-l", mithril_default(child)))]);
		} });
	}
	static editDialog(headerBarAttrs, child, childAttrs) {
		return new Dialog(DialogType.EditLarge, { view: () => mithril_default("", [headerBarAttrs.noHeader ? null : mithril_default(DialogHeaderBar, headerBarAttrs), mithril_default(".dialog-container.scroll.hide-outline", mithril_default(".fill-absolute.plr-l", mithril_default(child, childAttrs)))]) });
	}
	static editMediumDialog(headerBarAttrs, child, childAttrs, dialogStyle) {
		return new Dialog(DialogType.EditMedium, { view: () => mithril_default(".flex.col.border-radius", { style: dialogStyle }, [headerBarAttrs.noHeader ? null : mithril_default(DialogHeaderBar, headerBarAttrs), mithril_default(".scroll.hide-outline.plr-l.flex-grow", { style: { "overflow-x": "hidden" } }, mithril_default(child, childAttrs))]) });
	}
	static editSmallDialog(headerBarAttrs, child) {
		return new Dialog(DialogType.EditSmall, { view: () => [headerBarAttrs.noHeader ? null : mithril_default(DialogHeaderBar, headerBarAttrs), mithril_default(".scroll.hide-outline.plr-l", child())] });
	}
	static async viewerDialog(title, child, childAttrs) {
		return new Promise((resolve) => {
			let dialog;
			const close = () => {
				dialog.close();
				resolve();
			};
			const headerAttrs = {
				left: [{
					label: "close_alt",
					click: close,
					type: ButtonType.Secondary
				}],
				middle: title
			};
			dialog = Dialog.editDialog(headerAttrs, child, childAttrs).setCloseHandler(close).addShortcut({
				key: Keys.ESC,
				exec: close,
				help: "close_alt"
			}).show();
		});
	}
	static onKeyboardSizeChanged(newSize) {
		Dialog.keyboardHeight = newSize;
		mithril_default.redraw();
	}
};
windowFacade.addKeyboardSizeListener(Dialog.onKeyboardSizeChanged);

//#endregion
export { Autocapitalize, Autocomplete, DROPDOWN_MARGIN, Dialog, DialogType, DomRectReadOnlyPolyfilled, DropDownSelector, DropType, Dropdown, INPUT, RowButton, TextField, TextFieldType, attachDropdown, canSeeTutaLinks, colorForBg, createAsyncDropdown, createDropdown, createMoreActionButtonAttrs, encodeSVG, getConfirmation, getContactTitle, getCoordsOfMouseOrTouchEvent, getIfLargeScroll, getOperatingClasses, getPosAndBoundsFromMouseEvent, ifAllowedTutaLinks, inputLineHeight as inputLineHeight$1, makeListSelectionChangedScrollHandler, pureComponent, renderCountryDropdown, scrollListDom, showDropdown, showDropdownAtPosition };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGlhbG9nLWNodW5rLmpzIiwibmFtZXMiOlsiZmFjdG9yeTogKGF0dHJzOiBULCBjaGlsZHJlbjogQ2hpbGRyZW4pID0+IENoaWxkcmVuIiwidm5vZGU6IFZub2RlPFQ+Iiwidm5vZGU6IFZub2RlPFJvd0J1dHRvbkF0dHJzPiIsImRyb3Bkb3duQ2hpbGQ6IERyb3Bkb3duQ2hpbGRBdHRycyIsIng6IG51bWJlciIsInk6IG51bWJlciIsIndpZHRoOiBudW1iZXIiLCJoZWlnaHQ6IG51bWJlciIsImxhenlDaGlsZHJlbjogbGF6eTxSZWFkb25seUFycmF5PERyb3Bkb3duQ2hpbGRBdHRycyB8IG51bGw+PiIsImJ1dHRvbkNoaWxkOiBEcm9wZG93bkJ1dHRvbkF0dHJzIiwiY2hpbGRyZW4iLCJldjogRXZlbnRSZWRyYXc8RXZlbnQ+IiwiY2hpbGQ6IERyb3Bkb3duQnV0dG9uQXR0cnMiLCJzaG93aW5nSWNvbnM6IGJvb2xlYW4iLCJmbjogKGV2ZW50OiBNb3VzZUV2ZW50LCBkb206IEhUTUxFbGVtZW50KSA9PiB1bmtub3duIiwiZTogTW91c2VFdmVudCIsIm9yaWdpbjogUG9zUmVjdCIsImU6IEV2ZW50IiwidmlzaWJsZUVsZW1lbnRzOiBBcnJheTxCdXR0b25BdHRycz4iLCJoYW5kbGVyOiBUaHVuayIsIl8iLCJidXR0b25zIiwiYnV0dG9uczogUmVhZG9ubHlBcnJheTxEcm9wZG93bkNoaWxkQXR0cnM+IiwieFBvczogbnVtYmVyIiwieVBvczogbnVtYmVyIiwiY2xvc2VIYW5kbGVyOiBUaHVuayIsImRvbTogSFRNTEVsZW1lbnQiLCJkb21Ecm9wZG93bjogSFRNTEVsZW1lbnQiLCJjb250ZW50SGVpZ2h0OiBudW1iZXIiLCJjb250ZW50V2lkdGg6IG51bWJlciIsInBvc2l0aW9uPzogXCJ0b3BcIiB8IFwiYm90dG9tXCIiLCJsZWZ0U3R5bGU6IG51bWJlciB8IG51bGwiLCJyaWdodFN0eWxlOiBudW1iZXIgfCBudWxsIiwidm5vZGU6IFZub2RlPERyb3BEb3duU2VsZWN0b3JBdHRyczxUPj4iLCJhOiBEcm9wRG93blNlbGVjdG9yQXR0cnM8VD4iLCJ2YWx1ZTogVCB8IG51bGwiLCJwYXJhbXM6IHtcblx0c2VsZWN0ZWRDb3VudHJ5OiBDb3VudHJ5IHwgbnVsbFxuXHRvblNlbGVjdGlvbkNoYW5nZWQ6IChjb3VudHJ5OiBDb3VudHJ5KSA9PiB2b2lkXG5cdGhlbHBMYWJlbD86IGxhenk8c3RyaW5nPlxuXHRsYWJlbD86IE1heWJlVHJhbnNsYXRpb25cbn0iLCJsYXp5Q2hpbGRyZW46IE1heWJlTGF6eTwkUHJvbWlzYWJsZTxSZWFkb25seUFycmF5PERyb3Bkb3duQ2hpbGRBdHRycyB8IG51bGw+Pj4iLCJkcm9wZG93bldpZHRoPzogbnVtYmVyIiwibWVzc2FnZTogTWF5YmVUcmFuc2xhdGlvbiIsImNvbmZpcm1NZXNzYWdlOiBUcmFuc2xhdGlvbktleSIsImNvbmZpcm1hdGlvbjogQ29uZmlybWF0aW9uIiwiZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50Iiwic2Nyb2xsRG9tOiBIVE1MRWxlbWVudCIsImVudHJ5SGVpZ2h0OiBudW1iZXIiLCJnZXRTZWxlY3RlZEVudHJ5SW5kZXg6IGxhenk8bnVtYmVyPiIsInNlbGVjdGVkSW5kZXg6IG51bWJlciIsImxvZ2luczogTG9naW5Db250cm9sbGVyIiwibGlua0lkOiBJbmZvTGluayIsInJlbmRlcjogKGxpbmtJZDogSW5mb0xpbmspID0+IENoaWxkcmVuIiwic3ZnOiBzdHJpbmciLCJpc0Rpc2FibGVkOiBib29sZWFuIHwgbnVsbCB8IHVuZGVmaW5lZCIsImN1cnNvckNsYXNzPzogc3RyaW5nIiwib2xkUG9zaXRpb246IG51bWJlciB8IG51bGwiLCJuZXdQb3NpdGlvbjogbnVtYmVyIHwgbnVsbCIsImNvbnRhY3Q6IENvbnRhY3QiLCJjb2xvcjogc3RyaW5nIiwiaW5wdXRMaW5lSGVpZ2h0OiBudW1iZXIiLCJ2bm9kZTogQ1Zub2RlPFRleHRGaWVsZEF0dHJzPiIsInZub2RlIiwiZTogTW91c2VFdmVudCIsImE6IFRleHRGaWVsZEF0dHJzIiwiYXV0b2ZpbGxHdWFyZDogQ2hpbGRyZW4iLCJlOiBBbmltYXRpb25FdmVudCIsImU6IEZvY3VzRXZlbnQiLCJlOiBLZXlib2FyZEV2ZW50IiwiZTogRXZlbnQiLCJ2YWx1ZTogc3RyaW5nIiwiZGlhbG9nVHlwZTogRGlhbG9nVHlwZSIsImNoaWxkQ29tcG9uZW50OiBDb21wb25lbnQiLCJlOiBNb3VzZUV2ZW50IiwiYW5pbWF0aW9uOiBBbmltYXRpb25Qcm9taXNlIHwgbnVsbCIsImluamVjdGlvblJpZ2h0QXR0cnM6IERpYWxvZ0luamVjdGlvblJpZ2h0QXR0cnM8YW55PiIsImRvbTogSFRNTEVsZW1lbnQiLCJjYWxsYmFjazogRGlhbG9nW1wiZm9jdXNPbkxvYWRGdW5jdGlvblwiXSIsInNob3J0Y3V0OiBTaG9ydGN1dCIsImNsb3NlSGFuZGxlcjogKCgpID0+IHVua25vd24pIHwgbnVsbCIsImU6IEV2ZW50IiwibWVzc2FnZUlkT3JNZXNzYWdlRnVuY3Rpb246IE1heWJlVHJhbnNsYXRpb24iLCJpbmZvVG9BcHBlbmQ/OiBzdHJpbmcgfCBsYXp5PENoaWxkcmVuPiIsImRpYWxvZzogRGlhbG9nIiwiYnV0dG9uQXR0cnM6IEJ1dHRvbkF0dHJzIiwiZmlsZW5hbWU6IHN0cmluZyIsInVybDogc3RyaW5nIiwiY2xvc2VCdXR0b25BdHRyczogQnV0dG9uQXR0cnMiLCJkb3dubG9hZEJ1dHRvbkF0dHJzOiBCdXR0b25BdHRycyIsImNvbmZpcm1JZDogVHJhbnNsYXRpb25LZXkiLCJjb25mOiBib29sZWFuIiwiYnV0dG9uQXR0cnM6IEFycmF5PEJ1dHRvbkF0dHJzPiIsImJ1dHRvbnM6IFJlYWRvbmx5QXJyYXk8QnV0dG9uQXR0cnM+Iiwib25jbG9zZT86IChwb3NpdGl2ZTogYm9vbGVhbikgPT4gdW5rbm93biIsInBvc2l0aXZlOiBib29sZWFuIiwibWVzc2FnZTogTWF5YmVUcmFuc2xhdGlvbiIsImNob2ljZXM6IEFycmF5PHtcblx0XHRcdHRleHQ6IE1heWJlVHJhbnNsYXRpb25cblx0XHRcdHZhbHVlOiBUXG5cdFx0fT4iLCJjaG9pY2U6IFQiLCJjaG9pY2VzOiBBcnJheTx7XG5cdFx0XHR0ZXh0OiBNYXliZVRyYW5zbGF0aW9uXG5cdFx0XHR2YWx1ZTogVFxuXHRcdFx0dHlwZT86IFwicHJpbWFyeVwiIHwgXCJzZWNvbmRhcnlcIlxuXHRcdH0+IiwidGl0bGU6IGxhenk8c3RyaW5nPiIsInNhdmVBY3Rpb246ICgpID0+IFByb21pc2U8dm9pZD4iLCJjaGlsZDogQ29tcG9uZW50Iiwic2F2ZURpYWxvZzogRGlhbG9nIiwiYWN0aW9uQmFyQXR0cnM6IERpYWxvZ0hlYWRlckJhckF0dHJzIiwidGl0bGU6IHN0cmluZyIsIm1lc3NhZ2U6IHN0cmluZyIsInJlczogYm9vbGVhbiIsInByb3BzOiBBY3Rpb25EaWFsb2dQcm9wcyIsInZhbGlkYXRpb25SZXN1bHQ6ICRQcm9taXNhYmxlPFRyYW5zbGF0aW9uS2V5IHwgbnVsbD4gfCBudWxsIiwicHJvcHM6IFRleHRJbnB1dERpYWxvZ1BhcmFtcyIsIm9rQWN0aW9uOiAoYWN0aW9uOiBzdHJpbmcpID0+IFByb21pc2U8dW5rbm93bj4iLCJ0aXRsZUlkOiBUcmFuc2xhdGlvbktleSIsImxhYmVsSWRPckxhYmVsRnVuY3Rpb246IE1heWJlVHJhbnNsYXRpb24iLCJpbmZvTXNnSWQ6IFRyYW5zbGF0aW9uS2V5IHwgbnVsbCIsInZhbHVlOiBzdHJpbmciLCJyZXN1bHQ6IHN0cmluZyIsImxhYmVsOiBUcmFuc2xhdGlvbktleSIsIml0ZW1zOiBTZWxlY3Rvckl0ZW1MaXN0PFQ+IiwiaW5pdGlhbFZhbHVlOiBUIiwiZHJvcGRvd25XaWR0aD86IG51bWJlciIsInNlbGVjdGVkVmFsdWU6IFQiLCJoZWFkZXJCYXJBdHRyczogRGlhbG9nSGVhZGVyQmFyQXR0cnMiLCJjaGlsZDogQ2xhc3M8Q29tcG9uZW50PFQ+PiIsImNoaWxkQXR0cnM6IFQiLCJkaWFsb2dTdHlsZT86IFBhcnRpYWw8Q1NTU3R5bGVEZWNsYXJhdGlvbj4gfCBvYmplY3QiLCJjaGlsZDogKCkgPT4gQ2hpbGRyZW4iLCJ0aXRsZTogTWF5YmVUcmFuc2xhdGlvbiIsImhlYWRlckF0dHJzOiBEaWFsb2dIZWFkZXJCYXJBdHRycyIsIm5ld1NpemU6IG51bWJlciJdLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvUHVyZUNvbXBvbmVudC50cyIsIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvYnV0dG9ucy9Sb3dCdXR0b24udHMiLCIuLi9zcmMvY29tbW9uL2d1aS9iYXNlL0Ryb3Bkb3duLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvYmFzZS9Ecm9wRG93blNlbGVjdG9yLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvYmFzZS9HdWlVdGlscy50cyIsIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvVGV4dEZpZWxkLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2dJbmplY3Rpb25SaWdodC50cyIsIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuXG4vKipcbiAqIExpdHRsZSBoZWxwZXIgdG8gY3JlYXRlIHlvdXIgY29tcG9uZW50cyBmcm9tIHB1cmUgZnVuY3Rpb25zLiBObyBuZWVkIHRvIHJldHVybiBvYmplY3RzLCBubyBuZWVkIHRvIGRlZmluZSBjbGFzc2VzLCBubyBmZWFyIG9mIHNob290aW5nXG4gKiB5b3Vyc2VsZiBpbiB0aGUgZm9vdCB3aXRoIG9iamVjdCBjb21wb25lbnRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcHVyZUNvbXBvbmVudDxUPihmYWN0b3J5OiAoYXR0cnM6IFQsIGNoaWxkcmVuOiBDaGlsZHJlbikgPT4gQ2hpbGRyZW4pOiBDb21wb25lbnQ8VD4ge1xuXHRyZXR1cm4ge1xuXHRcdHZpZXcodm5vZGU6IFZub2RlPFQ+KTogQ2hpbGRyZW4ge1xuXHRcdFx0cmV0dXJuIGZhY3Rvcnkodm5vZGUuYXR0cnMsIHZub2RlLmNoaWxkcmVuKVxuXHRcdH0sXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBCYXNlQnV0dG9uIH0gZnJvbSBcIi4vQmFzZUJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBBbGxJY29ucywgSWNvbiwgSWNvblNpemUgfSBmcm9tIFwiLi4vSWNvbi5qc1wiXG5pbXBvcnQgeyBDbGlja0hhbmRsZXIgfSBmcm9tIFwiLi4vR3VpVXRpbHMuanNcIlxuaW1wb3J0IHsgQXJpYVJvbGUgfSBmcm9tIFwiLi4vLi4vQXJpYVV0aWxzLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uLy4uL3RoZW1lLmpzXCJcbmltcG9ydCB7IGxhbmcsIE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vLi4vLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5cbmV4cG9ydCBpbnRlcmZhY2UgUm93QnV0dG9uQXR0cnMge1xuXHQvKiogYWNjZXNzaWJpbGl0eSAmIHRvb2x0aXAgZGVzY3JpcHRpb24gKi9cblx0bGFiZWw6IE1heWJlVHJhbnNsYXRpb25cblx0LyoqIHZpc2libGUgdGV4dCBpbnNpZGUgYnV0dG9uICovXG5cdHRleHQ/OiBNYXliZVRyYW5zbGF0aW9uXG5cdGljb24/OiBBbGxJY29ucyB8IFwibm9uZVwiXG5cdHNlbGVjdGVkPzogYm9vbGVhblxuXHRvbmNsaWNrOiBDbGlja0hhbmRsZXJcblx0c3R5bGU/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG5cdGNsYXNzPzogc3RyaW5nXG5cdHJvbGU/OiBBcmlhUm9sZVxufVxuXG4vKiogQSBidXR0b24gdGhhdCBpcyBzdHlsZWQgdGhlIHNhbWUgYXMgYSBgTmF2QnV0dG9uYC4gKi9cbmV4cG9ydCBjbGFzcyBSb3dCdXR0b24gaW1wbGVtZW50cyBDb21wb25lbnQ8Um93QnV0dG9uQXR0cnM+IHtcblx0dmlldyh2bm9kZTogVm5vZGU8Um93QnV0dG9uQXR0cnM+KSB7XG5cdFx0Y29uc3QgYXR0cnMgPSB2bm9kZS5hdHRyc1xuXHRcdGNvbnN0IGxhYmVsID0gbGFuZy5nZXRUcmFuc2xhdGlvblRleHQoYXR0cnMubGFiZWwpXG5cdFx0Y29uc3QgdGV4dCA9IGxhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KGF0dHJzLnRleHQgPz8gYXR0cnMubGFiZWwpXG5cdFx0Y29uc3QgY29sb3IgPSBhdHRycy5zZWxlY3RlZCA/IHRoZW1lLmNvbnRlbnRfYnV0dG9uX3NlbGVjdGVkIDogdGhlbWUuY29udGVudF9idXR0b25cblx0XHRyZXR1cm4gbShCYXNlQnV0dG9uLCB7XG5cdFx0XHRsYWJlbDogYXR0cnMubGFiZWwsXG5cdFx0XHR0ZXh0OiBtKFxuXHRcdFx0XHRcIi5wbHItYnV0dG9uLnRleHQtZWxsaXBzaXNcIixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHN0eWxlOiB7IGNvbG9yIH0sXG5cdFx0XHRcdFx0Ly8gV2hlbiB0aGUgbGFiZWwgZG9lc24ndCBtYXRjaCBjb250ZW50LCBzY3JlZW4gcmVhZGVycyByZWFkIGJvdGhcblx0XHRcdFx0XHRhcmlhSGlkZGVuOiBsYWJlbCAhPT0gdGV4dCwgLy8gdGhpcyBwcmV2ZW50cyB0aGF0XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRleHQsXG5cdFx0XHQpLFxuXHRcdFx0cm9sZTogYXR0cnMucm9sZSxcblx0XHRcdHNlbGVjdGVkOiBhdHRycy5zZWxlY3RlZCxcblx0XHRcdGljb246XG5cdFx0XHRcdGF0dHJzLmljb24gJiYgYXR0cnMuaWNvbiAhPT0gXCJub25lXCJcblx0XHRcdFx0XHQ/IG0oSWNvbiwge1xuXHRcdFx0XHRcdFx0XHRpY29uOiBhdHRycy5pY29uLFxuXHRcdFx0XHRcdFx0XHRjb250YWluZXI6IFwiZGl2XCIsXG5cdFx0XHRcdFx0XHRcdGNsYXNzOiBcIm1yLWJ1dHRvblwiLFxuXHRcdFx0XHRcdFx0XHRzdHlsZTogeyBmaWxsOiBjb2xvciB9LFxuXHRcdFx0XHRcdFx0XHRzaXplOiBJY29uU2l6ZS5NZWRpdW0sXG5cdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdDogYXR0cnMuaWNvbiA9PT0gXCJub25lXCJcblx0XHRcdFx0XHQ/IG0oXCIuaWNvbi1sYXJnZS5tci1idXR0b25cIilcblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRjbGFzczogXCJmbGV4IGl0ZW1zLWNlbnRlciBzdGF0ZS1iZyBidXR0b24tY29udGVudCBwbHItYnV0dG9uIFwiICsgYXR0cnMuY2xhc3MsXG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHQuLi5hdHRycy5zdHlsZSxcblx0XHRcdFx0Y29sb3IsXG5cdFx0XHR9LFxuXHRcdFx0b25jbGljazogYXR0cnMub25jbGljayxcblx0XHR9KVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IG1vZGFsLCBNb2RhbENvbXBvbmVudCB9IGZyb20gXCIuL01vZGFsXCJcbmltcG9ydCB7IGFuaW1hdGlvbnMsIG9wYWNpdHksIHRyYW5zZm9ybSwgVHJhbnNmb3JtRW51bSB9IGZyb20gXCIuLi9hbmltYXRpb24vQW5pbWF0aW9uc1wiXG5pbXBvcnQgeyBlYXNlIH0gZnJvbSBcIi4uL2FuaW1hdGlvbi9FYXNpbmdcIlxuaW1wb3J0IHsgcHgsIHNpemUgfSBmcm9tIFwiLi4vc2l6ZVwiXG5pbXBvcnQgeyBmb2N1c05leHQsIGZvY3VzUHJldmlvdXMsIFNob3J0Y3V0IH0gZnJvbSBcIi4uLy4uL21pc2MvS2V5TWFuYWdlclwiXG5pbXBvcnQgdHlwZSB7IEJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4vQnV0dG9uLmpzXCJcbmltcG9ydCB7IGxhbmcsIE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBLZXlzLCBUYWJJbmRleCB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IGdldFNhZmVBcmVhSW5zZXRCb3R0b20sIGdldFNhZmVBcmVhSW5zZXRUb3AgfSBmcm9tIFwiLi4vSHRtbFV0aWxzXCJcbmltcG9ydCB0eXBlIHsgJFByb21pc2FibGUsIGxhenksIGxhenlBc3luYyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgYXNzZXJ0Tm90TnVsbCwgZGVsYXksIGRvd25jYXN0LCBmaWx0ZXJOdWxsLCBtYWtlU2luZ2xlVXNlLCBuZXZlck51bGwsIG5vT3AsIFRodW5rIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vLi4vbWlzYy9DbGllbnREZXRlY3RvclwiXG5pbXBvcnQgeyBwdXJlQ29tcG9uZW50IH0gZnJvbSBcIi4vUHVyZUNvbXBvbmVudFwiXG5pbXBvcnQgdHlwZSB7IENsaWNrSGFuZGxlciB9IGZyb20gXCIuL0d1aVV0aWxzXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4vSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBBbGxJY29ucyB9IGZyb20gXCIuL0ljb24uanNcIlxuaW1wb3J0IHsgUm93QnV0dG9uLCBSb3dCdXR0b25BdHRycyB9IGZyb20gXCIuL2J1dHRvbnMvUm93QnV0dG9uLmpzXCJcbmltcG9ydCB7IEFyaWFSb2xlIH0gZnJvbSBcIi4uL0FyaWFVdGlscy5qc1wiXG5pbXBvcnQgeyBCYXNlQnV0dG9uIH0gZnJvbSBcIi4vYnV0dG9ucy9CYXNlQnV0dG9uXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5leHBvcnQgdHlwZSBEcm9wZG93bkluZm9BdHRycyA9IHtcblx0aW5mbzogc3RyaW5nXG5cdGNlbnRlcjogYm9vbGVhblxuXHRib2xkOiBib29sZWFuXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRHJvcGRvd25CdXR0b25BdHRycyB7XG5cdC8qKiBhY2Nlc3NpYmlsaXR5ICYgdG9vbHRpcCBkZXNjcmlwdGlvbiAqL1xuXHRsYWJlbDogTWF5YmVUcmFuc2xhdGlvblxuXHQvKiogdmlzaWJsZSB0ZXh0IGluc2lkZSBidXR0b24gKi9cblx0dGV4dD86IE1heWJlVHJhbnNsYXRpb25cblx0aWNvbj86IEFsbEljb25zXG5cdGNsaWNrPzogQ2xpY2tIYW5kbGVyXG5cdHNlbGVjdGVkPzogYm9vbGVhblxufVxuXG4vKipcbiAqIFJlbmRlcnMgc21hbGwgaW5mbyBtZXNzYWdlIGluc2lkZSB0aGUgZHJvcGRvd24uXG4gKi9cbmNvbnN0IERyb3Bkb3duSW5mbyA9IHB1cmVDb21wb25lbnQ8RHJvcGRvd25JbmZvQXR0cnM+KCh7IGNlbnRlciwgYm9sZCwgaW5mbyB9KSA9PiB7XG5cdHJldHVybiBtKFwiLmRyb3Bkb3duLWluZm8udGV4dC1icmVhay5zZWxlY3RhYmxlXCIgKyAoY2VudGVyID8gXCIuY2VudGVyXCIgOiBcIlwiKSArIChib2xkID8gXCIuYlwiIDogXCJcIiksIGluZm8pXG59KVxuZXhwb3J0IHR5cGUgRHJvcGRvd25DaGlsZEF0dHJzID0gRHJvcGRvd25JbmZvQXR0cnMgfCBEcm9wZG93bkJ1dHRvbkF0dHJzXG5cbmZ1bmN0aW9uIGlzRHJvcERvd25JbmZvKGRyb3Bkb3duQ2hpbGQ6IERyb3Bkb3duQ2hpbGRBdHRycyk6IGRyb3Bkb3duQ2hpbGQgaXMgRHJvcGRvd25JbmZvQXR0cnMge1xuXHRyZXR1cm4gT2JqZWN0Lmhhc093bihkcm9wZG93bkNoaWxkLCBcImluZm9cIikgJiYgT2JqZWN0Lmhhc093bihkcm9wZG93bkNoaWxkLCBcImNlbnRlclwiKSAmJiBPYmplY3QuaGFzT3duKGRyb3Bkb3duQ2hpbGQsIFwiYm9sZFwiKVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBvc1JlY3Qge1xuXHRyZWFkb25seSBoZWlnaHQ6IG51bWJlclxuXHRyZWFkb25seSB3aWR0aDogbnVtYmVyXG5cdHJlYWRvbmx5IHRvcDogbnVtYmVyXG5cdHJlYWRvbmx5IGxlZnQ6IG51bWJlclxuXHRyZWFkb25seSByaWdodDogbnVtYmVyXG5cdHJlYWRvbmx5IGJvdHRvbTogbnVtYmVyXG59XG5cbi8vIFNvbWUgQW5kcm9pZCBXZWJWaWV3cyBzdGlsbCBkb24ndCBzdXBwb3J0IERPTVJlY3Qgc28gd2UgcG9seWZpbGwgdGhhdFxuLy8gSW1wbGVtZW50ZWQgYWNjb3JkaW5nIHRvIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9ET01SZWN0UmVhZE9ubHkgYW5kIGNvbW1vbiBzZW5zZVxuZXhwb3J0IGNsYXNzIERvbVJlY3RSZWFkT25seVBvbHlmaWxsZWQgaW1wbGVtZW50cyBQb3NSZWN0IHtcblx0eDogbnVtYmVyXG5cdHk6IG51bWJlclxuXHR3aWR0aDogbnVtYmVyXG5cdGhlaWdodDogbnVtYmVyXG5cblx0Y29uc3RydWN0b3IoeDogbnVtYmVyLCB5OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKSB7XG5cdFx0dGhpcy54ID0geFxuXHRcdHRoaXMueSA9IHlcblx0XHR0aGlzLndpZHRoID0gd2lkdGhcblx0XHR0aGlzLmhlaWdodCA9IGhlaWdodFxuXHR9XG5cblx0Z2V0IHRvcCgpOiBudW1iZXIge1xuXHRcdHJldHVybiB0aGlzLmhlaWdodCA+IDAgPyB0aGlzLnkgOiB0aGlzLnkgKyB0aGlzLmhlaWdodFxuXHR9XG5cblx0Z2V0IGJvdHRvbSgpOiBudW1iZXIge1xuXHRcdHJldHVybiB0aGlzLmhlaWdodCA+IDAgPyB0aGlzLnkgKyB0aGlzLmhlaWdodCA6IHRoaXMueVxuXHR9XG5cblx0Z2V0IGxlZnQoKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gdGhpcy53aWR0aCA+IDAgPyB0aGlzLnggOiB0aGlzLnggKyB0aGlzLndpZHRoXG5cdH1cblxuXHRnZXQgcmlnaHQoKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gdGhpcy53aWR0aCA+IDAgPyB0aGlzLnggKyB0aGlzLndpZHRoIDogdGhpcy54XG5cdH1cbn1cblxuLy8gVE9ETzogYWRkIHJlc2l6ZSBsaXN0ZW5lciBsaWtlIGluIHRoZSBvbGQgRHJvcGRvd25cbmV4cG9ydCBjbGFzcyBEcm9wZG93biBpbXBsZW1lbnRzIE1vZGFsQ29tcG9uZW50IHtcblx0cHJpdmF0ZSBjaGlsZHJlbjogUmVhZG9ubHlBcnJheTxEcm9wZG93bkNoaWxkQXR0cnM+XG5cdHByaXZhdGUgZG9tRHJvcGRvd246IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGxcblx0b3JpZ2luOiBQb3NSZWN0IHwgbnVsbCA9IG51bGxcblx0b25pbml0OiBNb2RhbENvbXBvbmVudFtcIm9uaW5pdFwiXVxuXHR2aWV3OiBNb2RhbENvbXBvbmVudFtcInZpZXdcIl1cblx0cHJpdmF0ZSByZWFkb25seSB3aWR0aDogbnVtYmVyXG5cdHNob3J0Y3V0czogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueVxuXHRwcml2YXRlIGZpbHRlclN0cmluZzogc3RyaW5nXG5cdHByaXZhdGUgZG9tSW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGRvbUNvbnRlbnRzOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgaXNGaWx0ZXJhYmxlOiBib29sZWFuID0gZmFsc2Vcblx0cHJpdmF0ZSBtYXhIZWlnaHQ6IG51bWJlciB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgY2xvc2VIYW5kbGVyOiBUaHVuayB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgZm9jdXNlZEJlZm9yZVNob3duOiBIVE1MRWxlbWVudCB8IG51bGwgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50XG5cblx0Y29uc3RydWN0b3IobGF6eUNoaWxkcmVuOiBsYXp5PFJlYWRvbmx5QXJyYXk8RHJvcGRvd25DaGlsZEF0dHJzIHwgbnVsbD4+LCB3aWR0aDogbnVtYmVyKSB7XG5cdFx0dGhpcy5jaGlsZHJlbiA9IFtdXG5cdFx0dGhpcy53aWR0aCA9IHdpZHRoXG5cdFx0dGhpcy5maWx0ZXJTdHJpbmcgPSBcIlwiXG5cblx0XHR0aGlzLm9uaW5pdCA9ICgpID0+IHtcblx0XHRcdHRoaXMuY2hpbGRyZW4gPSBmaWx0ZXJOdWxsKGxhenlDaGlsZHJlbigpKVxuXHRcdFx0dGhpcy5pc0ZpbHRlcmFibGUgPSB0aGlzLmNoaWxkcmVuLmxlbmd0aCA+IDEwXG5cdFx0XHR0aGlzLmNoaWxkcmVuLm1hcCgoY2hpbGQpID0+IHtcblx0XHRcdFx0aWYgKGlzRHJvcERvd25JbmZvKGNoaWxkKSkge1xuXHRcdFx0XHRcdHJldHVybiBjaGlsZFxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgYnV0dG9uQ2hpbGQ6IERyb3Bkb3duQnV0dG9uQXR0cnMgPSBjaGlsZFxuXHRcdFx0XHRidXR0b25DaGlsZC5jbGljayA9IHRoaXMud3JhcENsaWNrKGNoaWxkLmNsaWNrID8gY2hpbGQuY2xpY2sgOiAoKSA9PiBudWxsKVxuXG5cdFx0XHRcdHJldHVybiBjaGlsZFxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRsZXQgX3Nob3J0Y3V0cyA9IHRoaXMuX2NyZWF0ZVNob3J0Y3V0cygpXG5cblx0XHR0aGlzLnNob3J0Y3V0cyA9ICgpID0+IHtcblx0XHRcdHJldHVybiBfc2hvcnRjdXRzXG5cdFx0fVxuXG5cdFx0Y29uc3QgaW5wdXRGaWVsZCA9ICgpID0+IHtcblx0XHRcdHJldHVybiB0aGlzLmlzRmlsdGVyYWJsZVxuXHRcdFx0XHQ/IG0oXG5cdFx0XHRcdFx0XHRcImlucHV0LmlucHV0LmRyb3Bkb3duLWJhci5lbGV2YXRlZC1iZy5kb05vdENsb3NlLmJ1dHRvbi1oZWlnaHQuYnV0dG9uLW1pbi1oZWlnaHQucHItc1wiLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRwbGFjZWhvbGRlcjogbGFuZy5nZXQoXCJ0eXBlVG9GaWx0ZXJfbGFiZWxcIiksXG5cdFx0XHRcdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+IHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmRvbUlucHV0ID0gZG93bmNhc3Q8SFRNTElucHV0RWxlbWVudD4odm5vZGUuZG9tKVxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZG9tSW5wdXQudmFsdWUgPSB0aGlzLmZpbHRlclN0cmluZ1xuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRvbmlucHV0OiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5maWx0ZXJTdHJpbmcgPSBuZXZlck51bGwodGhpcy5kb21JbnB1dCkudmFsdWVcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRwYWRkaW5nTGVmdDogcHgoc2l6ZS5ocGFkX2xhcmdlICogMiksXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0dGhpcy5maWx0ZXJTdHJpbmcsXG5cdFx0XHRcdCAgKVxuXHRcdFx0XHQ6IG51bGxcblx0XHR9XG5cblx0XHRjb25zdCBjb250ZW50cyA9ICgpID0+IHtcblx0XHRcdGNvbnN0IHNob3dpbmdJY29ucyA9IHRoaXMuY2hpbGRyZW4uc29tZSgoYykgPT4gXCJpY29uXCIgaW4gYyAmJiB0eXBlb2YgYy5pY29uICE9PSBcInVuZGVmaW5lZFwiKVxuXHRcdFx0Ly8gV2UgbmVlZCB0byBzZXQgdGhlIGhlaWdodCB0byB0aGUgaGVpZ2h0IG9mIHRoZSBwYXJlbnQgd2hpY2ggYWxyZWFkeSBoYXMgdGhlIGNhbGN1bGF0ZWQgYW5kIG1lYXN1cmVkIGhlaWdodCwgb3RoZXJ3aXNlIHRoaXMgZWxlbWVudCBtaWdodFxuXHRcdFx0Ly8gb3ZlcmZsb3cgdGhlIHBhcmVudCAodGhlIG92ZXJhbGwgZHJvcGRvd24gY29udGFpbmVyKSB3aGVuIHRoZXJlJ3Mgbm90IGVub3VnaCB2ZXJ0aWNhbCBzcGFjZSB0byBkaXNwbGF5IGFsbCBpdGVtc1xuXHRcdFx0cmV0dXJuIG0oXG5cdFx0XHRcdFwiLmRyb3Bkb3duLWNvbnRlbnQuc2Nyb2xsXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyb2xlOiBBcmlhUm9sZS5NZW51LFxuXHRcdFx0XHRcdHRhYmluZGV4OiBUYWJJbmRleC5Qcm9ncmFtbWF0aWMsXG5cdFx0XHRcdFx0b25jcmVhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5kb21Db250ZW50cyA9IHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0b251cGRhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMubWF4SGVpZ2h0ID09IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgY2hpbGRyZW4gPSBBcnJheS5mcm9tKHZub2RlLmRvbS5jaGlsZHJlbikgYXMgQXJyYXk8SFRNTEVsZW1lbnQ+XG5cdFx0XHRcdFx0XHRcdHRoaXMubWF4SGVpZ2h0ID0gY2hpbGRyZW4ucmVkdWNlKChhY2N1bXVsYXRvciwgY2hpbGRyZW4pID0+IGFjY3VtdWxhdG9yICsgY2hpbGRyZW4ub2Zmc2V0SGVpZ2h0LCAwKSArIHNpemUudnBhZFxuXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLm9yaWdpbikge1xuXHRcdFx0XHRcdFx0XHRcdC8vIFRoZSBkcm9wZG93bi1jb250ZW50IGVsZW1lbnQgaXMgYWRkZWQgdG8gdGhlIGRvbSBoYXMgYSBoaWRkZW4gZWxlbWVudCBmaXJzdC5cblx0XHRcdFx0XHRcdFx0XHQvLyBUaGUgbWF4SGVpZ2h0IGlzIGF2YWlsYWJsZSBhZnRlciB0aGUgZmlyc3Qgb251cGRhdGUgY2FsbC4gVGhlbiB0aGlzIHByb21pc2Ugd2lsbCByZXNvbHZlIGFuZCB3ZSBjYW4gc2FmZWx5XG5cdFx0XHRcdFx0XHRcdFx0Ly8gc2hvdyB0aGUgZHJvcGRvd24uXG5cdFx0XHRcdFx0XHRcdFx0Ly8gTW9kYWwgYWx3YXlzIHNjaGVkdWxlcyByZWRyYXcgaW4gb25jcmVhdGUoKSBvZiBhIGNvbXBvbmVudCBzbyB3ZSBhcmUgZ3VhcmFudGVlZCB0byBoYXZlIG9udXBkYXRlKCkgY2FsbC5cblx0XHRcdFx0XHRcdFx0XHRzaG93RHJvcGRvd24odGhpcy5vcmlnaW4sIGFzc2VydE5vdE51bGwodGhpcy5kb21Ecm9wZG93biksIHRoaXMubWF4SGVpZ2h0LCB0aGlzLndpZHRoKS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IGZpcnN0QnV0dG9uID0gdm5vZGUuZG9tLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpLml0ZW0oMClcblx0XHRcdFx0XHRcdFx0XHRcdGlmICh0aGlzLmRvbUlucHV0ICYmICFjbGllbnQuaXNNb2JpbGVEZXZpY2UoKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmRvbUlucHV0LmZvY3VzKClcblx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoZmlyc3RCdXR0b24gIT09IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Zmlyc3RCdXR0b24uZm9jdXMoKVxuXHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5kb21Db250ZW50cz8uZm9jdXMoKVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG9uc2Nyb2xsOiAoZXY6IEV2ZW50UmVkcmF3PEV2ZW50PikgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgdGFyZ2V0ID0gZXYudGFyZ2V0IGFzIEhUTUxFbGVtZW50XG5cdFx0XHRcdFx0XHQvLyBuZWVkZWQgaGVyZSB0byBwcmV2ZW50IGZsaWNrZXJpbmcgb24gaW9zXG5cdFx0XHRcdFx0XHRldi5yZWRyYXcgPSB0aGlzLmRvbUNvbnRlbnRzICE9IG51bGwgJiYgdGFyZ2V0LnNjcm9sbFRvcCA8IDAgJiYgdGFyZ2V0LnNjcm9sbFRvcCArIHRoaXMuZG9tQ29udGVudHMub2Zmc2V0SGVpZ2h0ID4gdGFyZ2V0LnNjcm9sbEhlaWdodFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdHRvcDogcHgodGhpcy5nZXRGaWx0ZXJIZWlnaHQoKSksXG5cdFx0XHRcdFx0XHRib3R0b206IDAsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0dGhpcy52aXNpYmxlQ2hpbGRyZW4oKS5tYXAoKGNoaWxkKSA9PiB7XG5cdFx0XHRcdFx0aWYgKGlzRHJvcERvd25JbmZvKGNoaWxkKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIG0oRHJvcGRvd25JbmZvLCBjaGlsZClcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIERyb3Bkb3duLnJlbmRlckRyb3BEb3duQnV0dG9uKGNoaWxkLCBzaG93aW5nSWNvbnMpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHR9XG5cdFx0Y29uc3QgY2xvc2VCdG4gPSAoKSA9PiB7XG5cdFx0XHRyZXR1cm4gbShCYXNlQnV0dG9uLCB7XG5cdFx0XHRcdGxhYmVsOiBcImNsb3NlX2FsdFwiLFxuXHRcdFx0XHR0ZXh0OiBsYW5nLmdldChcImNsb3NlX2FsdFwiKSxcblx0XHRcdFx0Y2xhc3M6IFwiaGlkZGVuLXVudGlsLWZvY3VzIGNvbnRlbnQtYWNjZW50LWZnIGJ1dHRvbi1jb250ZW50XCIsXG5cdFx0XHRcdG9uY2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLm9uQ2xvc2UoKVxuXHRcdFx0XHR9LFxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHR0aGlzLnZpZXcgPSAoKTogQ2hpbGRyZW4gPT4ge1xuXHRcdFx0cmV0dXJuIG0oXG5cdFx0XHRcdFwiLmRyb3Bkb3duLXBhbmVsLmVsZXZhdGVkLWJnLmJvcmRlci1yYWRpdXMuZHJvcGRvd24tc2hhZG93LmZpdC1jb250ZW50LmZsZXgtY29sdW1uLmZsZXgtc3RhcnRcIixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+IHtcblx0XHRcdFx0XHRcdHRoaXMuZG9tRHJvcGRvd24gPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0XHRcdC8vIEl0IGlzIGltcG9ydGFudCB0byBzZXQgaW5pdGlhbCBvcGFjaXR5IHNvIHRoYXQgdXNlciBkb2Vzbid0IHNlZSBpdCB3aXRoIGZ1bGwgb3BhY2l0eSBiZWZvcmUgYW5pbWF0aW5nLlxuXHRcdFx0XHRcdFx0dGhpcy5kb21Ecm9wZG93bi5zdHlsZS5vcGFjaXR5ID0gXCIwXCJcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG9ua2V5cHJlc3M6ICgpID0+IHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLmRvbUlucHV0KSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuZG9tSW5wdXQuZm9jdXMoKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFtpbnB1dEZpZWxkKCksIGNvbnRlbnRzKCksIGNsb3NlQnRuKCldLFxuXHRcdFx0KVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgc3RhdGljIHJlbmRlckRyb3BEb3duQnV0dG9uKGNoaWxkOiBEcm9wZG93bkJ1dHRvbkF0dHJzLCBzaG93aW5nSWNvbnM6IGJvb2xlYW4pIHtcblx0XHRyZXR1cm4gbShSb3dCdXR0b24sIHtcblx0XHRcdHJvbGU6IEFyaWFSb2xlLk9wdGlvbixcblx0XHRcdHNlbGVjdGVkOiBjaGlsZC5zZWxlY3RlZCxcblx0XHRcdGxhYmVsOiBjaGlsZC5sYWJlbCxcblx0XHRcdHRleHQ6IGNoaWxkLnRleHQsXG5cdFx0XHRpY29uOiBjaGlsZC5pY29uICYmIHNob3dpbmdJY29ucyA/IGNoaWxkLmljb24gOiBzaG93aW5nSWNvbnMgPyBcIm5vbmVcIiA6IHVuZGVmaW5lZCxcblx0XHRcdGNsYXNzOiBcImRyb3Bkb3duLWJ1dHRvblwiLFxuXHRcdFx0b25jbGljazogY2hpbGQuY2xpY2sgPyBjaGlsZC5jbGljayA6IG5vT3AsXG5cdFx0fSBzYXRpc2ZpZXMgUm93QnV0dG9uQXR0cnMpXG5cdH1cblxuXHR3cmFwQ2xpY2soZm46IChldmVudDogTW91c2VFdmVudCwgZG9tOiBIVE1MRWxlbWVudCkgPT4gdW5rbm93bik6IChldmVudDogTW91c2VFdmVudCwgZG9tOiBIVE1MRWxlbWVudCkgPT4gdW5rbm93biB7XG5cdFx0cmV0dXJuIChlOiBNb3VzZUV2ZW50LCBkb20pID0+IHtcblx0XHRcdGNvbnN0IHIgPSBmbihlLCBkb20pXG5cdFx0XHR0aGlzLmNsb3NlKClcblx0XHRcdHJldHVybiByXG5cdFx0fVxuXHR9XG5cblx0YmFja2dyb3VuZENsaWNrKGU6IE1vdXNlRXZlbnQpIHtcblx0XHRpZiAoXG5cdFx0XHR0aGlzLmRvbURyb3Bkb3duICYmXG5cdFx0XHQhKGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5jbGFzc0xpc3QuY29udGFpbnMoXCJkb05vdENsb3NlXCIpICYmXG5cdFx0XHQodGhpcy5kb21Ecm9wZG93bi5jb250YWlucyhlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkgfHwgdGhpcy5kb21Ecm9wZG93bi5wYXJlbnROb2RlID09PSBlLnRhcmdldClcblx0XHQpIHtcblx0XHRcdHRoaXMub25DbG9zZSgpXG5cdFx0fVxuXHR9XG5cblx0X2NyZWF0ZVNob3J0Y3V0cygpOiBBcnJheTxTaG9ydGN1dD4ge1xuXHRcdHJldHVybiBbXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5FU0MsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHRoaXMub25DbG9zZSgpLFxuXHRcdFx0XHRoZWxwOiBcImNsb3NlX2FsdFwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLlRBQixcblx0XHRcdFx0c2hpZnQ6IHRydWUsXG5cdFx0XHRcdGV4ZWM6ICgpID0+ICh0aGlzLmRvbURyb3Bkb3duID8gZm9jdXNQcmV2aW91cyh0aGlzLmRvbURyb3Bkb3duKSA6IGZhbHNlKSxcblx0XHRcdFx0aGVscDogXCJzZWxlY3RQcmV2aW91c19hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5UQUIsXG5cdFx0XHRcdHNoaWZ0OiBmYWxzZSxcblx0XHRcdFx0ZXhlYzogKCkgPT4gKHRoaXMuZG9tRHJvcGRvd24gPyBmb2N1c05leHQodGhpcy5kb21Ecm9wZG93bikgOiBmYWxzZSksXG5cdFx0XHRcdGhlbHA6IFwic2VsZWN0TmV4dF9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5VUCxcblx0XHRcdFx0ZXhlYzogKCkgPT4gKHRoaXMuZG9tRHJvcGRvd24gPyBmb2N1c1ByZXZpb3VzKHRoaXMuZG9tRHJvcGRvd24pIDogZmFsc2UpLFxuXHRcdFx0XHRoZWxwOiBcInNlbGVjdFByZXZpb3VzX2FjdGlvblwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLkRPV04sXG5cdFx0XHRcdGV4ZWM6ICgpID0+ICh0aGlzLmRvbURyb3Bkb3duID8gZm9jdXNOZXh0KHRoaXMuZG9tRHJvcGRvd24pIDogZmFsc2UpLFxuXHRcdFx0XHRoZWxwOiBcInNlbGVjdE5leHRfYWN0aW9uXCIsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuUkVUVVJOLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB0aGlzLmNob29zZU1hdGNoKCksXG5cdFx0XHRcdGhlbHA6IFwib2tfYWN0aW9uXCIsXG5cdFx0XHR9LFxuXHRcdF1cblx0fVxuXG5cdHNldE9yaWdpbihvcmlnaW46IFBvc1JlY3QpOiB0aGlzIHtcblx0XHR0aGlzLm9yaWdpbiA9IG9yaWdpblxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXHRjbG9zZSgpOiB2b2lkIHtcblx0XHRtb2RhbC5yZW1vdmUodGhpcylcblx0fVxuXG5cdG9uQ2xvc2UoKTogdm9pZCB7XG5cdFx0aWYgKHRoaXMuY2xvc2VIYW5kbGVyKSB7XG5cdFx0XHR0aGlzLmNsb3NlSGFuZGxlcigpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuY2xvc2UoKVxuXHRcdH1cblx0fVxuXG5cdHBvcFN0YXRlKGU6IEV2ZW50KTogYm9vbGVhbiB7XG5cdFx0dGhpcy5vbkNsb3NlKClcblx0XHRyZXR1cm4gZmFsc2Vcblx0fVxuXG5cdGNhbGxpbmdFbGVtZW50KCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMuZm9jdXNlZEJlZm9yZVNob3duXG5cdH1cblxuXHRjaG9vc2VNYXRjaDogKCkgPT4gYm9vbGVhbiA9ICgpID0+IHtcblx0XHRjb25zdCBmaWx0ZXJTdHJpbmcgPSB0aGlzLmZpbHRlclN0cmluZy50b0xvd2VyQ2FzZSgpXG5cblx0XHRsZXQgdmlzaWJsZUVsZW1lbnRzOiBBcnJheTxCdXR0b25BdHRycz4gPSBkb3duY2FzdCh0aGlzLnZpc2libGVDaGlsZHJlbigpLmZpbHRlcigoYikgPT4gIWlzRHJvcERvd25JbmZvKGIpKSlcblx0XHRsZXQgbWF0Y2hpbmdCdXR0b24gPVxuXHRcdFx0dmlzaWJsZUVsZW1lbnRzLmxlbmd0aCA9PT0gMSA/IHZpc2libGVFbGVtZW50c1swXSA6IHZpc2libGVFbGVtZW50cy5maW5kKChiKSA9PiBsYW5nLmdldFRyYW5zbGF0aW9uVGV4dChiLmxhYmVsKS50b0xvd2VyQ2FzZSgpID09PSBmaWx0ZXJTdHJpbmcpXG5cblx0XHRpZiAodGhpcy5kb21JbnB1dCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSB0aGlzLmRvbUlucHV0ICYmIG1hdGNoaW5nQnV0dG9uICYmIG1hdGNoaW5nQnV0dG9uLmNsaWNrKSB7XG5cdFx0XHRtYXRjaGluZ0J1dHRvbi5jbGljayhuZXcgTW91c2VFdmVudChcImNsaWNrXCIpLCB0aGlzLmRvbUlucHV0KVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWVcblx0fVxuXG5cdC8qKlxuXHQgKiBJcyBpbnZva2VkIGZyb20gbW9kYWwgYXMgdGhlIHR3byBhbmltYXRpb25zIChiYWNrZ3JvdW5kIGxheWVyIG9wYWNpdHkgYW5kIGRyb3Bkb3duKSBzaG91bGQgcnVuIGluIHBhcmFsbGVsXG5cdCAqL1xuXHRoaWRlQW5pbWF0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXHR9XG5cblx0c2V0Q2xvc2VIYW5kbGVyKGhhbmRsZXI6IFRodW5rKTogdGhpcyB7XG5cdFx0dGhpcy5jbG9zZUhhbmRsZXIgPSBoYW5kbGVyXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cdHByaXZhdGUgdmlzaWJsZUNoaWxkcmVuKCk6IEFycmF5PERyb3Bkb3duQ2hpbGRBdHRycz4ge1xuXHRcdHJldHVybiB0aGlzLmNoaWxkcmVuLmZpbHRlcigoYikgPT4ge1xuXHRcdFx0aWYgKGlzRHJvcERvd25JbmZvKGIpKSB7XG5cdFx0XHRcdHJldHVybiBiLmluZm8uaW5jbHVkZXModGhpcy5maWx0ZXJTdHJpbmcudG9Mb3dlckNhc2UoKSlcblx0XHRcdH0gZWxzZSBpZiAodGhpcy5pc0ZpbHRlcmFibGUpIHtcblx0XHRcdFx0Y29uc3QgZmlsdGVyYWJsZSA9IGxhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KGIudGV4dCA/PyBiLmxhYmVsKVxuXHRcdFx0XHRyZXR1cm4gZmlsdGVyYWJsZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHRoaXMuZmlsdGVyU3RyaW5nLnRvTG93ZXJDYXNlKCkpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGdldEZpbHRlckhlaWdodCgpOiBudW1iZXIge1xuXHRcdHJldHVybiB0aGlzLmlzRmlsdGVyYWJsZSA/IHNpemUuYnV0dG9uX2hlaWdodCArIHNpemUudnBhZF94cyA6IDBcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRHJvcGRvd24oe1xuXHRsYXp5QnV0dG9ucyxcblx0b3ZlcnJpZGVPcmlnaW4sXG5cdHdpZHRoLFxuXHR3aXRoQmFja2dyb3VuZCxcbn06IHtcblx0bGF6eUJ1dHRvbnM6IGxhenk8UmVhZG9ubHlBcnJheTxEcm9wZG93bkNoaWxkQXR0cnMgfCBudWxsPj5cblx0b3ZlcnJpZGVPcmlnaW4/OiAob3JpZ2luYWw6IFBvc1JlY3QpID0+IFBvc1JlY3Rcblx0d2lkdGg/OiBudW1iZXJcblx0d2l0aEJhY2tncm91bmQ/OiBib29sZWFuXG59KTogQ2xpY2tIYW5kbGVyIHtcblx0cmV0dXJuIGNyZWF0ZUFzeW5jRHJvcGRvd24oeyBsYXp5QnV0dG9uczogYXN5bmMgKCkgPT4gbGF6eUJ1dHRvbnMoKSwgb3ZlcnJpZGVPcmlnaW4sIHdpZHRoLCB3aXRoQmFja2dyb3VuZCB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQXN5bmNEcm9wZG93bih7XG5cdGxhenlCdXR0b25zLFxuXHRvdmVycmlkZU9yaWdpbixcblx0d2lkdGggPSAyMDAsXG5cdHdpdGhCYWNrZ3JvdW5kID0gZmFsc2UsXG5cdG9uQ2xvc2UgPSB1bmRlZmluZWQsXG59OiB7XG5cdGxhenlCdXR0b25zOiBsYXp5QXN5bmM8UmVhZG9ubHlBcnJheTxEcm9wZG93bkNoaWxkQXR0cnMgfCBudWxsPj5cblx0b3ZlcnJpZGVPcmlnaW4/OiAob3JpZ2luYWw6IFBvc1JlY3QpID0+IFBvc1JlY3Rcblx0d2lkdGg/OiBudW1iZXJcblx0d2l0aEJhY2tncm91bmQ/OiBib29sZWFuXG5cdG9uQ2xvc2U/OiBUaHVua1xufSk6IENsaWNrSGFuZGxlciB7XG5cdC8vIG5vdCBhbGwgYnJvd3NlcnMgaGF2ZSB0aGUgYWN0dWFsIGJ1dHRvbiBhcyBlLmN1cnJlbnRUYXJnZXQsIGJ1dCBhbGwgb2YgdGhlbSBzZW5kIGl0IGFzIGEgc2Vjb25kIGFyZ3VtZW50IChzZWUgaHR0cHM6Ly9naXRodWIuY29tL3R1dGFvL3R1dGFub3RhL2lzc3Vlcy8xMTEwKVxuXHRyZXR1cm4gKF8sIGRvbSkgPT4ge1xuXHRcdGNvbnN0IG9yaWdpbmFsQnV0dG9ucyA9IGxhenlCdXR0b25zKClcblx0XHRsZXQgYnV0dG9uc1Jlc29sdmVkID0gZmFsc2Vcblx0XHRvcmlnaW5hbEJ1dHRvbnMudGhlbigoKSA9PiB7XG5cdFx0XHRidXR0b25zUmVzb2x2ZWQgPSB0cnVlXG5cdFx0fSlcblx0XHRsZXQgYnV0dG9ucyA9IG9yaWdpbmFsQnV0dG9uc1xuXHRcdC8vIElmIHRoZSBwcm9taXNlIGlzIHBlbmRpbmcgYW5kIGRvZXMgbm90IHJlc29sdmUgaW4gMTAwbXMsIHNob3cgcHJvZ3Jlc3MgZGlhbG9nXG5cdFx0YnV0dG9ucyA9IFByb21pc2UucmFjZShbXG5cdFx0XHRvcmlnaW5hbEJ1dHRvbnMsXG5cdFx0XHRQcm9taXNlLmFsbChbZGVsYXkoMTAwKSwgaW1wb3J0KFwiLi4vZGlhbG9ncy9Qcm9ncmVzc0RpYWxvZy5qc1wiKV0pLnRoZW4oKFtfLCBtb2R1bGVdKSA9PiB7XG5cdFx0XHRcdGlmICghYnV0dG9uc1Jlc29sdmVkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG1vZHVsZS5zaG93UHJvZ3Jlc3NEaWFsb2coXCJsb2FkaW5nX21zZ1wiLCBvcmlnaW5hbEJ1dHRvbnMpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIG9yaWdpbmFsQnV0dG9uc1xuXHRcdFx0XHR9XG5cdFx0XHR9KSxcblx0XHRdKVxuXHRcdGJ1dHRvbnMudGhlbigoYnV0dG9ucykgPT4ge1xuXHRcdFx0bGV0IGRyb3Bkb3duID0gbmV3IERyb3Bkb3duKCgpID0+IGJ1dHRvbnMsIHdpZHRoKVxuXHRcdFx0aWYgKG9uQ2xvc2UpIHtcblx0XHRcdFx0ZHJvcGRvd24uc2V0Q2xvc2VIYW5kbGVyKCgpID0+IHtcblx0XHRcdFx0XHRvbkNsb3NlKClcblx0XHRcdFx0XHRkcm9wZG93bi5jbG9zZSgpXG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0XHRsZXQgYnV0dG9uUmVjdFxuXHRcdFx0aWYgKG92ZXJyaWRlT3JpZ2luKSB7XG5cdFx0XHRcdGJ1dHRvblJlY3QgPSBvdmVycmlkZU9yaWdpbihkb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBXaGVuIG5ldyBpbnN0YW5jZSBpcyBjcmVhdGVkIGFuZCB0aGUgb2xkIERPTSBpcyBkZXRhY2hlZCB3ZSBtYXkgaGF2ZSBpbmNvcnJlY3QgcG9zaXRpb25pbmdcblx0XHRcdFx0YnV0dG9uUmVjdCA9IGRvbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuXHRcdFx0fVxuXHRcdFx0ZHJvcGRvd24uc2V0T3JpZ2luKGJ1dHRvblJlY3QpXG5cdFx0XHRtb2RhbC5kaXNwbGF5VW5pcXVlKGRyb3Bkb3duLCB3aXRoQmFja2dyb3VuZClcblx0XHR9KVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93RHJvcGRvd25BdFBvc2l0aW9uKFxuXHRidXR0b25zOiBSZWFkb25seUFycmF5PERyb3Bkb3duQ2hpbGRBdHRycz4sXG5cdHhQb3M6IG51bWJlcixcblx0eVBvczogbnVtYmVyLFxuXHRjbG9zZUhhbmRsZXI6IFRodW5rID0gbm9PcCxcblx0d2lkdGg6IG51bWJlciA9IDIwMCxcbikge1xuXHRjb25zdCBkcm9wZG93biA9IG5ldyBEcm9wZG93bigoKSA9PiBidXR0b25zLCB3aWR0aClcblx0Y29uc3QgY2xvc2UgPSBtYWtlU2luZ2xlVXNlPHZvaWQ+KCgpID0+IHtcblx0XHRjbG9zZUhhbmRsZXIoKVxuXHRcdGRyb3Bkb3duLmNsb3NlKClcblx0fSlcblx0ZHJvcGRvd24uc2V0T3JpZ2luKG5ldyBEb21SZWN0UmVhZE9ubHlQb2x5ZmlsbGVkKHhQb3MsIHlQb3MsIDAsIDApKVxuXHRkcm9wZG93bi5zZXRDbG9zZUhhbmRsZXIoY2xvc2UpXG5cdG1vZGFsLmRpc3BsYXlVbmlxdWUoZHJvcGRvd24sIGZhbHNlKVxufVxuXG50eXBlIEF0dGFjaERyb3Bkb3duUGFyYW1zID0ge1xuXHRtYWluQnV0dG9uQXR0cnM6IE9taXQ8SWNvbkJ1dHRvbkF0dHJzLCBcImNsaWNrXCI+XG5cdGNoaWxkQXR0cnM6IGxhenk8JFByb21pc2FibGU8UmVhZG9ubHlBcnJheTxEcm9wZG93bkNoaWxkQXR0cnMgfCBudWxsPj4+XG5cdC8qKiBjYWxsZWQgdG8gZGV0ZXJtaW5lIGlmIHRoZSBkcm9wZG93biBhY3R1YWxseSBuZWVkcyB0byBiZSBzaG93biAqL1xuXHRzaG93RHJvcGRvd24/OiBsYXp5PGJvb2xlYW4+XG5cdHdpZHRoPzogbnVtYmVyXG5cdG92ZXJyaWRlT3JpZ2luPzogKG9yaWdpbmFsOiBQb3NSZWN0KSA9PiBQb3NSZWN0XG5cdG9uQ2xvc2U/OiBUaHVua1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0gbWFpbkJ1dHRvbkF0dHJzIHRoZSBhdHRyaWJ1dGVzIG9mIHRoZSBtYWluIGJ1dHRvbi4gaWYgc2hvd0Ryb3Bkb3duIHJldHVybnMgZmFsc2UsIG5vdGhpbmcgd2lsbCBoYXBwZW4uXG4gKiBAcGFyYW0gY2hpbGRBdHRycyB0aGUgYXR0cmlidXRlcyBvZiB0aGUgY2hpbGRyZW4gc2hvd24gaW4gdGhlIGRyb3Bkb3duXG4gKiBAcGFyYW0gc2hvd0Ryb3Bkb3duIHRoaXMgd2lsbCBiZSBjaGVja2VkIGJlZm9yZSBzaG93aW5nIHRoZSBkcm9wZG93blxuICogQHBhcmFtIHdpZHRoIHdpZHRoIG9mIHRoZSBkcm9wZG93blxuICogQHBhcmFtIG9uQ2xvc2UgY2FsbGJhY2sgdGhhdCBpcyBjYWxsZWQgd2hlbiB0aGUgZHJvcGRvd24gY2xvc2VzXG4gKiBAcmV0dXJucyB7QnV0dG9uQXR0cnN9IG1vZGlmaWVkIG1haW5CdXR0b25BdHRycyB0aGF0IHNob3dzIGEgZHJvcGRvd24gb24gY2xpY2sgb3JcbiAqIGJ1dHRvbiBkb2Vzbid0IGRvIGFueXRoaW5nIGlmIHNob3dEcm9wZG93biByZXR1cm5zIGZhbHNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdHRhY2hEcm9wZG93bih7XG5cdG1haW5CdXR0b25BdHRycyxcblx0Y2hpbGRBdHRycyxcblx0c2hvd0Ryb3Bkb3duID0gKCkgPT4gdHJ1ZSxcblx0d2lkdGgsXG5cdG92ZXJyaWRlT3JpZ2luLFxuXHRvbkNsb3NlLFxufTogQXR0YWNoRHJvcGRvd25QYXJhbXMpOiBJY29uQnV0dG9uQXR0cnMge1xuXHRyZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgbWFpbkJ1dHRvbkF0dHJzLCB7XG5cdFx0Y2xpY2s6IChlOiBNb3VzZUV2ZW50LCBkb206IEhUTUxFbGVtZW50KSA9PiB7XG5cdFx0XHRpZiAoc2hvd0Ryb3Bkb3duKCkpIHtcblx0XHRcdFx0Y29uc3QgZHJvcERvd25GbiA9IGNyZWF0ZUFzeW5jRHJvcGRvd24oe1xuXHRcdFx0XHRcdGxhenlCdXR0b25zOiAoKSA9PiBQcm9taXNlLnJlc29sdmUoY2hpbGRBdHRycygpKSxcblx0XHRcdFx0XHRvdmVycmlkZU9yaWdpbixcblx0XHRcdFx0XHR3aWR0aCxcblx0XHRcdFx0XHRvbkNsb3NlLFxuXHRcdFx0XHR9KVxuXHRcdFx0XHRkcm9wRG93bkZuKGUsIGRvbSlcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKVxuXHRcdFx0fVxuXHRcdH0sXG5cdH0pXG59XG5cbmV4cG9ydCBjb25zdCBEUk9QRE9XTl9NQVJHSU4gPSA0XG5cbmV4cG9ydCBmdW5jdGlvbiBzaG93RHJvcGRvd24oXG5cdG9yaWdpbjogUG9zUmVjdCxcblx0ZG9tRHJvcGRvd246IEhUTUxFbGVtZW50LFxuXHRjb250ZW50SGVpZ2h0OiBudW1iZXIsXG5cdGNvbnRlbnRXaWR0aDogbnVtYmVyLFxuXHRwb3NpdGlvbj86IFwidG9wXCIgfCBcImJvdHRvbVwiLFxuKTogUHJvbWlzZTx1bmtub3duPiB7XG5cdC8vIHwtLS0tLS0tLS0tLS0tLS0tLS18ICAgIHwtLS0tLS0tLS0tLS0tLS0tLS18ICAgIHwtLS0tLS0tLS0tLS0tLS0tLS18ICAgIHwtLS0tLS0tLS0tLS0tLS0tLS18XG5cdC8vIHwgICAgICAgICAgICAgICAgICB8ICAgIHwgICAgICAgICAgICAgICAgICB8ICAgIHwgICAgICAgICAgICAgICAgICB8ICAgIHwgICAgICAgICAgICAgICAgICB8XG5cdC8vIHwgICAgICB8LS0tLS0tLXwgICB8ICAgIHwgIHwtLS0tLS0tfCAgICAgICB8ICAgIHwgIHwtLS0tLS0tLS0tLV4gICB8ICAgIHwgIF4tLS0tLS0tLS0tLXwgICB8XG5cdC8vIHwgICAgICB8IGVsZW0gIHwgICB8ICAgIHwgIHwgZWxlbSAgfCAgICAgICB8ICAgIHwgIHwgZHJvcGRvd24gIHwgICB8ICAgIHwgIHwgZHJvcGRvd24gIHwgICB8XG5cdC8vIHwgICAgICB8LS0tLS0tLXwgICB8ICAgIHwgIHwtLS0tLS0tfCAgICAgICB8ICAgIHwgIHw8LS0tLS0tLS0tLXwgICB8ICAgIHwgIHwtLS0tLS0tLS0tPnwgICB8XG5cdC8vIHwgIHw8LS0tLS0tLS0tLXwgICB8ICAgIHwgIHwtLS0tLS0tLS0tPnwgICB8ICAgIHwgICAgICB8LS0tLS0tLXwgICB8ICAgIHwgIHwtLS0tLS0tfCAgICAgICB8XG5cdC8vIHwgIHwgZHJvcGRvd24gIHwgICB8ICAgIHwgIHwgZHJvcGRvd24gIHwgICB8ICAgIHwgICAgICB8IGVsZW0gIHwgICB8ICAgIHwgIHwgZWxlbSAgfCAgICAgICB8XG5cdC8vIC8gIHwtLS0tLS0tLS0tLVYgICB8ICAgIHwgIFYtLS0tLS0tLS0tLXwgICB8ICAgIHwgICAgICB8LS0tLS0tLXwgICB8ICAgIHwgIHwtLS0tLS0tfCAgICAgICB8XG5cdC8vXG5cdC8vIERlY2lkZSB3ZXJlIHRvIG9wZW4gZHJvcGRvd24uIFdlIG9wZW4gdGhlIGRyb3Bkb3duIGRlcGVuZGluZyBvbiB0aGUgcG9zaXRpb24gb2YgdGhlIHRvdWNoZWQgZWxlbWVudC5cblx0Ly8gRm9yIHRoYXQgd2UgZGV2aWRlIHRoZSBzY3JlZW4gaW50byBmb3VyIHBhcnRzIHdoaWNoIGFyZSB1cHBlci9sb3dlciBhbmQgcmlnaHQvbGVmdCBwYXJ0IG9mIHRoZSBzY3JlZW4uXG5cdC8vIElmIHRoZSBlbGVtZW50IGlzIGluIHRoZSB1cHBlciByaWdodCBwYXJ0IGZvciBleGFtcGxlIHdlIHRyeSB0byBvcGVuIHRoZSBkcm9wZG93biBiZWxvdyB0aGUgdG91Y2hlZCBlbGVtZW50XG5cdC8vIHN0YXJ0aW5nIGZyb20gdGhlIHJpZ2h0IGVkZ2Ugb2YgdGhlIHRvdWNoZWQgZWxlbWVudC5cblx0Ly8gSWYgdGhlIGVsZW1lbnQgaXMgaW4gdGhlIGxvd2VyIGxlZnQgcGFydCBvZiB0aGUgc2NyZWVuIHdlIG9wZW4gdGhlIGRyb3Bkb3duIGFib3ZlIHRoZSBlbGVtZW50XG5cdC8vIHN0YXJ0aW5nIGZyb20gdGhlIGxlZnQgZWRnZSBvZiB0aGUgdG91Y2hlZCBlbGVtZW50LlxuXHQvLyBJZiB0aGUgZHJvcGRvd24gd2lkdGggZG9lcyBub3QgZml0IGZyb20gaXRzIGNhbGN1bGF0ZWQgc3RhcnRpbmcgcG9zaXRpb24gd2Ugb3BlbiBpdCBmcm9tIHRoZSBlZGdlIG9mIHRoZSBzY3JlZW4uXG5cdGNvbnN0IGxlZnRFZGdlT2ZFbGVtZW50ID0gb3JpZ2luLmxlZnRcblx0Y29uc3QgcmlnaHRFZGdlT2ZFbGVtZW50ID0gb3JpZ2luLnJpZ2h0XG5cdGNvbnN0IGJvdHRvbUVkZ2VPZkVsZW1lbnQgPSBvcmlnaW4uYm90dG9tXG5cdGNvbnN0IHRvcEVkZ2VPZkVsZW1lbnQgPSBvcmlnaW4udG9wXG5cdGNvbnN0IHVwcGVyU3BhY2UgPSBvcmlnaW4udG9wIC0gZ2V0U2FmZUFyZWFJbnNldFRvcCgpXG5cdGNvbnN0IGxvd2VyU3BhY2UgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLSBvcmlnaW4uYm90dG9tIC0gZ2V0U2FmZUFyZWFJbnNldEJvdHRvbSgpXG5cdGNvbnN0IGxlZnRTcGFjZSA9IG9yaWdpbi5sZWZ0XG5cdGNvbnN0IHJpZ2h0U3BhY2UgPSB3aW5kb3cuaW5uZXJXaWR0aCAtIG9yaWdpbi5yaWdodFxuXHRsZXQgdHJhbnNmb3JtT3JpZ2luID0gXCJcIlxuXHRsZXQgbWF4SGVpZ2h0XG5cblx0Y29uc3Qgc2hvd0JlbG93ID0gKCFwb3NpdGlvbiAmJiBsb3dlclNwYWNlID4gdXBwZXJTcGFjZSkgfHwgcG9zaXRpb24gPT09IFwiYm90dG9tXCJcblx0aWYgKHNob3dCZWxvdykge1xuXHRcdC8vIGVsZW1lbnQgaXMgaW4gdGhlIHVwcGVyIHBhcnQgb2YgdGhlIHNjcmVlbiwgZHJvcGRvd24gc2hvdWxkIGJlIGJlbG93IHRoZSBlbGVtZW50XG5cdFx0dHJhbnNmb3JtT3JpZ2luICs9IFwidG9wXCJcblx0XHRkb21Ecm9wZG93bi5zdHlsZS50b3AgPSBib3R0b21FZGdlT2ZFbGVtZW50ICsgXCJweFwiXG5cdFx0ZG9tRHJvcGRvd24uc3R5bGUuYm90dG9tID0gXCJcIlxuXHRcdG1heEhlaWdodCA9IE1hdGgubWluKGNvbnRlbnRIZWlnaHQsIGxvd2VyU3BhY2UpXG5cdH0gZWxzZSB7XG5cdFx0Ly8gZWxlbWVudCBpcyBpbiB0aGUgbG93ZXIgcGFydCBvZiB0aGUgc2NyZWVuLCBkcm9wZG93biBzaG91bGQgYmUgYWJvdmUgdGhlIGVsZW1lbnRcblx0XHR0cmFuc2Zvcm1PcmlnaW4gKz0gXCJib3R0b21cIlxuXHRcdGRvbURyb3Bkb3duLnN0eWxlLnRvcCA9IFwiXCJcblx0XHQvLyBwb3NpdGlvbiBib3R0b20gaXMgZGVmaW5lZCBmcm9tIHRoZSBib3R0b20gZWRnZSBvZiB0aGUgc2NyZWVuXG5cdFx0Ly8gYW5kIG5vdCBsaWtlIHRoZSB2aWV3cG9ydCBvcmlnaW4gd2hpY2ggc3RhcnRzIGF0IHRvcC9sZWZ0XG5cdFx0ZG9tRHJvcGRvd24uc3R5bGUuYm90dG9tID0gcHgod2luZG93LmlubmVySGVpZ2h0IC0gdG9wRWRnZU9mRWxlbWVudClcblx0XHRtYXhIZWlnaHQgPSBNYXRoLm1pbihjb250ZW50SGVpZ2h0LCB1cHBlclNwYWNlKVxuXHR9XG5cblx0dHJhbnNmb3JtT3JpZ2luICs9IGxlZnRTcGFjZSA8IHJpZ2h0U3BhY2UgPyBcIiBsZWZ0XCIgOiBcIiByaWdodFwiXG5cdGNvbnN0IGRyb3Bkb3duTWF4V2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aCAtIERST1BET1dOX01BUkdJTiAqIDJcblx0Y29uc3QgZHJvcGRvd25XaWR0aCA9IE1hdGgubWF4KGNvbnRlbnRXaWR0aCwgZG9tRHJvcGRvd24uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGgpXG5cdGxldCB3aWR0aCA9IGRyb3Bkb3duV2lkdGhcblx0bGV0IGxlZnRTdHlsZTogbnVtYmVyIHwgbnVsbCA9IG51bGxcblx0bGV0IHJpZ2h0U3R5bGU6IG51bWJlciB8IG51bGwgPSBudWxsXG5cblx0aWYgKHdpZHRoID49IGRyb3Bkb3duTWF4V2lkdGgpIHtcblx0XHQvLyBJZiB0aGUgZHJvcGRvd24gaXMgd2lkZXIgdGhhbiB0aGUgdmlld3BvcnQsIGl0IHRha2VzIHRoZSBlbnRpcmUgd2lkdGggKC0gbWFyZ2lucykgYW5kIHRleHQgaXMgY3V0IG9mZlxuXHRcdGRvbURyb3Bkb3duLmNsYXNzTGlzdC5yZW1vdmUoXCJmaXQtY29udGVudFwiKVxuXHRcdGxlZnRTdHlsZSA9IERST1BET1dOX01BUkdJTlxuXHRcdHdpZHRoID0gZHJvcGRvd25NYXhXaWR0aFxuXHR9IGVsc2UgaWYgKGxlZnRTcGFjZSA8IHJpZ2h0U3BhY2UpIHtcblx0XHQvLyBlbGVtZW50IGlzIGluIHRoZSBsZWZ0IHBhcnQgb2YgdGhlIHNjcmVlbiwgZHJvcGRvd24gc2hvdWxkIGV4dGVuZCB0byB0aGUgcmlnaHQgZnJvbSB0aGUgZWxlbWVudFxuXHRcdGNvbnN0IGF2YWlsYWJsZVNwYWNlRm9yRHJvcGRvd24gPSB3aW5kb3cuaW5uZXJXaWR0aCAtIGxlZnRFZGdlT2ZFbGVtZW50XG5cdFx0bGV0IGxlZnRFZGdlT2ZEcm9wZG93biA9IGxlZnRFZGdlT2ZFbGVtZW50XG5cblx0XHRpZiAoYXZhaWxhYmxlU3BhY2VGb3JEcm9wZG93biA8IGRyb3Bkb3duV2lkdGgpIHtcblx0XHRcdC8vIElmIHRoZSBkcm9wZG93biBkb2VzIG5vdCBmaXQsIHdlIHNoaWZ0IGl0IGJ5IHRoZSByZXF1aXJlZCBhbW91bnRcblx0XHRcdGNvbnN0IHNoaWZ0Rm9yRHJvcGRvd24gPSBsZWZ0RWRnZU9mRHJvcGRvd24gKyBkcm9wZG93bldpZHRoIC0gd2luZG93LmlubmVyV2lkdGggKyBEUk9QRE9XTl9NQVJHSU5cblx0XHRcdGxlZnRFZGdlT2ZEcm9wZG93biA9IGxlZnRFZGdlT2ZFbGVtZW50IC0gc2hpZnRGb3JEcm9wZG93blxuXHRcdH1cblxuXHRcdGxlZnRTdHlsZSA9IE1hdGgubWF4KERST1BET1dOX01BUkdJTiwgbGVmdEVkZ2VPZkRyb3Bkb3duKVxuXHR9IGVsc2Uge1xuXHRcdC8vIGVsZW1lbnQgaXMgaW4gdGhlIHJpZ2h0IHBhcnQgb2YgdGhlIHNjcmVlbiwgZHJvcGRvd24gc2hvdWxkIGV4dGVuZCB0byB0aGUgbGVmdCBmcm9tIHRoZSBlbGVtZW50XG5cdFx0Y29uc3QgYXZhaWxhYmxlU3BhY2VGb3JEcm9wZG93biA9IG9yaWdpbi5yaWdodFxuXHRcdGxldCByaWdodEVkZ2VPZkRyb3Bkb3duID0gcmlnaHRFZGdlT2ZFbGVtZW50XG5cblx0XHRpZiAoYXZhaWxhYmxlU3BhY2VGb3JEcm9wZG93biA8IGRyb3Bkb3duV2lkdGgpIHtcblx0XHRcdC8vIElmIHRoZSBkcm9wZG93biBkb2VzIG5vdCBmaXQsIHdlIHNoaWZ0IGl0IGJ5IHRoZSByZXF1aXJlZCBhbW91bnQuIElmIGl0IHN0aWxsIGRvZXMgbm90IGZpdCwgd2UgcmVkdWNlIHRoZSB3aWR0aC5cblx0XHRcdGNvbnN0IHNoaWZ0Rm9yRHJvcGRvd24gPSBkcm9wZG93bldpZHRoIC0gcmlnaHRFZGdlT2ZEcm9wZG93biArIERST1BET1dOX01BUkdJTlxuXHRcdFx0cmlnaHRFZGdlT2ZEcm9wZG93biA9IHJpZ2h0RWRnZU9mRWxlbWVudCArIHNoaWZ0Rm9yRHJvcGRvd25cblx0XHR9XG5cblx0XHQvLyBwb3NpdGlvbiByaWdodCBpcyBkZWZpbmVkIGZyb20gdGhlIHJpZ2h0IGVkZ2Ugb2YgdGhlIHNjcmVlblxuXHRcdC8vIGFuZCBub3QgbGlrZSB0aGUgdmlld3BvcnQgb3JpZ2luIHdoaWNoIHN0YXJ0cyBhdCB0b3AvbGVmdFxuXHRcdHJpZ2h0U3R5bGUgPSBNYXRoLm1heChEUk9QRE9XTl9NQVJHSU4sIHdpbmRvdy5pbm5lcldpZHRoIC0gcmlnaHRFZGdlT2ZEcm9wZG93bilcblx0fVxuXG5cdGRvbURyb3Bkb3duLnN0eWxlLmxlZnQgPSBsZWZ0U3R5bGUgIT0gbnVsbCA/IHB4KGxlZnRTdHlsZSkgOiBcIlwiXG5cdGRvbURyb3Bkb3duLnN0eWxlLnJpZ2h0ID0gcmlnaHRTdHlsZSAhPSBudWxsID8gcHgocmlnaHRTdHlsZSkgOiBcIlwiXG5cdGRvbURyb3Bkb3duLnN0eWxlLndpZHRoID0gcHgod2lkdGgpXG5cdGRvbURyb3Bkb3duLnN0eWxlLmhlaWdodCA9IHB4KG1heEhlaWdodClcblx0ZG9tRHJvcGRvd24uc3R5bGUudHJhbnNmb3JtT3JpZ2luID0gdHJhbnNmb3JtT3JpZ2luXG5cdHJldHVybiBhbmltYXRpb25zLmFkZChkb21Ecm9wZG93biwgW29wYWNpdHkoMCwgMSwgdHJ1ZSksIHRyYW5zZm9ybShUcmFuc2Zvcm1FbnVtLlNjYWxlLCAwLjUsIDEpXSwge1xuXHRcdGVhc2luZzogZWFzZS5vdXQsXG5cdH0pXG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ2xhc3NDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgVGV4dEZpZWxkIH0gZnJvbSBcIi4vVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB7IGNyZWF0ZURyb3Bkb3duIH0gZnJvbSBcIi4vRHJvcGRvd24uanNcIlxuaW1wb3J0IHR5cGUgeyBBbGxJY29ucyB9IGZyb20gXCIuL0ljb25cIlxuaW1wb3J0IHR5cGUgeyBsYXp5IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBsYXp5U3RyaW5nVmFsdWUsIG5vT3AgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGxhbmcsIFRyYW5zbGF0aW9uS2V5LCBNYXliZVRyYW5zbGF0aW9uIH0gZnJvbSBcIi4uLy4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgQm9vdEljb25zIH0gZnJvbSBcIi4vaWNvbnMvQm9vdEljb25zXCJcbmltcG9ydCB7IENsaWNrSGFuZGxlciwgZ2V0T3BlcmF0aW5nQ2xhc3NlcyB9IGZyb20gXCIuL0d1aVV0aWxzXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbiB9IGZyb20gXCIuL0ljb25CdXR0b24uanNcIlxuaW1wb3J0IHsgQnV0dG9uU2l6ZSB9IGZyb20gXCIuL0J1dHRvblNpemUuanNcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcbmV4cG9ydCB0eXBlIFNlbGVjdG9ySXRlbTxUPiA9IHtcblx0bmFtZTogc3RyaW5nXG5cdHZhbHVlOiBUXG5cdHNlbGVjdGFibGU/OiBib29sZWFuXG5cdGljb24/OiBBbGxJY29uc1xuXHRpbmRlbnRhdGlvbkxldmVsPzogbnVtYmVyXG59XG5leHBvcnQgdHlwZSBTZWxlY3Rvckl0ZW1MaXN0PFQ+ID0gUmVhZG9ubHlBcnJheTxTZWxlY3Rvckl0ZW08VD4+XG5cbmV4cG9ydCBpbnRlcmZhY2UgRHJvcERvd25TZWxlY3RvckF0dHJzPFQ+IHtcblx0bGFiZWw6IE1heWJlVHJhbnNsYXRpb25cblx0aXRlbXM6IFNlbGVjdG9ySXRlbUxpc3Q8VD5cblx0c2VsZWN0ZWRWYWx1ZTogVCB8IG51bGxcblx0LyoqIE92ZXJyaWRlIHdoYXQgaXMgZGlzcGxheWVkIGZvciB0aGUgc2VsZWN0ZWQgdmFsdWUgaW4gdGhlIHRleHQgZmllbGQgKGJ1dCBub3QgaW4gdGhlIGRyb3Bkb3duKSAqL1xuXHRzZWxlY3RlZFZhbHVlRGlzcGxheT86IHN0cmluZ1xuXHQvKipcblx0ICogVGhlIGhhbmRsZXIgaXMgaW52b2tlZCB3aXRoIHRoZSBuZXcgc2VsZWN0ZWQgdmFsdWUuIFRoZSBkaXNwbGF5ZWQgc2VsZWN0ZWQgdmFsdWUgaXMgbm90IGNoYW5nZWQgYXV0b21hdGljYWxseSxcblx0ICogYnV0IHRoZSBoYW5kbGVyIGlzIHJlc3BvbnNpYmxlIGZvciB1cGRhdGluZyB0aGlzIERyb3BEb3duU2VsZWN0b3IuIFRoZSB2YWx1ZSBpcyB1cGRhdGVkIGltbWVkaWF0ZWx5LCBpZiBubyBzZWxlY3Rpb25DaGFuZ2VkSGFuZGxlciBpcyBwcm92aWRlZFxuXHQgKi9cblx0c2VsZWN0aW9uQ2hhbmdlZEhhbmRsZXI/OiAoKG5ld1ZhbHVlOiBUKSA9PiB1bmtub3duKSB8IG51bGxcblx0aGVscExhYmVsPzogbGF6eTxDaGlsZHJlbj5cblx0ZHJvcGRvd25XaWR0aD86IG51bWJlclxuXHRpY29uPzogQWxsSWNvbnNcblx0ZGlzYWJsZWQ/OiBib29sZWFuXG5cdGNsYXNzPzogc3RyaW5nXG5cdHN0eWxlPzogUmVjb3JkPHN0cmluZywgYW55PiAvLyBUZW1wb3JhcnksIGRvIG5vdCB1c2Vcblx0ZG9TaG93Qm9yZGVyPzogYm9vbGVhbiB8IG51bGxcbn1cblxuZXhwb3J0IGNsYXNzIERyb3BEb3duU2VsZWN0b3I8VD4gaW1wbGVtZW50cyBDbGFzc0NvbXBvbmVudDxEcm9wRG93blNlbGVjdG9yQXR0cnM8VD4+IHtcblx0dmlldyh2bm9kZTogVm5vZGU8RHJvcERvd25TZWxlY3RvckF0dHJzPFQ+Pik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBhID0gdm5vZGUuYXR0cnNcblx0XHRyZXR1cm4gbShUZXh0RmllbGQsIHtcblx0XHRcdGxhYmVsOiBhLmxhYmVsLFxuXHRcdFx0dmFsdWU6IHRoaXMudmFsdWVUb1RleHQoYSwgYS5zZWxlY3RlZFZhbHVlKSB8fCBcIlwiLFxuXHRcdFx0aGVscExhYmVsOiBhLmhlbHBMYWJlbCxcblx0XHRcdGlzUmVhZE9ubHk6IHRydWUsXG5cdFx0XHRvbmNsaWNrOiBhLmRpc2FibGVkID8gbm9PcCA6IHRoaXMuY3JlYXRlRHJvcGRvd24oYSksXG5cdFx0XHRjbGFzczogXCJjbGljayBcIiArIChhLmNsYXNzID09IG51bGwgPyBcIm10XCIgOiBhLmNsYXNzKSArIFwiIFwiICsgZ2V0T3BlcmF0aW5nQ2xhc3NlcyhhLmRpc2FibGVkKSxcblx0XHRcdHN0eWxlOiBhLnN0eWxlLFxuXHRcdFx0aW5qZWN0aW9uc1JpZ2h0OiAoKSA9PlxuXHRcdFx0XHRhLmRpc2FibGVkXG5cdFx0XHRcdFx0PyBudWxsXG5cdFx0XHRcdFx0OiAvLyBUaGlzIHdob2xlIHRoaW5nIHdpdGggdGhlIGJ1dHRvbiBpcyBub3QgaWRlYWwuIFdlIHNob3VsZG4ndCBoYXZlIGEgcHJvcGVyIGJ1dHRvbiB3aXRoIGl0cyBvd24gc3RhdGUgbGF5ZXIsIHdlIHNob3VsZCBoYXZlIHRoZSB3aG9sZVxuXHRcdFx0XHRcdCAgLy8gc2VsZWN0b3IgYmUgaW50ZXJhY3RpdmUuIEp1c3QgcHV0dGluZyBhbiBpY29uIGhlcmUgZG9lc24ndCB3b3JrIGVpdGhlciBiZWNhdXNlIHRoZSBzZWxlY3RvciBkaXNhcHBlYXJzIGZyb20gdGFiaW5kZXggZXZlbiBpZiB5b3Ugc2V0IGl0XG5cdFx0XHRcdFx0ICAvLyBleHBsaWNpdGx5IChhdCBsZWFzdCBpbiBGRikuXG5cdFx0XHRcdFx0ICAvLyBJZGVhbGx5IHdlIHNob3VsZCBhbHNvIHNldCBjb3JyZWN0IHJvbGUgKFwib3B0aW9uXCIpIGFuZCBoaWdobGlnaHQgb25seSBwYXJ0cyBvZiB3aGF0IGlzIG5vdCB0ZXh0IGZpZWxkICh3aXRob3V0IGhlbHAgdGV4dCBpbiB0aGUgYm90dG9tLlxuXHRcdFx0XHRcdCAgLy8gV2UgY291bGQgaGFjayBzb21lIG9mIHRoaXMgaW4gaGVyZSwgYnV0IHdlIHNob3VsZCBwcm9iYWJseSByZWRvIGl0IGZyb20gc2NyYXRjaCB3aXRoIHRoZSByaWdodCBIVE1MIHN0cnVjdHVyZS5cblx0XHRcdFx0XHQgIG0oXG5cdFx0XHRcdFx0XHRcdFwiLmZsZXguaXRlbXMtY2VudGVyLmp1c3RpZnktY2VudGVyXCIsXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0d2lkdGg6IFwiMzBweFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0aGVpZ2h0OiBcIjMwcHhcIixcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0XHRpY29uOiBhLmljb24gPyBhLmljb24gOiBCb290SWNvbnMuRXhwYW5kLFxuXHRcdFx0XHRcdFx0XHRcdHRpdGxlOiBcInNob3dfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0Y2xpY2s6IGEuZGlzYWJsZWQgPyBub09wIDogdGhpcy5jcmVhdGVEcm9wZG93bihhKSxcblx0XHRcdFx0XHRcdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdCAgKSxcblx0XHRcdGRvU2hvd0JvcmRlcjogYS5kb1Nob3dCb3JkZXIsXG5cdFx0fSlcblx0fVxuXG5cdGNyZWF0ZURyb3Bkb3duKGE6IERyb3BEb3duU2VsZWN0b3JBdHRyczxUPik6IENsaWNrSGFuZGxlciB7XG5cdFx0cmV0dXJuIGNyZWF0ZURyb3Bkb3duKHtcblx0XHRcdGxhenlCdXR0b25zOiAoKSA9PiB7XG5cdFx0XHRcdHJldHVybiBhLml0ZW1zXG5cdFx0XHRcdFx0LmZpbHRlcigoaXRlbSkgPT4gaXRlbS5zZWxlY3RhYmxlICE9PSBmYWxzZSlcblx0XHRcdFx0XHQubWFwKChpdGVtKSA9PiB7XG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogbGFuZy5tYWtlVHJhbnNsYXRpb24oaXRlbS5uYW1lLCBpdGVtLm5hbWUpLFxuXHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdGEuc2VsZWN0aW9uQ2hhbmdlZEhhbmRsZXI/LihpdGVtLnZhbHVlKVxuXHRcdFx0XHRcdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0c2VsZWN0ZWQ6IGEuc2VsZWN0ZWRWYWx1ZSA9PT0gaXRlbS52YWx1ZSxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KVxuXHRcdFx0fSxcblx0XHRcdHdpZHRoOiBhLmRyb3Bkb3duV2lkdGgsXG5cdFx0fSlcblx0fVxuXG5cdHZhbHVlVG9UZXh0KGE6IERyb3BEb3duU2VsZWN0b3JBdHRyczxUPiwgdmFsdWU6IFQgfCBudWxsKTogc3RyaW5nIHwgbnVsbCB7XG5cdFx0aWYgKGEuc2VsZWN0ZWRWYWx1ZURpc3BsYXkpIHtcblx0XHRcdHJldHVybiBhLnNlbGVjdGVkVmFsdWVEaXNwbGF5XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2VsZWN0ZWRJdGVtID0gYS5pdGVtcy5maW5kKChpdGVtKSA9PiBpdGVtLnZhbHVlID09PSBhLnNlbGVjdGVkVmFsdWUpXG5cdFx0aWYgKHNlbGVjdGVkSXRlbSkge1xuXHRcdFx0cmV0dXJuIHNlbGVjdGVkSXRlbS5uYW1lXG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnNvbGUubG9nKGBEcm9wZG93biAke2xhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KGEubGFiZWwpfSBjb3VsZG4ndCBmaW5kIGVsZW1lbnQgZm9yIHZhbHVlOiAke1N0cmluZyhKU09OLnN0cmluZ2lmeSh2YWx1ZSkpfWApXG5cdFx0XHRyZXR1cm4gbnVsbFxuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHR5cGUgeyBDb3VudHJ5IH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vQ291bnRyeUxpc3RcIlxuaW1wb3J0IHsgQ291bnRyaWVzIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vQ291bnRyeUxpc3RcIlxuaW1wb3J0IHR5cGUgeyBJbmZvTGluaywgVHJhbnNsYXRpb25LZXksIE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgQnV0dG9uQ29sb3IgfSBmcm9tIFwiLi9CdXR0b24uanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi9pY29ucy9JY29uc1wiXG5pbXBvcnQgdHlwZSB7IERyb3Bkb3duQ2hpbGRBdHRycyB9IGZyb20gXCIuL0Ryb3Bkb3duLmpzXCJcbmltcG9ydCB7IGNyZWF0ZUFzeW5jRHJvcGRvd24gfSBmcm9tIFwiLi9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgdHlwZSB7ICRQcm9taXNhYmxlLCBsYXp5LCBNYXliZUxhenkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIGxhenlNZW1vaXplZCwgcmVzb2x2ZU1heWJlTGF6eSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4vRGlhbG9nXCJcbmltcG9ydCB7IFByb2dyYW1taW5nRXJyb3IgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9lcnJvci9Qcm9ncmFtbWluZ0Vycm9yXCJcbmltcG9ydCBtLCB7IENoaWxkcmVuIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgRHJvcERvd25TZWxlY3RvciB9IGZyb20gXCIuL0Ryb3BEb3duU2VsZWN0b3IuanNcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4vSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBMb2dpbkNvbnRyb2xsZXIgfSBmcm9tIFwiLi4vLi4vYXBpL21haW4vTG9naW5Db250cm9sbGVyLmpzXCJcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gXCIuLi8uLi9taXNjL0NsaWVudERldGVjdG9yLmpzXCJcbmltcG9ydCB0eXBlIHsgQ29udGFjdCB9IGZyb20gXCIuLi8uLi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgaXNDb2xvckxpZ2h0IH0gZnJvbSBcIi4vQ29sb3IuanNcIlxuXG5leHBvcnQgY29uc3QgZW51bSBEcm9wVHlwZSB7XG5cdEV4dGVybmFsRmlsZSA9IFwiRXh0ZXJuYWxGaWxlXCIsXG5cdE1haWwgPSBcIk1haWxcIixcbn1cblxuZXhwb3J0IHR5cGUgTWFpbERyb3BEYXRhID0ge1xuXHRkcm9wVHlwZTogRHJvcFR5cGUuTWFpbFxuXHRtYWlsSWQ6IHN0cmluZ1xufVxuZXhwb3J0IHR5cGUgRmlsZURyb3BEYXRhID0ge1xuXHRkcm9wVHlwZTogRHJvcFR5cGUuRXh0ZXJuYWxGaWxlXG5cdGZpbGVzOiBBcnJheTxGaWxlPlxufVxuXG5leHBvcnQgdHlwZSBEcm9wRGF0YSA9IEZpbGVEcm9wRGF0YSB8IE1haWxEcm9wRGF0YVxuXG5leHBvcnQgdHlwZSBEcm9wSGFuZGxlciA9IChkcm9wRGF0YTogRHJvcERhdGEpID0+IHZvaWRcbi8vIG5vdCBhbGwgYnJvd3NlcnMgaGF2ZSB0aGUgYWN0dWFsIGJ1dHRvbiBhcyBlLmN1cnJlbnRUYXJnZXQsIGJ1dCBhbGwgb2YgdGhlbSBzZW5kIGl0IGFzIGEgc2Vjb25kIGFyZ3VtZW50IChzZWUgaHR0cHM6Ly9naXRodWIuY29tL3R1dGFvL3R1dGFub3RhL2lzc3Vlcy8xMTEwKVxuZXhwb3J0IHR5cGUgQ2xpY2tIYW5kbGVyID0gKGV2ZW50OiBNb3VzZUV2ZW50LCBkb206IEhUTUxFbGVtZW50KSA9PiB2b2lkXG5cbi8vIGxhenkgYmVjYXVzZSBvZiBnbG9iYWwgZGVwZW5kZW5jaWVzXG5jb25zdCBkcm9wZG93bkNvdW50cmllcyA9IGxhenlNZW1vaXplZCgoKSA9PiBDb3VudHJpZXMubWFwKChjKSA9PiAoeyB2YWx1ZTogYywgbmFtZTogYy5uIH0pKSlcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckNvdW50cnlEcm9wZG93bihwYXJhbXM6IHtcblx0c2VsZWN0ZWRDb3VudHJ5OiBDb3VudHJ5IHwgbnVsbFxuXHRvblNlbGVjdGlvbkNoYW5nZWQ6IChjb3VudHJ5OiBDb3VudHJ5KSA9PiB2b2lkXG5cdGhlbHBMYWJlbD86IGxhenk8c3RyaW5nPlxuXHRsYWJlbD86IE1heWJlVHJhbnNsYXRpb25cbn0pOiBDaGlsZHJlbiB7XG5cdHJldHVybiBtKERyb3BEb3duU2VsZWN0b3IsIHtcblx0XHRsYWJlbDogcGFyYW1zLmxhYmVsID8/IFwiaW52b2ljZUNvdW50cnlfbGFiZWxcIixcblx0XHRoZWxwTGFiZWw6IHBhcmFtcy5oZWxwTGFiZWwsXG5cdFx0aXRlbXM6IFtcblx0XHRcdC4uLmRyb3Bkb3duQ291bnRyaWVzKCksXG5cdFx0XHR7XG5cdFx0XHRcdHZhbHVlOiBudWxsLFxuXHRcdFx0XHRuYW1lOiBsYW5nLmdldChcImNob29zZV9sYWJlbFwiKSxcblx0XHRcdH0sXG5cdFx0XSxcblx0XHRzZWxlY3RlZFZhbHVlOiBwYXJhbXMuc2VsZWN0ZWRDb3VudHJ5LFxuXHRcdHNlbGVjdGlvbkNoYW5nZWRIYW5kbGVyOiBwYXJhbXMub25TZWxlY3Rpb25DaGFuZ2VkLFxuXHR9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTW9yZUFjdGlvbkJ1dHRvbkF0dHJzKFxuXHRsYXp5Q2hpbGRyZW46IE1heWJlTGF6eTwkUHJvbWlzYWJsZTxSZWFkb25seUFycmF5PERyb3Bkb3duQ2hpbGRBdHRycyB8IG51bGw+Pj4sXG5cdGRyb3Bkb3duV2lkdGg/OiBudW1iZXIsXG4pOiBJY29uQnV0dG9uQXR0cnMge1xuXHRyZXR1cm4ge1xuXHRcdHRpdGxlOiBcIm1vcmVfbGFiZWxcIixcblx0XHRjb2xvcnM6IEJ1dHRvbkNvbG9yLk5hdixcblx0XHRpY29uOiBJY29ucy5Nb3JlLFxuXHRcdGNsaWNrOiBjcmVhdGVBc3luY0Ryb3Bkb3duKHtcblx0XHRcdHdpZHRoOiBkcm9wZG93bldpZHRoLFxuXHRcdFx0bGF6eUJ1dHRvbnM6IGFzeW5jICgpID0+IHJlc29sdmVNYXliZUxhenkobGF6eUNoaWxkcmVuKSxcblx0XHR9KSxcblx0fVxufVxuXG50eXBlIENvbmZpcm1hdGlvbiA9IHtcblx0Y29uZmlybWVkOiAoXzogKCkgPT4gdW5rbm93bikgPT4gQ29uZmlybWF0aW9uXG5cdGNhbmNlbGxlZDogKF86ICgpID0+IHVua25vd24pID0+IENvbmZpcm1hdGlvblxuXHRyZXN1bHQ6IFByb21pc2U8Ym9vbGVhbj5cbn1cblxuLyoqXG4gKiBXcmFwcGVyIGFyb3VuZCBEaWFsb2cuY29uZmlybVxuICpcbiAqIGNhbGwgZ2V0Q29uZmlybWF0aW9uKC4uLikuY29uZmlybWVkKCgpID0+IGRvU3R1ZmYoKSkgb3IgZ2V0Q29uZmlybWF0aW9uKC4uLikuY2FuY2VsbGVkKCgpID0+IGRvU3R1ZmYoKSlcbiAqIHRvIGhhbmRsZSBjb25maXJtYXRpb24gb3IgdGVybWluYXRpb25cbiAqIEBwYXJhbSBtZXNzYWdlXG4gKiBAcGFyYW0gY29uZmlybU1lc3NhZ2VcbiAqIEByZXR1cm5zIHtDb25maXJtYXRpb259XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb25maXJtYXRpb24obWVzc2FnZTogTWF5YmVUcmFuc2xhdGlvbiwgY29uZmlybU1lc3NhZ2U6IFRyYW5zbGF0aW9uS2V5ID0gXCJva19hY3Rpb25cIik6IENvbmZpcm1hdGlvbiB7XG5cdGNvbnN0IGNvbmZpcm1hdGlvblByb21pc2UgPSBEaWFsb2cuY29uZmlybShtZXNzYWdlLCBjb25maXJtTWVzc2FnZSlcblx0Y29uc3QgY29uZmlybWF0aW9uOiBDb25maXJtYXRpb24gPSB7XG5cdFx0Y29uZmlybWVkKGFjdGlvbikge1xuXHRcdFx0Y29uZmlybWF0aW9uUHJvbWlzZS50aGVuKChvaykgPT4ge1xuXHRcdFx0XHRpZiAob2spIHtcblx0XHRcdFx0XHRhY3Rpb24oKVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0cmV0dXJuIGNvbmZpcm1hdGlvblxuXHRcdH0sXG5cblx0XHRjYW5jZWxsZWQoYWN0aW9uKSB7XG5cdFx0XHRjb25maXJtYXRpb25Qcm9taXNlLnRoZW4oKG9rKSA9PiB7XG5cdFx0XHRcdGlmICghb2spIHtcblx0XHRcdFx0XHRhY3Rpb24oKVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0cmV0dXJuIGNvbmZpcm1hdGlvblxuXHRcdH0sXG5cblx0XHRyZXN1bHQ6IGNvbmZpcm1hdGlvblByb21pc2UsXG5cdH1cblx0cmV0dXJuIGNvbmZpcm1hdGlvblxufVxuXG4vKipcbiAqIEdldCBlaXRoZXIgdGhlIGNvb3JkIG9mIGEgbW91c2VldmVudCBvciB0aGUgY29vcmQgb2YgdGhlIGZpcnN0IHRvdWNoIG9mIGEgdG91Y2ggZXZlbnRcbiAqIEBwYXJhbSBldmVudFxuICogQHJldHVybnMge3t4OiBudW1iZXIsIHk6IG51bWJlcn19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb29yZHNPZk1vdXNlT3JUb3VjaEV2ZW50KGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCk6IHtcblx0eDogbnVtYmVyXG5cdHk6IG51bWJlclxufSB7XG5cdHJldHVybiBldmVudCBpbnN0YW5jZW9mIE1vdXNlRXZlbnRcblx0XHQ/IHtcblx0XHRcdFx0eDogZXZlbnQuY2xpZW50WCxcblx0XHRcdFx0eTogZXZlbnQuY2xpZW50WSxcblx0XHQgIH1cblx0XHQ6IHtcblx0XHRcdFx0Ly8gV2h5IHdvdWxkIHRvdWNoZXMgYmUgZW1wdHk/XG5cdFx0XHRcdHg6IGFzc2VydE5vdE51bGwoZXZlbnQudG91Y2hlcy5pdGVtKDApKS5jbGllbnRYLFxuXHRcdFx0XHR5OiBhc3NlcnROb3ROdWxsKGV2ZW50LnRvdWNoZXMuaXRlbSgwKSkuY2xpZW50WSxcblx0XHQgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VMaXN0U2VsZWN0aW9uQ2hhbmdlZFNjcm9sbEhhbmRsZXIoc2Nyb2xsRG9tOiBIVE1MRWxlbWVudCwgZW50cnlIZWlnaHQ6IG51bWJlciwgZ2V0U2VsZWN0ZWRFbnRyeUluZGV4OiBsYXp5PG51bWJlcj4pOiAoKSA9PiB2b2lkIHtcblx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcblx0XHRzY3JvbGxMaXN0RG9tKHNjcm9sbERvbSwgZW50cnlIZWlnaHQsIGdldFNlbGVjdGVkRW50cnlJbmRleCgpKVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzY3JvbGxMaXN0RG9tKHNjcm9sbERvbTogSFRNTEVsZW1lbnQsIGVudHJ5SGVpZ2h0OiBudW1iZXIsIHNlbGVjdGVkSW5kZXg6IG51bWJlcikge1xuXHRjb25zdCBzY3JvbGxXaW5kb3dIZWlnaHQgPSBzY3JvbGxEb20uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0XG5cdGNvbnN0IHNjcm9sbE9mZnNldCA9IHNjcm9sbERvbS5zY3JvbGxUb3Bcblx0Ly8gQWN0dWFsIHBvc2l0aW9uIGluIHRoZSBsaXN0XG5cdGNvbnN0IHNlbGVjdGVkVG9wID0gZW50cnlIZWlnaHQgKiBzZWxlY3RlZEluZGV4XG5cdGNvbnN0IHNlbGVjdGVkQm90dG9tID0gc2VsZWN0ZWRUb3AgKyBlbnRyeUhlaWdodFxuXHQvLyBSZWxhdGl2ZSB0byB0aGUgdG9wIG9mIHRoZSBzY3JvbGwgd2luZG93XG5cdGNvbnN0IHNlbGVjdGVkUmVsYXRpdmVUb3AgPSBzZWxlY3RlZFRvcCAtIHNjcm9sbE9mZnNldFxuXHRjb25zdCBzZWxlY3RlZFJlbGF0aXZlQm90dG9tID0gc2VsZWN0ZWRCb3R0b20gLSBzY3JvbGxPZmZzZXRcblxuXHQvLyBjbGFtcCB0aGUgc2VsZWN0ZWQgaXRlbSB0byBzdGF5IGJldHdlZW4gdGhlIHRvcCBhbmQgYm90dG9tIG9mIHRoZSBzY3JvbGwgd2luZG93XG5cdGlmIChzZWxlY3RlZFJlbGF0aXZlVG9wIDwgMCkge1xuXHRcdHNjcm9sbERvbS5zY3JvbGxUb3AgPSBzZWxlY3RlZFRvcFxuXHR9IGVsc2UgaWYgKHNlbGVjdGVkUmVsYXRpdmVCb3R0b20gPiBzY3JvbGxXaW5kb3dIZWlnaHQpIHtcblx0XHRzY3JvbGxEb20uc2Nyb2xsVG9wID0gc2VsZWN0ZWRCb3R0b20gLSBzY3JvbGxXaW5kb3dIZWlnaHRcblx0fVxufVxuXG4vKipcbiAqIEV4ZWN1dGVzIHRoZSBwYXNzZWQgZnVuY3Rpb24gaWYgdGhlIHVzZXIgaXMgYWxsb3dlZCB0byBzZWUgYHR1dGEuY29tYCBsaW5rcy5cbiAqIEBwYXJhbSBsb2dpbnMgTG9naW5Db250cm9sbGVyIHRvIGFzayBhYm91dCBsb2dpbiBpbmZvcm1hdGlvblxuICogQHBhcmFtIGxpbmtJZFxuICogQHBhcmFtIHJlbmRlciByZWNlaXZlcyB0aGUgcmVzb2x2ZWQgbGlua1xuICogQHJldHVybnMge0NoaWxkcmVufG51bGx9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpZkFsbG93ZWRUdXRhTGlua3MobG9naW5zOiBMb2dpbkNvbnRyb2xsZXIsIGxpbmtJZDogSW5mb0xpbmssIHJlbmRlcjogKGxpbmtJZDogSW5mb0xpbmspID0+IENoaWxkcmVuKTogQ2hpbGRyZW4gfCBudWxsIHtcblx0Ly8gdGhpcyBpcyBjdXJyZW50bHkgaW4gZ3VpLWJhc2UsIHByZXZlbnRpbmcgdXMgZnJvbSBhY2Nlc3NpbmcgbG9naW5zIG91cnNlbHZlcy5cblx0Ly8gbWF5IGJlIHN1YmplY3QgdG8gY2hhbmdlXG5cdGlmIChjYW5TZWVUdXRhTGlua3MobG9naW5zKSkge1xuXHRcdHJldHVybiByZW5kZXIobGlua0lkKVxuXHR9XG5cdHJldHVybiBudWxsXG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIHVzZXIgaXMgYWxsb3dlZCB0byBzZWUgYHR1dGFub3RhLmNvbWAgbGlua3Mgb3Igb3RoZXIgbWFqb3IgcmVmZXJlbmNlcyB0byBUdXRhbm90YS5cbiAqXG4gKiBJZiB0aGUgdXNlciBpcyBvbiB3aGl0ZWxhYmVsIGFuZCB0aGV5IGFyZSBub3QgZ2xvYmFsIGFkbWluLCBpbmZvcm1hdGlvbiBsaWtlIHRoaXMgc2hvdWxkIG5vdCBiZSBzaG93bi5cbiAqIEBwYXJhbSBsb2dpbnMgTG9naW5Db250cm9sbGVyIHRvIGFzayBhYm91dCBsb2dpbiBpbmZvcm1hdGlvblxuICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgdXNlciBzaG91bGQgc2VlIHR1dGFub3RhIGxpbmtzIG9yIGZhbHNlIGlmIHRoZXkgc2hvdWxkIG5vdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuU2VlVHV0YUxpbmtzKGxvZ2luczogTG9naW5Db250cm9sbGVyKTogYm9vbGVhbiB7XG5cdHJldHVybiAhbG9naW5zLmlzV2hpdGVsYWJlbCgpIHx8IGxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLmlzR2xvYmFsQWRtaW4oKVxufVxuXG5leHBvcnQgdHlwZSBNb3VzZVBvc0FuZEJvdW5kcyA9IHtcblx0eDogbnVtYmVyXG5cdHk6IG51bWJlclxuXHR0YXJnZXRXaWR0aDogbnVtYmVyXG5cdHRhcmdldEhlaWdodDogbnVtYmVyXG59XG5cbi8qKlxuICogR2V0IHRoZSBtb3VzZSdzIHggYW5kIHkgY29vcmRpbmF0ZXMgcmVsYXRpdmUgdG8gdGhlIHRhcmdldCwgYW5kIHRoZSB3aWR0aCBhbmQgaGVpZ2h0IG9mIHRoZSB0YXJnZXQuXG4gKiBUaGUgY3VycmVudFRhcmdldCBtdXN0IGJlIGEgSFRNTEVsZW1lbnQgb3IgdGhpcyB0aHJvd3MgYW4gZXJyb3JcbiAqIEBwYXJhbSBtb3VzZUV2ZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQb3NBbmRCb3VuZHNGcm9tTW91c2VFdmVudCh7IGN1cnJlbnRUYXJnZXQsIHgsIHkgfTogTW91c2VFdmVudCk6IE1vdXNlUG9zQW5kQm91bmRzIHtcblx0aWYgKGN1cnJlbnRUYXJnZXQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuXHRcdGNvbnN0IHsgaGVpZ2h0LCB3aWR0aCwgbGVmdCwgdG9wIH0gPSBjdXJyZW50VGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cdFx0cmV0dXJuIHtcblx0XHRcdHRhcmdldEhlaWdodDogaGVpZ2h0LFxuXHRcdFx0dGFyZ2V0V2lkdGg6IHdpZHRoLFxuXHRcdFx0eDogeCAtIGxlZnQsXG5cdFx0XHR5OiB5IC0gdG9wLFxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIlRhcmdldCBpcyBub3QgYSBIVE1MRWxlbWVudFwiKVxuXHR9XG59XG5cbi8qKiByZW5kZXIgdHdvIGNoaWxkcmVuIGVpdGhlciBuZXh0IHRvIGVhY2ggb3RoZXIgKG9uIGRlc2t0b3AgZGV2aWNlcykgb3IgYWJvdmUgZWFjaCBvdGhlciAobW9iaWxlKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclR3b0NvbHVtbnNJZkZpdHMobGVmdDogQ2hpbGRyZW4sIHJpZ2h0OiBDaGlsZHJlbik6IENoaWxkcmVuIHtcblx0aWYgKGNsaWVudC5pc01vYmlsZURldmljZSgpKSB7XG5cdFx0cmV0dXJuIG0oXCIuZmxleC5jb2xcIiwgW20oXCIuZmxleFwiLCBsZWZ0KSwgbShcIi5mbGV4XCIsIHJpZ2h0KV0pXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIG0oXCIuZmxleFwiLCBbbShcIi5mbGV4LmZsZXgtaGFsZi5wci1zXCIsIGxlZnQpLCBtKFwiLmZsZXguZmxleC1oYWxmLnBsLXNcIiwgcmlnaHQpXSlcblx0fVxufVxuXG4vKiogRW5jb2RlIGEgU1ZHIGVsZW1lbnQgaW50byBhIENTUyByZWFkYWJsZSBzdHJpbmcgKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVTVkcoc3ZnOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRyZXR1cm4gKFxuXHRcdFwiZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsXCIgK1xuXHRcdHN2Z1xuXHRcdFx0Ly8gdGhlIHN2ZyBkYXRhIHN0cmluZyBtdXN0IGNvbnRhaW4gJyBpbnN0ZWFkIG9mIFwiIHRvIGF2b2lkIGRpc3BsYXkgZXJyb3JzIGluIEVkZ2UgKHByb2JhYmx5IG5vdCByZWxldmFudCBhbnltb3JlIGJ1dCBiZXR0ZXIgYmUgc2FmZSlcblx0XHRcdC5yZXBsYWNlKC9cIi9nLCBcIidcIilcblx0XHRcdC8vICcjJyBjaGFyYWN0ZXIgaXMgcmVzZXJ2ZWQgaW4gVVJMIGFuZCBGRiB3b24ndCBkaXNwbGF5IFNWRyBvdGhlcndpc2Vcblx0XHRcdC5yZXBsYWNlKC8jL2csIFwiJTIzXCIpXG5cdFx0XHQvLy8gZm9sZCBjb25zZWN1dGl2ZSB3aGl0ZXNwYWNlIGludG8gYSBzaW5nbGUgb25lICh1c2VmdWwgZm9yIHRlc3RzKVxuXHRcdFx0LnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG5cdClcbn1cblxuLy8gUmV0dXJucyB0aGUgZGlzYWJsZWQgc3R5bGUgQ1NTIGNsYXNzZXMgc2VwZXJhdGVkIGJ5IHNwYWNlcyBpZiBgaXNEaXNhYmxlZGAgaXMgdHJ1ZS4gQSB2YWx1ZSBvZiBgbnVsbGAgb3IgYHVuZGVmaW5lZGAgaXMgdHJlYXRlZCBhcyBgZmFsc2VgLlxuZXhwb3J0IGZ1bmN0aW9uIGdldE9wZXJhdGluZ0NsYXNzZXMoaXNEaXNhYmxlZDogYm9vbGVhbiB8IG51bGwgfCB1bmRlZmluZWQsIGN1cnNvckNsYXNzPzogc3RyaW5nKTogc3RyaW5nIHtcblx0Y29uc3QgY3Vyc29yQ2xhc3NPckRlZmF1bHQgPSBjdXJzb3JDbGFzcyA/IGN1cnNvckNsYXNzIDogXCJcIlxuXHRyZXR1cm4gaXNEaXNhYmxlZCA/IFwiZGlzYWJsZWQgY2xpY2stZGlzYWJsZWRcIiA6IGN1cnNvckNsYXNzT3JEZWZhdWx0XG59XG5cbi8qIFJldHVybnMgd2hldGhlciB0aGUgY2hhbmdlIGluIGEgc2Nyb2xsIHBvc2l0aW9uIHNob3VsZCBiZSBhbmltYXRlZCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldElmTGFyZ2VTY3JvbGwob2xkUG9zaXRpb246IG51bWJlciB8IG51bGwsIG5ld1Bvc2l0aW9uOiBudW1iZXIgfCBudWxsKTogYm9vbGVhbiB7XG5cdGlmIChvbGRQb3NpdGlvbiA9PT0gbnVsbCB8fCBuZXdQb3NpdGlvbiA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlXG5cdGNvbnN0IGRpZmZlcmVuY2UgPSBNYXRoLmFicyhvbGRQb3NpdGlvbiAtIG5ld1Bvc2l0aW9uKVxuXHRyZXR1cm4gZGlmZmVyZW5jZSA+IDEwXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb250YWN0VGl0bGUoY29udGFjdDogQ29udGFjdCkge1xuXHRjb25zdCB0aXRsZSA9IGNvbnRhY3QudGl0bGUgPyBgJHtjb250YWN0LnRpdGxlfSBgIDogXCJcIlxuXHRjb25zdCBtaWRkbGVOYW1lID0gY29udGFjdC5taWRkbGVOYW1lICE9IG51bGwgPyBgICR7Y29udGFjdC5taWRkbGVOYW1lfSBgIDogXCIgXCJcblx0Y29uc3QgZnVsbE5hbWUgPSBgJHtjb250YWN0LmZpcnN0TmFtZX0ke21pZGRsZU5hbWV9JHtjb250YWN0Lmxhc3ROYW1lfSBgXG5cdGNvbnN0IHN1ZmZpeCA9IGNvbnRhY3QubmFtZVN1ZmZpeCA/PyBcIlwiXG5cdHJldHVybiAodGl0bGUgKyBmdWxsTmFtZSArIHN1ZmZpeCkudHJpbSgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2xvckZvckJnKGNvbG9yOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRyZXR1cm4gaXNDb2xvckxpZ2h0KGNvbG9yKSA/IFwiYmxhY2tcIiA6IFwid2hpdGVcIlxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENsYXNzQ29tcG9uZW50LCBDVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi9zaXplXCJcbmltcG9ydCB7IERlZmF1bHRBbmltYXRpb25UaW1lIH0gZnJvbSBcIi4uL2FuaW1hdGlvbi9BbmltYXRpb25zXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uL3RoZW1lXCJcbmltcG9ydCB0eXBlIHsgTWF5YmVUcmFuc2xhdGlvbiB9IGZyb20gXCIuLi8uLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgdHlwZSB7IGxhenkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGlzS2V5UHJlc3NlZCwga2V5SGFuZGxlciwgdXNlS2V5SGFuZGxlciB9IGZyb20gXCIuLi8uLi9taXNjL0tleU1hbmFnZXJcIlxuaW1wb3J0IHsgS2V5cywgVGFiSW5kZXggfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBDbGlja0hhbmRsZXIsIGdldE9wZXJhdGluZ0NsYXNzZXMgfSBmcm9tIFwiLi9HdWlVdGlsc1wiXG5pbXBvcnQgeyBBcmlhUG9wdXBUeXBlIH0gZnJvbSBcIi4uL0FyaWFVdGlscy5qc1wiXG5cbmV4cG9ydCB0eXBlIFRleHRGaWVsZEF0dHJzID0ge1xuXHRpZD86IHN0cmluZ1xuXHRsYWJlbDogTWF5YmVUcmFuc2xhdGlvblxuXHR2YWx1ZTogc3RyaW5nXG5cdGF1dG9jb21wbGV0ZUFzPzogQXV0b2NvbXBsZXRlXG5cdGF1dG9jYXBpdGFsaXplPzogQXV0b2NhcGl0YWxpemVcblx0dHlwZT86IFRleHRGaWVsZFR5cGVcblx0aGFzUG9wdXA/OiBBcmlhUG9wdXBUeXBlXG5cdGhlbHBMYWJlbD86IGxhenk8Q2hpbGRyZW4+IHwgbnVsbFxuXHRhbGlnblJpZ2h0PzogYm9vbGVhblxuXHRpbmplY3Rpb25zTGVmdD86IGxhenk8Q2hpbGRyZW4+XG5cdC8vIG9ubHkgdXNlZCBieSB0aGUgQnViYmxlVGV4dEZpZWxkICgtPiB1c2VzIG9sZCBUZXh0RmllbGQpIHRvIGRpc3BsYXkgYnViYmxlcyBhbmQgb3V0IG9mIG9mZmljZSBub3RpZmljYXRpb25cblx0aW5qZWN0aW9uc1JpZ2h0PzogbGF6eTxDaGlsZHJlbj5cblx0a2V5SGFuZGxlcj86IGtleUhhbmRsZXJcblx0b25Eb21JbnB1dENyZWF0ZWQ/OiAoZG9tOiBIVE1MSW5wdXRFbGVtZW50KSA9PiB2b2lkXG5cdC8vIGludGVyY2VwdG9yIHVzZWQgYnkgdGhlIEJ1YmJsZVRleHRGaWVsZCB0byByZWFjdCBvbiBjZXJ0YWluIGtleXNcblx0b25mb2N1cz86IChkb206IEhUTUxFbGVtZW50LCBpbnB1dDogSFRNTElucHV0RWxlbWVudCkgPT4gdW5rbm93blxuXHRvbmJsdXI/OiAoLi4uYXJnczogQXJyYXk8YW55PikgPT4gYW55XG5cdG1heFdpZHRoPzogbnVtYmVyXG5cdGNsYXNzPzogc3RyaW5nXG5cdHN0eWxlPzogUmVjb3JkPHN0cmluZywgYW55PiAvL1RlbXBvcmFyeSwgRG8gbm90IHVzZVxuXHRkaXNhYmxlZD86IGJvb2xlYW5cblx0Ly8gQ3JlYXRlcyBhIGR1bW15IFRleHRGaWVsZCB3aXRob3V0IGludGVyYWN0aXZlbHkgJiBkaXNhYmxlZCBzdHlsaW5nXG5cdGlzUmVhZE9ubHk/OiBib29sZWFuXG5cdG9uaW5wdXQ/OiAodmFsdWU6IHN0cmluZywgaW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQpID0+IHVua25vd25cblx0b25jbGljaz86IENsaWNrSGFuZGxlclxuXHRkb1Nob3dCb3JkZXI/OiBib29sZWFuIHwgbnVsbFxuXHRmb250U2l6ZT86IHN0cmluZ1xuXHRtaW4/OiBudW1iZXJcblx0bWF4PzogbnVtYmVyXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIFRleHRGaWVsZFR5cGUge1xuXHRUZXh0ID0gXCJ0ZXh0XCIsXG5cdEVtYWlsID0gXCJlbWFpbFwiLFxuXHQvKiogQGRlcHJlY2F0ZWQgUHJlZmVyIHRoZSBgUGFzc3dvcmRGaWVsZGAgY29tcG9uZW50IG92ZXIgdXNpbmcgdGhpcyB0eXBlIHdpdGggYFRleHRGaWVsZGAgKi9cblx0UGFzc3dvcmQgPSBcInBhc3N3b3JkXCIsXG5cdEFyZWEgPSBcImFyZWFcIixcblx0TnVtYmVyID0gXCJudW1iZXJcIixcblx0VXJsID0gXCJ1cmxcIixcblx0RGF0ZSA9IFwiZGF0ZVwiLFxuXHRUaW1lID0gXCJ0aW1lXCIsXG59XG5cbi8vIHJlbGV2YW50IHN1YnNldCBvZiBwb3NzaWJsZSB2YWx1ZXMgZm9yIHRoZSBhdXRvY29tcGxldGUgaHRtbCBmaWVsZFxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRNTC9BdHRyaWJ1dGVzL2F1dG9jb21wbGV0ZVxuZXhwb3J0IGNvbnN0IGVudW0gQXV0b2NvbXBsZXRlIHtcblx0b2ZmID0gXCJvZmZcIixcblx0ZW1haWwgPSBcImVtYWlsXCIsXG5cdHVzZXJuYW1lID0gXCJ1c2VybmFtZVwiLFxuXHRuZXdQYXNzd29yZCA9IFwibmV3LXBhc3N3b3JkXCIsXG5cdGN1cnJlbnRQYXNzd29yZCA9IFwiY3VycmVudC1wYXNzd29yZFwiLFxuXHRvbmVUaW1lQ29kZSA9IFwib25lLXRpbWUtY29kZVwiLFxuXHRjY051bWJlciA9IFwiY2MtbnVtYmVyXCIsXG5cdGNjQ3NjID0gXCJjYy1jc2NcIixcblx0Y2NFeHAgPSBcImNjLWV4cFwiLFxufVxuXG4vLyByZWxldmFudCBzdWJzZXQgb2YgcG9zc2libGUgdmFsdWVzIGZvciB0aGUgYXV0b2NhcGl0YWxpemUgaHRtbCBmaWVsZFxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSFRNTC9HbG9iYWxfYXR0cmlidXRlcy9hdXRvY2FwaXRhbGl6ZVxuZXhwb3J0IGNvbnN0IGVudW0gQXV0b2NhcGl0YWxpemUge1xuXHRub25lID0gXCJub25lXCIsXG59XG5cbmV4cG9ydCBjb25zdCBpbnB1dExpbmVIZWlnaHQ6IG51bWJlciA9IHNpemUuZm9udF9zaXplX2Jhc2UgKyA4XG5jb25zdCBpbnB1dE1hcmdpblRvcCA9IHNpemUuZm9udF9zaXplX3NtYWxsICsgc2l6ZS5ocGFkX3NtYWxsICsgM1xuXG4vLyB0aGlzIGlzIG5vdCBhbHdheXMgY29ycmVjdCBiZWNhdXNlIGZvbnQgc2l6ZSBjYW4gYmUgYmlnZ2VyL3NtYWxsZXIsIGFuZCB3ZSBpZGVhbGx5IHNob3VsZCB0YWtlIHRoYXQgaW50byBhY2NvdW50XG5jb25zdCBiYXNlTGFiZWxQb3NpdGlvbiA9IDIxXG4vLyBpdCBzaG91bGQgZml0XG4vLyBjb21wYWN0IGJ1dHRvbiArIDEgcHggYm9yZGVyICsgMSBweCBwYWRkaW5nIHRvIGtlZXAgdGhpbmdzIGNlbnRlcmVkID0gMzJcbi8vIDI0cHggbGluZS1oZWlnaHQgKyAxMnB4IGxhYmVsICsgc29tZSBzcGFjZSBiZXR3ZWVuIHRoZW0gPSAzNiArID9cbmNvbnN0IG1pbklucHV0SGVpZ2h0ID0gNDZcblxuZXhwb3J0IGNsYXNzIFRleHRGaWVsZCBpbXBsZW1lbnRzIENsYXNzQ29tcG9uZW50PFRleHRGaWVsZEF0dHJzPiB7XG5cdGFjdGl2ZTogYm9vbGVhblxuXHRvbmJsdXI6IEV2ZW50TGlzdGVuZXIgfCBudWxsID0gbnVsbFxuXHRkb21JbnB1dCE6IEhUTUxJbnB1dEVsZW1lbnRcblx0X2RvbVdyYXBwZXIhOiBIVE1MRWxlbWVudFxuXHRwcml2YXRlIF9kb21MYWJlbCE6IEhUTUxFbGVtZW50XG5cdHByaXZhdGUgX2RvbUlucHV0V3JhcHBlciE6IEhUTUxFbGVtZW50XG5cdHByaXZhdGUgX2RpZEF1dG9maWxsITogYm9vbGVhblxuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuYWN0aXZlID0gZmFsc2Vcblx0fVxuXG5cdHZpZXcodm5vZGU6IENWbm9kZTxUZXh0RmllbGRBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgYSA9IHZub2RlLmF0dHJzXG5cdFx0Y29uc3QgbWF4V2lkdGggPSBhLm1heFdpZHRoXG5cdFx0Y29uc3QgbGFiZWxCYXNlID0gIXRoaXMuYWN0aXZlICYmIGEudmFsdWUgPT09IFwiXCIgJiYgIWEuaXNSZWFkT25seSAmJiAhdGhpcy5fZGlkQXV0b2ZpbGwgJiYgIWEuaW5qZWN0aW9uc0xlZnRcblx0XHRjb25zdCBsYWJlbFRyYW5zaXRpb25TcGVlZCA9IERlZmF1bHRBbmltYXRpb25UaW1lIC8gMlxuXHRcdGNvbnN0IGRvU2hvd0JvcmRlciA9IGEuZG9TaG93Qm9yZGVyICE9PSBmYWxzZVxuXHRcdGNvbnN0IGJvcmRlcldpZHRoID0gdGhpcy5hY3RpdmUgPyBcIjJweFwiIDogXCIxcHhcIlxuXHRcdGNvbnN0IGJvcmRlckNvbG9yID0gdGhpcy5hY3RpdmUgPyB0aGVtZS5jb250ZW50X2FjY2VudCA6IHRoZW1lLmNvbnRlbnRfYm9yZGVyXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi50ZXh0LWZpZWxkLnJlbC5vdmVyZmxvdy1oaWRkZW5cIixcblx0XHRcdHtcblx0XHRcdFx0aWQ6IHZub2RlLmF0dHJzLmlkLFxuXHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiAodGhpcy5fZG9tV3JhcHBlciA9IHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudCksXG5cdFx0XHRcdG9uY2xpY2s6IChlOiBNb3VzZUV2ZW50KSA9PiAoYS5vbmNsaWNrID8gYS5vbmNsaWNrKGUsIHRoaXMuX2RvbUlucHV0V3JhcHBlcikgOiB0aGlzLmZvY3VzKGUsIGEpKSxcblx0XHRcdFx0XCJhcmlhLWhhc3BvcHVwXCI6IGEuaGFzUG9wdXAsXG5cdFx0XHRcdGNsYXNzOiBhLmNsYXNzICE9IG51bGwgPyBhLmNsYXNzIDogXCJwdFwiICsgXCIgXCIgKyBnZXRPcGVyYXRpbmdDbGFzc2VzKGEuZGlzYWJsZWQpLFxuXHRcdFx0XHRzdHlsZTogbWF4V2lkdGhcblx0XHRcdFx0XHQ/IHtcblx0XHRcdFx0XHRcdFx0bWF4V2lkdGg6IHB4KG1heFdpZHRoKSxcblx0XHRcdFx0XHRcdFx0Li4uYS5zdHlsZSxcblx0XHRcdFx0XHQgIH1cblx0XHRcdFx0XHQ6IHsgLi4uYS5zdHlsZSB9LFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcImxhYmVsLmFicy50ZXh0LWVsbGlwc2lzLm5vc2VsZWN0LnoxLmkucHItc1wiLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCIsXG5cdFx0XHRcdFx0XHRjbGFzczogdGhpcy5hY3RpdmUgPyBcImNvbnRlbnQtYWNjZW50LWZnXCIgOiBcIlwiICsgXCIgXCIgKyBnZXRPcGVyYXRpbmdDbGFzc2VzKGEuZGlzYWJsZWQpLFxuXHRcdFx0XHRcdFx0b25jcmVhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHR0aGlzLl9kb21MYWJlbCA9IHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdGZvbnRTaXplOiBgJHtsYWJlbEJhc2UgPyBzaXplLmZvbnRfc2l6ZV9iYXNlIDogc2l6ZS5mb250X3NpemVfc21hbGx9cHhgLFxuXHRcdFx0XHRcdFx0XHR0cmFuc2Zvcm06IGB0cmFuc2xhdGVZKCR7bGFiZWxCYXNlID8gYmFzZUxhYmVsUG9zaXRpb24gOiAwfXB4KWAsXG5cdFx0XHRcdFx0XHRcdHRyYW5zaXRpb246IGB0cmFuc2Zvcm0gJHtsYWJlbFRyYW5zaXRpb25TcGVlZH1tcyBlYXNlLW91dCwgZm9udC1zaXplICR7bGFiZWxUcmFuc2l0aW9uU3BlZWR9bXMgIGVhc2Utb3V0YCxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRsYW5nLmdldFRyYW5zbGF0aW9uVGV4dChhLmxhYmVsKSxcblx0XHRcdFx0KSxcblx0XHRcdFx0bShcIi5mbGV4LmZsZXgtY29sdW1uXCIsIFtcblx0XHRcdFx0XHQvLyBhbm90aGVyIHdyYXBwZXIgdG8gZml4IElFIDExIG1pbi1oZWlnaHQgYnVnIGh0dHBzOi8vZ2l0aHViLmNvbS9waGlsaXB3YWx0b24vZmxleGJ1Z3MjMy1taW4taGVpZ2h0LW9uLWEtZmxleC1jb250YWluZXItd29udC1hcHBseS10by1pdHMtZmxleC1pdGVtc1xuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcIi5mbGV4Lml0ZW1zLWVuZC5mbGV4LXdyYXBcIixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Ly8gLmZsZXgtd3JhcFxuXHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFwibWluLWhlaWdodFwiOiBweChtaW5JbnB1dEhlaWdodCksXG5cdFx0XHRcdFx0XHRcdFx0Ly8gMiBweCBib3JkZXJcblx0XHRcdFx0XHRcdFx0XHRcInBhZGRpbmctYm90dG9tXCI6IHRoaXMuYWN0aXZlID8gcHgoMCkgOiBweCgxKSxcblx0XHRcdFx0XHRcdFx0XHRcImJvcmRlci1ib3R0b21cIjogZG9TaG93Qm9yZGVyID8gYCR7Ym9yZGVyV2lkdGh9IHNvbGlkICR7Ym9yZGVyQ29sb3J9YCA6IFwiXCIsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0W1xuXHRcdFx0XHRcdFx0XHRhLmluamVjdGlvbnNMZWZ0ID8gYS5pbmplY3Rpb25zTGVmdCgpIDogbnVsbCwgLy8gYWRkaXRpb25hbCB3cmFwcGVyIGVsZW1lbnQgZm9yIGJ1YmJsZSBpbnB1dCBmaWVsZC4gaW5wdXQgZmllbGQgc2hvdWxkIGFsd2F5cyBiZSBpbiBvbmUgbGluZSB3aXRoIHJpZ2h0IGluamVjdGlvbnNcblx0XHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XHRcIi5pbnB1dFdyYXBwZXIuZmxleC1zcGFjZS1iZXR3ZWVuLml0ZW1zLWVuZFwiLFxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdG1pbkhlaWdodDogcHgobWluSW5wdXRIZWlnaHQgLSAyKSwgLy8gbWludXMgcGFkZGluZ1xuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+ICh0aGlzLl9kb21JbnB1dFdyYXBwZXIgPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQpLFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0W1xuXHRcdFx0XHRcdFx0XHRcdFx0YS50eXBlICE9PSBUZXh0RmllbGRUeXBlLkFyZWEgPyB0aGlzLl9nZXRJbnB1dEZpZWxkKGEpIDogdGhpcy5fZ2V0VGV4dEFyZWEoYSksXG5cdFx0XHRcdFx0XHRcdFx0XHRhLmluamVjdGlvbnNSaWdodFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQ/IG0oXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcIi5mbGV4LWVuZC5pdGVtcy1jZW50ZXJcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0c3R5bGU6IHsgbWluSGVpZ2h0OiBweChtaW5JbnB1dEhlaWdodCAtIDIpIH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YS5pbmplY3Rpb25zUmlnaHQoKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0ICApXG5cdFx0XHRcdFx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRdKSxcblx0XHRcdFx0YS5oZWxwTGFiZWxcblx0XHRcdFx0XHQ/IG0oXG5cdFx0XHRcdFx0XHRcdFwic21hbGwubm9zZWxlY3RcIixcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdG9uY2xpY2s6IChlOiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0YS5oZWxwTGFiZWwoKSxcblx0XHRcdFx0XHQgIClcblx0XHRcdFx0XHQ6IFtdLFxuXHRcdFx0XSxcblx0XHQpXG5cdH1cblxuXHRfZ2V0SW5wdXRGaWVsZChhOiBUZXh0RmllbGRBdHRycyk6IENoaWxkcmVuIHtcblx0XHRpZiAoYS5pc1JlYWRPbmx5KSB7XG5cdFx0XHRyZXR1cm4gbShcblx0XHRcdFx0XCIudGV4dC1icmVhay5zZWxlY3RhYmxlXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0bWFyZ2luVG9wOiBweChpbnB1dE1hcmdpblRvcCksXG5cdFx0XHRcdFx0XHRsaW5lSGVpZ2h0OiBweChpbnB1dExpbmVIZWlnaHQpLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XCJkYXRhLXRlc3RpZFwiOiBgdGY6JHtsYW5nLmdldFRlc3RJZChhLmxhYmVsKX1gLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRhLnZhbHVlLFxuXHRcdFx0KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBEdWUgdG8gbW9kZXJuIGJyb3dzZXIncyAnc21hcnQnIHBhc3N3b3JkIG1hbmFnZXJzIHRoYXQgdHJ5IHRvIGF1dG9maWxsIGV2ZXJ5dGhpbmdcblx0XHRcdC8vIHRoYXQgcmVtb3RlbHkgcmVzZW1ibGVzIGEgcGFzc3dvcmQgZmllbGQsIHdlIHByZXBlbmQgaW52aXNpYmxlIGlucHV0cyB0byBwYXNzd29yZCBmaWVsZHNcblx0XHRcdC8vIHRoYXQgc2hvdWxkbid0IGJlIGF1dG9maWxsZWQuXG5cdFx0XHQvLyBzaW5jZSB0aGUgYXV0b2ZpbGwgYWxnb3JpdGhtIGxvb2tzIGF0IGlucHV0cyB0aGF0IGNvbWUgYmVmb3JlIGFuZCBhZnRlciB0aGUgcGFzc3dvcmQgZmllbGQgd2UgbmVlZFxuXHRcdFx0Ly8gdGhyZWUgZHVtbWllcy5cblx0XHRcdGNvbnN0IGF1dG9maWxsR3VhcmQ6IENoaWxkcmVuID1cblx0XHRcdFx0YS5hdXRvY29tcGxldGVBcyA9PT0gQXV0b2NvbXBsZXRlLm9mZlxuXHRcdFx0XHRcdD8gW1xuXHRcdFx0XHRcdFx0XHRtKFwiaW5wdXQuYWJzXCIsIHtcblx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0b3BhY2l0eTogXCIwXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRoZWlnaHQ6IFwiMFwiLFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0dGFiSW5kZXg6IFRhYkluZGV4LlByb2dyYW1tYXRpYyxcblx0XHRcdFx0XHRcdFx0XHR0eXBlOiBUZXh0RmllbGRUeXBlLlRleHQsXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRtKFwiaW5wdXQuYWJzXCIsIHtcblx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0b3BhY2l0eTogXCIwXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRoZWlnaHQ6IFwiMFwiLFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0dGFiSW5kZXg6IFRhYkluZGV4LlByb2dyYW1tYXRpYyxcblx0XHRcdFx0XHRcdFx0XHR0eXBlOiBUZXh0RmllbGRUeXBlLlBhc3N3b3JkLFxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0bShcImlucHV0LmFic1wiLCB7XG5cdFx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRcdG9wYWNpdHk6IFwiMFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0aGVpZ2h0OiBcIjBcIixcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdHRhYkluZGV4OiBUYWJJbmRleC5Qcm9ncmFtbWF0aWMsXG5cdFx0XHRcdFx0XHRcdFx0dHlwZTogVGV4dEZpZWxkVHlwZS5UZXh0LFxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHQgIF1cblx0XHRcdFx0XHQ6IFtdXG5cdFx0XHRyZXR1cm4gbShcblx0XHRcdFx0XCIuZmxleC1ncm93LnJlbFwiLFxuXHRcdFx0XHRhdXRvZmlsbEd1YXJkLmNvbmNhdChbXG5cdFx0XHRcdFx0bShcImlucHV0LmlucHV0XCIgKyAoYS5hbGlnblJpZ2h0ID8gXCIucmlnaHRcIiA6IFwiXCIpLCB7XG5cdFx0XHRcdFx0XHRhdXRvY29tcGxldGU6IGEuYXV0b2NvbXBsZXRlQXMgPz8gXCJcIixcblx0XHRcdFx0XHRcdGF1dG9jYXBpdGFsaXplOiBhLmF1dG9jYXBpdGFsaXplLFxuXHRcdFx0XHRcdFx0dHlwZTogYS50eXBlLFxuXHRcdFx0XHRcdFx0bWluOiBhLm1pbixcblx0XHRcdFx0XHRcdG1heDogYS5tYXgsXG5cdFx0XHRcdFx0XHRcImFyaWEtbGFiZWxcIjogbGFuZy5nZXRUcmFuc2xhdGlvblRleHQoYS5sYWJlbCksXG5cdFx0XHRcdFx0XHRkaXNhYmxlZDogYS5kaXNhYmxlZCxcblx0XHRcdFx0XHRcdGNsYXNzOiBnZXRPcGVyYXRpbmdDbGFzc2VzKGEuZGlzYWJsZWQpICsgXCIgdGV4dFwiLFxuXHRcdFx0XHRcdFx0b25jcmVhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmRvbUlucHV0ID0gdm5vZGUuZG9tIGFzIEhUTUxJbnB1dEVsZW1lbnRcblx0XHRcdFx0XHRcdFx0YS5vbkRvbUlucHV0Q3JlYXRlZD8uKHRoaXMuZG9tSW5wdXQpXG5cdFx0XHRcdFx0XHRcdHRoaXMuZG9tSW5wdXQudmFsdWUgPSBhLnZhbHVlXG5cdFx0XHRcdFx0XHRcdGlmIChhLnR5cGUgIT09IFRleHRGaWVsZFR5cGUuQXJlYSkge1xuXHRcdFx0XHRcdFx0XHRcdDsodm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50KS5hZGRFdmVudExpc3RlbmVyKFwiYW5pbWF0aW9uc3RhcnRcIiwgKGU6IEFuaW1hdGlvbkV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoZS5hbmltYXRpb25OYW1lID09PSBcIm9uQXV0b0ZpbGxTdGFydFwiKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuX2RpZEF1dG9maWxsID0gdHJ1ZVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKGUuYW5pbWF0aW9uTmFtZSA9PT0gXCJvbkF1dG9GaWxsQ2FuY2VsXCIpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5fZGlkQXV0b2ZpbGwgPSBmYWxzZVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG9uZm9jdXM6IChlOiBGb2N1c0V2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuZm9jdXMoZSwgYSlcblx0XHRcdFx0XHRcdFx0YS5vbmZvY3VzPy4odGhpcy5fZG9tV3JhcHBlciwgdGhpcy5kb21JbnB1dClcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRvbmJsdXI6IChlOiBGb2N1c0V2ZW50KSA9PiB0aGlzLmJsdXIoZSwgYSksXG5cdFx0XHRcdFx0XHRvbmtleWRvd246IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGhhbmRsZWQgPSB1c2VLZXlIYW5kbGVyKGUsIGEua2V5SGFuZGxlcilcblx0XHRcdFx0XHRcdFx0aWYgKCFpc0tleVByZXNzZWQoZS5rZXksIEtleXMuRjEsIEtleXMuVEFCLCBLZXlzLkVTQykpIHtcblx0XHRcdFx0XHRcdFx0XHQvLyBXaGVuIHdlIGFyZSBpbiBhIHRleHQgZmllbGQgd2UgZG9uJ3Qgd2FudCBrZXlzIHByb3BhZ2F0ZWQgdXAgdG8gYWN0IGFzIGhvdGtleXNcblx0XHRcdFx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cmV0dXJuIGhhbmRsZWRcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRvbnVwZGF0ZTogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHQvLyBvbmx5IGNoYW5nZSB0aGUgdmFsdWUgaWYgdGhlIHZhbHVlIGhhcyBjaGFuZ2VkIG90aGVyd2lzZSB0aGUgY3Vyc29yIGluIFNhZmFyaSBhbmQgaW4gdGhlIGlPUyBBcHAgY2Fubm90IGJlIHBvc2l0aW9uZWQuXG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLmRvbUlucHV0LnZhbHVlICE9PSBhLnZhbHVlKSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5kb21JbnB1dC52YWx1ZSA9IGEudmFsdWVcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG9uaW5wdXQ6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0YS5vbmlucHV0Py4odGhpcy5kb21JbnB1dC52YWx1ZSwgdGhpcy5kb21JbnB1dClcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRvbnJlbW92ZTogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHQvLyBXZSBjbGVhbiB1cCBhbnkgdmFsdWUgdGhhdCBtaWdodCBzdGlsbCBiZSBpbiBET00gZS5nLiBwYXNzd29yZFxuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5kb21JbnB1dCkgdGhpcy5kb21JbnB1dC52YWx1ZSA9IFwiXCJcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRtYXhXaWR0aDogYS5tYXhXaWR0aCxcblx0XHRcdFx0XHRcdFx0bWluV2lkdGg6IHB4KDIwKSxcblx0XHRcdFx0XHRcdFx0Ly8gZml4IGZvciBlZGdlIGJyb3dzZXIuIGJ1dHRvbnMgYXJlIGN1dCBvZmYgaW4gc21hbGwgd2luZG93cyBvdGhlcndpc2Vcblx0XHRcdFx0XHRcdFx0bGluZUhlaWdodDogcHgoaW5wdXRMaW5lSGVpZ2h0KSxcblx0XHRcdFx0XHRcdFx0Zm9udFNpemU6IGEuZm9udFNpemUsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XCJkYXRhLXRlc3RpZFwiOiBgdGY6JHtsYW5nLmdldFRlc3RJZChhLmxhYmVsKX1gLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRdKSxcblx0XHRcdClcblx0XHR9XG5cdH1cblxuXHRfZ2V0VGV4dEFyZWEoYTogVGV4dEZpZWxkQXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0aWYgKGEuaXNSZWFkT25seSkge1xuXHRcdFx0cmV0dXJuIG0oXG5cdFx0XHRcdFwiLnRleHQtcHJld3JhcC50ZXh0LWJyZWFrLnNlbGVjdGFibGVcIixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRtYXJnaW5Ub3A6IHB4KGlucHV0TWFyZ2luVG9wKSxcblx0XHRcdFx0XHRcdGxpbmVIZWlnaHQ6IHB4KGlucHV0TGluZUhlaWdodCksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0YS52YWx1ZSxcblx0XHRcdClcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG0oXCJ0ZXh0YXJlYS5pbnB1dC1hcmVhLnRleHQtcHJlXCIsIHtcblx0XHRcdFx0XCJhcmlhLWxhYmVsXCI6IGxhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KGEubGFiZWwpLFxuXHRcdFx0XHRkaXNhYmxlZDogYS5kaXNhYmxlZCxcblx0XHRcdFx0YXV0b2NhcGl0YWxpemU6IGEuYXV0b2NhcGl0YWxpemUsXG5cdFx0XHRcdGNsYXNzOiBnZXRPcGVyYXRpbmdDbGFzc2VzKGEuZGlzYWJsZWQpICsgXCIgdGV4dFwiLFxuXHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5kb21JbnB1dCA9IHZub2RlLmRvbSBhcyBIVE1MSW5wdXRFbGVtZW50XG5cdFx0XHRcdFx0dGhpcy5kb21JbnB1dC52YWx1ZSA9IGEudmFsdWVcblx0XHRcdFx0XHR0aGlzLmRvbUlucHV0LnN0eWxlLmhlaWdodCA9IHB4KE1hdGgubWF4KGEudmFsdWUuc3BsaXQoXCJcXG5cIikubGVuZ3RoLCAxKSAqIGlucHV0TGluZUhlaWdodCkgLy8gZGlzcGxheSBhbGwgbGluZXMgb24gY3JlYXRpb24gb2YgdGV4dCBhcmVhXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uZm9jdXM6IChlOiBGb2N1c0V2ZW50KSA9PiB0aGlzLmZvY3VzKGUsIGEpLFxuXHRcdFx0XHRvbmJsdXI6IChlOiBGb2N1c0V2ZW50KSA9PiB0aGlzLmJsdXIoZSwgYSksXG5cdFx0XHRcdG9ua2V5ZG93bjogKGU6IEtleWJvYXJkRXZlbnQpID0+IHVzZUtleUhhbmRsZXIoZSwgYS5rZXlIYW5kbGVyKSxcblx0XHRcdFx0b25pbnB1dDogKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuZG9tSW5wdXQuc3R5bGUuaGVpZ2h0ID0gXCIwcHhcIlxuXHRcdFx0XHRcdHRoaXMuZG9tSW5wdXQuc3R5bGUuaGVpZ2h0ID0gcHgodGhpcy5kb21JbnB1dC5zY3JvbGxIZWlnaHQpXG5cdFx0XHRcdFx0YS5vbmlucHV0Py4odGhpcy5kb21JbnB1dC52YWx1ZSwgdGhpcy5kb21JbnB1dClcblx0XHRcdFx0fSxcblx0XHRcdFx0b251cGRhdGU6ICgpID0+IHtcblx0XHRcdFx0XHQvLyBvbmx5IGNoYW5nZSB0aGUgdmFsdWUgaWYgdGhlIHZhbHVlIGhhcyBjaGFuZ2VkIG90aGVyd2lzZSB0aGUgY3Vyc29yIGluIFNhZmFyaSBhbmQgaW4gdGhlIGlPUyBBcHAgY2Fubm90IGJlIHBvc2l0aW9uZWQuXG5cdFx0XHRcdFx0aWYgKHRoaXMuZG9tSW5wdXQudmFsdWUgIT09IGEudmFsdWUpIHtcblx0XHRcdFx0XHRcdHRoaXMuZG9tSW5wdXQudmFsdWUgPSBhLnZhbHVlXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdG1hcmdpblRvcDogcHgoaW5wdXRNYXJnaW5Ub3ApLFxuXHRcdFx0XHRcdGxpbmVIZWlnaHQ6IHB4KGlucHV0TGluZUhlaWdodCksXG5cdFx0XHRcdFx0bWluV2lkdGg6IHB4KDIwKSwgLy8gZml4IGZvciBlZGdlIGJyb3dzZXIuIGJ1dHRvbnMgYXJlIGN1dCBvZmYgaW4gc21hbGwgd2luZG93cyBvdGhlcndpc2Vcblx0XHRcdFx0XHRmb250U2l6ZTogYS5mb250U2l6ZSxcblx0XHRcdFx0fSxcblx0XHRcdH0pXG5cdFx0fVxuXHR9XG5cblx0Zm9jdXMoZTogRXZlbnQsIGE6IFRleHRGaWVsZEF0dHJzKSB7XG5cdFx0aWYgKCF0aGlzLmFjdGl2ZSAmJiAhYS5kaXNhYmxlZCAmJiAhYS5pc1JlYWRPbmx5KSB7XG5cdFx0XHR0aGlzLmFjdGl2ZSA9IHRydWVcblx0XHRcdHRoaXMuZG9tSW5wdXQuZm9jdXMoKVxuXG5cdFx0XHR0aGlzLl9kb21XcmFwcGVyLmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIilcblx0XHR9XG5cdH1cblxuXHRibHVyKGU6IEV2ZW50LCBhOiBUZXh0RmllbGRBdHRycykge1xuXHRcdHRoaXMuX2RvbVdyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZShcImFjdGl2ZVwiKVxuXHRcdHRoaXMuYWN0aXZlID0gZmFsc2Vcblx0XHRpZiAoYS5vbmJsdXIgaW5zdGFuY2VvZiBGdW5jdGlvbikgYS5vbmJsdXIoZSlcblx0fVxuXG5cdGlzRW1wdHkodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB2YWx1ZSA9PT0gXCJcIlxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB0eXBlIHsgRGlhbG9nSGVhZGVyQmFyQXR0cnMgfSBmcm9tIFwiLi9EaWFsb2dIZWFkZXJCYXJcIlxuaW1wb3J0IHsgRGlhbG9nSGVhZGVyQmFyIH0gZnJvbSBcIi4vRGlhbG9nSGVhZGVyQmFyXCJcbmltcG9ydCB7IHB4IH0gZnJvbSBcIi4uL3NpemVcIlxuaW1wb3J0IHR5cGUgeyBNYXliZUxhenkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IHJlc29sdmVNYXliZUxhenkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcblxuZXhwb3J0IHR5cGUgRGlhbG9nSW5qZWN0aW9uUmlnaHRBdHRyczxUIGV4dGVuZHMgb2JqZWN0PiA9IHtcblx0dmlzaWJsZTogU3RyZWFtPGJvb2xlYW4+XG5cdGhlYWRlckF0dHJzOiBNYXliZUxhenk8RGlhbG9nSGVhZGVyQmFyQXR0cnM+XG5cdGNvbXBvbmVudDogQ2xhc3M8Q29tcG9uZW50PFQ+PlxuXHRjb21wb25lbnRBdHRyczogVFxufVxuXG4vKipcbiAqIGluamVjdHMgYWRkaXRpb25hbCBjb250ZW50IG9uIHRoZSByaWdodCBvZiBhIGRpYWxvZ1xuICovXG5leHBvcnQgY2xhc3MgRGlhbG9nSW5qZWN0aW9uUmlnaHQ8VCBleHRlbmRzIG9iamVjdD4gaW1wbGVtZW50cyBDb21wb25lbnQ8RGlhbG9nSW5qZWN0aW9uUmlnaHRBdHRyczxUPj4ge1xuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8RGlhbG9nSW5qZWN0aW9uUmlnaHRBdHRyczxUPj4pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgeyBjb21wb25lbnQsIGNvbXBvbmVudEF0dHJzIH0gPSBhdHRyc1xuXG5cdFx0aWYgKGF0dHJzLnZpc2libGUoKSkge1xuXHRcdFx0cmV0dXJuIG0oXCIuZmxleC1ncm93LXNocmluay1hdXRvLmZsZXgtdHJhbnNpdGlvbi5tbC1zLnJlbC5kaWFsb2cuZGlhbG9nLXdpZHRoLW0uZWxldmF0ZWQtYmcuZHJvcGRvd24tc2hhZG93LmJvcmRlci1yYWRpdXNcIiwgW1xuXHRcdFx0XHRtKERpYWxvZ0hlYWRlckJhciwgcmVzb2x2ZU1heWJlTGF6eShhdHRycy5oZWFkZXJBdHRycykpLFxuXHRcdFx0XHRtKFwiLmRpYWxvZy1jb250YWluZXIuc2Nyb2xsLnBsci1sXCIsIG0oY29tcG9uZW50LCBjb21wb25lbnRBdHRycykpLFxuXHRcdFx0XSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG0oXCIuZmxleC1oaWRlLmZsZXgtdHJhbnNpdGlvbi5yZWxcIiwge1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdG1heFdpZHRoOiBweCgwKSxcblx0XHRcdFx0fSxcblx0XHRcdH0pXG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50IH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHR5cGUgeyBNb2RhbENvbXBvbmVudCB9IGZyb20gXCIuL01vZGFsXCJcbmltcG9ydCB7IG1vZGFsIH0gZnJvbSBcIi4vTW9kYWxcIlxuaW1wb3J0IHsgYWxwaGEsIEFscGhhRW51bSwgQW5pbWF0aW9uUHJvbWlzZSwgYW5pbWF0aW9ucywgRGVmYXVsdEFuaW1hdGlvblRpbWUsIG9wYWNpdHksIHRyYW5zZm9ybSwgVHJhbnNmb3JtRW51bSB9IGZyb20gXCIuLi9hbmltYXRpb24vQW5pbWF0aW9uc1wiXG5pbXBvcnQgeyBlYXNlIH0gZnJvbSBcIi4uL2FuaW1hdGlvbi9FYXNpbmdcIlxuaW1wb3J0IHR5cGUgeyBNYXliZVRyYW5zbGF0aW9uLCBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi8uLi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgdHlwZSB7IFNob3J0Y3V0IH0gZnJvbSBcIi4uLy4uL21pc2MvS2V5TWFuYWdlclwiXG5pbXBvcnQgeyBmb2N1c05leHQsIGZvY3VzUHJldmlvdXMsIGtleU1hbmFnZXIgfSBmcm9tIFwiLi4vLi4vbWlzYy9LZXlNYW5hZ2VyXCJcbmltcG9ydCB7IGdldEVsZXZhdGVkQmFja2dyb3VuZCB9IGZyb20gXCIuLi90aGVtZVwiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi9zaXplXCJcbmltcG9ydCB7IEhhYlJlbWluZGVySW1hZ2UgfSBmcm9tIFwiLi9pY29ucy9JY29uc1wiXG5pbXBvcnQgeyB3aW5kb3dGYWNhZGUgfSBmcm9tIFwiLi4vLi4vbWlzYy9XaW5kb3dGYWNhZGVcIlxuaW1wb3J0IHR5cGUgeyBCdXR0b25BdHRycyB9IGZyb20gXCIuL0J1dHRvbi5qc1wiXG5pbXBvcnQgeyBCdXR0b24sIEJ1dHRvblR5cGUgfSBmcm9tIFwiLi9CdXR0b24uanNcIlxuaW1wb3J0IHR5cGUgeyBEaWFsb2dIZWFkZXJCYXJBdHRycyB9IGZyb20gXCIuL0RpYWxvZ0hlYWRlckJhclwiXG5pbXBvcnQgeyBEaWFsb2dIZWFkZXJCYXIgfSBmcm9tIFwiLi9EaWFsb2dIZWFkZXJCYXJcIlxuaW1wb3J0IHsgVGV4dEZpZWxkLCBUZXh0RmllbGRUeXBlIH0gZnJvbSBcIi4vVGV4dEZpZWxkLmpzXCJcbmltcG9ydCB0eXBlIHsgRHJvcERvd25TZWxlY3RvckF0dHJzLCBTZWxlY3Rvckl0ZW1MaXN0IH0gZnJvbSBcIi4vRHJvcERvd25TZWxlY3Rvci5qc1wiXG5pbXBvcnQgeyBEcm9wRG93blNlbGVjdG9yIH0gZnJvbSBcIi4vRHJvcERvd25TZWxlY3Rvci5qc1wiXG5pbXBvcnQgeyBERUZBVUxUX0VSUk9SLCBLZXlzLCBUYWJJbmRleCB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IEFyaWFXaW5kb3cgfSBmcm9tIFwiLi4vQXJpYVV0aWxzXCJcbmltcG9ydCB7IHN0eWxlcyB9IGZyb20gXCIuLi9zdHlsZXNcIlxuaW1wb3J0IHsgJFByb21pc2FibGUsIGFzc2VydE5vdE51bGwsIGdldEFzTGF6eSwgaWRlbnRpdHksIGxhenksIG1hcExhemlseSwgTWF5YmVMYXp5LCBub09wLCBUaHVuayB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHR5cGUgeyBEaWFsb2dJbmplY3Rpb25SaWdodEF0dHJzIH0gZnJvbSBcIi4vRGlhbG9nSW5qZWN0aW9uUmlnaHRcIlxuaW1wb3J0IHsgRGlhbG9nSW5qZWN0aW9uUmlnaHQgfSBmcm9tIFwiLi9EaWFsb2dJbmplY3Rpb25SaWdodFwiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IGlzT2ZmbGluZUVycm9yIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vdXRpbHMvRXJyb3JVdGlscy5qc1wiXG5pbXBvcnQgU3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuZXhwb3J0IGNvbnN0IElOUFVUID0gXCJpbnB1dCwgdGV4dGFyZWEsIGRpdltjb250ZW50ZWRpdGFibGU9J3RydWUnXVwiXG5cbmV4cG9ydCBjb25zdCBlbnVtIERpYWxvZ1R5cGUge1xuXHRQcm9ncmVzcyA9IFwiUHJvZ3Jlc3NcIixcblx0QWxlcnQgPSBcIkFsZXJ0XCIsXG5cdFJlbWluZGVyID0gXCJSZW1pbmRlclwiLFxuXHRFZGl0U21hbGwgPSBcIkVkaXRTbWFsbFwiLFxuXHRFZGl0TWVkaXVtID0gXCJFZGl0TWVkaXVtXCIsXG5cdEVkaXRMYXJnZXIgPSBcIkVkaXRMYXJnZXJcIixcblx0RWRpdExhcmdlID0gXCJFZGl0TGFyZ2VcIixcbn1cblxudHlwZSBWYWxpZGF0b3IgPSAoKSA9PiAkUHJvbWlzYWJsZTxUcmFuc2xhdGlvbktleSB8IG51bGw+XG5cbmV4cG9ydCB0eXBlIEFjdGlvbkRpYWxvZ1Byb3BzID0ge1xuXHR0aXRsZTogTWF5YmVUcmFuc2xhdGlvblxuXHRjaGlsZDogQ29tcG9uZW50IHwgbGF6eTxDaGlsZHJlbj5cblx0dmFsaWRhdG9yPzogVmFsaWRhdG9yIHwgbnVsbFxuXHRva0FjdGlvbjogbnVsbCB8ICgoYXJnMDogRGlhbG9nKSA9PiB1bmtub3duKVxuXHRhbGxvd0NhbmNlbD86IE1heWJlTGF6eTxib29sZWFuPlxuXHRhbGxvd09rV2l0aFJldHVybj86IGJvb2xlYW5cblx0b2tBY3Rpb25UZXh0SWQ/OiBNYXliZVRyYW5zbGF0aW9uXG5cdGNhbmNlbEFjdGlvbj86ICgoYXJnMDogRGlhbG9nKSA9PiB1bmtub3duKSB8IG51bGxcblx0Y2FuY2VsQWN0aW9uVGV4dElkPzogVHJhbnNsYXRpb25LZXlcblx0dHlwZT86IERpYWxvZ1R5cGVcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUZXh0SW5wdXREaWFsb2dQYXJhbXMge1xuXHQvKiogdGl0bGUgb2YgdGhlIGRpYWxvZyAqL1xuXHR0aXRsZTogTWF5YmVUcmFuc2xhdGlvblxuXG5cdC8qKiBsYWJlbCBvZiB0aGUgdGV4dCBmaWVsZCAqL1xuXHRsYWJlbDogTWF5YmVUcmFuc2xhdGlvblxuXG5cdC8qKiBoZWxwIGxhYmVsIG9mIHRoZSB0ZXh0IGZpZWxkICovXG5cdGluZm9Nc2dJZD86IE1heWJlVHJhbnNsYXRpb25cblxuXHQvKiogaW5pdGlhbCB2YWx1ZSwgaWYgYW55ICovXG5cdGRlZmF1bHRWYWx1ZT86IHN0cmluZ1xuXG5cdC8qKiBDYWxsZWQgd2hlbiBcIk9rXCIgaXMgY2xpY2tlZCByZWNlaXZpbmcgdGhlIGVudGVyZWQgdGV4dC4gTXVzdCByZXR1cm4gbnVsbCBpZiB0aGUgdGV4dCBpcyB2YWxpZCBvciBhbiBlcnJvciBtZXNzYWdlSWQgaWYgdGhlIHRleHQgaXMgaW52YWxpZCwgc28gYW4gZXJyb3IgbWVzc2FnZSBpcyBzaG93bi4gKi9cblx0aW5wdXRWYWxpZGF0b3I/OiBzdHJpbmdWYWxpZGF0b3JcblxuXHQvKiogVGV4dCBmaWVsZCB0eXBlIHRvIGRpc3BsYXkgKGRldGVybWluZXMgd2hhdCBrZXlib2FyZCB0byBkaXNwbGF5IG9uIG1vYmlsZSBkZXZpY2VzKSAqL1xuXHR0ZXh0RmllbGRUeXBlPzogVGV4dEZpZWxkVHlwZVxufVxuXG5leHBvcnQgY2xhc3MgRGlhbG9nIGltcGxlbWVudHMgTW9kYWxDb21wb25lbnQge1xuXHRwcml2YXRlIHN0YXRpYyBrZXlib2FyZEhlaWdodDogbnVtYmVyID0gMFxuXHRwcml2YXRlIGRvbURpYWxvZzogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIF9zaG9ydGN1dHM6IFNob3J0Y3V0W11cblx0dmlldzogTW9kYWxDb21wb25lbnRbXCJ2aWV3XCJdXG5cdHZpc2libGU6IGJvb2xlYW5cblx0cHJpdmF0ZSBmb2N1c09uTG9hZEZ1bmN0aW9uOiAoZG9tOiBIVE1MRWxlbWVudCkgPT4gdm9pZFxuXHRwcml2YXRlIHdhc0ZvY3VzT25Mb2FkQ2FsbGVkOiBib29sZWFuXG5cdHByaXZhdGUgY2xvc2VIYW5kbGVyOiBUaHVuayB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgZm9jdXNlZEJlZm9yZVNob3duOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgaW5qZWN0aW9uUmlnaHRBdHRyczogRGlhbG9nSW5qZWN0aW9uUmlnaHRBdHRyczxhbnk+IHwgbnVsbCA9IG51bGxcblxuXHRjb25zdHJ1Y3RvcihkaWFsb2dUeXBlOiBEaWFsb2dUeXBlLCBjaGlsZENvbXBvbmVudDogQ29tcG9uZW50KSB7XG5cdFx0dGhpcy52aXNpYmxlID0gZmFsc2VcblxuXHRcdHRoaXMuZm9jdXNPbkxvYWRGdW5jdGlvbiA9ICgpID0+IHRoaXMuZGVmYXVsdEZvY3VzT25Mb2FkKGFzc2VydE5vdE51bGwodGhpcy5kb21EaWFsb2cpKVxuXG5cdFx0dGhpcy53YXNGb2N1c09uTG9hZENhbGxlZCA9IGZhbHNlXG5cdFx0dGhpcy5fc2hvcnRjdXRzID0gW1xuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuVEFCLFxuXHRcdFx0XHRzaGlmdDogdHJ1ZSxcblx0XHRcdFx0ZXhlYzogKCkgPT4gKHRoaXMuZG9tRGlhbG9nID8gZm9jdXNQcmV2aW91cyh0aGlzLmRvbURpYWxvZykgOiBmYWxzZSksXG5cdFx0XHRcdGhlbHA6IFwic2VsZWN0UHJldmlvdXNfYWN0aW9uXCIsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuVEFCLFxuXHRcdFx0XHRzaGlmdDogZmFsc2UsXG5cdFx0XHRcdGV4ZWM6ICgpID0+ICh0aGlzLmRvbURpYWxvZyA/IGZvY3VzTmV4dCh0aGlzLmRvbURpYWxvZykgOiBmYWxzZSksXG5cdFx0XHRcdGhlbHA6IFwic2VsZWN0TmV4dF9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XVxuXG5cdFx0dGhpcy52aWV3ID0gKCk6IENoaWxkcmVuID0+IHtcblx0XHRcdGNvbnN0IG1hcmdpblB4ID0gcHgoc2l6ZS5ocGFkKVxuXHRcdFx0Y29uc3QgaXNFZGl0TGFyZ2UgPSBkaWFsb2dUeXBlID09PSBEaWFsb2dUeXBlLkVkaXRMYXJnZVxuXHRcdFx0Y29uc3Qgc2lkZXNNYXJnaW4gPSBzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKSAmJiBpc0VkaXRMYXJnZSA/IFwiNHB4XCIgOiBtYXJnaW5QeFxuXHRcdFx0cmV0dXJuIG0oXG5cdFx0XHRcdHRoaXMuZ2V0RGlhbG9nV3JhcHBlckNsYXNzZXMoZGlhbG9nVHlwZSksXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0cGFkZGluZ1RvcDogXCJlbnYoc2FmZS1hcmVhLWluc2V0LXRvcClcIixcblx0XHRcdFx0XHRcdHBhZGRpbmdMZWZ0OiBcImVudihzYWZlLWFyZWEtaW5zZXQtbGVmdClcIixcblx0XHRcdFx0XHRcdHBhZGRpbmdSaWdodDogXCJlbnYoc2FmZS1hcmVhLWluc2V0LXJpZ2h0KVwiLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdC8qKiBjb250cm9scyB2ZXJ0aWNhbCBhbGlnbm1lbnRcblx0XHRcdFx0ICogd2UgbmVlZCBvdmVyZmxvdy1oaWRkZW4gKGFjdHVhbGx5IHJlc3VsdGluZyBpbiBtaW4taGVpZ2h0OiAwIGluc3RlYWQgb2YgYXV0bylcblx0XHRcdFx0ICogaGVyZSBiZWNhdXNlIG90aGVyd2lzZSB0aGUgY29udGVudCBvZiB0aGUgZGlhbG9nIG1heSBtYWtlIHRoaXMgd3JhcHBlciBncm93IGJpZ2dlciBvdXRzaWRlXG5cdFx0XHRcdCAqIHRoZSB3aW5kb3cgb24gc29tZSBicm93c2VycywgZS5nLiB1cGdyYWRlIHJlbWluZGVyIG9uIEZpcmVmb3ggbW9iaWxlICovXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIuZmxleC5qdXN0aWZ5LWNlbnRlci5hbGlnbi1zZWxmLXN0cmV0Y2gucmVsLm92ZXJmbG93LWhpZGRlblwiICsgKGlzRWRpdExhcmdlID8gXCIuZmxleC1ncm93XCIgOiBcIi50cmFuc2l0aW9uLW1hcmdpblwiKSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHQvLyBjb250cm9scyBob3Jpem9udGFsIGFsaWdubWVudFxuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0bWFyZ2luVG9wOiBtYXJnaW5QeCxcblx0XHRcdFx0XHRcdFx0bWFyZ2luTGVmdDogc2lkZXNNYXJnaW4sXG5cdFx0XHRcdFx0XHRcdG1hcmdpblJpZ2h0OiBzaWRlc01hcmdpbixcblx0XHRcdFx0XHRcdFx0XCJtYXJnaW4tYm90dG9tXCI6IERpYWxvZy5rZXlib2FyZEhlaWdodCA+IDAgPyBweChEaWFsb2cua2V5Ym9hcmRIZWlnaHQpIDogaXNFZGl0TGFyZ2UgPyAwIDogbWFyZ2luUHgsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0W1xuXHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0dGhpcy5nZXREaWFsb2dTdHlsZShkaWFsb2dUeXBlKSxcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdHJvbGU6IEFyaWFXaW5kb3cuRGlhbG9nLFxuXHRcdFx0XHRcdFx0XHRcdFwiYXJpYS1tb2RhbFwiOiBcInRydWVcIixcblx0XHRcdFx0XHRcdFx0XHRcImFyaWEtbGFiZWxsZWRieVwiOiBcImRpYWxvZy10aXRsZVwiLFxuXHRcdFx0XHRcdFx0XHRcdFwiYXJpYS1kZXNjcmliZWRieVwiOiBcImRpYWxvZy1tZXNzYWdlXCIsXG5cdFx0XHRcdFx0XHRcdFx0b25jbGljazogKGU6IE1vdXNlRXZlbnQpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCksXG5cdFx0XHRcdFx0XHRcdFx0Ly8gZG8gbm90IHByb3BhZ2F0ZSBjbGlja3Mgb24gdGhlIGRpYWxvZyBhcyB0aGUgTW9kYWwgZXhwZWN0cyBhbGwgcHJvcGFnYXRlZCBjbGlja3MgdG8gYmUgY2xpY2tzIG9uIHRoZSBiYWNrZ3JvdW5kXG5cdFx0XHRcdFx0XHRcdFx0b25jcmVhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5kb21EaWFsb2cgPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0XHRcdFx0XHRcdGxldCBhbmltYXRpb246IEFuaW1hdGlvblByb21pc2UgfCBudWxsID0gbnVsbFxuXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoaXNFZGl0TGFyZ2UpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5kb21EaWFsb2cuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVkoJHt3aW5kb3cuaW5uZXJIZWlnaHR9cHgpYFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRhbmltYXRpb24gPSBhbmltYXRpb25zLmFkZCh0aGlzLmRvbURpYWxvZywgdHJhbnNmb3JtKFRyYW5zZm9ybUVudW0uVHJhbnNsYXRlWSwgd2luZG93LmlubmVySGVpZ2h0LCAwKSlcblx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IGJnY29sb3IgPSBnZXRFbGV2YXRlZEJhY2tncm91bmQoKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBjaGlsZHJlbiA9IEFycmF5LmZyb20odGhpcy5kb21EaWFsb2cuY2hpbGRyZW4pIGFzIEFycmF5PEhUTUxFbGVtZW50PlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRmb3IgKGxldCBjaGlsZCBvZiBjaGlsZHJlbikge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNoaWxkLnN0eWxlLm9wYWNpdHkgPSBcIjBcIlxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuZG9tRGlhbG9nLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGByZ2JhKDAsIDAsIDAsIDApYFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRhbmltYXRpb24gPSBQcm9taXNlLmFsbChbXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0YW5pbWF0aW9ucy5hZGQodGhpcy5kb21EaWFsb2csIGFscGhhKEFscGhhRW51bS5CYWNrZ3JvdW5kQ29sb3IsIGJnY29sb3IsIDAsIDEpKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRhbmltYXRpb25zLmFkZChjaGlsZHJlbiwgb3BhY2l0eSgwLCAxLCB0cnVlKSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVsYXk6IERlZmF1bHRBbmltYXRpb25UaW1lIC8gMixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XSlcblx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0Ly8gc2VsZWN0IGZpcnN0IGlucHV0IGZpZWxkLiBibHVyIGZpcnN0IHRvIGF2b2lkIHRoYXQgdXNlcnMgY2FuIGVudGVyIHRleHQgaW4gdGhlIHByZXZpb3VzbHkgZm9jdXNlZCBlbGVtZW50IHdoaWxlIHRoZSBhbmltYXRpb24gaXMgcnVubmluZ1xuXHRcdFx0XHRcdFx0XHRcdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IGFjdGl2ZUVsZW1lbnQgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50IHwgbnVsbFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoYWN0aXZlRWxlbWVudCAmJiB0eXBlb2YgYWN0aXZlRWxlbWVudC5ibHVyID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRhY3RpdmVFbGVtZW50LmJsdXIoKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0YW5pbWF0aW9uLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmZvY3VzT25Mb2FkRnVuY3Rpb24oYXNzZXJ0Tm90TnVsbCh0aGlzLmRvbURpYWxvZykpXG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy53YXNGb2N1c09uTG9hZENhbGxlZCA9IHRydWVcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBGYWxsIGJhY2sgdG8gdGhlIENTUyBjbGFzc2VzIGFmdGVyIGNvbXBsZXRpbmcgdGhlIG9wZW5pbmcgYW5pbWF0aW9uLlxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBCZWNhdXNlIGBiZ2NvbG9yYCBpcyBvbmx5IGNhbGN1bGF0ZWQgb24gY3JlYXRlIGFuZCBub3Qgb24gdGhlbWUgY2hhbmdlLlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAodGhpcy5kb21EaWFsb2cgIT0gbnVsbCAmJiAhaXNFZGl0TGFyZ2UpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmRvbURpYWxvZy5zdHlsZS5yZW1vdmVQcm9wZXJ0eShcImJhY2tncm91bmQtY29sb3JcIilcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRtKGNoaWxkQ29tcG9uZW50KSxcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHR0aGlzLmluamVjdGlvblJpZ2h0QXR0cnMgPyBtKERpYWxvZ0luamVjdGlvblJpZ2h0LCB0aGlzLmluamVjdGlvblJpZ2h0QXR0cnMpIDogbnVsbCxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHQpLFxuXHRcdFx0KVxuXHRcdH1cblx0fVxuXG5cdHNldEluamVjdGlvblJpZ2h0KGluamVjdGlvblJpZ2h0QXR0cnM6IERpYWxvZ0luamVjdGlvblJpZ2h0QXR0cnM8YW55Pikge1xuXHRcdHRoaXMuaW5qZWN0aW9uUmlnaHRBdHRycyA9IGluamVjdGlvblJpZ2h0QXR0cnNcblx0fVxuXG5cdHByaXZhdGUgZGVmYXVsdEZvY3VzT25Mb2FkKGRvbTogSFRNTEVsZW1lbnQpIHtcblx0XHRjb25zdCBpbnB1dHMgPSBBcnJheS5mcm9tKGRvbS5xdWVyeVNlbGVjdG9yQWxsKElOUFVUKSkgYXMgQXJyYXk8SFRNTEVsZW1lbnQ+XG5cdFx0Y29uc3Qgc2Nyb2xsYWJsZVdyYXBwZXIgPSBkb20ucXVlcnlTZWxlY3RvcihcIi5kaWFsb2ctY29udGFpbmVyLnNjcm9sbFwiKSBhcyBIVE1MRWxlbWVudCB8IG51bGxcblxuXHRcdGlmIChpbnB1dHMubGVuZ3RoID4gMCkge1xuXHRcdFx0aW5wdXRzWzBdLmZvY3VzKClcblx0XHR9IGVsc2UgaWYgKCFzY3JvbGxhYmxlV3JhcHBlcikge1xuXHRcdFx0bGV0IGJ1dHRvbiA9IGRvbS5xdWVyeVNlbGVjdG9yKFwiYnV0dG9uXCIpXG5cblx0XHRcdGlmIChidXR0b24pIHtcblx0XHRcdFx0YnV0dG9uLmZvY3VzKClcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0c2Nyb2xsYWJsZVdyYXBwZXIudGFiSW5kZXggPSBOdW1iZXIoVGFiSW5kZXguRGVmYXVsdClcblx0XHRcdHNjcm9sbGFibGVXcmFwcGVyLmZvY3VzKClcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQnkgZGVmYXVsdCB0aGUgZm9jdXMgaXMgc2V0IG9uIHRoZSBmaXJzdCB0ZXh0IGZpZWxkIGFmdGVyIHRoaXMgZGlhbG9nIGlzIGZ1bGx5IHZpc2libGUuIFRoaXMgYmVoYXZpb3IgY2FuIGJlIG92ZXJ3cml0dGVuIGJ5IGNhbGxpbmcgdGhpcyBmdW5jdGlvbi5cblx0ICogSWYgaXQgaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQsIHRoZW4gY2FsbHMgaXQgaW5zdGFudGx5XG5cdCAqL1xuXHRzZXRGb2N1c09uTG9hZEZ1bmN0aW9uKGNhbGxiYWNrOiBEaWFsb2dbXCJmb2N1c09uTG9hZEZ1bmN0aW9uXCJdKTogdm9pZCB7XG5cdFx0dGhpcy5mb2N1c09uTG9hZEZ1bmN0aW9uID0gY2FsbGJhY2tcblxuXHRcdGlmICh0aGlzLndhc0ZvY3VzT25Mb2FkQ2FsbGVkKSB7XG5cdFx0XHR0aGlzLmZvY3VzT25Mb2FkRnVuY3Rpb24oYXNzZXJ0Tm90TnVsbCh0aGlzLmRvbURpYWxvZykpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBnZXREaWFsb2dXcmFwcGVyQ2xhc3NlcyhkaWFsb2dUeXBlOiBEaWFsb2dUeXBlKTogc3RyaW5nIHtcblx0XHQvLyBjaGFuZ2UgZGlyZWN0aW9uIG9mIGF4aXMgdG8gaGFuZGxlIHJlc2l6ZSBvZiBkaWFsb2dzIChpT1Mga2V5Ym9hcmQgb3BlbiBjaGFuZ2VzIHNpemUpXG5cdFx0bGV0IGRpYWxvZ1dyYXBwZXJTdHlsZSA9IFwiLmZpbGwtYWJzb2x1dGUuZmxleC5pdGVtcy1zdHJldGNoLmZsZXgtY29sdW1uXCJcblxuXHRcdGlmIChkaWFsb2dUeXBlID09PSBEaWFsb2dUeXBlLkVkaXRMYXJnZSkge1xuXHRcdFx0ZGlhbG9nV3JhcHBlclN0eWxlICs9IFwiLmZsZXgtc3RhcnRcIlxuXHRcdH0gZWxzZSB7XG5cdFx0XHRkaWFsb2dXcmFwcGVyU3R5bGUgKz0gXCIuZmxleC1jZW50ZXJcIiAvLyB2ZXJ0aWNhbCBhbGlnbm1lbnRcblx0XHR9XG5cblx0XHRyZXR1cm4gZGlhbG9nV3JhcHBlclN0eWxlXG5cdH1cblxuXHRwcml2YXRlIGdldERpYWxvZ1N0eWxlKGRpYWxvZ1R5cGU6IERpYWxvZ1R5cGUpOiBzdHJpbmcge1xuXHRcdGxldCBkaWFsb2dTdHlsZSA9IFwiLmRpYWxvZy5lbGV2YXRlZC1iZy5mbGV4LWdyb3cuYm9yZGVyLXJhZGl1cy10b3BcIlxuXG5cdFx0aWYgKGRpYWxvZ1R5cGUgPT09IERpYWxvZ1R5cGUuUHJvZ3Jlc3MpIHtcblx0XHRcdGRpYWxvZ1N0eWxlICs9IFwiLmRpYWxvZy13aWR0aC1zLmRpYWxvZy1wcm9ncmVzcy5ib3JkZXItcmFkaXVzLWJvdHRvbVwiXG5cdFx0fSBlbHNlIGlmIChkaWFsb2dUeXBlID09PSBEaWFsb2dUeXBlLkFsZXJ0KSB7XG5cdFx0XHRkaWFsb2dTdHlsZSArPSBcIi5kaWFsb2ctd2lkdGgtYWxlcnQucHQuYm9yZGVyLXJhZGl1cy1ib3R0b21cIlxuXHRcdH0gZWxzZSBpZiAoZGlhbG9nVHlwZSA9PT0gRGlhbG9nVHlwZS5SZW1pbmRlcikge1xuXHRcdFx0ZGlhbG9nU3R5bGUgKz0gXCIuZGlhbG9nLXdpZHRoLW0ucHQuZmxleC5mbGV4LWNvbHVtbi5ib3JkZXItcmFkaXVzLWJvdHRvbVwiXG5cdFx0fSBlbHNlIGlmIChkaWFsb2dUeXBlID09PSBEaWFsb2dUeXBlLkVkaXRTbWFsbCkge1xuXHRcdFx0ZGlhbG9nU3R5bGUgKz0gXCIuZGlhbG9nLXdpZHRoLXMuZmxleC5mbGV4LWNvbHVtbi5ib3JkZXItcmFkaXVzLWJvdHRvbVwiXG5cdFx0fSBlbHNlIGlmIChkaWFsb2dUeXBlID09PSBEaWFsb2dUeXBlLkVkaXRNZWRpdW0pIHtcblx0XHRcdGRpYWxvZ1N0eWxlICs9IFwiLmRpYWxvZy13aWR0aC1tLmJvcmRlci1yYWRpdXMtYm90dG9tXCJcblx0XHR9IGVsc2UgaWYgKGRpYWxvZ1R5cGUgPT09IERpYWxvZ1R5cGUuRWRpdExhcmdlIHx8IGRpYWxvZ1R5cGUgPT09IERpYWxvZ1R5cGUuRWRpdExhcmdlcikge1xuXHRcdFx0ZGlhbG9nU3R5bGUgKz0gXCIuZGlhbG9nLXdpZHRoLWxcIlxuXHRcdH1cblxuXHRcdHJldHVybiBkaWFsb2dTdHlsZVxuXHR9XG5cblx0YWRkU2hvcnRjdXQoc2hvcnRjdXQ6IFNob3J0Y3V0KTogRGlhbG9nIHtcblx0XHR0aGlzLl9zaG9ydGN1dHMucHVzaChzaG9ydGN1dClcblxuXHRcdGlmICh0aGlzLnZpc2libGUpIHtcblx0XHRcdGtleU1hbmFnZXIucmVnaXN0ZXJNb2RhbFNob3J0Y3V0cyhbc2hvcnRjdXRdKVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzXG5cdH1cblxuXHQvKipcblx0ICogU2V0cyBhIGNsb3NlIGhhbmRsZXIgdG8gdGhlIGRpYWxvZy4gSWYgc2V0IHRoZSBoYW5kbGVyIHdpbGwgYmUgbm90aWZpZWQgd2hlbiBvbkNsb3NlIGlzIGNhbGxlZCBvbiB0aGUgZGlhbG9nLlxuXHQgKiBUaGUgaGFuZGxlciBtdXN0IGlzIHRoZW4gcmVzcG9uc2libGUgZm9yIGNsb3NpbmcgdGhlIGRpYWxvZy5cblx0ICovXG5cdHNldENsb3NlSGFuZGxlcihjbG9zZUhhbmRsZXI6ICgoKSA9PiB1bmtub3duKSB8IG51bGwpOiBEaWFsb2cge1xuXHRcdHRoaXMuY2xvc2VIYW5kbGVyID0gY2xvc2VIYW5kbGVyXG5cdFx0cmV0dXJuIHRoaXNcblx0fVxuXG5cdHNob3J0Y3V0cygpOiBTaG9ydGN1dFtdIHtcblx0XHRyZXR1cm4gdGhpcy5fc2hvcnRjdXRzXG5cdH1cblxuXHRzaG93KCk6IERpYWxvZyB7XG5cdFx0dGhpcy5mb2N1c2VkQmVmb3JlU2hvd24gPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50XG5cdFx0bW9kYWwuZGlzcGxheSh0aGlzKVxuXHRcdHRoaXMudmlzaWJsZSA9IHRydWVcblx0XHRyZXR1cm4gdGhpc1xuXHR9XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgdGhlIGRpYWxvZyBmcm9tIHRoZSBjdXJyZW50IHZpZXcuXG5cdCAqL1xuXHRjbG9zZSgpOiB2b2lkIHtcblx0XHR0aGlzLnZpc2libGUgPSBmYWxzZVxuXHRcdG1vZGFsLnJlbW92ZSh0aGlzKVxuXHR9XG5cblx0LyoqXG5cdCAqIFNob3VsZCBiZSBjYWxsZWQgdG8gY2xvc2UgYSBkaWFsb2cuIE5vdGlmaWVzIHRoZSBjbG9zZUhhbmRsZXIgYWJvdXQgdGhlIGNsb3NlIGF0dGVtcHQuXG5cdCAqL1xuXHRvbkNsb3NlKCk6IHZvaWQge1xuXHRcdGlmICh0aGlzLmNsb3NlSGFuZGxlcikge1xuXHRcdFx0dGhpcy5jbG9zZUhhbmRsZXIoKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmNsb3NlKClcblx0XHR9XG5cdH1cblxuXHRwb3BTdGF0ZShlOiBFdmVudCk6IGJvb2xlYW4ge1xuXHRcdHRoaXMub25DbG9zZSgpXG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cblxuXHRjYWxsaW5nRWxlbWVudCgpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLmZvY3VzZWRCZWZvcmVTaG93blxuXHR9XG5cblx0LyoqXG5cdCAqIElzIGludm9rZWQgZnJvbSBtb2RhbCBhcyB0aGUgdHdvIGFuaW1hdGlvbnMgKGJhY2tncm91bmQgbGF5ZXIgb3BhY2l0eSBhbmQgZHJvcGRvd24pIHNob3VsZCBydW4gaW4gcGFyYWxsZWxcblx0ICogQHJldHVybnMge1Byb21pc2UuPHZvaWQ+fVxuXHQgKi9cblx0aGlkZUFuaW1hdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRsZXQgYmdjb2xvciA9IGdldEVsZXZhdGVkQmFja2dyb3VuZCgpXG5cblx0XHRpZiAodGhpcy5kb21EaWFsb2cpIHtcblx0XHRcdHJldHVybiBQcm9taXNlLmFsbChbXG5cdFx0XHRcdGFuaW1hdGlvbnMuYWRkKHRoaXMuZG9tRGlhbG9nLmNoaWxkcmVuLCBvcGFjaXR5KDEsIDAsIHRydWUpKSxcblx0XHRcdFx0YW5pbWF0aW9ucy5hZGQodGhpcy5kb21EaWFsb2csIGFscGhhKEFscGhhRW51bS5CYWNrZ3JvdW5kQ29sb3IsIGJnY29sb3IsIDEsIDApLCB7XG5cdFx0XHRcdFx0ZGVsYXk6IERlZmF1bHRBbmltYXRpb25UaW1lIC8gMixcblx0XHRcdFx0XHRlYXNpbmc6IGVhc2UubGluZWFyLFxuXHRcdFx0XHR9KSxcblx0XHRcdF0pLnRoZW4obm9PcClcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG5cdFx0fVxuXHR9XG5cblx0YmFja2dyb3VuZENsaWNrKGU6IE1vdXNlRXZlbnQpIHt9XG5cblx0LyoqXG5cdCAqIHNob3cgYSBkaWFsb2cgd2l0aCBvbmx5IGEgXCJva1wiIGJ1dHRvblxuXHQgKlxuXHQgKiBAcGFyYW0gbWVzc2FnZUlkT3JNZXNzYWdlRnVuY3Rpb24gdGhlIHRleHQgdG8gZGlzcGxheVxuXHQgKiBAcGFyYW0gaW5mb1RvQXBwZW5kIHs/c3RyaW5nIHwgbGF6eTxDaGlsZHJlbj59IHNvbWUgdGV4dCBvciBVSSBlbGVtZW50cyB0byBzaG93IGJlbG93IHRoZSBtZXNzYWdlXG5cdCAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBhIHByb21pc2UgdGhhdCByZXNvbHZlcyBhZnRlciB0aGUgZGlhbG9nIGlzIGZ1bGx5IGNsb3NlZFxuXHQgKi9cblx0c3RhdGljIG1lc3NhZ2UobWVzc2FnZUlkT3JNZXNzYWdlRnVuY3Rpb246IE1heWJlVHJhbnNsYXRpb24sIGluZm9Ub0FwcGVuZD86IHN0cmluZyB8IGxhenk8Q2hpbGRyZW4+KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRsZXQgZGlhbG9nOiBEaWFsb2dcblxuXHRcdFx0Y29uc3QgY2xvc2VBY3Rpb24gPSAoKSA9PiB7XG5cdFx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0XHRcdHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZSgpLCBEZWZhdWx0QW5pbWF0aW9uVGltZSlcblx0XHRcdH1cblxuXHRcdFx0bGV0IGxpbmVzID0gbGFuZy5nZXRUcmFuc2xhdGlvblRleHQobWVzc2FnZUlkT3JNZXNzYWdlRnVuY3Rpb24pLnNwbGl0KFwiXFxuXCIpXG5cdFx0XHRsZXQgdGVzdElkID0gYGRpYWxvZzoke2xhbmcuZ2V0VGVzdElkKG1lc3NhZ2VJZE9yTWVzc2FnZUZ1bmN0aW9uKX1gXG5cblx0XHRcdGlmICh0eXBlb2YgaW5mb1RvQXBwZW5kID09PSBcInN0cmluZ1wiKSB7XG5cdFx0XHRcdGxpbmVzLnB1c2goaW5mb1RvQXBwZW5kKVxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBidXR0b25BdHRyczogQnV0dG9uQXR0cnMgPSB7XG5cdFx0XHRcdGxhYmVsOiBcIm9rX2FjdGlvblwiLFxuXHRcdFx0XHRjbGljazogY2xvc2VBY3Rpb24sXG5cdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHRcdH1cblx0XHRcdGRpYWxvZyA9IG5ldyBEaWFsb2coRGlhbG9nVHlwZS5BbGVydCwge1xuXHRcdFx0XHR2aWV3OiAoKSA9PiBbXG5cdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFwiLmRpYWxvZy1tYXgtaGVpZ2h0LmRpYWxvZy1jb250ZW50QnV0dG9uc0JvdHRvbS50ZXh0LWJyZWFrLnRleHQtcHJld3JhcC5zZWxlY3RhYmxlLnNjcm9sbFwiLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcImRhdGEtdGVzdGlkXCI6IHRlc3RJZCxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRbbGluZXMubWFwKChsaW5lKSA9PiBtKFwiLnRleHQtYnJlYWsuc2VsZWN0YWJsZVwiLCBsaW5lKSksIHR5cGVvZiBpbmZvVG9BcHBlbmQgPT0gXCJmdW5jdGlvblwiID8gaW5mb1RvQXBwZW5kKCkgOiBudWxsXSxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdG0oXCIuZmxleC1jZW50ZXIuZGlhbG9nLWJ1dHRvbnNcIiwgbShCdXR0b24sIGJ1dHRvbkF0dHJzKSksXG5cdFx0XHRcdF0sXG5cdFx0XHR9KVxuXHRcdFx0XHQuc2V0Q2xvc2VIYW5kbGVyKGNsb3NlQWN0aW9uKVxuXHRcdFx0XHQuYWRkU2hvcnRjdXQoe1xuXHRcdFx0XHRcdGtleTogS2V5cy5SRVRVUk4sXG5cdFx0XHRcdFx0c2hpZnQ6IGZhbHNlLFxuXHRcdFx0XHRcdGV4ZWM6IGNsb3NlQWN0aW9uLFxuXHRcdFx0XHRcdGhlbHA6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5hZGRTaG9ydGN1dCh7XG5cdFx0XHRcdFx0a2V5OiBLZXlzLkVTQyxcblx0XHRcdFx0XHRzaGlmdDogZmFsc2UsXG5cdFx0XHRcdFx0ZXhlYzogY2xvc2VBY3Rpb24sXG5cdFx0XHRcdFx0aGVscDogXCJjbG9zZV9hbHRcIixcblx0XHRcdFx0fSlcblx0XHRcdFx0LnNob3coKVxuXHRcdH0pXG5cdH1cblxuXHQvKipcblx0ICogZmFsbGJhY2sgZm9yIGNhc2VzIHdoZXJlIHdlIGNhbid0IGRpcmVjdGx5IGRvd25sb2FkIGFuZCBvcGVuIGEgZmlsZVxuXHQgKi9cblx0c3RhdGljIGxlZ2FjeURvd25sb2FkKGZpbGVuYW1lOiBzdHJpbmcsIHVybDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRsZXQgZGlhbG9nOiBEaWFsb2dcblxuXHRcdFx0Y29uc3QgY2xvc2VBY3Rpb24gPSAoKSA9PiB7XG5cdFx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0XHRcdHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZSgpLCBEZWZhdWx0QW5pbWF0aW9uVGltZSlcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgY2xvc2VCdXR0b25BdHRyczogQnV0dG9uQXR0cnMgPSB7XG5cdFx0XHRcdGxhYmVsOiBcImNsb3NlX2FsdFwiLFxuXHRcdFx0XHRjbGljazogY2xvc2VBY3Rpb24sXG5cdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHRcdH1cblx0XHRcdGNvbnN0IGRvd25sb2FkQnV0dG9uQXR0cnM6IEJ1dHRvbkF0dHJzID0ge1xuXHRcdFx0XHRsYWJlbDogXCJkb3dubG9hZF9hY3Rpb25cIixcblx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBwb3B1cCA9IG9wZW4oXCJcIiwgXCJfYmxhbmtcIilcblx0XHRcdFx0XHRpZiAocG9wdXApIHtcblx0XHRcdFx0XHRcdHBvcHVwLmxvY2F0aW9uID0gdXJsXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0XHRcdFx0cmVzb2x2ZSgpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuUHJpbWFyeSxcblx0XHRcdH1cblx0XHRcdGRpYWxvZyA9IG5ldyBEaWFsb2coRGlhbG9nVHlwZS5BbGVydCwge1xuXHRcdFx0XHR2aWV3OiAoKSA9PlxuXHRcdFx0XHRcdG0oXCJcIiwgW1xuXHRcdFx0XHRcdFx0bShcIi5kaWFsb2ctY29udGVudEJ1dHRvbnNCb3R0b20udGV4dC1icmVha1wiLCBbbShCdXR0b24sIGRvd25sb2FkQnV0dG9uQXR0cnMpLCBtKFwiLnB0XCIsIGxhbmcuZ2V0KFwic2F2ZURvd25sb2FkTm90UG9zc2libGVJb3NfbXNnXCIpKV0pLFxuXHRcdFx0XHRcdFx0bShcIi5mbGV4LWNlbnRlci5kaWFsb2ctYnV0dG9uc1wiLCBtKEJ1dHRvbiwgY2xvc2VCdXR0b25BdHRycykpLFxuXHRcdFx0XHRcdF0pLFxuXHRcdFx0fSlcblx0XHRcdFx0LnNldENsb3NlSGFuZGxlcihjbG9zZUFjdGlvbilcblx0XHRcdFx0LnNob3coKVxuXHRcdH0pXG5cdH1cblxuXHQvKipcblx0ICogU2ltcGxlciB2ZXJzaW9uIG9mIHtAbGluayBEaWFsb2cjY29uZmlybU11bHRpcGxlfSB3aXRoIGp1c3QgdHdvIG9wdGlvbnM6IG5vIGFuZCB5ZXMgKG9yIGFub3RoZXIgY29uZmlybWF0aW9uKS5cblx0ICogQHJldHVybiBQcm9taXNlLCB3aGljaCBpcyByZXNvbHZlZCB3aXRoIHVzZXIgc2VsZWN0aW9uIC0gdHJ1ZSBmb3IgY29uZmlybSwgZmFsc2UgZm9yIGNhbmNlbC5cblx0ICovXG5cdHN0YXRpYyBjb25maXJtKFxuXHRcdG1lc3NhZ2VJZE9yTWVzc2FnZUZ1bmN0aW9uOiBNYXliZVRyYW5zbGF0aW9uLFxuXHRcdGNvbmZpcm1JZDogVHJhbnNsYXRpb25LZXkgPSBcIm9rX2FjdGlvblwiLFxuXHRcdGluZm9Ub0FwcGVuZD86IHN0cmluZyB8IGxhenk8Q2hpbGRyZW4+LFxuXHQpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdGNvbnN0IGNsb3NlQWN0aW9uID0gKGNvbmY6IGJvb2xlYW4pID0+IHtcblx0XHRcdFx0ZGlhbG9nLmNsb3NlKClcblx0XHRcdFx0c2V0VGltZW91dCgoKSA9PiByZXNvbHZlKGNvbmYpLCBEZWZhdWx0QW5pbWF0aW9uVGltZSlcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgYnV0dG9uQXR0cnM6IEFycmF5PEJ1dHRvbkF0dHJzPiA9IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxhYmVsOiBcImNhbmNlbF9hY3Rpb25cIixcblx0XHRcdFx0XHRjbGljazogKCkgPT4gY2xvc2VBY3Rpb24oZmFsc2UpLFxuXHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGFiZWw6IGNvbmZpcm1JZCxcblx0XHRcdFx0XHRjbGljazogKCkgPT4gY2xvc2VBY3Rpb24odHJ1ZSksXG5cdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5QcmltYXJ5LFxuXHRcdFx0XHR9LFxuXHRcdFx0XVxuXHRcdFx0Y29uc3QgZGlhbG9nID0gRGlhbG9nLmNvbmZpcm1NdWx0aXBsZShtZXNzYWdlSWRPck1lc3NhZ2VGdW5jdGlvbiwgYnV0dG9uQXR0cnMsIHJlc29sdmUsIGluZm9Ub0FwcGVuZClcblx0XHR9KVxuXHR9XG5cblx0LyoqXG5cdCAqIFNob3cgYSBkaWFsb2cgd2l0aCBtdWx0aXBsZSBzZWxlY3Rpb24gb3B0aW9ucyBiZWxvdyB0aGUgbWVzc2FnZS5cblx0ICogQHBhcmFtIG1lc3NhZ2VJZE9yTWVzc2FnZUZ1bmN0aW9uIHdoaWNoIGRpc3BsYXllZCBpbiB0aGUgYm9keVxuXHQgKiBAcGFyYW0gYnV0dG9ucyB3aGljaCBhcmUgZGlzcGxheWVkIGJlbG93XG5cdCAqIEBwYXJhbSBvbmNsb3NlIHdoaWNoIGlzIGNhbGxlZCBvbiBzaG9ydGN1dCBvciB3aGVuIGRpYWxvZyBpcyBjbG9zZWQgYW55IG90aGVyIHdheSAoZS5nLiBiYWNrIG5hdmlnYXRpb24pLiBOb3QgY2FsbGVkIHdoZW4gcHJlc3Npbmdcblx0ICogb25lIG9mIHRoZSBidXR0b25zLlxuXHQgKiBAcGFyYW0gaW5mb1RvQXBwZW5kIGFkZGl0aW9uYWwgVUkgZWxlbWVudHMgdG8gc2hvdyBiZWxvdyB0aGUgbWVzc2FnZVxuXHQgKi9cblx0c3RhdGljIGNvbmZpcm1NdWx0aXBsZShcblx0XHRtZXNzYWdlSWRPck1lc3NhZ2VGdW5jdGlvbjogTWF5YmVUcmFuc2xhdGlvbixcblx0XHRidXR0b25zOiBSZWFkb25seUFycmF5PEJ1dHRvbkF0dHJzPixcblx0XHRvbmNsb3NlPzogKHBvc2l0aXZlOiBib29sZWFuKSA9PiB1bmtub3duLFxuXHRcdGluZm9Ub0FwcGVuZD86IHN0cmluZyB8IGxhenk8Q2hpbGRyZW4+LFxuXHQpOiBEaWFsb2cge1xuXHRcdGxldCBkaWFsb2c6IERpYWxvZ1xuXG5cdFx0Y29uc3QgY2xvc2VBY3Rpb24gPSAocG9zaXRpdmU6IGJvb2xlYW4pID0+IHtcblx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0XHRzZXRUaW1lb3V0KCgpID0+IG9uY2xvc2UgJiYgb25jbG9zZShwb3NpdGl2ZSksIERlZmF1bHRBbmltYXRpb25UaW1lKVxuXHRcdH1cblxuXHRcdC8vIFdyYXAgaW4gYSBmdW5jdGlvbiB0byBlbnN1cmUgdGhhdCBtKCkgaXMgY2FsbGVkIGluIGV2ZXJ5IHZpZXcoKSB1cGRhdGUgZm9yIHRoZSBpbmZvVG9BcHBlbmRcblx0XHRmdW5jdGlvbiBnZXRDb250ZW50KCk6IENoaWxkcmVuIHtcblx0XHRcdGNvbnN0IGFkZGl0aW9uYWxDaGlsZCA9XG5cdFx0XHRcdHR5cGVvZiBpbmZvVG9BcHBlbmQgPT09IFwic3RyaW5nXCJcblx0XHRcdFx0XHQ/IG0oXCIuZGlhbG9nLWNvbnRlbnRCdXR0b25zQm90dG9tLnRleHQtYnJlYWsuc2VsZWN0YWJsZVwiLCBpbmZvVG9BcHBlbmQpXG5cdFx0XHRcdFx0OiB0eXBlb2YgaW5mb1RvQXBwZW5kID09PSBcImZ1bmN0aW9uXCJcblx0XHRcdFx0XHQ/IGluZm9Ub0FwcGVuZCgpXG5cdFx0XHRcdFx0OiBudWxsXG5cblx0XHRcdHJldHVybiBbbGFuZy5nZXRUcmFuc2xhdGlvblRleHQobWVzc2FnZUlkT3JNZXNzYWdlRnVuY3Rpb24pLCBhZGRpdGlvbmFsQ2hpbGRdXG5cdFx0fVxuXG5cdFx0ZGlhbG9nID0gbmV3IERpYWxvZyhEaWFsb2dUeXBlLkFsZXJ0LCB7XG5cdFx0XHR2aWV3OiAoKSA9PiBbXG5cdFx0XHRcdG0oXCIjZGlhbG9nLW1lc3NhZ2UuZGlhbG9nLW1heC1oZWlnaHQuZGlhbG9nLWNvbnRlbnRCdXR0b25zQm90dG9tLnRleHQtYnJlYWsudGV4dC1wcmV3cmFwLnNlbGVjdGFibGUuc2Nyb2xsXCIsIGdldENvbnRlbnQoKSksXG5cdFx0XHRcdGJ1dHRvbnMubGVuZ3RoID09PSAwXG5cdFx0XHRcdFx0PyBudWxsXG5cdFx0XHRcdFx0OiBtKFxuXHRcdFx0XHRcdFx0XHRcIi5mbGV4LWNlbnRlci5kaWFsb2ctYnV0dG9uc1wiLFxuXHRcdFx0XHRcdFx0XHRidXR0b25zLm1hcCgoYSkgPT4gbShCdXR0b24sIGEpKSxcblx0XHRcdFx0XHQgICksXG5cdFx0XHRdLFxuXHRcdH0pXG5cdFx0XHQuc2V0Q2xvc2VIYW5kbGVyKCgpID0+IGNsb3NlQWN0aW9uKGZhbHNlKSlcblx0XHRcdC5hZGRTaG9ydGN1dCh7XG5cdFx0XHRcdGtleTogS2V5cy5FU0MsXG5cdFx0XHRcdHNoaWZ0OiBmYWxzZSxcblx0XHRcdFx0ZXhlYzogKCkgPT4gY2xvc2VBY3Rpb24oZmFsc2UpLFxuXHRcdFx0XHRoZWxwOiBcImNhbmNlbF9hY3Rpb25cIixcblx0XHRcdH0pXG5cdFx0ZGlhbG9nLnNob3coKVxuXHRcdHJldHVybiBkaWFsb2dcblx0fVxuXG5cdC8qKiBzaG93IGEgZGlhbG9nIHdpdGggc2V2ZXJhbCBidXR0b25zIG9uIHRoZSBib3R0b20gYW5kIHJldHVybiB0aGUgb3B0aW9uIHRoYXQgd2FzIHNlbGVjdGVkLlxuXHQgKlxuXHQgKiBuZXZlciByZXNvbHZlcyBpZiB0aGUgdXNlciBlc2NhcGVzIG91dCBvZiB0aGUgZGlhbG9nIHdpdGhvdXQgc2VsZWN0aW5nIGFuIG9wdGlvbi5cblx0ICogKi9cblx0c3RhdGljIGNob2ljZTxUPihcblx0XHRtZXNzYWdlOiBNYXliZVRyYW5zbGF0aW9uLFxuXHRcdGNob2ljZXM6IEFycmF5PHtcblx0XHRcdHRleHQ6IE1heWJlVHJhbnNsYXRpb25cblx0XHRcdHZhbHVlOiBUXG5cdFx0fT4sXG5cdCk6IFByb21pc2U8VD4ge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0Y29uc3QgY2hvb3NlID0gKGNob2ljZTogVCkgPT4ge1xuXHRcdFx0XHRkaWFsb2cuY2xvc2UoKVxuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoY2hvaWNlKSwgRGVmYXVsdEFuaW1hdGlvblRpbWUpXG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGJ1dHRvbkF0dHJzID0gY2hvaWNlcy5tYXAoKGNob2ljZSkgPT4ge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGxhYmVsOiBjaG9pY2UudGV4dCxcblx0XHRcdFx0XHRjbGljazogKCkgPT4gY2hvb3NlKGNob2ljZS52YWx1ZSksXG5cdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHRjb25zdCBkaWFsb2cgPSBEaWFsb2cuY29uZmlybU11bHRpcGxlKG1lc3NhZ2UsIGJ1dHRvbkF0dHJzKVxuXHRcdH0pXG5cdH1cblxuXHQvKipcblx0ICogU2hvd3MgYSAobm90LWNhbmNlbGxhYmxlKSBtdWx0aXBsZS1jaG9pY2UgZGlhbG9nLlxuXHQgKiBAcmV0dXJucyB0aGUgc2VsZWN0ZWQgb3B0aW9uLlxuXHQgKi9cblx0c3RhdGljIGNob2ljZVZlcnRpY2FsPFQ+KFxuXHRcdG1lc3NhZ2U6IE1heWJlVHJhbnNsYXRpb24sXG5cdFx0Y2hvaWNlczogQXJyYXk8e1xuXHRcdFx0dGV4dDogTWF5YmVUcmFuc2xhdGlvblxuXHRcdFx0dmFsdWU6IFRcblx0XHRcdHR5cGU/OiBcInByaW1hcnlcIiB8IFwic2Vjb25kYXJ5XCJcblx0XHR9Pixcblx0KTogUHJvbWlzZTxUPiB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRjb25zdCBjaG9vc2UgPSAoY2hvaWNlOiBUKSA9PiB7XG5cdFx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0XHRcdHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZShjaG9pY2UpLCBEZWZhdWx0QW5pbWF0aW9uVGltZSlcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgYnV0dG9uQXR0cnMgPSBjaG9pY2VzLm1hcCgoY2hvaWNlKSA9PiB7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0bGFiZWw6IGNob2ljZS50ZXh0LFxuXHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBjaG9vc2UoY2hvaWNlLnZhbHVlKSxcblx0XHRcdFx0XHR0eXBlOiBjaG9pY2UudHlwZSA9PT0gXCJwcmltYXJ5XCIgPyBCdXR0b25UeXBlLlByaW1hcnkgOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHRcdFx0fVxuXHRcdFx0fSlcblxuXHRcdFx0Ly8gV3JhcCBpbiBhIGZ1bmN0aW9uIHRvIGVuc3VyZSB0aGF0IG0oKSBpcyBjYWxsZWQgaW4gZXZlcnkgdmlldygpIHVwZGF0ZSBmb3IgdGhlIGluZm9Ub0FwcGVuZFxuXHRcdFx0ZnVuY3Rpb24gZ2V0Q29udGVudCgpOiBDaGlsZHJlbiB7XG5cdFx0XHRcdHJldHVybiBsYW5nLmdldFRyYW5zbGF0aW9uVGV4dChtZXNzYWdlKVxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBkaWFsb2cgPSBuZXcgRGlhbG9nKERpYWxvZ1R5cGUuQWxlcnQsIHtcblx0XHRcdFx0dmlldzogKCkgPT5cblx0XHRcdFx0XHRtKFwiLmZsZXguZmxleC1jb2x1bW4ucGwtbC5wci1sLnBiLXNcIiwgW1xuXHRcdFx0XHRcdFx0bShcIiNkaWFsb2ctbWVzc2FnZS5kaWFsb2ctbWF4LWhlaWdodC50ZXh0LWJyZWFrLnRleHQtcHJld3JhcC5zZWxlY3RhYmxlLnNjcm9sbFwiLCBnZXRDb250ZW50KCkpLFxuXHRcdFx0XHRcdFx0YnV0dG9uQXR0cnMubGVuZ3RoID09PSAwXG5cdFx0XHRcdFx0XHRcdD8gbnVsbFxuXHRcdFx0XHRcdFx0XHQ6IG0oXG5cdFx0XHRcdFx0XHRcdFx0XHRcIi5mbGV4LmZsZXgtY29sdW1uXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRidXR0b25BdHRycy5tYXAoKGEpID0+IG0oQnV0dG9uLCBhKSksXG5cdFx0XHRcdFx0XHRcdCAgKSxcblx0XHRcdFx0XHRdKSxcblx0XHRcdH0pXG5cdFx0XHRkaWFsb2cuc2hvdygpXG5cdFx0fSlcblx0fVxuXG5cdC8qKlxuXHQgKiBzaG93IGEgZGlhbG9nIChyZXNwLiBtb25vbG9ndWUpIHdpdGggbm8gYnV0dG9ucyB0aGF0IGNhbiBub3QgYmUgY2xvc2VkLCBub3QgZXZlbiB3aXRoIEVTQy5cblx0ICovXG5cdHN0YXRpYyBkZWFkRW5kKG1lc3NhZ2U6IE1heWJlVHJhbnNsYXRpb24pIHtcblx0XHRjb25zdCBkaWFsb2cgPSBEaWFsb2cuY29uZmlybU11bHRpcGxlKG1lc3NhZ2UsIFtdKVxuXHRcdGRpYWxvZy5hZGRTaG9ydGN1dCh7XG5cdFx0XHRrZXk6IEtleXMuRVNDLFxuXHRcdFx0c2hpZnQ6IGZhbHNlLFxuXHRcdFx0ZXhlYzogbm9PcCxcblx0XHRcdGhlbHA6IFwiZW1wdHlTdHJpbmdfbXNnXCIsXG5cdFx0fSlcblx0XHRkaWFsb2cuYWRkU2hvcnRjdXQoe1xuXHRcdFx0a2V5OiBLZXlzLkYxLFxuXHRcdFx0c2hpZnQ6IGZhbHNlLFxuXHRcdFx0ZXhlYzogbm9PcCxcblx0XHRcdGhlbHA6IFwiZW1wdHlTdHJpbmdfbXNnXCIsXG5cdFx0fSlcblx0fVxuXG5cdC8vIHVzZWQgaW4gYWRtaW4gY2xpZW50XG5cdHN0YXRpYyBzYXZlKHRpdGxlOiBsYXp5PHN0cmluZz4sIHNhdmVBY3Rpb246ICgpID0+IFByb21pc2U8dm9pZD4sIGNoaWxkOiBDb21wb25lbnQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdGxldCBzYXZlRGlhbG9nOiBEaWFsb2dcblxuXHRcdFx0Y29uc3QgY2xvc2VBY3Rpb24gPSAoKSA9PiB7XG5cdFx0XHRcdHNhdmVEaWFsb2cuY2xvc2UoKVxuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoKSwgRGVmYXVsdEFuaW1hdGlvblRpbWUpXG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IG9uT2sgPSAoKSA9PiB7XG5cdFx0XHRcdHNhdmVBY3Rpb24oKS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRzYXZlRGlhbG9nLmNsb3NlKClcblx0XHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoKSwgRGVmYXVsdEFuaW1hdGlvblRpbWUpXG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGFjdGlvbkJhckF0dHJzOiBEaWFsb2dIZWFkZXJCYXJBdHRycyA9IHtcblx0XHRcdFx0bGVmdDogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImNsb3NlX2FsdFwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6IGNsb3NlQWN0aW9uLFxuXHRcdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdFx0cmlnaHQ6IFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsYWJlbDogXCJzYXZlX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6IG9uT2ssXG5cdFx0XHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlByaW1hcnksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdFx0bWlkZGxlOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcInRpdGxlXCIsIHRpdGxlKCkpLFxuXHRcdFx0fVxuXHRcdFx0c2F2ZURpYWxvZyA9IG5ldyBEaWFsb2coRGlhbG9nVHlwZS5FZGl0TWVkaXVtLCB7XG5cdFx0XHRcdHZpZXc6ICgpID0+IG0oXCJcIiwgW20oRGlhbG9nSGVhZGVyQmFyLCBhY3Rpb25CYXJBdHRycyksIG0oXCIucGxyLWwucGIudGV4dC1icmVha1wiLCBtKGNoaWxkKSldKSxcblx0XHRcdH0pXG5cdFx0XHRcdC5zZXRDbG9zZUhhbmRsZXIoY2xvc2VBY3Rpb24pXG5cdFx0XHRcdC5zaG93KClcblx0XHR9KVxuXHR9XG5cblx0c3RhdGljIHJlbWluZGVyKHRpdGxlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0bGV0IGRpYWxvZzogRGlhbG9nXG5cblx0XHRcdGNvbnN0IGNsb3NlQWN0aW9uID0gKHJlczogYm9vbGVhbikgPT4ge1xuXHRcdFx0XHRkaWFsb2cuY2xvc2UoKVxuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUocmVzKSwgRGVmYXVsdEFuaW1hdGlvblRpbWUpXG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGJ1dHRvbkF0dHJzOiBBcnJheTxCdXR0b25BdHRycz4gPSBbXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsYWJlbDogXCJ1cGdyYWRlUmVtaW5kZXJDYW5jZWxfYWN0aW9uXCIsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IGNsb3NlQWN0aW9uKGZhbHNlKSxcblx0XHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxhYmVsOiBcInNob3dNb3JlVXBncmFkZV9hY3Rpb25cIixcblx0XHRcdFx0XHRjbGljazogKCkgPT4gY2xvc2VBY3Rpb24odHJ1ZSksXG5cdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5QcmltYXJ5LFxuXHRcdFx0XHR9LFxuXHRcdFx0XVxuXHRcdFx0ZGlhbG9nID0gbmV3IERpYWxvZyhEaWFsb2dUeXBlLlJlbWluZGVyLCB7XG5cdFx0XHRcdHZpZXc6ICgpID0+IFtcblx0XHRcdFx0XHRtKFwiLmRpYWxvZy1jb250ZW50QnV0dG9uc0JvdHRvbS50ZXh0LWJyZWFrLnNjcm9sbFwiLCBbXG5cdFx0XHRcdFx0XHRtKFwiLmgyLnBiXCIsIHRpdGxlKSxcblx0XHRcdFx0XHRcdG0oXCIuZmxleC1kaXJlY3Rpb24tY2hhbmdlLml0ZW1zLWNlbnRlclwiLCBbXG5cdFx0XHRcdFx0XHRcdG0oXCIjZGlhbG9nLW1lc3NhZ2UucGJcIiwgbWVzc2FnZSksXG5cdFx0XHRcdFx0XHRcdG0oXCJpbWdbc3JjPVwiICsgSGFiUmVtaW5kZXJJbWFnZSArIFwiXS5kaWFsb2ctaW1nLm1iLmJnLXdoaXRlLmJvcmRlci1yYWRpdXNcIiwge1xuXHRcdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcIm1pbi13aWR0aFwiOiBcIjE1MHB4XCIsXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XCIuZmxleC1jZW50ZXIuZGlhbG9nLWJ1dHRvbnMuZmxleC1uby1ncm93LW5vLXNocmluay1hdXRvXCIsXG5cdFx0XHRcdFx0XHRidXR0b25BdHRycy5tYXAoKGEpID0+IG0oQnV0dG9uLCBhKSksXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XSxcblx0XHRcdH0pXG5cdFx0XHRcdC5zZXRDbG9zZUhhbmRsZXIoKCkgPT4gY2xvc2VBY3Rpb24oZmFsc2UpKVxuXHRcdFx0XHQuYWRkU2hvcnRjdXQoe1xuXHRcdFx0XHRcdGtleTogS2V5cy5FU0MsXG5cdFx0XHRcdFx0c2hpZnQ6IGZhbHNlLFxuXHRcdFx0XHRcdGV4ZWM6ICgpID0+IGNsb3NlQWN0aW9uKGZhbHNlKSxcblx0XHRcdFx0XHRoZWxwOiBcImNhbmNlbF9hY3Rpb25cIixcblx0XHRcdFx0fSlcblx0XHRcdFx0LnNob3coKVxuXHRcdH0pXG5cdH1cblxuXHQvKipcblx0ICogU2hvd3MgYSBkaWFsb2cgd2l0aCBhIHRleHQgZmllbGQgaW5wdXQgYW5kIG9rL2NhbmNlbCBidXR0b25zLlxuXHQgKiBAcGFyYW0gICBwcm9wcy5jaGlsZCBlaXRoZXIgYSBjb21wb25lbnQgKG9iamVjdCB3aXRoIHZpZXcgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgQ2hpbGRyZW4pIG9yIGEgbmFrZWQgdmlldyBGdW5jdGlvblxuXHQgKiBAcGFyYW0gICBwcm9wcy52YWxpZGF0b3IgQ2FsbGVkIHdoZW4gXCJPa1wiIGlzIGNsaWNrZWQuIE11c3QgcmV0dXJuIG51bGwgaWYgdGhlIGlucHV0IGlzIHZhbGlkIG9yIGFuIGVycm9yIG1lc3NhZ2VJRCBpZiBpdCBpcyBpbnZhbGlkLCBzbyBhbiBlcnJvciBtZXNzYWdlIGlzIHNob3duLlxuXHQgKiBAcGFyYW0gICBwcm9wcy5va0FjdGlvbiBjYWxsZWQgYWZ0ZXIgc3VjY2Vzc2Z1bCB2YWxpZGF0aW9uLlxuXHQgKiBAcGFyYW0gICBwcm9wcy5jYW5jZWxBY3Rpb24gY2FsbGVkIHdoZW4gYWxsb3dDYW5jZWwgaXMgdHJ1ZSBhbmQgdGhlIGNhbmNlbCBidXR0b24vc2hvcnRjdXQgd2FzIHByZXNzZWQuXG5cdCAqIEByZXR1cm5zIHRoZSBEaWFsb2dcblx0ICovXG5cdHN0YXRpYyBzaG93QWN0aW9uRGlhbG9nKHByb3BzOiBBY3Rpb25EaWFsb2dQcm9wcyk6IERpYWxvZyB7XG5cdFx0bGV0IGRpYWxvZyA9IHRoaXMuY3JlYXRlQWN0aW9uRGlhbG9nKHByb3BzKVxuXHRcdHJldHVybiBkaWFsb2cuc2hvdygpXG5cdH1cblxuXHRzdGF0aWMgY3JlYXRlQWN0aW9uRGlhbG9nKHByb3BzOiBBY3Rpb25EaWFsb2dQcm9wcyk6IERpYWxvZyB7XG5cdFx0bGV0IGRpYWxvZzogRGlhbG9nXG5cdFx0Y29uc3QgeyB0aXRsZSwgY2hpbGQsIG9rQWN0aW9uLCB2YWxpZGF0b3IsIGFsbG93Q2FuY2VsLCBhbGxvd09rV2l0aFJldHVybiwgb2tBY3Rpb25UZXh0SWQsIGNhbmNlbEFjdGlvblRleHRJZCwgY2FuY2VsQWN0aW9uLCB0eXBlIH0gPSBPYmplY3QuYXNzaWduKFxuXHRcdFx0e30sXG5cdFx0XHR7XG5cdFx0XHRcdGFsbG93Q2FuY2VsOiB0cnVlLFxuXHRcdFx0XHRhbGxvd09rV2l0aFJldHVybjogZmFsc2UsXG5cdFx0XHRcdG9rQWN0aW9uVGV4dElkOiBcIm9rX2FjdGlvblwiLFxuXHRcdFx0XHRjYW5jZWxBY3Rpb25UZXh0SWQ6IFwiY2FuY2VsX2FjdGlvblwiLFxuXHRcdFx0XHR0eXBlOiBEaWFsb2dUeXBlLkVkaXRTbWFsbCxcblx0XHRcdFx0ZXJyb3JNZXNzYWdlU3RyZWFtOiBTdHJlYW0oREVGQVVMVF9FUlJPUiksIC8vIE5vIGVycm9yID0gZXJyb3JNZXNzYWdlU3RyZWFtIHZhbHVlIGlzIGFuIGVtcHR5IHN0cmluZyBcIlwiXG5cdFx0XHR9LFxuXHRcdFx0cHJvcHMsXG5cdFx0KVxuXG5cdFx0Y29uc3QgZG9DYW5jZWwgPSAoKSA9PiB7XG5cdFx0XHRpZiAoY2FuY2VsQWN0aW9uKSB7XG5cdFx0XHRcdGNhbmNlbEFjdGlvbihkaWFsb2cpXG5cdFx0XHR9XG5cblx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0fVxuXG5cdFx0Y29uc3QgZG9BY3Rpb24gPSAoKSA9PiB7XG5cdFx0XHRpZiAoIW9rQWN0aW9uKSB7XG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXG5cdFx0XHRsZXQgdmFsaWRhdGlvblJlc3VsdDogJFByb21pc2FibGU8VHJhbnNsYXRpb25LZXkgfCBudWxsPiB8IG51bGwgPSBudWxsXG5cblx0XHRcdGlmICh2YWxpZGF0b3IpIHtcblx0XHRcdFx0dmFsaWRhdGlvblJlc3VsdCA9IHZhbGlkYXRvcigpXG5cdFx0XHR9XG5cblx0XHRcdGxldCBmaW5hbGl6ZXIgPSBQcm9taXNlLnJlc29sdmUodmFsaWRhdGlvblJlc3VsdCkudGhlbigoZXJyb3JfaWQpID0+IHtcblx0XHRcdFx0aWYgKGVycm9yX2lkKSB7XG5cdFx0XHRcdFx0RGlhbG9nLm1lc3NhZ2UoZXJyb3JfaWQpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0b2tBY3Rpb24oZGlhbG9nKVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXG5cdFx0XHRpZiAodmFsaWRhdGlvblJlc3VsdCBpbnN0YW5jZW9mIFByb21pc2UpIHtcblx0XHRcdFx0Ly8gYnJlYWtpbmcgaGFyZCBjaXJjdWxhciBkZXBlbmRlbmN5XG5cdFx0XHRcdGltcG9ydChcIi4uL2RpYWxvZ3MvUHJvZ3Jlc3NEaWFsb2dcIikudGhlbigobW9kdWxlKSA9PiBtb2R1bGUuc2hvd1Byb2dyZXNzRGlhbG9nKFwicGxlYXNlV2FpdF9tc2dcIiwgZmluYWxpemVyKSlcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBhY3Rpb25CYXJBdHRyczogRGlhbG9nSGVhZGVyQmFyQXR0cnMgPSB7XG5cdFx0XHRsZWZ0OiBtYXBMYXppbHkoYWxsb3dDYW5jZWwsIChhbGxvdykgPT5cblx0XHRcdFx0YWxsb3dcblx0XHRcdFx0XHQ/IFtcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBjYW5jZWxBY3Rpb25UZXh0SWQsXG5cdFx0XHRcdFx0XHRcdFx0Y2xpY2s6IGRvQ2FuY2VsLFxuXHRcdFx0XHRcdFx0XHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdCAgXVxuXHRcdFx0XHRcdDogW10sXG5cdFx0XHQpLFxuXHRcdFx0cmlnaHQ6IG9rQWN0aW9uXG5cdFx0XHRcdD8gW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogb2tBY3Rpb25UZXh0SWQsXG5cdFx0XHRcdFx0XHRcdGNsaWNrOiBkb0FjdGlvbixcblx0XHRcdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5QcmltYXJ5LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0ICBdXG5cdFx0XHRcdDogW10sXG5cdFx0XHRtaWRkbGU6IHRpdGxlLFxuXHRcdH1cblx0XHRkaWFsb2cgPSBuZXcgRGlhbG9nKHR5cGUsIHtcblx0XHRcdHZpZXc6ICgpID0+IFtcblx0XHRcdFx0bShEaWFsb2dIZWFkZXJCYXIsIGFjdGlvbkJhckF0dHJzKSxcblx0XHRcdFx0bShcIi5kaWFsb2ctbWF4LWhlaWdodC5wbHItbC5wYi50ZXh0LWJyZWFrLnNjcm9sbFwiLCBbXCJmdW5jdGlvblwiID09PSB0eXBlb2YgY2hpbGQgPyBjaGlsZCgpIDogbShjaGlsZCldKSxcblx0XHRcdF0sXG5cdFx0fSkuc2V0Q2xvc2VIYW5kbGVyKGRvQ2FuY2VsKVxuXHRcdGRpYWxvZy5hZGRTaG9ydGN1dCh7XG5cdFx0XHRrZXk6IEtleXMuRVNDLFxuXHRcdFx0c2hpZnQ6IGZhbHNlLFxuXHRcdFx0ZXhlYzogbWFwTGF6aWx5KGFsbG93Q2FuY2VsLCAoYWxsb3cpID0+IGFsbG93ICYmIGRvQ2FuY2VsKCkpLFxuXHRcdFx0aGVscDogXCJjYW5jZWxfYWN0aW9uXCIsXG5cdFx0XHRlbmFibGVkOiBnZXRBc0xhenkoYWxsb3dDYW5jZWwpLFxuXHRcdH0pXG5cblx0XHRpZiAoYWxsb3dPa1dpdGhSZXR1cm4pIHtcblx0XHRcdGRpYWxvZy5hZGRTaG9ydGN1dCh7XG5cdFx0XHRcdGtleTogS2V5cy5SRVRVUk4sXG5cdFx0XHRcdHNoaWZ0OiBmYWxzZSxcblx0XHRcdFx0ZXhlYzogZG9BY3Rpb24sXG5cdFx0XHRcdGhlbHA6IFwib2tfYWN0aW9uXCIsXG5cdFx0XHR9KVxuXHRcdH1cblx0XHRyZXR1cm4gZGlhbG9nXG5cdH1cblxuXHQvKipcblx0ICogU2hvd3MgYSBkaWFsb2cgd2l0aCBhIHRleHQgZmllbGQgaW5wdXQgYW5kIG9rL2NhbmNlbCBidXR0b25zLlxuXHQgKiBAcmV0dXJucyBBIHByb21pc2UgcmVzb2x2aW5nIHRvIHRoZSBlbnRlcmVkIHRleHQuIFRoZSByZXR1cm5lZCBwcm9taXNlIGlzIG9ubHkgcmVzb2x2ZWQgaWYgXCJva1wiIGlzIGNsaWNrZWQuXG5cdCAqL1xuXHRzdGF0aWMgc2hvd1RleHRJbnB1dERpYWxvZyhwcm9wczogVGV4dElucHV0RGlhbG9nUGFyYW1zKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdERpYWxvZy5zaG93UHJvY2Vzc1RleHRJbnB1dERpYWxvZyhwcm9wcywgYXN5bmMgKHZhbHVlKSA9PiByZXNvbHZlKHZhbHVlKSlcblx0XHR9KVxuXHR9XG5cblx0LyoqXG5cdCAqIFNob3dzIGEgZGlhbG9nIHdpdGggYSB0ZXh0IGZpZWxkIGlucHV0IGFuZCBvay9jYW5jZWwgYnV0dG9ucy4gSW4gY29udHJhc3QgdG8ge0BsaW5rIHNob3dUZXh0SW5wdXREaWFsb2d9IHRoZSBlbnRlcmVkIHRleHQgaXMgbm90IHJldHVybmVkIGJ1dCBwcm9jZXNzZWQgaW4gdGhlIG9rQWN0aW9uLlxuXHQgKi9cblx0c3RhdGljIHNob3dQcm9jZXNzVGV4dElucHV0RGlhbG9nKHByb3BzOiBUZXh0SW5wdXREaWFsb2dQYXJhbXMsIG9rQWN0aW9uOiAoYWN0aW9uOiBzdHJpbmcpID0+IFByb21pc2U8dW5rbm93bj4pIHtcblx0XHRsZXQgdGV4dEZpZWxkVHlwZSA9IHByb3BzLnRleHRGaWVsZFR5cGUgPz8gVGV4dEZpZWxkVHlwZS5UZXh0XG5cblx0XHRsZXQgcmVzdWx0ID0gcHJvcHMuZGVmYXVsdFZhbHVlID8/IFwiXCJcblx0XHREaWFsb2cuc2hvd0FjdGlvbkRpYWxvZyh7XG5cdFx0XHR0aXRsZTogcHJvcHMudGl0bGUsXG5cdFx0XHRjaGlsZDogKCkgPT5cblx0XHRcdFx0bShUZXh0RmllbGQsIHtcblx0XHRcdFx0XHRsYWJlbDogcHJvcHMubGFiZWwsXG5cdFx0XHRcdFx0dmFsdWU6IHJlc3VsdCxcblx0XHRcdFx0XHR0eXBlOiB0ZXh0RmllbGRUeXBlLFxuXHRcdFx0XHRcdG9uaW5wdXQ6IChuZXdWYWx1ZSkgPT4gKHJlc3VsdCA9IG5ld1ZhbHVlKSxcblx0XHRcdFx0XHRoZWxwTGFiZWw6ICgpID0+IChwcm9wcy5pbmZvTXNnSWQgPyBsYW5nLmdldFRyYW5zbGF0aW9uVGV4dChwcm9wcy5pbmZvTXNnSWQpIDogXCJcIiksXG5cdFx0XHRcdH0pLFxuXHRcdFx0dmFsaWRhdG9yOiAoKSA9PiAocHJvcHMuaW5wdXRWYWxpZGF0b3IgPyBwcm9wcy5pbnB1dFZhbGlkYXRvcihyZXN1bHQpIDogbnVsbCksXG5cdFx0XHRhbGxvd09rV2l0aFJldHVybjogdHJ1ZSxcblx0XHRcdG9rQWN0aW9uOiBhc3luYyAoZGlhbG9nOiBEaWFsb2cpID0+IHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRhd2FpdCBva0FjdGlvbihyZXN1bHQpXG5cdFx0XHRcdFx0ZGlhbG9nLmNsb3NlKClcblx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHRpZiAoIWlzT2ZmbGluZUVycm9yKGVycm9yKSkge1xuXHRcdFx0XHRcdFx0ZGlhbG9nLmNsb3NlKClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhyb3cgZXJyb3Jcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHR9KVxuXHR9XG5cblx0LyoqXG5cdCAqIFNob3dzIGEgZGlhbG9nIHdpdGggYSB0ZXh0IGFyZWEgaW5wdXQgYW5kIG9rL2NhbmNlbCBidXR0b25zLlxuXHQgKiBAcGFyYW0gdGl0bGVJZCB0aXRsZSBvZiB0aGUgZGlhbG9nXG5cdCAqIEBwYXJhbSBsYWJlbElkT3JMYWJlbEZ1bmN0aW9uIGxhYmVsIG9mIHRoZSB0ZXh0IGFyZWFcblx0ICogQHBhcmFtIGluZm9Nc2dJZCBoZWxwIGxhYmVsIG9mIHRoZSB0ZXh0IGFyZWFcblx0ICogQHBhcmFtIHZhbHVlIGluaXRpYWwgdmFsdWVcblx0ICogQHJldHVybnMgQSBwcm9taXNlIHJlc29sdmluZyB0byB0aGUgZW50ZXJlZCB0ZXh0LiBUaGUgcmV0dXJuZWQgcHJvbWlzZSBpcyBvbmx5IHJlc29sdmVkIGlmIFwib2tcIiBpcyBjbGlja2VkLlxuXHQgKi9cblx0c3RhdGljIHNob3dUZXh0QXJlYUlucHV0RGlhbG9nKFxuXHRcdHRpdGxlSWQ6IFRyYW5zbGF0aW9uS2V5LFxuXHRcdGxhYmVsSWRPckxhYmVsRnVuY3Rpb246IE1heWJlVHJhbnNsYXRpb24sXG5cdFx0aW5mb01zZ0lkOiBUcmFuc2xhdGlvbktleSB8IG51bGwsXG5cdFx0dmFsdWU6IHN0cmluZyxcblx0KTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdGxldCByZXN1bHQ6IHN0cmluZyA9IHZhbHVlXG5cdFx0XHREaWFsb2cuc2hvd0FjdGlvbkRpYWxvZyh7XG5cdFx0XHRcdHRpdGxlOiB0aXRsZUlkLFxuXHRcdFx0XHRjaGlsZDoge1xuXHRcdFx0XHRcdHZpZXc6ICgpID0+XG5cdFx0XHRcdFx0XHRtKFRleHRGaWVsZCwge1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogbGFiZWxJZE9yTGFiZWxGdW5jdGlvbixcblx0XHRcdFx0XHRcdFx0aGVscExhYmVsOiAoKSA9PiAoaW5mb01zZ0lkID8gbGFuZy5nZXQoaW5mb01zZ0lkKSA6IFwiXCIpLFxuXHRcdFx0XHRcdFx0XHR2YWx1ZTogcmVzdWx0LFxuXHRcdFx0XHRcdFx0XHRvbmlucHV0OiAobmV3VmFsdWUpID0+IChyZXN1bHQgPSBuZXdWYWx1ZSksXG5cdFx0XHRcdFx0XHRcdHR5cGU6IFRleHRGaWVsZFR5cGUuQXJlYSxcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRva0FjdGlvbjogKGRpYWxvZzogRGlhbG9nKSA9PiB7XG5cdFx0XHRcdFx0cmVzb2x2ZShyZXN1bHQpXG5cdFx0XHRcdFx0ZGlhbG9nLmNsb3NlKClcblx0XHRcdFx0fSxcblx0XHRcdH0pXG5cdFx0fSlcblx0fVxuXG5cdC8qKlxuXHQgKiBTaG93IGEgZGlhbG9nIHdpdGggYSBkcm9wZG93biBzZWxlY3RvclxuXHQgKiBAcGFyYW0gdGl0bGVJZCB0aXRsZSBvZiB0aGUgZGlhbG9nXG5cdCAqIEBwYXJhbSBsYWJlbCBsYWJlbCBvZiB0aGUgZHJvcGRvd24gc2VsZWN0b3Jcblx0ICogQHBhcmFtIGluZm9Nc2dJZCBoZWxwIGxhYmVsIG9mIHRoZSBkcm9wZG93biBzZWxlY3RvclxuXHQgKiBAcGFyYW0gaXRlbXMgc2VsZWN0aW9uIHNldFxuXHQgKiBAcGFyYW0gaW5pdGlhbFZhbHVlIGluaXRpYWwgdmFsdWVcblx0ICogQHBhcmFtIGRyb3Bkb3duV2lkdGggd2lkdGggb2YgdGhlIGRyb3Bkb3duXG5cdCAqIEByZXR1cm5zIEEgcHJvbWlzZSByZXNvbHZpbmcgdG8gdGhlIHNlbGVjdGVkIGl0ZW0uIFRoZSByZXR1cm5lZCBwcm9taXNlIGlzIG9ubHkgcmVzb2x2ZWQgaWYgXCJva1wiIGlzIGNsaWNrZWQuXG5cdCAqL1xuXHRzdGF0aWMgc2hvd0Ryb3BEb3duU2VsZWN0aW9uRGlhbG9nPFQ+KFxuXHRcdHRpdGxlSWQ6IFRyYW5zbGF0aW9uS2V5LFxuXHRcdGxhYmVsOiBUcmFuc2xhdGlvbktleSxcblx0XHRpbmZvTXNnSWQ6IFRyYW5zbGF0aW9uS2V5IHwgbnVsbCxcblx0XHRpdGVtczogU2VsZWN0b3JJdGVtTGlzdDxUPixcblx0XHRpbml0aWFsVmFsdWU6IFQsXG5cdFx0ZHJvcGRvd25XaWR0aD86IG51bWJlcixcblx0KTogUHJvbWlzZTxUPiB7XG5cdFx0bGV0IHNlbGVjdGVkVmFsdWU6IFQgPSBpbml0aWFsVmFsdWVcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdERpYWxvZy5zaG93QWN0aW9uRGlhbG9nKHtcblx0XHRcdFx0dGl0bGU6IHRpdGxlSWQsXG5cdFx0XHRcdGNoaWxkOiB7XG5cdFx0XHRcdFx0dmlldzogKCkgPT5cblx0XHRcdFx0XHRcdC8vIGlkZW50aXR5IGFzIHR5cGUgYXNzZXJ0aW9uXG5cdFx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XHREcm9wRG93blNlbGVjdG9yLFxuXHRcdFx0XHRcdFx0XHRpZGVudGl0eTxEcm9wRG93blNlbGVjdG9yQXR0cnM8VD4+KHtcblx0XHRcdFx0XHRcdFx0XHRsYWJlbCxcblx0XHRcdFx0XHRcdFx0XHRpdGVtcyxcblx0XHRcdFx0XHRcdFx0XHRzZWxlY3RlZFZhbHVlOiBzZWxlY3RlZFZhbHVlLFxuXHRcdFx0XHRcdFx0XHRcdHNlbGVjdGlvbkNoYW5nZWRIYW5kbGVyOiAobmV3VmFsdWUpID0+IChzZWxlY3RlZFZhbHVlID0gbmV3VmFsdWUpLFxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9rQWN0aW9uOiAoZGlhbG9nOiBEaWFsb2cpID0+IHtcblx0XHRcdFx0XHRyZXNvbHZlKHNlbGVjdGVkVmFsdWUpXG5cdFx0XHRcdFx0ZGlhbG9nLmNsb3NlKClcblx0XHRcdFx0fSxcblx0XHRcdH0pXG5cdFx0fSlcblx0fVxuXG5cdC8qKiBAZGVwcmVjYXRlZCB1c2UgZWRpdERpYWxvZyovXG5cdHN0YXRpYyBsYXJnZURpYWxvZyhoZWFkZXJCYXJBdHRyczogRGlhbG9nSGVhZGVyQmFyQXR0cnMsIGNoaWxkOiBDb21wb25lbnQpOiBEaWFsb2cge1xuXHRcdHJldHVybiBuZXcgRGlhbG9nKERpYWxvZ1R5cGUuRWRpdExhcmdlLCB7XG5cdFx0XHR2aWV3OiAoKSA9PiB7XG5cdFx0XHRcdHJldHVybiBtKFwiXCIsIFttKERpYWxvZ0hlYWRlckJhciwgaGVhZGVyQmFyQXR0cnMpLCBtKFwiLmRpYWxvZy1jb250YWluZXIuc2Nyb2xsXCIsIG0oXCIuZmlsbC1hYnNvbHV0ZS5wbHItbFwiLCBtKGNoaWxkKSkpXSlcblx0XHRcdH0sXG5cdFx0fSlcblx0fVxuXG5cdHN0YXRpYyBlZGl0RGlhbG9nPFQgZXh0ZW5kcyBvYmplY3Q+KGhlYWRlckJhckF0dHJzOiBEaWFsb2dIZWFkZXJCYXJBdHRycywgY2hpbGQ6IENsYXNzPENvbXBvbmVudDxUPj4sIGNoaWxkQXR0cnM6IFQpOiBEaWFsb2cge1xuXHRcdHJldHVybiBuZXcgRGlhbG9nKERpYWxvZ1R5cGUuRWRpdExhcmdlLCB7XG5cdFx0XHR2aWV3OiAoKSA9PlxuXHRcdFx0XHRtKFwiXCIsIFtcblx0XHRcdFx0XHQvKiogZml4ZWQtaGVpZ2h0IGhlYWRlciB3aXRoIGEgdGl0bGUsIGxlZnQgYW5kIHJpZ2h0IGJ1dHRvbnMgdGhhdCdzIGZpeGVkIHRvIHRoZSB0b3Agb2YgdGhlIGRpYWxvZydzIGFyZWEgKi9cblx0XHRcdFx0XHRoZWFkZXJCYXJBdHRycy5ub0hlYWRlciA/IG51bGwgOiBtKERpYWxvZ0hlYWRlckJhciwgaGVhZGVyQmFyQXR0cnMpLFxuXHRcdFx0XHRcdC8qKiB2YXJpYWJsZS1zaXplIGNoaWxkIGNvbnRhaW5lciB0aGF0IG1heSBiZSBzY3JvbGxhYmxlLiAqL1xuXHRcdFx0XHRcdG0oXCIuZGlhbG9nLWNvbnRhaW5lci5zY3JvbGwuaGlkZS1vdXRsaW5lXCIsIG0oXCIuZmlsbC1hYnNvbHV0ZS5wbHItbFwiLCBtKGNoaWxkLCBjaGlsZEF0dHJzKSkpLFxuXHRcdFx0XHRdKSxcblx0XHR9KVxuXHR9XG5cblx0c3RhdGljIGVkaXRNZWRpdW1EaWFsb2c8VCBleHRlbmRzIG9iamVjdD4oXG5cdFx0aGVhZGVyQmFyQXR0cnM6IERpYWxvZ0hlYWRlckJhckF0dHJzLFxuXHRcdGNoaWxkOiBDbGFzczxDb21wb25lbnQ8VD4+LFxuXHRcdGNoaWxkQXR0cnM6IFQsXG5cdFx0ZGlhbG9nU3R5bGU/OiBQYXJ0aWFsPENTU1N0eWxlRGVjbGFyYXRpb24+IHwgb2JqZWN0LFxuXHQpOiBEaWFsb2cge1xuXHRcdHJldHVybiBuZXcgRGlhbG9nKERpYWxvZ1R5cGUuRWRpdE1lZGl1bSwge1xuXHRcdFx0dmlldzogKCkgPT5cblx0XHRcdFx0bShcIi5mbGV4LmNvbC5ib3JkZXItcmFkaXVzXCIsIHsgc3R5bGU6IGRpYWxvZ1N0eWxlIH0sIFtcblx0XHRcdFx0XHQvKiogZml4ZWQtaGVpZ2h0IGhlYWRlciB3aXRoIGEgdGl0bGUsIGxlZnQgYW5kIHJpZ2h0IGJ1dHRvbnMgdGhhdCdzIGZpeGVkIHRvIHRoZSB0b3Agb2YgdGhlIGRpYWxvZydzIGFyZWEgKi9cblx0XHRcdFx0XHRoZWFkZXJCYXJBdHRycy5ub0hlYWRlciA/IG51bGwgOiBtKERpYWxvZ0hlYWRlckJhciwgaGVhZGVyQmFyQXR0cnMpLFxuXHRcdFx0XHRcdC8qKiB2YXJpYWJsZS1zaXplIGNoaWxkIGNvbnRhaW5lciB0aGF0IG1heSBiZSBzY3JvbGxhYmxlLiAqL1xuXHRcdFx0XHRcdG0oXCIuc2Nyb2xsLmhpZGUtb3V0bGluZS5wbHItbC5mbGV4LWdyb3dcIiwgeyBzdHlsZTogeyBcIm92ZXJmbG93LXhcIjogXCJoaWRkZW5cIiB9IH0sIG0oY2hpbGQsIGNoaWxkQXR0cnMpKSxcblx0XHRcdFx0XSksXG5cdFx0fSlcblx0fVxuXG5cdHN0YXRpYyBlZGl0U21hbGxEaWFsb2c8VCBleHRlbmRzIG9iamVjdD4oaGVhZGVyQmFyQXR0cnM6IERpYWxvZ0hlYWRlckJhckF0dHJzLCBjaGlsZDogKCkgPT4gQ2hpbGRyZW4pOiBEaWFsb2cge1xuXHRcdHJldHVybiBuZXcgRGlhbG9nKERpYWxvZ1R5cGUuRWRpdFNtYWxsLCB7XG5cdFx0XHR2aWV3OiAoKSA9PiBbXG5cdFx0XHRcdC8qKiBmaXhlZC1oZWlnaHQgaGVhZGVyIHdpdGggYSB0aXRsZSwgbGVmdCBhbmQgcmlnaHQgYnV0dG9ucyB0aGF0J3MgZml4ZWQgdG8gdGhlIHRvcCBvZiB0aGUgZGlhbG9nJ3MgYXJlYSAqL1xuXHRcdFx0XHRoZWFkZXJCYXJBdHRycy5ub0hlYWRlciA/IG51bGwgOiBtKERpYWxvZ0hlYWRlckJhciwgaGVhZGVyQmFyQXR0cnMpLFxuXHRcdFx0XHQvKiogdmFyaWFibGUtc2l6ZSBjaGlsZCBjb250YWluZXIgdGhhdCBtYXkgYmUgc2Nyb2xsYWJsZS4gKi9cblx0XHRcdFx0bShcIi5zY3JvbGwuaGlkZS1vdXRsaW5lLnBsci1sXCIsIGNoaWxkKCkpLFxuXHRcdFx0XSxcblx0XHR9KVxuXHR9XG5cblx0c3RhdGljIGFzeW5jIHZpZXdlckRpYWxvZzxUIGV4dGVuZHMgb2JqZWN0Pih0aXRsZTogTWF5YmVUcmFuc2xhdGlvbiwgY2hpbGQ6IENsYXNzPENvbXBvbmVudDxUPj4sIGNoaWxkQXR0cnM6IFQpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdGxldCBkaWFsb2c6IERpYWxvZ1xuXG5cdFx0XHRjb25zdCBjbG9zZSA9ICgpID0+IHtcblx0XHRcdFx0ZGlhbG9nLmNsb3NlKClcblx0XHRcdFx0cmVzb2x2ZSgpXG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGhlYWRlckF0dHJzOiBEaWFsb2dIZWFkZXJCYXJBdHRycyA9IHtcblx0XHRcdFx0bGVmdDogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImNsb3NlX2FsdFwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6IGNsb3NlLFxuXHRcdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XSxcblx0XHRcdFx0bWlkZGxlOiB0aXRsZSxcblx0XHRcdH1cblx0XHRcdGRpYWxvZyA9IERpYWxvZy5lZGl0RGlhbG9nKGhlYWRlckF0dHJzLCBjaGlsZCwgY2hpbGRBdHRycylcblx0XHRcdFx0LnNldENsb3NlSGFuZGxlcihjbG9zZSlcblx0XHRcdFx0LmFkZFNob3J0Y3V0KHtcblx0XHRcdFx0XHRrZXk6IEtleXMuRVNDLFxuXHRcdFx0XHRcdGV4ZWM6IGNsb3NlLFxuXHRcdFx0XHRcdGhlbHA6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5zaG93KClcblx0XHR9KVxuXHR9XG5cblx0c3RhdGljIG9uS2V5Ym9hcmRTaXplQ2hhbmdlZChuZXdTaXplOiBudW1iZXIpOiB2b2lkIHtcblx0XHREaWFsb2cua2V5Ym9hcmRIZWlnaHQgPSBuZXdTaXplXG5cdFx0bS5yZWRyYXcoKVxuXHR9XG59XG5cbmV4cG9ydCB0eXBlIHN0cmluZ1ZhbGlkYXRvciA9IChhcmcwOiBzdHJpbmcpID0+IChUcmFuc2xhdGlvbktleSB8IG51bGwpIHwgUHJvbWlzZTxUcmFuc2xhdGlvbktleSB8IG51bGw+XG53aW5kb3dGYWNhZGUuYWRkS2V5Ym9hcmRTaXplTGlzdGVuZXIoRGlhbG9nLm9uS2V5Ym9hcmRTaXplQ2hhbmdlZClcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFNTyxTQUFTLGNBQWlCQSxTQUFtRTtBQUNuRyxRQUFPLEVBQ04sS0FBS0MsT0FBMkI7QUFDL0IsU0FBTyxRQUFRLE1BQU0sT0FBTyxNQUFNLFNBQVM7Q0FDM0MsRUFDRDtBQUNEOzs7O0lDVVksWUFBTixNQUFxRDtDQUMzRCxLQUFLQyxPQUE4QjtFQUNsQyxNQUFNLFFBQVEsTUFBTTtFQUNwQixNQUFNLFFBQVEsS0FBSyxtQkFBbUIsTUFBTSxNQUFNO0VBQ2xELE1BQU0sT0FBTyxLQUFLLG1CQUFtQixNQUFNLFFBQVEsTUFBTSxNQUFNO0VBQy9ELE1BQU0sUUFBUSxNQUFNLFdBQVcsTUFBTSwwQkFBMEIsTUFBTTtBQUNyRSxTQUFPLGdCQUFFLFlBQVk7R0FDcEIsT0FBTyxNQUFNO0dBQ2IsTUFBTSxnQkFDTCw2QkFDQTtJQUNDLE9BQU8sRUFBRSxNQUFPO0lBRWhCLFlBQVksVUFBVTtHQUN0QixHQUNELEtBQ0E7R0FDRCxNQUFNLE1BQU07R0FDWixVQUFVLE1BQU07R0FDaEIsTUFDQyxNQUFNLFFBQVEsTUFBTSxTQUFTLFNBQzFCLGdCQUFFLE1BQU07SUFDUixNQUFNLE1BQU07SUFDWixXQUFXO0lBQ1gsT0FBTztJQUNQLE9BQU8sRUFBRSxNQUFNLE1BQU87SUFDdEIsTUFBTSxTQUFTO0dBQ2QsRUFBQyxHQUNGLE1BQU0sU0FBUyxTQUNmLGdCQUFFLHdCQUF3QixHQUMxQjtHQUNKLE9BQU8sMERBQTBELE1BQU07R0FDdkUsT0FBTztJQUNOLEdBQUcsTUFBTTtJQUNUO0dBQ0E7R0FDRCxTQUFTLE1BQU07RUFDZixFQUFDO0NBQ0Y7QUFDRDs7OztBQ3ZDRCxrQkFBa0I7Ozs7QUFvQmxCLE1BQU0sZUFBZSxjQUFpQyxDQUFDLEVBQUUsUUFBUSxNQUFNLE1BQU0sS0FBSztBQUNqRixRQUFPLGdCQUFFLDBD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