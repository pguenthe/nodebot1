var leftMotor, rightMotor;
var maxSpeed = 250;
var deadzone = maxSpeed * .15;

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

five.drive =  function(left, right){
  left = left / 100 * maxSpeed;
  right = right / 100 * maxSpeed;

  if (left > deadzone) {
   leftMotor.forward(left);
  } else if (left < -1 * deadzone) {
    leftMotor.reverse(-1 * left);
  } else {
    leftMotor.stop();
  }

  if (right > deadzone) {
    rightMotor.forward(right);
   } else if (right < -1 * deadzone) {
    rightMotor.reverse(-1 * right);
   } else {
    rightMotor.stop();
   }

   console.log ('Running ' + left + ',' + right);
};

var http = require('http');
var url = require('url');
var fs =  require('fs');

function serveFile(path, res) {
  if (path === '/') {
    path = 'index.html';
  } else {
    path = path.substring(1); //drop the initial /
  }

  var contentType = '';
  if (path.endsWith('.html')) {
    contentType = 'text/html';
  } else if (path.endsWith('.png')) {
    contentType = 'image/png';
  }

  fs.readFile(path, function(err, data){
    if(err){
      res.statusCode = 500;
      res.end(`Error getting the file: ${err}.`);
    } else {
      res.setHeader('Content-type', contentType);
      res.end(data);
    }
  });
}

//create a server object:
http.createServer(function (req, res) {
  var path = url.parse(req.url).pathname;
  console.log('Request received on path ' + path);

  if (path === '/drive') {
    var params = url.parse(req.url, true).query;
    var left =  params.left ? params.left : 0;
    var right = params.right ? params.right : 0;
    console.log ('Request received ' + left + ',' + right);

    five.drive(left, right);
    res.setHeader('Content-type', 'text/plain' );
    res.write('Set speed to ' + left + ',' + right);
    res.end();
  } else {
    serveFile(path, res);
  }
}).listen(8080); 