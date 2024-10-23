import styles from "./Counter.module.css"
import m from "mithril"
import { CounterAttrs } from "./Counter.types.js"

const Counter = () => {
	let count: number

	const increment = (callBack: CounterAttrs["onChange"]) => {
		count++
		console.log(count)

		return callBack(count)
	}

	const decrement = (callBack: CounterAttrs["onChange"]) => {
		count--
		console.log(count)
		return callBack(count)
	}

	return {
		oninit: (vnode: m.Vnode<CounterAttrs>) => {
			count = vnode.attrs.value ?? 0
		},
		view: (vnode: m.Vnode<CounterAttrs>) => {
			return m(`div`, { class: styles.counter }, [
				m(`button`, { class: styles.button, onclick: decrement.bind(this, vnode.attrs.onChange) }, "-"),
				m("p", count),
				m(`button`, { class: styles.button, onclick: increment.bind(this, vnode.attrs.onChange) }, "+"),
			])
		},
	}
}

export default Counter
