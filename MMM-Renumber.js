Module.register('MMM-Renumber', {
  defaults: {

  },

  start() {
    //const self = this;
    this.numbers = [];
    this.player_guesses = [];
    this.level = 1;
    this.hidden = true;
    this.max_levels = this.config.maxLevels || 10;

    Log.info("Starting module: " + this.name);
  },

  getStyles: function () {
    return ["MMM-Renumber.css"];
  },

  getDom() {
    const wrapper = document.createElement('div');

    let markup = `
          <div id="mmm-renumber">
            <div class="title">Renumber</div>
            <div id="game_box">
            <div id="number"></div>
            <div id="player_message" class="hidden">
              Enter the number you saw: 
              <input type="text" id="player_guess" />
            </div>
            <div id="result_message"></div> 
            </div>
          </div> 
    `;

    wrapper.innerHTML = markup;
    //this.sendSocketNotification('RENUMBER_', this.config);
    //self.showNumber();
    //wrapper.classList.add('hidden');
    return wrapper;

  },

  async handleGuess(data) {
    document.querySelector('#player_guess').value += data.number;
    this.player_guesses.push(parseInt(data.number));

    if (this.player_guesses.length === this.numbers.length) {
      if (this.player_guesses.join('') === this.numbers.join('')) {
        this.querySelector('#result_message').innerHTML = 'Good job!';
        await this.sleep(1200);
        reset(true);
      } 
      else {
        this.querySelector('#result_message').innerHTML = 'Nope! Try again.';
        await this.sleep(1200);
        reset(false);
      }
    }
  },

  async showNumber() {
    let n = Math.floor(Math.random() * 9)
    document.querySelector('#number').innerHTML = n;

    await this.sleep(1500);

    document.querySelector('#number').innerHTML = document.querySelector('#number').innerHTML.replace(/\w|\W/gi, '*');
  },

  reset(result) {
    if (result) this.level++;
    else this.level = 1;

    //this.config.maxLevels

    this.numbers.length = 0;
    this.player_guesses.length = 0;
    this.querySelector('#player_message').classList.add('hidden');
    this.querySelector('#player_guess').value = '';
    this.querySelector('#result_message').innerHTML = '';

    //this.showNumber();
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // sendSocketNotification(notification, payload) {
  //   this.socket().sendNotification(notification, payload);
  // },

  notificationReceived: function(notification, payload, sender) {
    if (sender) {
      Log.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name);
    } else {
      Log.log(this.name + " received a system notification: " + notification);
    }
  },

  socketNotificationReceived(notification, payload) {
    //this.hide();
    //document.querySelector('#number').innerHTML = JSON.stringify(payload);
    Log.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
  },

})