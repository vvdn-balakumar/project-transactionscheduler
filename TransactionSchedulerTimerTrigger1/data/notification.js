var azure = require('azure-sb');

function pushNotificationToAndroid(message, AndroidToken, callback) {
    try {
        var hubname = process.env.pushHubname;
        var connectionstring = process.env.pushConnectionString;

        var notificationHubService = azure.createNotificationHubService(hubname, connectionstring);
        let payload = {
            data: message.data,
            notification: message.notification
        };
        let tag = "AndroidTag2" + new Date().toISOString()+Math.floor(Math.random()*(new Date().getTime() / 1000));
        notificationHubService.gcm.createNativeRegistration(AndroidToken, tag, null, function (err, response) {
            if (err) {
                callback("error in push notification " + err, null)
            } else {
                notificationHubService.gcm.send(response.Tags, payload, function (error) {
                    if (error) {
                        callback("error in push notification " + error, null)
                    } else {
                        callback(null, "Notification sent successfully!!")
                    }
                });
            }
        })
    } catch (exc) {
        callback(exc, null);
    }
}

function pushNotificationToiOS(notificationMessage, Token, callback) {
    try {
        var hubname = process.env.pushHubname;
        var connectionstring = process.env.pushConnectionString;

        // Token = "42b445d89cf0c5d15275548c9a8cc8c5af5f70b666ec7adb1cb89d1ebaba724e"
        var notificationHubService = azure.createNotificationHubService(hubname, connectionstring);
        let tag = "APNTag2" + new Date().toISOString()+Math.floor(Math.random()*(new Date().getTime() / 1000));
        notificationHubService.apns.createNativeRegistration(Token, tag, null, function (err, response) {
            if (err) {
                callback("error in push notification " + err, null)
            } else {

                let notification1 = {};
                notification1.sound = "ping.aiff";
                notification1.alert = {
                    title: notificationMessage.notification.title,
                     body: notificationMessage.notification.message
               }
                notification1.payload = { 'Message': notificationMessage.data };
                var payload = {
                    "aps": {
                        "alert": notification1.alert,
                        "payload": notification1.payload,
                        "sound": notification1.sound,
                        "vibrate": "true",
                        "apns-priority": 5,
                        "badge": 0,
                        "content-available": 1
                    }
                };
                notificationHubService.apns.send(response.Tags, payload, function (error, result) {
                    if (error) {
                        callback("error in push notification " + error, null)
                    } else {
                        callback(null, "Notification sent successfully!!")
                    }
                });
            }
        });
    } catch (exc) {
        callback(exc, null);
    }
}

module.exports = {
    pushNotificationToAndroid: pushNotificationToAndroid,
    pushNotificationToiOS: pushNotificationToiOS
};
