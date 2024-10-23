import "./style.css"
import m from "mithril"
import { Counter, CounterAttrs, CounterCopy } from "../dist/main"

const root: HTMLElement = document.getElementById("app")!

const onChange = (newValue: number) => {
	defaultAttrs.value = newValue
	console.log(defaultAttrs.value)
}

const defaultAttrs: CounterAttrs = {
	value: 15,
	onChange,
}

const Wrapper = {
	view: () => {
		return m("", [m(Counter, defaultAttrs), m(CounterCopy)])
	},
}
m.mount(root as Element, Wrapper)
