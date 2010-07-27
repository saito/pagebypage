(function($) {
$.fn.pbp = function(settings) {

var config = {start:1, dir:">"};
if (settings) $.extend(config, settings);

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
    this.browser        = this.getBrowser();

    this.currentWidth   = this.width;
    this.currentHeight  = this.height;

    this.initPagePair(target);
    this.initContainer(target);
    this.showCurrentPages();
    this.container.show();
    this.pageTurningEndCallback = null;
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

  book.getBrowser = function() {
    if (navigator.userAgent.match(/iPad/)) {
      return "ipad";
    } else if (navigator.userAgent.match(/iPhone/)) {
      return "iphone";
    } else if ($.browser.safari) {
      return "safari";
    } else if ($.browser.opera) {
      return "opera";
    } else if ($.browser.msie) {
      return "msie";
    } else if ($.browser.mozilla) {
      return "mozilla";
    }
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
  }

  book.makeNavigation = function(mode) {
    var self = this;
    var component = $("<div class=\"navigationComponent\" style=\"width:" + (this.currentWidth * 2 - 12) + "px\"></div>");
    component.append("<div class=\"title\">" + this.title + "</div>");
    var slider = $("<div class=\"slider\"></div>");
    slider.css({
      "width": "200px",
      "height": "2px",
      "background-color": "#000",
      "position": "absolute",
      "margin-top": "8px"
    });
    slider.css("margin-left", (this.currentWidth * 2 - 200)/2 + "px");
    slider.slider({
      stop: function(event, ui) {
        var moveTo = Math.round((self.ptotal - 1) * (ui.value / 100));
        var lr = 0;
        if (self.direction) {
          lr = (moveTo - self.pnum) < 0 ? 0 : 1;
        } else {
          lr = (moveTo - self.pnum) < 0 ? 1 : 0;
        }
        var slider = $(this);
        self.pageTurningEndCallback = function() {
          if (self.pnum == moveTo) {
            self.pageTurningEndCallback = null;
            slider.slider("enable");
            return;
          }
          self.movePage(lr);
        };
        $(this).slider("disable");
        self.movePage(lr);
      }
    });
    component.append(slider);
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
    var p = $("<div class=\"pageNum\"><span class=\"pnum\">" + (this.pnum + 1) + "</span>/" + this.ptotal + "</div>");
    p.css("margin-left", self.currentWidth + (200/2) + 18 + "px");
    component.append(p);

    var n = $("<div class=\"navigation\" style=\"width:" + this.currentWidth * 2 + ";margin-top:" + (this.currentHeight - 30) + "px;\"></div>");
    n.append("<div class=\"navigationBg\" style=\"width:" + this.currentWidth * 2 + "px;\"></div>");
    n.append(component);
    this.setupNavigationEvents(n);
    return n;
  }

  book.setupNavigationEvents = function(navigation) {
    var self = this;
    if (this.browser != "iphone" && this.browser != "ipad") {
      var fadeSemaphore = null;
      var isFading = false;
      self.lastMoved = +new Date();
      self.container.bind('mousemove', function() {
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
    } else {
      var t = $("<div class=\"navigationToggle\"></div>");
      t.css({
        "width": self.width * 2 / 3 + "px",
        "height": self.height + "px",
        "left": self.width * 2 / 3,
        "position": "absolute"
      });
      t.toggle(function() {
        navigation.fadeOut("fast");
      }, function() {
        navigation.fadeIn("fast");
      });
      self.container.append(t);
    }
  }

  book.updateSlider = function(lr) {
    var p = 0;
    if (this.direction == 0) {
      p = (lr == 1) ? this.pnum - 1 : this.pnum + 1;
    } else {
      p = (lr == 0) ? this.pnum - 1 : this.pnum + 1;
    }    
    var value = p / (this.ptotal - 1) * 100;
    this.container.find(".slider").slider("value", value);
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
    this.container.find(".pnum").html(this.pnum + 1);
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
  }
  

  book.overlay = function() {
    this.currentWidth = this.originalWidth;
    this.currentHeight = this.originalHeight;

    this.addOverlayBg();
    this.resizeAllPages();
    this.initOverlayContainer();
    this.showCurrentPages();
    this.container.show();
  }

  book.addOverlayBg = function() {
    var bg = $("<div class=\"overlayBg\">ccc</div>");
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
    $("body").append(bg);
    bg.fadeIn('fast');
  }

  book.initOverlayContainer = function() {
    var container = $("<div class=\"book overlayContainer\"></div>");
    container.css({
      position: "absolute",
      left: ($("html").width() - this.currentWidth * 2) / 2 + "px",
      top: $("html").exScrollTop() + ($(window).height() - this.currentHeight) / 2 + "px"
    });
    $("body").append(container);
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
/*
    for (var i=0; i<this.animations.length; i++) {
      var p = this.animations[i];
      for (var j=0; j<p.length; j++) {
        $(p[j]).width(this.currentWidth + "px");
        $(p[j]).height(this.currentHeight + "px");
      }
    }
*/
  }


  book.closeOverlay = function() {
    alert('close');
  }

  $.fn.exScrollTop = function() {
    return this.attr('tagName')=='HTML' ? $(window).scrollTop() : this.scrollTop();
  }

  book.initialize(config, target);
  
});
 
return this;
};

})(jQuery);
