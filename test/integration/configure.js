module.exports = function() {

  // hooks
  var hooks = Array.prototype.slice.call(arguments);

  // actual config fn
  return function(karma) {

    var opts = {};

    var fakeKarma = {
      set: function(props) {
        opts = Object.assign(opts, props);
      }
    };

    hooks.forEach(function(h) {
      h(fakeKarma);
    });

    karma.set(opts);
  };
};