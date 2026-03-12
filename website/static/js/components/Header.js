const Header = {
    create() {
        const header = document.createElement('header');
        header.className = 'header';

        const homeDiv = document.createElement('div');
        homeDiv.className = 'home';
        homeDiv.appendChild(Timer.create());

        const title = document.createElement('h2');
        title.className = 'title';
        title.textContent = 'Система тестирование доступности сайтов и приложений подключенных через VPN - сервисы';

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'buttons';

        header.appendChild(homeDiv);
        header.appendChild(title);
        header.appendChild(buttonsDiv);

        return header;
    }
};