//@flow

import type {Entry, SearchBarState, ShowMoreAction} from "./SearchBar"
import {px, size} from "../gui/size"
import {lang} from "../misc/LanguageViewModel"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {worker} from "../api/main/WorkerClient"
import {Icons} from "../gui/base/icons/Icons"
import {isEmpty} from "../api/common/utils/ArrayUtils"
import {logins} from "../api/main/LoginController"
import {FULL_INDEXED_TIMESTAMP} from "../api/common/TutanotaConstants"
import {formatDate, formatDateTimeFromYesterdayOn, formatDateWithMonth} from "../misc/Formatter"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {getMailFolderIcon, getSenderOrRecipientHeading, isTutanotaTeamMail} from "../mail/MailUtils"
import Badge from "../gui/base/Badge"
import {Icon} from "../gui/base/Icon"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {WhitelabelChildTypeRef} from "../api/entities/sys/WhitelabelChild"
import {client} from "../misc/ClientDetector"
import m from "mithril"
import {theme} from "../gui/theme"


type SearchBarOverlayAttrs = {
	state: SearchBarState,
	isQuickSearch: boolean,
	isFocused: boolean,
	isExpanded: boolean,
	skipNextBlur: Stream<boolean>,
	selectResult: (result: ?Entry) => void
}

export class SearchBarOverlay implements MComponent<SearchBarOverlayAttrs> {
	view({attrs}: Vnode<SearchBarOverlayAttrs>) {
		const {state} = attrs
		return [
			this._renderIndexingStatus(state, attrs),
			state.entities && !isEmpty(state.entities) && attrs.isQuickSearch && attrs.isExpanded && attrs.isFocused
				? this.renderResults(state, attrs)
				: null,
		]
	}

	renderResults(state: SearchBarState, attrs: SearchBarOverlayAttrs) {
		return m("ul.list.click.mail-list", [
			state.entities.map(result => {
				return m("li.plr-l.flex-v-center.", {
					style: {
						height: px(52),
						'border-left': px(size.border_selection) + " solid transparent",
					},
					onmousedown: e => attrs.skipNextBlur(true), // avoid closing overlay before the click event can be received
					onclick: e => attrs.selectResult(result),
					class: state.selected === result ? "row-selected" : "",
				}, this.renderResult(state, result))
			}),
		])
	}

	_renderIndexingStatus(state: SearchBarState, attrs: SearchBarOverlayAttrs): Children {
		if (attrs.isFocused || (!attrs.isQuickSearch && client.isDesktopDevice())) {
			if (state.indexState.failedIndexingUpTo != null) {
				return this._renderError(state.indexState.failedIndexingUpTo, attrs)
			} else if (state.indexState.progress !== 0) {
				return this._renderProgress(state, attrs)
			} else {
				return null
			}
		} else {
			return null
		}
	}

	_renderProgress(state: SearchBarState, attrs: SearchBarOverlayAttrs) {
		return m(".flex.col.rel", [
			m(".plr-l.pt-s.pb-s.flex.items-center.flex-space-between.mr-negative-s", {
				style: {
					height: px(52),
					borderLeft: `${px(size.border_selection)} solid transparent`,
				}
			}, [
				m(".top.flex-space-between.col",
					m(".name", lang.get("createSearchIndex_msg", {"{progress}": state.indexState.progress})),
					m(".bottom.flex-space-between",
						m("small", "Indexed mails: " + state.indexState.indexedMailCount)
					)
				),
				state.indexState.progress !== 100
					? m("div", {onmousedown: e => attrs.skipNextBlur(true)}, m(ButtonN, {
						label: "cancel_action",
						click: () => worker.cancelMailIndexing(),
						//icon: () => Icons.Cancel
						type: ButtonType.Secondary
					}))
					: null // avoid closing overlay before the click event can be received
			]),
			m(".abs", {
				style: {
					backgroundColor: theme.content_accent,
					height: "2px",
					width: state.indexState.progress + "%",
					bottom: 0
				}
			})
		])
	}

	_renderError(failedIndexingUpTo: number, attrs: SearchBarOverlayAttrs) {
		return m(".flex.rel", [
			m(".plr-l.pt-s.pb-s.flex.items-center.flex-space-between.mr-negative-s", {
				style: {
					height: px(52),
					borderLeft: `${px(size.border_selection)} solid transparent`,
				}
			}, [
				m(".small", lang.get("indexing_error")),
				m("div", {onmousedown: e => attrs.skipNextBlur(true)}, m(ButtonN, {
					label: "retry_action",
					click: () => worker.extendMailIndex(failedIndexingUpTo),
					type: ButtonType.Secondary
				}))
			]),
		])
	}

