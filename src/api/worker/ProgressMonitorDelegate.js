//@flow

import type {ProgressMonitorId} from "../common/utils/Utils"
import {WorkerImpl} from "./WorkerImpl"

export class ProgressMonitorDelegate {
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