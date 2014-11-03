using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.Serialization;
using System.Windows;
using Microsoft.Phone.Controls;
using Microsoft.Phone.Notification;
using Microsoft.Phone.Shell;
using Newtonsoft.Json;

namespace WPCordovaClassLib.Cordova.Commands
{
    public class PushPlugin : BaseCommand
    {
        private const string InvalidRegistrationError = "Unable to open a channel with the specified name. The most probable cause is that you have already registered a channel with a different name. Call unregister(old-channel-name) or uninstall and redeploy your application.";
        private const string MissingChannelError = "Couldn't find a channel with the specified name.";
        private Options pushOptions;

        public void register(string options)
        {
            if (!TryDeserializeOptions(options, out this.pushOptions))
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            var pushChannel = HttpNotificationChannel.Find(this.pushOptions.ChannelName);
            if (pushChannel == null)
            {
                pushChannel = new HttpNotificationChannel(this.pushOptions.ChannelName);

                try
                {
                    pushChannel.Open();
                }
                catch (InvalidOperationException)
                {
                    this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, InvalidRegistrationError));
                    return;
                }

                pushChannel.BindToShellToast();
                pushChannel.BindToShellTile();
            }

            SubscribePushChannelEvents(pushChannel);
            var result = new RegisterResult
            {
                ChannelName = this.pushOptions.ChannelName,
                Uri = pushChannel.ChannelUri == null ? string.Empty : pushChannel.ChannelUri.ToString()
            };

            this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK, result));
        }

        public void unregister(string options)
        {
            Options unregisterOptions;
            if (!TryDeserializeOptions(options, out unregisterOptions))
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }
            var pushChannel = HttpNotificationChannel.Find(unregisterOptions.ChannelName);
            if (pushChannel != null)
            {
                pushChannel.UnbindToShellTile();
                pushChannel.UnbindToShellToast();
                pushChannel.Close();
                pushChannel.Dispose();
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.OK, "Channel " + unregisterOptions.ChannelName + " is closed!"));
            }
            else
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, MissingChannelError));
            }
        }

        public void showToastNotification(string options)
        {
            ShellToast toast;
            if (!TryDeserializeOptions(options, out toast))
            {
                this.DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            Deployment.Current.Dispatcher.BeginInvoke(toast.Show);
        }

        void PushChannel_ChannelUriUpdated(object sender, NotificationChannelUriEventArgs e)
        {
            // return uri to js
            var result = new RegisterResult
            {
                ChannelName = this.pushOptions.ChannelName,
                Uri = e.ChannelUri.ToString()
            };
            this.ExecuteCallback(this.pushOptions.UriChangedCallback, JsonConvert.SerializeObject(result));
        }

        void PushChannel_ErrorOccurred(object sender, NotificationChannelErrorEventArgs e)
        {
            // call error handler and return uri
            var err = new RegisterError
            {
                Code = e.ErrorCode.ToString(),
                Message = e.Message
            };
            this.ExecuteCallback(this.pushOptions.ErrorCallback, JsonConvert.SerializeObject(err));
        }

        void PushChannel_ShellToastNotificationReceived(object sender, NotificationEventArgs e)
        {
            var toast = new PushNotification
            {
                Type = "toast"
            };

            foreach (var item in e.Collection)
            {
                toast.JsonContent.Add(item.Key, item.Value);
            }

            this.ExecuteCallback(this.pushOptions.NotificationCallback, JsonConvert.SerializeObject(toast));
        }

        void PushChannel_HttpNotificationReceived(object sender, HttpNotificationEventArgs e)
        {
            var raw = new PushNotification
            {
                Type = "raw"
            };

            using (var reader = new StreamReader(e.Notification.Body))
            {
                raw.JsonContent.Add("Body", reader.ReadToEnd());
            }

			this.ExecuteCallback(this.pushOptions.NotificationCallback, JsonConvert.SerializeObject(raw));
        }

        void ExecuteCallback(string callback, string callbackResult)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                PhoneApplicationFrame frame;
                PhoneApplicationPage page;
                CordovaView cView;

                if (TryCast(Application.Current.RootVisual, out frame) &&
                    TryCast(frame.Content, out page) &&
                    TryCast(page.FindName("CordovaView"), out cView))
                {
                    cView.Browser.Dispatcher.BeginInvoke(() =>
                    {
                        try
                        {
                            cView.Browser.InvokeScript("execScript", callback + "(" + callbackResult + ")");
                        }
                        catch (Exception ex)
                        {
                            Debug.WriteLine("ERROR: Exception in InvokeScriptCallback :: " + ex.Message);
                        }
                    });
                }
            });
        }

        static bool TryDeserializeOptions<T>(string options, out T result) where T : class
        {
            result = null;
            try
            {
                var args = JsonConvert.DeserializeObject<string[]>(options);
                result = JsonConvert.DeserializeObject<T>(args[0]);
                return true;
            }
            catch
            {
                return false;
            }
        }

        static bool TryCast<T>(object obj, out T result) where T : class
        {
            result = obj as T;
            return result != null;
        }

        void SubscribePushChannelEvents(HttpNotificationChannel channel)
        {
            channel.ChannelUriUpdated += new EventHandler<NotificationChannelUriEventArgs>(PushChannel_ChannelUriUpdated);
            channel.ErrorOccurred += new EventHandler<NotificationChannelErrorEventArgs>(PushChannel_ErrorOccurred);
            channel.ShellToastNotificationReceived += new EventHandler<NotificationEventArgs>(PushChannel_ShellToastNotificationReceived);
            channel.HttpNotificationReceived += new EventHandler<HttpNotificationEventArgs>(PushChannel_HttpNotificationReceived);
        }

        [DataContract]
        public class Options
        {
            [DataMember(Name = "channelName", IsRequired = true)]
            public string ChannelName { get; set; }

            [DataMember(Name = "ecb", IsRequired = false)]
            public string NotificationCallback { get; set; }

            [DataMember(Name = "errcb", IsRequired = false)]
            public string ErrorCallback { get; set; }

            [DataMember(Name = "uccb", IsRequired = false)]
            public string UriChangedCallback { get; set; }
        }

        [DataContract]
        public class RegisterResult
        {
            [DataMember(Name = "uri", IsRequired = true)]
            public string Uri { get; set; }

            [DataMember(Name = "channel", IsRequired = true)]
            public string ChannelName { get; set; }
        }

        [DataContract]
        public class PushNotification
        {
            public PushNotification()
            {
                this.JsonContent = new Dictionary<string, object>();
            }

            [DataMember(Name = "jsonContent", IsRequired = true)]
            public IDictionary<string, object> JsonContent { get; set; }

            [DataMember(Name = "type", IsRequired = true)]
            public string Type { get; set; }
        }

        [DataContract]
        public class RegisterError
        {
            [DataMember(Name = "code", IsRequired = true)]
            public string Code { get; set; }

            [DataMember(Name = "message", IsRequired = true)]
            public string Message { get; set; }
        }
    }
}