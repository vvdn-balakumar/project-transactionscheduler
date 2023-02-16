var http = require('https');
var server = process.env.webAddress;
var portWeb = process.env.webPort;
var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var moment = require('moment');
var shortid = require('shortid');
var mongoUser = process.env.mongoUser;
var mongoUserPass = process.env.mongoUserPass;
var mongoHost = process.env.mongoHost;
var mongoDB = process.env.mongoDB;
global.dbase = {};

var DbConnectionString = 'mongodb://' + mongoUser + ':' +
    mongoUserPass + '@' +
    mongoHost + '/' +
    mongoDB + '?authSource=admin';

var theDb = null;
function getDb(callback) {
    var response = {}
    if (!theDb || (theDb && !theDb.db.serverConfig.isConnected())) {
        mongodb.MongoClient.connect(DbConnectionString, { poolSize: 6, socketTimeoutMS: 60000 }, function (err, databaseClient) {
            if (err) {
                response.Type = false;
                response.Message = "Database connection refused";
                callback(response);
            } else {
                dbase = databaseClient;
                let db = databaseClient.db(mongoDB);
                theDb = {
                    db: db
                };
                callback(null, theDb);
            }
        });
    } else {
        callback(null, theDb);
    }
}

/**
* @description - Returns list of devices by hitting ListDevicesOnReadTime Web Service.
*
* @param Nil
*
* @return Response of ListDevicesOnReadTime Web service -
*         a list of Device IDs for which transaction data needs to be fetched.
*/

function getListDeviceIDs(context, callback) {
    var response = {};
    // create connection to mogodb
    getDb(function (err, dbConn) {
        if (err) {
            response.Type = false;
            response.Message = err;
            callback(response);
        } else {
            var collection = dbConn.db.collection("DELTA_Hypersprouts");
            var systemSettingsCollection = dbConn.db.collection("DELTA_SystemSettings");
            collection.find({ Status: "Registered" }, { DeviceID: 1, HypersproutID: 1, _id: 0 }).toArray(function (err, res) {
                if (err) {
                    // if (theDb) {
                    //     dbase.close();
                    //     theDb = null;
                    // }
                    context.log('[ERROR] -- ', err);
                    response.Type = false;
                    response.Message = err;
                    callback(response);
                } else if (res.length === 0) {
                    // if (theDb) {
                    //     dbase.close();
                    //     theDb = null;
                    // }
                    context.log('[INFO] --No Registered HyperSprouts avalaible');
                    response.Type = false;
                    response.Message = "No Registered HyperSprouts avalaible";
                    callback(response);
                } else {
                    systemSettingsCollection.find({ Settings: "Communications", 'Type.Status': "Updated" }, { 'Type.Values.HypersproutTransactionPoolingInterval': 1, ScheduledTime: 1 }).toArray(function (err, pollingInterval) {
                        if (err) {
                            // if (theDb) {
                            //     dbase.close();
                            //     theDb = null;
                            // }
                            context.log('[ERROR] -- ', err);
                            response.Type = false;
                            response.Message = err;
                            callback(response);
                        } else {
                            var d1 = new Date();
                            var d2 = new Date(pollingInterval[0].ScheduledTime);
                            var startDate = moment.utc(d2);
                            var endDate = moment.utc(d1);
                            var minsDiff = endDate.diff(startDate, 'seconds');
                            if (minsDiff >= 0) {
                                systemSettingsCollection.update({ Settings: "Communications", 'Type.Status': "Updated" }, { $set: { ScheduledTime: new Date(moment(endDate).add(pollingInterval[0].Type.Values.HypersproutTransactionPoolingInterval, 'minutes')) } }, function (err, result) {
                                    if (err) {
                                        // if (theDb) {
                                        //     dbase.close();
                                        //     theDb = null;
                                        // }
                                        context.log('[ERROR] -- ', err);
                                        response.Type = false;
                                        response.Message = err;
                                        callback(response);
                                    } else {
                                        response.Type = true;
                                        response.output = res;
                                        response.SendPN = res;
                                        callback(response);
                                    }
                                });
                            } else {
                                // if (theDb) {
                                //     dbase.close();
                                //     theDb = null;
                                // }
                                context.log('[INFO] --No Device ID');
                                response.Type = false;
                                response.SendPN = res;
                                callback(response);
                            }
                        }
                    });
                }
            });
        }
    });
}
/**
* @description - Returns the status of the device.
*
* @param post_data - IOT connection device ID of Device
*
* @return Connected/Disconnected state of Device to Azure IOT.
*/

