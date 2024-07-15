import { Cat, log, timer } from "../misc/Log"
import { size } from "./size"
import { assertMainOrNodeBoot, isAdminClient, isTest } from "../api/common/Env"
import { windowFacade } from "../misc/WindowFacade"
import { theme } from "./theme"
import { assertNotNull, neverNull } from "@tutao/tutanota-utils"
import { client } from "../misc/ClientDetector"
import { ThemeController } from "./ThemeController.js"

assertMainOrNodeBoot()

export type StyleSheetId = "main" | "outline"

/**
 * Writes all styles to a single dom <style>-tag
 */

class Styles {
	styles: Map<StyleSheetId, (...args: Array<any>) => any>
	initialized: boolean
	bodyWidth: number
	bodyHeight: number

	private styleSheets = new Map<StyleSheetId, HTMLStyleElement>()

	constructor() {
		this.initialized = false
		this.styles = new Map()
		this.bodyWidth = neverNull(document.body).offsetWidth
		this.bodyHeight = neverNull(document.body).offsetHeight
		windowFacade.addResizeListener((width: number, height: number) => {
			this.bodyWidth = width
			this.bodyHeight = height
		})
	}

	init(themeController: ThemeController) {
		if (this.initialized) return
		this.initialized = true

		this.updateDomStyles()

		themeController.observableThemeId.map(() => {
			this.updateDomStyles()
		})
	}

	getStyleSheetElement(id: StyleSheetId): Node {
		return assertNotNull(this.styleSheets.get(id)).cloneNode(true)
	}

	isDesktopLayout(): boolean {
		return this.bodyWidth >= size.desktop_layout_width
	}

	isSingleColumnLayout(): boolean {
		return this.bodyWidth < size.two_column_layout_width
	}

	isTwoColumnLayout(): boolean {
		return this.bodyWidth >= size.two_column_layout_width && this.bodyWidth < size.desktop_layout_width
	}

	isUsingBottomNavigation(): boolean {
		return !isAdminClient() && (client.isMobileDevice() || !this.isDesktopLayout())
	}

	registerStyle(id: StyleSheetId, styleCreator: (...args: Array<any>) => any) {
		if (!this.initialized && this.styles.has(id)) {
			throw new Error("duplicate style definition: " + id)
		}

		this.styles.set(id, styleCreator)

		if (this.initialized) {
			log(Cat.css, "update style", id, styleCreator(theme))

			this.updateDomStyle(id, styleCreator)
		}
	}

	updateStyle(id: StyleSheetId) {
		if (!this.initialized || !this.styles.has(id)) {
			throw new Error("cannot update nonexistent style " + id)
		}

		const creator = neverNull(this.styles.get(id))
		log(Cat.css, "update style", id, creator(theme))

		this.updateDomStyle(id, creator)
	}

	private updateDomStyles() {
		// This is hacking but we currently import gui stuff from a lot of tested things
		if (isTest()) {
			return
		}

		let time = timer(Cat.css)
		Array.from(this.styles.entries()).map((entry) => {
			this.updateDomStyle(entry[0], entry[1])
		})
		log(Cat.css, "creation time", time())
	}

	private updateDomStyle(id: StyleSheetId, styleCreator: (...args: Array<any>) => any) {
		const styleSheet = this.getDomStyleSheet(`css-${id}`)
		styleSheet.textContent = toCss(styleCreator())
		this.styleSheets.set(id, styleSheet)
	}

	private getDomStyleSheet(id: string): HTMLStyleElement {
		let styleDomElement = document.getElementById(id)

		if (!styleDomElement) {
			styleDomElement = document.createElement("style")
			styleDomElement.setAttribute("type", "text/css")
			styleDomElement.id = id
			styleDomElement = document.getElementsByTagName("head")[0].appendChild(styleDomElement)
		}

		return styleDomElement as HTMLStyleElement
	}
}

function objectToCss(indent: string, key: string, o: Record<string, string>) {
	let cssString = `${indent}${key} { \n`
	cssString += indent + toCss(o, indent + "  ")
	cssString += ` \n${indent}} \n`
	return cssString
}

function toCss(obj: Record<string, any>, indent = "") {
	let ret = Object.keys(obj)
		.map((key) => {
			if (obj[key] instanceof Array) {
				return obj[key]
					.map((o: any) => {
						return objectToCss(indent, key, o)
					})
					.join("\n")
			} else if (obj[key] instanceof Object) {
				return objectToCss(indent, key, obj[key])
			} else {
				return `${indent}${key}: ${obj[key]};`
			}
		})
		.join("\n")
	return ret
}

export const styles: Styles = new Styles()
