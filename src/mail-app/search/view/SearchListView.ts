import m, { Children, Component, Vnode } from "mithril"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { downcast, isSameTypeRef, TypeRef, YEAR_IN_MILLIS } from "@tutao/tutanota-utils"
import { MailRow } from "../../mail/view/MailRow"
import { ListElementListModel } from "../../../common/misc/ListElementListModel.js"
import { List, ListAttrs, ListLoadingState, MultiselectMode, RenderConfig } from "../../../common/gui/base/List.js"
import { component_size, px, size } from "../../../common/gui/size.js"
import { KindaContactRow } from "../../contacts/view/ContactListView.js"
import { SearchableTypes } from "./SearchViewModel.js"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, Mail, MailSet } from "../../../common/api/entities/tutanota/TypeRefs.js"
import ColumnEmptyMessageBox from "../../../common/gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../../common/gui/theme.js"
import { VirtualRow } from "../../../common/gui/base/ListUtils.js"
import { styles } from "../../../common/gui/styles.js"
import { KindaCalendarRow } from "../../../calendar-app/calendar/gui/CalendarRow.js"
import type { SearchToken } from "../../../common/api/common/utils/QueryTokenUtils"
import { shouldAlwaysShowMultiselectCheckbox } from "../../../common/gui/SelectableRowContainer"
import { ListColumnWrapper } from "../../../common/gui/ListColumnWrapper"
import { CalendarInfoBase } from "../../../calendar-app/calendar/model/CalendarModel"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { IndexingErrorReason, SearchIndexStateInfo } from "../../../common/api/worker/search/SearchTypes"
import Stream from "mithril/stream"
import { lang } from "../../../common/misc/LanguageViewModel"
import { Button, ButtonType } from "../../../common/gui/base/Button"
import { mailLocator } from "../../mailLocator"
import { CircleLoadingBar } from "../../../common/gui/ProgressSnackBar"
import { FULL_INDEXED_TIMESTAMP } from "../../../common/api/common/TutanotaConstants"
import { formatDate } from "../../../common/misc/Formatter"

assertMainOrNode()

export class SearchResultListEntry {
	constructor(readonly entry: SearchableTypes) {}

	get _id(): IdTuple {
		return this.entry._id
	}
}

export interface SearchListViewAttrs {
	listModel: ListElementListModel<SearchResultListEntry>
	onSingleSelection: (item: SearchResultListEntry) => unknown
	currentType: TypeRef<Mail | Contact | CalendarEvent>
	isFreeAccount: boolean
	cancelCallback: () => unknown | null
	getLabelsForMail: (mail: Mail) => MailSet[]
	highlightedStrings: readonly SearchToken[]
	availableCalendars: ReadonlyArray<CalendarInfoBase>
	indexStateStream: Stream<SearchIndexStateInfo>
	extendIndex: () => unknown
}

export class SearchListView implements Component<SearchListViewAttrs> {
	private attrs: SearchListViewAttrs
	private indexStateStream: Stream<unknown> | null = null

	private get listModel(): ListElementListModel<SearchResultListEntry> {
		return this.attrs.listModel
	}

	constructor({ attrs }: Vnode<SearchListViewAttrs>) {
		this.attrs = attrs
	}

	oncreate({ attrs: { indexStateStream } }: Vnode<SearchListViewAttrs>) {
		this.indexStateStream = indexStateStream.map(() => m.redraw())
	}

	onremove() {
		this.indexStateStream?.end(true)
	}

	view({ attrs }: Vnode<SearchListViewAttrs>): Children {
		this.attrs = attrs
		const { icon, renderConfig } = this.getRenderItems(attrs.currentType)

		return m(
			ListColumnWrapper,
			{ headerContent: null, class: styles.isSingleColumnLayout() ? undefined : "column-resize-margin" },
			attrs.listModel.isEmptyAndDone()
				? m(ColumnEmptyMessageBox, {
						icon,
						message: "searchNoResults_msg",
						color: theme.on_surface_variant,
					})
				: m(List, {
						state: attrs.listModel.state,
						renderConfig,
						onLoadMore: () => {
							this.listModel.loadMore()
						},
						onRetryLoading: () => {
							this.listModel.retryLoading()
						},
						onSingleSelection: (item: SearchResultListEntry) => {
							this.listModel.onSingleSelection(item)
							attrs.onSingleSelection(item)
						},
						onSingleTogglingMultiselection: (item: SearchResultListEntry) => {
							this.listModel.onSingleInclusiveSelection(item, styles.isSingleColumnLayout())
						},
						onRangeSelectionTowards: (item: SearchResultListEntry) => {
							this.listModel.selectRangeTowards(item)
						},
						onStopLoading: () => {
							if (attrs.cancelCallback != null) {
								attrs.cancelCallback()
							}

							this.listModel.stopLoading()
						},
						renderEndOfListMessage: this.endOfListRender(attrs),
					} satisfies ListAttrs<SearchResultListEntry, SearchResultListRow>),
		)
	}

