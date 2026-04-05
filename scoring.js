function updateScore(word, isCorrect, currentStage) {
    if (isCorrect) {
        word.score = Math.min(10, word.score + 1);
    } else {
        word.score = Math.max(0, word.score - 1);
        word.errorCount++;
    }

    if (word.score >= 10) {
        if (currentStage !== 7) {
            word.score = 0; // Զրոյացնել հաջորդ փուլի համար
            if (!word.stagesCompleted.includes(currentStage)) {
                word.stagesCompleted.push(currentStage);
            }
        }
        return true; // Փուլն ավարտված է
    }
    return false; // Դեռ պետք է շարունակել
}
