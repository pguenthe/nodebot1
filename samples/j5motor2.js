var five = require("johnny-five"),
  board = new five.Board();

board.on("ready", function() {
  var motor1;

  motor1 = new five.Motor({
    pins: {
      pwm: 5,
      dir: 7
    }
  });

  motor2 = new five.Motor({
    pins: {
      pwm: 5,
      dir: 8
    }
  });

  board.repl.inject({
    motor: motor1,
    motor: motor2
  });

  console.log('forward');
  motor2.forward(255);

});