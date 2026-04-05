let words = [], activeStage = 1, activeIndex = 0, activeList = [], canProceed = false;
let examScores = [], dailyWordsCount = 0, dailyGoal = 20;
let selectedEn = null, selectedHy = null;
let smartMode = null; 

let sessionMinutes = 0, sessionSeconds = 0;
let reminderMinute = 10; 
let dailyTimeData = {}; 

let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const threshold = 70;
    if (touchStartX - touchEndX > threshold) {
        triggerNextAction();
    }
}

function triggerNextAction() {
    const nextBtn = document.getElementById('next-btn');
    const nextBatchBtn = document.getElementById('next-batch-btn');
    const exBtn = document.getElementById('ex-btn');

    if (nextBtn && !nextBtn.classList.contains('hidden')) {
        nextBtn.click();
    } else if (nextBatchBtn && !nextBatchBtn.classList.contains('hidden')) {
        nextBatchBtn.click();
    } else if (exBtn && !exBtn.classList.contains('hidden')) {
        exBtn.click();
    }
}

async function initApp() {
    try {
        const response = await fetch('./vocabulary.json');
        const data = await response.json();
        words = data.map((item, index) => ({
            id: item.id || index, en: item.word, hy: item.translation,
            stageScores: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0}, 
            stagesCompleted: [], isInstant: false, isSeen: false,
            errorCount: 0, learnedDate: null, repLevel: 0, nextRepDate: null
        }));
        loadProgress(); 
        updateStats();
        startTimer();
        
        const wordCountEl = document.getElementById('home-word-count');
        if(wordCountEl) wordCountEl.innerText = `${words.length} բառ`;
        
        const deleteInput = document.getElementById('delete-confirm-input');
        if(deleteInput) {
            deleteInput.addEventListener('input', function(e) {
                const btn = document.getElementById('real-delete-btn');
                const isMatch = e.target.value.toUpperCase() === 'DELETE';
                btn.disabled = !isMatch;
                btn.className = isMatch ? 'flex-1 p-4 bg-rose-600 text-white rounded-2xl font-bold' : 'flex-1 p-4 bg-emerald-800 text-emerald-500 rounded-2xl font-bold';
            });
        }
    } catch (e) { console.error("Error loading app:", e); }
}

