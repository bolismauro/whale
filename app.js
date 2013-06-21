/*jshint node:true, laxcomma:true, indent:2, white:true, curly:true, plusplus:true, undef:true, strict:true, trailing:true, eqnull:true */

'use strict';


var clog = require('clog')
  , async = require('async')
  , eenv = require('eenv')
  , random = require('node-random')
  , connect = require('connect')
  , nano = require('nano')
  , postmark = require('postmark')
  , AWS = require('aws-sdk')
  , asciify = require('asciify')
  , uuid = require('uuid')
  , fs = require('fs')
  , http = require('http')
  , ApollonianGasket = require('./lib/ApollonianGasket')
  , utils = require('./lib/utils');

require('string-format');
require('sugar');
require('colors');

eenv.loadSync({ keyfile: process.env.EENV_KEY });

var AWS_ACCESS_KEY_ID = process.config.AWS_ACCESS_KEY_ID
  , AWS_SECRET_ACCESS_KEY = process.config.AWS_SECRET_ACCESS_KEY
  , AWS_BUCKET = process.config.AWS_BUCKET
  , DATABASE_URL = process.config.DATABASE_URL
  , CDN_DOMAIN = process.config.CDN_DOMAIN
  , POSTMARK_APIKEY = process.config.POSTMARK_APIKEY
  , WHALE_API_ENDPOINT = 'http://api.whale.im'; //@TODO: move to config


// AWS SDK config
AWS.config.update({ accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY });
AWS.config.update({ region: 'eu-west-1' });
s3client = new AWS.S3();


var s3client
  , db = nano(DATABASE_URL)
  , postmark = postmark(POSTMARK_APIKEY)
  , app = connect()
      .use(connect.query())
      .use(connect.responseTime())
      .use(utils.allowCORS())
      .use(validate)
      .use(get)
      .use(generate);


http.createServer(app).listen(process.env.PORT || 3000);
asciify('WHALE', function (err, res) {
  console.log(res.bold.blue + '\t\t\t\t     I\'m a Whale :)'.bold);
  console.log();
});


function validate(req, res, next) {
  if ('GET' !== req.method) {
    return next(new Error('Only GET is supported.'));
  } else {
    if (req.query.email == null || req.query.email.trim() === '' || req.query.email.length < 6 || req.query.email.indexOf('@') === -1) {
      return next(new Error('Email parameter did not validate.'));
    }
    
    next();
  }
}


function get(req, res, next) {
  var email = req.query.email
    , printUrl = !!req.query.url
    , printMeta = !!req.query.meta
    , force = req.query.force
    , key = utils.makeKey(email)
    , url;
    
  db.get(key, function (err, doc) {
    if (err) {
      if (err && err.status_code === 404) {
        clog.info('Generating new avatar for key', key);
        next();
      } else {
        clog.error('CouchDB.get Error', err);
        next(err);
      }
    } else {
      clog.debug('force', force, doc.token);
      
      if (force && force === doc.token) {
        db.destroy(doc._id, doc._rev, function (err) {
          if (err) {
            return next(err);
          } else {
            return next();
          }
        });
        
      } else {
        url = utils.makeImageURL(CDN_DOMAIN, key);
        
        if (printUrl) {
          res.statusCode = 200;
          res.write(url);
          res.end();
        } else if (printMeta) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.write(JSON.stringify({ url: url, meta: doc.meta || {}, created_on: doc.created_on }));
          res.end();
        } else {
          utils.redirectKey(res, url);
        }
      }
    }
  });
}


function generate(req, res) {
  var email = req.query.email
    , printUrl = !!req.query.url
    , printMeta = !!req.query.meta
    , force = req.query.force;

  async.waterfall([
  
    function _generator(done) {
      _generateHelper(function (err, res) {
        done(err, res);
      });
    },
    
    function _upload(res, done) {
      var key = utils.makeKey(email)
        , buffer = res.buffer;
      
      s3client.putObject({
        Bucket: AWS_BUCKET,
        Body: buffer,
        Key: key + '.png', // no leading /, please
        //ACL: 'public-read', // access only via clodfront
        ContentType: 'image/png'
      }, function (err, body) {
        if (err) {
          clog.error('Error uploading image to S3', err);
          return done(err);
        }
        
        done(null, key, res);
      });
    },
    
    function _save(key, data, done) {
      var token = force || uuid.v4()
        , url = utils.makeImageURL(CDN_DOMAIN, key);
      
      var doc = {
        email: email
      , s3key: key + '.png'
      , token: token
      , created_on: new Date()
      , meta: {
          palette: data.palette
        , agparam: data.random
        , base64: data.buffer.toString('base64')
        }
      };
      
      db.insert(doc, key, function (err) {
        if (err) {
          clog.error('Error saving document to CouchDB', err);
          return done(err);
        }
        
        done(null, key, doc, url);
      });
    },
    
    function _sendmail(key, doc, url, done) {
      fs.readFile('mail_template.html', { encoding: 'utf8' }, function (err, template) {
        if (err) {
          return done(err);
        }
        
        // We *should* prevent cloudfront from caching the object if the user does not like his avatar
        var url_no_cache = url + '?r=' + Math.random();
        
        postmark.send({
          From: 'hello@plasticpanda.com',
          To: doc.email,
          Subject: 'whale.im | You are now sailing the sea!',
          HtmlBody: template.format({ email: doc.email, url: url_no_cache, token: doc.token })
        }, function (err) {
          if (err) {
            return done(err);
          }
          
          done(null, key, doc, url);
        });
      });
    }
    
  ], function (err, key, doc, url) {
    if (err) {
      clog.error('Error', err);
      throw err;
    }
    
    if (printUrl) {
      res.statusCode = 200;
      res.write(url);
      res.end();
    } else if (printMeta) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify({ url: url, meta: doc.meta || {}, created_on: doc.created_on }));
      res.end();
    } else {
      utils.redirectKey(res, url);
    }
    
    clog.ok('Done');
  });

}


function _generateHelper(callback) {
  var palette
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
      callback(err);
    }
    
    clog.info('Got random', data.random[0]);
    clog.info('Got colors', data.colors);
    
    apollo = new ApollonianGasket({
      size: size
    , depth: 4
    , palette: data.colors
    , random: data.random[0]
    });
    
    apollo.draw().toBuffer(function (err, buf) {
      callback(err, {
        buffer: buf,
        random: data.random[0],
        palette: data.colors
      });
    });
  });
}
