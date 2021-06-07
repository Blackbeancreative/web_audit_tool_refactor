const lighthouse = require('lighthouse'),
    chromium = require('chrome-aws-lambda'),
    pa11y = require('pa11y')

class Audit {
    static async auditor(url) {
        const chrome = await chromium.puppeteer.launch({
                args: ['--headless'],
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath,
                headless: chromium.headless,
                ignoreHTTPSErrors: true
            }),
            options = {
                logLevel: 'info',
                output: 'json',
                onlyCategories: ['performance', 'accessibility', 'seo'],
                skipAudits: ['screenshot-thumbnails', 'final-screenshot'],
                port: (new URL(chrome.wsEndpoint())).port 
            },
            lightHouseResult = await lighthouse(url, options),
            pa11yResult = await pa11y(url).then((results) => {
                return results
            })
        if(chrome) {
            await chrome.close()
        }
        const lightHouseObj = JSON.parse(lightHouseResult.report),
            LHR = lightHouseObj['audits']['diagnostics']['details']['items'][0],
            data = {
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
        return data
    }
    
}
module.exports = Audit