function startTimer() {
    setInterval(() => {
        sessionSeconds++;
        if(sessionSeconds >= 60) {
            sessionSeconds = 0;
            sessionMinutes++;
            const today = new Date().toISOString().split('T')[0];
            dailyTimeData[today] = (dailyTimeData[today] || 0) + 1;
            if(dailyTimeData[today] > 600) dailyTimeData[today] = 600; 
            
            if(sessionMinutes === reminderMinute) {
                alert(`Դուք արդեն կայքում եք ${sessionMinutes} րոպե։`);
            }
            saveProgress();
        }
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const m = sessionMinutes < 10 ? '0' + sessionMinutes : sessionMinutes;
    const s = sessionSeconds < 10 ? '0' + sessionSeconds : sessionSeconds;
    const display = document.getElementById('session-timer-display');
    if(display) display.innerText = `${m}:${s}`;
}

function loadProgress() {
    const saved = localStorage.getItem('usanim_v3_data');
    if(saved) {
        const p = JSON.parse(saved);
        words.forEach(w => { 
            if(p.words && p.words[w.id]) {
                Object.assign(w, p.words[w.id]);
                if(!w.stageScores) w.stageScores = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0};
            }
        });
        examScores = p.examScores || [];
        dailyWordsCount = p.dailyWordsCount || 0;
        dailyGoal = p.dailyGoal || 20;
        dailyTimeData = p.dailyTimeData || {};
        reminderMinute = p.reminderMinute || 10;
    }
}

function saveProgress() {
    const storage = { words: {}, examScores, dailyWordsCount, dailyGoal, dailyTimeData, reminderMinute };
    words.forEach(w => {
        storage.words[w.id] = { 
            stageScores: w.stageScores, stagesCompleted: w.stagesCompleted, isInstant: w.isInstant, 
            isSeen: w.isSeen, errorCount: w.errorCount, learnedDate: w.learnedDate,
            repLevel: w.repLevel, nextRepDate: w.nextRepDate
        };
    });
    localStorage.setItem('usanim_v3_data', JSON.stringify(storage));
}

function isWordLearned(w) {
    if (w.isInstant) return true;
    return [2, 3, 4, 5, 6].every(s => w.stagesCompleted.includes(s));
}

function setNextRep(word) {
    const intervals = [7, 30, 90];
    const days = intervals[word.repLevel] || 90;
    let date = new Date();
    date.setDate(date.getDate() + days);
    word.nextRepDate = date.toISOString().split('T')[0];
    word.repLevel++;
}

function updateStats() {
    const learned = words.filter(w => isWordLearned(w)).length;
    const pct = Math.round((learned / words.length) * 100);
    const pctEl = document.getElementById('home-progress-pct');
    const bgProgEl = document.getElementById('home-bg-progress');
    const progBarEl = document.getElementById('progress-bar');
    if(pctEl) pctEl.innerText = pct + "%";
    if(bgProgEl) bgProgEl.style.width = pct + "%";
    if(progBarEl) progBarEl.style.width = pct + "%";
    const diffWords = words.filter(w => w.errorCount >= 5 && !isWordLearned(w));
    const today = new Date().toISOString().split('T')[0];
    const repWords = words.filter(w => isWordLearned(w) && w.nextRepDate && w.nextRepDate <= today);
    const diffCountEl = document.getElementById('diff-count');
    const repCountEl = document.getElementById('rep-count');
    if(diffCountEl) diffCountEl.innerText = diffWords.length;
    if(repCountEl) repCountEl.innerText = repWords.length;
}

function getStars(word) {
    const stages = [2, 3, 4, 5, 6];
    let html = '<div class="flex flex-col items-center mb-2"><div class="flex justify-center gap-1 mb-1">';
    stages.forEach(s => {
        const isCompleted = word.stagesCompleted.includes(s);
        const isActive = (activeStage === s);
        let colorClass = isCompleted ? 'text-yellow-400' : 'text-emerald-800';
        if (isActive && !isCompleted) colorClass = 'text-emerald-500';
        const currentScore = word.stageScores[s] || 0;
        html += `<div class="star-box"><span class="star-icon ${colorClass}">★</span>${isActive && !isCompleted ? `<span class="star-text !text-white">${currentScore}</span>` : ''}${isCompleted ? `<span class="star-text">✓</span>` : ''}</div>`;
    });
    html += '</div>';
    if(activeStage === 7) {
        const score7 = word.stageScores[7] || 0;
        html += `<div class="flex flex-col items-center mt-1"><div class="star-box"><span class="star-icon text-emerald-400">★</span><span class="star-text !text-white !text-[12px]">${score7}</span></div></div>`;
    }
    return html + '</div>';
}

function cleanText(text) { return text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""); }

function goToAppMenu() { 
    document.getElementById('welcome-screen').classList.add('hidden'); 
    document.getElementById('app-content').classList.remove('hidden'); 
    updateStats(); 
}

function goToWelcome() { 
    document.getElementById('app-content').classList.add('hidden'); 
    document.getElementById('welcome-screen').classList.remove('hidden'); 
    updateStats(); 
}

function openSmartMenu() {
    updateStats();
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('smart-menu-view').classList.remove('hidden');
}

function openSmartStage(mode) {
    smartMode = mode; activeStage = 7; activeIndex = 0;
    document.getElementById('smart-menu-view').classList.add('hidden');
    document.getElementById('view').classList.remove('hidden');
    document.getElementById('view-title').innerText = mode === 'difficult' ? 'ԴԺՎԱՐ ԲԱՌԵՐ' : 'ԿՐԿՆՈՒԹՅՈՒՆ';
    initStageLogic();
}

