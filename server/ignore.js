const ignore = () => {
  var extensions = [".css", ".scss", ".less", ".png", ".jpg", ".gif", ".svg"];
  for (let i = 0, len = extensions.length; i < len; i++) {
    require.extensions[extensions[i]] = function() {
      return false;
    };
  }
};
module.exports = ignore;
