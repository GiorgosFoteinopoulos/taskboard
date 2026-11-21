const statusLabel = document.getElementById('server-status');
const checkButton = document.getElementById('check-button');

async function checkServer() {
    statusLabel.textContent = 'Checking the server...';
    statusLabel.className = 'status';

    try {
        const response = await fetch('/api/ping');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        const data = await response.json();
        statusLabel.textContent = 'Server says "' + data.message + '" at ' + data.serverTime;
        statusLabel.className = 'status ok';
    } catch (error) {
        statusLabel.textContent = 'Cannot reach the server: ' + error.message;
        statusLabel.className = 'status error';
    }
}

const boardMessage = document.getElementById('board-message');
const reloadButton = document.getElementById('reload-button');
const columns = document.querySelectorAll('.column');

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

async function loadTasks() {
    showBoardMessage('Loading tasks...');

    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        const tasks = await response.json();
        renderBoard(tasks);
        showBoardMessage('', '');
    } catch (error) {
        showBoardMessage('Could not load tasks: ' + error.message, 'error');
    }
}

function renderBoard(tasks) {
    for (const column of columns) {
        const status = column.dataset.status;
        const cardList = column.querySelector('.cards');
        const counter = column.querySelector('.count');
        const tasksInColumn = tasks.filter(task => task.status === status);

        cardList.replaceChildren();
        for (const task of tasksInColumn) {
            cardList.append(createCard(task));
        }
        if (tasksInColumn.length === 0) {
            cardList.append(createEmptyNote());
        }
        counter.textContent = tasksInColumn.length;
    }
}

function createCard(task) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = task.id;

    const title = document.createElement('p');
    title.className = 'card-title';
    title.textContent = task.title;

    const meta = document.createElement('p');
    meta.className = 'card-meta';
    meta.textContent = '#' + task.id + ' - ' + dateFormat.format(new Date(task.createdAt));

    card.append(title, meta);
    return card;
}

function createEmptyNote() {
    const note = document.createElement('p');
    note.className = 'empty';
    note.textContent = 'No tasks yet';
    return note;
}

function showBoardMessage(text, kind) {
    boardMessage.textContent = text;
    boardMessage.className = 'board-message' + kind;
    boardMessage.hidden = text === '';
}

checkButton.addEventListener('click', checkServer);
reloadButton.addEventListener('click', loadTasks);

checkServer();
loadTasks();