function openStage(num) {
    activeStage = num; activeIndex = 0; smartMode = null;
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('view').classList.remove('hidden');
    let stageTitle = `Փուլ ${num}`;
    if (num === 4) stageTitle = "Գրել անգլերեն";
    else if (num === 5) stageTitle = "Գրել հայերեն";
    else if (num === 6) stageTitle = "Բառի ուղղագրություն";
    document.getElementById('view-title').innerText = stageTitle;
    initStageLogic();
}

function initStageLogic() {
    const container = document.getElementById('content');
    container.innerHTML = "";
    if (activeStage === 7) {
        if(smartMode === 'difficult') activeList = words.filter(w => w.errorCount >= 5 && !isWordLearned(w)).slice(0, 10);
        else { const today = new Date().toISOString().split('T')[0]; activeList = words.filter(w => isWordLearned(w) && w.nextRepDate && w.nextRepDate <= today).slice(0, 10); }
        activeList.forEach(w => w.stageScores[7] = 0);
    } else if (activeStage === 1) activeList = words.filter(w => !isWordLearned(w) && !w.stagesCompleted.includes(1)).slice(0, 10);
    else activeList = words.filter(w => !isWordLearned(w) && !w.stagesCompleted.includes(activeStage)).slice(0, 10);
    if (activeList.length === 0) return renderFinish();
    if (activeStage === 1) renderStage1();
    else if (activeStage === 3) renderStage3();
    else renderGenericStage();
}

function renderStage1() {
    const word = activeList[activeIndex];
    if (!word) return renderFinish();
    document.getElementById('content').innerHTML = `
        <div class="w-full bg-emerald-800 rounded-[2.5rem] p-6 text-center shadow-xl mb-6 border-b-8 border-emerald-500 min-h-[180px] flex flex-col justify-center overflow-hidden">
            <h2 class="text-3xl font-black text-white mb-4 italic break-words" onclick="speak('${word.en}')">${word.en}</h2>
            <h3 onclick="this.classList.toggle('revealed')" class="text-xl font-bold text-emerald-600 blur-text italic break-words">${word.hy}</h3>
        </div>
        <div class="grid grid-cols-2 gap-4 w-full">
            <button onclick="handleStage1(true)" class="btn-primary">ԳԻՏԵՄ</button>
            <button onclick="handleStage1(false)" class="btn-primary !bg-emerald-900 border border-emerald-700">ՉԳԻՏԵՄ</button>
        </div>
        <div class="flex justify-center w-full"><button id="next-btn" onclick="skipStage1()" class="btn-next-step">ՀԱՋՈՐԴԸ</button></div>`;
    speak(word.en === "I" ? "eye" : word.en);
}

function skipStage1() {
    activeIndex++;
    if (activeIndex >= activeList.length) renderFinish(); else renderStage1();
}

function handleStage1(known) {
    const w = activeList[activeIndex];
    w.isSeen = true;
    if(known) { 
        if (!w.stagesCompleted.includes(1)) w.stagesCompleted.push(1);
        w.isInstant = true; 
        w.learnedDate = new Date().toISOString().split('T')[0]; 
        setNextRep(w); 
        dailyWordsCount++; 
    } else {
        // Եթե սեղմվել է "ՉԳԻՏԵՄ", հեռացնում ենք Stage 1-ի ավարտված լինելու նշումը, որպեսզի կրկնելիս նորից հայտնվի
        w.stagesCompleted = w.stagesCompleted.filter(s => s !== 1);
        w.isInstant = false;
    }
    saveProgress();
    activeIndex++; 
    if (activeIndex >= activeList.length) renderFinish(); else renderStage1();
}

function restartStage1() {
    if(confirm("Ցանկանու՞մ եք կրկնել չսովորած բառերը։")) {
        activeIndex = 0;
        // Կրկին կանչում ենք տրամաբանությունը, որը կֆիլտրի միայն այն բառերը, որոնց Stage 1-ը completed չէ
        initStageLogic();
    }
}

