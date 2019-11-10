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
		
		// check to see if the user does not exist
		if (checkForIncorrectUserOrPass.length > 0) {
			// if the user does not exist, start back at the top of the loop and ask for the username and password again
			console.log("That username or password is incorrect. Please check your username and password for accuracy and try again.");
			
			// reload the page to delete the inputs that were already entered in the username and password field
			await page.reload();
			
			// go back to the start of the loop
			continue;
		} 
		
		// check the page for a warning that says "you are doing that too much. try again in X minutes. (usually 3 or 6)"
		let checkForTooMuchWarning = await page.$x("//span[contains(text(), 'you are doing that too much')]");
		// check to see if the user does not exist
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
		// check to see if the user exists
		if (checkForErrorSendingYourRequest.length > 0) {
			// close the program and tell the user to start the program over
			console.log("Your password was incorrect. Please check your password for accuracy and try again.");
			
			// reload the page to delete the inputs that were already entered in the username and password field
			await page.reload();
			
			// go back to the start of the loop
			continue;
		}		
		// if you successfully signed in, leave this loop so you can move to the next part of the program
		break;
	}
	
	await delaySeconds(1);
	
	// reload the page just in case of a bug that makes it look like you aren't logged in after you just logged in
	await page.reload();
	
	console.log("Successfully logged in to Reddit with the provided Username and Password.");
	
	// wait 11 seconds, just in case you have the "you are already logged in, redirecting you" screen
	await delaySeconds(11);
	
	//******************************************************************************//
	//         CHECK IF THE USER IS USING THE NEW OR OLD VERSION OF REDDIT          //
	//******************************************************************************//
	
	// the new version of Reddit has a button that says "back to top" on all homepages. The old version doesn't. That is how we will tell the difference.
	let checkForNewBox = await page.$x("//button[contains(text(), 'back to top')]");
	
	//******************************************************************************//
	//     USERS OF THE NEW REDDIT WILL TEMPORARILY SWITCH TO THE OLD VERSION       //
	//******************************************************************************//
	
	// if the back to top box is found that means it is the new version of Reddit, so we will run the code below
	if (checkForNewBox.length > 0) {
		console.log("This reddit account is using the new version of Reddit.");
		
		// We are going to switch to the old version of Reddit, so click on the user profile dropdown
		await page.click('#USER_DROPDOWN_ID', {delay: 250});
		
		await delaySeconds(1);
		
		// click on the link to go to the settings page
		await page.click('a.s11l4hu4-2.hUWSuD:nth-child(3)', {delay: 250});
		
		console.log("Navigated to the settings page.");
		
		await delaySeconds(5);
		
		// test to find the opt out of the redesign option. If the opt out of the redesign option is not found within 5 seconds, fail this test
		Promise.race([page.waitFor('.igup49-5.bIQCbu:nth-of-type(6) button.nUcKP', {visible: true}), new Promise(s => setTimeout(s, 5000))]);
		
		// click on the option to temporarily opt out of the redesign because it is easier to delete posts in the old version of Reddit
		await page.click('.igup49-5.bIQCbu:nth-of-type(6) button.nUcKP', {delay: 250});
		
		console.log("Temporarily switching to the old Reddit. Don't worry, we'll switch back after.");
		
		await delaySeconds(2);
		
		// click on the OPT OUT button
		await page.click('button.s1oehqdu-4.gANuJQ', {delay: 250});
		
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
	if (checkForNewBox.length > 0) {
		// if the user was using the new version before deleting their posts, click on the preferences button at the top to switch back
		await page.click('a.pref-lang.choice', {delay: 250});
		
		await delaySeconds(1);
		
		// click on the box that says 'Use the redesign as my default experience'		
		await page.click('form.prefoptions tr:nth-child(12) input[type=checkbox]:nth-of-type(2)', {delay: 250});
		
		await delaySeconds(1);
		
		//let newRedditSelector = 'input[name="in_redesign_beta"]';
		// use this evaluate property because this is an input box instead of a normal selector (like <a>, or <button>)
		//await page.evaluate((selector) => document.querySelector(selector).click(), selector);
		
		// click on the save options button
		await page.click('input.btn.save-preferences', {delay: 250});
		
		console.log("Switched back to the new Reddit.");
		
		await delaySeconds(3);
		
		// click on the user profile dropdown if it is the new reddit
		await page.click('#USER_DROPDOWN_ID', {delay: 250});
		
		await delaySeconds(1);
		
		// click on the link to go to the user profile page
		await page.click('a.s11l4hu4-2.hUWSuD:nth-of-type(1)', {delay: 250});
		
		await delaySeconds(5);
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
