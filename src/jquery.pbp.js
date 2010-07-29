(function($) {
$.fn.pbp = function(args) {

var config = {start:1, dir:">"};
if (args) $.extend(config, args);

var book;
this.each(function(i,target) {

  book = new Object();

  book.initialize = function(config, target) {
    this.config         = config;
    this.pnum           = 0;
    this.ptotal         = this.getPTotal(target);
    this.dir            = config.dir == "<" ? [1,0] : [0,1];
    this.direction      = config.dir == "<" ? 0 : 1;
    this.width          = config.width  || 230;
    this.height         = config.height || 320;
    this.originalWidth  = config.originalWidth || 230;
    this.originalHeight = config.originalHeight || 320;
    this.duration       = config.duration || 100;
    this.title          = this.getTitle();

    this.currentWidth   = this.width;
    this.currentHeight  = this.height;
    this.overlayBg      = null;
    this.cover          = null;
    this.showCover      = false; 
    this.pageTurningEndCallback = null;

    this.initPagePair(target);

    if (this.config.start != 2 && $(target).find(".description").length) {
      this.showCover = true;
      this.initCover();
    } else {
      this.start();
    }
  }

  book.start = function() {
    this.initContainer(target);
    this.showCurrentPages();
    this.container.show();
  }

  book.getPTotal = function(target) {
    var imagesCnt = $(target).find("img").length;
    var total = imagesCnt / 2;
    if (this.config.start % 2 != 0) {
      total ++;
    }
    return total;
  }

  book.getTitle = function() {
    var title = $(target).find(".title").html();
    return (title) ? title : "";
  }

  book.initCover = function() {
    var self = this;
    var container = $("<div></div>");
    var description = $(target).find(".description");
    var firstPage = ((this.pages[0][0] == null) ? this.pages[0][1] : this.pages[0][0]);

    var coverPage = $("<img src=\"" + $(firstPage).attr("src") + "\" width=\"" + this.currentWidth + "\" height=\"" + this.currentHeight + "\" class=\"cover\" />");
    coverPage.bind("click", function() {
      self.setupCoverEvents(container, description, coverPage);
    });
    container.append(coverPage);

    var startButton = $("<div class=\"startButton\">Read</div>");
    startButton.bind("click", function() {
      self.setupCoverEvents(container, description, coverPage);
    });

    description.append(startButton);
    container.append(description);
    container.insertBefore($(target));
    this.cover = container;
  }

  book.setupCoverEvents = function(container, description, coverPage) {
    var self = this;
    description.fadeOut("fast", function() {
      if (self.direction == 1) {
	$(coverPage).animate(
	  { "margin-left": self.currentWidth + "px" },
	  "fast",
	  "linear",
	  function() {
	    container.hide();
	    self.start();
	  }
	);
      } else {
	container.hide();
	self.start();
      }
    });
  }
  
  book.initContainer = function(target, mode) {
    this.container = $(target);
    this.container.empty();

    target.style.width  = (this.currentWidth * 2) + "px";
    target.style.height = this.currentHeight      + "px";

    this.containers    = [];
    this.containers[0] = $("<div class=\"pbp-page\" style=\"width:" + this.currentWidth + "px;float:left;\"></div>");
    this.containers[1] = $("<div class=\"pbp-page\" style=\"width:" + this.currentWidth + "px;float:left;\"></div>");
    this.animations    = []
    this.animations[0] = $("<div style=\"float:left;width:" + this.currentWidth + "px;margin-top:-" + this.currentHeight + "px;display:inline;\"></div>");
    this.animations[1] = $("<div style=\"float:left;width:" + this.currentWidth + "px;margin-top:-" + this.currentHeight + "px;margin-left:" + this.currentWidth + "px;display:inline;\"></div>");
   
    this.container.append(this.makeNavigation(mode));
    this.container.append(this.containers[0]);
    this.container.append(this.containers[1]);
    this.container.append("<br style=\"clear:both\"/>");
    this.container.append(this.animations[0]);
    this.container.append(this.animations[1]);
    // this.container.append("<br style=\"clear:both\"/>");

    // XXX can tweak styles only after appended
    if ($.browser.ipad) {
      $(".jslider-pointer").css("width", "25px");
      $(".jslider-pointer").css("height", "25px");
      $(".jslider-pointer").css("background-position", "-46px -35px");
      $(".jslider-pointer").css("top", "-9px");
      $(".jslider-pointer").css("top", "-9px");
    }

    var self = this;
    if (this.showCover) {
      var lr = this.direction == 0 ? 0 : 1;
      setTimeout(function() {
	self.movePage(lr);
      }, 100);
    }
  }

  book.makeNavigation = function(mode) {
    var self = this;
    var component = $("<div class=\"navigationComponent\" style=\"width:" + (this.currentWidth * 2 - 12) + "px\"></div>");
    component.append("<div class=\"title\">" + this.title + "</div>");

    if (!$.browser.iphone) {
      var slider = $("<input id=\"slider\" type=\"slider\" class=\"slider\" value=\"0\" />");
      var sliderContainer = $("<div class=\"sliderContainer\"></div>");
      sliderContainer.html(slider);
      component.append(sliderContainer);
      slider.slider({
	from: 0,
	to: this.ptotal - 1,
	step: 1,
	round: 0,
	skin: "round",
	onstatechange: function(value) {
	  self.updatePageIndication(parseInt(value) + 1);
	},
	callback: function(value) {
	  if (turning) return;
	  var turning = true;
	  var lr = 0;
          if (self.direction) {
            lr = (value - self.pnum) < 0 ? 0 : 1;
          } else {
            lr = (value - self.pnum) < 0 ? 1 : 0;
          }
          self.pageTurningEndCallback = function() {
            if (self.pnum == value) {
              self.pageTurningEndCallback = null;
	      turning = false;
              return;
            }
            self.movePage(lr);
          };
          self.movePage(lr);
	}
      });
      slider.slider("value", this.pnum);
      sliderContainer.css("margin-left", (this.currentWidth * 2 - 200)/2 + "px");
    }

    if (!$.browser.iphone) {
      var o = $("<div class=\"overlayButton\"></div>");
      o.css("cursor", "pointer");
      var self = this;
      o.bind('mousedown', function() {
	if (mode == "overlay") {
          self.closeOverlay();
	} else {
          self.overlay();
	}
      });
      component.append(o);
    }
    var p = $("<div class=\"pageNum\"><span class=\"pnum\">" + (this.pnum + 1) + "</span>/" + this.ptotal + "</div>");
    p.css("margin-left", self.currentWidth + (200/2) + 18 + "px");
    component.append(p);

    var n = $("<div class=\"navigation\" style=\"width:" + this.currentWidth * 2 + ";margin-top:" + (this.currentHeight - 30) + "px;\"></div>");
    var nbg = $("<div class=\"navigationBg\" style=\"width:" + this.currentWidth * 2 + "px;\"></div>");
    n.append(nbg);
    n.append(component);
    this.setupNavigationEvents(n);


    if ($.browser.ipad) {
      nbg.css("height", "45px");
      n.css("height", "45px");
      component.css("padding", "14px");
      o.css("margin-right", "14px");
    }
    if ($.browser.iphone) {
      p.css("right", "12px");
    }
    if ($.browser.iphone || $.browser.ipad) {
      n.css("display", "none");
    }

    return n;
  }

  book.setupNavigationEvents = function(navigation) {
    var self = this;
    if (!$.browser.iphone && !$.browser.ipad) {
      var fadeSemaphore = null;
      var isFading = false;
      self.lastMoved = +new Date();
      self.container.bind('mousemove', function() {
	if ($.browser.safari && +new Date() - self.lastClicked < 500) {
	  return;
	}
        if (isFading) return;
        isFading = true;
        self.lastMoved = +new Date();
        navigation.fadeIn('fast', function() { isFading = false; });
      });
      self.container.bind('mouseout', function() {
        fadeSemaphore = setTimeout(function() {
          navigation.fadeOut('fast');
        }, 500);
      });
      navigation.bind('mouseover', function() {
        if (fadeSemaphore) {
          clearTimeout(fadeSemaphore);
        }
        navigation.fadeIn('fast');
      });
      window.setInterval(function() {
        var now = +new Date();
        if (now - self.lastMoved > 2000) {
          navigation.fadeOut('fast');
        }
      }, 100);

      // safari handles mousedown as mousemove.
      self.lastClicked = +new Date();
      if ($.browser.safari) {
	self.container.bind('mousedown', function() {
	  self.lastClicked = +new Date();
	});
      }
    } else {
      var t = $("<div class=\"navigationToggle\"></div>");
      t.css({
        "width": self.currentWidth * 2 / 3 + "px",
        "height": self.currentHeight + "px",
        "left": self.currentWidth * 2 / 3,
        "position": "absolute"
      });
      t.toggle(function() {
        navigation.fadeIn("fast");
      }, function() {
        navigation.fadeOut("fast");
      });
      self.container.append(t);

      // swipe
      self.container.swipe({
	swipeLeft: function() { self.movePage(1) },
	swipeRight: function() { self.movePage(0) },
      })
    }
  }

  book.updateSlider = function(lr) {
    var p = (lr == this.direction * 1) ? this.pnum + 1: this.pnum - 1;
    this.container.find(".slider").slider("value", p);
  }
  
  book.initPagePair = function(target) {
    this.pages = [];
    var tmp = $("img", $(target));
    var self = this;
    tmp.each(function(i,e) { e.width = self.width; e.height = self.height; })
    var pagepair = [];
    if (this.config.start == 2) {
      pagepair[this.dir[0]] = tmp[0];
      pagepair[this.dir[1]] = tmp[1];
      this.pages.push(pagepair);
      for (var i = 1; i < Math.ceil(tmp.length / 2.0); i++) {
        pagepair = [];
        pagepair[this.dir[0]] = tmp[i * 2];
        pagepair[this.dir[1]] = tmp[i * 2 + 1] ? tmp[i * 2 + 1] : null;
        this.pages.push(pagepair);
      }
    } else {
      pagepair[this.dir[0]] = null;
      pagepair[this.dir[1]] = tmp[0];
      this.pages.push(pagepair);
      for (var i = 1; i <= Math.floor(tmp.length / 2.0); i++) {
        pagepair = [];
        pagepair[this.dir[0]] = tmp[i * 2 - 1];
        pagepair[this.dir[1]] = tmp[i * 2] ? tmp[i * 2] : null;
        this.pages.push(pagepair);
      }
    }
  }

  
  book.showCurrentPages = function() {
    this.showCurrentHalfPage(0);
    this.showCurrentHalfPage(1);
    this.setPageEventHandler();
    this.updatePageIndication(this.pnum + 1);
  }

  book.showCurrentHalfPage = function(lr) {
    this.animations[lr].empty();
    this.containers[lr].empty();
    var p = this.pages[this.pnum];
    if (p[lr])  {
      this.containers[lr].append(p[lr]);
    } else {
      this.containers[lr].append("<br />");
    }
  }
  
  book.isFirstPage = function() {
    return this.pnum <= 0;
  }
  
  book.isLastPage = function() {
    return this.pages.length - 1 <= this.pnum;
  }
  
  book.isEndPage = function(lr) {
    if (lr == 0) {
      return (this.direction == 0 && this.isLastPage())  || (this.direction == 1 && this.isFirstPage());
    } else {
      return (this.direction == 0 && this.isFirstPage()) || (this.direction == 1 && this.isLastPage()); 
    }
  }
  
  book.setPageEventHandler = function() {
    this.setHalfPageEventHandler(0);
    this.setHalfPageEventHandler(1);
  }
  
  book.setHalfPageEventHandler = function(lr) {
    var p = this.pages[this.pnum];
    if (p[lr] && !this.isEndPage(lr)) {
      var self = this;
      $(p[lr]).bind('click', function() {
        self.movePage(lr);
        self.updateSlider(lr);
      });
    }
  }
  
  book.movePage = function(lr) {
    if (this.isEndPage(lr)) return;
    var d = this.direction;
    var anim;
    if (lr == 0) {
      anim = {width:"0px", height:this.currentHeight + "px" }; //, marginLeft:this.width+ "px"
    } else {
      anim = {width:"0px", height:this.currentHeight + "px"};
    }
    var cfront = this.animations[lr];
    var cback  = this.containers[lr];
    var pfront = this.pages[this.pnum][lr];
    var pback  = this.pages[this.pnum + (lr == this.direction ? 1 : -1)][lr];

    cfront.empty();
    cback .empty();
    cfront.append(pfront);
    cback .append(pback || "<br />");
    
    var self = this; // self.width - this.style.width
    var stepFunc = function() {
      if (lr != 0) return;
      var w  = self.currentWidth;
      var w2 = this.style.width;
      w2 = w2.substring(0, w2.length - 2);
      this.style.marginLeft = (w - w2) + "px";
    }
    
    $(pfront).animate(anim, {duration:this.duration, easing:"linear", step: stepFunc, complete: function() { self.movePage2(lr); }});
  }
  
  book.movePage2 = function(lr) {
    var lr2 = lr == 0 ? 1 : 0;
    this.animations[lr].empty();

    var cfront = this.animations[lr2];
    var pfront = this.pages[this.pnum + (lr == this.direction ? 1 : -1)][lr2];
    pfront.style.width = 0;
    pfront.style.height = this.currentHeight + "px";

    var anim;
    if (lr == 0) {
      anim = {width:this.currentWidth + "px", height:this.currentHeight + "px" };
    } else {
      pfront.style.marginLeft = this.currentWidth + "px";
      anim = {width:this.currentWidth + "px", height:this.currentHeight + "px" };
    }

    cfront.empty();
    cfront.append(pfront);
    
    var self = this;
    var stepFunc = function() {
      if (lr == 0) return;
      var w  = self.currentWidth;
      var w2 = this.style.width;
      w2 = w2.substring(0, w2.length - 2);
      this.style.marginLeft = (w - w2) + "px";
    }
    
    $(pfront).animate(anim, {duration:this.duration, easing:"linear", step: stepFunc, complete: function() { self.movePage3(lr); }});
  }
  
  book.movePage3 = function(lr) {
    this.pnum += (lr == this.direction ? 1 : -1);
    this.showCurrentPages();
    if (this.pageTurningEndCallback != null) {
      this.pageTurningEndCallback();
    }

    if (this.isFirstPage(lr) && this.showCover) {
      this.showCoverAgain();
    }
  }

  book.showCoverAgain = function() {
    this.container.hide();
    this.cover.show();
    var coverPage = this.cover.find("img");
    var description = this.cover.find(".description");
    if (this.direction == 1) {
      $(coverPage).animate(
	{ "margin-left": "0px" },
	"fast",
	"linear",
	function() {
	  description.fadeIn("fast");
	}
      );
    } else {
      description.fadeIn("fast");
    }
  }
  
  book.updatePageIndication = function(num) {
    this.container.find(".pnum").html(num);
  }


  book.overlay = function() {
    this.currentWidth = this.originalWidth;
    this.currentHeight = this.originalHeight;

    this.addOverlayBg();
    this.resizeAllPages();
    this.initOverlayContainer();
    this.setupOverlayEvents();
    this.showCurrentPages();
    this.container.show();
  }

  book.addOverlayBg = function() {
    var self = this;
    var bg = $("<div class=\"overlayBg\">ccc</div>");
    this.overlayBg = bg;
    bg.css({
      width: $(document).width() + "px",
      height: $(document).height() + "px",
      "background-color": "#000",
      position: "absolute",
      opacity: 0.9,
      left: 0,
      top: 0,
      margin: 0,
      padding: 0,
      display: "none"
    });
    bg.click(function() {
      self.closeOverlay();
    });
    $("body").append(bg);
    bg.fadeIn('fast');
  }

  book.initOverlayContainer = function() {
    var container = this.container.clone();
    container.addClass("overlayContainer");
    container.css({
      position: "absolute",
      left: ($("html").width() - this.currentWidth * 2) / 2 + "px",
      top: $("html").exScrollTop() + ($(window).height() - this.currentHeight) / 2 + "px"
    });
    $("body").append(container);
    this.container.empty();
    this.initContainer(container[0], "overlay");
  }

  book.resizeAllPages = function() {
    for (var i=0; i<this.pages.length; i++) {
      var p = this.pages[i];
      for (var j=0; j<p.length; j++) {
        $(p[j]).width(this.currentWidth + "px");
        $(p[j]).height(this.currentHeight + "px");
      }
    }
  }

  book.setupOverlayEvents = function() {
    var self = this;
    $("body").bind("keydown", self.overlayKeyEventHandler);
  }

  book.overlayKeyEventHandler = function(e) {
    var self = this;
    if (e.keyCode == 27) {
      book.closeOverlay();
    }
  }

  book.closeOverlay = function() {
    this.currentWidth = this.width;
    this.currentHeight = this.height;

    this.teardownOverlayEvents();
    this.closeOverlayContainer();
    this.overlayBg.fadeOut("fast", function() { $(this).remove() });
    this.resizeAllPages();
    this.showCurrentPages();
    this.container.show();
  }

  book.closeOverlayContainer = function() {
    $(this.container).remove();
    this.initContainer(target);
  }

  book.teardownOverlayEvents = function() {
    $("body").unbind("keydown", this.overlayKeyEventHandler);
  }
 
  $.fn.exScrollTop = function() {
    return this.attr('tagName')=='HTML' ? $(window).scrollTop() : this.scrollTop();
  }

  book.initialize(config, target);

});
 
return this;
};

})(jQuery);

