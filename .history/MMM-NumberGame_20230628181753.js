Module.register('MMM-NumberGame', {

  start() {
    const self = this;

    Log.info("Starting module: " + self.name);

  },

  getStyles: function () {
    return ["MMM-NumberGame.css"];
  },

  getDom() {
    const wrapper = document.createElement('div');

    let markup = `
        <div class="wrapper">
            <div id="game_box">
                <div id="number"></div>
                <div id="player_message" class="hidden">
                Enter the number you saw: 
                <input type="text" id="player_guess"></input>
                </div>
                <div id="result_message"></div>
            </div>
        </div>  
    `;

    wrapper.innerHTML = markup;

    return wrapper;

  }

})