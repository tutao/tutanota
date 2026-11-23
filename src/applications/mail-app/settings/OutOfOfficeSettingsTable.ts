import m, { Children, Component } from "mithril"
import { OutOfOfficeNotification } from "@tutao/entities/tutanota"
import { ColumnWidth, Table, TableLineAttrs } from "../../../ui/base/Table"
import { Icons } from "../../../ui/base/icons/Icons"
import { ButtonSize } from "../../../ui/base/ButtonSize"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { LegacyTextField } from "../../../ui/base/LegacyTextField"
import { IconButton } from "../../../ui/base/IconButton"
import { mailLocator } from "../mailLocator"
import type { MailboxDetail } from "../../common/mailFunctionality/MailboxModel"
import { getMailboxName } from "../../common/mailFunctionality/SharedMailUtils"
import { formatActivateState, loadOutOfOfficeNotification } from "../../common/misc/OutOfOfficeNotificationUtils"
import { showEditOutOfOfficeNotificationDialog } from "./EditOutOfOfficeNotificationDialog"
import { elementIdToId } from "@tutao/meta"

type MailboxRow = {
	mailboxDetail: MailboxDetail
	notification: OutOfOfficeNotification | null
}

export class OutOfOfficeSettingsTable implements Component {
	private rows: MailboxRow[] | null = null

	constructor() {
		this.reload()
	}

	async reload(): Promise<void> {
		const mailboxDetails = await mailLocator.mailboxModel.getMailboxDetails()
		this.rows = await Promise.all(
			mailboxDetails.map(async (mailboxDetail) => ({
				mailboxDetail,
				notification: await loadOutOfOfficeNotification(elementIdToId(mailboxDetail.mailGroup._id)).catch(() => null),
			})),
		)
		m.redraw()
	}

	view(): Children {
		if (this.rows?.length === 1) {
			const { mailboxDetail, notification } = this.rows[0]
			return m(LegacyTextField, {
				label: "outOfOfficeNotification_title",
				value: formatActivateState(notification),
				isReadOnly: true,
				injectionsRight: () =>
					m(IconButton, {
						label: "outOfOfficeNotification_title",
						click: () => showEditOutOfOfficeNotificationDialog(elementIdToId(mailboxDetail.mailGroup._id)),
						icon: Icons.PenFilled,
						size: ButtonSize.Compact,
					}),
			})
		}
		return [
			m(".h4.mt-32", lang.get("outOfOfficeNotification_title")),
			m(Table, {
				columnHeading: ["mailbox_label", "state_label"],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
				showActionButtonColumn: true,
				lines: this.rows?.map((row) => this.renderLine(row)) ?? null,
			}),
		]
	}

	private renderLine({ mailboxDetail, notification }: MailboxRow): TableLineAttrs {
		return {
			cells: () => [{ main: getMailboxName(mailLocator.logins, mailboxDetail) }, { main: formatActivateState(notification) }],
			actionButtonAttrs: {
				label: "edit_action",
				icon: Icons.PenFilled,
				size: ButtonSize.Compact,
				click: () => showEditOutOfOfficeNotificationDialog(elementIdToId(mailboxDetail.mailGroup._id)),
			},
		}
	}
}
