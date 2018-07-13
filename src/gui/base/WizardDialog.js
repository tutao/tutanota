// @flow
import m from "mithril"
import {Dialog} from "./Dialog"
import {DialogHeaderBar} from "./DialogHeaderBar"
import {assertMainOrNode} from "../../api/Env"
import {windowFacade} from "../../misc/WindowFacade"
import {Keys} from "../../misc/KeyManager"
import {Button, ButtonType} from "./Button"
import {Icons} from "./icons/Icons"
import {Icon} from "./Icon"
import {theme} from "../theme"
import {lang} from "../../misc/LanguageViewModel"

assertMainOrNode()

export interface WizardPage<T> extends Component {
	headerTitle():string;
	nextAction():Promise<?T>;
	isNextAvailable():boolean;
	getUncheckedWizardData():T;
	setPageActionHandler(handler: WizardPageActionHandler<T>):void;
	updateWizardData(wizardData: T):void;
}

export interface WizardPageActionHandler<T> {
	cancel():void;
	showNext(wizardData: T):void
}

export class WizardDialog<T> {
	view: Function;
	dialog: Dialog;
	_pages: Array<WizardPage<T>>;
	_currentPage: WizardPage<T>;
	_backButton: Button;
	_nextButton: Button;

	constructor(wizardPages: Array<WizardPage<T>>) {
		this._pages = wizardPages
		this._currentPage = wizardPages[0]
		this._pages.forEach(page => page.setPageActionHandler({
			cancel: () => this._close(),
			showNext: (wizardData: T) => this._handlePageConfirm(wizardData)
		}))


		let backAction = () => {
			let pageIndex = this._pages.indexOf(this._currentPage)
			if (pageIndex > 0) {
				this._backAction(pageIndex - 1)
				m.redraw()
			} else {
				this._close()
			}
		}
		this._backButton = new Button(() => {
			return this._pages.indexOf(this._currentPage) == 0 ? lang.get("cancel_action") : lang.get("back_action")
		}, backAction).setType(ButtonType.Secondary)

		this._nextButton = new Button("next_action", () => this._nextAction()).setType(ButtonType.Secondary)
			.setIsVisibleHandler(() => this._currentPage.isNextAvailable() && this._pages.indexOf(this._currentPage) != (this._pages.length - 1))

		let pagingButtons: Component[] = wizardPages.map((page, index) => new WizardPagingButton(index, () => this._pages.indexOf(this._currentPage), (index) => this._backAction(index)))

		let headerBar = new DialogHeaderBar()
			.addLeft(this._backButton)
			.setMiddle(() => this._currentPage.headerTitle())
			.addRight(this._nextButton)

		this.view = () => m("#wizardDialogContent.pt", [
				m(".flex-space-around.border-top", {
					style: {
						height: "22px",
						marginTop: "22px"
					}
				}, pagingButtons.map(b => m(b))),
				m(this._currentPage),
			]
		)
		this.dialog = Dialog.largeDialog(headerBar, this)
			.addShortcut({
				key: Keys.ESC,
				exec: () => this._close(),
				help: "closeDialog_msg"
			}).setCloseHandler(backAction)
	}


	_backAction(targetIndex: number): void {
		const wizardData = this._currentPage.getUncheckedWizardData()
		this._currentPage = this._pages[targetIndex]
		this._currentPage.updateWizardData(wizardData)
	}

	_nextAction(): void {
		this._currentPage.nextAction().then(wizardData => {
			if (wizardData) {
				this._handlePageConfirm(wizardData)
			}
		})
	}

	_handlePageConfirm(wizardData: T) {
		const currentIndex = this._pages.indexOf(this._currentPage)
		const lastIndex = this._pages.length - 1
		let finalAction = currentIndex == lastIndex
		if (finalAction) {
			this._close()
		} else {
			this._currentPage = currentIndex < lastIndex ? this._pages[currentIndex + 1] : this._pages[lastIndex]
			console.log("handle page confirm new index=", currentIndex + 1, wizardData, this._currentPage)
			this._currentPage.updateWizardData(wizardData)
		}
	}

	show() {
		this.dialog.show()
		windowFacade.checkWindowClosing(true)
	}

	_close() {
		windowFacade.checkWindowClosing(false)
		this.dialog.close()
	}
}

class WizardPagingButton {
	view: Function;

	constructor(pageIndex: number, getSelectedPageIndex: ()=>number, navigateBackHandler: (pageIndex: number)=>void) {
		this.view = () => {
			const selectedPageIndex = getSelectedPageIndex()
			return m(".button-content.flex-center.items-center", {
					style: {
						marginTop: "-22px",
						cursor: (pageIndex < selectedPageIndex) ? "pointer" : "auto"
					},
					onclick: () => {
						if (pageIndex < selectedPageIndex) {
							navigateBackHandler(pageIndex)
						}
					}
				}, m(".button-icon.flex-center.items-center", {
					style: {
						border: selectedPageIndex == pageIndex ? `2px solid ${theme.content_accent}` : `1px solid ${theme.content_button}`,
						color: selectedPageIndex == pageIndex ? theme.content_accent : "inherit",
						'background-color': (pageIndex < selectedPageIndex) ? theme.content_button : theme.content_bg,

					}
				}, pageIndex < selectedPageIndex ? m(Icon, {
						icon: Icons.Checkmark,
						style: {
							fill: theme.content_button_icon,
							'background-color': theme.content_button
						}
					}) : "" + (pageIndex + 1))
			)
		}

	}
}