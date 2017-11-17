// @flow
import {TextField, inputLineHeight, Type} from "../gui/base/TextField"
import m from "mithril"
import {Icons} from "../gui/base/icons/Icons"
import {logins} from "../api/main/LoginController"
import {styles} from "../gui/styles"
import {px, size} from "../gui/size"
import stream from "mithril/stream/stream.js"
import {theme} from "../gui/theme"
import {Icon} from "../gui/base/Icon"
import {DefaultAnimationTime} from "../gui/animation/Animations"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {displayOverlay, closeOverlay, isOverlayVisible} from "../gui/base/Overlay"
import {NavButton} from "../gui/base/NavButton"
import {Dropdown} from "../gui/base/Dropdown"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {load} from "../api/main/Entity"
import {keyManager, Keys} from "../misc/KeyManager"
import {formatDateTimeFromYesterdayOn} from "../misc/Formatter"
import {getSenderOrRecipientHeading} from "../mail/MailUtils"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {mod} from "../misc/MathUtils"
import {searchModel, getRestriction} from "./SearchModel"
import {lang} from "../misc/LanguageViewModel"

type ShowMoreAction = {
	resultCount:number,
	indexDate:Date
}

export class SearchBar {
	view: Function;
	inputField: TextField;
	_domInput: HTMLInputElement;
	_domWrapper: HTMLElement;
	value: stream<string>;
	focused: boolean;
	expanded: boolean;
	dropdown: Dropdown;
	skipNextBlur: boolean;
	_results: Array<Mail|Contact|ShowMoreAction>;
	oncreate: Function;
	onbeforeremove: Function;
	busy: boolean;
	_selected: ?Mail|Contact|ShowMoreAction;

	constructor() {
		this.expanded = false
		this.focused = false
		this.skipNextBlur = false
		this.busy = false
		this.value = stream("")
		let b = new NavButton('emails_label', () => BootIcons.Mail, () => "/search", "/search")
		this.dropdown = new Dropdown(() => [b], 250)
		this._results = []
		this.view = (): VirtualElement => {
			return m(".search-bar.flex-end.items-center", {
				oncreate: (vnode) => {
					this._domWrapper = vnode.dom
				},
				style: {
					'min-height': px(inputLineHeight + 2), // 2 px border
					'padding-bottom': this.expanded ? (this.focused ? px(0) : px(1)) : px(2),
					'padding-top': px(2), // center input field
					'margin-right': px(15),
					'border-bottom': this.expanded ? (this.focused ? `2px solid ${theme.content_accent}` : `1px solid ${theme.content_border}`) : "0px",
					'align-self': "center"
				}
			}, [
				m(".ml-negative-xs", {
					onmousedown: e => this.skipNextBlur = true,
					onclick: (e) => {
						this.handleSearchClick(e)
						// reset skipNextBlur in case the text field is not focused currently (any blur has not been invoked for the textfield, which resets the skipNextBlur in all other cases)
						this.skipNextBlur = false
					}
				}, m(Icon, {
					icon: Icons.Search,
					class: "flex-center items-center icon-large",
					style: {
						fill: this.focused ? theme.header_button_selected : theme.header_button,
						//"margin-top": (this._hideLabel) ? "0px" : "-2px"
					}
				})),
				m(".searchInputWrapper.flex-end.items-center", {
					style: {
						"width": this.expanded ? px(200) : px(0),
						"transition": `width ${DefaultAnimationTime}ms`,
						'padding-left': this.expanded ? '10px' : '0px',
						'padding-top': '3px',
						'padding-bottom': '3px',
						'overflow-x': 'hidden'
					}

				}, [this._getInputField(), m(".closeIconWrapper", {
					onclick: (e) => this.close(),
				}, this.busy ? m(Icon, {
						icon: BootIcons.Progress,
						class: 'flex-center items-center icon-progress-search icon-progress'
					}) : m(Icon, {
						icon: Icons.Close,
						class: "flex-center items-center icon-large",
						style: {
							fill: theme.header_button,
							//"margin-top": (this._hideLabel) ? "0px" : "-2px"
						}
					}))])
			])
		}

		this._setupShortcuts()
	}


