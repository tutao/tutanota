import m, {Children, Component, Vnode, VnodeDOM} from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {Editor} from "../../gui/editor/Editor"
import type {Attachment, Recipients, ResponseMailParameters} from "./SendMailModel"
import {defaultSendMailModel, SendMailModel} from "./SendMailModel"
import {Dialog} from "../../gui/base/Dialog"
import {InfoLink, lang} from "../../misc/LanguageViewModel"
import type {MailboxDetail} from "../model/MailModel"
import {checkApprovalStatus} from "../../misc/LoginUtils"
import {checkAttachmentSize, conversationTypeString, getEnabledMailAddressesWithUser, LINE_BREAK, RecipientField} from "../model/MailUtils"
import {PermissionError} from "../../api/common/error/PermissionError"
import {locator} from "../../api/main/MainLocator"
import {logins} from "../../api/main/LoginController"
import {ALLOWED_IMAGE_FORMATS, ConversationType, FeatureType, Keys, MailMethod} from "../../api/common/TutanotaConstants"
import {ConnectionError} from "../../api/common/error/RestError"
import type {DialogHeaderBarAttrs} from "../../gui/base/DialogHeaderBar"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {attachDropdown, createDropdown} from "../../gui/base/DropdownN"
import {RichTextToolbar} from "../../gui/base/RichTextToolbar"
import {isApp, isBrowser, isDesktop} from "../../api/common/Env"
import {Icons} from "../../gui/base/icons/Icons"
import {RecipientInfoType} from "../../api/common/RecipientInfo"
import {animations, height, opacity} from "../../gui/animation/Animations"
import type {TextFieldAttrs} from "../../gui/base/TextFieldN"
import {TextFieldN} from "../../gui/base/TextFieldN"
import {
	chooseAndAttachFile,
	cleanupInlineAttachments,
	createAttachmentButtonAttrs,
	createPasswordField,
	getConfidentialStateMessage,
	MailEditorRecipientField,
} from "./MailEditorViewModel"
import {ExpanderButtonN, ExpanderPanelN} from "../../gui/base/Expander"
import {windowFacade} from "../../misc/WindowFacade"
import {UserError} from "../../api/main/UserError"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import {htmlSanitizer} from "../../misc/HtmlSanitizer"
import {DropDownSelectorN} from "../../gui/base/DropDownSelectorN"
import type {Mail} from "../../api/entities/tutanota/TypeRefs.js"
import type {File as TutanotaFile} from "../../api/entities/tutanota/TypeRefs.js"
import type {InlineImages} from "../view/MailViewer"
import {FileOpenError} from "../../api/common/error/FileOpenError"
import type {lazy} from "@tutao/tutanota-utils"
import {downcast, isNotNull, noOp, ofClass, typedValues} from "@tutao/tutanota-utils"
import {isCustomizationEnabledForCustomer} from "../../api/common/utils/Utils"
import {createInlineImage, replaceCidsWithInlineImages, replaceInlineImagesWithCids} from "../view/MailGuiUtils"
import {client} from "../../misc/ClientDetector"
import {appendEmailSignature} from "../signature/Signature"
import {showTemplatePopupInEditor} from "../../templates/view/TemplatePopup"
import {registerTemplateShortcutListener} from "../../templates/view/TemplateShortcutListener"
import {TemplatePopupModel} from "../../templates/model/TemplatePopupModel"
import {createKnowledgeBaseDialogInjection, createOpenKnowledgeBaseButtonAttrs} from "../../knowledgebase/view/KnowledgeBaseDialog"
import {KnowledgeBaseModel} from "../../knowledgebase/model/KnowledgeBaseModel"
import {styles} from "../../gui/styles"
import {showMinimizedMailEditor} from "../view/MinimizedMailEditorOverlay"
import {SaveErrorReason, SaveStatus, SaveStatusEnum} from "../model/MinimizedMailEditorViewModel"
import {isDataFile, isTutanotaFile} from "../../api/common/utils/FileUtils"
import {parseMailtoUrl} from "../../misc/parsing/MailAddressParser"
import {CancelledError} from "../../api/common/error/CancelledError"
import {Shortcut} from "../../misc/KeyManager";
import {DataFile} from "../../api/common/DataFile";
import {showUserError} from "../../misc/ErrorHandlerImpl"

