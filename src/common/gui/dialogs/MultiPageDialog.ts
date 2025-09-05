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
import { DialogHeaderBarAttrs } from "../base/DialogHeaderBar.js"
import { lang } from "../../misc/LanguageViewModel.js"

type Pages<PageKey extends string> = {
	[key in PageKey]: {
		content: Children
		title?: string
		rightAction?: ButtonAttrs
		leftAction?: ButtonAttrs

		/**
		 * A custom close handler. Important: Calling `dialog.close()` is required to remove the modal.
		 */
		onClose?: VoidFunction
	}
}
type GetPagesFunc<PageKey extends string> = (
	dialog: Dialog,
	navigateToPage: (targetPage: PageKey, skipAnimating?: boolean) => void,
	goBack: (to?: PageKey) => void,
) => Pages<PageKey>

/**
 * Allows to build a dialog with pagination, navigation & transitioning effect.
 *
 * @example
 * type Page = "event" | "guests"
 *
 * new MultiPageDialog<Page>("event", (
 *    dialog, // : Dialog,
 *    navigateToPage, // : (targetPage: "event" | "guests") => void,
 *    goBack, // : (targetPage?: "event" | "guests") => void,
 * ) => ({
 *    event: {
 *        // The content of the events page shown within the dialog.
 *        // It could also be a separate class implementing `Component` interface representing the content.
 *        content: [
 *            m("h1", "Jogging, 14:00-14:30"),
 *            m("button", {
 *                // When clicking the button, doing a forwards transition to the page `guests`
 *                onclick: () => navigateToPage("guests"),
 *            }, "Manage guests"),
 *        ],
 *        // The title of the 'events' page, shown in the dialog's header bar
 *        title: "Jogging",
 *        // A button, displayed in the dialog's header bar for the respective page.
 *        leftAction: { label: "close_alt", title: "close_alt", type: ButtonType.Secondary, click: () => dialog.onClose() },
 *    },
 *    guests: {
 *        content: m("", [
 *            m("h1", "Guests"),
 *            m("h3", "John Doe"),
 *            m("h3", "Jane Doe"),
 *        ]),
 *        leftAction: {
 *            label: "back_action",
 *            title: "back_action",
 *            type: ButtonType.Secondary,
 *            // When clicked, perform a backwards animation to the `event` page.
 *            click: () => goBack("event"),
 *        },
 *        rightAction: {
 *            label: "save_action", title: "save_action", type: ButtonType.Primary, click: () => {
 *                // ... do something and close the dialog afterward.
 *
 *                dialog.onClose()
 *            },
 *        },
 *        title: "Guests for jogging event",
 *        onClose: () => {
 *            // ... do something before the dialog is closed and close it afterward with `dialog.close()`
 *
 *            dialog.close()
 *        },
 *    },
 * }), 600)
 *    .getDialog()
 *    .show()
 *
 * @template PageKey - A union type representing the pages the dialog is using. Must be string.
 * @class
 */
export class MultiPageDialog<PageKey extends string> {
	private readonly currentPageStream: stream<PageKey>
	private readonly pageStackStream: stream<PageKey[]>
	private readonly isAnimating: stream<boolean> = stream(false)
	private readonly dialog: Dialog

	private readonly _headerBarAttrs: DialogHeaderBarAttrs = {
		left: [],
		right: [],
		middle: "emptyString_msg",
	}

	/**
	 * Builds a new `MultiPageDialog` instance.
	 *
	 * See {@link MultiPageDialog} documentation for usage guide.
	 *
	 * @constructor
	 * @param defaultPage - The first page displayed after opening the dialog.
	 * @param getPages - The function to return the configured pages.
	 * @param height - The height of the dialog in pixels.
	 **/
	constructor(
		defaultPage: PageKey,
		private readonly getPages: GetPagesFunc<PageKey>,
		height: number = 666,
	) {
		this.currentPageStream = stream(defaultPage)
		this.pageStackStream = stream([defaultPage])

		this.dialog = Dialog.editMediumDialog(
			this._headerBarAttrs,
			MultiPageDialogViewWrapper,
			{
				currentPageStream: this.currentPageStream,
				renderContent: (page: stream<PageKey>) => getPages(this.dialog, this.navigateToPage, this.goBack)[page()].content,
				stackStream: this.pageStackStream,
				isAnimating: this.isAnimating,
				height,
			},
			{
				height: "100%",
				"background-color": theme.surface_container,
			},
		)

		if (client.isMobileDevice()) {
			// Prevent focusing text field automatically on mobile. It opens keyboard, and you don't see all details.
			this.dialog.setFocusOnLoadFunction(noOp)
		}

		this.currentPageStream.map(() => {
			this.updateHeaderBar()
			const onClose = getPages(this.dialog, this.navigateToPage, this.goBack)[this.currentPageStream()]?.onClose
			this.dialog.setCloseHandler(
				onClose == null
					? null
					: () => {
							onClose()
						},
			)
		})
	}

