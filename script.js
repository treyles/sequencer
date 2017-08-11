Tone.Buffer.loaded

var ticks = 16;
var stepNum = 1;

Tone.Transport.bpm.value = 200;
Tone.Transport.start();

// TODO: IIFE here to run init

var sounds = [
    // change bass name
    {name: 'bass', soundFile: 'sounds/newsounds/kick.mp3'}, 
    {name: 'snare', soundFile: 'sounds/newsounds/clap.mp3'}, 
    {name: 'low', soundFile: 'sounds/newsounds/hat.mp3'}, 
    {name: 'mid', soundFile: 'sounds/newsounds/hat-open.mp3'},
    {name: 'bass', soundFile: 'sounds/newsounds/kick.mp3'}, 
    {name: 'snare', soundFile: 'sounds/newsounds/clap.mp3'}
];

var loopSounds = [
    'sounds/newsounds/crackle.wav',
    'sounds/newsounds/alicepad1.wav',
    'sounds/newsounds/alicepad2.wav',
    'sounds/newsounds/bass-line1.wav',
    'sounds/newsounds/bass-line2.wav'
];


// TODO:

// No Buffer named 4? Plays only first beat
var altDrums = [
    'sounds/newsounds/altdrum/lofikick.wav',
    'sounds/newsounds/altdrum/lofisnare.wav',
    'sounds/newsounds/altdrum/lofihat.wav',
    'sounds/newsounds/hat-open.mp3',
    'sounds/newsounds/kick.mp3',
    'sounds/newsounds/clap.mp3'
];

// get soundFiles to pass as a new array in multiPlayer
var soundFileArray = sounds.map(function(obj) {
    return obj.soundFile;
});

/**
 * Make Grid
 */

var grid = document.getElementById('grid');

// make div for each sound
for (var i = 0; i < sounds.length; i++) {
    var soundDiv = document.createElement('div');

    soundDiv.setAttribute('id', sounds[i].name);
    grid.appendChild(soundDiv);
}

// make ticks.length row of beats for each sound
for (var i = 0; i < grid.children.length; i++) {
    for (var j = 1; j < ticks + 1; j++) {
        var btn = document.createElement('div');

        btn.classList.add('beat', sounds[i].name, j);
        grid.children[i].appendChild(btn);

        btn.addEventListener('click', function(){
            
            //TODO:
            /** 
            * Find out if any of the drum li's hasPlay
            * if so, when clicking new .beat toggle them all off 
            * and on when you click a new .beat, then add 
            * alt to current .beat.
            *
            * Better way?: push new samples in new array, buffer conflict?
            */

            // var playingAlt = document.querySelector()
            this.classList.toggle('on');
            // if () {
            //     // do something     
            // }
        });
    }
}

/**
 * Sequencer
 */
var soundOutput = new Tone.Gain().toMaster()

// multiplayer for drum sounds
var multiPlayer = new Tone.MultiPlayer(soundFileArray, function() {
    multiPlayer.start();
}).connect(soundOutput);

multiPlayer.volume.value = (-10);


// Alternate drum sound library
var drumPlayer = new Tone.MultiPlayer(altDrums, function() {
    drumPlayer.start();
}).connect(soundOutput);


// loop sequence