export type MailEditorAttrs = {
    model: SendMailModel
    doBlockExternalContent: Stream<boolean>
    doShowToolbar: Stream<boolean>
    onload?: (editor: Editor) => void
    onclose?: (...args: Array<any>) => any
    areDetailsExpanded: Stream<boolean>
    selectedNotificationLanguage: Stream<string>
    dialog: lazy<Dialog>
    templateModel: TemplatePopupModel | null
    createKnowledgeBaseButtonAttrs: (editor: Editor) => Promise<ButtonAttrs | null>
}

export function createMailEditorAttrs(
    model: SendMailModel,
    doBlockExternalContent: boolean,
    doFocusEditorOnLoad: boolean,
    dialog: lazy<Dialog>,
    templateModel: TemplatePopupModel | null,
    createKnowledgeBaseButtonAttrs: (editor: Editor) => Promise<ButtonAttrs | null>,
): MailEditorAttrs {
    return {
        model,
        doBlockExternalContent: stream(doBlockExternalContent),
        doShowToolbar: stream(false),
        areDetailsExpanded: stream(false),
        selectedNotificationLanguage: stream(""),
        dialog,
        templateModel,
        createKnowledgeBaseButtonAttrs: createKnowledgeBaseButtonAttrs,
    }
}

export class MailEditor implements Component<MailEditorAttrs> {
    editor: Editor
    toolbar: RichTextToolbar
    recipientFields: {
        to: MailEditorRecipientField
        cc: MailEditorRecipientField
        bcc: MailEditorRecipientField
    }
    mentionedInlineImages: Array<string>
    inlineImageElements: Array<HTMLElement>
    templateModel: TemplatePopupModel | null
    openKnowledgeBaseButtonAttrs: ButtonAttrs | null = null

