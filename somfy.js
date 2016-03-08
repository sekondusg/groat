
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
const livingRoomBlindChan = 2;
const allBlindsChan = 4;

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

export.allRaise = function() {
    switchChanTo(allBlindsChan);
    raise();
}

export.allLower = function() {
    switchChanTo(allBlindsChan);
    lower();
}

export.doorRaise = function() {
    switchChanTo(doorChan);
    raise();
}

export.doorLower = function() {
    switchChanTo(doorChan);
    lower();
}

export.livingRoomRaise = function() {
    switchChanTo(livingRoomChan);
    raise();
}

export.livingRoomdoorLower = function() {
    switchChanTo(livingRoomChan);
    lower();
}



