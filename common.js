const ora = require('ora');
const chalk = require('chalk');
const sharp = require('sharp');
const download = require('download');
const path = require('path');
const {existsSync, ensureDirSync, removeSync} = require('fs-extra');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function downloadUrls(manga, args) {
	const {ext = 'jpeg', force = false, sourceUrl, outputDir} = args;
	const {title, images} = manga;
	const total = images.length;
	const finalImages =
		images.length && typeof images[0] === 'string'
			? images.map((imageUrl, index) => {
					return {
						index,
						filename: `${index + 1}`.padStart((total + '').length, '0'),
						url: encodeURI(imageUrl),
					};
			  })
			: images;

	const dirName = path.join(outputDir, title);
	ensureDirSync(dirName);

	const spinner = ora();
	spinner.info(`Downloading ${chalk.yellow(total)} images of ${chalk.yellow(title)} ...`);
	spinner.info(
		(force ? chalk.yellow('Force overwriting existing files') + ', And i' : 'I') +
			'mage will convert to ' +
			chalk.yellow(ext)
	);

	const failImages = [];
	let index = 0;
	for (const image of finalImages) {
		const {url, filename} = image;
		const filePath = path.join(dirName, filename + '.' + ext);

		spinner.prefixText = `[${++index}/${total}]`.padEnd(8, ' ');

		if (!force && existsSync(filePath)) {
			spinner.warn(`Exist ${filePath}, Skip`);
			continue;
		}

		spinner.start(`Downloading ${url}`);
		try {
			const data = await download(url, undefined, {
				headers: {referer: sourceUrl},
				timeout: 10000,
			});
			const info = await sharp(data)
				[ext]()
				.toFile(filePath);
			spinner.succeed(`Saved to ${filePath} ${info.size}`);
		} catch (error) {
			spinner.fail(error.message);
			removeSync(filePath);
			failImages.push(image);
		}
	}

	spinner.prefixText = '';
	if (failImages.length) {
		if (args.retry > 0) {
			console.log();
			spinner.warn('Retrying after 3s ...');

			await delay(3000);
			await downloadUrls({...manga, images: failImages}, {...args, retry: args.retry - 1});
			return;
		} else {
			spinner.warn(
				`${chalk.yellow(
					failImages.length
				)} images download failed, you can run amanga again or download by youself.`
			);
			console.log('    ' + failImages.map(image => image.url).join('\n    '));
		}
	}

	spinner.succeed('Done 🎉🎉');
	return;
}

exports.downloadUrls = downloadUrls;

function printInfo(manga) {
	console.log();
	console.log('Site:      ' + manga.site);
	console.log('Title:     ' + manga.title);
	console.log('Images:    ' + manga.images.length);
	console.log('    ' + manga.images.join('\n    '));
}

exports.printInfo = printInfo;
