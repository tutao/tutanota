/**
 * This file contains the functions used to set up and tear down edit dialogs for calendar events.
 *
 * they're not responsible for upholding invariants or ensure valid events (CalendarEventModel.editModels
 * and CalendarEventEditView do that), but know what additional information to ask the user before saving
 * and which methods to call to save the changes.
 */
import { noOp, Thunk } from "@tutao/tutanota-utils"
import { Dialog } from "../base/Dialog.js"
import { ButtonAttrs } from "../base/Button.js"
import stream from "mithril/stream"
import { theme } from "../theme.js"
import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { client } from "../../misc/ClientDetector.js"
import { px, size } from "../size.js"

export class MultiPageDialog<TPages> {
	private readonly currentPage: stream<TPages>
	private readonly pages: stream<TPages[]>

	constructor(rootPage: TPages) {
		this.currentPage = stream(rootPage)
		this.pages = stream([rootPage])
	}

	buildDialog(
		renderContent: (currentPage: stream<TPages>, transitionTo: TransitionTo<TPages>, goBack: Thunk) => Children,
		getLeftAction: (currentPage: stream<TPages>, dialog: Dialog, navigateToPage: TransitionTo<TPages>, goBack: Thunk) => ButtonAttrs[],
		getRightAction: (currentPage: stream<TPages>, dialog: Dialog, navigateToPage: TransitionTo<TPages>, goBack: Thunk) => ButtonAttrs[],
		getPageTitle: (currentPage: stream<TPages>) => string,
	): Dialog {
		const dialog: Dialog = Dialog.editMediumDialog(
			{
				left: () =>
					getLeftAction(
						this.currentPage,
						dialog,
						(target: TPages) => {
							const tmp = this.pages()
							tmp.push(target)

							this.pages(tmp)
							this.currentPage(target)
						},
						() => {
							const tmp = this.pages()
							tmp.pop()

							this.pages(tmp)
						},
					),
				middle: () => getPageTitle(this.currentPage),
				right: () =>
					getRightAction(
						this.currentPage,
						dialog,
						(target: TPages) => {
							const tmp = this.pages()
							tmp.push(target)

							this.pages(tmp)
							this.currentPage(target)
						},
						() => {
							const tmp = this.pages()
							tmp.pop()

							this.pages(tmp)
						},
					),
			},
			MultiPageDialogViewWrapper<TPages>,
			{
				currentPage: this.currentPage,
				renderContent: () =>
					renderContent(
						this.currentPage,
						(target: TPages) => {
							const tmp = this.pages()
							tmp.push(target)

							this.pages(tmp)
						},
						() => {
							const tmp = this.pages()
							tmp.pop()

							this.pages(tmp)
						},
					),
				stack: this.pages,
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
	currentPage: stream<TPages>
	renderContent: (currentPage: stream<TPages>) => Children
	stack: stream<TPages[]>
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
		vnode.attrs.stack.map((newStack: TPages[]) => {
			const newStackLength = newStack.length
			if (newStackLength < this.stackSize && newStack.length > 0) {
				this.goBack(vnode.attrs.currentPage())
				this.stackSize = newStackLength
			} else if (newStackLength > this.stackSize) {
				this.stackSize = newStackLength
				this.transitionTo(newStack[newStackLength - 1])
			}
		})

		vnode.attrs.currentPage.map(() => {
			this.hasAnimationEnded = false
		})
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
		const stackSize = vnode.attrs.stack().length
		const currentPageStream = stream(vnode.attrs.stack()[stackSize - 1])
		if (this.hasAnimationEnded || this.transitionPage() == null) {
			return [
				// m("", { style: { width: this.pageWidth + "px" } }),
				m("", { style: { width: this.pageWidth + "px" } }, vnode.attrs.renderContent(currentPageStream)),
			]
		}

		return [
			stackSize > 1 ? m("", { style: { width: this.pageWidth + "px" } }, vnode.attrs.renderContent(vnode.attrs.currentPage)) : null,
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
