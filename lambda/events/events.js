// app deps
//const thingShadow = require('aws-iot-device-sdk').thingShadow;

var fs = require('fs');
var AWS = require('aws-sdk');
const config = {
    clientId: "ord",
    thingName: "ord",
    region: "us-west-2",
    host: "A3LYBV9V64FKOF.iot.us-west-2.amazonaws.com",
    port: "8883",
    privateKey: "",
    clientCert: "",
    caCert: ""
};

exports.handler = function(event, context) { 
    console.info("event(): starting, event: " + JSON.stringify(event));
    //console.log("event(): event: " + event);
    //console.log('body: ', event.body);
    //console.log('Headers: ', event.headers);
    //console.log('Method: ', event.mothod);
    //console.log('Params: ', event.params);
    //console.log('Query:', event.query);
    readConfig('', function() {
	console.info("handler(): read the config: " + JSON.stringify(config));
	//context.succeed("event processed");
    });
}

function closeBlinds() {
    console.log("closeBlinds() starting");
}

function openBlinds() {
    console.log("openBlinds()");
}

function readConfig(err, next) {
    if (err) {
	console.log(err, err.stack);
	return(next(err));
    }
    var kms = new AWS.KMS({region: 'us-west-2'});

    config.caCert = fs.readFileSync("./certs/root-CA.crt", 'utf8');
    
    function privateKey(err) {
	var privateKeyPath = './certs/privateKey.pem.enc';
	var privateKeyEnc = fs.readFileSync(privateKeyPath);
	var params = {
	    CiphertextBlob: privateKeyEnc
	};
	kms.decrypt(params, function(err, data) {
	    if (err) console.log(err, err.stack);
	    else {
		var privateKey = data['Plaintext'].toString();
		config.privateKey = privateKey;
		console.log('readConfig(): decoded privateKey');
	    }
	    clientCert(err);
	});
    }
    function clientCert(err) {
	var certPath = './certs/cert.pem.enc';
	var certEnc = fs.readFileSync(certPath);
	var params = {
	    CiphertextBlob: certEnc
	};
	kms.decrypt(params, function(err, data) {
	    if (err) console.log(err, err.stack);
	    else {
		var cert = data['Plaintext'].toString();
		config.clientCert = cert;
		console.log('readConfig(): decoded cert');
	    }
	    next(err);
	});
    }
    privateKey(err);
}

exports.handler();
