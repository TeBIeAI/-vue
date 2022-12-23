import path from "path";
import json from "@rollup/plugin-json";
import typescript from "rollup-plugin-typescript2";
import resolvePlugin from "@rollup/plugin-node-resolve";

// 根据环境变量中的target属性  获取对应模块中的package.json
console.log(process.env.TARGET, "ROLLUP");

// 找到packages
const packagesDir = path.resolve(__dirname, "packages");
console.log(packagesDir, "------------------");

// 找到要打包的某个包 打包时候的基准目录  比如  F:\newDesktop\mini-vue\packages
const packageDir = path.resolve(packagesDir, process.env.TARGET);
console.log("------------------", packageDir);

// 永远针对的是某个模块
const resolve = (p) => path.resolve(packageDir, p);

const pkg = require(resolve("package.json"));
console.log(pkg);

// 获取当前路径最后一个名字
const name = path.basename(packageDir);
// 对打包类型做一个引射表，根据提供的formats来格式化打包的内容
// 自定义
const outputConfig = {
  "esm-bundler": {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: "es",
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: "cjs",
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: "iife", // 立即执行函数
  },
};

const options = pkg.buildOptions; //自己在package.json中定义的选项

function createConfig(format, output) {
  output.name = options.name;
  output.sourcemap = true;

  // 生成rollup配置
  return {
    input: resolve(`src/index.ts`),
    output,
    plugins: [
      json(),
      typescript({
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      }),
      resolvePlugin(),
    ],
  };
}

// rollup最终需要导出配置
console.log("options", options);
export default options.formats.map((format) => {
  console.log("单个format", format);
  return createConfig(format, outputConfig[format]);
});
