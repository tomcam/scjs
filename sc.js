/**
 * Takes a screen shot at the given URL with
 * specified dimensions, e.g. 1920x1080
 * (the 'x' should be lowercase).
 * If no dimensions are specified, uses a default
 * size mentioned in usage().
 * If 'fullpage' is used instead of dimensions, captures the
 * entire page regardless of browser windows size.
 *
 * Usage:
 * node sc url [{dimensions}|fullpage]
 * 
 * Examples:
 *
 * node sc https://www.google.com 
 * node sc https://www.google.com/foo
 * node sc https://www.google.com 1280x960
 * node sc https://www.google.com fullpage
 *
 * It generates a filename based on the 
 * last part of URL, then 
 * appends a readable date in your current
 * locale, followed by the UTC time in seconds
 * since 1970, and replacing any '.' characters 
 * in the filename with dashes.
 *
 * Adds the date in year-month-date format,
 * for example, 2020-04-27, where the month is
 * 1 based (so month 4 is April). That's not foolproof
 * but it gives you a good idea of when the image
 * was taken.
 *
 * Examples:
 *
 * If you took a snapshot of google.com/foo on April
 * 27, 2020, it would generate a filename something
 * like this, depending on the exact time:
 *
 *   foo-2020-04-27-1588020776101.png
 *
 * If you took a snapshot of google.com on April
 * 27, 2020, it would generate this filename:
 *
 *   google-com-2020-4-27-1588020776101.png
 */

// TODO: ERROR HANDLING BAD FOR NONEXISTENT URL
//
// Other form factors: 1920x1080
// Older form factors: 1366x768
// 2560x1600
const puppeteer = require('puppeteer');

// Default width and height of screenshot
let defaultX = 2560
let defaultY = 1600
var X = defaultX
var Y = defaultY

// If true, capture the entire page.
// Disregard X and Y values.
var fullPage = false
let args = process.argv.slice(2)

// First param should be URL to screencap
var url = args[0]

// Get command line params.
switch (args.length) {
  case 0:
    console.log('\nMissing URL to capture\n')
    quit(usage(), 0)
    break
  case 2:
    // Handle size option.
    // Parse a size argument like '1280x1024'
    sizeArg = args[1]
    if (sizeArg.toLowerCase() == "fullpage") {
      fullPage = true;
    } else {
      let xy = sizeArg.split('x')
      if (xy.length != 2) {
        console.log("Size argument should look like '1280x1024'")
        quit(usage(), 1)
      }
      X = parseInt(xy[0])
      Y = parseInt(xy[1])
      if (isNaN(X) || isNaN(Y) || X <= 0 || Y <= 0) {
        quit(usage(), 1)
      }
    }
    break;
}

if (!(url.startsWith("https://") || url.startsWith("http://"))) {
  url = "https://" + url
}


run(url,X,Y,fullPage);

async function run (url,X,Y,fullPage) {
  let args = process.argv.slice(2)
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  if (!fullPage) {
    await page.setViewport({
      width: X,
      height: Y,
      deviceScaleFactor: 1,
    });
  } else {
    const dimensions = await page.evaluate(() => {
      return {
        X: document.documentElement.clientWidth,
        Y: document.documentElement.clientHeight
      };
    });
    X = dimensions.X
    Y = dimensions.Y
  }
  filename = urlToFilename(url)
  await page.screenshot({path: './' + urlToFilename(url), fullPage});
  await page.close()
  browser.close();
  console.log(filename + ' ' + X + 'x' + Y)
}



/** Exit to OS with error code and optional message.
 * By convention an exit code of 0 means no error,
 * so if only a message is used and the error is omitted,
 * it's considered a runtime error and therefore exits 
 * with an error code of 1. 
 * If nothing at all is specified, exit silently 
 * with err code 0.
 * If only a string is specified, display and exit 
 * with error code of 0
 * Expects to be called from node.
 * @param msg {string}
 * @param errCode {number}
 */
