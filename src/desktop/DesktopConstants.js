//@flow

export type NotificationResultEnum = $Values<typeof NotificationResult>
export const NotificationResult = Object.freeze({
	Click: 'click',
	Close: 'close'
})
