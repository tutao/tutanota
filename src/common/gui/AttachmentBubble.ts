import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { Attachment } from "../mailFunctionality/SendMailModel.js"
import { Button, ButtonType } from "./base/Button.js"
import { Icons } from "./base/icons/Icons.js"
import { formatStorageSize } from "../misc/Formatter.js"
import { defer, DeferredObject, noOp, Thunk } from "@tutao/tutanota-utils"
import { modal, ModalComponent } from "./base/Modal.js"
import { focusNext, focusPrevious, Shortcut } from "../misc/KeyManager.js"
import { PosRect } from "./base/Dropdown.js"
import { Keys } from "../api/common/TutanotaConstants.js"
import { px } from "./size.js"
import { AllIcons, Icon } from "./base/Icon.js"
import { theme } from "./theme.js"
import { animations, height, opacity, transform, TransformEnum, width } from "./animation/Animations.js"
import { ease } from "./animation/Easing.js"
import { getFileBaseName, getFileExtension, isTutanotaFile } from "../api/common/utils/FileUtils.js"
import { getSafeAreaInsetBottom } from "./HtmlUtils.js"
import { hasError } from "../api/common/utils/ErrorUtils.js"
import { BubbleButton, bubbleButtonHeight, bubbleButtonPadding } from "./base/buttons/BubbleButton.js"
import { BootIcons } from "./base/icons/BootIcons.js"
import { CALENDAR_MIME_TYPE, VCARD_MIME_TYPES } from "../file/FileController.js"

export enum AttachmentType {
	GENERIC,
	CONTACT,
	CALENDAR,
}

export type AttachmentBubbleAttrs = {
	attachment: Attachment
	download: Thunk | null
	open: Thunk | null
	remove: Thunk | null
	fileImport: Thunk | null
	type: AttachmentType
}

export class AttachmentBubble implements Component<AttachmentBubbleAttrs> {
	private dom: HTMLElement | null = null

	view(vnode: Vnode<AttachmentBubbleAttrs>): Children {
		const { attachment } = vnode.attrs
		if (isTutanotaFile(attachment) && hasError(attachment)) {
			return m(BubbleButton, {
				label: "emptyString_msg",
				text: "corrupted_msg",
				icon: Icons.Warning,
				onclick: noOp,
			})
		} else {
			const extension = getFileExtension(attachment.name)
			const rest = getFileBaseName(attachment.name)
			return m(
				BubbleButton,
				{
					label: () => attachment.name,
					text: () => rest,
					icon: getAttachmentIcon(vnode.attrs.type),
					onclick: () => {
						showAttachmentDetailsPopup(this.dom!, vnode.attrs).then(() => this.dom?.focus())
					},
				},
				`${extension}, ${formatStorageSize(Number(attachment.size))}`,
			)
		}
	}

	oncreate(vnode: VnodeDOM<AttachmentBubbleAttrs>): void {
		this.dom = vnode.dom as HTMLElement
	}
}

async function showAttachmentDetailsPopup(dom: HTMLElement, attrs: AttachmentBubbleAttrs): Promise<void> {
	const parentRect = dom.getBoundingClientRect()
	const panel = new AttachmentDetailsPopup(parentRect, parentRect.width, attrs)
	panel.show()
	return panel.deferAfterClose
}

function getAttachmentIcon(type: AttachmentType): AllIcons {
	switch (type) {
		case AttachmentType.CONTACT:
			return Icons.People
		case AttachmentType.CALENDAR:
			return BootIcons.Calendar
		default:
			return Icons.Attachment
	}
}

export function getAttachmentType(mimeType: string) {
	if (Object.values<string>(VCARD_MIME_TYPES).includes(mimeType)) {
		return AttachmentType.CONTACT
	} else if (mimeType === CALENDAR_MIME_TYPE) {
		return AttachmentType.CALENDAR
	}

	return AttachmentType.GENERIC
}

