const lighthouse = require('lighthouse'),
    chromium = require('chrome-aws-lambda'),
    pa11y = require('pa11y')

class Audit {
    static async auditor(url) {
        const chrome = await chromium.puppeteer.launch({
            args: ['--headless', '--disable-web-security', '--disable-features=IsolateOrigins', ' --disable-site-isolation-trials'],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
		    args: ['--no-sandbox'],
            timeout: 0
        }),
        options = {
            logLevel: 'info',
            output: 'json',
            onlyCategories: ['performance', 'accessibility', 'seo'],
            skipAudits: ['screenshot-thumbnails', 'final-screenshot'],
            port: (new URL(chrome.wsEndpoint())).port,
            maxWaitForLoad: 600000,
            maxWaitForFCP: 600000
        },
        lightHouseResult = await lighthouse(url, options),
        pa11yResult = await pa11y(url, {timeout:600000}).then((results) => results);

        if(chrome && lightHouseResult) {
            console.log('[AUDIT] Closing report');

            /*
             * Workaround to an existing issue with Chromium/Puppeteer on some Machines/OS's
             * Reference: https://www.gitmemory.com/issue/puppeteer/puppeteer/6563/739149056
             */
            const pages = await chrome.pages(); 
            await Promise.all(pages.map(page =>page.close())); 
            await chrome.close();
        } 
            
        const defaultReport = {
            'numRequests': 0,
            'numTasksOver100ms': 0,
            'numScripts': 0,
            'totalByteWeight': 0,
            'totalTaskTime': 0
        };
        const lightHouseObj = JSON.parse(lightHouseResult.report);
        const LHR = lightHouseObj['audits']['diagnostics']['details']['items'] ? lightHouseObj['audits']['diagnostics']['details']['items'][0] : defaultReport;
            
        return {
            website: {
                url: url
            },
            lighthouse: {
                requests: LHR['numRequests'],
                over_100_ms: LHR['numTasksOver100ms'],
                scripts: LHR['numScripts'],
                docsize: (LHR['totalByteWeight'] / 1000000),
                loadtime: (LHR['totalTaskTime'] / 1000)
            },
            ada: {
                issues: pa11yResult['issues']
            }            
        }
    }
    
}
module.exports = Audit
