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

import QtQuick 2.0
import Ubuntu.Components.Popups 0.1
import Ubuntu.Components 0.1

Dialog {
    id: dialogue
    property string button1Text
    property string button2Text
    property string button3Text
    property bool promptVisible
    property string defaultPromptText

    TextField {
        id: prompt
        text: defaultPromptText
        visible: promptVisible
        focus: true
    }
    Button {
        text: button1Text
        color: "orange"
        onClicked: {
            root.exec("Notification", "notificationDialogButtonPressed", [1, prompt.text, promptVisible]);
            PopupUtils.close(dialogue)
        }
    }
    Button {
        text: button2Text
        visible: button2Text.length > 0
        color: "orange"
        onClicked: {
            root.exec("Notification", "notificationDialogButtonPressed", [2, prompt.text, promptVisible]);
            PopupUtils.close(dialogue)
        }
    }
    Button {
        text: button3Text
        visible: button3Text.length > 0
        onClicked: {
            root.exec("Notification", "notificationDialogButtonPressed", [3, prompt.text, promptVisible]);
            PopupUtils.close(dialogue)
        }
    }
}
