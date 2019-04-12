var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function() {
  var servo = new five.Servo({
    id: "MyServo",     // User defined id
    pin: 3,           // Which pin is it attached to?
    type: "standard",  // Default: "standard". Use "continuous" for continuous rotation servos
    range: [10,170],    // Default: 0-180
    fps: 100,          // Used to calculate rate of movement between positions
    invert: false,     // Invert all specified positions
    startAt: 90,       // Immediately move to a degree
    center: true,      // overrides startAt if true and moves the servo to the center of the range
  });
 
  // Add servo to REPL (optional)
  this.repl.inject({
    servo: servo
  });

  var degrees = servo.position;
  var increment = 10;
  servo.to(degrees);

  function advance () {
    console.log(degrees);
    degrees += increment;
    if (degrees >= servo.range[1]) { 
        degrees = servo.range[1]; 
        increment *= -1;
    } else if (degrees <= servo.range[0]) {
        degrees = servo.range[0];
        increment *= -1;
    }
    servo.to(degrees);
    
    board.wait(500, function() {
        advance();
      });
  };

  advance();

});