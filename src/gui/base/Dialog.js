// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Button, ButtonType} from "./Button"
import {modal} from "./Modal"
import {animations, opacity, alpha, DefaultAnimationTime, transform} from "../animation/Animations"
import {ease} from "../animation/Easing"
import {lang} from "../../misc/LanguageViewModel"
import {DialogHeaderBar} from "./DialogHeaderBar"
import {TextField} from "./TextField"
import {assertMainOrNode} from "../../api/Env"
import {Keys} from "../../misc/KeyManager"
import {mod} from "../../misc/MathUtils"
import {neverNull} from "../../api/common/utils/Utils"
import {PasswordIndicator} from "./PasswordIndicator"
import {worker} from "../../api/main/WorkerClient"
import {DropDownSelector} from "./DropDownSelector"
import {theme} from "../theme"
import {progressIcon} from "./Icon"
import {size, px} from "../size"
import {styles} from "../styles"

assertMainOrNode()

export const DialogType = {
	Progress: "Progress",
	Alert: "Alert",
	Reminder: "Reminder",
	EditSmall: "EditSmall",
	EditMedium: "EditMedium",
	EditLarge: "EditLarge"
}
export type DialogTypeEnum = $Values<typeof DialogType>;

export const TABBABLE = "button, input, textarea, div[contenteditable='true']"
export const INPUT = "input, textarea, div[contenteditable='true']"

export class Dialog {
	buttons: Button[];
	_domDialog: HTMLElement;
	_shortcuts: Shortcut[];
	view: Function;
	visible: boolean;
	_focusOnLoadFunction: Function;

