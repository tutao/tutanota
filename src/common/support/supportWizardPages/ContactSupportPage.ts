import m, { Children, Component, Vnode } from "mithril"
import { SupportDialogState } from "../SupportDialog.js"
import { getLogAttachments } from "../../misc/ErrorReporter.js"
import { DataFile } from "../../api/common/DataFile.js"
import { Thunk } from "@tutao/tutanota-utils"
import { styles } from "../../gui/styles.js"
import { getElevatedBackground } from "../../gui/theme.js"
import { AttachmentBubble, AttachmentType } from "../../gui/AttachmentBubble.js"
import { locator } from "../../api/main/CommonLocator.js"
import { Button, ButtonType } from "../../gui/base/Button.js"
import { showFileChooser } from "../../file/FileController.js"
import { Checkbox } from "../../gui/base/Checkbox.js"
import { lang } from "../../misc/LanguageViewModel.js"

export type Props = {
	data: SupportDialogState
	goToSuccessPage: Thunk
}

export class ContactSupportPage implements Component<Props> {
	oninit(vnode: Vnode<Props>) {
		this.collectLogs().then((logs) => {
			vnode.attrs.data.logs(logs)
			m.redraw()
		})
	}

	view({
		attrs: {
			data: { userAttachments, htmlEditor, shouldIncludeLogs },
		},
	}: Vnode<Props>): Children {
		return m(
			".flex.flex-column.plr-l",
			{
				style: {
					// "min-height": styles.isDesktopLayout() ? "850px" : "",
					// "min-width": styles.isDesktopLayout() ? "450px" : "360px",
				},
			},
			m(
				"p",
				{
					style: {
						height: styles.isDesktopLayout() ? "45px" : "77.5px",
					},
				},
				"Please clarify what problem you faced. You can attach screenshots to help us understand your situation.",
			),
			m(
				".border-radius-m",
				{
					style: {
						"background-color": getElevatedBackground(),
						padding: "0.5em 1em 1em 1em",
					},
				},
				m(htmlEditor),
			),
			m(
				".flex.flex-space-between.align-self-end.items-center.gap-hpad.mt-m",
				m(
					".flex",
					{ style: { "flex-wrap": "wrap", gap: "0.5em" } },
					userAttachments().map((attachment, index) =>
						m(AttachmentBubble, {
							attachment: attachment,
							download: () => locator.fileController.saveDataFile(attachment),
							open: null,
							remove: () => {
								const tmp = userAttachments()
								tmp.splice(index, 1)
								userAttachments(tmp)
							},
							fileImport: null,
							type: AttachmentType.GENERIC,
						}),
					),
				),
				m(
					"",
					{
						style: {
							"align-self": "flex-start",
						},
					},
					m(Button, {
						type: ButtonType.Secondary,
						label: () => "Attach files",
						click: () => {
							showFileChooser(true).then((chosenFiles) => {
								const tmp = userAttachments()
								tmp.push(...chosenFiles)
								userAttachments(tmp)
								m.redraw()
							})
						},
					}),
				),
			),
			// TODO: Add a tooltip around this checkbox with the text "Send technical logs to help us solve your issue."
			m(
				".center.mt",
				m(Checkbox, {
					label: () => lang.get("sendLogs_action"),
					class: "mb",
					checked: shouldIncludeLogs(),
					onChecked: (checked) => shouldIncludeLogs(checked),
				}),
			),
		)
	}

	private async collectLogs(): Promise<DataFile[]> {
		return await getLogAttachments(new Date())
	}
}