	private updateHeaderBar() {
		const { leftAction, rightAction, title } = this.getPages(this.dialog, this.navigateToPage, this.goBack)[this.currentPageStream()]

		// The created dialog has a reference to `this._headerBarAttrs`. Changing the value of that particular reference is needed to update them.
		const updated: DialogHeaderBarAttrs = {
			left: [leftAction].filter((item): item is ButtonAttrs => !!item),
			right: [rightAction].filter((item): item is ButtonAttrs => !!item),
			middle: title == null ? "emptyString_msg" : lang.makeTranslation("title", title),
		}

		Object.assign(this._headerBarAttrs, updated)
	}

	public getDialog(): Dialog {
		return this.dialog
	}

	private readonly goBack = (to?: PageKey) => {
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

	/**
	 * This function navigates from a page to another one
	 *
	 * @param target the target page we need to navigate to
	 * @param skipAnimating option to skip waiting for animation to be finished before navigating to another page
	 * @returns
	 */
	private readonly navigateToPage = (target: PageKey, skipAnimating = false) => {
		if (!skipAnimating && this.isAnimating()) {
			// Some pages need to show up before animation is completed, e.g. error pages can show up before animation is done.
			return
		}

		const tmp = this.pageStackStream()
		tmp.push(target)

		this.currentPageStream(target)
		this.pageStackStream(tmp)
	}
}

type Props = {
	currentPageStream: stream<string>
	renderContent: (currentPage: stream<string>) => Children
	stackStream: stream<string[]>
	isAnimating: stream<boolean>
	height: number
}

enum SlideDirection {
	LEFT,
	RIGHT,
}

class MultiPageDialogViewWrapper implements Component<Props> {
	private readonly transitionPage: stream<string | null> = stream(null)
	private dialogHeight: number | null = null
	private pageWidth: number = -1
	private translate = 0
	private pagesWrapperDomElement!: HTMLElement
	// We can assume the stack size is one because we already enforce having a root page when initializing MultiPageDialog
	private stackSize = 1
	private slideDirection: SlideDirection | undefined = undefined
	private transitionClass = ""

	constructor(vnode: Vnode<Props>) {
		vnode.attrs.stackStream.map((newStack: string[]) => {
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
			this.pageWidth = dom.parentElement.clientWidth - size.spacing_24 * 2
		}
	}

	onremove(vnode: VnodeDOM<Props>) {
		windowFacade.removeResizeListener(this.resizeListener)
		vnode.attrs.currentPageStream.end(true)
	}

	oncreate(vnode: VnodeDOM<Props>): void {
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

	onupdate(vnode: VnodeDOM<Props>): any {
		const dom = vnode.dom as HTMLElement
		if (this.dialogHeight == null && dom.parentElement) {
			this.dialogHeight = vnode.attrs.height
			;(vnode.dom as HTMLElement).style.height = px(this.dialogHeight)
		}

		if (this.pageWidth === -1 && dom.parentElement) {
			this.setPageWidth(dom)
			m.redraw()
		}
	}

	private wrap(children: Children, key: string) {
		return m("", { key: `page-${key}`, style: { width: px(this.pageWidth) } }, children)
	}

	private getFillerPage(currentPage: string, stack: string[]): stream<string> {
		const page = this.slideDirection === SlideDirection.RIGHT ? stack[stack.length - 2] : this.transitionPage()
		return stream(page ?? currentPage)
	}

	private renderPage({ attrs: { renderContent, stackStream, currentPageStream, isAnimating } }: Vnode<Props>) {
		const fillerPageStream = this.getFillerPage(currentPageStream(), stackStream())

		const fillerPage = fillerPageStream()
		const currentPage = currentPageStream()

		const pages = [this.wrap(renderContent(fillerPageStream), fillerPage), this.wrap(renderContent(currentPageStream), currentPage)]

		if (isAnimating()) {
			return this.slideDirection === SlideDirection.RIGHT ? pages : pages.reverse()
		} else {
			return this.wrap(renderContent(currentPageStream), currentPage)
		}
	}

	private goBack(vnode: Vnode<Props>) {
		this.tryScrollToTop()

		const target = vnode.attrs.currentPageStream()
		this.translate = -(this.pageWidth + size.spacing_64)
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

	private transitionTo(vnode: Vnode<Props>, target: string) {
		this.tryScrollToTop()
		this.translate = 0

		vnode.attrs.isAnimating(true)
		this.transitionPage(target)
		this.transitionClass = "transition-transform"
		this.translate = -(this.pageWidth + size.spacing_64)
	}

	view(vnode: Vnode<Props>): Children {
		return m(
			".flex.gap-64.fit-content",
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
