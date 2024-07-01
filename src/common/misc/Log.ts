import { assertMainOrNodeBoot } from "../api/common/Env"

assertMainOrNodeBoot()
type LogCategory = Record<string, string>
export const Cat: Record<string, LogCategory> = {
	css: {
		name: "css",
		color: "orange",
	},
	mithril: {
		name: "mithril",
		color: "darkgreen",
	},
	error: {
		name: "error",
		color: "red",
	},
	info: {
		name: "info",
		color: "lightblue",
	},
	debug: {
		name: "debug",
		color: "#009688",
	},
}
const activeCategories: LogCategory[] = []

export function enable(cat: LogCategory) {
	activeCategories.push(cat)
}

export function log(category: LogCategory, message: string, ...args: any[]) {
	if (activeCategories.indexOf(category) === -1) return
	console.log("%c" + category.name, "color:" + category.color, message, ...args)
}

export function timer(category: LogCategory): (...args: Array<any>) => any {
	if (activeCategories.indexOf(category) === -1) {
		return function () {}
	}

	let start = window.performance.now()
	return function () {
		return Math.round(window.performance.now() - start)
	}
}
