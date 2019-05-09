var TinCan = require("tincanjs");

var leftMotor, rightMotor;
var leftSensor, middleSensor, rightSensor;
var proximitySensor;

var maxSpeed = 250;
var deadzone = maxSpeed * .15;
var name = '';
var mbox = '';

var complete;
var curbChecks;

var five = require("johnny-five"),
  board = new five.Board({
    repl: false,
    debug: false,
  });

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

  leftSensor = new five.Sensor.Digital(2);
  leftSensor.on("change", function() {
    //crossed on the left side
    if (this.value === 0) {
      triggered("Left");
      curbChecks++;
    }
  });

  middleSensor = new five.Sensor.Digital(4);
  middleSensor.on("change", function() {
    //crossed in the middle
    if (this.value === 0) {
      triggered("Middle");
      curbChecks++;
    }
  });

  rightSensor = new five.Sensor.Digital(10);
  rightSensor.on("change", function() {
    //crossed on the right side 
    if (this.value === 0) {
      triggered("Right");
      curbChecks++;
    }
  });

  proximitySensor = new five.Proximity({
    controller: "HCSR04",
    pin: "A4"
  });
  proximitySensor.on("change", function() {
    //console.log("inches: ", this.inches);
    //console.log("cm: ", this.cm);
    //if it's less than 6"
    if (!complete && this.inches <= 6) {
      completed();
    }
  });

  //board.repl.inject({
  //  motors: motors
  //});
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

var lrs;

try {
    lrs = new TinCan.LRS(
        {
            endpoint: "https://cloud.scorm.com/lrs/8UD9BTK3FA/sandbox/",
            username: "7cskl6QBhThHdw9117U",
            password: "vaaKlX6LQXPwmaS_EGk",
            allowFail: false
        }
    );
}
catch (ex) {
    console.log("Failed to setup LRS object: ", ex);
    // TODO: do something with error, can't communicate with LRS
}

var http = require('http');
var url = require('url');
var fs =  require('fs');
var startTime;

function serveFile(path, res) {
  if (path === '/' || path === '/index.html' 
      || path === '/inuse.html' || path === '/authenticate.html') {
    if (mbox === '') {
      path = 'index.html';
    } else {
      path = 'inuse.html';
    }
  } else {
    path = path.substring(1); //drop the initial /
  }

  var contentType = '';
  if (path.endsWith('.html')) {
    contentType = 'text/html';
  } else if (path.endsWith('.png')) {
    contentType = 'image/png';
  }

  if(!path.startsWith('/')) {
    path = '/' + path;
  }

  fs.readFile(__dirname + path, function(err, data){
    if(err){
      res.statusCode = 500;
      res.end(`Error getting the file: ${err}.`);
    } else {
      //console.log (path + ' User: ' + mbox + '(' + name + ')');
      res.setHeader('Content-type', contentType);
      res.end(data);
    }
  });
}

