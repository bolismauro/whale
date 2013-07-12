/*jshint node:true, laxcomma:true, indent:2, white:true, curly:true, plusplus:true, undef:true, strict:true, trailing:true, eqnull:true */

'use strict';


var coolog = require('coolog')
  , logger = coolog.logger('main.js', true)
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
  , handlebars = require('handlebars')
  , ApollonianGasket = require('./lib/ApollonianGasket')
  , utils = require('./lib/utils');


require('string-format');
require('sugar');
require('colors');

//eenv.loadSync({ keyfile: process.env.EENV_KEY });

/*var AWS_ACCESS_KEY_ID = process.config.AWS_ACCESS_KEY_ID
  , AWS_SECRET_ACCESS_KEY = process.config.AWS_SECRET_ACCESS_KEY
  , AWS_BUCKET = process.config.AWS_BUCKET
  , DATABASE_URL = process.config.DATABASE_URL
  , CDN_DOMAIN = process.config.CDN_DOMAIN
  , POSTMARK_APIKEY = process.config.POSTMARK_APIKEY
  , POSTMARK_FROM = process.config.POSTMARK_FROM
  , WHALE_API_ENDPOINT = 'http://api.whale.im'; //@TODO: move to config


// AWS SDK config
AWS.config.update({ accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY });
AWS.config.update({ region: 'eu-west-1' });
s3client = new AWS.S3();
*/

var //s3client
  //, db = nano(DATABASE_URL)
  //, postmark = postmark(POSTMARK_APIKEY)
  //, 
  app = connect()
      .use(connect.query())
      .use(connect.responseTime())
      .use(utils.allowCORS())
      .use(validate)
      //.use(get)
      .use(generateWithFlickr);


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

/*function get(req, res, next) {
  var email = req.query.email
    , printUrl = !!req.query.url
    , printMeta = !!req.query.meta
    , force = req.query.force
    , key = utils.makeKey(email)
    , url;
  db.get(key, function (err, doc) {
    if (err) {
      if (err && err.status_code === 404) {
        logger.info('Generating new avatar for key', key);
        next();
      } else {
        logger.error('CouchDB.get Error', err);
        next(err);
      }
    } else {
      logger.debug('force', force, doc.token);
      
      if (force && force === doc.token) {
        req.doNotSendEmail = true;
        
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
}*/

function generateWithFlickr(req, res, next) {
  var email = req.query.email
    , printUrl = !!req.query.url
    , printMeta = !!req.query.meta
    , force = req.query.force;

  _generateHelper(function (err, imageRes) {
    res.writeHead(200, {'Content-Type': 'image/png'});
    res.write(imageRes.buffer);
    res.end();
  });
}

/*
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
          logger.error('Error uploading image to S3', err);
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
          logger.error('Error saving document to CouchDB', err);
          return done(err);
        }
        
        done(null, key, doc, url);
      });
    },
    
    function _sendmail(key, doc, url, done) {
      if (req.doNotSendEmail === true) {
        return done(null, key, doc, url);
      }
      
      fs.readFile('mail_template.html', { encoding: 'utf8' }, function (err, template) {
        if (err) {
          return done(err);
        }
        
        // We *should* prevent cloudfront from caching the object if the user does not like his avatar
        var url_no_cache = url + '?r=' + Math.random();
        
        postmark.send({
          From: POSTMARK_FROM,
          To: doc.email,
          Subject: 'whale.im | You are now sailing the sea!',
          HtmlBody: handlebars.compile(template)({ email: doc.email, url: url_no_cache, token: doc.token, palette: doc.meta.palette })
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
      logger.error('Error', err);
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
    
    logger.ok('Done');
  });

}
*/

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
      http.get(utils.getFlickrSearchUrl(), function (res) {
        var data = ''
          , palette = require('palette')
          , Canvas = require('canvas')
          , Image = Canvas.Image
          , canvas = new Canvas()
          , ctx = canvas.getContext('2d')
          , photoUrl;
        
        res.on('data', function (chunk) {
          data = data + chunk;
        });
        
        res.on('end', function () {
          var photos = JSON.parse(data.toString('utf8')).photos
            , photoInfo;

          photoInfo = photos.photo[Math.floor(Math.random() * photos.photo.length -1)];

          photoUrl = utils.createFlickrUrl(photoInfo);
          logger.info(photoUrl);

          http.get(photoUrl, function (imageRes) {
            var imageData = [];
            
            imageRes.setEncoding('binary');
            
            imageRes.on('data', function (chunk) {
              imageData.push(chunk);
            });

            imageRes.on('end', function () {
              var img = new Image()
                , colors = [];

              img.onload = function () {
                console.log('image loaded');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                console.log('calculating palette');
                var temp = palette(canvas, 5);
                temp.forEach(function (color) {
                  var r = color[0]
                    , g = color[1]
                    , b = color[2]
                    , val = r << 16 | g << 8 | b
                    , str = '#' + val.toString(16);

                  colors.push(str);
                });
                console.log(colors);
                done(null, colors);
              };

              img.onerror = function (e) {
                console.log("error ", e);
                done(null, undefined);
              };

              imageData = imageData.join('');
              img.src = new Buffer(imageData, 'binary');
            
            });
          });
        });

        res.on('error', function (err) {
          done(err);
        });
      });
    }
    
  }, function _callback(err, data) {
    if (err) {
      callback(err);
    }
    
    logger.info('Got random', data.random[0]);
    logger.info('Got colors', data.colors);
    
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
