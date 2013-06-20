/*jshint node:true, laxcomma:true, indent:2, white:true, curly:true, plusplus:true, undef:true, strict:true, trailing:true */

'use strict';

var fs = require('fs')
  , Canvas = require('canvas');
  
var SIZE = 512
  , HALFSIZE = SIZE / 2
  , LEVEL = 4
  , canvas = new Canvas(SIZE, SIZE)
  , ctx = canvas.getContext('2d');

var date1 = new Date();


var c0 = { x: 0, y: 0, r: -HALFSIZE }
  , drawArc
  , getPoint
  , getSoddyCircle
  , drawSetup
  , ag;
  
  

function ApollonianGasket(x, y, palette) {
  this.cTop = { r: (HALFSIZE - y) / 2, x: 0, y: HALFSIZE - (HALFSIZE - y) / 2 };
  this.cBottom = { r: (HALFSIZE + y) / 2, x: 0, y: -this.cTop.r };
  this.cRight = getSoddyCircle(this.cTop, this.cBottom, c0);
  this.cLeft = { r: this.cRight.r, x: -this.cRight.x, y: this.cRight.y };

  // Draw initial palette
  ctx.beginPath();
  ctx.rect(0, 0, SIZE, SIZE);
  ctx.fillStyle = palette[0];
  ctx.fill();
  ctx.closePath();
  
  drawArc(this.cTop); // top soddy circle
  drawArc(this.cBottom); // bot soddy circle
  drawArc(this.cLeft); // left soddy circle
  drawArc(this.cRight); // right soddy circle
}


ApollonianGasket.protype.draw = function () {
  s = drawSetup(c.x, c.y);
  
  ag(s.cTop, s.cLeft, 'edge', 'tl', 1);
  ag(s.cTop, s.cRight, 'edge', 'tr', 1);
  ag(s.cBottom, s.cLeft, 'edge', 'bl', 1);
  ag(s.cBottom, s.cRight, 'edge', 'br', 1);

  ag(s.cTop, s.cBottom, s.cRight, 'tr', 1);
  ag(s.cTop, s.cLeft, s.cBottom, 'l', 1);
};


  

drawArc = function (c) {
  var coord = { x: c.x + HALFSIZE, y: HALFSIZE - c.y };

  ctx.beginPath();
  ctx.arc(coord.x, coord.y, c.r, 0, 2 * Math.PI, false);
  ctx.fillStyle = palette[Math.round(Math.random() * (palette.length - 2)) + 1]; // Get random palette color, excluding background
  ctx.fill();
  ctx.closePath();
};


getPoint = function (c1, c2, r, q, lvl) {
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
},

getSoddyCircle = function (c1, c2, c3, q, lvl) {
  var numerator = c1.r * c2.r * c3.r
    ,  denom1 = c2.r * c3.r + c1.r * c2.r + c1.r * c3.r
    ,  denom2 = 2 * Math.sqrt(c1.r * c2.r * c3.r * (c1.r + c2.r + c3.r))
    ,  edgeC = { r: numerator / (denom1 + (c3.r < 0 ? -denom2 : denom2)) }
    ,  point;
      
  point = getPoint(c1, c2, edgeC.r, q, lvl);
  edgeC.x = point.x;
  edgeC.y = point.y;

  return edgeC;
};




ag = function (c1, c2, c3, q, lvl) {
  var c;
  
  lvl = lvl + 1;
  if (lvl === LEVEL) {
    return;
  }
  
  if (c3 === 'edge') {
    c = getSoddyCircle(c1, c2, c0, q, lvl);
    drawArc(c);
    
    ag(c1, c, 'edge', q, lvl);
    ag(c, c2, 'edge', q, lvl);

    if (c.r < 0) {
      return;
    } else if (lvl < LEVEL - 1) {
      ag(c1, c2, c, q, lvl);
    }

  } else {
    if (lvl < LEVEL - 1) {
      c = getSoddyCircle(c1, c2, c3, q, lvl);

      if (c.r < 0) {
        return;
      } else {
        drawArc(c);
        ag(c1, c2, c, q, lvl);
        ag(c2, c3, c, q, lvl);
        ag(c1, c, c3, q, lvl);
      }
    }
  }
  
  return false;
};



function generate() {
  var s
    , c
    , palette;
    
  c = { x: 150 - HALFSIZE, y: HALFSIZE - Math.random() * 500 + 50 };
  c.x = c.x || 0.00001;
  c.y = c.y || 0.00001;
  
  palette = ['#423A38', '#47B8C8', '#E7EEE2', '#BDB9B1', '#D7503E']; // Get random palette from kuler
  
  var apollo = new ApollonianGasket(c.x, c.y);
  apollo.draw();
  
  

  var date2 = new Date();

  fs.writeFileSync('index.html', '<img src="' + canvas.toDataURL() + '" />');

  var date3 = new Date();

  console.log('Render', date2 - date1, 'milliseconds');
  console.log('Render + Write', date3 - date1, 'milliseconds');

}

generate();
throw new Error();
