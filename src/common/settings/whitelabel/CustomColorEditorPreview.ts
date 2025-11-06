import m, { Children, Component } from "mithril"
import { px, size } from "../../gui/size"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { createMail, createMailAddress, Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { MailRow } from "../../../mail-app/mail/view/MailRow"
import { noOp } from "@tutao/tutanota-utils"
import { IconButton } from "../../gui/base/IconButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { ToggleButton } from "../../gui/base/buttons/ToggleButton.js"
import { isApp, isDesktop } from "../../api/common/Env.js"
import { LoginButton } from "../../gui/base/buttons/LoginButton.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { ProcessingState } from "../../api/common/TutanotaConstants"

export const BUTTON_WIDTH = 270

export class CustomColorEditorPreview implements Component {
	_mailRow: MailRow
	_mailRow2: MailRow
	private toggleSelected: boolean = false

	constructor() {
		this._mailRow = new MailRow(false, () => [], noOp)
		this._mailRow2 = new MailRow(false, () => [], noOp)
	}

	view(): Children {
		return m(
			".editor-border.mt-l.flex.col",
			{
				style: {
					alignItems: "center",
				},
			},
			[
				m(
					".pt",
					{
						style: {
							width: px(BUTTON_WIDTH),
						},
					},
					m(LoginButton, {
						label: isApp() || isDesktop() ? "addAccount_action" : "login_action",
						onclick: noOp,
					}),
				),
				m(".pt", [
					m(Button, {
						label: lang.makeTranslation("secondary", "Secondary"),
						click: noOp,
						type: ButtonType.Secondary,
					}),
					m(Button, {
						label: lang.makeTranslation("primary", "Primary"),
						click: noOp,
						type: ButtonType.Primary,
					}),
				]),
				m(".pt", [
					m(IconButton, {
						title: lang.makeTranslation("icon_button", "Icon button"),
						icon: Icons.Folder,
						click: noOp,
					}),
					m(ToggleButton, {
						title: lang.makeTranslation("toggle_button", "Toggle button"),
						icon: this.toggleSelected ? Icons.Lock : Icons.Unlock,
						toggled: this.toggleSelected,
						onToggled: () => (this.toggleSelected = !this.toggleSelected),
					}),
				]),
				m(".pt", this.renderPreviewMailRow()),
			],
		)
	}

	renderPreviewMailRow(): Children {
		const mailTemplate = {
			receivedDate: new Date(),
			attachments: [],
			state: "2",
			mailDetails: null,
			authStatus: null,
			encryptionAuthStatus: null,
			keyVerificationState: null,
			method: "0",
			bucketKey: null,
			conversationEntry: ["listId", "conversationId"],
			differentEnvelopeSender: null,
			firstRecipient: null,
			listUnsubscribe: false,
			mailDetailsDraft: null,
			movedTime: null,
			phishingStatus: "0",
			recipientCount: "0",
			sets: [],
			processingState: ProcessingState.INBOX_RULE_NOT_PROCESSED,
			clientSpamClassifierResult: null,
		} satisfies Partial<Mail>
		const mail = createMail({
			sender: createMailAddress({
				address: "m.mustermann@example.com",
				name: "Max Mustermann",
				contact: null,
			}),
			subject: "Mail 1",
			unread: false,
			replyType: "0",
			confidential: true,
			sendAt: null,
			...mailTemplate,
		})
		const mail2 = createMail({
			sender: createMailAddress({
				address: "m.mustermann@example.com",
				name: "Max Mustermann",
				contact: null,
			}),
			subject: "Mail 2",
			unread: true,
			replyType: "1",
			confidential: false,
			sendAt: null,
			...mailTemplate,
		})
		return m(
			".rel",
			{
				style: {
					width: px(size.second_col_max_width),
					height: px(size.list_row_height * 2),
				},
			},
			[
				m(
					".list-row.pl.pr-l.odd-row",
					{
						oncreate: (vnode) => {
							requestAnimationFrame(() => this._mailRow.update(mail, false, false))
						},
					},
					this._mailRow.render(),
				),
				m(
					".list-row.pl.pr-l",
					{
						oncreate: (vnode) => {
							requestAnimationFrame(() => this._mailRow2.update(mail2, true, false))
						},
						style: {
							top: px(size.list_row_height),
						},
					},
					this._mailRow2.render(),
				),
			],
		)
	}
}
