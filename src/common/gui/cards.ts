import { styles } from "./styles.js"

export function responsiveCardHMargin() {
	return styles.isSingleColumnLayout() ? "mlr" : "mlr-l"
}

export function responsiveCardHPadding() {
	return styles.isSingleColumnLayout() ? "plr" : "plr-l"
}
