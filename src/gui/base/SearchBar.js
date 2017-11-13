// @flow
import {TextField, inputLineHeight, Type} from "./TextField"
import m from "mithril"
import {Icons} from "./icons/Icons"
import {logins} from "../../api/main/LoginController"
import {styles} from "../styles"
import {px} from "../size"
import stream from "mithril/stream/stream.js"
import {theme} from "../theme"
import {Icon} from "./Icon"
import {DefaultAnimationTime} from "../animation/Animations"


export class SearchBar {
	view: Function;
	inputField: TextField;
	_domInput: HTMLInputElement;
	_domWrapper: HTMLElement;
	value: stream<string>;
	focused: boolean;
	expanded: boolean;
	searchHandler: function;


	constructor() {
		this.expanded = false
		this.focused = false
		this.value = stream("")
		this.view = (): VirtualElement => {
			return this.isVisible() ? m(".search-bar.flex-end.items-center", {
					oncreate: (vnode) => this._domWrapper = vnode.dom,
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
						onclick: (e) => this.handleSearchClick(e)
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
							"-webkit-transition": `width ${DefaultAnimationTime}ms`,
							'padding-left': this.expanded ? '10px' : '0px',
							'padding-top': '3px',
							'padding-bottom': '3px',
							'overflow-x': 'hidden'
						}

					}, [this._getInputField(), m(".closeIconWrapper", {
						onclick: (e) => this.handleCloseClick(e),
					}, m(Icon, {
						icon: Icons.Close,
						class: "flex-center items-center icon-large",
						style: {
							fill: theme.header_button,
							//"margin-top": (this._hideLabel) ? "0px" : "-2px"
						}
					}))])
				]) : m("")
		}
	}


	handleSearchClick(e: MouseEvent) {
		console.log("search click", e)
		if (!this.focused) {
			this.focus()
		}
		if (!this.expanded) {
			this.expanded = true
			this.value("")
		} else {
			this.searchHandler(this.value())
		}

	}

	handleCloseClick(e: MouseEvent) {
		console.log("close click", e)
		if (this.expanded) {
			this.expanded = false
			this.value("")
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
			onblur: e => this.blur(e),
			oninput: e => {
				this.value(this._domInput.value) // update the input on each change
			},
			onkeydown: e => {
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
			this._domInput.focus()
			//this._domWrapper.classList.add("active")
		}
	}

	blur(e: MouseEvent) {
		//this._domInput.classList.remove("active")
		this.focused = false
	}

	isVisible() {
		return styles.isDesktopLayout() && logins.isInternalUserLoggedIn() // || this.isSearchViewVisible
	}

}