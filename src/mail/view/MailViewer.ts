import { px, size } from "../../gui/size"
import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import { windowFacade, windowSizeListener } from "../../misc/WindowFacade"
import { FeatureType, InboxRuleType, Keys, MailFolderType, SpamRuleFieldType, SpamRuleType } from "../../api/common/TutanotaConstants"
import type { Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { lang } from "../../misc/LanguageViewModel"
import { assertMainOrNode } from "../../api/common/Env"
import { assertNonNull, assertNotNull, defer, DeferredObject, neverNull, noOp, ofClass } from "@tutao/tutanota-utils"
import { createNewContact, getExistingRuleForType, isTutanotaTeamMail } from "../model/MailUtils"
import { IconMessageBox } from "../../gui/base/ColumnEmptyMessageBox"
import type { Shortcut } from "../../misc/KeyManager"
import { keyManager } from "../../misc/KeyManager"
import { Icon, progressIcon } from "../../gui/base/Icon"
import { Icons } from "../../gui/base/icons/Icons"
import { theme } from "../../gui/theme"
import { client } from "../../misc/ClientDetector"
import { styles } from "../../gui/styles"
import { DropdownButtonAttrs, showDropdownAtPosition } from "../../gui/base/Dropdown.js"
import type { InlineImageReference } from "./MailGuiUtils"
import { replaceCidsWithInlineImages } from "./MailGuiUtils"
import { getCoordsOfMouseOrTouchEvent } from "../../gui/base/GuiUtils"
import { copyToClipboard } from "../../misc/ClipboardUtils"
import { ContentBlockingStatus, MailViewerViewModel } from "./MailViewerViewModel"
import { getListId } from "../../api/common/utils/EntityUtils"
import { createEmailSenderListElement } from "../../api/entities/sys/TypeRefs.js"
import { UserError } from "../../api/main/UserError"
import { showUserError } from "../../misc/ErrorHandlerImpl"
import { isNewMailActionAvailable } from "../../gui/nav/NavFunctions"
import { CancelledError } from "../../api/common/error/CancelledError"
import { MailViewerHeader } from "./MailViewerHeader.js"
import { editDraft, showHeaderDialog } from "./MailViewerUtils.js"
import { ToggleButton } from "../../gui/base/buttons/ToggleButton.js"
import { locator } from "../../api/main/MainLocator.js"
import { responsiveCardHMargin, responsiveCardHPadding } from "../../gui/cards.js"

assertMainOrNode()
// map of inline image cid to InlineImageReference
export type InlineImages = Map<string, InlineImageReference>

const DOUBLE_TAP_TIME_MS = 350

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

	private lastBodyTouchEndTime = 0
	private lastTouchStart = {
		x: 0,
		y: 0,
		time: Date.now(),
	}

	/**
	 * Delay the display of the progress spinner in main body view for a short time to suppress it when we are switching between cached emails
	 * and we are just sanitizing
	 */
	private delayProgressSpinner = true

	private readonly resizeListener: windowSizeListener

	private viewModel!: MailViewerViewModel

	private readonly shortcuts: Array<Shortcut>

	private scrollDom: HTMLElement | null = null

	private domBodyDeferred: DeferredObject<HTMLElement> = defer()
	private domBody: HTMLElement | null = null

	private shadowDomRoot: ShadowRoot | null = null
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
					toggledTitle: "hideText_action",
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
				this.rescale(false)
				this.renderShadowMailBody(sanitizedMailBody, attrs)
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

				this.rescale(false)

				if (this.currentlyRenderedMailBody !== sanitizedMailBody) this.renderShadowMailBody(sanitizedMailBody, attrs)
				// If the quote behavior changes (e.g. after loading is finished) we should update the quotes.
				// If we already rendered it correctly it will already be set in renderShadowMailBody() so we will avoid doing it twice.
				if (this.currentQuoteBehavior !== attrs.defaultQuoteBehavior) {
					this.updateCollapsedQuotes(assertNotNull(this.shadowDomRoot), attrs.defaultQuoteBehavior === "expand")
				}
				this.currentQuoteBehavior = attrs.defaultQuoteBehavior
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

	private updateCollapsedQuotes(dom: ParentNode, showQuote: boolean) {
		const quotes: NodeListOf<HTMLElement> = dom.querySelectorAll("[tuta-collapsed-quote]")
		for (const quoteWrap of Array.from(quotes)) {
			const quote = quoteWrap.children[0] as HTMLElement
			quote.style.display = showQuote ? "" : "none"
			const quoteIndicator = quoteWrap.children[1] as HTMLElement
			quoteIndicator.style.display = showQuote ? "none" : ""
		}
	}

	private shouldDisplayCollapsedQuotes(): boolean {
		// if the user didn't do anything yet take the behavior passed from the outside, otherwise whatever user has selected
		return this.quoteState === "unset" ? this.currentQuoteBehavior === "expand" : this.quoteState === "expanded"
	}

	/**
	 * manually wrap and style a mail body to display correctly inside a shadow root
	 * @param sanitizedMailBody the mail body to display
	 * @private
	 */
	private renderShadowMailBody(sanitizedMailBody: DocumentFragment, attrs: MailViewerAttrs) {
		this.currentQuoteBehavior = attrs.defaultQuoteBehavior
		assertNonNull(this.shadowDomRoot, "shadow dom root is null!")
		while (this.shadowDomRoot.firstChild) {
			this.shadowDomRoot.firstChild.remove()
		}
		const wrapNode = document.createElement("div")
		wrapNode.className = "selectable touch-callout break-word-links" + (client.isMobileDevice() ? " break-pre" : "")
		wrapNode.style.lineHeight = String(this.bodyLineHeight ? this.bodyLineHeight.toString() : size.line_height)
		wrapNode.style.transformOrigin = "top left"
		wrapNode.appendChild(sanitizedMailBody.cloneNode(true))

		// query all top level block quotes
		const quoteElements = Array.from(wrapNode.querySelectorAll("blockquote:not(blockquote blockquote)")) as HTMLElement[]
		if (quoteElements.length === 0) {
			this.quoteState = "noquotes"
		}
		for (const quote of quoteElements) {
			this.createCollapsedBlockQuote(quote, this.shouldDisplayCollapsedQuotes())
		}

		if (client.isMobileDevice()) {
			wrapNode.addEventListener("touchstart", (event) => {
				const touch = event.touches[0]
				this.lastTouchStart.x = touch.clientX
				this.lastTouchStart.y = touch.clientY
				this.lastTouchStart.time = Date.now()
			})
			wrapNode.addEventListener("touchend", (event) => {
				const href = (event.target as Element | null)?.closest("a")?.getAttribute("href") ?? null
				this.handleDoubleTap(
					event,
					(e) => this.handleAnchorClick(e, href, true),
					() => this.rescale(true),
				)
			})
		} else {
			wrapNode.addEventListener("click", (event) => {
				const href = (event.target as Element | null)?.closest("a")?.getAttribute("href") ?? null
				this.handleAnchorClick(event, href, false)
			})
		}
		this.shadowDomRoot.appendChild(styles.getStyleSheetElement("main"))
		this.shadowDomRoot.appendChild(wrapNode)
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

			if (inlineAttachment) {
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

	private rescale(animate: boolean) {
		const child = this.domBody
		if (!client.isMobileDevice() || !child) {
			return
		}
		const containerWidth = child.offsetWidth

		if (!this.isScaling || containerWidth > child.scrollWidth) {
			child.style.transform = ""
			child.style.marginBottom = ""
		} else {
			const width = child.scrollWidth
			const scale = containerWidth / width
			const heightDiff = child.scrollHeight - child.scrollHeight * scale
			child.style.transform = `scale(${scale})`
			child.style.marginBottom = `${-heightDiff}px`
		}

		child.style.transition = animate ? "transform 200ms ease-in-out" : ""
		// ios 15 bug: transformOrigin magically disappears so we ensure that it's always set
		child.style.transformOrigin = "top left"
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
							m.route.set("/contact/:listId/:contactId", { listId, contactId })
						},
					})
				} else {
					buttons.push({
						label: "createContact_action",
						click: () => {
							this.viewModel.contactModel.getContactListId().then((contactListId) => {
								import("../../contacts/ContactEditor").then(({ ContactEditor }) => {
									const contact = createNewContact(locator.logins.getUserController().user, mailAddress.address, mailAddress.name)
									new ContactEditor(this.viewModel.entityClient, contact, contactListId ?? undefined).show()
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

	private handleDoubleTap(e: TouchEvent, singleClickAction: (e: TouchEvent) => void, doubleClickAction: (e: TouchEvent) => void) {
		const lastClick = this.lastBodyTouchEndTime
		const now = Date.now()
		const touch = e.changedTouches[0]

		// If there are no touches or it's not cancellable event (e.g. scroll) or more than certain time has passed or finger moved too
		// much then do nothing
		if (
			!touch ||
			!e.cancelable ||
			Date.now() - this.lastTouchStart.time > DOUBLE_TAP_TIME_MS ||
			touch.clientX - this.lastTouchStart.x > 40 ||
			touch.clientY - this.lastTouchStart.y > 40
		) {
			return
		}

		e.preventDefault()

		if (now - lastClick < DOUBLE_TAP_TIME_MS) {
			this.isScaling = !this.isScaling
			this.lastBodyTouchEndTime = 0
			doubleClickAction(e)
		} else {
			setTimeout(() => {
				if (this.lastBodyTouchEndTime === now) {
					singleClickAction(e)
				}
			}, DOUBLE_TAP_TIME_MS)
		}

		this.lastBodyTouchEndTime = now
	}

	private addSpamRule(defaultInboxRuleField: InboxRuleType | null, address: string) {
		const folder = this.viewModel.mailModel.getMailFolder(getListId(this.viewModel.mail))

		const spamRuleType = folder && folder.folderType === MailFolderType.SPAM ? SpamRuleType.WHITELIST : SpamRuleType.BLACKLIST

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

		import("../../settings/AddSpamRuleDialog").then(({ showAddSpamRuleDialog }) => {
			showAddSpamRuleDialog(
				createEmailSenderListElement({
					value: address.trim().toLowerCase(),
					type: spamRuleType,
					field: spamRuleField,
				}),
			)
		})
	}

	private handleAnchorClick(event: Event, href: string | null, shouldDispatchSyntheticClick: boolean): void {
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
