const util = require('util');
var fs = require('fs');
var Path = require('path');
var toHexa = require('../data/sToBParser.js');
var BitArray = require('node-bitarray');
var CRC16 = require('crc-16');

var fileName = process.env.protocolPath;
var fileData;

var startAttrIndex = 0;
var endIndex = 0;

function createHexaForTxnDetails(action, attribute, rev, messageID, countrycode, regioncode, cellid, meterid, callback) {
    var result = '';
    fileData = fs.readFileSync(fileName, 'utf-8');
    var obj = JSON.parse(fileData);
    for (var key in obj.FrameFormat) {
        switch (key) {
            case 'Rev':
                toHexa.sToBParser(rev, obj.FrameFormat[key].Length, obj.FrameFormat[key].Type, function (err, output) {
                    if (err) {
                        calback(err, null)
                    } else {
                        result = output;
                    }
                });
                break;

            case 'Count':
                var count = Number(obj.FrameFormat.Action.Length) + Number(obj.FrameFormat.Attribute.Length);
                toHexa.sToBParser(count, obj.FrameFormat[key].Length, obj.FrameFormat[key].Type, function (err, output) {
                    if (err) {
                        calback(err, null)
                    } else {
                        result += output;
                    }
                });
                break;

            case 'MessageID':
                toHexa.sToBParser(messageID, obj.FrameFormat[key].Length, obj.FrameFormat[key].Type, function (err, output) {
                    if (err) {
                        calback(err, null)
                    } else {
                        result += output;
                    }
                });
                break;

            case 'CountryCode':
                toHexa.sToBParser(countrycode, obj.FrameFormat[key].Length, obj.FrameFormat[key].Type, function (err, output) {
                    if (err) {
                        calback(err, null)
                    } else {
                        result += output;
                    }
                });
                break;

            case 'RegionCode':
                toHexa.sToBParser(regioncode, obj.FrameFormat[key].Length, obj.FrameFormat[key].Type, function (err, output) {
                    if (err) {
                        calback(err, null)
                    } else {
                        result += output;
                    }
                });
                break;

            case 'CellID':
                toHexa.sToBParser(cellid, obj.FrameFormat[key].Length, obj.FrameFormat[key].Type, function (err, output) {
                    if (err) {
                        calback(err, null)
                    } else {
                        result += output;
                    }
                });
                break;

            case 'MeterID':
                toHexa.sToBParser(meterid, obj.FrameFormat[key].Length, obj.FrameFormat[key].Type, function (err, output) {
                    if (err) {
                        calback(err, null)
                    } else {
                        result += output;
                    }
                });
                break;

            case 'Action': result += obj.Actions[action];
                break;

            case 'Attribute': result += obj.ActionAttribute[action][attribute];
                break;

            case 'CRC':
                var buf = new Buffer(result, 'hex');
                var crcResult = CRC16(buf);
                result += new Buffer(crcResult).toString('hex');
                break; 
        }
    }
    return callback(null, result);
}

module.exports = {
    createHexaForTxnDetails: createHexaForTxnDetails
}
