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
// Send an HTTP request to the OpenAI API
    return fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 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"
        },
        body: JSON.stringify({
            prompt: prompt,
            model: "text-davinci-003",
            max_tokens: 100,
            temperature: 0.5
        })
    })
        .then(response => response.json())
        .catch(error => {
            // Handle any errors that occurred
            console.error(error);
        });
}

function startRecognizer(firstTime) {
    const button = document.getElementById('ask-question');

    const recognizer = new webkitSpeechRecognition();

    recognizer.lang = 'en-US';

    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.addEventListener('result', (event) => {
        if (!button.hasAttribute('disabled')) {
            return;
        }
        const evt = event.results[0];

        // Get the transcript of the user's speech
        const text = evt[0].transcript;

        // Append the transcript element to the body of the page
        if (evt.isFinal) {
            recognizer.stop();
            requestOpenAI(text).then(res => {
                const res2 = res.choices[0].text;
                const utterance = new SpeechSynthesisUtterance(res2.replace('\\n', ' '))
                utterance.addEventListener('end', () => {
                    console.log(`Restarting...`);
                    startRecognizer();
                })
                speechSynthesis.speak(utterance);
            })
        }
    });

    if (firstTime) {
        requestOpenAI("introduce yourself, you're rainbow bunny named Kibo. also remind me to unmute the music by pressing the icon in the top left").then(res => {
            const res2 = res.choices[0].text;
            const utterance = new SpeechSynthesisUtterance(res2.replace('\\n', ' '))
            utterance.addEventListener('end', () => {
                console.log(`Restarting...`);
                startRecognizer(false);
            })
            speechSynthesis.speak(utterance);
        })
    } else {
        recognizer.start();
    }
}
const setupAskQuestionButton = () => {
    const button = document.getElementById('ask-question');

    button.addEventListener('click', () => {
        startRecognizer(true);

        button.setAttribute('disabled', '');
        button.className = 'disabled';
    });
}


const audio = new Audio();

const playAudio = () => {
    // Create an audio element

// Set the audio source
    audio.src = "/ambient.mp3";

// Set the volume level to 0.5 (half the maximum volume)
    audio.volume = 0.2;

// Play the audio
    audio.play();
}

const setupToggle = () => {
    const soundToggle = document.getElementById("sound-toggle");
    const soundOn = document.getElementById("sound-on");
    const soundOff = document.getElementById("sound-off");

// Add an event listener to the button
    soundToggle.addEventListener("click", function() {
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
    setupBubbles();
    setupAskQuestionButton()
    setupToggle();
}
