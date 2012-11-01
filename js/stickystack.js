/**
 * StickyStack — jQuery plugin
 *
 * @version 0.2.0
 * @author Richard Grey <richie.grey@gmail.com>
 * @see https://github.com/richardgrey/stickyStack
 */
(function ($) {
    'use strict';

    var DATA_PROP = 'stickyStack',
        CONTEXT_EVENT_ATTACH = 'stickystack.attach',
        CONTEXT_EVENT_DETACH = 'stickystack.detach',
        STICKER_EVENT_STICK = 'stickystack.stick',
        STICKER_EVENT_COMEOFF = 'stickystack.comeoff',

        $win = $(window),
        contexts = [],

        // Viewport dimensions
        viewport = {
            width: window.innerWidth || $win.width(),
            height: window.innerHeight || $win.height()
        },

        /**
         * Abstract representation of scrolled element
         *
         * @constructor
         * @param {jQuery} $node   Element which to be context
         */
        Context = function ($node) {
            this.$ = $node;
            this.height = 0;
            this.stickers = [];
            this.stack = [];
            this.reflow = null;
            this.start();
        },

        /**
         * Abstract representation of element, that should stick
         *
         * @constructor
         * @param {jQuery} $node   Sticker element
         * @param {Context} context   Context in which sticker should stick
         */
        Sticker = function ($node, context) {
            $.extend(this, {
                $: $node,
                context: context,
                sticked: false,
                height: $node.outerHeight(),
                staticPos: $node.offset().top,
                staticCss: {
                    position: $node.css('position'),
                    top: $node.css('top')
                }
            });

            // Placeholder element
            this.placeholder = $('<div />')
                .css({
                    display: 'none',
                    height: this.height
                })
                .insertAfter($node);

            context.addSticker(this);
        },

        /**
         * Methods container
         */
        stickyStack = {
            /**
             * Create stickers
             * Runs in context of jQuery elements.
             *
             * @param {Object} options   Options for sticker
             */
            initSticker: function (options) {
                this.each(function () {
                    var $this = $(this),
                        data = $.data(this),
                        $ctx,
                        context;

                    if (data[DATA_PROP] && data[DATA_PROP].sticker) {
                        return ;
                    }

                    if (options && options.context) {
                        $ctx = $this.closest(options.context);
                    }
                    context = stickyStack.getContext($ctx);

                    data[DATA_PROP] = data[DATA_PROP] || {};
                    data[DATA_PROP].sticker = new Sticker($this, context);
                });
            },

            /**
             * Get Context object from this node
             *
             * @param {jQuery} [$ctx]   jQuery object that should be an context. If omitted, object is window.
             * @return {Context} context for
             */
            getContext: function ($ctx) {
                var data;

                $ctx = $ctx && $ctx.length ? $ctx : $win;
                data = $.data($ctx);

                if (data[DATA_PROP] && data[DATA_PROP].context) {
                    return data[DATA_PROP].context;
                }

                return this.createContext($ctx, data);
            },

            /**
             * Create Context object and put it in cash
             *
             * @param {jQuery} $ctx   Object that should be an context for stickers
             * @param {Object} cash   Storage for context object
             * @return {Context} Context controller
             */
            createContext: function ($ctx, cash) {
                cash[DATA_PROP] = cash[DATA_PROP] || {};
                return cash[DATA_PROP].context = contexts[contexts.length] = new Context($ctx);
            }
        };

    //
    // Constructors prototype extending
    //
    $.extend(Context.prototype, {
        /**
         * Add sticker to context cash
         *
         * @param {Sticker} sticker   Sticker object to add
         * @return {Number} Count stickers in context
         */
        addSticker: function (sticker) {
            return this.stickers.push(sticker);
        },

        /**
         * Remove sticker from context
         *
         * @param {Sticker} sticker   Sticker which to remove
         * @return {Number} Count stickers in context
         */
        removeSticker: function (sticker) {
            var stickers = this.stickers,
                pos = $.inArray(sticker, stickers);

            if (~pos) {
                stickers.splice(pos, 1);
            }

            return stickers.length;
        },

        /**
         * Take sticker into stack
         *
         * @param {Sticker} sticker
         * @return {Context}
         */
        attach: function (sticker) {
            this.height += sticker.height;
            this.stack.push(sticker);
            this.$.trigger(CONTEXT_EVENT_ATTACH, sticker);

            return this;
        },

        /**
         * Discard sticker from stack
         *
         * @param {Sticker} sticker
         * @return {Context}
         */
        dispatch: function (sticker) {
            var stack = this.stack,
                pos = $.inArray(sticker, stack);

            if (~pos) {
                stack.splice(pos, 1);
                this.height -= sticker.height;
            }
            this.$.trigger(CONTEXT_EVENT_DETACH, sticker);

            return this;
        },

        /**
         * Return total height of stickied stickers
         *
         * @return {Number} height
         */
        getStackHeight: function () {
            return this.height;
        },

        /**
         * Clear stack
         *
         * @return {Context}
         */
        clear: function () {
            $.each(this.stack, function (i, sticker) {
                sticker.comeOff(true);
            });
            this.stack = [];
            this.height = 0;

            return this;
        },

        /**
         * Start react on scroll
         *
         * @return {Context}
         */
        start: function () {
            this.reflow = this.reflow || this.makeReflow();
            this.$.on('scroll', this.reflow);
            return this;
        },

        /**
         * Stop reaction on scroll
         *
         * @return {Context}
         */
        stop: function () {
            this.$.off('scroll', this.reflow);
            return this;
        },

        /**
         * Creates function that check positions of all stickers
         *
         * @return {Function}
         */
        makeReflow: function () {
            var context = this;

            return function () {
                var scrollTop = context.$.scrollTop(),
                    stackHeight = context.getStackHeight();

                $.each(context.stickers, function (i, sticker) {
                    if (!sticker.sticked && scrollTop + stackHeight >= sticker.staticPos) {
                        sticker.stick();
                    } else if (scrollTop + stackHeight - sticker.height < sticker.staticPos) {
                        sticker.comeOff();
                    }
                });
            };
        }
    });

    $.extend(Sticker.prototype, {
        /**
         * Stick at the bottom of stack
         *
         * @return {Sticker}
         */
        stick: function () {
            var context = this.context,
                stackHeight = context.getStackHeight();

            this.$.css({
                position: 'fixed',
                top: stackHeight
            });
            context.attach(this);
            this.placeholder.show();
            this.sticked = true;
            this.$.trigger(STICKER_EVENT_STICK);

            return this;
        },

        /**
         * Come off
         *
         * @param {Boolean} [force]   Skip context dispatching
         * @return {Sticker}
         */
        comeOff: function (force) {
            if (!force) {
                this.context.dispatch(this);
            }
            this.$.css(this.staticCss);
            this.placeholder.hide();
            this.sticked = false;
            this.$.trigger(STICKER_EVENT_COMEOFF);

            return this;
        },

        /**
         * Cleanup everything
         */
        destroy: function () {
            if (this.sticked) {
                this.comeOff();
            }
            this.placeholder.remove();
            this.context.removeSticker(this);
        }
    });

    //
    // jQuery exports
    //
    $.fn.stickyStack = function () {
        var args = Array.prototype.slice.apply(arguments);

        stickyStack.initSticker.apply(this, args);
    };

    $.stickyStack = function () {

    };

    $.stickyStack.defaults = {

    };

    $win.on('load', function () {
        $.each(contexts, function (i, context) {
            context.reflow();
        });
    });


}(jQuery));