	_setupShortcuts() {
		let shortcuts = [
			{
				key: Keys.F,
				enabled: () => logins.isInternalUserLoggedIn(),
				exec: key => {
					this.focus()
					m.redraw()
				},
				help: "search_label"
			},
		]

		this.oncreate = () => keyManager.registerShortcuts(shortcuts)
		this.onbeforeremove = () => keyManager.unregisterShortcuts(shortcuts)
	}

	showDropdown() {
		if (!isOverlayVisible() && this._domWrapper != null && this.value().trim() != "" && this.focused) {
			let buttonRect: ClientRect = this._domWrapper.getBoundingClientRect()
			displayOverlay(buttonRect, {
				view: () => {
					return m("ul.list.click.mail-list", [
						this._results.map(result => {
							return m("li.plr-l.pt-s.pb-s", {
								style: {
									height: px(52),
									'border-left': px(size.border_selection) + " solid transparent",
								},
								onmousedown: e => this.skipNextBlur = true,
								onclick: e => this._selectResult(result),

								class: this._selected === result ? "row-selected" : "",
							}, this.renderResult(result))
						}),
					])
				}
			})
		}
		// updates the suggestion list if the dropdown is already visible
		m.redraw()
	}

	renderResult(result: Mail|Contact|ShowMoreAction) {
		let type: ?TypeRef = result._type ? result._type : null
		if (!type) { // show more action
			let showMoreAction = ((result:any):ShowMoreAction)
			return m("ul.list.click.mail-list",
				m("li.plr-l.pt-s.pb-s.items-center.flex-center", {
					style: {
						'border-left': px(size.border_selection) + " solid transparent",
					},

				}, showMoreAction.resultCount == 0 ? lang.get("searchNoResults_msg") : lang.get("showMore_action")))
		} else if (isSameTypeRef(MailTypeRef, type)) {
			let mail = ((result:any):Mail)
			return [m(".top.flex-space-between", [
				m("small.text-ellipsis", getSenderOrRecipientHeading(mail, true)),
				m("small.text-ellipsis.flex-fixed", formatDateTimeFromYesterdayOn(mail.receivedDate))
			]),
				m(".bottom.flex-space-between", [
					m(".text-ellipsis", mail.subject),
					m(".icons.flex-fixed", {style: {"margin-right": "-3px"}}, [ // 3px to neutralize the svg icons internal border border
						m(Icon, {
							icon: Icons.Attachment,
							class: this._selected === result ? "svg-content-accent-fg" : "svg-content-fg",
							style: {display: mail.attachments ? '' : 'none'},
						}),
					])
				])
			]
		} else if (isSameTypeRef(ContactTypeRef, type)) {
			let contact = ((result:any):Contact)
			return [
				m(".top.flex-space-between",
					m(".name", contact.firstName + " " + contact.lastName),
				),
				m(".bottom.flex-space-between",
					m("small.mail-address", (contact.mailAddresses && contact.mailAddresses.length > 0) ? contact.mailAddresses[0].address : ""),
				)
			]
		}
	}

	_selectResult(result: ?Mail|Contact|ShowMoreAction) {
		if (result != null) {
			closeOverlay()
			this._domInput.blur()
			let type: ?TypeRef = result._type ? result._type : null
			if (!type) {
				m.route.set("/search/" + m.route.get().split("/")[1])
			} else if (isSameTypeRef(MailTypeRef, type)) {
				let mail = ((result:any):Mail)
				m.route.set(`/mail/${mail._id[0]}/${mail._id[1]}`)
			} else if (isSameTypeRef(ContactTypeRef, type)) {
				let contact = ((result:any):Contact)
				m.route.set(`/contact/${contact._id[0]}/${contact._id[1]}`)
			}
		}
	}