function renderStage3() {
    const batch = activeList.slice(0, 5);
    document.getElementById('content').innerHTML = `
        <div class="grid grid-cols-2 gap-3 w-full items-start overflow-y-auto max-h-[70vh]"><div class="space-y-3" id="en-list"></div><div class="space-y-3" id="hy-list"></div></div>
        <div class="flex justify-center w-full"><button id="next-batch-btn" onclick="initStageLogic()" class="btn-next-step">ՀԱՋՈՐԴԸ</button></div>
    `;
    const leftSide = [...batch].sort(() => Math.random() - 0.5);
    const rightSide = [...batch].sort(() => Math.random() - 0.5);
    leftSide.forEach(w => {
        const el = document.createElement('div'); el.className = 'match-item'; el.innerHTML = `<span class="break-words px-1">${w.en}</span>`;
        el.onclick = () => selectMatch(el, 'en', w); document.getElementById('en-list').appendChild(el);
    });
    rightSide.forEach(w => {
        const el = document.createElement('div'); el.className = 'match-item'; el.innerHTML = `<span class="break-words px-1">${w.hy}</span>`;
        el.onclick = () => selectMatch(el, 'hy', w); document.getElementById('hy-list').appendChild(el);
    });
}

function selectMatch(el, type, word) {
    if(el.classList.contains('match-correct')) return;
    document.querySelectorAll(`.match-item`).forEach(i => i.classList.remove('match-selected'));
    el.classList.add('match-selected');
    if(type === 'en') { selectedEn = { el, word }; speak(word.en === "I" ? "eye" : word.en); }
    else selectedHy = { el, word };
    if(selectedEn && selectedHy) {
        if(selectedEn.word.id === selectedHy.word.id) {
            selectedEn.el.className = 'match-item match-correct'; selectedHy.el.className = 'match-item match-correct';
            let s = activeStage;
            selectedEn.word.stageScores[s] = Math.min(10, (selectedEn.word.stageScores[s] || 0) + 1);
            if(selectedEn.word.stageScores[s] >= 10) { 
                selectedEn.word.stageScores[s] = 0; 
                if (activeStage !== 7) selectedEn.word.stagesCompleted.push(s); 
                if(isWordLearned(selectedEn.word)) { 
                    selectedEn.word.learnedDate = new Date().toISOString().split('T')[0]; 
                    setNextRep(selectedEn.word); 
                    dailyWordsCount++; 
                }
            }
        } else {
            selectedEn.el.classList.add('match-wrong'); selectedHy.el.classList.add('match-wrong');
            let s = activeStage;
            selectedEn.word.stageScores[s] = Math.max(0, (selectedEn.word.stageScores[s] || 0) - 1);
            selectedEn.word.errorCount++; 
            setTimeout(() => { document.querySelectorAll('.match-wrong').forEach(i => i.classList.remove('match-wrong', 'match-selected')); }, 400);
        }
        saveProgress(); selectedEn = null; selectedHy = null;
    }
}

function renderGenericStage() {
    const word = activeList[activeIndex % activeList.length];
    if (activeStage === 2) { renderMultipleChoice(word); return; }
    let question = word.en, answer = word.hy;
    if(activeStage === 4) { question = word.hy; answer = word.en; } 
    else if(activeStage === 5) { question = word.en; answer = word.hy; } 
    else if(activeStage === 6) { question = "🔊"; answer = word.en; } 
    else if(activeStage === 7) { question = word.en; answer = word.hy; }
    document.getElementById('content').innerHTML = `
        <div class="w-full text-center flex flex-col items-center">
            <div class="mb-1">${getStars(word)}</div>
            <div class="mb-6 text-3xl font-black text-white italic break-words px-4" onclick="speak('${word.en === "I" ? "eye" : word.en}')">${question}</div>
            <input type="text" id="stage-input" autofocus class="w-full p-5 border-4 border-emerald-800 rounded-[2rem] text-center text-xl outline-none focus:border-emerald-400 transition-all shadow-inner" placeholder="..." autocomplete="off">
            <button id="check-btn" onclick="checkGeneric('${answer}')" class="btn-primary mt-6">ՍՏՈՒԳԵԼ</button>
            <button id="next-btn" onclick="skipGeneric()" class="btn-next-step">ՀԱՋՈՐԴԸ</button>
        </div>`;
    if(activeStage !== 4) speak(word.en === "I" ? "eye" : word.en);
    setTimeout(() => document.getElementById('stage-input')?.focus(), 50);
}

