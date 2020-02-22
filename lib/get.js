const ow = require('ow');
const amanga = require('amanga');
const {downloadUrls, printInfo} = require('../common');

const supportedImageTypes = ['jpeg', 'png', 'webp', 'tiff'];

async function action(url, args) {
	ow(args.ext, 'ext', ow.string.oneOf(supportedImageTypes));

	const manga = await amanga(url);

	if (args.info) {
		printInfo(manga);
		return;
	}

	return await downloadUrls(manga, args);
}

module.exports = action;
