var ListAndValidation = require('./ListAndValidation.js');
var txnDetails = require('./data/txnDetails.js');
var sendToiot = require('./data/sendToiot.js');
var async = require('async');
var sendNotification = require('./data/sendNotification.js');

module.exports = function (context) {
    ListAndValidation.getListDeviceIDs(context,
        function (responses) {
            if (responses.Type) {
                var results = responses.output;
                async.each(results,
                    function (response, callback) {
                        if (typeof response.DeviceID !== 'undefined' && response.DeviceID) {
                            sendToiot.checkDeviceConnectionState(
                                response.DeviceID,
                                function (err, resp) {
                                    if (err) {
                                        callback(err, null);
                                    } else if (resp == "Connected") {
                                        ListAndValidation.checkDeviceStatus({
                                            "DeviceID": response.DeviceID, "Status": resp
                                        }, context,
                                            function (res) {
                                                if (res.Type) {
                                                    var messageID = res.output.MessageID;
                                                    txnDetails.txnHSDet(
                                                        response.HypersproutID, response.DeviceID, messageID, context,
                                                        function (err, result) {
                                                            if (err) {
                                                                return callback();
                                                            } else {
                                                                context.log("[INFO] -- Webservice response:", response.DeviceID);
                                                                return callback(null, result);
                                                            }
                                                        });
                                                } else {
                                                    context.log("[INFO] -- Device Exceeded: " + response.DeviceID)
                                                    return callback();
                                                }
                                            });
                                    }
                                    else if (resp == "Disconnected") {
                                        ListAndValidation.checkDeviceStatus({
                                            "DeviceID": response.DeviceID, "Status": resp
                                        }, context,
                                            function (res) {
                                                context.log("[INFO] -- Device Disconnected: " + response.DeviceID)
                                                sendNotification.sendNotificationToMobile(response.HypersproutID,context, function (err, resp) {
                                                    if (err) {
                                                        context.log("Error ->", err);
                                                    }
                                                    else {
                                                        context.log("Notification sent for HypersproutID:", response.HypersproutID);
                                                    }
                                                });
                                                context.log("[INFO] -- Device Disconnected: " + response.DeviceID);
                                                return callback(null, "Device Disconnected");
                                            });
                                    }
                                    else {
                                        return callback();
                                    }
                                });
                        } else {
                            return callback();
                        }
                    },
                    function (err) {
                        if (err) {
                            context.log("[ERROR] -- ", err);
                            context.done();
                        } else {
                            context.log("[INFO] -- Sent");
                            context.done();
                        }
                    });
            } else {
                if (responses.SendPN === undefined || responses.SendPN == null) {
                    context.log("[INFO] -- No Device");
                    context.done();
                }
                else {
                    context.log("Inside send notification");
                    var results = responses.SendPN;
                    async.each(results,
                        function (response, innercallback) {
                            if (typeof response.DeviceID !== 'undefined' && response.DeviceID) {
                                sendToiot.checkDeviceConnectionState(
                                    response.DeviceID,
                                    function (err, resp) {
                                        if (err) {
                                            innercallback(err, null);
                                        }
                                        else if (resp == "Disconnected") {
                                            sendNotification.sendNotificationToMobile(response.HypersproutID,context, function (err, resp) {
                                                if (err) {
                                                    context.log("Error ->", err);
                                                    innercallback();

                                                }
                                                else {
                                                    context.log("Notification sent for HypersproutID:", response.HypersproutID);
                                                    innercallback();
                                                }
                                            });
                                        }
                                        else {
                                            innercallback();
                                        }
                                    });
                            } else {
                                innercallback();
                            }
                        },
                        function (err) {
                            if (err) {
                                context.log("[ERROR] -- ", err);
                                context.done();
                            } else {
                                context.log("[INFO] -- Sent");
                                context.done();
                            }
                        });

                }
            }
        });
};