function skipGeneric() { activeIndex++; initStageLogic(); }

function renderMultipleChoice(word) {
    let options = [word.hy];
    let otherWords = words.filter(w => w.id !== word.id).sort(() => 0.5 - Math.random());
    options.push(...otherWords.slice(0, 3).map(w => w.hy));
    options.sort(() => 0.5 - Math.random());
    document.getElementById('content').innerHTML = `
        <div class="w-full text-center flex flex-col items-center">
            <div class="mb-1">${getStars(word)}</div>
            <div class="mb-6 text-3xl font-black text-white italic break-words px-4" onclick="speak('${word.en === "I" ? "eye" : word.en}')">${word.en}</div>
            <div class="grid grid-cols-1 gap-2 w-full max-h-[50vh] overflow-y-auto pr-1 custom-scroll">
                ${options.map(opt => `<button onclick="checkChoice(this, '${opt}', '${word.hy}')" class="choice-btn p-4 border-2 border-emerald-800 rounded-2xl font-bold text-md break-words px-4">${opt}</button>`).join('')}
            </div>
            <button id="next-btn" onclick="skipGeneric()" class="btn-next-step">ՀԱՋՈՐԴԸ</button>
        </div>`;
    speak(word.en === "I" ? "eye" : word.en);
}

function checkChoice(btn, selected, correct) {
    const word = activeList[activeIndex % activeList.length];
    const buttons = document.querySelectorAll('.choice-btn');
    const s = activeStage;
    buttons.forEach(b => b.disabled = true);
    if(cleanText(selected) === cleanText(correct)) {
        btn.classList.add('choice-correct');
        word.stageScores[s] = Math.min(10, (word.stageScores[s] || 0) + 1); 
        if(s !== 7 && word.stageScores[s] >= 10) { 
            word.stageScores[s] = 0; word.stagesCompleted.push(s); 
            if(isWordLearned(word)) { 
                word.learnedDate = new Date().toISOString().split('T')[0]; 
                setNextRep(word); 
                dailyWordsCount++; 
            } 
            setTimeout(() => { activeIndex++; initStageLogic(); }, 600);
        } else if (s === 7 && word.stageScores[s] >= 10) {
            word.stageScores[s] = 0;
            if(smartMode === 'repetition') setNextRep(word);
            setTimeout(() => { activeIndex++; initStageLogic(); }, 600);
        } else { setTimeout(() => initStageLogic(), 600); }
    } else { 
        btn.classList.add('choice-wrong');
        buttons.forEach(b => { if(cleanText(b.innerText) === cleanText(correct)) b.classList.add('choice-correct'); });
        word.stageScores[s] = Math.max(0, (word.stageScores[s] || 0) - 1); 
        word.errorCount++; 
        setTimeout(() => initStageLogic(), 800);
    }
    saveProgress(); 
}

