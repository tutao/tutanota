import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { Dialog } from "./Dialog"
import type { ButtonAttrs } from "./Button.js"
import { ButtonType } from "./Button.js"
import { Icons } from "./icons/Icons"
import { Icon } from "./Icon"
import { getContentButtonIconBackground, theme } from "../theme"
import { lang } from "../../misc/LanguageViewModel"
import type { DialogHeaderBarAttrs } from "./DialogHeaderBar"
import { Keys, TabIndex } from "../../api/common/TutanotaConstants"
import { assertMainOrNode } from "../../api/common/Env"
import { $Promisable } from "@tutao/tutanota-utils"
import { windowFacade } from "../../misc/WindowFacade.js"

assertMainOrNode()

export interface WizardPageAttrs<T> {
	/** Title of the page that is shown in the header bar of the WizardDialog*/
	headerTitle(): string

	/** Action that needs to be executed before switching to the next page.
	 * @return true if the action was successful and the next page can be shown, false otherwise.
	 **/
	nextAction(showErrorDialog: boolean): Promise<boolean>

	/**
	 * Checks if the page can be skipped.
	 */
	isSkipAvailable(): boolean

	/**
	 * Checks if the page is enabled and can be displayed.
	 */
	isEnabled(): boolean

	/**
	 * The actual data, which is the same for the entire wizard needs to be also accessible to each page
	 */
	readonly data: T

	/**
	 * Indicates that it should not be possible to select any earlier stage than this one, once reached. If not set or false, it is possible to go back
	 */
	readonly preventGoBack?: boolean

	/**
	 * if set to true, all paging buttons will be hidden for this page
	 */
	readonly hideAllPagingButtons?: boolean

	/**
	 * if this is true the paging button (button with the number) is hidden for this specific wizard page
	 */
	readonly hidePagingButtonForPage?: boolean
}

export type WizardPageN<T> = Component<WizardPageAttrs<T>>

export const enum WizardEventType {
	SHOWNEXTPAGE = "showNextWizardDialogPage",
	CLOSEDIALOG = "closeWizardDialog",
}

// A WizardPage dispatches this event to inform the parent WizardDialogN to close the dialog
export function emitWizardEvent(dom: HTMLElement | null, eventType: WizardEventType) {
	if (dom) {
		const event = new Event(eventType, {
			bubbles: true,
			cancelable: true,
		})
		dom.dispatchEvent(event)
	}
}

class WizardDialog<T> implements Component<WizardDialogAttrs<T>> {
	private _closeWizardDialogListener!: EventListener
	private _showNextWizardDialogPageListener!: EventListener

	oncreate(vnode: VnodeDOM<WizardDialogAttrs<T>>) {
		// We listen for events triggered by the child WizardPages to close the dialog or show the next page
		const dom: HTMLElement = vnode.dom as HTMLElement

		this._closeWizardDialogListener = (e: Event) => {
			e.stopPropagation()
			vnode.attrs.closeAction()
		}

		this._showNextWizardDialogPageListener = (e: Event) => {
			e.stopPropagation()

			if (vnode.attrs.currentPage) {
				vnode.attrs.currentPage.attrs.nextAction(true).then((ready) => {
					if (ready) vnode.attrs.goToNextPageOrCloseWizard()
				})
			}
		}

		dom.addEventListener(WizardEventType.CLOSEDIALOG, this._closeWizardDialogListener)
		dom.addEventListener(WizardEventType.SHOWNEXTPAGE, this._showNextWizardDialogPageListener)
	}

	onremove(vnode: VnodeDOM<WizardDialogAttrs<T>>) {
		const dom: HTMLElement = vnode.dom as HTMLElement
		if (this._closeWizardDialogListener) dom.removeEventListener(WizardEventType.CLOSEDIALOG, this._closeWizardDialogListener)
		if (this._showNextWizardDialogPageListener) dom.removeEventListener(WizardEventType.SHOWNEXTPAGE, this._showNextWizardDialogPageListener)
	}

