// Основной класс приложения
class GameApp {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('gameUsers')) || [];
        this.stickers = JSON.parse(localStorage.getItem('gameStickers')) || this.getDefaultStickers();
        this.currentUser = JSON.parse(localStorage.getItem('gameCurrentUser')) || null;
        
        console.log('Инициализация приложения:');
        console.log('Пользователи:', this.users);
        console.log('Текущий пользователь:', this.currentUser);
        
        this.init();
    }

    init() {
        this.checkAdminRedirect();
        this.initSlider();
        this.initBurgerMenu();
        this.initAccordion();
        this.initAuth();
        this.initDownloads();
        this.initScrolling();
        this.initAnimations();
        this.updateAuthButtons();
        this.createDefaultAdmin();
    }

    checkAdminRedirect() {
        // Если текущий пользователь - администратор, перенаправляем в админ-панель
        if (this.currentUser && this.currentUser.role === 'admin') {
            this.showNotification('Администратор перенаправлен в панель управления', 'info');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);
            return;
        }
    }

    // Слайдер
    initSlider() {
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.dot');
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        let currentSlide = 0;

        const showSlide = (index) => {
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            slides[index].classList.add('active');
            dots[index].classList.add('active');
        };

        const nextSlide = () => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        };

        const prevSlide = () => {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        };

        nextBtn?.addEventListener('click', nextSlide);
        prevBtn?.addEventListener('click', prevSlide);

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
            });
        });

        // Автоматическая смена слайдов
        setInterval(nextSlide, 5000);
    }

    // Бургер меню
    initBurgerMenu() {
        const burgerMenu = document.querySelector('.burger-menu');
        const mobileNav = document.querySelector('.mobile-nav');
        
        burgerMenu?.addEventListener('click', () => {
            burgerMenu.classList.toggle('active');
            mobileNav.classList.toggle('active');
        });

        // Закрытие меню при клике на ссылку
        const mobileLinks = document.querySelectorAll('.mobile-nav-link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                burgerMenu.classList.remove('active');
                mobileNav.classList.remove('active');
            });
        });
    }

    // Аккордеон FAQ
    initAccordion() {
        const accordionItems = document.querySelectorAll('.accordion-item');
        
        accordionItems.forEach(item => {
            const header = item.querySelector('.accordion-header');
            
            header?.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Закрываем все остальные
                accordionItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                });
                
                // Открываем текущий, если он не был активен
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    }

    // Система авторизации
    initAuth() {
        const modal = document.getElementById('authModal');
        const navLoginBtn = document.getElementById('navLoginBtn');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        const heroLoginBtn1 = document.getElementById('heroLoginBtn1');
        const heroLoginBtn2 = document.getElementById('heroLoginBtn2');
        const heroLoginBtn3 = document.getElementById('heroLoginBtn3');
        const navLogoutBtn = document.getElementById('navLogoutBtn');
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        const closeBtn = modal?.querySelector('.close');
        const authTabs = document.querySelectorAll('.auth-tab');
        const authForms = document.querySelectorAll('.auth-form');

        // Открытие модального окна для всех кнопок входа
        const openModal = () => {
            modal.style.display = 'block';
        };

        navLoginBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
        mobileLoginBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
        heroLoginBtn1?.addEventListener('click', openModal);
        heroLoginBtn2?.addEventListener('click', openModal);
        heroLoginBtn3?.addEventListener('click', openModal);

        // Закрытие модального окна
        closeBtn?.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Переключение табов
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabType = tab.dataset.tab;
                
                authTabs.forEach(t => t.classList.remove('active'));
                authForms.forEach(f => f.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(tabType + 'Form').classList.add('active');
            });
        });

        // Обработка форм
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        loginForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e.target);
        });

        registerForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister(e.target);
        });

        // Выход для всех кнопок выхода
        navLogoutBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });
        mobileLogoutBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });
    }

    handleLogin(form) {
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');

        console.log('Попытка входа:', { email, password });
        console.log('Зарегистрированные пользователи:', this.users);

        // Проверяем, что данные получены
        if (!email || !password) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }

        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('gameCurrentUser', JSON.stringify(user));
            document.getElementById('authModal').style.display = 'none';
            
            // Если администратор - перенаправляем в админ-панель
            if (user.role === 'admin') {
                this.showNotification(`Добро пожаловать, ${user.nickname}! Перенаправление в админ-панель...`);
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1500);
            } else {
                this.updateAuthButtons();
                this.showNotification(`Добро пожаловать, ${user.nickname}!`);
            }
        } else {
            this.showNotification('Неверный email или пароль', 'error');
            console.log('Пользователь не найден для:', { email, password });
        }
    }

    handleRegister(form) {
        const formData = new FormData(form);
        const nickname = formData.get('nickname');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        console.log('Попытка регистрации:', { nickname, email, password, confirmPassword });

        // Валидация
        if (!nickname || !email || !password || !confirmPassword) {
            this.showNotification('Заполните все поля', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this.showNotification('Введите корректный email', 'error');
            return;
        }

        if (this.users.some(u => u.email === email)) {
            this.showNotification('Пользователь с таким email уже существует', 'error');
            return;
        }

        // Создание пользователя
        const newUser = {
            id: 'user_' + Date.now(),
            nickname,
            email,
            password,
            role: 'user',
            registrationDate: new Date().toISOString(),
            downloads: [],
            downloadsCount: 0
        };

        this.users.push(newUser);
        localStorage.setItem('gameUsers', JSON.stringify(this.users));

        this.currentUser = newUser;
        localStorage.setItem('gameCurrentUser', JSON.stringify(newUser));
        
        this.updateAuthButtons();
        document.getElementById('authModal').style.display = 'none';
        this.showNotification(`Регистрация успешна! Добро пожаловать, ${nickname}!`);
        
        console.log('Пользователь зарегистрирован:', newUser);
    }

    handleLogout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            this.currentUser = null;
            localStorage.removeItem('gameCurrentUser');
            this.updateAuthButtons();
            this.showNotification('Вы вышли из системы');
        }
    }

    updateAuthButtons() {
        const navLoginBtn = document.getElementById('navLoginBtn');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        const navLogoutBtn = document.getElementById('navLogoutBtn');
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        const profileBtn = document.getElementById('profileBtn');
        const mobileProfileBtn = document.getElementById('mobileProfileBtn');
        const adminBtn = document.getElementById('adminBtn');

        if (this.currentUser) {
            // Скрываем кнопки входа
            if (navLoginBtn) navLoginBtn.style.display = 'none';
            if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
            
            // Показываем кнопки выхода
            if (navLogoutBtn) navLogoutBtn.style.display = 'flex';
            if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'flex';
            
            // Для администратора не показываем кнопки навигации
            if (this.currentUser.role === 'admin') {
                if (profileBtn) profileBtn.style.display = 'none';
                if (mobileProfileBtn) mobileProfileBtn.style.display = 'none';
                if (adminBtn) adminBtn.style.display = 'none';
            } else {
                if (profileBtn) profileBtn.style.display = 'flex';
                if (mobileProfileBtn) mobileProfileBtn.style.display = 'flex';
                if (adminBtn) adminBtn.style.display = 'none';
            }
        } else {
            // Показываем кнопки входа
            if (navLoginBtn) navLoginBtn.style.display = 'flex';
            if (mobileLoginBtn) mobileLoginBtn.style.display = 'flex';
            
            // Скрываем кнопки выхода
            if (navLogoutBtn) navLogoutBtn.style.display = 'none';
            if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';
            
            if (profileBtn) profileBtn.style.display = 'none';
            if (mobileProfileBtn) mobileProfileBtn.style.display = 'none';
            if (adminBtn) adminBtn.style.display = 'none';
        }
    }

    // Скачивание стикеров
    initDownloads() {
        const downloadBtns = document.querySelectorAll('.download-btn');
        
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const stickerId = btn.dataset.sticker;
                this.downloadSticker(stickerId);
            });
        });
    }

    downloadSticker(stickerId) {
        if (!this.currentUser) {
            this.showNotification('Войдите в систему для скачивания стикеров', 'error');
            document.getElementById('authModal').style.display = 'block';
            return;
        }

        const sticker = this.stickers.find(s => s.id === stickerId);
        if (!sticker) {
            this.showNotification('Стикер не найден', 'error');
            return;
        }

        // Проверяем, не скачивал ли уже пользователь этот стикер
        const userDownloads = this.currentUser.downloads || [];
        if (userDownloads.some(d => d.stickerId === stickerId)) {
            this.showNotification('Вы уже скачали этот стикер', 'error');
            return;
        }

        // Добавляем скачивание
        const download = {
            stickerId,
            downloadDate: new Date().toISOString()
        };

        this.currentUser.downloads = userDownloads;
        this.currentUser.downloads.push(download);
        this.currentUser.downloadsCount = (this.currentUser.downloadsCount || 0) + 1;

        // Обновляем данные в localStorage
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex] = this.currentUser;
            localStorage.setItem('gameUsers', JSON.stringify(this.users));
        }
        localStorage.setItem('gameCurrentUser', JSON.stringify(this.currentUser));

        // Имитация скачивания файла
        const link = document.createElement('a');
        link.href = `images/${stickerId}.png`;
        link.download = `${sticker.name}.png`;
        link.click();

        this.showNotification(`Стикер "${sticker.name}" скачан!`);
    }

    // Плавная прокрутка
    initScrolling() {
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        
        navLinks.forEach(link => {
            // Пропускаем кнопки авторизации и профиля
            if (link.id === 'navLoginBtn' || link.id === 'navLogoutBtn' || 
                link.id === 'mobileLoginBtn' || link.id === 'mobileLogoutBtn' ||
                link.id === 'mobileProfileBtn') {
                return;
            }
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                
                // Проверяем, что это якорная ссылка
                if (href && href.startsWith('#')) {
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    // Анимации при скролле
    initAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, { threshold: 0.1 });

        const animatedElements = document.querySelectorAll('.round-card, .sticker-card, .faq-item');
        animatedElements.forEach(el => observer.observe(el));
    }

    // Стикеры по умолчанию
    getDefaultStickers() {
        return [
            {
                id: 'sticker1',
                name: 'Нейро-интерфейс',
                description: 'Голографический интерфейс, который считывает мысли и эмоции участников арены.'
            },
            {
                id: 'sticker2', 
                name: 'Кибер-код',
                description: 'Загадочная последовательность символов, открывающая доступ к скрытым уровням.'
            },
            {
                id: 'sticker3',
                name: 'Цифровой страж',
                description: 'ИИ-защитник, охраняющий самые ценные данные в системе арены.'
            },
            {
                id: 'sticker4',
                name: 'ID 001',
                description: 'Уникальный идентификатор первого участника, вошедшего в систему.'
            },
            {
                id: 'sticker5',
                name: 'Квантовые сферы',
                description: 'Нестабильные энергетические образования из квантового моста.'
            },
            {
                id: 'sticker6',
                name: 'Неоновый символ',
                description: 'Светящийся знак победителя, который получает только финалист арены.'
            }
        ];
    }

    createDefaultAdmin() {
        const adminExists = this.users.some(u => u.role === 'admin');
        
        if (!adminExists) {
            const admin = {
                id: 'admin_001',
                nickname: 'НеонАдмин',
                email: 'admin@neonsurvival.com',
                password: 'admin123',
                role: 'admin',
                registrationDate: new Date().toISOString(),
                downloads: [],
                downloadsCount: 0
            };
            
            this.users.push(admin);
            localStorage.setItem('gameUsers', JSON.stringify(this.users));
            console.log('Создан администратор по умолчанию:', admin);
        }

        // Сохраняем стикеры
        localStorage.setItem('gameStickers', JSON.stringify(this.stickers));
        
        // Добавляем тестового пользователя для отладки
        const testUserExists = this.users.some(u => u.email === 'test@test.com');
        if (!testUserExists) {
            const testUser = {
                id: 'user_test',
                nickname: 'Тестер',
                email: 'test@test.com',
                password: '123456',
                role: 'user',
                registrationDate: new Date().toISOString(),
                downloads: [],
                downloadsCount: 0
            };
            
            this.users.push(testUser);
            localStorage.setItem('gameUsers', JSON.stringify(this.users));
            console.log('Создан тестовый пользователь:', testUser);
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        let backgroundColor = '#4CAF50'; // success
        if (type === 'error') backgroundColor = '#ff6b6b';
        if (type === 'info') backgroundColor = '#2196F3';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 500;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Добавляем стили для уведомлений
const notificationStyles = `
@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Инициализация приложения
const gameApp = new GameApp();

// Функция для очистки данных (для отладки)
window.clearGameData = function() {
    localStorage.removeItem('gameUsers');
    localStorage.removeItem('gameStickers');
    localStorage.removeItem('gameCurrentUser');
    console.log('Данные очищены. Перезагрузите страницу.');
    location.reload();
};

// Функция для просмотра данных (для отладки)
window.showGameData = function() {
    console.log('=== ДАННЫЕ ИГРЫ ===');
    console.log('Пользователи:', JSON.parse(localStorage.getItem('gameUsers') || '[]'));
    console.log('Стикеры:', JSON.parse(localStorage.getItem('gameStickers') || '[]'));
    console.log('Текущий пользователь:', JSON.parse(localStorage.getItem('gameCurrentUser') || 'null'));
    console.log('==================');
}; 