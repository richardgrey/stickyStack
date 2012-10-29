(function () {
    'use strict';

    var $win = $(window),
        stickers = [],
        on = false,
        stack,
        reflow;
        
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
                stack[stack.length] = sticker;

                return this.height;
            },
            /**
             * Remove sticker from stack
             * @param  {Sticker} sticker [description]
             * @return {Number} current stack height
             */
            remove: function (sticker) {
                var pos = $.inArray(sticker, stack);

                if (!!~pos) {
                    stack.splice(pos, 1);
                    this.height -= sticker.height;
                }

                return this.height;
            },

            getHeight: function () {
                return this.height;
            },

            clear: function () {
                this.height = 0;
                stack = [];
            }
        };
    }());

    /**
     * Sticker
     * Abstract representation of DOM element as sticker
     *
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

    Sticker.prototype.destroy = function () {
        this.comeOff();
        this.placeholder.remove();
    };

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
            return this;
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
    reflow = function () {
        var scrollTop = $win.scrollTop(),
            l = stickers.length,
            sticker,
            i;

        for (i = 0; i < l; i++) {
            sticker = stickers[i];

            if (!sticker.sticked && scrollTop + stack.height >= sticker.staticPos) {
                sticker.stick();
            } else if (scrollTop + stack.height - sticker.height < sticker.staticPos) {
                sticker.comeOff();
            }
        }
    };

    function eventsOn() {
        $win.on('scroll resize', reflow);
    }
    function eventsOff() {
        $win.on('scroll resize', reflow);
    }

    /**
     *
     * @param {String} command   Command to exec
     * @return {*|jQuery}
     */
    $.fn.stickyStack = function (command) {
        var $this = $(this);

        if (command === 'off') {
            $this.each(function () {
                var data = $.data(this),
                    pos;

                if (!data.sticker) {
                    return ;
                }

                pos = $.inArray(data.sticker, stickers);
                if (!!~pos) {
                    stickers.splice(pos, 1);
                }
                data.sticker.destroy();
                delete data.sticker;

                if (!stickers.length) {
                    on = false;
                    eventsOff();
                }
            });

            // Recalc all stack
            stack.clear();
            $.each(stickers, function (i, sticker) {
                sticker.sticked = false;
            });
            reflow();

        } else {
            $this.each(function () {
                var data = $.data(this);

                if (data.sticker) {
                    return ;
                }

                data.sticker = stickers[stickers.length] = new Sticker(this);

                if (!on) {
                    on = true;
                    eventsOn();
                }
            });
        }

        return $this;
    };

    

}());

