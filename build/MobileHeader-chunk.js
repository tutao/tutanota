import { __toESM } from "./chunk-chunk.js";
import { assertMainOrNode, isIOSApp } from "./Env-chunk.js";
import { client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { NBSP, assertNotNull, resolveMaybeLazy } from "./dist2-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { AlphaEnum, TransformEnum, alpha, animations, ease, styles, transform } from "./styles-chunk.js";
import { theme } from "./theme-chunk.js";
import { FeatureType, Keys } from "./TutanotaConstants-chunk.js";
import { keyManager } from "./KeyManager-chunk.js";
import { windowFacade } from "./WindowFacade-chunk.js";
import { LayerType } from "./RootView-chunk.js";
import { px, size } from "./size-chunk.js";
import { getSafeAreaInsetLeft } from "./HtmlUtils-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { BaseButton, ButtonColor, ButtonType } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import { DialogHeaderBar } from "./DialogHeaderBar-chunk.js";
import { Dialog, DialogType, createDropdown, pureComponent } from "./Dialog-chunk.js";
import { BootIcons, progressIcon } from "./Icon-chunk.js";
import { AriaLandmarks, landmarkAttrs } from "./AriaUtils-chunk.js";
import { IconButton } from "./IconButton-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { ColumnEmptyMessageBox } from "./ColumnEmptyMessageBox-chunk.js";
import { NavButton, NavButtonColor, isSelectedPrefix } from "./NavButton-chunk.js";
import { CALENDAR_PREFIX, CONTACTLIST_PREFIX, CONTACTS_PREFIX, LogoutUrl, MAIL_PREFIX, SETTINGS_PREFIX } from "./RouteChange-chunk.js";
import { OfflineIndicator, ProgressBar } from "./mailLocator-chunk.js";
import { DesktopBaseHeader } from "./LoginScreenHeader-chunk.js";
import { CounterBadge } from "./CounterBadge-chunk.js";

//#region src/common/gui/base/NavBar.ts
assertMainOrNode();
var NavBar = class {
	view({ children }) {
		return mithril_default("nav.nav-bar.flex-end", landmarkAttrs(AriaLandmarks.Navigation, "top"), children.map((child) => mithril_default(".plr-nav-button", child)));
	}
};

//#endregion
//#region src/common/gui/Header.ts
assertMainOrNode();
var Header = class {
	view({ attrs }) {
		return mithril_default(DesktopBaseHeader, [mithril_default(ProgressBar, { progress: attrs.offlineIndicatorModel.getProgress() }), this.renderNavigation(attrs)]);
	}
	/**
	* render the search and navigation bar in three-column layouts. if there is a navigation, also render an offline indicator.
	* @private
	*/
	renderNavigation(attrs) {
		return mithril_default(".flex-grow.flex.justify-end.items-center", [
			attrs.searchBar ? attrs.searchBar() : null,
			mithril_default(OfflineIndicator, attrs.offlineIndicatorModel.getCurrentAttrs()),
			mithril_default(".nav-bar-spacer"),
			mithril_default(NavBar, this.renderButtons())
		]);
	}
	renderButtons() {
		return [
			mithril_default(NavButton, {
				label: "emails_label",
				icon: () => BootIcons.Mail,
				href: MAIL_PREFIX,
				isSelectedPrefix: MAIL_PREFIX,
				colors: NavButtonColor.Header
			}),
			locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableContacts) ? mithril_default(NavButton, {
				label: "contacts_label",
				icon: () => BootIcons.Contacts,
				href: CONTACTS_PREFIX,
				isSelectedPrefix: isSelectedPrefix(CONTACTS_PREFIX) || isSelectedPrefix(CONTACTLIST_PREFIX),
				colors: NavButtonColor.Header
			}) : null,
			locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.DisableCalendar) ? mithril_default(NavButton, {
				label: "calendar_label",
				icon: () => BootIcons.Calendar,
				href: CALENDAR_PREFIX,
				colors: NavButtonColor.Header,
				click: () => mithril_default.route.get().startsWith(CALENDAR_PREFIX)
			}) : null
		];
	}
};

//#endregion
//#region src/common/gui/base/ViewColumn.ts
assertMainOrNode();
let ColumnType = function(ColumnType$1) {
	ColumnType$1[ColumnType$1["Background"] = 1] = "Background";
	ColumnType$1[ColumnType$1["Foreground"] = 0] = "Foreground";
	return ColumnType$1;
}({});
var ViewColumn = class {
	component;
	columnType;
	minWidth;
	maxWidth;
	headerCenter;
	ariaLabel;
	width;
	offset;
	domColumn = null;
	isInForeground;
	isVisible;
	ariaRole = null;
	/**
	* Create a view column.
	* @param component The component that is rendered as this column
	* @param columnType The type of the view column.
	* @param minWidth The minimum allowed width for the view column.
	* @param headerCenter returned in {@link getTitle}. Used in ARIA landmark unless overriden by {@link ariaLabel}
	* @param ariaLabel used in ARIA landmark
	* @param maxWidth The maximum allowed width for the view column.
	* @param headerCenter The title of the view column.
	* @param ariaLabel The label of the view column to be read by screen readers. Defaults to headerCenter if not specified.
	*/
	constructor(component, columnType, { minWidth, maxWidth, headerCenter, ariaLabel = () => lang.getTranslationText(this.getTitle()) }) {
		this.component = component;
		this.columnType = columnType;
		this.minWidth = minWidth;
		this.maxWidth = maxWidth;
		this.headerCenter = headerCenter || "emptyString_msg";
		this.ariaLabel = ariaLabel ?? null;
		this.width = minWidth;
		this.offset = 0;
		this.isInForeground = false;
		this.isVisible = false;
		this.view = this.view.bind(this);
	}
	view() {
		const zIndex = !this.isVisible && this.columnType === ColumnType.Foreground ? LayerType.ForegroundMenu + 1 : "";
		const landmark = this.ariaRole ? landmarkAttrs(this.ariaRole, this.ariaLabel ? this.ariaLabel() : lang.getTranslationText(this.getTitle())) : {};
		return mithril_default(".view-column.fill-absolute", {
			...landmark,
			"data-testid": lang.getTranslationText(this.getTitle()),
			inert: !this.isVisible && !this.isInForeground,
			oncreate: (vnode) => {
				this.domColumn = vnode.dom;
				this.domColumn.style.transform = this.columnType === ColumnType.Foreground ? "translateX(" + this.getOffsetForeground(this.isInForeground) + "px)" : "";
				if (this.ariaRole === AriaLandmarks.Main) this.focus();
			},
			style: {
				zIndex,
				width: this.width + "px",
				left: this.offset + "px"
			}
		}, mithril_default(this.component));
	}
	getTitle() {
		return resolveMaybeLazy(this.headerCenter);
	}
	getOffsetForeground(foregroundState) {
		if (this.isVisible || foregroundState) return 0;
else return -this.width;
	}
	focus() {
		this.domColumn?.focus();
	}
};

//#endregion
//#region src/common/gui/nav/ViewSlider.ts
assertMainOrNode();
const gestureInfoFromTouch = (touch) => ({
	x: touch.pageX,
	y: touch.pageY,
	time: performance.now(),
	identifier: touch.identifier
});
var ViewSlider = class {
	mainColumn;
	focusedColumn;
	visibleBackgroundColumns;
	domSlidingPart;
	view;
	busy;
	isModalBackgroundVisible;
	resizeListener = () => this.updateVisibleBackgroundColumns();
	handleHistoryEvent = () => {
		const prev = this.getPreviousColumn();
		if (prev != null && prev.columnType !== ColumnType.Foreground) {
			this.focusPreviousColumn();
			return false;
		} else if (this.isForegroundColumnFocused()) {
			this.focusNextColumn();
			return false;
		}
		return true;
	};
	/** Creates the event listeners as soon as this component is loaded (invoked by mithril)*/
	oncreate = () => {
		this.updateVisibleBackgroundColumns();
		windowFacade.addResizeListener(this.resizeListener);
		windowFacade.addHistoryEventListener(this.handleHistoryEvent);
	};
	/** Removes the registered event listeners as soon as this component is unloaded (invoked by mithril)*/
	onremove = () => {
		windowFacade.removeResizeListener(this.resizeListener);
		windowFacade.removeHistoryEventListener(this.handleHistoryEvent);
	};
	getSideColDom = () => this.viewColumns[0].domColumn;
	constructor(viewColumns, enableDrawer = true) {
		this.viewColumns = viewColumns;
		this.enableDrawer = enableDrawer;
		this.mainColumn = assertNotNull(viewColumns.find((column) => column.columnType === ColumnType.Background), "there was no backgroung column passed to viewslider");
		this.focusedColumn = this.mainColumn;
		this.visibleBackgroundColumns = [];
		this.updateVisibleBackgroundColumns();
		this.busy = Promise.resolve();
		this.isModalBackgroundVisible = false;
		for (const column of this.viewColumns) column.ariaRole = this.getColumnRole(column);
		this.view = ({ attrs }) => {
			const mainSliderColumns = this.getColumnsForMainSlider();
			const allBackgroundColumnsAreVisible = this.visibleBackgroundColumns.length === mainSliderColumns.length;
			return mithril_default(".fill-absolute.flex.col", {
				oncreate: (vnode) => {
					if (this.enableDrawer) this.attachTouchHandler(vnode.dom);
				},
				onremove: () => {
					if (this.viewColumns[0].columnType === ColumnType.Foreground && this.viewColumns[0].isInForeground) {
						this.viewColumns[0].isInForeground = false;
						this.isModalBackgroundVisible = false;
					}
				}
			}, [
				styles.isUsingBottomNavigation() ? null : attrs.header,
				mithril_default(".view-columns.flex-grow.rel", {
					oncreate: (vnode) => {
						this.domSlidingPart = vnode.dom;
					},
					style: {
						width: this.getWidth() + "px",
						transform: "translateX(" + this.getOffset(this.visibleBackgroundColumns[0]) + "px)"
					}
				}, mainSliderColumns.map((column, index) => mithril_default(column, { rightBorder: allBackgroundColumnsAreVisible && index !== mainSliderColumns.length - 1 }))),
				styles.isUsingBottomNavigation() && !client.isCalendarApp() ? attrs.bottomNav : null,
				this.getColumnsForOverlay().map((c) => mithril_default(c, {})),
				this.enableDrawer ? this.createModalBackground() : null
			]);
		};
	}
	getColumnRole(column) {
		if (column.columnType === ColumnType.Foreground) return null;
		return this.mainColumn === column ? AriaLandmarks.Main : AriaLandmarks.Region;
	}
	getMainColumn() {
		return this.mainColumn;
	}
	getColumnsForMainSlider() {
		return this.viewColumns.filter((c) => c.columnType === ColumnType.Background || c.isVisible);
	}
	getColumnsForOverlay() {
		return this.viewColumns.filter((c) => c.columnType === ColumnType.Foreground && !c.isVisible);
	}
	createModalBackground() {
		if (this.isModalBackgroundVisible) return [mithril_default(".fill-absolute.will-change-alpha", {
			style: { zIndex: LayerType.ForegroundMenu },
			oncreate: (vnode) => {
				this.busy.then(() => animations.add(vnode.dom, alpha(AlphaEnum.BackgroundColor, theme.modal_bg, 0, .5)));
			},
			onbeforeremove: (vnode) => {
				return this.busy.then(() => animations.add(vnode.dom, alpha(AlphaEnum.BackgroundColor, theme.modal_bg, .5, 0)));
			},
			onclick: () => {
				this.focus(this.visibleBackgroundColumns[0]);
			}
		})];
else return [];
	}
	updateVisibleBackgroundColumns() {
		this.focusedColumn = this.focusedColumn || this.mainColumn;
		let visibleColumns = [this.focusedColumn.columnType === ColumnType.Background ? this.focusedColumn : this.mainColumn];
		let remainingSpace = window.innerWidth - visibleColumns[0].minWidth;
		let nextVisibleColumn = this.getNextVisibleColumn(visibleColumns, this.viewColumns);
		while (nextVisibleColumn && remainingSpace >= nextVisibleColumn.minWidth) {
			visibleColumns.push(nextVisibleColumn);
			remainingSpace -= nextVisibleColumn.minWidth;
			nextVisibleColumn = this.getNextVisibleColumn(visibleColumns, this.viewColumns);
		}
		visibleColumns.sort((a, b) => this.viewColumns.indexOf(a) - this.viewColumns.indexOf(b));
		this.distributeRemainingSpace(visibleColumns, remainingSpace);
		this.setWidthForHiddenColumns(visibleColumns);
		for (const column of this.viewColumns) column.isVisible = visibleColumns.includes(column);
		this.updateOffsets();
		this.visibleBackgroundColumns = visibleColumns;
		if (this.allColumnsVisible()) {
			this.focusedColumn.isInForeground = false;
			this.isModalBackgroundVisible = false;
			if (this.viewColumns[0].domColumn) this.viewColumns[0].domColumn.style.transform = "";
		}
		window.requestAnimationFrame(() => mithril_default.redraw());
	}
	getVisibleBackgroundColumns() {
		return this.visibleBackgroundColumns.slice();
	}
	isUsingOverlayColumns() {
		return this.viewColumns.every((c) => c.columnType !== ColumnType.Foreground || c.isVisible);
	}
	/**
	* Returns the next column which should become visible
	* @param visibleColumns All columns that will definitely be visible
	* @param allColumns All columns*
	*/
	getNextVisibleColumn(visibleColumns, allColumns) {
		let nextColumn = allColumns.find((column) => {
			return column.columnType === ColumnType.Background && visibleColumns.indexOf(column) < 0;
		});
		if (!nextColumn) nextColumn = allColumns.find((column) => {
			return column.columnType === ColumnType.Foreground && visibleColumns.indexOf(column) < 0;
		});
		return nextColumn ?? null;
	}
	getBackgroundColumns() {
		return this.viewColumns.filter((c) => c.columnType === ColumnType.Background);
	}
	/**
	* distributes the remaining space to all visible columns
	* @param visibleColumns
	* @param remainingSpace
	*/
	distributeRemainingSpace(visibleColumns, remainingSpace) {
		let spacePerColumn = remainingSpace / visibleColumns.length;
		for (const [index, visibleColumn] of visibleColumns.entries()) if (visibleColumns.length - 1 === index) visibleColumn.width = visibleColumn.minWidth + remainingSpace;
else {
			let spaceForThisColumn = Math.min(spacePerColumn, visibleColumn.maxWidth - visibleColumn.minWidth);
			remainingSpace -= spaceForThisColumn;
			visibleColumn.width = visibleColumn.minWidth + spaceForThisColumn;
		}
	}
	setWidthForHiddenColumns(visibleColumns) {
		if (this.viewColumns.length === visibleColumns.length) return;
		if (visibleColumns.length === 1) for (const column of this.viewColumns) column.width = visibleColumns[0].width;
		let foreGroundColumn = this.viewColumns.find((column) => column.columnType === ColumnType.Foreground);
		if (foreGroundColumn) {
			let remainingSpace = window.innerWidth - foreGroundColumn.minWidth - size.hpad_large;
			let additionalSpaceForColumn = Math.min(remainingSpace, foreGroundColumn.maxWidth - foreGroundColumn.minWidth);
			foreGroundColumn.width = foreGroundColumn.minWidth + additionalSpaceForColumn;
		}
	}
	async focus(viewColumn) {
		try {
			await this.busy;
			if (this.focusedColumn === viewColumn) return;
			if (this.focusedColumn.isInForeground) {
				this.busy = this.slideForegroundColumn(this.focusedColumn, false);
				await this.busy;
			}
			this.focusedColumn = viewColumn;
			if (viewColumn.columnType === ColumnType.Background && this.visibleBackgroundColumns.length === 1 && this.visibleBackgroundColumns.indexOf(viewColumn) < 0) {
				const currentOffset = this.domSlidingPart.getBoundingClientRect().left;
				this.busy = this.slideBackgroundColumns(viewColumn, currentOffset, this.getOffset(viewColumn));
			} else if (viewColumn.columnType === ColumnType.Foreground && this.visibleBackgroundColumns.indexOf(viewColumn) < 0) this.busy = this.slideForegroundColumn(viewColumn, true);
			await this.busy;
		} finally {
			mithril_default.redraw();
			viewColumn.focus();
		}
	}
	waitForAnimation() {
		return this.busy;
	}
	/**
	* Executes a slide animation for the background buttons.
	*/
	slideBackgroundColumns(nextVisibleViewColumn, oldOffset, newOffset) {
		return animations.add(this.domSlidingPart, transform(TransformEnum.TranslateX, oldOffset, newOffset), { easing: ease.inOut }).finally(() => {
			const [removed] = this.visibleBackgroundColumns.splice(0, 1, nextVisibleViewColumn);
			removed.isVisible = false;
			nextVisibleViewColumn.isVisible = true;
		});
	}
	/**
	* Executes a slide animation for the foreground button.
	*/
	slideForegroundColumn(foregroundColumn, toForeground) {
		if (!foregroundColumn.domColumn) return Promise.resolve();
		foregroundColumn.domColumn.style.visibility = "visible";
		const colRect = foregroundColumn.domColumn.getBoundingClientRect();
		const oldOffset = colRect.left;
		let newOffset = foregroundColumn.getOffsetForeground(toForeground);
		this.isModalBackgroundVisible = toForeground;
		return animations.add(assertNotNull(foregroundColumn.domColumn, "foreground column has no domcolumn"), transform(TransformEnum.TranslateX, oldOffset, newOffset), { easing: ease.in }).finally(() => {
			foregroundColumn.isInForeground = toForeground;
		});
	}
	updateOffsets() {
		let offset = 0;
		for (let column of this.viewColumns) if (column.columnType === ColumnType.Background || column.isVisible) {
			column.offset = offset;
			offset += column.width;
		}
	}
	getWidth() {
		let lastColumn = this.viewColumns[this.viewColumns.length - 1];
		return lastColumn.offset + lastColumn.width;
	}
	getOffset(column) {
		return 0 - column.offset;
	}
	isFocusPreviousPossible() {
		return this.getPreviousColumn() != null;
	}
	focusPreviousColumn() {
		if (this.isFocusPreviousPossible()) {
			window.getSelection()?.empty();
			return this.focus(assertNotNull(this.getPreviousColumn(), "previous column was null!"));
		} else return Promise.resolve();
	}
	focusNextColumn() {
		const indexOfCurrent = this.viewColumns.indexOf(this.focusedColumn);
		if (indexOfCurrent + 1 < this.viewColumns.length) this.focus(this.viewColumns[indexOfCurrent + 1]);
	}
	getPreviousColumn() {
		if (this.viewColumns.indexOf(this.visibleBackgroundColumns[0]) > 0 && !this.focusedColumn.isInForeground) {
			let visibleColumnIndex = this.viewColumns.indexOf(this.visibleBackgroundColumns[0]);
			return this.viewColumns[visibleColumnIndex - 1];
		}
		return null;
	}
	isFirstBackgroundColumnFocused() {
		return this.viewColumns.filter((column) => column.columnType === ColumnType.Background).indexOf(this.focusedColumn) === 0;
	}
	isForegroundColumnFocused() {
		return this.focusedColumn && this.focusedColumn.columnType === ColumnType.Foreground;
	}
	allColumnsVisible() {
		return this.visibleBackgroundColumns.length === this.viewColumns.length;
	}
	attachTouchHandler(element) {
		let lastGestureInfo;
		let oldGestureInfo;
		let initialGestureInfo;
		const VERTICAL = 1;
		const HORIZONTAL = 2;
		let directionLock = 0;
		const gestureEnd = (event) => {
			const safeLastGestureInfo = lastGestureInfo;
			const safeOldGestureInfo = oldGestureInfo;
			if (safeLastGestureInfo && safeOldGestureInfo && !this.allColumnsVisible()) {
				const touch = event.changedTouches[0];
				const mainCol = this.mainColumn.domColumn;
				const sideCol = this.getSideColDom();
				if (!mainCol || !sideCol) return;
				const mainColRect = mainCol.getBoundingClientRect();
				const velocity = (safeLastGestureInfo.x - safeOldGestureInfo.x) / (safeLastGestureInfo.time - safeOldGestureInfo.time);
				const show = () => {
					this.focusedColumn = this.viewColumns[0];
					this.busy = this.slideForegroundColumn(this.viewColumns[0], true);
					this.isModalBackgroundVisible = true;
				};
				const hide = () => {
					this.focusedColumn = this.viewColumns[1];
					this.busy = this.slideForegroundColumn(this.viewColumns[0], false);
					this.isModalBackgroundVisible = false;
				};
				if (this.getBackgroundColumns()[0].isVisible || this.focusedColumn.isInForeground) {
					if (velocity > .8) show();
else if (velocity < -.8 && directionLock !== VERTICAL) hide();
else if (touch.pageX > mainColRect.left + 100) show();
else if (directionLock !== VERTICAL) hide();
				} else if ((safeLastGestureInfo.x > window.innerWidth / 3 || velocity > .8) && directionLock !== VERTICAL) this.focusPreviousColumn();
else {
					const colRect = this.domSlidingPart.getBoundingClientRect();
					this.busy = this.slideBackgroundColumns(this.focusedColumn, colRect.left, -this.focusedColumn.offset);
					this.focus(this.focusedColumn);
				}
				this.busy.then(() => mithril_default.redraw());
			}
			if (safeLastGestureInfo && safeLastGestureInfo.identifier === event.changedTouches[0].identifier) {
				lastGestureInfo = null;
				oldGestureInfo = null;
				initialGestureInfo = null;
				directionLock = 0;
			}
		};
		const listeners = {
			touchstart: (event) => {
				if (lastGestureInfo) return;
				const mainCol = this.mainColumn.domColumn;
				const sideCol = this.getSideColDom();
				if (!mainCol || !sideCol || this.allColumnsVisible()) {
					lastGestureInfo = null;
					return;
				}
				if (event.touches.length === 1 && (this.viewColumns[0].isInForeground || event.touches[0].pageX < 40)) {
					if (!this.viewColumns[0].isInForeground) event.stopPropagation();
					lastGestureInfo = initialGestureInfo = gestureInfoFromTouch(event.touches[0]);
				}
			},
			touchmove: (event) => {
				const sideCol = this.getSideColDom();
				if (!sideCol || !this.mainColumn || this.allColumnsVisible()) return;
				const gestureInfo = lastGestureInfo;
				const safeInitialGestureInfo = initialGestureInfo;
				if (gestureInfo && safeInitialGestureInfo && event.touches.length === 1) {
					const touch = event.touches[0];
					const newTouchPos = touch.pageX;
					const sideColRect = sideCol.getBoundingClientRect();
					oldGestureInfo = lastGestureInfo;
					const safeLastInfo = lastGestureInfo = gestureInfoFromTouch(touch);
					if (directionLock === HORIZONTAL || directionLock !== VERTICAL && Math.abs(safeLastInfo.x - safeInitialGestureInfo.x) > 30) {
						directionLock = HORIZONTAL;
						if (this.getBackgroundColumns()[0].isVisible || this.focusedColumn.isInForeground) {
							const newTranslate = Math.min(sideColRect.left - (gestureInfo.x - newTouchPos), 0);
							sideCol.style.transform = `translateX(${newTranslate}px)`;
						} else {
							const slidingDomRect = this.domSlidingPart.getBoundingClientRect();
							const newTranslate = Math.max(slidingDomRect.left - (gestureInfo.x - newTouchPos), -this.focusedColumn.offset);
							this.domSlidingPart.style.transform = `translateX(${newTranslate}px)`;
						}
						if (event.cancelable !== false) event.preventDefault();
					} else if (directionLock !== VERTICAL && Math.abs(safeLastInfo.y - safeInitialGestureInfo.y) > 30) directionLock = VERTICAL;
					event.stopPropagation();
				}
			},
			touchend: gestureEnd,
			touchcancel: gestureEnd
		};
		for (let [name, listener] of Object.entries(listeners)) element.addEventListener(name, listener, true);
	}
};