function quit(msg, errCode) {
  switch (arguments.length) {
    case 0:
      process.exit(0)
    case 1:
      if (typeof arguments[0] == 'number') {
       process.exit(errCode) 
      } 
      console.log(Buffer.from(arguments[0]).toString())
      process.exit(0) 
    case 2:
      if (typeof arguments[0] != 'string' ||
        typeof arguments[1] != 'number') {
        console.log('quit() function needs string, then error code!')
        process.exit(1)
      }
      console.log(arguments[0])
      process.exit(arguments[1]) 
  }
}

/** Construct CLI usage message and return as a strng.
 * Automatically generates program name as cliName
 * @return {string} Explanation of how to sue this utility
 */
function usage() {
  let cliName = process.argv[1]
  return `

Usage:
  ${cliName} url [dimensions]

  Examples:

  ${cliName} https://www.google.com 
  ${cliName} https://www.google.com/foo
  ${cliName} https://www.google.com 1280x960
  ${cliName} https://www.google.com fullpage

Takes a screen shot at the specified dimensions.
If no dimensions are specified, uses ${defaultX}x${defaultY}
(the 'x' should be lowercase). If 'fullpage' is used instead of dimensions, 
captures the entire page regardless of browser window size.

Generates a filename based on the  last part of URL, then 
appends a readable date in your current locale, followed by the 
UTC time in seconds since 1970, and replacing any '.' characters 
in the filename with dashes.

Examples:

For this command line issued on April 27, 2020:

  ${cliName} https://www.google.com 1280x960

The following filename would be generated:

  foo-2020-04-27-1588020776101.png

For this command line issued on April 27, 2020:

  ${cliName} https://www.google.com fullpage

The following filename would be generated:

  google-com-2020-4-27-1588020776101.png

`
}


/** Convert date to number of milliseconds since 1/1/1970
 * No error checking. Assumes a valid date. 
 * @param date {date} A Javascript date/time object
 * @return Value containing milliseconds since the epoch
 */
function dateToMilliseconds(date) {
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds()
  )
}

/** Convert date to form YYYY-MM-DD, including
 * leading zeroes. Month is NOT zero-based, so 
 * 04 means April.
 * @param date {date} A Javascript date/time object
 * @return string 
 * Thank you, https://stackoverflow.com/questions/1056728/where-can-i-find-documentation-on-formatting-a-date-in-javascript
 *
 */
function dateToYMD(date) {
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    return '' + y + '-' + (m<=9 ? '0' + m : m) + 
      '-' + (d <= 9 ? '0' + d : d);
}

/** Convert last portion of URL to filename
 * with embedded date information. It's meant to
 * let you take multiple shots of the same URL
 * over time for archival purposes without
 * too much work. Just pass it the URL and it
 * adds date information in two forms.
 * It creates a filename based on the URL that
 * appends a readable date in your current
 * locale followed by the UTC time in seconds
 * since 1970.
 *
 * Replaces any '.' characters in the filename
 * with dashes.
 * Adds the date in year-month-date format,
 * for example, 2020-04-27, where the month is
 * 1 based (so month 4 is April). That's not foolproof
 * but it gives you a good idea of when the image
 * was taken.
 * Appends '-' , then the UTC time in milliseconds since 
 * 1/1/1970.
 *
 * So 'https://google.com/foo' returns 'foo'.
 * If it's just a bare URL then return it
 * with the dashes, e.g. 'www-google-com'
 *
 * Examples:
 *
 * If you took a snapshot of google.com/foo on April
 * 27, 2020, it would generate this filename:
 *
 *   foo-2020-4-27-1588020776101
 *
 * If you took a snapshot of google.com on April
 * 27, 2020, it would generate this filename:
 *
 *   google-com-2020-4-27-1588020776101
 *
 */
function urlToFilename(url) {
  if (url == '') {
    return ''
  }
  // Remove any trailing slash.
  url = url.replace(/\/$/, '');
  url = url.replace(/\./g,'-')
  var filename = url.substring(url.lastIndexOf('/') + 1);

  
  // Get current time 
  var now = new Date()
  
  return filename +'-' +
    // Convert current date as string using the current locale
    // but in the format YYYY-MM-DD
    dateToYMD(now) + '-' +
    // Convert current time to # of milliseconds since
    // 1/1/1970
    dateToMilliseconds(now) +
    '.png'
}
