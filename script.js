// --- ESTADO ---
let selectedMode = '', selectedDiff = '', quizSet = [], currentIndex = 0;
let points = 0, streak = 0, lives = 3;
let isSurvival = false;

// VARIABLES DEL CRONÓMETRO
let timerInterval;
let timeLeft = 15;

// --- PERSISTENCIA ---
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let totalPoints = parseInt(localStorage.getItem('totalPoints')) || 0;
let inventory = JSON.parse(localStorage.getItem('inventory')) || { shield: 0, half: 0 };
let achievements = JSON.parse(localStorage.getItem('achievements')) || { medal1: false, medal2: false, medal3: false };
let lastSpin = localStorage.getItem('lastSpin') || 0;

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// --- LÓGICA DE LA RULETA DIARIA (MODAL) ---
function openWheelModal() {
    const modal = document.getElementById('wheel-modal');
    if (modal) {
        modal.style.display = 'flex';
        checkWheelCooldown();
    }
}

function closeWheelModal() {
    const modal = document.getElementById('wheel-modal');
    if (modal) modal.style.display = 'none';
}

function spinWheel() {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (now - lastSpin < cooldown) {
        alert("¡La ruleta aún está recargándose!");
        return;
    }

    const wheel = document.getElementById('main-wheel');
    const btn = document.getElementById('spin-btn');
    
    const randomDeg = Math.floor(Math.random() * 360) + 1800; 
    wheel.style.transform = `rotate(${randomDeg}deg)`;
    btn.disabled = true;

    setTimeout(() => {
        const actualDeg = randomDeg % 360;
        let prize = 100;
        
        if (actualDeg <= 60) prize = 500;
        else if (actualDeg <= 120) prize = 1000;
        else if (actualDeg <= 180) prize = 200;
        else if (actualDeg <= 240) prize = 1500;
        else if (actualDeg <= 300) prize = 50;
        else prize = 300;

        totalPoints += prize;
        lastSpin = Date.now();
        localStorage.setItem('lastSpin', lastSpin);
        
        showAchievementToast(`¡Ganaste 💰 ${prize}!`, "🎰");
        saveData();
        updateUI();
        
        // Cerrar automáticamente tras ganar
        setTimeout(closeWheelModal, 1500);
    }, 4000);
}

function checkWheelCooldown() {
    const btn = document.getElementById('spin-btn');
    const timer = document.getElementById('wheel-timer');
    const statusText = document.getElementById('wheel-status-text');
    
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const remaining = cooldown - (now - lastSpin);

    if (remaining > 0) {
        if (btn) btn.disabled = true;
        const hours = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        const timeStr = `${hours}h ${mins}m`;
        if (timer) timer.innerText = `Disponible en: ${timeStr}`;
        if (statusText) statusText.innerText = `Disponible en ${timeStr}`;
    } else {
        if (btn) btn.disabled = false;
        if (timer) timer.innerText = "¡Lista para girar!";
        if (statusText) statusText.innerText = "¡Gira ahora GRATIS!";
    }
}

// --- LÓGICA DEL CRONÓMETRO ---
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 15;
    const timerEl = document.getElementById('timer-display');
    if (timerEl) {
        timerEl.innerText = `⏱️ ${timeLeft}s`;
        timerEl.classList.remove('timer-low');
    }

    timerInterval = setInterval(() => {
        timeLeft--;
        if (timerEl) {
            timerEl.innerText = `⏱️ ${timeLeft}s`;
            if (timeLeft <= 5) timerEl.classList.add('timer-low');
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeout();
        }
    }, 1000);
}

function handleTimeout() {
    document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
    const q = quizSet[currentIndex];
    const correctBtn = document.querySelectorAll('.opt-btn-choice')[q.correct];
    if (correctBtn) correctBtn.classList.add('correct');

    if (inventory.shield > 0) {
        inventory.shield--;
    } else {
        streak = 0;
        lives--;
    }

    saveData();
    updateUI();

    setTimeout(async () => {
        currentIndex++;
        if (lives > 0 && currentIndex < quizSet.length) renderQuestion();
        else finish();
    }, 1200);
}

