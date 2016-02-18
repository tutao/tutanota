#if GMP_NO_MODULES
#import <Foundation/Foundation.h>
#else
@import Foundation;
#endif

@class GGLInstanceIDConfig;

/**
 *  @memberof GGLInstanceID
 *
 *  The key for APNS token to be included in the options dictionary when
 *  registering for GCM (Google Cloud Messaging). The value should be a
 *  NSData object that represents the APNS token for the app. This
 *  key is required to get a GCM token.
 */
FOUNDATION_EXPORT NSString *const kGGLInstanceIDRegisterAPNSOption;

/**
 *  @memberof GGLInstanceID
 *
 *  The key to specify if the APNS token type is sandbox or production. Set
 *  to YES if the app was built with Sandbox certificate else NO for production.
 *  At any point of time InstanceID library will support only one type of token.
 */
FOUNDATION_EXPORT NSString *const kGGLInstanceIDAPNSServerTypeSandboxOption;

/**
 *  @memberof GGLInstanceID
 *
 *  The scope to be used when fetching/deleting a token for
 *  GCM (Google Cloud Messaging).
 */
FOUNDATION_EXPORT NSString *const kGGLInstanceIDScopeGCM;

/**
 *  @related GGLInstanceID
 *
 *  The completion handler invoked when the InstanceID token returns. If
 *  the call fails we return the appropriate `error code` as described below.
 *
 *  @param token The valid token as returned by InstanceID backend.
 *
 *  @param error The error describing why generating a new token
 *               failed. See the error codes below for a more detailed
 *               description.
 */
typedef void(^GGLInstanceIDTokenHandler)(NSString *token, NSError *error);


/**
 *  @related GGLInstanceID
 *
 *  The completion handler invoked when the InstanceID `deleteToken` returns. If
 *  the call fails we return the appropriate `error code` as described below
 *
 *  @param error The error describing why deleting the token failed.
 *               See the error codes below for a more detailed description.
 */
typedef void(^GGLInstanceIDDeleteTokenHandler)(NSError *error);

/**
 *  @related GGLInstanceID
 *
 *  The completion handler invoked when the app identity is created. If the
 *  identity wasn't created for some reason we return the appropriate error code.
 *
 *  @param identity A valid identity for the app instance, nil if there was an error
 *                  while creating an identity.
 *  @param error    The error if fetching the identity fails else nil.
 */
typedef void(^GGLInstanceIDHandler)(NSString *identity, NSError *error);

/**
 *  @related GGLInstanceID
 *
 *  The completion handler invoked when the app identity and all the tokens associated
 *  with it are deleted. Returns a valid error object in case of failure else nil.
 *
 *  @param error The error if deleting the identity and all the tokens associated with
 *               it fails else nil.
 */
typedef void(^GGLInstanceIDDeleteHandler)(NSError *error);

/**
 * @enum GGLInstanceIDOperationErrorCode
 * Description of error codes
 */
typedef NS_ENUM(NSUInteger, GGLInstanceIDOperationErrorCode) {
  // Http related errors.

  /// InvalidRequest -- Some parameters of the request were invalid.
  kGGLInstanceIDOperationErrorCodeInvalidRequest = 0,

  /// Auth Error -- GCM couldn't validate request from this client.
  kGGLInstanceIDOperationErrorCodeAuthentication = 1,

  /// NoAccess -- InstanceID service cannot be accessed.
  kGGLInstanceIDOperationErrorCodeNoAccess = 2,

  /// Timeout -- Request to InstanceID backend timed out.
  kGGLInstanceIDOperationErrorCodeTimeout = 3,


  /// Network -- No network available to reach the servers.
  kGGLInstanceIDOperationErrorCodeNetwork = 4,

  /// OperationInProgress -- Another similar operation in progress,
  /// bailing this one.
  kGGLInstanceIDOperationErrorCodeOperationInProgress = 5,

  /// Unknown error.
  kGGLInstanceIDOperationErrorCodeUnknown = 7,

  // InstanceID specific errors

  /*
   *  Generic errors.
   */

  // Device seems to be missing a valid deviceID. Cannot
  // authenticate device requests.
  kGGLInstanceIDOperationErrorCodeMissingDeviceID = 501,

  /**
   *  Token specific errors.
   */

  /// GCM token request is missing APNS token.
  kGGLInstanceIDOperationErrorCodeMissingAPNSToken = 1001,

  /// GCM token request is missing server type.
  kGGLInstanceIDOperationErrorCodeMissingAPNSServerType = 1002,

  /// Token request has invalid authorizedEntity.
  kGGLInstanceIDOperationErrorCodeInvalidAuthorizedEntity = 1003,

  /// Token request  has invalid scope.
  kGGLInstanceIDOperationErrorCodeInvalidScope = 1004,

  /// Should call `startWithConfig:` before requesting token.
  kGGLInstanceIDOperationErrorCodeInvalidStart = 1005,

  /// KeyPair access error.
  kGGLInstanceIDOperationErrorCodeInvalidKeyPair = 1006,

  /**
   *  Identity specific errors.
   */

  /// Missing KeyPair.
  kGGLInstanceIDOperationErrorCodeMissingKeyPair = 2001,
};