function checkGeneric(correct) {
    const input = document.getElementById('stage-input');
    const word = activeList[activeIndex % activeList.length];
    const s = activeStage;
    if(cleanText(input.value) === cleanText(correct)) {
        if(s === 4) speak(word.en === "I" ? "eye" : word.en);
        word.stageScores[s] = Math.min(10, (word.stageScores[s] || 0) + 1); 
        input.className = "w-full p-5 border-4 border-emerald-500 bg-emerald-600 text-white rounded-[2rem] text-center text-xl outline-none";
        if(word.stageScores[s] >= 10) {
            if(s !== 7) {
                word.stageScores[s] = 0;
                word.stagesCompleted.push(s);
                if(isWordLearned(word)) { 
                    word.learnedDate = new Date().toISOString().split('T')[0]; 
                    setNextRep(word); 
                    dailyWordsCount++; 
                }
            } else {
                word.stageScores[s] = 0;
                if (smartMode === 'repetition') setNextRep(word);
            }
            setTimeout(() => { activeIndex++; initStageLogic(); }, 600);
        } else { setTimeout(() => initStageLogic(), 400); }
    } else {
        word.stageScores[s] = Math.max(0, (word.stageScores[s] || 0) - 1); 
        word.errorCount++;
        input.className = "w-full p-5 border-4 border-rose-600 bg-rose-900 text-white rounded-[2rem] text-center text-xl outline-none";
        input.value = correct;
        document.getElementById('check-btn').classList.add('hidden');
        setTimeout(() => initStageLogic(), 1200);
    }
    saveProgress();
}

function getWeeklyData() {
    const last7Days = [], learnedCounts = [], timeCounts = [], today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('hy-AM', { weekday: 'short' });
        learnedCounts.push(words.filter(w => w.learnedDate === dateStr).length);
        timeCounts.push(dailyTimeData[dateStr] || 0);
        last7Days.push(dayName);
    }
    return { labels: last7Days, wordData: learnedCounts, timeData: timeCounts };
}

