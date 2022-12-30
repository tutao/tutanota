import {Component} from "mithril"
import {ViewSlider} from "./gui/nav/ViewSlider.js"

export interface TopLevelAttrs {
	requestedPath: string
	args: Record<string, any>
}

/**
 * An interface that all top-levels views must comfort to.
 */
export interface CurrentView<Attrs extends TopLevelAttrs = TopLevelAttrs> extends Component<Attrs> {
	/** Called when URL is updated. Optional as is only needed for old-style components (the ones we instantiate manually) */
	updateUrl?(args: Record<string, any>, requestedPath: string): void

	readonly getViewSlider?: () => ViewSlider | null

	/** @return true if view handled press itself */
	readonly handleBackButton?: () => boolean
}