//#endregion
//#region src/common/gui/MainCreateButton.ts
var MainCreateButton = class {
	view(vnode) {
		return mithril_default(BaseButton, {
			label: vnode.attrs.label,
			text: lang.get(vnode.attrs.label),
			onclick: vnode.attrs.click,
			class: `full-width border-radius-big center b flash ${vnode.attrs.class}`,
			style: {
				border: `2px solid ${theme.content_accent}`,
				height: px(size.button_height + size.vpad_xs * 2),
				color: theme.content_accent
			}
		});
	}
};

//#endregion
//#region src/common/gui/nav/NavFunctions.ts
function showUpgradeDialog() {
	import("./UpgradeSubscriptionWizard-chunk.js").then((upgradeWizard) => upgradeWizard.showUpgradeWizard(locator.logins));
}
function showSupportDialog(logins) {
	import("./SupportDialog-chunk.js").then((supportModule) => supportModule.showSupportDialog(logins));
}
function isNewMailActionAvailable() {
	return locator.logins.isInternalUserLoggedIn() && !locator.logins.isEnabled(FeatureType.ReplyOnly);
}

//#endregion
//#region src/common/misc/news/NewsList.ts
var NewsList = class {
	view(vnode) {
		if (vnode.attrs.liveNewsIds.length === 0) return mithril_default(ColumnEmptyMessageBox, {
			message: "noNews_msg",
			icon: Icons.Bulb,
			color: theme.content_message_bg
		});
		return mithril_default("", vnode.attrs.liveNewsIds.map((liveNewsId) => {
			const newsListItem = vnode.attrs.liveNewsListItems[liveNewsId.newsItemName];
			return mithril_default(".pt.pl-l.pr-l.flex.fill.border-grey.left.list-border-bottom", { key: liveNewsId.newsItemId }, newsListItem.render(liveNewsId));
		}));
	}
};

//#endregion
//#region src/common/misc/news/NewsDialog.ts
function showNewsDialog(newsModel) {
	const closeButton = {
		label: "close_alt",
		type: ButtonType.Secondary,
		click: () => {
			closeAction();
		}
	};
	const closeAction = () => {
		dialog.close();
	};
	const header = {
		left: [closeButton],
		middle: "news_label"
	};
	let loaded = false;
	newsModel.loadNewsIds().then(() => {
		loaded = true;
		mithril_default.redraw();
	});
	const child = { view: () => {
		return [mithril_default("", [loaded ? mithril_default(NewsList, {
			liveNewsIds: newsModel.liveNewsIds,
			liveNewsListItems: newsModel.liveNewsListItems
		}) : mithril_default(".flex-center.mt-l", mithril_default(".flex-v-center", [mithril_default(".full-width.flex-center", progressIcon()), mithril_default("p", lang.getTranslationText("pleaseWait_msg"))]))])];
	} };
	const dialog = new Dialog(DialogType.EditLarge, { view: () => {
		return mithril_default("", [mithril_default(DialogHeaderBar, header), mithril_default(".dialog-container.scroll", mithril_default(".fill-absolute", mithril_default(child)))]);
	} }).addShortcut({
		key: Keys.ESC,
		exec: () => {
			closeAction();
		},
		help: "close_alt"
	});
	dialog.show();
}

//#endregion
//#region src/common/gui/nav/DrawerMenu.ts
var DrawerMenu = class {
	view(vnode) {
		const { logins, newsModel, desktopSystemFacade } = vnode.attrs;
		const liveNewsCount = newsModel.liveNewsIds.length;
		const isInternalUser = logins.isInternalUserLoggedIn();
		const isLoggedIn = logins.isUserLoggedIn();
		const userController = logins.getUserController();
		return mithril_default("drawer-menu.flex.col.items-center.pt.pb", {
			...landmarkAttrs(AriaLandmarks.Contentinfo, "drawer menu"),
			style: {
				"padding-left": getSafeAreaInsetLeft(),
				"border-top-right-radius": styles.isDesktopLayout() ? px(size.border_radius_larger) : ""
			}
		}, [
			mithril_default(".flex-grow"),
			isInternalUser && isLoggedIn ? mithril_default(".news-button", [mithril_default(IconButton, {
				icon: Icons.Bulb,
				title: "news_label",
				click: () => showNewsDialog(newsModel),
				colors: ButtonColor.DrawerNav
			}), liveNewsCount > 0 ? mithril_default(CounterBadge, {
				count: liveNewsCount,
				position: {
					top: px(0),
					right: px(3)
				},
				color: "white",
				background: theme.list_accent_fg
			}) : null]) : null,
			logins.isGlobalAdminUserLoggedIn() && userController.isPremiumAccount() ? mithril_default(IconButton, {
				icon: Icons.Gift,
				title: "buyGiftCard_label",
				click: () => {
					mithril_default.route.set("/settings/subscription");
					import("./PurchaseGiftCardDialog2-chunk.js").then(({ showPurchaseGiftCardDialog }) => {
						return showPurchaseGiftCardDialog();
					});
				},
				colors: ButtonColor.DrawerNav
			}) : null,
			desktopSystemFacade ? mithril_default(IconButton, {
				icon: Icons.NewWindow,
				title: "openNewWindow_action",
				click: () => {
					desktopSystemFacade.openNewWindow();
				},
				colors: ButtonColor.DrawerNav
			}) : null,
			!isIOSApp() && isLoggedIn && userController.isFreeAccount() ? mithril_default(IconButton, {
				icon: BootIcons.Premium,
				title: "upgradePremium_label",
				click: () => showUpgradeDialog(),
				colors: ButtonColor.DrawerNav
			}) : null,
			mithril_default(IconButton, {
				title: "showHelp_action",
				icon: BootIcons.Help,
				click: (e, dom) => createDropdown({
					width: 300,
					lazyButtons: () => [{
						label: "supportMenu_label",
						click: () => showSupportDialog(logins)
					}, {
						label: "keyboardShortcuts_title",
						click: () => keyManager.openF1Help(true)
					}]
				})(e, dom),
				colors: ButtonColor.DrawerNav
			}),
			isInternalUser ? mithril_default(IconButton, {
				icon: BootIcons.Settings,
				title: "settings_label",
				click: () => mithril_default.route.set(SETTINGS_PREFIX),
				colors: ButtonColor.DrawerNav
			}) : null,
			mithril_default(IconButton, {
				icon: BootIcons.Logout,
				title: "switchAccount_action",
				click: () => mithril_default.route.set(LogoutUrl),
				colors: ButtonColor.DrawerNav
			})
		]);
	}
};

//#endregion
//#region src/common/gui/FolderColumnView.ts
var FolderColumnView = class {
	view({ attrs }) {
		return mithril_default(".flex.height-100p.nav-bg", [mithril_default(DrawerMenu, attrs.drawer), mithril_default(".folder-column.flex-grow.overflow-x-hidden.flex.col", landmarkAttrs(AriaLandmarks.Navigation, lang.getTranslationText(attrs.ariaLabel)), [this.renderMainButton(attrs), mithril_default(".scroll.scrollbar-gutter-stable-or-fallback.visible-scrollbar.overflow-x-hidden.flex.col.flex-grow", { onscroll: (e) => {
			e.redraw = false;
			const target = e.target;
			if (attrs.button == null || target.scrollTop === 0) target.style.borderTop = "";
else target.style.borderTop = `1px solid ${theme.content_border}`;
		} }, attrs.content)])]);
	}
	renderMainButton(attrs) {
		if (attrs.button) return mithril_default(".plr-button-double.scrollbar-gutter-stable-or-fallback.scroll", mithril_default(MainCreateButton, {
			label: attrs.button.label,
			click: attrs.button.click
		}));
else return null;
	}
};

//#endregion
//#region src/common/gui/SidebarSection.ts
var import_stream = __toESM(require_stream(), 1);
var SidebarSection = class {
	expanded = (0, import_stream.default)(true);
	view(vnode) {
		const { name, button, hideIfEmpty } = vnode.attrs;
		const content = vnode.children;
		if (hideIfEmpty && content == false) return null;
		return mithril_default(".sidebar-section", {
			"data-testid": `section:${lang.getTestId(name)}`,
			style: { color: theme.navigation_button }
		}, [mithril_default(".folder-row.flex-space-between.plr-button.pt-s.button-height", [mithril_default("small.b.align-self-center.text-ellipsis.plr-button", lang.getTranslationText(name).toLocaleUpperCase()), button ?? null]), content]);
	}
};

//#endregion
//#region src/common/gui/BackgroundColumnLayout.ts
var BackgroundColumnLayout = class {
	view({ attrs }) {
		return mithril_default(".list-column.flex.col.fill-absolute", {
			style: { backgroundColor: attrs.backgroundColor },
			class: attrs.classes ?? ""
		}, [
			styles.isUsingBottomNavigation() ? attrs.mobileHeader() : attrs.desktopToolbar(),
			mithril_default(".flex-grow.rel", attrs.columnLayout),
			attrs.floatingActionButton?.()
		]);
	}
};

//#endregion
//#region src/common/gui/BaseMobileHeader.ts
const BaseMobileHeader = pureComponent(({ left, center, right, injections }) => {
	return mithril_default(".flex.items-center.rel.button-height.mt-safe-inset.plr-safe-inset", { style: { height: px(size.navbar_height_mobile) } }, [
		left ?? null,
		mithril_default(".flex-grow.flex.items-center.min-width-0", { class: !left ? "ml-hpad_small" : "" }, center ?? null),
		right ?? null,
		injections ?? null
	]);
});

//#endregion
//#region src/common/gui/MobileHeader.ts
var MobileHeader = class {
	view({ attrs }) {
		const firstVisibleColumn = attrs.columnType === "first" || styles.isSingleColumnLayout();
		return mithril_default(BaseMobileHeader, {
			left: this.renderLeftAction(attrs),
			center: firstVisibleColumn ? mithril_default(MobileHeaderTitle, {
				title: attrs.title ? lang.getTranslationText(attrs.title) : undefined,
				bottom: mithril_default(OfflineIndicator, attrs.offlineIndicatorModel.getCurrentAttrs())
			}) : null,
			right: [
				styles.isSingleColumnLayout() ? null : attrs.multicolumnActions?.(),
				attrs.actions,
				styles.isSingleColumnLayout() || attrs.columnType === "other" ? attrs.primaryAction() : null
			],
			injections: firstVisibleColumn ? mithril_default(ProgressBar, { progress: attrs.offlineIndicatorModel.getProgress() }) : null
		});
	}
	renderLeftAction(attrs) {
		if (attrs.columnType === "first" && !attrs.useBackButton) return mithril_default(MobileHeaderMenuButton, {
			newsModel: attrs.newsModel,
			backAction: attrs.backAction
		});
else if (styles.isSingleColumnLayout() || attrs.useBackButton) return mithril_default(MobileHeaderBackButton, { backAction: attrs.backAction });
		return null;
	}
};
const MobileHeaderBackButton = pureComponent(({ backAction }) => {
	return mithril_default(IconButton, {
		title: "back_action",
		icon: BootIcons.Back,
		click: () => {
			backAction();
		}
	});
});
const MobileHeaderTitle = pureComponent(({ title, bottom, onTap }) => {
	return mithril_default(".flex.col.items-start.min-width-0", [mithril_default((onTap ? "button" : "") + ".font-weight-600.text-ellipsis.align-self-stretch", { onclick: (event) => onTap?.(event, event.target) }, title ?? NBSP), bottom]);
});
const MobileHeaderMenuButton = pureComponent(({ newsModel, backAction }) => {
	return mithril_default(".rel", [mithril_default(IconButton, {
		title: "menu_label",
		icon: BootIcons.MoreVertical,
		click: () => {
			backAction();
		}
	}), mithril_default(CounterBadge, {
		count: newsModel.liveNewsIds.length,
		position: {
			top: px(4),
			right: px(5)
		},
		color: "white",
		background: theme.list_accent_fg
	})]);
});

