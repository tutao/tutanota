import m, {Child, Children, Component, Vnode, VnodeDOM} from "mithril"
import {Dialog} from "./Dialog"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonType} from "./ButtonN"
import {Icons} from "./icons/Icons"
import {Icon} from "./Icon"
import {getContentButtonIconBackground, theme} from "../theme"
import {lang} from "../../misc/LanguageViewModel"
import type {DialogHeaderBarAttrs} from "./DialogHeaderBar"
import {Keys} from "../../api/common/TutanotaConstants"
import {assertMainOrNode} from "../../api/common/Env"
import {typedEntries, typedKeys} from "@tutao/tutanota-utils"

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
}

export interface WizardPageN<T> extends Component<WizardPageAttrs<T>> {
}

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

class WizardDialogN<T> implements Component<WizardDialogAttrs<T>> {
	_closeWizardDialogListener: EventListener
	_showNextWizardDialogPageListener: EventListener

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
				vnode.attrs.currentPage.attrs.nextAction(true).then(ready => {
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
		return m("#wizardDialogContent.pt", [
			m(
				"#wizard-paging.flex-space-around.border-top",
				{
					style: {
						height: "22px",
						marginTop: "22px",
					},
				},
				a._getEnabledPages().map((p, index) =>
					m(WizardPagingButton, {
						pageIndex: index,
						getSelectedPageIndex: () => a.currentPage ? a._getEnabledPages().indexOf(a.currentPage) : -1,
						navigateBackHandler: index => a._goToPageAction(index),
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

export function wizardPageWrapper<T, A extends WizardPageAttrs<T>>(component: Class<Component<A>>, attributes: A,): WizardPageWrapper<T> {
	return {
		attrs: attributes,
		view: () => m(component, attributes)
	}
}

class WizardDialogAttrs<T> {
	readonly data: T
	pages: ReadonlyArray<WizardPageWrapper<T>>
	currentPage: WizardPageWrapper<T> | null
	closeAction: () => Promise<void>

	constructor(data: T, pages: ReadonlyArray<WizardPageWrapper<T>>, closeAction?: () => Promise<void>) {
		this.data = data
		this.pages = pages
		this.currentPage = pages.find(p => p.attrs.isEnabled()) ?? null
		this.closeAction = closeAction
			? () => closeAction()
			: () => {
				return Promise.resolve()
			}
	}

	goToPreviousPageOrClose(): void {
		let pageIndex = this.currentPage ? this._getEnabledPages().indexOf(this.currentPage) : -1

		if (pageIndex > 0) {
			this._goToPageAction(pageIndex - 1)

			m.redraw()
		} else {
			this.closeAction()
		}
	}

	getHeaderBarAttrs<T>(): DialogHeaderBarAttrs {
		const backButtonAttrs: ButtonAttrs = {
			label: () => (this.currentPage && this._getEnabledPages().includes(this.currentPage) ? lang.get("cancel_action") : lang.get("back_action")),
			click: () => this.goToPreviousPageOrClose(),
			type: ButtonType.Secondary,
		}
		const skipButtonAttrs: ButtonAttrs = {
			label: "skip_action",
			click: () => this.goToNextPageOrCloseWizard(),
			type: ButtonType.Secondary,
		}
		return {
			left: [backButtonAttrs],
			right: () => (
				this.currentPage && this.currentPage.attrs.isSkipAvailable()
				&& this._getEnabledPages().indexOf(this.currentPage) !== this._getEnabledPages().length - 1
			)
				? [skipButtonAttrs]
				: [],
			middle: () => (this.currentPage ? this.currentPage.attrs.headerTitle() : ""),
		}
	}

	_getEnabledPages(): Array<WizardPageWrapper<T>> {
		return this.pages.filter(p => p.attrs.isEnabled())
	}

	_goToPageAction(targetIndex: number): void {
		const pages = this._getEnabledPages()

		this.currentPage = pages[targetIndex]
	}

	goToNextPageOrCloseWizard() {
		const pages = this._getEnabledPages()

		const currentIndex = this.currentPage ? pages.indexOf(this.currentPage) : -1
		const lastIndex = pages.length - 1
		let finalAction = currentIndex === lastIndex

		if (finalAction) {
			this.closeAction()
		} else {
			this.currentPage = currentIndex < lastIndex ? pages[currentIndex + 1] : pages[lastIndex]
		}
	}
}

type WizardPagingButtonAttrs = {
	pageIndex: number
	getSelectedPageIndex: () => number
	navigateBackHandler: (pageIndex: number) => void
}

//exported for old-style WizardDialog.js
export class WizardPagingButton {
	view(vnode: Vnode<WizardPagingButtonAttrs>): Children {
		const selectedPageIndex = vnode.attrs.getSelectedPageIndex()
		const pageIndex = vnode.attrs.pageIndex
		const filledBg = getContentButtonIconBackground()
		return m(
			".button-content.flex-center.items-center",
			{
				style: {
					marginTop: "-22px",
					cursor: pageIndex < selectedPageIndex ? "pointer" : "auto",
				},
				onclick: () => {
					if (pageIndex < selectedPageIndex) {
						vnode.attrs.navigateBackHandler(pageIndex)
					}
				},
			},
			m(
				".button-icon.flex-center.items-center",
				{
					style: {
						border: selectedPageIndex === pageIndex ? `2px solid ${theme.content_accent}` : `1px solid ${filledBg}`,
						color: selectedPageIndex === pageIndex ? theme.content_accent : "inherit",
						"background-color": pageIndex < selectedPageIndex ? filledBg : theme.content_bg,
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
export function createWizardDialog<T>(data: T, pages: ReadonlyArray<WizardPageWrapper<T>>, closeAction?: () => Promise<void>): WizardDialogAttrsBuilder<T> {
	// We need the close action of the dialog before we can create the proper attributes
	const headerBarAttrs: DialogHeaderBarAttrs = {}

	let view: () => Children = () => null

	const child: Component<void> = {
		view: () => view(),
	}
	const wizardDialog = Dialog.largeDialog(headerBarAttrs, child)
	const wizardDialogAttrs = new WizardDialogAttrs(
		data,
		pages,
		closeAction
			? () => closeAction().then(() => wizardDialog.close())
			: async () => wizardDialog.close(),
	)
	// We replace the dummy values from dialog creation
	const wizardDialogHeaderBarAttrs: DialogHeaderBarAttrs = wizardDialogAttrs.getHeaderBarAttrs()
	Object.entries(wizardDialogHeaderBarAttrs).forEach(([key, value]) => {
		// @ts-ignore
		headerBarAttrs[key] = value
	})

	view = () => m(WizardDialogN, wizardDialogAttrs)

	wizardDialog
		.addShortcut({
			key: Keys.ESC,
			exec: () => {
				wizardDialogAttrs.closeAction()
			},
			help: "close_alt",
		})
		.setCloseHandler(() => wizardDialogAttrs.goToPreviousPageOrClose())
	return {
		dialog: wizardDialog,
		attrs: wizardDialogAttrs,
	}
}