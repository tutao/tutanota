import m from "mithril"
import { DefaultAnimationTime } from "../../animation/Animations"

export interface WizardProgressItem {
	label: string
	isCompleted: boolean
	isReachable: boolean
}

export interface WizardProgressViewItem extends WizardProgressItem {
	index: number
	isCurrent: boolean
	currentIndex: number
	isEnabled: boolean
}

export class WizardController {
	private _currentStep = 0
	private _steps: WizardProgressItem[] = []
	private _isInTransition = false

	constructor(initialLabels?: string[]) {
		if (initialLabels) this.initSteps(initialLabels)
	}

	public initSteps(initialLabels: string[]) {
		this._steps = initialLabels.map((label, index) => ({
			label,
			isCompleted: false,
			isReachable: index === 0,
		}))
	}

	get currentStep(): number {
		return this._currentStep
	}

	get stepCount(): number {
		return this._steps.length
	}

	get progressItems(): WizardProgressItem[] {
		return this._steps
	}

	get isInTransition() {
		return this._isInTransition
	}

	public setStep(target: number): void {
		if (target < 0 || target >= this._steps.length) return
		this._isInTransition = true
		setTimeout(() => {
			this._currentStep = target
			m.redraw()
			this._isInTransition = false
		}, DefaultAnimationTime * 2)
	}

	public lockAllPreviousSteps(index: number): void {
		if (index >= this._steps.length) return
		for (let i = 0; i < index; i++) {
			this._steps[i].isReachable = false
		}
		m.redraw()
	}

	public setStepUnreachable(index: number): void {
		if (index >= this._steps.length) return
		this._steps[index].isReachable = false
		m.redraw()
	}

	public setStepLabel(index: number, label: string): void {
		if (index < 0 || index >= this._steps.length) return
		this._steps[index].label = label
	}

	public getStepLabel(index: number): string {
		if (index < 0 || index >= this._steps.length) return ""
		return this._steps[index].label
	}

	public markStepComplete(index: number, isCompleted: boolean = true): void {
		if (index < 0 || index >= this._steps.length) return
		this._steps[index].isCompleted = isCompleted

		if (isCompleted && index + 1 < this._steps.length) {
			this._steps[index + 1].isReachable = true
		} else if (!isCompleted && index + 1 < this._steps.length) {
			this._steps[index + 1].isReachable = false
		}
	}
}

export interface WizardStepContext<TViewModel> {
	index: number
	viewModel: TViewModel
	controller: WizardController

	setLabel(label: string): void
	getLabel(): string
	markComplete(isCompleted?: boolean): void
	goNext(): void
	goPrev(): void
	lockAllPreviousSteps(): void
}
