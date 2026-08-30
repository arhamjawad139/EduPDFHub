        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme');
            const target = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', target);
            const icon = document.querySelector('#themeToggleBtn i');
            icon.className = target === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
}