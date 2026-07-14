import m, { Children, ClassComponent, CommonAttributes, Vnode } from "mithril"
import { SearchBar } from "./search/SearchBar.js"
import { LazyLoaded } from "../../platform-kit/utils"
import { LiveSearchResult, SearchModel, SearchQuery } from "./search/model/SearchModel"
import { Mail } from "@tutao/entities/tutanota"
import { lang } from "../../ui/utils/LanguageViewModel"
import { isTutaTeamMail } from "../common/mailFunctionality/SharedMailUtils"
import Badge from "../../ui/base/Badge"
import { companyTeamLabel } from "../../platform-kit/app-env/boot/ClientConstants"
import { getSenderOrRecipientHeading } from "./mail/view/MailViewerUtils"
import { formatTimeOrDateOrYesterday } from "../../ui/utils/Formatter"
import { Icon } from "../../ui/base/Icon"
import { getMailFolderIcon } from "./mail/view/MailGuiUtils"
import { mailLocator } from "./mailLocator"
import { Icons } from "../../ui/base/icons/Icons"
import { createRestriction } from "./search/model/SearchUtils"
import { SearchCategoryType } from "../common/api/worker/search/SearchTypes"

// FIXME: move into common
export interface LazyComponentAttrs<A, C extends ClassComponent<A>> {
	attrs: A & CommonAttributes<A, C>
	loader: () => Promise<Class<C>>
}

/** For now have to explicitly specific generic arguments or it doesn't work. Maybe there's a workaround via a function. */
export class LazyComponent<A, C extends ClassComponent<A>> {
	private readonly instance: LazyLoaded<Class<C>>

	constructor({ attrs }: Vnode<LazyComponentAttrs<A, C>>) {
		this.instance = new LazyLoaded(() => {
			const component = attrs.loader()
			m.redraw()
			return component
		})
		this.instance.load()
	}

	view({ attrs }: Vnode<LazyComponentAttrs<A, C>>): Children {
		const component = this.instance.getSync()
		if (component != null) {
			return m<A, C>(component satisfies Class<ClassComponent<A>>, attrs.attrs)
		} else {
			return null
		}
	}
}

export interface MailSearchBarAttrs {
	loadResults: (searchQuery: SearchQuery) => Promise<LiveSearchResult<Mail>>
	selectResult: (searchQuery: SearchQuery, entry: Mail) => unknown
}

export class MailSearchBar implements ClassComponent<MailSearchBarAttrs> {
	view({ attrs }: Vnode<MailSearchBarAttrs, this>): Children | null {
		return m(SearchBar<Mail>, {
			placeholder: lang.getTranslationText("searchEmails_placeholder"),
			loadResults: (query) =>
				attrs.loadResults({
					query,
					maxResults: 10, // FIXME
					restriction: createRestriction(SearchCategoryType.mail, null, null, null, [], false),
				}),
			selectResult: attrs.selectResult,
			renderResult: (entry, isSelected) => this.renderMailResult(entry, isSelected),
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
