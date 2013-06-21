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

module.exports.allowCORS = function () {
  return function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
    } else {
      next();
    }
  };
};
