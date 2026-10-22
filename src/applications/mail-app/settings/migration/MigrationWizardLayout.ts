import m, { Component, Vnode } from "mithril"
import { WizardLayoutAttrs } from "../../../../ui/base/wizard/Wizard"
import { WizardProgress } from "../../../../ui/base/wizard/WizardProgress"

/**
 * A wizard layout that stretches to fill its container instead of the default signup-style
 * centered/viewport-relative layout (`margin: auto`, `vw`/`vh` padding, `max-width`), while keeping
 * the same vertical progress side rail (`WizardProgress`) the Sign-Up flow uses.
 * Meant for embedding the migration wizard inline in the settings column, which is widened and takes over
 * the details column for this folder via `SettingsFolder.columnLayout` (`SettingsFolderColumnLayout.TwoColumn`).
 */
export class MigrationWizardLayout<TViewModel> implements Component<WizardLayoutAttrs<TViewModel>> {
	view(vnode: Vnode<WizardLayoutAttrs<TViewModel>>) {
		const { progressState, showProgress, backButton } = vnode.attrs
		return m(".full-width.flex.row.gap-32.height-100p.pt-24.pb-24", [
			m(".flex.col.flex-space-between.gap-16.flex-fixed", { style: { width: "220px" } }, [
				showProgress ? m(WizardProgress, { progressState, labelMaxLength: 24 }) : null,
				backButton,
			]),
			m(".flex-grow", vnode.children),
		])
	}
}
