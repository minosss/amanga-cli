#!/usr/bin/env node
'use strict';

const cli = require('commander');
const chalk = require('chalk');
const amanga = require('amanga');
const {downloadUrls, printInfo, isSupportedExt} = require('./common');

const ERROR_TITLE = chalk.red('Error:') + ' ';

process.on('unhandledRejection', reason => {
	console.log(ERROR_TITLE + reason.message);
	process.exit(1);
});

cli.command('get <url>')
	.description('download manga from site url.')
	.option('-i, --info', 'Print extracted information')
	.option('-o, --output-dir <dir>', 'Set output directory', 'amanga')
	.option('-f, --force', 'Force overwriting existing files')
	.option('--ext <ext>', 'Image format', 'jpeg')
	.option('-r, --retry <times>', 'Retry times', 3)
	.action(async (url, cmd) => {
		const args = cleanArgs(cmd);
		args.sourceUrl = url;

		if (!isSupportedExt(args.ext)) throw new Error(`ext ${args.ext} is not supported`);

		let manga = await amanga(url);
		if (!manga) return;

		if (args.info) {
			printInfo(manga);
			return;
		}

		await downloadUrls(manga, args);
	});

cli.arguments('<command>').action(cmd => {
	cli.outputHelp();
	console.log(ERROR_TITLE + `Unknow command ${chalk.yellow(cmd)}.`);
	console.log();
});

cli.commands.forEach(c => c.on('--help', () => console.log()));

cli.parse(process.argv);

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
