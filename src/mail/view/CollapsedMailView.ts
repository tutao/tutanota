import m, { Children, Component, Vnode } from "mithril"
import { getFolderIconByType, getMailAddressDisplayText } from "../model/MailUtils.js"
import { formatDateWithWeekday, formatTime } from "../../misc/Formatter.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { theme } from "../../gui/theme.js"
import { AllIcons, Icon } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { responsiveCardHPadding } from "../../gui/cards.js"
import { Keys, TabIndex } from "../../api/common/TutanotaConstants.js"
import { isKeyPressed } from "../../misc/KeyManager.js"

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
				onclick: () => viewModel.expandMail(),
				onkeyup: (e: KeyboardEvent) => {
					if (isKeyPressed(e.keyCode, Keys.SPACE)) {
						viewModel.expandMail()
					}
				},
				tabindex: TabIndex.Default,
			},
			[
				viewModel.isUnread() ? this.renderUnreadDot() : null,
				viewModel.isDraftMail() ? m(".mr-xs", this.renderIcon(Icons.Edit)) : null,
				m(this.getMailAddressDisplayClasses(viewModel), getMailAddressDisplayText(mail.sender.name, mail.sender.address, true)),
				m(".flex.ml-between-s.items-center", [
					mail.attachments.length > 0 ? this.renderIcon(Icons.Attachment) : null,
					viewModel.isConfidential() ? this.renderIcon(Icons.Lock) : null,
					this.renderIcon(getFolderIconByType(folderInfo.folderType), folderInfo.name),
					m(".small.font-weight-600", dateTime),
				]),
			],
		)
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
