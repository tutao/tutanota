import { __toESM } from "./chunk-chunk.js";
import { assertMainOrNode, isApp } from "./Env-chunk.js";
import { BrowserType, client, companyTeamLabel } from "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { debounce, downcast, isEmpty, isSameTypeRef, memoized, mod, ofClass } from "./dist2-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { styles } from "./styles-chunk.js";
import { theme } from "./theme-chunk.js";
import { FULL_INDEXED_TIMESTAMP, Keys } from "./TutanotaConstants-chunk.js";
import { isKeyPressed, keyManager } from "./KeyManager-chunk.js";
import { LayerType, displayOverlay } from "./RootView-chunk.js";
import { px, size } from "./size-chunk.js";
import { assertIsEntity, getElementId } from "./EntityUtils-chunk.js";
import { CalendarEventTypeRef, ContactTypeRef, MailTypeRef } from "./TypeRefs-chunk.js";
import { generateCalendarInstancesInRange, getTimeZone, isClientOnlyCalendar, retrieveClientOnlyEventsForUser } from "./CalendarUtils-chunk.js";
import { require_stream } from "./stream-chunk.js";
import { IndexingNotSupportedError } from "./QuotaExceededError-chunk.js";
import { loadMultipleFromLists } from "./EntityClient-chunk.js";
import { Button, ButtonType } from "./Button-chunk.js";
import { Icons } from "./Icons-chunk.js";
import { Dialog } from "./Dialog-chunk.js";
import { Icon } from "./Icon-chunk.js";
import { formatDate, formatTimeOrDateOrYesterday } from "./Formatter-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { getContactListName } from "./ContactUtils-chunk.js";
import { formatEventDuration } from "./CalendarGuiUtils-chunk.js";
import { PageSize } from "./List-chunk.js";
import { hasMoreResults, mailLocator } from "./mailLocator-chunk.js";
import { compareContacts } from "./ContactGuiUtils-chunk.js";
import { getMailFolderIcon, isTutanotaTeamMail } from "./MailGuiUtils-chunk.js";
import { encodeCalendarSearchKey, getRestriction } from "./SearchUtils-chunk.js";
import { getSenderOrRecipientHeading } from "./MailViewerViewModel-chunk.js";
import { SearchRouter } from "./SearchRouter-chunk.js";
import { Badge } from "./Badge-chunk.js";
import { IndexingErrorReason } from "./SearchTypes-chunk.js";
import { BaseSearchBar } from "./BaseSearchBar-chunk.js";

//#region src/mail-app/search/SearchBarOverlay.ts
var SearchBarOverlay = class {
	view({ attrs }) {
		const { state } = attrs;
		return [this._renderIndexingStatus(state, attrs), state.entities && !isEmpty(state.entities) && attrs.isQuickSearch && attrs.isFocused ? this.renderResults(state, attrs) : null];
	}
	renderResults(state, attrs) {
		return mithril_default("ul.list.click.mail-list", [state.entities.map((result) => {
			return mithril_default("li.plr-l.flex-v-center.", {
				style: {
					height: px(52),
					"border-left": px(size.border_selection) + " solid transparent"
				},
				onmousedown: (e) => e.preventDefault(),
				onclick: () => attrs.selectResult(result),
				class: state.selected === result ? "row-selected" : ""
			}, this.renderResult(state, result));
		})]);
	}
	_renderIndexingStatus(state, attrs) {
		if (attrs.isFocused || !attrs.isQuickSearch && client.isDesktopDevice()) if (state.indexState.failedIndexingUpTo != null) return this.renderError(state.indexState.failedIndexingUpTo, attrs);
else if (state.indexState.progress !== 0) return this._renderProgress(state, attrs);
else return null;
else return null;
	}
	_renderProgress(state, attrs) {
		return mithril_default(".flex.col.rel", [mithril_default(".plr-l.pt-s.pb-s.flex.items-center.flex-space-between.mr-negative-s", { style: {
			height: px(52),
			borderLeft: `${px(size.border_selection)} solid transparent`
		} }, [mithril_default(".top.flex-space-between.col", mithril_default(".bottom.flex-space-between", mithril_default("", lang.get("indexedMails_label", { "{count}": state.indexState.indexedMailCount })))), state.indexState.progress !== 100 ? mithril_default("div", { onmousedown: (e) => e.preventDefault() }, mithril_default(Button, {
			label: "cancel_action",
			click: () => mailLocator.indexerFacade.cancelMailIndexing(),
			type: ButtonType.Secondary
		})) : null]), mithril_default(".abs", { style: {
			backgroundColor: theme.content_accent,
			height: "2px",
			width: state.indexState.progress + "%",
			bottom: 0
		} })]);
	}
	renderError(failedIndexingUpTo, attrs) {
		const errorMessageKey = attrs.state.indexState.error === IndexingErrorReason.ConnectionLost ? "indexingFailedConnection_error" : "indexing_error";
		return mithril_default(".flex.rel", [mithril_default(".plr-l.pt-s.pb-s.flex.items-center.flex-space-between.mr-negative-s", { style: {
			height: px(52),
			borderLeft: `${px(size.border_selection)} solid transparent`
		} }, [mithril_default(".small", lang.get(errorMessageKey)), mithril_default("div", { onmousedown: (e) => e.preventDefault() }, mithril_default(Button, {
			label: "retry_action",
			click: () => mailLocator.indexerFacade.extendMailIndex(failedIndexingUpTo),
			type: ButtonType.Secondary
		}))])]);
	}
	renderResult(state, result) {
		let type = "_type" in result ? result._type : null;
		if (!type) return this.renderShowMoreAction(downcast(result));
else if (isSameTypeRef(MailTypeRef, type)) return this.renderMailResult(downcast(result), state);
else if (isSameTypeRef(ContactTypeRef, type)) return this.renderContactResult(downcast(result));
else if (isSameTypeRef(CalendarEventTypeRef, type)) return this.renderCalendarEventResult(downcast(result));
else return [];
	}
	renderShowMoreAction(result) {
		let showMoreAction = result;
		let infoText;
		let indexInfo;
		if (showMoreAction.resultCount === 0) {
			infoText = lang.get("searchNoResults_msg");
			if (locator.logins.getUserController().isFreeAccount()) indexInfo = lang.get("changeTimeFrame_msg");
		} else if (showMoreAction.allowShowMore) infoText = lang.get("showMore_action");
else infoText = lang.get("moreResultsFound_msg", { "{1}": showMoreAction.resultCount - showMoreAction.shownCount });
		if (showMoreAction.indexTimestamp > FULL_INDEXED_TIMESTAMP && !indexInfo) indexInfo = lang.get("searchedUntil_msg") + " " + formatDate(new Date(showMoreAction.indexTimestamp));
		return indexInfo ? [mithril_default(".top.flex-center", infoText), mithril_default(".bottom.flex-center.small", indexInfo)] : mithril_default("li.plr-l.pt-s.pb-s.items-center.flex-center", mithril_default(".flex-center", infoText));
	}
	renderContactResult(contact) {
		return [mithril_default(".top.flex-space-between", mithril_default(".name", getContactListName(contact))), mithril_default(".bottom.flex-space-between", mithril_default("small.mail-address", contact.mailAddresses && contact.mailAddresses.length > 0 ? contact.mailAddresses[0].address : ""))];
	}
	renderCalendarEventResult(event) {
		return [mithril_default(".top.flex-space-between", mithril_default(".name.text-ellipsis", { title: event.summary }, event.summary)), mithril_default(".bottom.flex-space-between", mithril_default("small.mail-address", formatEventDuration(event, getTimeZone(), false)))];
	}
	renderMailResult(mail, state) {
		return [mithril_default(".top.flex-space-between.badge-line-height", [
			isTutanotaTeamMail(mail) ? mithril_default(Badge, { classes: ".small.mr-s" }, companyTeamLabel) : null,
			mithril_default("small.text-ellipsis", getSenderOrRecipientHeading(mail, true)),
			mithril_default("small.text-ellipsis.flex-fixed", formatTimeOrDateOrYesterday(mail.receivedDate))
		]), mithril_default(".bottom.flex-space-between", [mithril_default(".text-ellipsis", mail.subject), mithril_default(".icons.flex-fixed", { style: { "margin-right": "-3px" } }, [mithril_default(Icon, {
			icon: getMailFolderIcon(mail),
			class: state.selected === mail ? "svg-content-accent-fg" : "svg-content-fg"
		}), mithril_default(Icon, {
			icon: Icons.Attachment,
			class: state.selected === mail ? "svg-content-accent-fg" : "svg-content-fg",
			style: { display: mail.attachments.length > 0 ? "" : "none" }
		})])])];
	}
};

