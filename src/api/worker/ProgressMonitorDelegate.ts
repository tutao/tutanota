//@flow

import {WorkerImpl} from "./WorkerImpl"
import type {IProgressMonitor, ProgressMonitorId} from "../common/utils/ProgressMonitor"

export class ProgressMonitorDelegate implements IProgressMonitor {
	_worker: WorkerImpl
	_ref: Promise<ProgressMonitorId>
	_totalAmount: number

	constructor(totalAmount: number, worker: WorkerImpl) {
		this._worker = worker
		this._totalAmount = totalAmount
		this._ref = this._worker.createProgressMonitor(totalAmount)
	}

	workDone(amount: number) {
		this._ref.then(refIdentifier => {
			this._worker.progressWorkDone(refIdentifier, amount)
		})
	}

	completed() {
		this._ref.then(refIdentifier => {
			this._worker.progressWorkDone(refIdentifier, this._totalAmount)
		})
	}
}