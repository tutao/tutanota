/** Error codes in Greenhouse error domain. */
typedef enum {
  /**
   * Operation succeeded.
   */
  kGGLErrorCodeSucceeded = 0,
  /**
   * Default failure error code. This is a catch all error and indicates something has gone very
   * wrong. There is no remediation for this case.
   **/
  kGGLErrorCodeUnknownFailure = -1,

  /**
   * Indicates that the calling method did not do anything in response to the call. This occurs in
   * situations where the caller asked state to be mutated into its current state or selector wasn't
   * present but it isn't considered a critical failure..
   */
  kGGLErrorCodeNoOp = -2,

  // 100 series error codes are for GGLContext
  /**
   * Loading data from the GoogleService-Info.plist file failed. This is a fatal error and should
   * not be ignored. Further calls to the API will fail and/or possibly cause crashes.
   */
  kGGLErrorCodeInvalidPlistFile = -100,

  /**
   * Configuration of AdMob subspec failed. Additional details on the reason for the failure
   * appear in the related NSError.
   */
  kGGLErrorCodeAdMobSubspecConfigFailed = -101,

  /**
   * Configuration of Analytics subspec failed. Additional details on the reason for the failure
   * appear in the related NSError.
   */
  kGGLErrorCodeAnalyticsSubspecConfigFailed = -102,

  /**
   * Configuration of AppInvite subspec failed. Additional details on the reason for the failure
   * appear in the related NSError.
   */
  kGGLErrorCodeAppInviteSubspecConfigFailed = -103,

  /**
   * Configuration of CloudMessaging subspec failed. Additional details on the reason for the failure
   * appear in the related NSError.
   */
  kGGLErrorCodeCloudMessagingSubspecConfigFailed = -104,

  /**
   * Configuration of SignIn subspec failed. Additional details on the reason for the failure appear
   * in the related NSError.
   */
  kGGLErrorCodeSignInSubspecConfigFailed = -105,
} GGLErrorCode;
