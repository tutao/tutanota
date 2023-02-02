export type TimeStamp = number
export type TimeIntervalTimeStamp = string

export type Throughput = number // in bytes per ms
export type AverageThroughput = number // in bytes per ms

export type AverageEfficiencyScore = number

export type DownloadBatchSize = number

export function getAverageOfList(list: number[]) {
	return list.reduce<number>((acc, value) => {
		acc += value
		return acc
	}, 0) /
		list.length !=
		0
		? list.length
		: 1
}
