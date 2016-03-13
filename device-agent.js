//app deps

const thingShadow = require('aws-iot-device-sdk').thingShadow;
const cmdLineProcess   = require('aws-iot-device-sdk/examples/lib/cmdline');
const somfy = require('./somfy.js');



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

//
// Operation timeout in milliseconds
//
    const operationTimeout = 10000;    

    const thingName = 'blinds';

    var currentTimeout = null;

    var blindsState = 'raised'

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

    function allBlindsLower() {
	console.log('allBlindsLower(): lowering blinds');
	somfy.allLower();
	blindsState = 'lowered'
	return {state: { reported: { blinds: 'lowered' }}}
    }

    function allBlindsRaise() {
	console.log('allBlindsRaised(): raising blinds');
	somfy.allRaise();
	blindsState = 'raised'
	return {state: { reported: { blinds: 'raised' }}}
    }

    function doorBlindLower() {
	console.log('doorBlindLower(): lowering door blind');
	somfy.doorLower();
	blindsState = 'lowered'
	return {state: { reported: { blinds: 'lowered' }}}
    }

    function doorBlindRaise() {
	console.log('doorBlindsRaised(): raising door blind');
	somfy.doorRaise();
	blindsState = 'raised'
	return {state: { reported: { blinds: 'raised' }}}
    }

    function blindsGetState() {
	var state = {state: { reported: { blinds: blindsState }}};
	console.log('blindsGetState(): fetching blinds current state: ' + JSON.stringify(state));
	return state
    }

    function deviceConnect() {
	console.log("deviceConnect(): registering and updating device side of " + thingName);
	thingShadows.register( thingName, { ignoreDeltas: false,
						    operationTimeout: operationTimeout } );
	setTimeout( function() {
	    genericOperation( 'update', blindsGetState() );
	}, 5000);
    }

    function handleConnections() {
	deviceConnect();
    }

    function handleStatus( thingName, stat, clientToken, stateObject ) {
	var expectedClientToken = stack.pop();
	console.log('handleStatus(): stat: '+stat+', stateObject: '+ JSON.stringify(stateObject));

	if (expectedClientToken === clientToken) {
	    console.log( 'got \''+stat+'\' status on: '+thingName+', state: '+JSON.stringify(stateObject));
	} else {
	    console.log('(status) client token mismtach on: '+thingName);
	}


	console.log('updated state to thing shadow');
	//
	// If no other operation is pending, restart it after 10 seconds.
	//
	if (currentTimeout === null) {
	    currentTimeout = setTimeout( function() {
		currentTimeout = null;
		genericOperation( 'update', blindsGetState());
	    }, 10000 );
	}
    }

    function handleDelta( thingName, stateObject ) {
	console.log( 'handleDelta() device: '+thingName+JSON.stringify(stateObject) );
	nextState = stateObject.state.blinds;
	if (nextState == 'lowered') {
	    doorBlindLower();
	} else {
	    doorBlindRaise();
	}
	genericOperation( 'update', blindsGetState() );
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

	genericOperation( 'update', blindsGetState());
    }


    // Events
    
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
  cmdLineProcess('connect to the AWS IoT service and activate this IoT device',
                 process.argv.slice(2), processBlinds );
}