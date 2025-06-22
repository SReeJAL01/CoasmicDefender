class CosmicDefender {
            constructor() {
                this.gameContainer = document.querySelector('.game-container');
                this.player = document.getElementById('player');
                this.scoreElement = document.getElementById('score');
                this.livesElement = document.getElementById('lives');
                this.levelElement = document.getElementById('level');
                this.timerElement = document.getElementById('timer');
                this.startScreen = document.getElementById('startScreen');
                this.gameOverScreen = document.getElementById('gameOver');
                
                this.gameState = {
                    score: 0,
                    lives: 3,
                    level: 1,
                    isPlaying: false,
                    playerPosition: 50,
                    bullets: [],
                    enemies: [],
                    particles: [],
                    startTime: Date.now(),
                    gameTime: 0
                };

                this.keys = {};
                this.lastEnemySpawn = 0;
                this.enemySpawnRate = 2000;
                this.gameLoop = null;

                this.setupEventListeners();
                this.setupTouchControls();
            }

            setupEventListeners() {
                document.addEventListener('keydown', (e) => {
                    this.keys[e.code] = true;
                    if (e.code === 'Space') {
                        e.preventDefault();
                        this.shoot();
                    }
                });

                document.addEventListener('keyup', (e) => {
                    this.keys[e.code] = false;
                });
            }

            setupTouchControls() {
                let touchStartX = 0;
                let touchStartY = 0;

                this.gameContainer.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                });

                this.gameContainer.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    if (!this.gameState.isPlaying) return;

                    const touch = e.touches[0];
                    const deltaX = touch.clientX - touchStartX;
                    
                    this.gameState.playerPosition += deltaX * 0.1;
                    this.gameState.playerPosition = Math.max(5, Math.min(95, this.gameState.playerPosition));
                    
                    touchStartX = touch.clientX;
                });

                this.gameContainer.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    if (this.gameState.isPlaying) {
                        this.shoot();
                    }
                });
            }

            startGame() {
                this.gameState = {
                    score: 0,
                    lives: 3,
                    level: 1,
                    isPlaying: true,
                    playerPosition: 50,
                    bullets: [],
                    enemies: [],
                    particles: [],
                    startTime: Date.now(),
                    gameTime: 0
                };

                this.startScreen.classList.add('hidden');
                this.gameOverScreen.classList.add('hidden');
                this.updateUI();
                this.gameLoop = setInterval(() => this.update(), 16);
            }

            update() {
                if (!this.gameState.isPlaying) return;

                // Update game time
                this.gameState.gameTime = Date.now() - this.gameState.startTime;

                this.handleInput();
                this.updateBullets();
                this.updateEnemies();
                this.updateParticles();
                this.spawnEnemies();
                this.checkCollisions();
                this.updatePlayerPosition();
                this.updateTimer();
            }

            handleInput() {
                if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
                    this.gameState.playerPosition -= 1.2;
                }
                if (this.keys['ArrowRight'] || this.keys['KeyD']) {
                    this.gameState.playerPosition += 1.2;
                }
                
                this.gameState.playerPosition = Math.max(5, Math.min(95, this.gameState.playerPosition));
            }

            updatePlayerPosition() {
                this.player.style.left = this.gameState.playerPosition + '%';
            }

            shoot() {
                if (!this.gameState.isPlaying) return;

                const bullet = document.createElement('div');
                bullet.className = 'bullet';
                bullet.style.left = this.gameState.playerPosition + '%';
                bullet.style.bottom = '110px';
                
                this.gameContainer.appendChild(bullet);
                this.gameState.bullets.push({
                    element: bullet,
                    x: this.gameState.playerPosition,
                    y: window.innerHeight - 110
                });

                setTimeout(() => {
                    if (bullet.parentNode) {
                        bullet.parentNode.removeChild(bullet);
                    }
                }, 600);
            }

            spawnEnemies() {
                const now = Date.now();
                
                // Decrease spawn rate over time (spawn enemies faster)
                const timeMultiplier = Math.max(0.3, 1 - (this.gameState.gameTime / 60000)); // Faster every minute
                const currentSpawnRate = this.enemySpawnRate * timeMultiplier;
                
                if (now - this.lastEnemySpawn > currentSpawnRate) {
                    this.createEnemy();
                    this.lastEnemySpawn = now;
                }
            }

            createEnemy() {
                const enemy = document.createElement('div');
                enemy.className = 'enemy moving';
                const x = Math.random() * 90 + 5;
                enemy.style.left = x + '%';
                enemy.style.top = '-50px';
                
                this.gameContainer.appendChild(enemy);
                
                // Calculate speed based on time and level
                const timeMultiplier = 1 + (this.gameState.gameTime / 30000); // Increase every 30 seconds
                const baseSpeed = 1.5 + (this.gameState.level * 0.3);
                const finalSpeed = baseSpeed * timeMultiplier;
                
                this.gameState.enemies.push({
                    element: enemy,
                    x: x,
                    y: -50,
                    speed: Math.min(finalSpeed, 4) // Cap maximum speed
                });

                setTimeout(() => {
                    if (enemy.parentNode) {
                        enemy.parentNode.removeChild(enemy);
                        this.gameState.enemies = this.gameState.enemies.filter(e => e.element !== enemy);
                    }
                }, 12000); // Increased timeout to ensure enemies reach bottom
            }

            updateBullets() {
                this.gameState.bullets = this.gameState.bullets.filter(bullet => {
                    bullet.y -= 8;
                    if (bullet.y < 0) {
                        if (bullet.element.parentNode) {
                            bullet.element.parentNode.removeChild(bullet.element);
                        }
                        return false;
                    }
                    return true;
                });
            }

            updateEnemies() {
                this.gameState.enemies = this.gameState.enemies.filter(enemy => {
                    enemy.y += enemy.speed;
                    enemy.element.style.top = enemy.y + 'px';
                    
                    // Check if enemy reached bottom of screen
                    if (enemy.y > window.innerHeight - 50) {
                        if (enemy.element.parentNode) {
                            enemy.element.parentNode.removeChild(enemy.element);
                        }
                        // Enemy reached bottom - lose a life
                        this.gameState.lives--;
                        this.updateUI();
                        if (this.gameState.lives <= 0) {
                            this.gameOver();
                        }
                        return false;
                    }
                    return true;
                });
            }

            updateParticles() {
                this.gameState.particles = this.gameState.particles.filter(particle => {
                    particle.life--;
                    if (particle.life <= 0) {
                        if (particle.element.parentNode) {
                            particle.element.parentNode.removeChild(particle.element);
                        }
                        return false;
                    }
                    return true;
                });
            }

            checkCollisions() {
                this.gameState.bullets.forEach((bullet, bulletIndex) => {
                    this.gameState.enemies.forEach((enemy, enemyIndex) => {
                        const bulletRect = bullet.element.getBoundingClientRect();
                        const enemyRect = enemy.element.getBoundingClientRect();
                        
                        if (this.isColliding(bulletRect, enemyRect)) {
                            // Create explosion effect
                            this.createExplosion(enemy.x, enemy.y);
                            
                            // Remove bullet and enemy
                            if (bullet.element.parentNode) {
                                bullet.element.parentNode.removeChild(bullet.element);
                            }
                            if (enemy.element.parentNode) {
                                enemy.element.parentNode.removeChild(enemy.element);
                            }
                            
                            this.gameState.bullets.splice(bulletIndex, 1);
                            this.gameState.enemies.splice(enemyIndex, 1);
                            
                            // Update score
                            this.gameState.score += 100;
                            this.updateUI();
                            
                            // Level progression
                            if (this.gameState.score > 0 && this.gameState.score % 1000 === 0) {
                                this.gameState.level++;
                                this.updateUI();
                            }
                        }
                    });
                });

                // Check player-enemy collisions
                const playerRect = this.player.getBoundingClientRect();
                this.gameState.enemies.forEach((enemy, index) => {
                    const enemyRect = enemy.element.getBoundingClientRect();
                    if (this.isColliding(playerRect, enemyRect)) {
                        this.createExplosion(this.gameState.playerPosition, window.innerHeight - 100);
                        
                        if (enemy.element.parentNode) {
                            enemy.element.parentNode.removeChild(enemy.element);
                        }
                        this.gameState.enemies.splice(index, 1);
                        
                        this.gameState.lives--;
                        this.updateUI();
                        
                        if (this.gameState.lives <= 0) {
                            this.gameOver();
                        }
                    }
                });
            }

            isColliding(rect1, rect2) {
                return !(rect1.right < rect2.left || 
                        rect1.left > rect2.right || 
                        rect1.bottom < rect2.top || 
                        rect1.top > rect2.bottom);
            }

            createExplosion(x, y) {
                const explosion = document.createElement('div');
                explosion.className = 'explosion';
                explosion.style.left = x + '%';
                explosion.style.top = y + 'px';
                explosion.innerHTML = '💥';
                explosion.style.fontSize = '30px';
                explosion.style.textAlign = 'center';
                explosion.style.lineHeight = '60px';
                
                this.gameContainer.appendChild(explosion);
                
                // Create particles
                for (let i = 0; i < 8; i++) {
                    this.createParticle(x, y);
                }
                
                setTimeout(() => {
                    if (explosion.parentNode) {
                        explosion.parentNode.removeChild(explosion);
                    }
                }, 600);
            }

            createParticle(x, y) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                
                const angle = (Math.PI * 2 * Math.random());
                const distance = 50 + Math.random() * 50;
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance;
                
                particle.style.left = x + '%';
                particle.style.top = y + 'px';
                particle.style.setProperty('--dx', dx + 'px');
                particle.style.setProperty('--dy', dy + 'px');
                
                this.gameContainer.appendChild(particle);
                
                this.gameState.particles.push({
                    element: particle,
                    life: 60
                });
            }

            updateUI() {
                this.scoreElement.textContent = this.gameState.score;
                this.livesElement.textContent = this.gameState.lives;
                this.levelElement.textContent = this.gameState.level;
            }

            updateTimer() {
                const minutes = Math.floor(this.gameState.gameTime / 60000);
                const seconds = Math.floor((this.gameState.gameTime % 60000) / 1000);
                this.timerElement.textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }

            gameOver() {
                this.gameState.isPlaying = false;
                clearInterval(this.gameLoop);
                
                document.getElementById('finalScore').textContent = `Final Score: ${this.gameState.score}`;
                
                let message = "You fought bravely, Commander!";
                if (this.gameState.score > 2000) {
                    message = "Outstanding performance! Earth is safe!";
                } else if (this.gameState.score > 1000) {
                    message = "Good job defending Earth!";
                }
                
                document.getElementById('gameOverMessage').textContent = message;
                this.gameOverScreen.classList.remove('hidden');
            }

            restartGame() {
                // Clear all game elements
                document.querySelectorAll('.bullet, .enemy, .explosion, .particle').forEach(el => {
                    if (el.parentNode) {
                        el.parentNode.removeChild(el);
                    }
                });
                
                this.startGame();
            }
        }

        // Initialize game
        const game = new CosmicDefender();

        // Global functions for buttons
        function startGame() {
            game.startGame();
        }

        function restartGame() {
            game.restartGame();
        }