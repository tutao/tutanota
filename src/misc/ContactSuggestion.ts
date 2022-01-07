//@flow
import type {Suggestion} from "../gui/base/BubbleTextField"
import m from "mithril"
import {px, size} from "../gui/size"
import type {Contact} from "../api/entities/tutanota/Contact"

export const ContactSuggestionHeight = 60

export class ContactSuggestion implements Suggestion {
	name: string;
	mailAddress: string;
	contact: ?Contact;
	selected: boolean;
	view: Function;

	constructor(name: string, mailAddress: string, contact: ?Contact) {
		this.name = name
		this.mailAddress = mailAddress
		this.contact = contact
		this.selected = false

		this.view = vnode => m(".pt-s.pb-s.click.content-hover", {
			class: this.selected ? 'content-accent-fg row-selected' : '',
			onmousedown: vnode.attrs.mouseDownHandler,
			style: {
				'padding-left': this.selected ? px(size.hpad_large - 3) : px(size.hpad_large),
				'border-left': this.selected ? "3px solid" : null,
				height: px(ContactSuggestionHeight),
			}
		}, [
			m(".small.full-width.text-ellipsis", this.name),
			m(".name.full-width.text-ellipsis", this.mailAddress),
		])
	}

}