(function($) {
  if (navigator.userAgent.match(/iPad/)) {
    $.browser.ipad = true;
    $.browser.iphone = false;
    $.browser.safari = false;
  } else if (navigator.userAgent.match(/iPhone/)) {
    $.browser.ipad = false;
    $.browser.iphone = true;
    $.browser.safari = false;
  } else {
    $.browser.ipad = false;
    $.browser.iphone = false;
  }
})(jQuery);


(function($) {
$.fn.swipe = function(options) {
    // Default thresholds & swipe functions
    var defaults = {
        threshold: {
            x: 80,
            y: 40
        },
        swipeLeft: function() { alert('swiped left') },
        swipeRight: function() { alert('swiped right') },
        preventDefaultEvents: true
    };

    var options = $.extend(defaults, options);

    if (!this) return false;

    return this.each(function() {

        var me = $(this)

        // Private variables for each element
        var originalCoord = { x: 0, y: 0 }
        var finalCoord = { x: 0, y: 0 }

        // Screen touched, store the original coordinate
        function touchStart(event) {
            //console.log('Starting swipe gesture...')
            originalCoord.x = event.targetTouches[0].pageX
            originalCoord.y = event.targetTouches[0].pageY
        }

        // Store coordinates as finger is swiping
        function touchMove(event) {
            if (defaults.preventDefaultEvents)
                event.preventDefault();
            finalCoord.x = event.targetTouches[0].pageX // Updated X,Y coordinates
            finalCoord.y = event.targetTouches[0].pageY
        }

        // Done Swiping
        // Swipe should only be on X axis, ignore if swipe on Y axis
        // Calculate if the swipe was left or right
        function touchEnd(event) {
            //console.log('Ending swipe gesture...')
            var changeY = originalCoord.y - finalCoord.y
            if(changeY < defaults.threshold.y && changeY > (defaults.threshold.y*-1)) {
                changeX = originalCoord.x - finalCoord.x

                if(changeX > defaults.threshold.x) {
                    defaults.swipeLeft()
                }
                if(changeX < (defaults.threshold.x*-1)) {
                    defaults.swipeRight()
                }
            }
        }

        // Swipe was canceled
        function touchCancel(event) { 
            //console.log('Canceling swipe gesture...')
        }

        // Add gestures to all swipable areas
        this.addEventListener("touchstart", touchStart, false);
        this.addEventListener("touchmove", touchMove, false);
        this.addEventListener("touchend", touchEnd, false);
        this.addEventListener("touchcancel", touchCancel, false);

    });
};
})(jQuery);
