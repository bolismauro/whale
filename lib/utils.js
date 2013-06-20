/*jshint node:true, laxcomma:true, indent:2, white:true, curly:true, plusplus:true, undef:true, strict:true, trailing:true */

'use strict';

var md5 = require('MD5');

var makeKey = module.exports.makeKey = function (email) {
  return md5(email);
};


module.exports.makeImageURL = function (domain, key) {
  return 'http://' + domain + '/' + key + '.png';
};


module.exports.redirectKey = function (res, url) {
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.end();
};

