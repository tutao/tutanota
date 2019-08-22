// @flow
import m from "mithril"
import {Dialog} from "./Dialog"
import {assertMainOrNode} from "../../api/Env"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonType} from "./ButtonN"
import {Icons} from "./icons/Icons"
import {Icon} from "./Icon"
import {getContentButtonIconBackground, theme} from "../theme"
import {lang} from "../../misc/LanguageViewModel"
import type {DialogHeaderBarAttrs} from "./DialogHeaderBar"
import {Keys} from "../../api/common/TutanotaConstants"

assertMainOrNode()

export interface WizardPageAttrs<T> {
	/** Title of the page that is shown in the header bar of the WizardDialog*/
	headerTitle(): string,

	/** Action that needs to be executed before switching to the next page.
	 * @return true if the action was successfull and the next page can be shown, false otherwise.
	 **/
	nextAction(showErrorDialog: boolean): Promise<boolean>,

	/**
	 * Checks if the page can be skipped.
	 */
	isSkipAvailable(): boolean,

	/**
	 * Checks if the page is enabled and can be displayed.
	 */
	isEnabled(): boolean,

	/**
	 * The actual data, which is the same for the entire wizard needs to be also accessible to each page
	 */
	+data: T,
}

export interface WizardPageN<T> extends MComponent<WizardPageAttrs<T>> {
}

export const WizardEventType = Object.freeze({
	SHOWNEXTPAGE: "showNextWizardDialogPage",
	CLOSEDIALOG: "closeWizardDialog"
})
export type WizardEventTypeEnum = $Values<typeof WizardEventType>;

// A WizardPage dispatches this event to inform the parent WizardDialogN to close the dialog
export function emitWizardEvent(dom: ?HTMLElement, eventType: WizardEventTypeEnum) {
	if (dom) {
		const event = new Event(eventType, {bubbles: true, cancelable: true})
		dom.dispatchEvent(event)
	}
}

class WizardDialogN<T> implements MComponent<WizardDialogAttrs<T>> {

	_closeWizardDialogListener: EventListener
	_showNextWizardDialogPageListener: EventListener

	oncreate(vnode: Vnode<LifecycleAttrs<WizardDialogAttrs<T>>>) {
		// We listen for events triggered by the child WizardPages to close the dialog or show the next page
		const dom: HTMLElement = vnode.dom
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

	onremove(vnode: Vnode<LifecycleAttrs<WizardDialogAttrs<T>>>) {
		const dom: HTMLElement = vnode.dom
		if (this._closeWizardDialogListener) dom.removeEventListener(WizardEventType.CLOSEDIALOG, this._closeWizardDialogListener)
		if (this._showNextWizardDialogPageListener) dom.removeEventListener(WizardEventType.SHOWNEXTPAGE, this._showNextWizardDialogPageListener)
	}

	view(vnode: Vnode<LifecycleAttrs<WizardDialogAttrs<T>>>) {
		const a = vnode.attrs
		return m("#wizardDialogContent.pt", [
				m("#wizard-paging.flex-space-around.border-top", {
					style: {
						height: "22px",
						marginTop: "22px"
					}
				}, a._getEnabledPages().map((p, index) => m(WizardPagingButton, {
					pageIndex: index,
					getSelectedPageIndex: () => a._getEnabledPages().indexOf(a.currentPage),
					navigateBackHandler: (index) => a._goToPageAction(index)
				}))),
				a.currentPage ? m(a.currentPage.componentClass, a.currentPage.attrs) : null
			]
		)
	}
}


type WizardPageWrapper<T> = {
	attrs: WizardPageAttrs<T>,
	componentClass: Class<MComponent<WizardPageAttrs<T>>>
}

class WizardDialogAttrs<T> {
	data: T
	pages: Array<WizardPageWrapper<T>>
	currentPage: ?WizardPageWrapper<T>
	closeAction: () => Promise<void>

	constructor(data: T, pages: Array<WizardPageWrapper<T>>, closeAction?: () => Promise<void>) {
		this.data = data
		this.pages = pages
		this.currentPage = pages.find(p => p.attrs.isEnabled())
		this.closeAction = closeAction ? () => closeAction() : () => {
			return Promise.resolve()
		}
	}

	goToPreviousPageOrClose(): void {
		let pageIndex = this._getEnabledPages().indexOf(this.currentPage)
		if (pageIndex > 0) {
			this._goToPageAction(pageIndex - 1)
			m.redraw()
		} else {
			this.closeAction()
		}
	}