// --- SISTEMA DE NOTIFICACIONES ---
function showAchievementToast(title, icon) {
    const toast = document.createElement('div');
    toast.className = 'achievement-notification';
    toast.innerHTML = `
        <div class="achievement-icon">${icon}</div>
        <div class="achievement-text">
            <b>¡Notificación!</b>
            <span>${title}</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// --- SISTEMA DE LOGROS ---
function checkAchievements() {
    let unlockedNew = false;
    if (!achievements.medal1 && totalPoints >= 1000) {
        achievements.medal1 = true;
        showAchievementToast("Novato de Bronce (1,000 pts)", "🥉");
        unlockedNew = true;
    }
    if (!achievements.medal2 && totalPoints >= 5000) {
        achievements.medal2 = true;
        showAchievementToast("Experto de Plata (5,000 pts)", "🥈");
        unlockedNew = true;
    }
    if (!achievements.medal3 && (totalPoints >= 10000 || highScore >= 2000)) {
        achievements.medal3 = true;
        showAchievementToast("Leyenda de Oro (¡Eres un maestro!)", "🥇");
        unlockedNew = true;
    }
    if (achievements.medal1) document.getElementById('medal-1')?.classList.add('active');
    if (achievements.medal2) document.getElementById('medal-2')?.classList.add('active');
    if (achievements.medal3) document.getElementById('medal-3')?.classList.add('active');
    if (unlockedNew) saveData();
}

// --- UTILIDADES ---
function decodeHTML(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function updateUI() {
    const highScoreEl = document.getElementById('high-score-display');
    const totalCurrencyEl = document.getElementById('total-currency-display');
    if(highScoreEl) highScoreEl.innerText = `Récord: ${highScore}`;
    if(totalCurrencyEl) totalCurrencyEl.innerText = `💰 ${totalPoints}`;

    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives-container');
    const comboEl = document.getElementById('combo-badge');
    const shieldInd = document.getElementById('shield-indicator');

    if (scoreEl) scoreEl.innerText = points;
    if (livesEl) livesEl.innerText = "❤️".repeat(Math.max(0, lives));
    
    if (comboEl) {
        const val = (1 + (streak * 0.1)).toFixed(1);
        comboEl.innerText = `x${val}`;
        streak >= 3 ? comboEl.classList.add('combo-active') : comboEl.classList.remove('combo-active');
    }

    if (shieldInd) {
        shieldInd.style.display = inventory.shield > 0 ? 'block' : 'none';
        shieldInd.innerText = `🛡️ x${inventory.shield}`;
    }
    checkAchievements();
    checkWheelCooldown();
}

// --- CONEXIÓN API ---
async function fetchAPIData(amount = 10, difficulty = 'medium') {
    const diffMap = { 'facil': 'easy', 'medio': 'medium', 'dificil': 'hard' };
    const apiDiff = diffMap[difficulty] || 'medium';
    const url = `https://opentdb.com/api.php?amount=${amount}&difficulty=${apiDiff}&type=multiple`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.results.map(item => {
            const options = [...item.incorrect_answers];
            const correctIdx = Math.floor(Math.random() * 4);
            options.splice(correctIdx, 0, item.correct_answer);
            return { q: decodeHTML(item.question), options: options.map(opt => decodeHTML(opt)), correct: correctIdx, difficulty: difficulty, mode: 'trivia', img: null };
        });
    } catch (e) { return null; }
}

// --- LÓGICA DE MODOS ---
function selectMode(m) { 
    selectedMode = m; 
    const titles = { 'logos': '🖼️ Solo Logos', 'trivia': '📚 Solo Trivia', 'mixto': '🔥 Modo Mixto' };
    const titleEl = document.getElementById('mode-title');
    if (titleEl) titleEl.innerText = titles[m] || 'Dificultad';
    showScreen('screen-diffs'); 
}

async function startSurvival() {
    isSurvival = true;
    points = 0; currentIndex = 0; lives = 3; streak = 0;
    showScreen('screen-game');
    quizSet = await fetchAPIData(10, 'facil');
    if (!quizSet) quizSet = questionsDB.sort(() => Math.random() - 0.5).slice(0, 10);
    renderQuestion();
}