    constructor(vnode: Vnode<MailEditorAttrs>) {
        this.inlineImageElements = []
        this.mentionedInlineImages = []
        const a: MailEditorAttrs = vnode.attrs
        const model = a.model
        this.templateModel = a.templateModel
        this.editor = new Editor(200, (html, isPaste) => {
            const sanitized = htmlSanitizer.sanitizeFragment(html, {
                blockExternalContent: !isPaste && a.doBlockExternalContent(),
            })
            this.mentionedInlineImages = sanitized.inlineImageCids
            return sanitized.html
        })

        const onEditorChanged = () => {
            cleanupInlineAttachments(this.editor.getDOM(), this.inlineImageElements, model.getAttachments())
            model.setMailChanged(true)
            m.redraw()
        }

        // call this async because the editor is not initialized before this mail editor dialog is shown
        this.editor.initialized.promise.then(() => {
            this.editor.setHTML(model.getBody())
            // Add mutation observer to remove attachments when corresponding DOM element is removed
            new MutationObserver(onEditorChanged).observe(this.editor.getDOM(), {
                attributes: false,
                childList: true,
                subtree: true,
            })
            // since the editor is the source for the body text, the model won't know if the body has changed unless we tell it
            this.editor.addChangeListener(() => model.setBody(replaceInlineImagesWithCids(this.editor.getDOM()).innerHTML))

            if (a.templateModel) {
                a.templateModel.init().then(templateModel => {
                    // add this event listener to handle quick selection of templates inside the editor
                    registerTemplateShortcutListener(this.editor, templateModel)
                })
            }
        })
        const insertImageHandler = isApp()
            ? null
            : (event: Event) =>
                chooseAndAttachFile(model, (event.target as HTMLElement).getBoundingClientRect(), ALLOWED_IMAGE_FORMATS).then(files => {
                    files &&
                    files.forEach(file => {
                        // Let's assume it's DataFile for now... Editor bar is available for apps but image button is not
                        if (isDataFile(file)) {
                            const img = createInlineImage(file as DataFile)
                            model.loadedInlineImages.set(img.cid, img)
                            this.inlineImageElements.push(
                                this.editor.insertImage(img.objectUrl, {
                                    cid: img.cid,
                                    style: "max-width: 100%",
                                }),
                            )
                        }
                    })
                    m.redraw()
                })
        const templateButtonAttrs: ButtonAttrs[] = this.templateModel
            ? [
                {
                    label: "emptyString_msg",
                    title: "openTemplatePopup_msg",
                    click: () => {
                        this.openTemplates()
                    },
                    type: ButtonType.Toggle,
                    icon: () => Icons.ListAlt,
                },
            ]
            : []
        this.toolbar = new RichTextToolbar(this.editor, {
            imageButtonClickHandler: insertImageHandler,
            customButtonAttrs: templateButtonAttrs,
        })
        let toFieldInectionsRight
        let toFieldDisabled = false

        if (model.logins().isInternalUserLoggedIn()) {
            toFieldInectionsRight = () =>
                m(
                    ".mr-s",
                    m(ExpanderButtonN, {
                        label: "show_action",
                        expanded: a.areDetailsExpanded,
                    }),
                )
        } else {
            toFieldDisabled = true
        }

        this.recipientFields = {
            to: new MailEditorRecipientField(model, RecipientField.TO, locator.contactModel, toFieldInectionsRight, toFieldDisabled),
            cc: new MailEditorRecipientField(model, RecipientField.CC, locator.contactModel),
            bcc: new MailEditorRecipientField(model, RecipientField.BCC, locator.contactModel),
        }
        this.editor.initialized.promise.then(() => {
            this.inlineImageElements = replaceCidsWithInlineImages(this.editor.getDOM(), model.loadedInlineImages, (cid, event, dom) => {
				const downloadClickHandler = createDropdown({
					lazyButtons: () => [
						{
							label: "download_action",
							click: () => {
								const inlineAttachment = model.getAttachments().find(attachment => attachment.cid === cid)

								if (inlineAttachment && isTutanotaFile(inlineAttachment)) {
									locator.fileController
										   .downloadAndOpen(downcast(inlineAttachment), true)
										   .catch(ofClass(FileOpenError, () => Dialog.message("canNotOpenFileOnDevice_msg")))
								}
							},
							type: ButtonType.Dropdown,
						},
					]
				})
                downloadClickHandler(downcast(event), dom)
            })
        })
        model.onMailChanged.map(didChange => {
            if (didChange) m.redraw()
        })
        // Leftover text in recipient field is an error
        model.setOnBeforeSendFunction(() => {
            let invalidText = ""

            for (const field of typedValues(this.recipientFields)) {
                field.component.createBubbles()

                if (field.component.currentValue().trim() !== "") {
                    invalidText += "\n" + field.component.currentValue().trim()
                }
            }

            if (invalidText !== "") {
                throw new UserError(() => lang.get("invalidRecipients_msg") + invalidText)
            }
        })
        const dialog = a.dialog()

        if (model.getConversationType() === ConversationType.REPLY || model.toRecipients().length) {
            dialog.setFocusOnLoadFunction(() => {
                this.editor.initialized.promise.then(() => this.editor.focus())
            })
        }

        const shortcuts: Shortcut[] = [
            {
                key: Keys.SPACE,
                ctrl: true,
                exec: () => this.openTemplates(),
                help: "openTemplatePopup_msg",
            }, // these are handled by squire
            {
                key: Keys.B,
                ctrl: true,
                exec: noOp,
                help: "formatTextBold_msg",
            },
            {
                key: Keys.I,
                ctrl: true,
                exec: noOp,
                help: "formatTextItalic_msg",
            },
            {
                key: Keys.U,
                ctrl: true,
                exec: noOp,
                help: "formatTextUnderline_msg",
            },
        ]
        shortcuts.forEach(dialog.addShortcut.bind(dialog))
        this.editor.initialized.promise.then(() => {
            a.createKnowledgeBaseButtonAttrs(this.editor).then(attrs => {
                this.openKnowledgeBaseButtonAttrs = attrs
                m.redraw()
            })
        })
    }

