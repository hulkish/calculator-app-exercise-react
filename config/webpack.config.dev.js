import autoprefixer from 'autoprefixer';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import InterpolateHtmlPlugin from 'react-dev-utils/InterpolateHtmlPlugin';
import WatchMissingNodeModulesPlugin from 'react-dev-utils/WatchMissingNodeModulesPlugin';
import getClientEnvironment from './env';
import paths from './paths';

const publicPath = '/';
const publicUrl = '';
const env = getClientEnvironment(publicUrl);

const webpackConfig = {
  devtool: 'cheap-module-source-map',
  entry: [
    require.resolve('react-dev-utils/webpackHotDevClient'),
    require.resolve('./polyfills'),
    paths.appIndexJs
  ],
  output: {
    path: paths.appBuild,
    pathinfo: true,
    filename: 'static/js/bundle.js',
    publicPath
  },
  resolve: {
    fallback: paths.nodePaths,
    extensions: ['.js', '.json', '.jsx', ''],
    alias: {
      'react-native': 'react-native-web'
    },
    root: [paths.appSrc]
  },

  module: {
    preLoaders: [
      {
        test: /\.(jsx?)$/,
        loader: 'eslint',
        include: paths.appSrc,
      }
    ],
    loaders: [
      {
        exclude: [
          /\.html$/,
          /\.(jsx?)$/,
          /\.css$/,
          /\.json$/
        ],
        loader: 'url',
        query: {
          limit: 10000,
          name: 'static/media/[name].[hash:8].[ext]'
        }
      },
      {
        test: /\.(jsx?)$/,
        include: paths.appSrc,
        loader: 'babel',
        query: {
          cacheDirectory: true
        }
      },
      {
        test: /\.css$/,
        loaders: [
          'style-loader?sourceMap',
          `css-loader?${JSON.stringify({
            importLoaders: 3,
            sourceMap: true,
            modules: true,
          })}`,
          'postcss-loader?sourceMap',
          "resolve-url-loader"
        ]
      },
      {
        test: /\.scss$/i,
        loaders: [
          'style-loader?sourceMap',
          `css-loader?${JSON.stringify({
            importLoaders: 3,
            sourceMap: true,
            modules: true,
          })}`,
          'postcss-loader?sourceMap',
          "resolve-url-loader",
          'sass-loader?sourceMap',
        ]
      },
      {
        test: /\.json$/,
        loader: 'json'
      }
    ]
  },

  postcss() {
    return [
      autoprefixer({
        browsers: [
          '>1%',
          'last 4 versions',
          'Firefox ESR',
        ]
      }),
    ];
  },
  plugins: [
    new InterpolateHtmlPlugin({
      PUBLIC_URL: publicUrl
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.appHtml,
    }),
    new webpack.DefinePlugin(env),
    new webpack.HotModuleReplacementPlugin(),
    new CaseSensitivePathsPlugin(),
    new WatchMissingNodeModulesPlugin(paths.appNodeModules)
  ],
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
console.log(require('util').inspect(webpackConfig, { depth: null, colors: true }));
export default webpackConfig;
