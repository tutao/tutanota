/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

var pushServiceObj,
    ecb;

function createChannel(success, error) {
    if (pushServiceObj) {
        pushServiceObj.createChannel(function(result, token) {
            if (result == blackberry.push.PushService.SUCCESS) {
                if (success) {
                    success({
                        status: result,
                        token: token
                    });
                }
            } else {
                if (result == blackberry.push.PushService.INTERNAL_ERROR) {
                    error("Error: An internal error occurred during the create channel. Try registering again.");
                } else if (result == blackberry.push.PushService.CREATE_SESSION_NOT_DONE) {
                    error("Error: No call to blackberry.push.PushService.create "
                          + "was done before creating the channel. It usually means a programming error.");
                } else if (result == blackberry.push.PushService.MISSING_PORT_FROM_PPG) {
                    error("Error: A port could not be obtained from the "
                          + "PPG during the create channel. Try registering again.");
                } else if (result == blackberry.push.PushService.INVALID_DEVICE_PIN) {
                    // This error code only applies to a consumer application using the public/BIS PPG
                    error("Error: The PPG obtained the device's PIN during "
                          + "the create channel and considered it invalid. Try registering again.");
                } else if (result == blackberry.push.PushService.INVALID_PROVIDER_APPLICATION_ID) {
                    // This error code only applies to a consumer application using the public/BIS PPG
                    error("Error: The application ID was considered invalid or missing during the create channel.");
                } else if (result == blackberry.push.PushService.INVALID_PPG_SUBSCRIBER_STATE) {
                    // This error code only applies to a consumer application using the public/BIS PPG
                    error("Error: The subscriber on the PPG end reached an "
                          + "invalid state. Report this issue to the BlackBerry support team.");
                } else if (result == blackberry.push.PushService.EXPIRED_AUTHENTICATION_TOKEN_PROVIDED_TO_PPG) {
                    // This error code only applies to a consumer application using the public/BIS PPG
                    error("Error: An expired authentication token was"
                          + "passed to the PPG internally during the create channel. Try registering again.");
                } else if (result == blackberry.push.PushService.INVALID_AUTHENTICATION_TOKEN_PROVIDED_TO_PPG) {
                    // This error code only applies to a consumer application using the public/BIS PPG
                    error("Error: An invalid authentication token was passed "
                          + "to the PPG internally during the create channel. Report this issue to the BlackBerry support team.");
                } else if (result == blackberry.push.PushService.PPG_SUBSCRIBER_LIMIT_REACHED) {
                    // This error code only applies to a consumer application using the public/BIS PPG
                    error("Error: Too many devices have already peformed a "
                          + "create channel for this application ID. Contact BlackBerry to increase the subscription limit for this app.");
                } else if (result == blackberry.push.PushService.INVALID_OS_VERSION_OR_DEVICE_MODEL_NUMBER) {
                    // This error code only applies to a consumer application using the public/BIS PPG
                    error("Error: This device was found to have an invalid OS "
                          + " version or device model number during the create channel. Consider updating the OS on the device.");
                } else if (result == blackberry.push.PushService.MISSING_PPG_URL) {
                    // This error code only applies to a consumer application using the public/BIS PPG
                    error("Error: The PPG URL was considered "
                          + "invalid or missing during the create channel.");
                } else if (result == blackberry.push.PushService.PUSH_TRANSPORT_UNAVAILABLE) {
                    // This error code only applies to a consumer application using the public/BIS PPG
                    error("Error: Create channel failed as the push transport "
                          + "is unavailable. Verify your mobile network and/or Wi-Fi are turned on. If they are on, you will "
                          + "be notified when the push transport is available again.");
                } else if (result == blackberry.push.PushService.PPG_SERVER_ERROR) {
                    // This error code only applies to a consumer application using the public/BIS PPG
                    error("Error: Create channel failed as the PPG is "
                          + "currently returning a server error. You will be notified when the PPG is available again.");
                } else if (result == blackberry.push.PushService.MISSING_SUBSCRIPTION_RETURN_CODE_FROM_PPG) {
                    // This error code only applies to a consumer application using the public/BIS PPG
                    error("Error: There was an internal issue obtaining "
                          + "the subscription return code from the PPG during the create channel. Try registering again.");
                } else if (result == blackberry.push.PushService.INVALID_PPG_URL) {
                    // This error code only applies to a consumer application using the public/BIS PPG
                    error("Error: The PPG URL was considered invalid during the create channel.");
                } else {
                    error("Error: Received error code (" + result + ") when creating channel");
                }
            }


        });
    }


}

function onInvoked(invokeRequest) {
    var pushPayload,
        pushCallback;

    if (invokeRequest.action && invokeRequest.action == "bb.action.PUSH") {
        if (ecb) {
            pushCallback = eval(ecb);

            if (typeof pushCallback === "function") {
                pushPayload = pushServiceObj.extractPushPayload(invokeRequest);
                pushCallback(pushPayload);
            }
        }
    }
}

