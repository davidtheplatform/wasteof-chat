(function (extension) {
    'use strict';

    // UML - Universal Module Loader
    // This enables the extension to be loaded in different environments
    if (typeof showdown !== 'undefined') {
        // global (browser or nodejs global)
        extension(showdown);
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['showdown'], extension);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = extension(require('showdown'));
    } else {
        // showdown was not found so we throw
        throw Error('Could not find showdown library');
    }

}(function (showdown) {
    'use strict';

    window.showdown = showdown;

    showdown.extension('remove_p_tag', function () {
        'use strict';

        return {
            type: 'output',
            filter: function (text, converter, options) {
                if (text.startsWith("<p>") && text.endsWith("</p>")) {
                    text = text.slice(3, -4);
                }
                return text;
            },
        };
    });

    showdown.extension('br_to_p', function () {
        'use strict';

        return {
            type: 'output',
            filter: function (text, converter, options) {
                console.log(text);
                return text.replace("<br />", "<p></p>");
            },
        };
    });

    showdown.extension('emojis', function () {
        'use strict';

        return {
            type: 'lang',
            regex: /:([a-zA-Z0-9_]+):/g,
            replace: function (name) {
                return window.emoji_create_html(name);
            }
        }
    });

    showdown.extension('custom_image', function () {
        'use strict';

        return {
            type: 'lang',
            regex: /(?:::)(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))(?:::)/g,
            replace: '<img src="$1" />'
        }
    });


    showdown.extension('mentions', function () {
        'use strict';

        return {
            type: 'lang',
            regex: /@[a-zA-Z0-9]+/g,
            replace: function (text, converter, options) {
                var user = text.replace('@', '').toLowerCase();

                return window.create_mention(user);
            }
        }
    });

    showdown.extension('highlight_mention', function () {
        'use strict';

        return {
            type: 'output',
            filter: function (text, converter, options) {
                console.log('highlight');
                if (window.mentions_user(text, window.current_user)) {
                    console.log('yes');
                    text = '<span data-highlight="yes">' + text + "</span>";
                }

                console.log("sent", text);

                return text;
            }
        }
    });
}));