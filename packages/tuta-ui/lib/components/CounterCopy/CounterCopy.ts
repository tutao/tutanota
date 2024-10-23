import styles from "./CounterCopy.module.css"
import m from "mithril"

const CounterCopy = () => {
	let count = 0

	return {
		view: () => {
			return m(`div.${styles.counter}`, [m("p", count)])
		},
	}
}

export default CounterCopy