module.exports = {

    register: function(success, error, args) {
        var ops = args[0],
            simChangeCallback = ops.simChangeCallback,
            pushTransportReadyCallback = ops.pushTransportReadyCallback,
            launchApplicationOnPush = ops.launchApplicationOnPush !== undefined ? ops.launchApplicationOnPush : true;

            ecb = ops.ecb;

        blackberry.push.PushService.create(ops, function(obj) {
            pushServiceObj = obj;

            // Add an event listener to handle incoming invokes
            document.addEventListener("invoked", onInvoked, false);
            pushServiceObj.launchApplicationOnPush(launchApplicationOnPush , function (result) {
                if (result != blackberry.push.PushService.SUCCESS ) {
                    if (result == blackberry.push.PushService.INTERNAL_ERROR) {
                        error("Error: An internal error occurred while calling launchApplicationOnPush.");
                    } else if (result == blackberry.push.PushService.CREATE_SESSION_NOT_DONE) {
                        error("Error: Called launchApplicationOnPush without an "
                              + "existing session. It usually means a programming error.");
                    } else {
                        error("Error: Received error code (" + result + ") after calling launchApplicationOnPush.");
                    }
                }
            });

            createChannel(success, error);
        }, function(result) {
            if (result == blackberry.push.PushService.INTERNAL_ERROR) {
                error("Error: An internal error occurred while calling "
                      + "blackberry.push.PushService.create. Try restarting the application.");
            } else if (result == blackberry.push.PushService.INVALID_PROVIDER_APPLICATION_ID) {
                // This error only applies to consumer applications that use a public/BIS PPG
                error("Error: Called blackberry.push.PushService.create with a missing "
                      + "or invalid appId value. It usually means a programming error.");
            } else if (result == blackberry.push.PushService.MISSING_INVOKE_TARGET_ID) {
                error("Error: Called blackberry.push.PushService.create with a missing "
                      + "invokeTargetId value. It usually means a programming error.");
            } else if (result == blackberry.push.PushService.SESSION_ALREADY_EXISTS) {
                error("Error: Called blackberry.push.PushService.create with an appId or "
                      + "invokeTargetId value that matches another application. It usually means a "
                      + "programming error.");
            } else {
                error("Error: Received error code (" + result + ") after "
                      + "calling blackberry.push.PushService.create.");
            }
        }, simChangeCallback, pushTransportReadyCallback);
    },

    unregister: function(success, error, args) {
        if (pushServiceObj) {
            pushServiceObj.destroyChannel(function(result) {

                document.removeEventListener("invoked", onInvoked, false);

                if (result == blackberry.push.PushService.SUCCESS ||
                    result == blackberry.push.PushService.CHANNEL_ALREADY_DESTROYED ||
                    result == blackberry.push.PushService.CHANNEL_ALREADY_DESTROYED_BY_PROVIDER ||
                    result == blackberry.push.PushService.CHANNEL_SUSPENDED_BY_PROVIDER ||
                    result == blackberry.push.PushService.PPG_SUBSCRIBER_NOT_FOUND ||
                    result == blackberry.push.PushService.CREATE_CHANNEL_NOT_DONE) {

                    success( { status: result } );
                } else {
                    if (result == blackberry.push.PushService.INTERNAL_ERROR) {
                        error("Error: An internal error occurred during "
                            + "the destroy channel. Try unregistering again.");
                    } else if (result == blackberry.push.PushService.CREATE_SESSION_NOT_DONE) {
                        error("Error: No call to blackberry.push.PushService.create "
                            + "was done before destroying the channel. It usually means a programming error.");
                    } else if (result == blackberry.push.PushService.INVALID_DEVICE_PIN) {
                        // This error code only applies to a consumer application using the public/BIS PPG
                        error("Error: The PPG obtained the device's PIN during "
                            + "the destroy channel and considered it invalid. Try unregistering again.");
                    } else if (result == blackberry.push.PushService.INVALID_PROVIDER_APPLICATION_ID) {
                        // This error code only applies to a consumer application using the public/BIS PPG
                        error("Error: The application ID was considered invalid or missing during the destroy channel.");
                    } else if (result == blackberry.push.PushService.INVALID_PPG_SUBSCRIBER_STATE) {
                        // This error code only applies to a consumer application using the public/BIS PPG
                        error("Error: The subscriber on the PPG end reached an "
                            + "invalid state. Report this issue to the BlackBerry support team.");
                    } else if (result == blackberry.push.PushService.EXPIRED_AUTHENTICATION_TOKEN_PROVIDED_TO_PPG) {
                        // This error code only applies to a consumer application using the public/BIS PPG
                        error("Error: An expired authentication token was"
                            + "passed to the PPG internally during the destroy channel. Try unregistering again.");
                    } else if (result == blackberry.push.PushService.INVALID_AUTHENTICATION_TOKEN_PROVIDED_TO_PPG) {
                        // This error code only applies to a consumer application using the public/BIS PPG
                        error("Error: An invalid authentication token was passed "
                            + "to the PPG internally during the destroy channel. Report this issue to the BlackBerry support team.");
                    } else if (result == blackberry.push.PushService.PUSH_TRANSPORT_UNAVAILABLE) {
                        // This error code only applies to a consumer application using the public/BIS PPG
                        error("Error: Destroy channel failed as the push transport "
                            + "is unavailable. Verify your mobile network and/or Wi-Fi are turned on. If they are on, you will "
                            + "be notified when the push transport is available again.");
                    } else if (result == blackberry.push.PushService.PPG_SERVER_ERROR) {
                        // This error code only applies to a consumer application using the public/BIS PPG
                        error("Error: Destroy channel failed as the PPG is "
                            + "currently returning a server error. You will be notified when the PPG is available again.");
                    } else if (result == blackberry.push.PushService.INVALID_PPG_URL) {
                        // This error code only applies to a consumer application using the public/BIS PPG
                        error("Error: The PPG URL was considered invalid during the destroy channel.");
                    } else {
                        error("Error: Received error code (" + result + ") from the destroy channel.");
                    }
                }
            });
        }
    }
};
require("cordova/exec/proxy").add("PushPlugin", module.exports);
