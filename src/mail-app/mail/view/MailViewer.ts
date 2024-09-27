import { px, size } from "../../../common/gui/size"
import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import { windowFacade, windowSizeListener } from "../../../common/misc/WindowFacade"
import { FeatureType, InboxRuleType, Keys, MailSetKind, SpamRuleFieldType, SpamRuleType } from "../../../common/api/common/TutanotaConstants"
import { File as TutanotaFile, Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { lang } from "../../../common/misc/LanguageViewModel"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { assertNonNull, assertNotNull, defer, DeferredObject, noOp, ofClass } from "@tutao/tutanota-utils"
import { IconMessageBox } from "../../../common/gui/base/ColumnEmptyMessageBox"
import type { Shortcut } from "../../../common/misc/KeyManager"
import { keyManager } from "../../../common/misc/KeyManager"
import { Icon, progressIcon } from "../../../common/gui/base/Icon"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { theme } from "../../../common/gui/theme"
import { client } from "../../../common/misc/ClientDetector"
import { styles } from "../../../common/gui/styles"
import { DropdownButtonAttrs, showDropdownAtPosition } from "../../../common/gui/base/Dropdown.js"
import { isTutanotaTeamMail, replaceCidsWithInlineImages } from "./MailGuiUtils"
import { getCoordsOfMouseOrTouchEvent } from "../../../common/gui/base/GuiUtils"
import { copyToClipboard } from "../../../common/misc/ClipboardUtils"
import { ContentBlockingStatus, MailViewerViewModel } from "./MailViewerViewModel"
import { createEmailSenderListElement } from "../../../common/api/entities/sys/TypeRefs.js"
import { UserError } from "../../../common/api/main/UserError"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"
import { isNewMailActionAvailable } from "../../../common/gui/nav/NavFunctions"
import { CancelledError } from "../../../common/api/common/error/CancelledError"
import { MailViewerHeader } from "./MailViewerHeader.js"
import { editDraft, showHeaderDialog, showSourceDialog } from "./MailViewerUtils.js"
import { ToggleButton } from "../../../common/gui/base/buttons/ToggleButton.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { PinchZoom } from "../../../common/gui/PinchZoom.js"
import { responsiveCardHMargin, responsiveCardHPadding } from "../../../common/gui/cards.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import { createNewContact } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { getExistingRuleForType } from "../model/MailUtils.js"

assertMainOrNode()

type MailAddressAndName = {
	name: string
	address: string
}

export type MailViewerAttrs = {
	viewModel: MailViewerViewModel
	isPrimary: boolean
	/**
	 * Mail body might contain blockquotes that we want to collapse in some cases (e.g. the thread is visible in conversation anyway) or expand in other
	 * cases (e.g. if it's a single/the first email in the conversation).
	 *
	 */
	defaultQuoteBehavior: "collapse" | "expand"
}

/**
 * The MailViewer displays a mail. The mail body is loaded asynchronously.
 *
 * The viewer has a longer lifecycle than viewModel so we need to be careful about the state.
 */
export class MailViewer implements Component<MailViewerAttrs> {
	/** it is set after we measured mail body element */
	private bodyLineHeight: number | null = null

	private isScaling = true
	/**
	 * Delay the display of the progress spinner in main body view for a short time to suppress it when we are switching between cached emails
	 * and we are just sanitizing
	 */
	private delayProgressSpinner = true

	private readonly resizeListener: windowSizeListener
	private resizeObserverViewport: ResizeObserver | null = null // needed to detect orientation change to recreate pinchzoom at the right time
	private resizeObserverZoomable: ResizeObserver | null = null // needed to recreate pinchzoom e.g. when loading images

	private viewModel!: MailViewerViewModel
	private pinchZoomable: PinchZoom | null = null
	private readonly shortcuts: Array<Shortcut>

	private scrollDom: HTMLElement | null = null

	private domBodyDeferred: DeferredObject<HTMLElement> = defer()
	private domBody: HTMLElement | null = null

	private shadowDomRoot: ShadowRoot | null = null
	private shadowDomMailContent: HTMLElement | null = null
	private currentlyRenderedMailBody: DocumentFragment | null = null
	private lastContentBlockingStatus: ContentBlockingStatus | null = null

	private loadAllListener = stream()
	/** for block quotes in mail bodies, whether to display quote before user interaction
	 * is "none" until we render once */
	private currentQuoteBehavior: "none" | "collapse" | "expand" = "none"
	/** for block quotes in mail bodies, whether to display placeholder or original quote */
	private quoteState: "noquotes" | "unset" | "collapsed" | "expanded" = "unset"

	constructor(vnode: Vnode<MailViewerAttrs>) {
		this.setViewModel(vnode.attrs.viewModel, vnode.attrs.isPrimary)

		this.resizeListener = () => this.domBodyDeferred.promise.then((dom) => this.updateLineHeight(dom))

		this.shortcuts = this.setupShortcuts(vnode.attrs)
	}

	oncreate({ attrs }: Vnode<MailViewerAttrs>) {
		if (attrs.isPrimary) {
			keyManager.registerShortcuts(this.shortcuts)
		}
		windowFacade.addResizeListener(this.resizeListener)
	}

	onremove({ attrs }: Vnode<MailViewerAttrs>) {
		windowFacade.removeResizeListener(this.resizeListener)
		if (this.resizeObserverZoomable) {
			this.resizeObserverZoomable.disconnect()
		}
		if (this.resizeObserverViewport) {
			this.resizeObserverViewport.disconnect()
		}
		this.pinchZoomable?.remove() // remove the listeners
		this.clearDomBody()
		if (attrs.isPrimary) {
			keyManager.unregisterShortcuts(this.shortcuts)
		}
	}

	private setViewModel(viewModel: MailViewerViewModel, isPrimary: boolean) {
		// Figuring out whether we have a new email assigned.
		const oldViewModel = this.viewModel
		this.viewModel = viewModel
		if (this.viewModel !== oldViewModel) {
			this.loadAllListener.end(true)
			this.loadAllListener = this.viewModel.loadCompleteNotification.map(async () => {
				// streams are pretty much synchronous, so we could be in the middle of a redraw here and mithril does not just schedule another redraw, it
				// will error out so before calling m.redraw.sync() we want to make sure that we are not inside a redraw by just scheduling a microtask with
				// this simple await.
				await Promise.resolve()
				// Wait for mail body to be redrawn before replacing images
				m.redraw.sync()
				await this.replaceInlineImages()
				m.redraw()
			})

			// Reset scaling status if it's a new email.
			this.isScaling = true
			this.lastContentBlockingStatus = null
			this.delayProgressSpinner = true
			setTimeout(() => {
				this.delayProgressSpinner = false
				m.redraw()
			}, 50)
		}
	}

	view(vnode: Vnode<MailViewerAttrs>): Children {
		this.handleContentBlockingOnRender()

		return [
			m(".mail-viewer.overflow-x-hidden", [
				this.renderMailHeader(vnode.attrs),
				this.renderMailSubject(vnode.attrs),
				m(
					".flex-grow.scroll-x.pt.pb.border-radius-big" + (this.viewModel.isContrastFixNeeded() ? ".bg-white.content-black" : " "),
					{
						class: responsiveCardHPadding(),
						oncreate: (vnode) => {
							this.scrollDom = vnode.dom as HTMLElement
						},
					},
					this.renderMailBodySection(vnode.attrs),
				),
				this.renderQuoteExpanderButton(),
			]),
		]
	}

	private renderMailSubject(attrs: MailViewerAttrs) {
		return m("h4.font-weight-600.mt.mb.text-break.selectable." + responsiveCardHMargin(), attrs.viewModel.getSubject())
	}

	/**
	 * important: must be called after rendering the mail body part so that {@link quoteState} is set correctly.
	 * The logic here relies on the fact that lifecycle methods will be called after body section lifecycle methods.
	 */
	private renderQuoteExpanderButton() {
		const buttonHeight = 24
		return m(
			".abs.flex.justify-center.full-width",
			{
				style: {
					// +1 for the border
					bottom: px(-(buttonHeight / 2 + 1)),
					display: "hidden",
				},
				oncreate: ({ dom }) => {
					;(dom as HTMLElement).style.display = this.quoteState === "noquotes" ? "none" : ""
				},
				onupdate: ({ dom }) => {
					;(dom as HTMLElement).style.display = this.quoteState === "noquotes" ? "none" : ""
				},
			},
			m(
				// needs flex for correct height
				".flex",
				{
					style: {
						borderRadius: "25%",
						border: `1px solid ${theme.list_border}`,
						backgroundColor: theme.content_bg,
					},
				},
				m(ToggleButton, {
					icon: Icons.More,
					title: "showText_action",
					toggled: this.shouldDisplayCollapsedQuotes(),
					onToggled: () => {
						this.quoteState = this.shouldDisplayCollapsedQuotes() ? "collapsed" : "expanded"
						this.shadowDomRoot && this.updateCollapsedQuotes(this.shadowDomRoot, this.shouldDisplayCollapsedQuotes())
					},
					style: {
						height: "24px",
						width: px(size.button_height_compact),
					},
				}),
			),
		)
	}

	private handleContentBlockingOnRender() {
		if (this.lastContentBlockingStatus != null && this.viewModel.getContentBlockingStatus() != this.lastContentBlockingStatus) {
			Promise.resolve().then(async () => {
				// Wait for new mail body to be rendered before replacing images. Probably not necessary anymore as we already schedule it after the render
				// but better be safe.
				m.redraw.sync()
				await this.replaceInlineImages()
			})
		}
		this.lastContentBlockingStatus = this.viewModel.getContentBlockingStatus()
	}

	private renderMailHeader(attrs: MailViewerAttrs) {
		return m(MailViewerHeader, {
			viewModel: this.viewModel,
			createMailAddressContextButtons: this.createMailAddressContextButtons.bind(this),
			isPrimary: attrs.isPrimary,
			importFile: (file: TutanotaFile) => this.handleAttachmentImport(file),
		})
	}

	onbeforeupdate(vnode: Vnode<MailViewerAttrs>): boolean | void {
		// Setting viewModel here to have viewModel that we will use for render already and be able to make a decision
		// about skipping rendering
		this.setViewModel(vnode.attrs.viewModel, vnode.attrs.isPrimary)
		// We skip rendering progress indicator when switching between emails.
		// However if we already loaded the mail then we can just render it.
		const shouldSkipRender = this.viewModel.isLoading() && this.delayProgressSpinner
		return !shouldSkipRender
	}

	private renderMailBodySection(attrs: MailViewerAttrs): Children {
		if (this.viewModel.didErrorsOccur()) {
			return m(IconMessageBox, {
				message: "corrupted_msg",
				icon: Icons.Warning,
				color: theme.content_message_bg,
			})
		}

		const sanitizedMailBody = this.viewModel.getSanitizedMailBody()

		// Do not render progress spinner or mail body while we are animating.
		if (this.viewModel.shouldDelayRendering()) {
			return null
		} else if (sanitizedMailBody != null) {
			return this.renderMailBody(sanitizedMailBody, attrs)
		} else if (this.viewModel.isLoading()) {
			return this.renderLoadingIcon()
		} else {
			// The body failed to load, just show blank body because there is a banner
			return null
		}
	}

	private renderMailBody(sanitizedMailBody: DocumentFragment, attrs: MailViewerAttrs): Children {
		return m("#mail-body", {
			// key to avoid mithril reusing the dom element when it should switch the rendering the loading spinner
			key: "mailBody",
			oncreate: (vnode) => {
				const dom = vnode.dom as HTMLElement
				this.setDomBody(dom)
				this.updateLineHeight(dom)
				this.renderShadowMailBody(sanitizedMailBody, attrs, vnode.dom as HTMLElement)
				if (client.isMobileDevice()) {
					this.resizeObserverViewport?.disconnect()
					this.resizeObserverViewport = new ResizeObserver((entries) => {
						if (this.pinchZoomable) {
							// recreate if the orientation of the device changes -> size of the viewport / mail-body changes
							this.createPinchZoom(this.pinchZoomable.getZoomable(), vnode.dom as HTMLElement)
						}
					})
					this.resizeObserverViewport.observe(vnode.dom as HTMLElement)
				}
			},
			onupdate: (vnode) => {
				const dom = vnode.dom as HTMLElement
				this.setDomBody(dom)

				// Only measure and update line height once.
				// BUT we need to do in from onupdate too if we swap mailViewer but mithril does not realize
				// that it's a different vnode so oncreate might not be called.
				if (!this.bodyLineHeight) {
					this.updateLineHeight(vnode.dom as HTMLElement)
				}

				if (this.currentlyRenderedMailBody !== sanitizedMailBody) this.renderShadowMailBody(sanitizedMailBody, attrs, vnode.dom as HTMLElement)
				// If the quote behavior changes (e.g. after loading is finished) we should update the quotes.
				// If we already rendered it correctly it will already be set in renderShadowMailBody() so we will avoid doing it twice.
				if (this.currentQuoteBehavior !== attrs.defaultQuoteBehavior) {
					this.updateCollapsedQuotes(assertNotNull(this.shadowDomRoot), attrs.defaultQuoteBehavior === "expand")
				}
				this.currentQuoteBehavior = attrs.defaultQuoteBehavior

				if (client.isMobileDevice() && !this.pinchZoomable && this.shadowDomMailContent) {
					this.createPinchZoom(this.shadowDomMailContent, vnode.dom as HTMLElement)
				}
			},
			onbeforeremove: () => {
				// Clear dom body in case there will be a new one, we want promise to be up-to-date
				this.clearDomBody()
			},
			onsubmit: (event: Event) => {
				// use the default confirm dialog here because the submit can not be done async
				if (!confirm(lang.get("reallySubmitContent_msg"))) {
					event.preventDefault()
				}
			},
			style: {
				"line-height": this.bodyLineHeight ? this.bodyLineHeight.toString() : size.line_height,
				"transform-origin": "top left",
			},
		})
	}

	private createPinchZoom(zoomable: HTMLElement, viewport: HTMLElement) {
		// the PinchZoom class does not allow a changing zoomable rect size (mail body content). When we show previously unloaded images the size
		// of the mail body changes. So we have to create a new PinchZoom object
		this.pinchZoomable?.remove()

		this.pinchZoomable = new PinchZoom(zoomable, viewport, true, (e, target) => {
			this.handleAnchorClick(e, target, true)
		})
	}

	private updateCollapsedQuotes(dom: ParentNode, showQuote: boolean) {
		const quotes: NodeListOf<HTMLElement> = dom.querySelectorAll("[tuta-collapsed-quote]")
		for (const quoteWrap of Array.from(quotes)) {
			const quote = quoteWrap.children[0] as HTMLElement
			quote.style.display = showQuote ? "" : "none"
			const quoteIndicator = quoteWrap.children[1] as HTMLElement
			quoteIndicator.style.display = showQuote ? "none" : ""
		}

		if (this.pinchZoomable) {
			this.createPinchZoom(this.pinchZoomable.getZoomable(), this.pinchZoomable.getViewport())
		}
	}

	private shouldDisplayCollapsedQuotes(): boolean {
		// if the user didn't do anything yet take the behavior passed from the outside, otherwise whatever user has selected
		return this.quoteState === "unset" ? this.currentQuoteBehavior === "expand" : this.quoteState === "expanded"
	}

	/**
	 * manually wrap and style a mail body to display correctly inside a shadow root
	 * @param sanitizedMailBody the mail body to display
	 * @param attrs
	 * @param parent the parent element that contains the shadowMailBody
	 * @private
	 */
	private renderShadowMailBody(sanitizedMailBody: DocumentFragment, attrs: MailViewerAttrs, parent: HTMLElement) {
		this.currentQuoteBehavior = attrs.defaultQuoteBehavior
		assertNonNull(this.shadowDomRoot, "shadow dom root is null!")
		while (this.shadowDomRoot.firstChild) {
			this.shadowDomRoot.firstChild.remove()
		}
		const wrapNode = document.createElement("div")
		wrapNode.className = "drag selectable touch-callout break-word-links" + (client.isMobileDevice() ? " break-pre" : "")
		wrapNode.style.lineHeight = String(this.bodyLineHeight ? this.bodyLineHeight.toString() : size.line_height)
		wrapNode.style.transformOrigin = "0px 0px"
		wrapNode.appendChild(sanitizedMailBody.cloneNode(true))
		this.shadowDomMailContent = wrapNode

		// query all top level block quotes
		const quoteElements = Array.from(wrapNode.querySelectorAll("blockquote:not(blockquote blockquote)")) as HTMLElement[]
		if (quoteElements.length === 0) {
			this.quoteState = "noquotes"
		}
		for (const quote of quoteElements) {
			this.createCollapsedBlockQuote(quote, this.shouldDisplayCollapsedQuotes())
		}

		this.shadowDomRoot.appendChild(styles.getStyleSheetElement("main"))
		this.shadowDomRoot.appendChild(wrapNode)

		if (client.isMobileDevice()) {
			this.pinchZoomable = null
			this.resizeObserverZoomable?.disconnect()
			this.resizeObserverZoomable = new ResizeObserver((entries) => {
				this.createPinchZoom(wrapNode, parent) // recreate for example if images are loaded slowly
			})
			this.resizeObserverZoomable.observe(wrapNode)
		} else {
			wrapNode.addEventListener("click", (event) => {
				this.handleAnchorClick(event, event.target, false)
			})
		}
		this.currentlyRenderedMailBody = sanitizedMailBody
	}

	private createCollapsedBlockQuote(quote: HTMLElement, expanded: boolean) {
		const quoteWrap = document.createElement("div")
		// used to query quotes later
		quoteWrap.setAttribute("tuta-collapsed-quote", "true")

		quote.replaceWith(quoteWrap)
		quote.style.display = expanded ? "" : "none"

		const quoteIndicator = document.createElement("div")
		quoteIndicator.classList.add("flex")
		quoteIndicator.style.borderLeft = `2px solid ${theme.content_border}`
		quoteIndicator.style.display = expanded ? "none" : ""

		m.render(
			quoteIndicator,
			m(Icon, {
				icon: Icons.More,
				class: "icon-xl mlr",
				container: "div",
				style: {
					fill: theme.navigation_menu_icon,
				},
			}),
		)

		quoteWrap.appendChild(quote)
		quoteWrap.appendChild(quoteIndicator)
	}

	private clearDomBody() {
		this.domBodyDeferred = defer()
		this.domBody = null
		this.shadowDomRoot = null
	}

	private setDomBody(dom: HTMLElement) {
		if (dom !== this.domBody || this.shadowDomRoot == null) {
			// If the dom element hasn't been created anew in onupdate
			// then trying to create a new shadow root on the same node will cause an error
			this.shadowDomRoot = dom.attachShadow({ mode: "open" })

			// Allow forms inside of mail bodies to be filled out without resulting in keystrokes being interpreted as shortcuts
			this.shadowDomRoot.getRootNode().addEventListener("keydown", (event: Event) => {
				const { target } = event
				if (this.eventTargetWithKeyboardInput(target)) {
					event.stopPropagation()
				}
			})
		}

		this.domBodyDeferred.resolve(dom)
		this.domBody = dom
	}

	private renderLoadingIcon(): Children {
		return m(
			".progress-panel.flex-v-center.items-center",
			{
				key: "loadingIcon",
				style: {
					height: "200px",
				},
			},
			[progressIcon(), m("small", lang.get("loading_msg"))],
		)
	}

	async replaceInlineImages() {
		const loadedInlineImages = await this.viewModel.getLoadedInlineImages()
		const domBody = await this.domBodyDeferred.promise
		replaceCidsWithInlineImages(domBody, loadedInlineImages, (cid, event) => {
			const inlineAttachment = this.viewModel.getAttachments().find((attachment) => attachment.cid === cid)
			if (inlineAttachment && (!client.isMobileDevice() || !this.pinchZoomable || !this.pinchZoomable.isDraggingOrZooming())) {
				const coords = getCoordsOfMouseOrTouchEvent(event)
				showDropdownAtPosition(
					[
						{
							label: "download_action",
							click: () => this.viewModel.downloadAndOpenAttachment(inlineAttachment, false),
						},
						{
							label: "open_action",
							click: () => this.viewModel.downloadAndOpenAttachment(inlineAttachment, true),
						},
					],
					coords.x,
					coords.y,
				)
			}
		})
	}

	private setupShortcuts(attrs: MailViewerAttrs): Array<Shortcut> {
		const userController = locator.logins.getUserController()
		const shortcuts: Shortcut[] = [
			{
				key: Keys.E,
				enabled: () => this.viewModel.isDraftMail(),
				exec: () => {
					editDraft(this.viewModel)
				},
				help: "editMail_action",
			},
			{
				key: Keys.H,
				enabled: () => !this.viewModel.isDraftMail(),
				exec: () => {
					showHeaderDialog(this.viewModel.getHeaders())
				},
				help: "showHeaders_action",
			},
			{
				key: Keys.I,
				enabled: () => !this.viewModel.isDraftMail(),
				exec: () => {
					showSourceDialog(this.viewModel.getMailBody())
				},
				help: "showSource_action",
			},
			{
				key: Keys.R,
				exec: () => {
					this.viewModel.reply(false)
				},
				enabled: () => !this.viewModel.isDraftMail(),
				help: "reply_action",
			},
			{
				key: Keys.R,
				shift: true,
				exec: () => {
					this.viewModel.reply(true)
				},
				enabled: () => !this.viewModel.isDraftMail(),
				help: "replyAll_action",
			},
		]

		if (userController.isInternalUser()) {
			shortcuts.push({
				key: Keys.F,
				shift: true,
				enabled: () => !this.viewModel.isDraftMail(),
				exec: () => {
					this.viewModel.forward().catch(ofClass(UserError, showUserError))
				},
				help: "forward_action",
			})
		}

		return shortcuts
	}

	private updateLineHeight(dom: HTMLElement) {
		const width = dom.offsetWidth

		if (width > 900) {
			this.bodyLineHeight = size.line_height_l
		} else if (width > 600) {
			this.bodyLineHeight = size.line_height_m
		} else {
			this.bodyLineHeight = size.line_height
		}

		dom.style.lineHeight = String(this.bodyLineHeight)
	}

	private async createMailAddressContextButtons(args: {
		mailAddress: MailAddressAndName
		defaultInboxRuleField: InboxRuleType | null
		createContact?: boolean
	}): Promise<Array<DropdownButtonAttrs>> {
		const { mailAddress, defaultInboxRuleField, createContact = true } = args

		const buttons = [] as Array<DropdownButtonAttrs>

		buttons.push({
			label: "copy_action",
			click: () => copyToClipboard(mailAddress.address),
		})

		if (locator.logins.getUserController().isInternalUser()) {
			//searching for contacts will never resolve if the user has not logged in online
			if (createContact && !locator.logins.isEnabled(FeatureType.DisableContacts) && locator.logins.isFullyLoggedIn()) {
				const contact = await this.viewModel.contactModel.searchForContact(mailAddress.address)
				if (contact) {
					buttons.push({
						label: "showContact_action",
						click: () => {
							const [listId, contactId] = assertNotNull(contact)._id
							m.route.set("/contact/:listId/:contactId", { listId, contactId, focusItem: true })
						},
					})
				} else {
					buttons.push({
						label: "createContact_action",
						click: () => {
							this.viewModel.contactModel.getContactListId().then((contactListId) => {
								import("../../contacts/ContactEditor").then(({ ContactEditor }) => {
									const contact = createNewContact(locator.logins.getUserController().user, mailAddress.address, mailAddress.name)
									new ContactEditor(this.viewModel.entityClient, contact, assertNotNull(contactListId)).show()
								})
							})
						},
					})
				}
			}

			if (defaultInboxRuleField && !locator.logins.isEnabled(FeatureType.InternalCommunication)) {
				const rule = getExistingRuleForType(locator.logins.getUserController().props, mailAddress.address.trim().toLowerCase(), defaultInboxRuleField)
				buttons.push({
					label: rule ? "editInboxRule_action" : "addInboxRule_action",
					click: async () => {
						const mailboxDetails = await this.viewModel.mailModel.getMailboxDetailsForMail(this.viewModel.mail)
						if (mailboxDetails == null) {
							return
						}
						const { show, createInboxRuleTemplate } = await import("../../settings/AddInboxRuleDialog")
						const newRule = rule ?? createInboxRuleTemplate(defaultInboxRuleField, mailAddress.address.trim().toLowerCase())

						show(mailboxDetails, newRule)
					},
				})
			}

			if (this.viewModel.canCreateSpamRule()) {
				buttons.push({
					label: "addSpamRule_action",
					click: () => this.addSpamRule(defaultInboxRuleField, mailAddress.address),
				})
			}
		}

		return buttons
	}

	private addSpamRule(defaultInboxRuleField: InboxRuleType | null, address: string) {
		const folder = this.viewModel.mailModel.getMailFolderForMail(this.viewModel.mail)

		const spamRuleType = folder && folder.folderType === MailSetKind.SPAM ? SpamRuleType.WHITELIST : SpamRuleType.BLACKLIST

		let spamRuleField: SpamRuleFieldType
		switch (defaultInboxRuleField) {
			case InboxRuleType.RECIPIENT_TO_EQUALS:
				spamRuleField = SpamRuleFieldType.TO
				break

			case InboxRuleType.RECIPIENT_CC_EQUALS:
				spamRuleField = SpamRuleFieldType.CC
				break

			case InboxRuleType.RECIPIENT_BCC_EQUALS:
				spamRuleField = SpamRuleFieldType.BCC
				break

			default:
				spamRuleField = SpamRuleFieldType.FROM
				break
		}

		import("../../settings/AddSpamRuleDialog").then(async ({ showAddSpamRuleDialog }) => {
			const value = address.trim().toLowerCase()
			showAddSpamRuleDialog(
				createEmailSenderListElement({
					value,
					type: spamRuleType,
					field: spamRuleField,
					hashedValue: await locator.worker.getWorkerInterface().cryptoFacade.sha256(value),
				}),
			)
		})
	}

	private handleAnchorClick(event: Event, eventTarget: EventTarget | null, shouldDispatchSyntheticClick: boolean): void {
		const href = (eventTarget as Element | null)?.closest("a")?.getAttribute("href") ?? null
		if (href) {
			if (href.startsWith("mailto:")) {
				event.preventDefault()

				if (isNewMailActionAvailable()) {
					// disable new mails for external users.
					import("../editor/MailEditor").then(({ newMailtoUrlMailEditor }) => {
						newMailtoUrlMailEditor(href, !locator.logins.getUserController().props.defaultUnconfidential)
							.then((editor) => editor.show())
							.catch(ofClass(CancelledError, noOp))
					})
				}
			} else if (isSettingsLink(href, this.viewModel.mail)) {
				// Navigate to the settings menu if they are linked within an email.
				const newRoute = href.substring(href.indexOf("/settings/"))
				m.route.set(newRoute)
				event.preventDefault()
			} else if (shouldDispatchSyntheticClick) {
				const syntheticTag = document.createElement("a")
				syntheticTag.setAttribute("href", href)
				syntheticTag.setAttribute("target", "_blank")
				syntheticTag.setAttribute("rel", "noopener noreferrer")
				const newClickEvent = new MouseEvent("click")
				syntheticTag.dispatchEvent(newClickEvent)
			}
		}
	}

	/**
	 * returns true if the passed in target is an HTMLElement that can receive some sort of keyboard input
	 */
	private eventTargetWithKeyboardInput(target: EventTarget | null): boolean {
		if (target && target instanceof HTMLElement) {
			return target.matches(
				'input[type="text"], input[type="date"], input[type="datetime-local"], input[type="email"], input[type="month"], input[type="number"],' +
					'input[type="password"], input[type="search"], input[type="tel"], input[type="time"], input[type="url"], input[type="week"], input[type="datetime"], textarea',
			)
		}
		return false
	}

	private async handleAttachmentImport(file: TutanotaFile) {
		try {
			await this.viewModel.importAttachment(file)
		} catch (e) {
			console.log(e)
			if (e instanceof UserError) {
				return await Dialog.message(() => e.message)
			}

			await Dialog.message("unknownError_msg")
		}
	}
}

export type CreateMailViewerOptions = {
	mail: Mail
	showFolder: boolean
	delayBodyRenderingUntil?: Promise<void>
}

/**
 * support and invoice mails can contain links to the settings page.
 * we don't want normal mails to be able to link places in the app, though.
 * */
function isSettingsLink(href: string, mail: Mail): boolean {
	return (href.startsWith("/settings/") ?? false) && isTutanotaTeamMail(mail)
}
