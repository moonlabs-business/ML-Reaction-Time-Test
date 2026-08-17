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

// Renderização do gráfico com escalas travadas para não sair da tela
function renderChart() {
    const ctx = document.getElementById('reactionChart').getContext('2d');

    // Identifica a maior pontuação para ajustar a escala limite sem quebrar o layout
    const maxScore = Math.max(...scoreHistory);
    const yAxisUpperLimit = Math.max(maxScore + 50, 400);

    if (myChart) {
        myChart.options.scales.y.suggestedMax = yAxisUpperLimit;
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
                plugins: { 
                    legend: { display: false } 
                },
                layout: {
                    padding: {
                        top: 15,
                        bottom: 10,
                        left: 10,
                        right: 10
                    }
                },
                scales: {
                    x: { 
                        ticks: { color: '#888' }, 
                        grid: { color: 'rgba(255, 255, 255, 0.05)' } 
                    },
                    y: { 
                        beginAtZero: false,
                        suggestedMin: 100,
                        suggestedMax: yAxisUpperLimit,
                        ticks: { color: '#888' }, 
                        grid: { color: 'rgba(255, 255, 255, 0.05)' } 
                    }
                }
            }
        });
    }
}

function shareScore(score) {
    const btn = document.querySelector('.share-btn');
    const siteUrl = window.location.href;

    // Mensagem formatada e limpa para o Discord
    const discordFormattedText = `🚨 *CAN YOU BEAT ME?!* 🚨\nI scored **${score} ms** on the ML Reaction Time Test!\nTry to beat my score here: ${siteUrl}`;

    // 1. Proteção se estiver rodando localmente sem servidor
    if (window.location.protocol === 'file:') {
        if (btn) {
            btn.textContent = "Open via Live Server to share! ⚠️";
            setTimeout(() => { btn.textContent = "🔗 Share Result"; }, 3000);
        }
        return;
    }

    // 2. Tenta o compartilhaento nativo (se estiver em dispositivos móveis)
    if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        navigator.share({
            title: "ML Reaction Time Test",
            text: discordFormattedText
        }).catch(() => {});
        return;
    }

    // 3. Função de fallback ultra-segura para cópia direta
    function fallbackCopy(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Coloca o elemento fora da tela e garante o foco
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();

        let successful = false;
        try {
            successful = document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }

        document.body.removeChild(textArea);
        return successful;
    }

    // Tenta primeiro a Clipboard API moderna; se falhar, usa o Fallback na hora
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(discordFormattedText)
            .then(() => showSuccessFeedback(btn))
            .catch(() => {
                if (fallbackCopy(discordFormattedText)) {
                    showSuccessFeedback(btn);
                }
            });
    } else {
        if (fallbackCopy(discordFormattedText)) {
            showSuccessFeedback(btn);
        }
    }
}

// Função auxiliar para mudar o texto do botão temporariamente
function showSuccessFeedback(btnElement) {
    if (btnElement) {
        const originalText = btnElement.textContent;
        btnElement.textContent = "Copied to clipboard! 🔥";
        setTimeout(() => {
            btnElement.textContent = originalText;
        }, 2000);
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
