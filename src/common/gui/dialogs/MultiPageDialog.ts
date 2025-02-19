import { noOp } from "@tutao/tutanota-utils"
import { Dialog } from "../base/Dialog.js"
import { ButtonAttrs } from "../base/Button.js"
import stream from "mithril/stream"
import { theme } from "../theme.js"
import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { client } from "../../misc/ClientDetector.js"
import { px, size } from "../size.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"
import { windowFacade, windowSizeListener } from "../../misc/WindowFacade.js"
import { MaybeTranslation } from "../../misc/LanguageViewModel.js"

type ContentRenderer<TPages> = (currentPage: TPages, dialog: Dialog, navigateToPage: (targetPage: TPages) => void, goBack: (to?: TPages) => void) => Children
type DialogAction<TPages> = (
	currentPage: TPages,
	dialog: Dialog,
	navigateToPage: (targetPage: TPages) => void,
	goBack: (to?: TPages) => void,
) => ButtonAttrs | undefined

type DialogHeaderOptions<TPages> = {
	getLeftAction?: DialogAction<TPages>
	getRightAction?: DialogAction<TPages>
	getPageTitle: (currentPage: TPages) => MaybeTranslation
}

/**
 * Multipage dialog with transition animations.
 *
 * @example
 * enum UpgradePlanPages {
 *   PLAN,
 *   INVOICE,
 *   CONFIRM
 * }
 *
 * function renderContent(page, dialog, navigateToPage, goBack) {
 *     if(page === UpgradePlanPages.PLAN) {
 *         // return your component here for the "plan" page...
 *     }
 *
 *     // ... return your other pages
 * }
 *
 * function getLeftAction(page, dialog, navigateToPage, goBack) {
 * 		if(page === UpgradePlanPages.PLAN) {
 *			return {
 *				type: ButtonType.Secondary,
 *				click: () => dialog.close()
 *				label: () => "Close",
 *			}
 *		}
 *  	// ... handle other pages
 * }
 *
 * const dialog = new MultiPageDialog<UpgradePlanPages>()
 * 	 .buildDialog(renderContent, { getLeftAction, getPageTitle, getRightAction })
 *
 * dialog.show()
 *
 * @see ContentRenderer
 * @see DialogAction
 * @see DialogHeaderOptions
 * @see ButtonAttrs
 */
export class MultiPageDialog<TPages> {
	private readonly currentPageStream: stream<TPages>
	private readonly pageStackStream: stream<TPages[]>
	private readonly isAnimating: stream<boolean> = stream(false)

	constructor(rootPage: TPages) {
		this.currentPageStream = stream(rootPage)
		this.pageStackStream = stream([rootPage])
	}

