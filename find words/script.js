let alphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
alphabet = alphabet.split('');

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function random(arr) {
	return arr[getRandomInt(0, arr.length - 1)];
}

let amountOfWords, words, assignment;

function getInputs() {
    amountOfWords = +document.getElementById('amount-of-words').value;
    words = document.getElementById('words').value;
    words = words.split(',');
    assignment = document.getElementById('assignment').value; 
}

function generateTable(amount) {
    let table = document.getElementById('table');
    for (let row = 1; row <= amount; row++) {
        let tr = document.createElement('tr');
        tr.innerHTML = '';

        for (let col = 1; col <= amount; col++) {
            tr.innerHTML += `<td class="empty"></td>

            `;
        }
        table.append(tr);
    }
    for (let tr of document.querySelectorAll('tr')) {
        tr.classList.add('undone');
    }

    let rows = document.querySelectorAll('tr');
    
    for (let word of words) {
        word = word.trim();
        word = word.split('');
        
        let maxIndex = amountOfWords - word.length;
        
        let startIndex = getRandomInt(1, maxIndex);
        
        let currentRow = document.querySelector('.undone');
        
        let tds = currentRow.children;
        
        for (let letter of word) {
            tds[startIndex].classList.toggle('empty');
            tds[startIndex].innerHTML = letter;
            startIndex++;
        }
        currentRow.classList.toggle('undone');
    }
    for (let td of document.querySelectorAll('.empty')) {
        td.innerHTML = `${random(alphabet)}`;
    }
}

function createAssignment(text) {
    let area = document.querySelector('.assignment-sheet');
    area.innerHTML = `${text}`;
}

function toggleVisibility(elem) {
    elem.style.display = 'none';

}

let btn = document.querySelector('.btn');
btn.addEventListener('click', () => {
    getInputs();
    createAssignment(assignment);
    generateTable(amountOfWords);
    let settings = document.querySelector('.settings');
    toggleVisibility(settings);

});