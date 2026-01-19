// --- ESTADO ---
let selectedMode = '', selectedDiff = '', quizSet = [], currentIndex = 0;
let points = 0, streak = 0, lives = 3;

// --- PERSISTENCIA ---
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let totalPoints = parseInt(localStorage.getItem('totalPoints')) || 0;
let inventory = JSON.parse(localStorage.getItem('inventory')) || { shield: 0, half: 0 };

// Al cargar, aplicar modo oscuro si estaba guardado
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

function updateUI() {
    // Elementos de la cabecera global
    const highScoreEl = document.getElementById('high-score-display');
    const totalCurrencyEl = document.getElementById('total-currency-display');
    if(highScoreEl) highScoreEl.innerText = `Récord: ${highScore}`;
    if(totalCurrencyEl) totalCurrencyEl.innerText = `💰 ${totalPoints}`;

    // Elementos de la pantalla de juego
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
}

function selectMode(m) { 
    selectedMode = m; 
    // Animación visual al título de dificultad
    const titles = { 'logos': '🖼️ Solo Logos', 'trivia': '📚 Solo Trivia', 'mixto': '🔥 Modo Mixto' };
    document.getElementById('mode-title').innerText = titles[m] || 'Dificultad';
    showScreen('screen-diffs'); 
}

function selectDifficulty(d) {
    // Normalizamos la dificultad para evitar errores de tildes (facil vs fácil)
    selectedDiff = d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Filtrar preguntas
    quizSet = questionsDB.filter(q => {
        const qDiff = q.difficulty.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const modeMatch = (selectedMode === 'mixto' || q.mode === selectedMode);
        return modeMatch && qDiff === selectedDiff;
    });

    if (quizSet.length === 0) {
        alert("¡Ups! No hay preguntas disponibles para esta combinación.");
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
    updateUI();
    
    const progress = document.getElementById('progress-bar');
    if(progress) progress.style.width = `${(currentIndex / quizSet.length) * 100}%`;
    
    document.getElementById('question-text').innerText = q.q;
    
    const logoArea = document.getElementById('logo-area');
    logoArea.innerHTML = q.img ? `<img src="${q.img}" alt="Logo">` : '';
    logoArea.style.display = q.img ? 'flex' : 'none';

    const optArea = document.getElementById('options-area');
    optArea.innerHTML = '';

    // Lógica 50/50: Se muestra solo si el usuario tiene el item
    if (inventory.half > 0) {
        const hBtn = document.createElement('button');
        hBtn.className = 'opt-btn'; 
        hBtn.style.gridColumn = "span 2";
        hBtn.style.background = "var(--bg-input)";
        hBtn.innerHTML = `🌓 Usar 50/50 (Quedan: ${inventory.half})`;
        hBtn.onclick = () => {
            inventory.half--;
            const correctIdx = q.correct;
            const btns = document.querySelectorAll('.opt-btn:not(:first-child)'); // Excluye el botón 50/50
            let removed = 0;
            let indices = [0, 1, 2, 3].filter(idx => idx !== correctIdx);
            indices.sort(() => Math.random() - 0.5);
            
            const allOptionBtns = optArea.querySelectorAll('.opt-btn-choice');
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
        btn.onclick = () => {
            document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
            if (i === q.correct) {
                btn.classList.add('correct');
                streak++;
                // Puntos extra por dificultad
                const basePoints = selectedDiff === 'facil' ? 50 : (selectedDiff === 'medio' ? 100 : 200);
                points += Math.round(basePoints * (1 + streak * 0.1));
            } else {
                if (inventory.shield > 0) {
                    inventory.shield--;
                    btn.classList.add('wrong');
                    // Breve feedback visual del escudo
                    const shieldInd = document.getElementById('shield-indicator');
                    shieldInd.style.transform = "scale(2)";
                    setTimeout(() => shieldInd.style.transform = "scale(1)", 500);
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

function buyPowerUp(type) {
    const price = type === 'shield' ? 500 : 300;
    if (totalPoints >= price) {
        totalPoints -= price;
        inventory[type]++;
        saveData();
        updateUI();
        // Feedback visual en lugar de alert soso
        console.log(`Comprado: ${type}`);
    } else {
        alert("Necesitas más monedas 💰");
    }
}

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
    updateUI();
}

function saveData() {
    localStorage.setItem('totalPoints', totalPoints);
    localStorage.setItem('highScore', highScore);
    localStorage.setItem('inventory', JSON.stringify(inventory));
}

function finish() {
    totalPoints += points;
    if (points > highScore) { 
        highScore = points; 
        document.getElementById('new-record-msg').style.display = 'block'; 
    } else {
        document.getElementById('new-record-msg').style.display = 'none';
    }
    saveData();
    document.getElementById('final-points').innerText = points;
    showScreen('screen-end');
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
}

window.onload = () => {
    updateUI();
};