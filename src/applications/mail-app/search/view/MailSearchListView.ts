import { CommonSearchListViewAttrs, SearchResultListEntry, SearchResultListRow } from "./SearchListView"
import Stream from "mithril/stream"
import { IndexingErrorReason, SearchIndexStateInfo } from "../../../common/api/worker/search/SearchTypes"
import { Mail, MailSet } from "@tutao/entities/tutanota"
import { CalendarInfoBase } from "../../../calendar-app/calendar/model/CalendarModel"
import m, { Children, Component, Vnode } from "mithril"
import { ListModel } from "../../../common/misc/ListModel"
import { ListColumnWrapper } from "../../../../ui/ListColumnWrapper"
import { styles } from "../../../../ui/styles"
import ColumnEmptyMessageBox from "../../../../ui/base/ColumnEmptyMessageBox"
import { theme } from "../../../../ui/theme"
import { List, ListAttrs, ListLoadingState, MultiselectMode, RenderConfig } from "../../../../ui/base/List"
import { YEAR_IN_MILLIS } from "@tutao/utils"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { Button, ButtonType } from "../../../../ui/base/Button"
import { mailLocator } from "../../mailLocator"
import { CircleLoadingBar } from "../../../../ui/CircleLoadingBar"
import { FULL_INDEXED_TIMESTAMP, UpgradePromptType } from "@tutao/app-env"
import { locator } from "../../../common/api/main/CommonLocator"
import { showNotAvailableForFreeDialog } from "../../../common/misc/SubscriptionDialogs"
import { formatDate } from "../../../../ui/utils/Formatter"
import { component_size, px, size } from "../../../../ui/size"
import { Icons } from "../../../../ui/base/icons/Icons"
import { MailRow } from "../../mail/view/MailRow"
import { KindaContactRow } from "../../contacts/view/ContactListView"
import { shouldAlwaysShowMultiselectCheckbox } from "../../../../ui/SelectableRowContainer"
import { KindaCalendarRow } from "../../../calendar-app/calendar/gui/CalendarRow"

export interface MailSearchListViewAttrs extends CommonSearchListViewAttrs {
	getLabelsForMail: (mail: Mail) => MailSet[]
	indexStateStream: Stream<SearchIndexStateInfo>
	currentStartDate: Date | null
	extendSearchResult: (extendDate: Date) => unknown
}
export class MailSearchListView implements Component<MailSearchListViewAttrs> {
	private attrs: MailSearchListViewAttrs
	private indexStateStream: Stream<unknown> | null = null

	private get listModel(): ListModel<SearchResultListEntry, Id> {
		return this.attrs.listModel
	}

	constructor({ attrs }: Vnode<MailSearchListViewAttrs>) {
		this.attrs = attrs
	}

	oncreate({ attrs: { indexStateStream } }: Vnode<MailSearchListViewAttrs>) {
		this.indexStateStream = indexStateStream.map(() => m.redraw())
	}

	onremove() {
		this.indexStateStream?.end(true)
	}

	view({ attrs }: Vnode<MailSearchListViewAttrs>): Children {
		this.attrs = attrs
		return renderListColumnWrapper(attrs.listModel, Icons.MailFilled, attrs.onSingleSelection, this.mailRenderConfig, undefined, () =>
			this.endOfListRender(),
		)
	}

