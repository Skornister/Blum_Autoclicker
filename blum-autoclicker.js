// ==UserScript==
// @name         Blum Autoclicker
// @version      1.1
// @namespace    Violentmonkey Scripts
// @author       mudachyo
// @match        https://telegram.blum.codes/*
// @grant        none
// @icon         https://cdn.prod.website-files.com/65b6a1a4a0e2af577bccce96/65ba99c1616e21b24009b86c_blum-256.png
// @downloadURL  https://github.com/mudachyo/Blum/raw/main/blum-autoclicker.user.js
// @updateURL    https://github.com/mudachyo/Blum/raw/main/blum-autoclicker.user.js
// @homepage     https://github.com/mudachyo/Blum
// ==/UserScript==

let GAME_SETTINGS = {
    minBombHits: 0,
    minIceHits: 0,
    flowerSkipPercentage: 8,
    minDelayMs: 2000,
    maxDelayMs: 5000,
};

let isGamePaused = false;

function waitForAppElement() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.id === 'app') {
                    observer.disconnect();
                    initScript();
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

waitForAppElement();

function initScript() {
    try {
        console.log('Script started');

        let gameStats = {
            score: 0,
            bombHits: 0,
            iceHits: 0,
            flowersSkipped: 0,
            isGameOver: false,
        };

        const originalPush = Array.prototype.push;
        Array.prototype.push = function (...items) {
            if (!isGamePaused) {
                items.forEach(item => handleGameElement(item));
            }
            return originalPush.apply(this, items);
        };

        function handleGameElement(element) {
            if (!element || !element.item) return;

            const { type } = element.item;
            switch (type) {
                case "CLOVER":
                    processFlower(element);
                    break;
                case "BOMB":
                    processBomb(element);
                    break;
                case "FREEZE":
                    processIce(element);
                    break;
                default:
                    console.log('Unknown element type:', type);
            }
        }

        function processFlower(element) {
            const shouldSkip = Math.random() < (GAME_SETTINGS.flowerSkipPercentage / 100);
            if (shouldSkip) {
                gameStats.flowersSkipped++;
                console.log('Flower skipped');
            } else {
                gameStats.score++;
                clickElement(element);
                console.log('Flower clicked');
            }
        }

        function processBomb(element) {
            if (gameStats.bombHits < GAME_SETTINGS.minBombHits) {
                gameStats.score = 0;
                clickElement(element);
                gameStats.bombHits++;
                console.log('Bomb clicked');
            }
        }

        function processIce(element) {
            if (gameStats.iceHits < GAME_SETTINGS.minIceHits) {
                clickElement(element);
                gameStats.iceHits++;
                console.log('Ice clicked');
            }
        }

        function clickElement(element) {
            if (element && typeof element.onClick === 'function') {
                element.onClick(element);
                element.isExplosion = true;
                element.addedAt = performance.now();
            } else {
                console.log('Element is not clickable:', element);
            }
        }

        function checkGameCompletion() {
            const rewardElement = document.querySelector('#app > div > div > div.content > div.reward');
            if (rewardElement && !gameStats.isGameOver) {
                console.log('Game completed');
                gameStats.isGameOver = true;
                logGameStats();
                resetGameStats();
                resetGameSettings();
                if (window.__NUXT__.state.$s$0olocQZxou.playPasses > 0) {
                    startNewGame();
                }
            }
        }

        function logGameStats() {
            console.log(`Game Over. Stats: Score: ${gameStats.score}, Bombs: ${gameStats.bombHits}, Ice: ${gameStats.iceHits}, Flowers Skipped: ${gameStats.flowersSkipped}`);
        }

        function resetGameStats() {
            gameStats = {
                score: 0,
                bombHits: 0,
                iceHits: 0,
                flowersSkipped: 0,
                isGameOver: false,
            };
        }

        function resetGameSettings() {
            GAME_SETTINGS = {
                minBombHits: 0,
                minIceHits: 0,
                flowerSkipPercentage: 8,
                minDelayMs: 2000,
                maxDelayMs: 5000,
            };
        }

        function getRandomDelay() {
            return Math.random() * (GAME_SETTINGS.maxDelayMs - GAME_SETTINGS.minDelayMs) + GAME_SETTINGS.minDelayMs;
        }

        function startNewGame() {
            setTimeout(() => {
                const newGameButton = document.querySelector("#app > div > div > div.buttons > button:nth-child(2)");
                if (newGameButton) {
                    newGameButton.click();
                    console.log('New game started');
                } else {
                    console.log('New game button not found');
                }
                gameStats.isGameOver = false;
            }, getRandomDelay());
        }

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    checkGameCompletion();
                }
            }
        });

        const appElement = document.querySelector('#app');
        if (appElement) {
            observer.observe(appElement, { childList: true, subtree: true });
        } else {
            console.log('#app element not found');
        }

        const pauseButton = document.createElement('button');
        pauseButton.textContent = 'Pause';
        pauseButton.style.position = 'fixed';
        pauseButton.style.bottom = '20px';
        pauseButton.style.right = '20px';
        pauseButton.style.zIndex = '9999';
        pauseButton.style.padding = '4px 8px';
        pauseButton.style.backgroundColor = '#5d5abd';
        pauseButton.style.color = 'white';
        pauseButton.style.border = 'none';
        pauseButton.style.borderRadius = '10px';
        pauseButton.style.cursor = 'pointer';
        pauseButton.onclick = toggleGamePause;
        document.body.appendChild(pauseButton);
        console.log('Pause button added');

        function toggleGamePause() {
            isGamePaused = !isGamePaused;
            pauseButton.textContent = isGamePaused ? 'Resume' : 'Pause';
        }
    } catch (e) {
        console.error('Failed to initiate the game script', e);
    }
}
