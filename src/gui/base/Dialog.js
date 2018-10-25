// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Button, ButtonType} from "./Button"
import {modal} from "./Modal"
import {alpha, animations, DefaultAnimationTime, opacity, transform} from "../animation/Animations"
import {ease} from "../animation/Easing"
import {lang} from "../../misc/LanguageViewModel"
import {DialogHeaderBar} from "./DialogHeaderBar"
import {TextField, Type} from "./TextField"
import {assertMainOrNode} from "../../api/Env"
import {focusNext, focusPrevious, Keys} from "../../misc/KeyManager"
import {neverNull} from "../../api/common/utils/Utils"
import {DropDownSelector} from "./DropDownSelector"
import {theme} from "../theme"
import {px, size} from "../size"
import {HabReminderImage} from "./icons/Icons"
import {windowFacade} from "../../misc/WindowFacade"
import {requiresStatusBarHack} from "../main-styles"

assertMainOrNode()

export const INPUT = "input, textarea, div[contenteditable='true']"

export const DialogType = {
	Progress: "Progress",
	Alert: "Alert",
	Reminder: "Reminder",
	EditSmall: "EditSmall",
	EditMedium: "EditMedium",
	EditLarge: "EditLarge"
}
export type DialogTypeEnum = $Values<typeof DialogType>;

export class Dialog {
	static _keyboardHeight = 0;
	buttons: Button[];
	_domDialog: HTMLElement;
	_shortcuts: Shortcut[];
	view: Function;
	visible: boolean;
	_focusOnLoadFunction: Function;
	_closeHandler: ?() => void;

	constructor(dialogType: DialogTypeEnum, childComponent: MComponent<any>) {
		this.buttons = []
		this.visible = false
		this._focusOnLoadFunction = this._defaultFocusOnLoad
		this._shortcuts = [
			{
				key: Keys.TAB,
				shift: true,
				exec: () => focusNext(this._domDialog),
				help: "selectPrevious_action"
			},
			{
				key: Keys.TAB,
				shift: false,
				exec: () => focusPrevious(this._domDialog),
				help: "selectNext_action"
			},
		]
		this.view = (): VirtualElement => {
			let mobileMargin = px(size.hpad)
			return m(this._getDialogWrapperStyle(dialogType), {
					style: {
						paddingTop: requiresStatusBarHack() ? '20px' : 'env(safe-area-inset-top)'
					}
				},  // controls vertical alignment
				m(".flex.justify-center.align-self-stretch.rel"
					+ (dialogType === DialogType.EditLarge ? ".flex-grow" : ".transition-margin"), {  // controls horizontal alignment
						style: {
							'margin-top': mobileMargin,
							'margin-left': mobileMargin,
							'margin-right': mobileMargin,
							'margin-bottom': (Dialog._keyboardHeight > 0)
								? px(Dialog._keyboardHeight)
								: dialogType === DialogType.EditLarge ? 0 : mobileMargin,
						},
					}, m(this._getDialogStyle(dialogType), {
						onclick: (e: MouseEvent) => e.stopPropagation(), // do not propagate clicks on the dialog as the Modal expects all propagated clicks to be clicks on the background

						oncreate: vnode => {
							this._domDialog = vnode.dom
							let animation = null
							if (dialogType === DialogType.EditLarge) {
								vnode.dom.style.transform = `translateY(${window.innerHeight}px)`
								animation = animations.add(this._domDialog, transform(transform.type.translateY, window.innerHeight, 0))
							} else {
								let bgcolor = theme.content_bg
								let children = Array.from(this._domDialog.children)
								children.forEach(child => child.style.opacity = '0')
								this._domDialog.style.backgroundColor = `rgba(0,0,0,0)`
								animation = Promise.all([
									animations.add(this._domDialog, alpha(alpha.type.backgroundColor, bgcolor, 0, 1)),
									animations.add(children, opacity(0, 1, true), {delay: DefaultAnimationTime / 2})
								])
							}

							// select first input field. blur first to avoid that users can enter text in the previously focused element while the animation is running
							window.requestAnimationFrame(() => {
								if (document.activeElement && typeof document.activeElement.blur === "function") {
									document.activeElement.blur()
								}
							})
							animation.then(() => {
								this._focusOnLoadFunction()
							})
						},
					}, m(childComponent))
				)
			)
		}
	}

