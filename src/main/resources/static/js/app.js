const statusLabel = document.getElementById('server-status');
const checkButton = document.getElementById('check-button');
const boardMessage = document.getElementById('board-message');
const columns = document.querySelectorAll('.column');



async function checkServer() {
    statusLabel.textContent = 'Checking the server...';
    statusLabel.className = 'status';

    try {
        const response = await fetch('/api/ping');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        const data = await response.json();
        statusLabel.textContent = 'Server says "' + data.message + '" at ' + formatTime(data.serverTime);
        statusLabel.className = 'status ok';
    } catch (error) {
        statusLabel.textContent = 'Cannot reach the server: ' + error.message;
        statusLabel.className = 'status error';
    }
}



async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        const tasks = await response.json();
        boardMessage.hidden = true;
        renderBoard(tasks);
    } catch (error) {
        showBoardMessage('Could not load the tasks: ' + error.message);
    }
}

function renderBoard(tasks) {
    for (const column of columns) {
        const status = column.dataset.status;
        const columnTasks = tasks.filter(task => task.status === status);

        const cards = column.querySelector('.cards');
        cards.replaceChildren();
        for (const task of columnTasks) {
            cards.append(createCard(task));
        }
        if (columnTasks.length === 0) {
            cards.append(createEmptyMessage());
        }

        column.querySelector('.count').textContent = columnTasks.length;
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
    meta.textContent = '#' + task.id + ' · created ' + formatTime(task.createdAt);

    card.append(title, meta);
    return card;
}

function createEmptyMessage() {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No tasks yet';
    return empty;
}

function showBoardMessage(text) {
    boardMessage.textContent = text;
    boardMessage.hidden = false;
}

function formatTime(isoText) {
    return new Date(isoText).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}



checkButton.addEventListener('click', checkServer);
checkServer();
loadTasks();