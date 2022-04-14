import m, {Children, Component} from "mithril"
import {px, size} from "../../gui/size"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {createMail} from "../../api/entities/tutanota/TypeRefs.js"
import {createMailAddress} from "../../api/entities/tutanota/TypeRefs.js"
import {MailRow} from "../../mail/view/MailRow"
import {noOp} from "@tutao/tutanota-utils"

export const COMPONENT_PREVIEW_HEIGHT = 300
export const BUTTON_WIDTH = 270

export class CustomColorEditorPreview implements Component {
	_mailRow: MailRow
	_mailRow2: MailRow

	constructor() {
		this._mailRow = new MailRow(false)
		this._mailRow2 = new MailRow(false)
	}

	view(): Children {
		return m(
			".editor-border.mt-l.flex.col",
			{
				style: {
					height: px(COMPONENT_PREVIEW_HEIGHT),
					alignItems: "center",
				},
			},
			[
				m(
					".pt-m",
					{
						style: {
							width: px(BUTTON_WIDTH),
						},
					},
					m(ButtonN, {
						label: "login_action",
						click: noOp,
						type: ButtonType.Login,
					}),
				),
				m(".pt-m", [
					m(ButtonN, {
						style: {
							width: px(BUTTON_WIDTH),
						},
						label: () => "Secondary",
						click: noOp,
						type: ButtonType.Secondary,
					}),
					m(ButtonN, {
						style: {
							width: px(BUTTON_WIDTH),
						},
						label: () => "Primary",
						click: noOp,
						type: ButtonType.Primary,
					}),
				]),
				m(".pt-m", this.renderPreviewMailRow()),
			],
		)
	}

	renderPreviewMailRow(): Children {
		const mail = createMail({
			sender: createMailAddress({
				address: "m.mustermann@example.com",
				name: "Max Mustermann",
			}),
			receivedDate: new Date(),
			subject: "Mail 1",
			unread: false,
			replyType: "0",
			confidential: true,
			attachments: [],
			state: "2",
		})
		const mail2 = createMail({
			sender: createMailAddress({
				address: "m.mustermann@example.com",
				name: "Max Mustermann",
			}),
			receivedDate: new Date(),
			subject: "Mail 2",
			unread: true,
			replyType: "1",
			confidential: false,
			attachments: [],
			state: "2",
		})
		return m(
			".rel",
			{
				style: {
					width: px(size.second_col_max_width),
				},
			},
			[
				m(
					".list-row.pl.pr-l.odd-row.pt-m.pb-m",
					{
						oncreate: vnode => {
							this._mailRow.domElement = vnode.dom as HTMLElement
							requestAnimationFrame(() => this._mailRow.update(mail, false))
						},
					},
					this._mailRow.render(),
				),
				m(
					".list-row.pl.pr-l.pt-m.pb-m",
					{
						oncreate: vnode => {
							this._mailRow2.domElement = vnode.dom as HTMLElement
							requestAnimationFrame(() => this._mailRow2.update(mail2, true))
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