//#endregion
export { BackgroundColumnLayout, BaseMobileHeader, ColumnType, FolderColumnView, Header, MainCreateButton, MobileHeader, MobileHeaderBackButton, MobileHeaderMenuButton, MobileHeaderTitle, SidebarSection, ViewColumn, ViewSlider, isNewMailActionAvailable };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9iaWxlSGVhZGVyLWNodW5rLmpzIiwibmFtZXMiOlsiYXR0cnM6IEhlYWRlckF0dHJzIiwiY29tcG9uZW50OiBDb21wb25lbnQiLCJjb2x1bW5UeXBlOiBDb2x1bW5UeXBlIiwiZm9yZWdyb3VuZFN0YXRlOiBib29sZWFuIiwidG91Y2g6IFRvdWNoIiwidmlld0NvbHVtbnM6IFZpZXdDb2x1bW5bXSIsImVuYWJsZURyYXdlcjogYm9vbGVhbiIsImNvbHVtbjogVmlld0NvbHVtbiIsInZpc2libGVDb2x1bW5zOiBWaWV3Q29sdW1uW10iLCJhbGxDb2x1bW5zOiBWaWV3Q29sdW1uW10iLCJyZW1haW5pbmdTcGFjZTogbnVtYmVyIiwidmlld0NvbHVtbjogVmlld0NvbHVtbiIsIm5leHRWaXNpYmxlVmlld0NvbHVtbjogVmlld0NvbHVtbiIsIm9sZE9mZnNldDogbnVtYmVyIiwibmV3T2Zmc2V0OiBudW1iZXIiLCJmb3JlZ3JvdW5kQ29sdW1uOiBWaWV3Q29sdW1uIiwidG9Gb3JlZ3JvdW5kOiBib29sZWFuIiwiZWxlbWVudDogSFRNTEVsZW1lbnQiLCJsYXN0R2VzdHVyZUluZm86IEdlc3R1cmVJbmZvIHwgbnVsbCIsIm9sZEdlc3R1cmVJbmZvOiBHZXN0dXJlSW5mbyB8IG51bGwiLCJpbml0aWFsR2VzdHVyZUluZm86IEdlc3R1cmVJbmZvIHwgbnVsbCIsImRpcmVjdGlvbkxvY2s6IDAgfCAxIHwgMiIsImV2ZW50OiBhbnkiLCJ2bm9kZTogVm5vZGU8TWFpbkNyZWF0ZUJ1dHRvbkF0dHJzPiIsImxvZ2luczogTG9naW5Db250cm9sbGVyIiwidm5vZGU6IFZub2RlPE5ld3NMaXN0QXR0cnM+IiwibmV3c01vZGVsOiBOZXdzTW9kZWwiLCJjbG9zZUJ1dHRvbjogQnV0dG9uQXR0cnMiLCJoZWFkZXI6IERpYWxvZ0hlYWRlckJhckF0dHJzIiwiY2hpbGQ6IENvbXBvbmVudCIsInZub2RlOiBWbm9kZTxEcmF3ZXJNZW51QXR0cnM+IiwiZTogRXZlbnRSZWRyYXc8RXZlbnQ+IiwiYXR0cnM6IEF0dHJzIiwidm5vZGU6IFZub2RlPFNpZGViYXJTZWN0aW9uQXR0cnM+IiwiYXR0cnM6IE1vYmlsZUhlYWRlckF0dHJzIiwiZXZlbnQ6IE1vdXNlRXZlbnQiXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL2d1aS9iYXNlL05hdkJhci50cyIsIi4uL3NyYy9jb21tb24vZ3VpL0hlYWRlci50cyIsIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvVmlld0NvbHVtbi50cyIsIi4uL3NyYy9jb21tb24vZ3VpL25hdi9WaWV3U2xpZGVyLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvTWFpbkNyZWF0ZUJ1dHRvbi50cyIsIi4uL3NyYy9jb21tb24vZ3VpL25hdi9OYXZGdW5jdGlvbnMudHMiLCIuLi9zcmMvY29tbW9uL21pc2MvbmV3cy9OZXdzTGlzdC50cyIsIi4uL3NyYy9jb21tb24vbWlzYy9uZXdzL05ld3NEaWFsb2cudHMiLCIuLi9zcmMvY29tbW9uL2d1aS9uYXYvRHJhd2VyTWVudS50cyIsIi4uL3NyYy9jb21tb24vZ3VpL0ZvbGRlckNvbHVtblZpZXcudHMiLCIuLi9zcmMvY29tbW9uL2d1aS9TaWRlYmFyU2VjdGlvbi50cyIsIi4uL3NyYy9jb21tb24vZ3VpL0JhY2tncm91bmRDb2x1bW5MYXlvdXQudHMiLCIuLi9zcmMvY29tbW9uL2d1aS9CYXNlTW9iaWxlSGVhZGVyLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvTW9iaWxlSGVhZGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtLCB7IENoaWxkLCBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IEFyaWFMYW5kbWFya3MsIGxhbmRtYXJrQXR0cnMgfSBmcm9tIFwiLi4vQXJpYVV0aWxzXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9FbnZcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcbmV4cG9ydCB0eXBlIEF0dHJzID0gdm9pZFxuXG5leHBvcnQgY2xhc3MgTmF2QmFyIGltcGxlbWVudHMgQ29tcG9uZW50PEF0dHJzPiB7XG5cdHZpZXcoeyBjaGlsZHJlbiB9OiBWbm9kZTxBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIm5hdi5uYXYtYmFyLmZsZXgtZW5kXCIsXG5cdFx0XHRsYW5kbWFya0F0dHJzKEFyaWFMYW5kbWFya3MuTmF2aWdhdGlvbiwgXCJ0b3BcIiksXG5cdFx0XHQoY2hpbGRyZW4gYXMgQXJyYXk8Q2hpbGQ+KS5tYXAoKGNoaWxkKSA9PiBtKFwiLnBsci1uYXYtYnV0dG9uXCIsIGNoaWxkKSksXG5cdFx0KVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ2xhc3NDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgTmF2QmFyIH0gZnJvbSBcIi4vYmFzZS9OYXZCYXIuanNcIlxuaW1wb3J0IHsgaXNTZWxlY3RlZFByZWZpeCwgTmF2QnV0dG9uLCBOYXZCdXR0b25Db2xvciB9IGZyb20gXCIuL2Jhc2UvTmF2QnV0dG9uLmpzXCJcbmltcG9ydCB7IEZlYXR1cmVUeXBlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgQm9vdEljb25zIH0gZnJvbSBcIi4vYmFzZS9pY29ucy9Cb290SWNvbnMuanNcIlxuaW1wb3J0IHsgQ0FMRU5EQVJfUFJFRklYLCBDT05UQUNUTElTVF9QUkVGSVgsIENPTlRBQ1RTX1BSRUZJWCwgTUFJTF9QUkVGSVggfSBmcm9tIFwiLi4vbWlzYy9Sb3V0ZUNoYW5nZS5qc1wiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlIH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRW52LmpzXCJcbmltcG9ydCB7IE9mZmxpbmVJbmRpY2F0b3IgfSBmcm9tIFwiLi9iYXNlL09mZmxpbmVJbmRpY2F0b3IuanNcIlxuaW1wb3J0IHsgT2ZmbGluZUluZGljYXRvclZpZXdNb2RlbCB9IGZyb20gXCIuL2Jhc2UvT2ZmbGluZUluZGljYXRvclZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBOZXdzTW9kZWwgfSBmcm9tIFwiLi4vbWlzYy9uZXdzL05ld3NNb2RlbC5qc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3IuanNcIlxuaW1wb3J0IHsgUHJvZ3Jlc3NCYXIgfSBmcm9tIFwiLi9iYXNlL1Byb2dyZXNzQmFyLmpzXCJcbmltcG9ydCB7IERlc2t0b3BCYXNlSGVhZGVyIH0gZnJvbSBcIi4vYmFzZS9EZXNrdG9wQmFzZUhlYWRlci5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG4vKiogQXR0cnMgdGhhdCBhcmUgdXNlZCBieSBkaWZmZXJlbnQgaGVhZGVyIGNvbXBvbmVudHMgaW4gdGhlIGFwcC4gICovXG5leHBvcnQgaW50ZXJmYWNlIEFwcEhlYWRlckF0dHJzIHtcblx0bmV3c01vZGVsOiBOZXdzTW9kZWxcblx0b2ZmbGluZUluZGljYXRvck1vZGVsOiBPZmZsaW5lSW5kaWNhdG9yVmlld01vZGVsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSGVhZGVyQXR0cnMgZXh0ZW5kcyBBcHBIZWFkZXJBdHRycyB7XG5cdHJpZ2h0Vmlldz86IENoaWxkcmVuXG5cdGhhbmRsZUJhY2tQcmVzcz86ICgpID0+IGJvb2xlYW5cblx0LyoqIHNlYXJjaCBiYXIsIG9ubHkgcmVuZGVyZWQgd2hlbiBOT1QgdXNpbmcgYm90dG9tIG5hdmlnYXRpb24gKi9cblx0c2VhcmNoQmFyPzogKCkgPT4gQ2hpbGRyZW5cblx0LyoqIGNvbnRlbnQgaW4gdGhlIGNlbnRlciBvZiB0aGUgc2VhcmNoIGJhciwgd2hlcmUgdGl0bGUgYW5kIG9mZmxpbmUgc3RhdHVzIG5vcm1hbGx5IGFyZSAqL1xuXHRjZW50ZXJDb250ZW50PzogKCkgPT4gQ2hpbGRyZW5cbn1cblxuZXhwb3J0IGNsYXNzIEhlYWRlciBpbXBsZW1lbnRzIENsYXNzQ29tcG9uZW50PEhlYWRlckF0dHJzPiB7XG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxIZWFkZXJBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oRGVza3RvcEJhc2VIZWFkZXIsIFttKFByb2dyZXNzQmFyLCB7IHByb2dyZXNzOiBhdHRycy5vZmZsaW5lSW5kaWNhdG9yTW9kZWwuZ2V0UHJvZ3Jlc3MoKSB9KSwgdGhpcy5yZW5kZXJOYXZpZ2F0aW9uKGF0dHJzKV0pXG5cdH1cblxuXHQvKipcblx0ICogcmVuZGVyIHRoZSBzZWFyY2ggYW5kIG5hdmlnYXRpb24gYmFyIGluIHRocmVlLWNvbHVtbiBsYXlvdXRzLiBpZiB0aGVyZSBpcyBhIG5hdmlnYXRpb24sIGFsc28gcmVuZGVyIGFuIG9mZmxpbmUgaW5kaWNhdG9yLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJOYXZpZ2F0aW9uKGF0dHJzOiBIZWFkZXJBdHRycyk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcIi5mbGV4LWdyb3cuZmxleC5qdXN0aWZ5LWVuZC5pdGVtcy1jZW50ZXJcIiwgW1xuXHRcdFx0YXR0cnMuc2VhcmNoQmFyID8gYXR0cnMuc2VhcmNoQmFyKCkgOiBudWxsLFxuXHRcdFx0bShPZmZsaW5lSW5kaWNhdG9yLCBhdHRycy5vZmZsaW5lSW5kaWNhdG9yTW9kZWwuZ2V0Q3VycmVudEF0dHJzKCkpLFxuXHRcdFx0bShcIi5uYXYtYmFyLXNwYWNlclwiKSxcblx0XHRcdG0oTmF2QmFyLCB0aGlzLnJlbmRlckJ1dHRvbnMoKSksXG5cdFx0XSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQnV0dG9ucygpOiBDaGlsZHJlbiB7XG5cdFx0Ly8gV2UgYXNzaWduIGNsaWNrIGxpc3RlbmVycyB0byBidXR0b25zIHRvIG1vdmUgZm9jdXMgY29ycmVjdGx5IGlmIHRoZSB2aWV3IGlzIGFscmVhZHkgb3BlblxuXHRcdHJldHVybiBbXG5cdFx0XHRtKE5hdkJ1dHRvbiwge1xuXHRcdFx0XHRsYWJlbDogXCJlbWFpbHNfbGFiZWxcIixcblx0XHRcdFx0aWNvbjogKCkgPT4gQm9vdEljb25zLk1haWwsXG5cdFx0XHRcdGhyZWY6IE1BSUxfUFJFRklYLFxuXHRcdFx0XHRpc1NlbGVjdGVkUHJlZml4OiBNQUlMX1BSRUZJWCxcblx0XHRcdFx0Y29sb3JzOiBOYXZCdXR0b25Db2xvci5IZWFkZXIsXG5cdFx0XHR9KSxcblx0XHRcdC8vIG5vdCBhdmFpbGFibGUgZm9yIGV4dGVybmFsIG1haWxib3hlc1xuXHRcdFx0bG9jYXRvci5sb2dpbnMuaXNJbnRlcm5hbFVzZXJMb2dnZWRJbigpICYmICFsb2NhdG9yLmxvZ2lucy5pc0VuYWJsZWQoRmVhdHVyZVR5cGUuRGlzYWJsZUNvbnRhY3RzKVxuXHRcdFx0XHQ/IG0oTmF2QnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRsYWJlbDogXCJjb250YWN0c19sYWJlbFwiLFxuXHRcdFx0XHRcdFx0aWNvbjogKCkgPT4gQm9vdEljb25zLkNvbnRhY3RzLFxuXHRcdFx0XHRcdFx0aHJlZjogQ09OVEFDVFNfUFJFRklYLFxuXHRcdFx0XHRcdFx0aXNTZWxlY3RlZFByZWZpeDogaXNTZWxlY3RlZFByZWZpeChDT05UQUNUU19QUkVGSVgpIHx8IGlzU2VsZWN0ZWRQcmVmaXgoQ09OVEFDVExJU1RfUFJFRklYKSxcblx0XHRcdFx0XHRcdGNvbG9yczogTmF2QnV0dG9uQ29sb3IuSGVhZGVyLFxuXHRcdFx0XHQgIH0pXG5cdFx0XHRcdDogbnVsbCxcblx0XHRcdC8vIG5vdCBhdmFpbGFibGUgZm9yIGV4dGVybmFsIG1haWxib3hlc1xuXHRcdFx0bG9jYXRvci5sb2dpbnMuaXNJbnRlcm5hbFVzZXJMb2dnZWRJbigpICYmICFsb2NhdG9yLmxvZ2lucy5pc0VuYWJsZWQoRmVhdHVyZVR5cGUuRGlzYWJsZUNhbGVuZGFyKVxuXHRcdFx0XHQ/IG0oTmF2QnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRsYWJlbDogXCJjYWxlbmRhcl9sYWJlbFwiLFxuXHRcdFx0XHRcdFx0aWNvbjogKCkgPT4gQm9vdEljb25zLkNhbGVuZGFyLFxuXHRcdFx0XHRcdFx0aHJlZjogQ0FMRU5EQVJfUFJFRklYLFxuXHRcdFx0XHRcdFx0Y29sb3JzOiBOYXZCdXR0b25Db2xvci5IZWFkZXIsXG5cdFx0XHRcdFx0XHRjbGljazogKCkgPT4gbS5yb3V0ZS5nZXQoKS5zdGFydHNXaXRoKENBTEVOREFSX1BSRUZJWCksXG5cdFx0XHRcdCAgfSlcblx0XHRcdFx0OiBudWxsLFxuXHRcdF1cblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ29tcG9uZW50IH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgQXJpYUxhbmRtYXJrcywgbGFuZG1hcmtBdHRycyB9IGZyb20gXCIuLi9BcmlhVXRpbHNcIlxuaW1wb3J0IHsgTGF5ZXJUeXBlIH0gZnJvbSBcIi4uLy4uLy4uL1Jvb3RWaWV3XCJcbmltcG9ydCB7IGxhenksIE1heWJlTGF6eSwgcmVzb2x2ZU1heWJlTGF6eSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgYXNzZXJ0TWFpbk9yTm9kZSB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBsYW5nLCBUcmFuc2xhdGlvbiwgVHJhbnNsYXRpb25LZXksIE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG5leHBvcnQgY29uc3QgZW51bSBDb2x1bW5UeXBlIHtcblx0QmFja2dyb3VuZCA9IDEsXG5cdEZvcmVncm91bmQgPSAwLFxufVxuXG50eXBlIEF0dHJzID0ge1xuXHRyaWdodEJvcmRlcj86IGJvb2xlYW5cbn1cblxuZXhwb3J0IGNsYXNzIFZpZXdDb2x1bW4gaW1wbGVtZW50cyBDb21wb25lbnQ8QXR0cnM+IHtcblx0cHJpdmF0ZSByZWFkb25seSBjb21wb25lbnQ6IENvbXBvbmVudFxuXHRyZWFkb25seSBjb2x1bW5UeXBlOiBDb2x1bW5UeXBlXG5cdHJlYWRvbmx5IG1pbldpZHRoOiBudW1iZXJcblx0cmVhZG9ubHkgbWF4V2lkdGg6IG51bWJlclxuXHRwcml2YXRlIHJlYWRvbmx5IGhlYWRlckNlbnRlcjogTWF5YmVMYXp5PE1heWJlVHJhbnNsYXRpb24+XG5cdHByaXZhdGUgcmVhZG9ubHkgYXJpYUxhYmVsOiBsYXp5PHN0cmluZz5cblx0d2lkdGg6IG51bWJlclxuXHRvZmZzZXQ6IG51bWJlciAvLyBvZmZzZXQgdG8gdGhlIGxlZnRcblxuXHQvLyBub3QgcHJpdmF0ZSBiZWNhdXNlIHVzZWQgYnkgVmlld1NsaWRlclxuXHRkb21Db2x1bW46IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGxcblx0aXNJbkZvcmVncm91bmQ6IGJvb2xlYW5cblx0aXNWaXNpYmxlOiBib29sZWFuXG5cdGFyaWFSb2xlOiBBcmlhTGFuZG1hcmtzIHwgbnVsbCA9IG51bGxcblxuXHQvKipcblx0ICogQ3JlYXRlIGEgdmlldyBjb2x1bW4uXG5cdCAqIEBwYXJhbSBjb21wb25lbnQgVGhlIGNvbXBvbmVudCB0aGF0IGlzIHJlbmRlcmVkIGFzIHRoaXMgY29sdW1uXG5cdCAqIEBwYXJhbSBjb2x1bW5UeXBlIFRoZSB0eXBlIG9mIHRoZSB2aWV3IGNvbHVtbi5cblx0ICogQHBhcmFtIG1pbldpZHRoIFRoZSBtaW5pbXVtIGFsbG93ZWQgd2lkdGggZm9yIHRoZSB2aWV3IGNvbHVtbi5cblx0ICogQHBhcmFtIGhlYWRlckNlbnRlciByZXR1cm5lZCBpbiB7QGxpbmsgZ2V0VGl0bGV9LiBVc2VkIGluIEFSSUEgbGFuZG1hcmsgdW5sZXNzIG92ZXJyaWRlbiBieSB7QGxpbmsgYXJpYUxhYmVsfVxuXHQgKiBAcGFyYW0gYXJpYUxhYmVsIHVzZWQgaW4gQVJJQSBsYW5kbWFya1xuXHQgKiBAcGFyYW0gbWF4V2lkdGggVGhlIG1heGltdW0gYWxsb3dlZCB3aWR0aCBmb3IgdGhlIHZpZXcgY29sdW1uLlxuXHQgKiBAcGFyYW0gaGVhZGVyQ2VudGVyIFRoZSB0aXRsZSBvZiB0aGUgdmlldyBjb2x1bW4uXG5cdCAqIEBwYXJhbSBhcmlhTGFiZWwgVGhlIGxhYmVsIG9mIHRoZSB2aWV3IGNvbHVtbiB0byBiZSByZWFkIGJ5IHNjcmVlbiByZWFkZXJzLiBEZWZhdWx0cyB0byBoZWFkZXJDZW50ZXIgaWYgbm90IHNwZWNpZmllZC5cblx0ICovXG5cdGNvbnN0cnVjdG9yKFxuXHRcdGNvbXBvbmVudDogQ29tcG9uZW50LFxuXHRcdGNvbHVtblR5cGU6IENvbHVtblR5cGUsXG5cdFx0e1xuXHRcdFx0bWluV2lkdGgsXG5cdFx0XHRtYXhXaWR0aCxcblx0XHRcdC8vIG5vdGU6IGhlYWRlckNlbnRlciBpcyBhIGNhbmRpZGF0ZSBmb3IgcmVtb3ZhbCwgVmlld0NvbHVtbiBpcyBub3QgcmVzcG9uc2libGUgZm9yIHRoZSBoZWFkZXIuIFRoaXMgaXMgb25seSB1c2VmdWwgYXMgYW4gQVJJQSBkZXNjcmlwdGlvbiB3aGljaCB3ZSBjYW4gYWxyZWFkeVxuXHRcdFx0Ly8gcHJvdmlkZSBzZXBhcmF0ZWx5LiBXZSBzaG91bGQgYWx3YXlzIHJlcXVpcmUgYXJpYSBkZXNjcmlwdGlvbiBpbnN0ZWFkLlxuXHRcdFx0aGVhZGVyQ2VudGVyLFxuXHRcdFx0YXJpYUxhYmVsID0gKCkgPT4gbGFuZy5nZXRUcmFuc2xhdGlvblRleHQodGhpcy5nZXRUaXRsZSgpKSxcblx0XHR9OiB7XG5cdFx0XHRtaW5XaWR0aDogbnVtYmVyXG5cdFx0XHRtYXhXaWR0aDogbnVtYmVyXG5cdFx0XHRoZWFkZXJDZW50ZXI/OiBNYXliZUxhenk8TWF5YmVUcmFuc2xhdGlvbj5cblx0XHRcdGFyaWFMYWJlbD86IGxhenk8c3RyaW5nPlxuXHRcdH0sXG5cdCkge1xuXHRcdHRoaXMuY29tcG9uZW50ID0gY29tcG9uZW50XG5cdFx0dGhpcy5jb2x1bW5UeXBlID0gY29sdW1uVHlwZVxuXHRcdHRoaXMubWluV2lkdGggPSBtaW5XaWR0aFxuXHRcdHRoaXMubWF4V2lkdGggPSBtYXhXaWR0aFxuXG5cdFx0dGhpcy5oZWFkZXJDZW50ZXIgPSBoZWFkZXJDZW50ZXIgfHwgXCJlbXB0eVN0cmluZ19tc2dcIlxuXG5cdFx0dGhpcy5hcmlhTGFiZWwgPSBhcmlhTGFiZWwgPz8gbnVsbFxuXHRcdHRoaXMud2lkdGggPSBtaW5XaWR0aFxuXHRcdHRoaXMub2Zmc2V0ID0gMFxuXHRcdHRoaXMuaXNJbkZvcmVncm91bmQgPSBmYWxzZVxuXHRcdHRoaXMuaXNWaXNpYmxlID0gZmFsc2Vcblx0XHQvLyBmaXh1cCBmb3Igb2xkLXN0eWxlIGNvbXBvbmVudHNcblx0XHR0aGlzLnZpZXcgPSB0aGlzLnZpZXcuYmluZCh0aGlzKVxuXHR9XG5cblx0dmlldygpIHtcblx0XHRjb25zdCB6SW5kZXggPSAhdGhpcy5pc1Zpc2libGUgJiYgdGhpcy5jb2x1bW5UeXBlID09PSBDb2x1bW5UeXBlLkZvcmVncm91bmQgPyBMYXllclR5cGUuRm9yZWdyb3VuZE1lbnUgKyAxIDogXCJcIlxuXHRcdGNvbnN0IGxhbmRtYXJrID0gdGhpcy5hcmlhUm9sZSA/IGxhbmRtYXJrQXR0cnModGhpcy5hcmlhUm9sZSwgdGhpcy5hcmlhTGFiZWwgPyB0aGlzLmFyaWFMYWJlbCgpIDogbGFuZy5nZXRUcmFuc2xhdGlvblRleHQodGhpcy5nZXRUaXRsZSgpKSkgOiB7fVxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIudmlldy1jb2x1bW4uZmlsbC1hYnNvbHV0ZVwiLFxuXHRcdFx0e1xuXHRcdFx0XHQuLi5sYW5kbWFyayxcblx0XHRcdFx0XCJkYXRhLXRlc3RpZFwiOiBsYW5nLmdldFRyYW5zbGF0aW9uVGV4dCh0aGlzLmdldFRpdGxlKCkpLFxuXHRcdFx0XHRpbmVydDogIXRoaXMuaXNWaXNpYmxlICYmICF0aGlzLmlzSW5Gb3JlZ3JvdW5kLFxuXHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5kb21Db2x1bW4gPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0XHR0aGlzLmRvbUNvbHVtbi5zdHlsZS50cmFuc2Zvcm0gPVxuXHRcdFx0XHRcdFx0dGhpcy5jb2x1bW5UeXBlID09PSBDb2x1bW5UeXBlLkZvcmVncm91bmQgPyBcInRyYW5zbGF0ZVgoXCIgKyB0aGlzLmdldE9mZnNldEZvcmVncm91bmQodGhpcy5pc0luRm9yZWdyb3VuZCkgKyBcInB4KVwiIDogXCJcIlxuXG5cdFx0XHRcdFx0aWYgKHRoaXMuYXJpYVJvbGUgPT09IEFyaWFMYW5kbWFya3MuTWFpbikge1xuXHRcdFx0XHRcdFx0dGhpcy5mb2N1cygpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdHpJbmRleCxcblx0XHRcdFx0XHR3aWR0aDogdGhpcy53aWR0aCArIFwicHhcIixcblx0XHRcdFx0XHRsZWZ0OiB0aGlzLm9mZnNldCArIFwicHhcIixcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRtKHRoaXMuY29tcG9uZW50KSxcblx0XHQpXG5cdH1cblxuXHRnZXRUaXRsZSgpOiBNYXliZVRyYW5zbGF0aW9uIHtcblx0XHRyZXR1cm4gcmVzb2x2ZU1heWJlTGF6eSh0aGlzLmhlYWRlckNlbnRlcilcblx0fVxuXG5cdGdldE9mZnNldEZvcmVncm91bmQoZm9yZWdyb3VuZFN0YXRlOiBib29sZWFuKTogbnVtYmVyIHtcblx0XHRpZiAodGhpcy5pc1Zpc2libGUgfHwgZm9yZWdyb3VuZFN0YXRlKSB7XG5cdFx0XHRyZXR1cm4gMFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gLXRoaXMud2lkdGhcblx0XHR9XG5cdH1cblxuXHRmb2N1cygpIHtcblx0XHR0aGlzLmRvbUNvbHVtbj8uZm9jdXMoKVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50IH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgQ29sdW1uVHlwZSwgVmlld0NvbHVtbiB9IGZyb20gXCIuLi9iYXNlL1ZpZXdDb2x1bW4uanNcIlxuaW1wb3J0IHR5cGUgeyB3aW5kb3dTaXplTGlzdGVuZXIgfSBmcm9tIFwiLi4vLi4vbWlzYy9XaW5kb3dGYWNhZGUuanNcIlxuaW1wb3J0IHsgd2luZG93RmFjYWRlIH0gZnJvbSBcIi4uLy4uL21pc2MvV2luZG93RmFjYWRlLmpzXCJcbmltcG9ydCB7IHNpemUgfSBmcm9tIFwiLi4vc2l6ZS5qc1wiXG5pbXBvcnQgeyBhbHBoYSwgQWxwaGFFbnVtLCBhbmltYXRpb25zLCB0cmFuc2Zvcm0sIFRyYW5zZm9ybUVudW0gfSBmcm9tIFwiLi4vYW5pbWF0aW9uL0FuaW1hdGlvbnMuanNcIlxuaW1wb3J0IHsgZWFzZSB9IGZyb20gXCIuLi9hbmltYXRpb24vRWFzaW5nLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uL3RoZW1lLmpzXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IHN0eWxlcyB9IGZyb20gXCIuLi9zdHlsZXMuanNcIlxuaW1wb3J0IHsgQXJpYUxhbmRtYXJrcyB9IGZyb20gXCIuLi9BcmlhVXRpbHMuanNcIlxuaW1wb3J0IHsgTGF5ZXJUeXBlIH0gZnJvbSBcIi4uLy4uLy4uL1Jvb3RWaWV3LmpzXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9FbnYuanNcIlxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSBcIi4uLy4uL21pc2MvQ2xpZW50RGV0ZWN0b3IuanNcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcbmV4cG9ydCB0eXBlIEdlc3R1cmVJbmZvID0ge1xuXHR4OiBudW1iZXJcblx0eTogbnVtYmVyXG5cdHRpbWU6IG51bWJlclxuXHRpZGVudGlmaWVyOiBudW1iZXJcbn1cbmV4cG9ydCBjb25zdCBnZXN0dXJlSW5mb0Zyb21Ub3VjaCA9ICh0b3VjaDogVG91Y2gpOiBHZXN0dXJlSW5mbyA9PiAoe1xuXHR4OiB0b3VjaC5wYWdlWCxcblx0eTogdG91Y2gucGFnZVksXG5cdHRpbWU6IHBlcmZvcm1hbmNlLm5vdygpLFxuXHRpZGVudGlmaWVyOiB0b3VjaC5pZGVudGlmaWVyLFxufSlcblxuaW50ZXJmYWNlIFZpZXdTbGlkZXJBdHRycyB7XG5cdGhlYWRlcjogQ2hpbGRyZW5cblx0Ym90dG9tTmF2PzogQ2hpbGRyZW5cbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgdmlldyB3aXRoIG11bHRpcGxlIHZpZXcgY29sdW1ucy4gRGVwZW5kaW5nIG9uIHRoZSBzY3JlZW4gd2lkdGggYW5kIHRoZSB2aWV3IGNvbHVtbnMgY29uZmlndXJhdGlvbnMsXG4gKiB0aGUgYWN0dWFsIHdpZHRocyBhbmQgcG9zaXRpb25zIG9mIHRoZSB2aWV3IGNvbHVtbnMgaXMgY2FsY3VsYXRlZC4gVGhpcyBhbGxvd3MgYSBjb25zaXN0ZW50IGxheW91dCBmb3IgYW55IGJyb3dzZXJcbiAqIHJlc29sdXRpb24gb24gYW55IHR5cGUgb2YgZGV2aWNlLlxuICovXG5leHBvcnQgY2xhc3MgVmlld1NsaWRlciBpbXBsZW1lbnRzIENvbXBvbmVudDxWaWV3U2xpZGVyQXR0cnM+IHtcblx0cHJpdmF0ZSByZWFkb25seSBtYWluQ29sdW1uOiBWaWV3Q29sdW1uXG5cdGZvY3VzZWRDb2x1bW46IFZpZXdDb2x1bW5cblx0cHJpdmF0ZSB2aXNpYmxlQmFja2dyb3VuZENvbHVtbnM6IFZpZXdDb2x1bW5bXVxuXHRwcml2YXRlIGRvbVNsaWRpbmdQYXJ0ITogSFRNTEVsZW1lbnRcblx0dmlldzogQ29tcG9uZW50PFZpZXdTbGlkZXJBdHRycz5bXCJ2aWV3XCJdXG5cdHByaXZhdGUgYnVzeTogUHJvbWlzZTx1bmtub3duPlxuXHRwcml2YXRlIGlzTW9kYWxCYWNrZ3JvdW5kVmlzaWJsZTogYm9vbGVhblxuXHRwcml2YXRlIHJlYWRvbmx5IHJlc2l6ZUxpc3RlbmVyOiB3aW5kb3dTaXplTGlzdGVuZXIgPSAoKSA9PiB0aGlzLnVwZGF0ZVZpc2libGVCYWNrZ3JvdW5kQ29sdW1ucygpXG5cdHByaXZhdGUgcmVhZG9ubHkgaGFuZGxlSGlzdG9yeUV2ZW50ID0gKCkgPT4ge1xuXHRcdGNvbnN0IHByZXYgPSB0aGlzLmdldFByZXZpb3VzQ29sdW1uKClcblx0XHRpZiAocHJldiAhPSBudWxsICYmIHByZXYuY29sdW1uVHlwZSAhPT0gQ29sdW1uVHlwZS5Gb3JlZ3JvdW5kKSB7XG5cdFx0XHR0aGlzLmZvY3VzUHJldmlvdXNDb2x1bW4oKVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fSBlbHNlIGlmICh0aGlzLmlzRm9yZWdyb3VuZENvbHVtbkZvY3VzZWQoKSkge1xuXHRcdFx0dGhpcy5mb2N1c05leHRDb2x1bW4oKVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0fVxuXHRcdHJldHVybiB0cnVlXG5cdH1cblxuXHQvKiogQ3JlYXRlcyB0aGUgZXZlbnQgbGlzdGVuZXJzIGFzIHNvb24gYXMgdGhpcyBjb21wb25lbnQgaXMgbG9hZGVkIChpbnZva2VkIGJ5IG1pdGhyaWwpKi9cblx0b25jcmVhdGU6ICgpID0+IHZvaWQgPSAoKSA9PiB7XG5cdFx0dGhpcy51cGRhdGVWaXNpYmxlQmFja2dyb3VuZENvbHVtbnMoKVxuXG5cdFx0d2luZG93RmFjYWRlLmFkZFJlc2l6ZUxpc3RlbmVyKHRoaXMucmVzaXplTGlzdGVuZXIpXG5cdFx0d2luZG93RmFjYWRlLmFkZEhpc3RvcnlFdmVudExpc3RlbmVyKHRoaXMuaGFuZGxlSGlzdG9yeUV2ZW50KVxuXHR9XG5cblx0LyoqIFJlbW92ZXMgdGhlIHJlZ2lzdGVyZWQgZXZlbnQgbGlzdGVuZXJzIGFzIHNvb24gYXMgdGhpcyBjb21wb25lbnQgaXMgdW5sb2FkZWQgKGludm9rZWQgYnkgbWl0aHJpbCkqL1xuXHRvbnJlbW92ZTogKCkgPT4gdm9pZCA9ICgpID0+IHtcblx0XHR3aW5kb3dGYWNhZGUucmVtb3ZlUmVzaXplTGlzdGVuZXIodGhpcy5yZXNpemVMaXN0ZW5lcilcblx0XHR3aW5kb3dGYWNhZGUucmVtb3ZlSGlzdG9yeUV2ZW50TGlzdGVuZXIodGhpcy5oYW5kbGVIaXN0b3J5RXZlbnQpXG5cdH1cblx0cHJpdmF0ZSBnZXRTaWRlQ29sRG9tOiAoKSA9PiBIVE1MRWxlbWVudCB8IG51bGwgPSAoKSA9PiB0aGlzLnZpZXdDb2x1bW5zWzBdLmRvbUNvbHVtblxuXG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgdmlld0NvbHVtbnM6IFZpZXdDb2x1bW5bXSwgcHJpdmF0ZSByZWFkb25seSBlbmFibGVEcmF3ZXI6IGJvb2xlYW4gPSB0cnVlKSB7XG5cdFx0Ly8gdGhlIGZpcnN0IGJhY2tncm91bmQgY29sdW1uIGlzIHRoZSBtYWluIGNvbHVtblxuXHRcdHRoaXMubWFpbkNvbHVtbiA9IGFzc2VydE5vdE51bGwoXG5cdFx0XHR2aWV3Q29sdW1ucy5maW5kKChjb2x1bW4pID0+IGNvbHVtbi5jb2x1bW5UeXBlID09PSBDb2x1bW5UeXBlLkJhY2tncm91bmQpLFxuXHRcdFx0XCJ0aGVyZSB3YXMgbm8gYmFja2dyb3VuZyBjb2x1bW4gcGFzc2VkIHRvIHZpZXdzbGlkZXJcIixcblx0XHQpXG5cblx0XHR0aGlzLmZvY3VzZWRDb2x1bW4gPSB0aGlzLm1haW5Db2x1bW5cblx0XHR0aGlzLnZpc2libGVCYWNrZ3JvdW5kQ29sdW1ucyA9IFtdXG5cblx0XHR0aGlzLnVwZGF0ZVZpc2libGVCYWNrZ3JvdW5kQ29sdW1ucygpXG5cblx0XHR0aGlzLmJ1c3kgPSBQcm9taXNlLnJlc29sdmUoKVxuXHRcdHRoaXMuaXNNb2RhbEJhY2tncm91bmRWaXNpYmxlID0gZmFsc2Vcblx0XHRmb3IgKGNvbnN0IGNvbHVtbiBvZiB0aGlzLnZpZXdDb2x1bW5zKSB7XG5cdFx0XHRjb2x1bW4uYXJpYVJvbGUgPSB0aGlzLmdldENvbHVtblJvbGUoY29sdW1uKVxuXHRcdH1cblxuXHRcdHRoaXMudmlldyA9ICh7IGF0dHJzIH0pOiBDaGlsZHJlbiA9PiB7XG5cdFx0XHRjb25zdCBtYWluU2xpZGVyQ29sdW1ucyA9IHRoaXMuZ2V0Q29sdW1uc0Zvck1haW5TbGlkZXIoKVxuXG5cdFx0XHRjb25zdCBhbGxCYWNrZ3JvdW5kQ29sdW1uc0FyZVZpc2libGUgPSB0aGlzLnZpc2libGVCYWNrZ3JvdW5kQ29sdW1ucy5sZW5ndGggPT09IG1haW5TbGlkZXJDb2x1bW5zLmxlbmd0aFxuXHRcdFx0cmV0dXJuIG0oXG5cdFx0XHRcdFwiLmZpbGwtYWJzb2x1dGUuZmxleC5jb2xcIixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+IHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLmVuYWJsZURyYXdlcikgdGhpcy5hdHRhY2hUb3VjaEhhbmRsZXIodm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50KVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0b25yZW1vdmU6ICgpID0+IHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLnZpZXdDb2x1bW5zWzBdLmNvbHVtblR5cGUgPT09IENvbHVtblR5cGUuRm9yZWdyb3VuZCAmJiB0aGlzLnZpZXdDb2x1bW5zWzBdLmlzSW5Gb3JlZ3JvdW5kKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMudmlld0NvbHVtbnNbMF0uaXNJbkZvcmVncm91bmQgPSBmYWxzZVxuXHRcdFx0XHRcdFx0XHR0aGlzLmlzTW9kYWxCYWNrZ3JvdW5kVmlzaWJsZSA9IGZhbHNlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdHN0eWxlcy5pc1VzaW5nQm90dG9tTmF2aWdhdGlvbigpID8gbnVsbCA6IGF0dHJzLmhlYWRlcixcblx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XCIudmlldy1jb2x1bW5zLmZsZXgtZ3Jvdy5yZWxcIixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0b25jcmVhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuZG9tU2xpZGluZ1BhcnQgPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHR3aWR0aDogdGhpcy5nZXRXaWR0aCgpICsgXCJweFwiLFxuXHRcdFx0XHRcdFx0XHRcdHRyYW5zZm9ybTogXCJ0cmFuc2xhdGVYKFwiICsgdGhpcy5nZXRPZmZzZXQodGhpcy52aXNpYmxlQmFja2dyb3VuZENvbHVtbnNbMF0pICsgXCJweClcIixcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRtYWluU2xpZGVyQ29sdW1ucy5tYXAoKGNvbHVtbiwgaW5kZXgpID0+XG5cdFx0XHRcdFx0XHRcdG0oY29sdW1uLCB7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gT25seSBhcHBseSByaWdodCBib3JkZXIgaWYgMS4gYWxsIGJhY2tncm91bmQgY29sdW1ucyBhcmUgdmlzaWJsZS4gMi4gSXQncyBub3QgdGhlIGxhc3QgY29sdW1uLlxuXHRcdFx0XHRcdFx0XHRcdC8vIFBlcmhhcHMgdGhlIGNvbmRpdGlvbiBzaG91bGQgYmUgXCJ0aGVyZSdzIGFub3RoZXIgdmlzaWJsZSBjb2x1bW4gYWZ0ZXIgdGhpcyBvbmVcIiBidXQgaXQgd29ya3MgbGlrZSB0aGlzIHRvb1xuXHRcdFx0XHRcdFx0XHRcdHJpZ2h0Qm9yZGVyOiBhbGxCYWNrZ3JvdW5kQ29sdW1uc0FyZVZpc2libGUgJiYgaW5kZXggIT09IG1haW5TbGlkZXJDb2x1bW5zLmxlbmd0aCAtIDEsXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdHN0eWxlcy5pc1VzaW5nQm90dG9tTmF2aWdhdGlvbigpICYmICFjbGllbnQuaXNDYWxlbmRhckFwcCgpID8gYXR0cnMuYm90dG9tTmF2IDogbnVsbCxcblx0XHRcdFx0XHR0aGlzLmdldENvbHVtbnNGb3JPdmVybGF5KCkubWFwKChjKSA9PiBtKGMsIHt9KSksXG5cdFx0XHRcdFx0dGhpcy5lbmFibGVEcmF3ZXIgPyB0aGlzLmNyZWF0ZU1vZGFsQmFja2dyb3VuZCgpIDogbnVsbCxcblx0XHRcdFx0XSxcblx0XHRcdClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGdldENvbHVtblJvbGUoY29sdW1uOiBWaWV3Q29sdW1uKTogQXJpYUxhbmRtYXJrcyB8IG51bGwge1xuXHRcdC8vIHJvbGUgIGZvciBmb3JlZ3JvdW5kIGNvbHVtbiBpcyBoYW5kbGVkIGluc2lkZSBGb2xkZXJDb2x1bW5WaWV3XG5cdFx0aWYgKGNvbHVtbi5jb2x1bW5UeXBlID09PSBDb2x1bW5UeXBlLkZvcmVncm91bmQpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMubWFpbkNvbHVtbiA9PT0gY29sdW1uID8gQXJpYUxhbmRtYXJrcy5NYWluIDogQXJpYUxhbmRtYXJrcy5SZWdpb25cblx0fVxuXG5cdGdldE1haW5Db2x1bW4oKTogVmlld0NvbHVtbiB7XG5cdFx0cmV0dXJuIHRoaXMubWFpbkNvbHVtblxuXHR9XG5cblx0cHJpdmF0ZSBnZXRDb2x1bW5zRm9yTWFpblNsaWRlcigpOiBBcnJheTxWaWV3Q29sdW1uPiB7XG5cdFx0cmV0dXJuIHRoaXMudmlld0NvbHVtbnMuZmlsdGVyKChjKSA9PiBjLmNvbHVtblR5cGUgPT09IENvbHVtblR5cGUuQmFja2dyb3VuZCB8fCBjLmlzVmlzaWJsZSlcblx0fVxuXG5cdHByaXZhdGUgZ2V0Q29sdW1uc0Zvck92ZXJsYXkoKTogQXJyYXk8Vmlld0NvbHVtbj4ge1xuXHRcdHJldHVybiB0aGlzLnZpZXdDb2x1bW5zLmZpbHRlcigoYykgPT4gYy5jb2x1bW5UeXBlID09PSBDb2x1bW5UeXBlLkZvcmVncm91bmQgJiYgIWMuaXNWaXNpYmxlKVxuXHR9XG5cblx0cHJpdmF0ZSBjcmVhdGVNb2RhbEJhY2tncm91bmQoKTogQ2hpbGRyZW4ge1xuXHRcdGlmICh0aGlzLmlzTW9kYWxCYWNrZ3JvdW5kVmlzaWJsZSkge1xuXHRcdFx0cmV0dXJuIFtcblx0XHRcdFx0bShcIi5maWxsLWFic29sdXRlLndpbGwtY2hhbmdlLWFscGhhXCIsIHtcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0ekluZGV4OiBMYXllclR5cGUuRm9yZWdyb3VuZE1lbnUsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0XHR0aGlzLmJ1c3kudGhlbigoKSA9PiBhbmltYXRpb25zLmFkZCh2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQsIGFscGhhKEFscGhhRW51bS5CYWNrZ3JvdW5kQ29sb3IsIHRoZW1lLm1vZGFsX2JnLCAwLCAwLjUpKSlcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG9uYmVmb3JlcmVtb3ZlOiAodm5vZGUpID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLmJ1c3kudGhlbigoKSA9PiBhbmltYXRpb25zLmFkZCh2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQsIGFscGhhKEFscGhhRW51bS5CYWNrZ3JvdW5kQ29sb3IsIHRoZW1lLm1vZGFsX2JnLCAwLjUsIDApKSlcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG9uY2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdHRoaXMuZm9jdXModGhpcy52aXNpYmxlQmFja2dyb3VuZENvbHVtbnNbMF0pXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSksXG5cdFx0XHRdXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBbXVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgdXBkYXRlVmlzaWJsZUJhY2tncm91bmRDb2x1bW5zKCkge1xuXHRcdHRoaXMuZm9jdXNlZENvbHVtbiA9IHRoaXMuZm9jdXNlZENvbHVtbiB8fCB0aGlzLm1haW5Db2x1bW5cblx0XHRsZXQgdmlzaWJsZUNvbHVtbnM6IFZpZXdDb2x1bW5bXSA9IFt0aGlzLmZvY3VzZWRDb2x1bW4uY29sdW1uVHlwZSA9PT0gQ29sdW1uVHlwZS5CYWNrZ3JvdW5kID8gdGhpcy5mb2N1c2VkQ29sdW1uIDogdGhpcy5tYWluQ29sdW1uXVxuXHRcdGxldCByZW1haW5pbmdTcGFjZSA9IHdpbmRvdy5pbm5lcldpZHRoIC0gdmlzaWJsZUNvbHVtbnNbMF0ubWluV2lkdGhcblx0XHRsZXQgbmV4dFZpc2libGVDb2x1bW4gPSB0aGlzLmdldE5leHRWaXNpYmxlQ29sdW1uKHZpc2libGVDb2x1bW5zLCB0aGlzLnZpZXdDb2x1bW5zKVxuXG5cdFx0d2hpbGUgKG5leHRWaXNpYmxlQ29sdW1uICYmIHJlbWFpbmluZ1NwYWNlID49IG5leHRWaXNpYmxlQ29sdW1uLm1pbldpZHRoKSB7XG5cdFx0XHR2aXNpYmxlQ29sdW1ucy5wdXNoKG5leHRWaXNpYmxlQ29sdW1uKVxuXHRcdFx0cmVtYWluaW5nU3BhY2UgLT0gbmV4dFZpc2libGVDb2x1bW4ubWluV2lkdGhcblx0XHRcdG5leHRWaXNpYmxlQ29sdW1uID0gdGhpcy5nZXROZXh0VmlzaWJsZUNvbHVtbih2aXNpYmxlQ29sdW1ucywgdGhpcy52aWV3Q29sdW1ucylcblx0XHR9XG5cblx0XHQvLyB2aXNpYmxlIGNvbHVtbnMgbXVzdCBiZSBzb3J0IGJ5IHRoZSBpbml0aWFsIGNvbHVtbiBvcmRlclxuXHRcdHZpc2libGVDb2x1bW5zLnNvcnQoKGEsIGIpID0+IHRoaXMudmlld0NvbHVtbnMuaW5kZXhPZihhKSAtIHRoaXMudmlld0NvbHVtbnMuaW5kZXhPZihiKSlcblxuXHRcdHRoaXMuZGlzdHJpYnV0ZVJlbWFpbmluZ1NwYWNlKHZpc2libGVDb2x1bW5zLCByZW1haW5pbmdTcGFjZSlcblxuXHRcdHRoaXMuc2V0V2lkdGhGb3JIaWRkZW5Db2x1bW5zKHZpc2libGVDb2x1bW5zKVxuXG5cdFx0Zm9yIChjb25zdCBjb2x1bW4gb2YgdGhpcy52aWV3Q29sdW1ucykge1xuXHRcdFx0Y29sdW1uLmlzVmlzaWJsZSA9IHZpc2libGVDb2x1bW5zLmluY2x1ZGVzKGNvbHVtbilcblx0XHR9XG5cdFx0dGhpcy51cGRhdGVPZmZzZXRzKClcblx0XHR0aGlzLnZpc2libGVCYWNrZ3JvdW5kQ29sdW1ucyA9IHZpc2libGVDb2x1bW5zXG5cblx0XHRpZiAodGhpcy5hbGxDb2x1bW5zVmlzaWJsZSgpKSB7XG5cdFx0XHR0aGlzLmZvY3VzZWRDb2x1bW4uaXNJbkZvcmVncm91bmQgPSBmYWxzZVxuXHRcdFx0dGhpcy5pc01vZGFsQmFja2dyb3VuZFZpc2libGUgPSBmYWxzZVxuXG5cdFx0XHRpZiAodGhpcy52aWV3Q29sdW1uc1swXS5kb21Db2x1bW4pIHtcblx0XHRcdFx0dGhpcy52aWV3Q29sdW1uc1swXS5kb21Db2x1bW4uc3R5bGUudHJhbnNmb3JtID0gXCJcIlxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gbS5yZWRyYXcoKSlcblx0fVxuXG5cdGdldFZpc2libGVCYWNrZ3JvdW5kQ29sdW1ucygpOiBWaWV3Q29sdW1uW10ge1xuXHRcdHJldHVybiB0aGlzLnZpc2libGVCYWNrZ3JvdW5kQ29sdW1ucy5zbGljZSgpXG5cdH1cblxuXHRpc1VzaW5nT3ZlcmxheUNvbHVtbnMoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMudmlld0NvbHVtbnMuZXZlcnkoKGMpID0+IGMuY29sdW1uVHlwZSAhPT0gQ29sdW1uVHlwZS5Gb3JlZ3JvdW5kIHx8IGMuaXNWaXNpYmxlKVxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIG5leHQgY29sdW1uIHdoaWNoIHNob3VsZCBiZWNvbWUgdmlzaWJsZVxuXHQgKiBAcGFyYW0gdmlzaWJsZUNvbHVtbnMgQWxsIGNvbHVtbnMgdGhhdCB3aWxsIGRlZmluaXRlbHkgYmUgdmlzaWJsZVxuXHQgKiBAcGFyYW0gYWxsQ29sdW1ucyBBbGwgY29sdW1ucypcblx0ICovXG5cdGdldE5leHRWaXNpYmxlQ29sdW1uKHZpc2libGVDb2x1bW5zOiBWaWV3Q29sdW1uW10sIGFsbENvbHVtbnM6IFZpZXdDb2x1bW5bXSk6IFZpZXdDb2x1bW4gfCBudWxsIHtcblx0XHQvLyBGaXJzdDogdHJ5IHRvIGZpbmQgYSBiYWNrZ3JvdW5kIGNvbHVtbiB3aGljaCBpcyBub3QgdmlzaWJsZVxuXHRcdGxldCBuZXh0Q29sdW1uID0gYWxsQ29sdW1ucy5maW5kKChjb2x1bW4pID0+IHtcblx0XHRcdHJldHVybiBjb2x1bW4uY29sdW1uVHlwZSA9PT0gQ29sdW1uVHlwZS5CYWNrZ3JvdW5kICYmIHZpc2libGVDb2x1bW5zLmluZGV4T2YoY29sdW1uKSA8IDBcblx0XHR9KVxuXG5cdFx0aWYgKCFuZXh0Q29sdW1uKSB7XG5cdFx0XHQvLyBTZWNvbmQ6IGlmIG5vIG1vcmUgYmFja2dyb3VuZCBjb2x1bW5zIGFyZSBhdmFpbGFibGUgYWRkIHRoZSBmb3JlZ3JvdW5kIGNvbHVtbiB0byB0aGUgdmlzaWJsZSBjb2x1bW5zXG5cdFx0XHRuZXh0Q29sdW1uID0gYWxsQ29sdW1ucy5maW5kKChjb2x1bW4pID0+IHtcblx0XHRcdFx0cmV0dXJuIGNvbHVtbi5jb2x1bW5UeXBlID09PSBDb2x1bW5UeXBlLkZvcmVncm91bmQgJiYgdmlzaWJsZUNvbHVtbnMuaW5kZXhPZihjb2x1bW4pIDwgMFxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRyZXR1cm4gbmV4dENvbHVtbiA/PyBudWxsXG5cdH1cblxuXHRnZXRCYWNrZ3JvdW5kQ29sdW1ucygpOiBWaWV3Q29sdW1uW10ge1xuXHRcdHJldHVybiB0aGlzLnZpZXdDb2x1bW5zLmZpbHRlcigoYykgPT4gYy5jb2x1bW5UeXBlID09PSBDb2x1bW5UeXBlLkJhY2tncm91bmQpXG5cdH1cblxuXHQvKipcblx0ICogZGlzdHJpYnV0ZXMgdGhlIHJlbWFpbmluZyBzcGFjZSB0byBhbGwgdmlzaWJsZSBjb2x1bW5zXG5cdCAqIEBwYXJhbSB2aXNpYmxlQ29sdW1uc1xuXHQgKiBAcGFyYW0gcmVtYWluaW5nU3BhY2Vcblx0ICovXG5cdHByaXZhdGUgZGlzdHJpYnV0ZVJlbWFpbmluZ1NwYWNlKHZpc2libGVDb2x1bW5zOiBWaWV3Q29sdW1uW10sIHJlbWFpbmluZ1NwYWNlOiBudW1iZXIpIHtcblx0XHRsZXQgc3BhY2VQZXJDb2x1bW4gPSByZW1haW5pbmdTcGFjZSAvIHZpc2libGVDb2x1bW5zLmxlbmd0aFxuXHRcdGZvciAoY29uc3QgW2luZGV4LCB2aXNpYmxlQ29sdW1uXSBvZiB2aXNpYmxlQ29sdW1ucy5lbnRyaWVzKCkpIHtcblx0XHRcdGlmICh2aXNpYmxlQ29sdW1ucy5sZW5ndGggLSAxID09PSBpbmRleCkge1xuXHRcdFx0XHQvLyBpZ25vcmUgbWF4IHdpZHRoIGZvciB0aGUgbGFzdCB2aXNpYmxlIGNvbHVtblxuXHRcdFx0XHR2aXNpYmxlQ29sdW1uLndpZHRoID0gdmlzaWJsZUNvbHVtbi5taW5XaWR0aCArIHJlbWFpbmluZ1NwYWNlXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsZXQgc3BhY2VGb3JUaGlzQ29sdW1uID0gTWF0aC5taW4oc3BhY2VQZXJDb2x1bW4sIHZpc2libGVDb2x1bW4ubWF4V2lkdGggLSB2aXNpYmxlQ29sdW1uLm1pbldpZHRoKVxuXHRcdFx0XHRyZW1haW5pbmdTcGFjZSAtPSBzcGFjZUZvclRoaXNDb2x1bW5cblx0XHRcdFx0dmlzaWJsZUNvbHVtbi53aWR0aCA9IHZpc2libGVDb2x1bW4ubWluV2lkdGggKyBzcGFjZUZvclRoaXNDb2x1bW5cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHNldFdpZHRoRm9ySGlkZGVuQ29sdW1ucyh2aXNpYmxlQ29sdW1uczogVmlld0NvbHVtbltdKSB7XG5cdFx0Ly8gaWYgYWxsIGNvbHVtbnMgYXJlIHZpc2libGUgdGhlcmUgaXMgbm8gbmVlZCB0byBzZXQgdGhlIHdpZHRoXG5cdFx0aWYgKHRoaXMudmlld0NvbHVtbnMubGVuZ3RoID09PSB2aXNpYmxlQ29sdW1ucy5sZW5ndGgpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdC8vIGlmIG9ubHkgb25lIGNvbHVtbiBpcyB2aXNpYmxlIHNldCB0aGUgc2FtZSB3aWR0aCBmb3IgYWxsIGNvbHVtbnMgaWdub3JpbmcgbWF4IHdpZHRoXG5cdFx0aWYgKHZpc2libGVDb2x1bW5zLmxlbmd0aCA9PT0gMSkge1xuXHRcdFx0Zm9yIChjb25zdCBjb2x1bW4gb2YgdGhpcy52aWV3Q29sdW1ucykge1xuXHRcdFx0XHRjb2x1bW4ud2lkdGggPSB2aXNpYmxlQ29sdW1uc1swXS53aWR0aFxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFJlZHVjZSB0aGUgd2lkdGggb2YgdGhlIGZvcmVncm91bmQgYnV0dG9uIHRvIGtlZXAgYWx3YXlzIGEgc21hbGwgcGFydCBvZiB0aGUgYmFja2dyb3VuZCBidXR0b24gdmlzaWJsZS5cblx0XHRsZXQgZm9yZUdyb3VuZENvbHVtbiA9IHRoaXMudmlld0NvbHVtbnMuZmluZCgoY29sdW1uKSA9PiBjb2x1bW4uY29sdW1uVHlwZSA9PT0gQ29sdW1uVHlwZS5Gb3JlZ3JvdW5kKVxuXG5cdFx0aWYgKGZvcmVHcm91bmRDb2x1bW4pIHtcblx0XHRcdGxldCByZW1haW5pbmdTcGFjZSA9IHdpbmRvdy5pbm5lcldpZHRoIC0gZm9yZUdyb3VuZENvbHVtbi5taW5XaWR0aCAtIHNpemUuaHBhZF9sYXJnZVxuXHRcdFx0bGV0IGFkZGl0aW9uYWxTcGFjZUZvckNvbHVtbiA9IE1hdGgubWluKHJlbWFpbmluZ1NwYWNlLCBmb3JlR3JvdW5kQ29sdW1uLm1heFdpZHRoIC0gZm9yZUdyb3VuZENvbHVtbi5taW5XaWR0aClcblx0XHRcdGZvcmVHcm91bmRDb2x1bW4ud2lkdGggPSBmb3JlR3JvdW5kQ29sdW1uLm1pbldpZHRoICsgYWRkaXRpb25hbFNwYWNlRm9yQ29sdW1uXG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgZm9jdXModmlld0NvbHVtbjogVmlld0NvbHVtbik6IFByb21pc2U8dW5rbm93bj4ge1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmJ1c3lcblx0XHRcdGlmICh0aGlzLmZvY3VzZWRDb2x1bW4gPT09IHZpZXdDb2x1bW4pIHJldHVyblxuXHRcdFx0Ly8gaGlkZSB0aGUgZm9yZWdyb3VuZCBjb2x1bW4gaWYgdGhlIGNvbHVtbiBpcyBpbiBmb3JlZ3JvdW5kXG5cdFx0XHRpZiAodGhpcy5mb2N1c2VkQ29sdW1uLmlzSW5Gb3JlZ3JvdW5kKSB7XG5cdFx0XHRcdHRoaXMuYnVzeSA9IHRoaXMuc2xpZGVGb3JlZ3JvdW5kQ29sdW1uKHRoaXMuZm9jdXNlZENvbHVtbiwgZmFsc2UpXG5cdFx0XHRcdGF3YWl0IHRoaXMuYnVzeVxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmZvY3VzZWRDb2x1bW4gPSB2aWV3Q29sdW1uXG5cdFx0XHRpZiAoXG5cdFx0XHRcdHZpZXdDb2x1bW4uY29sdW1uVHlwZSA9PT0gQ29sdW1uVHlwZS5CYWNrZ3JvdW5kICYmXG5cdFx0XHRcdHRoaXMudmlzaWJsZUJhY2tncm91bmRDb2x1bW5zLmxlbmd0aCA9PT0gMSAmJlxuXHRcdFx0XHR0aGlzLnZpc2libGVCYWNrZ3JvdW5kQ29sdW1ucy5pbmRleE9mKHZpZXdDb2x1bW4pIDwgMFxuXHRcdFx0KSB7XG5cdFx0XHRcdGNvbnN0IGN1cnJlbnRPZmZzZXQgPSB0aGlzLmRvbVNsaWRpbmdQYXJ0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnRcblx0XHRcdFx0dGhpcy5idXN5ID0gdGhpcy5zbGlkZUJhY2tncm91bmRDb2x1bW5zKHZpZXdDb2x1bW4sIGN1cnJlbnRPZmZzZXQsIHRoaXMuZ2V0T2Zmc2V0KHZpZXdDb2x1bW4pKVxuXHRcdFx0fSBlbHNlIGlmICh2aWV3Q29sdW1uLmNvbHVtblR5cGUgPT09IENvbHVtblR5cGUuRm9yZWdyb3VuZCAmJiB0aGlzLnZpc2libGVCYWNrZ3JvdW5kQ29sdW1ucy5pbmRleE9mKHZpZXdDb2x1bW4pIDwgMCkge1xuXHRcdFx0XHR0aGlzLmJ1c3kgPSB0aGlzLnNsaWRlRm9yZWdyb3VuZENvbHVtbih2aWV3Q29sdW1uLCB0cnVlKVxuXHRcdFx0fVxuXG5cdFx0XHRhd2FpdCB0aGlzLmJ1c3lcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0Ly8gZm9yIHVwZGF0aW5nIGhlYWRlciBiYXIgYWZ0ZXIgYW5pbWF0aW9uXG5cdFx0XHRtLnJlZHJhdygpXG5cdFx0XHR2aWV3Q29sdW1uLmZvY3VzKClcblx0XHR9XG5cdH1cblxuXHR3YWl0Rm9yQW5pbWF0aW9uKCk6IFByb21pc2U8dW5rbm93bj4ge1xuXHRcdHJldHVybiB0aGlzLmJ1c3lcblx0fVxuXG5cdC8qKlxuXHQgKiBFeGVjdXRlcyBhIHNsaWRlIGFuaW1hdGlvbiBmb3IgdGhlIGJhY2tncm91bmQgYnV0dG9ucy5cblx0ICovXG5cdHByaXZhdGUgc2xpZGVCYWNrZ3JvdW5kQ29sdW1ucyhuZXh0VmlzaWJsZVZpZXdDb2x1bW46IFZpZXdDb2x1bW4sIG9sZE9mZnNldDogbnVtYmVyLCBuZXdPZmZzZXQ6IG51bWJlcik6IFByb21pc2U8dW5rbm93bj4ge1xuXHRcdHJldHVybiBhbmltYXRpb25zXG5cdFx0XHQuYWRkKHRoaXMuZG9tU2xpZGluZ1BhcnQsIHRyYW5zZm9ybShUcmFuc2Zvcm1FbnVtLlRyYW5zbGF0ZVgsIG9sZE9mZnNldCwgbmV3T2Zmc2V0KSwge1xuXHRcdFx0XHRlYXNpbmc6IGVhc2UuaW5PdXQsXG5cdFx0XHR9KVxuXHRcdFx0LmZpbmFsbHkoKCkgPT4ge1xuXHRcdFx0XHQvLyByZXBsYWNlIHRoZSB2aXNpYmxlIGNvbHVtblxuXHRcdFx0XHRjb25zdCBbcmVtb3ZlZF0gPSB0aGlzLnZpc2libGVCYWNrZ3JvdW5kQ29sdW1ucy5zcGxpY2UoMCwgMSwgbmV4dFZpc2libGVWaWV3Q29sdW1uKVxuXG5cdFx0XHRcdHJlbW92ZWQuaXNWaXNpYmxlID0gZmFsc2Vcblx0XHRcdFx0bmV4dFZpc2libGVWaWV3Q29sdW1uLmlzVmlzaWJsZSA9IHRydWVcblx0XHRcdH0pXG5cdH1cblxuXHQvKipcblx0ICogRXhlY3V0ZXMgYSBzbGlkZSBhbmltYXRpb24gZm9yIHRoZSBmb3JlZ3JvdW5kIGJ1dHRvbi5cblx0ICovXG5cdHByaXZhdGUgc2xpZGVGb3JlZ3JvdW5kQ29sdW1uKGZvcmVncm91bmRDb2x1bW46IFZpZXdDb2x1bW4sIHRvRm9yZWdyb3VuZDogYm9vbGVhbik6IFByb21pc2U8dW5rbm93bj4ge1xuXHRcdGlmICghZm9yZWdyb3VuZENvbHVtbi5kb21Db2x1bW4pIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXG5cdFx0Ly8gUmVtb3ZlIHRoZSBgdmlzaWJpbGl0eTogaGlkZGVuYCBmcm9tIHRoZSB0YXJnZXQgY29sdW1uIGJlZm9yZSBzdGFydGluZyB0aGUgYW5pbWF0aW9uLCBzbyBpdCBpcyB2aXNpYmxlIGR1cmluZyB0aGUgYW5pbWF0aW9uXG5cdFx0Zm9yZWdyb3VuZENvbHVtbi5kb21Db2x1bW4uc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiXG5cblx0XHRjb25zdCBjb2xSZWN0ID0gZm9yZWdyb3VuZENvbHVtbi5kb21Db2x1bW4uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcblxuXHRcdGNvbnN0IG9sZE9mZnNldCA9IGNvbFJlY3QubGVmdFxuXHRcdGxldCBuZXdPZmZzZXQgPSBmb3JlZ3JvdW5kQ29sdW1uLmdldE9mZnNldEZvcmVncm91bmQodG9Gb3JlZ3JvdW5kKVxuXHRcdHRoaXMuaXNNb2RhbEJhY2tncm91bmRWaXNpYmxlID0gdG9Gb3JlZ3JvdW5kXG5cdFx0cmV0dXJuIGFuaW1hdGlvbnNcblx0XHRcdC5hZGQoYXNzZXJ0Tm90TnVsbChmb3JlZ3JvdW5kQ29sdW1uLmRvbUNvbHVtbiwgXCJmb3JlZ3JvdW5kIGNvbHVtbiBoYXMgbm8gZG9tY29sdW1uXCIpLCB0cmFuc2Zvcm0oVHJhbnNmb3JtRW51bS5UcmFuc2xhdGVYLCBvbGRPZmZzZXQsIG5ld09mZnNldCksIHtcblx0XHRcdFx0ZWFzaW5nOiBlYXNlLmluLFxuXHRcdFx0fSlcblx0XHRcdC5maW5hbGx5KCgpID0+IHtcblx0XHRcdFx0Zm9yZWdyb3VuZENvbHVtbi5pc0luRm9yZWdyb3VuZCA9IHRvRm9yZWdyb3VuZFxuXHRcdFx0fSlcblx0fVxuXG5cdHVwZGF0ZU9mZnNldHMoKSB7XG5cdFx0bGV0IG9mZnNldCA9IDBcblxuXHRcdGZvciAobGV0IGNvbHVtbiBvZiB0aGlzLnZpZXdDb2x1bW5zKSB7XG5cdFx0XHRpZiAoY29sdW1uLmNvbHVtblR5cGUgPT09IENvbHVtblR5cGUuQmFja2dyb3VuZCB8fCBjb2x1bW4uaXNWaXNpYmxlKSB7XG5cdFx0XHRcdGNvbHVtbi5vZmZzZXQgPSBvZmZzZXRcblx0XHRcdFx0b2Zmc2V0ICs9IGNvbHVtbi53aWR0aFxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGdldFdpZHRoKCk6IG51bWJlciB7XG5cdFx0bGV0IGxhc3RDb2x1bW4gPSB0aGlzLnZpZXdDb2x1bW5zW3RoaXMudmlld0NvbHVtbnMubGVuZ3RoIC0gMV1cblx0XHRyZXR1cm4gbGFzdENvbHVtbi5vZmZzZXQgKyBsYXN0Q29sdW1uLndpZHRoXG5cdH1cblxuXHRnZXRPZmZzZXQoY29sdW1uOiBWaWV3Q29sdW1uKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gMCAtIGNvbHVtbi5vZmZzZXRcblx0fVxuXG5cdGlzRm9jdXNQcmV2aW91c1Bvc3NpYmxlKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmdldFByZXZpb3VzQ29sdW1uKCkgIT0gbnVsbFxuXHR9XG5cblx0Zm9jdXNQcmV2aW91c0NvbHVtbigpOiBQcm9taXNlPHVua25vd24+IHtcblx0XHRpZiAodGhpcy5pc0ZvY3VzUHJldmlvdXNQb3NzaWJsZSgpKSB7XG5cdFx0XHR3aW5kb3cuZ2V0U2VsZWN0aW9uKCk/LmVtcHR5KCkgLy8gdHJ5IHRvIGRlc2VsZWN0IHRleHRcblx0XHRcdHJldHVybiB0aGlzLmZvY3VzKGFzc2VydE5vdE51bGwodGhpcy5nZXRQcmV2aW91c0NvbHVtbigpLCBcInByZXZpb3VzIGNvbHVtbiB3YXMgbnVsbCFcIikpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXHRcdH1cblx0fVxuXG5cdGZvY3VzTmV4dENvbHVtbigpIHtcblx0XHRjb25zdCBpbmRleE9mQ3VycmVudCA9IHRoaXMudmlld0NvbHVtbnMuaW5kZXhPZih0aGlzLmZvY3VzZWRDb2x1bW4pXG5cblx0XHRpZiAoaW5kZXhPZkN1cnJlbnQgKyAxIDwgdGhpcy52aWV3Q29sdW1ucy5sZW5ndGgpIHtcblx0XHRcdHRoaXMuZm9jdXModGhpcy52aWV3Q29sdW1uc1tpbmRleE9mQ3VycmVudCArIDFdKVxuXHRcdH1cblx0fVxuXG5cdGdldFByZXZpb3VzQ29sdW1uKCk6IFZpZXdDb2x1bW4gfCBudWxsIHtcblx0XHRpZiAodGhpcy52aWV3Q29sdW1ucy5pbmRleE9mKHRoaXMudmlzaWJsZUJhY2tncm91bmRDb2x1bW5zWzBdKSA+IDAgJiYgIXRoaXMuZm9jdXNlZENvbHVtbi5pc0luRm9yZWdyb3VuZCkge1xuXHRcdFx0bGV0IHZpc2libGVDb2x1bW5JbmRleCA9IHRoaXMudmlld0NvbHVtbnMuaW5kZXhPZih0aGlzLnZpc2libGVCYWNrZ3JvdW5kQ29sdW1uc1swXSlcblx0XHRcdHJldHVybiB0aGlzLnZpZXdDb2x1bW5zW3Zpc2libGVDb2x1bW5JbmRleCAtIDFdXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG51bGxcblx0fVxuXG5cdGlzRmlyc3RCYWNrZ3JvdW5kQ29sdW1uRm9jdXNlZCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy52aWV3Q29sdW1ucy5maWx0ZXIoKGNvbHVtbikgPT4gY29sdW1uLmNvbHVtblR5cGUgPT09IENvbHVtblR5cGUuQmFja2dyb3VuZCkuaW5kZXhPZih0aGlzLmZvY3VzZWRDb2x1bW4pID09PSAwXG5cdH1cblxuXHRpc0ZvcmVncm91bmRDb2x1bW5Gb2N1c2VkKCk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLmZvY3VzZWRDb2x1bW4gJiYgdGhpcy5mb2N1c2VkQ29sdW1uLmNvbHVtblR5cGUgPT09IENvbHVtblR5cGUuRm9yZWdyb3VuZFxuXHR9XG5cblx0YWxsQ29sdW1uc1Zpc2libGUoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMudmlzaWJsZUJhY2tncm91bmRDb2x1bW5zLmxlbmd0aCA9PT0gdGhpcy52aWV3Q29sdW1ucy5sZW5ndGhcblx0fVxuXG5cdGF0dGFjaFRvdWNoSGFuZGxlcihlbGVtZW50OiBIVE1MRWxlbWVudCkge1xuXHRcdGxldCBsYXN0R2VzdHVyZUluZm86IEdlc3R1cmVJbmZvIHwgbnVsbFxuXHRcdGxldCBvbGRHZXN0dXJlSW5mbzogR2VzdHVyZUluZm8gfCBudWxsXG5cdFx0bGV0IGluaXRpYWxHZXN0dXJlSW5mbzogR2VzdHVyZUluZm8gfCBudWxsXG5cdFx0Y29uc3QgVkVSVElDQUwgPSAxXG5cdFx0Y29uc3QgSE9SSVpPTlRBTCA9IDJcblx0XHRsZXQgZGlyZWN0aW9uTG9jazogMCB8IDEgfCAyID0gMFxuXG5cdFx0Y29uc3QgZ2VzdHVyZUVuZCA9IChldmVudDogYW55KSA9PiB7XG5cdFx0XHRjb25zdCBzYWZlTGFzdEdlc3R1cmVJbmZvID0gbGFzdEdlc3R1cmVJbmZvXG5cdFx0XHRjb25zdCBzYWZlT2xkR2VzdHVyZUluZm8gPSBvbGRHZXN0dXJlSW5mb1xuXG5cdFx0XHRpZiAoc2FmZUxhc3RHZXN0dXJlSW5mbyAmJiBzYWZlT2xkR2VzdHVyZUluZm8gJiYgIXRoaXMuYWxsQ29sdW1uc1Zpc2libGUoKSkge1xuXHRcdFx0XHRjb25zdCB0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdXG5cdFx0XHRcdGNvbnN0IG1haW5Db2wgPSB0aGlzLm1haW5Db2x1bW4uZG9tQ29sdW1uXG5cblx0XHRcdFx0Y29uc3Qgc2lkZUNvbCA9IHRoaXMuZ2V0U2lkZUNvbERvbSgpXG5cblx0XHRcdFx0aWYgKCFtYWluQ29sIHx8ICFzaWRlQ29sKSB7XG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBtYWluQ29sUmVjdCA9IG1haW5Db2wuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcblx0XHRcdFx0Y29uc3QgdmVsb2NpdHkgPSAoc2FmZUxhc3RHZXN0dXJlSW5mby54IC0gc2FmZU9sZEdlc3R1cmVJbmZvLngpIC8gKHNhZmVMYXN0R2VzdHVyZUluZm8udGltZSAtIHNhZmVPbGRHZXN0dXJlSW5mby50aW1lKVxuXG5cdFx0XHRcdGNvbnN0IHNob3cgPSAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5mb2N1c2VkQ29sdW1uID0gdGhpcy52aWV3Q29sdW1uc1swXVxuXHRcdFx0XHRcdHRoaXMuYnVzeSA9IHRoaXMuc2xpZGVGb3JlZ3JvdW5kQ29sdW1uKHRoaXMudmlld0NvbHVtbnNbMF0sIHRydWUpXG5cdFx0XHRcdFx0dGhpcy5pc01vZGFsQmFja2dyb3VuZFZpc2libGUgPSB0cnVlXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBoaWRlID0gKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuZm9jdXNlZENvbHVtbiA9IHRoaXMudmlld0NvbHVtbnNbMV1cblx0XHRcdFx0XHR0aGlzLmJ1c3kgPSB0aGlzLnNsaWRlRm9yZWdyb3VuZENvbHVtbih0aGlzLnZpZXdDb2x1bW5zWzBdLCBmYWxzZSlcblx0XHRcdFx0XHR0aGlzLmlzTW9kYWxCYWNrZ3JvdW5kVmlzaWJsZSA9IGZhbHNlXG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBHZXN0dXJlIGZvciB0aGUgc2lkZSBjb2x1bW5cblx0XHRcdFx0aWYgKHRoaXMuZ2V0QmFja2dyb3VuZENvbHVtbnMoKVswXS5pc1Zpc2libGUgfHwgdGhpcy5mb2N1c2VkQ29sdW1uLmlzSW5Gb3JlZ3JvdW5kKSB7XG5cdFx0XHRcdFx0Ly8gR2VzdHVyZSB3YXMgd2l0aCBlbm91Z2ggdmVsb2NpdHkgdG8gc2hvdyB0aGUgbWVudVxuXHRcdFx0XHRcdGlmICh2ZWxvY2l0eSA+IDAuOCkge1xuXHRcdFx0XHRcdFx0c2hvdygpIC8vIEdlc3R1cmUgd2FzIHdpdGggZW5vdWdoIHZlbG9jaXR5IHRvIGhpZGUgdGhlIG1lbnUgYW5kIHdlJ3JlIG5vdCBzY3JvbGxpbmcgdmVydGljYWxseVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAodmVsb2NpdHkgPCAtMC44ICYmIGRpcmVjdGlvbkxvY2sgIT09IFZFUlRJQ0FMKSB7XG5cdFx0XHRcdFx0XHRoaWRlKClcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gRmluZ2VyIHdhcyByZWxlYXNlZCB3aXRob3V0IG11Y2ggdmVsb2NpdHkgc28gaWYgaXQncyBmdXJ0aGVyIHRoYW4gc29tZSBkaXN0YW5jZSBmcm9tIGVkZ2UsIG9wZW4gbWVudS4gT3RoZXJ3aXNlLCBjbG9zZSBpdC5cblx0XHRcdFx0XHRcdGlmICh0b3VjaC5wYWdlWCA+IG1haW5Db2xSZWN0LmxlZnQgKyAxMDApIHtcblx0XHRcdFx0XHRcdFx0c2hvdygpXG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYgKGRpcmVjdGlvbkxvY2sgIT09IFZFUlRJQ0FMKSB7XG5cdFx0XHRcdFx0XHRcdGhpZGUoKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBHZXN0dXJlIGZvciBzbGlkaW5nIG90aGVyIGNvbHVtbnNcblx0XHRcdFx0XHRpZiAoKHNhZmVMYXN0R2VzdHVyZUluZm8ueCA+IHdpbmRvdy5pbm5lcldpZHRoIC8gMyB8fCB2ZWxvY2l0eSA+IDAuOCkgJiYgZGlyZWN0aW9uTG9jayAhPT0gVkVSVElDQUwpIHtcblx0XHRcdFx0XHRcdHRoaXMuZm9jdXNQcmV2aW91c0NvbHVtbigpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGNvbnN0IGNvbFJlY3QgPSB0aGlzLmRvbVNsaWRpbmdQYXJ0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cblx0XHRcdFx0XHRcdC8vIFJlLWZvY3VzIHRoZSBjb2x1bW4gdG8gcmVzZXQgb2Zmc2V0IGNoYW5nZWQgYnkgdGhlIGdlc3R1cmVcblx0XHRcdFx0XHRcdHRoaXMuYnVzeSA9IHRoaXMuc2xpZGVCYWNrZ3JvdW5kQ29sdW1ucyh0aGlzLmZvY3VzZWRDb2x1bW4sIGNvbFJlY3QubGVmdCwgLXRoaXMuZm9jdXNlZENvbHVtbi5vZmZzZXQpXG5cdFx0XHRcdFx0XHR0aGlzLmZvY3VzKHRoaXMuZm9jdXNlZENvbHVtbilcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLmJ1c3kudGhlbigoKSA9PiBtLnJlZHJhdygpKVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCB0b3VjaCBhbmQgbm90IGFub3RoZXIgb25lXG5cdFx0XHRpZiAoc2FmZUxhc3RHZXN0dXJlSW5mbyAmJiBzYWZlTGFzdEdlc3R1cmVJbmZvLmlkZW50aWZpZXIgPT09IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLmlkZW50aWZpZXIpIHtcblx0XHRcdFx0bGFzdEdlc3R1cmVJbmZvID0gbnVsbFxuXHRcdFx0XHRvbGRHZXN0dXJlSW5mbyA9IG51bGxcblx0XHRcdFx0aW5pdGlhbEdlc3R1cmVJbmZvID0gbnVsbFxuXHRcdFx0XHRkaXJlY3Rpb25Mb2NrID0gMFxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IGxpc3RlbmVycyA9IHtcblx0XHRcdHRvdWNoc3RhcnQ6IChldmVudDogYW55KSA9PiB7XG5cdFx0XHRcdGlmIChsYXN0R2VzdHVyZUluZm8pIHtcblx0XHRcdFx0XHQvLyBBbHJlYWR5IGRldGVjdGluZyBhIGdlc3R1cmUsIGlnbm9yZSBzZWNvbmQgb25lXG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBtYWluQ29sID0gdGhpcy5tYWluQ29sdW1uLmRvbUNvbHVtblxuXG5cdFx0XHRcdGNvbnN0IHNpZGVDb2wgPSB0aGlzLmdldFNpZGVDb2xEb20oKVxuXG5cdFx0XHRcdGlmICghbWFpbkNvbCB8fCAhc2lkZUNvbCB8fCB0aGlzLmFsbENvbHVtbnNWaXNpYmxlKCkpIHtcblx0XHRcdFx0XHRsYXN0R2VzdHVyZUluZm8gPSBudWxsXG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoZXZlbnQudG91Y2hlcy5sZW5ndGggPT09IDEgJiYgKHRoaXMudmlld0NvbHVtbnNbMF0uaXNJbkZvcmVncm91bmQgfHwgZXZlbnQudG91Y2hlc1swXS5wYWdlWCA8IDQwKSkge1xuXHRcdFx0XHRcdC8vIE9ubHkgc3RvcCBwcm9wb2dhdGlvbiB3aGlsZSB0aGUgbWVudSBpcyBub3QgeWV0IGZ1bGx5IHZpc2libGVcblx0XHRcdFx0XHRpZiAoIXRoaXMudmlld0NvbHVtbnNbMF0uaXNJbkZvcmVncm91bmQpIHtcblx0XHRcdFx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bGFzdEdlc3R1cmVJbmZvID0gaW5pdGlhbEdlc3R1cmVJbmZvID0gZ2VzdHVyZUluZm9Gcm9tVG91Y2goZXZlbnQudG91Y2hlc1swXSlcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHRvdWNobW92ZTogKGV2ZW50OiBhbnkpID0+IHtcblx0XHRcdFx0Y29uc3Qgc2lkZUNvbCA9IHRoaXMuZ2V0U2lkZUNvbERvbSgpXG5cblx0XHRcdFx0aWYgKCFzaWRlQ29sIHx8ICF0aGlzLm1haW5Db2x1bW4gfHwgdGhpcy5hbGxDb2x1bW5zVmlzaWJsZSgpKSB7XG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBnZXN0dXJlSW5mbyA9IGxhc3RHZXN0dXJlSW5mb1xuXHRcdFx0XHRjb25zdCBzYWZlSW5pdGlhbEdlc3R1cmVJbmZvID0gaW5pdGlhbEdlc3R1cmVJbmZvXG5cblx0XHRcdFx0aWYgKGdlc3R1cmVJbmZvICYmIHNhZmVJbml0aWFsR2VzdHVyZUluZm8gJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggPT09IDEpIHtcblx0XHRcdFx0XHRjb25zdCB0b3VjaCA9IGV2ZW50LnRvdWNoZXNbMF1cblx0XHRcdFx0XHRjb25zdCBuZXdUb3VjaFBvcyA9IHRvdWNoLnBhZ2VYXG5cdFx0XHRcdFx0Y29uc3Qgc2lkZUNvbFJlY3QgPSBzaWRlQ29sLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cdFx0XHRcdFx0b2xkR2VzdHVyZUluZm8gPSBsYXN0R2VzdHVyZUluZm9cblx0XHRcdFx0XHRjb25zdCBzYWZlTGFzdEluZm8gPSAobGFzdEdlc3R1cmVJbmZvID0gZ2VzdHVyZUluZm9Gcm9tVG91Y2godG91Y2gpKVxuXG5cdFx0XHRcdFx0Ly8gSWYgd2UgaGF2ZSBob3Jpem9uYWwgbG9jayBvciB3ZSBkb24ndCBoYXZlIHZlcnRpY2FsIGxvY2sgYnV0IHdvdWxkIGxpa2UgdG8gYWNxdWlyZSBob3Jpem9udGFsIG9uZSwgdGhlIGxvY2sgaG9yaXpvbnRhbGx5XG5cdFx0XHRcdFx0aWYgKGRpcmVjdGlvbkxvY2sgPT09IEhPUklaT05UQUwgfHwgKGRpcmVjdGlvbkxvY2sgIT09IFZFUlRJQ0FMICYmIE1hdGguYWJzKHNhZmVMYXN0SW5mby54IC0gc2FmZUluaXRpYWxHZXN0dXJlSW5mby54KSA+IDMwKSkge1xuXHRcdFx0XHRcdFx0ZGlyZWN0aW9uTG9jayA9IEhPUklaT05UQUxcblxuXHRcdFx0XHRcdFx0Ly8gR2VzdHVyZSBmb3Igc2lkZSBjb2x1bW5cblx0XHRcdFx0XHRcdGlmICh0aGlzLmdldEJhY2tncm91bmRDb2x1bW5zKClbMF0uaXNWaXNpYmxlIHx8IHRoaXMuZm9jdXNlZENvbHVtbi5pc0luRm9yZWdyb3VuZCkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBuZXdUcmFuc2xhdGUgPSBNYXRoLm1pbihzaWRlQ29sUmVjdC5sZWZ0IC0gKGdlc3R1cmVJbmZvLnggLSBuZXdUb3VjaFBvcyksIDApXG5cdFx0XHRcdFx0XHRcdHNpZGVDb2wuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVgoJHtuZXdUcmFuc2xhdGV9cHgpYFxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Ly8gR2VzdHVyZSBmb3IgYmFja2dyb3VuZCBjb2x1bW5cblx0XHRcdFx0XHRcdFx0Y29uc3Qgc2xpZGluZ0RvbVJlY3QgPSB0aGlzLmRvbVNsaWRpbmdQYXJ0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cblx0XHRcdFx0XHRcdFx0Ly8gRG8gbm90IGFsbG93IHRvIG1vdmUgY29sdW1uIHRvIHRoZSBsZWZ0XG5cdFx0XHRcdFx0XHRcdGNvbnN0IG5ld1RyYW5zbGF0ZSA9IE1hdGgubWF4KHNsaWRpbmdEb21SZWN0LmxlZnQgLSAoZ2VzdHVyZUluZm8ueCAtIG5ld1RvdWNoUG9zKSwgLXRoaXMuZm9jdXNlZENvbHVtbi5vZmZzZXQpXG5cdFx0XHRcdFx0XHRcdHRoaXMuZG9tU2xpZGluZ1BhcnQuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVgoJHtuZXdUcmFuc2xhdGV9cHgpYFxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBTY3JvbGwgZXZlbnRzIGFyZSBub3QgY2FuY2VsbGFibGUgYW5kIGJyb3dzZWVzIGNvbXBsYWluIGEgbG90XG5cdFx0XHRcdFx0XHRpZiAoZXZlbnQuY2FuY2VsYWJsZSAhPT0gZmFsc2UpIGV2ZW50LnByZXZlbnREZWZhdWx0KCkgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhIHZlcnRpY2FsIGxvY2sgYnV0IHdlIHdvdWxkIGxpa2UgdG8gYWNxdWlyZSBvbmUsIGdldCBpdFxuXHRcdFx0XHRcdH0gZWxzZSBpZiAoZGlyZWN0aW9uTG9jayAhPT0gVkVSVElDQUwgJiYgTWF0aC5hYnMoc2FmZUxhc3RJbmZvLnkgLSBzYWZlSW5pdGlhbEdlc3R1cmVJbmZvLnkpID4gMzApIHtcblx0XHRcdFx0XHRcdGRpcmVjdGlvbkxvY2sgPSBWRVJUSUNBTFxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHR0b3VjaGVuZDogZ2VzdHVyZUVuZCxcblx0XHRcdHRvdWNoY2FuY2VsOiBnZXN0dXJlRW5kLFxuXHRcdH1cblxuXHRcdGZvciAobGV0IFtuYW1lLCBsaXN0ZW5lcl0gb2YgT2JqZWN0LmVudHJpZXMobGlzdGVuZXJzKSkge1xuXHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGxpc3RlbmVyLCB0cnVlKVxuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHsgbGFuZywgVHJhbnNsYXRpb25LZXkgfSBmcm9tIFwiLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBDbGlja0hhbmRsZXIgfSBmcm9tIFwiLi9iYXNlL0d1aVV0aWxzLmpzXCJcbmltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi90aGVtZS5qc1wiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuL3NpemUuanNcIlxuaW1wb3J0IHsgQmFzZUJ1dHRvbiwgQmFzZUJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4vYmFzZS9idXR0b25zL0Jhc2VCdXR0b24uanNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIE1haW5DcmVhdGVCdXR0b25BdHRycyB7XG5cdGxhYmVsOiBUcmFuc2xhdGlvbktleVxuXHRjbGljazogQ2xpY2tIYW5kbGVyXG5cdGNsYXNzPzogc3RyaW5nXG59XG5cbi8qKlxuICogTWFpbiBidXR0b24gdXNlZCB0byBvcGVuIHRoZSBjcmVhdGlvbiBkaWFsb2cgZm9yIGVtYWlscyxjb250YWN0cyBhbmQgZXZlbnRzLlxuICovXG5leHBvcnQgY2xhc3MgTWFpbkNyZWF0ZUJ1dHRvbiBpbXBsZW1lbnRzIENvbXBvbmVudDxNYWluQ3JlYXRlQnV0dG9uQXR0cnM+IHtcblx0dmlldyh2bm9kZTogVm5vZGU8TWFpbkNyZWF0ZUJ1dHRvbkF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShCYXNlQnV0dG9uLCB7XG5cdFx0XHRsYWJlbDogdm5vZGUuYXR0cnMubGFiZWwsXG5cdFx0XHR0ZXh0OiBsYW5nLmdldCh2bm9kZS5hdHRycy5sYWJlbCksXG5cdFx0XHRvbmNsaWNrOiB2bm9kZS5hdHRycy5jbGljayxcblx0XHRcdGNsYXNzOiBgZnVsbC13aWR0aCBib3JkZXItcmFkaXVzLWJpZyBjZW50ZXIgYiBmbGFzaCAke3Zub2RlLmF0dHJzLmNsYXNzfWAsXG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRib3JkZXI6IGAycHggc29saWQgJHt0aGVtZS5jb250ZW50X2FjY2VudH1gLFxuXHRcdFx0XHQvLyBtYXRjaGluZyB0b29sYmFyXG5cdFx0XHRcdGhlaWdodDogcHgoc2l6ZS5idXR0b25faGVpZ2h0ICsgc2l6ZS52cGFkX3hzICogMiksXG5cdFx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X2FjY2VudCxcblx0XHRcdH0sXG5cdFx0fSBzYXRpc2ZpZXMgQmFzZUJ1dHRvbkF0dHJzKVxuXHR9XG59XG4iLCJpbXBvcnQgeyBGZWF0dXJlVHlwZSB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vLi4vYXBpL21haW4vQ29tbW9uTG9jYXRvci5qc1wiXG5pbXBvcnQgeyBMb2dpbkNvbnRyb2xsZXIgfSBmcm9tIFwiLi4vLi4vYXBpL21haW4vTG9naW5Db250cm9sbGVyLmpzXCJcblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dVcGdyYWRlRGlhbG9nKCkge1xuXHRpbXBvcnQoXCIuLi8uLi9zdWJzY3JpcHRpb24vVXBncmFkZVN1YnNjcmlwdGlvbldpemFyZC5qc1wiKS50aGVuKCh1cGdyYWRlV2l6YXJkKSA9PiB1cGdyYWRlV2l6YXJkLnNob3dVcGdyYWRlV2l6YXJkKGxvY2F0b3IubG9naW5zKSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNob3dTdXBwb3J0RGlhbG9nKGxvZ2luczogTG9naW5Db250cm9sbGVyKSB7XG5cdGltcG9ydChcIi4uLy4uL3N1cHBvcnQvU3VwcG9ydERpYWxvZy5qc1wiKS50aGVuKChzdXBwb3J0TW9kdWxlKSA9PiBzdXBwb3J0TW9kdWxlLnNob3dTdXBwb3J0RGlhbG9nKGxvZ2lucykpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc05ld01haWxBY3Rpb25BdmFpbGFibGUoKTogYm9vbGVhbiB7XG5cdHJldHVybiBsb2NhdG9yLmxvZ2lucy5pc0ludGVybmFsVXNlckxvZ2dlZEluKCkgJiYgIWxvY2F0b3IubG9naW5zLmlzRW5hYmxlZChGZWF0dXJlVHlwZS5SZXBseU9ubHkpXG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IE5ld3NJZCB9IGZyb20gXCIuLi8uLi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgTmV3c0xpc3RJdGVtIH0gZnJvbSBcIi4vTmV3c0xpc3RJdGVtLmpzXCJcbmltcG9ydCBDb2x1bW5FbXB0eU1lc3NhZ2VCb3ggZnJvbSBcIi4uLy4uL2d1aS9iYXNlL0NvbHVtbkVtcHR5TWVzc2FnZUJveC5qc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi8uLi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvaWNvbnMvSWNvbnMuanNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIE5ld3NMaXN0QXR0cnMge1xuXHRsaXZlTmV3c0xpc3RJdGVtczogUmVjb3JkPHN0cmluZywgTmV3c0xpc3RJdGVtPlxuXHRsaXZlTmV3c0lkczogTmV3c0lkW11cbn1cblxuLyoqXG4gKiBSZW5kZXJzIHRoZSB1c2VyJ3MgbGlzdCBvZiB1bmFja25vd2xlZGdlZCBuZXdzLlxuICovXG5leHBvcnQgY2xhc3MgTmV3c0xpc3QgaW1wbGVtZW50cyBDb21wb25lbnQ8TmV3c0xpc3RBdHRycz4ge1xuXHR2aWV3KHZub2RlOiBWbm9kZTxOZXdzTGlzdEF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRpZiAodm5vZGUuYXR0cnMubGl2ZU5ld3NJZHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gbShDb2x1bW5FbXB0eU1lc3NhZ2VCb3gsIHtcblx0XHRcdFx0bWVzc2FnZTogXCJub05ld3NfbXNnXCIsXG5cdFx0XHRcdGljb246IEljb25zLkJ1bGIsXG5cdFx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X21lc3NhZ2VfYmcsXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCJcIixcblx0XHRcdHZub2RlLmF0dHJzLmxpdmVOZXdzSWRzLm1hcCgobGl2ZU5ld3NJZCkgPT4ge1xuXHRcdFx0XHRjb25zdCBuZXdzTGlzdEl0ZW0gPSB2bm9kZS5hdHRycy5saXZlTmV3c0xpc3RJdGVtc1tsaXZlTmV3c0lkLm5ld3NJdGVtTmFtZV1cblxuXHRcdFx0XHRyZXR1cm4gbShcIi5wdC5wbC1sLnByLWwuZmxleC5maWxsLmJvcmRlci1ncmV5LmxlZnQubGlzdC1ib3JkZXItYm90dG9tXCIsIHsga2V5OiBsaXZlTmV3c0lkLm5ld3NJdGVtSWQgfSwgbmV3c0xpc3RJdGVtLnJlbmRlcihsaXZlTmV3c0lkKSlcblx0XHRcdH0pLFxuXHRcdClcblx0fVxufVxuIiwiaW1wb3J0IHsgQnV0dG9uQXR0cnMsIEJ1dHRvblR5cGUgfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCBtLCB7IENvbXBvbmVudCB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IERpYWxvZ0hlYWRlckJhciwgRGlhbG9nSGVhZGVyQmFyQXR0cnMgfSBmcm9tIFwiLi4vLi4vZ3VpL2Jhc2UvRGlhbG9nSGVhZGVyQmFyLmpzXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgRGlhbG9nLCBEaWFsb2dUeXBlIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL0RpYWxvZy5qc1wiXG5pbXBvcnQgeyBLZXlzIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgTmV3c0xpc3QgfSBmcm9tIFwiLi9OZXdzTGlzdC5qc1wiXG5pbXBvcnQgeyBOZXdzTW9kZWwgfSBmcm9tIFwiLi9OZXdzTW9kZWwuanNcIlxuaW1wb3J0IHsgcHJvZ3Jlc3NJY29uIH0gZnJvbSBcIi4uLy4uL2d1aS9iYXNlL0ljb24uanNcIlxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd05ld3NEaWFsb2cobmV3c01vZGVsOiBOZXdzTW9kZWwpIHtcblx0Y29uc3QgY2xvc2VCdXR0b246IEJ1dHRvbkF0dHJzID0ge1xuXHRcdGxhYmVsOiBcImNsb3NlX2FsdFwiLFxuXHRcdHR5cGU6IEJ1dHRvblR5cGUuU2Vjb25kYXJ5LFxuXHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRjbG9zZUFjdGlvbigpXG5cdFx0fSxcblx0fVxuXG5cdGNvbnN0IGNsb3NlQWN0aW9uID0gKCkgPT4ge1xuXHRcdGRpYWxvZy5jbG9zZSgpXG5cdH1cblx0Y29uc3QgaGVhZGVyOiBEaWFsb2dIZWFkZXJCYXJBdHRycyA9IHtcblx0XHRsZWZ0OiBbY2xvc2VCdXR0b25dLFxuXHRcdG1pZGRsZTogXCJuZXdzX2xhYmVsXCIsXG5cdH1cblxuXHRsZXQgbG9hZGVkID0gZmFsc2Vcblx0bmV3c01vZGVsLmxvYWROZXdzSWRzKCkudGhlbigoKSA9PiB7XG5cdFx0bG9hZGVkID0gdHJ1ZVxuXHRcdG0ucmVkcmF3KClcblx0fSlcblxuXHRjb25zdCBjaGlsZDogQ29tcG9uZW50ID0ge1xuXHRcdHZpZXc6ICgpID0+IHtcblx0XHRcdHJldHVybiBbXG5cdFx0XHRcdG0oXCJcIiwgW1xuXHRcdFx0XHRcdGxvYWRlZFxuXHRcdFx0XHRcdFx0PyBtKE5ld3NMaXN0LCB7XG5cdFx0XHRcdFx0XHRcdFx0bGl2ZU5ld3NJZHM6IG5ld3NNb2RlbC5saXZlTmV3c0lkcyxcblx0XHRcdFx0XHRcdFx0XHRsaXZlTmV3c0xpc3RJdGVtczogbmV3c01vZGVsLmxpdmVOZXdzTGlzdEl0ZW1zLFxuXHRcdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdFx0OiBtKFxuXHRcdFx0XHRcdFx0XHRcdFwiLmZsZXgtY2VudGVyLm10LWxcIixcblx0XHRcdFx0XHRcdFx0XHRtKFwiLmZsZXgtdi1jZW50ZXJcIiwgW20oXCIuZnVsbC13aWR0aC5mbGV4LWNlbnRlclwiLCBwcm9ncmVzc0ljb24oKSksIG0oXCJwXCIsIGxhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KFwicGxlYXNlV2FpdF9tc2dcIikpXSksXG5cdFx0XHRcdFx0XHQgICksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XVxuXHRcdH0sXG5cdH1cblxuXHRjb25zdCBkaWFsb2cgPSBuZXcgRGlhbG9nKERpYWxvZ1R5cGUuRWRpdExhcmdlLCB7XG5cdFx0dmlldzogKCkgPT4ge1xuXHRcdFx0cmV0dXJuIG0oXCJcIiwgW20oRGlhbG9nSGVhZGVyQmFyLCBoZWFkZXIpLCBtKFwiLmRpYWxvZy1jb250YWluZXIuc2Nyb2xsXCIsIG0oXCIuZmlsbC1hYnNvbHV0ZVwiLCBtKGNoaWxkKSkpXSlcblx0XHR9LFxuXHR9KS5hZGRTaG9ydGN1dCh7XG5cdFx0a2V5OiBLZXlzLkVTQyxcblx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRjbG9zZUFjdGlvbigpXG5cdFx0fSxcblx0XHRoZWxwOiBcImNsb3NlX2FsdFwiLFxuXHR9KVxuXHRkaWFsb2cuc2hvdygpXG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IEJ1dHRvbkNvbG9yIH0gZnJvbSBcIi4uL2Jhc2UvQnV0dG9uLmpzXCJcbmltcG9ydCB7IEJvb3RJY29ucyB9IGZyb20gXCIuLi9iYXNlL2ljb25zL0Jvb3RJY29uc1wiXG5pbXBvcnQgeyBzaG93U3VwcG9ydERpYWxvZywgc2hvd1VwZ3JhZGVEaWFsb2cgfSBmcm9tIFwiLi9OYXZGdW5jdGlvbnNcIlxuaW1wb3J0IHsgaXNJT1NBcHAgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgTG9nb3V0VXJsLCBTRVRUSU5HU19QUkVGSVggfSBmcm9tIFwiLi4vLi4vbWlzYy9Sb3V0ZUNoYW5nZVwiXG5pbXBvcnQgeyBnZXRTYWZlQXJlYUluc2V0TGVmdCB9IGZyb20gXCIuLi9IdG1sVXRpbHNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vYmFzZS9pY29ucy9JY29uc1wiXG5pbXBvcnQgeyBBcmlhTGFuZG1hcmtzLCBsYW5kbWFya0F0dHJzIH0gZnJvbSBcIi4uL0FyaWFVdGlsc1wiXG5pbXBvcnQgeyBjcmVhdGVEcm9wZG93biB9IGZyb20gXCIuLi9iYXNlL0Ryb3Bkb3duLmpzXCJcbmltcG9ydCB7IGtleU1hbmFnZXIgfSBmcm9tIFwiLi4vLi4vbWlzYy9LZXlNYW5hZ2VyXCJcbmltcG9ydCB7IENvdW50ZXJCYWRnZSB9IGZyb20gXCIuLi9iYXNlL0NvdW50ZXJCYWRnZS5qc1wiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi9zaXplLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uL3RoZW1lLmpzXCJcbmltcG9ydCB7IHNob3dOZXdzRGlhbG9nIH0gZnJvbSBcIi4uLy4uL21pc2MvbmV3cy9OZXdzRGlhbG9nLmpzXCJcbmltcG9ydCB7IExvZ2luQ29udHJvbGxlciB9IGZyb20gXCIuLi8uLi9hcGkvbWFpbi9Mb2dpbkNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgTmV3c01vZGVsIH0gZnJvbSBcIi4uLy4uL21pc2MvbmV3cy9OZXdzTW9kZWwuanNcIlxuaW1wb3J0IHsgRGVza3RvcFN5c3RlbUZhY2FkZSB9IGZyb20gXCIuLi8uLi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9EZXNrdG9wU3lzdGVtRmFjYWRlLmpzXCJcbmltcG9ydCB7IHN0eWxlcyB9IGZyb20gXCIuLi9zdHlsZXMuanNcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbiB9IGZyb20gXCIuLi9iYXNlL0ljb25CdXR0b24uanNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIERyYXdlck1lbnVBdHRycyB7XG5cdGxvZ2luczogTG9naW5Db250cm9sbGVyXG5cdG5ld3NNb2RlbDogTmV3c01vZGVsXG5cdGRlc2t0b3BTeXN0ZW1GYWNhZGU6IERlc2t0b3BTeXN0ZW1GYWNhZGUgfCBudWxsXG59XG5cbmV4cG9ydCBjbGFzcyBEcmF3ZXJNZW51IGltcGxlbWVudHMgQ29tcG9uZW50PERyYXdlck1lbnVBdHRycz4ge1xuXHR2aWV3KHZub2RlOiBWbm9kZTxEcmF3ZXJNZW51QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHsgbG9naW5zLCBuZXdzTW9kZWwsIGRlc2t0b3BTeXN0ZW1GYWNhZGUgfSA9IHZub2RlLmF0dHJzXG5cdFx0Y29uc3QgbGl2ZU5ld3NDb3VudCA9IG5ld3NNb2RlbC5saXZlTmV3c0lkcy5sZW5ndGhcblxuXHRcdGNvbnN0IGlzSW50ZXJuYWxVc2VyID0gbG9naW5zLmlzSW50ZXJuYWxVc2VyTG9nZ2VkSW4oKVxuXHRcdGNvbnN0IGlzTG9nZ2VkSW4gPSBsb2dpbnMuaXNVc2VyTG9nZ2VkSW4oKVxuXHRcdGNvbnN0IHVzZXJDb250cm9sbGVyID0gbG9naW5zLmdldFVzZXJDb250cm9sbGVyKClcblxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCJkcmF3ZXItbWVudS5mbGV4LmNvbC5pdGVtcy1jZW50ZXIucHQucGJcIixcblx0XHRcdHtcblx0XHRcdFx0Li4ubGFuZG1hcmtBdHRycyhBcmlhTGFuZG1hcmtzLkNvbnRlbnRpbmZvLCBcImRyYXdlciBtZW51XCIpLFxuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFwicGFkZGluZy1sZWZ0XCI6IGdldFNhZmVBcmVhSW5zZXRMZWZ0KCksXG5cdFx0XHRcdFx0XCJib3JkZXItdG9wLXJpZ2h0LXJhZGl1c1wiOiBzdHlsZXMuaXNEZXNrdG9wTGF5b3V0KCkgPyBweChzaXplLmJvcmRlcl9yYWRpdXNfbGFyZ2VyKSA6IFwiXCIsXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHRtKFwiLmZsZXgtZ3Jvd1wiKSxcblx0XHRcdFx0aXNJbnRlcm5hbFVzZXIgJiYgaXNMb2dnZWRJblxuXHRcdFx0XHRcdD8gbShcIi5uZXdzLWJ1dHRvblwiLCBbXG5cdFx0XHRcdFx0XHRcdG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdGljb246IEljb25zLkJ1bGIsXG5cdFx0XHRcdFx0XHRcdFx0dGl0bGU6IFwibmV3c19sYWJlbFwiLFxuXHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBzaG93TmV3c0RpYWxvZyhuZXdzTW9kZWwpLFxuXHRcdFx0XHRcdFx0XHRcdGNvbG9yczogQnV0dG9uQ29sb3IuRHJhd2VyTmF2LFxuXHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0bGl2ZU5ld3NDb3VudCA+IDBcblx0XHRcdFx0XHRcdFx0XHQ/IG0oQ291bnRlckJhZGdlLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNvdW50OiBsaXZlTmV3c0NvdW50LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRwb3NpdGlvbjoge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRvcDogcHgoMCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmlnaHQ6IHB4KDMpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjb2xvcjogXCJ3aGl0ZVwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRiYWNrZ3JvdW5kOiB0aGVtZS5saXN0X2FjY2VudF9mZyxcblx0XHRcdFx0XHRcdFx0XHQgIH0pXG5cdFx0XHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRcdCAgXSlcblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdGxvZ2lucy5pc0dsb2JhbEFkbWluVXNlckxvZ2dlZEluKCkgJiYgdXNlckNvbnRyb2xsZXIuaXNQcmVtaXVtQWNjb3VudCgpXG5cdFx0XHRcdFx0PyBtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuR2lmdCxcblx0XHRcdFx0XHRcdFx0dGl0bGU6IFwiYnV5R2lmdENhcmRfbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRtLnJvdXRlLnNldChcIi9zZXR0aW5ncy9zdWJzY3JpcHRpb25cIilcblx0XHRcdFx0XHRcdFx0XHRpbXBvcnQoXCIuLi8uLi9zdWJzY3JpcHRpb24vZ2lmdGNhcmRzL1B1cmNoYXNlR2lmdENhcmREaWFsb2dcIikudGhlbigoeyBzaG93UHVyY2hhc2VHaWZ0Q2FyZERpYWxvZyB9KSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gc2hvd1B1cmNoYXNlR2lmdENhcmREaWFsb2coKVxuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdGNvbG9yczogQnV0dG9uQ29sb3IuRHJhd2VyTmF2LFxuXHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdGRlc2t0b3BTeXN0ZW1GYWNhZGVcblx0XHRcdFx0XHQ/IG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5OZXdXaW5kb3csXG5cdFx0XHRcdFx0XHRcdHRpdGxlOiBcIm9wZW5OZXdXaW5kb3dfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0ZGVza3RvcFN5c3RlbUZhY2FkZS5vcGVuTmV3V2luZG93KClcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0Y29sb3JzOiBCdXR0b25Db2xvci5EcmF3ZXJOYXYsXG5cdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0IWlzSU9TQXBwKCkgJiYgaXNMb2dnZWRJbiAmJiB1c2VyQ29udHJvbGxlci5pc0ZyZWVBY2NvdW50KClcblx0XHRcdFx0XHQ/IG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRpY29uOiBCb290SWNvbnMuUHJlbWl1bSxcblx0XHRcdFx0XHRcdFx0dGl0bGU6IFwidXBncmFkZVByZW1pdW1fbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHNob3dVcGdyYWRlRGlhbG9nKCksXG5cdFx0XHRcdFx0XHRcdGNvbG9yczogQnV0dG9uQ29sb3IuRHJhd2VyTmF2LFxuXHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdHRpdGxlOiBcInNob3dIZWxwX2FjdGlvblwiLFxuXHRcdFx0XHRcdGljb246IEJvb3RJY29ucy5IZWxwLFxuXHRcdFx0XHRcdGNsaWNrOiAoZSwgZG9tKSA9PlxuXHRcdFx0XHRcdFx0Y3JlYXRlRHJvcGRvd24oe1xuXHRcdFx0XHRcdFx0XHR3aWR0aDogMzAwLFxuXHRcdFx0XHRcdFx0XHRsYXp5QnV0dG9uczogKCkgPT4gW1xuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcInN1cHBvcnRNZW51X2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4gc2hvd1N1cHBvcnREaWFsb2cobG9naW5zKSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcImtleWJvYXJkU2hvcnRjdXRzX3RpdGxlXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4ga2V5TWFuYWdlci5vcGVuRjFIZWxwKHRydWUpLFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHR9KShlLCBkb20pLFxuXHRcdFx0XHRcdGNvbG9yczogQnV0dG9uQ29sb3IuRHJhd2VyTmF2LFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0aXNJbnRlcm5hbFVzZXJcblx0XHRcdFx0XHQ/IG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRpY29uOiBCb290SWNvbnMuU2V0dGluZ3MsXG5cdFx0XHRcdFx0XHRcdHRpdGxlOiBcInNldHRpbmdzX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBtLnJvdXRlLnNldChTRVRUSU5HU19QUkVGSVgpLFxuXHRcdFx0XHRcdFx0XHRjb2xvcnM6IEJ1dHRvbkNvbG9yLkRyYXdlck5hdixcblx0XHRcdFx0XHQgIH0pXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRtKEljb25CdXR0b24sIHtcblx0XHRcdFx0XHRpY29uOiBCb290SWNvbnMuTG9nb3V0LFxuXHRcdFx0XHRcdHRpdGxlOiBcInN3aXRjaEFjY291bnRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0Y2xpY2s6ICgpID0+IG0ucm91dGUuc2V0KExvZ291dFVybCksXG5cdFx0XHRcdFx0Y29sb3JzOiBCdXR0b25Db2xvci5EcmF3ZXJOYXYsXG5cdFx0XHRcdH0pLFxuXHRcdFx0XSxcblx0XHQpXG5cdH1cbn1cbiIsImltcG9ydCB7IERyYXdlck1lbnUsIERyYXdlck1lbnVBdHRycyB9IGZyb20gXCIuL25hdi9EcmF3ZXJNZW51LmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4vdGhlbWUuanNcIlxuaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgdHlwZSB7IFRyYW5zbGF0aW9uS2V5LCBNYXliZVRyYW5zbGF0aW9uIH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IEFyaWFMYW5kbWFya3MsIGxhbmRtYXJrQXR0cnMgfSBmcm9tIFwiLi9BcmlhVXRpbHMuanNcIlxuaW1wb3J0IHR5cGUgeyBDbGlja0hhbmRsZXIgfSBmcm9tIFwiLi9iYXNlL0d1aVV0aWxzLmpzXCJcbmltcG9ydCB0eXBlIHsgbGF6eSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgTWFpbkNyZWF0ZUJ1dHRvbiB9IGZyb20gXCIuL01haW5DcmVhdGVCdXR0b24uanNcIlxuXG5leHBvcnQgdHlwZSBBdHRycyA9IHtcblx0LyoqIEJ1dHRvbiB0byBiZSBkaXNwbGF5ZWQgb24gdG9wIG9mIHRoZSBjb2x1bW4qL1xuXHRidXR0b246IHsgbGFiZWw6IFRyYW5zbGF0aW9uS2V5OyBjbGljazogQ2xpY2tIYW5kbGVyIH0gfCBudWxsIHwgdW5kZWZpbmVkXG5cdGNvbnRlbnQ6IENoaWxkcmVuXG5cdGFyaWFMYWJlbDogTWF5YmVUcmFuc2xhdGlvblxuXHRkcmF3ZXI6IERyYXdlck1lbnVBdHRyc1xufVxuXG5leHBvcnQgY2xhc3MgRm9sZGVyQ29sdW1uVmlldyBpbXBsZW1lbnRzIENvbXBvbmVudDxBdHRycz4ge1xuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFwiLmZsZXguaGVpZ2h0LTEwMHAubmF2LWJnXCIsIFtcblx0XHRcdG0oRHJhd2VyTWVudSwgYXR0cnMuZHJhd2VyKSxcblx0XHRcdG0oXCIuZm9sZGVyLWNvbHVtbi5mbGV4LWdyb3cub3ZlcmZsb3cteC1oaWRkZW4uZmxleC5jb2xcIiwgbGFuZG1hcmtBdHRycyhBcmlhTGFuZG1hcmtzLk5hdmlnYXRpb24sIGxhbmcuZ2V0VHJhbnNsYXRpb25UZXh0KGF0dHJzLmFyaWFMYWJlbCkpLCBbXG5cdFx0XHRcdHRoaXMucmVuZGVyTWFpbkJ1dHRvbihhdHRycyksXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIuc2Nyb2xsLnNjcm9sbGJhci1ndXR0ZXItc3RhYmxlLW9yLWZhbGxiYWNrLnZpc2libGUtc2Nyb2xsYmFyLm92ZXJmbG93LXgtaGlkZGVuLmZsZXguY29sLmZsZXgtZ3Jvd1wiLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdG9uc2Nyb2xsOiAoZTogRXZlbnRSZWRyYXc8RXZlbnQ+KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGUucmVkcmF3ID0gZmFsc2Vcblx0XHRcdFx0XHRcdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0XHRcdFx0aWYgKGF0dHJzLmJ1dHRvbiA9PSBudWxsIHx8IHRhcmdldC5zY3JvbGxUb3AgPT09IDApIHtcblx0XHRcdFx0XHRcdFx0XHR0YXJnZXQuc3R5bGUuYm9yZGVyVG9wID0gXCJcIlxuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdHRhcmdldC5zdHlsZS5ib3JkZXJUb3AgPSBgMXB4IHNvbGlkICR7dGhlbWUuY29udGVudF9ib3JkZXJ9YFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0YXR0cnMuY29udGVudCxcblx0XHRcdFx0KSxcblx0XHRcdF0pLFxuXHRcdF0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlck1haW5CdXR0b24oYXR0cnM6IEF0dHJzKTogQ2hpbGRyZW4ge1xuXHRcdGlmIChhdHRycy5idXR0b24pIHtcblx0XHRcdHJldHVybiBtKFxuXHRcdFx0XHRcIi5wbHItYnV0dG9uLWRvdWJsZS5zY3JvbGxiYXItZ3V0dGVyLXN0YWJsZS1vci1mYWxsYmFjay5zY3JvbGxcIixcblx0XHRcdFx0bShNYWluQ3JlYXRlQnV0dG9uLCB7IGxhYmVsOiBhdHRycy5idXR0b24ubGFiZWwsIGNsaWNrOiBhdHRycy5idXR0b24uY2xpY2sgfSksXG5cdFx0XHQpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZCwgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgdHlwZSB7IE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi90aGVtZVwiXG5pbXBvcnQgU3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5cbmV4cG9ydCB0eXBlIFNpZGViYXJTZWN0aW9uQXR0cnMgPSB7XG5cdG5hbWU6IE1heWJlVHJhbnNsYXRpb25cblx0YnV0dG9uPzogQ2hpbGRcblx0aGlkZUlmRW1wdHk/OiB0cnVlXG59XG5cbmV4cG9ydCBjbGFzcyBTaWRlYmFyU2VjdGlvbiBpbXBsZW1lbnRzIENvbXBvbmVudDxTaWRlYmFyU2VjdGlvbkF0dHJzPiB7XG5cdGV4cGFuZGVkOiBTdHJlYW08Ym9vbGVhbj4gPSBzdHJlYW0odHJ1ZSlcblxuXHR2aWV3KHZub2RlOiBWbm9kZTxTaWRlYmFyU2VjdGlvbkF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IG5hbWUsIGJ1dHRvbiwgaGlkZUlmRW1wdHkgfSA9IHZub2RlLmF0dHJzXG5cdFx0Y29uc3QgY29udGVudCA9IHZub2RlLmNoaWxkcmVuXG5cdFx0aWYgKGhpZGVJZkVtcHR5ICYmIGNvbnRlbnQgPT0gZmFsc2UpIHJldHVybiBudWxsIC8vIFVzaW5nIGxvb3NlIGVxdWFsaXR5IHRvIGNoZWNrIGlmIGNoaWxkcmVuIGhhcyBhbnkgY29udGVudHNcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLnNpZGViYXItc2VjdGlvblwiLFxuXHRcdFx0e1xuXHRcdFx0XHRcImRhdGEtdGVzdGlkXCI6IGBzZWN0aW9uOiR7bGFuZy5nZXRUZXN0SWQobmFtZSl9YCxcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRjb2xvcjogdGhlbWUubmF2aWdhdGlvbl9idXR0b24sXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHRtKFwiLmZvbGRlci1yb3cuZmxleC1zcGFjZS1iZXR3ZWVuLnBsci1idXR0b24ucHQtcy5idXR0b24taGVpZ2h0XCIsIFtcblx0XHRcdFx0XHRtKFwic21hbGwuYi5hbGlnbi1zZWxmLWNlbnRlci50ZXh0LWVsbGlwc2lzLnBsci1idXR0b25cIiwgbGFuZy5nZXRUcmFuc2xhdGlvblRleHQobmFtZSkudG9Mb2NhbGVVcHBlckNhc2UoKSksXG5cdFx0XHRcdFx0YnV0dG9uID8/IG51bGwsXG5cdFx0XHRcdF0pLFxuXHRcdFx0XHRjb250ZW50LFxuXHRcdFx0XSxcblx0XHQpXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgc3R5bGVzIH0gZnJvbSBcIi4vc3R5bGVzLmpzXCJcblxuZXhwb3J0IGludGVyZmFjZSBCYWNrZ3JvdW5kQ29sdW1uTGF5b3V0QXR0cnMge1xuXHRtb2JpbGVIZWFkZXI6ICgpID0+IENoaWxkcmVuXG5cdGRlc2t0b3BUb29sYmFyOiAoKSA9PiBDaGlsZHJlblxuXHRjb2x1bW5MYXlvdXQ6IENoaWxkcmVuXG5cdGJhY2tncm91bmRDb2xvcj86IHN0cmluZ1xuXHRmbG9hdGluZ0FjdGlvbkJ1dHRvbj86ICgpID0+IENoaWxkcmVuXG5cdGNsYXNzZXM/OiBzdHJpbmdcbn1cblxuLyoqXG4gKiBBIGxheW91dCBjb21wb25lbnQgdGhhdCBvcmdhbml6ZXMgdGhlIGNvbHVtbi5cbiAqIFJlbmRlcnMgYSBmcmFtZSBmb3IgdGhlIGxheW91dCBhbmQgZWl0aGVyIG1vYmlsZSBoZWFkZXIgb3IgZGVza3RvcCB0b29sYmFyLlxuICovXG5leHBvcnQgY2xhc3MgQmFja2dyb3VuZENvbHVtbkxheW91dCBpbXBsZW1lbnRzIENvbXBvbmVudDxCYWNrZ3JvdW5kQ29sdW1uTGF5b3V0QXR0cnM+IHtcblx0dmlldyh7IGF0dHJzIH06IFZub2RlPEJhY2tncm91bmRDb2x1bW5MYXlvdXRBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5saXN0LWNvbHVtbi5mbGV4LmNvbC5maWxsLWFic29sdXRlXCIsXG5cdFx0XHR7XG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0YmFja2dyb3VuZENvbG9yOiBhdHRycy5iYWNrZ3JvdW5kQ29sb3IsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNsYXNzOiBhdHRycy5jbGFzc2VzID8/IFwiXCIsXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHRzdHlsZXMuaXNVc2luZ0JvdHRvbU5hdmlnYXRpb24oKSA/IGF0dHJzLm1vYmlsZUhlYWRlcigpIDogYXR0cnMuZGVza3RvcFRvb2xiYXIoKSxcblx0XHRcdFx0bShcIi5mbGV4LWdyb3cucmVsXCIsIGF0dHJzLmNvbHVtbkxheW91dCksXG5cdFx0XHRcdGF0dHJzLmZsb2F0aW5nQWN0aW9uQnV0dG9uPy4oKSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG59XG4iLCJpbXBvcnQgeyBwdXJlQ29tcG9uZW50IH0gZnJvbSBcIi4vYmFzZS9QdXJlQ29tcG9uZW50LmpzXCJcbmltcG9ydCBtLCB7IENoaWxkcmVuIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgcHgsIHNpemUgfSBmcm9tIFwiLi9zaXplLmpzXCJcblxuZXhwb3J0IGludGVyZmFjZSBCYXNlTW9iaWxlSGVhZGVyQXR0cnMge1xuXHRsZWZ0PzogQ2hpbGRyZW5cblx0Y2VudGVyPzogQ2hpbGRyZW5cblx0cmlnaHQ/OiBDaGlsZHJlblxuXHRpbmplY3Rpb25zPzogQ2hpbGRyZW5cbn1cblxuLyoqXG4gKiBBIGJhc2UgY29tcG9uZW50IHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIGFsbCBtb2JpbGUgaGVhZGVycy5cbiAqL1xuZXhwb3J0IGNvbnN0IEJhc2VNb2JpbGVIZWFkZXIgPSBwdXJlQ29tcG9uZW50KCh7IGxlZnQsIGNlbnRlciwgcmlnaHQsIGluamVjdGlvbnMgfTogQmFzZU1vYmlsZUhlYWRlckF0dHJzKSA9PiB7XG5cdHJldHVybiBtKFxuXHRcdFwiLmZsZXguaXRlbXMtY2VudGVyLnJlbC5idXR0b24taGVpZ2h0Lm10LXNhZmUtaW5zZXQucGxyLXNhZmUtaW5zZXRcIixcblx0XHR7XG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRoZWlnaHQ6IHB4KHNpemUubmF2YmFyX2hlaWdodF9tb2JpbGUpLFxuXHRcdFx0fSxcblx0XHR9LFxuXHRcdFtcblx0XHRcdGxlZnQgPz8gbnVsbCxcblx0XHRcdC8vIG5vcm1hbGx5IG1pbi13aWR0aDogaXMgMCBidXQgaW5zaWRlIGZsZXggaXQncyBhdXRvIGFuZCB3ZSBuZWVkIHRvIHRlYWNoIGl0IGhvdyB0byBzaHJpbmtcblx0XHRcdG0oXG5cdFx0XHRcdFwiLmZsZXgtZ3Jvdy5mbGV4Lml0ZW1zLWNlbnRlci5taW4td2lkdGgtMFwiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y2xhc3M6ICFsZWZ0ID8gXCJtbC1ocGFkX3NtYWxsXCIgOiBcIlwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRjZW50ZXIgPz8gbnVsbCxcblx0XHRcdCksXG5cdFx0XHRyaWdodCA/PyBudWxsLFxuXHRcdFx0aW5qZWN0aW9ucyA/PyBudWxsLFxuXHRcdF0sXG5cdClcbn0pXG4iLCJpbXBvcnQgeyBwdXJlQ29tcG9uZW50IH0gZnJvbSBcIi4vYmFzZS9QdXJlQ29tcG9uZW50LmpzXCJcbmltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgTkJTUCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgQXBwSGVhZGVyQXR0cnMgfSBmcm9tIFwiLi9IZWFkZXIuanNcIlxuaW1wb3J0IHsgQmFzZU1vYmlsZUhlYWRlciB9IGZyb20gXCIuL0Jhc2VNb2JpbGVIZWFkZXIuanNcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbiB9IGZyb20gXCIuL2Jhc2UvSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBCb290SWNvbnMgfSBmcm9tIFwiLi9iYXNlL2ljb25zL0Jvb3RJY29ucy5qc1wiXG5pbXBvcnQgeyBzdHlsZXMgfSBmcm9tIFwiLi9zdHlsZXMuanNcIlxuaW1wb3J0IHsgT2ZmbGluZUluZGljYXRvciB9IGZyb20gXCIuL2Jhc2UvT2ZmbGluZUluZGljYXRvci5qc1wiXG5pbXBvcnQgeyBQcm9ncmVzc0JhciB9IGZyb20gXCIuL2Jhc2UvUHJvZ3Jlc3NCYXIuanNcIlxuaW1wb3J0IHsgQ291bnRlckJhZGdlIH0gZnJvbSBcIi4vYmFzZS9Db3VudGVyQmFkZ2UuanNcIlxuaW1wb3J0IHsgcHggfSBmcm9tIFwiLi9zaXplLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4vdGhlbWUuanNcIlxuaW1wb3J0IHsgTmV3c01vZGVsIH0gZnJvbSBcIi4uL21pc2MvbmV3cy9OZXdzTW9kZWwuanNcIlxuaW1wb3J0IHsgQ2xpY2tIYW5kbGVyIH0gZnJvbSBcIi4vYmFzZS9HdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBsYW5nLCBNYXliZVRyYW5zbGF0aW9uIH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIE1vYmlsZUhlYWRlckF0dHJzIGV4dGVuZHMgQXBwSGVhZGVyQXR0cnMge1xuXHRjb2x1bW5UeXBlOiBcImZpcnN0XCIgfCBcIm90aGVyXCJcblx0LyoqIEFjdGlvbnMgdGhhdCBzaG91bGQgYmUgZGlzcGxheWVkIG9uIHRoZSBvcHBvc2l0ZSBzaWRlIG9mIG1lbnUvYmFjayBidXR0b24uICovXG5cdGFjdGlvbnM6IENoaWxkcmVuXG5cdC8qKiBMaWtlIGFjdGlvbnMgdGhhdCBhcmUgb25seSBzdXBwb3NlZCB0byBiZSBkaXNwbGF5ZWQgaW4gbXVsdGktY29sdW1uIGxheW91dCAqL1xuXHRtdWx0aWNvbHVtbkFjdGlvbnM/OiAoKSA9PiBDaGlsZHJlblxuXHQvKipcblx0ICogQW4gYWN0aW9uIHRoYXQgaXMgZGlzcGxheWVkIGluIHRoZSBjb3JuZXIgb2YgdGhlIHNjcmVlbiBvcHBvc2l0ZSBvZiBtZW51L2JhY2sgYnV0dG9uLCB3aWxsIGJlIGRpc3BsYXllZCBpbiBhbnkgY29sdW1uIGluIHNpbmdsZSBjb2x1bW4gbGF5b3V0IG9yXG5cdCAqIGluIHRoZSBzZWNvbmQgY29sdW1uIGluIHR3byBjb2x1bW4gbGF5b3V0LlxuXHQgKi9cblx0cHJpbWFyeUFjdGlvbjogKCkgPT4gQ2hpbGRyZW5cblx0dGl0bGU/OiBNYXliZVRyYW5zbGF0aW9uXG5cdGJhY2tBY3Rpb246ICgpID0+IHVua25vd25cblx0dXNlQmFja0J1dHRvbj86IGJvb2xlYW5cbn1cblxuLyoqXG4gKiBBIGNvbXBvbmVudCB0aGF0IHJlbmRlcnMgYSBcInN0YW5kYXJkXCIgbW9iaWxlIGhlYWRlci4gSXQgaGFzIG1lbnUvYmFjayBidXR0b24gd2l0aCBvZmZsaW5lIGluZGljYXRvciwgdGl0bGUgYW5kIG9ubGluZSBzdGF0dXMsIHN5bmMgcHJvZ3Jlc3MgYW5kIHNvbWVcbiAqIGFjdGlvbnMuXG4gKlxuICogSXQgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBpbiBib3RoIHRoZSBmaXJzdCAoXCJsaXN0XCIpIGFuZCB0aGUgc2Vjb25kIChcInZpZXdlclwiKSBjb2x1bW5zLiBJdCB3aWxsIGF1dG9tYXRpY2FsbHkgZmlndXJlIHdoZXRoZXIgaXQgc2hvdWxkIGRpc3BsYXkgbWVudS9iYWNrXG4gKiBidXR0b24sIHRpdGxlIGFuZCBhY3Rpb25zLlxuICovXG5leHBvcnQgY2xhc3MgTW9iaWxlSGVhZGVyIGltcGxlbWVudHMgQ29tcG9uZW50PE1vYmlsZUhlYWRlckF0dHJzPiB7XG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxNb2JpbGVIZWFkZXJBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgZmlyc3RWaXNpYmxlQ29sdW1uID0gYXR0cnMuY29sdW1uVHlwZSA9PT0gXCJmaXJzdFwiIHx8IHN0eWxlcy5pc1NpbmdsZUNvbHVtbkxheW91dCgpXG5cdFx0cmV0dXJuIG0oQmFzZU1vYmlsZUhlYWRlciwge1xuXHRcdFx0bGVmdDogdGhpcy5yZW5kZXJMZWZ0QWN0aW9uKGF0dHJzKSxcblx0XHRcdGNlbnRlcjogZmlyc3RWaXNpYmxlQ29sdW1uXG5cdFx0XHRcdD8gbShNb2JpbGVIZWFkZXJUaXRsZSwge1xuXHRcdFx0XHRcdFx0dGl0bGU6IGF0dHJzLnRpdGxlID8gbGFuZy5nZXRUcmFuc2xhdGlvblRleHQoYXR0cnMudGl0bGUpIDogdW5kZWZpbmVkLFxuXHRcdFx0XHRcdFx0Ym90dG9tOiBtKE9mZmxpbmVJbmRpY2F0b3IsIGF0dHJzLm9mZmxpbmVJbmRpY2F0b3JNb2RlbC5nZXRDdXJyZW50QXR0cnMoKSksXG5cdFx0XHRcdCAgfSlcblx0XHRcdFx0OiBudWxsLFxuXHRcdFx0cmlnaHQ6IFtcblx0XHRcdFx0c3R5bGVzLmlzU2luZ2xlQ29sdW1uTGF5b3V0KCkgPyBudWxsIDogYXR0cnMubXVsdGljb2x1bW5BY3Rpb25zPy4oKSxcblx0XHRcdFx0YXR0cnMuYWN0aW9ucyxcblx0XHRcdFx0c3R5bGVzLmlzU2luZ2xlQ29sdW1uTGF5b3V0KCkgfHwgYXR0cnMuY29sdW1uVHlwZSA9PT0gXCJvdGhlclwiID8gYXR0cnMucHJpbWFyeUFjdGlvbigpIDogbnVsbCxcblx0XHRcdF0sXG5cdFx0XHRpbmplY3Rpb25zOiBmaXJzdFZpc2libGVDb2x1bW4gPyBtKFByb2dyZXNzQmFyLCB7IHByb2dyZXNzOiBhdHRycy5vZmZsaW5lSW5kaWNhdG9yTW9kZWwuZ2V0UHJvZ3Jlc3MoKSB9KSA6IG51bGwsXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTGVmdEFjdGlvbihhdHRyczogTW9iaWxlSGVhZGVyQXR0cnMpIHtcblx0XHRpZiAoYXR0cnMuY29sdW1uVHlwZSA9PT0gXCJmaXJzdFwiICYmICFhdHRycy51c2VCYWNrQnV0dG9uKSB7XG5cdFx0XHRyZXR1cm4gbShNb2JpbGVIZWFkZXJNZW51QnV0dG9uLCB7IG5ld3NNb2RlbDogYXR0cnMubmV3c01vZGVsLCBiYWNrQWN0aW9uOiBhdHRycy5iYWNrQWN0aW9uIH0pXG5cdFx0fSBlbHNlIGlmIChzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKSB8fCBhdHRycy51c2VCYWNrQnV0dG9uKSB7XG5cdFx0XHRyZXR1cm4gbShNb2JpbGVIZWFkZXJCYWNrQnV0dG9uLCB7IGJhY2tBY3Rpb246IGF0dHJzLmJhY2tBY3Rpb24gfSlcblx0XHR9XG5cblx0XHRyZXR1cm4gbnVsbFxuXHR9XG59XG5cbmV4cG9ydCBjb25zdCBNb2JpbGVIZWFkZXJCYWNrQnV0dG9uID0gcHVyZUNvbXBvbmVudCgoeyBiYWNrQWN0aW9uIH06IHsgYmFja0FjdGlvbjogKCkgPT4gdW5rbm93biB9KSA9PiB7XG5cdHJldHVybiBtKEljb25CdXR0b24sIHtcblx0XHR0aXRsZTogXCJiYWNrX2FjdGlvblwiLFxuXHRcdGljb246IEJvb3RJY29ucy5CYWNrLFxuXHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRiYWNrQWN0aW9uKClcblx0XHR9LFxuXHR9KVxufSlcblxuZXhwb3J0IGNvbnN0IE1vYmlsZUhlYWRlclRpdGxlID0gcHVyZUNvbXBvbmVudCgoeyB0aXRsZSwgYm90dG9tLCBvblRhcCB9OiB7IHRpdGxlPzogc3RyaW5nIHwgQ2hpbGRyZW47IGJvdHRvbTogQ2hpbGRyZW47IG9uVGFwPzogQ2xpY2tIYW5kbGVyIH0pID0+IHtcblx0Ly8gbm9ybWFsbHkgbWluLXdpZHRoOiBpcyAwIGJ1dCBpbnNpZGUgZmxleCBpdCdzIGF1dG8gYW5kIHdlIG5lZWQgdG8gdGVhY2ggaXQgaG93IHRvIHNocmlua1xuXHQvLyBhbGlnbi1zZWxmOiBzdHJldGNoIHJlc3RyaWN0IHRoZSBjaGlsZCB0byB0aGUgcGFyZW50IHdpZHRoXG5cdC8vIHRleHQtZWxsaXBzaXMgYWxyZWFkeSBzZXRzIG1pbi13aWR0aCB0byAwXG5cdHJldHVybiBtKFwiLmZsZXguY29sLml0ZW1zLXN0YXJ0Lm1pbi13aWR0aC0wXCIsIFtcblx0XHRtKFxuXHRcdFx0KG9uVGFwID8gXCJidXR0b25cIiA6IFwiXCIpICsgXCIuZm9udC13ZWlnaHQtNjAwLnRleHQtZWxsaXBzaXMuYWxpZ24tc2VsZi1zdHJldGNoXCIsXG5cdFx0XHR7IG9uY2xpY2s6IChldmVudDogTW91c2VFdmVudCkgPT4gb25UYXA/LihldmVudCwgZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KSB9LFxuXHRcdFx0dGl0bGUgPz8gTkJTUCxcblx0XHQpLFxuXHRcdGJvdHRvbSxcblx0XSlcbn0pXG5cbmV4cG9ydCBjb25zdCBNb2JpbGVIZWFkZXJNZW51QnV0dG9uID0gcHVyZUNvbXBvbmVudCgoeyBuZXdzTW9kZWwsIGJhY2tBY3Rpb24gfTogeyBuZXdzTW9kZWw6IE5ld3NNb2RlbDsgYmFja0FjdGlvbjogKCkgPT4gdW5rbm93biB9KSA9PiB7XG5cdHJldHVybiBtKFwiLnJlbFwiLCBbXG5cdFx0bShJY29uQnV0dG9uLCB7XG5cdFx0XHR0aXRsZTogXCJtZW51X2xhYmVsXCIsXG5cdFx0XHRpY29uOiBCb290SWNvbnMuTW9yZVZlcnRpY2FsLFxuXHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0YmFja0FjdGlvbigpXG5cdFx0XHR9LFxuXHRcdH0pLFxuXHRcdG0oQ291bnRlckJhZGdlLCB7XG5cdFx0XHRjb3VudDogbmV3c01vZGVsLmxpdmVOZXdzSWRzLmxlbmd0aCxcblx0XHRcdHBvc2l0aW9uOiB7XG5cdFx0XHRcdHRvcDogcHgoNCksXG5cdFx0XHRcdHJpZ2h0OiBweCg1KSxcblx0XHRcdH0sXG5cdFx0XHRjb2xvcjogXCJ3aGl0ZVwiLFxuXHRcdFx0YmFja2dyb3VuZDogdGhlbWUubGlzdF9hY2NlbnRfZmcsXG5cdFx0fSksXG5cdF0pXG59KVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSUEsa0JBQWtCO0lBR0wsU0FBTixNQUF5QztDQUMvQyxLQUFLLEVBQUUsVUFBd0IsRUFBWTtBQUMxQyxTQUFPLGdCQUNOLHdCQUNBLGNBQWMsY0FBYyxZQUFZLE1BQU0sRUFDOUMsQUFBQyxTQUEwQixJQUFJLENBQUMsVUFBVSxnQkFBRSxtQkFBbUIsTUFBTSxDQUFDLENBQ3RFO0NBQ0Q7QUFDRDs7OztBQ0RELGtCQUFrQjtJQWlCTCxTQUFOLE1BQW9EO0NBQzFELEtBQUssRUFBRSxPQUEyQixFQUFZO0FBQzdDLFNBQU8sZ0JBQUUsbUJBQW1CLENBQUMsZ0JBQUUsYUFBYSxFQUFFLFVBQVUsTUFBTSxzQkFBc0IsYUFBYSxDQUFFLEVBQUMsRUFBRSxLQUFLLGlCQUFpQixNQUFNLEFBQUMsRUFBQztDQUNwSTs7Ozs7Q0FNRCxBQUFRLGlCQUFpQkEsT0FBOEI7QUFDdEQsU0FBTyxnQkFBRSw0Q0FBNEM7R0FDcEQsTUFBTSxZQUFZLE1BQU0sV0FBVyxHQUFHO0dBQ3RDLGdCQUFFLGtCQUFrQixNQUFNLHNCQUFzQixpQkFBaUIsQ0FBQztHQUNsRSxnQkFBRSxrQkFBa0I7R0FDcEIsZ0JBQUUsUUFBUSxLQUFLLGVBQWUsQ0FBQztFQUMvQixFQUFDO0NBQ0Y7Q0FFRCxBQUFRLGdCQUEwQjtBQUVqQyxTQUFPO0dBQ04sZ0JBQUUsV0FBVztJQUNaLE9BQU87SUFDUCxNQUFNLE1BQU0s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