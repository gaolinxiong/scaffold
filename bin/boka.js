#!/usr/bin/env node

const pkg = require("./../package.json")
const { program } = require("commander")

program.version(pkg.version,'-v --version')

program.command('init [projectName]','init project')

program.parse(process.argv);