	private readonly goBack = (to?: TPages) => {
		if (this.isAnimating() || this.pageStackStream().length < 2) {
			return
		}

		const tmp = this.pageStackStream()
		if (to !== undefined) {
			if (!this.pageStackStream().includes(to)) {
				console.error(new ProgrammingError("Cannot go back to a page that was never visited before."))
				return
			}

			while (tmp[tmp.length - 1] !== to) {
				tmp.pop()
			}
		} else {
			tmp.pop()
		}

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

	/**
	 * Prepares dialog attributes and builds a MediumDialog returning it to the caller
	 * @param renderContent
	 * @param getLeftAction
	 * @param getPageTitle
	 * @param getRightAction
	 */
	buildDialog(renderContent: ContentRenderer<TPages>, { getLeftAction, getPageTitle, getRightAction }: DialogHeaderOptions<TPages>): Dialog {
		const dialog: Dialog = Dialog.editMediumDialog(
			{
				left: () => [getLeftAction?.(this.currentPageStream(), dialog, this.navigateToPage, this.goBack)].filter((item): item is ButtonAttrs => !!item),
				middle: getPageTitle(this.currentPageStream()),
				right: () =>
					[getRightAction?.(this.currentPageStream(), dialog, this.navigateToPage, this.goBack)].filter((item): item is ButtonAttrs => !!item),
			},
			MultiPageDialogViewWrapper<TPages>,
			{
				currentPageStream: this.currentPageStream,
				renderContent: (page: stream<TPages>) => renderContent(page(), dialog, this.navigateToPage, this.goBack),
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

type Props<TPages> = {
	currentPageStream: stream<TPages>
	renderContent: (currentPage: stream<TPages>) => Children
	stackStream: stream<TPages[]>
	isAnimating: stream<boolean>
}

enum SlideDirection {
	LEFT,
	RIGHT,
}

class MultiPageDialogViewWrapper<TPages> implements Component<Props<TPages>> {
	private readonly transitionPage: stream<TPages | null> = stream(null)
	private dialogHeight: number | null = null
	private pageWidth: number = -1
	private translate = 0
	private pagesWrapperDomElement!: HTMLElement
	// We can assume the stack size is one because we already enforce having a root page when initializing MultiPageDialog
	private stackSize = 1
	private slideDirection: SlideDirection | undefined = undefined
	private transitionClass = ""

	constructor(vnode: Vnode<Props<TPages>>) {
		vnode.attrs.stackStream.map((newStack: TPages[]) => {
			const newStackLength = newStack.length
			if (newStackLength < this.stackSize && newStack.length > 0) {
				this.slideDirection = SlideDirection.LEFT
				this.goBack(vnode)
				this.stackSize = newStackLength
			} else if (newStackLength > this.stackSize) {
				this.slideDirection = SlideDirection.RIGHT
				this.stackSize = newStackLength
				this.transitionTo(vnode, newStack[newStackLength - 1])
			}
		})
	}

	private readonly resizeListener: windowSizeListener = () => {
		this.setPageWidth(this.pagesWrapperDomElement)
		m.redraw()
	}

	private setPageWidth(dom: HTMLElement) {
		const parentElement = dom.parentElement
		if (parentElement) {
			this.pageWidth = dom.parentElement.clientWidth - size.hpad_large * 2
		}
	}

	onremove(vnode: VnodeDOM<Props<TPages>>) {
		windowFacade.removeResizeListener(this.resizeListener)
		vnode.attrs.currentPageStream.end(true)
	}

	oncreate(vnode: VnodeDOM<Props<TPages>>): void {
		this.pagesWrapperDomElement = vnode.dom as HTMLElement

		vnode.dom.addEventListener("transitionend", (e) => {
			// transitionend event is fired in the children, so that we need to filter them to only apply to the dialog
			const targetEl = e.target as HTMLElement
			if (targetEl.id !== "multi-page-dialog") return

			this.transitionClass = ""
			vnode.attrs.isAnimating(false)
			this.transitionPage(null)
			this.translate = 0
			m.redraw()
		})

		windowFacade.addResizeListener(this.resizeListener)
	}

	onupdate(vnode: VnodeDOM<Props<TPages>>): any {
		const dom = vnode.dom as HTMLElement
		if (this.dialogHeight == null && dom.parentElement) {
			this.dialogHeight = dom.parentElement.clientHeight
			;(vnode.dom as HTMLElement).style.height = px(this.dialogHeight)
		}

		if (this.pageWidth == -1 && dom.parentElement) {
			this.setPageWidth(dom)
			m.redraw()
		}
	}

	private wrap(children: Children) {
		return m("", { style: { width: px(this.pageWidth) } }, children)
	}

	private getFillerPage(currentPage: TPages, stack: TPages[]): stream<TPages> {
		const page = this.slideDirection == SlideDirection.RIGHT ? stack[stack.length - 2] : this.transitionPage()
		return stream(page ?? currentPage)
	}

	private renderPage(vnode: Vnode<Props<TPages>>) {
		const fillerPageStream = this.getFillerPage(vnode.attrs.currentPageStream(), vnode.attrs.stackStream())

		const pages = [this.wrap(vnode.attrs.renderContent(fillerPageStream)), this.wrap(vnode.attrs.renderContent(vnode.attrs.currentPageStream))]

		if (vnode.attrs.isAnimating()) {
			return this.slideDirection === SlideDirection.RIGHT ? pages : pages.reverse()
		} else {
			return this.wrap(vnode.attrs.renderContent(vnode.attrs.currentPageStream))
		}
	}

	private goBack(vnode: Vnode<Props<TPages>>) {
		this.tryScrollToTop()

		const target = vnode.attrs.currentPageStream()
		this.translate = -(this.pageWidth + size.vpad_xxl)
		m.redraw.sync()

		vnode.attrs.isAnimating(true)
		this.transitionPage(target)
		this.transitionClass = "transition-transform"
		this.translate = 0
	}

	/**
	 * Determines the parent element of the pages wrapper (which should be the dialog) and sets the `scrollTop` to `0`.
	 * If the parent element is not found or does not include the `scroll` CSS class, nothing will happen.
	 */
	private tryScrollToTop() {
		const parentElement = this.pagesWrapperDomElement.parentElement

		if (parentElement?.classList.contains("scroll")) {
			parentElement.scrollTop = 0
		}
	}

	private transitionTo(vnode: Vnode<Props<TPages>>, target: TPages) {
		this.tryScrollToTop()
		this.translate = 0

		vnode.attrs.isAnimating(true)
		this.transitionPage(target)
		this.transitionClass = "transition-transform"
		this.translate = -(this.pageWidth + size.vpad_xxl)
	}

	view(vnode: Vnode<Props<TPages>>): Children {
		return m(
			".flex.gap-vpad-xxl.fit-content",
			{
				id: "multi-page-dialog",
				class: this.transitionClass,
				style: {
					transform: `translateX(${this.translate}px)`,
				},
			},
			this.renderPage(vnode),
		)
	}
}