    view(vnode: Vnode<MailEditorAttrs>): Children {
        const a = vnode.attrs
        const {model} = a

        const showConfidentialButton = model.containsExternalRecipients()
        const isConfidential = model.isConfidential() && showConfidentialButton
        const confidentialButtonAttrs: ButtonAttrs = {
            label: "confidential_action",
            click: (event, attrs) => model.setConfidential(!model.isConfidential()),
            icon: () => (model.isConfidential() ? Icons.Lock : Icons.Unlock),
            isSelected: () => model.isConfidential(),
        }
        const attachFilesButtonAttrs: ButtonAttrs = {
            label: "attachFiles_action",
            click: (ev, dom) => chooseAndAttachFile(model, dom.getBoundingClientRect()).then(() => m.redraw()),
            icon: () => Icons.Attachment,
        }
        const plaintextFormatting = logins.getUserController().props.sendPlaintextOnly
        this.editor.setCreatesLists(!plaintextFormatting)

        const toolbarButton = () =>
            !plaintextFormatting
                ? m(ButtonN, {
                    label: "showRichTextToolbar_action",
                    icon: () => Icons.FontSize,
                    click: event => {
                        a.doShowToolbar(!a.doShowToolbar())
                        // Stop the subject bar from being focused
                        event.stopPropagation()
                        this.editor.focus()
                    },
                    isSelected: a.doShowToolbar,
                    noRecipientInfoBubble: true,
                } as ButtonAttrs)
                : null

        const subjectFieldAttrs: TextFieldAttrs = {
            label: "subject_label",
            helpLabel: () => getConfidentialStateMessage(model.isConfidential()),
            value: stream(model.getSubject()),
            oninput: val => model.setSubject(val),
            injectionsRight: () => {
                return [
                    showConfidentialButton ? m(ButtonN, confidentialButtonAttrs) : null,
                    this.openKnowledgeBaseButtonAttrs ? m(ButtonN, this.openKnowledgeBaseButtonAttrs) : null,
                    m(ButtonN, attachFilesButtonAttrs),
                    toolbarButton(),
                ]
            },
        }

        function animate(domElement: HTMLElement, fadein: boolean) {
            let childHeight = domElement.offsetHeight
            return animations.add(domElement, fadein ? height(0, childHeight) : height(childHeight, 0)).then(() => {
                domElement.style.height = ""
            })
        }

        const attachmentButtonAttrs = createAttachmentButtonAttrs(model, this.inlineImageElements)

        const lazyPasswordFieldAttrs = () =>
            model
                .allRecipients()
                .filter(r => r.type === RecipientInfoType.EXTERNAL || (r.type === RecipientInfoType.UNKNOWN && !r.resolveContactPromise)) // only show passwords for resolved contacts, otherwise we might not get the password
                .map(r =>
                    m(
                        TextFieldN,
                        Object.assign({}, createPasswordField(model, r), {
                            oncreate: (vnode: VnodeDOM<TextFieldAttrs>) => {
                                animate(vnode.dom as HTMLElement, true)
                            },
                            onbeforeremove: (vnode: VnodeDOM<TextFieldAttrs>) => animate(vnode.dom as HTMLElement, false),
                        }),
                    ),
                )

        const selectedNotificationLanguage = stream(model.getSelectedNotificationLanguageCode())

        const lazyLanguageDropDownAttrs = () => {
            return {
                label: "notificationMailLanguage_label",
                items: model.getAvailableNotificationTemplateLanguages().map(language => {
                    return {
                        name: lang.get(language.textId),
                        value: language.code,
                    }
                }),
                selectedValue: selectedNotificationLanguage,
                selectionChangedHandler: (v: string) => model.setSelectedNotificationLanguageCode(v),
                dropdownWidth: 250,
            } as const
        }

        let editCustomNotificationMailAttrs: ButtonAttrs | null = null

        if (logins.getUserController().isGlobalAdmin()) {
            editCustomNotificationMailAttrs = attachDropdown(
                {
					mainButtonAttrs: {
						label: "edit_action",
						click: () => {
						},
						icon: () => Icons.Edit,
					}, childAttrs: () => [
						{
							label: "add_action",
							click: () => {
								import("../../settings/EditNotificationEmailDialog").then(({showAddOrEditNotificationEmailDialog}) =>
									showAddOrEditNotificationEmailDialog(logins.getUserController()),
								)
							},
							type: ButtonType.Dropdown,
						},
						{
							label: "edit_action",
							click: () => {
								import("../../settings/EditNotificationEmailDialog").then(({showAddOrEditNotificationEmailDialog}) =>
									showAddOrEditNotificationEmailDialog(logins.getUserController(), selectedNotificationLanguage),
								)
							},
							type: ButtonType.Dropdown,
						},
					]
				},
            )
        }

        return m(
            "#mail-editor.full-height.text.touch-callout.flex.flex-column",
            {
                onclick: (e: MouseEvent) => {
                    if (e.target === this.editor.getDOM()) {
                        this.editor.focus()
                    }
                },
                ondragover: (ev: DragEvent) => {
                    // do not check the data transfer here because it is not always filled, e.g. in Safari
                    ev.stopPropagation()
                    ev.preventDefault()
                },
                ondrop: (ev: DragEvent) => {
                    if (ev.dataTransfer?.files && ev.dataTransfer.files.length > 0) {
                        locator.fileController
                               .readLocalFiles(ev.dataTransfer.files)
                               .then(dataFiles => {
                                   model.attachFiles(dataFiles as any)
                                   m.redraw()
                               })
                               .catch(e => {
                                   console.log(e)
                                   return Dialog.message("couldNotAttachFile_msg")
                               })
                        ev.stopPropagation()
                        ev.preventDefault()
                    }
                },
            },
            [
                m(".rel", m(this.recipientFields.to.component)),
                m(
                    ".rel",
                    m(
                        ExpanderPanelN,
                        {
                            expanded: a.areDetailsExpanded,
                        },
                        m(".details", [m(this.recipientFields.cc.component), m(this.recipientFields.bcc.component)]),
                    ),
                ),
                m(".wrapping-row", [
                    m(
                        "",
                        {
                            style: {
                                "min-width": "250px",
                            },
                        },
                        m(DropDownSelectorN, {
                            label: "sender_label",
                            items: getEnabledMailAddressesWithUser(model.getMailboxDetails(), model.user().userGroupInfo)
                                .sort()
                                .map(mailAddress => ({
                                    name: mailAddress,
                                    value: mailAddress,
                                })),
                            selectedValue: stream(a.model.getSender()),
                            selectionChangedHandler: (selection: string) => model.setSender(selection),
                            dropdownWidth: 250,
                        } as const),
                    ),
                    isConfidential
                        ? m(
                            ".flex",
                            {
                                style: {
                                    "min-width": "250px",
                                },
                                oncreate: vnode => {
                                    const htmlVnode = vnode as VnodeDOM
                                    const htmlDom = htmlVnode.dom as HTMLElement
                                    htmlDom.style.opacity = "0"
                                    return animations.add(htmlDom, opacity(0, 1, true))
                                },
                                onbeforeremove: vnode => {
                                    const htmlVnode = vnode as VnodeDOM
                                    const htmlDom = htmlVnode.dom as HTMLElement
                                    htmlDom.style.opacity = "1"
                                    return animations.add(htmlDom, opacity(1, 0, true))
                                },
                            },
                            [
                                m(".flex-grow", m(DropDownSelectorN, lazyLanguageDropDownAttrs())),
                                editCustomNotificationMailAttrs
                                    ? m(".flex-no-grow.col.flex-end.border-bottom", m(".mr-negative-s", m(ButtonN, editCustomNotificationMailAttrs)))
                                    : null,
                            ],
                        )
                        : null,
                ]),
                isConfidential
                    ? m(
                        ".external-recipients.overflow-hidden",
                        {
                            oncreate: vnode => animate((vnode as VnodeDOM).dom as HTMLElement, true),
                            onbeforeremove: vnode => animate((vnode as VnodeDOM).dom as HTMLElement, false),
                        },
                        lazyPasswordFieldAttrs(),
                    )
                    : null,
                m(".row", m(TextFieldN, subjectFieldAttrs)),
                m(
                    ".flex-start.flex-wrap.ml-negative-RecipientInfoBubble",
                    attachmentButtonAttrs.map(a => m(ButtonN, a)),
                ),
                model.getAttachments().length > 0 ? m("hr.hr") : null,
                a.doShowToolbar() // Toolbar is not removed from DOM directly, only it's parent (array) is so we have to animate it manually.
                    ? // m.fragment() gives us a vnode without actual DOM element so that we can run callback on removal
                    m.fragment(
                        {
                            onbeforeremove: ({dom}) => this.toolbar._animate(dom.children[0] as HTMLElement, false),
                        },
                        [m(this.toolbar), m("hr.hr")],
                    )
                    : null,
                m(
                    ".pt-s.text.scroll-x.break-word-links.flex.flex-column.flex-grow",
                    {
                        onclick: () => this.editor.focus(),
                    },
                    m(this.editor)
                ),
                m(".pb"),
            ],
        )
    }

