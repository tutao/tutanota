// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel.js"
import stream from "mithril/stream/stream.js"
import {inputLineHeight, px} from "../gui/size"
import type {ButtonAttrs} from "../gui/base/ButtonN.js"
import {ButtonN, ButtonType} from "../gui/base/ButtonN.js"

export class BuyOptionBox {

	_actionId: string;
	_buttonAttrs: ButtonAttrs;
	view: Function;
	nextYearPrice: stream<string>;
	referencePrice: stream<?string>;
	price: stream<string>;
	_helpLabel: string;
	_features: lazy<string[]>;
	_injection: ?Component;
	selected: boolean;

	constructor(headingIdOrFunction: string | lazy<string>, actionTextId: string, actionClickHandler: clickHandler, features: lazy<string[]>, width: number, height: number) {
		this._actionId = actionTextId
		this._buttonAttrs = {
			label: actionTextId,
			click: actionClickHandler,
			type: ButtonType.Login,
		}
		this.nextYearPrice = stream(null)
		this.referencePrice = stream(null)
		this.price = stream(lang.get("emptyString_msg"))
		this._helpLabel = lang.get("emptyString_msg")
		this._features = features
		this.selected = false

		this.view = (): ?VirtualElement => {
			return m("", {
				style: {
					"margin": "10px 9px 10px 9px", // we can not use 10px left/right because on Firefox the scrollbar would wrap the third box
					width: px(width),
					padding: "10px"
				}
			}, [
				m(".buyOptionBox" + (!this.selected ? ".selected" : ""), {
					style: {height: px(height)}
				}, [
					this.referencePrice() ? m(".ribbon-vertical", m(".center.b.h4", {style: {'padding-top': px(22)}}, "%")) : null,
					m(".h4.center.dialog-header.dialog-header-line-height", lang.getMaybeLazy(headingIdOrFunction)),
					m(".center.pt.flex.items-center.justify-center", [
						m("span.h1", this.price()),
						this.referencePrice() ? m("span.strike.pl", "(" + this.referencePrice() + ")") : null
					]),
					m(".small.center", this._helpLabel),
					this._injection ? m(this._injection) : null,
					m(".button-min-height", {
						style: {
							position: "absolute",
							bottom: px(10),
							left: px(10),
							right: px(10)
						}
					}, this.selected
						? m(".buyOptionBox.selected.content-accent-fg.items-center.center", lang.get("pricing.currentPlan_label"))
						: m(ButtonN, this._buttonAttrs))
				]), m(".flex.flex-column.pt", {
					style: {lineHeight: px(inputLineHeight)}
				}, this._features().map(f => m(".flex-center.center.dialog-header.text-prewrap",
					// {style: {borderBottom: `1px solid ${theme.content_border}`}},
					[m(".align-self-center", f)])))
			])
		}
	}

	setReferencePrice(value: ?string): BuyOptionBox {
		this.referencePrice(value)
		return this
	}

	setNextYearPrice(value: ?string): BuyOptionBox {
		this.nextYearPrice(value)
		return this
	}

	setPrice(value: string): BuyOptionBox {
		this.price(value)
		return this
	}

	setHelpLabel(value: string): BuyOptionBox {
		this._helpLabel = value
		return this
	}

	setInjection(injection: Component) {
		this._injection = injection
	}
}










