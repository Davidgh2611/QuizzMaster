// --- ESTADO ---
let selectedMode = '', selectedDiff = '', quizSet = [], currentIndex = 0;
let points = 0, streak = 0, lives = 3;
let selectedSubMode = ''; 
let availableQuestionsPool = [];
 
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

// --- UTILIDADES ---
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    const btn = document.getElementById('dark-mode-toggle');
    if (btn) btn.innerText = isDark ? '☀️' : '🌙';
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function loadJSON(filename) {
    try {
        const response = await fetch(`${filename}.json`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error cargando ${filename}.json:`, error);
        return null;
    }
}

// --- GENERADORES DINÁMICOS ---
function generateLogoQuestionFromData(target, allItems) {
    let options = [target.name];
    let others = allItems.filter(i => i.name !== target.name);
    shuffleArray(others);
    options.push(...others.slice(0, 3).map(i => i.name));
    shuffleArray(options);

    return {
        q: "¿A qué empresa pertenece este logo?",
        img: `https://img.logo.dev/${target.domain}?token=pk_H_lv-2wxSXabPJG-tvL3lg`,
        options: options,
        correct: options.indexOf(target.name),
        mode: "logos"
    };
}

function generateFlagQuestionFromData(target, allItems) {
    let options = [target.n];
    let others = allItems.filter(i => i.n !== target.n);
    shuffleArray(others);
    options.push(...others.slice(0, 3).map(i => i.n));
    shuffleArray(options);

    return {
        q: "¿A qué país pertenece esta bandera?",
        img: `https://flagcdn.com/w320/${target.c.toLowerCase()}.png`,
        options: options,
        correct: options.indexOf(target.n),
        mode: "paises"
    };
}

// --- LÓGICA DE MODOS ---
function selectMode(m) { 
    selectedMode = m; 
    const titles = { 'logos': '🖼️ Solo Logos', 'trivia': '📚 Solo Trivia', 'mixto': '🔥 Modo Mixto', 'paises': '🌍 Solo Países' };
    const titleEl = document.getElementById('mode-title');
    if(titleEl) titleEl.innerText = titles[m] || 'Dificultad';

    if(m === 'logos' || m === 'paises' || m === 'trivia') {
        renderSubModeMenu(m);
        showScreen('screen-submodes');
    } else {
        showScreen('screen-diffs');
    }
}

function renderSubModeMenu(mode) {
    const container = document.getElementById('submode-options-container');
    const title = document.getElementById('submode-title');
    if(!container) return;
    
    container.innerHTML = '';
    container.className = 'submode-grid'; // Aplicamos la parrilla 2-2-1
    
    let options = [];
    const icons = {
        'tecnologia': '💻', 'vehiculos': '🚗', 'comida': '🍔', 'ropa': '👕', 'todos': '✨',
        'europa': '🇪🇺', 'america': '🌎', 'asia': '⛩️', 'africa': '🦁', 'mundial': '🌐',
        'historia': '📜', 'ciencia': '🧪', 'entretenimiento': '🎬', 'deportes': '⚽'
    };

    // Mapeo de clases para degradados CSS
    const colorClasses = {
        'tecnologia': 'grad-tech', 'vehiculos': 'grad-cars', 'comida': 'grad-food', 'ropa': 'grad-fashion',
        'europa': 'grad-euro', 'america': 'grad-amer', 'asia': 'grad-asia', 'africa': 'grad-afri',
        'historia': 'grad-hist', 'ciencia': 'grad-cienc', 'entretenimiento': 'grad-ent', 'deportes': 'grad-dep',
        'todos': 'grad-all', 'mundial': 'grad-all'
    };

    if(mode === 'logos') {
        title.innerText = 'Categorías de Logos';
        options = ['tecnologia', 'vehiculos', 'comida', 'ropa', 'todos'];
    } else if(mode === 'paises') {
        title.innerText = 'Selecciona Continente';
        options = ['europa', 'america', 'asia', 'africa', 'mundial'];
    } else if(mode === 'trivia') {
        title.innerText = 'Cultura General';
        options = ['historia', 'ciencia', 'entretenimiento', 'deportes', 'todos'];
    }

    options.forEach(opt => {
        const btn = document.createElement('button');
        const colorClass = colorClasses[opt] || 'grad-all';
        btn.className = `btn-category ${colorClass}`;
        
        const icon = icons[opt] || '❓';
        btn.innerHTML = `
            <span class="category-icon">${icon}</span>
            <span class="category-name">${opt.toUpperCase()}</span>
        `;
        
        btn.onclick = () => { selectedSubMode = opt; showScreen('screen-diffs'); };
        container.appendChild(btn);
    });
}

async function selectDifficulty(d) {
    selectedDiff = d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    showScreen('screen-game');
    document.getElementById('question-text').innerText = "Filtrando desafíos...";

    let rawData = null;
    let tempPool = [];
    let selectedForMatch = [];

    if (selectedMode === 'logos') {
        rawData = await loadJSON('logos');
        tempPool = (selectedSubMode === 'todos') ? Object.values(rawData).flat() : (rawData[selectedSubMode] || []);
    } 
    else if (selectedMode === 'paises') {
        rawData = await loadJSON('paises');
        tempPool = (selectedSubMode === 'mundial') ? Object.values(rawData).flat() : (rawData[selectedSubMode] || []);
    } 
    else if (selectedMode === 'trivia') {
        rawData = await loadJSON('trivia');
        tempPool = (selectedSubMode === 'todos') ? Object.values(rawData).flat() : (rawData[selectedSubMode] || []);
    }
    else if (selectedMode === 'mixto') {
        const [dbL, dbP, dbT] = await Promise.all([loadJSON('logos'), loadJSON('paises'), loadJSON('trivia')]);
        const filterDiff = (list) => list.filter(item => item.d === selectedDiff || !item.d);
        const pL = filterDiff(Object.values(dbL).flat());
        const pP = filterDiff(Object.values(dbP).flat());
        const pT = filterDiff(Object.values(dbT).flat());

        for(let i=0; i<4; i++) selectedForMatch.push(generateLogoQuestionFromData(pL[Math.floor(Math.random()*pL.length)], pL));
        for(let i=0; i<3; i++) selectedForMatch.push(generateFlagQuestionFromData(pP[Math.floor(Math.random()*pP.length)], pP));
        for(let i=0; i<3; i++) selectedForMatch.push(pT[Math.floor(Math.random()*pT.length)]);
        quizSet = shuffleArray(selectedForMatch);
    }

    if (selectedMode !== 'mixto') {
        let filteredPool = tempPool.filter(item => item.d === selectedDiff);
        if (filteredPool.length < 5) filteredPool = tempPool; 

        availableQuestionsPool = shuffleArray([...filteredPool]);
        const picked = availableQuestionsPool.splice(0, 10);
        
        quizSet = picked.map(item => {
            if (selectedMode === 'logos') return generateLogoQuestionFromData(item, tempPool);
            if (selectedMode === 'paises') return generateFlagQuestionFromData(item, tempPool);
            return item; 
        });
    }

    points = 0; currentIndex = 0; lives = 3; streak = 0;
    renderQuestion();
}

function renderQuestion() {
    const q = quizSet[currentIndex];
    updateUI();
    startTimer();
    
    const progressFill = document.getElementById('level-progress-fill');
    if(progressFill) progressFill.style.width = `${(currentIndex / quizSet.length) * 100}%`;

    document.getElementById('question-text').innerText = q.q;
    const logoArea = document.getElementById('logo-area');
    logoArea.innerHTML = ''; 

    if (q.img) {
        logoArea.style.display = 'flex';
        const img = document.createElement('img');
        img.src = q.img;
        img.style.cssText = "width:100%; height:100%; object-fit:contain; background:white; border-radius:12px;";
        img.onerror = () => { logoArea.innerHTML = `<div class="fallback-logo">${q.options[q.correct].charAt(0)}</div>`; };
        logoArea.appendChild(img);
    } else {
        logoArea.style.display = 'none';
    }

    const optArea = document.getElementById('options-area');
    optArea.innerHTML = '';

    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn opt-btn-choice';
        btn.innerText = opt;
        btn.onclick = () => {
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
            setTimeout(() => {
                currentIndex++;
                if (lives > 0 && currentIndex < quizSet.length) renderQuestion();
                else finish();
            }, 1200);
        };
        optArea.appendChild(btn);
    });
}

