const Timer = {
    element: null,
    intervalId: null,

    create() {
        const timeElement = document.createElement('time');
        timeElement.className = 'timer';
        this.element = timeElement;
        this.start();
        return timeElement;
    },

    update() {
        if (this.element) {
            this.element.textContent = DateUtils.getDateTime();
            this.element.setAttribute('datetime', DateUtils.getDateTime());
        }
    },

    start() {
        this.update();
        this.intervalId = setInterval(() => this.update(), 1000);
    },

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    destroy() {
        this.stop();
        this.element = null;
    }
};