export class AttachmentDetailsPopup implements ModalComponent {
	private readonly _shortcuts: Array<Shortcut> = []
	private domContent: HTMLElement | null = null
	private domPanel: HTMLElement | null = null
	private closeDefer: DeferredObject<void> = defer()
	private focusedBeforeShown: HTMLElement | null = null

	get deferAfterClose(): Promise<void> {
		return this.closeDefer.promise
	}

	constructor(private readonly targetRect: PosRect, private readonly targetWidth: number, private readonly attrs: AttachmentBubbleAttrs) {
		this._shortcuts.push({
			key: Keys.ESC,
			exec: () => this.onClose(),
			help: "close_alt",
		})
		this._shortcuts.push({
			key: Keys.TAB,
			shift: true,
			exec: () => (this.domContent ? focusPrevious(this.domContent) : false),
			help: "selectPrevious_action",
		})
		this._shortcuts.push({
			key: Keys.TAB,
			shift: false,
			exec: () => (this.domContent ? focusNext(this.domContent) : false),
			help: "selectNext_action",
		})
		if (attrs.open) {
			this._shortcuts.push({
				key: Keys.O,
				exec: () => this.thenClose(attrs.open),
				help: "open_action",
			})
		}
		if (attrs.download) {
			this._shortcuts.push({
				key: Keys.D,
				exec: () => this.thenClose(attrs.download),
				help: "download_action",
			})
		}
		if (attrs.remove) {
			this._shortcuts.push({
				key: Keys.DELETE,
				exec: () => this.thenClose(attrs.remove),
				help: "remove_action",
			})
		}
		if (attrs.fileImport) {
			this._shortcuts.push({
				key: Keys.I,
				exec: () => this.thenClose(attrs.fileImport),
				help: "import_action",
			})
		}
		this.view = this.view.bind(this)
	}

	view(): Children {
		return m(
			".abs.bubble-color.border-radius.overflow-hidden.flex.flex-column",
			{
				class: bubbleButtonPadding(),
				style: {
					width: px(this.targetWidth),
					// see hack description below. if #5587 persists, we might try visibility: hidden instead?
					opacity: "0",
				},
				oncreate: (vnode) => {
					this.domPanel = vnode.dom as HTMLElement
					// This is a hack to get "natural" view size but render it invisibly first and then show the panel with inferred size.
					// also focus the first tabbable element in the content after the panel opens.
					deferToNextFrame(() => this.animatePanel().then(() => this.domContent && focusNext(this.domContent)))
				},
				onclick: () => this.onClose(),
			},
			this.renderContent(),
		)
	}

	private renderContent(): Children {
		// We are trying to make some contents look like the attachment button to make the transition look smooth.
		// It is somewhat harder as it looks different with mobile layout.
		const { remove, open, download, attachment, fileImport, type } = this.attrs
		return m(
			".flex.mb-s.pr",
			{
				oncreate: (vnode) => (this.domContent = vnode.dom as HTMLElement),
			},
			[
				m(Icon, {
					icon: getAttachmentIcon(type),
					class: "pr-s flex items-center",
					style: {
						fill: theme.button_bubble_fg,
						"background-color": "initial",
						minHeight: px(bubbleButtonHeight()),
					},
				}),
				//  flex-grow to cover the bubble in case it's bigger than our content
				m(
					".flex.col.flex-grow",
					{
						style: {
							minHeight: px(bubbleButtonHeight()),
							// set line-height to position the text like in the button
							lineHeight: px(bubbleButtonHeight()),
						},
					},
					m(".span.break-all.smaller", attachment.name),
					// bottom info is inside the same column as file text to align them
					m(".flex.row.justify-between.items-center", [
						m("span.smaller", `${formatStorageSize(Number(attachment.size))}`),
						m(".flex.no-wrap", [
							remove ? m(Button, { type: ButtonType.Secondary, label: "remove_action", click: () => this.thenClose(remove) }) : null,
							fileImport
								? m(Button, {
										type: ButtonType.Secondary,
										label: "import_action",
										click: () => this.thenClose(fileImport),
								  })
								: null,
							open ? m(Button, { type: ButtonType.Secondary, label: "open_action", click: () => this.thenClose(open) }) : null,
							download ? m(Button, { type: ButtonType.Secondary, label: "download_action", click: () => this.thenClose(download) }) : null,
						]),
					]),
				),
			],
		)
	}

