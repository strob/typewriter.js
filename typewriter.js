var TW = {};
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
	    .css({opacity: 0})
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
    this.nchars = nchars;
    this.x = x;
    this.y = y;
    this.SIZE = 12;
    this.WIDTH = this.SIZE * 3/4;
    this.HEIGHT = this.SIZE * 4/3;
    this.$canvas = $("<canvas>")
    	.attr({width: nchars*this.SIZE, height: this.HEIGHT});
    this.ctx = this.$canvas[0].getContext('2d');
    this.ctx.fillStyle = 'black;'
    this.ctx.font = 'bold ' + this.SIZE + 'px Courier';

    this.$cursor = $("<div>")
	    .css({position: "absolute",
	          backgroundColor: 'black',
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
    this.onnav(1);
};
TW.TypedLine.prototype.onnav = function(delta) {
    this.cursor = Math.min(this.nchars-1,
			               Math.max(0, this.cursor+delta));

    this.$cursor.offset({left: this.x+(this.cursor)*this.WIDTH});
};
TW.TypedLine.prototype.onquit = function() {
    this.$cursor.css({display: "none"});
};