	handleSearchClick(e: MouseEvent) {
		if (!this.focused) {
			this.focus()
		} else {
			this.search()
		}
	}

	search() {
		this.busy = true
		let value = this.value()
		setTimeout(() => {
			if (value == this.value()) {
				let restriction = getRestriction(m.route.get())
				let value = this.value()
				if (this.value().trim() != "") {
					searchModel.search(value, restriction).then(result => {
						if (m.route.get().startsWith("/search")) {
							this.busy = false
							return // instances will be displayed as part of the list of the search view, when the search view is displayed
						}
						let newResults = []
						Promise.all([
							Promise.map(result.mails.slice(0, 10), mailId => load(MailTypeRef, mailId)).then(mails => {
								newResults = newResults.concat(mails)
							}),
							Promise.map(result.contacts.slice(0, 10), contactId => load(ContactTypeRef, contactId)).then(contacts => {
								newResults = newResults.concat(contacts)
							})]
						).then(() => {
							if (this.value() == value) {
								this._results = newResults
								this._results.push({
									resultCount: (searchModel.result().mails.length + searchModel.result().contacts.length),
									indexDate: new Date()
								}) // add SearchMoreAction
								if (this._results.length > 0) {
									this._selected = this._results[0]
								} else {
									this._selected = null
								}
							}
							this.showDropdown()
						})
					}).finally(() => this.busy = false)
				} else {
					this.busy = false
				}
			} else if (this.value().trim() == "") {
				this.busy = false
			}
			m.redraw()
		}, 500)
	}

	close() {
		if (this.expanded) {
			this.expanded = false
			this.value("")
			this._domInput.blur()
			closeOverlay()
		}
	}

	_getInputField(): VirtualElement {
		return m("input.input", {
			type: Type.Text,
			value: this.value(),
			oncreate: (vnode) => {
				this._domInput = vnode.dom
			},
			onfocus: (e) => this.focus(),
			onblur: e => {
				if (this.skipNextBlur) {
					this._domInput.focus()
				} else {
					this.blur(e)
				}
				this.skipNextBlur = false
			},
			onremove: () => {
				this._domInput.onblur = null
			},
			oninput: e => {
				if (this.value() != this._domInput.value) {
					this.value(this._domInput.value) // update the input on each change
					let value = this.value()
					if (value.trim() === "") {
						closeOverlay()
					} else {
						this.search()
					}
				}
			},
			onkeydown: e => {
				let keyCode = e.which
				if (keyCode == Keys.ESC.code) {
					this.close()
				} else if (keyCode == Keys.RETURN.code) {
					if (this._selected) {
						this._selectResult(this._selected)
					} else {
						this.search()
					}
				} else if (keyCode == Keys.UP.code) {
					if (this._results.length > 0) {
						let selected = this._selected ? this._selected : this._results[0]
						this._selected = this._results[mod(this._results.indexOf(selected) - 1, this._results.length)]
					}
				} else if (keyCode == Keys.DOWN.code) {
					if (this._results.length > 0) {
						let selected = this._selected ? this._selected : this._results[0]
						this._selected = this._results[mod(this._results.indexOf(selected) + 1, this._results.length)]
					}
				}
				// disable key bindings
				e.stopPropagation()
				return true
			},
			style: {
				"line-height": px(inputLineHeight),
				//'min-height': px(inputLineHeight),
			}
		})
	}


	focus() {
		if (!this.focused) {
			this.focused = true
			this.expanded = true
			this._domInput.focus()
			this._domInput.select()
			this.search()
			//this._domWrapper.classList.add("active")
		}
	}

	blur(e: MouseEvent) {
		//this._domInput.classList.remove("active")
		this.focused = false
		closeOverlay()
		if (this.value().trim() == "") {
			this.expanded = false
		}
	}

	isVisible() {
		return styles.isDesktopLayout() && logins.isInternalUserLoggedIn() // || this.isSearchViewVisible
	}

}