    openTemplates() {
        if (this.templateModel) {
            this.templateModel.init().then(templateModel => {
                showTemplatePopupInEditor(templateModel, this.editor, null, this.editor.getSelectedText())
            })
        }
    }
}

/**
 * Creates a new Dialog with a MailEditor inside.
 * @param model
 * @param blockExternalContent
 * @param inlineImages
 * @returns {Dialog}
 * @private
 */
function createMailEditorDialog(model: SendMailModel, blockExternalContent: boolean = false): Dialog {
    let dialog: Dialog
    let mailEditorAttrs: MailEditorAttrs

    const save = (showProgress: boolean = true) => {
        const savePromise = model.saveDraft(true, MailMethod.NONE)

        if (showProgress) {
            return showProgressDialog("save_msg", savePromise)
        } else {
            return savePromise
        }
    }

    const send = async () => {
        try {
            const success = await model.send(MailMethod.NONE, Dialog.confirm, showProgressDialog)
            if (success) {
                dispose()
                dialog.close()
            }
        } catch (e) {
			if (e instanceof UserError) {
				showUserError(e)
			} else {
				throw e
			}
		}
	}

    const dispose = () => {
        model.dispose()
        if (templatePopupModel) templatePopupModel.dispose()
    }

    const minimize = () => {
		const saveStatus = stream<SaveStatus>({status: SaveStatusEnum.Saving})
        save(false)
			.then(() => saveStatus({status: SaveStatusEnum.Saved}))
            .catch(e => {

				const reason = e instanceof ConnectionError
					? SaveErrorReason.ConnectionLost
					: SaveErrorReason.Unknown

				saveStatus({status: SaveStatusEnum.NotSaved, reason})

				// If we don't show the error in the minimized error dialog,
				// Then we need to communicate it in a dialog or as an unhandled error
				if (reason === SaveErrorReason.Unknown) {
					if (e instanceof UserError) {
						showUserError(e)
					} else {
						throw e
					}
				}
            })
        showMinimizedMailEditor(dialog, model, locator.minimizedMailModel, locator.eventController, dispose, saveStatus)
    }

    let windowCloseUnsubscribe = () => {
    }

    const headerBarAttrs: DialogHeaderBarAttrs = {
        left: [{
            label: "close_alt",
            click: () => minimize(),
            type: ButtonType.Secondary,
        }],
        right: [
            {
                label: "send_action",
				click: () => {
					send()
				},
                type: ButtonType.Primary,
            },
        ],
        middle: () => conversationTypeString(model.getConversationType()),
        create: () => {
            if (isBrowser()) {
                // Have a simple listener on browser, so their browser will make the user ask if they are sure they want to close when closing the tab/window
                windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {
                })
            } else if (isDesktop()) {
                // Simulate clicking the Close button when on the desktop so they can see they can save a draft rather than completely closing it
                windowCloseUnsubscribe = windowFacade.addWindowCloseListener(() => {
                    minimize()
                })
            }
        },
        remove: () => {
            windowCloseUnsubscribe()
        },
    }
    const templatePopupModel =
        logins.isInternalUserLoggedIn() && client.isDesktopDevice() ? new TemplatePopupModel(locator.eventController, logins, locator.entityClient) : null

    const createKnowledgebaseButtonAttrs = (editor: Editor) => {
        return logins.isInternalUserLoggedIn()
            ? logins
                .getUserController()
                .loadCustomer()
                .then(customer => {
                    // only create knowledgebase button for internal users with valid template group and enabled KnowledgebaseFeature
                    if (
                        styles.isDesktopLayout() &&
                        templatePopupModel &&
                        logins.getUserController().getTemplateMemberships().length > 0 &&
                        isCustomizationEnabledForCustomer(customer, FeatureType.KnowledgeBase)
                    ) {
                        return new KnowledgeBaseModel(locator.eventController, locator.entityClient, logins.getUserController())
                            .init()
                            .then(knowledgebaseModel => {
                                const knowledgebaseInjection = createKnowledgeBaseDialogInjection(knowledgebaseModel, templatePopupModel, editor)
                                const knowledgebaseButtonAttrs = createOpenKnowledgeBaseButtonAttrs(knowledgebaseInjection, () => editor.getValue())
                                dialog.setInjectionRight(knowledgebaseInjection)
                                return knowledgebaseButtonAttrs
                            })
                    } else {
                        return null
                    }
                })
            : Promise.resolve(null)
    }

    mailEditorAttrs = createMailEditorAttrs(
        model,
        blockExternalContent,
        model.toRecipients().length !== 0,
        () => dialog,
        templatePopupModel,
        createKnowledgebaseButtonAttrs,
    )
    const shortcuts: Shortcut[] = [
        {
            key: Keys.ESC,
            exec: () => {
                minimize()
            },
            help: "close_alt",
        },
        {
            key: Keys.S,
            ctrl: true,
            exec: () => {
                save().catch(ofClass(UserError, showUserError))
            },
            help: "save_action",
        },
        {
            key: Keys.S,
            ctrl: true,
            shift: true,
            exec: () => {
                send()
            },
            help: "send_action",
        },
        {
            key: Keys.RETURN,
            ctrl: true,
            exec: () => {
                send()
            },
            help: "send_action",
        },
    ]
    dialog = Dialog.largeDialogN(headerBarAttrs, MailEditor, mailEditorAttrs)
    dialog.setCloseHandler(() => minimize())

    for (let shortcut of shortcuts) {
        dialog.addShortcut(shortcut)
    }

    return dialog
}