	view(vnode: Vnode<WizardDialogAttrs<T>>) {
		const a = vnode.attrs
		const selectedIndex = a.currentPage ? a._getEnabledPages().indexOf(a.currentPage) : -1
		return m("#wizardDialogContent.pt", [
			a.currentPage && a.currentPage.attrs.hideAllPagingButtons
				? null
				: m(
						"#wizard-paging.flex-space-around.border-top",
						{
							style: {
								height: "22px",
								marginTop: "22px",
							},
						},
						a
							._getEnabledPages()
							.filter((page) => !page.attrs.hidePagingButtonForPage)
							.map((p, index) =>
								m(WizardPagingButton, {
									pageIndex: index,
									getSelectedPageIndex: () => selectedIndex,
									isClickable: () => a.allowedToVisitPage(index, selectedIndex),
									navigateBackHandler: (index) => a._goToPageAction(index),
								}),
							),
				  ),
			a.currentPage ? a.currentPage.view() : null,
		])
	}
}

/**
 * Pair of attrs and component for those attrs
 * We care about these properties:
 * It has WizardPageAttrs for T
 * A is consistent with the component
 *
 * When we use the wrapper we don't care about specific type of attrs or component.
 */

export interface WizardPageWrapper<T> {
	readonly attrs: WizardPageAttrs<T>
	readonly view: () => Children
}

export function wizardPageWrapper<T, A extends WizardPageAttrs<T>>(component: Class<Component<A>>, attributes: A): WizardPageWrapper<T> {
	return {
		attrs: attributes,
		view: () => m(component, attributes),
	}
}

class WizardDialogAttrs<T> {
	readonly data: T
	pages: ReadonlyArray<WizardPageWrapper<T>>
	currentPage: WizardPageWrapper<T> | null
	closeAction: () => Promise<void>
	private _headerBarAttrs: DialogHeaderBarAttrs = {}

	get headerBarAttrs(): DialogHeaderBarAttrs {
		return this._headerBarAttrs
	}

	constructor(data: T, pages: ReadonlyArray<WizardPageWrapper<T>>, closeAction?: () => Promise<void>) {
		this.data = data
		this.pages = pages
		this.currentPage = pages.find((p) => p.attrs.isEnabled()) ?? null
		this.closeAction = closeAction
			? () => closeAction()
			: () => {
					return Promise.resolve()
			  }
		this.updateHeaderBarAttrs()
	}

	goToPreviousPageOrClose(): void {
		let currentPageIndex = this.currentPage ? this._getEnabledPages().indexOf(this.currentPage) : -1

		if (!this.allowedToVisitPage(currentPageIndex - 1, currentPageIndex)) return

		if (currentPageIndex > 0) {
			this._goToPageAction(currentPageIndex - 1)

			m.redraw()
		} else {
			this.closeAction()
		}
	}

	updateHeaderBarAttrs<T>(): void {
		let currentPageIndex = this.currentPage ? this._getEnabledPages().indexOf(this.currentPage) : -1

		const backButtonAttrs: ButtonAttrs = {
			label: () => (currentPageIndex === 0 ? lang.get("cancel_action") : lang.get("back_action")),
			click: () => this.goToPreviousPageOrClose(),
			type: ButtonType.Secondary,
		}
		const skipButtonAttrs: ButtonAttrs = {
			label: "skip_action",
			click: () => this.goToNextPageOrCloseWizard(),
			type: ButtonType.Secondary,
		}

		// the wizard dialog has a reference to this._headerBarAttrs -> changing this object changes the dialog
		Object.assign(this._headerBarAttrs, {
			left: currentPageIndex >= 0 && this.allowedToVisitPage(currentPageIndex - 1, currentPageIndex) ? [backButtonAttrs] : [],
			right: () =>
				this.currentPage &&
				this.currentPage.attrs.isSkipAvailable() &&
				this._getEnabledPages().indexOf(this.currentPage) !== this._getEnabledPages().length - 1
					? [skipButtonAttrs]
					: [],
			middle: () => (this.currentPage ? this.currentPage.attrs.headerTitle() : ""),
		})
	}

	_getEnabledPages(): Array<WizardPageWrapper<T>> {
		return this.pages.filter((p) => p.attrs.isEnabled())
	}

	_goToPageAction(targetIndex: number): void {
		const pages = this._getEnabledPages()

		this.currentPage = pages[targetIndex]
		this.updateHeaderBarAttrs()
	}

	goToNextPageOrCloseWizard() {
		const pages = this._getEnabledPages()

		const currentIndex = this.currentPage ? pages.indexOf(this.currentPage) : -1
		const lastIndex = pages.length - 1
		let finalAction = currentIndex === lastIndex

		if (finalAction) {
			this.closeAction()
		} else {
			this._goToPageAction(currentIndex < lastIndex ? currentIndex + 1 : lastIndex)
		}
	}

