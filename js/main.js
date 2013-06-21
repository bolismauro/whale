/*jshint browser:true, indent:2, laxcomma:true, jquery:true, devel:true */

$(function () {

  'use strict';


  $('#gowhale').on('submit', function (e) {

    var $form = $(this);
    
    $('[type="submit"]').addClass('loading').attr('disabled', 'disabled');
    $('[type="email"]').attr('disabled', 'disabled');

    // AJAX call to bring Whales to the party!
    // http://api.whale.im/?email=xxx@xxx.xxx
    /*$.ajax({
      url: 'http://api.whale.im/?email=' + $('#mailaddress').val(),
      context: document.body
    }).done(function (data) {
      console.log('data', data);
    });*/

    $.ajax({
      type: 'GET',
      url: 'http://api.whale.im/?meta=1&email=' + $('#mailaddress').val(),
      dataType: 'json',
      success: function(data) {
        console.log('Success', data);

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
            console.log('bar', $bar, 100 - 100 / len * index + '%')
            $bar.css('width', 100 - 100 / len * index + '%');
          }, t);
        });

      },
      error: function (data) {
        console.log('Error');
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