import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { Dialog, DialogType } from "./Dialog"
import type { ButtonAttrs } from "./Button.js"
import { ButtonType } from "./Button.js"
import { Icons } from "./icons/Icons"
import { Icon, IconSize } from "./Icon"
import { theme } from "../theme"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
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
	SHOW_NEXT_PAGE = "showNextWizardDialogPage",
	SHOW_PREVIOUS_PAGE = "showPreviousWizardDialogPage",
	CLOSE_DIALOG = "closeWizardDialog",
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
	private _showPreviousWizardDialogPageListener!: EventListener
	private wizardContentDom: HTMLElement | null = null // we need the wizard content dom to scroll to the top when redirecting to the next page

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
					if (ready) {
						vnode.attrs.goToNextPageOrCloseWizard()
						this.wizardContentDom?.scrollIntoView()
					}
				})
			}
		}

		this._showPreviousWizardDialogPageListener = (e: Event) => {
			e.stopPropagation()

			if (!vnode.attrs.currentPage?.attrs.preventGoBack) {
				vnode.attrs.goToPreviousPageOrClose()
				this.wizardContentDom?.scrollIntoView()
			}
		}

		dom.addEventListener(WizardEventType.CLOSE_DIALOG, this._closeWizardDialogListener)
		dom.addEventListener(WizardEventType.SHOW_NEXT_PAGE, this._showNextWizardDialogPageListener)
		dom.addEventListener(WizardEventType.SHOW_PREVIOUS_PAGE, this._showPreviousWizardDialogPageListener)
	}

	onremove(vnode: VnodeDOM<WizardDialogAttrs<T>>) {
		const dom: HTMLElement = vnode.dom as HTMLElement
		if (this._closeWizardDialogListener) dom.removeEventListener(WizardEventType.CLOSE_DIALOG, this._closeWizardDialogListener)
		if (this._showNextWizardDialogPageListener) dom.removeEventListener(WizardEventType.SHOW_NEXT_PAGE, this._showNextWizardDialogPageListener)
		if (this._showPreviousWizardDialogPageListener) dom.removeEventListener(WizardEventType.SHOW_PREVIOUS_PAGE, this._showPreviousWizardDialogPageListener)
	}

	view(vnode: Vnode<WizardDialogAttrs<T>>) {
		const a = vnode.attrs
		const enabledPages = a._getEnabledPages()
		const selectedIndex = a.currentPage ? enabledPages.indexOf(a.currentPage) : -1
		const visiblePages = enabledPages.filter((page) => !page.attrs.hidePagingButtonForPage)
		const lastIndex = visiblePages.length - 1

		return m(
			"#wizardDialogContent.pt",
			{
				oncreate: (vnode) => {
					this.wizardContentDom = vnode.dom as HTMLElement
				},
			},
			[
				a.currentPage && a.currentPage.attrs.hideAllPagingButtons
					? null
					: m(
							"nav#wizard-paging.flex-space-around.center-vertically.mb-s.plr-2l",
							{
								"aria-label": "Breadcrumb",
							},
							visiblePages.map((p, index) => [
								m(WizardPagingButton, {
									pageIndex: index,
									getSelectedPageIndex: () => selectedIndex,
									isClickable: () => a.allowedToVisitPage(index, selectedIndex),
									navigateBackHandler: (index) => a._goToPageAction(index),
								}),
								index === lastIndex ? null : m(".flex-grow", { class: this.getLineClass(index < selectedIndex) }),
							]),
					  ),
				a.currentPage ? a.currentPage.view() : null,
			],
		)
	}

	private getLineClass(isPreviousPage: boolean) {
		if (isPreviousPage) {
			return "wizard-breadcrumb-line-active"
		} else {
			return "wizard-breadcrumb-line"
		}
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
	cancelButtonText: TranslationKey
	private _headerBarAttrs: DialogHeaderBarAttrs = {}

	get headerBarAttrs(): DialogHeaderBarAttrs {
		return this._headerBarAttrs
	}

	// Idea for refactoring: make optional parameters into separate object
	constructor(data: T, pages: ReadonlyArray<WizardPageWrapper<T>>, cancelButtonText: TranslationKey | null = null, closeAction?: () => Promise<void>) {
		this.data = data
		this.pages = pages
		this.currentPage = pages.find((p) => p.attrs.isEnabled()) ?? null
		this.closeAction = closeAction
			? () => closeAction()
			: () => {
					return Promise.resolve()
			  }
		this.cancelButtonText = cancelButtonText ?? "cancel_action"
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
			label: () => (currentPageIndex === 0 ? lang.get(this.cancelButtonText) : lang.get("back_action")),
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
		const isClickable = vnode.attrs.isClickable()
		const nextIndex = (pageIndex + 1).toString()
		const isSelectedPage = selectedPageIndex === pageIndex
		const isPreviousPage = pageIndex < selectedPageIndex

		return m(
			"button.button-icon.flex-center.items-center",
			{
				tabIndex: isClickable ? TabIndex.Default : TabIndex.Programmatic,
				"aria-disabled": isClickable.toString(),
				"aria-label": isClickable ? lang.get("previous_action") : nextIndex,
				"aria-current": isSelectedPage ? "step" : "false",
				"aria-live": isSelectedPage ? "polite" : "off",
				class: this.getClass(isSelectedPage, isPreviousPage),
				style: {
					cursor: isClickable ? "pointer" : "auto",
				},
				onclick: () => {
					if (isClickable) {
						vnode.attrs.navigateBackHandler(pageIndex)
					}
				},
			},
			isPreviousPage
				? m(Icon, {
						icon: Icons.Checkmark,
						size: IconSize.Medium,
						style: {
							fill: theme.content_bg,
						},
				  })
				: nextIndex,
		)
	}

	// Apply the correct styling based on the current page number
	private getClass(isSelectedPage: boolean, isPreviousPage: boolean) {
		if (isSelectedPage) {
			return "wizard-breadcrumb-active"
		} else if (isPreviousPage) {
			return "wizard-breadcrumb-previous"
		} else {
			return "wizard-breadcrumb"
		}
	}
}

export type WizardDialogAttrsBuilder<T> = {
	dialog: Dialog
	attrs: WizardDialogAttrs<T>
}

// Use to generate a new wizard
export function createWizardDialog<T>(
	data: T,
	pages: ReadonlyArray<WizardPageWrapper<T>>,
	closeAction: (() => $Promisable<void>) | null = null,
	dialogType: DialogType.EditLarge | DialogType.EditSmall,
	cancelButtonText: TranslationKey | null = null,
): WizardDialogAttrsBuilder<T> {
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
	const wizardDialogAttrs = new WizardDialogAttrs(data, pages, cancelButtonText, closeActionWrapper)
	const wizardDialog =
		dialogType === DialogType.EditLarge
			? Dialog.largeDialog(wizardDialogAttrs.headerBarAttrs, child)
			: Dialog.editSmallDialog(wizardDialogAttrs.headerBarAttrs, () => m(child))

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
