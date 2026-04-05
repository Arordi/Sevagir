// scoring.js

// Ստուգում է՝ արդյոք բառը համարվում է սովորած
function isWordLearned(word) {
    if (word.isInstant) return true;
    // Բառը սովորած է, եթե անցել է 2, 3, 4, 5, 6 փուլերը
    return [2, 3, 4, 5, 6].every(s => word.stagesCompleted.includes(s));
}

// Հաշվարկում է հաջորդ կրկնության օրը (Spaced Repetition)
function setNextRep(word) {
    const intervals = [7, 30, 90];
    const days = intervals[word.repLevel] || 90;
    let date = new Date();
    date.setDate(date.getDate() + days);
    word.nextRepDate = date.toISOString().split('T')[0];
    word.repLevel++;
}

// Պահպանում է առաջընթացը LocalStorage-ում
function saveProgress(words, examScores, dailyWordsCount, dailyGoal, dailyTimeData, reminderMinute) {
    const storage = { 
        words: {}, 
        examScores, 
        dailyWordsCount, 
        dailyGoal, 
        dailyTimeData, 
        reminderMinute 
    };
    
    words.forEach(w => {
        storage.words[w.id] = { 
            score: w.score, 
            stagesCompleted: w.stagesCompleted, 
            isInstant: w.isInstant, 
            isSeen: w.isSeen, 
            errorCount: w.errorCount, 
            learnedDate: w.learnedDate,
            repLevel: w.repLevel, 
            nextRepDate: w.nextRepDate
        };
    });
    localStorage.setItem('usanim_v3_data', JSON.stringify(storage));
}

// Միավորների ավելացման ընդհանուր ֆունկցիա
function handleCorrectAnswer(word, stage, mode = null) {
    word.score = Math.min(10, word.score + 1);
    
    if (word.score >= 10) {
        if (stage !== 7) {
            word.score = 0; // Զրոյացնել հաջորդ փուլի համար
            if (!word.stagesCompleted.includes(stage)) {
                word.stagesCompleted.push(stage);
            }
            if (isWordLearned(word)) {
                word.learnedDate = new Date().toISOString().split('T')[0];
                setNextRep(word);
                return { stageFinished: true, learnedNew: true };
            }
        } else {
            // Փուլ 7-ի դեպքում (Կրկնություն)
            if (mode === 'repetition') {
                setNextRep(word);
            }
        }
        return { stageFinished: true, learnedNew: false };
    }
    return { stageFinished: false, learnedNew: false };
}

// Սխալ պատասխանի դեպքում միավորի նվազեցում
function handleWrongAnswer(word) {
    word.score = Math.max(0, word.score - 1);
    word.errorCount++;
}
