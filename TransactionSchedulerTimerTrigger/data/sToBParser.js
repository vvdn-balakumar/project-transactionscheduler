function sToBParser(data, len, type, callback) {
    var hex, i;
    var result = '';
    switch (type) {
        case 'char':
            for (i = 0; i < len; i++) {
                hex = data.charCodeAt(i).toString(16);
                result += (hex).slice(-4);
            }
            break;
        case 'int':
            // var binarySize = len * 2;
            // var s = data.toString(16) + "";
            //  while (s.length < binarySize) s = "0" + s;
            /*  var binarySize = len * 2;
              var s = data.toString(16) + "";
              while (s.length < 2) s = "0" + s;
              while (s.length < binarySize) s = s + "0";
             result += s;
             break; */
            if (len === "1") {
                var binarySize = len * 2;
                var s = data.toString(16) + "";
                while (s.length < 2)
                    s = "0" + s;
                while (s.length < binarySize)
                    s = s + "0";
                result += s;
            } else {
                var buf = new Buffer(2);
                buf.writeUInt16LE('0x' + data.toString(16), 0);
                var s = buf.readUInt16BE(0).toString(16) + "";
                var binarySize = len * 2;
                while (s.length <= 3)
                    s = "0" + s;
                while (s.length < binarySize)
                    s = s + "0";
                result += s;
            }
            break;
        case 'string':
            for (i = 0; i < len; i++) {
                hex = data.charCodeAt(i).toString(16);
                result += (hex).slice(-4);
            }
            break;
    }
    return callback(null, result);
};

module.exports = {
    sToBParser: sToBParser
}