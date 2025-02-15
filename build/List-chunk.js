import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { isBrowser } from "./Env-chunk.js";
import { client } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { debounce, mapLazily, memoized, numberRange } from "./dist2-chunk.js";
import { DefaultAnimationTime, TransformEnum, animations, ease, opacity, styles, transform } from "./styles-chunk.js";
import { theme } from "./theme-chunk.js";
import { Keys, TabIndex } from "./TutanotaConstants-chunk.js";
import { isKeyPressed } from "./KeyManager-chunk.js";
import { px, size } from "./size-chunk.js";
import { applySafeAreaInsetMarginLR } from "./HtmlUtils-chunk.js";
import { Button, ButtonType } from "./Button-chunk.js";
import { progressIcon } from "./Icon-chunk.js";

//#region src/common/gui/base/SwipeHandler.ts
let DirectionLock = function(DirectionLock$1) {
	DirectionLock$1[DirectionLock$1["Horizontal"] = 0] = "Horizontal";
	DirectionLock$1[DirectionLock$1["Vertical"] = 1] = "Vertical";
	return DirectionLock$1;
}({});
var SwipeHandler = class {
	/** uses clientX/clientY thus relative to view port */
	startPos;
	touchArea;
	animating;
	isAnimating = false;
	directionLock;
	constructor(touchArea) {
		this.startPos = {
			x: 0,
			y: 0
		};
		this.touchArea = touchArea;
		this.animating = Promise.resolve();
		this.directionLock = null;
	}
	attach() {
		this.touchArea.addEventListener("touchstart", this.onTouchStart, { passive: true });
		this.touchArea.addEventListener("touchmove", this.onTouchMove, { passive: false });
		this.touchArea.addEventListener("touchend", this.onTouchEnd, { passive: true });
	}
	detach() {
		this.touchArea.removeEventListener("touchstart", this.onTouchStart);
		this.touchArea.removeEventListener("touchmove", this.onTouchMove);
		this.touchArea.removeEventListener("touchend", this.onTouchEnd);
	}
	onTouchStart = (e) => {
		this.startPos = {
			x: e.touches[0].clientX,
			y: e.touches[0].clientY
		};
	};
	onTouchMove = (e) => {
		let { x, y } = this.getDelta(e);
		if (this.directionLock === DirectionLock.Horizontal || this.directionLock !== DirectionLock.Vertical && Math.abs(x) > Math.abs(y) && Math.abs(x) > 14) {
			this.directionLock = DirectionLock.Horizontal;
			e.preventDefault();
			if (!this.isAnimating) this.onHorizontalDrag(x, y);
		} else if (this.directionLock !== DirectionLock.Vertical && Math.abs(y) > Math.abs(x) && Math.abs(y) > size.list_row_height) {
			this.directionLock = DirectionLock.Vertical;
			if (!this.isAnimating) window.requestAnimationFrame(() => {
				if (!this.isAnimating) this.reset({
					x,
					y
				});
			});
		}
	};
	onTouchEnd = (e) => {
		this.gestureEnd(e);
	};
	gestureEnd(e) {
		const delta = this.getDelta(e);
		if (!this.isAnimating && this.directionLock === DirectionLock.Horizontal) {
			this.animating = this.onHorizontalGestureCompleted(delta);
			this.isAnimating = true;
		} else if (!this.isAnimating) {
			this.animating = this.reset(delta);
			this.isAnimating = true;
		}
		this.animating.then(() => this.isAnimating = false);
		this.directionLock = null;
	}
	onHorizontalDrag(xDelta, yDelta) {}
	onHorizontalGestureCompleted(delta) {
		return Promise.resolve();
	}
	reset(delta) {
		return Promise.resolve();
	}
	getDelta(e) {
		return {
			x: e.changedTouches[0].clientX - this.startPos.x,
			y: e.changedTouches[0].clientY - this.startPos.y
		};
	}
};

//#endregion
//#region src/common/gui/base/ListUtils.ts
const ACTION_DISTANCE = 150;
const PageSize = 100;
function listSelectionKeyboardShortcuts(multiselectMode, callbacks) {
	const multiselectionEnabled = multiselectMode == MultiselectMode.Enabled ? () => true : () => false;
	return [
		{
			key: Keys.UP,
			exec: mapLazily(callbacks, (list) => list?.selectPrevious(false)),
			help: "selectPrevious_action"
		},
		{
			key: Keys.K,
			exec: mapLazily(callbacks, (list) => list?.selectPrevious(false)),
			help: "selectPrevious_action"
		},
		{
			key: Keys.UP,
			shift: true,
			exec: mapLazily(callbacks, (list) => list?.selectPrevious(true)),
			help: "addPrevious_action",
			enabled: multiselectionEnabled
		},
		{
			key: Keys.K,
			shift: true,
			exec: mapLazily(callbacks, (list) => list?.selectPrevious(true)),
			help: "addPrevious_action",
			enabled: multiselectionEnabled
		},
		{
			key: Keys.DOWN,
			exec: mapLazily(callbacks, (list) => list?.selectNext(false)),
			help: "selectNext_action"
		},
		{
			key: Keys.J,
			exec: mapLazily(callbacks, (list) => list?.selectNext(false)),
			help: "selectNext_action"
		},
		{
			key: Keys.DOWN,
			shift: true,
			exec: mapLazily(callbacks, (list) => list?.selectNext(true)),
			help: "addNext_action",
			enabled: multiselectionEnabled
		},
		{
			key: Keys.J,
			shift: true,
			exec: mapLazily(callbacks, (list) => list?.selectNext(true)),
			help: "addNext_action",
			enabled: multiselectionEnabled
		},
		{
			key: Keys.A,
			ctrlOrCmd: true,
			shift: true,
			exec: mapLazily(callbacks, (list) => list?.areAllSelected() ? list.selectNone() : list?.selectAll()),
			help: "selectAllLoaded_action",
			enabled: () => multiselectionEnabled() && !isBrowser()
		}
	];
}
function onlySingleSelection(state) {
	if (state.selectedItems.size === 1) return state.selectedItems.values().next().value;
else return null;
}

//#endregion
//#region src/common/gui/base/ListSwipeHandler.ts
var ListSwipeHandler = class extends SwipeHandler {
	virtualElement = null;
	xoffset;
	constructor(touchArea, config) {
		super(touchArea);
		this.config = config;
	}
	onHorizontalDrag(xDelta, yDelta) {
		super.onHorizontalDrag(xDelta, yDelta);
		const ve = this.getVirtualElement();
		window.requestAnimationFrame(() => {
			this.xoffset = xDelta < 0 ? Math.max(xDelta, -ACTION_DISTANCE) : Math.min(xDelta, ACTION_DISTANCE);
			if (!this.isAnimating && ve && ve.domElement && ve.entity) {
				ve.domElement.style.transform = `translateX(${this.xoffset}px) translateY(${ve.top}px)`;
				this.config.domSwipeSpacerLeft().style.transform = `translateX(${this.xoffset - this.width()}px) translateY(${ve.top}px)`;
				this.config.domSwipeSpacerRight().style.transform = `
				translateX(${this.xoffset + this.width()}px) translateY(${ve.top}px)`;
			}
		});
	}
	onHorizontalGestureCompleted(delta) {
		if (this.virtualElement && this.virtualElement.entity && Math.abs(delta.x) > ACTION_DISTANCE) return this.finish(this.virtualElement, this.virtualElement.entity, delta);
else return this.reset(delta);
	}
	async finish(virtualElement, entity, delta) {
		if (this.xoffset === 0) return;
		try {
			const listTargetPosition = this.xoffset < 0 ? -this.width() : this.width();
			await Promise.all([
				virtualElement.domElement && animations.add(virtualElement.domElement, transform(TransformEnum.TranslateX, this.xoffset, listTargetPosition).chain(TransformEnum.TranslateY, virtualElement.top, virtualElement.top), {
					easing: ease.inOut,
					duration: DefaultAnimationTime * 2
				}),
				animations.add(this.config.domSwipeSpacerLeft(), transform(TransformEnum.TranslateX, this.xoffset - this.width(), listTargetPosition - this.width()).chain(TransformEnum.TranslateY, virtualElement.top, virtualElement.top), {
					easing: ease.inOut,
					duration: DefaultAnimationTime * 2
				}),
				animations.add(this.config.domSwipeSpacerRight(), transform(TransformEnum.TranslateX, this.xoffset + this.width(), listTargetPosition + this.width()).chain(TransformEnum.TranslateY, virtualElement.top, virtualElement.top), {
					easing: ease.inOut,
					duration: DefaultAnimationTime * 2
				})
			]);
			this.xoffset = listTargetPosition;
			let swipeDecision;
			try {
				if (delta.x < 0) swipeDecision = await this.config.onSwipeLeft(entity);
else swipeDecision = await this.config.onSwipeRight(entity);
			} catch (e) {
				console.error("rejection in swipe action", e);
				swipeDecision = ListSwipeDecision.Cancel;
			}
			if (swipeDecision === ListSwipeDecision.Cancel) {
				await this.reset(delta);
				return;
			}
			this.xoffset = 0;
			if (virtualElement.domElement) virtualElement.domElement.style.transform = `translateX(${this.xoffset}px) translateY(${virtualElement.top}px)`;
			await Promise.all([animations.add(this.config.domSwipeSpacerLeft(), opacity(1, 0, true)), animations.add(this.config.domSwipeSpacerRight(), opacity(1, 0, true))]);
			this.config.domSwipeSpacerLeft().style.transform = `translateX(${this.xoffset - this.width() - 1}px) translateY(${virtualElement.top}px)`;
			this.config.domSwipeSpacerRight().style.transform = `translateX(${this.xoffset + this.width() + 1}px) translateY(${virtualElement.top}px)`;
			this.config.domSwipeSpacerRight().style.opacity = "";
			this.config.domSwipeSpacerLeft().style.opacity = "";
		} finally {
			this.virtualElement = null;
		}
	}
	width() {
		return this.config.width();
	}
	getVirtualElement() {
		if (!this.virtualElement) this.virtualElement = this.config.getRowForPosition(this.startPos);
		return this.virtualElement;
	}
	reset(delta) {
		try {
			if (this.xoffset !== 0) {
				const ve = this.virtualElement;
				if (ve && ve.domElement && ve.entity) return Promise.all([
					animations.add(ve.domElement, transform(TransformEnum.TranslateX, this.xoffset, 0).chain(TransformEnum.TranslateY, ve.top, ve.top), { easing: ease.inOut }),
					animations.add(this.config.domSwipeSpacerLeft(), transform(TransformEnum.TranslateX, this.xoffset - this.width(), -this.width()).chain(TransformEnum.TranslateY, ve.top, ve.top), { easing: ease.inOut }),
					animations.add(this.config.domSwipeSpacerRight(), transform(TransformEnum.TranslateX, this.xoffset + this.width(), this.width()).chain(TransformEnum.TranslateY, ve.top, ve.top), { easing: ease.inOut })
				]);
				this.xoffset = 0;
			}
		} finally {
			this.virtualElement = null;
		}
		return Promise.resolve();
	}
};

