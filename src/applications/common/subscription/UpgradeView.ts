import m, { ClassComponent, ComponentTypes, Vnode } from "mithril"
import { createWizard, WizardLayoutAttrs } from "../../../ui/base/wizard/Wizard"
import type { WizardStepComponentAttrs } from "../../../ui/base/wizard/WizardStep"
import { PlanSelectorPage } from "../signup/PlanSelectorPage"
import InvoiceAndPaymentDataPageNew from "../signup/InvoiceAndPaymentDataPageNew"
import { Dialog, DialogType } from "../../../ui/base/Dialog"
import { UpgradeViewModel } from "./UpgradeViewModel"
import { UpgradeConfirmSubscriptionPageNew } from "./UpgradeConfirmSubscriptionPageNew"
import { upgrade } from "./SubscriptionConfirmationUtils"
import { EnvProvider, PaymentSetup } from "@tutao/app-env"
import { px } from "../../../ui/size"
import { DialogHeaderBar } from "../../../ui/base/DialogHeaderBar"
import { ButtonType } from "../../../ui/base/Button"
import { Keys } from "../../../ui/utils/KeyboardKeys"
import { Styles } from "../../../ui/styles"
import { DefaultAnimationTime } from "../../../ui/animation/Animations"

export interface UpgradeViewAttrs {
	viewModel: UpgradeViewModel
	onClose: () => void
	onComplete?: () => void
	layout?: ComponentTypes<WizardLayoutAttrs<UpgradeViewModel>>
}

export function showUpgradeDialog(viewModel: UpgradeViewModel, onComplete?: () => void): Promise<void> {
	const isMobile = Styles.get().isMobileLayout()
	return new Promise<void>((resolve) => {
		const close = () => {
			dialog.close()
			resolve()
		}
		let previousHeight = 0
		let heightAnimation: Animation | undefined
		let dialogContent: HTMLElement
		const layout: m.Component<WizardLayoutAttrs<UpgradeViewModel>> = {
			oncreate: ({ dom }) => {
				dialogContent = dom as HTMLElement
			},
			onbeforeupdate: () => {
				previousHeight = dialogContent.getBoundingClientRect().height
			},
			onupdate: () => {
				if (isMobile) return
				heightAnimation?.cancel()
				const height = dialogContent.getBoundingClientRect().height
				if (height !== previousHeight) {
					heightAnimation = dialogContent.animate([{ height: px(previousHeight) }, { height: px(height) }], {
						duration: DefaultAnimationTime,
						easing: "ease-in-out",
					})
				}
			},
			onremove: () => heightAnimation?.cancel(),
			view: ({ attrs, children }) =>
				m(`.upgrade-dialog-content${isMobile ? ".fill-absolute" : ".overflow-hidden"}`, [
					m(DialogHeaderBar, {
						middle: "upgrade_action",
						left:
							attrs.ctx.index > 0 || (viewModel.options.businessUse() && viewModel.personalPlansAvailable)
								? [{ label: "back_action", click: attrs.ctx.goPrev, type: ButtonType.Secondary }]
								: [],
						right: [{ label: "close_alt", click: close, type: ButtonType.Secondary }],
					}),
					m(
						`.${isMobile ? "dialog-container" : "dialog-max-height"}.plr-24.pt-16.pb-24.text-break.scroll.flex.justify-center`,
						m(UpgradeWizardLayout, { ...attrs, backButton: null }, children),
					),
				]),
		}
		const dialog = new Dialog(isMobile ? DialogType.EditLarge : DialogType.EditLarger, {
			view: () =>
				m(UpgradeView, {
					viewModel,
					layout,
					onComplete,
					onClose: close,
				}),
		})
			.setCloseHandler(close)
			.addShortcut({ key: Keys.ESC, shift: false, exec: close, help: "close_alt" })
			.show()
	})
}

const UpgradeWizardLayout: m.Component<WizardLayoutAttrs<UpgradeViewModel>> = {
	view: ({ attrs: { ctx, backButton }, children }) =>
		m(
			".flex.col.gap-16.full-width.pt-16",
			{
				style: { maxWidth: px(ctx.index === 0 ? 1000 : 530) },
			},
			[backButton && m(".flex", backButton), m(`.wizard-page.full-width${ctx.controller.isInTransition ? ".wizard-page-transition" : ""}`, children)],
		),
}

const SettingsPlanSelectorPage: m.Component<WizardStepComponentAttrs<UpgradeViewModel>> = {
	view: ({ attrs }) => m(PlanSelectorPage, { ...attrs, forceMobileBusinessLayout: true }),
}

export class UpgradeView implements ClassComponent<UpgradeViewAttrs> {
	private readonly Wizard = createWizard<UpgradeViewModel>()
	private readonly ConfirmationPage: m.Component<WizardStepComponentAttrs<UpgradeViewModel>> = {
		view: ({ attrs: { ctx } }) =>
			m(UpgradeConfirmSubscriptionPageNew, {
				ctx,
				onEditPlan: () => {
					ctx.controller.setStepUnreachable(ctx.index)
					ctx.controller.setStep(0)
				},
				onEditPayment: () => {
					ctx.controller.setStepUnreachable(ctx.index)
					ctx.goPrev()
				},
				onPaymentIntervalChanged: () => ctx.viewModel.updatePrice(),
				onConfirm: () => upgrade(ctx.viewModel),
			}),
	}

	view({ attrs: { viewModel, onClose, onComplete, layout = UpgradeWizardLayout } }: Vnode<UpgradeViewAttrs>) {
		return m(
			"#upgrade-view",
			m(this.Wizard, {
				viewModel,
				layout,
				steps: [
					{
						title: "Select Plan",
						content: layout === UpgradeWizardLayout ? SettingsPlanSelectorPage : PlanSelectorPage,
						onNext: () => viewModel.updatePrice(),
						onPrev: () => {
							if (viewModel.options.businessUse() && viewModel.personalPlansAvailable) {
								viewModel.options.businessUse(false)
							} else {
								onClose()
							}
							return false
						},
					},
					{
						title: "Payment",
						content: InvoiceAndPaymentDataPageNew,
						isEnabled: () => EnvProvider.get().getPaymentSetup() === PaymentSetup.Default,
					},
					{ title: "Order Confirmation", content: this.ConfirmationPage },
				],
				onComplete: () => {
					onComplete?.()
					onClose()
				},
			}),
		)
	}
}
