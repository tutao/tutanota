import type { Entry, SearchBarState, ShowMoreAction } from "./SearchBar"
import { px, size } from "../../common/gui/size"
import { lang } from "../../common/misc/LanguageViewModel"
import { Button, ButtonType } from "../../common/gui/base/Button.js"
import { Icons } from "../../common/gui/base/icons/Icons"
import { downcast, isEmpty, isSameTypeRef, TypeRef } from "@tutao/tutanota-utils"
import { FULL_INDEXED_TIMESTAMP } from "../../common/api/common/TutanotaConstants"
import { formatDate, formatTimeOrDateOrYesterday } from "../../common/misc/Formatter"
import type { CalendarEvent, Contact, Mail } from "../../common/api/entities/tutanota/TypeRefs.js"
import { CalendarEventTypeRef, ContactTypeRef, MailTypeRef } from "../../common/api/entities/tutanota/TypeRefs.js"
import Badge from "../../common/gui/base/Badge"
import { Icon } from "../../common/gui/base/Icon"
import { client } from "../../common/misc/ClientDetector"
import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../../common/gui/theme"
import { getMailFolderIcon, isTutanotaTeamMail } from "../mail/view/MailGuiUtils"
import { locator } from "../../common/api/main/CommonLocator"
import { IndexingErrorReason } from "../../common/api/worker/search/SearchTypes"
import { companyTeamLabel } from "../../common/misc/ClientConstants.js"
import { getTimeZone } from "../../common/calendar/date/CalendarUtils.js"

import { formatEventDuration } from "../../calendar-app/calendar/gui/CalendarGuiUtils.js"
import { getContactListName } from "../../common/contactsFunctionality/ContactUtils.js"

import { getSenderOrRecipientHeading } from "../mail/view/MailViewerUtils.js"
import { mailLocator } from "../mailLocator.js"

type SearchBarOverlayAttrs = {
	state: SearchBarState
	isQuickSearch: boolean
	isFocused: boolean
	selectResult: (result: Entry | null) => void
}

export class SearchBarOverlay implements Component<SearchBarOverlayAttrs> {
	view({ attrs }: Vnode<SearchBarOverlayAttrs>): Children {
		const { state } = attrs
		return [
			this._renderIndexingStatus(state, attrs),
			state.entities && !isEmpty(state.entities) && attrs.isQuickSearch && attrs.isFocused ? this.renderResults(state, attrs) : null,
		]
	}

	renderResults(state: SearchBarState, attrs: SearchBarOverlayAttrs): Children {
		return m("ul.list.click.mail-list", [
			state.entities.map((result) => {
				return m(
					"li.plr-l.flex-v-center.",
					{
						style: {
							height: px(52),
							"border-left": px(size.border_selection) + " solid transparent",
						},
						// avoid closing overlay before the click event can be received
						onmousedown: (e: MouseEvent) => e.preventDefault(),
						onclick: () => attrs.selectResult(result),
						class: state.selected === result ? "row-selected" : "",
					},
					this.renderResult(state, result),
				)
			}),
		])
	}

	_renderIndexingStatus(state: SearchBarState, attrs: SearchBarOverlayAttrs): Children {
		if (attrs.isFocused || (!attrs.isQuickSearch && client.isDesktopDevice())) {
			if (state.indexState.failedIndexingUpTo != null) {
				return this.renderError(state.indexState.failedIndexingUpTo, attrs)
			} else if (state.indexState.progress !== 0) {
				return this._renderProgress(state, attrs)
			} else {
				return null
			}
		} else {
			return null
		}
	}

	_renderProgress(state: SearchBarState, attrs: SearchBarOverlayAttrs): Children {
		return m(".flex.col.rel", [
			m(
				".plr-l.pt-s.pb-s.flex.items-center.flex-space-between.mr-negative-s",
				{
					style: {
						height: px(52),
						borderLeft: `${px(size.border_selection)} solid transparent`,
					},
				},
				[
					m(
						".top.flex-space-between.col",
						m(
							".bottom.flex-space-between",
							m(
								"",
								lang.get("indexedMails_label", {
									"{count}": state.indexState.indexedMailCount,
								}),
							),
						),
					),
					state.indexState.progress !== 100
						? m(
								"div",
								{
									// avoid closing overlay before the click event can be received
									onmousedown: (e: MouseEvent) => e.preventDefault(),
								},
								m(Button, {
									label: "cancel_action",
									click: () => mailLocator.indexerFacade.cancelMailIndexing(),
									//icon: () => Icons.Cancel
									type: ButtonType.Secondary,
								}),
						  )
						: null, // avoid closing overlay before the click event can be received
				],
			),
			m(".abs", {
				style: {
					backgroundColor: theme.content_accent,
					height: "2px",
					width: state.indexState.progress + "%",
					bottom: 0,
				},
			}),
		])
	}

