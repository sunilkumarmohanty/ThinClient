app.directive('vncClient', ['$document', '$state', '$timeout', '$window', '$mdBottomSheet', '$mdDialog', 'AppService',
  function($document, $state, $timeout, $window, $mdBottomSheet, $mdDialog, AppService) {
    return {
      restrict: 'E',
      templateUrl: 'partials/vnc.html',
      scope: false,
      link: function(scope, element, attr) {
        var vm = scope.vm;

        vm.dragActive = false;
        vm.toggleDrag = function() {
          vm.dragActive = !vm.dragActive;
        };

        vm.keyboardActive = false;
        vm.toggleKeyboard = function() {
          vm.keyboardActive = !vm.keyboardActive;
        };

        // Will be defined below
        var UI;

        /*
         *
         * Adapted from the noVNC samples.
         * License as below, where applicable.
         *
         * Copyright (C) 2012 Joel Martin
         * Copyright (C) 2013 Samuel Mannehed for Cendio AB
         * The following is licensed under the 2-Clause BSD license.
         *
         */

        WebUtil.load_scripts({
          'core': ["base64.js", "websock.js", "des.js", "input/keysymdef.js",
            "input/xtscancodes.js", "input/util.js", "input/devices.js",
            "display.js", "inflator.js", "rfb.js", "input/keysym.js"
          ],
          'app': ["webutil.js"]
        });

        var rfb;
        var resizeTimeout;
        var desktopName;

        function UIresize() {
          if ($state.current.name === 'vnc') {
            var vncHolder = document.getElementById('vnc-holder');
            var innerW = vncHolder.clientWidth;
            var innerH = vncHolder.clientHeight;
            var controlbarH = document.getElementById('noVNC_status_bar').offsetHeight;
            if (innerW !== undefined && innerH !== undefined)
              rfb.requestDesktopSize(innerW, innerH - controlbarH);
          }
        }

        function FBUComplete(rfb, fbu) {
          UIresize();
          rfb.set_onFBUComplete(function() {});
        }

        function updateDesktopName(rfb, name) {
          desktopName = name;
        }

        function passwordRequired(rfb, msg) {
          setPassword();
        }

        function setPassword() {
          rfb.sendPassword(vm.connectionInfo.password);
          return false;
        }

        function status(text, level) {
          switch (level) {
            case 'normal':
            case 'warn':
            case 'error':
              break;
            default:
              level = "warn";
          }
          var novncStatusBar = document.getElementById('noVNC_status_bar');
          if (novncStatusBar) {
            novncStatusBar.setAttribute("class", "noVNC_status_" + level);
          }
          var novncStatus = document.getElementById('noVNC_status');
          if (novncStatus) {
            novncStatus.innerHTML = text;
          }
        }

        var updateState = function(rfb, state, oldstate) {
          // var cad = document.getElementById('sendCtrlAltDelButton');
          var encrypt = (rfb && rfb.get_encrypt()) ? 'encrypted' : 'unencrypted';
          switch (state) {
            case 'connecting':
              status("Connecting", "normal");
              $timeout(function() {
                vm.loading = true;
                vm.connected = false;
                vm.statusText = 'Connecting remote desktop';
              });
              break;
            case 'connected':
              status("Connected (" + encrypt + ") to: " + desktopName, "normal");
              $timeout(function() {
                vm.loading = false;
                vm.connected = true;
                vm.statusText = 'Remote desktop connected';
              });
              break;
            case 'disconnecting':
              status("Disconnecting", "normal");
              break;
            case 'disconnected':
              status("Disconnected", "normal");
              $timeout(function() {
                vm.loading = false;
                vm.connected = false;
                vm.statusText = 'Remote desktop disconnected';
              });
              break;
            default:
              status(state, "warn");
              break;
          }
        };

        vm.disconnectVnc = function() {
          rfb.disconnect();
        };

        function disconnected(rfb, reason) {
          if (typeof(reason) !== 'undefined') {
            status(reason, "error");

            var cancelCallback = function() {
              $state.go('apps');
              AppService.stopInstance(vm.connectionInfo.instance);
            };
            vm.confirmDialog(reason, 'Reconnect', vm.connectVnc, 'Go back', cancelCallback);
          }
        }

        function notification(rfb, msg, level, options) {
          status(msg, level);
          if (level === 'error') {
            var cancelCallback = function() {
              $state.go('apps')
            };
            vm.confirmDialog(msg, 'Try again', vm.connectVnc, 'Go back', cancelCallback);
          }
        }

        window.onresize = function() {
          // When the window has been resized, wait until the size remains
          // the same for 0.5 seconds before sending the request for changing
          // the resolution of the session
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(function() {
            UIresize();
          }, 500);
        };

        vm.connectVnc = function() {
          var host, port, password, path, token;

          WebUtil.init_logging(WebUtil.getConfigVar('logging', 'warn'));

          host = vm.connectionInfo.host;
          port = vm.connectionInfo.port;

          // if port == 80 (or 443) then it won't be present and should be
          // set manually
          if (!port) {
            if (window.location.protocol.substring(0, 5) == 'https') {
              port = 443;
            } else if (window.location.protocol.substring(0, 4) == 'http') {
              port = 80;
            }
          }

          password = WebUtil.getConfigVar('password', '');
          path = WebUtil.getConfigVar('path', 'websockify');

          // If a token variable is passed in, set the parameter in a cookie.
          // This is used by nova-novncproxy.
          token = WebUtil.getConfigVar('token', null);
          if (token) {
            // if token is already present in the path we should use it
            path = WebUtil.injectParamIfMissing(path, "token", token);
            WebUtil.createCookie('token', token, 1)
          }

          if ((!host) || (!port)) {
            status('Must specify host and port in URL', 'error');
            return;
          }

          try {
            rfb = new RFB({
              'target': document.getElementById('noVNC_canvas'),
              'encrypt': WebUtil.getConfigVar('encrypt',
                (window.location.protocol === "https:")),
              'repeaterID': WebUtil.getConfigVar('repeaterID', ''),
              'true_color': WebUtil.getConfigVar('true_color', true),
              'local_cursor': WebUtil.getConfigVar('cursor', true),
              'shared': WebUtil.getConfigVar('shared', true),
              'view_only': WebUtil.getConfigVar('view_only', false),
              'onNotification': notification,
              'onUpdateState': updateState,
              'onDisconnected': disconnected,
              'onXvpInit': null,
              'onPasswordRequired': passwordRequired,
              'onFBUComplete': FBUComplete,
              'onDesktopName': updateDesktopName
            });
          } catch (exc) {
            status('Unable to create RFB client -- ' + exc, 'error');
            return; // don't continue trying to connect
          }

          rfb.connect(host, port, password, path);
          UI.rfb = rfb;
        };

        /*
         *
         * The following is adapted from noVNC ui.js
         *
         */

        UI = {
          rgb: null,
          hideKeyboardTimeout: null,
          keyboardVisible: false,
          lastKeyboardinput: null,
          defaultKeyboardinputLen: 100,
          isTouchDevice: false,

          showVirtualKeyboard: function() {
            if (!UI.isTouchDevice) return;

            var input = document.getElementById('noVNC_keyboardinput');

            if (document.activeElement == input) return;

            UI.keyboardVisible = true;
            document.getElementById('noVNC_keyboard_button')
              .classList.add("noVNC_selected");
            input.focus();

            try {
              var l = input.value.length;
              // Move the caret to the end
              input.setSelectionRange(l, l);
            } catch (err) {} // setSelectionRange is undefined in Google Chrome
          },

          hideVirtualKeyboard: function() {
            if (!UI.isTouchDevice) return;

            var input = document.getElementById('noVNC_keyboardinput');

            if (document.activeElement != input) return;

            input.blur();
          },

          toggleVirtualKeyboard: function() {
            if (UI.keyboardVisible) {
              UI.hideVirtualKeyboard();
            } else {
              UI.showVirtualKeyboard();
            }
          },

          onblurVirtualKeyboard: function() {
            //Weird bug in iOS if you change keyboardVisible
            //here it does not actually occur so next time
            //you click keyboard icon it doesnt work.
            UI.hideKeyboardTimeout = setTimeout(function() {
              UI.keyboardVisible = false;
              document.getElementById('noVNC_keyboard_button')
                .classList.remove("noVNC_selected");
            }, 100);
          },

          keepKeyboard: function() {
            clearTimeout(UI.hideKeyboardTimeout);
            if (UI.keyboardVisible === true) {
              UI.showVirtualKeyboard();
            } else if (UI.keyboardVisible === false) {
              UI.hideVirtualKeyboard();
            }
          },

          keyboardinputReset: function() {
            var kbi = document.getElementById('noVNC_keyboardinput');
            kbi.value = new Array(UI.defaultKeyboardinputLen).join("_");
            UI.lastKeyboardinput = kbi.value;
          },

          // When normal keyboard events are left uncought, use the input events from
          // the keyboardinput element instead and generate the corresponding key events.
          // This code is required since some browsers on Android are inconsistent in
          // sending keyCodes in the normal keyboard events when using on screen keyboards.
          keyInput: function(event) {

            if (!UI.rfb) return;

            var newValue = event.target.value;

            if (!UI.lastKeyboardinput) {
              UI.keyboardinputReset();
            }
            var oldValue = UI.lastKeyboardinput;

            var newLen;
            try {
              // Try to check caret position since whitespace at the end
              // will not be considered by value.length in some browsers
              newLen = Math.max(event.target.selectionStart, newValue.length);
            } catch (err) {
              // selectionStart is undefined in Google Chrome
              newLen = newValue.length;
            }
            var oldLen = oldValue.length;

            var backspaces;
            var inputs = newLen - oldLen;
            if (inputs < 0) {
              backspaces = -inputs;
            } else {
              backspaces = 0;
            }

            // Compare the old string with the new to account for
            // text-corrections or other input that modify existing text
            var i;
            for (i = 0; i < Math.min(oldLen, newLen); i++) {
              if (newValue.charAt(i) != oldValue.charAt(i)) {
                inputs = newLen - i;
                backspaces = oldLen - i;
                break;
              }
            }

            // Send the key events
            for (i = 0; i < backspaces; i++) {
              UI.rfb.sendKey(KeyTable.XK_BackSpace);
            }
            for (i = newLen - inputs; i < newLen; i++) {
              UI.rfb.sendKey(newValue.charCodeAt(i));
            }

            // Control the text content length in the keyboardinput element
            if (newLen > 2 * UI.defaultKeyboardinputLen) {
              UI.keyboardinputReset();
            } else if (newLen < 1) {
              // There always have to be some text in the keyboardinput
              // element with which backspace can interact.
              UI.keyboardinputReset();
              // This sometimes causes the keyboard to disappear for a second
              // but it is required for the android keyboard to recognize that
              // text has been added to the field
              event.target.blur();
              // This has to be ran outside of the input handler in order to work
              setTimeout(UI.keepKeyboard, 0);
            } else {
              UI.lastKeyboardinput = newValue;
            }
          }
        };

        vm.setupKeyboard = function() {
          UI.isTouchDevice = 'ontouchstart' in document.documentElement;
          document.getElementById("noVNC_keyboard_button")
            .addEventListener('click', UI.toggleVirtualKeyboard);
          document.getElementById("noVNC_keyboardinput")
            .addEventListener('input', UI.keyInput);
          document.getElementById("noVNC_keyboardinput")
            .addEventListener('blur', UI.onblurVirtualKeyboard);
          document.getElementById("noVNC_keyboardinput")
            .addEventListener('submit', function() {
              return false;
            });
          UI.keyboardinputReset();
        };

        /*
         *
         * Start after loading scripts
         *
         */

        window.onscriptsload = function() {
          // only connect if connectionInfo exists
          if (vm.connectionInfo) {
            vm.connectVnc();
            vm.setupKeyboard();
          }
        };
      }
    };
  }
]);