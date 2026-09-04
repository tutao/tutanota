import { IndexingErrorReason, SearchIndexStateInfo } from "../../../common/api/worker/search/SearchTypes"
import { Mail, MailSet } from "@tutao/entities/tutanota"
import m, { Children, Component, Vnode } from "mithril"
import { ListModel } from "../../../common/misc/ListModel"
import { theme } from "../../../../ui/theme"
import { ListLoadingState, MultiselectMode, RenderConfig } from "../../../../ui/base/List"
import { YEAR_IN_MILLIS } from "@tutao/utils"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { Button, ButtonType } from "../../../../ui/base/Button"
import { CircleLoadingBar } from "../../../../ui/CircleLoadingBar"
import { EnvProvider, TutanotaConstants } from "@tutao/app-env"
import { formatDate } from "../../../../ui/utils/Formatter"
import { component_size, px, size } from "../../../../ui/size"
import { Icons } from "../../../../ui/base/icons/Icons"
import { MailRow } from "../../mail/view/MailRow"
import { CommonSearchListViewAttrs, renderListColumnWrapper } from "../../../common/search/SearchUtils"

export interface MailSearchListViewAttrs extends CommonSearchListViewAttrs<Mail> {
	getLabelsForMail: (mail: Mail) => MailSet[]
	indexState: SearchIndexStateInfo
	currentStartDate: Date | null
	extendSearchResult: (earlierStartDate: Date | null) => unknown
	extendMailIndex: (time: number) => Promise<void>
	cancelMailIndexing: () => void
	isIncompleteMailList: boolean
	searchAndRecreateMailList: () => unknown
}
export class MailSearchListView implements Component<MailSearchListViewAttrs> {
	private attrs: MailSearchListViewAttrs

	private get listModel(): ListModel<Mail, Id> {
		return this.attrs.listModel
	}

	constructor({ attrs }: Vnode<MailSearchListViewAttrs>) {
		this.attrs = attrs
	}

	view({ attrs }: Vnode<MailSearchListViewAttrs>): Children {
		this.attrs = attrs
		return renderListColumnWrapper(attrs.listModel, Icons.MailFilled, attrs.onSingleSelection, this.mailRenderConfig, undefined, () =>
			this.endOfListRender(),
		)
	}

	private endOfListRender(): Children {
		const sixMonthsBeforeStartDate = this.attrs.currentStartDate ? new Date(this.attrs.currentStartDate.getTime() - YEAR_IN_MILLIS / 2) : null
		const failedIndexingUpTo = this.attrs.indexState.failedIndexingUpTo
		let innerChildren: Children
		if (failedIndexingUpTo != null) {
			const errorMessageKey = this.attrs.indexState.error === IndexingErrorReason.ConnectionLost ? "indexingFailedConnection_error" : "indexing_error"
			innerChildren = [
				m(".pl-12", lang.getTranslationText(errorMessageKey)),
				m(Button, {
					label: "retry_action",
					click: () => this.attrs.extendMailIndex(failedIndexingUpTo),
					type: ButtonType.Secondary,
				}),
			]
		} else if (
			this.attrs.indexState.progress !== 0 &&
			(this.attrs.currentStartDate == null || this.attrs.currentStartDate.getTime() < this.attrs.indexState.currentMailIndexTimestamp)
		) {
			// we show progress only when currentStartDate is outside index range to indicate that more results might still show
			const percentage = Math.trunc(this.attrs.indexState.progress)
			innerChildren = [
				m(CircleLoadingBar, { percentage, backgroundColor: theme.surface_container }),
				m(".pl-4.pr-32", lang.getTranslationText("indexingEmails_msg")),
				m(Button, {
					label: "cancel_action",
					type: ButtonType.Primary,
					click: () => {
						this.attrs.cancelMailIndexing()
					},
				}),
			]
		} else if (
			(this.attrs.listModel.state.loadingStatus === ListLoadingState.Done &&
				this.attrs.indexState.currentMailIndexTimestamp !== TutanotaConstants.FULL_INDEXED_TIMESTAMP &&
				EnvProvider.get().isOfflineStorageAvailable()) ||
			(sixMonthsBeforeStartDate && sixMonthsBeforeStartDate.getTime() < this.attrs.indexState.currentMailIndexTimestamp)
		) {
			const extendToDate = EnvProvider.get().isOfflineStorageAvailable() ? null : sixMonthsBeforeStartDate

			// If the list is in Loading or ConnectionLost, the list has a default message that should be displayed
			innerChildren = m(
				"",
				{
					onclick: () => {
						this.attrs.extendSearchResult(extendToDate)
					},
				},
				this.renderShowMoreButton(extendToDate),
			)
		} else if (
			this.attrs.listModel.state.loadingStatus === ListLoadingState.Done &&
			this.attrs.indexState.currentMailIndexTimestamp === TutanotaConstants.FULL_INDEXED_TIMESTAMP &&
			this.attrs.isIncompleteMailList
		) {
			innerChildren = m(
				"",
				{
					onclick: () => {
						this.attrs.searchAndRecreateMailList()
					},
				},
				this.renderReloadListButton(),
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

	private readonly mailRenderConfig: RenderConfig<Mail, MailRow> = {
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			const row = new MailRow(
				true,
				(mail) => this.attrs.getLabelsForMail(mail),
				(mail) => this.listModel.onSingleExclusiveSelection(mail),
				() => this.attrs.highlightedStrings,
			)

			m.render(dom, row.render())
			return row
		},
	}

	private renderReloadListButton(): Children {
		return [
			m(".flex-center.content-accent-fg.b", lang.getTranslationText("reloadList_action")),
			m(".bottom.small", lang.getTranslationText("moreEmailsAvailable_msg")),
		]
	}

	private renderShowMoreButton(searchUntilDate: Date | null): Children {
		return [
			m(".flex-center.content-accent-fg.b", lang.getTranslationText("showMore_action")),
			m(
				".bottom.small",
				searchUntilDate == null
					? lang.getTranslation("notAllMailsSearchable_msg").text
					: lang.getTranslation("searchUntil_msg", {
							"{1}": formatDate(searchUntilDate),
						}).text,
			),
		]
	}
}
