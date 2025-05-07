/******/ (() => { // webpackBootstrap
/*!*************************!*\
  !*** ./src/renderer.js ***!
  \*************************/
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// Pet Fresh Label Printer - Main renderer
document.addEventListener('DOMContentLoaded', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
  var appDiv, appVersion, productData, isSettingsOpen, openSettingsWindow, response, selectedCategory, searchQuery, isSearchActive, currentLabelScale, currentLabelTranslateX, currentLabelTranslateY, baseScale, renderUI, generateLabelHtml, _generateLabelHtml, updateLabelPreview, _updateLabelPreview, generateBarcode, setupPreviewControls, getFilteredProducts, groupProductsByType, hasMultipleProductTypes, setupEventListeners;
  return _regeneratorRuntime().wrap(function _callee5$(_context5) {
    while (1) switch (_context5.prev = _context5.next) {
      case 0:
        setupEventListeners = function _setupEventListeners() {
          // Settings button click handler
          var settingsButton = document.getElementById('settingsButton');
          if (settingsButton) {
            settingsButton.addEventListener('click', function () {
              openSettingsWindow();
            });

            // Add hover effect
            settingsButton.addEventListener('mouseenter', function () {
              this.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            });
            settingsButton.addEventListener('mouseleave', function () {
              this.style.backgroundColor = 'transparent';
            });
          }

          // Close settings dialog
          var closeSettingsButton = document.getElementById('closeSettings');
          if (closeSettingsButton) {
            closeSettingsButton.addEventListener('click', function () {
              isSettingsOpen = false;
              renderUI();
            });
          }

          // Close settings on click outside
          var settingsDialog = document.getElementById('settingsDialog');
          if (settingsDialog) {
            settingsDialog.addEventListener('click', function (e) {
              // Close only if clicking the overlay (not the content)
              if (e.target === this) {
                isSettingsOpen = false;
                renderUI();
              }
            });
          }

          // Add hover effects to buttons
          var allButtons = document.querySelectorAll('button');
          allButtons.forEach(function (button) {
            // Skip buttons that might have custom hover states
            if (button.id === 'printButton') {
              // For the print button, use a darker green hover
              button.addEventListener('mouseenter', function () {
                this.style.backgroundColor = '#878c30';
                this.style.boxShadow = '0 3px 7px rgba(155, 160, 59, 0.4)';
              });
              button.addEventListener('mouseleave', function () {
                this.style.backgroundColor = '#9ba03b';
                this.style.boxShadow = '0 2px 5px rgba(155, 160, 59, 0.3)';
              });
            } else {
              // For all other buttons, lighten the background
              button.addEventListener('mouseenter', function () {
                this.style.backgroundColor = '#e5e5e5';
                this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
              });
              button.addEventListener('mouseleave', function () {
                this.style.backgroundColor = '#ddd';
                this.style.boxShadow = button.id.includes('Quantity') ? '0 2px 4px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.1)';
              });
            }

            // Add active state
            button.addEventListener('mousedown', function () {
              this.style.transform = 'translateY(1px)';
            });
            button.addEventListener('mouseup', function () {
              this.style.transform = 'translateY(0)';
            });
            button.addEventListener('mouseleave', function () {
              this.style.transform = 'translateY(0)';
            });
          });

          // Search functionality
          var searchInput = document.getElementById('searchInput');
          if (searchInput) {
            searchInput.addEventListener('keyup', function (e) {
              if (e.key === 'Enter' || e.keyCode === 13) {
                searchQuery = this.value.trim();
                isSearchActive = searchQuery !== '';
                renderUI();
              }
            });

            // Give the input focus when clicking on its container
            var searchContainer = searchInput.parentElement;
            searchContainer.addEventListener('click', function (e) {
              if (e.target === this) {
                searchInput.focus();
              }
            });
          }

          // Clear search button
          var clearSearchBtn = document.getElementById('clearSearch');
          if (clearSearchBtn) {
            // Add hover effect
            clearSearchBtn.addEventListener('mouseenter', function () {
              this.style.backgroundColor = '#757575';
            });
            clearSearchBtn.addEventListener('mouseleave', function () {
              this.style.backgroundColor = '#9e9e9e';
            });
            clearSearchBtn.addEventListener('click', function () {
              searchQuery = '';
              searchInput.value = '';
              isSearchActive = false;
              renderUI();
            });
          }

          // Clear search results button
          var clearSearchResultsBtn = document.getElementById('clearSearchResults');
          if (clearSearchResultsBtn) {
            // Add hover effect
            clearSearchResultsBtn.addEventListener('mouseenter', function () {
              this.style.backgroundColor = '#757575';
            });
            clearSearchResultsBtn.addEventListener('mouseleave', function () {
              this.style.backgroundColor = '#9e9e9e';
            });
            clearSearchResultsBtn.addEventListener('click', function () {
              searchQuery = '';
              isSearchActive = false;
              renderUI();
            });
          }

          // Category selection
          var categoryElements = document.querySelectorAll('.category-item');
          categoryElements.forEach(function (item) {
            item.addEventListener('click', function () {
              var category = this.getAttribute('data-category');
              selectedCategory = category;

              // Re-render UI with new selected category
              renderUI();
            });
          });

          // Product selection
          var productItems = document.querySelectorAll('.product-item');
          productItems.forEach(function (item) {
            item.addEventListener('click', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
              var productId, product;
              return _regeneratorRuntime().wrap(function _callee$(_context) {
                while (1) switch (_context.prev = _context.next) {
                  case 0:
                    productId = this.getAttribute('data-product-id'); // Clear all selections across all categories
                    Object.entries(productData).forEach(function (_ref7) {
                      var _ref8 = _slicedToArray(_ref7, 2),
                        category = _ref8[0],
                        data = _ref8[1];
                      if (data.products) {
                        data.products.forEach(function (p) {
                          p.selected = false;
                        });
                      }
                    });

                    // Select the clicked product
                    product = productData[selectedCategory].products.find(function (p) {
                      return p.id.toString() === productId;
                    });
                    if (product) {
                      product.selected = true;
                    }

                    // Re-render UI
                    renderUI();

                    // Update label preview
                    _context.next = 7;
                    return updateLabelPreview();
                  case 7:
                  case "end":
                    return _context.stop();
                }
              }, _callee, this);
            })));
          });

          // Quantity controls with accelerating increment
          var quantity = 1;
          var quantityDisplay = document.getElementById('quantityDisplay');
          var decreaseButton = document.getElementById('decreaseQuantity');
          var increaseButton = document.getElementById('increaseQuantity');

          // Variables for acceleration
          var incrementInterval = null;
          var decrementInterval = null;
          var accelerationStage = 0;
          var accelerationTimes = [0, 500, 1500, 3000]; // Time thresholds in ms for acceleration stages
          var accelerationValues = [1, 2, 4, 8]; // Increment values for each stage
          var holdStartTime = 0;

          // Function to update quantity value and display
          function updateQuantity(newValue) {
            quantity = Math.max(1, newValue); // Ensure quantity doesn't go below 1
            quantityDisplay.textContent = quantity;
          }

          // Function to increment with acceleration based on hold time
          function incrementWithAcceleration() {
            var currentHoldTime = Date.now() - holdStartTime;
            var incrementValue = 1;

            // Determine which acceleration stage we're in
            for (var i = accelerationTimes.length - 1; i >= 0; i--) {
              if (currentHoldTime >= accelerationTimes[i]) {
                incrementValue = accelerationValues[i];
                accelerationStage = i;
                break;
              }
            }
            updateQuantity(quantity + incrementValue);

            // Adjust interval timing based on acceleration stage
            if (accelerationStage !== accelerationTimes.length - 1 && currentHoldTime >= accelerationTimes[accelerationStage + 1]) {
              // Move to next acceleration stage
              accelerationStage++;

              // Clear existing interval and start a new one with faster timing
              clearInterval(incrementInterval);
              var intervalTime = Math.max(50, 200 - accelerationStage * 50);
              incrementInterval = setInterval(incrementWithAcceleration, intervalTime);
            }
          }

          // Function to decrement with acceleration based on hold time
          function decrementWithAcceleration() {
            var currentHoldTime = Date.now() - holdStartTime;
            var decrementValue = 1;

            // Determine which acceleration stage we're in
            for (var i = accelerationTimes.length - 1; i >= 0; i--) {
              if (currentHoldTime >= accelerationTimes[i]) {
                decrementValue = accelerationValues[i];
                accelerationStage = i;
                break;
              }
            }
            updateQuantity(quantity - decrementValue);

            // Adjust interval timing based on acceleration stage
            if (accelerationStage !== accelerationTimes.length - 1 && currentHoldTime >= accelerationTimes[accelerationStage + 1]) {
              // Move to next acceleration stage
              accelerationStage++;

              // Clear existing interval and start a new one with faster timing
              clearInterval(decrementInterval);
              var intervalTime = Math.max(50, 200 - accelerationStage * 50);
              decrementInterval = setInterval(decrementWithAcceleration, intervalTime);
            }
          }

          // Increase button - click and hold
          increaseButton.addEventListener('mousedown', function (e) {
            // Immediate increment by 1
            updateQuantity(quantity + 1);

            // Setup acceleration for held button
            holdStartTime = Date.now();
            accelerationStage = 0;

            // Start interval for continuous increment
            incrementInterval = setInterval(incrementWithAcceleration, 200);
            e.preventDefault(); // Prevent text selection
          });
          increaseButton.addEventListener('mouseup', function () {
            clearInterval(incrementInterval);
          });
          increaseButton.addEventListener('mouseleave', function () {
            clearInterval(incrementInterval);
          });

          // Decrease button - click and hold
          decreaseButton.addEventListener('mousedown', function (e) {
            // Immediate decrement by 1 if possible
            if (quantity > 1) {
              updateQuantity(quantity - 1);
            }

            // Setup acceleration for held button
            holdStartTime = Date.now();
            accelerationStage = 0;

            // Start interval for continuous decrement
            decrementInterval = setInterval(decrementWithAcceleration, 200);
            e.preventDefault(); // Prevent text selection
          });
          decreaseButton.addEventListener('mouseup', function () {
            clearInterval(decrementInterval);
          });
          decreaseButton.addEventListener('mouseleave', function () {
            clearInterval(decrementInterval);
          });

          // Touch support for mobile
          increaseButton.addEventListener('touchstart', function (e) {
            // Immediate increment by 1
            updateQuantity(quantity + 1);

            // Setup acceleration for held button
            holdStartTime = Date.now();
            accelerationStage = 0;

            // Start interval for continuous increment
            incrementInterval = setInterval(incrementWithAcceleration, 200);
            e.preventDefault(); // Prevent scrolling
          });
          increaseButton.addEventListener('touchend', function () {
            clearInterval(incrementInterval);
          });
          decreaseButton.addEventListener('touchstart', function (e) {
            // Immediate decrement by 1 if possible
            if (quantity > 1) {
              updateQuantity(quantity - 1);
            }

            // Setup acceleration for held button
            holdStartTime = Date.now();
            accelerationStage = 0;

            // Start interval for continuous decrement
            decrementInterval = setInterval(decrementWithAcceleration, 200);
            e.preventDefault(); // Prevent scrolling
          });
          decreaseButton.addEventListener('touchend', function () {
            clearInterval(decrementInterval);
          });

          // Print button
          var printButton = document.getElementById('printButton');
          printButton.addEventListener('click', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
            var selectedProduct, selectedCat, _i, _Object$entries, _Object$entries$_i, category, data, product, quantity, confirm;
            return _regeneratorRuntime().wrap(function _callee2$(_context2) {
              while (1) switch (_context2.prev = _context2.next) {
                case 0:
                  // Find selected product
                  selectedProduct = null;
                  selectedCat = null; // Check all categories for a selected product
                  _i = 0, _Object$entries = Object.entries(productData);
                case 3:
                  if (!(_i < _Object$entries.length)) {
                    _context2.next = 14;
                    break;
                  }
                  _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2), category = _Object$entries$_i[0], data = _Object$entries$_i[1];
                  if (!data.products) {
                    _context2.next = 11;
                    break;
                  }
                  product = data.products.find(function (p) {
                    return p.selected;
                  });
                  if (!product) {
                    _context2.next = 11;
                    break;
                  }
                  selectedProduct = product;
                  selectedCat = category;
                  return _context2.abrupt("break", 14);
                case 11:
                  _i++;
                  _context2.next = 3;
                  break;
                case 14:
                  if (selectedProduct) {
                    _context2.next = 17;
                    break;
                  }
                  alert('Please select a product first');
                  return _context2.abrupt("return");
                case 17:
                  quantity = parseInt(document.getElementById('quantityDisplay').textContent, 10); // Show confirmation
                  confirm = window.confirm("Print ".concat(quantity, " labels for ").concat(selectedProduct.productname, "?"));
                  if (confirm) {
                    // In a real app, we would call the API to print the label
                    alert("Printing ".concat(quantity, " labels for ").concat(selectedProduct.productname));
                  }
                case 20:
                case "end":
                  return _context2.stop();
              }
            }, _callee2);
          })));
        };
        hasMultipleProductTypes = function _hasMultipleProductTy(products) {
          var types = new Set();
          products.forEach(function (product) {
            types.add(product.type || 'Other');
          });
          return types.size > 1;
        };
        groupProductsByType = function _groupProductsByType(products) {
          var groups = {};
          products.forEach(function (product) {
            var type = product.type || 'Other';
            if (!groups[type]) {
              groups[type] = [];
            }
            groups[type].push(product);
          });
          return groups;
        };
        getFilteredProducts = function _getFilteredProducts() {
          if (isSearchActive && searchQuery) {
            // Search across all categories
            var results = [];
            var lowerCaseQuery = searchQuery.toLowerCase();
            Object.values(productData).forEach(function (categoryData) {
              if (categoryData.products) {
                categoryData.products.forEach(function (product) {
                  // Search in product name
                  if (product.productname.toLowerCase().includes(lowerCaseQuery)) {
                    results.push(product);
                  }
                });
              }
            });
            return results;
          } else {
            var _productData$selected;
            // Return products from the selected category
            return ((_productData$selected = productData[selectedCategory]) === null || _productData$selected === void 0 ? void 0 : _productData$selected.products) || [];
          }
        };
        setupPreviewControls = function _setupPreviewControls(initialScale, baseFitScale) {
          var labelElement = document.getElementById('labelElement');
          var previewArea = document.getElementById('labelPreviewArea');
          var zoomInButton = document.getElementById('zoomIn');
          var zoomOutButton = document.getElementById('zoomOut');
          var zoomResetButton = document.getElementById('zoomReset');
          if (!labelElement || !previewArea) return;
          var scale = initialScale || 1; // Use the provided initial scale or default to 1
          var isDragging = false;
          var startX,
            startY,
            translateX = currentLabelTranslateX,
            translateY = currentLabelTranslateY;
          var lastDistance = 0; // For pinch zoom

          // Store the base fit scale for reset
          var originalScale = baseFitScale || scale;

          // Update transform and save current position
          function updateTransform() {
            var withTransition = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
            if (withTransition) {
              labelElement.style.transition = 'transform 0.3s ease-out';
              setTimeout(function () {
                labelElement.style.transition = 'opacity 0.3s ease-in-out';
              }, 300);
            } else {
              labelElement.style.transition = 'opacity 0.3s ease-in-out';
            }
            labelElement.style.transform = "scale(".concat(scale, ") translate(").concat(translateX, "px, ").concat(translateY, "px)");

            // Save current values to global variables
            currentLabelScale = scale;
            currentLabelTranslateX = translateX;
            currentLabelTranslateY = translateY;
          }

          // Zoom in button
          zoomInButton.addEventListener('click', function () {
            scale += scale * 0.2; // 20% increase
            updateTransform(true);
          });

          // Zoom out button
          zoomOutButton.addEventListener('click', function () {
            scale = Math.max(scale * 0.8, originalScale * 0.5); // 20% decrease with min limit
            updateTransform(true);
          });

          // Reset zoom
          zoomResetButton.addEventListener('click', function () {
            scale = originalScale;
            translateX = 0;
            translateY = 0;
            updateTransform(true);
          });

          // Drag functionality
          labelElement.addEventListener('mousedown', function (e) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            labelElement.style.cursor = 'grabbing';
            labelElement.style.transition = 'none'; // Disable transitions during drag
            e.preventDefault();
          });
          document.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            var dx = (e.clientX - startX) / scale;
            var dy = (e.clientY - startY) / scale;
            translateX += dx;
            translateY += dy;
            startX = e.clientX;
            startY = e.clientY;
            updateTransform(false);
          });
          document.addEventListener('mouseup', function () {
            if (isDragging) {
              isDragging = false;
              labelElement.style.cursor = 'move';
              // Don't re-enable transitions immediately to avoid jumpy behavior
              setTimeout(function () {
                labelElement.style.transition = 'opacity 0.3s ease-in-out';
              }, 50);
            }
          });

          // Mouse wheel zoom
          previewArea.addEventListener('wheel', function (e) {
            e.preventDefault();
            var delta = -Math.sign(e.deltaY);
            var scaleFactor = delta > 0 ? 1.1 : 0.9;
            labelElement.style.transition = 'none'; // Disable transitions during wheel zoom

            // Calculate new scale with bounds
            var newScale = Math.max(originalScale * 0.5, Math.min(scale * scaleFactor, originalScale * 5));

            // Get mouse position relative to the label
            var rect = labelElement.getBoundingClientRect();
            var mouseX = (e.clientX - rect.left) / scale;
            var mouseY = (e.clientY - rect.top) / scale;

            // Calculate how much the mouse point will move at the new scale
            var scaleDiff = newScale - scale;

            // Adjust translation to keep the point under the mouse 
            translateX -= mouseX * scaleDiff / newScale;
            translateY -= mouseY * scaleDiff / newScale;

            // Apply new scale
            scale = newScale;
            updateTransform(false);

            // Re-enable transitions after a brief delay
            setTimeout(function () {
              labelElement.style.transition = 'opacity 0.3s ease-in-out';
            }, 50);
          });

          // Touch support for mobile - enhanced with pinch zoom
          previewArea.addEventListener('touchstart', function (e) {
            if (e.touches.length === 1) {
              isDragging = true;
              startX = e.touches[0].clientX;
              startY = e.touches[0].clientY;
              labelElement.style.transition = 'none'; // Disable transitions during touch
            } else if (e.touches.length === 2) {
              // Pinch-to-zoom - calculate initial distance between touch points
              isDragging = false;
              var dx = e.touches[0].clientX - e.touches[1].clientX;
              var dy = e.touches[0].clientY - e.touches[1].clientY;
              lastDistance = Math.sqrt(dx * dx + dy * dy);
              labelElement.style.transition = 'none'; // Disable transitions during pinch
            }
            e.preventDefault();
          });
          previewArea.addEventListener('touchmove', function (e) {
            e.preventDefault();
            if (e.touches.length === 1 && isDragging) {
              // Single touch = drag
              var dx = (e.touches[0].clientX - startX) / scale;
              var dy = (e.touches[0].clientY - startY) / scale;
              translateX += dx;
              translateY += dy;
              startX = e.touches[0].clientX;
              startY = e.touches[0].clientY;
              updateTransform(false);
            } else if (e.touches.length === 2) {
              // Pinch zoom
              var _dx = e.touches[0].clientX - e.touches[1].clientX;
              var _dy = e.touches[0].clientY - e.touches[1].clientY;
              var distance = Math.sqrt(_dx * _dx + _dy * _dy);

              // Calculate the center point between the two fingers
              var centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
              var centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

              // Get the element position
              var rect = labelElement.getBoundingClientRect();

              // Convert center to element coordinates
              var elementCenterX = (centerX - rect.left) / scale;
              var elementCenterY = (centerY - rect.top) / scale;

              // Calculate zoom ratio
              var ratio = distance / lastDistance;

              // Update scale with bounds
              var newScale = Math.max(originalScale * 0.5, Math.min(scale * ratio, originalScale * 5));

              // Calculate how much the center point will move at the new scale
              var scaleDiff = newScale - scale;

              // Adjust translation to keep the center point stable
              translateX -= elementCenterX * scaleDiff / newScale;
              translateY -= elementCenterY * scaleDiff / newScale;

              // Apply new scale
              scale = newScale;
              lastDistance = distance;
              updateTransform(false);
            }
          });
          previewArea.addEventListener('touchend', function (e) {
            if (e.touches.length === 0) {
              isDragging = false;
              // Re-enable transitions after a brief delay
              setTimeout(function () {
                labelElement.style.transition = 'opacity 0.3s ease-in-out';
              }, 50);
            } else if (e.touches.length === 1) {
              // If one finger is lifted but another remains, setup for dragging
              isDragging = true;
              startX = e.touches[0].clientX;
              startY = e.touches[0].clientY;
            }
          });
        };
        generateBarcode = function _generateBarcode(element, value) {
          if (!element) return;
          var barcode = value || '0000000000000';

          // Clear any existing content
          element.innerHTML = '';

          // Generate simple CODE128 barcode
          // This is a simplified version - in production you'd use a more robust implementation
          // Format: each character in the barcode is represented by 11 modules (thin/thick bars)
          var barcodeWidth = 100; // percentage width
          var height = 30;
          var moduleCount = barcode.length * 11;
          var moduleWidth = barcodeWidth / moduleCount;

          // Generate pseudo-random bars based on the barcode value
          // Not a real CODE128 implementation, just for visual representation
          var svg = '';
          var currentX = 0;
          for (var i = 0; i < barcode.length; i++) {
            var charCode = barcode.charCodeAt(i);

            // Generate 5 bars for each character (3 black, 2 white)
            for (var j = 0; j < 5; j++) {
              var isBlack = j % 2 === 0;
              var width = (charCode % 3 + 1) * moduleWidth; // Vary width based on char code

              if (isBlack) {
                svg += "<rect x=\"".concat(currentX, "%\" y=\"0\" width=\"").concat(width, "%\" height=\"").concat(height, "\" fill=\"black\" />");
              }
              currentX += width;
            }
          }
          element.innerHTML = svg;
          element.setAttribute('viewBox', "0 0 100 ".concat(height));
          element.setAttribute('preserveAspectRatio', 'none');
        };
        _updateLabelPreview = function _updateLabelPreview3() {
          _updateLabelPreview = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
            var selectedProduct, productCategory, _i2, _Object$entries2, _Object$entries2$_i, category, data, product, labelPreviewContainer, labelHtml, previewHtml, previewAreaElement, barcodeElement, barcode, toggleDesignButton, designOverlay, designVisible, labelElement;
            return _regeneratorRuntime().wrap(function _callee4$(_context4) {
              while (1) switch (_context4.prev = _context4.next) {
                case 0:
                  // Find selected product
                  selectedProduct = null;
                  productCategory = ''; // Check all categories for a selected product
                  _i2 = 0, _Object$entries2 = Object.entries(productData);
                case 3:
                  if (!(_i2 < _Object$entries2.length)) {
                    _context4.next = 15;
                    break;
                  }
                  _Object$entries2$_i = _slicedToArray(_Object$entries2[_i2], 2), category = _Object$entries2$_i[0], data = _Object$entries2$_i[1];
                  if (data.products) {
                    _context4.next = 7;
                    break;
                  }
                  return _context4.abrupt("continue", 12);
                case 7:
                  product = data.products.find(function (p) {
                    return p.selected;
                  });
                  if (!product) {
                    _context4.next = 12;
                    break;
                  }
                  selectedProduct = product;
                  productCategory = category;
                  return _context4.abrupt("break", 15);
                case 12:
                  _i2++;
                  _context4.next = 3;
                  break;
                case 15:
                  labelPreviewContainer = document.getElementById('labelPreviewContainer');
                  if (selectedProduct) {
                    _context4.next = 23;
                    break;
                  }
                  // No product selected, show empty preview
                  labelPreviewContainer.innerHTML = "\n        <div style=\"text-align: center; width: 100%; height: 100%; border: 1px dashed #ccc; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 10px;\">\n          <div style=\"font-size: 16px; color: #888;\">Select a product to preview label</div>\n        </div>\n      ";
                  // Reset position and scale when nothing is selected
                  currentLabelScale = null;
                  currentLabelTranslateX = 0;
                  currentLabelTranslateY = 0;
                  baseScale = null;
                  return _context4.abrupt("return");
                case 23:
                  _context4.prev = 23;
                  _context4.next = 26;
                  return generateLabelHtml(selectedProduct, productCategory);
                case 26:
                  labelHtml = _context4.sent;
                  // Create a container with zoom controls and preview
                  previewHtml = "\n        <div style=\"position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; background: #f5f5f5; overflow: hidden; border-radius: 4px;\">\n          <!-- Zoom controls -->\n          <div style=\"padding: 8px; display: flex; justify-content: flex-end; gap: 5px; background: #e8e8e8; border-top-left-radius: 4px; border-top-right-radius: 4px; border-bottom: 1px solid #ddd;\">\n            <button id=\"zoomOut\" style=\"width: 30px; height: 30px; font-size: 16px; border: none; background-color: #ddd; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.1);\">-</button>\n            <button id=\"zoomReset\" style=\"padding: 0 8px; height: 30px; font-size: 12px; border: none; background-color: #ddd; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.1);\">Reset</button>\n            <button id=\"zoomIn\" style=\"width: 30px; height: 30px; font-size: 16px; border: none; background-color: #ddd; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.1);\">+</button>\n            <button id=\"toggleDesign\" style=\"padding: 0 8px; height: 30px; font-size: 12px; border: none; background-color: #ddd; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.1);\">Show Design</button>\n          </div>\n          \n          <!-- Preview area with drag capability -->\n          <div id=\"labelPreviewArea\" style=\"flex: 1; position: relative; overflow: hidden; display: flex; justify-content: center; align-items: center; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px;\">\n            <div id=\"labelElement\" style=\"transform-origin: center; cursor: move; opacity: 0; transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);\">\n              ".concat(labelHtml, "\n            </div>\n          </div>\n        </div>\n      "); // Update the preview container
                  labelPreviewContainer.innerHTML = previewHtml;

                  // Add container transitions
                  previewAreaElement = document.getElementById('labelPreviewArea');
                  if (previewAreaElement) {
                    previewAreaElement.style.transition = 'background-color 0.3s ease-in-out';
                  }

                  // Generate barcode locally
                  barcodeElement = document.getElementById('barcode');
                  if (barcodeElement) {
                    barcode = selectedProduct.barcodes && selectedProduct.barcodes.length > 0 ? selectedProduct.barcodes[0] : '0000000000000'; // Create barcode SVG
                    generateBarcode(barcodeElement, barcode);
                  }

                  // Add toggle design functionality
                  toggleDesignButton = document.getElementById('toggleDesign');
                  designOverlay = document.querySelector('.design-overlay');
                  if (toggleDesignButton && designOverlay) {
                    designVisible = true;
                    toggleDesignButton.textContent = 'Hide Design';
                    toggleDesignButton.addEventListener('click', function () {
                      designVisible = !designVisible;
                      designOverlay.style.display = designVisible ? 'block' : 'none';
                      toggleDesignButton.textContent = designVisible ? 'Hide Design' : 'Show Design';
                    });
                  }

                  // Auto-scale to fit the preview area
                  labelElement = document.getElementById('labelElement');
                  if (labelElement && previewAreaElement) {
                    // Let the DOM update before measuring
                    setTimeout(function () {
                      // Get dimensions of preview area and label
                      var previewRect = previewAreaElement.getBoundingClientRect();
                      var labelRect = labelElement.getBoundingClientRect();

                      // Calculate the scale needed to fit the longest side
                      var scaleWidth = (previewRect.width - 40) / labelRect.width; // -40 for padding
                      var scaleHeight = (previewRect.height - 40) / labelRect.height;

                      // Use the smaller scale to ensure the entire label fits
                      var fitScale = Math.min(scaleWidth, scaleHeight);

                      // Store the base scale if not already set
                      if (baseScale === null) {
                        baseScale = fitScale;
                      }

                      // Use saved scale and position if available, otherwise use the calculated fit scale
                      var scale = currentLabelScale || fitScale;
                      var translateX = currentLabelTranslateX;
                      var translateY = currentLabelTranslateY;

                      // Apply the transform
                      labelElement.style.transform = "scale(".concat(scale, ") translate(").concat(translateX, "px, ").concat(translateY, "px)");

                      // Fade in the label with a slight delay
                      setTimeout(function () {
                        labelElement.style.opacity = '1';
                      }, 50);

                      // Setup zoom and drag with current scale
                      setupPreviewControls(scale, fitScale);
                    }, 50);
                  }
                  _context4.next = 48;
                  break;
                case 40:
                  _context4.prev = 40;
                  _context4.t0 = _context4["catch"](23);
                  console.error('Error updating label preview:', _context4.t0);
                  // Show fallback preview with error message
                  labelPreviewContainer.innerHTML = "\n        <div style=\"text-align: center; width: 100%; height: 100%; border: 1px dashed #ccc; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 10px;\">\n          <div style=\"color: red; margin-bottom: 10px;\">Error generating preview</div>\n          <div style=\"font-size: 12px;\">".concat(_context4.t0.message, "</div>\n        </div>\n      ");

                  // Reset position and scale on error
                  currentLabelScale = null;
                  currentLabelTranslateX = 0;
                  currentLabelTranslateY = 0;
                  baseScale = null;
                case 48:
                case "end":
                  return _context4.stop();
              }
            }, _callee4, null, [[23, 40]]);
          }));
          return _updateLabelPreview.apply(this, arguments);
        };
        updateLabelPreview = function _updateLabelPreview2() {
          return _updateLabelPreview.apply(this, arguments);
        };
        _generateLabelHtml = function _generateLabelHtml3() {
          _generateLabelHtml = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(product, category) {
            var formattedPrice, barcode, labelWidth, labelHeight, gutterHeight, contentHeight, horizontalMargin, contentWidth, productTitleHeight, ingredientsHeight, petFoodOnlyHeight, storageInstructionsHeight, dataHeight, priceHeight, contentStartY, titleY, ingredientsY, petFoodOnlyY, storageInstructionsY, dataY, priceY, productName, nameLength, words, calculatedFontSize, forceSingleLine, productTitleHTML, bestBeforeDate, today, expirationDate, defaultExpirationDate, ingredientsLine1, ingredientsLine2, ingredientsLine3, weightQuantityHTML, templateVars, templatePath, templateResponse, templateContent;
            return _regeneratorRuntime().wrap(function _callee3$(_context3) {
              while (1) switch (_context3.prev = _context3.next) {
                case 0:
                  if (product) {
                    _context3.next = 2;
                    break;
                  }
                  return _context3.abrupt("return", null);
                case 2:
                  _context3.prev = 2;
                  // Format the price (convert from cents to dollars)
                  formattedPrice = (product.productprice / 100).toFixed(2); // Get the first barcode if available
                  barcode = product.barcodes && product.barcodes.length > 0 ? product.barcodes[0] : '0000000000000'; // Label dimensions (in mm)
                  labelWidth = 60; // Width of the label in mm
                  labelHeight = 162; // Height of the label in mm (including the bottom area)
                  gutterHeight = 34.5; // Height of the bottom gutter area
                  contentHeight = labelHeight - gutterHeight; // Height of the content area
                  // Margins (in mm)
                  horizontalMargin = 5; // Left and right margins
                  contentWidth = labelWidth - horizontalMargin * 2; // Width of content area with margins
                  // Section heights (in mm)
                  productTitleHeight = 20.5; // Product title section height
                  ingredientsHeight = 15.5; // Ingredients section height
                  petFoodOnlyHeight = 6.5; // "Pet Food Only" section height
                  storageInstructionsHeight = 12.5; // Storage instructions section height
                  dataHeight = 19.5; // Date and weight section height
                  priceHeight = 3; // Price section height
                  // Calculate section positions
                  contentStartY = 50; // Content starts at 50mm from top
                  titleY = contentStartY;
                  ingredientsY = titleY + productTitleHeight;
                  petFoodOnlyY = ingredientsY + ingredientsHeight;
                  storageInstructionsY = petFoodOnlyY + petFoodOnlyHeight;
                  dataY = storageInstructionsY + storageInstructionsHeight;
                  priceY = dataY + dataHeight; // Prepare product name for auto-sizing
                  productName = product.productname;
                  nameLength = productName.length;
                  words = productName.split(' '); // Calculate ideal font size
                  // Approach: Use larger fonts for shorter texts, especially important words
                  if (words.length === 1 && nameLength <= 8) {
                    // Single short word - very large font
                    calculatedFontSize = 8;
                  } else if (nameLength <= 12) {
                    // Short text - large font
                    calculatedFontSize = 7;
                  } else if (nameLength <= 16) {
                    // Medium length - medium font
                    calculatedFontSize = 6;
                  } else if (nameLength <= 25) {
                    // Longer text - medium-small font
                    calculatedFontSize = 5;
                  } else {
                    // Very long text - small font
                    calculatedFontSize = 4;
                  }

                  // For 2-word product names that are important (like "CHICKEN NECKS"),
                  // try to keep them on one line unless they're too long
                  forceSingleLine = words.length === 2 && nameLength <= 14; // Generate product title HTML
                  productTitleHTML = "\n        <div style=\"\n          width: 100%; \n          height: 100%; \n          display: flex; \n          flex-direction: column;\n          justify-content: center;\n          align-items: center;\n          padding: 0.5mm;\n        \">\n          <div style=\"\n            font-size: ".concat(calculatedFontSize, "mm; \n            line-height: 1.15; \n            font-weight: bold; \n            text-align: center; \n            width: 100%; \n            overflow: hidden;\n            ").concat(forceSingleLine ? 'white-space: nowrap; text-overflow: ellipsis;' : 'display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word;', "\n          \">").concat(productName, "</div>\n        </div>\n      "); // Calculate best before date based on product expiration settings
                  today = new Date();
                  if (!(product.expirationDuration && product.expirationType)) {
                    _context3.next = 48;
                    break;
                  }
                  expirationDate = new Date(today);
                  _context3.t0 = product.expirationType;
                  _context3.next = _context3.t0 === 'days' ? 36 : _context3.t0 === 'weeks' ? 38 : _context3.t0 === 'months' ? 40 : _context3.t0 === 'years' ? 42 : 44;
                  break;
                case 36:
                  expirationDate.setDate(expirationDate.getDate() + product.expirationDuration);
                  return _context3.abrupt("break", 45);
                case 38:
                  expirationDate.setDate(expirationDate.getDate() + product.expirationDuration * 7);
                  return _context3.abrupt("break", 45);
                case 40:
                  expirationDate.setMonth(expirationDate.getMonth() + product.expirationDuration);
                  return _context3.abrupt("break", 45);
                case 42:
                  expirationDate.setFullYear(expirationDate.getFullYear() + product.expirationDuration);
                  return _context3.abrupt("break", 45);
                case 44:
                  // Default to 30 days if type is not recognized
                  expirationDate.setDate(expirationDate.getDate() + 30);
                case 45:
                  bestBeforeDate = expirationDate.toLocaleDateString('en-AU', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit'
                  });
                  _context3.next = 51;
                  break;
                case 48:
                  // Fallback to 30 days if expiration settings are not provided
                  defaultExpirationDate = new Date(today);
                  defaultExpirationDate.setDate(defaultExpirationDate.getDate() + 30);
                  bestBeforeDate = defaultExpirationDate.toLocaleDateString('en-AU', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit'
                  });
                case 51:
                  // Ingredient lines (empty if not provided)
                  ingredientsLine1 = product.ingredientsLine1 || '';
                  ingredientsLine2 = product.ingredientsLine2 || '';
                  ingredientsLine3 = product.ingredientsLine3 || ''; // Generate the weight/quantity HTML based on product properties
                  weightQuantityHTML = '';
                  if (product.productUnit === 'pcs' && product.productSize === 1) {
                    // Don't display anything for single piece products
                    weightQuantityHTML = '';
                  } else if (product.productUnit === 'pcs' && product.productSize > 1) {
                    weightQuantityHTML = "\n          <div class=\"data-label\">QUANTITY</div>\n          <div class=\"data-value\" style=\"margin-bottom: 0;\">\n            ".concat(product.productSize, " pieces\n          </div>\n        ");
                  } else {
                    weightQuantityHTML = "\n          <div class=\"data-label\">WEIGHT</div>\n          <div class=\"data-value\" style=\"margin-bottom: 0;\">\n            ".concat(product.productSize).concat(product.productUnit, "\n          </div>\n        ");
                  }

                  // Template variables
                  templateVars = {
                    labelWidth: labelWidth,
                    labelHeight: labelHeight,
                    horizontalMargin: horizontalMargin,
                    contentWidth: contentWidth,
                    titleY: titleY,
                    productTitleHeight: productTitleHeight,
                    ingredientsY: ingredientsY,
                    ingredientsHeight: ingredientsHeight,
                    petFoodOnlyY: petFoodOnlyY,
                    petFoodOnlyHeight: petFoodOnlyHeight,
                    storageInstructionsY: storageInstructionsY,
                    storageInstructionsHeight: storageInstructionsHeight,
                    dataY: dataY,
                    dataHeight: dataHeight,
                    priceY: priceY,
                    priceHeight: priceHeight,
                    calculatedFontSize: calculatedFontSize,
                    productTitleHTML: productTitleHTML,
                    ingredientsLine1: ingredientsLine1,
                    ingredientsLine2: ingredientsLine2,
                    ingredientsLine3: ingredientsLine3,
                    bestBeforeDate: bestBeforeDate,
                    weightQuantityHTML: weightQuantityHTML,
                    productSize: product.productSize,
                    productUnit: product.productUnit,
                    barcode: barcode,
                    formattedPrice: formattedPrice,
                    overlayImagePath: '../src/assets/overlay.png'
                  }; // Load the template file
                  templatePath = '../src/templates/label-template.html';
                  _context3.next = 60;
                  return fetch(templatePath);
                case 60:
                  templateResponse = _context3.sent;
                  _context3.next = 63;
                  return templateResponse.text();
                case 63:
                  templateContent = _context3.sent;
                  // Replace template variables with actual values
                  Object.entries(templateVars).forEach(function (_ref0) {
                    var _ref1 = _slicedToArray(_ref0, 2),
                      key = _ref1[0],
                      value = _ref1[1];
                    var regex = new RegExp('\\$\\{' + key + '\\}', 'g');
                    templateContent = templateContent.replace(regex, value);
                  });
                  return _context3.abrupt("return", templateContent);
                case 68:
                  _context3.prev = 68;
                  _context3.t1 = _context3["catch"](2);
                  console.error('Error generating label HTML:', _context3.t1);
                  return _context3.abrupt("return", "<div style=\"color: red;\">Error generating label: ".concat(_context3.t1.message, "</div>"));
                case 72:
                case "end":
                  return _context3.stop();
              }
            }, _callee3, null, [[2, 68]]);
          }));
          return _generateLabelHtml.apply(this, arguments);
        };
        generateLabelHtml = function _generateLabelHtml2(_x, _x2) {
          return _generateLabelHtml.apply(this, arguments);
        };
        renderUI = function _renderUI() {
          appDiv.innerHTML = "\n      <div style=\"display: flex; flex-direction: column; height: 100vh; background-color: #f5f5f5;\">\n        <!-- Header -->\n        <div style=\"background-color: #9ba03b; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center;\">\n          <div style=\"font-size: 20px; font-weight: bold;\">Pet Fresh Label Printing</div>\n          <div style=\"display: flex; align-items: center;\">\n            <span style=\"margin-right: 10px;\">Printer: KITCHEN</span>\n            <span style=\"color: #4CAF50; font-size: 24px;\">\u25CF</span>\n          </div>\n          <div style=\"display: flex; align-items: center;\">\n            <span id=\"appVersion\" style=\"margin-right: 10px;\">".concat(appVersion, "</span>\n            <button id=\"settingsButton\" style=\"background: none; border: none; color: white; cursor: pointer; padding: 5px; border-radius: 4px; transition: background-color 0.2s ease;\">\n              <svg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path d=\"M8.325 2.317C8.751 0.561 11.249 0.561 11.675 2.317C11.7389 2.5808 11.8642 2.82578 12.0405 3.032C12.2168 3.23822 12.4399 3.39985 12.6907 3.50375C12.9414 3.60764 13.2132 3.65085 13.4838 3.62987C13.7544 3.60889 14.0162 3.5243 14.248 3.383C15.791 2.443 17.558 4.209 16.618 5.753C16.4769 5.98466 16.3924 6.24634 16.3715 6.51677C16.3506 6.78721 16.3938 7.05877 16.4975 7.30938C16.6013 7.55999 16.7627 7.78258 16.9687 7.95905C17.1747 8.13553 17.4194 8.26091 17.683 8.325C19.439 8.751 19.439 11.249 17.683 11.675C17.4192 11.7389 17.1742 11.8642 16.968 12.0405C16.7618 12.2168 16.6001 12.4399 16.4963 12.6907C16.3924 12.9414 16.3491 13.2132 16.3701 13.4838C16.3911 13.7544 16.4757 14.0162 16.617 14.248C17.557 15.791 15.791 17.558 14.247 16.618C14.0153 16.4769 13.7537 16.3924 13.4832 16.3715C13.2128 16.3506 12.9412 16.3938 12.6906 16.4975C12.44 16.6013 12.2174 16.7627 12.0409 16.9687C11.8645 17.1747 11.7391 17.4194 11.675 17.683C11.249 19.439 8.751 19.439 8.325 17.683C8.26108 17.4192 8.13578 17.1742 7.95949 16.968C7.7832 16.7618 7.56011 16.6001 7.30935 16.4963C7.05859 16.3924 6.78683 16.3491 6.51621 16.3701C6.24559 16.3911 5.98375 16.4757 5.752 16.617C4.209 17.557 2.442 15.791 3.382 14.247C3.5231 14.0153 3.60755 13.7537 3.62848 13.4832C3.6494 13.2128 3.60624 12.9412 3.50247 12.6906C3.3987 12.44 3.23726 12.2174 3.03127 12.0409C2.82529 11.8645 2.58056 11.7391 2.317 11.675C0.561 11.249 0.561 8.751 2.317 8.325C2.5808 8.26108 2.82578 8.13578 3.032 7.95949C3.23822 7.7832 3.39985 7.56011 3.50375 7.30935C3.60764 7.05859 3.65085 6.78683 3.62987 6.51621C3.60889 6.24559 3.5243 5.98375 3.383 5.752C2.443 4.209 4.209 2.442 5.753 3.382C6.753 4.011 8.049 3.696 8.325 2.317Z\" stroke=\"white\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n                <path d=\"M10 13C11.6569 13 13 11.6569 13 10C13 8.34315 11.6569 7 10 7C8.34315 7 7 8.34315 7 10C7 11.6569 8.34315 13 10 13Z\" stroke=\"white\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n              </svg>\n            </button>\n          </div>\n        </div>\n        \n        <!-- Main Content -->\n        <div style=\"display: flex; flex: 1; padding: 0; overflow: hidden;\">\n          <!-- Left Column - Categories -->\n          <div style=\"width: 25%; background-color: #f5f5f5; display: flex; flex-direction: column; border-right: 1px solid #ddd;\">\n            <!-- Search Box -->\n            <div style=\"padding: 10px; border-bottom: 1px solid #ddd;\">\n              <div style=\"display: flex; position: relative;\">\n                <input id=\"searchInput\" type=\"text\" placeholder=\"Search products...\" \n                  style=\"flex: 1; padding: 8px 32px 8px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);\" \n                  value=\"").concat(searchQuery, "\">\n                ").concat(searchQuery ? "\n                  <button id=\"clearSearch\" style=\"position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; width: 18px; height: 18px; display: flex; justify-content: center; align-items: center; border-radius: 50%; background-color: #9e9e9e; color: white; font-size: 14px; line-height: 1; padding: 0;\">\n                    <span style=\"position: relative; top: -1px;\">\u2715</span>\n                  </button>\n                " : '', "\n              </div>\n            </div>\n            \n            <!-- Category List -->\n            <div style=\"flex: 1; overflow-y: auto; overflow-x: hidden;\">\n              ").concat(Object.entries(productData).map(function (_ref2) {
            var _ref3 = _slicedToArray(_ref2, 2),
              category = _ref3[0],
              data = _ref3[1];
            var isSelected = category === selectedCategory && !isSearchActive;
            return "\n                  <div class=\"category-item\" \n                       data-category=\"".concat(category, "\"\n                       style=\"position: relative; background-color: ").concat(data.color, "; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 2px; cursor: pointer; ").concat(isSelected ? 'clip-path: polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%);' : 'margin-right: 15px;', "\">\n                    ").concat(category, "\n                    ").concat(isSelected ? "\n                      <div style=\"position: absolute; right: 0; top: 0; width: 0; height: 0; border-top: 25px solid white; border-left: 15px solid transparent; transform: translateY(0);\"></div>\n                    " : '', "\n                  </div>\n                ");
          }).join(''), "\n            </div>\n          </div>\n          \n          <!-- Middle Column - Products -->\n          <div style=\"width: 50%; background-color: white; overflow-y: auto; display: flex; flex-direction: column; padding: 15px;\">\n            <!-- Product Categories -->\n            <div style=\"display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;\">\n              <h2 style=\"margin: 0; font-weight: bold; font-size: 28px;\">").concat(isSearchActive ? 'SEARCH RESULTS' : 'PRODUCTS', "</h2>\n              ").concat(isSearchActive ? "\n                <div style=\"display: flex; align-items: center; background-color: #f0f0f0; padding: 5px 10px; border-radius: 4px;\">\n                  <span style=\"margin-right: 10px; font-size: 14px;\">Search: \"".concat(searchQuery, "\"</span>\n                  <button id=\"clearSearchResults\" style=\"background: none; border: none; cursor: pointer; width: 20px; height: 20px; display: flex; justify-content: center; align-items: center; border-radius: 50%; background-color: #9e9e9e; color: white; font-size: 12px; line-height: 1; padding: 0;\">\n                    <span style=\"position: relative; top: -1px;\">\u2715</span>\n                  </button>\n                </div>\n              ") : '', "\n            </div>\n            \n            <!-- Products Display -->\n            <div id=\"productsContainer\">\n              ").concat(function () {
            var filteredProducts = getFilteredProducts();
            if (filteredProducts.length === 0) {
              return "\n                    <div style=\"text-align: center; color: #888; padding: 40px 0;\">\n                      ".concat(isSearchActive ? 'No products match your search' : 'No products in this category', "\n                    </div>\n                  ");
            }
            if (isSearchActive || !hasMultipleProductTypes(filteredProducts)) {
              // Display a simple grid for search results or when there's only one product type
              return "\n                    <div style=\"display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;\">\n                      ".concat(filteredProducts.map(function (product) {
                // Format price from cents to dollars
                var formattedPrice = product.productprice ? "$".concat((product.productprice / 100).toFixed(2)) : '';

                // Format size and unit
                var sizeUnit = product.productSize ? "".concat(product.productSize).concat(product.productUnit || '') : '';
                return "\n                          <div class=\"product-item\" \n                               data-product-id=\"".concat(product.id, "\"\n                               style=\"background-color: ").concat(product.selected ? '#9ba03b' : '#ddd', "; color: ").concat(product.selected ? 'white' : 'black', "; padding: 20px; text-align: center; font-weight: bold; cursor: pointer; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;\">\n                            <div>\n                              ").concat(product.productname.replace(/ /g, '<br/>'), "\n                              <div style=\"font-size: 14px; margin-top: 5px; color: ").concat(product.selected ? '#eee' : '#666', ";\">").concat(formattedPrice, "</div>\n                              <div style=\"font-size: 12px; color: ").concat(product.selected ? '#eee' : '#888', ";\">").concat(sizeUnit, "</div>\n                            </div>\n                          </div>\n                        ");
              }).join(''), "\n                    </div>\n                  ");
            } else {
              // Group products by type when there are multiple types and it's not a search
              var groupedProducts = groupProductsByType(filteredProducts);
              return Object.entries(groupedProducts).map(function (_ref4) {
                var _ref5 = _slicedToArray(_ref4, 2),
                  type = _ref5[0],
                  products = _ref5[1];
                return "\n                      <div style=\"margin-bottom: 25px;\">\n                        <h3 style=\"margin: 0 0 15px 0; font-weight: bold; font-size: 22px; border-bottom: 2px solid #9ba03b; padding-bottom: 8px; color: #333;\">".concat(type, "</h3>\n                        <div style=\"display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;\">\n                          ").concat(products.map(function (product) {
                  // Format price from cents to dollars
                  var formattedPrice = product.productprice ? "$".concat((product.productprice / 100).toFixed(2)) : '';

                  // Format size and unit
                  var sizeUnit = product.productSize ? "".concat(product.productSize).concat(product.productUnit || '') : '';
                  return "\n                              <div class=\"product-item\" \n                                   data-product-id=\"".concat(product.id, "\"\n                                   style=\"background-color: ").concat(product.selected ? '#9ba03b' : '#ddd', "; color: ").concat(product.selected ? 'white' : 'black', "; padding: 20px; text-align: center; font-weight: bold; cursor: pointer; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;\">\n                                <div>\n                                  ").concat(product.productname.replace(/ /g, '<br/>'), "\n                                  <div style=\"font-size: 14px; margin-top: 5px; color: ").concat(product.selected ? '#eee' : '#666', ";\">").concat(formattedPrice, "</div>\n                                  <div style=\"font-size: 12px; color: ").concat(product.selected ? '#eee' : '#888', ";\">").concat(sizeUnit, "</div>\n                                </div>\n                              </div>\n                            ");
                }).join(''), "\n                        </div>\n                      </div>\n                    ");
              }).join('');
            }
          }(), "\n            </div>\n          </div>\n          \n          <!-- Right Column - Label Preview -->\n          <div style=\"width: 25%; background-color: #f5f5f5; display: flex; flex-direction: column; border-left: 1px solid #ddd; height: 100%;\">\n            <!-- Label Preview - Now takes all available space -->\n            <div id=\"labelPreviewContainer\" style=\"flex: 1; background-color: white; margin: 10px 10px 10px 10px; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); display: flex; justify-content: center; align-items: center; overflow: hidden;\">\n              <div style=\"text-align: center; width: 90%; height: 90%; border: 1px dashed #ccc; border-radius: 4px; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 10px;\">\n                <div style=\"font-size: 16px; color: #888;\">Select a product to preview label</div>\n              </div>\n            </div>\n            \n            <!-- Bottom Controls Container -->\n            <div style=\"padding: 10px; border-top: 1px solid #ddd; background-color: #f5f5f5; border-radius: 0 0 4px 4px;\">\n              <!-- Quantity Controls -->\n              <div style=\"display: flex; align-items: center; justify-content: center; width: 100%; margin-bottom: 10px;\">\n                <button id=\"decreaseQuantity\" style=\"width: 40px; height: 40px; font-size: 20px; border: none; background-color: #ddd; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s ease;\">\n                  <span style=\"font-size: 24px;\">-</span>\n                </button>\n                <div id=\"quantityDisplay\" style=\"width: 100px; text-align: center; background-color: #ddd; margin: 0 10px; padding: 8px; font-weight: bold; font-size: 20px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);\">1</div>\n                <button id=\"increaseQuantity\" style=\"width: 40px; height: 40px; font-size: 20px; border: none; background-color: #ddd; border-radius: 50%; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s ease;\">\n                  <span style=\"font-size: 24px;\">+</span>\n                </button>\n              </div>\n              \n              <!-- Print Button -->\n              <button id=\"printButton\" style=\"width: 100%; padding: 15px; background-color: #9ba03b; color: white; border: none; font-size: 18px; font-weight: bold; cursor: pointer; border-radius: 4px; box-shadow: 0 2px 5px rgba(155, 160, 59, 0.3); transition: all 0.2s ease;\">PRINT LABEL</button>\n            </div>\n          </div>\n        </div>\n      </div>\n    ");

          // Add event listeners after rendering
          setupEventListeners();
        };
        openSettingsWindow = function _openSettingsWindow() {
          // Use IPC to request opening settings window
          window.api.openSettings().then(function () {
            console.log('Settings window opened');
          })["catch"](function (err) {
            console.error('Error opening settings:', err);
          });
        };
        appDiv = document.getElementById('app'); // Get current app version using IPC
        appVersion = 'v0.1';
        try {
          // Use the exposed ipcRenderer to call for version
          window.api.getAppVersion().then(function (version) {
            appVersion = version;
            // Update version display if UI already rendered
            var versionElement = document.getElementById('appVersion');
            if (versionElement) {
              versionElement.textContent = appVersion;
            }
          })["catch"](function (err) {
            console.error('Error getting app version:', err);
          });
        } catch (error) {
          console.error('Error setting up IPC communication:', error);
        }

        // Load product data
        productData = {}; // Settings dialog state
        isSettingsOpen = false; // Function to open settings in a new window
        _context5.prev = 17;
        _context5.next = 20;
        return fetch('../src/data/products.json');
      case 20:
        response = _context5.sent;
        _context5.next = 23;
        return response.json();
      case 23:
        productData = _context5.sent;
        console.log('Loaded product data:', Object.keys(productData));
        _context5.next = 32;
        break;
      case 27:
        _context5.prev = 27;
        _context5.t0 = _context5["catch"](17);
        console.error('Error loading product data:', _context5.t0);
        // Show error message
        appDiv.innerHTML = "\n      <div style=\"padding: 20px; color: red;\">\n        <h2>Error Loading Product Data</h2>\n        <p>".concat(_context5.t0.message, "</p>\n      </div>\n    ");
        return _context5.abrupt("return");
      case 32:
        // Default selected category (first one in the data)
        selectedCategory = Object.keys(productData)[0]; // Search functionality
        searchQuery = '';
        isSearchActive = false; // Global variables to remember label position and scale between selections
        currentLabelScale = null;
        currentLabelTranslateX = 0;
        currentLabelTranslateY = 0;
        baseScale = null; // Store the base fitting scale
        // Function to render the UI
        // Function to generate label HTML from template and product data
        // Function to update the label preview
        // Function to generate barcode locally
        // Function to setup zoom and drag controls for label preview
        // Get filtered products based on search or category
        // Group products by type
        // Check if multiple product types exist
        // Function to set up all event listeners
        // Initial render
        renderUI();
        console.log('Pet Fresh Label Printer initialized');
      case 41:
      case "end":
        return _context5.stop();
    }
  }, _callee5, null, [[17, 27]]);
})));
/******/ })()
;
//# sourceMappingURL=bundle.js.map