	private endOfListRender(attrs: SearchListViewAttrs): Children {
		const failedIndexingUpTo = attrs.indexStateStream().failedIndexingUpTo
		if (failedIndexingUpTo != null) {
			const errorMessageKey = attrs.indexStateStream().error === IndexingErrorReason.ConnectionLost ? "indexingFailedConnection_error" : "indexing_error"
			return m(
				".flex-center.items-center",
				{
					style: {
						height: px(component_size.list_row_height),
						width: "100%",
						position: "absolute",
						gap: px(size.spacing_4),
					},
					"data-testid": "indexing-mails-error",
				},
				m(".pl-12", lang.getTranslationText(errorMessageKey)),
				m(Button, {
					label: "retry_action",
					click: () => mailLocator.indexerFacade.extendMailIndex(failedIndexingUpTo),
					type: ButtonType.Secondary,
				}),
			)
		} else if (attrs.indexStateStream().progress !== 0) {
			const percentage = Math.trunc(attrs.indexStateStream().progress)
			return m(
				".flex-center.items-center",
				{
					style: {
						height: px(component_size.list_row_height),
						width: "100%",
						position: "absolute",
						gap: px(size.spacing_4),
					},
					"data-testid": "indexing-mails-progress",
				},
				m(CircleLoadingBar, { percentage }),
				m(".pl-4.pr-32", lang.getTranslationText("indexingEmails_msg")),
				m(Button, {
					label: "cancel_action",
					type: ButtonType.Primary,
					click: () => {
						mailLocator.indexerFacade.cancelMailIndexing()
					},
				}),
			)
		} else if (
			attrs.listModel.state.loadingStatus !== ListLoadingState.Loading &&
			attrs.listModel.state.loadingStatus !== ListLoadingState.ConnectionLost &&
			!isSameTypeRef(attrs.currentType, ContactTypeRef) &&
			attrs.indexStateStream().currentMailIndexTimestamp !== FULL_INDEXED_TIMESTAMP
		) {
			// If the list is in Loading or ConnectionLost, the list has a default message that should be displayed
			return m(
				".flex-center.items-center",
				{
					style: {
						height: px(component_size.list_row_height),
						width: "100%",
						position: "absolute",
						gap: px(size.spacing_4),
					},
					"data-testid": "indexing-mails-progress",
				},
				//FIXME: decide what we want to show, with the date or without
				m(
					"",
					{
						onclick: () => {
							this.attrs.extendIndex()
						},
					},
					[
						m(".flex-center.content-accent-fg.b", lang.getTranslationText("showMore_action")),
						m(
							".bottom.small",
							//FIXME: translation
							"Search until " + formatDate(new Date(attrs.indexStateStream().currentMailIndexTimestamp - YEAR_IN_MILLIS / 2)),
						),
					],
				),
				// m(Button, {
				// 	// FIXME: translation
				// 	label: lang.makeTranslation("test", "Search Older"),
				// 	type: ButtonType.Primary,
				// 	click: () => {
				// 		this.attrs.extendIndex()
				// 	},
				// }),
			)
		} else {
			return null
		}
	}

	private getRenderItems(type: TypeRef<Mail | Contact | CalendarEvent>): {
		icon: Icons
		renderConfig: RenderConfig<SearchResultListEntry, SearchResultListRow>
	} {
		if (isSameTypeRef(type, ContactTypeRef)) {
			return {
				icon: Icons.PeopleFilled,
				renderConfig: this.contactRenderConfig,
			}
		} else if (isSameTypeRef(type, CalendarEventTypeRef)) {
			return {
				icon: Icons.CalendarFilled,
				renderConfig: this.calendarRenderConfig,
			}
		} else {
			return {
				icon: Icons.MailFilled,
				renderConfig: this.mailRenderConfig,
			}
		}
	}

	private readonly calendarRenderConfig: RenderConfig<SearchResultListEntry, SearchResultListRow> = {
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Disabled,
		swipe: null,
		createElement: (dom) => {
			const row: SearchResultListRow = new SearchResultListRow(
				new KindaCalendarRow(dom, this.attrs.availableCalendars, () => this.attrs.highlightedStrings),
			)
			m.render(dom, row.render())
			return row
		},
	}

	private readonly mailRenderConfig: RenderConfig<SearchResultListEntry, SearchResultListRow> = {
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			const row: SearchResultListRow = new SearchResultListRow(
				new MailRow(
					true,
					(mail) => this.attrs.getLabelsForMail(mail),
					() => row.entity && this.listModel.onSingleExclusiveSelection(row.entity),
					() => this.attrs.highlightedStrings,
				),
			)
			m.render(dom, row.render())
			return row
		},
	}

	private readonly contactRenderConfig: RenderConfig<SearchResultListEntry, SearchResultListRow> = {
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			const row: SearchResultListRow = new SearchResultListRow(
				new KindaContactRow(
					dom,
					() => row.entity && this.listModel.onSingleExclusiveSelection(row.entity),
					() => shouldAlwaysShowMultiselectCheckbox(),
					() => this.attrs.highlightedStrings,
				),
			)
			m.render(dom, row.render())
			return row
		},
	}
}

export class SearchResultListRow implements VirtualRow<SearchResultListEntry> {
	top: number

	// this is our own entry which we need for some reason (probably easier to deal with than a lot of sum type entries)
	private _entity: SearchResultListEntry | null = null
	get entity(): SearchResultListEntry | null {
		return this._entity
	}

	private _delegate: MailRow | KindaContactRow | KindaCalendarRow

	constructor(delegate: MailRow | KindaContactRow | KindaCalendarRow) {
		this._delegate = delegate
		this.top = 0
	}

	update(entry: SearchResultListEntry, selected: boolean, isInMultiSelect: boolean): void {
		this._entity = entry

		this._delegate.update(downcast(entry.entry), selected, isInMultiSelect)
	}

	render(): Children {
		return this._delegate.render()
	}
}
