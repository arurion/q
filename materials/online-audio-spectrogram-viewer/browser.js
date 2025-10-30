function Browser() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('msie') != -1 || userAgent.indexOf('trident') != -1) {
        this.isIE = true;
    } else if (userAgent.indexOf('edge') != -1) {
        this.isEdge = true;
    } else if (userAgent.indexOf('chrome') != -1) {
        this.isChrome = true;
    } else if (userAgent.indexOf('safari') != -1) {
        this.isSafari = true;
    } else if (userAgent.indexOf('firefox') != -1) {
        this.isFirefox = true;
    } else if (userAgent.indexOf('opera') != -1) {
        this.isOpera = true;
    } else {
    }
}

const browser = new Browser();