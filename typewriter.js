var TW = {color: 'black'};
TW.hidden_input = function(onkey, onnav, oncarriage) {
    var NAVIGATION = {
	    8: -1,                  // 'delete'
	    35: 9999,               // 'end'
	    36: -9999,              // 'home'
	    37: -1,                 // 'left'
	    39: 1,                  // 'right'
	    9: 8                    // 'tab': XXX should be page-aligned?
    };

    var $el = $('<input>')
	    .css({opacity: 0, position:"fixed"})
	    .keydown(function(ev) {
	        if(ev.keyCode in NAVIGATION) {
		        onnav(NAVIGATION[ev.keyCode]);
		        ev.preventDefault();
	        }
	        else if(ev.keyCode == 13) {
		        // "Return"
		        oncarriage();
		        ev.preventDefault();
	        }
	    })
	    .bind('input', function(ev) {
	        onkey($(this).val());
	        $(this).val('');
	        ev.preventDefault();
	    });

    return $el;
};
TW.TypedLine = function(nchars, x, y) {
    this.state = {};              // col -> "letters"
    this.timing = {};             // timestamp -> col

    // maintain a duration attribute.
    this.duration = 0;

    this.nchars = nchars;
    this.x = x;
    this.y = y;
    this.SIZE = 12;
    this.WIDTH = this.SIZE * 3/4;
    this.HEIGHT = this.SIZE * 4/3;
    this.$canvas = $("<canvas>")
    	.attr({width: nchars*this.SIZE, height: this.HEIGHT});
    this.ctx = this.$canvas[0].getContext('2d');
    this.ctx.fillStyle = TW.color;
    this.ctx.font = 'bold ' + this.SIZE + 'px Courier';

    this.$cursor = $("<div>")
	    .css({position: "absolute",
	          backgroundColor: TW.color,
	          width: this.WIDTH,
	          height: 3,
	          left: 0,
	          top: this.SIZE
	         });

    this.$el = $("<div>")
	    .css({position: "absolute",
	          left: x,
	          top: y
	         })
	    .append(this.$canvas)
    	.append(this.$cursor);

    this.cursor = 0;
};
TW.TypedLine.prototype.onkey = function(key) {
    this.ctx.fillText(key, this.cursor*this.WIDTH, this.SIZE);

    var time = new Date().getTime();
    if(!this._start) { this._start = time; }
    else {this.duration = time - this._start; }

    this.state[this.cursor] = (this.state[this.cursor] || '')  + key;
    this.timing[time] = this.cursor;

    this.onnav(1);
};
TW.TypedLine.prototype.onnav = function(delta) {
    this.cursor = Math.min(this.nchars-1,
			               Math.max(0, this.cursor+delta));

    this.$cursor.css({left: (this.cursor)*this.WIDTH});
};
TW.TypedLine.prototype.onquit = function() {
    this.$cursor.css({display: "none"});
};

TW.replay_line = function(state, timing, x, y) {
    var nchars = 0;
    for(var col in state) {
        var n = Number(col);
        if (n > nchars) {
            nchars = n;
        }
    }

    var tline = new TW.TypedLine(nchars, x, y);
    // don't display cursor
    tline.onquit();

    if(nchars == 0) { return tline.$el; }

    // times = sorted(timing.keys()) # sometimes one wonders...
    var times = [];
    for(var time in timing) { times.push(Number(time)); }
    times.sort();

    // start 'er up!
    var idx = 0;
    var next = function() {
        var col = timing[times[idx]];
        var key = state[col].slice(0,1);
        state[col] = state[col].slice(1);
        tline.cursor = col;
        tline.onkey(key)
        idx += 1;
        if(idx < times.length) {
            // trigger next character after an appropriate timeout
            window.setTimeout(next, times[idx]-times[idx-1]);
        }
    };
    next();

    return tline.$el;
};

TW.Typewriter = function(parent) {
    var $parent = $(parent || "body");
    var $el = $("<div>", {class: "typewriter"})
        .css({position: "relative"})
        .prependTo($parent);
    var lines = [];

    var that = this;

    var $hi = TW.hidden_input(
        function(key) {
            lines[lines.length-1].onkey(key);
        },
        function(delta) {
            lines[lines.length-1].onnav(delta);
        },
        function() {
            var line = lines[lines.length-1];
            that.newline(line.x, line.y+14);
        }
    ).appendTo($el);

    // Grab mouse clicks within the parent
    $parent
        .click(function(ev) {
	        var x = ev.clientX + document.body.scrollLeft;
	        var y = ev.clientY + document.body.scrollTop;
            var pos = that.$parent.offset();
            that.newline(x-pos.left, y-12-pos.top);
        });

    this.$parent = $parent;
    this.$el = $el;
    this.$hi = $hi;
    this.lines = lines;

    this.newline(20,20);
};
TW.Typewriter.prototype.newline = function(x,y) {
    var line;
    if(this.lines.length > 0) {
        line = this.lines[this.lines.length-1];
	    line.onquit();
    }
    // XXX: hardcoded 9 = 12 * 3 / 4
    var nchars = Math.floor((this.$parent.width() - x) / 9);
	line = new TW.TypedLine(nchars, x, y);
	this.lines.push(line)
	line.$el
	    .appendTo(this.$el);
	this.$hi.focus();
};

TW.replay_typewriter = function(type) {
    var $replay = $("<div>")
        .css({position: "relative"});
    var idx = 0;
    var next = function() {
        var line = type.lines[idx];
        var $rline = TW.replay_line(line.state, line.timing, line.x, line.y)
            .appendTo($replay);
        idx += 1;
        if(idx < type.lines.length) {
            window.setTimeout(next, line.duration+100);
        }
    }
    next();
    return $replay;
};
