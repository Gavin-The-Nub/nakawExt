const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    background: "./src/background/index.js",
    content: "./src/content/index.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: "asset/resource",
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/manifest.json", to: "manifest.json" },
        { from: "src/icons", to: "icons" },
        { from: "src/assets", to: "assets", noErrorOnMissing: true },
        { from: "src/offscreen", to: "offscreen" },
      ],
    }),
  ],
  resolve: {
    extensions: [".js", ".jsx"],
  },
  externals: {
    "three-mesh-bvh": "commonjs2 three-mesh-bvh",
  },
};