	getHeaderBarAttrs<T>(): DialogHeaderBarAttrs {
		const backButtonAttrs: ButtonAttrs = {
			label: () => this._getEnabledPages().indexOf(this.currentPage) === 0
				? lang.get("cancel_action")
				: lang.get("back_action"),
			click: () => this.goToPreviousPageOrClose(),
			type: ButtonType.Secondary
		}
		const skipButtonAttrs: ButtonAttrs = {
			label: "skip_action",
			click: () => this.goToNextPageOrCloseWizard(),
			type: ButtonType.Secondary,
			isVisible: () => this.currentPage ? (this.currentPage.attrs.isSkipAvailable()
				&& this._getEnabledPages().indexOf(this.currentPage)
				!== (this._getEnabledPages().length - 1)) : false
		}
		return {
			left: [backButtonAttrs],
			right: [skipButtonAttrs],
			middle: () => this.currentPage ? this.currentPage.attrs.headerTitle() : ""
		}
	}


	_getEnabledPages(): WizardPageWrapper<T>[] {
		return this.pages.filter(p => p.attrs.isEnabled())
	}

	_goToPageAction(targetIndex: number): void {
		const pages = this._getEnabledPages()
		this.currentPage = pages[targetIndex]
	}


	goToNextPageOrCloseWizard() {
		const pages = this._getEnabledPages()
		const currentIndex = pages.indexOf(this.currentPage)
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
	pageIndex: number,
	getSelectedPageIndex: () => number,
	navigateBackHandler: (pageIndex: number) => void
}

//exported for old-style WizardDialog.js
export class WizardPagingButton {
	view(vnode: Vnode<WizardPagingButtonAttrs>): Children {
		const selectedPageIndex = vnode.attrs.getSelectedPageIndex()
		const pageIndex = vnode.attrs.pageIndex
		const filledBg = getContentButtonIconBackground()
		return m(".button-content.flex-center.items-center", {
				style: {
					marginTop: "-22px",
					cursor: (pageIndex < selectedPageIndex) ? "pointer" : "auto"
				},
				onclick: () => {
					if (pageIndex < selectedPageIndex) {
						vnode.attrs.navigateBackHandler(pageIndex)
					}
				}
			}, m(".button-icon.flex-center.items-center", {
				style: {
					border: selectedPageIndex === pageIndex ?
						`2px solid ${theme.content_accent}` : `1px solid ${filledBg}`,
					color: selectedPageIndex === pageIndex ? theme.content_accent : "inherit",
					'background-color': (pageIndex < selectedPageIndex) ? filledBg : theme.content_bg,

				}
			}, pageIndex < selectedPageIndex ? m(Icon, {
				icon: Icons.Checkmark,
				style: {
					fill: theme.content_button_icon,
					'background-color': filledBg
				}
			}) : "" + (pageIndex + 1))
		)
	}
}

export type WizardDialogAttrsBuilder<T> = {
	dialog: Dialog,
	attrs: WizardDialogAttrs<T>
}

// Use to generate a new wizard
export function createWizardDialog<T>(data: T, pages: Array<WizardPageWrapper<T>>, closeAction?: () => Promise<void>): WizardDialogAttrsBuilder<T> {

	// We need the close action of the dialog before we can create the proper attributes
	const headerBarAttrs = {}
	const child = {view: () => null}
	const wizardDialog = Dialog.largeDialog(headerBarAttrs, child)
	const wizardDialogAttrs = new WizardDialogAttrs(data, pages, closeAction ? () => closeAction().then(wizardDialog.close()) : () => Promise.resolve(wizardDialog.close()))

	// We replace the dummy values from dialog creation
	const wizardDialogHeaderBarAttrs = wizardDialogAttrs.getHeaderBarAttrs()
	Object.keys(wizardDialogHeaderBarAttrs).forEach((key) => {
		headerBarAttrs[key] = wizardDialogHeaderBarAttrs[key]
	})
	child.view = () => m(WizardDialogN, wizardDialogAttrs)

	wizardDialog.addShortcut({
		key: Keys.ESC,
		exec: () => wizardDialogAttrs.closeAction(),
		help: "close_alt"
	}).setCloseHandler(() => wizardDialogAttrs.goToPreviousPageOrClose())
	return {
		dialog: wizardDialog,
		attrs: wizardDialogAttrs
	}
}