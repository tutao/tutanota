import m, { Children, ClassComponent, Vnode } from "mithril"
import { QuickSearchBar } from "../../../common/gui/QuickSearchBar.js"
import { Mail } from "@tutao/entities/tutanota"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { isTutaTeamMail } from "../../../common/mailFunctionality/SharedMailUtils"
import Badge from "../../../../ui/base/Badge"
import { getSenderOrRecipientHeading } from "./MailViewerUtils"
import { formatTimeOrDateOrYesterday } from "../../../../ui/utils/Formatter"
import { Icon } from "../../../../ui/base/Icon"
import { getMailFolderIcon } from "./MailGuiUtils"
import { mailLocator } from "../../mailLocator"
import { Icons } from "../../../../ui/base/icons/Icons"
import { Dialog } from "../../../../ui/base/Dialog"
import { LiveSearchResult, QuickSearchQuery, SearchQuery } from "../../../common/search/SearchUtils"
import { EnvProvider, TutanotaConstants } from "@tutao/app-env"

export interface MailSearchBarAttrs {
	loadResults: (searchQuery: QuickSearchQuery) => Promise<LiveSearchResult<Mail>>
	selectResult: (searchQuery: SearchQuery, entry: Mail | null) => unknown
	shouldOfferUpgrade: boolean
	needsToEnableSearch: () => Promise<boolean>
	enableSearch: () => Promise<boolean>
	indexingSupported: boolean
}

export class MailQuickSearchBar implements ClassComponent<MailSearchBarAttrs> {
	view({ attrs }: Vnode<MailSearchBarAttrs, this>): Children {
		return m(QuickSearchBar<Mail>, {
			placeholder: lang.getTranslationText("searchEmails_placeholder"),
			loadResults: (query) =>
				attrs.loadResults({
					query,
					maxResults: 10,
				}),
			selectResult: attrs.selectResult,
			renderResult: (entry, isSelected) => this.renderMailResult(entry, isSelected),
			shouldOfferUpgrade: attrs.shouldOfferUpgrade,
			confirmSearch: async () => {
				if (!attrs.indexingSupported) {
					Dialog.message(EnvProvider.get().isApp() ? "searchDisabledApp_msg" : "searchDisabled_msg")
					return false
				}
				if (await attrs.needsToEnableSearch()) {
					const confirmed = await Dialog.confirm("enableSearchMailbox_msg", "search_label")
					if (confirmed) {
						// do not hold SearchBar for the whole indexing time
						void attrs.enableSearch()
						return true
					}
					return false
				} else {
					return true
				}
			},
		})
	}

	private renderMailResult(mail: Mail, isSelected: boolean): Children {
		return [
			m(".top.flex-space-between.badge-line-height", [
				isTutaTeamMail(mail)
					? m(
							Badge,
							{
								classes: ".small.mr-8",
							},
							TutanotaConstants.companyTeamLabel,
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
							icon: getMailFolderIcon(mailLocator.mailModel, mail),
							class: isSelected ? "svg-content-accent-fg" : "svg-content-fg",
						}),
						m(Icon, {
							icon: Icons.Paperclip,
							class: isSelected ? "svg-content-accent-fg" : "svg-content-fg",
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
