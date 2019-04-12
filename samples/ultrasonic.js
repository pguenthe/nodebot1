var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function() {
  board.pins[4].type = 
  // Add servo to REPL (optional)
  this.repl.inject({
    servo: servo
  });

  function ping () {
    
    console.log();
    board.wait(500, function() {
        ping();
      });
  };

  ping();

});