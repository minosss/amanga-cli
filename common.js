const ProgressBar = require('progress');
const chalk = require('chalk');
const sharp = require('sharp');
const download = require('download');
const path = require('path');
const {pathExists, ensureDir, remove} = require('fs-extra');

const supportedImageTypes = ['jpeg', 'png', 'webp', 'tiff'];

exports.isSupportedExt = ext => supportedImageTypes.includes(ext);

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
	await ensureDir(dirName);

	console.log();
	console.log(`Downloading ${total} images of ${title} ...`);
	console.log(
		(force ? chalk.yellow('Force overwriting existing files') + ', And i' : 'I') +
			'mage will convert to ' +
			chalk.yellow(ext)
	);
	const bar = new ProgressBar('  ├:bar┤ :percent [:current/:total] ', {
		total: total,
		complete: '█',
		incomplete: ' ',
		width: 100,
	});

	const failImages = [];
	for (const image of finalImages) {
		const {url, filename} = image;
		const filePath = path.join(dirName, filename + '.' + ext);

		if (!force && (await pathExists(filePath))) {
			bar.tick();
			continue;
		}

		await download(url, undefined, {headers: {referer: sourceUrl}, timeout: 10000})
			.then(data => {
				return sharp(data)
					[ext]()
					.toFile(filePath);
			})
			.then(info => {
				if (info.size > 0) {
					bar.tick();
				} else {
					console.log(info);
				}
			})
			.catch(async _error => {
				await remove(filePath);
				failImages.push(image);
			});
	}

	if (failImages.length && args.retry > 0) {
		bar.terminate();
		args.retry -= 1;

		console.log();
		console.log(chalk.yellow('Retrying after 3s'));
		await delay(3000);
		return downloadUrls({...manga, images: failImages}, {...args});
	}

	console.log();
	console.log('Download complete 🎉');
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
