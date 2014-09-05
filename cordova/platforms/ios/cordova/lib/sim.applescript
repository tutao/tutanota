# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

tell application "System Events"
	set UI elements enabled to true
end tell

tell application "iPhone Simulator"
    activate
end tell

tell application "System Events"
    tell process "iPhone Simulator"
    click menu item "$DEVICE_NAME" of menu 1 of menu item "Device" of menu 1 of menu bar item "Hardware" of menu bar 1
    click menu item "Home" of menu 1 of menu bar item "Hardware" of menu bar 1
    end tell
end tell
