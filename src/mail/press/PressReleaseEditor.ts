import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Dialog, DialogType} from "../../gui/base/Dialog"
import {ButtonType} from "../../gui/base/ButtonN"
import {isMailAddress} from "../../misc/FormatValidator"
import {UserError} from "../../api/main/UserError"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import {defaultSendMailModel} from "../editor/SendMailModel"
import type {MailboxDetail} from "../model/MailModel"
import {Keys, MailMethod, TabIndex} from "../../api/common/TutanotaConstants"
import {getDefaultSender} from "../model/MailUtils"
import {logins} from "../../api/main/LoginController"
import {progressIcon} from "../../gui/base/Icon"
import {Editor} from "../../gui/editor/Editor"
import {RichTextToolbar} from "../../gui/base/RichTextToolbar"
import {htmlSanitizer} from "../../misc/HtmlSanitizer"
import {replaceInlineImagesWithCids} from "../view/MailGuiUtils"
import {TextFieldN} from "../../gui/base/TextFieldN"
type PressContact = {
    email: string
    greeting: string
}
export function openPressReleaseEditor(mailboxDetails: MailboxDetail): void {
    function close() {
        dialog.close()
    }

    async function send() {
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
        const choice = await Dialog.choice(() => `Really send the press release out to ${recipients.length} recipients?`, [
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
        ])

        if (choice === "cancel") {
            return
        }

        if (choice === "test") {
            recipients.splice(0, recipients.length, {
                email: getDefaultSender(logins, mailboxDetails),
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
                                vnode.dom.focus()
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
                const model = await defaultSendMailModel(mailboxDetails).initWithTemplate(
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
    const header = {
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
    const dialog = Dialog.largeDialogN(header, PressReleaseForm, pressRelease)
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

    return parsed.map(({email, greeting}) => {
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
    toolbar: RichTextToolbar

    constructor(vnode: Vnode<PressReleaseFormAttrs>) {
        const {bodyHtml} = vnode.attrs
        this.editor = new Editor(
            200,
            (html, _) =>
                htmlSanitizer.sanitizeFragment(html, {
                    blockExternalContent: false,
                }).html,
        )
        this.editor.initialized.promise.then(() => {
            this.editor.setHTML(bodyHtml())
            this.editor.addChangeListener(() => bodyHtml(replaceInlineImagesWithCids(this.editor.getDOM()).innerHTML))
        })
        this.toolbar = new RichTextToolbar(this.editor)
    }

    view(vnode: Vnode<PressReleaseFormAttrs>): Children {
        const {subject, recipientsJson} = vnode.attrs
        return m("", [
            m("label.i.monospace", "Recipients JSON"),
            m("textarea.full-width", {
                style: {
                    height: "200px",
                    resize: "none",
                },
                oninput: e => recipientsJson(e.target.value),
                value: recipientsJson(),
            }),
            m(TextFieldN, {
                label: "subject_label",
                value: subject,
            }),
            m(this.toolbar),
            m(".border-top", m(this.editor)),
        ])
    }
}