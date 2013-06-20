/*jshint node:true, laxcomma:true, indent:2, white:true, curly:true, plusplus:true, undef:true, strict:true, trailing:true */

'use strict';

var fs = require('fs')
  , clog = require('clog')
  , async = require('async')
  , random = require('node-random')
  , http = require('http')
  , ApollonianGasket = require('./lib/ApollonianGasket');

require('sugar');


function generate() {
  var palette = ['#423A38', '#47B8C8', '#E7EEE2', '#BDB9B1', '#D7503E']
    , canvas
    , apollo
    , size = 512;
  
  async.parallel({
    
    random: function (done) {
      random.numbers({
        number: 1,
        minimum: Math.round(size * 0.3),
        maximum: Math.round(size * 0.7)
      }, done);
    },
    
    colors: function (done) {
      http.get('http://www.colourlovers.com/api/palettes/random?format=json', function (res) {
        res.on('data', function (data) {
          var body = JSON.parse(data.toString('utf8'))
            , colors = body[0].colors.map(function (row) { return '#' + row; });
            
          done(null, colors);
        });
        
      }).on('error', function (err) {
        done(err);
      });
    }
    
  }, function _callback(err, data) {
    if (err) {
      throw err;
    }
    
    clog.info('Got random', data.random[0]);
    clog.info('Got colors', data.colors);
    
    apollo = new ApollonianGasket({
      size: size
    , depth: 4
    , palette: data.colors
    , random: data.random[0]
    });
    
    canvas = apollo.draw();
    fs.writeFileSync('index.html', '<html><body><img src="' + canvas.toDataURL() + '" /></body></html>');
    clog.ok('Wrote file index.html');
  });
  
    
    
}

generate();
