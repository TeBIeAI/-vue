// 只针对具体的某个模块打包

const fs = require("fs");
// 开启子进程 进行打包 最终还是使用rollup来进行打包
const execa = require("execa");

const target = "reactivity";

// 对我们目标进行一次打包，并行打包
async function build(target) {
  // // 使用rollup 进行打包   指定打包对象target
  await execa(
    "rollup",
    ["-cw", "--environment", `TARGET:${target}`],
    { stdio: "inherit" } // 当子进程打包的信息共享给父进程;
  );
}

build(target);