	private endOfListRender(): Children {
		const sixMonthsBeforeStartDate = this.attrs.currentStartDate ? new Date(this.attrs.currentStartDate.getTime() - YEAR_IN_MILLIS / 2) : null
		const failedIndexingUpTo = this.attrs.indexStateStream().failedIndexingUpTo
		let innerChildren: Children
		if (failedIndexingUpTo != null) {
			const errorMessageKey =
				this.attrs.indexStateStream().error === IndexingErrorReason.ConnectionLost ? "indexingFailedConnection_error" : "indexing_error"
			innerChildren = [
				m(".pl-12", lang.getTranslationText(errorMessageKey)),
				m(Button, {
					label: "retry_action",
					click: () => mailLocator.indexerFacade.extendMailIndex(failedIndexingUpTo),
					type: ButtonType.Secondary,
				}),
			]
		} else if (
			this.attrs.indexStateStream().progress !== 0 &&
			(this.attrs.currentStartDate == null || this.attrs.currentStartDate.getTime() < this.attrs.indexStateStream().currentMailIndexTimestamp)
		) {
			// we show progress only when currentStartDate is outside index range to indicate that more results might still show
			const percentage = Math.trunc(this.attrs.indexStateStream().progress)
			innerChildren = [
				m(CircleLoadingBar, { percentage, backgroundColor: theme.surface_container }),
				m(".pl-4.pr-32", lang.getTranslationText("indexingEmails_msg")),
				m(Button, {
					label: "cancel_action",
					type: ButtonType.Primary,
					click: () => {
						mailLocator.indexerFacade.cancelMailIndexing()
					},
				}),
			]
		} else if (
			this.attrs.listModel.state.loadingStatus === ListLoadingState.Done &&
			this.attrs.indexStateStream().currentMailIndexTimestamp !== FULL_INDEXED_TIMESTAMP &&
			sixMonthsBeforeStartDate &&
			sixMonthsBeforeStartDate.getTime() < this.attrs.indexStateStream().currentMailIndexTimestamp
		) {
			// If the list is in Loading or ConnectionLost, the list has a default message that should be displayed
			innerChildren = m(
				"",
				{
					onclick: () => {
						if (locator.logins.getUserController().isFreeAccount()) {
							showNotAvailableForFreeDialog(UpgradePromptType.EXTEND_MAIL_SEARCH_RANGE)
						} else {
							this.attrs.extendSearchResult(sixMonthsBeforeStartDate)
						}
					},
				},
				[
					m(".flex-center.content-accent-fg.b", lang.getTranslationText("showMore_action")),
					m(
						".bottom.small",
						lang.getTranslation("searchUntil_msg", {
							"{1}": formatDate(sixMonthsBeforeStartDate),
						}).text,
					),
				],
			)
		} else {
			return null
		}

		return m(
			".flex-center.items-center",
			{
				style: {
					height: px(component_size.list_row_height),
					width: "100%",
					position: "absolute",
					gap: px(size.spacing_4),
				},
				"data-testid": "search-list-end-custom-message",
			},
			innerChildren,
		)
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
}

export function renderListColumnWrapper(
	listModel: ListModel<SearchResultListEntry, Id>,
	icon: Icons,
	onSingleSelection: (item: SearchResultListEntry) => unknown,
	renderConfig: RenderConfig<SearchResultListEntry, SearchResultListRow>,
	cancelCallback?: () => unknown,
	endOfListRender?: () => Children,
) {
	return m(
		ListColumnWrapper,
		{ headerContent: null, class: styles.isSingleColumnLayout() ? undefined : "column-resize-margin" },
		listModel.isEmptyAndDone()
			? m(ColumnEmptyMessageBox, {
					icon,
					message: "searchNoResults_msg",
					color: theme.on_surface_variant,
				})
			: m(List, {
					state: listModel.state,
					renderConfig,
					onLoadMore: () => {
						listModel.loadMore()
					},
					onRetryLoading: () => {
						listModel.retryLoading()
					},
					onSingleSelection: (item: SearchResultListEntry) => {
						listModel.onSingleSelection(item)
						onSingleSelection(item)
					},
					onSingleTogglingMultiselection: (item: SearchResultListEntry) => {
						listModel.onSingleInclusiveSelection(item, styles.isSingleColumnLayout())
					},
					onRangeSelectionTowards: (item: SearchResultListEntry) => {
						listModel.selectRangeTowards(item)
					},
					onStopLoading: () => {
						cancelCallback?.()
						listModel.stopLoading()
					},
					renderEndOfListMessage: endOfListRender ? endOfListRender() : null,
				} satisfies ListAttrs<SearchResultListEntry, SearchResultListRow>),
	)
}
