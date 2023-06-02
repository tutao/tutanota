import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { Attachment } from "../mail/editor/SendMailModel.js"
import { Button, ButtonType } from "./base/Button.js"
import { Icons } from "./base/icons/Icons.js"
import { formatStorageSize } from "../misc/Formatter.js"
import { defer, DeferredObject, Thunk } from "@tutao/tutanota-utils"
import { modal, ModalComponent } from "./base/Modal.js"
import { focusNext, focusPrevious, Shortcut } from "../misc/KeyManager.js"
import { PosRect } from "./base/Dropdown.js"
import { Keys } from "../api/common/TutanotaConstants.js"
import { px } from "./size.js"
import { Icon } from "./base/Icon.js"
import { theme } from "./theme.js"
import { animations, height, opacity, transform, TransformEnum, width } from "./animation/Animations.js"
import { ease } from "./animation/Easing.js"
import { getFileBaseName, getFileExtension } from "../api/common/utils/FileUtils.js"
import { getSafeAreaInsetBottom } from "./HtmlUtils.js"

export type AttachmentBubbleAttrs = {
	attachment: Attachment
	download: Thunk | null
	open: Thunk | null
	remove: Thunk | null
}

export class AttachmentBubble implements Component<AttachmentBubbleAttrs> {
	private dom: HTMLElement | null = null

	view(vnode: Vnode<AttachmentBubbleAttrs>): Children {
		const { attachment } = vnode.attrs
		const extension = getFileExtension(attachment.name)
		const rest = getFileBaseName(attachment.name)
		return m(Button, {
			label: () => rest,
			title: () => attachment.name,
			icon: () => Icons.Attachment,
			type: ButtonType.Bubble,
			staticRightText: `${extension}, ${formatStorageSize(Number(attachment.size))}`,
			click: async () => {
				await showAttachmentDetailsPopup(this.dom!, vnode.attrs)
				this.dom?.focus()
			},
		})
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

export class AttachmentDetailsPopup implements ModalComponent {
	private readonly _shortcuts: Array<Shortcut> = []
	private domContent: HTMLElement | null = null
	private domPanel: HTMLElement | null = null
	private focusedFirst: boolean = false
	private closeDefer: DeferredObject<void> = defer()

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
		this.view = this.view.bind(this)
	}

	view(): Children {
		return m(
			".abs.bubble-color.plr-button.border-radius.overflow-hidden.flex.flex-column",
			{
				style: {
					width: px(this.targetWidth),
					// see hack description below
					opacity: "0",
				},
				oncreate: (vnode) => {
					this.domPanel = vnode.dom as HTMLElement
					// This is a hack to get "natural" view size but render it without opacity first and then show the panel with inferred size.
					// also focus the first tabbable element in the content after the panel opens.
					setTimeout(() => this.animatePanel().then(() => this.domContent && focusNext(this.domContent)), 24)
				},
				onclick: () => this.onClose(),
			},
			this.renderContent(),
		)
	}

	private renderContent(): Children {
		const { remove, open, download, attachment } = this.attrs
		return m(
			".flex.row.mb-s.pr",
			{
				oncreate: (vnode) => (this.domContent = vnode.dom as HTMLElement),
			},
			[
				m(Icon, {
					icon: Icons.Attachment,
					class: "pr-s",
					style: {
						fill: theme.button_bubble_fg,
						"background-color": "initial",
						marginTop: "6px",
					},
				}),
				m(".flex.col.flex-grow", [
					m(
						".mb.break-all.smaller",
						{
							style: {
								marginTop: "5px",
							},
						},
						attachment.name,
					),
					m(".flex.row.justify-between.items-center.flex-grow", [
						m("span.smaller", `${formatStorageSize(Number(attachment.size))}`),
						m(".no-wrap", [
							remove ? m(Button, { type: ButtonType.Secondary, label: "remove_action", click: () => this.thenClose(remove) }) : null,
							open ? m(Button, { type: ButtonType.Secondary, label: "open_action", click: () => this.thenClose(open) }) : null,
							download ? m(Button, { type: ButtonType.Secondary, label: "download_action", click: () => this.thenClose(download) }) : null,
						]),
					]),
				]),
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
		// from .bubble class
		const initialHeight = 30
		const targetHeight = domContent.offsetHeight
		// for very short attachment bubbles, we need to set a min width so the buttons fit.
		const targetWidth = Math.max(targetRect.width, 300)
		domPanel.style.width = px(targetRect.width)
		domPanel.style.height = px(initialHeight)
		// add half the difference between .button height of 44px and 30px for pixel-perfect positioning
		domPanel.style.top = px(targetRect.top + 7)
		domPanel.style.left = px(targetRect.left)

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
}
