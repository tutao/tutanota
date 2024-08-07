import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { Dialog, DialogType } from "../../../common/gui/base/Dialog"
import { ButtonType } from "../../../common/gui/base/Button.js"
import { isMailAddress } from "../../../common/misc/FormatValidator"
import { UserError } from "../../../common/api/main/UserError"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"
import type { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import { Keys, MailMethod, TabIndex } from "../../../common/api/common/TutanotaConstants"
import { progressIcon } from "../../../common/gui/base/Icon"
import { Editor } from "../../../common/gui/editor/Editor"
import { htmlSanitizer } from "../../../common/misc/HtmlSanitizer"
import { replaceInlineImagesWithCids } from "../view/MailGuiUtils"
import { TextField } from "../../../common/gui/base/TextField.js"
import { DialogHeaderBarAttrs } from "../../../common/gui/base/DialogHeaderBar"
import { RichTextToolbar } from "../../../common/gui/base/RichTextToolbar.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { getDefaultSender } from "../../../common/mailFunctionality/SharedMailUtils.js"

type PressContact = {
	email: string
	greeting: string
}

export function openPressReleaseEditor(mailboxDetails: MailboxDetail): void {
	function close() {
		dialog.close()
	}

	async function send() {
		const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		const body = pressRelease.bodyHtml()
		const subject = pressRelease.subject()
		let recipients

		try {
			recipients = getValidRecipients(pressRelease.recipientsJson())
		} catch (e) {
			if (e instanceof UserError) {
				return showUserError(e)
			} else {
				throw e
			}
		}

		// We aren't using translation keys here because it's not a user facing feature
		const choice = await Dialog.choice(
			() => `Really send the press release out to ${recipients.length} recipients?`,
			[
				{
					text: () => "Cancel",
					value: "cancel",
				},
				{
					text: () => "Just test",
					value: "test",
				},
				{
					text: () => "Yes please",
					value: "send",
				},
			],
		)

		if (choice === "cancel") {
			return
		}

		if (choice === "test") {
			recipients.splice(0, recipients.length, {
				email: getDefaultSender(locator.logins, mailboxDetails),
				greeting: "Hi Test Recipient",
			})
		}

		let progressMessage = ""
		let stop = false
		// Taken from showProgressDialog which has a hardcoded delay when you show it which we don't want
		// so we just reuse the same dialog and update the message
		const progressDialog = new Dialog(DialogType.Progress, {
			view: () =>
				m(
					".hide-outline",
					{
						// We make this element focusable so that the screen reader announces the dialog
						tabindex: TabIndex.Default,

						oncreate(vnode) {
							// We need to delay so that the eelement is attached to the parent
							setTimeout(() => {
								;(vnode.dom as HTMLElement).focus()
							}, 10)
						},
					},
					[m(".flex-center", progressIcon()), m("p#dialog-title", progressMessage)],
				),
		}).addShortcut({
			key: Keys.ESC,
			exec: () => (stop = true),
			help: "cancel_action",
		})
		progressDialog.show()
		let didFinish = true

		for (let recipient of recipients) {
			if (stop) {
				didFinish = false
				break
			}

			const bodyWithGreeting = `<p>${recipient.greeting},</p>${body}`

			try {
				const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
				const sendMailModel = await locator.sendMailModel(mailboxDetails, mailboxProperties)
				const model = await sendMailModel.initWithTemplate(
					{
						to: [
							{
								address: recipient.email,
								name: null,
							},
						],
					},
					subject,
					bodyWithGreeting,
					[],
					false,
				)
				await model.send(
					MailMethod.NONE,
					() => Promise.resolve(true),
					(_, p) => {
						progressMessage = `Sending to ${recipient.email}`
						m.redraw()
						return p
					},
				)
			} catch (e) {
				// Stop sending after first failure in case something bad happened
				Dialog.message(() => `Error sending to ${recipient.email}: ${e.message}.\nStopping.`)
				didFinish = false
				break
			}
		}

		progressDialog.close()

		if (didFinish) {
			close()
		}
	}

	const pressRelease = {
		bodyHtml: stream(""),
		subject: stream(""),
		recipientsJson: stream("[\n    \n]"),
	}
	const header: DialogHeaderBarAttrs = {
		left: [
			{
				label: "close_alt",
				click: close,
				type: ButtonType.Secondary,
			},
		],
		middle: () => "Press Release",
		right: [
			{
				label: "send_action",
				click: send,
				type: ButtonType.Primary,
			},
		],
	}
	const dialog = Dialog.editDialog(header, PressReleaseForm, pressRelease)
	dialog.show()
}

function getValidRecipients(recipientsJSON: string): Array<PressContact> {
	let parsed

	try {
		parsed = JSON.parse(recipientsJSON)
	} catch (e) {
		throw new UserError(() => "Unable to parse recipients JSON:\n" + e.toString())
	}

	if (!(parsed instanceof Array)) {
		throw new UserError(() => "Recipients must be an array")
	}

	return parsed.map(({ email, greeting }) => {
		if (typeof email !== "string" || !isMailAddress(email, false)) {
			throw new UserError(() => `Not all provided recipients have an "email" field`)
		}

		if (typeof greeting !== "string") {
			throw new UserError(() => `Not all provided recipients have a "greeting" field`)
		}

		// Discard any unneeded fields
		return {
			email,
			greeting,
		}
	})
}

export type PressReleaseFormAttrs = {
	subject: Stream<string>
	bodyHtml: Stream<string>
	recipientsJson: Stream<string>
}

export class PressReleaseForm implements Component<PressReleaseFormAttrs> {
	editor: Editor

	constructor(vnode: Vnode<PressReleaseFormAttrs>) {
		const { bodyHtml } = vnode.attrs
		this.editor = new Editor(
			200,
			(html, _) =>
				htmlSanitizer.sanitizeFragment(html, {
					blockExternalContent: false,
				}).fragment,
			null,
		)
		this.editor.initialized.promise.then(() => {
			this.editor.setHTML(bodyHtml())
			this.editor.addChangeListener(() => bodyHtml(replaceInlineImagesWithCids(this.editor.getDOM()).innerHTML))
		})
	}

	view(vnode: Vnode<PressReleaseFormAttrs>): Children {
		const { subject, recipientsJson } = vnode.attrs
		return m("", [
			m("label.i.monospace", "Recipients JSON"),
			m("textarea.full-width", {
				style: {
					height: "200px",
					resize: "none",
				},
				oninput: (e: InputEvent) => recipientsJson((e.target as HTMLTextAreaElement).value),
				value: recipientsJson(),
			}),
			m(TextField, {
				label: "subject_label",
				value: subject(),
				oninput: subject,
			}),
			m(RichTextToolbar, { editor: this.editor }),
			m(".border-top", m(this.editor)),
		])
	}
}
