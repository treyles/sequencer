'use strict';

window.onload = init;

var ticks = 16;
var stepNum = 1;
var samplesLoaded = 0;
var countClicks = 0;
var keysPressed = false;
var isCompatible = true;
var allowKeypress;

/**
 * Handle Sounds
 */
var drumPlayers;
var loopPlayers;
var dialoguePlayers;
var keysPlayers;

var defaultDrums;
var alternateDrums;
var defaultKeys; 
var alternateKeysB;
var alternateKeysC;

var sounds = {
    // arrays of file names
    drums: [             
        'kick', 
        'clap', 
        'hat', 
        'hat-open', 
        'tom-1', 
        'tom-2'
    ],

    altDrums: [
        'lofikick',
        'lofisnare',
        'lofihat'
    ],

    loops: [
        'reverse', 
        'alicepad1', 
        'alicepad2', 
        'bass-line1', 
        'bass-line2'
    ],

    dialogues: [
        'dream',
        'high',
        'horizon',
        'lights'
    ],

    // array of directories
    keys: [             
        'keysA',
        'keysB',
        'keysC'
    ]
};

function createPaths(group, keys) {
    var currentGroup = sounds[group];
    var path = 'sounds/' + group + '/';

    // if directory from 'keys'
    if (keys) {
        var keysGroup = [];

        for (var i = 1; i < 10; i++) {
            // create file names
            keysGroup.push(group + i ) 
        }

        currentGroup = keysGroup;
    }

    // returns array of complete paths
    return currentGroup.map(function(el) {
        return path + el + '.wav';
    });
}

function createBuffers(array, loop) {
    var buffers = array.map(function(el, i) {
        var currentBuffer = new Tone.Player(el, function() {
            samplesLoaded++;
        });

        if (loop) {
            currentBuffer.loop = true;
        }

        currentBuffer.toMaster();
        return currentBuffer;  
    });

    // returns array of buffers
    return buffers;   
}

function changeDrumSound(array, index) {
    if (index === 3) return;

    if (array === alternateDrums) {
        drumPlayers[index] = alternateDrums[index];
    } else {
        drumPlayers[index] = defaultDrums[index];
    }
}

function changeKeysSound(change, index) {
    if (change && index === 0) keysPlayers = alternateKeysB;
    if (change && index === 1) keysPlayers = alternateKeysC;
    if (change && index === 2) keysPlayers = defaultKeys;
    if (change && index === 3) keysPlayers = defaultKeys;
    if (!change) keysPlayers = defaultKeys;
}

function initTransport() {
    Tone.Transport.bpm.value = 200;
    Tone.Transport.start();
}

function initSounds() {
    /**
     * copy 'drumsPlayers' and 'keysPlayers' arrays
     * with slice to restore defaults instantly without 
     * having to re-load buffers
     */
    drumPlayers = createBuffers(createPaths('drums'));
    defaultDrums = drumPlayers.slice(0);
    keysPlayers = createBuffers(createPaths('keysA', true));
    defaultKeys = keysPlayers.slice(0);
    loopPlayers = createBuffers(createPaths('loops'), true);
    dialoguePlayers = createBuffers(createPaths('dialogues'));
    
    // store alternate sound buffers
    alternateDrums = createBuffers(createPaths('altDrums'));
    alternateKeysB = createBuffers(createPaths('keysB', true));
    alternateKeysC = createBuffers(createPaths('keysC', true));

    initTransport();
}

/**
 * Handle Sequencer
 */
function createGrid() {
    var grid = qs('#grid');

    // make div for each sound
    for (var i = 0; i < sounds.drums.length; i++) {
        var soundDiv = document.createElement('div');

        soundDiv.setAttribute('id', sounds.drums[i]);
        grid.appendChild(soundDiv);
    }

    // make ticks.length row of beats for each sound
    for (var i = 0; i < grid.children.length; i++) {
        for (var j = 1; j < ticks + 1; j++) {
            var btn = document.createElement('div');

            btn.classList.add('beat', sounds.drums[i], j);
            grid.children[i].appendChild(btn);
        }
    }
}

function createSequence() {
    var sequence = new Tone.Sequence(sequenceEvent, sounds.drums, '8n');
    sequence.start();
}

function sequenceEvent(time) {
    var beatOn = qsa('.beat.on');

    animateCounter();

    for (var i = 0; i < beatOn.length; i++) {
        var currentBeat = beatOn[i].classList;

        // animate steps
        currentBeat.remove('step');
        if (currentBeat.contains(stepNum)) {
            currentBeat.add('step');
        }
    }

    for (var i = 0; i < sounds.drums.length; i++) {    
        for (var j = 0; j < beatOn.length; j++) {
            
            var hasStep = beatOn[j].classList.contains(stepNum);
            var hasSoundName = beatOn[j].classList.contains(sounds.drums[i]);

            // play sounds
            if (hasSoundName && hasStep) {
                drumPlayers[i].start(time);
            }
        }
    }
    
    // reset stepNum at end of sequence to repeat
    stepNum++
    if (stepNum > ticks) {
        stepNum = 1;

        // animate gray circle every measure
        grayCircle.restart();
    }
}