	constructor(dialogType: DialogTypeEnum, childComponent: MComponent<any>) {
		this.buttons = []
		this.visible = false
		this._focusOnLoadFunction = this._defaultFocusOnLoad
		this._shortcuts = [
			{
				key: Keys.TAB,
				shift: true,
				exec: () => {
					let tabbable = Array.from(this._domDialog.querySelectorAll(TABBABLE))
					let selected = tabbable.find(e => document.activeElement === e)
					if (selected) {
						tabbable[mod(tabbable.indexOf(selected) - 1, tabbable.length)].focus()
					} else if (tabbable.length > 0) {
						tabbable[tabbable.length - 1].focus()
					}
				},
				help: "selectPrevious_action"
			},
			{
				key: Keys.TAB,
				shift: false,
				exec: () => {
					let tabbable = Array.from(this._domDialog.querySelectorAll(TABBABLE))
					let selected = tabbable.find(e => document.activeElement === e)
					if (selected) {
						tabbable[mod(tabbable.indexOf(selected) + 1, tabbable.length)].focus()
					} else if (tabbable.length > 0) {
						tabbable[0].focus()
					}
				},
				help: "selectNext_action"
			},
		]
		this.view = (): VirtualElement => {
			let mobileMargin = px(size.hpad)
			return m(this._getDialogWrapperStyle(dialogType), [
					m(this._getDialogStyle(dialogType), {
						style: {
							'margin-top': styles.isDesktopLayout() ? '60px' : mobileMargin,
							'margin-left': mobileMargin,
							'margin-right': mobileMargin
						},
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
							if (document.activeElement && typeof document.activeElement.blur == "function") document.activeElement.blur()
							animation.then(() => {
								this._focusOnLoadFunction()
							})
						},
					}, m(childComponent))
				]
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
		let dialogWrapperStyle = ".fill-absolute.flex-center"
		if (dialogType === DialogType.Progress || dialogType === DialogType.Alert || dialogType === DialogType.EditSmall || dialogType === DialogType.EditMedium) {
			dialogWrapperStyle += ".items-center"
		}
		if (dialogType === DialogType.Reminder) {
			dialogWrapperStyle += ".items-base.scroll";
		}
		if (dialogType === DialogType.EditLarge) {
			dialogWrapperStyle += ".items-strech";
		}
		return dialogWrapperStyle
	}

	_getDialogStyle(dialogType: DialogTypeEnum) {
		let dialogStyle = ".dialog.content-bg"
		if (dialogType === DialogType.Progress) {
			dialogStyle += ".dialog-width-s.dialog-progress"
		} else if (dialogType === DialogType.Alert) {
			dialogStyle += ".dialog-width-alert.pt"
		} else if (dialogType === DialogType.Reminder) {
			dialogStyle += ".dialog-width-m.pt.dialog-align-top" // do not center reminder dialog because on small screens scrolling is not possible with align-items: centered
		} else if (dialogType === DialogType.EditSmall) {
			dialogStyle += ".dialog-width-s"
		} else if (dialogType === DialogType.EditMedium) {
			dialogStyle += ".dialog-width-m"
		} else if (dialogType === DialogType.EditLarge) {
			dialogStyle += ".dialog-width-l.dialog-align-top"
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

	shortcuts() {
		return this._shortcuts
	}

	show(): Dialog {
		modal.display(this)
		this.visible = true
		return this
	}

	close(): void {
		this.visible = false
		modal.remove(this)
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

	static progress<T>(messageIdOrMessageFunction: string|lazy<string>, action: Promise<T>, showProgress: ?boolean): Promise<T> {
		let progress = 0
		let progressIndicator = (showProgress === true) ? new PasswordIndicator(() => progress) : null
		let progressDialog = new Dialog(DialogType.Progress, {
			view: () => m("", [
				m(".flex-center", !showProgress ? progressIcon() : (progressIndicator ? m(progressIndicator) : null)),
				m("p", messageIdOrMessageFunction instanceof Function ? messageIdOrMessageFunction() : lang.get(messageIdOrMessageFunction))
			])
		})
		let updater: progressUpdater = newProgress => {
			progress = newProgress
			m.redraw()
		}
		worker.registerProgressUpdater(updater)
		progressDialog.show()
		let start = new Date().getTime()

		return Promise.fromCallback(cb => {
			action.then(result => {
				let diff = new Date().getTime() - start
				setTimeout(() => {
					worker.unregisterProgressUpdater(updater)
					progressDialog.close()
					setTimeout(() => cb(null, result), DefaultAnimationTime)
				}, Math.max(1000 - diff, 0))
			}).catch(e => {
				let diff = new Date().getTime() - start
				setTimeout(() => {
					worker.unregisterProgressUpdater(updater)
					progressDialog.close()
					setTimeout(() => cb(e, null), DefaultAnimationTime)
				}, Math.max(1000 - diff, 0))
			})
		})
	}


	static pending(messageIdOrMessageFunction: string|lazy<string>, image: ?string): Dialog {
		let dialog = new Dialog(DialogType.Progress, {
			view: () => m("", [
				image ? m(".flex-center", m("img[src=" + image + "]")) : m(".flex-center", progressIcon()),
				m("p", messageIdOrMessageFunction instanceof Function ? messageIdOrMessageFunction() : lang.get(messageIdOrMessageFunction))
			])
		})
		dialog.show()
		return dialog
	}

	static error(messageIdOrMessageFunction: string|lazy<string>): Promise<void> {
		return Promise.fromCallback(cb => {
			let buttons = []
			buttons.push(new Button("ok_action", () => {
				(dialog:any).close()
				setTimeout(() => cb(null), DefaultAnimationTime)
			}).setType(ButtonType.Primary))

			let message = messageIdOrMessageFunction instanceof Function ? messageIdOrMessageFunction() : lang.get(messageIdOrMessageFunction)
			let lines = message.split("\n")

			let dialog = new Dialog(DialogType.Alert, {
				view: () =>
					lines.map(line => m(".dialog-contentButtonsBottom.text-break", line)).concat(
						m(".flex-center.dialog-buttons", buttons.map(b => m(b)))
					)
			})
			dialog.show()
		})
	}


	static legacyDownload(filename: string, href: string): Promise<void> {
		return Promise.fromCallback(cb => {
			let buttons = []
			buttons.push(new Button("close_alt", () => {
				(dialog:any).close()
				setTimeout(() => cb(null), DefaultAnimationTime)
			}).setType(ButtonType.Primary))

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
			dialog.show()
		})
	}


	static confirm(messageIdOrMessageFunction: string|lazy<string>, confirmId: ?string = "ok_action"): Promise<boolean> {
		return Promise.fromCallback(cb => {
			let buttons = []
			buttons.push(new Button("cancel_action", () => {
				dialog.close()
				setTimeout(() => cb(null, false), DefaultAnimationTime)
			}).setType(ButtonType.Secondary))
			buttons.push(new Button(confirmId, () => {
				dialog.close()
				setTimeout(() => cb(null, true), DefaultAnimationTime)
			}).setType(ButtonType.Primary))
			let dialog = new Dialog(DialogType.Alert, {
				view: () => m("", [
					m(".dialog-contentButtonsBottom.text-break", messageIdOrMessageFunction instanceof Function ? messageIdOrMessageFunction() : lang.get(messageIdOrMessageFunction)),
					m(".flex-center.dialog-buttons", buttons.map(b => m(b)))
				])
			})
			dialog.show()
		})
	}


	static save(title: lazy<string>, saveAction: action, child: Component): Promise<void> {
		return Promise.fromCallback(cb => {
			let actionBar = new DialogHeaderBar()
			actionBar.addLeft(new Button("close_alt", () => {
				saveDialog.close()
				setTimeout(() => cb(null), DefaultAnimationTime)
			}).setType(ButtonType.Secondary))
			actionBar.addRight(new Button("save_action", () => {
				saveAction().then(() => {
					saveDialog.close()
					setTimeout(() => cb(null), DefaultAnimationTime)
				})
			}).setType(ButtonType.Primary))
			let saveDialog = new Dialog(DialogType.EditMedium, {
				view: () => m("", [
					m(".dialog-header.plr-l", m(actionBar)),
					m(".dialog-contentButtonsTop.plr-l.pb.text-break", m(child))
				])
			})
			actionBar.setMiddle(title)
			saveDialog.show()
		})
	}

	static reminder(title: string, message: string, link: string): Promise<boolean> {
		return Promise.fromCallback(cb => {
			let buttons = []
			buttons.push(new Button("upgradeReminderCancel_action", () => {
				dialog.close()
				setTimeout(() => cb(null, false), DefaultAnimationTime)
			}).setType(ButtonType.Secondary))
			buttons.push(new Button("upgradeToPremium_action", () => {
				dialog.close()
				setTimeout(() => cb(null, true), DefaultAnimationTime)
			}).setType(ButtonType.Primary))

			let dialog = new Dialog(DialogType.Reminder, {
				view: () => m("", [
					m(".dialog-contentButtonsBottom.text-break", [
						m(".h2.pb", title),
						m(".flex-direction-change.items-center", [
							m(".pb", message),
							m("img[src=/graphics/hab.png].dialog-img.pb")
						]),
						m("a[href=" + link + "][target=_blank]", link)
					]),
					m(".flex-center.dialog-buttons", buttons.map(b => m(b)))
				])
			})
			dialog.show()
		})
	}

	/**
	 * @param inputValidator Called when "Ok" is clicked. Must return null if the input is valid so the dialog is closed or an error messageId if the input is invalid, so an error message is shown and the dialog stays.
	 * @deprecated user Dialog.smallActionDialog
	 */
	static smallDialog(title: stream<string>|string, child: Component, inputValidator: ?validator): Promise<boolean> {
		return Promise.fromCallback(cb => {
			let actionBar = new DialogHeaderBar()

			actionBar.addLeft(new Button("cancel_action", () => {
				dialog.close()
				setTimeout(() => cb(null, false), DefaultAnimationTime)
			}).setType(ButtonType.Secondary))
			actionBar.addRight(new Button("ok_action", () => {
				if (inputValidator) {
					let errorMessage = inputValidator()
					if (errorMessage) {
						this.error(errorMessage)
						return
					}
				}
				dialog.close()
				setTimeout(() => cb(null, true), DefaultAnimationTime)
			}).setType(ButtonType.Primary))

			let dialog = new Dialog(DialogType.EditSmall, {
				view: () => m("", [
					m(".dialog-header.plr-l", m(actionBar)),
					m(".dialog-contentButtonsTop.plr-l.pb.text-break", m(child))
				])
			})

			if (title) {
				if (title instanceof Function) {
					actionBar.setMiddle(title)
				} else {
					actionBar.setMiddle(stream(title))
				}
			}

			dialog.show()
		})
	}

	static smallActionDialog(title: stream<string>|string, child: Component, okAction: action, allowCancel: boolean = true, okActionTextId: string = "ok_action"): Dialog {
		let actionBar = new DialogHeaderBar()

		if (allowCancel) {
			actionBar.addLeft(new Button("cancel_action", () => {
				dialog.close()
			}).setType(ButtonType.Secondary))
		}
		actionBar.addRight(new Button(okActionTextId, okAction).setType(ButtonType.Primary))

		let dialog = new Dialog(DialogType.EditSmall, {
			view: () => m("", [
				m(".dialog-header.plr-l", m(actionBar)),
				m(".dialog-contentButtonsTop.plr-l.pb.text-break", m(child))
			])
		})

		if (title) {
			if (title instanceof Function) {
				actionBar.setMiddle(title)
			} else {
				actionBar.setMiddle(stream(title))
			}
		}

		return dialog.show()
	}

	/**
	 * Shows a dialog with a text field input and ok/cancel buttons.
	 * @param inputValidator Called when "Ok" is clicked receiving the entered text. Must return null if the text is valid or an error messageId if the text is invalid, so an error message is shown.
	 * @returns A promise resolving to the entered text. The returned promise is only resolved if "ok" is clicked.
	 */
	static showTextInputDialog(titleId: string, labelIdOrLabelFunction: string|lazy<string>, infoMsgId: ?string, value: string, inputValidator: ?stringValidator): Promise<string> {
		return Promise.fromCallback(cb => {
			let textField = new TextField(labelIdOrLabelFunction, () => {
				return (infoMsgId) ? lang.get(infoMsgId) : ""
			})
			textField.value(value)
			let inputValidatorWrapper = (inputValidator) ? (() => neverNull(inputValidator)(textField.value())) : null
			return Dialog.smallDialog(lang.get(titleId), {
				view: () => m(textField)
			}, inputValidatorWrapper).then(ok => {
				if (ok) {
					cb(null, textField.value())
				}
			})
		})
	}

	static showDropDownSelectionDialog<T>(titleId: string, labelId: string, infoMsgId: ?string, items: {name: string, value: T}[], selectedValue: stream<T>|T, dropdownWidth: ?number): Promise<T> {
		return Promise.fromCallback(cb => {
			let dropdown = new DropDownSelector(labelId, () => (infoMsgId) ? lang.get(infoMsgId) : "", items, selectedValue, dropdownWidth)
			return Dialog.smallDialog(lang.get(titleId), {
				view: () => m(dropdown)
			}).then(ok => {
				if (ok) {
					cb(null, dropdown.selectedValue())
				}
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
}