//create a server object:
http.createServer(function (req, res) {
  var path = url.parse(req.url).pathname;
  //console.log('Request received on path ' + path);

  if (path === "/logout.html") {
    five.drive(0, 0);

    //send an exited statement
    var statement = new TinCan.Statement(
      {
          actor: {
              mbox,
              name
          },
          verb: new TinCan.Verb({
              id: "http://activitystrea.ms/schema/1.0/terminate",
              display: {
                "en-us": "terminated"
              }
          }),
          target: new TinCan.Activity({
              id: "https://torrancelearning.com/xapi/activities/xapi-party/robot/course1",
              definition: {
                name : {
                  "en-us": "xAPI Party Robot Driving Course 1"
                },
                description: {
                  "en-us": "Driving Course 1: Stay in your lane to the goal"
                }
              }
          }),
          context: {}
  
      }
    );

    var duration = Date.now() - startTime;
    statement.context.extensions = {
      "http://id.tincanapi.com/extension/time": duration,
      "http://torrancelearning.com/xapi/extensions/xapi-party/robot/curb-checks": curbChecks
    }

  sendStatement(statement);

  mbox = '';
    name = '';
    serveFile('/index.html', res);
  } else if (path === "/authenticate.html" & mbox === '') {
    var params = url.parse(req.url, true).query;
    mbox = "mailto:" + params.mbox;
    name = params.name;
    complete = false;
    curbChecks = 0;

    startTime = Date.now();
    var statement = new TinCan.Statement(
      {
          actor: {
              mbox,
              name
          },
          verb: new TinCan.Verb({
              id: "http://adlnet.gov/expapi/verbs/launched",
              display: {
                "en-us": "launched"
              }
          }),
          target: new TinCan.Activity({
            id: "https://torrancelearning.com/xapi/activities/xapi-party/robot/course1",
            definition: {
              name : {
                "en-us": "xAPI Party Robot Driving Course 1"
              },
              description: {
                "en-us": "Driving Course 1: Stay in your lane to the goal"
              }
            }
        })
      }
  );

  sendStatement(statement);

    serveFile('/dual.html', res);
  } else if (path === '/drive') {
    var params = url.parse(req.url, true).query;
    var left =  params.left ? params.left : 0;
    var right = params.right ? params.right : 0;
    //console.log ('Request received ' + left + ',' + right);

    five.drive(left, right);
    res.setHeader('Content-type', 'text/plain' );
    res.write('Set speed to ' + left + ',' + right);
    res.end();
  } else {
    serveFile(path, res);
  }
}).listen(8080); 

function sendStatement(statement) {
  lrs.saveStatement(
    statement,
    {
        callback: function (err, xhr) {
            if (err !== null) {
                if (xhr !== null) {
                    console.log("Failed to save statement: " + xhr.responseText + " (" + xhr.status + ")");
                    // TODO: do something with error, didn't save statement
                    return;
                }

                console.log("Failed to save statement: " + err);
                // TODO: do something with error, didn't save statement
                return;
            }

            console.log("Statement saved");
            // TOOO: do something with success (possibly ignore)
        }
    }
  );
}

function triggered (sensor) {
  console.log ("Triggered " + sensor);
  var statement = new TinCan.Statement(
    {
        actor: {
            mbox,
            name
        },
        verb: new TinCan.Verb({
            id: "https://torrancelearning.com/xapi/verbs/triggered",
            display: {
              "en-us": "triggered"
            }
        }),
        target: new TinCan.Activity({
            id: "https://torrancelearning.com/xapi/activities/xapi-party/robot/sensor/" + sensor.toLowerCase(),
            definition: {
              name: {
                "en-us": "xAPI Party Robot Light Sensor " + sensor
              },
              description: {
                "en-us": "xAPI Party Robot Digital Light Sensor, " + sensor + " Position"
              }
            }
        }),
        context: {}

    }
  );

  var duration = Date.now() - startTime;
  statement.context.extensions = {
    "http://id.tincanapi.com/extension/time": duration
  }

  sendStatement(statement);
}

function completed () {
  complete = true;
  var statement = new TinCan.Statement(
    {
        actor: {
            mbox,
            name
        },
        verb: new TinCan.Verb({
            id: "http://adlnet.gov/expapi/verbs/completed",
            display: {
              "en-us": "completed"
            }
        }),
        target: new TinCan.Activity({
            id: "https://torrancelearning.com/xapi/activities/xapi-party/robot/course1",
            definition: {
              name : {
                "en-us": "xAPI Party Robot Driving Course 1"
              },
              description: {
                "en-us": "Driving Course 1: Stay in your lane to the goal"
              }
            }
        }),
        context: {}

    }
  );

  var duration = Date.now() - startTime;
  statement.context.extensions = {
    "http://id.tincanapi.com/extension/time": duration,
    "http://torrancelearning.com/xapi/extensions/xapi-party/robot/curb-checks": curbChecks
  }

  sendStatement(statement);
}