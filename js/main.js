/*jshint browser:true, indent:2, laxcomma:true, jquery:true */

$(function () {

  'use strict';

  // Allow Editing Hash type http://www.whale.im/#{mail}|{token}
  var hash = window.location.hash;

  if (hash) {
    console.log('Hash', decodeURIComponent(window.location.hash));
    
    hash = decodeURIComponent(window.location.hash);
    hash = hash.replace('#', '').split('|');
    
    var mail = hash[0]
      , token = hash[1];

    console.log('Split', mail, token);
    
    /*$.ajax({
      type: 'GET',
      url: 'http://api.whale.im/?meta=1&email=' + mail + '&force=' + token,
      dataType: 'json',
      success: function(data) {
        //console.log('Success', data);

        $('.preview img').attr('src', 'data:image/png;base64,' + data.meta.base64);
        $('.preview input').val(data.url);

        // Generating Palette Bar
        data.meta.palette.forEach(function (e) {
          $('<div class="palette-bar" />').css('background-color', e).prependTo($('#result'));
        });

        // Scroll down!
        //scrollHandler.mCustomScrollbar('scrollTo', $('#result').position().top);
        $('#pattern').css('top', -document.body.clientHeight);
        setTimeout(function () {
          $('#pattern').remove();
        }, 800);


        $('#result').css('opacity', 1);
        

        var timer = 800;

        $('.palette-bar').each(function () {
          var $bar = $(this)
            , index = $bar.index()
            , len = $('.palette-bar').size()
            , t = timer;

          timer = timer - 100;

          setTimeout(function () {      
            //console.log('bar', $bar, 100 - 100 / len * index + '%');
            $bar.css('width', 100 - 100 / len * index + '%');
          }, t);
        });

      },
      error: function (data) {
        throw new Error('Error' + JSON.stringify(data));
      }

    });*/
  }

  
  
  // Enable inputs on page load (need this for Firefox)
  $('[type="submit"]').removeAttr('disabled');
  $('[type="email"]').removeAttr('disabled');


  $('#gowhale').on('submit', function (e) {

    var $form = $(this);
    
    $('[type="submit"]').addClass('loading').attr('disabled', 'disabled');
    $('[type="email"]').attr('disabled', 'disabled');

    $.ajax({
      type: 'GET',
      url: 'http://api.whale.im/?meta=1&email=' + $('#mailaddress').val(),
      dataType: 'json',
      success: function(data) {
        //console.log('Success', data);

        $('.preview img').attr('src', 'data:image/png;base64,' + data.meta.base64);
        $('.preview input').val(data.url);

        // Generating Palette Bar
        data.meta.palette.forEach(function (e) {
          $('<div class="palette-bar" />').css('background-color', e).prependTo($('#result'));
        });

        // Scroll down!
        //scrollHandler.mCustomScrollbar('scrollTo', $('#result').position().top);
        $('#pattern').css('top', -document.body.clientHeight);
        setTimeout(function () {
          $('#pattern').remove();
        }, 800);


        $('#result').css('opacity', 1);
        

        var timer = 800;

        $('.palette-bar').each(function () {
          var $bar = $(this)
            , index = $bar.index()
            , len = $('.palette-bar').size()
            , t = timer;

          timer = timer - 100;

          setTimeout(function () {      
            //console.log('bar', $bar, 100 - 100 / len * index + '%');
            $bar.css('width', 100 - 100 / len * index + '%');
          }, t);
        });

      },
      error: function (data) {
        throw new Error('Error' + JSON.stringify(data));
      }

    });    


    e.preventDefault();
    e.stopPropagation();
    return false;

  });


  $('.preview input').on('click', function () {
    this.select();
  });


  $(window).on('resize', function () {
    $('.page').css('height', document.body.clientHeight);
  });

  $(window).trigger('resize');


  $('#pattern').css('opacity', 1);

});