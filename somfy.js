
// Control pins

const upPin = 4;
const downPin = 5;
const channelPin = 6;

// Indicator pins

const chan1Pin = 7;
const chan2Pin = 8;


// Counters for number of flashes on LEDs

var ch1FlashCount = 0;
var ch2FlashCount = 0;


// Somfy Channels

const doorBlindChan = 2;
const livingRoomBlindChan = 3;
const allBlindsChan = 4;

// Time Durations

const chanDisplayTimeout = 6000;
const chanDetectPeriod = 1000;
const chanPulseDuration = 100;

var isChannel1 = function() {
}

var switchChanTo1 = function() {
}

var switchChanTo = function(channel) {

}

var lower = function() {
}

var raise = function() {
}

exports.allRaise = function() {
    switchChanTo(allBlindsChan);
    raise();
}

exports.allLower = function() {
    switchChanTo(allBlindsChan);
    lower();
}

exports.doorRaise = function() {
    switchChanTo(doorChan);
    raise();
}

exports.doorLower = function() {
    switchChanTo(doorChan);
    lower();
}

exports.livingRoomRaise = function() {
    switchChanTo(livingRoomChan);
    raise();
}

exports.livingRoomdoorLower = function() {
    switchChanTo(livingRoomChan);
    lower();
}

function pulse(gpio, next) {
    //Set gpio.gpioPin output, low;
    console.log("pulse(): setting gpio: " + gpio.gpioPin + " to low");
    var err; // = "oops";

    //setTimeout(setHighZ(err), gpio.duration);
    setTimeout(setHighZ, gpio.duration, err, gpio);

    function setHighZ(err, gpio) {
	// Set gpio.gpioPin input;
	if (err) { return next(err); }
	
	console.log("pulse(): setting gpio: " + gpio.gpioPin + " to high-Z");
	setTimeout(next, gpio.duration, err);
    }
}
// desired = {blind: "door/familyroom/all", direction: "up/down"}
function blindsActivate(desired, next) {
    findChannelFive();

    function selectChannel() {
	if (desired.blind == "all") {
	} else if (desired.blind == "door") {
	} else {
	}
    }
    function chanTwoActive(desired, err) {
	pulse({gpioPin: channelpin, chanPulseDuration}, function activate() {
	};)
    }

    function switchChannel(chanDiff, correctChannel) {
	if (chanDiff == 0) { return correctChannel(); }
	pulse({gpioPin: channelpin, chanPulseDuration}, function {
	    switchChannel(chanDiff - 1, correctChannel);
	});
    }
}

function findChanelFive(next) {
    var chOneCnt = 0, chTwoCnt = 0;
    // Set edge count callbacks

    // Pulse channel select
    pulse( {gpioPin: chanPin, duration: chanPulseDuration}, function detPause() {
	setTimeout(detectCh5, chanDetectPeriod);
    });
    // and wait for flashes

    // Check if in channel 5
    function detectCh5(){
	if (chOneCnt > 1 && chTwoCnt > 1) {
	    next();
	} else {
	    findChannelFive(next);
	}
    }
    // Pulse channel select
}

function test() {
    pulse({gpioPin: 4, duration: 1000}, function(err) {
	if (err) {
	    console.log("test(): pulse produced error: " + err);
	} else {
	    console.log("test(): finished pulsing");
	}
    });
}

test()
