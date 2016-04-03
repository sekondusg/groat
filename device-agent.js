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

    //var blindsState = 'raised'
    var blindsState = {allBlinds: 'raised', doorBlind: 'raised', livingroomBlind: 'raised'};

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
		console.log('genericOperation() operation in progress, scheduling retry...');
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

    function allBlindsLower(err, next) {
	console.log('allBlindsLower(): lowering blinds');
	blindsState.allBlinds = 'lowered'
	blindsState.doorBlind = 'lowered'
	blindsState.livingroomBlind = 'lowered'
	somfy.allLower(err, next);
	return {state: {reported: blindsState}}
    }

    function allBlindsRaise(err, next) {
	console.log('allBlindsRaised(): raising blinds');
	blindsState.allBlinds = 'raised'
	blindsState.doorBlind = 'raised'
	blindsState.livingroomBlind = 'raised'
	somfy.allRaise(err, next);
	return {state: { reported: blindsState}}
    }

    function doorBlindLower(err, next) {
	console.log('doorBlindLower(): lowering door blind');
	blindsState.doorBlind = 'lowered'
	somfy.doorLower(err, next);
	return {state: { reported: blindsState}}
    }

    function doorBlindRaise(err, next) {
	console.log('doorBlindRaised(): raising door blind');
	blindsState.doorBlind = 'raised'
	somfy.doorRaise(err, next);
	return {state: { reported: blindsState}}
    }

    function livingroomBlindLower(err, next) {
	console.log('livingroomBlindLower(): lowering livingroom blind');
	blindsState.livingroomBlind = 'lowered'
	somfy.livingroomLower(err, next);
	return {state: { reported: blindsState}}
    }

    function livingroomBlindRaise(err, next) {
	console.log('livingroomBlindsRaised(): raising livingroom blind');
	blindsState.livingroomBlind = 'raised'
	somfy.livingroomRaise(err, next);
	return {state: { reported: blindsState}}
    }

    function blindsGetState() {
	var state = {state: { reported: blindsState }};
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
	    console.log( 'handleStatus() got \''+stat+'\' status on: '+thingName+', state: '+JSON.stringify(stateObject));
	} else {
	    console.log('handleStatus() client token mismtach on: '+thingName);
	}


	console.log('handleStatus() updated state to thing shadow');
	//
	// If no other operation is pending, restart it after 10 seconds.
	//
	/*
	if (currentTimeout === null) {
	    currentTimeout = setTimeout( function() {
		console.log('handleStatus() updating current state status');
		currentTimeout = null;
		genericOperation( 'update', blindsGetState());
	    }, 10000 );
	}
	*/
    }

    function handleDelta( thingName, stateObject ) {
	console.log( 'handleDelta() device: '+thingName+JSON.stringify(stateObject) );
	// Each activity needs to happen serially, not asynchronously due to the
	// single Somfy transmitter requirements

	var head = function(err, next) { genericOperation('update', blindsGetState()); };
	for (var nextState in stateObject.state) {
	    if (nextState == 'doorBlind') {
		if (stateObject.state[nextState] == 'lowered') {
		    console.log('handleDelta() lowering doorBlind');
		    head = function(err, next) { doorBlindLower(err, head); };
		} else if (stateObject.state[nextState] == 'raised') {
		    console.log('handleDelta() raising doorBlind');
		    head = function(err, next) { doorBlindRaise(err, head); };
		} else {
		    console.log('handleDelta() ERROR: unknown state: ' + nextState + ': ' + stateObject.state[nextState]);
		}
	    } else if (nextState == 'livingroomBlind') {
		if (stateObject.state[nextState] == 'lowered') {
		    console.log('handleDelta() lowering livingroomBlind');
		    head = function(err, next) { livingroomBlindLower(err, head); };
		} else if (stateObject.state[nextState] == 'raised') {
		    console.log('handleDelta() raising livingroomBlind');
		    head = function(err, next) { livingroomBlindRaise(err, head); };
		} else {
		    console.log('handleDelta() ERROR: unknown state: ' + nextState + ': ' + stateObject.state[nextState]);
		}
	    } else if (nextState == 'allBlinds') {
		if (stateObject.state[nextState] == 'lowered') {
		    console.log('handleDelta() lowering allBlinds');
		    head = function(err, next) { allBlindsLower(err, head); };
		} else if (stateObject.state[nextState] == 'raised') {
		    console.log('handleDelta() raising allBlinds');
		    head = function(err, next) { allBlindsRaise(err, head); };
		} else {
		    console.log('handleDelta() ERROR: unknown state: ' + nextState + ': ' + stateObject.state[nextState]);
		}
	    } else {
		console.log('handleDelta() ERROR: unknown state: ' + nextState + ': ' + stateObject.state[nextState]);
	    }
	}
	head("", null); // Call the chain of delta event handlers
    }


    function handleTimeout( thingName, clientToken ) {
	var expectedClientToken = stack.pop();
	console.log('handleTimeout(): thingName: '+thingName+', clientToken: '+clientToken);

	if (expectedClientToken === clientToken) {
	    console.log('timeout on: '+thingName);
	} 
	else {
	    console.log('handleTimeout() client token mismtach on: '+thingName);
	}

	genericOperation( 'update', blindsGetState());
    }


    // Events
    
    thingShadows.on('connect', function() {
	console.log('connect() connected to things instance, registering thing name');
	handleConnections();
    });

    thingShadows.on('close', function() {
	console.log('clonse(): hook called: close');
	thingShadows.unregister( thingName );
    });

    thingShadows.on('reconnect', function() {
	console.log('reconnect(): hook called: reconnect');
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
	console.log('offline(): hook called: offline');
    });

    thingShadows.on('error', function(error) {
	console.log('error(): hook called: ', error);
    });

    thingShadows.on('message', function(topic, payload) {
	console.log('message(): hook called: ', topic, payload.toString());
    });

    thingShadows.on('status', function(thingName, stat, clientToken, stateObject) {
	console.log('status(): hook called: ', thingName);
	handleStatus( thingName, stat, clientToken, stateObject );
    });

    thingShadows.on('delta', function(thingName, stateObject) {
	console.log('delta() hook called: ', thingName);
	handleDelta( thingName, stateObject );
    });

    thingShadows.on('timeout', function(thingName, clientToken) {
	console.log('timeout(): called: ', thingName);
	handleTimeout( thingName, clientToken );
    });
}

module.exports = cmdLineProcess;

if (require.main === module) {
  cmdLineProcess('connect to the AWS IoT service and activate this IoT device',
                 process.argv.slice(2), processBlinds );
}
