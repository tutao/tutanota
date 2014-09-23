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

namespace WPCordovaClassLib.Cordova.Commands
{
    using System;
    using System.Windows;
    using Microsoft.Phone.Controls;
    using Microsoft.Phone.Tasks;
    using Microsoft.Phone.UserData;

    /// <summary>
    /// Allows an application to pick contact. 
    /// Use this to allow users to pick contact from your application.
    /// </summary>
    public class ContactPickerTask
    {
        /// <summary>
        /// Occurs when a Pick task is completed.
        /// </summary>
        public event EventHandler<PickResult> Completed;

        /// <summary>
        /// Shows Contact pick application
        /// </summary>
        public void Show()
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                var root = Application.Current.RootVisual as PhoneApplicationFrame;

                string baseUrl = "/";

                if (root != null)
                {
                    root.Navigated += this.OnNavigate;

                    // dummy parameter is used to always open a fresh version
                    root.Navigate(
                        new Uri(
                            baseUrl + "Plugins/org.apache.cordova.contacts/ContactPicker.xaml?dummy="
                            + Guid.NewGuid(),
                            UriKind.Relative));
                }
            });
        }

        /// <summary>
        /// Performs additional configuration of the picker application.
        /// </summary>
        /// <param name="sender">The source of the event.</param>
        /// <param name="e">The <see cref="System.Windows.Navigation.NavigationEventArgs"/> instance containing the event data.</param>
        private void OnNavigate(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {
            if (!(e.Content is ContactPicker))
            {
                return;
            }

            var phoneApplicationFrame = Application.Current.RootVisual as PhoneApplicationFrame;
            if (phoneApplicationFrame != null)
            {
                phoneApplicationFrame.Navigated -= this.OnNavigate;
            }

            ContactPicker contactPicker = (ContactPicker)e.Content;

            if (contactPicker != null)
            {
                contactPicker.Completed += this.Completed;
            }
            else if (this.Completed != null)
            {
                this.Completed(this, new PickResult(TaskResult.Cancel));
            }
        }

        /// <summary>
        /// Represents contact returned
        /// </summary>
        public class PickResult : TaskEventArgs
        {
            /// <summary>
            /// Initializes a new instance of the PickResult class.
            /// </summary>
            public PickResult()
            {
            }

            /// <summary>
            /// Initializes a new instance of the PickResult class
            /// with the specified Microsoft.Phone.Tasks.TaskResult.
            /// </summary>
            /// <param name="taskResult">Associated Microsoft.Phone.Tasks.TaskResult</param>
            public PickResult(TaskResult taskResult)
                : base(taskResult)
            {
            }

            /// <summary>
            ///  Gets the contact.
            /// </summary>
            public Contact Contact { get; internal set; }
        }
    }
}
