// --- ESTADO ---
let selectedMode = '', selectedDiff = '', quizSet = [], currentIndex = 0;
let points = 0, streak = 0, lives = 3;

// VARIABLES DEL CRONÓMETRO
let timerInterval;
let timeLeft = 15;

// --- PERSISTENCIA ---
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let totalPoints = parseInt(localStorage.getItem('totalPoints')) || 0;
let inventory = JSON.parse(localStorage.getItem('inventory')) || { shield: 0, half: 0 };
let achievements = JSON.parse(localStorage.getItem('achievements')) || { medal1: false, medal2: false, medal3: false };
let lastSpin = localStorage.getItem('lastSpin') || 0;

// Inicialización de Modo Oscuro al cargar
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// --- FUNCIÓN MODO OSCURO (CORREGIDA) ---
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    const btn = document.getElementById('dark-mode-toggle');
    if (btn) btn.innerText = isDark ? '☀️' : '🌙';
}

// --- FUNCIÓN DE TRADUCCIÓN ---
async function translateText(text) {
    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`);
        const data = await res.json();
        return data.responseData.translatedText;
    } catch (error) {
        console.error("Error traduciendo:", error);
        return text; 
    }
}

// --- GENERADORES DE PREGUNTAS CON IMAGEN ---
function generateLogoQuestion() {
    const brands = [
        { name: "Google", domain: "google.com" }, { name: "Apple", domain: "apple.com" },
        { name: "Amazon", domain: "amazon.com" }, { name: "Microsoft", domain: "microsoft.com" },
        { name: "Tesla", domain: "tesla.com" }, { name: "Netflix", domain: "netflix.com" },
        { name: "Nike", domain: "nike.com" }, { name: "Coca-Cola", domain: "cocacola.com" },
        { name: "Starbucks", domain: "starbucks.com" }, { name: "McDonald's", domain: "mcdonalds.com" }
    ];
    const target = brands[Math.floor(Math.random() * brands.length)];
    let options = [target.name];
    while(options.length < 4) {
        let rand = brands[Math.floor(Math.random() * brands.length)].name;
        if(!options.includes(rand)) options.push(rand);
    }
    options.sort(() => Math.random() - 0.5);
    return {
        q: "¿A qué empresa pertenece este logo?",
        img: `https://logo.clearbit.com/${target.domain}`,
        options: options,
        correct: options.indexOf(target.name),
        difficulty: "medio",
        mode: "logos"
    };
}

// Función auxiliar para obtener países sin repetición para una sesión
function getShuffledCountries() {
    const countries = [
        { n: "España", c: "es" }, { n: "México", c: "mx" }, { n: "Argentina", c: "ar" },
        { n: "Francia", c: "fr" }, { n: "Japón", c: "jp" }, { n: "Brasil", c: "br" },
        { n: "Italia", c: "it" }, { n: "Estados Unidos", c: "us" },
        { n: "Alemania", c: "de" }, { n: "Reino Unido", c: "gb" },
        { n: "Canadá", c: "ca" }, { n: "Australia", c: "au" }, { n: "China", c: "cn" },
        { n: "Egipto", c: "eg" }, { n: "Rusia", c: "ru" }, { n: "India", c: "in" }
    ];
    return countries.sort(() => Math.random() - 0.5);
}

function generateFlagQuestion(shuffledList, index) {
    const target = shuffledList[index];
    let options = [target.n];
    while(options.length < 4) {
        let rand = shuffledList[Math.floor(Math.random() * shuffledList.length)].n;
        if(!options.includes(rand)) options.push(rand);
    }
    options.sort(() => Math.random() - 0.5);
    return {
        q: "¿A qué país pertenece esta bandera?",
        img: `https://flagcdn.com/w320/${target.c}.png`,
        options: options,
        correct: options.indexOf(target.n),
        difficulty: "facil",
        mode: "paises"
    };
}

// --- LÓGICA DE LA RULETA DIARIA ---
function openWheelModal() {
    const modal = document.getElementById('wheel-modal');
    if (modal) { modal.style.display = 'flex'; checkWheelCooldown(); }
}

function closeWheelModal() {
    const modal = document.getElementById('wheel-modal');
    if (modal) modal.style.display = 'none';
}

function spinWheel() {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    if (now - lastSpin < cooldown) { alert("¡La ruleta aún está recargándose!"); return; }

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
        setTimeout(closeWheelModal, 2000);
    }, 4000);
}

function checkWheelCooldown() {
    const btn = document.getElementById('spin-btn');
    const timer = document.getElementById('wheel-timer');
    const statusText = document.getElementById('wheel-status-text'); 
    if(!btn || !timer) return;
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const remaining = cooldown - (now - lastSpin);
    if (remaining > 0) {
        btn.disabled = true;
        const hours = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        timer.innerText = `Disponible en: ${hours}h ${mins}m`;
        if(statusText) statusText.innerText = `Disponible en ${hours}h ${mins}m`;
    } else {
        btn.disabled = false;
        timer.innerText = "¡Lista para girar!";
        if(statusText) statusText.innerText = "¡Gira ahora GRATIS!";
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
        if (timeLeft <= 0) { clearInterval(timerInterval); handleTimeout(); }
    }, 1000);
}

