var binaryconvertor = require('../data/sToBParser.js');
var sToIOT = require('../data/sendToiot.js');
var parser = require('../data/parser.js');
var ListAndValidation = require('../ListAndValidation.js');

function txnHSDet(cellid, deviceID, messageID,context, callback) {
    var Action = "COLLECTOR_DATA_UPLOAD";
    var Attribute = "COMBINED_TRANSACTIONAL_DATA";
    var rev = 0;
    var countrycode = 0;
    var regioncode = 0;
    var meterid = 0;
    parser.createHexaForTxnDetails(Action, Attribute, rev, messageID, countrycode, regioncode, cellid, meterid, function (err, result) {
        if (err) {
            callback(err, null);
        } else {
            var schedulerLogJson = { "DeviceID": deviceID, "MessageID": messageID, "Data": result, "TimeStampRequest": new Date() }
            ListAndValidation.saveSchedulerLog(schedulerLogJson, function (response) {
                if (response.Type) {
                    sToIOT.sendToIOT(result, deviceID, function (err, output) {
                        if (err) {
                            callback(err, null);
                        } else {
                            context.log("Successfully send request "+deviceID);
                            return callback(null, response);
                        }
                    });

                }else{
                    context.log("Error while creating job "+deviceID) ;
                    callback();
                }
            });

        }
    });
}

module.exports = {
    txnHSDet: txnHSDet
}