/**
 *  Instance ID provides a unique identifier for each app instance and a mechanism
 *  to authenticate and authorize actions (for example, sending a GCM message).
 *
 *  Instance ID is long lived but, may be reset if the device is not used for
 *  a long time or the Instance ID service detects a problem.
 *  If Instance ID is reset, the app will be notified with a callback to
 *  [GGLInstanceIDDelegate onTokenRefresh]
 *
 *  If the Instance ID has become invalid, the app can request a new one and
 *  send it to the app server.
 *  To prove ownership of Instance ID and to allow servers to access data or
 *  services associated with the app, call
 *  `[GGLInstanceID tokenWithAuthorizedEntity:scope:options:handler]`.
 */
@interface GGLInstanceID : NSObject

/**
 *  GGLInstanceID.
 *
 *  @return A shared instance of GGLInstanceID.
 */
+ (instancetype)sharedInstance;

/**
 *  Start `GGLInstanceID` with the specified config.
 *
 *  @see GGLInstanceIDConfig
 *
 *  @param config The `GGLInstanceIDConfig` used to build the service.
 */
- (void)startWithConfig:(GGLInstanceIDConfig *)config;

/**
 *  Stop any network requests started by the client and release any handlers
 *  associated with it.
 */
- (void)stopAllRequests;

#pragma mark - Tokens

/**
 *  Returns a token that authorizes an Entity (example: cloud service) to perform
 *  an action on behalf of the application identified by Instance ID.
 *
 *  This is similar to an OAuth2 token except, it applies to the
 *  application instance instead of a user.
 *
 *  This is an asynchronous call. If the token fetching fails for some reason
 *  we invoke the completion callback with nil `token` and the appropriate
 *  error.
 *
 *  Note, you can only have one `token` or `deleteToken` call for a given
 *  authorizedEntity and scope at any point of time. Making another such call with the
 *  same authorizedEntity and scope before the last one finishes will result in an
 *  error with code `OperationInProgress`.
 *
 *  @see GGLInstanceID deleteTokenWithAuthorizedEntity:scope:handler:
 *
 *  @param authorizedEntity Entity authorized by the token.
 *  @param scope            Action authorized for authorizedEntity.
 *  @param options          The extra options to be sent with your token request. The
 *                          value for the `apns_token` should be the NSData object
 *                          passed to UIApplication's
 *                          `didRegisterForRemoteNotificationsWithDeviceToken` method.
 *                          All other keys and values in the options dict need to be
 *                          instances of NSString or else they will be discarded. Bundle
 *                          keys starting with 'GCM.' and 'GOOGLE.' are reserved.
 *  @param handler          The callback handler which is invoked when the token is
 *                          successfully fetched. In case of success a valid `token` and
 *                          `nil` error are returned. In case of any error the `token`
 *                          is nil and a valid `error` is returned. The valid error
 *                          codes have been documented above.
 */
- (void)tokenWithAuthorizedEntity:(NSString *)authorizedEntity
                            scope:(NSString *)scope
                          options:(NSDictionary *)options
                          handler:(GGLInstanceIDTokenHandler)handler;

/**
 *  Revokes access to a scope (action) for an entity previously
 *  authorized by `[GGLInstanceID tokenWithAuthorizedEntity:scope:options:handler]`.
 *
 *  This is an asynchronous call. Call this on the main thread since InstanceID lib
 *  is not thread safe. In case token deletion fails for some reason we invoke the
 *  `handler` callback passed in with the appropriate error code.
 *
 *  Note, you can only have one `token` or `deleteToken` call for a given
 *  authorizedEntity and scope at a point of time. Making another such call with the
 *  same authorizedEntity and scope before the last one finishes will result in an error
 *  with code `OperationInProgress`.
 *
 *  @param authorizedEntity Entity that must no longer have access.
 *  @param scope            Action that entity is no longer authorized to perform.
 *  @param handler          The handler that is invoked once the unsubscribe call ends.
 *                          In case of error an appropriate error object is returned
 *                          else error is nil.
 */
- (void)deleteTokenWithAuthorizedEntity:(NSString *)authorizedEntity
                                  scope:(NSString *)scope
                                handler:(GGLInstanceIDDeleteTokenHandler)handler;

#pragma mark - Identity

/**
 *  Asynchronously fetch a stable identifier that uniquely identifies the app
 *  instance. If the identifier has been revoked or has expired, this method will
 *  return a new identifier.
 *
 *
 *  @param handler The handler to invoke once the identifier has been fetched.
 *                 In case of error an appropriate error object is returned else
 *                 a valid identifier is returned and a valid identifier for the
 *                 application instance.
 */
- (void)getIDWithHandler:(GGLInstanceIDHandler)handler;

/**
 *  Resets Instance ID and revokes all tokens.
 */
- (void)deleteIDWithHandler:(GGLInstanceIDDeleteHandler)handler;

@end