function handleTimeout() {
    document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
    const q = quizSet[currentIndex];
    const correctBtn = document.querySelectorAll('.opt-btn-choice')[q.correct];
    if (correctBtn) correctBtn.classList.add('correct');
    if (inventory.shield > 0) inventory.shield--;
    else { streak = 0; lives--; }
    saveData();
    updateUI();
    setTimeout(() => {
        currentIndex++;
        if (lives > 0 && currentIndex < quizSet.length) renderQuestion();
        else finish();
    }, 1200);
}

// --- NOTIFICACIONES Y LOGROS ---
function showAchievementToast(title, icon) {
    const toast = document.createElement('div');
    toast.className = 'achievement-notification';
    toast.innerHTML = `<div class="achievement-icon">${icon}</div><div class="achievement-text"><b>¡Notificación!</b><span>${title}</span></div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 4000);
}

function checkAchievements() {
    let unlockedNew = false;
    if (!achievements.medal1 && totalPoints >= 1000) { achievements.medal1 = true; showAchievementToast("Novato de Bronce", "🥉"); unlockedNew = true; }
    if (!achievements.medal2 && totalPoints >= 5000) { achievements.medal2 = true; showAchievementToast("Experto de Plata", "🥈"); unlockedNew = true; }
    if (!achievements.medal3 && (totalPoints >= 10000 || highScore >= 2000)) { achievements.medal3 = true; showAchievementToast("Leyenda de Oro", "🥇"); unlockedNew = true; }
    if (unlockedNew) saveData();
}

// --- UTILIDADES ---
function decodeHTML(html) { const txt = document.createElement("textarea"); txt.innerHTML = html; return txt.value; }

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

    // Gestionar visibilidad del botón de inicio en la cabecera
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
        const isMainMenu = document.getElementById('screen-modes').classList.contains('active');
        homeBtn.style.display = isMainMenu ? 'none' : 'flex';
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
        return await Promise.all(data.results.map(async (item) => {
            const qT = await translateText(decodeHTML(item.question));
            const cT = await translateText(decodeHTML(item.correct_answer));
            const iT = await Promise.all(item.incorrect_answers.map(async i => await translateText(decodeHTML(i))));
            const options = [...iT];
            const correctIdx = Math.floor(Math.random() * 4);
            options.splice(correctIdx, 0, cT);
            return { q: qT, options: options, correct: correctIdx, difficulty: difficulty, mode: 'trivia', img: null };
        }));
    } catch (e) { return null; }
}

// --- LÓGICA DE MODOS ---
function selectMode(m) { 
    selectedMode = m; 
    const titles = { 'logos': '🖼️ Solo Logos', 'trivia': '📚 Solo Trivia', 'mixto': '🔥 Modo Mixto', 'paises': '🌍 Solo Países' };
    const titleEl = document.getElementById('mode-title');
    if(titleEl) titleEl.innerText = titles[m] || 'Dificultad';
    showScreen('screen-diffs'); 
}

async function selectDifficulty(d) {
    selectedDiff = d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    showScreen('screen-game');
    document.getElementById('question-text').innerText = "Cargando preguntas...";

    if (selectedMode === 'logos') {
        quizSet = Array.from({length: 10}, () => generateLogoQuestion());
    } else if (selectedMode === 'paises') {
        const shuffled = getShuffledCountries();
        quizSet = Array.from({length: Math.min(10, shuffled.length)}, (_, i) => generateFlagQuestion(shuffled, i));
    } else {
        const apiQuestions = await fetchAPIData(selectedMode === 'mixto' ? 7 : 10, selectedDiff);
        quizSet = apiQuestions || [];
        if (selectedMode === 'mixto') {
            const shuffled = getShuffledCountries();
            quizSet.push(generateFlagQuestion(shuffled, 0), generateFlagQuestion(shuffled, 1), generateLogoQuestion());
        }
    }
    quizSet.sort(() => Math.random() - 0.5);
    points = 0; currentIndex = 0; lives = 3; streak = 0;
    renderQuestion();
}

function renderQuestion() {
    const q = quizSet[currentIndex];
    updateUI();
    startTimer();
    
    // Actualizar barra de progreso (Basado en el progreso del nivel actual)
    const progressFill = document.getElementById('level-progress-fill');
    if(progressFill) {
        const percentage = (currentIndex / quizSet.length) * 100;
        progressFill.style.width = `${percentage}%`;
    }

    document.getElementById('question-text').innerText = q.q;
    
    const logoArea = document.getElementById('logo-area');
    logoArea.innerHTML = q.img ? `<img src="${q.img}" alt="Pregunta" style="max-width: 150px; max-height: 120px; border-radius: 8px; display: block; margin: 0 auto; background: white; padding: 10px;">` : '';
    logoArea.style.display = q.img ? 'block' : 'none';

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
                if (inventory.shield > 0) { inventory.shield--; btn.classList.add('wrong'); } 
                else { btn.classList.add('wrong'); streak = 0; lives--; }
                document.querySelectorAll('.opt-btn-choice')[q.correct].classList.add('correct');
            }
            saveData();
            updateUI();
            setTimeout(() => {
                currentIndex++;
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
    
    // Al finalizar, la barra se completa al 100%
    const progressFill = document.getElementById('level-progress-fill');
    if(progressFill) progressFill.style.width = '100%';

    totalPoints += points;
    if (points > highScore) { highScore = points; }
    saveData();
    const finalPointsEl = document.getElementById('final-points');
    if(finalPointsEl) finalPointsEl.innerText = points;
    showScreen('screen-end');
}

window.onload = () => { 
    updateUI();
    const btn = document.getElementById('dark-mode-toggle');
    if (btn) btn.innerText = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
};