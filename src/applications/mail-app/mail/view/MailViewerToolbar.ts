import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "../../../../ui/base/IconButton.js"
import { isEmpty } from "../../../../platform-kit/utils"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import { createDropdown, DropdownButtonAttrs } from "../../../../ui/base/Dropdown.js"
import { getMailActionAttrs, MailViewerMoreActions, MailViewerToolbarActions, multipleMailViewerMoreActions } from "./MailViewerUtils.js"
import { Mail } from "@tutao/entities/tutanota"
import { MaybeTranslation } from "../../../../ui/utils/LanguageViewModel"
import { ClickHandler } from "../../../../ui/base/GuiUtils"
import { AllIcons } from "../../../../ui/base/Icon"

/*
	note that mailViewerViewModel has a mailModel, so you do not need to pass both if you pass a mailViewerViewModel
 */
export interface MailViewerToolbarAttrs {
	selectedMails: readonly Mail[]
	selectNone?: () => void
	setUnreadStateAction: ((unread: boolean) => void) | null
	isUnread: boolean | null
	mailViewerActions: MailViewerToolbarActions
	mailViewerMoreActions: MailViewerMoreActions | null
}

// Note: this is only used for non-mobile views. Please also update MobileMailMultiselectionActionBar or MobileMailActionBar
export class MailViewerActions implements Component<MailViewerToolbarAttrs> {
	view(vnode: Vnode<MailViewerToolbarAttrs>) {
		const singleMailActions = this.renderSingleMailActions(vnode.attrs)

		return m(".flex.ml-between-4.items-center", { "data-testid": "nav:action_bar" }, [
			singleMailActions,
			singleMailActions != null ? m(".nav-bar-spacer") : null,
			this.renderActions(vnode.attrs),
		])
	}

	private renderActions(attrs: MailViewerToolbarAttrs): Children {
		if (attrs.selectedMails.length > 0) {
			// These are pulled out as some action are only for single mails
			const { deleteAction, trash, move, label, markSpam, markNotSpam } = attrs.mailViewerActions
			const setUnreadAction = attrs.setUnreadStateAction
			const { read, unread } = this.getReadingActions(attrs.isUnread, setUnreadAction)
			return [
				this.renderActionAttrsAsIconButtons(
					getMailActionAttrs({
						deleteAction,
						trash,
						move,
						label,
						read,
						unread,
						markSpam,
						markNotSpam,
					}),
				),
				this.renderExtraButtons(attrs.mailViewerMoreActions),
			]
		}
	}

	renderActionAttrsAsIconButtons(actions: Array<{ label: MaybeTranslation; click: ClickHandler; icon: AllIcons }>): Children {
		return actions.map(({ label, click, icon }) =>
			m(IconButton, {
				label,
				click,
				icon,
			}),
		)
	}

	/*
	 * Actions that can only be taken on a single mail (reply, forward, edit, assign)
	 */
	private renderSingleMailActions(attrs: MailViewerToolbarAttrs): Children {
		const { edit, reply, replyAll, forward, markNotSpam } = attrs.mailViewerActions
		if (edit == null && reply == null && replyAll == null && forward == null) {
			return null
		}

		const isShowReportNotSpamAction = markNotSpam != null
		if (!isShowReportNotSpamAction) {
			return [this.renderActionAttrsAsIconButtons(getMailActionAttrs({ edit, reply, replyAll, forward }))]
		} else {
			return []
		}
	}

	private getReadingActions(
		isUnread: boolean | null,
		unreadAction: ((unread: boolean) => void) | null,
	): { read: (() => unknown) | null; unread: (() => unknown) | null } {
		if (unreadAction == null) {
			return { read: null, unread: null }
		}
		const read = () => unreadAction(false)
		const unread = () => unreadAction(true)
		if (isUnread == null) {
			// if unread is null we are in multi-mail selection and want to see both
			return { read, unread }
		} else if (isUnread) {
			return { read, unread: null }
		} else {
			return { read: null, unread }
		}
	}

	private renderExtraButtons(moreActions: MailViewerMoreActions | null): Children {
		let actions: DropdownButtonAttrs[] = multipleMailViewerMoreActions(moreActions)

		if (isEmpty(actions)) {
			return null
		} else {
			return m(IconButton, {
				label: "more_label",
				icon: Icons.More,
				click: createDropdown({
					lazyButtons: () => actions,
					width: 300,
				}),
			})
		}
	}
}
