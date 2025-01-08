const { detectElements } = require('./yoloDetector');
const { captureScreen } = require('./screenCapture');
const robot = require('robotjs');

const SCREENSHOT_PATH = './screenshots/current_screen.png';

async function monitorTrade(buyerId, sellerId, petName) {
    console.log(`Monitoring trade for buyer: ${buyerId}, seller: ${sellerId}, pet: ${petName}`);

    let retryCount = 0;
    let maxRetries = 10;

    while (retryCount < maxRetries) {
        // Capture screenshot
        captureScreen(SCREENSHOT_PATH);

        // Detect buttons
        const detectedElements = await detectElements();
        const acceptButton = detectedElements.find((el) => el.class === 'AcceptButton');

        if (acceptButton) {
            console.log('Accept button found. Clicking...');
            const [x, y] = acceptButton.box;
            try {
                robot.moveMouseSmooth(x, y);
                robot.mouseClick();
                await sleep(500);
            } catch (error) {
                console.error('Error moving mouse or clicking button:', error);
            }

            // Log transaction or verify trade completion
            console.log('Trade action performed.');
            break;
        } else {
            console.log('Accept button not found. Retrying...');
            retryCount++;
        }

        await sleep(1000); // Retry after a delay
    }

    if (retryCount === maxRetries) {
        console.log('Maximum retries exceeded. Trade failed.');
    }
}

module.exports = { monitorTrade };