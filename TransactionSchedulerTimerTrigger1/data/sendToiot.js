var Client = require('azure-iothub').Client;
var Registry = require('azure-iothub').Registry;
var Message = require('azure-iot-common').Message;
var shortid = require('shortid');

var connectionString = process.env.IOTConnectionString;
//var registryConnectionString = process.env.RegistryConnectionString;
var targetDevice;

function sendToIOT(message1, deviceID, callback) {
    console.log("Message1 :- " + message1);
    try {
        var serviceClient = Client.fromConnectionString(connectionString);
        serviceClient.open(function (err, output) {
            if (err) {
                callback(err, null);
            } else {
                targetDevice = deviceID;
                var buff = new Buffer(message1, 'hex');
                var message = new Message(buff);
                message.ack = 'none';
                message.messageId = shortid.generate();
                serviceClient.send(targetDevice, message, function (err, res) {
                    if (err) {
                        return callback(err, null);
                    } else {
                        serviceClient.close((err) => {
                            if (err) {
                                //logger.info('inside the error in client close : ' + err);
                                return callback(err, null);
                            }
                            //logger.info('Response -----' + res.constructor.name);
                            return callback(null, res);
                        });
                    }
                });
            }
        });
    } catch (error) {
        return callback("Error occurred while connecting to IoT Hub", null);
    }
}

function checkDeviceConnectionState(deviceID, callback) {
    var registry = Registry.fromConnectionString(connectionString);
    registry.get(deviceID, function (err, deviceState) {
        if (err) {
            return callback(null, "No DeviceID Found");
        } else if (deviceState == null) {
            return callback(null, "No DeviceID Found");
        } else {
            return callback(null, deviceState.connectionState);
        }
    });
}

module.exports = {
    sendToIOT: sendToIOT,
    checkDeviceConnectionState: checkDeviceConnectionState
}
