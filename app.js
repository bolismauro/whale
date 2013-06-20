/*jshint node:true, laxcomma:true, indent:2, white:true, curly:true, plusplus:true, undef:true, strict:true, trailing:true */

'use strict';

var fs = require('fs')
  , Canvas = require('canvas');
  
// OPTIONS
var SIZE = 512
  , HALFSIZE = SIZE / 2
  , LEVEL = 4;
  
  

function ApollonianGasket(palette) {
  var cY = HALFSIZE - Math.random() * 400 + 50;
  
  this.canvas = new Canvas(SIZE, SIZE);
  this.ctx = this.canvas.getContext('2d');
  this.palette = palette;
  
  this.cTop = { r: (HALFSIZE - cY) / 2, x: 0, y: HALFSIZE - (HALFSIZE - cY) / 2 };
  this.cBottom = { r: (HALFSIZE + cY) / 2, x: 0, y: -this.cTop.r };
  this.cRight = ApollonianGasket.getSoddyCircle(this.cTop, this.cBottom, { x: 0, y: 0, r: -HALFSIZE });
  this.cLeft = { r: this.cRight.r, x: -this.cRight.x, y: this.cRight.y };
}


ApollonianGasket.prototype.draw = function () {
  // Draw initial palette
  this.ctx.beginPath();
  this.ctx.rect(0, 0, SIZE, SIZE);
  this.ctx.fillStyle = this.palette[0];
  this.ctx.fill();
  this.ctx.closePath();
  
  this._drawArc(this.cTop); // top soddy circle
  this._drawArc(this.cBottom); // bot soddy circle
  this._drawArc(this.cLeft); // left soddy circle
  this._drawArc(this.cRight); // right soddy circle
  
  this._magic(this.cTop, this.cLeft, 'edge', 'tl', 1);
  this._magic(this.cTop, this.cRight, 'edge', 'tr', 1);
  this._magic(this.cBottom, this.cLeft, 'edge', 'bl', 1);
  this._magic(this.cBottom, this.cRight, 'edge', 'br', 1);
  
  this._magic(this.cTop, this.cBottom, this.cRight, 'tr', 1);
  this._magic(this.cTop, this.cLeft, this.cBottom, 'l', 1);
  
  return this.canvas;
};


ApollonianGasket.prototype._magic = function (c1, c2, c3, q, lvl) {
  var soddyCircle;
  
  lvl = lvl + 1;
  if (lvl === LEVEL) {
    return;
  }
  
  if (c3 === 'edge') {
    soddyCircle = ApollonianGasket.getSoddyCircle(c1, c2, { x: 0, y: 0, r: -HALFSIZE }, q, lvl);
    this._drawArc(soddyCircle);
    
    this._magic(c1, soddyCircle, 'edge', q, lvl);
    this._magic(soddyCircle, c2, 'edge', q, lvl);

    if (soddyCircle.r < 0) {
      return;
    } else if (lvl < LEVEL - 1) {
      this._magic(c1, c2, soddyCircle, q, lvl);
    }

  } else {
    if (lvl < LEVEL - 1) {
      soddyCircle = ApollonianGasket.getSoddyCircle(c1, c2, c3, q, lvl);

      if (soddyCircle.r < 0) {
        return;
      } else {
        this._drawArc(soddyCircle);
        this._magic(c1, c2, soddyCircle, q, lvl);
        this._magic(c2, c3, soddyCircle, q, lvl);
        this._magic(c1, soddyCircle, c3, q, lvl);
      }
    }
  }
  
  return false;
};


ApollonianGasket.prototype._drawArc = function (c) {
  var coord = { x: c.x + HALFSIZE, y: HALFSIZE - c.y };

  this.ctx.beginPath();
  this.ctx.arc(coord.x, coord.y, c.r, 0, 2 * Math.PI, false);
  this.ctx.fillStyle = this.palette[Math.round(Math.random() * (this.palette.length - 2)) + 1]; // Get random palette color, excluding background
  this.ctx.fill();
  this.ctx.closePath();
};


ApollonianGasket.getSoddyCircle = function (c1, c2, c3, q, lvl) {
  var numerator = c1.r * c2.r * c3.r
    , denom1 = c2.r * c3.r + c1.r * c2.r + c1.r * c3.r
    , denom2 = 2 * Math.sqrt(c1.r * c2.r * c3.r * (c1.r + c2.r + c3.r))
    , r = numerator / (denom1 + (c3.r < 0 ? -denom2 : denom2))
    , point;
      
  point = (function _getPoint(c1, c2, r, q, lvl) {
    var x, y, hyp, theta, tc12, a, b, c, A, B, C, opp, adj;
    
    a = c1.r + c2.r;
    b = c1.r + r;
    c = c2.r + r;
    
    A = Math.acos((Math.pow(b, 2) + Math.pow(c, 2) - Math.pow(a, 2)) / (2 * b * c));
    B = Math.acos((Math.pow(a, 2) + Math.pow(c, 2) - Math.pow(b, 2)) / (2 * a * c));
    C = Math.acos((Math.pow(a, 2) + Math.pow(b, 2) - Math.pow(c, 2)) / (2 * a * b));
    
    opp = c1.y - c2.y;
    adj = c1.x - c2.x;
    
    if (opp === 0 || adj === 0) {
      // if both points are on axis
      x = b * Math.sin(C),
      y = -Math.sqrt(Math.pow(b, 2) - Math.pow(x - c1.x, 2)) + c1.y;
    } else {
      hyp = Math.sqrt(Math.pow(opp, 2) + Math.pow(adj, 2));
      tc12 = Math.acos((Math.pow(hyp, 2) + Math.pow(adj, 2) - Math.pow(opp, 2)) / (2 * hyp * adj));

      if (c2.x < 0) {
        theta = (q === 'tl' || q === 'tr' ? -B : B) + (opp < 0 ? tc12 : -tc12);
        x = c2.x + c * Math.cos(theta);
        y = c2.y - c * Math.sin(theta);
      } else {
        theta = (q === 'tl' || q === 'tr' || q === 'l' ? -B : B) + (opp < 0 ? - tc12 : tc12);
        x = c2.x + c * Math.cos(theta);
        y = c2.y + c * Math.sin(theta);
      }
    }
    
    return { x: x, y: y };
  })(c1, c2, r, q, lvl);

  return { x: point.x, y: point.y, r: r };
};




function generate() {
  var palette;
    
  
  
  palette = ['#423A38', '#47B8C8', '#E7EEE2', '#BDB9B1', '#D7503E']; // Get random palette from kuler
  
  var apollo = new ApollonianGasket(palette)
    , canvas = apollo.draw();
    
  fs.writeFileSync('index.html', '<html><body><img src="' + canvas.toDataURL() + '" /></body></html>');
  
  // var date2 = new Date();
  // var date3 = new Date();
  // console.log('Render', date2 - date1, 'milliseconds');
  // console.log('Render + Write', date3 - date1, 'milliseconds');
}

generate();
throw new Error();
