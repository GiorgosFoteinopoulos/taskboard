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

checkButton.addEventListener('click', checkServer);
checkServer();