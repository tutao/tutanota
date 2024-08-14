import m, { Children, Component, Vnode } from "mithril"
import { formatDateWithWeekday, formatTime } from "../../../common/misc/Formatter.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { theme } from "../../../common/gui/theme.js"
import { AllIcons, Icon } from "../../../common/gui/base/Icon.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { responsiveCardHPadding } from "../../../common/gui/cards.js"
import { Keys, TabIndex } from "../../../common/api/common/TutanotaConstants.js"
import { isKeyPressed } from "../../../common/misc/KeyManager.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
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
			".flex.items-center.pt.pb.click.no-wrap",
			{
				class: responsiveCardHPadding(),
				style: {
					color: theme.content_button,
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
				viewModel.isDraftMail() ? m(".mr-xs", this.renderIcon(Icons.Edit, lang.get("draft_label"))) : null,
				this.renderSender(viewModel),
				m(".flex.ml-between-s.items-center", [
					mail.attachments.length > 0 ? this.renderIcon(Icons.Attachment, lang.get("attachment_label")) : null,
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
			".flex.flex-no-grow.no-shrink.pr-s",
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
				fill: theme.content_button,
			},
			hoverText: hoverText,
		})
	}
}
