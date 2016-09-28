/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/
package org.apache.cordova;

import java.util.ArrayList;
import java.util.LinkedList;

import android.util.Log;

/**
 * Holds the list of messages to be sent to the WebView.
 */
public class NativeToJsMessageQueue {
    private static final String LOG_TAG = "JsMessageQueue";

    // Set this to true to force plugin results to be encoding as
    // JS instead of the custom format (useful for benchmarking).
    // Doesn't work for multipart messages.
    private static final boolean FORCE_ENCODE_USING_EVAL = false;

    // Disable sending back native->JS messages during an exec() when the active
    // exec() is asynchronous. Set this to true when running bridge benchmarks.
    static final boolean DISABLE_EXEC_CHAINING = false;

    // Arbitrarily chosen upper limit for how much data to send to JS in one shot.
    // This currently only chops up on message boundaries. It may be useful
    // to allow it to break up messages.
    private static int MAX_PAYLOAD_SIZE = 50 * 1024 * 10240;
    
    /**
     * When true, the active listener is not fired upon enqueue. When set to false,
     * the active listener will be fired if the queue is non-empty. 
     */
    private boolean paused;
    
    /**
     * The list of JavaScript statements to be sent to JavaScript.
     */
    private final LinkedList<JsMessage> queue = new LinkedList<JsMessage>();

    /**
     * The array of listeners that can be used to send messages to JS.
     */
    private ArrayList<BridgeMode> bridgeModes = new ArrayList<BridgeMode>();
    
    /**
     * When null, the bridge is disabled. This occurs during page transitions.
     * When disabled, all callbacks are dropped since they are assumed to be
     * relevant to the previous page.
     */
    private BridgeMode activeBridgeMode;

    public void addBridgeMode(BridgeMode bridgeMode) {
        bridgeModes.add(bridgeMode);
    }

    public boolean isBridgeEnabled() {
        return activeBridgeMode != null;
    }

    public boolean isEmpty() {
        return queue.isEmpty();
    }

