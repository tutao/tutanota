import "./style.css"
import m from "mithril"
import { Counter, CounterAttrs, CounterCopy } from "../dist/main"

const root: HTMLElement = document.getElementById("app")!

const defaultAttrs: CounterAttrs = {
	value: 15,
}
const Wrapper = {
	view: () => {
		return m("", [m(Counter, defaultAttrs), m(CounterCopy)])
	},
}
m.mount(root as Element, Wrapper)