var sequence = new Tone.Sequence(function(time) {
    var beat = document.querySelectorAll('.beat');
    
    // animate steps
    // loop through nodeList
    for (var i = 0; i < beat.length; i++) {
        var currentBeat = beat[i].classList; 

        currentBeat.remove('step');
        if (currentBeat.contains(stepNum)) {
            currentBeat.add('step');
        }
    }

    // play sounds
    for (var i = 0; i < sounds.length; i++) {
        // loop through nodeList
        for (var j = 0; j < beat.length; j++) {
            // TODO: get multiple class names with .split
            var hasSoundName = beat[j].classList.contains(sounds[i].name);
            var hasStep = beat[j].classList.contains(stepNum);
            var hasOn = beat[j].classList.contains('on');
            var hasAlt = beat[j].classList.contains('alt'); 
            
            // TODO:
            /** 
             * Kick drum functionality okay.
             * When manually setting .alt to play lofi snare
             * it also plays original snare, figure out
             * why !hasAlt condition doesn't work.
             */

            if (hasSoundName && hasStep && hasOn && !hasAlt) {
                multiPlayer.start(i, time, 0);
            }
            if (hasSoundName && hasStep && hasOn && hasAlt) {
                drumPlayer.start(i, time, 0);
            }
        }       
    }

    // reset stepNum at end of sequence to repeat
    stepNum++

    if (stepNum > ticks) {
        stepNum = 1;
    }
}, sounds, '8n').start();


/**
 * Loop
*/

// TODO: combine with multiPlayer and put in object?

// Loop sound library
var loopPlayer = new Tone.MultiPlayer(loopSounds, function() {
    loopPlayer.start();
}).connect(soundOutput);

// vinyl loop
var vinyl = new Tone.Loop(function(time) {
    loopPlayer.start(0, time, 0);
}, '2m');

// melody loop
var melody = new Tone.Loop(function(time) {
    loopPlayer.start(1, time, 0);
}, '1m');

// bass loop, loops through two bass parts
var bassPart = 0;
var bassLine = new Tone.Sequence(function(time) {
    if (bassPart < 1) {
        loopPlayer.start(3, time, 0);
        bassPart++;
    } else {
        loopPlayer.start(4, time, 0);
        bassPart = 0;
    } 
}, [1, 2], '8m');






// click events
// TODO: refactor querySelector to combine with drums
var loopUl = document.querySelector('#loop');
loopUl.addEventListener('click', function(e) {
    var targetClasses = e.target.classList;
    var hasPlay = targetClasses.contains('play')
    var togglePlay = targetClasses.toggle('play');

    // LOOPS
    // TODO: refactor
    if (targetClasses.contains('vinyl')) {
        if (hasPlay) {
            vinyl.stop();
        } else {
            vinyl.start('@1m');
        }
        togglePlay;
    }
    if (targetClasses.contains('melody')) {
        if (hasPlay) {
            melody.stop()
        } else {
            melody.start('@1m');
        }
        togglePlay;
    }
    if (targetClasses.contains('bass-line')) {
        if (hasPlay) {
            bassLine.stop()
            bassPart = 0;
        } else {
           bassLine.start('@2m') 
        }
        togglePlay;
    }
    if (targetClasses.contains('melody')) {
        if (hasPlay) {
            melody.stop()
        } else {
            melody.start('@1m');
        }
        togglePlay;
    }

});


var drumsUl = document.querySelector('#drums');
drumsUl.addEventListener('click', function(e) {
    var targetClasses = e.target.classList;
    var hasPlay = targetClasses.contains('play')
    var togglePlay = targetClasses.toggle('play');

    // DRUMS
    // TODO: refactor, fix toggle for alternate kick if activated before sequencer
    if (targetClasses.contains('kick-alt')) {
        var activeKick = document.querySelectorAll('.beat.bass.on');

        if (hasPlay) {
            for (var i = 0; i < activeKick.length; i++) {
                activeKick[i].classList.remove('alt');
            }
        } else {
            for (var i = 0; i < activeKick.length; i++) {
                activeKick[i].classList.add('alt');
            }
        }
        togglePlay;
    }
});



// keypress'
window.addEventListener("keydown", function(e) {
    if (e.keyCode == "32") {
        Tone.Transport.stop();
    }
    if (e.keyCode == "80") {
        loopPlayer.start(2);
    }
    if (e.keyCode == "79") {
        loopPlayer.start(1);
    }
});
 



/*function loadSamples() {
  for(var i=0; i<samples.length; i++) {
    players[i] = new Tone.Sampler(samples[i], function() {
      loadedSamples++;
    });
    players[i].connect(gain);
  }
}*/






