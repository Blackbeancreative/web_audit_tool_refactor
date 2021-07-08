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
            maxWaitForLoad: 120000,
            maxWaitForFCP: 120000
        },
        lightHouseResult = await lighthouse(url, options),
        pa11yResult = await pa11y(url, {timeout:120000}).then((results) => results);

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
            
        const 
            lightHouseObj = JSON.parse(lightHouseResult.report),
            LHR = lightHouseObj['audits']['diagnostics']['details']['items'][0];
            
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
