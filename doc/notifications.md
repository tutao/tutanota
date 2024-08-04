# Notifications

Notifications handling differs slightly between Desktop/Android and iOS, mostly in the
trigger part: Desktop/Android use SSE connection and when they receive "notification" event, they fetch 
MissedNotification (described below). iOS is triggered by APNS messages (background or foreground). New email 
notifications are fully controlled by the server for iOS, for SSE clients we get email notification in 
MissedNotification.

## MissedNotification

###GET

**URL**: `/rest/sys/missednotification/{ID}`

ID is the device id (PushIdentifier.identifier) converted to customId. To get
custom ID one converts a string to Base64URL.

**Headers**:

|Name						|Value
|---------------------------|-----
|userIds					|comma-separated list of user IDs who are logged in on this device
|lastProcessedNotificationId|Last returned lastProcessedNotificationId (explanation below) 
|v							|(system) model version
|cv							|client version

lastProcessedNotificationId is the last ID which was fetched and processed by the client. It is returned with
`MissedNotification`. Client doesn't have to understand it but it should just use it for the next request to not get
the same data twice.

**Returned**

200, `MissedNotification`. See model definition.

403, not authorized, userIds don't match missed notification, should invalidate local data

404, no missed notification to fetch (may still return empty MissedNotification in some cases)

### TTL
TTL is set to be 30 days currently. After that time notifications will be deleted and some may be missed. 
Clients should remember the last fetch time and if TTL has passed they should remove all local alarms and ask web part 
to `invalidateAlarms`. It is necessary so that client doesn't missed any alarm updates.




