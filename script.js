document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    // --- Логика смены тем ---
    const themeButtons = document.querySelectorAll('.theme-switcher button');
    
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.getAttribute('data-theme');
            
            // Удаляем все классы тем с body, чтобы избежать конфликтов
            body.classList.remove('theme-acid', 'theme-pink-purple', 'theme-neon');
            
            // Добавляем новый класс темы
            body.classList.add(theme);
        });
    });

    // --- Логика кастомного фона ---
    const bgInput = document.getElementById('custom-bg-input');
    const applyBgBtn = document.getElementById('apply-bg-btn');
    const resetBgBtn = document.getElementById('reset-bg-btn');

    // Применить кастомный фон
    applyBgBtn.addEventListener('click', () => {
        const url = bgInput.value.trim();
        if (url) {
            // Убираем анимацию и цвет от пресетов
            body.style.background = `url('${url}') no-repeat center center`;
            body.style.backgroundSize = 'cover';
            // Можно добавить класс, чтобы отключить анимацию в CSS, но JS-стили и так имеют приоритет
        }
    });

    // Сбросить фон к теме по умолчанию
    resetBgBtn.addEventListener('click', () => {
        // Очищаем инлайн-стили, чтобы стили из CSS (темы) снова применились
        body.style.background = '';
        body.style.backgroundSize = '';
        bgInput.value = '';
    });
});