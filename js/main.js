/*jshint browser:true, indent:2, laxcomma:true, loopfunc: true */

(function () {

  'use strict';
  
  NodeList.prototype.forEach = Array.prototype.forEach; 
  HTMLCollection.prototype.forEach = Array.prototype.forEach;

  var pattern = document.querySelector('#pattern')
    , result = document.querySelector('#result')
    , form = document.querySelector('#gowhale')
    , preview = document.querySelector('.preview')
    ;


  var resultBuilder = function (data) {
    preview.querySelector('img').setAttribute('src', 'data:image/png;base64,' + data.meta.base64);
    preview.querySelector('input').value = data.url;
    preview.querySelector('input').addEventListener('click', function () {
      this.select();
    }, false);

    // Generating Palette Bar
    data.meta.palette.forEach(function (e) {
      var palette = document.createElement('div');
      palette.classList.add('palette-bar');
      palette.style.backgroundColor = e;
      result.insertBefore(palette, result.firstChild);
    });
  };


  var barAnimator = function () {
    var timer = 800
      , palettes = document.querySelectorAll('.palette-bar');

    // Optimize Me!!
    palettes.forEach(function (e, index) {
      var i = index;

      setTimeout(function () {
        palettes[i].style.width = 100 - 100 / palettes.length * i + '%';
      }, timer - i * 100);

    });

  };


  // Allow Editing Hash type http://www.whale.im/#{mail}|{token}
  var hash = window.location.hash;

  if (hash) {

    // Cleaning some nodes
    pattern.parentNode.removeChild(pattern);

    // TODO
    // Adding a loading animation on the page
    
    hash = decodeURIComponent(window.location.hash);
    hash = hash.replace('#', '').split('|');
    
    var mail = hash[0]
      , token = hash[1];
    
    microAjax('http://api.whale.im/?meta=1&email=' + mail, function (res, status) {

      if (status === 200) {
        // Checking if everything is OK [status = 200]
        
        // Set Palette and Values
        resultBuilder(JSON.parse(res));

        result.classList.add('renew');

        var reborn = document.createElement('button');
        reborn.setAttribute('title', 'Generate a new Avatar');
        reborn.classList.add('btn');
        reborn.classList.add('reborn');
        reborn.innerHTML = '<img src="img/reborn.svg" />';
        reborn.addEventListener('click', function (e) {

          document.querySelector('.reborn').setAttribute('disabled', 'disabled');

          microAjax('http://api.whale.im/?meta=1&force=' + token + '&email=' + mail, function (res, status) {

            if (status === 200) {
              // Checking if everything is OK [status = 200]

              var currentPalettes = document.querySelectorAll('.palette-bar');
              currentPalettes.forEach(function (e) {
                e.style.width = '100%';
              });              

              setTimeout(function () {
                document.querySelector('.reborn').removeAttribute('disabled');

                setTimeout(function () {
                  currentPalettes.forEach(function (e) {
                    e.parentNode.removeChild(e);
                  });

                  // Set Palette and Values
                  resultBuilder(JSON.parse(res));
                  barAnimator();

                }, 200);

              }, 600);              

            }

          });
        });

        preview.appendChild(reborn);

        result.style.opacity = 1;

        barAnimator();

      } else {
        // There was en error...

        window.location.href = 'http://www.whale.im';

      }


    });

  } else {
    
    // Enable inputs on page load (need this for Firefox)
    document.querySelector('#pattern [type="submit"], #pattern [type="email"]').removeAttribute('disabled');

    form.addEventListener('submit', function (e) {

      e.preventDefault();
      e.stopPropagation();

      var form = e.target;
      
      document.querySelector('#pattern [type="email"]').setAttribute('disabled', 'disabled');
      document.querySelector('#pattern [type="submit"]').setAttribute('disabled', 'disabled');
      document.querySelector('#pattern [type="submit"]').classList.add('loading');

      microAjax('http://api.whale.im/?meta=1&email=' + document.querySelector('#pattern [type="email"]').value, function (res, status) {

        if (status === 200) {
          // Checking if everything is OK [status = 200]
          
          // Set Palette and Values
          resultBuilder(JSON.parse(res));

          pattern.style.top = - document.body.clientHeight + 'px';
          setTimeout(function () {
            pattern.parentNode.removeChild(pattern);
          }, 800);

          result.style.opacity = 1;

          barAnimator();

        } else {
          // There was en error...
          
          document.querySelector('#pattern [type="email"]').removeAttribute('disabled');
          document.querySelector('#pattern [type="submit"]').removeAttribute('disabled');
          document.querySelector('#pattern [type="submit"]').classList.remove('loading');
        }


      });

      return false;

    }, false);

    pattern.style.opacity = 1;
    
  }

})();