	private thenClose(action: Thunk | null): void {
		action?.()
		this.onClose()
	}

	private async animatePanel(): Promise<void> {
		const { targetRect, domPanel, domContent } = this
		if (domPanel == null || domContent == null) return
		const initialHeight = bubbleButtonHeight()
		// there is a possibility that we get 0 here in some circumstances, but it's unclear when.
		// might have something to do with the opacity: 0 hack above or because the original 24ms
		// delay was not enough. https://github.com/tutao/tutanota/issues/5587
		// 85 is a value that fits for a single line of attachment name, but looks weird for more while
		// keeping the buttons accessible.
		// if the reports continue, we can ask for logs.
		const targetHeight = domContent.offsetHeight === 0 ? 85 : domContent.offsetHeight
		if (domContent.offsetHeight === 0) {
			console.log(
				"got offsetHeight 0, panel contains content:",
				domPanel.contains(domContent),
				"content style:",
				domContent.style,
				"panel style:",
				domPanel.style,
			)
		}
		// for very short attachment bubbles, we need to set a min width so the buttons fit.
		const targetWidth = Math.max(targetRect.width, 300)
		domPanel.style.width = px(targetRect.width)
		domPanel.style.height = px(initialHeight)
		// add half the difference between .button height of 44px and 30px for pixel-perfect positioning
		domPanel.style.top = px(targetRect.top)

		//Verify if the attachment bubble is going to overflow the screen
		//if yes, invert the side of the margin and discount the bubble width
		if (targetRect.left + targetWidth > window.innerWidth) {
			domPanel.style.right = px(24)
		} else {
			domPanel.style.left = px(targetRect.left)
		}

		const mutations = [opacity(0, 1, true), height(initialHeight, targetHeight)]
		if (targetRect.width !== targetWidth) {
			mutations.push(width(targetRect.width, targetWidth))
		}
		// space below the panel after it fully extends minus a bit.
		const spaceBelow = window.innerHeight - getSafeAreaInsetBottom() - targetRect.top - targetHeight - initialHeight
		if (spaceBelow < 0) {
			mutations.push(transform(TransformEnum.TranslateY, 0, spaceBelow))
		}

		await animations.add(domPanel, mutations, {
			easing: ease.out,
		})
	}

	show() {
		this.focusedBeforeShown = document.activeElement as HTMLElement
		modal.displayUnique(this, true)
	}

	backgroundClick(e: MouseEvent): void {
		modal.remove(this)
	}

	async hideAnimation(): Promise<void> {
		if (this.domPanel == null) return
		const startHeight = this.domPanel.offsetHeight
		const startWidth = this.domPanel.offsetWidth
		await animations.add(this.domPanel, [height(startHeight, 30), width(startWidth, this.targetWidth), opacity(1, 0, false)], {
			easing: ease.out,
		})
	}

	onClose(): void {
		modal.remove(this)
		this.closeDefer.resolve()
	}

	shortcuts(): Shortcut[] {
		return this._shortcuts
	}

	popState(e: Event): boolean {
		modal.remove(this)
		return false
	}

	callingElement(): HTMLElement | null {
		return this.focusedBeforeShown
	}
}

/** try and execute stuff after the next rendering frame */
const deferToNextFrame = (fn: Thunk) => {
	window.requestAnimationFrame(() => {
		window.requestAnimationFrame(fn)
	})
}
