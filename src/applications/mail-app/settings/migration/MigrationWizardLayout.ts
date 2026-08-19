import m, { Component, Vnode } from "mithril"
import { WizardLayoutAttrs } from "../../../../ui/base/wizard/Wizard"
import { WizardProgress } from "../../../../ui/base/wizard/WizardProgress"
import { px, size } from "../../../../ui/size"

/**
 * A wizard layout that stretches to fill its container instead of the default signup-style
 * centered/viewport-relative layout (`margin: auto`, `vw`/`vh` padding, `max-width`), while keeping
 * the same vertical progress side rail (`WizardProgress`) the Sign-Up flow uses.
 * Meant for embedding the migration wizard inline in the settings column, which is widened for this
 * folder via `SettingsFolder.wantsWideDetailsColumn`.
 */
export class MigrationWizardLayout<TViewModel> implements Component<WizardLayoutAttrs<TViewModel>> {
	view(vnode: Vnode<WizardLayoutAttrs<TViewModel>>) {
		const { progressState, showProgress, backButton } = vnode.attrs
		return m(".full-width.flex.row.gap-32", { style: { padding: `${px(size.spacing_24)} 0` } }, [
			m(".flex.col.gap-16", { style: { width: "220px", flex: "none" } }, [
				backButton,
				showProgress ? m(WizardProgress, { progressState, labelMaxLength: 24 }) : null,
			]),
			m(".flex-grow", vnode.children),
		])
	}
}
