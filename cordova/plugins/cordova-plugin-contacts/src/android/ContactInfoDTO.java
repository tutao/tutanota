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

package org.apache.cordova.contacts;

import java.util.HashMap;

import org.json.JSONArray;
import org.json.JSONObject;

public class ContactInfoDTO {

 String displayName;
 JSONObject name;
 JSONArray organizations;
 JSONArray addresses;
 JSONArray phones;
 JSONArray emails;
 JSONArray ims;
 JSONArray websites;
 JSONArray photos;
 String note;
 String nickname;
 String birthday;
 HashMap<String, Object> desiredFieldsWithVals;

 public ContactInfoDTO() {

  displayName = "";
  name = new JSONObject();
  organizations = new JSONArray();
  addresses = new JSONArray();
  phones = new JSONArray();
  emails = new JSONArray();
  ims = new JSONArray();
  websites = new JSONArray();
  photos = new JSONArray();
  note = "";
  nickname = "";
  desiredFieldsWithVals = new HashMap<String, Object>();
 }

}