function startTimer() {
    clearInterval(timerInterval);
    if (selectedDiff === 'facil') timeLeft = 25;
    else if (selectedDiff === 'medio') timeLeft = 15;
    else if (selectedDiff === 'dificil') timeLeft = 8;
    else timeLeft = 15;

    const timerEl = document.getElementById('timer-display');
    if (timerEl) {
        timerEl.innerText = `⏱️ ${timeLeft}s`;
        timerEl.classList.remove('timer-low');
    }

    timerInterval = setInterval(() => {
        timeLeft--;
        if (timerEl) {
            timerEl.innerText = `⏱️ ${timeLeft}s`;
            if (timeLeft <= 4) timerEl.classList.add('timer-low');
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

function updateUI() {
    if(document.getElementById('high-score-display')) document.getElementById('high-score-display').innerText = `Récord: ${highScore}`;
    if(document.getElementById('total-currency-display')) document.getElementById('total-currency-display').innerText = `💰 ${totalPoints}`;
    if(document.getElementById('score')) document.getElementById('score').innerText = points;
    if(document.getElementById('lives-container')) document.getElementById('lives-container').innerText = "❤️".repeat(Math.max(0, lives));
    
    const comboEl = document.getElementById('combo-badge');
    if (comboEl) {
        const val = (1 + (streak * 0.1)).toFixed(1);
        const oldVal = comboEl.innerText;
        comboEl.innerText = `x${val}`;
        if (streak >= 3) {
            comboEl.classList.add('combo-active');
            if (`x${val}` !== oldVal) { // Animación de "Pop"
                comboEl.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.3)' },
                    { transform: 'scale(1)' }
                ], { duration: 200 });
            }
        } else {
            comboEl.classList.remove('combo-active');
        }
    }

    const shieldInd = document.getElementById('shield-indicator');
    if (shieldInd) {
        shieldInd.style.display = inventory.shield > 0 ? 'block' : 'none';
        shieldInd.innerText = `🛡️ x${inventory.shield}`;
    }
}

// --- FUNCIONES DE APOYO (RULETA, LOGROS, UI) ---
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
    if (now - lastSpin < 86400000) { alert("¡Vuelve mañana!"); return; }

    const wheel = document.getElementById('main-wheel');
    const randomDeg = Math.floor(Math.random() * 360) + 1800; 
    wheel.style.transform = `rotate(${randomDeg}deg)`;
    document.getElementById('spin-btn').disabled = true;

    setTimeout(() => {
        totalPoints += 500; // Simplificado para el ejemplo
        lastSpin = Date.now();
        showAchievementToast(`¡Ganaste 💰 500!`, "🎰");
        saveData();
        updateUI();
        setTimeout(closeWheelModal, 2000);
    }, 4000);
}

