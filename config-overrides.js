module.exports = {
  webpack: function(config, env) {
    // ...add your webpack config
    // console.log(JSON.stringify(config));
    config.module.rules.forEach(d => {
      d.oneOf &&
        d.oneOf.forEach(e => {
          if (e && e.options && e.options.name) {
            e.options.name = e.options.name.replace('[hash:8].', '');
          }
        });
    });
    return config;
  }
};
