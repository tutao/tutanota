/**
 *  Delegate for receiving status of upstream messages sent via Google Cloud Messaging.
 */
@protocol GCMReceiverDelegate <NSObject>

@optional
/**
 *  The callback is invoked once GCM processes the message. If processing fails, the
 *  callback is invoked with a valid error object representing the error.
 *  Otherwise, the message is ready to be sent.
 *
 *  @param messageID The messageID for the message that failed to be sent upstream.
 *  @param error     The error describing why the send operation failed.
 */
- (void)willSendDataMessageWithID:(NSString *)messageID error:(NSError *)error;

/**
 *  This callback is invoked if GCM successfully sent the message upstream
 *  and the message was successfully received.
 *
 *  @param messageID The messageID for the message sent.
 */
- (void)didSendDataMessageWithID:(NSString *)messageID;

/**
 *  Called when the GCM server deletes pending messages due to exceeded
 *  storage limits. This may occur, for example, when the device cannot be
 *  reached for an extended period of time.
 *
 *  It is recommended to retrieve any missing messages directly from the
 *  app server.
 */
- (void)didDeleteMessagesOnServer;

@end
