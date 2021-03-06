'use strict';

// this program needs the puppeteer node library to work
const puppeteer = require('puppeteer');
// this program needs the prompt package to work
const prompt = require('prompt');

// begin the process by creating a function for the whole program to run in
async function run() {
	// this is a function that allows the program to pause for any number of seconds
	function delaySeconds(timeout) {
    		return new Promise((resolve) => {
			setTimeout(() => { resolve(timeout) }, timeout * 1000);
		});
	}
	
	// this launches puppeteer in non-headless mode, meaning the user will see the chromium instance open and run instead of running in the background invisibly
	const browser = await puppeteer.launch({
		// the program will not let you log in if this is switched to true, so keep it set to false
		headless: false,
		args:
		[
			// this is done so the "Reddit wants to show notifications: ALLOW, BLOCK" notification bar does not appear
			'--disable-notifications',
		]
	});
	
	// open a new page of Chromium
	const page = await browser.newPage();
	
	console.log("");
	console.log("Puppeteer opened successfully.");
		
	// this is the smallest screen size I imagine anyone would use (if you use 800x600, what is wrong with you?)
	await page.setViewport({ width: 1024, height: 768 });
	
	// open up Reddit's login page
	await page.goto('https://www.reddit.com/login/', {waitUntil: 'networkidle2'});
	
	//******************************************************************************//
	//                       ENTER THE USERNAME AND PASSWORD                        //
	//******************************************************************************//
	
	console.log("Navigated to the Reddit login screen.");
	
	// create an undefined variable used for the loop that asks for the username and password 
	let redditCredentials = 1;
	// while the previous variable is undefined
	while (redditCredentials == 1) {	
		// ask the person for their username and password
		const credentials = await new Promise( ( resolve, reject ) => {
			prompt.get( [ 'reddit_username', 'reddit_password' ], ( error, result ) => {
				resolve( result );
			});
		});

		let username = credentials.reddit_username;
		let password = credentials.reddit_password;
	
		// check to make sure the username and password that was entered contains text
		if (username == "" && password == "") {
			console.log("Please enter a username and password.");
			continue;
		} else if (username == "") {
			console.log("Please enter a username.");
			continue;
		} else if (password == "") {
			console.log("Please enter a password.");
			continue;
		} else {
			// assign constant variables as the entered username & password so we can break out of the loop
			let redditUserName = username;
			let redditPassword = password;
			
			console.log("Attempting to login to Reddit with the provided Username and Password.");
		}

		// click on the username field		
		await page.click('#loginUsername', {delay: 250});
		
		// type in the username
		await page.keyboard.type(username, { delay: 60 });
		
		await delaySeconds(1);
		
		// click on the password field
		await page.click('#loginPassword', {delay: 250});
		
		// type in the password
		await page.keyboard.type(password, { delay: 60 });
		
		await delaySeconds(1);
		
		// click on the Sign In button
		await page.click('button.AnimatedForm__submitButton', {delay: 250});
		
		await delaySeconds(1);
						
		// check the page for a warning that says "Incorrect username or password"
		let checkForIncorrectUserOrPass = await page.$x("//div[contains(text(), 'Incorrect')]");
		// check to see if the username or password was wrong
		if (checkForIncorrectUserOrPass.length > 0) {
			// if the username or password was wrong, start back at the top of the loop and ask for the username and password again
			console.log("That username or password is incorrect. Please check your username and password for accuracy and try again.");
			
			// reload the page to delete the inputs that were already entered in the username and password field
			await page.reload();
			
			// go back to the start of the loop
			continue;
		} 
		
		// check the page for a warning that says "you are doing that too much. try again in X minutes. (usually 3 or 6)"
		let checkForTooMuchWarning = await page.$x("//span[contains(text(), 'you are doing that too much')]");
		// check to see if the user needs to wait before trying to login again
		if (checkForTooMuchWarning.length > 0) {
			// if the user does not exist, start back at the top of the loop and ask for the username and password again
			console.log("You are trying to log in too much. Wait a while then try again.");
			
			// reload the page to delete the inputs that were already entered in the username and password field
			await page.reload();
			
			// go back to the start of the loop
			continue;
		}

		// check the page for a warning that says "That user doesn't exist"
		let checkForWrongUser = await page.$x("//div[contains(text(), 'That user does')]");
		// check to see if the user does not exist
		if (checkForWrongUser.length > 0) {
			// if the user does not exist, start back at the top of the loop and ask for the username and password again
			console.log("That user doesn't exist. Please check your username for accuracy and try again.");
			
			// reload the page to delete the inputs that were already entered in the username and password field
			await page.reload();
			
			// go back to the start of the loop
			continue;
		}
		
		// check the page for a warning that says "There was an error sending your request. Please try again."
		let checkForErrorSendingYourRequest = await page.$x("//span[contains(text(), 'There was an error sending your request')]");
		// check to see if there was an error with the request
		if (checkForErrorSendingYourRequest.length > 0) {
			// close the program and tell the user to start the program over
			console.log("There was an error sending your request. Please try again.");
			
			// reload the page to delete the inputs that were already entered in the username and password field
			await page.reload();
			
			// go back to the start of the loop
			continue;
		}		
		// if you successfully signed in, leave this loop so you can move to the next part of the program
		break;
	}
	
	//******************************************************************************//
	//         CHECK IF THE USER HAS 2-FACTOR AUTHENTICATION TURNED ON              //
	//******************************************************************************//
	
	await delaySeconds(1);
			
	// the 2 factor authentication page has an h1 that says "Enter the 6 digit code from your authenticator app". Check for that.
	let checkForTwoFactorAuthentication = await page.$x("//h1[contains(text(), 'Enter the 6 digit code')]");
	
	if (checkForTwoFactorAuthentication.length > 0) {
			
		console.log("This account uses 2 factor authentication.");
		
		console.log("Please check your 2 factor authentication app, text messages or email to find your authentication code");
		console.log("and enter it in the console prompt below.");
		
		// create an undefined variable used for the loop that asks for the 2 factor authentication code
		let redditTwoFactorCode = 1;
		// while the previous variable is undefined
		while (redditTwoFactorCode == 1) {	
			// ask the person for their 2 factor authentication code
			const tfacredentials = await new Promise( ( resolve, reject ) => {
				prompt.get( [ 'reddit_two_factor_code' ], ( error, result ) => {
					resolve( result );
				});
			});

			let twoFactorCode = tfacredentials.reddit_two_factor_code;
		
			// check to make sure the two factor code that was entered contains numbers
			if (twoFactorCode == "") {
				console.log("Please enter a two factor authentication code.");
				continue;
			} else {
				// assign a variable as the entered code so we can break out of the loop
				let redditTwoFactorAccessCode = twoFactorCode;
				
				console.log("Attempting to use the two factor code you provided.");
			}

			// click inside the field where you will enter the 2 factor authentication code
			await page.click('input#loginOtp', {delay: 250});
			
			// type in the access code
			await page.keyboard.type(twoFactorCode, { delay: 60 });
			
			await delaySeconds(1);
			
			// click on the blue CHECK CODE button
			await page.click('button.AnimatedForm__submitButton', {delay: 250});
			
			await delaySeconds(1);
					
			// check the page for a warning that says "Code must be 6 digits"
			let checkForWrongNumberOfDigits = await page.$x("//div[contains(text(), 'Code must be 6 digits')]");
			// check to see if the the right number of digits were entered
			if (checkForWrongNumberOfDigits.length > 0) {
				// if the code was entered incorrectly, start back at the top of the loop and ask for the code again
				console.log("The 2 factor authentication code entered was incorrect. Please check your 2 factor authentication code for accuracy and try again.");
				
				// reload the page to delete the inputs that were already entered in the 2 factor authentication code field
				await page.reload();
				
				// go back to the start of the loop
				continue;
			} 
			
			// check the page for a warning that says "you are doing that too much. try again in X minutes. (usually 3 or 6)"
			let checkForTooMuchWarningAuth = await page.$x("//span[contains(text(), 'you are doing that too much')]");
			// check to see if the wrong code has been entered too many times
			if (checkForTooMuchWarningAuth.length > 0) {
				// if the wrong code was entered too many times, start back at the top of the loop and ask for the access code again
				console.log("You are trying to log in too much. Wait a while then try again.");
				
				// reload the page to delete the inputs that were already entered in the access code field
				await page.reload();
				
				// go back to the start of the loop
				continue;
			}

			// check the page for a warning that says "Your session has expired. Please refresh the page and try again."
			let checkForExpiredSession = await page.$x("//span[contains(text(), 'Your session has expired')]");
			// check to see if the session has expired
			if (checkForExpiredSession.length > 0) {
				// if the session expired, reload the page to try again
				console.log("The session has expired due to waiting too long to enter the code. Reloading the page to try again.");
				
				// reload the page to delete the inputs that were already entered in the access code field
				await page.reload();
				
				// go back to the start of the loop
				continue;
			}
			
			// check the page for a warning that says "The verification code you entered is not valid"
			let checkForNotValidCode = await page.$x("//div[contains(text(), 'The verification code you entered is not valid')]");
			// check to see if the code entered was valid
			if (checkForNotValidCode.length > 0) {
				// if the code entered was wrong, reload the page to try again
				console.log("The 2 factor authentication code you entered was incorrect. Please check your code for accuracy and try again.");
				
				// reload the page to delete the inputs that were already entered in the access code field
				await page.reload();
				
				// go back to the start of the loop
				continue;
			}
			console.log("Two factor authorizaton code entered successfully.");
			
			// if you successfully entered the access code, leave this loop so you can move to the next part of the program
			break;
		}		
		
	} else {
		
		console.log("This account does not use 2 factor authentication. Proceeding to login page.");
		await delaySeconds(2);

	}
	
	// reload the page just in case of a bug that makes it look like you aren't logged in after you just logged in
	await page.reload();
			
	console.log("Successfully logged in to Reddit with the provided Username and Password.");
	console.log("...Loading for 11 seconds...");
	
	// wait 11 seconds, just in case you have the "you are already logged in, redirecting you" screen
	await delaySeconds(11);
	
	//******************************************************************************//
	//         CHECK IF THE USER IS USING THE NEW OR OLD VERSION OF REDDIT          //
	//******************************************************************************//
	
	// the new version of Reddit has a button at the top with a quicklink to the popular page. It is an a tag with an id of 'header-quicklinks-popular'
	// We will check for that link to see if the user has the new or old version of reddit
	
	let checkForNewVersion = await page.$x("//a[contains(@id,'header-quicklinks-popular')]");
	
	//******************************************************************************//
	//     USERS OF THE NEW REDDIT WILL TEMPORARILY SWITCH TO THE OLD VERSION       //
	//******************************************************************************//
	
	// if the quicklink to popular page link is found that means it is the new version of Reddit, so we will run the code below
	if (checkForNewVersion.length > 0) {
		console.log("This reddit account is using the new version of Reddit.");
		
		// We are going to switch to the old version of Reddit, so go to the user settings page
		await page.goto('https://www.reddit.com/settings', {waitUntil: 'networkidle2'});
		
		console.log("Navigated to the settings page.");
		
		await delaySeconds(3);
		
		// test to find the opt out of the redesign option. If the opt out of the redesign option is not found within 3 seconds, fail this test
		Promise.race([page.waitFor('._2HkX3D1t3uo8khrlDewaew ._1oREjd5ToMFah-VfX5Zt1z button', {visible: true}), new Promise(s => setTimeout(s, 5000))]);
		
		// click on the option to temporarily opt out of the redesign because it is easier to delete posts in the old version of Reddit
		await page.click('._2HkX3D1t3uo8khrlDewaew ._1oREjd5ToMFah-VfX5Zt1z button', {delay: 250});
		
		console.log("Temporarily switching to the old Reddit. Don't worry, we'll switch back after.");
		
		await delaySeconds(2);
		
		// click on the OPT OUT button
		await page.click('button.Ch-0dFLxLOtcc6xCyQvsk', {delay: 250});
		
		// wait 3 seconds to see allow user's personal reddit page to fully load
		await delaySeconds(3);
		
	// if the back to top box is not found, it means it is the old version of reddit
	} else {
		console.log("This reddit account is using the old version of Reddit.");
	}
	
	// once we are on the old version of reddit (whether they were there originally or not) run the code below
	
	//******************************************************************************//
	//      THIS IS THE PART OF THE CODE WHERE THE DELETING ACTUALLY HAPPENS        //
	//******************************************************************************//
	
	// wait 3 seconds to allow the username to load
	await delaySeconds(3);
	
	// Check to see if any plugins need to be updated
	let checkForUsername = await page.$x('//span[@class="user"]');

	if (checkForUsername.length > 0) {

		// click on the user profile if it is the old reddit
		await page.click('span.user a', {delay: 250});
	
		console.log("Navigated to the user profile page.");

	} else {

		console.log("Unable to find the profile page link - now the program will crash.");

	}
	
	// wait 3 seconds to see allow user's personal reddit page to fully load
	await delaySeconds(3);
	
	// check to see if there is a next button at the bottom of the page
	let checkForNextButton = await page.$x("//a[contains(text(), 'next ›')]");
	
	// check to see if there are any posts on the user page (there will be none if the user never posted)
	let containsDeleteButtons = await page.$$('[data-event-action="delete"]');
	
	// if the user has posted before there will be at least one delete button found on the page
	if (containsDeleteButtons.length > 0) {
		// count the number of delete buttons on the page (users can have a maximum of 10, 25, 50 or 100 per page)
		let numberOfDeleteButtons = (await page.$$('[data-event-action="delete"]')).length;
		
		// make a variable with 1 number higher than the number of delete buttons to use for our loop
		let numberOfDeleteButtonsPlusOne = numberOfDeleteButtons + 1;
		
		// reload the page before we begin because that makes me feel better
		await page.reload();
		
		// create a variable that tells what number post was just deleted
		let deleteCount = 1;
		
		// create a loop to delete all posts found
		let deleteButtonsFound;
		
		// while there are still delete buttons found on the page, run this loop
		for (deleteButtonsFound = 0; numberOfDeleteButtons != 0; deleteButtonsFound++) {
			await delaySeconds(1);
			
			// simulate clicking on the delete button with javascript
			let firstDeleteButtonSelector = 'form.del-button > span.option > a.togglebutton';
			let firstDeleteButtonElement = await page.$(firstDeleteButtonSelector);
			await page.evaluate(e => e.click(), firstDeleteButtonElement);
			
			await delaySeconds(1);
			
			// test to find the yes option. If the yes option is not found within 5 seconds, fail this test
			Promise.race([page.waitFor('form.del-button > span.option.error.active > a.yes', {visible: true}), new Promise(r => setTimeout(r, 5000))]);
			
			// simulate clicking on the yes option with javascript
			let firstYesButtonSelector = 'form.del-button > span.option.error.active > a.yes';
			let firstYesButtonElement = await page.$(firstYesButtonSelector);
			await page.evaluate(f => f.click(), firstYesButtonElement);
			
			await delaySeconds(1);
			
			// reload the page to avoid an error message or other problems
			await page.reload();
			
			console.log("Deleted post #" + deleteCount);
			
			// increase the delete count by 1
			deleteCount++;
			
			// count the number of delete buttons on the page after deleting the last post
			let numberOfDeleteButtons = (await page.$$('[data-event-action="delete"]')).length;
			
			// if there are now zero delete buttons on the page, break out of the loop
			if (numberOfDeleteButtons == 0) {
				break;
			// if there are still delete buttons on the page, delete the next post
			} else {
				continue;
			}
		}
		console.log("All Reddit posts that were found were deleted.");
	}
	// if no posts are found that can be deleted on page 1, that means the user has never posted, so spit out a message saying that
	else {
		console.log("This account has no posts to delete. Try creating some posts on Reddit first before running this program.");
	}
	
	//******************************************************************************//
	//        SWITCH BACK TO THE NEW REDDIT IF THE USER WAS USING IT BEFORE         //
	//******************************************************************************//
		
	// if the user previously was using the new version of Reddit we will switch back to the new version before closing the program
	if (checkForNewVersion.length > 0) {
		// if the user was using the new version before deleting their posts, go to the preferences page to switch back
		await page.goto('https://www.reddit.com/prefs/', {waitUntil: 'networkidle2'});
		
		await delaySeconds(1);
		
		// click on the box that says 'Use new Reddit as my default experience'		
		await page.click('form.prefoptions tr:nth-child(13) td.prefright input#in_redesign_beta', {delay: 250});
		
		await delaySeconds(1);
		
		// click on the save options button
		await page.click('input.save-preferences', {delay: 250});
		
		console.log("Switched back to the new Reddit.");
		
		await delaySeconds(2);
	}
		
	console.log("Program complete. Closing out of Puppeteer and exiting the program.");
	
    	await page.close();
    	await browser.close();
	
	//the function below closes the program after 5 seconds, just in case the program refuses to close
	setTimeout((function() {  
		return process.exit(1);
	}), 5000);
}

run();
