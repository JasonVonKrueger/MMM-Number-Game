Module.register('MMM-Renumber', {

  start() {
    const self = this;

    Log.info("Starting module: " + self.name);


  },

  getStyles: function () {
    return ["MMM-Renumber.css"];
  },

  getDom() {
    const wrapper = document.createElement('div');

    let markup = `
          <div id="mmm-renumber" class="wrapper">
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

    showNumber()

    return wrapper;

  },

  async handleGuess(data) {
    document.querySelector('#player_guess').value += data.number;
    COMPONENT.player_guesses.push(parseInt(data.number));

    if (COMPONENT.player_guesses.length === COMPONENT.numbers.length) {
      if (COMPONENT.player_guesses.join('') === COMPONENT.numbers.join('')) {
        COMPONENT.querySelector('#result_message').innerHTML = 'Good job!';
        await sleep(1200);
        reset(true);
      } else {
        COMPONENT.querySelector('#result_message').innerHTML = 'Nope! Try again.';
        await sleep(1200);
        reset(false);
      }
    }
  },

  async showNumber() {
    let n = Math.floor(Math.random() * 9)
    document.querySelector('#number').innerHTML = n;

    await sleep(1500);

    document.querySelector('#number').innerHTML = document.querySelector('#number').innerHTML.replace(/\w|\W/gi, '*');
  },

  reset(result) {
    if (result) COMPONENT.level++
    else COMPONENT.level = 1

    COMPONENT.numbers.length = 0;
    COMPONENT.player_guesses.length = 0;
    COMPONENT.querySelector('#player_message').classList.add('hidden');
    COMPONENT.querySelector('#player_guess').value = '';
    COMPONENT.querySelector('#result_message').innerHTML = '';

    showNumber();
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

})