//#endregion
//#region src/mail-app/search/SearchBar.ts
var import_stream = __toESM(require_stream(), 1);
assertMainOrNode();
const MAX_SEARCH_PREVIEW_RESULTS = 10;
const searchRouter = new SearchRouter(mailLocator.throttledRouter());
var SearchBar = class {
	focused = false;
	state;
	busy = false;
	lastSelectedWhitelabelChildrenInfoResult = (0, import_stream.default)();
	closeOverlayFunction = null;
	overlayContentComponent;
	confirmDialogShown = false;
	domWrapper;
	domInput;
	indexStateStream = null;
	stateStream = null;
	lastQueryStream = null;
	constructor() {
		this.state = (0, import_stream.default)({
			query: "",
			searchResult: null,
			indexState: mailLocator.search?.indexState(),
			entities: [],
			selected: null
		});
		this.overlayContentComponent = { view: () => {
			return mithril_default(SearchBarOverlay, {
				state: this.state(),
				isQuickSearch: this.isQuickSearch(),
				isFocused: this.focused,
				selectResult: (selected) => this.selectResult(selected)
			});
		} };
		this.view = this.view.bind(this);
		this.oncreate = this.oncreate.bind(this);
		this.onremove = this.onremove.bind(this);
	}
	/**
	* this reacts to URL changes by clearing the suggestions - the selected item may have changed (in the mail view maybe)
	* that shouldn't clear our current state, but if the URL changed in a way that makes the previous state outdated, we clear it.
	*/
	onPathChange = memoized((newPath) => {
		if (mailLocator.search.isNewSearch(this.state().query, getRestriction(newPath))) this.updateState({
			searchResult: null,
			selected: null,
			entities: []
		});
	});
	view(vnode) {
		this.onPathChange(mithril_default.route.get());
		return mithril_default(
			// form wrapper to isolate the search input and prevent it from being autofilled when unrelated buttons are clicked on chrome
			// this is done because chrome doesn't appear to respect `autocomplete="off"` and will autofill the field anyway
			"form.full-width",
			{
				style: { "max-width": styles.isUsingBottomNavigation() ? "" : px(350) },
				onsubmit: (e) => {
					e.stopPropagation();
					e.preventDefault();
				}
			},
			mithril_default(BaseSearchBar, {
				placeholder: vnode.attrs.placeholder,
				text: this.state().query,
				busy: this.busy,
				disabled: vnode.attrs.disabled,
				onInput: (text) => this.search(text),
				onSearchClick: () => this.handleSearchClick(),
				onClear: () => {
					this.clear();
				},
				onWrapperCreated: (dom) => {
					this.domWrapper = dom;
					this.showOverlay();
				},
				onInputCreated: (dom) => {
					this.domInput = dom;
				},
				onFocus: () => this.focused = true,
				onBlur: () => this.onBlur(),
				onKeyDown: (e) => this.onkeydown(e)
			})
);
	}
	onkeydown = (e) => {
		const { selected, entities } = this.state();
		const keyHandlers = [
			{
				key: Keys.F1,
				exec: () => keyManager.openF1Help()
			},
			{
				key: Keys.ESC,
				exec: () => this.clear()
			},
			{
				key: Keys.RETURN,
				exec: () => {
					if (selected) this.selectResult(selected);
else this.search();
					this.domInput.blur();
				}
			},
			{
				key: Keys.UP,
				exec: () => {
					if (entities.length > 0) {
						let oldSelected = selected || entities[0];
						this.updateState({ selected: entities[mod(entities.indexOf(oldSelected) - 1, entities.length)] });
					}
				}
			},
			{
				key: Keys.DOWN,
				exec: () => {
					if (entities.length > 0) {
						let newSelected = selected || entities[0];
						this.updateState({ selected: entities[mod(entities.indexOf(newSelected) + 1, entities.length)] });
					}
				}
			}
		];
		let keyHandler = keyHandlers.find((handler) => isKeyPressed(e.key, handler.key));
		if (keyHandler) {
			keyHandler.exec();
			e.preventDefault();
		}
		e.stopPropagation();
		return true;
	};
	oncreate() {
		if (isApp()) this.onFocus();
		keyManager.registerShortcuts(this.shortcuts);
		this.indexStateStream = mailLocator.search.indexState.map((indexState) => {
			const currentResult = this.state().searchResult;
			if (!indexState.failedIndexingUpTo && currentResult && this.state().indexState.progress !== 0 && indexState.progress === 0 && !this.timePeriodHasChanged(currentResult.restriction.end, indexState.aimedMailIndexTimestamp)) this.doSearch(this.state().query, currentResult.restriction, mithril_default.redraw);
			this.updateState({ indexState });
		});
		this.stateStream = this.state.map((state) => mithril_default.redraw());
		this.lastQueryStream = mailLocator.search.lastQueryString.map((value) => {
			if (value) this.updateState({ query: value });
		});
	}
	onremove() {
		this.focused = false;
		if (this.shortcuts) keyManager.unregisterShortcuts(this.shortcuts);
		this.stateStream?.end(true);
		this.lastQueryStream?.end(true);
		this.indexStateStream?.end(true);
		this.closeOverlay();
	}
	timePeriodHasChanged(oldEnd, aimedEnd) {
		return oldEnd !== aimedEnd;
	}
	/**
	* Ensure that overlay exists in DOM
	*/
	showOverlay() {
		if (this.closeOverlayFunction == null && this.domWrapper != null) this.closeOverlayFunction = displayOverlay(() => this.makeOverlayRect(), this.overlayContentComponent, undefined, undefined, "dropdown-shadow border-radius");
else mithril_default.redraw();
	}
	closeOverlay() {
		if (this.closeOverlayFunction) {
			this.closeOverlayFunction();
			this.closeOverlayFunction = null;
		}
	}
	makeOverlayRect() {
		let overlayRect;
		const domRect = this.domWrapper.getBoundingClientRect();
		if (styles.isDesktopLayout()) overlayRect = {
			top: px(domRect.bottom + 5),
			right: px(window.innerWidth - domRect.right),
			width: px(350),
			zIndex: LayerType.LowPriorityOverlay
		};
else if (window.innerWidth < 500) overlayRect = {
			top: px(size.navbar_height_mobile + 6),
			left: px(16),
			right: px(16),
			zIndex: LayerType.LowPriorityOverlay
		};
else overlayRect = {
			top: px(size.navbar_height_mobile + 6),
			left: px(domRect.left),
			right: px(window.innerWidth - domRect.right),
			zIndex: LayerType.LowPriorityOverlay
		};
		return overlayRect;
	}
	shortcuts = [{
		key: Keys.F,
		enabled: () => true,
		exec: () => {
			this.onFocus();
			mithril_default.redraw();
		},
		help: "search_label"
	}];
	selectResult(result) {
		const { query } = this.state();
		if (result != null) {
			let type = "_type" in result ? result._type : null;
			if (!type) {
				if (result.allowShowMore) this.updateSearchUrl(query);
			} else if (isSameTypeRef(MailTypeRef, type)) this.updateSearchUrl(query, downcast(result));
else if (isSameTypeRef(ContactTypeRef, type)) this.updateSearchUrl(query, downcast(result));
else if (isSameTypeRef(CalendarEventTypeRef, type)) this.updateSearchUrl(query, downcast(result));
		}
	}
	handleSearchClick() {
		if (!this.focused) this.onFocus();
else this.search();
	}
	getRestriction() {
		return getRestriction(mithril_default.route.get());
	}
	updateSearchUrl(query, selected) {
		if (selected && assertIsEntity(selected, CalendarEventTypeRef)) searchRouter.routeTo(query, this.getRestriction(), selected && encodeCalendarSearchKey(selected));
else searchRouter.routeTo(query, this.getRestriction(), selected && getElementId(selected));
	}
	search(query) {
		let oldQuery = this.state().query;
		if (query != null) this.updateState({ query });
else query = oldQuery;
		let restriction = this.getRestriction();
		if (!mailLocator.search.indexState().mailIndexEnabled && restriction && isSameTypeRef(restriction.type, MailTypeRef) && !this.confirmDialogShown) {
			this.focused = false;
			this.confirmDialogShown = true;
			Dialog.confirm("enableSearchMailbox_msg", "search_label").then((confirmed) => {
				if (confirmed) mailLocator.indexerFacade.enableMailIndexing().then(() => {
					this.search();
					this.onFocus();
				}).catch(ofClass(IndexingNotSupportedError, () => {
					Dialog.message(isApp() ? "searchDisabledApp_msg" : "searchDisabled_msg");
				}));
			}).finally(() => this.confirmDialogShown = false);
		} else {
			if (!mailLocator.search.indexState().mailIndexEnabled && isSameTypeRef(restriction.type, MailTypeRef)) return;
			if (!mailLocator.search.isNewSearch(query, restriction) && oldQuery === query) {
				const result = mailLocator.search.result();
				if (this.isQuickSearch() && result) this.showResultsInOverlay(result);
				this.busy = false;
			} else {
				if (query.trim() !== "") this.busy = true;
				this.doSearch(query, restriction, () => {
					this.busy = false;
					mithril_default.redraw();
				});
			}
		}
	}
	doSearch = debounce(300, (query, restriction, cb) => {
		if (!this.isQuickSearch()) {
			searchRouter.routeTo(query, restriction);
			return cb();
		}
		let useSuggestions = mithril_default.route.get().startsWith("/settings");
		const limit = isSameTypeRef(MailTypeRef, restriction.type) ? this.isQuickSearch() ? MAX_SEARCH_PREVIEW_RESULTS : PageSize : null;
		mailLocator.search.search({
			query: query ?? "",
			restriction,
			minSuggestionCount: useSuggestions ? 10 : 0,
			maxResults: limit
		}, mailLocator.progressTracker).then((result) => this.loadAndDisplayResult(query, result ? result : null, limit)).finally(() => cb());
	});
	/** Given the result from the search load additional results if needed and then display them or set URL. */
	loadAndDisplayResult(query, result, limit) {
		const safeResult = result, safeLimit = limit;
		this.updateState({ searchResult: safeResult });
		if (!safeResult || mailLocator.search.isNewSearch(query, safeResult.restriction)) return;
		if (this.isQuickSearch()) if (safeLimit && hasMoreResults(safeResult) && safeResult.results.length < safeLimit) mailLocator.searchFacade.getMoreSearchResults(safeResult, safeLimit - safeResult.results.length).then((moreResults) => {
			if (mailLocator.search.isNewSearch(query, moreResults.restriction)) return;
else this.loadAndDisplayResult(query, moreResults, limit);
		});
else this.showResultsInOverlay(safeResult);
else searchRouter.routeTo(query, safeResult.restriction);
	}
	clear() {
		if (mithril_default.route.get().startsWith("/search")) {
			this.updateSearchUrl("");
			mailLocator.search.result(null);
		}
		this.updateState({
			query: "",
			entities: [],
			selected: null,
			searchResult: null
		});
	}
	async showResultsInOverlay(result) {
		const filteredEvents = result.results.filter(([calendarId, eventId]) => !isClientOnlyCalendar(calendarId));
		const eventsRepository = await mailLocator.calendarEventsRepository();
		const entries = [...await loadMultipleFromLists(result.restriction.type, mailLocator.entityClient, filteredEvents), ...await retrieveClientOnlyEventsForUser(mailLocator.logins, result.results, eventsRepository.getBirthdayEvents())];
		if (!mailLocator.search.isNewSearch(result.query, result.restriction)) {
			const { filteredEntries, couldShowMore } = this.filterResults(entries, result.restriction);
			if (result.query.trim() !== "" && (filteredEntries.length === 0 || hasMoreResults(result) || couldShowMore || result.currentIndexTimestamp !== FULL_INDEXED_TIMESTAMP)) {
				const moreEntry = {
					resultCount: result.results.length,
					shownCount: filteredEntries.length,
					indexTimestamp: result.currentIndexTimestamp,
					allowShowMore: true
				};
				filteredEntries.push(moreEntry);
			}
			this.updateState({
				entities: filteredEntries,
				selected: filteredEntries[0]
			});
		}
	}
	isQuickSearch() {
		return !mithril_default.route.get().startsWith("/search");
	}
	filterResults(instances, restriction) {
		if (isSameTypeRef(restriction.type, ContactTypeRef)) return {
			filteredEntries: instances.slice().sort((o1, o2) => compareContacts(o1, o2)).slice(0, MAX_SEARCH_PREVIEW_RESULTS),
			couldShowMore: instances.length > MAX_SEARCH_PREVIEW_RESULTS
		};
else if (isSameTypeRef(restriction.type, CalendarEventTypeRef)) {
			const range = {
				start: restriction.start ?? 0,
				end: restriction.end ?? 0
			};
			const generatedInstances = generateCalendarInstancesInRange(downcast(instances), range, MAX_SEARCH_PREVIEW_RESULTS + 1);
			return {
				filteredEntries: generatedInstances.slice(0, MAX_SEARCH_PREVIEW_RESULTS),
				couldShowMore: generatedInstances.length > MAX_SEARCH_PREVIEW_RESULTS
			};
		}
		return {
			filteredEntries: instances.slice(0, MAX_SEARCH_PREVIEW_RESULTS),
			couldShowMore: instances.length > MAX_SEARCH_PREVIEW_RESULTS
		};
	}
	onFocus() {
		if (!mailLocator.search.indexingSupported) Dialog.message(isApp() ? "searchDisabledApp_msg" : "searchDisabled_msg");
else if (!this.focused) {
			this.focused = true;
			setTimeout(() => {
				this.domInput.focus();
				this.search();
			}, client.browser === BrowserType.SAFARI ? 200 : 0);
		}
	}
	onBlur() {
		this.focused = false;
		if (this.state().query === "") {
			if (mithril_default.route.get().startsWith("/search")) {
				const restriction = searchRouter.getRestriction();
				searchRouter.routeTo("", restriction);
			}
		}
		mithril_default.redraw();
	}
	updateState(update) {
		const newState = Object.assign({}, this.state(), update);
		this.state(newState);
		return newState;
	}
};
const searchBar = new SearchBar();

