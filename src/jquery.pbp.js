(function($) {
$.fn.pbp = function(settings) {

var config = {start:1, dir:">"};
if (settings) $.extend(config, settings);

var book;
this.each(function(i,target) {

  book = new Object();
  
  book.initialize = function(config, target) {
    this.config    = config;
    this.pnum      = 0;
    this.dir       = config.dir == "<" ? [1,0] : [0,1];
    this.direction = config.dir == "<" ? 0 : 1;
    this.width     = config.width  || 230;
    this.height    = config.height || 320;
    this.duration  = config.duration || 100;

    this.initPagePair(target);
    this.initContainer(target);
    this.showCurrentPages();
    this.container.show();
  }
  
  book.initContainer = function(target) {
    this.container = $(target);
    this.container.empty();
    target.style.width  = (this.width * 2) + "px";
    target.style.height = this.height      + "px";
    this.containers    = [];
    this.containers[0] = $("<div class=\"pbp-page\" style=\"width:" + this.width + "px;float:left;\"></div>");
    this.containers[1] = $("<div class=\"pbp-page\" style=\"width:" + this.width + "px;float:left;\"></div>");
    this.animations    = []
    this.animations[0] = $("<div style=\"float:left;width:" + this.width + "px;margin-top:-" + this.height + "px;display:inline;\"></div>");
    this.animations[1] = $("<div style=\"float:left;width:" + this.width + "px;margin-top:-" + this.height + "px;margin-left:" + this.width + "px;display:inline;\"></div>");
    
    this.container.append(this.containers[0]);
    this.container.append(this.containers[1]);
    this.container.append("<br style=\"clear:both\"/>");
    this.container.append(this.animations[0]);
    this.container.append(this.animations[1]);
    // this.container.append("<br style=\"clear:both\"/>");
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
      });
    }
  }
  
  book.movePage = function(lr) {
    if (this.isEndPage(lr)) return;
    var d = this.direction;
    var anim;
    if (lr == 0) {
      anim = {width:"0px", height:this.height + "px" }; //, marginLeft:this.width+ "px"
    } else {
      anim = {width:"0px", height:this.height + "px"};
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
      var w  = self.width;
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
    pfront.style.height = this.height + "px";

    var anim;
    if (lr == 0) {
      anim = {width:this.width + "px", height:this.height + "px" };
    } else {
      pfront.style.marginLeft = this.width + "px";
      anim = {width:this.width + "px", height:this.height + "px" };
    }

    cfront.empty();
    cfront.append(pfront);
    
    var self = this;
    var stepFunc = function() {
      if (lr == 0) return;
      var w  = self.width;
      var w2 = this.style.width;
      w2 = w2.substring(0, w2.length - 2);
      this.style.marginLeft = (w - w2) + "px";
    }
    
    $(pfront).animate(anim, {duration:this.duration, easing:"linear", step: stepFunc, complete: function() { self.movePage3(lr); }});
  }
  
  book.movePage3 = function(lr) {
    this.pnum += (lr == this.direction ? 1 : -1);
    this.showCurrentPages();
  }

  book.initialize(config, target);
  
});
 
return this;
};

})(jQuery);
