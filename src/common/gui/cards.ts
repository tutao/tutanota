import { styles } from "./styles.js"

export function responsiveCardHMargin() {
	return styles.isSingleColumnLayout() ? "mlr-8" : "mlr-l"
}

export function responsiveCardHPadding() {
	return styles.isSingleColumnLayout() ? "plr-8" : "plr-l"
}