	/** returns whether it is allowed to visit the page specified by pageIndex depending on selectedPageIndex */
	allowedToVisitPage(pageIndex: number, selectedPageIndex: number): boolean {
		if (pageIndex < 0 || selectedPageIndex < 0) {
			return true // invalid values -> should not restrict here
		}
		const enabledPages = this._getEnabledPages()
		// page is only allowed to be visited if it was already visited and there is no later page that was already visited and does not allow to go back
		return (
			pageIndex < selectedPageIndex &&
			!enabledPages
				.filter((page, index) => {
					return index > pageIndex && index <= selectedPageIndex
				})
				.some((page) => page.attrs.preventGoBack)
		)
	}
}

type WizardPagingButtonAttrs = {
	pageIndex: number
	getSelectedPageIndex: () => number
	isClickable: () => boolean
	navigateBackHandler: (pageIndex: number) => void
}

//exported for old-style WizardDialog.js
export class WizardPagingButton {
	view(vnode: Vnode<WizardPagingButtonAttrs>): Children {
		const selectedPageIndex = vnode.attrs.getSelectedPageIndex()
		const pageIndex = vnode.attrs.pageIndex
		const filledBg = getContentButtonIconBackground()
		const isClickable = vnode.attrs.isClickable()
		return m(
			".button-content.flex-center.items-center",
			{
				style: {
					marginTop: "-22px",
					cursor: isClickable ? "pointer" : "auto",
				},
				onclick: () => {
					if (isClickable) {
						vnode.attrs.navigateBackHandler(pageIndex)
					}
				},
			},
			m(
				"button.button-icon.flex-center.items-center.no-hover",
				{
					tabIndex: isClickable ? TabIndex.Default : TabIndex.Programmatic,
					style: {
						border: selectedPageIndex === pageIndex ? `2px solid ${theme.content_accent}` : `1px solid ${filledBg}`,
						color: selectedPageIndex === pageIndex ? theme.content_accent : "inherit",
						"background-color": pageIndex < selectedPageIndex ? filledBg : theme.content_bg,
						cursor: isClickable ? "pointer" : "auto",
					},
				},
				pageIndex < selectedPageIndex
					? m(Icon, {
							icon: Icons.Checkmark,
							style: {
								fill: theme.content_button_icon,
								"background-color": filledBg,
							},
					  })
					: "" + (pageIndex + 1),
			),
		)
	}
}

export type WizardDialogAttrsBuilder<T> = {
	dialog: Dialog
	attrs: WizardDialogAttrs<T>
}

// Use to generate a new wizard
export function createWizardDialog<T>(data: T, pages: ReadonlyArray<WizardPageWrapper<T>>, closeAction?: () => $Promisable<void>): WizardDialogAttrsBuilder<T> {
	// We need the close action of the dialog before we can create the proper attributes

	let view: () => Children = () => null

	const child: Component = {
		view: () => view(),
	}
	const unregisterCloseListener = windowFacade.addWindowCloseListener(() => {})
	const closeActionWrapper = async () => {
		if (closeAction) {
			await closeAction()
		}
		wizardDialog.close()
		unregisterCloseListener()
	}
	const wizardDialogAttrs = new WizardDialogAttrs(data, pages, closeActionWrapper)
	const wizardDialog = Dialog.largeDialog(wizardDialogAttrs.headerBarAttrs, child)

	view = () => m(WizardDialog, wizardDialogAttrs)
	wizardDialog
		.addShortcut({
			key: Keys.ESC,
			exec: () => {
				confirmThenCleanup(() => wizardDialogAttrs.closeAction())
			},
			help: "close_alt",
		})
		.setCloseHandler(() => {
			// the dialogs popState handler will return false which prevents the wizard from being closed
			// we then close the wizard manually if the user confirms
			confirmThenCleanup(() => wizardDialogAttrs.closeAction())
		})

	return {
		dialog: wizardDialog,
		attrs: wizardDialogAttrs,
	}
}

async function confirmThenCleanup(closeAction: () => Promise<void>) {
	const confirmed = await Dialog.confirm(() => lang.get("closeWindowConfirmation_msg"))
	if (confirmed) {
		closeAction()
	}
}