function checkWheelCooldown() {
    const btn = document.getElementById('spin-btn');
    if(!btn) return;
    const remaining = 86400000 - (Date.now() - lastSpin);
    btn.disabled = remaining > 0;
}

function showAchievementToast(title, icon) {
    const toast = document.createElement('div');
    toast.className = 'achievement-notification';
    toast.innerHTML = `<div class="achievement-icon">${icon}</div><div class="achievement-text"><b>¡Ganaste!</b><span>${title}</span></div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 4000);
}

function checkAchievements() {
    if (!achievements.medal1 && totalPoints >= 1000) { achievements.medal1 = true; showAchievementToast("Novato de Bronce", "🥉"); saveData(); }
}

function updateUI() {
    if(document.getElementById('high-score-display')) document.getElementById('high-score-display').innerText = `Récord: ${highScore}`;
    if(document.getElementById('total-currency-display')) document.getElementById('total-currency-display').innerText = `💰 ${totalPoints}`;
    if(document.getElementById('score')) document.getElementById('score').innerText = points;
    if(document.getElementById('lives-container')) document.getElementById('lives-container').innerText = "❤️".repeat(Math.max(0, lives));
    
    const shieldInd = document.getElementById('shield-indicator');
    if (shieldInd) {
        shieldInd.style.display = inventory.shield > 0 ? 'block' : 'none';
        shieldInd.innerText = `🛡️ x${inventory.shield}`;
    }
    checkAchievements();
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
    localStorage.setItem('lastSpin', lastSpin);
}

function finish() {
    clearInterval(timerInterval);
    totalPoints += points;
    if (points > highScore) highScore = points;
    saveData();
    if(document.getElementById('final-points')) document.getElementById('final-points').innerText = points;
    showScreen('screen-end');
}

window.onload = () => { 
    updateUI();
};