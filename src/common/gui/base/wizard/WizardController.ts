export interface WizardProgressItem {
	label: string
	isCompleted: boolean
	isReachable: boolean
}

export interface WizardProgressViewItem extends WizardProgressItem {
	index: number
	isCurrent: boolean
	currentIndex: number
}

export class WizardController {
	private _currentStep = 0
	private _steps: WizardProgressItem[] = []

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

	get progress(): WizardProgressViewItem[] {
		return this._steps.map((step, index) => ({
			...step,
			index,
			isCurrent: index === this._currentStep,
			currentIndex: this._currentStep,
		}))
	}

	public setStep(target: number): void {
		if (target < 0 || target >= this._steps.length) return
		if (!this._steps[target].isReachable) return
		this._currentStep = target
	}

	public next(): void {
		this.setStep(this._currentStep + 1)
	}

	public prev(): void {
		this.setStep(this._currentStep - 1)
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
}
