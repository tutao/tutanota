export interface TestError {
	error: Error
	userMessage: string | null
}

export interface TestResult {
	name: string
	skipped: boolean
	errors: TestError[]
	timeout: number | null
}

export interface RunResult {
	filter?: string | undefined

	passedTests: {
		path: string[]
		result: TestResult
	}[]

	failingTests: {
		path: string[]
		result: TestResult
	}[]

	skippedTests: {
		path: string[]
		result: TestResult
	}[]
}