async function selectDifficulty(d) {
    isSurvival = false;
    selectedDiff = d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    showScreen('screen-game');
    const apiQuestions = await fetchAPIData(10, selectedDiff);
    if (apiQuestions && selectedMode !== 'logos') {
        quizSet = apiQuestions;
    } else {
        quizSet = questionsDB.filter(q => {
            const qDiff = q.difficulty.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return (selectedMode === 'mixto' || q.mode === selectedMode) && qDiff === selectedDiff;
        });
    }
    quizSet.sort(() => Math.random() - 0.5);
    points = 0; currentIndex = 0; lives = 3; streak = 0;
    renderQuestion();
}

function renderQuestion() {
    const q = quizSet[currentIndex];
    updateUI();
    startTimer();

    const progress = document.getElementById('progress-bar');
    if(progress) progress.style.width = `${(currentIndex / quizSet.length) * 100}%`;
    document.getElementById('question-text').innerText = q.q;
    
    const logoArea = document.getElementById('logo-area');
    logoArea.innerHTML = q.img ? `<img src="${q.img}" alt="Logo">` : '';
    logoArea.style.display = q.img ? 'flex' : 'none';

    const optArea = document.getElementById('options-area');
    optArea.innerHTML = '';

    if (inventory.half > 0) {
        const hBtn = document.createElement('button');
        hBtn.className = 'opt-btn'; 
        hBtn.style.gridColumn = "span 2";
        hBtn.innerHTML = `🌓 Filtro 50/50 (${inventory.half})`;
        hBtn.onclick = () => {
            inventory.half--;
            const correctIdx = q.correct;
            const allOptionBtns = optArea.querySelectorAll('.opt-btn-choice');
            let indices = [0, 1, 2, 3].filter(idx => idx !== correctIdx).sort(() => Math.random() - 0.5);
            indices.slice(0, 2).forEach(idx => {
                allOptionBtns[idx].style.opacity = '0.2';
                allOptionBtns[idx].disabled = true;
            });
            hBtn.remove();
            saveData();
            updateUI();
        };
        optArea.appendChild(hBtn);
    }

    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn opt-btn-choice';
        btn.innerText = opt;
        btn.onclick = async () => {
            clearInterval(timerInterval);
            document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
            if (i === q.correct) {
                btn.classList.add('correct');
                streak++;
                const base = selectedDiff === 'facil' ? 50 : (selectedDiff === 'medio' ? 100 : 200);
                points += Math.round(base * (1 + streak * 0.1));
            } else {
                if (inventory.shield > 0) {
                    inventory.shield--;
                    btn.classList.add('wrong');
                } else {
                    btn.classList.add('wrong');
                    streak = 0;
                    lives--;
                }
                document.querySelectorAll('.opt-btn-choice')[q.correct].classList.add('correct');
            }
            saveData();
            updateUI();
            setTimeout(async () => {
                currentIndex++;
                if (isSurvival && currentIndex >= quizSet.length - 2) {
                    const more = await fetchAPIData(5, 'medio');
                    if (more) quizSet.push(...more);
                }
                if (lives > 0 && currentIndex < quizSet.length) renderQuestion();
                else finish();
            }, 1200);
        };
        optArea.appendChild(btn);
    });
}

function buyPowerUp(type) {
    const price = type === 'shield' ? 500 : 300;
    if (totalPoints >= price) {
        totalPoints -= price;
        inventory[type]++;
        saveData();
        updateUI();
    } else alert("Monedas insuficientes");
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active'); s.style.display = 'none'; });
    const target = document.getElementById(id);
    if (target) { target.classList.add('active'); target.style.display = 'flex'; }
    updateUI();
}

function saveData() {
    localStorage.setItem('totalPoints', totalPoints);
    localStorage.setItem('highScore', highScore);
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('achievements', JSON.stringify(achievements));
}

function finish() {
    clearInterval(timerInterval);
    totalPoints += points;
    if (points > highScore) { highScore = points; }
    saveData();
    const finalPointsEl = document.getElementById('final-points');
    if (finalPointsEl) finalPointsEl.innerText = points;
    showScreen('screen-end');
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
}

window.onload = () => { 
    updateUI(); 
};