	private renderError(failedIndexingUpTo: number, attrs: SearchBarOverlayAttrs): Children {
		const errorMessageKey = attrs.state.indexState.error === IndexingErrorReason.ConnectionLost ? "indexingFailedConnection_error" : "indexing_error"

		return m(".flex.rel", [
			m(
				".plr-l.pt-s.pb-s.flex.items-center.flex-space-between.mr-negative-s",
				{
					style: {
						height: px(52),
						borderLeft: `${px(size.border_selection)} solid transparent`,
					},
				},
				[
					m(".small", lang.get(errorMessageKey)),
					m(
						"div",
						{
							// avoid closing overlay before the click event can be received
							onmousedown: (e: MouseEvent) => e.preventDefault(),
						},
						m(Button, {
							label: "retry_action",
							click: () => mailLocator.indexerFacade.extendMailIndex(failedIndexingUpTo),
							type: ButtonType.Secondary,
						}),
					),
				],
			),
		])
	}

	renderResult(state: SearchBarState, result: Entry): Children {
		let type: TypeRef<any> | null = "_type" in result ? result._type : null

		if (!type) {
			return this.renderShowMoreAction(downcast(result))
		} else if (isSameTypeRef(MailTypeRef, type)) {
			return this.renderMailResult(downcast(result), state)
		} else if (isSameTypeRef(ContactTypeRef, type)) {
			return this.renderContactResult(downcast(result))
		} else if (isSameTypeRef(CalendarEventTypeRef, type)) {
			return this.renderCalendarEventResult(downcast(result))
		} else {
			return []
		}
	}

	private renderShowMoreAction(result: ShowMoreAction): Children {
		// show more action
		let showMoreAction = result as any as ShowMoreAction
		let infoText
		let indexInfo

		if (showMoreAction.resultCount === 0) {
			infoText = lang.get("searchNoResults_msg")

			if (locator.logins.getUserController().isFreeAccount()) {
				indexInfo = lang.get("changeTimeFrame_msg")
			}
		} else if (showMoreAction.allowShowMore) {
			infoText = lang.get("showMore_action")
		} else {
			infoText = lang.get("moreResultsFound_msg", {
				"{1}": showMoreAction.resultCount - showMoreAction.shownCount,
			})
		}

		if (showMoreAction.indexTimestamp > FULL_INDEXED_TIMESTAMP && !indexInfo) {
			indexInfo = lang.get("searchedUntil_msg") + " " + formatDate(new Date(showMoreAction.indexTimestamp))
		}

		return indexInfo
			? [m(".top.flex-center", infoText), m(".bottom.flex-center.small", indexInfo)]
			: m("li.plr-l.pt-s.pb-s.items-center.flex-center", m(".flex-center", infoText))
	}

	private renderContactResult(contact: Contact): Children {
		return [
			m(".top.flex-space-between", m(".name", getContactListName(contact))),
			m(
				".bottom.flex-space-between",
				m("small.mail-address", contact.mailAddresses && contact.mailAddresses.length > 0 ? contact.mailAddresses[0].address : ""),
			),
		]
	}

	private renderCalendarEventResult(event: CalendarEvent): Children {
		return [
			m(".top.flex-space-between", m(".name.text-ellipsis", { title: event.summary }, event.summary)),
			m(".bottom.flex-space-between", m("small.mail-address", formatEventDuration(event, getTimeZone(), false))),
		]
	}

	private renderMailResult(mail: Mail, state: SearchBarState): Children {
		return [
			m(".top.flex-space-between.badge-line-height", [
				isTutanotaTeamMail(mail)
					? m(
							Badge,
							{
								classes: ".small.mr-s",
							},
							companyTeamLabel,
					  )
					: null,
				m("small.text-ellipsis", getSenderOrRecipientHeading(mail, true)),
				m("small.text-ellipsis.flex-fixed", formatTimeOrDateOrYesterday(mail.receivedDate)),
			]),
			m(".bottom.flex-space-between", [
				m(".text-ellipsis", mail.subject),
				m(
					".icons.flex-fixed",
					{
						style: {
							"margin-right": "-3px",
						},
					},
					[
						// 3px to neutralize the svg icons internal border
						m(Icon, {
							icon: getMailFolderIcon(mail),
							class: state.selected === mail ? "svg-content-accent-fg" : "svg-content-fg",
						}),
						m(Icon, {
							icon: Icons.Attachment,
							class: state.selected === mail ? "svg-content-accent-fg" : "svg-content-fg",
							style: {
								display: mail.attachments.length > 0 ? "" : "none",
							},
						}),
					],
				),
			]),
		]
	}
}
