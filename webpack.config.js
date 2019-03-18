const TerserPlugin = require("terser-webpack-plugin");
const path = require("path");

const config = {
  entry: path.join(__dirname, `./script.js`),
  output: {
    path: path.join(__dirname, "/dist")
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"]
      }
    ]
  },
  optimization: {
    minimizer: [new TerserPlugin()]
  }
};

module.exports = config;
