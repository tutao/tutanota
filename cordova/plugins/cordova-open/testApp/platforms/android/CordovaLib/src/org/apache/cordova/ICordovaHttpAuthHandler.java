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

/**
 * Specifies interface for HTTP auth handler object which is used to handle auth requests and
 * specifying user credentials.
 */
 public interface ICordovaHttpAuthHandler {
    /**
     * Instructs the WebView to cancel the authentication request.
     */
    public void cancel ();
    
    /**
     * Instructs the WebView to proceed with the authentication with the given credentials.
     * 
     * @param username The user name
     * @param password The password
     */
    public void proceed (String username, String password);
}