module.exports = {
  mode: 'development',
  entry: {
    thesaurusquery: './src/query/index.jsx'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  },
  output: {
    path: __dirname + '/dist/SLING-INF/content/libs/lfs/resources/',
    publicPath: '/',
    filename: '[name].js'
  },
  externals: [
    {
      "react": "React",
      "react-dom": "ReactDOM",
      "formik": "Formik",
      "lodash": "lodash",
      "prop-types": "PropTypes",
      "jss": "jss",
      "@material-ui/core": "window['material-ui']"
    }
  ]
};
