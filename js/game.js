// /js/game.js (ФИНАЛЬНАЯ ВЕРСИЯ: СЕТКА 60x60, МОБИЛЬНЫЙ ДЖОЙСТИК, FIREBASE)

let player;     
let db;         
let currentUserId; 
let joystick;   
let cursors;    
const TILE_SIZE = 60; // Размер одного сектора (тайла)
let isMoving = false; // Флаг для контроля движения по сетке

// Главная функция, которая запускает игру после аутентификации
function startGame() {
    // Получаем необходимые переменные после входа
    currentUserId = firebase.auth().currentUser.uid;
    db = firebase.firestore(); 
    
    const config = {
        type: Phaser.AUTO, 
        // 📱 КОНФИГУРАЦИЯ МАСШТАБИРОВАНИЯ
        scale: {
            mode: Phaser.Scale.FIT, // Вписывает игру в экран
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 800,
            height: 600
        },
        backgroundColor: '#303030', 
        scene: {
            preload: preload,
            create: create,
            update: update 
        },
        // 🕹️ ПОДКЛЮЧАЕМ ПЛАГИН ДЖОЙСТИКА
        plugins: {
            global: [{
                key: 'rexVirtualJoystick',
                plugin: window.RexPlugins.Input.VirtualJoystick,
                start: true
            }]
        }
    };

    const game = new Phaser.Game(config);
}

// 1. Загрузка ресурсов
function preload ()
{
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/block.png'); 
}

// 2. Создание объектов сцены
function create ()
{
    this.add.text(10, 10, 'Миры Роркха: Перемещение по сетке (60x60)', { fontSize: '32px', fill: '#00ff00' }).setScrollFactor(0);
    this.add.text(10, 50, 'Двигайтесь джойстиком или WASD. Шаг = 60px.', { fontSize: '18px', fill: '#cccccc' }).setScrollFactor(0);
    
    // Создаем игрока
    player = this.add.sprite(270, 270, 'player'); 
    player.displayWidth = TILE_SIZE / 2; // Визуально уменьшаем
    player.displayHeight = TILE_SIZE / 2;
    player.setTint(0xcc3333); 

    // 🔥 ЗАГРУЗКА ПОЗИЦИИ ИЗ FIREBASE
    db.collection('players').doc(currentUserId).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            player.x = data.x; 
            player.y = data.y;
        } else {
            savePlayerPosition(); 
        }
    }).catch(error => {
        console.error("Ошибка при загрузке позиции:", error);
    });

    // Управление с клавиатуры
    cursors = this.input.keyboard.addKeys({
        'up': Phaser.Input.Keyboard.KeyCodes.W,
        'down': Phaser.Input.Keyboard.KeyCodes.S,
        'left': Phaser.Input.Keyboard.KeyCodes.A,
        'right': Phaser.Input.Keyboard.KeyCodes.D
    });

    // 🕹️ СОЗДАНИЕ ВИРТУАЛЬНОГО ДЖОЙСТИКА
    joystick = this.plugins.get('rexVirtualJoystick').add(this, {
        x: 100,
        y: 500,
        radius: 50,
        base: this.add.circle(0, 0, 50, 0x888888).setAlpha(0.5).setScrollFactor(0),
        thumb: this.add.circle(0, 0, 25, 0xcccccc).setAlpha(0.8).setScrollFactor(0),
        forceMin: 16
    }).on('update', function () {
        // Логика джойстика обрабатывается через 'pointerup'
    }, this);
    
    // 🖱️ ОБРАБОТКА ОТПУСКАНИЯ ДЖОЙСТИКА (чтобы сделать один шаг)
    this.input.on('pointerup', (pointer) => {
        // Проверяем, было ли отпущено над джойстиком
        if (joystick && joystick.isPointInCircle(pointer.x, pointer.y)) {
            const angle = Phaser.Math.RadToDeg(joystick.angle);
            let dx = 0;
            let dy = 0;
            
            // Определяем основное направление (N, S, E, W)
            if (angle > 315 || angle <= 45) { dx = 1; }
            else if (angle > 45 && angle <= 135) { dy = -1; }
            else if (angle > 135 && angle <= 225) { dx = -1; }
            else if (angle > 225 && angle <= 315) { dy = 1; }
            
            if (dx !== 0 || dy !== 0) {
                movePlayer(this, dx, dy);
            }
        }
    });
}

// 💥 ФУНКЦИЯ: ДВИЖЕНИЕ ПО СЕТКЕ
function movePlayer(scene, dx, dy) {
    if (isMoving) {
        return;
    }

    isMoving = true; 
    
    const newX = player.x + dx * TILE_SIZE;
    const newY = player.y + dy * TILE_SIZE;

    // Используем Tween для плавного перехода
    scene.tweens.add({
        targets: player,
        x: newX,
        y: newY,
        duration: 200, 
        ease: 'Linear',
        onComplete: () => {
            isMoving = false; // Разблокируем движение
            savePlayerPosition(); // Сохраняем новую позицию в БД
        }
    });
}

// 🔥 ФУНКЦИЯ СОХРАНЕНИЯ ПОЗИЦИИ В БД
function savePlayerPosition() {
    if (!player || !currentUserId) return; 

    db.collection('players').doc(currentUserId).set({
        x: player.x,
        y: player.y,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }); 
}

// 3. Игровой цикл
function update (time, delta)
{
    // Логика клавиатуры (WASD) - обрабатывает одно нажатие
    if (cursors.left.isDown && !isMoving) {
        movePlayer(this, -1, 0);
    } else if (cursors.right.isDown && !isMoving) {
        movePlayer(this, 1, 0);
    } else if (cursors.up.isDown && !isMoving) {
        movePlayer(this, 0, -1);
    } else if (cursors.down.isDown && !isMoving) {
        movePlayer(this, 0, 1);
    }
}