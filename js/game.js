// /js/game.js (ФИНАЛЬНАЯ ВЕРСИЯ: МОБИЛЬНЫЕ НАСТРОЙКИ + FIREBASE)

let player;     // Персонаж
let db;         // Объект для работы с Firestore
let currentUserId; // ID пользователя
let joystick;   // Объект джойстика
let cursors;    // Управление для ПК

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
    this.add.text(10, 10, 'Миры Роркха: Локация 01', { fontSize: '32px', fill: '#00ff00' }).setScrollFactor(0);
    this.add.text(10, 50, 'Двигайтесь джойстиком или WASD', { fontSize: '18px', fill: '#cccccc' }).setScrollFactor(0);
    
    // Создаем игрока
    player = this.add.sprite(400, 300, 'player');
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

    // Управление с клавиатуры (для ПК-тестирования)
    cursors = this.input.keyboard.addKeys({
        'up': Phaser.Input.Keyboard.KeyCodes.W,
        'down': Phaser.Input.Keyboard.KeyCodes.S,
        'left': Phaser.Input.Keyboard.KeyCodes.A,
        'right': Phaser.Input.Keyboard.KeyCodes.D
    });

    // 🕹️ СОЗДАНИЕ ВИРТУАЛЬНОГО ДЖОЙСТИКА
    joystick = this.plugins.get('rexVirtualJoystick').add(this, {
        x: 100, // Позиция внизу слева
        y: 500,
        radius: 50,
        base: this.add.circle(0, 0, 50, 0x888888).setAlpha(0.5), 
        thumb: this.add.circle(0, 0, 25, 0xcccccc).setAlpha(0.8),
        forceMin: 16
    }).on('update', function () {
        // Логика движения обрабатывается в update()
    }, this);
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
    if (!player) return;

    const speed = 3; 
    let moved = false;
    let dx = 0;
    let dy = 0;
    
    // 1. Управление с КЛАВИАТУРЫ
    if (cursors.left.isDown) { dx = -1; moved = true; }
    else if (cursors.right.isDown) { dx = 1; moved = true; }
    if (cursors.up.isDown) { dy = -1; moved = true; }
    else if (cursors.down.isDown) { dy = 1; moved = true; }

    // 2. Управление с ДЖОЙСТИКА (если активен)
    if (joystick.force != 0) {
        dx = joystick.forceX;
        dy = joystick.forceY;
        moved = true;
    }

    if (moved) {
        // Применяем движение
        player.x += dx * speed;
        player.y += dy * speed;
        
        // Сохраняем позицию
        savePlayerPosition();
    }
}