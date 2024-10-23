import styles from "./Counter.module.css"
import m from "mithril"
import { CounterAttrs } from "./Counter.types.js"

const Counter = () => {
	let count = 0

	return {
		oninit: (vnode: m.Vnode<CounterAttrs>) => {
			count = vnode.attrs.value
		},
		view: () => {
			return m(`div.${styles.counter}`, [
				m(`button.${styles.button}`, { onclick: () => count-- }, "-"),
				m("p", count),
				m(`button.${styles.button}`, { onclick: () => count++ }, "+"),
			])
		},
	}
}

export default Counter
