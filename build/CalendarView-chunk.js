import { __toESM } from "./chunk-chunk.js";
import "./dist-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { assertMainOrNode, isAndroidApp, isApp, isBrowser, isDesktop, isElectronClient, isIOSApp, isTest } from "./Env-chunk.js";
import { AppType, client } from "./ClientDetector-chunk.js";
import { mithril_default, redraw } from "./mithril-chunk.js";
import { DAY_IN_MILLIS, LazyLoaded, assertNotNull, decodeBase64, deepEqual, defer, downcast, getEndOfDay, getStartOfDay, incrementDate, incrementMonth, isNotNull, isSameDay, isSameDayOfDate, isToday, last, lastThrow, lazyMemoized, mapNullable, memoized, neverNull, noOp, numberRange, ofClass, remove, stringToBase64 } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { DefaultAnimationTime, TransformEnum, animations, ease, opacity, styles, transform } from "./styles-chunk.js";
import { hexToRGBAString, stateBgFocus, stateBgHover, theme } from "./theme-chunk.js";
import { CLIENT_ONLY_CALENDARS, Const, DEFAULT_CLIENT_ONLY_CALENDAR_COLORS, DEFAULT_ERROR, EventTextTimeOption, FeatureType, GroupType, KdfType, Keys, NewPaidPlans, ShareCapability, TabIndex, TimeFormat, WeekStart, defaultCalendarColor, reverse } from "./TutanotaConstants-chunk.js";
import { isKeyPressed, keyManager } from "./KeyManager-chunk.js";
import { windowFacade } from "./WindowFacade-chunk.js";
import { modal } from "./RootView-chunk.js";
import { px, size } from "./size-chunk.js";
import { getSafeAreaInsetBottom } from "./HtmlUtils-chunk.js";
import { DateTime } from "./luxon-chunk.js";
import { elementIdPart, getElementId, getListId, listIdPart } from "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import { CalendarGroupRootTypeRef, ContactTypeRef, createDefaultAlarmInfo, createGroupSettings } from "./TypeRefs-chunk.js";
import { CalendarViewType, getAllDayDateUTC, getEventWithDefaultTimes, isAllDayEvent, isAllDayEventByTimes, serializeAlarmInterval, setNextHalfHour } from "./CommonCalendarUtils-chunk.js";
import "./TypeModels2-chunk.js";
import "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import { CalendarType, calculateContactsAge, combineDateWithTime, eventEndsAfterDay, eventStartsBefore, findFirstPrivateCalendar, getAllDayDateForTimezone, getCalendarType, getDiffIn24hIntervals, getEventEnd, getEventStart, getFirstDayOfMonth, getRangeOfDays, getStartOfNextDayWithZone, getStartOfTheWeekOffset, getStartOfTheWeekOffsetForUser, getStartOfWeek, getTimeTextFormatForLongEvent, getTimeZone, getWeekNumber, hasAlarmsForTheUser, hasSourceUrl, isBirthdayEvent, isClientOnlyCalendar, isExternalCalendarType, isNormalCalendarType, parseAlarmInterval } from "./CalendarUtils-chunk.js";
import { SyncStatus, checkURLString, getExternalCalendarName, isIcal, parseCalendarStringData } from "./ImportExportUtils-chunk.js";
import "./FormatValidator-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { deviceConfig } from "./DeviceConfig-chunk.js";
import "./Logger-chunk.js";
import "./ErrorHandler-chunk.js";
import "./EntityFunctions-chunk.js";
import "./TypeModels3-chunk.js";
import "./ModelInfo-chunk.js";
import "./ErrorUtils-chunk.js";
import { NotFoundError } from "./RestError-chunk.js";
import "./SetupMultipleError-chunk.js";
import "./OutOfSyncError-chunk.js";
import "./CancelledError-chunk.js";
import "./EventQueue-chunk.js";
import { bootstrapWorker } from "./EntityRestClient-chunk.js";
import "./SuspensionError-chunk.js";
import "./LoginIncompleteError-chunk.js";
import "./CryptoError-chunk.js";
import "./RecipientsNotFoundError-chunk.js";
import { DbError } from "./DbError-chunk.js";
import "./QuotaExceededError-chunk.js";
import "./DeviceStorageUnavailableError-chunk.js";
import "./MailBodyTooLargeError-chunk.js";
import "./ImportError-chunk.js";
import "./WebauthnError-chunk.js";
import "./PermissionError-chunk.js";
import "./MessageDispatcher-chunk.js";
import "./WorkerProxy-chunk.js";
import "./EntityUpdateUtils-chunk.js";
import "./SessionType-chunk.js";
import "./Services-chunk.js";
import { EntityClient } from "./EntityClient-chunk.js";
import "./dist3-chunk.js";
import { PageContextLoginListener } from "./PageContextLoginListener-chunk.js";
import "./RestClient-chunk.js";
import { isoDateToBirthday } from "./BirthdayUtils-chunk.js";
import "./Services2-chunk.js";
import { DomainConfigProvider, NoZoneDateProvider, SchedulerImpl } from "./FolderSystem-chunk.js";
import "./GroupUtils-chunk.js";
import "./MailChecks-chunk.js";
import { BaseButton, ButtonColor, getColors } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import "./DialogHeaderBar-chunk.js";
import "./CountryList-chunk.js";
import { DROPDOWN_MARGIN, Dialog, TextField, TextFieldType, attachDropdown, colorForBg, createDropdown, getContactTitle, getIfLargeScroll, getPosAndBoundsFromMouseEvent, pureComponent, showDropdown, showDropdownAtPosition } from "./Dialog-chunk.js";
import { BootIcons, Icon, IconSize } from "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import { ButtonSize, IconButton } from "./IconButton-chunk.js";
import { Time } from "./CalendarEventWhenModel-chunk.js";
import { formatDate, formatMonthWithFullYear, formatShortTime, formatTime } from "./Formatter-chunk.js";
import "./ProgressMonitor-chunk.js";
import { notifications } from "./Notifications-chunk.js";
import "./CalendarFacade-chunk.js";
import "./CalendarModel-chunk.js";
import { getSharedGroupName, hasCapabilityOnGroup, loadGroupMembers } from "./GroupUtils2-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { UserError } from "./UserError-chunk.js";
import "./MailAddressParser-chunk.js";
import "./BlobUtils-chunk.js";
import "./FileUtils-chunk.js";
import { showProgressDialog } from "./ProgressDialog-chunk.js";
import { CALENDAR_MIME_TYPE, getEnabledMailAddressesWithUser, guiDownload } from "./SharedMailUtils-chunk.js";
import "./PasswordUtils-chunk.js";
import "./Recipient-chunk.js";
import "./ContactUtils-chunk.js";
import "./RecipientsModel-chunk.js";
import { CALENDAR_EVENT_HEIGHT, CalendarOperation, EventLayoutMode, SELECTED_DATE_INDICATOR_THICKNESS, TEMPORARY_EVENT_OPACITY, calendarNavConfiguration, calendarWeek, changePeriodOnWheel, daysHaveEvents, expandEvent, formatEventDuration, formatEventTime, formatEventTimes, generateRandomColor, getCalendarMonth, getDateFromMousePos, getDisplayEventTitle, getEventColor, getIconForViewType, getTimeFromMousePos, layOutEvents, shouldDefaultToAmPmTimeFormat, shouldDisplayEvent, showDeletePopup } from "./CalendarGuiUtils-chunk.js";
import "./UpgradeRequiredError-chunk.js";
import "./ColorPickerModel-chunk.js";
import { BannerButton } from "./BannerButton-chunk.js";
import { showNotAvailableForFreeDialog, showPlanUpgradeRequiredDialog } from "./SubscriptionDialogs-chunk.js";
import "./ExternalLink-chunk.js";
import { getLocationUrl } from "./EventPreviewView-chunk.js";
import { CalendarEventPopup } from "./CalendarEventPopup-chunk.js";
import "./ToggleButton-chunk.js";
import { EventEditorDialog, RemindersEditor } from "./CalendarEventEditDialog-chunk.js";
import { renderSwitchMonthArrowIcon } from "./DatePicker-chunk.js";
import "./MailRecipientsTextField-chunk.js";
import { ColumnEmptyMessageBox } from "./ColumnEmptyMessageBox-chunk.js";
import "./DateParser-chunk.js";
import { NavButton } from "./NavButton-chunk.js";
import "./InfoBanner-chunk.js";
import { showSnackBar } from "./SnackBar-chunk.js";
import "./Credentials-chunk.js";
import "./NotificationOverlay-chunk.js";
import "./Checkbox-chunk.js";
import { ExpanderButton, ExpanderPanel } from "./Expander-chunk.js";
import "./ClipboardUtils-chunk.js";
import "./Services4-chunk.js";
import "./BubbleButton-chunk.js";
import "./ErrorReporter-chunk.js";
import "./PasswordField-chunk.js";
import "./PasswordRequestDialog-chunk.js";
import { showUserError } from "./ErrorHandlerImpl-chunk.js";
import "./InAppRatingDialog-chunk.js";
import { SwipeHandler } from "./List-chunk.js";
import "./SelectableRowContainer-chunk.js";
import "./CalendarRow-chunk.js";
import { CalendarSearchModel } from "./CalendarSearchModel-chunk.js";
import { CALENDAR_PREFIX } from "./RouteChange-chunk.js";
import "./ListModel-chunk.js";
import "./CalendarExporter-chunk.js";
import { exportCalendar, handleCalendarImport } from "./CalendarImporter-chunk.js";
import { isCustomizationEnabledForCustomer } from "./CustomerUtils-chunk.js";
import { BackgroundColumnLayout, BaseMobileHeader, ColumnType, FolderColumnView, Header, MainCreateButton, MobileHeaderBackButton, MobileHeaderMenuButton, MobileHeaderTitle, SidebarSection, ViewColumn, ViewSlider } from "./MobileHeader-chunk.js";
import { EntropyCollector, EventController, FileControllerBrowser, FileControllerNative, InfoMessageHandler, LoginController, MailboxModel, NativeThemeFacade, NewsModel, OfflineIndicator, OfflineIndicatorViewModel, OperationProgressTracker, ProgressBar, ProgressTracker, ScopedRouter, SecondFactorHandler, ThemeController, ThrottledRouter, WebThemeFacade, WebauthnClient, WebsocketConnectivityModel } from "./mailLocator-chunk.js";
import { BaseTopLevelView } from "./LoginScreenHeader-chunk.js";
import { EventDetailsView } from "./EventDetailsView-chunk.js";
import "./ContactGuiUtils-chunk.js";
import { ContactCardViewer, writeMail } from "./ContactView-chunk.js";
import "./SidebarSectionRow-chunk.js";
import { LoginButton } from "./LoginButton-chunk.js";
import { ColorPickerView } from "./ColorPickerView-chunk.js";
import "./CounterBadge-chunk.js";
import "./InfoIcon-chunk.js";
import "./Table-chunk.js";
import "./GroupGuiUtils-chunk.js";
import { showGroupSharingDialog } from "./GroupSharingDialog-chunk.js";
import { GroupInvitationFolderRow } from "./GroupInvitationFolderRow-chunk.js";
import { ContactEditor } from "./ContactEditor-chunk.js";
import "./ListColumnWrapper-chunk.js";
import "./ContactListView-chunk.js";
import "./HtmlEditor-chunk.js";
import "./HtmlSanitizer-chunk.js";
import "./Signature-chunk.js";
import "./LoginUtils-chunk.js";
import "./AttachmentBubble-chunk.js";
import "./MailEditor-chunk.js";
import "./MailGuiUtils-chunk.js";
import { EphemeralUsageTestStorage, StorageBehavior, UsageTestController, UsageTestModel } from "./UsageTestModel-chunk.js";
import "./MailUtils-chunk.js";
import { BrowserWebauthn } from "./BrowserWebauthn-chunk.js";
import "./PermissionType-chunk.js";
import "./CommonMailUtils-chunk.js";
import "./SearchUtils-chunk.js";
import "./FontIcons-chunk.js";
import "./TemplatePopupModel-chunk.js";
import "./MailViewerViewModel-chunk.js";
import "./LoadingState-chunk.js";
import "./inlineImagesUtils-chunk.js";
import "./SelectAllCheckbox-chunk.js";
import "./LazySearchBar-chunk.js";
import "./BottomNav-chunk.js";

//#region src/calendar-app/calendar/view/CalendarEventBubble.ts
const lineHeight = size.calendar_line_height;
const lineHeightPx = px(lineHeight);
var CalendarEventBubble = class CalendarEventBubble {
	hasFinishedInitialRender = false;
	oncreate(vnode) {
		this.hasFinishedInitialRender = true;
	}
	view({ attrs }) {
		const doFadeIn = !this.hasFinishedInitialRender && attrs.fadeIn;
		const enablePointerEvents = attrs.enablePointerEvents;
		return mithril_default(".calendar-event.small.overflow-hidden.flex.cursor-pointer" + (doFadeIn ? ".fade-in" : "") + (attrs.noBorderLeft ? ".event-continues-left" : "") + (attrs.noBorderRight ? ".event-continues-right" : ""), {
			style: {
				background: "#" + attrs.color,
				color: colorForBg("#" + attrs.color),
				minHeight: lineHeightPx,
				height: px(attrs.height ? Math.max(attrs.height, 0) : lineHeight),
				"padding-top": px(attrs.verticalPadding || 0),
				opacity: attrs.opacity,
				pointerEvents: enablePointerEvents ? "auto" : "none"
			},
			tabIndex: enablePointerEvents ? TabIndex.Default : TabIndex.Programmatic,
			onclick: (e) => {
				e.stopPropagation();
				attrs.click(e, e.target);
			},
			onkeydown: (e) => {
				attrs.keyDown(e, e.target);
			}
		}, [
			attrs.hasAlarm ? mithril_default(Icon, {
				icon: Icons.Notifications,
				style: {
					fill: colorForBg("#" + attrs.color),
					"padding-top": "2px",
					"padding-right": "2px"
				},
				class: "icon-small"
			}) : null,
			attrs.isAltered ? mithril_default(Icon, {
				icon: Icons.Edit,
				style: {
					fill: colorForBg("#" + attrs.color),
					"padding-top": "2px",
					"padding-right": "2px"
				},
				class: "icon-small"
			}) : null,
			attrs.isClientOnly ? mithril_default(Icon, {
				icon: Icons.Gift,
				style: {
					fill: colorForBg("#" + attrs.color),
					"padding-top": "2px",
					"padding-right": "2px"
				},
				class: "icon-small"
			}) : null,
			mithril_default(".flex.col", { style: { width: "95%" } }, CalendarEventBubble.renderContent(attrs))
		]);
	}
	static renderContent({ height: maybeHeight, text, secondLineText, color }) {
		const height = maybeHeight ?? lineHeight;
		const isMultiline = height >= lineHeight * 2;
		if (isMultiline) {
			const linesInBubble = Math.floor(height / lineHeight);
			const topSectionMaxLines = secondLineText != null ? linesInBubble - 1 : linesInBubble;
			const topSectionClass = topSectionMaxLines === 1 ? ".text-clip" : ".text-ellipsis-multi-line";
			return [CalendarEventBubble.renderTextSection("", mithril_default(topSectionClass, { style: { "-webkit-line-clamp": topSectionMaxLines } }, text), topSectionMaxLines * lineHeight), secondLineText ? CalendarEventBubble.renderTextSection(".text-ellipsis", secondLineText, lineHeight) : null];
		} else return CalendarEventBubble.renderTextSection(".text-clip", secondLineText ? [
			`${text} `,
			mithril_default(Icon, {
				icon: Icons.Time,
				style: {
					fill: colorForBg("#" + color),
					"padding-top": "2px",
					"padding-right": "2px",
					"vertical-align": "text-top"
				},
				class: "icon-small"
			}),
			`${secondLineText}`
		] : text, lineHeight);
	}
	static renderTextSection(classes, text, maxHeight) {
		return mithril_default(classes, { style: {
			lineHeight: lineHeightPx,
			maxHeight: px(maxHeight)
		} }, text);
	}
};

//#endregion
//#region src/calendar-app/calendar/view/ContinuingCalendarEventBubble.ts
var ContinuingCalendarEventBubble = class {
	view({ attrs }) {
		const eventTitle = getDisplayEventTitle(attrs.event.summary);
		return mithril_default(".flex.calendar-event-container.darker-hover", [
			attrs.startsBefore ? mithril_default(".event-continues-right-arrow", { style: {
				"border-left-color": "transparent",
				"border-top-color": "#" + attrs.color,
				"border-bottom-color": "#" + attrs.color,
				opacity: attrs.opacity
			} }) : null,
			mithril_default(".flex-grow.overflow-hidden", mithril_default(CalendarEventBubble, {
				text: (attrs.showTime != null ? formatEventTime(attrs.event, attrs.showTime) + " " : "") + eventTitle,
				color: attrs.color,
				click: (e) => attrs.onEventClicked(attrs.event, e),
				keyDown: (e) => attrs.onEventKeyDown(attrs.event, e),
				noBorderLeft: attrs.startsBefore,
				noBorderRight: attrs.endsAfter,
				hasAlarm: hasAlarmsForTheUser(attrs.user, attrs.event),
				isAltered: attrs.event.recurrenceId != null,
				fadeIn: attrs.fadeIn,
				opacity: attrs.opacity,
				enablePointerEvents: attrs.enablePointerEvents,
				isClientOnly: isClientOnlyCalendar(listIdPart(attrs.event._id))
			})),
			attrs.endsAfter ? mithril_default(".event-continues-right-arrow", { style: {
				"border-left-color": "#" + attrs.color,
				opacity: attrs.opacity
			} }) : null
		]);
	}
};

//#endregion
//#region src/calendar-app/calendar/view/EventDragHandler.ts
const DRAG_THRESHOLD = 10;
var EventDragHandler = class {
	data = null;
	dragging = false;
	lastDiffBetweenDates = null;
	hasChanged = false;
	constructor(draggingArea, eventDragCallbacks) {
		this.draggingArea = draggingArea;
		this.eventDragCallbacks = eventDragCallbacks;
	}
	get isDragging() {
		return this.dragging;
	}
	get originalEvent() {
		return this.data?.originalEvent ?? null;
	}
	/**
	* Check if the handler has changed since the last time you called this function
	*/
	queryHasChanged() {
		const isChanged = this.hasChanged;
		this.hasChanged = false;
		return isChanged;
	}
	/**
	* Call on mouse down, to initialize an upcoming drag event.
	* Doesn't start the drag yet, because we want to wait until the mouse has moved beyond some threshhold
	* @param calendarEvent The calendar event for which a drag operation is prepared.
	* @param dateUnderMouse The original date under mouse when preparing the drag.
	* @param mousePos The current position of the mouse.
	* @param keepTime Indicates whether the time on the original event should be kept or modified. In case this is set to true the drag
	* operation just shifts event start by whole days otherwise the time from dateUnderMouse should be used as new time for the event.
	*/
	prepareDrag(calendarEvent, dateUnderMouse, mousePos, keepTime) {
		this.draggingArea.classList.add("cursor-grabbing");
		this.data = {
			originalEvent: calendarEvent,
			originalDateUnderMouse: this.adjustDateUnderMouse(calendarEvent.startTime, dateUnderMouse, keepTime),
			originalMousePos: mousePos,
			keepTime
		};
		this.hasChanged = false;
		this.dragging = false;
	}
	/**
	* Call on mouse move.
	* Will be a no-op if the prepareDrag hasn't been called or if cancelDrag has been called since the last prepareDrag call
	* The dragging doesn't actually begin until the distance between the mouse and its original location is greater than some threshold
	* @param dateUnderMouse The current date under the mouse courser, may include a time.
	* @param mousePos the position of the mouse when the drag ended.
	*/
	handleDrag(dateUnderMouse, mousePos) {
		if (this.data) {
			const dragData = this.data;
			const adjustedDateUnderMouse = this.adjustDateUnderMouse(dragData.originalEvent.startTime, dateUnderMouse, dragData.keepTime);
			const distanceX = dragData.originalMousePos.x - mousePos.x;
			const distanceY = dragData.originalMousePos.y - mousePos.y;
			const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
			if (this.dragging) {
				const diffBetweenDates = this.getDayUnderMouseDiff(dragData, adjustedDateUnderMouse);
				if (diffBetweenDates !== this.lastDiffBetweenDates) {
					this.lastDiffBetweenDates = diffBetweenDates;
					this.eventDragCallbacks.onDragUpdate(diffBetweenDates);
					this.hasChanged = true;
					mithril_default.redraw();
				}
			} else if (distance > DRAG_THRESHOLD) {
				this.dragging = true;
				this.lastDiffBetweenDates = this.getDayUnderMouseDiff(dragData, adjustedDateUnderMouse);
				this.eventDragCallbacks.onDragStart(dragData.originalEvent, this.lastDiffBetweenDates);
				this.hasChanged = true;
				mithril_default.redraw();
			}
		}
	}
	/**
	* Call on mouseup or mouseleave. Ends a drag event if one has been started, and hasn't been cancelled.
	*
	* This function will only trigger when prepareDrag has been called
	*/
	async endDrag(dateUnderMouse, pos) {
		this.draggingArea.classList.remove("cursor-grabbing");
		if (this.dragging && this.data) {
			const dragData = this.data;
			const adjustedDateUnderMouse = this.adjustDateUnderMouse(dragData.originalEvent.startTime, dateUnderMouse, dragData.keepTime);
			this.dragging = false;
			this.data = null;
			const diffBetweenDates = this.getDayUnderMouseDiff(dragData, adjustedDateUnderMouse);
			const { repeatRule, recurrenceId } = dragData.originalEvent;
			const mode = repeatRule != null ? await showModeSelectionDropdown(pos) : recurrenceId != null ? CalendarOperation.EditThis : CalendarOperation.EditAll;
			try {
				await this.eventDragCallbacks.onDragEnd(diffBetweenDates, mode);
			} finally {
				this.hasChanged = true;
				mithril_default.redraw();
			}
		} else this.cancelDrag();
	}
	adjustDateUnderMouse(eventStart, dateUnderMouse, keepTime) {
		if (keepTime) return Time.fromDate(eventStart).toDate(dateUnderMouse);
else return dateUnderMouse;
	}
	getDayUnderMouseDiff(dragData, adjustedDateUnderMouse) {
		const { originalEvent, originalDateUnderMouse } = dragData;
		return isAllDayEvent(originalEvent) ? getAllDayDateUTC(adjustedDateUnderMouse).getTime() - getAllDayDateUTC(originalDateUnderMouse).getTime() : adjustedDateUnderMouse.getTime() - originalDateUnderMouse.getTime();
	}
	cancelDrag() {
		this.draggingArea.classList.remove("cursor-grabbing");
		this.eventDragCallbacks.onDragCancel();
		this.data = null;
		this.dragging = false;
		this.hasChanged = true;
		this.lastDiffBetweenDates = null;
		mithril_default.redraw();
	}
};
async function showModeSelectionDropdown(pos) {
	return new Promise((resolve) => {
		showDropdownAtPosition([{
			label: "updateOneCalendarEvent_action",
			click: () => resolve(CalendarOperation.EditThis)
		}, {
			label: "updateAllCalendarEvents_action",
			click: () => resolve(CalendarOperation.EditAll)
		}], pos.x, pos.y, () => resolve(null));
	});
}

//#endregion
//#region src/common/gui/base/PageView.ts
var PageView = class {
	viewDom = null;
	onChangePage;
	view({ attrs }) {
		this.onChangePage = (next) => attrs.onChangePage(next);
		return mithril_default(".rel.flex-grow.overflow-hidden", mithril_default(".fill-absolute", { oncreate: (vnode) => {
			this.viewDom = vnode.dom;
			const swipeHandler = new PageSwipeHandler(this.viewDom, (next) => this.onChangePage(next));
			swipeHandler.attach();
			mithril_default.redraw();
		} }, [
			mithril_default(".abs", {
				"aria-hidden": "true",
				key: attrs.previousPage.key,
				style: this.viewDom && this.viewDom.offsetWidth > 0 && {
					width: this.viewDom.offsetWidth + "px",
					height: this.viewDom.offsetHeight + "px",
					transform: `translateX(${-this.viewDom.offsetWidth}px)`
				}
			}, attrs.previousPage.nodes),
			mithril_default(".fill-absolute", { key: attrs.currentPage.key }, attrs.currentPage.nodes),
			mithril_default(".abs", {
				"aria-hidden": "true",
				key: attrs.nextPage.key,
				style: this.viewDom && this.viewDom.offsetWidth > 0 && {
					width: this.viewDom.offsetWidth + "px",
					height: this.viewDom.offsetHeight + "px",
					transform: `translateX(${this.viewDom.offsetWidth}px)`
				}
			}, attrs.nextPage.nodes)
		]));
	}
};
var PageSwipeHandler = class extends SwipeHandler {
	onGestureCompleted;
	xOffset = 0;
	constructor(touchArea, onGestureCompleted) {
		super(touchArea);
		touchArea.style.transformStyle = "preserve-3d";
		touchArea.style.backfaceVisibility = "hidden";
		this.onGestureCompleted = onGestureCompleted;
	}
	onHorizontalDrag(xDelta, yDelta) {
		this.xOffset = Math.abs(xDelta) > 40 ? xDelta : 0;
		this.touchArea.style.transform = `translateX(${this.xOffset}px)`;
	}
	onHorizontalGestureCompleted(delta) {
		if (Math.abs(delta.x) > 100) {
			this.xOffset = 0;
			return animations.add(this.touchArea, transform(TransformEnum.TranslateX, delta.x, this.touchArea.offsetWidth * (delta.x > 0 ? 1 : -1))).then(() => {
				this.onGestureCompleted(delta.x < 0);
				requestAnimationFrame(() => {
					this.touchArea.style.transform = "";
				});
			});
		} else return this.reset(delta);
	}
	reset(delta) {
		if (Math.abs(this.xOffset) > 40) animations.add(this.touchArea, transform(TransformEnum.TranslateX, delta.x, 0));
else this.touchArea.style.transform = "";
		this.xOffset = 0;
		return super.reset(delta);
	}
};

//#endregion
//#region src/calendar-app/calendar/view/CalendarMonthView.ts
/** height of the day number indicator at the top of the day square */
const dayHeight = () => styles.isDesktopLayout() ? 32 : 24;
const spaceBetweenEvents = () => styles.isDesktopLayout() ? 2 : 1;
const EVENT_BUBBLE_VERTICAL_OFFSET = 5;
var CalendarMonthView = class {
	monthDom = null;
	resizeListener;
	zone;
	lastWidth;
	lastHeight;
	eventDragHandler;
	dayUnderMouse = null;
	lastMousePos = null;
	constructor({ attrs }) {
		this.resizeListener = mithril_default.redraw;
		this.zone = getTimeZone();
		this.lastWidth = 0;
		this.lastHeight = 0;
		this.eventDragHandler = new EventDragHandler(neverNull(document.body), attrs.dragHandlerCallbacks);
	}
	oncreate() {
		windowFacade.addResizeListener(this.resizeListener);
	}
	onremove() {
		windowFacade.removeResizeListener(this.resizeListener);
	}
	view({ attrs }) {
		const startOfTheWeekOffset = getStartOfTheWeekOffset(attrs.startOfTheWeek);
		const thisMonth = getCalendarMonth(attrs.selectedDate, startOfTheWeekOffset, styles.isSingleColumnLayout());
		const lastMonthDate = incrementMonth(attrs.selectedDate, -1);
		const nextMonthDate = incrementMonth(attrs.selectedDate, 1);
		const previousMonth = getCalendarMonth(lastMonthDate, startOfTheWeekOffset, styles.isSingleColumnLayout());
		const nextMonth = getCalendarMonth(nextMonthDate, startOfTheWeekOffset, styles.isSingleColumnLayout());
		const isDesktopLayout = styles.isDesktopLayout();
		let containerStyle;
		let weekdayDaysClasses = "";
		if (isDesktopLayout) {
			containerStyle = {
				overflow: "hidden",
				marginBottom: px(size.hpad_large)
			};
			weekdayDaysClasses = "content-bg border-radius-top-left-big border-radius-top-right-big";
		} else {
			containerStyle = { paddingBottom: isIOSApp() && client.isCalendarApp() ? px(getSafeAreaInsetBottom()) : null };
			weekdayDaysClasses = "nav-bg";
		}
		return mithril_default(".fill-absolute.flex.col", {
			class: isDesktopLayout ? " mlr-l border-radius-big" : "mlr-safe-inset",
			style: isDesktopLayout ? { marginLeft: px(5) } : null,
			onwheel: changePeriodOnWheel(attrs.onChangeMonth)
		}, [mithril_default(".flex.pt-s.pb-m", { class: weekdayDaysClasses }, thisMonth.weekdays.map((wd) => mithril_default(".flex-grow", mithril_default(".calendar-day-indicator.b", wd)))), mithril_default(".flex.col.rel.flex-grow.overflow-hidden", {
			class: (!styles.isUsingBottomNavigation() || isIOSApp() && client.isCalendarApp() ? "content-bg" : "") + (!isDesktopLayout ? " border-radius-top-left-big border-radius-top-right-big" : ""),
			style: containerStyle
		}, mithril_default(PageView, {
			previousPage: {
				key: getFirstDayOfMonth(lastMonthDate).getTime(),
				nodes: this.monthDom ? this.renderCalendar(attrs, previousMonth, thisMonth, this.zone) : null
			},
			currentPage: {
				key: getFirstDayOfMonth(attrs.selectedDate).getTime(),
				nodes: this.renderCalendar(attrs, thisMonth, thisMonth, this.zone)
			},
			nextPage: {
				key: getFirstDayOfMonth(nextMonthDate).getTime(),
				nodes: this.monthDom ? this.renderCalendar(attrs, nextMonth, thisMonth, this.zone) : null
			},
			onChangePage: (next) => attrs.onChangeMonth(next)
		}))]);
	}
	onbeforeupdate(newVnode, oldVnode) {
		const dom = this.monthDom;
		const different = !dom || oldVnode.attrs.eventsForDays !== newVnode.attrs.eventsForDays || oldVnode.attrs.selectedDate !== newVnode.attrs.selectedDate || oldVnode.attrs.amPmFormat !== newVnode.attrs.amPmFormat || !deepEqual(oldVnode.attrs.groupColors, newVnode.attrs.groupColors) || oldVnode.attrs.hiddenCalendars !== newVnode.attrs.hiddenCalendars || dom.offsetWidth !== this.lastWidth || dom.offsetHeight !== this.lastHeight;
		if (dom) {
			this.lastWidth = dom.offsetWidth;
			this.lastHeight = dom.offsetHeight;
		}
		return different || this.eventDragHandler.queryHasChanged();
	}
	renderCalendar(attrs, month, currentlyVisibleMonth, zone) {
		const { weeks } = month;
		const isVisible = month === currentlyVisibleMonth;
		return mithril_default(".fill-absolute.flex.col.flex-grow", {
			oncreate: (vnode) => {
				if (isVisible) {
					this.monthDom = vnode.dom;
					mithril_default.redraw();
				}
			},
			onupdate: (vnode) => {
				if (isVisible) this.monthDom = vnode.dom;
			},
			onmousemove: (mouseEvent) => {
				mouseEvent.redraw = false;
				const posAndBoundsFromMouseEvent = getPosAndBoundsFromMouseEvent(mouseEvent);
				this.lastMousePos = posAndBoundsFromMouseEvent;
				this.dayUnderMouse = getDateFromMousePos(posAndBoundsFromMouseEvent, weeks.map((week) => week.map((day) => day.date)));
				this.eventDragHandler.handleDrag(this.dayUnderMouse, posAndBoundsFromMouseEvent);
			},
			onmouseup: (mouseEvent) => {
				mouseEvent.redraw = false;
				this.endDrag(mouseEvent);
			},
			onmouseleave: (mouseEvent) => {
				mouseEvent.redraw = false;
				if (this.eventDragHandler.isDragging) this.eventDragHandler.cancelDrag();
			}
		}, weeks.map((week, weekIndex) => {
			return mithril_default(".flex.flex-grow.rel", { key: week[0].date.getTime() }, [week.map((day, i) => this.renderDay(attrs, day, i, weekIndex === 0)), this.monthDom ? this.renderWeekEvents(attrs, week, zone, !isVisible) : null]);
		}));
	}
	endDrag(pos) {
		const dayUnderMouse = this.dayUnderMouse;
		const originalDate = this.eventDragHandler.originalEvent?.startTime;
		if (dayUnderMouse && originalDate) {
			const dateUnderMouse = Time.fromDate(originalDate).toDate(dayUnderMouse);
			this.eventDragHandler.endDrag(dateUnderMouse, pos).catch(ofClass(UserError, showUserError));
		}
	}
	/** render the grid of days */
	renderDay(attrs, day, weekDayNumber, firstWeek) {
		return mithril_default(".calendar-day.calendar-column-border.flex-grow.rel.overflow-hidden.fill-absolute.cursor-pointer", {
			style: { ...firstWeek && !styles.isDesktopLayout() ? { borderTop: "none" } : {} },
			key: day.date.getTime(),
			onclick: (e) => {
				if (client.isDesktopDevice()) {
					const newDate = setNextHalfHour(new Date(day.date));
					attrs.onDateSelected(new Date(day.date), CalendarViewType.MONTH);
					attrs.onNewEvent(newDate);
				} else attrs.onDateSelected(new Date(day.date), styles.isDesktopLayout() ? CalendarViewType.DAY : CalendarViewType.AGENDA);
				e.preventDefault();
			}
		}, [
			mithril_default(".mb-xs", { style: { height: px(SELECTED_DATE_INDICATOR_THICKNESS) } }),
			this.renderDayHeader(day, attrs.onDateSelected),
			weekDayNumber === 0 && attrs.startOfTheWeek === WeekStart.MONDAY ? mithril_default(".calendar-month-week-number.abs.z3", { onclick: (e) => {
				e.stopPropagation();
				attrs.onDateSelected(new Date(day.date), CalendarViewType.WEEK);
			} }, getWeekNumber(day.date)) : null
		]);
	}
	renderDayHeader({ date, day, isPaddingDay }, onDateSelected) {
		const size$1 = styles.isDesktopLayout() ? px(22) : px(20);
		return mithril_default(".rel.click.flex.items-center.justify-center.rel.ml-hpad_small", {
			"aria-label": date.toLocaleDateString(),
			onclick: (e) => {
				onDateSelected(new Date(date), client.isDesktopDevice() || styles.isDesktopLayout() ? CalendarViewType.DAY : CalendarViewType.AGENDA);
				e.stopPropagation();
			}
		}, [mithril_default(".abs.z1.circle", {
			class: isToday(date) ? "calendar-current-day-circle" : "",
			style: {
				width: size$1,
				height: size$1
			}
		}), mithril_default(".full-width.height-100p.center.z2", {
			class: isToday(date) ? "calendar-current-day-text" : "",
			style: {
				opacity: isPaddingDay ? .4 : 1,
				fontWeight: isPaddingDay ? "500" : null,
				fontSize: styles.isDesktopLayout() ? "14px" : "12px",
				lineHeight: size$1
			}
		}, String(day))]);
	}
	/** render the events for the given week */
	renderWeekEvents(attrs, week, zone, isDisabled) {
		const eventsOnDays = attrs.getEventsOnDaysToRender(week.map((day) => day.date));
		const events = new Set(eventsOnDays.longEvents.concat(eventsOnDays.shortEventsPerDay.flat()));
		const firstDayOfWeek = week[0].date;
		const lastDayOfWeek = lastThrow(week);
		const dayWidth = this.getWidthForDay();
		const weekHeight = this.getHeightForWeek();
		const eventHeight = size.calendar_line_height + spaceBetweenEvents();
		const maxEventsPerDay = (weekHeight - dayHeight()) / eventHeight;
		const numberOfEventsPerDayToRender = Math.floor(maxEventsPerDay) - 1;
		/** initially, we have 0 extra, non-rendered events on each day of the week */
		const moreEventsForDay = [
			0,
			0,
			0,
			0,
			0,
			0,
			0
		];
		const eventMargin = styles.isDesktopLayout() ? size.calendar_event_margin : size.calendar_event_margin_mobile;
		const firstDayOfNextWeek = getStartOfNextDayWithZone(lastDayOfWeek.date, zone);
		return layOutEvents(Array.from(events), zone, (columns) => {
			return columns.map((eventsInColumn, columnIndex) => {
				return eventsInColumn.map((event) => {
					if (columnIndex < numberOfEventsPerDayToRender) {
						const eventIsAllDay = isAllDayEventByTimes(event.startTime, event.endTime);
						const eventStart = eventIsAllDay ? getAllDayDateForTimezone(event.startTime, zone) : event.startTime;
						const eventEnd = eventIsAllDay ? incrementDate(getEventEnd(event, zone), -1) : event.endTime;
						const position = this.getEventPosition(eventStart, eventEnd, firstDayOfWeek, firstDayOfNextWeek, dayWidth, dayHeight(), columnIndex);
						return this.renderEvent(event, position, eventStart, firstDayOfWeek, firstDayOfNextWeek, eventEnd, attrs, isDisabled);
					} else {
						for (const [dayIndex, dayInWeek] of week.entries()) {
							const eventsForDay = attrs.eventsForDays.get(dayInWeek.date.getTime());
							if (eventsForDay && eventsForDay.indexOf(event) !== -1) moreEventsForDay[dayIndex]++;
						}
						return null;
					}
				});
			}).concat(moreEventsForDay.map((moreEventsCount, weekday) => {
				const day = week[weekday];
				const isPadding = day.isPaddingDay;
				if (moreEventsCount > 0) return mithril_default(".abs.small" + (isPadding ? ".calendar-bubble-more-padding-day" : ""), { style: {
					bottom: 0,
					height: px(CALENDAR_EVENT_HEIGHT),
					left: px(weekday * dayWidth + eventMargin),
					width: px(dayWidth - 2 - eventMargin * 2),
					pointerEvents: "none"
				} }, mithril_default("", { style: { "font-weight": "600" } }, "+" + moreEventsCount));
else return null;
			}));
		}, EventLayoutMode.DayBasedColumn);
	}
	renderEvent(event, position, eventStart, firstDayOfWeek, firstDayOfNextWeek, eventEnd, attrs, isDisabled) {
		const isTemporary = attrs.temporaryEvents.includes(event);
		return mithril_default(".abs.overflow-hidden", {
			key: event._id[0] + event._id[1] + event.startTime.getTime(),
			style: {
				top: px(position.top),
				height: px(CALENDAR_EVENT_HEIGHT),
				left: px(position.left),
				right: px(position.right),
				pointerEvents: !styles.isUsingBottomNavigation() ? "auto" : "none"
			},
			onmousedown: () => {
				let dayUnderMouse = this.dayUnderMouse;
				let lastMousePos = this.lastMousePos;
				if (dayUnderMouse && lastMousePos && !isTemporary) this.eventDragHandler.prepareDrag(event, dayUnderMouse, lastMousePos, true);
			}
		}, mithril_default(ContinuingCalendarEventBubble, {
			event,
			startsBefore: eventStart < firstDayOfWeek,
			endsAfter: firstDayOfNextWeek < eventEnd,
			color: getEventColor(event, attrs.groupColors),
			showTime: styles.isDesktopLayout() && !isAllDayEvent(event) ? EventTextTimeOption.START_TIME : null,
			user: locator.logins.getUserController().user,
			onEventClicked: (e, domEvent) => {
				attrs.onEventClicked(event, domEvent);
			},
			onEventKeyDown: (e, domEvent) => {
				attrs.onEventKeyDown(event, domEvent);
			},
			fadeIn: !this.eventDragHandler.isDragging,
			opacity: isTemporary ? TEMPORARY_EVENT_OPACITY : 1,
			enablePointerEvents: !this.eventDragHandler.isDragging && !isTemporary && client.isDesktopDevice() && !isDisabled
		}));
	}
	getEventPosition(eventStart, eventEnd, firstDayOfWeek, firstDayOfNextWeek, calendarDayWidth, calendarDayHeight, columnIndex) {
		const top = (size.calendar_line_height + spaceBetweenEvents()) * columnIndex + calendarDayHeight + EVENT_BUBBLE_VERTICAL_OFFSET;
		const dayOfStartDateInWeek = getDiffIn24IntervalsFast(eventStart, firstDayOfWeek);
		const dayOfEndDateInWeek = getDiffIn24IntervalsFast(eventEnd, firstDayOfWeek);
		const calendarEventMargin = styles.isDesktopLayout() ? size.calendar_event_margin : size.calendar_event_margin_mobile;
		const left = (eventStart < firstDayOfWeek ? 0 : dayOfStartDateInWeek * calendarDayWidth) + calendarEventMargin;
		const right = (eventEnd > firstDayOfNextWeek ? 0 : (6 - dayOfEndDateInWeek) * calendarDayWidth) + calendarEventMargin;
		return {
			top,
			left,
			right
		};
	}
	getHeightForWeek() {
		if (!this.monthDom) return 1;
		const monthDomHeight = this.monthDom.offsetHeight;
		return monthDomHeight / 6;
	}
	getWidthForDay() {
		if (!this.monthDom) return 1;
		const monthDomWidth = this.monthDom.offsetWidth;
		return monthDomWidth / 7;
	}
};
/**
* Optimization to not create luxon's DateTime in simple case.
* May not work if we allow override time zones.
*/
function getDiffIn24IntervalsFast(left, right) {
	if (left.getMonth() === right.getMonth()) return left.getDate() - right.getDate();
else return getDiffIn24hIntervals(right, left);
}

//#endregion
//#region src/calendar-app/calendar/view/CalendarAgendaItemView.ts
var CalendarAgendaItemView = class CalendarAgendaItemView {
	isFocused = false;
	view({ attrs }) {
		const eventTitle = getDisplayEventTitle(attrs.event.summary);
		return mithril_default(".flex.items-center.click.plr.border-radius.pt-s.pb-s.rel.limit-width.full-width", {
			class: styles.isDesktopLayout() ? "hide-outline" : "state-bg",
			tabIndex: TabIndex.Default,
			onclick: attrs.click,
			onkeydown: (event) => attrs.keyDown(event),
			onfocus: () => this.isFocused = true,
			onblur: () => this.isFocused = false,
			style: {
				transition: `background ${DefaultAnimationTime}ms`,
				background: CalendarAgendaItemView.getBackground(attrs.selected ?? false, this.isFocused),
				height: attrs.height ? px(attrs.height) : undefined
			}
		}, [mithril_default(".icon.circle.abs", { style: { backgroundColor: `#${attrs.color}` } }), mithril_default(".flex.col.min-width-0.pl-vpad-l", [mithril_default("p.b.m-0.text-ellipsis", eventTitle), mithril_default("", attrs.timeText)])]);
	}
	static getBackground(isSelected, isFocused) {
		if (styles.isDesktopLayout()) if (isSelected) return stateBgHover;
else if (isFocused) return stateBgFocus;
else return theme.list_bg;
else return undefined;
	}
};

//#endregion
//#region src/common/gui/base/CalendarSwipeHandler.ts
var CalendarSwipeHandler = class extends SwipeHandler {
	_onGestureCompleted;
	_xoffset = 0;
	constructor(touchArea, onGestureCompleted) {
		super(touchArea);
		touchArea.style.transformStyle = "preserve-3d";
		touchArea.style.backfaceVisibility = "hidden";
		this._onGestureCompleted = onGestureCompleted;
	}
	onHorizontalDrag(xDelta, yDelta) {
		this._xoffset = Math.abs(xDelta) > 20 ? xDelta : 0;
		this.touchArea.style.transform = `translateX(${this._xoffset}px)`;
	}
	onHorizontalGestureCompleted(delta) {
		if (Math.abs(delta.x) > 100) {
			this._xoffset = 0;
			return animations.add(this.touchArea, transform(TransformEnum.TranslateX, delta.x, this.touchArea.offsetWidth * (delta.x > 0 ? 1 : -1))).then(() => {
				this._onGestureCompleted(delta.x < 0);
				requestAnimationFrame(() => {
					this.touchArea.style.transform = "";
				});
			});
		} else return this.reset(delta);
	}
	reset(delta) {
		if (Math.abs(this._xoffset) > 20) animations.add(this.touchArea, transform(TransformEnum.TranslateX, delta.x, 0));
else this.touchArea.style.transform = "";
		this._xoffset = 0;
		return super.reset(delta);
	}
};

//#endregion
//#region src/common/gui/base/Carousel.ts
var Carousel = class {
	containerDom = null;
	swipeHandler = null;
	view(vnode) {
		const attrs = vnode.attrs;
		return mithril_default("section.flex-space-around.column-gap-s", {
			role: "group",
			"aria-roledescription": "carousel",
			"aria-label": lang.get(attrs.label),
			class: attrs.class,
			style: attrs.style,
			oncreate: (swiperNode) => {
				this.containerDom = swiperNode.dom;
				this.swipeHandler = new CalendarSwipeHandler(this.containerDom, (isNext) => attrs.onSwipe(isNext));
				this.swipeHandler.attach();
			}
		}, attrs.slides.map((slide) => renderSlide(slide)));
	}
};
function renderSlide(slide) {
	return mithril_default(".full-width.min-width-full", {
		role: "group",
		"aria-role": "slide",
		"aria-label": lang.get(slide.label)
	}, slide.element);
}

//#endregion
//#region src/calendar-app/calendar/gui/day-selector/DaySelector.ts
var DaySelector = class {
	displayingDate;
	lastSelectedDate = null;
	handleDayPickerSwipe;
	constructor(vnode) {
		this.handleDayPickerSwipe = vnode.attrs.handleDayPickerSwipe;
		this.displayingDate = vnode.attrs.selectedDate || getStartOfDay(new Date());
	}
	view(vnode) {
		this.handleDayPickerSwipe = vnode.attrs.handleDayPickerSwipe;
		const selectedDate = vnode.attrs.selectedDate;
		if (selectedDate && !isSameDayOfDate(this.lastSelectedDate, selectedDate)) {
			this.lastSelectedDate = selectedDate;
			this.displayingDate = new Date(selectedDate);
			this.displayingDate.setDate(1);
		}
		let { weeks, weekdays } = getCalendarMonth(this.displayingDate, vnode.attrs.startOfTheWeekOffset, vnode.attrs.useNarrowWeekName);
		return mithril_default(".flex.flex-column", { onwheel: changePeriodOnWheel(this.handleDayPickerSwipe) }, [mithril_default(".flex-space-around", this.renderWeekDays(vnode.attrs.wide, weekdays)), this.renderDayPickerCarousel(vnode)]);
	}
	renderDayPickerCarousel(vnode) {
		const isExpanded = vnode.attrs.isDaySelectorExpanded ?? true;
		const date = vnode.attrs.selectedDate ?? new Date();
		const currentMonth = getCalendarMonth(date, vnode.attrs.startOfTheWeekOffset, true);
		const lastMonth = getCalendarMonthShiftedBy(currentMonth, vnode.attrs.startOfTheWeekOffset, -1);
		const nextMonth = getCalendarMonthShiftedBy(currentMonth, vnode.attrs.startOfTheWeekOffset, 1);
		const currentWeek = assertNotNull(findWeek(currentMonth, date));
		const beginningOfLastWeek = incrementDate(new Date(date), -7);
		const lastWeek = beginningOfLastWeek < currentMonth.beginningOfMonth ? findWeek(lastMonth, beginningOfLastWeek) : findWeek(currentMonth, beginningOfLastWeek);
		const beginningOfNextWeek = incrementDate(new Date(date), 7);
		const nextWeek = beginningOfNextWeek < nextMonth.beginningOfMonth ? findWeek(currentMonth, beginningOfNextWeek) : findWeek(nextMonth, beginningOfNextWeek);
		return mithril_default(Carousel, {
			label: "date_label",
			class: "center-horizontally",
			style: {
				fontSize: px(14),
				lineHeight: px(this.getElementSize(vnode.attrs))
			},
			slides: [
				{
					label: isExpanded ? "prevMonth_label" : "prevWeek_label",
					element: this.renderCarouselPage(isExpanded, vnode.attrs, lastWeek, lastMonth, true)
				},
				{
					label: isExpanded ? "month_label" : "week_label",
					element: this.renderCarouselPage(isExpanded, vnode.attrs, currentWeek, currentMonth, false)
				},
				{
					label: isExpanded ? "nextMonth_label" : "nextWeek_label",
					element: this.renderCarouselPage(isExpanded, vnode.attrs, nextWeek, nextMonth, true)
				}
			],
			onSwipe: (isNext) => this.handleDayPickerSwipe?.(isNext)
		});
	}
	renderCarouselPage(isExpanded, attrs, week, month, hidden) {
		return [mithril_default("", {
			"aria-hidden": `${isExpanded}`,
			style: {
				display: isExpanded ? "none" : "block",
				height: isExpanded ? 0 : undefined,
				opacity: isExpanded ? 0 : 1,
				overflow: "clip",
				transition: `opacity ${1.5 * DefaultAnimationTime}ms ease-in-out`
			}
		}, this.renderExpandableWeek(week, attrs, false, attrs.isDaySelectorExpanded || hidden)), mithril_default(ExpanderPanel, { expanded: isExpanded }, this.renderExpandedMonth(month, attrs, hidden))];
	}
	renderExpandedMonth(calendarMonth, attrs, hidden) {
		const { weeks } = calendarMonth;
		let weekToHighlight = -1;
		if (attrs.highlightSelectedWeek) weekToHighlight = weeks.findIndex((week) => week.find((day) => day.date.getTime() === attrs.selectedDate?.getTime()));
		return weeks.map((w, index) => this.renderExpandableWeek(w, attrs, weekToHighlight === index, attrs.isDaySelectorExpanded && hidden));
	}
	renderDay({ date, day, isPaddingDay }, attrs, hidden) {
		const isSelectedDay = isSameDayOfDate(date, attrs.selectedDate);
		let circleClass = "";
		let textClass = "";
		if (isSelectedDay && attrs.showDaySelection) {
			circleClass = "calendar-selected-day-circle";
			textClass = "calendar-selected-day-text";
		} else if (isToday(date) && attrs.highlightToday) {
			circleClass = "calendar-current-day-circle";
			textClass = "calendar-current-day-text";
		}
		const size$1 = this.getElementSize(attrs);
		return mithril_default("button.rel.click.flex.items-center.justify-center.rel" + (isPaddingDay && attrs.isDaySelectorExpanded ? ".faded-day" : ""), {
			class: "flex-grow-shrink-0",
			"aria-hidden": `${isPaddingDay && attrs.isDaySelectorExpanded}`,
			"aria-label": date.toLocaleDateString(),
			"aria-selected": `${isSelectedDay}`,
			role: "option",
			tabIndex: hidden ? -1 : 0,
			onclick: () => attrs.onDateSelected?.(date, true)
		}, [
			mithril_default(".abs.z1.circle", {
				class: circleClass,
				style: {
					width: px(size$1 * .625),
					height: px(size$1 * .625)
				}
			}),
			mithril_default(".full-width.height-100p.center.z2", {
				class: textClass,
				style: { fontSize: px(attrs.wide ? 14 : 12) }
			}, day),
			attrs.hasEventOn(date) ? mithril_default(".day-events-indicator", { style: styles.isDesktopLayout() ? {
				width: "3px",
				height: "3px"
			} : {} }) : null
		]);
	}
	getElementSize(attrs) {
		return attrs.wide ? 40 : 30;
	}
	renderExpandableWeek(week, attrs, highlight, hidden) {
		let style;
		if (highlight) style = {
			backgroundColor: hexToRGBAString(theme.content_accent, .2),
			height: px(styles.isDesktopLayout() ? 19 : 25),
			borderRadius: px(styles.isDesktopLayout() ? 6 : 25),
			width: `calc(100% - ${px(size.hpad_small)})`
		};
else style = {};
		return mithril_default(".flex-space-around.rel.items-center", [mithril_default(".abs", { style }), ...week.map((d) => this.renderDay(d, attrs, hidden))]);
	}
	renderWeekDays(wide, weekdays) {
		const size$1 = px(wide ? 40 : 24);
		const fontSize = px(14);
		return weekdays.map((wd) => mithril_default(".center", {
			"aria-hidden": "true",
			style: {
				fontSize,
				fontWeight: "bold",
				height: "20px",
				width: size$1,
				lineHeight: "20px"
			}
		}, wd));
	}
};
function findWeek(currentMonth, date) {
	return assertNotNull(currentMonth.weeks.find((w) => w.some((calendarDay) => date.getTime() === calendarDay.date.getTime())));
}
function getCalendarMonthShiftedBy(currentMonth, firstDayOfWeekFromOffset, plusMonths) {
	const date = DateTime.fromJSDate(currentMonth.beginningOfMonth).plus({ month: plusMonths }).toJSDate();
	return getCalendarMonth(date, firstDayOfWeekFromOffset, true);
}

//#endregion
//#region src/calendar-app/calendar/view/CalendarTimeIndicator.ts
var CalendarTimeIndicator = class {
	view({ attrs }) {
		const iconRadius = size.icon_size_small / 2;
		const leftOffset = attrs.circleLeftTangent ? 0 : -iconRadius;
		return mithril_default(".accent-bg", {
			"aria-hidden": "true",
			style: { height: px(size.calendar_day_event_padding) }
		}, mithril_default(`.circle.icon-small.accent-bg`, {
			"aria-hidden": "true",
			style: { translate: `${px(leftOffset)} ${px(-5)}` }
		}));
	}
};

//#endregion
//#region src/calendar-app/calendar/view/CalendarAgendaView.ts
var CalendarAgendaView = class {
	lastScrollPosition = null;
	lastScrolledDate = null;
	listDom = null;
	view({ attrs }) {
		const isDesktopLayout = styles.isDesktopLayout();
		const selectedDate = attrs.selectedDate;
		let containerStyle;
		if (isDesktopLayout) containerStyle = {
			marginLeft: "5px",
			marginBottom: px(size.hpad_large)
		};
else containerStyle = {};
		const agendaChildren = this.renderAgenda(attrs, isDesktopLayout);
		if (attrs.selectedTime && attrs.eventsForDays.size > 0 && this.lastScrolledDate != attrs.selectedDate) {
			this.lastScrolledDate = attrs.selectedDate;
			requestAnimationFrame(() => {
				if (this.listDom) this.listDom.scrollTop = attrs.scrollPosition;
			});
		}
		return mithril_default(".fill-absolute.flex.col", {
			class: isDesktopLayout ? "mlr-l height-100p" : "mlr-safe-inset",
			style: containerStyle
		}, [this.renderDateSelector(attrs, isDesktopLayout, selectedDate), mithril_default(".rel.flex-grow.flex.col", {
			class: isDesktopLayout ? "overflow-hidden" : "content-bg scroll border-radius-top-left-big border-radius-top-right-big",
			oncreate: (vnode) => {
				if (!isDesktopLayout) this.listDom = vnode.dom;
			},
			onupdate: (vnode) => {
				if (!isDesktopLayout) this.handleScrollOnUpdate(attrs, vnode);
			}
		}, agendaChildren)]);
	}
	renderDateSelector(attrs, isDesktopLayout, selectedDate) {
		const timeWidth = !isDesktopLayout ? size.calendar_hour_width_mobile : size.calendar_hour_width;
		return isDesktopLayout ? null : mithril_default("", mithril_default(".header-bg.pb-s.overflow-hidden", { style: { "margin-left": px(size.calendar_hour_width_mobile) } }, mithril_default(DaySelector, {
			selectedDate,
			onDateSelected: (selectedDate$1) => attrs.onDateSelected(selectedDate$1),
			wide: true,
			startOfTheWeekOffset: attrs.startOfTheWeekOffset,
			isDaySelectorExpanded: attrs.isDaySelectorExpanded,
			handleDayPickerSwipe: (isNext) => {
				const sign = isNext ? 1 : -1;
				const duration = {
					month: sign * (attrs.isDaySelectorExpanded ? 1 : 0),
					week: sign * (attrs.isDaySelectorExpanded ? 0 : 1)
				};
				attrs.onDateSelected(DateTime.fromJSDate(attrs.selectedDate).plus(duration).toJSDate());
			},
			showDaySelection: true,
			highlightToday: true,
			highlightSelectedWeek: false,
			useNarrowWeekName: styles.isSingleColumnLayout(),
			hasEventOn: (date) => attrs.eventsForDays.get(date.getTime())?.some((event) => shouldDisplayEvent(event, attrs.hiddenCalendars)) ?? false
		})));
	}
	renderDesktopEventList(attrs) {
		const events = this.getEventsToRender(attrs.selectedDate, attrs);
		if (events.length === 0) return mithril_default(ColumnEmptyMessageBox, {
			icon: BootIcons.Calendar,
			message: "noEntries_msg",
			color: theme.list_message_bg
		});
else return mithril_default(".flex.mb-s.col", this.renderEventsForDay(events, getTimeZone(), attrs.selectedDate, attrs));
	}
	renderMobileAgendaView(attrs) {
		const day = attrs.selectedDate;
		const previousDay = incrementDate(new Date(day), -1);
		const nextDay = incrementDate(new Date(day), 1);
		return mithril_default(PageView, {
			previousPage: {
				key: previousDay.getTime(),
				nodes: this.renderMobileEventList(previousDay, attrs)
			},
			currentPage: {
				key: day.getTime(),
				nodes: this.renderMobileEventList(day, attrs)
			},
			nextPage: {
				key: nextDay.getTime(),
				nodes: this.renderMobileEventList(nextDay, attrs)
			},
			onChangePage: (next) => attrs.onDateSelected(next ? nextDay : previousDay)
		});
	}
	renderMobileEventList(day, attrs) {
		const events = this.getEventsToRender(day, attrs);
		if (events.length === 0) return mithril_default(ColumnEmptyMessageBox, {
			icon: BootIcons.Calendar,
			message: "noEntries_msg",
			color: theme.list_message_bg,
			bottomContent: !client.isCalendarApp() ? mithril_default(MainCreateButton, {
				label: "newEvent_action",
				click: (e) => {
					let newDate = new Date(attrs.selectedDate);
					attrs.onNewEvent(setNextHalfHour(newDate));
					e.preventDefault();
				},
				class: "mt-s"
			}) : null
		});
else return mithril_default(".pt-s.flex.mb-s.col.overflow-y-scroll.height-100p", {
			style: { marginLeft: px(size.calendar_hour_width_mobile) },
			oncreate: (vnode) => {
				attrs.onViewChanged(vnode);
			},
			onupdate: (vnode) => {
				this.handleScrollOnUpdate(attrs, vnode);
			}
		}, this.renderEventsForDay(events, getTimeZone(), day, attrs));
	}
	getEventsToRender(day, attrs) {
		return (attrs.eventsForDays.get(day.getTime()) ?? []).filter((e) => {
			return shouldDisplayEvent(e, attrs.hiddenCalendars);
		});
	}
	renderAgenda(attrs, isDesktopLayout) {
		if (!isDesktopLayout) return this.renderMobileAgendaView(attrs);
		return mithril_default(".flex.flex-grow.height-100p", [mithril_default(".flex-grow.rel.overflow-y-scroll", {
			style: {
				"min-width": px(size.second_col_min_width),
				"max-width": px(size.second_col_max_width)
			},
			oncreate: (vnode) => {
				this.listDom = vnode.dom;
				attrs.onViewChanged(vnode);
			},
			onupdate: (vnode) => {
				this.handleScrollOnUpdate(attrs, vnode);
			}
		}, [this.renderDesktopEventList(attrs)]), mithril_default(".ml-l.flex-grow.scroll", { style: {
			"min-width": px(size.third_col_min_width),
			"max-width": px(size.third_col_max_width)
		} }, attrs.eventPreviewModel == null ? mithril_default(".rel.flex-grow.height-100p", mithril_default(ColumnEmptyMessageBox, {
			icon: BootIcons.Calendar,
			message: "noEventSelect_msg",
			color: theme.list_message_bg
		})) : this.renderEventPreview(attrs))]);
	}
	getBirthdayEventModel(eventPreviewModel) {
		if (isBirthdayEvent(eventPreviewModel.event?.uid)) return eventPreviewModel;
		return null;
	}
	renderEventPreview(attrs) {
		const { eventPreviewModel, onEditContact, onWriteMail } = attrs;
		const model = this.getBirthdayEventModel(eventPreviewModel);
		if (model) return mithril_default(".flex.col", mithril_default(ContactCardViewer, {
			contact: model.contact,
			editAction: onEditContact,
			onWriteMail,
			extendedActions: true,
			style: { margin: "0" }
		}));
		return mithril_default(EventDetailsView, { eventPreviewModel });
	}
	handleScrollOnUpdate(attrs, vnode) {
		attrs.onViewChanged(vnode);
		if (getIfLargeScroll(this.lastScrollPosition, attrs.scrollPosition)) vnode.dom.scrollTo({
			top: attrs.scrollPosition,
			behavior: "smooth"
		});
else vnode.dom.scrollTop = attrs.scrollPosition;
		this.lastScrollPosition = attrs.scrollPosition;
	}
	renderEventsForDay(events, zone, day, attrs) {
		const { groupColors: colors, onEventClicked: click, onEventKeyDown: keyDown, eventPreviewModel: modelPromise } = attrs;
		const agendaItemHeight = 62;
		const agendaGap = 3;
		const currentTime = attrs.selectedTime?.toDate();
		let newScrollPosition = 0;
		const eventToShowTimeIndicator = earliestEventToShowTimeIndicator(events, new Date());
		let eventsNodes = [];
		for (const [eventIndex, event] of events.entries()) {
			if (eventToShowTimeIndicator === eventIndex && isSameDay(new Date(), event.startTime)) eventsNodes.push(mithril_default(".mt-xs.mb-xs", { key: "timeIndicator" }, mithril_default(CalendarTimeIndicator, { circleLeftTangent: true })));
			if (currentTime && event.startTime < currentTime) newScrollPosition += agendaItemHeight + agendaGap;
			eventsNodes.push(mithril_default(CalendarAgendaItemView, {
				key: getListId(event) + getElementId(event) + event.startTime.toISOString(),
				event,
				color: getEventColor(event, colors),
				selected: event === modelPromise?.calendarEvent,
				click: (domEvent) => click(event, domEvent),
				keyDown: (domEvent) => {
					const target = domEvent.target;
					if (isKeyPressed(domEvent.key, Keys.UP, Keys.K) && !domEvent.repeat) {
						const previousItem = target.previousElementSibling;
						const previousIndex = eventIndex - 1;
						if (previousItem) {
							previousItem.focus();
							attrs.onScrollPositionChange(previousItem.offsetTop);
							if (previousIndex >= 0 && !styles.isSingleColumnLayout()) {
								keyDown(events[previousIndex], new KeyboardEvent("keydown", { key: Keys.RETURN.code }));
								return;
							}
						} else attrs.onScrollPositionChange(0);
					}
					if (isKeyPressed(domEvent.key, Keys.DOWN, Keys.J) && !domEvent.repeat) {
						const nextItem = target.nextElementSibling;
						const nextIndex = eventIndex + 1;
						if (nextItem) {
							nextItem.focus();
							attrs.onScrollPositionChange(nextItem.offsetTop);
							if (nextIndex < events.length && !styles.isSingleColumnLayout()) {
								keyDown(events[nextIndex], new KeyboardEvent("keydown", { key: Keys.RETURN.code }));
								return;
							}
						} else attrs.onScrollPositionChange(target.offsetTop);
					}
					keyDown(event, domEvent);
				},
				zone,
				day,
				height: agendaItemHeight,
				timeText: formatEventTimes(day, event, zone)
			}));
		}
		if (attrs.scrollPosition === this.lastScrollPosition) attrs.onScrollPositionChange(newScrollPosition - (agendaItemHeight + agendaGap));
		return events.length === 0 ? mithril_default(".mb-s", lang.get("noEntries_msg")) : mithril_default(".flex.col", { style: { gap: px(agendaGap) } }, eventsNodes);
	}
};
function earliestEventToShowTimeIndicator(events, date) {
	const firstNonAllDayEvent = events.findIndex((event) => !isAllDayEvent(event));
	if (firstNonAllDayEvent < 0) return null;
	const nonAllDayEvents = events.slice(firstNonAllDayEvent);
	const nextEvent = nonAllDayEvents.findIndex((event) => event.startTime > date);
	if (nextEvent < 0) return null;
	return nextEvent + firstNonAllDayEvent;
}

//#endregion
//#region src/calendar-app/calendar/gui/EditCalendarDialog.ts
var import_stream = __toESM(require_stream(), 1);
const defaultCalendarProperties = {
	name: "",
	color: "",
	alarms: [],
	sourceUrl: ""
};
async function handleUrlSubscription(calendarModel, url) {
	if (!locator.logins.isFullyLoggedIn()) return new Error("notFullyLoggedIn_msg");
	const externalIcalStr = await calendarModel.fetchExternalCalendar(url).catch((e) => e);
	if (externalIcalStr instanceof Error || externalIcalStr.trim() === "") return new Error("fetchingExternalCalendar_error");
	if (!isIcal(externalIcalStr)) return new Error("invalidICal_error");
	return externalIcalStr;
}
function sourceUrlInputField(urlStream, errorMessageStream) {
	const errorMessage = errorMessageStream().trim();
	let helperMessage = "";
	if (urlStream().trim() === "") helperMessage = "E.g: https://tuta.com/ics/example.ics";
else if (isNotNull(errorMessage) && errorMessage !== DEFAULT_ERROR) helperMessage = errorMessage;
	return mithril_default(TextField, {
		class: `pt pb ${helperMessage.length ? "" : "mb-small-line-height"}`,
		value: urlStream(),
		oninput: (url, inputElement) => {
			const assertionResult = checkURLString(url);
			urlStream(url);
			if (assertionResult instanceof URL) {
				errorMessageStream("");
				return;
			}
			errorMessageStream(lang.get(assertionResult));
		},
		label: "url_label",
		type: TextFieldType.Url,
		helpLabel: () => mithril_default("small.block.content-fg", helperMessage)
	});
}
function createEditCalendarComponent(nameStream, colorStream, shared, calendarType, alarms, urlStream, errorMessageStream) {
	return mithril_default.fragment({}, [
		mithril_default(TextField, {
			value: nameStream(),
			oninput: nameStream,
			label: "calendarName_label"
		}),
		mithril_default(".small.mt.mb-xs", lang.get("color_label")),
		mithril_default(ColorPickerView, {
			value: colorStream(),
			onselect: (color) => {
				colorStream(color);
			}
		}),
		!shared && isNormalCalendarType(calendarType) ? mithril_default(RemindersEditor, {
			alarms,
			addAlarm: (alarm) => {
				alarms?.push(alarm);
			},
			removeAlarm: (alarm) => {
				const index = alarms?.findIndex((a) => deepEqual(a, alarm));
				if (index !== -1) alarms?.splice(index, 1);
			},
			label: "calendarDefaultReminder_label",
			useNewEditor: false
		}) : null,
		isExternalCalendarType(calendarType) ? sourceUrlInputField(urlStream, errorMessageStream) : null
	]);
}
function showCreateEditCalendarDialog({ calendarType, titleTextId, shared, okAction, okTextId, warningMessage, calendarProperties: { name, color, alarms, sourceUrl } = defaultCalendarProperties, isNewCalendar = true, calendarModel }) {
	if (color !== "") color = "#" + color;
else if (isNewCalendar && isExternalCalendarType(calendarType)) color = generateRandomColor();
	const nameStream = (0, import_stream.default)(name);
	const colorStream = (0, import_stream.default)(color);
	const urlStream = (0, import_stream.default)(sourceUrl ?? "");
	const errorMessageStream = (0, import_stream.default)(DEFAULT_ERROR);
	const externalCalendarValidator = async () => {
		const assertionResult = checkURLString(urlStream());
		if (!calendarModel) throw new Error("Missing model");
		if (assertionResult instanceof URL) {
			const externalCalendarResult = await handleUrlSubscription(calendarModel, urlStream());
			if (externalCalendarResult instanceof Error) return externalCalendarResult.message;
		} else return assertionResult;
		return null;
	};
	const doAction = async (dialog$1) => {
		okAction(dialog$1, {
			name: nameStream(),
			color: colorStream().substring(1),
			alarms,
			sourceUrl: urlStream().trim()
		}, calendarModel);
	};
	const externalCalendarDialogProps = {
		title: "",
		child: { view: () => mithril_default(".flex.col", [
			mithril_default(".mt.mb.h6.b", lang.get(titleTextId)),
			warningMessage ? warningMessage() : null,
			sourceUrlInputField(urlStream, errorMessageStream),
			mithril_default(LoginButton, {
				label: okTextId,
				onclick: () => {
					externalCalendarValidator().then((validatorResult) => {
						if (validatorResult) {
							Dialog.message(validatorResult);
							return;
						}
						doAction(dialog);
					}).catch((e) => Dialog.message(lang.makeTranslation("error_message", e.message)));
				},
				class: errorMessageStream().trim() !== "" ? "mt-s no-hover button-bg" : "mt-s",
				disabled: errorMessageStream().trim() !== ""
			})
		]) },
		okAction: null
	};
	const dialog = Dialog.createActionDialog(Object.assign({
		allowOkWithReturn: true,
		okActionTextId: okTextId,
		title: titleTextId,
		child: { view: () => mithril_default(".flex.col", [warningMessage ? warningMessage() : null, createEditCalendarComponent(nameStream, colorStream, shared, calendarType, alarms, urlStream, errorMessageStream)]) },
		okAction: doAction
	}, isNewCalendar && isExternalCalendarType(calendarType) ? externalCalendarDialogProps : {}));
	dialog.show();
}

//#endregion
//#region src/calendar-app/calendar/view/CalendarDayEventsView.ts
const calendarDayTimes = numberRange(0, 23).map((number) => new Time(number, 0));
const allHoursHeight = size.calendar_hour_height * calendarDayTimes.length;
var CalendarDayEventsView = class {
	dayDom = null;
	view({ attrs }) {
		return mithril_default(".col.rel", {
			oncreate: (vnode) => {
				this.dayDom = vnode.dom;
				mithril_default.redraw();
			},
			onmousemove: (mouseEvent) => {
				downcast(mouseEvent).redraw = false;
				const time = getTimeFromMousePos(getPosAndBoundsFromMouseEvent(mouseEvent), 4);
				attrs.setTimeUnderMouse(time);
			}
		}, [
			calendarDayTimes.map((time) => mithril_default(".calendar-hour.flex.cursor-pointer", {
				onclick: (e) => {
					e.stopPropagation();
					const { hour, minute } = getTimeFromClickInteraction(e, time);
					attrs.onTimePressed(hour, minute);
				},
				oncontextmenu: (e) => {
					const { hour, minute } = getTimeFromClickInteraction(e, time);
					attrs.onTimeContextPressed(hour, minute);
					e.preventDefault();
				}
			})),
			this.dayDom ? this.renderEvents(attrs, attrs.events) : null,
			this.renderTimeIndicator(attrs)
		]);
	}
	renderTimeIndicator(attrs) {
		const now = new Date();
		if (!attrs.displayTimeIndicator) return null;
		const top = getTimeIndicatorPosition(now);
		return mithril_default(".abs", { style: {
			top: px(top),
			left: 0,
			right: 0
		} }, mithril_default(CalendarTimeIndicator));
	}
	renderEvents(attrs, events) {
		return layOutEvents(events, getTimeZone(), (columns) => this.renderColumns(attrs, columns), EventLayoutMode.TimeBasedColumn);
	}
	renderEvent(attrs, ev, columnIndex, columns, columnWidth) {
		const zone = getTimeZone();
		const startOfEvent = eventStartsBefore(attrs.day, zone, ev) ? getStartOfDay(attrs.day) : ev.startTime;
		const endOfEvent = eventEndsAfterDay(attrs.day, zone, ev) ? getEndOfDay(attrs.day) : ev.endTime;
		const startTime = (startOfEvent.getHours() * 60 + startOfEvent.getMinutes()) * 60 * 1e3;
		const height = (endOfEvent.getTime() - startOfEvent.getTime()) / 36e5 * size.calendar_hour_height - size.calendar_event_border;
		const fullViewWidth = attrs.fullViewWidth;
		const maxWidth = fullViewWidth != null ? px(styles.isDesktopLayout() ? fullViewWidth / 2 : fullViewWidth) : "none";
		const colSpan = expandEvent(ev, columnIndex, columns);
		const eventTitle = getDisplayEventTitle(ev.summary);
		return mithril_default(".abs.darker-hover", {
			style: {
				maxWidth,
				left: px(columnWidth * columnIndex),
				width: px(columnWidth * colSpan),
				top: px(startTime / DAY_IN_MILLIS * allHoursHeight),
				height: px(height)
			},
			onmousedown: () => {
				if (!attrs.isTemporaryEvent(ev)) attrs.setCurrentDraggedEvent(ev);
			}
		}, mithril_default(CalendarEventBubble, {
			text: eventTitle,
			secondLineText: mapNullable(getTimeTextFormatForLongEvent(ev, attrs.day, attrs.day, zone), (option) => formatEventTime(ev, option)),
			color: getEventColor(ev, attrs.groupColors),
			click: (domEvent) => attrs.onEventClicked(ev, domEvent),
			keyDown: (domEvent) => attrs.onEventKeyDown(ev, domEvent),
			height: height - size.calendar_day_event_padding,
			hasAlarm: hasAlarmsForTheUser(locator.logins.getUserController().user, ev),
			isAltered: ev.recurrenceId != null,
			verticalPadding: size.calendar_day_event_padding,
			fadeIn: !attrs.isTemporaryEvent(ev),
			opacity: attrs.isTemporaryEvent(ev) ? TEMPORARY_EVENT_OPACITY : 1,
			enablePointerEvents: !attrs.isTemporaryEvent(ev) && !attrs.isDragging && !attrs.disabled,
			isClientOnly: isClientOnlyCalendar(listIdPart(ev._id))
		}));
	}
	renderColumns(attrs, columns) {
		const columnWidth = neverNull(this.dayDom).clientWidth / columns.length;
		return columns.map((column, index) => {
			return column.map((event) => {
				return this.renderEvent(attrs, event, index, columns, Math.floor(columnWidth));
			});
		});
	}
};
function getTimeIndicatorPosition(now) {
	const passedMillisInDay = (now.getHours() * 60 + now.getMinutes()) * 60 * 1e3;
	return passedMillisInDay / DAY_IN_MILLIS * allHoursHeight;
}
function getTimeFromClickInteraction(e, time) {
	const rect = e.target.getBoundingClientRect();
	const mousePositionRelativeToRectHeight = Math.abs(rect.top - e.clientY);
	if (mousePositionRelativeToRectHeight > rect.height / 2) return new Time(time.hour, time.minute + 30);
	return time;
}

//#endregion
//#region src/calendar-app/calendar/view/MultiDayCalendarView.ts
var MultiDayCalendarView = class MultiDayCalendarView {
	longEventsDom = null;
	domElements = [];
	eventDragHandler;
	dateUnderMouse = null;
	viewDom = null;
	lastMousePos = null;
	isHeaderEventBeingDragged = false;
	isProgrammaticScrollInProgress = false;
	scrollEndTime = null;
	lastScrollPosition = null;
	constructor({ attrs }) {
		this.eventDragHandler = new EventDragHandler(neverNull(document.body), attrs.dragHandlerCallbacks);
	}
	oncreate(vnode) {
		this.viewDom = vnode.dom;
	}
	onupdate(vnode) {
		this.viewDom = vnode.dom;
	}
	view({ attrs }) {
		const startOfThisPeriod = attrs.daysInPeriod === 7 ? getStartOfWeek(attrs.selectedDate, getStartOfTheWeekOffset(attrs.startOfTheWeek)) : attrs.selectedDate;
		const startOfPreviousPeriod = incrementDate(new Date(startOfThisPeriod), -attrs.daysInPeriod);
		const startOfNextPeriod = incrementDate(new Date(startOfThisPeriod), attrs.daysInPeriod);
		const previousPageEvents = this.getEventsInRange(attrs.getEventsOnDays, attrs.daysInPeriod, startOfPreviousPeriod);
		const currentPageEvents = this.getEventsInRange(attrs.getEventsOnDays, attrs.daysInPeriod, startOfThisPeriod);
		const nextPageEvents = this.getEventsInRange(attrs.getEventsOnDays, attrs.daysInPeriod, startOfNextPeriod);
		const startOfWeek = getStartOfWeek(attrs.selectedDate, getStartOfTheWeekOffset(attrs.startOfTheWeek));
		const weekEvents = this.getEventsInRange(attrs.getEventsOnDays, 7, startOfWeek);
		const isDayView = attrs.daysInPeriod === 1;
		const isDesktopLayout = styles.isDesktopLayout();
		return mithril_default(".flex.col.fill-absolute", [!isDesktopLayout ? [this.renderDateSelector(attrs, isDayView), this.renderHeaderMobile(isDayView ? currentPageEvents : weekEvents, attrs.groupColors, attrs.onEventClicked, attrs.onEventKeyDown, attrs.temporaryEvents)] : null, mithril_default(PageView, {
			previousPage: {
				key: startOfPreviousPeriod.getTime(),
				nodes: this.renderDays(attrs, previousPageEvents, currentPageEvents, isDayView, isDesktopLayout)
			},
			currentPage: {
				key: startOfThisPeriod.getTime(),
				nodes: this.renderDays(attrs, currentPageEvents, currentPageEvents, isDayView, isDesktopLayout)
			},
			nextPage: {
				key: startOfNextPeriod.getTime(),
				nodes: this.renderDays(attrs, nextPageEvents, currentPageEvents, isDayView, isDesktopLayout)
			},
			onChangePage: (next) => attrs.onChangeViewPeriod(next)
		})]);
	}
	getEventsInRange(getEventsFunction, daysInPeriod, startOfPeriod) {
		const weekRange = getRangeOfDays(startOfPeriod, daysInPeriod);
		return getEventsFunction(weekRange);
	}
	renderDateSelector(attrs, isDayView) {
		return mithril_default("", [mithril_default(".header-bg.pb-s.overflow-hidden", { style: { "margin-left": px(size.calendar_hour_width_mobile) } }, mithril_default(DaySelector, {
			selectedDate: attrs.selectedDate,
			onDateSelected: (date) => attrs.onDateSelected(date),
			wide: true,
			startOfTheWeekOffset: getStartOfTheWeekOffset(attrs.startOfTheWeek),
			isDaySelectorExpanded: attrs.isDaySelectorExpanded,
			handleDayPickerSwipe: (isNext) => {
				const sign = isNext ? 1 : -1;
				const duration = {
					month: sign * (attrs.isDaySelectorExpanded ? 1 : 0),
					week: sign * (attrs.isDaySelectorExpanded ? 0 : 1)
				};
				attrs.onDateSelected(DateTime.fromJSDate(attrs.selectedDate).plus(duration).toJSDate());
			},
			showDaySelection: isDayView,
			highlightToday: true,
			highlightSelectedWeek: !isDayView,
			useNarrowWeekName: styles.isSingleColumnLayout(),
			hasEventOn: (date) => daysHaveEvents(attrs.getEventsOnDays([date]))
		}))]);
	}
	static getTodayTimestamp() {
		return getStartOfDay(new Date()).getTime();
	}
	renderDays(attrs, thisPeriod, mainPeriod, isDayView, isDesktopLayout) {
		let containerStyle;
		if (isDesktopLayout) containerStyle = {
			marginLeft: "5px",
			overflow: "hidden",
			marginBottom: px(size.hpad_large)
		};
else containerStyle = {};
		const isMainView = thisPeriod === mainPeriod;
		return mithril_default(".fill-absolute.flex.col.overflow-hidden", {
			class: isDesktopLayout ? "mlr-l border-radius-big" : "border-radius-top-left-big border-radius-top-right-big content-bg mlr-safe-inset",
			style: containerStyle,
			onmousemove: (mouseEvent) => {
				mouseEvent.redraw = false;
				this.lastMousePos = getPosAndBoundsFromMouseEvent(mouseEvent);
				if (this.dateUnderMouse) return this.eventDragHandler.handleDrag(this.dateUnderMouse, this.lastMousePos);
			},
			onmouseup: (mouseEvent) => {
				mouseEvent.redraw = false;
				this.endDrag(mouseEvent);
			},
			onmouseleave: (mouseEvent) => {
				mouseEvent.redraw = false;
				if (this.eventDragHandler.isDragging) this.cancelDrag();
			}
		}, [isDesktopLayout ? this.renderHeaderDesktop(attrs, thisPeriod, mainPeriod) : null, mithril_default(".flex.scroll-no-overlay.content-bg", {
			oncreate: (vnode) => {
				this.isProgrammaticScrollInProgress = false;
				if (isMainView) {
					if (attrs.selectedTime) attrs.onScrollPositionChange(size.calendar_hour_height * attrs.selectedTime.hour);
					this.scrollDOMs(vnode, attrs, false);
					attrs.onViewChanged(vnode);
					this.lastScrollPosition = attrs.scrollPosition;
				}
				this.domElements.push(vnode.dom);
			},
			onupdate: isMainView ? (vnode) => {
				this.scrollDOMs(vnode, attrs, getIfLargeScroll(this.lastScrollPosition, attrs.scrollPosition));
				attrs.onViewChanged(vnode);
				this.lastScrollPosition = attrs.scrollPosition;
			} : undefined,
			onscroll: isMainView ? (event) => {
				if (this.isProgrammaticScrollInProgress) {
					clearTimeout(this.scrollEndTime);
					this.scrollEndTime = setTimeout(() => {
						this.isProgrammaticScrollInProgress = false;
						attrs.onScrollPositionChange(event.target.scrollTop);
					}, 100);
				} else attrs.onScrollPositionChange(event.target.scrollTop);
			} : undefined,
			onremove: (vnode) => {
				remove(this.domElements, vnode.dom);
			}
		}, [mithril_default(".flex.col", calendarDayTimes.map((time) => {
			const width = isDesktopLayout ? size.calendar_hour_width : size.calendar_hour_width_mobile;
			return mithril_default(".calendar-hour.flex.cursor-pointer", { onclick: (e) => {
				e.stopPropagation();
				attrs.onNewEvent(time.toDate(attrs.selectedDate));
			} }, mithril_default(".pl-s.pr-s.center.small.flex.flex-column.justify-center", { style: {
				"line-height": isDesktopLayout ? px(size.calendar_hour_height) : "unset",
				width: px(width),
				height: px(size.calendar_hour_height),
				"border-right": `1px solid ${theme.content_border}`
			} }, isDesktopLayout ? formatTime(time.toDate()) : formatShortTime(time.toDate())));
		})), mithril_default(".flex.flex-grow", thisPeriod.days.map((weekday, i) => {
			const events = thisPeriod.shortEventsPerDay[i];
			const newEventHandler = (hours, minutes) => {
				const newDate = new Date(weekday);
				newDate.setHours(hours, minutes);
				attrs.onNewEvent(newDate);
				attrs.onDateSelected(new Date(weekday));
			};
			return mithril_default(".flex-grow", {
				class: !isDayView ? "calendar-column-border" : "",
				style: { height: px(calendarDayTimes.length * size.calendar_hour_height) }
			}, mithril_default(CalendarDayEventsView, {
				onEventClicked: attrs.onEventClicked,
				onEventKeyDown: attrs.onEventKeyDown,
				groupColors: attrs.groupColors,
				events,
				displayTimeIndicator: weekday.getTime() === MultiDayCalendarView.getTodayTimestamp(),
				onTimePressed: newEventHandler,
				onTimeContextPressed: newEventHandler,
				day: weekday,
				setCurrentDraggedEvent: (event) => this.startEventDrag(event),
				setTimeUnderMouse: (time) => this.dateUnderMouse = combineDateWithTime(weekday, time),
				isTemporaryEvent: (event) => attrs.temporaryEvents.includes(event),
				isDragging: this.eventDragHandler.isDragging,
				fullViewWidth: this.viewDom?.getBoundingClientRect().width,
				disabled: !isMainView
			}));
		}))])]);
	}
	scrollDOMs(vnode, attrs, isSmooth) {
		if (this.isProgrammaticScrollInProgress && this.lastScrollPosition === attrs.scrollPosition || vnode.dom.scrollTop === attrs.scrollPosition) return;
		if (isSmooth) {
			this.isProgrammaticScrollInProgress = true;
			vnode.dom.scrollTo({
				top: attrs.scrollPosition,
				behavior: "smooth"
			});
			for (const dom of this.domElements) dom.scrollTo({
				top: attrs.scrollPosition,
				behavior: "smooth"
			});
			vnode.dom.dispatchEvent(new Event("scroll"));
		} else {
			this.isProgrammaticScrollInProgress = false;
			vnode.dom.scrollTop = attrs.scrollPosition;
			for (const dom of this.domElements) dom.scrollTop = attrs.scrollPosition;
		}
	}
	startEventDrag(event) {
		const lastMousePos = this.lastMousePos;
		if (this.dateUnderMouse && lastMousePos) this.eventDragHandler.prepareDrag(event, this.dateUnderMouse, lastMousePos, this.isHeaderEventBeingDragged);
	}
	renderHeaderMobile(thisPageEvents, groupColors, onEventClicked, onEventKeyDown, temporaryEvents) {
		const longEventsResult = this.renderLongEvents(thisPageEvents.days, thisPageEvents.longEvents, groupColors, onEventClicked, onEventKeyDown, temporaryEvents, false);
		const mainPageEventsCount = longEventsResult.rows;
		const padding = mainPageEventsCount !== 0 ? size.vpad_small : 0;
		const height = mainPageEventsCount * CALENDAR_EVENT_HEIGHT + padding;
		return mithril_default(".calendar-long-events-header.flex-fixed.calendar-hour-margin.pr-l.rel", { style: {
			marginLeft: size.calendar_hour_width_mobile,
			borderBottom: "none",
			height: px(height),
			paddingTop: px(padding),
			transition: "height 200ms ease-in-out"
		} }, longEventsResult.children);
	}
	renderHeaderDesktop(attrs, thisPageEvents, mainPageEvents) {
		const { daysInPeriod, onDateSelected, onEventClicked, onEventKeyDown, groupColors, temporaryEvents } = attrs;
		return mithril_default(".calendar-long-events-header.flex-fixed.content-bg.pt-s.scrollbar-gutter-stable-or-fallback", [this.renderDayNamesRow(thisPageEvents.days, attrs.weekIndicator, onDateSelected), mithril_default(".content-bg", [mithril_default(
			".calendar-hour-margin.content-bg",
			{ onmousemove: (mouseEvent) => {
				const { x, targetWidth } = getPosAndBoundsFromMouseEvent(mouseEvent);
				const dayWidth = targetWidth / daysInPeriod;
				const dayNumber = Math.floor(x / dayWidth);
				const date = new Date(thisPageEvents.days[dayNumber]);
				const dateUnderMouse = this.dateUnderMouse;
				if (dateUnderMouse && this.eventDragHandler.isDragging && !this.isHeaderEventBeingDragged) {
					date.setHours(dateUnderMouse.getHours());
					date.setMinutes(dateUnderMouse.getMinutes());
				}
				this.dateUnderMouse = date;
			} },
			// this section is tricky with margins. We use this view for both week and day view.
			// in day view there's no days row and no selection indicator.
			// it all must work with and without long events.
			// thread carefully and test all the cases.
			[this.renderLongEventsSection(thisPageEvents, mainPageEvents, groupColors, onEventClicked, onEventKeyDown, temporaryEvents)]
)])]);
	}
	renderLongEventsSection(thisPageEvents, mainPageEvents, groupColors, onEventClicked, onEventKeyDown, temporaryEvents) {
		const thisPageLongEvents = this.renderLongEvents(thisPageEvents.days, thisPageEvents.longEvents, groupColors, onEventClicked, onEventKeyDown, temporaryEvents, true);
		const mainPageLongEvents = this.renderLongEvents(mainPageEvents.days, mainPageEvents.longEvents, groupColors, onEventClicked, onEventKeyDown, temporaryEvents, true);
		return mithril_default(".rel.mb-xs", {
			oncreate: (vnode) => {
				if (mainPageEvents === thisPageEvents) this.longEventsDom = vnode.dom;
				mithril_default.redraw();
			},
			onupdate: (vnode) => {
				if (mainPageEvents === thisPageEvents) this.longEventsDom = vnode.dom;
			},
			style: {
				height: px(mainPageLongEvents.rows * CALENDAR_EVENT_HEIGHT),
				width: "100%",
				transition: "height 200ms ease-in-out"
			}
		}, thisPageLongEvents.children);
	}
	/**
	*
	* @returns the rendered calendar bubble children, and the maximum number of events that occur on a day (out of all days)
	*/
	renderLongEvents(dayRange, events, groupColors, onEventClicked, onEventKeyDown, temporaryEvents, isDesktopLayout) {
		if (isDesktopLayout) return dayRange.length === 1 ? {
			children: this.renderLongEventsForSingleDay(dayRange[0], events, groupColors, onEventClicked, onEventKeyDown, temporaryEvents),
			rows: events.length
		} : this.renderLongEventsForMultipleDays(dayRange, events, groupColors, onEventClicked, onEventKeyDown, temporaryEvents);
else return this.renderLongEventsForMultipleDays(dayRange, events, groupColors, onEventClicked, onEventKeyDown, temporaryEvents);
	}
	/**
	*Only called from day view where header events are not draggable
	*/
	renderLongEventsForSingleDay(day, events, groupColors, onEventClicked, onEventKeyDown, temporaryEvents) {
		const zone = getTimeZone();
		return [mithril_default("", events.map((event) => {
			return this.renderLongEventBubble(event, getTimeTextFormatForLongEvent(event, day, day, zone), eventStartsBefore(day, zone, event), eventEndsAfterDay(day, zone, event), groupColors, (_, domEvent) => onEventClicked(event, domEvent), (_, domEvent) => onEventKeyDown(event, domEvent), temporaryEvents.includes(event));
		}))];
	}
	renderLongEventsForMultipleDays(dayRange, events, groupColors, onEventClicked, onEventKeyDown, temporaryEvents) {
		if (this.longEventsDom == null && this.viewDom == null) return {
			children: null,
			rows: 0
		};
		const dayWidth = (this.longEventsDom != null ? this.longEventsDom.offsetWidth : this.viewDom.offsetWidth - size.calendar_hour_width_mobile) / dayRange.length;
		let maxEventsInColumn = 0;
		const firstDay = dayRange[0];
		const lastDay = lastThrow(dayRange);
		const zone = getTimeZone();
		const children = layOutEvents(events, zone, (columns) => {
			maxEventsInColumn = Math.max(maxEventsInColumn, columns.length);
			return columns.map((rows, c) => rows.map((event) => {
				const isAllDay = isAllDayEvent(event);
				const eventEnd = isAllDay ? incrementDate(getEventEnd(event, zone), -1) : event.endTime;
				const dayOfStartDate = getDiffIn24hIntervals(firstDay, getEventStart(event, zone));
				const dayOfEndDate = getDiffIn24hIntervals(firstDay, eventEnd);
				const startsBefore = eventStartsBefore(firstDay, zone, event);
				const endsAfter = eventEndsAfterDay(lastDay, zone, event);
				const left = startsBefore ? 0 : dayOfStartDate * dayWidth;
				const right = endsAfter ? 0 : (dayRange.length - 1 - dayOfEndDate) * dayWidth;
				return mithril_default(".abs", {
					style: {
						top: px(c * CALENDAR_EVENT_HEIGHT),
						left: px(left),
						right: px(right)
					},
					key: event._id[0] + event._id[1] + event.startTime.getTime(),
					onmousedown: () => {
						if (styles.isDesktopLayout()) {
							this.isHeaderEventBeingDragged = true;
							this.startEventDrag(event);
						}
					}
				}, this.renderLongEventBubble(event, isAllDay ? null : EventTextTimeOption.START_END_TIME, startsBefore, endsAfter, groupColors, onEventClicked, onEventKeyDown, temporaryEvents.includes(event)));
			}));
		}, EventLayoutMode.DayBasedColumn);
		return {
			children,
			rows: maxEventsInColumn
		};
	}
	renderLongEventBubble(event, showTime, startsBefore, endsAfter, groupColors, onEventClicked, onEventKeyDown, isTemporary) {
		const fadeIn = !isTemporary;
		const opacity$1 = isTemporary ? TEMPORARY_EVENT_OPACITY : 1;
		const enablePointerEvents = !this.eventDragHandler.isDragging && !isTemporary;
		return mithril_default(ContinuingCalendarEventBubble, {
			event,
			startsBefore,
			endsAfter,
			color: getEventColor(event, groupColors),
			onEventClicked,
			onEventKeyDown,
			showTime,
			user: locator.logins.getUserController().user,
			fadeIn,
			opacity: opacity$1,
			enablePointerEvents
		});
	}
	renderDayNamesRow(days, weekIndicator, onDateSelected) {
		if (days.length === 1 && weekIndicator == null) return null;
		const rowSize = px(size.calendar_days_header_height);
		return mithril_default(".flex.mb-s", weekIndicator ? mithril_default(".calendar-hour-column.calendar-day-indicator.b.center-horizontally", weekIndicator) : mithril_default(".calendar-hour-margin"), days.length === 1 ? null : days.map((day) => {
			const onclick = () => onDateSelected(day, CalendarViewType.DAY);
			return mithril_default(".flex.center-horizontally.flex-grow.center.b", [mithril_default(".calendar-day-indicator.clickable", {
				onclick,
				style: { "padding-right": px(4) }
			}, lang.formats.weekdayShort.format(day) + " "), mithril_default(".rel.click.flex.items-center.justify-center.rel.ml-hpad_small", {
				"aria-label": day.toLocaleDateString(),
				onclick
			}, [mithril_default(".abs.z1.circle", {
				class: isToday(day) ? "calendar-current-day-circle" : "",
				style: {
					width: rowSize,
					height: rowSize
				}
			}), mithril_default(".full-width.height-100p.center.z2", {
				class: isToday(day) ? "calendar-current-day-text" : "",
				style: {
					fontSize: px(14),
					lineHeight: rowSize
				}
			}, day.getDate())])]);
		}));
	}
	endDrag(pos) {
		this.isHeaderEventBeingDragged = false;
		if (this.dateUnderMouse) this.eventDragHandler.endDrag(this.dateUnderMouse, pos).catch(ofClass(UserError, showUserError));
	}
	cancelDrag() {
		this.eventDragHandler.cancelDrag();
	}
};

//#endregion
//#region src/calendar-app/calendar/view/TodayIconButton.ts
var TodayIconButton = class {
	view({ attrs }) {
		return mithril_default(BaseButton, {
			label: "today_label",
			onclick: attrs.click,
			icon: mithril_default(Icon, {
				container: "div",
				class: "center-h svg-text-content-bg",
				size: IconSize.Medium,
				svgParameters: { date: new Date().getDate().toString() },
				icon: Icons.Today,
				style: { fill: theme.content_button }
			}),
			class: "icon-button state-bg"
		});
	}
};

//#endregion
//#region src/calendar-app/calendar/view/CalendarMobileHeader.ts
var CalendarMobileHeader = class {
	view({ attrs }) {
		return mithril_default(BaseMobileHeader, {
			left: this.renderTopLeftButton(attrs),
			center: mithril_default(MobileHeaderTitle, {
				title: attrs.showExpandIcon ? mithril_default(ExpanderButton, {
					label: lang.makeTranslation(attrs.navConfiguration.title, attrs.navConfiguration.title),
					isUnformattedLabel: true,
					style: {
						"padding-top": "inherit",
						height: "inherit",
						"min-height": "inherit",
						"text-decoration": "none"
					},
					expanded: attrs.isDaySelectorExpanded,
					color: theme.content_fg,
					isBig: true,
					isPropagatingEvents: true,
					onExpandedChange: () => {}
				}) : attrs.navConfiguration.title,
				bottom: mithril_default(OfflineIndicator, attrs.offlineIndicatorModel.getCurrentAttrs()),
				onTap: attrs.onTap
			}),
			right: [
				this.renderDateNavigation(attrs),
				mithril_default(TodayIconButton, { click: attrs.onToday }),
				this.renderViewSelector(attrs),
				client.isCalendarApp() ? this.renderSearchNavigationButton() : mithril_default(IconButton, {
					icon: Icons.Add,
					title: "newEvent_action",
					click: attrs.onCreateEvent
				})
			],
			injections: mithril_default(ProgressBar, { progress: attrs.offlineIndicatorModel.getProgress() })
		});
	}
	renderTopLeftButton(attrs) {
		if (attrs.viewType === CalendarViewType.AGENDA && history.state?.origin === CalendarViewType.MONTH) return mithril_default(MobileHeaderBackButton, { backAction: () => {
			const date = history.state.dateString ?? new Date().toISOString().substring(0, 10);
			mithril_default.route.set("/calendar/:view/:date", {
				view: CalendarViewType.MONTH,
				date
			});
		} });
else if (styles.isUsingBottomNavigation() && styles.isDesktopLayout()) return null;
		return mithril_default(MobileHeaderMenuButton, {
			newsModel: attrs.newsModel,
			backAction: () => attrs.viewSlider.focusPreviousColumn()
		});
	}
	renderSearchNavigationButton() {
		if (locator.logins.isInternalUserLoggedIn()) return mithril_default(".icon-button", mithril_default(NavButton, {
			label: "search_label",
			hideLabel: true,
			icon: () => BootIcons.Search,
			href: "/search/calendar",
			centred: true,
			fillSpaceAround: false
		}));
		return null;
	}
	renderDateNavigation(attrs) {
		if (isApp() || !(styles.isSingleColumnLayout() || styles.isTwoColumnLayout())) return null;
		return mithril_default.fragment({}, [attrs.navConfiguration.back, attrs.navConfiguration.forward]);
	}
	renderViewSelector(attrs) {
		return mithril_default(IconButton, attachDropdown({
			mainButtonAttrs: {
				icon: getIconForViewType(attrs.viewType),
				title: "view_label"
			},
			childAttrs: () => {
				const calendarViewValues = [
					{
						name: "agenda_label",
						value: CalendarViewType.AGENDA
					},
					{
						name: "day_label",
						value: CalendarViewType.DAY
					},
					{
						name: "week_label",
						value: CalendarViewType.WEEK
					},
					{
						name: "month_label",
						value: CalendarViewType.MONTH
					}
				];
				return calendarViewValues.map(({ name, value }) => ({
					label: name,
					selected: value === attrs.viewType,
					icon: getIconForViewType(value),
					click: () => attrs.onViewTypeSelected(value)
				}));
			}
		}));
	}
};

//#endregion
//#region src/common/gui/base/IconSegmentControl.ts
var IconSegmentControl = class {
	view(vnode) {
		return [mithril_default(".icon-segment-control.flex.items-center", { role: "tablist" }, vnode.attrs.items.map((item) => {
			const title = lang.getTranslationText(item.label);
			return mithril_default("button.icon-segment-control-item.flex.center-horizontally.center-vertically.text-ellipsis.small.state-bg.pt-xs.pb-xs", {
				active: item.value === vnode.attrs.selectedValue ? "true" : undefined,
				title,
				role: "tab",
				"aria-label": title,
				"aria-selected": String(item.value === vnode.attrs.selectedValue),
				onclick: () => this.onSelected(item, vnode.attrs),
				style: {
					maxWidth: vnode.attrs.maxItemWidth ? px(vnode.attrs.maxItemWidth) : null,
					backgroundClip: "padding-box"
				}
			}, mithril_default(Icon, {
				icon: item.icon,
				container: "div",
				class: "center-h",
				size: IconSize.Medium,
				style: { fill: getColors(ButtonColor.Content).button }
			}));
		}))];
	}
	onSelected(item, attrs) {
		if (item.value !== attrs.selectedValue) attrs.onValueSelected(item.value);
	}
};

//#endregion
//#region src/calendar-app/calendar/view/CalendarDesktopToolbar.ts
var CalendarDesktopToolbar = class {
	view({ attrs }) {
		const { navConfig } = attrs;
		return mithril_default(".flex.row.items-center.content-bg.border-radius-big.mlr-l.rel.pr.pl-vpad-m", { style: {
			marginLeft: `5px`,
			marginBottom: px(size.hpad_large)
		} }, [
			mithril_default("h1", navConfig.title),
			mithril_default(".flex.items-center.justify-center.flex-grow.height-100p", this.renderViewSelector(attrs)),
			mithril_default(".flex.pt-xs.pb-xs", [
				navConfig.back ?? mithril_default(".button-width-fixed"),
				mithril_default(".flex", mithril_default(TodayIconButton, { click: attrs.onToday })),
				navConfig.forward ?? mithril_default(".button-width-fixed")
			])
		]);
	}
	renderViewSelector(attrs) {
		const calendarViewValues = [
			{
				icon: getIconForViewType(CalendarViewType.AGENDA),
				label: "agenda_label",
				value: CalendarViewType.AGENDA
			},
			{
				icon: getIconForViewType(CalendarViewType.DAY),
				label: "day_label",
				value: CalendarViewType.DAY
			},
			{
				icon: getIconForViewType(CalendarViewType.WEEK),
				label: "week_label",
				value: CalendarViewType.WEEK
			},
			{
				icon: getIconForViewType(CalendarViewType.MONTH),
				label: "month_label",
				value: CalendarViewType.MONTH
			}
		];
		return mithril_default(".abs.center-h", {
			role: "tablist",
			"aria-label": lang.get("periodOfTime_label"),
			style: {
				left: 0,
				right: 0,
				width: px(size.icon_segment_control_button_width * 4)
			}
		}, mithril_default(IconSegmentControl, {
			selectedValue: attrs.viewType,
			onValueSelected: (type) => attrs.onViewTypeSelected(type),
			items: calendarViewValues,
			maxItemWidth: 48
		}));
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/day-selector/DaySelectorSidebar.ts
var DaySelectorSidebar = class {
	currentDate;
	openDate;
	constructor(vnode) {
		this.currentDate = vnode.attrs.selectedDate;
		this.openDate = vnode.attrs.selectedDate;
	}
	view(vnode) {
		if (vnode.attrs.selectedDate !== this.openDate) {
			this.currentDate = vnode.attrs.selectedDate;
			this.openDate = vnode.attrs.selectedDate;
		}
		const disableHighlight = !isSameDay(vnode.attrs.selectedDate, this.currentDate);
		return mithril_default(".plr-m.mt-form", mithril_default(".elevated-bg.pt-s.pb-m.border-radius.flex.flex-column", [this.renderPickerHeader(this.currentDate), mithril_default(".flex-grow.overflow-hidden", [mithril_default(DaySelector, {
			selectedDate: this.currentDate,
			onDateSelected: vnode.attrs.onDateSelected,
			wide: false,
			startOfTheWeekOffset: vnode.attrs.startOfTheWeekOffset,
			isDaySelectorExpanded: true,
			handleDayPickerSwipe: (isNext) => {
				this.onMonthChange(isNext);
				mithril_default.redraw();
			},
			showDaySelection: vnode.attrs.showDaySelection && !disableHighlight,
			highlightToday: vnode.attrs.highlightToday,
			highlightSelectedWeek: vnode.attrs.highlightSelectedWeek && !disableHighlight,
			useNarrowWeekName: true,
			hasEventOn: vnode.attrs.hasEventsOn
		})])]));
	}
	renderPickerHeader(date) {
		return mithril_default(".flex.flex-space-between.pb.items-center.mlr-xs", [
			renderSwitchMonthArrowIcon(false, 24, () => this.onMonthChange(false)),
			mithril_default(".b.mlr-s", { style: { fontSize: "14px" } }, formatMonthWithFullYear(date)),
			renderSwitchMonthArrowIcon(true, 24, () => this.onMonthChange(true))
		]);
	}
	onMonthChange(forward) {
		this.currentDate = incrementMonth(this.currentDate, forward ? 1 : -1);
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/day-selector/DaySelectorPopup.ts
var DaySelectorPopup = class {
	_shortcuts = [];
	dom = null;
	currentDate;
	focusedBeforeShown = null;
	/**
	* @param rect The rect with coordinates about where the popup should be rendered
	* @param attrs The attributes for the component
	*/
	constructor(rect, attrs) {
		this.rect = rect;
		this.attrs = attrs;
		this.setupShortcuts();
		this.view = this.view.bind(this);
		this.currentDate = attrs.selectedDate;
	}
	view() {
		return mithril_default(".abs.elevated-bg.plr.pt-s.pb-m.border-radius.dropdown-shadow.flex.flex-column", {
			style: {
				opacity: "0",
				left: px(this.rect.left),
				top: px(this.rect.bottom)
			},
			tabIndex: 0,
			autoFocus: "true",
			oncreate: (vnode) => {
				this.dom = vnode.dom;
				animations.add(this.dom, [opacity(0, 1, true), transform(TransformEnum.Scale, .5, 1)], { easing: ease.out });
				setTimeout(() => this.dom?.focus(), 200);
			}
		}, [this.renderPickerHeader(this.currentDate), mithril_default(".flex-grow.overflow-hidden", [mithril_default(DaySelector, {
			selectedDate: this.currentDate,
			onDateSelected: this.attrs.onDateSelected,
			wide: true,
			startOfTheWeekOffset: this.attrs.startOfTheWeekOffset,
			isDaySelectorExpanded: true,
			handleDayPickerSwipe: (isNext) => {
				this.onMonthChange(isNext);
				mithril_default.redraw();
			},
			showDaySelection: false,
			highlightToday: this.attrs.highlightToday,
			highlightSelectedWeek: this.attrs.highlightSelectedWeek,
			useNarrowWeekName: styles.isSingleColumnLayout(),
			hasEventOn: this.attrs.hasEventsOn
		})])]);
	}
	renderPickerHeader(date) {
		return mithril_default(".flex.flex-space-between.pb-s.items-center", [mithril_default(".b", { style: {
			fontSize: "14px",
			marginLeft: "6px"
		} }, formatMonthWithFullYear(date)), mithril_default(".flex.items-center", [renderSwitchMonthArrowIcon(false, 24, () => this.onMonthChange(false)), renderSwitchMonthArrowIcon(true, 24, () => this.onMonthChange(true))])]);
	}
	onMonthChange(forward) {
		this.currentDate = incrementMonth(this.currentDate, forward ? 1 : -1);
	}
	turnTrapFocus(on) {
		const elementsQuery = document.getElementsByClassName("main-view");
		if (elementsQuery.length > 0) {
			const mainDiv = elementsQuery.item(0);
			if (on) mainDiv?.setAttribute("inert", "true");
else mainDiv?.removeAttribute("inert");
		}
	}
	show() {
		this.focusedBeforeShown = document.activeElement;
		this.turnTrapFocus(true);
		modal.display(this, false);
	}
	close() {
		this.turnTrapFocus(false);
		modal.remove(this);
	}
	backgroundClick(e) {
		this.turnTrapFocus(false);
		modal.remove(this);
	}
	hideAnimation() {
		return Promise.resolve();
	}
	onClose() {
		this.close();
	}
	shortcuts() {
		return this._shortcuts;
	}
	popState(e) {
		this.turnTrapFocus(false);
		modal.remove(this);
		return false;
	}
	callingElement() {
		return this.focusedBeforeShown;
	}
	setupShortcuts() {
		const close = {
			key: Keys.ESC,
			exec: () => this.close(),
			help: "close_alt"
		};
		this._shortcuts.push(close);
	}
};

//#endregion
//#region src/calendar-app/gui/FloatingActionButton.ts
var FloatingActionButton = class {
	view({ attrs: { title, colors, icon, action } }) {
		return mithril_default("span.float-action-button.posb-ml.posr-ml.accent-bg.fab-shadow", mithril_default(IconButton, {
			colors,
			icon,
			title,
			click: action,
			size: ButtonSize.Large
		}));
	}
};

//#endregion
//#region src/calendar-app/calendar/gui/eventpopup/ContactPreviewView.ts
var ContactPreviewView = class {
	getLocationUrl;
	constructor() {
		this.getLocationUrl = memoized(getLocationUrl);
	}
	view(vnode) {
		const { event, contact } = vnode.attrs;
		const eventTitle = getContactTitle(contact);
		const birthYear = contact.birthdayIso && isoDateToBirthday(contact.birthdayIso).year;
		const age = birthYear && calculateContactsAge(new Date(birthYear).getFullYear(), event.startTime.getFullYear());
		const ageString = age ? lang.get("birthdayEventAge_title", { "{age}": age }) : "";
		return mithril_default(".flex.col.smaller.scroll.visible-scrollbar", [
			this.renderRow(BootIcons.Calendar, [mithril_default("span.h3", eventTitle)]),
			this.renderRow(Icons.Time, [formatEventDuration(event, getTimeZone(), false)]),
			age ? this.renderRow(Icons.Gift, ageString) : null,
			this.renderActions(contact)
		]);
	}
	renderRow(headerIcon, children, isAlignedLeft) {
		return mithril_default(".flex.pb-s", { class: isAlignedLeft ? "items-start" : "items-center" }, [this.renderSectionIndicator(headerIcon, isAlignedLeft ? { marginTop: "2px" } : undefined), mithril_default(".selectable.text-break.full-width", children)]);
	}
	renderSectionIndicator(icon, style = {}) {
		return mithril_default(Icon, {
			icon,
			class: "pr",
			size: IconSize.Medium,
			style: Object.assign({
				fill: theme.content_button,
				display: "block"
			}, style)
		});
	}
	renderActions(contact) {
		return mithril_default(".flex.pb-s", mithril_default(ActionButtons, contact));
	}
};
function simulateMailToClick(mailAddress) {
	const anchorElement = document.createElement("a");
	anchorElement.href = `mailto:${mailAddress}`;
	anchorElement.target = "_blank";
	anchorElement.click();
}
const ActionButtons = pureComponent((contact) => {
	const makeActionButtonAttrs = (onClick, text, colors, icon) => ({
		text,
		class: "width-min-content flex items-center",
		click: onClick,
		icon,
		...colors
	});
	const renderIcon = (icon, fillColor) => mithril_default(Icon, {
		icon,
		class: "flex-center items-center mr-xs",
		style: { fill: fillColor }
	});
	const renderSuffix = (text) => text !== "" ? `(${text}) ` : "";
	const showMailDropdown = createDropdown({ lazyButtons: () => contact.mailAddresses.map((mailAddress, index) => ({
		label: lang.makeTranslation("mailAddress_label", `${renderSuffix(mailAddress.customTypeName)}${mailAddress.address}`),
		click: () => {
			if (client.isCalendarApp()) {
				simulateMailToClick(mailAddress.address);
				return;
			}
			return writeMail({
				name: `${contact.firstName} ${contact.lastName}`.trim(),
				address: mailAddress.address,
				contact
			});
		}
	})) });
	const showPhoneDropdown = createDropdown({ lazyButtons: () => contact.phoneNumbers.map((contactPhone, index) => ({
		label: lang.makeTranslation("phoneNumber", `${renderSuffix(contactPhone.customTypeName)}${contactPhone.number}`),
		click: () => {
			const element = document.createElement("a");
			element.href = `tel:${contactPhone.number}`;
			element.target = "_blank";
			element.click();
		}
	})) });
	const emailButtonColors = {
		borderColor: theme.content_accent,
		color: theme.content_accent
	};
	const phoneButtonColors = {
		borderColor: theme.content_button,
		color: theme.content_button
	};
	const singleEmailAdress = contact.mailAddresses.length === 1;
	const singlePhoneNumber = contact.phoneNumbers.length === 1;
	const onSendMailClick = (event, dom) => {
		if (singleEmailAdress) {
			if (client.isCalendarApp()) return;
else if (!client.isCalendarApp()) return writeMail({
				name: `${contact.firstName} ${contact.lastName}`.trim(),
				address: contact.mailAddresses[0].address,
				contact
			});
		}
		showMailDropdown(event, dom);
	};
	return mithril_default(".full-width.flex.items-center.flex-end.mt-s", [contact.mailAddresses.length ? mithril_default(singleEmailAdress && client.isCalendarApp() ? `a[href="mailto:${contact.mailAddresses[0].address}"][target=_blank].no-text-decoration` : "", mithril_default(BannerButton, makeActionButtonAttrs(onSendMailClick, "sendMail_label", emailButtonColors, renderIcon(BootIcons.Mail, emailButtonColors.color)))) : null, contact.phoneNumbers.length ? mithril_default(singlePhoneNumber ? `a[href="tel:${contact.phoneNumbers[0].number}"][target=_blank].no-text-decoration` : "", mithril_default(BannerButton, makeActionButtonAttrs(singlePhoneNumber ? noOp : showPhoneDropdown, "callNumber_label", phoneButtonColors, renderIcon(Icons.Call, phoneButtonColors.color)))) : null]);
});

//#endregion
//#region src/calendar-app/calendarLocator.ts
assertMainOrNode();
var CalendarLocator = class {
	eventController;
	search;
	mailboxModel;
	contactModel;
	entityClient;
	progressTracker;
	credentialsProvider;
	worker;
	fileController;
	secondFactorHandler;
	webAuthn;
	loginFacade;
	logins;
	header;
	customerFacade;
	giftCardFacade;
	groupManagementFacade;
	configFacade;
	calendarFacade;
	mailFacade;
	shareFacade;
	counterFacade;
	bookingFacade;
	mailAddressFacade;
	blobFacade;
	userManagementFacade;
	recoverCodeFacade;
	contactFacade;
	usageTestController;
	usageTestModel;
	newsModel;
	serviceExecutor;
	cryptoFacade;
	searchTextFacade;
	desktopSettingsFacade;
	desktopSystemFacade;
	mailImporter;
	webMobileFacade;
	systemPermissionHandler;
	interWindowEventSender;
	cacheStorage;
	workerFacade;
	loginListener;
	random;
	connectivityModel;
	operationProgressTracker;
	infoMessageHandler;
	themeController;
	Const;
	nativeInterfaces = null;
	entropyFacade;
	sqlCipherFacade;
	recipientsModel = lazyMemoized(async () => {
		const { RecipientsModel } = await import("./RecipientsModel2-chunk.js");
		return new RecipientsModel(this.contactModel, this.logins, this.mailFacade, this.entityClient);
	});
	async noZoneDateProvider() {
		return new NoZoneDateProvider();
	}
	async sendMailModel(mailboxDetails, mailboxProperties) {
		const factory = await this.sendMailModelSyncFactory(mailboxDetails, mailboxProperties);
		return factory();
	}
	redraw = lazyMemoized(async () => {
		const m = await import("./mithril2-chunk.js");
		return m.redraw;
	});
	offlineIndicatorViewModel = lazyMemoized(async () => {
		return new OfflineIndicatorViewModel(this.cacheStorage, this.loginListener, this.connectivityModel, this.logins, this.progressTracker, await this.redraw());
	});
	async appHeaderAttrs() {
		return {
			offlineIndicatorModel: await this.offlineIndicatorViewModel(),
			newsModel: this.newsModel
		};
	}
	async searchViewModelFactory() {
		const { CalendarSearchViewModel } = await import("./CalendarSearchViewModel-chunk.js");
		const redraw$1 = await this.redraw();
		const searchRouter = await this.scopedSearchRouter();
		const calendarEventsRepository = await this.calendarEventsRepository();
		return () => {
			return new CalendarSearchViewModel(searchRouter, this.search, this.logins, this.entityClient, this.eventController, this.calendarFacade, this.progressTracker, calendarEventsRepository, redraw$1, deviceConfig.getClientOnlyCalendars());
		};
	}
	async calendarSearchViewModelFactory() {
		const { CalendarSearchViewModel } = await import("./CalendarSearchViewModel-chunk.js");
		const redraw$1 = await this.redraw();
		const searchRouter = await this.scopedSearchRouter();
		const calendarEventsRepository = await this.calendarEventsRepository();
		return () => {
			return new CalendarSearchViewModel(searchRouter, this.search, this.logins, this.entityClient, this.eventController, this.calendarFacade, this.progressTracker, calendarEventsRepository, redraw$1, deviceConfig.getClientOnlyCalendars());
		};
	}
	throttledRouter = lazyMemoized(() => new ThrottledRouter());
	scopedSearchRouter = lazyMemoized(async () => {
		const { SearchRouter } = await import("./SearchRouter2-chunk.js");
		return new SearchRouter(new ScopedRouter(this.throttledRouter(), "/search"));
	});
	unscopedSearchRouter = lazyMemoized(async () => {
		const { SearchRouter } = await import("./SearchRouter2-chunk.js");
		return new SearchRouter(this.throttledRouter());
	});
	async receivedGroupInvitationsModel(groupType) {
		const { ReceivedGroupInvitationsModel } = await import("./ReceivedGroupInvitationsModel2-chunk.js");
		return new ReceivedGroupInvitationsModel(groupType, this.eventController, this.entityClient, this.logins);
	}
	calendarViewModel = lazyMemoized(async () => {
		const { CalendarViewModel } = await import("./CalendarViewModel-chunk.js");
		const { DefaultDateProvider } = await import("./CalendarUtils2-chunk.js");
		const timeZone = new DefaultDateProvider().timeZone();
		return new CalendarViewModel(this.logins, async (mode, event) => {
			const mailboxDetail = await this.mailboxModel.getUserMailboxDetails();
			const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetail.mailboxGroupRoot);
			return await this.calendarEventModel(mode, event, mailboxDetail, mailboxProperties, null);
		}, (...args) => this.calendarEventPreviewModel(...args), (...args) => this.calendarContactPreviewModel(...args), await this.calendarModel(), await this.calendarEventsRepository(), this.entityClient, this.eventController, this.progressTracker, deviceConfig, await this.receivedGroupInvitationsModel(GroupType.Calendar), timeZone, this.mailboxModel, this.contactModel);
	});
	calendarEventsRepository = lazyMemoized(async () => {
		const { CalendarEventsRepository } = await import("./CalendarEventsRepository-chunk.js");
		const { DefaultDateProvider } = await import("./CalendarUtils2-chunk.js");
		const timeZone = new DefaultDateProvider().timeZone();
		return new CalendarEventsRepository(await this.calendarModel(), this.calendarFacade, timeZone, this.entityClient, this.eventController, this.contactModel, this.logins);
	});
	/** This ugly bit exists because CalendarEventWhoModel wants a sync factory. */
	async sendMailModelSyncFactory(mailboxDetails, mailboxProperties) {
		const { SendMailModel } = await import("./SendMailModel-chunk.js");
		const recipientsModel = await this.recipientsModel();
		const dateProvider = await this.noZoneDateProvider();
		return () => new SendMailModel(this.mailFacade, this.entityClient, this.logins, this.mailboxModel, this.contactModel, this.eventController, mailboxDetails, recipientsModel, dateProvider, mailboxProperties, async (mail) => {
			return false;
		});
	}
	async calendarEventModel(editMode, event, mailboxDetail, mailboxProperties, responseTo) {
		const [{ makeCalendarEventModel }, { getTimeZone: getTimeZone$1 }, { calendarNotificationSender }] = await Promise.all([
			import("./CalendarEventModel-chunk.js"),
			import("./CalendarUtils2-chunk.js"),
			import("./CalendarNotificationSender-chunk.js")
		]);
		const sendMailModelFactory = await this.sendMailModelSyncFactory(mailboxDetail, mailboxProperties);
		const showProgress = (p) => showProgressDialog("pleaseWait_msg", p);
		return await makeCalendarEventModel(editMode, event, await this.recipientsModel(), await this.calendarModel(), this.logins, mailboxDetail, mailboxProperties, sendMailModelFactory, calendarNotificationSender, this.entityClient, responseTo, getTimeZone$1(), showProgress);
	}
	async recipientsSearchModel() {
		const { RecipientsSearchModel } = await import("./RecipientsSearchModel-chunk.js");
		const suggestionsProvider = await this.contactSuggestionProvider();
		return new RecipientsSearchModel(await this.recipientsModel(), this.contactModel, suggestionsProvider, this.entityClient);
	}
	async contactSuggestionProvider() {
		if (isApp()) {
			const { MobileContactSuggestionProvider } = await import("./MobileContactSuggestionProvider-chunk.js");
			return new MobileContactSuggestionProvider(this.mobileContactsFacade);
		} else return { async getContactSuggestions(_query) {
			return [];
		} };
	}
	get deviceConfig() {
		return deviceConfig;
	}
	get native() {
		return this.getNativeInterface("native");
	}
	get fileApp() {
		return this.getNativeInterface("fileApp");
	}
	get pushService() {
		return this.getNativeInterface("pushService");
	}
	get commonSystemFacade() {
		return this.getNativeInterface("commonSystemFacade");
	}
	get themeFacade() {
		return this.getNativeInterface("themeFacade");
	}
	get externalCalendarFacade() {
		return this.getNativeInterface("externalCalendarFacade");
	}
	get systemFacade() {
		return this.getNativeInterface("mobileSystemFacade");
	}
	get mobileContactsFacade() {
		return this.getNativeInterface("mobileContactsFacade");
	}
	get nativeCredentialsFacade() {
		return this.getNativeInterface("nativeCredentialsFacade");
	}
	get mobilePaymentsFacade() {
		return this.getNativeInterface("mobilePaymentsFacade");
	}
	async mailAddressTableModelForOwnMailbox() {
		const { MailAddressTableModel } = await import("./MailAddressTableModel2-chunk.js");
		const nameChanger = await this.ownMailAddressNameChanger();
		return new MailAddressTableModel(this.entityClient, this.serviceExecutor, this.mailAddressFacade, this.logins, this.eventController, this.logins.getUserController().userGroupInfo, nameChanger, await this.redraw());
	}
	async mailAddressTableModelForAdmin(mailGroupId, userId, userGroupInfo) {
		const { MailAddressTableModel } = await import("./MailAddressTableModel2-chunk.js");
		const nameChanger = await this.adminNameChanger(mailGroupId, userId);
		return new MailAddressTableModel(this.entityClient, this.serviceExecutor, this.mailAddressFacade, this.logins, this.eventController, userGroupInfo, nameChanger, await this.redraw());
	}
	async ownMailAddressNameChanger() {
		const { OwnMailAddressNameChanger } = await import("./OwnMailAddressNameChanger-chunk.js");
		return new OwnMailAddressNameChanger(this.mailboxModel, this.entityClient);
	}
	async adminNameChanger(mailGroupId, userId) {
		const { AnotherUserMailAddressNameChanger } = await import("./AnotherUserMailAddressNameChanger-chunk.js");
		return new AnotherUserMailAddressNameChanger(this.mailAddressFacade, mailGroupId, userId);
	}
	async drawerAttrsFactory() {
		return () => ({
			logins: this.logins,
			newsModel: this.newsModel,
			desktopSystemFacade: this.desktopSystemFacade
		});
	}
	domainConfigProvider() {
		return new DomainConfigProvider();
	}
	async credentialsRemovalHandler() {
		const { NoopCredentialRemovalHandler, AppsCredentialRemovalHandler } = await import("./CredentialRemovalHandler-chunk.js");
		return isBrowser() ? new NoopCredentialRemovalHandler() : new AppsCredentialRemovalHandler(this.pushService, this.configFacade, async () => {
			noOp();
		});
	}
	async loginViewModelFactory() {
		const { LoginViewModel } = await import("./LoginViewModel-chunk.js");
		const credentialsRemovalHandler = await calendarLocator.credentialsRemovalHandler();
		const { MobileAppLock, NoOpAppLock } = await import("./AppLock-chunk.js");
		const appLock = isApp() ? new MobileAppLock(assertNotNull(this.nativeInterfaces).mobileSystemFacade, assertNotNull(this.nativeInterfaces).nativeCredentialsFacade) : new NoOpAppLock();
		return () => {
			const domainConfig = isBrowser() ? calendarLocator.domainConfigProvider().getDomainConfigForHostname(location.hostname, location.protocol, location.port) : calendarLocator.domainConfigProvider().getCurrentDomainConfig();
			return new LoginViewModel(calendarLocator.logins, calendarLocator.credentialsProvider, calendarLocator.secondFactorHandler, deviceConfig, domainConfig, credentialsRemovalHandler, isBrowser() ? null : this.pushService, appLock);
		};
	}
	getNativeInterface(name) {
		if (!this.nativeInterfaces) throw new ProgrammingError(`Tried to use ${name} in web`);
		return this.nativeInterfaces[name];
	}
	_workerDeferred;
	_entropyCollector;
	_deferredInitialized = defer();
	get initialized() {
		return this._deferredInitialized.promise;
	}
	constructor() {
		this._workerDeferred = defer();
	}
	async init() {
		this.worker = bootstrapWorker(this);
		await this._createInstances();
		this._entropyCollector = new EntropyCollector(this.entropyFacade, await this.scheduler(), window);
		this._entropyCollector.start();
		this._deferredInitialized.resolve();
	}
	async _createInstances() {
		const { loginFacade, customerFacade, giftCardFacade, groupManagementFacade, configFacade, calendarFacade, mailFacade, shareFacade, counterFacade, bookingFacade, mailAddressFacade, blobFacade, userManagementFacade, recoverCodeFacade, restInterface, serviceExecutor, cryptoFacade, cacheStorage, random, eventBus, entropyFacade, workerFacade, sqlCipherFacade, contactFacade } = this.worker.getWorkerInterface();
		this.loginFacade = loginFacade;
		this.customerFacade = customerFacade;
		this.giftCardFacade = giftCardFacade;
		this.groupManagementFacade = groupManagementFacade;
		this.configFacade = configFacade;
		this.calendarFacade = calendarFacade;
		this.mailFacade = mailFacade;
		this.shareFacade = shareFacade;
		this.counterFacade = counterFacade;
		this.bookingFacade = bookingFacade;
		this.mailAddressFacade = mailAddressFacade;
		this.blobFacade = blobFacade;
		this.userManagementFacade = userManagementFacade;
		this.recoverCodeFacade = recoverCodeFacade;
		this.contactFacade = contactFacade;
		this.serviceExecutor = serviceExecutor;
		this.sqlCipherFacade = sqlCipherFacade;
		this.logins = new LoginController(this.loginFacade, async () => this.loginListener, () => this.worker.reset());
		this.logins.init();
		this.eventController = new EventController(calendarLocator.logins);
		this.progressTracker = new ProgressTracker();
		this.search = new CalendarSearchModel(() => this.calendarEventsRepository());
		this.entityClient = new EntityClient(restInterface);
		this.cryptoFacade = cryptoFacade;
		this.cacheStorage = cacheStorage;
		this.entropyFacade = entropyFacade;
		this.workerFacade = workerFacade;
		this.connectivityModel = new WebsocketConnectivityModel(eventBus);
		this.mailboxModel = new MailboxModel(this.eventController, this.entityClient, this.logins);
		this.operationProgressTracker = new OperationProgressTracker();
		this.infoMessageHandler = new InfoMessageHandler((state) => {
			noOp();
		});
		this.usageTestModel = new UsageTestModel({
			[StorageBehavior.Persist]: deviceConfig,
			[StorageBehavior.Ephemeral]: new EphemeralUsageTestStorage()
		}, {
			now() {
				return Date.now();
			},
			timeZone() {
				throw new Error("Not implemented by this provider");
			}
		}, this.serviceExecutor, this.entityClient, this.logins, this.eventController, () => this.usageTestController);
		this.usageTestController = new UsageTestController(this.usageTestModel);
		this.Const = Const;
		if (!isBrowser()) {
			const { WebDesktopFacade } = await import("./WebDesktopFacade-chunk.js");
			const { WebMobileFacade } = await import("./WebMobileFacade-chunk.js");
			const { WebCommonNativeFacade } = await import("./WebCommonNativeFacade-chunk.js");
			const { WebInterWindowEventFacade } = await import("./WebInterWindowEventFacade-chunk.js");
			const { WebAuthnFacadeSendDispatcher } = await import("./WebAuthnFacadeSendDispatcher-chunk.js");
			const { createNativeInterfaces, createDesktopInterfaces } = await import("./NativeInterfaceFactory-chunk.js");
			const { OpenCalendarHandler } = await import("./OpenCalendarHandler-chunk.js");
			const openCalendarHandler = new OpenCalendarHandler(this.logins);
			const { OpenSettingsHandler } = await import("./OpenSettingsHandler-chunk.js");
			const openSettingsHandler = new OpenSettingsHandler(this.logins);
			this.webMobileFacade = new WebMobileFacade(this.connectivityModel, CALENDAR_PREFIX);
			this.nativeInterfaces = createNativeInterfaces(this.webMobileFacade, new WebDesktopFacade(this.logins, async () => this.native), new WebInterWindowEventFacade(this.logins, windowFacade, deviceConfig), new WebCommonNativeFacade(this.logins, this.mailboxModel, this.usageTestController, async () => this.fileApp, async () => this.pushService, this.handleFileImport.bind(this), async (_userId, _address, _requestedPath) => {}, (userId) => openCalendarHandler.openCalendar(userId), AppType.Calendar, (path) => openSettingsHandler.openSettings(path)), cryptoFacade, calendarFacade, this.entityClient, this.logins, AppType.Calendar);
			if (isElectronClient()) {
				const desktopInterfaces = createDesktopInterfaces(this.native);
				this.searchTextFacade = desktopInterfaces.searchTextFacade;
				this.interWindowEventSender = desktopInterfaces.interWindowEventSender;
				this.webAuthn = new WebauthnClient(new WebAuthnFacadeSendDispatcher(this.native), this.domainConfigProvider(), isApp());
				if (isDesktop()) {
					this.desktopSettingsFacade = desktopInterfaces.desktopSettingsFacade;
					this.desktopSystemFacade = desktopInterfaces.desktopSystemFacade;
				}
			} else if (isAndroidApp() || isIOSApp()) {
				const { SystemPermissionHandler } = await import("./SystemPermissionHandler-chunk.js");
				this.systemPermissionHandler = new SystemPermissionHandler(this.systemFacade);
				this.webAuthn = new WebauthnClient(new WebAuthnFacadeSendDispatcher(this.native), this.domainConfigProvider(), isApp());
			}
		}
		if (this.webAuthn == null) this.webAuthn = new WebauthnClient(new BrowserWebauthn(navigator.credentials, this.domainConfigProvider().getCurrentDomainConfig()), this.domainConfigProvider(), isApp());
		this.secondFactorHandler = new SecondFactorHandler(this.eventController, this.entityClient, this.webAuthn, this.loginFacade, this.domainConfigProvider());
		this.credentialsProvider = await this.createCredentialsProvider();
		this.loginListener = new PageContextLoginListener(this.secondFactorHandler, this.credentialsProvider);
		this.random = random;
		this.newsModel = new NewsModel(this.serviceExecutor, deviceConfig, async (name) => {
			switch (name) {
				case "usageOptIn": {
					const { UsageOptInNews } = await import("./UsageOptInNews-chunk.js");
					return new UsageOptInNews(this.newsModel, this.usageTestModel);
				}
				case "recoveryCode": {
					const { RecoveryCodeNews } = await import("./RecoveryCodeNews-chunk.js");
					return new RecoveryCodeNews(this.newsModel, this.logins.getUserController(), this.recoverCodeFacade);
				}
				case "pinBiometrics": {
					const { PinBiometricsNews } = await import("./PinBiometricsNews-chunk.js");
					return new PinBiometricsNews(this.newsModel, this.credentialsProvider, this.logins.getUserController().userId);
				}
				case "referralLink": {
					const { ReferralLinkNews } = await import("./ReferralLinkNews-chunk.js");
					const dateProvider = await this.noZoneDateProvider();
					return new ReferralLinkNews(this.newsModel, dateProvider, this.logins.getUserController());
				}
				case "newPlans": {
					const { NewPlansNews } = await import("./NewPlansNews-chunk.js");
					return new NewPlansNews(this.newsModel, this.logins.getUserController());
				}
				case "newPlansOfferEnding": {
					const { NewPlansOfferEndingNews } = await import("./NewPlansOfferEndingNews-chunk.js");
					return new NewPlansOfferEndingNews(this.newsModel, this.logins.getUserController());
				}
				default:
					console.log(`No implementation for news named '${name}'`);
					return null;
			}
		});
		this.fileController = this.nativeInterfaces == null ? new FileControllerBrowser(blobFacade, guiDownload) : new FileControllerNative(blobFacade, guiDownload, this.nativeInterfaces.fileApp);
		const { ContactModel } = await import("./ContactModel-chunk.js");
		this.contactModel = new ContactModel(this.entityClient, this.logins, this.eventController, () => {
			throw new DbError("Calendar cannot search for contacts through db");
		});
		const sanitizerStub = {
			sanitizeHTML: () => {
				return {
					html: "",
					blockedExternalContent: 0,
					inlineImageCids: [],
					links: []
				};
			},
			sanitizeSVG(svg, configExtra) {
				throw new Error("stub!");
			},
			sanitizeFragment(html, configExtra) {
				throw new Error("stub!");
			}
		};
		const selectedThemeFacade = isApp() || isDesktop() ? new NativeThemeFacade(new LazyLoaded(async () => calendarLocator.themeFacade)) : new WebThemeFacade(deviceConfig);
		const lazySanitizer = isTest() ? () => Promise.resolve(sanitizerStub) : () => import("./HtmlSanitizer2-chunk.js").then(({ htmlSanitizer }) => htmlSanitizer);
		this.themeController = new ThemeController(theme, selectedThemeFacade, lazySanitizer, AppType.Calendar);
		if (selectedThemeFacade instanceof WebThemeFacade) selectedThemeFacade.addDarkListener(() => calendarLocator.themeController.reloadTheme());
	}
	async handleFileImport(filesUris) {
		const files = await this.fileApp.getFilesMetaData(filesUris);
		const areAllICSFiles = files.every((file) => file.mimeType === CALENDAR_MIME_TYPE);
		if (areAllICSFiles) {
			const { importCalendarFile, parseCalendarFile } = await import("./CalendarImporter2-chunk.js");
			let parsedEvents = [];
			for (const fileRef of files) {
				const dataFile = await this.fileApp.readDataFile(fileRef.location);
				if (dataFile == null) continue;
				const data = parseCalendarFile(dataFile);
				parsedEvents.push(...data.contents);
			}
			await importCalendarFile(await this.calendarModel(), this.logins.getUserController(), parsedEvents);
		}
	}
	calendarModel = lazyMemoized(async () => {
		const { DefaultDateProvider } = await import("./CalendarUtils2-chunk.js");
		const { CalendarModel } = await import("./CalendarModel2-chunk.js");
		const timeZone = new DefaultDateProvider().timeZone();
		return new CalendarModel(notifications, this.alarmScheduler, this.eventController, this.serviceExecutor, this.logins, this.progressTracker, this.entityClient, this.mailboxModel, this.calendarFacade, this.fileController, timeZone, !isBrowser() ? this.externalCalendarFacade : null, deviceConfig, !isBrowser() ? this.pushService : null);
	});
	calendarInviteHandler = lazyMemoized(async () => {
		const { CalendarInviteHandler } = await import("./CalendarInvites2-chunk.js");
		const { calendarNotificationSender } = await import("./CalendarNotificationSender-chunk.js");
		return new CalendarInviteHandler(this.mailboxModel, await this.calendarModel(), this.logins, calendarNotificationSender, (...arg) => this.sendMailModel(...arg));
	});
	alarmScheduler = lazyMemoized(async () => {
		const { AlarmScheduler } = await import("./AlarmScheduler-chunk.js");
		const { DefaultDateProvider } = await import("./CalendarUtils2-chunk.js");
		const dateProvider = new DefaultDateProvider();
		return new AlarmScheduler(dateProvider, await this.scheduler());
	});
	async scheduler() {
		const dateProvider = await this.noZoneDateProvider();
		return new SchedulerImpl(dateProvider, window, window);
	}
	async calendarEventPreviewModel(selectedEvent, calendars) {
		const { findAttendeeInAddresses } = await import("./CommonCalendarUtils2-chunk.js");
		const { getEventType } = await import("./CalendarGuiUtils2-chunk.js");
		const { CalendarEventPreviewViewModel } = await import("./CalendarEventPreviewViewModel-chunk.js");
		const mailboxDetails = await this.mailboxModel.getUserMailboxDetails();
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot);
		const userController = this.logins.getUserController();
		const customer = await userController.loadCustomer();
		const ownMailAddresses = getEnabledMailAddressesWithUser(mailboxDetails, userController.userGroupInfo);
		const ownAttendee = findAttendeeInAddresses(selectedEvent.attendees, ownMailAddresses);
		const eventType = getEventType(selectedEvent, calendars, ownMailAddresses, userController);
		const hasBusinessFeature = isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled) || await userController.isNewPaidPlan();
		const lazyIndexEntry = async () => selectedEvent.uid != null ? this.calendarFacade.getEventsByUid(selectedEvent.uid) : null;
		const popupModel = new CalendarEventPreviewViewModel(selectedEvent, await this.calendarModel(), eventType, hasBusinessFeature, ownAttendee, lazyIndexEntry, async (mode) => this.calendarEventModel(mode, selectedEvent, mailboxDetails, mailboxProperties, null));
		await popupModel.sanitizeDescription();
		return popupModel;
	}
	async calendarContactPreviewModel(event, contact, canEdit) {
		const { CalendarContactPreviewViewModel } = await import("./CalendarContactPreviewViewModel-chunk.js");
		return new CalendarContactPreviewViewModel(event, contact, canEdit);
	}
	postLoginActions = lazyMemoized(async () => {
		const { PostLoginActions } = await import("./PostLoginActions-chunk.js");
		return new PostLoginActions(this.credentialsProvider, this.secondFactorHandler, this.connectivityModel, this.logins, await this.noZoneDateProvider(), this.entityClient, this.userManagementFacade, this.customerFacade, this.themeController, () => this.showSetupWizard(), () => this.handleExternalSync(), () => this.setUpClientOnlyCalendars());
	});
	showSetupWizard = async () => {
		if (isApp()) {
			const { showSetupWizard } = await import("./SetupWizard-chunk.js");
			return showSetupWizard(this.systemPermissionHandler, this.webMobileFacade, null, this.systemFacade, this.credentialsProvider, null, deviceConfig, false);
		}
	};
	async handleExternalSync() {
		const calendarModel = await locator.calendarModel();
		if (isApp() || isDesktop()) {
			calendarModel.syncExternalCalendars().catch(async (e) => {
				showSnackBar({
					message: lang.makeTranslation("exception_msg", e.message),
					button: {
						label: "ok_action",
						click: noOp
					},
					waitingTime: 1e3
				});
			});
			calendarModel.scheduleExternalCalendarSync();
		}
	}
	setUpClientOnlyCalendars() {
		let configs = deviceConfig.getClientOnlyCalendars();
		for (const [id, name] of CLIENT_ONLY_CALENDARS.entries()) {
			const calendarId = `${this.logins.getUserController().userId}#${id}`;
			const config = configs.get(calendarId);
			if (!config) deviceConfig.updateClientOnlyCalendars(calendarId, {
				name: lang.get(name),
				color: DEFAULT_CLIENT_ONLY_CALENDAR_COLORS.get(id)
			});
		}
	}
	credentialFormatMigrator = lazyMemoized(async () => {
		const { CredentialFormatMigrator } = await import("./CredentialFormatMigrator-chunk.js");
		if (isDesktop()) return new CredentialFormatMigrator(deviceConfig, this.nativeCredentialsFacade, null);
else if (isApp()) return new CredentialFormatMigrator(deviceConfig, this.nativeCredentialsFacade, this.systemFacade);
else return new CredentialFormatMigrator(deviceConfig, null, null);
	});
	async changeToBycrypt(passphrase) {
		const currentUser = this.logins.getUserController().user;
		return this.loginFacade.migrateKdfType(KdfType.Bcrypt, passphrase, currentUser);
	}
	/**
	* Factory method for credentials provider that will return an instance injected with the implementations appropriate for the platform.
	*/
	async createCredentialsProvider() {
		const { CredentialsProvider } = await import("./CredentialsProvider2-chunk.js");
		if (isDesktop() || isApp()) return new CredentialsProvider(this.nativeCredentialsFacade, this.sqlCipherFacade, isDesktop() ? this.interWindowEventSender : null);
else {
			const { WebCredentialsFacade } = await import("./WebCredentialsFacade-chunk.js");
			return new CredentialsProvider(new WebCredentialsFacade(deviceConfig), null, null);
		}
	}
};
const calendarLocator = new CalendarLocator();
if (typeof window !== "undefined") window.tutao.locator = calendarLocator;

//#endregion
//#region src/calendar-app/calendar/gui/eventpopup/CalendarContactPopup.ts
var ContactEventPopup = class {
	_shortcuts = [];
	dom = null;
	focusedBeforeShown = null;
	/**
	* @param model
	* @param eventBubbleRect the rect where the event bubble was displayed that was clicked (if any)
	*/
	constructor(model, eventBubbleRect) {
		this.model = model;
		this.eventBubbleRect = eventBubbleRect;
		this.setupShortcuts();
		this.view = this.view.bind(this);
	}
	handleEditButtonClick = async (ev, receiver) => {
		if (client.isCalendarApp()) {
			if (!await Dialog.confirm("openMailApp_msg", "yes_label")) return;
			const query = `contactId=${stringToBase64(this.model.contact._id.join("/"))}`;
			calendarLocator.systemFacade.openMailApp(stringToBase64(query));
			return;
		}
		new ContactEditor(locator.entityClient, this.model.contact, listIdPart(this.model.contact._id), mithril_default.redraw).show();
	};
	view() {
		return mithril_default(".abs.elevated-bg.plr.pb.border-radius.dropdown-shadow.flex.flex-column", {
			style: {
				width: px(Math.min(window.innerWidth - DROPDOWN_MARGIN * 2, 400)),
				opacity: "0",
				margin: "1px"
			},
			oncreate: (vnode) => {
				this.dom = vnode.dom;
				setTimeout(() => {
					showDropdown(this.eventBubbleRect, this.dom, this.dom.offsetHeight, 400);
					const firstButton = vnode.dom.firstElementChild?.firstElementChild;
					firstButton?.focus();
				}, 24);
			}
		}, [mithril_default(".flex.flex-end", [this.renderEditButton(), this.renderCloseButton()]), mithril_default(".flex-grow", [mithril_default(ContactPreviewView, {
			event: this.model.event,
			contact: this.model.contact
		})])]);
	}
	renderEditButton() {
		if (!this.model.canEdit) return null;
		return mithril_default(IconButton, {
			title: "edit_action",
			icon: Icons.ManageContact,
			click: this.handleEditButtonClick
		});
	}
	renderCloseButton() {
		return mithril_default(IconButton, {
			title: "close_alt",
			click: () => this.close(),
			icon: Icons.Cancel
		});
	}
	show() {
		this.focusedBeforeShown = document.activeElement;
		modal.display(this, false);
	}
	close() {
		modal.remove(this);
	}
	backgroundClick(e) {
		modal.remove(this);
	}
	hideAnimation() {
		return Promise.resolve();
	}
	onClose() {
		this.close();
	}
	shortcuts() {
		return this._shortcuts;
	}
	popState(e) {
		modal.remove(this);
		return false;
	}
	callingElement() {
		return this.focusedBeforeShown;
	}
	setupShortcuts() {
		const close = {
			key: Keys.ESC,
			exec: () => this.close(),
			help: "close_alt"
		};
		const edit = {
			key: Keys.E,
			exec: () => this.handleEditButtonClick(new MouseEvent("click", {}), this.dom),
			help: "edit_action"
		};
		this._shortcuts.push(close);
		if (this.model.canEdit) this._shortcuts.push(edit);
	}
};

//#endregion
//#region src/calendar-app/calendar/view/CalendarView.ts
const CalendarViewTypeByValue = reverse(CalendarViewType);
var RenderType = function(RenderType$1) {
	RenderType$1[RenderType$1["Private"] = 0] = "Private";
	RenderType$1[RenderType$1["Shared"] = 1] = "Shared";
	RenderType$1[RenderType$1["External"] = 2] = "External";
	RenderType$1[RenderType$1["ClientOnly"] = 3] = "ClientOnly";
	return RenderType$1;
}(RenderType || {});
var CalendarView = class extends BaseTopLevelView {
	sidebarColumn;
	contentColumn;
	viewSlider;
	currentViewType;
	viewModel;
	htmlSanitizer;
	redrawIntervalId = null;
	redrawTimeoutId = null;
	oncreate;
	onremove;
	constructor({ attrs }) {
		super();
		const userId = locator.logins.getUserController().user._id;
		this.viewModel = attrs.calendarViewModel;
		this.currentViewType = deviceConfig.getDefaultCalendarView(userId) || CalendarViewType.MONTH;
		this.htmlSanitizer = import("./HtmlSanitizer2-chunk.js").then((m) => m.htmlSanitizer);
		this.sidebarColumn = new ViewColumn({ view: () => mithril_default(FolderColumnView, {
			drawer: attrs.drawerAttrs,
			button: styles.isDesktopLayout() ? {
				label: "newEvent_action",
				click: () => this.createNewEventDialog()
			} : null,
			content: [
				styles.isDesktopLayout() ? mithril_default(DaySelectorSidebar, {
					selectedDate: this.viewModel.selectedDate(),
					onDateSelected: (date) => {
						this.setUrl(this.currentViewType, date);
						mithril_default.redraw();
					},
					startOfTheWeekOffset: getStartOfTheWeekOffset(downcast(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek)),
					showDaySelection: this.currentViewType !== CalendarViewType.MONTH && this.currentViewType !== CalendarViewType.WEEK,
					highlightToday: true,
					highlightSelectedWeek: this.currentViewType === CalendarViewType.WEEK,
					hasEventsOn: (date) => this.hasEventsOn(date)
				}) : null,
				mithril_default(SidebarSection, {
					name: "yourCalendars_label",
					button: mithril_default(IconButton, {
						title: "addCalendar_action",
						colors: ButtonColor.Nav,
						click: (isApp() || isDesktop()) && findFirstPrivateCalendar(attrs.calendarViewModel.calendarInfos) ? createDropdown({ lazyButtons: () => [{
							label: "addCalendar_action",
							colors: ButtonColor.Nav,
							click: () => this.onPressedAddCalendar(CalendarType.NORMAL),
							icon: Icons.Add,
							size: ButtonSize.Compact
						}, {
							label: "addCalendarFromURL_action",
							icon: Icons.Link,
							size: ButtonSize.Compact,
							click: () => this.onPressedAddCalendar(CalendarType.URL)
						}] }) : () => this.onPressedAddCalendar(CalendarType.NORMAL),
						icon: Icons.Add,
						size: ButtonSize.Compact
					}),
					hideIfEmpty: true
				}, this.renderCalendars([RenderType.Private, RenderType.ClientOnly])),
				mithril_default(SidebarSection, {
					name: "calendarShared_label",
					hideIfEmpty: true
				}, this.renderCalendars([RenderType.Shared])),
				mithril_default(SidebarSection, {
					name: "calendarSubscriptions_label",
					hideIfEmpty: true
				}, this.renderCalendars([RenderType.External])),
				this.viewModel.calendarInvitations().length > 0 ? mithril_default(SidebarSection, { name: "calendarInvitations_label" }, this.viewModel.calendarInvitations().map((invitation) => mithril_default(GroupInvitationFolderRow, { invitation }))) : null
			],
			ariaLabel: "calendar_label"
		}) }, ColumnType.Foreground, {
			minWidth: size.calendar_first_col_min_width,
			maxWidth: size.first_col_max_width,
			headerCenter: this.currentViewType === CalendarViewType.WEEK ? "month_label" : "calendar_label"
		});
		this.contentColumn = new ViewColumn({ view: () => {
			this.viewModel.loadCalendarColors();
			switch (this.currentViewType) {
				case CalendarViewType.MONTH: return mithril_default(BackgroundColumnLayout, {
					backgroundColor: theme.navigation_bg,
					desktopToolbar: () => this.renderDesktopToolbar(),
					mobileHeader: () => this.renderMobileHeader(attrs.header),
					columnLayout: mithril_default(CalendarMonthView, {
						temporaryEvents: this.viewModel.temporaryEvents,
						eventsForDays: this.viewModel.eventsForDays,
						getEventsOnDaysToRender: this.viewModel.getEventsOnDaysToRender.bind(this.viewModel),
						onEventClicked: (calendarEvent, domEvent) => this.onEventSelected(calendarEvent, domEvent, this.htmlSanitizer),
						onEventKeyDown: this.handleEventKeyDown(),
						onNewEvent: (date) => {
							this.createNewEventDialog(date);
						},
						selectedDate: this.viewModel.selectedDate(),
						onDateSelected: (date, calendarViewType) => {
							this.setUrl(calendarViewType, date, true);
						},
						onChangeMonth: (next) => this.viewPeriod(CalendarViewType.MONTH, next),
						amPmFormat: locator.logins.getUserController().userSettingsGroupRoot.timeFormat === TimeFormat.TWELVE_HOURS,
						startOfTheWeek: downcast(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
						groupColors: this.viewModel.calendarColors,
						hiddenCalendars: this.viewModel.hiddenCalendars,
						dragHandlerCallbacks: this.viewModel
					}),
					floatingActionButton: this.renderFab.bind(this)
				});
				case CalendarViewType.DAY: return mithril_default(BackgroundColumnLayout, {
					backgroundColor: theme.navigation_bg,
					desktopToolbar: () => this.renderDesktopToolbar(),
					mobileHeader: () => this.renderMobileHeader(attrs.header),
					columnLayout: mithril_default(MultiDayCalendarView, {
						temporaryEvents: this.viewModel.temporaryEvents,
						getEventsOnDays: this.viewModel.getEventsOnDaysToRender.bind(this.viewModel),
						daysInPeriod: 1,
						onEventClicked: (event, domEvent) => this.onEventSelected(event, domEvent, this.htmlSanitizer),
						onEventKeyDown: this.handleEventKeyDown(),
						onNewEvent: (date) => {
							this.createNewEventDialog(date);
						},
						selectedDate: this.viewModel.selectedDate(),
						onDateSelected: (date) => {
							this.setUrl(CalendarViewType.DAY, date);
						},
						groupColors: this.viewModel.calendarColors,
						onChangeViewPeriod: (next) => this.viewPeriod(CalendarViewType.DAY, next),
						startOfTheWeek: downcast(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
						dragHandlerCallbacks: this.viewModel,
						isDaySelectorExpanded: this.viewModel.isDaySelectorExpanded(),
						weekIndicator: calendarWeek(this.viewModel.selectedDate(), this.viewModel.weekStart),
						selectedTime: this.viewModel.selectedTime,
						scrollPosition: this.viewModel.getScrollPosition(),
						onScrollPositionChange: (newPosition) => this.viewModel.setScrollPosition(newPosition),
						onViewChanged: (vnode) => this.viewModel.setViewParameters(vnode.dom)
					}),
					floatingActionButton: this.renderFab.bind(this)
				});
				case CalendarViewType.WEEK: return mithril_default(BackgroundColumnLayout, {
					backgroundColor: theme.navigation_bg,
					desktopToolbar: () => this.renderDesktopToolbar(),
					mobileHeader: () => this.renderMobileHeader(attrs.header),
					columnLayout: mithril_default(MultiDayCalendarView, {
						temporaryEvents: this.viewModel.temporaryEvents,
						getEventsOnDays: this.viewModel.getEventsOnDaysToRender.bind(this.viewModel),
						daysInPeriod: 7,
						onEventClicked: (event, domEvent) => this.onEventSelected(event, domEvent, this.htmlSanitizer),
						onEventKeyDown: this.handleEventKeyDown(),
						onNewEvent: (date) => {
							this.createNewEventDialog(date);
						},
						selectedDate: this.viewModel.selectedDate(),
						onDateSelected: (date, viewType) => {
							this.viewModel.selectedDate(date);
							this.setUrl(viewType ?? CalendarViewType.WEEK, date);
						},
						startOfTheWeek: downcast(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
						groupColors: this.viewModel.calendarColors,
						onChangeViewPeriod: (next) => this.viewPeriod(CalendarViewType.WEEK, next),
						dragHandlerCallbacks: this.viewModel,
						isDaySelectorExpanded: this.viewModel.isDaySelectorExpanded(),
						weekIndicator: calendarWeek(this.viewModel.selectedDate(), this.viewModel.weekStart),
						selectedTime: this.viewModel.selectedTime,
						scrollPosition: this.viewModel.getScrollPosition(),
						onScrollPositionChange: (newPosition) => this.viewModel.setScrollPosition(newPosition),
						onViewChanged: (vnode) => this.viewModel.setViewParameters(vnode.dom)
					}),
					floatingActionButton: this.renderFab.bind(this)
				});
				case CalendarViewType.AGENDA: return mithril_default(BackgroundColumnLayout, {
					backgroundColor: theme.navigation_bg,
					desktopToolbar: () => this.renderDesktopToolbar(),
					mobileHeader: () => this.renderMobileHeader(attrs.header),
					columnLayout: mithril_default(CalendarAgendaView, {
						selectedDate: this.viewModel.selectedDate(),
						selectedTime: this.viewModel.selectedTime,
						eventsForDays: this.viewModel.eventsForDays,
						amPmFormat: shouldDefaultToAmPmTimeFormat(),
						onEventClicked: (event, domEvent) => {
							if (styles.isDesktopLayout()) this.viewModel.updatePreviewedEvent(event);
else this.onEventSelected(event, domEvent, this.htmlSanitizer);
						},
						onEventKeyDown: (event, domEvent) => {
							if (isKeyPressed(domEvent.key, Keys.RETURN, Keys.SPACE) && !domEvent.repeat) if (styles.isDesktopLayout()) this.viewModel.updatePreviewedEvent(event);
else this.showCalendarEventPopupAtEvent(event, domEvent.target, this.htmlSanitizer);
							if (isKeyPressed(domEvent.key, Keys.DELETE) && !domEvent.repeat) this.openDeletePopup(event, domEvent);
						},
						groupColors: this.viewModel.calendarColors,
						hiddenCalendars: this.viewModel.hiddenCalendars,
						startOfTheWeekOffset: getStartOfTheWeekOffsetForUser(locator.logins.getUserController().userSettingsGroupRoot),
						isDaySelectorExpanded: this.viewModel.isDaySelectorExpanded(),
						onDateSelected: (date) => this.setUrl(CalendarViewType.AGENDA, date),
						onShowDate: (date) => this.setUrl(CalendarViewType.DAY, date),
						eventPreviewModel: this.viewModel.eventPreviewModel,
						scrollPosition: this.viewModel.getScrollPosition(),
						onScrollPositionChange: (newPosition) => this.viewModel.setScrollPosition(newPosition),
						onViewChanged: (vnode) => this.viewModel.setViewParameters(vnode.dom),
						onNewEvent: (date) => this.createNewEventDialog(date),
						onEditContact: (contact) => {
							new ContactEditor(locator.entityClient, contact).show();
						},
						onWriteMail: async (recipient) => {
							const { writeMail: writeMail$1 } = await import("./ContactView2-chunk.js");
							writeMail$1(recipient);
						}
					}),
					floatingActionButton: this.renderFab.bind(this)
				});
				default: throw new ProgrammingError(`invalid CalendarViewType: "${this.currentViewType}"`);
			}
		} }, ColumnType.Background, {
			minWidth: size.calendar_first_col_min_width + size.third_col_min_width,
			maxWidth: size.third_col_max_width
		});
		this.viewSlider = new ViewSlider([this.sidebarColumn, this.contentColumn]);
		const shortcuts = this.setupShortcuts();
		const streamListeners = [];
		this.oncreate = () => {
			keyManager.registerShortcuts(shortcuts);
			if (!this.redrawIntervalId && !this.redrawTimeoutId) {
				const timeToNextMinute = (60 - new Date().getSeconds()) * 1e3;
				this.redrawTimeoutId = window.setTimeout(() => {
					this.redrawIntervalId = window.setInterval(mithril_default.redraw, 6e4);
					this.redrawTimeoutId = null;
					mithril_default.redraw();
				}, timeToNextMinute);
			}
			streamListeners.push(this.viewModel.calendarInvitations.map(() => {
				mithril_default.redraw();
			}));
			streamListeners.push(this.viewModel.redraw.map(mithril_default.redraw));
		};
		this.onremove = () => {
			keyManager.unregisterShortcuts(shortcuts);
			if (this.redrawTimeoutId) {
				window.clearTimeout(this.redrawTimeoutId);
				this.redrawTimeoutId = null;
			}
			if (this.redrawIntervalId) {
				window.clearInterval(this.redrawIntervalId);
				this.redrawIntervalId = null;
			}
			for (let listener of streamListeners) listener.end(true);
		};
		deviceConfig.getLastSyncStream().map(redraw);
	}
	renderFab() {
		if (client.isCalendarApp()) return mithril_default(FloatingActionButton, {
			icon: Icons.Add,
			title: "newEvent_action",
			colors: ButtonColor.Fab,
			action: () => this.createNewEventDialog()
		});
		return null;
	}
	renderDesktopToolbar() {
		return mithril_default(CalendarDesktopToolbar, {
			navConfig: calendarNavConfiguration(this.currentViewType, this.viewModel.selectedDate(), this.viewModel.weekStart, "detailed", (viewType, next) => this.viewPeriod(viewType, next)),
			viewType: this.currentViewType,
			onToday: () => {
				this.viewModel.ignoreNextValidTimeSelection = false;
				this.setUrl(mithril_default.route.param("view"), new Date());
			},
			onViewTypeSelected: (viewType) => this.setUrl(viewType, this.viewModel.selectedDate(), false, true)
		});
	}
	renderMobileHeader(header) {
		return mithril_default(CalendarMobileHeader, {
			...header,
			viewType: this.currentViewType,
			viewSlider: this.viewSlider,
			showExpandIcon: !styles.isDesktopLayout() && this.currentViewType !== CalendarViewType.MONTH,
			isDaySelectorExpanded: this.viewModel.isDaySelectorExpanded(),
			navConfiguration: calendarNavConfiguration(this.currentViewType, this.viewModel.selectedDate(), this.viewModel.weekStart, "short", (viewType, next) => this.viewPeriod(viewType, next)),
			onCreateEvent: () => this.createNewEventDialog(),
			onToday: () => {
				this.viewModel.ignoreNextValidTimeSelection = false;
				this.setUrl(mithril_default.route.param("view"), new Date());
			},
			onViewTypeSelected: (viewType) => this.setUrl(viewType, this.viewModel.selectedDate(), false, true),
			onTap: (_event, dom) => {
				if (this.currentViewType !== CalendarViewType.MONTH && styles.isSingleColumnLayout()) {
					this.viewModel.setDaySelectorExpanded(!this.viewModel.isDaySelectorExpanded());
					return;
				}
				if (!styles.isDesktopLayout() && this.currentViewType !== CalendarViewType.MONTH) {
					if (this.viewModel.isDaySelectorExpanded()) this.viewModel.setDaySelectorExpanded(false);
					this.showCalendarPopup(dom);
				}
			}
		});
	}
	setupShortcuts() {
		const getIfNotView = (viewType) => {
			return Array.isArray(viewType) ? () => {
				for (const item of viewType) if (item === this.currentViewType) return false;
				return true;
			} : () => {
				return this.currentViewType !== viewType;
			};
		};
		const generatePeriodShortcut = (key, next) => {
			return {
				key,
				enabled: getIfNotView(CalendarViewType.AGENDA),
				exec: () => this.viewPeriod(this.currentViewType, next),
				help: next ? "viewNextPeriod_action" : "viewPrevPeriod_action"
			};
		};
		return [
			{
				key: Keys.ONE,
				exec: () => this.setUrl(CalendarViewType.WEEK, this.viewModel.selectedDate()),
				help: "switchWeekView_action"
			},
			{
				key: Keys.TWO,
				exec: () => this.setUrl(CalendarViewType.MONTH, this.viewModel.selectedDate()),
				help: "switchMonthView_action"
			},
			{
				key: Keys.THREE,
				exec: () => this.setUrl(CalendarViewType.AGENDA, this.viewModel.selectedDate()),
				help: "switchAgendaView_action"
			},
			{
				key: Keys.T,
				exec: () => this.setUrl(mithril_default.route.param("view"), new Date()),
				help: "viewToday_action"
			},
			generatePeriodShortcut(Keys.J, true),
			generatePeriodShortcut(Keys.K, false),
			generatePeriodShortcut(Keys.RIGHT, true),
			generatePeriodShortcut(Keys.LEFT, false),
			{
				key: Keys.N,
				exec: () => {
					this.createNewEventDialog();
				},
				help: "newEvent_action"
			},
			{
				key: Keys.UP,
				enabled: getIfNotView([CalendarViewType.MONTH, CalendarViewType.AGENDA]),
				exec: () => {
					this.viewModel.scroll(-10);
				},
				help: "scrollUp_action"
			},
			{
				key: Keys.DOWN,
				enabled: getIfNotView([CalendarViewType.MONTH, CalendarViewType.AGENDA]),
				exec: () => {
					this.viewModel.scroll(10);
				},
				help: "scrollDown_action"
			},
			{
				key: Keys.PAGE_UP,
				enabled: getIfNotView(CalendarViewType.MONTH),
				exec: () => {
					const viewSize = this.viewModel.getViewSize();
					if (viewSize) this.viewModel.scroll(-viewSize);
				},
				help: "scrollToPreviousScreen_action"
			},
			{
				key: Keys.PAGE_DOWN,
				enabled: getIfNotView(CalendarViewType.MONTH),
				exec: () => {
					const viewSize = this.viewModel.getViewSize();
					if (viewSize) this.viewModel.scroll(viewSize);
				},
				help: "scrollToNextScreen_action"
			},
			{
				key: Keys.HOME,
				enabled: getIfNotView(CalendarViewType.MONTH),
				exec: () => {
					this.viewModel.setScrollPosition(0);
				},
				help: "scrollToTop_action"
			},
			{
				key: Keys.END,
				enabled: getIfNotView(CalendarViewType.MONTH),
				exec: () => {
					this.viewModel.setScrollPosition(this.viewModel.getScrollMaximum() ?? 9001);
				},
				help: "scrollToBottom_action"
			}
		];
	}
	async createNewEventDialog(date = null) {
		const dateToUse = date ?? setNextHalfHour(new Date(this.viewModel.selectedDate()));
		let calendarInfos = this.viewModel.getCalendarInfosCreateIfNeeded();
		if (calendarInfos instanceof Promise) await showProgressDialog("pleaseWait_msg", calendarInfos);
		const mailboxDetails = await locator.mailboxModel.getUserMailboxDetails();
		const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot);
		const model = await locator.calendarEventModel(CalendarOperation.Create, getEventWithDefaultTimes(dateToUse), mailboxDetails, mailboxProperties, null);
		if (model) {
			const eventEditor = new EventEditorDialog();
			await eventEditor.showNewCalendarEventEditDialog(model);
		}
	}
	viewPeriod(viewType, next) {
		let duration;
		let unit;
		switch (viewType) {
			case CalendarViewType.MONTH:
				duration = { month: 1 };
				unit = "month";
				break;
			case CalendarViewType.WEEK:
				duration = { week: 1 };
				unit = "week";
				break;
			case CalendarViewType.DAY:
				duration = { day: 1 };
				unit = "day";
				break;
			case CalendarViewType.AGENDA:
				duration = styles.isDesktopLayout() ? { day: 1 } : {
					week: this.viewModel.isDaySelectorExpanded() ? 0 : 1,
					month: this.viewModel.isDaySelectorExpanded() ? 1 : 0
				};
				unit = "day";
				break;
			default: throw new ProgrammingError("Invalid CalendarViewType: " + viewType);
		}
		const dateTime = DateTime.fromJSDate(this.viewModel.selectedDate());
		const newDate = next ? dateTime.plus(duration).startOf(unit).toJSDate() : dateTime.minus(duration).startOf(unit).toJSDate();
		this.viewModel.selectedDate(newDate);
		this.viewModel.ignoreNextValidTimeSelection = true;
		this.setUrl(viewType, newDate, false);
		mithril_default.redraw();
	}
	onPressedAddCalendar(calendarType) {
		const userController = locator.logins.getUserController();
		if (userController.isFreeAccount()) {
			showNotAvailableForFreeDialog();
			return;
		}
		if (calendarType === CalendarType.URL) userController.isNewPaidPlan().then((isNewPaidPlan) => {
			if (isNewPaidPlan) this.showCreateCalendarDialog(calendarType);
else showPlanUpgradeRequiredDialog(NewPaidPlans);
		});
else this.showCreateCalendarDialog(calendarType);
	}
	showCreateCalendarDialog(calendarType) {
		const createNormalCalendar = async (dialog, properties, calendarModel) => {
			await calendarModel.createCalendar(properties.name, properties.color, properties.alarms, null);
			dialog.close();
		};
		const createExternalCalendar = async (dialog, properties, calendarModel) => {
			const iCalStr = await handleUrlSubscription(calendarModel, properties.sourceUrl);
			if (iCalStr instanceof Error) throw iCalStr;
			let events = [];
			try {
				events = parseCalendarStringData(iCalStr, getTimeZone()).contents;
			} catch (e) {
				await Dialog.message("invalidICal_error", e.message);
				return;
			}
			const calendarGroup = await calendarModel.createCalendar(getExternalCalendarName(iCalStr), properties.color, [], properties.sourceUrl);
			const calendarGroupRoot = await locator.entityClient.load(CalendarGroupRootTypeRef, calendarGroup._id);
			deviceConfig.updateLastSync(calendarGroup._id);
			await handleCalendarImport(calendarGroupRoot, events, CalendarType.URL);
			dialog.close();
		};
		switch (calendarType) {
			case CalendarType.NORMAL:
				showCreateEditCalendarDialog({
					calendarType,
					titleTextId: "add_action",
					shared: false,
					okAction: createNormalCalendar,
					okTextId: "save_action",
					calendarModel: this.viewModel.getCalendarModel()
				});
				break;
			case CalendarType.URL:
				showCreateEditCalendarDialog({
					calendarType,
					titleTextId: "newCalendarSubscriptionsDialog_title",
					shared: false,
					okAction: createExternalCalendar,
					okTextId: "subscribe_action",
					warningMessage: () => mithril_default(".smaller.content-fg", lang.get("externalCalendarInfo_msg")),
					calendarModel: this.viewModel.getCalendarModel()
				});
				break;
		}
	}
	renderCalendars(renderTypes) {
		const includeLocalCalendars = renderTypes.includes(RenderType.ClientOnly);
		const toggleHidden = (viewModel, groupRootId) => {
			const newHiddenCalendars = new Set(viewModel.hiddenCalendars);
			if (viewModel.hiddenCalendars.has(groupRootId)) newHiddenCalendars.delete(groupRootId);
else newHiddenCalendars.add(groupRootId);
			viewModel.setHiddenCalendars(newHiddenCalendars);
		};
		const calendarInfos = [...this.viewModel.calendarInfos, ...includeLocalCalendars ? this.viewModel.clientOnlyCalendars : []];
		const filteredCalendarInfos = calendarInfos.filter(([_, calendarInfo]) => {
			/**
			* Dinamically filter calendarInfoList according to the renderTypes
			*/
			const conditions = [];
			for (const renderType of renderTypes) switch (renderType) {
				case RenderType.ClientOnly:
					conditions.push((calendarInfo$1) => isClientOnlyCalendar(calendarInfo$1.group._id));
					break;
				case RenderType.Private:
					conditions.push((calendarInfo$1) => calendarInfo$1.userIsOwner && !calendarInfo$1.isExternal && !isClientOnlyCalendar(calendarInfo$1.group._id));
					break;
				case RenderType.Shared:
					conditions.push((calendarInfo$1) => !calendarInfo$1.userIsOwner);
					break;
				case RenderType.External:
					conditions.push((calendarInfo$1) => calendarInfo$1.userIsOwner && calendarInfo$1.isExternal);
					break;
			}
			return conditions.reduce((result, condition) => result || condition(calendarInfo), false);
		});
		return filteredCalendarInfos.map(([_, calendarInfo]) => {
			return this.renderCalendarItem(calendarInfo, calendarInfo.shared, toggleHidden, this.viewModel.hiddenCalendars.has(calendarInfo.group._id));
		});
	}
	renderCalendarItem(calendarInfo, shared, toggleHidden, isHidden) {
		const { userSettingsGroupRoot } = locator.logins.getUserController();
		const existingGroupSettings = userSettingsGroupRoot.groupSettings.find((gc) => gc.group === calendarInfo.groupInfo.group) ?? null;
		const groupRootId = calendarInfo.groupRoot._id;
		let colorValue = "#" + (existingGroupSettings ? existingGroupSettings.color : defaultCalendarColor);
		let groupName = getSharedGroupName(calendarInfo.groupInfo, locator.logins.getUserController(), shared);
		if (isClientOnlyCalendar(calendarInfo.group._id)) {
			const clientOnlyId = calendarInfo.group._id.match(/#(.*)/)?.[1];
			const clientOnlyCalendarConfig = deviceConfig.getClientOnlyCalendars().get(calendarInfo.group._id);
			colorValue = "#" + (clientOnlyCalendarConfig?.color ?? DEFAULT_CLIENT_ONLY_CALENDAR_COLORS.get(clientOnlyId));
			groupName = clientOnlyCalendarConfig?.name ?? clientOnlyId;
		}
		const lastSyncEntry = deviceConfig.getLastExternalCalendarSync().get(calendarInfo.group._id);
		const lastSyncDate = lastSyncEntry?.lastSuccessfulSync ? new Date(lastSyncEntry.lastSuccessfulSync) : null;
		const lastSyncStr = lastSyncDate ? lang.get("lastSync_label", { "{date}": `${formatDate(lastSyncDate)} at ${formatTime(lastSyncDate)}` }) : lang.get("iCalNotSync_msg");
		const handleToggleCalendar = () => {
			if (!isClientOnlyCalendar(groupRootId) || this.viewModel.isNewPaidPlan) toggleHidden(this.viewModel, groupRootId);
else showPlanUpgradeRequiredDialog(NewPaidPlans);
		};
		return mithril_default(".folder-row.flex-start.plr-button", [
			mithril_default(".flex.flex-grow.center-vertically.button-height", [mithril_default(".calendar-checkbox", {
				role: "checkbox",
				title: groupName,
				tabindex: TabIndex.Default,
				"aria-checked": (!isHidden).toString(),
				"aria-label": groupName,
				onclick: handleToggleCalendar,
				onkeydown: (e) => {
					if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
						toggleHidden(this.viewModel, groupRootId);
						e.preventDefault();
					}
				},
				style: {
					"border-color": colorValue,
					background: isHidden ? "" : colorValue,
					transition: "all 0.3s",
					cursor: "pointer",
					marginLeft: px(size.hpad_button)
				}
			}), mithril_default(".pl-m.b.flex-grow.text-ellipsis", { style: { width: 0 } }, groupName)]),
			hasSourceUrl(existingGroupSettings) && lastSyncEntry?.lastSyncStatus === SyncStatus.Failed ? mithril_default(Icon, {
				title: lastSyncStr,
				icon: Icons.SyncProblem,
				size: IconSize.Medium,
				class: "pr-s",
				style: { fill: theme.content_button }
			}) : null,
			this.createCalendarActionDropdown(calendarInfo, colorValue, existingGroupSettings, userSettingsGroupRoot, shared)
		]);
	}
	createCalendarActionDropdown(calendarInfo, colorValue, existingGroupSettings, userSettingsGroupRoot, sharedCalendar) {
		const { group, groupInfo, groupRoot, isExternal } = calendarInfo;
		const user = locator.logins.getUserController().user;
		const isClientOnly = isClientOnlyCalendar(calendarInfo.group._id);
		return mithril_default(IconButton, {
			title: "more_label",
			colors: ButtonColor.Nav,
			icon: Icons.More,
			size: ButtonSize.Compact,
			click: createDropdown({ lazyButtons: () => [
				{
					label: "edit_action",
					icon: Icons.Edit,
					size: ButtonSize.Compact,
					click: () => this.onPressedEditCalendar(groupInfo, colorValue, existingGroupSettings, userSettingsGroupRoot, sharedCalendar)
				},
				!isExternal && !isClientOnly ? {
					label: "sharing_label",
					icon: Icons.ContactImport,
					click: () => {
						if (locator.logins.getUserController().isFreeAccount()) showNotAvailableForFreeDialog();
else showGroupSharingDialog(groupInfo, sharedCalendar);
					}
				} : null,
				this.allowCalendarImport(group, user, existingGroupSettings) ? {
					label: "import_action",
					icon: Icons.Import,
					click: () => handleCalendarImport(groupRoot)
				} : null,
				!isApp() && group.type === GroupType.Calendar && hasCapabilityOnGroup(user, group, ShareCapability.Read) && !isClientOnly ? {
					label: "export_action",
					icon: Icons.Export,
					click: () => {
						const alarmInfoList = user.alarmInfoList;
						if (alarmInfoList) exportCalendar(getSharedGroupName(groupInfo, locator.logins.getUserController(), sharedCalendar), groupRoot, alarmInfoList.alarms, new Date(), getTimeZone());
					}
				} : null,
				(isApp() || isDesktop()) && isExternal ? {
					label: lang.makeTranslation("sync_action", "Sync"),
					icon: Icons.Sync,
					size: ButtonSize.Compact,
					click: () => {
						this.viewModel.forceSyncExternal(existingGroupSettings, true)?.catch(async (e) => {
							await Dialog.message(lang.makeTranslation("confirm_msg", e.message));
						});
					}
				} : null,
				calendarInfo.userIsOwner && !isClientOnly ? {
					label: isExternal ? "unsubscribe_action" : "delete_action",
					icon: Icons.Trash,
					click: () => this.confirmDeleteCalendar(calendarInfo)
				} : null
			] })
		});
	}
	allowCalendarImport(group, user, groupSettings) {
		return group.type === GroupType.Calendar && hasCapabilityOnGroup(user, group, ShareCapability.Write) && !hasSourceUrl(groupSettings) && !isClientOnlyCalendar(group._id);
	}
	confirmDeleteCalendar(calendarInfo) {
		const calendarName = getSharedGroupName(calendarInfo.groupInfo, locator.logins.getUserController(), false);
		loadGroupMembers(calendarInfo.group, locator.entityClient).then((members) => {
			const ownerMail = locator.logins.getUserController().userGroupInfo.mailAddress;
			const otherMembers = members.filter((member) => member.info.mailAddress !== ownerMail);
			Dialog.confirm(lang.makeTranslation("confirm_msg", (otherMembers.length > 0 ? lang.get("deleteSharedCalendarConfirm_msg", { "{calendar}": calendarName }) + " " : "") + lang.get("deleteCalendarConfirm_msg", { "{calendar}": calendarName }))).then((confirmed) => {
				if (confirmed) this.viewModel.deleteCalendar(calendarInfo).catch(ofClass(NotFoundError, () => console.log("Calendar to be deleted was not found.")));
			});
		});
	}
	onPressedEditCalendar(groupInfo, colorValue, existingGroupSettings, userSettingsGroupRoot, shared) {
		if (isClientOnlyCalendar(groupInfo.group) && !this.viewModel.isNewPaidPlan) {
			showPlanUpgradeRequiredDialog(NewPaidPlans);
			return;
		}
		showCreateEditCalendarDialog({
			calendarType: getCalendarType(existingGroupSettings, groupInfo),
			titleTextId: "edit_action",
			shared,
			okAction: (dialog, properties) => this.handleModifiedCalendar(dialog, properties, shared, groupInfo, existingGroupSettings, userSettingsGroupRoot),
			okTextId: "save_action",
			calendarProperties: {
				name: getSharedGroupName(groupInfo, locator.logins.getUserController(), shared),
				color: colorValue.substring(1),
				alarms: existingGroupSettings?.defaultAlarmsList.map((alarm) => parseAlarmInterval(alarm.trigger)) ?? [],
				sourceUrl: existingGroupSettings?.sourceUrl ?? null
			},
			isNewCalendar: false,
			calendarModel: this.viewModel.getCalendarModel()
		});
	}
	handleModifiedCalendar(dialog, properties, shared, groupInfo, existingGroupSettings, userSettingsGroupRoot) {
		const clientOnlyCalendar = isClientOnlyCalendar(groupInfo.group);
		if (!shared && !clientOnlyCalendar) {
			groupInfo.name = properties.name;
			locator.entityClient.update(groupInfo);
		}
		const shouldSyncExternal = !!(existingGroupSettings && hasSourceUrl(existingGroupSettings) && existingGroupSettings.sourceUrl !== properties.sourceUrl);
		const alarms = properties.alarms.map((alarm) => createDefaultAlarmInfo({ trigger: serializeAlarmInterval(alarm) }));
		if (existingGroupSettings) {
			existingGroupSettings.color = properties.color;
			existingGroupSettings.name = shared && properties.name !== groupInfo.name ? properties.name : null;
			existingGroupSettings.defaultAlarmsList = alarms;
			existingGroupSettings.sourceUrl = properties.sourceUrl;
		} else if (clientOnlyCalendar) {
			this.viewModel.handleClientOnlyUpdate(groupInfo, downcast({
				name: properties.name,
				color: properties.color
			}));
			dialog.close();
			return this.viewModel.redraw(undefined);
		} else {
			const newGroupSettings = createGroupSettings({
				group: groupInfo.group,
				color: properties.color,
				name: shared && properties.name !== groupInfo.name ? properties.name : null,
				defaultAlarmsList: alarms,
				sourceUrl: properties.sourceUrl
			});
			userSettingsGroupRoot.groupSettings.push(newGroupSettings);
		}
		locator.entityClient.update(userSettingsGroupRoot).then(() => {
			if (shouldSyncExternal) this.viewModel.forceSyncExternal(existingGroupSettings)?.catch(async (e) => {
				showSnackBar({
					message: lang.makeTranslation("exception_msg", e.message),
					button: {
						label: "ok_action",
						click: noOp
					},
					waitingTime: 500
				});
			});
		});
		dialog.close();
	}
	view({ attrs }) {
		return mithril_default(".main-view", mithril_default(this.viewSlider, {
			header: mithril_default(Header, {
				searchBar: attrs.lazySearchBar,
				...attrs.header
			}),
			bottomNav: attrs.bottomNav?.()
		}));
	}
	onNewUrl(args) {
		if (!args.view) this.setUrl(this.currentViewType, this.viewModel.selectedDate(), true);
else {
			this.currentViewType = CalendarViewTypeByValue[args.view] ? args.view : CalendarViewType.MONTH;
			const urlDateParam = args.date;
			if (urlDateParam) {
				const luxonDate = DateTime.fromISO(urlDateParam);
				let date = new Date();
				if (luxonDate.isValid) date = luxonDate.toJSDate();
				if (this.viewModel.selectedDate().getTime() !== date.getTime()) {
					this.viewModel.selectedDate(date);
					mithril_default.redraw();
				}
				const today = new Date();
				if (isSameDayOfDate(today, date) || args.view === "week" && getWeekNumber(date) === getWeekNumber(today)) {
					const time = Time.fromDate(today);
					this.viewModel.setSelectedTime(time);
				} else this.viewModel.setSelectedTime(undefined);
			}
			deviceConfig.setDefaultCalendarView(locator.logins.getUserController().user._id, this.currentViewType);
		}
	}
	getViewSlider() {
		return this.viewSlider;
	}
	setUrl(view, date, replace = false, resetState = false) {
		const dateString = DateTime.fromJSDate(date).toISODate() ?? DateTime.now().toISODate();
		mithril_default.route.set("/calendar/:view/:date", {
			view,
			date: dateString
		}, {
			replace,
			state: this.buildRouteState(view, resetState, dateString)
		});
	}
	buildRouteState(view, resetState, dateString) {
		const shouldBuild = isApp() && !resetState && view === CalendarViewType.AGENDA;
		if (!shouldBuild) return undefined;
		const returnDate = history.state?.dateString ?? dateString;
		if (mithril_default.route.get().includes(CalendarViewType.MONTH) || mithril_default.route.get().includes(CalendarViewType.AGENDA) && history.state?.origin === CalendarViewType.MONTH) return {
			origin: CalendarViewType.MONTH,
			dateString: returnDate
		};
	}
	async onEventSelected(selectedEvent, domEvent, htmlSanitizerPromise) {
		const domTarget = domEvent.currentTarget;
		if (domTarget == null || !(domTarget instanceof HTMLElement)) return;
		const x = domEvent.clientX;
		const y = domEvent.clientY;
		const rect = {
			bottom: y,
			height: 0,
			width: 0,
			top: y,
			left: x,
			right: x
		};
		await this.showCalendarEventPopup(selectedEvent, rect, htmlSanitizerPromise);
	}
	handleEventKeyDown() {
		return (calendarEvent, domEvent) => {
			if (isKeyPressed(domEvent.key, Keys.RETURN, Keys.SPACE) && !domEvent.repeat) {
				this.showCalendarEventPopupAtEvent(calendarEvent, domEvent.target, this.htmlSanitizer);
				domEvent.stopPropagation();
			}
			if (isKeyPressed(domEvent.key, Keys.DELETE) && !domEvent.repeat) {
				this.openDeletePopup(calendarEvent, domEvent);
				domEvent.stopPropagation();
			}
		};
	}
	openDeletePopup(calendarEvent, domEvent) {
		locator.calendarEventPreviewModel(calendarEvent, this.viewModel.calendarInfos).then((eventPreviewModel) => {
			showDeletePopup(eventPreviewModel, new MouseEvent("click", {}), domEvent.target);
		});
	}
	async showCalendarEventPopup(selectedEvent, eventBubbleRect, htmlSanitizerPromise) {
		let getPreviewModel;
		let popupComponent;
		if (isBirthdayEvent(selectedEvent.uid)) {
			const base64ContactId = last(elementIdPart(selectedEvent._id).split("#"));
			if (!base64ContactId) throw new Error(`Trying to open a birthday ${selectedEvent._id} without a contact id`);
			const contactId = decodeBase64("utf8", base64ContactId).split("/");
			const contact = await locator.entityClient.load(ContactTypeRef, [contactId[0], contactId[1]]);
			if (!contact) throw new NotFoundError(`Could not find contact for this birthday event ${selectedEvent._id}`);
			const popupModel = await locator.calendarContactPreviewModel(selectedEvent, contact, true);
			popupComponent = new ContactEventPopup(popupModel, eventBubbleRect);
		} else {
			const calendars = await this.viewModel.getCalendarInfosCreateIfNeeded();
			getPreviewModel = locator.calendarEventPreviewModel(selectedEvent, calendars);
			const [popupModel, htmlSanitizer] = await Promise.all([getPreviewModel, htmlSanitizerPromise]);
			popupComponent = new CalendarEventPopup(popupModel, eventBubbleRect, htmlSanitizer);
		}
		popupComponent.show();
	}
	async showCalendarEventPopupAtEvent(selectedEvent, target, htmlSanitizerPromise) {
		const targetRect = target.getBoundingClientRect();
		const rect = {
			bottom: targetRect.bottom,
			height: 0,
			width: 0,
			top: targetRect.top,
			left: targetRect.left,
			right: targetRect.right
		};
		await this.showCalendarEventPopup(selectedEvent, rect, htmlSanitizerPromise);
	}
	showCalendarPopup(dom) {
		const elementRect = {
			...dom.getBoundingClientRect(),
			left: size.button_height
		};
		const selector = new DaySelectorPopup(elementRect, {
			selectedDate: getStartOfDay(this.viewModel.selectedDate()),
			onDateSelected: (date) => {
				this.viewModel.selectedDate(date);
				this.setUrl(this.currentViewType, date);
				selector.close();
			},
			startOfTheWeekOffset: getStartOfTheWeekOffset(locator.logins.getUserController().userSettingsGroupRoot.startOfTheWeek),
			highlightToday: true,
			highlightSelectedWeek: this.currentViewType === CalendarViewType.WEEK,
			hasEventsOn: (date) => this.hasEventsOn(date)
		});
		selector.show();
	}
	hasEventsOn(date) {
		return daysHaveEvents(this.viewModel.getEventsOnDaysToRender([date]));
	}
};

//#endregion
export { CalendarView };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FsZW5kYXJWaWV3LWNodW5rLmpzIiwibmFtZXMiOlsidm5vZGU6IFZub2RlPENhbGVuZGFyRXZlbnRCdWJibGVBdHRycz4iLCJlOiBNb3VzZUV2ZW50IiwiZTogS2V5Ym9hcmRFdmVudCIsImNsYXNzZXM6IHN0cmluZyIsInRleHQ6IENoaWxkcmVuIiwibWF4SGVpZ2h0OiBudW1iZXIiLCJkcmFnZ2luZ0FyZWE6IEhUTUxCb2R5RWxlbWVudCIsImV2ZW50RHJhZ0NhbGxiYWNrczogRXZlbnREcmFnSGFuZGxlckNhbGxiYWNrcyIsImNhbGVuZGFyRXZlbnQ6IENhbGVuZGFyRXZlbnQiLCJkYXRlVW5kZXJNb3VzZTogRGF0ZSIsIm1vdXNlUG9zOiBNb3VzZVBvcyIsImtlZXBUaW1lOiBib29sZWFuIiwicG9zOiBNb3VzZVBvcyIsImV2ZW50U3RhcnQ6IERhdGUiLCJkcmFnRGF0YTogRHJhZ0RhdGEiLCJhZGp1c3RlZERhdGVVbmRlck1vdXNlOiBEYXRlIiwidG91Y2hBcmVhOiBIVE1MRWxlbWVudCIsIm9uR2VzdHVyZUNvbXBsZXRlZDogKG5leHQ6IGJvb2xlYW4pID0+IHVua25vd24iLCJ4RGVsdGE6IG51bWJlciIsInlEZWx0YTogbnVtYmVyIiwiZGVsdGE6IHsgeDogbnVtYmVyOyB5OiBudW1iZXIgfSIsIm0iLCJuZXdWbm9kZTogVm5vZGU8Q2FsZW5kYXJNb250aEF0dHJzPiIsIm9sZFZub2RlOiBWbm9kZURPTTxDYWxlbmRhck1vbnRoQXR0cnM+IiwiYXR0cnM6IENhbGVuZGFyTW9udGhBdHRycyIsIm1vbnRoOiBDYWxlbmRhck1vbnRoIiwiY3VycmVudGx5VmlzaWJsZU1vbnRoOiBDYWxlbmRhck1vbnRoIiwiem9uZTogc3RyaW5nIiwibW91c2VFdmVudDogTW91c2VFdmVudCAmIHsgcmVkcmF3PzogYm9vbGVhbiB9IiwicG9zOiBNb3VzZVBvcyIsImRheTogQ2FsZW5kYXJEYXkiLCJ3ZWVrRGF5TnVtYmVyOiBudW1iZXIiLCJmaXJzdFdlZWs6IGJvb2xlYW4iLCJlOiBNb3VzZUV2ZW50Iiwib25EYXRlU2VsZWN0ZWQ6IChkYXRlOiBEYXRlLCBjYWxlbmRhclZpZXdUeXBlVG9TaG93OiBDYWxlbmRhclZpZXdUeXBlKSA9PiB1bmtub3duIiwic2l6ZSIsIndlZWs6IFJlYWRvbmx5QXJyYXk8Q2FsZW5kYXJEYXk+IiwiaXNEaXNhYmxlZDogYm9vbGVhbiIsImV2ZW50OiBDYWxlbmRhckV2ZW50IiwicG9zaXRpb246IFNpbXBsZVBvc1JlY3QiLCJldmVudFN0YXJ0OiBEYXRlIiwiZmlyc3REYXlPZldlZWs6IERhdGUiLCJmaXJzdERheU9mTmV4dFdlZWs6IERhdGUiLCJldmVudEVuZDogRGF0ZSIsImNhbGVuZGFyRGF5V2lkdGg6IG51bWJlciIsImNhbGVuZGFyRGF5SGVpZ2h0OiBudW1iZXIiLCJjb2x1bW5JbmRleDogbnVtYmVyIiwibGVmdDogRGF0ZSIsInJpZ2h0OiBEYXRlIiwiZXZlbnQ6IEtleWJvYXJkRXZlbnQiLCJpc1NlbGVjdGVkOiBib29sZWFuIiwiaXNGb2N1c2VkOiBib29sZWFuIiwidG91Y2hBcmVhOiBIVE1MRWxlbWVudCIsIm9uR2VzdHVyZUNvbXBsZXRlZDogKG5leHQ6IGJvb2xlYW4pID0+IHVua25vd24iLCJ4RGVsdGE6IG51bWJlciIsInlEZWx0YTogbnVtYmVyIiwiZGVsdGE6IHsgeDogbnVtYmVyOyB5OiBudW1iZXIgfSIsInZub2RlOiBWbm9kZTxDYXJvdXNlbEF0dHJzPiIsImlzTmV4dDogYm9vbGVhbiIsInNsaWRlOiBTbGlkZSIsInZub2RlOiBWbm9kZTxEYXlTZWxlY3RvckF0dHJzPiIsImlzTmV4dDogYm9vbGVhbiIsImlzRXhwYW5kZWQ6IGJvb2xlYW4iLCJhdHRyczogRGF5U2VsZWN0b3JBdHRycyIsIndlZWs6IHJlYWRvbmx5IENhbGVuZGFyRGF5W10iLCJtb250aDogQ2FsZW5kYXJNb250aCIsImhpZGRlbjogYm9vbGVhbiIsImNhbGVuZGFyTW9udGg6IENhbGVuZGFyTW9udGgiLCJzaXplIiwid2VlazogUmVhZG9ubHlBcnJheTxDYWxlbmRhckRheT4iLCJoaWdobGlnaHQ6IGJvb2xlYW4iLCJ3aWRlOiBib29sZWFuIiwid2Vla2RheXM6IHJlYWRvbmx5IHN0cmluZ1tdIiwiY3VycmVudE1vbnRoOiBDYWxlbmRhck1vbnRoIiwiZGF0ZTogRGF0ZSIsImZpcnN0RGF5T2ZXZWVrRnJvbU9mZnNldDogbnVtYmVyIiwicGx1c01vbnRoczogbnVtYmVyIiwidm5vZGU6IFZub2RlRE9NIiwiYXR0cnM6IENhbGVuZGFyQWdlbmRhVmlld0F0dHJzIiwiaXNEZXNrdG9wTGF5b3V0OiBib29sZWFuIiwic2VsZWN0ZWREYXRlOiBEYXRlIiwic2VsZWN0ZWREYXRlIiwiaXNOZXh0OiBib29sZWFuIiwiZGF5OiBEYXRlIiwiZTogTW91c2VFdmVudCIsImV2ZW50UHJldmlld01vZGVsOiBDYWxlbmRhclByZXZpZXdNb2RlbHMgfCBudWxsIiwiZXZlbnRzOiByZWFkb25seSBDYWxlbmRhckV2ZW50W10iLCJ6b25lOiBzdHJpbmciLCJldmVudHNOb2RlczogQ2hpbGRbXSIsImRhdGU6IERhdGUiLCJkZWZhdWx0Q2FsZW5kYXJQcm9wZXJ0aWVzOiBDYWxlbmRhclByb3BlcnRpZXMiLCJjYWxlbmRhck1vZGVsOiBDYWxlbmRhck1vZGVsIiwidXJsOiBzdHJpbmciLCJleHRlcm5hbEljYWxTdHI6IHN0cmluZyB8IEVycm9yIiwidXJsU3RyZWFtOiBTdHJlYW08c3RyaW5nPiIsImVycm9yTWVzc2FnZVN0cmVhbTogU3RyZWFtPHN0cmluZz4iLCJpbnB1dEVsZW1lbnQ6IEhUTUxJbnB1dEVsZW1lbnQiLCJuYW1lU3RyZWFtOiBTdHJlYW08c3RyaW5nPiIsImNvbG9yU3RyZWFtOiBTdHJlYW08c3RyaW5nPiIsInNoYXJlZDogYm9vbGVhbiIsImNhbGVuZGFyVHlwZTogQ2FsZW5kYXJUeXBlIiwiYWxhcm1zOiBBbGFybUludGVydmFsW10iLCJjb2xvcjogc3RyaW5nIiwiYWxhcm06IEFsYXJtSW50ZXJ2YWwiLCJhOiBBbGFybUludGVydmFsIiwiZXh0ZXJuYWxDYWxlbmRhclJlc3VsdDogc3RyaW5nIHwgRXJyb3IiLCJkaWFsb2c6IERpYWxvZyIsImRpYWxvZyIsImNhbGVuZGFyRGF5VGltZXM6IEFycmF5PFRpbWU+IiwibW91c2VFdmVudDogTW91c2VFdmVudCIsImU6IE1vdXNlRXZlbnQiLCJhdHRyczogQXR0cnMiLCJldmVudHM6IEFycmF5PENhbGVuZGFyRXZlbnQ+IiwiZXY6IENhbGVuZGFyRXZlbnQiLCJjb2x1bW5JbmRleDogbnVtYmVyIiwiY29sdW1uczogQXJyYXk8QXJyYXk8Q2FsZW5kYXJFdmVudD4+IiwiY29sdW1uV2lkdGg6IG51bWJlciIsIm5vdzogRGF0ZSIsInRpbWU6IFRpbWUiLCJ2bm9kZTogVm5vZGVET008TXVsdGlEYXlDYWxlbmRhclZpZXdBdHRycz4iLCJnZXRFdmVudHNGdW5jdGlvbjogKHJhbmdlOiBEYXRlW10pID0+IEV2ZW50c09uRGF5cyIsImRheXNJblBlcmlvZDogbnVtYmVyIiwic3RhcnRPZlBlcmlvZDogRGF0ZSIsImF0dHJzOiBNdWx0aURheUNhbGVuZGFyVmlld0F0dHJzIiwiaXNEYXlWaWV3OiBib29sZWFuIiwiaXNOZXh0OiBib29sZWFuIiwidGhpc1BlcmlvZDogRXZlbnRzT25EYXlzIiwibWFpblBlcmlvZDogRXZlbnRzT25EYXlzIiwiaXNEZXNrdG9wTGF5b3V0OiBib29sZWFuIiwibW91c2VFdmVudDogRXZlbnRSZWRyYXc8TW91c2VFdmVudD4iLCJldmVudDogRXZlbnQiLCJlOiBNb3VzZUV2ZW50IiwiaG91cnM6IG51bWJlciIsIm1pbnV0ZXM6IG51bWJlciIsInZub2RlOiBWbm9kZURPTSIsImlzU21vb3RoOiBib29sZWFuIiwiZXZlbnQ6IENhbGVuZGFyRXZlbnQiLCJ0aGlzUGFnZUV2ZW50czogRXZlbnRzT25EYXlzIiwiZ3JvdXBDb2xvcnM6IEdyb3VwQ29sb3JzIiwib25FdmVudENsaWNrZWQ6IENhbGVuZGFyRXZlbnRCdWJibGVDbGlja0hhbmRsZXIiLCJvbkV2ZW50S2V5RG93bjogQ2FsZW5kYXJFdmVudEJ1YmJsZUtleURvd25IYW5kbGVyIiwidGVtcG9yYXJ5RXZlbnRzOiBBcnJheTxDYWxlbmRhckV2ZW50PiIsIm1haW5QYWdlRXZlbnRzOiBFdmVudHNPbkRheXMiLCJtb3VzZUV2ZW50OiBNb3VzZUV2ZW50IiwiZGF5UmFuZ2U6IEFycmF5PERhdGU+IiwiZXZlbnRzOiBBcnJheTxDYWxlbmRhckV2ZW50PiIsImRheTogRGF0ZSIsInNob3dUaW1lOiBFdmVudFRleHRUaW1lT3B0aW9uIHwgbnVsbCIsInN0YXJ0c0JlZm9yZTogYm9vbGVhbiIsImVuZHNBZnRlcjogYm9vbGVhbiIsImlzVGVtcG9yYXJ5OiBib29sZWFuIiwib3BhY2l0eSIsImRheXM6IEFycmF5PERhdGU+Iiwid2Vla0luZGljYXRvcjogc3RyaW5nIHwgbnVsbCIsIm9uRGF0ZVNlbGVjdGVkOiAoYXJnMDogRGF0ZSwgYXJnMTogQ2FsZW5kYXJWaWV3VHlwZSkgPT4gdW5rbm93biIsInBvczogTW91c2VQb3MiLCJhdHRyczogQ2FsZW5kYXJNb2JpbGVIZWFkZXJBdHRycyIsImNhbGVuZGFyVmlld1ZhbHVlczogQXJyYXk8eyBuYW1lOiBUcmFuc2xhdGlvbktleTsgdmFsdWU6IENhbGVuZGFyVmlld1R5cGUgfT4iLCJ2bm9kZTogVm5vZGU8SWNvblNlZ21lbnRDb250cm9sQXR0cnM8VD4+IiwiaXRlbTogSWNvblNlZ21lbnRDb250cm9sSXRlbTxUPiIsImF0dHJzOiBJY29uU2VnbWVudENvbnRyb2xBdHRyczxUPiIsImF0dHJzOiBDYWxlbmRhckRlc2t0b3BUb29sYmFyQXR0cnMiLCJjYWxlbmRhclZpZXdWYWx1ZXM6IEFycmF5PHsgaWNvbjogQWxsSWNvbnM7IGxhYmVsOiBNYXliZVRyYW5zbGF0aW9uOyB2YWx1ZTogQ2FsZW5kYXJWaWV3VHlwZSB9PiIsInR5cGU6IENhbGVuZGFyVmlld1R5cGUiLCJ2bm9kZTogVm5vZGU8RGF5U2VsZWN0b3JTaWRlYmFyQXR0cnM+IiwiZGF0ZTogRGF0ZSIsImZvcndhcmQ6IGJvb2xlYW4iLCJyZWN0OiBQb3NSZWN0IiwiYXR0cnM6IERheVNlbGVjdG9yUG9wdXBBdHRycyIsImRhdGU6IERhdGUiLCJmb3J3YXJkOiBib29sZWFuIiwib246IGJvb2xlYW4iLCJlOiBNb3VzZUV2ZW50IiwiZTogRXZlbnQiLCJjbG9zZTogU2hvcnRjdXQiLCJ2bm9kZTogVm5vZGU8Q29udGFjdFByZXZpZXdWaWV3QXR0cnM+IiwiaGVhZGVySWNvbjogQWxsSWNvbnMiLCJjaGlsZHJlbjogQ2hpbGRyZW4iLCJpc0FsaWduZWRMZWZ0PzogYm9vbGVhbiIsImljb246IEFsbEljb25zIiwic3R5bGU6IFJlY29yZDxzdHJpbmcsIGFueT4iLCJjb250YWN0OiBDb250YWN0IiwibWFpbEFkZHJlc3M6IHN0cmluZyIsImFuY2hvckVsZW1lbnQ6IEhUTUxBbmNob3JFbGVtZW50Iiwib25DbGljazogKGU6IGFueSwgZG9tOiBhbnkpID0+IHVua25vd24iLCJ0ZXh0OiBUcmFuc2xhdGlvbktleSIsImNvbG9yczogQnV0dG9uQ29sb3JzIiwiaWNvbj86IENoaWxkcmVuIiwiZmlsbENvbG9yOiBzdHJpbmciLCJ0ZXh0OiBzdHJpbmciLCJlbGVtZW50OiBIVE1MQW5jaG9yRWxlbWVudCIsImV2ZW50OiBNb3VzZUV2ZW50IiwiZG9tOiBIVE1MRWxlbWVudCIsIm1haWxib3hEZXRhaWxzOiBNYWlsYm94RGV0YWlsIiwibWFpbGJveFByb3BlcnRpZXM6IE1haWxib3hQcm9wZXJ0aWVzIiwicmVkcmF3IiwiZ3JvdXBUeXBlOiBUeXBlT2ZHcm91cCIsIm1vZGU6IENhbGVuZGFyT3BlcmF0aW9uIiwiZXZlbnQ6IENhbGVuZGFyRXZlbnQiLCJtYWlsOiBNYWlsIiwiZWRpdE1vZGU6IENhbGVuZGFyT3BlcmF0aW9uIiwiZXZlbnQ6IFBhcnRpYWw8Q2FsZW5kYXJFdmVudD4iLCJtYWlsYm94RGV0YWlsOiBNYWlsYm94RGV0YWlsIiwicmVzcG9uc2VUbzogTWFpbCB8IG51bGwiLCJwOiBQcm9taXNlPFQ+IiwiX3F1ZXJ5OiBzdHJpbmciLCJtYWlsR3JvdXBJZDogSWQiLCJ1c2VySWQ6IElkIiwidXNlckdyb3VwSW5mbzogR3JvdXBJbmZvIiwibmFtZTogVCIsInN0YXRlOiBTZWFyY2hJbmRleFN0YXRlSW5mbyIsIl91c2VySWQ6IHN0cmluZyIsIl9hZGRyZXNzOiBzdHJpbmciLCJfcmVxdWVzdGVkUGF0aDogc3RyaW5nIHwgbnVsbCIsIm5hbWU6IHN0cmluZyIsInNhbml0aXplclN0dWI6IFBhcnRpYWw8SHRtbFNhbml0aXplcj4iLCJmaWxlc1VyaXM6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPiIsInBhcnNlZEV2ZW50czogUGFyc2VkRXZlbnRbXSIsInNlbGVjdGVkRXZlbnQ6IENhbGVuZGFyRXZlbnQiLCJjYWxlbmRhcnM6IFJlYWRvbmx5TWFwPHN0cmluZywgQ2FsZW5kYXJJbmZvPiIsIm93bkF0dGVuZGVlOiBDYWxlbmRhckV2ZW50QXR0ZW5kZWUgfCBudWxsIiwiY29udGFjdDogQ29udGFjdCIsImNhbkVkaXQ6IGJvb2xlYW4iLCJwYXNzcGhyYXNlOiBzdHJpbmciLCJjYWxlbmRhckxvY2F0b3I6IElDYWxlbmRhckxvY2F0b3IiLCJtb2RlbDogQ2FsZW5kYXJDb250YWN0UHJldmlld1ZpZXdNb2RlbCIsImV2ZW50QnViYmxlUmVjdDogUG9zUmVjdCIsImV2OiBNb3VzZUV2ZW50IiwicmVjZWl2ZXI6IEhUTUxFbGVtZW50IiwibSIsImU6IE1vdXNlRXZlbnQiLCJlOiBFdmVudCIsImNsb3NlOiBTaG9ydGN1dCIsImVkaXQ6IFNob3J0Y3V0IiwibmV3UG9zaXRpb246IG51bWJlciIsImRhdGU6IERhdGUiLCJzdHJlYW1MaXN0ZW5lcnM6IFN0cmVhbTx2b2lkPltdIiwibSIsImhlYWRlcjogQXBwSGVhZGVyQXR0cnMiLCJ2aWV3VHlwZTogQ2FsZW5kYXJWaWV3VHlwZSB8IENhbGVuZGFyVmlld1R5cGVbXSIsImtleTogS2V5IiwibmV4dDogYm9vbGVhbiIsImRhdGU6IERhdGUgfCBudWxsIiwidmlld1R5cGU6IENhbGVuZGFyVmlld1R5cGUiLCJ1bml0OiBcImRheVwiIHwgXCJ3ZWVrXCIgfCBcIm1vbnRoXCIiLCJjYWxlbmRhclR5cGU6IENhbGVuZGFyVHlwZSIsImRpYWxvZzogRGlhbG9nIiwicHJvcGVydGllczogQ2FsZW5kYXJQcm9wZXJ0aWVzIiwiY2FsZW5kYXJNb2RlbDogQ2FsZW5kYXJNb2RlbCIsImV2ZW50czogUGFyc2VkRXZlbnRbXSIsInJlbmRlclR5cGVzOiBSZW5kZXJUeXBlW10iLCJ2aWV3TW9kZWw6IENhbGVuZGFyVmlld01vZGVsIiwiZ3JvdXBSb290SWQ6IHN0cmluZyIsImNvbmRpdGlvbnM6IEFycmF5PChjYWxlbmRhckluZm86IENhbGVuZGFySW5mbykgPT4gYm9vbGVhbj4iLCJjYWxlbmRhckluZm86IENhbGVuZGFySW5mbyIsImNhbGVuZGFySW5mbyIsInNoYXJlZDogYm9vbGVhbiIsInRvZ2dsZUhpZGRlbjogKHZpZXdNb2RlbDogQ2FsZW5kYXJWaWV3TW9kZWwsIGdyb3VwUm9vdElkOiBzdHJpbmcpID0+IHZvaWQiLCJpc0hpZGRlbjogYm9vbGVhbiIsImU6IEtleWJvYXJkRXZlbnQiLCJjb2xvclZhbHVlOiBzdHJpbmciLCJleGlzdGluZ0dyb3VwU2V0dGluZ3M6IEdyb3VwU2V0dGluZ3MgfCBudWxsIiwidXNlclNldHRpbmdzR3JvdXBSb290OiBVc2VyU2V0dGluZ3NHcm91cFJvb3QiLCJzaGFyZWRDYWxlbmRhcjogYm9vbGVhbiIsImdyb3VwOiBHcm91cCIsInVzZXI6IFVzZXIiLCJncm91cFNldHRpbmdzOiBHcm91cFNldHRpbmdzIHwgbnVsbCIsImdyb3VwSW5mbzogR3JvdXBJbmZvIiwiYXJnczogUmVjb3JkPHN0cmluZywgYW55PiIsInZpZXc6IHN0cmluZyIsInJlcGxhY2U6IGJvb2xlYW4iLCJyZXNldFN0YXRlOiBib29sZWFuIiwiZGF0ZVN0cmluZzogc3RyaW5nIiwic2VsZWN0ZWRFdmVudDogQ2FsZW5kYXJFdmVudCIsImRvbUV2ZW50OiBNb3VzZU9yUG9pbnRlckV2ZW50IiwiaHRtbFNhbml0aXplclByb21pc2U6IFByb21pc2U8SHRtbFNhbml0aXplcj4iLCJjYWxlbmRhckV2ZW50OiBDYWxlbmRhckV2ZW50IiwiZG9tRXZlbnQ6IEtleWJvYXJkRXZlbnQiLCJldmVudFByZXZpZXdNb2RlbDogQ2FsZW5kYXJFdmVudFByZXZpZXdWaWV3TW9kZWwiLCJldmVudEJ1YmJsZVJlY3Q6IFBvc1JlY3QiLCJnZXRQcmV2aWV3TW9kZWw6IFByb21pc2U8Q2FsZW5kYXJQcmV2aWV3TW9kZWxzPiIsInBvcHVwQ29tcG9uZW50OiBDYWxlbmRhckV2ZW50UG9wdXAgfCBDb250YWN0RXZlbnRQb3B1cCIsInRhcmdldDogSFRNTEVsZW1lbnQiLCJkb206IEhUTUxFbGVtZW50Il0sInNvdXJjZXMiOlsiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci92aWV3L0NhbGVuZGFyRXZlbnRCdWJibGUudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL3ZpZXcvQ29udGludWluZ0NhbGVuZGFyRXZlbnRCdWJibGUudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL3ZpZXcvRXZlbnREcmFnSGFuZGxlci50cyIsIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvUGFnZVZpZXcudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL3ZpZXcvQ2FsZW5kYXJNb250aFZpZXcudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL3ZpZXcvQ2FsZW5kYXJBZ2VuZGFJdGVtVmlldy50cyIsIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvQ2FsZW5kYXJTd2lwZUhhbmRsZXIudHMiLCIuLi9zcmMvY29tbW9uL2d1aS9iYXNlL0Nhcm91c2VsLnRzIiwiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9ndWkvZGF5LXNlbGVjdG9yL0RheVNlbGVjdG9yLnRzIiwiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci92aWV3L0NhbGVuZGFyVGltZUluZGljYXRvci50cyIsIi4uL3NyYy9jYWxlbmRhci1hcHAvY2FsZW5kYXIvdmlldy9DYWxlbmRhckFnZW5kYVZpZXcudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL2d1aS9FZGl0Q2FsZW5kYXJEaWFsb2cudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL3ZpZXcvQ2FsZW5kYXJEYXlFdmVudHNWaWV3LnRzIiwiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci92aWV3L011bHRpRGF5Q2FsZW5kYXJWaWV3LnRzIiwiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci92aWV3L1RvZGF5SWNvbkJ1dHRvbi50cyIsIi4uL3NyYy9jYWxlbmRhci1hcHAvY2FsZW5kYXIvdmlldy9DYWxlbmRhck1vYmlsZUhlYWRlci50cyIsIi4uL3NyYy9jb21tb24vZ3VpL2Jhc2UvSWNvblNlZ21lbnRDb250cm9sLnRzIiwiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci92aWV3L0NhbGVuZGFyRGVza3RvcFRvb2xiYXIudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL2d1aS9kYXktc2VsZWN0b3IvRGF5U2VsZWN0b3JTaWRlYmFyLnRzIiwiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9ndWkvZGF5LXNlbGVjdG9yL0RheVNlbGVjdG9yUG9wdXAudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2d1aS9GbG9hdGluZ0FjdGlvbkJ1dHRvbi50cyIsIi4uL3NyYy9jYWxlbmRhci1hcHAvY2FsZW5kYXIvZ3VpL2V2ZW50cG9wdXAvQ29udGFjdFByZXZpZXdWaWV3LnRzIiwiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhckxvY2F0b3IudHMiLCIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL2d1aS9ldmVudHBvcHVwL0NhbGVuZGFyQ29udGFjdFBvcHVwLnRzIiwiLi4vc3JjL2NhbGVuZGFyLWFwcC9jYWxlbmRhci92aWV3L0NhbGVuZGFyVmlldy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbSwgeyBDaGlsZCwgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemVcIlxuaW1wb3J0IHsgSWNvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvblwiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvSWNvbnNcIlxuaW1wb3J0IHsgQ2xpY2tIYW5kbGVyLCBjb2xvckZvckJnIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9HdWlVdGlsc1wiXG5pbXBvcnQgeyBUYWJJbmRleCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5cbmV4cG9ydCB0eXBlIENhbGVuZGFyRXZlbnRCdWJibGVBdHRycyA9IHtcblx0dGV4dDogc3RyaW5nXG5cdHNlY29uZExpbmVUZXh0Pzogc3RyaW5nIHwgbnVsbFxuXHRjb2xvcjogc3RyaW5nXG5cdGhhc0FsYXJtOiBib29sZWFuXG5cdGlzQWx0ZXJlZDogYm9vbGVhblxuXHRpc0NsaWVudE9ubHk6IGJvb2xlYW5cblx0Y2xpY2s6IENsaWNrSGFuZGxlclxuXHRrZXlEb3duOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIGRvbTogSFRNTEVsZW1lbnQpID0+IHVua25vd25cblx0aGVpZ2h0PzogbnVtYmVyXG5cdG5vQm9yZGVyUmlnaHQ/OiBib29sZWFuXG5cdG5vQm9yZGVyTGVmdD86IGJvb2xlYW5cblx0dmVydGljYWxQYWRkaW5nPzogbnVtYmVyXG5cdGZhZGVJbjogYm9vbGVhblxuXHRvcGFjaXR5OiBudW1iZXJcblx0ZW5hYmxlUG9pbnRlckV2ZW50czogYm9vbGVhblxufVxuY29uc3QgbGluZUhlaWdodCA9IHNpemUuY2FsZW5kYXJfbGluZV9oZWlnaHRcbmNvbnN0IGxpbmVIZWlnaHRQeCA9IHB4KGxpbmVIZWlnaHQpXG5cbmV4cG9ydCBjbGFzcyBDYWxlbmRhckV2ZW50QnViYmxlIGltcGxlbWVudHMgQ29tcG9uZW50PENhbGVuZGFyRXZlbnRCdWJibGVBdHRycz4ge1xuXHRwcml2YXRlIGhhc0ZpbmlzaGVkSW5pdGlhbFJlbmRlcjogYm9vbGVhbiA9IGZhbHNlXG5cblx0b25jcmVhdGUodm5vZGU6IFZub2RlPENhbGVuZGFyRXZlbnRCdWJibGVBdHRycz4pIHtcblx0XHR0aGlzLmhhc0ZpbmlzaGVkSW5pdGlhbFJlbmRlciA9IHRydWVcblx0fVxuXG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxDYWxlbmRhckV2ZW50QnViYmxlQXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdC8vIFRoaXMgaGVscHMgdXMgc3RvcCBmbGlja2VyaW5nIGluIGNlcnRhaW4gY2FzZXMgd2hlcmUgd2Ugd2FudCB0byBkaXNhYmxlIGFuZCByZS1lbmFibGUgZmFkZSBpbiAoaWUuIHdoZW4gZHJhZ2dpbmcgZXZlbnRzKVxuXHRcdC8vIFJlYXBwbHlpbmcgdGhlIGFuaW1hdGlvbiB0byB0aGUgZWxlbWVudCB3aWxsIGNhdXNlIGl0IHRvIHRyaWdnZXIgaW5zdGFudGx5LCBzbyB3ZSBkb24ndCB3YW50IHRvIGRvIHRoYXRcblx0XHRjb25zdCBkb0ZhZGVJbiA9ICF0aGlzLmhhc0ZpbmlzaGVkSW5pdGlhbFJlbmRlciAmJiBhdHRycy5mYWRlSW5cblx0XHRjb25zdCBlbmFibGVQb2ludGVyRXZlbnRzID0gYXR0cnMuZW5hYmxlUG9pbnRlckV2ZW50c1xuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIuY2FsZW5kYXItZXZlbnQuc21hbGwub3ZlcmZsb3ctaGlkZGVuLmZsZXguY3Vyc29yLXBvaW50ZXJcIiArXG5cdFx0XHRcdChkb0ZhZGVJbiA/IFwiLmZhZGUtaW5cIiA6IFwiXCIpICtcblx0XHRcdFx0KGF0dHJzLm5vQm9yZGVyTGVmdCA/IFwiLmV2ZW50LWNvbnRpbnVlcy1sZWZ0XCIgOiBcIlwiKSArXG5cdFx0XHRcdChhdHRycy5ub0JvcmRlclJpZ2h0ID8gXCIuZXZlbnQtY29udGludWVzLXJpZ2h0XCIgOiBcIlwiKSxcblx0XHRcdHtcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRiYWNrZ3JvdW5kOiBcIiNcIiArIGF0dHJzLmNvbG9yLFxuXHRcdFx0XHRcdGNvbG9yOiBjb2xvckZvckJnKFwiI1wiICsgYXR0cnMuY29sb3IpLFxuXHRcdFx0XHRcdG1pbkhlaWdodDogbGluZUhlaWdodFB4LFxuXHRcdFx0XHRcdGhlaWdodDogcHgoYXR0cnMuaGVpZ2h0ID8gTWF0aC5tYXgoYXR0cnMuaGVpZ2h0LCAwKSA6IGxpbmVIZWlnaHQpLFxuXHRcdFx0XHRcdFwicGFkZGluZy10b3BcIjogcHgoYXR0cnMudmVydGljYWxQYWRkaW5nIHx8IDApLFxuXHRcdFx0XHRcdG9wYWNpdHk6IGF0dHJzLm9wYWNpdHksXG5cdFx0XHRcdFx0cG9pbnRlckV2ZW50czogZW5hYmxlUG9pbnRlckV2ZW50cyA/IFwiYXV0b1wiIDogXCJub25lXCIsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRhYkluZGV4OiBlbmFibGVQb2ludGVyRXZlbnRzID8gVGFiSW5kZXguRGVmYXVsdCA6IFRhYkluZGV4LlByb2dyYW1tYXRpYyxcblx0XHRcdFx0b25jbGljazogKGU6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdFx0YXR0cnMuY2xpY2soZSwgZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9ua2V5ZG93bjogKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcblx0XHRcdFx0XHRhdHRycy5rZXlEb3duKGUsIGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50KVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0YXR0cnMuaGFzQWxhcm1cblx0XHRcdFx0XHQ/IG0oSWNvbiwge1xuXHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5Ob3RpZmljYXRpb25zLFxuXHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdGZpbGw6IGNvbG9yRm9yQmcoXCIjXCIgKyBhdHRycy5jb2xvciksXG5cdFx0XHRcdFx0XHRcdFx0XCJwYWRkaW5nLXRvcFwiOiBcIjJweFwiLFxuXHRcdFx0XHRcdFx0XHRcdFwicGFkZGluZy1yaWdodFwiOiBcIjJweFwiLFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRjbGFzczogXCJpY29uLXNtYWxsXCIsXG5cdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0YXR0cnMuaXNBbHRlcmVkXG5cdFx0XHRcdFx0PyBtKEljb24sIHtcblx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuRWRpdCxcblx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRmaWxsOiBjb2xvckZvckJnKFwiI1wiICsgYXR0cnMuY29sb3IpLFxuXHRcdFx0XHRcdFx0XHRcdFwicGFkZGluZy10b3BcIjogXCIycHhcIixcblx0XHRcdFx0XHRcdFx0XHRcInBhZGRpbmctcmlnaHRcIjogXCIycHhcIixcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0Y2xhc3M6IFwiaWNvbi1zbWFsbFwiLFxuXHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdGF0dHJzLmlzQ2xpZW50T25seVxuXHRcdFx0XHRcdD8gbShJY29uLCB7XG5cdFx0XHRcdFx0XHRcdGljb246IEljb25zLkdpZnQsXG5cdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0ZmlsbDogY29sb3JGb3JCZyhcIiNcIiArIGF0dHJzLmNvbG9yKSxcblx0XHRcdFx0XHRcdFx0XHRcInBhZGRpbmctdG9wXCI6IFwiMnB4XCIsXG5cdFx0XHRcdFx0XHRcdFx0XCJwYWRkaW5nLXJpZ2h0XCI6IFwiMnB4XCIsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdGNsYXNzOiBcImljb24tc21hbGxcIixcblx0XHRcdFx0XHQgIH0pXG5cdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLmZsZXguY29sXCIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0Ly8gTGltaXQgdGhlIHdpZHRoIHRvIHRyaWdnZXIgZWxsaXBzaXNcblx0XHRcdFx0XHRcdFx0d2lkdGg6IFwiOTUlXCIsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0Q2FsZW5kYXJFdmVudEJ1YmJsZS5yZW5kZXJDb250ZW50KGF0dHJzKSxcblx0XHRcdFx0KSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgcmVuZGVyQ29udGVudCh7IGhlaWdodDogbWF5YmVIZWlnaHQsIHRleHQsIHNlY29uZExpbmVUZXh0LCBjb2xvciB9OiBDYWxlbmRhckV2ZW50QnViYmxlQXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0Ly8gSWYgdGhlIGJ1YmJsZSBoYXMgMiBvciBtb3JlIGxpbmVzIHdvcnRoIG9mIHZlcnRpY2FsIHNwYWNlLCB0aGVuIHdlIHdpbGwgcmVuZGVyIHRoZSB0ZXh0ICsgdGhlIHNlY29uZExpbmVUZXh0IG9uIHNlcGFyYXRlIGxpbmVzXG5cdFx0Ly8gT3RoZXJ3aXNlIHdlIHdpbGwgY29tYmluZSB0aGVtIG9udG8gYSBzaW5nbGUgbGluZVxuXHRcdGNvbnN0IGhlaWdodCA9IG1heWJlSGVpZ2h0ID8/IGxpbmVIZWlnaHRcblx0XHRjb25zdCBpc011bHRpbGluZSA9IGhlaWdodCA+PSBsaW5lSGVpZ2h0ICogMlxuXG5cdFx0aWYgKGlzTXVsdGlsaW5lKSB7XG5cdFx0XHQvLyBIb3cgbWFueSBsaW5lcyBvZiB0ZXh0IHRoYXQgd2lsbCBmaXQgaW4gdGhlIGJ1YmJsZVxuXHRcdFx0Ly8gd2UgZG9udCB3YW50IGFueSBjdXQgaW4gaGFsZiBsaW5lcyBpbiBjYXNlIHRoZSBidWJibGUgY2Fubm90IGZpdCBhIHdob2xlIG51bWJlciBvZiBsaW5lc1xuXHRcdFx0Y29uc3QgbGluZXNJbkJ1YmJsZSA9IE1hdGguZmxvb3IoaGVpZ2h0IC8gbGluZUhlaWdodClcblx0XHRcdC8vIGxlYXZlIHNwYWNlIGZvciB0aGUgc2Vjb25kIHRleHQgbGluZS4gaXQgd2lsbCBiZSByZXN0cmljdGVkIHRvIGEgbWF4aW11bSBvZiBvbmUgbGluZSBpbiBoZWlnaHRcblx0XHRcdGNvbnN0IHRvcFNlY3Rpb25NYXhMaW5lcyA9IHNlY29uZExpbmVUZXh0ICE9IG51bGwgPyBsaW5lc0luQnViYmxlIC0gMSA6IGxpbmVzSW5CdWJibGVcblx0XHRcdGNvbnN0IHRvcFNlY3Rpb25DbGFzcyA9IHRvcFNlY3Rpb25NYXhMaW5lcyA9PT0gMSA/IFwiLnRleHQtY2xpcFwiIDogXCIudGV4dC1lbGxpcHNpcy1tdWx0aS1saW5lXCJcblx0XHRcdHJldHVybiBbXG5cdFx0XHRcdC8vIFRoZSB3cmFwcGVyIGFyb3VuZCBgdGV4dGAgaXMgbmVlZGVkIHRvIHN0b3AgYC13ZWJraXQtYm94YCBmcm9tIGNoYW5naW5nIHRoZSBoZWlnaHRcblx0XHRcdFx0Q2FsZW5kYXJFdmVudEJ1YmJsZS5yZW5kZXJUZXh0U2VjdGlvbihcblx0XHRcdFx0XHRcIlwiLFxuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHR0b3BTZWN0aW9uQ2xhc3MsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0XCItd2Via2l0LWxpbmUtY2xhbXBcIjogdG9wU2VjdGlvbk1heExpbmVzLCAvLyBUaGlzIGhlbHBzIHJlc2l6aW5nIHRoZSB0ZXh0IHRvIHNob3cgYXMgbXVjaCBhcyBwb3NzaWJsZSBvZiBpdHMgY29udGVudHNcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR0ZXh0LFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0dG9wU2VjdGlvbk1heExpbmVzICogbGluZUhlaWdodCxcblx0XHRcdFx0KSxcblx0XHRcdFx0c2Vjb25kTGluZVRleHQgPyBDYWxlbmRhckV2ZW50QnViYmxlLnJlbmRlclRleHRTZWN0aW9uKFwiLnRleHQtZWxsaXBzaXNcIiwgc2Vjb25kTGluZVRleHQsIGxpbmVIZWlnaHQpIDogbnVsbCxcblx0XHRcdF1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIENhbGVuZGFyRXZlbnRCdWJibGUucmVuZGVyVGV4dFNlY3Rpb24oXG5cdFx0XHRcdFwiLnRleHQtY2xpcFwiLFxuXHRcdFx0XHRzZWNvbmRMaW5lVGV4dFxuXHRcdFx0XHRcdD8gW1xuXHRcdFx0XHRcdFx0XHRgJHt0ZXh0fSBgLFxuXHRcdFx0XHRcdFx0XHRtKEljb24sIHtcblx0XHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5UaW1lLFxuXHRcdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxsOiBjb2xvckZvckJnKFwiI1wiICsgY29sb3IpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XCJwYWRkaW5nLXRvcFwiOiBcIjJweFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XCJwYWRkaW5nLXJpZ2h0XCI6IFwiMnB4XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcInZlcnRpY2FsLWFsaWduXCI6IFwidGV4dC10b3BcIixcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdGNsYXNzOiBcImljb24tc21hbGxcIixcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdGAke3NlY29uZExpbmVUZXh0fWAsXG5cdFx0XHRcdFx0ICBdXG5cdFx0XHRcdFx0OiB0ZXh0LFxuXHRcdFx0XHRsaW5lSGVpZ2h0LFxuXHRcdFx0KVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgc3RhdGljIHJlbmRlclRleHRTZWN0aW9uKGNsYXNzZXM6IHN0cmluZywgdGV4dDogQ2hpbGRyZW4sIG1heEhlaWdodDogbnVtYmVyKTogQ2hpbGQge1xuXHRcdHJldHVybiBtKFxuXHRcdFx0Y2xhc3Nlcyxcblx0XHRcdHtcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRsaW5lSGVpZ2h0OiBsaW5lSGVpZ2h0UHgsXG5cdFx0XHRcdFx0bWF4SGVpZ2h0OiBweChtYXhIZWlnaHQpLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHRleHQsXG5cdFx0KVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IGhhc0FsYXJtc0ZvclRoZVVzZXIsIGlzQ2xpZW50T25seUNhbGVuZGFyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyVXRpbHNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudEJ1YmJsZSB9IGZyb20gXCIuL0NhbGVuZGFyRXZlbnRCdWJibGVcIlxuaW1wb3J0IHR5cGUgeyBDYWxlbmRhckV2ZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHR5cGUgeyBVc2VyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB0eXBlIHsgRXZlbnRUZXh0VGltZU9wdGlvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgdHlwZSB7IENhbGVuZGFyRXZlbnRCdWJibGVDbGlja0hhbmRsZXIsIENhbGVuZGFyRXZlbnRCdWJibGVLZXlEb3duSGFuZGxlciB9IGZyb20gXCIuL0NhbGVuZGFyVmlld01vZGVsXCJcbmltcG9ydCB7IGZvcm1hdEV2ZW50VGltZSwgZ2V0RGlzcGxheUV2ZW50VGl0bGUgfSBmcm9tIFwiLi4vZ3VpL0NhbGVuZGFyR3VpVXRpbHMuanNcIlxuaW1wb3J0IHsgbGlzdElkUGFydCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlscy5qc1wiXG5cbnR5cGUgQ29udGludWluZ0NhbGVuZGFyRXZlbnRCdWJibGVBdHRycyA9IHtcblx0ZXZlbnQ6IENhbGVuZGFyRXZlbnRcblx0c3RhcnRzQmVmb3JlOiBib29sZWFuXG5cdGVuZHNBZnRlcjogYm9vbGVhblxuXHRjb2xvcjogc3RyaW5nXG5cdG9uRXZlbnRDbGlja2VkOiBDYWxlbmRhckV2ZW50QnViYmxlQ2xpY2tIYW5kbGVyXG5cdG9uRXZlbnRLZXlEb3duOiBDYWxlbmRhckV2ZW50QnViYmxlS2V5RG93bkhhbmRsZXJcblx0c2hvd1RpbWU6IEV2ZW50VGV4dFRpbWVPcHRpb24gfCBudWxsXG5cdHVzZXI6IFVzZXJcblx0ZmFkZUluOiBib29sZWFuXG5cdG9wYWNpdHk6IG51bWJlclxuXHRlbmFibGVQb2ludGVyRXZlbnRzOiBib29sZWFuXG59XG5cbmV4cG9ydCBjbGFzcyBDb250aW51aW5nQ2FsZW5kYXJFdmVudEJ1YmJsZSBpbXBsZW1lbnRzIENvbXBvbmVudDxDb250aW51aW5nQ2FsZW5kYXJFdmVudEJ1YmJsZUF0dHJzPiB7XG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxDb250aW51aW5nQ2FsZW5kYXJFdmVudEJ1YmJsZUF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBldmVudFRpdGxlID0gZ2V0RGlzcGxheUV2ZW50VGl0bGUoYXR0cnMuZXZlbnQuc3VtbWFyeSlcblxuXHRcdHJldHVybiBtKFwiLmZsZXguY2FsZW5kYXItZXZlbnQtY29udGFpbmVyLmRhcmtlci1ob3ZlclwiLCBbXG5cdFx0XHRhdHRycy5zdGFydHNCZWZvcmVcblx0XHRcdFx0PyBtKFwiLmV2ZW50LWNvbnRpbnVlcy1yaWdodC1hcnJvd1wiLCB7XG5cdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcImJvcmRlci1sZWZ0LWNvbG9yXCI6IFwidHJhbnNwYXJlbnRcIixcblx0XHRcdFx0XHRcdFx0XCJib3JkZXItdG9wLWNvbG9yXCI6IFwiI1wiICsgYXR0cnMuY29sb3IsXG5cdFx0XHRcdFx0XHRcdFwiYm9yZGVyLWJvdHRvbS1jb2xvclwiOiBcIiNcIiArIGF0dHJzLmNvbG9yLFxuXHRcdFx0XHRcdFx0XHRvcGFjaXR5OiBhdHRycy5vcGFjaXR5LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0ICB9KVxuXHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5mbGV4LWdyb3cub3ZlcmZsb3ctaGlkZGVuXCIsXG5cdFx0XHRcdG0oQ2FsZW5kYXJFdmVudEJ1YmJsZSwge1xuXHRcdFx0XHRcdHRleHQ6IChhdHRycy5zaG93VGltZSAhPSBudWxsID8gZm9ybWF0RXZlbnRUaW1lKGF0dHJzLmV2ZW50LCBhdHRycy5zaG93VGltZSkgKyBcIiBcIiA6IFwiXCIpICsgZXZlbnRUaXRsZSxcblx0XHRcdFx0XHRjb2xvcjogYXR0cnMuY29sb3IsXG5cdFx0XHRcdFx0Y2xpY2s6IChlKSA9PiBhdHRycy5vbkV2ZW50Q2xpY2tlZChhdHRycy5ldmVudCwgZSksXG5cdFx0XHRcdFx0a2V5RG93bjogKGUpID0+IGF0dHJzLm9uRXZlbnRLZXlEb3duKGF0dHJzLmV2ZW50LCBlKSxcblx0XHRcdFx0XHRub0JvcmRlckxlZnQ6IGF0dHJzLnN0YXJ0c0JlZm9yZSxcblx0XHRcdFx0XHRub0JvcmRlclJpZ2h0OiBhdHRycy5lbmRzQWZ0ZXIsXG5cdFx0XHRcdFx0aGFzQWxhcm06IGhhc0FsYXJtc0ZvclRoZVVzZXIoYXR0cnMudXNlciwgYXR0cnMuZXZlbnQpLFxuXHRcdFx0XHRcdGlzQWx0ZXJlZDogYXR0cnMuZXZlbnQucmVjdXJyZW5jZUlkICE9IG51bGwsXG5cdFx0XHRcdFx0ZmFkZUluOiBhdHRycy5mYWRlSW4sXG5cdFx0XHRcdFx0b3BhY2l0eTogYXR0cnMub3BhY2l0eSxcblx0XHRcdFx0XHRlbmFibGVQb2ludGVyRXZlbnRzOiBhdHRycy5lbmFibGVQb2ludGVyRXZlbnRzLFxuXHRcdFx0XHRcdGlzQ2xpZW50T25seTogaXNDbGllbnRPbmx5Q2FsZW5kYXIobGlzdElkUGFydChhdHRycy5ldmVudC5faWQpKSxcblx0XHRcdFx0fSksXG5cdFx0XHQpLFxuXHRcdFx0YXR0cnMuZW5kc0FmdGVyXG5cdFx0XHRcdD8gbShcIi5ldmVudC1jb250aW51ZXMtcmlnaHQtYXJyb3dcIiwge1xuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XCJib3JkZXItbGVmdC1jb2xvclwiOiBcIiNcIiArIGF0dHJzLmNvbG9yLFxuXHRcdFx0XHRcdFx0XHRvcGFjaXR5OiBhdHRycy5vcGFjaXR5LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0ICB9KVxuXHRcdFx0XHQ6IG51bGwsXG5cdFx0XSlcblx0fVxufVxuIiwiaW1wb3J0IHR5cGUgeyBDYWxlbmRhckV2ZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IG0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgZ2V0QWxsRGF5RGF0ZVVUQywgaXNBbGxEYXlFdmVudCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9Db21tb25DYWxlbmRhclV0aWxzXCJcbmltcG9ydCB7IFRpbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvVGltZS5qc1wiXG5pbXBvcnQgeyBzaG93RHJvcGRvd25BdFBvc2l0aW9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhck9wZXJhdGlvbiB9IGZyb20gXCIuLi9ndWkvZXZlbnRlZGl0b3ItbW9kZWwvQ2FsZW5kYXJFdmVudE1vZGVsLmpzXCJcblxuY29uc3QgRFJBR19USFJFU0hPTEQgPSAxMFxuZXhwb3J0IHR5cGUgTW91c2VQb3MgPSB7XG5cdHg6IG51bWJlclxuXHR5OiBudW1iZXJcbn1cbi8vIENvbnZlbmllbmNlIHdyYXBwZXIgZm9yIG51bGxhYmlsaXR5XG50eXBlIERyYWdEYXRhID0ge1xuXHRvcmlnaW5hbEV2ZW50OiBDYWxlbmRhckV2ZW50XG5cdG9yaWdpbmFsRGF0ZVVuZGVyTW91c2U6IERhdGVcblx0b3JpZ2luYWxNb3VzZVBvczogTW91c2VQb3Ncblx0a2VlcFRpbWU6IGJvb2xlYW4gLy8gSW5kaWNhdGVzIHdoZXRoZXIgdGhlIHRpbWUgb24gdGhlIG9yaWdpbmFsIGV2ZW50IHNob3VsZCBiZSBrZXB0IG9yIG1vZGlmaWVkLiBJbiBjYXNlIHRoaXMgaXMgc2V0IHRvIHRydWUgdGhlIGRyYWcgb3BlcmF0aW9uIGp1c3Qgc2hpZnRzIGV2ZW50IHN0YXJ0IGJ5IHdob2xlIGRheXMuXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnREcmFnSGFuZGxlckNhbGxiYWNrcyB7XG5cdHJlYWRvbmx5IG9uRHJhZ1N0YXJ0OiAoY2FsZW5kYXJFdmVudDogQ2FsZW5kYXJFdmVudCwgdGltZVRvTW92ZUJ5OiBudW1iZXIpID0+IHZvaWRcblx0cmVhZG9ubHkgb25EcmFnVXBkYXRlOiAodGltZVRvTW92ZUJ5OiBudW1iZXIpID0+IHZvaWRcblx0cmVhZG9ubHkgb25EcmFnRW5kOiAodGltZVRvTW92ZUJ5OiBudW1iZXIsIG1vZGU6IENhbGVuZGFyT3BlcmF0aW9uIHwgbnVsbCkgPT4gUHJvbWlzZTx2b2lkPlxuXHRyZWFkb25seSBvbkRyYWdDYW5jZWw6ICgpID0+IHZvaWRcbn1cblxuLyoqXG4gKiBIYW5kbGVzIGxvZ2ljIGZvciBkcmFnZ2luZyBldmVudHMgaW4gdGhlIGNhbGVuZGFyIGNoaWxkIHZpZXdzLlxuICovXG5leHBvcnQgY2xhc3MgRXZlbnREcmFnSGFuZGxlciB7XG5cdHByaXZhdGUgZGF0YTogRHJhZ0RhdGEgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGRyYWdnaW5nOiBib29sZWFuID0gZmFsc2Vcblx0cHJpdmF0ZSBsYXN0RGlmZkJldHdlZW5EYXRlczogbnVtYmVyIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBoYXNDaGFuZ2VkOiBib29sZWFuID0gZmFsc2VcblxuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGRyYWdnaW5nQXJlYTogSFRNTEJvZHlFbGVtZW50LCBwcml2YXRlIHJlYWRvbmx5IGV2ZW50RHJhZ0NhbGxiYWNrczogRXZlbnREcmFnSGFuZGxlckNhbGxiYWNrcykge31cblxuXHRnZXQgaXNEcmFnZ2luZygpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5kcmFnZ2luZ1xuXHR9XG5cblx0Z2V0IG9yaWdpbmFsRXZlbnQoKTogQ2FsZW5kYXJFdmVudCB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLmRhdGE/Lm9yaWdpbmFsRXZlbnQgPz8gbnVsbFxuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrIGlmIHRoZSBoYW5kbGVyIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgeW91IGNhbGxlZCB0aGlzIGZ1bmN0aW9uXG5cdCAqL1xuXHRxdWVyeUhhc0NoYW5nZWQoKTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgaXNDaGFuZ2VkID0gdGhpcy5oYXNDaGFuZ2VkXG5cdFx0dGhpcy5oYXNDaGFuZ2VkID0gZmFsc2Vcblx0XHRyZXR1cm4gaXNDaGFuZ2VkXG5cdH1cblxuXHQvKipcblx0ICogQ2FsbCBvbiBtb3VzZSBkb3duLCB0byBpbml0aWFsaXplIGFuIHVwY29taW5nIGRyYWcgZXZlbnQuXG5cdCAqIERvZXNuJ3Qgc3RhcnQgdGhlIGRyYWcgeWV0LCBiZWNhdXNlIHdlIHdhbnQgdG8gd2FpdCB1bnRpbCB0aGUgbW91c2UgaGFzIG1vdmVkIGJleW9uZCBzb21lIHRocmVzaGhvbGRcblx0ICogQHBhcmFtIGNhbGVuZGFyRXZlbnQgVGhlIGNhbGVuZGFyIGV2ZW50IGZvciB3aGljaCBhIGRyYWcgb3BlcmF0aW9uIGlzIHByZXBhcmVkLlxuXHQgKiBAcGFyYW0gZGF0ZVVuZGVyTW91c2UgVGhlIG9yaWdpbmFsIGRhdGUgdW5kZXIgbW91c2Ugd2hlbiBwcmVwYXJpbmcgdGhlIGRyYWcuXG5cdCAqIEBwYXJhbSBtb3VzZVBvcyBUaGUgY3VycmVudCBwb3NpdGlvbiBvZiB0aGUgbW91c2UuXG5cdCAqIEBwYXJhbSBrZWVwVGltZSBJbmRpY2F0ZXMgd2hldGhlciB0aGUgdGltZSBvbiB0aGUgb3JpZ2luYWwgZXZlbnQgc2hvdWxkIGJlIGtlcHQgb3IgbW9kaWZpZWQuIEluIGNhc2UgdGhpcyBpcyBzZXQgdG8gdHJ1ZSB0aGUgZHJhZ1xuXHQgKiBvcGVyYXRpb24ganVzdCBzaGlmdHMgZXZlbnQgc3RhcnQgYnkgd2hvbGUgZGF5cyBvdGhlcndpc2UgdGhlIHRpbWUgZnJvbSBkYXRlVW5kZXJNb3VzZSBzaG91bGQgYmUgdXNlZCBhcyBuZXcgdGltZSBmb3IgdGhlIGV2ZW50LlxuXHQgKi9cblx0cHJlcGFyZURyYWcoY2FsZW5kYXJFdmVudDogQ2FsZW5kYXJFdmVudCwgZGF0ZVVuZGVyTW91c2U6IERhdGUsIG1vdXNlUG9zOiBNb3VzZVBvcywga2VlcFRpbWU6IGJvb2xlYW4pIHtcblx0XHR0aGlzLmRyYWdnaW5nQXJlYS5jbGFzc0xpc3QuYWRkKFwiY3Vyc29yLWdyYWJiaW5nXCIpXG5cblx0XHR0aGlzLmRhdGEgPSB7XG5cdFx0XHRvcmlnaW5hbEV2ZW50OiBjYWxlbmRhckV2ZW50LFxuXHRcdFx0Ly8gV2UgYWx3YXlzIGRpZmZlcmVudGlhdGUgYmV0d2VlbiBldmVudFN0YXJ0IGFuZCBvcmlnaW5hbERhdGVVbmRlck1vdXNlIHRvIGJlIGFibGUgdG8gc2hpZnQgaXQgcmVsYXRpdmUgdG8gdGhlIG1vdXNlIHBvc2l0aW9uXG5cdFx0XHQvLyBhbmQgbm90IHRoZSBzdGFydCBkYXRlLiBUaGlzIGlzIGltcG9ydGFudCBmb3IgbGFyZ2VyIGV2ZW50cyBpbiBkYXkvd2VlayB2aWV3XG5cdFx0XHRvcmlnaW5hbERhdGVVbmRlck1vdXNlOiB0aGlzLmFkanVzdERhdGVVbmRlck1vdXNlKGNhbGVuZGFyRXZlbnQuc3RhcnRUaW1lLCBkYXRlVW5kZXJNb3VzZSwga2VlcFRpbWUpLFxuXHRcdFx0b3JpZ2luYWxNb3VzZVBvczogbW91c2VQb3MsXG5cdFx0XHRrZWVwVGltZToga2VlcFRpbWUsXG5cdFx0fVxuXHRcdHRoaXMuaGFzQ2hhbmdlZCA9IGZhbHNlXG5cdFx0dGhpcy5kcmFnZ2luZyA9IGZhbHNlXG5cdH1cblxuXHQvKipcblx0ICogQ2FsbCBvbiBtb3VzZSBtb3ZlLlxuXHQgKiBXaWxsIGJlIGEgbm8tb3AgaWYgdGhlIHByZXBhcmVEcmFnIGhhc24ndCBiZWVuIGNhbGxlZCBvciBpZiBjYW5jZWxEcmFnIGhhcyBiZWVuIGNhbGxlZCBzaW5jZSB0aGUgbGFzdCBwcmVwYXJlRHJhZyBjYWxsXG5cdCAqIFRoZSBkcmFnZ2luZyBkb2Vzbid0IGFjdHVhbGx5IGJlZ2luIHVudGlsIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBtb3VzZSBhbmQgaXRzIG9yaWdpbmFsIGxvY2F0aW9uIGlzIGdyZWF0ZXIgdGhhbiBzb21lIHRocmVzaG9sZFxuXHQgKiBAcGFyYW0gZGF0ZVVuZGVyTW91c2UgVGhlIGN1cnJlbnQgZGF0ZSB1bmRlciB0aGUgbW91c2UgY291cnNlciwgbWF5IGluY2x1ZGUgYSB0aW1lLlxuXHQgKiBAcGFyYW0gbW91c2VQb3MgdGhlIHBvc2l0aW9uIG9mIHRoZSBtb3VzZSB3aGVuIHRoZSBkcmFnIGVuZGVkLlxuXHQgKi9cblx0aGFuZGxlRHJhZyhkYXRlVW5kZXJNb3VzZTogRGF0ZSwgbW91c2VQb3M6IE1vdXNlUG9zKSB7XG5cdFx0aWYgKHRoaXMuZGF0YSkge1xuXHRcdFx0Y29uc3QgZHJhZ0RhdGEgPSB0aGlzLmRhdGFcblx0XHRcdGNvbnN0IGFkanVzdGVkRGF0ZVVuZGVyTW91c2UgPSB0aGlzLmFkanVzdERhdGVVbmRlck1vdXNlKGRyYWdEYXRhLm9yaWdpbmFsRXZlbnQuc3RhcnRUaW1lLCBkYXRlVW5kZXJNb3VzZSwgZHJhZ0RhdGEua2VlcFRpbWUpXG5cdFx0XHQvLyBDYWxjdWxhdGUgdGhlIGRpc3RhbmNlIGZyb20gdGhlIG9yaWdpbmFsIG1vdXNlIGxvY2F0aW9uIHRvIHRoZSBjdXJyZW50IG1vdXNlIGxvY2F0aW9uXG5cdFx0XHQvLyBXZSBkb24ndCB3YW50IHRvIGFjdHVhbGx5IHN0YXJ0IHRoZSBkcmFnIHVudGlsIHRoZSBtb3VzZSBoYXMgbW92ZWQgYnkgc29tZSBkaXN0YW5jZVxuXHRcdFx0Ly8gU28gYXMgdG8gYXZvaWQgYWNjaWRlbnRhbGx5IGRyYWdnaW5nIHdoZW4geW91IG1lYW50IHRvIGNsaWNrIGJ1dCBtb3ZlZCB0aGUgbW91c2UgYSBsaXR0bGVcblx0XHRcdGNvbnN0IGRpc3RhbmNlWCA9IGRyYWdEYXRhLm9yaWdpbmFsTW91c2VQb3MueCAtIG1vdXNlUG9zLnhcblx0XHRcdGNvbnN0IGRpc3RhbmNlWSA9IGRyYWdEYXRhLm9yaWdpbmFsTW91c2VQb3MueSAtIG1vdXNlUG9zLnlcblx0XHRcdGNvbnN0IGRpc3RhbmNlID0gTWF0aC5zcXJ0KGRpc3RhbmNlWCAqKiAyICsgZGlzdGFuY2VZICoqIDIpXG5cblx0XHRcdGlmICh0aGlzLmRyYWdnaW5nKSB7XG5cdFx0XHRcdGNvbnN0IGRpZmZCZXR3ZWVuRGF0ZXMgPSB0aGlzLmdldERheVVuZGVyTW91c2VEaWZmKGRyYWdEYXRhLCBhZGp1c3RlZERhdGVVbmRlck1vdXNlKVxuXG5cdFx0XHRcdC8vIFdlIGRvbid0IHdhbnQgdG8gdHJpZ2dlciBhIHJlZHJhdyBldmVyeXRpbWUgdGhlIGRyYWcgY2FsbCBpcyB0cmlnZ2VyZWQsIG9ubHkgd2hlbiBuZWNlc3Nhcnlcblx0XHRcdFx0aWYgKGRpZmZCZXR3ZWVuRGF0ZXMgIT09IHRoaXMubGFzdERpZmZCZXR3ZWVuRGF0ZXMpIHtcblx0XHRcdFx0XHR0aGlzLmxhc3REaWZmQmV0d2VlbkRhdGVzID0gZGlmZkJldHdlZW5EYXRlc1xuXG5cdFx0XHRcdFx0dGhpcy5ldmVudERyYWdDYWxsYmFja3Mub25EcmFnVXBkYXRlKGRpZmZCZXR3ZWVuRGF0ZXMpXG5cblx0XHRcdFx0XHR0aGlzLmhhc0NoYW5nZWQgPSB0cnVlXG5cdFx0XHRcdFx0bS5yZWRyYXcoKVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGRpc3RhbmNlID4gRFJBR19USFJFU0hPTEQpIHtcblx0XHRcdFx0dGhpcy5kcmFnZ2luZyA9IHRydWVcblx0XHRcdFx0dGhpcy5sYXN0RGlmZkJldHdlZW5EYXRlcyA9IHRoaXMuZ2V0RGF5VW5kZXJNb3VzZURpZmYoZHJhZ0RhdGEsIGFkanVzdGVkRGF0ZVVuZGVyTW91c2UpXG5cblx0XHRcdFx0dGhpcy5ldmVudERyYWdDYWxsYmFja3Mub25EcmFnU3RhcnQoZHJhZ0RhdGEub3JpZ2luYWxFdmVudCwgdGhpcy5sYXN0RGlmZkJldHdlZW5EYXRlcylcblxuXHRcdFx0XHR0aGlzLmhhc0NoYW5nZWQgPSB0cnVlXG5cdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogQ2FsbCBvbiBtb3VzZXVwIG9yIG1vdXNlbGVhdmUuIEVuZHMgYSBkcmFnIGV2ZW50IGlmIG9uZSBoYXMgYmVlbiBzdGFydGVkLCBhbmQgaGFzbid0IGJlZW4gY2FuY2VsbGVkLlxuXHQgKlxuXHQgKiBUaGlzIGZ1bmN0aW9uIHdpbGwgb25seSB0cmlnZ2VyIHdoZW4gcHJlcGFyZURyYWcgaGFzIGJlZW4gY2FsbGVkXG5cdCAqL1xuXHRhc3luYyBlbmREcmFnKGRhdGVVbmRlck1vdXNlOiBEYXRlLCBwb3M6IE1vdXNlUG9zKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0dGhpcy5kcmFnZ2luZ0FyZWEuY2xhc3NMaXN0LnJlbW92ZShcImN1cnNvci1ncmFiYmluZ1wiKVxuXG5cdFx0aWYgKHRoaXMuZHJhZ2dpbmcgJiYgdGhpcy5kYXRhKSB7XG5cdFx0XHRjb25zdCBkcmFnRGF0YSA9IHRoaXMuZGF0YVxuXHRcdFx0Y29uc3QgYWRqdXN0ZWREYXRlVW5kZXJNb3VzZSA9IHRoaXMuYWRqdXN0RGF0ZVVuZGVyTW91c2UoZHJhZ0RhdGEub3JpZ2luYWxFdmVudC5zdGFydFRpbWUsIGRhdGVVbmRlck1vdXNlLCBkcmFnRGF0YS5rZWVwVGltZSlcblx0XHRcdC8vIFdlIHVwZGF0ZSBvdXIgc3RhdGUgZmlyc3QgYmVjYXVzZSB0aGUgdXBkYXRlQ2FsbGJhY2sgbWlnaHQgdGFrZSBzb21lIHRpbWUsIGFuZFxuXHRcdFx0Ly8gd2Ugd2FudCB0aGUgVUkgdG8gYmUgYWJsZSB0byByZWFjdCB0byB0aGUgZHJvcCBoYXZpbmcgaGFwcGVuZWQgYmVmb3JlIHdlIGdldCB0aGUgcmVzdWx0XG5cdFx0XHR0aGlzLmRyYWdnaW5nID0gZmFsc2Vcblx0XHRcdHRoaXMuZGF0YSA9IG51bGxcblx0XHRcdGNvbnN0IGRpZmZCZXR3ZWVuRGF0ZXMgPSB0aGlzLmdldERheVVuZGVyTW91c2VEaWZmKGRyYWdEYXRhLCBhZGp1c3RlZERhdGVVbmRlck1vdXNlKVxuXG5cdFx0XHQvLyB0ZWNobmljYWxseSwgd2Ugc2hvdWxkIGNoZWNrIHRoYXQgdGhpcyBldmVudCBpcyBFdmVudFR5cGUgT1dOIG9yIFNIQVJFRF9SVywgYnV0IHdlJ2xsIGFzc3VtZSB0aGF0IHdlJ3JlXG5cdFx0XHQvLyBub3QgYWxsb3dlZCB0byBkcmFnIGV2ZW50cyB3aGVyZSB0aGF0J3Mgbm90IHRoZSBjYXNlLlxuXHRcdFx0Ly8gbm90ZSB0aGF0IHdlJ3JlIG5vdCBhbGxvd2luZyBjaGFuZ2luZyB0aGUgd2hvbGUgc2VyaWVzIGZyb20gZHJhZ2dpbmcgYW4gYWx0ZXJlZCBpbnN0YW5jZS5cblx0XHRcdGNvbnN0IHsgcmVwZWF0UnVsZSwgcmVjdXJyZW5jZUlkIH0gPSBkcmFnRGF0YS5vcmlnaW5hbEV2ZW50XG5cdFx0XHQvLyBwcmV0dGllci1pZ25vcmVcblx0XHRcdGNvbnN0IG1vZGUgPSByZXBlYXRSdWxlICE9IG51bGxcblx0XHRcdFx0PyBhd2FpdCBzaG93TW9kZVNlbGVjdGlvbkRyb3Bkb3duKHBvcylcblx0XHRcdFx0OiByZWN1cnJlbmNlSWQgIT0gbnVsbFxuXHRcdFx0XHRcdD8gQ2FsZW5kYXJPcGVyYXRpb24uRWRpdFRoaXNcblx0XHRcdFx0XHQ6IENhbGVuZGFyT3BlcmF0aW9uLkVkaXRBbGxcblxuXHRcdFx0Ly8gSWYgdGhlIGRhdGUgaGFzbid0IGNoYW5nZWQgd2Ugc3RpbGwgaGF2ZSB0byBkbyB0aGUgY2FsbGJhY2sgc28gdGhlIHZpZXcgbW9kZWwgY2FuIGNhbmNlbCB0aGUgZHJhZ1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgdGhpcy5ldmVudERyYWdDYWxsYmFja3Mub25EcmFnRW5kKGRpZmZCZXR3ZWVuRGF0ZXMsIG1vZGUpXG5cdFx0XHR9IGZpbmFsbHkge1xuXHRcdFx0XHR0aGlzLmhhc0NoYW5nZWQgPSB0cnVlXG5cdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5jYW5jZWxEcmFnKClcblx0XHR9XG5cdH1cblxuXHRhZGp1c3REYXRlVW5kZXJNb3VzZShldmVudFN0YXJ0OiBEYXRlLCBkYXRlVW5kZXJNb3VzZTogRGF0ZSwga2VlcFRpbWU6IGJvb2xlYW4pOiBEYXRlIHtcblx0XHRpZiAoa2VlcFRpbWUpIHtcblx0XHRcdHJldHVybiBUaW1lLmZyb21EYXRlKGV2ZW50U3RhcnQpLnRvRGF0ZShkYXRlVW5kZXJNb3VzZSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGRhdGVVbmRlck1vdXNlXG5cdFx0fVxuXHR9XG5cblx0Z2V0RGF5VW5kZXJNb3VzZURpZmYoZHJhZ0RhdGE6IERyYWdEYXRhLCBhZGp1c3RlZERhdGVVbmRlck1vdXNlOiBEYXRlKTogbnVtYmVyIHtcblx0XHRjb25zdCB7IG9yaWdpbmFsRXZlbnQsIG9yaWdpbmFsRGF0ZVVuZGVyTW91c2UgfSA9IGRyYWdEYXRhXG5cdFx0cmV0dXJuIGlzQWxsRGF5RXZlbnQob3JpZ2luYWxFdmVudClcblx0XHRcdD8gZ2V0QWxsRGF5RGF0ZVVUQyhhZGp1c3RlZERhdGVVbmRlck1vdXNlKS5nZXRUaW1lKCkgLSBnZXRBbGxEYXlEYXRlVVRDKG9yaWdpbmFsRGF0ZVVuZGVyTW91c2UpLmdldFRpbWUoKVxuXHRcdFx0OiBhZGp1c3RlZERhdGVVbmRlck1vdXNlLmdldFRpbWUoKSAtIG9yaWdpbmFsRGF0ZVVuZGVyTW91c2UuZ2V0VGltZSgpXG5cdH1cblxuXHRjYW5jZWxEcmFnKCkge1xuXHRcdHRoaXMuZHJhZ2dpbmdBcmVhLmNsYXNzTGlzdC5yZW1vdmUoXCJjdXJzb3ItZ3JhYmJpbmdcIilcblx0XHR0aGlzLmV2ZW50RHJhZ0NhbGxiYWNrcy5vbkRyYWdDYW5jZWwoKVxuXG5cdFx0dGhpcy5kYXRhID0gbnVsbFxuXHRcdHRoaXMuZHJhZ2dpbmcgPSBmYWxzZVxuXHRcdHRoaXMuaGFzQ2hhbmdlZCA9IHRydWVcblx0XHR0aGlzLmxhc3REaWZmQmV0d2VlbkRhdGVzID0gbnVsbFxuXG5cdFx0bS5yZWRyYXcoKVxuXHR9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNob3dNb2RlU2VsZWN0aW9uRHJvcGRvd24ocG9zOiBNb3VzZVBvcyk6IFByb21pc2U8Q2FsZW5kYXJPcGVyYXRpb24gfCBudWxsPiB7XG5cdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdHNob3dEcm9wZG93bkF0UG9zaXRpb24oXG5cdFx0XHRbXG5cdFx0XHRcdHsgbGFiZWw6IFwidXBkYXRlT25lQ2FsZW5kYXJFdmVudF9hY3Rpb25cIiwgY2xpY2s6ICgpID0+IHJlc29sdmUoQ2FsZW5kYXJPcGVyYXRpb24uRWRpdFRoaXMpIH0sXG5cdFx0XHRcdHsgbGFiZWw6IFwidXBkYXRlQWxsQ2FsZW5kYXJFdmVudHNfYWN0aW9uXCIsIGNsaWNrOiAoKSA9PiByZXNvbHZlKENhbGVuZGFyT3BlcmF0aW9uLkVkaXRBbGwpIH0sXG5cdFx0XHRdLFxuXHRcdFx0cG9zLngsXG5cdFx0XHRwb3MueSxcblx0XHRcdCgpID0+IHJlc29sdmUobnVsbCksXG5cdFx0KVxuXHR9KVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBTd2lwZUhhbmRsZXIgfSBmcm9tIFwiLi9Td2lwZUhhbmRsZXJcIlxuaW1wb3J0IHsgYW5pbWF0aW9ucywgdHJhbnNmb3JtLCBUcmFuc2Zvcm1FbnVtIH0gZnJvbSBcIi4uL2FuaW1hdGlvbi9BbmltYXRpb25zXCJcblxudHlwZSBQYWdlID0ge1xuXHRrZXk6IHN0cmluZyB8IG51bWJlclxuXHRub2RlczogQ2hpbGRyZW5cbn1cbnR5cGUgQXR0cnMgPSB7XG5cdHByZXZpb3VzUGFnZTogUGFnZVxuXHRjdXJyZW50UGFnZTogUGFnZVxuXHRuZXh0UGFnZTogUGFnZVxuXHRvbkNoYW5nZVBhZ2U6IChuZXh0OiBib29sZWFuKSA9PiB1bmtub3duXG59XG5cbmV4cG9ydCBjbGFzcyBQYWdlVmlldyBpbXBsZW1lbnRzIENvbXBvbmVudDxBdHRycz4ge1xuXHRwcml2YXRlIHZpZXdEb206IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBvbkNoYW5nZVBhZ2UhOiAoXzogYm9vbGVhbikgPT4gdW5rbm93blxuXG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0dGhpcy5vbkNoYW5nZVBhZ2UgPSAobmV4dCkgPT4gYXR0cnMub25DaGFuZ2VQYWdlKG5leHQpXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5yZWwuZmxleC1ncm93Lm92ZXJmbG93LWhpZGRlblwiLFxuXHRcdFx0bShcblx0XHRcdFx0XCIuZmlsbC1hYnNvbHV0ZVwiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0b25jcmVhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy52aWV3RG9tID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50XG5cdFx0XHRcdFx0XHRjb25zdCBzd2lwZUhhbmRsZXIgPSBuZXcgUGFnZVN3aXBlSGFuZGxlcih0aGlzLnZpZXdEb20sIChuZXh0KSA9PiB0aGlzLm9uQ2hhbmdlUGFnZShuZXh0KSlcblx0XHRcdFx0XHRcdHN3aXBlSGFuZGxlci5hdHRhY2goKVxuXG5cdFx0XHRcdFx0XHQvLyBUaGlzIHJlZHJhdyBpcyBuZWVkZWQgYWZ0ZXIgc2V0dGluZyB0aGUgdmlld0RvbSB0byBpbW1lZGlhdGVseSBhcHBseSB0aGUgdHJhbnNmb3Jtc1xuXHRcdFx0XHRcdFx0Ly8gcHJldmVudGluZyB0aGUgb3ZlcmxhcCBvZiBldmVudHMgZnJvbSBvdGhlciBkYXRlcyB3aXRoIHRoZSBjdXJyZW50IGxpc3RlZCBkYXRlXG5cdFx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcIi5hYnNcIixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XCJhcmlhLWhpZGRlblwiOiBcInRydWVcIixcblx0XHRcdFx0XHRcdFx0a2V5OiBhdHRycy5wcmV2aW91c1BhZ2Uua2V5LFxuXHRcdFx0XHRcdFx0XHRzdHlsZTogdGhpcy52aWV3RG9tICYmXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy52aWV3RG9tLm9mZnNldFdpZHRoID4gMCAmJiB7XG5cdFx0XHRcdFx0XHRcdFx0XHR3aWR0aDogdGhpcy52aWV3RG9tLm9mZnNldFdpZHRoICsgXCJweFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0aGVpZ2h0OiB0aGlzLnZpZXdEb20ub2Zmc2V0SGVpZ2h0ICsgXCJweFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0dHJhbnNmb3JtOiBgdHJhbnNsYXRlWCgkey10aGlzLnZpZXdEb20ub2Zmc2V0V2lkdGh9cHgpYCxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGF0dHJzLnByZXZpb3VzUGFnZS5ub2Rlcyxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcIi5maWxsLWFic29sdXRlXCIsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGtleTogYXR0cnMuY3VycmVudFBhZ2Uua2V5LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGF0dHJzLmN1cnJlbnRQYWdlLm5vZGVzLFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFwiLmFic1wiLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiLFxuXHRcdFx0XHRcdFx0XHRrZXk6IGF0dHJzLm5leHRQYWdlLmtleSxcblx0XHRcdFx0XHRcdFx0c3R5bGU6IHRoaXMudmlld0RvbSAmJlxuXHRcdFx0XHRcdFx0XHRcdHRoaXMudmlld0RvbS5vZmZzZXRXaWR0aCA+IDAgJiYge1xuXHRcdFx0XHRcdFx0XHRcdFx0d2lkdGg6IHRoaXMudmlld0RvbS5vZmZzZXRXaWR0aCArIFwicHhcIixcblx0XHRcdFx0XHRcdFx0XHRcdGhlaWdodDogdGhpcy52aWV3RG9tLm9mZnNldEhlaWdodCArIFwicHhcIixcblx0XHRcdFx0XHRcdFx0XHRcdHRyYW5zZm9ybTogYHRyYW5zbGF0ZVgoJHt0aGlzLnZpZXdEb20ub2Zmc2V0V2lkdGh9cHgpYCxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGF0dHJzLm5leHRQYWdlLm5vZGVzLFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdF0sXG5cdFx0XHQpLFxuXHRcdClcblx0fVxufVxuXG5jbGFzcyBQYWdlU3dpcGVIYW5kbGVyIGV4dGVuZHMgU3dpcGVIYW5kbGVyIHtcblx0cHJpdmF0ZSByZWFkb25seSBvbkdlc3R1cmVDb21wbGV0ZWQ6IChuZXh0OiBib29sZWFuKSA9PiB1bmtub3duXG5cdHByaXZhdGUgeE9mZnNldDogbnVtYmVyID0gMFxuXG5cdGNvbnN0cnVjdG9yKHRvdWNoQXJlYTogSFRNTEVsZW1lbnQsIG9uR2VzdHVyZUNvbXBsZXRlZDogKG5leHQ6IGJvb2xlYW4pID0+IHVua25vd24pIHtcblx0XHRzdXBlcih0b3VjaEFyZWEpXG5cdFx0Ly8gYXZvaWQgZmxpY2tlcmluZyBlc3BlY2lhbGx5IGluIGRheSBhbmQgd2VlayB2aWV3IHdoZW4gb3ZlcmZsb3cteSBpcyBzZXQgb24gbmVzdGVkIGVsZW1lbnRzXG5cdFx0dG91Y2hBcmVhLnN0eWxlLnRyYW5zZm9ybVN0eWxlID0gXCJwcmVzZXJ2ZS0zZFwiXG5cdFx0dG91Y2hBcmVhLnN0eWxlLmJhY2tmYWNlVmlzaWJpbGl0eSA9IFwiaGlkZGVuXCJcblx0XHR0aGlzLm9uR2VzdHVyZUNvbXBsZXRlZCA9IG9uR2VzdHVyZUNvbXBsZXRlZFxuXHR9XG5cblx0b25Ib3Jpem9udGFsRHJhZyh4RGVsdGE6IG51bWJlciwgeURlbHRhOiBudW1iZXIpIHtcblx0XHR0aGlzLnhPZmZzZXQgPSBNYXRoLmFicyh4RGVsdGEpID4gNDAgPyB4RGVsdGEgOiAwXG5cdFx0dGhpcy50b3VjaEFyZWEuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVgoJHt0aGlzLnhPZmZzZXR9cHgpYFxuXHR9XG5cblx0b25Ib3Jpem9udGFsR2VzdHVyZUNvbXBsZXRlZChkZWx0YTogeyB4OiBudW1iZXI7IHk6IG51bWJlciB9KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKE1hdGguYWJzKGRlbHRhLngpID4gMTAwKSB7XG5cdFx0XHR0aGlzLnhPZmZzZXQgPSAwXG5cdFx0XHRyZXR1cm4gYW5pbWF0aW9uc1xuXHRcdFx0XHQuYWRkKHRoaXMudG91Y2hBcmVhLCB0cmFuc2Zvcm0oVHJhbnNmb3JtRW51bS5UcmFuc2xhdGVYLCBkZWx0YS54LCB0aGlzLnRvdWNoQXJlYS5vZmZzZXRXaWR0aCAqIChkZWx0YS54ID4gMCA/IDEgOiAtMSkpKVxuXHRcdFx0XHQudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5vbkdlc3R1cmVDb21wbGV0ZWQoZGVsdGEueCA8IDApXG5cblx0XHRcdFx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy50b3VjaEFyZWEuc3R5bGUudHJhbnNmb3JtID0gXCJcIlxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0pXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLnJlc2V0KGRlbHRhKVxuXHRcdH1cblx0fVxuXG5cdHJlc2V0KGRlbHRhOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyIH0pOiBQcm9taXNlPGFueT4ge1xuXHRcdGlmIChNYXRoLmFicyh0aGlzLnhPZmZzZXQpID4gNDApIHtcblx0XHRcdGFuaW1hdGlvbnMuYWRkKHRoaXMudG91Y2hBcmVhLCB0cmFuc2Zvcm0oVHJhbnNmb3JtRW51bS5UcmFuc2xhdGVYLCBkZWx0YS54LCAwKSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy50b3VjaEFyZWEuc3R5bGUudHJhbnNmb3JtID0gXCJcIlxuXHRcdH1cblxuXHRcdHRoaXMueE9mZnNldCA9IDBcblx0XHRyZXR1cm4gc3VwZXIucmVzZXQoZGVsdGEpXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDbGFzc0NvbXBvbmVudCwgQ29tcG9uZW50LCBWbm9kZSwgVm5vZGVET00gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemVcIlxuaW1wb3J0IHsgRXZlbnRUZXh0VGltZU9wdGlvbiwgV2Vla1N0YXJ0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7XG5cdENhbGVuZGFyRGF5LFxuXHRDYWxlbmRhck1vbnRoLFxuXHRnZXRBbGxEYXlEYXRlRm9yVGltZXpvbmUsXG5cdGdldERpZmZJbjI0aEludGVydmFscyxcblx0Z2V0RXZlbnRFbmQsXG5cdGdldEZpcnN0RGF5T2ZNb250aCxcblx0Z2V0U3RhcnRPZk5leHREYXlXaXRoWm9uZSxcblx0Z2V0U3RhcnRPZlRoZVdlZWtPZmZzZXQsXG5cdGdldFRpbWVab25lLFxuXHRnZXRXZWVrTnVtYmVyLFxufSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlsc1wiXG5pbXBvcnQgeyBkZWVwRXF1YWwsIGluY3JlbWVudERhdGUsIGluY3JlbWVudE1vbnRoLCBpc1RvZGF5LCBsYXN0VGhyb3csIG5ldmVyTnVsbCwgb2ZDbGFzcyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgQ29udGludWluZ0NhbGVuZGFyRXZlbnRCdWJibGUgfSBmcm9tIFwiLi9Db250aW51aW5nQ2FsZW5kYXJFdmVudEJ1YmJsZVwiXG5pbXBvcnQgeyBzdHlsZXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zdHlsZXNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJWaWV3VHlwZSwgaXNBbGxEYXlFdmVudCwgaXNBbGxEYXlFdmVudEJ5VGltZXMsIHNldE5leHRIYWxmSG91ciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9Db21tb25DYWxlbmRhclV0aWxzXCJcbmltcG9ydCB7IHdpbmRvd0ZhY2FkZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9XaW5kb3dGYWNhZGVcIlxuaW1wb3J0IHR5cGUgeyBDYWxlbmRhckV2ZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHR5cGUgeyBHcm91cENvbG9ycyB9IGZyb20gXCIuL0NhbGVuZGFyVmlld1wiXG5pbXBvcnQgdHlwZSB7IEV2ZW50RHJhZ0hhbmRsZXJDYWxsYmFja3MsIE1vdXNlUG9zIH0gZnJvbSBcIi4vRXZlbnREcmFnSGFuZGxlclwiXG5pbXBvcnQgeyBFdmVudERyYWdIYW5kbGVyIH0gZnJvbSBcIi4vRXZlbnREcmFnSGFuZGxlclwiXG5pbXBvcnQgeyBnZXRQb3NBbmRCb3VuZHNGcm9tTW91c2VFdmVudCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvR3VpVXRpbHNcIlxuaW1wb3J0IHsgVXNlckVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Vc2VyRXJyb3JcIlxuaW1wb3J0IHsgc2hvd1VzZXJFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9FcnJvckhhbmRsZXJJbXBsXCJcbmltcG9ydCB7XG5cdENBTEVOREFSX0VWRU5UX0hFSUdIVCxcblx0Y2hhbmdlUGVyaW9kT25XaGVlbCxcblx0RXZlbnRMYXlvdXRNb2RlLFxuXHRnZXRDYWxlbmRhck1vbnRoLFxuXHRnZXREYXRlRnJvbU1vdXNlUG9zLFxuXHRnZXRFdmVudENvbG9yLFxuXHRsYXlPdXRFdmVudHMsXG5cdFNFTEVDVEVEX0RBVEVfSU5ESUNBVE9SX1RISUNLTkVTUyxcblx0VEVNUE9SQVJZX0VWRU5UX09QQUNJVFksXG59IGZyb20gXCIuLi9ndWkvQ2FsZW5kYXJHdWlVdGlscy5qc1wiXG5pbXBvcnQgdHlwZSB7IENhbGVuZGFyRXZlbnRCdWJibGVDbGlja0hhbmRsZXIsIENhbGVuZGFyRXZlbnRCdWJibGVLZXlEb3duSGFuZGxlciwgRXZlbnRzT25EYXlzIH0gZnJvbSBcIi4vQ2FsZW5kYXJWaWV3TW9kZWxcIlxuaW1wb3J0IHsgVGltZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9UaW1lLmpzXCJcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9DbGllbnREZXRlY3RvclwiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yLmpzXCJcbmltcG9ydCB7IFBhZ2VWaWV3IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9QYWdlVmlldy5qc1wiXG5pbXBvcnQgeyBEYXlzVG9FdmVudHMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJFdmVudHNSZXBvc2l0b3J5LmpzXCJcbmltcG9ydCB7IGlzSU9TQXBwIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0VudlwiXG5pbXBvcnQgeyBnZXRTYWZlQXJlYUluc2V0Qm90dG9tIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvSHRtbFV0aWxzXCJcblxudHlwZSBDYWxlbmRhck1vbnRoQXR0cnMgPSB7XG5cdHNlbGVjdGVkRGF0ZTogRGF0ZVxuXHRvbkRhdGVTZWxlY3RlZDogKGRhdGU6IERhdGUsIGNhbGVuZGFyVmlld1R5cGVUb1Nob3c6IENhbGVuZGFyVmlld1R5cGUpID0+IHVua25vd25cblx0ZXZlbnRzRm9yRGF5czogRGF5c1RvRXZlbnRzXG5cdGdldEV2ZW50c09uRGF5c1RvUmVuZGVyOiAocmFuZ2U6IEFycmF5PERhdGU+KSA9PiBFdmVudHNPbkRheXNcblx0b25OZXdFdmVudDogKGRhdGU6IERhdGUgfCBudWxsKSA9PiB1bmtub3duXG5cdG9uRXZlbnRDbGlja2VkOiBDYWxlbmRhckV2ZW50QnViYmxlQ2xpY2tIYW5kbGVyXG5cdG9uRXZlbnRLZXlEb3duOiBDYWxlbmRhckV2ZW50QnViYmxlS2V5RG93bkhhbmRsZXJcblx0b25DaGFuZ2VNb250aDogKG5leHQ6IGJvb2xlYW4pID0+IHVua25vd25cblx0YW1QbUZvcm1hdDogYm9vbGVhblxuXHRzdGFydE9mVGhlV2VlazogV2Vla1N0YXJ0XG5cdGdyb3VwQ29sb3JzOiBHcm91cENvbG9yc1xuXHRoaWRkZW5DYWxlbmRhcnM6IFJlYWRvbmx5U2V0PElkPlxuXHR0ZW1wb3JhcnlFdmVudHM6IEFycmF5PENhbGVuZGFyRXZlbnQ+XG5cdGRyYWdIYW5kbGVyQ2FsbGJhY2tzOiBFdmVudERyYWdIYW5kbGVyQ2FsbGJhY2tzXG59XG50eXBlIFNpbXBsZVBvc1JlY3QgPSB7XG5cdHRvcDogbnVtYmVyXG5cdGxlZnQ6IG51bWJlclxuXHRyaWdodDogbnVtYmVyXG59XG5cbi8qKiBoZWlnaHQgb2YgdGhlIGRheSBudW1iZXIgaW5kaWNhdG9yIGF0IHRoZSB0b3Agb2YgdGhlIGRheSBzcXVhcmUgKi9cbmNvbnN0IGRheUhlaWdodCA9ICgpID0+IChzdHlsZXMuaXNEZXNrdG9wTGF5b3V0KCkgPyAzMiA6IDI0KVxuXG5jb25zdCBzcGFjZUJldHdlZW5FdmVudHMgPSAoKSA9PiAoc3R5bGVzLmlzRGVza3RvcExheW91dCgpID8gMiA6IDEpXG5cbmNvbnN0IEVWRU5UX0JVQkJMRV9WRVJUSUNBTF9PRkZTRVQgPSA1XG5cbmV4cG9ydCBjbGFzcyBDYWxlbmRhck1vbnRoVmlldyBpbXBsZW1lbnRzIENvbXBvbmVudDxDYWxlbmRhck1vbnRoQXR0cnM+LCBDbGFzc0NvbXBvbmVudDxDYWxlbmRhck1vbnRoQXR0cnM+IHtcblx0cHJpdmF0ZSBtb250aERvbTogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHJlYWRvbmx5IHJlc2l6ZUxpc3RlbmVyOiAoKSA9PiB1bmtub3duXG5cdHByaXZhdGUgcmVhZG9ubHkgem9uZTogc3RyaW5nXG5cdHByaXZhdGUgbGFzdFdpZHRoOiBudW1iZXJcblx0cHJpdmF0ZSBsYXN0SGVpZ2h0OiBudW1iZXJcblx0cHJpdmF0ZSBldmVudERyYWdIYW5kbGVyOiBFdmVudERyYWdIYW5kbGVyXG5cdHByaXZhdGUgZGF5VW5kZXJNb3VzZTogRGF0ZSB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgbGFzdE1vdXNlUG9zOiBNb3VzZVBvcyB8IG51bGwgPSBudWxsXG5cblx0Y29uc3RydWN0b3IoeyBhdHRycyB9OiBWbm9kZTxDYWxlbmRhck1vbnRoQXR0cnM+KSB7XG5cdFx0dGhpcy5yZXNpemVMaXN0ZW5lciA9IG0ucmVkcmF3XG5cdFx0dGhpcy56b25lID0gZ2V0VGltZVpvbmUoKVxuXHRcdHRoaXMubGFzdFdpZHRoID0gMFxuXHRcdHRoaXMubGFzdEhlaWdodCA9IDBcblx0XHR0aGlzLmV2ZW50RHJhZ0hhbmRsZXIgPSBuZXcgRXZlbnREcmFnSGFuZGxlcihuZXZlck51bGwoZG9jdW1lbnQuYm9keSBhcyBIVE1MQm9keUVsZW1lbnQpLCBhdHRycy5kcmFnSGFuZGxlckNhbGxiYWNrcylcblx0fVxuXG5cdG9uY3JlYXRlKCkge1xuXHRcdHdpbmRvd0ZhY2FkZS5hZGRSZXNpemVMaXN0ZW5lcih0aGlzLnJlc2l6ZUxpc3RlbmVyKVxuXHR9XG5cblx0b25yZW1vdmUoKSB7XG5cdFx0d2luZG93RmFjYWRlLnJlbW92ZVJlc2l6ZUxpc3RlbmVyKHRoaXMucmVzaXplTGlzdGVuZXIpXG5cdH1cblxuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8Q2FsZW5kYXJNb250aEF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBzdGFydE9mVGhlV2Vla09mZnNldCA9IGdldFN0YXJ0T2ZUaGVXZWVrT2Zmc2V0KGF0dHJzLnN0YXJ0T2ZUaGVXZWVrKVxuXHRcdGNvbnN0IHRoaXNNb250aCA9IGdldENhbGVuZGFyTW9udGgoYXR0cnMuc2VsZWN0ZWREYXRlLCBzdGFydE9mVGhlV2Vla09mZnNldCwgc3R5bGVzLmlzU2luZ2xlQ29sdW1uTGF5b3V0KCkpXG5cdFx0Y29uc3QgbGFzdE1vbnRoRGF0ZSA9IGluY3JlbWVudE1vbnRoKGF0dHJzLnNlbGVjdGVkRGF0ZSwgLTEpXG5cdFx0Y29uc3QgbmV4dE1vbnRoRGF0ZSA9IGluY3JlbWVudE1vbnRoKGF0dHJzLnNlbGVjdGVkRGF0ZSwgMSlcblx0XHRjb25zdCBwcmV2aW91c01vbnRoID0gZ2V0Q2FsZW5kYXJNb250aChsYXN0TW9udGhEYXRlLCBzdGFydE9mVGhlV2Vla09mZnNldCwgc3R5bGVzLmlzU2luZ2xlQ29sdW1uTGF5b3V0KCkpXG5cdFx0Y29uc3QgbmV4dE1vbnRoID0gZ2V0Q2FsZW5kYXJNb250aChuZXh0TW9udGhEYXRlLCBzdGFydE9mVGhlV2Vla09mZnNldCwgc3R5bGVzLmlzU2luZ2xlQ29sdW1uTGF5b3V0KCkpXG5cblx0XHRjb25zdCBpc0Rlc2t0b3BMYXlvdXQgPSBzdHlsZXMuaXNEZXNrdG9wTGF5b3V0KClcblxuXHRcdGxldCBjb250YWluZXJTdHlsZVxuXHRcdGxldCB3ZWVrZGF5RGF5c0NsYXNzZXMgPSBcIlwiXG5cdFx0aWYgKGlzRGVza3RvcExheW91dCkge1xuXHRcdFx0Y29udGFpbmVyU3R5bGUgPSB7XG5cdFx0XHRcdG92ZXJmbG93OiBcImhpZGRlblwiLFxuXHRcdFx0XHRtYXJnaW5Cb3R0b206IHB4KHNpemUuaHBhZF9sYXJnZSksXG5cdFx0XHR9XG5cdFx0XHR3ZWVrZGF5RGF5c0NsYXNzZXMgPSBcImNvbnRlbnQtYmcgYm9yZGVyLXJhZGl1cy10b3AtbGVmdC1iaWcgYm9yZGVyLXJhZGl1cy10b3AtcmlnaHQtYmlnXCJcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29udGFpbmVyU3R5bGUgPSB7XG5cdFx0XHRcdHBhZGRpbmdCb3R0b206IGlzSU9TQXBwKCkgJiYgY2xpZW50LmlzQ2FsZW5kYXJBcHAoKSA/IHB4KGdldFNhZmVBcmVhSW5zZXRCb3R0b20oKSkgOiBudWxsLFxuXHRcdFx0fVxuXHRcdFx0d2Vla2RheURheXNDbGFzc2VzID0gXCJuYXYtYmdcIlxuXHRcdH1cblxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIuZmlsbC1hYnNvbHV0ZS5mbGV4LmNvbFwiLFxuXHRcdFx0e1xuXHRcdFx0XHRjbGFzczogaXNEZXNrdG9wTGF5b3V0ID8gXCIgbWxyLWwgYm9yZGVyLXJhZGl1cy1iaWdcIiA6IFwibWxyLXNhZmUtaW5zZXRcIixcblx0XHRcdFx0c3R5bGU6IGlzRGVza3RvcExheW91dCA/IHsgbWFyZ2luTGVmdDogcHgoNSkgfSA6IG51bGwsXG5cdFx0XHRcdG9ud2hlZWw6IGNoYW5nZVBlcmlvZE9uV2hlZWwoYXR0cnMub25DaGFuZ2VNb250aCksXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLmZsZXgucHQtcy5wYi1tXCIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y2xhc3M6IHdlZWtkYXlEYXlzQ2xhc3Nlcyxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHRoaXNNb250aC53ZWVrZGF5cy5tYXAoKHdkKSA9PiBtKFwiLmZsZXgtZ3Jvd1wiLCBtKFwiLmNhbGVuZGFyLWRheS1pbmRpY2F0b3IuYlwiLCB3ZCkpKSxcblx0XHRcdFx0KSxcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcIi5mbGV4LmNvbC5yZWwuZmxleC1ncm93Lm92ZXJmbG93LWhpZGRlblwiLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNsYXNzOlxuXHRcdFx0XHRcdFx0XHQoIXN0eWxlcy5pc1VzaW5nQm90dG9tTmF2aWdhdGlvbigpIHx8IChpc0lPU0FwcCgpICYmIGNsaWVudC5pc0NhbGVuZGFyQXBwKCkpID8gXCJjb250ZW50LWJnXCIgOiBcIlwiKSArXG5cdFx0XHRcdFx0XHRcdCghaXNEZXNrdG9wTGF5b3V0ID8gXCIgYm9yZGVyLXJhZGl1cy10b3AtbGVmdC1iaWcgYm9yZGVyLXJhZGl1cy10b3AtcmlnaHQtYmlnXCIgOiBcIlwiKSxcblx0XHRcdFx0XHRcdHN0eWxlOiBjb250YWluZXJTdHlsZSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG0oUGFnZVZpZXcsIHtcblx0XHRcdFx0XHRcdHByZXZpb3VzUGFnZToge1xuXHRcdFx0XHRcdFx0XHRrZXk6IGdldEZpcnN0RGF5T2ZNb250aChsYXN0TW9udGhEYXRlKS5nZXRUaW1lKCksXG5cdFx0XHRcdFx0XHRcdG5vZGVzOiB0aGlzLm1vbnRoRG9tID8gdGhpcy5yZW5kZXJDYWxlbmRhcihhdHRycywgcHJldmlvdXNNb250aCwgdGhpc01vbnRoLCB0aGlzLnpvbmUpIDogbnVsbCxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRjdXJyZW50UGFnZToge1xuXHRcdFx0XHRcdFx0XHRrZXk6IGdldEZpcnN0RGF5T2ZNb250aChhdHRycy5zZWxlY3RlZERhdGUpLmdldFRpbWUoKSxcblx0XHRcdFx0XHRcdFx0bm9kZXM6IHRoaXMucmVuZGVyQ2FsZW5kYXIoYXR0cnMsIHRoaXNNb250aCwgdGhpc01vbnRoLCB0aGlzLnpvbmUpLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG5leHRQYWdlOiB7XG5cdFx0XHRcdFx0XHRcdGtleTogZ2V0Rmlyc3REYXlPZk1vbnRoKG5leHRNb250aERhdGUpLmdldFRpbWUoKSxcblx0XHRcdFx0XHRcdFx0bm9kZXM6IHRoaXMubW9udGhEb20gPyB0aGlzLnJlbmRlckNhbGVuZGFyKGF0dHJzLCBuZXh0TW9udGgsIHRoaXNNb250aCwgdGhpcy56b25lKSA6IG51bGwsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0b25DaGFuZ2VQYWdlOiAobmV4dCkgPT4gYXR0cnMub25DaGFuZ2VNb250aChuZXh0KSxcblx0XHRcdFx0XHR9KSxcblx0XHRcdFx0KSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0b25iZWZvcmV1cGRhdGUobmV3Vm5vZGU6IFZub2RlPENhbGVuZGFyTW9udGhBdHRycz4sIG9sZFZub2RlOiBWbm9kZURPTTxDYWxlbmRhck1vbnRoQXR0cnM+KTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgZG9tID0gdGhpcy5tb250aERvbVxuXHRcdGNvbnN0IGRpZmZlcmVudCA9XG5cdFx0XHQhZG9tIHx8XG5cdFx0XHRvbGRWbm9kZS5hdHRycy5ldmVudHNGb3JEYXlzICE9PSBuZXdWbm9kZS5hdHRycy5ldmVudHNGb3JEYXlzIHx8XG5cdFx0XHRvbGRWbm9kZS5hdHRycy5zZWxlY3RlZERhdGUgIT09IG5ld1Zub2RlLmF0dHJzLnNlbGVjdGVkRGF0ZSB8fFxuXHRcdFx0b2xkVm5vZGUuYXR0cnMuYW1QbUZvcm1hdCAhPT0gbmV3Vm5vZGUuYXR0cnMuYW1QbUZvcm1hdCB8fFxuXHRcdFx0IWRlZXBFcXVhbChvbGRWbm9kZS5hdHRycy5ncm91cENvbG9ycywgbmV3Vm5vZGUuYXR0cnMuZ3JvdXBDb2xvcnMpIHx8XG5cdFx0XHRvbGRWbm9kZS5hdHRycy5oaWRkZW5DYWxlbmRhcnMgIT09IG5ld1Zub2RlLmF0dHJzLmhpZGRlbkNhbGVuZGFycyB8fFxuXHRcdFx0ZG9tLm9mZnNldFdpZHRoICE9PSB0aGlzLmxhc3RXaWR0aCB8fFxuXHRcdFx0ZG9tLm9mZnNldEhlaWdodCAhPT0gdGhpcy5sYXN0SGVpZ2h0XG5cblx0XHRpZiAoZG9tKSB7XG5cdFx0XHR0aGlzLmxhc3RXaWR0aCA9IGRvbS5vZmZzZXRXaWR0aFxuXHRcdFx0dGhpcy5sYXN0SGVpZ2h0ID0gZG9tLm9mZnNldEhlaWdodFxuXHRcdH1cblxuXHRcdHJldHVybiBkaWZmZXJlbnQgfHwgdGhpcy5ldmVudERyYWdIYW5kbGVyLnF1ZXJ5SGFzQ2hhbmdlZCgpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckNhbGVuZGFyKGF0dHJzOiBDYWxlbmRhck1vbnRoQXR0cnMsIG1vbnRoOiBDYWxlbmRhck1vbnRoLCBjdXJyZW50bHlWaXNpYmxlTW9udGg6IENhbGVuZGFyTW9udGgsIHpvbmU6IHN0cmluZyk6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IHdlZWtzIH0gPSBtb250aFxuXHRcdGNvbnN0IGlzVmlzaWJsZSA9IG1vbnRoID09PSBjdXJyZW50bHlWaXNpYmxlTW9udGhcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmZpbGwtYWJzb2x1dGUuZmxleC5jb2wuZmxleC1ncm93XCIsXG5cdFx0XHR7XG5cdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+IHtcblx0XHRcdFx0XHRpZiAoaXNWaXNpYmxlKSB7XG5cdFx0XHRcdFx0XHR0aGlzLm1vbnRoRG9tID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50XG5cdFx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbnVwZGF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0aWYgKGlzVmlzaWJsZSkge1xuXHRcdFx0XHRcdFx0dGhpcy5tb250aERvbSA9IHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0b25tb3VzZW1vdmU6IChtb3VzZUV2ZW50OiBNb3VzZUV2ZW50ICYgeyByZWRyYXc/OiBib29sZWFuIH0pID0+IHtcblx0XHRcdFx0XHRtb3VzZUV2ZW50LnJlZHJhdyA9IGZhbHNlXG5cdFx0XHRcdFx0Y29uc3QgcG9zQW5kQm91bmRzRnJvbU1vdXNlRXZlbnQgPSBnZXRQb3NBbmRCb3VuZHNGcm9tTW91c2VFdmVudChtb3VzZUV2ZW50KVxuXHRcdFx0XHRcdHRoaXMubGFzdE1vdXNlUG9zID0gcG9zQW5kQm91bmRzRnJvbU1vdXNlRXZlbnRcblx0XHRcdFx0XHR0aGlzLmRheVVuZGVyTW91c2UgPSBnZXREYXRlRnJvbU1vdXNlUG9zKFxuXHRcdFx0XHRcdFx0cG9zQW5kQm91bmRzRnJvbU1vdXNlRXZlbnQsXG5cdFx0XHRcdFx0XHR3ZWVrcy5tYXAoKHdlZWspID0+IHdlZWsubWFwKChkYXkpID0+IGRheS5kYXRlKSksXG5cdFx0XHRcdFx0KVxuXG5cdFx0XHRcdFx0dGhpcy5ldmVudERyYWdIYW5kbGVyLmhhbmRsZURyYWcodGhpcy5kYXlVbmRlck1vdXNlLCBwb3NBbmRCb3VuZHNGcm9tTW91c2VFdmVudClcblx0XHRcdFx0fSxcblx0XHRcdFx0b25tb3VzZXVwOiAobW91c2VFdmVudDogTW91c2VFdmVudCAmIHsgcmVkcmF3PzogYm9vbGVhbiB9KSA9PiB7XG5cdFx0XHRcdFx0bW91c2VFdmVudC5yZWRyYXcgPSBmYWxzZVxuXG5cdFx0XHRcdFx0dGhpcy5lbmREcmFnKG1vdXNlRXZlbnQpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9ubW91c2VsZWF2ZTogKG1vdXNlRXZlbnQ6IE1vdXNlRXZlbnQgJiB7IHJlZHJhdz86IGJvb2xlYW4gfSkgPT4ge1xuXHRcdFx0XHRcdG1vdXNlRXZlbnQucmVkcmF3ID0gZmFsc2VcblxuXHRcdFx0XHRcdGlmICh0aGlzLmV2ZW50RHJhZ0hhbmRsZXIuaXNEcmFnZ2luZykge1xuXHRcdFx0XHRcdFx0dGhpcy5ldmVudERyYWdIYW5kbGVyLmNhbmNlbERyYWcoKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHR3ZWVrcy5tYXAoKHdlZWssIHdlZWtJbmRleCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gbShcblx0XHRcdFx0XHRcIi5mbGV4LmZsZXgtZ3Jvdy5yZWxcIixcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRrZXk6IHdlZWtbMF0uZGF0ZS5nZXRUaW1lKCksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRbXG5cdFx0XHRcdFx0XHR3ZWVrLm1hcCgoZGF5LCBpKSA9PiB0aGlzLnJlbmRlckRheShhdHRycywgZGF5LCBpLCB3ZWVrSW5kZXggPT09IDApKSxcblx0XHRcdFx0XHRcdHRoaXMubW9udGhEb20gPyB0aGlzLnJlbmRlcldlZWtFdmVudHMoYXR0cnMsIHdlZWssIHpvbmUsICFpc1Zpc2libGUpIDogbnVsbCxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHQpXG5cdFx0XHR9KSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIGVuZERyYWcocG9zOiBNb3VzZVBvcykge1xuXHRcdGNvbnN0IGRheVVuZGVyTW91c2UgPSB0aGlzLmRheVVuZGVyTW91c2Vcblx0XHRjb25zdCBvcmlnaW5hbERhdGUgPSB0aGlzLmV2ZW50RHJhZ0hhbmRsZXIub3JpZ2luYWxFdmVudD8uc3RhcnRUaW1lXG5cblx0XHRpZiAoZGF5VW5kZXJNb3VzZSAmJiBvcmlnaW5hbERhdGUpIHtcblx0XHRcdC8vbWFrZSBzdXJlIHRoZSBkYXRlIHdlIG1vdmUgdG8gYWxzbyBnZXRzIGEgdGltZVxuXHRcdFx0Y29uc3QgZGF0ZVVuZGVyTW91c2UgPSBUaW1lLmZyb21EYXRlKG9yaWdpbmFsRGF0ZSkudG9EYXRlKGRheVVuZGVyTW91c2UpXG5cblx0XHRcdHRoaXMuZXZlbnREcmFnSGFuZGxlci5lbmREcmFnKGRhdGVVbmRlck1vdXNlLCBwb3MpLmNhdGNoKG9mQ2xhc3MoVXNlckVycm9yLCBzaG93VXNlckVycm9yKSlcblx0XHR9XG5cdH1cblxuXHQvKiogcmVuZGVyIHRoZSBncmlkIG9mIGRheXMgKi9cblx0cHJpdmF0ZSByZW5kZXJEYXkoYXR0cnM6IENhbGVuZGFyTW9udGhBdHRycywgZGF5OiBDYWxlbmRhckRheSwgd2Vla0RheU51bWJlcjogbnVtYmVyLCBmaXJzdFdlZWs6IGJvb2xlYW4pOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5jYWxlbmRhci1kYXkuY2FsZW5kYXItY29sdW1uLWJvcmRlci5mbGV4LWdyb3cucmVsLm92ZXJmbG93LWhpZGRlbi5maWxsLWFic29sdXRlLmN1cnNvci1wb2ludGVyXCIsXG5cdFx0XHR7XG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0Li4uKGZpcnN0V2VlayAmJiAhc3R5bGVzLmlzRGVza3RvcExheW91dCgpID8geyBib3JkZXJUb3A6IFwibm9uZVwiIH0gOiB7fSksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGtleTogZGF5LmRhdGUuZ2V0VGltZSgpLFxuXHRcdFx0XHRvbmNsaWNrOiAoZTogTW91c2VFdmVudCkgPT4ge1xuXHRcdFx0XHRcdGlmIChjbGllbnQuaXNEZXNrdG9wRGV2aWNlKCkpIHtcblx0XHRcdFx0XHRcdGNvbnN0IG5ld0RhdGUgPSBzZXROZXh0SGFsZkhvdXIobmV3IERhdGUoZGF5LmRhdGUpKVxuXG5cdFx0XHRcdFx0XHRhdHRycy5vbkRhdGVTZWxlY3RlZChuZXcgRGF0ZShkYXkuZGF0ZSksIENhbGVuZGFyVmlld1R5cGUuTU9OVEgpXG5cdFx0XHRcdFx0XHRhdHRycy5vbk5ld0V2ZW50KG5ld0RhdGUpXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGF0dHJzLm9uRGF0ZVNlbGVjdGVkKG5ldyBEYXRlKGRheS5kYXRlKSwgc3R5bGVzLmlzRGVza3RvcExheW91dCgpID8gQ2FsZW5kYXJWaWV3VHlwZS5EQVkgOiBDYWxlbmRhclZpZXdUeXBlLkFHRU5EQSlcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRbXG5cdFx0XHRcdG0oXCIubWIteHNcIiwge1xuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRoZWlnaHQ6IHB4KFNFTEVDVEVEX0RBVEVfSU5ESUNBVE9SX1RISUNLTkVTUyksXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSksXG5cdFx0XHRcdHRoaXMucmVuZGVyRGF5SGVhZGVyKGRheSwgYXR0cnMub25EYXRlU2VsZWN0ZWQpLCAvLyBBY2NvcmRpbmcgdG8gSVNPIDg2MDEsIHdlZWtzIGFsd2F5cyBzdGFydCBvbiBNb25kYXkuIFdlZWsgbnVtYmVyaW5nIHN5c3RlbXMgZm9yXG5cdFx0XHRcdC8vIHdlZWtzIHRoYXQgZG8gbm90IHN0YXJ0IG9uIE1vbmRheSBhcmUgbm90IHN0cmljdGx5IGRlZmluZWQsIHNvIHdlIG9ubHkgZGlzcGxheVxuXHRcdFx0XHQvLyBhIHdlZWsgbnVtYmVyIGlmIHRoZSB1c2VyJ3MgY2xpZW50IGlzIGNvbmZpZ3VyZWQgdG8gc3RhcnQgd2Vla3Mgb24gTW9uZGF5XG5cdFx0XHRcdHdlZWtEYXlOdW1iZXIgPT09IDAgJiYgYXR0cnMuc3RhcnRPZlRoZVdlZWsgPT09IFdlZWtTdGFydC5NT05EQVlcblx0XHRcdFx0XHQ/IG0oXG5cdFx0XHRcdFx0XHRcdFwiLmNhbGVuZGFyLW1vbnRoLXdlZWstbnVtYmVyLmFicy56M1wiLFxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0b25jbGljazogKGU6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRcdFx0XHRcdFx0XHRcdGF0dHJzLm9uRGF0ZVNlbGVjdGVkKG5ldyBEYXRlKGRheS5kYXRlKSwgQ2FsZW5kYXJWaWV3VHlwZS5XRUVLKVxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdGdldFdlZWtOdW1iZXIoZGF5LmRhdGUpLFxuXHRcdFx0XHRcdCAgKVxuXHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJEYXlIZWFkZXIoXG5cdFx0eyBkYXRlLCBkYXksIGlzUGFkZGluZ0RheSB9OiBDYWxlbmRhckRheSxcblx0XHRvbkRhdGVTZWxlY3RlZDogKGRhdGU6IERhdGUsIGNhbGVuZGFyVmlld1R5cGVUb1Nob3c6IENhbGVuZGFyVmlld1R5cGUpID0+IHVua25vd24sXG5cdCk6IENoaWxkcmVuIHtcblx0XHRjb25zdCBzaXplID0gc3R5bGVzLmlzRGVza3RvcExheW91dCgpID8gcHgoMjIpIDogcHgoMjApXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5yZWwuY2xpY2suZmxleC5pdGVtcy1jZW50ZXIuanVzdGlmeS1jZW50ZXIucmVsLm1sLWhwYWRfc21hbGxcIixcblx0XHRcdHtcblx0XHRcdFx0XCJhcmlhLWxhYmVsXCI6IGRhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKCksXG5cdFx0XHRcdG9uY2xpY2s6IChlOiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0b25EYXRlU2VsZWN0ZWQobmV3IERhdGUoZGF0ZSksIGNsaWVudC5pc0Rlc2t0b3BEZXZpY2UoKSB8fCBzdHlsZXMuaXNEZXNrdG9wTGF5b3V0KCkgPyBDYWxlbmRhclZpZXdUeXBlLkRBWSA6IENhbGVuZGFyVmlld1R5cGUuQUdFTkRBKVxuXHRcdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRbXG5cdFx0XHRcdG0oXCIuYWJzLnoxLmNpcmNsZVwiLCB7XG5cdFx0XHRcdFx0Y2xhc3M6IGlzVG9kYXkoZGF0ZSkgPyBcImNhbGVuZGFyLWN1cnJlbnQtZGF5LWNpcmNsZVwiIDogXCJcIixcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0d2lkdGg6IHNpemUsXG5cdFx0XHRcdFx0XHRoZWlnaHQ6IHNpemUsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSksXG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIuZnVsbC13aWR0aC5oZWlnaHQtMTAwcC5jZW50ZXIuejJcIixcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjbGFzczogaXNUb2RheShkYXRlKSA/IFwiY2FsZW5kYXItY3VycmVudC1kYXktdGV4dFwiIDogXCJcIixcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdG9wYWNpdHk6IGlzUGFkZGluZ0RheSA/IDAuNCA6IDEsXG5cdFx0XHRcdFx0XHRcdGZvbnRXZWlnaHQ6IGlzUGFkZGluZ0RheSA/IFwiNTAwXCIgOiBudWxsLFxuXHRcdFx0XHRcdFx0XHRmb250U2l6ZTogc3R5bGVzLmlzRGVza3RvcExheW91dCgpID8gXCIxNHB4XCIgOiBcIjEycHhcIixcblx0XHRcdFx0XHRcdFx0bGluZUhlaWdodDogc2l6ZSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRTdHJpbmcoZGF5KSxcblx0XHRcdFx0KSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0LyoqIHJlbmRlciB0aGUgZXZlbnRzIGZvciB0aGUgZ2l2ZW4gd2VlayAqL1xuXHRwcml2YXRlIHJlbmRlcldlZWtFdmVudHMoYXR0cnM6IENhbGVuZGFyTW9udGhBdHRycywgd2VlazogUmVhZG9ubHlBcnJheTxDYWxlbmRhckRheT4sIHpvbmU6IHN0cmluZywgaXNEaXNhYmxlZDogYm9vbGVhbik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBldmVudHNPbkRheXMgPSBhdHRycy5nZXRFdmVudHNPbkRheXNUb1JlbmRlcih3ZWVrLm1hcCgoZGF5KSA9PiBkYXkuZGF0ZSkpXG5cdFx0Y29uc3QgZXZlbnRzID0gbmV3IFNldChldmVudHNPbkRheXMubG9uZ0V2ZW50cy5jb25jYXQoZXZlbnRzT25EYXlzLnNob3J0RXZlbnRzUGVyRGF5LmZsYXQoKSkpXG5cdFx0Y29uc3QgZmlyc3REYXlPZldlZWsgPSB3ZWVrWzBdLmRhdGVcblx0XHRjb25zdCBsYXN0RGF5T2ZXZWVrID0gbGFzdFRocm93KHdlZWspXG5cblx0XHRjb25zdCBkYXlXaWR0aCA9IHRoaXMuZ2V0V2lkdGhGb3JEYXkoKVxuXG5cdFx0Y29uc3Qgd2Vla0hlaWdodCA9IHRoaXMuZ2V0SGVpZ2h0Rm9yV2VlaygpXG5cblx0XHRjb25zdCBldmVudEhlaWdodCA9IHNpemUuY2FsZW5kYXJfbGluZV9oZWlnaHQgKyBzcGFjZUJldHdlZW5FdmVudHMoKSAvLyBoZWlnaHQgKyBib3JkZXJcblxuXHRcdGNvbnN0IG1heEV2ZW50c1BlckRheSA9ICh3ZWVrSGVpZ2h0IC0gZGF5SGVpZ2h0KCkpIC8gZXZlbnRIZWlnaHRcblx0XHRjb25zdCBudW1iZXJPZkV2ZW50c1BlckRheVRvUmVuZGVyID0gTWF0aC5mbG9vcihtYXhFdmVudHNQZXJEYXkpIC0gMSAvLyBwcmVzZXJ2ZSBzb21lIHNwYWNlIGZvciB0aGUgbW9yZSBldmVudHMgaW5kaWNhdG9yXG5cblx0XHQvKiogaW5pdGlhbGx5LCB3ZSBoYXZlIDAgZXh0cmEsIG5vbi1yZW5kZXJlZCBldmVudHMgb24gZWFjaCBkYXkgb2YgdGhlIHdlZWsgKi9cblx0XHRjb25zdCBtb3JlRXZlbnRzRm9yRGF5ID0gWzAsIDAsIDAsIDAsIDAsIDAsIDBdXG5cdFx0Y29uc3QgZXZlbnRNYXJnaW4gPSBzdHlsZXMuaXNEZXNrdG9wTGF5b3V0KCkgPyBzaXplLmNhbGVuZGFyX2V2ZW50X21hcmdpbiA6IHNpemUuY2FsZW5kYXJfZXZlbnRfbWFyZ2luX21vYmlsZVxuXHRcdGNvbnN0IGZpcnN0RGF5T2ZOZXh0V2VlayA9IGdldFN0YXJ0T2ZOZXh0RGF5V2l0aFpvbmUobGFzdERheU9mV2Vlay5kYXRlLCB6b25lKVxuXHRcdHJldHVybiBsYXlPdXRFdmVudHMoXG5cdFx0XHRBcnJheS5mcm9tKGV2ZW50cyksXG5cdFx0XHR6b25lLFxuXHRcdFx0KGNvbHVtbnMpID0+IHtcblx0XHRcdFx0cmV0dXJuIGNvbHVtbnNcblx0XHRcdFx0XHQubWFwKChldmVudHNJbkNvbHVtbiwgY29sdW1uSW5kZXgpID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiBldmVudHNJbkNvbHVtbi5tYXAoKGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGlmIChjb2x1bW5JbmRleCA8IG51bWJlck9mRXZlbnRzUGVyRGF5VG9SZW5kZXIpIHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBldmVudElzQWxsRGF5ID0gaXNBbGxEYXlFdmVudEJ5VGltZXMoZXZlbnQuc3RhcnRUaW1lLCBldmVudC5lbmRUaW1lKVxuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IGV2ZW50U3RhcnQgPSBldmVudElzQWxsRGF5ID8gZ2V0QWxsRGF5RGF0ZUZvclRpbWV6b25lKGV2ZW50LnN0YXJ0VGltZSwgem9uZSkgOiBldmVudC5zdGFydFRpbWVcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBldmVudEVuZCA9IGV2ZW50SXNBbGxEYXkgPyBpbmNyZW1lbnREYXRlKGdldEV2ZW50RW5kKGV2ZW50LCB6b25lKSwgLTEpIDogZXZlbnQuZW5kVGltZVxuXG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgcG9zaXRpb24gPSB0aGlzLmdldEV2ZW50UG9zaXRpb24oXG5cdFx0XHRcdFx0XHRcdFx0XHRldmVudFN0YXJ0LFxuXHRcdFx0XHRcdFx0XHRcdFx0ZXZlbnRFbmQsXG5cdFx0XHRcdFx0XHRcdFx0XHRmaXJzdERheU9mV2Vlayxcblx0XHRcdFx0XHRcdFx0XHRcdGZpcnN0RGF5T2ZOZXh0V2Vlayxcblx0XHRcdFx0XHRcdFx0XHRcdGRheVdpZHRoLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZGF5SGVpZ2h0KCksXG5cdFx0XHRcdFx0XHRcdFx0XHRjb2x1bW5JbmRleCxcblx0XHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMucmVuZGVyRXZlbnQoZXZlbnQsIHBvc2l0aW9uLCBldmVudFN0YXJ0LCBmaXJzdERheU9mV2VlaywgZmlyc3REYXlPZk5leHRXZWVrLCBldmVudEVuZCwgYXR0cnMsIGlzRGlzYWJsZWQpXG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0Zm9yIChjb25zdCBbZGF5SW5kZXgsIGRheUluV2Vla10gb2Ygd2Vlay5lbnRyaWVzKCkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IGV2ZW50c0ZvckRheSA9IGF0dHJzLmV2ZW50c0ZvckRheXMuZ2V0KGRheUluV2Vlay5kYXRlLmdldFRpbWUoKSlcblxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKGV2ZW50c0ZvckRheSAmJiBldmVudHNGb3JEYXkuaW5kZXhPZihldmVudCkgIT09IC0xKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdG1vcmVFdmVudHNGb3JEYXlbZGF5SW5kZXhdKytcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5jb25jYXQoXG5cdFx0XHRcdFx0XHRtb3JlRXZlbnRzRm9yRGF5Lm1hcCgobW9yZUV2ZW50c0NvdW50LCB3ZWVrZGF5KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGRheSA9IHdlZWtbd2Vla2RheV1cblx0XHRcdFx0XHRcdFx0Y29uc3QgaXNQYWRkaW5nID0gZGF5LmlzUGFkZGluZ0RheVxuXG5cdFx0XHRcdFx0XHRcdGlmIChtb3JlRXZlbnRzQ291bnQgPiAwKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG0oXG5cdFx0XHRcdFx0XHRcdFx0XHRcIi5hYnMuc21hbGxcIiArIChpc1BhZGRpbmcgPyBcIi5jYWxlbmRhci1idWJibGUtbW9yZS1wYWRkaW5nLWRheVwiIDogXCJcIiksXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ym90dG9tOiAwLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGhlaWdodDogcHgoQ0FMRU5EQVJfRVZFTlRfSEVJR0hUKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsZWZ0OiBweCh3ZWVrZGF5ICogZGF5V2lkdGggKyBldmVudE1hcmdpbiksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0d2lkdGg6IHB4KGRheVdpZHRoIC0gMiAtIGV2ZW50TWFyZ2luICogMiksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cG9pbnRlckV2ZW50czogXCJub25lXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcImZvbnQtd2VpZ2h0XCI6IFwiNjAwXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCIrXCIgKyBtb3JlRXZlbnRzQ291bnQsXG5cdFx0XHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHQpXG5cdFx0XHR9LFxuXHRcdFx0RXZlbnRMYXlvdXRNb2RlLkRheUJhc2VkQ29sdW1uLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRXZlbnQoXG5cdFx0ZXZlbnQ6IENhbGVuZGFyRXZlbnQsXG5cdFx0cG9zaXRpb246IFNpbXBsZVBvc1JlY3QsXG5cdFx0ZXZlbnRTdGFydDogRGF0ZSxcblx0XHRmaXJzdERheU9mV2VlazogRGF0ZSxcblx0XHRmaXJzdERheU9mTmV4dFdlZWs6IERhdGUsXG5cdFx0ZXZlbnRFbmQ6IERhdGUsXG5cdFx0YXR0cnM6IENhbGVuZGFyTW9udGhBdHRycyxcblx0XHRpc0Rpc2FibGVkOiBib29sZWFuLFxuXHQpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgaXNUZW1wb3JhcnkgPSBhdHRycy50ZW1wb3JhcnlFdmVudHMuaW5jbHVkZXMoZXZlbnQpXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5hYnMub3ZlcmZsb3ctaGlkZGVuXCIsXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogZXZlbnQuX2lkWzBdICsgZXZlbnQuX2lkWzFdICsgZXZlbnQuc3RhcnRUaW1lLmdldFRpbWUoKSxcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHR0b3A6IHB4KHBvc2l0aW9uLnRvcCksXG5cdFx0XHRcdFx0aGVpZ2h0OiBweChDQUxFTkRBUl9FVkVOVF9IRUlHSFQpLFxuXHRcdFx0XHRcdGxlZnQ6IHB4KHBvc2l0aW9uLmxlZnQpLFxuXHRcdFx0XHRcdHJpZ2h0OiBweChwb3NpdGlvbi5yaWdodCksXG5cdFx0XHRcdFx0cG9pbnRlckV2ZW50czogIXN0eWxlcy5pc1VzaW5nQm90dG9tTmF2aWdhdGlvbigpID8gXCJhdXRvXCIgOiBcIm5vbmVcIixcblx0XHRcdFx0fSxcblx0XHRcdFx0b25tb3VzZWRvd246ICgpID0+IHtcblx0XHRcdFx0XHRsZXQgZGF5VW5kZXJNb3VzZSA9IHRoaXMuZGF5VW5kZXJNb3VzZVxuXHRcdFx0XHRcdGxldCBsYXN0TW91c2VQb3MgPSB0aGlzLmxhc3RNb3VzZVBvc1xuXG5cdFx0XHRcdFx0aWYgKGRheVVuZGVyTW91c2UgJiYgbGFzdE1vdXNlUG9zICYmICFpc1RlbXBvcmFyeSkge1xuXHRcdFx0XHRcdFx0dGhpcy5ldmVudERyYWdIYW5kbGVyLnByZXBhcmVEcmFnKGV2ZW50LCBkYXlVbmRlck1vdXNlLCBsYXN0TW91c2VQb3MsIHRydWUpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdG0oQ29udGludWluZ0NhbGVuZGFyRXZlbnRCdWJibGUsIHtcblx0XHRcdFx0ZXZlbnQ6IGV2ZW50LFxuXHRcdFx0XHRzdGFydHNCZWZvcmU6IGV2ZW50U3RhcnQgPCBmaXJzdERheU9mV2Vlayxcblx0XHRcdFx0ZW5kc0FmdGVyOiBmaXJzdERheU9mTmV4dFdlZWsgPCBldmVudEVuZCxcblx0XHRcdFx0Y29sb3I6IGdldEV2ZW50Q29sb3IoZXZlbnQsIGF0dHJzLmdyb3VwQ29sb3JzKSxcblx0XHRcdFx0c2hvd1RpbWU6IHN0eWxlcy5pc0Rlc2t0b3BMYXlvdXQoKSAmJiAhaXNBbGxEYXlFdmVudChldmVudCkgPyBFdmVudFRleHRUaW1lT3B0aW9uLlNUQVJUX1RJTUUgOiBudWxsLFxuXHRcdFx0XHR1c2VyOiBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXIsXG5cdFx0XHRcdG9uRXZlbnRDbGlja2VkOiAoZSwgZG9tRXZlbnQpID0+IHtcblx0XHRcdFx0XHRhdHRycy5vbkV2ZW50Q2xpY2tlZChldmVudCwgZG9tRXZlbnQpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uRXZlbnRLZXlEb3duOiAoZSwgZG9tRXZlbnQpID0+IHtcblx0XHRcdFx0XHRhdHRycy5vbkV2ZW50S2V5RG93bihldmVudCwgZG9tRXZlbnQpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGZhZGVJbjogIXRoaXMuZXZlbnREcmFnSGFuZGxlci5pc0RyYWdnaW5nLFxuXHRcdFx0XHRvcGFjaXR5OiBpc1RlbXBvcmFyeSA/IFRFTVBPUkFSWV9FVkVOVF9PUEFDSVRZIDogMSxcblx0XHRcdFx0ZW5hYmxlUG9pbnRlckV2ZW50czogIXRoaXMuZXZlbnREcmFnSGFuZGxlci5pc0RyYWdnaW5nICYmICFpc1RlbXBvcmFyeSAmJiBjbGllbnQuaXNEZXNrdG9wRGV2aWNlKCkgJiYgIWlzRGlzYWJsZWQsXG5cdFx0XHR9KSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIGdldEV2ZW50UG9zaXRpb24oXG5cdFx0ZXZlbnRTdGFydDogRGF0ZSxcblx0XHRldmVudEVuZDogRGF0ZSxcblx0XHRmaXJzdERheU9mV2VlazogRGF0ZSxcblx0XHRmaXJzdERheU9mTmV4dFdlZWs6IERhdGUsXG5cdFx0Y2FsZW5kYXJEYXlXaWR0aDogbnVtYmVyLFxuXHRcdGNhbGVuZGFyRGF5SGVpZ2h0OiBudW1iZXIsXG5cdFx0Y29sdW1uSW5kZXg6IG51bWJlcixcblx0KTogU2ltcGxlUG9zUmVjdCB7XG5cdFx0Y29uc3QgdG9wID0gKHNpemUuY2FsZW5kYXJfbGluZV9oZWlnaHQgKyBzcGFjZUJldHdlZW5FdmVudHMoKSkgKiBjb2x1bW5JbmRleCArIGNhbGVuZGFyRGF5SGVpZ2h0ICsgRVZFTlRfQlVCQkxFX1ZFUlRJQ0FMX09GRlNFVFxuXHRcdGNvbnN0IGRheU9mU3RhcnREYXRlSW5XZWVrID0gZ2V0RGlmZkluMjRJbnRlcnZhbHNGYXN0KGV2ZW50U3RhcnQsIGZpcnN0RGF5T2ZXZWVrKVxuXHRcdGNvbnN0IGRheU9mRW5kRGF0ZUluV2VlayA9IGdldERpZmZJbjI0SW50ZXJ2YWxzRmFzdChldmVudEVuZCwgZmlyc3REYXlPZldlZWspXG5cdFx0Y29uc3QgY2FsZW5kYXJFdmVudE1hcmdpbiA9IHN0eWxlcy5pc0Rlc2t0b3BMYXlvdXQoKSA/IHNpemUuY2FsZW5kYXJfZXZlbnRfbWFyZ2luIDogc2l6ZS5jYWxlbmRhcl9ldmVudF9tYXJnaW5fbW9iaWxlXG5cdFx0Y29uc3QgbGVmdCA9IChldmVudFN0YXJ0IDwgZmlyc3REYXlPZldlZWsgPyAwIDogZGF5T2ZTdGFydERhdGVJbldlZWsgKiBjYWxlbmRhckRheVdpZHRoKSArIGNhbGVuZGFyRXZlbnRNYXJnaW5cblx0XHRjb25zdCByaWdodCA9IChldmVudEVuZCA+IGZpcnN0RGF5T2ZOZXh0V2VlayA/IDAgOiAoNiAtIGRheU9mRW5kRGF0ZUluV2VlaykgKiBjYWxlbmRhckRheVdpZHRoKSArIGNhbGVuZGFyRXZlbnRNYXJnaW5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dG9wLFxuXHRcdFx0bGVmdCxcblx0XHRcdHJpZ2h0LFxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgZ2V0SGVpZ2h0Rm9yV2VlaygpOiBudW1iZXIge1xuXHRcdGlmICghdGhpcy5tb250aERvbSkge1xuXHRcdFx0cmV0dXJuIDFcblx0XHR9XG5cblx0XHRjb25zdCBtb250aERvbUhlaWdodCA9IHRoaXMubW9udGhEb20ub2Zmc2V0SGVpZ2h0XG5cdFx0cmV0dXJuIG1vbnRoRG9tSGVpZ2h0IC8gNlxuXHR9XG5cblx0cHJpdmF0ZSBnZXRXaWR0aEZvckRheSgpOiBudW1iZXIge1xuXHRcdGlmICghdGhpcy5tb250aERvbSkge1xuXHRcdFx0cmV0dXJuIDFcblx0XHR9XG5cblx0XHRjb25zdCBtb250aERvbVdpZHRoID0gdGhpcy5tb250aERvbS5vZmZzZXRXaWR0aFxuXHRcdHJldHVybiBtb250aERvbVdpZHRoIC8gN1xuXHR9XG59XG5cbi8qKlxuICogT3B0aW1pemF0aW9uIHRvIG5vdCBjcmVhdGUgbHV4b24ncyBEYXRlVGltZSBpbiBzaW1wbGUgY2FzZS5cbiAqIE1heSBub3Qgd29yayBpZiB3ZSBhbGxvdyBvdmVycmlkZSB0aW1lIHpvbmVzLlxuICovXG5mdW5jdGlvbiBnZXREaWZmSW4yNEludGVydmFsc0Zhc3QobGVmdDogRGF0ZSwgcmlnaHQ6IERhdGUpOiBudW1iZXIge1xuXHRpZiAobGVmdC5nZXRNb250aCgpID09PSByaWdodC5nZXRNb250aCgpKSB7XG5cdFx0cmV0dXJuIGxlZnQuZ2V0RGF0ZSgpIC0gcmlnaHQuZ2V0RGF0ZSgpXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIGdldERpZmZJbjI0aEludGVydmFscyhyaWdodCwgbGVmdClcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgc3RhdGVCZ0ZvY3VzLCBzdGF0ZUJnSG92ZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9idWlsdGluVGhlbWVzLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgc3R5bGVzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvc3R5bGVzLmpzXCJcbmltcG9ydCB7IERlZmF1bHRBbmltYXRpb25UaW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYW5pbWF0aW9uL0FuaW1hdGlvbnMuanNcIlxuaW1wb3J0IHsgcHggfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zaXplLmpzXCJcbmltcG9ydCB7IFRhYkluZGV4IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IGdldERpc3BsYXlFdmVudFRpdGxlIH0gZnJvbSBcIi4uL2d1aS9DYWxlbmRhckd1aVV0aWxzLmpzXCJcbmltcG9ydCB7IGlzQmlydGhkYXlFdmVudCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9DYWxlbmRhclV0aWxzLmpzXCJcblxuZXhwb3J0IGludGVyZmFjZSBDYWxlbmRhckFnZW5kYUl0ZW1WaWV3QXR0cnMge1xuXHRkYXk6IERhdGVcblx0em9uZTogc3RyaW5nXG5cdGV2ZW50OiBDYWxlbmRhckV2ZW50XG5cdGNvbG9yOiBzdHJpbmdcblx0Y2xpY2s6IChkb21FdmVudDogTW91c2VFdmVudCkgPT4gdW5rbm93blxuXHRrZXlEb3duOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHVua25vd25cblx0dGltZVRleHQ6IHN0cmluZ1xuXHRzZWxlY3RlZD86IGJvb2xlYW5cblx0aGVpZ2h0PzogbnVtYmVyXG59XG5cbmV4cG9ydCBjbGFzcyBDYWxlbmRhckFnZW5kYUl0ZW1WaWV3IGltcGxlbWVudHMgQ29tcG9uZW50PENhbGVuZGFyQWdlbmRhSXRlbVZpZXdBdHRycz4ge1xuXHRwcml2YXRlIGlzRm9jdXNlZDogYm9vbGVhbiA9IGZhbHNlXG5cblx0dmlldyh7IGF0dHJzIH06IFZub2RlPENhbGVuZGFyQWdlbmRhSXRlbVZpZXdBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgZXZlbnRUaXRsZSA9IGdldERpc3BsYXlFdmVudFRpdGxlKGF0dHJzLmV2ZW50LnN1bW1hcnkpXG5cblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmZsZXguaXRlbXMtY2VudGVyLmNsaWNrLnBsci5ib3JkZXItcmFkaXVzLnB0LXMucGItcy5yZWwubGltaXQtd2lkdGguZnVsbC13aWR0aFwiLFxuXHRcdFx0e1xuXHRcdFx0XHQvLyBJbXBsZW1lbnQgdGhlIGJhY2tncm91bmQgY29sb3IgdmlhIEphdmFTY3JpcHQgb24gRGVza3RvcCwgc28gd2UgY2FuIHJlYWN0IHRvIGBhdHRycy5zZWxlY3RlZGBcblx0XHRcdFx0Y2xhc3M6IHN0eWxlcy5pc0Rlc2t0b3BMYXlvdXQoKSA/IFwiaGlkZS1vdXRsaW5lXCIgOiBcInN0YXRlLWJnXCIsXG5cdFx0XHRcdHRhYkluZGV4OiBUYWJJbmRleC5EZWZhdWx0LFxuXHRcdFx0XHRvbmNsaWNrOiBhdHRycy5jbGljayxcblx0XHRcdFx0b25rZXlkb3duOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IGF0dHJzLmtleURvd24oZXZlbnQpLFxuXHRcdFx0XHRvbmZvY3VzOiAoKSA9PiAodGhpcy5pc0ZvY3VzZWQgPSB0cnVlKSxcblx0XHRcdFx0b25ibHVyOiAoKSA9PiAodGhpcy5pc0ZvY3VzZWQgPSBmYWxzZSksXG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0dHJhbnNpdGlvbjogYGJhY2tncm91bmQgJHtEZWZhdWx0QW5pbWF0aW9uVGltZX1tc2AsXG5cdFx0XHRcdFx0YmFja2dyb3VuZDogQ2FsZW5kYXJBZ2VuZGFJdGVtVmlldy5nZXRCYWNrZ3JvdW5kKGF0dHJzLnNlbGVjdGVkID8/IGZhbHNlLCB0aGlzLmlzRm9jdXNlZCksXG5cdFx0XHRcdFx0aGVpZ2h0OiBhdHRycy5oZWlnaHQgPyBweChhdHRycy5oZWlnaHQpIDogdW5kZWZpbmVkLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0bShcIi5pY29uLmNpcmNsZS5hYnNcIiwge1xuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IGAjJHthdHRycy5jb2xvcn1gLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRtKFwiLmZsZXguY29sLm1pbi13aWR0aC0wLnBsLXZwYWQtbFwiLCBbbShcInAuYi5tLTAudGV4dC1lbGxpcHNpc1wiLCBldmVudFRpdGxlKSwgbShcIlwiLCBhdHRycy50aW1lVGV4dCldKSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgZ2V0QmFja2dyb3VuZChpc1NlbGVjdGVkOiBib29sZWFuLCBpc0ZvY3VzZWQ6IGJvb2xlYW4pIHtcblx0XHRpZiAoc3R5bGVzLmlzRGVza3RvcExheW91dCgpKSB7XG5cdFx0XHRpZiAoaXNTZWxlY3RlZCkge1xuXHRcdFx0XHRyZXR1cm4gc3RhdGVCZ0hvdmVyXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoaXNGb2N1c2VkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHN0YXRlQmdGb2N1c1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiB0aGVtZS5saXN0X2JnXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZFxuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHsgU3dpcGVIYW5kbGVyIH0gZnJvbSBcIi4vU3dpcGVIYW5kbGVyLmpzXCJcbmltcG9ydCB7IGFuaW1hdGlvbnMsIHRyYW5zZm9ybSwgVHJhbnNmb3JtRW51bSB9IGZyb20gXCIuLi9hbmltYXRpb24vQW5pbWF0aW9ucy5qc1wiXG5cbmV4cG9ydCBjbGFzcyBDYWxlbmRhclN3aXBlSGFuZGxlciBleHRlbmRzIFN3aXBlSGFuZGxlciB7XG5cdF9vbkdlc3R1cmVDb21wbGV0ZWQ6IChuZXh0OiBib29sZWFuKSA9PiB1bmtub3duXG5cdF94b2Zmc2V0OiBudW1iZXIgPSAwXG5cblx0Y29uc3RydWN0b3IodG91Y2hBcmVhOiBIVE1MRWxlbWVudCwgb25HZXN0dXJlQ29tcGxldGVkOiAobmV4dDogYm9vbGVhbikgPT4gdW5rbm93bikge1xuXHRcdHN1cGVyKHRvdWNoQXJlYSlcblx0XHQvLyBhdm9pZCBmbGlja2VyaW5nIGVzcGVjaWFsbHkgaW4gZGF5IGFuZCB3ZWVrIHZpZXcgd2hlbiBvdmVyZmxvdy15IGlzIHNldCBvbiBuZXN0ZWQgZWxlbWVudHNcblx0XHR0b3VjaEFyZWEuc3R5bGUudHJhbnNmb3JtU3R5bGUgPSBcInByZXNlcnZlLTNkXCJcblx0XHR0b3VjaEFyZWEuc3R5bGUuYmFja2ZhY2VWaXNpYmlsaXR5ID0gXCJoaWRkZW5cIlxuXHRcdHRoaXMuX29uR2VzdHVyZUNvbXBsZXRlZCA9IG9uR2VzdHVyZUNvbXBsZXRlZFxuXHR9XG5cblx0b25Ib3Jpem9udGFsRHJhZyh4RGVsdGE6IG51bWJlciwgeURlbHRhOiBudW1iZXIpIHtcblx0XHR0aGlzLl94b2Zmc2V0ID0gTWF0aC5hYnMoeERlbHRhKSA+IDIwID8geERlbHRhIDogMFxuXHRcdHRoaXMudG91Y2hBcmVhLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGVYKCR7dGhpcy5feG9mZnNldH1weClgXG5cdH1cblxuXHRvbkhvcml6b250YWxHZXN0dXJlQ29tcGxldGVkKGRlbHRhOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyIH0pOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAoTWF0aC5hYnMoZGVsdGEueCkgPiAxMDApIHtcblx0XHRcdHRoaXMuX3hvZmZzZXQgPSAwXG5cdFx0XHRyZXR1cm4gYW5pbWF0aW9uc1xuXHRcdFx0XHQuYWRkKHRoaXMudG91Y2hBcmVhLCB0cmFuc2Zvcm0oVHJhbnNmb3JtRW51bS5UcmFuc2xhdGVYLCBkZWx0YS54LCB0aGlzLnRvdWNoQXJlYS5vZmZzZXRXaWR0aCAqIChkZWx0YS54ID4gMCA/IDEgOiAtMSkpKVxuXHRcdFx0XHQudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5fb25HZXN0dXJlQ29tcGxldGVkKGRlbHRhLnggPCAwKVxuXG5cdFx0XHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblx0XHRcdFx0XHRcdHRoaXMudG91Y2hBcmVhLnN0eWxlLnRyYW5zZm9ybSA9IFwiXCJcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5yZXNldChkZWx0YSlcblx0XHR9XG5cdH1cblxuXHRyZXNldChkZWx0YTogeyB4OiBudW1iZXI7IHk6IG51bWJlciB9KTogUHJvbWlzZTxhbnk+IHtcblx0XHRpZiAoTWF0aC5hYnModGhpcy5feG9mZnNldCkgPiAyMCkge1xuXHRcdFx0YW5pbWF0aW9ucy5hZGQodGhpcy50b3VjaEFyZWEsIHRyYW5zZm9ybShUcmFuc2Zvcm1FbnVtLlRyYW5zbGF0ZVgsIGRlbHRhLngsIDApKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnRvdWNoQXJlYS5zdHlsZS50cmFuc2Zvcm0gPSBcIlwiXG5cdFx0fVxuXG5cdFx0dGhpcy5feG9mZnNldCA9IDBcblx0XHRyZXR1cm4gc3VwZXIucmVzZXQoZGVsdGEpXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgQ2FsZW5kYXJTd2lwZUhhbmRsZXIgfSBmcm9tIFwiLi9DYWxlbmRhclN3aXBlSGFuZGxlci5qc1wiXG5pbXBvcnQgeyBsYW5nLCBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi8uLi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcblxudHlwZSBTbGlkZSA9IHsgbGFiZWw6IFRyYW5zbGF0aW9uS2V5OyBlbGVtZW50OiBDaGlsZHJlbiB9XG5cbmludGVyZmFjZSBDYXJvdXNlbEF0dHJzIHtcblx0bGFiZWw6IFRyYW5zbGF0aW9uS2V5XG5cdHNsaWRlczogU2xpZGVbXVxuXHRjbGFzcz86IHN0cmluZ1xuXHRzdHlsZT86IFJlY29yZDxzdHJpbmcsIGFueT5cblx0b25Td2lwZTogKGlzTmV4dDogYm9vbGVhbikgPT4gdm9pZFxufVxuXG5leHBvcnQgY2xhc3MgQ2Fyb3VzZWwgaW1wbGVtZW50cyBDb21wb25lbnQ8Q2Fyb3VzZWxBdHRycz4ge1xuXHRwcml2YXRlIGNvbnRhaW5lckRvbTogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHN3aXBlSGFuZGxlcjogQ2FsZW5kYXJTd2lwZUhhbmRsZXIgfCBudWxsID0gbnVsbFxuXG5cdHZpZXcodm5vZGU6IFZub2RlPENhcm91c2VsQXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGF0dHJzID0gdm5vZGUuYXR0cnNcblx0XHRyZXR1cm4gbShcblx0XHRcdFwic2VjdGlvbi5mbGV4LXNwYWNlLWFyb3VuZC5jb2x1bW4tZ2FwLXNcIixcblx0XHRcdHtcblx0XHRcdFx0cm9sZTogXCJncm91cFwiLFxuXHRcdFx0XHRcImFyaWEtcm9sZWRlc2NyaXB0aW9uXCI6IFwiY2Fyb3VzZWxcIixcblx0XHRcdFx0XCJhcmlhLWxhYmVsXCI6IGxhbmcuZ2V0KGF0dHJzLmxhYmVsKSxcblx0XHRcdFx0Y2xhc3M6IGF0dHJzLmNsYXNzLFxuXHRcdFx0XHRzdHlsZTogYXR0cnMuc3R5bGUsXG5cdFx0XHRcdG9uY3JlYXRlOiAoc3dpcGVyTm9kZSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuY29udGFpbmVyRG9tID0gc3dpcGVyTm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0XHR0aGlzLnN3aXBlSGFuZGxlciA9IG5ldyBDYWxlbmRhclN3aXBlSGFuZGxlcih0aGlzLmNvbnRhaW5lckRvbSwgKGlzTmV4dDogYm9vbGVhbikgPT4gYXR0cnMub25Td2lwZShpc05leHQpKVxuXHRcdFx0XHRcdHRoaXMuc3dpcGVIYW5kbGVyLmF0dGFjaCgpXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0YXR0cnMuc2xpZGVzLm1hcCgoc2xpZGUpID0+IHJlbmRlclNsaWRlKHNsaWRlKSksXG5cdFx0KVxuXHR9XG59XG5cbmZ1bmN0aW9uIHJlbmRlclNsaWRlKHNsaWRlOiBTbGlkZSk6IENoaWxkcmVuIHtcblx0cmV0dXJuIG0oXG5cdFx0XCIuZnVsbC13aWR0aC5taW4td2lkdGgtZnVsbFwiLFxuXHRcdHtcblx0XHRcdHJvbGU6IFwiZ3JvdXBcIixcblx0XHRcdFwiYXJpYS1yb2xlXCI6IFwic2xpZGVcIixcblx0XHRcdFwiYXJpYS1sYWJlbFwiOiBsYW5nLmdldChzbGlkZS5sYWJlbCksXG5cdFx0fSxcblx0XHRzbGlkZS5lbGVtZW50LFxuXHQpXG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIGdldFN0YXJ0T2ZEYXksIGluY3JlbWVudERhdGUsIGlzU2FtZURheU9mRGF0ZSwgaXNUb2RheSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgRGF0ZVRpbWUgfSBmcm9tIFwibHV4b25cIlxuaW1wb3J0IHsgQ2Fyb3VzZWwgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0Nhcm91c2VsLmpzXCJcbmltcG9ydCB7IGNoYW5nZVBlcmlvZE9uV2hlZWwsIGdldENhbGVuZGFyTW9udGggfSBmcm9tIFwiLi4vQ2FsZW5kYXJHdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckRheSwgQ2FsZW5kYXJNb250aCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9DYWxlbmRhclV0aWxzLmpzXCJcbmltcG9ydCB7IERlZmF1bHRBbmltYXRpb25UaW1lIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYW5pbWF0aW9uL0FuaW1hdGlvbnMuanNcIlxuaW1wb3J0IHsgRXhwYW5kZXJQYW5lbCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRXhwYW5kZXIuanNcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS90aGVtZS5qc1wiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL3NpemUuanNcIlxuaW1wb3J0IHsgc3R5bGVzIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvc3R5bGVzLmpzXCJcbmltcG9ydCB7IGhleFRvUkdCQVN0cmluZyB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvQ29sb3IuanNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIERheVNlbGVjdG9yQXR0cnMge1xuXHRzZWxlY3RlZERhdGU6IERhdGUgfCBudWxsXG5cdG9uRGF0ZVNlbGVjdGVkPzogKGRhdGU6IERhdGUsIGRheUNsaWNrOiBib29sZWFuKSA9PiB1bmtub3duXG5cdHdpZGU6IGJvb2xlYW5cblx0c3RhcnRPZlRoZVdlZWtPZmZzZXQ6IG51bWJlclxuXHRpc0RheVNlbGVjdG9yRXhwYW5kZWQ6IGJvb2xlYW5cblx0aGFuZGxlRGF5UGlja2VyU3dpcGU6IChpc05leHQ6IGJvb2xlYW4pID0+IHZvaWRcblx0c2hvd0RheVNlbGVjdGlvbjogYm9vbGVhblxuXHRoaWdobGlnaHRUb2RheTogYm9vbGVhblxuXHRoaWdobGlnaHRTZWxlY3RlZFdlZWs6IGJvb2xlYW5cblx0dXNlTmFycm93V2Vla05hbWU6IGJvb2xlYW5cblx0aGFzRXZlbnRPbjogKGRhdGU6IERhdGUpID0+IGJvb2xlYW5cbn1cblxuLyoqXG4gKiAgRXhwYW5kYWJsZSBEYXRlIHBpY2tlciB1c2VkIG9uIHNpbmdsZS90d28gY29sdW1uIGxheW91dHMuXG4gKiBEaXNwbGF5cyB0aGUgd2VlaywgYW5kIGlmIGV4cGFuZGVkIGRpc3BsYXlzIHRoZSBtb250aC5cbiAqL1xuZXhwb3J0IGNsYXNzIERheVNlbGVjdG9yIGltcGxlbWVudHMgQ29tcG9uZW50PERheVNlbGVjdG9yQXR0cnM+IHtcblx0cHJpdmF0ZSBkaXNwbGF5aW5nRGF0ZTogRGF0ZVxuXHRwcml2YXRlIGxhc3RTZWxlY3RlZERhdGU6IERhdGUgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGhhbmRsZURheVBpY2tlclN3aXBlOiBEYXlTZWxlY3RvckF0dHJzW1wiaGFuZGxlRGF5UGlja2VyU3dpcGVcIl1cblxuXHRjb25zdHJ1Y3Rvcih2bm9kZTogVm5vZGU8RGF5U2VsZWN0b3JBdHRycz4pIHtcblx0XHR0aGlzLmhhbmRsZURheVBpY2tlclN3aXBlID0gdm5vZGUuYXR0cnMuaGFuZGxlRGF5UGlja2VyU3dpcGVcblx0XHR0aGlzLmRpc3BsYXlpbmdEYXRlID0gdm5vZGUuYXR0cnMuc2VsZWN0ZWREYXRlIHx8IGdldFN0YXJ0T2ZEYXkobmV3IERhdGUoKSlcblx0fVxuXG5cdHZpZXcodm5vZGU6IFZub2RlPERheVNlbGVjdG9yQXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdHRoaXMuaGFuZGxlRGF5UGlja2VyU3dpcGUgPSB2bm9kZS5hdHRycy5oYW5kbGVEYXlQaWNrZXJTd2lwZVxuXHRcdGNvbnN0IHNlbGVjdGVkRGF0ZSA9IHZub2RlLmF0dHJzLnNlbGVjdGVkRGF0ZVxuXG5cdFx0aWYgKHNlbGVjdGVkRGF0ZSAmJiAhaXNTYW1lRGF5T2ZEYXRlKHRoaXMubGFzdFNlbGVjdGVkRGF0ZSwgc2VsZWN0ZWREYXRlKSkge1xuXHRcdFx0dGhpcy5sYXN0U2VsZWN0ZWREYXRlID0gc2VsZWN0ZWREYXRlXG5cdFx0XHR0aGlzLmRpc3BsYXlpbmdEYXRlID0gbmV3IERhdGUoc2VsZWN0ZWREYXRlKVxuXG5cdFx0XHR0aGlzLmRpc3BsYXlpbmdEYXRlLnNldERhdGUoMSlcblx0XHR9XG5cblx0XHRsZXQgeyB3ZWVrcywgd2Vla2RheXMgfSA9IGdldENhbGVuZGFyTW9udGgodGhpcy5kaXNwbGF5aW5nRGF0ZSwgdm5vZGUuYXR0cnMuc3RhcnRPZlRoZVdlZWtPZmZzZXQsIHZub2RlLmF0dHJzLnVzZU5hcnJvd1dlZWtOYW1lKVxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIuZmxleC5mbGV4LWNvbHVtblwiLFxuXHRcdFx0e1xuXHRcdFx0XHRvbndoZWVsOiBjaGFuZ2VQZXJpb2RPbldoZWVsKHRoaXMuaGFuZGxlRGF5UGlja2VyU3dpcGUpLFxuXHRcdFx0fSxcblx0XHRcdFttKFwiLmZsZXgtc3BhY2UtYXJvdW5kXCIsIHRoaXMucmVuZGVyV2Vla0RheXModm5vZGUuYXR0cnMud2lkZSwgd2Vla2RheXMpKSwgdGhpcy5yZW5kZXJEYXlQaWNrZXJDYXJvdXNlbCh2bm9kZSldLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRGF5UGlja2VyQ2Fyb3VzZWwodm5vZGU6IFZub2RlPERheVNlbGVjdG9yQXR0cnM+KSB7XG5cdFx0Y29uc3QgaXNFeHBhbmRlZCA9IHZub2RlLmF0dHJzLmlzRGF5U2VsZWN0b3JFeHBhbmRlZCA/PyB0cnVlXG5cdFx0Y29uc3QgZGF0ZSA9IHZub2RlLmF0dHJzLnNlbGVjdGVkRGF0ZSA/PyBuZXcgRGF0ZSgpXG5cdFx0Ly8gV2UgbmVlZCBjdXJyZW50L2xhc3QvbmV4dCBtb250aCBmb3IgdGhlIGV4cGFuZGVkIGRhdGUgcGlja2VyXG5cdFx0Y29uc3QgY3VycmVudE1vbnRoID0gZ2V0Q2FsZW5kYXJNb250aChkYXRlLCB2bm9kZS5hdHRycy5zdGFydE9mVGhlV2Vla09mZnNldCwgdHJ1ZSlcblx0XHRjb25zdCBsYXN0TW9udGggPSBnZXRDYWxlbmRhck1vbnRoU2hpZnRlZEJ5KGN1cnJlbnRNb250aCwgdm5vZGUuYXR0cnMuc3RhcnRPZlRoZVdlZWtPZmZzZXQsIC0xKVxuXHRcdGNvbnN0IG5leHRNb250aCA9IGdldENhbGVuZGFyTW9udGhTaGlmdGVkQnkoY3VycmVudE1vbnRoLCB2bm9kZS5hdHRycy5zdGFydE9mVGhlV2Vla09mZnNldCwgMSlcblx0XHQvLyBXZSBuZWVkIGN1cnJlbnQvbGFzdC9uZXh0IHdlZWsgZm9yIHRoZSBjb2xsYXBzZWQgZGF0ZSBwaWNrZXIuXG5cdFx0Ly8gVGhlIHdlZWsgdGhhdCB3ZSB3YW50IHRvIGdldCBkZXBlbmRzIG9uIHRoZSBtb250aCBsYXlvdXQsIHNvIHdlIGFyZSBsb29raW5nIGZvciBpdCBpbiB0aGUgYWxyZWFkeSBjb21wdXRlZCBtb250aHMuXG5cdFx0Y29uc3QgY3VycmVudFdlZWsgPSBhc3NlcnROb3ROdWxsKGZpbmRXZWVrKGN1cnJlbnRNb250aCwgZGF0ZSkpXG5cdFx0Y29uc3QgYmVnaW5uaW5nT2ZMYXN0V2VlayA9IGluY3JlbWVudERhdGUobmV3IERhdGUoZGF0ZSksIC03KVxuXHRcdC8vIFRoZSB3ZWVrIHRoYXQgd2UgYXJlIGxvb2tpbmcgZm9yIGNhbiBiZSBpbiBib3RoIGN1cnJlbnQgbW9udGggb3IgdGhlIGxhc3QvbmV4dCBvbmVcblx0XHRjb25zdCBsYXN0V2VlayA9XG5cdFx0XHRiZWdpbm5pbmdPZkxhc3RXZWVrIDwgY3VycmVudE1vbnRoLmJlZ2lubmluZ09mTW9udGggPyBmaW5kV2VlayhsYXN0TW9udGgsIGJlZ2lubmluZ09mTGFzdFdlZWspIDogZmluZFdlZWsoY3VycmVudE1vbnRoLCBiZWdpbm5pbmdPZkxhc3RXZWVrKVxuXHRcdGNvbnN0IGJlZ2lubmluZ09mTmV4dFdlZWsgPSBpbmNyZW1lbnREYXRlKG5ldyBEYXRlKGRhdGUpLCA3KVxuXHRcdGNvbnN0IG5leHRXZWVrID1cblx0XHRcdGJlZ2lubmluZ09mTmV4dFdlZWsgPCBuZXh0TW9udGguYmVnaW5uaW5nT2ZNb250aCA/IGZpbmRXZWVrKGN1cnJlbnRNb250aCwgYmVnaW5uaW5nT2ZOZXh0V2VlaykgOiBmaW5kV2VlayhuZXh0TW9udGgsIGJlZ2lubmluZ09mTmV4dFdlZWspXG5cblx0XHRyZXR1cm4gbShDYXJvdXNlbCwge1xuXHRcdFx0bGFiZWw6IFwiZGF0ZV9sYWJlbFwiLFxuXHRcdFx0Y2xhc3M6IFwiY2VudGVyLWhvcml6b250YWxseVwiLFxuXHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0Zm9udFNpemU6IHB4KDE0KSxcblx0XHRcdFx0bGluZUhlaWdodDogcHgodGhpcy5nZXRFbGVtZW50U2l6ZSh2bm9kZS5hdHRycykpLFxuXHRcdFx0fSxcblx0XHRcdHNsaWRlczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGFiZWw6IGlzRXhwYW5kZWQgPyBcInByZXZNb250aF9sYWJlbFwiIDogXCJwcmV2V2Vla19sYWJlbFwiLFxuXHRcdFx0XHRcdGVsZW1lbnQ6IHRoaXMucmVuZGVyQ2Fyb3VzZWxQYWdlKGlzRXhwYW5kZWQsIHZub2RlLmF0dHJzLCBsYXN0V2VlaywgbGFzdE1vbnRoLCB0cnVlKSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxhYmVsOiBpc0V4cGFuZGVkID8gXCJtb250aF9sYWJlbFwiIDogXCJ3ZWVrX2xhYmVsXCIsXG5cdFx0XHRcdFx0ZWxlbWVudDogdGhpcy5yZW5kZXJDYXJvdXNlbFBhZ2UoaXNFeHBhbmRlZCwgdm5vZGUuYXR0cnMsIGN1cnJlbnRXZWVrLCBjdXJyZW50TW9udGgsIGZhbHNlKSxcblx0XHRcdFx0fSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxhYmVsOiBpc0V4cGFuZGVkID8gXCJuZXh0TW9udGhfbGFiZWxcIiA6IFwibmV4dFdlZWtfbGFiZWxcIixcblx0XHRcdFx0XHRlbGVtZW50OiB0aGlzLnJlbmRlckNhcm91c2VsUGFnZShpc0V4cGFuZGVkLCB2bm9kZS5hdHRycywgbmV4dFdlZWssIG5leHRNb250aCwgdHJ1ZSksXG5cdFx0XHRcdH0sXG5cdFx0XHRdLFxuXHRcdFx0b25Td2lwZTogKGlzTmV4dDogYm9vbGVhbikgPT4gdGhpcy5oYW5kbGVEYXlQaWNrZXJTd2lwZT8uKGlzTmV4dCksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQ2Fyb3VzZWxQYWdlKGlzRXhwYW5kZWQ6IGJvb2xlYW4sIGF0dHJzOiBEYXlTZWxlY3RvckF0dHJzLCB3ZWVrOiByZWFkb25seSBDYWxlbmRhckRheVtdLCBtb250aDogQ2FsZW5kYXJNb250aCwgaGlkZGVuOiBib29sZWFuKSB7XG5cdFx0cmV0dXJuIFtcblx0XHRcdG0oXG5cdFx0XHRcdFwiXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRcImFyaWEtaGlkZGVuXCI6IGAke2lzRXhwYW5kZWR9YCxcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0ZGlzcGxheTogaXNFeHBhbmRlZCA/IFwibm9uZVwiIDogXCJibG9ja1wiLFxuXHRcdFx0XHRcdFx0aGVpZ2h0OiBpc0V4cGFuZGVkID8gMCA6IHVuZGVmaW5lZCxcblx0XHRcdFx0XHRcdG9wYWNpdHk6IGlzRXhwYW5kZWQgPyAwIDogMSxcblx0XHRcdFx0XHRcdG92ZXJmbG93OiBcImNsaXBcIixcblx0XHRcdFx0XHRcdHRyYW5zaXRpb246IGBvcGFjaXR5ICR7MS41ICogRGVmYXVsdEFuaW1hdGlvblRpbWV9bXMgZWFzZS1pbi1vdXRgLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRoaXMucmVuZGVyRXhwYW5kYWJsZVdlZWsod2VlaywgYXR0cnMsIGZhbHNlLCBhdHRycy5pc0RheVNlbGVjdG9yRXhwYW5kZWQgfHwgaGlkZGVuKSxcblx0XHRcdCksXG5cdFx0XHRtKFxuXHRcdFx0XHRFeHBhbmRlclBhbmVsLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0ZXhwYW5kZWQ6IGlzRXhwYW5kZWQsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRoaXMucmVuZGVyRXhwYW5kZWRNb250aChtb250aCwgYXR0cnMsIGhpZGRlbiksXG5cdFx0XHQpLFxuXHRcdF1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRXhwYW5kZWRNb250aChjYWxlbmRhck1vbnRoOiBDYWxlbmRhck1vbnRoLCBhdHRyczogRGF5U2VsZWN0b3JBdHRycywgaGlkZGVuOiBib29sZWFuKSB7XG5cdFx0Y29uc3QgeyB3ZWVrcyB9ID0gY2FsZW5kYXJNb250aFxuXHRcdGxldCB3ZWVrVG9IaWdobGlnaHQgPSAtMVxuXG5cdFx0aWYgKGF0dHJzLmhpZ2hsaWdodFNlbGVjdGVkV2Vlaykge1xuXHRcdFx0d2Vla1RvSGlnaGxpZ2h0ID0gd2Vla3MuZmluZEluZGV4KCh3ZWVrKSA9PiB3ZWVrLmZpbmQoKGRheSkgPT4gZGF5LmRhdGUuZ2V0VGltZSgpID09PSBhdHRycy5zZWxlY3RlZERhdGU/LmdldFRpbWUoKSkpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHdlZWtzLm1hcCgodywgaW5kZXgpID0+IHRoaXMucmVuZGVyRXhwYW5kYWJsZVdlZWsodywgYXR0cnMsIHdlZWtUb0hpZ2hsaWdodCA9PT0gaW5kZXgsIGF0dHJzLmlzRGF5U2VsZWN0b3JFeHBhbmRlZCAmJiBoaWRkZW4pKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJEYXkoeyBkYXRlLCBkYXksIGlzUGFkZGluZ0RheSB9OiBDYWxlbmRhckRheSwgYXR0cnM6IERheVNlbGVjdG9yQXR0cnMsIGhpZGRlbjogYm9vbGVhbik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBpc1NlbGVjdGVkRGF5ID0gaXNTYW1lRGF5T2ZEYXRlKGRhdGUsIGF0dHJzLnNlbGVjdGVkRGF0ZSlcblx0XHRsZXQgY2lyY2xlQ2xhc3MgPSBcIlwiXG5cdFx0bGV0IHRleHRDbGFzcyA9IFwiXCJcblx0XHRpZiAoaXNTZWxlY3RlZERheSAmJiBhdHRycy5zaG93RGF5U2VsZWN0aW9uKSB7XG5cdFx0XHRjaXJjbGVDbGFzcyA9IFwiY2FsZW5kYXItc2VsZWN0ZWQtZGF5LWNpcmNsZVwiXG5cdFx0XHR0ZXh0Q2xhc3MgPSBcImNhbGVuZGFyLXNlbGVjdGVkLWRheS10ZXh0XCJcblx0XHR9IGVsc2UgaWYgKGlzVG9kYXkoZGF0ZSkgJiYgYXR0cnMuaGlnaGxpZ2h0VG9kYXkpIHtcblx0XHRcdGNpcmNsZUNsYXNzID0gXCJjYWxlbmRhci1jdXJyZW50LWRheS1jaXJjbGVcIlxuXHRcdFx0dGV4dENsYXNzID0gXCJjYWxlbmRhci1jdXJyZW50LWRheS10ZXh0XCJcblx0XHR9XG5cblx0XHRjb25zdCBzaXplID0gdGhpcy5nZXRFbGVtZW50U2l6ZShhdHRycylcblxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCJidXR0b24ucmVsLmNsaWNrLmZsZXguaXRlbXMtY2VudGVyLmp1c3RpZnktY2VudGVyLnJlbFwiICsgKGlzUGFkZGluZ0RheSAmJiBhdHRycy5pc0RheVNlbGVjdG9yRXhwYW5kZWQgPyBcIi5mYWRlZC1kYXlcIiA6IFwiXCIpLFxuXHRcdFx0e1xuXHRcdFx0XHRjbGFzczogXCJmbGV4LWdyb3ctc2hyaW5rLTBcIixcblx0XHRcdFx0XCJhcmlhLWhpZGRlblwiOiBgJHtpc1BhZGRpbmdEYXkgJiYgYXR0cnMuaXNEYXlTZWxlY3RvckV4cGFuZGVkfWAsXG5cdFx0XHRcdFwiYXJpYS1sYWJlbFwiOiBkYXRlLnRvTG9jYWxlRGF0ZVN0cmluZygpLFxuXHRcdFx0XHRcImFyaWEtc2VsZWN0ZWRcIjogYCR7aXNTZWxlY3RlZERheX1gLFxuXHRcdFx0XHRyb2xlOiBcIm9wdGlvblwiLFxuXHRcdFx0XHR0YWJJbmRleDogaGlkZGVuID8gLTEgOiAwLFxuXHRcdFx0XHRvbmNsaWNrOiAoKSA9PiBhdHRycy5vbkRhdGVTZWxlY3RlZD8uKGRhdGUsIHRydWUpLFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0bShcIi5hYnMuejEuY2lyY2xlXCIsIHtcblx0XHRcdFx0XHRjbGFzczogY2lyY2xlQ2xhc3MsXG5cdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdHdpZHRoOiBweChzaXplICogMC42MjUpLFxuXHRcdFx0XHRcdFx0aGVpZ2h0OiBweChzaXplICogMC42MjUpLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLmZ1bGwtd2lkdGguaGVpZ2h0LTEwMHAuY2VudGVyLnoyXCIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y2xhc3M6IHRleHRDbGFzcyxcblx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdGZvbnRTaXplOiBweChhdHRycy53aWRlID8gMTQgOiAxMiksXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ZGF5LFxuXHRcdFx0XHQpLFxuXHRcdFx0XHRhdHRycy5oYXNFdmVudE9uKGRhdGUpID8gbShcIi5kYXktZXZlbnRzLWluZGljYXRvclwiLCB7IHN0eWxlOiBzdHlsZXMuaXNEZXNrdG9wTGF5b3V0KCkgPyB7IHdpZHRoOiBcIjNweFwiLCBoZWlnaHQ6IFwiM3B4XCIgfSA6IHt9IH0pIDogbnVsbCxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRFbGVtZW50U2l6ZShhdHRyczogRGF5U2VsZWN0b3JBdHRycyk6IG51bWJlciB7XG5cdFx0cmV0dXJuIGF0dHJzLndpZGUgPyA0MCA6IDMwXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckV4cGFuZGFibGVXZWVrKHdlZWs6IFJlYWRvbmx5QXJyYXk8Q2FsZW5kYXJEYXk+LCBhdHRyczogRGF5U2VsZWN0b3JBdHRycywgaGlnaGxpZ2h0OiBib29sZWFuLCBoaWRkZW46IGJvb2xlYW4pOiBDaGlsZHJlbiB7XG5cdFx0bGV0IHN0eWxlXG5cblx0XHRpZiAoaGlnaGxpZ2h0KSB7XG5cdFx0XHRzdHlsZSA9IHtcblx0XHRcdFx0YmFja2dyb3VuZENvbG9yOiBoZXhUb1JHQkFTdHJpbmcodGhlbWUuY29udGVudF9hY2NlbnQsIDAuMiksXG5cdFx0XHRcdGhlaWdodDogcHgoc3R5bGVzLmlzRGVza3RvcExheW91dCgpID8gMTkgOiAyNSksXG5cdFx0XHRcdGJvcmRlclJhZGl1czogcHgoc3R5bGVzLmlzRGVza3RvcExheW91dCgpID8gNiA6IDI1KSxcblx0XHRcdFx0d2lkdGg6IGBjYWxjKDEwMCUgLSAke3B4KHNpemUuaHBhZF9zbWFsbCl9KWAsXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHN0eWxlID0ge31cblx0XHR9XG5cblx0XHRyZXR1cm4gbShcIi5mbGV4LXNwYWNlLWFyb3VuZC5yZWwuaXRlbXMtY2VudGVyXCIsIFtcblx0XHRcdG0oXCIuYWJzXCIsIHtcblx0XHRcdFx0c3R5bGUsXG5cdFx0XHR9KSxcblx0XHRcdC4uLndlZWsubWFwKChkKSA9PiB0aGlzLnJlbmRlckRheShkLCBhdHRycywgaGlkZGVuKSksXG5cdFx0XSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyV2Vla0RheXMod2lkZTogYm9vbGVhbiwgd2Vla2RheXM6IHJlYWRvbmx5IHN0cmluZ1tdKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHNpemUgPSBweCh3aWRlID8gNDAgOiAyNClcblx0XHRjb25zdCBmb250U2l6ZSA9IHB4KDE0KVxuXHRcdHJldHVybiB3ZWVrZGF5cy5tYXAoKHdkKSA9PlxuXHRcdFx0bShcblx0XHRcdFx0XCIuY2VudGVyXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiLFxuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRmb250U2l6ZSxcblx0XHRcdFx0XHRcdGZvbnRXZWlnaHQ6IFwiYm9sZFwiLFxuXHRcdFx0XHRcdFx0aGVpZ2h0OiBcIjIwcHhcIixcblx0XHRcdFx0XHRcdHdpZHRoOiBzaXplLFxuXHRcdFx0XHRcdFx0bGluZUhlaWdodDogXCIyMHB4XCIsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0d2QsXG5cdFx0XHQpLFxuXHRcdClcblx0fVxufVxuXG5mdW5jdGlvbiBmaW5kV2VlayhjdXJyZW50TW9udGg6IENhbGVuZGFyTW9udGgsIGRhdGU6IERhdGUpOiByZWFkb25seSBDYWxlbmRhckRheVtdIHtcblx0cmV0dXJuIGFzc2VydE5vdE51bGwoY3VycmVudE1vbnRoLndlZWtzLmZpbmQoKHcpID0+IHcuc29tZSgoY2FsZW5kYXJEYXkpID0+IGRhdGUuZ2V0VGltZSgpID09PSBjYWxlbmRhckRheS5kYXRlLmdldFRpbWUoKSkpKVxufVxuXG5mdW5jdGlvbiBnZXRDYWxlbmRhck1vbnRoU2hpZnRlZEJ5KGN1cnJlbnRNb250aDogQ2FsZW5kYXJNb250aCwgZmlyc3REYXlPZldlZWtGcm9tT2Zmc2V0OiBudW1iZXIsIHBsdXNNb250aHM6IG51bWJlcik6IENhbGVuZGFyTW9udGgge1xuXHRjb25zdCBkYXRlID0gRGF0ZVRpbWUuZnJvbUpTRGF0ZShjdXJyZW50TW9udGguYmVnaW5uaW5nT2ZNb250aCkucGx1cyh7IG1vbnRoOiBwbHVzTW9udGhzIH0pLnRvSlNEYXRlKClcblx0cmV0dXJuIGdldENhbGVuZGFyTW9udGgoZGF0ZSwgZmlyc3REYXlPZldlZWtGcm9tT2Zmc2V0LCB0cnVlKVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemUuanNcIlxuXG5leHBvcnQgdHlwZSBDYWxlbmRhclRpbWVJbmRpY2F0b3JBdHRycyA9IHtcblx0LyoqIE1ha2UgdGhlIGNpcmNsZSB0YW5nZW50IHRvIHRoZSBsZWZ0IHNpZGUgb2YgdGhlIGxpbmUgcmF0aGVyIHRoYW4gaW50ZXJzZWN0aW5nIGl0ICovXG5cdGNpcmNsZUxlZnRUYW5nZW50PzogYm9vbGVhblxufVxuXG4vKipcbiAqIEluZGljYXRvciB1c2VkIGZvciBpbmRpY2F0aW5nIHRoZSBjdXJyZW50IHRpbWUgcmVsYXRpdmUgdG8gdGhlIGN1cnJlbnQgZGF0ZSBpbiB0aGUgY2FsZW5kYXIgdmlldy5cbiAqL1xuZXhwb3J0IGNsYXNzIENhbGVuZGFyVGltZUluZGljYXRvciBpbXBsZW1lbnRzIENvbXBvbmVudDxDYWxlbmRhclRpbWVJbmRpY2F0b3JBdHRycz4ge1xuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8Q2FsZW5kYXJUaW1lSW5kaWNhdG9yQXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGljb25SYWRpdXMgPSBzaXplLmljb25fc2l6ZV9zbWFsbCAvIDJcblx0XHRjb25zdCBsZWZ0T2Zmc2V0ID0gYXR0cnMuY2lyY2xlTGVmdFRhbmdlbnQgPyAwIDogLWljb25SYWRpdXNcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmFjY2VudC1iZ1wiLFxuXHRcdFx0e1xuXHRcdFx0XHRcImFyaWEtaGlkZGVuXCI6IFwidHJ1ZVwiLFxuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdGhlaWdodDogcHgoc2l6ZS5jYWxlbmRhcl9kYXlfZXZlbnRfcGFkZGluZyksXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0bShgLmNpcmNsZS5pY29uLXNtYWxsLmFjY2VudC1iZ2AsIHtcblx0XHRcdFx0XCJhcmlhLWhpZGRlblwiOiBcInRydWVcIixcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHR0cmFuc2xhdGU6IGAke3B4KGxlZnRPZmZzZXQpfSAke3B4KC01KX1gLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSksXG5cdFx0KVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZCwgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUsIFZub2RlRE9NIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgaW5jcmVtZW50RGF0ZSwgaXNTYW1lRGF5IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsXCJcbmltcG9ydCB7IGdldFRpbWVab25lLCBpc0JpcnRoZGF5RXZlbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlsc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50LCBDb250YWN0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHR5cGUgeyBHcm91cENvbG9ycyB9IGZyb20gXCIuL0NhbGVuZGFyVmlld1wiXG5pbXBvcnQgdHlwZSB7IENhbGVuZGFyRXZlbnRCdWJibGVDbGlja0hhbmRsZXIsIENhbGVuZGFyRXZlbnRCdWJibGVLZXlEb3duSGFuZGxlciwgQ2FsZW5kYXJQcmV2aWV3TW9kZWxzIH0gZnJvbSBcIi4vQ2FsZW5kYXJWaWV3TW9kZWxcIlxuaW1wb3J0IHsgc3R5bGVzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvc3R5bGVzLmpzXCJcbmltcG9ydCB7IERhdGVUaW1lIH0gZnJvbSBcImx1eG9uXCJcbmltcG9ydCB7IENhbGVuZGFyQWdlbmRhSXRlbVZpZXcgfSBmcm9tIFwiLi9DYWxlbmRhckFnZW5kYUl0ZW1WaWV3LmpzXCJcbmltcG9ydCBDb2x1bW5FbXB0eU1lc3NhZ2VCb3ggZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Db2x1bW5FbXB0eU1lc3NhZ2VCb3guanNcIlxuaW1wb3J0IHsgQm9vdEljb25zIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9Cb290SWNvbnMuanNcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS90aGVtZS5qc1wiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemUuanNcIlxuaW1wb3J0IHsgRGF5U2VsZWN0b3IgfSBmcm9tIFwiLi4vZ3VpL2RheS1zZWxlY3Rvci9EYXlTZWxlY3Rvci5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50UHJldmlld1ZpZXdNb2RlbCB9IGZyb20gXCIuLi9ndWkvZXZlbnRwb3B1cC9DYWxlbmRhckV2ZW50UHJldmlld1ZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBFdmVudERldGFpbHNWaWV3IH0gZnJvbSBcIi4vRXZlbnREZXRhaWxzVmlldy5qc1wiXG5pbXBvcnQgeyBnZXRFbGVtZW50SWQsIGdldExpc3RJZCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9FbnRpdHlVdGlscy5qc1wiXG5pbXBvcnQgeyBpc0FsbERheUV2ZW50LCBzZXROZXh0SGFsZkhvdXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvQ29tbW9uQ2FsZW5kYXJVdGlscy5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhclRpbWVJbmRpY2F0b3IgfSBmcm9tIFwiLi9DYWxlbmRhclRpbWVJbmRpY2F0b3IuanNcIlxuaW1wb3J0IHsgVGltZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9UaW1lLmpzXCJcbmltcG9ydCB7IERheXNUb0V2ZW50cyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9DYWxlbmRhckV2ZW50c1JlcG9zaXRvcnkuanNcIlxuXG5pbXBvcnQgeyBmb3JtYXRFdmVudFRpbWVzLCBnZXRFdmVudENvbG9yLCBzaG91bGREaXNwbGF5RXZlbnQgfSBmcm9tIFwiLi4vZ3VpL0NhbGVuZGFyR3VpVXRpbHMuanNcIlxuaW1wb3J0IHsgUGFnZVZpZXcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1BhZ2VWaWV3LmpzXCJcbmltcG9ydCB7IGdldElmTGFyZ2VTY3JvbGwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0d1aVV0aWxzLmpzXCJcbmltcG9ydCB7IGlzS2V5UHJlc3NlZCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9LZXlNYW5hZ2VyLmpzXCJcbmltcG9ydCB7IEtleXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgTWFpbkNyZWF0ZUJ1dHRvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL01haW5DcmVhdGVCdXR0b24uanNcIlxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0NsaWVudERldGVjdG9yLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyQ29udGFjdFByZXZpZXdWaWV3TW9kZWwgfSBmcm9tIFwiLi4vZ3VpL2V2ZW50cG9wdXAvQ2FsZW5kYXJDb250YWN0UHJldmlld1ZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBDb250YWN0Q2FyZFZpZXdlciB9IGZyb20gXCIuLi8uLi8uLi9tYWlsLWFwcC9jb250YWN0cy92aWV3L0NvbnRhY3RDYXJkVmlld2VyLmpzXCJcbmltcG9ydCB7IFBhcnRpYWxSZWNpcGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vcmVjaXBpZW50cy9SZWNpcGllbnQuanNcIlxuXG5leHBvcnQgdHlwZSBDYWxlbmRhckFnZW5kYVZpZXdBdHRycyA9IHtcblx0c2VsZWN0ZWREYXRlOiBEYXRlXG5cdHNlbGVjdGVkVGltZT86IFRpbWVcblx0LyoqXG5cdCAqIG1hcHMgc3RhcnQgb2YgZGF5IHRpbWVzdGFtcCB0byBldmVudHMgb24gdGhhdCBkYXlcblx0ICovXG5cdGV2ZW50c0ZvckRheXM6IERheXNUb0V2ZW50c1xuXHRhbVBtRm9ybWF0OiBib29sZWFuXG5cdG9uRXZlbnRDbGlja2VkOiBDYWxlbmRhckV2ZW50QnViYmxlQ2xpY2tIYW5kbGVyXG5cdG9uRXZlbnRLZXlEb3duOiBDYWxlbmRhckV2ZW50QnViYmxlS2V5RG93bkhhbmRsZXJcblx0Z3JvdXBDb2xvcnM6IEdyb3VwQ29sb3JzXG5cdGhpZGRlbkNhbGVuZGFyczogUmVhZG9ubHlTZXQ8SWQ+XG5cdHN0YXJ0T2ZUaGVXZWVrT2Zmc2V0OiBudW1iZXJcblx0aXNEYXlTZWxlY3RvckV4cGFuZGVkOiBib29sZWFuXG5cdC8qKiB3aGVuIHRoZSB1c2VyIGV4cGxpY2l0bHkgcHJlc3NlZCBvbiBhIGRheSB0byBzaG93ICovXG5cdG9uU2hvd0RhdGU6IChkYXRlOiBEYXRlKSA9PiB1bmtub3duXG5cdC8qKiAgd2hlbiB0aGUgc2VsZWN0ZWQgZGF0ZSB3YXMgY2hhbmdlZCAgKi9cblx0b25EYXRlU2VsZWN0ZWQ6IChkYXRlOiBEYXRlKSA9PiB1bmtub3duXG5cdGV2ZW50UHJldmlld01vZGVsOiBDYWxlbmRhclByZXZpZXdNb2RlbHMgfCBudWxsXG5cdHNjcm9sbFBvc2l0aW9uOiBudW1iZXJcblx0b25TY3JvbGxQb3NpdGlvbkNoYW5nZTogKG5ld1Bvc2l0aW9uOiBudW1iZXIpID0+IHVua25vd25cblx0b25WaWV3Q2hhbmdlZDogKHZub2RlOiBWbm9kZURPTSkgPT4gdW5rbm93blxuXHRvbk5ld0V2ZW50OiAoZGF0ZTogRGF0ZSB8IG51bGwpID0+IHVua25vd25cblx0b25FZGl0Q29udGFjdDogKGNvbnRhY3Q6IENvbnRhY3QpID0+IHVua25vd25cblx0b25Xcml0ZU1haWw6IChyZWNpcGllbnQ6IFBhcnRpYWxSZWNpcGllbnQpID0+IHVua25vd25cbn1cblxuZXhwb3J0IGNsYXNzIENhbGVuZGFyQWdlbmRhVmlldyBpbXBsZW1lbnRzIENvbXBvbmVudDxDYWxlbmRhckFnZW5kYVZpZXdBdHRycz4ge1xuXHRwcml2YXRlIGxhc3RTY3JvbGxQb3NpdGlvbjogbnVtYmVyIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBsYXN0U2Nyb2xsZWREYXRlOiBEYXRlIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBsaXN0RG9tOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG5cblx0dmlldyh7IGF0dHJzIH06IFZub2RlPENhbGVuZGFyQWdlbmRhVmlld0F0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCBpc0Rlc2t0b3BMYXlvdXQgPSBzdHlsZXMuaXNEZXNrdG9wTGF5b3V0KClcblx0XHRjb25zdCBzZWxlY3RlZERhdGUgPSBhdHRycy5zZWxlY3RlZERhdGVcblxuXHRcdGxldCBjb250YWluZXJTdHlsZVxuXG5cdFx0aWYgKGlzRGVza3RvcExheW91dCkge1xuXHRcdFx0Y29udGFpbmVyU3R5bGUgPSB7XG5cdFx0XHRcdG1hcmdpbkxlZnQ6IFwiNXB4XCIsXG5cdFx0XHRcdG1hcmdpbkJvdHRvbTogcHgoc2l6ZS5ocGFkX2xhcmdlKSxcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29udGFpbmVyU3R5bGUgPSB7fVxuXHRcdH1cblxuXHRcdGNvbnN0IGFnZW5kYUNoaWxkcmVuID0gdGhpcy5yZW5kZXJBZ2VuZGEoYXR0cnMsIGlzRGVza3RvcExheW91dClcblxuXHRcdGlmIChhdHRycy5zZWxlY3RlZFRpbWUgJiYgYXR0cnMuZXZlbnRzRm9yRGF5cy5zaXplID4gMCAmJiB0aGlzLmxhc3RTY3JvbGxlZERhdGUgIT0gYXR0cnMuc2VsZWN0ZWREYXRlKSB7XG5cdFx0XHR0aGlzLmxhc3RTY3JvbGxlZERhdGUgPSBhdHRycy5zZWxlY3RlZERhdGVcblx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cdFx0XHRcdGlmICh0aGlzLmxpc3REb20pIHtcblx0XHRcdFx0XHR0aGlzLmxpc3REb20uc2Nyb2xsVG9wID0gYXR0cnMuc2Nyb2xsUG9zaXRpb25cblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRyZXR1cm4gbShcIi5maWxsLWFic29sdXRlLmZsZXguY29sXCIsIHsgY2xhc3M6IGlzRGVza3RvcExheW91dCA/IFwibWxyLWwgaGVpZ2h0LTEwMHBcIiA6IFwibWxyLXNhZmUtaW5zZXRcIiwgc3R5bGU6IGNvbnRhaW5lclN0eWxlIH0sIFtcblx0XHRcdHRoaXMucmVuZGVyRGF0ZVNlbGVjdG9yKGF0dHJzLCBpc0Rlc2t0b3BMYXlvdXQsIHNlbGVjdGVkRGF0ZSksXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5yZWwuZmxleC1ncm93LmZsZXguY29sXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjbGFzczogaXNEZXNrdG9wTGF5b3V0ID8gXCJvdmVyZmxvdy1oaWRkZW5cIiA6IFwiY29udGVudC1iZyBzY3JvbGwgYm9yZGVyLXJhZGl1cy10b3AtbGVmdC1iaWcgYm9yZGVyLXJhZGl1cy10b3AtcmlnaHQtYmlnXCIsXG5cdFx0XHRcdFx0b25jcmVhdGU6ICh2bm9kZTogVm5vZGVET00pID0+IHtcblx0XHRcdFx0XHRcdGlmICghaXNEZXNrdG9wTGF5b3V0KSB0aGlzLmxpc3REb20gPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG9udXBkYXRlOiAodm5vZGU6IFZub2RlRE9NKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoIWlzRGVza3RvcExheW91dCkge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmhhbmRsZVNjcm9sbE9uVXBkYXRlKGF0dHJzLCB2bm9kZSlcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRhZ2VuZGFDaGlsZHJlbixcblx0XHRcdCksXG5cdFx0XSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRGF0ZVNlbGVjdG9yKGF0dHJzOiBDYWxlbmRhckFnZW5kYVZpZXdBdHRycywgaXNEZXNrdG9wTGF5b3V0OiBib29sZWFuLCBzZWxlY3RlZERhdGU6IERhdGUpOiBDaGlsZHJlbiB7XG5cdFx0Ly8gVGhpcyB0aW1lIHdpZHRoIGlzIHVzZWQgdG8gY3JlYXRlIGEgY29udGFpbmVyIGFib3ZlIHRoZSBkYXkgc2xpZGVyXG5cdFx0Ly8gU28gdGhlIGhpZGRlbiBkYXRlcyBcInNlZW1zXCIgdG8gYmUgZm9sbG93aW5nIHRoZSBzYW1lIG1hcmdpbiBvZiB0aGUgdmlld1xuXHRcdGNvbnN0IHRpbWVXaWR0aCA9ICFpc0Rlc2t0b3BMYXlvdXQgPyBzaXplLmNhbGVuZGFyX2hvdXJfd2lkdGhfbW9iaWxlIDogc2l6ZS5jYWxlbmRhcl9ob3VyX3dpZHRoXG5cdFx0cmV0dXJuIGlzRGVza3RvcExheW91dFxuXHRcdFx0PyBudWxsXG5cdFx0XHQ6IG0oXG5cdFx0XHRcdFx0XCJcIixcblx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XCIuaGVhZGVyLWJnLnBiLXMub3ZlcmZsb3ctaGlkZGVuXCIsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0XCJtYXJnaW4tbGVmdFwiOiBweChzaXplLmNhbGVuZGFyX2hvdXJfd2lkdGhfbW9iaWxlKSxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRtKERheVNlbGVjdG9yLCB7XG5cdFx0XHRcdFx0XHRcdHNlbGVjdGVkRGF0ZTogc2VsZWN0ZWREYXRlLFxuXHRcdFx0XHRcdFx0XHRvbkRhdGVTZWxlY3RlZDogKHNlbGVjdGVkRGF0ZTogRGF0ZSkgPT4gYXR0cnMub25EYXRlU2VsZWN0ZWQoc2VsZWN0ZWREYXRlKSxcblx0XHRcdFx0XHRcdFx0d2lkZTogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0c3RhcnRPZlRoZVdlZWtPZmZzZXQ6IGF0dHJzLnN0YXJ0T2ZUaGVXZWVrT2Zmc2V0LFxuXHRcdFx0XHRcdFx0XHRpc0RheVNlbGVjdG9yRXhwYW5kZWQ6IGF0dHJzLmlzRGF5U2VsZWN0b3JFeHBhbmRlZCxcblx0XHRcdFx0XHRcdFx0aGFuZGxlRGF5UGlja2VyU3dpcGU6IChpc05leHQ6IGJvb2xlYW4pID0+IHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBzaWduID0gaXNOZXh0ID8gMSA6IC0xXG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgZHVyYXRpb24gPSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRtb250aDogc2lnbiAqIChhdHRycy5pc0RheVNlbGVjdG9yRXhwYW5kZWQgPyAxIDogMCksXG5cdFx0XHRcdFx0XHRcdFx0XHR3ZWVrOiBzaWduICogKGF0dHJzLmlzRGF5U2VsZWN0b3JFeHBhbmRlZCA/IDAgOiAxKSxcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRhdHRycy5vbkRhdGVTZWxlY3RlZChEYXRlVGltZS5mcm9tSlNEYXRlKGF0dHJzLnNlbGVjdGVkRGF0ZSkucGx1cyhkdXJhdGlvbikudG9KU0RhdGUoKSlcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0c2hvd0RheVNlbGVjdGlvbjogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0aGlnaGxpZ2h0VG9kYXk6IHRydWUsXG5cdFx0XHRcdFx0XHRcdGhpZ2hsaWdodFNlbGVjdGVkV2VlazogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdHVzZU5hcnJvd1dlZWtOYW1lOiBzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKSxcblx0XHRcdFx0XHRcdFx0aGFzRXZlbnRPbjogKGRhdGUpID0+XG5cdFx0XHRcdFx0XHRcdFx0YXR0cnMuZXZlbnRzRm9yRGF5cy5nZXQoZGF0ZS5nZXRUaW1lKCkpPy5zb21lKChldmVudCkgPT4gc2hvdWxkRGlzcGxheUV2ZW50KGV2ZW50LCBhdHRycy5oaWRkZW5DYWxlbmRhcnMpKSA/PyBmYWxzZSxcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdCksXG5cdFx0XHQgIClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRGVza3RvcEV2ZW50TGlzdChhdHRyczogQ2FsZW5kYXJBZ2VuZGFWaWV3QXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgZXZlbnRzID0gdGhpcy5nZXRFdmVudHNUb1JlbmRlcihhdHRycy5zZWxlY3RlZERhdGUsIGF0dHJzKVxuXHRcdGlmIChldmVudHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gbShDb2x1bW5FbXB0eU1lc3NhZ2VCb3gsIHtcblx0XHRcdFx0aWNvbjogQm9vdEljb25zLkNhbGVuZGFyLFxuXHRcdFx0XHRtZXNzYWdlOiBcIm5vRW50cmllc19tc2dcIixcblx0XHRcdFx0Y29sb3I6IHRoZW1lLmxpc3RfbWVzc2FnZV9iZyxcblx0XHRcdH0pXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBtKFwiLmZsZXgubWItcy5jb2xcIiwgdGhpcy5yZW5kZXJFdmVudHNGb3JEYXkoZXZlbnRzLCBnZXRUaW1lWm9uZSgpLCBhdHRycy5zZWxlY3RlZERhdGUsIGF0dHJzKSlcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlck1vYmlsZUFnZW5kYVZpZXcoYXR0cnM6IENhbGVuZGFyQWdlbmRhVmlld0F0dHJzKSB7XG5cdFx0Y29uc3QgZGF5ID0gYXR0cnMuc2VsZWN0ZWREYXRlXG5cdFx0Y29uc3QgcHJldmlvdXNEYXkgPSBpbmNyZW1lbnREYXRlKG5ldyBEYXRlKGRheSksIC0xKVxuXHRcdGNvbnN0IG5leHREYXkgPSBpbmNyZW1lbnREYXRlKG5ldyBEYXRlKGRheSksIDEpXG5cdFx0cmV0dXJuIG0oUGFnZVZpZXcsIHtcblx0XHRcdHByZXZpb3VzUGFnZToge1xuXHRcdFx0XHRrZXk6IHByZXZpb3VzRGF5LmdldFRpbWUoKSxcblx0XHRcdFx0bm9kZXM6IHRoaXMucmVuZGVyTW9iaWxlRXZlbnRMaXN0KHByZXZpb3VzRGF5LCBhdHRycyksXG5cdFx0XHR9LFxuXHRcdFx0Y3VycmVudFBhZ2U6IHtcblx0XHRcdFx0a2V5OiBkYXkuZ2V0VGltZSgpLFxuXHRcdFx0XHRub2RlczogdGhpcy5yZW5kZXJNb2JpbGVFdmVudExpc3QoZGF5LCBhdHRycyksXG5cdFx0XHR9LFxuXHRcdFx0bmV4dFBhZ2U6IHtcblx0XHRcdFx0a2V5OiBuZXh0RGF5LmdldFRpbWUoKSxcblx0XHRcdFx0bm9kZXM6IHRoaXMucmVuZGVyTW9iaWxlRXZlbnRMaXN0KG5leHREYXksIGF0dHJzKSxcblx0XHRcdH0sXG5cdFx0XHRvbkNoYW5nZVBhZ2U6IChuZXh0KSA9PiBhdHRycy5vbkRhdGVTZWxlY3RlZChuZXh0ID8gbmV4dERheSA6IHByZXZpb3VzRGF5KSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJNb2JpbGVFdmVudExpc3QoZGF5OiBEYXRlLCBhdHRyczogQ2FsZW5kYXJBZ2VuZGFWaWV3QXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgZXZlbnRzID0gdGhpcy5nZXRFdmVudHNUb1JlbmRlcihkYXksIGF0dHJzKVxuXHRcdGlmIChldmVudHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gbShDb2x1bW5FbXB0eU1lc3NhZ2VCb3gsIHtcblx0XHRcdFx0aWNvbjogQm9vdEljb25zLkNhbGVuZGFyLFxuXHRcdFx0XHRtZXNzYWdlOiBcIm5vRW50cmllc19tc2dcIixcblx0XHRcdFx0Y29sb3I6IHRoZW1lLmxpc3RfbWVzc2FnZV9iZyxcblx0XHRcdFx0Ym90dG9tQ29udGVudDogIWNsaWVudC5pc0NhbGVuZGFyQXBwKClcblx0XHRcdFx0XHQ/IG0oTWFpbkNyZWF0ZUJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogXCJuZXdFdmVudF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0Y2xpY2s6IChlOiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IG5ld0RhdGUgPSBuZXcgRGF0ZShhdHRycy5zZWxlY3RlZERhdGUpXG5cdFx0XHRcdFx0XHRcdFx0YXR0cnMub25OZXdFdmVudChzZXROZXh0SGFsZkhvdXIobmV3RGF0ZSkpXG5cblx0XHRcdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0Y2xhc3M6IFwibXQtc1wiLFxuXHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHR9KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbShcblx0XHRcdFx0XCIucHQtcy5mbGV4Lm1iLXMuY29sLm92ZXJmbG93LXktc2Nyb2xsLmhlaWdodC0xMDBwXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzdHlsZTogeyBtYXJnaW5MZWZ0OiBweChzaXplLmNhbGVuZGFyX2hvdXJfd2lkdGhfbW9iaWxlKSB9LFxuXHRcdFx0XHRcdG9uY3JlYXRlOiAodm5vZGU6IFZub2RlRE9NKSA9PiB7XG5cdFx0XHRcdFx0XHRhdHRycy5vblZpZXdDaGFuZ2VkKHZub2RlKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0b251cGRhdGU6ICh2bm9kZTogVm5vZGVET00pID0+IHtcblx0XHRcdFx0XHRcdHRoaXMuaGFuZGxlU2Nyb2xsT25VcGRhdGUoYXR0cnMsIHZub2RlKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRoaXMucmVuZGVyRXZlbnRzRm9yRGF5KGV2ZW50cywgZ2V0VGltZVpvbmUoKSwgZGF5LCBhdHRycyksXG5cdFx0XHQpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRFdmVudHNUb1JlbmRlcihkYXk6IERhdGUsIGF0dHJzOiBDYWxlbmRhckFnZW5kYVZpZXdBdHRycyk6IHJlYWRvbmx5IENhbGVuZGFyRXZlbnRbXSB7XG5cdFx0cmV0dXJuIChhdHRycy5ldmVudHNGb3JEYXlzLmdldChkYXkuZ2V0VGltZSgpKSA/PyBbXSkuZmlsdGVyKChlKSA9PiB7XG5cdFx0XHRyZXR1cm4gc2hvdWxkRGlzcGxheUV2ZW50KGUsIGF0dHJzLmhpZGRlbkNhbGVuZGFycylcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJBZ2VuZGEoYXR0cnM6IENhbGVuZGFyQWdlbmRhVmlld0F0dHJzLCBpc0Rlc2t0b3BMYXlvdXQ6IGJvb2xlYW4pOiBDaGlsZHJlbiB7XG5cdFx0aWYgKCFpc0Rlc2t0b3BMYXlvdXQpIHJldHVybiB0aGlzLnJlbmRlck1vYmlsZUFnZW5kYVZpZXcoYXR0cnMpXG5cblx0XHRyZXR1cm4gbShcIi5mbGV4LmZsZXgtZ3Jvdy5oZWlnaHQtMTAwcFwiLCBbXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5mbGV4LWdyb3cucmVsLm92ZXJmbG93LXktc2Nyb2xsXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XCJtaW4td2lkdGhcIjogcHgoc2l6ZS5zZWNvbmRfY29sX21pbl93aWR0aCksXG5cdFx0XHRcdFx0XHRcIm1heC13aWR0aFwiOiBweChzaXplLnNlY29uZF9jb2xfbWF4X3dpZHRoKSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG9uY3JlYXRlOiAodm5vZGU6IFZub2RlRE9NKSA9PiB7XG5cdFx0XHRcdFx0XHR0aGlzLmxpc3REb20gPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0XHRcdGF0dHJzLm9uVmlld0NoYW5nZWQodm5vZGUpXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvbnVwZGF0ZTogKHZub2RlOiBWbm9kZURPTSkgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5oYW5kbGVTY3JvbGxPblVwZGF0ZShhdHRycywgdm5vZGUpXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0W3RoaXMucmVuZGVyRGVza3RvcEV2ZW50TGlzdChhdHRycyldLFxuXHRcdFx0KSxcblx0XHRcdG0oXG5cdFx0XHRcdFwiLm1sLWwuZmxleC1ncm93LnNjcm9sbFwiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFwibWluLXdpZHRoXCI6IHB4KHNpemUudGhpcmRfY29sX21pbl93aWR0aCksXG5cdFx0XHRcdFx0XHRcIm1heC13aWR0aFwiOiBweChzaXplLnRoaXJkX2NvbF9tYXhfd2lkdGgpLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGF0dHJzLmV2ZW50UHJldmlld01vZGVsID09IG51bGxcblx0XHRcdFx0XHQ/IG0oXG5cdFx0XHRcdFx0XHRcdFwiLnJlbC5mbGV4LWdyb3cuaGVpZ2h0LTEwMHBcIixcblx0XHRcdFx0XHRcdFx0bShDb2x1bW5FbXB0eU1lc3NhZ2VCb3gsIHtcblx0XHRcdFx0XHRcdFx0XHRpY29uOiBCb290SWNvbnMuQ2FsZW5kYXIsXG5cdFx0XHRcdFx0XHRcdFx0bWVzc2FnZTogXCJub0V2ZW50U2VsZWN0X21zZ1wiLFxuXHRcdFx0XHRcdFx0XHRcdGNvbG9yOiB0aGVtZS5saXN0X21lc3NhZ2VfYmcsXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdCAgKVxuXHRcdFx0XHRcdDogdGhpcy5yZW5kZXJFdmVudFByZXZpZXcoYXR0cnMpLFxuXHRcdFx0KSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSBnZXRCaXJ0aGRheUV2ZW50TW9kZWwoZXZlbnRQcmV2aWV3TW9kZWw6IENhbGVuZGFyUHJldmlld01vZGVscyB8IG51bGwpOiBDYWxlbmRhckNvbnRhY3RQcmV2aWV3Vmlld01vZGVsIHwgbnVsbCB7XG5cdFx0aWYgKGlzQmlydGhkYXlFdmVudCgoZXZlbnRQcmV2aWV3TW9kZWwgYXMgQ2FsZW5kYXJDb250YWN0UHJldmlld1ZpZXdNb2RlbCkuZXZlbnQ/LnVpZCkpIHtcblx0XHRcdHJldHVybiBldmVudFByZXZpZXdNb2RlbCBhcyBDYWxlbmRhckNvbnRhY3RQcmV2aWV3Vmlld01vZGVsXG5cdFx0fVxuXHRcdHJldHVybiBudWxsXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckV2ZW50UHJldmlldyhhdHRyczogQ2FsZW5kYXJBZ2VuZGFWaWV3QXR0cnMpIHtcblx0XHRjb25zdCB7IGV2ZW50UHJldmlld01vZGVsLCBvbkVkaXRDb250YWN0LCBvbldyaXRlTWFpbCB9ID0gYXR0cnNcblx0XHRjb25zdCBtb2RlbCA9IHRoaXMuZ2V0QmlydGhkYXlFdmVudE1vZGVsKGV2ZW50UHJldmlld01vZGVsKVxuXG5cdFx0aWYgKG1vZGVsKSB7XG5cdFx0XHRyZXR1cm4gbShcblx0XHRcdFx0XCIuZmxleC5jb2xcIixcblx0XHRcdFx0bShDb250YWN0Q2FyZFZpZXdlciwge1xuXHRcdFx0XHRcdGNvbnRhY3Q6IG1vZGVsLmNvbnRhY3QsXG5cdFx0XHRcdFx0ZWRpdEFjdGlvbjogb25FZGl0Q29udGFjdCxcblx0XHRcdFx0XHRvbldyaXRlTWFpbDogb25Xcml0ZU1haWwsXG5cdFx0XHRcdFx0ZXh0ZW5kZWRBY3Rpb25zOiB0cnVlLFxuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRtYXJnaW46IFwiMFwiLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdH1cblx0XHRyZXR1cm4gbShFdmVudERldGFpbHNWaWV3LCB7XG5cdFx0XHRldmVudFByZXZpZXdNb2RlbDogZXZlbnRQcmV2aWV3TW9kZWwgYXMgQ2FsZW5kYXJFdmVudFByZXZpZXdWaWV3TW9kZWwsXG5cdFx0fSlcblx0fVxuXG5cdC8vIFVwZGF0ZXMgdGhlIHZpZXcgbW9kZWwncyBjb3B5IG9mIHRoZSB2aWV3IGRvbSBhbmQgc2Nyb2xscyB0byB0aGUgY3VycmVudCBgc2Nyb2xsUG9zaXRpb25gXG5cdHByaXZhdGUgaGFuZGxlU2Nyb2xsT25VcGRhdGUoYXR0cnM6IENhbGVuZGFyQWdlbmRhVmlld0F0dHJzLCB2bm9kZTogVm5vZGVET00pOiB2b2lkIHtcblx0XHRhdHRycy5vblZpZXdDaGFuZ2VkKHZub2RlKVxuXHRcdGlmIChnZXRJZkxhcmdlU2Nyb2xsKHRoaXMubGFzdFNjcm9sbFBvc2l0aW9uLCBhdHRycy5zY3JvbGxQb3NpdGlvbikpIHtcblx0XHRcdHZub2RlLmRvbS5zY3JvbGxUbyh7IHRvcDogYXR0cnMuc2Nyb2xsUG9zaXRpb24sIGJlaGF2aW9yOiBcInNtb290aFwiIH0pXG5cdFx0fSBlbHNlIHtcblx0XHRcdHZub2RlLmRvbS5zY3JvbGxUb3AgPSBhdHRycy5zY3JvbGxQb3NpdGlvblxuXHRcdH1cblx0XHR0aGlzLmxhc3RTY3JvbGxQb3NpdGlvbiA9IGF0dHJzLnNjcm9sbFBvc2l0aW9uXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckV2ZW50c0ZvckRheShldmVudHM6IHJlYWRvbmx5IENhbGVuZGFyRXZlbnRbXSwgem9uZTogc3RyaW5nLCBkYXk6IERhdGUsIGF0dHJzOiBDYWxlbmRhckFnZW5kYVZpZXdBdHRycykge1xuXHRcdGNvbnN0IHsgZ3JvdXBDb2xvcnM6IGNvbG9ycywgb25FdmVudENsaWNrZWQ6IGNsaWNrLCBvbkV2ZW50S2V5RG93bjoga2V5RG93biwgZXZlbnRQcmV2aWV3TW9kZWw6IG1vZGVsUHJvbWlzZSB9ID0gYXR0cnNcblx0XHRjb25zdCBhZ2VuZGFJdGVtSGVpZ2h0ID0gNjJcblx0XHRjb25zdCBhZ2VuZGFHYXAgPSAzXG5cdFx0Y29uc3QgY3VycmVudFRpbWUgPSBhdHRycy5zZWxlY3RlZFRpbWU/LnRvRGF0ZSgpXG5cdFx0bGV0IG5ld1Njcm9sbFBvc2l0aW9uID0gMFxuXG5cdFx0Ly8gRmluZCB3aGF0IGV2ZW50IHRvIGRpc3BsYXkgYSB0aW1lIGluZGljYXRvciBmb3I7IGRvIHRoaXMgZXZlbiBpZiBpdCBpcyBub3QgdGhlIHNhbWUgZGF5LCBhcyB3ZSBtaWdodCB3YW50IHRvIHJlZnJlc2ggdGhlIHZpZXcgd2hlbiB0aGUgZGF0ZSByb2xscyBvdmVyIHRvIHRoaXMgZGF5XG5cdFx0Y29uc3QgZXZlbnRUb1Nob3dUaW1lSW5kaWNhdG9yID0gZWFybGllc3RFdmVudFRvU2hvd1RpbWVJbmRpY2F0b3IoZXZlbnRzLCBuZXcgRGF0ZSgpKVxuXHRcdC8vIEZsYXQgbGlzdCBzdHJ1Y3R1cmUgc28gdGhhdCB3ZSBkb24ndCBoYXZlIHByb2JsZW1zIHdpdGgga2V5c1xuXHRcdGxldCBldmVudHNOb2RlczogQ2hpbGRbXSA9IFtdXG5cdFx0Zm9yIChjb25zdCBbZXZlbnRJbmRleCwgZXZlbnRdIG9mIGV2ZW50cy5lbnRyaWVzKCkpIHtcblx0XHRcdGlmIChldmVudFRvU2hvd1RpbWVJbmRpY2F0b3IgPT09IGV2ZW50SW5kZXggJiYgaXNTYW1lRGF5KG5ldyBEYXRlKCksIGV2ZW50LnN0YXJ0VGltZSkpIHtcblx0XHRcdFx0ZXZlbnRzTm9kZXMucHVzaChtKFwiLm10LXhzLm1iLXhzXCIsIHsga2V5OiBcInRpbWVJbmRpY2F0b3JcIiB9LCBtKENhbGVuZGFyVGltZUluZGljYXRvciwgeyBjaXJjbGVMZWZ0VGFuZ2VudDogdHJ1ZSB9KSkpXG5cdFx0XHR9XG5cdFx0XHRpZiAoY3VycmVudFRpbWUgJiYgZXZlbnQuc3RhcnRUaW1lIDwgY3VycmVudFRpbWUpIHtcblx0XHRcdFx0bmV3U2Nyb2xsUG9zaXRpb24gKz0gYWdlbmRhSXRlbUhlaWdodCArIGFnZW5kYUdhcFxuXHRcdFx0fVxuXHRcdFx0ZXZlbnRzTm9kZXMucHVzaChcblx0XHRcdFx0bShDYWxlbmRhckFnZW5kYUl0ZW1WaWV3LCB7XG5cdFx0XHRcdFx0a2V5OiBnZXRMaXN0SWQoZXZlbnQpICsgZ2V0RWxlbWVudElkKGV2ZW50KSArIGV2ZW50LnN0YXJ0VGltZS50b0lTT1N0cmluZygpLFxuXHRcdFx0XHRcdGV2ZW50OiBldmVudCxcblx0XHRcdFx0XHRjb2xvcjogZ2V0RXZlbnRDb2xvcihldmVudCwgY29sb3JzKSxcblx0XHRcdFx0XHRzZWxlY3RlZDogZXZlbnQgPT09IChtb2RlbFByb21pc2UgYXMgQ2FsZW5kYXJFdmVudFByZXZpZXdWaWV3TW9kZWwpPy5jYWxlbmRhckV2ZW50LFxuXHRcdFx0XHRcdGNsaWNrOiAoZG9tRXZlbnQpID0+IGNsaWNrKGV2ZW50LCBkb21FdmVudCksXG5cdFx0XHRcdFx0a2V5RG93bjogKGRvbUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCB0YXJnZXQgPSBkb21FdmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0XHRcdGlmIChpc0tleVByZXNzZWQoZG9tRXZlbnQua2V5LCBLZXlzLlVQLCBLZXlzLkspICYmICFkb21FdmVudC5yZXBlYXQpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgcHJldmlvdXNJdGVtID0gdGFyZ2V0LnByZXZpb3VzRWxlbWVudFNpYmxpbmcgYXMgSFRNTEVsZW1lbnQgfCBudWxsXG5cdFx0XHRcdFx0XHRcdGNvbnN0IHByZXZpb3VzSW5kZXggPSBldmVudEluZGV4IC0gMVxuXHRcdFx0XHRcdFx0XHRpZiAocHJldmlvdXNJdGVtKSB7XG5cdFx0XHRcdFx0XHRcdFx0cHJldmlvdXNJdGVtLmZvY3VzKClcblx0XHRcdFx0XHRcdFx0XHRhdHRycy5vblNjcm9sbFBvc2l0aW9uQ2hhbmdlKHByZXZpb3VzSXRlbS5vZmZzZXRUb3ApXG5cdFx0XHRcdFx0XHRcdFx0aWYgKHByZXZpb3VzSW5kZXggPj0gMCAmJiAhc3R5bGVzLmlzU2luZ2xlQ29sdW1uTGF5b3V0KCkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGtleURvd24oZXZlbnRzW3ByZXZpb3VzSW5kZXhdLCBuZXcgS2V5Ym9hcmRFdmVudChcImtleWRvd25cIiwgeyBrZXk6IEtleXMuUkVUVVJOLmNvZGUgfSkpXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0YXR0cnMub25TY3JvbGxQb3NpdGlvbkNoYW5nZSgwKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAoaXNLZXlQcmVzc2VkKGRvbUV2ZW50LmtleSwgS2V5cy5ET1dOLCBLZXlzLkopICYmICFkb21FdmVudC5yZXBlYXQpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgbmV4dEl0ZW0gPSB0YXJnZXQubmV4dEVsZW1lbnRTaWJsaW5nIGFzIEhUTUxFbGVtZW50IHwgbnVsbFxuXHRcdFx0XHRcdFx0XHRjb25zdCBuZXh0SW5kZXggPSBldmVudEluZGV4ICsgMVxuXHRcdFx0XHRcdFx0XHRpZiAobmV4dEl0ZW0pIHtcblx0XHRcdFx0XHRcdFx0XHRuZXh0SXRlbS5mb2N1cygpXG5cdFx0XHRcdFx0XHRcdFx0YXR0cnMub25TY3JvbGxQb3NpdGlvbkNoYW5nZShuZXh0SXRlbS5vZmZzZXRUb3ApXG5cdFx0XHRcdFx0XHRcdFx0aWYgKG5leHRJbmRleCA8IGV2ZW50cy5sZW5ndGggJiYgIXN0eWxlcy5pc1NpbmdsZUNvbHVtbkxheW91dCgpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRrZXlEb3duKGV2ZW50c1tuZXh0SW5kZXhdLCBuZXcgS2V5Ym9hcmRFdmVudChcImtleWRvd25cIiwgeyBrZXk6IEtleXMuUkVUVVJOLmNvZGUgfSkpXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0YXR0cnMub25TY3JvbGxQb3NpdGlvbkNoYW5nZSh0YXJnZXQub2Zmc2V0VG9wKVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRrZXlEb3duKGV2ZW50LCBkb21FdmVudClcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHpvbmUsXG5cdFx0XHRcdFx0ZGF5OiBkYXksXG5cdFx0XHRcdFx0aGVpZ2h0OiBhZ2VuZGFJdGVtSGVpZ2h0LFxuXHRcdFx0XHRcdHRpbWVUZXh0OiBmb3JtYXRFdmVudFRpbWVzKGRheSwgZXZlbnQsIHpvbmUpLFxuXHRcdFx0XHR9KSxcblx0XHRcdClcblx0XHR9XG5cdFx0Ly8gb25lIGFnZW5kYSBpdGVtIGhlaWdodCBuZWVkcyB0byBiZSByZW1vdmVkIHRvIHNob3cgdGhlIGNvcnJlY3QgaXRlbVxuXHRcdC8vIERvIG5vdCBzY3JvbGwgdG8gdGhlIG5leHQgZWxlbWVudCBpZiBhIHNjcm9sbCBjb21tYW5kIChwYWdlIHVwIGV0Yy4pIGlzIGdpdmVuXG5cdFx0aWYgKGF0dHJzLnNjcm9sbFBvc2l0aW9uID09PSB0aGlzLmxhc3RTY3JvbGxQb3NpdGlvbikgYXR0cnMub25TY3JvbGxQb3NpdGlvbkNoYW5nZShuZXdTY3JvbGxQb3NpdGlvbiAtIChhZ2VuZGFJdGVtSGVpZ2h0ICsgYWdlbmRhR2FwKSlcblx0XHRyZXR1cm4gZXZlbnRzLmxlbmd0aCA9PT0gMFxuXHRcdFx0PyBtKFwiLm1iLXNcIiwgbGFuZy5nZXQoXCJub0VudHJpZXNfbXNnXCIpKVxuXHRcdFx0OiBtKFxuXHRcdFx0XHRcdFwiLmZsZXguY29sXCIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0Z2FwOiBweChhZ2VuZGFHYXApLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGV2ZW50c05vZGVzLFxuXHRcdFx0ICApXG5cdH1cbn1cblxuLyoqXG4gKiBDYWxjdWxhdGUgdGhlIG5leHQgZXZlbnQgdG8gb2NjdXIgd2l0aCBhIGdpdmVuIGRhdGU7IGFsbC1kYXkgZXZlbnRzIHdpbGwgYmUgaWdub3JlZFxuICogQHBhcmFtIGV2ZW50cyBsaXN0IG9mIGV2ZW50cyB0byBjaGVja1xuICogQHBhcmFtIGRhdGUgZGF0ZSB0byB1c2VcbiAqIEByZXR1cm4gdGhlIGluZGV4LCBvciBudWxsIGlmIHRoZXJlIGlzIG5vIG5leHQgZXZlbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVhcmxpZXN0RXZlbnRUb1Nob3dUaW1lSW5kaWNhdG9yKGV2ZW50czogcmVhZG9ubHkgQ2FsZW5kYXJFdmVudFtdLCBkYXRlOiBEYXRlKTogbnVtYmVyIHwgbnVsbCB7XG5cdC8vIFdlIGRvIG5vdCB3YW50IHRvIHNob3cgdGhlIHRpbWUgaW5kaWNhdG9yIGFib3ZlIGFueSBhbGwgZGF5IGV2ZW50c1xuXHRjb25zdCBmaXJzdE5vbkFsbERheUV2ZW50ID0gZXZlbnRzLmZpbmRJbmRleCgoZXZlbnQpID0+ICFpc0FsbERheUV2ZW50KGV2ZW50KSlcblx0aWYgKGZpcnN0Tm9uQWxsRGF5RXZlbnQgPCAwKSB7XG5cdFx0cmV0dXJuIG51bGxcblx0fVxuXG5cdC8vIE5leHQsIHdlIHdhbnQgdG8gbG9jYXRlIHRoZSBmaXJzdCBldmVudCB3aGVyZSB0aGUgc3RhcnQgdGltZSBoYXMgeWV0IHRvIGJlIHJlYWNoZWRcblx0Y29uc3Qgbm9uQWxsRGF5RXZlbnRzID0gZXZlbnRzLnNsaWNlKGZpcnN0Tm9uQWxsRGF5RXZlbnQpXG5cdGNvbnN0IG5leHRFdmVudCA9IG5vbkFsbERheUV2ZW50cy5maW5kSW5kZXgoKGV2ZW50KSA9PiBldmVudC5zdGFydFRpbWUgPiBkYXRlKVxuXHRpZiAobmV4dEV2ZW50IDwgMCkge1xuXHRcdHJldHVybiBudWxsXG5cdH1cblxuXHRyZXR1cm4gbmV4dEV2ZW50ICsgZmlyc3ROb25BbGxEYXlFdmVudFxufVxuIiwiaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2cuanNcIlxuaW1wb3J0IG0sIHsgQ2hpbGRyZW4gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgc3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgU3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBUZXh0RmllbGQsIFRleHRGaWVsZFR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1RleHRGaWVsZC5qc1wiXG5pbXBvcnQgeyBsYW5nLCB0eXBlIFRyYW5zbGF0aW9uS2V5IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB0eXBlIHsgVHJhbnNsYXRpb25LZXlUeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL1RyYW5zbGF0aW9uS2V5LmpzXCJcbmltcG9ydCB7IGRlZXBFcXVhbCwgaXNOb3ROdWxsIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBBbGFybUludGVydmFsLCBDYWxlbmRhclR5cGUsIGlzRXh0ZXJuYWxDYWxlbmRhclR5cGUsIGlzTm9ybWFsQ2FsZW5kYXJUeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyVXRpbHMuanNcIlxuaW1wb3J0IHsgUmVtaW5kZXJzRWRpdG9yIH0gZnJvbSBcIi4vUmVtaW5kZXJzRWRpdG9yLmpzXCJcbmltcG9ydCB7IGNoZWNrVVJMU3RyaW5nLCBpc0ljYWwgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2ltcG9ydC9JbXBvcnRFeHBvcnRVdGlscy5qc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yLmpzXCJcbmltcG9ydCB0eXBlIHsgQ2FsZW5kYXJNb2RlbCB9IGZyb20gXCIuLi9tb2RlbC9DYWxlbmRhck1vZGVsLmpzXCJcbmltcG9ydCB7IERFRkFVTFRfRVJST1IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgTG9naW5CdXR0b24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2J1dHRvbnMvTG9naW5CdXR0b24uanNcIlxuaW1wb3J0IHsgQ29sb3JQaWNrZXJWaWV3IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9jb2xvclBpY2tlci9Db2xvclBpY2tlclZpZXdcIlxuaW1wb3J0IHsgZ2VuZXJhdGVSYW5kb21Db2xvciB9IGZyb20gXCIuL0NhbGVuZGFyR3VpVXRpbHMuanNcIlxuXG5leHBvcnQgdHlwZSBDYWxlbmRhclByb3BlcnRpZXMgPSB7XG5cdG5hbWU6IHN0cmluZ1xuXHRjb2xvcjogc3RyaW5nXG5cdGFsYXJtczogQWxhcm1JbnRlcnZhbFtdXG5cdHNvdXJjZVVybDogc3RyaW5nIHwgbnVsbFxufVxuXG5leHBvcnQgY29uc3QgZGVmYXVsdENhbGVuZGFyUHJvcGVydGllczogQ2FsZW5kYXJQcm9wZXJ0aWVzID0ge1xuXHRuYW1lOiBcIlwiLFxuXHRjb2xvcjogXCJcIixcblx0YWxhcm1zOiBbXSxcblx0c291cmNlVXJsOiBcIlwiLFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlVXJsU3Vic2NyaXB0aW9uKGNhbGVuZGFyTW9kZWw6IENhbGVuZGFyTW9kZWwsIHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCBFcnJvcj4ge1xuXHRpZiAoIWxvY2F0b3IubG9naW5zLmlzRnVsbHlMb2dnZWRJbigpKSByZXR1cm4gbmV3IEVycm9yKFwibm90RnVsbHlMb2dnZWRJbl9tc2dcIilcblxuXHRjb25zdCBleHRlcm5hbEljYWxTdHI6IHN0cmluZyB8IEVycm9yID0gYXdhaXQgY2FsZW5kYXJNb2RlbC5mZXRjaEV4dGVybmFsQ2FsZW5kYXIodXJsKS5jYXRjaCgoZSkgPT4gZSBhcyBFcnJvcilcblx0aWYgKGV4dGVybmFsSWNhbFN0ciBpbnN0YW5jZW9mIEVycm9yIHx8IGV4dGVybmFsSWNhbFN0ci50cmltKCkgPT09IFwiXCIpIHJldHVybiBuZXcgRXJyb3IoXCJmZXRjaGluZ0V4dGVybmFsQ2FsZW5kYXJfZXJyb3JcIilcblxuXHRpZiAoIWlzSWNhbChleHRlcm5hbEljYWxTdHIpKSByZXR1cm4gbmV3IEVycm9yKFwiaW52YWxpZElDYWxfZXJyb3JcIilcblx0cmV0dXJuIGV4dGVybmFsSWNhbFN0clxufVxuXG5mdW5jdGlvbiBzb3VyY2VVcmxJbnB1dEZpZWxkKHVybFN0cmVhbTogU3RyZWFtPHN0cmluZz4sIGVycm9yTWVzc2FnZVN0cmVhbTogU3RyZWFtPHN0cmluZz4pIHtcblx0Y29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3JNZXNzYWdlU3RyZWFtKCkudHJpbSgpXG5cdGxldCBoZWxwZXJNZXNzYWdlID0gXCJcIlxuXHRpZiAodXJsU3RyZWFtKCkudHJpbSgpID09PSBcIlwiKSBoZWxwZXJNZXNzYWdlID0gXCJFLmc6IGh0dHBzOi8vdHV0YS5jb20vaWNzL2V4YW1wbGUuaWNzXCJcblx0ZWxzZSBpZiAoaXNOb3ROdWxsKGVycm9yTWVzc2FnZSkgJiYgZXJyb3JNZXNzYWdlICE9PSBERUZBVUxUX0VSUk9SKSBoZWxwZXJNZXNzYWdlID0gZXJyb3JNZXNzYWdlXG5cdHJldHVybiBtKFRleHRGaWVsZCwge1xuXHRcdGNsYXNzOiBgcHQgcGIgJHtoZWxwZXJNZXNzYWdlLmxlbmd0aCA/IFwiXCIgOiBcIm1iLXNtYWxsLWxpbmUtaGVpZ2h0XCJ9YCxcblx0XHR2YWx1ZTogdXJsU3RyZWFtKCksXG5cdFx0b25pbnB1dDogKHVybDogc3RyaW5nLCBpbnB1dEVsZW1lbnQ6IEhUTUxJbnB1dEVsZW1lbnQpID0+IHtcblx0XHRcdGNvbnN0IGFzc2VydGlvblJlc3VsdCA9IGNoZWNrVVJMU3RyaW5nKHVybClcblx0XHRcdHVybFN0cmVhbSh1cmwpXG5cdFx0XHRpZiAoYXNzZXJ0aW9uUmVzdWx0IGluc3RhbmNlb2YgVVJMKSB7XG5cdFx0XHRcdGVycm9yTWVzc2FnZVN0cmVhbShcIlwiKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH1cblx0XHRcdGVycm9yTWVzc2FnZVN0cmVhbShsYW5nLmdldChhc3NlcnRpb25SZXN1bHQpKVxuXHRcdH0sXG5cdFx0bGFiZWw6IFwidXJsX2xhYmVsXCIsXG5cdFx0dHlwZTogVGV4dEZpZWxkVHlwZS5VcmwsXG5cdFx0aGVscExhYmVsOiAoKSA9PiBtKFwic21hbGwuYmxvY2suY29udGVudC1mZ1wiLCBoZWxwZXJNZXNzYWdlKSxcblx0fSlcbn1cblxuZnVuY3Rpb24gY3JlYXRlRWRpdENhbGVuZGFyQ29tcG9uZW50KFxuXHRuYW1lU3RyZWFtOiBTdHJlYW08c3RyaW5nPixcblx0Y29sb3JTdHJlYW06IFN0cmVhbTxzdHJpbmc+LFxuXHRzaGFyZWQ6IGJvb2xlYW4sXG5cdGNhbGVuZGFyVHlwZTogQ2FsZW5kYXJUeXBlLFxuXHRhbGFybXM6IEFsYXJtSW50ZXJ2YWxbXSxcblx0dXJsU3RyZWFtOiBTdHJlYW08c3RyaW5nPixcblx0ZXJyb3JNZXNzYWdlU3RyZWFtOiBTdHJlYW08c3RyaW5nPixcbikge1xuXHRyZXR1cm4gbS5mcmFnbWVudCh7fSwgW1xuXHRcdG0oVGV4dEZpZWxkLCB7XG5cdFx0XHR2YWx1ZTogbmFtZVN0cmVhbSgpLFxuXHRcdFx0b25pbnB1dDogbmFtZVN0cmVhbSxcblx0XHRcdGxhYmVsOiBcImNhbGVuZGFyTmFtZV9sYWJlbFwiLFxuXHRcdH0pLFxuXHRcdG0oXCIuc21hbGwubXQubWIteHNcIiwgbGFuZy5nZXQoXCJjb2xvcl9sYWJlbFwiKSksXG5cdFx0bShDb2xvclBpY2tlclZpZXcsIHtcblx0XHRcdHZhbHVlOiBjb2xvclN0cmVhbSgpLFxuXHRcdFx0b25zZWxlY3Q6IChjb2xvcjogc3RyaW5nKSA9PiB7XG5cdFx0XHRcdGNvbG9yU3RyZWFtKGNvbG9yKVxuXHRcdFx0fSxcblx0XHR9KSxcblx0XHQhc2hhcmVkICYmIGlzTm9ybWFsQ2FsZW5kYXJUeXBlKGNhbGVuZGFyVHlwZSlcblx0XHRcdD8gbShSZW1pbmRlcnNFZGl0b3IsIHtcblx0XHRcdFx0XHRhbGFybXMsXG5cdFx0XHRcdFx0YWRkQWxhcm06IChhbGFybTogQWxhcm1JbnRlcnZhbCkgPT4ge1xuXHRcdFx0XHRcdFx0YWxhcm1zPy5wdXNoKGFsYXJtKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0cmVtb3ZlQWxhcm06IChhbGFybTogQWxhcm1JbnRlcnZhbCkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgaW5kZXggPSBhbGFybXM/LmZpbmRJbmRleCgoYTogQWxhcm1JbnRlcnZhbCkgPT4gZGVlcEVxdWFsKGEsIGFsYXJtKSlcblx0XHRcdFx0XHRcdGlmIChpbmRleCAhPT0gLTEpIGFsYXJtcz8uc3BsaWNlKGluZGV4LCAxKVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0bGFiZWw6IFwiY2FsZW5kYXJEZWZhdWx0UmVtaW5kZXJfbGFiZWxcIixcblx0XHRcdFx0XHR1c2VOZXdFZGl0b3I6IGZhbHNlLFxuXHRcdFx0ICB9KVxuXHRcdFx0OiBudWxsLFxuXHRcdGlzRXh0ZXJuYWxDYWxlbmRhclR5cGUoY2FsZW5kYXJUeXBlKSA/IHNvdXJjZVVybElucHV0RmllbGQodXJsU3RyZWFtLCBlcnJvck1lc3NhZ2VTdHJlYW0pIDogbnVsbCxcblx0XSlcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVFZGl0RGlhbG9nQXR0cnMge1xuXHRjYWxlbmRhclR5cGU6IENhbGVuZGFyVHlwZVxuXHR0aXRsZVRleHRJZDogVHJhbnNsYXRpb25LZXlUeXBlXG5cdHNoYXJlZDogYm9vbGVhblxuXHRva0FjdGlvbjogKGRpYWxvZzogRGlhbG9nLCBjYWxlbmRhclByb3BlcnRpZXM6IENhbGVuZGFyUHJvcGVydGllcywgY2FsZW5kYXJNb2RlbD86IENhbGVuZGFyTW9kZWwpID0+IHVua25vd25cblx0b2tUZXh0SWQ6IFRyYW5zbGF0aW9uS2V5VHlwZVxuXHR3YXJuaW5nTWVzc2FnZT86ICgpID0+IENoaWxkcmVuXG5cdGNhbGVuZGFyUHJvcGVydGllcz86IENhbGVuZGFyUHJvcGVydGllc1xuXHRpc05ld0NhbGVuZGFyPzogYm9vbGVhblxuXHRjYWxlbmRhck1vZGVsPzogQ2FsZW5kYXJNb2RlbFxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2hvd0NyZWF0ZUVkaXRDYWxlbmRhckRpYWxvZyh7XG5cdGNhbGVuZGFyVHlwZSxcblx0dGl0bGVUZXh0SWQsXG5cdHNoYXJlZCxcblx0b2tBY3Rpb24sXG5cdG9rVGV4dElkLFxuXHR3YXJuaW5nTWVzc2FnZSxcblx0Y2FsZW5kYXJQcm9wZXJ0aWVzOiB7IG5hbWUsIGNvbG9yLCBhbGFybXMsIHNvdXJjZVVybCB9ID0gZGVmYXVsdENhbGVuZGFyUHJvcGVydGllcyxcblx0aXNOZXdDYWxlbmRhciA9IHRydWUsXG5cdGNhbGVuZGFyTW9kZWwsXG59OiBDcmVhdGVFZGl0RGlhbG9nQXR0cnMpIHtcblx0aWYgKGNvbG9yICE9PSBcIlwiKSB7XG5cdFx0Y29sb3IgPSBcIiNcIiArIGNvbG9yXG5cdH0gZWxzZSBpZiAoaXNOZXdDYWxlbmRhciAmJiBpc0V4dGVybmFsQ2FsZW5kYXJUeXBlKGNhbGVuZGFyVHlwZSkpIHtcblx0XHRjb2xvciA9IGdlbmVyYXRlUmFuZG9tQ29sb3IoKVxuXHR9XG5cblx0Y29uc3QgbmFtZVN0cmVhbSA9IHN0cmVhbShuYW1lKVxuXHRjb25zdCBjb2xvclN0cmVhbSA9IHN0cmVhbShjb2xvcilcblx0Y29uc3QgdXJsU3RyZWFtID0gc3RyZWFtKHNvdXJjZVVybCA/PyBcIlwiKVxuXHRjb25zdCBlcnJvck1lc3NhZ2VTdHJlYW0gPSBzdHJlYW0oREVGQVVMVF9FUlJPUilcblxuXHRjb25zdCBleHRlcm5hbENhbGVuZGFyVmFsaWRhdG9yID0gYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IGFzc2VydGlvblJlc3VsdCA9IGNoZWNrVVJMU3RyaW5nKHVybFN0cmVhbSgpKVxuXG5cdFx0aWYgKCFjYWxlbmRhck1vZGVsKSB0aHJvdyBuZXcgRXJyb3IoXCJNaXNzaW5nIG1vZGVsXCIpXG5cblx0XHRpZiAoYXNzZXJ0aW9uUmVzdWx0IGluc3RhbmNlb2YgVVJMKSB7XG5cdFx0XHRjb25zdCBleHRlcm5hbENhbGVuZGFyUmVzdWx0OiBzdHJpbmcgfCBFcnJvciA9IGF3YWl0IGhhbmRsZVVybFN1YnNjcmlwdGlvbihjYWxlbmRhck1vZGVsLCB1cmxTdHJlYW0oKSlcblx0XHRcdGlmIChleHRlcm5hbENhbGVuZGFyUmVzdWx0IGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiBleHRlcm5hbENhbGVuZGFyUmVzdWx0Lm1lc3NhZ2UgYXMgVHJhbnNsYXRpb25LZXlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGFzc2VydGlvblJlc3VsdCBhcyBUcmFuc2xhdGlvbktleVxuXHRcdH1cblx0XHRyZXR1cm4gbnVsbFxuXHR9XG5cblx0Y29uc3QgZG9BY3Rpb24gPSBhc3luYyAoZGlhbG9nOiBEaWFsb2cpID0+IHtcblx0XHRva0FjdGlvbihcblx0XHRcdGRpYWxvZyxcblx0XHRcdHtcblx0XHRcdFx0bmFtZTogbmFtZVN0cmVhbSgpLFxuXHRcdFx0XHRjb2xvcjogY29sb3JTdHJlYW0oKS5zdWJzdHJpbmcoMSksXG5cdFx0XHRcdGFsYXJtcyxcblx0XHRcdFx0c291cmNlVXJsOiB1cmxTdHJlYW0oKS50cmltKCksXG5cdFx0XHR9LFxuXHRcdFx0Y2FsZW5kYXJNb2RlbCxcblx0XHQpXG5cdH1cblxuXHRjb25zdCBleHRlcm5hbENhbGVuZGFyRGlhbG9nUHJvcHMgPSB7XG5cdFx0dGl0bGU6IFwiXCIsXG5cdFx0Y2hpbGQ6IHtcblx0XHRcdHZpZXc6ICgpID0+XG5cdFx0XHRcdG0oXCIuZmxleC5jb2xcIiwgW1xuXHRcdFx0XHRcdG0oXCIubXQubWIuaDYuYlwiLCBsYW5nLmdldCh0aXRsZVRleHRJZCkpLFxuXHRcdFx0XHRcdHdhcm5pbmdNZXNzYWdlID8gd2FybmluZ01lc3NhZ2UoKSA6IG51bGwsXG5cdFx0XHRcdFx0c291cmNlVXJsSW5wdXRGaWVsZCh1cmxTdHJlYW0sIGVycm9yTWVzc2FnZVN0cmVhbSksXG5cdFx0XHRcdFx0bShMb2dpbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0bGFiZWw6IG9rVGV4dElkLFxuXHRcdFx0XHRcdFx0b25jbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRleHRlcm5hbENhbGVuZGFyVmFsaWRhdG9yKClcblx0XHRcdFx0XHRcdFx0XHQudGhlbigodmFsaWRhdG9yUmVzdWx0KSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAodmFsaWRhdG9yUmVzdWx0KSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdERpYWxvZy5tZXNzYWdlKHZhbGlkYXRvclJlc3VsdCBhcyBUcmFuc2xhdGlvbktleSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRkb0FjdGlvbihkaWFsb2cpXG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHQuY2F0Y2goKGUpID0+IERpYWxvZy5tZXNzYWdlKGxhbmcubWFrZVRyYW5zbGF0aW9uKFwiZXJyb3JfbWVzc2FnZVwiLCBlLm1lc3NhZ2UpKSlcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRjbGFzczogZXJyb3JNZXNzYWdlU3RyZWFtKCkudHJpbSgpICE9PSBcIlwiID8gXCJtdC1zIG5vLWhvdmVyIGJ1dHRvbi1iZ1wiIDogXCJtdC1zXCIsXG5cdFx0XHRcdFx0XHRkaXNhYmxlZDogZXJyb3JNZXNzYWdlU3RyZWFtKCkudHJpbSgpICE9PSBcIlwiLFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRdKSxcblx0XHR9LFxuXHRcdG9rQWN0aW9uOiBudWxsLFxuXHR9XG5cblx0Y29uc3QgZGlhbG9nID0gRGlhbG9nLmNyZWF0ZUFjdGlvbkRpYWxvZyhcblx0XHRPYmplY3QuYXNzaWduKFxuXHRcdFx0e1xuXHRcdFx0XHRhbGxvd09rV2l0aFJldHVybjogdHJ1ZSxcblx0XHRcdFx0b2tBY3Rpb25UZXh0SWQ6IG9rVGV4dElkLFxuXHRcdFx0XHR0aXRsZTogdGl0bGVUZXh0SWQsXG5cdFx0XHRcdGNoaWxkOiB7XG5cdFx0XHRcdFx0dmlldzogKCkgPT5cblx0XHRcdFx0XHRcdG0oXCIuZmxleC5jb2xcIiwgW1xuXHRcdFx0XHRcdFx0XHR3YXJuaW5nTWVzc2FnZSA/IHdhcm5pbmdNZXNzYWdlKCkgOiBudWxsLFxuXHRcdFx0XHRcdFx0XHRjcmVhdGVFZGl0Q2FsZW5kYXJDb21wb25lbnQobmFtZVN0cmVhbSwgY29sb3JTdHJlYW0sIHNoYXJlZCwgY2FsZW5kYXJUeXBlLCBhbGFybXMsIHVybFN0cmVhbSwgZXJyb3JNZXNzYWdlU3RyZWFtKSxcblx0XHRcdFx0XHRcdF0pLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRva0FjdGlvbjogZG9BY3Rpb24sXG5cdFx0XHR9LFxuXHRcdFx0aXNOZXdDYWxlbmRhciAmJiBpc0V4dGVybmFsQ2FsZW5kYXJUeXBlKGNhbGVuZGFyVHlwZSkgPyBleHRlcm5hbENhbGVuZGFyRGlhbG9nUHJvcHMgOiB7fSxcblx0XHQpLFxuXHQpXG5cdGRpYWxvZy5zaG93KClcbn1cbiIsImltcG9ydCBtLCB7IENoaWxkQXJyYXksIENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgcHgsIHNpemUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zaXplXCJcbmltcG9ydCB7IERBWV9JTl9NSUxMSVMsIGRvd25jYXN0LCBnZXRFbmRPZkRheSwgZ2V0U3RhcnRPZkRheSwgbWFwTnVsbGFibGUsIG5ldmVyTnVsbCwgbnVtYmVyUmFuZ2UgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7XG5cdGV2ZW50RW5kc0FmdGVyRGF5LFxuXHRldmVudFN0YXJ0c0JlZm9yZSxcblx0Z2V0VGltZVRleHRGb3JtYXRGb3JMb25nRXZlbnQsXG5cdGdldFRpbWVab25lLFxuXHRoYXNBbGFybXNGb3JUaGVVc2VyLFxuXHRpc0NsaWVudE9ubHlDYWxlbmRhcixcbn0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyVXRpbHNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudEJ1YmJsZSB9IGZyb20gXCIuL0NhbGVuZGFyRXZlbnRCdWJibGVcIlxuaW1wb3J0IHR5cGUgeyBDYWxlbmRhckV2ZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgVGltZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9UaW1lLmpzXCJcbmltcG9ydCB7IGdldFBvc0FuZEJvdW5kc0Zyb21Nb3VzZUV2ZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9HdWlVdGlsc1wiXG5pbXBvcnQge1xuXHRFdmVudExheW91dE1vZGUsXG5cdGV4cGFuZEV2ZW50LFxuXHRmb3JtYXRFdmVudFRpbWUsXG5cdGdldEV2ZW50Q29sb3IsXG5cdGdldERpc3BsYXlFdmVudFRpdGxlLFxuXHRnZXRUaW1lRnJvbU1vdXNlUG9zLFxuXHRsYXlPdXRFdmVudHMsXG5cdFRFTVBPUkFSWV9FVkVOVF9PUEFDSVRZLFxufSBmcm9tIFwiLi4vZ3VpL0NhbGVuZGFyR3VpVXRpbHMuanNcIlxuaW1wb3J0IHR5cGUgeyBDYWxlbmRhckV2ZW50QnViYmxlQ2xpY2tIYW5kbGVyLCBDYWxlbmRhckV2ZW50QnViYmxlS2V5RG93bkhhbmRsZXIgfSBmcm9tIFwiLi9DYWxlbmRhclZpZXdNb2RlbFwiXG5pbXBvcnQgdHlwZSB7IEdyb3VwQ29sb3JzIH0gZnJvbSBcIi4vQ2FsZW5kYXJWaWV3XCJcbmltcG9ydCB7IHN0eWxlcyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3N0eWxlc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyVGltZUluZGljYXRvciB9IGZyb20gXCIuL0NhbGVuZGFyVGltZUluZGljYXRvci5qc1wiXG5pbXBvcnQgeyBsaXN0SWRQYXJ0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzLmpzXCJcblxuZXhwb3J0IHR5cGUgQXR0cnMgPSB7XG5cdG9uRXZlbnRDbGlja2VkOiBDYWxlbmRhckV2ZW50QnViYmxlQ2xpY2tIYW5kbGVyXG5cdG9uRXZlbnRLZXlEb3duOiBDYWxlbmRhckV2ZW50QnViYmxlS2V5RG93bkhhbmRsZXJcblx0Z3JvdXBDb2xvcnM6IEdyb3VwQ29sb3JzXG5cdGV2ZW50czogQXJyYXk8Q2FsZW5kYXJFdmVudD5cblx0ZGlzcGxheVRpbWVJbmRpY2F0b3I6IGJvb2xlYW5cblx0b25UaW1lUHJlc3NlZDogKGhvdXJzOiBudW1iZXIsIG1pbnV0ZXM6IG51bWJlcikgPT4gdW5rbm93blxuXHRvblRpbWVDb250ZXh0UHJlc3NlZDogKGhvdXJzOiBudW1iZXIsIG1pbnV0ZXM6IG51bWJlcikgPT4gdW5rbm93blxuXHRkYXk6IERhdGVcblx0c2V0Q3VycmVudERyYWdnZWRFdmVudDogKGV2OiBDYWxlbmRhckV2ZW50KSA9PiB1bmtub3duXG5cdHNldFRpbWVVbmRlck1vdXNlOiAodGltZTogVGltZSkgPT4gdW5rbm93blxuXHRpc1RlbXBvcmFyeUV2ZW50OiAoZXZlbnQ6IENhbGVuZGFyRXZlbnQpID0+IGJvb2xlYW5cblx0aXNEcmFnZ2luZzogYm9vbGVhblxuXHRmdWxsVmlld1dpZHRoPzogbnVtYmVyXG5cdGRpc2FibGVkPzogYm9vbGVhblxufVxuZXhwb3J0IGNvbnN0IGNhbGVuZGFyRGF5VGltZXM6IEFycmF5PFRpbWU+ID0gbnVtYmVyUmFuZ2UoMCwgMjMpLm1hcCgobnVtYmVyKSA9PiBuZXcgVGltZShudW1iZXIsIDApKVxuY29uc3QgYWxsSG91cnNIZWlnaHQgPSBzaXplLmNhbGVuZGFyX2hvdXJfaGVpZ2h0ICogY2FsZW5kYXJEYXlUaW1lcy5sZW5ndGhcblxuZXhwb3J0IGNsYXNzIENhbGVuZGFyRGF5RXZlbnRzVmlldyBpbXBsZW1lbnRzIENvbXBvbmVudDxBdHRycz4ge1xuXHRwcml2YXRlIGRheURvbTogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxBdHRycz4pOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5jb2wucmVsXCIsXG5cdFx0XHR7XG5cdFx0XHRcdG9uY3JlYXRlOiAodm5vZGUpID0+IHtcblx0XHRcdFx0XHR0aGlzLmRheURvbSA9IHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudFxuXHRcdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdFx0fSxcblx0XHRcdFx0b25tb3VzZW1vdmU6IChtb3VzZUV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0ZG93bmNhc3QobW91c2VFdmVudCkucmVkcmF3ID0gZmFsc2Vcblx0XHRcdFx0XHRjb25zdCB0aW1lID0gZ2V0VGltZUZyb21Nb3VzZVBvcyhnZXRQb3NBbmRCb3VuZHNGcm9tTW91c2VFdmVudChtb3VzZUV2ZW50KSwgNClcblx0XHRcdFx0XHRhdHRycy5zZXRUaW1lVW5kZXJNb3VzZSh0aW1lKVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdFtcblx0XHRcdFx0Y2FsZW5kYXJEYXlUaW1lcy5tYXAoKHRpbWUpID0+XG5cdFx0XHRcdFx0bShcIi5jYWxlbmRhci1ob3VyLmZsZXguY3Vyc29yLXBvaW50ZXJcIiwge1xuXHRcdFx0XHRcdFx0b25jbGljazogKGU6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdFx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKVxuXHRcdFx0XHRcdFx0XHRjb25zdCB7IGhvdXIsIG1pbnV0ZSB9ID0gZ2V0VGltZUZyb21DbGlja0ludGVyYWN0aW9uKGUsIHRpbWUpXG5cdFx0XHRcdFx0XHRcdGF0dHJzLm9uVGltZVByZXNzZWQoaG91ciwgbWludXRlKVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdG9uY29udGV4dG1lbnU6IChlOiBNb3VzZUV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IHsgaG91ciwgbWludXRlIH0gPSBnZXRUaW1lRnJvbUNsaWNrSW50ZXJhY3Rpb24oZSwgdGltZSlcblx0XHRcdFx0XHRcdFx0YXR0cnMub25UaW1lQ29udGV4dFByZXNzZWQoaG91ciwgbWludXRlKVxuXHRcdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdCksXG5cdFx0XHRcdHRoaXMuZGF5RG9tID8gdGhpcy5yZW5kZXJFdmVudHMoYXR0cnMsIGF0dHJzLmV2ZW50cykgOiBudWxsLFxuXHRcdFx0XHR0aGlzLnJlbmRlclRpbWVJbmRpY2F0b3IoYXR0cnMpLFxuXHRcdFx0XSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclRpbWVJbmRpY2F0b3IoYXR0cnM6IEF0dHJzKTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IG5vdyA9IG5ldyBEYXRlKClcblxuXHRcdGlmICghYXR0cnMuZGlzcGxheVRpbWVJbmRpY2F0b3IpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0Y29uc3QgdG9wID0gZ2V0VGltZUluZGljYXRvclBvc2l0aW9uKG5vdylcblx0XHRyZXR1cm4gbShcIi5hYnNcIiwgeyBzdHlsZTogeyB0b3A6IHB4KHRvcCksIGxlZnQ6IDAsIHJpZ2h0OiAwIH0gfSwgbShDYWxlbmRhclRpbWVJbmRpY2F0b3IpKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJFdmVudHMoYXR0cnM6IEF0dHJzLCBldmVudHM6IEFycmF5PENhbGVuZGFyRXZlbnQ+KTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBsYXlPdXRFdmVudHMoZXZlbnRzLCBnZXRUaW1lWm9uZSgpLCAoY29sdW1ucykgPT4gdGhpcy5yZW5kZXJDb2x1bW5zKGF0dHJzLCBjb2x1bW5zKSwgRXZlbnRMYXlvdXRNb2RlLlRpbWVCYXNlZENvbHVtbilcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRXZlbnQoYXR0cnM6IEF0dHJzLCBldjogQ2FsZW5kYXJFdmVudCwgY29sdW1uSW5kZXg6IG51bWJlciwgY29sdW1uczogQXJyYXk8QXJyYXk8Q2FsZW5kYXJFdmVudD4+LCBjb2x1bW5XaWR0aDogbnVtYmVyKTogQ2hpbGRyZW4ge1xuXHRcdC8vIElmIGFuIGV2ZW50IHN0YXJ0cyBpbiB0aGUgcHJldmlvdXMgZGF5IG9yIGVuZHMgaW4gdGhlIG5leHQsIHdlIHdhbnQgdG8gY2xhbXAgdG9wL2hlaWdodCB0byBmaXQgd2l0aGluIGp1c3QgdGhpcyBkYXlcblx0XHRjb25zdCB6b25lID0gZ2V0VGltZVpvbmUoKVxuXHRcdGNvbnN0IHN0YXJ0T2ZFdmVudCA9IGV2ZW50U3RhcnRzQmVmb3JlKGF0dHJzLmRheSwgem9uZSwgZXYpID8gZ2V0U3RhcnRPZkRheShhdHRycy5kYXkpIDogZXYuc3RhcnRUaW1lXG5cdFx0Y29uc3QgZW5kT2ZFdmVudCA9IGV2ZW50RW5kc0FmdGVyRGF5KGF0dHJzLmRheSwgem9uZSwgZXYpID8gZ2V0RW5kT2ZEYXkoYXR0cnMuZGF5KSA6IGV2LmVuZFRpbWVcblx0XHRjb25zdCBzdGFydFRpbWUgPSAoc3RhcnRPZkV2ZW50LmdldEhvdXJzKCkgKiA2MCArIHN0YXJ0T2ZFdmVudC5nZXRNaW51dGVzKCkpICogNjAgKiAxMDAwXG5cdFx0Y29uc3QgaGVpZ2h0ID0gKChlbmRPZkV2ZW50LmdldFRpbWUoKSAtIHN0YXJ0T2ZFdmVudC5nZXRUaW1lKCkpIC8gKDEwMDAgKiA2MCAqIDYwKSkgKiBzaXplLmNhbGVuZGFyX2hvdXJfaGVpZ2h0IC0gc2l6ZS5jYWxlbmRhcl9ldmVudF9ib3JkZXJcblx0XHRjb25zdCBmdWxsVmlld1dpZHRoID0gYXR0cnMuZnVsbFZpZXdXaWR0aFxuXHRcdGNvbnN0IG1heFdpZHRoID0gZnVsbFZpZXdXaWR0aCAhPSBudWxsID8gcHgoc3R5bGVzLmlzRGVza3RvcExheW91dCgpID8gZnVsbFZpZXdXaWR0aCAvIDIgOiBmdWxsVmlld1dpZHRoKSA6IFwibm9uZVwiXG5cdFx0Y29uc3QgY29sU3BhbiA9IGV4cGFuZEV2ZW50KGV2LCBjb2x1bW5JbmRleCwgY29sdW1ucylcblx0XHRjb25zdCBldmVudFRpdGxlID0gZ2V0RGlzcGxheUV2ZW50VGl0bGUoZXYuc3VtbWFyeSlcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmFicy5kYXJrZXItaG92ZXJcIixcblx0XHRcdHtcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRtYXhXaWR0aCxcblx0XHRcdFx0XHRsZWZ0OiBweChjb2x1bW5XaWR0aCAqIGNvbHVtbkluZGV4KSxcblx0XHRcdFx0XHR3aWR0aDogcHgoY29sdW1uV2lkdGggKiBjb2xTcGFuKSxcblx0XHRcdFx0XHR0b3A6IHB4KChzdGFydFRpbWUgLyBEQVlfSU5fTUlMTElTKSAqIGFsbEhvdXJzSGVpZ2h0KSxcblx0XHRcdFx0XHRoZWlnaHQ6IHB4KGhlaWdodCksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9ubW91c2Vkb3duOiAoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKCFhdHRycy5pc1RlbXBvcmFyeUV2ZW50KGV2KSkge1xuXHRcdFx0XHRcdFx0YXR0cnMuc2V0Q3VycmVudERyYWdnZWRFdmVudChldilcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0bShDYWxlbmRhckV2ZW50QnViYmxlLCB7XG5cdFx0XHRcdHRleHQ6IGV2ZW50VGl0bGUsXG5cdFx0XHRcdHNlY29uZExpbmVUZXh0OiBtYXBOdWxsYWJsZShnZXRUaW1lVGV4dEZvcm1hdEZvckxvbmdFdmVudChldiwgYXR0cnMuZGF5LCBhdHRycy5kYXksIHpvbmUpLCAob3B0aW9uKSA9PiBmb3JtYXRFdmVudFRpbWUoZXYsIG9wdGlvbikpLFxuXHRcdFx0XHRjb2xvcjogZ2V0RXZlbnRDb2xvcihldiwgYXR0cnMuZ3JvdXBDb2xvcnMpLFxuXHRcdFx0XHRjbGljazogKGRvbUV2ZW50KSA9PiBhdHRycy5vbkV2ZW50Q2xpY2tlZChldiwgZG9tRXZlbnQpLFxuXHRcdFx0XHRrZXlEb3duOiAoZG9tRXZlbnQpID0+IGF0dHJzLm9uRXZlbnRLZXlEb3duKGV2LCBkb21FdmVudCksXG5cdFx0XHRcdGhlaWdodDogaGVpZ2h0IC0gc2l6ZS5jYWxlbmRhcl9kYXlfZXZlbnRfcGFkZGluZyxcblx0XHRcdFx0aGFzQWxhcm06IGhhc0FsYXJtc0ZvclRoZVVzZXIobG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyLCBldiksXG5cdFx0XHRcdGlzQWx0ZXJlZDogZXYucmVjdXJyZW5jZUlkICE9IG51bGwsXG5cdFx0XHRcdHZlcnRpY2FsUGFkZGluZzogc2l6ZS5jYWxlbmRhcl9kYXlfZXZlbnRfcGFkZGluZyxcblx0XHRcdFx0ZmFkZUluOiAhYXR0cnMuaXNUZW1wb3JhcnlFdmVudChldiksXG5cdFx0XHRcdG9wYWNpdHk6IGF0dHJzLmlzVGVtcG9yYXJ5RXZlbnQoZXYpID8gVEVNUE9SQVJZX0VWRU5UX09QQUNJVFkgOiAxLFxuXHRcdFx0XHRlbmFibGVQb2ludGVyRXZlbnRzOiAhYXR0cnMuaXNUZW1wb3JhcnlFdmVudChldikgJiYgIWF0dHJzLmlzRHJhZ2dpbmcgJiYgIWF0dHJzLmRpc2FibGVkLFxuXHRcdFx0XHRpc0NsaWVudE9ubHk6IGlzQ2xpZW50T25seUNhbGVuZGFyKGxpc3RJZFBhcnQoZXYuX2lkKSksXG5cdFx0XHR9KSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckNvbHVtbnMoYXR0cnM6IEF0dHJzLCBjb2x1bW5zOiBBcnJheTxBcnJheTxDYWxlbmRhckV2ZW50Pj4pOiBDaGlsZEFycmF5IHtcblx0XHRjb25zdCBjb2x1bW5XaWR0aCA9IG5ldmVyTnVsbCh0aGlzLmRheURvbSkuY2xpZW50V2lkdGggLyBjb2x1bW5zLmxlbmd0aFxuXHRcdHJldHVybiBjb2x1bW5zLm1hcCgoY29sdW1uLCBpbmRleCkgPT4ge1xuXHRcdFx0cmV0dXJuIGNvbHVtbi5tYXAoKGV2ZW50KSA9PiB7XG5cdFx0XHRcdHJldHVybiB0aGlzLnJlbmRlckV2ZW50KGF0dHJzLCBldmVudCwgaW5kZXgsIGNvbHVtbnMsIE1hdGguZmxvb3IoY29sdW1uV2lkdGgpKVxuXHRcdFx0fSlcblx0XHR9KVxuXHR9XG59XG5cbmZ1bmN0aW9uIGdldFRpbWVJbmRpY2F0b3JQb3NpdGlvbihub3c6IERhdGUpOiBudW1iZXIge1xuXHRjb25zdCBwYXNzZWRNaWxsaXNJbkRheSA9IChub3cuZ2V0SG91cnMoKSAqIDYwICsgbm93LmdldE1pbnV0ZXMoKSkgKiA2MCAqIDEwMDBcblx0cmV0dXJuIChwYXNzZWRNaWxsaXNJbkRheSAvIERBWV9JTl9NSUxMSVMpICogYWxsSG91cnNIZWlnaHRcbn1cblxuZnVuY3Rpb24gZ2V0VGltZUZyb21DbGlja0ludGVyYWN0aW9uKGU6IE1vdXNlRXZlbnQsIHRpbWU6IFRpbWUpOiBUaW1lIHtcblx0Y29uc3QgcmVjdCA9IChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcblx0Y29uc3QgbW91c2VQb3NpdGlvblJlbGF0aXZlVG9SZWN0SGVpZ2h0ID0gTWF0aC5hYnMocmVjdC50b3AgLSBlLmNsaWVudFkpXG5cdGlmIChtb3VzZVBvc2l0aW9uUmVsYXRpdmVUb1JlY3RIZWlnaHQgPiByZWN0LmhlaWdodCAvIDIpIHJldHVybiBuZXcgVGltZSh0aW1lLmhvdXIsIHRpbWUubWludXRlICsgMzApXG5cdHJldHVybiB0aW1lXG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSwgVm5vZGVET00gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBnZXRTdGFydE9mRGF5LCBpbmNyZW1lbnREYXRlLCBpc1RvZGF5LCBsYXN0VGhyb3csIG5ldmVyTnVsbCwgb2ZDbGFzcywgcmVtb3ZlIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBmb3JtYXRTaG9ydFRpbWUsIGZvcm1hdFRpbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvRm9ybWF0dGVyXCJcbmltcG9ydCB7XG5cdGNvbWJpbmVEYXRlV2l0aFRpbWUsXG5cdGV2ZW50RW5kc0FmdGVyRGF5LFxuXHRldmVudFN0YXJ0c0JlZm9yZSxcblx0Z2V0RGlmZkluMjRoSW50ZXJ2YWxzLFxuXHRnZXRFdmVudEVuZCxcblx0Z2V0RXZlbnRTdGFydCxcblx0Z2V0UmFuZ2VPZkRheXMsXG5cdGdldFN0YXJ0T2ZUaGVXZWVrT2Zmc2V0LFxuXHRnZXRTdGFydE9mV2Vlayxcblx0Z2V0VGltZVRleHRGb3JtYXRGb3JMb25nRXZlbnQsXG5cdGdldFRpbWVab25lLFxufSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlsc1wiXG5pbXBvcnQgeyBDYWxlbmRhckRheUV2ZW50c1ZpZXcsIGNhbGVuZGFyRGF5VGltZXMgfSBmcm9tIFwiLi9DYWxlbmRhckRheUV2ZW50c1ZpZXdcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS90aGVtZVwiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3NpemVcIlxuaW1wb3J0IHsgRXZlbnRUZXh0VGltZU9wdGlvbiwgV2Vla1N0YXJ0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgUGFnZVZpZXcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1BhZ2VWaWV3XCJcbmltcG9ydCB0eXBlIHsgQ2FsZW5kYXJFdmVudCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB0eXBlIHsgR3JvdXBDb2xvcnMgfSBmcm9tIFwiLi9DYWxlbmRhclZpZXdcIlxuaW1wb3J0IHR5cGUgeyBFdmVudERyYWdIYW5kbGVyQ2FsbGJhY2tzLCBNb3VzZVBvcyB9IGZyb20gXCIuL0V2ZW50RHJhZ0hhbmRsZXJcIlxuaW1wb3J0IHsgRXZlbnREcmFnSGFuZGxlciB9IGZyb20gXCIuL0V2ZW50RHJhZ0hhbmRsZXJcIlxuaW1wb3J0IHsgZ2V0SWZMYXJnZVNjcm9sbCwgZ2V0UG9zQW5kQm91bmRzRnJvbU1vdXNlRXZlbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0d1aVV0aWxzXCJcbmltcG9ydCB7IFVzZXJFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL21haW4vVXNlckVycm9yXCJcbmltcG9ydCB7IHNob3dVc2VyRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvRXJyb3JIYW5kbGVySW1wbFwiXG5pbXBvcnQgeyBzdHlsZXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zdHlsZXNcIlxuaW1wb3J0IHsgQ0FMRU5EQVJfRVZFTlRfSEVJR0hULCBkYXlzSGF2ZUV2ZW50cywgRXZlbnRMYXlvdXRNb2RlLCBnZXRFdmVudENvbG9yLCBsYXlPdXRFdmVudHMsIFRFTVBPUkFSWV9FVkVOVF9PUEFDSVRZIH0gZnJvbSBcIi4uL2d1aS9DYWxlbmRhckd1aVV0aWxzLmpzXCJcbmltcG9ydCB0eXBlIHsgQ2FsZW5kYXJFdmVudEJ1YmJsZUNsaWNrSGFuZGxlciwgQ2FsZW5kYXJFdmVudEJ1YmJsZUtleURvd25IYW5kbGVyLCBFdmVudHNPbkRheXMgfSBmcm9tIFwiLi9DYWxlbmRhclZpZXdNb2RlbFwiXG5pbXBvcnQgeyBDb250aW51aW5nQ2FsZW5kYXJFdmVudEJ1YmJsZSB9IGZyb20gXCIuL0NvbnRpbnVpbmdDYWxlbmRhckV2ZW50QnViYmxlXCJcbmltcG9ydCB7IENhbGVuZGFyVmlld1R5cGUsIGlzQWxsRGF5RXZlbnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvQ29tbW9uQ2FsZW5kYXJVdGlsc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yLmpzXCJcbmltcG9ydCB7IERhdGVUaW1lIH0gZnJvbSBcImx1eG9uXCJcbmltcG9ydCB7IFRpbWUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvVGltZS5qc1wiXG5pbXBvcnQgeyBEYXlTZWxlY3RvciB9IGZyb20gXCIuLi9ndWkvZGF5LXNlbGVjdG9yL0RheVNlbGVjdG9yLmpzXCJcblxuZXhwb3J0IHR5cGUgTXVsdGlEYXlDYWxlbmRhclZpZXdBdHRycyA9IHtcblx0c2VsZWN0ZWREYXRlOiBEYXRlXG5cdGRheXNJblBlcmlvZDogbnVtYmVyXG5cdG9uRGF0ZVNlbGVjdGVkOiAoZGF0ZTogRGF0ZSwgY2FsZW5kYXJWaWV3VHlwZVRvU2hvdz86IENhbGVuZGFyVmlld1R5cGUpID0+IHVua25vd25cblx0Z2V0RXZlbnRzT25EYXlzOiAocmFuZ2U6IEFycmF5PERhdGU+KSA9PiBFdmVudHNPbkRheXNcblx0b25OZXdFdmVudDogKGRhdGU6IERhdGUgfCBudWxsKSA9PiB1bmtub3duXG5cdG9uRXZlbnRDbGlja2VkOiBDYWxlbmRhckV2ZW50QnViYmxlQ2xpY2tIYW5kbGVyXG5cdG9uRXZlbnRLZXlEb3duOiBDYWxlbmRhckV2ZW50QnViYmxlS2V5RG93bkhhbmRsZXJcblx0Z3JvdXBDb2xvcnM6IEdyb3VwQ29sb3JzXG5cdHN0YXJ0T2ZUaGVXZWVrOiBXZWVrU3RhcnRcblx0b25DaGFuZ2VWaWV3UGVyaW9kOiAobmV4dDogYm9vbGVhbikgPT4gdW5rbm93blxuXHR0ZW1wb3JhcnlFdmVudHM6IEFycmF5PENhbGVuZGFyRXZlbnQ+XG5cdGRyYWdIYW5kbGVyQ2FsbGJhY2tzOiBFdmVudERyYWdIYW5kbGVyQ2FsbGJhY2tzXG5cdGlzRGF5U2VsZWN0b3JFeHBhbmRlZDogYm9vbGVhblxuXHR3ZWVrSW5kaWNhdG9yOiBzdHJpbmcgfCBudWxsXG5cdHNlbGVjdGVkVGltZT86IFRpbWVcblx0c2Nyb2xsUG9zaXRpb246IG51bWJlclxuXHRvblNjcm9sbFBvc2l0aW9uQ2hhbmdlOiAobmV3UG9zaXRpb246IG51bWJlcikgPT4gdW5rbm93blxuXHRvblZpZXdDaGFuZ2VkOiAodm5vZGU6IFZub2RlRE9NKSA9PiB1bmtub3duXG59XG5cbmV4cG9ydCBjbGFzcyBNdWx0aURheUNhbGVuZGFyVmlldyBpbXBsZW1lbnRzIENvbXBvbmVudDxNdWx0aURheUNhbGVuZGFyVmlld0F0dHJzPiB7XG5cdHByaXZhdGUgbG9uZ0V2ZW50c0RvbTogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGRvbUVsZW1lbnRzOiBIVE1MRWxlbWVudFtdID0gW11cblx0cHJpdmF0ZSBldmVudERyYWdIYW5kbGVyOiBFdmVudERyYWdIYW5kbGVyXG5cdHByaXZhdGUgZGF0ZVVuZGVyTW91c2U6IERhdGUgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHZpZXdEb206IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBsYXN0TW91c2VQb3M6IE1vdXNlUG9zIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBpc0hlYWRlckV2ZW50QmVpbmdEcmFnZ2VkOiBib29sZWFuID0gZmFsc2Vcblx0Ly8gVGhlc2UgdmFyaWFibGVzIGFyZSB1c2VkIHRvIHByZXZlbnQgYHNjcm9sbERPTXMoKWAgb3ZlcndyaXRpbmcgYW4gaW4tcHJvZ3Jlc3MgYHNjcm9sbFRvKClgIGZyb20gYSBwcmV2aW91cyBjYWxsIHRvIGBzY3JvbGxET01zKClgXG5cdHByaXZhdGUgaXNQcm9ncmFtbWF0aWNTY3JvbGxJblByb2dyZXNzOiBib29sZWFuID0gZmFsc2Vcblx0cHJpdmF0ZSBzY3JvbGxFbmRUaW1lOiBUaW1lb3V0SUQgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIGxhc3RTY3JvbGxQb3NpdGlvbjogbnVtYmVyIHwgbnVsbCA9IG51bGxcblxuXHRjb25zdHJ1Y3Rvcih7IGF0dHJzIH06IFZub2RlPE11bHRpRGF5Q2FsZW5kYXJWaWV3QXR0cnM+KSB7XG5cdFx0dGhpcy5ldmVudERyYWdIYW5kbGVyID0gbmV3IEV2ZW50RHJhZ0hhbmRsZXIobmV2ZXJOdWxsKGRvY3VtZW50LmJvZHkgYXMgSFRNTEJvZHlFbGVtZW50KSwgYXR0cnMuZHJhZ0hhbmRsZXJDYWxsYmFja3MpXG5cdH1cblxuXHRvbmNyZWF0ZSh2bm9kZTogVm5vZGVET008TXVsdGlEYXlDYWxlbmRhclZpZXdBdHRycz4pIHtcblx0XHR0aGlzLnZpZXdEb20gPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0fVxuXG5cdG9udXBkYXRlKHZub2RlOiBWbm9kZURPTTxNdWx0aURheUNhbGVuZGFyVmlld0F0dHJzPikge1xuXHRcdHRoaXMudmlld0RvbSA9IHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudFxuXHR9XG5cblx0dmlldyh7IGF0dHJzIH06IFZub2RlPE11bHRpRGF5Q2FsZW5kYXJWaWV3QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdC8vIFNwZWNpYWwgY2FzZSBmb3Igd2VlayB2aWV3XG5cblx0XHRjb25zdCBzdGFydE9mVGhpc1BlcmlvZCA9XG5cdFx0XHRhdHRycy5kYXlzSW5QZXJpb2QgPT09IDcgPyBnZXRTdGFydE9mV2VlayhhdHRycy5zZWxlY3RlZERhdGUsIGdldFN0YXJ0T2ZUaGVXZWVrT2Zmc2V0KGF0dHJzLnN0YXJ0T2ZUaGVXZWVrKSkgOiBhdHRycy5zZWxlY3RlZERhdGVcblx0XHRjb25zdCBzdGFydE9mUHJldmlvdXNQZXJpb2QgPSBpbmNyZW1lbnREYXRlKG5ldyBEYXRlKHN0YXJ0T2ZUaGlzUGVyaW9kKSwgLWF0dHJzLmRheXNJblBlcmlvZClcblx0XHRjb25zdCBzdGFydE9mTmV4dFBlcmlvZCA9IGluY3JlbWVudERhdGUobmV3IERhdGUoc3RhcnRPZlRoaXNQZXJpb2QpLCBhdHRycy5kYXlzSW5QZXJpb2QpXG5cblx0XHRjb25zdCBwcmV2aW91c1BhZ2VFdmVudHMgPSB0aGlzLmdldEV2ZW50c0luUmFuZ2UoYXR0cnMuZ2V0RXZlbnRzT25EYXlzLCBhdHRycy5kYXlzSW5QZXJpb2QsIHN0YXJ0T2ZQcmV2aW91c1BlcmlvZClcblx0XHRjb25zdCBjdXJyZW50UGFnZUV2ZW50cyA9IHRoaXMuZ2V0RXZlbnRzSW5SYW5nZShhdHRycy5nZXRFdmVudHNPbkRheXMsIGF0dHJzLmRheXNJblBlcmlvZCwgc3RhcnRPZlRoaXNQZXJpb2QpXG5cdFx0Y29uc3QgbmV4dFBhZ2VFdmVudHMgPSB0aGlzLmdldEV2ZW50c0luUmFuZ2UoYXR0cnMuZ2V0RXZlbnRzT25EYXlzLCBhdHRycy5kYXlzSW5QZXJpb2QsIHN0YXJ0T2ZOZXh0UGVyaW9kKVxuXHRcdGNvbnN0IHN0YXJ0T2ZXZWVrID0gZ2V0U3RhcnRPZldlZWsoYXR0cnMuc2VsZWN0ZWREYXRlLCBnZXRTdGFydE9mVGhlV2Vla09mZnNldChhdHRycy5zdGFydE9mVGhlV2VlaykpXG5cdFx0Y29uc3Qgd2Vla0V2ZW50cyA9IHRoaXMuZ2V0RXZlbnRzSW5SYW5nZShhdHRycy5nZXRFdmVudHNPbkRheXMsIDcsIHN0YXJ0T2ZXZWVrKVxuXG5cdFx0Y29uc3QgaXNEYXlWaWV3ID0gYXR0cnMuZGF5c0luUGVyaW9kID09PSAxXG5cdFx0Y29uc3QgaXNEZXNrdG9wTGF5b3V0ID0gc3R5bGVzLmlzRGVza3RvcExheW91dCgpXG5cblx0XHRyZXR1cm4gbShcIi5mbGV4LmNvbC5maWxsLWFic29sdXRlXCIsIFtcblx0XHRcdCFpc0Rlc2t0b3BMYXlvdXRcblx0XHRcdFx0PyBbXG5cdFx0XHRcdFx0XHR0aGlzLnJlbmRlckRhdGVTZWxlY3RvcihhdHRycywgaXNEYXlWaWV3KSxcblx0XHRcdFx0XHRcdHRoaXMucmVuZGVySGVhZGVyTW9iaWxlKFxuXHRcdFx0XHRcdFx0XHRpc0RheVZpZXcgPyBjdXJyZW50UGFnZUV2ZW50cyA6IHdlZWtFdmVudHMsXG5cdFx0XHRcdFx0XHRcdGF0dHJzLmdyb3VwQ29sb3JzLFxuXHRcdFx0XHRcdFx0XHRhdHRycy5vbkV2ZW50Q2xpY2tlZCxcblx0XHRcdFx0XHRcdFx0YXR0cnMub25FdmVudEtleURvd24sXG5cdFx0XHRcdFx0XHRcdGF0dHJzLnRlbXBvcmFyeUV2ZW50cyxcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdCAgXVxuXHRcdFx0XHQ6IG51bGwsXG5cblx0XHRcdG0oUGFnZVZpZXcsIHtcblx0XHRcdFx0cHJldmlvdXNQYWdlOiB7XG5cdFx0XHRcdFx0a2V5OiBzdGFydE9mUHJldmlvdXNQZXJpb2QuZ2V0VGltZSgpLFxuXHRcdFx0XHRcdG5vZGVzOiB0aGlzLnJlbmRlckRheXMoYXR0cnMsIHByZXZpb3VzUGFnZUV2ZW50cywgY3VycmVudFBhZ2VFdmVudHMsIGlzRGF5VmlldywgaXNEZXNrdG9wTGF5b3V0KSxcblx0XHRcdFx0fSxcblx0XHRcdFx0Y3VycmVudFBhZ2U6IHtcblx0XHRcdFx0XHRrZXk6IHN0YXJ0T2ZUaGlzUGVyaW9kLmdldFRpbWUoKSxcblx0XHRcdFx0XHRub2RlczogdGhpcy5yZW5kZXJEYXlzKGF0dHJzLCBjdXJyZW50UGFnZUV2ZW50cywgY3VycmVudFBhZ2VFdmVudHMsIGlzRGF5VmlldywgaXNEZXNrdG9wTGF5b3V0KSxcblx0XHRcdFx0fSxcblx0XHRcdFx0bmV4dFBhZ2U6IHtcblx0XHRcdFx0XHRrZXk6IHN0YXJ0T2ZOZXh0UGVyaW9kLmdldFRpbWUoKSxcblx0XHRcdFx0XHRub2RlczogdGhpcy5yZW5kZXJEYXlzKGF0dHJzLCBuZXh0UGFnZUV2ZW50cywgY3VycmVudFBhZ2VFdmVudHMsIGlzRGF5VmlldywgaXNEZXNrdG9wTGF5b3V0KSxcblx0XHRcdFx0fSxcblx0XHRcdFx0b25DaGFuZ2VQYWdlOiAobmV4dCkgPT4gYXR0cnMub25DaGFuZ2VWaWV3UGVyaW9kKG5leHQpLFxuXHRcdFx0fSksXG5cdFx0XSlcblx0fVxuXG5cdHByaXZhdGUgZ2V0RXZlbnRzSW5SYW5nZShnZXRFdmVudHNGdW5jdGlvbjogKHJhbmdlOiBEYXRlW10pID0+IEV2ZW50c09uRGF5cywgZGF5c0luUGVyaW9kOiBudW1iZXIsIHN0YXJ0T2ZQZXJpb2Q6IERhdGUpIHtcblx0XHRjb25zdCB3ZWVrUmFuZ2UgPSBnZXRSYW5nZU9mRGF5cyhzdGFydE9mUGVyaW9kLCBkYXlzSW5QZXJpb2QpXG5cdFx0cmV0dXJuIGdldEV2ZW50c0Z1bmN0aW9uKHdlZWtSYW5nZSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRGF0ZVNlbGVjdG9yKGF0dHJzOiBNdWx0aURheUNhbGVuZGFyVmlld0F0dHJzLCBpc0RheVZpZXc6IGJvb2xlYW4pOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXCJcIiwgW1xuXHRcdFx0bShcblx0XHRcdFx0XCIuaGVhZGVyLWJnLnBiLXMub3ZlcmZsb3ctaGlkZGVuXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XCJtYXJnaW4tbGVmdFwiOiBweChzaXplLmNhbGVuZGFyX2hvdXJfd2lkdGhfbW9iaWxlKSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRtKERheVNlbGVjdG9yLCB7XG5cdFx0XHRcdFx0c2VsZWN0ZWREYXRlOiBhdHRycy5zZWxlY3RlZERhdGUsXG5cdFx0XHRcdFx0b25EYXRlU2VsZWN0ZWQ6IChkYXRlKSA9PiBhdHRycy5vbkRhdGVTZWxlY3RlZChkYXRlKSxcblx0XHRcdFx0XHR3aWRlOiB0cnVlLFxuXHRcdFx0XHRcdHN0YXJ0T2ZUaGVXZWVrT2Zmc2V0OiBnZXRTdGFydE9mVGhlV2Vla09mZnNldChhdHRycy5zdGFydE9mVGhlV2VlayksXG5cdFx0XHRcdFx0aXNEYXlTZWxlY3RvckV4cGFuZGVkOiBhdHRycy5pc0RheVNlbGVjdG9yRXhwYW5kZWQsXG5cdFx0XHRcdFx0aGFuZGxlRGF5UGlja2VyU3dpcGU6IChpc05leHQ6IGJvb2xlYW4pID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IHNpZ24gPSBpc05leHQgPyAxIDogLTFcblx0XHRcdFx0XHRcdGNvbnN0IGR1cmF0aW9uID0ge1xuXHRcdFx0XHRcdFx0XHRtb250aDogc2lnbiAqIChhdHRycy5pc0RheVNlbGVjdG9yRXhwYW5kZWQgPyAxIDogMCksXG5cdFx0XHRcdFx0XHRcdHdlZWs6IHNpZ24gKiAoYXR0cnMuaXNEYXlTZWxlY3RvckV4cGFuZGVkID8gMCA6IDEpLFxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRhdHRycy5vbkRhdGVTZWxlY3RlZChEYXRlVGltZS5mcm9tSlNEYXRlKGF0dHJzLnNlbGVjdGVkRGF0ZSkucGx1cyhkdXJhdGlvbikudG9KU0RhdGUoKSlcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHNob3dEYXlTZWxlY3Rpb246IGlzRGF5Vmlldyxcblx0XHRcdFx0XHRoaWdobGlnaHRUb2RheTogdHJ1ZSxcblx0XHRcdFx0XHRoaWdobGlnaHRTZWxlY3RlZFdlZWs6ICFpc0RheVZpZXcsXG5cdFx0XHRcdFx0dXNlTmFycm93V2Vla05hbWU6IHN0eWxlcy5pc1NpbmdsZUNvbHVtbkxheW91dCgpLFxuXHRcdFx0XHRcdGhhc0V2ZW50T246IChkYXRlKSA9PiBkYXlzSGF2ZUV2ZW50cyhhdHRycy5nZXRFdmVudHNPbkRheXMoW2RhdGVdKSksXG5cdFx0XHRcdH0pLFxuXHRcdFx0KSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgZ2V0VG9kYXlUaW1lc3RhbXAoKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gZ2V0U3RhcnRPZkRheShuZXcgRGF0ZSgpKS5nZXRUaW1lKClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRGF5cyhcblx0XHRhdHRyczogTXVsdGlEYXlDYWxlbmRhclZpZXdBdHRycyxcblx0XHR0aGlzUGVyaW9kOiBFdmVudHNPbkRheXMsXG5cdFx0bWFpblBlcmlvZDogRXZlbnRzT25EYXlzLFxuXHRcdGlzRGF5VmlldzogYm9vbGVhbixcblx0XHRpc0Rlc2t0b3BMYXlvdXQ6IGJvb2xlYW4sXG5cdCk6IENoaWxkcmVuIHtcblx0XHRsZXQgY29udGFpbmVyU3R5bGVcblxuXHRcdGlmIChpc0Rlc2t0b3BMYXlvdXQpIHtcblx0XHRcdGNvbnRhaW5lclN0eWxlID0ge1xuXHRcdFx0XHRtYXJnaW5MZWZ0OiBcIjVweFwiLFxuXHRcdFx0XHRvdmVyZmxvdzogXCJoaWRkZW5cIixcblx0XHRcdFx0bWFyZ2luQm90dG9tOiBweChzaXplLmhwYWRfbGFyZ2UpLFxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb250YWluZXJTdHlsZSA9IHt9XG5cdFx0fVxuXG5cdFx0Ly8gV2hldGhlciB0aGUgY3VycmVudCBsaXN0IGlzIHRoZSB2aXNpYmxlIGxpc3QgYW5kIG5vdCBvbmUgb2YgdGhlIGxpc3RzIHVzZWQgZm9yIHN3aXBpbmdcblx0XHRjb25zdCBpc01haW5WaWV3ID0gdGhpc1BlcmlvZCA9PT0gbWFpblBlcmlvZFxuXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5maWxsLWFic29sdXRlLmZsZXguY29sLm92ZXJmbG93LWhpZGRlblwiLFxuXHRcdFx0e1xuXHRcdFx0XHRjbGFzczogaXNEZXNrdG9wTGF5b3V0ID8gXCJtbHItbCBib3JkZXItcmFkaXVzLWJpZ1wiIDogXCJib3JkZXItcmFkaXVzLXRvcC1sZWZ0LWJpZyBib3JkZXItcmFkaXVzLXRvcC1yaWdodC1iaWcgY29udGVudC1iZyBtbHItc2FmZS1pbnNldFwiLFxuXHRcdFx0XHRzdHlsZTogY29udGFpbmVyU3R5bGUsXG5cdFx0XHRcdG9ubW91c2Vtb3ZlOiAobW91c2VFdmVudDogRXZlbnRSZWRyYXc8TW91c2VFdmVudD4pID0+IHtcblx0XHRcdFx0XHRtb3VzZUV2ZW50LnJlZHJhdyA9IGZhbHNlXG5cdFx0XHRcdFx0dGhpcy5sYXN0TW91c2VQb3MgPSBnZXRQb3NBbmRCb3VuZHNGcm9tTW91c2VFdmVudChtb3VzZUV2ZW50KVxuXG5cdFx0XHRcdFx0aWYgKHRoaXMuZGF0ZVVuZGVyTW91c2UpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLmV2ZW50RHJhZ0hhbmRsZXIuaGFuZGxlRHJhZyh0aGlzLmRhdGVVbmRlck1vdXNlLCB0aGlzLmxhc3RNb3VzZVBvcylcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9ubW91c2V1cDogKG1vdXNlRXZlbnQ6IEV2ZW50UmVkcmF3PE1vdXNlRXZlbnQ+KSA9PiB7XG5cdFx0XHRcdFx0bW91c2VFdmVudC5yZWRyYXcgPSBmYWxzZVxuXG5cdFx0XHRcdFx0dGhpcy5lbmREcmFnKG1vdXNlRXZlbnQpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9ubW91c2VsZWF2ZTogKG1vdXNlRXZlbnQ6IEV2ZW50UmVkcmF3PE1vdXNlRXZlbnQ+KSA9PiB7XG5cdFx0XHRcdFx0bW91c2VFdmVudC5yZWRyYXcgPSBmYWxzZVxuXG5cdFx0XHRcdFx0aWYgKHRoaXMuZXZlbnREcmFnSGFuZGxlci5pc0RyYWdnaW5nKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmNhbmNlbERyYWcoKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRbXG5cdFx0XHRcdGlzRGVza3RvcExheW91dCA/IHRoaXMucmVuZGVySGVhZGVyRGVza3RvcChhdHRycywgdGhpc1BlcmlvZCwgbWFpblBlcmlvZCkgOiBudWxsLFxuXHRcdFx0XHQvLyB1c2luZyAuc2Nyb2xsLW5vLW92ZXJsYXkgYmVjYXVzZSBvZiBhIGJyb3dzZXIgYnVnIGluIENocm9taXVtIHdoZXJlIHNjcm9sbCB3b3VsZG4ndCB3b3JrIGF0IGFsbFxuXHRcdFx0XHQvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3R1dGFvL3R1dGFub3RhL2lzc3Vlcy80ODQ2XG5cdFx0XHRcdG0oXG5cdFx0XHRcdFx0XCIuZmxleC5zY3JvbGwtbm8tb3ZlcmxheS5jb250ZW50LWJnXCIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0b25jcmVhdGU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmlzUHJvZ3JhbW1hdGljU2Nyb2xsSW5Qcm9ncmVzcyA9IGZhbHNlXG5cdFx0XHRcdFx0XHRcdGlmIChpc01haW5WaWV3KSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGF0dHJzLnNlbGVjdGVkVGltZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0YXR0cnMub25TY3JvbGxQb3NpdGlvbkNoYW5nZShzaXplLmNhbGVuZGFyX2hvdXJfaGVpZ2h0ICogYXR0cnMuc2VsZWN0ZWRUaW1lLmhvdXIpXG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuc2Nyb2xsRE9Ncyh2bm9kZSwgYXR0cnMsIGZhbHNlKVxuXHRcdFx0XHRcdFx0XHRcdGF0dHJzLm9uVmlld0NoYW5nZWQodm5vZGUpXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5sYXN0U2Nyb2xsUG9zaXRpb24gPSBhdHRycy5zY3JvbGxQb3NpdGlvblxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHRoaXMuZG9tRWxlbWVudHMucHVzaCh2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQpXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0b251cGRhdGU6IGlzTWFpblZpZXdcblx0XHRcdFx0XHRcdFx0PyAodm5vZGUpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuc2Nyb2xsRE9Ncyh2bm9kZSwgYXR0cnMsIGdldElmTGFyZ2VTY3JvbGwodGhpcy5sYXN0U2Nyb2xsUG9zaXRpb24sIGF0dHJzLnNjcm9sbFBvc2l0aW9uKSlcblx0XHRcdFx0XHRcdFx0XHRcdGF0dHJzLm9uVmlld0NoYW5nZWQodm5vZGUpXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmxhc3RTY3JvbGxQb3NpdGlvbiA9IGF0dHJzLnNjcm9sbFBvc2l0aW9uXG5cdFx0XHRcdFx0XHRcdCAgfVxuXHRcdFx0XHRcdFx0XHQ6IHVuZGVmaW5lZCxcblx0XHRcdFx0XHRcdG9uc2Nyb2xsOiBpc01haW5WaWV3XG5cdFx0XHRcdFx0XHRcdD8gKGV2ZW50OiBFdmVudCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0Ly8gSWdub3JlIGNhbGxzIHRvIGBzY3JvbGxUbygpYCB2aWEgdGhlIGBpc1Byb2dyYW1tYXRpY1Njcm9sbEluUHJvZ3Jlc3NgIGZsYWdcblx0XHRcdFx0XHRcdFx0XHRcdC8vIGJlY2F1c2UgdGhleSBhcmUgY29uc2lkZXJlZCB1c2VyIGlucHV0IGJ5IGBldmVudC5pc1RydXN0ZWRgXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBTYWZhcmkgZG9lcyBub3Qgc3VwcG9ydCB0aGUgc2Nyb2xsIGVuZCBldmVudCwgc28gd2UgaGF2ZSB0byBpbXBsZW1lbnQgaXQgb3Vyc2VsdmVzXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAodGhpcy5pc1Byb2dyYW1tYXRpY1Njcm9sbEluUHJvZ3Jlc3MpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMuc2Nyb2xsRW5kVGltZSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5zY3JvbGxFbmRUaW1lID0gc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5pc1Byb2dyYW1tYXRpY1Njcm9sbEluUHJvZ3Jlc3MgPSBmYWxzZVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGF0dHJzLm9uU2Nyb2xsUG9zaXRpb25DaGFuZ2UoKGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCkuc2Nyb2xsVG9wKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9LCAxMDApXG5cdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRhdHRycy5vblNjcm9sbFBvc2l0aW9uQ2hhbmdlKChldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLnNjcm9sbFRvcClcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0ICB9XG5cdFx0XHRcdFx0XHRcdDogdW5kZWZpbmVkLFxuXHRcdFx0XHRcdFx0b25yZW1vdmU6ICh2bm9kZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRyZW1vdmUodGhpcy5kb21FbGVtZW50cywgdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50KVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFtcblx0XHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcdFwiLmZsZXguY29sXCIsXG5cdFx0XHRcdFx0XHRcdGNhbGVuZGFyRGF5VGltZXMubWFwKCh0aW1lKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0Y29uc3Qgd2lkdGggPSBpc0Rlc2t0b3BMYXlvdXQgPyBzaXplLmNhbGVuZGFyX2hvdXJfd2lkdGggOiBzaXplLmNhbGVuZGFyX2hvdXJfd2lkdGhfbW9iaWxlXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG0oXG5cdFx0XHRcdFx0XHRcdFx0XHRcIi5jYWxlbmRhci1ob3VyLmZsZXguY3Vyc29yLXBvaW50ZXJcIixcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0b25jbGljazogKGU6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0YXR0cnMub25OZXdFdmVudCh0aW1lLnRvRGF0ZShhdHRycy5zZWxlY3RlZERhdGUpKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwiLnBsLXMucHItcy5jZW50ZXIuc21hbGwuZmxleC5mbGV4LWNvbHVtbi5qdXN0aWZ5LWNlbnRlclwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwibGluZS1oZWlnaHRcIjogaXNEZXNrdG9wTGF5b3V0ID8gcHgoc2l6ZS5jYWxlbmRhcl9ob3VyX2hlaWdodCkgOiBcInVuc2V0XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR3aWR0aDogcHgod2lkdGgpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aGVpZ2h0OiBweChzaXplLmNhbGVuZGFyX2hvdXJfaGVpZ2h0KSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwiYm9yZGVyLXJpZ2h0XCI6IGAxcHggc29saWQgJHt0aGVtZS5jb250ZW50X2JvcmRlcn1gLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlzRGVza3RvcExheW91dCA/IGZvcm1hdFRpbWUodGltZS50b0RhdGUoKSkgOiBmb3JtYXRTaG9ydFRpbWUodGltZS50b0RhdGUoKSksXG5cdFx0XHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XCIuZmxleC5mbGV4LWdyb3dcIixcblx0XHRcdFx0XHRcdFx0dGhpc1BlcmlvZC5kYXlzLm1hcCgod2Vla2RheSwgaSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IGV2ZW50cyA9IHRoaXNQZXJpb2Quc2hvcnRFdmVudHNQZXJEYXlbaV1cblxuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IG5ld0V2ZW50SGFuZGxlciA9IChob3VyczogbnVtYmVyLCBtaW51dGVzOiBudW1iZXIpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IG5ld0RhdGUgPSBuZXcgRGF0ZSh3ZWVrZGF5KVxuXHRcdFx0XHRcdFx0XHRcdFx0bmV3RGF0ZS5zZXRIb3Vycyhob3VycywgbWludXRlcylcblx0XHRcdFx0XHRcdFx0XHRcdGF0dHJzLm9uTmV3RXZlbnQobmV3RGF0ZSlcblx0XHRcdFx0XHRcdFx0XHRcdGF0dHJzLm9uRGF0ZVNlbGVjdGVkKG5ldyBEYXRlKHdlZWtkYXkpKVxuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBtKFxuXHRcdFx0XHRcdFx0XHRcdFx0XCIuZmxleC1ncm93XCIsXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNsYXNzOiAhaXNEYXlWaWV3ID8gXCJjYWxlbmRhci1jb2x1bW4tYm9yZGVyXCIgOiBcIlwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGhlaWdodDogcHgoY2FsZW5kYXJEYXlUaW1lcy5sZW5ndGggKiBzaXplLmNhbGVuZGFyX2hvdXJfaGVpZ2h0KSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRtKENhbGVuZGFyRGF5RXZlbnRzVmlldywge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRvbkV2ZW50Q2xpY2tlZDogYXR0cnMub25FdmVudENsaWNrZWQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9uRXZlbnRLZXlEb3duOiBhdHRycy5vbkV2ZW50S2V5RG93bixcblx0XHRcdFx0XHRcdFx0XHRcdFx0Z3JvdXBDb2xvcnM6IGF0dHJzLmdyb3VwQ29sb3JzLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRldmVudHM6IGV2ZW50cyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZGlzcGxheVRpbWVJbmRpY2F0b3I6IHdlZWtkYXkuZ2V0VGltZSgpID09PSBNdWx0aURheUNhbGVuZGFyVmlldy5nZXRUb2RheVRpbWVzdGFtcCgpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRvblRpbWVQcmVzc2VkOiBuZXdFdmVudEhhbmRsZXIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9uVGltZUNvbnRleHRQcmVzc2VkOiBuZXdFdmVudEhhbmRsZXIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGRheTogd2Vla2RheSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0c2V0Q3VycmVudERyYWdnZWRFdmVudDogKGV2ZW50KSA9PiB0aGlzLnN0YXJ0RXZlbnREcmFnKGV2ZW50KSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0c2V0VGltZVVuZGVyTW91c2U6ICh0aW1lKSA9PiAodGhpcy5kYXRlVW5kZXJNb3VzZSA9IGNvbWJpbmVEYXRlV2l0aFRpbWUod2Vla2RheSwgdGltZSkpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpc1RlbXBvcmFyeUV2ZW50OiAoZXZlbnQpID0+IGF0dHJzLnRlbXBvcmFyeUV2ZW50cy5pbmNsdWRlcyhldmVudCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlzRHJhZ2dpbmc6IHRoaXMuZXZlbnREcmFnSGFuZGxlci5pc0RyYWdnaW5nLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRmdWxsVmlld1dpZHRoOiB0aGlzLnZpZXdEb20/LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRkaXNhYmxlZDogIWlzTWFpblZpZXcsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHQpLFxuXHRcdFx0XSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHNjcm9sbERPTXModm5vZGU6IFZub2RlRE9NLCBhdHRyczogTXVsdGlEYXlDYWxlbmRhclZpZXdBdHRycywgaXNTbW9vdGg6IGJvb2xlYW4pOiB2b2lkIHtcblx0XHQvLyBEbyBub3Qgb3ZlcnJpZGUgYW4gb25nb2luZyBgc2Nyb2xsVG8oKWAgY2FsbCB1bmxlc3MgdGhlIHVwZGF0ZSB3YXMgY2F1c2VkIGJ5IHVzZXIgaW5wdXRcblx0XHQvLyBBbHNvIGRvIG5vdCBzY3JvbGwgdG8gYSBwb3NpdGlvbiB0aGUgbGlzdCBpcyBhbHJlYWR5IGF0XG5cdFx0aWYgKCh0aGlzLmlzUHJvZ3JhbW1hdGljU2Nyb2xsSW5Qcm9ncmVzcyAmJiB0aGlzLmxhc3RTY3JvbGxQb3NpdGlvbiA9PT0gYXR0cnMuc2Nyb2xsUG9zaXRpb24pIHx8IHZub2RlLmRvbS5zY3JvbGxUb3AgPT09IGF0dHJzLnNjcm9sbFBvc2l0aW9uKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHRpZiAoaXNTbW9vdGgpIHtcblx0XHRcdHRoaXMuaXNQcm9ncmFtbWF0aWNTY3JvbGxJblByb2dyZXNzID0gdHJ1ZVxuXHRcdFx0dm5vZGUuZG9tLnNjcm9sbFRvKHsgdG9wOiBhdHRycy5zY3JvbGxQb3NpdGlvbiwgYmVoYXZpb3I6IFwic21vb3RoXCIgfSlcblx0XHRcdGZvciAoY29uc3QgZG9tIG9mIHRoaXMuZG9tRWxlbWVudHMpIHtcblx0XHRcdFx0ZG9tLnNjcm9sbFRvKHsgdG9wOiBhdHRycy5zY3JvbGxQb3NpdGlvbiwgYmVoYXZpb3I6IFwic21vb3RoXCIgfSlcblx0XHRcdH1cblx0XHRcdHZub2RlLmRvbS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInNjcm9sbFwiKSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pc1Byb2dyYW1tYXRpY1Njcm9sbEluUHJvZ3Jlc3MgPSBmYWxzZVxuXHRcdFx0dm5vZGUuZG9tLnNjcm9sbFRvcCA9IGF0dHJzLnNjcm9sbFBvc2l0aW9uXG5cdFx0XHRmb3IgKGNvbnN0IGRvbSBvZiB0aGlzLmRvbUVsZW1lbnRzKSB7XG5cdFx0XHRcdGRvbS5zY3JvbGxUb3AgPSBhdHRycy5zY3JvbGxQb3NpdGlvblxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgc3RhcnRFdmVudERyYWcoZXZlbnQ6IENhbGVuZGFyRXZlbnQpIHtcblx0XHRjb25zdCBsYXN0TW91c2VQb3MgPSB0aGlzLmxhc3RNb3VzZVBvc1xuXG5cdFx0aWYgKHRoaXMuZGF0ZVVuZGVyTW91c2UgJiYgbGFzdE1vdXNlUG9zKSB7XG5cdFx0XHR0aGlzLmV2ZW50RHJhZ0hhbmRsZXIucHJlcGFyZURyYWcoZXZlbnQsIHRoaXMuZGF0ZVVuZGVyTW91c2UsIGxhc3RNb3VzZVBvcywgdGhpcy5pc0hlYWRlckV2ZW50QmVpbmdEcmFnZ2VkKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVySGVhZGVyTW9iaWxlKFxuXHRcdHRoaXNQYWdlRXZlbnRzOiBFdmVudHNPbkRheXMsXG5cdFx0Z3JvdXBDb2xvcnM6IEdyb3VwQ29sb3JzLFxuXHRcdG9uRXZlbnRDbGlja2VkOiBDYWxlbmRhckV2ZW50QnViYmxlQ2xpY2tIYW5kbGVyLFxuXHRcdG9uRXZlbnRLZXlEb3duOiBDYWxlbmRhckV2ZW50QnViYmxlS2V5RG93bkhhbmRsZXIsXG5cdFx0dGVtcG9yYXJ5RXZlbnRzOiBBcnJheTxDYWxlbmRhckV2ZW50Pixcblx0KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IGxvbmdFdmVudHNSZXN1bHQgPSB0aGlzLnJlbmRlckxvbmdFdmVudHMoXG5cdFx0XHR0aGlzUGFnZUV2ZW50cy5kYXlzLFxuXHRcdFx0dGhpc1BhZ2VFdmVudHMubG9uZ0V2ZW50cyxcblx0XHRcdGdyb3VwQ29sb3JzLFxuXHRcdFx0b25FdmVudENsaWNrZWQsXG5cdFx0XHRvbkV2ZW50S2V5RG93bixcblx0XHRcdHRlbXBvcmFyeUV2ZW50cyxcblx0XHRcdGZhbHNlLFxuXHRcdClcblx0XHQvLyBXZSBjYWxjdWxhdGUgdGhlIGhlaWdodCBtYW51YWxseSBiZWNhdXNlIHdlIHdhbnQgdGhlIGhlYWRlciB0byB0cmFuc2l0aW9uIGJldHdlZW4gaGVpZ2h0cyB3aGVuIHN3aXBpbmcgbGVmdCBhbmQgcmlnaHRcblx0XHQvLyBIYXJkY29kaW5nIHNvbWUgc3R5bGVzIGluc3RlYWQgb2YgY2xhc3NlcyBzbyB0aGF0IHdlIGNhbiBhdm9pZCBuYXN0eSBtYWdpYyBudW1iZXJzXG5cdFx0Y29uc3QgbWFpblBhZ2VFdmVudHNDb3VudCA9IGxvbmdFdmVudHNSZXN1bHQucm93c1xuXHRcdGNvbnN0IHBhZGRpbmcgPSBtYWluUGFnZUV2ZW50c0NvdW50ICE9PSAwID8gc2l6ZS52cGFkX3NtYWxsIDogMFxuXHRcdC8vIFNldCBib3R0b20gcGFkZGluZyBpbiBoZWlnaHQsIGJlY2F1c2UgaXQgd2lsbCBiZSBpZ25vcmVkIGluIHRoZSBzdHlsZVxuXHRcdGNvbnN0IGhlaWdodCA9IG1haW5QYWdlRXZlbnRzQ291bnQgKiBDQUxFTkRBUl9FVkVOVF9IRUlHSFQgKyBwYWRkaW5nXG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5jYWxlbmRhci1sb25nLWV2ZW50cy1oZWFkZXIuZmxleC1maXhlZC5jYWxlbmRhci1ob3VyLW1hcmdpbi5wci1sLnJlbFwiLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdG1hcmdpbkxlZnQ6IHNpemUuY2FsZW5kYXJfaG91cl93aWR0aF9tb2JpbGUsXG5cdFx0XHRcdFx0Ym9yZGVyQm90dG9tOiBcIm5vbmVcIixcblx0XHRcdFx0XHRoZWlnaHQ6IHB4KGhlaWdodCksXG5cdFx0XHRcdFx0cGFkZGluZ1RvcDogcHgocGFkZGluZyksXG5cdFx0XHRcdFx0dHJhbnNpdGlvbjogXCJoZWlnaHQgMjAwbXMgZWFzZS1pbi1vdXRcIixcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRsb25nRXZlbnRzUmVzdWx0LmNoaWxkcmVuLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVySGVhZGVyRGVza3RvcChhdHRyczogTXVsdGlEYXlDYWxlbmRhclZpZXdBdHRycywgdGhpc1BhZ2VFdmVudHM6IEV2ZW50c09uRGF5cywgbWFpblBhZ2VFdmVudHM6IEV2ZW50c09uRGF5cyk6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IGRheXNJblBlcmlvZCwgb25EYXRlU2VsZWN0ZWQsIG9uRXZlbnRDbGlja2VkLCBvbkV2ZW50S2V5RG93biwgZ3JvdXBDb2xvcnMsIHRlbXBvcmFyeUV2ZW50cyB9ID0gYXR0cnNcblx0XHQvLyBgc2Nyb2xsYmFyLWd1dHRlci1zdGFibGUtb3ItZmFsbGJhY2tgIGlzIG5lZWRlZCBiZWNhdXNlIHRoZSBzY3JvbGwgYmFyIGJyaW5ncyB0aGUgY2FsZW5kYXIgYm9keSBvdXQgb2YgbGluZSB3aXRoIHRoZSBoZWFkZXJcblx0XHRyZXR1cm4gbShcIi5jYWxlbmRhci1sb25nLWV2ZW50cy1oZWFkZXIuZmxleC1maXhlZC5jb250ZW50LWJnLnB0LXMuc2Nyb2xsYmFyLWd1dHRlci1zdGFibGUtb3ItZmFsbGJhY2tcIiwgW1xuXHRcdFx0dGhpcy5yZW5kZXJEYXlOYW1lc1Jvdyh0aGlzUGFnZUV2ZW50cy5kYXlzLCBhdHRycy53ZWVrSW5kaWNhdG9yLCBvbkRhdGVTZWxlY3RlZCksXG5cdFx0XHRtKFwiLmNvbnRlbnQtYmdcIiwgW1xuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLmNhbGVuZGFyLWhvdXItbWFyZ2luLmNvbnRlbnQtYmdcIixcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRvbm1vdXNlbW92ZTogKG1vdXNlRXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgeyB4LCB0YXJnZXRXaWR0aCB9ID0gZ2V0UG9zQW5kQm91bmRzRnJvbU1vdXNlRXZlbnQobW91c2VFdmVudClcblx0XHRcdFx0XHRcdFx0Y29uc3QgZGF5V2lkdGggPSB0YXJnZXRXaWR0aCAvIGRheXNJblBlcmlvZFxuXHRcdFx0XHRcdFx0XHRjb25zdCBkYXlOdW1iZXIgPSBNYXRoLmZsb29yKHggLyBkYXlXaWR0aClcblx0XHRcdFx0XHRcdFx0Y29uc3QgZGF0ZSA9IG5ldyBEYXRlKHRoaXNQYWdlRXZlbnRzLmRheXNbZGF5TnVtYmVyXSlcblx0XHRcdFx0XHRcdFx0Y29uc3QgZGF0ZVVuZGVyTW91c2UgPSB0aGlzLmRhdGVVbmRlck1vdXNlXG5cblx0XHRcdFx0XHRcdFx0Ly8gV2hlbiBkcmFnZ2luZyBzaG9ydCBldmVudHMsIGRvbid0IGNhdXNlIHRoZSBtb3VzZSBwb3NpdGlvbiBkYXRlIHRvIGRyb3AgdG8gMDA6MDAgd2hlbiBkcmFnZ2luZyBvdmVyIHRoZSBoZWFkZXJcblx0XHRcdFx0XHRcdFx0aWYgKGRhdGVVbmRlck1vdXNlICYmIHRoaXMuZXZlbnREcmFnSGFuZGxlci5pc0RyYWdnaW5nICYmICF0aGlzLmlzSGVhZGVyRXZlbnRCZWluZ0RyYWdnZWQpIHtcblx0XHRcdFx0XHRcdFx0XHRkYXRlLnNldEhvdXJzKGRhdGVVbmRlck1vdXNlLmdldEhvdXJzKCkpXG5cdFx0XHRcdFx0XHRcdFx0ZGF0ZS5zZXRNaW51dGVzKGRhdGVVbmRlck1vdXNlLmdldE1pbnV0ZXMoKSlcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHRoaXMuZGF0ZVVuZGVyTW91c2UgPSBkYXRlXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0Ly8gdGhpcyBzZWN0aW9uIGlzIHRyaWNreSB3aXRoIG1hcmdpbnMuIFdlIHVzZSB0aGlzIHZpZXcgZm9yIGJvdGggd2VlayBhbmQgZGF5IHZpZXcuXG5cdFx0XHRcdFx0Ly8gaW4gZGF5IHZpZXcgdGhlcmUncyBubyBkYXlzIHJvdyBhbmQgbm8gc2VsZWN0aW9uIGluZGljYXRvci5cblx0XHRcdFx0XHQvLyBpdCBhbGwgbXVzdCB3b3JrIHdpdGggYW5kIHdpdGhvdXQgbG9uZyBldmVudHMuXG5cdFx0XHRcdFx0Ly8gdGhyZWFkIGNhcmVmdWxseSBhbmQgdGVzdCBhbGwgdGhlIGNhc2VzLlxuXHRcdFx0XHRcdFt0aGlzLnJlbmRlckxvbmdFdmVudHNTZWN0aW9uKHRoaXNQYWdlRXZlbnRzLCBtYWluUGFnZUV2ZW50cywgZ3JvdXBDb2xvcnMsIG9uRXZlbnRDbGlja2VkLCBvbkV2ZW50S2V5RG93biwgdGVtcG9yYXJ5RXZlbnRzKV0sXG5cdFx0XHRcdCksXG5cdFx0XHRdKSxcblx0XHRdKVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJMb25nRXZlbnRzU2VjdGlvbihcblx0XHR0aGlzUGFnZUV2ZW50czogRXZlbnRzT25EYXlzLFxuXHRcdG1haW5QYWdlRXZlbnRzOiBFdmVudHNPbkRheXMsXG5cdFx0Z3JvdXBDb2xvcnM6IEdyb3VwQ29sb3JzLFxuXHRcdG9uRXZlbnRDbGlja2VkOiBDYWxlbmRhckV2ZW50QnViYmxlQ2xpY2tIYW5kbGVyLFxuXHRcdG9uRXZlbnRLZXlEb3duOiBDYWxlbmRhckV2ZW50QnViYmxlS2V5RG93bkhhbmRsZXIsXG5cdFx0dGVtcG9yYXJ5RXZlbnRzOiBBcnJheTxDYWxlbmRhckV2ZW50Pixcblx0KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHRoaXNQYWdlTG9uZ0V2ZW50cyA9IHRoaXMucmVuZGVyTG9uZ0V2ZW50cyhcblx0XHRcdHRoaXNQYWdlRXZlbnRzLmRheXMsXG5cdFx0XHR0aGlzUGFnZUV2ZW50cy5sb25nRXZlbnRzLFxuXHRcdFx0Z3JvdXBDb2xvcnMsXG5cdFx0XHRvbkV2ZW50Q2xpY2tlZCxcblx0XHRcdG9uRXZlbnRLZXlEb3duLFxuXHRcdFx0dGVtcG9yYXJ5RXZlbnRzLFxuXHRcdFx0dHJ1ZSxcblx0XHQpXG5cdFx0Y29uc3QgbWFpblBhZ2VMb25nRXZlbnRzID0gdGhpcy5yZW5kZXJMb25nRXZlbnRzKFxuXHRcdFx0bWFpblBhZ2VFdmVudHMuZGF5cyxcblx0XHRcdG1haW5QYWdlRXZlbnRzLmxvbmdFdmVudHMsXG5cdFx0XHRncm91cENvbG9ycyxcblx0XHRcdG9uRXZlbnRDbGlja2VkLFxuXHRcdFx0b25FdmVudEtleURvd24sXG5cdFx0XHR0ZW1wb3JhcnlFdmVudHMsXG5cdFx0XHR0cnVlLFxuXHRcdClcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLnJlbC5tYi14c1wiLFxuXHRcdFx0e1xuXHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0aWYgKG1haW5QYWdlRXZlbnRzID09PSB0aGlzUGFnZUV2ZW50cykge1xuXHRcdFx0XHRcdFx0dGhpcy5sb25nRXZlbnRzRG9tID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bS5yZWRyYXcoKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbnVwZGF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0aWYgKG1haW5QYWdlRXZlbnRzID09PSB0aGlzUGFnZUV2ZW50cykge1xuXHRcdFx0XHRcdFx0dGhpcy5sb25nRXZlbnRzRG9tID0gdm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdGhlaWdodDogcHgobWFpblBhZ2VMb25nRXZlbnRzLnJvd3MgKiBDQUxFTkRBUl9FVkVOVF9IRUlHSFQpLFxuXHRcdFx0XHRcdHdpZHRoOiBcIjEwMCVcIixcblx0XHRcdFx0XHR0cmFuc2l0aW9uOiBcImhlaWdodCAyMDBtcyBlYXNlLWluLW91dFwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHRoaXNQYWdlTG9uZ0V2ZW50cy5jaGlsZHJlbixcblx0XHQpXG5cdH1cblxuXHQvKipcblx0ICpcblx0ICogQHJldHVybnMgdGhlIHJlbmRlcmVkIGNhbGVuZGFyIGJ1YmJsZSBjaGlsZHJlbiwgYW5kIHRoZSBtYXhpbXVtIG51bWJlciBvZiBldmVudHMgdGhhdCBvY2N1ciBvbiBhIGRheSAob3V0IG9mIGFsbCBkYXlzKVxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJMb25nRXZlbnRzKFxuXHRcdGRheVJhbmdlOiBBcnJheTxEYXRlPixcblx0XHRldmVudHM6IEFycmF5PENhbGVuZGFyRXZlbnQ+LFxuXHRcdGdyb3VwQ29sb3JzOiBHcm91cENvbG9ycyxcblx0XHRvbkV2ZW50Q2xpY2tlZDogQ2FsZW5kYXJFdmVudEJ1YmJsZUNsaWNrSGFuZGxlcixcblx0XHRvbkV2ZW50S2V5RG93bjogQ2FsZW5kYXJFdmVudEJ1YmJsZUtleURvd25IYW5kbGVyLFxuXHRcdHRlbXBvcmFyeUV2ZW50czogQXJyYXk8Q2FsZW5kYXJFdmVudD4sXG5cdFx0aXNEZXNrdG9wTGF5b3V0OiBib29sZWFuLFxuXHQpOiB7XG5cdFx0Y2hpbGRyZW46IENoaWxkcmVuXG5cdFx0cm93czogbnVtYmVyXG5cdH0ge1xuXHRcdGlmIChpc0Rlc2t0b3BMYXlvdXQpIHtcblx0XHRcdHJldHVybiBkYXlSYW5nZS5sZW5ndGggPT09IDFcblx0XHRcdFx0PyB7XG5cdFx0XHRcdFx0XHRjaGlsZHJlbjogdGhpcy5yZW5kZXJMb25nRXZlbnRzRm9yU2luZ2xlRGF5KGRheVJhbmdlWzBdLCBldmVudHMsIGdyb3VwQ29sb3JzLCBvbkV2ZW50Q2xpY2tlZCwgb25FdmVudEtleURvd24sIHRlbXBvcmFyeUV2ZW50cyksXG5cdFx0XHRcdFx0XHRyb3dzOiBldmVudHMubGVuZ3RoLFxuXHRcdFx0XHQgIH1cblx0XHRcdFx0OiB0aGlzLnJlbmRlckxvbmdFdmVudHNGb3JNdWx0aXBsZURheXMoZGF5UmFuZ2UsIGV2ZW50cywgZ3JvdXBDb2xvcnMsIG9uRXZlbnRDbGlja2VkLCBvbkV2ZW50S2V5RG93biwgdGVtcG9yYXJ5RXZlbnRzKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJMb25nRXZlbnRzRm9yTXVsdGlwbGVEYXlzKGRheVJhbmdlLCBldmVudHMsIGdyb3VwQ29sb3JzLCBvbkV2ZW50Q2xpY2tlZCwgb25FdmVudEtleURvd24sIHRlbXBvcmFyeUV2ZW50cylcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICpPbmx5IGNhbGxlZCBmcm9tIGRheSB2aWV3IHdoZXJlIGhlYWRlciBldmVudHMgYXJlIG5vdCBkcmFnZ2FibGVcblx0ICovXG5cdHByaXZhdGUgcmVuZGVyTG9uZ0V2ZW50c0ZvclNpbmdsZURheShcblx0XHRkYXk6IERhdGUsXG5cdFx0ZXZlbnRzOiBBcnJheTxDYWxlbmRhckV2ZW50Pixcblx0XHRncm91cENvbG9yczogR3JvdXBDb2xvcnMsXG5cdFx0b25FdmVudENsaWNrZWQ6IENhbGVuZGFyRXZlbnRCdWJibGVDbGlja0hhbmRsZXIsXG5cdFx0b25FdmVudEtleURvd246IENhbGVuZGFyRXZlbnRCdWJibGVLZXlEb3duSGFuZGxlcixcblx0XHR0ZW1wb3JhcnlFdmVudHM6IEFycmF5PENhbGVuZGFyRXZlbnQ+LFxuXHQpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3Qgem9uZSA9IGdldFRpbWVab25lKClcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShcblx0XHRcdFx0XCJcIixcblx0XHRcdFx0ZXZlbnRzLm1hcCgoZXZlbnQpID0+IHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJMb25nRXZlbnRCdWJibGUoXG5cdFx0XHRcdFx0XHRldmVudCxcblx0XHRcdFx0XHRcdGdldFRpbWVUZXh0Rm9ybWF0Rm9yTG9uZ0V2ZW50KGV2ZW50LCBkYXksIGRheSwgem9uZSksXG5cdFx0XHRcdFx0XHRldmVudFN0YXJ0c0JlZm9yZShkYXksIHpvbmUsIGV2ZW50KSxcblx0XHRcdFx0XHRcdGV2ZW50RW5kc0FmdGVyRGF5KGRheSwgem9uZSwgZXZlbnQpLFxuXHRcdFx0XHRcdFx0Z3JvdXBDb2xvcnMsXG5cdFx0XHRcdFx0XHQoXywgZG9tRXZlbnQpID0+IG9uRXZlbnRDbGlja2VkKGV2ZW50LCBkb21FdmVudCksXG5cdFx0XHRcdFx0XHQoXywgZG9tRXZlbnQpID0+IG9uRXZlbnRLZXlEb3duKGV2ZW50LCBkb21FdmVudCksXG5cdFx0XHRcdFx0XHR0ZW1wb3JhcnlFdmVudHMuaW5jbHVkZXMoZXZlbnQpLFxuXHRcdFx0XHRcdClcblx0XHRcdFx0fSksXG5cdFx0XHQpLFxuXHRcdF1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTG9uZ0V2ZW50c0Zvck11bHRpcGxlRGF5cyhcblx0XHRkYXlSYW5nZTogQXJyYXk8RGF0ZT4sXG5cdFx0ZXZlbnRzOiBBcnJheTxDYWxlbmRhckV2ZW50Pixcblx0XHRncm91cENvbG9yczogR3JvdXBDb2xvcnMsXG5cdFx0b25FdmVudENsaWNrZWQ6IENhbGVuZGFyRXZlbnRCdWJibGVDbGlja0hhbmRsZXIsXG5cdFx0b25FdmVudEtleURvd246IENhbGVuZGFyRXZlbnRCdWJibGVLZXlEb3duSGFuZGxlcixcblx0XHR0ZW1wb3JhcnlFdmVudHM6IEFycmF5PENhbGVuZGFyRXZlbnQ+LFxuXHQpOiB7XG5cdFx0Y2hpbGRyZW46IENoaWxkcmVuXG5cdFx0cm93czogbnVtYmVyXG5cdH0ge1xuXHRcdGlmICh0aGlzLmxvbmdFdmVudHNEb20gPT0gbnVsbCAmJiB0aGlzLnZpZXdEb20gPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0Y2hpbGRyZW46IG51bGwsXG5cdFx0XHRcdHJvd3M6IDAsXG5cdFx0XHR9XG5cdFx0fVxuXHRcdGNvbnN0IGRheVdpZHRoID1cblx0XHRcdCh0aGlzLmxvbmdFdmVudHNEb20gIT0gbnVsbCA/IHRoaXMubG9uZ0V2ZW50c0RvbS5vZmZzZXRXaWR0aCA6IHRoaXMudmlld0RvbSEub2Zmc2V0V2lkdGggLSBzaXplLmNhbGVuZGFyX2hvdXJfd2lkdGhfbW9iaWxlKSAvIGRheVJhbmdlLmxlbmd0aFxuXHRcdGxldCBtYXhFdmVudHNJbkNvbHVtbiA9IDBcblx0XHRjb25zdCBmaXJzdERheSA9IGRheVJhbmdlWzBdXG5cdFx0Y29uc3QgbGFzdERheSA9IGxhc3RUaHJvdyhkYXlSYW5nZSlcblx0XHRjb25zdCB6b25lID0gZ2V0VGltZVpvbmUoKVxuXHRcdGNvbnN0IGNoaWxkcmVuID0gbGF5T3V0RXZlbnRzKFxuXHRcdFx0ZXZlbnRzLFxuXHRcdFx0em9uZSxcblx0XHRcdChjb2x1bW5zKSA9PiB7XG5cdFx0XHRcdG1heEV2ZW50c0luQ29sdW1uID0gTWF0aC5tYXgobWF4RXZlbnRzSW5Db2x1bW4sIGNvbHVtbnMubGVuZ3RoKVxuXHRcdFx0XHRyZXR1cm4gY29sdW1ucy5tYXAoKHJvd3MsIGMpID0+XG5cdFx0XHRcdFx0cm93cy5tYXAoKGV2ZW50KSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCBpc0FsbERheSA9IGlzQWxsRGF5RXZlbnQoZXZlbnQpXG5cdFx0XHRcdFx0XHRjb25zdCBldmVudEVuZCA9IGlzQWxsRGF5ID8gaW5jcmVtZW50RGF0ZShnZXRFdmVudEVuZChldmVudCwgem9uZSksIC0xKSA6IGV2ZW50LmVuZFRpbWVcblx0XHRcdFx0XHRcdGNvbnN0IGRheU9mU3RhcnREYXRlID0gZ2V0RGlmZkluMjRoSW50ZXJ2YWxzKGZpcnN0RGF5LCBnZXRFdmVudFN0YXJ0KGV2ZW50LCB6b25lKSlcblx0XHRcdFx0XHRcdGNvbnN0IGRheU9mRW5kRGF0ZSA9IGdldERpZmZJbjI0aEludGVydmFscyhmaXJzdERheSwgZXZlbnRFbmQpXG5cdFx0XHRcdFx0XHRjb25zdCBzdGFydHNCZWZvcmUgPSBldmVudFN0YXJ0c0JlZm9yZShmaXJzdERheSwgem9uZSwgZXZlbnQpXG5cdFx0XHRcdFx0XHRjb25zdCBlbmRzQWZ0ZXIgPSBldmVudEVuZHNBZnRlckRheShsYXN0RGF5LCB6b25lLCBldmVudClcblx0XHRcdFx0XHRcdGNvbnN0IGxlZnQgPSBzdGFydHNCZWZvcmUgPyAwIDogZGF5T2ZTdGFydERhdGUgKiBkYXlXaWR0aFxuXHRcdFx0XHRcdFx0Y29uc3QgcmlnaHQgPSBlbmRzQWZ0ZXIgPyAwIDogKGRheVJhbmdlLmxlbmd0aCAtIDEgLSBkYXlPZkVuZERhdGUpICogZGF5V2lkdGhcblx0XHRcdFx0XHRcdHJldHVybiBtKFxuXHRcdFx0XHRcdFx0XHRcIi5hYnNcIixcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHR0b3A6IHB4KGMgKiBDQUxFTkRBUl9FVkVOVF9IRUlHSFQpLFxuXHRcdFx0XHRcdFx0XHRcdFx0bGVmdDogcHgobGVmdCksXG5cdFx0XHRcdFx0XHRcdFx0XHRyaWdodDogcHgocmlnaHQpLFxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0a2V5OiBldmVudC5faWRbMF0gKyBldmVudC5faWRbMV0gKyBldmVudC5zdGFydFRpbWUuZ2V0VGltZSgpLFxuXHRcdFx0XHRcdFx0XHRcdG9ubW91c2Vkb3duOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBPbmx5IGFsbG93IGRyYWdnaW5nIGFsbC1kYXkgZXZlbnRzIG9uIHRoZSBkZXNrdG9wIGxheW91dCwgc2luY2UgdGhlIGhlYWRlciBzdXBwb3J0cyBpdFxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKHN0eWxlcy5pc0Rlc2t0b3BMYXlvdXQoKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmlzSGVhZGVyRXZlbnRCZWluZ0RyYWdnZWQgPSB0cnVlXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuc3RhcnRFdmVudERyYWcoZXZlbnQpXG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0dGhpcy5yZW5kZXJMb25nRXZlbnRCdWJibGUoXG5cdFx0XHRcdFx0XHRcdFx0ZXZlbnQsXG5cdFx0XHRcdFx0XHRcdFx0aXNBbGxEYXkgPyBudWxsIDogRXZlbnRUZXh0VGltZU9wdGlvbi5TVEFSVF9FTkRfVElNRSxcblx0XHRcdFx0XHRcdFx0XHRzdGFydHNCZWZvcmUsXG5cdFx0XHRcdFx0XHRcdFx0ZW5kc0FmdGVyLFxuXHRcdFx0XHRcdFx0XHRcdGdyb3VwQ29sb3JzLFxuXHRcdFx0XHRcdFx0XHRcdG9uRXZlbnRDbGlja2VkLFxuXHRcdFx0XHRcdFx0XHRcdG9uRXZlbnRLZXlEb3duLFxuXHRcdFx0XHRcdFx0XHRcdHRlbXBvcmFyeUV2ZW50cy5pbmNsdWRlcyhldmVudCksXG5cdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdClcblx0XHRcdH0sXG5cdFx0XHRFdmVudExheW91dE1vZGUuRGF5QmFzZWRDb2x1bW4sXG5cdFx0KVxuXHRcdHJldHVybiB7XG5cdFx0XHRjaGlsZHJlbixcblx0XHRcdHJvd3M6IG1heEV2ZW50c0luQ29sdW1uLFxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTG9uZ0V2ZW50QnViYmxlKFxuXHRcdGV2ZW50OiBDYWxlbmRhckV2ZW50LFxuXHRcdHNob3dUaW1lOiBFdmVudFRleHRUaW1lT3B0aW9uIHwgbnVsbCxcblx0XHRzdGFydHNCZWZvcmU6IGJvb2xlYW4sXG5cdFx0ZW5kc0FmdGVyOiBib29sZWFuLFxuXHRcdGdyb3VwQ29sb3JzOiBHcm91cENvbG9ycyxcblx0XHRvbkV2ZW50Q2xpY2tlZDogQ2FsZW5kYXJFdmVudEJ1YmJsZUNsaWNrSGFuZGxlcixcblx0XHRvbkV2ZW50S2V5RG93bjogQ2FsZW5kYXJFdmVudEJ1YmJsZUtleURvd25IYW5kbGVyLFxuXHRcdGlzVGVtcG9yYXJ5OiBib29sZWFuLFxuXHQpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgZmFkZUluID0gIWlzVGVtcG9yYXJ5XG5cdFx0Y29uc3Qgb3BhY2l0eSA9IGlzVGVtcG9yYXJ5ID8gVEVNUE9SQVJZX0VWRU5UX09QQUNJVFkgOiAxXG5cdFx0Y29uc3QgZW5hYmxlUG9pbnRlckV2ZW50cyA9ICF0aGlzLmV2ZW50RHJhZ0hhbmRsZXIuaXNEcmFnZ2luZyAmJiAhaXNUZW1wb3Jhcnlcblx0XHRyZXR1cm4gbShDb250aW51aW5nQ2FsZW5kYXJFdmVudEJ1YmJsZSwge1xuXHRcdFx0ZXZlbnQsXG5cdFx0XHRzdGFydHNCZWZvcmUsXG5cdFx0XHRlbmRzQWZ0ZXIsXG5cdFx0XHRjb2xvcjogZ2V0RXZlbnRDb2xvcihldmVudCwgZ3JvdXBDb2xvcnMpLFxuXHRcdFx0b25FdmVudENsaWNrZWQsXG5cdFx0XHRvbkV2ZW50S2V5RG93bjogb25FdmVudEtleURvd24sXG5cdFx0XHRzaG93VGltZSxcblx0XHRcdHVzZXI6IGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlcixcblx0XHRcdGZhZGVJbixcblx0XHRcdG9wYWNpdHksXG5cdFx0XHRlbmFibGVQb2ludGVyRXZlbnRzLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckRheU5hbWVzUm93KGRheXM6IEFycmF5PERhdGU+LCB3ZWVrSW5kaWNhdG9yOiBzdHJpbmcgfCBudWxsLCBvbkRhdGVTZWxlY3RlZDogKGFyZzA6IERhdGUsIGFyZzE6IENhbGVuZGFyVmlld1R5cGUpID0+IHVua25vd24pOiBDaGlsZHJlbiB7XG5cdFx0aWYgKGRheXMubGVuZ3RoID09PSAxICYmIHdlZWtJbmRpY2F0b3IgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIG51bGxcblx0XHR9XG5cblx0XHRjb25zdCByb3dTaXplID0gcHgoc2l6ZS5jYWxlbmRhcl9kYXlzX2hlYWRlcl9oZWlnaHQpXG5cblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmZsZXgubWItc1wiLFxuXHRcdFx0d2Vla0luZGljYXRvciA/IG0oXCIuY2FsZW5kYXItaG91ci1jb2x1bW4uY2FsZW5kYXItZGF5LWluZGljYXRvci5iLmNlbnRlci1ob3Jpem9udGFsbHlcIiwgd2Vla0luZGljYXRvcikgOiBtKFwiLmNhbGVuZGFyLWhvdXItbWFyZ2luXCIpLFxuXHRcdFx0ZGF5cy5sZW5ndGggPT09IDFcblx0XHRcdFx0PyBudWxsXG5cdFx0XHRcdDogZGF5cy5tYXAoKGRheSkgPT4ge1xuXHRcdFx0XHRcdFx0Ly8gdGhlIGNsaWNrIGhhbmRsZXIgaXMgc2V0IG9uIGVhY2ggY2hpbGQgaW5kaXZpZHVhbGx5IHNvIGFzIHRvIG5vdCBtYWtlIHRoZSBlbnRpcmUgZmxleCBjb250YWluZXIgY2xpY2thYmxlLCBvbmx5IHRoZSB0ZXh0XG5cdFx0XHRcdFx0XHRjb25zdCBvbmNsaWNrID0gKCkgPT4gb25EYXRlU2VsZWN0ZWQoZGF5LCBDYWxlbmRhclZpZXdUeXBlLkRBWSlcblxuXHRcdFx0XHRcdFx0cmV0dXJuIG0oXCIuZmxleC5jZW50ZXItaG9yaXpvbnRhbGx5LmZsZXgtZ3Jvdy5jZW50ZXIuYlwiLCBbXG5cdFx0XHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcdFx0XCIuY2FsZW5kYXItZGF5LWluZGljYXRvci5jbGlja2FibGVcIixcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRvbmNsaWNrLFxuXHRcdFx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJwYWRkaW5nLXJpZ2h0XCI6IHB4KDQpLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdGxhbmcuZm9ybWF0cy53ZWVrZGF5U2hvcnQuZm9ybWF0KGRheSkgKyBcIiBcIixcblx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XHRcIi5yZWwuY2xpY2suZmxleC5pdGVtcy1jZW50ZXIuanVzdGlmeS1jZW50ZXIucmVsLm1sLWhwYWRfc21hbGxcIixcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcImFyaWEtbGFiZWxcIjogZGF5LnRvTG9jYWxlRGF0ZVN0cmluZygpLFxuXHRcdFx0XHRcdFx0XHRcdFx0b25jbGljayxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFtcblx0XHRcdFx0XHRcdFx0XHRcdG0oXCIuYWJzLnoxLmNpcmNsZVwiLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNsYXNzOiBpc1RvZGF5KGRheSkgPyBcImNhbGVuZGFyLWN1cnJlbnQtZGF5LWNpcmNsZVwiIDogXCJcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR3aWR0aDogcm93U2l6ZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRoZWlnaHQ6IHJvd1NpemUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwiLmZ1bGwtd2lkdGguaGVpZ2h0LTEwMHAuY2VudGVyLnoyXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjbGFzczogaXNUb2RheShkYXkpID8gXCJjYWxlbmRhci1jdXJyZW50LWRheS10ZXh0XCIgOiBcIlwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRmb250U2l6ZTogcHgoMTQpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGluZUhlaWdodDogcm93U2l6ZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRkYXkuZ2V0RGF0ZSgpLFxuXHRcdFx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XSlcblx0XHRcdFx0ICB9KSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIGVuZERyYWcocG9zOiBNb3VzZVBvcykge1xuXHRcdHRoaXMuaXNIZWFkZXJFdmVudEJlaW5nRHJhZ2dlZCA9IGZhbHNlXG5cblx0XHRpZiAodGhpcy5kYXRlVW5kZXJNb3VzZSkge1xuXHRcdFx0dGhpcy5ldmVudERyYWdIYW5kbGVyLmVuZERyYWcodGhpcy5kYXRlVW5kZXJNb3VzZSwgcG9zKS5jYXRjaChvZkNsYXNzKFVzZXJFcnJvciwgc2hvd1VzZXJFcnJvcikpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBjYW5jZWxEcmFnKCkge1xuXHRcdHRoaXMuZXZlbnREcmFnSGFuZGxlci5jYW5jZWxEcmFnKClcblx0fVxufVxuIiwiaW1wb3J0IHsgSWNvbkJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uQnV0dG9uLmpzXCJcbmltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0ljb25zLmpzXCJcbmltcG9ydCB7IEJhc2VCdXR0b24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2J1dHRvbnMvQmFzZUJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBJY29uLCBJY29uU2l6ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbi5qc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3RoZW1lLmpzXCJcblxudHlwZSBUb2RheUljb25CdXR0b25BdHRycyA9IFBpY2s8SWNvbkJ1dHRvbkF0dHJzLCBcImNsaWNrXCI+XG5cbi8qKlxuICogQnV0dG9uIHRoYXQgaGFzIGEgY3VycmVudCBkYXkgbnVtYmVyIGRpc3BsYXllZCBpbiBpdC5cbiAqL1xuZXhwb3J0IGNsYXNzIFRvZGF5SWNvbkJ1dHRvbiBpbXBsZW1lbnRzIENvbXBvbmVudDxUb2RheUljb25CdXR0b25BdHRycz4ge1xuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8VG9kYXlJY29uQnV0dG9uQXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKEJhc2VCdXR0b24sIHtcblx0XHRcdGxhYmVsOiBcInRvZGF5X2xhYmVsXCIsXG5cdFx0XHRvbmNsaWNrOiBhdHRycy5jbGljayxcblx0XHRcdGljb246IG0oSWNvbiwge1xuXHRcdFx0XHRjb250YWluZXI6IFwiZGl2XCIsXG5cdFx0XHRcdGNsYXNzOiBcImNlbnRlci1oIHN2Zy10ZXh0LWNvbnRlbnQtYmdcIixcblx0XHRcdFx0c2l6ZTogSWNvblNpemUuTWVkaXVtLFxuXHRcdFx0XHRzdmdQYXJhbWV0ZXJzOiB7IGRhdGU6IG5ldyBEYXRlKCkuZ2V0RGF0ZSgpLnRvU3RyaW5nKCkgfSxcblx0XHRcdFx0aWNvbjogSWNvbnMuVG9kYXksXG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0ZmlsbDogdGhlbWUuY29udGVudF9idXR0b24sXG5cdFx0XHRcdH0sXG5cdFx0XHR9KSxcblx0XHRcdGNsYXNzOiBcImljb24tYnV0dG9uIHN0YXRlLWJnXCIsXG5cdFx0fSlcblx0fVxufVxuIiwiaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBJY29uQnV0dG9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uQnV0dG9uLmpzXCJcbmltcG9ydCB7IFZpZXdTbGlkZXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9uYXYvVmlld1NsaWRlci5qc1wiXG5pbXBvcnQgeyBCYXNlTW9iaWxlSGVhZGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvQmFzZU1vYmlsZUhlYWRlci5qc1wiXG5pbXBvcnQgeyBPZmZsaW5lSW5kaWNhdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9PZmZsaW5lSW5kaWNhdG9yLmpzXCJcbmltcG9ydCB7IFByb2dyZXNzQmFyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Qcm9ncmVzc0Jhci5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhck5hdkNvbmZpZ3VyYXRpb24sIGdldEljb25Gb3JWaWV3VHlwZSB9IGZyb20gXCIuLi9ndWkvQ2FsZW5kYXJHdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBNb2JpbGVIZWFkZXJCYWNrQnV0dG9uLCBNb2JpbGVIZWFkZXJNZW51QnV0dG9uLCBNb2JpbGVIZWFkZXJUaXRsZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL01vYmlsZUhlYWRlci5qc1wiXG5pbXBvcnQgeyBBcHBIZWFkZXJBdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL0hlYWRlci5qc1wiXG5pbXBvcnQgeyBhdHRhY2hEcm9wZG93biB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRHJvcGRvd24uanNcIlxuaW1wb3J0IHsgbGFuZywgVHJhbnNsYXRpb25LZXkgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgc3R5bGVzIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvc3R5bGVzLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgQ2xpY2tIYW5kbGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9HdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBUb2RheUljb25CdXR0b24gfSBmcm9tIFwiLi9Ub2RheUljb25CdXR0b24uanNcIlxuaW1wb3J0IHsgRXhwYW5kZXJCdXR0b24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0V4cGFuZGVyLmpzXCJcbmltcG9ydCB7IGlzQXBwIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL0Vudi5qc1wiXG5pbXBvcnQgeyBCb290SWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0Jvb3RJY29ucy5qc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yLmpzXCJcbmltcG9ydCB7IE5hdkJ1dHRvbiB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvTmF2QnV0dG9uLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyVmlld1R5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvQ29tbW9uQ2FsZW5kYXJVdGlscy5qc1wiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvSWNvbnMuanNcIlxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0NsaWVudERldGVjdG9yLmpzXCJcblxuZXhwb3J0IGludGVyZmFjZSBDYWxlbmRhck1vYmlsZUhlYWRlckF0dHJzIGV4dGVuZHMgQXBwSGVhZGVyQXR0cnMge1xuXHR2aWV3VHlwZTogQ2FsZW5kYXJWaWV3VHlwZVxuXHR2aWV3U2xpZGVyOiBWaWV3U2xpZGVyXG5cdG5hdkNvbmZpZ3VyYXRpb246IENhbGVuZGFyTmF2Q29uZmlndXJhdGlvblxuXHRvbkNyZWF0ZUV2ZW50OiAoKSA9PiB1bmtub3duXG5cdG9uVG9kYXk6ICgpID0+IHVua25vd25cblx0b25WaWV3VHlwZVNlbGVjdGVkOiAodmlld1R5cGU6IENhbGVuZGFyVmlld1R5cGUpID0+IHVua25vd25cblx0b25UYXA/OiBDbGlja0hhbmRsZXJcblx0c2hvd0V4cGFuZEljb246IGJvb2xlYW5cblx0aXNEYXlTZWxlY3RvckV4cGFuZGVkOiBib29sZWFuXG59XG5cbi8qKlxuICogQSBzcGVjaWFsIGhlYWRlciB0aGF0IGlzIHVzZWQgaW5zdGVhZCBvZiB7QGxpbmsgTW9iaWxlSGVhZGVyfSBidXQganVzdCBmb3IgY2FsZW5kYXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBDYWxlbmRhck1vYmlsZUhlYWRlciBpbXBsZW1lbnRzIENvbXBvbmVudDxDYWxlbmRhck1vYmlsZUhlYWRlckF0dHJzPiB7XG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxDYWxlbmRhck1vYmlsZUhlYWRlckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShCYXNlTW9iaWxlSGVhZGVyLCB7XG5cdFx0XHRsZWZ0OiB0aGlzLnJlbmRlclRvcExlZnRCdXR0b24oYXR0cnMpLFxuXHRcdFx0Y2VudGVyOiBtKE1vYmlsZUhlYWRlclRpdGxlLCB7XG5cdFx0XHRcdHRpdGxlOiBhdHRycy5zaG93RXhwYW5kSWNvblxuXHRcdFx0XHRcdD8gbShFeHBhbmRlckJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRsYWJlbDogbGFuZy5tYWtlVHJhbnNsYXRpb24oYXR0cnMubmF2Q29uZmlndXJhdGlvbi50aXRsZSwgYXR0cnMubmF2Q29uZmlndXJhdGlvbi50aXRsZSksXG5cdFx0XHRcdFx0XHRcdGlzVW5mb3JtYXR0ZWRMYWJlbDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRcInBhZGRpbmctdG9wXCI6IFwiaW5oZXJpdFwiLFxuXHRcdFx0XHRcdFx0XHRcdGhlaWdodDogXCJpbmhlcml0XCIsXG5cdFx0XHRcdFx0XHRcdFx0XCJtaW4taGVpZ2h0XCI6IFwiaW5oZXJpdFwiLFxuXHRcdFx0XHRcdFx0XHRcdFwidGV4dC1kZWNvcmF0aW9uXCI6IFwibm9uZVwiLFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRleHBhbmRlZDogYXR0cnMuaXNEYXlTZWxlY3RvckV4cGFuZGVkLFxuXHRcdFx0XHRcdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9mZyxcblx0XHRcdFx0XHRcdFx0aXNCaWc6IHRydWUsXG5cdFx0XHRcdFx0XHRcdGlzUHJvcGFnYXRpbmdFdmVudHM6IHRydWUsXG5cdFx0XHRcdFx0XHRcdG9uRXhwYW5kZWRDaGFuZ2U6ICgpID0+IHt9LFxuXHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHQ6IGF0dHJzLm5hdkNvbmZpZ3VyYXRpb24udGl0bGUsXG5cdFx0XHRcdGJvdHRvbTogbShPZmZsaW5lSW5kaWNhdG9yLCBhdHRycy5vZmZsaW5lSW5kaWNhdG9yTW9kZWwuZ2V0Q3VycmVudEF0dHJzKCkpLFxuXHRcdFx0XHRvblRhcDogYXR0cnMub25UYXAsXG5cdFx0XHR9KSxcblx0XHRcdHJpZ2h0OiBbXG5cdFx0XHRcdHRoaXMucmVuZGVyRGF0ZU5hdmlnYXRpb24oYXR0cnMpLFxuXHRcdFx0XHRtKFRvZGF5SWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdGNsaWNrOiBhdHRycy5vblRvZGF5LFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0dGhpcy5yZW5kZXJWaWV3U2VsZWN0b3IoYXR0cnMpLFxuXHRcdFx0XHRjbGllbnQuaXNDYWxlbmRhckFwcCgpXG5cdFx0XHRcdFx0PyB0aGlzLnJlbmRlclNlYXJjaE5hdmlnYXRpb25CdXR0b24oKVxuXHRcdFx0XHRcdDogbShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdFx0XHRcdGljb246IEljb25zLkFkZCxcblx0XHRcdFx0XHRcdFx0dGl0bGU6IFwibmV3RXZlbnRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdGNsaWNrOiBhdHRycy5vbkNyZWF0ZUV2ZW50LFxuXHRcdFx0XHRcdCAgfSksXG5cdFx0XHRdLFxuXHRcdFx0aW5qZWN0aW9uczogbShQcm9ncmVzc0JhciwgeyBwcm9ncmVzczogYXR0cnMub2ZmbGluZUluZGljYXRvck1vZGVsLmdldFByb2dyZXNzKCkgfSksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyVG9wTGVmdEJ1dHRvbihhdHRyczogQ2FsZW5kYXJNb2JpbGVIZWFkZXJBdHRycykge1xuXHRcdGlmIChhdHRycy52aWV3VHlwZSA9PT0gQ2FsZW5kYXJWaWV3VHlwZS5BR0VOREEgJiYgaGlzdG9yeS5zdGF0ZT8ub3JpZ2luID09PSBDYWxlbmRhclZpZXdUeXBlLk1PTlRIKSB7XG5cdFx0XHRyZXR1cm4gbShNb2JpbGVIZWFkZXJCYWNrQnV0dG9uLCB7XG5cdFx0XHRcdGJhY2tBY3Rpb246ICgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBkYXRlID0gaGlzdG9yeS5zdGF0ZS5kYXRlU3RyaW5nID8/IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zdWJzdHJpbmcoMCwgMTApXG5cdFx0XHRcdFx0bS5yb3V0ZS5zZXQoXCIvY2FsZW5kYXIvOnZpZXcvOmRhdGVcIiwge1xuXHRcdFx0XHRcdFx0dmlldzogQ2FsZW5kYXJWaWV3VHlwZS5NT05USCxcblx0XHRcdFx0XHRcdGRhdGUsXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSxcblx0XHRcdH0pXG5cdFx0fSBlbHNlIGlmIChzdHlsZXMuaXNVc2luZ0JvdHRvbU5hdmlnYXRpb24oKSAmJiBzdHlsZXMuaXNEZXNrdG9wTGF5b3V0KCkpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG0oTW9iaWxlSGVhZGVyTWVudUJ1dHRvbiwgeyBuZXdzTW9kZWw6IGF0dHJzLm5ld3NNb2RlbCwgYmFja0FjdGlvbjogKCkgPT4gYXR0cnMudmlld1NsaWRlci5mb2N1c1ByZXZpb3VzQ29sdW1uKCkgfSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyU2VhcmNoTmF2aWdhdGlvbkJ1dHRvbigpIHtcblx0XHRpZiAobG9jYXRvci5sb2dpbnMuaXNJbnRlcm5hbFVzZXJMb2dnZWRJbigpKSB7XG5cdFx0XHRyZXR1cm4gbShcblx0XHRcdFx0XCIuaWNvbi1idXR0b25cIixcblx0XHRcdFx0bShOYXZCdXR0b24sIHtcblx0XHRcdFx0XHRsYWJlbDogXCJzZWFyY2hfbGFiZWxcIixcblx0XHRcdFx0XHRoaWRlTGFiZWw6IHRydWUsXG5cdFx0XHRcdFx0aWNvbjogKCkgPT4gQm9vdEljb25zLlNlYXJjaCxcblx0XHRcdFx0XHRocmVmOiBcIi9zZWFyY2gvY2FsZW5kYXJcIixcblx0XHRcdFx0XHRjZW50cmVkOiB0cnVlLFxuXHRcdFx0XHRcdGZpbGxTcGFjZUFyb3VuZDogZmFsc2UsXG5cdFx0XHRcdH0pLFxuXHRcdFx0KVxuXHRcdH1cblxuXHRcdHJldHVybiBudWxsXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckRhdGVOYXZpZ2F0aW9uKGF0dHJzOiBDYWxlbmRhck1vYmlsZUhlYWRlckF0dHJzKSB7XG5cdFx0aWYgKGlzQXBwKCkgfHwgIShzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKSB8fCBzdHlsZXMuaXNUd29Db2x1bW5MYXlvdXQoKSkpIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG0uZnJhZ21lbnQoe30sIFthdHRycy5uYXZDb25maWd1cmF0aW9uLmJhY2ssIGF0dHJzLm5hdkNvbmZpZ3VyYXRpb24uZm9yd2FyZF0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclZpZXdTZWxlY3RvcihhdHRyczogQ2FsZW5kYXJNb2JpbGVIZWFkZXJBdHRycyk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdEljb25CdXR0b24sXG5cdFx0XHRhdHRhY2hEcm9wZG93bih7XG5cdFx0XHRcdG1haW5CdXR0b25BdHRyczoge1xuXHRcdFx0XHRcdGljb246IGdldEljb25Gb3JWaWV3VHlwZShhdHRycy52aWV3VHlwZSksXG5cdFx0XHRcdFx0dGl0bGU6IFwidmlld19sYWJlbFwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRjaGlsZEF0dHJzOiAoKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgY2FsZW5kYXJWaWV3VmFsdWVzOiBBcnJheTx7IG5hbWU6IFRyYW5zbGF0aW9uS2V5OyB2YWx1ZTogQ2FsZW5kYXJWaWV3VHlwZSB9PiA9IFtcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bmFtZTogXCJhZ2VuZGFfbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0dmFsdWU6IENhbGVuZGFyVmlld1R5cGUuQUdFTkRBLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bmFtZTogXCJkYXlfbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0dmFsdWU6IENhbGVuZGFyVmlld1R5cGUuREFZLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bmFtZTogXCJ3ZWVrX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdHZhbHVlOiBDYWxlbmRhclZpZXdUeXBlLldFRUssXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRuYW1lOiBcIm1vbnRoX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdHZhbHVlOiBDYWxlbmRhclZpZXdUeXBlLk1PTlRILFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRdXG5cblx0XHRcdFx0XHRyZXR1cm4gY2FsZW5kYXJWaWV3VmFsdWVzLm1hcCgoeyBuYW1lLCB2YWx1ZSB9KSA9PiAoe1xuXHRcdFx0XHRcdFx0bGFiZWw6IG5hbWUsXG5cdFx0XHRcdFx0XHRzZWxlY3RlZDogdmFsdWUgPT09IGF0dHJzLnZpZXdUeXBlLFxuXHRcdFx0XHRcdFx0aWNvbjogZ2V0SWNvbkZvclZpZXdUeXBlKHZhbHVlKSxcblx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBhdHRycy5vblZpZXdUeXBlU2VsZWN0ZWQodmFsdWUpLFxuXHRcdFx0XHRcdH0pKVxuXHRcdFx0XHR9LFxuXHRcdFx0fSksXG5cdFx0KVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDaGlsZHJlbiwgQ29tcG9uZW50LCBWbm9kZSB9IGZyb20gXCJtaXRocmlsXCJcbmltcG9ydCB7IEFsbEljb25zLCBJY29uLCBJY29uU2l6ZSB9IGZyb20gXCIuL0ljb24uanNcIlxuaW1wb3J0IHsgbGFuZywgTWF5YmVUcmFuc2xhdGlvbiB9IGZyb20gXCIuLi8uLi9taXNjL0xhbmd1YWdlVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IEJ1dHRvbkNvbG9yLCBnZXRDb2xvcnMgfSBmcm9tIFwiLi9CdXR0b24uanNcIlxuaW1wb3J0IHsgcHggfSBmcm9tIFwiLi4vc2l6ZS5qc1wiXG5cbmV4cG9ydCBpbnRlcmZhY2UgSWNvblNlZ21lbnRDb250cm9sSXRlbTxUPiB7XG5cdGljb246IEFsbEljb25zXG5cdGxhYmVsOiBNYXliZVRyYW5zbGF0aW9uXG5cdHZhbHVlOiBUXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSWNvblNlZ21lbnRDb250cm9sQXR0cnM8VD4ge1xuXHRzZWxlY3RlZFZhbHVlOiBUXG5cdG9uVmFsdWVTZWxlY3RlZDogKF86IFQpID0+IHVua25vd25cblx0aXRlbXM6IEljb25TZWdtZW50Q29udHJvbEl0ZW08VD5bXVxuXHRtYXhJdGVtV2lkdGg/OiBudW1iZXJcbn1cblxuLyoqXG4gKiBTZWxlY3RvciBmb3IgYSBmZXcgb3B0aW9ucyB3aXRoIG9uZSBvcHRpb24gc2VsZWN0ZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBJY29uU2VnbWVudENvbnRyb2w8VD4gaW1wbGVtZW50cyBDb21wb25lbnQ8SWNvblNlZ21lbnRDb250cm9sQXR0cnM8VD4+IHtcblx0dmlldyh2bm9kZTogVm5vZGU8SWNvblNlZ21lbnRDb250cm9sQXR0cnM8VD4+KTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBbXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5pY29uLXNlZ21lbnQtY29udHJvbC5mbGV4Lml0ZW1zLWNlbnRlclwiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cm9sZTogXCJ0YWJsaXN0XCIsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHZub2RlLmF0dHJzLml0ZW1zLm1hcCgoaXRlbSkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHRpdGxlID0gbGFuZy5nZXRUcmFuc2xhdGlvblRleHQoaXRlbS5sYWJlbClcblx0XHRcdFx0XHRyZXR1cm4gbShcblx0XHRcdFx0XHRcdFwiYnV0dG9uLmljb24tc2VnbWVudC1jb250cm9sLWl0ZW0uZmxleC5jZW50ZXItaG9yaXpvbnRhbGx5LmNlbnRlci12ZXJ0aWNhbGx5LnRleHQtZWxsaXBzaXMuc21hbGwuc3RhdGUtYmcucHQteHMucGIteHNcIixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0YWN0aXZlOiBpdGVtLnZhbHVlID09PSB2bm9kZS5hdHRycy5zZWxlY3RlZFZhbHVlID8gXCJ0cnVlXCIgOiB1bmRlZmluZWQsXG5cdFx0XHRcdFx0XHRcdHRpdGxlLFxuXHRcdFx0XHRcdFx0XHRyb2xlOiBcInRhYlwiLFxuXHRcdFx0XHRcdFx0XHRcImFyaWEtbGFiZWxcIjogdGl0bGUsXG5cdFx0XHRcdFx0XHRcdFwiYXJpYS1zZWxlY3RlZFwiOiBTdHJpbmcoaXRlbS52YWx1ZSA9PT0gdm5vZGUuYXR0cnMuc2VsZWN0ZWRWYWx1ZSksXG5cdFx0XHRcdFx0XHRcdG9uY2xpY2s6ICgpID0+IHRoaXMub25TZWxlY3RlZChpdGVtLCB2bm9kZS5hdHRycyksXG5cdFx0XHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcdFx0bWF4V2lkdGg6IHZub2RlLmF0dHJzLm1heEl0ZW1XaWR0aCA/IHB4KHZub2RlLmF0dHJzLm1heEl0ZW1XaWR0aCkgOiBudWxsLFxuXHRcdFx0XHRcdFx0XHRcdC8vIG5lZWQgdG8gc3BlY2lmeSBleHBsaWNpdGx5IGJlY2F1c2Ugc2V0dGluZyBcImJhY2tncm91bmRcIiBlLmcuIG9uIGhvdmVyIHJlc2V0cyBpdFxuXHRcdFx0XHRcdFx0XHRcdC8vIHdlIG5lZWQgaXQgYmVjYXVzZSBzdGF0ZUJnSG92ZXIgYmFja2dyb3VuZCBoYXMgdHJhbnNwYXJlbmN5IGFuZCB3aGVuIGl0IG92ZXJsYXBzIHRoZSBib3JkZXIgaXQgbG9va3Mgd3JvbmcuXG5cdFx0XHRcdFx0XHRcdFx0YmFja2dyb3VuZENsaXA6IFwicGFkZGluZy1ib3hcIixcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRtKEljb24sIHtcblx0XHRcdFx0XHRcdFx0aWNvbjogaXRlbS5pY29uLFxuXHRcdFx0XHRcdFx0XHRjb250YWluZXI6IFwiZGl2XCIsXG5cdFx0XHRcdFx0XHRcdGNsYXNzOiBcImNlbnRlci1oXCIsXG5cdFx0XHRcdFx0XHRcdHNpemU6IEljb25TaXplLk1lZGl1bSxcblx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRmaWxsOiBnZXRDb2xvcnMoQnV0dG9uQ29sb3IuQ29udGVudCkuYnV0dG9uLFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHR9KSxcblx0XHRcdCksXG5cdFx0XVxuXHR9XG5cblx0cHJpdmF0ZSBvblNlbGVjdGVkKGl0ZW06IEljb25TZWdtZW50Q29udHJvbEl0ZW08VD4sIGF0dHJzOiBJY29uU2VnbWVudENvbnRyb2xBdHRyczxUPikge1xuXHRcdGlmIChpdGVtLnZhbHVlICE9PSBhdHRycy5zZWxlY3RlZFZhbHVlKSB7XG5cdFx0XHRhdHRycy5vblZhbHVlU2VsZWN0ZWQoaXRlbS52YWx1ZSlcblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCB7IENhbGVuZGFyTmF2Q29uZmlndXJhdGlvbiwgZ2V0SWNvbkZvclZpZXdUeXBlIH0gZnJvbSBcIi4uL2d1aS9DYWxlbmRhckd1aVV0aWxzLmpzXCJcbmltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgcHgsIHNpemUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9zaXplLmpzXCJcbmltcG9ydCB7IGxhbmcsIE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgSWNvblNlZ21lbnRDb250cm9sIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uU2VnbWVudENvbnRyb2wuanNcIlxuaW1wb3J0IHsgQWxsSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb24uanNcIlxuaW1wb3J0IHsgVG9kYXlJY29uQnV0dG9uIH0gZnJvbSBcIi4vVG9kYXlJY29uQnV0dG9uLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyVmlld1R5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvQ29tbW9uQ2FsZW5kYXJVdGlscy5qc1wiXG5cbnR5cGUgQ2FsZW5kYXJEZXNrdG9wVG9vbGJhckF0dHJzID0ge1xuXHRuYXZDb25maWc6IENhbGVuZGFyTmF2Q29uZmlndXJhdGlvblxuXHR2aWV3VHlwZTogQ2FsZW5kYXJWaWV3VHlwZVxuXHRvblRvZGF5OiAoKSA9PiB1bmtub3duXG5cdG9uVmlld1R5cGVTZWxlY3RlZDogKHZpZXdUeXBlOiBDYWxlbmRhclZpZXdUeXBlKSA9PiB1bmtub3duXG59XG5cbmV4cG9ydCBjbGFzcyBDYWxlbmRhckRlc2t0b3BUb29sYmFyIGltcGxlbWVudHMgQ29tcG9uZW50PENhbGVuZGFyRGVza3RvcFRvb2xiYXJBdHRycz4ge1xuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8Q2FsZW5kYXJEZXNrdG9wVG9vbGJhckF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRjb25zdCB7IG5hdkNvbmZpZyB9ID0gYXR0cnNcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmZsZXgucm93Lml0ZW1zLWNlbnRlci5jb250ZW50LWJnLmJvcmRlci1yYWRpdXMtYmlnLm1sci1sLnJlbC5wci5wbC12cGFkLW1cIixcblx0XHRcdHtcblx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRtYXJnaW5MZWZ0OiBgNXB4YCxcblx0XHRcdFx0XHRtYXJnaW5Cb3R0b206IHB4KHNpemUuaHBhZF9sYXJnZSksXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHRtKFwiaDFcIiwgbmF2Q29uZmlnLnRpdGxlKSxcblx0XHRcdFx0bShcIi5mbGV4Lml0ZW1zLWNlbnRlci5qdXN0aWZ5LWNlbnRlci5mbGV4LWdyb3cuaGVpZ2h0LTEwMHBcIiwgdGhpcy5yZW5kZXJWaWV3U2VsZWN0b3IoYXR0cnMpKSxcblx0XHRcdFx0bShcIi5mbGV4LnB0LXhzLnBiLXhzXCIsIFtcblx0XHRcdFx0XHRuYXZDb25maWcuYmFjayA/PyBtKFwiLmJ1dHRvbi13aWR0aC1maXhlZFwiKSxcblx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XCIuZmxleFwiLFxuXHRcdFx0XHRcdFx0bShUb2RheUljb25CdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0Y2xpY2s6IGF0dHJzLm9uVG9kYXksXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdG5hdkNvbmZpZy5mb3J3YXJkID8/IG0oXCIuYnV0dG9uLXdpZHRoLWZpeGVkXCIpLFxuXHRcdFx0XHRdKSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJWaWV3U2VsZWN0b3IoYXR0cnM6IENhbGVuZGFyRGVza3RvcFRvb2xiYXJBdHRycyk6IENoaWxkcmVuIHtcblx0XHRjb25zdCBjYWxlbmRhclZpZXdWYWx1ZXM6IEFycmF5PHsgaWNvbjogQWxsSWNvbnM7IGxhYmVsOiBNYXliZVRyYW5zbGF0aW9uOyB2YWx1ZTogQ2FsZW5kYXJWaWV3VHlwZSB9PiA9IFtcblx0XHRcdHtcblx0XHRcdFx0aWNvbjogZ2V0SWNvbkZvclZpZXdUeXBlKENhbGVuZGFyVmlld1R5cGUuQUdFTkRBKSxcblx0XHRcdFx0bGFiZWw6IFwiYWdlbmRhX2xhYmVsXCIsXG5cdFx0XHRcdHZhbHVlOiBDYWxlbmRhclZpZXdUeXBlLkFHRU5EQSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGljb246IGdldEljb25Gb3JWaWV3VHlwZShDYWxlbmRhclZpZXdUeXBlLkRBWSksXG5cdFx0XHRcdGxhYmVsOiBcImRheV9sYWJlbFwiLFxuXHRcdFx0XHR2YWx1ZTogQ2FsZW5kYXJWaWV3VHlwZS5EQVksXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRpY29uOiBnZXRJY29uRm9yVmlld1R5cGUoQ2FsZW5kYXJWaWV3VHlwZS5XRUVLKSxcblx0XHRcdFx0bGFiZWw6IFwid2Vla19sYWJlbFwiLFxuXHRcdFx0XHR2YWx1ZTogQ2FsZW5kYXJWaWV3VHlwZS5XRUVLLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0aWNvbjogZ2V0SWNvbkZvclZpZXdUeXBlKENhbGVuZGFyVmlld1R5cGUuTU9OVEgpLFxuXHRcdFx0XHRsYWJlbDogXCJtb250aF9sYWJlbFwiLFxuXHRcdFx0XHR2YWx1ZTogQ2FsZW5kYXJWaWV3VHlwZS5NT05USCxcblx0XHRcdH0sXG5cdFx0XVxuXG5cdFx0Ly8gYWx3YXlzIGNlbnRlciB0aGUgc2VnbWVudCBjb250cm9sIGluc2lkZSB0aGUgdG9vbGJhclxuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIuYWJzLmNlbnRlci1oXCIsXG5cdFx0XHR7XG5cdFx0XHRcdHJvbGU6IFwidGFibGlzdFwiLFxuXHRcdFx0XHRcImFyaWEtbGFiZWxcIjogbGFuZy5nZXQoXCJwZXJpb2RPZlRpbWVfbGFiZWxcIiksXG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0bGVmdDogMCxcblx0XHRcdFx0XHRyaWdodDogMCxcblx0XHRcdFx0XHQvLyBuZWVkIGV4cGxpY2l0IHdpZHRoIHRvIGNlbnRlciB0aGUgY29udHJvbFxuXHRcdFx0XHRcdHdpZHRoOiBweChzaXplLmljb25fc2VnbWVudF9jb250cm9sX2J1dHRvbl93aWR0aCAqIDQpLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdG0oSWNvblNlZ21lbnRDb250cm9sLCB7XG5cdFx0XHRcdHNlbGVjdGVkVmFsdWU6IGF0dHJzLnZpZXdUeXBlLFxuXHRcdFx0XHRvblZhbHVlU2VsZWN0ZWQ6ICh0eXBlOiBDYWxlbmRhclZpZXdUeXBlKSA9PiBhdHRycy5vblZpZXdUeXBlU2VsZWN0ZWQodHlwZSksXG5cdFx0XHRcdGl0ZW1zOiBjYWxlbmRhclZpZXdWYWx1ZXMsXG5cdFx0XHRcdG1heEl0ZW1XaWR0aDogNDgsXG5cdFx0XHR9KSxcblx0XHQpXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgZm9ybWF0TW9udGhXaXRoRnVsbFllYXIgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvRm9ybWF0dGVyLmpzXCJcbmltcG9ydCB7IGluY3JlbWVudE1vbnRoLCBpc1NhbWVEYXkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IERheVNlbGVjdG9yIH0gZnJvbSBcIi4vRGF5U2VsZWN0b3IuanNcIlxuaW1wb3J0IHJlbmRlclN3aXRjaE1vbnRoQXJyb3dJY29uIGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvYnV0dG9ucy9BcnJvd0J1dHRvbi5qc1wiXG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF5U2VsZWN0b3JTaWRlYmFyQXR0cnMge1xuXHRzZWxlY3RlZERhdGU6IERhdGVcblx0b25EYXRlU2VsZWN0ZWQ6IChkYXRlOiBEYXRlLCBkYXlDbGljazogYm9vbGVhbikgPT4gdW5rbm93blxuXHRzdGFydE9mVGhlV2Vla09mZnNldDogbnVtYmVyXG5cdHNob3dEYXlTZWxlY3Rpb246IGJvb2xlYW5cblx0aGlnaGxpZ2h0VG9kYXk6IGJvb2xlYW5cblx0aGlnaGxpZ2h0U2VsZWN0ZWRXZWVrOiBib29sZWFuXG5cdGhhc0V2ZW50c09uOiAoZGF0ZTogRGF0ZSkgPT4gYm9vbGVhblxufVxuXG5leHBvcnQgY2xhc3MgRGF5U2VsZWN0b3JTaWRlYmFyIGltcGxlbWVudHMgQ29tcG9uZW50PERheVNlbGVjdG9yU2lkZWJhckF0dHJzPiB7XG5cdHByaXZhdGUgY3VycmVudERhdGU6IERhdGVcblx0cHJpdmF0ZSBvcGVuRGF0ZTogRGF0ZVxuXG5cdGNvbnN0cnVjdG9yKHZub2RlOiBWbm9kZTxEYXlTZWxlY3RvclNpZGViYXJBdHRycz4pIHtcblx0XHR0aGlzLmN1cnJlbnREYXRlID0gdm5vZGUuYXR0cnMuc2VsZWN0ZWREYXRlXG5cdFx0dGhpcy5vcGVuRGF0ZSA9IHZub2RlLmF0dHJzLnNlbGVjdGVkRGF0ZVxuXHR9XG5cblx0dmlldyh2bm9kZTogVm5vZGU8RGF5U2VsZWN0b3JTaWRlYmFyQXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGlmICh2bm9kZS5hdHRycy5zZWxlY3RlZERhdGUgIT09IHRoaXMub3BlbkRhdGUpIHtcblx0XHRcdHRoaXMuY3VycmVudERhdGUgPSB2bm9kZS5hdHRycy5zZWxlY3RlZERhdGVcblx0XHRcdHRoaXMub3BlbkRhdGUgPSB2bm9kZS5hdHRycy5zZWxlY3RlZERhdGVcblx0XHR9XG5cblx0XHRjb25zdCBkaXNhYmxlSGlnaGxpZ2h0ID0gIWlzU2FtZURheSh2bm9kZS5hdHRycy5zZWxlY3RlZERhdGUsIHRoaXMuY3VycmVudERhdGUpXG5cblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLnBsci1tLm10LWZvcm1cIixcblx0XHRcdG0oXCIuZWxldmF0ZWQtYmcucHQtcy5wYi1tLmJvcmRlci1yYWRpdXMuZmxleC5mbGV4LWNvbHVtblwiLCBbXG5cdFx0XHRcdHRoaXMucmVuZGVyUGlja2VySGVhZGVyKHRoaXMuY3VycmVudERhdGUpLFxuXHRcdFx0XHRtKFwiLmZsZXgtZ3Jvdy5vdmVyZmxvdy1oaWRkZW5cIiwgW1xuXHRcdFx0XHRcdG0oRGF5U2VsZWN0b3IsIHtcblx0XHRcdFx0XHRcdHNlbGVjdGVkRGF0ZTogdGhpcy5jdXJyZW50RGF0ZSxcblx0XHRcdFx0XHRcdG9uRGF0ZVNlbGVjdGVkOiB2bm9kZS5hdHRycy5vbkRhdGVTZWxlY3RlZCxcblx0XHRcdFx0XHRcdHdpZGU6IGZhbHNlLFxuXHRcdFx0XHRcdFx0c3RhcnRPZlRoZVdlZWtPZmZzZXQ6IHZub2RlLmF0dHJzLnN0YXJ0T2ZUaGVXZWVrT2Zmc2V0LFxuXHRcdFx0XHRcdFx0aXNEYXlTZWxlY3RvckV4cGFuZGVkOiB0cnVlLFxuXHRcdFx0XHRcdFx0aGFuZGxlRGF5UGlja2VyU3dpcGU6IChpc05leHQpID0+IHtcblx0XHRcdFx0XHRcdFx0dGhpcy5vbk1vbnRoQ2hhbmdlKGlzTmV4dClcblx0XHRcdFx0XHRcdFx0bS5yZWRyYXcoKVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHNob3dEYXlTZWxlY3Rpb246IHZub2RlLmF0dHJzLnNob3dEYXlTZWxlY3Rpb24gJiYgIWRpc2FibGVIaWdobGlnaHQsXG5cdFx0XHRcdFx0XHRoaWdobGlnaHRUb2RheTogdm5vZGUuYXR0cnMuaGlnaGxpZ2h0VG9kYXksXG5cdFx0XHRcdFx0XHRoaWdobGlnaHRTZWxlY3RlZFdlZWs6IHZub2RlLmF0dHJzLmhpZ2hsaWdodFNlbGVjdGVkV2VlayAmJiAhZGlzYWJsZUhpZ2hsaWdodCxcblx0XHRcdFx0XHRcdHVzZU5hcnJvd1dlZWtOYW1lOiB0cnVlLFxuXHRcdFx0XHRcdFx0aGFzRXZlbnRPbjogdm5vZGUuYXR0cnMuaGFzRXZlbnRzT24sXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XSksXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJQaWNrZXJIZWFkZXIoZGF0ZTogRGF0ZSk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcIi5mbGV4LmZsZXgtc3BhY2UtYmV0d2Vlbi5wYi5pdGVtcy1jZW50ZXIubWxyLXhzXCIsIFtcblx0XHRcdHJlbmRlclN3aXRjaE1vbnRoQXJyb3dJY29uKGZhbHNlLCAyNCwgKCkgPT4gdGhpcy5vbk1vbnRoQ2hhbmdlKGZhbHNlKSksXG5cdFx0XHRtKFxuXHRcdFx0XHRcIi5iLm1sci1zXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0Zm9udFNpemU6IFwiMTRweFwiLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGZvcm1hdE1vbnRoV2l0aEZ1bGxZZWFyKGRhdGUpLFxuXHRcdFx0KSxcblx0XHRcdHJlbmRlclN3aXRjaE1vbnRoQXJyb3dJY29uKHRydWUsIDI0LCAoKSA9PiB0aGlzLm9uTW9udGhDaGFuZ2UodHJ1ZSkpLFxuXHRcdF0pXG5cdH1cblxuXHRwcml2YXRlIG9uTW9udGhDaGFuZ2UoZm9yd2FyZDogYm9vbGVhbikge1xuXHRcdHRoaXMuY3VycmVudERhdGUgPSBpbmNyZW1lbnRNb250aCh0aGlzLmN1cnJlbnREYXRlLCBmb3J3YXJkID8gMSA6IC0xKVxuXHR9XG59XG4iLCJpbXBvcnQgeyBtb2RhbCwgTW9kYWxDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL01vZGFsLmpzXCJcbmltcG9ydCB7IFNob3J0Y3V0IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9taXNjL0tleU1hbmFnZXIuanNcIlxuaW1wb3J0IHsgUG9zUmVjdCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRHJvcGRvd24uanNcIlxuaW1wb3J0IG0sIHsgQ2hpbGRyZW4gfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBLZXlzIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL1R1dGFub3RhQ29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IERheVNlbGVjdG9yIH0gZnJvbSBcIi4vRGF5U2VsZWN0b3IuanNcIlxuaW1wb3J0IHsgYW5pbWF0aW9ucywgb3BhY2l0eSwgdHJhbnNmb3JtLCBUcmFuc2Zvcm1FbnVtIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYW5pbWF0aW9uL0FuaW1hdGlvbnMuanNcIlxuaW1wb3J0IHsgZWFzZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2FuaW1hdGlvbi9FYXNpbmcuanNcIlxuaW1wb3J0IHsgcHggfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9zaXplLmpzXCJcbmltcG9ydCB7IGZvcm1hdE1vbnRoV2l0aEZ1bGxZZWFyIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9taXNjL0Zvcm1hdHRlci5qc1wiXG5pbXBvcnQgeyBpbmNyZW1lbnRNb250aCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHsgc3R5bGVzIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvc3R5bGVzLmpzXCJcbmltcG9ydCByZW5kZXJTd2l0Y2hNb250aEFycm93SWNvbiBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2J1dHRvbnMvQXJyb3dCdXR0b24uanNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIERheVNlbGVjdG9yUG9wdXBBdHRycyB7XG5cdHNlbGVjdGVkRGF0ZTogRGF0ZVxuXHRvbkRhdGVTZWxlY3RlZDogKGRhdGU6IERhdGUsIGRheUNsaWNrOiBib29sZWFuKSA9PiB1bmtub3duXG5cdHN0YXJ0T2ZUaGVXZWVrT2Zmc2V0OiBudW1iZXJcblx0aGFzRXZlbnRzT246IChkYXRlOiBEYXRlKSA9PiBib29sZWFuXG5cdGhpZ2hsaWdodFRvZGF5OiBib29sZWFuXG5cdGhpZ2hsaWdodFNlbGVjdGVkV2VlazogYm9vbGVhblxufVxuXG5leHBvcnQgY2xhc3MgRGF5U2VsZWN0b3JQb3B1cCBpbXBsZW1lbnRzIE1vZGFsQ29tcG9uZW50IHtcblx0cHJpdmF0ZSByZWFkb25seSBfc2hvcnRjdXRzOiBTaG9ydGN1dFtdID0gW11cblx0cHJpdmF0ZSBkb206IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBjdXJyZW50RGF0ZTogRGF0ZVxuXHRwcml2YXRlIGZvY3VzZWRCZWZvcmVTaG93bjogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbFxuXG5cdC8qKlxuXHQgKiBAcGFyYW0gcmVjdCBUaGUgcmVjdCB3aXRoIGNvb3JkaW5hdGVzIGFib3V0IHdoZXJlIHRoZSBwb3B1cCBzaG91bGQgYmUgcmVuZGVyZWRcblx0ICogQHBhcmFtIGF0dHJzIFRoZSBhdHRyaWJ1dGVzIGZvciB0aGUgY29tcG9uZW50XG5cdCAqL1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHJlY3Q6IFBvc1JlY3QsIHByaXZhdGUgcmVhZG9ubHkgYXR0cnM6IERheVNlbGVjdG9yUG9wdXBBdHRycykge1xuXHRcdHRoaXMuc2V0dXBTaG9ydGN1dHMoKVxuXHRcdHRoaXMudmlldyA9IHRoaXMudmlldy5iaW5kKHRoaXMpXG5cdFx0dGhpcy5jdXJyZW50RGF0ZSA9IGF0dHJzLnNlbGVjdGVkRGF0ZVxuXHR9XG5cblx0dmlldygpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXG5cdFx0XHRcIi5hYnMuZWxldmF0ZWQtYmcucGxyLnB0LXMucGItbS5ib3JkZXItcmFkaXVzLmRyb3Bkb3duLXNoYWRvdy5mbGV4LmZsZXgtY29sdW1uXCIsXG5cdFx0XHR7XG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0b3BhY2l0eTogXCIwXCIsXG5cdFx0XHRcdFx0bGVmdDogcHgodGhpcy5yZWN0LmxlZnQpLFxuXHRcdFx0XHRcdHRvcDogcHgodGhpcy5yZWN0LmJvdHRvbSksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRhYkluZGV4OiAwLFxuXHRcdFx0XHRhdXRvRm9jdXM6IFwidHJ1ZVwiLFxuXHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5kb20gPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblxuXHRcdFx0XHRcdGFuaW1hdGlvbnMuYWRkKHRoaXMuZG9tLCBbb3BhY2l0eSgwLCAxLCB0cnVlKSwgdHJhbnNmb3JtKFRyYW5zZm9ybUVudW0uU2NhbGUsIDAuNSwgMSldLCB7XG5cdFx0XHRcdFx0XHRlYXNpbmc6IGVhc2Uub3V0LFxuXHRcdFx0XHRcdH0pXG5cblx0XHRcdFx0XHQvLyBXZSBuZWVkIGEgbGl0dGxlIHRpbWVvdXQgdG8gZm9jdXMgdGhlIG1vZGFsLCB0aGlzIHdpbGwgd2FpdFxuXHRcdFx0XHRcdC8vIHRoZSBuZWNlc3NhcnkgdGltZSB0byB0aGUgcG9wdXAgYmUgdmlzaWJsZSBvbiBzY3JlZW5cblx0XHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHRoaXMuZG9tPy5mb2N1cygpLCAyMDApXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0W1xuXHRcdFx0XHR0aGlzLnJlbmRlclBpY2tlckhlYWRlcih0aGlzLmN1cnJlbnREYXRlKSxcblx0XHRcdFx0bShcIi5mbGV4LWdyb3cub3ZlcmZsb3ctaGlkZGVuXCIsIFtcblx0XHRcdFx0XHRtKERheVNlbGVjdG9yLCB7XG5cdFx0XHRcdFx0XHRzZWxlY3RlZERhdGU6IHRoaXMuY3VycmVudERhdGUsXG5cdFx0XHRcdFx0XHRvbkRhdGVTZWxlY3RlZDogdGhpcy5hdHRycy5vbkRhdGVTZWxlY3RlZCxcblx0XHRcdFx0XHRcdHdpZGU6IHRydWUsXG5cdFx0XHRcdFx0XHRzdGFydE9mVGhlV2Vla09mZnNldDogdGhpcy5hdHRycy5zdGFydE9mVGhlV2Vla09mZnNldCxcblx0XHRcdFx0XHRcdGlzRGF5U2VsZWN0b3JFeHBhbmRlZDogdHJ1ZSxcblx0XHRcdFx0XHRcdGhhbmRsZURheVBpY2tlclN3aXBlOiAoaXNOZXh0KSA9PiB7XG5cdFx0XHRcdFx0XHRcdHRoaXMub25Nb250aENoYW5nZShpc05leHQpXG5cdFx0XHRcdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRzaG93RGF5U2VsZWN0aW9uOiBmYWxzZSxcblx0XHRcdFx0XHRcdGhpZ2hsaWdodFRvZGF5OiB0aGlzLmF0dHJzLmhpZ2hsaWdodFRvZGF5LFxuXHRcdFx0XHRcdFx0aGlnaGxpZ2h0U2VsZWN0ZWRXZWVrOiB0aGlzLmF0dHJzLmhpZ2hsaWdodFNlbGVjdGVkV2Vlayxcblx0XHRcdFx0XHRcdHVzZU5hcnJvd1dlZWtOYW1lOiBzdHlsZXMuaXNTaW5nbGVDb2x1bW5MYXlvdXQoKSxcblx0XHRcdFx0XHRcdGhhc0V2ZW50T246IHRoaXMuYXR0cnMuaGFzRXZlbnRzT24sXG5cdFx0XHRcdFx0fSksXG5cdFx0XHRcdF0pLFxuXHRcdFx0XSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclBpY2tlckhlYWRlcihkYXRlOiBEYXRlKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFwiLmZsZXguZmxleC1zcGFjZS1iZXR3ZWVuLnBiLXMuaXRlbXMtY2VudGVyXCIsIFtcblx0XHRcdG0oXG5cdFx0XHRcdFwiLmJcIixcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRmb250U2l6ZTogXCIxNHB4XCIsXG5cdFx0XHRcdFx0XHRtYXJnaW5MZWZ0OiBcIjZweFwiLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGZvcm1hdE1vbnRoV2l0aEZ1bGxZZWFyKGRhdGUpLFxuXHRcdFx0KSxcblx0XHRcdG0oXCIuZmxleC5pdGVtcy1jZW50ZXJcIiwgW1xuXHRcdFx0XHRyZW5kZXJTd2l0Y2hNb250aEFycm93SWNvbihmYWxzZSwgMjQsICgpID0+IHRoaXMub25Nb250aENoYW5nZShmYWxzZSkpLFxuXHRcdFx0XHRyZW5kZXJTd2l0Y2hNb250aEFycm93SWNvbih0cnVlLCAyNCwgKCkgPT4gdGhpcy5vbk1vbnRoQ2hhbmdlKHRydWUpKSxcblx0XHRcdF0pLFxuXHRcdF0pXG5cdH1cblxuXHRwcml2YXRlIG9uTW9udGhDaGFuZ2UoZm9yd2FyZDogYm9vbGVhbikge1xuXHRcdHRoaXMuY3VycmVudERhdGUgPSBpbmNyZW1lbnRNb250aCh0aGlzLmN1cnJlbnREYXRlLCBmb3J3YXJkID8gMSA6IC0xKVxuXHR9XG5cblx0Ly8gU2V0cyB0aGUgY29udGVudCBkaXYgKC5tYWluLXZpZXcpIHRvIGluZXJ0LCBkaXNhYmxpbmcgdGhlIGFiaWxpdHkgdG8gYmUgZm9jdXNlZCwgdGhpcyB0cmFwcyB0aGVcblx0Ly8gZm9jdXMgdG8gdGhlIHBvcHVwLCByZWxlYXNpbmcgaXQganVzdCB3aGVuIHRoZSBwb3B1cCBpcyBjbG9zZWQgYW5kIHRoZSBpbmVydCBwcm9wZXJ0eSByZW1vdmVkLlxuXHRwcml2YXRlIHR1cm5UcmFwRm9jdXMob246IGJvb2xlYW4pIHtcblx0XHRjb25zdCBlbGVtZW50c1F1ZXJ5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIm1haW4tdmlld1wiKVxuXG5cdFx0aWYgKGVsZW1lbnRzUXVlcnkubGVuZ3RoID4gMCkge1xuXHRcdFx0Y29uc3QgbWFpbkRpdiA9IGVsZW1lbnRzUXVlcnkuaXRlbSgwKVxuXHRcdFx0aWYgKG9uKSBtYWluRGl2Py5zZXRBdHRyaWJ1dGUoXCJpbmVydFwiLCBcInRydWVcIilcblx0XHRcdGVsc2UgbWFpbkRpdj8ucmVtb3ZlQXR0cmlidXRlKFwiaW5lcnRcIilcblx0XHR9XG5cdH1cblxuXHRzaG93KCkge1xuXHRcdHRoaXMuZm9jdXNlZEJlZm9yZVNob3duID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudFxuXHRcdHRoaXMudHVyblRyYXBGb2N1cyh0cnVlKVxuXHRcdG1vZGFsLmRpc3BsYXkodGhpcywgZmFsc2UpXG5cdH1cblxuXHRjbG9zZSgpIHtcblx0XHR0aGlzLnR1cm5UcmFwRm9jdXMoZmFsc2UpXG5cdFx0bW9kYWwucmVtb3ZlKHRoaXMpXG5cdH1cblxuXHRiYWNrZ3JvdW5kQ2xpY2soZTogTW91c2VFdmVudCk6IHZvaWQge1xuXHRcdHRoaXMudHVyblRyYXBGb2N1cyhmYWxzZSlcblx0XHRtb2RhbC5yZW1vdmUodGhpcylcblx0fVxuXG5cdGhpZGVBbmltYXRpb24oKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG5cdH1cblxuXHRvbkNsb3NlKCk6IHZvaWQge1xuXHRcdHRoaXMuY2xvc2UoKVxuXHR9XG5cblx0c2hvcnRjdXRzKCk6IFNob3J0Y3V0W10ge1xuXHRcdHJldHVybiB0aGlzLl9zaG9ydGN1dHNcblx0fVxuXG5cdHBvcFN0YXRlKGU6IEV2ZW50KTogYm9vbGVhbiB7XG5cdFx0dGhpcy50dXJuVHJhcEZvY3VzKGZhbHNlKVxuXHRcdG1vZGFsLnJlbW92ZSh0aGlzKVxuXHRcdHJldHVybiBmYWxzZVxuXHR9XG5cblx0Y2FsbGluZ0VsZW1lbnQoKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcblx0XHRyZXR1cm4gdGhpcy5mb2N1c2VkQmVmb3JlU2hvd25cblx0fVxuXG5cdHByaXZhdGUgc2V0dXBTaG9ydGN1dHMoKSB7XG5cdFx0Y29uc3QgY2xvc2U6IFNob3J0Y3V0ID0ge1xuXHRcdFx0a2V5OiBLZXlzLkVTQyxcblx0XHRcdGV4ZWM6ICgpID0+IHRoaXMuY2xvc2UoKSxcblx0XHRcdGhlbHA6IFwiY2xvc2VfYWx0XCIsXG5cdFx0fVxuXG5cdFx0dGhpcy5fc2hvcnRjdXRzLnB1c2goY2xvc2UpXG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbiB9IGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvSWNvbnMuanNcIlxuaW1wb3J0IHsgQnV0dG9uQ29sb3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgeyBCb290SWNvbnMgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0Jvb3RJY29ucy5qc1wiXG5pbXBvcnQgdHlwZSB7IE1heWJlVHJhbnNsYXRpb24gfSBmcm9tIFwiLi4vLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgQnV0dG9uU2l6ZSB9IGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL2Jhc2UvQnV0dG9uU2l6ZS5qc1wiXG5cbmV4cG9ydCB0eXBlIEZsb2F0aW5nQWN0aW9uQnV0dG9uQXR0cnMgPSB7XG5cdHRpdGxlOiBNYXliZVRyYW5zbGF0aW9uXG5cdGNvbG9yczogQnV0dG9uQ29sb3Jcblx0aWNvbjogSWNvbnMgfCBCb290SWNvbnNcblx0YWN0aW9uOiAoKSA9PiB1bmtub3duXG59XG5cbmV4cG9ydCBjbGFzcyBGbG9hdGluZ0FjdGlvbkJ1dHRvbiBpbXBsZW1lbnRzIENvbXBvbmVudDxGbG9hdGluZ0FjdGlvbkJ1dHRvbkF0dHJzPiB7XG5cdHZpZXcoeyBhdHRyczogeyB0aXRsZSwgY29sb3JzLCBpY29uLCBhY3Rpb24gfSB9OiBWbm9kZTxGbG9hdGluZ0FjdGlvbkJ1dHRvbkF0dHJzPik6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwic3Bhbi5mbG9hdC1hY3Rpb24tYnV0dG9uLnBvc2ItbWwucG9zci1tbC5hY2NlbnQtYmcuZmFiLXNoYWRvd1wiLFxuXHRcdFx0bShJY29uQnV0dG9uLCB7XG5cdFx0XHRcdGNvbG9ycyxcblx0XHRcdFx0aWNvbixcblx0XHRcdFx0dGl0bGUsXG5cdFx0XHRcdGNsaWNrOiBhY3Rpb24sXG5cdFx0XHRcdHNpemU6IEJ1dHRvblNpemUuTGFyZ2UsXG5cdFx0XHR9KSxcblx0XHQpXG5cdH1cbn1cbiIsImltcG9ydCB0eXBlIHsgQ2FsZW5kYXJFdmVudCwgQ29udGFjdCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgQWxsSWNvbnMsIEljb24sIEljb25TaXplIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uLmpzXCJcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvdGhlbWUuanNcIlxuaW1wb3J0IHsgQm9vdEljb25zIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9Cb290SWNvbnMuanNcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0ljb25zLmpzXCJcbmltcG9ydCB7IGNhbGN1bGF0ZUNvbnRhY3RzQWdlLCBnZXRUaW1lWm9uZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9DYWxlbmRhclV0aWxzLmpzXCJcbmltcG9ydCB7IG1lbW9pemVkLCBub09wIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgeyBsYW5nLCBUcmFuc2xhdGlvbktleSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBCYW5uZXJCdXR0b24sIEJhbm5lckJ1dHRvbkF0dHJzIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9idXR0b25zL0Jhbm5lckJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBwdXJlQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9QdXJlQ29tcG9uZW50LmpzXCJcbmltcG9ydCB7IGZvcm1hdEV2ZW50RHVyYXRpb24gfSBmcm9tIFwiLi4vQ2FsZW5kYXJHdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBnZXRMb2NhdGlvblVybCB9IGZyb20gXCIuL0V2ZW50UHJldmlld1ZpZXcuanNcIlxuaW1wb3J0IHsgZ2V0Q29udGFjdFRpdGxlIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9HdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBpc29EYXRlVG9CaXJ0aGRheSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9CaXJ0aGRheVV0aWxzLmpzXCJcbmltcG9ydCB7IGNyZWF0ZURyb3Bkb3duIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgeyB3cml0ZU1haWwgfSBmcm9tIFwiLi4vLi4vLi4vLi4vbWFpbC1hcHAvY29udGFjdHMvdmlldy9Db250YWN0Vmlldy5qc1wiXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL21pc2MvQ2xpZW50RGV0ZWN0b3IuanNcIlxuXG5leHBvcnQgdHlwZSBDb250YWN0UHJldmlld1ZpZXdBdHRycyA9IHtcblx0ZXZlbnQ6IENhbGVuZGFyRXZlbnRcblx0Y29udGFjdDogQ29udGFjdFxufVxuXG5leHBvcnQgY2xhc3MgQ29udGFjdFByZXZpZXdWaWV3IGltcGxlbWVudHMgQ29tcG9uZW50PENvbnRhY3RQcmV2aWV3Vmlld0F0dHJzPiB7XG5cdC8vIENhY2hlIHRoZSBwYXJzZWQgVVJMLCBzbyB3ZSBkb24ndCBwYXJzZSB0aGUgVVJMIG9uIGV2ZXJ5IHNpbmdsZSB2aWV3IGNhbGxcblx0cHJpdmF0ZSByZWFkb25seSBnZXRMb2NhdGlvblVybDogdHlwZW9mIGdldExvY2F0aW9uVXJsXG5cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5nZXRMb2NhdGlvblVybCA9IG1lbW9pemVkKGdldExvY2F0aW9uVXJsKVxuXHR9XG5cblx0dmlldyh2bm9kZTogVm5vZGU8Q29udGFjdFByZXZpZXdWaWV3QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHsgZXZlbnQsIGNvbnRhY3QgfSA9IHZub2RlLmF0dHJzXG5cdFx0Y29uc3QgZXZlbnRUaXRsZSA9IGdldENvbnRhY3RUaXRsZShjb250YWN0KVxuXG5cdFx0Y29uc3QgYmlydGhZZWFyID0gY29udGFjdC5iaXJ0aGRheUlzbyAmJiBpc29EYXRlVG9CaXJ0aGRheShjb250YWN0LmJpcnRoZGF5SXNvKS55ZWFyXG5cdFx0Y29uc3QgYWdlID0gYmlydGhZZWFyICYmIGNhbGN1bGF0ZUNvbnRhY3RzQWdlKG5ldyBEYXRlKGJpcnRoWWVhcikuZ2V0RnVsbFllYXIoKSwgZXZlbnQuc3RhcnRUaW1lLmdldEZ1bGxZZWFyKCkpXG5cdFx0Y29uc3QgYWdlU3RyaW5nID0gYWdlID8gbGFuZy5nZXQoXCJiaXJ0aGRheUV2ZW50QWdlX3RpdGxlXCIsIHsgXCJ7YWdlfVwiOiBhZ2UgfSkgOiBcIlwiXG5cblx0XHRyZXR1cm4gbShcIi5mbGV4LmNvbC5zbWFsbGVyLnNjcm9sbC52aXNpYmxlLXNjcm9sbGJhclwiLCBbXG5cdFx0XHR0aGlzLnJlbmRlclJvdyhCb290SWNvbnMuQ2FsZW5kYXIsIFttKFwic3Bhbi5oM1wiLCBldmVudFRpdGxlKV0pLFxuXHRcdFx0dGhpcy5yZW5kZXJSb3coSWNvbnMuVGltZSwgW2Zvcm1hdEV2ZW50RHVyYXRpb24oZXZlbnQsIGdldFRpbWVab25lKCksIGZhbHNlKV0pLFxuXHRcdFx0YWdlID8gdGhpcy5yZW5kZXJSb3coSWNvbnMuR2lmdCwgYWdlU3RyaW5nKSA6IG51bGwsXG5cdFx0XHR0aGlzLnJlbmRlckFjdGlvbnMoY29udGFjdCksXG5cdFx0XSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyUm93KGhlYWRlckljb246IEFsbEljb25zLCBjaGlsZHJlbjogQ2hpbGRyZW4sIGlzQWxpZ25lZExlZnQ/OiBib29sZWFuKTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIuZmxleC5wYi1zXCIsXG5cdFx0XHR7XG5cdFx0XHRcdGNsYXNzOiBpc0FsaWduZWRMZWZ0ID8gXCJpdGVtcy1zdGFydFwiIDogXCJpdGVtcy1jZW50ZXJcIixcblx0XHRcdH0sXG5cdFx0XHRbdGhpcy5yZW5kZXJTZWN0aW9uSW5kaWNhdG9yKGhlYWRlckljb24sIGlzQWxpZ25lZExlZnQgPyB7IG1hcmdpblRvcDogXCIycHhcIiB9IDogdW5kZWZpbmVkKSwgbShcIi5zZWxlY3RhYmxlLnRleHQtYnJlYWsuZnVsbC13aWR0aFwiLCBjaGlsZHJlbildLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyU2VjdGlvbkluZGljYXRvcihpY29uOiBBbGxJY29ucywgc3R5bGU6IFJlY29yZDxzdHJpbmcsIGFueT4gPSB7fSk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShJY29uLCB7XG5cdFx0XHRpY29uLFxuXHRcdFx0Y2xhc3M6IFwicHJcIixcblx0XHRcdHNpemU6IEljb25TaXplLk1lZGl1bSxcblx0XHRcdHN0eWxlOiBPYmplY3QuYXNzaWduKFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0ZmlsbDogdGhlbWUuY29udGVudF9idXR0b24sXG5cdFx0XHRcdFx0ZGlzcGxheTogXCJibG9ja1wiLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzdHlsZSxcblx0XHRcdCksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQWN0aW9ucyhjb250YWN0OiBDb250YWN0KTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFwiLmZsZXgucGItc1wiLCBtKEFjdGlvbkJ1dHRvbnMsIGNvbnRhY3QpKVxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaW11bGF0ZU1haWxUb0NsaWNrKG1haWxBZGRyZXNzOiBzdHJpbmcpIHtcblx0Y29uc3QgYW5jaG9yRWxlbWVudDogSFRNTEFuY2hvckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKVxuXHRhbmNob3JFbGVtZW50LmhyZWYgPSBgbWFpbHRvOiR7bWFpbEFkZHJlc3N9YFxuXHRhbmNob3JFbGVtZW50LnRhcmdldCA9IFwiX2JsYW5rXCJcblx0YW5jaG9yRWxlbWVudC5jbGljaygpXG59XG5cbmNvbnN0IEFjdGlvbkJ1dHRvbnMgPSBwdXJlQ29tcG9uZW50KChjb250YWN0OiBDb250YWN0KSA9PiB7XG5cdGludGVyZmFjZSBCdXR0b25Db2xvcnMge1xuXHRcdGJvcmRlckNvbG9yOiBzdHJpbmdcblx0XHRjb2xvcjogc3RyaW5nXG5cdH1cblxuXHRjb25zdCBtYWtlQWN0aW9uQnV0dG9uQXR0cnMgPSAob25DbGljazogKGU6IGFueSwgZG9tOiBhbnkpID0+IHVua25vd24sIHRleHQ6IFRyYW5zbGF0aW9uS2V5LCBjb2xvcnM6IEJ1dHRvbkNvbG9ycywgaWNvbj86IENoaWxkcmVuKTogQmFubmVyQnV0dG9uQXR0cnMgPT4gKHtcblx0XHR0ZXh0LFxuXHRcdGNsYXNzOiBcIndpZHRoLW1pbi1jb250ZW50IGZsZXggaXRlbXMtY2VudGVyXCIsXG5cdFx0Y2xpY2s6IG9uQ2xpY2ssXG5cdFx0aWNvbixcblx0XHQuLi5jb2xvcnMsXG5cdH0pXG5cblx0Y29uc3QgcmVuZGVySWNvbiA9IChpY29uOiBBbGxJY29ucywgZmlsbENvbG9yOiBzdHJpbmcpID0+XG5cdFx0bShJY29uLCB7XG5cdFx0XHRpY29uLFxuXHRcdFx0Y2xhc3M6IFwiZmxleC1jZW50ZXIgaXRlbXMtY2VudGVyIG1yLXhzXCIsXG5cdFx0XHRzdHlsZToge1xuXHRcdFx0XHRmaWxsOiBmaWxsQ29sb3IsXG5cdFx0XHR9LFxuXHRcdH0pXG5cblx0Y29uc3QgcmVuZGVyU3VmZml4ID0gKHRleHQ6IHN0cmluZykgPT4gKHRleHQgIT09IFwiXCIgPyBgKCR7dGV4dH0pIGAgOiBcIlwiKVxuXG5cdGNvbnN0IHNob3dNYWlsRHJvcGRvd24gPSBjcmVhdGVEcm9wZG93bih7XG5cdFx0bGF6eUJ1dHRvbnM6ICgpID0+XG5cdFx0XHRjb250YWN0Lm1haWxBZGRyZXNzZXMubWFwKChtYWlsQWRkcmVzcywgaW5kZXgpID0+ICh7XG5cdFx0XHRcdGxhYmVsOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcIm1haWxBZGRyZXNzX2xhYmVsXCIsIGAke3JlbmRlclN1ZmZpeChtYWlsQWRkcmVzcy5jdXN0b21UeXBlTmFtZSl9JHttYWlsQWRkcmVzcy5hZGRyZXNzfWApLFxuXHRcdFx0XHRjbGljazogKCkgPT4ge1xuXHRcdFx0XHRcdGlmIChjbGllbnQuaXNDYWxlbmRhckFwcCgpKSB7XG5cdFx0XHRcdFx0XHRzaW11bGF0ZU1haWxUb0NsaWNrKG1haWxBZGRyZXNzLmFkZHJlc3MpXG5cdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHdyaXRlTWFpbCh7XG5cdFx0XHRcdFx0XHRuYW1lOiBgJHtjb250YWN0LmZpcnN0TmFtZX0gJHtjb250YWN0Lmxhc3ROYW1lfWAudHJpbSgpLFxuXHRcdFx0XHRcdFx0YWRkcmVzczogbWFpbEFkZHJlc3MuYWRkcmVzcyxcblx0XHRcdFx0XHRcdGNvbnRhY3Q6IGNvbnRhY3QsXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSxcblx0XHRcdH0pKSxcblx0fSlcblx0Y29uc3Qgc2hvd1Bob25lRHJvcGRvd24gPSBjcmVhdGVEcm9wZG93bih7XG5cdFx0bGF6eUJ1dHRvbnM6ICgpID0+XG5cdFx0XHRjb250YWN0LnBob25lTnVtYmVycy5tYXAoKGNvbnRhY3RQaG9uZSwgaW5kZXgpID0+ICh7XG5cdFx0XHRcdGxhYmVsOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcInBob25lTnVtYmVyXCIsIGAke3JlbmRlclN1ZmZpeChjb250YWN0UGhvbmUuY3VzdG9tVHlwZU5hbWUpfSR7Y29udGFjdFBob25lLm51bWJlcn1gKSxcblx0XHRcdFx0Y2xpY2s6ICgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBlbGVtZW50OiBIVE1MQW5jaG9yRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpXG5cdFx0XHRcdFx0ZWxlbWVudC5ocmVmID0gYHRlbDoke2NvbnRhY3RQaG9uZS5udW1iZXJ9YFxuXHRcdFx0XHRcdGVsZW1lbnQudGFyZ2V0ID0gXCJfYmxhbmtcIlxuXHRcdFx0XHRcdGVsZW1lbnQuY2xpY2soKVxuXHRcdFx0XHR9LFxuXHRcdFx0fSkpLFxuXHR9KVxuXG5cdGNvbnN0IGVtYWlsQnV0dG9uQ29sb3JzID0ge1xuXHRcdGJvcmRlckNvbG9yOiB0aGVtZS5jb250ZW50X2FjY2VudCxcblx0XHRjb2xvcjogdGhlbWUuY29udGVudF9hY2NlbnQsXG5cdH1cblx0Y29uc3QgcGhvbmVCdXR0b25Db2xvcnMgPSB7XG5cdFx0Ym9yZGVyQ29sb3I6IHRoZW1lLmNvbnRlbnRfYnV0dG9uLFxuXHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X2J1dHRvbixcblx0fVxuXG5cdGNvbnN0IHNpbmdsZUVtYWlsQWRyZXNzID0gY29udGFjdC5tYWlsQWRkcmVzc2VzLmxlbmd0aCA9PT0gMVxuXHRjb25zdCBzaW5nbGVQaG9uZU51bWJlciA9IGNvbnRhY3QucGhvbmVOdW1iZXJzLmxlbmd0aCA9PT0gMVxuXG5cdGNvbnN0IG9uU2VuZE1haWxDbGljayA9IChldmVudDogTW91c2VFdmVudCwgZG9tOiBIVE1MRWxlbWVudCkgPT4ge1xuXHRcdGlmIChzaW5nbGVFbWFpbEFkcmVzcykge1xuXHRcdFx0aWYgKGNsaWVudC5pc0NhbGVuZGFyQXBwKCkpIHtcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9IGVsc2UgaWYgKCFjbGllbnQuaXNDYWxlbmRhckFwcCgpKSB7XG5cdFx0XHRcdHJldHVybiB3cml0ZU1haWwoe1xuXHRcdFx0XHRcdG5hbWU6IGAke2NvbnRhY3QuZmlyc3ROYW1lfSAke2NvbnRhY3QubGFzdE5hbWV9YC50cmltKCksXG5cdFx0XHRcdFx0YWRkcmVzczogY29udGFjdC5tYWlsQWRkcmVzc2VzWzBdLmFkZHJlc3MsXG5cdFx0XHRcdFx0Y29udGFjdDogY29udGFjdCxcblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHR9XG5cblx0XHRzaG93TWFpbERyb3Bkb3duKGV2ZW50LCBkb20pXG5cdH1cblxuXHRyZXR1cm4gbShcIi5mdWxsLXdpZHRoLmZsZXguaXRlbXMtY2VudGVyLmZsZXgtZW5kLm10LXNcIiwgW1xuXHRcdGNvbnRhY3QubWFpbEFkZHJlc3Nlcy5sZW5ndGhcblx0XHRcdD8gbShcblx0XHRcdFx0XHRzaW5nbGVFbWFpbEFkcmVzcyAmJiBjbGllbnQuaXNDYWxlbmRhckFwcCgpID8gYGFbaHJlZj1cIm1haWx0bzoke2NvbnRhY3QubWFpbEFkZHJlc3Nlc1swXS5hZGRyZXNzfVwiXVt0YXJnZXQ9X2JsYW5rXS5uby10ZXh0LWRlY29yYXRpb25gIDogXCJcIixcblx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0QmFubmVyQnV0dG9uLFxuXHRcdFx0XHRcdFx0bWFrZUFjdGlvbkJ1dHRvbkF0dHJzKG9uU2VuZE1haWxDbGljaywgXCJzZW5kTWFpbF9sYWJlbFwiLCBlbWFpbEJ1dHRvbkNvbG9ycywgcmVuZGVySWNvbihCb290SWNvbnMuTWFpbCwgZW1haWxCdXR0b25Db2xvcnMuY29sb3IpKSxcblx0XHRcdFx0XHQpLFxuXHRcdFx0ICApXG5cdFx0XHQ6IG51bGwsXG5cdFx0Y29udGFjdC5waG9uZU51bWJlcnMubGVuZ3RoXG5cdFx0XHQ/IG0oXG5cdFx0XHRcdFx0c2luZ2xlUGhvbmVOdW1iZXIgPyBgYVtocmVmPVwidGVsOiR7Y29udGFjdC5waG9uZU51bWJlcnNbMF0ubnVtYmVyfVwiXVt0YXJnZXQ9X2JsYW5rXS5uby10ZXh0LWRlY29yYXRpb25gIDogXCJcIixcblx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0QmFubmVyQnV0dG9uLFxuXHRcdFx0XHRcdFx0bWFrZUFjdGlvbkJ1dHRvbkF0dHJzKFxuXHRcdFx0XHRcdFx0XHRzaW5nbGVQaG9uZU51bWJlciA/IG5vT3AgOiBzaG93UGhvbmVEcm9wZG93bixcblx0XHRcdFx0XHRcdFx0XCJjYWxsTnVtYmVyX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdHBob25lQnV0dG9uQ29sb3JzLFxuXHRcdFx0XHRcdFx0XHRyZW5kZXJJY29uKEljb25zLkNhbGwsIHBob25lQnV0dG9uQ29sb3JzLmNvbG9yKSxcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0KSxcblx0XHRcdCAgKVxuXHRcdFx0OiBudWxsLFxuXHRdKVxufSlcbiIsImltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUsIGlzQW5kcm9pZEFwcCwgaXNBcHAsIGlzQnJvd3NlciwgaXNEZXNrdG9wLCBpc0VsZWN0cm9uQ2xpZW50LCBpc0lPU0FwcCwgaXNUZXN0IH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvY29tbW9uL0Vudi5qc1wiXG5pbXBvcnQgeyBFdmVudENvbnRyb2xsZXIgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9tYWluL0V2ZW50Q29udHJvbGxlci5qc1wiXG5pbXBvcnQgeyB0eXBlIE1haWxib3hEZXRhaWwsIE1haWxib3hNb2RlbCB9IGZyb20gXCIuLi9jb21tb24vbWFpbEZ1bmN0aW9uYWxpdHkvTWFpbGJveE1vZGVsLmpzXCJcbmltcG9ydCB7IENvbnRhY3RNb2RlbCB9IGZyb20gXCIuLi9jb21tb24vY29udGFjdHNGdW5jdGlvbmFsaXR5L0NvbnRhY3RNb2RlbC5qc1wiXG5pbXBvcnQgeyBFbnRpdHlDbGllbnQgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50LmpzXCJcbmltcG9ydCB7IFByb2dyZXNzVHJhY2tlciB9IGZyb20gXCIuLi9jb21tb24vYXBpL21haW4vUHJvZ3Jlc3NUcmFja2VyLmpzXCJcbmltcG9ydCB7IENyZWRlbnRpYWxzUHJvdmlkZXIgfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvY3JlZGVudGlhbHMvQ3JlZGVudGlhbHNQcm92aWRlci5qc1wiXG5pbXBvcnQgeyBib290c3RyYXBXb3JrZXIsIFdvcmtlckNsaWVudCB9IGZyb20gXCIuLi9jb21tb24vYXBpL21haW4vV29ya2VyQ2xpZW50LmpzXCJcbmltcG9ydCB7IENBTEVOREFSX01JTUVfVFlQRSwgRmlsZUNvbnRyb2xsZXIsIGd1aURvd25sb2FkIH0gZnJvbSBcIi4uL2NvbW1vbi9maWxlL0ZpbGVDb250cm9sbGVyLmpzXCJcbmltcG9ydCB7IFNlY29uZEZhY3RvckhhbmRsZXIgfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvMmZhL1NlY29uZEZhY3RvckhhbmRsZXIuanNcIlxuaW1wb3J0IHsgV2ViYXV0aG5DbGllbnQgfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvMmZhL3dlYmF1dGhuL1dlYmF1dGhuQ2xpZW50LmpzXCJcbmltcG9ydCB7IExvZ2luRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvTG9naW5GYWNhZGUuanNcIlxuaW1wb3J0IHsgTG9naW5Db250cm9sbGVyIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvbWFpbi9Mb2dpbkNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHsgQXBwSGVhZGVyQXR0cnMsIEhlYWRlciB9IGZyb20gXCIuLi9jb21tb24vZ3VpL0hlYWRlci5qc1wiXG5pbXBvcnQgeyBDdXN0b21lckZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ3VzdG9tZXJGYWNhZGUuanNcIlxuaW1wb3J0IHsgR2lmdENhcmRGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0dpZnRDYXJkRmFjYWRlLmpzXCJcbmltcG9ydCB7IEdyb3VwTWFuYWdlbWVudEZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvR3JvdXBNYW5hZ2VtZW50RmFjYWRlLmpzXCJcbmltcG9ydCB7IENvbmZpZ3VyYXRpb25EYXRhYmFzZSB9IGZyb20gXCIuLi9jb21tb24vYXBpL3dvcmtlci9mYWNhZGVzL2xhenkvQ29uZmlndXJhdGlvbkRhdGFiYXNlLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9DYWxlbmRhckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBNYWlsRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9NYWlsRmFjYWRlLmpzXCJcbmltcG9ydCB7IFNoYXJlRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9TaGFyZUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBDb3VudGVyRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9Db3VudGVyRmFjYWRlLmpzXCJcbmltcG9ydCB7IEJvb2tpbmdGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0Jvb2tpbmdGYWNhZGUuanNcIlxuaW1wb3J0IHsgTWFpbEFkZHJlc3NGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L01haWxBZGRyZXNzRmFjYWRlLmpzXCJcbmltcG9ydCB7IEJsb2JGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L0Jsb2JGYWNhZGUuanNcIlxuaW1wb3J0IHsgVXNlck1hbmFnZW1lbnRGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9sYXp5L1VzZXJNYW5hZ2VtZW50RmFjYWRlLmpzXCJcbmltcG9ydCB7IFJlY292ZXJDb2RlRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9SZWNvdmVyQ29kZUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBDb250YWN0RmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9Db250YWN0RmFjYWRlLmpzXCJcbmltcG9ydCB7IFVzYWdlVGVzdENvbnRyb2xsZXIgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXVzYWdldGVzdHNcIlxuaW1wb3J0IHsgRXBoZW1lcmFsVXNhZ2VUZXN0U3RvcmFnZSwgU3RvcmFnZUJlaGF2aW9yLCBVc2FnZVRlc3RNb2RlbCB9IGZyb20gXCIuLi9jb21tb24vbWlzYy9Vc2FnZVRlc3RNb2RlbC5qc1wiXG5pbXBvcnQgeyBOZXdzTW9kZWwgfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvbmV3cy9OZXdzTW9kZWwuanNcIlxuaW1wb3J0IHsgSVNlcnZpY2VFeGVjdXRvciB9IGZyb20gXCIuLi9jb21tb24vYXBpL2NvbW1vbi9TZXJ2aWNlUmVxdWVzdC5qc1wiXG5pbXBvcnQgeyBDcnlwdG9GYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS93b3JrZXIvY3J5cHRvL0NyeXB0b0ZhY2FkZS5qc1wiXG5pbXBvcnQgeyBTZWFyY2hUZXh0SW5BcHBGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL1NlYXJjaFRleHRJbkFwcEZhY2FkZS5qc1wiXG5pbXBvcnQgeyBTZXR0aW5nc0ZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvU2V0dGluZ3NGYWNhZGUuanNcIlxuaW1wb3J0IHsgRGVza3RvcFN5c3RlbUZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvRGVza3RvcFN5c3RlbUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBXZWJNb2JpbGVGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL25hdGl2ZS9tYWluL1dlYk1vYmlsZUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBTeXN0ZW1QZXJtaXNzaW9uSGFuZGxlciB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL21haW4vU3lzdGVtUGVybWlzc2lvbkhhbmRsZXIuanNcIlxuaW1wb3J0IHsgSW50ZXJXaW5kb3dFdmVudEZhY2FkZVNlbmREaXNwYXRjaGVyIH0gZnJvbSBcIi4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9JbnRlcldpbmRvd0V2ZW50RmFjYWRlU2VuZERpc3BhdGNoZXIuanNcIlxuaW1wb3J0IHsgRXhwb3NlZENhY2hlU3RvcmFnZSB9IGZyb20gXCIuLi9jb21tb24vYXBpL3dvcmtlci9yZXN0L0RlZmF1bHRFbnRpdHlSZXN0Q2FjaGUuanNcIlxuaW1wb3J0IHsgV29ya2VyRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvV29ya2VyRmFjYWRlLmpzXCJcbmltcG9ydCB7IFBhZ2VDb250ZXh0TG9naW5MaXN0ZW5lciB9IGZyb20gXCIuLi9jb21tb24vYXBpL21haW4vUGFnZUNvbnRleHRMb2dpbkxpc3RlbmVyLmpzXCJcbmltcG9ydCB7IFdlYnNvY2tldENvbm5lY3Rpdml0eU1vZGVsIH0gZnJvbSBcIi4uL2NvbW1vbi9taXNjL1dlYnNvY2tldENvbm5lY3Rpdml0eU1vZGVsLmpzXCJcbmltcG9ydCB7IE9wZXJhdGlvblByb2dyZXNzVHJhY2tlciB9IGZyb20gXCIuLi9jb21tb24vYXBpL21haW4vT3BlcmF0aW9uUHJvZ3Jlc3NUcmFja2VyLmpzXCJcbmltcG9ydCB7IEluZm9NZXNzYWdlSGFuZGxlciB9IGZyb20gXCIuLi9jb21tb24vZ3VpL0luZm9NZXNzYWdlSGFuZGxlci5qc1wiXG5pbXBvcnQgeyBOYXRpdmVJbnRlcmZhY2VzIH0gZnJvbSBcIi4uL2NvbW1vbi9uYXRpdmUvbWFpbi9OYXRpdmVJbnRlcmZhY2VGYWN0b3J5LmpzXCJcbmltcG9ydCB7IEVudHJvcHlGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS93b3JrZXIvZmFjYWRlcy9FbnRyb3B5RmFjYWRlLmpzXCJcbmltcG9ydCB7IFNxbENpcGhlckZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvU3FsQ2lwaGVyRmFjYWRlLmpzXCJcbmltcG9ydCB7IGFzc2VydE5vdE51bGwsIGRlZmVyLCBEZWZlcnJlZE9iamVjdCwgbGF6eSwgbGF6eUFzeW5jLCBMYXp5TG9hZGVkLCBsYXp5TWVtb2l6ZWQsIG5vT3AgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IFJlY2lwaWVudHNNb2RlbCB9IGZyb20gXCIuLi9jb21tb24vYXBpL21haW4vUmVjaXBpZW50c01vZGVsLmpzXCJcbmltcG9ydCB7IE5vWm9uZURhdGVQcm92aWRlciB9IGZyb20gXCIuLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9Ob1pvbmVEYXRlUHJvdmlkZXIuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudCwgQ2FsZW5kYXJFdmVudEF0dGVuZGVlLCBDb250YWN0LCBNYWlsLCBNYWlsYm94UHJvcGVydGllcyB9IGZyb20gXCIuLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IFNlbmRNYWlsTW9kZWwgfSBmcm9tIFwiLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L1NlbmRNYWlsTW9kZWwuanNcIlxuaW1wb3J0IHsgT2ZmbGluZUluZGljYXRvclZpZXdNb2RlbCB9IGZyb20gXCIuLi9jb21tb24vZ3VpL2Jhc2UvT2ZmbGluZUluZGljYXRvclZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBSb3V0ZXIsIFNjb3BlZFJvdXRlciwgVGhyb3R0bGVkUm91dGVyIH0gZnJvbSBcIi4uL2NvbW1vbi9ndWkvU2NvcGVkUm91dGVyLmpzXCJcbmltcG9ydCB7IERldmljZUNvbmZpZywgZGV2aWNlQ29uZmlnIH0gZnJvbSBcIi4uL2NvbW1vbi9taXNjL0RldmljZUNvbmZpZy5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhclNlYXJjaFZpZXdNb2RlbCB9IGZyb20gXCIuL2NhbGVuZGFyL3NlYXJjaC92aWV3L0NhbGVuZGFyU2VhcmNoVmlld01vZGVsLmpzXCJcbmltcG9ydCB7IFNlYXJjaFJvdXRlciB9IGZyb20gXCIuLi9jb21tb24vc2VhcmNoL3ZpZXcvU2VhcmNoUm91dGVyLmpzXCJcbmltcG9ydCB7IGdldEVuYWJsZWRNYWlsQWRkcmVzc2VzV2l0aFVzZXIgfSBmcm9tIFwiLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L1NoYXJlZE1haWxVdGlscy5qc1wiXG5pbXBvcnQgeyBDTElFTlRfT05MWV9DQUxFTkRBUlMsIENvbnN0LCBERUZBVUxUX0NMSUVOVF9PTkxZX0NBTEVOREFSX0NPTE9SUywgRmVhdHVyZVR5cGUsIEdyb3VwVHlwZSwgS2RmVHlwZSB9IGZyb20gXCIuLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgeyBTaGFyZWFibGVHcm91cFR5cGUgfSBmcm9tIFwiLi4vY29tbW9uL3NoYXJpbmcvR3JvdXBVdGlscy5qc1wiXG5pbXBvcnQgeyBSZWNlaXZlZEdyb3VwSW52aXRhdGlvbnNNb2RlbCB9IGZyb20gXCIuLi9jb21tb24vc2hhcmluZy9tb2RlbC9SZWNlaXZlZEdyb3VwSW52aXRhdGlvbnNNb2RlbC5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhclZpZXdNb2RlbCB9IGZyb20gXCIuL2NhbGVuZGFyL3ZpZXcvQ2FsZW5kYXJWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudE1vZGVsLCBDYWxlbmRhck9wZXJhdGlvbiB9IGZyb20gXCIuL2NhbGVuZGFyL2d1aS9ldmVudGVkaXRvci1tb2RlbC9DYWxlbmRhckV2ZW50TW9kZWwuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJFdmVudHNSZXBvc2l0b3J5IH0gZnJvbSBcIi4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeS5qc1wiXG5pbXBvcnQgeyBzaG93UHJvZ3Jlc3NEaWFsb2cgfSBmcm9tIFwiLi4vY29tbW9uL2d1aS9kaWFsb2dzL1Byb2dyZXNzRGlhbG9nLmpzXCJcbmltcG9ydCB7IENvbnRhY3RTdWdnZXN0aW9uUHJvdmlkZXIsIFJlY2lwaWVudHNTZWFyY2hNb2RlbCB9IGZyb20gXCIuLi9jb21tb24vbWlzYy9SZWNpcGllbnRzU2VhcmNoTW9kZWwuanNcIlxuaW1wb3J0IHsgTmF0aXZlSW50ZXJmYWNlTWFpbiB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL21haW4vTmF0aXZlSW50ZXJmYWNlTWFpbi5qc1wiXG5pbXBvcnQgeyBOYXRpdmVGaWxlQXBwIH0gZnJvbSBcIi4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL0ZpbGVBcHAuanNcIlxuaW1wb3J0IHsgTmF0aXZlUHVzaFNlcnZpY2VBcHAgfSBmcm9tIFwiLi4vY29tbW9uL25hdGl2ZS9tYWluL05hdGl2ZVB1c2hTZXJ2aWNlQXBwLmpzXCJcbmltcG9ydCB7IENvbW1vblN5c3RlbUZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvQ29tbW9uU3lzdGVtRmFjYWRlLmpzXCJcbmltcG9ydCB7IFRoZW1lRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9UaGVtZUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBNb2JpbGVTeXN0ZW1GYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL01vYmlsZVN5c3RlbUZhY2FkZS5qc1wiXG5pbXBvcnQgeyBNb2JpbGVDb250YWN0c0ZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTW9iaWxlQ29udGFjdHNGYWNhZGUuanNcIlxuaW1wb3J0IHsgTmF0aXZlQ3JlZGVudGlhbHNGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL25hdGl2ZS9jb21tb24vZ2VuZXJhdGVkaXBjL05hdGl2ZUNyZWRlbnRpYWxzRmFjYWRlLmpzXCJcbmltcG9ydCB7IE1haWxBZGRyZXNzTmFtZUNoYW5nZXIsIE1haWxBZGRyZXNzVGFibGVNb2RlbCB9IGZyb20gXCIuLi9jb21tb24vc2V0dGluZ3MvbWFpbGFkZHJlc3MvTWFpbEFkZHJlc3NUYWJsZU1vZGVsLmpzXCJcbmltcG9ydCB7IEdyb3VwSW5mbyB9IGZyb20gXCIuLi9jb21tb24vYXBpL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBEcmF3ZXJNZW51QXR0cnMgfSBmcm9tIFwiLi4vY29tbW9uL2d1aS9uYXYvRHJhd2VyTWVudS5qc1wiXG5pbXBvcnQgeyBEb21haW5Db25maWdQcm92aWRlciB9IGZyb20gXCIuLi9jb21tb24vYXBpL2NvbW1vbi9Eb21haW5Db25maWdQcm92aWRlci5qc1wiXG5pbXBvcnQgeyBDcmVkZW50aWFsUmVtb3ZhbEhhbmRsZXIgfSBmcm9tIFwiLi4vY29tbW9uL2xvZ2luL0NyZWRlbnRpYWxSZW1vdmFsSGFuZGxlci5qc1wiXG5pbXBvcnQgeyBMb2dpblZpZXdNb2RlbCB9IGZyb20gXCIuLi9jb21tb24vbG9naW4vTG9naW5WaWV3TW9kZWwuanNcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9Qcm9ncmFtbWluZ0Vycm9yLmpzXCJcbmltcG9ydCB7IEVudHJvcHlDb2xsZWN0b3IgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9tYWluL0VudHJvcHlDb2xsZWN0b3IuanNcIlxuaW1wb3J0IHsgbm90aWZpY2F0aW9ucyB9IGZyb20gXCIuLi9jb21tb24vZ3VpL05vdGlmaWNhdGlvbnMuanNcIlxuaW1wb3J0IHsgd2luZG93RmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9taXNjL1dpbmRvd0ZhY2FkZS5qc1wiXG5pbXBvcnQgeyBCcm93c2VyV2ViYXV0aG4gfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvMmZhL3dlYmF1dGhuL0Jyb3dzZXJXZWJhdXRobi5qc1wiXG5pbXBvcnQgeyBGaWxlQ29udHJvbGxlckJyb3dzZXIgfSBmcm9tIFwiLi4vY29tbW9uL2ZpbGUvRmlsZUNvbnRyb2xsZXJCcm93c2VyLmpzXCJcbmltcG9ydCB7IEZpbGVDb250cm9sbGVyTmF0aXZlIH0gZnJvbSBcIi4uL2NvbW1vbi9maWxlL0ZpbGVDb250cm9sbGVyTmF0aXZlLmpzXCJcbmltcG9ydCB7IENhbGVuZGFySW5mbywgQ2FsZW5kYXJNb2RlbCB9IGZyb20gXCIuL2NhbGVuZGFyL21vZGVsL0NhbGVuZGFyTW9kZWwuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJJbnZpdGVIYW5kbGVyIH0gZnJvbSBcIi4vY2FsZW5kYXIvdmlldy9DYWxlbmRhckludml0ZXMuanNcIlxuaW1wb3J0IHsgQWxhcm1TY2hlZHVsZXIgfSBmcm9tIFwiLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQWxhcm1TY2hlZHVsZXIuanNcIlxuaW1wb3J0IHsgU2NoZWR1bGVySW1wbCB9IGZyb20gXCIuLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9TY2hlZHVsZXIuanNcIlxuaW1wb3J0IHR5cGUgeyBDYWxlbmRhckV2ZW50UHJldmlld1ZpZXdNb2RlbCB9IGZyb20gXCIuL2NhbGVuZGFyL2d1aS9ldmVudHBvcHVwL0NhbGVuZGFyRXZlbnRQcmV2aWV3Vmlld01vZGVsLmpzXCJcbmltcG9ydCB7IGlzQ3VzdG9taXphdGlvbkVuYWJsZWRGb3JDdXN0b21lciB9IGZyb20gXCIuLi9jb21tb24vYXBpL2NvbW1vbi91dGlscy9DdXN0b21lclV0aWxzLmpzXCJcbmltcG9ydCB7IFBvc3RMb2dpbkFjdGlvbnMgfSBmcm9tIFwiLi4vY29tbW9uL2xvZ2luL1Bvc3RMb2dpbkFjdGlvbnMuanNcIlxuaW1wb3J0IHsgQ3JlZGVudGlhbEZvcm1hdE1pZ3JhdG9yIH0gZnJvbSBcIi4uL2NvbW1vbi9taXNjL2NyZWRlbnRpYWxzL0NyZWRlbnRpYWxGb3JtYXRNaWdyYXRvci5qc1wiXG5pbXBvcnQgeyBNb2JpbGVQYXltZW50c0ZhY2FkZSB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvTW9iaWxlUGF5bWVudHNGYWNhZGUuanNcIlxuaW1wb3J0IHsgTmF0aXZlVGhlbWVGYWNhZGUsIFRoZW1lQ29udHJvbGxlciwgV2ViVGhlbWVGYWNhZGUgfSBmcm9tIFwiLi4vY29tbW9uL2d1aS9UaGVtZUNvbnRyb2xsZXIuanNcIlxuaW1wb3J0IHR5cGUgeyBIdG1sU2FuaXRpemVyIH0gZnJvbSBcIi4uL2NvbW1vbi9taXNjL0h0bWxTYW5pdGl6ZXIuanNcIlxuaW1wb3J0IHsgdGhlbWUgfSBmcm9tIFwiLi4vY29tbW9uL2d1aS90aGVtZS5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhclNlYXJjaE1vZGVsIH0gZnJvbSBcIi4vY2FsZW5kYXIvc2VhcmNoL21vZGVsL0NhbGVuZGFyU2VhcmNoTW9kZWwuanNcIlxuaW1wb3J0IHsgU2VhcmNoSW5kZXhTdGF0ZUluZm8gfSBmcm9tIFwiLi4vY29tbW9uL2FwaS93b3JrZXIvc2VhcmNoL1NlYXJjaFR5cGVzLmpzXCJcbmltcG9ydCB7IENBTEVOREFSX1BSRUZJWCB9IGZyb20gXCIuLi9jb21tb24vbWlzYy9Sb3V0ZUNoYW5nZS5qc1wiXG5pbXBvcnQgeyBBcHBUeXBlIH0gZnJvbSBcIi4uL2NvbW1vbi9taXNjL0NsaWVudENvbnN0YW50cy5qc1wiXG5pbXBvcnQgdHlwZSB7IFBhcnNlZEV2ZW50IH0gZnJvbSBcIi4uL2NvbW1vbi9jYWxlbmRhci9pbXBvcnQvQ2FsZW5kYXJJbXBvcnRlci5qc1wiXG5pbXBvcnQgeyBFeHRlcm5hbENhbGVuZGFyRmFjYWRlIH0gZnJvbSBcIi4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9FeHRlcm5hbENhbGVuZGFyRmFjYWRlLmpzXCJcbmltcG9ydCB7IGxvY2F0b3IgfSBmcm9tIFwiLi4vY29tbW9uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3IuanNcIlxuaW1wb3J0IHsgc2hvd1NuYWNrQmFyIH0gZnJvbSBcIi4uL2NvbW1vbi9ndWkvYmFzZS9TbmFja0Jhci5qc1wiXG5pbXBvcnQgeyBEYkVycm9yIH0gZnJvbSBcIi4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL0RiRXJyb3IuanNcIlxuaW1wb3J0IHsgV29ya2VyUmFuZG9taXplciB9IGZyb20gXCIuLi9jb21tb24vYXBpL3dvcmtlci93b3JrZXJJbnRlcmZhY2VzLmpzXCJcbmltcG9ydCB7IGxhbmcgfSBmcm9tIFwiLi4vY29tbW9uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWwuanNcIlxuaW1wb3J0IHR5cGUgeyBDYWxlbmRhckNvbnRhY3RQcmV2aWV3Vmlld01vZGVsIH0gZnJvbSBcIi4vY2FsZW5kYXIvZ3VpL2V2ZW50cG9wdXAvQ2FsZW5kYXJDb250YWN0UHJldmlld1ZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBDb250YWN0U3VnZ2VzdGlvbiB9IGZyb20gXCIuLi9jb21tb24vbmF0aXZlL2NvbW1vbi9nZW5lcmF0ZWRpcGMvQ29udGFjdFN1Z2dlc3Rpb25cIlxuaW1wb3J0IHsgTWFpbEltcG9ydGVyIH0gZnJvbSBcIi4uL21haWwtYXBwL21haWwvaW1wb3J0L01haWxJbXBvcnRlci5qc1wiXG5cbmFzc2VydE1haW5Pck5vZGUoKVxuXG5jbGFzcyBDYWxlbmRhckxvY2F0b3Ige1xuXHRldmVudENvbnRyb2xsZXIhOiBFdmVudENvbnRyb2xsZXJcblx0c2VhcmNoITogQ2FsZW5kYXJTZWFyY2hNb2RlbFxuXHRtYWlsYm94TW9kZWwhOiBNYWlsYm94TW9kZWxcblx0Y29udGFjdE1vZGVsITogQ29udGFjdE1vZGVsXG5cdGVudGl0eUNsaWVudCE6IEVudGl0eUNsaWVudFxuXHRwcm9ncmVzc1RyYWNrZXIhOiBQcm9ncmVzc1RyYWNrZXJcblx0Y3JlZGVudGlhbHNQcm92aWRlciE6IENyZWRlbnRpYWxzUHJvdmlkZXJcblx0d29ya2VyITogV29ya2VyQ2xpZW50XG5cdGZpbGVDb250cm9sbGVyITogRmlsZUNvbnRyb2xsZXJcblx0c2Vjb25kRmFjdG9ySGFuZGxlciE6IFNlY29uZEZhY3RvckhhbmRsZXJcblx0d2ViQXV0aG4hOiBXZWJhdXRobkNsaWVudFxuXHRsb2dpbkZhY2FkZSE6IExvZ2luRmFjYWRlXG5cdGxvZ2lucyE6IExvZ2luQ29udHJvbGxlclxuXHRoZWFkZXIhOiBIZWFkZXJcblx0Y3VzdG9tZXJGYWNhZGUhOiBDdXN0b21lckZhY2FkZVxuXHRnaWZ0Q2FyZEZhY2FkZSE6IEdpZnRDYXJkRmFjYWRlXG5cdGdyb3VwTWFuYWdlbWVudEZhY2FkZSE6IEdyb3VwTWFuYWdlbWVudEZhY2FkZVxuXHRjb25maWdGYWNhZGUhOiBDb25maWd1cmF0aW9uRGF0YWJhc2Vcblx0Y2FsZW5kYXJGYWNhZGUhOiBDYWxlbmRhckZhY2FkZVxuXHRtYWlsRmFjYWRlITogTWFpbEZhY2FkZVxuXHRzaGFyZUZhY2FkZSE6IFNoYXJlRmFjYWRlXG5cdGNvdW50ZXJGYWNhZGUhOiBDb3VudGVyRmFjYWRlXG5cdGJvb2tpbmdGYWNhZGUhOiBCb29raW5nRmFjYWRlXG5cdG1haWxBZGRyZXNzRmFjYWRlITogTWFpbEFkZHJlc3NGYWNhZGVcblx0YmxvYkZhY2FkZSE6IEJsb2JGYWNhZGVcblx0dXNlck1hbmFnZW1lbnRGYWNhZGUhOiBVc2VyTWFuYWdlbWVudEZhY2FkZVxuXHRyZWNvdmVyQ29kZUZhY2FkZSE6IFJlY292ZXJDb2RlRmFjYWRlXG5cdGNvbnRhY3RGYWNhZGUhOiBDb250YWN0RmFjYWRlXG5cdHVzYWdlVGVzdENvbnRyb2xsZXIhOiBVc2FnZVRlc3RDb250cm9sbGVyXG5cdHVzYWdlVGVzdE1vZGVsITogVXNhZ2VUZXN0TW9kZWxcblx0bmV3c01vZGVsITogTmV3c01vZGVsXG5cdHNlcnZpY2VFeGVjdXRvciE6IElTZXJ2aWNlRXhlY3V0b3Jcblx0Y3J5cHRvRmFjYWRlITogQ3J5cHRvRmFjYWRlXG5cdHNlYXJjaFRleHRGYWNhZGUhOiBTZWFyY2hUZXh0SW5BcHBGYWNhZGVcblx0ZGVza3RvcFNldHRpbmdzRmFjYWRlITogU2V0dGluZ3NGYWNhZGVcblx0ZGVza3RvcFN5c3RlbUZhY2FkZSE6IERlc2t0b3BTeXN0ZW1GYWNhZGVcblx0bWFpbEltcG9ydGVyITogTWFpbEltcG9ydGVyXG5cdHdlYk1vYmlsZUZhY2FkZSE6IFdlYk1vYmlsZUZhY2FkZVxuXHRzeXN0ZW1QZXJtaXNzaW9uSGFuZGxlciE6IFN5c3RlbVBlcm1pc3Npb25IYW5kbGVyXG5cdGludGVyV2luZG93RXZlbnRTZW5kZXIhOiBJbnRlcldpbmRvd0V2ZW50RmFjYWRlU2VuZERpc3BhdGNoZXJcblx0Y2FjaGVTdG9yYWdlITogRXhwb3NlZENhY2hlU3RvcmFnZVxuXHR3b3JrZXJGYWNhZGUhOiBXb3JrZXJGYWNhZGVcblx0bG9naW5MaXN0ZW5lciE6IFBhZ2VDb250ZXh0TG9naW5MaXN0ZW5lclxuXHRyYW5kb20hOiBXb3JrZXJSYW5kb21pemVyXG5cdGNvbm5lY3Rpdml0eU1vZGVsITogV2Vic29ja2V0Q29ubmVjdGl2aXR5TW9kZWxcblx0b3BlcmF0aW9uUHJvZ3Jlc3NUcmFja2VyITogT3BlcmF0aW9uUHJvZ3Jlc3NUcmFja2VyXG5cdGluZm9NZXNzYWdlSGFuZGxlciE6IEluZm9NZXNzYWdlSGFuZGxlclxuXHR0aGVtZUNvbnRyb2xsZXIhOiBUaGVtZUNvbnRyb2xsZXJcblx0Q29uc3QhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG5cblx0cHJpdmF0ZSBuYXRpdmVJbnRlcmZhY2VzOiBOYXRpdmVJbnRlcmZhY2VzIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBlbnRyb3B5RmFjYWRlITogRW50cm9weUZhY2FkZVxuXHRwcml2YXRlIHNxbENpcGhlckZhY2FkZSE6IFNxbENpcGhlckZhY2FkZVxuXG5cdHJlYWRvbmx5IHJlY2lwaWVudHNNb2RlbDogbGF6eUFzeW5jPFJlY2lwaWVudHNNb2RlbD4gPSBsYXp5TWVtb2l6ZWQoYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgUmVjaXBpZW50c01vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vYXBpL21haW4vUmVjaXBpZW50c01vZGVsLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBSZWNpcGllbnRzTW9kZWwodGhpcy5jb250YWN0TW9kZWwsIHRoaXMubG9naW5zLCB0aGlzLm1haWxGYWNhZGUsIHRoaXMuZW50aXR5Q2xpZW50KVxuXHR9KVxuXG5cdGFzeW5jIG5vWm9uZURhdGVQcm92aWRlcigpOiBQcm9taXNlPE5vWm9uZURhdGVQcm92aWRlcj4ge1xuXHRcdHJldHVybiBuZXcgTm9ab25lRGF0ZVByb3ZpZGVyKClcblx0fVxuXG5cdGFzeW5jIHNlbmRNYWlsTW9kZWwobWFpbGJveERldGFpbHM6IE1haWxib3hEZXRhaWwsIG1haWxib3hQcm9wZXJ0aWVzOiBNYWlsYm94UHJvcGVydGllcyk6IFByb21pc2U8U2VuZE1haWxNb2RlbD4ge1xuXHRcdGNvbnN0IGZhY3RvcnkgPSBhd2FpdCB0aGlzLnNlbmRNYWlsTW9kZWxTeW5jRmFjdG9yeShtYWlsYm94RGV0YWlscywgbWFpbGJveFByb3BlcnRpZXMpXG5cdFx0cmV0dXJuIGZhY3RvcnkoKVxuXHR9XG5cblx0cHJpdmF0ZSByZWFkb25seSByZWRyYXc6IGxhenlBc3luYzwoKSA9PiB1bmtub3duPiA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgbSA9IGF3YWl0IGltcG9ydChcIm1pdGhyaWxcIilcblx0XHRyZXR1cm4gbS5yZWRyYXdcblx0fSlcblxuXHRyZWFkb25seSBvZmZsaW5lSW5kaWNhdG9yVmlld01vZGVsID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRyZXR1cm4gbmV3IE9mZmxpbmVJbmRpY2F0b3JWaWV3TW9kZWwoXG5cdFx0XHR0aGlzLmNhY2hlU3RvcmFnZSxcblx0XHRcdHRoaXMubG9naW5MaXN0ZW5lcixcblx0XHRcdHRoaXMuY29ubmVjdGl2aXR5TW9kZWwsXG5cdFx0XHR0aGlzLmxvZ2lucyxcblx0XHRcdHRoaXMucHJvZ3Jlc3NUcmFja2VyLFxuXHRcdFx0YXdhaXQgdGhpcy5yZWRyYXcoKSxcblx0XHQpXG5cdH0pXG5cblx0YXN5bmMgYXBwSGVhZGVyQXR0cnMoKTogUHJvbWlzZTxBcHBIZWFkZXJBdHRycz4ge1xuXHRcdHJldHVybiB7XG5cdFx0XHRvZmZsaW5lSW5kaWNhdG9yTW9kZWw6IGF3YWl0IHRoaXMub2ZmbGluZUluZGljYXRvclZpZXdNb2RlbCgpLFxuXHRcdFx0bmV3c01vZGVsOiB0aGlzLm5ld3NNb2RlbCxcblx0XHR9XG5cdH1cblxuXHRhc3luYyBzZWFyY2hWaWV3TW9kZWxGYWN0b3J5KCk6IFByb21pc2U8KCkgPT4gQ2FsZW5kYXJTZWFyY2hWaWV3TW9kZWw+IHtcblx0XHRjb25zdCB7IENhbGVuZGFyU2VhcmNoVmlld01vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuL2NhbGVuZGFyL3NlYXJjaC92aWV3L0NhbGVuZGFyU2VhcmNoVmlld01vZGVsLmpzXCIpXG5cdFx0Y29uc3QgcmVkcmF3ID0gYXdhaXQgdGhpcy5yZWRyYXcoKVxuXHRcdGNvbnN0IHNlYXJjaFJvdXRlciA9IGF3YWl0IHRoaXMuc2NvcGVkU2VhcmNoUm91dGVyKClcblx0XHRjb25zdCBjYWxlbmRhckV2ZW50c1JlcG9zaXRvcnkgPSBhd2FpdCB0aGlzLmNhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeSgpXG5cdFx0cmV0dXJuICgpID0+IHtcblx0XHRcdHJldHVybiBuZXcgQ2FsZW5kYXJTZWFyY2hWaWV3TW9kZWwoXG5cdFx0XHRcdHNlYXJjaFJvdXRlcixcblx0XHRcdFx0dGhpcy5zZWFyY2gsXG5cdFx0XHRcdHRoaXMubG9naW5zLFxuXHRcdFx0XHR0aGlzLmVudGl0eUNsaWVudCxcblx0XHRcdFx0dGhpcy5ldmVudENvbnRyb2xsZXIsXG5cdFx0XHRcdHRoaXMuY2FsZW5kYXJGYWNhZGUsXG5cdFx0XHRcdHRoaXMucHJvZ3Jlc3NUcmFja2VyLFxuXHRcdFx0XHRjYWxlbmRhckV2ZW50c1JlcG9zaXRvcnksXG5cdFx0XHRcdHJlZHJhdyxcblx0XHRcdFx0ZGV2aWNlQ29uZmlnLmdldENsaWVudE9ubHlDYWxlbmRhcnMoKSxcblx0XHRcdClcblx0XHR9XG5cdH1cblxuXHRhc3luYyBjYWxlbmRhclNlYXJjaFZpZXdNb2RlbEZhY3RvcnkoKTogUHJvbWlzZTwoKSA9PiBDYWxlbmRhclNlYXJjaFZpZXdNb2RlbD4ge1xuXHRcdGNvbnN0IHsgQ2FsZW5kYXJTZWFyY2hWaWV3TW9kZWwgfSA9IGF3YWl0IGltcG9ydChcIi4vY2FsZW5kYXIvc2VhcmNoL3ZpZXcvQ2FsZW5kYXJTZWFyY2hWaWV3TW9kZWwuanNcIilcblx0XHRjb25zdCByZWRyYXcgPSBhd2FpdCB0aGlzLnJlZHJhdygpXG5cdFx0Y29uc3Qgc2VhcmNoUm91dGVyID0gYXdhaXQgdGhpcy5zY29wZWRTZWFyY2hSb3V0ZXIoKVxuXHRcdGNvbnN0IGNhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeSA9IGF3YWl0IHRoaXMuY2FsZW5kYXJFdmVudHNSZXBvc2l0b3J5KClcblx0XHRyZXR1cm4gKCkgPT4ge1xuXHRcdFx0cmV0dXJuIG5ldyBDYWxlbmRhclNlYXJjaFZpZXdNb2RlbChcblx0XHRcdFx0c2VhcmNoUm91dGVyLFxuXHRcdFx0XHR0aGlzLnNlYXJjaCxcblx0XHRcdFx0dGhpcy5sb2dpbnMsXG5cdFx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0XHR0aGlzLmV2ZW50Q29udHJvbGxlcixcblx0XHRcdFx0dGhpcy5jYWxlbmRhckZhY2FkZSxcblx0XHRcdFx0dGhpcy5wcm9ncmVzc1RyYWNrZXIsXG5cdFx0XHRcdGNhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeSxcblx0XHRcdFx0cmVkcmF3LFxuXHRcdFx0XHRkZXZpY2VDb25maWcuZ2V0Q2xpZW50T25seUNhbGVuZGFycygpLFxuXHRcdFx0KVxuXHRcdH1cblx0fVxuXG5cdHJlYWRvbmx5IHRocm90dGxlZFJvdXRlcjogbGF6eTxSb3V0ZXI+ID0gbGF6eU1lbW9pemVkKCgpID0+IG5ldyBUaHJvdHRsZWRSb3V0ZXIoKSlcblxuXHRyZWFkb25seSBzY29wZWRTZWFyY2hSb3V0ZXI6IGxhenlBc3luYzxTZWFyY2hSb3V0ZXI+ID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IFNlYXJjaFJvdXRlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL3NlYXJjaC92aWV3L1NlYXJjaFJvdXRlci5qc1wiKVxuXHRcdHJldHVybiBuZXcgU2VhcmNoUm91dGVyKG5ldyBTY29wZWRSb3V0ZXIodGhpcy50aHJvdHRsZWRSb3V0ZXIoKSwgXCIvc2VhcmNoXCIpKVxuXHR9KVxuXG5cdHJlYWRvbmx5IHVuc2NvcGVkU2VhcmNoUm91dGVyOiBsYXp5QXN5bmM8U2VhcmNoUm91dGVyPiA9IGxhenlNZW1vaXplZChhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBTZWFyY2hSb3V0ZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9zZWFyY2gvdmlldy9TZWFyY2hSb3V0ZXIuanNcIilcblx0XHRyZXR1cm4gbmV3IFNlYXJjaFJvdXRlcih0aGlzLnRocm90dGxlZFJvdXRlcigpKVxuXHR9KVxuXG5cdGFzeW5jIHJlY2VpdmVkR3JvdXBJbnZpdGF0aW9uc01vZGVsPFR5cGVPZkdyb3VwIGV4dGVuZHMgU2hhcmVhYmxlR3JvdXBUeXBlPihncm91cFR5cGU6IFR5cGVPZkdyb3VwKTogUHJvbWlzZTxSZWNlaXZlZEdyb3VwSW52aXRhdGlvbnNNb2RlbDxUeXBlT2ZHcm91cD4+IHtcblx0XHRjb25zdCB7IFJlY2VpdmVkR3JvdXBJbnZpdGF0aW9uc01vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vc2hhcmluZy9tb2RlbC9SZWNlaXZlZEdyb3VwSW52aXRhdGlvbnNNb2RlbC5qc1wiKVxuXHRcdHJldHVybiBuZXcgUmVjZWl2ZWRHcm91cEludml0YXRpb25zTW9kZWw8VHlwZU9mR3JvdXA+KGdyb3VwVHlwZSwgdGhpcy5ldmVudENvbnRyb2xsZXIsIHRoaXMuZW50aXR5Q2xpZW50LCB0aGlzLmxvZ2lucylcblx0fVxuXG5cdHJlYWRvbmx5IGNhbGVuZGFyVmlld01vZGVsID0gbGF6eU1lbW9pemVkPFByb21pc2U8Q2FsZW5kYXJWaWV3TW9kZWw+Pihhc3luYyAoKSA9PiB7XG5cdFx0Y29uc3QgeyBDYWxlbmRhclZpZXdNb2RlbCB9ID0gYXdhaXQgaW1wb3J0KFwiLi9jYWxlbmRhci92aWV3L0NhbGVuZGFyVmlld01vZGVsLmpzXCIpXG5cdFx0Y29uc3QgeyBEZWZhdWx0RGF0ZVByb3ZpZGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9DYWxlbmRhclV0aWxzXCIpXG5cdFx0Y29uc3QgdGltZVpvbmUgPSBuZXcgRGVmYXVsdERhdGVQcm92aWRlcigpLnRpbWVab25lKClcblx0XHRyZXR1cm4gbmV3IENhbGVuZGFyVmlld01vZGVsKFxuXHRcdFx0dGhpcy5sb2dpbnMsXG5cdFx0XHRhc3luYyAobW9kZTogQ2FsZW5kYXJPcGVyYXRpb24sIGV2ZW50OiBDYWxlbmRhckV2ZW50KSA9PiB7XG5cdFx0XHRcdGNvbnN0IG1haWxib3hEZXRhaWwgPSBhd2FpdCB0aGlzLm1haWxib3hNb2RlbC5nZXRVc2VyTWFpbGJveERldGFpbHMoKVxuXHRcdFx0XHRjb25zdCBtYWlsYm94UHJvcGVydGllcyA9IGF3YWl0IHRoaXMubWFpbGJveE1vZGVsLmdldE1haWxib3hQcm9wZXJ0aWVzKG1haWxib3hEZXRhaWwubWFpbGJveEdyb3VwUm9vdClcblx0XHRcdFx0cmV0dXJuIGF3YWl0IHRoaXMuY2FsZW5kYXJFdmVudE1vZGVsKG1vZGUsIGV2ZW50LCBtYWlsYm94RGV0YWlsLCBtYWlsYm94UHJvcGVydGllcywgbnVsbClcblx0XHRcdH0sXG5cdFx0XHQoLi4uYXJncykgPT4gdGhpcy5jYWxlbmRhckV2ZW50UHJldmlld01vZGVsKC4uLmFyZ3MpLFxuXHRcdFx0KC4uLmFyZ3MpID0+IHRoaXMuY2FsZW5kYXJDb250YWN0UHJldmlld01vZGVsKC4uLmFyZ3MpLFxuXHRcdFx0YXdhaXQgdGhpcy5jYWxlbmRhck1vZGVsKCksXG5cdFx0XHRhd2FpdCB0aGlzLmNhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeSgpLFxuXHRcdFx0dGhpcy5lbnRpdHlDbGllbnQsXG5cdFx0XHR0aGlzLmV2ZW50Q29udHJvbGxlcixcblx0XHRcdHRoaXMucHJvZ3Jlc3NUcmFja2VyLFxuXHRcdFx0ZGV2aWNlQ29uZmlnLFxuXHRcdFx0YXdhaXQgdGhpcy5yZWNlaXZlZEdyb3VwSW52aXRhdGlvbnNNb2RlbChHcm91cFR5cGUuQ2FsZW5kYXIpLFxuXHRcdFx0dGltZVpvbmUsXG5cdFx0XHR0aGlzLm1haWxib3hNb2RlbCxcblx0XHRcdHRoaXMuY29udGFjdE1vZGVsLFxuXHRcdClcblx0fSlcblxuXHRyZWFkb25seSBjYWxlbmRhckV2ZW50c1JlcG9zaXRvcnk6IGxhenlBc3luYzxDYWxlbmRhckV2ZW50c1JlcG9zaXRvcnk+ID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IENhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJFdmVudHNSZXBvc2l0b3J5LmpzXCIpXG5cdFx0Y29uc3QgeyBEZWZhdWx0RGF0ZVByb3ZpZGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9DYWxlbmRhclV0aWxzXCIpXG5cdFx0Y29uc3QgdGltZVpvbmUgPSBuZXcgRGVmYXVsdERhdGVQcm92aWRlcigpLnRpbWVab25lKClcblx0XHRyZXR1cm4gbmV3IENhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeShcblx0XHRcdGF3YWl0IHRoaXMuY2FsZW5kYXJNb2RlbCgpLFxuXHRcdFx0dGhpcy5jYWxlbmRhckZhY2FkZSxcblx0XHRcdHRpbWVab25lLFxuXHRcdFx0dGhpcy5lbnRpdHlDbGllbnQsXG5cdFx0XHR0aGlzLmV2ZW50Q29udHJvbGxlcixcblx0XHRcdHRoaXMuY29udGFjdE1vZGVsLFxuXHRcdFx0dGhpcy5sb2dpbnMsXG5cdFx0KVxuXHR9KVxuXG5cdC8qKiBUaGlzIHVnbHkgYml0IGV4aXN0cyBiZWNhdXNlIENhbGVuZGFyRXZlbnRXaG9Nb2RlbCB3YW50cyBhIHN5bmMgZmFjdG9yeS4gKi9cblx0cHJpdmF0ZSBhc3luYyBzZW5kTWFpbE1vZGVsU3luY0ZhY3RvcnkobWFpbGJveERldGFpbHM6IE1haWxib3hEZXRhaWwsIG1haWxib3hQcm9wZXJ0aWVzOiBNYWlsYm94UHJvcGVydGllcyk6IFByb21pc2U8KCkgPT4gU2VuZE1haWxNb2RlbD4ge1xuXHRcdGNvbnN0IHsgU2VuZE1haWxNb2RlbCB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL21haWxGdW5jdGlvbmFsaXR5L1NlbmRNYWlsTW9kZWwuanNcIilcblx0XHRjb25zdCByZWNpcGllbnRzTW9kZWwgPSBhd2FpdCB0aGlzLnJlY2lwaWVudHNNb2RlbCgpXG5cdFx0Y29uc3QgZGF0ZVByb3ZpZGVyID0gYXdhaXQgdGhpcy5ub1pvbmVEYXRlUHJvdmlkZXIoKVxuXHRcdHJldHVybiAoKSA9PlxuXHRcdFx0bmV3IFNlbmRNYWlsTW9kZWwoXG5cdFx0XHRcdHRoaXMubWFpbEZhY2FkZSxcblx0XHRcdFx0dGhpcy5lbnRpdHlDbGllbnQsXG5cdFx0XHRcdHRoaXMubG9naW5zLFxuXHRcdFx0XHR0aGlzLm1haWxib3hNb2RlbCxcblx0XHRcdFx0dGhpcy5jb250YWN0TW9kZWwsXG5cdFx0XHRcdHRoaXMuZXZlbnRDb250cm9sbGVyLFxuXHRcdFx0XHRtYWlsYm94RGV0YWlscyxcblx0XHRcdFx0cmVjaXBpZW50c01vZGVsLFxuXHRcdFx0XHRkYXRlUHJvdmlkZXIsXG5cdFx0XHRcdG1haWxib3hQcm9wZXJ0aWVzLFxuXHRcdFx0XHRhc3luYyAobWFpbDogTWFpbCkgPT4ge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0XHR9LFxuXHRcdFx0KVxuXHR9XG5cblx0YXN5bmMgY2FsZW5kYXJFdmVudE1vZGVsKFxuXHRcdGVkaXRNb2RlOiBDYWxlbmRhck9wZXJhdGlvbixcblx0XHRldmVudDogUGFydGlhbDxDYWxlbmRhckV2ZW50Pixcblx0XHRtYWlsYm94RGV0YWlsOiBNYWlsYm94RGV0YWlsLFxuXHRcdG1haWxib3hQcm9wZXJ0aWVzOiBNYWlsYm94UHJvcGVydGllcyxcblx0XHRyZXNwb25zZVRvOiBNYWlsIHwgbnVsbCxcblx0KTogUHJvbWlzZTxDYWxlbmRhckV2ZW50TW9kZWwgfCBudWxsPiB7XG5cdFx0Y29uc3QgW3sgbWFrZUNhbGVuZGFyRXZlbnRNb2RlbCB9LCB7IGdldFRpbWVab25lIH0sIHsgY2FsZW5kYXJOb3RpZmljYXRpb25TZW5kZXIgfV0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG5cdFx0XHRpbXBvcnQoXCIuL2NhbGVuZGFyL2d1aS9ldmVudGVkaXRvci1tb2RlbC9DYWxlbmRhckV2ZW50TW9kZWwuanNcIiksXG5cdFx0XHRpbXBvcnQoXCIuLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9DYWxlbmRhclV0aWxzLmpzXCIpLFxuXHRcdFx0aW1wb3J0KFwiLi9jYWxlbmRhci92aWV3L0NhbGVuZGFyTm90aWZpY2F0aW9uU2VuZGVyLmpzXCIpLFxuXHRcdF0pXG5cdFx0Y29uc3Qgc2VuZE1haWxNb2RlbEZhY3RvcnkgPSBhd2FpdCB0aGlzLnNlbmRNYWlsTW9kZWxTeW5jRmFjdG9yeShtYWlsYm94RGV0YWlsLCBtYWlsYm94UHJvcGVydGllcylcblx0XHRjb25zdCBzaG93UHJvZ3Jlc3MgPSA8VD4ocDogUHJvbWlzZTxUPikgPT4gc2hvd1Byb2dyZXNzRGlhbG9nKFwicGxlYXNlV2FpdF9tc2dcIiwgcClcblxuXHRcdHJldHVybiBhd2FpdCBtYWtlQ2FsZW5kYXJFdmVudE1vZGVsKFxuXHRcdFx0ZWRpdE1vZGUsXG5cdFx0XHRldmVudCxcblx0XHRcdGF3YWl0IHRoaXMucmVjaXBpZW50c01vZGVsKCksXG5cdFx0XHRhd2FpdCB0aGlzLmNhbGVuZGFyTW9kZWwoKSxcblx0XHRcdHRoaXMubG9naW5zLFxuXHRcdFx0bWFpbGJveERldGFpbCxcblx0XHRcdG1haWxib3hQcm9wZXJ0aWVzLFxuXHRcdFx0c2VuZE1haWxNb2RlbEZhY3RvcnksXG5cdFx0XHRjYWxlbmRhck5vdGlmaWNhdGlvblNlbmRlcixcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0cmVzcG9uc2VUbyxcblx0XHRcdGdldFRpbWVab25lKCksXG5cdFx0XHRzaG93UHJvZ3Jlc3MsXG5cdFx0KVxuXHR9XG5cblx0YXN5bmMgcmVjaXBpZW50c1NlYXJjaE1vZGVsKCk6IFByb21pc2U8UmVjaXBpZW50c1NlYXJjaE1vZGVsPiB7XG5cdFx0Y29uc3QgeyBSZWNpcGllbnRzU2VhcmNoTW9kZWwgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9taXNjL1JlY2lwaWVudHNTZWFyY2hNb2RlbC5qc1wiKVxuXHRcdGNvbnN0IHN1Z2dlc3Rpb25zUHJvdmlkZXIgPSBhd2FpdCB0aGlzLmNvbnRhY3RTdWdnZXN0aW9uUHJvdmlkZXIoKVxuXHRcdHJldHVybiBuZXcgUmVjaXBpZW50c1NlYXJjaE1vZGVsKGF3YWl0IHRoaXMucmVjaXBpZW50c01vZGVsKCksIHRoaXMuY29udGFjdE1vZGVsLCBzdWdnZXN0aW9uc1Byb3ZpZGVyLCB0aGlzLmVudGl0eUNsaWVudClcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgY29udGFjdFN1Z2dlc3Rpb25Qcm92aWRlcigpOiBQcm9taXNlPENvbnRhY3RTdWdnZXN0aW9uUHJvdmlkZXI+IHtcblx0XHRpZiAoaXNBcHAoKSkge1xuXHRcdFx0Y29uc3QgeyBNb2JpbGVDb250YWN0U3VnZ2VzdGlvblByb3ZpZGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbmF0aXZlL21haW4vTW9iaWxlQ29udGFjdFN1Z2dlc3Rpb25Qcm92aWRlci5qc1wiKVxuXHRcdFx0cmV0dXJuIG5ldyBNb2JpbGVDb250YWN0U3VnZ2VzdGlvblByb3ZpZGVyKHRoaXMubW9iaWxlQ29udGFjdHNGYWNhZGUpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGFzeW5jIGdldENvbnRhY3RTdWdnZXN0aW9ucyhfcXVlcnk6IHN0cmluZyk6IFByb21pc2U8cmVhZG9ubHkgQ29udGFjdFN1Z2dlc3Rpb25bXT4ge1xuXHRcdFx0XHRcdHJldHVybiBbXVxuXHRcdFx0XHR9LFxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGdldCBkZXZpY2VDb25maWcoKTogRGV2aWNlQ29uZmlnIHtcblx0XHRyZXR1cm4gZGV2aWNlQ29uZmlnXG5cdH1cblxuXHRnZXQgbmF0aXZlKCk6IE5hdGl2ZUludGVyZmFjZU1haW4ge1xuXHRcdHJldHVybiB0aGlzLmdldE5hdGl2ZUludGVyZmFjZShcIm5hdGl2ZVwiKVxuXHR9XG5cblx0Z2V0IGZpbGVBcHAoKTogTmF0aXZlRmlsZUFwcCB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0TmF0aXZlSW50ZXJmYWNlKFwiZmlsZUFwcFwiKVxuXHR9XG5cblx0Z2V0IHB1c2hTZXJ2aWNlKCk6IE5hdGl2ZVB1c2hTZXJ2aWNlQXBwIHtcblx0XHRyZXR1cm4gdGhpcy5nZXROYXRpdmVJbnRlcmZhY2UoXCJwdXNoU2VydmljZVwiKVxuXHR9XG5cblx0Z2V0IGNvbW1vblN5c3RlbUZhY2FkZSgpOiBDb21tb25TeXN0ZW1GYWNhZGUge1xuXHRcdHJldHVybiB0aGlzLmdldE5hdGl2ZUludGVyZmFjZShcImNvbW1vblN5c3RlbUZhY2FkZVwiKVxuXHR9XG5cblx0Z2V0IHRoZW1lRmFjYWRlKCk6IFRoZW1lRmFjYWRlIHtcblx0XHRyZXR1cm4gdGhpcy5nZXROYXRpdmVJbnRlcmZhY2UoXCJ0aGVtZUZhY2FkZVwiKVxuXHR9XG5cblx0Z2V0IGV4dGVybmFsQ2FsZW5kYXJGYWNhZGUoKTogRXh0ZXJuYWxDYWxlbmRhckZhY2FkZSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0TmF0aXZlSW50ZXJmYWNlKFwiZXh0ZXJuYWxDYWxlbmRhckZhY2FkZVwiKVxuXHR9XG5cblx0Z2V0IHN5c3RlbUZhY2FkZSgpOiBNb2JpbGVTeXN0ZW1GYWNhZGUge1xuXHRcdHJldHVybiB0aGlzLmdldE5hdGl2ZUludGVyZmFjZShcIm1vYmlsZVN5c3RlbUZhY2FkZVwiKVxuXHR9XG5cblx0Z2V0IG1vYmlsZUNvbnRhY3RzRmFjYWRlKCk6IE1vYmlsZUNvbnRhY3RzRmFjYWRlIHtcblx0XHRyZXR1cm4gdGhpcy5nZXROYXRpdmVJbnRlcmZhY2UoXCJtb2JpbGVDb250YWN0c0ZhY2FkZVwiKVxuXHR9XG5cblx0Z2V0IG5hdGl2ZUNyZWRlbnRpYWxzRmFjYWRlKCk6IE5hdGl2ZUNyZWRlbnRpYWxzRmFjYWRlIHtcblx0XHRyZXR1cm4gdGhpcy5nZXROYXRpdmVJbnRlcmZhY2UoXCJuYXRpdmVDcmVkZW50aWFsc0ZhY2FkZVwiKVxuXHR9XG5cblx0Z2V0IG1vYmlsZVBheW1lbnRzRmFjYWRlKCk6IE1vYmlsZVBheW1lbnRzRmFjYWRlIHtcblx0XHRyZXR1cm4gdGhpcy5nZXROYXRpdmVJbnRlcmZhY2UoXCJtb2JpbGVQYXltZW50c0ZhY2FkZVwiKVxuXHR9XG5cblx0YXN5bmMgbWFpbEFkZHJlc3NUYWJsZU1vZGVsRm9yT3duTWFpbGJveCgpOiBQcm9taXNlPE1haWxBZGRyZXNzVGFibGVNb2RlbD4ge1xuXHRcdGNvbnN0IHsgTWFpbEFkZHJlc3NUYWJsZU1vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vc2V0dGluZ3MvbWFpbGFkZHJlc3MvTWFpbEFkZHJlc3NUYWJsZU1vZGVsLmpzXCIpXG5cdFx0Y29uc3QgbmFtZUNoYW5nZXIgPSBhd2FpdCB0aGlzLm93bk1haWxBZGRyZXNzTmFtZUNoYW5nZXIoKVxuXHRcdHJldHVybiBuZXcgTWFpbEFkZHJlc3NUYWJsZU1vZGVsKFxuXHRcdFx0dGhpcy5lbnRpdHlDbGllbnQsXG5cdFx0XHR0aGlzLnNlcnZpY2VFeGVjdXRvcixcblx0XHRcdHRoaXMubWFpbEFkZHJlc3NGYWNhZGUsXG5cdFx0XHR0aGlzLmxvZ2lucyxcblx0XHRcdHRoaXMuZXZlbnRDb250cm9sbGVyLFxuXHRcdFx0dGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyR3JvdXBJbmZvLFxuXHRcdFx0bmFtZUNoYW5nZXIsXG5cdFx0XHRhd2FpdCB0aGlzLnJlZHJhdygpLFxuXHRcdClcblx0fVxuXG5cdGFzeW5jIG1haWxBZGRyZXNzVGFibGVNb2RlbEZvckFkbWluKG1haWxHcm91cElkOiBJZCwgdXNlcklkOiBJZCwgdXNlckdyb3VwSW5mbzogR3JvdXBJbmZvKTogUHJvbWlzZTxNYWlsQWRkcmVzc1RhYmxlTW9kZWw+IHtcblx0XHRjb25zdCB7IE1haWxBZGRyZXNzVGFibGVNb2RlbCB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL3NldHRpbmdzL21haWxhZGRyZXNzL01haWxBZGRyZXNzVGFibGVNb2RlbC5qc1wiKVxuXHRcdGNvbnN0IG5hbWVDaGFuZ2VyID0gYXdhaXQgdGhpcy5hZG1pbk5hbWVDaGFuZ2VyKG1haWxHcm91cElkLCB1c2VySWQpXG5cdFx0cmV0dXJuIG5ldyBNYWlsQWRkcmVzc1RhYmxlTW9kZWwoXG5cdFx0XHR0aGlzLmVudGl0eUNsaWVudCxcblx0XHRcdHRoaXMuc2VydmljZUV4ZWN1dG9yLFxuXHRcdFx0dGhpcy5tYWlsQWRkcmVzc0ZhY2FkZSxcblx0XHRcdHRoaXMubG9naW5zLFxuXHRcdFx0dGhpcy5ldmVudENvbnRyb2xsZXIsXG5cdFx0XHR1c2VyR3JvdXBJbmZvLFxuXHRcdFx0bmFtZUNoYW5nZXIsXG5cdFx0XHRhd2FpdCB0aGlzLnJlZHJhdygpLFxuXHRcdClcblx0fVxuXG5cdGFzeW5jIG93bk1haWxBZGRyZXNzTmFtZUNoYW5nZXIoKTogUHJvbWlzZTxNYWlsQWRkcmVzc05hbWVDaGFuZ2VyPiB7XG5cdFx0Y29uc3QgeyBPd25NYWlsQWRkcmVzc05hbWVDaGFuZ2VyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vc2V0dGluZ3MvbWFpbGFkZHJlc3MvT3duTWFpbEFkZHJlc3NOYW1lQ2hhbmdlci5qc1wiKVxuXHRcdHJldHVybiBuZXcgT3duTWFpbEFkZHJlc3NOYW1lQ2hhbmdlcih0aGlzLm1haWxib3hNb2RlbCwgdGhpcy5lbnRpdHlDbGllbnQpXG5cdH1cblxuXHRhc3luYyBhZG1pbk5hbWVDaGFuZ2VyKG1haWxHcm91cElkOiBJZCwgdXNlcklkOiBJZCk6IFByb21pc2U8TWFpbEFkZHJlc3NOYW1lQ2hhbmdlcj4ge1xuXHRcdGNvbnN0IHsgQW5vdGhlclVzZXJNYWlsQWRkcmVzc05hbWVDaGFuZ2VyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vc2V0dGluZ3MvbWFpbGFkZHJlc3MvQW5vdGhlclVzZXJNYWlsQWRkcmVzc05hbWVDaGFuZ2VyLmpzXCIpXG5cdFx0cmV0dXJuIG5ldyBBbm90aGVyVXNlck1haWxBZGRyZXNzTmFtZUNoYW5nZXIodGhpcy5tYWlsQWRkcmVzc0ZhY2FkZSwgbWFpbEdyb3VwSWQsIHVzZXJJZClcblx0fVxuXG5cdGFzeW5jIGRyYXdlckF0dHJzRmFjdG9yeSgpOiBQcm9taXNlPCgpID0+IERyYXdlck1lbnVBdHRycz4ge1xuXHRcdHJldHVybiAoKSA9PiAoe1xuXHRcdFx0bG9naW5zOiB0aGlzLmxvZ2lucyxcblx0XHRcdG5ld3NNb2RlbDogdGhpcy5uZXdzTW9kZWwsXG5cdFx0XHRkZXNrdG9wU3lzdGVtRmFjYWRlOiB0aGlzLmRlc2t0b3BTeXN0ZW1GYWNhZGUsXG5cdFx0fSlcblx0fVxuXG5cdGRvbWFpbkNvbmZpZ1Byb3ZpZGVyKCk6IERvbWFpbkNvbmZpZ1Byb3ZpZGVyIHtcblx0XHRyZXR1cm4gbmV3IERvbWFpbkNvbmZpZ1Byb3ZpZGVyKClcblx0fVxuXG5cdGFzeW5jIGNyZWRlbnRpYWxzUmVtb3ZhbEhhbmRsZXIoKTogUHJvbWlzZTxDcmVkZW50aWFsUmVtb3ZhbEhhbmRsZXI+IHtcblx0XHRjb25zdCB7IE5vb3BDcmVkZW50aWFsUmVtb3ZhbEhhbmRsZXIsIEFwcHNDcmVkZW50aWFsUmVtb3ZhbEhhbmRsZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9sb2dpbi9DcmVkZW50aWFsUmVtb3ZhbEhhbmRsZXIuanNcIilcblx0XHRyZXR1cm4gaXNCcm93c2VyKClcblx0XHRcdD8gbmV3IE5vb3BDcmVkZW50aWFsUmVtb3ZhbEhhbmRsZXIoKVxuXHRcdFx0OiBuZXcgQXBwc0NyZWRlbnRpYWxSZW1vdmFsSGFuZGxlcih0aGlzLnB1c2hTZXJ2aWNlLCB0aGlzLmNvbmZpZ0ZhY2FkZSwgYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdC8vIG5vdGhpbmcgbmVlZHMgdG8gYmUgc3BlY2lmaWNhbGx5IGRvbmUgZm9yIHRoZSBjYWxlbmRhciBhcHAgcmlnaHQgbm93LlxuXHRcdFx0XHRcdG5vT3AoKVxuXHRcdFx0ICB9KVxuXHR9XG5cblx0YXN5bmMgbG9naW5WaWV3TW9kZWxGYWN0b3J5KCk6IFByb21pc2U8bGF6eTxMb2dpblZpZXdNb2RlbD4+IHtcblx0XHRjb25zdCB7IExvZ2luVmlld01vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbG9naW4vTG9naW5WaWV3TW9kZWwuanNcIilcblx0XHRjb25zdCBjcmVkZW50aWFsc1JlbW92YWxIYW5kbGVyID0gYXdhaXQgY2FsZW5kYXJMb2NhdG9yLmNyZWRlbnRpYWxzUmVtb3ZhbEhhbmRsZXIoKVxuXHRcdGNvbnN0IHsgTW9iaWxlQXBwTG9jaywgTm9PcEFwcExvY2sgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9sb2dpbi9BcHBMb2NrLmpzXCIpXG5cdFx0Y29uc3QgYXBwTG9jayA9IGlzQXBwKClcblx0XHRcdD8gbmV3IE1vYmlsZUFwcExvY2soYXNzZXJ0Tm90TnVsbCh0aGlzLm5hdGl2ZUludGVyZmFjZXMpLm1vYmlsZVN5c3RlbUZhY2FkZSwgYXNzZXJ0Tm90TnVsbCh0aGlzLm5hdGl2ZUludGVyZmFjZXMpLm5hdGl2ZUNyZWRlbnRpYWxzRmFjYWRlKVxuXHRcdFx0OiBuZXcgTm9PcEFwcExvY2soKVxuXHRcdHJldHVybiAoKSA9PiB7XG5cdFx0XHRjb25zdCBkb21haW5Db25maWcgPSBpc0Jyb3dzZXIoKVxuXHRcdFx0XHQ/IGNhbGVuZGFyTG9jYXRvci5kb21haW5Db25maWdQcm92aWRlcigpLmdldERvbWFpbkNvbmZpZ0Zvckhvc3RuYW1lKGxvY2F0aW9uLmhvc3RuYW1lLCBsb2NhdGlvbi5wcm90b2NvbCwgbG9jYXRpb24ucG9ydClcblx0XHRcdFx0OiAvLyBpbiB0aGlzIGNhc2UsIHdlIGtub3cgdGhhdCB3ZSBoYXZlIGEgc3RhdGljVXJsIHNldCB0aGF0IHdlIG5lZWQgdG8gdXNlXG5cdFx0XHRcdCAgY2FsZW5kYXJMb2NhdG9yLmRvbWFpbkNvbmZpZ1Byb3ZpZGVyKCkuZ2V0Q3VycmVudERvbWFpbkNvbmZpZygpXG5cblx0XHRcdHJldHVybiBuZXcgTG9naW5WaWV3TW9kZWwoXG5cdFx0XHRcdGNhbGVuZGFyTG9jYXRvci5sb2dpbnMsXG5cdFx0XHRcdGNhbGVuZGFyTG9jYXRvci5jcmVkZW50aWFsc1Byb3ZpZGVyLFxuXHRcdFx0XHRjYWxlbmRhckxvY2F0b3Iuc2Vjb25kRmFjdG9ySGFuZGxlcixcblx0XHRcdFx0ZGV2aWNlQ29uZmlnLFxuXHRcdFx0XHRkb21haW5Db25maWcsXG5cdFx0XHRcdGNyZWRlbnRpYWxzUmVtb3ZhbEhhbmRsZXIsXG5cdFx0XHRcdGlzQnJvd3NlcigpID8gbnVsbCA6IHRoaXMucHVzaFNlcnZpY2UsXG5cdFx0XHRcdGFwcExvY2ssXG5cdFx0XHQpXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBnZXROYXRpdmVJbnRlcmZhY2U8VCBleHRlbmRzIGtleW9mIE5hdGl2ZUludGVyZmFjZXM+KG5hbWU6IFQpOiBOYXRpdmVJbnRlcmZhY2VzW1RdIHtcblx0XHRpZiAoIXRoaXMubmF0aXZlSW50ZXJmYWNlcykge1xuXHRcdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoYFRyaWVkIHRvIHVzZSAke25hbWV9IGluIHdlYmApXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMubmF0aXZlSW50ZXJmYWNlc1tuYW1lXVxuXHR9XG5cblx0cHJpdmF0ZSByZWFkb25seSBfd29ya2VyRGVmZXJyZWQ6IERlZmVycmVkT2JqZWN0PFdvcmtlckNsaWVudD5cblx0cHJpdmF0ZSBfZW50cm9weUNvbGxlY3RvciE6IEVudHJvcHlDb2xsZWN0b3Jcblx0cHJpdmF0ZSBfZGVmZXJyZWRJbml0aWFsaXplZDogRGVmZXJyZWRPYmplY3Q8dm9pZD4gPSBkZWZlcigpXG5cblx0Z2V0IGluaXRpYWxpemVkKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHJldHVybiB0aGlzLl9kZWZlcnJlZEluaXRpYWxpemVkLnByb21pc2Vcblx0fVxuXG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuX3dvcmtlckRlZmVycmVkID0gZGVmZXIoKVxuXHR9XG5cblx0YXN5bmMgaW5pdCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHQvLyBTcGxpdCBpbml0IGluIHR3byBzZXBhcmF0ZSBwYXJ0czogY3JlYXRpbmcgbW9kdWxlcyBhbmQgY2F1c2luZyBzaWRlIGVmZmVjdHMuXG5cdFx0Ly8gV2Ugd291bGQgbGlrZSB0byBkbyBib3RoIG9uIG5vcm1hbCBpbml0IGJ1dCBvbiBITVIgd2UganVzdCB3YW50IHRvIHJlcGxhY2UgbW9kdWxlcyB3aXRob3V0IGEgbmV3IHdvcmtlci4gSWYgd2UgY3JlYXRlIGEgbmV3XG5cdFx0Ly8gd29ya2VyIHdlIGVuZCB1cCBsb3Npbmcgc3RhdGUgb24gdGhlIHdvcmtlciBzaWRlIChpbmNsdWRpbmcgb3VyIHNlc3Npb24pLlxuXHRcdHRoaXMud29ya2VyID0gYm9vdHN0cmFwV29ya2VyKHRoaXMpXG5cdFx0YXdhaXQgdGhpcy5fY3JlYXRlSW5zdGFuY2VzKClcblx0XHR0aGlzLl9lbnRyb3B5Q29sbGVjdG9yID0gbmV3IEVudHJvcHlDb2xsZWN0b3IodGhpcy5lbnRyb3B5RmFjYWRlLCBhd2FpdCB0aGlzLnNjaGVkdWxlcigpLCB3aW5kb3cpXG5cblx0XHR0aGlzLl9lbnRyb3B5Q29sbGVjdG9yLnN0YXJ0KClcblxuXHRcdHRoaXMuX2RlZmVycmVkSW5pdGlhbGl6ZWQucmVzb2x2ZSgpXG5cdH1cblxuXHRhc3luYyBfY3JlYXRlSW5zdGFuY2VzKCkge1xuXHRcdGNvbnN0IHtcblx0XHRcdGxvZ2luRmFjYWRlLFxuXHRcdFx0Y3VzdG9tZXJGYWNhZGUsXG5cdFx0XHRnaWZ0Q2FyZEZhY2FkZSxcblx0XHRcdGdyb3VwTWFuYWdlbWVudEZhY2FkZSxcblx0XHRcdGNvbmZpZ0ZhY2FkZSxcblx0XHRcdGNhbGVuZGFyRmFjYWRlLFxuXHRcdFx0bWFpbEZhY2FkZSxcblx0XHRcdHNoYXJlRmFjYWRlLFxuXHRcdFx0Y291bnRlckZhY2FkZSxcblx0XHRcdGJvb2tpbmdGYWNhZGUsXG5cdFx0XHRtYWlsQWRkcmVzc0ZhY2FkZSxcblx0XHRcdGJsb2JGYWNhZGUsXG5cdFx0XHR1c2VyTWFuYWdlbWVudEZhY2FkZSxcblx0XHRcdHJlY292ZXJDb2RlRmFjYWRlLFxuXHRcdFx0cmVzdEludGVyZmFjZSxcblx0XHRcdHNlcnZpY2VFeGVjdXRvcixcblx0XHRcdGNyeXB0b0ZhY2FkZSxcblx0XHRcdGNhY2hlU3RvcmFnZSxcblx0XHRcdHJhbmRvbSxcblx0XHRcdGV2ZW50QnVzLFxuXHRcdFx0ZW50cm9weUZhY2FkZSxcblx0XHRcdHdvcmtlckZhY2FkZSxcblx0XHRcdHNxbENpcGhlckZhY2FkZSxcblx0XHRcdGNvbnRhY3RGYWNhZGUsXG5cdFx0fSA9IHRoaXMud29ya2VyLmdldFdvcmtlckludGVyZmFjZSgpXG5cdFx0dGhpcy5sb2dpbkZhY2FkZSA9IGxvZ2luRmFjYWRlXG5cdFx0dGhpcy5jdXN0b21lckZhY2FkZSA9IGN1c3RvbWVyRmFjYWRlXG5cdFx0dGhpcy5naWZ0Q2FyZEZhY2FkZSA9IGdpZnRDYXJkRmFjYWRlXG5cdFx0dGhpcy5ncm91cE1hbmFnZW1lbnRGYWNhZGUgPSBncm91cE1hbmFnZW1lbnRGYWNhZGVcblx0XHR0aGlzLmNvbmZpZ0ZhY2FkZSA9IGNvbmZpZ0ZhY2FkZVxuXHRcdHRoaXMuY2FsZW5kYXJGYWNhZGUgPSBjYWxlbmRhckZhY2FkZVxuXHRcdHRoaXMubWFpbEZhY2FkZSA9IG1haWxGYWNhZGVcblx0XHR0aGlzLnNoYXJlRmFjYWRlID0gc2hhcmVGYWNhZGVcblx0XHR0aGlzLmNvdW50ZXJGYWNhZGUgPSBjb3VudGVyRmFjYWRlXG5cdFx0dGhpcy5ib29raW5nRmFjYWRlID0gYm9va2luZ0ZhY2FkZVxuXHRcdHRoaXMubWFpbEFkZHJlc3NGYWNhZGUgPSBtYWlsQWRkcmVzc0ZhY2FkZVxuXHRcdHRoaXMuYmxvYkZhY2FkZSA9IGJsb2JGYWNhZGVcblx0XHR0aGlzLnVzZXJNYW5hZ2VtZW50RmFjYWRlID0gdXNlck1hbmFnZW1lbnRGYWNhZGVcblx0XHR0aGlzLnJlY292ZXJDb2RlRmFjYWRlID0gcmVjb3ZlckNvZGVGYWNhZGVcblx0XHR0aGlzLmNvbnRhY3RGYWNhZGUgPSBjb250YWN0RmFjYWRlXG5cdFx0dGhpcy5zZXJ2aWNlRXhlY3V0b3IgPSBzZXJ2aWNlRXhlY3V0b3Jcblx0XHR0aGlzLnNxbENpcGhlckZhY2FkZSA9IHNxbENpcGhlckZhY2FkZVxuXHRcdHRoaXMubG9naW5zID0gbmV3IExvZ2luQ29udHJvbGxlcihcblx0XHRcdHRoaXMubG9naW5GYWNhZGUsXG5cdFx0XHRhc3luYyAoKSA9PiB0aGlzLmxvZ2luTGlzdGVuZXIsXG5cdFx0XHQoKSA9PiB0aGlzLndvcmtlci5yZXNldCgpLFxuXHRcdClcblx0XHQvLyBTaG91bGQgYmUgY2FsbGVkIGVsc2V3aGVyZSBsYXRlciBlLmcuIGluIENvbW1vbkxvY2F0b3Jcblx0XHR0aGlzLmxvZ2lucy5pbml0KClcblx0XHR0aGlzLmV2ZW50Q29udHJvbGxlciA9IG5ldyBFdmVudENvbnRyb2xsZXIoY2FsZW5kYXJMb2NhdG9yLmxvZ2lucylcblx0XHR0aGlzLnByb2dyZXNzVHJhY2tlciA9IG5ldyBQcm9ncmVzc1RyYWNrZXIoKVxuXHRcdHRoaXMuc2VhcmNoID0gbmV3IENhbGVuZGFyU2VhcmNoTW9kZWwoKCkgPT4gdGhpcy5jYWxlbmRhckV2ZW50c1JlcG9zaXRvcnkoKSlcblx0XHR0aGlzLmVudGl0eUNsaWVudCA9IG5ldyBFbnRpdHlDbGllbnQocmVzdEludGVyZmFjZSlcblx0XHR0aGlzLmNyeXB0b0ZhY2FkZSA9IGNyeXB0b0ZhY2FkZVxuXHRcdHRoaXMuY2FjaGVTdG9yYWdlID0gY2FjaGVTdG9yYWdlXG5cdFx0dGhpcy5lbnRyb3B5RmFjYWRlID0gZW50cm9weUZhY2FkZVxuXHRcdHRoaXMud29ya2VyRmFjYWRlID0gd29ya2VyRmFjYWRlXG5cdFx0dGhpcy5jb25uZWN0aXZpdHlNb2RlbCA9IG5ldyBXZWJzb2NrZXRDb25uZWN0aXZpdHlNb2RlbChldmVudEJ1cylcblx0XHR0aGlzLm1haWxib3hNb2RlbCA9IG5ldyBNYWlsYm94TW9kZWwodGhpcy5ldmVudENvbnRyb2xsZXIsIHRoaXMuZW50aXR5Q2xpZW50LCB0aGlzLmxvZ2lucylcblx0XHR0aGlzLm9wZXJhdGlvblByb2dyZXNzVHJhY2tlciA9IG5ldyBPcGVyYXRpb25Qcm9ncmVzc1RyYWNrZXIoKVxuXHRcdHRoaXMuaW5mb01lc3NhZ2VIYW5kbGVyID0gbmV3IEluZm9NZXNzYWdlSGFuZGxlcigoc3RhdGU6IFNlYXJjaEluZGV4U3RhdGVJbmZvKSA9PiB7XG5cdFx0XHQvLyBjYWxlbmRhciBkb2VzIG5vdCBoYXZlIGluZGV4LCBzbyBub3RoaW5nIG5lZWRzIHRvIGJlIGhhbmRsZWQgaGVyZVxuXHRcdFx0bm9PcCgpXG5cdFx0fSlcblxuXHRcdHRoaXMudXNhZ2VUZXN0TW9kZWwgPSBuZXcgVXNhZ2VUZXN0TW9kZWwoXG5cdFx0XHR7XG5cdFx0XHRcdFtTdG9yYWdlQmVoYXZpb3IuUGVyc2lzdF06IGRldmljZUNvbmZpZyxcblx0XHRcdFx0W1N0b3JhZ2VCZWhhdmlvci5FcGhlbWVyYWxdOiBuZXcgRXBoZW1lcmFsVXNhZ2VUZXN0U3RvcmFnZSgpLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0bm93KCk6IG51bWJlciB7XG5cdFx0XHRcdFx0cmV0dXJuIERhdGUubm93KClcblx0XHRcdFx0fSxcblx0XHRcdFx0dGltZVpvbmUoKTogc3RyaW5nIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgYnkgdGhpcyBwcm92aWRlclwiKVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHRoaXMuc2VydmljZUV4ZWN1dG9yLFxuXHRcdFx0dGhpcy5lbnRpdHlDbGllbnQsXG5cdFx0XHR0aGlzLmxvZ2lucyxcblx0XHRcdHRoaXMuZXZlbnRDb250cm9sbGVyLFxuXHRcdFx0KCkgPT4gdGhpcy51c2FnZVRlc3RDb250cm9sbGVyLFxuXHRcdClcblx0XHR0aGlzLnVzYWdlVGVzdENvbnRyb2xsZXIgPSBuZXcgVXNhZ2VUZXN0Q29udHJvbGxlcih0aGlzLnVzYWdlVGVzdE1vZGVsKVxuXG5cdFx0dGhpcy5Db25zdCA9IENvbnN0XG5cdFx0aWYgKCFpc0Jyb3dzZXIoKSkge1xuXHRcdFx0Y29uc3QgeyBXZWJEZXNrdG9wRmFjYWRlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbmF0aXZlL21haW4vV2ViRGVza3RvcEZhY2FkZVwiKVxuXHRcdFx0Y29uc3QgeyBXZWJNb2JpbGVGYWNhZGUgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9uYXRpdmUvbWFpbi9XZWJNb2JpbGVGYWNhZGUuanNcIilcblx0XHRcdGNvbnN0IHsgV2ViQ29tbW9uTmF0aXZlRmFjYWRlIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbmF0aXZlL21haW4vV2ViQ29tbW9uTmF0aXZlRmFjYWRlLmpzXCIpXG5cdFx0XHRjb25zdCB7IFdlYkludGVyV2luZG93RXZlbnRGYWNhZGUgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9uYXRpdmUvbWFpbi9XZWJJbnRlcldpbmRvd0V2ZW50RmFjYWRlLmpzXCIpXG5cdFx0XHRjb25zdCB7IFdlYkF1dGhuRmFjYWRlU2VuZERpc3BhdGNoZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9uYXRpdmUvY29tbW9uL2dlbmVyYXRlZGlwYy9XZWJBdXRobkZhY2FkZVNlbmREaXNwYXRjaGVyLmpzXCIpXG5cdFx0XHRjb25zdCB7IGNyZWF0ZU5hdGl2ZUludGVyZmFjZXMsIGNyZWF0ZURlc2t0b3BJbnRlcmZhY2VzIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbmF0aXZlL21haW4vTmF0aXZlSW50ZXJmYWNlRmFjdG9yeS5qc1wiKVxuXHRcdFx0Y29uc3QgeyBPcGVuQ2FsZW5kYXJIYW5kbGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbmF0aXZlL21haW4vT3BlbkNhbGVuZGFySGFuZGxlci5qc1wiKVxuXHRcdFx0Y29uc3Qgb3BlbkNhbGVuZGFySGFuZGxlciA9IG5ldyBPcGVuQ2FsZW5kYXJIYW5kbGVyKHRoaXMubG9naW5zKVxuXHRcdFx0Y29uc3QgeyBPcGVuU2V0dGluZ3NIYW5kbGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbmF0aXZlL21haW4vT3BlblNldHRpbmdzSGFuZGxlci5qc1wiKVxuXHRcdFx0Y29uc3Qgb3BlblNldHRpbmdzSGFuZGxlciA9IG5ldyBPcGVuU2V0dGluZ3NIYW5kbGVyKHRoaXMubG9naW5zKVxuXG5cdFx0XHR0aGlzLndlYk1vYmlsZUZhY2FkZSA9IG5ldyBXZWJNb2JpbGVGYWNhZGUodGhpcy5jb25uZWN0aXZpdHlNb2RlbCwgQ0FMRU5EQVJfUFJFRklYKVxuXHRcdFx0dGhpcy5uYXRpdmVJbnRlcmZhY2VzID0gY3JlYXRlTmF0aXZlSW50ZXJmYWNlcyhcblx0XHRcdFx0dGhpcy53ZWJNb2JpbGVGYWNhZGUsXG5cdFx0XHRcdG5ldyBXZWJEZXNrdG9wRmFjYWRlKHRoaXMubG9naW5zLCBhc3luYyAoKSA9PiB0aGlzLm5hdGl2ZSksXG5cdFx0XHRcdG5ldyBXZWJJbnRlcldpbmRvd0V2ZW50RmFjYWRlKHRoaXMubG9naW5zLCB3aW5kb3dGYWNhZGUsIGRldmljZUNvbmZpZyksXG5cdFx0XHRcdG5ldyBXZWJDb21tb25OYXRpdmVGYWNhZGUoXG5cdFx0XHRcdFx0dGhpcy5sb2dpbnMsXG5cdFx0XHRcdFx0dGhpcy5tYWlsYm94TW9kZWwsXG5cdFx0XHRcdFx0dGhpcy51c2FnZVRlc3RDb250cm9sbGVyLFxuXHRcdFx0XHRcdGFzeW5jICgpID0+IHRoaXMuZmlsZUFwcCxcblx0XHRcdFx0XHRhc3luYyAoKSA9PiB0aGlzLnB1c2hTZXJ2aWNlLFxuXHRcdFx0XHRcdHRoaXMuaGFuZGxlRmlsZUltcG9ydC5iaW5kKHRoaXMpLFxuXHRcdFx0XHRcdGFzeW5jIChfdXNlcklkOiBzdHJpbmcsIF9hZGRyZXNzOiBzdHJpbmcsIF9yZXF1ZXN0ZWRQYXRoOiBzdHJpbmcgfCBudWxsKSA9PiB7fSxcblx0XHRcdFx0XHQodXNlcklkKSA9PiBvcGVuQ2FsZW5kYXJIYW5kbGVyLm9wZW5DYWxlbmRhcih1c2VySWQpLFxuXHRcdFx0XHRcdEFwcFR5cGUuQ2FsZW5kYXIsXG5cdFx0XHRcdFx0KHBhdGgpID0+IG9wZW5TZXR0aW5nc0hhbmRsZXIub3BlblNldHRpbmdzKHBhdGgpLFxuXHRcdFx0XHQpLFxuXHRcdFx0XHRjcnlwdG9GYWNhZGUsXG5cdFx0XHRcdGNhbGVuZGFyRmFjYWRlLFxuXHRcdFx0XHR0aGlzLmVudGl0eUNsaWVudCxcblx0XHRcdFx0dGhpcy5sb2dpbnMsXG5cdFx0XHRcdEFwcFR5cGUuQ2FsZW5kYXIsXG5cdFx0XHQpXG5cblx0XHRcdGlmIChpc0VsZWN0cm9uQ2xpZW50KCkpIHtcblx0XHRcdFx0Y29uc3QgZGVza3RvcEludGVyZmFjZXMgPSBjcmVhdGVEZXNrdG9wSW50ZXJmYWNlcyh0aGlzLm5hdGl2ZSlcblx0XHRcdFx0dGhpcy5zZWFyY2hUZXh0RmFjYWRlID0gZGVza3RvcEludGVyZmFjZXMuc2VhcmNoVGV4dEZhY2FkZVxuXHRcdFx0XHR0aGlzLmludGVyV2luZG93RXZlbnRTZW5kZXIgPSBkZXNrdG9wSW50ZXJmYWNlcy5pbnRlcldpbmRvd0V2ZW50U2VuZGVyXG5cdFx0XHRcdHRoaXMud2ViQXV0aG4gPSBuZXcgV2ViYXV0aG5DbGllbnQobmV3IFdlYkF1dGhuRmFjYWRlU2VuZERpc3BhdGNoZXIodGhpcy5uYXRpdmUpLCB0aGlzLmRvbWFpbkNvbmZpZ1Byb3ZpZGVyKCksIGlzQXBwKCkpXG5cdFx0XHRcdGlmIChpc0Rlc2t0b3AoKSkge1xuXHRcdFx0XHRcdHRoaXMuZGVza3RvcFNldHRpbmdzRmFjYWRlID0gZGVza3RvcEludGVyZmFjZXMuZGVza3RvcFNldHRpbmdzRmFjYWRlXG5cdFx0XHRcdFx0dGhpcy5kZXNrdG9wU3lzdGVtRmFjYWRlID0gZGVza3RvcEludGVyZmFjZXMuZGVza3RvcFN5c3RlbUZhY2FkZVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGlzQW5kcm9pZEFwcCgpIHx8IGlzSU9TQXBwKCkpIHtcblx0XHRcdFx0Y29uc3QgeyBTeXN0ZW1QZXJtaXNzaW9uSGFuZGxlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL25hdGl2ZS9tYWluL1N5c3RlbVBlcm1pc3Npb25IYW5kbGVyLmpzXCIpXG5cdFx0XHRcdHRoaXMuc3lzdGVtUGVybWlzc2lvbkhhbmRsZXIgPSBuZXcgU3lzdGVtUGVybWlzc2lvbkhhbmRsZXIodGhpcy5zeXN0ZW1GYWNhZGUpXG5cdFx0XHRcdHRoaXMud2ViQXV0aG4gPSBuZXcgV2ViYXV0aG5DbGllbnQobmV3IFdlYkF1dGhuRmFjYWRlU2VuZERpc3BhdGNoZXIodGhpcy5uYXRpdmUpLCB0aGlzLmRvbWFpbkNvbmZpZ1Byb3ZpZGVyKCksIGlzQXBwKCkpXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMud2ViQXV0aG4gPT0gbnVsbCkge1xuXHRcdFx0dGhpcy53ZWJBdXRobiA9IG5ldyBXZWJhdXRobkNsaWVudChcblx0XHRcdFx0bmV3IEJyb3dzZXJXZWJhdXRobihuYXZpZ2F0b3IuY3JlZGVudGlhbHMsIHRoaXMuZG9tYWluQ29uZmlnUHJvdmlkZXIoKS5nZXRDdXJyZW50RG9tYWluQ29uZmlnKCkpLFxuXHRcdFx0XHR0aGlzLmRvbWFpbkNvbmZpZ1Byb3ZpZGVyKCksXG5cdFx0XHRcdGlzQXBwKCksXG5cdFx0XHQpXG5cdFx0fVxuXHRcdHRoaXMuc2Vjb25kRmFjdG9ySGFuZGxlciA9IG5ldyBTZWNvbmRGYWN0b3JIYW5kbGVyKFxuXHRcdFx0dGhpcy5ldmVudENvbnRyb2xsZXIsXG5cdFx0XHR0aGlzLmVudGl0eUNsaWVudCxcblx0XHRcdHRoaXMud2ViQXV0aG4sXG5cdFx0XHR0aGlzLmxvZ2luRmFjYWRlLFxuXHRcdFx0dGhpcy5kb21haW5Db25maWdQcm92aWRlcigpLFxuXHRcdClcblx0XHR0aGlzLmNyZWRlbnRpYWxzUHJvdmlkZXIgPSBhd2FpdCB0aGlzLmNyZWF0ZUNyZWRlbnRpYWxzUHJvdmlkZXIoKVxuXHRcdHRoaXMubG9naW5MaXN0ZW5lciA9IG5ldyBQYWdlQ29udGV4dExvZ2luTGlzdGVuZXIodGhpcy5zZWNvbmRGYWN0b3JIYW5kbGVyLCB0aGlzLmNyZWRlbnRpYWxzUHJvdmlkZXIpXG5cdFx0dGhpcy5yYW5kb20gPSByYW5kb21cblxuXHRcdHRoaXMubmV3c01vZGVsID0gbmV3IE5ld3NNb2RlbCh0aGlzLnNlcnZpY2VFeGVjdXRvciwgZGV2aWNlQ29uZmlnLCBhc3luYyAobmFtZTogc3RyaW5nKSA9PiB7XG5cdFx0XHRzd2l0Y2ggKG5hbWUpIHtcblx0XHRcdFx0Y2FzZSBcInVzYWdlT3B0SW5cIjoge1xuXHRcdFx0XHRcdGNvbnN0IHsgVXNhZ2VPcHRJbk5ld3MgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9taXNjL25ld3MvaXRlbXMvVXNhZ2VPcHRJbk5ld3MuanNcIilcblx0XHRcdFx0XHRyZXR1cm4gbmV3IFVzYWdlT3B0SW5OZXdzKHRoaXMubmV3c01vZGVsLCB0aGlzLnVzYWdlVGVzdE1vZGVsKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGNhc2UgXCJyZWNvdmVyeUNvZGVcIjoge1xuXHRcdFx0XHRcdGNvbnN0IHsgUmVjb3ZlcnlDb2RlTmV3cyB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL21pc2MvbmV3cy9pdGVtcy9SZWNvdmVyeUNvZGVOZXdzLmpzXCIpXG5cdFx0XHRcdFx0cmV0dXJuIG5ldyBSZWNvdmVyeUNvZGVOZXdzKHRoaXMubmV3c01vZGVsLCB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLCB0aGlzLnJlY292ZXJDb2RlRmFjYWRlKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGNhc2UgXCJwaW5CaW9tZXRyaWNzXCI6IHtcblx0XHRcdFx0XHRjb25zdCB7IFBpbkJpb21ldHJpY3NOZXdzIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbWlzYy9uZXdzL2l0ZW1zL1BpbkJpb21ldHJpY3NOZXdzLmpzXCIpXG5cdFx0XHRcdFx0cmV0dXJuIG5ldyBQaW5CaW9tZXRyaWNzTmV3cyh0aGlzLm5ld3NNb2RlbCwgdGhpcy5jcmVkZW50aWFsc1Byb3ZpZGVyLCB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJJZClcblx0XHRcdFx0fVxuXHRcdFx0XHRjYXNlIFwicmVmZXJyYWxMaW5rXCI6IHtcblx0XHRcdFx0XHRjb25zdCB7IFJlZmVycmFsTGlua05ld3MgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9taXNjL25ld3MvaXRlbXMvUmVmZXJyYWxMaW5rTmV3cy5qc1wiKVxuXHRcdFx0XHRcdGNvbnN0IGRhdGVQcm92aWRlciA9IGF3YWl0IHRoaXMubm9ab25lRGF0ZVByb3ZpZGVyKClcblx0XHRcdFx0XHRyZXR1cm4gbmV3IFJlZmVycmFsTGlua05ld3ModGhpcy5uZXdzTW9kZWwsIGRhdGVQcm92aWRlciwgdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKSlcblx0XHRcdFx0fVxuXHRcdFx0XHRjYXNlIFwibmV3UGxhbnNcIjoge1xuXHRcdFx0XHRcdGNvbnN0IHsgTmV3UGxhbnNOZXdzIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbWlzYy9uZXdzL2l0ZW1zL05ld1BsYW5zTmV3cy5qc1wiKVxuXHRcdFx0XHRcdHJldHVybiBuZXcgTmV3UGxhbnNOZXdzKHRoaXMubmV3c01vZGVsLCB0aGlzLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGNhc2UgXCJuZXdQbGFuc09mZmVyRW5kaW5nXCI6IHtcblx0XHRcdFx0XHRjb25zdCB7IE5ld1BsYW5zT2ZmZXJFbmRpbmdOZXdzIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vbWlzYy9uZXdzL2l0ZW1zL05ld1BsYW5zT2ZmZXJFbmRpbmdOZXdzLmpzXCIpXG5cdFx0XHRcdFx0cmV0dXJuIG5ldyBOZXdQbGFuc09mZmVyRW5kaW5nTmV3cyh0aGlzLm5ld3NNb2RlbCwgdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKSlcblx0XHRcdFx0fVxuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGBObyBpbXBsZW1lbnRhdGlvbiBmb3IgbmV3cyBuYW1lZCAnJHtuYW1lfSdgKVxuXHRcdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHR9XG5cdFx0fSlcblxuXHRcdHRoaXMuZmlsZUNvbnRyb2xsZXIgPVxuXHRcdFx0dGhpcy5uYXRpdmVJbnRlcmZhY2VzID09IG51bGxcblx0XHRcdFx0PyBuZXcgRmlsZUNvbnRyb2xsZXJCcm93c2VyKGJsb2JGYWNhZGUsIGd1aURvd25sb2FkKVxuXHRcdFx0XHQ6IG5ldyBGaWxlQ29udHJvbGxlck5hdGl2ZShibG9iRmFjYWRlLCBndWlEb3dubG9hZCwgdGhpcy5uYXRpdmVJbnRlcmZhY2VzLmZpbGVBcHApXG5cblx0XHRjb25zdCB7IENvbnRhY3RNb2RlbCB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL2NvbnRhY3RzRnVuY3Rpb25hbGl0eS9Db250YWN0TW9kZWwuanNcIilcblx0XHR0aGlzLmNvbnRhY3RNb2RlbCA9IG5ldyBDb250YWN0TW9kZWwodGhpcy5lbnRpdHlDbGllbnQsIHRoaXMubG9naW5zLCB0aGlzLmV2ZW50Q29udHJvbGxlciwgKCkgPT4ge1xuXHRcdFx0dGhyb3cgbmV3IERiRXJyb3IoXCJDYWxlbmRhciBjYW5ub3Qgc2VhcmNoIGZvciBjb250YWN0cyB0aHJvdWdoIGRiXCIpXG5cdFx0fSlcblxuXHRcdC8vIFRIRU1FXG5cdFx0Ly8gV2UgbmVlZCBpdCBiZWNhdXNlIHdlIHdhbnQgdG8gcnVuIHRlc3RzIGluIG5vZGUgYW5kIHJlYWwgSFRNTFNhbml0aXplciBkb2VzIG5vdCB3b3JrIHRoZXJlLlxuXHRcdGNvbnN0IHNhbml0aXplclN0dWI6IFBhcnRpYWw8SHRtbFNhbml0aXplcj4gPSB7XG5cdFx0XHRzYW5pdGl6ZUhUTUw6ICgpID0+IHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRodG1sOiBcIlwiLFxuXHRcdFx0XHRcdGJsb2NrZWRFeHRlcm5hbENvbnRlbnQ6IDAsXG5cdFx0XHRcdFx0aW5saW5lSW1hZ2VDaWRzOiBbXSxcblx0XHRcdFx0XHRsaW5rczogW10sXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRzYW5pdGl6ZVNWRyhzdmcsIGNvbmZpZ0V4dHJhPykge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJzdHViIVwiKVxuXHRcdFx0fSxcblx0XHRcdHNhbml0aXplRnJhZ21lbnQoaHRtbCwgY29uZmlnRXh0cmE/KSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcInN0dWIhXCIpXG5cdFx0XHR9LFxuXHRcdH1cblx0XHRjb25zdCBzZWxlY3RlZFRoZW1lRmFjYWRlID1cblx0XHRcdGlzQXBwKCkgfHwgaXNEZXNrdG9wKClcblx0XHRcdFx0PyBuZXcgTmF0aXZlVGhlbWVGYWNhZGUobmV3IExhenlMb2FkZWQ8VGhlbWVGYWNhZGU+KGFzeW5jICgpID0+IGNhbGVuZGFyTG9jYXRvci50aGVtZUZhY2FkZSkpXG5cdFx0XHRcdDogbmV3IFdlYlRoZW1lRmFjYWRlKGRldmljZUNvbmZpZylcblx0XHRjb25zdCBsYXp5U2FuaXRpemVyID0gaXNUZXN0KClcblx0XHRcdD8gKCkgPT4gUHJvbWlzZS5yZXNvbHZlKHNhbml0aXplclN0dWIgYXMgSHRtbFNhbml0aXplcilcblx0XHRcdDogKCkgPT4gaW1wb3J0KFwiLi4vY29tbW9uL21pc2MvSHRtbFNhbml0aXplclwiKS50aGVuKCh7IGh0bWxTYW5pdGl6ZXIgfSkgPT4gaHRtbFNhbml0aXplcilcblxuXHRcdHRoaXMudGhlbWVDb250cm9sbGVyID0gbmV3IFRoZW1lQ29udHJvbGxlcih0aGVtZSwgc2VsZWN0ZWRUaGVtZUZhY2FkZSwgbGF6eVNhbml0aXplciwgQXBwVHlwZS5DYWxlbmRhcilcblxuXHRcdC8vIEZvciBuYXRpdmUgdGFyZ2V0cyBXZWJDb21tb25OYXRpdmVGYWNhZGUgbm90aWZpZXMgdGhlbWVDb250cm9sbGVyIGJlY2F1c2UgQW5kcm9pZCBhbmQgRGVza3RvcCBkbyBub3Qgc2VlbSB0byB3b3JrIHJlbGlhYmx5IHZpYSBtZWRpYSBxdWVyaWVzXG5cdFx0aWYgKHNlbGVjdGVkVGhlbWVGYWNhZGUgaW5zdGFuY2VvZiBXZWJUaGVtZUZhY2FkZSkge1xuXHRcdFx0c2VsZWN0ZWRUaGVtZUZhY2FkZS5hZGREYXJrTGlzdGVuZXIoKCkgPT4gY2FsZW5kYXJMb2NhdG9yLnRoZW1lQ29udHJvbGxlci5yZWxvYWRUaGVtZSgpKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgaGFuZGxlRmlsZUltcG9ydChmaWxlc1VyaXM6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPikge1xuXHRcdGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy5maWxlQXBwLmdldEZpbGVzTWV0YURhdGEoZmlsZXNVcmlzKVxuXHRcdGNvbnN0IGFyZUFsbElDU0ZpbGVzID0gZmlsZXMuZXZlcnkoKGZpbGUpID0+IGZpbGUubWltZVR5cGUgPT09IENBTEVOREFSX01JTUVfVFlQRSlcblx0XHRpZiAoYXJlQWxsSUNTRmlsZXMpIHtcblx0XHRcdGNvbnN0IHsgaW1wb3J0Q2FsZW5kYXJGaWxlLCBwYXJzZUNhbGVuZGFyRmlsZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL2NhbGVuZGFyL2ltcG9ydC9DYWxlbmRhckltcG9ydGVyLmpzXCIpXG5cblx0XHRcdGxldCBwYXJzZWRFdmVudHM6IFBhcnNlZEV2ZW50W10gPSBbXVxuXHRcdFx0Zm9yIChjb25zdCBmaWxlUmVmIG9mIGZpbGVzKSB7XG5cdFx0XHRcdGNvbnN0IGRhdGFGaWxlID0gYXdhaXQgdGhpcy5maWxlQXBwLnJlYWREYXRhRmlsZShmaWxlUmVmLmxvY2F0aW9uKVxuXHRcdFx0XHRpZiAoZGF0YUZpbGUgPT0gbnVsbCkgY29udGludWVcblxuXHRcdFx0XHRjb25zdCBkYXRhID0gcGFyc2VDYWxlbmRhckZpbGUoZGF0YUZpbGUpXG5cdFx0XHRcdHBhcnNlZEV2ZW50cy5wdXNoKC4uLmRhdGEuY29udGVudHMpXG5cdFx0XHR9XG5cblx0XHRcdGF3YWl0IGltcG9ydENhbGVuZGFyRmlsZShhd2FpdCB0aGlzLmNhbGVuZGFyTW9kZWwoKSwgdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKSwgcGFyc2VkRXZlbnRzKVxuXHRcdH1cblx0fVxuXG5cdHJlYWRvbmx5IGNhbGVuZGFyTW9kZWw6ICgpID0+IFByb21pc2U8Q2FsZW5kYXJNb2RlbD4gPSBsYXp5TWVtb2l6ZWQoYXN5bmMgKCkgPT4ge1xuXHRcdGNvbnN0IHsgRGVmYXVsdERhdGVQcm92aWRlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlsc1wiKVxuXHRcdGNvbnN0IHsgQ2FsZW5kYXJNb2RlbCB9ID0gYXdhaXQgaW1wb3J0KFwiLi9jYWxlbmRhci9tb2RlbC9DYWxlbmRhck1vZGVsXCIpXG5cdFx0Y29uc3QgdGltZVpvbmUgPSBuZXcgRGVmYXVsdERhdGVQcm92aWRlcigpLnRpbWVab25lKClcblx0XHRyZXR1cm4gbmV3IENhbGVuZGFyTW9kZWwoXG5cdFx0XHRub3RpZmljYXRpb25zLFxuXHRcdFx0dGhpcy5hbGFybVNjaGVkdWxlcixcblx0XHRcdHRoaXMuZXZlbnRDb250cm9sbGVyLFxuXHRcdFx0dGhpcy5zZXJ2aWNlRXhlY3V0b3IsXG5cdFx0XHR0aGlzLmxvZ2lucyxcblx0XHRcdHRoaXMucHJvZ3Jlc3NUcmFja2VyLFxuXHRcdFx0dGhpcy5lbnRpdHlDbGllbnQsXG5cdFx0XHR0aGlzLm1haWxib3hNb2RlbCxcblx0XHRcdHRoaXMuY2FsZW5kYXJGYWNhZGUsXG5cdFx0XHR0aGlzLmZpbGVDb250cm9sbGVyLFxuXHRcdFx0dGltZVpvbmUsXG5cdFx0XHQhaXNCcm93c2VyKCkgPyB0aGlzLmV4dGVybmFsQ2FsZW5kYXJGYWNhZGUgOiBudWxsLFxuXHRcdFx0ZGV2aWNlQ29uZmlnLFxuXHRcdFx0IWlzQnJvd3NlcigpID8gdGhpcy5wdXNoU2VydmljZSA6IG51bGwsXG5cdFx0KVxuXHR9KVxuXG5cdHJlYWRvbmx5IGNhbGVuZGFySW52aXRlSGFuZGxlcjogKCkgPT4gUHJvbWlzZTxDYWxlbmRhckludml0ZUhhbmRsZXI+ID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IENhbGVuZGFySW52aXRlSGFuZGxlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi9jYWxlbmRhci92aWV3L0NhbGVuZGFySW52aXRlcy5qc1wiKVxuXHRcdGNvbnN0IHsgY2FsZW5kYXJOb3RpZmljYXRpb25TZW5kZXIgfSA9IGF3YWl0IGltcG9ydChcIi4vY2FsZW5kYXIvdmlldy9DYWxlbmRhck5vdGlmaWNhdGlvblNlbmRlci5qc1wiKVxuXHRcdHJldHVybiBuZXcgQ2FsZW5kYXJJbnZpdGVIYW5kbGVyKHRoaXMubWFpbGJveE1vZGVsLCBhd2FpdCB0aGlzLmNhbGVuZGFyTW9kZWwoKSwgdGhpcy5sb2dpbnMsIGNhbGVuZGFyTm90aWZpY2F0aW9uU2VuZGVyLCAoLi4uYXJnKSA9PlxuXHRcdFx0dGhpcy5zZW5kTWFpbE1vZGVsKC4uLmFyZyksXG5cdFx0KVxuXHR9KVxuXG5cdHByaXZhdGUgYWxhcm1TY2hlZHVsZXI6ICgpID0+IFByb21pc2U8QWxhcm1TY2hlZHVsZXI+ID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IEFsYXJtU2NoZWR1bGVyIH0gPSBhd2FpdCBpbXBvcnQoXCIuLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9BbGFybVNjaGVkdWxlclwiKVxuXHRcdGNvbnN0IHsgRGVmYXVsdERhdGVQcm92aWRlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL2NhbGVuZGFyL2RhdGUvQ2FsZW5kYXJVdGlsc1wiKVxuXHRcdGNvbnN0IGRhdGVQcm92aWRlciA9IG5ldyBEZWZhdWx0RGF0ZVByb3ZpZGVyKClcblx0XHRyZXR1cm4gbmV3IEFsYXJtU2NoZWR1bGVyKGRhdGVQcm92aWRlciwgYXdhaXQgdGhpcy5zY2hlZHVsZXIoKSlcblx0fSlcblxuXHRwcml2YXRlIGFzeW5jIHNjaGVkdWxlcigpOiBQcm9taXNlPFNjaGVkdWxlckltcGw+IHtcblx0XHRjb25zdCBkYXRlUHJvdmlkZXIgPSBhd2FpdCB0aGlzLm5vWm9uZURhdGVQcm92aWRlcigpXG5cdFx0cmV0dXJuIG5ldyBTY2hlZHVsZXJJbXBsKGRhdGVQcm92aWRlciwgd2luZG93LCB3aW5kb3cpXG5cdH1cblxuXHRhc3luYyBjYWxlbmRhckV2ZW50UHJldmlld01vZGVsKHNlbGVjdGVkRXZlbnQ6IENhbGVuZGFyRXZlbnQsIGNhbGVuZGFyczogUmVhZG9ubHlNYXA8c3RyaW5nLCBDYWxlbmRhckluZm8+KTogUHJvbWlzZTxDYWxlbmRhckV2ZW50UHJldmlld1ZpZXdNb2RlbD4ge1xuXHRcdGNvbnN0IHsgZmluZEF0dGVuZGVlSW5BZGRyZXNzZXMgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0NvbW1vbkNhbGVuZGFyVXRpbHMuanNcIilcblx0XHRjb25zdCB7IGdldEV2ZW50VHlwZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi9jYWxlbmRhci9ndWkvQ2FsZW5kYXJHdWlVdGlscy5qc1wiKVxuXHRcdGNvbnN0IHsgQ2FsZW5kYXJFdmVudFByZXZpZXdWaWV3TW9kZWwgfSA9IGF3YWl0IGltcG9ydChcIi4vY2FsZW5kYXIvZ3VpL2V2ZW50cG9wdXAvQ2FsZW5kYXJFdmVudFByZXZpZXdWaWV3TW9kZWwuanNcIilcblxuXHRcdGNvbnN0IG1haWxib3hEZXRhaWxzID0gYXdhaXQgdGhpcy5tYWlsYm94TW9kZWwuZ2V0VXNlck1haWxib3hEZXRhaWxzKClcblxuXHRcdGNvbnN0IG1haWxib3hQcm9wZXJ0aWVzID0gYXdhaXQgdGhpcy5tYWlsYm94TW9kZWwuZ2V0TWFpbGJveFByb3BlcnRpZXMobWFpbGJveERldGFpbHMubWFpbGJveEdyb3VwUm9vdClcblxuXHRcdGNvbnN0IHVzZXJDb250cm9sbGVyID0gdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKVxuXHRcdGNvbnN0IGN1c3RvbWVyID0gYXdhaXQgdXNlckNvbnRyb2xsZXIubG9hZEN1c3RvbWVyKClcblx0XHRjb25zdCBvd25NYWlsQWRkcmVzc2VzID0gZ2V0RW5hYmxlZE1haWxBZGRyZXNzZXNXaXRoVXNlcihtYWlsYm94RGV0YWlscywgdXNlckNvbnRyb2xsZXIudXNlckdyb3VwSW5mbylcblx0XHRjb25zdCBvd25BdHRlbmRlZTogQ2FsZW5kYXJFdmVudEF0dGVuZGVlIHwgbnVsbCA9IGZpbmRBdHRlbmRlZUluQWRkcmVzc2VzKHNlbGVjdGVkRXZlbnQuYXR0ZW5kZWVzLCBvd25NYWlsQWRkcmVzc2VzKVxuXHRcdGNvbnN0IGV2ZW50VHlwZSA9IGdldEV2ZW50VHlwZShzZWxlY3RlZEV2ZW50LCBjYWxlbmRhcnMsIG93bk1haWxBZGRyZXNzZXMsIHVzZXJDb250cm9sbGVyKVxuXHRcdGNvbnN0IGhhc0J1c2luZXNzRmVhdHVyZSA9IGlzQ3VzdG9taXphdGlvbkVuYWJsZWRGb3JDdXN0b21lcihjdXN0b21lciwgRmVhdHVyZVR5cGUuQnVzaW5lc3NGZWF0dXJlRW5hYmxlZCkgfHwgKGF3YWl0IHVzZXJDb250cm9sbGVyLmlzTmV3UGFpZFBsYW4oKSlcblx0XHRjb25zdCBsYXp5SW5kZXhFbnRyeSA9IGFzeW5jICgpID0+IChzZWxlY3RlZEV2ZW50LnVpZCAhPSBudWxsID8gdGhpcy5jYWxlbmRhckZhY2FkZS5nZXRFdmVudHNCeVVpZChzZWxlY3RlZEV2ZW50LnVpZCkgOiBudWxsKVxuXHRcdGNvbnN0IHBvcHVwTW9kZWwgPSBuZXcgQ2FsZW5kYXJFdmVudFByZXZpZXdWaWV3TW9kZWwoXG5cdFx0XHRzZWxlY3RlZEV2ZW50LFxuXHRcdFx0YXdhaXQgdGhpcy5jYWxlbmRhck1vZGVsKCksXG5cdFx0XHRldmVudFR5cGUsXG5cdFx0XHRoYXNCdXNpbmVzc0ZlYXR1cmUsXG5cdFx0XHRvd25BdHRlbmRlZSxcblx0XHRcdGxhenlJbmRleEVudHJ5LFxuXHRcdFx0YXN5bmMgKG1vZGU6IENhbGVuZGFyT3BlcmF0aW9uKSA9PiB0aGlzLmNhbGVuZGFyRXZlbnRNb2RlbChtb2RlLCBzZWxlY3RlZEV2ZW50LCBtYWlsYm94RGV0YWlscywgbWFpbGJveFByb3BlcnRpZXMsIG51bGwpLFxuXHRcdClcblxuXHRcdC8vIElmIHdlIGhhdmUgYSBwcmV2aWV3IG1vZGVsIHdlIHdhbnQgdG8gZGlzcGxheSB0aGUgZGVzY3JpcHRpb25cblx0XHQvLyBzbyBtYWtlcyBzZW5zZSB0byBhbHJlYWR5IHNhbml0aXplIGl0IGFmdGVyIGJ1aWxkaW5nIHRoZSBldmVudFxuXHRcdGF3YWl0IHBvcHVwTW9kZWwuc2FuaXRpemVEZXNjcmlwdGlvbigpXG5cblx0XHRyZXR1cm4gcG9wdXBNb2RlbFxuXHR9XG5cblx0YXN5bmMgY2FsZW5kYXJDb250YWN0UHJldmlld01vZGVsKGV2ZW50OiBDYWxlbmRhckV2ZW50LCBjb250YWN0OiBDb250YWN0LCBjYW5FZGl0OiBib29sZWFuKTogUHJvbWlzZTxDYWxlbmRhckNvbnRhY3RQcmV2aWV3Vmlld01vZGVsPiB7XG5cdFx0Y29uc3QgeyBDYWxlbmRhckNvbnRhY3RQcmV2aWV3Vmlld01vZGVsIH0gPSBhd2FpdCBpbXBvcnQoXCIuL2NhbGVuZGFyL2d1aS9ldmVudHBvcHVwL0NhbGVuZGFyQ29udGFjdFByZXZpZXdWaWV3TW9kZWwuanNcIilcblx0XHRyZXR1cm4gbmV3IENhbGVuZGFyQ29udGFjdFByZXZpZXdWaWV3TW9kZWwoZXZlbnQsIGNvbnRhY3QsIGNhbkVkaXQpXG5cdH1cblxuXHRwb3N0TG9naW5BY3Rpb25zOiAoKSA9PiBQcm9taXNlPFBvc3RMb2dpbkFjdGlvbnM+ID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IFBvc3RMb2dpbkFjdGlvbnMgfSA9IGF3YWl0IGltcG9ydChcIi4uL2NvbW1vbi9sb2dpbi9Qb3N0TG9naW5BY3Rpb25zXCIpXG5cdFx0cmV0dXJuIG5ldyBQb3N0TG9naW5BY3Rpb25zKFxuXHRcdFx0dGhpcy5jcmVkZW50aWFsc1Byb3ZpZGVyLFxuXHRcdFx0dGhpcy5zZWNvbmRGYWN0b3JIYW5kbGVyLFxuXHRcdFx0dGhpcy5jb25uZWN0aXZpdHlNb2RlbCxcblx0XHRcdHRoaXMubG9naW5zLFxuXHRcdFx0YXdhaXQgdGhpcy5ub1pvbmVEYXRlUHJvdmlkZXIoKSxcblx0XHRcdHRoaXMuZW50aXR5Q2xpZW50LFxuXHRcdFx0dGhpcy51c2VyTWFuYWdlbWVudEZhY2FkZSxcblx0XHRcdHRoaXMuY3VzdG9tZXJGYWNhZGUsXG5cdFx0XHR0aGlzLnRoZW1lQ29udHJvbGxlcixcblx0XHRcdCgpID0+IHRoaXMuc2hvd1NldHVwV2l6YXJkKCksXG5cdFx0XHQoKSA9PiB0aGlzLmhhbmRsZUV4dGVybmFsU3luYygpLFxuXHRcdFx0KCkgPT4gdGhpcy5zZXRVcENsaWVudE9ubHlDYWxlbmRhcnMoKSxcblx0XHQpXG5cdH0pXG5cblx0c2hvd1NldHVwV2l6YXJkID0gYXN5bmMgKCkgPT4ge1xuXHRcdGlmIChpc0FwcCgpKSB7XG5cdFx0XHRjb25zdCB7IHNob3dTZXR1cFdpemFyZCB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL25hdGl2ZS9tYWluL3dpemFyZC9TZXR1cFdpemFyZC5qc1wiKVxuXHRcdFx0cmV0dXJuIHNob3dTZXR1cFdpemFyZChcblx0XHRcdFx0dGhpcy5zeXN0ZW1QZXJtaXNzaW9uSGFuZGxlcixcblx0XHRcdFx0dGhpcy53ZWJNb2JpbGVGYWNhZGUsXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdHRoaXMuc3lzdGVtRmFjYWRlLFxuXHRcdFx0XHR0aGlzLmNyZWRlbnRpYWxzUHJvdmlkZXIsXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdGRldmljZUNvbmZpZyxcblx0XHRcdFx0ZmFsc2UsXG5cdFx0XHQpXG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgaGFuZGxlRXh0ZXJuYWxTeW5jKCkge1xuXHRcdGNvbnN0IGNhbGVuZGFyTW9kZWwgPSBhd2FpdCBsb2NhdG9yLmNhbGVuZGFyTW9kZWwoKVxuXG5cdFx0aWYgKGlzQXBwKCkgfHwgaXNEZXNrdG9wKCkpIHtcblx0XHRcdGNhbGVuZGFyTW9kZWwuc3luY0V4dGVybmFsQ2FsZW5kYXJzKCkuY2F0Y2goYXN5bmMgKGUpID0+IHtcblx0XHRcdFx0c2hvd1NuYWNrQmFyKHtcblx0XHRcdFx0XHRtZXNzYWdlOiBsYW5nLm1ha2VUcmFuc2xhdGlvbihcImV4Y2VwdGlvbl9tc2dcIiwgZS5tZXNzYWdlKSxcblx0XHRcdFx0XHRidXR0b246IHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcIm9rX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0Y2xpY2s6IG5vT3AsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR3YWl0aW5nVGltZTogMTAwMCxcblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0XHRjYWxlbmRhck1vZGVsLnNjaGVkdWxlRXh0ZXJuYWxDYWxlbmRhclN5bmMoKVxuXHRcdH1cblx0fVxuXG5cdHNldFVwQ2xpZW50T25seUNhbGVuZGFycygpIHtcblx0XHRsZXQgY29uZmlncyA9IGRldmljZUNvbmZpZy5nZXRDbGllbnRPbmx5Q2FsZW5kYXJzKClcblxuXHRcdGZvciAoY29uc3QgW2lkLCBuYW1lXSBvZiBDTElFTlRfT05MWV9DQUxFTkRBUlMuZW50cmllcygpKSB7XG5cdFx0XHRjb25zdCBjYWxlbmRhcklkID0gYCR7dGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VySWR9IyR7aWR9YFxuXHRcdFx0Y29uc3QgY29uZmlnID0gY29uZmlncy5nZXQoY2FsZW5kYXJJZClcblx0XHRcdGlmICghY29uZmlnKVxuXHRcdFx0XHRkZXZpY2VDb25maWcudXBkYXRlQ2xpZW50T25seUNhbGVuZGFycyhjYWxlbmRhcklkLCB7XG5cdFx0XHRcdFx0bmFtZTogbGFuZy5nZXQobmFtZSksXG5cdFx0XHRcdFx0Y29sb3I6IERFRkFVTFRfQ0xJRU5UX09OTFlfQ0FMRU5EQVJfQ09MT1JTLmdldChpZCkhLFxuXHRcdFx0XHR9KVxuXHRcdH1cblx0fVxuXG5cdHJlYWRvbmx5IGNyZWRlbnRpYWxGb3JtYXRNaWdyYXRvcjogKCkgPT4gUHJvbWlzZTxDcmVkZW50aWFsRm9ybWF0TWlncmF0b3I+ID0gbGF6eU1lbW9pemVkKGFzeW5jICgpID0+IHtcblx0XHRjb25zdCB7IENyZWRlbnRpYWxGb3JtYXRNaWdyYXRvciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL21pc2MvY3JlZGVudGlhbHMvQ3JlZGVudGlhbEZvcm1hdE1pZ3JhdG9yLmpzXCIpXG5cdFx0aWYgKGlzRGVza3RvcCgpKSB7XG5cdFx0XHRyZXR1cm4gbmV3IENyZWRlbnRpYWxGb3JtYXRNaWdyYXRvcihkZXZpY2VDb25maWcsIHRoaXMubmF0aXZlQ3JlZGVudGlhbHNGYWNhZGUsIG51bGwpXG5cdFx0fSBlbHNlIGlmIChpc0FwcCgpKSB7XG5cdFx0XHRyZXR1cm4gbmV3IENyZWRlbnRpYWxGb3JtYXRNaWdyYXRvcihkZXZpY2VDb25maWcsIHRoaXMubmF0aXZlQ3JlZGVudGlhbHNGYWNhZGUsIHRoaXMuc3lzdGVtRmFjYWRlKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gbmV3IENyZWRlbnRpYWxGb3JtYXRNaWdyYXRvcihkZXZpY2VDb25maWcsIG51bGwsIG51bGwpXG5cdFx0fVxuXHR9KVxuXG5cdC8vIEZvciB0ZXN0aW5nIGFyZ29uMiBtaWdyYXRpb24gYWZ0ZXIgbG9naW4uIFRoZSBwcm9kdWN0aW9uIHNlcnZlciB3aWxsIHJlamVjdCB0aGlzIHJlcXVlc3QuXG5cdC8vIFRoaXMgY2FuIGJlIHJlbW92ZWQgd2hlbiB3ZSBlbmFibGUgdGhlIG1pZ3JhdGlvbi5cblx0YXN5bmMgY2hhbmdlVG9CeWNyeXB0KHBhc3NwaHJhc2U6IHN0cmluZyk6IFByb21pc2U8dW5rbm93bj4ge1xuXHRcdGNvbnN0IGN1cnJlbnRVc2VyID0gdGhpcy5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyXG5cdFx0cmV0dXJuIHRoaXMubG9naW5GYWNhZGUubWlncmF0ZUtkZlR5cGUoS2RmVHlwZS5CY3J5cHQsIHBhc3NwaHJhc2UsIGN1cnJlbnRVc2VyKVxuXHR9XG5cblx0LyoqXG5cdCAqIEZhY3RvcnkgbWV0aG9kIGZvciBjcmVkZW50aWFscyBwcm92aWRlciB0aGF0IHdpbGwgcmV0dXJuIGFuIGluc3RhbmNlIGluamVjdGVkIHdpdGggdGhlIGltcGxlbWVudGF0aW9ucyBhcHByb3ByaWF0ZSBmb3IgdGhlIHBsYXRmb3JtLlxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBjcmVhdGVDcmVkZW50aWFsc1Byb3ZpZGVyKCk6IFByb21pc2U8Q3JlZGVudGlhbHNQcm92aWRlcj4ge1xuXHRcdGNvbnN0IHsgQ3JlZGVudGlhbHNQcm92aWRlciB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL21pc2MvY3JlZGVudGlhbHMvQ3JlZGVudGlhbHNQcm92aWRlci5qc1wiKVxuXHRcdGlmIChpc0Rlc2t0b3AoKSB8fCBpc0FwcCgpKSB7XG5cdFx0XHRyZXR1cm4gbmV3IENyZWRlbnRpYWxzUHJvdmlkZXIodGhpcy5uYXRpdmVDcmVkZW50aWFsc0ZhY2FkZSwgdGhpcy5zcWxDaXBoZXJGYWNhZGUsIGlzRGVza3RvcCgpID8gdGhpcy5pbnRlcldpbmRvd0V2ZW50U2VuZGVyIDogbnVsbClcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgeyBXZWJDcmVkZW50aWFsc0ZhY2FkZSB9ID0gYXdhaXQgaW1wb3J0KFwiLi4vY29tbW9uL21pc2MvY3JlZGVudGlhbHMvV2ViQ3JlZGVudGlhbHNGYWNhZGUuanNcIilcblx0XHRcdHJldHVybiBuZXcgQ3JlZGVudGlhbHNQcm92aWRlcihuZXcgV2ViQ3JlZGVudGlhbHNGYWNhZGUoZGV2aWNlQ29uZmlnKSwgbnVsbCwgbnVsbClcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IHR5cGUgSUNhbGVuZGFyTG9jYXRvciA9IFJlYWRvbmx5PENhbGVuZGFyTG9jYXRvcj5cblxuZXhwb3J0IGNvbnN0IGNhbGVuZGFyTG9jYXRvcjogSUNhbGVuZGFyTG9jYXRvciA9IG5ldyBDYWxlbmRhckxvY2F0b3IoKVxuXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHR3aW5kb3cudHV0YW8ubG9jYXRvciA9IGNhbGVuZGFyTG9jYXRvclxufVxuIiwiaW1wb3J0IHR5cGUgeyBTaG9ydGN1dCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vbWlzYy9LZXlNYW5hZ2VyLmpzXCJcbmltcG9ydCBtLCB7IENoaWxkcmVuIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgcHggfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9zaXplLmpzXCJcbmltcG9ydCB7IEljb25zIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9pY29ucy9JY29ucy5qc1wiXG5pbXBvcnQgdHlwZSB7IE1vZGFsQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Nb2RhbC5qc1wiXG5pbXBvcnQgeyBtb2RhbCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvTW9kYWwuanNcIlxuaW1wb3J0IHsgRFJPUERPV05fTUFSR0lOLCBQb3NSZWN0LCBzaG93RHJvcGRvd24gfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0Ryb3Bkb3duLmpzXCJcbmltcG9ydCB7IEtleXMgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMuanNcIlxuaW1wb3J0IHsgSWNvbkJ1dHRvbiB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvbkJ1dHRvbi5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckNvbnRhY3RQcmV2aWV3Vmlld01vZGVsIH0gZnJvbSBcIi4vQ2FsZW5kYXJDb250YWN0UHJldmlld1ZpZXdNb2RlbC5qc1wiXG5pbXBvcnQgeyBDb250YWN0UHJldmlld1ZpZXcgfSBmcm9tIFwiLi9Db250YWN0UHJldmlld1ZpZXcuanNcIlxuaW1wb3J0IHsgY2xpZW50IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9taXNjL0NsaWVudERldGVjdG9yLmpzXCJcbmltcG9ydCB7IENvbnRhY3RFZGl0b3IgfSBmcm9tIFwiLi4vLi4vLi4vLi4vbWFpbC1hcHAvY29udGFjdHMvQ29udGFjdEVkaXRvci5qc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yLmpzXCJcbmltcG9ydCB7IGxpc3RJZFBhcnQgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgc3RyaW5nVG9CYXNlNjQgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IGNhbGVuZGFyTG9jYXRvciB9IGZyb20gXCIuLi8uLi8uLi9jYWxlbmRhckxvY2F0b3IuanNcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2cuanNcIlxuXG4vKipcbiAqIHNtYWxsIG1vZGFsIGRpc3BsYXlpbmcgYWxsIHJlbGV2YW50IGluZm9ybWF0aW9uIGFib3V0IGEgY29udGFjdCBpbiBhIGNvbXBhY3QgZmFzaGlvbi4gb2ZmZXJzIGxpbWl0ZWQgZWRpdGluZyBjYXBhYmlsaXRpZXMgdG8gcGFydGljaXBhbnRzIGluIHRoZVxuICogZm9ybSB3aXRoIHF1aWNrIGFjdGlvbiBidXR0b25zIHN1Y2ggYXMgZWRpdCBjb250YWN0LlxuICovXG5leHBvcnQgY2xhc3MgQ29udGFjdEV2ZW50UG9wdXAgaW1wbGVtZW50cyBNb2RhbENvbXBvbmVudCB7XG5cdHByaXZhdGUgcmVhZG9ubHkgX3Nob3J0Y3V0czogU2hvcnRjdXRbXSA9IFtdXG5cdHByaXZhdGUgZG9tOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG5cdHByaXZhdGUgZm9jdXNlZEJlZm9yZVNob3duOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsXG5cblx0LyoqXG5cdCAqIEBwYXJhbSBtb2RlbFxuXHQgKiBAcGFyYW0gZXZlbnRCdWJibGVSZWN0IHRoZSByZWN0IHdoZXJlIHRoZSBldmVudCBidWJibGUgd2FzIGRpc3BsYXllZCB0aGF0IHdhcyBjbGlja2VkIChpZiBhbnkpXG5cdCAqL1xuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IG1vZGVsOiBDYWxlbmRhckNvbnRhY3RQcmV2aWV3Vmlld01vZGVsLCBwcml2YXRlIHJlYWRvbmx5IGV2ZW50QnViYmxlUmVjdDogUG9zUmVjdCkge1xuXHRcdHRoaXMuc2V0dXBTaG9ydGN1dHMoKVxuXHRcdHRoaXMudmlldyA9IHRoaXMudmlldy5iaW5kKHRoaXMpXG5cdH1cblxuXHRwcml2YXRlIHJlYWRvbmx5IGhhbmRsZUVkaXRCdXR0b25DbGljazogKGV2OiBNb3VzZUV2ZW50LCByZWNlaXZlcjogSFRNTEVsZW1lbnQpID0+IHZvaWQgPSBhc3luYyAoZXY6IE1vdXNlRXZlbnQsIHJlY2VpdmVyOiBIVE1MRWxlbWVudCkgPT4ge1xuXHRcdGlmIChjbGllbnQuaXNDYWxlbmRhckFwcCgpKSB7XG5cdFx0XHRpZiAoIShhd2FpdCBEaWFsb2cuY29uZmlybShcIm9wZW5NYWlsQXBwX21zZ1wiLCBcInllc19sYWJlbFwiKSkpIHJldHVyblxuXG5cdFx0XHRjb25zdCBxdWVyeSA9IGBjb250YWN0SWQ9JHtzdHJpbmdUb0Jhc2U2NCh0aGlzLm1vZGVsLmNvbnRhY3QuX2lkLmpvaW4oXCIvXCIpKX1gXG5cdFx0XHRjYWxlbmRhckxvY2F0b3Iuc3lzdGVtRmFjYWRlLm9wZW5NYWlsQXBwKHN0cmluZ1RvQmFzZTY0KHF1ZXJ5KSlcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHRuZXcgQ29udGFjdEVkaXRvcihsb2NhdG9yLmVudGl0eUNsaWVudCwgdGhpcy5tb2RlbC5jb250YWN0LCBsaXN0SWRQYXJ0KHRoaXMubW9kZWwuY29udGFjdC5faWQpLCBtLnJlZHJhdykuc2hvdygpXG5cdH1cblxuXHR2aWV3KCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcblx0XHRcdFwiLmFicy5lbGV2YXRlZC1iZy5wbHIucGIuYm9yZGVyLXJhZGl1cy5kcm9wZG93bi1zaGFkb3cuZmxleC5mbGV4LWNvbHVtblwiLFxuXHRcdFx0e1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdC8vIG1pbnVzIG1hcmdpbiwgbmVlZCB0byBhcHBseSBpdCBub3cgdG8gbm90IG92ZXJmbG93IGxhdGVyXG5cdFx0XHRcdFx0d2lkdGg6IHB4KE1hdGgubWluKHdpbmRvdy5pbm5lcldpZHRoIC0gRFJPUERPV05fTUFSR0lOICogMiwgNDAwKSksXG5cdFx0XHRcdFx0Ly8gc2VlIGhhY2sgZGVzY3JpcHRpb24gYmVsb3dcblx0XHRcdFx0XHRvcGFjaXR5OiBcIjBcIixcblx0XHRcdFx0XHQvLyBiZWNhdXNlIGNhbGVuZGFyIGV2ZW50IGJ1YmJsZXMgaGF2ZSAxcHggYm9yZGVyLCB3ZSB3YW50IHRvIGFsaWduXG5cdFx0XHRcdFx0bWFyZ2luOiBcIjFweFwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbmNyZWF0ZTogKHZub2RlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5kb20gPSB2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnRcblx0XHRcdFx0XHQvLyBUaGlzIGlzIGEgaGFjayB0byBnZXQgXCJuYXR1cmFsXCIgdmlldyBzaXplIGJ1dCByZW5kZXIgaXQgd2l0aG91dCBvcGFjaXR5IGZpcnN0IGFuZCB0aGVuIHNob3cgZHJvcGRvd24gd2l0aCBpbmZlcnJlZFxuXHRcdFx0XHRcdC8vIHNpemUuXG5cdFx0XHRcdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRzaG93RHJvcGRvd24odGhpcy5ldmVudEJ1YmJsZVJlY3QsIHRoaXMuZG9tISwgdGhpcy5kb20hLm9mZnNldEhlaWdodCwgNDAwKVxuXHRcdFx0XHRcdFx0Ly8gTW92ZSB0aGUga2V5Ym9hcmQgZm9jdXMgaW50byB0aGUgcG9wdXAncyBidXR0b25zIHdoZW4gaXQgaXMgc2hvd25cblx0XHRcdFx0XHRcdGNvbnN0IGZpcnN0QnV0dG9uID0gdm5vZGUuZG9tLmZpcnN0RWxlbWVudENoaWxkPy5maXJzdEVsZW1lbnRDaGlsZCBhcyBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbFxuXHRcdFx0XHRcdFx0Zmlyc3RCdXR0b24/LmZvY3VzKClcblx0XHRcdFx0XHR9LCAyNClcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRbXG5cdFx0XHRcdG0oXCIuZmxleC5mbGV4LWVuZFwiLCBbdGhpcy5yZW5kZXJFZGl0QnV0dG9uKCksIHRoaXMucmVuZGVyQ2xvc2VCdXR0b24oKV0pLFxuXHRcdFx0XHRtKFwiLmZsZXgtZ3Jvd1wiLCBbXG5cdFx0XHRcdFx0bShDb250YWN0UHJldmlld1ZpZXcsIHtcblx0XHRcdFx0XHRcdGV2ZW50OiB0aGlzLm1vZGVsLmV2ZW50LFxuXHRcdFx0XHRcdFx0Y29udGFjdDogdGhpcy5tb2RlbC5jb250YWN0LFxuXHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRdKSxcblx0XHRcdF0sXG5cdFx0KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJFZGl0QnV0dG9uKCk6IENoaWxkcmVuIHtcblx0XHRpZiAoIXRoaXMubW9kZWwuY2FuRWRpdCkgcmV0dXJuIG51bGxcblx0XHRyZXR1cm4gbShJY29uQnV0dG9uLCB7IHRpdGxlOiBcImVkaXRfYWN0aW9uXCIsIGljb246IEljb25zLk1hbmFnZUNvbnRhY3QsIGNsaWNrOiB0aGlzLmhhbmRsZUVkaXRCdXR0b25DbGljayB9KVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJDbG9zZUJ1dHRvbigpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0dGl0bGU6IFwiY2xvc2VfYWx0XCIsXG5cdFx0XHRjbGljazogKCkgPT4gdGhpcy5jbG9zZSgpLFxuXHRcdFx0aWNvbjogSWNvbnMuQ2FuY2VsLFxuXHRcdH0pXG5cdH1cblxuXHRzaG93KCkge1xuXHRcdHRoaXMuZm9jdXNlZEJlZm9yZVNob3duID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudFxuXHRcdG1vZGFsLmRpc3BsYXkodGhpcywgZmFsc2UpXG5cdH1cblxuXHRwcml2YXRlIGNsb3NlKCkge1xuXHRcdG1vZGFsLnJlbW92ZSh0aGlzKVxuXHR9XG5cblx0YmFja2dyb3VuZENsaWNrKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcblx0XHRtb2RhbC5yZW1vdmUodGhpcylcblx0fVxuXG5cdGhpZGVBbmltYXRpb24oKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG5cdH1cblxuXHRvbkNsb3NlKCk6IHZvaWQge1xuXHRcdHRoaXMuY2xvc2UoKVxuXHR9XG5cblx0c2hvcnRjdXRzKCk6IFNob3J0Y3V0W10ge1xuXHRcdHJldHVybiB0aGlzLl9zaG9ydGN1dHNcblx0fVxuXG5cdHBvcFN0YXRlKGU6IEV2ZW50KTogYm9vbGVhbiB7XG5cdFx0bW9kYWwucmVtb3ZlKHRoaXMpXG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cblxuXHRjYWxsaW5nRWxlbWVudCgpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuXHRcdHJldHVybiB0aGlzLmZvY3VzZWRCZWZvcmVTaG93blxuXHR9XG5cblx0cHJpdmF0ZSBzZXR1cFNob3J0Y3V0cygpIHtcblx0XHRjb25zdCBjbG9zZTogU2hvcnRjdXQgPSB7XG5cdFx0XHRrZXk6IEtleXMuRVNDLFxuXHRcdFx0ZXhlYzogKCkgPT4gdGhpcy5jbG9zZSgpLFxuXHRcdFx0aGVscDogXCJjbG9zZV9hbHRcIixcblx0XHR9XG5cdFx0Y29uc3QgZWRpdDogU2hvcnRjdXQgPSB7XG5cdFx0XHRrZXk6IEtleXMuRSxcblx0XHRcdGV4ZWM6ICgpID0+IHRoaXMuaGFuZGxlRWRpdEJ1dHRvbkNsaWNrKG5ldyBNb3VzZUV2ZW50KFwiY2xpY2tcIiwge30pLCB0aGlzLmRvbSEpLFxuXHRcdFx0aGVscDogXCJlZGl0X2FjdGlvblwiLFxuXHRcdH1cblxuXHRcdHRoaXMuX3Nob3J0Y3V0cy5wdXNoKGNsb3NlKVxuXG5cdFx0aWYgKHRoaXMubW9kZWwuY2FuRWRpdCkge1xuXHRcdFx0dGhpcy5fc2hvcnRjdXRzLnB1c2goZWRpdClcblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCBtLCB7IENoaWxkcmVuLCBDb21wb25lbnQsIHJlZHJhdywgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBBcHBIZWFkZXJBdHRycywgSGVhZGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvSGVhZGVyLmpzXCJcbmltcG9ydCB7IENvbHVtblR5cGUsIFZpZXdDb2x1bW4gfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1ZpZXdDb2x1bW5cIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBWaWV3U2xpZGVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvbmF2L1ZpZXdTbGlkZXIuanNcIlxuaW1wb3J0IHR5cGUgeyBLZXksIFNob3J0Y3V0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0tleU1hbmFnZXJcIlxuaW1wb3J0IHsgaXNLZXlQcmVzc2VkLCBrZXlNYW5hZ2VyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0tleU1hbmFnZXJcIlxuaW1wb3J0IHsgSWNvbnMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL2ljb25zL0ljb25zXCJcbmltcG9ydCB7IGRlY29kZUJhc2U2NCwgZG93bmNhc3QsIGdldFN0YXJ0T2ZEYXksIGlzU2FtZURheU9mRGF0ZSwgbGFzdCwgbm9PcCwgb2ZDbGFzcyB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIlxuaW1wb3J0IHtcblx0Q2FsZW5kYXJFdmVudCxcblx0Q2FsZW5kYXJHcm91cFJvb3RUeXBlUmVmLFxuXHRDb250YWN0VHlwZVJlZixcblx0Y3JlYXRlRGVmYXVsdEFsYXJtSW5mbyxcblx0Y3JlYXRlR3JvdXBTZXR0aW5ncyxcblx0R3JvdXBTZXR0aW5ncyxcblx0VXNlclNldHRpbmdzR3JvdXBSb290LFxufSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQge1xuXHRERUZBVUxUX0NMSUVOVF9PTkxZX0NBTEVOREFSX0NPTE9SUyxcblx0ZGVmYXVsdENhbGVuZGFyQ29sb3IsXG5cdEdyb3VwVHlwZSxcblx0S2V5cyxcblx0TmV3UGFpZFBsYW5zLFxuXHRyZXZlcnNlLFxuXHRTaGFyZUNhcGFiaWxpdHksXG5cdFRhYkluZGV4LFxuXHRUaW1lRm9ybWF0LFxuXHRXZWVrU3RhcnQsXG59IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7XG5cdENhbGVuZGFyVHlwZSxcblx0ZmluZEZpcnN0UHJpdmF0ZUNhbGVuZGFyLFxuXHRnZXRDYWxlbmRhclR5cGUsXG5cdGdldFN0YXJ0T2ZUaGVXZWVrT2Zmc2V0LFxuXHRnZXRTdGFydE9mVGhlV2Vla09mZnNldEZvclVzZXIsXG5cdGdldFRpbWVab25lLFxuXHRnZXRXZWVrTnVtYmVyLFxuXHRoYXNTb3VyY2VVcmwsXG5cdGlzQmlydGhkYXlFdmVudCxcblx0aXNDbGllbnRPbmx5Q2FsZW5kYXIsXG5cdHBhcnNlQWxhcm1JbnRlcnZhbCxcbn0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyVXRpbHNcIlxuaW1wb3J0IHsgQnV0dG9uQ29sb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhck1vbnRoVmlldyB9IGZyb20gXCIuL0NhbGVuZGFyTW9udGhWaWV3XCJcbmltcG9ydCB7IERhdGVUaW1lIH0gZnJvbSBcImx1eG9uXCJcbmltcG9ydCB7IE5vdEZvdW5kRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUmVzdEVycm9yXCJcbmltcG9ydCB7IENhbGVuZGFyQWdlbmRhVmlldywgQ2FsZW5kYXJBZ2VuZGFWaWV3QXR0cnMgfSBmcm9tIFwiLi9DYWxlbmRhckFnZW5kYVZpZXdcIlxuaW1wb3J0IHsgdHlwZSBDYWxlbmRhclByb3BlcnRpZXMsIGhhbmRsZVVybFN1YnNjcmlwdGlvbiwgc2hvd0NyZWF0ZUVkaXRDYWxlbmRhckRpYWxvZyB9IGZyb20gXCIuLi9ndWkvRWRpdENhbGVuZGFyRGlhbG9nLmpzXCJcbmltcG9ydCB7IHN0eWxlcyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3N0eWxlc1wiXG5pbXBvcnQgeyBNdWx0aURheUNhbGVuZGFyVmlldyB9IGZyb20gXCIuL011bHRpRGF5Q2FsZW5kYXJWaWV3XCJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2Jhc2UvRGlhbG9nXCJcbmltcG9ydCB7IGlzQXBwLCBpc0Rlc2t0b3AgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IHB4LCBzaXplIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvc2l6ZVwiXG5pbXBvcnQgeyBGb2xkZXJDb2x1bW5WaWV3IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvRm9sZGVyQ29sdW1uVmlldy5qc1wiXG5pbXBvcnQgeyBkZXZpY2VDb25maWcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL21pc2MvRGV2aWNlQ29uZmlnXCJcbmltcG9ydCB7IGV4cG9ydENhbGVuZGFyLCBoYW5kbGVDYWxlbmRhckltcG9ydCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvaW1wb3J0L0NhbGVuZGFySW1wb3J0ZXJEaWFsb2cuanNcIlxuaW1wb3J0IHsgc2hvd05vdEF2YWlsYWJsZUZvckZyZWVEaWFsb2csIHNob3dQbGFuVXBncmFkZVJlcXVpcmVkRGlhbG9nIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL1N1YnNjcmlwdGlvbkRpYWxvZ3NcIlxuaW1wb3J0IHsgZ2V0U2hhcmVkR3JvdXBOYW1lLCBoYXNDYXBhYmlsaXR5T25Hcm91cCwgbG9hZEdyb3VwTWVtYmVycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vc2hhcmluZy9Hcm91cFV0aWxzXCJcbmltcG9ydCB7IHNob3dHcm91cFNoYXJpbmdEaWFsb2cgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL3NoYXJpbmcvdmlldy9Hcm91cFNoYXJpbmdEaWFsb2dcIlxuaW1wb3J0IHsgR3JvdXBJbnZpdGF0aW9uRm9sZGVyUm93IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9zaGFyaW5nL3ZpZXcvR3JvdXBJbnZpdGF0aW9uRm9sZGVyUm93XCJcbmltcG9ydCB7IFNpZGViYXJTZWN0aW9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvU2lkZWJhclNlY3Rpb25cIlxuaW1wb3J0IHR5cGUgeyBIdG1sU2FuaXRpemVyIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0h0bWxTYW5pdGl6ZXJcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9lcnJvci9Qcm9ncmFtbWluZ0Vycm9yXCJcbmltcG9ydCB7IGNhbGVuZGFyTmF2Q29uZmlndXJhdGlvbiwgY2FsZW5kYXJXZWVrLCBkYXlzSGF2ZUV2ZW50cywgc2hvdWxkRGVmYXVsdFRvQW1QbVRpbWVGb3JtYXQsIHNob3dEZWxldGVQb3B1cCB9IGZyb20gXCIuLi9ndWkvQ2FsZW5kYXJHdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50QnViYmxlS2V5RG93bkhhbmRsZXIsIENhbGVuZGFyUHJldmlld01vZGVscywgQ2FsZW5kYXJWaWV3TW9kZWwsIE1vdXNlT3JQb2ludGVyRXZlbnQgfSBmcm9tIFwiLi9DYWxlbmRhclZpZXdNb2RlbFwiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50UG9wdXAgfSBmcm9tIFwiLi4vZ3VpL2V2ZW50cG9wdXAvQ2FsZW5kYXJFdmVudFBvcHVwLmpzXCJcbmltcG9ydCB7IHNob3dQcm9ncmVzc0RpYWxvZyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL2RpYWxvZ3MvUHJvZ3Jlc3NEaWFsb2dcIlxuaW1wb3J0IHsgQ2FsZW5kYXJJbmZvLCBDYWxlbmRhck1vZGVsIH0gZnJvbSBcIi4uL21vZGVsL0NhbGVuZGFyTW9kZWxcIlxuaW1wb3J0IHR5cGUgU3RyZWFtIGZyb20gXCJtaXRocmlsL3N0cmVhbVwiXG5pbXBvcnQgeyBJY29uQnV0dG9uIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9JY29uQnV0dG9uLmpzXCJcbmltcG9ydCB7IGNyZWF0ZURyb3Bkb3duLCBQb3NSZWN0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9Ecm9wZG93bi5qc1wiXG5pbXBvcnQgeyBCdXR0b25TaXplIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CdXR0b25TaXplLmpzXCJcbmltcG9ydCB7IERyYXdlck1lbnVBdHRycyB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL25hdi9EcmF3ZXJNZW51LmpzXCJcbmltcG9ydCB7IEJhc2VUb3BMZXZlbFZpZXcgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9CYXNlVG9wTGV2ZWxWaWV3LmpzXCJcbmltcG9ydCB7IFRvcExldmVsQXR0cnMsIFRvcExldmVsVmlldyB9IGZyb20gXCIuLi8uLi8uLi9Ub3BMZXZlbFZpZXcuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJWaWV3VHlwZSwgZ2V0RXZlbnRXaXRoRGVmYXVsdFRpbWVzLCBzZXJpYWxpemVBbGFybUludGVydmFsLCBzZXROZXh0SGFsZkhvdXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvQ29tbW9uQ2FsZW5kYXJVdGlscy5qc1wiXG5pbXBvcnQgeyBCYWNrZ3JvdW5kQ29sdW1uTGF5b3V0IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9ndWkvQmFja2dyb3VuZENvbHVtbkxheW91dC5qc1wiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vZ3VpL3RoZW1lLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyTW9iaWxlSGVhZGVyIH0gZnJvbSBcIi4vQ2FsZW5kYXJNb2JpbGVIZWFkZXIuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJEZXNrdG9wVG9vbGJhciB9IGZyb20gXCIuL0NhbGVuZGFyRGVza3RvcFRvb2xiYXIuanNcIlxuaW1wb3J0IHsgVGltZSB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9UaW1lLmpzXCJcbmltcG9ydCB7IERheVNlbGVjdG9yU2lkZWJhciB9IGZyb20gXCIuLi9ndWkvZGF5LXNlbGVjdG9yL0RheVNlbGVjdG9yU2lkZWJhci5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhck9wZXJhdGlvbiB9IGZyb20gXCIuLi9ndWkvZXZlbnRlZGl0b3ItbW9kZWwvQ2FsZW5kYXJFdmVudE1vZGVsLmpzXCJcbmltcG9ydCB7IERheVNlbGVjdG9yUG9wdXAgfSBmcm9tIFwiLi4vZ3VpL2RheS1zZWxlY3Rvci9EYXlTZWxlY3RvclBvcHVwLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyRXZlbnRQcmV2aWV3Vmlld01vZGVsIH0gZnJvbSBcIi4uL2d1aS9ldmVudHBvcHVwL0NhbGVuZGFyRXZlbnRQcmV2aWV3Vmlld01vZGVsLmpzXCJcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vbWlzYy9DbGllbnREZXRlY3Rvci5qc1wiXG5pbXBvcnQgeyBGbG9hdGluZ0FjdGlvbkJ1dHRvbiB9IGZyb20gXCIuLi8uLi9ndWkvRmxvYXRpbmdBY3Rpb25CdXR0b24uanNcIlxuaW1wb3J0IHsgSWNvbiwgSWNvblNpemUgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL0ljb24uanNcIlxuaW1wb3J0IHsgR3JvdXAsIEdyb3VwSW5mbywgVXNlciB9IGZyb20gXCIuLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBmb3JtYXREYXRlLCBmb3JtYXRUaW1lIH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0Zvcm1hdHRlci5qc1wiXG5pbXBvcnQgeyBnZXRFeHRlcm5hbENhbGVuZGFyTmFtZSwgcGFyc2VDYWxlbmRhclN0cmluZ0RhdGEsIFN5bmNTdGF0dXMgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2NhbGVuZGFyL2ltcG9ydC9JbXBvcnRFeHBvcnRVdGlscy5qc1wiXG5pbXBvcnQgdHlwZSB7IFBhcnNlZEV2ZW50IH0gZnJvbSBcIi4uLy4uLy4uL2NvbW1vbi9jYWxlbmRhci9pbXBvcnQvQ2FsZW5kYXJJbXBvcnRlci5qc1wiXG5pbXBvcnQgeyBzaG93U25hY2tCYXIgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2d1aS9iYXNlL1NuYWNrQmFyLmpzXCJcbmltcG9ydCB7IGVsZW1lbnRJZFBhcnQgfSBmcm9tIFwiLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vdXRpbHMvRW50aXR5VXRpbHMuanNcIlxuaW1wb3J0IHsgQ29udGFjdEV2ZW50UG9wdXAgfSBmcm9tIFwiLi4vZ3VpL2V2ZW50cG9wdXAvQ2FsZW5kYXJDb250YWN0UG9wdXAuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJDb250YWN0UHJldmlld1ZpZXdNb2RlbCB9IGZyb20gXCIuLi9ndWkvZXZlbnRwb3B1cC9DYWxlbmRhckNvbnRhY3RQcmV2aWV3Vmlld01vZGVsLmpzXCJcbmltcG9ydCB7IENvbnRhY3RFZGl0b3IgfSBmcm9tIFwiLi4vLi4vLi4vbWFpbC1hcHAvY29udGFjdHMvQ29udGFjdEVkaXRvci5qc1wiXG5pbXBvcnQgeyBFdmVudEVkaXRvckRpYWxvZyB9IGZyb20gXCIuLi9ndWkvZXZlbnRlZGl0b3Itdmlldy9DYWxlbmRhckV2ZW50RWRpdERpYWxvZy5qc1wiXG5cbmV4cG9ydCB0eXBlIEdyb3VwQ29sb3JzID0gTWFwPElkLCBzdHJpbmc+XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2FsZW5kYXJWaWV3QXR0cnMgZXh0ZW5kcyBUb3BMZXZlbEF0dHJzIHtcblx0ZHJhd2VyQXR0cnM6IERyYXdlck1lbnVBdHRyc1xuXHRoZWFkZXI6IEFwcEhlYWRlckF0dHJzXG5cdGNhbGVuZGFyVmlld01vZGVsOiBDYWxlbmRhclZpZXdNb2RlbFxuXHRib3R0b21OYXY/OiAoKSA9PiBDaGlsZHJlblxuXHRsYXp5U2VhcmNoQmFyOiAoKSA9PiBDaGlsZHJlblxufVxuXG5jb25zdCBDYWxlbmRhclZpZXdUeXBlQnlWYWx1ZSA9IHJldmVyc2UoQ2FsZW5kYXJWaWV3VHlwZSlcblxuZW51bSBSZW5kZXJUeXBlIHtcblx0UHJpdmF0ZSxcblx0U2hhcmVkLFxuXHRFeHRlcm5hbCxcblx0Q2xpZW50T25seSxcbn1cblxuZXhwb3J0IGNsYXNzIENhbGVuZGFyVmlldyBleHRlbmRzIEJhc2VUb3BMZXZlbFZpZXcgaW1wbGVtZW50cyBUb3BMZXZlbFZpZXc8Q2FsZW5kYXJWaWV3QXR0cnM+IHtcblx0cHJpdmF0ZSByZWFkb25seSBzaWRlYmFyQ29sdW1uOiBWaWV3Q29sdW1uXG5cdHByaXZhdGUgcmVhZG9ubHkgY29udGVudENvbHVtbjogVmlld0NvbHVtblxuXHRwcml2YXRlIHJlYWRvbmx5IHZpZXdTbGlkZXI6IFZpZXdTbGlkZXJcblx0cHJpdmF0ZSBjdXJyZW50Vmlld1R5cGU6IENhbGVuZGFyVmlld1R5cGVcblx0cHJpdmF0ZSByZWFkb25seSB2aWV3TW9kZWw6IENhbGVuZGFyVmlld01vZGVsXG5cdC8vIEZvciBzYW5pdGl6aW5nIGV2ZW50IGRlc2NyaXB0aW9ucywgd2hpY2ggZ2V0IHJlbmRlcmVkIGFzIGh0bWwgaW4gdGhlIENhbGVuZGFyRXZlbnRQb3B1cFxuXHRwcml2YXRlIHJlYWRvbmx5IGh0bWxTYW5pdGl6ZXI6IFByb21pc2U8SHRtbFNhbml0aXplcj5cblx0cHJpdmF0ZSByZWRyYXdJbnRlcnZhbElkOiBudW1iZXIgfCBudWxsID0gbnVsbFxuXHRwcml2YXRlIHJlZHJhd1RpbWVvdXRJZDogbnVtYmVyIHwgbnVsbCA9IG51bGxcblx0b25jcmVhdGU6IENvbXBvbmVudFtcIm9uY3JlYXRlXCJdXG5cdG9ucmVtb3ZlOiBDb21wb25lbnRbXCJvbnJlbW92ZVwiXVxuXG5cdGNvbnN0cnVjdG9yKHsgYXR0cnMgfTogVm5vZGU8Q2FsZW5kYXJWaWV3QXR0cnM+KSB7XG5cdFx0c3VwZXIoKVxuXHRcdGNvbnN0IHVzZXJJZCA9IGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlci5faWRcblxuXHRcdHRoaXMudmlld01vZGVsID0gYXR0cnMuY2FsZW5kYXJWaWV3TW9kZWxcblx0XHR0aGlzLmN1cnJlbnRWaWV3VHlwZSA9IGRldmljZUNvbmZpZy5nZXREZWZhdWx0Q2FsZW5kYXJWaWV3KHVzZXJJZCkgfHwgQ2FsZW5kYXJWaWV3VHlwZS5NT05USFxuXHRcdHRoaXMuaHRtbFNhbml0aXplciA9IGltcG9ydChcIi4uLy4uLy4uL2NvbW1vbi9taXNjL0h0bWxTYW5pdGl6ZXJcIikudGhlbigobSkgPT4gbS5odG1sU2FuaXRpemVyKVxuXHRcdHRoaXMuc2lkZWJhckNvbHVtbiA9IG5ldyBWaWV3Q29sdW1uKFxuXHRcdFx0e1xuXHRcdFx0XHR2aWV3OiAoKSA9PlxuXHRcdFx0XHRcdG0oRm9sZGVyQ29sdW1uVmlldywge1xuXHRcdFx0XHRcdFx0ZHJhd2VyOiBhdHRycy5kcmF3ZXJBdHRycyxcblx0XHRcdFx0XHRcdGJ1dHRvbjogc3R5bGVzLmlzRGVza3RvcExheW91dCgpXG5cdFx0XHRcdFx0XHRcdD8ge1xuXHRcdFx0XHRcdFx0XHRcdFx0bGFiZWw6IFwibmV3RXZlbnRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRjbGljazogKCkgPT4gdGhpcy5jcmVhdGVOZXdFdmVudERpYWxvZygpLFxuXHRcdFx0XHRcdFx0XHQgIH1cblx0XHRcdFx0XHRcdFx0OiBudWxsLFxuXHRcdFx0XHRcdFx0Y29udGVudDogW1xuXHRcdFx0XHRcdFx0XHRzdHlsZXMuaXNEZXNrdG9wTGF5b3V0KClcblx0XHRcdFx0XHRcdFx0XHQ/IG0oRGF5U2VsZWN0b3JTaWRlYmFyLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHNlbGVjdGVkRGF0ZTogdGhpcy52aWV3TW9kZWwuc2VsZWN0ZWREYXRlKCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9uRGF0ZVNlbGVjdGVkOiAoZGF0ZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuc2V0VXJsKHRoaXMuY3VycmVudFZpZXdUeXBlLCBkYXRlKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0c3RhcnRPZlRoZVdlZWtPZmZzZXQ6IGdldFN0YXJ0T2ZUaGVXZWVrT2Zmc2V0KFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRvd25jYXN0KGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlclNldHRpbmdzR3JvdXBSb290LnN0YXJ0T2ZUaGVXZWVrKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0c2hvd0RheVNlbGVjdGlvbjogdGhpcy5jdXJyZW50Vmlld1R5cGUgIT09IENhbGVuZGFyVmlld1R5cGUuTU9OVEggJiYgdGhpcy5jdXJyZW50Vmlld1R5cGUgIT09IENhbGVuZGFyVmlld1R5cGUuV0VFSyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0aGlnaGxpZ2h0VG9kYXk6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGhpZ2hsaWdodFNlbGVjdGVkV2VlazogdGhpcy5jdXJyZW50Vmlld1R5cGUgPT09IENhbGVuZGFyVmlld1R5cGUuV0VFSyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0aGFzRXZlbnRzT246IChkYXRlKSA9PiB0aGlzLmhhc0V2ZW50c09uKGRhdGUpLFxuXHRcdFx0XHRcdFx0XHRcdCAgfSlcblx0XHRcdFx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcdFx0U2lkZWJhclNlY3Rpb24sXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0bmFtZTogXCJ5b3VyQ2FsZW5kYXJzX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRidXR0b246IG0oSWNvbkJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aXRsZTogXCJhZGRDYWxlbmRhcl9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y29sb3JzOiBCdXR0b25Db2xvci5OYXYsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNsaWNrOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdChpc0FwcCgpIHx8IGlzRGVza3RvcCgpKSAmJiBmaW5kRmlyc3RQcml2YXRlQ2FsZW5kYXIoYXR0cnMuY2FsZW5kYXJWaWV3TW9kZWwuY2FsZW5kYXJJbmZvcylcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdD8gY3JlYXRlRHJvcGRvd24oe1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxhenlCdXR0b25zOiAoKSA9PiBbXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcImFkZENhbGVuZGFyX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb2xvcnM6IEJ1dHRvbkNvbG9yLk5hdixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHRoaXMub25QcmVzc2VkQWRkQ2FsZW5kYXIoQ2FsZW5kYXJUeXBlLk5PUk1BTCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGljb246IEljb25zLkFkZCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGFiZWw6IFwiYWRkQ2FsZW5kYXJGcm9tVVJMX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5MaW5rLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB0aGlzLm9uUHJlc3NlZEFkZENhbGVuZGFyKENhbGVuZGFyVHlwZS5VUkwpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ICB9KVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0OiAoKSA9PiB0aGlzLm9uUHJlc3NlZEFkZENhbGVuZGFyKENhbGVuZGFyVHlwZS5OT1JNQUwpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5BZGQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHNpemU6IEJ1dHRvblNpemUuQ29tcGFjdCxcblx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0aGlkZUlmRW1wdHk6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnJlbmRlckNhbGVuZGFycyhbUmVuZGVyVHlwZS5Qcml2YXRlLCBSZW5kZXJUeXBlLkNsaWVudE9ubHldKSxcblx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XHRTaWRlYmFyU2VjdGlvbixcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRuYW1lOiBcImNhbGVuZGFyU2hhcmVkX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRoaWRlSWZFbXB0eTogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucmVuZGVyQ2FsZW5kYXJzKFtSZW5kZXJUeXBlLlNoYXJlZF0pLFxuXHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XHRcdFNpZGViYXJTZWN0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdG5hbWU6IFwiY2FsZW5kYXJTdWJzY3JpcHRpb25zX2xhYmVsXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRoaWRlSWZFbXB0eTogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdHRoaXMucmVuZGVyQ2FsZW5kYXJzKFtSZW5kZXJUeXBlLkV4dGVybmFsXSksXG5cdFx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0XHRcdHRoaXMudmlld01vZGVsLmNhbGVuZGFySW52aXRhdGlvbnMoKS5sZW5ndGggPiAwXG5cdFx0XHRcdFx0XHRcdFx0PyBtKFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRTaWRlYmFyU2VjdGlvbixcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG5hbWU6IFwiY2FsZW5kYXJJbnZpdGF0aW9uc19sYWJlbFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLnZpZXdNb2RlbC5jYWxlbmRhckludml0YXRpb25zKCkubWFwKChpbnZpdGF0aW9uKSA9PlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG0oR3JvdXBJbnZpdGF0aW9uRm9sZGVyUm93LCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpbnZpdGF0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0XHRcdCAgKVxuXHRcdFx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRhcmlhTGFiZWw6IFwiY2FsZW5kYXJfbGFiZWxcIixcblx0XHRcdFx0XHR9KSxcblx0XHRcdH0sXG5cdFx0XHRDb2x1bW5UeXBlLkZvcmVncm91bmQsXG5cdFx0XHR7XG5cdFx0XHRcdG1pbldpZHRoOiBzaXplLmNhbGVuZGFyX2ZpcnN0X2NvbF9taW5fd2lkdGgsXG5cdFx0XHRcdG1heFdpZHRoOiBzaXplLmZpcnN0X2NvbF9tYXhfd2lkdGgsXG5cdFx0XHRcdGhlYWRlckNlbnRlcjogdGhpcy5jdXJyZW50Vmlld1R5cGUgPT09IENhbGVuZGFyVmlld1R5cGUuV0VFSyA/IFwibW9udGhfbGFiZWxcIiA6IFwiY2FsZW5kYXJfbGFiZWxcIixcblx0XHRcdH0sXG5cdFx0KVxuXG5cdFx0dGhpcy5jb250ZW50Q29sdW1uID0gbmV3IFZpZXdDb2x1bW4oXG5cdFx0XHR7XG5cdFx0XHRcdHZpZXc6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLnZpZXdNb2RlbC5sb2FkQ2FsZW5kYXJDb2xvcnMoKVxuXHRcdFx0XHRcdHN3aXRjaCAodGhpcy5jdXJyZW50Vmlld1R5cGUpIHtcblx0XHRcdFx0XHRcdGNhc2UgQ2FsZW5kYXJWaWV3VHlwZS5NT05USDpcblx0XHRcdFx0XHRcdFx0cmV0dXJuIG0oQmFja2dyb3VuZENvbHVtbkxheW91dCwge1xuXHRcdFx0XHRcdFx0XHRcdGJhY2tncm91bmRDb2xvcjogdGhlbWUubmF2aWdhdGlvbl9iZyxcblx0XHRcdFx0XHRcdFx0XHRkZXNrdG9wVG9vbGJhcjogKCkgPT4gdGhpcy5yZW5kZXJEZXNrdG9wVG9vbGJhcigpLFxuXHRcdFx0XHRcdFx0XHRcdG1vYmlsZUhlYWRlcjogKCkgPT4gdGhpcy5yZW5kZXJNb2JpbGVIZWFkZXIoYXR0cnMuaGVhZGVyKSxcblx0XHRcdFx0XHRcdFx0XHRjb2x1bW5MYXlvdXQ6IG0oQ2FsZW5kYXJNb250aFZpZXcsIHtcblx0XHRcdFx0XHRcdFx0XHRcdHRlbXBvcmFyeUV2ZW50czogdGhpcy52aWV3TW9kZWwudGVtcG9yYXJ5RXZlbnRzLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZXZlbnRzRm9yRGF5czogdGhpcy52aWV3TW9kZWwuZXZlbnRzRm9yRGF5cyxcblx0XHRcdFx0XHRcdFx0XHRcdGdldEV2ZW50c09uRGF5c1RvUmVuZGVyOiB0aGlzLnZpZXdNb2RlbC5nZXRFdmVudHNPbkRheXNUb1JlbmRlci5iaW5kKHRoaXMudmlld01vZGVsKSxcblx0XHRcdFx0XHRcdFx0XHRcdG9uRXZlbnRDbGlja2VkOiAoY2FsZW5kYXJFdmVudCwgZG9tRXZlbnQpID0+IHRoaXMub25FdmVudFNlbGVjdGVkKGNhbGVuZGFyRXZlbnQsIGRvbUV2ZW50LCB0aGlzLmh0bWxTYW5pdGl6ZXIpLFxuXHRcdFx0XHRcdFx0XHRcdFx0b25FdmVudEtleURvd246IHRoaXMuaGFuZGxlRXZlbnRLZXlEb3duKCksXG5cdFx0XHRcdFx0XHRcdFx0XHRvbk5ld0V2ZW50OiAoZGF0ZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmNyZWF0ZU5ld0V2ZW50RGlhbG9nKGRhdGUpXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0c2VsZWN0ZWREYXRlOiB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZERhdGUoKSxcblx0XHRcdFx0XHRcdFx0XHRcdG9uRGF0ZVNlbGVjdGVkOiAoZGF0ZSwgY2FsZW5kYXJWaWV3VHlwZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLnNldFVybChjYWxlbmRhclZpZXdUeXBlLCBkYXRlLCB0cnVlKVxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdG9uQ2hhbmdlTW9udGg6IChuZXh0KSA9PiB0aGlzLnZpZXdQZXJpb2QoQ2FsZW5kYXJWaWV3VHlwZS5NT05USCwgbmV4dCksXG5cdFx0XHRcdFx0XHRcdFx0XHRhbVBtRm9ybWF0OiBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJTZXR0aW5nc0dyb3VwUm9vdC50aW1lRm9ybWF0ID09PSBUaW1lRm9ybWF0LlRXRUxWRV9IT1VSUyxcblx0XHRcdFx0XHRcdFx0XHRcdHN0YXJ0T2ZUaGVXZWVrOiBkb3duY2FzdChsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJTZXR0aW5nc0dyb3VwUm9vdC5zdGFydE9mVGhlV2VlayksXG5cdFx0XHRcdFx0XHRcdFx0XHRncm91cENvbG9yczogdGhpcy52aWV3TW9kZWwuY2FsZW5kYXJDb2xvcnMsXG5cdFx0XHRcdFx0XHRcdFx0XHRoaWRkZW5DYWxlbmRhcnM6IHRoaXMudmlld01vZGVsLmhpZGRlbkNhbGVuZGFycyxcblx0XHRcdFx0XHRcdFx0XHRcdGRyYWdIYW5kbGVyQ2FsbGJhY2tzOiB0aGlzLnZpZXdNb2RlbCxcblx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHRmbG9hdGluZ0FjdGlvbkJ1dHRvbjogdGhpcy5yZW5kZXJGYWIuYmluZCh0aGlzKSxcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdGNhc2UgQ2FsZW5kYXJWaWV3VHlwZS5EQVk6XG5cdFx0XHRcdFx0XHRcdHJldHVybiBtKEJhY2tncm91bmRDb2x1bW5MYXlvdXQsIHtcblx0XHRcdFx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IHRoZW1lLm5hdmlnYXRpb25fYmcsXG5cdFx0XHRcdFx0XHRcdFx0ZGVza3RvcFRvb2xiYXI6ICgpID0+IHRoaXMucmVuZGVyRGVza3RvcFRvb2xiYXIoKSxcblx0XHRcdFx0XHRcdFx0XHRtb2JpbGVIZWFkZXI6ICgpID0+IHRoaXMucmVuZGVyTW9iaWxlSGVhZGVyKGF0dHJzLmhlYWRlciksXG5cdFx0XHRcdFx0XHRcdFx0Y29sdW1uTGF5b3V0OiBtKE11bHRpRGF5Q2FsZW5kYXJWaWV3LCB7XG5cdFx0XHRcdFx0XHRcdFx0XHR0ZW1wb3JhcnlFdmVudHM6IHRoaXMudmlld01vZGVsLnRlbXBvcmFyeUV2ZW50cyxcblx0XHRcdFx0XHRcdFx0XHRcdGdldEV2ZW50c09uRGF5czogdGhpcy52aWV3TW9kZWwuZ2V0RXZlbnRzT25EYXlzVG9SZW5kZXIuYmluZCh0aGlzLnZpZXdNb2RlbCksXG5cdFx0XHRcdFx0XHRcdFx0XHRkYXlzSW5QZXJpb2Q6IDEsXG5cdFx0XHRcdFx0XHRcdFx0XHRvbkV2ZW50Q2xpY2tlZDogKGV2ZW50LCBkb21FdmVudCkgPT4gdGhpcy5vbkV2ZW50U2VsZWN0ZWQoZXZlbnQsIGRvbUV2ZW50LCB0aGlzLmh0bWxTYW5pdGl6ZXIpLFxuXHRcdFx0XHRcdFx0XHRcdFx0b25FdmVudEtleURvd246IHRoaXMuaGFuZGxlRXZlbnRLZXlEb3duKCksXG5cdFx0XHRcdFx0XHRcdFx0XHRvbk5ld0V2ZW50OiAoZGF0ZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmNyZWF0ZU5ld0V2ZW50RGlhbG9nKGRhdGUpXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0c2VsZWN0ZWREYXRlOiB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZERhdGUoKSxcblx0XHRcdFx0XHRcdFx0XHRcdG9uRGF0ZVNlbGVjdGVkOiAoZGF0ZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLnNldFVybChDYWxlbmRhclZpZXdUeXBlLkRBWSwgZGF0ZSlcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRncm91cENvbG9yczogdGhpcy52aWV3TW9kZWwuY2FsZW5kYXJDb2xvcnMsXG5cdFx0XHRcdFx0XHRcdFx0XHRvbkNoYW5nZVZpZXdQZXJpb2Q6IChuZXh0KSA9PiB0aGlzLnZpZXdQZXJpb2QoQ2FsZW5kYXJWaWV3VHlwZS5EQVksIG5leHQpLFxuXHRcdFx0XHRcdFx0XHRcdFx0c3RhcnRPZlRoZVdlZWs6IGRvd25jYXN0KGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkudXNlclNldHRpbmdzR3JvdXBSb290LnN0YXJ0T2ZUaGVXZWVrKSxcblx0XHRcdFx0XHRcdFx0XHRcdGRyYWdIYW5kbGVyQ2FsbGJhY2tzOiB0aGlzLnZpZXdNb2RlbCxcblx0XHRcdFx0XHRcdFx0XHRcdGlzRGF5U2VsZWN0b3JFeHBhbmRlZDogdGhpcy52aWV3TW9kZWwuaXNEYXlTZWxlY3RvckV4cGFuZGVkKCksXG5cdFx0XHRcdFx0XHRcdFx0XHR3ZWVrSW5kaWNhdG9yOiBjYWxlbmRhcldlZWsodGhpcy52aWV3TW9kZWwuc2VsZWN0ZWREYXRlKCksIHRoaXMudmlld01vZGVsLndlZWtTdGFydCksXG5cdFx0XHRcdFx0XHRcdFx0XHRzZWxlY3RlZFRpbWU6IHRoaXMudmlld01vZGVsLnNlbGVjdGVkVGltZSxcblx0XHRcdFx0XHRcdFx0XHRcdHNjcm9sbFBvc2l0aW9uOiB0aGlzLnZpZXdNb2RlbC5nZXRTY3JvbGxQb3NpdGlvbigpLFxuXHRcdFx0XHRcdFx0XHRcdFx0b25TY3JvbGxQb3NpdGlvbkNoYW5nZTogKG5ld1Bvc2l0aW9uOiBudW1iZXIpID0+IHRoaXMudmlld01vZGVsLnNldFNjcm9sbFBvc2l0aW9uKG5ld1Bvc2l0aW9uKSxcblx0XHRcdFx0XHRcdFx0XHRcdG9uVmlld0NoYW5nZWQ6ICh2bm9kZSkgPT4gdGhpcy52aWV3TW9kZWwuc2V0Vmlld1BhcmFtZXRlcnModm5vZGUuZG9tIGFzIEhUTUxFbGVtZW50KSxcblx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0XHRmbG9hdGluZ0FjdGlvbkJ1dHRvbjogdGhpcy5yZW5kZXJGYWIuYmluZCh0aGlzKSxcblx0XHRcdFx0XHRcdFx0fSlcblxuXHRcdFx0XHRcdFx0Y2FzZSBDYWxlbmRhclZpZXdUeXBlLldFRUs6XG5cdFx0XHRcdFx0XHRcdHJldHVybiBtKEJhY2tncm91bmRDb2x1bW5MYXlvdXQsIHtcblx0XHRcdFx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IHRoZW1lLm5hdmlnYXRpb25fYmcsXG5cdFx0XHRcdFx0XHRcdFx0ZGVza3RvcFRvb2xiYXI6ICgpID0+IHRoaXMucmVuZGVyRGVza3RvcFRvb2xiYXIoKSxcblx0XHRcdFx0XHRcdFx0XHRtb2JpbGVIZWFkZXI6ICgpID0+IHRoaXMucmVuZGVyTW9iaWxlSGVhZGVyKGF0dHJzLmhlYWRlciksXG5cdFx0XHRcdFx0XHRcdFx0Y29sdW1uTGF5b3V0OiBtKE11bHRpRGF5Q2FsZW5kYXJWaWV3LCB7XG5cdFx0XHRcdFx0XHRcdFx0XHR0ZW1wb3JhcnlFdmVudHM6IHRoaXMudmlld01vZGVsLnRlbXBvcmFyeUV2ZW50cyxcblx0XHRcdFx0XHRcdFx0XHRcdGdldEV2ZW50c09uRGF5czogdGhpcy52aWV3TW9kZWwuZ2V0RXZlbnRzT25EYXlzVG9SZW5kZXIuYmluZCh0aGlzLnZpZXdNb2RlbCksXG5cdFx0XHRcdFx0XHRcdFx0XHRkYXlzSW5QZXJpb2Q6IDcsXG5cdFx0XHRcdFx0XHRcdFx0XHRvbkV2ZW50Q2xpY2tlZDogKGV2ZW50LCBkb21FdmVudCkgPT4gdGhpcy5vbkV2ZW50U2VsZWN0ZWQoZXZlbnQsIGRvbUV2ZW50LCB0aGlzLmh0bWxTYW5pdGl6ZXIpLFxuXHRcdFx0XHRcdFx0XHRcdFx0b25FdmVudEtleURvd246IHRoaXMuaGFuZGxlRXZlbnRLZXlEb3duKCksXG5cdFx0XHRcdFx0XHRcdFx0XHRvbk5ld0V2ZW50OiAoZGF0ZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmNyZWF0ZU5ld0V2ZW50RGlhbG9nKGRhdGUpXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0c2VsZWN0ZWREYXRlOiB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZERhdGUoKSxcblx0XHRcdFx0XHRcdFx0XHRcdG9uRGF0ZVNlbGVjdGVkOiAoZGF0ZSwgdmlld1R5cGUpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy52aWV3TW9kZWwuc2VsZWN0ZWREYXRlKGRhdGUpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMuc2V0VXJsKHZpZXdUeXBlID8/IENhbGVuZGFyVmlld1R5cGUuV0VFSywgZGF0ZSlcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRzdGFydE9mVGhlV2VlazogZG93bmNhc3QobG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyU2V0dGluZ3NHcm91cFJvb3Quc3RhcnRPZlRoZVdlZWspLFxuXHRcdFx0XHRcdFx0XHRcdFx0Z3JvdXBDb2xvcnM6IHRoaXMudmlld01vZGVsLmNhbGVuZGFyQ29sb3JzLFxuXHRcdFx0XHRcdFx0XHRcdFx0b25DaGFuZ2VWaWV3UGVyaW9kOiAobmV4dCkgPT4gdGhpcy52aWV3UGVyaW9kKENhbGVuZGFyVmlld1R5cGUuV0VFSywgbmV4dCksXG5cdFx0XHRcdFx0XHRcdFx0XHRkcmFnSGFuZGxlckNhbGxiYWNrczogdGhpcy52aWV3TW9kZWwsXG5cdFx0XHRcdFx0XHRcdFx0XHRpc0RheVNlbGVjdG9yRXhwYW5kZWQ6IHRoaXMudmlld01vZGVsLmlzRGF5U2VsZWN0b3JFeHBhbmRlZCgpLFxuXHRcdFx0XHRcdFx0XHRcdFx0d2Vla0luZGljYXRvcjogY2FsZW5kYXJXZWVrKHRoaXMudmlld01vZGVsLnNlbGVjdGVkRGF0ZSgpLCB0aGlzLnZpZXdNb2RlbC53ZWVrU3RhcnQpLFxuXHRcdFx0XHRcdFx0XHRcdFx0c2VsZWN0ZWRUaW1lOiB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZFRpbWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRzY3JvbGxQb3NpdGlvbjogdGhpcy52aWV3TW9kZWwuZ2V0U2Nyb2xsUG9zaXRpb24oKSxcblx0XHRcdFx0XHRcdFx0XHRcdG9uU2Nyb2xsUG9zaXRpb25DaGFuZ2U6IChuZXdQb3NpdGlvbjogbnVtYmVyKSA9PiB0aGlzLnZpZXdNb2RlbC5zZXRTY3JvbGxQb3NpdGlvbihuZXdQb3NpdGlvbiksXG5cdFx0XHRcdFx0XHRcdFx0XHRvblZpZXdDaGFuZ2VkOiAodm5vZGUpID0+IHRoaXMudmlld01vZGVsLnNldFZpZXdQYXJhbWV0ZXJzKHZub2RlLmRvbSBhcyBIVE1MRWxlbWVudCksXG5cdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRcdFx0ZmxvYXRpbmdBY3Rpb25CdXR0b246IHRoaXMucmVuZGVyRmFiLmJpbmQodGhpcyksXG5cdFx0XHRcdFx0XHRcdH0pXG5cblx0XHRcdFx0XHRcdGNhc2UgQ2FsZW5kYXJWaWV3VHlwZS5BR0VOREE6XG5cdFx0XHRcdFx0XHRcdHJldHVybiBtKEJhY2tncm91bmRDb2x1bW5MYXlvdXQsIHtcblx0XHRcdFx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3I6IHRoZW1lLm5hdmlnYXRpb25fYmcsXG5cdFx0XHRcdFx0XHRcdFx0ZGVza3RvcFRvb2xiYXI6ICgpID0+IHRoaXMucmVuZGVyRGVza3RvcFRvb2xiYXIoKSxcblx0XHRcdFx0XHRcdFx0XHRtb2JpbGVIZWFkZXI6ICgpID0+IHRoaXMucmVuZGVyTW9iaWxlSGVhZGVyKGF0dHJzLmhlYWRlciksXG5cdFx0XHRcdFx0XHRcdFx0Y29sdW1uTGF5b3V0OiBtKENhbGVuZGFyQWdlbmRhVmlldywge1xuXHRcdFx0XHRcdFx0XHRcdFx0c2VsZWN0ZWREYXRlOiB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZERhdGUoKSxcblx0XHRcdFx0XHRcdFx0XHRcdHNlbGVjdGVkVGltZTogdGhpcy52aWV3TW9kZWwuc2VsZWN0ZWRUaW1lLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZXZlbnRzRm9yRGF5czogdGhpcy52aWV3TW9kZWwuZXZlbnRzRm9yRGF5cyxcblx0XHRcdFx0XHRcdFx0XHRcdGFtUG1Gb3JtYXQ6IHNob3VsZERlZmF1bHRUb0FtUG1UaW1lRm9ybWF0KCksXG5cdFx0XHRcdFx0XHRcdFx0XHRvbkV2ZW50Q2xpY2tlZDogKGV2ZW50LCBkb21FdmVudCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoc3R5bGVzLmlzRGVza3RvcExheW91dCgpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy52aWV3TW9kZWwudXBkYXRlUHJldmlld2VkRXZlbnQoZXZlbnQpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5vbkV2ZW50U2VsZWN0ZWQoZXZlbnQsIGRvbUV2ZW50LCB0aGlzLmh0bWxTYW5pdGl6ZXIpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRvbkV2ZW50S2V5RG93bjogKGV2ZW50LCBkb21FdmVudCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoaXNLZXlQcmVzc2VkKGRvbUV2ZW50LmtleSwgS2V5cy5SRVRVUk4sIEtleXMuU1BBQ0UpICYmICFkb21FdmVudC5yZXBlYXQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoc3R5bGVzLmlzRGVza3RvcExheW91dCgpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLnZpZXdNb2RlbC51cGRhdGVQcmV2aWV3ZWRFdmVudChldmVudClcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5zaG93Q2FsZW5kYXJFdmVudFBvcHVwQXRFdmVudChldmVudCwgZG9tRXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50LCB0aGlzLmh0bWxTYW5pdGl6ZXIpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChpc0tleVByZXNzZWQoZG9tRXZlbnQua2V5LCBLZXlzLkRFTEVURSkgJiYgIWRvbUV2ZW50LnJlcGVhdCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMub3BlbkRlbGV0ZVBvcHVwKGV2ZW50LCBkb21FdmVudClcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdGdyb3VwQ29sb3JzOiB0aGlzLnZpZXdNb2RlbC5jYWxlbmRhckNvbG9ycyxcblx0XHRcdFx0XHRcdFx0XHRcdGhpZGRlbkNhbGVuZGFyczogdGhpcy52aWV3TW9kZWwuaGlkZGVuQ2FsZW5kYXJzLFxuXHRcdFx0XHRcdFx0XHRcdFx0c3RhcnRPZlRoZVdlZWtPZmZzZXQ6IGdldFN0YXJ0T2ZUaGVXZWVrT2Zmc2V0Rm9yVXNlcihsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXJTZXR0aW5nc0dyb3VwUm9vdCksXG5cdFx0XHRcdFx0XHRcdFx0XHRpc0RheVNlbGVjdG9yRXhwYW5kZWQ6IHRoaXMudmlld01vZGVsLmlzRGF5U2VsZWN0b3JFeHBhbmRlZCgpLFxuXHRcdFx0XHRcdFx0XHRcdFx0b25EYXRlU2VsZWN0ZWQ6IChkYXRlKSA9PiB0aGlzLnNldFVybChDYWxlbmRhclZpZXdUeXBlLkFHRU5EQSwgZGF0ZSksXG5cdFx0XHRcdFx0XHRcdFx0XHRvblNob3dEYXRlOiAoZGF0ZTogRGF0ZSkgPT4gdGhpcy5zZXRVcmwoQ2FsZW5kYXJWaWV3VHlwZS5EQVksIGRhdGUpLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZXZlbnRQcmV2aWV3TW9kZWw6IHRoaXMudmlld01vZGVsLmV2ZW50UHJldmlld01vZGVsLFxuXHRcdFx0XHRcdFx0XHRcdFx0c2Nyb2xsUG9zaXRpb246IHRoaXMudmlld01vZGVsLmdldFNjcm9sbFBvc2l0aW9uKCksXG5cdFx0XHRcdFx0XHRcdFx0XHRvblNjcm9sbFBvc2l0aW9uQ2hhbmdlOiAobmV3UG9zaXRpb246IG51bWJlcikgPT4gdGhpcy52aWV3TW9kZWwuc2V0U2Nyb2xsUG9zaXRpb24obmV3UG9zaXRpb24pLFxuXHRcdFx0XHRcdFx0XHRcdFx0b25WaWV3Q2hhbmdlZDogKHZub2RlKSA9PiB0aGlzLnZpZXdNb2RlbC5zZXRWaWV3UGFyYW1ldGVycyh2bm9kZS5kb20gYXMgSFRNTEVsZW1lbnQpLFxuXHRcdFx0XHRcdFx0XHRcdFx0b25OZXdFdmVudDogKGRhdGUpID0+IHRoaXMuY3JlYXRlTmV3RXZlbnREaWFsb2coZGF0ZSksXG5cdFx0XHRcdFx0XHRcdFx0XHRvbkVkaXRDb250YWN0OiAoY29udGFjdCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRuZXcgQ29udGFjdEVkaXRvcihsb2NhdG9yLmVudGl0eUNsaWVudCwgY29udGFjdCkuc2hvdygpXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0b25Xcml0ZU1haWw6IGFzeW5jIChyZWNpcGllbnQpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgeyB3cml0ZU1haWwgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uLy4uL21haWwtYXBwL2NvbnRhY3RzL3ZpZXcvQ29udGFjdFZpZXcuanNcIilcblx0XHRcdFx0XHRcdFx0XHRcdFx0d3JpdGVNYWlsKHJlY2lwaWVudClcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0fSBzYXRpc2ZpZXMgQ2FsZW5kYXJBZ2VuZGFWaWV3QXR0cnMpLFxuXHRcdFx0XHRcdFx0XHRcdGZsb2F0aW5nQWN0aW9uQnV0dG9uOiB0aGlzLnJlbmRlckZhYi5iaW5kKHRoaXMpLFxuXHRcdFx0XHRcdFx0XHR9KVxuXG5cdFx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihgaW52YWxpZCBDYWxlbmRhclZpZXdUeXBlOiBcIiR7dGhpcy5jdXJyZW50Vmlld1R5cGV9XCJgKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRDb2x1bW5UeXBlLkJhY2tncm91bmQsXG5cdFx0XHR7XG5cdFx0XHRcdG1pbldpZHRoOiBzaXplLmNhbGVuZGFyX2ZpcnN0X2NvbF9taW5fd2lkdGggKyBzaXplLnRoaXJkX2NvbF9taW5fd2lkdGgsXG5cdFx0XHRcdG1heFdpZHRoOiBzaXplLnRoaXJkX2NvbF9tYXhfd2lkdGgsXG5cdFx0XHR9LFxuXHRcdClcblx0XHR0aGlzLnZpZXdTbGlkZXIgPSBuZXcgVmlld1NsaWRlcihbdGhpcy5zaWRlYmFyQ29sdW1uLCB0aGlzLmNvbnRlbnRDb2x1bW5dKVxuXG5cdFx0Y29uc3Qgc2hvcnRjdXRzID0gdGhpcy5zZXR1cFNob3J0Y3V0cygpXG5cblx0XHRjb25zdCBzdHJlYW1MaXN0ZW5lcnM6IFN0cmVhbTx2b2lkPltdID0gW11cblxuXHRcdHRoaXMub25jcmVhdGUgPSAoKSA9PiB7XG5cdFx0XHRrZXlNYW5hZ2VyLnJlZ2lzdGVyU2hvcnRjdXRzKHNob3J0Y3V0cylcblx0XHRcdC8vIGRvIGJvdGggYSB0aW1lb3V0IGFuZCBpbnRlcnZhbCB0byBlbnN1cmUgdGhlIHRpbWUgaW5kaWNhdG9yIGlzIGRvbmUgb24gdGhlIG1pbnV0ZSByYXRoZXIgdGhhbiBzb21lIGRlbGF5IGFmdGVyd2FyZHNcblx0XHRcdGlmICghdGhpcy5yZWRyYXdJbnRlcnZhbElkICYmICF0aGlzLnJlZHJhd1RpbWVvdXRJZCkge1xuXHRcdFx0XHRjb25zdCB0aW1lVG9OZXh0TWludXRlID0gKDYwIC0gbmV3IERhdGUoKS5nZXRTZWNvbmRzKCkpICogMTAwMFxuXHRcdFx0XHR0aGlzLnJlZHJhd1RpbWVvdXRJZCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0XHR0aGlzLnJlZHJhd0ludGVydmFsSWQgPSB3aW5kb3cuc2V0SW50ZXJ2YWwobS5yZWRyYXcsIDEwMDAgKiA2MClcblx0XHRcdFx0XHR0aGlzLnJlZHJhd1RpbWVvdXRJZCA9IG51bGxcblx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdH0sIHRpbWVUb05leHRNaW51dGUpXG5cdFx0XHR9XG5cdFx0XHRzdHJlYW1MaXN0ZW5lcnMucHVzaChcblx0XHRcdFx0dGhpcy52aWV3TW9kZWwuY2FsZW5kYXJJbnZpdGF0aW9ucy5tYXAoKCkgPT4ge1xuXHRcdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdFx0fSksXG5cdFx0XHQpXG5cdFx0XHRzdHJlYW1MaXN0ZW5lcnMucHVzaCh0aGlzLnZpZXdNb2RlbC5yZWRyYXcubWFwKG0ucmVkcmF3KSlcblx0XHR9XG5cblx0XHR0aGlzLm9ucmVtb3ZlID0gKCkgPT4ge1xuXHRcdFx0a2V5TWFuYWdlci51bnJlZ2lzdGVyU2hvcnRjdXRzKHNob3J0Y3V0cylcblx0XHRcdGlmICh0aGlzLnJlZHJhd1RpbWVvdXRJZCkge1xuXHRcdFx0XHR3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMucmVkcmF3VGltZW91dElkKVxuXHRcdFx0XHR0aGlzLnJlZHJhd1RpbWVvdXRJZCA9IG51bGxcblx0XHRcdH1cblx0XHRcdGlmICh0aGlzLnJlZHJhd0ludGVydmFsSWQpIHtcblx0XHRcdFx0d2luZG93LmNsZWFySW50ZXJ2YWwodGhpcy5yZWRyYXdJbnRlcnZhbElkKVxuXHRcdFx0XHR0aGlzLnJlZHJhd0ludGVydmFsSWQgPSBudWxsXG5cdFx0XHR9XG5cdFx0XHRmb3IgKGxldCBsaXN0ZW5lciBvZiBzdHJlYW1MaXN0ZW5lcnMpIHtcblx0XHRcdFx0bGlzdGVuZXIuZW5kKHRydWUpXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZGV2aWNlQ29uZmlnLmdldExhc3RTeW5jU3RyZWFtKCkubWFwKHJlZHJhdylcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRmFiKCk6IENoaWxkcmVuIHtcblx0XHRpZiAoY2xpZW50LmlzQ2FsZW5kYXJBcHAoKSkge1xuXHRcdFx0cmV0dXJuIG0oRmxvYXRpbmdBY3Rpb25CdXR0b24sIHtcblx0XHRcdFx0aWNvbjogSWNvbnMuQWRkLFxuXHRcdFx0XHR0aXRsZTogXCJuZXdFdmVudF9hY3Rpb25cIixcblx0XHRcdFx0Y29sb3JzOiBCdXR0b25Db2xvci5GYWIsXG5cdFx0XHRcdGFjdGlvbjogKCkgPT4gdGhpcy5jcmVhdGVOZXdFdmVudERpYWxvZygpLFxuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRyZXR1cm4gbnVsbFxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJEZXNrdG9wVG9vbGJhcigpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oQ2FsZW5kYXJEZXNrdG9wVG9vbGJhciwge1xuXHRcdFx0bmF2Q29uZmlnOiBjYWxlbmRhck5hdkNvbmZpZ3VyYXRpb24odGhpcy5jdXJyZW50Vmlld1R5cGUsIHRoaXMudmlld01vZGVsLnNlbGVjdGVkRGF0ZSgpLCB0aGlzLnZpZXdNb2RlbC53ZWVrU3RhcnQsIFwiZGV0YWlsZWRcIiwgKHZpZXdUeXBlLCBuZXh0KSA9PlxuXHRcdFx0XHR0aGlzLnZpZXdQZXJpb2Qodmlld1R5cGUsIG5leHQpLFxuXHRcdFx0KSxcblx0XHRcdHZpZXdUeXBlOiB0aGlzLmN1cnJlbnRWaWV3VHlwZSxcblx0XHRcdG9uVG9kYXk6ICgpID0+IHtcblx0XHRcdFx0Ly8gaW4gY2FzZSBpdCBoYXMgYmVlbiBzZXQsIHdoZW4gb25Ub2RheSBpcyBjYWxsZWQgd2UgZGVmaW5pdGVseSBkbyBub3Qgd2FudCB0aGUgdGltZSB0byBiZSBpZ25vcmVkXG5cdFx0XHRcdHRoaXMudmlld01vZGVsLmlnbm9yZU5leHRWYWxpZFRpbWVTZWxlY3Rpb24gPSBmYWxzZVxuXHRcdFx0XHR0aGlzLnNldFVybChtLnJvdXRlLnBhcmFtKFwidmlld1wiKSwgbmV3IERhdGUoKSlcblx0XHRcdH0sXG5cdFx0XHRvblZpZXdUeXBlU2VsZWN0ZWQ6ICh2aWV3VHlwZSkgPT4gdGhpcy5zZXRVcmwodmlld1R5cGUsIHRoaXMudmlld01vZGVsLnNlbGVjdGVkRGF0ZSgpLCBmYWxzZSwgdHJ1ZSksXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTW9iaWxlSGVhZGVyKGhlYWRlcjogQXBwSGVhZGVyQXR0cnMpIHtcblx0XHRyZXR1cm4gbShDYWxlbmRhck1vYmlsZUhlYWRlciwge1xuXHRcdFx0Li4uaGVhZGVyLFxuXHRcdFx0dmlld1R5cGU6IHRoaXMuY3VycmVudFZpZXdUeXBlLFxuXHRcdFx0dmlld1NsaWRlcjogdGhpcy52aWV3U2xpZGVyLFxuXHRcdFx0c2hvd0V4cGFuZEljb246ICFzdHlsZXMuaXNEZXNrdG9wTGF5b3V0KCkgJiYgdGhpcy5jdXJyZW50Vmlld1R5cGUgIT09IENhbGVuZGFyVmlld1R5cGUuTU9OVEgsXG5cdFx0XHRpc0RheVNlbGVjdG9yRXhwYW5kZWQ6IHRoaXMudmlld01vZGVsLmlzRGF5U2VsZWN0b3JFeHBhbmRlZCgpLFxuXHRcdFx0bmF2Q29uZmlndXJhdGlvbjogY2FsZW5kYXJOYXZDb25maWd1cmF0aW9uKFxuXHRcdFx0XHR0aGlzLmN1cnJlbnRWaWV3VHlwZSxcblx0XHRcdFx0dGhpcy52aWV3TW9kZWwuc2VsZWN0ZWREYXRlKCksXG5cdFx0XHRcdHRoaXMudmlld01vZGVsLndlZWtTdGFydCxcblx0XHRcdFx0XCJzaG9ydFwiLFxuXHRcdFx0XHQodmlld1R5cGUsIG5leHQpID0+IHRoaXMudmlld1BlcmlvZCh2aWV3VHlwZSwgbmV4dCksXG5cdFx0XHQpLFxuXHRcdFx0b25DcmVhdGVFdmVudDogKCkgPT4gdGhpcy5jcmVhdGVOZXdFdmVudERpYWxvZygpLFxuXHRcdFx0b25Ub2RheTogKCkgPT4ge1xuXHRcdFx0XHQvLyBpbiBjYXNlIGl0IGhhcyBiZWVuIHNldCwgd2hlbiBvblRvZGF5IGlzIGNhbGxlZCB3ZSBkZWZpbml0ZWx5IGRvIG5vdCB3YW50IHRoZSB0aW1lIHRvIGJlIGlnbm9yZWRcblx0XHRcdFx0dGhpcy52aWV3TW9kZWwuaWdub3JlTmV4dFZhbGlkVGltZVNlbGVjdGlvbiA9IGZhbHNlXG5cdFx0XHRcdHRoaXMuc2V0VXJsKG0ucm91dGUucGFyYW0oXCJ2aWV3XCIpLCBuZXcgRGF0ZSgpKVxuXHRcdFx0fSxcblx0XHRcdG9uVmlld1R5cGVTZWxlY3RlZDogKHZpZXdUeXBlKSA9PiB0aGlzLnNldFVybCh2aWV3VHlwZSwgdGhpcy52aWV3TW9kZWwuc2VsZWN0ZWREYXRlKCksIGZhbHNlLCB0cnVlKSxcblx0XHRcdG9uVGFwOiAoX2V2ZW50LCBkb20pID0+IHtcblx0XHRcdFx0aWYgKHRoaXMuY3VycmVudFZpZXdUeXBlICE9PSBDYWxlbmRhclZpZXdUeXBlLk1PTlRIICYmIHN0eWxlcy5pc1NpbmdsZUNvbHVtbkxheW91dCgpKSB7XG5cdFx0XHRcdFx0dGhpcy52aWV3TW9kZWwuc2V0RGF5U2VsZWN0b3JFeHBhbmRlZCghdGhpcy52aWV3TW9kZWwuaXNEYXlTZWxlY3RvckV4cGFuZGVkKCkpXG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIXN0eWxlcy5pc0Rlc2t0b3BMYXlvdXQoKSAmJiB0aGlzLmN1cnJlbnRWaWV3VHlwZSAhPT0gQ2FsZW5kYXJWaWV3VHlwZS5NT05USCkge1xuXHRcdFx0XHRcdGlmICh0aGlzLnZpZXdNb2RlbC5pc0RheVNlbGVjdG9yRXhwYW5kZWQoKSkge1xuXHRcdFx0XHRcdFx0dGhpcy52aWV3TW9kZWwuc2V0RGF5U2VsZWN0b3JFeHBhbmRlZChmYWxzZSlcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR0aGlzLnNob3dDYWxlbmRhclBvcHVwKGRvbSlcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBzZXR1cFNob3J0Y3V0cygpOiBTaG9ydGN1dFtdIHtcblx0XHRjb25zdCBnZXRJZk5vdFZpZXcgPSAodmlld1R5cGU6IENhbGVuZGFyVmlld1R5cGUgfCBDYWxlbmRhclZpZXdUeXBlW10pID0+IHtcblx0XHRcdHJldHVybiBBcnJheS5pc0FycmF5KHZpZXdUeXBlKVxuXHRcdFx0XHQ/ICgpID0+IHtcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgaXRlbSBvZiB2aWV3VHlwZSkge1xuXHRcdFx0XHRcdFx0XHRpZiAoaXRlbSA9PT0gdGhpcy5jdXJyZW50Vmlld1R5cGUpIHJldHVybiBmYWxzZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdFx0ICB9XG5cdFx0XHRcdDogKCkgPT4ge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuY3VycmVudFZpZXdUeXBlICE9PSB2aWV3VHlwZVxuXHRcdFx0XHQgIH1cblx0XHR9XG5cdFx0Y29uc3QgZ2VuZXJhdGVQZXJpb2RTaG9ydGN1dCA9IChrZXk6IEtleSwgbmV4dDogYm9vbGVhbik6IFNob3J0Y3V0ID0+IHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGtleSxcblx0XHRcdFx0ZW5hYmxlZDogZ2V0SWZOb3RWaWV3KENhbGVuZGFyVmlld1R5cGUuQUdFTkRBKSxcblx0XHRcdFx0ZXhlYzogKCkgPT4gdGhpcy52aWV3UGVyaW9kKHRoaXMuY3VycmVudFZpZXdUeXBlLCBuZXh0KSxcblx0XHRcdFx0aGVscDogbmV4dCA/IFwidmlld05leHRQZXJpb2RfYWN0aW9uXCIgOiBcInZpZXdQcmV2UGVyaW9kX2FjdGlvblwiLFxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gW1xuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuT05FLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB0aGlzLnNldFVybChDYWxlbmRhclZpZXdUeXBlLldFRUssIHRoaXMudmlld01vZGVsLnNlbGVjdGVkRGF0ZSgpKSxcblx0XHRcdFx0aGVscDogXCJzd2l0Y2hXZWVrVmlld19hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5UV08sXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHRoaXMuc2V0VXJsKENhbGVuZGFyVmlld1R5cGUuTU9OVEgsIHRoaXMudmlld01vZGVsLnNlbGVjdGVkRGF0ZSgpKSxcblx0XHRcdFx0aGVscDogXCJzd2l0Y2hNb250aFZpZXdfYWN0aW9uXCIsXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuVEhSRUUsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHRoaXMuc2V0VXJsKENhbGVuZGFyVmlld1R5cGUuQUdFTkRBLCB0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZERhdGUoKSksXG5cdFx0XHRcdGhlbHA6IFwic3dpdGNoQWdlbmRhVmlld19hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5ULFxuXHRcdFx0XHRleGVjOiAoKSA9PiB0aGlzLnNldFVybChtLnJvdXRlLnBhcmFtKFwidmlld1wiKSwgbmV3IERhdGUoKSksXG5cdFx0XHRcdGhlbHA6IFwidmlld1RvZGF5X2FjdGlvblwiLFxuXHRcdFx0fSxcblx0XHRcdGdlbmVyYXRlUGVyaW9kU2hvcnRjdXQoS2V5cy5KLCB0cnVlKSxcblx0XHRcdGdlbmVyYXRlUGVyaW9kU2hvcnRjdXQoS2V5cy5LLCBmYWxzZSksXG5cdFx0XHRnZW5lcmF0ZVBlcmlvZFNob3J0Y3V0KEtleXMuUklHSFQsIHRydWUpLFxuXHRcdFx0Z2VuZXJhdGVQZXJpb2RTaG9ydGN1dChLZXlzLkxFRlQsIGZhbHNlKSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLk4sXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLmNyZWF0ZU5ld0V2ZW50RGlhbG9nKClcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscDogXCJuZXdFdmVudF9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5VUCxcblx0XHRcdFx0ZW5hYmxlZDogZ2V0SWZOb3RWaWV3KFtDYWxlbmRhclZpZXdUeXBlLk1PTlRILCBDYWxlbmRhclZpZXdUeXBlLkFHRU5EQV0pLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy52aWV3TW9kZWwuc2Nyb2xsKC0xMClcblx0XHRcdFx0fSxcblx0XHRcdFx0aGVscDogXCJzY3JvbGxVcF9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5ET1dOLFxuXHRcdFx0XHRlbmFibGVkOiBnZXRJZk5vdFZpZXcoW0NhbGVuZGFyVmlld1R5cGUuTU9OVEgsIENhbGVuZGFyVmlld1R5cGUuQUdFTkRBXSksXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLnZpZXdNb2RlbC5zY3JvbGwoMTApXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhlbHA6IFwic2Nyb2xsRG93bl9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5QQUdFX1VQLFxuXHRcdFx0XHRlbmFibGVkOiBnZXRJZk5vdFZpZXcoQ2FsZW5kYXJWaWV3VHlwZS5NT05USCksXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHRjb25zdCB2aWV3U2l6ZSA9IHRoaXMudmlld01vZGVsLmdldFZpZXdTaXplKClcblx0XHRcdFx0XHRpZiAodmlld1NpemUpIHRoaXMudmlld01vZGVsLnNjcm9sbCgtdmlld1NpemUpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhlbHA6IFwic2Nyb2xsVG9QcmV2aW91c1NjcmVlbl9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5QQUdFX0RPV04sXG5cdFx0XHRcdGVuYWJsZWQ6IGdldElmTm90VmlldyhDYWxlbmRhclZpZXdUeXBlLk1PTlRIKSxcblx0XHRcdFx0ZXhlYzogKCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHZpZXdTaXplID0gdGhpcy52aWV3TW9kZWwuZ2V0Vmlld1NpemUoKVxuXHRcdFx0XHRcdGlmICh2aWV3U2l6ZSkgdGhpcy52aWV3TW9kZWwuc2Nyb2xsKHZpZXdTaXplKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRoZWxwOiBcInNjcm9sbFRvTmV4dFNjcmVlbl9hY3Rpb25cIixcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5IT01FLFxuXHRcdFx0XHRlbmFibGVkOiBnZXRJZk5vdFZpZXcoQ2FsZW5kYXJWaWV3VHlwZS5NT05USCksXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLnZpZXdNb2RlbC5zZXRTY3JvbGxQb3NpdGlvbigwKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRoZWxwOiBcInNjcm9sbFRvVG9wX2FjdGlvblwiLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLkVORCxcblx0XHRcdFx0ZW5hYmxlZDogZ2V0SWZOb3RWaWV3KENhbGVuZGFyVmlld1R5cGUuTU9OVEgpLFxuXHRcdFx0XHRleGVjOiAoKSA9PiB7XG5cdFx0XHRcdFx0Ly8gU29ycnkgZm9yIHRoZSBkYXRlZCBtZW1lIChpdCdzIG92ZXIgbmluZS10aG91c2FuZCEpXG5cdFx0XHRcdFx0dGhpcy52aWV3TW9kZWwuc2V0U2Nyb2xsUG9zaXRpb24odGhpcy52aWV3TW9kZWwuZ2V0U2Nyb2xsTWF4aW11bSgpID8/IDkwMDEpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhlbHA6IFwic2Nyb2xsVG9Cb3R0b21fYWN0aW9uXCIsXG5cdFx0XHR9LFxuXHRcdF1cblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgY3JlYXRlTmV3RXZlbnREaWFsb2coZGF0ZTogRGF0ZSB8IG51bGwgPSBudWxsKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgZGF0ZVRvVXNlID0gZGF0ZSA/PyBzZXROZXh0SGFsZkhvdXIobmV3IERhdGUodGhpcy52aWV3TW9kZWwuc2VsZWN0ZWREYXRlKCkpKVxuXG5cdFx0Ly8gRGlzYWxsb3cgY3JlYXRpb24gb2YgZXZlbnRzIHdoZW4gdGhlcmUgaXMgbm8gZXhpc3RpbmcgY2FsZW5kYXJcblx0XHRsZXQgY2FsZW5kYXJJbmZvcyA9IHRoaXMudmlld01vZGVsLmdldENhbGVuZGFySW5mb3NDcmVhdGVJZk5lZWRlZCgpXG5cblx0XHRpZiAoY2FsZW5kYXJJbmZvcyBpbnN0YW5jZW9mIFByb21pc2UpIHtcblx0XHRcdGF3YWl0IHNob3dQcm9ncmVzc0RpYWxvZyhcInBsZWFzZVdhaXRfbXNnXCIsIGNhbGVuZGFySW5mb3MpXG5cdFx0fVxuXG5cdFx0Y29uc3QgbWFpbGJveERldGFpbHMgPSBhd2FpdCBsb2NhdG9yLm1haWxib3hNb2RlbC5nZXRVc2VyTWFpbGJveERldGFpbHMoKVxuXHRcdGNvbnN0IG1haWxib3hQcm9wZXJ0aWVzID0gYXdhaXQgbG9jYXRvci5tYWlsYm94TW9kZWwuZ2V0TWFpbGJveFByb3BlcnRpZXMobWFpbGJveERldGFpbHMubWFpbGJveEdyb3VwUm9vdClcblx0XHRjb25zdCBtb2RlbCA9IGF3YWl0IGxvY2F0b3IuY2FsZW5kYXJFdmVudE1vZGVsKENhbGVuZGFyT3BlcmF0aW9uLkNyZWF0ZSwgZ2V0RXZlbnRXaXRoRGVmYXVsdFRpbWVzKGRhdGVUb1VzZSksIG1haWxib3hEZXRhaWxzLCBtYWlsYm94UHJvcGVydGllcywgbnVsbClcblx0XHRpZiAobW9kZWwpIHtcblx0XHRcdGNvbnN0IGV2ZW50RWRpdG9yID0gbmV3IEV2ZW50RWRpdG9yRGlhbG9nKClcblx0XHRcdGF3YWl0IGV2ZW50RWRpdG9yLnNob3dOZXdDYWxlbmRhckV2ZW50RWRpdERpYWxvZyhtb2RlbClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHZpZXdQZXJpb2Qodmlld1R5cGU6IENhbGVuZGFyVmlld1R5cGUsIG5leHQ6IGJvb2xlYW4pIHtcblx0XHRsZXQgZHVyYXRpb25cblx0XHRsZXQgdW5pdDogXCJkYXlcIiB8IFwid2Vla1wiIHwgXCJtb250aFwiXG5cblx0XHRzd2l0Y2ggKHZpZXdUeXBlKSB7XG5cdFx0XHRjYXNlIENhbGVuZGFyVmlld1R5cGUuTU9OVEg6XG5cdFx0XHRcdGR1cmF0aW9uID0ge1xuXHRcdFx0XHRcdG1vbnRoOiAxLFxuXHRcdFx0XHR9XG5cdFx0XHRcdHVuaXQgPSBcIm1vbnRoXCJcblx0XHRcdFx0YnJlYWtcblxuXHRcdFx0Y2FzZSBDYWxlbmRhclZpZXdUeXBlLldFRUs6XG5cdFx0XHRcdGR1cmF0aW9uID0ge1xuXHRcdFx0XHRcdHdlZWs6IDEsXG5cdFx0XHRcdH1cblx0XHRcdFx0dW5pdCA9IFwid2Vla1wiXG5cdFx0XHRcdGJyZWFrXG5cblx0XHRcdGNhc2UgQ2FsZW5kYXJWaWV3VHlwZS5EQVk6XG5cdFx0XHRcdGR1cmF0aW9uID0ge1xuXHRcdFx0XHRcdGRheTogMSxcblx0XHRcdFx0fVxuXHRcdFx0XHR1bml0ID0gXCJkYXlcIlxuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSBDYWxlbmRhclZpZXdUeXBlLkFHRU5EQTpcblx0XHRcdFx0ZHVyYXRpb24gPSBzdHlsZXMuaXNEZXNrdG9wTGF5b3V0KClcblx0XHRcdFx0XHQ/IHsgZGF5OiAxIH1cblx0XHRcdFx0XHQ6IHtcblx0XHRcdFx0XHRcdFx0d2VlazogdGhpcy52aWV3TW9kZWwuaXNEYXlTZWxlY3RvckV4cGFuZGVkKCkgPyAwIDogMSxcblx0XHRcdFx0XHRcdFx0bW9udGg6IHRoaXMudmlld01vZGVsLmlzRGF5U2VsZWN0b3JFeHBhbmRlZCgpID8gMSA6IDAsXG5cdFx0XHRcdFx0ICB9XG5cdFx0XHRcdHVuaXQgPSBcImRheVwiXG5cdFx0XHRcdGJyZWFrXG5cblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBQcm9ncmFtbWluZ0Vycm9yKFwiSW52YWxpZCBDYWxlbmRhclZpZXdUeXBlOiBcIiArIHZpZXdUeXBlKVxuXHRcdH1cblxuXHRcdGNvbnN0IGRhdGVUaW1lID0gRGF0ZVRpbWUuZnJvbUpTRGF0ZSh0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZERhdGUoKSlcblx0XHRjb25zdCBuZXdEYXRlID0gbmV4dCA/IGRhdGVUaW1lLnBsdXMoZHVyYXRpb24pLnN0YXJ0T2YodW5pdCkudG9KU0RhdGUoKSA6IGRhdGVUaW1lLm1pbnVzKGR1cmF0aW9uKS5zdGFydE9mKHVuaXQpLnRvSlNEYXRlKClcblxuXHRcdHRoaXMudmlld01vZGVsLnNlbGVjdGVkRGF0ZShuZXdEYXRlKVxuXHRcdC8vIGlnbm9yZU5leHRUaW1lU2VsZWN0aW9uIGlzIHNldCB0byB0cnVlIGhlcmUsIGFzIHZpZXdQZXJpb2QgaXMgb25seSBjYWxsZWQgd2hlbiBjaGFuZ2luZyB0aGUgdmlldyBieSBzd2lwaW5nIChvciB1c2luZyBwcmV2aW91cy9uZXh0IGJ1dHRvbnMpXG5cdFx0Ly8gYW5kIHdlIGRvbid0IHdhbnQgamFycmluZyB0aW1lIGp1bXBzIHdoZW4gZG9pbmcgdGhhdFxuXHRcdHRoaXMudmlld01vZGVsLmlnbm9yZU5leHRWYWxpZFRpbWVTZWxlY3Rpb24gPSB0cnVlXG5cdFx0dGhpcy5zZXRVcmwodmlld1R5cGUsIG5ld0RhdGUsIGZhbHNlKVxuXG5cdFx0bS5yZWRyYXcoKVxuXHR9XG5cblx0cHJpdmF0ZSBvblByZXNzZWRBZGRDYWxlbmRhcihjYWxlbmRhclR5cGU6IENhbGVuZGFyVHlwZSkge1xuXHRcdGNvbnN0IHVzZXJDb250cm9sbGVyID0gbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKVxuXHRcdGlmICh1c2VyQ29udHJvbGxlci5pc0ZyZWVBY2NvdW50KCkpIHtcblx0XHRcdHNob3dOb3RBdmFpbGFibGVGb3JGcmVlRGlhbG9nKClcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHRpZiAoY2FsZW5kYXJUeXBlID09PSBDYWxlbmRhclR5cGUuVVJMKVxuXHRcdFx0dXNlckNvbnRyb2xsZXIuaXNOZXdQYWlkUGxhbigpLnRoZW4oKGlzTmV3UGFpZFBsYW4pID0+IHtcblx0XHRcdFx0aWYgKGlzTmV3UGFpZFBsYW4pIHRoaXMuc2hvd0NyZWF0ZUNhbGVuZGFyRGlhbG9nKGNhbGVuZGFyVHlwZSlcblx0XHRcdFx0ZWxzZSBzaG93UGxhblVwZ3JhZGVSZXF1aXJlZERpYWxvZyhOZXdQYWlkUGxhbnMpXG5cdFx0XHR9KVxuXHRcdGVsc2UgdGhpcy5zaG93Q3JlYXRlQ2FsZW5kYXJEaWFsb2coY2FsZW5kYXJUeXBlKVxuXHR9XG5cblx0cHJpdmF0ZSBzaG93Q3JlYXRlQ2FsZW5kYXJEaWFsb2coY2FsZW5kYXJUeXBlOiBDYWxlbmRhclR5cGUpIHtcblx0XHRjb25zdCBjcmVhdGVOb3JtYWxDYWxlbmRhciA9IGFzeW5jIChkaWFsb2c6IERpYWxvZywgcHJvcGVydGllczogQ2FsZW5kYXJQcm9wZXJ0aWVzLCBjYWxlbmRhck1vZGVsOiBDYWxlbmRhck1vZGVsKSA9PiB7XG5cdFx0XHRhd2FpdCBjYWxlbmRhck1vZGVsLmNyZWF0ZUNhbGVuZGFyKHByb3BlcnRpZXMubmFtZSwgcHJvcGVydGllcy5jb2xvciwgcHJvcGVydGllcy5hbGFybXMsIG51bGwpXG5cdFx0XHRkaWFsb2cuY2xvc2UoKVxuXHRcdH1cblx0XHRjb25zdCBjcmVhdGVFeHRlcm5hbENhbGVuZGFyID0gYXN5bmMgKGRpYWxvZzogRGlhbG9nLCBwcm9wZXJ0aWVzOiBDYWxlbmRhclByb3BlcnRpZXMsIGNhbGVuZGFyTW9kZWw6IENhbGVuZGFyTW9kZWwpID0+IHtcblx0XHRcdGNvbnN0IGlDYWxTdHIgPSBhd2FpdCBoYW5kbGVVcmxTdWJzY3JpcHRpb24oY2FsZW5kYXJNb2RlbCwgcHJvcGVydGllcy5zb3VyY2VVcmwhKVxuXHRcdFx0aWYgKGlDYWxTdHIgaW5zdGFuY2VvZiBFcnJvcikgdGhyb3cgaUNhbFN0clxuXG5cdFx0XHRsZXQgZXZlbnRzOiBQYXJzZWRFdmVudFtdID0gW11cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGV2ZW50cyA9IHBhcnNlQ2FsZW5kYXJTdHJpbmdEYXRhKGlDYWxTdHIsIGdldFRpbWVab25lKCkpLmNvbnRlbnRzXG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGF3YWl0IERpYWxvZy5tZXNzYWdlKFwiaW52YWxpZElDYWxfZXJyb3JcIiwgZS5tZXNzYWdlKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgY2FsZW5kYXJHcm91cCA9IGF3YWl0IGNhbGVuZGFyTW9kZWwuY3JlYXRlQ2FsZW5kYXIoZ2V0RXh0ZXJuYWxDYWxlbmRhck5hbWUoaUNhbFN0ciksIHByb3BlcnRpZXMuY29sb3IsIFtdLCBwcm9wZXJ0aWVzLnNvdXJjZVVybClcblx0XHRcdGNvbnN0IGNhbGVuZGFyR3JvdXBSb290ID0gYXdhaXQgbG9jYXRvci5lbnRpdHlDbGllbnQubG9hZChDYWxlbmRhckdyb3VwUm9vdFR5cGVSZWYsIGNhbGVuZGFyR3JvdXAuX2lkKVxuXHRcdFx0ZGV2aWNlQ29uZmlnLnVwZGF0ZUxhc3RTeW5jKGNhbGVuZGFyR3JvdXAuX2lkKVxuXHRcdFx0YXdhaXQgaGFuZGxlQ2FsZW5kYXJJbXBvcnQoY2FsZW5kYXJHcm91cFJvb3QsIGV2ZW50cywgQ2FsZW5kYXJUeXBlLlVSTClcblx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0fVxuXG5cdFx0c3dpdGNoIChjYWxlbmRhclR5cGUpIHtcblx0XHRcdGNhc2UgQ2FsZW5kYXJUeXBlLk5PUk1BTDpcblx0XHRcdFx0c2hvd0NyZWF0ZUVkaXRDYWxlbmRhckRpYWxvZyh7XG5cdFx0XHRcdFx0Y2FsZW5kYXJUeXBlLFxuXHRcdFx0XHRcdHRpdGxlVGV4dElkOiBcImFkZF9hY3Rpb25cIixcblx0XHRcdFx0XHRzaGFyZWQ6IGZhbHNlLFxuXHRcdFx0XHRcdG9rQWN0aW9uOiBjcmVhdGVOb3JtYWxDYWxlbmRhcixcblx0XHRcdFx0XHRva1RleHRJZDogXCJzYXZlX2FjdGlvblwiLFxuXHRcdFx0XHRcdGNhbGVuZGFyTW9kZWw6IHRoaXMudmlld01vZGVsLmdldENhbGVuZGFyTW9kZWwoKSxcblx0XHRcdFx0fSlcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgQ2FsZW5kYXJUeXBlLlVSTDpcblx0XHRcdFx0c2hvd0NyZWF0ZUVkaXRDYWxlbmRhckRpYWxvZyh7XG5cdFx0XHRcdFx0Y2FsZW5kYXJUeXBlLFxuXHRcdFx0XHRcdHRpdGxlVGV4dElkOiBcIm5ld0NhbGVuZGFyU3Vic2NyaXB0aW9uc0RpYWxvZ190aXRsZVwiLFxuXHRcdFx0XHRcdHNoYXJlZDogZmFsc2UsXG5cdFx0XHRcdFx0b2tBY3Rpb246IGNyZWF0ZUV4dGVybmFsQ2FsZW5kYXIsXG5cdFx0XHRcdFx0b2tUZXh0SWQ6IFwic3Vic2NyaWJlX2FjdGlvblwiLFxuXHRcdFx0XHRcdHdhcm5pbmdNZXNzYWdlOiAoKSA9PiBtKFwiLnNtYWxsZXIuY29udGVudC1mZ1wiLCBsYW5nLmdldChcImV4dGVybmFsQ2FsZW5kYXJJbmZvX21zZ1wiKSksXG5cdFx0XHRcdFx0Y2FsZW5kYXJNb2RlbDogdGhpcy52aWV3TW9kZWwuZ2V0Q2FsZW5kYXJNb2RlbCgpLFxuXHRcdFx0XHR9KVxuXHRcdFx0XHRicmVha1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQ2FsZW5kYXJzKHJlbmRlclR5cGVzOiBSZW5kZXJUeXBlW10pOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgaW5jbHVkZUxvY2FsQ2FsZW5kYXJzID0gcmVuZGVyVHlwZXMuaW5jbHVkZXMoUmVuZGVyVHlwZS5DbGllbnRPbmx5KVxuXHRcdGNvbnN0IHRvZ2dsZUhpZGRlbiA9ICh2aWV3TW9kZWw6IENhbGVuZGFyVmlld01vZGVsLCBncm91cFJvb3RJZDogc3RyaW5nKSA9PiB7XG5cdFx0XHRjb25zdCBuZXdIaWRkZW5DYWxlbmRhcnMgPSBuZXcgU2V0KHZpZXdNb2RlbC5oaWRkZW5DYWxlbmRhcnMpXG5cdFx0XHRpZiAodmlld01vZGVsLmhpZGRlbkNhbGVuZGFycy5oYXMoZ3JvdXBSb290SWQpKSB7XG5cdFx0XHRcdG5ld0hpZGRlbkNhbGVuZGFycy5kZWxldGUoZ3JvdXBSb290SWQpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRuZXdIaWRkZW5DYWxlbmRhcnMuYWRkKGdyb3VwUm9vdElkKVxuXHRcdFx0fVxuXG5cdFx0XHR2aWV3TW9kZWwuc2V0SGlkZGVuQ2FsZW5kYXJzKG5ld0hpZGRlbkNhbGVuZGFycylcblx0XHR9XG5cblx0XHRjb25zdCBjYWxlbmRhckluZm9zID0gWy4uLnRoaXMudmlld01vZGVsLmNhbGVuZGFySW5mb3MsIC4uLihpbmNsdWRlTG9jYWxDYWxlbmRhcnMgPyB0aGlzLnZpZXdNb2RlbC5jbGllbnRPbmx5Q2FsZW5kYXJzIDogW10pXVxuXG5cdFx0Y29uc3QgZmlsdGVyZWRDYWxlbmRhckluZm9zID0gY2FsZW5kYXJJbmZvcy5maWx0ZXIoKFtfLCBjYWxlbmRhckluZm9dKSA9PiB7XG5cdFx0XHQvKipcblx0XHRcdCAqIERpbmFtaWNhbGx5IGZpbHRlciBjYWxlbmRhckluZm9MaXN0IGFjY29yZGluZyB0byB0aGUgcmVuZGVyVHlwZXNcblx0XHRcdCAqL1xuXHRcdFx0Y29uc3QgY29uZGl0aW9uczogQXJyYXk8KGNhbGVuZGFySW5mbzogQ2FsZW5kYXJJbmZvKSA9PiBib29sZWFuPiA9IFtdXG5cdFx0XHRmb3IgKGNvbnN0IHJlbmRlclR5cGUgb2YgcmVuZGVyVHlwZXMpIHtcblx0XHRcdFx0c3dpdGNoIChyZW5kZXJUeXBlKSB7XG5cdFx0XHRcdFx0Y2FzZSBSZW5kZXJUeXBlLkNsaWVudE9ubHk6XG5cdFx0XHRcdFx0XHRjb25kaXRpb25zLnB1c2goKGNhbGVuZGFySW5mbzogQ2FsZW5kYXJJbmZvKSA9PiBpc0NsaWVudE9ubHlDYWxlbmRhcihjYWxlbmRhckluZm8uZ3JvdXAuX2lkKSlcblx0XHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdFx0Y2FzZSBSZW5kZXJUeXBlLlByaXZhdGU6XG5cdFx0XHRcdFx0XHRjb25kaXRpb25zLnB1c2goXG5cdFx0XHRcdFx0XHRcdChjYWxlbmRhckluZm86IENhbGVuZGFySW5mbykgPT5cblx0XHRcdFx0XHRcdFx0XHRjYWxlbmRhckluZm8udXNlcklzT3duZXIgJiYgIWNhbGVuZGFySW5mby5pc0V4dGVybmFsICYmICFpc0NsaWVudE9ubHlDYWxlbmRhcihjYWxlbmRhckluZm8uZ3JvdXAuX2lkKSxcblx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdFx0Y2FzZSBSZW5kZXJUeXBlLlNoYXJlZDpcblx0XHRcdFx0XHRcdGNvbmRpdGlvbnMucHVzaCgoY2FsZW5kYXJJbmZvOiBDYWxlbmRhckluZm8pID0+ICFjYWxlbmRhckluZm8udXNlcklzT3duZXIpXG5cdFx0XHRcdFx0XHRicmVha1xuXHRcdFx0XHRcdGNhc2UgUmVuZGVyVHlwZS5FeHRlcm5hbDpcblx0XHRcdFx0XHRcdGNvbmRpdGlvbnMucHVzaCgoY2FsZW5kYXJJbmZvOiBDYWxlbmRhckluZm8pID0+IGNhbGVuZGFySW5mby51c2VySXNPd25lciAmJiBjYWxlbmRhckluZm8uaXNFeHRlcm5hbClcblx0XHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBjb25kaXRpb25zLnJlZHVjZSgocmVzdWx0LCBjb25kaXRpb24pID0+IHJlc3VsdCB8fCBjb25kaXRpb24oY2FsZW5kYXJJbmZvKSwgZmFsc2UpXG5cdFx0fSlcblxuXHRcdHJldHVybiBmaWx0ZXJlZENhbGVuZGFySW5mb3MubWFwKChbXywgY2FsZW5kYXJJbmZvXSkgPT4ge1xuXHRcdFx0cmV0dXJuIHRoaXMucmVuZGVyQ2FsZW5kYXJJdGVtKGNhbGVuZGFySW5mbywgY2FsZW5kYXJJbmZvLnNoYXJlZCwgdG9nZ2xlSGlkZGVuLCB0aGlzLnZpZXdNb2RlbC5oaWRkZW5DYWxlbmRhcnMuaGFzKGNhbGVuZGFySW5mby5ncm91cC5faWQpKVxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIHJlbmRlckNhbGVuZGFySXRlbShcblx0XHRjYWxlbmRhckluZm86IENhbGVuZGFySW5mbyxcblx0XHRzaGFyZWQ6IGJvb2xlYW4sXG5cdFx0dG9nZ2xlSGlkZGVuOiAodmlld01vZGVsOiBDYWxlbmRhclZpZXdNb2RlbCwgZ3JvdXBSb290SWQ6IHN0cmluZykgPT4gdm9pZCxcblx0XHRpc0hpZGRlbjogYm9vbGVhbixcblx0KSB7XG5cdFx0Y29uc3QgeyB1c2VyU2V0dGluZ3NHcm91cFJvb3QgfSA9IGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKClcblx0XHRjb25zdCBleGlzdGluZ0dyb3VwU2V0dGluZ3MgPSB1c2VyU2V0dGluZ3NHcm91cFJvb3QuZ3JvdXBTZXR0aW5ncy5maW5kKChnYykgPT4gZ2MuZ3JvdXAgPT09IGNhbGVuZGFySW5mby5ncm91cEluZm8uZ3JvdXApID8/IG51bGxcblxuXHRcdGNvbnN0IGdyb3VwUm9vdElkID0gY2FsZW5kYXJJbmZvLmdyb3VwUm9vdC5faWRcblxuXHRcdGxldCBjb2xvclZhbHVlID0gXCIjXCIgKyAoZXhpc3RpbmdHcm91cFNldHRpbmdzID8gZXhpc3RpbmdHcm91cFNldHRpbmdzLmNvbG9yIDogZGVmYXVsdENhbGVuZGFyQ29sb3IpXG5cdFx0bGV0IGdyb3VwTmFtZSA9IGdldFNoYXJlZEdyb3VwTmFtZShjYWxlbmRhckluZm8uZ3JvdXBJbmZvLCBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLCBzaGFyZWQpXG5cdFx0aWYgKGlzQ2xpZW50T25seUNhbGVuZGFyKGNhbGVuZGFySW5mby5ncm91cC5faWQpKSB7XG5cdFx0XHRjb25zdCBjbGllbnRPbmx5SWQgPSBjYWxlbmRhckluZm8uZ3JvdXAuX2lkLm1hdGNoKC8jKC4qKS8pPy5bMV0hXG5cdFx0XHRjb25zdCBjbGllbnRPbmx5Q2FsZW5kYXJDb25maWcgPSBkZXZpY2VDb25maWcuZ2V0Q2xpZW50T25seUNhbGVuZGFycygpLmdldChjYWxlbmRhckluZm8uZ3JvdXAuX2lkKVxuXHRcdFx0Y29sb3JWYWx1ZSA9IFwiI1wiICsgKGNsaWVudE9ubHlDYWxlbmRhckNvbmZpZz8uY29sb3IgPz8gREVGQVVMVF9DTElFTlRfT05MWV9DQUxFTkRBUl9DT0xPUlMuZ2V0KGNsaWVudE9ubHlJZCkpXG5cdFx0XHRncm91cE5hbWUgPSBjbGllbnRPbmx5Q2FsZW5kYXJDb25maWc/Lm5hbWUgPz8gY2xpZW50T25seUlkXG5cdFx0fVxuXG5cdFx0Y29uc3QgbGFzdFN5bmNFbnRyeSA9IGRldmljZUNvbmZpZy5nZXRMYXN0RXh0ZXJuYWxDYWxlbmRhclN5bmMoKS5nZXQoY2FsZW5kYXJJbmZvLmdyb3VwLl9pZClcblx0XHRjb25zdCBsYXN0U3luY0RhdGUgPSBsYXN0U3luY0VudHJ5Py5sYXN0U3VjY2Vzc2Z1bFN5bmMgPyBuZXcgRGF0ZShsYXN0U3luY0VudHJ5Lmxhc3RTdWNjZXNzZnVsU3luYykgOiBudWxsXG5cdFx0Y29uc3QgbGFzdFN5bmNTdHIgPSBsYXN0U3luY0RhdGVcblx0XHRcdD8gbGFuZy5nZXQoXCJsYXN0U3luY19sYWJlbFwiLCB7IFwie2RhdGV9XCI6IGAke2Zvcm1hdERhdGUobGFzdFN5bmNEYXRlKX0gYXQgJHtmb3JtYXRUaW1lKGxhc3RTeW5jRGF0ZSl9YCB9KVxuXHRcdFx0OiBsYW5nLmdldChcImlDYWxOb3RTeW5jX21zZ1wiKVxuXG5cdFx0Y29uc3QgaGFuZGxlVG9nZ2xlQ2FsZW5kYXIgPSAoKSA9PiB7XG5cdFx0XHRpZiAoIWlzQ2xpZW50T25seUNhbGVuZGFyKGdyb3VwUm9vdElkKSB8fCB0aGlzLnZpZXdNb2RlbC5pc05ld1BhaWRQbGFuKSB0b2dnbGVIaWRkZW4odGhpcy52aWV3TW9kZWwsIGdyb3VwUm9vdElkKVxuXHRcdFx0ZWxzZSBzaG93UGxhblVwZ3JhZGVSZXF1aXJlZERpYWxvZyhOZXdQYWlkUGxhbnMpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG0oXCIuZm9sZGVyLXJvdy5mbGV4LXN0YXJ0LnBsci1idXR0b25cIiwgW1xuXHRcdFx0bShcIi5mbGV4LmZsZXgtZ3Jvdy5jZW50ZXItdmVydGljYWxseS5idXR0b24taGVpZ2h0XCIsIFtcblx0XHRcdFx0bShcIi5jYWxlbmRhci1jaGVja2JveFwiLCB7XG5cdFx0XHRcdFx0cm9sZTogXCJjaGVja2JveFwiLFxuXHRcdFx0XHRcdHRpdGxlOiBncm91cE5hbWUsXG5cdFx0XHRcdFx0dGFiaW5kZXg6IFRhYkluZGV4LkRlZmF1bHQsXG5cdFx0XHRcdFx0XCJhcmlhLWNoZWNrZWRcIjogKCFpc0hpZGRlbikudG9TdHJpbmcoKSxcblx0XHRcdFx0XHRcImFyaWEtbGFiZWxcIjogZ3JvdXBOYW1lLFxuXHRcdFx0XHRcdG9uY2xpY2s6IGhhbmRsZVRvZ2dsZUNhbGVuZGFyLFxuXHRcdFx0XHRcdG9ua2V5ZG93bjogKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcblx0XHRcdFx0XHRcdGlmIChpc0tleVByZXNzZWQoZS5rZXksIEtleXMuU1BBQ0UsIEtleXMuUkVUVVJOKSkge1xuXHRcdFx0XHRcdFx0XHR0b2dnbGVIaWRkZW4odGhpcy52aWV3TW9kZWwsIGdyb3VwUm9vdElkKVxuXHRcdFx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XHRcImJvcmRlci1jb2xvclwiOiBjb2xvclZhbHVlLFxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZDogaXNIaWRkZW4gPyBcIlwiIDogY29sb3JWYWx1ZSxcblx0XHRcdFx0XHRcdHRyYW5zaXRpb246IFwiYWxsIDAuM3NcIixcblx0XHRcdFx0XHRcdGN1cnNvcjogXCJwb2ludGVyXCIsXG5cdFx0XHRcdFx0XHRtYXJnaW5MZWZ0OiBweChzaXplLmhwYWRfYnV0dG9uKSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KSxcblx0XHRcdFx0bShcblx0XHRcdFx0XHRcIi5wbC1tLmIuZmxleC1ncm93LnRleHQtZWxsaXBzaXNcIixcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHR3aWR0aDogMCxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRncm91cE5hbWUsXG5cdFx0XHRcdCksXG5cdFx0XHRdKSxcblx0XHRcdGhhc1NvdXJjZVVybChleGlzdGluZ0dyb3VwU2V0dGluZ3MpICYmIGxhc3RTeW5jRW50cnk/Lmxhc3RTeW5jU3RhdHVzID09PSBTeW5jU3RhdHVzLkZhaWxlZFxuXHRcdFx0XHQ/IG0oSWNvbiwge1xuXHRcdFx0XHRcdFx0dGl0bGU6IGxhc3RTeW5jU3RyLFxuXHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuU3luY1Byb2JsZW0sXG5cdFx0XHRcdFx0XHRzaXplOiBJY29uU2l6ZS5NZWRpdW0sXG5cdFx0XHRcdFx0XHRjbGFzczogXCJwci1zXCIsXG5cdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRmaWxsOiB0aGVtZS5jb250ZW50X2J1dHRvbixcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdCAgfSlcblx0XHRcdFx0OiBudWxsLFxuXHRcdFx0dGhpcy5jcmVhdGVDYWxlbmRhckFjdGlvbkRyb3Bkb3duKGNhbGVuZGFySW5mbywgY29sb3JWYWx1ZSwgZXhpc3RpbmdHcm91cFNldHRpbmdzLCB1c2VyU2V0dGluZ3NHcm91cFJvb3QsIHNoYXJlZCksXG5cdFx0XSlcblx0fVxuXG5cdHByaXZhdGUgY3JlYXRlQ2FsZW5kYXJBY3Rpb25Ecm9wZG93bihcblx0XHRjYWxlbmRhckluZm86IENhbGVuZGFySW5mbyxcblx0XHRjb2xvclZhbHVlOiBzdHJpbmcsXG5cdFx0ZXhpc3RpbmdHcm91cFNldHRpbmdzOiBHcm91cFNldHRpbmdzIHwgbnVsbCxcblx0XHR1c2VyU2V0dGluZ3NHcm91cFJvb3Q6IFVzZXJTZXR0aW5nc0dyb3VwUm9vdCxcblx0XHRzaGFyZWRDYWxlbmRhcjogYm9vbGVhbixcblx0KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHsgZ3JvdXAsIGdyb3VwSW5mbywgZ3JvdXBSb290LCBpc0V4dGVybmFsIH0gPSBjYWxlbmRhckluZm9cblx0XHRjb25zdCB1c2VyID0gbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyXG5cdFx0Y29uc3QgaXNDbGllbnRPbmx5ID0gaXNDbGllbnRPbmx5Q2FsZW5kYXIoY2FsZW5kYXJJbmZvLmdyb3VwLl9pZClcblx0XHRyZXR1cm4gbShJY29uQnV0dG9uLCB7XG5cdFx0XHR0aXRsZTogXCJtb3JlX2xhYmVsXCIsXG5cdFx0XHRjb2xvcnM6IEJ1dHRvbkNvbG9yLk5hdixcblx0XHRcdGljb246IEljb25zLk1vcmUsXG5cdFx0XHRzaXplOiBCdXR0b25TaXplLkNvbXBhY3QsXG5cdFx0XHRjbGljazogY3JlYXRlRHJvcGRvd24oe1xuXHRcdFx0XHRsYXp5QnV0dG9uczogKCkgPT4gW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxhYmVsOiBcImVkaXRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRpY29uOiBJY29ucy5FZGl0LFxuXHRcdFx0XHRcdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHRoaXMub25QcmVzc2VkRWRpdENhbGVuZGFyKGdyb3VwSW5mbywgY29sb3JWYWx1ZSwgZXhpc3RpbmdHcm91cFNldHRpbmdzLCB1c2VyU2V0dGluZ3NHcm91cFJvb3QsIHNoYXJlZENhbGVuZGFyKSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdCFpc0V4dGVybmFsICYmICFpc0NsaWVudE9ubHlcblx0XHRcdFx0XHRcdD8ge1xuXHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcInNoYXJpbmdfbGFiZWxcIixcblx0XHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5Db250YWN0SW1wb3J0LFxuXHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAobG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS5pc0ZyZWVBY2NvdW50KCkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c2hvd05vdEF2YWlsYWJsZUZvckZyZWVEaWFsb2coKVxuXHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c2hvd0dyb3VwU2hhcmluZ0RpYWxvZyhncm91cEluZm8sIHNoYXJlZENhbGVuZGFyKVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHQgIH1cblx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XHR0aGlzLmFsbG93Q2FsZW5kYXJJbXBvcnQoZ3JvdXAsIHVzZXIsIGV4aXN0aW5nR3JvdXBTZXR0aW5ncylcblx0XHRcdFx0XHRcdD8ge1xuXHRcdFx0XHRcdFx0XHRcdGxhYmVsOiBcImltcG9ydF9hY3Rpb25cIixcblx0XHRcdFx0XHRcdFx0XHRpY29uOiBJY29ucy5JbXBvcnQsXG5cdFx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IGhhbmRsZUNhbGVuZGFySW1wb3J0KGdyb3VwUm9vdCksXG5cdFx0XHRcdFx0XHQgIH1cblx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XHQhaXNBcHAoKSAmJiBncm91cC50eXBlID09PSBHcm91cFR5cGUuQ2FsZW5kYXIgJiYgaGFzQ2FwYWJpbGl0eU9uR3JvdXAodXNlciwgZ3JvdXAsIFNoYXJlQ2FwYWJpbGl0eS5SZWFkKSAmJiAhaXNDbGllbnRPbmx5XG5cdFx0XHRcdFx0XHQ/IHtcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogXCJleHBvcnRfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuRXhwb3J0LFxuXHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBhbGFybUluZm9MaXN0ID0gdXNlci5hbGFybUluZm9MaXN0XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoYWxhcm1JbmZvTGlzdCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRleHBvcnRDYWxlbmRhcihcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRnZXRTaGFyZWRHcm91cE5hbWUoZ3JvdXBJbmZvLCBsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLCBzaGFyZWRDYWxlbmRhciksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Z3JvdXBSb290LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGFsYXJtSW5mb0xpc3QuYWxhcm1zLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG5ldyBEYXRlKCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Z2V0VGltZVpvbmUoKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHQgIH1cblx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XHQoaXNBcHAoKSB8fCBpc0Rlc2t0b3AoKSkgJiYgaXNFeHRlcm5hbFxuXHRcdFx0XHRcdFx0PyB7XG5cdFx0XHRcdFx0XHRcdFx0bGFiZWw6IGxhbmcubWFrZVRyYW5zbGF0aW9uKFwic3luY19hY3Rpb25cIiwgXCJTeW5jXCIpLFxuXHRcdFx0XHRcdFx0XHRcdGljb246IEljb25zLlN5bmMsXG5cdFx0XHRcdFx0XHRcdFx0c2l6ZTogQnV0dG9uU2l6ZS5Db21wYWN0LFxuXHRcdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLnZpZXdNb2RlbC5mb3JjZVN5bmNFeHRlcm5hbChleGlzdGluZ0dyb3VwU2V0dGluZ3MsIHRydWUpPy5jYXRjaChhc3luYyAoZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBEaWFsb2cubWVzc2FnZShsYW5nLm1ha2VUcmFuc2xhdGlvbihcImNvbmZpcm1fbXNnXCIsIGUubWVzc2FnZSkpXG5cdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHQgIH1cblx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XHRjYWxlbmRhckluZm8udXNlcklzT3duZXIgJiYgIWlzQ2xpZW50T25seVxuXHRcdFx0XHRcdFx0PyB7XG5cdFx0XHRcdFx0XHRcdFx0bGFiZWw6IGlzRXh0ZXJuYWwgPyBcInVuc3Vic2NyaWJlX2FjdGlvblwiIDogXCJkZWxldGVfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuVHJhc2gsXG5cdFx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IHRoaXMuY29uZmlybURlbGV0ZUNhbGVuZGFyKGNhbGVuZGFySW5mbyksXG5cdFx0XHRcdFx0XHQgIH1cblx0XHRcdFx0XHRcdDogbnVsbCxcblx0XHRcdFx0XSxcblx0XHRcdH0pLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGFsbG93Q2FsZW5kYXJJbXBvcnQoZ3JvdXA6IEdyb3VwLCB1c2VyOiBVc2VyLCBncm91cFNldHRpbmdzOiBHcm91cFNldHRpbmdzIHwgbnVsbCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHRncm91cC50eXBlID09PSBHcm91cFR5cGUuQ2FsZW5kYXIgJiZcblx0XHRcdGhhc0NhcGFiaWxpdHlPbkdyb3VwKHVzZXIsIGdyb3VwLCBTaGFyZUNhcGFiaWxpdHkuV3JpdGUpICYmXG5cdFx0XHQhaGFzU291cmNlVXJsKGdyb3VwU2V0dGluZ3MpICYmXG5cdFx0XHQhaXNDbGllbnRPbmx5Q2FsZW5kYXIoZ3JvdXAuX2lkKVxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgY29uZmlybURlbGV0ZUNhbGVuZGFyKGNhbGVuZGFySW5mbzogQ2FsZW5kYXJJbmZvKSB7XG5cdFx0Y29uc3QgY2FsZW5kYXJOYW1lID0gZ2V0U2hhcmVkR3JvdXBOYW1lKGNhbGVuZGFySW5mby5ncm91cEluZm8sIGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCksIGZhbHNlKVxuXHRcdGxvYWRHcm91cE1lbWJlcnMoY2FsZW5kYXJJbmZvLmdyb3VwLCBsb2NhdG9yLmVudGl0eUNsaWVudCkudGhlbigobWVtYmVycykgPT4ge1xuXHRcdFx0Y29uc3Qgb3duZXJNYWlsID0gbG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyR3JvdXBJbmZvLm1haWxBZGRyZXNzXG5cdFx0XHRjb25zdCBvdGhlck1lbWJlcnMgPSBtZW1iZXJzLmZpbHRlcigobWVtYmVyKSA9PiBtZW1iZXIuaW5mby5tYWlsQWRkcmVzcyAhPT0gb3duZXJNYWlsKVxuXHRcdFx0RGlhbG9nLmNvbmZpcm0oXG5cdFx0XHRcdGxhbmcubWFrZVRyYW5zbGF0aW9uKFxuXHRcdFx0XHRcdFwiY29uZmlybV9tc2dcIixcblx0XHRcdFx0XHQob3RoZXJNZW1iZXJzLmxlbmd0aCA+IDBcblx0XHRcdFx0XHRcdD8gbGFuZy5nZXQoXCJkZWxldGVTaGFyZWRDYWxlbmRhckNvbmZpcm1fbXNnXCIsIHtcblx0XHRcdFx0XHRcdFx0XHRcIntjYWxlbmRhcn1cIjogY2FsZW5kYXJOYW1lLFxuXHRcdFx0XHRcdFx0ICB9KSArIFwiIFwiXG5cdFx0XHRcdFx0XHQ6IFwiXCIpICtcblx0XHRcdFx0XHRcdGxhbmcuZ2V0KFwiZGVsZXRlQ2FsZW5kYXJDb25maXJtX21zZ1wiLCB7XG5cdFx0XHRcdFx0XHRcdFwie2NhbGVuZGFyfVwiOiBjYWxlbmRhck5hbWUsXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0KSxcblx0XHRcdCkudGhlbigoY29uZmlybWVkKSA9PiB7XG5cdFx0XHRcdGlmIChjb25maXJtZWQpIHtcblx0XHRcdFx0XHR0aGlzLnZpZXdNb2RlbC5kZWxldGVDYWxlbmRhcihjYWxlbmRhckluZm8pLmNhdGNoKG9mQ2xhc3MoTm90Rm91bmRFcnJvciwgKCkgPT4gY29uc29sZS5sb2coXCJDYWxlbmRhciB0byBiZSBkZWxldGVkIHdhcyBub3QgZm91bmQuXCIpKSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBvblByZXNzZWRFZGl0Q2FsZW5kYXIoXG5cdFx0Z3JvdXBJbmZvOiBHcm91cEluZm8sXG5cdFx0Y29sb3JWYWx1ZTogc3RyaW5nLFxuXHRcdGV4aXN0aW5nR3JvdXBTZXR0aW5nczogR3JvdXBTZXR0aW5ncyB8IG51bGwsXG5cdFx0dXNlclNldHRpbmdzR3JvdXBSb290OiBVc2VyU2V0dGluZ3NHcm91cFJvb3QsXG5cdFx0c2hhcmVkOiBib29sZWFuLFxuXHQpIHtcblx0XHRpZiAoaXNDbGllbnRPbmx5Q2FsZW5kYXIoZ3JvdXBJbmZvLmdyb3VwKSAmJiAhdGhpcy52aWV3TW9kZWwuaXNOZXdQYWlkUGxhbikge1xuXHRcdFx0c2hvd1BsYW5VcGdyYWRlUmVxdWlyZWREaWFsb2coTmV3UGFpZFBsYW5zKVxuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXG5cdFx0c2hvd0NyZWF0ZUVkaXRDYWxlbmRhckRpYWxvZyh7XG5cdFx0XHRjYWxlbmRhclR5cGU6IGdldENhbGVuZGFyVHlwZShleGlzdGluZ0dyb3VwU2V0dGluZ3MsIGdyb3VwSW5mbyksXG5cdFx0XHR0aXRsZVRleHRJZDogXCJlZGl0X2FjdGlvblwiLFxuXHRcdFx0c2hhcmVkLFxuXHRcdFx0b2tBY3Rpb246IChkaWFsb2csIHByb3BlcnRpZXMpID0+IHRoaXMuaGFuZGxlTW9kaWZpZWRDYWxlbmRhcihkaWFsb2csIHByb3BlcnRpZXMsIHNoYXJlZCwgZ3JvdXBJbmZvLCBleGlzdGluZ0dyb3VwU2V0dGluZ3MsIHVzZXJTZXR0aW5nc0dyb3VwUm9vdCksXG5cdFx0XHRva1RleHRJZDogXCJzYXZlX2FjdGlvblwiLFxuXHRcdFx0Y2FsZW5kYXJQcm9wZXJ0aWVzOiB7XG5cdFx0XHRcdG5hbWU6IGdldFNoYXJlZEdyb3VwTmFtZShncm91cEluZm8sIGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCksIHNoYXJlZCksXG5cdFx0XHRcdGNvbG9yOiBjb2xvclZhbHVlLnN1YnN0cmluZygxKSxcblx0XHRcdFx0YWxhcm1zOiBleGlzdGluZ0dyb3VwU2V0dGluZ3M/LmRlZmF1bHRBbGFybXNMaXN0Lm1hcCgoYWxhcm0pID0+IHBhcnNlQWxhcm1JbnRlcnZhbChhbGFybS50cmlnZ2VyKSkgPz8gW10sXG5cdFx0XHRcdHNvdXJjZVVybDogZXhpc3RpbmdHcm91cFNldHRpbmdzPy5zb3VyY2VVcmwgPz8gbnVsbCxcblx0XHRcdH0sXG5cdFx0XHRpc05ld0NhbGVuZGFyOiBmYWxzZSxcblx0XHRcdGNhbGVuZGFyTW9kZWw6IHRoaXMudmlld01vZGVsLmdldENhbGVuZGFyTW9kZWwoKSxcblx0XHR9KVxuXHR9XG5cblx0cHJpdmF0ZSBoYW5kbGVNb2RpZmllZENhbGVuZGFyKFxuXHRcdGRpYWxvZzogRGlhbG9nLFxuXHRcdHByb3BlcnRpZXM6IENhbGVuZGFyUHJvcGVydGllcyxcblx0XHRzaGFyZWQ6IGJvb2xlYW4sXG5cdFx0Z3JvdXBJbmZvOiBHcm91cEluZm8sXG5cdFx0ZXhpc3RpbmdHcm91cFNldHRpbmdzOiBHcm91cFNldHRpbmdzIHwgbnVsbCxcblx0XHR1c2VyU2V0dGluZ3NHcm91cFJvb3Q6IFVzZXJTZXR0aW5nc0dyb3VwUm9vdCxcblx0KSB7XG5cdFx0Y29uc3QgY2xpZW50T25seUNhbGVuZGFyID0gaXNDbGllbnRPbmx5Q2FsZW5kYXIoZ3JvdXBJbmZvLmdyb3VwKVxuXHRcdGlmICghc2hhcmVkICYmICFjbGllbnRPbmx5Q2FsZW5kYXIpIHtcblx0XHRcdC8vIFVzZXIgaXMgdGhlIG93bmVyLCBzbyB3ZSB1cGRhdGUgdGhlIGVudGl0eSBpbnN0ZWFkIG9mIGdyb3VwU2V0dGluZ3Ncblx0XHRcdGdyb3VwSW5mby5uYW1lID0gcHJvcGVydGllcy5uYW1lXG5cdFx0XHRsb2NhdG9yLmVudGl0eUNsaWVudC51cGRhdGUoZ3JvdXBJbmZvKVxuXHRcdH1cblxuXHRcdGNvbnN0IHNob3VsZFN5bmNFeHRlcm5hbCA9ICEhKGV4aXN0aW5nR3JvdXBTZXR0aW5ncyAmJiBoYXNTb3VyY2VVcmwoZXhpc3RpbmdHcm91cFNldHRpbmdzKSAmJiBleGlzdGluZ0dyb3VwU2V0dGluZ3Muc291cmNlVXJsICE9PSBwcm9wZXJ0aWVzLnNvdXJjZVVybClcblx0XHRjb25zdCBhbGFybXMgPSBwcm9wZXJ0aWVzLmFsYXJtcy5tYXAoKGFsYXJtKSA9PiBjcmVhdGVEZWZhdWx0QWxhcm1JbmZvKHsgdHJpZ2dlcjogc2VyaWFsaXplQWxhcm1JbnRlcnZhbChhbGFybSkgfSkpXG5cdFx0Ly8gY29sb3IgYWx3YXlzIHNldCBmb3IgZXhpc3RpbmcgY2FsZW5kYXJcblx0XHRpZiAoZXhpc3RpbmdHcm91cFNldHRpbmdzKSB7XG5cdFx0XHRleGlzdGluZ0dyb3VwU2V0dGluZ3MuY29sb3IgPSBwcm9wZXJ0aWVzLmNvbG9yXG5cdFx0XHRleGlzdGluZ0dyb3VwU2V0dGluZ3MubmFtZSA9IHNoYXJlZCAmJiBwcm9wZXJ0aWVzLm5hbWUgIT09IGdyb3VwSW5mby5uYW1lID8gcHJvcGVydGllcy5uYW1lIDogbnVsbFxuXHRcdFx0ZXhpc3RpbmdHcm91cFNldHRpbmdzLmRlZmF1bHRBbGFybXNMaXN0ID0gYWxhcm1zXG5cdFx0XHRleGlzdGluZ0dyb3VwU2V0dGluZ3Muc291cmNlVXJsID0gcHJvcGVydGllcy5zb3VyY2VVcmxcblx0XHR9IGVsc2UgaWYgKGNsaWVudE9ubHlDYWxlbmRhcikge1xuXHRcdFx0dGhpcy52aWV3TW9kZWwuaGFuZGxlQ2xpZW50T25seVVwZGF0ZShncm91cEluZm8sIGRvd25jYXN0KHsgbmFtZTogcHJvcGVydGllcy5uYW1lLCBjb2xvcjogcHJvcGVydGllcy5jb2xvciB9KSlcblx0XHRcdGRpYWxvZy5jbG9zZSgpXG5cdFx0XHRyZXR1cm4gdGhpcy52aWV3TW9kZWwucmVkcmF3KHVuZGVmaW5lZClcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgbmV3R3JvdXBTZXR0aW5ncyA9IGNyZWF0ZUdyb3VwU2V0dGluZ3Moe1xuXHRcdFx0XHRncm91cDogZ3JvdXBJbmZvLmdyb3VwLFxuXHRcdFx0XHRjb2xvcjogcHJvcGVydGllcy5jb2xvcixcblx0XHRcdFx0bmFtZTogc2hhcmVkICYmIHByb3BlcnRpZXMubmFtZSAhPT0gZ3JvdXBJbmZvLm5hbWUgPyBwcm9wZXJ0aWVzLm5hbWUgOiBudWxsLFxuXHRcdFx0XHRkZWZhdWx0QWxhcm1zTGlzdDogYWxhcm1zLFxuXHRcdFx0XHRzb3VyY2VVcmw6IHByb3BlcnRpZXMuc291cmNlVXJsLFxuXHRcdFx0fSlcblxuXHRcdFx0dXNlclNldHRpbmdzR3JvdXBSb290Lmdyb3VwU2V0dGluZ3MucHVzaChuZXdHcm91cFNldHRpbmdzKVxuXHRcdH1cblxuXHRcdGxvY2F0b3IuZW50aXR5Q2xpZW50LnVwZGF0ZSh1c2VyU2V0dGluZ3NHcm91cFJvb3QpLnRoZW4oKCkgPT4ge1xuXHRcdFx0aWYgKHNob3VsZFN5bmNFeHRlcm5hbClcblx0XHRcdFx0dGhpcy52aWV3TW9kZWwuZm9yY2VTeW5jRXh0ZXJuYWwoZXhpc3RpbmdHcm91cFNldHRpbmdzKT8uY2F0Y2goYXN5bmMgKGUpID0+IHtcblx0XHRcdFx0XHRzaG93U25hY2tCYXIoe1xuXHRcdFx0XHRcdFx0bWVzc2FnZTogbGFuZy5tYWtlVHJhbnNsYXRpb24oXCJleGNlcHRpb25fbXNnXCIsIGUubWVzc2FnZSksXG5cdFx0XHRcdFx0XHRidXR0b246IHtcblx0XHRcdFx0XHRcdFx0bGFiZWw6IFwib2tfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdGNsaWNrOiBub09wLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdHdhaXRpbmdUaW1lOiA1MDAsXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSlcblx0XHR9KVxuXHRcdGRpYWxvZy5jbG9zZSgpXG5cdH1cblxuXHR2aWV3KHsgYXR0cnMgfTogVm5vZGU8Q2FsZW5kYXJWaWV3QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBtKFxuXHRcdFx0XCIubWFpbi12aWV3XCIsXG5cdFx0XHRtKHRoaXMudmlld1NsaWRlciwge1xuXHRcdFx0XHRoZWFkZXI6IG0oSGVhZGVyLCB7XG5cdFx0XHRcdFx0c2VhcmNoQmFyOiBhdHRycy5sYXp5U2VhcmNoQmFyLFxuXHRcdFx0XHRcdC4uLmF0dHJzLmhlYWRlcixcblx0XHRcdFx0fSksXG5cdFx0XHRcdGJvdHRvbU5hdjogYXR0cnMuYm90dG9tTmF2Py4oKSxcblx0XHRcdH0pLFxuXHRcdClcblx0fVxuXG5cdG9uTmV3VXJsKGFyZ3M6IFJlY29yZDxzdHJpbmcsIGFueT4pIHtcblx0XHRpZiAoIWFyZ3Mudmlldykge1xuXHRcdFx0dGhpcy5zZXRVcmwodGhpcy5jdXJyZW50Vmlld1R5cGUsIHRoaXMudmlld01vZGVsLnNlbGVjdGVkRGF0ZSgpLCB0cnVlKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmN1cnJlbnRWaWV3VHlwZSA9IENhbGVuZGFyVmlld1R5cGVCeVZhbHVlW2FyZ3MudmlldyBhcyBDYWxlbmRhclZpZXdUeXBlXSA/IGFyZ3MudmlldyA6IENhbGVuZGFyVmlld1R5cGUuTU9OVEhcblxuXHRcdFx0Y29uc3QgdXJsRGF0ZVBhcmFtID0gYXJncy5kYXRlXG5cblx0XHRcdGlmICh1cmxEYXRlUGFyYW0pIHtcblx0XHRcdFx0Ly8gVW5saWtlIEpTIEx1eG9uIGFzc3VtZXMgbG9jYWwgdGltZSB6b25lIHdoZW4gcGFyc2luZyBhbmQgbm90IFVUQy4gVGhhdCdzIHdoYXQgd2Ugd2FudFxuXHRcdFx0XHRjb25zdCBsdXhvbkRhdGUgPSBEYXRlVGltZS5mcm9tSVNPKHVybERhdGVQYXJhbSlcblxuXHRcdFx0XHRsZXQgZGF0ZSA9IG5ldyBEYXRlKClcblxuXHRcdFx0XHRpZiAobHV4b25EYXRlLmlzVmFsaWQpIHtcblx0XHRcdFx0XHRkYXRlID0gbHV4b25EYXRlLnRvSlNEYXRlKClcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZERhdGUoKS5nZXRUaW1lKCkgIT09IGRhdGUuZ2V0VGltZSgpKSB7XG5cdFx0XHRcdFx0dGhpcy52aWV3TW9kZWwuc2VsZWN0ZWREYXRlKGRhdGUpXG5cblx0XHRcdFx0XHRtLnJlZHJhdygpXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCB0b2RheSA9IG5ldyBEYXRlKClcblx0XHRcdFx0aWYgKGlzU2FtZURheU9mRGF0ZSh0b2RheSwgZGF0ZSkgfHwgKGFyZ3MudmlldyA9PT0gXCJ3ZWVrXCIgJiYgZ2V0V2Vla051bWJlcihkYXRlKSA9PT0gZ2V0V2Vla051bWJlcih0b2RheSkpKSB7XG5cdFx0XHRcdFx0Y29uc3QgdGltZSA9IFRpbWUuZnJvbURhdGUodG9kYXkpXG5cdFx0XHRcdFx0dGhpcy52aWV3TW9kZWwuc2V0U2VsZWN0ZWRUaW1lKHRpbWUpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy52aWV3TW9kZWwuc2V0U2VsZWN0ZWRUaW1lKHVuZGVmaW5lZClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRkZXZpY2VDb25maWcuc2V0RGVmYXVsdENhbGVuZGFyVmlldyhsb2NhdG9yLmxvZ2lucy5nZXRVc2VyQ29udHJvbGxlcigpLnVzZXIuX2lkLCB0aGlzLmN1cnJlbnRWaWV3VHlwZSlcblx0XHR9XG5cdH1cblxuXHRnZXRWaWV3U2xpZGVyKCk6IFZpZXdTbGlkZXIge1xuXHRcdHJldHVybiB0aGlzLnZpZXdTbGlkZXJcblx0fVxuXG5cdHByaXZhdGUgc2V0VXJsKHZpZXc6IHN0cmluZywgZGF0ZTogRGF0ZSwgcmVwbGFjZTogYm9vbGVhbiA9IGZhbHNlLCByZXNldFN0YXRlOiBib29sZWFuID0gZmFsc2UpIHtcblx0XHRjb25zdCBkYXRlU3RyaW5nID0gRGF0ZVRpbWUuZnJvbUpTRGF0ZShkYXRlKS50b0lTT0RhdGUoKSA/PyBEYXRlVGltZS5ub3coKS50b0lTT0RhdGUoKVxuXG5cdFx0bS5yb3V0ZS5zZXQoXG5cdFx0XHRcIi9jYWxlbmRhci86dmlldy86ZGF0ZVwiLFxuXHRcdFx0e1xuXHRcdFx0XHR2aWV3LFxuXHRcdFx0XHRkYXRlOiBkYXRlU3RyaW5nLFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0cmVwbGFjZSxcblx0XHRcdFx0c3RhdGU6IHRoaXMuYnVpbGRSb3V0ZVN0YXRlKHZpZXcsIHJlc2V0U3RhdGUsIGRhdGVTdHJpbmcpLFxuXHRcdFx0fSxcblx0XHQpXG5cdH1cblxuXHRwcml2YXRlIGJ1aWxkUm91dGVTdGF0ZSh2aWV3OiBzdHJpbmcsIHJlc2V0U3RhdGU6IGJvb2xlYW4sIGRhdGVTdHJpbmc6IHN0cmluZykge1xuXHRcdGNvbnN0IHNob3VsZEJ1aWxkID0gaXNBcHAoKSAmJiAhcmVzZXRTdGF0ZSAmJiB2aWV3ID09PSBDYWxlbmRhclZpZXdUeXBlLkFHRU5EQVxuXHRcdGlmICghc2hvdWxkQnVpbGQpIHJldHVybiB1bmRlZmluZWRcblxuXHRcdGNvbnN0IHJldHVybkRhdGUgPSBoaXN0b3J5LnN0YXRlPy5kYXRlU3RyaW5nID8/IGRhdGVTdHJpbmdcblx0XHRpZiAoXG5cdFx0XHRtLnJvdXRlLmdldCgpLmluY2x1ZGVzKENhbGVuZGFyVmlld1R5cGUuTU9OVEgpIHx8XG5cdFx0XHQobS5yb3V0ZS5nZXQoKS5pbmNsdWRlcyhDYWxlbmRhclZpZXdUeXBlLkFHRU5EQSkgJiYgaGlzdG9yeS5zdGF0ZT8ub3JpZ2luID09PSBDYWxlbmRhclZpZXdUeXBlLk1PTlRIKVxuXHRcdCkge1xuXHRcdFx0cmV0dXJuIHsgb3JpZ2luOiBDYWxlbmRhclZpZXdUeXBlLk1PTlRILCBkYXRlU3RyaW5nOiByZXR1cm5EYXRlIH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIG9uRXZlbnRTZWxlY3RlZChzZWxlY3RlZEV2ZW50OiBDYWxlbmRhckV2ZW50LCBkb21FdmVudDogTW91c2VPclBvaW50ZXJFdmVudCwgaHRtbFNhbml0aXplclByb21pc2U6IFByb21pc2U8SHRtbFNhbml0aXplcj4pIHtcblx0XHRjb25zdCBkb21UYXJnZXQgPSBkb21FdmVudC5jdXJyZW50VGFyZ2V0XG5cblx0XHRpZiAoZG9tVGFyZ2V0ID09IG51bGwgfHwgIShkb21UYXJnZXQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblxuXHRcdGNvbnN0IHggPSBkb21FdmVudC5jbGllbnRYXG5cdFx0Y29uc3QgeSA9IGRvbUV2ZW50LmNsaWVudFlcblxuXHRcdC8vIFdlIHdhbnQgdGhlIHBvcHVwIHRvIHNob3cgYXQgdGhlIHVzZXJzIG1vdXNlXG5cdFx0Y29uc3QgcmVjdCA9IHtcblx0XHRcdGJvdHRvbTogeSxcblx0XHRcdGhlaWdodDogMCxcblx0XHRcdHdpZHRoOiAwLFxuXHRcdFx0dG9wOiB5LFxuXHRcdFx0bGVmdDogeCxcblx0XHRcdHJpZ2h0OiB4LFxuXHRcdH1cblxuXHRcdGF3YWl0IHRoaXMuc2hvd0NhbGVuZGFyRXZlbnRQb3B1cChzZWxlY3RlZEV2ZW50LCByZWN0LCBodG1sU2FuaXRpemVyUHJvbWlzZSlcblx0fVxuXG5cdHByaXZhdGUgaGFuZGxlRXZlbnRLZXlEb3duKCk6IENhbGVuZGFyRXZlbnRCdWJibGVLZXlEb3duSGFuZGxlciB7XG5cdFx0cmV0dXJuIChjYWxlbmRhckV2ZW50LCBkb21FdmVudCkgPT4ge1xuXHRcdFx0aWYgKGlzS2V5UHJlc3NlZChkb21FdmVudC5rZXksIEtleXMuUkVUVVJOLCBLZXlzLlNQQUNFKSAmJiAhZG9tRXZlbnQucmVwZWF0KSB7XG5cdFx0XHRcdHRoaXMuc2hvd0NhbGVuZGFyRXZlbnRQb3B1cEF0RXZlbnQoY2FsZW5kYXJFdmVudCwgZG9tRXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50LCB0aGlzLmh0bWxTYW5pdGl6ZXIpXG5cdFx0XHRcdGRvbUV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHR9XG5cdFx0XHRpZiAoaXNLZXlQcmVzc2VkKGRvbUV2ZW50LmtleSwgS2V5cy5ERUxFVEUpICYmICFkb21FdmVudC5yZXBlYXQpIHtcblx0XHRcdFx0dGhpcy5vcGVuRGVsZXRlUG9wdXAoY2FsZW5kYXJFdmVudCwgZG9tRXZlbnQpXG5cdFx0XHRcdGRvbUV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBvcGVuRGVsZXRlUG9wdXAoY2FsZW5kYXJFdmVudDogQ2FsZW5kYXJFdmVudCwgZG9tRXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcblx0XHRsb2NhdG9yLmNhbGVuZGFyRXZlbnRQcmV2aWV3TW9kZWwoY2FsZW5kYXJFdmVudCwgdGhpcy52aWV3TW9kZWwuY2FsZW5kYXJJbmZvcykudGhlbigoZXZlbnRQcmV2aWV3TW9kZWw6IENhbGVuZGFyRXZlbnRQcmV2aWV3Vmlld01vZGVsKSA9PiB7XG5cdFx0XHRzaG93RGVsZXRlUG9wdXAoZXZlbnRQcmV2aWV3TW9kZWwsIG5ldyBNb3VzZUV2ZW50KFwiY2xpY2tcIiwge30pLCBkb21FdmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpXG5cdFx0fSlcblx0fVxuXG5cdHByaXZhdGUgYXN5bmMgc2hvd0NhbGVuZGFyRXZlbnRQb3B1cChzZWxlY3RlZEV2ZW50OiBDYWxlbmRhckV2ZW50LCBldmVudEJ1YmJsZVJlY3Q6IFBvc1JlY3QsIGh0bWxTYW5pdGl6ZXJQcm9taXNlOiBQcm9taXNlPEh0bWxTYW5pdGl6ZXI+KSB7XG5cdFx0bGV0IGdldFByZXZpZXdNb2RlbDogUHJvbWlzZTxDYWxlbmRhclByZXZpZXdNb2RlbHM+XG5cdFx0bGV0IHBvcHVwQ29tcG9uZW50OiBDYWxlbmRhckV2ZW50UG9wdXAgfCBDb250YWN0RXZlbnRQb3B1cFxuXG5cdFx0aWYgKGlzQmlydGhkYXlFdmVudChzZWxlY3RlZEV2ZW50LnVpZCkpIHtcblx0XHRcdGNvbnN0IGJhc2U2NENvbnRhY3RJZCA9IGxhc3QoZWxlbWVudElkUGFydChzZWxlY3RlZEV2ZW50Ll9pZCkuc3BsaXQoXCIjXCIpKVxuXHRcdFx0aWYgKCFiYXNlNjRDb250YWN0SWQpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBUcnlpbmcgdG8gb3BlbiBhIGJpcnRoZGF5ICR7c2VsZWN0ZWRFdmVudC5faWR9IHdpdGhvdXQgYSBjb250YWN0IGlkYClcblx0XHRcdH1cblx0XHRcdGNvbnN0IGNvbnRhY3RJZCA9IGRlY29kZUJhc2U2NChcInV0ZjhcIiwgYmFzZTY0Q29udGFjdElkKS5zcGxpdChcIi9cIilcblx0XHRcdGNvbnN0IGNvbnRhY3QgPSBhd2FpdCBsb2NhdG9yLmVudGl0eUNsaWVudC5sb2FkKENvbnRhY3RUeXBlUmVmLCBbY29udGFjdElkWzBdLCBjb250YWN0SWRbMV1dKVxuXHRcdFx0aWYgKCFjb250YWN0KSB7XG5cdFx0XHRcdHRocm93IG5ldyBOb3RGb3VuZEVycm9yKGBDb3VsZCBub3QgZmluZCBjb250YWN0IGZvciB0aGlzIGJpcnRoZGF5IGV2ZW50ICR7c2VsZWN0ZWRFdmVudC5faWR9YClcblx0XHRcdH1cblx0XHRcdGNvbnN0IHBvcHVwTW9kZWwgPSBhd2FpdCBsb2NhdG9yLmNhbGVuZGFyQ29udGFjdFByZXZpZXdNb2RlbChzZWxlY3RlZEV2ZW50LCBjb250YWN0ISwgdHJ1ZSlcblx0XHRcdHBvcHVwQ29tcG9uZW50ID0gbmV3IENvbnRhY3RFdmVudFBvcHVwKHBvcHVwTW9kZWwgYXMgQ2FsZW5kYXJDb250YWN0UHJldmlld1ZpZXdNb2RlbCwgZXZlbnRCdWJibGVSZWN0KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBjYWxlbmRhcnMgPSBhd2FpdCB0aGlzLnZpZXdNb2RlbC5nZXRDYWxlbmRhckluZm9zQ3JlYXRlSWZOZWVkZWQoKVxuXHRcdFx0Z2V0UHJldmlld01vZGVsID0gbG9jYXRvci5jYWxlbmRhckV2ZW50UHJldmlld01vZGVsKHNlbGVjdGVkRXZlbnQsIGNhbGVuZGFycylcblx0XHRcdGNvbnN0IFtwb3B1cE1vZGVsLCBodG1sU2FuaXRpemVyXSA9IGF3YWl0IFByb21pc2UuYWxsKFtnZXRQcmV2aWV3TW9kZWwsIGh0bWxTYW5pdGl6ZXJQcm9taXNlXSlcblx0XHRcdHBvcHVwQ29tcG9uZW50ID0gbmV3IENhbGVuZGFyRXZlbnRQb3B1cChwb3B1cE1vZGVsIGFzIENhbGVuZGFyRXZlbnRQcmV2aWV3Vmlld01vZGVsLCBldmVudEJ1YmJsZVJlY3QsIGh0bWxTYW5pdGl6ZXIpXG5cdFx0fVxuXG5cdFx0cG9wdXBDb21wb25lbnQuc2hvdygpXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNob3dDYWxlbmRhckV2ZW50UG9wdXBBdEV2ZW50KHNlbGVjdGVkRXZlbnQ6IENhbGVuZGFyRXZlbnQsIHRhcmdldDogSFRNTEVsZW1lbnQsIGh0bWxTYW5pdGl6ZXJQcm9taXNlOiBQcm9taXNlPEh0bWxTYW5pdGl6ZXI+KSB7XG5cdFx0Y29uc3QgdGFyZ2V0UmVjdCA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuXHRcdGNvbnN0IHJlY3QgPSB7XG5cdFx0XHRib3R0b206IHRhcmdldFJlY3QuYm90dG9tLFxuXHRcdFx0aGVpZ2h0OiAwLFxuXHRcdFx0d2lkdGg6IDAsXG5cdFx0XHR0b3A6IHRhcmdldFJlY3QudG9wLFxuXHRcdFx0bGVmdDogdGFyZ2V0UmVjdC5sZWZ0LFxuXHRcdFx0cmlnaHQ6IHRhcmdldFJlY3QucmlnaHQsXG5cdFx0fVxuXHRcdGF3YWl0IHRoaXMuc2hvd0NhbGVuZGFyRXZlbnRQb3B1cChzZWxlY3RlZEV2ZW50LCByZWN0LCBodG1sU2FuaXRpemVyUHJvbWlzZSlcblx0fVxuXG5cdHByaXZhdGUgc2hvd0NhbGVuZGFyUG9wdXAoZG9tOiBIVE1MRWxlbWVudCkge1xuXHRcdC8vIFdoZW4gdGhlIHVzZXIgY2xpY2tzIHRoZSBtb250aCBuYW1lIGluIHRoZSBoZWFkZXIsIHRoZSB0YXJnZXQgY2FuIGJlIHRoZSBtb250aCdzIG5hbWUgb3IgdGhlIGljb24gb24gdGhlIHJpZ2h0XG5cdFx0Ly8gc2lkZSBvZiBtb250aCdzIG5hbWUsIHNvIHdlIGhhcmRjb2RlZCB0aGUgbGVmdCBzcGFjaW5nIHRvIGJlIHRoZSBzYW1lIHVzZWQgYnkgdGhlIG1vbnRoIG5hbWUsIHNvIGRvZXNuJ3QgbWF0dGVyXG5cdFx0Ly8gaWYgdGhlIHVzZXIgY2xpY2tzIG9uIG1vbnRoJ3MgbmFtZSBvciBvbiB0aGUgaWNvblxuXHRcdC8vIG5vaW5zcGVjdGlvbiBKU1N1c3BpY2lvdXNOYW1lQ29tYmluYXRpb25cblx0XHRjb25zdCBlbGVtZW50UmVjdCA9IHsgLi4uZG9tLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBsZWZ0OiBzaXplLmJ1dHRvbl9oZWlnaHQgfVxuXG5cdFx0Y29uc3Qgc2VsZWN0b3IgPSBuZXcgRGF5U2VsZWN0b3JQb3B1cChlbGVtZW50UmVjdCwge1xuXHRcdFx0c2VsZWN0ZWREYXRlOiBnZXRTdGFydE9mRGF5KHRoaXMudmlld01vZGVsLnNlbGVjdGVkRGF0ZSgpKSxcblx0XHRcdG9uRGF0ZVNlbGVjdGVkOiAoZGF0ZTogRGF0ZSkgPT4ge1xuXHRcdFx0XHR0aGlzLnZpZXdNb2RlbC5zZWxlY3RlZERhdGUoZGF0ZSlcblx0XHRcdFx0dGhpcy5zZXRVcmwodGhpcy5jdXJyZW50Vmlld1R5cGUsIGRhdGUpXG5cdFx0XHRcdHNlbGVjdG9yLmNsb3NlKClcblx0XHRcdH0sXG5cdFx0XHRzdGFydE9mVGhlV2Vla09mZnNldDogZ2V0U3RhcnRPZlRoZVdlZWtPZmZzZXQobG9jYXRvci5sb2dpbnMuZ2V0VXNlckNvbnRyb2xsZXIoKS51c2VyU2V0dGluZ3NHcm91cFJvb3Quc3RhcnRPZlRoZVdlZWsgYXMgV2Vla1N0YXJ0KSxcblx0XHRcdGhpZ2hsaWdodFRvZGF5OiB0cnVlLFxuXHRcdFx0aGlnaGxpZ2h0U2VsZWN0ZWRXZWVrOiB0aGlzLmN1cnJlbnRWaWV3VHlwZSA9PT0gQ2FsZW5kYXJWaWV3VHlwZS5XRUVLLFxuXHRcdFx0aGFzRXZlbnRzT246IChkYXRlKSA9PiB0aGlzLmhhc0V2ZW50c09uKGRhdGUpLFxuXHRcdH0pXG5cblx0XHRzZWxlY3Rvci5zaG93KClcblx0fVxuXG5cdHByaXZhdGUgaGFzRXZlbnRzT24oZGF0ZTogRGF0ZSk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiBkYXlzSGF2ZUV2ZW50cyh0aGlzLnZpZXdNb2RlbC5nZXRFdmVudHNPbkRheXNUb1JlbmRlcihbZGF0ZV0pKVxuXHR9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF3QkEsTUFBTSxhQUFhLEtBQUs7QUFDeEIsTUFBTSxlQUFlLEdBQUcsV0FBVztJQUV0QixzQkFBTixNQUFNLG9CQUFtRTtDQUMvRSxBQUFRLDJCQUFvQztD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