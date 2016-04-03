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

    function allBlindsLower() {
	console.log('allBlindsLower(): lowering blinds');
	somfy.allLower();
	blindsState.allBlinds = 'lowered'
	blindsState.doorBlind = 'lowered'
	blindsState.livingroomBlind = 'lowered'
	return {state: {reported: blindsState}}
    }

    function allBlindsRaise() {
	console.log('allBlindsRaised(): raising blinds');
	somfy.allRaise();
	blindsState.allBlinds = 'raised'
	blindsState.doorBlind = 'raised'
	blindsState.livingroomBlind = 'raised'
	return {state: { reported: blindsState}}
    }

    function doorBlindLower() {
	console.log('doorBlindLower(): lowering door blind');
	somfy.doorLower();
	blindsState.doorBlind = 'lowered'
	return {state: { reported: blindsState}}
    }

    function doorBlindRaise() {
	console.log('doorBlindRaised(): raising door blind');
	somfy.doorRaise();
	blindsState.doorBlind = 'raised'
	return {state: { reported: blindsState}}
    }

    function livingroomBlindLower() {
	console.log('livingroomBlindLower(): lowering livingroom blind');
	somfy.livingroomLower();
	blindsState.livingroomBlind = 'lowered'
	return {state: { reported: blindsState}}
    }

    function livingroomBlindRaise() {
	console.log('livingroomBlindsRaised(): raising livingroom blind');
	somfy.livingroomRaise();
	blindsState.livingroomBlind = 'raised'
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
	//nextState = stateObject.state;
	for (var nextState = stateObject.state) {
	    if (nextState == 'doorBlind') {
		if (stateObject.state[nextState] == 'lowered') {
		    doorBlindLower();
		    console.log('handleDelta() lowering doorBlind');
		} else if (stateObject.state[nextState] == 'raised') {
		    doorBlindRaise();
		    console.log('handleDelta() raising doorBlind');
		} else {
		    console.log('handleDelta() ERROR: unknown state: ' + nextState + ': ' + stateObject.state[nextState]);
		}
	    } else if (nextState == 'livingroomBlind') {
		if (stateObject.state[nextState] == 'lowered') {
		    livingroomBlindLower();
		    console.log('handleDelta() lowering livingroomBlind');
		} else if (stateObject.state[nextState] == 'raised') {
		    livingroomBlindRaise();
		    console.log('handleDelta() raising livingroomBlind');
		} else {
		    console.log('handleDelta() ERROR: unknown state: ' + nextState + ': ' + stateObject.state[nextState]);
		}
	    } else if (nextState == 'allBlinds') {
		if (stateObject.state[nextState] == 'lowered') {
		    allBlindsLower();
		    console.log('handleDelta() lowering allBlinds');
		} else if (stateObject.state[nextState] == 'raised') {
		    allBlindsRaise();
		    console.log('handleDelta() raising allBlinds');
		} else {
		    console.log('handleDelta() ERROR: unknown state: ' + nextState + ': ' + stateObject.state[nextState]);
		}
	    } else {
		console.log('handleDelta() ERROR: unknown state: ' + nextState + ': ' + stateObject.state[nextState]);
	    }
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
