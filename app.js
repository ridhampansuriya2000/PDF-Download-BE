let express = require("express");
let app = express();
let ejs = require("ejs");
const puppeteer = require('puppeteer');
const axios = require('axios');
const { PassThrough } = require('stream');
const PDFDocument = require('pdfkit');
const moment = require('moment');


app.get('/',(req,res) => {
	try{
		res.sendFile(__dirname + '/views/initial.html');
	}catch (e) {
		res.status(500).send({error:e});
	}
})

app.get("/generatePDF",async (req, res) => {

	const apiUrl = 'https://api.usa.gov/crime/fbi/cde/arrest/state/AK/all';
	const apiKey = 'iiHnOKfno2Mgkt5AynpvPpUQTEyxE77jo1RU8PIv';

	try {
		const response = await axios.get(apiUrl, {
			params: {
				from: 2012,
				to: 2021,
				API_KEY: apiKey,
			},
		});

		const crimeData = response.data.data;
		const html = await ejs.renderFile('views/report-template.ejs', {crimeData, date : moment(new Date()).format('LL')});

		const browser = await puppeteer.launch();
		const page = await browser.newPage();

		await page.setViewport({ width: 1200, height: 1122 });
		await page.setContent(html, { waitUntil: "domcontentloaded" });

		const screenshot = await page.screenshot({ fullPage: true });

		await browser.close();

		const pdfStream = new PassThrough();
		const pdfDoc = new PDFDocument({ autoFirstPage: false });
		pdfDoc.pipe(pdfStream);
		pdfDoc.addPage({ size: [595, 842] });
		pdfDoc.image(screenshot, 0, 0, { width: 595, height: 842 });
		pdfDoc.end();

		res.setHeader('Content-Disposition', 'attachment; filename="chart.pdf"');
		res.setHeader('Content-Type', 'application/pdf');

		pdfStream.pipe(res);

	} catch (error) {
		console.error('Error:', error);
		res.status(500).send('Error fetching data from the API');
	}

});

app.listen(5000, () => {
	console.log('Server Is running At 5000');
});
