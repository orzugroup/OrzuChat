const app = require('./app.json');

module.exports = ({ config }) => ({
  ...config,
  ...app.expo,
    extra: {
      ...(config.extra ?? {}),
      supabaseUrl:
        process.env.EXPO_PUBLIC_SUPABASE_URL ||
        config.extra?.supabaseUrl ||
        app.expo.extra?.supabaseUrl ||
        '',
      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        config.extra?.supabaseAnonKey ||
        app.expo.extra?.supabaseAnonKey ||
        '',
      apiUrl:
        process.env.EXPO_PUBLIC_API_URL ||
        config.extra?.apiUrl ||
        app.expo.extra?.apiUrl ||
        '',
    },
});
