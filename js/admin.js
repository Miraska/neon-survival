// Административная панель
class AdminPanel {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('gameUsers')) || [];
        this.stickers = JSON.parse(localStorage.getItem('gameStickers')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('gameCurrentUser')) || null;
        this.init();
    }

    init() {
        this.checkAdminAccess();
        this.blockNavigation();
        this.initTabs();
        this.initModals();
        this.initForms();
        this.initSearch();
        this.loadStatistics();
        this.loadStickersTable();
        this.loadUsersTable();
        this.updateAdminInfo();
    }

    checkAdminAccess() {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            this.showNotification('Доступ запрещен. Требуются права администратора.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }
    }

    blockNavigation() {
        // Блокируем переход на главную страницу
        window.addEventListener('beforeunload', (e) => {
            // Предупреждение при попытке покинуть страницу
        });

        // Блокируем кнопку "Назад" браузера
        window.history.pushState(null, null, window.location.href);
        window.addEventListener('popstate', (e) => {
            window.history.pushState(null, null, window.location.href);
            this.showNotification('Администратор не может покинуть панель управления', 'error');
        });

        // Блокируем горячие клавиши
        document.addEventListener('keydown', (e) => {
            // Блокируем F5 (обновление)
            if (e.key === 'F5') {
                e.preventDefault();
                this.showNotification('Обновление страницы заблокировано', 'error');
            }
            
            // Блокируем Ctrl+R (обновление)
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.showNotification('Обновление страницы заблокировано', 'error');
            }
            
            // Блокируем Alt+Left (назад)
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.showNotification('Навигация заблокирована для администратора', 'error');
            }
        });
    }

    updateAdminInfo() {
        const adminNickname = document.getElementById('adminNickname');
        if (adminNickname && this.currentUser) {
            adminNickname.textContent = this.currentUser.nickname;
        }
    }

    initTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        const sections = document.querySelectorAll('.admin-section');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                tabs.forEach(t => t.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(tabName + 'Section').classList.add('active');

                if (tabName === 'stickers') {
                    this.loadStickersTable();
                } else if (tabName === 'users') {
                    this.loadUsersTable();
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
        // Форма редактирования стикера
        const editStickerForm = document.getElementById('editStickerForm');
        editStickerForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSticker(e.target);
        });

        // Кнопка добавления стикера
        const addStickerBtn = document.getElementById('addStickerBtn');
        addStickerBtn?.addEventListener('click', () => {
            this.showEditStickerModal();
        });

        // Кнопка выхода
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', () => {
            this.logout();
        });
    }

    initSearch() {
        const userSearch = document.getElementById('userSearch');
        const userFilter = document.getElementById('userFilter');

        userSearch?.addEventListener('input', () => {
            this.loadUsersTable();
        });

        userFilter?.addEventListener('change', () => {
            this.loadUsersTable();
        });
    }

    loadStatistics() {
        const totalUsers = this.users.filter(u => u.role !== 'admin').length;
        const totalStickers = this.stickers.length;
        const totalDownloads = this.users.reduce((sum, user) => sum + (user.downloadsCount || 0), 0);
        
        // Подсчет новых регистраций за сегодня
        const today = new Date().toDateString();
        const todayRegistrations = this.users.filter(user => {
            const userDate = new Date(user.registrationDate).toDateString();
            return userDate === today && user.role !== 'admin';
        }).length;

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalStickers').textContent = totalStickers;
        document.getElementById('totalDownloads').textContent = totalDownloads;
        document.getElementById('todayRegistrations').textContent = todayRegistrations;
    }

    loadStickersTable() {
        const stickersTable = document.getElementById('stickersTable');
        
        let tableHTML = `
            <div class="table-header stickers-header">
                <div>Изображение</div>
                <div>Название</div>
                <div>Описание</div>
                <div>Действия</div>
            </div>
        `;

        this.stickers.forEach(sticker => {
            tableHTML += `
                <div class="table-row stickers-row">
                    <div>
                        <img src="images/${sticker.id}.png" alt="${sticker.name}" class="sticker-preview" 
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMzMzIiByeD0iMTAiLz4KPHR3eHQgeD0iMzAiIHk9IjMwIiBmaWxsPSIjMDBmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LXNpemU9IjI0Ij4/PC90ZXh0Pgo8L3N2Zz4='">
                    </div>
                    <div><strong>${sticker.name}</strong></div>
                    <div>${sticker.description}</div>
                    <div class="table-actions">
                        <button class="btn-primary" onclick="adminPanel.editSticker('${sticker.id}')">
                            <span class="btn-icon">✏️</span>
                            Изменить
                        </button>
                        <button class="btn-danger" onclick="adminPanel.deleteSticker('${sticker.id}')">
                            <span class="btn-icon">🗑️</span>
                            Удалить
                        </button>
                    </div>
                </div>
            `;
        });

        stickersTable.innerHTML = tableHTML;
    }

    loadUsersTable() {
        const usersTable = document.getElementById('usersTable');
        const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
        const filterValue = document.getElementById('userFilter')?.value || 'all';
        
        // Фильтрация пользователей
        let filteredUsers = this.users.filter(u => u.role !== 'admin');
        
        // Поиск
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => 
                user.nickname.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm)
            );
        }
        
        // Фильтр по дате
        if (filterValue !== 'all') {
            const now = new Date();
            filteredUsers = filteredUsers.filter(user => {
                const userDate = new Date(user.registrationDate);
                const diffTime = now - userDate;
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                
                switch (filterValue) {
                    case 'today':
                        return diffDays < 1;
                    case 'week':
                        return diffDays < 7;
                    case 'month':
                        return diffDays < 30;
                    default:
                        return true;
                }
            });
        }

        let tableHTML = `
            <div class="table-header users-header">
                <div>Аватар</div>
                <div>Никнейм</div>
                <div>Email</div>
                <div>Дата регистрации</div>
                <div>Скачано</div>
                <div>Действия</div>
            </div>
        `;

        filteredUsers.forEach(user => {
            const registrationDate = new Date(user.registrationDate).toLocaleDateString('ru-RU');
            const downloadsCount = user.downloadsCount || 0;
            
            tableHTML += `
                <div class="table-row users-row">
                    <div>
                        <div class="user-avatar">${user.nickname.charAt(0).toUpperCase()}</div>
                    </div>
                    <div><strong>${user.nickname}</strong></div>
                    <div>${user.email}</div>
                    <div>${registrationDate}</div>
                    <div>${downloadsCount}</div>
                    <div class="table-actions">
                        <button class="btn-primary" onclick="adminPanel.viewUser('${user.id}')">
                            <span class="btn-icon">👁️</span>
                            Просмотр
                        </button>
                    </div>
                </div>
            `;
        });

        usersTable.innerHTML = tableHTML;
    }

    showEditStickerModal(stickerId = null) {
        const modal = document.getElementById('editStickerModal');
        const title = document.getElementById('editStickerTitle');
        const form = document.getElementById('editStickerForm');
        
        if (stickerId) {
            const sticker = this.stickers.find(s => s.id === stickerId);
            title.textContent = 'Редактировать стикер';
            document.getElementById('editStickerId').value = stickerId;
            document.getElementById('editStickerName').value = sticker.name;
            document.getElementById('editStickerDescription').value = sticker.description;
        } else {
            title.textContent = 'Добавить стикер';
            form.reset();
            document.getElementById('editStickerId').value = '';
        }

        modal.style.display = 'block';
    }

    editSticker(stickerId) {
        this.showEditStickerModal(stickerId);
    }

    deleteSticker(stickerId) {
        const sticker = this.stickers.find(s => s.id === stickerId);
        
        if (confirm(`Вы уверены, что хотите удалить стикер "${sticker.name}"?\nЭто действие нельзя отменить.`)) {
            this.stickers = this.stickers.filter(s => s.id !== stickerId);
            localStorage.setItem('gameStickers', JSON.stringify(this.stickers));
            this.loadStickersTable();
            this.loadStatistics();
            this.showNotification('Стикер успешно удален');
        }
    }

    saveSticker(form) {
        const formData = new FormData(form);
        const id = document.getElementById('editStickerId').value;
        const name = document.getElementById('editStickerName').value.trim();
        const description = document.getElementById('editStickerDescription').value.trim();

        if (!name || !description) {
            this.showNotification('Заполните все обязательные поля', 'error');
            return;
        }

        if (id) {
            // Редактирование существующего стикера
            const stickerIndex = this.stickers.findIndex(s => s.id === id);
            if (stickerIndex !== -1) {
                this.stickers[stickerIndex] = { 
                    ...this.stickers[stickerIndex], 
                    name, 
                    description 
                };
            }
        } else {
            // Добавление нового стикера
            const newId = 'sticker' + (Math.max(...this.stickers.map(s => 
                parseInt(s.id.replace('sticker', '')) || 0
            ), 0) + 1);
            
            const newSticker = {
                id: newId,
                name,
                description
            };
            this.stickers.push(newSticker);
        }

        localStorage.setItem('gameStickers', JSON.stringify(this.stickers));
        document.getElementById('editStickerModal').style.display = 'none';
        this.loadStickersTable();
        this.loadStatistics();
        this.showNotification(id ? 'Стикер успешно обновлен' : 'Стикер успешно добавлен');
    }

    viewUser(userId) {
        const user = this.users.find(u => u.id === userId);
        const modal = document.getElementById('viewUserModal');
        const userDetails = document.getElementById('userDetails');

        if (!user) {
            this.showNotification('Пользователь не найден', 'error');
            return;
        }

        const registrationDate = new Date(user.registrationDate).toLocaleDateString('ru-RU');
        const downloadsCount = user.downloadsCount || 0;
        const daysSinceJoin = Math.floor((new Date() - new Date(user.registrationDate)) / (1000 * 60 * 60 * 24));

        userDetails.innerHTML = `
            <div class="user-details">
                <div class="profile-avatar">${user.nickname.charAt(0).toUpperCase()}</div>
                <h3>${user.nickname}</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Роль:</strong> ${user.role === 'admin' ? 'Администратор' : 'Участник'}</p>
                <p><strong>Дата регистрации:</strong> ${registrationDate}</p>
                
                <div class="user-stats">
                    <div class="stat-item">
                        <div class="stat-value">${downloadsCount}</div>
                        <div class="stat-label">Скачано</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${daysSinceJoin}</div>
                        <div class="stat-label">Дней в игре</div>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    logout() {
        if (confirm('Вы уверены, что хотите выйти из админ-панели?')) {
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

// Инициализация админ-панели
const adminPanel = new AdminPanel(); 