	_defaultFocusOnLoad() {
		let inputs = Array.from(this._domDialog.querySelectorAll(INPUT))
		if (inputs.length > 0) {
			inputs[0].focus()
		}
	}

	/**
	 * By default the focus is set on the first text field after this dialog is fully visible. This behavor can be overwritten by calling this function.
	 */
	setFocusOnLoadFunction(callback: Function): void {
		this._focusOnLoadFunction = callback
	}

	_getDialogWrapperStyle(dialogType: DialogTypeEnum) {
		// change direction of axis to handle resize of dialogs (iOS keyboard open changes size)
		let dialogWrapperStyle = ".fill-absolute.flex.items-stretch.flex-column"
		if (dialogType === DialogType.EditLarge) {
			dialogWrapperStyle += ".flex-start";
		} else {
			dialogWrapperStyle += ".flex-center" // vertical alignment
		}
		return dialogWrapperStyle
	}

	_getDialogStyle(dialogType: DialogTypeEnum) {
		let dialogStyle = ".dialog.content-bg.flex-grow"
		if (dialogType === DialogType.Progress) {
			dialogStyle += ".dialog-width-s.dialog-progress"
		} else if (dialogType === DialogType.Alert) {
			dialogStyle += ".dialog-width-alert.pt"
		} else if (dialogType === DialogType.Reminder) {
			dialogStyle += ".dialog-width-m.pt.flex.flex-column"
		} else if (dialogType === DialogType.EditSmall) {
			dialogStyle += ".dialog-width-s.flex.flex-column"
		} else if (dialogType === DialogType.EditMedium) {
			dialogStyle += ".dialog-width-m"
		} else if (dialogType === DialogType.EditLarge) {
			dialogStyle += ".dialog-width-l"
		}
		return dialogStyle
	}

	addButton(button: Button): Dialog {
		this.buttons.push(button)
		return this
	}

	addShortcut(shortcut: Shortcut): Dialog {
		this._shortcuts.push(shortcut)
		return this
	}

	/**
	 * Sets a close handler to the dialog. If set the handler will be notifed wehn onClose is called on the dialog.
	 * The handler must is then responsible for closing the dialog.
	 */
	setCloseHandler(closeHandler: ?() => void): Dialog {
		this._closeHandler = closeHandler
		return this
	}

	shortcuts() {
		return this._shortcuts
	}

	show(): Dialog {
		modal.display(this)
		this.visible = true
		return this
	}

	/**
	 * Removes the dialog from the current view.
	 */
	close(): void {
		this.visible = false
		modal.remove(this)
	}


	/**
	 * Should be called to close a dialog. Notifies the closeHandler about the close attempt.
	 */
	onClose(): void {
		if (this._closeHandler) {
			this._closeHandler()
		} else {
			this.close()
		}
	}


	/**
	 * Is invoked from modal as the two animations (background layer opacity and dropdown) should run in parallel
	 * @returns {Promise.<void>}
	 */
	hideAnimation(): Promise<void> {
		let bgcolor = theme.content_bg
		return Promise.all([
			animations.add(this._domDialog.children, opacity(1, 0, true)),
			animations.add(this._domDialog, alpha(alpha.type.backgroundColor, bgcolor, 1, 0), {
				delay: DefaultAnimationTime / 2,
				easing: ease.linear
			})
		]).then(() => {
		})
	}

	backgroundClick(e: MouseEvent) {
	}