    /**
     * Changes the bridge mode.
     */
    public void setBridgeMode(int value) {
        if (value < -1 || value >= bridgeModes.size()) {
            Log.d(LOG_TAG, "Invalid NativeToJsBridgeMode: " + value);
        } else {
            BridgeMode newMode = value < 0 ? null : bridgeModes.get(value);
            if (newMode != activeBridgeMode) {
                Log.d(LOG_TAG, "Set native->JS mode to " + (newMode == null ? "null" : newMode.getClass().getSimpleName()));
                synchronized (this) {
                    activeBridgeMode = newMode;
                    if (newMode != null) {
                        newMode.reset();
                        if (!paused && !queue.isEmpty()) {
                            newMode.onNativeToJsMessageAvailable(this);
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Clears all messages and resets to the default bridge mode.
     */
    public void reset() {
        synchronized (this) {
            queue.clear();
            setBridgeMode(-1);
        }
    }

    private int calculatePackedMessageLength(JsMessage message) {
        int messageLen = message.calculateEncodedLength();
        String messageLenStr = String.valueOf(messageLen);
        return messageLenStr.length() + messageLen + 1;        
    }
    
    private void packMessage(JsMessage message, StringBuilder sb) {
        int len = message.calculateEncodedLength();
        sb.append(len)
          .append(' ');
        message.encodeAsMessage(sb);
    }
    
    /**
     * Combines and returns queued messages combined into a single string.
     * Combines as many messages as possible, while staying under MAX_PAYLOAD_SIZE.
     * Returns null if the queue is empty.
     */
    public String popAndEncode(boolean fromOnlineEvent) {
        synchronized (this) {
            if (activeBridgeMode == null) {
                return null;
            }
            activeBridgeMode.notifyOfFlush(this, fromOnlineEvent);
            if (queue.isEmpty()) {
                return null;
            }
            int totalPayloadLen = 0;
            int numMessagesToSend = 0;
            for (JsMessage message : queue) {
                int messageSize = calculatePackedMessageLength(message);
                if (numMessagesToSend > 0 && totalPayloadLen + messageSize > MAX_PAYLOAD_SIZE && MAX_PAYLOAD_SIZE > 0) {
                    break;
                }
                totalPayloadLen += messageSize;
                numMessagesToSend += 1;
            }

            StringBuilder sb = new StringBuilder(totalPayloadLen);
            for (int i = 0; i < numMessagesToSend; ++i) {
                JsMessage message = queue.removeFirst();
                packMessage(message, sb);
            }
            
            if (!queue.isEmpty()) {
                // Attach a char to indicate that there are more messages pending.
                sb.append('*');
            }
            String ret = sb.toString();
            return ret;
        }
    }
    
    /**
     * Same as popAndEncode(), except encodes in a form that can be executed as JS.
     */
    public String popAndEncodeAsJs() {
        synchronized (this) {
            int length = queue.size();
            if (length == 0) {
                return null;
            }
            int totalPayloadLen = 0;
            int numMessagesToSend = 0;
            for (JsMessage message : queue) {
                int messageSize = message.calculateEncodedLength() + 50; // overestimate.
                if (numMessagesToSend > 0 && totalPayloadLen + messageSize > MAX_PAYLOAD_SIZE && MAX_PAYLOAD_SIZE > 0) {
                    break;
                }
                totalPayloadLen += messageSize;
                numMessagesToSend += 1;
            }
            boolean willSendAllMessages = numMessagesToSend == queue.size();
            StringBuilder sb = new StringBuilder(totalPayloadLen + (willSendAllMessages ? 0 : 100));
            // Wrap each statement in a try/finally so that if one throws it does 
            // not affect the next.
            for (int i = 0; i < numMessagesToSend; ++i) {
                JsMessage message = queue.removeFirst();
                if (willSendAllMessages && (i + 1 == numMessagesToSend)) {
                    message.encodeAsJsMessage(sb);
                } else {
                    sb.append("try{");
                    message.encodeAsJsMessage(sb);
                    sb.append("}finally{");
                }
            }
            if (!willSendAllMessages) {
                sb.append("window.setTimeout(function(){cordova.require('cordova/plugin/android/polling').pollOnce();},0);");
            }
            for (int i = willSendAllMessages ? 1 : 0; i < numMessagesToSend; ++i) {
                sb.append('}');
            }
            String ret = sb.toString();
            return ret;
        }
    }   

    /**
     * Add a JavaScript statement to the list.
     */
    public void addJavaScript(String statement) {
        enqueueMessage(new JsMessage(statement));
    }

    /**
     * Add a JavaScript statement to the list.
     */
    public void addPluginResult(PluginResult result, String callbackId) {
        if (callbackId == null) {
            Log.e(LOG_TAG, "Got plugin result with no callbackId", new Throwable());
            return;
        }
        // Don't send anything if there is no result and there is no need to
        // clear the callbacks.
        boolean noResult = result.getStatus() == PluginResult.Status.NO_RESULT.ordinal();
        boolean keepCallback = result.getKeepCallback();
        if (noResult && keepCallback) {
            return;
        }
        JsMessage message = new JsMessage(result, callbackId);
        if (FORCE_ENCODE_USING_EVAL) {
            StringBuilder sb = new StringBuilder(message.calculateEncodedLength() + 50);
            message.encodeAsJsMessage(sb);
            message = new JsMessage(sb.toString());
        }

        enqueueMessage(message);
    }

    private void enqueueMessage(JsMessage message) {
        synchronized (this) {
            if (activeBridgeMode == null) {
                Log.d(LOG_TAG, "Dropping Native->JS message due to disabled bridge");
                return;
            }
            queue.add(message);
            if (!paused) {
                activeBridgeMode.onNativeToJsMessageAvailable(this);
            }
        }
    }

    public void setPaused(boolean value) {
        if (paused && value) {
            // This should never happen. If a use-case for it comes up, we should
            // change pause to be a counter.
            Log.e(LOG_TAG, "nested call to setPaused detected.", new Throwable());
        }
        paused = value;
        if (!value) {
            synchronized (this) {
                if (!queue.isEmpty() && activeBridgeMode != null) {
                    activeBridgeMode.onNativeToJsMessageAvailable(this);
                }
            }   
        }
    }

    public static abstract class BridgeMode {
        public abstract void onNativeToJsMessageAvailable(NativeToJsMessageQueue queue);
        public void notifyOfFlush(NativeToJsMessageQueue queue, boolean fromOnlineEvent) {}
        public void reset() {}
    }

    /** Uses JS polls for messages on a timer.. */
    public static class NoOpBridgeMode extends BridgeMode {
        @Override public void onNativeToJsMessageAvailable(NativeToJsMessageQueue queue) {
        }
    }

    /** Uses webView.loadUrl("javascript:") to execute messages. */
    public static class LoadUrlBridgeMode extends BridgeMode {
        private final CordovaWebViewEngine engine;
        private final CordovaInterface cordova;

        public LoadUrlBridgeMode(CordovaWebViewEngine engine, CordovaInterface cordova) {
            this.engine = engine;
            this.cordova = cordova;
        }

        @Override
        public void onNativeToJsMessageAvailable(final NativeToJsMessageQueue queue) {
            cordova.getActivity().runOnUiThread(new Runnable() {
                public void run() {
                    String js = queue.popAndEncodeAsJs();
                    if (js != null) {
                        engine.loadUrl("javascript:" + js, false);
                    }
                }
            });
        }
    }

    /** Uses online/offline events to tell the JS when to poll for messages. */
    public static class OnlineEventsBridgeMode extends BridgeMode {
        private final OnlineEventsBridgeModeDelegate delegate;
        private boolean online;
        private boolean ignoreNextFlush;

        public interface OnlineEventsBridgeModeDelegate {
            void setNetworkAvailable(boolean value);
            void runOnUiThread(Runnable r);
        }

        public OnlineEventsBridgeMode(OnlineEventsBridgeModeDelegate delegate) {
            this.delegate = delegate;
        }

        @Override
        public void reset() {
            delegate.runOnUiThread(new Runnable() {
                public void run() {
                    online = false;
                    // If the following call triggers a notifyOfFlush, then ignore it.
                    ignoreNextFlush = true;
                    delegate.setNetworkAvailable(true);
                }
            });
        }

        @Override
        public void onNativeToJsMessageAvailable(final NativeToJsMessageQueue queue) {
            delegate.runOnUiThread(new Runnable() {
                public void run() {
                    if (!queue.isEmpty()) {
                        ignoreNextFlush = false;
                        delegate.setNetworkAvailable(online);
                    }
                }
            });
        }
        // Track when online/offline events are fired so that we don't fire excess events.
        @Override
        public void notifyOfFlush(final NativeToJsMessageQueue queue, boolean fromOnlineEvent) {
            if (fromOnlineEvent && !ignoreNextFlush) {
                online = !online;
            }
        }
    }

    private static class JsMessage {
        final String jsPayloadOrCallbackId;
        final PluginResult pluginResult;
        JsMessage(String js) {
            if (js == null) {
                throw new NullPointerException();
            }
            jsPayloadOrCallbackId = js;
            pluginResult = null;
        }
        JsMessage(PluginResult pluginResult, String callbackId) {
            if (callbackId == null || pluginResult == null) {
                throw new NullPointerException();
            }
            jsPayloadOrCallbackId = callbackId;
            this.pluginResult = pluginResult;
        }
        
        static int calculateEncodedLengthHelper(PluginResult pluginResult) {
            switch (pluginResult.getMessageType()) {
                case PluginResult.MESSAGE_TYPE_BOOLEAN: // f or t
                case PluginResult.MESSAGE_TYPE_NULL: // N
                    return 1;
                case PluginResult.MESSAGE_TYPE_NUMBER: // n
                    return 1 + pluginResult.getMessage().length();
                case PluginResult.MESSAGE_TYPE_STRING: // s
                    return 1 + pluginResult.getStrMessage().length();
                case PluginResult.MESSAGE_TYPE_BINARYSTRING:
                    return 1 + pluginResult.getMessage().length();
                case PluginResult.MESSAGE_TYPE_ARRAYBUFFER:
                    return 1 + pluginResult.getMessage().length();
                case PluginResult.MESSAGE_TYPE_MULTIPART:
                    int ret = 1;
                    for (int i = 0; i < pluginResult.getMultipartMessagesSize(); i++) {
                        int length = calculateEncodedLengthHelper(pluginResult.getMultipartMessage(i));
                        int argLength = String.valueOf(length).length();
                        ret += argLength + 1 + length;
                    }
                    return ret;
                case PluginResult.MESSAGE_TYPE_JSON:
                default:
                    return pluginResult.getMessage().length();
            }
        }
        
        int calculateEncodedLength() {
            if (pluginResult == null) {
                return jsPayloadOrCallbackId.length() + 1;
            }
            int statusLen = String.valueOf(pluginResult.getStatus()).length();
            int ret = 2 + statusLen + 1 + jsPayloadOrCallbackId.length() + 1;
            return ret + calculateEncodedLengthHelper(pluginResult);
            }

        static void encodeAsMessageHelper(StringBuilder sb, PluginResult pluginResult) {
            switch (pluginResult.getMessageType()) {
                case PluginResult.MESSAGE_TYPE_BOOLEAN:
                    sb.append(pluginResult.getMessage().charAt(0)); // t or f.
                    break;
                case PluginResult.MESSAGE_TYPE_NULL: // N
                    sb.append('N');
                    break;
                case PluginResult.MESSAGE_TYPE_NUMBER: // n
                    sb.append('n')
                      .append(pluginResult.getMessage());
                    break;
                case PluginResult.MESSAGE_TYPE_STRING: // s
                    sb.append('s');
                    sb.append(pluginResult.getStrMessage());
                    break;
                case PluginResult.MESSAGE_TYPE_BINARYSTRING: // S
                    sb.append('S');
                    sb.append(pluginResult.getMessage());
                    break;                    
                case PluginResult.MESSAGE_TYPE_ARRAYBUFFER: // A
                    sb.append('A');
                    sb.append(pluginResult.getMessage());
                    break;
                case PluginResult.MESSAGE_TYPE_MULTIPART:
                    sb.append('M');
                    for (int i = 0; i < pluginResult.getMultipartMessagesSize(); i++) {
                        PluginResult multipartMessage = pluginResult.getMultipartMessage(i);
                        sb.append(String.valueOf(calculateEncodedLengthHelper(multipartMessage)));
                        sb.append(' ');
                        encodeAsMessageHelper(sb, multipartMessage);
                    }
                    break;
                case PluginResult.MESSAGE_TYPE_JSON:
                default:
                    sb.append(pluginResult.getMessage()); // [ or {
            }
        }
        
        void encodeAsMessage(StringBuilder sb) {
            if (pluginResult == null) {
                sb.append('J')
                  .append(jsPayloadOrCallbackId);
                return;
            }
            int status = pluginResult.getStatus();
            boolean noResult = status == PluginResult.Status.NO_RESULT.ordinal();
            boolean resultOk = status == PluginResult.Status.OK.ordinal();
            boolean keepCallback = pluginResult.getKeepCallback();

            sb.append((noResult || resultOk) ? 'S' : 'F')
              .append(keepCallback ? '1' : '0')
              .append(status)
              .append(' ')
              .append(jsPayloadOrCallbackId)
              .append(' ');

            encodeAsMessageHelper(sb, pluginResult);
        }

        void encodeAsJsMessage(StringBuilder sb) {
            if (pluginResult == null) {
                sb.append(jsPayloadOrCallbackId);
            } else {
                int status = pluginResult.getStatus();
                boolean success = (status == PluginResult.Status.OK.ordinal()) || (status == PluginResult.Status.NO_RESULT.ordinal());
                sb.append("cordova.callbackFromNative('")
                  .append(jsPayloadOrCallbackId)
                  .append("',")
                  .append(success)
                  .append(",")
                  .append(status)
                  .append(",[");
                switch (pluginResult.getMessageType()) {
                    case PluginResult.MESSAGE_TYPE_BINARYSTRING:
                        sb.append("atob('")
                          .append(pluginResult.getMessage())
                          .append("')");
                        break;
                    case PluginResult.MESSAGE_TYPE_ARRAYBUFFER:
                        sb.append("cordova.require('cordova/base64').toArrayBuffer('")
                          .append(pluginResult.getMessage())
                          .append("')");
                        break;
                    default:
                    sb.append(pluginResult.getMessage());
                }
                sb.append("],")
                  .append(pluginResult.getKeepCallback())
                  .append(");");
            }
        }
    }
}
