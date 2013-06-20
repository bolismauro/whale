/*jshint node:true, laxcomma:true, indent:2, white:true, curly:true, plusplus:true, undef:true, strict:true, trailing:true */

'use strict';

var fs = require('fs')
  , clog = require('clog')
  , http = require('http')
  , ApollonianGasket = require('./lib/ApollonianGasket');

require('sugar');


function generate() {
  var palette = ['#423A38', '#47B8C8', '#E7EEE2', '#BDB9B1', '#D7503E']
    , canvas
    , apollo;
    
    
  http.get('http://www.colourlovers.com/api/palettes/random?format=json', function (res) {
    res.on('data', function (data) {
      var body = JSON.parse(data.toString('utf8'))
        , colors = body[0].colors.map(function (row) { return '#' + row; });
        
      clog.info('Got colors', colors);
      
      apollo = new ApollonianGasket({
        size: 512
      , depth: 4
      , palette: colors
      });
      
      canvas = apollo.draw();
      fs.writeFileSync('index.html', '<html><body><img src="' + canvas.toDataURL() + '" /></body></html>');
      clog.ok('Wrote file index.html');
    });
    
  }).on('error', function (err) {
    clog.error('Colourlovers API error', err);
  });
    
}

generate();
