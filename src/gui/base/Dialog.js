// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {modal} from "./Modal"
import {alpha, animations, DefaultAnimationTime, opacity, transform} from "../animation/Animations"
import {ease} from "../animation/Easing"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {assertMainOrNode} from "../../api/Env"
import type {KeyPress, Shortcut} from "../../misc/KeyManager"
import {focusNext, focusPrevious} from "../../misc/KeyManager"
import {getElevatedBackground} from "../theme"
import {px, size} from "../size"
import {HabReminderImage} from "./icons/Icons"
import {windowFacade} from "../../misc/WindowFacade"
import {requiresStatusBarHack} from "../main-styles"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN, ButtonType} from "./ButtonN"
import type {DialogHeaderBarAttrs} from "./DialogHeaderBar"
import {DialogHeaderBar} from "./DialogHeaderBar"
import type {TextFieldAttrs} from "./TextFieldN"
import {TextFieldN, Type} from "./TextFieldN"
import type {SelectorItemList} from "./DropDownSelectorN"
import {DropDownSelectorN} from "./DropDownSelectorN"
import {showProgressDialog} from "./ProgressDialog"
import {Keys} from "../../api/common/TutanotaConstants"
import {dialogAttrs} from "../../api/common/utils/AriaUtils"
import {styles} from "../styles"

assertMainOrNode()

export const INPUT = "input, textarea, div[contenteditable='true']"

export const DialogType = Object.freeze({
	Progress: "Progress",
	Alert: "Alert",
	Reminder: "Reminder",
	EditSmall: "EditSmall",
	EditMedium: "EditMedium",
	EditLarger: "EditLarger",
	EditLarge: "EditLarge"
})
export type DialogTypeEnum = $Values<typeof DialogType>;

type ActionDialogProps = {|
	title: lazy<string> | string,
	child: Component | lazy<Children>,
	validator?: ?validator,
	okAction: null | (Dialog) => mixed,
	allowCancel?: boolean,
	allowOkWithReturn?: boolean,
	okActionTextId?: TranslationKey,
	cancelAction?: ?(Dialog) => mixed,
	cancelActionTextId?: TranslationKey,
	type?: DialogTypeEnum,
|}

export class Dialog {
	static _keyboardHeight = 0;
	_domDialog: HTMLElement;
	_shortcuts: Shortcut[];
	view: Function;
	visible: boolean;
	_focusOnLoadFunction: Function;
	_closeHandler: ?() => mixed;
	_focusedBeforeShown: ?HTMLElement