/**
 * open a MailEditor
 * @param mailboxDetails details to use when sending an email
 * @returns {*}
 * @private
 * @throws PermissionError
 */
export function newMailEditor(mailboxDetails: MailboxDetail): Promise<Dialog> {
    // We check approval status so as to get a dialog informing the user that they cannot send mails
    // but we still want to open the mail editor because they should still be able to contact sales@tutao.de
    return checkApprovalStatus(logins, false).then(_ => {
        return import("../signature/Signature")
            .then(({appendEmailSignature}) => appendEmailSignature("", logins.getUserController().props))
            .then(signature => newMailEditorFromTemplate(mailboxDetails, {}, "", signature))
    })
}

export function newMailEditorAsResponse(
    args: ResponseMailParameters,
    blockExternalContent: boolean,
    inlineImages: InlineImages,
    mailboxDetails?: MailboxDetail,
): Promise<Dialog> {
    return _mailboxPromise(mailboxDetails)
        .then(defaultSendMailModel)
        .then(model => model.initAsResponse(args, inlineImages))
        .then(model => createMailEditorDialog(model, blockExternalContent))
}

export function newMailEditorFromDraft(
    draft: Mail,
    attachments: Array<TutanotaFile>,
    bodyText: string,
    blockExternalContent: boolean,
    inlineImages: InlineImages,
    mailboxDetails?: MailboxDetail,
): Promise<Dialog> {
    return _mailboxPromise(mailboxDetails)
        .then(defaultSendMailModel)
        .then(model => model.initWithDraft(draft, attachments, bodyText, inlineImages))
        .then(model => createMailEditorDialog(model, blockExternalContent))
}

