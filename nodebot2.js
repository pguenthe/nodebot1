var leftMotor, rightMotor;

var five = require("johnny-five"),
  board = new five.Board();

board.on("ready", function() {
  leftMotor = new five.Motor({
    pins: {
      pwm: 5, //customized
      dir: 7,//customized
      cdir: 8
    }
  });

  rightMotor = new five.Motor({
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
});

var http = require('http');
var url = require('url');

//create a server object:
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});

  var params = url.parse(req.url, true).query;
  var left =  params.left ? params.left : 0;
  var right = params.right ? params.right : 0;

  leftMotor.forward(left);
  rightMotor.forward(right);

  res.write('Moving: ' + left + ',' + right); //write a response to the client
  res.end(); //end the response
}).listen(8080); //the server object listens on port 8080


