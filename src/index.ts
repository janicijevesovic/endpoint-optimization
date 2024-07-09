import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import { CachedData } from './interfaces/CachedData';
import { IPDirectoryStructure } from './interfaces/DirectoryStructure';

const app = express();
const port = 3000;
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
const cacheKey = 'externalData';

const fetchDataAndCache = async () => {
	try {
		const response = await axios.get(
			'https://rest-test-eight.vercel.app/api/test'
		);
		const data = response.data;

		cache.set(cacheKey, data);
	} catch (error) {
		console.error('Error fetching data:', error);
	}
};

fetchDataAndCache();

app.get('/api/files', (req, res) => {
	const cachedData: CachedData | undefined = cache.get(cacheKey);
	if (cachedData) {
		console.log('Serving from cache');

		let result: IPDirectoryStructure = {};

		cachedData.items.forEach((item) => {
			let parts = item.fileUrl.split('/');
			let ipAddress = parts[2].split(':')[0];
			let directory = parts[3];
			let pathParts = parts.slice(4);

			if (!result[ipAddress]) {
				result[ipAddress] = [];
			}

			let ipArray = result[ipAddress];
			let dirObj = ipArray.find(
				(item) => typeof item === 'object' && item.hasOwnProperty(directory)
			);

			if (!dirObj) {
				dirObj = { [directory]: [] };
				ipArray.push(dirObj);
			}

			let current = dirObj[directory];
			for (let i = 0; i < pathParts.length; i++) {
				let part = pathParts[i];

				if (i === pathParts.length - 1) {
					if (part !== '') current.push(part);
				} else {
					let obj = current.find(
						(item) => typeof item === 'object' && item.hasOwnProperty(part)
					);

					if (!obj) {
						obj = { [part]: [] };
						current.push(obj);
						current = obj[part];
					} else if (typeof obj === 'object') {
						current = obj[part];
					}
				}
			}
		});

		res.json(result);
	} else {
		console.log('Cache is empty, returning fallback response');
		res
			.status(503)
			.json({ message: 'Data is being fetched, please try again shortly.' });
	}
});

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
