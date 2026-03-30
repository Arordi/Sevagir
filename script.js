async function loadVocabulary() {
    try {
        const response = await fetch('vocabulary.json');
        const data = await response.json();
        const container = document.getElementById('word-container');
        
        container.innerHTML = ''; // Մաքրել հինը

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'word-card';
            card.innerHTML = `
                <img src="${item.img}" alt="${item.word}" style="width:100px;">
                <h3>${item.word}</h3>
                <p>${item.translation}</p>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Սխալ տվյալները բեռնելիս:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadVocabulary);
