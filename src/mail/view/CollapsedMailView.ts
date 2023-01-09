import m, { Children, Component, Vnode } from "mithril"
import { getFolderIconByType, getMailAddressDisplayText } from "../model/MailUtils.js"
import { formatDateWithWeekday, formatTime } from "../../misc/Formatter.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { theme } from "../../gui/theme.js"
import { AllIcons, Icon } from "../../gui/base/Icon.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { mailViewerPadding } from "./MailViewerUtils.js"

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
			".flex.items-center.pt.pb.click",
			{
				class: mailViewerPadding(),
				style: {
					color: theme.content_button,
				},
				onclick: () => viewModel.expandMail(),
			},
			[
				m(".font-weight-600", getMailAddressDisplayText(mail.sender.name, mail.sender.address, true)),
				m(".flex-grow"),
				m(".flex.ml-between-s.items-center", [
					mail.attachments.length > 0 ? this.renderIcon(Icons.Attachment) : null,
					viewModel.isConfidential() ? this.renderIcon(Icons.Lock) : null,
					this.renderIcon(getFolderIconByType(folderInfo.folderType), folderInfo.name),
					m(".small.font-weight-600", dateTime),
				]),
			],
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
