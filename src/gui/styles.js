// @flow
import {Cat, log, timer} from "../misc/Log"
import {size} from "./size"
import {assertMainOrNodeBoot, isAdminClient} from "../api/Env"
import {windowFacade} from "../misc/WindowFacade"
import {theme, themeId} from "./theme"
import {neverNull} from "../api/common/utils/Utils"
import {client} from "../misc/ClientDetector"

assertMainOrNodeBoot()

/**
 * Writes all styles to a single dom <style>-tag
 */
class Styles {
	styles: Map<string, Function>;
	initialized: boolean;
	bodyWidth: number;
	bodyHeight: number;

	constructor() {
		this.initialized = false
		this.styles = new Map()
		this.bodyWidth = neverNull(document.body).offsetWidth
		this.bodyHeight = neverNull(document.body).offsetHeight
		windowFacade.addResizeListener((width: number, height: number) => {
			this.bodyWidth = width
			this.bodyHeight = height
		})
		themeId.map(() => {
			this._updateDomStyles()
		})
	}

	init() {
		if (this.initialized) return
		this.initialized = true
		this._updateDomStyles()
	}

	registerStyle(id: string, styleCreator: Function) {
		if (!this.initialized && this.styles.has(id)) {
			throw new Error("duplicate style definition: " + id)
		}
		this.styles.set(id, styleCreator)
		if (this.initialized) {
			log(Cat.css, "update style", id, styleCreator(theme))
			this._updateDomStyle(id, styleCreator)
		}
	}

	updateStyle(id: string) {
		if (!this.initialized || !this.styles.has(id)) {
			throw new Error("cannot update nonexistent style " + id)
		}
		const creator = neverNull(this.styles.get(id))
		log(Cat.css, "update style", id, creator(theme))
		this._updateDomStyle(id, creator)
	}

	_updateDomStyles() {
		let time = timer(Cat.css)
		Array.from(this.styles.entries()).map((entry) => {
			this._updateDomStyle(entry[0], entry[1])
		})
		log(Cat.css, 'creation time', time())
	}

	_updateDomStyle(id: string, styleCreator: Function) {
		this._getDomStyleSheet(id).textContent = toCss(styleCreator())
	}

	_getDomStyleSheet(id: string): HTMLElement {
		let styleDomElement = document.getElementById('css-' + id)
		if (!styleDomElement) {
			styleDomElement = document.createElement('style');
			styleDomElement.setAttribute('type', 'text/css');
			styleDomElement.id = 'css-' + id
			styleDomElement = document.getElementsByTagName('head')[0].appendChild(styleDomElement);
		}
		return styleDomElement
	}

	isDesktopLayout(): boolean {
		return this.bodyWidth >= size.desktop_layout_width;
	}

	isSingleColumnLayout(): boolean {
		return this.bodyWidth < size.two_column_layout_width;
	}

	isUsingBottomNavigation(): boolean {
		return !isAdminClient() && (client.isMobileDevice() || !this.isDesktopLayout())
	}
}

function objectToCss(indent, key, o) {
	let cssString = `${indent}${key} { \n`
	cssString += indent + toCss(o, indent + '  ')
	cssString += ` \n${indent}} \n`
	return cssString
}

function toCss(obj, indent = '') {
	let ret = Object.keys(obj).map(key => {
		if (obj[key] instanceof Array) {
			return obj[key].map(o => {
				return objectToCss(indent, key, o)
			}).join('\n')
		} else if (obj[key] instanceof Object) {
			return objectToCss(indent, key, obj[key])
		} else {
			return `${indent}${key}: ${obj[key]};`
		}
	}).join("\n")
	return ret
}

export const styles: Styles = new Styles()
