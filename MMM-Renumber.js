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

  async showNumber() {
    let n = Math.floor(Math.random() * 9)
    document.querySelector('#number').innerHTML = n;
  
    await sleep(1500);
  
    document.querySelector('#number').innerHTML = document.querySelector('#number').innerHTML.replace(/\w|\W/gi, '*');
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

})