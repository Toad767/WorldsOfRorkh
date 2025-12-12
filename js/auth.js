// /js/auth.js (ФИНАЛЬНАЯ ВЕРСИЯ)

// =========================================================
// ВАШ КОНФИГУРАЦИОННЫЙ ОБЪЕКТ FIREBASE (С ВАШИМИ КЛЮЧАМИ!)
// =========================================================
const firebaseConfig = {
  apiKey: "AIzaSyAGHdvrAlaiEnuGRFCpFQki4YCKEqe-lfs", // <-- ЗАМЕНИТЕ ЭТО!
  authDomain: "rorkh-1a613.firebaseapp.com",        // <-- ЗАМЕНИТЕ ЭТО!
  projectId: "rorkh-1a613",                        // <-- ЗАМЕНИТЕ ЭТО!
  storageBucket: "rorkh-1a613.firebasestorage.app",
  messagingSenderId: "616945852200",
  appId: "1:616945852200:web:5b768d4f95a95a3af93a1d",
  measurementId: "G-FQEGBRHLCZ"
};

// Инициализация Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
let currentUserId = null; // Для хранения ID вошедшего пользователя

// Получение элементов интерфейса
const authUI = document.getElementById('auth-ui');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const message = document.getElementById('auth-message');
const registerBtn = document.getElementById('register-btn');
const loginBtn = document.getElementById('login-btn');

// --- ФУНКЦИИ АУТЕНТИФИКАЦИИ ---

registerBtn.addEventListener('click', () => {
    auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
        .then((userCredential) => {
            message.textContent = "Регистрация успешна! Вход в Миры Роркха выполнен.";
            hideAuthUI();
        })
        .catch((error) => {
            message.textContent = "Ошибка регистрации: " + error.message;
        });
});

loginBtn.addEventListener('click', () => {
    auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value)
        .then((userCredential) => {
            message.textContent = "Успешный вход! С возвращением, Сталкер.";
            hideAuthUI();
        })
        .catch((error) => {
            message.textContent = "Ошибка входа: " + error.message;
        });
});

// Скрытие интерфейса входа и запуск игры (функция из game.js)
function hideAuthUI() {
    authUI.style.display = 'none';
    startGame(); 
}

// Проверка состояния при загрузке
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUserId = user.uid; // Сохраняем ID пользователя
        hideAuthUI();
    } else {
        authUI.style.display = 'block';
    }
});