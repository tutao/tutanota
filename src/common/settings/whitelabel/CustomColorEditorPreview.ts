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

export const BUTTON_WIDTH = 270

export class CustomColorEditorPreview implements Component {
	_mailRow: MailRow
	_mailRow2: MailRow
	private toggleSelected: boolean = false

	constructor() {
		this._mailRow = new MailRow(false, noOp)
		this._mailRow2 = new MailRow(false, noOp)
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
						label: () => "Secondary",
						click: noOp,
						type: ButtonType.Secondary,
					}),
					m(Button, {
						label: () => "Primary",
						click: noOp,
						type: ButtonType.Primary,
					}),
				]),
				m(".pt", [
					m(IconButton, {
						title: () => "Icon button",
						icon: Icons.Folder,
						click: noOp,
					}),
					m(ToggleButton, {
						title: () => "Toggle button",
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
					".list-row.pl.pr-l.odd-row.pt.pb",
					{
						oncreate: (vnode) => {
							this._mailRow.domElement = vnode.dom as HTMLElement
							requestAnimationFrame(() => this._mailRow.update(mail, false, false))
						},
					},
					this._mailRow.render(),
				),
				m(
					".list-row.pl.pr-l.pt.pb",
					{
						oncreate: (vnode) => {
							this._mailRow2.domElement = vnode.dom as HTMLElement
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
