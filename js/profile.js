// Профиль пользователя
class UserProfile {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('gameUsers')) || [];
        this.stickers = JSON.parse(localStorage.getItem('gameStickers')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('gameCurrentUser')) || null;
        this.init();
    }

    init() {
        this.checkUserAccess();
        this.initTabs();
        this.initModals();
        this.initForms();
        this.initSearch();
        this.loadProfile();
        this.loadDownloads();
        this.loadActivity();
        this.loadSettings();
    }

    checkUserAccess() {
        if (!this.currentUser) {
            this.showNotification('Необходимо войти в систему', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }
    }

    initTabs() {
        const tabs = document.querySelectorAll('.profile-tab');
        const sections = document.querySelectorAll('.profile-section');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                tabs.forEach(t => t.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(tabName + 'Section').classList.add('active');

                if (tabName === 'downloads') {
                    this.loadDownloads();
                } else if (tabName === 'activity') {
                    this.loadActivity();
                } else if (tabName === 'settings') {
                    this.loadSettings();
                }
            });
        });
    }

    initModals() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.close');
            
            closeBtn?.addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    initForms() {
        // Форма редактирования профиля
        const editProfileForm = document.getElementById('editProfileForm');
        editProfileForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile(e.target);
        });

        // Кнопка редактирования профиля
        const editProfileBtn = document.getElementById('editProfileBtn');
        editProfileBtn?.addEventListener('click', () => {
            this.showEditProfileModal();
        });

        // Кнопка выхода
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', () => {
            this.logout();
        });

        // Кнопки настроек
        const clearDataBtn = document.getElementById('clearDataBtn');
        clearDataBtn?.addEventListener('click', () => {
            this.clearUserData();
        });

        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        deleteAccountBtn?.addEventListener('click', () => {
            this.deleteAccount();
        });
    }

    initSearch() {
        const downloadSearch = document.getElementById('downloadSearch');
        downloadSearch?.addEventListener('input', () => {
            this.loadDownloads();
        });
    }

    loadProfile() {
        const user = this.currentUser;
        
        // Аватар
        const profileAvatar = document.getElementById('profileAvatar');
        profileAvatar.textContent = user.nickname.charAt(0).toUpperCase();
        
        // Основная информация
        document.getElementById('profileNickname').textContent = user.nickname;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileJoinDate').textContent = 
            new Date(user.registrationDate).toLocaleDateString('ru-RU');
        
        // Роль
        const roleElement = document.getElementById('profileRole');
        roleElement.textContent = user.role === 'admin' ? 'Администратор' : 'Участник';
        roleElement.className = user.role === 'admin' ? 'user-role role-admin' : 'user-role role-user';
        
        // Администраторы не должны попадать на страницу профиля
        if (user.role === 'admin') {
            this.showNotification('Администратор перенаправлен в панель управления', 'info');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);
            return;
        }
        
        // Статистика
        const downloadsCount = user.downloadsCount || 0;
        const daysSinceJoin = Math.floor((new Date() - new Date(user.registrationDate)) / (1000 * 60 * 60 * 24));
        const progress = Math.min((downloadsCount / this.stickers.length) * 100, 100);
        
        document.getElementById('totalDownloads').textContent = downloadsCount;
        document.getElementById('daysSinceJoin').textContent = daysSinceJoin;
        document.getElementById('profileProgress').textContent = Math.round(progress) + '%';
        
        // Ранг
        const rank = this.calculateUserRank(downloadsCount, daysSinceJoin);
        document.getElementById('userRank').textContent = rank;
    }

    calculateUserRank(downloads, days) {
        if (downloads === 0) return 'Новичок';
        if (downloads < 3) return 'Исследователь';
        if (downloads < 5) return 'Коллекционер';
        if (downloads >= this.stickers.length) return 'Мастер';
        return 'Охотник';
    }

    loadDownloads() {
        const downloadsList = document.getElementById('downloadsList');
        const searchTerm = document.getElementById('downloadSearch')?.value.toLowerCase() || '';
        
        const userDownloads = this.currentUser.downloads || [];
        
        // Фильтрация по поиску
        let filteredDownloads = userDownloads;
        if (searchTerm) {
            filteredDownloads = userDownloads.filter(download => {
                const sticker = this.stickers.find(s => s.id === download.stickerId);
                return sticker && sticker.name.toLowerCase().includes(searchTerm);
            });
        }

        if (filteredDownloads.length === 0) {
            downloadsList.innerHTML = `
                <div style="text-align: center; color: #888; padding: 40px;">
                    <h3>Нет скачиваний</h3>
                    <p>Вы еще не скачали ни одного стикера</p>
                    <a href="index.html#stickers" class="btn-primary">Перейти к стикерам</a>
                </div>
            `;
            return;
        }

        let downloadsHTML = '';
        filteredDownloads.forEach(download => {
            const sticker = this.stickers.find(s => s.id === download.stickerId);
            if (sticker) {
                const downloadDate = new Date(download.downloadDate).toLocaleDateString('ru-RU');
                
                downloadsHTML += `
                    <div class="download-item">
                        <div class="download-item-header">
                            <div class="download-item-preview">
                                ${sticker.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="download-item-info">
                                <h4>${sticker.name}</h4>
                                <div class="download-item-date">${downloadDate}</div>
                            </div>
                        </div>
                        <div class="download-item-description">
                            ${sticker.description}
                        </div>
                    </div>
                `;
            }
        });

        downloadsList.innerHTML = downloadsHTML;
    }

    loadActivity() {
        const activityTimeline = document.getElementById('activityTimeline');
        const activities = this.generateUserActivity();
        
        if (activities.length === 0) {
            activityTimeline.innerHTML = `
                <div style="text-align: center; color: #888; padding: 40px;">
                    <h3>Нет активности</h3>
                    <p>Начните использовать сайт, чтобы увидеть историю активности</p>
                </div>
            `;
            return;
        }

        let timelineHTML = '';
        activities.forEach(activity => {
            const activityDate = new Date(activity.date).toLocaleDateString('ru-RU');
            const activityTime = new Date(activity.date).toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            timelineHTML += `
                <div class="activity-item">
                    <div class="activity-item-header">
                        <h4 class="activity-item-title">${activity.title}</h4>
                        <span class="activity-item-time">${activityDate} ${activityTime}</span>
                    </div>
                    <div class="activity-item-description">
                        ${activity.description}
                    </div>
                </div>
            `;
        });

        activityTimeline.innerHTML = timelineHTML;
    }

    generateUserActivity() {
        const activities = [];
        
        // Добавляем регистрацию
        activities.push({
            title: 'Регистрация в NEON SURVIVAL',
            description: 'Добро пожаловать в киберпанк-арену! Вы успешно зарегистрировались.',
            date: this.currentUser.registrationDate
        });
        
        // Добавляем скачивания
        const downloads = this.currentUser.downloads || [];
        downloads.forEach(download => {
            const sticker = this.stickers.find(s => s.id === download.stickerId);
            if (sticker) {
                activities.push({
                    title: `Скачан стикер "${sticker.name}"`,
                    description: `Вы скачали стикер из коллекции NEON SURVIVAL.`,
                    date: download.downloadDate
                });
            }
        });
        
        // Сортировка по дате (новые сверху)
        return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    loadSettings() {
        const settings = this.currentUser.settings || {};
        
        // Загрузка настроек уведомлений
        document.getElementById('emailNotifications').checked = settings.emailNotifications !== false;
        document.getElementById('pushNotifications').checked = settings.pushNotifications !== false;
        document.getElementById('publicProfile').checked = settings.publicProfile === true;
        document.getElementById('showStats').checked = settings.showStats !== false;
        
        // Обработчики изменения настроек
        const checkboxes = document.querySelectorAll('#settingsSection input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.saveSettings();
            });
        });
    }

    saveSettings() {
        const settings = {
            emailNotifications: document.getElementById('emailNotifications').checked,
            pushNotifications: document.getElementById('pushNotifications').checked,
            publicProfile: document.getElementById('publicProfile').checked,
            showStats: document.getElementById('showStats').checked
        };
        
        this.currentUser.settings = settings;
        this.updateUserInStorage();
        this.showNotification('Настройки сохранены');
    }

    showEditProfileModal() {
        const modal = document.getElementById('editProfileModal');
        
        // Заполняем форму текущими данными
        document.getElementById('editNickname').value = this.currentUser.nickname;
        document.getElementById('editEmail').value = this.currentUser.email;
        document.getElementById('editPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        modal.style.display = 'block';
    }

    saveProfile(form) {
        const nickname = document.getElementById('editNickname').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const password = document.getElementById('editPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!nickname || !email) {
            this.showNotification('Заполните все обязательные поля', 'error');
            return;
        }

        // Проверка email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this.showNotification('Введите корректный email', 'error');
            return;
        }

        // Проверка пароля
        if (password && password !== confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }

        // Проверка уникальности email
        const emailExists = this.users.some(user => 
            user.email === email && user.id !== this.currentUser.id
        );
        if (emailExists) {
            this.showNotification('Пользователь с таким email уже существует', 'error');
            return;
        }

        // Обновление данных
        this.currentUser.nickname = nickname;
        this.currentUser.email = email;
        if (password) {
            this.currentUser.password = password; // В реальном приложении нужно хешировать
        }

        this.updateUserInStorage();
        this.loadProfile();
        
        document.getElementById('editProfileModal').style.display = 'none';
        this.showNotification('Профиль успешно обновлен');
    }

    updateUserInStorage() {
        // Обновляем в массиве пользователей
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex] = this.currentUser;
            localStorage.setItem('gameUsers', JSON.stringify(this.users));
        }
        
        // Обновляем текущего пользователя
        localStorage.setItem('gameCurrentUser', JSON.stringify(this.currentUser));
    }

    clearUserData() {
        if (confirm('Вы уверены, что хотите очистить все ваши данные?\nЭто действие нельзя отменить.')) {
            this.currentUser.downloads = [];
            this.currentUser.downloadsCount = 0;
            this.updateUserInStorage();
            this.loadProfile();
            this.loadDownloads();
            this.loadActivity();
            this.showNotification('Данные очищены');
        }
    }

    deleteAccount() {
        if (confirm('Вы уверены, что хотите удалить свой аккаунт?\nЭто действие нельзя отменить.')) {
            if (confirm('Это действие безвозвратно удалит все ваши данные. Продолжить?')) {
                // Удаляем пользователя из массива
                this.users = this.users.filter(u => u.id !== this.currentUser.id);
                localStorage.setItem('gameUsers', JSON.stringify(this.users));
                localStorage.removeItem('gameCurrentUser');
                
                this.showNotification('Аккаунт удален');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        }
    }

    logout() {
        if (confirm('Вы уверены, что хотите выйти из профиля?')) {
            localStorage.removeItem('gameCurrentUser');
            this.showNotification('Вы вышли из системы');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
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

// Глобальные функции
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
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

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Инициализация профиля
const userProfile = new UserProfile(); 