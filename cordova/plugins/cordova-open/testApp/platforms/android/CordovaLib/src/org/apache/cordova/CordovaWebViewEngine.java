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

import android.view.KeyEvent;
import android.view.View;

/**
 * Interface for all Cordova engines.
 * No methods will be added to this class (in order to be compatible with existing engines).
 * Instead, we will create a new interface: e.g. CordovaWebViewEngineV2
 */
public interface CordovaWebViewEngine {
    void init(CordovaWebView parentWebView, CordovaInterface cordova, Client client,
              CordovaResourceApi resourceApi, PluginManager pluginManager,
              NativeToJsMessageQueue nativeToJsMessageQueue);

    CordovaWebView getCordovaWebView();
    ICordovaCookieManager getCookieManager();
    View getView();

    void loadUrl(String url, boolean clearNavigationStack);

    void stopLoading();

    /** Return the currently loaded URL */
    String getUrl();

    void clearCache();

    /** After calling clearHistory(), canGoBack() should be false. */
    void clearHistory();

    boolean canGoBack();

    /** Returns whether a navigation occurred */
    boolean goBack();

    /** Pauses / resumes the WebView's event loop. */
    void setPaused(boolean value);

    /** Clean up all resources associated with the WebView. */
    void destroy();

    /**
     * Used to retrieve the associated CordovaWebView given a View without knowing the type of Engine.
     * E.g. ((CordovaWebView.EngineView)activity.findViewById(android.R.id.webView)).getCordovaWebView();
     */
    public interface EngineView {
        CordovaWebView getCordovaWebView();
    }

    /**
     * Contains methods that an engine uses to communicate with the parent CordovaWebView.
     * Methods may be added in future cordova versions, but never removed.
     */
    public interface Client {
        Boolean onDispatchKeyEvent(KeyEvent event);
        void clearLoadTimeoutTimer();
        void onPageStarted(String newUrl);
        void onReceivedError(int errorCode, String description, String failingUrl);
        void onPageFinishedLoading(String url);
        boolean onNavigationAttempt(String url);
    }
}
