import { Styles } from "./styles.js"

export function responsiveCardHMargin() {
	return Styles.get().isSingleColumnLayout() ? "mlr-8" : "mlr-24"
}

export function responsiveCardHPadding() {
	return Styles.get().isSingleColumnLayout() ? "plr-8" : "plr-24"
}
