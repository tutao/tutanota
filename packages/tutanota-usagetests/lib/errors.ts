export class UsageTestError extends Error {
}

export class StageCompletionError extends UsageTestError {
}

export class MetricNotCollectedError extends UsageTestError {
}

export class StageNotRegisteredError extends UsageTestError {
}

export class StageAlreadyRegisteredError extends UsageTestError {
}

export class UsageTestNotRegisteredError extends UsageTestError {

}