	static error(messageIdOrMessageFunction: string | lazy<string>): Promise<void> {
		return Promise.fromCallback(cb => {
			let buttons = []

			let closeAction = () => {
				(dialog: any).close()
				setTimeout(() => cb(null), DefaultAnimationTime)
			}
			buttons.push(new Button("ok_action", closeAction).setType(ButtonType.Primary))

			let message = messageIdOrMessageFunction instanceof Function ?
				messageIdOrMessageFunction() : lang.get(messageIdOrMessageFunction)
			let lines = message.split("\n")

			let dialog = new Dialog(DialogType.Alert, {
				view: () =>
					lines.map(line => m(".dialog-contentButtonsBottom.text-break", line)).concat(
						m(".flex-center.dialog-buttons", buttons.map(b => m(b)))
					)
			})
			dialog.setCloseHandler(closeAction)

			dialog.addShortcut({
				key: Keys.RETURN,
				shift: false,
				exec: closeAction,
				help: "close_alt"
			})

			dialog.addShortcut({
				key: Keys.ESC,
				shift: false,
				exec: closeAction,
				help: "close_alt"
			})

			dialog.show()
		})
	}


	static legacyDownload(filename: string, href: string): Promise<void> {
		return Promise.fromCallback(cb => {
			let buttons = []
			let closeAction = () => {
				(dialog: any).close()
				setTimeout(() => cb(null), DefaultAnimationTime)
			}

			buttons.push(new Button("close_alt", closeAction).setType(ButtonType.Primary))

			let dialog = new Dialog(DialogType.Alert, {
				view: () => m("", [
					m(".dialog-contentButtonsBottom.text-break", [
						m("a.pt.b.block.text-ellipsis", {
							href: href,
							target: "_blank",
							onclick: () => {
								dialog.close()
								cb(null)
							}
						}, filename),
						m(".pt", lang.get("saveDownloadNotPossibleSafariDesktop_msg"))
					]),
					m(".flex-center.dialog-buttons", buttons.map(b => m(b)))
				])
			})
			dialog.setCloseHandler(closeAction)
			dialog.show()
		})
	}


	static confirm(messageIdOrMessageFunction: string | lazy<string>, confirmId: ?string = "ok_action"): Promise<boolean> {
		return Promise.fromCallback(cb => {
			let buttons = []
			let cancelAction = () => {
				dialog.close()
				setTimeout(() => cb(null, false), DefaultAnimationTime)
			}

			let confirmAction = () => {
				dialog.close()
				setTimeout(() => cb(null, true), DefaultAnimationTime)
			}

			buttons.push(new Button("cancel_action", cancelAction).setType(ButtonType.Secondary))
			buttons.push(new Button(confirmId, confirmAction).setType(ButtonType.Primary))

			let dialog = new Dialog(DialogType.Alert, {
				view: () => [
					m(".dialog-contentButtonsBottom.text-break.text-prewrap.selectable",
						messageIdOrMessageFunction instanceof Function ?
							messageIdOrMessageFunction() : lang.get(messageIdOrMessageFunction)),
					m(".flex-center.dialog-buttons", buttons.map(b => m(b)))
				]
			})
			dialog.setCloseHandler(cancelAction)

			dialog.addShortcut({
				key: Keys.ESC,
				shift: false,
				exec: cancelAction,
				help: "cancel_action"
			})

			dialog.addShortcut({
				key: Keys.RETURN,
				shift: false,
				exec: confirmAction,
				help: neverNull(confirmId) //ok?
			})

			dialog.show()
		})
	}

	// used in admin client
	static save(title: lazy<string>, saveAction: action, child: Component): Promise<void> {
		return Promise.fromCallback(cb => {
			let actionBar = new DialogHeaderBar()

			let closeAction = () => {
				saveDialog.close()
				setTimeout(() => cb(), DefaultAnimationTime)
			}
			actionBar.addLeft(new Button("close_alt", closeAction).setType(ButtonType.Secondary))
			actionBar.addRight(new Button("save_action", () => {
				saveAction().then(() => {
					saveDialog.close()
					setTimeout(() => cb(null), DefaultAnimationTime)
				})
			}).setType(ButtonType.Primary))
			let saveDialog = new Dialog(DialogType.EditMedium, {
				view: () => m("", [
					m(".dialog-header.plr-l", m(actionBar)),
					m(".plr-l.pb.text-break", m(child))
				])
			})
			actionBar.setMiddle(title)
			saveDialog.setCloseHandler(closeAction)
			saveDialog.show()
		})
	}

