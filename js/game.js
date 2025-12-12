// /js/game.js (ФИНАЛЬНАЯ ВЕРСИЯ: СЕТКА 60x60, МОБИЛЬНЫЙ ДЖОЙСТИК, FIREBASE)

let player;     // Персонаж
let db;         // Объект для работы с Firestore
let currentUserId; // ID пользователя
let joystick;   // Объект джойстика
let cursors;    // Управление для ПК
const TILE_SIZE = 60; // Размер одного сектора (тайла)
let isMoving = false; // Флаг, чтобы предотвратить множественные шаги одновременно

// Главная функция, которая запускает игру после аутентификации
function startGame() {
    // Получаем необходимые переменные после входа
    currentUserId = firebase.auth().currentUser.uid;
    db = firebase.firestore(); 
    
    const config = {
        type: Phaser.AUTO, 
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
    // Меняем спрайт на маленький, чтобы соответствовать пикселю, или используем блок
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/block.png'); 
}

// 2. Создание объектов сцены
function create ()
{
    this.add.text(10, 10, 'Миры Роркха: Перемещение по сетке (60x60)', { fontSize: '32px', fill: '#00ff00' }).setScrollFactor(0);
    this.add.text(10, 50, 'Двигайтесь джойстиком или WASD. Шаг = 60px.', { fontSize: '18px', fill: '#cccccc' }).setScrollFactor(0);
    
    // Создаем игрока, центрируем его на первой ячейке (0,0) + половина тайла
    // Начнем с позиции, кратной TILE_SIZE: (4 * 60 + 30, 4 * 60 + 30)
    player = this.add.sprite(270, 270, 'player'); 
    player.displayWidth = TILE_SIZE / 2; // Визуально уменьшаем, чтобы он выглядел как "пиксель"
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
        // Мы используем 'pointerup' для фиксации намерения двигаться
    }, this);
    
    // 🖱️ ОБРАБОТКА НАЖАТИЯ НА ДЖОЙСТИК (или клика)
    this.input.on('pointerup', (pointer) => {
        // Проверяем, был ли указатель отпущен над джойстиком
        if (joystick && joystick.isPointInCircle(pointer.x, pointer.y)) {
             // Получаем направление движения по осям (dx, dy)
            const angle = Phaser.Math.RadToDeg(joystick.angle);
            let dx = 0;
            let dy = 0;
            
            // Определяем основное направление (N, S, E, W)
            if (angle > 315 || angle <= 45) { // Право
                dx = 1;
            } else if (angle > 45 && angle <= 135) { // Вверх
                dy = -1;
            } else if (angle > 135 && angle <= 225) { // Лево
                dx = -1;
            } else if (angle > 225 && angle <= 315) { // Вниз
                dy = 1;
            }
            
            // Если направление определено, начинаем движение по сетке
            if (dx !== 0 || dy !== 0) {
                movePlayer(this, dx, dy);
            }
        }
    });
}

// 💥 НОВАЯ ФУНКЦИЯ: ДВИЖЕНИЕ ПО СЕТКЕ
function movePlayer(scene, dx, dy) {
    // Если игрок уже двигается, игнорируем команду
    if (isMoving) {
        return;
    }

    isMoving = true; // Блокируем новые движения
    
    // Вычисляем новую позицию
    const newX = player.x + dx * TILE_SIZE;
    const newY = player.y + dy * TILE_SIZE;

    // Используем Tween для плавного перехода
    scene.tweens.add({
        targets: player,
        x: newX,
        y: newY,
        duration: 200, // Скорость шага (в мс)
        ease: 'Linear',
        onComplete: () => {
            isMoving = false; // Разблокируем движение после завершения
            savePlayerPosition(); // Сохраняем новую позицию в БД
        }
    });
}

// 🔥 ФУНКЦИЯ СОХРАНЕНИЯ ПОЗИЦИИ В БД
function savePlayerPosition() {
    if (!player || !currentUserId) return; 

    // Сохраняем позицию, которая кратна TILE_SIZE/2 (центр тайла)
    db.collection('players').doc(currentUserId).set({
        x: player.x,
        y: player.y,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }); 
}

// 3. Игровой цикл
function update (time, delta)
{
    // Логика клавиатуры (WASD)
    if (cursors.left.isDown) {
        movePlayer(this, -1, 0);
    } else if (cursors.right.isDown) {
        movePlayer(this, 1, 0);
    } else if (cursors.up.isDown) {
        movePlayer(this, 0, -1);
    } else if (cursors.down.isDown) {
        movePlayer(this, 0, 1);
    }
    
    // Важно: для джойстика мы используем событие 'pointerup' в create, 
    // чтобы шаг совершался один раз, а не постоянно, как в update.
}