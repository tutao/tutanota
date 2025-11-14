export class WizardController {
	private _currentStep: number = 0

	constructor() {}

	get currentStep(): number {
		return this._currentStep
	}

	public setStep(target: number): void {
		this._currentStep = target
	}

	public next(): void {
		this.setStep(this._currentStep + 1)
	}

	public prev(): void {
		this.setStep(this._currentStep - 1)
	}

	public completeStep(target: number) {}
}