	static reminder(title: string, message: string, link: string): Promise<boolean> {
		return Promise.fromCallback(cb => {
			let buttons = []
			let cancelAction = () => {
				dialog.close()
				setTimeout(() => cb(null, false), DefaultAnimationTime)
			}
			buttons.push(new Button("upgradeReminderCancel_action", cancelAction).setType(ButtonType.Secondary))
			buttons.push(new Button("showMoreUpgrade_action", () => {
				dialog.close()
				setTimeout(() => cb(null, true), DefaultAnimationTime)
			}).setType(ButtonType.Primary))

			let dialog = new Dialog(DialogType.Reminder, {
				view: () => [
					m(".dialog-contentButtonsBottom.text-break.scroll", [
						m(".h2.pb", title),
						m(".flex-direction-change.items-center", [
							m(".pb", message),
							m("img[src=" + HabReminderImage + "].dialog-img.pb", {
								style: {
									'min-width': '150px'
								}
							})
						]),
						m("a[href=" + link + "][target=_blank]", link)
					]),
					m(".flex-center.dialog-buttons.flex-no-grow-no-shrink-auto", buttons.map(b => m(b)))
				]
			})
			dialog.setCloseHandler(cancelAction)

			dialog.addShortcut({
				key: Keys.ESC,
				shift: false,
				exec: cancelAction,
				help: "cancel_action"
			})

			dialog.show()
		})
	}

	/**
	 * Shows a dialog with a text field input and ok/cancel buttons.
	 * @param   props.validator Called when "Ok" is clicked. Must return null if the input is valid or an error messageID if it is invalid, so an error message is shown.
	 * @param   props.okAction called after successful validation.
	 * @param   props.cancelAction called when allowCancel is true and the cancel button/shortcut was pressed.
	 * @returns the Dialog
	 */
	static showActionDialog(props: {|
		title: Stream<string> | string,
		child: Component,
		validator?: validator,
		okAction: null | (dialog: Dialog) => mixed,
		allowCancel?: boolean,
		okActionTextId?: string,
		cancelAction?: (dialog: Dialog) => mixed,
		type?: DialogTypeEnum,
	|}): Dialog {
		const {title, child, okAction, validator, allowCancel, okActionTextId, cancelAction, type} =
			Object.assign({}, {allowCancel: true, okActionTextId: "ok_action", type: DialogType.EditSmall}, props)
		let actionBar = new DialogHeaderBar()

		let dialog = new Dialog(type, {
			view: () => [
				m(".dialog-header.plr-l", m(actionBar)),
				m(".dialog-max-height.plr-l.pb.text-break.scroll", m(child))
			]
		})

		let doCancel = () => {
			if (cancelAction) {
				cancelAction(dialog)
			}
			dialog.close()
		}

		let doAction = () => {
			if (!okAction) {
				return
			}
			let error_id = null
			if (validator) {
				error_id = validator()
			}
			if (error_id) {
				Dialog.error(error_id)
				return
			} else {
				okAction(dialog)
			}
		}


		if (okAction) {
			actionBar.addRight(new Button(okActionTextId, doAction).setType(ButtonType.Primary))
			//todo check if you want to have this option or just have a text area where you can shift enter to add line breaks to a div
			/*dialog.addShortcut({
				key: Keys.RETURN,
				shift: true,
				exec: doAction,
				help: okActionTextId
			})
		*/
		}

		if (allowCancel) {
			actionBar.addLeft(new Button("cancel_action", doCancel).setType(ButtonType.Secondary))
			dialog.addShortcut({
				key: Keys.ESC,
				shift: false,
				exec: doCancel,
				help: "cancel_action"
			})
		}

		if (title) {
			if (title instanceof Function) {
				actionBar.setMiddle(title)
			} else {
				actionBar.setMiddle(stream(title))
			}
		}

		dialog.setCloseHandler(doCancel)
		return dialog.show()
	}

