//app deps
const thingShadow = require('aws-iot-device-sdk').thingShadow;
const cmdLineProcess   = require('aws-iot-device-sdk/examples/lib/cmdline');
const spawn = require('child_process').spawn;

//begin module

//
// Control outdoor blinds by interfacing with an attached remote control
// through GPIO ports and interact with the blinds via the AWS IoT service.
//

function processBlinds( args ) {
//
// Instantiate the thing shadow class.
//
    const thingShadows = thingShadow({
	keyPath: args.privateKey,
	certPath: args.clientCert,
	caPath: args.caCert,
	clientId: args.clientId,
	region: args.region,
	reconnectPeriod: args.reconnectPeriod,
	protocol: args.Protocol,
	port: args.Port,
	host: args.Host,
	debug: args.Debug
    });

    var state = {sunny: true};

//
// Operation timeout in milliseconds
//
    const operationTimeout = 10000;    

    const thingName = 'blinds';

    var currentTimeout = null;

    var blindsState = 'up'

//
// For convenience, use a stack to keep track of the current client 
// token; in this example app, this should never reach a depth of more 
// than a single element, but if your application uses multiple thing
// shadows simultaneously, you'll need some data structure to correlate 
// client tokens with their respective thing shadows.
//
    var stack = [];

    function genericOperation( operation, state ) {
	var clientToken = null;
	if (operation == 'get') {
	    console.log('genericOperation(): performing get');
	    clientToken = thingShadows[operation]( thingName );
	} else {
	    console.log('genericOperation(): performing operation: ' + operation);
	    clientToken = thingShadows[operation]( thingName, state );
	}
	console.log('genericOperation(): clientToken: ' + clientToken);

	if (clientToken === null) {
//
// The thing shadow operation can't be performed because another one
// is pending; if no other operation is pending, reschedule it after an 
// interval which is greater than the thing shadow operation timeout.
//
	    if (currentTimeout !== null) {
		console.log('operation in progress, scheduling retry...');
		currentTimeout = setTimeout( 
		    function() { genericOperation( operation, state ); }, 
                    operationTimeout * 2 );
	    }
	} else {
//
// Save the client token so that we know when the operation completes.
//
	    stack.push( clientToken );
	}
    }

    function mobileAppConnect() {
	thingShadows.register( thingName, { ignoreDeltas: false,
					    operationTimeout: operationTimeout } );
	console.log('mobileAppConnect(): registring thingName: '+thingName);
	setTimeout( function() {
	    genericOperation('get');
	}, 5000);
	setInterval(checkWeather, 150000); // Check the weather every 2.5 minutes and close binds if sunny
	/*
	setTimeout( function() {
	    genericOperation('update', {state: { desired: { doorBlind: 'lowered' }}});
	}, 10000);
	setTimeout( function() {
	    genericOperation('update', {state: { desired: { doorBlind: 'raised' }}});
	}, 30000);
	*/
    }

    function checkWeather() {
	const weather = spawn('events/solar_events.py');
	weather.stdout.on('data', (data) => {
	    console.log(`stdout: ${data}`);
	});
	weather.stderr.on('data', (data) => {
	    console.log(`stderr: ${data}`);
	});
	weather.on('close', (code) => {
	    console.log(`child process exited with code: ${code}`);
	    if (code == '0') {
		if (state.sunny == false) {
		    console.log('closing the blinds');
		    genericOperation('update', {state: { desired: { allBlinds: 'lowered' }}});
		    state.sunny = true;
		}
	    } else if (code == '1') {
		if (state.sunny == true) {
		    console.log('opening the blinds');
		    genericOperation('update', {state: { desired: { allBlinds: 'raised' }}});
		    state.sunny = false;
		}
	    } else {
		console.log('dont know what to do with the blinds');
	    }
	});
    }
    
    function handleConnections() {
	mobileAppConnect();
    }

    function handleStatus( thingName, stat, clientToken, stateObject ) {
	var expectedClientToken = stack.pop();
	console.log('handleStatus(): stat: '+stat+', stateObject: '+JSON.stringify(stateObject));

	if (expectedClientToken === clientToken) {
	    console.log( 'got \''+stat+'\' status on: '+thingName+', state: '+JSON.stringify(stateObject));
	}
	else {
	    console.log('(status) client token mismtach on: '+thingName);
	}

	console.log('client status');
    }

    function handleDelta( thingName, stateObject ) {
	console.log( 'handleDelta() web-app: '+thingName+JSON.stringify(stateObject) );
    }

    function handleTimeout( thingName, clientToken ) {
	var expectedClientToken = stack.pop();
	console.log('handleTimeout(): thingName: '+thingName+', clientToken: '+clientToken);

	if (expectedClientToken === clientToken) {
	    console.log('timeout on: '+thingName);
	} 
	else {
	    console.log('(timeout) client token mismtach on: '+thingName);
	}
    }

    thingShadows.on('connect', function() {
	console.log('connected to things instance, registering thing name');
	handleConnections();
    });

    thingShadows.on('close', function() {
	console.log('close');
	thingShadows.unregister( thingName );
    });

    thingShadows.on('reconnect', function() {
	console.log('reconnect');
	handleConnections();
    });

    thingShadows.on('offline', function() {
	//
	// If any timeout is currently pending, cancel it.
	//
	if (currentTimeout !== null) {
	    clearTimeout(currentTimeout);
	    currentTimeout=null;
	}
	//
	// If any operation is currently underway, cancel it.
	//
	while (stack.length) {
	    stack.pop();
	}
	console.log('offline');
    });

    thingShadows.on('error', function(error) {
	console.log('error', error);
    });

    thingShadows.on('message', function(topic, payload) {
	console.log('message', topic, payload.toString());
    });

    thingShadows.on('status', function(thingName, stat, clientToken, stateObject) {
	handleStatus( thingName, stat, clientToken, stateObject );
    });

    thingShadows.on('delta', function(thingName, stateObject) {
	handleDelta( thingName, stateObject );
    });

    thingShadows.on('timeout', function(thingName, clientToken) {
	handleTimeout( thingName, clientToken );
    });
}

module.exports = cmdLineProcess;

if (require.main === module) {
  cmdLineProcess('connect to the AWS IoT service and test a thing by modifying a thing shadow APIs',
                 process.argv.slice(2), processBlinds );
}
