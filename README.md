# CIS 3500: Lunch Lotto Starter

## Overview
This assignment involves enhancing a Chrome extension developed by one of the Top 3 winners of the MCIT hackathon. The project provides hands-on experience in web development, API integration, and collaborative coding.

**Original project:** [Lunch Lotto](https://github.com/jessie-sr/lunch-lotto)

## Project Description
Lunch Lotto is a Chrome extension that helps users decide where to eat by randomly selecting nearby restaurants. Your task is to enhance this extension by implementing new features.

## Enhancements I made

# History

I added a button on the top left corner with an image icon that represents the history. It uses `chrome.storage.local` to store all previous resturants fetched with their Google Maps link and the time of the fetch, and displays it in an organized manner inside the popup window. There is also an option to clear your history.

# Loading bar
I added a progress bar to visually indicate the loading process when fetching nearby restaurants. The bar appears below the loading GIF and gradually fills as the data is retrieved, simulating progress using timed intervals. Key checkpoints update the bar to reflect different stages of the fetch and processing pipeline, culminating at 100% when the restaurant options are ready and the wheel is displayed. This provides users with a clearer sense of activity and loading status during the fetch operation.

## Important notes from developer
For setup:
1. Copy `config.example.js` to `config.js`
2. Replace `"YOUR_API_KEY_HERE"` with your actual Google Maps API key