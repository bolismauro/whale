/*jshint node:true */

var fs = require('fs');

var Canvas = require('canvas')
  , canvas = new Canvas(600,600)
  , ctx = canvas.getContext('2d');

var date1 = new Date();

var WIDTH = 600
  , HEIGHT = 600
  , LEVEL = 5
  , r0 = -300
  , c0 = {x: 0, y: 0, r: -300}
  , mx
  , my

  , browserToGraph = function(coord) { return { x: coord.x-WIDTH/2, y: HEIGHT/2-coord.y }; }
  , graphToBrowser = function(coord) { return { x: coord.x + WIDTH/2, y: HEIGHT/2 - coord.y }; }



                                         ,




drawCurvature = function(c){
  var coord = graphToBrowser({x: c.x, y: c.y});

  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.arc(coord.x, coord.y, c.r, 0, Math.PI*2, false);
  ctx.fillStyle = '#' + (function co(lor){   return (lor += [0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'][Math.floor(Math.random()*16)]) && (lor.length == 6) ?  lor : co(lor); })('');;
  ctx.fill();
  ctx.closePath();
}
       ,

getPoint = function(c1, c2, r, q, lvl) {
  var
  
  x, y, hyp, theta, tc12,
  
  a = c1.r+c2.r,
  b = c1.r+r,
  c = c2.r+r,
  
  A = Math.acos((Math.pow(b,2) + Math.pow(c,2) - Math.pow(a,2))/(2*b*c)),
  B = Math.acos((Math.pow(a,2) + Math.pow(c,2) - Math.pow(b,2))/(2*a*c)),
  C = Math.acos((Math.pow(a,2) + Math.pow(b,2) - Math.pow(c,2))/(2*a*b));
  
  
  opp = c1.y-c2.y,
  adj = c1.x-c2.x;
  
  if(opp===0 || adj===0) {
    // if both points are on axis
    x = b*Math.sin(C),
    y = -Math.sqrt(Math.pow(b,2) - Math.pow(x-c1.x, 2)) + c1.y; 
  } else {
    hyp = Math.sqrt(Math.pow(opp,2) + Math.pow(adj,2));
    tc12 = Math.acos((Math.pow(hyp,2) + Math.pow(adj,2) - Math.pow(opp,2))/(2*hyp*adj));


    if(c2.x<0) {
      theta = (q==='tl' || q==='tr' ? -B : B) + (opp<0 ? tc12 : -tc12);
      x = c2.x + c*Math.cos(theta);
      y = c2.y - c*Math.sin(theta);
    } else {
      theta = (q==='tl' || q==='tr' || q==='l' ? -B : B) + (opp<0 ? - tc12 : tc12);
      x = c2.x + c*Math.cos(theta);
      y = c2.y + c*Math.sin(theta);
    }

  }
  
  return { x : x, y : y }
},

getSoddyCircle = function(c1, c2, c3, q, lvl) {
  var 

  numerator = c1.r*c2.r*c3.r,
  denom1 = c2.r*c3.r + c1.r*c2.r + c1.r*c3.r,
  denom2 = 2*Math.sqrt(c1.r*c2.r*c3.r*(c1.r+c2.r+c3.r)),

  edgeC = { r: numerator/(denom1 + (c3.r <0 ? -denom2 : denom2)) },
  point = getPoint(c1, c2, edgeC.r, q, lvl);

  edgeC.x = point.x;
  edgeC.y = point.y;

  return edgeC;
},

drawSetup = function(x, y) {
  var
  c1 = { r: (300 - y)/2, x: 0, y: HEIGHT/2 - (300 - y)/2 },
  c2 = { r: (300 + y)/2, x: 0, y: -c1.r },
  edgeCR = getSoddyCircle(c1, c2, c0),
  edgeCL = { r: edgeCR.r, x: -edgeCR.x, y: edgeCR.y };


  ctx.clearRect ( 0 , 0 , WIDTH , HEIGHT);

  drawCurvature({x: 0, y: 0, r: WIDTH/2}); // outer soddy circle
  drawCurvature(c1); // top soddy circle
  drawCurvature(c2); // bot soddy circle

  drawCurvature(edgeCL); // left soddy circle
  drawCurvature(edgeCR); // right soddy circle
  
  return { cTop: c1, cBottom: c2, cLeft: edgeCL, cRight: edgeCR };
},

ag = function(c1, c2, c3, q, lvl){
  lvl++;
  
  if(lvl === LEVEL) return;
  var c;

  if(c3 === 'edge') {
    c = getSoddyCircle(c1, c2, c0, q, lvl)
    drawCurvature(c);
    ag(c1,c,'edge', q, lvl);
    ag(c,c2,'edge', q, lvl);

    if(c.r < 0) return;

    if(lvl < LEVEL-1) ag(c1, c2, c, q, lvl);
  } else {
    if(lvl < LEVEL-1) {
      c = getSoddyCircle(c1, c2, c3, q, lvl)

      if(c.r < 0) return;

      drawCurvature(c);
      ag(c1, c2, c, q, lvl);
      ag(c2, c3, c, q, lvl);
      ag(c1, c, c3, q, lvl);
    }
  }
  return false;
};


var s, c = browserToGraph({x:150,y:Math.random()*300+150});


mx = c.x;
my = c.y;

if(mx===0) mx = .00001;
if(my===0) my = .00001;

//don't show anything outside of the circle
if(Math.pow(mx,2) + Math.pow(my,2)  < Math.pow(WIDTH/2 ,2)) {
  s = drawSetup(mx,my);
  ag(s.cTop, s.cLeft, 'edge', 'tl', 1);
  ag(s.cTop, s.cRight, 'edge', 'tr', 1);
  ag(s.cBottom, s.cLeft, 'edge', 'bl', 1);
  ag(s.cBottom, s.cRight, 'edge', 'br', 1);

  ag(s.cTop, s.cBottom, s.cRight, 'tr', 1);
  ag(s.cTop, s.cLeft, s.cBottom, 'l', 1);
}


var date2 = new Date();

fs.writeFileSync('png.svg', canvas.toDataURL());

var date3 = new Date();

console.log('Render', date2 - date1, 'milliseconds');
console.log('Render + Write', date3 - date1, 'milliseconds');
