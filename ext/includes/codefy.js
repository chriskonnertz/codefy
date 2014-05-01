// @include *
with(window) {
    var codefy = {
        ishidden : 0,
        dragoffsetx: 0,
        dragoffsety: 0,
        init: function(css) { // main method. setup the whole thing.
            var self = this;

            if (typeof(jQuery) == 'undefined') { // if jquery is not available
                console.log('Codefy needs the jQuery library.');
                return;
            }

            if ($('#codefy').length > 0) { // if there exists a dom element with id = codefy
                console.log('Codefy already initialized or id-conflict detected.');
                return; // dont allow to double-initialize  
            }

            // ---------------------------------------------------------------------------------------------------------
            var $butmenu = self.createmenubutton('Codefy');
            var $butsettings = self.createmenubutton('Settings');

            var $nav = $('<div />').addClass('codefy-nav').append($butmenu).append($butsettings).click(function() {
                if (self.ishidden == 1) {
                    self.ishidden = -1; // -1 = in transition
                    $widgetui.css('cursor', 'default !important');
                    $(this).animate({'margin-right': '0'}, {duration: 'fast', complete: function() { self.ishidden = 0; }});
                }
            });
            var $widgetui =  $('<div />').attr('id','codefy').append($nav);

            // ---------------------------------------------------------------------------------------------------------
            var $notifier = $('<div />').addClass('codefy-notifier').click(function() {
                $(this).fadeOut('fast', function() {
                    self.notifierclear();
                });
            });
            $widgetui.append($notifier);

            // ---------------------------------------------------------------------------------------------------------
            var $menusubnav = $('<ul />')
                .append($('<li />').text('Outline containers').click(function() {
                    $('div,section,header,article,nav,aside,footer,table,form,ul,hgroup').not('#codefy,#codefy *').toggleClass('codefy-show-struct');
                }))
                .append($('<li />').text('Show largest image').click(function() {
                    var size = -1;
                    var element = null;
                    $('img').each(function() {
                        var thissize = $(this).width() * $(this).height();
                        if (thissize > size) {
                            size = thissize;
                            element = $(this).get(0);
                        }
                    });
                    if (element !== null) window.location.assign(element.src);
                }))
                .append($('<li />').text('Validate HTML').click(function() {
                    window.open('http://validator.w3.org/check?uri=' + window.location.href);
                }))
                .append($('<li />').text('Validate CSS').click(function() {
                    window.open('http://jigsaw.w3.org/css-validator/validator?uri=' + window.location.href);
                }))
                .append($('<li />').addClass('codefy-spacer'))
                .append($('<li />').text('Minimize').click(function() {
                    if (self.ishidden == 0) {
                        self.ishidden = -1; // -1 = in transition
                        var newwidth = $nav.width() + 40;
                        $nav.animate({'margin-right': '-' + newwidth}, {duration: 'fast', complete: function() { self.ishidden = 1; }});
                    }
                }))
                .addClass('codefy-subnav');
            $butmenu.append($menusubnav);

            // ---------------------------------------------------------------------------------------------------------
            var $settingssubnav = $('<ul />')
                .append($('<li />').append(self.createuicheckbox('inspectmode')).append('Inspection mode').mouseup(function() {
                    if (self.setpreferencemenu(this, 'inspectmode') == false) {
                        $surveyor.animate({'margin-top': '+=10'},{duration: 50, queue: false}).fadeOut('fast');
                    }
                }))
                .append($('<li />').addClass('codefy-spacer'))
                .append($('<li />').append(self.createuicheckbox('showlog')).append('Show console.log').mouseup(function() {
                    self.setpreferencemenu(this, 'showlog');
                }))
                .append($('<li />').append(self.createuicheckbox('showmpos')).append('Show mouse position').mouseup(function() {
                    self.setpreferencemenu(this, 'showmpos');
                }))
                .append($('<li />').addClass('codefy-spacer'))
                .append($('<li />').append(self.createuicheckbox('noinjection')).append('Never start me here').mouseup(function() {
                    self.setpreferencemenu(this, 'noinjection');
                }))
                .addClass('codefy-subnav')
                .addClass('codefy-subnav-big');
            $butsettings.append($settingssubnav);
            if (self.getpreference('inspectmode') == '1') $('html').css('cursor','pointer');

            // ---------------------------------------------------------------------------------------------------------
            // although draggable is a html5 attribute, drag and drop will work on older doc types such as xhtml
            var $surveyor = $('<div draggable="true" />').addClass('codefy-surveyor');
            $surveyor.get(0).addEventListener('dragstart', function(event) {
                var width = $surveyor.width(); // width() returns the inner width
                var height = $surveyor.height();
                // child-elements of the surveyor can trigger the drag-event too. so event.srcElement has to be validated
                if (!(event.offsetX < 0 || event.offsetY < 0 || event.offsetX > width || event.offsetY > height) || event.srcElement !== $surveyor.get(0)) {
                    event.preventDefault();
                    event.stopPropagation();
                } else {
                    self.dragoffsetx = event.offsetX;
                    self.dragoffsety = event.offsetY;
                }
            });
            $surveyor.get(0).addEventListener('dragend', function(event) {
                $surveyor.css({
                    left: event.clientX - 10 - self.dragoffsetx,
                    top: event.clientY - 10 - self.dragoffsety
                })
            });
            $widgetui.append($surveyor);

            // ---------------------------------------------------------------------------------------------------------
            var console_origin = window.console.log.bind(console); // keep the original console
            console.log = function() {
                if (self.getpreference('showlog') == '1') {
                    $.each(arguments, function(i, item) {
                        $notifier.append(
                            $('<span />').addClass('codefy-console-log').text(item)
                        );
                    });
                    $notifier.fadeIn(0);
                }
                console_origin.apply(null, arguments); // pass arguments to original console
            }

            // ---------------------------------------------------------------------------------------------------------
            $(window).mousemove(function(event) {
                if (self.getpreference('showmpos') == '1') {
                    self.notifierclear();
                    self.notifierappend('codefy-coordinates', event.clientX + 'x / ' + event.clientY + 'y');
                }
            });
            var clickListener = function(event) {
                var element = event.target;
                if ($(element).is('#codefy, #codefy *') == true) return; // ignore codefy ui elements
                if (self.getpreference('inspectmode') == '1') {
                    $surveyor
                        .html('')
                        .append($('<div />').addClass('codefy-surveyor-title').text(element.tagName + ' element')) // toString()
                        .append($('<div />').addClass('codefy-surveyor-button').text('^').attr('title','Select parent element').click(function() {
                            event = jQuery.Event('click');
                            event.virtual = true;
                            event.target = $(element).parent().get(0);
                            if (event.target !== document) clickListener(event); // trigger the click listener manually if there exists a parental dom element
                        }))
                        .append($('<div />').addClass('codefy-surveyor-button').text('x').attr('title','Hide').click(function() {
                            $(element).fadeToggle('slow');
                        }))
                        .append($('<div />').addClass('codefy-surveyor-button').text('□').attr('title','Outline').click(function() { // _
                            $(element).toggleClass('codefy-show-struct');
                        }))
                        .append($('<div />').addClass('codefy-surveyor-button').text('..').attr('title','Make editable').click(function() {
                            if (typeof($(element).attr('contenteditable')) === 'undefined') {
                                $(element).attr('contenteditable', 'true');
                                element.focus();
                            } else {
                                $(element).removeAttr('contenteditable');
                            }
                        }))
                        .append($('<div />').addClass('codefy-surveyor-button').text('i').attr('title','Information').click(function() { // _
                            var $infoarea = $surveyor.find('.codefy-surveyor-info');
                            if ($infoarea.is(':visible') == false) {
                                var $infotext = $('<div />')
                                    .append($('<span />').text('size: ' + $(element).width() + 'x / ' + $(element).height() + 'y'))
                                    .append($('<span />').text('font: ' + $(element).css('font-family') + ' ' + $(element).css('font-weight') + ' ' + $(element).css('font-size')));
                                $infoarea.html('').append($infotext);
                                $infoarea.show(100, function() {
                                    $infoarea.get(0).focus();
                                });
                            } else {
                                $infoarea.hide(100);
                            }
                        }))
                        .append($('<div />').addClass('codefy-surveyor-button').text('s').attr('title','Classes and styles').click(function() { // _
                            var $stylearea = $surveyor.find('.codefy-surveyor-style');
                            if ($stylearea.is(':visible') == false) {
                                var regex = /\/\*.+?\*\//; // pattern /* .. */ (to replace comments)
                                var style = $.trim($(element).attr('style')).replace(regex, '');
                                var classes =  $.trim($(element).attr('class')).replace(regex, '');
                                var styletext = '';

                                classes = classes.split(' ');
                                for (var i = 0; i < classes.length; i++) {
                                    if (classes[i] != '') styletext += '.' + classes[i] + '; ';
                                }

                                if (typeof(style) !== 'undefined' && style !== '') styletext += style;
                                $stylearea.text(styletext);
                                $stylearea.show(100, function() {
                                    $stylearea.get(0).focus();
                                });
                            } else {
                                $stylearea.hide(100);
                            }
                        }));
                    var backgroundimg = $(element).css('background-image');
                    if (typeof(element.src) !== 'undefined' && backgroundimg !== 'none') {
                        $surveyor.append($('<div />').addClass('codefy-surveyor-button').text('p').attr('title','Show picture').click(function() {
                            if (typeof(element.src) !== 'undefined') window.open(element.src);
                            if (backgroundimg !== 'none') {
                                var parts = backgroundimg.split(';');
                                for (var i= 0; i < parts.length; i++) {
                                    try { // we can't expect well-formed css here, can we?
                                        var part = $.trim(parts[i]);
                                        var command = part.split('(', 1)[0];
                                        if (command == 'url') { // could be a gradient too
                                            if (part.indexOf('"') == -1 && part.indexOf("'") ==-1) { // url("..") / url(..)
                                                part = part.substr(4, part.length - 5);
                                            } else {
                                                if (part.indexOf('data:') == 5) { // base64. ';' is not available in a base64 encoded string
                                                    part = part.substr(5) + ';' + parts[i + 1];
                                                    parts[i + 1] = '';
                                                } else {
                                                    part = part.substr(5, part.length - 7);
                                                }
                                            }
                                            window.open(part);
                                        } else {
                                            if (part !== '') self.notifierappend('', part);
                                        }
                                    } catch (ex) {
                                        console.log('Codefy Exception: CSS broken.');
                                    }
                                }
                            }
                        }));
                    }
                    if (typeof(element.href) !== 'undefined') {
                        $surveyor.find('.surveyor-title').text(element.href);
                        $surveyor.append($('<div />').addClass('codefy-surveyor-button').text('>').attr('title','Follow URL').click(function() {
                            window.location.assign(element.href);
                        }));
                    }
                    $surveyor.append($('<div />').addClass('codefy-surveyor-info'));
                    $surveyor.append(
                        $('<div contenteditable="true" />').addClass('codefy-surveyor-style').keyup(function() {
                            var regex = /\/\*.+?\*\//;  // pattern /* .. */ (to replace comments)
                            var all = $(this).text().replace(regex, '');
                            var style = '';
                            var classes = '';

                            all = all.split(';');
                            for (var i = 0; i < all.length; i++) {
                                all[i] = $.trim(all[i]);
                                if (all[i] == '') continue;
                                if (all[i].indexOf('.') == 0) {
                                    classes += all[i].substr(1) + ' ';
                                } else {
                                    style += all[i] + '; ';
                                }
                            }

                            $(element).attr('style', $.trim(style)); // trim() to remove the appendend space
                            $(element).attr('class', $.trim(classes));
                        })
                    );

                    if (typeof(event.virtual) == 'undefined') { // if the click-event-listener is triggered manually clientX & Y will be 0
                        // use clientX instead of pageX so we dont have to care about the user scrolling h/v
                        // also add an offset to avoid clicking on the surveyor
                        var newleft = event.clientX + 10;
                        var newtop = event.clientY + 10;
                        if (newleft + $surveyor.width() + 20 > $(window).width()) newleft = $(window).width() - $surveyor.width() - 20;
                        if (newtop + $surveyor.height() + 20 > $(window).height()) newtop = $(window).height() - $surveyor.height() - 20;

                        $surveyor.css({
                            left: newleft,
                            top: newtop,
                            display: 'block'
                        });
                    }

                    event.preventDefault(); // cancel the event, so especially urls wont be followed
                    event.stopPropagation(); // stop propagation of the event, so other handlers wont be called
                }
            }
            window.addEventListener('click', clickListener, true); // usecapture = true, so this event will be dispatched before other events

            // ---------------------------------------------------------------------------------------------------------
            $('body').append($widgetui);
            this.addcss(css);
            $notifier.css('max-width', $nav.width() + 20);
        },
        stop: function() {
            $('#codefy').html('').append(
                $('<div />').addClass('codefy-msgbox').text('Ciao. To completly remove or reactivate Codefy please reload the page.')
            );
            var $msgbox = $('#codefy .codefy-msgbox');
            $msgbox.css('top', $(window).height() - $msgbox.height()).delay(5000).animate({ top: $(window).height() });
        },
        createmenubutton: function(title) { // create menu button for .codefy-nav
            return $('<div />').text(title).addClass('codefy-button').click(function() {
                $('#codefy .codefy-subnav:visible').fadeOut('fast');
                var $subnav = $(this).find('.codefy-subnav');
                if ($subnav.is(':visible')) {
                    $(this).find('.codefy-subnav').fadeOut('fast');
                } else {
                    $(this).find('.codefy-subnav').fadeIn('fast');
                }
            });
        },
        notifierappend: function(type, text) { // add item to the notifer
            $('#codefy .codefy-notifier').append($('<span />').addClass(type).text(text));
        },
        notifierclear: function() { // clear notifier
            $('#codefy .codefy-notifier').html('');
        },
        createuicheckbox: function(preference) {
            if (this.getpreference(preference) == '1') {
                $checkedclass = 'codefy-checkbox-checked';
            } else {
                $checkedclass = 'codefy-checkbox-unchecked';
            }
            return $('<span />').addClass('codefy-checkbox').addClass($checkedclass).text('x');
        },
        getpreference: function(preference) { // returns the value of a preference (as string or undefined if not defined)
            return localStorage['codefy.' + preference];
        },
        setpreference: function(preference, value) { // saves a preference (as string)
            localStorage['codefy.' + preference] = value.toString();
        },
        setpreferencemenu: function(menuitem, preference) { // sets & saves a preference from the $settings menu via an item. returns the new state
            var $checkbox = $(menuitem).find('.codefy-checkbox');
            var checked = $checkbox.hasClass('codefy-checkbox-checked');
            if (checked == true) {
                this.setpreference(preference, 0);
                $checkbox.removeClass('codefy-checkbox-checked'); // (using toogleClass() is possible too)
                $checkbox.addClass('codefy-checkbox-unchecked');
            } else {
                this.setpreference(preference, 1);
                $checkbox.addClass('codefy-checkbox-checked');
                $checkbox.removeClass('codefy-checkbox-unchecked');
            }
            return !checked;
        },
        csstojs: function(css) {
            var result = '';
            var lines = css.split('}');

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if ($.trim(line) == '') continue; // line might be empty
                var pos = line.indexOf('{');
                var selectorsstring = $.trim(line.substring(0, pos));
                var pairsstring = line.substring(pos + 1);

                var pairs = pairsstring.split(';');
                for (var j = 0; j < pairs.length; j++) {
                    var pair = pairs[j];
                    if ($.trim(pair) == '') continue; // line might be empty
                    pos = pair.indexOf(':');
                    var property = $.trim(pair.substring(0, pos));
                    var value =  $.trim(pair.substring(pos + 1));
                    result += '$("' + selectorsstring + '").css("' + property + '", "' + value + '");'; // $(selectorsstring).css(property, value);
                }
            }

            return result;
        },
        addcss: function(css) { // adds css to the document
            // ouch, this hurts! because opera can't use css files in extensions we have to inject css with this ugly trick
            $('head').append('<style type="text/css" data-codefy="main">' + css + '</style>');
        }
    }
}

