#!/usr/bin/env node

const { program } = require("commander");
const chalk = require('chalk');
const inquirer = require('inquirer');
const logger = require('./logger');
const spinner = require('./spinner');
const process = require('process');
const path = require('path');
const fs = require('fs');
const download = require('./download');
const io = require('./io.js')

let projectName;
let force;

program.arguments('[projectName]') // 指定解析的参数
    .description("初始化项目")
    .option('-f --force','如果存在输入的项目目录，强制删除项目目录')
    .action((name,cmd)=>{
        projectName = name;
        force = cmd.force;
    });
program.parse(process.argv);

console.log(projectName,force)



// 设置用户交互的问题
const questions = [
    {
        type: 'input',
        name:'projectName',
        message: chalk.yellow("输入你的项目名字：")
    },
    {
        type:'list',
        name:'template',
        message: chalk.yellow("请选择创建项目模板："),
        choices:[
            {name:"Ts模板",value:"tsProject"},
            {name:"Js模板",value:"jsProject"}
        ]
    }
];

// 如果用户命令参数带projectName，只需要询问用户选择模板
if(projectName){
    questions.splice(0,1);
}

// 执行用户交互命令
inquirer.prompt(questions).then(result=>{
    if(result.projectName) {
        projectName = result.projectName;
    }
    const templateName = result.template;
    // 获取projectName templateName
    console.log("项目名称：" + projectName)
    console.log("模板名称：" + templateName)
    if(!templateName || !projectName){
        // 退出
        logger.exit();
    }
    // 往下走
    checkProjectExits(projectName,templateName); // 检查目录是否存在
}).catch(error=>{
    logger.exit(error);
})

function checkProjectExits(projectName,templateName){
    const currentPath = process.cwd();
    console.log('currentPath-->', currentPath)
    const filePath = path.join(currentPath,`${projectName}`); // 获取项目的真实路径
    if(force){ // 强制删除
        if(fs.existsSync(filePath)){
            // 删除文件夹
            spinner.logWithSpinner(`删除${projectName}...`)
            io.deletePath(filePath)
            spinner.stopSpinner(false);
        }
        startDownloadTemplate(projectName, templateName) // 开始下载模板
        return;
    }
    if(fs.existsSync(filePath)){ // 判断文件是否存在 询问是否继续
        inquirer.prompt( {
            type: 'confirm',
            name: 'out',
            message: `${projectName}文件夹已存在，是否覆盖？`
        }).then(data=>{
            if(!data.out){ // 用户不同意
                exit();
            }else{
                // 删除文件夹
                spinner.logWithSpinner(`删除${projectName}...`)
                io.deletePath(filePath)
                spinner.stopSpinner(false);
                startDownloadTemplate(projectName, templateName) // 开始下载模板
            }
        }).catch(error=>{
            exit(error);
        })
    }else{
        startDownloadTemplate(projectName, templateName) // 开始下载模板
    }
}

function startDownloadTemplate(projectName,templateName){
    download.downloadTemplate(templateName, projectName , (error)=>{
        if(error){
            logger.exit(error);
            return;
        }
        // 替换解压后的模板package.json, index.html关键内容
        replaceFileContent(projectName,templateName)
    })
}

function replaceFileContent(projectName,templateName){
    const currentPath = process.cwd();
    try{
        // 读取项目的package.json
        const pkgPath = path.join(currentPath,`${projectName}/package.json`);
        // 读取内容
        const pkg = require(pkgPath);
        // 修改package.json的name属性为项目名称
        pkg.name = projectName;
        fs.writeFileSync(pkgPath,JSON.stringify(pkg,null,2));

        const indexPath = path.join(currentPath, `${projectName}/index.html`);
        let html = fs.readFileSync(indexPath).toString();
        // 修改模板title为项目名称
        html = html.replace(/<title>(.*)<\/title>/g,`<title>${projectName}</title>`)
        fs.writeFileSync(indexPath,html);
    }catch(error){
        exit(error)
    }
    // 安装依赖
    install(projectName)
}

function install(projectName){
    console.log(projectName)
}
