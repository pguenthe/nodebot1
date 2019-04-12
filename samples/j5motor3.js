var five = require("johnny-five"),
  board = new five.Board();

board.on("ready", function() {
  var leftMotor = new five.Motor({
    pins: {
      pwm: 5, //customized
      dir: 7,//customized
      cdir: 8
    }
  });

  var rightMotor = new five.Motor({
    pins: {
      pwm: 6, //customized
      dir: 11, //customized
      cdir: 9
    }
  });

  var motors = new five.Motors([leftMotor, rightMotor]);

  board.repl.inject({
    motors: motors
  });

  // set the motor going forward full speed
  leftMotor.reverse(255);
  rightMotor.reverse(255);

  board.wait(3000, function () {
    motors.stop();
  });

});