// --- VARIABLES DE ESTADO ---
let selectedMode = '';
let selectedDiff = '';
let quizSet = [];
let currentIndex = 0;
let points = 0;
let streak = 0; 
let lives = 3;

// --- PERSISTENCIA ---
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let totalPoints = parseInt(localStorage.getItem('totalPoints')) || 0;
let unlockedLogros = JSON.parse(localStorage.getItem('logros')) || [];
let inventory = JSON.parse(localStorage.getItem('inventory')) || { shield: 0, half: 0 };

// Inicialización
if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
window.onload = () => {
    document.getElementById('high-score-display').innerText = `Récord: ${highScore}`;
    document.getElementById('total-currency-display').innerText = `💰 ${totalPoints}`;
    unlockedLogros.forEach(l => {
        const medal = document.getElementById(`medal-${l.replace('_', '-')}`);
        if(medal) medal.classList.add('unlocked');
    });
};

// --- NAVEGACIÓN ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; 
    });
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
        target.style.display = 'flex'; 
    }
    if(id === 'screen-shop') updateShopUI();
}

// --- JUEGO ---
function selectMode(m) {
    selectedMode = m;
    showScreen('screen-diffs');
    document.getElementById('mode-title').innerText = `Modo ${m.toUpperCase()}`;
}

function selectDifficulty(d) {
    selectedDiff = d;
    quizSet = questionsDB.filter(q => {
        const modeMatch = (selectedMode === 'mixto') ? true : (q.mode === selectedMode);
        return modeMatch && (q.difficulty === selectedDiff);
    });

    if (quizSet.length === 0) {
        alert("No hay preguntas disponibles para esta selección.");
        showScreen('screen-modes');
        return;
    }

    quizSet.sort(() => Math.random() - 0.5);
    points = 0; currentIndex = 0; lives = 3; streak = 0;
    showScreen('screen-game');
    renderQuestion();
}

function renderQuestion() {
    const q = quizSet[currentIndex];
    
    // Actualización visual de estado inicial de la pregunta
    document.getElementById('score').innerText = points;
    document.getElementById('lives-container').innerText = "❤️".repeat(lives);
    updateComboUI(); 

    const sInd = document.getElementById('shield-indicator');
    sInd.style.display = inventory.shield > 0 ? 'inline' : 'none';
    sInd.innerText = `🛡️x${inventory.shield}`;

    document.getElementById('progress-bar').style.width = `${(currentIndex / quizSet.length) * 100}%`;
    document.getElementById('question-text').innerText = q.q;

    const logoArea = document.getElementById('logo-area');
    logoArea.innerHTML = q.img ? `<img src="${q.img}">` : '';
    logoArea.style.display = q.img ? 'flex' : 'none';

    const optArea = document.getElementById('options-area');
    optArea.innerHTML = '';
    
    if (inventory.half > 0) {
        const halfBtn = document.createElement('button');
        halfBtn.className = 'btn-choice';
        halfBtn.style.padding = "10px";
        halfBtn.innerText = `🌓 50/50 (${inventory.half})`;
        halfBtn.onclick = function() { useHalfHalf(this); };
        optArea.appendChild(halfBtn);
    }

    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerText = opt;
        btn.onclick = () => validate(i, btn);
        optArea.appendChild(btn);
    });
}

// --- Lógica de validación ---
function validate(selected, btn) {
    const q = quizSet[currentIndex];
    const app = document.getElementById('app');
    const buttons = document.querySelectorAll('.opt-btn');
    buttons.forEach(b => b.disabled = true);

    if (selected === q.correct) {
        btn.classList.add('correct');
        streak++;
        
        let basePoints = (selectedDiff === 'fácil' ? 50 : (selectedDiff === 'medio' ? 100 : 200));
        let multiplier = (1 + (streak * 0.1));
        let pointsEarned = Math.round(basePoints * multiplier);
        
        points += pointsEarned;
        
        // ACTUALIZACIÓN VISUAL INMEDIATA
        document.getElementById('score').innerText = points; 
        updateComboUI(); 
        showFloatingText(btn, `+${pointsEarned}`);
    } else {
        app.classList.add('shake-animation');
        setTimeout(() => app.classList.remove('shake-animation'), 400);
        
        if (inventory.shield > 0) {
            inventory.shield--;
            saveData();
            btn.classList.add('wrong');
            // Al usar escudo mantenemos el streak o lo bajamos según prefieras, 
            // aquí lo mantengo para no penalizar tanto al usar un ítem caro.
        } else {
            btn.classList.add('wrong');
            streak = 0;
            lives--;
            updateComboUI(); 
        }
        buttons[q.correct].classList.add('correct');
    }

    // Actualizar corazones visualmente
    document.getElementById('lives-container').innerText = "❤️".repeat(lives);

    setTimeout(() => {
        if (lives <= 0) {
            finish();
        } else {
            currentIndex++;
            if (currentIndex < quizSet.length) {
                renderQuestion();
            } else {
                finish();
            }
        }
    }, 1500);
}

// --- Multiplicador formateado ---
function updateComboUI() {
    const badge = document.getElementById('combo-badge');
    if(!badge) return;
    // Forzamos siempre un decimal (ej: 1.0, 1.1, 1.2)
    const val = (1 + (streak * 0.1)).toFixed(1); 
    badge.innerText = `x${val}`;
    
    if (streak >= 3) {
        badge.classList.add('combo-active');
    } else {
        badge.classList.remove('combo-active');
    }
}

// --- UTILIDADES ---
function useHalfHalf(btn) {
    if(inventory.half <= 0) return;
    inventory.half--;
    const correct = quizSet[currentIndex].correct;
    const opts = document.querySelectorAll('.opt-btn');
    let removed = 0;
    opts.forEach((o, i) => {
        if (i !== correct && removed < 2) {
            o.style.visibility = 'hidden';
            removed++;
        }
    });
    btn.style.display = 'none';
    saveData();
}

function buyPowerUp(type) {
    const price = type === 'shield' ? 500 : 300;
    if (totalPoints >= price) {
        totalPoints -= price;
        inventory[type]++;
        saveData();
        updateShopUI();
    } else {
        alert("Puntos insuficientes");
    }
}

function updateShopUI() {
    const shopPts = document.getElementById('total-points-shop');
    const headerPts = document.getElementById('total-currency-display');
    if(shopPts) shopPts.innerText = totalPoints;
    if(headerPts) headerPts.innerText = `💰 ${totalPoints}`;
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
}

function saveData() {
    localStorage.setItem('totalPoints', totalPoints);
    localStorage.setItem('highScore', highScore);
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('logros', JSON.stringify(unlockedLogros));
}

function finish() {
    totalPoints += points;
    if (points > highScore) {
        highScore = points;
        const msg = document.getElementById('new-record-msg');
        if(msg) msg.style.display = 'block';
    }
    saveData();
    const finalPts = document.getElementById('final-points');
    if(finalPts) finalPts.innerText = points;
    showScreen('screen-end');
}

function showFloatingText(target, text) {
    const el = document.createElement('div');
    el.className = 'floating-points';
    el.innerText = text;
    target.appendChild(el);
    setTimeout(() => el.remove(), 800);
}