//#endregion
//#region src/common/gui/base/List.ts
let ListLoadingState = function(ListLoadingState$1) {
	/** not loading anything */
	ListLoadingState$1[ListLoadingState$1["Idle"] = 0] = "Idle";
	ListLoadingState$1[ListLoadingState$1["Loading"] = 1] = "Loading";
	/** loading was cancelled, e.g. because of the network error or explicit user request */
	ListLoadingState$1[ListLoadingState$1["ConnectionLost"] = 2] = "ConnectionLost";
	/** finished loading */
	ListLoadingState$1[ListLoadingState$1["Done"] = 3] = "Done";
	return ListLoadingState$1;
}({});
let MultiselectMode = function(MultiselectMode$1) {
	MultiselectMode$1[MultiselectMode$1["Disabled"] = 0] = "Disabled";
	MultiselectMode$1[MultiselectMode$1["Enabled"] = 1] = "Enabled";
	return MultiselectMode$1;
}({});
let ListSwipeDecision = function(ListSwipeDecision$1) {
	ListSwipeDecision$1[ListSwipeDecision$1["Cancel"] = 0] = "Cancel";
	ListSwipeDecision$1[ListSwipeDecision$1["Commit"] = 1] = "Commit";
	return ListSwipeDecision$1;
}({});
const ScrollBuffer = 15;
var List = class {
	innerDom = null;
	containerDom = null;
	rows = [];
	state = null;
	currentPosition = 0;
	lastAttrs;
	domSwipeSpacerLeft;
	domSwipeSpacerRight;
	loadingIndicatorChildDom;
	swipeHandler;
	width = 0;
	height = 0;
	activeIndex = null;
	lastThemeId = theme.themeId;
	view({ attrs }) {
		const oldAttrs = this.lastAttrs;
		this.lastAttrs = attrs;
		return mithril_default(
			".list-container.overflow-y-scroll.nofocus.overflow-x-hidden.fill-absolute",
			{
				"data-testid": "unordered_list",
				oncreate: ({ dom }) => {
					this.containerDom = dom;
					if (typeof ResizeObserver !== "undefined") new ResizeObserver(() => {
						this.updateSize();
					}).observe(this.containerDom);
else requestAnimationFrame(() => this.updateSize());
					this.swipeHandler = this.createSwipeHandler();
				},
				onscroll: () => {
					this.onScroll(attrs);
				}
			},
			this.renderSwipeItems(attrs),
			// we need rel for the status indicator
			mithril_default("ul.list.rel.click", {
				oncreate: ({ dom }) => {
					this.innerDom = dom;
					this.initializeDom(dom, attrs);
					this.updateDomElements(attrs);
					this.state = attrs.state;
					this.lastThemeId = theme.themeId;
					if (styles.isSingleColumnLayout()) this.innerDom.focus();
				},
				onupdate: ({ dom }) => {
					if (oldAttrs.renderConfig !== attrs.renderConfig) {
						console.log("list renderConfig has changed, reset");
						dom.vnodes = null;
						this.initializeDom(dom, attrs);
					}
					if (this.state !== attrs.state || this.lastThemeId !== theme.themeId) {
						this.updateDomElements(attrs);
						this.state = attrs.state;
					}
					this.lastThemeId = theme.themeId;
				},
				onscroll: () => {
					attrs.onLoadMore();
				}
			})
);
	}
	createSwipeHandler() {
		return new ListSwipeHandler(this.containerDom, {
			width: () => this.width,
			domSwipeSpacerLeft: () => this.domSwipeSpacerLeft,
			domSwipeSpacerRight: () => this.domSwipeSpacerRight,
			getRowForPosition: (coord) => this.getRowForPosition(coord),
			onSwipeLeft: async (el) => this.lastAttrs.renderConfig.swipe?.swipeLeft(el) ?? ListSwipeDecision.Cancel,
			onSwipeRight: async (el) => this.lastAttrs.renderConfig.swipe?.swipeRight(el) ?? ListSwipeDecision.Cancel
		});
	}
	getRowForPosition(clientCoordiante) {
		const touchAreaOffset = this.containerDom.getBoundingClientRect().top;
		const relativeYPosition = this.currentPosition + clientCoordiante.y - touchAreaOffset;
		const itemIndex = Math.floor(relativeYPosition / this.lastAttrs.renderConfig.itemHeight);
		const targetElementPosition = itemIndex * this.lastAttrs.renderConfig.itemHeight;
		return this.rows.find((ve) => ve.top === targetElementPosition) ?? null;
	}
	VIRTUAL_LIST_LENGTH = 100;
	initializeDom(dom, attrs) {
		const rows = [];
		mithril_default.render(
			dom,
			// hardcoded number of elements for now
			[numberRange(0, this.VIRTUAL_LIST_LENGTH - 1).map(() => this.createRow(attrs, rows)), this.renderStatusRow()]
);
		this.rows = rows;
		if (rows.length !== this.VIRTUAL_LIST_LENGTH) throw new ProgrammingError(`invalid rows length, expected ${this.VIRTUAL_LIST_LENGTH} rows, got ${this.rows.length}`);
		if (attrs.renderConfig.swipe) this.swipeHandler?.attach();
else this.swipeHandler.detach();
	}
	onScroll(attrs) {
		const visibleElementHeight = this.updateDomElements(attrs);
		this.loadMoreIfNecessary(attrs, visibleElementHeight);
	}
	createRow(attrs, rows) {
		return mithril_default("li.list-row.nofocus", {
			draggable: attrs.renderConfig.dragStart ? "true" : undefined,
			tabindex: TabIndex.Default,
			oncreate: (vnode) => {
				const dom = vnode.dom;
				const row = {
					row: attrs.renderConfig.createElement(dom),
					domElement: dom,
					top: -1,
					entity: null
				};
				rows.push(row);
				this.setRowEventListeners(attrs, dom, row);
			}
		});
	}
	setRowEventListeners(attrs, domElement, row) {
		const LONG_PRESS_DURATION_MS = 400;
		let touchStartTime = null;
		domElement.onclick = (e) => {
			if (!touchStartTime || Date.now() - touchStartTime < LONG_PRESS_DURATION_MS) {
				if (row.entity) this.handleEvent(row.entity, e);
			}
		};
		domElement.onkeyup = (e) => {
			if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
				if (row.entity) this.handleEvent(row.entity, e);
			}
		};
		const onFocus = (focusType) => {
			return (e) => {
				const dom = e.target;
				if (dom && dom.firstElementChild) dom.firstElementChild?.dispatchEvent(new FocusEvent(focusType));
			};
		};
		domElement.onfocus = onFocus("focus");
		domElement.onblur = onFocus("blur");
		domElement.ondragstart = (e) => {
			if (row.domElement) row.domElement.style.background = theme.navigation_bg;
			requestAnimationFrame(() => {
				if (row.domElement) row.domElement.style.background = "";
			});
			if (attrs.renderConfig.dragStart) {
				if (row.entity && this.state) attrs.renderConfig.dragStart(e, row.entity, this.state.selectedItems);
			}
		};
		if (attrs.renderConfig.multiselectionAllowed === MultiselectMode.Enabled) {
			let timeoutId;
			let touchStartCoords = null;
			domElement.addEventListener("touchstart", (e) => {
				touchStartTime = Date.now();
				timeoutId = setTimeout(() => {
					if (row.entity) attrs.onSingleTogglingMultiselection(row.entity);
					mithril_default.redraw();
				}, LONG_PRESS_DURATION_MS);
				touchStartCoords = {
					x: e.touches[0].pageX,
					y: e.touches[0].pageY
				};
			});
			const touchEnd = () => {
				if (timeoutId) clearTimeout(timeoutId);
			};
			domElement.addEventListener("touchend", touchEnd);
			domElement.addEventListener("touchcancel", touchEnd);
			domElement.addEventListener("touchmove", (e) => {
				const maxDistance = 30;
				const touch = e.touches[0];
				if (touchStartCoords && timeoutId && (Math.abs(touch.pageX - touchStartCoords.x) > maxDistance || Math.abs(touch.pageY - touchStartCoords.y) > maxDistance)) clearTimeout(timeoutId);
			});
		}
	}
	/**
	* Updates the given list of selected items with a click on the given clicked item. Takes ctrl and shift key events into consideration for multi selection.
	* If ctrl is pressed the selection status of the clickedItem is toggled.
	* If shift is pressed, all items beginning from the nearest selected item to the clicked item are additionally selected.
	* If neither ctrl nor shift are pressed only the clicked item is selected.
	*/
	handleEvent(clickedEntity, event) {
		let changeType;
		if (client.isMobileDevice() && this.lastAttrs.state.inMultiselect || event.ctrlKey || client.isMacOS && event.metaKey) changeType = "togglingIncludingSingle";
else if (event.shiftKey) changeType = "range";
else changeType = "single";
		this.changeSelection(clickedEntity, changeType);
	}
	/**
	* changeType:
	*  * single: one item selection (not multiselect)
	*  * togglingIncludingSingle: if not in multiselect, start multiselect. Turns multiselect on or off for the item. Includes the item from single selection
	*    when turning multiselect on.
	*  * togglingNewMultiselect: if not in multiselect, start multiselect. Turns multiselect on or off for the item. Only selected item will be in multiselect
	*    when turning multiselect on.
	*  * range: range selection, extends the range until the selected item
	*/
	changeSelection(clickedEntity, changeType) {
		switch (changeType) {
			case "single":
				this.lastAttrs.onSingleSelection(clickedEntity);
				break;
			case "togglingIncludingSingle":
				if (this.lastAttrs.renderConfig.multiselectionAllowed === MultiselectMode.Enabled) this.lastAttrs.onSingleTogglingMultiselection(clickedEntity);
				break;
			case "range":
				if (this.lastAttrs.renderConfig.multiselectionAllowed === MultiselectMode.Enabled) this.lastAttrs.onRangeSelectionTowards(clickedEntity);
				break;
		}
	}
	updateDomElements(attrs) {
		if (this.height === 0) this.height = this.containerDom.clientHeight;
		const rowHeight = attrs.renderConfig.itemHeight;
		const statusHeight = attrs.state.loadingStatus === ListLoadingState.Done ? 0 : size.list_row_height;
		this.innerDom.style.height = px(attrs.state.items.length * rowHeight + statusHeight);
		if (attrs.state.activeIndex != null && attrs.state.activeIndex !== this.activeIndex) {
			const index = attrs.state.activeIndex;
			const desiredPosition = attrs.state.activeIndex * rowHeight;
			if (desiredPosition > this.containerDom.scrollTop + this.height || desiredPosition < this.containerDom.scrollTop) {
				console.log("active item out of screen, scrolling to", index, desiredPosition);
				this.currentPosition = this.containerDom.scrollTop = desiredPosition;
			} else this.currentPosition = this.containerDom.scrollTop;
		} else this.currentPosition = this.containerDom.scrollTop;
		this.activeIndex = attrs.state.activeIndex;
		const visibleElements = 2 * Math.ceil(this.height / rowHeight / 2);
		const visibleElementsHeight = visibleElements * rowHeight;
		const bufferHeight = ScrollBuffer * rowHeight;
		const maxStartPosition = rowHeight * attrs.state.items.length - bufferHeight * 2 - visibleElementsHeight;
		let nextPosition = this.currentPosition - this.currentPosition % rowHeight - bufferHeight;
		if (nextPosition < 0) nextPosition = 0;
else if (nextPosition > maxStartPosition) nextPosition = maxStartPosition;
		for (const row of this.rows) {
			row.top = nextPosition;
			nextPosition += rowHeight;
			const pos = row.top / rowHeight;
			const item = attrs.state.items[pos];
			row.entity = item;
			if (!item) row.domElement.style.display = "none";
else {
				row.domElement.style.display = "";
				row.domElement.style.transform = `translateY(${row.top}px)`;
				row.row.update(item, attrs.state.selectedItems.has(item), attrs.state.inMultiselect);
			}
			if (attrs.state.selectedItems.has(item) && (!this.state?.selectedItems.has(item) || this.state == null)) row.domElement.focus();
		}
		this.updateStatus(attrs.state.loadingStatus);
		this.loadMoreIfNecessary(attrs, visibleElementsHeight);
		return visibleElementsHeight;
	}
	updateStatus = memoized((status) => {
		switch (status) {
			case ListLoadingState.Idle:
			case ListLoadingState.Done:
				mithril_default.render(this.loadingIndicatorChildDom, null);
				this.loadingIndicatorChildDom.style.display = "none";
				break;
			case ListLoadingState.Loading:
				mithril_default.render(this.loadingIndicatorChildDom, this.renderLoadingIndicator());
				this.loadingIndicatorChildDom.style.display = "";
				break;
			case ListLoadingState.ConnectionLost:
				mithril_default.render(this.loadingIndicatorChildDom, this.renderConnectionLostIndicator());
				this.loadingIndicatorChildDom.style.display = "";
				break;
		}
	});
	renderLoadingIndicator() {
		return mithril_default(".flex-center.items-center", { style: {
			height: px(size.list_row_height),
			width: "100%",
			position: "absolute",
			gap: px(size.hpad_small)
		} }, progressIcon(), mithril_default(Button, {
			label: "cancel_action",
			type: ButtonType.Primary,
			click: () => this.lastAttrs.onStopLoading()
		}));
	}
	renderConnectionLostIndicator() {
		return mithril_default(".plr-l.flex-center.items-center", { style: { height: px(size.list_row_height) } }, mithril_default(Button, {
			label: "loadMore_action",
			type: ButtonType.Primary,
			click: () => this.retryLoading()
		}));
	}
	retryLoading() {
		this.lastAttrs.onRetryLoading();
	}
	async loadMoreIfNecessary(attrs, visibleElementsHeight) {
		const lastBunchVisible = this.currentPosition > attrs.state.items.length * attrs.renderConfig.itemHeight - visibleElementsHeight * 2;
		if (lastBunchVisible && attrs.state.loadingStatus == ListLoadingState.Idle) await attrs.onLoadMore();
	}
	renderStatusRow() {
		return mithril_default("li.list-row", {
			style: {
				bottom: 0,
				height: px(size.list_row_height),
				display: this.shouldDisplayStatusRow() ? "none" : null
			},
			oncreate: (vnode) => {
				this.loadingIndicatorChildDom = vnode.dom;
			}
		});
	}
	shouldDisplayStatusRow() {
		return this.state?.loadingStatus === ListLoadingState.Done || this.state?.loadingStatus === ListLoadingState.Idle;
	}
	renderSwipeItems(attrs) {
		if (attrs.renderConfig.swipe == null) return null;
		return [mithril_default(".swipe-spacer.flex.items-center.justify-end.pr-l.blue", {
			oncreate: (vnode) => this.domSwipeSpacerLeft = vnode.dom,
			tabindex: TabIndex.Programmatic,
			"aria-hidden": "true",
			style: {
				height: px(attrs.renderConfig.itemHeight),
				transform: `translateY(-${attrs.renderConfig.itemHeight}px)`,
				position: "absolute",
				"z-index": 1
			}
		}, attrs.renderConfig.swipe.renderLeftSpacer()), mithril_default(".swipe-spacer.flex.items-center.pl-l.red", {
			oncreate: (vnode) => this.domSwipeSpacerRight = vnode.dom,
			tabindex: TabIndex.Programmatic,
			"aria-hidden": "true",
			style: {
				height: px(attrs.renderConfig.itemHeight),
				transform: `translateY(-${attrs.renderConfig.itemHeight}px)`,
				position: "absolute",
				"z-index": 1
			}
		}, attrs.renderConfig.swipe.renderRightSpacer())];
	}
	updateSize() {
		const containerDom = this.containerDom;
		if (containerDom && this.domSwipeSpacerLeft && this.domSwipeSpacerRight) {
			this.domSwipeSpacerLeft.style.opacity = "0";
			this.domSwipeSpacerRight.style.opacity = "0";
			this.doUpdateWidth(containerDom);
		}
	}
	doUpdateWidth = debounce(60, (containerDom) => {
		this.width = containerDom.clientWidth;
		this.height = containerDom.clientHeight;
		if (this.swipeHandler) {
			const translateX = this.width + 1;
			this.domSwipeSpacerLeft.style.width = px(this.width);
			this.domSwipeSpacerRight.style.width = px(this.width);
			this.domSwipeSpacerLeft.style.transform = `translateX(${-translateX}px) translateY(0px)`;
			this.domSwipeSpacerRight.style.transform = `translateX(${translateX}px) translateY(0px)`;
			for (const row of this.rows) if (row.domElement) applySafeAreaInsetMarginLR(row.domElement);
			this.domSwipeSpacerLeft.style.opacity = "1";
			this.domSwipeSpacerRight.style.opacity = "1";
		}
	});
};

