const lighthouse = require('lighthouse')
const chromium = require('chrome-aws-lambda')
const pa11y = require('pa11y')

class Audit {
    static async auditor(url) {
        const chrome = await chromium.puppeteer.launch({
                args: ['--headless'],
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath,
                headless: chromium.headless,
                ignoreHTTPSErrors: true
            })
        const options = {
            logLevel: 'info',
            output: 'json',
            onlyCategories: ['performance', 'accessibility', 'seo'],
            skipAudits: ['screenshot-thumbnails', 'final-screenshot'],
            port: (new URL(chrome.wsEndpoint())).port 
        }
        const lightHouseResult = await lighthouse(url, options)
        const pa11yResult = await pa11y(url).then((results) => {
            return results
        })
        if(chrome) {
            await chrome.close()
        }
        const lightHouseObj = JSON.parse(lightHouseResult.report)
        const LHR = lightHouseObj['audits']['diagnostics']['details']['items'][0]
        const data = {
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