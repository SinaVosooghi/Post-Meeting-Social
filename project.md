
Paid Challenge - Sept 5, 2025
This app will be very challenging to build in 48 hours. It’s very unlikely someone could build this without extensive use of AI, so make sure you are using AI to help as much as possible! I recommend using Cursor with a Pro subscription. Do not have other people help you. If other people help, the submission will not be accepted.
When finished, please respond with a link to your repo and a link to your fully deployed and working app. If you submit a working app that meets all the requirements below perfectly, on time, I will pay you $3000. If hired, you’ll build this feature for our users!
Please build a “Post-meeting social media content generator”. An advisor has a meeting with a client, the app uses the meeting transcript and AI to generate a suggestion for a social media post, and then allows the advisor to click a button to post it to their social media accounts.
I can log in with Google and it pulls in my google calendar
add webshookeng@gmail.com as an oauth test user
I can connect multiple google accounts and it pulls in the events from all of their calendars
I should be able to see the upcoming calendar events in the app and toggle a switch on whether or not I want a notetaker to attend that meeting
The app uses recall.ai to send a notetaker to the meetings on my calendar
https://docs.recall.ai/docs/quickstart
API key will be in the email we send when the challenge starts
When I connect my calendar or add an event to my calendar, the app should look for a zoom link somewhere in the calendar event and then make sure a recall bot joins the meeting a configurable (in settings) number of minutes before it starts
This account/api-key will be shared with everyone doing the challenge, so keep track of the bot ids that you create and only use or read those bot ids. Don’t use the /bots endpoint.
Recall normally sends webhooks after a call letting you know media is available, but because it’s a shared account, you’ll need to use polling to regularly check on your bot ids to see if their media is available
After the meeting, the meeting appears in the app in a list of past meetings
Each meeting should show attendees, start time, a logo for platform of the call (zoom, microsoft teams, google meet)
I can click on past meetings and:
View the full transcript of the meeting
View an AI-generated draft follow-up email (recaps what was talked about in the meeting)
Show a list of social media posts created by my configured automations for this meeting (see below)
View a draft the AI-generated social media post. Here’s an example:

Have a “Copy” button like the screenshot
Instead of “Save” like that screenshot, there should be a “Post” button where when I click it, it posts to the configured social media platform as me.
Have a settings page where I can connect my LinkedIn and Facebook accounts via OAuth and configure how many minutes before a meeting the bot joins
Allow me to configure how the post is generated. I should be able to add “Automations” which could include generating marketing content, and I can create one for linkedin and one for facebook.

Once completed, please reply to this Polymer email with the url to the repo. 
Submissions must be made before 7am America/Denver Sunday, September 7, 2025.
If you don’t quite finish, submit anyway on time. If no one finishes, I may still hire the best submission and pay that person $3,000.
Good luck!
The Jump Hiring Team