//#endregion
export { List, ListLoadingState, ListSwipeDecision, MultiselectMode, PageSize, SwipeHandler, listSelectionKeyboardShortcuts, onlySingleSelection };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlzdC1jaHVuay5qcyIsIm5hbWVzIjpbInRvdWNoQXJlYTogSFRNTEVsZW1lbnQiLCJlOiBUb3VjaEV2ZW50IiwieERlbHRhOiBudW1iZXIiLCJ5RGVsdGE6IG51bWJlciIsImRlbHRhOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyIH0iLCJlOiBhbnkiLCJtdWx0aXNlbGVjdE1vZGU6IE11bHRpc2VsZWN0TW9kZSIsImNhbGxiYWNrczogKCkgPT4gTGlzdFNlbGVjdGlvbkNhbGxiYWNrcyB8IG51bGwiLCJzdGF0ZTogTGlzdFN0YXRlPFQ+IiwidG91Y2hBcmVhOiBIVE1MRWxlbWVudCIsImNvbmZpZzoge1xuXHRcdFx0ZG9tU3dpcGVTcGFjZXJMZWZ0OiAoKSA9PiBIVE1MRWxlbWVudFxuXHRcdFx0ZG9tU3dpcGVTcGFjZXJSaWdodDogKCkgPT4gSFRNTEVsZW1lbnRcblx0XHRcdHdpZHRoOiAoKSA9PiBudW1iZXJcblx0XHRcdGdldFJvd0ZvclBvc2l0aW9uOiAoY2xpZW50Q29vcmRpbmF0ZXM6IENvb3JkaW5hdGUyRCkgPT4gTGlzdFJvdzxFbGVtZW50VHlwZSwgVkg+IHwgbnVsbFxuXHRcdFx0b25Td2lwZUxlZnQ6IChlbnRpdHk6IEVsZW1lbnRUeXBlKSA9PiBQcm9taXNlPExpc3RTd2lwZURlY2lzaW9uPlxuXHRcdFx0b25Td2lwZVJpZ2h0OiAoZW50aXR5OiBFbGVtZW50VHlwZSkgPT4gUHJvbWlzZTxMaXN0U3dpcGVEZWNpc2lvbj5cblx0XHR9IiwieERlbHRhOiBudW1iZXIiLCJ5RGVsdGE6IG51bWJlciIsImRlbHRhOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyIH0iLCJ2aXJ0dWFsRWxlbWVudDogTGlzdFJvdzxFbGVtZW50VHlwZSwgVkg+IiwiZW50aXR5OiBFbGVtZW50VHlwZSIsImRlbHRhOiB7XG5cdFx0XHR4OiBudW1iZXJcblx0XHRcdHk6IG51bWJlclxuXHRcdH0iLCJzd2lwZURlY2lzaW9uOiBMaXN0U3dpcGVEZWNpc2lvbiIsImNsaWVudENvb3JkaWFudGU6IENvb3JkaW5hdGUyRCIsImRvbTogSFRNTEVsZW1lbnQiLCJhdHRyczogTGlzdEF0dHJzPFQsIFZIPiIsInJvd3M6IExpc3RSb3c8VCwgVkg+W10iLCJ2bm9kZTogVm5vZGVET00iLCJkb21FbGVtZW50OiBIVE1MRWxlbWVudCIsInJvdzogTGlzdFJvdzxULCBWSD4iLCJ0b3VjaFN0YXJ0VGltZTogbnVtYmVyIHwgbnVsbCIsImZvY3VzVHlwZTogXCJmb2N1c1wiIHwgXCJibHVyXCIiLCJlOiBGb2N1c0V2ZW50IiwiZTogRHJhZ0V2ZW50IiwidGltZW91dElkOiBUaW1lb3V0SUQgfCBudWxsIiwidG91Y2hTdGFydENvb3JkczogeyB4OiBudW1iZXI7IHk6IG51bWJlciB9IHwgbnVsbCIsImU6IFRvdWNoRXZlbnQiLCJjbGlja2VkRW50aXR5OiBUIiwiZXZlbnQ6IFRvdWNoRXZlbnQgfCBNb3VzZUV2ZW50IHwgS2V5Ym9hcmRFdmVudCIsImNoYW5nZVR5cGU6IFBhcmFtZXRlcnM8dHlwZW9mIHRoaXMuY2hhbmdlU2VsZWN0aW9uPlsxXSIsImNoYW5nZVR5cGU6IFwic2luZ2xlXCIgfCBcInRvZ2dsaW5nSW5jbHVkaW5nU2luZ2xlXCIgfCBcInJhbmdlXCIiLCJzdGF0dXM6IExpc3RMb2FkaW5nU3RhdGUiLCJ2aXNpYmxlRWxlbWVudHNIZWlnaHQ6IG51bWJlciIsImNvbnRhaW5lckRvbTogSFRNTEVsZW1lbnQiXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL2d1aS9iYXNlL1N3aXBlSGFuZGxlci50cyIsIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvTGlzdFV0aWxzLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvYmFzZS9MaXN0U3dpcGVIYW5kbGVyLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvYmFzZS9MaXN0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNpemUgfSBmcm9tIFwiLi4vc2l6ZVwiXG5cbmV4cG9ydCBjb25zdCBlbnVtIERpcmVjdGlvbkxvY2sge1xuXHRIb3Jpem9udGFsLFxuXHRWZXJ0aWNhbCxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb29yZGluYXRlMkQge1xuXHR4OiBudW1iZXJcblx0eTogbnVtYmVyXG59XG5cbi8qIFRvb2wgdG8gZGV0ZWN0IHN3aXBlIGdlc3R1cmVzIG9uIGNlcnRhaW4gZWxlbWVudHMuICovXG5leHBvcnQgY2xhc3MgU3dpcGVIYW5kbGVyIHtcblx0LyoqIHVzZXMgY2xpZW50WC9jbGllbnRZIHRodXMgcmVsYXRpdmUgdG8gdmlldyBwb3J0ICovXG5cdHN0YXJ0UG9zOiBDb29yZGluYXRlMkRcblx0dG91Y2hBcmVhOiBIVE1MRWxlbWVudFxuXHRhbmltYXRpbmc6IFByb21pc2U8dW5rbm93bj5cblx0aXNBbmltYXRpbmc6IGJvb2xlYW4gPSBmYWxzZVxuXHRkaXJlY3Rpb25Mb2NrOiBEaXJlY3Rpb25Mb2NrIHwgbnVsbFxuXG5cdGNvbnN0cnVjdG9yKHRvdWNoQXJlYTogSFRNTEVsZW1lbnQpIHtcblx0XHR0aGlzLnN0YXJ0UG9zID0ge1xuXHRcdFx0eDogMCxcblx0XHRcdHk6IDAsXG5cdFx0fVxuXHRcdHRoaXMudG91Y2hBcmVhID0gdG91Y2hBcmVhXG5cdFx0dGhpcy5hbmltYXRpbmcgPSBQcm9taXNlLnJlc29sdmUoKVxuXHRcdHRoaXMuZGlyZWN0aW9uTG9jayA9IG51bGxcblx0fVxuXG5cdGF0dGFjaCgpIHtcblx0XHR0aGlzLnRvdWNoQXJlYS5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCB0aGlzLm9uVG91Y2hTdGFydCwgeyBwYXNzaXZlOiB0cnVlIH0pXG5cdFx0Ly8gZG9lcyBpbnZva2UgcHJldmVudCBkZWZhdWx0XG5cdFx0dGhpcy50b3VjaEFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0aGlzLm9uVG91Y2hNb3ZlLCB7IHBhc3NpdmU6IGZhbHNlIH0pXG5cdFx0dGhpcy50b3VjaEFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIHRoaXMub25Ub3VjaEVuZCwgeyBwYXNzaXZlOiB0cnVlIH0pXG5cdH1cblxuXHRkZXRhY2goKSB7XG5cdFx0dGhpcy50b3VjaEFyZWEucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgdGhpcy5vblRvdWNoU3RhcnQpXG5cdFx0dGhpcy50b3VjaEFyZWEucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0aGlzLm9uVG91Y2hNb3ZlKVxuXHRcdHRoaXMudG91Y2hBcmVhLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCB0aGlzLm9uVG91Y2hFbmQpXG5cdH1cblxuXHRwcml2YXRlIHJlYWRvbmx5IG9uVG91Y2hTdGFydCA9IChlOiBUb3VjaEV2ZW50KSA9PiB7XG5cdFx0dGhpcy5zdGFydFBvcyA9IHtcblx0XHRcdHg6IGUudG91Y2hlc1swXS5jbGllbnRYLFxuXHRcdFx0eTogZS50b3VjaGVzWzBdLmNsaWVudFksXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSByZWFkb25seSBvblRvdWNoTW92ZSA9IChlOiBUb3VjaEV2ZW50KSA9PiB7XG5cdFx0bGV0IHsgeCwgeSB9ID0gdGhpcy5nZXREZWx0YShlKVxuXG5cdFx0Ly8gSWYgd2UncmUgZWl0aGVyIGxvY2tlZCBob3Jpem9udGFsbHkgT1IgaWYgd2UncmUgbm90IGxvY2tlZCB2ZXJ0aWNhbGx5IGJ1dCB3b3VsZCBsaWtlIHRvIGxvY2sgaG9yaXpvbnRhbGx5LCB0aGVuIGxvY2sgaG9yaXpvbnRhbGx5XG5cdFx0aWYgKFxuXHRcdFx0dGhpcy5kaXJlY3Rpb25Mb2NrID09PSBEaXJlY3Rpb25Mb2NrLkhvcml6b250YWwgfHxcblx0XHRcdCh0aGlzLmRpcmVjdGlvbkxvY2sgIT09IERpcmVjdGlvbkxvY2suVmVydGljYWwgJiYgTWF0aC5hYnMoeCkgPiBNYXRoLmFicyh5KSAmJiBNYXRoLmFicyh4KSA+IDE0KVxuXHRcdCkge1xuXHRcdFx0dGhpcy5kaXJlY3Rpb25Mb2NrID0gRGlyZWN0aW9uTG9jay5Ib3Jpem9udGFsXG5cdFx0XHQvLyBEbyBub3Qgc2Nyb2xsIHRoZSBsaXN0XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KClcblxuXHRcdFx0aWYgKCF0aGlzLmlzQW5pbWF0aW5nKSB7XG5cdFx0XHRcdHRoaXMub25Ib3Jpem9udGFsRHJhZyh4LCB5KVxuXHRcdFx0fSAvLyBJZiB3ZSBkb24ndCBoYXZlIGEgdmVydGljYWwgbG9jayB5ZXQgYnV0IHdlIHdvdWxkIGxpa2UgdG8gaGF2ZSBpdCwgbG9jayB2ZXJ0aWNhbGx5XG5cdFx0fSBlbHNlIGlmICh0aGlzLmRpcmVjdGlvbkxvY2sgIT09IERpcmVjdGlvbkxvY2suVmVydGljYWwgJiYgTWF0aC5hYnMoeSkgPiBNYXRoLmFicyh4KSAmJiBNYXRoLmFicyh5KSA+IHNpemUubGlzdF9yb3dfaGVpZ2h0KSB7XG5cdFx0XHR0aGlzLmRpcmVjdGlvbkxvY2sgPSBEaXJlY3Rpb25Mb2NrLlZlcnRpY2FsXG5cblx0XHRcdGlmICghdGhpcy5pc0FuaW1hdGluZykge1xuXHRcdFx0XHQvLyBSZXNldCB0aGUgcm93XG5cdFx0XHRcdHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXHRcdFx0XHRcdGlmICghdGhpcy5pc0FuaW1hdGluZykge1xuXHRcdFx0XHRcdFx0dGhpcy5yZXNldCh7XG5cdFx0XHRcdFx0XHRcdHgsXG5cdFx0XHRcdFx0XHRcdHksXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlYWRvbmx5IG9uVG91Y2hFbmQgPSAoZTogVG91Y2hFdmVudCkgPT4ge1xuXHRcdHRoaXMuZ2VzdHVyZUVuZChlKVxuXHR9XG5cblx0cHJpdmF0ZSBnZXN0dXJlRW5kKGU6IFRvdWNoRXZlbnQpIHtcblx0XHRjb25zdCBkZWx0YSA9IHRoaXMuZ2V0RGVsdGEoZSlcblxuXHRcdGlmICghdGhpcy5pc0FuaW1hdGluZyAmJiB0aGlzLmRpcmVjdGlvbkxvY2sgPT09IERpcmVjdGlvbkxvY2suSG9yaXpvbnRhbCkge1xuXHRcdFx0Ly8gR2VzdHVyZSBpcyBjb21wbGV0ZWRcblx0XHRcdHRoaXMuYW5pbWF0aW5nID0gdGhpcy5vbkhvcml6b250YWxHZXN0dXJlQ29tcGxldGVkKGRlbHRhKVxuXHRcdFx0dGhpcy5pc0FuaW1hdGluZyA9IHRydWVcblx0XHR9IGVsc2UgaWYgKCF0aGlzLmlzQW5pbWF0aW5nKSB7XG5cdFx0XHQvLyBHZXN0dXJlIGlzIG5vdCBjb21wbGV0ZWQsIHJlc2V0IHJvd1xuXHRcdFx0dGhpcy5hbmltYXRpbmcgPSB0aGlzLnJlc2V0KGRlbHRhKVxuXHRcdFx0dGhpcy5pc0FuaW1hdGluZyA9IHRydWVcblx0XHR9XG5cblx0XHR0aGlzLmFuaW1hdGluZy50aGVuKCgpID0+ICh0aGlzLmlzQW5pbWF0aW5nID0gZmFsc2UpKVxuXHRcdHRoaXMuZGlyZWN0aW9uTG9jayA9IG51bGxcblx0fVxuXG5cdG9uSG9yaXpvbnRhbERyYWcoeERlbHRhOiBudW1iZXIsIHlEZWx0YTogbnVtYmVyKSB7XG5cdFx0Ly8gbm9PcFxuXHR9XG5cblx0b25Ib3Jpem9udGFsR2VzdHVyZUNvbXBsZXRlZChkZWx0YTogeyB4OiBudW1iZXI7IHk6IG51bWJlciB9KTogUHJvbWlzZTx1bmtub3duPiB7XG5cdFx0Ly8gbm9PcFxuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXHR9XG5cblx0cmVzZXQoZGVsdGE6IHsgeDogbnVtYmVyOyB5OiBudW1iZXIgfSk6IFByb21pc2U8dW5rbm93bj4ge1xuXHRcdHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuXHR9XG5cblx0Z2V0RGVsdGEoZTogYW55KToge1xuXHRcdHg6IG51bWJlclxuXHRcdHk6IG51bWJlclxuXHR9IHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0eDogZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRYIC0gdGhpcy5zdGFydFBvcy54LFxuXHRcdFx0eTogZS5jaGFuZ2VkVG91Y2hlc1swXS5jbGllbnRZIC0gdGhpcy5zdGFydFBvcy55LFxuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHsgTGlzdEVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlscy5qc1wiXG5pbXBvcnQgeyBTaG9ydGN1dCB9IGZyb20gXCIuLi8uLi9taXNjL0tleU1hbmFnZXIuanNcIlxuaW1wb3J0IHsgS2V5cyB9IGZyb20gXCIuLi8uLi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IG1hcExhemlseSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgTGlzdFN0YXRlLCBNdWx0aXNlbGVjdE1vZGUgfSBmcm9tIFwiLi9MaXN0LmpzXCJcbmltcG9ydCB7IENoaWxkcmVuIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgaXNCcm93c2VyIH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vRW52LmpzXCJcbmltcG9ydCB7IExpc3RFbGVtZW50TGlzdE1vZGVsIH0gZnJvbSBcIi4uLy4uL21pc2MvTGlzdEVsZW1lbnRMaXN0TW9kZWxcIlxuXG5leHBvcnQgY29uc3QgQUNUSU9OX0RJU1RBTkNFID0gMTUwXG5leHBvcnQgY29uc3QgUGFnZVNpemUgPSAxMDBcblxuLyoqXG4gKiAxOjEgbWFwcGluZyB0byBET00gZWxlbWVudHMuIERpc3BsYXlzIGEgc2luZ2xlIGxpc3QgZW50cnkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVmlydHVhbFJvdzxFbGVtZW50VHlwZT4ge1xuXHRyZW5kZXIoKTogQ2hpbGRyZW5cblxuXHR1cGRhdGUobGlzdEVudHJ5OiBFbGVtZW50VHlwZSwgc2VsZWN0ZWQ6IGJvb2xlYW4sIGlzSW5NdWx0aVNlbGVjdDogYm9vbGVhbik6IHZvaWRcblxuXHRlbnRpdHk6IEVsZW1lbnRUeXBlIHwgbnVsbFxuXHR0b3A6IG51bWJlclxuXHRkb21FbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMaXN0RmV0Y2hSZXN1bHQ8RWxlbWVudFR5cGU+IHtcblx0aXRlbXM6IEFycmF5PEVsZW1lbnRUeXBlPlxuXHQvKiogQ29tcGxldGUgbWVhbnMgdGhhdCB3ZSBsb2FkZWQgdGhlIHdob2xlIGxpc3QgYW5kIGFkZGl0aW9uYWwgcmVxdWVzdHMgd2lsbCBub3QgeWllbGQgYW55IHJlc3VsdHMuICovXG5cdGNvbXBsZXRlOiBib29sZWFuXG59XG5cbmV4cG9ydCB0eXBlIExpc3RTZWxlY3Rpb25DYWxsYmFja3MgPSBQaWNrPExpc3RFbGVtZW50TGlzdE1vZGVsPExpc3RFbGVtZW50PiwgXCJzZWxlY3RQcmV2aW91c1wiIHwgXCJzZWxlY3ROZXh0XCIgfCBcImFyZUFsbFNlbGVjdGVkXCIgfCBcInNlbGVjdEFsbFwiIHwgXCJzZWxlY3ROb25lXCI+XG5cbmV4cG9ydCBmdW5jdGlvbiBsaXN0U2VsZWN0aW9uS2V5Ym9hcmRTaG9ydGN1dHMobXVsdGlzZWxlY3RNb2RlOiBNdWx0aXNlbGVjdE1vZGUsIGNhbGxiYWNrczogKCkgPT4gTGlzdFNlbGVjdGlvbkNhbGxiYWNrcyB8IG51bGwpOiBBcnJheTxTaG9ydGN1dD4ge1xuXHRjb25zdCBtdWx0aXNlbGVjdGlvbkVuYWJsZWQgPSBtdWx0aXNlbGVjdE1vZGUgPT0gTXVsdGlzZWxlY3RNb2RlLkVuYWJsZWQgPyAoKSA9PiB0cnVlIDogKCkgPT4gZmFsc2Vcblx0cmV0dXJuIFtcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuVVAsXG5cdFx0XHRleGVjOiBtYXBMYXppbHkoY2FsbGJhY2tzLCAobGlzdCkgPT4gbGlzdD8uc2VsZWN0UHJldmlvdXMoZmFsc2UpKSxcblx0XHRcdGhlbHA6IFwic2VsZWN0UHJldmlvdXNfYWN0aW9uXCIsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuSyxcblx0XHRcdGV4ZWM6IG1hcExhemlseShjYWxsYmFja3MsIChsaXN0KSA9PiBsaXN0Py5zZWxlY3RQcmV2aW91cyhmYWxzZSkpLFxuXHRcdFx0aGVscDogXCJzZWxlY3RQcmV2aW91c19hY3Rpb25cIixcblx0XHR9LFxuXHRcdHtcblx0XHRcdGtleTogS2V5cy5VUCxcblx0XHRcdHNoaWZ0OiB0cnVlLFxuXHRcdFx0ZXhlYzogbWFwTGF6aWx5KGNhbGxiYWNrcywgKGxpc3QpID0+IGxpc3Q/LnNlbGVjdFByZXZpb3VzKHRydWUpKSxcblx0XHRcdGhlbHA6IFwiYWRkUHJldmlvdXNfYWN0aW9uXCIsXG5cdFx0XHRlbmFibGVkOiBtdWx0aXNlbGVjdGlvbkVuYWJsZWQsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuSyxcblx0XHRcdHNoaWZ0OiB0cnVlLFxuXHRcdFx0ZXhlYzogbWFwTGF6aWx5KGNhbGxiYWNrcywgKGxpc3QpID0+IGxpc3Q/LnNlbGVjdFByZXZpb3VzKHRydWUpKSxcblx0XHRcdGhlbHA6IFwiYWRkUHJldmlvdXNfYWN0aW9uXCIsXG5cdFx0XHRlbmFibGVkOiBtdWx0aXNlbGVjdGlvbkVuYWJsZWQsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuRE9XTixcblx0XHRcdGV4ZWM6IG1hcExhemlseShjYWxsYmFja3MsIChsaXN0KSA9PiBsaXN0Py5zZWxlY3ROZXh0KGZhbHNlKSksXG5cdFx0XHRoZWxwOiBcInNlbGVjdE5leHRfYWN0aW9uXCIsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuSixcblx0XHRcdGV4ZWM6IG1hcExhemlseShjYWxsYmFja3MsIChsaXN0KSA9PiBsaXN0Py5zZWxlY3ROZXh0KGZhbHNlKSksXG5cdFx0XHRoZWxwOiBcInNlbGVjdE5leHRfYWN0aW9uXCIsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRrZXk6IEtleXMuRE9XTixcblx0XHRcdHNoaWZ0OiB0cnVlLFxuXHRcdFx0ZXhlYzogbWFwTGF6aWx5KGNhbGxiYWNrcywgKGxpc3QpID0+IGxpc3Q/LnNlbGVjdE5leHQodHJ1ZSkpLFxuXHRcdFx0aGVscDogXCJhZGROZXh0X2FjdGlvblwiLFxuXHRcdFx0ZW5hYmxlZDogbXVsdGlzZWxlY3Rpb25FbmFibGVkLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0a2V5OiBLZXlzLkosXG5cdFx0XHRzaGlmdDogdHJ1ZSxcblx0XHRcdGV4ZWM6IG1hcExhemlseShjYWxsYmFja3MsIChsaXN0KSA9PiBsaXN0Py5zZWxlY3ROZXh0KHRydWUpKSxcblx0XHRcdGhlbHA6IFwiYWRkTmV4dF9hY3Rpb25cIixcblx0XHRcdGVuYWJsZWQ6IG11bHRpc2VsZWN0aW9uRW5hYmxlZCxcblx0XHR9LFxuXHRcdHtcblx0XHRcdGtleTogS2V5cy5BLFxuXHRcdFx0Y3RybE9yQ21kOiB0cnVlLFxuXHRcdFx0c2hpZnQ6IHRydWUsXG5cdFx0XHRleGVjOiBtYXBMYXppbHkoY2FsbGJhY2tzLCAobGlzdCkgPT4gKGxpc3Q/LmFyZUFsbFNlbGVjdGVkKCkgPyBsaXN0LnNlbGVjdE5vbmUoKSA6IGxpc3Q/LnNlbGVjdEFsbCgpKSksXG5cdFx0XHRoZWxwOiBcInNlbGVjdEFsbExvYWRlZF9hY3Rpb25cIixcblx0XHRcdC8vIHRoaXMgc3BlY2lmaWMgc2hvcnRjdXQgY29uZmxpY3RzIHdpdGggYSBjaHJvbWUgc2hvcnRjdXQuIGl0IHdhcyBjaG9zZW4gYmVjYXVzZSBpdCdzIGFkamFjZW50IHRvIGN0cmwgKyBBXG5cdFx0XHQvLyBmb3Igc2VsZWN0IGFsbC5cblx0XHRcdGVuYWJsZWQ6ICgpID0+IG11bHRpc2VsZWN0aW9uRW5hYmxlZCgpICYmICFpc0Jyb3dzZXIoKSxcblx0XHR9LFxuXHRdXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvbmx5U2luZ2xlU2VsZWN0aW9uPFQ+KHN0YXRlOiBMaXN0U3RhdGU8VD4pOiBUIHwgbnVsbCB7XG5cdGlmIChzdGF0ZS5zZWxlY3RlZEl0ZW1zLnNpemUgPT09IDEpIHtcblx0XHRyZXR1cm4gc3RhdGUuc2VsZWN0ZWRJdGVtcy52YWx1ZXMoKS5uZXh0KCkudmFsdWVcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gbnVsbFxuXHR9XG59XG4iLCJpbXBvcnQgeyBDb29yZGluYXRlMkQsIFN3aXBlSGFuZGxlciB9IGZyb20gXCIuL1N3aXBlSGFuZGxlci5qc1wiXG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBhbmltYXRpb25zLCBEZWZhdWx0QW5pbWF0aW9uVGltZSwgb3BhY2l0eSwgdHJhbnNmb3JtLCBUcmFuc2Zvcm1FbnVtIH0gZnJvbSBcIi4uL2FuaW1hdGlvbi9BbmltYXRpb25zLmpzXCJcbmltcG9ydCB7IGVhc2UgfSBmcm9tIFwiLi4vYW5pbWF0aW9uL0Vhc2luZy5qc1wiXG5pbXBvcnQgeyBMaXN0Um93LCBMaXN0U3dpcGVEZWNpc2lvbiwgVmlld0hvbGRlciB9IGZyb20gXCIuL0xpc3QuanNcIlxuaW1wb3J0IHsgQUNUSU9OX0RJU1RBTkNFIH0gZnJvbSBcIi4vTGlzdFV0aWxzLmpzXCJcblxuLyoqIERldGVjdHMgc3dpcGUgZ2VzdHVyZXMgZm9yIGxpc3QgZWxlbWVudHMuIE9uIG1vYmlsZSBzb21lIGxpc3RzIGhhdmUgYWN0aW9ucyBvbiBzd2lwaW5nLCBlLmcuIGRlbGV0aW5nIGFuIGVtYWlsLiAqL1xuZXhwb3J0IGNsYXNzIExpc3RTd2lwZUhhbmRsZXI8RWxlbWVudFR5cGUsIFZIIGV4dGVuZHMgVmlld0hvbGRlcjxFbGVtZW50VHlwZT4+IGV4dGVuZHMgU3dpcGVIYW5kbGVyIHtcblx0cHJpdmF0ZSB2aXJ0dWFsRWxlbWVudDogTGlzdFJvdzxFbGVtZW50VHlwZSwgVkg+IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSB4b2Zmc2V0ITogbnVtYmVyXG5cblx0Y29uc3RydWN0b3IoXG5cdFx0dG91Y2hBcmVhOiBIVE1MRWxlbWVudCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNvbmZpZzoge1xuXHRcdFx0ZG9tU3dpcGVTcGFjZXJMZWZ0OiAoKSA9PiBIVE1MRWxlbWVudFxuXHRcdFx0ZG9tU3dpcGVTcGFjZXJSaWdodDogKCkgPT4gSFRNTEVsZW1lbnRcblx0XHRcdHdpZHRoOiAoKSA9PiBudW1iZXJcblx0XHRcdGdldFJvd0ZvclBvc2l0aW9uOiAoY2xpZW50Q29vcmRpbmF0ZXM6IENvb3JkaW5hdGUyRCkgPT4gTGlzdFJvdzxFbGVtZW50VHlwZSwgVkg+IHwgbnVsbFxuXHRcdFx0b25Td2lwZUxlZnQ6IChlbnRpdHk6IEVsZW1lbnRUeXBlKSA9PiBQcm9taXNlPExpc3RTd2lwZURlY2lzaW9uPlxuXHRcdFx0b25Td2lwZVJpZ2h0OiAoZW50aXR5OiBFbGVtZW50VHlwZSkgPT4gUHJvbWlzZTxMaXN0U3dpcGVEZWNpc2lvbj5cblx0XHR9LFxuXHQpIHtcblx0XHRzdXBlcih0b3VjaEFyZWEpXG5cdH1cblxuXHRvbkhvcml6b250YWxEcmFnKHhEZWx0YTogbnVtYmVyLCB5RGVsdGE6IG51bWJlcikge1xuXHRcdHN1cGVyLm9uSG9yaXpvbnRhbERyYWcoeERlbHRhLCB5RGVsdGEpXG5cdFx0Ly8gZ2V0IGl0ICpiZWZvcmUqIHJhZiBzbyB0aGF0IHdlIGRvbid0IHBpY2sgYW4gZWxlbWVudCBhZnRlciByZXNldCgpIGFnYWluXG5cdFx0Y29uc3QgdmUgPSB0aGlzLmdldFZpcnR1YWxFbGVtZW50KClcblx0XHQvLyBBbmltYXRlIHRoZSByb3cgd2l0aCBmb2xsb3dpbmcgdG91Y2hcblx0XHR3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblx0XHRcdC8vIERvIG5vdCBhbmltYXRlIHRoZSBzd2lwZSBnZXN0dXJlIG1vcmUgdGhhbiBuZWNlc3Nhcnlcblx0XHRcdHRoaXMueG9mZnNldCA9IHhEZWx0YSA8IDAgPyBNYXRoLm1heCh4RGVsdGEsIC1BQ1RJT05fRElTVEFOQ0UpIDogTWF0aC5taW4oeERlbHRhLCBBQ1RJT05fRElTVEFOQ0UpXG5cblx0XHRcdGlmICghdGhpcy5pc0FuaW1hdGluZyAmJiB2ZSAmJiB2ZS5kb21FbGVtZW50ICYmIHZlLmVudGl0eSkge1xuXHRcdFx0XHR2ZS5kb21FbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGVYKCR7dGhpcy54b2Zmc2V0fXB4KSB0cmFuc2xhdGVZKCR7dmUudG9wfXB4KWBcblx0XHRcdFx0dGhpcy5jb25maWcuZG9tU3dpcGVTcGFjZXJMZWZ0KCkuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVgoJHt0aGlzLnhvZmZzZXQgLSB0aGlzLndpZHRoKCl9cHgpIHRyYW5zbGF0ZVkoJHt2ZS50b3B9cHgpYFxuXHRcdFx0XHR0aGlzLmNvbmZpZy5kb21Td2lwZVNwYWNlclJpZ2h0KCkuc3R5bGUudHJhbnNmb3JtID0gYFxuXHRcdFx0XHR0cmFuc2xhdGVYKCR7dGhpcy54b2Zmc2V0ICsgdGhpcy53aWR0aCgpfXB4KSB0cmFuc2xhdGVZKCR7dmUudG9wfXB4KWBcblx0XHRcdH1cblx0XHR9KVxuXHR9XG5cblx0b25Ib3Jpem9udGFsR2VzdHVyZUNvbXBsZXRlZChkZWx0YTogeyB4OiBudW1iZXI7IHk6IG51bWJlciB9KTogUHJvbWlzZTx1bmtub3duPiB7XG5cdFx0aWYgKHRoaXMudmlydHVhbEVsZW1lbnQgJiYgdGhpcy52aXJ0dWFsRWxlbWVudC5lbnRpdHkgJiYgTWF0aC5hYnMoZGVsdGEueCkgPiBBQ1RJT05fRElTVEFOQ0UpIHtcblx0XHRcdC8vIHRoZSBnZXN0dXJlIGlzIGNvbXBsZXRlZFxuXHRcdFx0cmV0dXJuIHRoaXMuZmluaXNoKHRoaXMudmlydHVhbEVsZW1lbnQsIHRoaXMudmlydHVhbEVsZW1lbnQuZW50aXR5LCBkZWx0YSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRoaXMucmVzZXQoZGVsdGEpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBmaW5pc2goXG5cdFx0dmlydHVhbEVsZW1lbnQ6IExpc3RSb3c8RWxlbWVudFR5cGUsIFZIPixcblx0XHRlbnRpdHk6IEVsZW1lbnRUeXBlLFxuXHRcdGRlbHRhOiB7XG5cdFx0XHR4OiBudW1iZXJcblx0XHRcdHk6IG51bWJlclxuXHRcdH0sXG5cdCk6IFByb21pc2U8dW5rbm93bj4ge1xuXHRcdGlmICh0aGlzLnhvZmZzZXQgPT09IDApIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgbGlzdFRhcmdldFBvc2l0aW9uID0gdGhpcy54b2Zmc2V0IDwgMCA/IC10aGlzLndpZHRoKCkgOiB0aGlzLndpZHRoKClcblxuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoW1xuXHRcdFx0XHQvLyBhbmltYXRlIHN3aXBlIGFjdGlvbiB0byBmdWxsIHdpZHRoXG5cdFx0XHRcdHZpcnR1YWxFbGVtZW50LmRvbUVsZW1lbnQgJiZcblx0XHRcdFx0XHRhbmltYXRpb25zLmFkZChcblx0XHRcdFx0XHRcdHZpcnR1YWxFbGVtZW50LmRvbUVsZW1lbnQsXG5cdFx0XHRcdFx0XHR0cmFuc2Zvcm0oVHJhbnNmb3JtRW51bS5UcmFuc2xhdGVYLCB0aGlzLnhvZmZzZXQsIGxpc3RUYXJnZXRQb3NpdGlvbikuY2hhaW4oXG5cdFx0XHRcdFx0XHRcdFRyYW5zZm9ybUVudW0uVHJhbnNsYXRlWSxcblx0XHRcdFx0XHRcdFx0dmlydHVhbEVsZW1lbnQudG9wLFxuXHRcdFx0XHRcdFx0XHR2aXJ0dWFsRWxlbWVudC50b3AsXG5cdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRlYXNpbmc6IGVhc2UuaW5PdXQsXG5cdFx0XHRcdFx0XHRcdGR1cmF0aW9uOiBEZWZhdWx0QW5pbWF0aW9uVGltZSAqIDIsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdGFuaW1hdGlvbnMuYWRkKFxuXHRcdFx0XHRcdHRoaXMuY29uZmlnLmRvbVN3aXBlU3BhY2VyTGVmdCgpLFxuXHRcdFx0XHRcdHRyYW5zZm9ybShUcmFuc2Zvcm1FbnVtLlRyYW5zbGF0ZVgsIHRoaXMueG9mZnNldCAtIHRoaXMud2lkdGgoKSwgbGlzdFRhcmdldFBvc2l0aW9uIC0gdGhpcy53aWR0aCgpKS5jaGFpbihcblx0XHRcdFx0XHRcdFRyYW5zZm9ybUVudW0uVHJhbnNsYXRlWSxcblx0XHRcdFx0XHRcdHZpcnR1YWxFbGVtZW50LnRvcCxcblx0XHRcdFx0XHRcdHZpcnR1YWxFbGVtZW50LnRvcCxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGVhc2luZzogZWFzZS5pbk91dCxcblx0XHRcdFx0XHRcdGR1cmF0aW9uOiBEZWZhdWx0QW5pbWF0aW9uVGltZSAqIDIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0KSxcblx0XHRcdFx0YW5pbWF0aW9ucy5hZGQoXG5cdFx0XHRcdFx0dGhpcy5jb25maWcuZG9tU3dpcGVTcGFjZXJSaWdodCgpLFxuXHRcdFx0XHRcdHRyYW5zZm9ybShUcmFuc2Zvcm1FbnVtLlRyYW5zbGF0ZVgsIHRoaXMueG9mZnNldCArIHRoaXMud2lkdGgoKSwgbGlzdFRhcmdldFBvc2l0aW9uICsgdGhpcy53aWR0aCgpKS5jaGFpbihcblx0XHRcdFx0XHRcdFRyYW5zZm9ybUVudW0uVHJhbnNsYXRlWSxcblx0XHRcdFx0XHRcdHZpcnR1YWxFbGVtZW50LnRvcCxcblx0XHRcdFx0XHRcdHZpcnR1YWxFbGVtZW50LnRvcCxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGVhc2luZzogZWFzZS5pbk91dCxcblx0XHRcdFx0XHRcdGR1cmF0aW9uOiBEZWZhdWx0QW5pbWF0aW9uVGltZSAqIDIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0KSxcblx0XHRcdF0pXG5cblx0XHRcdHRoaXMueG9mZnNldCA9IGxpc3RUYXJnZXRQb3NpdGlvblxuXG5cdFx0XHRsZXQgc3dpcGVEZWNpc2lvbjogTGlzdFN3aXBlRGVjaXNpb25cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGlmIChkZWx0YS54IDwgMCkge1xuXHRcdFx0XHRcdHN3aXBlRGVjaXNpb24gPSBhd2FpdCB0aGlzLmNvbmZpZy5vblN3aXBlTGVmdChlbnRpdHkpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c3dpcGVEZWNpc2lvbiA9IGF3YWl0IHRoaXMuY29uZmlnLm9uU3dpcGVSaWdodChlbnRpdHkpXG5cdFx0XHRcdH1cblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihcInJlamVjdGlvbiBpbiBzd2lwZSBhY3Rpb25cIiwgZSlcblx0XHRcdFx0c3dpcGVEZWNpc2lvbiA9IExpc3RTd2lwZURlY2lzaW9uLkNhbmNlbFxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc3dpcGVEZWNpc2lvbiA9PT0gTGlzdFN3aXBlRGVjaXNpb24uQ2FuY2VsKSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMucmVzZXQoZGVsdGEpXG5cdFx0XHRcdHJldHVyblxuXHRcdFx0fVxuXG5cdFx0XHQvLyBmYWRlIG91dCBlbGVtZW50XG5cdFx0XHR0aGlzLnhvZmZzZXQgPSAwXG5cblx0XHRcdGlmICh2aXJ0dWFsRWxlbWVudC5kb21FbGVtZW50KSB7XG5cdFx0XHRcdHZpcnR1YWxFbGVtZW50LmRvbUVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVgoJHt0aGlzLnhvZmZzZXR9cHgpIHRyYW5zbGF0ZVkoJHt2aXJ0dWFsRWxlbWVudC50b3B9cHgpYFxuXHRcdFx0fVxuXG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbChbXG5cdFx0XHRcdGFuaW1hdGlvbnMuYWRkKHRoaXMuY29uZmlnLmRvbVN3aXBlU3BhY2VyTGVmdCgpLCBvcGFjaXR5KDEsIDAsIHRydWUpKSxcblx0XHRcdFx0YW5pbWF0aW9ucy5hZGQodGhpcy5jb25maWcuZG9tU3dpcGVTcGFjZXJSaWdodCgpLCBvcGFjaXR5KDEsIDAsIHRydWUpKSxcblx0XHRcdF0pXG5cblx0XHRcdC8vIHNldCBzd2lwZSBlbGVtZW50IHRvIGluaXRpYWwgY29uZmlndXJhdGlvblxuXHRcdFx0Ly8gd2l0aCBkaWZmZXJlbnQgem9vbSBsZXZlbHMgQmxpbmsgZG9lcyB3ZWlyZCB0aGluZ3MgYW5kIHNob3dzIHBhcnRzIG9mIGVsZW1lbnRzIHRoYXQgaXQgc2hvdWxkbid0IHNvIHdlIHNoaWZ0IHRoZW0gYXJvdW5kIGJ5IGEgcGl4ZWxcblx0XHRcdHRoaXMuY29uZmlnLmRvbVN3aXBlU3BhY2VyTGVmdCgpLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGVYKCR7dGhpcy54b2Zmc2V0IC0gdGhpcy53aWR0aCgpIC0gMX1weCkgdHJhbnNsYXRlWSgke3ZpcnR1YWxFbGVtZW50LnRvcH1weClgXG5cdFx0XHR0aGlzLmNvbmZpZy5kb21Td2lwZVNwYWNlclJpZ2h0KCkuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVgoJHt0aGlzLnhvZmZzZXQgKyB0aGlzLndpZHRoKCkgKyAxfXB4KSB0cmFuc2xhdGVZKCR7dmlydHVhbEVsZW1lbnQudG9wfXB4KWBcblx0XHRcdHRoaXMuY29uZmlnLmRvbVN3aXBlU3BhY2VyUmlnaHQoKS5zdHlsZS5vcGFjaXR5ID0gXCJcIlxuXHRcdFx0dGhpcy5jb25maWcuZG9tU3dpcGVTcGFjZXJMZWZ0KCkuc3R5bGUub3BhY2l0eSA9IFwiXCJcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0dGhpcy52aXJ0dWFsRWxlbWVudCA9IG51bGxcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHdpZHRoKCkge1xuXHRcdHJldHVybiB0aGlzLmNvbmZpZy53aWR0aCgpXG5cdH1cblxuXHRwcml2YXRlIGdldFZpcnR1YWxFbGVtZW50KCk6IExpc3RSb3c8RWxlbWVudFR5cGUsIFZIPiB8IG51bGwge1xuXHRcdGlmICghdGhpcy52aXJ0dWFsRWxlbWVudCkge1xuXHRcdFx0Ly8gdG91Y2ggY29vcmRpbmF0ZXMgYXJlIGJhc2VkIG9uIGNsaWVudFggc28gdGhleSBhcmUgcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0IGFuZCB3ZSBuZWVkIHRvIGFkanVzdCB0aGVtIGJ5IHRoZSBwb3NpdGlvbiBvZiB0aGUgbGlzdFxuXHRcdFx0dGhpcy52aXJ0dWFsRWxlbWVudCA9IHRoaXMuY29uZmlnLmdldFJvd0ZvclBvc2l0aW9uKHRoaXMuc3RhcnRQb3MpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMudmlydHVhbEVsZW1lbnRcblx0fVxuXG5cdHJlc2V0KGRlbHRhOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyIH0pOiBQcm9taXNlPHVua25vd24+IHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKHRoaXMueG9mZnNldCAhPT0gMCkge1xuXHRcdFx0XHRjb25zdCB2ZSA9IHRoaXMudmlydHVhbEVsZW1lbnRcblxuXHRcdFx0XHRpZiAodmUgJiYgdmUuZG9tRWxlbWVudCAmJiB2ZS5lbnRpdHkpIHtcblx0XHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5hbGwoW1xuXHRcdFx0XHRcdFx0YW5pbWF0aW9ucy5hZGQodmUuZG9tRWxlbWVudCwgdHJhbnNmb3JtKFRyYW5zZm9ybUVudW0uVHJhbnNsYXRlWCwgdGhpcy54b2Zmc2V0LCAwKS5jaGFpbihUcmFuc2Zvcm1FbnVtLlRyYW5zbGF0ZVksIHZlLnRvcCwgdmUudG9wKSwge1xuXHRcdFx0XHRcdFx0XHRlYXNpbmc6IGVhc2UuaW5PdXQsXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdGFuaW1hdGlvbnMuYWRkKFxuXHRcdFx0XHRcdFx0XHR0aGlzLmNvbmZpZy5kb21Td2lwZVNwYWNlckxlZnQoKSxcblx0XHRcdFx0XHRcdFx0dHJhbnNmb3JtKFRyYW5zZm9ybUVudW0uVHJhbnNsYXRlWCwgdGhpcy54b2Zmc2V0IC0gdGhpcy53aWR0aCgpLCAtdGhpcy53aWR0aCgpKS5jaGFpbihUcmFuc2Zvcm1FbnVtLlRyYW5zbGF0ZVksIHZlLnRvcCwgdmUudG9wKSxcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGVhc2luZzogZWFzZS5pbk91dCxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRhbmltYXRpb25zLmFkZChcblx0XHRcdFx0XHRcdFx0dGhpcy5jb25maWcuZG9tU3dpcGVTcGFjZXJSaWdodCgpLFxuXHRcdFx0XHRcdFx0XHR0cmFuc2Zvcm0oVHJhbnNmb3JtRW51bS5UcmFuc2xhdGVYLCB0aGlzLnhvZmZzZXQgKyB0aGlzLndpZHRoKCksIHRoaXMud2lkdGgoKSkuY2hhaW4oVHJhbnNmb3JtRW51bS5UcmFuc2xhdGVZLCB2ZS50b3AsIHZlLnRvcCksXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRlYXNpbmc6IGVhc2UuaW5PdXQsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdF0pXG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLnhvZmZzZXQgPSAwXG5cdFx0XHR9XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdHRoaXMudmlydHVhbEVsZW1lbnQgPSBudWxsXG5cdFx0fVxuXG5cdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDbGFzc0NvbXBvbmVudCwgVm5vZGUsIFZub2RlRE9NIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgZGVib3VuY2UsIG1lbW9pemVkLCBudW1iZXJSYW5nZSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgcHgsIHNpemUgfSBmcm9tIFwiLi4vc2l6ZS5qc1wiXG5pbXBvcnQgeyBpc0tleVByZXNzZWQgfSBmcm9tIFwiLi4vLi4vbWlzYy9LZXlNYW5hZ2VyLmpzXCJcbmltcG9ydCB7IEtleXMsIFRhYkluZGV4IH0gZnJvbSBcIi4uLy4uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSBcIi4uLy4uL21pc2MvQ2xpZW50RGV0ZWN0b3IuanNcIlxuaW1wb3J0IHsgcHJvZ3Jlc3NJY29uIH0gZnJvbSBcIi4vSWNvbi5qc1wiXG5pbXBvcnQgeyBCdXR0b24sIEJ1dHRvblR5cGUgfSBmcm9tIFwiLi9CdXR0b24uanNcIlxuaW1wb3J0IHsgTGlzdFN3aXBlSGFuZGxlciB9IGZyb20gXCIuL0xpc3RTd2lwZUhhbmRsZXIuanNcIlxuaW1wb3J0IHsgYXBwbHlTYWZlQXJlYUluc2V0TWFyZ2luTFIgfSBmcm9tIFwiLi4vSHRtbFV0aWxzLmpzXCJcbmltcG9ydCB7IHRoZW1lLCBUaGVtZUlkIH0gZnJvbSBcIi4uL3RoZW1lLmpzXCJcbmltcG9ydCB7IFByb2dyYW1taW5nRXJyb3IgfSBmcm9tIFwiLi4vLi4vYXBpL2NvbW1vbi9lcnJvci9Qcm9ncmFtbWluZ0Vycm9yLmpzXCJcbmltcG9ydCB7IENvb3JkaW5hdGUyRCB9IGZyb20gXCIuL1N3aXBlSGFuZGxlci5qc1wiXG5pbXBvcnQgeyBzdHlsZXMgfSBmcm9tIFwiLi4vc3R5bGVzLmpzXCJcblxuZXhwb3J0IHR5cGUgTGlzdFN0YXRlPFQ+ID0gUmVhZG9ubHk8e1xuXHRpdGVtczogUmVhZG9ubHlBcnJheTxUPlxuXHRsb2FkaW5nU3RhdHVzOiBMaXN0TG9hZGluZ1N0YXRlXG5cdGxvYWRpbmdBbGw6IGJvb2xlYW5cblx0c2VsZWN0ZWRJdGVtczogUmVhZG9ubHlTZXQ8VD5cblx0aW5NdWx0aXNlbGVjdDogYm9vbGVhblxuXHRhY3RpdmVJbmRleDogbnVtYmVyIHwgbnVsbFxufT5cblxuZXhwb3J0IGVudW0gTGlzdExvYWRpbmdTdGF0ZSB7XG5cdC8qKiBub3QgbG9hZGluZyBhbnl0aGluZyAqL1xuXHRJZGxlLFxuXHRMb2FkaW5nLFxuXHQvKiogbG9hZGluZyB3YXMgY2FuY2VsbGVkLCBlLmcuIGJlY2F1c2Ugb2YgdGhlIG5ldHdvcmsgZXJyb3Igb3IgZXhwbGljaXQgdXNlciByZXF1ZXN0ICovXG5cdENvbm5lY3Rpb25Mb3N0LFxuXHQvKiogZmluaXNoZWQgbG9hZGluZyAqL1xuXHREb25lLFxufVxuXG5leHBvcnQgdHlwZSBTd2lwZUNvbmZpZ3VyYXRpb248VD4gPSB7XG5cdHJlbmRlckxlZnRTcGFjZXIoKTogQ2hpbGRyZW5cblx0cmVuZGVyUmlnaHRTcGFjZXIoKTogQ2hpbGRyZW5cblx0c3dpcGVMZWZ0KGVsZW1lbnQ6IFQpOiBQcm9taXNlPExpc3RTd2lwZURlY2lzaW9uPlxuXHRzd2lwZVJpZ2h0KGVsZW1lbnQ6IFQpOiBQcm9taXNlPExpc3RTd2lwZURlY2lzaW9uPlxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZpZXdIb2xkZXI8VD4ge1xuXHR1cGRhdGUoaXRlbTogVCwgc2VsZWN0ZWQ6IGJvb2xlYW4sIG11bHRpc2VsZWN0OiBib29sZWFuKTogdm9pZFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlbmRlckNvbmZpZzxULCBSIGV4dGVuZHMgVmlld0hvbGRlcjxUPj4ge1xuXHQvKiogQ3JlYXRlIGEgVmlld0hvbGRlciBpdGVtLiBUaGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciBhdHRhY2hpbmcgaXQgdG8gdGhlIHtAcGFyYW0gZG9tfS4gKi9cblx0Y3JlYXRlRWxlbWVudDogKGRvbTogSFRNTEVsZW1lbnQpID0+IFJcblx0aXRlbUhlaWdodDogbnVtYmVyXG5cdG11bHRpc2VsZWN0aW9uQWxsb3dlZDogTXVsdGlzZWxlY3RNb2RlXG5cdHN3aXBlOiBTd2lwZUNvbmZpZ3VyYXRpb248VD4gfCBudWxsXG5cblx0LyoqXG5cdCAqIGFkZCBjdXN0b20gZHJhZyBiZWhhdmlvdXIgdG8gdGhlIGxpc3QuXG5cdCAqIEBwYXJhbSBldiBkcmFnc3RhcnQgZXZlbnRcblx0ICogQHBhcmFtIGVudGl0eTogdGhlIHJvdyB0aGUgZXZlbnQgd2FzIHN0YXJ0ZWQgb25cblx0ICogQHBhcmFtIHNlbGVjdGVkRWxlbWVudHMgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBlbGVtZW50c1xuXHQgKi9cblx0ZHJhZ1N0YXJ0PzogKGV2OiBEcmFnRXZlbnQsIGVudGl0eTogVCwgc2VsZWN0ZWRFbGVtZW50czogUmVhZG9ubHlTZXQ8VD4pID0+IHZvaWRcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gTXVsdGlzZWxlY3RNb2RlIHtcblx0RGlzYWJsZWQsXG5cdEVuYWJsZWQsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIExpc3RTd2lwZURlY2lzaW9uIHtcblx0Q2FuY2VsLFxuXHRDb21taXQsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGlzdEF0dHJzPFQsIFIgZXh0ZW5kcyBWaWV3SG9sZGVyPFQ+PiB7XG5cdC8qKiB3aWxsIGJlIGNvbXBhcmVkIHJlZmVyZW50aWFsbHksIHdpbGwgdXBkYXRlIHRoZSBET00gb24gY2hhbmdlICAqL1xuXHRzdGF0ZTogTGlzdFN0YXRlPFQ+XG5cdC8qKiB3aWxsIGJlIGNvbXBhcmVkIHJlZmVyZW50aWFsbHksIHdpbGwgY29tcGxldGVseSByZXNldCBET00gYW5kIHN0YXRlIG9uIGNoYW5nZSAqL1xuXHRyZW5kZXJDb25maWc6IFJlbmRlckNvbmZpZzxULCBSPlxuXG5cdC8qKiBjYWxsZWQgd2hlbiB0aGUgZW5kIG9mIHRoZSBsaXN0IGlzIGdldHRpbmcgY2xvc2UgdG8gdGhlIHZpZXdwb3J0IG9yIHdoZW4gXCJsb2FkIG1vcmVcIiBidXR0b24gaXMgcHJlc3NlZC4gKi9cblx0b25Mb2FkTW9yZSgpOiB2b2lkXG5cblx0LyoqIGNhbGxlZCBhZnRlciB0aGUgbG9hZGluZyBmYWlsZWQvY2FuY2VsbGVkIGFuZCByZXRyeSBidXR0b24gb24gcHJvZ3Jlc3MgaXRlbSB3YXMgcHJlc3NlZCAqL1xuXHRvblJldHJ5TG9hZGluZygpOiB2b2lkXG5cblx0LyoqIEEgbm9ybWFsIHNlbGVjdGlvbiBmb3Igc2luZ2xlIGl0ZW0uICovXG5cdG9uU2luZ2xlU2VsZWN0aW9uKGl0ZW06IFQpOiB1bmtub3duXG5cblx0LyoqIFNlbGVjdGlvbiB0aGF0IGVudGVycyBtdWx0aXNlbGVjdCB3aGVuIHRyaWdnZXJlZC4gVG9nZ2xpbmcgdGhlIHNlbGVjdGlvbiBmb3IgdGhlIHNlbGVjdGVkIGl0ZW0gaW4gbXVsdGlzZWxlY3QgZGVzZWxlY3RzIGl0LiAqL1xuXHRvblNpbmdsZVRvZ2dsaW5nTXVsdGlzZWxlY3Rpb24oaXRlbTogVCk6IHVua25vd25cblxuXHQvKiogY2FsbGVkIHdoZW4gcmFuZ2Ugc2VsZWN0aW9uIGlzIGV4dGVuZGVkICovXG5cdG9uUmFuZ2VTZWxlY3Rpb25Ub3dhcmRzKGl0ZW06IFQpOiB1bmtub3duXG5cblx0LyoqIGNhbGxlZCB3aGVuIHN0b3AgYnV0dG9uIHdhcyBwcmVzc2VkIGluIHByb2dyZXNzIGl0ZW0gKi9cblx0b25TdG9wTG9hZGluZygpOiB1bmtub3duXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGlzdFJvdzxULCBSIGV4dGVuZHMgVmlld0hvbGRlcjxUPj4ge1xuXHRlbnRpdHk6IFQgfCBudWxsXG5cdHJvdzogUlxuXHR0b3A6IG51bWJlclxuXHRkb21FbGVtZW50OiBIVE1MRWxlbWVudFxufVxuXG5jb25zdCBTY3JvbGxCdWZmZXIgPSAxNVxuXG4vKiogRGlzcGxheXMgdGhlIGl0ZW1zIGluIHRoZSB2aXJ0dWFsIGxpc3QuIENhbiBhbHNvIGRpc3BsYXkgcHJvZ3Jlc3MvY2FuY2VsbGVkIGxvYWRpbmcgc3RhdGUuICovXG5leHBvcnQgY2xhc3MgTGlzdDxULCBWSCBleHRlbmRzIFZpZXdIb2xkZXI8VD4+IGltcGxlbWVudHMgQ2xhc3NDb21wb25lbnQ8TGlzdEF0dHJzPFQsIFZIPj4ge1xuXHRwcml2YXRlIGlubmVyRG9tOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgY29udGFpbmVyRG9tOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgcm93czogTGlzdFJvdzxULCBWSD5bXSA9IFtdXG5cdHByaXZhdGUgc3RhdGU6IExpc3RTdGF0ZTxUPiB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgY3VycmVudFBvc2l0aW9uOiBudW1iZXIgPSAwXG5cdHByaXZhdGUgbGFzdEF0dHJzITogTGlzdEF0dHJzPFQsIFZIPlxuXHRwcml2YXRlIGRvbVN3aXBlU3BhY2VyTGVmdCE6IEhUTUxFbGVtZW50XG5cdHByaXZhdGUgZG9tU3dpcGVTcGFjZXJSaWdodCE6IEhUTUxFbGVtZW50XG5cdHByaXZhdGUgbG9hZGluZ0luZGljYXRvckNoaWxkRG9tITogSFRNTEVsZW1lbnRcblx0cHJpdmF0ZSBzd2lwZUhhbmRsZXIhOiBMaXN0U3dpcGVIYW5kbGVyPFQsIFZIPlxuXHRwcml2YXRlIHdpZHRoID0gMFxuXHRwcml2YXRlIGhlaWdodCA9IDBcblx0Ly8gcmVtZW1iZXIgdGhlIGxhc3QgdGltZSB3ZSBuZWVkZWQgdG8gc2Nyb2xsIHNvbWV3aGVyZVxuXHRwcml2YXRlIGFjdGl2ZUluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGxhc3RUaGVtZUlkOiBUaGVtZUlkID0gdGhlbWUudGhlbWVJZFxuXG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxMaXN0QXR0cnM8VCwgVkg+Pikge1xuXHRcdGNvbnN0IG9sZEF0dHJzID0gdGhpcy5sYXN0QXR0cnNcblx0XHR0aGlzLmxhc3RBdHRycyA9IGF0dHJzXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5saXN0LWNvbnRhaW5lci5vdmVyZmxvdy15LXNjcm9sbC5ub2ZvY3VzLm92ZXJmbG93LXgtaGlkZGVuLmZpbGwtYWJzb2x1dGVcIixcblx0XHRcdHtcblx0XHRcdFx0XCJkYXRhLXRlc3RpZFwiOiBcInVub3JkZXJlZF9saXN0XCIsXG5cdFx0XHRcdG9uY3JlYXRlOiAoeyBkb20gfTogVm5vZGVET00pID0+IHtcblx0XHRcdFx0XHR0aGlzLmNvbnRhaW5lckRvbSA9IGRvbSBhcyBIVE1MRWxlbWVudFxuXG5cdFx0XHRcdFx0Ly8gU29tZSBvZiB0aGUgdGVjaC1zYXZ2eSB1c2VycyBsaWtlIHRvIGRpc2FibGUgKmFsbCogXCJleHBlcmltZW50YWwgZmVhdHVyZXNcIiBpbiB0aGVpciBTYWZhcmkgZGV2aWNlcyBhbmQgdGhlcmUncyBhbHNvIGEgdG9nZ2xlIHRvIGRpc2FibGVcblx0XHRcdFx0XHQvLyBSZXNpemVPYnNlcnZlci4gU2luY2UgdGhlIGFwcCB3b3JrcyB3aXRob3V0IGl0IGFueXdheSB3ZSBqdXN0IGZhbGwgYmFjayB0byBub3QgaGFuZGxpbmcgdGhlIHJlc2l6ZSBldmVudHMuXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBSZXNpemVPYnNlcnZlciAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0XHRcdFx0bmV3IFJlc2l6ZU9ic2VydmVyKCgpID0+IHtcblx0XHRcdFx0XHRcdFx0dGhpcy51cGRhdGVTaXplKClcblx0XHRcdFx0XHRcdH0pLm9ic2VydmUodGhpcy5jb250YWluZXJEb20pXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB0aGlzLnVwZGF0ZVNpemUoKSlcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR0aGlzLnN3aXBlSGFuZGxlciA9IHRoaXMuY3JlYXRlU3dpcGVIYW5kbGVyKClcblx0XHRcdFx0fSxcblx0XHRcdFx0b25zY3JvbGw6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLm9uU2Nyb2xsKGF0dHJzKVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHRoaXMucmVuZGVyU3dpcGVJdGVtcyhhdHRycyksXG5cdFx0XHQvLyB3ZSBuZWVkIHJlbCBmb3IgdGhlIHN0YXR1cyBpbmRpY2F0b3Jcblx0XHRcdG0oXCJ1bC5saXN0LnJlbC5jbGlja1wiLCB7XG5cdFx0XHRcdG9uY3JlYXRlOiAoeyBkb20gfSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuaW5uZXJEb20gPSBkb20gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0XHR0aGlzLmluaXRpYWxpemVEb20oZG9tIGFzIEhUTUxFbGVtZW50LCBhdHRycylcblx0XHRcdFx0XHR0aGlzLnVwZGF0ZURvbUVsZW1lbnRzKGF0dHJzKVxuXHRcdFx0XHRcdHRoaXMuc3RhdGUgPSBhdHRycy5zdGF0ZVxuXHRcdFx0XHRcdHRoaXMubGFzdFRoZW1lSWQgPSB0aGVtZS50aGVtZUlkXG5cdFx0XHRcdFx0aWYgKHN0eWxlcy5pc1NpbmdsZUNvbHVtbkxheW91dCgpKSB0aGlzLmlubmVyRG9tLmZvY3VzKClcblx0XHRcdFx0fSxcblx0XHRcdFx0b251cGRhdGU6ICh7IGRvbSB9KSA9PiB7XG5cdFx0XHRcdFx0aWYgKG9sZEF0dHJzLnJlbmRlckNvbmZpZyAhPT0gYXR0cnMucmVuZGVyQ29uZmlnKSB7XG5cdFx0XHRcdFx0XHQvLyByZXNldCBldmVyeXRoaW5nXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcImxpc3QgcmVuZGVyQ29uZmlnIGhhcyBjaGFuZ2VkLCByZXNldFwiKVxuXHRcdFx0XHRcdFx0Ly8gbS5yZW5kZXIgYWN0dWFsbHkgZG9lcyBkaWZmaW5nIGlmIHlvdSBjYWxsIGl0IG9uIHRoZSBzYW1lIGRvbSBlbGVtZW50IGFnYWluIHdoaWNoIGlzIG5vdCBzb21ldGhpbmcgdGhhdCB3ZSB3YW50LCB3ZSB3YW50IGNvbXBsZXRlbHlcblx0XHRcdFx0XHRcdC8vIG5ldyBkb20gZWxlbWVudHMgKGF0IGxlYXN0IHRoYXQncyB0aGUgc2ltcGxlc3QgYW5kIG1vc3QgcmVsaWFibGUgd2F5IHRvIHJlc2V0KS5cblx0XHRcdFx0XHRcdC8vIHNvIHdlIHRyaWNrIG1pdGhyaWwgaW50byB0aGlua2luZyB0aGF0IG5vdGhpbmcgd2FzIHJlbmRlcmVkIGJlZm9yZS4gbWl0aHJpbCB3aWxsIHJlc2V0IHRoZSBET00gZm9yIHVzIHRvby5cblx0XHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRcdGRvbS52bm9kZXMgPSBudWxsXG5cdFx0XHRcdFx0XHR0aGlzLmluaXRpYWxpemVEb20oZG9tIGFzIEhUTUxFbGVtZW50LCBhdHRycylcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gaWYgdGhlIHN0YXRlIGhhcyBjaGFuZ2VkIG9yIHRoZSB0aGVtZSBoYXMgY2hhbmdlZCB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgRE9NXG5cdFx0XHRcdFx0aWYgKHRoaXMuc3RhdGUgIT09IGF0dHJzLnN0YXRlIHx8IHRoaXMubGFzdFRoZW1lSWQgIT09IHRoZW1lLnRoZW1lSWQpIHtcblx0XHRcdFx0XHRcdHRoaXMudXBkYXRlRG9tRWxlbWVudHMoYXR0cnMpXG5cdFx0XHRcdFx0XHR0aGlzLnN0YXRlID0gYXR0cnMuc3RhdGVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhpcy5sYXN0VGhlbWVJZCA9IHRoZW1lLnRoZW1lSWRcblx0XHRcdFx0fSxcblx0XHRcdFx0b25zY3JvbGw6ICgpID0+IHtcblx0XHRcdFx0XHRhdHRycy5vbkxvYWRNb3JlKClcblx0XHRcdFx0fSxcblx0XHRcdH0pLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgY3JlYXRlU3dpcGVIYW5kbGVyKCkge1xuXHRcdHJldHVybiBuZXcgTGlzdFN3aXBlSGFuZGxlcjxULCBWSD4odGhpcy5jb250YWluZXJEb20hLCB7XG5cdFx0XHR3aWR0aDogKCkgPT4gdGhpcy53aWR0aCxcblx0XHRcdGRvbVN3aXBlU3BhY2VyTGVmdDogKCkgPT4gdGhpcy5kb21Td2lwZVNwYWNlckxlZnQsXG5cdFx0XHRkb21Td2lwZVNwYWNlclJpZ2h0OiAoKSA9PiB0aGlzLmRvbVN3aXBlU3BhY2VyUmlnaHQsXG5cdFx0XHRnZXRSb3dGb3JQb3NpdGlvbjogKGNvb3JkKSA9PiB0aGlzLmdldFJvd0ZvclBvc2l0aW9uKGNvb3JkKSxcblx0XHRcdG9uU3dpcGVMZWZ0OiBhc3luYyAoZWwpID0+IHRoaXMubGFzdEF0dHJzLnJlbmRlckNvbmZpZy5zd2lwZT8uc3dpcGVMZWZ0KGVsKSA/PyBMaXN0U3dpcGVEZWNpc2lvbi5DYW5jZWwsXG5cdFx0XHRvblN3aXBlUmlnaHQ6IGFzeW5jIChlbCkgPT4gdGhpcy5sYXN0QXR0cnMucmVuZGVyQ29uZmlnLnN3aXBlPy5zd2lwZVJpZ2h0KGVsKSA/PyBMaXN0U3dpcGVEZWNpc2lvbi5DYW5jZWwsXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgZ2V0Um93Rm9yUG9zaXRpb24oY2xpZW50Q29vcmRpYW50ZTogQ29vcmRpbmF0ZTJEKSB7XG5cdFx0Y29uc3QgdG91Y2hBcmVhT2Zmc2V0ID0gdGhpcy5jb250YWluZXJEb20hLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcFxuXHRcdGNvbnN0IHJlbGF0aXZlWVBvc2l0aW9uID0gdGhpcy5jdXJyZW50UG9zaXRpb24gKyBjbGllbnRDb29yZGlhbnRlLnkgLSB0b3VjaEFyZWFPZmZzZXRcblxuXHRcdGNvbnN0IGl0ZW1JbmRleCA9IE1hdGguZmxvb3IocmVsYXRpdmVZUG9zaXRpb24gLyB0aGlzLmxhc3RBdHRycy5yZW5kZXJDb25maWcuaXRlbUhlaWdodClcblx0XHRjb25zdCB0YXJnZXRFbGVtZW50UG9zaXRpb24gPSBpdGVtSW5kZXggKiB0aGlzLmxhc3RBdHRycy5yZW5kZXJDb25maWcuaXRlbUhlaWdodFxuXG5cdFx0Ly8gV2UgY291bGQgZmluZCB0aGUgZW50aXR5IGp1c3QgYnkgaW5kZXhpbmcgaW50byBpdCBidXQgd2Ugd291bGQgbmVlZCB0byBzY2FuIHRoZSByb3dzIHRvIGZpbmQgdGhlIHJpZ2h0IG9uZSBhbnl3YXlcblx0XHQvLyBBc3N1bWluZyB0aGF0IHRoZSByb3dzIGFyZSB1c2VkIGluIHRoZSBvcmRlciBvZiB0aGVpciBwb3NpdGlvbiB3ZSBjb3VsZCB1c2UgYmluYXJ5IHNlYXJjaFxuXHRcdHJldHVybiB0aGlzLnJvd3MuZmluZCgodmUpID0+IHZlLnRvcCA9PT0gdGFyZ2V0RWxlbWVudFBvc2l0aW9uKSA/PyBudWxsXG5cdH1cblxuXHRwcml2YXRlIHJlYWRvbmx5IFZJUlRVQUxfTElTVF9MRU5HVEggPSAxMDBcblxuXHRwcml2YXRlIGluaXRpYWxpemVEb20oZG9tOiBIVE1MRWxlbWVudCwgYXR0cnM6IExpc3RBdHRyczxULCBWSD4pIHtcblx0XHRjb25zdCByb3dzOiBMaXN0Um93PFQsIFZIPltdID0gW11cblx0XHRtLnJlbmRlcihcblx0XHRcdGRvbSxcblx0XHRcdC8vIGhhcmRjb2RlZCBudW1iZXIgb2YgZWxlbWVudHMgZm9yIG5vd1xuXHRcdFx0W251bWJlclJhbmdlKDAsIHRoaXMuVklSVFVBTF9MSVNUX0xFTkdUSCAtIDEpLm1hcCgoKSA9PiB0aGlzLmNyZWF0ZVJvdyhhdHRycywgcm93cykpLCB0aGlzLnJlbmRlclN0YXR1c1JvdygpXSxcblx0XHQpXG5cblx0XHR0aGlzLnJvd3MgPSByb3dzXG5cdFx0aWYgKHJvd3MubGVuZ3RoICE9PSB0aGlzLlZJUlRVQUxfTElTVF9MRU5HVEgpIHtcblx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKGBpbnZhbGlkIHJvd3MgbGVuZ3RoLCBleHBlY3RlZCAke3RoaXMuVklSVFVBTF9MSVNUX0xFTkdUSH0gcm93cywgZ290ICR7dGhpcy5yb3dzLmxlbmd0aH1gKVxuXHRcdH1cblxuXHRcdGlmIChhdHRycy5yZW5kZXJDb25maWcuc3dpcGUpIHtcblx0XHRcdHRoaXMuc3dpcGVIYW5kbGVyPy5hdHRhY2goKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnN3aXBlSGFuZGxlci5kZXRhY2goKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgb25TY3JvbGwoYXR0cnM6IExpc3RBdHRyczxULCBWSD4pIHtcblx0XHRjb25zdCB2aXNpYmxlRWxlbWVudEhlaWdodCA9IHRoaXMudXBkYXRlRG9tRWxlbWVudHMoYXR0cnMpXG5cdFx0dGhpcy5sb2FkTW9yZUlmTmVjZXNzYXJ5KGF0dHJzLCB2aXNpYmxlRWxlbWVudEhlaWdodClcblx0fVxuXG5cdHByaXZhdGUgY3JlYXRlUm93KGF0dHJzOiBMaXN0QXR0cnM8VCwgVkg+LCByb3dzOiBMaXN0Um93PFQsIFZIPltdKSB7XG5cdFx0cmV0dXJuIG0oXCJsaS5saXN0LXJvdy5ub2ZvY3VzXCIsIHtcblx0XHRcdGRyYWdnYWJsZTogYXR0cnMucmVuZGVyQ29uZmlnLmRyYWdTdGFydCA/IFwidHJ1ZVwiIDogdW5kZWZpbmVkLFxuXHRcdFx0dGFiaW5kZXg6IFRhYkluZGV4LkRlZmF1bHQsXG5cdFx0XHRvbmNyZWF0ZTogKHZub2RlOiBWbm9kZURPTSkgPT4ge1xuXHRcdFx0XHRjb25zdCBkb20gPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0Y29uc3Qgcm93ID0ge1xuXHRcdFx0XHRcdHJvdzogYXR0cnMucmVuZGVyQ29uZmlnLmNyZWF0ZUVsZW1lbnQoZG9tKSxcblx0XHRcdFx0XHRkb21FbGVtZW50OiBkb20sXG5cdFx0XHRcdFx0dG9wOiAtMSxcblx0XHRcdFx0XHRlbnRpdHk6IG51bGwsXG5cdFx0XHRcdH1cblx0XHRcdFx0cm93cy5wdXNoKHJvdylcblx0XHRcdFx0dGhpcy5zZXRSb3dFdmVudExpc3RlbmVycyhhdHRycywgZG9tLCByb3cpXG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHNldFJvd0V2ZW50TGlzdGVuZXJzKGF0dHJzOiBMaXN0QXR0cnM8VCwgVkg+LCBkb21FbGVtZW50OiBIVE1MRWxlbWVudCwgcm93OiBMaXN0Um93PFQsIFZIPikge1xuXHRcdGNvbnN0IExPTkdfUFJFU1NfRFVSQVRJT05fTVMgPSA0MDBcblx0XHRsZXQgdG91Y2hTdGFydFRpbWU6IG51bWJlciB8IG51bGwgPSBudWxsXG5cblx0XHRkb21FbGVtZW50Lm9uY2xpY2sgPSAoZSkgPT4ge1xuXHRcdFx0aWYgKCF0b3VjaFN0YXJ0VGltZSB8fCBEYXRlLm5vdygpIC0gdG91Y2hTdGFydFRpbWUgPCBMT05HX1BSRVNTX0RVUkFUSU9OX01TKSB7XG5cdFx0XHRcdGlmIChyb3cuZW50aXR5KSB0aGlzLmhhbmRsZUV2ZW50KHJvdy5lbnRpdHksIGUpXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZG9tRWxlbWVudC5vbmtleXVwID0gKGUpID0+IHtcblx0XHRcdGlmIChpc0tleVByZXNzZWQoZS5rZXksIEtleXMuU1BBQ0UsIEtleXMuUkVUVVJOKSkge1xuXHRcdFx0XHRpZiAocm93LmVudGl0eSkgdGhpcy5oYW5kbGVFdmVudChyb3cuZW50aXR5LCBlKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIEhhbmRsZSBoaWdobGlnaHRpbmcgdGhlIHJvdyB3aGVuIHRhYmJlZCBvbnRvIG9yIG91dCBvZlxuXHRcdGNvbnN0IG9uRm9jdXMgPSAoZm9jdXNUeXBlOiBcImZvY3VzXCIgfCBcImJsdXJcIikgPT4ge1xuXHRcdFx0cmV0dXJuIChlOiBGb2N1c0V2ZW50KSA9PiB7XG5cdFx0XHRcdGNvbnN0IGRvbSA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbFxuXHRcdFx0XHQvLyBBY3RpdmF0ZSB0aGUgYmFja2dyb3VuZCBjb2xvdXIgaW4gYFNlbGVjdGFibGVSb3dDb250YWluZXJgXG5cdFx0XHRcdC8vIFRPRE86IFRyYW5zaXRpb24gdG8gYHN0YXRlLWJnYFxuXHRcdFx0XHRpZiAoZG9tICYmIGRvbS5maXJzdEVsZW1lbnRDaGlsZCkge1xuXHRcdFx0XHRcdGRvbS5maXJzdEVsZW1lbnRDaGlsZD8uZGlzcGF0Y2hFdmVudChuZXcgRm9jdXNFdmVudChmb2N1c1R5cGUpKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGRvbUVsZW1lbnQub25mb2N1cyA9IG9uRm9jdXMoXCJmb2N1c1wiKVxuXHRcdGRvbUVsZW1lbnQub25ibHVyID0gb25Gb2N1cyhcImJsdXJcIilcblxuXHRcdGRvbUVsZW1lbnQub25kcmFnc3RhcnQgPSAoZTogRHJhZ0V2ZW50KSA9PiB7XG5cdFx0XHQvLyBUaGUgcXVpY2sgY2hhbmdlIG9mIHRoZSBiYWNrZ3JvdW5kIGNvbG9yIGlzIHRvIHByZXZlbnQgYSB3aGl0ZSBiYWNrZ3JvdW5kIGFwcGVhcmluZyBpbiBkYXJrIG1vZGVcblx0XHRcdGlmIChyb3cuZG9tRWxlbWVudCkgcm93LmRvbUVsZW1lbnQhLnN0eWxlLmJhY2tncm91bmQgPSB0aGVtZS5uYXZpZ2F0aW9uX2JnXG5cdFx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXHRcdFx0XHRpZiAocm93LmRvbUVsZW1lbnQpIHJvdy5kb21FbGVtZW50IS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJcIlxuXHRcdFx0fSlcblx0XHRcdGlmIChhdHRycy5yZW5kZXJDb25maWcuZHJhZ1N0YXJ0KSB7XG5cdFx0XHRcdGlmIChyb3cuZW50aXR5ICYmIHRoaXMuc3RhdGUpIGF0dHJzLnJlbmRlckNvbmZpZy5kcmFnU3RhcnQoZSwgcm93LmVudGl0eSwgdGhpcy5zdGF0ZS5zZWxlY3RlZEl0ZW1zKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChhdHRycy5yZW5kZXJDb25maWcubXVsdGlzZWxlY3Rpb25BbGxvd2VkID09PSBNdWx0aXNlbGVjdE1vZGUuRW5hYmxlZCkge1xuXHRcdFx0bGV0IHRpbWVvdXRJZDogVGltZW91dElEIHwgbnVsbFxuXHRcdFx0bGV0IHRvdWNoU3RhcnRDb29yZHM6IHsgeDogbnVtYmVyOyB5OiBudW1iZXIgfSB8IG51bGwgPSBudWxsXG5cdFx0XHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIChlOiBUb3VjaEV2ZW50KSA9PiB7XG5cdFx0XHRcdHRvdWNoU3RhcnRUaW1lID0gRGF0ZS5ub3coKVxuXG5cdFx0XHRcdC8vIEFjdGl2YXRlIG11bHRpIHNlbGVjdGlvbiBhZnRlciBwYXVzZVxuXHRcdFx0XHR0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0XHQvLyBjaGVjayB0aGF0IHZpcnR1YWxSb3cuZW50aXR5IGV4aXN0cyBiZWNhdXNlIHdlIGhhZCBlcnJvciBmZWVkYmFja3MgYWJvdXQgaXRcblx0XHRcdFx0XHRpZiAocm93LmVudGl0eSkge1xuXHRcdFx0XHRcdFx0YXR0cnMub25TaW5nbGVUb2dnbGluZ011bHRpc2VsZWN0aW9uKHJvdy5lbnRpdHkpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdFx0fSwgTE9OR19QUkVTU19EVVJBVElPTl9NUylcblx0XHRcdFx0dG91Y2hTdGFydENvb3JkcyA9IHtcblx0XHRcdFx0XHR4OiBlLnRvdWNoZXNbMF0ucGFnZVgsXG5cdFx0XHRcdFx0eTogZS50b3VjaGVzWzBdLnBhZ2VZLFxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXG5cdFx0XHRjb25zdCB0b3VjaEVuZCA9ICgpID0+IHtcblx0XHRcdFx0aWYgKHRpbWVvdXRJZCkgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZClcblx0XHRcdH1cblx0XHRcdGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIHRvdWNoRW5kKVxuXHRcdFx0ZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hjYW5jZWxcIiwgdG91Y2hFbmQpXG5cblx0XHRcdGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZTogVG91Y2hFdmVudCkgPT4ge1xuXHRcdFx0XHQvLyBJZiB0aGUgdXNlciBtb3ZlZCB0aGUgZmluZ2VyIHRvbyBtdWNoIGJ5IGFueSBheGlzLCBkb24ndCBjb3VudCBpdCBhcyBhIGxvbmcgcHJlc3Ncblx0XHRcdFx0Y29uc3QgbWF4RGlzdGFuY2UgPSAzMFxuXHRcdFx0XHRjb25zdCB0b3VjaCA9IGUudG91Y2hlc1swXVxuXG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHR0b3VjaFN0YXJ0Q29vcmRzICYmXG5cdFx0XHRcdFx0dGltZW91dElkICYmXG5cdFx0XHRcdFx0KE1hdGguYWJzKHRvdWNoLnBhZ2VYIC0gdG91Y2hTdGFydENvb3Jkcy54KSA+IG1heERpc3RhbmNlIHx8IE1hdGguYWJzKHRvdWNoLnBhZ2VZIC0gdG91Y2hTdGFydENvb3Jkcy55KSA+IG1heERpc3RhbmNlKVxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHRjbGVhclRpbWVvdXQodGltZW91dElkKVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGVzIHRoZSBnaXZlbiBsaXN0IG9mIHNlbGVjdGVkIGl0ZW1zIHdpdGggYSBjbGljayBvbiB0aGUgZ2l2ZW4gY2xpY2tlZCBpdGVtLiBUYWtlcyBjdHJsIGFuZCBzaGlmdCBrZXkgZXZlbnRzIGludG8gY29uc2lkZXJhdGlvbiBmb3IgbXVsdGkgc2VsZWN0aW9uLlxuXHQgKiBJZiBjdHJsIGlzIHByZXNzZWQgdGhlIHNlbGVjdGlvbiBzdGF0dXMgb2YgdGhlIGNsaWNrZWRJdGVtIGlzIHRvZ2dsZWQuXG5cdCAqIElmIHNoaWZ0IGlzIHByZXNzZWQsIGFsbCBpdGVtcyBiZWdpbm5pbmcgZnJvbSB0aGUgbmVhcmVzdCBzZWxlY3RlZCBpdGVtIHRvIHRoZSBjbGlja2VkIGl0ZW0gYXJlIGFkZGl0aW9uYWxseSBzZWxlY3RlZC5cblx0ICogSWYgbmVpdGhlciBjdHJsIG5vciBzaGlmdCBhcmUgcHJlc3NlZCBvbmx5IHRoZSBjbGlja2VkIGl0ZW0gaXMgc2VsZWN0ZWQuXG5cdCAqL1xuXHRwcml2YXRlIGhhbmRsZUV2ZW50KGNsaWNrZWRFbnRpdHk6IFQsIGV2ZW50OiBUb3VjaEV2ZW50IHwgTW91c2VFdmVudCB8IEtleWJvYXJkRXZlbnQpIHtcblx0XHQvLyBub3JtYWwgY2xpY2sgY2hhbmdlcyB0aGUgc2VsZWN0aW9uIHRvIGEgc2luZ2xlXG5cdFx0Ly8gY3RybCBjbGljayB0b2dnbGVzIHRoZSBzZWxlY3Rpb24gZm9yIGFuIGl0ZW0gYW5kIGVuYWJsZXMgbXVsdGlzZWxlY3Rcblx0XHQvLyBzaGlmdCBjbGljayBzZWxlY3RzIGEgbG90IG9mIHRoaW5ncyBhbmQgZW5hYmxlZCBtdWx0aXNlbGVjdFxuXHRcdC8vICh0aGVyZSBhcmUgYWxzbyBrZXkgcHJlc3MgaGFuZGxlcnMgYnV0IHRoZXkgYXJlIGludm9rZWQgZnJvbSBhbm90aGVyIHBsYWNlKVxuXHRcdGxldCBjaGFuZ2VUeXBlOiBQYXJhbWV0ZXJzPHR5cGVvZiB0aGlzLmNoYW5nZVNlbGVjdGlvbj5bMV1cblx0XHRpZiAoKGNsaWVudC5pc01vYmlsZURldmljZSgpICYmIHRoaXMubGFzdEF0dHJzLnN0YXRlLmluTXVsdGlzZWxlY3QpIHx8IGV2ZW50LmN0cmxLZXkgfHwgKGNsaWVudC5pc01hY09TICYmIGV2ZW50Lm1ldGFLZXkpKSB7XG5cdFx0XHRjaGFuZ2VUeXBlID0gXCJ0b2dnbGluZ0luY2x1ZGluZ1NpbmdsZVwiXG5cdFx0fSBlbHNlIGlmIChldmVudC5zaGlmdEtleSkge1xuXHRcdFx0Y2hhbmdlVHlwZSA9IFwicmFuZ2VcIlxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjaGFuZ2VUeXBlID0gXCJzaW5nbGVcIlxuXHRcdH1cblx0XHR0aGlzLmNoYW5nZVNlbGVjdGlvbihjbGlja2VkRW50aXR5LCBjaGFuZ2VUeXBlKVxuXHR9XG5cblx0LyoqXG5cdCAqIGNoYW5nZVR5cGU6XG5cdCAqICAqIHNpbmdsZTogb25lIGl0ZW0gc2VsZWN0aW9uIChub3QgbXVsdGlzZWxlY3QpXG5cdCAqICAqIHRvZ2dsaW5nSW5jbHVkaW5nU2luZ2xlOiBpZiBub3QgaW4gbXVsdGlzZWxlY3QsIHN0YXJ0IG11bHRpc2VsZWN0LiBUdXJucyBtdWx0aXNlbGVjdCBvbiBvciBvZmYgZm9yIHRoZSBpdGVtLiBJbmNsdWRlcyB0aGUgaXRlbSBmcm9tIHNpbmdsZSBzZWxlY3Rpb25cblx0ICogICAgd2hlbiB0dXJuaW5nIG11bHRpc2VsZWN0IG9uLlxuXHQgKiAgKiB0b2dnbGluZ05ld011bHRpc2VsZWN0OiBpZiBub3QgaW4gbXVsdGlzZWxlY3QsIHN0YXJ0IG11bHRpc2VsZWN0LiBUdXJucyBtdWx0aXNlbGVjdCBvbiBvciBvZmYgZm9yIHRoZSBpdGVtLiBPbmx5IHNlbGVjdGVkIGl0ZW0gd2lsbCBiZSBpbiBtdWx0aXNlbGVjdFxuXHQgKiAgICB3aGVuIHR1cm5pbmcgbXVsdGlzZWxlY3Qgb24uXG5cdCAqICAqIHJhbmdlOiByYW5nZSBzZWxlY3Rpb24sIGV4dGVuZHMgdGhlIHJhbmdlIHVudGlsIHRoZSBzZWxlY3RlZCBpdGVtXG5cdCAqL1xuXHRwcml2YXRlIGNoYW5nZVNlbGVjdGlvbihjbGlja2VkRW50aXR5OiBULCBjaGFuZ2VUeXBlOiBcInNpbmdsZVwiIHwgXCJ0b2dnbGluZ0luY2x1ZGluZ1NpbmdsZVwiIHwgXCJyYW5nZVwiKSB7XG5cdFx0c3dpdGNoIChjaGFuZ2VUeXBlKSB7XG5cdFx0XHRjYXNlIFwic2luZ2xlXCI6XG5cdFx0XHRcdHRoaXMubGFzdEF0dHJzLm9uU2luZ2xlU2VsZWN0aW9uKGNsaWNrZWRFbnRpdHkpXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIFwidG9nZ2xpbmdJbmNsdWRpbmdTaW5nbGVcIjpcblx0XHRcdFx0aWYgKHRoaXMubGFzdEF0dHJzLnJlbmRlckNvbmZpZy5tdWx0aXNlbGVjdGlvbkFsbG93ZWQgPT09IE11bHRpc2VsZWN0TW9kZS5FbmFibGVkKSB7XG5cdFx0XHRcdFx0dGhpcy5sYXN0QXR0cnMub25TaW5nbGVUb2dnbGluZ011bHRpc2VsZWN0aW9uKGNsaWNrZWRFbnRpdHkpXG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgXCJyYW5nZVwiOlxuXHRcdFx0XHRpZiAodGhpcy5sYXN0QXR0cnMucmVuZGVyQ29uZmlnLm11bHRpc2VsZWN0aW9uQWxsb3dlZCA9PT0gTXVsdGlzZWxlY3RNb2RlLkVuYWJsZWQpIHtcblx0XHRcdFx0XHR0aGlzLmxhc3RBdHRycy5vblJhbmdlU2VsZWN0aW9uVG93YXJkcyhjbGlja2VkRW50aXR5KVxuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSB1cGRhdGVEb21FbGVtZW50cyhhdHRyczogTGlzdEF0dHJzPFQsIFZIPik6IG51bWJlciB7XG5cdFx0Ly8gaWYgcmVzaXplIGRpZG4ndCBraWNrIGluIHlldCwgbWVhc3VyZSBpdCByaWdodCBhd2F5IG9uY2Vcblx0XHRpZiAodGhpcy5oZWlnaHQgPT09IDApIHRoaXMuaGVpZ2h0ID0gdGhpcy5jb250YWluZXJEb20hLmNsaWVudEhlaWdodFxuXHRcdGNvbnN0IHJvd0hlaWdodCA9IGF0dHJzLnJlbmRlckNvbmZpZy5pdGVtSGVpZ2h0XG5cdFx0Ly8gcGx1cyBsb2FkaW5nIGluZGljYXRvclxuXHRcdC8vIHNob3VsZCBkZXBlbmQgb24gd2hldGhlciB3ZSBhcmUgY29tcGxldGVseSBsb2FkZWQgbWF5YmU/XG5cdFx0Y29uc3Qgc3RhdHVzSGVpZ2h0ID0gYXR0cnMuc3RhdGUubG9hZGluZ1N0YXR1cyA9PT0gTGlzdExvYWRpbmdTdGF0ZS5Eb25lID8gMCA6IHNpemUubGlzdF9yb3dfaGVpZ2h0XG5cdFx0dGhpcy5pbm5lckRvbSEuc3R5bGUuaGVpZ2h0ID0gcHgoYXR0cnMuc3RhdGUuaXRlbXMubGVuZ3RoICogcm93SGVpZ2h0ICsgc3RhdHVzSGVpZ2h0KVxuXHRcdGlmIChhdHRycy5zdGF0ZS5hY3RpdmVJbmRleCAhPSBudWxsICYmIGF0dHJzLnN0YXRlLmFjdGl2ZUluZGV4ICE9PSB0aGlzLmFjdGl2ZUluZGV4KSB7XG5cdFx0XHRjb25zdCBpbmRleCA9IGF0dHJzLnN0YXRlLmFjdGl2ZUluZGV4XG5cdFx0XHRjb25zdCBkZXNpcmVkUG9zaXRpb24gPSBhdHRycy5zdGF0ZS5hY3RpdmVJbmRleCAqIHJvd0hlaWdodFxuXHRcdFx0aWYgKGRlc2lyZWRQb3NpdGlvbiA+IHRoaXMuY29udGFpbmVyRG9tIS5zY3JvbGxUb3AgKyB0aGlzLmhlaWdodCB8fCBkZXNpcmVkUG9zaXRpb24gPCB0aGlzLmNvbnRhaW5lckRvbSEuc2Nyb2xsVG9wKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiYWN0aXZlIGl0ZW0gb3V0IG9mIHNjcmVlbiwgc2Nyb2xsaW5nIHRvXCIsIGluZGV4LCBkZXNpcmVkUG9zaXRpb24pXG5cdFx0XHRcdHRoaXMuY3VycmVudFBvc2l0aW9uID0gdGhpcy5jb250YWluZXJEb20hLnNjcm9sbFRvcCA9IGRlc2lyZWRQb3NpdGlvblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5jdXJyZW50UG9zaXRpb24gPSB0aGlzLmNvbnRhaW5lckRvbSEuc2Nyb2xsVG9wXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuY3VycmVudFBvc2l0aW9uID0gdGhpcy5jb250YWluZXJEb20hLnNjcm9sbFRvcFxuXHRcdH1cblx0XHR0aGlzLmFjdGl2ZUluZGV4ID0gYXR0cnMuc3RhdGUuYWN0aXZlSW5kZXhcblxuXHRcdGNvbnN0IHZpc2libGVFbGVtZW50cyA9IDIgKiBNYXRoLmNlaWwodGhpcy5oZWlnaHQgLyByb3dIZWlnaHQgLyAyKSAvLyBkaXZpZGUgYW5kIG11bHRpcGx5IGJ5IHR3byB0byBnZXQgYW4gZXZlbiBudW1iZXJcblx0XHRjb25zdCB2aXNpYmxlRWxlbWVudHNIZWlnaHQgPSB2aXNpYmxlRWxlbWVudHMgKiByb3dIZWlnaHRcblx0XHRjb25zdCBidWZmZXJIZWlnaHQgPSBTY3JvbGxCdWZmZXIgKiByb3dIZWlnaHRcblx0XHRjb25zdCBtYXhTdGFydFBvc2l0aW9uID0gcm93SGVpZ2h0ICogYXR0cnMuc3RhdGUuaXRlbXMubGVuZ3RoIC0gYnVmZmVySGVpZ2h0ICogMiAtIHZpc2libGVFbGVtZW50c0hlaWdodFxuXG5cdFx0bGV0IG5leHRQb3NpdGlvbiA9IHRoaXMuY3VycmVudFBvc2l0aW9uIC0gKHRoaXMuY3VycmVudFBvc2l0aW9uICUgcm93SGVpZ2h0KSAtIGJ1ZmZlckhlaWdodFxuXG5cdFx0aWYgKG5leHRQb3NpdGlvbiA8IDApIHtcblx0XHRcdG5leHRQb3NpdGlvbiA9IDBcblx0XHR9IGVsc2UgaWYgKG5leHRQb3NpdGlvbiA+IG1heFN0YXJ0UG9zaXRpb24pIHtcblx0XHRcdG5leHRQb3NpdGlvbiA9IG1heFN0YXJ0UG9zaXRpb25cblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLnJvd3MpIHtcblx0XHRcdHJvdy50b3AgPSBuZXh0UG9zaXRpb25cblx0XHRcdG5leHRQb3NpdGlvbiArPSByb3dIZWlnaHRcblx0XHRcdGNvbnN0IHBvcyA9IHJvdy50b3AgLyByb3dIZWlnaHRcblx0XHRcdGNvbnN0IGl0ZW0gPSBhdHRycy5zdGF0ZS5pdGVtc1twb3NdXG5cdFx0XHRyb3cuZW50aXR5ID0gaXRlbVxuXG5cdFx0XHRpZiAoIWl0ZW0pIHtcblx0XHRcdFx0cm93LmRvbUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyb3cuZG9tRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJcIlxuXHRcdFx0XHRyb3cuZG9tRWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlWSgke3Jvdy50b3B9cHgpYFxuXHRcdFx0XHRyb3cucm93LnVwZGF0ZShpdGVtLCBhdHRycy5zdGF0ZS5zZWxlY3RlZEl0ZW1zLmhhcyhpdGVtKSwgYXR0cnMuc3RhdGUuaW5NdWx0aXNlbGVjdClcblx0XHRcdH1cblx0XHRcdC8vIEZvY3VzIHRoZSBzZWxlY3RlZCByb3cgc28gaXQgY2FuIHJlY2VpdmUga2V5Ym9hcmQgZXZlbnRzIGlmIHRoZSB1c2VyIGhhcyBqdXN0IGNoYW5nZWQgaXRcblx0XHRcdGlmIChhdHRycy5zdGF0ZS5zZWxlY3RlZEl0ZW1zLmhhcyhpdGVtKSAmJiAoIXRoaXMuc3RhdGU/LnNlbGVjdGVkSXRlbXMuaGFzKGl0ZW0pIHx8IHRoaXMuc3RhdGUgPT0gbnVsbCkpIHtcblx0XHRcdFx0cm93LmRvbUVsZW1lbnQuZm9jdXMoKVxuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLnVwZGF0ZVN0YXR1cyhhdHRycy5zdGF0ZS5sb2FkaW5nU3RhdHVzKVxuXG5cdFx0dGhpcy5sb2FkTW9yZUlmTmVjZXNzYXJ5KGF0dHJzLCB2aXNpYmxlRWxlbWVudHNIZWlnaHQpXG5cblx0XHRyZXR1cm4gdmlzaWJsZUVsZW1lbnRzSGVpZ2h0XG5cdH1cblxuXHRwcml2YXRlIHJlYWRvbmx5IHVwZGF0ZVN0YXR1cyA9IG1lbW9pemVkKChzdGF0dXM6IExpc3RMb2FkaW5nU3RhdGUpID0+IHtcblx0XHRzd2l0Y2ggKHN0YXR1cykge1xuXHRcdFx0Y2FzZSBMaXN0TG9hZGluZ1N0YXRlLklkbGU6XG5cdFx0XHRjYXNlIExpc3RMb2FkaW5nU3RhdGUuRG9uZTpcblx0XHRcdFx0bS5yZW5kZXIodGhpcy5sb2FkaW5nSW5kaWNhdG9yQ2hpbGREb20sIG51bGwpXG5cdFx0XHRcdHRoaXMubG9hZGluZ0luZGljYXRvckNoaWxkRG9tLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIlxuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSBMaXN0TG9hZGluZ1N0YXRlLkxvYWRpbmc6XG5cdFx0XHRcdG0ucmVuZGVyKHRoaXMubG9hZGluZ0luZGljYXRvckNoaWxkRG9tLCB0aGlzLnJlbmRlckxvYWRpbmdJbmRpY2F0b3IoKSlcblx0XHRcdFx0dGhpcy5sb2FkaW5nSW5kaWNhdG9yQ2hpbGREb20uc3R5bGUuZGlzcGxheSA9IFwiXCJcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgTGlzdExvYWRpbmdTdGF0ZS5Db25uZWN0aW9uTG9zdDpcblx0XHRcdFx0bS5yZW5kZXIodGhpcy5sb2FkaW5nSW5kaWNhdG9yQ2hpbGREb20sIHRoaXMucmVuZGVyQ29ubmVjdGlvbkxvc3RJbmRpY2F0b3IoKSlcblx0XHRcdFx0dGhpcy5sb2FkaW5nSW5kaWNhdG9yQ2hpbGREb20uc3R5bGUuZGlzcGxheSA9IFwiXCJcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cdH0pXG5cblx0cHJpdmF0ZSByZW5kZXJMb2FkaW5nSW5kaWNhdG9yKCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmZsZXgtY2VudGVyLml0ZW1zLWNlbnRlclwiLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdGhlaWdodDogcHgoc2l6ZS5saXN0X3Jvd19oZWlnaHQpLFxuXHRcdFx0XHRcdHdpZHRoOiBcIjEwMCVcIixcblx0XHRcdFx0XHRwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuXHRcdFx0XHRcdGdhcDogcHgoc2l6ZS5ocGFkX3NtYWxsKSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRwcm9ncmVzc0ljb24oKSxcblx0XHRcdG0oQnV0dG9uLCB7XG5cdFx0XHRcdGxhYmVsOiBcImNhbmNlbF9hY3Rpb25cIixcblx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5QcmltYXJ5LFxuXHRcdFx0XHRjbGljazogKCkgPT4gdGhpcy5sYXN0QXR0cnMub25TdG9wTG9hZGluZygpLFxuXHRcdFx0fSksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJDb25uZWN0aW9uTG9zdEluZGljYXRvcigpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5wbHItbC5mbGV4LWNlbnRlci5pdGVtcy1jZW50ZXJcIixcblx0XHRcdHtcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRoZWlnaHQ6IHB4KHNpemUubGlzdF9yb3dfaGVpZ2h0KSxcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRtKEJ1dHRvbiwge1xuXHRcdFx0XHRsYWJlbDogXCJsb2FkTW9yZV9hY3Rpb25cIixcblx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5QcmltYXJ5LFxuXHRcdFx0XHRjbGljazogKCkgPT4gdGhpcy5yZXRyeUxvYWRpbmcoKSxcblx0XHRcdH0pLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmV0cnlMb2FkaW5nKCkge1xuXHRcdHRoaXMubGFzdEF0dHJzLm9uUmV0cnlMb2FkaW5nKClcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgbG9hZE1vcmVJZk5lY2Vzc2FyeShhdHRyczogTGlzdEF0dHJzPFQsIFZIPiwgdmlzaWJsZUVsZW1lbnRzSGVpZ2h0OiBudW1iZXIpIHtcblx0XHQvLyBXQVJOSU5HIHRoaXMgaXMgaGFja3k6XG5cdFx0Ly8gbGFzdEJ1bmNoVmlzaWJsZSBkZXBlbmRzIG9uIHZpc2libGVFbGVtZW50c0hlaWdodCB3aGljaCBpcyBzZXQgaW5zaWRlIF9jcmVhdGVWaXJ0dWFsUm93cyB3aGljaCBtaWdodCBub3QgaGF2ZSBjb21wbGV0ZWQgYnkgdGhlIHRpbWUgd2Vcblx0XHQvLyByZWFjaCBoZXJlLCBzbyB3YWl0aW5nIGZvciBkb21EZWZlcnJlZCBndWFyYW50ZWVzIHRoYXQgb25jcmVhdGUgaGFzIGZpbmlzaGVkIHJ1bm5pbmcsIGFuZCBpbiB0dXJuIHRoYXQgX2NyZWF0ZVZpcnR1YWxSb3dzIGhhcyBjb21wbGV0ZWRcblx0XHRjb25zdCBsYXN0QnVuY2hWaXNpYmxlID0gdGhpcy5jdXJyZW50UG9zaXRpb24gPiBhdHRycy5zdGF0ZS5pdGVtcy5sZW5ndGggKiBhdHRycy5yZW5kZXJDb25maWcuaXRlbUhlaWdodCAtIHZpc2libGVFbGVtZW50c0hlaWdodCAqIDJcblxuXHRcdGlmIChsYXN0QnVuY2hWaXNpYmxlICYmIGF0dHJzLnN0YXRlLmxvYWRpbmdTdGF0dXMgPT0gTGlzdExvYWRpbmdTdGF0ZS5JZGxlKSB7XG5cdFx0XHRhd2FpdCBhdHRycy5vbkxvYWRNb3JlKClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclN0YXR1c1JvdygpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXCJsaS5saXN0LXJvd1wiLCB7XG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRib3R0b206IDAsXG5cdFx0XHRcdGhlaWdodDogcHgoc2l6ZS5saXN0X3Jvd19oZWlnaHQpLFxuXHRcdFx0XHRkaXNwbGF5OiB0aGlzLnNob3VsZERpc3BsYXlTdGF0dXNSb3coKSA/IFwibm9uZVwiIDogbnVsbCxcblx0XHRcdH0sXG5cdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdHRoaXMubG9hZGluZ0luZGljYXRvckNoaWxkRG9tID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50XG5cdFx0XHR9LFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHNob3VsZERpc3BsYXlTdGF0dXNSb3coKSB7XG5cdFx0cmV0dXJuIHRoaXMuc3RhdGU/LmxvYWRpbmdTdGF0dXMgPT09IExpc3RMb2FkaW5nU3RhdGUuRG9uZSB8fCB0aGlzLnN0YXRlPy5sb2FkaW5nU3RhdHVzID09PSBMaXN0TG9hZGluZ1N0YXRlLklkbGVcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyU3dpcGVJdGVtcyhhdHRyczogTGlzdEF0dHJzPFQsIFZIPik6IENoaWxkcmVuIHtcblx0XHRpZiAoYXR0cnMucmVuZGVyQ29uZmlnLnN3aXBlID09IG51bGwpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHRcdHJldHVybiBbXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5zd2lwZS1zcGFjZXIuZmxleC5pdGVtcy1jZW50ZXIuanVzdGlmeS1lbmQucHItbC5ibHVlXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiAodGhpcy5kb21Td2lwZVNwYWNlckxlZnQgPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQpLFxuXHRcdFx0XHRcdHRhYmluZGV4OiBUYWJJbmRleC5Qcm9ncmFtbWF0aWMsXG5cdFx0XHRcdFx0XCJhcmlhLWhpZGRlblwiOiBcInRydWVcIixcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0aGVpZ2h0OiBweChhdHRycy5yZW5kZXJDb25maWcuaXRlbUhlaWdodCksXG5cdFx0XHRcdFx0XHR0cmFuc2Zvcm06IGB0cmFuc2xhdGVZKC0ke2F0dHJzLnJlbmRlckNvbmZpZy5pdGVtSGVpZ2h0fXB4KWAsXG5cdFx0XHRcdFx0XHRwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuXHRcdFx0XHRcdFx0XCJ6LWluZGV4XCI6IDEsXG5cdFx0XHRcdFx0XHQvLyB3aWR0aDogcHgodGhpcy53aWR0aCksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0YXR0cnMucmVuZGVyQ29uZmlnLnN3aXBlLnJlbmRlckxlZnRTcGFjZXIoKSxcblx0XHRcdCksXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5zd2lwZS1zcGFjZXIuZmxleC5pdGVtcy1jZW50ZXIucGwtbC5yZWRcIixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+ICh0aGlzLmRvbVN3aXBlU3BhY2VyUmlnaHQgPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQpLFxuXHRcdFx0XHRcdHRhYmluZGV4OiBUYWJJbmRleC5Qcm9ncmFtbWF0aWMsXG5cdFx0XHRcdFx0XCJhcmlhLWhpZGRlblwiOiBcInRydWVcIixcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0aGVpZ2h0OiBweChhdHRycy5yZW5kZXJDb25maWcuaXRlbUhlaWdodCksXG5cdFx0XHRcdFx0XHR0cmFuc2Zvcm06IGB0cmFuc2xhdGVZKC0ke2F0dHJzLnJlbmRlckNvbmZpZy5pdGVtSGVpZ2h0fXB4KWAsXG5cdFx0XHRcdFx0XHRwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuXHRcdFx0XHRcdFx0XCJ6LWluZGV4XCI6IDEsXG5cdFx0XHRcdFx0XHQvLyB3aWR0aDogcHgodGhpcy53aWR0aCksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0YXR0cnMucmVuZGVyQ29uZmlnLnN3aXBlLnJlbmRlclJpZ2h0U3BhY2VyKCksXG5cdFx0XHQpLFxuXHRcdF1cblx0fVxuXG5cdHByaXZhdGUgdXBkYXRlU2l6ZSgpIHtcblx0XHRjb25zdCBjb250YWluZXJEb20gPSB0aGlzLmNvbnRhaW5lckRvbVxuXHRcdGlmIChjb250YWluZXJEb20gJiYgdGhpcy5kb21Td2lwZVNwYWNlckxlZnQgJiYgdGhpcy5kb21Td2lwZVNwYWNlclJpZ2h0KSB7XG5cdFx0XHR0aGlzLmRvbVN3aXBlU3BhY2VyTGVmdC5zdHlsZS5vcGFjaXR5ID0gXCIwXCJcblx0XHRcdHRoaXMuZG9tU3dpcGVTcGFjZXJSaWdodC5zdHlsZS5vcGFjaXR5ID0gXCIwXCJcblx0XHRcdHRoaXMuZG9VcGRhdGVXaWR0aChjb250YWluZXJEb20pXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSByZWFkb25seSBkb1VwZGF0ZVdpZHRoID0gZGVib3VuY2UoNjAsIChjb250YWluZXJEb206IEhUTUxFbGVtZW50KSA9PiB7XG5cdFx0dGhpcy53aWR0aCA9IGNvbnRhaW5lckRvbS5jbGllbnRXaWR0aFxuXHRcdHRoaXMuaGVpZ2h0ID0gY29udGFpbmVyRG9tLmNsaWVudEhlaWdodFxuXG5cdFx0aWYgKHRoaXMuc3dpcGVIYW5kbGVyKSB7XG5cdFx0XHQvLyB3aXRoIGRpZmZlcmVudCB6b29tIGxldmVscyBCbGluayBkb2VzIHdlaXJkIHRoaW5ncyBhbmQgc2hvd3MgcGFydHMgb2YgZWxlbWVudHMgdGhhdCBpdCBzaG91bGRuJ3Qgc28gd2Ugc2hpZnQgdGhlbSBhcm91bmQgYnkgYSBwaXhlbFxuXHRcdFx0Y29uc3QgdHJhbnNsYXRlWCA9IHRoaXMud2lkdGggKyAxXG5cdFx0XHR0aGlzLmRvbVN3aXBlU3BhY2VyTGVmdC5zdHlsZS53aWR0aCA9IHB4KHRoaXMud2lkdGgpXG5cdFx0XHR0aGlzLmRvbVN3aXBlU3BhY2VyUmlnaHQuc3R5bGUud2lkdGggPSBweCh0aGlzLndpZHRoKVxuXHRcdFx0dGhpcy5kb21Td2lwZVNwYWNlckxlZnQuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVgoJHstdHJhbnNsYXRlWH1weCkgdHJhbnNsYXRlWSgwcHgpYFxuXHRcdFx0dGhpcy5kb21Td2lwZVNwYWNlclJpZ2h0LnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGVYKCR7dHJhbnNsYXRlWH1weCkgdHJhbnNsYXRlWSgwcHgpYFxuXG5cdFx0XHRmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLnJvd3MpIHtcblx0XHRcdFx0aWYgKHJvdy5kb21FbGVtZW50KSBhcHBseVNhZmVBcmVhSW5zZXRNYXJnaW5MUihyb3cuZG9tRWxlbWVudClcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5kb21Td2lwZVNwYWNlckxlZnQuc3R5bGUub3BhY2l0eSA9IFwiMVwiXG5cdFx0XHR0aGlzLmRvbVN3aXBlU3BhY2VyUmlnaHQuc3R5bGUub3BhY2l0eSA9IFwiMVwiXG5cdFx0fVxuXHR9KVxufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7SUFFa0IsMENBQVg7QUFDTjtBQUNBOztBQUNBO0lBUVksZUFBTixNQUFtQjs7Q0FFekI7Q0FDQTtDQUNBO0NBQ0EsY0FBdUI7Q0FDdkI7Q0FFQSxZQUFZQSxXQUF3QjtBQUNuQyxPQUFLLFdBQVc7R0FDZixHQUFHO0dBQ0gsR0FBRztFQUNIO0FBQ0QsT0FBSyxZQUFZO0FBQ2pCLE9BQUssWUFBWSxRQUFRLFNBQVM7QUFDbEMsT0FBSyxnQkFBZ0I7Q0FDckI7Q0FFRCxTQUFTO0FBQ1IsT0FBSyxVQUFVLGlCQUFpQixjQUFjLEtBQUssY0FBYyxFQUFFLFNBQVMsS0FBTSxFQUFDO0FBRW5GLE9BQUssVUFBVSxpQkFBaUIsYUFBYSxLQUFLLGFBQWEsRUFBRSxTQUFTLE1BQU8sRUFBQztBQUNsRixPQUFLLFVBQVUsaUJBQWlCLFlBQVksS0FBSyxZQUFZLEVBQUUsU0FBUyxLQUFNLEVBQUM7Q0FDL0U7Q0FFRCxTQUFTO0FBQ1IsT0FBSyxVQUFVLG9CQUFvQixjQUFjLEtBQUssYUFBYTtBQUNuRSxPQUFLLFVB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