export async function newMailtoUrlMailEditor(mailtoUrl: string, confidential: boolean, mailboxDetails?: MailboxDetail): Promise<Dialog> {
    const mailbox = await _mailboxPromise(mailboxDetails)
    const mailTo = parseMailtoUrl(mailtoUrl)
    let dataFiles: Attachment[] = []

    if (mailTo.attach) {
        const attach = mailTo.attach
        dataFiles = (await Promise.all(attach.map(uri => locator.fileController.getDataFile(uri)))).filter(isNotNull)
        // make sure the user is aware that (and which) files have been attached
        const keepAttachments =
            dataFiles.length === 0 ||
            (await Dialog.confirm("attachmentWarning_msg", "attachFiles_action", () =>
                dataFiles.map((df, i) =>
                    m(
                        ".text-break.selectable.mt-xs",
                        {
                            title: attach[i],
                        },
                        df.name,
                    ),
                ),
            ))

        if (keepAttachments) {
            const sizeCheckResult = checkAttachmentSize(dataFiles)
            dataFiles = sizeCheckResult.attachableFiles

            if (sizeCheckResult.tooBigFiles.length > 0) {
                await Dialog.message(
                    () => lang.get("tooBigAttachment_msg"),
                    () => sizeCheckResult.tooBigFiles.map(file => m(".text-break.selectable", file)),
                )
            }
        } else {
            throw new CancelledError("user cancelled opening mail editor with attachments")
        }
    }

    return newMailEditorFromTemplate(
        mailbox,
        mailTo.recipients,
        mailTo.subject || "",
        appendEmailSignature(mailTo.body || "", logins.getUserController().props),
        dataFiles,
        confidential,
    )
}