window.addEventListener('DOMContentLoaded', function() {
    var running = -1;

    var blacklist = ';' + widget.preferences.getItem('blacklist') + ';';
    var hostname = window.location.hostname;
    if (hostname.indexOf('www.') === 0) hostname = hostname.substr(4);
    if (blacklist.indexOf(hostname) !== -1) return;

    function readFile(filename, callback) {
        var file = opera.extension.getFile(filename);
        var filereader = new FileReader();
        filereader.onload = function(event) {
            callback(filereader.result);
        };
        filereader.onerror = function(event) {
            alert('Codefy: Error when trying to read from file: ' + filename);
        }
        try {
            filereader.readAsText(file);
        } catch (ex) {
            alert('Codefy: Error when trying to open file: ' + filename);
        }
    }
    var css = '';
    readFile('/css/stylesheet.css', function(result) {
        css = result;
    })

    // onmessage: "invoked when a message is received from an injected script, popup or preferences page"
    opera.extension.onmessage = function (event) {
        switch (event.data) {
            case 'codefy.init': // start
                if (running == -1) {
                    running = 1;
                    codefy.init(css);
                }
                if (running == 0) {
                    opera.extension.postMessage('codefy.suspended');
                    codefy.stop();
                }
                break;
            case 'codefy.stop':
                running = 0;
                codefy.stop();
                break;
            case 'codefy.tabfocused':
                if (running == true) opera.extension.postMessage('codefy.running');
                break;
        }
    }
}, false);