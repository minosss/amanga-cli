#!/usr/bin/env node
'use strict';

const cli = require('commander');
const chalk = require('chalk');

process.on('unhandledRejection', error => {
	console.log(`${chalk.red('Error:')} ${error.message}`);
	process.exit(1);
});

cli.version(`amanga-cli ${require('./package.json').version}`).usage('<command> [options]');

cli.command('get <url>')
	.description('download manga from site url.')
	.option('-i, --info', 'Print extracted information')
	.option('-o, --output-dir <dir>', 'Set output directory', 'amanga')
	.option('-f, --force', 'Force overwriting existing files')
	.option('--ext <ext>', 'Image format', 'jpeg')
	.option('-r, --retry <times>', 'Retry times', 3)
	.action((url, cmd) => {
		require('./lib/get')(url, cleanArgs(cmd));
	});

cli.arguments('<command>').action(cmd => {
	cli.outputHelp();
	console.log(chalk.red('Error:') + ` Unknow command ${chalk.yellow(cmd)}.`);
	console.log();
});

cli.on('--help', () => {
	console.log();
	console.log(
		`  Run ${chalk.cyan(`amanga <command> --help`)} for detailed usage of given command.`
	);
	console.log();
});

cli.commands.forEach(c => c.on('--help', () => console.log()));

cli.parse(process.argv);

if (!process.argv.slice(2).length) {
	cli.outputHelp();
}

function camelize(str) {
	return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
}

function cleanArgs(cmd) {
	const args = {};
	cmd.options.forEach(o => {
		const key = camelize(o.long.replace(/^--/, ''));
		if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
			args[key] = cmd[key];
		}
	});
	return args;
}