	constructor(dialogType: DialogTypeEnum, childComponent: MComponent<any>) {
		this.visible = false
		this._focusOnLoadFunction = this._defaultFocusOnLoad
		this._shortcuts = [
			{
				key: Keys.TAB,
				shift: true,
				exec: () => focusPrevious(this._domDialog),
				help: "selectPrevious_action"
			},
			{
				key: Keys.TAB,
				shift: false,
				exec: () => focusNext(this._domDialog),
				help: "selectNext_action"
			},
		]
		this.view = (): VirtualElement => {
			let marginPx = px(size.hpad)
			const sidesMargin = styles.isSingleColumnLayout() && dialogType === DialogType.EditLarge ? "4px" : marginPx
			return m(this._getDialogWrapperStyle(dialogType), {
					style: {
						paddingTop: requiresStatusBarHack() ? '20px' : 'env(safe-area-inset-top)'
					}
				},  // controls vertical alignment
				// we need overflow-hidden (actually resulting in min-height: 0 instead of auto) here because otherwise the content of the dialog may make this wrapper grow bigger outside the window on some browsers, e.g. upgrade reminder on Firefox mobile
				m(".flex.justify-center.align-self-stretch.rel.overflow-hidden"
					+ (dialogType === DialogType.EditLarge ? ".flex-grow" : ".transition-margin"), {  // controls horizontal alignment
						style: {
							marginTop: marginPx,
							marginLeft: sidesMargin,
							marginRight: sidesMargin,
							'margin-bottom': (Dialog._keyboardHeight > 0)
								? px(Dialog._keyboardHeight)
								: dialogType === DialogType.EditLarge ? 0 : marginPx,
						},
					}, m(this._getDialogStyle(dialogType) + dialogAttrs("dialog-title", "dialog-message"), {
						onclick: (e: MouseEvent) => e.stopPropagation(), // do not propagate clicks on the dialog as the Modal expects all propagated clicks to be clicks on the background
						oncreate: vnode => {
							this._domDialog = vnode.dom
							let animation = null
							if (dialogType === DialogType.EditLarge) {
								vnode.dom.style.transform = `translateY(${window.innerHeight}px)`
								animation = animations.add(this._domDialog, transform(transform.type.translateY, window.innerHeight, 0))
							} else {
								let bgcolor = getElevatedBackground()
								let children = Array.from(this._domDialog.children)
								children.forEach(child => child.style.opacity = '0')
								this._domDialog.style.backgroundColor = `rgba(0, 0, 0, 0)`
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
		} else {
			let button = this._domDialog.querySelector("button")
			if (button) {
				button.focus()
			}
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
		let dialogStyle = ".dialog.elevated-bg.flex-grow"
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
		} else if (dialogType === DialogType.EditLarge || dialogType === DialogType.EditLarger) {
			dialogStyle += ".dialog-width-l"
		}
		return dialogStyle
	}

	addShortcut(shortcut: Shortcut): Dialog {
		this._shortcuts.push(shortcut)
		return this
	}

	/**
	 * Sets a close handler to the dialog. If set the handler will be notified when onClose is called on the dialog.
	 * The handler must is then responsible for closing the dialog.
	 */
	setCloseHandler(closeHandler: ?() => mixed): Dialog {
		this._closeHandler = closeHandler
		return this
	}

	shortcuts() {
		return this._shortcuts
	}

	show(): Dialog {
		this._focusedBeforeShown = document.activeElement
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
		this._focusedBeforeShown && this._focusedBeforeShown.focus()
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

	popState(e: Event): boolean {
		this.onClose()
		return false
	}

	/**
	 * Is invoked from modal as the two animations (background layer opacity and dropdown) should run in parallel
	 * @returns {Promise.<void>}
	 */
	hideAnimation(): Promise<void> {
		let bgcolor = getElevatedBackground()
		if (this._domDialog) {
			return Promise.all([
				animations.add(this._domDialog.children, opacity(1, 0, true)),
				animations.add(this._domDialog, alpha(alpha.type.backgroundColor, bgcolor, 1, 0), {
					delay: DefaultAnimationTime / 2,
					easing: ease.linear
				})
			]).return()
		} else {
			return Promise.resolve()
		}
	}

	backgroundClick(e: MouseEvent) {
	}

	static error(messageIdOrMessageFunction: TranslationKey | lazy<string>, infoToAppend?: string | () => Children): Promise<void> {
		return new Promise(resolve => {
			let dialog: Dialog
			const closeAction = () => {
				dialog.close()
				setTimeout(() => resolve(), DefaultAnimationTime)
			}
			let lines = lang.getMaybeLazy(messageIdOrMessageFunction).split("\n")
			if (typeof infoToAppend === "string") {
				lines.push(infoToAppend)
			}
			const buttonAttrs: ButtonAttrs = {
				label: "ok_action",
				click: closeAction,
				type: ButtonType.Primary,

			}

			dialog = new Dialog(DialogType.Alert, {
				view: () =>
					lines.map(line => m(".dialog-contentButtonsBottom.text-break.selectable", line))
					     .concat(typeof infoToAppend == "function" ? infoToAppend() : null)
					     .concat(m(".flex-center.dialog-buttons", m(ButtonN, buttonAttrs)))
			}).setCloseHandler(closeAction)
			  .addShortcut({
				  key: Keys.RETURN,
				  shift: false,
				  exec: closeAction,
				  help: "close_alt"
			  })
			  .addShortcut({
				  key: Keys.ESC,
				  shift: false,
				  exec: closeAction,
				  help: "close_alt"
			  }).show()
		})
	}

	/**
	 * fallback for cases where we can't directly download and open a file
	 */
	static legacyDownload(filename: string, url: string): Promise<void> {
		return new Promise(resolve => {
			let dialog: Dialog
			const closeAction = () => {
				dialog.close()
				setTimeout(() => resolve(), DefaultAnimationTime)
			}

			const closeButtonAttrs: ButtonAttrs = {
				label: "close_alt",
				click: closeAction,
				type: ButtonType.Primary
			}

			const downloadButtonAttrs: ButtonAttrs = {
				label: "download_action",
				click: () => {
					let popup = open('', '_blank')
					popup.location = url
					dialog.close()
					resolve()
				},
				type: ButtonType.Primary
			}

			dialog = new Dialog(DialogType.Alert, {
				view: () => m("", [
					m(".dialog-contentButtonsBottom.text-break", [
						m(ButtonN, downloadButtonAttrs),
						m(".pt", lang.get("saveDownloadNotPossibleIos_msg"))
					]),
					m(".flex-center.dialog-buttons", m(ButtonN, closeButtonAttrs))
				])
			}).setCloseHandler(closeAction).show()
		})
	}


	/**
	 * Simpler version of {@link Dialog#confirmMultiple} with just two options: no and yes (or another confirmation).
	 * @return Promise, which is resolved with user selection - true for confirm, false for cancel.
	 */
	static confirm(messageIdOrMessageFunction: TranslationKey | lazy<string>, confirmId: TranslationKey = "ok_action"): Promise<boolean> {
		return new Promise(resolve => {
			const closeAction = conf => {
				dialog.close()
				setTimeout(() => resolve(conf), DefaultAnimationTime)
			}
			const buttonAttrs: Array<ButtonAttrs> = [
				{label: "cancel_action", click: () => closeAction(false), type: ButtonType.Secondary},
				{label: confirmId, click: () => closeAction(true), type: ButtonType.Primary},
			]
			const dialog = Dialog.confirmMultiple(messageIdOrMessageFunction, buttonAttrs, resolve)
		})
	}

	/**
	 * Show a dialog with multiple selection options below the message.
	 * @param messageIdOrMessageFunction which displayed in the body
	 * @param buttons which are displayed below
	 * @param onclose which is called on shortcut or when dialog is closed any other way (e.g. back navigation). Not called when pressing
	 * one of the buttons.
	 */
	static confirmMultiple(messageIdOrMessageFunction: TranslationKey | lazy<string>, buttons: $ReadOnlyArray<ButtonAttrs>,
	                       onclose?: (positive: boolean) => mixed
	): Dialog {
		let dialog: Dialog
		const closeAction = (positive) => {
			dialog.close()
			setTimeout(() => onclose && onclose(positive), DefaultAnimationTime)
		}

		dialog = new Dialog(DialogType.Alert, {
			view: () => [
				m("#dialog-message.dialog-contentButtonsBottom.text-break.text-prewrap.selectable",
					lang.getMaybeLazy(messageIdOrMessageFunction)),
				m(".flex-center.dialog-buttons", buttons.map(a => m(ButtonN, a)))
			]
		}).setCloseHandler(() => closeAction(false))
		  .addShortcut({
			  key: Keys.ESC,
			  shift: false,
			  exec: () => closeAction(false),
			  help: "cancel_action"
		  })
		  .addShortcut({
			  key: Keys.RETURN,
			  shift: false,
			  exec: () => closeAction(true),
			  help: "ok_action",
		  })
		  .show()
		return dialog
	}

	// used in admin client
	static save(title: lazy<string>, saveAction: action, child: Component): Promise<void> {
		return new Promise(resolve => {
			let saveDialog: Dialog
			const closeAction = () => {
				saveDialog.close()
				setTimeout(() => resolve(), DefaultAnimationTime)
			}
			const onOk = () => {
				saveAction().then(() => {
					saveDialog.close()
					setTimeout(() => resolve(), DefaultAnimationTime)
				})
			}
			const actionBarAttrs: DialogHeaderBarAttrs = {
				left: [{label: "close_alt", click: closeAction, type: ButtonType.Secondary}],
				right: [{label: "save_action", click: onOk, type: ButtonType.Primary}],
				middle: title
			}
			saveDialog = new Dialog(DialogType.EditMedium, {
				view: () => m("", [
					m(".dialog-header.plr-l", m(DialogHeaderBar, actionBarAttrs)),
					m(".plr-l.pb.text-break", m(child))
				])
			}).setCloseHandler(closeAction).show()
		})
	}

	static reminder(title: string, message: string, link: string): Promise<boolean> {
		return new Promise(resolve => {
			let dialog: Dialog
			const closeAction = res => {
				dialog.close()
				setTimeout(() => resolve(res), DefaultAnimationTime)
			}
			const buttonAttrs: Array<ButtonAttrs> = [
				{label: "upgradeReminderCancel_action", click: () => closeAction(false), type: ButtonType.Secondary},
				{label: "showMoreUpgrade_action", click: () => closeAction(true), type: ButtonType.Primary}
			]

			dialog = new Dialog(DialogType.Reminder, {
				view: () => [
					m(".dialog-contentButtonsBottom.text-break.scroll", [
						m(".h2.pb", title),
						m(".flex-direction-change.items-center", [
							m("#dialog-message.pb", message),
							m("img[src=" + HabReminderImage + "].dialog-img.mb.bg-white.border-radius", {
								style: {
									'min-width': '150px'
								}
							})
						]),
						m("a[href=" + link + "][target=_blank]", link)
					]),
					m(".flex-center.dialog-buttons.flex-no-grow-no-shrink-auto", buttonAttrs.map(a => m(ButtonN, a)))
				]
			}).setCloseHandler(() => closeAction(false))
			  .addShortcut({
				  key: Keys.ESC,
				  shift: false,
				  exec: () => closeAction(false),
				  help: "cancel_action"
			  }).show()
		})
	}

	/**
	 * Shows a dialog with a text field input and ok/cancel buttons.
	 * @param   props.child either a component (object with view function that returns a VirtualElement) or a naked view Function
	 * @param   props.validator Called when "Ok" is clicked. Must return null if the input is valid or an error messageID if it is invalid, so an error message is shown.
	 * @param   props.okAction called after successful validation.
	 * @param   props.cancelAction called when allowCancel is true and the cancel button/shortcut was pressed.
	 * @returns the Dialog
	 */
	static showActionDialog(props: ActionDialogProps): Dialog {
		let dialog = this.createActionDialog(props)
		return dialog.show()
	}

	static createActionDialog(props: ActionDialogProps) {
		let dialog: Dialog
		const {title, child, okAction, validator, allowCancel, allowOkWithReturn, okActionTextId, cancelActionTextId, cancelAction, type} =
			Object.assign({}, {
				allowCancel: true,
				allowOkWithReturn: false, okActionTextId: "ok_action",
				cancelActionTextId: "cancel_action",
				type: DialogType.EditSmall
			}, props)

		const doCancel = () => {
			if (cancelAction) {
				cancelAction(dialog)
			}
			dialog.close()
		}

		const doAction = () => {
			if (!okAction) {
				return
			}
			let validationResult = null
			if (validator) {
				validationResult = validator()
			}
			let finalizer = Promise.resolve(validationResult).then(error_id => {
				if (error_id) {
					Dialog.error(error_id)
				} else {
					okAction(dialog)
				}
			})
			if (validationResult instanceof Promise) {
				showProgressDialog("pleaseWait_msg", finalizer)
			}
		}

		const actionBarAttrs: DialogHeaderBarAttrs = {
			left: allowCancel ? [{label: cancelActionTextId, click: doCancel, type: ButtonType.Secondary}] : [],
			right: okAction ? [{label: okActionTextId, click: doAction, type: ButtonType.Primary}] : [],
			middle: typeof title === 'function' ? title : () => title
		}

		dialog = new Dialog(type, {
			view: () => [
				m(".dialog-header.plr-l", m(DialogHeaderBar, actionBarAttrs)),
				m(".dialog-max-height.plr-l.pb.text-break.scroll", 'function' === typeof child ? child() : m(child))
			]
		}).setCloseHandler(doCancel)

		if (allowCancel) {
			dialog.addShortcut({
				key: Keys.ESC,
				shift: false,
				exec: doCancel,
				help: "cancel_action"
			})
		}

		if (allowOkWithReturn) {
			dialog.addShortcut({
				key: Keys.RETURN,
				shift: false,
				exec: doAction,
				help: "ok_action"
			})
		}
		return dialog
	}

	/**
	 * Shows a dialog with a text field input and ok/cancel buttons.
	 * @param titleId title of the dialog
	 * @param labelIdOrLabelFunction label of the text field
	 * @param infoMsgId help label of the text field
	 * @param value initial value
	 * @param inputValidator Called when "Ok" is clicked receiving the entered text. Must return null if the text is valid or an error messageId if the text is invalid, so an error message is shown.
	 * @returns A promise resolving to the entered text. The returned promise is only resolved if "ok" is clicked.
	 */
	static showTextInputDialog(titleId: TranslationKey | lazy<string>, labelIdOrLabelFunction: TranslationKey | lazy<string>, infoMsgId: ?TranslationKey | ?lazy<string>, value: string, inputValidator: ?stringValidator): Promise<string> {
		return new Promise(resolve => {
			const result: Stream<string> = stream(value)
			const textFieldAttrs: TextFieldAttrs = {
				label: labelIdOrLabelFunction,
				value: result,
				helpLabel: () => infoMsgId ? lang.getMaybeLazy(infoMsgId) : ""
			}

			Dialog.showActionDialog({
				title: lang.getMaybeLazy(titleId),
				child: () => m(TextFieldN, textFieldAttrs),
				validator: () => inputValidator ? inputValidator(result()) : null,
				allowOkWithReturn: true,
				okAction: dialog => {
					resolve(result())
					dialog.close()
				}
			})
		})
	}


	/**
	 * Shows a dialog with a text area input and ok/cancel buttons.
	 * @param titleId title of the dialog
	 * @param labelIdOrLabelFunction label of the text area
	 * @param infoMsgId help label of the text area
	 * @param value initial value
	 * @param inputValidator Called when "Ok" is clicked receiving the entered text. Must return null if the text is valid or an error messageId if the text is invalid, so an error message is shown.
	 * @returns A promise resolving to the entered text. The returned promise is only resolved if "ok" is clicked.
	 */
	static showTextAreaInputDialog(titleId: TranslationKey, labelIdOrLabelFunction: TranslationKey | lazy<string>, infoMsgId: ?TranslationKey, value: string): Promise<string> {
		return new Promise(resolve => {
			const result: Stream<string> = stream(value)
			const textFieldAttrs: TextFieldAttrs = {
				label: labelIdOrLabelFunction,
				helpLabel: () => infoMsgId ? lang.get(infoMsgId) : "",
				value: result,
				type: Type.Area
			}

			Dialog.showActionDialog({
				title: lang.get(titleId),
				child: {view: () => m(TextFieldN, textFieldAttrs)},
				okAction: dialog => {
					resolve(result())
					dialog.close()
				}
			})
		})
	}

	/**
	 * Show a dialog with a dropdown selector
	 * @param titleId title of the dialog
	 * @param label label of the dropdown selector
	 * @param infoMsgId help label of the dropdown selector
	 * @param items selection set
	 * @param selectedValue initial value
	 * @param dropdownWidth width of the dropdown
	 * @returns A promise resolving to the selected item. The returned promise is only resolved if "ok" is clicked.
	 */
	static showDropDownSelectionDialog<T>(titleId: TranslationKey, label: TranslationKey, infoMsgId: ?TranslationKey,
	                                      items: SelectorItemList<T>, selectedValue: Stream<T>, dropdownWidth: ?number
	): Promise<T> {
		return new Promise(resolve => {
			Dialog.showActionDialog({
				title: lang.get(titleId),
				child: {view: () => m(DropDownSelectorN, {label, items, selectedValue})},
				okAction: dialog => {
					resolve(selectedValue())
					dialog.close()
				}
			})
		})
	}

	static largeDialog(headerBarAttrs: DialogHeaderBarAttrs, child: (Component | Class<MComponent<void>>)): Dialog {
		return new Dialog(DialogType.EditLarge, {
			view: () => {
				return m("", [
					m(".dialog-header.plr-l", m(DialogHeaderBar, headerBarAttrs)),
					m(".dialog-container.scroll",
						m(".fill-absolute.plr-l", m(child)))
				])
			}
		})
	}

	static largeDialogN<T>(headerBarAttrs: DialogHeaderBarAttrs, child: Class<MComponent<$Attrs<T>>>, childAttrs: $Attrs<T>): Dialog {
		return new Dialog(DialogType.EditLarge, {
			view: () => {
				return m("", [
					m(".dialog-header.plr-l", m(DialogHeaderBar, headerBarAttrs)),
					m(".dialog-container.scroll",
						m(".fill-absolute.plr-l", m(child, childAttrs)))
				])
			}
		})
	}

	/**
	 * Requests a password from the user. Stays open until the caller sets the error message to "".
	 * @param errorMessage a stream of error messages that will be shown as the password field help text. should not start with "", but with lang.get("emptyString_msg")
	 * @returns a stream of entered passwords
	 */
	static showRequestPasswordDialog(errorMessage: Stream<string>, props: {allowCancel: boolean} = {allowCancel: true}): Stream<string> {
		const out: Stream<string> = stream()
		const value: Stream<string> = stream("")
		const textFieldAttrs: TextFieldAttrs = {
			label: "password_label",
			helpLabel: errorMessage,
			value: value,
			preventAutoFill: true,
			type: Type.Password,
			keyHandler: (key: KeyPress) => {
				if (key.keyCode === 13) {//return
					out(value())
					return false
				}
				return true
			}
		}
		const dialog = Dialog.showActionDialog({
			title: lang.get("password_label"),
			child: {view: () => m(TextFieldN, textFieldAttrs)},
			allowOkWithReturn: true,
			okAction: () => out(value()),
			allowCancel: props.allowCancel,
			cancelAction: () => dialog.close()
		})

		errorMessage.map(v => v ? m.redraw() : dialog.close())
		return out
	}

	static _onKeyboardSizeChanged(newSize: number): void {
		Dialog._keyboardHeight = newSize
		m.redraw()
	}
}

windowFacade.addKeyboardSizeListener(Dialog._onKeyboardSizeChanged)