	/**
	 * Shows a dialog with a text field input and ok/cancel buttons.
	 * @param inputValidator Called when "Ok" is clicked receiving the entered text. Must return null if the text is valid or an error messageId if the text is invalid, so an error message is shown.
	 * @returns A promise resolving to the entered text. The returned promise is only resolved if "ok" is clicked.
	 */
	static showTextInputDialog(titleId: string, labelIdOrLabelFunction: string | lazy<string>, infoMsgId: ?string, value: string, inputValidator: ?stringValidator): Promise<string> {
		return Promise.fromCallback(cb => {
			let textField = new TextField(labelIdOrLabelFunction, () => {
				return (infoMsgId) ? lang.get(infoMsgId) : ""
			})
			textField.value(value)

			let textInputOkAction = (dialog) => {
				cb(null, textField.value())
				dialog.close()
			}

			Dialog.showActionDialog({
				title: lang.get(titleId),
				child: {view: () => m(textField)},
				validator: () => inputValidator ? inputValidator(textField.value()) : null,
				okAction: textInputOkAction
			})
		})
	}


	/**
	 * Shows a dialog with a text area input and ok/cancel buttons.
	 * @param inputValidator Called when "Ok" is clicked receiving the entered text. Must return null if the text is valid or an error messageId if the text is invalid, so an error message is shown.
	 * @returns A promise resolving to the entered text. The returned promise is only resolved if "ok" is clicked.
	 */
	static showTextAreaInputDialog(titleId: string, labelIdOrLabelFunction: string | lazy<string>, infoMsgId: ?string, value: string, inputValidator: ?stringValidator): Promise<string> {
		return Promise.fromCallback(cb => {
			let textField = new TextField(labelIdOrLabelFunction, () => {
				return (infoMsgId) ? lang.get(infoMsgId) : ""
			}).setType(Type.Area)
			textField.value(value)

			let textAreaInputOkAction = (dialog) => {
				cb(null, textField.value())
				dialog.close()
			}

			Dialog.showActionDialog({
				title: lang.get(titleId),
				child: {view: () => m(textField)},
				validator: (inputValidator) ? inputValidator(textField.value()) : null,
				okAction: textAreaInputOkAction
			})
		})
	}


	static showDropDownSelectionDialog<T>(titleId: string, labelId: string, infoMsgId: ?string, items: {name: string, value: T}[], selectedValue: Stream<T>, dropdownWidth: ?number): Promise<T> {
		return Promise.fromCallback(cb => {
			let dropdown = new DropDownSelector(labelId, () => (infoMsgId) ? lang.get(infoMsgId) : "", items, selectedValue, dropdownWidth)

			let showDropDownSelectionOkAction = (dialog) => {
				cb(null, dropdown.selectedValue())
				dialog.close()
			}

			Dialog.showActionDialog({
				title: lang.get(titleId),
				child: {view: () => m(dropdown)},
				okAction: showDropDownSelectionOkAction
			})
		})
	}

	static largeDialog(headerBar: DialogHeaderBar, child: Component): Dialog {
		return new Dialog(DialogType.EditLarge, {
			view: () => {
				return m("", [
					m(".dialog-header.plr-l", m(headerBar)),
					m(".dialog-container.scroll",
						m(".fill-absolute.plr-l", m(child)))
				])
			}
		})
	}

	static _onKeyboardSizeChanged(newSize: number): void {
		Dialog._keyboardHeight = newSize
		m.redraw()
	}
}

windowFacade.addKeyboardSizeListener(Dialog._onKeyboardSizeChanged)