export function newMailEditorFromTemplate(
    mailboxDetails: MailboxDetail,
    recipients: Recipients,
    subject: string,
    bodyText: string,
    attachments?: ReadonlyArray<Attachment>,
    confidential?: boolean,
    senderMailAddress?: string,
): Promise<Dialog> {
    return defaultSendMailModel(mailboxDetails)
        .initWithTemplate(recipients, subject, bodyText, attachments, confidential, senderMailAddress)
        .then(model => createMailEditorDialog(model))
}

export function getSupportMailSignature(): Promise<string> {
    return import("../../calendar/date/CalendarUtils").then(({getTimeZone}) => {
        return (
            LINE_BREAK +
            LINE_BREAK +
            "--" +
            `<br>Client: ${client.getIdentifier()}` +
            `<br>Tutanota version: ${env.versionNumber}` +
            `<br>Time zone: ${getTimeZone()}` +
            `<br>User agent:<br> ${navigator.userAgent}`
        )
    })
}

/**
 * Create and show a new mail editor with a support query, addressed to premium support,
 * or show an option to upgrade
 * @param subject
 * @param mailboxDetails
 * @returns {Promise<any>|Promise<R>|*}
 */
export function writeSupportMail(subject: string = "", mailboxDetails?: MailboxDetail) {
    if (logins.getUserController().isPremiumAccount()) {
        _mailboxPromise(mailboxDetails).then(mailbox => {
            const recipients = {
                to: [
                    {
                        name: null,
                        address: "premium@tutao.de",
                    },
                ],
            }
            return getSupportMailSignature().then(signature => {
                return newMailEditorFromTemplate(mailbox, recipients, subject, signature).then(dialog => dialog.show())
            })
        })
    } else {
        import("../../subscription/PriceUtils")
            .then(({formatPrice}) => {
                const message = lang.get("premiumOffer_msg", {
                    "{1}": formatPrice(1, true),
                })
                const title = lang.get("upgradeReminderTitle_msg")
                return Dialog.reminder(title, message, InfoLink.PremiumProBusiness)
            })
            .then(confirm => {
                if (confirm) {
                    import("../../subscription/UpgradeSubscriptionWizard").then(utils => utils.showUpgradeWizard())
                }
            })
    }
}

/**
 * Create and show a new mail editor with an invite message
 * @param mailboxDetails
 * @returns {*}
 */
export function writeInviteMail(mailboxDetails?: MailboxDetail) {
    _mailboxPromise(mailboxDetails).then(mailbox => {
        const username = logins.getUserController().userGroupInfo.name
        const body = lang.get("invitationMailBody_msg", {
            "{registrationLink}": "https://mail.tutanota.com/signup",
            "{username}": username,
            "{githubLink}": "https://github.com/tutao/tutanota",
        })
        newMailEditorFromTemplate(mailbox, {}, lang.get("invitationMailSubject_msg"), body, [], false).then(dialog => dialog.show())
    })
}

/**
 * Create and show a new mail editor with an invite message
 * @param link: the link to the giftcard
 * @param svg: an SVGElement that is the DOM node of the rendered gift card
 * @param mailboxDetails
 * @returns {*}
 */
export function writeGiftCardMail(link: string, svg: SVGElement, mailboxDetails?: MailboxDetail) {
    _mailboxPromise(mailboxDetails).then(mailbox => {
        let bodyText = lang
            .get("defaultShareGiftCardBody_msg", {
                "{link}": '<a href="' + link + '">' + link + "</a>",
                "{username}": logins.getUserController().userGroupInfo.name,
            })
            .split("\n")
            .join("<br />")
        const subject = lang.get("defaultShareGiftCardSubject_msg")
        defaultSendMailModel(mailbox)
            .initWithTemplate({}, subject, appendEmailSignature(bodyText, logins.getUserController().props), [], false)
            .then(model => createMailEditorDialog(model, false))
            .then(dialog => dialog.show())
    })
}

function _mailboxPromise(mailbox?: MailboxDetail): Promise<MailboxDetail> {
    return mailbox ? Promise.resolve(mailbox) : locator.mailModel.getUserMailboxDetails()
}