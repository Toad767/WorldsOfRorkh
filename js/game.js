let player; // Переменная для нашего персонажа
let cursors; // Переменная для управления

// Главная функция, которая запускает игру после аутентификации
function startGame() {
    const config = {
        type: Phaser.AUTO, 
        width: 800,
        height: 600,
        backgroundColor: '#303030', // Темный фон, как в Зоне
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };

    const game = new Phaser.Game(config);
}

// 1. Загрузка ресурсов
function preload ()
{
    // Загрузим пока простой квадрат для игрока
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/block.png');
}

// 2. Создание объектов сцены (наша первая локация)
function create ()
{
    // Задаем сообщение
    this.add.text(10, 10, 'Миры Роркха: Локация 01 (Заброшенный Пост)', { fontSize: '32px', fill: '#00ff00' });
    this.add.text(10, 50, 'Нажмите WASD для движения в Роркхе', { fontSize: '18px', fill: '#cccccc' });


    // Создаем игрока
    player = this.add.sprite(400, 300, 'player');
    player.setTint(0xcc3333); // Красный квадрат для игрока

    // Включаем управление с клавиатуры
    cursors = this.input.keyboard.addKeys({
        'up': Phaser.Input.Keyboard.KeyCodes.W,
        'down': Phaser.Input.Keyboard.KeyCodes.S,
        'left': Phaser.Input.Keyboard.KeyCodes.A,
        'right': Phaser.Input.Keyboard.KeyCodes.D
    });
}

// 3. Игровой цикл
function update (time, delta)
{
    // Проверка, что игрок создан (на всякий случай)
    if (!player) return;

    const speed = 3; // Скорость движения
    
    // Проверяем нажатия и двигаем игрока
    if (cursors.left.isDown)
    {
        player.x -= speed;
    }
    else if (cursors.right.isDown)
    {
        player.x += speed;
    }

    if (cursors.up.isDown)
    {
        player.y -= speed;
    }
    else if (cursors.down.isDown)
    {
        player.y += speed;
    }
}