function initSequencer() {
    createGrid();
    createSequence(); 
}

/**
 * Handle Events
 */
function initControls() {
    var liElements = document.getElementsByTagName('li');

    // sequencer clicks
    eachNode(qsa('.beat'), function(el) {
        el.addEventListener('click', handleBeatToggle);
    });

    // menu clicks
    eachNode(liElements, function(el) {
        el.addEventListener('click', handleMenuClicks);
    });

    // keyboard presses
    document.addEventListener('keydown', handleKeyPress);

    // let's have user play around first before triggering animations!
    document.addEventListener('click', handleTransition);
}


function handleBeatToggle() { 
    this.classList.toggle('on');
}

/**
 * returns index of element in context of it's parentNode
 * index of element corresponds to index of sound in player arrays
 * we need to use call because 'children' is a nodelist
 */
function getIndexFromEl(el) {
    var children = el.parentNode.children;
    return Array.prototype.indexOf.call(children, el);
}

function handleMenuClicks() {
    var index = getIndexFromEl(this);
    var radios = this.parentNode.getElementsByTagName('span');

    var loopUl = this.parentNode.id === 'loop-ul';
    var drumsUl = this.parentNode.id === 'drums-ul';
    var keysUl = this.parentNode.id === 'keys-ul';

    if (!this.classList.contains('play')) {     
        if (loopUl) {
            // play loop to start at second measure
            loopPlayers[index].start('@2m');
            animateRadioButton(true, index, radios);
        }

        if (drumsUl) {
            makeTempoSwing(true, index);

            // change to 'alternateDrums' sound
            changeDrumSound(alternateDrums, index)
            radios[index].classList.toggle('on');
        }

        if (keysUl) {
            keysMenuReset();

            // keysPlayers = alternateKeysB;
            changeKeysSound(true, index);
            radios[index].classList.toggle('on');
        }
    } else {
        if (loopUl) {
            loopPlayers[index].stop();
            animateRadioButton(false, index, radios);
        }

        if (drumsUl) {
            makeTempoSwing(false, index);

            changeDrumSound(defaultDrums, index);
            radios[index].classList.toggle('on');
        }

        if (keysUl) {
            changeKeysSound(false);
            radios[index].classList.toggle('on');
        }
    }

    this.classList.toggle('play');
}

function makeTempoSwing(on, index) {
    if (index !== 3) return;

    if (index === 3 && on) {
        Tone.Transport.swing = 0.6;
    } else {
        Tone.Transport.swing = 0;
    }
}

function keysMenuReset() {
    var keysChildren = document.querySelector('#keys-ul').children;

    eachNode(keysChildren, function(el) {
        el.classList.remove('play');
        el.firstChild.classList.remove('on');
    });
}

// TODO: make class to avoid repetitive prefix nonsense
function animateRadioButton(play, index, radios) {
    if (play) {
        // starts queue by blinking
        radios[index].style.webkitAnimation = 'blink 1s infinite linear';
        radios[index].style.animation = 'blink 1s infinite linear';

        // run handleQueue() to stop blinking when sound has started
        handleQueue(index);
    } else {
        radios[index].style.webkitAnimation = '';
        radios[index].style.animation = '';
        radios[index].classList.remove('on');
    }

    // recursively call every 100ms until play state returns 'started'
    // then disable blinking and set
    function handleQueue(index) {
        if (loopPlayers[index].state !== 'started') {
            setTimeout(handleQueue.bind(null, index), 100);
        } else {
            radios[index].style.webkitAnimation = '';
            radios[index].style.animation = '';
            radios[index].classList.add('on')
        }
    }
}

function handleKeyPress(e) {
    if (e.metaKey || e.ctrlKey || allowKeypress !== true) return;

    switch (e.which) {
        // A - L notes
        case 65: triggerKey(keysPlayers, 0, 'waves'); break;
        case 83: triggerKey(keysPlayers, 1, 'waves'); break;
        case 68: triggerKey(keysPlayers, 2, 'waves'); break;
        case 70: triggerKey(keysPlayers, 3, 'waves'); break;
        case 71: triggerKey(keysPlayers, 4, 'waves'); break;
        case 72: triggerKey(keysPlayers, 5, 'waves'); break;
        case 74: triggerKey(keysPlayers, 6, 'waves'); break;
        case 75: triggerKey(keysPlayers, 7, 'waves'); break;
        case 76: triggerKey(keysPlayers, 8, 'waves'); break;

        // R - U samples
        case 82: triggerKey(dialoguePlayers, 0, 'baton'); break;
        case 84: triggerKey(dialoguePlayers, 1, 'baton'); break;
        case 89: triggerKey(dialoguePlayers, 2, 'baton'); break;
        case 85: triggerKey(dialoguePlayers, 3, 'baton'); break;
        default:
            return;
    }
}

// triggers sound and corresponding animation
function triggerKey(array, index, animation) {
    array[index].start();
    
    if (animation === 'waves') {
        animateWave();
    }

    if (animation === 'baton') {
        animBaton.restart();
    }

    // modal gets canceled when keys are pressed
    keysPressed = true;
}