	renderResult(state: SearchBarState, result: Entry) {
		let type: ?TypeRef = result._type ? result._type : null
		if (!type) { // show more action
			let showMoreAction = ((result: any): ShowMoreAction)
			let infoText
			let indexInfo
			if (showMoreAction.resultCount === 0) {
				infoText = lang.get("searchNoResults_msg")
				if (logins.getUserController().isFreeAccount()) {
					indexInfo = lang.get("changeTimeFrame_msg")
				}
			} else if (showMoreAction.allowShowMore) {
				infoText = lang.get("showMore_action")
			} else {
				infoText = lang.get("moreResultsFound_msg", {
					"{1}": showMoreAction.resultCount - showMoreAction.shownCount
				})
			}
			if (showMoreAction.indexTimestamp > FULL_INDEXED_TIMESTAMP && !indexInfo) {
				indexInfo = lang.get("searchedUntil_msg") + " "
					+ formatDate(new Date(showMoreAction.indexTimestamp))
			}


			return indexInfo ? [
				m(".top.flex-center", infoText), m(".bottom.flex-center.small", indexInfo)
			] : m("li.plr-l.pt-s.pb-s.items-center.flex-center", m(".flex-center", infoText))

		} else if (isSameTypeRef(MailTypeRef, type)) {
			let mail = ((result: any): Mail)
			return [
				m(".top.flex-space-between.badge-line-height", [
					isTutanotaTeamMail(mail) ? m(Badge, {classes: ".small.mr-s"}, "Tutanota Team") : null,
					m("small.text-ellipsis", getSenderOrRecipientHeading(mail, true)),
					m("small.text-ellipsis.flex-fixed", formatDateTimeFromYesterdayOn(mail.receivedDate))
				]),
				m(".bottom.flex-space-between", [
					m(".text-ellipsis", mail.subject),
					m(".icons.flex-fixed", {style: {"margin-right": "-3px"}}, [ // 3px to neutralize the svg icons internal border
						m(Icon, {
							icon: getMailFolderIcon(mail),
							class: state.selected === result ? "svg-content-accent-fg" : "svg-content-fg",
						}),
						m(Icon, {
							icon: Icons.Attachment,
							class: state.selected === result ? "svg-content-accent-fg" : "svg-content-fg",
							style: {display: mail.attachments.length > 0 ? '' : 'none'},
						}),
					])
				])
			]
		} else if (isSameTypeRef(ContactTypeRef, type)) {
			let contact = ((result: any): Contact)
			return [
				m(".top.flex-space-between",
					m(".name", contact.firstName + " " + contact.lastName),
				),
				m(".bottom.flex-space-between",
					m("small.mail-address", (contact.mailAddresses && contact.mailAddresses.length
						> 0) ? contact.mailAddresses[0].address : ""),
				)
			]
		} else if (isSameTypeRef(GroupInfoTypeRef, type)) {
			let groupInfo = ((result: any): GroupInfo)
			return [
				m(".top.flex-space-between",
					m(".name", groupInfo.name),
				),
				m(".bottom.flex-space-between", [
					m("small.mail-address", groupInfo.mailAddress),
					m(".icons.flex", [
						(groupInfo.deleted) ? m(Icon, {
							icon: Icons.Trash,
							class: "svg-list-accent-fg",
						}) : null,
						(!groupInfo.mailAddress && m.route.get().startsWith('/settings/groups')) ? m(Icon, {
							icon: BootIcons.Settings,
							class: "svg-list-accent-fg",
						}) : null,
						(groupInfo.mailAddress && m.route.get().startsWith('/settings/groups')) ? m(Icon, {
							icon: BootIcons.Mail,
							class: "svg-list-accent-fg",
						}) : null
					])
				])
			]
		} else if (isSameTypeRef(WhitelabelChildTypeRef, type)) {
			let whitelabelChild = ((result: any): WhitelabelChild)
			return [
				m(".top.flex-space-between",
					m(".name", whitelabelChild.mailAddress),
				),
				m(".bottom.flex-space-between", [
					m("small.mail-address", formatDateWithMonth(whitelabelChild.createdDate)),
					m(".icons.flex", [
						(whitelabelChild.deletedDate) ? m(Icon, {
							icon: Icons.Trash,
							class: "svg-list-accent-fg",
						}) : null
					])
				])
			]
		}
	}
}
