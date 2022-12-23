// 把packages目录下的所有包进行打包

const fs = require("fs");
// 开启子进程 进行打包 最终还是使用rollup来进行打包
const execa = require("execa");

// 查找package下所有包  排除到文件
const targets = fs.readdirSync("packages").filter((f) => {
  if (!fs.statSync(`packages/${f}`).isDirectory()) {
    return false;
  }
  return true;
});

// 对我们目标进行一次打包，并行打包

async function build(target) {
  // // 使用rollup 进行打包   指定打包对象target
  await execa(
    "rollup",
    ["-c", "--environment", `TARGET:${target}`],
    { stdio: "inherit" } // 当子进程打包的信息共享给父进程;
  );
}

function runParallel(targets, iteratorFn) {
  const res = [];
  for (const item of targets) {
    const p = iteratorFn(item);
    res.push(p);
  }
  return Promise.all(res);
}

runParallel(targets, build).then(() => {
  console.log("所有包打包完成");
});