function handleTransition() {
    countClicks++;
    if (countClicks > 5) {
        initTransition();
        createWaveAnimations();
    }
}

/**
 * Handle Animations
 */
var wavesArray = [];

// TODO: use tone.js loop?
function animateCounter() {
    var counters = qs('.count-div').children;

    switch (stepNum) {
        case 1:
            resetCount();
            counters[0].classList.add('on');
            break;
        case 5:
            resetCount();
            counters[1].classList.add('on');
            break;
        case 9: 
            resetCount();
            counters[2].classList.add('on');
            break;
        case 13:
            resetCount();
            counters[3].classList.add('on');
            break;
        default:
            return;
    }

    function resetCount() {
        eachNode(counters, function(el) {
            el.classList.remove('on');
        });    
    }
}

function randomize(arrayLength) {
    return Math.floor (Math.random() * arrayLength);
}

function createWaveAnimations() {
    eachNode(qsa('.waves'), function (el, index) {
        wavesArray[index] = anime({
            targets: '#' + el.id + ' path',
            strokeDashoffset: [anime.setDashoffset, 0],
            easing: 'easeInOutQuad',
            duration: 800,
            direction: 'normal',
            autoplay: false
        });
    });
}

function resetWaves() {
    eachNode(qsa('.waves'), function(el) {
        el.style.opacity = 0;
    });
}

function animateWave(intro) {
    var index;

    if (intro) {
        index = 0;
    } else {
        index = randomize(wavesArray.length)
    }

    resetWaves();

    // only play when 'baton' has appeared
    if (qs('#baton').classList.contains('fadeIn')) {
        qsa('.waves')[index].style.opacity = 1;
        wavesArray[index].restart();
    }
}

function setOrangeCircle() {
    var orangeCircle = qs('#orange-circle');
    
    var circleCoords = [
        [-20, 530],
        [340, 60],
        [295, 220],
        [-85, 15],
        [280, 515],
        [320, 630],
        [-20, 155],
        [-145, 575],
        [160, 100],
        [160, 580]
    ];

    var index = randomize(circleCoords.length)

    function setPosition(topPosition, leftPosition) {
        orangeCircle.style.top = topPosition + 'px';
        orangeCircle.style.left = leftPosition + 'px';
    }

    setPosition.apply(null, circleCoords[index]);
}

var grayCircle = anime({                     
    targets: '#gray-circle',
    scale: 1.2,
    direction: 'alternate',
    duration: 200,
    easing: 'easeInOutCirc',
    autoplay: false,
});

var animBaton = anime({
    targets: '#baton',
    rotate: '1turn',
    duration: 1200,
    autoplay: false
});

/**
 * Handle Idle Transition
 */
function initTransition() {
    var main;
    var delay;
    var modal;
    var animationDiv = qs('#animations');

    document.addEventListener('mousemove', resetTimers);
    document.addEventListener('click', resetTimers);

    function resetTimers() {
        clearTimeout(main);
        clearTimeout(delay);
        clearTimeout(modal);

        toggleAnimationElements(false);
        main = setTimeout(toggleAnimationElements, 2500, true);
    }

    function toggleAnimationElements(show) {
        if (show) {
            resetWaves();
            setOrangeCircle();
            animationDiv.style.visibility = 'visible';
            toggleGrid('hidden');

            delay = setTimeout(toggleIntroduction, 600, true);
            modal = setTimeout(initModal, 6000);
        } else {
            toggleIntroduction(false);

            animationDiv.style.visibility = 'hidden';
            toggleGrid('visible');
        }
    }
}

function toggleGrid(visibility) {
    var counterDiv = qs('.count-div');

    if (visibility === 'hidden') {
        counterDiv.style.opacity = 0;
    } else {
        counterDiv.style.opacity = 1;
    }

    eachNode(qsa('.beat'), function(el) {
        if (!el.classList.contains('on')) {
            el.style.visibility = visibility;
        }
    });
}

function toggleIntroduction(on) {
    var intro = qsa('.intro');

    if (on) {
        eachNode(intro, function(el) {
            el.classList.add('fadeIn');
        });;

        animateWave(true);
    } else {
        eachNode(intro, function(el) {
            el.style.opacity = 0;
            el.classList.remove('fadeIn');
        });
    }
}

// TODO: function name change?
function initModal() {
    var overlay = qs('#overlay');

    if (!keysPressed) {
        overlay.style.display = 'block';
    }

    qs('.got-it').addEventListener('click', function() {
        overlay.style.display = 'none';
        keysPressed = true;
    });
}

/**
 * Handle Loader
 */
function init() {
    handleCompatibility();

    initSounds();
    initTransport();
    initSequencer();
    initControls();

    handleBrowserStyles();

    loadApp();

    function loadApp() {
        if (samplesLoaded !== 45 || isCompatible !== true) {
            setTimeout(loadApp, 2000);
        } else {
            qs('#lobby').classList.add('fadeOutLobby');
            allowKeypress = true;
        }
    }
}