//#endregion
export { SearchBar, searchBar };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VhcmNoQmFyLWNodW5rLmpzIiwibmFtZXMiOlsic3RhdGU6IFNlYXJjaEJhclN0YXRlIiwiYXR0cnM6IFNlYXJjaEJhck92ZXJsYXlBdHRycyIsImU6IE1vdXNlRXZlbnQiLCJmYWlsZWRJbmRleGluZ1VwVG86IG51bWJlciIsInJlc3VsdDogRW50cnkiLCJ0eXBlOiBUeXBlUmVmPGFueT4gfCBudWxsIiwicmVzdWx0OiBTaG93TW9yZUFjdGlvbiIsImNvbnRhY3Q6IENvbnRhY3QiLCJldmVudDogQ2FsZW5kYXJFdmVudCIsIm1haWw6IE1haWwiLCJuZXdQYXRoOiBzdHJpbmciLCJ2bm9kZTogVm5vZGU8U2VhcmNoQmFyQXR0cnM+IiwiZTogU3VibWl0RXZlbnQiLCJlOiBLZXlib2FyZEV2ZW50IiwibSIsIm9sZEVuZDogbnVtYmVyIHwgbnVsbCIsImFpbWVkRW5kOiBudW1iZXIiLCJvdmVybGF5UmVjdDogUG9zaXRpb25SZWN0IiwicmVzdWx0OiAoTWFpbCB8IG51bGwpIHwgQ29udGFjdCB8IFdoaXRlbGFiZWxDaGlsZCB8IENhbGVuZGFyRXZlbnQgfCBTaG93TW9yZUFjdGlvbiIsInR5cGU6IFR5cGVSZWY8YW55PiB8IG51bGwiLCJxdWVyeTogc3RyaW5nIiwic2VsZWN0ZWQ/OiBMaXN0RWxlbWVudEVudGl0eSIsInF1ZXJ5Pzogc3RyaW5nIiwicmVzdHJpY3Rpb246IFNlYXJjaFJlc3RyaWN0aW9uIiwiY2I6ICgpID0+IHZvaWQiLCJyZXN1bHQ6IFNlYXJjaFJlc3VsdCB8IG51bGwiLCJsaW1pdDogbnVtYmVyIHwgbnVsbCIsInJlc3VsdDogU2VhcmNoUmVzdWx0IiwibW9yZUVudHJ5OiBTaG93TW9yZUFjdGlvbiIsImluc3RhbmNlczogQXJyYXk8RW50cnk+IiwidXBkYXRlOiBQYXJ0aWFsPFNlYXJjaEJhclN0YXRlPiJdLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWlsLWFwcC9zZWFyY2gvU2VhcmNoQmFyT3ZlcmxheS50cyIsIi4uL3NyYy9tYWlsLWFwcC9zZWFyY2gvU2VhcmNoQmFyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRW50cnksIFNlYXJjaEJhclN0YXRlLCBTaG93TW9yZUFjdGlvbiB9IGZyb20gXCIuL1NlYXJjaEJhclwiXG5pbXBvcnQgeyBweCwgc2l6ZSB9IGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL3NpemVcIlxuaW1wb3J0IHsgbGFuZyB9IGZyb20gXCIuLi8uLi9jb21tb24vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbFwiXG5pbXBvcnQgeyBCdXR0b24sIEJ1dHRvblR5cGUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9iYXNlL0J1dHRvbi5qc1wiXG5pbXBvcnQgeyBJY29ucyB9IGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL2Jhc2UvaWNvbnMvSWNvbnNcIlxuaW1wb3J0IHsgZG93bmNhc3QsIGlzRW1wdHksIGlzU2FtZVR5cGVSZWYsIFR5cGVSZWYgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IEZVTExfSU5ERVhFRF9USU1FU1RBTVAgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHNcIlxuaW1wb3J0IHsgZm9ybWF0RGF0ZSwgZm9ybWF0VGltZU9yRGF0ZU9yWWVzdGVyZGF5IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9taXNjL0Zvcm1hdHRlclwiXG5pbXBvcnQgdHlwZSB7IENhbGVuZGFyRXZlbnQsIENvbnRhY3QsIE1haWwgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBDYWxlbmRhckV2ZW50VHlwZVJlZiwgQ29udGFjdFR5cGVSZWYsIE1haWxUeXBlUmVmIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvZW50aXRpZXMvdHV0YW5vdGEvVHlwZVJlZnMuanNcIlxuaW1wb3J0IEJhZGdlIGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL2Jhc2UvQmFkZ2VcIlxuaW1wb3J0IHsgSWNvbiB9IGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL2Jhc2UvSWNvblwiXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL21pc2MvQ2xpZW50RGV0ZWN0b3JcIlxuaW1wb3J0IG0sIHsgQ2hpbGRyZW4sIENvbXBvbmVudCwgVm5vZGUgfSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gXCIuLi8uLi9jb21tb24vZ3VpL3RoZW1lXCJcbmltcG9ydCB7IGdldE1haWxGb2xkZXJJY29uLCBpc1R1dGFub3RhVGVhbU1haWwgfSBmcm9tIFwiLi4vbWFpbC92aWV3L01haWxHdWlVdGlsc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvbWFpbi9Db21tb25Mb2NhdG9yXCJcbmltcG9ydCB7IEluZGV4aW5nRXJyb3JSZWFzb24gfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS93b3JrZXIvc2VhcmNoL1NlYXJjaFR5cGVzXCJcbmltcG9ydCB7IGNvbXBhbnlUZWFtTGFiZWwgfSBmcm9tIFwiLi4vLi4vY29tbW9uL21pc2MvQ2xpZW50Q29uc3RhbnRzLmpzXCJcbmltcG9ydCB7IGdldFRpbWVab25lIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyVXRpbHMuanNcIlxuXG5pbXBvcnQgeyBmb3JtYXRFdmVudER1cmF0aW9uIH0gZnJvbSBcIi4uLy4uL2NhbGVuZGFyLWFwcC9jYWxlbmRhci9ndWkvQ2FsZW5kYXJHdWlVdGlscy5qc1wiXG5pbXBvcnQgeyBnZXRDb250YWN0TGlzdE5hbWUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2NvbnRhY3RzRnVuY3Rpb25hbGl0eS9Db250YWN0VXRpbHMuanNcIlxuXG5pbXBvcnQgeyBnZXRTZW5kZXJPclJlY2lwaWVudEhlYWRpbmcgfSBmcm9tIFwiLi4vbWFpbC92aWV3L01haWxWaWV3ZXJVdGlscy5qc1wiXG5pbXBvcnQgeyBtYWlsTG9jYXRvciB9IGZyb20gXCIuLi9tYWlsTG9jYXRvci5qc1wiXG5cbnR5cGUgU2VhcmNoQmFyT3ZlcmxheUF0dHJzID0ge1xuXHRzdGF0ZTogU2VhcmNoQmFyU3RhdGVcblx0aXNRdWlja1NlYXJjaDogYm9vbGVhblxuXHRpc0ZvY3VzZWQ6IGJvb2xlYW5cblx0c2VsZWN0UmVzdWx0OiAocmVzdWx0OiBFbnRyeSB8IG51bGwpID0+IHZvaWRcbn1cblxuZXhwb3J0IGNsYXNzIFNlYXJjaEJhck92ZXJsYXkgaW1wbGVtZW50cyBDb21wb25lbnQ8U2VhcmNoQmFyT3ZlcmxheUF0dHJzPiB7XG5cdHZpZXcoeyBhdHRycyB9OiBWbm9kZTxTZWFyY2hCYXJPdmVybGF5QXR0cnM+KTogQ2hpbGRyZW4ge1xuXHRcdGNvbnN0IHsgc3RhdGUgfSA9IGF0dHJzXG5cdFx0cmV0dXJuIFtcblx0XHRcdHRoaXMuX3JlbmRlckluZGV4aW5nU3RhdHVzKHN0YXRlLCBhdHRycyksXG5cdFx0XHRzdGF0ZS5lbnRpdGllcyAmJiAhaXNFbXB0eShzdGF0ZS5lbnRpdGllcykgJiYgYXR0cnMuaXNRdWlja1NlYXJjaCAmJiBhdHRycy5pc0ZvY3VzZWQgPyB0aGlzLnJlbmRlclJlc3VsdHMoc3RhdGUsIGF0dHJzKSA6IG51bGwsXG5cdFx0XVxuXHR9XG5cblx0cmVuZGVyUmVzdWx0cyhzdGF0ZTogU2VhcmNoQmFyU3RhdGUsIGF0dHJzOiBTZWFyY2hCYXJPdmVybGF5QXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0cmV0dXJuIG0oXCJ1bC5saXN0LmNsaWNrLm1haWwtbGlzdFwiLCBbXG5cdFx0XHRzdGF0ZS5lbnRpdGllcy5tYXAoKHJlc3VsdCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gbShcblx0XHRcdFx0XHRcImxpLnBsci1sLmZsZXgtdi1jZW50ZXIuXCIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0aGVpZ2h0OiBweCg1MiksXG5cdFx0XHRcdFx0XHRcdFwiYm9yZGVyLWxlZnRcIjogcHgoc2l6ZS5ib3JkZXJfc2VsZWN0aW9uKSArIFwiIHNvbGlkIHRyYW5zcGFyZW50XCIsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0Ly8gYXZvaWQgY2xvc2luZyBvdmVybGF5IGJlZm9yZSB0aGUgY2xpY2sgZXZlbnQgY2FuIGJlIHJlY2VpdmVkXG5cdFx0XHRcdFx0XHRvbm1vdXNlZG93bjogKGU6IE1vdXNlRXZlbnQpID0+IGUucHJldmVudERlZmF1bHQoKSxcblx0XHRcdFx0XHRcdG9uY2xpY2s6ICgpID0+IGF0dHJzLnNlbGVjdFJlc3VsdChyZXN1bHQpLFxuXHRcdFx0XHRcdFx0Y2xhc3M6IHN0YXRlLnNlbGVjdGVkID09PSByZXN1bHQgPyBcInJvdy1zZWxlY3RlZFwiIDogXCJcIixcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHRoaXMucmVuZGVyUmVzdWx0KHN0YXRlLCByZXN1bHQpLFxuXHRcdFx0XHQpXG5cdFx0XHR9KSxcblx0XHRdKVxuXHR9XG5cblx0X3JlbmRlckluZGV4aW5nU3RhdHVzKHN0YXRlOiBTZWFyY2hCYXJTdGF0ZSwgYXR0cnM6IFNlYXJjaEJhck92ZXJsYXlBdHRycyk6IENoaWxkcmVuIHtcblx0XHRpZiAoYXR0cnMuaXNGb2N1c2VkIHx8ICghYXR0cnMuaXNRdWlja1NlYXJjaCAmJiBjbGllbnQuaXNEZXNrdG9wRGV2aWNlKCkpKSB7XG5cdFx0XHRpZiAoc3RhdGUuaW5kZXhTdGF0ZS5mYWlsZWRJbmRleGluZ1VwVG8gIT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJFcnJvcihzdGF0ZS5pbmRleFN0YXRlLmZhaWxlZEluZGV4aW5nVXBUbywgYXR0cnMpXG5cdFx0XHR9IGVsc2UgaWYgKHN0YXRlLmluZGV4U3RhdGUucHJvZ3Jlc3MgIT09IDApIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuX3JlbmRlclByb2dyZXNzKHN0YXRlLCBhdHRycylcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXHR9XG5cblx0X3JlbmRlclByb2dyZXNzKHN0YXRlOiBTZWFyY2hCYXJTdGF0ZSwgYXR0cnM6IFNlYXJjaEJhck92ZXJsYXlBdHRycyk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gbShcIi5mbGV4LmNvbC5yZWxcIiwgW1xuXHRcdFx0bShcblx0XHRcdFx0XCIucGxyLWwucHQtcy5wYi1zLmZsZXguaXRlbXMtY2VudGVyLmZsZXgtc3BhY2UtYmV0d2Vlbi5tci1uZWdhdGl2ZS1zXCIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0aGVpZ2h0OiBweCg1MiksXG5cdFx0XHRcdFx0XHRib3JkZXJMZWZ0OiBgJHtweChzaXplLmJvcmRlcl9zZWxlY3Rpb24pfSBzb2xpZCB0cmFuc3BhcmVudGAsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSxcblx0XHRcdFx0W1xuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcIi50b3AuZmxleC1zcGFjZS1iZXR3ZWVuLmNvbFwiLFxuXHRcdFx0XHRcdFx0bShcblx0XHRcdFx0XHRcdFx0XCIuYm90dG9tLmZsZXgtc3BhY2UtYmV0d2VlblwiLFxuXHRcdFx0XHRcdFx0XHRtKFxuXHRcdFx0XHRcdFx0XHRcdFwiXCIsXG5cdFx0XHRcdFx0XHRcdFx0bGFuZy5nZXQoXCJpbmRleGVkTWFpbHNfbGFiZWxcIiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XCJ7Y291bnR9XCI6IHN0YXRlLmluZGV4U3RhdGUuaW5kZXhlZE1haWxDb3VudCxcblx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRzdGF0ZS5pbmRleFN0YXRlLnByb2dyZXNzICE9PSAxMDBcblx0XHRcdFx0XHRcdD8gbShcblx0XHRcdFx0XHRcdFx0XHRcImRpdlwiLFxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdC8vIGF2b2lkIGNsb3Npbmcgb3ZlcmxheSBiZWZvcmUgdGhlIGNsaWNrIGV2ZW50IGNhbiBiZSByZWNlaXZlZFxuXHRcdFx0XHRcdFx0XHRcdFx0b25tb3VzZWRvd246IChlOiBNb3VzZUV2ZW50KSA9PiBlLnByZXZlbnREZWZhdWx0KCksXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRtKEJ1dHRvbiwge1xuXHRcdFx0XHRcdFx0XHRcdFx0bGFiZWw6IFwiY2FuY2VsX2FjdGlvblwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y2xpY2s6ICgpID0+IG1haWxMb2NhdG9yLmluZGV4ZXJGYWNhZGUuY2FuY2VsTWFpbEluZGV4aW5nKCksXG5cdFx0XHRcdFx0XHRcdFx0XHQvL2ljb246ICgpID0+IEljb25zLkNhbmNlbFxuXHRcdFx0XHRcdFx0XHRcdFx0dHlwZTogQnV0dG9uVHlwZS5TZWNvbmRhcnksXG5cdFx0XHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHQgIClcblx0XHRcdFx0XHRcdDogbnVsbCwgLy8gYXZvaWQgY2xvc2luZyBvdmVybGF5IGJlZm9yZSB0aGUgY2xpY2sgZXZlbnQgY2FuIGJlIHJlY2VpdmVkXG5cdFx0XHRcdF0sXG5cdFx0XHQpLFxuXHRcdFx0bShcIi5hYnNcIiwge1xuXHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdGJhY2tncm91bmRDb2xvcjogdGhlbWUuY29udGVudF9hY2NlbnQsXG5cdFx0XHRcdFx0aGVpZ2h0OiBcIjJweFwiLFxuXHRcdFx0XHRcdHdpZHRoOiBzdGF0ZS5pbmRleFN0YXRlLnByb2dyZXNzICsgXCIlXCIsXG5cdFx0XHRcdFx0Ym90dG9tOiAwLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSksXG5cdFx0XSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyRXJyb3IoZmFpbGVkSW5kZXhpbmdVcFRvOiBudW1iZXIsIGF0dHJzOiBTZWFyY2hCYXJPdmVybGF5QXR0cnMpOiBDaGlsZHJlbiB7XG5cdFx0Y29uc3QgZXJyb3JNZXNzYWdlS2V5ID0gYXR0cnMuc3RhdGUuaW5kZXhTdGF0ZS5lcnJvciA9PT0gSW5kZXhpbmdFcnJvclJlYXNvbi5Db25uZWN0aW9uTG9zdCA/IFwiaW5kZXhpbmdGYWlsZWRDb25uZWN0aW9uX2Vycm9yXCIgOiBcImluZGV4aW5nX2Vycm9yXCJcblxuXHRcdHJldHVybiBtKFwiLmZsZXgucmVsXCIsIFtcblx0XHRcdG0oXG5cdFx0XHRcdFwiLnBsci1sLnB0LXMucGItcy5mbGV4Lml0ZW1zLWNlbnRlci5mbGV4LXNwYWNlLWJldHdlZW4ubXItbmVnYXRpdmUtc1wiLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdGhlaWdodDogcHgoNTIpLFxuXHRcdFx0XHRcdFx0Ym9yZGVyTGVmdDogYCR7cHgoc2l6ZS5ib3JkZXJfc2VsZWN0aW9uKX0gc29saWQgdHJhbnNwYXJlbnRgLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFtcblx0XHRcdFx0XHRtKFwiLnNtYWxsXCIsIGxhbmcuZ2V0KGVycm9yTWVzc2FnZUtleSkpLFxuXHRcdFx0XHRcdG0oXG5cdFx0XHRcdFx0XHRcImRpdlwiLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHQvLyBhdm9pZCBjbG9zaW5nIG92ZXJsYXkgYmVmb3JlIHRoZSBjbGljayBldmVudCBjYW4gYmUgcmVjZWl2ZWRcblx0XHRcdFx0XHRcdFx0b25tb3VzZWRvd246IChlOiBNb3VzZUV2ZW50KSA9PiBlLnByZXZlbnREZWZhdWx0KCksXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0bShCdXR0b24sIHtcblx0XHRcdFx0XHRcdFx0bGFiZWw6IFwicmV0cnlfYWN0aW9uXCIsXG5cdFx0XHRcdFx0XHRcdGNsaWNrOiAoKSA9PiBtYWlsTG9jYXRvci5pbmRleGVyRmFjYWRlLmV4dGVuZE1haWxJbmRleChmYWlsZWRJbmRleGluZ1VwVG8pLFxuXHRcdFx0XHRcdFx0XHR0eXBlOiBCdXR0b25UeXBlLlNlY29uZGFyeSxcblx0XHRcdFx0XHRcdH0pLFxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdF0sXG5cdFx0XHQpLFxuXHRcdF0pXG5cdH1cblxuXHRyZW5kZXJSZXN1bHQoc3RhdGU6IFNlYXJjaEJhclN0YXRlLCByZXN1bHQ6IEVudHJ5KTogQ2hpbGRyZW4ge1xuXHRcdGxldCB0eXBlOiBUeXBlUmVmPGFueT4gfCBudWxsID0gXCJfdHlwZVwiIGluIHJlc3VsdCA/IHJlc3VsdC5fdHlwZSA6IG51bGxcblxuXHRcdGlmICghdHlwZSkge1xuXHRcdFx0cmV0dXJuIHRoaXMucmVuZGVyU2hvd01vcmVBY3Rpb24oZG93bmNhc3QocmVzdWx0KSlcblx0XHR9IGVsc2UgaWYgKGlzU2FtZVR5cGVSZWYoTWFpbFR5cGVSZWYsIHR5cGUpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJNYWlsUmVzdWx0KGRvd25jYXN0KHJlc3VsdCksIHN0YXRlKVxuXHRcdH0gZWxzZSBpZiAoaXNTYW1lVHlwZVJlZihDb250YWN0VHlwZVJlZiwgdHlwZSkpIHtcblx0XHRcdHJldHVybiB0aGlzLnJlbmRlckNvbnRhY3RSZXN1bHQoZG93bmNhc3QocmVzdWx0KSlcblx0XHR9IGVsc2UgaWYgKGlzU2FtZVR5cGVSZWYoQ2FsZW5kYXJFdmVudFR5cGVSZWYsIHR5cGUpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5yZW5kZXJDYWxlbmRhckV2ZW50UmVzdWx0KGRvd25jYXN0KHJlc3VsdCkpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBbXVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyU2hvd01vcmVBY3Rpb24ocmVzdWx0OiBTaG93TW9yZUFjdGlvbik6IENoaWxkcmVuIHtcblx0XHQvLyBzaG93IG1vcmUgYWN0aW9uXG5cdFx0bGV0IHNob3dNb3JlQWN0aW9uID0gcmVzdWx0IGFzIGFueSBhcyBTaG93TW9yZUFjdGlvblxuXHRcdGxldCBpbmZvVGV4dFxuXHRcdGxldCBpbmRleEluZm9cblxuXHRcdGlmIChzaG93TW9yZUFjdGlvbi5yZXN1bHRDb3VudCA9PT0gMCkge1xuXHRcdFx0aW5mb1RleHQgPSBsYW5nLmdldChcInNlYXJjaE5vUmVzdWx0c19tc2dcIilcblxuXHRcdFx0aWYgKGxvY2F0b3IubG9naW5zLmdldFVzZXJDb250cm9sbGVyKCkuaXNGcmVlQWNjb3VudCgpKSB7XG5cdFx0XHRcdGluZGV4SW5mbyA9IGxhbmcuZ2V0KFwiY2hhbmdlVGltZUZyYW1lX21zZ1wiKVxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoc2hvd01vcmVBY3Rpb24uYWxsb3dTaG93TW9yZSkge1xuXHRcdFx0aW5mb1RleHQgPSBsYW5nLmdldChcInNob3dNb3JlX2FjdGlvblwiKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRpbmZvVGV4dCA9IGxhbmcuZ2V0KFwibW9yZVJlc3VsdHNGb3VuZF9tc2dcIiwge1xuXHRcdFx0XHRcInsxfVwiOiBzaG93TW9yZUFjdGlvbi5yZXN1bHRDb3VudCAtIHNob3dNb3JlQWN0aW9uLnNob3duQ291bnQsXG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdGlmIChzaG93TW9yZUFjdGlvbi5pbmRleFRpbWVzdGFtcCA+IEZVTExfSU5ERVhFRF9USU1FU1RBTVAgJiYgIWluZGV4SW5mbykge1xuXHRcdFx0aW5kZXhJbmZvID0gbGFuZy5nZXQoXCJzZWFyY2hlZFVudGlsX21zZ1wiKSArIFwiIFwiICsgZm9ybWF0RGF0ZShuZXcgRGF0ZShzaG93TW9yZUFjdGlvbi5pbmRleFRpbWVzdGFtcCkpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGluZGV4SW5mb1xuXHRcdFx0PyBbbShcIi50b3AuZmxleC1jZW50ZXJcIiwgaW5mb1RleHQpLCBtKFwiLmJvdHRvbS5mbGV4LWNlbnRlci5zbWFsbFwiLCBpbmRleEluZm8pXVxuXHRcdFx0OiBtKFwibGkucGxyLWwucHQtcy5wYi1zLml0ZW1zLWNlbnRlci5mbGV4LWNlbnRlclwiLCBtKFwiLmZsZXgtY2VudGVyXCIsIGluZm9UZXh0KSlcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQ29udGFjdFJlc3VsdChjb250YWN0OiBDb250YWN0KTogQ2hpbGRyZW4ge1xuXHRcdHJldHVybiBbXG5cdFx0XHRtKFwiLnRvcC5mbGV4LXNwYWNlLWJldHdlZW5cIiwgbShcIi5uYW1lXCIsIGdldENvbnRhY3RMaXN0TmFtZShjb250YWN0KSkpLFxuXHRcdFx0bShcblx0XHRcdFx0XCIuYm90dG9tLmZsZXgtc3BhY2UtYmV0d2VlblwiLFxuXHRcdFx0XHRtKFwic21hbGwubWFpbC1hZGRyZXNzXCIsIGNvbnRhY3QubWFpbEFkZHJlc3NlcyAmJiBjb250YWN0Lm1haWxBZGRyZXNzZXMubGVuZ3RoID4gMCA/IGNvbnRhY3QubWFpbEFkZHJlc3Nlc1swXS5hZGRyZXNzIDogXCJcIiksXG5cdFx0XHQpLFxuXHRcdF1cblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyQ2FsZW5kYXJFdmVudFJlc3VsdChldmVudDogQ2FsZW5kYXJFdmVudCk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShcIi50b3AuZmxleC1zcGFjZS1iZXR3ZWVuXCIsIG0oXCIubmFtZS50ZXh0LWVsbGlwc2lzXCIsIHsgdGl0bGU6IGV2ZW50LnN1bW1hcnkgfSwgZXZlbnQuc3VtbWFyeSkpLFxuXHRcdFx0bShcIi5ib3R0b20uZmxleC1zcGFjZS1iZXR3ZWVuXCIsIG0oXCJzbWFsbC5tYWlsLWFkZHJlc3NcIiwgZm9ybWF0RXZlbnREdXJhdGlvbihldmVudCwgZ2V0VGltZVpvbmUoKSwgZmFsc2UpKSksXG5cdFx0XVxuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJNYWlsUmVzdWx0KG1haWw6IE1haWwsIHN0YXRlOiBTZWFyY2hCYXJTdGF0ZSk6IENoaWxkcmVuIHtcblx0XHRyZXR1cm4gW1xuXHRcdFx0bShcIi50b3AuZmxleC1zcGFjZS1iZXR3ZWVuLmJhZGdlLWxpbmUtaGVpZ2h0XCIsIFtcblx0XHRcdFx0aXNUdXRhbm90YVRlYW1NYWlsKG1haWwpXG5cdFx0XHRcdFx0PyBtKFxuXHRcdFx0XHRcdFx0XHRCYWRnZSxcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGNsYXNzZXM6IFwiLnNtYWxsLm1yLXNcIixcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0Y29tcGFueVRlYW1MYWJlbCxcblx0XHRcdFx0XHQgIClcblx0XHRcdFx0XHQ6IG51bGwsXG5cdFx0XHRcdG0oXCJzbWFsbC50ZXh0LWVsbGlwc2lzXCIsIGdldFNlbmRlck9yUmVjaXBpZW50SGVhZGluZyhtYWlsLCB0cnVlKSksXG5cdFx0XHRcdG0oXCJzbWFsbC50ZXh0LWVsbGlwc2lzLmZsZXgtZml4ZWRcIiwgZm9ybWF0VGltZU9yRGF0ZU9yWWVzdGVyZGF5KG1haWwucmVjZWl2ZWREYXRlKSksXG5cdFx0XHRdKSxcblx0XHRcdG0oXCIuYm90dG9tLmZsZXgtc3BhY2UtYmV0d2VlblwiLCBbXG5cdFx0XHRcdG0oXCIudGV4dC1lbGxpcHNpc1wiLCBtYWlsLnN1YmplY3QpLFxuXHRcdFx0XHRtKFxuXHRcdFx0XHRcdFwiLmljb25zLmZsZXgtZml4ZWRcIixcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRzdHlsZToge1xuXHRcdFx0XHRcdFx0XHRcIm1hcmdpbi1yaWdodFwiOiBcIi0zcHhcIixcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRbXG5cdFx0XHRcdFx0XHQvLyAzcHggdG8gbmV1dHJhbGl6ZSB0aGUgc3ZnIGljb25zIGludGVybmFsIGJvcmRlclxuXHRcdFx0XHRcdFx0bShJY29uLCB7XG5cdFx0XHRcdFx0XHRcdGljb246IGdldE1haWxGb2xkZXJJY29uKG1haWwpLFxuXHRcdFx0XHRcdFx0XHRjbGFzczogc3RhdGUuc2VsZWN0ZWQgPT09IG1haWwgPyBcInN2Zy1jb250ZW50LWFjY2VudC1mZ1wiIDogXCJzdmctY29udGVudC1mZ1wiLFxuXHRcdFx0XHRcdFx0fSksXG5cdFx0XHRcdFx0XHRtKEljb24sIHtcblx0XHRcdFx0XHRcdFx0aWNvbjogSWNvbnMuQXR0YWNobWVudCxcblx0XHRcdFx0XHRcdFx0Y2xhc3M6IHN0YXRlLnNlbGVjdGVkID09PSBtYWlsID8gXCJzdmctY29udGVudC1hY2NlbnQtZmdcIiA6IFwic3ZnLWNvbnRlbnQtZmdcIixcblx0XHRcdFx0XHRcdFx0c3R5bGU6IHtcblx0XHRcdFx0XHRcdFx0XHRkaXNwbGF5OiBtYWlsLmF0dGFjaG1lbnRzLmxlbmd0aCA+IDAgPyBcIlwiIDogXCJub25lXCIsXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHQpLFxuXHRcdFx0XSksXG5cdFx0XVxuXHR9XG59XG4iLCJpbXBvcnQgbSwgeyBDb21wb25lbnQsIFZub2RlIH0gZnJvbSBcIm1pdGhyaWxcIlxuaW1wb3J0IHsgcHgsIHNpemUgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2d1aS9zaXplXCJcbmltcG9ydCBzdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCBTdHJlYW0gZnJvbSBcIm1pdGhyaWwvc3RyZWFtXCJcbmltcG9ydCB0eXBlIHsgUG9zaXRpb25SZWN0IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYmFzZS9PdmVybGF5XCJcbmltcG9ydCB7IGRpc3BsYXlPdmVybGF5IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYmFzZS9PdmVybGF5XCJcbmltcG9ydCB0eXBlIHsgQ2FsZW5kYXJFdmVudCwgQ29udGFjdCwgTWFpbCB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyRXZlbnRUeXBlUmVmLCBDb250YWN0VHlwZVJlZiwgTWFpbFR5cGVSZWYgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgdHlwZSB7IFNob3J0Y3V0IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9taXNjL0tleU1hbmFnZXJcIlxuaW1wb3J0IHsgaXNLZXlQcmVzc2VkLCBrZXlNYW5hZ2VyIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9taXNjL0tleU1hbmFnZXJcIlxuaW1wb3J0IHsgZW5jb2RlQ2FsZW5kYXJTZWFyY2hLZXksIGdldFJlc3RyaWN0aW9uIH0gZnJvbSBcIi4vbW9kZWwvU2VhcmNoVXRpbHNcIlxuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYmFzZS9EaWFsb2dcIlxuaW1wb3J0IHR5cGUgeyBXaGl0ZWxhYmVsQ2hpbGQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9lbnRpdGllcy9zeXMvVHlwZVJlZnMuanNcIlxuaW1wb3J0IHsgRlVMTF9JTkRFWEVEX1RJTUVTVEFNUCwgS2V5cyB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50c1wiXG5pbXBvcnQgeyBhc3NlcnRNYWluT3JOb2RlLCBpc0FwcCB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpL2NvbW1vbi9FbnZcIlxuaW1wb3J0IHsgc3R5bGVzIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvc3R5bGVzXCJcbmltcG9ydCB7IGNsaWVudCB9IGZyb20gXCIuLi8uLi9jb21tb24vbWlzYy9DbGllbnREZXRlY3RvclwiXG5pbXBvcnQgeyBkZWJvdW5jZSwgZG93bmNhc3QsIGlzU2FtZVR5cGVSZWYsIG1lbW9pemVkLCBtb2QsIG9mQ2xhc3MsIFR5cGVSZWYgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IEJyb3dzZXJUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9taXNjL0NsaWVudENvbnN0YW50c1wiXG5pbXBvcnQgeyBoYXNNb3JlUmVzdWx0cyB9IGZyb20gXCIuL21vZGVsL1NlYXJjaE1vZGVsXCJcbmltcG9ydCB7IFNlYXJjaEJhck92ZXJsYXkgfSBmcm9tIFwiLi9TZWFyY2hCYXJPdmVybGF5XCJcbmltcG9ydCB7IEluZGV4aW5nTm90U3VwcG9ydGVkRXJyb3IgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvSW5kZXhpbmdOb3RTdXBwb3J0ZWRFcnJvclwiXG5pbXBvcnQgdHlwZSB7IFNlYXJjaEluZGV4U3RhdGVJbmZvLCBTZWFyY2hSZXN0cmljdGlvbiwgU2VhcmNoUmVzdWx0IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL3NlYXJjaC9TZWFyY2hUeXBlc1wiXG5pbXBvcnQgeyBhc3NlcnRJc0VudGl0eSwgZ2V0RWxlbWVudElkIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL3V0aWxzL0VudGl0eVV0aWxzXCJcbmltcG9ydCB7IGNvbXBhcmVDb250YWN0cyB9IGZyb20gXCIuLi9jb250YWN0cy92aWV3L0NvbnRhY3RHdWlVdGlsc1wiXG5pbXBvcnQgeyBMYXllclR5cGUgfSBmcm9tIFwiLi4vLi4vUm9vdFZpZXdcIlxuaW1wb3J0IHsgQmFzZVNlYXJjaEJhciwgQmFzZVNlYXJjaEJhckF0dHJzIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYmFzZS9CYXNlU2VhcmNoQmFyLmpzXCJcbmltcG9ydCB7IFNlYXJjaFJvdXRlciB9IGZyb20gXCIuLi8uLi9jb21tb24vc2VhcmNoL3ZpZXcvU2VhcmNoUm91dGVyLmpzXCJcbmltcG9ydCB7IFBhZ2VTaXplIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9ndWkvYmFzZS9MaXN0VXRpbHMuanNcIlxuaW1wb3J0IHsgZ2VuZXJhdGVDYWxlbmRhckluc3RhbmNlc0luUmFuZ2UsIGlzQ2xpZW50T25seUNhbGVuZGFyLCByZXRyaWV2ZUNsaWVudE9ubHlFdmVudHNGb3JVc2VyIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9jYWxlbmRhci9kYXRlL0NhbGVuZGFyVXRpbHMuanNcIlxuaW1wb3J0IHsgTGlzdEVsZW1lbnRFbnRpdHkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5VHlwZXMuanNcIlxuXG5pbXBvcnQgeyBsb2FkTXVsdGlwbGVGcm9tTGlzdHMgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaS9jb21tb24vRW50aXR5Q2xpZW50LmpzXCJcbmltcG9ydCB7IG1haWxMb2NhdG9yIH0gZnJvbSBcIi4uL21haWxMb2NhdG9yLmpzXCJcblxuYXNzZXJ0TWFpbk9yTm9kZSgpXG5leHBvcnQgdHlwZSBTaG93TW9yZUFjdGlvbiA9IHtcblx0cmVzdWx0Q291bnQ6IG51bWJlclxuXHRzaG93bkNvdW50OiBudW1iZXJcblx0aW5kZXhUaW1lc3RhbXA6IG51bWJlclxuXHRhbGxvd1Nob3dNb3JlOiBib29sZWFuXG59XG5leHBvcnQgdHlwZSBTZWFyY2hCYXJBdHRycyA9IHtcblx0cGxhY2Vob2xkZXI/OiBzdHJpbmcgfCBudWxsXG5cdHJldHVybkxpc3RlbmVyPzogKCgpID0+IHVua25vd24pIHwgbnVsbFxuXHRkaXNhYmxlZD86IGJvb2xlYW5cbn1cblxuY29uc3QgTUFYX1NFQVJDSF9QUkVWSUVXX1JFU1VMVFMgPSAxMFxuZXhwb3J0IHR5cGUgRW50cnkgPSBNYWlsIHwgQ29udGFjdCB8IENhbGVuZGFyRXZlbnQgfCBXaGl0ZWxhYmVsQ2hpbGQgfCBTaG93TW9yZUFjdGlvblxudHlwZSBFbnRyaWVzID0gQXJyYXk8RW50cnk+XG5leHBvcnQgdHlwZSBTZWFyY2hCYXJTdGF0ZSA9IHtcblx0cXVlcnk6IHN0cmluZ1xuXHRzZWFyY2hSZXN1bHQ6IFNlYXJjaFJlc3VsdCB8IG51bGxcblx0aW5kZXhTdGF0ZTogU2VhcmNoSW5kZXhTdGF0ZUluZm9cblx0ZW50aXRpZXM6IEVudHJpZXNcblx0c2VsZWN0ZWQ6IEVudHJ5IHwgbnVsbFxufVxuXG4vLyBjcmVhdGUgb3VyIG93biBjb3B5IHdoaWNoIGlzIG5vdCBwZXJmZWN0IGJlY2F1c2Ugd2UgZG9uJ3QgYmVuZWZpdCBmcm9tIHRoZSBzaGFyZWQgY2FjaGUgYnV0IGN1cnJlbnRseSB0aGVyZSdzIG5vIHdheSB0byBnZXQgYXN5bmMgZGVwZW5kZW5jaWVzIGludG9cbi8vIHNpbmdsZXRvbnMgbGlrZSB0aGlzICh3aXRob3V0IHRvcC1sZXZlbCBhd2FpdCBhdCBsZWFzdClcbi8vIG9uY2UgU2VhcmNoQmFyIGlzIHJld3JpdHRlbiB0aGlzIHNob3VsZCBiZSByZW1vdmVkXG5jb25zdCBzZWFyY2hSb3V0ZXIgPSBuZXcgU2VhcmNoUm91dGVyKG1haWxMb2NhdG9yLnRocm90dGxlZFJvdXRlcigpKVxuXG5leHBvcnQgY2xhc3MgU2VhcmNoQmFyIGltcGxlbWVudHMgQ29tcG9uZW50PFNlYXJjaEJhckF0dHJzPiB7XG5cdGZvY3VzZWQ6IGJvb2xlYW4gPSBmYWxzZVxuXHRwcml2YXRlIHJlYWRvbmx5IHN0YXRlOiBTdHJlYW08U2VhcmNoQmFyU3RhdGU+XG5cdGJ1c3k6IGJvb2xlYW4gPSBmYWxzZVxuXHRwcml2YXRlIGxhc3RTZWxlY3RlZFdoaXRlbGFiZWxDaGlsZHJlbkluZm9SZXN1bHQ6IFN0cmVhbTxXaGl0ZWxhYmVsQ2hpbGQ+ID0gc3RyZWFtKClcblx0cHJpdmF0ZSBjbG9zZU92ZXJsYXlGdW5jdGlvbjogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSByZWFkb25seSBvdmVybGF5Q29udGVudENvbXBvbmVudDogQ29tcG9uZW50XG5cdHByaXZhdGUgY29uZmlybURpYWxvZ1Nob3duOiBib29sZWFuID0gZmFsc2Vcblx0cHJpdmF0ZSBkb21XcmFwcGVyITogSFRNTEVsZW1lbnRcblx0cHJpdmF0ZSBkb21JbnB1dCE6IEhUTUxFbGVtZW50XG5cdHByaXZhdGUgaW5kZXhTdGF0ZVN0cmVhbTogU3RyZWFtPHVua25vd24+IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBzdGF0ZVN0cmVhbTogU3RyZWFtPHVua25vd24+IHwgbnVsbCA9IG51bGxcblx0cHJpdmF0ZSBsYXN0UXVlcnlTdHJlYW06IFN0cmVhbTx1bmtub3duPiB8IG51bGwgPSBudWxsXG5cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5zdGF0ZSA9IHN0cmVhbTxTZWFyY2hCYXJTdGF0ZT4oe1xuXHRcdFx0cXVlcnk6IFwiXCIsXG5cdFx0XHRzZWFyY2hSZXN1bHQ6IG51bGwsXG5cdFx0XHRpbmRleFN0YXRlOiBtYWlsTG9jYXRvci5zZWFyY2g/LmluZGV4U3RhdGUoKSxcblx0XHRcdGVudGl0aWVzOiBbXSBhcyBFbnRyaWVzLFxuXHRcdFx0c2VsZWN0ZWQ6IG51bGwsXG5cdFx0fSlcblx0XHR0aGlzLm92ZXJsYXlDb250ZW50Q29tcG9uZW50ID0ge1xuXHRcdFx0dmlldzogKCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gbShTZWFyY2hCYXJPdmVybGF5LCB7XG5cdFx0XHRcdFx0c3RhdGU6IHRoaXMuc3RhdGUoKSxcblx0XHRcdFx0XHRpc1F1aWNrU2VhcmNoOiB0aGlzLmlzUXVpY2tTZWFyY2goKSxcblx0XHRcdFx0XHRpc0ZvY3VzZWQ6IHRoaXMuZm9jdXNlZCxcblx0XHRcdFx0XHRzZWxlY3RSZXN1bHQ6IChzZWxlY3RlZCkgPT4gdGhpcy5zZWxlY3RSZXN1bHQoc2VsZWN0ZWQpLFxuXHRcdFx0XHR9KVxuXHRcdFx0fSxcblx0XHR9XG5cblx0XHR0aGlzLnZpZXcgPSB0aGlzLnZpZXcuYmluZCh0aGlzKVxuXHRcdHRoaXMub25jcmVhdGUgPSB0aGlzLm9uY3JlYXRlLmJpbmQodGhpcylcblx0XHR0aGlzLm9ucmVtb3ZlID0gdGhpcy5vbnJlbW92ZS5iaW5kKHRoaXMpXG5cdH1cblxuXHQvKipcblx0ICogdGhpcyByZWFjdHMgdG8gVVJMIGNoYW5nZXMgYnkgY2xlYXJpbmcgdGhlIHN1Z2dlc3Rpb25zIC0gdGhlIHNlbGVjdGVkIGl0ZW0gbWF5IGhhdmUgY2hhbmdlZCAoaW4gdGhlIG1haWwgdmlldyBtYXliZSlcblx0ICogdGhhdCBzaG91bGRuJ3QgY2xlYXIgb3VyIGN1cnJlbnQgc3RhdGUsIGJ1dCBpZiB0aGUgVVJMIGNoYW5nZWQgaW4gYSB3YXkgdGhhdCBtYWtlcyB0aGUgcHJldmlvdXMgc3RhdGUgb3V0ZGF0ZWQsIHdlIGNsZWFyIGl0LlxuXHQgKi9cblx0cHJpdmF0ZSByZWFkb25seSBvblBhdGhDaGFuZ2UgPSBtZW1vaXplZCgobmV3UGF0aDogc3RyaW5nKSA9PiB7XG5cdFx0aWYgKG1haWxMb2NhdG9yLnNlYXJjaC5pc05ld1NlYXJjaCh0aGlzLnN0YXRlKCkucXVlcnksIGdldFJlc3RyaWN0aW9uKG5ld1BhdGgpKSkge1xuXHRcdFx0dGhpcy51cGRhdGVTdGF0ZSh7XG5cdFx0XHRcdHNlYXJjaFJlc3VsdDogbnVsbCxcblx0XHRcdFx0c2VsZWN0ZWQ6IG51bGwsXG5cdFx0XHRcdGVudGl0aWVzOiBbXSxcblx0XHRcdH0pXG5cdFx0fVxuXHR9KVxuXG5cdHZpZXcodm5vZGU6IFZub2RlPFNlYXJjaEJhckF0dHJzPikge1xuXHRcdHRoaXMub25QYXRoQ2hhbmdlKG0ucm91dGUuZ2V0KCkpXG5cblx0XHRyZXR1cm4gbShcblx0XHRcdC8vIGZvcm0gd3JhcHBlciB0byBpc29sYXRlIHRoZSBzZWFyY2ggaW5wdXQgYW5kIHByZXZlbnQgaXQgZnJvbSBiZWluZyBhdXRvZmlsbGVkIHdoZW4gdW5yZWxhdGVkIGJ1dHRvbnMgYXJlIGNsaWNrZWQgb24gY2hyb21lXG5cdFx0XHQvLyB0aGlzIGlzIGRvbmUgYmVjYXVzZSBjaHJvbWUgZG9lc24ndCBhcHBlYXIgdG8gcmVzcGVjdCBgYXV0b2NvbXBsZXRlPVwib2ZmXCJgIGFuZCB3aWxsIGF1dG9maWxsIHRoZSBmaWVsZCBhbnl3YXlcblx0XHRcdFwiZm9ybS5mdWxsLXdpZHRoXCIsXG5cdFx0XHR7XG5cdFx0XHRcdHN0eWxlOiB7XG5cdFx0XHRcdFx0XCJtYXgtd2lkdGhcIjogc3R5bGVzLmlzVXNpbmdCb3R0b21OYXZpZ2F0aW9uKCkgPyBcIlwiIDogcHgoMzUwKSxcblx0XHRcdFx0fSxcblx0XHRcdFx0b25zdWJtaXQ6IChlOiBTdWJtaXRFdmVudCkgPT4ge1xuXHRcdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0fSxcblx0XHRcdH0sXG5cdFx0XHRtKEJhc2VTZWFyY2hCYXIsIHtcblx0XHRcdFx0cGxhY2Vob2xkZXI6IHZub2RlLmF0dHJzLnBsYWNlaG9sZGVyLFxuXHRcdFx0XHR0ZXh0OiB0aGlzLnN0YXRlKCkucXVlcnksXG5cdFx0XHRcdGJ1c3k6IHRoaXMuYnVzeSxcblx0XHRcdFx0ZGlzYWJsZWQ6IHZub2RlLmF0dHJzLmRpc2FibGVkLFxuXHRcdFx0XHRvbklucHV0OiAodGV4dCkgPT4gdGhpcy5zZWFyY2godGV4dCksXG5cdFx0XHRcdG9uU2VhcmNoQ2xpY2s6ICgpID0+IHRoaXMuaGFuZGxlU2VhcmNoQ2xpY2soKSxcblx0XHRcdFx0b25DbGVhcjogKCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuY2xlYXIoKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbldyYXBwZXJDcmVhdGVkOiAoZG9tKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5kb21XcmFwcGVyID0gZG9tXG5cdFx0XHRcdFx0dGhpcy5zaG93T3ZlcmxheSgpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uSW5wdXRDcmVhdGVkOiAoZG9tKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5kb21JbnB1dCA9IGRvbVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbkZvY3VzOiAoKSA9PiAodGhpcy5mb2N1c2VkID0gdHJ1ZSksXG5cdFx0XHRcdG9uQmx1cjogKCkgPT4gdGhpcy5vbkJsdXIoKSxcblx0XHRcdFx0b25LZXlEb3duOiAoZSkgPT4gdGhpcy5vbmtleWRvd24oZSksXG5cdFx0XHR9IHNhdGlzZmllcyBCYXNlU2VhcmNoQmFyQXR0cnMpLFxuXHRcdClcblx0fVxuXG5cdHByaXZhdGUgcmVhZG9ubHkgb25rZXlkb3duID0gKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcblx0XHRjb25zdCB7IHNlbGVjdGVkLCBlbnRpdGllcyB9ID0gdGhpcy5zdGF0ZSgpXG5cblx0XHRjb25zdCBrZXlIYW5kbGVycyA9IFtcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLkYxLFxuXHRcdFx0XHRleGVjOiAoKSA9PiBrZXlNYW5hZ2VyLm9wZW5GMUhlbHAoKSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5FU0MsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHRoaXMuY2xlYXIoKSxcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdGtleTogS2V5cy5SRVRVUk4sXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHRpZiAoc2VsZWN0ZWQpIHtcblx0XHRcdFx0XHRcdHRoaXMuc2VsZWN0UmVzdWx0KHNlbGVjdGVkKVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLnNlYXJjaCgpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIGJsdXIoKSBpcyB1c2VkIHRvIGhpZGUga2V5Ym9hcmQgb24gcmV0dXJuIGJ1dHRvbiBjbGlja1xuXHRcdFx0XHRcdHRoaXMuZG9tSW5wdXQuYmx1cigpXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRrZXk6IEtleXMuVVAsXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHRpZiAoZW50aXRpZXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdFx0bGV0IG9sZFNlbGVjdGVkID0gc2VsZWN0ZWQgfHwgZW50aXRpZXNbMF1cblxuXHRcdFx0XHRcdFx0dGhpcy51cGRhdGVTdGF0ZSh7XG5cdFx0XHRcdFx0XHRcdHNlbGVjdGVkOiBlbnRpdGllc1ttb2QoZW50aXRpZXMuaW5kZXhPZihvbGRTZWxlY3RlZCkgLSAxLCBlbnRpdGllcy5sZW5ndGgpXSxcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0a2V5OiBLZXlzLkRPV04sXG5cdFx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0XHRpZiAoZW50aXRpZXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdFx0bGV0IG5ld1NlbGVjdGVkID0gc2VsZWN0ZWQgfHwgZW50aXRpZXNbMF1cblxuXHRcdFx0XHRcdFx0dGhpcy51cGRhdGVTdGF0ZSh7XG5cdFx0XHRcdFx0XHRcdHNlbGVjdGVkOiBlbnRpdGllc1ttb2QoZW50aXRpZXMuaW5kZXhPZihuZXdTZWxlY3RlZCkgKyAxLCBlbnRpdGllcy5sZW5ndGgpXSxcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0fSxcblx0XHRdXG5cdFx0bGV0IGtleUhhbmRsZXIgPSBrZXlIYW5kbGVycy5maW5kKChoYW5kbGVyKSA9PiBpc0tleVByZXNzZWQoZS5rZXksIGhhbmRsZXIua2V5KSlcblxuXHRcdGlmIChrZXlIYW5kbGVyKSB7XG5cdFx0XHRrZXlIYW5kbGVyLmV4ZWMoKVxuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0fVxuXG5cdFx0Ly8gZGlzYWJsZSBzaG9ydGN1dHNcblx0XHRlLnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0cmV0dXJuIHRydWVcblx0fVxuXG5cdG9uY3JlYXRlKCkge1xuXHRcdGlmIChpc0FwcCgpKSB7XG5cdFx0XHQvLyBvbmx5IGZvY3VzIGluIHRoZSBtb2JpbGUgYXBwLCB0aGUgc2VhcmNoIGJhciBhbHdheXMgZXhpc3RzIGluIGRlc2t0b3Avd2ViIGFuZCB3aWxsIGFsd2F5cyBiZSBncmFiYmluZyBhdHRlbnRpb25cblx0XHRcdHRoaXMub25Gb2N1cygpXG5cdFx0fVxuXHRcdGtleU1hbmFnZXIucmVnaXN0ZXJTaG9ydGN1dHModGhpcy5zaG9ydGN1dHMpXG5cdFx0dGhpcy5pbmRleFN0YXRlU3RyZWFtID0gbWFpbExvY2F0b3Iuc2VhcmNoLmluZGV4U3RhdGUubWFwKChpbmRleFN0YXRlKSA9PiB7XG5cdFx0XHQvLyBXaGVuIHdlIGZpbmlzaGVkIGluZGV4aW5nLCBzZWFyY2ggYWdhaW4gZm9yY2libHkgdG8gbm90IGNvbmZ1c2UgYW55b25lIHdpdGggb2xkIHJlc3VsdHNcblx0XHRcdGNvbnN0IGN1cnJlbnRSZXN1bHQgPSB0aGlzLnN0YXRlKCkuc2VhcmNoUmVzdWx0XG5cblx0XHRcdGlmIChcblx0XHRcdFx0IWluZGV4U3RhdGUuZmFpbGVkSW5kZXhpbmdVcFRvICYmXG5cdFx0XHRcdGN1cnJlbnRSZXN1bHQgJiZcblx0XHRcdFx0dGhpcy5zdGF0ZSgpLmluZGV4U3RhdGUucHJvZ3Jlc3MgIT09IDAgJiZcblx0XHRcdFx0aW5kZXhTdGF0ZS5wcm9ncmVzcyA9PT0gMCAmJlxuXHRcdFx0XHQvL2lmIHBlcmlvZCBpcyBjaGFuZ2VkIGZyb20gc2VhcmNoIHZpZXcgYSBuZXcgc2VhcmNoIGlzIHRyaWdnZXJlZCB0aGVyZSwgIGFuZCB3ZSBkbyBub3Qgd2FudCB0byBvdmVyd3JpdGUgaXRzIHJlc3VsdFxuXHRcdFx0XHQhdGhpcy50aW1lUGVyaW9kSGFzQ2hhbmdlZChjdXJyZW50UmVzdWx0LnJlc3RyaWN0aW9uLmVuZCwgaW5kZXhTdGF0ZS5haW1lZE1haWxJbmRleFRpbWVzdGFtcClcblx0XHRcdCkge1xuXHRcdFx0XHR0aGlzLmRvU2VhcmNoKHRoaXMuc3RhdGUoKS5xdWVyeSwgY3VycmVudFJlc3VsdC5yZXN0cmljdGlvbiwgbS5yZWRyYXcpXG5cdFx0XHR9XG5cblx0XHRcdHRoaXMudXBkYXRlU3RhdGUoe1xuXHRcdFx0XHRpbmRleFN0YXRlLFxuXHRcdFx0fSlcblx0XHR9KVxuXG5cdFx0dGhpcy5zdGF0ZVN0cmVhbSA9IHRoaXMuc3RhdGUubWFwKChzdGF0ZSkgPT4gbS5yZWRyYXcoKSlcblx0XHR0aGlzLmxhc3RRdWVyeVN0cmVhbSA9IG1haWxMb2NhdG9yLnNlYXJjaC5sYXN0UXVlcnlTdHJpbmcubWFwKCh2YWx1ZSkgPT4ge1xuXHRcdFx0Ly8gU2V0IHZhbHVlIGZyb20gdGhlIG1vZGVsIHdoZW4gaXQncyBzZXQgZnJvbSB0aGUgVVJMIGUuZy4gcmVsb2FkaW5nIHRoZSBwYWdlIG9uIHRoZSBzZWFyY2ggc2NyZWVuXG5cdFx0XHRpZiAodmFsdWUpIHtcblx0XHRcdFx0dGhpcy51cGRhdGVTdGF0ZSh7XG5cdFx0XHRcdFx0cXVlcnk6IHZhbHVlLFxuXHRcdFx0XHR9KVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cblxuXHRvbnJlbW92ZSgpIHtcblx0XHR0aGlzLmZvY3VzZWQgPSBmYWxzZVxuXG5cdFx0aWYgKHRoaXMuc2hvcnRjdXRzKSBrZXlNYW5hZ2VyLnVucmVnaXN0ZXJTaG9ydGN1dHModGhpcy5zaG9ydGN1dHMpXG5cblx0XHR0aGlzLnN0YXRlU3RyZWFtPy5lbmQodHJ1ZSlcblxuXHRcdHRoaXMubGFzdFF1ZXJ5U3RyZWFtPy5lbmQodHJ1ZSlcblxuXHRcdHRoaXMuaW5kZXhTdGF0ZVN0cmVhbT8uZW5kKHRydWUpXG5cblx0XHR0aGlzLmNsb3NlT3ZlcmxheSgpXG5cdH1cblxuXHRwcml2YXRlIHRpbWVQZXJpb2RIYXNDaGFuZ2VkKG9sZEVuZDogbnVtYmVyIHwgbnVsbCwgYWltZWRFbmQ6IG51bWJlcik6IGJvb2xlYW4ge1xuXHRcdHJldHVybiBvbGRFbmQgIT09IGFpbWVkRW5kXG5cdH1cblxuXHQvKipcblx0ICogRW5zdXJlIHRoYXQgb3ZlcmxheSBleGlzdHMgaW4gRE9NXG5cdCAqL1xuXHRwcml2YXRlIHNob3dPdmVybGF5KCkge1xuXHRcdGlmICh0aGlzLmNsb3NlT3ZlcmxheUZ1bmN0aW9uID09IG51bGwgJiYgdGhpcy5kb21XcmFwcGVyICE9IG51bGwpIHtcblx0XHRcdHRoaXMuY2xvc2VPdmVybGF5RnVuY3Rpb24gPSBkaXNwbGF5T3ZlcmxheShcblx0XHRcdFx0KCkgPT4gdGhpcy5tYWtlT3ZlcmxheVJlY3QoKSxcblx0XHRcdFx0dGhpcy5vdmVybGF5Q29udGVudENvbXBvbmVudCxcblx0XHRcdFx0dW5kZWZpbmVkLFxuXHRcdFx0XHR1bmRlZmluZWQsXG5cdFx0XHRcdFwiZHJvcGRvd24tc2hhZG93IGJvcmRlci1yYWRpdXNcIixcblx0XHRcdClcblx0XHR9IGVsc2Uge1xuXHRcdFx0bS5yZWRyYXcoKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgY2xvc2VPdmVybGF5KCkge1xuXHRcdGlmICh0aGlzLmNsb3NlT3ZlcmxheUZ1bmN0aW9uKSB7XG5cdFx0XHR0aGlzLmNsb3NlT3ZlcmxheUZ1bmN0aW9uKClcblxuXHRcdFx0dGhpcy5jbG9zZU92ZXJsYXlGdW5jdGlvbiA9IG51bGxcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIG1ha2VPdmVybGF5UmVjdCgpOiBQb3NpdGlvblJlY3Qge1xuXHRcdC8vIG5vdGU6IHRoaXMgaXMgY2FsbGVkIG9uIGV2ZXJ5IHJlbmRlciB3aGljaCBwcm9iYWJseSB0aHJhc2hlcyBvdXIgbGF5b3V0IGNvbnN0YW50bHkuXG5cdFx0Ly8gd2Ugc2hvdWxkIGF0IGxlYXN0IG5vdCBkbyBpdCB3aGlsZSB3ZSBkb24ndCBoYXZlIGFueXRoaW5nIHRvIHNob3dcblx0XHRsZXQgb3ZlcmxheVJlY3Q6IFBvc2l0aW9uUmVjdFxuXG5cdFx0Y29uc3QgZG9tUmVjdCA9IHRoaXMuZG9tV3JhcHBlci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuXG5cdFx0aWYgKHN0eWxlcy5pc0Rlc2t0b3BMYXlvdXQoKSkge1xuXHRcdFx0b3ZlcmxheVJlY3QgPSB7XG5cdFx0XHRcdHRvcDogcHgoZG9tUmVjdC5ib3R0b20gKyA1KSxcblx0XHRcdFx0cmlnaHQ6IHB4KHdpbmRvdy5pbm5lcldpZHRoIC0gZG9tUmVjdC5yaWdodCksXG5cdFx0XHRcdHdpZHRoOiBweCgzNTApLFxuXHRcdFx0XHR6SW5kZXg6IExheWVyVHlwZS5Mb3dQcmlvcml0eU92ZXJsYXksXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh3aW5kb3cuaW5uZXJXaWR0aCA8IDUwMCkge1xuXHRcdFx0b3ZlcmxheVJlY3QgPSB7XG5cdFx0XHRcdHRvcDogcHgoc2l6ZS5uYXZiYXJfaGVpZ2h0X21vYmlsZSArIDYpLFxuXHRcdFx0XHRsZWZ0OiBweCgxNiksXG5cdFx0XHRcdHJpZ2h0OiBweCgxNiksXG5cdFx0XHRcdHpJbmRleDogTGF5ZXJUeXBlLkxvd1ByaW9yaXR5T3ZlcmxheSxcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0b3ZlcmxheVJlY3QgPSB7XG5cdFx0XHRcdHRvcDogcHgoc2l6ZS5uYXZiYXJfaGVpZ2h0X21vYmlsZSArIDYpLFxuXHRcdFx0XHRsZWZ0OiBweChkb21SZWN0LmxlZnQpLFxuXHRcdFx0XHRyaWdodDogcHgod2luZG93LmlubmVyV2lkdGggLSBkb21SZWN0LnJpZ2h0KSxcblx0XHRcdFx0ekluZGV4OiBMYXllclR5cGUuTG93UHJpb3JpdHlPdmVybGF5LFxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBvdmVybGF5UmVjdFxuXHR9XG5cblx0cHJpdmF0ZSByZWFkb25seSBzaG9ydGN1dHM6IFJlYWRvbmx5QXJyYXk8U2hvcnRjdXQ+ID0gW1xuXHRcdHtcblx0XHRcdGtleTogS2V5cy5GLFxuXHRcdFx0ZW5hYmxlZDogKCkgPT4gdHJ1ZSxcblx0XHRcdGV4ZWM6ICgpID0+IHtcblx0XHRcdFx0dGhpcy5vbkZvY3VzKClcblx0XHRcdFx0bS5yZWRyYXcoKVxuXHRcdFx0fSxcblx0XHRcdGhlbHA6IFwic2VhcmNoX2xhYmVsXCIsXG5cdFx0fSxcblx0XVxuXG5cdHByaXZhdGUgc2VsZWN0UmVzdWx0KHJlc3VsdDogKE1haWwgfCBudWxsKSB8IENvbnRhY3QgfCBXaGl0ZWxhYmVsQ2hpbGQgfCBDYWxlbmRhckV2ZW50IHwgU2hvd01vcmVBY3Rpb24pIHtcblx0XHRjb25zdCB7IHF1ZXJ5IH0gPSB0aGlzLnN0YXRlKClcblxuXHRcdGlmIChyZXN1bHQgIT0gbnVsbCkge1xuXHRcdFx0bGV0IHR5cGU6IFR5cGVSZWY8YW55PiB8IG51bGwgPSBcIl90eXBlXCIgaW4gcmVzdWx0ID8gcmVzdWx0Ll90eXBlIDogbnVsbFxuXG5cdFx0XHRpZiAoIXR5cGUpIHtcblx0XHRcdFx0Ly8gY2xpY2sgb24gU0hPVyBNT1JFIGJ1dHRvblxuXHRcdFx0XHRpZiAoKHJlc3VsdCBhcyBTaG93TW9yZUFjdGlvbikuYWxsb3dTaG93TW9yZSkge1xuXHRcdFx0XHRcdHRoaXMudXBkYXRlU2VhcmNoVXJsKHF1ZXJ5KVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGlzU2FtZVR5cGVSZWYoTWFpbFR5cGVSZWYsIHR5cGUpKSB7XG5cdFx0XHRcdHRoaXMudXBkYXRlU2VhcmNoVXJsKHF1ZXJ5LCBkb3duY2FzdChyZXN1bHQpKVxuXHRcdFx0fSBlbHNlIGlmIChpc1NhbWVUeXBlUmVmKENvbnRhY3RUeXBlUmVmLCB0eXBlKSkge1xuXHRcdFx0XHR0aGlzLnVwZGF0ZVNlYXJjaFVybChxdWVyeSwgZG93bmNhc3QocmVzdWx0KSlcblx0XHRcdH0gZWxzZSBpZiAoaXNTYW1lVHlwZVJlZihDYWxlbmRhckV2ZW50VHlwZVJlZiwgdHlwZSkpIHtcblx0XHRcdFx0dGhpcy51cGRhdGVTZWFyY2hVcmwocXVlcnksIGRvd25jYXN0KHJlc3VsdCkpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aGFuZGxlU2VhcmNoQ2xpY2soKSB7XG5cdFx0aWYgKCF0aGlzLmZvY3VzZWQpIHtcblx0XHRcdHRoaXMub25Gb2N1cygpXG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuc2VhcmNoKClcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGdldFJlc3RyaWN0aW9uKCk6IFNlYXJjaFJlc3RyaWN0aW9uIHtcblx0XHRyZXR1cm4gZ2V0UmVzdHJpY3Rpb24obS5yb3V0ZS5nZXQoKSlcblx0fVxuXG5cdHByaXZhdGUgdXBkYXRlU2VhcmNoVXJsKHF1ZXJ5OiBzdHJpbmcsIHNlbGVjdGVkPzogTGlzdEVsZW1lbnRFbnRpdHkpIHtcblx0XHRpZiAoc2VsZWN0ZWQgJiYgYXNzZXJ0SXNFbnRpdHkoc2VsZWN0ZWQsIENhbGVuZGFyRXZlbnRUeXBlUmVmKSkge1xuXHRcdFx0c2VhcmNoUm91dGVyLnJvdXRlVG8ocXVlcnksIHRoaXMuZ2V0UmVzdHJpY3Rpb24oKSwgc2VsZWN0ZWQgJiYgZW5jb2RlQ2FsZW5kYXJTZWFyY2hLZXkoc2VsZWN0ZWQpKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZWFyY2hSb3V0ZXIucm91dGVUbyhxdWVyeSwgdGhpcy5nZXRSZXN0cmljdGlvbigpLCBzZWxlY3RlZCAmJiBnZXRFbGVtZW50SWQoc2VsZWN0ZWQpKVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgc2VhcmNoKHF1ZXJ5Pzogc3RyaW5nKSB7XG5cdFx0bGV0IG9sZFF1ZXJ5ID0gdGhpcy5zdGF0ZSgpLnF1ZXJ5XG5cblx0XHRpZiAocXVlcnkgIT0gbnVsbCkge1xuXHRcdFx0dGhpcy51cGRhdGVTdGF0ZSh7XG5cdFx0XHRcdHF1ZXJ5LFxuXHRcdFx0fSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0cXVlcnkgPSBvbGRRdWVyeVxuXHRcdH1cblxuXHRcdGxldCByZXN0cmljdGlvbiA9IHRoaXMuZ2V0UmVzdHJpY3Rpb24oKVxuXG5cdFx0aWYgKCFtYWlsTG9jYXRvci5zZWFyY2guaW5kZXhTdGF0ZSgpLm1haWxJbmRleEVuYWJsZWQgJiYgcmVzdHJpY3Rpb24gJiYgaXNTYW1lVHlwZVJlZihyZXN0cmljdGlvbi50eXBlLCBNYWlsVHlwZVJlZikgJiYgIXRoaXMuY29uZmlybURpYWxvZ1Nob3duKSB7XG5cdFx0XHR0aGlzLmZvY3VzZWQgPSBmYWxzZVxuXHRcdFx0dGhpcy5jb25maXJtRGlhbG9nU2hvd24gPSB0cnVlXG5cdFx0XHREaWFsb2cuY29uZmlybShcImVuYWJsZVNlYXJjaE1haWxib3hfbXNnXCIsIFwic2VhcmNoX2xhYmVsXCIpXG5cdFx0XHRcdC50aGVuKChjb25maXJtZWQpID0+IHtcblx0XHRcdFx0XHRpZiAoY29uZmlybWVkKSB7XG5cdFx0XHRcdFx0XHRtYWlsTG9jYXRvci5pbmRleGVyRmFjYWRlXG5cdFx0XHRcdFx0XHRcdC5lbmFibGVNYWlsSW5kZXhpbmcoKVxuXHRcdFx0XHRcdFx0XHQudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5zZWFyY2goKVxuXHRcdFx0XHRcdFx0XHRcdHRoaXMub25Gb2N1cygpXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdC5jYXRjaChcblx0XHRcdFx0XHRcdFx0XHRvZkNsYXNzKEluZGV4aW5nTm90U3VwcG9ydGVkRXJyb3IsICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdERpYWxvZy5tZXNzYWdlKGlzQXBwKCkgPyBcInNlYXJjaERpc2FibGVkQXBwX21zZ1wiIDogXCJzZWFyY2hEaXNhYmxlZF9tc2dcIilcblx0XHRcdFx0XHRcdFx0XHR9KSxcblx0XHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0LmZpbmFsbHkoKCkgPT4gKHRoaXMuY29uZmlybURpYWxvZ1Nob3duID0gZmFsc2UpKVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBTa2lwIHRoZSBzZWFyY2ggaWYgdGhlIHVzZXIgaXMgdHJ5aW5nIHRvIGJ5cGFzcyB0aGUgc2VhcmNoIGRpYWxvZ1xuXHRcdFx0aWYgKCFtYWlsTG9jYXRvci5zZWFyY2guaW5kZXhTdGF0ZSgpLm1haWxJbmRleEVuYWJsZWQgJiYgaXNTYW1lVHlwZVJlZihyZXN0cmljdGlvbi50eXBlLCBNYWlsVHlwZVJlZikpIHtcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9XG5cblx0XHRcdGlmICghbWFpbExvY2F0b3Iuc2VhcmNoLmlzTmV3U2VhcmNoKHF1ZXJ5LCByZXN0cmljdGlvbikgJiYgb2xkUXVlcnkgPT09IHF1ZXJ5KSB7XG5cdFx0XHRcdGNvbnN0IHJlc3VsdCA9IG1haWxMb2NhdG9yLnNlYXJjaC5yZXN1bHQoKVxuXG5cdFx0XHRcdGlmICh0aGlzLmlzUXVpY2tTZWFyY2goKSAmJiByZXN1bHQpIHtcblx0XHRcdFx0XHR0aGlzLnNob3dSZXN1bHRzSW5PdmVybGF5KHJlc3VsdClcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMuYnVzeSA9IGZhbHNlXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAocXVlcnkudHJpbSgpICE9PSBcIlwiKSB7XG5cdFx0XHRcdFx0dGhpcy5idXN5ID0gdHJ1ZVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5kb1NlYXJjaChxdWVyeSwgcmVzdHJpY3Rpb24sICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLmJ1c3kgPSBmYWxzZVxuXHRcdFx0XHRcdG0ucmVkcmF3KClcblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlYWRvbmx5IGRvU2VhcmNoID0gZGVib3VuY2UoMzAwLCAocXVlcnk6IHN0cmluZywgcmVzdHJpY3Rpb246IFNlYXJjaFJlc3RyaWN0aW9uLCBjYjogKCkgPT4gdm9pZCkgPT4ge1xuXHRcdGlmICghdGhpcy5pc1F1aWNrU2VhcmNoKCkpIHtcblx0XHRcdC8vIGlmIHdlJ3JlIGFscmVhZHkgb24gdGhlIHNlYXJjaCB2aWV3LCB3ZSBkb24ndCB3YW50IHRvIHdhaXQgdW50aWwgdGhlcmUncyBhIG5ldyByZXN1bHQgdG8gdXBkYXRlIHRoZVxuXHRcdFx0Ly8gVUkuIHdlIGNhbiBkaXJlY3RseSBnbyB0byB0aGUgVVJMIGFuZCBsZXQgdGhlIFNlYXJjaFZpZXdNb2RlbCBkbyBpdHMgdGhpbmcgZnJvbSB0aGVyZS5cblx0XHRcdHNlYXJjaFJvdXRlci5yb3V0ZVRvKHF1ZXJ5LCByZXN0cmljdGlvbilcblx0XHRcdHJldHVybiBjYigpXG5cdFx0fVxuXG5cdFx0bGV0IHVzZVN1Z2dlc3Rpb25zID0gbS5yb3V0ZS5nZXQoKS5zdGFydHNXaXRoKFwiL3NldHRpbmdzXCIpXG5cdFx0Ly8gV2UgZG9uJ3QgbGltaXQgY29udGFjdHMgYmVjYXVzZSB3ZSBuZWVkIHRvIGRvd25sb2FkIGFsbCBvZiB0aGVtIHRvIHNvcnQgdGhlbS4gVGhleSBzaG91bGQgYmUgY2FjaGVkIGFueXdheS5cblx0XHRjb25zdCBsaW1pdCA9IGlzU2FtZVR5cGVSZWYoTWFpbFR5cGVSZWYsIHJlc3RyaWN0aW9uLnR5cGUpID8gKHRoaXMuaXNRdWlja1NlYXJjaCgpID8gTUFYX1NFQVJDSF9QUkVWSUVXX1JFU1VMVFMgOiBQYWdlU2l6ZSkgOiBudWxsXG5cblx0XHRtYWlsTG9jYXRvci5zZWFyY2hcblx0XHRcdC5zZWFyY2goXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRxdWVyeTogcXVlcnkgPz8gXCJcIixcblx0XHRcdFx0XHRyZXN0cmljdGlvbixcblx0XHRcdFx0XHRtaW5TdWdnZXN0aW9uQ291bnQ6IHVzZVN1Z2dlc3Rpb25zID8gMTAgOiAwLFxuXHRcdFx0XHRcdG1heFJlc3VsdHM6IGxpbWl0LFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRtYWlsTG9jYXRvci5wcm9ncmVzc1RyYWNrZXIsXG5cdFx0XHQpXG5cdFx0XHQudGhlbigocmVzdWx0KSA9PiB0aGlzLmxvYWRBbmREaXNwbGF5UmVzdWx0KHF1ZXJ5LCByZXN1bHQgPyByZXN1bHQgOiBudWxsLCBsaW1pdCkpXG5cdFx0XHQuZmluYWxseSgoKSA9PiBjYigpKVxuXHR9KVxuXG5cdC8qKiBHaXZlbiB0aGUgcmVzdWx0IGZyb20gdGhlIHNlYXJjaCBsb2FkIGFkZGl0aW9uYWwgcmVzdWx0cyBpZiBuZWVkZWQgYW5kIHRoZW4gZGlzcGxheSB0aGVtIG9yIHNldCBVUkwuICovXG5cdHByaXZhdGUgbG9hZEFuZERpc3BsYXlSZXN1bHQocXVlcnk6IHN0cmluZywgcmVzdWx0OiBTZWFyY2hSZXN1bHQgfCBudWxsLCBsaW1pdDogbnVtYmVyIHwgbnVsbCkge1xuXHRcdGNvbnN0IHNhZmVSZXN1bHQgPSByZXN1bHQsXG5cdFx0XHRzYWZlTGltaXQgPSBsaW1pdFxuXG5cdFx0dGhpcy51cGRhdGVTdGF0ZSh7XG5cdFx0XHRzZWFyY2hSZXN1bHQ6IHNhZmVSZXN1bHQsXG5cdFx0fSlcblxuXHRcdGlmICghc2FmZVJlc3VsdCB8fCBtYWlsTG9jYXRvci5zZWFyY2guaXNOZXdTZWFyY2gocXVlcnksIHNhZmVSZXN1bHQucmVzdHJpY3Rpb24pKSB7XG5cdFx0XHRyZXR1cm5cblx0XHR9XG5cblx0XHRpZiAodGhpcy5pc1F1aWNrU2VhcmNoKCkpIHtcblx0XHRcdGlmIChzYWZlTGltaXQgJiYgaGFzTW9yZVJlc3VsdHMoc2FmZVJlc3VsdCkgJiYgc2FmZVJlc3VsdC5yZXN1bHRzLmxlbmd0aCA8IHNhZmVMaW1pdCkge1xuXHRcdFx0XHRtYWlsTG9jYXRvci5zZWFyY2hGYWNhZGUuZ2V0TW9yZVNlYXJjaFJlc3VsdHMoc2FmZVJlc3VsdCwgc2FmZUxpbWl0IC0gc2FmZVJlc3VsdC5yZXN1bHRzLmxlbmd0aCkudGhlbigobW9yZVJlc3VsdHMpID0+IHtcblx0XHRcdFx0XHRpZiAobWFpbExvY2F0b3Iuc2VhcmNoLmlzTmV3U2VhcmNoKHF1ZXJ5LCBtb3JlUmVzdWx0cy5yZXN0cmljdGlvbikpIHtcblx0XHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLmxvYWRBbmREaXNwbGF5UmVzdWx0KHF1ZXJ5LCBtb3JlUmVzdWx0cywgbGltaXQpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5zaG93UmVzdWx0c0luT3ZlcmxheShzYWZlUmVzdWx0KVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBpbnN0YW5jZXMgd2lsbCBiZSBkaXNwbGF5ZWQgYXMgcGFydCBvZiB0aGUgbGlzdCBvZiB0aGUgc2VhcmNoIHZpZXcsIHdoZW4gdGhlIHNlYXJjaCB2aWV3IGlzIGRpc3BsYXllZFxuXHRcdFx0c2VhcmNoUm91dGVyLnJvdXRlVG8ocXVlcnksIHNhZmVSZXN1bHQucmVzdHJpY3Rpb24pXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBjbGVhcigpIHtcblx0XHRpZiAobS5yb3V0ZS5nZXQoKS5zdGFydHNXaXRoKFwiL3NlYXJjaFwiKSkge1xuXHRcdFx0Ly8gdGhpcyBuZWVkcyB0byBoYXBwZW4gaW4gdGhpcyBvcmRlciwgb3RoZXJ3aXNlIHRoZSBsaXN0J3MgcmVzdWx0IHN1YnNjcmlwdGlvbiB3aWxsIG92ZXJyaWRlIG91clxuXHRcdFx0Ly8gcm91dGluZy5cblx0XHRcdHRoaXMudXBkYXRlU2VhcmNoVXJsKFwiXCIpXG5cdFx0XHRtYWlsTG9jYXRvci5zZWFyY2gucmVzdWx0KG51bGwpXG5cdFx0fVxuXG5cdFx0dGhpcy51cGRhdGVTdGF0ZSh7XG5cdFx0XHRxdWVyeTogXCJcIixcblx0XHRcdGVudGl0aWVzOiBbXSxcblx0XHRcdHNlbGVjdGVkOiBudWxsLFxuXHRcdFx0c2VhcmNoUmVzdWx0OiBudWxsLFxuXHRcdH0pXG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHNob3dSZXN1bHRzSW5PdmVybGF5KHJlc3VsdDogU2VhcmNoUmVzdWx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgZmlsdGVyZWRFdmVudHMgPSByZXN1bHQucmVzdWx0cy5maWx0ZXIoKFtjYWxlbmRhcklkLCBldmVudElkXSkgPT4gIWlzQ2xpZW50T25seUNhbGVuZGFyKGNhbGVuZGFySWQpKVxuXG5cdFx0Y29uc3QgZXZlbnRzUmVwb3NpdG9yeSA9IGF3YWl0IG1haWxMb2NhdG9yLmNhbGVuZGFyRXZlbnRzUmVwb3NpdG9yeSgpXG5cdFx0Y29uc3QgZW50cmllcyA9IFtcblx0XHRcdC4uLihhd2FpdCBsb2FkTXVsdGlwbGVGcm9tTGlzdHMocmVzdWx0LnJlc3RyaWN0aW9uLnR5cGUsIG1haWxMb2NhdG9yLmVudGl0eUNsaWVudCwgZmlsdGVyZWRFdmVudHMpKSxcblx0XHRcdC4uLihhd2FpdCByZXRyaWV2ZUNsaWVudE9ubHlFdmVudHNGb3JVc2VyKG1haWxMb2NhdG9yLmxvZ2lucywgcmVzdWx0LnJlc3VsdHMsIGV2ZW50c1JlcG9zaXRvcnkuZ2V0QmlydGhkYXlFdmVudHMoKSkpLFxuXHRcdF1cblxuXHRcdC8vIElmIHRoZXJlIHdhcyBubyBuZXcgc2VhcmNoIHdoaWxlIHdlJ3ZlIGJlZW4gZG93bmxvYWRpbmcgdGhlIHJlc3VsdFxuXHRcdGlmICghbWFpbExvY2F0b3Iuc2VhcmNoLmlzTmV3U2VhcmNoKHJlc3VsdC5xdWVyeSwgcmVzdWx0LnJlc3RyaWN0aW9uKSkge1xuXHRcdFx0Y29uc3QgeyBmaWx0ZXJlZEVudHJpZXMsIGNvdWxkU2hvd01vcmUgfSA9IHRoaXMuZmlsdGVyUmVzdWx0cyhlbnRyaWVzLCByZXN1bHQucmVzdHJpY3Rpb24pXG5cblx0XHRcdGlmIChcblx0XHRcdFx0cmVzdWx0LnF1ZXJ5LnRyaW0oKSAhPT0gXCJcIiAmJlxuXHRcdFx0XHQoZmlsdGVyZWRFbnRyaWVzLmxlbmd0aCA9PT0gMCB8fCBoYXNNb3JlUmVzdWx0cyhyZXN1bHQpIHx8IGNvdWxkU2hvd01vcmUgfHwgcmVzdWx0LmN1cnJlbnRJbmRleFRpbWVzdGFtcCAhPT0gRlVMTF9JTkRFWEVEX1RJTUVTVEFNUClcblx0XHRcdCkge1xuXHRcdFx0XHRjb25zdCBtb3JlRW50cnk6IFNob3dNb3JlQWN0aW9uID0ge1xuXHRcdFx0XHRcdHJlc3VsdENvdW50OiByZXN1bHQucmVzdWx0cy5sZW5ndGgsXG5cdFx0XHRcdFx0c2hvd25Db3VudDogZmlsdGVyZWRFbnRyaWVzLmxlbmd0aCxcblx0XHRcdFx0XHRpbmRleFRpbWVzdGFtcDogcmVzdWx0LmN1cnJlbnRJbmRleFRpbWVzdGFtcCxcblx0XHRcdFx0XHRhbGxvd1Nob3dNb3JlOiB0cnVlLFxuXHRcdFx0XHR9XG5cdFx0XHRcdGZpbHRlcmVkRW50cmllcy5wdXNoKG1vcmVFbnRyeSlcblx0XHRcdH1cblxuXHRcdFx0dGhpcy51cGRhdGVTdGF0ZSh7XG5cdFx0XHRcdGVudGl0aWVzOiBmaWx0ZXJlZEVudHJpZXMsXG5cdFx0XHRcdHNlbGVjdGVkOiBmaWx0ZXJlZEVudHJpZXNbMF0sXG5cdFx0XHR9KVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgaXNRdWlja1NlYXJjaCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gIW0ucm91dGUuZ2V0KCkuc3RhcnRzV2l0aChcIi9zZWFyY2hcIilcblx0fVxuXG5cdHByaXZhdGUgZmlsdGVyUmVzdWx0cyhpbnN0YW5jZXM6IEFycmF5PEVudHJ5PiwgcmVzdHJpY3Rpb246IFNlYXJjaFJlc3RyaWN0aW9uKTogeyBmaWx0ZXJlZEVudHJpZXM6IEVudHJpZXM7IGNvdWxkU2hvd01vcmU6IGJvb2xlYW4gfSB7XG5cdFx0aWYgKGlzU2FtZVR5cGVSZWYocmVzdHJpY3Rpb24udHlwZSwgQ29udGFjdFR5cGVSZWYpKSB7XG5cdFx0XHQvLyBTb3J0IGNvbnRhY3RzIGJ5IG5hbWVcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGZpbHRlcmVkRW50cmllczogaW5zdGFuY2VzXG5cdFx0XHRcdFx0LnNsaWNlKCkgLy8gd2UgY2FuJ3QgbW9kaWZ5IHRoZSBnaXZlbiBhcnJheVxuXHRcdFx0XHRcdC5zb3J0KChvMSwgbzIpID0+IGNvbXBhcmVDb250YWN0cyhvMSBhcyBhbnksIG8yIGFzIGFueSkpXG5cdFx0XHRcdFx0LnNsaWNlKDAsIE1BWF9TRUFSQ0hfUFJFVklFV19SRVNVTFRTKSxcblx0XHRcdFx0Y291bGRTaG93TW9yZTogaW5zdGFuY2VzLmxlbmd0aCA+IE1BWF9TRUFSQ0hfUFJFVklFV19SRVNVTFRTLFxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoaXNTYW1lVHlwZVJlZihyZXN0cmljdGlvbi50eXBlLCBDYWxlbmRhckV2ZW50VHlwZVJlZikpIHtcblx0XHRcdGNvbnN0IHJhbmdlID0geyBzdGFydDogcmVzdHJpY3Rpb24uc3RhcnQgPz8gMCwgZW5kOiByZXN0cmljdGlvbi5lbmQgPz8gMCB9XG5cdFx0XHRjb25zdCBnZW5lcmF0ZWRJbnN0YW5jZXMgPSBnZW5lcmF0ZUNhbGVuZGFySW5zdGFuY2VzSW5SYW5nZShkb3duY2FzdChpbnN0YW5jZXMpLCByYW5nZSwgTUFYX1NFQVJDSF9QUkVWSUVXX1JFU1VMVFMgKyAxKVxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0ZmlsdGVyZWRFbnRyaWVzOiBnZW5lcmF0ZWRJbnN0YW5jZXMuc2xpY2UoMCwgTUFYX1NFQVJDSF9QUkVWSUVXX1JFU1VMVFMpLFxuXHRcdFx0XHRjb3VsZFNob3dNb3JlOiBnZW5lcmF0ZWRJbnN0YW5jZXMubGVuZ3RoID4gTUFYX1NFQVJDSF9QUkVWSUVXX1JFU1VMVFMsXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB7IGZpbHRlcmVkRW50cmllczogaW5zdGFuY2VzLnNsaWNlKDAsIE1BWF9TRUFSQ0hfUFJFVklFV19SRVNVTFRTKSwgY291bGRTaG93TW9yZTogaW5zdGFuY2VzLmxlbmd0aCA+IE1BWF9TRUFSQ0hfUFJFVklFV19SRVNVTFRTIH1cblx0fVxuXG5cdHByaXZhdGUgb25Gb2N1cygpIHtcblx0XHRpZiAoIW1haWxMb2NhdG9yLnNlYXJjaC5pbmRleGluZ1N1cHBvcnRlZCkge1xuXHRcdFx0RGlhbG9nLm1lc3NhZ2UoaXNBcHAoKSA/IFwic2VhcmNoRGlzYWJsZWRBcHBfbXNnXCIgOiBcInNlYXJjaERpc2FibGVkX21zZ1wiKVxuXHRcdH0gZWxzZSBpZiAoIXRoaXMuZm9jdXNlZCkge1xuXHRcdFx0dGhpcy5mb2N1c2VkID0gdHJ1ZVxuXHRcdFx0Ly8gc2V0VGltZW91dCB0byBmaXggYnVnIGluIGN1cnJlbnQgU2FmYXJpIHdpdGggbG9zaW5nIGZvY3VzXG5cdFx0XHRzZXRUaW1lb3V0KFxuXHRcdFx0XHQoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5kb21JbnB1dC5mb2N1cygpXG5cblx0XHRcdFx0XHR0aGlzLnNlYXJjaCgpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNsaWVudC5icm93c2VyID09PSBCcm93c2VyVHlwZS5TQUZBUkkgPyAyMDAgOiAwLFxuXHRcdFx0KVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgb25CbHVyKCkge1xuXHRcdHRoaXMuZm9jdXNlZCA9IGZhbHNlXG5cblx0XHRpZiAodGhpcy5zdGF0ZSgpLnF1ZXJ5ID09PSBcIlwiKSB7XG5cdFx0XHRpZiAobS5yb3V0ZS5nZXQoKS5zdGFydHNXaXRoKFwiL3NlYXJjaFwiKSkge1xuXHRcdFx0XHRjb25zdCByZXN0cmljdGlvbiA9IHNlYXJjaFJvdXRlci5nZXRSZXN0cmljdGlvbigpXG5cdFx0XHRcdHNlYXJjaFJvdXRlci5yb3V0ZVRvKFwiXCIsIHJlc3RyaWN0aW9uKVxuXHRcdFx0fVxuXHRcdH1cblx0XHRtLnJlZHJhdygpXG5cdH1cblxuXHRwcml2YXRlIHVwZGF0ZVN0YXRlKHVwZGF0ZTogUGFydGlhbDxTZWFyY2hCYXJTdGF0ZT4pOiBTZWFyY2hCYXJTdGF0ZSB7XG5cdFx0Y29uc3QgbmV3U3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLnN0YXRlKCksIHVwZGF0ZSlcblxuXHRcdHRoaXMuc3RhdGUobmV3U3RhdGUpXG5cblx0XHRyZXR1cm4gbmV3U3RhdGVcblx0fVxufVxuXG4vLyBTaG91bGQgYmUgY2hhbmdlZCB0byBub3QgYmUgYSBzaW5nbGV0b24gYW5kIGJlIHByb3BlciBjb21wb25lbnQgKGluc3RhbnRpYXRlZCBieSBtaXRocmlsKS5cbi8vIFdlIG5lZWQgdG8gZXh0cmFjdCBzb21lIHN0YXRlIG9mIGl0IGludG8gc29tZSBraW5kIG9mIHZpZXdNb2RlbCwgcGx1Z2dhYmxlIGRlcGVuZGluZyBvbiB0aGUgY3VycmVudCB2aWV3IGJ1dCB0aGlzIHJlcXVpcmVzIGNvbXBsZXRlIHJld3JpdGUgb2YgU2VhcmNoQmFyLlxuZXhwb3J0IGNvbnN0IHNlYXJjaEJhciA9IG5ldyBTZWFyY2hCYXIoKVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWtDYSxtQkFBTixNQUFtRTtDQUN6RSxLQUFLLEVBQUUsT0FBcUMsRUFBWTtFQUN2RCxNQUFNLEVBQUUsT0FBTyxHQUFHO0FBQ2xCLFNBQU8sQ0FDTixLQUFLLHNCQUFzQixPQUFPLE1BQU0sRUFDeEMsTUFBTSxhQUFhLFFBQVEsTUFBTSxTQUFTLElBQUksTUFBTSxpQkFBaUIsTUFBTSxZQUFZLEtBQUssY0FBYyxPQUFPLE1BQU0sR0FBRyxJQUMxSDtDQUNEO0NBRUQsY0FBY0EsT0FBdUJDLE9BQXdDO0FBQzVFLFNBQU8sZ0JBQUUsMkJBQTJCLENBQ25DLE1BQU0sU0FBUyxJQUFJLENBQUMsV0FBVztBQUM5QixVQUFPLGdCQUNOLDJCQUNBO0lBQ0MsT0FBTztLQUNOLFFBQVEsR0FBRyxHQUFHO0tBQ2QsZUFBZSxHQUFHLEtBQUssaUJBQWlCLEdBQUc7SUFDM0M7SUFFRCxhQUFhLENBQUNDLE1BQWtCLEVBQUUsZ0JBQWdCO0lBQ2xELFNBQVMsTUFBTSxNQUFNLGFBQWEsT0FBTztJQUN6QyxPQUFPLE1BQU0sYUFBYSxTQUFTLGlCQUFpQjtHQUNwRCxHQUNELEtBQUssYUFBYSxPQUFPLE9BQU8sQ0FDaEM7RUFDRCxFQUFDLEFBQ0YsRUFBQztDQUNGO0NBRUQsc0JBQXNCRixP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