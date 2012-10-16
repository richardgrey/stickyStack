(function () {
	'use strict';

	var $win = $(window),
		stickers = [],
		stack,
		onScroll;
		
	/**
	 * Stack
	 * @singletone
	 * @return {Object} stack object
	 */
	stack = (function () {
		var stack = [];

		return {
			height: 0,

			/**
			 * Add sticker object to stack
			 * @param  {Sticker} sticker 
			 * @return {Number} current stack height
			 */
			push: function (sticker) {
				this.height += sticker.height;
				stack[stack.lenght] = sticker;
				return this.height;
			},
			/**
			 * Remove sticker from stack
			 * @param  {Sticker} sticker [description]
			 * @return {Number} current stack height
			 */
			remove: function (sticker) {
				var pos = $.inArray(stack, sticker);

				if (!~pos) {
					stack.splice($.inArray(stack, sticker), 1);
					this.height -= sticker.height;
				}
				return this.height;
			},

			getHeight: function () {
				return this.height;
			}
		};
	}());

	/**
	 * Sticker
	 * @constructor
	 * @param {HTMLElement} node DOM node
	 */
	function Sticker(node) {
		this.$ = $(node);
		this.sticked = false;
		this.height = this.$.outerHeight();
		this.staticPos = this.$.offset().top;
		this.staticCss = {
			position: this.$.css('position'),
			top: this.$.css('top')
		};
		this.placeholder = $('<div />').css({
			display: 'none',
			height: this.height
		}).insertAfter(this.$);
	}

	/**
	 * Stick sticker to bottom of stack
	 * @return {Sticker} this
	 */
	Sticker.prototype.stick = function () {
		var stackHeight;
		
		if (this.sticked) {
			return this;
		}
		stackHeight = stack.getHeight();
		this.$.css({
			position: 'fixed',
			top: stackHeight
		});
		stack.push(this);
		this.placeholder.show();
		this.sticked = true;

		return this;
	};
	/**
	 * Return sticker to statick position
	 * @return {Sticker} this
	 */
	Sticker.prototype.comeOff = function () {
		if (!this.sticked) {
			return ;
		}
		stack.remove(this);
		this.$.css(this.staticCss);
		this.placeholder.hide();
		this.sticked = false;

		return this;
	};

	/**
	 * Scroll callback
	 */
	onScroll = function () {
		var scrollTop = $win.scrollTop(),
			sticker,
			posTop,
			i,
			l;

		for (i = 0, l = stickers.length; i < l; i++) {
			sticker = stickers[i];

			if (!sticker.sticked && scrollTop + stack.height >= sticker.staticPos) {
				sticker.stick();
			} else if (sticker.sticked && scrollTop + stack.height - sticker.height < sticker.staticPos) {
				sticker.comeOff();
			}
		}
	};

	function scrollOn() {
		$win.on('scroll resize', onScroll);
	}
	function scrollOff() {
		$win.off('scroll resize', onScroll);
	}

	$.fn.stickyStack = function () {
		var on = false;

		return $(this).each(function () {
			stickers.push(new Sticker(this));
			if (!on) {
				on = true;
				bindScroll();
			}
		});
	};

	

}());


$(function () {
	$('div').stickyStack();
});

