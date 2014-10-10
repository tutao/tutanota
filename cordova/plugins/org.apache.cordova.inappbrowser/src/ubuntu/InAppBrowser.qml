/*
 *
 * Copyright 2013 Canonical Ltd.
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
import QtQuick 2.0
import QtWebKit 3.0
import Ubuntu.Components.Popups 0.1
import Ubuntu.Components 0.1

Rectangle {
    anchors.fill: parent
    id: inappbrowser
    property string url1
    Rectangle {
        border.color: "black"
        width: parent.width
        height: urlEntry.height
        color: "gray"
        TextInput {
            id: urlEntry
            width: parent.width - closeButton.width
            text: url1
            activeFocusOnPress: false
        }
        Image {
            id: closeButton
            width: height
            x: parent.width - width
            height: parent.height
            source: "close.png"
            MouseArea {
                anchors.fill: parent
                onClicked: {
                    root.exec("InAppBrowser", "close", [0, 0])
                }
            }
        }
    }

    WebView {
        width: parent.width
        y: urlEntry.height
        height: parent.height - y
        url: url1
        onLoadingChanged: {
            if (loadRequest.status) {
                root.exec("InAppBrowser", "loadFinished", [loadRequest.status])
            }
        }
    }
}
