// @flow
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import type {SettingsSection} from "./SettingsModel"

export type DetailsColumnViewerAttrs = {
	section: SettingsSection
}


export class DetailsColumnViewer implements MComponent<DetailsColumnViewerAttrs> {

	view(vnode: Vnode<DetailsColumnViewerAttrs>): Children {
		const {section} = vnode.attrs
		return m(".fill-absolute.scroll.plr-l.pb-floating", [
			section.settingsValues.map(value => {
				return m(".mt-l", [
					m(value.component, value.attrs)
				])
			})
		])
	}
}

