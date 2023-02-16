var ListAndValidation = require('../ListAndValidation.js');
var PushNotification = require('./notification.js');
var async = require('async');

function sendNotificationToMobile(HyperSproutID,context, callback) {
    ListAndValidation.getDb(function (err, dbConn) {
        let metersCollection = dbConn.db.collection("DELTA_Meters");
        let deltaLinkCollection = dbConn.db.collection("DELTA_DeltaLink");
        let userCollection = dbConn.db.collection("DELTA_User");
        let tokenCollection = dbConn.db.collection("DELTA_PushNotification")
        let sendNotificationTo = [];
        metersCollection.find({ HypersproutID: HyperSproutID }, { 'Meters_Billing.MeterConsumerNumber': 1, MeterID: 1, _id: 0 }).toArray(function (err, meters) {
            if (err) {
                callback(err, null);
            }
            else {
                async.each(meters, function (Meters, callbackEach) {
                    deltaLinkCollection.find({ MeterID: Meters.MeterID }, { ConnDisconnStatus: 1 }).toArray(function (err, deltaLinks) {
                        if (err) {
                            callbackEach(err, null);
                        }
                        else if (deltaLinks.length == 0) {
                            //sendNotificationTo.push(Meters.Meters_Billing.MeterConsumerNumber);
                            callbackEach(null, sendNotificationTo);
                        }
                        else {
                            let deltaLinkCount = 0;
                            let isProcessed = false;
                            deltaLinks.forEach((deltaLink, array) => {
                                deltaLinkCount++;
                                if (deltaLink.ConnDisconnStatus == "Connected" && isProcessed == false) {
                                    isProcessed == true;
                                    sendNotificationTo.push(Meters.Meters_Billing.MeterConsumerNumber);
                                }
                                if (deltaLinkCount === deltaLinks.length) {
                                    callbackEach(null, sendNotificationTo);
                                }
                            });
                        }
                    });
                }, function (err, result) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        async.each(sendNotificationTo, function (ConsumerNo, callbackEachIn) {
                            tokenCollection.find({ UserID: ConsumerNo }, { DeviceToken: 1, DeviceType: 1 }).toArray(function (err, user) {
                                if (err) {
                                    callbackEachIn(err, null);
                                }
                                else {
                                    if (user != undefined && user != null && user.length != 0) {
//                                         user.forEach(function (tokenDetail) {
//                                             let message = {
//                                                 data: {
//                                                     title: "Hypersprout-" + HyperSproutID + " went offline",
//                                                     message: "Hypersprout-" + HyperSproutID + " went offline. Please check."
//                                                 },
//                                                 notification: {
//                                                     title: "Hypersprout-" + HyperSproutID + " went offline",
//                                                     message: "Hypersprout-" + HyperSproutID + " went offline. Please check."
//                                                 }
//                                             };
//                                             if (tokenDetail.DeviceType == "Android")
//                                                 PushNotification.pushNotificationToAndroid(message, tokenDetail.DeviceToken,callbackEachIn)
//                                             else if (tokenDetail.DeviceType == "iOS")
//                                                 PushNotification.pushNotificationToiOS(message, tokenDetail.DeviceToken, callbackEachIn);
//                                         }) ;
                                        async.each(user,function(tokenDetail,callbackEach){
                                            let message = {
                                                data: {
                                                    title: "Hypersprout-" + HyperSproutID + " went offline",
                                                    message: "Hypersprout-" + HyperSproutID + " went offline. Please check."
                                                },
                                                notification: {
                                                    title: "Hypersprout-" + HyperSproutID + " went offline",
                                                    message: "Hypersprout-" + HyperSproutID + " went offline. Please check."
                                                }
                                            };
                                            if (tokenDetail.DeviceLang == "SPA" && tokenDetail.DeviceType == "iOS") {
                                                message = {
                                                    data: {
                                                        title: "Hipersprout-" + HyperSproutID + " se desconectó",
                                                        message: "Hipersprout-" + HyperSproutID + " se desconectó. Por favor verifique."
                                                    },
                                                    notification: {
                                                        title: "Hipersprout-" + HyperSproutID + " se desconectó",
                                                        message: "Hipersprout-" + HyperSproutID + " se desconectó. Por favor verifique."
                                                    }
                                                };
                                            }
                                            if (tokenDetail.DeviceType == "Android")
                                                PushNotification.pushNotificationToAndroid(message, tokenDetail.DeviceToken,callbackEach)
                                            else if (tokenDetail.DeviceType == "iOS")
                                                PushNotification.pushNotificationToiOS(message, tokenDetail.DeviceToken, callbackEach);
                                        }, function (err, res) {
                                            if (err)
                                                callback(err, null);
                                            else
                                                callback(null, "Notification Sent!");
                                        });
                                    } else {
                                        callbackEachIn();
                                    }
                                }
                            });
                        }, function (err, res) {
                            if (err)
                                callback(err, null);
                            else
                                callback(null, "Notification Sent!");
                        });
                    }
                });
            }
        });
    });
}  

module.exports = {
    sendNotificationToMobile: sendNotificationToMobile,
};
