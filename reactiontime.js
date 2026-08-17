const gameButton = document.getElementById('game-button');
const buttonText = document.getElementById('button-text');
const message = document.getElementById('message');
const comparisonResult = document.getElementById('comparison-result');

const chartStatusText = document.getElementById('chart-status-text');
const progressBarFill = document.getElementById('progress-bar-fill');
const chartPlaceholder = document.getElementById('chart-placeholder');
const chartWrapper = document.getElementById('chart-wrapper');
const averageBadge = document.getElementById('average-badge');
const bestScoreBadge = document.getElementById('best-score-badge');

const AVERAGE_REACTION_TIME = 250;
const REQUIRED_TRIES = 5;

let scoreHistory = []; 
let bestScore = null; // Armazena o melhor tempo registrado
let myChart = null; 

const earlyClickMessages = [
    "Too early! You clicked before it turned green. 😅",
    "Nice try predicting the future! Good luck next time. 🔮",
    "Trigger happy! Patience is part of the test. ⚡"
];

let gameState = 'start'; 
let timeoutId;
let startTime;

function setButtonState(stateClass, text, msg) {
    gameButton.classList.remove('state-start', 'state-waiting', 'state-ready');
    gameButton.classList.add(stateClass);
    
    buttonText.textContent = text;
    if (msg) message.textContent = msg;
}

function calculateBenchmarkComparison(userTime) {
    const diff = AVERAGE_REACTION_TIME - userTime;
    const percentage = Math.abs(Math.round((diff / AVERAGE_REACTION_TIME) * 100));
    
    let evaluation = "";
    if (userTime < 180) {
        evaluation = "⚡ Elite level! You have god-tier reflexes.";
    } else if (userTime <= 230) {
        evaluation = "🚀 Faster than average! Great reflexes.";
    } else if (userTime <= 270) {
        evaluation = "🎯 Right on human average. Solid performance!";
    } else {
        evaluation = "🐢 Slower than average. Stay focused and try again!";
    }

    let comparisonText = diff > 0 
        ? `You are <strong>${percentage}% faster</strong> than average (${AVERAGE_REACTION_TIME} ms)`
        : diff < 0 
        ? `You are <strong>${percentage}% slower</strong> than average (${AVERAGE_REACTION_TIME} ms)`
        : `You hit the exact human average baseline!`;

    comparisonResult.innerHTML = `
        <span style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #888;">YOUR SCORE</span>
        <span class="big-score">${userTime} ms</span>
        <div class="percent-info">${comparisonText}</div>
        <div class="evaluation-text">${evaluation}</div>
        <button class="share-btn" onclick="shareScore(${userTime})">🔗 Share Result</button>
    `;

    comparisonResult.classList.remove('hidden');
}

function handleChartProgress(userTime) {
    scoreHistory.push(userTime);
    
    // Atualiza o melhor tempo
    if (bestScore === null || userTime < bestScore) {
        bestScore = userTime;
    }
    
    if (scoreHistory.length > REQUIRED_TRIES) {
        scoreHistory.shift();
    }

    const currentCount = scoreHistory.length;
    const remaining = REQUIRED_TRIES - currentCount;

    if (currentCount < REQUIRED_TRIES) {
        const progressPercent = (currentCount / REQUIRED_TRIES) * 100;
        progressBarFill.style.width = `${progressPercent}%`;
        chartStatusText.innerHTML = `<strong>${remaining} more ${remaining === 1 ? 'try' : 'tries'}</strong> to unlock your performance chart & 5-try average!`;
    } else {
        chartPlaceholder.classList.add('hidden');
        chartWrapper.classList.remove('hidden');

        const sum = scoreHistory.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / REQUIRED_TRIES);
        
        // Atualiza as caixas de estatística
        averageBadge.textContent = `5-Try Avg: ${avg} ms`;
        bestScoreBadge.textContent = `Your Best Score: ${bestScore} ms`;

        renderChart();
    }
}

function renderChart() {
    const ctx = document.getElementById('reactionChart').getContext('2d');

    if (myChart) {
        myChart.data.datasets[0].data = scoreHistory;
        myChart.update();
    } else {
        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Try 1', 'Try 2', 'Try 3', 'Try 4', 'Try 5'],
                datasets: [{
                    label: 'Reaction Time (ms)',
                    data: scoreHistory,
                    borderColor: '#00f3ff',
                    backgroundColor: 'rgba(0, 243, 255, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#00f3ff',
                    pointRadius: 5,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#888' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    y: { ticks: { color: '#888' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
                }
            }
        });
    }
}

// Função de compartilhamento formatada para não quebrar no Discord
function shareScore(score) {
    const btn = document.querySelector('.share-btn');
    const siteUrl = window.location.href;

    // Texto sem quebras de linha brutas que incomodam o chat do Discord
    const viralText = `🚨 CAN YOU BEAT ME?! 🚨 I scored an insane ${score} ms on the ML Reaction Time Test! Think you have god-tier reflexes? Prove it here: ${siteUrl}`;

    if (window.location.protocol === 'file:') {
        if (btn) {
            btn.textContent = "Open via Live Server to share! ⚠️";
            setTimeout(() => { btn.textContent = "🔗 Share Result"; }, 3000);
        }
        return;
    }

    if (navigator.share) {
        navigator.share({
            title: "ML Reaction Time Test",
            text: viralText
        }).catch(() => {});
        return;
    }

    try {
        navigator.clipboard.writeText(viralText).then(() => {
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = "Copied for Discord! 🔥";
                setTimeout(() => { btn.textContent = originalText; }, 2000);
            }
        });
    } catch (err) {
        console.error("Failed to copy text:", err);
    }
}

gameButton.addEventListener('click', function() {
    if (gameState === 'start' || gameState === 'finished') {
        gameState = 'waiting';
        comparisonResult.classList.add('hidden');
        setButtonState('state-waiting', 'Wait for green...', 'Prepare to click when the color changes!');

        const randomTime = Math.floor(Math.random() * 3000) + 2000;

        timeoutId = setTimeout(() => {
            gameState = 'ready';
            setButtonState('state-ready', 'CLICK NOW!', 'GO!');
            startTime = Date.now();
        }, randomTime);
    } 
    else if (gameState === 'waiting') {
        clearTimeout(timeoutId);
        gameState = 'finished';
        const randomEarlyMsg = earlyClickMessages[Math.floor(Math.random() * earlyClickMessages.length)];
        setButtonState('state-start', 'Try Again', randomEarlyMsg);
    } 
    else if (gameState === 'ready') {
        const reactionTime = Date.now() - startTime;
        gameState = 'finished';
        setButtonState('state-start', 'Try Again', `Your reaction time: ${reactionTime} ms!`);
        
        calculateBenchmarkComparison(reactionTime);
        handleChartProgress(reactionTime);
    }
});