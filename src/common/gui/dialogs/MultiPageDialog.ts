import { noOp, Thunk } from "@tutao/tutanota-utils"
import { Dialog } from "../base/Dialog.js"
import { ButtonAttrs } from "../base/Button.js"
import stream from "mithril/stream"
import { theme } from "../theme.js"
import m from "mithril"
import Mithril, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { client } from "../../misc/ClientDetector.js"
import { px, size } from "../size.js"

export class MultiPageDialog<TPages> {
	private readonly currentPageStream: stream<TPages>
	private readonly pageStackStream: stream<TPages[]>

	constructor(rootPage: TPages) {
		this.currentPageStream = stream(rootPage)
		this.pageStackStream = stream([rootPage])
	}

	private readonly goBack = () => {
		const tmp = this.pageStackStream()
		tmp.pop()

		this.pageStackStream(tmp)
		this.currentPageStream(tmp[0])
	}

	private readonly navigateToPage = (target: TPages) => {
		const tmp = this.pageStackStream()
		tmp.push(target)

		this.pageStackStream(tmp)
		this.currentPageStream(target)
	}

	buildDialog(
		renderContent: (currentPage: stream<TPages>, transitionTo: TransitionTo<TPages>, goBack: Thunk) => Children,
		getLeftAction: (currentPage: stream<TPages>, dialog: Dialog, navigateToPage: TransitionTo<TPages>, goBack: Thunk) => ButtonAttrs[],
		getRightAction: (currentPage: stream<TPages>, dialog: Dialog, navigateToPage: TransitionTo<TPages>, goBack: Thunk) => ButtonAttrs[],
		getPageTitle: (currentPage: stream<TPages>) => string,
	): Dialog {
		const dialog: Dialog = Dialog.editMediumDialog(
			{
				left: () => getLeftAction(this.currentPageStream, dialog, this.navigateToPage, this.goBack),
				middle: () => getPageTitle(this.currentPageStream),
				right: () => getRightAction(this.currentPageStream, dialog, this.navigateToPage, this.goBack),
			},
			MultiPageDialogViewWrapper<TPages>,
			{
				currentPageStream: this.currentPageStream,
				renderContent: () => renderContent(this.currentPageStream, this.navigateToPage, this.goBack),
				stackStream: this.pageStackStream,
			},
			{
				height: "100%",
				"background-color": theme.navigation_bg,
			},
		)

		if (client.isMobileDevice()) {
			// Prevent focusing text field automatically on mobile. It opens keyboard, and you don't see all details.
			dialog.setFocusOnLoadFunction(noOp)
		}

		return dialog
	}
}

export type TransitionTo<T> = (newPage: T) => void

type Props<TPages> = {
	currentPageStream: stream<TPages>
	renderContent: (currentPage: stream<TPages>) => Children
	stackStream: stream<TPages[]>
}

export class MultiPageDialogViewWrapper<TPages> implements Component<Props<TPages>> {
	private readonly transitionPage: stream<TPages | null> = stream(null)
	private hasAnimationEnded = true
	private pagesWrapperDomElement!: HTMLElement
	private dialogHeight: number | null = null
	private pageWidth: number = -1
	private translate = 0
	private stackSize = 0

	constructor(vnode: Vnode<Props<TPages>>) {
		vnode.attrs.stackStream.map((newStack: TPages[]) => {
			const newStackLength = newStack.length
			if (newStackLength < this.stackSize && newStack.length > 0) {
				this.goBack(vnode.attrs.currentPageStream())
				this.stackSize = newStackLength
			} else if (newStackLength > this.stackSize) {
				this.stackSize = newStackLength
				this.transitionTo(newStack[newStackLength - 1])
			}
		})
		vnode.attrs.currentPageStream.map(() => {
			this.hasAnimationEnded = false
		})
	}

	onremove(vnode: Mithril.VnodeDOM<Props<TPages>>): any {
		vnode.attrs.currentPageStream.end(true)
	}

	oncreate(vnode: VnodeDOM<Props<TPages>>): void {
		this.pagesWrapperDomElement = vnode.dom as HTMLElement

		this.pagesWrapperDomElement.addEventListener("transitionend", () => {
			this.transitionPage(null)
			this.translate = 0
			this.hasAnimationEnded = true
			m.redraw()
		})
	}

	onupdate(vnode: VnodeDOM<Props<TPages>>): any {
		const dom = vnode.dom as HTMLElement
		if (this.dialogHeight == null && dom.parentElement) {
			this.dialogHeight = dom.parentElement.clientHeight
			;(vnode.dom as HTMLElement).style.height = px(this.dialogHeight)
		}

		if (this.pageWidth == -1 && dom.parentElement) {
			this.pageWidth = dom.parentElement.clientWidth - size.hpad_large * 2
			// Twice the page width (Main Page + Guests/Repeat) plus the gap between pages (64px)
			;(vnode.dom as HTMLElement).style.width = px(this.pageWidth * 2 + size.vpad_xxl)
			m.redraw()
		}
	}

	private renderPage(vnode: Vnode<Props<TPages>>) {
		const stackSize = vnode.attrs.stackStream().length
		const currentPageStream = stream(vnode.attrs.stackStream()[stackSize - 1])
		if (this.hasAnimationEnded || this.transitionPage() == null) {
			return [
				// m("", { style: { width: this.pageWidth + "px" } }),
				m("", { style: { width: this.pageWidth + "px" } }, vnode.attrs.renderContent(currentPageStream)),
			]
		}

		return [
			stackSize > 1 ? m("", { style: { width: this.pageWidth + "px" } }, vnode.attrs.renderContent(vnode.attrs.currentPageStream)) : null,
			m("", { style: { width: this.pageWidth + "px" } }, vnode.attrs.renderContent(currentPageStream)),
		]
	}

	private goBack(target: TPages) {
		this.hasAnimationEnded = false
		this.transitionPage(target)
		this.translate = 0
	}

	private transitionTo(target: TPages) {
		this.hasAnimationEnded = false
		this.transitionPage(target)
		if (this.stackSize > 1) this.translate = -(this.pageWidth + size.vpad_xxl)
	}

	view(vnode: Vnode<Props<TPages>>): Children {
		return m(
			".flex.gap-vpad-xxl.fit-content.transition-transform",
			{
				style: {
					transform: `translateX(${this.translate}px)`,
				},
			},
			this.renderPage(vnode),
		)
	}
}
