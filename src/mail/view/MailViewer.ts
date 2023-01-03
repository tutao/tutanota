import { size } from "../../gui/size"
import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import { windowFacade, windowSizeListener } from "../../misc/WindowFacade"
import { FeatureType, InboxRuleType, Keys, MailFolderType, SpamRuleFieldType, SpamRuleType } from "../../api/common/TutanotaConstants"
import type { Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { lang } from "../../misc/LanguageViewModel"
import { assertMainOrNode, isDesktop } from "../../api/common/Env"
import { assertNonNull, defer, DeferredObject, neverNull, noOp, ofClass } from "@tutao/tutanota-utils"
import { createNewContact, getExistingRuleForType, isTutanotaTeamMail } from "../model/MailUtils"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox"
import type { Shortcut } from "../../misc/KeyManager"
import { keyManager } from "../../misc/KeyManager"
import { logins } from "../../api/main/LoginController"
import { progressIcon } from "../../gui/base/Icon"
import { Icons } from "../../gui/base/icons/Icons"
import { theme } from "../../gui/theme"
import { client } from "../../misc/ClientDetector"
import { styles } from "../../gui/styles"
import { DropdownButtonAttrs, showDropdownAtPosition } from "../../gui/base/Dropdown.js"
import { navButtonRoutes } from "../../misc/RouteChange"
import type { InlineImageReference } from "./MailGuiUtils"
import { replaceCidsWithInlineImages } from "./MailGuiUtils"
import { locator } from "../../api/main/MainLocator"
import { getCoordsOfMouseOrTouchEvent } from "../../gui/base/GuiUtils"
import { copyToClipboard } from "../../misc/ClipboardUtils"
import { ContentBlockingStatus, MailViewerViewModel } from "./MailViewerViewModel"
import { getListId } from "../../api/common/utils/EntityUtils"
import { createEmailSenderListElement } from "../../api/entities/sys/TypeRefs.js"
import { UserError } from "../../api/main/UserError"
import { showUserError } from "../../misc/ErrorHandlerImpl"
import { animations, DomMutation, scroll } from "../../gui/animation/Animations"
import { ease } from "../../gui/animation/Easing"
import { isNewMailActionAvailable } from "../../gui/nav/NavFunctions"
import { CancelledError } from "../../api/common/error/CancelledError"
import { MailViewerHeader } from "./MailViewerHeader.js"
import { editDraft, showHeaderDialog } from "./MailViewerUtils.js"

assertMainOrNode()
// map of inline image cid to InlineImageReference
export type InlineImages = Map<string, InlineImageReference>

const SCROLL_FACTOR = 4 / 5
const DOUBLE_TAP_TIME_MS = 350

type MailAddressAndName = {
	name: string
	address: string
}

export type MailViewerAttrs = {
	viewModel: MailViewerViewModel
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

	private scrollAnimation: Promise<void> | null = null
	private scrollDom: HTMLElement | null = null

	private domBodyDeferred: DeferredObject<HTMLElement> = defer()
	private domBody: HTMLElement | null = null

	private shadowDomRoot: ShadowRoot | null = null
	private currentlyRenderedMailBody: DocumentFragment | null = null
	private lastContentBlockingStatus: ContentBlockingStatus | null = null

	private loadAllListener = stream()

	constructor(vnode: Vnode<MailViewerAttrs>) {
		this.setViewModel(vnode.attrs.viewModel)

		this.resizeListener = () => this.domBodyDeferred.promise.then((dom) => this.updateLineHeight(dom))

		this.shortcuts = this.setupShortcuts(vnode.attrs)
	}

	oncreate() {
		keyManager.registerShortcuts(this.shortcuts)
		windowFacade.addResizeListener(this.resizeListener)
	}

	onremove() {
		windowFacade.removeResizeListener(this.resizeListener)
		this.clearDomBody()
		keyManager.unregisterShortcuts(this.shortcuts)
	}

	private setViewModel(viewModel: MailViewerViewModel) {
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
			this.viewModel.loadAll()

			this.delayProgressSpinner = true
			setTimeout(() => {
				this.delayProgressSpinner = false
				m.redraw()
			}, 50)
		}
	}

	view(vnode: Vnode<MailViewerAttrs>): Children {
		this.handleContentBlockingOnRender()

		const scrollingHeader = styles.isSingleColumnLayout()
		return [
			m("#mail-viewer.fill-absolute" + (scrollingHeader ? ".scroll-no-overlay.overflow-x-hidden" : ".flex.flex-column"), [
				this.renderMailHeader(),
				m(
					".flex-grow.mlr-safe-inset.scroll-x.plr-l.pb-floating.pt" +
						(scrollingHeader ? "" : ".scroll-no-overlay") +
						(this.viewModel.isContrastFixNeeded() ? ".bg-white.content-black" : " "),
					{
						oncreate: (vnode) => {
							this.scrollDom = vnode.dom as HTMLElement
						},
					},
					this.renderMailBodySection(),
				),
			]),
		]
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

	private renderMailHeader() {
		return m(MailViewerHeader, {
			viewModel: this.viewModel,
			createMailAddressContextButtons: this.createMailAddressContextButtons.bind(this),
		})
	}

	onbeforeupdate(vnode: Vnode<MailViewerAttrs>): boolean | void {
		// Setting viewModel here to have viewModel that we will use for render already and be able to make a decision
		// about skipping rendering
		this.setViewModel(vnode.attrs.viewModel)
		// We skip rendering progress indicator when switching between emails.
		// However if we already loaded the mail then we can just render it.
		const shouldSkipRender = this.viewModel.isLoading() && this.delayProgressSpinner
		return !shouldSkipRender
	}

	private renderMailBodySection(): Children {
		if (this.viewModel.didErrorsOccur()) {
			return m(ColumnEmptyMessageBox, {
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
			return this.renderMailBody(sanitizedMailBody)
		} else if (this.viewModel.isLoading()) {
			return this.renderLoadingIcon()
		} else {
			// The body failed to load, just show blank body because there is a banner
			return null
		}
	}

	private renderMailBody(sanitizedMailBody: DocumentFragment): Children {
		return m("#mail-body", {
			// key to avoid mithril reusing the dom element when it should switch the rendering the loading spinner
			key: "mailBody",
			oncreate: (vnode) => {
				const dom = vnode.dom as HTMLElement
				this.setDomBody(dom)
				this.updateLineHeight(dom)
				this.rescale(false)
				this.renderShadowMailBody(sanitizedMailBody)
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
				if (this.currentlyRenderedMailBody !== sanitizedMailBody) this.renderShadowMailBody(sanitizedMailBody)
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

	/**
	 * manually wrap and style a mail body to display correctly inside a shadow root
	 * @param sanitizedMailBody the mail body to display
	 * @private
	 */
	private renderShadowMailBody(sanitizedMailBody: DocumentFragment) {
		assertNonNull(this.shadowDomRoot, "shadow dom root is null!")
		while (this.shadowDomRoot.firstChild) {
			this.shadowDomRoot.firstChild.remove()
		}
		const wrapNode = document.createElement("div")
		wrapNode.className = "selectable touch-callout break-word-links" + (client.isMobileDevice() ? " break-pre" : "")
		wrapNode.style.lineHeight = String(this.bodyLineHeight ? this.bodyLineHeight.toString() : size.line_height)
		wrapNode.style.transformOrigin = "top left"
		wrapNode.appendChild(sanitizedMailBody.cloneNode(true))
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
			this.shadowDomRoot.getRootNode().addEventListener("keydown", (event: Event) => event.stopPropagation())
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
		const userController = logins.getUserController()
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
			{
				key: Keys.PAGE_UP,
				exec: () => this.scrollUp(),
				help: "scrollUp_action",
			},
			{
				key: Keys.PAGE_DOWN,
				exec: () => this.scrollDown(),
				help: "scrollDown_action",
			},
			{
				key: Keys.HOME,
				exec: () => this.scrollToTop(),
				help: "scrollToTop_action",
			},
			{
				key: Keys.END,
				exec: () => this.scrollToBottom(),
				help: "scrollToBottom_action",
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

		if (logins.getUserController().isInternalUser()) {
			//searching for contacts will never resolve if the user has not logged in online
			if (createContact && !logins.isEnabled(FeatureType.DisableContacts) && logins.isFullyLoggedIn()) {
				const contact = await this.viewModel.contactModel.searchForContact(mailAddress.address)
				if (contact) {
					buttons.push({
						label: "showContact_action",
						click: () => {
							navButtonRoutes.contactsUrl = `/contact/${neverNull(contact)._id[0]}/${neverNull(contact)._id[1]}`
							m.route.set(navButtonRoutes.contactsUrl + location.hash)
						},
					})
				} else {
					buttons.push({
						label: "createContact_action",
						click: () => {
							this.viewModel.contactModel.contactListId().then((contactListId) => {
								import("../../contacts/ContactEditor").then(({ ContactEditor }) => {
									const contact = createNewContact(logins.getUserController().user, mailAddress.address, mailAddress.name)
									new ContactEditor(this.viewModel.entityClient, contact, contactListId ?? undefined).show()
								})
							})
						},
					})
				}
			}

			if (defaultInboxRuleField && !logins.isEnabled(FeatureType.InternalCommunication)) {
				const rule = getExistingRuleForType(logins.getUserController().props, mailAddress.address.trim().toLowerCase(), defaultInboxRuleField)
				buttons.push({
					label: rule ? "editInboxRule_action" : "addInboxRule_action",
					click: async () => {
						const mailboxDetails = await this.viewModel.mailModel.getMailboxDetailsForMail(this.viewModel.mail)
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

	private async setContentBlockingStatus(status: ContentBlockingStatus) {
		await this.viewModel.setContentBlockingStatus(status)
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

	private scrollUp(): void {
		this.scrollIfDomBody((dom) => {
			const current = dom.scrollTop
			const toScroll = dom.clientHeight * SCROLL_FACTOR
			return scroll(current, Math.max(0, current - toScroll))
		})
	}

	private scrollDown(): void {
		this.scrollIfDomBody((dom) => {
			const current = dom.scrollTop
			const toScroll = dom.clientHeight * SCROLL_FACTOR
			return scroll(current, Math.min(dom.scrollHeight - dom.offsetHeight, dom.scrollTop + toScroll))
		})
	}

	private scrollToTop(): void {
		this.scrollIfDomBody((dom) => {
			return scroll(dom.scrollTop, 0)
		})
	}

	private scrollToBottom(): void {
		this.scrollIfDomBody((dom) => {
			const end = dom.scrollHeight - dom.offsetHeight
			return scroll(dom.scrollTop, end)
		})
	}

	private scrollIfDomBody(cb: (dom: HTMLElement) => DomMutation) {
		if (this.scrollDom) {
			const dom = this.scrollDom

			if (!this.scrollAnimation) {
				this.scrollAnimation = animations
					.add(dom, cb(dom), {
						easing: ease.inOut,
					})
					.then(() => {
						this.scrollAnimation = null
					})
			}
		}
	}

	private handleAnchorClick(event: Event, href: string | null, shouldDispatchSyntheticClick: boolean): void {
		if (href) {
			if (href.startsWith("mailto:")) {
				event.preventDefault()

				if (isNewMailActionAvailable()) {
					// disable new mails for external users.
					import("../editor/MailEditor").then(({ newMailtoUrlMailEditor }) => {
						newMailtoUrlMailEditor(href, !logins.getUserController().props.defaultUnconfidential)
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
