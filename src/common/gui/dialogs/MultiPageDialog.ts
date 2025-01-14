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
	private readonly isAnimating: stream<boolean> = stream(false)

	constructor(rootPage: TPages) {
		this.currentPageStream = stream(rootPage)
		this.pageStackStream = stream([rootPage])
	}

	private readonly goBack = () => {
		if (this.isAnimating()) {
			return
		}

		const tmp = this.pageStackStream()
		tmp.pop()

		this.pageStackStream(tmp)
		this.currentPageStream(tmp[tmp.length - 1])
	}

	private readonly navigateToPage = (target: TPages) => {
		if (this.isAnimating()) {
			return
		}

		const tmp = this.pageStackStream()
		tmp.push(target)

		this.currentPageStream(target)
		this.pageStackStream(tmp)
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
				renderContent,
				stackStream: this.pageStackStream,
				isAnimating: this.isAnimating,
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
	isAnimating: stream<boolean>
}

export class MultiPageDialogViewWrapper<TPages> implements Component<Props<TPages>> {
	private readonly transitionPage: stream<TPages | null> = stream(null)
	private hasAnimationEnded = true
	private pagesWrapperDomElement!: HTMLElement
	private dialogHeight: number | null = null
	private pageWidth: number = -1
	private translate = 0
	// We can assume the stack size is one because we already enforce having a root page when initializing MultiPageDialog
	private stackSize = 1
	private isGoingForward = false
	private transitionClass = ""

	constructor(vnode: Vnode<Props<TPages>>) {
		vnode.attrs.stackStream.map((newStack: TPages[]) => {
			const newStackLength = newStack.length
			if (newStackLength < this.stackSize && newStack.length > 0) {
				this.isGoingForward = false
				this.goBack(vnode)
				this.stackSize = newStackLength
			} else if (newStackLength > this.stackSize) {
				this.isGoingForward = true
				this.stackSize = newStackLength
				this.transitionTo(vnode, newStack[newStackLength - 1])
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
			this.transitionClass = ""
			this.hasAnimationEnded = true
			this.transitionPage(null)
			this.translate = 0
			vnode.attrs.isAnimating(false)
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
			// Twice the page width plus the gap between pages (64px)
			;(vnode.dom as HTMLElement).style.width = px(this.pageWidth * 2 + size.vpad_xxl)
			m.redraw()
		}
	}

	private renderPage(vnode: Vnode<Props<TPages>>) {
		const updatedStackSize = vnode.attrs.stackStream().length
		const leftPage = this.isGoingForward
			? stream(vnode.attrs.stackStream()[updatedStackSize - 2] ?? vnode.attrs.currentPageStream())
			: stream(this.transitionPage() ?? vnode.attrs.currentPageStream())
		if (this.hasAnimationEnded || (this.transitionPage() == null && updatedStackSize >= 2)) {
			const pages = [
				m("", { style: { width: this.pageWidth + "px" } }, vnode.attrs.renderContent(leftPage)),
				m("", { style: { width: this.pageWidth + "px" } }, vnode.attrs.renderContent(vnode.attrs.currentPageStream)),
			]
			return this.isGoingForward ? pages.reverse() : pages
		}

		const pages = [
			m("", { style: { width: this.pageWidth + "px" } }, vnode.attrs.renderContent(leftPage)),
			m("", { style: { width: this.pageWidth + "px" } }, vnode.attrs.renderContent(vnode.attrs.currentPageStream)),
		]

		return this.isGoingForward ? pages : pages.reverse()
	}

	private goBack(vnode: Vnode<Props<TPages>>) {
		const target = vnode.attrs.currentPageStream()
		vnode.attrs.isAnimating(true)
		this.translate = -(this.pageWidth + size.vpad_xxl)
		m.redraw.sync()

		// FIXME Can we do something to not use setTimeout???
		setTimeout(() => {
			this.hasAnimationEnded = false
			this.transitionPage(target)
			this.transitionClass = "transition-transform"
			this.translate = 0
			m.redraw()
		}, 1)
	}

	private transitionTo(vnode: Vnode<Props<TPages>>, target: TPages) {
		this.hasAnimationEnded = false
		this.transitionPage(target)
		vnode.attrs.isAnimating(true)
		this.transitionClass = "transition-transform"
		if (this.stackSize > 1) this.translate = -(this.pageWidth + size.vpad_xxl)
	}

	view(vnode: Vnode<Props<TPages>>): Children {
		return m(
			".flex.gap-vpad-xxl.fit-content",
			{
				class: this.transitionClass,
				style: {
					transform: `translateX(${this.translate}px)`,
				},
			},
			this.renderPage(vnode),
		)
	}
}