function checkDeviceStatus(post_data, context, callback) {
    var response = {};
    // create connection to mogodb
    getDb(function (err, dbConn) {
        if (err) {
            response.Type = false;
            response.Message = err;
            callback(response);
        } else {
            var collection = dbConn.db.collection("DELTA_SchedulerFlags");
            var systemSettingsCollection = dbConn.db.collection("DELTA_SystemSettings");
            collection.find({ DeviceID: post_data.DeviceID }).toArray(function (err, result) {
                if (err) {
                    context.log('[ERROR] -- ', err);
                    response.Type = false;
                    response.Message = err;
                    callback(response);
                } else if (result.length === 0) {
                    var firstTimeDevice = {
                        "Flag": 0,
                        "DeviceID": post_data.DeviceID,
                        "MessageID": 0
                    }
                    collection.insertOne(firstTimeDevice, function (err, response) {
                        if (err) {
                            context.log('[ERROR] -- ', err);
                            response.Type = false;
                            response.Message = err;
                            callback(response);
                        } else if (response.result.nModified === 0) {
                            context.log('[ERROR] -- ', err);
                            response.Type = false;
                            response.Message = "Try Again";
                            callback(response);
                        } else {
                            context.log('[ERROR] -- ', err);
                            response.Type = true;
                            response.output = firstTimeDevice;
                            callback(response);
                        }
                    });
                } else {
                    systemSettingsCollection.find({ Settings: "Communications", 'Type.Status': "Updated" }, { 'Type.Values.RetryAttemtCEtoHS': 1 }).toArray(function (err, systemDetails) {
                        if (err) {
                            response.Type = false;
                            response.Message = err;
                            callback(response);
                        } else {
                            collection.find({ DeviceID: post_data.DeviceID, Flag: { $lt: systemDetails[0].Type.Values.RetryAttemtCEtoHS } }).toArray(function (err, response1) {
                                if (err) {
                                    response.Type = false;
                                    response.Message = err;
                                    callback(response);
                                } else if (response1.length === 0) {
                                    response.Type = false;
                                    response.Message = "Exceeded";
                                    callback(response);
                                } else {
                                    var messageID;
                                    if (post_data.Status === "Connected") {
                                        if ((response1[0].MessageID === 255) || (response1[0].MessageID === null)) {
                                            messageID = 0
                                        } else {
                                            messageID = ++response1[0].MessageID;
                                        }
                                    }
                                    else
                                        messageID = response1[0].MessageID
                                    var flag = ++response1[0].Flag;
                                    collection.update({ DeviceID: post_data.DeviceID }, { $set: { MessageID: messageID, Flag: flag } }, function (err, res) {
                                        if (err) {
                                            response.Type = false;
                                            response.Message = err;
                                            callback(response);
                                        } else {
                                            collection.find({ DeviceID: post_data.DeviceID }).toArray(function (err, success) {
                                                if (err) {
                                                    response.Type = false;
                                                    response.Message = err;
                                                    callback(response);
                                                } else {
                                                    response.Type = true;
                                                    response.output = success[0];
                                                    callback(response);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}
/**
 * Sends the scheduler log to save in database
 */

function saveSchedulerLog(post_data, callback) {
    var response = {};
    // create connection to mogodb
    getDb(function (err, dbConn) {
        if (err) {
            response.Type = false;
            response.Message = err;
            callback(response);
        } else {
            var jobID = shortid.generate();
            var SchedulerLogscollection = dbConn.db.collection("DELTA_SchedulerLogs");
            var Hypersproutscollection = dbConn.db.collection("DELTA_Hypersprouts");
            var jobsCollection = dbConn.db.collection("DELTA_Jobs");
            Hypersproutscollection.findAndModify({ DeviceID: post_data.DeviceID }, [], { $set: { PollingIntervalJobID: jobID } }, { remove: false, new: true, upsert: false, fields: { HypersproutID: 1, HypersproutSerialNumber: 1, IsHyperHub: 1 } }, function (err, result) {
                if (err) {
                    response.Type = false;
                    response.Message = err;
                    callback(response);
                } else if (result.value === null) {
                    response.Type = false;
                    response.Message = "No HS attached to given DeviceID avalaible";
                    callback(response);
                } else {
                    var type = "HyperSprout";
                    var Logs = {
                        "CellID": result.value.HypersproutID,
                        "DeviceID": post_data.DeviceID,
                        "MessageID": post_data.MessageID,
                        "RawData": post_data.Data,
                        "TimeStampRequest": new Date(post_data.TimeStampRequest)
                    }
                    if (result.value.IsHyperHub)
                        type = "Hyperhub";
                    var jobDoc = {
                        JobID: jobID,
                        DeviceID: post_data.DeviceID,
                        DeviceType: type,
                        SerialNumber: result.value.HypersproutSerialNumber,
                        MessageID: post_data.MessageID,
                        JobName: "Interval Read Job",
                        JobType: "Transactional Polling Interval",
                        Status: "Pending",
                        CreatedDateTimestamp: new Date(post_data.TimeStampRequest)
                    }
                    SchedulerLogscollection.insertOne(Logs, function (err, response1) {
                        if (err) {

                            response.Type = false;
                            response.Message = err;
                            callback(response);
                        } else {
                            jobsCollection.insertOne(jobDoc, function (err, success) {
                                response.Type = true;
                                response.output = "Data Updated";
                                callback(response);
                            });
                        }
                    });
                }
            });
        }
    });
}
module.exports = {
    getListDeviceIDs: getListDeviceIDs,
    checkDeviceStatus: checkDeviceStatus,
    saveSchedulerLog: saveSchedulerLog,
    getDb: getDb
};
