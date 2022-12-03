const setupBubbles = () => {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");

    var W = window.innerWidth;
    var H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    var particles = [];
    for (var i = 0; i < 25; i++) {
        particles.push(new createParticle());
    }

    function createParticle() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.vx = Math.random() * 10 - 5;
        this.vy = Math.random() * 10 - 5;
        this.radius = Math.random() * 10 + 2;
        this.color = "rgba(" + Math.floor(Math.random() * 255) + ", " + Math.floor(Math.random() * 255) + ", " + Math.floor(Math.random() * 255) + ", 0.5)";
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2, false);
            ctx.fill();

            p.x += p.vx;
            p.y += p.vy;

            if (p.x + p.radius > W) p.x = p.radius;
            else if (p.x - p.radius < 0) p.x = W - p.radius;
            if (p.y + p.radius > H) p.y = p.radius;
            else if (p.y - p.radius < 0) p.y = H - p.radius;
        }
    }

    setInterval(draw, 30);
};

const requestOpenAI = (prompt) => {
    const element = document.getElementById('listening-state');
    element.innerText = "Thinking...";

// Send an HTTP request to the OpenAI API
    fetch("https://us-central1-kibo-the-bunny.cloudfunctions.net/requestOpenAPI", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt: prompt
        })
    })
        .then(res => res.text())
        .then(res => {
            speak(res.replace(/^[^\n]+\n\n/,""))
        })
        .catch(error => {
            // Handle any errors that occurred
            console.error(error);
        });
}

function speak(text) {
    if (!isSpeakingWithKibo) {
        console.log(`Not speaking with KIBO!`)
        return;
    }
    const element = document.getElementById('listening-state');
    element.innerText = "Speaking...";
    const utterance = new SpeechSynthesisUtterance(text.replace('\\n', ' '))
    utterance.addEventListener('end', () => {
        console.log(`Restarting...`);
        startRecognizer();
    })
    speechSynthesis.speak(utterance);

}


function listen(recognizer) {
    const element = document.getElementById('listening-state');
    element.innerText = "Listening...";
    recognizer.start();
}

let isSpeakingWithKibo = false;
function startRecognizer(firstTime) {
    let recognizer = new webkitSpeechRecognition();

    recognizer.lang = 'en-US';

    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.addEventListener('result', (event) => {
        if (!isSpeakingWithKibo) {
            recognizer.stop();
            return;
        }
        const evt = event.results[0];

        // Get the transcript of the user's speech
        const text = evt[0].transcript;

        // Append the transcript element to the body of the page
        if (evt.isFinal) {
            recognizer.stop();
            requestOpenAI(`respond to ${text} and then ask a follow up question`)
        }
    });

    if (!isSpeakingWithKibo) {
        return;
    }

    if (firstTime) {
        let str = "your name is 'Kibo the rainbow bunny', introduce yourself to me. you're here to listen to me talk"
        if (document.getElementById('sound-toggle').classList.contains('glowing')) {
           str += " and also add a reminder that to unmute the music i can press the icon in the top left"
        }
        requestOpenAI(str)
    } else {
        listen(recognizer)
    }
}
const setupAskQuestionButton = () => {
    const button = document.getElementById('ask-question');

    button.addEventListener('click', () => {
        if (isSpeakingWithKibo) {
            isSpeakingWithKibo = false;
            speechSynthesis.cancel();
            button.innerText = "Speak to Kibo"
            document.getElementById('listening-state').innerText = "Paused...";
        } else {
            isSpeakingWithKibo = true;
            startRecognizer(true);
            button.innerText = "Pause with Kibo"
        }
    });
}


const audio = new Audio();

const playAudio = () => {
    // Create an audio element

    // Set the audio source
    audio.src = "ambient.mp3";

    // Set the volume level to 0.5 (half the maximum volume)
    audio.volume = 0.2;
    audio.loop = true;
    // Play the audio
    audio.play();
}

const setupToggle = () => {
    const soundToggle = document.getElementById("sound-toggle");
    const soundOn = document.getElementById("sound-on");
    const soundOff = document.getElementById("sound-off");

// Add an event listener to the button
    soundToggle.addEventListener("click", function() {
        if (soundToggle.classList.contains('glowing')) {
            if (isSpeakingWithKibo) {
                requestOpenAI("say something nice about the music and ask me about what's on my mind")
            }
        }
        soundToggle.classList.remove('glowing')
        // Toggle the display of the images
        if (soundOn.style.display === "none") {
            soundOn.style.display = "block";
            soundOff.style.display = "none";
            playAudio()
        } else {
            soundOn.style.display = "none";
            soundOff.style.display = "block";
            pauseAudio();
        }
    });
}

const pauseAudio = () => {
    audio.pause();
}

window.onload = () => {
    if (!speechSynthesis) {
        alert("This browser doesn't support speech synthesis, try on Chrome for Desktop!")
    }
    setupBubbles();
    setupAskQuestionButton()
    setupToggle();
}
