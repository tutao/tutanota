import m, { Children, Component, Vnode } from "mithril"
import { formatDateWithWeekday, formatTime } from "../../../../ui/utils/Formatter.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { theme } from "../../../../ui/theme.js"
import { AllIcons, Icon } from "../../../../ui/base/Icon.js"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import { responsiveCardHPadding } from "../../../../ui/cards.js"
import { Keys, TabIndex } from "../../../../platform-kits/app-env"
import { isKeyPressed } from "../../../../ui/utils/KeyManager.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { getMailAddressDisplayText } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { getConfidentialIcon, getFolderIconByType } from "./MailGuiUtils.js"

export interface CollapsedMailViewAttrs {
	viewModel: MailViewerViewModel
}

export class CollapsedMailView implements Component<CollapsedMailViewAttrs> {
	view({ attrs }: Vnode<CollapsedMailViewAttrs>): Children {
		const { viewModel } = attrs
		const { mail } = viewModel
		const dateTime = formatDateWithWeekday(mail.receivedDate) + " • " + formatTime(mail.receivedDate)
		const folderInfo = viewModel.getFolderInfo()
		if (!folderInfo) return null

		return m(
			".flex.items-center.pt-16.pb-16.click.no-wrap",
			{
				class: responsiveCardHPadding(),
				role: "button",
				"aria-expanded": "false",
				"data-testid": "collapsed-mail-view",
				style: {
					color: theme.on_surface,
				},
				onclick: () => viewModel.expandMail(Promise.resolve()),
				onkeyup: (e: KeyboardEvent) => {
					if (isKeyPressed(e.key, Keys.SPACE)) {
						viewModel.expandMail(Promise.resolve())
					}
				},
				tabindex: TabIndex.Default,
			},
			[
				viewModel.isUnread() ? this.renderUnreadDot() : null,
				viewModel.isScheduled() ? m(".flex.mr-4", this.renderIcon(Icons.SendlaterFilled, lang.getTranslationText("scheduled_label"))) : null,
				viewModel.isEditableDraft() ? m(".flex.mr-4", this.renderIcon(Icons.PenFilled, lang.getTranslationText("draft_label"))) : null,
				this.renderSender(viewModel),
				m(".flex.ml-between-4.items-center", [
					mail.attachments.length > 0 ? this.renderIcon(Icons.Paperclip, lang.get("attachment_label")) : null,
					viewModel.isConfidential() ? this.renderIcon(getConfidentialIcon(mail), lang.get("confidential_label")) : null,
					this.renderIcon(getFolderIconByType(folderInfo.folderType), folderInfo.name),
					m(".small.font-weight-600", dateTime),
				]),
			],
		)
	}

	private renderSender(viewModel: MailViewerViewModel) {
		const sender = viewModel.getDisplayedSender()
		return m(this.getMailAddressDisplayClasses(viewModel), sender == null ? "" : getMailAddressDisplayText(sender.name, sender.address, true))
	}

	private getMailAddressDisplayClasses(viewModel: MailViewerViewModel): string {
		let classes = ".flex-grow.text-ellipsis"
		if (viewModel.isUnread()) {
			classes += ".font-weight-600"
		}
		return classes
	}

	private renderUnreadDot(): Children {
		return m(
			".flex.flex-no-grow.no-shrink.pr-4",
			{
				"data-testid": "unread-indicator",
			},
			m(".dot.bg-accent-fg", {
				style: {
					marginTop: 0,
				},
			}),
		)
	}

	private renderIcon(icon: AllIcons, hoverText: string | null = null) {
		return m(Icon, {
			icon,
			container: "div",
			style: {
				fill: theme.on_surface_variant,
			},
			hoverText: hoverText,
		})
	}
}