function openStatsStage() {
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('stats-view').classList.remove('hidden');
    const view = document.getElementById('stats-view');
    
    const weekly = getWeeklyData();
    const maxWordVal = Math.max(...weekly.wordData, 5);
    const maxTimeVal = 60; // 60 րոպե որպես մաքսիմում գրաֆիկի համար
    
    // Փուլերի տվյալների պատրաստում (8 փուլ)
    const stageCounts = [];
    for (let i = 1; i <= 8; i++) {
        let count = 0;
        if (i <= 6) count = words.filter(w => w.stagesCompleted.includes(i) || w.isInstant).length;
        else if (i === 7) count = words.filter(w => w.repLevel > 0).length;
        else count = words.filter(w => isWordLearned(w)).length;
        stageCounts.push(count);
    }
    const maxStageVal = Math.max(...stageCounts, 1);

    view.innerHTML = `
        <div class="flex justify-between items-center px-2">
             <button onclick="exitToMenu()" class="text-emerald-400 font-black">✕</button>
             <h2 class="text-[12px] font-black italic tracking-widest text-emerald-100">STATISTICS</h2>
             <div style="width:20px"></div>
        </div>

        <div class="stats-section">
            <div class="stats-title">Փուլերի առաջընթաց</div>
            <div class="bar-container">
                ${stageCounts.map((val, i) => `
                    <div class="bar-wrapper">
                        <div class="bar-fill stage-bar" data-val="${val}" style="height: ${(val/maxStageVal)*100}%"></div>
                        <span class="bar-label">Փ${i+1}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="stats-section">
            <div class="stats-title">Սովորած բառեր (7 օր)</div>
            <div class="bar-container">
                ${weekly.wordData.map((val, i) => `
                    <div class="bar-wrapper">
                        <div class="bar-fill" data-val="${val}" style="height: ${(val/maxWordVal)*100}%"></div>
                        <span class="bar-label">${weekly.labels[i]}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="stats-section">
            <div class="stats-title">Անցկացրած ժամանակ (ր)</div>
            <div class="bar-container">
                ${weekly.timeData.map((val, i) => `
                    <div class="bar-wrapper">
                        <div class="bar-fill time-bar" data-val="${val}" style="height: ${(val/maxTimeVal)*100}%"></div>
                        <span class="bar-label">${weekly.labels[i]}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="bottom-stats">
            <div class="info-box">
                <div class="circle-stat">${dailyWordsCount}</div>
                <div class="stats-title" style="margin-bottom:0">Նպատակ (${dailyGoal})</div>
                <input type="range" min="5" max="100" value="${dailyGoal}" 
                    onchange="updateDailyGoal(this.value)" class="w-full mt-2 accent-emerald-500">
            </div>
            <div class="info-box">
                <div class="circle-stat" style="border-color:#60a5fa">${sessionMinutes}</div>
                <div class="stats-title" style="margin-bottom:0">Կայքում (ր)</div>
                <div class="flex items-center gap-2 mt-2">
                    <span class="text-[8px] font-bold">🔔</span>
                    <input type="number" value="${reminderMinute}" 
                        onchange="updateReminder(this.value)" class="w-10 bg-emerald-800 border-none rounded text-center text-xs font-bold">
                </div>
            </div>
        </div>
    `;
}

function updateDailyGoal(val) { dailyGoal = parseInt(val); saveProgress(); openStatsStage(); }
function updateReminder(val) { reminderMinute = Math.max(1, parseInt(val) || 10); saveProgress(); }

function openExam() {
    activeList = [...words].sort(() => 0.5 - Math.random()).slice(0, 50);
    activeIndex = 0; smartMode = null;
    document.getElementById('app-content').classList.add('hidden'); document.getElementById('view').classList.remove('hidden');
    renderExamStep(0);
}

function renderExamStep(correctCount) {
    if(activeIndex >= activeList.length) return renderFinish(`Արդյունք: ${Math.round((correctCount/activeList.length)*100)}%`);
    const word = activeList[activeIndex];
    document.getElementById('content').innerHTML = `
        <div class="w-full text-center flex flex-col items-center">
            <p class="text-[10px] font-bold text-emerald-400 mb-4 uppercase tracking-widest">${activeIndex+1} / ${activeList.length}</p>
            <h2 class="text-3xl font-black text-white mb-8 italic break-words px-4">${word.en}</h2>
            <input type="text" id="exam-in" autofocus class="w-full p-5 border-4 border-emerald-800 rounded-3xl text-center text-lg mb-6 outline-none" placeholder="..." autocomplete="off">
            <button id="ex-btn" class="btn-next-step">ՀԱՋՈՐԴԸ</button>
        </div>`;
    setTimeout(() => document.getElementById('exam-in').focus(), 50);
    document.getElementById('ex-btn').onclick = () => { if(cleanText(document.getElementById('exam-in').value) === cleanText(word.hy)) correctCount++; else word.errorCount++; activeIndex++; renderExamStep(correctCount); };
}

function renderFinish(extra = "") {
    const isStage1 = (activeStage === 1);
    document.getElementById('content').innerHTML = `
        <div class="text-center p-8 bg-emerald-800 rounded-[2.5rem] shadow-2xl w-full border-b-8 border-emerald-500">
            <div class="text-6xl mb-4">🏆</div>
            <h2 class="text-2xl font-black mb-2 text-white italic">Գերազանց է</h2>
            <p class="text-emerald-200 mb-6 font-bold text-sm">${extra || "Բաժինը հաջողությամբ անցաք:"}</p>
            <div class="flex flex-col gap-3">
                ${isStage1 ? `<button onclick="restartStage1()" class="btn-primary">ԿՐԿՆԵԼ</button>` : ''}
                <button onclick="exitToMenu()" class="${isStage1 ? 'text-emerald-300 font-bold text-xs uppercase tracking-widest mt-2' : 'btn-primary'}">ՎԵՐԱԴԱՌՆԱԼ</button>
            </div>
        </div>`;
    saveProgress();
}

function exitToMenu() {
    document.querySelectorAll('#view, #stats-view, #smart-menu-view').forEach(el => el.classList.add('hidden'));
    document.getElementById('app-content').classList.remove('hidden');
    window.speechSynthesis.cancel(); updateStats();
}

function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text); msg.lang = 'en-US';
    window.speechSynthesis.speak(msg);
}

function showDeleteModal() { document.getElementById('delete-modal').classList.remove('hidden'); }
function hideDeleteModal() { document.getElementById('delete-modal').classList.add('hidden'); }
function confirmFinalDelete() { localStorage.removeItem('usanim_v3_data'); location.reload(); }

initApp();
