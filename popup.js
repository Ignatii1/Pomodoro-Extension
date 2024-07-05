let timer;
let timeLeft;
let totalTime;
let isRunning = false;
let completedPomodoros = 0;
let totalTimeWorked = 0;

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  document.getElementById('timer').textContent = display;

  const progress = (timeLeft / totalTime) * 100;
  document.getElementById('progress').value = progress;
}

function startTimer() {
  if (!isRunning) {
    isRunning = true;
    document.getElementById('start').textContent = 'Restart';
    document.getElementById('time-input').disabled = true;

    if (!timer) {
      totalTime = parseInt(document.getElementById('time-input').value) * 60;
      timeLeft = totalTime;
    }

    timer = setInterval(() => {
      timeLeft--;
      updateTimer();
      if (timeLeft === 0) {
        clearInterval(timer);
        isRunning = false;
        completedPomodoros++;
        totalTimeWorked += totalTime / 60;
        updateStats();
        chrome.runtime.sendMessage({ type: 'createNotification' });
      }
    }, 1000);
  } else {
    resetTimer();
    startTimer();
  }
}

function pauseTimer() {
  if (isRunning) {
    clearInterval(timer);
    isRunning = false;
    document.getElementById('start').textContent = 'Resume';
  }
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  timer = null;
  document.getElementById('start').textContent = 'Start';
  document.getElementById('time-input').disabled = false;
  totalTime = parseInt(document.getElementById('time-input').value) * 60;
  timeLeft = totalTime;
  updateTimer();
}

function updateStats() {
  document.getElementById('completed').textContent = completedPomodoros;
  document.getElementById('total-time').textContent = totalTimeWorked.toFixed(1);

  chrome.storage.sync.set({
    completedPomodoros: completedPomodoros,
    totalTimeWorked: totalTimeWorked
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start').addEventListener('click', startTimer);
  document.getElementById('pause').addEventListener('click', pauseTimer);
  document.getElementById('reset').addEventListener('click', resetTimer);

  document.getElementById('time-input').addEventListener('change', () => {
    if (!isRunning) {
      resetTimer();
    }
  });

  chrome.storage.sync.get(['completedPomodoros', 'totalTimeWorked'], (result) => {
    completedPomodoros = result.completedPomodoros || 0;
    totalTimeWorked = result.totalTimeWorked || 0;
    updateStats();
  });
});

// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'createNotification') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Pomodoro Completed!',
      message: 'Time for a break. Great job!',
    });
  }
});